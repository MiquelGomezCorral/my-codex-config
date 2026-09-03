---
name: code-review
description: Review code changes for goal fit, correctness, regressions, security, maintainability, and missing tests. Use for PRs, diffs, commits, patches, or readiness checks; do not use for greenfield implementation.
---

# Code Review

Findings are more valuable than commentary. False positives are worse than silence.

## Workflow

1. Identify the stated goal. If none exists, state that limitation and review only
   for regressions.
2. Inspect repository state, the complete relevant diff, and untracked files.
3. Read surrounding code before asserting patterns, contracts, or behavior.
4. Trace realistic inputs through changed branches and boundaries. Verify that the
   change solves the stated problem, not merely that it compiles.
5. Check, in this order:
   - Correctness, state transitions, edge cases, and error paths.
   - Security, trust boundaries, data loss, and unsafe partial completion.
   - Public contracts, callers, migrations, integration points, and fixtures.
   - Coupling, ownership, avoidable complexity, naming, stale documentation, and
     obvious performance regressions.
   - Tests: relevant behavior, boundary coverage, and whether important checks can fail.
6. Run only repository-defined verification justified by the change.
7. Use specialist reviewers only for distinct risk surfaces; verify and deduplicate
   their claims before reporting.

## Findings

Order findings by severity and cite `path:line`. Each finding must state the concrete
failure or risk and the smallest useful correction.

- `blocker`: unsafe to merge; data loss, security breach, or unusable behavior.
- `issue`: real bug, regression, or unmet requirement.
- `suggestion`: non-blocking maintainability or test weakness.
- `nit`: rare, clearly optional convention issue.
- `question`: missing fact whose answer can change the verdict.

Do not add praise, summaries, or nits to fill space. If there are no findings, say so
and name any residual verification gap.

## Output

1. Findings.
2. Verdict: `Approve`, `Approve with non-blocking comments`, `Request changes`, or
   `Blocked`.
3. Problem-solution check when a goal exists.
4. Verification commands and observed results.
5. Open questions that could not be verified.

Review-only requests never authorize edits, commits, pushes, or published comments.
