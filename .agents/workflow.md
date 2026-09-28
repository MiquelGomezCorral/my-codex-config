# Workflow

## Setup

Run `./bootstrap.sh` only after reviewing the repository. It links individual durable
Codex entries, shared skills, helper adapters, and generated policy; it never replaces
the app-managed Codex or OpenCode binaries.
For the opt-in agentic flow, start `$workflow` with the initial materials; it persists
the approved wave plan before delivery and uses the workflow
skill's local progress template. Advance one accepted slice at a time; authorizations,
worktree ancestry, PR status, and test evidence must be refreshed from their real owners.

## Authentication

Authenticate Codex manually when the live validation flow is approved. Credentials and
runtime state remain outside Git.

## Checks

Run `./bootstrap.sh --check`, the focused Node tests, and `bash tests/bootstrap.test.sh`.
The isolated-home bootstrap is available as a user-approved live/readiness flow, not as
an automatic deployment step.
For the agentic workflow and Git-worker correction, the focused configuration/dispatch
suite passed 16/16 tests and the full Node suite passed 21/21. Quick validation passed for
the six changed skills, and `git diff --check` passed. `./bootstrap.sh --check` still stops
on the existing machine-specific Orca hook path; `bash tests/bootstrap.test.sh` stops at
the existing non-TTY Codex CLI probe before Pi/AGY generation assertions. The supervised
Pi smoke test and live workflow scenarios remain unverified.
After the stage/review/critic correction on 2026-09-28, the focused configuration suite
passed 15/15 and the full Node suite passed 21/21. Codex TOML and shell syntax checks,
four skill quick validations, and direct Pi/AGY critic-role rendering passed. The two
bootstrap blockers above remain; no live agentic flow was run.
The base-into-feature merge and stacked-PR check is covered by static contracts only; the
repo-only migration rules prohibit the disposable repository needed for a live Git exercise.
After the single-entry consolidation on 2026-09-28, the full Node suite passed 22/22,
including command dispatch, skill contracts, and local SVG preview safety. The five
changed skills passed quick validation; shell and renderer syntax plus `git diff --check`
passed. The same pre-existing bootstrap blockers above remain. No live workflow was run.

For delegation-routing changes, edit model identifiers only in
`agent-home/skills/super-agent/references/model-catalog.yaml`. Harness sections use
ordered `low`, `medium`, `high`, and `local` routes; entries must remain secret-free, and
`max_local_concurrency` limits all cataloged local processes, including the orchestrator.
Validate the routing-related skills, then run `node --test tests/codex-config.test.mjs`,
`bash tests/bootstrap.test.sh`, and `./bootstrap.sh --check`.

## Live Validation

In a disposable Git repository, confirm the configured custom agents and migrated skills are
discoverable, invoke one migrated command-equivalent skill, run one native reviewer,
invoke explicit Vault search, and observe the configured lifecycle hooks.
For the new workflow, separately run the documented brief-fix, dependent two-slice, and
interrupted-slice scenarios with explicit bounded authorization. Validate the chosen
application's actual flow, expected result, and runnable test path before claiming a
live pass; this configuration task did not authorize such a target.

## Rollback

Do not delete current OpenCode paths. Re-run `my-opencode-config`'s documented bootstrap
or restore its documented symlinks after stopping Codex. This repository does not install
or upgrade OpenCode.
