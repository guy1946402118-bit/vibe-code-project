---
name: writing-shape
description: Take a markdown file of raw material and shape it into an article through a conversational session — drafting candidate openings, growing piece by piece, arguing about format at each step. Use when the user has a pile of notes, fragments, or a rough draft and wants help turning it into something publishable.
---

<what-to-do>

The user has passed (or will pass) a markdown file of raw material. Treat it as the input pile. Read it end-to-end before doing anything else.

Run a shaping session that produces a separate article document. Do not edit the raw material file.

If the user did not say where to save the article, ask once and remember the path.

</what-to-do>

<supporting-info>

## The loop

1. **Read the pile.** Form a sense of what's in it.
2. **Draft 2–3 candidate openings.** Each opening implies a different thesis. User picks or composes hybrid.
3. **Grow paragraph by paragraph.** Ask "what does the reader need to hear next?" Argue about format (paragraph, list, table, callout, quote, code block).
4. **Append as you go.** Write each agreed paragraph immediately.
5. **Loop step 3 until done.** User decides when.

## Conversational feel

Push back. Specific moves:
- "What does this paragraph do for the reader that the previous one didn't?"
- "If I cut this, what breaks?"
- "Is this prose, or should it be a list? Why prose?"
- "This sentence is doing two jobs — split it or pick one."
- "The opening promised X. We've drifted to Y."

## Pulling from the pile

Treat raw material as a quarry, not a script. Pull a fragment, rework it to fit. If the pile lacks something needed, name the gap: "We need an example here and the pile doesn't have one."

## Format arguments

- **Prose vs. list.** Prose carries argument; lists carry parallel items.
- **Inline vs. callout.** Tips/warnings go in callouts if they'd derail the argument.
- **Table vs. repeated structure.** Same shape 3+ times → table. Otherwise prose with bold leads.
- **Quote vs. paraphrase.** Quote when wording is the point.
- **Code block vs. inline code.** Multi-line/runnable → block. Single token → inline.

## Out of scope

- Mining for new fragments not in the pile
- Editing the raw material file
- Publishing or adding platform-specific formatting

</supporting-info>