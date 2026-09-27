# Project Agent Rules

This repository is the canonical, secret-free Codex configuration. `config/AGENTS.md`
and `config/security-rules.md` are the authoritative global policy sources; the
bootstrap generates the installed `~/.codex/AGENTS.md` from them.

## Memory Files

- `.agents/architecture.md` - harness layout and boundaries.
- `.agents/conventions.md` - portability and security rules.
- `.agents/decisions.md` - closed migration decisions.
- `.agents/glossary.md` - project terms.
- `.agents/requirements.md` - the user's own stated wants, with status. Read before planning.
- `.agents/workflow.md` - setup, checks, live validation, and rollback.
- `.agents/known-errors.md` - recurring bootstrap or worker failures.

## Rules

- Work only in this repository during migration; the old OpenCode repositories and live
  homes are read-only sources.
- `.agents/requirements.md` is the authoritative record of what the user asked for. Update
  it whenever the user states a new want, changes one, or rejects one.
- Never add credentials, authentication state, sessions, databases, logs, caches,
  memories, installation IDs, plugin caches, or machine-specific absolute paths.
- Do not commit, push, publish, create branches, or create worktrees for this migration.

## Commands

- `./bootstrap.sh --check`
- `node --test tests/*.mjs config/plugins/vault-context/test/plugin.test.mjs`
- `bash tests/bootstrap.test.sh`
