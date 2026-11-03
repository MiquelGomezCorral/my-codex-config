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
- It assesses task-owned production and test changes against the `code-quality` standard
  and its language references for the touched files. Ponytail's rules are part of that
  standard ([Ponytail core](ponytail.md)).
- The repository's own required checks always gate code work. The `code-quality` language
  checks add to them when the project configures them. The editing agent runs both, fixes
  the code, and reruns; the same rule failing on the same code after three attempts goes to
  the user, who alone approves a narrow inline skip. Cleanup runs the non-mutating form of
  the same checks and reports failures as findings.
- One cleanup coordinator always runs a read-only swarm through `super-agent`: at least two `swarms` lens specialists (dead and speculative code, duplication and reinvention, indirection and structure, test value) and one or two `reviewer-high` simplest-design reviewers, at most six descendants, none of which delegate. In a workflow, a change the coding loop's sizing guide puts at `flash` gets a light audit: the swarm is one `reviewer-high` simplest-design reviewer.
- A production element with no demonstrated need is a finding. In workflow context every finding is accepted or rejected with a concrete reason, and the next cleanup round confirms that accepted simplifications were fully applied; cleanup repeats until a round has no accepted findings, or until the human accepts what remains as recorded risk after three rounds.
- Slopo runs only through `$cleanup --slopo`; OCR runs only through `$review --ocr`.
- When `$cleanup --slopo` finds no `slopo.conf.yaml`, it may create Slopo's template once,
  report that mutation, and stop Slopo analysis if required configuration remains incomplete.
- OCR calls OpenCode Go directly through the review skill's helper. The helper accepts an
  explicit `OPENCODE_API_KEY` or reads Pi's existing `opencode-go` credential without
  routing the review through the Pi harness, and it creates the required per-run session.
- External output is evidence requiring source verification, never an automatic finding or fix.
- External failures degrade visibly while native cleanup or review continues.
- External installation, authentication, tracked runtime state, and automatic fixes remain outside these workflows.
- UI work includes the live inspection pass in `code-quality`'s `ui.md` ("Inspect the running app"): the
  builder opens the running app and measures its own render before saying done, and the lead checks each
  delivered screen. In Claude, a hook reminds the agent once, by blocking its stop, when it changed UI
  files and has not opened the app since. The hook checks only that the app was opened, not what the
  agent saw.

## Protected invariants

- Cleanup never edits source or existing files and never produces an automatically
  executable correction brief; explicit Slopo mode may only create a missing
  `slopo.conf.yaml` template.
- Unrelated and ambiguously owned changes remain outside cleanup findings.
- Added tests must show their value. A test whose value is uncertain is recommended for deletion; tests that independently guard a reproduced regression, security, or a critical contract are kept.
- Slopo candidates must intersect task-owned changed hunks and be semantically confirmed.
- OCR cannot replace the native review verdict or inspect unrelated workspace changes.
- OCR provider credentials, sessions, and runtime state are never stored in this repository.
- Before/after repository status must expose unexpected mutation.
- `ui.md` is the one owner of UI rules; other files point at it. The UI reminder never blocks the same
  stop twice.
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
- UI inspection: [UI reference](../../../config/skills/code-quality/references/ui.md) and the Claude
  [UI reminder hook](../../../config/bin/ui-open-reminder.py). Review-only: whether the agent checked the
  app well is measured by live builder runs, not by the hook.

## History

- 2026-11-03: Added the UI inspection pass and the Claude UI reminder, because a review of 187 of the
  user's UI critiques showed agents calling UI done without opening the running app.
- 2026-10-26: Workflow cleanup of a small or mechanical change runs a one-agent swarm.
- 2026-10-23: Replaced the closure check with repeated cleanup rounds until clean, and cleanup now reruns after every later code change.
- 2026-10-19: Ponytail's rules moved into the `code-quality` and review standards, so cleanup no longer names
  Ponytail as a separate criterion ([Ponytail core](ponytail.md)).
- 2026-10-14: Cleanup judges tests through `test-audit`, and an uncertain test is now recommended for deletion instead of kept, because coders kept landing low-value unit tests.
- 2026-10-07: Replaced the optional two-helper cleanup audit with an always-on swarm plus simplest-design reviewers, a no-demonstrated-need finding rule, recorded accept/reject outcomes, and a closure check, because single-agent cleanup left overengineering in place.
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
