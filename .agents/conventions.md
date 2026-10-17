# Conventions

## Code Style

Use portable Bash with `set -euo pipefail`, standard-library Node.js modules, valid TOML,
JSON, and skill frontmatter. Keep patches narrow and preserve unrelated source content.

## Naming

Use lowercase hyphenated skill and agent names. Keep skills under `config/skills`, agents
under `config/agents`, and policy under `config`.

## Portability and Security

Use `$HOME`, `CODEX_HOME`, XDG variables, executable names, and repository-root
resolution. Never hard-code a user path or persist credentials, auth state, sessions,
databases, logs, caches, memories, installation IDs, or plugin caches.
