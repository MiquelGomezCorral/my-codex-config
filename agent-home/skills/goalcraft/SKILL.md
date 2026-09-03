---
name: goalcraft
description: Turn a rough ambition or draft Codex `$goal` into a compact, evidence-driven completion contract. Use to write, sharpen, stress-test, or explicitly activate a durable goal.
---

# Goalcraft

Use a goal for long-running work with an evidence-based finish line, not one edits,
simple answers, or short reviews. Draft by default; activate only when explicitly asked.

For repository goals, load `agents-memory` and read only relevant project memory.

## Build The Contract

Preserve the user's intent and inspect named files, issues, or repositories. Define:

- `Outcome`: observable state required for completion.
- `Context`: starting artifacts and facts to inspect or preserve.
- `Boundaries`: in-scope and excluded files, systems, data, and actions.
- `Constraints`: behavior, contracts, security, conventions, and no-regression rules.
- `Verify`: exact known tests, evidence, artifacts, or user confirmation.
- `Stop conditions`: done, blocked, approval, and continue-iterating rules.

Add deliverables, realistic environment, progress surface, or checkpoint rhythm only
when they materially improve control. For measurable goals, define baseline, target,
measurement, and an anti-gaming guardrail. Prefer a fast iteration check plus a slower
final gate.

Keep requirements auditable and avoid prescribing implementation unless it is itself
a requirement. Put rationale and long scorecards outside the goal. Target 3,400
characters below the 4,000-character hard limit. Keep token budgets and slash-command
flags outside the objective text.

## Output

```text
Assumptions:
- ...

Ready-to-paste goal:
$goal Outcome: ...
Context: ...
Boundaries: ...
Constraints: ...
Verify: ...
Stop conditions: ...

Objective length: N characters
```

Resolve scripts relative to this skill, then validate with
`python3 scripts/validate_goal.py --strict-target --target-chars 3400 <goal-file>`.
A goal is not done through intent, elapsed time, budget exhaustion, or unrelated green
checks.
