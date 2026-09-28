# End-to-end flow

1. Start local progress at intake. Gather evidence and produce an independent first proposal without source code or the
   preferred solution.
2. Improve the candidate, resolve material choices, and obtain human acceptance.
3. Run one adversarial critique and rebuttal, then persist and present the full wave plan,
   evidence, slice map, editable diagrams, and visual preview. Obtain explicit human
   approval for delivery before coding.
4. Narrow one approved slice against current repository state. Escalate any changed
   behavior, scope, validation route, or authority; obtain missing live authorization.
5. Route `small` plans directly to one retained coder and `large` plans through a
   read-only coding supervisor with a bounded one-coder grant. The root for `small`, or
   supervisor for `large`, runs the plan-selected `$review` preset against the resulting
   head and full approved plan. Verify required checks and review findings; correct every
   verified in-scope P0-P3 finding in priority order.
6. After coding gates pass, make the plan-authorized local checkpoint, then audit cleanup
   findings and route verified in-scope simplifications through the same coding loop.
7. Present the observed result and evidence. Wait for human acceptance.
8. After result acceptance, run only Git actions named by the plan. Resolve merge conflicts
   through the Git worker, rerun affected checks/review, and re-present changed or uncertain
   behavior. Inspect required CI and
   review, then prepare the next slice from this accepted PR head after all gates pass.
9. Reconcile progress at interruptions and close the wave with completed work, open
   decisions, deferred observations, and lessons.

At every step, missing authority or required evidence is a stop condition for that action.
Use the `git` skill for Git authority. Record other blockers and their next decision; never
mark the slice complete from context or progress state alone.
The human-facing coordinator advances routine stages after their exit evidence passes;
only material decisions and bounded approval gates return to the human.
