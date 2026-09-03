---
name: code
description: Execute or correct the current finalized implementation plan with the retained native Codex coder. Use only when the user explicitly invokes `$code`; skip ordinary coding requests, planning, and review.
---

# Code

Load `subagent-routing`.

Require a complete finalized plan from the current conversation. Collect any concrete
correction brief accepted by the user, including only accepted review findings or
live-test evidence and never unaccepted suggestions.

On the first `$code` call for this plan, before launching a subagent:

- Persist the finalized plan unchanged as a self-contained
   `.agents/plans/<short-kebab-task>.md` file, creating the directory when needed.
- Record the exact path for every later retained coder turn.

On later calls, reuse that path and do not rewrite the original plan with correction
briefs.

If the invocation input contains a native Codex `--model <model>` value, pass it as
`model`. Otherwise omit the model so the coder uses its configured default. A retained
coder is model-locked, so report a model conflict instead of replacing it.

Launch or resume exactly one worker with `spawn_agent` or `followup_task`:

- `agent`: `coder`
- `prompt`: read the exact persisted plan path and preserve its goal; if this worker has
  no prior implementation turn, execute it, otherwise apply only the accepted correction
  brief and relevant evidence; if no later brief exists, stop without edits
- `worktree`: the current worktree when the native harness requires it

Use `spawn_agent` directly for the initial native worker. Use `followup_task` only when the
returned session still belongs to this parent, role, model, and directory. Otherwise start
a new native worker and report the ownership mismatch.

Do not implement product changes yourself. Wait for the coder. After a successful
initial implementation, apply only the exact approved `Main-agent memory updates` from
the plan; skip them if the coder stopped with a blocker. Inspect the resulting status
and diff, then report changed files, the minimum readiness check, any unchecked
requirement or blocker, and the pending live `Flow`, `Expected`, and `Can run`. Ask for
approval before live validation.
