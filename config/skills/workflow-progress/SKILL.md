---
name: workflow-progress
description: Maintain local agentic-workflow run state, focus the native workflow map, render the progress page, and replay a visual demo. Use from `$workflow` at intake, dispatches, waits, results, corrections, gates, and resume.
---

# Workflow progress

Use this skill from the human-facing workflow coordinator. It records progress and
evidence; it never grants approval or proves completion. The workflow coordinator owns
updates at intake, before dispatch or wait, after results, during corrections, at gates,
and on resume.
For review JSON icons, use the [shared workflow icon catalog](../workflow/references/plan-review-template.md#icons).

Run `scripts/progress.mjs` from this skill. It uses Node's standard library and stores one
JSON record under `${XDG_STATE_HOME:-$HOME/.local/state}/agentic-workflow/<run-id>/`.
The generated HTML snapshot lives beside that record. State stays outside the repository.

```sh
node <workflow-progress-skill>/scripts/progress.mjs init --run <run-id> --repository <repo>
node <workflow-progress-skill>/scripts/progress.mjs list-steps
node <workflow-progress-skill>/scripts/progress.mjs update --run <run-id> \
  --done build-review.implement --active build-review.review --current "Reviewing the implementation" \
  --slice-context "Slice 1: workflow progress page" --next "Verify review findings" \
  --note "Implementation is ready for review."
node <workflow-progress-skill>/scripts/progress.mjs render --run <run-id>
node <workflow-progress-skill>/scripts/progress.mjs serve --run <run-id>
node <workflow-progress-skill>/scripts/demo.mjs --run workflow-demo-local --interval-ms 3000
```

The demo initializes or resets only runs named `workflow-demo-<id>`. It simulates the full
step catalog and records that no work, approvals, or Git actions occurred. Use a disposable
demo ID. Serve that run to watch the replay in the progress page.

The native map uses the editable draw.io source and explicit stable-ID bindings in
`assets/map.json`. Follow [map setup and updates](references/map-setup.md) to export and
inspect source changes, initialize a run with a map, and add persistent native metadata.
The map can provide visual context for active steps; checklist statuses remain authoritative.
Keep `assets/agent-workflow.drawio`, its paired `assets/workflow.svg`, and `assets/map.json`
as the shipped reference and test fixture when installing or adopting a different diagram.
Copy and customize a separate source and manifest.

`update` changes only the assigned steps and fields. Repeat a status flag to mark several
steps, including several `--active` steps. Use `--reopen <step-id>` to return a step to
`upcoming`; step order never implies completion. Use `--new-slice <slice-id>` only when a
new slice starts. It archives the previous slice's delivery statuses, evidence, approvals,
blockers, and recovery details, then resets repeated delivery steps. Planning statuses and
prior slice records remain intact.

Use `--set <field=value>` for `repository`, `current-stage`, `planning-mode`, `last-gate`,
`next-action`, `human-decision`, `wave-plan`, `wave-approval-state`,
`wave-approval-reference`, `wave-approval-bounds`, `scope`, `activity`, `slice-context`,
`activity-next`, `slice.base-revision`, `slice.worktree`, `slice.checkpoint-hash`,
`slice.final-commit-hash`, `slice.state`, `slice.pr-and-target`, `slice.ci-and-review`,
`slice.human-presentation`, and `slice.completion`. Use `--append <field=value>` for
`planning-evidence`, `approved-amendment`, `approval`, `slice.depends-on`,
`slice.checks-review`, `slice.evidence`, `slice.approval`, `slice.blocker`, `slice.recovery`,
`slice.shipping-action`, `evidence.link`, `evidence.deferred-finding`,
`evidence.unresolved-blocker`, and `evidence.lesson`. Structured approval rows use JSON, for example:
`--append approval='{"action":"local validation","approvedBounds":"one browser run","reference":"plan §Validation","state":"approved"}'`.
Remove resolved entries with `--resolve-slice-blocker <exact text>` or
`--resolve-unresolved-blocker <exact text>`. Each must match an existing item in its named
list; other blockers and evidence remain unchanged, and an unknown item rejects the update.
Approval and evidence values must come from their real source; never infer them from status.
The CLI rejects unknown step IDs, conflicting statuses, unsupported fields, and invalid
records before it writes. Notes keep the latest five distinct versions.

Run `render` to create a progress snapshot and a sibling `workflow-map.html` native viewer.
`serve` binds `0.0.0.0` on the first free port from `3100` to `3199` (override the start
with `--port`), prints its loopback URL and the chosen port, and refreshes progress every
two seconds while preserving scroll position, expanded sections, and the loaded native map.
Remote clients use this machine's observed host/IP with the same port. A snapshot and its
sibling map open offline. The pages escape run content, sandbox the map without same-origin
access, and load no remote resources.

Do not edit `assets/workflow.svg`; it is derived from `assets/agent-workflow.drawio`. Rebuild
and inspect after changing the source, then reconcile stable IDs and bindings before using
the map. Keep the canonical source and generated HTML out of run updates.

For a new run, initialize at intake. For an existing run, reconcile the legacy
[`progress.md` template](../workflow/templates/progress.md) against the plan and real
worker or Git state, then initialize and copy verified fields into the JSON record. Keep
the old template as a legacy reference; do not use it for routine updates.
