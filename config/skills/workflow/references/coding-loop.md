# Coding loop

Use the approved plan and current slice context. The plan owns implementation decisions;
attach later approved amendments instead of silently changing its goal.
The retained writer uses the harness's normal native coding capability; see
[native capabilities](native-capabilities.md) for the stage route.

1. Read the complete approved plan and amendments, then refine the slice against the
   current repository. Confirm the goal, observed current behavior and sources, scope,
   exclusions, checks, samples, usable tools, acceptance evidence, and review preset.
   Stop before coding if required grounding or the planned validation route is missing.
   Read the approved plan's size.
   For `small`, the root directs one retained `coder` through `super-agent`. For `large`,
   assign a read-only `coding-supervisor` with an explicit grant to direct exactly one
   retained coder and coordinate the selected read-only review within the slice's scope,
   exclusions, and checks. The supervisor never edits product source or delegates other
   implementation work.
2. Run only the planned checks. A passing unit suite alone does not prove a user-facing
   flow.
3. Set the round: what to review and which live tests to run. The first round runs the
   slice's full live test set; a fix round reruns only tests that failed or were not
   possible. A recorded opt-out skips the live tests, never the review.
4. Run the review and the live tests. The root for `small`, or the coding supervisor for
   `large`, invokes `$review --preset <approved preset>` on the resulting head; the
   [`full` preset](../../review/references/presets/full.md) runs the live round. Give the
   reviewer the complete approved plan and amendments, current slice, goal, exclusions,
   head/base diff, changed paths, checks, live test set, and observed results.
   The reviewer reads the full plan; a summary alone is insufficient. Every finding needs
   severity, scope classification, and source evidence. Mark unavailable checks
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

The supervisor reports the inspected head, base, checks, corrected findings, remaining
gaps, and the next workflow gate. The root coordinates and does not edit product code.
