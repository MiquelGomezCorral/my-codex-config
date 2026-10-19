# Decisions

## Active Decisions

- This repository is the canonical secret-free four-harness configuration. Portable assets
  are linked individually; native mutable files are rendered or merged.
- Native mains stay intact. New automatic root launches resolve the `super_agent` catalog
  role. Portable shared skills may route work through other agent harnesses already exposed
  by the current environment.
- `config/skills` is the single shared-skill source.
- Native Codex behavior replaces the former `build`, `plan`, `general`, `explore`,
  `answer`, and `code-reviewer` OpenCode roles. The twelve focused role sources are
  installed or rendered for each harness.
- `super-agent` is the single owner of delegation policy and all agent-harness selection.
  A proven active wrapper owns worker lifecycle and exposes eligible harnesses; without a
  wrapper, automatic delegation uses the current harness's native subagents. Another
  harness is eligible outside a wrapper only when the user explicitly requests it through
  a documented direct adapter. Class is relative, and only a parent grants nesting.
- The delegation policy is vendor-neutral: environment-provided orchestration is resolved
  generically as the active wrapper, and vendor mechanics live in the skill's references
  rather than the policy. `super-agent` replaced the former routing, swarm, and unused
  coordinator skills.
- Automatic stages use the routing skill's catalog role entries; the `low`, `medium`,
  `high`, and `local` tiers are explicit harness/tier overrides. The current catalog
  disables local routes (`max_local_concurrency: 0`); if enabled, at most one cataloged
  local model process may run at a time, including the orchestrator.
  Review presets resolve catalog roles: `reviewer-fast` and `swarms` run on the launching
  agent's harness with its cheap model and fall back to that harness's `low` tier; explicit
  user rosters stay exact and full-preset live testers use `reviewer-fast`. Automatic selection and fallback use only compatible
  catalog entries; exhausted coverage is a blocker. Fallbacks, serialization, and missing
  coverage remain visible.
- The separate `my-opencode-config` repository owns OpenCode skills and commands. This
  repository configures Codex, Claude Code, Pi, and AGY but installs and authenticates none
  of their CLIs; portable skills may use another harness when the current environment
  documents the orchestration path.
- Vault Context is explicit-only through the repository adapter. No `UserPromptSubmit`
  hook performs Vault search, and OpenCode-specific plugin adapters are not installed in
  Codex.
- Ponytail is not installed. Its rules are copied into `code-quality` and `review`
  (`docs/decisions/agent-tooling/ponytail.md`).
- Workmux is not used. Base branches resolve to local `main` or an explicit argument, the
  single `git` skill owns commit, push, pull-request, merge, and PR-comment policy, and all
  five actions route through `git-worker` by default. Merge syncs the base into the current
  feature branch. `config/codex-hooks.json` holds only the command-dispatcher hook, which
  bootstrap merges into `~/.codex/hooks.json` without touching Orca's hooks.
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
