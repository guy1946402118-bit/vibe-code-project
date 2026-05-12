---
name: setup-matt-pocock-skills
description: Sets up per-repo configuration for engineering skills (issue tracker, triage labels, domain docs). Run before first use of to-issues, to-prd, triage, diagnose, tdd, improve-codebase-architecture, or zoom-out.
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker** — where issues live (GitHub by default; local markdown also supported)
- **Triage labels** — the strings used for the five canonical triage roles
- **Domain docs** — where `CONTEXT.md` and ADRs live

This is a prompt-driven skill. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo:

- `git remote -v` — is this a GitHub repo? Which one?
- `AGENTS.md` and `CLAUDE.md` — does either exist?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/` — does prior output exist?

### 2. Present findings and ask

Walk the user through three decisions **one at a time**:

**Section A — Issue tracker.** Where issues live. Default: GitHub if remote points there.

**Section B — Triage label vocabulary.** The five canonical roles mapped to actual labels:
- `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`

**Section C — Domain docs.** Single-context (one `CONTEXT.md`) or multi-context (`CONTEXT-MAP.md`).

### 3. Write

Add `## Agent skills` block to `CLAUDE.md`/`AGENTS.md`, and create `docs/agents/` files for the decided configuration.