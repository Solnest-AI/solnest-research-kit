#!/usr/bin/env node
// Launcher for key-based local (stdio) servers.
// Claude Code starts this; it reads the kit's .env and starts the real server with the
// key in that server's environment only. Never prints the key.
//   node scripts/run-mcp.mjs <tool>
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { IS_WIN, loadKit, toolById, loadEnv, missingKeys, fill, venvPython } from './lib.mjs';

const kit = loadKit();
const id = process.argv[2];
const t = toolById(kit, id);
if (!t || t.kind !== 'stdio-key') {
  console.error(`run-mcp: unknown local server "${id}"`);
  process.exit(2);
}
const env = loadEnv();
const missing = missingKeys(t, env);
if (missing.length) {
  console.error(`run-mcp: ${missing.join(', ')} empty in the kit's .env`);
  process.exit(1);
}

let command;
let args = (t.args || []).map((a) => fill(a, env));
let shell = false;
if (t.command === '{NODE}') {
  command = process.execPath;
} else if (t.command && t.command.startsWith('{VENV_PY:')) {
  command = venvPython(t.command.slice(9, -1));
} else {
  command = t.command;
  // npx and uvx: on Windows npx is a .cmd file, which Node only starts through a shell.
  if (IS_WIN && command === 'npx') shell = true;
}
if (t.entry) {
  const entry = fill(t.entry, env);
  if (!fs.existsSync(entry)) {
    console.error(`run-mcp: ${id} is not installed yet. Run: node scripts/${t.installer}`);
    process.exit(1);
  }
  args = [entry, ...args];
}
if (command !== t.command && !fs.existsSync(command)) {
  console.error(`run-mcp: ${id} is not installed yet. Run: node scripts/${t.installer || 'see the connector file'}`);
  process.exit(1);
}

const childEnv = { ...process.env };
for (const [k, v] of Object.entries(t.env || {})) {
  const val = fill(v, env);
  if (val) childEnv[k] = val;
}
const child = spawn(command, args, { stdio: 'inherit', env: childEnv, shell });
child.on('error', (e) => { console.error(`run-mcp: could not start ${id} (${e.code || e.message})`); process.exit(1); });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code, signal) => process.exit(signal ? 1 : code ?? 0));
