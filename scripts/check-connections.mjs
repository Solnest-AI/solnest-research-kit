#!/usr/bin/env node
// The scoreboard. Lists every tool in this kit as connected / missing / needs restart /
// sign-in, by reading `claude mcp list` (checked live) and this kit's .env.
//   node scripts/check-connections.mjs [--no-live]
//
// READ ONLY: it never writes, registers, removes or creates anything, and never prints a
// key, a header, a server command or a URL from Claude Code's config. Names and statuses only.
// Exit 0 = the checker ran (whatever it found). Exit 1 = it could not run at all.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { IS_WIN, ENV_FILE, loadKit, loadEnv, chosenTools, missingKeys, findClaude, readCache } from './lib.mjs';

let kit;
try { kit = loadKit(); } catch (e) { console.log(`Could not read kit.json (${e.message}). Re-download the kit.`); process.exit(1); }
const noLive = process.argv.includes('--no-live');
const hasEnv = fs.existsSync(ENV_FILE);
const env = hasEnv ? loadEnv() : {};
const chosen = chosenTools(env);

// ---- live list of registered servers -------------------------------------------------
const servers = new Map(); // normalized name -> { status, target }
let claudeNote = '';
const claude = noLive ? null : findClaude();
if (noLive) claudeNote = 'Live check skipped (--no-live): server rows show what .env says only.';
else if (!claude) claudeNote = 'No `claude` command found on this computer, so registered servers could not be checked live. Rows below show what .env says.';
else {
  const r = spawnSync(claude, ['mcp', 'list'], { encoding: 'utf8', timeout: 150000 });
  if (r.error || (r.status !== 0 && !r.stdout)) {
    claudeNote = `\`claude mcp list\` did not answer (${r.error ? r.error.code || r.error.message : `exit ${r.status}`}). Rows below show what .env says.`;
  } else {
    for (const raw of (r.stdout || '').split(/\r?\n/)) {
      const line = raw.trim();
      const colon = line.indexOf(': ');
      const dash = line.lastIndexOf(' - ');
      if (colon < 1 || dash < colon) continue;
      let name = line.slice(0, colon).toLowerCase().replace(/^claude\.ai\s+/, '');
      if (name.includes(':')) name = name.split(':').pop();
      name = name.trim().replace(/\s+/g, '-');
      const target = line.slice(colon + 2, dash);
      const text = line.slice(dash + 3);
      let status = 'other';
      if (/needs auth/i.test(text)) status = 'auth';
      else if (/fail|error|✘|✗/i.test(text)) status = 'failed';
      else if (/connected/i.test(text)) status = 'connected';
      else if (/pending/i.test(text)) status = 'pending';
      else if (/disabled/i.test(text)) status = 'disabled';
      let host = '';
      try { host = new URL(target.split(' ')[0]).host; } catch { /* stdio command, no host */ }
      servers.set(name, { status, host });
    }
  }
}

// ---- when did this Claude Code session start? (Mac and Linux) ------------------------
function etimeToMs(s) {
  const m = s.trim().match(/^(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+)$/);
  if (!m) return null;
  return ((((+m[1] || 0) * 24 + (+m[2] || 0)) * 60 + +m[3]) * 60 + +m[4]) * 1000;
}
function sessionStart() {
  if (IS_WIN) return null;
  let pid = process.ppid;
  for (let i = 0; i < 12 && pid > 1; i++) {
    const r = spawnSync('ps', ['-o', 'ppid=,etime=,comm=', '-p', String(pid)], { encoding: 'utf8' });
    const m = (r.stdout || '').trim().match(/^(\d+)\s+(\S+)\s+(.+)$/);
    if (!m) return null;
    const base = path.basename(m[3]).toLowerCase();
    if (base === 'claude' || /claude\.app|^claude$/i.test(m[3])) {
      const ms = etimeToMs(m[2]);
      return ms === null ? null : Date.now() - ms;
    }
    pid = +m[1];
  }
  return null;
}
const started = sessionStart();
const restart = readCache('needs-restart');
const liveOk = readCache('live-ok');

// ---- one row per tool ------------------------------------------------------------------
const GLYPH = { ok: '✅', missing: '❌', restart: '🔒', signin: '🔎', warn: '⚠️ ', off: '➖', unknown: '❓' };
const rows = [];
const add = (t, state, text) => rows.push({ label: t.label, state, text });

function findServer(t) {
  for (const n of t.names) if (servers.has(n)) return { name: n, ...servers.get(n) };
  if (t.url) {
    let h = '';
    try { h = new URL(t.url).host; } catch { /* none */ }
    for (const [n, s] of servers) if (h && s.host === h) return { name: n, ...s };
  }
  return null;
}

