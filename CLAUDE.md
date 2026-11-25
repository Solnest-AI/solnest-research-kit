If the user said 'set this up', follow SETUP below.
If the user said "connect <tool>" (one or more tools), do SETUP steps 1 to 3 quickly, then step 5 for just those tools.
If the user said "check my connections", run the scoreboard (CHECK).
If the user said "remove <tool>" or "disconnect <tool>", run REMOVE.
If the user said "update the research kit", run UPDATE.

# Research Kit (Solnest AI): the conductor

This kit connects the tools behind Solnest's research skills in one guided setup: Firecrawl, Brave Search, Exa and Tavily for web search, Apify for Reddit and other scrapers, GitHub (the MCP and the `gh` command line) for repos, code and discussions.

`KIT` below means the kit's permanent home on this computer: `~/solnest/research-kit` (the same path works on Mac and in Windows Git Bash). SETUP step 2 puts the kit there. Run every command yourself with the Bash tool, starting with `cd ~/solnest/research-kit`. On Windows the Bash tool is Git Bash and every command below works there unchanged (the helpers are Node scripts, not shell). The member never opens a terminal.

## Your own changes (read first, every time)

Before anything else, read `~/.solnest/research-kit/my-instructions.md` if it exists and
follow it. It holds this user's own changes to how this tool works, and it wins over the
defaults in this file.

When the user asks to change how this tool works for them (wording, tone, topics, steps,
defaults, what to include or leave out), write the change into that file in plain words,
create it if needed, and read it back to them. **Never edit this tool's own files for
that.** This tool updates itself automatically and replaces its own files, so a change
made there is lost on the next update. Their keys and tool picks (`.env`), the scoreboard's memory (`.cache/`), any file they added
to the kit folder, and the connections registered in Claude Code are never touched by an
update either.

## Hard rules

1. **Never ask for a key, token or secret in the chat.** Keys go in `KIT/.env`, which you create and open; the member pastes and saves. Never read `.env` with cat, Read, grep or echo, and never print a value. `node scripts/check-env.mjs` says filled or empty, nothing more. If a key lands in the chat anyway: one line, no lecture. Tell them to delete that key at the vendor, make a new one, and paste the new one into the file.
2. Never use your Edit or Write tools to put a value into `.env`. `scripts/make-env.mjs` builds it, `scripts/discover-keys.mjs` copies keys the member already has, and the member pastes the rest.
3. **Read-only by default.** Before any tool call that creates, edits, sends, deletes, publishes, runs a scraper or workflow, changes a budget or spends money: say exactly what will happen and wait for a plain "yes" in the chat. One yes can cover a batch you showed together. No typed codes, no approval rituals.
4. Use only the install method in each connector file. Do not swap in npm packages from memory or from older lessons.
5. Never edit `~/.claude.json` by hand and never print it. Never run `claude mcp get` (it can print a secret). Register only through `node scripts/register.mjs`.
6. Never commit, push, fork or publish the kit folder. When the member says "save", everything is already saved on disk.
7. Write to the member in plain, friendly sentences, one step per message. Casual Solnest voice. No em-dash characters.
8. A connection is not "working" until a read-only call has returned real data. "Registered" and "connected" in a list only mean the server started.

## The tools in this kit

| Say | Tool id | How it connects | Connector file | Skills that need it |
|---|---|---|---|---|
| Firecrawl | `firecrawl` | API key | `connectors/firecrawl.md` | deep-internet-research, ad-library-research |
| Brave | `brave-search` | API key | `connectors/brave-search.md` | deep-internet-research |
| Exa | `exa` | API key | `connectors/exa.md` | deep-internet-research |
| Tavily | `tavily` | API key | `connectors/tavily.md` | deep-internet-research |
| Apify | `apify` | browser sign-in | `connectors/apify.md` | deep-internet-research, reddit-search, ad-library-research |
| GitHub | `github` | token (read-only by default) | `connectors/github.md` | deep-internet-research (optional) |
| GitHub CLI | `gh` | its own browser login | `connectors/gh.md` | deep-internet-research |

Shared sign-in steps: `connectors/_how-sign-in-works.md`.

## Kit notes

