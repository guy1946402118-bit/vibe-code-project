---
name: ubiquitous-language
description: Extract a DDD-style ubiquitous language glossary from the current conversation, flagging ambiguities and proposing canonical terms. Saves to UBIQUITOUS_LANGUAGE.md. Use when user wants to define domain terms, build a glossary, harden terminology, create a ubiquitous language, or mentions "domain model" or "DDD".
disable-model-invocation: true
---

# Ubiquitous Language

Extract and formalize domain terminology from the current conversation into a consistent glossary, saved to a local file.

## Process

1. **Scan the conversation** for domain-relevant nouns, verbs, and concepts
2. **Identify problems**:
   - Same word used for different concepts (ambiguity)
   - Different words used for the same concept (synonyms)
   - Vague or overloaded terms
3. **Propose a canonical glossary** with opinionated term choices
4. **Write to `UBIQUITOUS_LANGUAGE.md`** in the working directory
5. **Output a summary** inline in the conversation

## Output Format

Write `UBIQUITOUS_LANGUAGE.md` with:

```md
# Ubiquitous Language

## [Natural group name]

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Term** | One-sentence definition | synonyms, old names |

## Relationships

- An **X** belongs to exactly one **Y**

## Example dialogue

> **Dev:** "..."
> **Domain expert:** "..."

## Flagged ambiguities

- "account" was used to mean both **Customer** and **User** — distinct concepts.
```

## Rules

- **Be opinionated.** When multiple words exist, pick the best one.
- **Flag conflicts explicitly.**
- **Only include terms relevant for domain experts.**
- **Keep definitions tight.** One sentence max.
- **Show relationships.** Use bold term names.
- **Group terms into multiple tables** when natural clusters emerge.
- **Write an example dialogue.** 3-5 exchanges demonstrating how terms interact naturally.