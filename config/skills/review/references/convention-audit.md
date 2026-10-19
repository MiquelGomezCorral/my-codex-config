## Convention Audit

Inspect only changed files. Check type inference, legacy paths, unnecessary
abstractions, framework-specific conventions, naming, documentation drift, and dead
code. Load a reference only when the diff touches its domain:

- [Type inference](type-inference-checks.md)
- [Legacy cleanup](legacy-checks.md)
- [Effect](effect-checks.md)

Report in the output contract of `references/code-review.md` (P0-P3 severity, scope,
verdict, inspected head/base, open evidence gaps, and performed verification).
Label convention findings by category. Do not edit in review-only mode; workflow correction
stays in `$workflow` and requires verified in-scope evidence.
