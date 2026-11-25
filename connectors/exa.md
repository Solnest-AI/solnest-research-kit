# Exa

**Status:** Exa's MCP server (`exa-mcp-server` on npm, run with `npx`). Needs an API key, kept in `.env` only.
**Server name:** `exa` (the deep research skill expects exactly this name)
**Verified:** install method reused from the Solnest deep-internet-research kit; npm registry 2026-11-04 shows `exa-mcp-server` 3.4.3, not deprecated.

## What it lets Claude do
Search by meaning instead of keywords. Great for "find companies like X", research papers, and pages that a normal search buries. Deep research uses it as one of its sources.

## What you need
- An Exa account at https://dashboard.exa.ai. New accounts got free credits when the research kit was written; after that it is pay as you go. A test search costs about half a cent.
- Node.js (Claude checks it).

## Connect
1. Open https://dashboard.exa.ai/api-keys, create a key, copy it.
2. Paste it after `EXA_API_KEY=` in the open `.env`, save, say "saved".
3. Claude runs `node scripts/test-key.mjs exa` (one tiny search).
4. Claude runs `node scripts/register.mjs exa`.
5. Restart Claude Code (batched).

## Verify (read-only)
Ask: "Use Exa to find 3 pages about Claude Code skills." Results back means it works.

## Try these
- "Use Exa to find 10 companies similar to <company>."
- "Find recent research on <topic> with Exa and summarize it."
- "Exa search for blog posts that explain <concept> well."

## Remove
`node scripts/register.mjs exa --remove`, clear the line in `.env`, delete the key in the Exa dashboard.
