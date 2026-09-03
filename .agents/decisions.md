# Decisions

## Active Decisions

- This repository is the canonical secret-free Codex configuration and installs managed
  entries through individual symlinks.
- Codex is the primary harness for planning, orchestration, permissions, native
  subagents, and synthesis.
- `agent-home/skills` is the single shared-skill owner; `config/skills` is not installed
  or maintained.
- Native Codex behavior replaces the former `build`, `plan`, `general`, `explore`,
  `answer`, and `code-reviewer` OpenCode roles. The nine listed Codex agents preserve the
  distinctive worker capabilities.
- `subagent-routing` owns native Codex agent and retained-thread routing. Follow-ups use
  the exact session only when parent, role, model, and directory still match; failed
  models do not trigger hidden fallback.
- The separate `my-opencode-config` repository owns OpenCode skills and commands. This
  repository does not execute or install OpenCode.
- Vault Context is explicit-only through the repository adapter. No `UserPromptSubmit`
  hook performs Vault search, and OpenCode-specific plugin adapters are not installed in
  Codex.
- Ponytail's five skills and its portable lifecycle hooks remain available. Workmux
  status is implemented through Codex hooks.
- The existing OpenCode installation remains untouched as a rollback source owned by
  `my-opencode-config`.
