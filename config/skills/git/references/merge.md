# Merge

Sync the selected base branch into the current feature branch. Keep the feature branch
checked out; never switch to the base and merge the feature into it. Merging preserves both
branches' commits exactly as they are; this workflow never rebases.

Base branch resolution: an explicit branch argument is the base branch; otherwise the base
branch is the local branch of the feature's PR target when the feature backs a PR, and the
repository's default branch when it does not (`AGENTS.md` `## Git`, else
`git symbolic-ref refs/remotes/<remote>/HEAD`; if neither resolves, ask the parent). Merging any other base into a PR branch adds
foreign commits. Do not fetch for the merge itself; the read-only fetch in the `Own commits
only` check is the one exception.

When the feature backs a PR, run the `Own commits only` check in `pr.md` first. If the branch
carries foreign commits, stop before merging and route to the `pr.md` rebuild: a merge commit
in that range blocks the rebuild. Merge only after the rebuild, or when the human accepts the
foreign commits.

If `git status --porcelain` reports staged, unstaged, or untracked changes, commit them
through `commit.md` only when the accepted plan or direct request also names that commit.
Otherwise stop. Do not start a merge that would overwrite uncommitted work.

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

Confirm the current branch is the planned feature target and is not the resolved base or a
protected branch. Merge the base into that current feature branch:

```bash
git merge --no-ff <base-branch>
```

## History integrity

A merge must preserve every existing commit and both branches' histories. These rules are
not negotiable and are not overridden by a convenient-looking cleanup:

- Never squash, rebase, amend, or otherwise rewrite feature or base commits.
- Always merge with `--no-ff`, so the base commits and their original identities stay
  visible in the feature branch.
- Never delete the merged branch unless the user asks. Never use `git branch -D` on a branch
  that is not fully merged.
- Never force-push.

After merging, verify and report:

```bash
git merge-base --is-ancestor <base-branch> <feature-branch> && echo "base synced into feature"
git log --oneline <feature-branch>..<base-branch>   # expect empty: base fully included
git diff <base-branch>...<feature-branch> --stat    # inspect the feature-only change
```

If the ancestry check fails or the base-only log is non-empty, stop and report it. Confirm
the diff contains only the feature work; do not clean up or push. A merge does not remove
commits from a squash-merged or rebased predecessor. When `git log <base>..<feature>`
still lists foreign commits, only report them and stop; the rebuild is a separate,
authorized PR action under `pr.md`'s `Own commits only` rule, never part of a merge turn.

Do not push. Report the merge result, including the three verification outputs.
