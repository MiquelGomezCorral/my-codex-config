# Present to human

Show the actual result for the approved slice, not only an agent summary. Include the
relevant user flow and sample, expected and observed behavior, changed paths, checks and
their results, review findings, artifacts, and blocked/unverified evidence. Keep claims
bounded by what was observed.

Show it on the result page (gate 3): fill `artifacts` `templates/report.json`, including its
Live evidence section, captured with `capture.mjs`.

Ask the human to accept the result or give corrections. Route corrections that change code
through workflow stages 5 and 6, then present again. Acceptance is the result gate for Git
actions already named and bounded by the approved plan; any additional action must be
separately named and bounded through the `git` skill.

## Final gate in a `final-only` wave

Slices skip their own presentation. After the last slice and the passing wave regression,
present one result page with a section, and its own live evidence, per slice. For each
feedback item, ask the human whether to fold the fix into the owning slice's commit(s) or
add a new commit on top. Folding follows the `git` skill's fixup procedure. Each fix takes
workflow stages 5 and 6; a folded fix folds once stage 6 ends. Then rerun the affected live
tests and the wave regression, and present the revised page.
