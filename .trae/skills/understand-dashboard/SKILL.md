---
name: understand-dashboard
description: Launch the interactive web dashboard to visualize a codebase's knowledge graph. Use when user wants to explore the graph visually, see architecture layers, or navigate code relationships in the browser.
argument-hint: "[project-path]"
---

# /understand-dashboard

Start the Understand Anything dashboard to visualize the knowledge graph.

## Instructions

1. Check that `.understand-anything/knowledge-graph.json` exists. If not, tell the user to run `/understand` first.

2. Find the dashboard code at the installed plugin's `packages/dashboard/` directory.

3. Install dependencies and build if needed:
   ```bash
   pnpm install && pnpm --filter @understand-anything/core build
   ```

4. Start the Vite dev server pointing at the project's knowledge graph:
   ```bash
   GRAPH_DIR=<project-dir> npx vite --host 127.0.0.1
   ```

5. Share the dashboard URL (including the `?token=` parameter) with the user.

## Notes

- The `GRAPH_DIR` environment variable tells the dashboard where to find the knowledge graph
- If port 5173 is in use, Vite will pick the next available port