- **Server names are a contract.** The deep research skill calls `firecrawl`, `brave-search`, `exa` and `tavily` by exactly those names. Never register them under other names.
- **Apify has two parts.** The Apify MCP is a browser sign-in. The Reddit scraper bundled inside `deep-internet-research` and `reddit-search` is a script that reads `APIFY_TOKEN` from the skill's own `.env`. If they use either skill, fill the optional `APIFY_TOKEN` line, test it with `node scripts/test-key.mjs apify`, then run `node scripts/share-keys.mjs --apply`: it copies the token into those skills' `.env` files (only skills already installed, only blank lines, names printed, never values).
- **The deep-internet-research kit used to register these four servers with the key inside Claude Code's config.** If they ran it, the scoreboard shows those rows ✅ ("already set up"): leave them alone. This kit's way keeps keys in `.env` only, but a working server is a working server.

# SETUP

## 1. Say hello (its own message, before any command)

Keep the shape and the length, adapt the words:

> Hey, welcome to the Research Kit from the Solnest AI Skool community. This wires up the tools behind deep-internet-research, reddit-search and ad-library-research in one go, so those skills just work.
>
> Here's how it goes: I put the kit in its own folder on this computer and check a couple of things, ask which of these tools you use, build one small file with a line for each key you'll need (only your tools), look for keys you already have from other kits, then connect them one at a time and test each one for real.
>
> Four of these use a key (Firecrawl, Brave, Exa, Tavily), Apify uses a browser sign-in, and GitHub is a token plus the GitHub command line. Most have a free tier; a research run costs a few cents.
>
> One rule the whole way: keys go in the file I open for you, never in this chat. Ready? Let me check this computer first.

On a re-run (`.env` already has `KIT_TOOLS=`), skip this and say one line: "Welcome back. Let me check where things stand."

## 2. Install the kit and check this computer (once)

Run one of these:

- You are reading this from the GitHub page (no local copy of this repo):

  ```bash
  bash -o pipefail -c "curl -fsSL https://raw.githubusercontent.com/Solnest-AI/solnest-research-kit/main/install.sh | bash"
  ```

- You already have this repo as a folder on this computer: `bash "<that folder>/install.sh"`

The installer copies the kit to `~/solnest/research-kit` (its permanent home: key-based connections read `.env` from that folder every time they start), finds Python 3.9 or newer for the updater (or installs one for this user, no admin rights needed), writes a small launcher (`bin/py`), checks Node.js and starts the read-only scoreboard once. It registers nothing and asks for nothing. Running it again is safe: it keeps `.env`, `.cache/` and every file the member added.

Read the checklist it printed:

- Every line starts with `[ok]`: go on.
- `[!!] Node.js`: **Node.js 18 or newer is required** (every helper here is a Node script). Mac: `brew install node` if `brew --version` works, otherwise send them to https://nodejs.org (LTS installer). Windows: `winget install OpenJS.NodeJS.LTS`. Then they fully quit and reopen Claude Code (a new tool only shows up after a restart) and say "set this up" again.
- `STOP: ... holds a different kit` or `... a link or a git checkout`: something else already lives at `~/solnest/research-kit`. Nothing was changed. Tell the member what you found and ask what they want to do with it. Do not delete it yourself.
- `ERROR: could not download`: usually the network. Run it once more.
- `ERROR: no working Python`: send them to https://www.python.org/downloads/ (on Windows they must tick "Add python.exe to PATH"). When they say it is installed, run it again.
- Any other `[!!]` line: run it once more. If it repeats, send the full output to hello@solnestai.com.

From here on every command runs in the installed kit, never in the copy you downloaded:

```bash
cd ~/solnest/research-kit
uname -s
node scripts/register.mjs --find-claude
gh --version 2>/dev/null || echo NO_GH
```

- `Darwin` is Mac. `MINGW` or `MSYS` is Windows Git Bash.
- `NO_GH` is fine for now: the gh connector file installs it when you get to that row.
- **Desktop app or terminal?** If you have the `session_connectors_status` tool, they are in the Claude Code desktop app: use **Path A** (the Connectors screen) for sign-in tools. Otherwise use **Path B** (`register.mjs`, then `/mcp` > Authenticate).
- `NO_CLAUDE_CLI` is fine for sign-in tools on Path A. Key tools need a `claude` command; `register.mjs` also looks for the copy the desktop app ships with. If none is found, say so and stop for those tools (never edit `~/.claude.json` by hand).
- **The copy you downloaded is not needed any more.** Leave it, or delete it after a plain yes. Never work in it.
- **An older copy of this kit in another folder** (the member says so, or the scoreboard in step 4 shows key tools already connected that the new kit folder never registered): their keys are picked up in step 4. Once each key is in the new `.env` and tested, ask for a plain yes, then run `node scripts/register.mjs <tool> --replace` for each of those key tools so the connection reads from `~/solnest/research-kit`, and do the one restart. After that the old folder can go.

