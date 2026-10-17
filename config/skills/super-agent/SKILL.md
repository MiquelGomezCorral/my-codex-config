---
name: super-agent
description: Own delegation for any agent that launches, resumes, or nests workers — resolve the environment's lifecycle, select the catalog role's harness, model, and thinking, grant nesting budgets, and preserve permissions, read-only limits, and the reporting contract.
---

# Super Agent

This skill owns delegation policy for every agent that launches, resumes, or nests a
worker: whether to delegate, which harness, role, catalog model, and thinking run the work,
how much nesting is allowed, and what the caller reports. It does not own the
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
- For Orca, load the version-matched adapter guide in the `orchestration` skill's
  `references/orca.md` before lifecycle commands.
- The environment's guides, hooks, lifecycle, and files come first and this skill adds
  routing on top. Where an environment guide documents a limit or a different way to do
  something, the guide wins and this skill reports the gap. Catalog pins are the user's
  standing model choice, so pass them through the options the guide documents. Never edit,
  regenerate, or work around files, hooks, or settings the environment owns.
- Otherwise use the current harness's native subagent tooling.
- Cross to another harness only through an explicitly requested documented one-shot adapter.

## Delegate or not

The human-facing root does small, scoped work itself and delegates anything bigger, so it
stays available to the user. Fan out to several workers only when independent scopes or
perspectives are useful. Prefer one worker for a
small task, a dependency chain, one slow external operation, or repeated mutation of the
same state. Never delegate to satisfy a roster.
Prefer in-session tools. Reuse native agents or swarms only when model and thinking
pinning, target scope, nesting budget, one-writer ownership, and observable lifecycle all
hold. Launch a
separate native session only through the active wrapper; do not bypass it with unmanaged
CLI execution.

## Select the route

Decision order:

1. The active wrapper, then the current harness.
2. Explicit user harness, role, model, thinking, ratio, or exclusion intent stays exact.
3. Restrictions declared by the current harness's own skills filter candidates before
   generic preference; they never license substituting another provider or harness for a
   restricted capability.
4. The catalog role for the stage.

### Catalog roles

`references/model-catalog.yaml` owns harness, exact model, and thinking for every
automatic launch. A stage maps to exactly one role:

| Stage | Catalog role |
| --- | --- |
| Human root, planning, or intake | `super_agent` |
| Delegated coordinator, coding supervisor, cleanup coordinator, or review coordinator while nesting | `sub_orchestrator` |
| Implementation, Git, or artifact writer | `coder` |
| Adversarial plan critic | `adversarial` |
| Strong reviewer in a review swarm or cleanup audit, or cleanup closure check | `reviewer-high` |
| Direct review, verifier, or live validator | `reviewer-fast` |
| Supporting read-only investigation, review-swarm or cleanup-swarm specialist | `swarms` |

`reviewer-fast` and `swarms` follow the current harness instead of naming one. The current
harness is the harness of the agent doing the launch (a delegate's own harness, not the
root's or the wrapper's default), read from runtime evidence. The role's `by_harness` entry
for it gives the model and thinking. When that model is unavailable, use the same harness's
`low` tier with that tier's model and thinking. A current harness with no `by_harness`
entry is a blocker.

A cleanup or review worker uses `sub_orchestrator` only while it coordinates assigned
workers under a matching nesting grant; its own work keeps the role above.

A role entry written as a list holds slots. Each slot has its own harness, model or
ordered candidates, and thinking, and each launched slot is a separate worker; slots
are not fallbacks for each other. The fan-out a stage requires (both critics, strong
reviewers, the cleanup swarm) is justified by that stage.

Launch only slots that can run. When a provider or route is unavailable, skip its slot,
continue with the others, and tell the user the stage ran with reduced coverage; the stage
can still pass. Only a role with no runnable slot is a blocker. Slot counts:

- `adversarial`: launch every runnable slot. Prefer at least one critic from a model
  family other than the planner's. When none is available, the stage still passes; tell
  the user it ran without a different-family critic.
- `reviewer-high`: launch the first runnable slot by default, and two when the change
  touches security, data, public contracts, or migrations, or is large or spans several
  modules. A cleanup closure check launches one.
- `swarms`: a lens whose route cannot run is reported as missing coverage; a cleanup
  coordinator may cover that lens itself and lists it in its roster.

