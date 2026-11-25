"""scripts/update.py: installs only a published release into the kit folder, keeps the
member's keys (.env), the scoreboard's memory (.cache/), bin/ and their own files, and
--undo puts the old version back. Offline: releases are read from a local folder
(RESEARCH_KIT_RELEASE_DIR)."""
import io
import os
import pathlib
import sys
import tarfile
import tempfile
import unittest
from unittest import mock

SCRIPTS = pathlib.Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS))

import update  # noqa: E402

FAKE_ENV = "KIT_TOOLS=firecrawl,exa\nFIRECRAWL_API_KEY=fake_test_" + "0" * 24 + "\n"   # made up, never a real key
KIT_JSON = '{"kit": "research-kit", "tools": [{"id": "exa", "connector": "connectors/exa.md"}]}\n'


def tarball(folder, version, files, top=None):
    """A GitHub-style source tarball: one top folder, the kit at its root."""
    top = top or f"solnest-research-kit-{version}"
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        def add(rel, data):
            info = tarfile.TarInfo(f"{top}/{rel}")
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
        add("VERSION", f"{version}\n".encode())
        for rel, text in files.items():
            add(rel, text.encode())
    (pathlib.Path(folder) / f"v{version}.tar.gz").write_bytes(buf.getvalue())


class UpdateTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = pathlib.Path(self.tmp.name)
        self.rel = base / "releases"
        self.rel.mkdir()
        self.root = base / "solnest" / "research-kit"
        self.root.mkdir(parents=True)
        env = mock.patch.dict(os.environ, {update.LOCAL_RELEASES: str(self.rel)})
        env.start()
        self.addCleanup(env.stop)
        self.addCleanup(self.tmp.cleanup)
        old = {"kit.json": KIT_JSON, "CLAUDE.md": "old conductor\n", "connectors/exa.md": "old exa\n",
               "scripts/lib.mjs": "export const a = 1;\n", "scripts/dropped.mjs": "// gone next\n",
               ".env.example": "EXA_API_KEY=\n"}
        tarball(self.rel, "1.0.0", old)
        for rel, text in old.items():
            (self.root / rel).parent.mkdir(parents=True, exist_ok=True)
            (self.root / rel).write_text(text, encoding="utf-8")
        (self.root / "VERSION").write_text("1.0.0\n", encoding="utf-8")
        # the member's own things
        (self.root / ".env").write_text(FAKE_ENV, encoding="utf-8")
        (self.root / ".cache").mkdir()
        (self.root / ".cache" / "live-ok").write_text("apify|2026-01-01\n", encoding="utf-8")
        (self.root / "bin").mkdir()
        (self.root / "bin" / "py").write_text("fake launcher\n", encoding="utf-8")
        (self.root / "my-notes.md").write_text("mine\n", encoding="utf-8")
        (self.root / "connectors" / "my-tool.md").write_text("mine too\n", encoding="utf-8")

    def _new_release(self):
        tarball(self.rel, "1.1.0", {"kit.json": KIT_JSON, "CLAUDE.md": "new conductor\n", "connectors/exa.md": "new exa\n",
                                    "scripts/lib.mjs": "export const a = 2;\n", "scripts/new.mjs": "// brand new\n",
                                    ".env.example": "EXA_API_KEY=\nNEW_KEY=\n",
                                    "bin/py": "release must not win\n", ".env": "EVIL=from_release\n",
                                    ".cache/live-ok": "evil\n"})

    def _member_files_intact(self):
        self.assertEqual((self.root / ".env").read_text(), FAKE_ENV)
        self.assertEqual((self.root / ".cache" / "live-ok").read_text(), "apify|2026-01-01\n")
        self.assertEqual((self.root / "bin" / "py").read_text(), "fake launcher\n")
        self.assertEqual((self.root / "my-notes.md").read_text(), "mine\n")
        self.assertEqual((self.root / "connectors" / "my-tool.md").read_text(), "mine too\n")

    def test_update_keeps_member_files_and_undo_goes_back(self):
        self._new_release()
        r = update.update(self.root)
        self.assertEqual(r["status"], "updated")
        self.assertEqual((self.root / "VERSION").read_text().strip(), "1.1.0")
        self.assertEqual((self.root / "CLAUDE.md").read_text(), "new conductor\n")
        self.assertEqual((self.root / ".env.example").read_text(), "EXA_API_KEY=\nNEW_KEY=\n")   # a kit file
        self.assertTrue((self.root / "scripts" / "new.mjs").is_file())
        self.assertFalse((self.root / "scripts" / "dropped.mjs").exists())   # shipped by 1.0.0, not 1.1.0
        self._member_files_intact()
        self.assertEqual(update.update(self.root)["status"], "current")

        update.undo(self.root)
        self.assertEqual((self.root / "VERSION").read_text().strip(), "1.0.0")
        self.assertEqual((self.root / "CLAUDE.md").read_text(), "old conductor\n")
        self.assertTrue((self.root / "scripts" / "dropped.mjs").is_file())
        self.assertFalse((self.root / "scripts" / "new.mjs").exists())
        self.assertFalse((self.root / update.BACKUP_DIR).exists())
        self._member_files_intact()

    def test_manifest_lists_what_shipped_and_removal_follows_it(self):
        self._new_release()
        update.update(self.root)
        listed = set(update.load_manifest(self.root))
        self.assertEqual(listed, {"VERSION", "kit.json", "CLAUDE.md", "connectors/exa.md", "scripts/lib.mjs",
                                  "scripts/new.mjs", ".env.example"})
        # the next release drops scripts/new.mjs: the manifest is what gets it removed
        tarball(self.rel, "1.2.0", {"kit.json": KIT_JSON, "CLAUDE.md": "newer\n", "connectors/exa.md": "newer exa\n",
                                    "scripts/lib.mjs": "export const a = 3;\n", ".env.example": "EXA_API_KEY=\n"})
        r = update.update(self.root)
        self.assertEqual(r["removed"], ["scripts/new.mjs"])
        self.assertFalse((self.root / "scripts" / "new.mjs").exists())
        self._member_files_intact()

    def test_edited_kit_file_is_reported_and_saved(self):
        (self.root / "CLAUDE.md").write_text("the member edited this\n", encoding="utf-8")
        self._new_release()
        r = update.update(self.root)
        self.assertIn("CLAUDE.md", r["edited"])
        self.assertEqual((pathlib.Path(r["backup"]) / "CLAUDE.md").read_text(), "the member edited this\n")

    def test_protected_paths(self):
        want = {".env": True, "sub/.env": True, ".env.local": True, ".env.example": False, "keys.env": True,
                ".cache/needs-restart": True, "bin/py": True, "credentials/x.json": True, "tokens.json": True,
                "a.token": True, "vendor/x/index.js": True, "node_modules/a.js": True,
                ".update-backup/1/undo.json": True, update.MANIFEST: True,
                "kit.json": False, "CLAUDE.md": False, "connectors/exa.md": False, "scripts/update.py": False}
        for rel, protected in want.items():
            self.assertEqual(update._protected(rel), protected, rel)

    def test_refuses_a_git_checkout(self):
        (self.root / ".git").mkdir()
        self._new_release()
        with self.assertRaises(update.UpdateError):
            update.update(self.root)
        self.assertEqual((self.root / "VERSION").read_text().strip(), "1.0.0")

    def test_unsafe_release_changes_nothing(self):
        buf = io.BytesIO()
        with tarfile.open(fileobj=buf, mode="w:gz") as tar:
            for name in ("top/VERSION", "../evil"):
                info = tarfile.TarInfo(name)
                info.size = 1
                tar.addfile(info, io.BytesIO(b"x"))
        (self.rel / "v1.1.0.tar.gz").write_bytes(buf.getvalue())
        with self.assertRaises(update.UpdateError):
            update.update(self.root)
        self.assertEqual((self.root / "VERSION").read_text().strip(), "1.0.0")
        self.assertEqual((self.root / "CLAUDE.md").read_text(), "old conductor\n")

    def test_mislabelled_release_is_refused(self):
        tarball(self.rel, "1.1.0", {"kit.json": KIT_JSON})
        blob = (self.rel / "v1.1.0.tar.gz").read_bytes()
        (self.rel / "v1.1.0.tar.gz").unlink()
        (self.rel / "v1.3.0.tar.gz").write_bytes(blob)     # tag says 1.3.0, VERSION inside says 1.1.0
        with self.assertRaises(update.UpdateError):
            update.update(self.root)
        self.assertEqual((self.root / "VERSION").read_text().strip(), "1.0.0")

    def test_no_release_yet_is_a_plain_error(self):
        for p in self.rel.glob("*"):
            p.unlink()
        with self.assertRaises(update.UpdateError):
            update.update(self.root)

    def test_after_passes_on_good_files_and_fails_on_broken_ones(self):
        self.assertIn("1 tools", update.after(self.root))
        (self.root / "kit.json").write_text("{not json", encoding="utf-8")
        with self.assertRaises(update.UpdateError):
            update.after(self.root)
        (self.root / "kit.json").write_text(KIT_JSON, encoding="utf-8")
        (self.root / "connectors" / "exa.md").unlink()
        with self.assertRaises(update.UpdateError):
            update.after(self.root)

    def test_the_real_kit_passes_after(self):
        self.assertIn("tools in kit.json", update.after(SCRIPTS.parent))


if __name__ == "__main__":
    unittest.main()
