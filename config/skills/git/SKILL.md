---
name: git
description: Own git operations for a repository — commit, push, pull request, merge, and PR-comment triage. Resolve the repository's own git conventions first and follow them.
---

# Git

This skill owns git actions and routes each one to its reference.

## Repository rules win

Resolve the repository's own git conventions before applying any default in this skill, in
this order:

1. Repository `AGENTS.md` / `CLAUDE.md` instructions.
2. A repository skill that owns commits, pushes, or PRs, under `.agents/skills/`,
   `.claude/skills/`, or a path its `AGENTS.md` names (for example `commit-push-pr`).
3. The PR template; `references/pr.md` lists where to find it.
4. A conventions document (`CONTRIBUTING.md`, `docs/conventions/`, `docs/`).
5. Existing history (`git log --oneline -20` and the style of recent commits).
6. Tooling configuration (commitlint, husky/pre-commit, branch protection).

Use both the repository rules and this skill. Where the repository defines a rule, follow
it even when it contradicts this skill's defaults; where it is silent, fill the gap with
the reference defaults. State which sources were followed.

Other repositories carry their own rules. Whenever work touches another repository —
mirroring its history, committing, pushing, merging, or opening a pull request — that
repository's instructions govern, and it may enforce them with hooks (`pre-commit`,
`commit-msg`, `pre-push`), required checks and tests, CI gates, protected branches, and
review requirements. Follow them even when they differ from this skill's defaults or add
work this skill does not require. Never bypass a hook, disable a check, or force an action
past a repository gate. Report a gate you cannot satisfy instead of working around it.

The references below are self-contained on purpose. A repository that does not have this
skill still needs complete working defaults, so each reference states its own rules instead
of pointing at repository-local files. Repositories may restate this information freely,
and a repository with its own convention simply overrides the matching default.

## Authority

An accepted human-approved plan authorizes only its named Git actions, targets, and bounds.
It may authorize a local checkpoint before cleanup. Final human acceptance is the result
gate before shipping those named actions, not a second Git authorization request. A
checkpoint never authorizes an unlisted push or PR. After acceptance in an approved
workflow, the Git worker inspects all remaining changes against the approved scope and
accepted result, stages explicit task-owned deliverables, commits only when needed, verifies
the final tree matches the accepted result, except as workflow stage 8 allows, and then
performs only the plan-authorized push. Stop on ambiguous ownership or a changed accepted
result. In a `final-only` wave the plan may also name a local commit at the end of each
slice on the wave's one branch. Outside workflow context, a direct Git request authorizes
only the action and scope it names. Repository rules and any required approval for
destructive recovery still apply.

## Delegation

All five actions — `commit`, `push`, `pr`, `merge`, and `review-pr-comments` — go through
exactly one worker via `super-agent`; in Codex, use `git-worker`. The Git skill stays the
sole owner of Git policy. `super-agent` owns harness, role, model, and thinking selection;
the worker uses the sized catalog role `git-worker`. Take the size the user or the approved
plan already gave; otherwise ask the user for small, medium, or large, with your suggestion,
before launching. Include the resolved `git-worker` role, size, harness, model, and thinking
in the packet and treat missing `git-worker` coverage as a blocker. The worker prompt carries the current user
request, every user option, any
`--ignore <path-or-glob>` value unchanged, and `Plan path: <exact path>` when a persisted
plan is available or `Plan path: unavailable` otherwise. Also pass the repository Git
conventions already in private memory, such as the PR template path or template index and
the repository's shipping skill, or `Git conventions: none recorded`.

`--no-delegation` makes the receiving agent run the `commit` itself with no worker, plus any
`--push` or `--pr` that comes with it. It applies to `commit` only; never run `merge` or
`review-pr-comments` inline.

When workflow context is present, pass its exact plan path, slice, scope, exclusions, and
named Git authorization bounds to the worker. Do not synthesize or widen authorization.

## History rewrites

Git work never rebases, and `merge` never rewrites history. Two rewrites are allowed: the PR rebuild under `pr.md`'s `Own commits only`, only when the accepted plan
names it or the human approves it, and the fold in `commit.md`, only with the human's
approval each time. Both follow this protocol:

1. Before: record the old head as a literal hash and keep it reachable with a backup ref,
   `git update-ref refs/agent-backup/<branch>-<old-head-short> <old-head>`.
2. Rebase with `--no-update-refs`, so no other branch moves. Never `git rebase --skip`; on a
   conflict or stop, `git rebase --abort`.
3. After: the tree check and the commit count in the owning reference pass, and its
   `git range-diff` matches the shape that reference describes.
4. Push a pushed branch only with `--force-with-lease=<branch>:<pushed-sha>
   --force-if-includes`, never plain `--force`.
5. On any mismatch, stop. Do not push; report the old head, the backup ref, and what
   differed, and ask the parent. Restore with `git reset --hard <backup-ref>` only when
   the parent asks.

## Plan context

Commits and PRs describe what the work achieves, and the plan holds that goal. Without a
supplied plan path, the worker searches the private `agent-memory/plans/` directory under
`git rev-parse --path-format=absolute --git-common-dir` for the plan matching the branch,
slice, changed paths, and recent dates. It reads only plans there, no other private notes.

The worker never asks the human. It asks its parent agent, through the wrapper's ask route
when one exists or otherwise as a `Question:` field before `Memory candidates:` in its
report. The parent answers from its own context, or asks the human when only the human can
decide, and persists any useful answer.

- One clear match: use it and report its path.
- Several candidates: stop and ask the parent which plan applies.
- No plan: continue the Git work, but ask the parent for the plan or goal. Keep a PR this
  turn creates in draft; leave an existing PR's draft or ready state unchanged. The parent
  has the worker refresh the PR title and body from the answer.

## Route

| Action | Reference |
| --- | --- |
| `commit` | `references/commit.md` |
| `push` | `references/push.md` |
| `pr` | `references/pr.md` |
| `merge` | `references/merge.md` |
| `review-pr-comments` | `references/review-pr-comments.md` |

## Report

Report the branch, staged scope, commit hash and title, push result, PR action, URL, plan
path used, PR template used, and the PR's commit list against its target. Report `Not provided` instead of inventing a claim. If no
changes exist, report that and stop. Return newly found repository Git conventions, such
as the PR template path and shipping skill, as `Memory candidates:` for `workflow.md`
(`Commit And PR`).
