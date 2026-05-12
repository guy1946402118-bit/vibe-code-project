---
name: gitnexus-guide
description: GitNexus tools, resources, and schema reference for code intelligence. Use when user wants to understand GitNexus capabilities, check index status, or needs reference on available commands.
---

# GitNexus Guide

Code intelligence for GrowthDashboard project (2553 symbols, 3962 relationships, 127 execution flows).

## Quick Check

```bash
npx gitnexus analyze  # Refresh index if stale
```

## Tools

| Tool | Purpose | CLI Equivalent |
|------|---------|---------------|
| Impact Analysis | Find what depends on a symbol | `npx gitnexus impact <symbol>` |
| Context | See callers/callees of a symbol | `npx gitnexus context <symbol>` |
| Query | Search code by concept | `npx gitnexus query "<concept>"` |
| Detect Changes | Map git changes to affected flows | `npx gitnexus detect-changes` |
| Rename | Safe multi-file symbol rename | `npx gitnexus rename <old> <new>` |

## Resources (File-Based)

| Resource | Location | Use for |
|----------|----------|---------|
| Context | `.gitnexus/context.md` | Codebase overview, index freshness |
| Clusters | `.gitnexus/clusters.md` | All functional areas |
| Processes | `.gitnexus/processes.md` | All execution flows |
| Cypher Shell | `npx gitnexus cypher` | Custom graph queries |

## Graph Schema

```cypher
// Node types
(:File)-[:CodeRelation]->(:Function)
(:File)-[:CodeRelation]->(:Class)
(:Function)-[:CodeRelation]->(:Function)  // calls
(:File)-[:CodeRelation]->(:File)          // imports

// Edge types
CALLS, IMPORTS, EXPORTS, CONTAINS, INHERITS, IMPLEMENTS
```