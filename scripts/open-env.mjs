#!/usr/bin/env node
// Opens .env in the computer's text editor so the member can paste keys. If .env does not
// exist yet it is created from .env.example first (never overwrites). Prints no values.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { KIT, ENV_FILE, IS_WIN } from './lib.mjs';

if (!fs.existsSync(ENV_FILE)) {
  fs.copyFileSync(path.join(KIT, '.env.example'), ENV_FILE);
  try { fs.chmodSync(ENV_FILE, 0o600); } catch { /* Windows */ }
  console.log('CREATED .env (from .env.example; run make-env.mjs to trim it to your tools)');
} else {
  console.log('EXISTS .env (left as is)');
}
let cmd, args;
if (process.platform === 'darwin') { cmd = 'open'; args = ['-t', ENV_FILE]; }
else if (IS_WIN) { cmd = 'notepad.exe'; args = [ENV_FILE]; }
else { cmd = 'xdg-open'; args = [ENV_FILE]; }
const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
child.on('error', () => console.log(`Could not open an editor. Open this file yourself: ${ENV_FILE}`));
child.unref();
console.log(`OPENED ${ENV_FILE}`);
