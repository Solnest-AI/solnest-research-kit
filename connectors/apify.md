# Apify

**Status:** official (Apify's hosted MCP server). Browser sign-in, no key.
**Server name / URL:** `apify` / `https://mcp.apify.com`
**Verified:** docs.apify.com/platform/integrations/mcp (read 2026-11-04). Free plan details: apify.com/pricing (read 2026-11-04). Endpoint answered 401 on 2026-11-04.

## What it lets Claude do
Gives Claude the Apify Store: thousands of ready-made scrapers ("Actors") for Instagram, TikTok, Google Maps reviews, Zillow, Amazon, any website. Claude finds the right Actor, runs it, and hands you clean data.

## What you need
- An Apify account. Free plan: "$5 of platform usage per month", "No credit card is required."
- Scrapes cost platform credit. Small runs (50 to 100 items) are usually cents. Big runs burn credit fast.
- Rate limit: 30 requests per second per user.

## Connect
Follow `_how-sign-in-works.md` with name `apify` and URL `https://mcp.apify.com`.

## The token, for the Reddit search (optional)
The Reddit scraper inside `deep-internet-research` and `reddit-search` is a script, not the MCP. It reads `APIFY_TOKEN` from the skill's own `.env`.
1. Apify Console > **Settings** > **API & Integrations** (https://console.apify.com/settings/integrations), copy the default API token.
2. Paste it after `APIFY_TOKEN=` in the open `.env`, save, say "saved".
3. Claude runs `node scripts/test-key.mjs apify` (reads your account, free), then `node scripts/share-keys.mjs --apply` to copy it into those skills' `.env` files.

## Verify (read-only)
Ask: "Search the Apify Store for an Instagram profile scraper. Do not run anything." A list of Actors back means it works. Searching is free.

## Try these
- "Pull the last 30 Google reviews for [business name] and tell me what people complain about most."
- "Get all active Zillow listings in zip 78704 and summarize price per square foot."
- "Scrape the last 20 posts from @[competitor] on Instagram and rank them by engagement."

## Good to know
- Running an Actor spends your Apify credit. Claude tells you which Actor and roughly how many results before it runs one, and waits for your yes.
- Skip the old "paste your API token" steps from earlier lessons. The sign-in replaces them.

## Remove
Path A: + > Connectors > Manage connectors > remove. Path B: `node scripts/register.mjs apify --remove`. To cut access completely, also revoke Claude in Apify Console (account settings, integrations).
