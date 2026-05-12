---
name: gitnexus-exploring
description: Understand architecture and explore codebase structure via GitNexus. Use when asking "How does X work?", exploring unfamiliar code, or understanding system architecture.
---

# Exploring Code with GitNexus

## When to Use

- "How does X work?"
- "Show me the architecture"
- "What processes involve this?"
- Exploring unfamiliar code areas

## Workflow

```
1. Query concept    → npx gitnexus query "<concept>"
2. Get context      → npx gitnexus context <symbol>
3. Trace flow       → Read .gitnexus/processes.md
4. Explore clusters → Read .gitnexus/clusters.md
```

> If "Index is stale" → run `npx gitnexus analyze` in terminal.

## Checklist

```
- [ ] npx gitnexus query for the concept
- [ ] Identify the key symbol from results
- [ ] npx gitnexus context <symbol> to see callers and callees
- [ ] Read .gitnexus/processes.md for execution flow context
- [ ] Read .gitnexus/clusters.md for functional grouping
- [ ] Read source files to confirm understanding
```

## Exploration Patterns

| Question | Approach |
|----------|----------|
| "How does auth work?" | gitnexus query "authentication" → context on key symbol → trace processes |
| "What modules exist?" | Read .gitnexus/clusters.md |
| "What calls X?" | gitnexus context <X> — focus on incoming edges |
| "What does X call?" | gitnexus context <X> — focus on outgoing edges |
| "Walk me through login" | Read .gitnexus/processes.md → follow the process steps |