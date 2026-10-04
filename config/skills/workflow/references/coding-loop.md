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
2. Run only the planned checks and inspect the actual flow when explicitly authorized.
   A passing unit suite alone does not prove a user-facing flow.
3. The root for `small`, or the coding supervisor for `large`, invokes `$review --preset
   <approved preset>` on the resulting head. Give the reviewer the complete approved plan
   and amendments, current slice, goal, exclusions, head/base diff, changed paths, checks,
   and observed results. The reviewer reads the full plan; a summary alone is insufficient.
   Every finding needs severity, scope classification, and source evidence. Mark unavailable
   checks blocked/unverified. Review is required; only the preset depth varies.
4. Use `review-findings` to verify reports against the source. Do not pass false positives,
   unclear ownership, or out-of-scope observations as correction instructions.
5. Route every verified in-scope P0-P3 finding to the coder, including non-blocking
   findings; use severity to order corrections. Route verified cleanup simplifications the
   same way. Track two unsuccessful correction rounds per unresolved problem, then
   escalate it.
6. Re-run affected checks and reviews after a correction. Stop only when required behavior
   and evidence pass or a concrete blocker is reported.

The supervisor reports the inspected head, base, checks, corrected findings, remaining
gaps, and the next workflow gate. The root coordinates and does not edit product code.
