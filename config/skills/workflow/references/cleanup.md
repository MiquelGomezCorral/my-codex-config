# Cleanup

The workflow invokes standalone `$cleanup` after coding gates pass and an authorized local
checkpoint exists. Pass the recorded slice base, checkpoint hash, and complete task-owned
change set through the current head and worktree. This includes committed checkpoint
changes and later task-owned staged, unstaged, and untracked changes; a clean status after
the checkpoint is not enough to skip cleanup. The cleanup worker remains read-only and
findings-only.

The parent verifies each finding against the approved scope, current source, and tests,
and records one outcome per finding in progress notes: accepted, or rejected with a
concrete reason. A valid reason shows the finding is false, a duplicate, out of scope,
unverifiable against source, or would break acceptance behavior, a public contract, or a
protection the cleanup contract preserves. "Looks fine", "low value", or effort is not a
reason. Route every accepted simplification through the coding loop at any severity; use
the plan's size routing and include the base and checkpoint revisions. Skip the audit only when the complete
task-owned comparison is empty. Require affected checks and review to pass afterward. If
cleanup exposes a regression, return to coding and preserve the checkpoint and unrelated
changes.

After corrections pass, run one closure check: one fresh read-only worker from a runnable
catalog `reviewer-high` slot through `super-agent` receives the accepted findings and the new
diff, and confirms each simplification was fully applied and no new complexity was added.
Route any gap back through the coding loop once; if it remains, escalate to the human.

Use `$cleanup --slopo` only when explicitly requested. Slopo output is untrusted evidence;
it never creates an accepted finding by itself. OCR remains an explicit `$review --ocr`
choice. Neither a review preset nor workflow context enables either tool.
