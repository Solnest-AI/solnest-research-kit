#!/usr/bin/env node
// Finds keys the member already has on this computer (from other Solnest kits or earlier
// setups) and copies them into the BLANK lines of this kit's .env.
//   node scripts/discover-keys.mjs            # report only
//   node scripts/discover-keys.mjs --apply    # also fill blank lines
//   node scripts/discover-keys.mjs --apply --only GITHUB_PAT --extra-dir "/some/folder"
//
// Where it looks (read-only): .env-style files under Desktop, Documents, Downloads, the
// home folder, ~/.claude/skills, plus any --extra-dir. It does NOT read Claude Code's own
// config (~/.claude.json): a server already registered there shows up on the scoreboard
// as connected, so there is nothing to copy.
// Prints variable names and the folder each came from. Never prints a value. A filled
// line in .env is never overwritten. A found key can be stale, so test it afterwards.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { KIT, ENV_FILE, loadEnv } from './lib.mjs';

// Other names the same secret goes by in other kits and vendor docs.
const ALIASES = {
  FIRECRAWL_API_KEY: ['FIRECRAWL_KEY'],
  BRAVE_API_KEY: ['BRAVE_SEARCH_API_KEY', 'BRAVE_KEY'],
  EXA_API_KEY: ['EXA_KEY'],
  TAVILY_API_KEY: ['TAVILY_KEY'],
  APIFY_TOKEN: ['APIFY_API_TOKEN', 'APIFY_API_KEY', 'APIFY_KEY'],
  GITHUB_PAT: ['GITHUB_TOKEN', 'GITHUB_PERSONAL_ACCESS_TOKEN', 'GH_TOKEN'],
  GEMINI_API_KEY: ['GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'GOOGLE_GEMINI_API_KEY', 'NANOBANANA_API_KEY'],
  KIE_API_KEY: ['KIE_KEY', 'KIEAI_API_KEY'],
  STRIPE_AGENT_KEY: ['STRIPE_RESTRICTED_KEY'],
  WISE_API_TOKEN: ['WISE_TOKEN', 'WISE_API_KEY'],
  N8N_MCP_TOKEN: [],
  N8N_MCP_URL: [],
  GOOGLE_OAUTH_CLIENT_ID: [],
  GOOGLE_OAUTH_CLIENT_SECRET: [],
  USER_GOOGLE_EMAIL: [],
};
// Never copied: they describe the member's choices, not secrets found elsewhere.
const NEVER = new Set(['KIT_TOOLS', 'NANOBANANA_MODEL', 'WISE_ENVIRONMENT', 'WISE_API_VERSION', 'WISE_PROFILE_ID']);
const SKIP_DIRS = new Set(['node_modules', '.venv', 'venv', '.git', 'dist', 'build', '__pycache__', 'Library',
  '.Trash', 'Applications', '.cache', '.npm', '.cargo', 'site-packages', 'tests', 'test', 'fixtures',
  'examples', 'example', 'samples', 'AppData', 'vendor']);
const ENV_NAMES = new Set(['.env', '.env.local', '.env.production', 'keys.env']);
const MAX_DEPTH = 4;
const MAX_FILES = 20000;

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const only = [];
const extra = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--only' && args[i + 1]) only.push(args[++i]);
  else if (args[i] === '--extra-dir' && args[i + 1]) extra.push(args[++i]);
}

if (!fs.existsSync(ENV_FILE)) { console.log('NO_ENV: build .env first (node scripts/make-env.mjs --tools ...)'); process.exit(1); }
const mine = loadEnv();
const blanks = Object.keys(mine).filter((k) => !mine[k] && !NEVER.has(k) && (!only.length || only.includes(k)));
if (!blanks.length) { console.log('Nothing to look for: every key line in .env is already filled.'); process.exit(0); }

const home = os.homedir();
const roots = [path.join(home, 'Desktop'), path.join(home, 'Documents'), path.join(home, 'Downloads'),
  path.join(home, '.claude', 'skills'), home, ...extra.map((p) => path.resolve(p))];
const ownEnv = path.resolve(ENV_FILE);
const seen = new Set();
const files = [];
let dirs = 0;
function walk(dir, depth) {
  if (files.length > MAX_FILES || depth > MAX_DEPTH) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; } // protected folder: skip quietly
  dirs++;
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || (depth > 0 && e.name.startsWith('.') && e.name !== '.claude' && e.name !== '.ghl-cli')) continue;
      if (dir === home && depth === 0 && ['Desktop', 'Documents', 'Downloads'].includes(e.name)) continue; // walked as their own roots
      walk(p, depth + 1);
    } else if (e.isFile() && ENV_NAMES.has(e.name)) {
      const r = path.resolve(p);
      if (r === ownEnv || seen.has(r)) continue;
      seen.add(r);
      files.push(r);
    }
  }
}
for (const r of roots) walk(r, 0);

const placeholder = (v) => !v || /^(your|xxx|<|\$\{|changeme|replace|paste|todo)/i.test(v) || v.length < 8;
const found = {};
for (const f of files) {
  const vals = loadEnv(f);
  for (const k of blanks) {
    if (found[k]) continue;
    for (const name of [k, ...(ALIASES[k] || [])]) {
      if (!placeholder(vals[name])) { found[k] = { v: vals[name], from: f, as: name }; break; }
    }
  }
}

const pretty = (f) => (f.startsWith(home) ? '~' + f.slice(home.length) : f);
for (const k of blanks) {
  if (found[k]) console.log(`FOUND     ${k}  <- ${pretty(found[k].from)}${found[k].as !== k ? ` (as ${found[k].as})` : ''}`);
  else console.log(`not found ${k}`);
}

if (apply && Object.keys(found).length) {
  let text = fs.readFileSync(ENV_FILE, 'utf8');
  for (const [k, { v }] of Object.entries(found)) {
    text = text.replace(new RegExp(`^${k}=[ \\t]*$`, 'm'), () => `${k}=${v}`);
  }
  fs.writeFileSync(ENV_FILE, text);
  try { fs.chmodSync(ENV_FILE, 0o600); } catch { /* Windows */ }
  console.log(`Filled ${Object.keys(found).length} blank line(s). Test each one before trusting it.`);
}
console.log(`Looked through ${dirs} folders and ${files.length} key files (Desktop, Documents, Downloads, home, ~/.claude/skills${extra.length ? ', extra folders' : ''}).`);
