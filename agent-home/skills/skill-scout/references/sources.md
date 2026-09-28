# Where to look

A listing is a lead, not evidence. Nothing here is trustworthy until it passes the
usefulness gate in `SKILL.md` and the vetting in `vetting.md`. Rankings by installs or
stars are discovery aids only.

## 1. This repository's catalog

`references/catalog.md` first, always. If a proven, project-agnostic skill already covers
the need, install that instead of searching.

## 2. Registries and marketplaces

| Source | How |
| --- | --- |
| skills.sh | `npx skills find [query] [--owner <owner>]`; browse the leaderboard at <https://skills.sh/> |
| agenticskills.io | <https://agenticskills.io/skills/find-skills>; its `find-skills` flow is a discovery helper, not a vetting step |
| autoskills.sh | <https://www.autoskills.sh/> |
| MCP Market | <https://mcpmarket.com/tools/skills> |

`npx skills` also manages the lifecycle once something is chosen:
`npx skills add <package>`, `npx skills check`, `npx skills update`.

## 3. Awesome lists and curated collections

- <https://github.com/VoltAgent/awesome-agent-skills>
- <https://github.com/ComposioHQ/awesome-claude-skills>

These list volume, not quality. Expect to reject most entries on the novelty question alone.

## 4. Official and vendor repositories

Usually the best signal-to-noise, because a named organization maintains them:

- `anthropics/skills`
- `vercel-labs/agent-skills`
- `microsoft/*` skill repositories

## 5. GitHub search

- Code search for `filename:SKILL.md` together with the domain keyword.
- Topic search: `topic:agent-skills`, `topic:claude-skills`.
- Repository search sorted by **recently updated** rather than stars, then check the last
  commit date, open issues, and whether an issue ever got a reply.

## 6. Independently reported usage

Outside the marketplace entirely, and the most valuable evidence:

- X/Twitter, Reddit, Stack Overflow, Hacker News, and newsletters discussing **that exact
  skill**, not the category.
- Other repositories that vendor or fork it.
- Issue threads where users, not the author, report what happened when they used it.

Absence of outside evidence is a reason to skip a candidate, not a reason to install it and
find out.
