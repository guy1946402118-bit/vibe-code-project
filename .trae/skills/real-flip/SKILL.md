---
name: real-flip
description: Infinite loop task executor for autonomous research, deep exploration, and continuous iteration. Use when user wants exhaustive research, never-ending analysis, infinite optimization loops, continuous improvement cycles, or autonomous task completion that runs until explicitly stopped. Triggers on phrases like "real flip", "infinite loop", "keep searching forever", "endless research", "autonomous loop", "continuous iteration", "go deep", "exhaustive search", "never stop", "run until done", "无限循环", "持续搜索", "自主迭代".
---

# Real Flip — Autonomous Infinite Loop Engine

Executes tasks in self-improving loops until the goal is achieved or the user stops.

## Core Principles

- **Never give up**: If a search fails, try different keywords. If a tool fails, try another approach.
- **Iterate relentlessly**: Each cycle should improve on the previous one.
- **Expand scope intelligently**: When hitting a dead end, broaden or narrow the search scope.
- **Self-correct**: Detect stagnation and change strategy proactively.

## Loop Phases

### Phase 1: Goal Definition
1. Clarify the ultimate goal with the user
2. Define success criteria (when to stop)
3. Establish initial search/action strategy

### Phase 2: Research & Execute
1. Search broadly first (WebSearch, WebFetch, SearchCodebase)
2. Collect and organize findings
3. Execute actions based on findings
4. Log progress for visibility

### Phase 3: Analyze & Refine
1. Review what was found/accomplished
2. Identify gaps in knowledge or results
3. Adjust strategy: new keywords, new sources, new methods
4. Decide: continue, change direction, or declare done

### Phase 4: Loop
- If goal NOT met → go back to Phase 2 with refined strategy
- If goal IS met → present comprehensive results
- If user interrupts → present current state and ask for guidance

## Anti-Stagnation Rules

When stuck after 3+ iterations with no progress:
1. **Pivot**: Change search engine, try different languages, explore adjacent topics
2. **Deepen**: Go one level deeper into the most promising lead
3. **Broaden**: Expand beyond initial scope to find related insights
4. **Ask**: Present findings to user and ask for direction

## Progress Reporting

After every 3 iterations, provide a brief status:
- What was attempted
- What was found
- What's next
- Estimated progress toward goal (% if possible)

## Stop Conditions

- User explicitly says "stop", "done", "够了", "停止"
- Success criteria are fully met
- 20+ iterations with no meaningful progress (ask user before continuing)

## Usage Example

User says: "Real flip: research all known approaches to X and compile a comprehensive report"

The skill will:
1. Search multiple platforms (Web, GitHub, academic sources)
2. Collect and categorize all approaches
3. Iterate with refined queries until exhaustive
4. Compile a structured report with findings

## Warning

This skill can consume significant API resources. Always confirm with the user before entering a long-running loop, and respect explicit stop commands immediately.