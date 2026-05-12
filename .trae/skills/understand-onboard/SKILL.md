---
name: understand-onboard
description: Generate a comprehensive onboarding guide for new team members from the project's knowledge graph. Use when user wants to create onboarding docs, prepare a team guide, or summarize a codebase for newcomers.
---

# /understand-onboard

Generate a comprehensive onboarding guide from the project's knowledge graph.

## Instructions

1. Check that `.understand-anything/knowledge-graph.json` exists.

2. Read project metadata (name, description, languages, frameworks).

3. Read architectural layers to structure the guide.

4. Read the guided tour for the recommended learning path.

5. Read file-level nodes only (skip function/class level for high-level overview).

6. Identify complexity hotspots from highest complexity values.

7. Generate the onboarding guide with:
   - **Project Overview**: name, languages, frameworks, description
   - **Architecture Layers**: each layer's name, description, and key files
   - **Key Concepts**: important patterns and design decisions
   - **Guided Tour**: step-by-step walkthrough
   - **File Map**: what each key file does, organized by layer
   - **Complexity Hotspots**: areas to approach carefully

8. Format as clean markdown.

9. Offer to save the guide to `docs/ONBOARDING.md`.

10. Suggest the user commit it to the repo for the team.