---
name: understand-knowledge
description: Analyze a Karpathy-pattern LLM wiki knowledge base and generate an interactive knowledge graph with entity extraction, implicit relationships, and topic clustering. Use when user wants to analyze an LLM wiki, build a knowledge graph from markdown notes, or explore a Karpathy-style knowledge base.
argument-hint: "[wiki-directory]"
---

# /understand-knowledge

Analyzes a Karpathy-pattern LLM wiki — a three-layer knowledge base with raw sources, wiki markdown, and a schema file — and produces an interactive knowledge graph dashboard.

## Karpathy LLM Wiki Pattern

- **Raw sources** — immutable source documents (articles, papers, data files)
- **Wiki** — LLM-generated markdown files with wikilinks (`[[target]]` syntax)
- **Schema** — CLAUDE.md, AGENTS.md, or similar configuration file
- **index.md** — content catalog organized by categories
- **log.md** — chronological operation log

Detection signals: has `index.md` + multiple `.md` files with wikilinks.

## Pipeline

1. **Phase 1 - DETECT**: Run `parse-knowledge-base.py` to detect wiki structure
2. **Phase 2 - SCAN** (done by parse script): Extract article/source/topic nodes from index.md
3. **Phase 3 - ANALYZE**: Dispatch article-analyzer subagents to extract implicit knowledge (entities, claims, cross-references)
4. **Phase 4 - MERGE**: Combine scan results + LLM analysis → assembled graph
5. **Phase 5 - SAVE**: Write knowledge graph and launch dashboard

## Output

Knowledge graph saved to `.understand-anything/knowledge-graph.json` with:
- Article nodes, source nodes, topic nodes
- `related` edges (from wikilinks), `categorized_under` edges (from index.md)
- Entity nodes and claim edges from LLM analysis
- Force-directed graph layout in dashboard