## 3. Ask which tools they use

Show the table above in plain words (tool, what it's for, which skill needs it) and ask which they use. Default: all the ones their skills need. Take whatever they say in one go ("Firecrawl and Exa, skip the rest" means move on). Then build `.env` with only those slots:

```bash
node scripts/make-env.mjs --tools <id,id,id>
```

Re-running it later with a different list is safe: values are carried over, nothing is deleted.

## 4. Look for keys they already have, then the first scoreboard

```bash
node scripts/discover-keys.mjs --apply
node scripts/check-connections.mjs
```

`discover-keys` reads `.env` files from other Solnest kits and earlier setups (Desktop, Documents, Downloads, home, `~/.claude/skills`) and fills only blank lines. It prints names and folders, never values. Tell them what it found in one line. A found key can be stale, so it still gets tested in step 5. If they say "I already have that key somewhere", run it again with `--only <VAR> --extra-dir "<folder they name>"`.

Print the whole scoreboard, never a summary of it. Explain the legend once: ✅ connected, ❌ missing, 🔒 needs a restart, 🔎 sign-in (Claude checks it live), ⚠️ needs a look, ➖ not picked.

**Already connected means skip it.** A tool that shows ✅ (including "already set up as ...", for example GitHub or Apify connected by another kit) is done. Say so in one line and move on. Never register a second copy.

Open `.env` once for them so they never hunt for it, and leave it open:

```bash
node scripts/open-env.mjs
```

## 5. Connect one tool at a time

Default order: Firecrawl, Brave, Exa, Tavily (all keys, one restart for all four), then Apify (sign-in), then GitHub and the gh CLI. It is a default, not a law: if they are already logged in to one vendor, do that one first. For each ❌, 🔎 or ⚠️ row, open its connector file, read it in full, and follow its **Connect** section exactly.

**Key tools** (Firecrawl-style rows that say "missing key"):
1. Give the click path from the connector file for getting the key. They paste it after `NAME=` in the open `.env`, save, and say "saved". Never in the chat.
2. `node scripts/check-env.mjs <tool>` must say FILLED.
3. `node scripts/test-key.mjs <tool>` must say OK. FAIL: read the one-line reason to them and loop back to 1.
4. `node scripts/register.mjs <tool>`. If it says `ALREADY_REGISTERED`, a server with that name exists: run the scoreboard; if that row is ✅, leave it. Only if it is broken, ask (plain yes) and re-run with `--replace`.

**Sign-in tools** (🔎 rows):
- Path A (desktop app): give the 5 click steps from `connectors/_how-sign-in-works.md` with the exact name and URL from the connector file. You cannot click them. Wait for "connected".
- Path B (terminal): `node scripts/register.mjs <tool>`, then they type `/mcp`, pick it, choose Authenticate, finish in the browser, say "done".
- Say any plan gate or admin requirement from the connector file before they start.
- Then run that connector's **Verify** call. Real data back: `node scripts/mark.mjs live-ok <tool>` so the row stays ✅. Tools not in your tool list yet: sign-in tools sometimes only appear in a new chat; ask them to open a new chat in the kit folder and say "check my connections".

**Bundled sub-kits** (rows that say "not set up yet"): follow that connector file. It copies the sub-folder to its permanent home and hands off to the sub-kit's own setup. When the sub-kit is done, come back here and run the scoreboard.

**Batch the restarts.** Register every key tool first, then one restart at the end. Before it, say:
- Quit Claude Code fully (desktop app: quit the app, not just the window) and reopen it.
- Open the kit folder and say "check my connections". Give them the full path to pick: run `cd ~/solnest/research-kit && (pwd -W 2>/dev/null || pwd)` and read it out. (Opening that folder is what makes "check my connections" work, because this file lives there.)

After the restart: in the desktop app call `session_connectors_status`. A server showing `failed` right after a restart is often a cold start (first `npx` download): call `reconnect_session_connector` once, end your turn, check again next turn. When the tools are loaded, run each one's **Verify** call, then `node scripts/mark.mjs restarted` and the scoreboard. On Mac the scoreboard also clears 🔒 on its own once it sees the session started after the registration.

## 6. Turn on automatic updates (required, silent)

Run this exactly:

```bash
KIT="$HOME/solnest/research-kit"; "$KIT/bin/py" "$KIT/scripts/solnest_autoupdate.py" register --name research-kit --folder "$KIT" --update '{python} scripts/update.py' --after '{python} scripts/update.py --after' --undo '{python} scripts/update.py --undo'
```

From now on the kit keeps itself on the latest release with no one asking: once a day, in the background when Claude Code starts, it installs the newest published release and checks that the new files load. It never touches `.env`, `.cache/`, any file the member added, or anything registered in Claude Code, and if a new release fails that check it puts the old version back by itself. Relay the one line it prints. Nothing else to tell them. Do this step even if some tools are still open: it does not depend on them.

## 7. Final scoreboard and the done message

```bash
node scripts/check-connections.mjs
```

Then a short done message in Solnest voice: every ✅ row by the exact label the scoreboard printed, any row still open with its single next step ("add it any time, nothing else waits on it"), and one thing to try per connected tool from its connector's **Try these** list. Then: "Open the `solnest/research-kit` folder in Claude Code and say 'check my connections' any time. The kit keeps itself up to date." Support: hello@solnestai.com.

# CHECK

`node scripts/check-connections.mjs` and print the whole output. It only reads: it never changes anything. Then offer to fix the first ❌ or ⚠️ row by following that connector file.

# REMOVE

Follow the **Remove** section of that tool's connector file. Registered tools: `node scripts/register.mjs <tool> --remove`. Desktop sign-ins: + > Connectors > Manage connectors > remove. Tell them where to revoke access at the vendor, and that they can clear the line in `.env`. If the same server is used by another kit (GitHub, Apify), say so before removing it.

# UPDATE

Updates install themselves (SETUP step 6). `.env`, `.cache/` and any file the member added are never touched, and nothing needs re-registering: every connection points at a fixed path in the kit folder. Changes the member asked for live in `~/.solnest/research-kit/my-instructions.md`, outside the kit folder, so they survive every update.

Only when the member asks to update now:

```bash
KIT="$HOME/solnest/research-kit"; "$KIT/bin/py" "$KIT/scripts/update.py" && "$KIT/bin/py" "$KIT/scripts/update.py" --after
```

Relay what it prints in plain words. Then run the SETUP step 6 line once more, so a newer auto-updater is picked up, and run the scoreboard: everything that was ✅ before should still be ✅. To go back one version: `"$HOME/solnest/research-kit/bin/py" "$HOME/solnest/research-kit/scripts/update.py" --undo`. If `scripts/update.py` or `bin/py` is missing (a copy from before automatic updates, or a copy in another folder), run SETUP step 2 instead, then step 6.

"Is it updating itself?": `~/solnest/research-kit/bin/py ~/.solnest/autoupdate.py status`. Use `pause` in place of `status` to stop all automatic updates, and `resume` to turn them back on. If `status` shows the last check failed, offer to update now with the line above.

# REPAIR

Run the installer again (SETUP step 2), then SETUP step 6, then the scoreboard. It keeps `.env`, `.cache/` and every file the member added.

# UNINSTALL

Run REMOVE for each connected tool first (the connections point into the kit folder). Then:

```bash
~/solnest/research-kit/bin/py ~/.solnest/autoupdate.py remove --name research-kit
```

Then, after a plain yes from the member, delete the folder `~/solnest/research-kit`. Remind them their keys were in its `.env`: they can delete those keys at each vendor if they are done with them.

# Troubleshooting

- `NO_CLAUDE_CLI`: no `claude` command found. Use Path A for sign-in tools. Key tools need the command; stop and say so.
- `MISSING_KEYS`: the `.env` line is empty or not saved. `node scripts/open-env.mjs`.
- `NOT_INSTALLED`: run the installer the message names.
- A key tool shows failed after a restart: `node scripts/test-key.mjs <tool>`. OK means the key is fine; check the kit folder was not moved or renamed (paths are fixed at register time; if it was, `register.mjs <tool> --replace` and restart).
- Sign-in page errors with "redirect" or "client": remove the server and add it through the other path.
- Auto mode blocks a kit command ("Blocked", "no verdict"): switch the session to Manual (`set_session_permission_mode` with `mode: default` if you have it, otherwise ask them to pick Manual in the mode selector), tell them they will click Allow before each step, and re-run.
