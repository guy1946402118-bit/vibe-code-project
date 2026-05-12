---
name: find-skills
description: Search and discover skills from skills.sh, skillsmp.com, and GitHub. Use when user wants to find new skills, search for skills by keyword, discover trending skills, or needs recommendations for skills by category or profession. Triggers on phrases like "find a skill", "search skills", "recommend skills", "discover skills", "技能搜索", "查找技能", "推荐技能".
---

# Find Skills (技能搜索器)

Search and install skills from global skill registries.

## Search Platforms

### skills.sh — The Open Agent Skills Ecosystem
- URL: https://skills.sh
- The largest global skill registry
- Install any skill with: `npx skills add <owner/repo>`
- Search by keyword, category, or popularity

### skillsmp.com — 74万+ Skills
- URL: https://skillsmp.com
- Filter by profession/role
- Supports category browsing and trending rankings

## Workflow

When the user wants to find a skill:

1. **Understand the need**: What capability does the user want? What task should the skill handle?
2. **Search platforms**: Use `WebFetch` to search skills.sh with relevant keywords, or suggest the user browse skillsmp.com
3. **Evaluate results**: Check star ratings, download counts, and last-updated dates
4. **Install the best match**: Run `npx skills add <owner/repo>` to install
5. **Verify**: Confirm the skill was installed and works correctly

## Installation Commands

```bash
# Install from skills.sh registry
npx skills add <owner/repo>

# Install from GitHub directly
git clone <repo-url> .trae/skills/<skill-name>
```

## Alternative: Manual Search

If npx is unavailable, search GitHub directly:
1. Go to https://github.com/topics/claude-skill
2. Go to https://github.com/topics/trae-skill
3. Search: `skill-creator`, `code-review`, `doc-generator`, etc.