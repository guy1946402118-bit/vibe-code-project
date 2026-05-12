---
name: understand-explain
description: Deep-dive explanation of a specific file, function, or module in the codebase using the knowledge graph. Use when user asks "explain this code", wants to understand a component deeply, or needs context about a specific file.
argument-hint: "[file-path]"
---

# /understand-explain

Provide a thorough, in-depth explanation of a specific code component.

## Instructions

1. Check that `.understand-anything/knowledge-graph.json` exists.

2. Find the target node by searching the knowledge graph for the component path/name.

3. Find all connected edges:
   - `source` matches → things this node calls/imports/depends on (outgoing)
   - `target` matches → things that call/import/depend on this node (incoming)

4. Read connected nodes to build the component's neighborhood.

5. Identify the architectural layer the node belongs to.

6. Read the actual source file for the deep-dive analysis.

7. Explain the component in context:
   - Its role in the architecture (which layer, why it exists)
   - Internal structure (functions, classes it contains)
   - External connections (what it imports, what calls it)
   - Data flow (inputs → processing → outputs)
   - Highlight any patterns, idioms, or complexity worth understanding