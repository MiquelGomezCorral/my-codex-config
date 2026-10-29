# Cleanup

The workflow's stage owner (workflow stage 4) invokes `$cleanup` after coding
gates pass and an authorized local checkpoint exists. The comparison from the slice base
is the first round's basis: pass the recorded slice base, checkpoint hash, and complete
task-owned change set through the current head and worktree. This includes committed
checkpoint changes and later task-owned staged, unstaged, and untracked changes; a clean
status after the checkpoint is not enough to skip cleanup. The cleanup worker remains
read-only and findings-only.

The stage owner verifies each finding against the approved scope, current source, and
tests, and records one outcome per finding in progress notes (a supervisor's notes go in its
packet, workflow stage 6): accepted, or rejected with a concrete reason. A valid reason
shows the finding is false, a duplicate, out of scope,
unverifiable against source, or would break acceptance behavior, a public contract, or a
protection the cleanup contract preserves. "Looks fine", "low value", or effort is not a
reason. Route every accepted simplification through the coding loop at any severity; use
the plan's size routing and include the base and checkpoint revisions. Skip the audit only when the complete
task-owned comparison is empty. Require affected checks and review to pass afterward. If
cleanup exposes a regression, return to coding and preserve the checkpoint and unrelated
changes.

Workflow stage 6 owns when cleanup repeats and when it passes. At the cap, the human chooses
another round or recorded risk for each remaining finding.

A later round audits the task-owned changes since the checkpoint the previous round audited,
with the complete slice comparison from the base as context. In a `final-only` wave that
checkpoint sits on the wave's branch and covers every slice audited before it. Pass the
previous rounds' accepted findings in the `$cleanup` arguments as context.

Size each audit with the coding loop's [Size the review](coding-loop.md#size-the-review)
guide, which also picks `Audit depth: light`, and add its progress note. When its Scope
bullet calls for the whole slice, audit from the slice base instead of the new changes; in
a `final-only` wave that covers every slice the change touches, each from its own base.

Use `$cleanup --slopo` only when explicitly requested. Slopo output is untrusted evidence;
it never creates an accepted finding by itself. OCR remains an explicit `$review --ocr`
choice. Neither a review preset nor workflow context enables either tool.
