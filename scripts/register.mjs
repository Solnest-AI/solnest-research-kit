#!/usr/bin/env node
// Register (or remove) one connection in Claude Code's USER config (every folder).
//
//   node scripts/register.mjs <tool> [--url <server url>] [--full] [--key] [--replace] [--dry-run]
//   node scripts/register.mjs <tool> --remove
//   node scripts/register.mjs --find-claude
//
// Keys are never passed on the command line and never written to Claude Code's config.
// Key-based servers are registered as a pointer to a script in this kit that reads .env
// when Claude Code connects. If a server with the same name already exists it is left
// alone unless you pass --replace.
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { KIT, loadKit, toolById, loadEnv, missingKeys, findClaude, nodeCommand, fill,
  readCache, writeCache } from './lib.mjs';

const args = process.argv.slice(2);
if (args[0] === '--find-claude') {
  const c = findClaude();
  console.log(c ? `CLAUDE_CLI ${c}` : 'NO_CLAUDE_CLI');
  process.exit(c ? 0 : 3);
}
const kit = loadKit();
const id = args[0];
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const t = id ? toolById(kit, id) : null;
if (!t) {
  const ids = kit.tools.filter((x) => ['oauth', 'http-key', 'stdio-key'].includes(x.kind)).map((x) => x.id);
  console.error(`Usage: node scripts/register.mjs <${ids.join('|')}> [--url URL] [--full] [--key] [--replace] [--dry-run] [--remove]`);
  process.exit(2);
}
if (!['oauth', 'http-key', 'stdio-key'].includes(t.kind)) {
  console.error(`NOT_REGISTERABLE: ${t.id} has its own setup. See ${t.connector}.`);
  process.exit(2);
}
const dry = flag('--dry-run');
const name = t.server;
const claude = findClaude();
if (!claude && !dry) {
  console.error('NO_CLAUDE_CLI: could not find a `claude` command on this computer.');
  console.error('In the desktop app, add sign-in connections under + > Connectors instead (see the connector file).');
  process.exit(3);
}

function run(argv, { quiet = false } = {}) {
  const shown = ['claude', ...argv].map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ');
  if (dry) { console.log(`DRY RUN: ${shown}`); return 0; }
  const r = spawnSync(claude, argv, { encoding: 'utf8' });
  if (!quiet) {
    if (r.stdout) process.stdout.write(r.stdout.replace(/^File modified:.*$/gm, '').trimEnd() + '\n');
    if (r.stderr) process.stderr.write(r.stderr);
  }
  return r.status ?? 1;
}

// Output of `claude mcp get` is captured and never shown (it can contain a header).
function exists() {
  if (dry) return false;
  return spawnSync(claude, ['mcp', 'get', name], { encoding: 'utf8' }).status === 0;
}

function stamp(on) {
  const s = readCache('needs-restart');
  if (on) s[name] = String(Date.now()); else delete s[name];
  if (!dry) writeCache('needs-restart', s);
}

if (flag('--remove')) {
  const rc = run(['mcp', 'remove', name, '--scope', 'user']);
  stamp(false);
  console.log(rc === 0 ? `REMOVED ${name}` : `NOT_REMOVED ${name} (maybe it was never registered at user scope)`);
  process.exit(rc === 0 ? 0 : 1);
}

const env = loadEnv();
const keyMode = flag('--key') && t.keyMode;
const spec = keyMode ? { ...t, ...t.keyMode, kind: 'http-key' } : t;

let url = flag('--full') && spec.fullUrl ? spec.fullUrl : spec.url;
if (spec.urlFromEnv) url = opt('--url') || env[spec.urlFromEnv];
if ((spec.kind === 'oauth' || spec.kind === 'http-key') && !url) {
  console.error(`MISSING_URL: pass --url or fill ${spec.urlFromEnv} in .env`);
  process.exit(4);
}
if (url && !/^https?:\/\//.test(url)) {
  console.error('BAD_URL: the server URL must start with https:// (or http:// for a local server).');
  process.exit(4);
}

const missing = missingKeys(t, env, { keyMode: !!keyMode });
if (missing.length && spec.kind !== 'oauth') {
  console.error(`MISSING_KEYS: ${missing.join(', ')} empty in .env. Fill them, save, run again.`);
  process.exit(5);
}

if (exists()) {
  if (!flag('--replace')) {
    console.log(`ALREADY_REGISTERED ${name}: left as is. Pass --replace to swap in this kit's version.`);
    process.exit(0);
  }
  console.log(`${name} is already registered. Replacing it with this kit's version.`);
  run(['mcp', 'remove', name, '--scope', 'user'], { quiet: true });
}

const node = nodeCommand();
const q = (p) => `"${p}"`;
let rc;
if (spec.kind === 'oauth') {
  rc = run(['mcp', 'add', '--transport', 'http', name, url, '--scope', 'user']);
} else if (spec.kind === 'http-key') {
  const helper = `${node === 'node' ? 'node' : q(node)} ${q(path.join(KIT, 'scripts', 'mcp-headers.mjs'))} ${t.id}${keyMode ? ' --key' : ''}`;
  rc = run(['mcp', 'add-json', name, JSON.stringify({ type: 'http', url, headersHelper: helper }), '--scope', 'user']);
} else if (spec.kind === 'stdio-key') {
  if (spec.entry && !dry) {
    const entry = fill(spec.entry, env);
    if (!fs.existsSync(entry)) {
      console.error(`NOT_INSTALLED: ${path.relative(KIT, entry)} is missing. Run: node scripts/${spec.installer}`);
      process.exit(6);
    }
  }
  rc = run(['mcp', 'add-json', name, JSON.stringify({
    type: 'stdio', command: node, args: [path.join(KIT, 'scripts', 'run-mcp.mjs'), t.id],
  }), '--scope', 'user']);
}
if (rc === 0) stamp(true);
console.log(rc !== 0 ? `FAILED ${name}` : dry ? `DRY RUN OK ${name} (nothing was changed)` : `REGISTERED ${name} (restart Claude Code to load it)`);
process.exit(rc === 0 ? 0 : 1);
