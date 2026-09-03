---
name: agent-swarm
description: Coordinate two or more independent native Codex subagent scopes for parallel research, review, testing, debugging, comparison, or isolated implementation. Skip trivial, sequential, tightly coupled, or single-writer work.
---

# Agent Swarm

The parent owns scope, integration, verification, and the final answer. Workers
return bounded evidence; they do not redefine the task or coordinate the swarm.

## Gate

Use a swarm only when:

- At least two scopes or perspectives are independent.
- Workers need no shared evolving state.
- Better coverage or wall-clock time justifies extra model usage.

Start with two workers. Use three or four only for broad or high-risk work. Never
exceed five or create nested swarms without explicit user direction. Never duplicate
prompts unless independent voting is intentional.

## Workflow

1. Define success and map dependencies.
2. Load `subagent-routing` before any launch or resume.
3. Choose only from available native agent descriptions. Assign each worker one exact scope,
   adjacent exclusions, permissions, and output.
4. Use read-only agents for exploration and review. Give concurrent writers disjoint
   files or isolated worktrees; otherwise serialize them. Never run two writers against
   the same worktree at once.
5. Launch independent native workers with `spawn_agent` in the same turn and collect
   them with `wait_agent`; use dependency waves only when later work needs earlier evidence.
6. Use `send_message` for a bounded clarification, `followup_task` only for the exact
   owned session, and `interrupt_agent` when cancellation is requested. Verify consequential claims, merge duplicates, resolve disagreements with evidence,
   and return one synthesized result rather than transcript fragments.

## Worker Packet

Include only applicable fields:

```text
Goal: observable outcome
Scope: owned files or question
Exclusions: adjacent work and non-goals
Context: relevant decisions and paths
Allowed actions: read-only or isolated edits
Models/lifecycle: native Codex model and native agent session; no implicit fallback
Deliverable: exact result shape
Evidence: required file:line, URL, command, or test
Stop: completion and blocker conditions
```

## Failure And Boundaries

- Continue with useful successful workers when a non-critical worker fails.
- Retry only through the routing policy. Do not replay a prompt into an unowned session.
- Prefer one narrow follow-up over relaunching the swarm.
- Stop when success is proven, no new evidence appears, or failures are exhausted.
- Never let workers commit, push, publish, or change shared infrastructure unless the
  user explicitly authorized that exact action.
