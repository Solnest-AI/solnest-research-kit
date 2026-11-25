# Changelog

## 1.0.0

First release as its own GitHub repo.
- Install by pasting the repo link into Claude Code and saying "set this up".
- The kit lives in `solnest/research-kit` in your home folder. Setup puts it there, so connections always find their key file.
- Updates install themselves once a day, in the background, from published releases only. If a new release does not load, the old one is put back by itself.
- An update never touches your keys and tool picks (`.env`), the scoreboard's memory (`.cache/`), any file you added, or anything connected in Claude Code. Changes you ask for are kept in `~/.solnest/research-kit/my-instructions.md`.
