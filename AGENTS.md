# Project Agent Rules

This repository is the canonical, secret-free harness configuration. `config/AGENTS.md`
is the single authoritative global policy source; each dedicated bootstrap appends it to
that harness's native user policy file.

## Memory Files

These tracked files are existing project context. The human-facing agent also reads
relevant private notes and new plans from `agent-memory/` under the directory returned by
`git rev-parse --path-format=absolute --git-common-dir`. Delegated agents receive needed
context from that agent and report memory suggestions back; they do not use
`agents-memory` or browse private notes.

- `.agents/architecture.md` - harness layout and boundaries.
- `.agents/conventions.md` - portability and security rules.
- `.agents/decisions.md` - closed migration decisions.
- `.agents/glossary.md` - project terms.
- `.agents/requirements.md` - earlier stated wants, with status. Read before planning.
- `.agents/workflow.md` - setup, checks, live validation, and rollback.
- `.agents/known-errors.md` - recurring bootstrap or worker failures.

## Rules

- Work only in this repository during migration; the old OpenCode repositories and live
  homes are read-only sources.
- `.agents/requirements.md` records earlier wants. The human-facing agent records new
  wants and changes in private `agent-memory/requirements.md`, after reading the existing
  record. Do not update tracked `.agents/` for private working memory.
- Never add credentials, authentication state, sessions, databases, logs, caches,
  private memories, installation IDs, plugin caches, or machine-specific absolute paths
  to tracked repository files. Keep new agent memory in the Git common directory above.
- Do not commit, push, publish, create branches, or create worktrees for this migration.

## Commands

- `./bootstrap_codex.sh --check`
- `node --test tests/*.mjs config/plugins/vault-context/test/plugin.test.mjs`
- `bash tests/bootstrap.test.sh`
