# Firecrawl

**Status:** official (Firecrawl's hosted MCP server). Needs an API key, kept in `.env` only and sent as a header.
**Server name / URL:** `firecrawl` / `https://mcp.firecrawl.dev/v2/mcp`
**Verified:** docs.firecrawl.dev/mcp-server and firecrawl.dev/pricing (read 2026-09-21 for the Solnest STR kit; reused here). The key test calls `GET https://api.firecrawl.dev/v2/team/credit-usage`, which reads your balance and scrapes nothing.

## What it lets Claude do
Search the web, scrape a page into clean text, map a whole site, crawl it. Deep research and the ad research skills use it to read pages properly instead of guessing from snippets.

## What you need
- A free Firecrawl account. The Free plan was 1,000 credits a month with no credit card when we checked (Sept 2026). Check firecrawl.dev/pricing for today's numbers.

## Connect
1. Sign in at https://www.firecrawl.dev/signin, then open https://www.firecrawl.dev/app/api-keys.
2. Create a key and copy it (starts with `fc-`). Treat it as shown once.
3. Paste it after `FIRECRAWL_API_KEY=` in the open `.env`, save, say "saved".
4. Claude runs `node scripts/check-env.mjs firecrawl`, then `node scripts/test-key.mjs firecrawl`.
5. Claude runs `node scripts/register.mjs firecrawl`. The key is never written into Claude Code's config: Claude Code runs `scripts/mcp-headers.mjs` when it connects, and that reads `.env`.
6. Restart Claude Code (batched with the other key tools).

## Verify (read-only)
Ask: "What is my Firecrawl credit usage?" A number back means it works. Note: the server lists its tools even with a bad key, so "connected" alone proves nothing. The credit-usage answer does.

## Try these
- "Scrape this page and give me the pricing table: <url>"
- "Map every page on <competitor site> and list the service pages."
- "Search the web for the newest posts about <topic> and summarize the top 5."

## Good to know
- Never use the old `mcp.firecrawl.dev/<key>/` URL style from older tutorials. The key ends up in a URL, and URLs get logged.
- Out of credits: calls start failing. Ask for credit usage; the free plan resets monthly.

## Remove
`node scripts/register.mjs firecrawl --remove`, clear the line in `.env`, and delete the key at firecrawl.dev/app/api-keys.
