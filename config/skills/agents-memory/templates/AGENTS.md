# Project Agent Rules

This is the instruction file for every agent, whatever its harness. Files such as
`CLAUDE.md` or `GEMINI.md` may add rules; follow them and this file. When they conflict,
ask your parent (the root asks the user); the human-facing agent records the answer here.

## Project context

Preserve existing repository instructions, `.agents/` files, and shared product decision
records. Only the human-facing agent uses `agents-memory`; workers receive relevant task
context from that agent and end each report with `Memory candidates:` or `none`.

## Private agent memory

Resolve `git rev-parse --path-format=absolute --git-common-dir` and look under its
`agent-memory/` directory for relevant notes and new plans. All linked worktrees of this
clone share that directory. Create it on the `init` command or the first memory write; do
not copy it into the worktree or commit it. Product decisions stay in `docs/decisions/`.

## Load Rules

- The human-facing agent loads only the relevant tracked and private notes.
- If a memory file conflicts with current code, trust current code and flag the memory entry as stale.
- Save findings that meet the global memory bar without approval, and name them in the
  final report's `Memory:` line. Ask the user when a finding's value is unclear.

## Project Notes

- Stack: {{STACK}}
- Package manager: {{PACKAGE_MANAGER}}

## Commands

{{CHECK_AND_RUN_COMMANDS}}

## Git

- Default branch: {{DEFAULT_BRANCH}}
- Commit messages: {{COMMIT_STYLE}}
- PR template: {{PR_TEMPLATE}}
- Worktrees: {{WORKTREE_MODEL}}

## Repository skills

Load these from `.agents/skills/` when the task matches, even if your harness does not list
them:

{{REPO_SKILLS}}
