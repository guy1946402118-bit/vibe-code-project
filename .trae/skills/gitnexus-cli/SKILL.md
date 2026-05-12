---
name: gitnexus-cli
description: GitNexus CLI commands reference — index, status, clean, wiki generation. Use when user needs to manage GitNexus itself (not analyze code).
---

# GitNexus CLI

## Essential Commands

```bash
# Analyze and index the project
npx gitnexus analyze

# Skip git operations (sandboxed environments)
npx gitnexus analyze --skip-git

# Check index status
npx gitnexus status

# Regenerate wiki/documentation files
npx gitnexus wiki

# Clean generated files
npx gitnexus clean
```

## When to Re-index

Run `npx gitnexus analyze` when:
- New files or functions added
- Major refactoring completed
- Dependencies changed
- AGENTS.md or any generated doc looks outdated

## Output Files

| File | Content |
|------|---------|
| `.gitnexus/main.graph.json` | Full knowledge graph |
| `.gitnexus/context.md` | Codebase overview |
| `.gitnexus/clusters.md` | Functional areas |
| `.gitnexus/processes.md` | Execution flows |
| `AGENTS.md` (updated) | Auto-injected project rules |