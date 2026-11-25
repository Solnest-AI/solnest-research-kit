#!/usr/bin/env node
// Says which .env lines are filled or empty, per tool. Never prints a value.
//   node scripts/check-env.mjs [tool ...]
import fs from 'node:fs';
import { ENV_FILE, loadKit, toolById, loadEnv, missingKeys, chosenTools } from './lib.mjs';

if (!fs.existsSync(ENV_FILE)) {
  console.log('NO_ENV: .env does not exist yet. Run: node scripts/make-env.mjs --tools <list>');
  process.exit(1);
}
const kit = loadKit();
const env = loadEnv();
const names = process.argv.slice(2).length ? process.argv.slice(2)
  : (chosenTools(env) || kit.tools.map((t) => t.id));
let bad = 0;
for (const n of names) {
  const t = toolById(kit, n);
  if (!t) { console.log(`?      ${n}: unknown`); bad++; continue; }
  const keys = [...t.keys, ...(t.keyMode ? t.keyMode.keys || [] : []), ...(t.optionalKeys || [])];
  if (!keys.length && !t.urlFromEnv) { console.log(`-      ${n}: no key needed (${t.kind === 'oauth' ? 'browser sign-in' : 'own setup'})`); continue; }
  if (t.kind === 'oauth' && t.keyMode) {
    const m = missingKeys(t, env, { keyMode: true });
    console.log(`${m.length ? 'EMPTY ' : 'FILLED'} ${n}: ${m.length ? `${m.join(', ')} ` : ''}${t.urlFromEnv ? `(${t.urlFromEnv} is needed either way, or pass --url; the token only for the key option)` : '(only needed for the key option, sign-in needs nothing)'}`);
    continue;
  }
  const miss = missingKeys(t, env);
  if (t.optionalKeys) { const m = t.optionalKeys.filter((k) => !env[k]); console.log(`${m.length ? 'EMPTY ' : 'FILLED'} ${n}${m.length ? `: ${m.join(', ')}` : ''} (optional: ${t.optionalNote || 'only some skills use it'})`); continue; }
  if (miss.length) { console.log(`EMPTY  ${n}: ${miss.join(', ')}`); bad++; }
  else console.log(`FILLED ${n}`);
}
process.exit(bad ? 1 : 0);
