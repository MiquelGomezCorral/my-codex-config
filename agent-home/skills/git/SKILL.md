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
2. A conventions document (`CONTRIBUTING.md`, `docs/conventions/`, `docs/`).
3. Existing history (`git log --oneline -20` and the style of recent commits).
4. Tooling configuration (commitlint, husky/pre-commit, PR templates, branch protection).

Where the repository defines a rule, follow it even when it contradicts this skill's
defaults, and state which source was followed. When the repository is silent, use the
reference defaults.

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

An explicit `$commit`, `$merge`, or direct request authorizes only that action's scope.
Push, branch creation, pull-request work, history rewrite, and any destructive git action
each need their own explicit authorization. Never commit, push, publish, or mutate shared
state without it.

## Delegation

`commit`, `push`, and `pr` hand the work to exactly one worker through `super-agent` — in
Codex, `commit-worker`. `super-agent` owns harness, role, catalog tier, and model
selection; include the resolved tier in the packet and treat missing catalog coverage as a
blocker. The worker prompt carries the current user request, every user option, any
`--ignore <path-or-glob>` value unchanged, and `Plan path: <exact path>` when a persisted
plan is available or `Plan path: unavailable` otherwise.

`--no-delegation` makes the receiving agent perform the work inline with no subagent.

`merge` and `review-pr-comments` always run inline.

## Route

| Action | Reference |
| --- | --- |
| `commit` | `references/commit.md` |
| `push` | `references/push.md` |
| `pr` | `references/pr.md` |
| `merge` | `references/merge.md` |
| `review-pr-comments` | `references/review-pr-comments.md` |

## Report

Report the branch, staged scope, commit hash and title, push result, PR action, and URL.
Report `Not provided` instead of inventing a claim. If no changes exist, report that and
stop.
