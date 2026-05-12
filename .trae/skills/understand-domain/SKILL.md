---
name: understand-domain
description: Extract business domain knowledge from a codebase and generate an interactive domain flow graph. Use when user wants to understand business logic, map domains to code, or analyze business processes.
argument-hint: "[--full]"
---

# /understand-domain

Extracts business domain knowledge — domains, business flows, and process steps — from a codebase.

## How It Works

- If a knowledge graph already exists, derives domain knowledge from it (cheap, no file scanning)
- If no knowledge graph exists, performs a lightweight scan
- Use `--full` flag to force a fresh scan

## Pipeline

1. **Phase 0**: Resolve project root and handle git worktree redirect
2. **Phase 1**: Detect existing knowledge graph
3. **Phase 2** (No graph): Lightweight scan — file tree + entry point detection
4. **Phase 3** (Has graph): Derive from existing graph nodes/edges
5. **Phase 4**: Domain analysis — extract domains, flows, process steps
6. **Phase 5**: Validate and save to `domain-graph.json`
7. **Phase 6**: Launch dashboard with domain view

## Output

Saves to `.understand-anything/domain-graph.json` with domains, flows, and process steps mapped to actual code locations.