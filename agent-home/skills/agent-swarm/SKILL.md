---
name: agent-swarm
description: Orchestrate agents across the active harness and other available harnesses when the user asks for delegation, agents, a swarm, parallel workers, or a workflow requires multiple agents.
---

# Agent Swarm

The parent owns scope, integration, verification, and the final answer. Workers own
bounded tasks and evidence.

## Routing

- Load `subagent-routing` before any launch or resume.
- Honor the user's harness, agent, model, ratio, and exclusion choices. Otherwise keep at
  least half the workers, rounded up, on the active harness and route the remainder to
  useful independent agents from other available harnesses.
- Use the selected harness's configured agent descriptions and lifecycle mechanism. Do
  not invent cross-harness role mappings or external commands.
- Preserve an explicitly requested role, model, reasoning effort, and directory. Apply
  the routing skill's visible quota fallback without changing the worker's assignment.

## Gate

Use a swarm only when:

- At least two useful scopes or perspectives are independent.
- Each worker can progress without another worker's unfinished result.
- Parallelism or independent review justifies the extra tokens and coordination.

Prefer one agent for a small task, a dependency chain, one slow external operation,
or work that repeatedly mutates the same state. Launch only workers with distinct
responsibilities and honor the runtime concurrency limit across the whole agent tree.
Duplicate prompts only for intentional independent voting.

## Workflow

1. Define observable success, split the work, and map dependencies.
2. Give every scope one owner. Keep integration and final verification with the parent.
3. Write all worker packets before launching. Pass the smallest useful history; make
   packets self-contained when the worker does not need the conversation.
4. Launch independent workers in the same turn. Use dependency waves when later work
   needs earlier evidence.
5. Continue non-overlapping parent work, then wait with a realistic timeout. Keep the
   user informed during long runs.
6. Collect every relevant result. Deduplicate, reconcile disagreements against evidence,
   and verify consequential claims before acting on them.
7. Integrate once, run the applicable checks, and return one synthesized answer.

## Lifecycle

- Launch independent workers in the same turn when their selected mechanisms support it.
  Use each harness's documented status, wait, message, cancellation, and resume actions.
- For Codex workers, `spawn_agent` creates a child, `send_message` adds context,
  `followup_task` resumes an exact retained child, `wait_agent` collects results,
  `interrupt_agent` cancels work, and `list_agents` verifies identity and status.
- Before resuming any worker, verify its parent, harness, role, model, and directory.
  Agents are not moved between those identities.
- Cancel a coordinator subtree deepest-first when its harness exposes descendants; then
  confirm the coordinator stopped.


## Worker Packet

Use only applicable fields, but always include the goal, scope, deliverable, and stop
condition:

```text
Goal: observable outcome
Scope: owned files or question
Exclusions: adjacent work and non-goals
Context: relevant decisions and paths
Allowed actions: read-only or isolated edits
Delegation: forbidden, or exact nested-swarm allowance
Harness/model/lifecycle: requested route and allowed quota substitution
Deliverable: exact result shape
Evidence: required file:line, URL, command, or test
Stop: completion and blocker conditions
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
independent, route one read-only child to each with the available agent mechanisms. Run
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
- Do not broaden permissions or hide failures. Use only the routing policy's explicit,
  reported quota substitution.
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
