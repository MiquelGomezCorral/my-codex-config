---
name: super-agent
description: Own delegation for any agent that launches, resumes, or nests workers — resolve the environment's lifecycle, select the harness, role, and cataloged model, grant nesting budgets, and preserve permissions, read-only limits, and the reporting contract.
---

# Super Agent

This skill owns delegation policy for every agent that launches, resumes, or nests a
worker: whether to delegate, which harness and role run the work, which cataloged model is
used, how much nesting is allowed, and what the caller reports. It does not own the
environment's tooling; calling workflows own task shape and acceptance. Do not restate
this policy elsewhere; point to it.

## Classes

Class is relative, not a property. Every agent is a delegate toward its parent and the
root over its own children; only the human-facing root has no parent.

- The root holds the user's turn and carries no `Class:` field.
- A delegate identifies itself with `Class: D`.
- Fail closed: a missing `Class:` means delegate, a missing `Delegation` means
  `forbidden`, and a missing `Depth:` means `1`.
- Only a parent writes budget fields; a child never widens its own allowance.
- Nesting requires both the parent's `Delegation` grant and the role capability
  (`allowNestedSubagents` where the harness supports it).

## Active wrapper first

Resolve the environment's own lifecycle before choosing anything else:

- Detect a managed runtime from session context, environment variables that identify it, or
  an installed skill that documents a worker lifecycle.
- When one is present, load that environment's own skills and guides and follow them for
  launch, status, wait, message, cancellation, resume, and release. Never restate,
  reimplement, or guess those operations.
- When a managed runtime is identified without an installed guide, use its documented help
  or discovery path.
- Otherwise use the current harness's native subagent tooling.
- Cross to another harness only through an explicitly requested documented one-shot adapter.

## Delegate or not

Delegate only when independent scopes or perspectives are useful. Prefer one worker for a
small task, a dependency chain, one slow external operation, or repeated mutation of the
same state. Never delegate to satisfy a roster.

## Select the route

Decision order:

1. The active wrapper, then the current harness.
2. Explicit user harness, role, model, ratio, or exclusion intent stays exact.
3. Restrictions declared by the current harness's own skills filter candidates before
   generic preference; they never license substituting another provider or harness for a
   restricted capability.
4. The catalog.

Catalog rules:

- Read `references/model-catalog.yaml` for every delegation. It is the only owner of cheap
  worker model identifiers; never copy those identifiers into skills, tests, agents, or
  documentation.
- Tiers are exactly `low`, `medium`, `high`, and `local`. List order is preference order,
  and the identifiers are a closed allowlist for automatic selection. Only a model the user
  named may run outside that allowlist.
- Prefer the cheapest adequate tier and an adequate local route first. `max_local_concurrency`
  is shared across the whole tree. Count a cataloged local orchestrator against it, and
  serialize or take an adequate online route while the slot is occupied.
- If the preferred entry is unavailable, try only compatible remaining entries in list order
  from the catalog. Never let a wrapper or harness choose an uncataloged default model; when
  compatible entries are exhausted, report the blocker.
- `$code` and `$cleanup` keep their configured orchestrator-strength workers.
- Keep at least `ceil(N / 2)` workers on the current harness only when no roster or
  harness preference was supplied by the user or invoking skill.
- Select each harness's real configured role by its description; never translate a role name
  across harnesses. Use a general agent only when that harness exposes no role catalog.

## Invariants

- Preserve scope, exclusions, permissions, directory, read-only limits, and stop conditions
  across every route; do not broaden authority to make a route work.
- Read-only work must not create a branch or worktree, edit, commit, push, publish, or change
  shared infrastructure without explicit authorization for that exact action.
- Pass model identifiers and prompts as separate arguments; never evaluate a catalog value
  as shell code.
- Pin the selected model through the launcher's explicit model option. When the runtime
  reports an effective model, verify it matches; stop a mismatched worker and do not use its
  output.
- Resume only an exact retained session whose parent, harness, role, model, and directory
  still match. Otherwise launch fresh and report the ownership mismatch.

## Report

Report the harness, role, tier, and exact effective model for every slot, plus every
fallback, local serialization, missing coverage, and verification gap. Distinguish
unattempted work from failed work. Never create hidden fallback chains or queues.

## References

| Reference | Read it when |
| --- | --- |
| `references/routing.md` | Selecting a harness or role, applying launch permissions, or crossing harnesses through a one-shot adapter. |
| `references/lifecycle.md` | Launching, waiting on, messaging, resuming, recovering, or releasing a worker. |
| `references/swarm.md` | Running, gating, or nesting multiple workers. |
| `references/model-catalog.yaml` | Choosing the cheap worker model identifier for any slot. |
