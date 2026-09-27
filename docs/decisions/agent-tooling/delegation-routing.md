# Delegation routing

## Intent

Delegating workflows choose inexpensive worker models from one frequently editable catalog while preserving the orchestration lifecycle provided by the runtime in which they are running. Delegation policy itself lives in one skill, and environment-provided orchestration is resolved generically without naming a vendor.

## Current decisions

- `agent-home/skills/super-agent/references/model-catalog.yaml` is the single owner of cheap worker model identifiers, grouped by harness and the `low`, `medium`, `high`, and `local` vocabulary.
- `super-agent` is the single owner of delegation policy and class grants: whether to delegate, which harness, role, and cataloged model run the work, how much nesting is allowed, and what the caller reports. The former routing, swarm, and unused coordinator skills no longer own any part of that policy.
- A proven active wrapper owns worker lifecycle and exposes the harnesses available through it; the policy names no wrapper product. Without a wrapper, automatic delegation stays on the current harness and uses its native subagent tooling.
- Outside a wrapper, another harness is eligible only when the user names it explicitly, using its documented one-shot direct adapter.
- Automatic selection prefers an adequate local route with a free slot, then the lowest adequate online tier in catalog order. Automatic worker selection and fallback are limited to compatible catalog entries; exhausted coverage is a blocker.
- Local routes are grouped under their capability tier, and at most one local model process may run at a time. The current orchestrator consumes that slot when it uses a cataloged local model.
- `$code` and `$cleanup` retain their orchestrator-strength model policies instead of using the cheap worker catalog.

## Protected invariants

- Wrapper detection and the allowed harness set are resolved before catalog selection.
- Class is relative: every agent is a delegate toward its parent and a root over its own children, and only a parent grants nesting. A missing class means delegate, a missing delegation grant means forbidden, and a missing depth means one.
- Every delegating role has catalog access, so a role that may launch workers can pin a cataloged model.
- Delegation policy contains no vendor names; vendor mechanics stay in the policy's references.
- Automatic routing never crosses to another harness outside a wrapper.
- Explicit preset requests stay within that preset, and explicit harness/model requests remain exact.
- Catalog identifiers are secret-free and have one authoritative owner.
- An automatically selected worker is launched with an explicit catalog model. A reported effective-model mismatch is stopped and its output is not used.
- Local-model concurrency never exceeds `max_local_concurrency`; excess work uses adequate online routes or waits for the local slot.
- Route choice, fallback, serialization, and missing coverage remain visible to the caller.
- Applicable provider-specific records, including harness-declared capability restrictions, filter candidate routes before generic preference rules.

## Rationale and tradeoffs

Cheap models change often, so keeping their identifiers in one small catalog avoids repeated skill edits. Runtime-owned orchestration preserves lifecycle and role behavior, while explicit-only direct adapters prevent silent cross-harness launches. A single local slot trades throughput for predictable memory use and avoids OOM failures. One delegation skill removes rules that three overlapping skills each restated, and deferring lifecycle mechanics to the environment keeps the policy correct when the environment changes.

## Enforcement

- Catalog and behavior checks: [configuration tests](../../../tests/codex-config.test.mjs) and [bootstrap tests](../../../tests/bootstrap.test.sh).
- Delegation instructions and evaluations: [super agent](../../../agent-home/skills/super-agent/SKILL.md), its [routing reference](../../../agent-home/skills/super-agent/references/routing.md), and its [swarm evaluations](../../../agent-home/skills/super-agent/evals/evals.json).
- Review-only: confirm runtime evidence and wrapper-native lifecycle for live launches, which static checks cannot prove.

## History

- 2026-09-25: Merged the former routing, swarm, and coordinator skills into `super-agent`; moved procedures and the model catalog into its references, made class grants relative, and removed vendor mechanics from the delegation policy.
- 2026-09-18: Closed automatic worker selection over catalog identifiers; removed native-default fallback and required effective-model verification when the runtime exposes it.
- 2026-09-18: Corrected local routes to tiered model lists and reaffirmed wrapper-native lifecycle ownership with current-harness native delegation when no wrapper is active.
- 2026-09-18: Approved the harness-first cheap-model catalog, runtime-aware delegation precedence, explicit direct adapters, and one-process local-model limit.
