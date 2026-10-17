# Project initialization

## Intent

One `init` command (`/commands/init` in Codex, `/harness-init` in Claude Code) makes any repository ready for agents, new or existing, and every
harness follows the same repository instructions.

## Current decisions

- The `init` command loads the `project-init` skill. It runs Git and `.gitignore`, `AGENTS.md`, private
  memory, code-quality references, decision records, CodeGraph, BTCA, repo-local skills,
  template-leftover checks, and one closing commit, reusing the skill that owns each step.
- `AGENTS.md` is the instruction file for every agent. Harness files are not created; an existing
  tracked `CLAUDE.md` or `.claude/CLAUDE.md` gains `@AGENTS.md`, because Claude Code skips
  `AGENTS.md` whenever a `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the
  working directory or any parent. A `CLAUDE.local.md` is reported, not edited. The global
  policy says the same, so an agent follows `AGENTS.md` even when its harness reads another file.
- Repo-local skills live in `.agents/skills/` and are listed in `AGENTS.md`.
- Default worktree model: independent workers use separate worktrees and branches, and the
  main agent combines them, unless the repository or the user says otherwise.

## Protected invariants

- Running init again repairs gaps and never duplicates or removes existing content
  without asking.
- Installs (BTCA sources, skills, checks) and template-value replacements wait for user
  approval.
- The closing commit holds only files the run changed; never private memory, `.codegraph/`,
  or secrets, and no push unless asked. Init adds `.codegraph/` to `.gitignore`, because
  CodeGraph's own ignore file does not ignore itself.
- Unclear Git rules are asked, not guessed.
- Files already modified before the run stay out of its commits unless the user agrees.

## Rationale and tradeoffs

Separate setup skills existed (`agents-memory`, `codegraph-setup`, `btca`, `skill-scout`,
`decision-records`) but nothing ran them together, so new repositories missed steps. One
orchestrating skill keeps each step's rules with its owner. A pointer in each harness file
was chosen over duplicating rules, because copies drift.

## Enforcement

Review-only: the steps are agent judgment over repository state. `tests/codex-command-dispatch.test.mjs`
checks that the `init` command routes to `project-init`.

## History

- 2026-10-16: Covered `.claude/CLAUDE.md` and `CLAUDE.local.md`, which also stop Claude Code
  from reading `AGENTS.md` (official memory docs).
- 2026-10-07: the `init` command moved from `agents-memory` to the new `project-init` skill; `AGENTS.md`
  made the instruction file for every harness.
