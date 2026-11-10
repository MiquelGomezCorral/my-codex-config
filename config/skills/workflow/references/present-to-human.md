# Present to human

Show the actual result for the approved slice, not only an agent summary. Include the
relevant user flow and sample, expected and observed behavior, changed paths, checks and
their results, review findings, artifacts, and blocked/unverified evidence. Keep claims
bounded by what was observed.

Show it on the result page (gate 3): fill `artifacts` `templates/report.json`, including its
Live evidence section, captured with `capture.mjs`.

The result page opens with the slice's requirements table: one row per `Covers` ID, with the
columns in this order: ID, requirement, met / missing / changed, and proof on the current head
(a live-evidence path or a command result). Retired IDs get no row and no check. "Changed" is only
for a requirement the human changed during the wave. A `changed` row needs proof of the new text,
or it counts as missing. Missing rows follow the routing in the [workflow skill](../SKILL.md).

Ask the human to accept the result or give corrections. Route corrections that change code
through workflow stages 5 and 6, then present again. Acceptance is the result gate for Git
actions already named and bounded by the approved plan; any additional action must be
separately named and bounded through the `git` skill.

## Final gate in a `final-only` wave

Slices skip their own presentation. After the last slice and the passing wave regression,
present one result page with a section, and its own live evidence, per slice. Its
requirements table lists every ID once, across all slices. For each
feedback item, ask the human whether to fold the fix into the owning slice's commit(s) or
add a new commit on top. Each fix takes workflow stages 5 and 6, and a fold waits until
stage 6 ends; it follows the `git` skill's
[fold steps](../../git/references/commit.md#fold-a-fix-into-an-earlier-slice-commit). Then
rerun the affected live tests and the wave regression, and present the revised page.
