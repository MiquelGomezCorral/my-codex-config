# Project Agent Rules

This file routes the human-facing agent to project context and private working memory.

## Project context

Preserve existing repository instructions, `.agents/` files, and shared product decision
records. Only the human-facing agent uses `agents-memory`; workers receive relevant task
context from that agent and end each report with `Memory candidates:` or `none`.

## Private agent memory

Resolve `git rev-parse --path-format=absolute --git-common-dir` and look under its
`agent-memory/` directory for relevant notes and new plans. All linked worktrees of this
clone share that directory. Create it on `/init` or the first memory write; do
not copy it into the worktree or commit it. Product decisions stay in `docs/decisions/`.

## Load Rules

- The human-facing agent loads only the relevant tracked and private notes.
- If a memory file conflicts with current code, trust current code and flag the memory entry as stale.
- Save findings that meet the global memory bar without approval, and name them in the
  final report's `Memory:` line. Ask the user when a finding's value is unclear.

## Project Notes

- Stack: {{STACK}}
- Package manager: {{PACKAGE_MANAGER}}
- Main commands: {{MAIN_COMMANDS}}
