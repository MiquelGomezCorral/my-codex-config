# Architecture

## Stack

Codex TOML configuration, portable JSON hooks, Bash bootstraps, Markdown skills, and
Node.js adapters, shared by Codex, Claude Code, Pi, and AGY.

## Layout

- `config/codex.toml` and `config/codex-hooks.json` own the Codex native sources.
- `bootstrap_codex.sh`, `bootstrap_claude.sh`, `bootstrap_pi.sh`, and `bootstrap_agy.sh` are
  independent; none calls another. The thirteen role sources in `config/agents/*.toml` render
  for all four harnesses, and the rendered role files are never committed.
- The per-entry install map, target by target, lives in `README.md` under
  "What gets installed where". That table is the owner of those facts; do not restate it
  here.
- `config/skills/` owns the repository skills; each harness gets individual links.
- `config/` also owns roles, commands, the MCP inventory, policy, and adapters.
- `.agents/` is tracked, historical repository context. New plans and private notes live
  in `agent-memory/` under the Git common directory (see `AGENTS.md`); `.agents/plans/`
  keeps old execution plans as history only.
- `config/skills/workflow/` owns the opt-in, reusable planning-to-PR stage contract and
  scenario definitions; `config/skills/workflow-progress/` owns the current progress CLI.
  Existing stage skills keep their standalone behavior and receive explicit workflow
  context only when invoked from that flow.
- Conflict backups live under the XDG state directory outside managed targets.

## Boundaries

Shared sources and stage skills are harness-neutral; the dedicated bootstraps own native
delivery. `super-agent` owns delegation policy and runtime-aware selection for
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
challenges plans and other proposals. The stage catalog roles in
`config/skills/super-agent/references/model-catalog.yaml` own automatic harness, model, and
thinking; review presets own the review shape. `reviewer-fast` and `swarms` run on the current harness's cheap model, including full-preset live testers. Runtime progress lives under `agent-memory/workflow-runs/` in the Git common directory (XDG state only outside Git) and is checked against Orca, Git,
and host evidence.

## Entry Points

`bootstrap_codex.sh` checks (`--check`) and installs the Codex configuration; the Claude, Pi,
and AGY bootstraps do the same for their harnesses. All share one skill source,
`config/skills`. The explicit Vault adapter is
`config/plugins/vault-context/bin/search.mjs`. Ponytail is not installed; its rules are
copied into `code-quality` and `review`. `config/codex-hooks.json` holds only the
command-dispatcher hook, merged into `~/.codex/hooks.json` by `merge-hooks`.
`$workflow` is the single opt-in planning-to-delivery entry point; `$code`,
`$review`, `$cleanup`, and `$git` remain usable on their own.
