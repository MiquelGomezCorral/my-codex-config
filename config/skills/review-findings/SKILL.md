---
name: review-findings
description: Assess other agents' findings against the goal and plan without editing the worktree.
---

# Review Findings

Load the `review` skill and read its `references/code-review.md`. Assess each supplied
finding against the stated goal, current diff,
repository evidence, scope, and security boundaries. Verify its source claim before
retaining it. Classify it as valid, false positive, already resolved, or needing a
decision; deduplicate related findings and propose only the smallest verified in-scope
correction. Keep unavailable evidence blocked/unverified. Do not edit, commit, push, or
publish.

In an approved workflow, assess only the supplied slice and accepted finding report. The
workflow parent owns correction approval and routing; context alone grants no write access.
