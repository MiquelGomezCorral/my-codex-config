# Cleanup

The workflow invokes standalone `$cleanup` after coding gates pass and an authorized local
checkpoint exists. Pass the recorded slice base, checkpoint hash, and complete task-owned
change set through the current head and worktree. This includes committed checkpoint
changes and later task-owned staged, unstaged, and untracked changes; a clean status after
the checkpoint is not enough to skip cleanup. The cleanup worker remains read-only and
findings-only.

The parent verifies each finding against the approved scope, current source, and tests.
Reject false positives and duplicate findings. Keep out-of-scope observations in progress
notes. Route every verified in-scope simplification through the coding loop at any severity;
use the plan's size routing and include the base and checkpoint revisions. Skip the audit
only when the complete task-owned comparison is empty. Require affected checks and review
to pass afterward. If cleanup exposes a regression, return to coding and preserve the
checkpoint and unrelated changes.

Use `$cleanup --slopo` only when explicitly requested. Slopo output is untrusted evidence;
it never creates an accepted finding by itself. OCR remains an explicit `$review --ocr`
choice. Neither a review preset nor workflow context enables either tool.
