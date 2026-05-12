---
name: understand
description: Analyze a codebase to produce an interactive knowledge graph for understanding architecture, components, and relationships. Use when user wants to understand a codebase, explore architecture, generate a knowledge graph, or says "understand this project".
---

# /understand

Analyze the current codebase and produce a `knowledge-graph.json` file.

## Overview

This skill orchestrates a multi-agent pipeline that scans the project, extracts every file/function/class/dependency, and builds a knowledge graph saved to `.understand-anything/knowledge-graph.json`.

## Pipeline Phases

1. **Phase 0 - Pre-flight**: Resolve project root, check git commit hash, handle incremental updates
2. **Phase 1 - SCAN**: Discover project files, detect languages and frameworks
3. **Phase 2 - ANALYZE**: Extract functions, classes, imports from each file (batched, parallel)
4. **Phase 3 - ASSEMBLE REVIEW**: Validate graph completeness
5. **Phase 4 - ARCHITECTURE**: Identify architectural layers
6. **Phase 5 - TOUR**: Generate guided learning tours
7. **Phase 6 - REVIEW**: Validate and fix graph issues
8. **Phase 7 - SAVE**: Write final knowledge graph and metadata

## Node Types (13)

| Type | Description |
|------|-------------|
| `file` | Source code file |
| `function` | Function or method |
| `class` | Class, interface, or type |
| `module` | Logical module or package |
| `concept` | Abstract concept or pattern |
| `config` | Configuration file |
| `document` | Documentation file |
| `service` | Deployable service definition |
| `table` | Database table or migration |
| `endpoint` | API endpoint or route |
| `pipeline` | CI/CD pipeline config |
| `schema` | Schema definition |
| `resource` | Infrastructure resource |

## Edge Types (26)

Structural: `imports`, `exports`, `contains`, `inherits`, `implements`
Behavioral: `calls`, `subscribes`, `publishes`, `middleware`
Data flow: `reads_from`, `writes_to`, `transforms`, `validates`
Dependencies: `depends_on`, `tested_by`, `configures`
Semantic: `related`, `similar_to`
Infrastructure: `deploys`, `serves`, `provisions`, `triggers`
Schema/Data: `migrates`, `documents`, `routes`, `defines_schema`

## Options

- `--full` — Force a full rebuild
- `--auto-update` — Enable automatic graph updates on commit
- `--no-auto-update` — Disable automatic graph updates
- `--review` — Run full LLM graph-reviewer

## Output

Final graph written to `.understand-anything/knowledge-graph.json` with metadata at `.understand-anything/meta.json`.

## Usage in Trae

This is a Claude Code-native skill. In Trae IDE, use the installed `understand-anything` tool via its PowerShell installer to run the full pipeline. This SKILL.md serves as a reference for the graph schema and pipeline architecture.