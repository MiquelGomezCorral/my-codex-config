# Implemented agent workflow: source map

This diagram is a snapshot from before the 2026-09-28 stage, critic, and review-routing corrections. The operational skills now make review mandatory in each coding loop and assign it to the root for small slices or coding supervisor for large slices. The editable diagram and preview have not yet been regenerated. This source map records the original snapshot; consult current skills for current behavior.

The diagram follows operational skill instructions, Codex role files, bootstrap registration, and command dispatch. It does not treat proposals, memory, decision records, or existing diagrams as implementation evidence.

## Entry and command wiring

- The complete workflow runs only when explicitly requested; the human owns decisions, approvals, stage transitions, and shipping authority: `agent-home/skills/workflow/SKILL.md:8-10`.
- Bootstrap requires and links the `workflow` skill, but its command inventory does not include a `workflow` wrapper: `bootstrap.sh:102-104`, `bootstrap.sh:116-120`, `bootstrap.sh:391`.
- `/commands/<name>` requests enter through the `UserPromptSubmit` hook, then the dispatcher resolves the wrapper's `skill`, substitutes `$ARGUMENTS`, and injects that skill's workflow; malformed or unavailable wrappers block: `codex/hooks.json:3-20`, `config/bin/codex-command-dispatch.mjs:37-65`.
- The registered wrappers expose planning, plan review/refinement, coding, review, findings review, cleanup, and Git actions: `codex/commands/plan-implementation.md:1-9`, `codex/commands/review-plan.md:1-7`, `codex/commands/refine-plan.md:1-7`, `codex/commands/code.md:1-7`, `codex/commands/review.md:1-7`, `codex/commands/review-findings.md:1-7`, `codex/commands/cleanup.md:1-7`, `codex/commands/commit.md:1-10`, `codex/commands/merge.md:1-9`.

## Main path and human gates

- Planning stages are first draft, improvement with human acceptance, one adversarial critic and rebuttal, then `$review-plan` and `$refine-plan`: `agent-home/skills/workflow/SKILL.md:40-48`; phase constraints: `agent-home/skills/implementation-planning/references/first-draft.md:3-13`, `agent-home/skills/implementation-planning/references/improvement-loop.md:3-10`, `agent-home/skills/implementation-planning/references/adversarial.md:3-10`.
- Slice preparation records owner, size, checks, samples, tools, review preset, and artifacts; the human approves implementation, any required worktree, and live actions before dispatch: `agent-home/skills/workflow/SKILL.md:49-52`.
- Small plans route to one retained coder; large plans route through a read-only `coding-supervisor` directing one retained coder. Findings are verified and every in-scope P0–P3 correction is prioritized; two unsuccessful rounds on one issue escalate: `agent-home/skills/workflow/SKILL.md:53-57`, `agent-home/skills/workflow/references/coding-loop.md:6-26`, `agent-home/skills/code/SKILL.md:49-67`.
- Codex role files make `coder` the product editor and `coding-supervisor` read-only and limited to large workflow slices: `codex/agents/coder.toml:8-20`, `codex/agents/coding-supervisor.toml:8-29`.
- The workflow requires planned checks and a review of the resulting head, then verifies supplied findings before corrections: `agent-home/skills/workflow/references/coding-loop.md:11-23`. The workflow sources do not name the worker or command that performs this required head review; the separate `$review` routes are mapped below.
- Cleanup follows coding gates and an authorized local checkpoint. `cleanup-worker` is read-only/findings-only; the parent verifies findings and may route verified simplifications back through coding: `agent-home/skills/workflow/SKILL.md:58-60`, `agent-home/skills/workflow/references/cleanup.md:3-15`, `agent-home/skills/cleanup/SKILL.md:35-51`, `codex/agents/cleanup-worker.toml:8-39`.
- Cleanup may use up to two fresh read-only `reviewer-arch` / `reviewer-reasoning` specialists only when distinct evidence surfaces justify them: `agent-home/skills/cleanup/SKILL.md:46-51`, `codex/agents/reviewer-arch.toml:1-13`, `codex/agents/reviewer-reasoning.toml:1-13`.
- The workflow presents observed results and waits for human acceptance; code-changing feedback returns through coding/review. Only after acceptance does `$git` run plan-named actions; required CI/review and sequential-slice gates remain: `agent-home/skills/workflow/SKILL.md:61-76`, `agent-home/skills/workflow/references/present-to-human.md:3-11`, `agent-home/skills/workflow/references/ship-pr.md:3-15`.

## Review and delegation subflows

- `$review` supports direct review and explicit swarm/presets. `flash` routes directly to `reviewer-quick`; ordinary direct/swarm routes a review coordinator; `swarm-smart` and `full` add a fresh verifier; `full` adds `live-validator` only after checking exact authorization: `agent-home/skills/review/SKILL.md:97-117`, `agent-home/skills/review/references/presets/flash.md:3-8`, `agent-home/skills/review/references/presets/swarm-smart.md:3-16`, `agent-home/skills/review/references/presets/full.md:3-12`.
- Explicit swarm review always selects quick and reasoning lenses, adds architecture/integration only when justified, then coordinator-synthesizes read-only results: `agent-home/skills/multi-agent-review/SKILL.md:12-19`, `agent-home/skills/multi-agent-review/SKILL.md:30-51`, `agent-home/skills/multi-agent-review/SKILL.md:83-97`; Codex role definitions are `codex/agents/review-worker.toml:8-20` and `codex/agents/reviewer-quick.toml:1-12`.
- `super-agent` owns delegation choice, route, role, catalog model, nesting bounds, and reporting; worker lifecycle comes from the active wrapper: `agent-home/skills/super-agent/SKILL.md:8-12`, `agent-home/skills/super-agent/SKILL.md:19-39`, `agent-home/skills/super-agent/SKILL.md:41-76`, `agent-home/skills/super-agent/SKILL.md:78-96`.
- Codex bootstrap registers `coder`, `git-worker`, `review-worker`, review specialists, `coding-supervisor`, and `live-validator`: `bootstrap.sh:69-73`, `bootstrap.sh:383-392`.
- Git uses one `git-worker` through `super-agent` for each of its five actions; workflow context must preserve exact plan action, target, and bounds: `agent-home/skills/git/SKILL.md:37-60`, `agent-home/skills/git/SKILL.md:62-75`, `codex/agents/git-worker.toml:8-11`.

## Unclear links shown in the diagram

- The complete-workflow skill requires an independent first proposal and a planning critic, but no corresponding Codex role is named in the operational sources: `agent-home/skills/implementation-planning/references/first-draft.md:7-10`, `agent-home/skills/implementation-planning/references/adversarial.md:3-10`.
- The workflow requires resulting-head review, but does not specify which review command/worker dispatches it. `$review` is independently available with the routes above; no automatic connection is claimed.
- The repository command inventory has no `/workflow` wrapper; workflow entry is the installed, explicit `workflow` skill, while `/commands/*` is the repository command gateway: `bootstrap.sh:102-104`, `bootstrap.sh:116-120`, `config/bin/codex-command-dispatch.mjs:41-60`.
