---
name: gitnexus-impact-analysis
description: Impact analysis before editing code. Use when asking "What will break if I change X?", "Is it safe to modify this?", or before any non-trivial code change.
---

# Impact Analysis with GitNexus

## When to Use

- "Is it safe to change this function?"
- "What will break if I modify X?"
- "Show me the blast radius"
- Before making non-trivial code changes
- Before committing — to understand what your changes affect

## Workflow

```
1. Impact blast radius  → npx gitnexus impact <symbol>
2. Check affected flows → Read .gitnexus/processes.md
3. Detect git changes   → npx gitnexus detect-changes
4. Assess risk → report to user
```

> If "Index is stale" → run `npx gitnexus analyze` in terminal.

## Checklist

```
- [ ] Run npx gitnexus impact <symbol> to find dependents
- [ ] Review d=1 items first (these WILL BREAK)
- [ ] Check high-confidence (>0.8) dependencies
- [ ] Read .gitnexus/processes.md to check affected flows
- [ ] Run npx gitnexus detect-changes for pre-commit check
- [ ] Assess risk level and report to user
```

## Risk Assessment

| Depth | Risk | Meaning |
|-------|------|---------|
| d=1 | WILL BREAK | Direct callers/importers |
| d=2 | LIKELY AFFECTED | Indirect dependencies |
| d=3 | MAY NEED TESTING | Transitive effects |

## Risk Level

| Affected | Risk |
|----------|------|
| <5 symbols, few processes | LOW |
| 5-15 symbols, 2-5 processes | MEDIUM |
| >15 symbols or many processes | HIGH |
| Critical path (auth, payments) | CRITICAL |