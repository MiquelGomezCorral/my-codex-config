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
- `agent-home/skills/workflow/` owns the opt-in, reusable planning-to-PR stage contract,
  progress template, and scenario definitions; existing stage skills keep their standalone
  behavior and receive explicit workflow context only when invoked from that flow.
- Conflict backups live under the XDG state directory outside managed targets.

## Boundaries

Codex owns configuration, planning, permissions, native agents, hooks, MCP definitions,
and synthesis. `super-agent` owns delegation policy and runtime-aware selection for
already-exposed agent harnesses. An active wrapper owns worker lifecycle; otherwise the
current harness uses its native subagent tooling, with documented one-shot direct adapters
reserved for explicitly requested external harnesses. Routing does not install or
authenticate harnesses. Delegation policy is vendor-neutral, and environment-provided
orchestration is used generically through its own loaded guides. OpenCode configuration
remains owned by the separate `my-opencode-config` repository.
The workflow coordinator advances routine stages and pauses for human decisions and
approval gates. Small plans go directly to one retained coder; large plans use a read-only
coding supervisor with a bounded one-coder grant. The respective coordinator runs the
plan-selected review against the complete approved plan. A reusable read-only critic
challenges plans and other proposals. Review presets name default harnesses and tiers;
`super-agent` selects exact models from its catalog. Full-preset live validation stays on
Codex. Runtime progress lives under local XDG state and is checked against Orca, Git,
and host evidence.

## Entry Points

`bootstrap.sh` checks and installs the Codex configuration. The explicit Vault adapter is
`config/plugins/vault-context/bin/search.mjs`; Ponytail lifecycle behavior is owned by
`codex/hooks.json`.
`$workflow` is the single opt-in planning-to-delivery entry point; `$code`,
`$review`, `$cleanup`, and `$git` remain usable on their own.
