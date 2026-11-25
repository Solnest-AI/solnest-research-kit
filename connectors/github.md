# GitHub

**Status:** official (GitHub's remote MCP server, `github/github-mcp-server`). Needs a personal access token, kept in `.env` only.
**Server name / URL:** `github` / `https://api.githubcopilot.com/mcp/readonly` (read-only, the default) or `https://api.githubcopilot.com/mcp/` (read and write, only if you ask)
**Verified:** github.com/github/github-mcp-server, docs/installation-guides/install-claude.md and docs/remote-server.md (read 2026-11-04; repo 34k stars, MIT, pushed 2026-11-04). Endpoint answered 401 on 2026-11-04.

## Why a token instead of a sign-in
GitHub's own Claude Code guide documents the remote server with a token in the `Authorization` header only. So this one uses a key. The kit keeps that key out of the chat and out of Claude Code's config: Claude Code is told to run `scripts/mcp-headers.mjs` when it connects, and that script reads the token from this folder's `.env`.

## What it lets Claude do
Browse your repos, read code and files, search issues and pull requests, read Actions runs. With the read/write URL: create issues, open and comment on pull requests, manage branches.

## What you need
- A GitHub account (free works).
- A fine-grained personal access token.
- Node.js (Claude checks and installs it if missing).
- This kit folder must stay where it is after setup. The connection reads `.env` from here.

## Connect
1. Claude runs `node scripts/open-env.mjs`. Your `.env` opens.
2. Make the token: go to **github.com/settings/personal-access-tokens** > **Generate new token** (fine-grained).
   - Name: `Claude Code`. Expiration: 90 days is a good default.
   - Repository access: only the repos you want Claude to see (or all).
   - Permissions for read-only: **Contents: Read**, **Issues: Read**, **Pull requests: Read**, **Metadata: Read** (automatic). Add **Actions: Read** if you want CI info.
   - Want Claude to create issues and PRs later? Give Issues and Pull requests **Read and write**, and Contents **Read and write** for branches.
3. Click Generate, copy the token, paste it after `GITHUB_PAT=` in `.env`, save. Tell Claude "saved". Never paste it in the chat.
4. Claude tests it: `node scripts/test-key.mjs github` (prints OK and your GitHub username, never the token).
5. Claude registers it: `node scripts/register.mjs github` (add `--full` only if you asked for write access).
6. Restart Claude Code (desktop app: quit fully and reopen, then open this folder again).

## Verify (read-only)
Ask: "List my 5 most recently updated GitHub repos." Real repo names back means it works.

## Try these
- "Which of my repos had commits this week, and what changed?"
- "Show me the open issues on [repo] labeled bug, oldest first."
- "Read src/server.js in [repo] and explain what it does."

## Good to know
- The read-only URL physically hides write tools. Switching to write: `node scripts/register.mjs github --full`, then restart.
- Token expired? GitHub returns 401. Make a new one, replace the line in `.env`, save. No re-register needed, the helper reads `.env` on every connect. Restart Claude Code.
- Do not use the `@modelcontextprotocol/server-github` npm package from earlier lessons. npm marks it deprecated; GitHub's own server replaced it.

## Remove
`node scripts/register.mjs github --remove`, delete the `GITHUB_PAT=` value from `.env`, and delete the token at github.com/settings/personal-access-tokens.
