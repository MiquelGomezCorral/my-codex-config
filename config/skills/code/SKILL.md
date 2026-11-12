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
3. The main orchestrator applies the exact approved changes through the selected
   `decision-records` skill, including approved index initialization.
   Do not repeat approval after these changes are authorized.
4. Persist the finalized plan unchanged as a self-contained
   `plan.md` file in the plan's folder that [planning](../workflow/references/planning.md#finalize-the-wave)
   names, under the resolved Git common directory,
   creating that private directory when needed. Reuse an exact existing approved plan path
   when continuing older work.
5. Record the absolute path for every later retained coder turn. Dispatch the coder with
   applicable record paths, protected constraints, and an explicit statement identifying
   document changes already applied by the main orchestrator.

In approved workflow context, `$workflow` has already persisted the exact wave plan and
applied approved decision-record changes. Require that plan path and reuse it unchanged;
do not persist a second plan or repeat the first-call document writes. Pass the current
approved slice refinement and amendments as context, without replacing the wave plan.

The coder reads only the exact supplied plan, not other private memory, except to grep
`known-errors.md` and `workflow.md` as the global policy requires, reading only matches. It must not
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
read the slice's `Size:` from the human-approved plan: `small` goes directly to one retained
`coder`; `medium` and `large` go to the read-only `coding-supervisor`, which owns the
slice's workflow stages 4-6 (stage 5 sets its grant and the Orca fallback). Stop if size is
missing or conflicts with the plan. Keep one product-code writer at a time.

- `agent`: the selected harness's best matching configured implementation agent, or the
  plan-sized `coder` / `coding-supervisor` route above
- `prompt`: read the exact persisted plan path and preserve its goal; if this worker has
  no prior implementation turn, execute it, otherwise apply only the accepted correction
  brief and relevant evidence; if no later brief exists, stop without edits. Return a
  concise report of completion, partial completion, or failure; changed paths; readiness
  check results; blockers or unchecked requirements; and pending live validation. Keep
  implementation inspection and checks in the worker; do not return diffs, file contents,
  or raw logs unless needed to explain a concrete blocker. In medium- or large-slice workflow context,
  the supervisor returns the evidence packet that `workflow` stage 6 lists in place of this
  report.
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
the source for your status update. Do not review the implementation yourself, inspect git
status or diffs, read changed or new implementation files, or rerun checks. These limits bind
the `$code` caller; a `coding-supervisor` it launches for a medium or large slice runs that
slice's review and cleanup itself. In an approved workflow, return control to `$workflow` for
the next review or cleanup stage of a `small` slice, or with the supervisor's evidence packet
for a medium or large one; `$code` itself still stops after implementation.
Outside workflow context, the independent review the global policy requires comes after
implementation (see the final paragraph). Before it, when the coder's report sizes the UI
impact noticeable or big, the `$code` caller launches `ui-checker` through `super-agent` and
sends its block to the same coder as a correction brief (the coder fixes the new findings and
lists the old ones, as code-quality `ui.md` says). This is the policy's UI check, not a
review. Keep code and inspection output out of your context.

After a successful initial standalone implementation, apply only the exact approved
`Main-agent memory updates` from the plan; skip them if the coder stopped with a blocker.
In workflow context, the root applies them after the human accepts the verified result;
`$code` must not duplicate those writes.
Read only the memory content needed for those updates, without expanding into code
inspection. If the worker's report is missing essential status, ask that worker for a
concise clarification instead of investigating yourself. A stopped or failed worker
without a completion report is not evidence of success.

Report the worker's stated outcome, changed paths, readiness results, blockers or gaps,
and pending live `Flow`, `Expected`, and `Can run`. Attribute results to the worker; claim
independent verification only from the review below. Leave live validation pending user
approval. Without workflow context, after implementation run the independent review the
global policy requires for a non-trivial change (`$review`) before reporting it complete;
send blocking findings to the same coder as a correction brief and re-check once. Attribute
any still-unverified results to the worker.
