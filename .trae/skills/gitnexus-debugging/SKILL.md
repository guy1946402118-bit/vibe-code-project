---
name: gitnexus-debugging
description: Debug bugs and trace errors through GitNexus code intelligence. Use when debugging, tracing an error, or asking "Why is X failing?", "Where does this error come from?", "Trace this bug".
---

# Debugging with GitNexus

## When to Use

- "Why is this function failing?"
- "Trace where this error comes from"
- "Who calls this method?"
- "This endpoint returns 500"
- Investigating bugs, errors, or unexpected behavior

## Workflow

```
1. Query error/symptom  → npx gitnexus query "<error or symptom>"
2. Get suspect context   → npx gitnexus context <suspect_symbol>
3. Trace execution flow  → Read .gitnexus/processes.md
4. Custom call traces    → npx gitnexus cypher "MATCH path..."  (if needed)
```

> If "Index is stale" → run `npx gitnexus analyze` in terminal.

## Checklist

```
- [ ] Understand the symptom (error message, unexpected behavior)
- [ ] Run npx gitnexus query for error text or related code
- [ ] Identify suspect function from returned processes
- [ ] Run npx gitnexus context <symbol> to see callers and callees
- [ ] Read .gitnexus/processes.md to trace execution flow
- [ ] Use npx gitnexus cypher for custom call chain traces if needed
- [ ] Read source files to confirm root cause
```

## Debugging Patterns

| Symptom | Approach |
|---------|----------|
| Error message | `npx gitnexus query "<error text>"` → context on throw sites |
| Wrong return value | `npx gitnexus context <fn>` → trace callees for data flow |
| Intermittent failure | `npx gitnexus context <fn>` → look for external calls, async deps |
| Performance issue | `npx gitnexus context <fn>` → find symbols with many callers (hot paths) |
| Recent regression | `npx gitnexus detect-changes` to see what your changes affect |