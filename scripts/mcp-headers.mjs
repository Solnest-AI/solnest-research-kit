#!/usr/bin/env node
// Claude Code `headersHelper` for key-based hosted servers.
// Claude Code runs this when it connects and uses the JSON it prints as request headers.
// The key lives only in this kit's .env. Nothing else is printed.
//   node scripts/mcp-headers.mjs <tool> [--key]
import { loadKit, toolById, loadEnv, missingKeys, fill } from './lib.mjs';

const kit = loadKit();
const id = process.argv[2];
const keyMode = process.argv.includes('--key');
const t = toolById(kit, id);
const spec = t && (keyMode ? t.keyMode : t);
if (!t || !spec || !spec.headers) {
  console.error(`mcp-headers: unknown key-based server "${id}"`);
  process.exit(2);
}
const env = loadEnv();
const missing = missingKeys(t, env, { keyMode });
if (missing.length) {
  console.error(`mcp-headers: ${missing.join(', ')} empty in the kit's .env`);
  process.exit(1);
}
const out = {};
for (const [h, v] of Object.entries(spec.headers)) out[h] = fill(v, env).trim();
process.stdout.write(JSON.stringify(out));
