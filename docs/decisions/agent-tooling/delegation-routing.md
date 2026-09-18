# Delegation routing

## Intent

Delegating workflows choose inexpensive worker models from one frequently editable catalog while preserving the orchestration lifecycle provided by the runtime in which they are running.

## Current decisions

- `agent-home/skills/subagent-routing/references/model-catalog.yaml` is the single owner of cheap worker model identifiers, grouped by harness and the `low`, `medium`, `high`, and `local` vocabulary.
- A proven active wrapper owns worker lifecycle and exposes the harnesses available through it. Without a wrapper, automatic delegation stays on the current harness and uses its native subagent tooling.
- Outside a wrapper, another harness is eligible only when the user names it explicitly, using its documented one-shot direct adapter.
- Automatic selection prefers an adequate local route with a free slot, then the lowest adequate online tier in catalog order. Automatic worker selection and fallback are limited to compatible catalog entries; exhausted coverage is a blocker.
- Local routes are grouped under their capability tier, and at most one local model process may run at a time. The current orchestrator consumes that slot when it uses a cataloged local model.
- `$code` and `$cleanup` retain their orchestrator-strength model policies instead of using the cheap worker catalog.

## Protected invariants

- Wrapper detection and the allowed harness set are resolved before catalog selection.
- Automatic routing never crosses to another harness outside a wrapper.
- Explicit preset requests stay within that preset, and explicit harness/model requests remain exact.
- Catalog identifiers are secret-free and have one authoritative owner.
- An automatically selected worker is launched with an explicit catalog model. A reported effective-model mismatch is stopped and its output is not used.
- Local-model concurrency never exceeds `max_local_concurrency`; excess work uses adequate online routes or waits for the local slot.
- Route choice, fallback, serialization, and missing coverage remain visible to the caller.
- Applicable provider-specific records, including Pi local-search restrictions, filter candidate routes before generic preference rules.

## Rationale and tradeoffs

Cheap models change often, so keeping their identifiers in one small catalog avoids repeated skill edits. Runtime-owned orchestration preserves lifecycle and role behavior, while explicit-only direct adapters prevent silent cross-harness launches. A single local slot trades throughput for predictable memory use and avoids OOM failures.

## Enforcement

- Catalog and behavior checks: [configuration tests](../../../tests/codex-config.test.mjs) and [bootstrap tests](../../../tests/bootstrap.test.sh).
- Routing instructions and evaluations: [subagent routing](../../../agent-home/skills/subagent-routing/SKILL.md).
- Review-only: confirm runtime evidence and wrapper-native lifecycle for live launches, which static checks cannot prove.

## History

- 2026-09-18: Closed automatic worker selection over catalog identifiers; removed native-default fallback and required effective-model verification when the runtime exposes it.
- 2026-09-18: Corrected local routes to tiered model lists and reaffirmed wrapper-native lifecycle ownership with current-harness native delegation when no wrapper is active.
- 2026-09-18: Approved the harness-first cheap-model catalog, runtime-aware delegation precedence, explicit direct adapters, and one-process local-model limit.
