# Architecture

## Stack

Codex TOML configuration, portable JSON hooks, Bash bootstrap, Markdown skills, and
Node.js adapters.

## Layout

- `codex/` is the canonical individually managed Codex user configuration.
- `agent-home/skills/` owns all shared skills and is linked to `~/.agents/skills`.
- `config/` owns policy sources and portable helper/adapters; it is not a second skill
  owner.
- `.agents/` stores repository memory; `.agents/plans/` stores persisted execution plans.
- Conflict backups live under the XDG state directory outside managed targets.

## Boundaries

Codex owns configuration, planning, permissions, native agents, hooks, MCP definitions,
and synthesis. `subagent-routing` owns runtime-aware selection for already-exposed agent
harnesses. An active wrapper owns worker lifecycle; otherwise the current harness uses its
native subagent tooling, with documented one-shot direct adapters reserved for explicitly
requested external harnesses. Routing does not install or authenticate harnesses. OpenCode
configuration remains owned by the separate `my-opencode-config` repository.

## Entry Points

`bootstrap.sh` checks and installs the Codex configuration. The explicit Vault adapter is
`config/plugins/vault-context/bin/search.mjs`; Ponytail and Workmux lifecycle behavior is
owned by `codex/hooks.json`.
