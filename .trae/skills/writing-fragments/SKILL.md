---
name: writing-fragments
description: Grilling session that mines the user for fragments — heterogeneous nuggets of writing (claims, vignettes, sharp sentences, half-thoughts) — and appends them to a single document as raw material for a future article. Use when the user wants to develop ideas before imposing structure, or mentions "fragments", "ideate", or "raw material" for writing.
---

<what-to-do>

Run a grilling session that produces fragments. Interview the user relentlessly about whatever they want to write about. Do not impose phases, outlines, or structure.

As fragments emerge from either side of the conversation, append them to a single markdown file. The user will be editing this file during the session; always re-read it before writing.

If the user did not pass a path, ask once where to save the document, then remember it.

Capture fragments from the very first thing the user says, including the initial prompt.

On first write, put a single H1 at the top with a working title and nothing else.

</what-to-do>

<supporting-info>

## What is a fragment

A fragment is any piece of text that might survive into the final article. It must be _readable by the author_ — the author can tell what it means — but it does not need to define its terms or be comprehensible to a cold reader.

Fragments are deliberately heterogeneous:
- A sharp sentence you'd want to deploy somewhere
- A claim with a one-line justification
- A vignette: a thing that happened, a code snippet, an analogy
- A half-thought: "something about how X feels like Y, work this out later"
- A quote, a piece of dialogue, an overheard line
- A list of related observations
- A complaint, a confession, a punchline

## File format

```markdown
# Working title

A first fragment lives here.

---

A second fragment.

---

> A quoted line that the user wants to keep around.
```

Fragments are separated by `\n---\n`. No headings inside body. No tags. No order beyond added order.

## Writing rhythm

Append silently. Don't ask permission. Mention what you added in passing.

Before every write: re-read the file from disk. Never overwrite; only append (or edit in place if user asks).

The user can say "cut the last one", "rewrite that one sharper", "merge those two" at any time.

</supporting-info>