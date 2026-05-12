---
name: git-guardrails-claude-code
description: Set up hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute. Use when user wants to prevent destructive git operations, add git safety hooks, or block git push/reset.
---

# Setup Git Guardrails

Sets up a PreToolUse hook that intercepts and blocks dangerous git commands.

## What Gets Blocked

- `git push` (all variants including `--force`)
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .` / `git restore .`

When blocked, the agent sees a message telling it that it does not have authority to access these commands.

## Steps

1. **Ask scope** — install for this project only or all projects?

2. **Copy the hook script** — copy `block-dangerous-git.sh` to the target location, make it executable with `chmod +x`.

3. **Add hook to settings** — add PreToolUse hook configuration to the appropriate settings file. If the settings file already exists, merge the hook into existing hooks array.

4. **Ask about customization** — ask if user wants to add or remove any patterns from the blocked list.

5. **Verify** — run a quick test with `echo '{"tool_input":{"command":"git push origin main"}}' | <path-to-script>` — should exit with code 2 and print BLOCKED message.