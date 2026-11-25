#!/usr/bin/env node
// Builds .env from .env.example with ONLY the blocks for the tools the member picked.
//   node scripts/make-env.mjs --tools firecrawl,exa,apify
//   node scripts/make-env.mjs --all
// Safe to run again with a different list: every value already in .env is carried over,
// and a value for a tool they no longer picked is kept at the bottom, never deleted.
// Prints tool names only, never a value.
import fs from 'node:fs';
import path from 'node:path';
import { KIT, ENV_FILE, loadKit, loadEnv } from './lib.mjs';

const kit = loadKit();
const args = process.argv.slice(2);
const i = args.indexOf('--tools');
let picked;
if (args.includes('--all')) picked = kit.tools.filter((t) => !t.hidden).map((t) => t.id);
else if (i >= 0 && args[i + 1]) picked = args[i + 1].split(',').map((s) => s.trim()).filter(Boolean);
else { console.error('Usage: node scripts/make-env.mjs --tools a,b,c | --all'); process.exit(2); }

const known = new Set(kit.tools.map((t) => t.id));
const unknown = picked.filter((p) => !known.has(p));
if (unknown.length) { console.error(`UNKNOWN_TOOLS: ${unknown.join(', ')}`); process.exit(2); }
// Hidden tools (fallback modes) ride along with their parent.
for (const t of kit.tools) if (t.hidden && t.parent && picked.includes(t.parent) && !picked.includes(t.id)) picked.push(t.id);

// Parse .env.example into a header and "# ==== <id> ====" blocks.
const example = fs.readFileSync(path.join(KIT, '.env.example'), 'utf8').split(/\r?\n/);
let header = [];
const blocks = {};
let cur = null;
for (const line of example) {
  const m = line.match(/^# ==== ([a-z0-9-]+) ====\s*$/);
  if (m) { cur = m[1]; blocks[cur] = [line]; continue; }
  if (cur) blocks[cur].push(line); else header.push(line);
}
header = header.filter((l) => !/^KIT_TOOLS=/.test(l));

const old = loadEnv();
const used = new Set(['KIT_TOOLS']);
const setVal = (line) => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) return line;
  used.add(m[1]);
  return old[m[1]] ? `${m[1]}=${old[m[1]]}` : line;
};

const out = [...header.map(setVal)];
while (out.length && out[out.length - 1] === '') out.pop();
out.push('', '# The tools you picked (Claude reads this, it is not a secret).', `KIT_TOOLS=${picked.join(',')}`, '');
const withBlock = [];
for (const id of picked) {
  if (!blocks[id]) continue;
  withBlock.push(id);
  const b = blocks[id].map(setVal);
  while (b.length && b[b.length - 1] === '') b.pop();
  out.push(...b, '');
}
const leftover = Object.keys(old).filter((k) => !used.has(k) && old[k]);
if (leftover.length) {
  out.push('# ==== kept from tools you did not pick this time ====');
  for (const k of leftover) out.push(`${k}=${old[k]}`);
  out.push('');
}
const existed = fs.existsSync(ENV_FILE);
fs.writeFileSync(ENV_FILE, out.join('\n'));
try { fs.chmodSync(ENV_FILE, 0o600); } catch { /* Windows */ }
console.log(`${existed ? 'UPDATED' : 'CREATED'} .env for: ${picked.filter((p) => !kit.tools.find((t) => t.id === p).hidden).join(', ')}`);
console.log(withBlock.length ? `Lines to fill: ${withBlock.join(', ')}` : 'No keys needed for these tools (all browser sign-in).');
if (leftover.length) console.log(`Kept ${leftover.length} value(s) from tools you did not pick (names only): ${leftover.join(', ')}`);
