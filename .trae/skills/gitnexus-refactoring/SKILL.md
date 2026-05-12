---
name: gitnexus-refactoring
description: Safe refactoring with GitNexus. Use when renaming, extracting, splitting, moving, or restructuring code safely. Examples: "Rename this function", "Extract this into a module", "Split this service".
---

# Refactoring with GitNexus

## When to Use

- "Rename this function safely"
- "Extract this into a module"
- "Split this service"
- "Move this to a new file"
- Any task involving renaming, extracting, splitting, or restructuring code

## Workflow

```
1. Map dependents    → npx gitnexus impact <symbol> (direction: upstream)
2. Find flows        → npx gitnexus query "<symbol>"
3. See full context  → npx gitnexus context <symbol>
4. Plan: interfaces → implementations → callers → tests
```

> If "Index is stale" → run `npx gitnexus analyze` in terminal.

## Checklists

### Rename Symbol

```
- [ ] Run npx gitnexus impact <symbol> — map all dependents
- [ ] Plan rename scope: all files that reference this symbol
- [ ] Execute rename with search-and-replace across all files
- [ ] Run npx gitnexus detect-changes — verify only expected files changed
- [ ] Run tests for affected processes
```

### Extract Module

```
- [ ] Run npx gitnexus context <target> — see all incoming/outgoing refs
- [ ] Run npx gitnexus impact <target> — find all external callers
- [ ] Define new module interface
- [ ] Extract code, update imports
- [ ] Run npx gitnexus detect-changes — verify affected scope
- [ ] Run tests for affected processes
```

### Split Function/Service

```
- [ ] Run npx gitnexus context <target> — understand all callees
- [ ] Group callees by responsibility
- [ ] Run npx gitnexus impact <target> — map callers to update
- [ ] Create new functions/services, update callers
- [ ] Run npx gitnexus detect-changes — verify affected scope
- [ ] Run tests for affected processes
```

## Risk Rules

| Risk Factor | Mitigation |
|-------------|-----------|
| Many callers (>5) | Use systematic search-and-replace across all files |
| Cross-area refs | Use detect-changes after to verify scope |
| String/dynamic refs | Use gitnexus query to find them |
| External/public API | Version and deprecate properly |