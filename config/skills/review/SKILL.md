---
name: review
description: Own review — the shared review standard (workflow, findings, P0-P3 severity, output contract) and `$review` orchestration for ordinary, staff-level, and swarm review gates. Use for any code review, including "is this over-engineered", and for whole-repo audits ("audit this codebase", "review the whole repo", "find bloat", "what can I delete"); the standard is in references/code-review.md.
---

# Review Gate

This skill owns the shared review standard and `$review` orchestration.
Native findings-only routes are defined in
[`workflow/references/native-capabilities.md`](../workflow/references/native-capabilities.md):
Claude uses Skill(`code-review`), Codex uses a native target review plus explicit scope
assessment, and Pi/AGY use a scoped read-only native agent where no bundled engine exists.
Keep this skill's standard limited to project constraints, finding shape, and assessment;
do not reproduce vendor review internals.

## Read the standard first

Any review, including one a specialist performs, reads
[references/code-review.md](references/code-review.md) before reviewing. Findings, P0-P3
severity, scope classification, and the output contract come from there and are not
restated here. Standalone `$review` inspects the staged diff first and uses the unstaged
diff when nothing is staged. Approved workflow review uses the complete slice basis in
[references/orchestration.md](references/orchestration.md), not staged-first selection.

## Review modes

The modes are the worker-packet markers `Review mode: direct` and `Review mode: swarm`,
which [references/orchestration.md](references/orchestration.md) sets. A preset (`flash`,
`swarm`, `swarm-smart`, `full`) selects a mode and more; `full` names only the preset.

Audit mode: `$review audit [path]`, or a request such as "audit this codebase", reviews a
tree (the named path, or the whole repo), not a diff. The workflow and output are the
"Whole-repo audit" section of [references/code-review.md](references/code-review.md).

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

Core rules adapted from Ponytail v5.3.2 (MIT, see `LICENSE-ponytail`); sync notes are in
`docs/decisions/agent-tooling/ponytail.md`.
