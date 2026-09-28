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
- `super-agent` is the single owner of delegation policy and all agent-harness selection.
  A proven active wrapper owns worker lifecycle and exposes eligible harnesses; without a
  wrapper, automatic delegation uses the current harness's native subagents. Another
  harness is eligible outside a wrapper only when the user explicitly requests it through
  a documented direct adapter. Class is relative, and only a parent grants nesting.
- The delegation policy is vendor-neutral: environment-provided orchestration is resolved
  generically as the active wrapper, and vendor mechanics live in the skill's references
  rather than the policy. `super-agent` replaced the former routing, swarm, and unused
  coordinator skills.
- Cheap worker models are selected from the routing skill's harness-first catalog using
  `low`, `medium`, `high`, and `local` tiers. Adequate local routes are preferred, but at
  most one cataloged local model process may run at a time, including the orchestrator.
  Review presets may prefer Pi under Orca; explicit user rosters stay exact and full-preset
  live validation stays on Codex. Automatic selection and fallback use only compatible
  catalog entries; exhausted coverage is a blocker. Fallbacks, serialization, and missing
  coverage remain visible.
- The separate `my-opencode-config` repository owns OpenCode skills and commands. This
  repository does not install or configure external harnesses, but portable skills may
  use one when its current environment documents the orchestration path.
- Vault Context is explicit-only through the repository adapter. No `UserPromptSubmit`
  hook performs Vault search, and OpenCode-specific plugin adapters are not installed in
  Codex.
- Ponytail's five skills and its portable lifecycle hooks remain available.
- Workmux is not used. Base branches resolve to local `main` or an explicit argument, the
  single `git` skill owns commit, push, pull-request, merge, and PR-comment policy, and all
  five actions route through `git-worker` by default. Merge syncs the base into the current
  feature branch. `codex/hooks.json` carries no window-status or agent-registration hooks.
- `writing` owns prose from preparation and outlining through drafting, editing, and review,
  with the natural-writing rules, Miquel's voice profile, and opt-in
  academic and LaTeX material. `natural-writing` and `voice-profile` are read for every
  prose task; the academic references are read only for papers and theses. Imported
  upstream rules keep their attribution in the README rather than inside a skill file.
- The existing OpenCode installation remains untouched as a rollback source owned by
  `my-opencode-config`.
- The approved opt-in agentic flow and its human gates are recorded in
  `docs/decisions/agent-tooling/agentic-workflow.md`; see also the living
  `post-implementation-quality-gates.md` and `git-workflow.md` records in that directory.
