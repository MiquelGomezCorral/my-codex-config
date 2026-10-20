# Delegation routing

## Intent

Workflows resolve each role's harness, model, and thinking from one frequently editable catalog while preserving the runtime's orchestration lifecycle. Delegation policy lives in one skill; runtime mechanics stay in its adapters.

## Current decisions

- `config/skills/super-agent/references/model-catalog.yaml` owns workflow model defaults. Its `super_agent`, `sub_orchestrator`, `coder`, `explorer`, `adversarial`, `reviewer-high`, `reviewer-fast`, and `swarms` entries each specify a harness, model or ordered candidate list, and thinking level; `reviewer-fast` and `swarms` name the current harness and list a model per harness instead; `sub_orchestrator` and `coder` have `large`, `medium`, and `small` entries. A role written as a list is an ordered fallback: the first entry that can run is used. Several workers of one role run only when the invoking skill states the count. Harness tiers remain available for explicit harness/tier overrides.
- `super-agent` is the single owner of delegation policy and class grants: whether to delegate, which harness, role, and cataloged model run the work, how much nesting is allowed, and what the caller reports. The former routing, swarm, and unused coordinator skills no longer own any part of that policy.
- A proven active wrapper owns worker lifecycle and exposes the harnesses available through it; the policy names no wrapper product. Without a wrapper, automatic delegation stays on the current harness and uses its native subagent tooling.
- The generic `orchestration` skill selects the active lifecycle adapter. Orca executable
  resolution and runtime-guide discovery belong only to its adapter reference; stages
  load that reference through the generic entry rather than copying wrapper mechanics.
- Supported native stages and agent teams may run within the same scope, model, nesting,
  one-writer, and observable-lifecycle bounds. Claude's documented one-shot adapter is
  available only when explicitly selected; it is neither an automatic fallback nor a
  retained supervised session.
- Outside a wrapper, another harness is eligible only when the user names it explicitly, using its documented one-shot direct adapter. The one exception is `explorer`'s pi candidate, which runs read-only through the pi one-shot adapter without a request.
- Each plan slice carries `Size: small|medium|large`, proposed by the planner and approved by the user with the plan; without a plan, the agent proposes size and route and waits for approval. `small` goes straight to one coder; `medium` and `large` get a coding supervisor. The size picks the supervisor and coder entries.
- The super agent does lookups itself with CodeGraph plus about three targeted file reads; more reading goes to `explorer`, which returns a brief of 20 lines or fewer with `file:line` references. Most super-agent context came from its own file reading, not from helper reports.
- Coordinators wait on workers with one blocking wait and never poll; every wait is bounded, so a stalled worker is noticed, nudged once, then stopped and reported. The Orca adapter reference owns the commands.
- On Claude, a hook installed by the bootstrap blocks helper launches on Opus or Fable outside the roles listed in the catalog's `model_guard`; `AGENT_MODEL_GUARD=off` disables it for one session. Helpers launched without a model get the catalog's Claude `medium` model through the bootstrap's default-helper-model setting, because agent files carry no model line.
- Every dispatch rereads the applicable role entry. Role settings override generic tier preferences, wrapper defaults, and agent-file model metadata; explicit user instructions remain authoritative. List order defines fallback. When a skill asks for more workers than can run, the stage continues with those that ran and the user is told about the reduced coverage. Only a role with no runnable entry is a blocker.
- `reviewer-fast` and `swarms` run on the current harness, the harness of the agent that launches them. Each harness lists one named cheap model for them in the catalog, at the highest thinking that model supports; when it is unavailable, the harness's `low` tier runs instead. Every harness therefore has a runnable route for direct review, verification, live validation, and specialists.
- Local routes are grouped under their capability tier, and at most one local model process may run at a time. The current orchestrator consumes that slot when it uses a cataloged local model. `max_local_concurrency: 0` turns local routes off; tier-routed work then takes an online route.
- Agents follow the active environment's own tools, guides, and lifecycle first, and this routing only for what the environment leaves open. The repository never rewrites environment-owned files to make a route work.
- Plan critique runs two critics from the first two runnable `adversarial` entries; `review-plan` owns the count. A critic from a family other than the planner's is preferred, not required: without one the stage still passes and the user is told. A pi entry launches three workers per listed model, each asked for a different angle.
- Review swarms and cleanup audits add one `reviewer-high` worker, or two for risky or large changes, with the same pi rule; the review and cleanup skills own the count. An explicit user roster stays exact and gets no added strong reviewers.
- Coding, reviews, cleanup, and delegated coordination use the stage-to-role mapping in `super-agent`. Agent files own behavior and authority, without independent model or effort defaults.
- Presets keep their review shape and capability requirements, while catalog roles choose models. A required capability that cannot run on the configured route is reported; it does not authorize silent harness substitution.
- `super_agent` specifies new root launches. Reading the catalog cannot switch the harness of an existing conversation; report configured versus observed mismatches without automatically replacing the main agent.

