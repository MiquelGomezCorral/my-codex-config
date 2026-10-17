## Convention Audit

Inspect only changed files. Check type inference, legacy paths, unnecessary
abstractions, framework-specific conventions, naming, documentation drift, and dead
code. Load a reference only when the diff touches its domain:

- [Type inference](type-inference-checks.md)
- [Legacy cleanup](legacy-checks.md)
- [Effect](effect-checks.md)

Report findings first by the P0-P3 severity and scope classification in
`references/code-review.md`,
then the verdict, inspected head/base, open evidence gaps, and performed verification.
Label convention findings by category. Do not edit in review-only mode; workflow correction
stays in `$workflow` and requires verified in-scope evidence.