function installed(t) {
  if (!t.installed) return null;
  const rel = IS_WIN ? t.installed.win : t.installed.unix;
  return rel ? fs.existsSync(path.join(os.homedir(), rel)) : null;
}

const live = !!claude && servers.size >= 0 && !claudeNote;
for (const t of kit.tools) {
  if (t.hidden) continue;
  if (chosen && !chosen.includes(t.id)) { add(t, 'off', 'not picked (say "connect ' + t.id + '" to add it)'); continue; }
  const keysMissing = missingKeys(t, env);
  const s = ['oauth', 'http-key', 'stdio-key', 'handoff'].includes(t.kind) && t.names.length ? findServer(t) : null;

  if (s) {
    const stampAt = +restart[t.server] || +restart[s.name] || 0;
    if (stampAt && (started === null || started < stampAt)) {
      add(t, 'restart', started === null ? 'registered; restart Claude Code if you have not since then' : 'registered; quit and reopen Claude Code to load it');
    } else if (s.status === 'connected') {
      add(t, 'ok', s.name === t.server ? 'connected' : `connected as "${s.name}" (already set up; keep it unless you want a separate one)`);
    } else if (s.status === 'auth') {
      add(t, 'signin', `registered, sign-in not finished: type /mcp, pick ${s.name}, Authenticate`);
    } else if (s.status === 'failed') {
      add(t, 'warn', keysMissing.length ? `registered but ${keysMissing.join(', ')} is empty in .env` : 'registered but failed to connect (see its connector file, Troubleshooting)');
    } else {
      add(t, 'warn', `registered, status: ${s.status}`);
    }
    continue;
  }

  if (t.kind === 'cli') {
    const r = spawnSync(t.check[0], t.check.slice(1), { encoding: 'utf8', timeout: 30000, shell: IS_WIN });
    if (r.error && r.error.code === 'ENOENT') add(t, 'missing', 'not installed');
    else if (r.status === 0) add(t, 'ok', 'installed and signed in');
    else add(t, 'signin', 'installed, not signed in yet');
    continue;
  }
  if (t.kind === 'script') {
    if (keysMissing.length) add(t, 'missing', `missing key: ${keysMissing.join(', ')}`);
    else if (liveOk[t.id]) add(t, 'ok', `key works (tested ${liveOk[t.id]})`);
    else add(t, 'warn', 'key saved, not tested yet: node scripts/test-key.mjs ' + t.id);
    continue;
  }
  if (liveOk[t.id]) { add(t, 'ok', `connected (checked live in chat ${liveOk[t.id]})`); continue; }
  if (t.kind === 'handoff') {
    const inst = installed(t);
    if (inst && !t.names.length) add(t, 'ok', 'installed (Claude tests it with its own doctor command)');
    else if (inst) add(t, 'missing', 'installed but not registered with Claude Code yet');
    else add(t, 'missing', `not set up yet: say "connect ${t.id}"`);
    continue;
  }
  if (t.kind === 'oauth') {
    const keyNote = t.keyMode && !missingKeys(t, env, { keyMode: true }).length ? ' (key option saved in .env, not registered yet)' : '';
    add(t, 'signin', `sign-in: add it under + > Connectors, Claude checks it live${keyNote}`);
    continue;
  }
  // http-key / stdio-key, not registered
  if (keysMissing.length) add(t, 'missing', `missing key: ${keysMissing.join(', ')}`);
  else add(t, 'missing', 'key saved, not registered yet');
}

if (!live && claudeNote) {
  for (const r of rows) {
    if (r.state === 'signin' || (r.state === 'missing' && !/key|installed|not set up|not picked/.test(r.text))) { r.state = 'unknown'; r.text = 'could not check live: ' + r.text; }
  }
}

// ---- print -----------------------------------------------------------------------------
console.log(`${kit.title}: connection scoreboard`);
if (!hasEnv) console.log('No .env yet. Claude builds it once you pick your tools (scripts/make-env.mjs).');
if (claudeNote) console.log(claudeNote);
console.log('');
const w = Math.max(...rows.map((r) => r.label.length)) + 2;
for (const r of rows) console.log(`${GLYPH[r.state]} ${r.label.padEnd(w)}${r.text}`);
const n = (s) => rows.filter((r) => r.state === s).length;
console.log('');
console.log(`Summary: ${n('ok')} connected, ${n('missing')} missing, ${n('restart')} need restart, ${n('signin')} need sign-in, ${n('warn')} need a look, ${n('off')} not picked${n('unknown') ? `, ${n('unknown')} unknown` : ''}`);
process.exit(0);
