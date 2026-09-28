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
4. Read applicable decision records and compare the reviewed behavior with their protected
   invariants, including any invariant removed or weakened by the same change.
5. Trace realistic inputs through changed branches and boundaries. Verify that the
   change solves the stated problem, not merely that it compiles.
6. Check, in this order:
   - Correctness, state transitions, edge cases, and error paths.
   - Security, trust boundaries, data loss, and unsafe partial completion.
   - Public contracts, callers, migrations, integration points, and fixtures.
   - Coupling, ownership, avoidable complexity, naming, stale documentation, and
     obvious performance regressions.
   - Tests: relevant behavior, boundary coverage, and whether important checks can fail.
7. Run only repository-defined verification justified by the change.
8. Use specialist reviewers only for distinct risk surfaces; verify and deduplicate
   their claims before reporting.

## Findings

Order findings by severity and cite `path:line`. Every finding needs concrete source
evidence, a scope classification (`in-scope`, `out-of-scope`, or `unclear`), the actual
failure or cost, and the smallest useful correction.

- **P0:** critical failure, security breach, data loss, or unusable behavior.
- **P1:** serious regression or unmet acceptance requirement.
- **P2:** non-blocking improvement.
- **P3:** optional observation.
- **Blocked/unverified:** required evidence is unavailable. This is a verification state,
  not a severity or demonstrated defect.

Do not add praise, summaries, or nits to fill space. If there are no findings, say so
and name any residual verification gap.

## Output

1. Findings by P0-P3, each with `path:line`, scope, evidence, and correction direction.
2. Verdict: `Approve`, `Approve with non-blocking comments`, `Request changes`, or
   `Blocked`.
3. Problem-solution check when a goal exists.
4. Inspected head, relevant base, verification commands, and observed results.
5. Blocked/unverified evidence and open questions.

Review-only requests never authorize edits, commits, pushes, or published comments.
