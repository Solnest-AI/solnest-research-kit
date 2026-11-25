# GitHub CLI (`gh`)

**Status:** GitHub's official command line tool. No key in `.env`: it signs in through your browser and keeps its own login.
**Not an MCP server.** The deep research skill calls `gh` directly to search repos, code, issues and discussions with real star counts. The GitHub MCP row in this kit is separate and optional for research.

## What you need
- A free GitHub account.

## Connect
1. Check: `gh --version`.
   - Missing on Mac: `brew install gh` (plain yes first). No Homebrew: send them to https://cli.github.com.
   - Missing on Windows: `winget install --id GitHub.cli` (plain yes first), then quit and reopen Claude Code.
2. Check the login: `gh auth status`.
   - Not logged in: `gh auth login` is interactive, so the member runs it. In the desktop app, open the Terminal panel (or any terminal), run `gh auth login`, pick GitHub.com, HTTPS, "Login with a web browser", and follow the code it shows. If you have a terminal tool, start it there and read the tab for the one-time code.
3. Run the scoreboard. The row turns ✅ when `gh auth status` passes.

## Verify (read-only)
`gh search repos "claude code skills" --limit 3 --json fullName,stargazersCount`. Three repos back means it works.

## Remove
`gh auth logout`. Uninstall with `brew uninstall gh` or `winget uninstall GitHub.cli`.
