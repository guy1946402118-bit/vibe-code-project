---
name: request-refactor-plan
description: Create a detailed refactor plan with tiny commits via user interview, then file it as an issue. Use when user wants to plan a refactor, create a refactoring RFC, or break a refactor into safe incremental steps.
---

This skill will be invoked when the user wants to create a refactor request. Go through the steps below. You may skip steps if not necessary.

1. Ask the user for a long, detailed description of the problem they want to solve and any potential ideas for solutions.

2. Explore the repo to verify their assertions and understand the current state of the codebase.

3. Ask whether they have considered other options, and present other options to them.

4. Interview the user about the implementation. Be extremely detailed and thorough.

5. Hammer out the exact scope of the implementation. Work out what you plan to change and what you plan not to change.

6. Check for test coverage of this area. If insufficient, ask about testing plans.

7. Break the implementation into a plan of tiny commits. Remember: "make each refactoring step as small as possible, so that you can always see the program working."

8. Create an issue with the refactor plan using this template:

```
## Problem Statement
The problem that the developer is facing, from the developer's perspective.

## Solution
The solution to the problem, from the developer's perspective.

## Commits
A detailed implementation plan in plain English, breaking down the implementation into the tiniest commits possible. Each commit should leave the codebase in a working state.

## Decision Document
Implementation decisions including modules, interfaces, technical clarifications, architectural decisions, schema changes, API contracts. Do NOT include specific file paths or code snippets.

## Testing Decisions
Includes what makes a good test, which modules will be tested, and prior art for the tests.

## Out of Scope
Things that are out of scope for this refactor.
```