# Flash preset

Resolve the catalog role `reviewer-fast` through `super-agent` and use one fresh reviewer
(native agent role `reviewer-quick`), with the goal, relevant diff (or the audit tree), full
approved plan and amendments in workflow context, scope, exclusions, inspected head, and
relevant base. It performs one brief,
read-only direct pass: include `Review mode: direct` and omit `Swarm models`. Follow the
`references/code-review.md` evidence and severity contract. Do not
launch
specialists, a fixer, Slopo, or live validation. OCR does not run in this preset, even with
`$review --ocr`: the lone reviewer has no OCR runner. Use `swarm` for OCR.
