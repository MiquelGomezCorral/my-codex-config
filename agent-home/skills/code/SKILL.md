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

1. Load the selected `decision-records` skill and compare the approved assessment with the
   current applicable records.
2. Resolve a missing assessment, material drift, or intent conflict before dispatch.
3. The main orchestrator applies only the exact approved record/index changes. If approved
   `Record changes` includes initializing a missing `docs/decisions/index.md`, create it from the
   selected skill's `assets/index-template.md` or the approved exact content, even when the
   separate concern assessment is `Decision records: no change`. Preserve an existing index,
   update it atomically with approved concern changes, and never overwrite or duplicate links.
   Do not repeat approval after these changes are authorized.
4. Persist the finalized plan unchanged as a self-contained
   `.agents/plans/<short-kebab-task>.md` file, creating the directory when needed.
5. Record the exact path for every later retained coder turn and dispatch the coder with the
   applicable record paths, protected constraints, and an explicit statement identifying
   document changes already applied by the main orchestrator.

The coder must not repeat or reinterpret those document edits. It implements within the
approved constraints and reports any conflict. If implementation fails after records were
written, report the failure and written paths accurately; do not claim implementation or
enforcement succeeded or silently roll back approved intent.

On later calls, reuse that path and do not rewrite the original plan with correction
briefs. Approved record changes travel through the existing correction brief; do not add an
unconditional reassessment to every correction turn.

Pass explicit harness, agent, model, and exclusion intent to `subagent-routing`. Otherwise
prefer the active harness and its configured implementation role. In Codex that role is
`coder`. A retained worker is harness-, role-, model-, and directory-locked; report a
conflict instead of changing its identity.

Launch or resume exactly one worker through `subagent-routing`:

- `agent`: the selected harness's best matching configured implementation agent
- `prompt`: read the exact persisted plan path and preserve its goal; if this worker has
  no prior implementation turn, execute it, otherwise apply only the accepted correction
  brief and relevant evidence; if no later brief exists, stop without edits. Return a
  concise report of completion, partial completion, or failure; changed paths; readiness
  check results; blockers or unchecked requirements; and pending live validation. Keep
  implementation inspection and checks in the worker; do not return diffs, file contents,
  or raw logs unless needed to explain a concrete blocker
- `directory`: the current worktree; create or use an isolated worktree only when the user
  explicitly requested it

Use the active wrapper through `subagent-routing` for the initial worker and its
retained-session mechanism when one is present; without a wrapper, use the current
harness's native worker lifecycle. Reuse only an exact session whose parent, harness,
role, model, and directory still match. Otherwise start a fresh suitable worker and
report the mismatch.
Apply the routing policy's visible quota substitution without changing the plan or brief.

Do not implement product changes yourself. Wait for the worker and use its report as
the source for your status update. Do not review the implementation, inspect git status
or diffs, read changed or new implementation files, rerun checks, or launch a reviewer
to verify the worker's work. Review is deferred to a separate user request. Keep code
and inspection output out of your context.

After a successful initial implementation, apply only the exact approved
`Main-agent memory updates` from the plan; skip them if the coder stopped with a blocker.
Read only the memory content needed for those updates, without expanding into code
inspection. If the worker's report is missing essential status, ask that worker for a
concise clarification instead of investigating yourself. A stopped or failed worker
without a completion report is not evidence of success.

Report the worker's stated outcome, changed paths, readiness results, blockers or gaps,
and pending live `Flow`, `Expected`, and `Can run`. Attribute results to the worker;
do not claim independent verification. Leave live validation pending user approval,
then stop without starting review or follow-up work.
