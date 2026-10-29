# Coding loop

Use the approved plan and current slice context. The plan owns implementation decisions;
attach later approved amendments instead of silently changing its goal.
The retained writer uses the harness's normal native coding capability; see
[native capabilities](native-capabilities.md) for the stage route.

1. Read the complete approved plan and amendments, then refine the slice against the
   current repository. Confirm the goal, observed current behavior and sources, scope,
   exclusions, checks, samples, usable tools, acceptance evidence, and review preset.
   Stop before coding if required grounding or the planned validation route is missing.
   Read the slice's `Size:` in the approved plan.
   For `small`, the root directs one retained `coder` through `super-agent`. For `large`
   or `medium`, assign a read-only `coding-supervisor` that owns this loop, the base live
   run, and workflow stage 6 for the slice. Workflow stage 5 sets its grant and the Orca
   fallback, within the slice's scope, exclusions, and checks. The supervisor never edits
   product source or commits, and delegates no other implementation work. Below, "the stage
   owner" is as workflow stage 4 defines it.
2. Run only the planned checks. A passing unit suite alone does not prove a user-facing
   flow.
3. Set the round: what to review, at what size, and which live tests to run; size it with
   [Size the review](#size-the-review) and add its progress note. The first round runs the
   slice's full live test set; a fix round reruns only tests that failed or were not
   possible. A recorded opt-out skips the live tests, never the review.
4. Run the review and the live tests. The stage owner invokes
   `$review --preset <the round's preset>` on the resulting head with the round's scope.
   The [`full` preset](../../review/references/presets/full.md) runs
   the live round; with `flash` or `swarm`, `$review` runs only the code review and the same
   agent still runs the `full` preset's live round, with its testers, as usual. Give the
   reviewer the complete approved plan and amendments, current slice, goal, exclusions,
   head/base diff, any `Review focus`, changed paths, checks, live test set, and observed
   results. The reviewer reads the full plan; a summary alone is insufficient. Every finding
   needs severity, scope classification, and source evidence. Mark unavailable checks
   blocked/unverified. Review is required; only the preset depth varies. When the live
   round reports `not possible`, the review still runs and the next round fixes the
   blocker.
5. Gather insights: use `review-findings` to verify reports against the source, and treat
   each failed or not-possible live test as a finding with its evidence. Do not pass false positives,
   unclear ownership, or out-of-scope observations as correction instructions.
6. Plan fixes: route every verified in-scope P0-P3 finding to the coder, including
   non-blocking findings; use severity to order corrections. Route verified cleanup
   simplifications the same way. Then repeat from step 3 with the affected checks and
   reviews. Track two unsuccessful correction rounds per unresolved problem, then escalate
   it. A not-possible live test counts toward its own 3-round limit, not the two-round
   correction limit: ask the human when a test is still not possible after 3 rounds, or
   when only unclear results remain.
7. When required behavior and evidence pass, a last round reruns the full slice live test
   set on the final head, including after cleanup corrections. Stop only when the required
   evidence passes or a concrete blocker is reported.

A supervisor ends the slice with the evidence packet that workflow stage 6 lists, in place
of a short report. The root coordinates and does not edit product code.

## Size the review

This guide asks for judgment, not rules. It sizes each round up or down from the approved
preset (`full` by default); a preset the human named for the slice (marked `(named)` in the
plan) stays fixed under every rule below. Before each round, snapshot what it will review
(below), then add one progress note: scope, preset, tree hash, changed lines, and why.

- **Scope.** The first round reviews the whole slice. A fix round reviews what changed
  since the last review and the code that change reaches, with the whole slice as
  context. Review the whole slice again when the new change is big, reaches far, or
  breaks an assumption earlier work relied on.
- **Lines.** Count added plus removed lines in the task-owned paths, new files included,
  across everything the round covers: the changes since the last review, for cleanup the
  changes since the last audit, or the whole slice for a whole-slice round. About 1-25
  lines suggests `flash`, about 25-50 `swarm`, and more `full`. A review round with no
  counted lines (no change, or only binary files) runs `flash` over the whole slice, whatever
  the slice's size, or more when its reach calls for it.
- **Reach.** Go lighter for mechanical lines: imports, renames, moved code, generated files,
  or wiring that changes a few lines in each of several functions. Go to `full` when a few
  lines change something many parts depend on, such as a shared helper, a contract, state,
  security, or concurrency, and review that dependent code even where the diff does not
  touch it. When unsure, go one size up.
- **Always.** Live tests run at every size, unless the plan recorded an opt-out. Cleanup
  sizes its audit the same way ([cleanup](cleanup.md)): pass `Audit depth: light` when this
  guide gives the audit `flash`, and run the full audit otherwise.

Mark what each review saw: snapshot the task-owned files as a Git tree (a temporary
`GIT_INDEX_FILE` read from `HEAD`, `git add -A --` the task-owned paths that exist in `HEAD`
or on disk, then `git write-tree`) and note its hash. It makes no commit and changes no
branch, index, or worktree file. Count lines with `git diff --numstat <from> <tree> -- <paths>`,
where `<from>` is the slice base, the previous review's tree, or the last audited
checkpoint. A fix round that reviews only the changes since the last review passes
`Review focus: <previous tree>..<new tree>`; a whole-slice round passes none.
