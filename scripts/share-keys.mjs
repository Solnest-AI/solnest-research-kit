#!/usr/bin/env node
// Copies keys from this kit's .env into the .env of skills that read their own copy
// (for example the Reddit scraper inside deep-internet-research and reddit-search).
//   node scripts/share-keys.mjs            # report what it would copy
//   node scripts/share-keys.mjs --apply    # copy into BLANK or missing lines only
// Only touches skills that are already installed under ~/.claude/skills. Never overwrites
// a filled line. Prints names only, never a value.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadKit, loadEnv } from './lib.mjs';

const kit = loadKit();
const apply = process.argv.includes('--apply');
const mine = loadEnv();
let did = 0;
for (const [skill, keys] of Object.entries(kit.shareKeys || {})) {
  const dir = path.join(os.homedir(), '.claude', 'skills', skill);
  if (!fs.existsSync(dir)) { console.log(`skip     ${skill}: not installed`); continue; }
  const file = path.join(dir, '.env');
  const theirs = loadEnv(file);
  let changed = 0;
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  for (const k of keys) {
    if (!mine[k]) { console.log(`skip     ${skill}: ${k} is empty in this kit`); continue; }
    if (theirs[k]) { console.log(`keep     ${skill}: ${k} already filled there`); continue; }
    console.log(`${apply ? 'copied ' : 'would copy'} ${skill}: ${k}`);
    if (!apply) continue;
    if (new RegExp(`^${k}=`, 'm').test(text)) text = text.replace(new RegExp(`^${k}=.*$`, 'm'), () => `${k}=${mine[k]}`);
    else text += `${text && !text.endsWith('\n') ? '\n' : ''}${k}=${mine[k]}\n`;
    did++; changed++;
  }
  if (apply && changed) { fs.writeFileSync(file, text); try { fs.chmodSync(file, 0o600); } catch { /* Windows */ } }
}
if (!apply) console.log('Nothing changed. Run with --apply to copy.');
