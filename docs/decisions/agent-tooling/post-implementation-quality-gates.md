# Post-implementation quality gates

## Intent

Post-implementation quality gates expose unnecessary production and test complexity without silently changing approved behavior or source.

## Current decisions

- `$cleanup` is explicit, read-only, and findings-only.
- Code review may use a supported native findings-only route through the workflow's
  capability reference. Shared review instructions own project constraints, severity,
  findings format, and assessment; vendor review internals remain vendor-owned. Posting,
  fixes, paid/cloud reviews, and broader targets require their own explicit authority.
- An explicitly approved complete workflow may invoke that findings-only audit and route
  verified in-scope simplifications to the implementation worker; the auditor never edits
  or automatically accepts findings. Standalone cleanup retains its stopping behavior.
- It assesses task-owned production and test changes against the `code-quality` standard,
  its language references for the touched files, and Ponytail principles.
- The repository's own required checks always gate code work. The `code-quality` language
  checks add to them when the project configures them. The editing agent runs both, fixes
  the code, and reruns; the same rule failing on the same code after three attempts goes to
  the user, who alone approves a narrow inline skip. Cleanup runs the non-mutating form of
  the same checks and reports failures as findings.
- One cleanup coordinator may delegate at most two justified, bounded read-only investigations through `super-agent`.
- Slopo runs only through `$cleanup --slopo`; OCR runs only through `$review --ocr`.
- When `$cleanup --slopo` finds no `slopo.conf.yaml`, it may create Slopo's template once,
  report that mutation, and stop Slopo analysis if required configuration remains incomplete.
- OCR calls OpenCode Go directly through the review skill's helper. The helper accepts an
  explicit `OPENCODE_API_KEY` or reads Pi's existing `opencode-go` credential without
  routing the review through the Pi harness, and it creates the required per-run session.
- External output is evidence requiring source verification, never an automatic finding or fix.
- External failures degrade visibly while native cleanup or review continues.
- External installation, authentication, tracked runtime state, and automatic fixes remain outside these workflows.

## Protected invariants

- Cleanup never edits source or existing files and never produces an automatically
  executable correction brief; explicit Slopo mode may only create a missing
  `slopo.conf.yaml` template.
- Unrelated and ambiguously owned changes remain outside cleanup findings.
- Added tests are not preserved merely for coverage; deletion is recommended only when meaningful regression protection remains.
- Slopo candidates must intersect task-owned changed hunks and be semantically confirmed.
- OCR cannot replace the native review verdict or inspect unrelated workspace changes.
- OCR provider credentials, sessions, and runtime state are never stored in this repository.
- Before/after repository status must expose unexpected mutation.
- Workflow corrections preserve approved behavior and scope, including meaningful tests;
  non-blocking simplifications are eligible only after their evidence is verified.

## Rationale and tradeoffs

Separating diagnosis from correction lets the user choose which simplifications preserve intent. Opt-in external tools add independent evidence without making credentials, availability, privacy, or tool state mandatory for normal work.

## Enforcement

- Check procedure: [code-quality skill](../../../config/skills/code-quality/SKILL.md), with
  Python commands in its [Python reference](../../../config/skills/code-quality/references/python.md).
- Cleanup instructions: [cleanup skill](../../../config/skills/cleanup/SKILL.md) and [cleanup worker](../../../config/agents/cleanup-worker.toml).
- Review instructions: [review skill](../../../config/skills/review/SKILL.md),
  [OpenCode Go helper](../../../config/skills/review/scripts/ocr-opencode-go), and
  [review worker](../../../config/agents/review-worker.toml).
- Static enforcement: [configuration tests](../../../tests/codex-config.test.mjs) and [bootstrap tests](../../../tests/bootstrap.test.sh).
- Review-only: provider availability and source transmission remain live-validation concerns.

## History

- 2026-10-05: Made repository checks plus configured `code-quality` language checks a gate
  for code work: fix-and-rerun in the editing agent, read-only findings in cleanup, and
  user-approved skips after three identical failures.
- 2026-10-04: Approved native findings-only code-review forwarding while preserving
  project review contracts, explicit side-effect bounds, and separate cleanup authority.
- 2026-09-28: Made the `code-quality` standard mandatory for code work and split the review
  standard out of `review` into `references/code-review.md`, with `review` reduced to a
  router over its references; the Python reference moved into `code-quality/references/`
  unchanged.
- 2026-09-27: Approved complete-workflow orchestration of read-only quality gates and
  verified in-scope corrections, preserving standalone findings-only behavior.
- 2026-09-21: Adopted read-only cleanup findings, production-and-test deslop analysis, bounded exploratory delegation, and opt-in OCR/Slopo evidence.
- 2026-09-21: Connected opt-in OCR directly to OpenCode Go through a secret-free helper
  that can reuse Pi's credential store without using Pi as the review harness.
- 2026-09-21: Allowed explicit Slopo cleanup to initialize and report a missing project
  configuration template without editing it or other project files.
