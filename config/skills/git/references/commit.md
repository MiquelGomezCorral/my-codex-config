# Commit

Group changes by purpose, not by file. One commit is one logical change.

## Grouping rules

1. Group by purpose, not by file — multiple files may belong to the same commit.
2. Never mix unrelated changes in the same commit.
3. Prefer many small coherent commits over one large commit.
4. Each commit must be independently understandable and reversible.
5. Stage explicit paths non-interactively. Never blanket-stage; use `git add -A` only when
   the entire worktree is intended. If one file mixes unrelated changes that cannot be
   split safely, ask one focused question instead of using interactive `git add -p`.
6. Strip all Jupyter notebook outputs before staging `.ipynb` files — run
   `jupyter nbconvert --ClearOutputPreprocessor.enabled=True --inplace <file>` or
   `nbstripout <file>` on each notebook.
7. Present the grouping plan only when there are multiple groups or genuine ambiguity; ask
   only when the correct grouping cannot be inferred safely.

## Commit order

1. `style` — formatting / whitespace
2. Renames / moves
3. `refactor` — code changes without behavior change
4. `fix` — bug fixes
5. `perf` — performance improvements
6. `feat` — new features
7. `test` — adding or modifying tests
8. `docs` — documentation
9. `chore` — maintenance, config, build

## Commit message format

```
<type>: <short description>
```

Types:

| Type | Purpose |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `style` | Formatting / whitespace (no logic change) |
| `refactor` | Code change without behavior change |
| `test` | Add or modify tests |
| `chore` | Maintenance, config, build tasks |

Use a lowercase, imperative description of what the change achieves, taken from the plan's
goal, not the mechanism. Do not add scopes, breaking-change markers, or
other Conventional-Commit decorations beyond the type. A repository convention overrides
this format.

## Safety

- Never commit secrets, environment files, or large binaries.
- Never bypass hooks; fix the reported source or report the blocker.
- Do not infer a push or PR from a commit. Those actions must also be named in the
  approved plan or direct request and remain subject to `push.md` and `pr.md`.
- In an approved workflow, create a local cleanup checkpoint, or a `final-only` slice's
  local commit, only when the plan names that action and its scope. Record the hash; do
  not push it or treat it as permission for an unlisted shipping action.
- For the final post-acceptance handoff, inspect every remaining staged, unstaged, and
  untracked change against the approved scope and presented result. Stage explicit
  task-owned deliverable paths; exclude private memory, progress files, temporary agent
  artifacts, and unrelated changes. A plan-scoped skill or agent-configuration file is a
  deliverable by scope, not a working-only artifact by filename. Create a final commit only
  when needed, record its hash, and stop if ownership or the accepted result is unclear.

## Fold a fix into an earlier slice commit

Use this only for final-gate feedback in a `final-only` wave, and only when the parent
passes the human's choice to fold this item into the owning slice's commit. Without it, do
not fold: stop and ask the parent. `<wave-base>` is the first slice's recorded base
revision.

1. Check that the rebase may rewrite the range: no commit in it is on a remote, and no
   merge sits in it. Refresh every configured remote's branches and tags first; local
   remote-tracking refs alone may be stale:

   ```sh
   git config --get-regexp '^remote\..*\.fetch$'  # each remote: +refs/heads/*:refs/remotes/<name>/*
   git fetch --all --tags --prune                  # must succeed
   git rev-list --count <wave-base>..HEAD
   git rev-list --count <wave-base>..HEAD --not --remotes --tags
   git rev-list --merges <wave-base>..HEAD         # empty: rebase would drop merge commits
   ```

   The second count ignores commits reachable from any remote-tracking branch or tag, local
   tags included. Fold only when every remote fetches all its branches, the fetch succeeds,
   both counts match, and the merge list is empty. Otherwise do not fold; report the failed
   check so the parent can offer a new commit on top.
2. Commit the fix with `git commit --fixup=<owning-sha>`, staging only its paths. Each
   cleanup checkpoint the workflow adds to that fix is made as a `--fixup=<owning-sha>`
   commit when it is created. After the last one, record `HEAD` as `<old-head>`, a literal
   hash, and create the backup ref the skill's `History rewrites` section describes.
3. Stop if `<wave-base>..HEAD` holds no `fixup!` commit. Fold it:
   `GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash --no-update-refs <wave-base>`. On a
   conflict or stop, run `git rebase --abort`, never `git rebase --skip`, and report it.
4. Verify:

   ```sh
   git diff --quiet <old-head> HEAD                       # same tree: folding never changes it
   git rev-list --count <wave-base>..HEAD                 # the count at <old-head> minus the fixup commits
   git range-diff <wave-base>..<old-head> <wave-base>..HEAD   # readable record, see below
   ```

   Tree equality and the count are the gates. In the range-diff, every commit except the
   owning one and the `fixup!` commits shows `=`. The owning commit shows `!` or a `<`/`>`
   pair, and each `fixup!` commit shows as one `<` line.

   Stop on any mismatch: report the old head, the backup ref, and what differed, and ask
   the parent. Otherwise report the rewritten commit hashes.
