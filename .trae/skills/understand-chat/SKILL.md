---
name: understand-chat
description: Ask questions about a codebase using the knowledge graph. Use when user wants to query a codebase's structure, find relevant files/functions, or explore relationships in an analyzed project.
argument-hint: "[query]"
---

# /understand-chat

Answer questions about this codebase using the knowledge graph at `.understand-anything/knowledge-graph.json`.

## Graph Structure Reference

The knowledge graph JSON has this structure:
- `project` — {name, description, languages, frameworks, analyzedAt, gitCommitHash}
- `nodes[]` — each has {id, type, name, filePath, summary, tags[], complexity, languageNotes?}
  - Node types: file, function, class, module, concept
  - IDs: `file:path`, `function:path:name`, `class:path:name`
- `edges[]` — each has {source, target, type, direction, weight}
  - Key types: imports, contains, calls, depends_on
- `layers[]` — each has {id, name, description, nodeIds[]}
- `tour[]` — each has {order, title, description, nodeIds[]}

## How to Read Efficiently

1. Use Grep to search within the JSON for relevant entries BEFORE reading the full file
2. Only read sections you need — don't dump the entire graph into context
3. Node names and summaries are the most useful fields for understanding
4. Edges tell you how components connect — follow imports and calls for dependency chains

## Instructions

1. Check that `.understand-anything/knowledge-graph.json` exists. If not, tell the user to run `/understand` first.

2. Read project metadata only — extract just the `"project"` section for context.

3. Search for relevant nodes matching the user's query:
   - Search `"name"` fields
   - Search `"summary"` fields
   - Search `"tags"` arrays

4. Find connected edges for each matched node — follow imports and depends_on for dependency chains.

5. Read layer context to understand architectural positioning.

6. Answer the query using only the relevant subgraph — reference specific files, functions, and relationships.