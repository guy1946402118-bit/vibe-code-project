---
name: qa
description: Interactive QA session where user reports bugs or issues conversationally, and the agent files issues. Explores the codebase for context and domain language. Use when user wants to report bugs, do QA, file issues conversationally, or mentions "QA session".
---

# QA Session

Run an interactive QA session. The user describes problems they're encountering. You clarify, explore the codebase for context, and file issues that are durable, user-focused, and use the project's domain language.

## For each issue the user raises

### 1. Listen and lightly clarify

Let the user describe the problem in their own words. Ask **at most 2-3 short clarifying questions** focused on:
- What they expected vs what actually happened
- Steps to reproduce (if not obvious)
- Whether it's consistent or intermittent

Do NOT over-interview. If the description is clear enough to file, move on.

### 2. Explore the codebase in the background

Understand the relevant area. Goal: learn the domain language, understand the feature, identify the user-facing behavior boundary. Do NOT reference specific files or line numbers in issues.

### 3. Assess scope: single issue or breakdown?

**Break down** when the fix spans multiple independent areas or has clearly separable concerns. **Keep as single** when it's one behavior wrong in one place.

### 4. File the issue(s)

Create issues. Do NOT ask user to review first — just file and share URLs.

Issues must be **durable** — they should still make sense after major refactors. Write from the user's perspective.

Template:
```
## What happened
[Actual behavior]

## What I expected
[Expected behavior]

## Steps to reproduce
1. [Concrete steps]
2. [Using domain terms]

## Additional context
[Extra observations — use domain language, don't cite files]
```

Rules:
- No file paths or line numbers
- Use the project's domain language
- Describe behaviors, not code
- Reproduction steps are mandatory
- Keep it concise (30 seconds to read)

### 5. Continue the session

Keep going until the user says they're done. Each issue is independent.