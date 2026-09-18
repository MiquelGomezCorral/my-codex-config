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
  `answer`, and `code-reviewer` OpenCode roles. The eight listed Codex agents preserve the
  distinctive worker capabilities.
- `subagent-routing` owns all agent-harness selection. A proven active wrapper owns worker
  lifecycle and exposes eligible harnesses; without a wrapper, automatic delegation uses
  the current harness's native subagents. Another harness is eligible outside a wrapper
  only when the user explicitly requests it through a documented direct adapter.
- Cheap worker models are selected from the routing skill's harness-first catalog using
  `low`, `medium`, `high`, and `local` tiers. Adequate local routes are preferred, but at
  most one cataloged local model process may run at a time, including the orchestrator.
  Automatic selection and fallback use only compatible catalog entries; exhausted coverage
  is a blocker. Fallbacks, serialization, and missing coverage remain visible.
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
