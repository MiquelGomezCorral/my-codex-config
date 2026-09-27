# Post-implementation quality gates

## Intent

Post-implementation quality gates expose unnecessary production and test complexity without silently changing approved behavior or source.

## Current decisions

- `$cleanup` is explicit, read-only, and findings-only.
- It assesses task-owned production and test changes against repository code-quality and Ponytail principles.
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

## Rationale and tradeoffs

Separating diagnosis from correction lets the user choose which simplifications preserve intent. Opt-in external tools add independent evidence without making credentials, availability, privacy, or tool state mandatory for normal work.

## Enforcement

- Cleanup instructions: [cleanup skill](../../../agent-home/skills/cleanup/SKILL.md) and [cleanup worker](../../../codex/agents/cleanup-worker.toml).
- Review instructions: [review skill](../../../agent-home/skills/review/SKILL.md),
  [OpenCode Go helper](../../../agent-home/skills/review/scripts/ocr-opencode-go), and
  [review worker](../../../codex/agents/review-worker.toml).
- Static enforcement: [configuration tests](../../../tests/codex-config.test.mjs) and [bootstrap tests](../../../tests/bootstrap.test.sh).
- Review-only: provider availability and source transmission remain live-validation concerns.

## History

- 2026-09-21: Adopted read-only cleanup findings, production-and-test deslop analysis, bounded exploratory delegation, and opt-in OCR/Slopo evidence.
- 2026-09-21: Connected opt-in OCR directly to OpenCode Go through a secret-free helper
  that can reuse Pi's credential store without using Pi as the review harness.
- 2026-09-21: Allowed explicit Slopo cleanup to initialize and report a missing project
  configuration template without editing it or other project files.
