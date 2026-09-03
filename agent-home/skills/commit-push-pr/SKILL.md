---
name: commit-push-pr
description: Stage changes, create a conventional commit, push the branch, and create or refresh PR metadata. Use only when the user explicitly asks to ship current work to GitHub.
---

# Commit, Push, PR

Load `make-pr-easy-to-review` for shipped-work reviewer guidance. Do not use its
history-rewrite workflow without separate approval.

## Workflow

1. Inspect `git status`, diff/stat, recent commits, branch/upstream, and any existing PR.
2. Review repository instructions and checks. Stop if the worktree contains secrets,
   unclear unrelated changes, or failed required verification.
3. Never commit directly on `main`, `master`, `staging`, or another protected branch;
   create a descriptive branch when needed.
4. Stage only intended files by explicit path. Never use blanket staging.
5. Run the smallest repository-defined checks that prove the staged change. For a WIP
   checkpoint, run the cheapest check supporting the claim. Respect documented
   non-interactive runner constraints.
6. Create a repository-conforming commit; otherwise use Conventional Commits. Never
   bypass hooks or amend a failed commit. Follow `references/hook-failures.md` when a
   hook fails.
7. Push and set upstream when required.
8. For shipped work, create a draft PR or refresh the existing PR. Follow the project
   template; otherwise use Summary, Verification, and Risks. Ground claims in the diff,
   commits, conversation, and supplied launch context; write `Not provided` rather than
   inventing product claims.
9. For an explicit WIP checkpoint, stop after push unless PR metadata was also requested.

Report branch, staged scope, commit hash/title, push result, PR action, and URL. Do not
rebase, amend, force-push, rewrite history, or perform destructive Git actions without
explicit approval.

If no changes exist, report that and stop.
