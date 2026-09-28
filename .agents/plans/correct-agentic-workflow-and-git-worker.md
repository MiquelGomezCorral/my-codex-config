# Correct the agentic workflow and give Git one worker

## Summary

The human-facing super agent can supervise the coder directly for a small change. A large change gets a separate, read-only `coding-supervisor` to manage the longer coder and correction loop. The approved plan records that size decision before work starts.

The Git skill remains the **single source of Git rules**. Rename `commit-worker` to `git-worker`; its role instructions tell it to load the skill and carry out the authorized action, without copying the rules into the role file. The workflow controls *when* to call it.

## Changes

- Route all five Git actions—commit, push, PR, merge, and PR-comment review—to `git-worker`. Update role registration, dispatch, tests, and documentation; remove the current inline exceptions for merge and PR-comment review.
- Treat an accepted plan as authorization for its specifically named Git actions and bounds. A local checkpoint can therefore happen before cleanup. Final human acceptance remains a result gate before shipping, with no second Git authorization request. Repository prohibitions and approvals for destructive recovery still apply; this repository’s migration rules forbid commits, pushes, branches, and worktrees.
- Redefine `$merge` as syncing the base branch **into the feature branch**. Never automatically merge a feature into `main` or `staging`. Keep slices as a linear stack, target each unmerged parent PR, and verify that each PR contains only its own slice; stop if ancestry or a squash merge makes that untrue.
- In the coding loop, dispatch directly to one retained coder for a plan marked small. For a plan marked large, give `coding-supervisor` an explicit, bounded grant to direct that coder. Keep the root and supervisor out of product edits. Correct verified **in-scope** findings regardless of P0–P3 label; use priority to order work.
- Make review routing consistent: the review skill owns preset behavior, and `super-agent` owns model selection from the catalog. Flash uses one direct reviewer; larger presets use their specified coordinator and specialists. Prefer catalog-selected Pi reviewers by default, while keeping live end-to-end validation on Codex. Honor an explicit AGY/Pi roster exactly. Document and validate Pi’s supervised Orca custom-terminal route rather than treating Pi as unavailable.

## Verification

Update contract tests for the renamed role, delegation grant, size routing, review presets, catalog selection, and plan-based Git authority. In a disposable repository, exercise base-into-feature merging and stacked PR diff checks. Smoke-test a read-only Pi worker through Orca and verify its effective model where the runtime exposes it. Run the repository’s Node, bootstrap, and shell checks; report existing environment failures without bypassing them. Preserve the current unrelated worktree changes.

## Assumptions

“Small” versus “large” is a decision in the human-approved plan, with a human override, rather than a slice-count threshold. The final “All OK” validates the presented result; it is not a fresh request to authorize each Git action. The Git worker is a role used for separate Git turns, not one session retained across the entire workflow.
