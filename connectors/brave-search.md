# Brave Search

**Status:** official (Brave's own MCP server, `@brave/brave-search-mcp-server`, run on your computer with `npx`). Needs an API key, kept in `.env` only.
**Server name:** `brave-search` (the deep research skill expects exactly this name)
**Verified:** npm registry, 2026-11-04: `@brave/brave-search-mcp-server` 2.1.4, repo github.com/brave/brave-search-mcp-server, reads `BRAVE_API_KEY`, stdio by default. The older `@modelcontextprotocol/server-brave-search` package is marked deprecated on npm ("Package no longer supported"), so this kit does not use it, even though earlier lessons did.

## What it lets Claude do
Independent web search (Brave runs its own index, not Google's), plus local business, news, image and video search. Deep research uses it as one of its search sources.

## What you need
- A Brave Search API account at https://api-dashboard.search.brave.com. You pick a plan there; there was a free option when the research kit was written. Check the dashboard for today's plans and limits.
- Node.js (Claude checks it). The first start downloads the server, so it can take a moment.

## Connect
1. Sign in at https://api-dashboard.search.brave.com, subscribe to a plan, open **API Keys**, copy your key.
2. Paste it after `BRAVE_API_KEY=` in the open `.env`, save, say "saved".
3. Claude runs `node scripts/check-env.mjs brave-search`, then `node scripts/test-key.mjs brave-search` (one test search from your quota).
4. Claude runs `node scripts/register.mjs brave-search`. Claude Code starts `scripts/run-mcp.mjs`, which reads `.env` and starts Brave's server with the key in its environment only.
5. Restart Claude Code (batched).

## Verify (read-only)
Ask: "Use Brave to search for 'claude code skills' and show me 3 results." Results back means it works.

## Try these
- "Brave search: what are people saying about <product> this month?"
- "Find local coffee shops near <city> with Brave."
- "Search news for <company> from the last week."

## Good to know
- Windows: if it shows "failed" after the restart, it is usually the first `npx` download timing out. Ask Claude to reconnect it once.
- Tool names in the new server may differ slightly from the old one. If a skill asks for a tool that is not there, tell Claude to list the brave-search tools and use the closest one. (Not verified against every skill.)

## Remove
`node scripts/register.mjs brave-search --remove`, clear the line in `.env`, delete the key in the Brave dashboard.
