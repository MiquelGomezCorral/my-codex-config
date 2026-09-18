# Workflow

## Setup

Run `./bootstrap.sh` only after reviewing the repository. It links individual durable
Codex entries, shared skills, helper adapters, and generated policy; it never replaces
the app-managed Codex or OpenCode binaries.

## Authentication

Authenticate Codex manually when the live validation flow is approved. Credentials and
runtime state remain outside Git.

## Checks

Run `./bootstrap.sh --check`, the focused Node tests, and `bash tests/bootstrap.test.sh`.
The isolated-home bootstrap is available as a user-approved live/readiness flow, not as
an automatic deployment step.

For delegation-routing changes, edit model identifiers only in
`agent-home/skills/subagent-routing/references/model-catalog.yaml`. Harness sections use
ordered `low`, `medium`, `high`, and `local` routes; entries must remain secret-free, and
`max_local_concurrency` limits all cataloged local processes, including the orchestrator.
Validate the routing-related skills, then run `node --test tests/codex-config.test.mjs`,
`bash tests/bootstrap.test.sh`, and `./bootstrap.sh --check`.

## Live Validation

In a disposable Git repository, confirm the eight custom agents and migrated skills are
discoverable, invoke one migrated command-equivalent skill, run one native reviewer,
invoke explicit Vault search, and observe the Workmux lifecycle hook.

## Rollback

Do not delete current OpenCode paths. Re-run `my-opencode-config`'s documented bootstrap
or restore its documented symlinks after stopping Codex. This repository does not install
or upgrade OpenCode.
