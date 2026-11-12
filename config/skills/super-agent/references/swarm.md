# Swarm

The parent owns scope, integration, verification, and the final answer. Workers own
bounded tasks and evidence.

## Routing

- Route, launch, wait, resume, and recover only through `super-agent`; do not restate its
  policy here. A swarm may include useful independent workers from other available harnesses
  when the user requests a mix.

## Gate

Use a swarm only when:

- At least two useful scopes or perspectives are independent.
- Each worker can progress without another worker's unfinished result.
- Parallelism or independent review justifies the extra tokens and coordination.

The one-worker preference in `SKILL.md` (Delegate or not) applies first. Launch only workers
with distinct responsibilities and honor the runtime concurrency limit across the whole
agent tree. Duplicate prompts only for intentional independent voting.

## Isolated tasks

When the user explicitly requests an isolated task, do not implement it in the parent.
Create an isolated worktree through the active wrapper's documented mechanism, then launch
exactly one worker there with the worker packet below. The worker owns the task and the
parent only shapes it; `super-agent` owns routing, model selection, fallback, local
concurrency, and release for that launch. Never create a worktree without an explicit user
request.

## Workflow

1. Define observable success, split the work, and map dependencies.
2. Give every scope one owner. Keep integration and final verification with the parent.
3. Write all worker packets before launching. Pass the smallest useful history; make
   packets self-contained when the worker does not need the conversation.
4. Launch independent workers in the same turn, within the grant's `active` cap; past it,
   the parent starts each next worker as an earlier one finishes. Use dependency waves when
   later work needs earlier evidence.
5. Continue non-overlapping parent work, then wait with a realistic timeout. Keep the
   user informed during long runs.
6. Collect every relevant result. Deduplicate, reconcile disagreements against evidence,
   and verify consequential claims before acting on them.
7. Integrate once, run the applicable checks, and return one synthesized answer.

## Lifecycle

- Launch independent workers in the same turn, within the grant's `active` cap (step 4),
  when their selected mechanisms support it.
- Resume identity checks follow `SKILL.md` (Invariants).

## Worker Packet

Use the template in `routing.md` (Dispatch contract); its conditional fields say when they
apply. Always include the goal, scope, deliverable, and stop condition. A swarm packet adds:

```text
Goal: observable outcome
Context: relevant decisions and paths
Allowed actions: read-only or isolated edits
```

Tell workers what not to touch, whether they may edit, whether other workers are
concurrent, and whether they may spawn descendants. Do not ask a worker to "handle"
a broad area without an output contract.

## Nested Swarms

Nested delegation is opt-in at the root. Allow it only when the user explicitly requests
recursive delegation or a user-selected workflow requires it; descendants cannot grant
themselves more delegation authority. The root packet must set:

- the independent child scopes;
- maximum depth, total descendants, and active-descendant concurrency;
- allowed harnesses, roles, and model requirements;
- file ownership and whether descendants are read-only;
- whether another nesting level is forbidden;
- the evidence the worker must synthesize before returning.

Canonical nested instruction:

```text
Delegation: Nested swarm allowed. If protocol analysis and failure analysis are
independent, route one read-only child to each through `super-agent` and the active
wrapper or current harness. Run
them concurrently, do not let either edit files or spawn further agents, collect both,
verify their citations, and return one reconciled result. Maximum depth is one, with two
total and two active descendants.
```

The worker that spawns descendants becomes their coordinator. It must collect and
synthesize them; it must not forward raw transcripts to its parent.

## Shared Workspace

- Parallel readers are safe. Concurrent writers need disjoint files or isolated
  worktrees; otherwise serialize them.
- State explicit file ownership and tell workers not to revert unrelated or concurrent
  changes. All descendants count against the shared concurrency budget.
- Never let workers commit, push, publish, deploy, or change shared infrastructure
  unless the user authorized that exact action.

## Failure And Boundaries

- Continue with useful successful workers when a non-critical worker fails.
- Prefer one narrow follow-up in the owned retained session over relaunching it.
- Do not replay prompts into unknown sessions or reuse a child after its identity no
  longer matches the task.
- Do not broaden permissions or hide failures.
- Retry a failed operation once only when the error or changed input supports recovery;
  do not blind-retry. The coordinating parent decides whether evidence satisfies the
  acceptance criteria and reports the last command, error, and remaining blocker.
- Stop when acceptance evidence is complete or safe in-scope recovery is exhausted.

## Examples

Parallel research:

```text
research-a: Compare sources A and B; read-only; return claims with URLs; no descendants.
research-b: Test the competing hypothesis against source C; read-only; return contrary
evidence with URLs; no descendants.
parent: Reconcile both reports and cite only verified claims.
```

Steering retained agents:

```text
The running frontend worker lacks one acceptance rule -> use its harness's bounded-message action.
The completed reviewer needs to verify one new finding -> use its harness's identity
check, then resume that exact session.
The user cancels the backend scope -> use its harness's cancellation action.
```
