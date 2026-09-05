---
name: cleanup
description: Run the explicit `$cleanup` behavior-preserving simplification gate with one fresh worker; prefer the configured Codex Sol worker when Codex is selected.
---

# Cleanup Gate

Run this workflow only for an explicit `$cleanup` invocation. Never trigger it from
`$code`, `$review`, or ordinary implementation. Load `subagent-routing` before
launching the worker. The parent owns orchestration and inspection, not cleanup edits.

## Establish scope

1. Use the exact persisted plan path established by `$code` when one exists. Otherwise,
   require enough explicit goal context in `$ARGUMENTS` to identify the approved behavior
   that must remain unchanged. Stop rather than infer a missing goal.
2. Inspect `git status`, staged and unstaged diffs, and untracked files. Identify the
   task-owned change from the plan, goal, and accepted corrections while preserving all
   pre-existing and unrelated worktree changes. Stop if ownership cannot be distinguished
   safely. If no relevant diff exists, report that cleanup was skipped and do not launch.
3. Record baseline additions and deletions for the complete task-owned diff. Treat these
   statistics as evidence only, never as a reduction target.
4. Identify the single existing minimum non-live readiness check established by the plan
   or explicitly supplied context. Do not invent extra checks.

## Launch

Launch exactly one fresh worker through `subagent-routing`:

- `agent`: the selected harness's configured behavior-preserving simplifier; in Codex use
  `cleanup-worker`
- `model`: prefer `gpt-5.6-sol` for the Codex route
- `prompt`: the exact plan path or explicit goal, accepted corrections, task-owned files
  and exclusions, baseline diff statistics, and the existing minimum readiness check

Every invocation gets a fresh worker. Pass user-selected harness, agent, model, and
exclusion intent to routing; otherwise prefer the active harness. If the selected route
exhausts quota, use the routing policy's visible substitution. If all suitable routes fail,
stop without a manual edit; inspect and report any unexpected partial change.

## Return

After the worker returns, inspect status plus the complete staged, unstaged, and untracked
task-owned diff again. Compare before-and-after statistics, summarize only meaningful
simplifications, and report the worker's observed readiness result and any blocker or
unchecked requirement. If the worker made no edit, say so without inventing work.

If cleanup edited code, state explicitly that the previous review is stale and `$review`
must run again. Do not invoke reviewers, coders, live validation, or another worker. Never
commit, push, publish, or mutate GitHub from this workflow.
