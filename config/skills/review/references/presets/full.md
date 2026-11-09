# Full preset

Run the [`swarm` preset](swarm.md), then route its report and the same head, base, any
`Review focus`, goal, complete approved plan and amendments in workflow context, scope, and
exclusions to one fresh configured review coordinator for independent verification and
synthesis. Mark the verifier `Review mode: direct` and route it through `super-agent`,
which resolves the catalog role entry and any approved explicit route, then pin the resolved
harness, model, and thinking. The verifier loads `review-findings`, checks every retained
claim against source evidence, classifies scope, and returns only verified findings with the
`references/code-review.md` output contract.

The verifier is read-only and does not delegate. Never launch it while authoring or
testing this skill. If `--ocr` was explicit, the primary review has already run it; pass
the verifier `OCR mode: disabled` so it verifies reported OCR claims without rerunning the
helper.

Then run a live round in which testers run the slice's approved live test set. Testers
resolve the catalog role `computer-controller`; the native agent role is
`computer-controller`, and each tester's packet says the job is a live test.

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
- At UI impact noticeable or big (sized by the
  [coding loop](../../../workflow/references/coding-loop.md#size-the-review)), the parent also
  launches `ui-checker` through `super-agent` on the running app, within the live tests' `Where`
  and `Bounds`, with the changed and affected screens and the slice base build when one can be
  built. Each line of its block joins the live results as a failed test, its numbers as the
  evidence. When the checker is clean or its fix budget ends, the parent launches the skeptical
  reviewer once and, at big, a `computer-controller` flow walk, as the coding loop says.
- Live results join the review verdict.
- After the round, the parent stops the app and resets the shared test data.

If a field, the authorization, or an available safe environment is missing, stop live
testing, report the required evidence as blocked/unverified, and still return the code
review. Never deploy, install (except `computer-controller`'s pinned Playwright CLI install),
authenticate, widen the test, or infer success from static checks. OCR and Slopo remain separate
explicit opt-ins.
