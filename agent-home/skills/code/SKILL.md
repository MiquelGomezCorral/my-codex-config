---
name: code
description: Execute or correct the current finalized implementation plan with one retained worker routed through an available agent harness. Use only when the user explicitly invokes `$code`.
---

# Code

Load `subagent-routing`.

Require a complete finalized plan from the current conversation. Collect any concrete
correction brief accepted by the user, including only accepted review findings or
live-test evidence and never unaccepted suggestions.

On the first `$code` call for this plan, before launching a worker:

- Check the decision-records skill and proceed as instructed there. Then come back and continue.
- Persist the finalized plan unchanged as a self-contained
   `.agents/plans/<short-kebab-task>.md` file, creating the directory when needed.
- Record the exact path for every later retained coder turn.

On later calls, reuse that path and do not rewrite the original plan with correction
briefs.

Pass explicit harness, agent, model, and exclusion intent to `subagent-routing`. Otherwise
prefer the active harness and its configured implementation role. In Codex that role is
`coder`. A retained worker is harness-, role-, model-, and directory-locked; report a
conflict instead of changing its identity.

Launch or resume exactly one worker through `subagent-routing`:

- `agent`: the selected harness's best matching configured implementation agent
- `prompt`: read the exact persisted plan path and preserve its goal; if this worker has
  no prior implementation turn, execute it, otherwise apply only the accepted correction
  brief and relevant evidence; if no later brief exists, stop without edits
- `directory`: the current worktree; create or use an isolated worktree only when the user
  explicitly requested it

Use the selected harness's direct launch for the initial worker and its retained-session
mechanism only when the returned session still belongs to this parent, harness, role,
model, and directory. Otherwise start a fresh suitable worker and report the mismatch.
Apply the routing policy's visible quota substitution without changing the plan or brief.

Do not implement product changes yourself. Wait for the worker. After a successful
initial implementation, apply only the exact approved `Main-agent memory updates` from
the plan; skip them if the coder stopped with a blocker. Inspect the resulting status
and diff, then report changed files, the minimum readiness check, any unchecked
requirement or blocker, and the pending live `Flow`, `Expected`, and `Can run`. Ask for
approval before live validation.
