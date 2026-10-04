# Pull request

## Workflow

1. Inspect `git status`, diff/stat, recent commits, branch/upstream, and any existing PR.
2. Review repository instructions and checks. Stop if the worktree contains secrets,
   unclear unrelated changes, or failed required verification.
3. Create a draft pull request, or refresh the existing one.
4. Follow the project template; otherwise use `Summary`, `Verification`, and `Risks`.
5. Ground every claim in the diff, commits, conversation, and supplied launch context, and
   write `Not provided` rather than inventing product claims.

For a sequential slice, target the accepted predecessor PR branch while it remains
unmerged, so the new PR exposes only the child slice. Verify the PR diff contains only the
child slice; stop if ancestry or a squash merge makes that untrue. A merge is not required
before work on the child starts. After the predecessor merges, reconcile the target and
revalidate affected evidence. In a workflow, the accepted plan must name PR creation or
update and its target/bounds; after result acceptance, do not ask for that same
authorization again.

## Reviewer guidance

- Add a TL;DR that matches the actual diff.
- Separate core files from generated or mechanical files.
- Call out risky behavior changes, migration order, rollout plan, and test coverage.
- Link the issue tracker, dashboards, or design docs that explain intent.
- If the pull request is too large to make reviewable with notes, recommend splitting
  instead of polishing around the problem.

## History cleanup

Only rewrite history when the user asks for it or approves the plan. Before rewriting:

```bash
gh pr view <PR> --json title,headRefName,baseRefName,state,commits
git fetch origin <headRefName> <baseRefName>
ORIGINAL_TREE=$(git rev-parse origin/<headRefName>^{tree})
```

After rewriting, verify content identity:

```bash
echo "Original tree: $ORIGINAL_TREE"
echo "Current tree:  $(git rev-parse HEAD^{tree})"
git diff origin/<headRefName> --stat
```

Do not push when the tree changed unintentionally. Preferred commit groupings follow
dependency order: schema/storage or generated API definitions, core logic, wiring and
integration, UI or surface behavior, then tests.

## Hook failures

Pre-commit hooks are a hard gate. If any hook fails, stop — do not push or create the PR.

The Husky general signal is:

```
husky - pre-commit script failed (code N)
```

The exit code identifies which hook failed; inspect the surrounding output to find the
offending check. Read the repository's hook configuration and the full failure output, fix
the reported source, re-stage only the intended files, and create a new commit.

- Never use `--no-verify` or another hook-bypass flag.
- Never amend a failed-hook commit — the commit did not happen. Fix, re-stage, and create a
  new commit.
- If a hook exposes a pre-existing unrelated failure, report the blocker instead of
  bypassing it.

## Guardrails

- Never hide a meaningful behavior change inside "cleanup".
- Do not rebase, amend, force-push, or rewrite history without explicit approval.
