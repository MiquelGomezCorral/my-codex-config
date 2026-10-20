# Full preset

Run `swarm-smart`, then a live round in which testers run the slice's
approved live test set. Testers resolve the catalog role `reviewer-fast`; the native agent
role is `live-validator`.

Before launch, verify that the persisted plan or a later human approval gives each test
the `refine-plan` fields: `Flow`, `Samples`, `Where`, `Can run`, `Expected`, `Reset`, and
`Bounds`. In an approved wave, the approved live test set is that bounded authorization.
Workflow context or this preset alone grants no permission. A plan that records a
live-test opt-out skips the live round.

The `$review` parent (the root for a `small` slice, the coding supervisor for a `medium`
or `large` one) owns the app for the live round. Run the round this way:

- The parent starts the app once with one straightforward attempt, smokes it, and gives
  every tester that running instance. If it does not start, report the round's tests as
  `not possible: <reason>`.
- Run independent tests in parallel and tests that share state one at a time. The parent
  resets the shared data between sequential tests and between repeats.
- Report each result as pass, fail, unclear, or not possible, with evidence: the command
  and its output, a screenshot, or a log. A result without evidence counts as not run.
- Live results join the review verdict.
- After the round, the parent stops the app and resets the shared test data.

If a field, the authorization, or an available safe environment is missing, stop live
testing, report the required evidence as blocked/unverified, and still return the code
review. Never deploy, install, authenticate, widen the test, or infer success from static
checks. OCR and Slopo remain separate explicit opt-ins.
