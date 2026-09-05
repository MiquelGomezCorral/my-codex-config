# Decisions

## Active Decisions

- This repository is the canonical secret-free Codex configuration and installs managed
  entries through individual symlinks.
- Codex is the primary harness for configuration, planning, permissions, native agents,
  and synthesis. Portable shared skills may route work through other agent harnesses
  already exposed by the current environment.
- `agent-home/skills` is the single shared-skill owner; `config/skills` is not installed
  or maintained.
- Native Codex behavior replaces the former `build`, `plan`, `general`, `explore`,
  `answer`, and `code-reviewer` OpenCode roles. The nine listed Codex agents preserve the
  distinctive worker capabilities.
- `subagent-routing` owns all agent-harness selection. User routing intent wins; otherwise
  the current harness receives at least half of a swarm, rounded up. Each harness uses its
  own configured roles and lifecycle. Exact quota exhaustion permits a visible per-slot
  substitution; other failures do not trigger hidden fallback.
- The separate `my-opencode-config` repository owns OpenCode skills and commands. This
  repository does not install or configure external harnesses, but portable skills may
  use one when its current environment documents the orchestration path.
- Vault Context is explicit-only through the repository adapter. No `UserPromptSubmit`
  hook performs Vault search, and OpenCode-specific plugin adapters are not installed in
  Codex.
- Ponytail's five skills and its portable lifecycle hooks remain available. Workmux
  status is implemented through Codex hooks.
- The existing OpenCode installation remains untouched as a rollback source owned by
  `my-opencode-config`.
