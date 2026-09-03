---
name: review-findings
description: Assess other agents' findings against the goal and plan without editing the worktree.
---

# Review Findings

Load `code-review`. Assess each supplied finding against the stated goal, current diff,
repository evidence, and security boundaries. Classify it as valid, false positive,
already resolved, or needing a decision; deduplicate related findings and propose only
the smallest in-scope correction. Do not edit, commit, push, or publish.
