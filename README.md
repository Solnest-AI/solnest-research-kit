# Research Kit, by Solnest AI

This kit connects the tools behind Solnest's research skills in one guided setup: Firecrawl, Brave Search, Exa and Tavily for web search, Apify for Reddit and other scrapers, GitHub (the MCP and the `gh` command line) for repos, code and discussions. You set it up once and every skill that needs these tools just works.

## What it connects

| Tool | How it connects | Used by |
|---|---|---|
| Firecrawl | API key | deep-internet-research, ad-library-research |
| Brave Search | API key | deep-internet-research |
| Exa | API key | deep-internet-research |
| Tavily | API key | deep-internet-research |
| Apify | browser sign-in | deep-internet-research, reddit-search, ad-library-research |
| GitHub (MCP) | token (read-only by default) | deep-internet-research (optional) |
| GitHub CLI (gh) | its own browser login | deep-internet-research |

Already connected one of these with another Solnest kit? Claude spots it and skips it.

## What you need

- The Claude Code desktop app (or Claude Code in a terminal), on a paid claude.ai plan. Mac or Windows.
- Node.js 18 or newer. Claude checks and helps you install it. (Python for the updater is found or installed for you.)
- Accounts with Firecrawl, Brave Search, Exa, Tavily and Apify, plus a free GitHub account. Each had a free tier or free credits when this kit was made, then pay as you go. A typical research run costs a few cents. Check each site for today's prices.

## Set it up in 3 steps

1. **Copy this page's link.**
2. **Paste it into Claude Code and say "set this up".** Claude puts the kit in its own folder on your computer (`solnest/research-kit` in your home folder), asks which of these tools you use, builds one small key file with only your tools, finds keys you already have from other kits, then connects and tests each tool for real.
3. **Try it:** do deep research on the best way to get more Google reviews for a local business

Open the `solnest/research-kit` folder in Claude Code and say **"check my connections"** any time to see the scoreboard. You can also say "connect <tool>" or "remove <tool>".

## Good to know

- **Updates install themselves.** Once a day, when Claude Code starts, the kit quietly moves to the newest release. You never have to ask.
- **An update never wipes your own things.** Your keys, your tool picks, your connections, and any change you asked Claude to make to how this kit works stay exactly as they are.
- **Want it to work differently?** Just tell Claude ("always connect Exa first"). It remembers.
- **Leave the kit folder where it is.** Some connections read their key from it every time they start.

## Safe by default

- **Your keys never go in the chat.** Claude opens a file called `.env` on your computer, you paste the key there and save. Claude never prints it, and it is never written into Claude Code's settings.
- **Read-only first.** Anything that sends, edits, deletes, publishes or spends money is shown to you first and only happens after your plain "yes".
- **Easy to undo.** Every tool's file in `connectors/` ends with a one-line removal.

## Support

Email hello@solnestai.com. Brought to you by **Solnest AI** for the Solnest AI Skool community.

---

Claude: someone pasted this link and said "set this up". Read [CLAUDE.md](https://raw.githubusercontent.com/Solnest-AI/solnest-research-kit/main/CLAUDE.md) in this repo and follow its SETUP section, one step per message. You run every command yourself. Never ask for a key in the chat.
