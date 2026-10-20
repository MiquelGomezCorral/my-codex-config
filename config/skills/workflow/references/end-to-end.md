# End-to-end flow

1. Initialize run state with the workflow-progress CLI at intake. Gather evidence and produce an independent first proposal without source code or the
   preferred solution.
2. Improve the candidate, resolve material choices, and obtain human acceptance.
3. Run the two-critic adversarial critique and one rebuttal, then persist and present the full wave plan,
   evidence, slice map, live test sets, editable diagrams, and visual preview. Obtain
   explicit human approval for delivery before coding.
4. Narrow one approved slice against current repository state, escalate changes, obtain
   missing live authorization, and run the live tests on the slice base, as workflow
   stage 4 describes.
5. Record the slice base before coding. Route `small` slices directly to one retained coder
   and `medium` or `large` slices through a read-only coding supervisor with a bounded
   one-coder grant. The root for `small`, or supervisor for `medium` or `large`, runs the plan-selected `$review` preset
   against the full slice: base-to-head changes plus task-owned staged, unstaged, and
   untracked changes. The reviewer reports the inspected revisions. Each round also runs
   the slice's live tests ([coding loop](coding-loop.md)). Verify required checks and
   review findings; correct every verified in-scope P0-P3 finding in priority order.
6. After coding gates pass, make the plan-authorized local checkpoint and record its hash.
   Audit the complete task-owned comparison from slice base through the checkpoint and later
   worktree changes. Skip cleanup only when this full comparison is empty; route verified
   in-scope simplifications through the same coding loop and rerun affected checks,
   review, and the live test set.
7. Present the observed result only after cleanup corrections pass their affected gates.
   Wait for human acceptance.
8. After result acceptance, the Git worker inspects remaining changes against the approved
   scope and accepted result, stages explicit task-owned deliverables, and commits only when
   needed. Exclude private memory, progress files, temporary agent artifacts, and unrelated
   changes. Verify the final tree matches the accepted result, record the final commit hash,
   then run only Git actions named by the plan. Resolve merge conflicts
   through the Git worker, rerun affected checks/review, and re-present changed or uncertain
   behavior. Inspect required CI and
   review, then prepare the next slice from this accepted PR head after all gates pass.
9. Reconcile progress at interruptions. Run the wave regression (workflow stage 9), then
   close the wave with completed work, open decisions, deferred observations, and lessons.

A `final-only` wave replaces steps 7 and 8 with a local commit per slice and one final
gate, as workflow stages 7-9 describe.

At every step, missing authority or required evidence is a stop condition for that action.
Use the `git` skill for Git authority. Record other blockers and their next decision; never
mark the slice complete from context or progress state alone.
The human-facing coordinator advances routine stages after their exit evidence passes;
only material decisions and bounded approval gates return to the human.
