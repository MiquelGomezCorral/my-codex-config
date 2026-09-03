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

## Live Validation

In a disposable Git repository, confirm the nine custom agents and migrated skills are
discoverable, invoke one migrated command-equivalent skill, run one native reviewer,
invoke explicit Vault search, and observe the Workmux lifecycle hook.

## Rollback

Do not delete current OpenCode paths. Re-run `my-opencode-config`'s documented bootstrap
or restore its documented symlinks after stopping Codex. This repository does not install
or upgrade OpenCode.
