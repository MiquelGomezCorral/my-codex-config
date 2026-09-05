---
name: commit
description: Group and create commits through one worker routed to an available agent harness when explicitly authorized.
---

# Commit

Load `subagent-routing`. Treat an explicit `$commit` invocation or direct commit request
as authorization to create commits, but do not stage, commit, push, or publish from the
primary session.

Launch or resume exactly one configured commit worker through `subagent-routing`; in Codex
use `commit-worker`. Prefer the active harness unless the user selects another one, and use
visible quota substitution when required. Its prompt must include the current user request,
every user option, any `--ignore <path-or-glob>` value unchanged, and
`Plan path: <exact path>` when a persisted
plan is available or `Plan path: unavailable` otherwise. The worker re-inspects the
worktree first and preserves unrelated changes.

The worker chooses `commit-manager` for commit-only requests and `commit-push-pr` only
when push or pull-request work was explicitly requested. Wait for the worker and return
its result; the primary must never perform those actions itself.
