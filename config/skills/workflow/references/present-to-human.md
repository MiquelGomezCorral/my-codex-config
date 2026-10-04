# Present to human

Show the actual result for the approved slice, not only an agent summary. Include the
relevant user flow and sample, expected and observed behavior, changed paths, checks and
their results, review findings, artifacts, and blocked/unverified evidence. Keep claims
bounded by what was observed.

Ask the human to accept the result or give corrections. Route corrections that change code
through the coding loop and affected review. Acceptance is the result gate for Git actions
already named and bounded by the approved plan; any additional action must be separately
named and bounded through the `git` skill.
