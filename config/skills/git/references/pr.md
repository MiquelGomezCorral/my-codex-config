# Pull request

## Workflow

1. Inspect `git status`, diff/stat, recent commits, branch/upstream, and any existing PR.
   Run the `Own commits only` check against the PR target.
2. Review repository instructions and checks. Stop if the worktree contains secrets,
   unclear unrelated changes, or failed required verification.
3. Read the plan from the `SKILL.md` plan-context rules: it gives the goal and the feature
   area that the title and body describe.
4. Find the PR template: a path supplied in the packet or named by the repository shipping
   skill, then `pull_request_template.md` in any letter case under `.github/`, the
   repository root, or `docs/`, then the `.github/PULL_REQUEST_TEMPLATE/` directory. Verify
   a supplied path still exists. Use the template's sections exactly, in order, with no
   extra sections. Only when no template exists, use `Summary`, `Verification`, and `Risks`.
   When a template directory holds several templates, use the template index the packet
   supplies; otherwise read each template and build one: a line per file with what it is
   for, when to use it, and any useful insight. Pick the template that matches the plan's
   change, ask the parent when none clearly fits, and return the index as a memory
   candidate for `workflow.md` so later packets carry it.
5. Create a draft pull request, or refresh the existing one without changing its draft or
   ready state.
6. Take the goal and user-facing outcome from the plan and request; ground every factual
   claim in the diff, commits, and verification. Write `Not provided` rather than inventing
   product claims.

For a sequential slice, target the accepted predecessor PR branch while it remains
unmerged, so the new PR exposes only the child slice. A merge is not required before work
on the child starts. After the predecessor merges, retarget the child PR to the
predecessor's target, remove the predecessor's commits as `Own commits only` says, and
revalidate affected evidence. In a workflow, the accepted plan must name PR creation or
update and its target/bounds; after result acceptance, do not ask for that same
authorization again.

## Own commits only

A PR holds only the commits made for it. Commits from another PR, a predecessor slice,
or another branch are foreign, even when they sit underneath because the branch started
from them or because the predecessor was squash-merged or rebased upstream. A merge
commit that syncs the PR's own target is allowed. Foreign commits block the PR unless the
human explicitly accepted them for this PR.

`<remote>` is the remote of the repository the PR merges into, taken from the PR or the
plan and matched against `git remote -v`. Use `origin` only when it is that repository; in
a fork it usually is not. `<push-remote>` is where the PR branch itself lives.

Check before every push to a PR branch, PR creation, retarget, and refresh:

```bash
git fetch <remote> <target>
git log --oneline <remote>/<target>..HEAD    # every commit must belong to this PR
git diff <remote>/<target>...HEAD --stat     # only this PR's files
```

Match each listed commit to this PR's plan, slice, or request. When any commit is foreign,
stop before pushing or opening the PR and rebuild the branch on the target with only its
own commits.

Find `<old-base>`: the newest foreign commit that every own commit descends from, usually
the predecessor's head or the old target the branch started from. `git log` lists newest
first, so do not take the last foreign line it prints. Rebuild only when both hold:

```bash
git log --oneline <old-base>..HEAD           # exactly this PR's own commits, nothing else
git rev-list --merges <old-base>..HEAD       # empty: rebase would drop merge commits
```

Otherwise foreign and own commits interleave, or a merge sits in the range, and a rebase
can silently drop own work or a conflict resolution. Stop and ask the parent, showing
`git log --graph --oneline <remote>/<target>..HEAD`.

When the branch was already pushed, someone else may have added commits to it. Fetch it and
stop unless the local branch already contains every pushed commit:

```bash
git fetch <push-remote> <branch>
git rev-parse <push-remote>/<branch>                      # note this hash as <pushed-sha>
git merge-base --is-ancestor <push-remote>/<branch> HEAD  # must succeed
```

Note the old head (`git rev-parse HEAD`), its tree (`git rev-parse HEAD^{tree}`), and the own
count (`git rev-list --count <old-base>..HEAD`) as literal values in the report, not shell
variables. Create the backup ref the skill's `History rewrites` section describes, then
rebuild:

```bash
git rebase --no-update-refs --onto <remote>/<target> <old-base>
git rev-list --count <remote>/<target>..HEAD               # must equal the own count
git range-diff <old-base>..<old-head> <remote>/<target>..HEAD   # every line must be `=`
```

`range-diff` exits 0 even when a commit is missing, so read every line: a `<`, `>`, or `!`
means a commit was lost, added, or changed. Then compare the content. When the target did
not move under the own commits, `git rev-parse HEAD^{tree}` must equal the old tree.
Otherwise the two cumulative patches must match: run `git diff <old-base> <old-head> |
git patch-id --stable` and `git diff <remote>/<target> HEAD | git patch-id --stable`, and
compare the first hash of each. A mismatch, a wrong count, or a `range-diff` line other
than `=` means do not push: report the old head and backup ref, and ask the parent. On a
rebase conflict or stop, run `git rebase --abort`; never `git rebase --skip`, which drops an
own commit.

Rerun the check and the affected repository checks afterwards. The rebuild rewrites
history. A pushed branch then needs a lease pinned to the hash checked above, so a commit
pushed after that check is never overwritten; never plain `--force`:

```bash
git push --force-with-lease=<branch>:<pushed-sha> --force-if-includes <push-remote> <branch>
```

Run the rebuild only when the accepted plan names it or the human approves it. Otherwise
ask the parent once, with the foreign commits, the exact commands, and the expected
result.

## Title

Use the repository title format when one exists. The subject says what changes and for
whom, named by the feature a teammate would recognize, never by the mechanism that
delivers it. A reader who sees only the title knows the product area and the outcome.

- Lead with the feature area when the type and scope name only a package or directory.
- Take the outcome from the plan's goal, not from code identifiers or plan slice labels.
- Keep it under about 70 characters; the body carries the details.

| Mechanism title | Outcome title |
| --- | --- |
| `Connect inside chat` | `Connect integrations inside chat` |
| `recover failed connections` | `Recover failed integration connections` |
| `One-time file reminder` | `One-time integration reminder` |
| `queue chat attachments while answering` | `Improve queued chat attachments UI while answering` |
| `preserve durable implementation decisions` | `Preserve implementation decisions for agents` |
| `keep courses quiz-bound with stable unit references` | `Remove fake people, limit course checks to quizzes` |

## Reviewer guidance

Add these as sections only when the repository has no template. With a template, put the
points that apply inside its sections and add nothing else.

- Add a TL;DR that matches the actual diff.
- Separate core files from generated or mechanical files.
- Call out risky behavior changes, migration order, rollout plan, and test coverage.
- Link the issue tracker, dashboards, or design docs that explain intent.
- If the pull request is too large to make reviewable with notes, recommend splitting
  instead of polishing around the problem.

## History cleanup

Only rewrite history when the user asks for it or approves the plan, and follow the skill's
`History rewrites` section. Before rewriting, note the head and its tree as literal values:

```bash
gh pr view <PR> --json title,headRefName,baseRefName,state,commits
git fetch <push-remote> <headRefName>
git rev-parse <push-remote>/<headRefName>^{tree}    # note as <original-tree>
```

After rewriting, verify content identity against the noted value:

```bash
git rev-parse HEAD^{tree}                           # must equal <original-tree>
git diff <push-remote>/<headRefName> --stat         # must be empty
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
- Do not rebase, amend, force-push, or rewrite history without explicit approval, and then
  only through the skill's `History rewrites` protocol.
