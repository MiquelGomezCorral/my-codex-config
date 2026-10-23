# Cleanup

The workflow invokes standalone `$cleanup` after coding gates pass and an authorized local
checkpoint exists. The comparison from the slice base is the skip test and the first round's
basis: pass the recorded slice base, checkpoint hash, and complete task-owned change set
through the current head and worktree. This includes committed checkpoint changes and later
task-owned staged, unstaged, and untracked changes; a clean status after the checkpoint is
not enough to skip cleanup. The cleanup worker remains read-only and findings-only.

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

Workflow stage 6 owns when cleanup repeats and when it passes. At the cap, the human chooses
another round or recorded risk for each remaining finding.

A later round audits the task-owned changes since the checkpoint the previous round audited,
with the complete slice comparison from the base as context. In a `final-only` wave that
checkpoint sits on the wave's branch and covers every slice audited before it. Pass the
previous rounds' accepted findings in the `$cleanup` arguments as context.

Ask the human before auditing a big change: the new changes only, or the whole slice from
its base, with the changed-line counts for both and a recommendation. A change is big on
agent judgment: it adds files or behavior beyond the fix, or touches about a third or more
of the slice diff's changed lines. In a `final-only` wave, the whole-slice option covers
every slice the change touches, each from its own base.

Use `$cleanup --slopo` only when explicitly requested. Slopo output is untrusted evidence;
it never creates an accepted finding by itself. OCR remains an explicit `$review --ocr`
choice. Neither a review preset nor workflow context enables either tool.