## Protected invariants

- Wrapper detection and the allowed harness set are resolved before catalog selection.
- Class is relative: every agent is a delegate toward its parent and a root over its own children, and only a parent grants nesting. A missing class means delegate, a missing delegation grant means forbidden, and a missing depth means one.
- Every delegating role has catalog access, so a role that may launch workers can pin a cataloged model.
- Delegation policy contains no vendor names; vendor mechanics stay in the policy's references.
- Automatic routing never crosses to another harness outside a wrapper, except `explorer`'s read-only pi candidate.
- Claude helpers run on Opus or Fable only in roles the catalog's `model_guard` lists, unless the user turned the guard off for the session.
- Explicit preset requests stay within that preset, and explicit harness/model requests remain exact.
- Catalog identifiers are secret-free and have one authoritative owner.
- An automatically selected worker is launched with an explicit catalog model and thinking level. Report unavailable pinning or verification; stop a reported effective-setting mismatch and do not use its output.
- Local-model concurrency never exceeds `max_local_concurrency`; excess work uses adequate online routes or waits for the local slot.
- Route choice, fallback, serialization, and missing coverage remain visible to the caller.
- Applicable provider-specific records, including harness-declared capability restrictions, filter candidate routes before generic preference rules.
- Catalog role settings take precedence over calling-skill model preferences and the generic current-harness majority default; explicit user harness choices remain exact.

## Rationale and tradeoffs

Role defaults change often. Keeping their harness, model, and thinking in one catalog avoids editing each agent and stage. Runtime-owned orchestration preserves lifecycle; explicit-only direct adapters prevent silent cross-harness launches. One local slot keeps memory use predictable. Instructions require catalog resolution, while live runtime evidence is needed to prove the selected settings actually ran.

## Enforcement

- Catalog and behavior checks: [configuration tests](../../../tests/codex-config.test.mjs) and [bootstrap tests](../../../tests/bootstrap.test.sh).
- Claude model guard: [guard hook](../../../config/bin/agent-model-guard.py), installed by [the Claude bootstrap](../../../bootstrap_claude.sh).
- Delegation instructions and evaluations: [super agent](../../../config/skills/super-agent/SKILL.md), its [routing reference](../../../config/skills/super-agent/references/routing.md), and its [swarm evaluations](../../../config/skills/super-agent/evals/evals.json).
- Review-only: confirm runtime evidence and wrapper-native lifecycle for live launches, which static checks cannot prove.

## History

- 2026-10-19: A token-burn audit showed the super agent's own file reading, polling turns, and Opus helpers drove most use. The user made catalog lists ordered fallbacks with counts owned by skills, sized `sub_orchestrator` and `coder` by user-approved slice size, added `explorer`, a Claude model guard with a one-session off switch, a Sonnet default for helpers launched without a model, and blocking, stall-aware waits.

- 2026-10-16: After Pi became unavailable and left direct review and specialists without a route, the user made `reviewer-fast` and `swarms` follow the current harness's cheap model with its `low` tier as fallback, confirmed local routes stay off, and asked that the environment's own tools come first without the repository overriding them.
- 2026-10-07: Split the reviewer role into `reviewer-fast` and `reviewer-high`, added the two-slot `adversarial` role, and defined list-valued roles as independent slots. A missing provider or a missing different-family critic reduces coverage and is reported, but never blocks the stage.
- 2026-10-04: Made role entries mandatory for workflow routing, including coding and cleanup, with explicit model and thinking pins. Removed competing per-agent defaults while preserving runtime lifecycle, user overrides, and capability restrictions.
- 2026-10-04: Approved one replaceable wrapper adapter and conditional native stage
  execution, preserving explicit routing and lifecycle authority.
- 2026-09-28: Allowed the review skill to express its Pi-first routing preference while keeping model identifiers in the catalog and explicit user rosters authoritative.
- 2026-09-25: Merged the former routing, swarm, and coordinator skills into `super-agent`; moved procedures and the model catalog into its references, made class grants relative, and removed vendor mechanics from the delegation policy.
- 2026-09-18: Closed automatic worker selection over catalog identifiers; removed native-default fallback and required effective-model verification when the runtime exposes it.
- 2026-09-18: Corrected local routes to tiered model lists and reaffirmed wrapper-native lifecycle ownership with current-harness native delegation when no wrapper is active.
- 2026-09-18: Approved the harness-first cheap-model catalog, runtime-aware delegation precedence, explicit direct adapters, and one-process local-model limit.
