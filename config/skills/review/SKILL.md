---
name: review
description: Own review — the shared review standard (workflow, findings, P0-P3 severity, output contract) and `$review` orchestration for ordinary, staff-level, and swarm review gates. Use for any code review; the standard is in references/code-review.md.
---

# Review Gate

This skill owns the shared review standard and `$review` orchestration.

## Read the standard first

Any review, including one a specialist performs, reads
[references/code-review.md](references/code-review.md) before reviewing. Findings, P0-P3
severity, scope classification, and the output contract come from there and are not
restated here. Standalone `$review` inspects the staged diff first and uses the unstaged
diff when nothing is staged. Approved workflow review uses the complete slice basis in
[references/orchestration.md](references/orchestration.md), not staged-first selection.

## Review modes

- `full`: correctness review plus convention audit.
- `quick`: convention audit only.
- `deep`: correctness review only, with all justified specialist coverage.

## Route

| Need | Reference |
| --- | --- |
| Review standard: workflow, findings, severity, output contract | [references/code-review.md](references/code-review.md) |
| `$review` invocation, presets, worker packets, and routing | [references/orchestration.md](references/orchestration.md) |
| OCR evidence when `--ocr` is requested | [references/ocr-evidence.md](references/ocr-evidence.md) |
| Convention audit | [references/convention-audit.md](references/convention-audit.md) |
| Swarm coordination when swarm mode is selected | [references/swarm-coordination.md](references/swarm-coordination.md) |

A specialist reviewer performs the review and must not launch or orchestrate further
reviewers; only the coordinator routes.
