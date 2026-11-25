# Tavily

**Status:** Tavily's MCP server (`tavily-mcp` on npm, run with `npx`). Needs an API key, kept in `.env` only.
**Server name:** `tavily` (the deep research skill expects exactly this name)
**Verified:** install method reused from the Solnest deep-internet-research kit; npm registry 2026-11-04 shows `tavily-mcp` 0.2.22, not deprecated.

## What it lets Claude do
Search built for AI agents: answers with sources, page extraction, site maps and crawls. Deep research uses it as one of its sources.

## What you need
- A Tavily account at https://app.tavily.com. There was a free monthly credit allowance when the research kit was written. A test search uses 1 credit.
- Node.js (Claude checks it).

## Connect
1. Sign up at https://app.tavily.com. The key is on your dashboard home. Copy it.
2. Paste it after `TAVILY_API_KEY=` in the open `.env`, save, say "saved".
3. Claude runs `node scripts/test-key.mjs tavily`.
4. Claude runs `node scripts/register.mjs tavily`.
5. Restart Claude Code (batched).

## Verify (read-only)
Ask: "Use Tavily to search for 'claude code skills', 3 results." Results back means it works.

## Try these
- "Tavily: what changed in <industry> regulation this year? Cite sources."
- "Extract the main text from these 3 URLs with Tavily."
- "Map the pages on <site> with Tavily."

## Remove
`node scripts/register.mjs tavily --remove`, clear the line in `.env`, delete the key in the Tavily dashboard.