Every automatic launch rereads the mapped role entry and resolves its harness, exact model
or ordered candidate list, and thinking, then pins every option the launcher supports. Role
settings win over generic tiers, invoking-skill and wrapper model preferences, inherited
defaults, and any role-file model or effort metadata. An explicit current-user harness,
model, or thinking override wins over the role entry.

The `low`, `medium`, `high`, and `local` tier records are only for a launch the user or
approved plan explicitly routed by tier or harness, plus the `low` fallback of
`reviewer-fast` and `swarms` above. Ordered candidates are fallback order, never random
distribution, and for every other role an exhausted candidate list is a blocker with no
automatic escape to a tier or harness default. Unavailability or capability filtering may
drop a candidate but never silently changes the role harness or thinking.

The root `super_agent` entry governs new root launches. Reading the catalog cannot switch
the harness of an existing main conversation; report a configured-versus-observed mismatch
once instead of spawning a replacement or authenticating.

Catalog rules:

- Read `references/model-catalog.yaml` for every delegation. It is the only owner of
  worker model identifiers; never copy those identifiers into skills, tests, agents, or
  documentation.
- Tiers are exactly `low`, `medium`, `high`, and `local`, and their identifiers are a
  closed allowlist. The role candidate list is the automatic-selection allowlist; only a
  model the user named may run outside it.
- When the user explicitly routes by tier, prefer the cheapest adequate tier and an
  adequate local route first. `max_local_concurrency` is shared across the whole tree.
  Count a cataloged local orchestrator against it, and serialize or take an adequate
  online route while the slot is occupied. A value of `0`, or `local_models:
  not-available`, means skip local routes and take an online route.
- Try only compatible remaining entries in list order from the role entry when the
  preferred candidate is unavailable.
- Never let a wrapper or harness choose an uncataloged default model; report the blocker
  when compatible entries are exhausted.
- Keep at least `ceil(N / 2)` workers on the current harness only when no catalog role,
  roster, or harness preference fixes that slot's harness.
- Select each harness's real configured role by its description; never translate a role name
  across harnesses. Use a general agent only when that harness exposes no role catalog.

## Dispatch contract

Every automatic launch packet names `Catalog role`, `Harness`, `Model`, and `Thinking`,
plus the task's native agent role, scope, exclusions, deliverable, evidence, stop
conditions, and nesting authority. When the worker must explore code, the packet names
every worktree path and requires CodeGraph first. Every packet requires the report to end
with `Memory candidates:` or `none`. Verify the effective model and thinking whenever the
runtime reports them; report an unverified effort or unavailable pinning option instead of
silently discarding it.

## Invariants

- Preserve scope, exclusions, permissions, directory, read-only limits, and stop conditions
  across every route; do not broaden authority to make a route work.
- The human-facing agent owns `agents-memory`. Pass workers only the relevant facts or
  exact plan they need, not private memory access; the one exception is the Git worker's
  `plans/` search in the `git` skill's plan context. Workers report useful memory candidates
  to their parent for the human-facing agent to assess.
- Read-only work must not create a branch or worktree, edit, commit, push, publish, or change
  shared infrastructure without explicit authorization for that exact action.
- Pass model identifiers and prompts as separate arguments; never evaluate a catalog value
  as shell code.
- Pin the selected model and thinking through the launcher's explicit options. When the runtime
  reports an effective model or thinking, verify it matches; stop a mismatched worker and do not
  use its output. Report an unavailable pinning option or unverified effort instead of silently
  dropping it.
- Resume only an exact retained session whose parent, harness, role, model, thinking, and
  directory still match. Otherwise launch fresh and report the ownership mismatch.

## Report

Report the catalog role, harness, exact model, thinking, and effective values for every
slot, plus every fallback, local serialization, missing coverage, and verification gap. Distinguish
unattempted work from failed work. Never create hidden fallback chains or queues.

## References

| Reference | Read it when |
| --- | --- |
| `references/routing.md` | Selecting a harness or role, applying launch permissions, or crossing harnesses through a one-shot adapter. |
| `references/lifecycle.md` | Launching, waiting on, messaging, resuming, recovering, or releasing a worker. |
| `references/swarm.md` | Running, gating, or nesting multiple workers. |
| `references/model-catalog.yaml` | Resolving a stage's catalog role, harness, model, and thinking. |
