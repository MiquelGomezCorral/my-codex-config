# Push

## Repository gates

The target repository may define `pre-push` hooks, required checks, CI gates, and protected
branches. Resolve them as described in the skill's `Repository rules win` section and treat
every one of them as a hard gate. Run the repository's required checks for the change, never
bypass a hook, and report a pre-existing unrelated failure as a blocker instead of working
around it.

## Rules

- Never commit directly on `main`, `master`, `staging`, or another protected branch.
  Create a descriptive branch when one is needed, and only with the authorization for that
  action.
- In a workflow, the accepted plan must name the push, target branch, and bounds. After the
  human accepts the presented result, the plan's named push may proceed without another
  action-level authorization request. A local checkpoint alone does not authorize a push.
- In the final workflow handoff, push only after the Git worker has staged the accepted
  task-owned deliverables, created a final commit if needed, and verified that the resulting
  tree matches the presented result. Record the checkpoint and final commit hashes.
- Review repository instructions and checks. Stop if the worktree contains secrets, unclear
  unrelated changes, or failed required verification.
- When the branch backs a PR, run the `Own commits only` check in `pr.md` before pushing.
- Push and set the upstream when required (`git push -u origin <branch>`). Never force-push
  and never amend a commit that has already been pushed. The one exception is the
  pinned `--force-with-lease` push after an approved `Own commits only` rebuild in `pr.md`;
  never plain `--force`.
- Run the smallest repository-defined checks that prove the staged change. For an explicit
  WIP checkpoint, run the cheapest check that supports the claim and respect documented
  non-interactive runner constraints.
- For an explicit WIP checkpoint, stop after the push unless pull-request metadata was also
  requested.
- If no changes exist, report that and stop.
