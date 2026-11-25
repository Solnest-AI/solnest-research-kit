# How the browser sign-in connections work (shared by most connectors)

Most tools in this kit run an OFFICIAL remote MCP server. You sign in through your browser once. No key is copied, pasted, or stored by you. The tool's own login decides what Claude can see.

There are two ways to add one. Claude picks the right one for you.

## Path A: Claude Code desktop app (most members)
Claude cannot click this for you. It takes about a minute per tool.
1. Click the **+** next to the message box, then **Connectors**, then **Manage connectors**.
2. Click **+ Add** (top right), then **Add custom connector**.
3. Type the name and paste the server URL from the connector file. Click **Continue**.
4. A browser tab opens. Sign in to the tool and approve. Use the account that owns the data you want Claude to see.
5. Come back and tell Claude "connected".

If the tools do not show up in this chat, open a new chat in the same folder and say "verify my connections". New connectors sometimes only appear in new chats.

To remove: same screen (+ > Connectors > Manage connectors), remove the connector.

## Path B: Claude Code in a terminal
Claude runs the register command for you (it adds the server for all your projects):
```
node scripts/register.mjs <name>
```
Then type `/mcp` in Claude Code, pick the server, choose **Authenticate**, and finish the sign-in in your browser.

To remove: `node scripts/register.mjs <name> --remove`. To sign out without removing it: `/mcp`, pick the server, **Clear authentication**.

## Either way
- Signing in grants access to YOUR account only. Revoke it any time from the tool's own settings (each connector file says where).
- Claude only reads until you say otherwise. Anything that creates, edits, sends, deletes, publishes, or spends money needs your plain "yes" in the chat first.
