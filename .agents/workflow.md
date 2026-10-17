# Workflow

## Setup

Run `./bootstrap_codex.sh` only after reviewing the repository. It links individual durable
Codex entries, shared skills, helper adapters, and generated policy; it never replaces
the app-managed Codex or OpenCode binaries. `bootstrap_claude.sh`, `bootstrap_pi.sh`, and
`bootstrap_agy.sh` are independent and do the same for their harnesses.
For the opt-in agentic flow, start `$workflow` with the initial materials; it persists
the approved wave plan before delivery and tracks progress with the `workflow-progress`
CLI and its HTML view. Advance one accepted slice at a time; authorizations,
worktree ancestry, PR status, and test evidence must be refreshed from their real owners.

## Authentication

Authenticate Codex manually when the live validation flow is approved. Credentials and
runtime state remain outside Git.

## Checks

Run `./bootstrap_codex.sh --check`, the focused Node tests, and `bash tests/bootstrap.test.sh`.
The isolated-home bootstrap is available as a user-approved live/readiness flow, not as
an automatic deployment step.

`--check` is read-only: it validates the source inventory, the dependency set, and the Codex
configuration, then exits. `--check-deps` validates only the source and dependencies. Note
that `--check` requires `codegraph` on `PATH`, while the full run installs it when missing.

History: after the 2026-09-29 bootstrap handover repair, `./bootstrap.sh --check`,
`bash tests/bootstrap.test.sh`, shell syntax checks, and the full Node suite passed (26/26).
The actual `./bootstrap.sh --pi --agy` run (a script since split into the four dedicated
bootstraps) installed all eleven roles and preserved local
Codex settings; the reviewer recheck approved the result. The live disposable workflow
remains unverified and still requires explicit user approval.

For delegation-routing changes, edit model identifiers only in
`config/skills/super-agent/references/model-catalog.yaml`. Role entries own automatic
routes; harness sections hold ordered `low`, `medium`, `high`, and `local` tier routes;
entries must remain secret-free, and `max_local_concurrency` limits all cataloged local
processes, including the orchestrator. Validate the routing-related skills, then run
`node --test tests/codex-config.test.mjs`, `bash tests/bootstrap.test.sh`, and
`./bootstrap_codex.sh --check`.

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
