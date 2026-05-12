---
name: review
description: Review changes since a fixed point along two axes — Standards (code conforms to repo standards?) and Spec (code matches originating issue/PRD?). Runs both reviews in parallel and reports them side by side. Use when user wants to review a branch, PR, work-in-progress changes, or asks to "review since X".
---

# Review

Two-axis review of the diff between `HEAD` and a fixed point:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context.

## Process

### 1. Pin the fixed point

Whatever the user said — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If unspecified, ask.

Capture: `git diff <fixed-point>...HEAD` (three-dot) and `git log <fixed-point>..HEAD --oneline`.

### 2. Identify the spec source

Look for:
1. Issue references in commit messages (`#123`, `Closes #45`)
2. A path the user passed as an argument
3. A PRD/spec file under `docs/`, `specs/`, or `.scratch/`
4. If nothing found, ask. If no spec, Spec sub-agent skips.

### 3. Identify the standards sources

Anything documenting code standards: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CONTEXT.md`, `docs/adr/`, `.editorconfig`, `tsconfig.json` (skip what tooling enforces).

### 4. Spawn both sub-agents in parallel

**Standards**: Read standards docs → read diff → report per file/hunk violations. Cite the standard. Distinguish hard violations from judgement calls.

**Spec**: Read spec → read diff → report: (a) missing/partial requirements, (b) scope creep, (c) wrong implementation. Quote spec lines.

### 5. Aggregate

Present under `## Standards` and `## Spec` headings. Do NOT merge findings — keep axes separate.

## Why two axes

A change can pass one axis and fail the other:
- Code that follows standards but implements wrong thing → Standards pass, Spec fail.
- Code that does exactly what's asked but breaks conventions → Spec pass, Standards fail.