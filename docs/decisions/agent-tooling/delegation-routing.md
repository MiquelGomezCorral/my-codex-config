# Delegation routing

## Intent

Workflows resolve each role's harness, model, and thinking from one frequently editable catalog while preserving the runtime's orchestration lifecycle. Delegation policy lives in one skill; runtime mechanics stay in its adapters.

## Current decisions

- `config/skills/super-agent/references/model-catalog.yaml` owns workflow model defaults. Its `super_agent`, `sub_orchestrator`, `coder`, `adversarial`, `reviewer-high`, `reviewer-fast`, and `swarms` entries each specify a harness, model or ordered candidate list, and thinking level. A role written as a list holds independent slots, each its own worker; `super-agent` owns how many slots a stage launches. Harness tiers remain available for explicit harness/tier overrides.
- `super-agent` is the single owner of delegation policy and class grants: whether to delegate, which harness, role, and cataloged model run the work, how much nesting is allowed, and what the caller reports. The former routing, swarm, and unused coordinator skills no longer own any part of that policy.
- A proven active wrapper owns worker lifecycle and exposes the harnesses available through it; the policy names no wrapper product. Without a wrapper, automatic delegation stays on the current harness and uses its native subagent tooling.
- The generic `orchestration` skill selects the active lifecycle adapter. Orca executable
  resolution and runtime-guide discovery belong only to its adapter reference; stages
  load that reference through the generic entry rather than copying wrapper mechanics.
- Supported native stages and agent teams may run within the same scope, model, nesting,
  one-writer, and observable-lifecycle bounds. Claude's documented one-shot adapter is
  available only when explicitly selected; it is neither an automatic fallback nor a
  retained supervised session.
- Outside a wrapper, another harness is eligible only when the user names it explicitly, using its documented one-shot direct adapter.
- Every dispatch rereads the applicable role entry. Role settings override generic tier preferences, wrapper defaults, and agent-file model metadata; explicit user instructions remain authoritative. Within one entry or slot, candidate order defines fallback. Slots are not fallbacks for each other: an unavailable provider skips its slot, the stage continues with the rest, and the user is told about the reduced coverage. Only a role with no runnable slot is a blocker.
- Local routes are grouped under their capability tier, and at most one local model process may run at a time. The current orchestrator consumes that slot when it uses a cataloged local model.
- Plan critique runs both `adversarial` slots. A critic from a family other than the planner's is preferred, not required: without one the stage still passes and the user is told.
- Review swarms and cleanup audits add one or two `reviewer-high` workers; `super-agent` sets the count by risk and size. An explicit user roster stays exact and gets no added strong reviewers.
- Coding, reviews, cleanup, and delegated coordination use the stage-to-role mapping in `super-agent`. Agent files own behavior and authority, without independent model or effort defaults.
- Presets keep their review shape and capability requirements, while catalog roles choose models. A required capability that cannot run on the configured route is reported; it does not authorize silent harness substitution.
- `super_agent` specifies new root launches. Reading the catalog cannot switch the harness of an existing conversation; report configured versus observed mismatches without automatically replacing the main agent.

## Protected invariants

- Wrapper detection and the allowed harness set are resolved before catalog selection.
- Class is relative: every agent is a delegate toward its parent and a root over its own children, and only a parent grants nesting. A missing class means delegate, a missing delegation grant means forbidden, and a missing depth means one.
- Every delegating role has catalog access, so a role that may launch workers can pin a cataloged model.
- Delegation policy contains no vendor names; vendor mechanics stay in the policy's references.
- Automatic routing never crosses to another harness outside a wrapper.
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
- Delegation instructions and evaluations: [super agent](../../../config/skills/super-agent/SKILL.md), its [routing reference](../../../config/skills/super-agent/references/routing.md), and its [swarm evaluations](../../../config/skills/super-agent/evals/evals.json).
- Review-only: confirm runtime evidence and wrapper-native lifecycle for live launches, which static checks cannot prove.

## History

- 2026-10-07: Split the reviewer role into `reviewer-fast` and `reviewer-high`, added the two-slot `adversarial` role, and defined list-valued roles as independent slots. A missing provider or a missing different-family critic reduces coverage and is reported, but never blocks the stage.
- 2026-10-04: Made role entries mandatory for workflow routing, including coding and cleanup, with explicit model and thinking pins. Removed competing per-agent defaults while preserving runtime lifecycle, user overrides, and capability restrictions.
- 2026-10-04: Approved one replaceable wrapper adapter and conditional native stage
  execution, preserving explicit routing and lifecycle authority.
- 2026-09-28: Allowed the review skill to express its Pi-first routing preference while keeping model identifiers in the catalog and explicit user rosters authoritative.
- 2026-09-25: Merged the former routing, swarm, and coordinator skills into `super-agent`; moved procedures and the model catalog into its references, made class grants relative, and removed vendor mechanics from the delegation policy.
- 2026-09-18: Closed automatic worker selection over catalog identifiers; removed native-default fallback and required effective-model verification when the runtime exposes it.
- 2026-09-18: Corrected local routes to tiered model lists and reaffirmed wrapper-native lifecycle ownership with current-harness native delegation when no wrapper is active.
- 2026-09-18: Approved the harness-first cheap-model catalog, runtime-aware delegation precedence, explicit direct adapters, and one-process local-model limit.
