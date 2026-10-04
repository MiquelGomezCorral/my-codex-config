---
name: agents-memory
description: Human-facing main agent only. Read and maintain private project working memory shared by Git worktrees; initialize it with `/init`. Delegated agents report memory suggestions to their parent instead of using this skill.
---

# Agents Memory

Only the agent directly interacting with the human uses this skill. Delegated agents do
not load it, browse private memory, or write memory. An exact plan supplied as task input
is allowed; it does not grant access to other notes. Delegates return useful memory
candidates to the human-facing agent to assess.

Keep existing repository `AGENTS.md` and tracked `.agents/` files as project context.
New personal working memory and plans live outside every worktree, under the Git common
directory shared by linked worktrees:

```text
$(git rev-parse --path-format=absolute --git-common-dir)/agent-memory/
  architecture.md  conventions.md  decisions.md  glossary.md
  workflow.md      known-errors.md  requirements.md
  plans/
```

Resolve the directory from the current worktree each time; do not assume `.git` is a
directory in a linked worktree. The private directory is local to one clone, not shared
with separate clones or computers. Do not copy or symlink it into a worktree. If Git
cannot resolve a common directory, report that shared private memory is unavailable;
never silently put new private notes in a tracked path.

## Use When

- The user runs `/init` or asks to initialize project memory.
- Starting repository work as the human-facing agent: read relevant existing project
  context and any private notes already present.
- The user asks to set up, inspect, or update private agent memory.
- A repeated project convention, decision, workflow, glossary term, or known error should be proposed for memory.

## Ownership

Private `decisions.md` records the human's preferences about agent work and how to work
in this project. Shared product and architecture decisions belong to the separate
`decision-records` skill under `docs/decisions/`. Do not duplicate them here.
The human-facing agent owns private writes, including candidates returned by workers.
Read-only tasks may read existing notes but never initialize the directory.

## Bootstrap Workflow

1. Inspect the current project, including existing `AGENTS.md`, `.agents/`, and decision
   records. Preserve all existing tracked files and their history.
2. On `/init`, or the first authorized private memory write, create `agent-memory/` in the
   resolved Git common directory. Create only needed topical files from `templates/`;
   create `plans/` when persisting a plan. Do not initialize during read-only discovery.
3. Create `AGENTS.md` from `templates/AGENTS.md` only when the project has no agent
   instructions and the user requested initialization. Never replace an existing one.
4. Replace placeholders with observed facts. Do not invent conventions, decisions, or
   commands. Summarize created files and missing information.

## Operating Rules

- Read `AGENTS.md` first in projects that have it.
- Lazy-load relevant tracked `.agents/*` and private `agent-memory/*` by need; do not read
  everything by default. An absent private directory is normal.
- Follow repository instructions and shared decision records. Apply later private agent
  preferences only within those bounds; flag conflicts with tracked memory.
- If code contradicts memory, trust the current code and flag the memory entry as stale.
- New agent-memory updates go only to the private directory. During normal work, propose
  updates unless the user authorized them directly or in an approved workflow. Never
  alter tracked `.agents/` merely to keep private memory current.

## Trigger Map

| Situation | Read or update |
|---|---|
| Navigating repo or changing module boundaries | `architecture.md` |
| Writing code | `conventions.md` |
| Agent-work preference or decision | `decisions.md` |
| Human-stated wants for agent work | `requirements.md` |
| Project-specific acronym, domain term, entity | `glossary.md` |
| Build, test, release, commit, PR | `workflow.md` |
| Debugging a repeated failure | `known-errors.md` |

Read a matching tracked `.agents/` file when one already exists, then the private file
when present. The table names topics, not a requirement to create every file.

## Templates

Templates live in `templates/` next to this skill. Use them as structure, not as final content.
