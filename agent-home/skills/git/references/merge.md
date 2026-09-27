# Merge

Finish the current branch: merge it into its base branch and return to the branch you
started on. Merging preserves the branch's own commits exactly as they are; this workflow
never rebases.

Base branch resolution: an explicit branch argument is the base branch; otherwise the base
branch is local `main`. Do not fetch.

If `git status --porcelain` reports staged, unstaged, or untracked changes, commit them
through `commit.md` when the request authorizes a commit, then continue. Do not start a
merge that would overwrite uncommitted work.

## Repository gates

The target repository may define `pre-commit`, `commit-msg`, `pre-push`, or CI gates,
required checks, and protected branches. Resolve them as described in the skill's
`Repository rules win` section and treat every one of them as a hard gate. Run the
repository's required checks for the change, never bypass a hook, and report a pre-existing
unrelated failure as a blocker instead of working around it.

## Conflict protocol

- Before resolving anything, understand what changed in each conflicting file on the base
  branch: `git log -p -n 3 <base-branch> -- <file>`.
- The goal is to preserve both the base branch's changes and the branch's own changes.
- After resolving each conflict, stage the file and complete the merge with
  `git merge --continue`, or `git commit` when the merge state requires it.
- If a conflict is too complex or unclear, ask for guidance before proceeding. To abandon
  the merge, use `git merge --abort` and report it. Never resolve a conflict by discarding
  the branch's changes.

## Merge

Record the current branch, merge it into the base branch, and return to the branch you
started on:

```bash
git checkout <base-branch>
git merge --no-ff <branch>
git checkout <branch>
```

## History integrity

A merge must preserve every branch-only commit and the branch's own history. These rules are
not negotiable and are not overridden by a convenient-looking cleanup:

- Never squash: every branch-only commit survives as its own commit with its original
  identity.
- Never rebase, amend, or otherwise rewrite the commits a branch made for itself.
- Always merge with `--no-ff`, so the branch's commits, their original identities, and the
  branch topology stay visible.
- Never delete the merged branch unless the user asks. Never use `git branch -D` on a branch
  that is not fully merged.
- Never force-push.

After merging, verify and report:

```bash
git log --oneline <base-branch>..<branch>   # expect empty: nothing left unmerged
git merge-base --is-ancestor <branch> <base-branch> && echo "branch fully contained"
git diff <branch> <base-branch> --stat      # expect empty: content fully merged
```

If any check is non-empty, stop, report it, and do not clean up or push.

Do not push. Report the merge result, including the three verification outputs.
