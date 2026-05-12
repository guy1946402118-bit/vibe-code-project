---
name: understand-diff
description: Analyze git diffs against the knowledge graph to understand what changed, affected components, and risks. Use when user wants to review changes, analyze a PR's impact, or understand ripple effects of code modifications.
---

# /understand-diff

Analyze the current code changes against the knowledge graph.

## Instructions

1. Check that `.understand-anything/knowledge-graph.json` exists.

2. Get changed files: `git diff --name-only` (or `git diff main...HEAD --name-only`)

3. Read project metadata from the graph.

4. Find nodes for changed files — search for matching `"filePath"` values.

5. Find connected edges (1-hop) — upstream callers and downstream dependencies.

6. Identify affected architectural layers.

7. Provide structured analysis:
   - **Changed Components**: what was directly modified
   - **Affected Components**: what might be impacted
   - **Affected Layers**: cross-layer concerns
   - **Risk Assessment**: based on complexity, cross-layer edges, and blast radius

8. Write diff overlay to `.understand-anything/diff-overlay.json` for dashboard visualization.