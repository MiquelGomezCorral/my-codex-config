---
name: code
description: Execute or correct the current finalized implementation plan with one retained worker routed through an available agent harness. Use when the user explicitly invokes `$code` or an approved complete workflow reaches its coding stage.
---

# Code

Load `super-agent`.

When called from an approved workflow, require the complete workflow context and use its
exact slice scope, exclusions, and plan path. Context routes this coding stage; it does
not expand scope or grant live, Git, or destructive-action permission.

Require a complete finalized plan from the current conversation, or from the approved
workflow plan path when workflow context is present. Collect any concrete
correction brief accepted by the user, including only accepted review findings or
live-test evidence and never unaccepted suggestions.

On the first standalone `$code` call for this plan, before launching a worker,
the human-facing agent loads `agents-memory` and resolves the shared private plan path:

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
   `agent-memory/plans/<short-kebab-task>.md` file under the resolved Git common directory,
   creating that private directory when needed. Reuse an exact existing approved plan path
   when continuing older work.
5. Record the absolute path for every later retained coder turn. Dispatch the coder with
   applicable record paths, protected constraints, and an explicit statement identifying
   document changes already applied by the main orchestrator.

In approved workflow context, `$workflow` has already persisted the exact wave plan and
applied approved decision-record changes. Require that plan path and reuse it unchanged;
do not persist a second plan or repeat the first-call document writes. Pass the current
approved slice refinement and amendments as context, without replacing the wave plan.

The coder reads only the exact supplied plan, not other private memory. It must not
repeat or reinterpret those document edits. It implements within the
approved constraints and reports any conflict. If implementation fails after records were
written, report the failure and written paths accurately; do not claim implementation or
enforcement succeeded or silently roll back approved intent.

On later calls, reuse that path and do not rewrite the original plan with correction
briefs. Approved record changes travel through the existing correction brief; do not add an
unconditional reassessment to every correction turn.

Pass explicit harness, agent, model, thinking, and exclusion intent to `super-agent`.
Otherwise it resolves the catalog `coder` role and the harness's matching native agent. A
retained worker is harness-, role-, model-, thinking-, and directory-locked; report a
conflict instead of changing its identity.

Launch or resume exactly one first-tier worker through `super-agent`. Standalone `$code`
uses the configured implementation role (`coder` in Codex). For approved workflow context,
read `Coding size` from the human-approved plan: `small` goes directly to one retained
`coder`; `large` goes to the read-only `coding-supervisor`, with a bounded grant to direct
exactly one retained coder and coordinate the plan-selected read-only review within the
approved slice. Stop if size is missing or conflicts
with the plan. Keep one product-code writer at a time.

- `agent`: the selected harness's best matching configured implementation agent, or the
  plan-sized `coder` / `coding-supervisor` route above
- `prompt`: read the exact persisted plan path and preserve its goal; if this worker has
  no prior implementation turn, execute it, otherwise apply only the accepted correction
  brief and relevant evidence; if no later brief exists, stop without edits. Return a
  concise report of completion, partial completion, or failure; changed paths; readiness
  check results; blockers or unchecked requirements; and pending live validation. Keep
  implementation inspection and checks in the worker; do not return diffs, file contents,
  or raw logs unless needed to explain a concrete blocker. In large-plan workflow context,
  the supervisor verifies correction scope and evidence but does not edit product source.
- When supplied, pass the exact approved workflow context, slice outcome, scope, exclusions,
  progress path, and authorization bounds. Do not derive new permission from them.
- `directory`: the current worktree; create or use an isolated worktree only when the user
  explicitly requested it

Use the active wrapper through `super-agent` for the initial worker and its
retained-session mechanism when one is present; without a wrapper, use the current
harness's native worker lifecycle. Reuse only an exact session whose parent, harness,
role, model, and directory still match. Otherwise start a fresh suitable worker and
report the mismatch.
The retained writer uses the harness's normal native coding capability. Stage routes and
their limits are in `workflow/references/native-capabilities.md`.
Apply the routing policy's visible quota substitution without changing the plan or brief.

Do not implement product changes yourself. Wait for the worker and use its report as
the source for your status update. Do not review the implementation, inspect git status
or diffs, read changed or new implementation files, rerun checks, or launch a reviewer
to verify the worker's work. In an approved workflow, return control to `$workflow` for
the next review or cleanup stage; `$code` itself still stops after implementation.
Outside workflow context, review remains deferred to a separate user request. Keep code
and inspection output out of your context.

After a successful initial standalone implementation, apply only the exact approved
`Main-agent memory updates` from the plan; skip them if the coder stopped with a blocker.
In workflow context, the root applies them after the human accepts the verified result;
`$code` must not duplicate those writes.
Read only the memory content needed for those updates, without expanding into code
inspection. If the worker's report is missing essential status, ask that worker for a
concise clarification instead of investigating yourself. A stopped or failed worker
without a completion report is not evidence of success.

Report the worker's stated outcome, changed paths, readiness results, blockers or gaps,
and pending live `Flow`, `Expected`, and `Can run`. Attribute results to the worker;
do not claim independent verification. Leave live validation pending user approval.
Without workflow context, stop without starting review or follow-up work.
