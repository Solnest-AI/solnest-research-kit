// Shared helpers for the Solnest AI MCP dependency kits.
// Rule: nothing in this folder ever prints a key value. Only "filled" / "empty".
// Standard library only. Works on Mac, Windows (native Node, called from Git Bash) and Linux.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENV_FILE = path.join(KIT, '.env');
export const CACHE = path.join(KIT, '.cache');
export const IS_WIN = process.platform === 'win32';

// kit.json describes every tool in this kit. Tool kinds:
//   oauth      vendor's hosted server, browser sign-in, no key anywhere.
//   http-key   hosted server that needs a key header. Claude Code runs
//              scripts/mcp-headers.mjs at connect time, which reads .env.
//   stdio-key  local server. Claude Code starts scripts/run-mcp.mjs, which reads .env
//              and starts the real server with the key in that server's environment only.
//   handoff    a bundled sub-kit with its own setup (folder), checked by server name.
//   script     a local helper script, no MCP (for example Wise).
//   cli        a command line tool the skills call (for example the GitHub CLI).
export function loadKit() {
  const raw = JSON.parse(fs.readFileSync(path.join(KIT, 'kit.json'), 'utf8'));
  for (const t of raw.tools) {
    t.server = t.server || t.id;
    t.names = (t.names || [t.server]).map((n) => n.toLowerCase());
    t.keys = t.keys || [];
  }
  return raw;
}

export function toolById(kit, id) {
  return kit.tools.find((t) => t.id === id) || null;
}

export function loadEnv(file = ENV_FILE) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  let text = fs.readFileSync(file, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // Windows Notepad BOM
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice(7).trim();
    const i = line.indexOf('=');
    if (i < 1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

// Which tools the member picked (KIT_TOOLS in .env). Null means "not decided yet".
export function chosenTools(env) {
  if (!env.KIT_TOOLS) return null;
  return env.KIT_TOOLS.split(',').map((s) => s.trim()).filter(Boolean);
}

export function missingKeys(tool, env = loadEnv(), { keyMode = false } = {}) {
  const spec = keyMode && tool.keyMode ? tool.keyMode : tool;
  const need = [...(spec.keys || [])];
  if (spec.urlFromEnv && (tool.kind !== 'oauth' || keyMode)) need.push(spec.urlFromEnv);
  return need.filter((k) => !env[k]);
}

// ${VAR} placeholders are filled from .env. {KIT} is this folder.
export function fill(template, env) {
  return String(template)
    .replace(/\{KIT\}/g, KIT)
    .replace(/\$\{([A-Z0-9_]+)\}/g, (_, k) => env[k] || '');
}

export function venvPython(rel) {
  const dir = path.join(KIT, rel, '.venv');
  return IS_WIN ? path.join(dir, 'Scripts', 'python.exe') : path.join(dir, 'bin', 'python');
}

function versionKey(dir) {
  return path.basename(dir).split('.').map((n) => n.padStart(6, '0')).join('.');
}

function newestBundled(base, exe) {
  try {
    const dirs = fs.readdirSync(base).map((d) => path.join(base, d))
      .filter((d) => fs.existsSync(path.join(d, exe)))
      .sort((a, b) => (versionKey(a) < versionKey(b) ? 1 : -1));
    return dirs.length ? path.join(dirs[0], exe) : null;
  } catch { return null; }
}

// Find a `claude` binary: PATH first, then the copy the desktop app ships with.
export function findClaude() {
  const probe = spawnSync(IS_WIN ? 'where' : 'which', ['claude'], { encoding: 'utf8' });
  if (probe.status === 0 && probe.stdout.trim()) return probe.stdout.trim().split(/\r?\n/)[0];
  const home = os.homedir();
  const candidates = [];
  if (process.platform === 'darwin') {
    candidates.push(newestBundled(path.join(home, 'Library', 'Application Support', 'Claude', 'claude-code'), 'claude'));
  }
  if (IS_WIN) {
    const appdata = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const local = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    candidates.push(newestBundled(path.join(appdata, 'Claude', 'claude-code'), 'claude.exe'));
    try {
      for (const pkg of fs.readdirSync(path.join(local, 'Packages')).filter((d) => d.startsWith('Claude'))) {
        candidates.push(newestBundled(path.join(local, 'Packages', pkg, 'LocalCache', 'Roaming', 'Claude', 'claude-code'), 'claude.exe'));
      }
    } catch { /* no Packages dir */ }
    candidates.push(path.join(home, '.local', 'bin', 'claude.exe'));
  } else {
    candidates.push(path.join(home, '.local', 'bin', 'claude'));
  }
  return candidates.find((c) => c && fs.existsSync(c)) || null;
}

export function nodeCommand() {
  // Use plain `node` when it is on PATH (the same PATH Claude Code launches servers from).
  // Fall back to this process's absolute node path.
  const probe = spawnSync(IS_WIN ? 'where' : 'which', ['node'], { encoding: 'utf8' });
  return probe.status === 0 ? 'node' : process.execPath;
}

// Lines of a small "name|value" cache file in .cache/.
export function readCache(name) {
  const f = path.join(CACHE, name);
  if (!fs.existsSync(f)) return {};
  const out = {};
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('|');
    if (i > 0) out[line.slice(0, i)] = line.slice(i + 1);
  }
  return out;
}

export function writeCache(name, obj) {
  fs.mkdirSync(CACHE, { recursive: true });
  const body = Object.entries(obj).map(([k, v]) => `${k}|${v}`).join('\n');
  fs.writeFileSync(path.join(CACHE, name), body ? body + '\n' : '');
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
