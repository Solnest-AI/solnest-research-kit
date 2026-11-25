#!/usr/bin/env node
// One small read-only call that proves a key in .env works, before anything is registered.
//   node scripts/test-key.mjs <tool> [--key]
// Prints OK or FAIL plus the HTTP status. Never prints the key. Nothing here creates,
// sends, runs or generates anything. Costs: most are free; Brave uses 1 search from the
// free quota, Exa about half a cent, Tavily 1 credit.
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { KIT, IS_WIN, ENV_FILE, loadKit, toolById, loadEnv, missingKeys } from './lib.mjs';

const kit = loadKit();
const id = process.argv[2];
const keyMode = process.argv.includes('--key');
const t = toolById(kit, id);
if (!t) { console.log(`FAIL ${id}: unknown tool`); process.exit(2); }
const test = keyMode && t.keyMode ? t.keyMode.test : t.test;
if (!test) { console.log(`No key test for "${id}" (${t.kind === 'oauth' ? 'it uses browser sign-in, Claude checks it live after you sign in' : 'see its connector file'}).`); process.exit(0); }
const env = loadEnv();
const miss = t.optionalKeys ? t.optionalKeys.filter((k) => !env[k]) : missingKeys(t, env, { keyMode });
if (miss.length) { console.log(`FAIL ${id}: ${miss.join(', ')} empty in .env`); process.exit(1); }

const UA = { 'User-Agent': 'solnest-mcp-kit' };
const post = (url, headers, body) => fetch(url, { method: 'POST', headers: { ...UA, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const get = (url, headers) => fetch(url, { headers: { ...UA, ...headers } });

const TESTS = {
  firecrawl: async () => [await get('https://api.firecrawl.dev/v2/team/credit-usage', { Authorization: `Bearer ${env.FIRECRAWL_API_KEY}` }), 'Firecrawl key works (read your credit balance)'],
  brave: async () => [await get('https://api.search.brave.com/res/v1/web/search?q=claude%20code&count=1', { 'X-Subscription-Token': env.BRAVE_API_KEY, Accept: 'application/json' }), 'Brave key works (1 test search)'],
  exa: async () => [await post('https://api.exa.ai/search', { 'x-api-key': env.EXA_API_KEY }, { query: 'claude code skills', numResults: 1 }), 'Exa key works (1 test search)'],
  tavily: async () => [await post('https://api.tavily.com/search', { Authorization: `Bearer ${env.TAVILY_API_KEY}` }, { query: 'claude code skills', max_results: 1 }), 'Tavily key works (1 test search)'],
  'apify-token': async () => [await get('https://api.apify.com/v2/users/me', { Authorization: `Bearer ${env.APIFY_TOKEN}` }), 'Apify token works (read your account)'],
  github: async () => {
    const res = await get('https://api.github.com/user', { Authorization: `Bearer ${env.GITHUB_PAT}` });
    if (res.ok) { const j = await res.json(); return [res, `GitHub token works, signed in as ${j.login}`]; }
    return [res, ''];
  },
  gemini: async () => {
    const res = await get('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { 'x-goog-api-key': env.GEMINI_API_KEY });
    if (res.ok) { const j = await res.json(); const n = (j.models || []).filter((m) => /image/i.test(m.name)).length; return [res, `Gemini key works (${n} image models visible)`]; }
    return [res, ''];
  },
  kie: async () => {
    // Kie answers HTTP 200 even for a bad key. The real answer is "code" in the body.
    const res = await get('https://api.kie.ai/api/v1/chat/credit', { Authorization: `Bearer ${env.KIE_API_KEY}` });
    let j = {};
    try { j = await res.json(); } catch { /* not json */ }
    if (res.ok && j.code === 200) return [res, `Kie key works (credit balance: ${j.data})`];
    return [{ ok: false, status: j.code || res.status }, ''];
  },
  'stripe-key': async () => {
    if (!/^rk_(live|test)_/.test(env.STRIPE_AGENT_KEY)) { console.log('FAIL stripe: the key must be a restricted key starting with rk_live_ or rk_test_. A full sk_ key is refused on purpose.'); process.exit(1); }
    return [await get('https://api.stripe.com/v1/balance', { Authorization: `Bearer ${env.STRIPE_AGENT_KEY}` }), `Stripe read-only key works (${env.STRIPE_AGENT_KEY.startsWith('rk_live_') ? 'live' : 'test'} mode)`];
  },
  'n8n-key': async () => [await post(env.N8N_MCP_URL, { Authorization: `Bearer ${env.N8N_MCP_TOKEN}`, accept: 'application/json, text/event-stream' },
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'kit-test', version: '1' } } }), 'n8n accepted the token'],
  'google-oauth': async () => {
    // No network call is possible without the browser sign-in. Check the shape only.
    if (!/\.apps\.googleusercontent\.com$/.test(env.GOOGLE_OAUTH_CLIENT_ID)) { console.log('FAIL google-workspace: GOOGLE_OAUTH_CLIENT_ID should end in .apps.googleusercontent.com. Re-copy it.'); process.exit(1); }
    if (!/@/.test(env.USER_GOOGLE_EMAIL)) { console.log('FAIL google-workspace: USER_GOOGLE_EMAIL does not look like an email address.'); process.exit(1); }
    console.log('OK google-workspace: all three values are filled and look right. The real test is the Google sign-in after restart.');
    process.exit(0);
  },
  wise: async () => {
    const py = IS_WIN ? (spawnSync('py', ['--version']).status === 0 ? 'py' : 'python') : 'python3';
    const r = spawnSync(py, [path.join(KIT, t.folder, 'wise.py'), 'profiles', '--env', ENV_FILE], { encoding: 'utf8' });
    const outText = (r.stdout || '') + (r.stderr || '');
    const first = outText.trim().split(/\r?\n/)[0] || 'no output';
    console.log(r.status === 0 ? `OK wise: ${first}` : `FAIL wise: ${first}`);
    process.exit(r.status === 0 ? 0 : 1);
  },
};

async function main() {
  const fn = TESTS[test];
  if (!fn) { console.log(`No key test named "${test}".`); return 0; }
  const [res, okMsg] = await fn();
  if (res.ok) { console.log(`OK ${id}: ${okMsg}`); return 0; }
  const s = res.status;
  console.log(`FAIL ${id}: HTTP ${s}. ${[400, 401, 403].includes(s) ? 'The key was rejected. Re-copy it into .env (no spaces, no quotes) and save.'
    : s === 402 || s === 429 ? 'Out of credits or rate limited. Check your plan on that site.' : 'Unexpected answer from the service. Try again in a minute.'}`);
  return 1;
}
main().then((c) => process.exit(c)).catch((e) => { console.log(`FAIL ${id}: ${e.cause?.code || e.code || e.message} (no internet, or the service is down)`); process.exit(1); });
