---
name: workflow-progress
description: Maintain local agentic-workflow run state, focus the native workflow map, render the progress page, and replay a visual demo. Use from `$workflow` at intake, dispatches, waits, results, corrections, gates, and resume.
---

# Workflow progress

Use this skill from the human-facing workflow coordinator. It records progress and
evidence; it never grants approval or proves completion. The workflow coordinator owns
updates at intake, before dispatch or wait, after results, during corrections, at gates,
and on resume.
For review JSON icons, use the [shared icon catalog](../artifacts/references/plan-page.md#icons).

Run `scripts/progress.mjs` from this skill. It uses Node's standard library and stores one
JSON record under `${XDG_STATE_HOME:-$HOME/.local/state}/agentic-workflow/<run-id>/`.
The generated HTML snapshot lives beside that record. State stays outside the repository.

```sh
node <workflow-progress-skill>/scripts/progress.mjs init --run <run-id> --repository <repo>
node <workflow-progress-skill>/scripts/progress.mjs list-steps
node <workflow-progress-skill>/scripts/progress.mjs update --run <run-id> --new-slice slice-1 \
  --active build-review.implement --slice-context "Slice 1: workflow progress page"
node <workflow-progress-skill>/scripts/progress.mjs update --run <run-id> --slice slice-1 \
  --done build-review.implement --active build-review.review --current "Reviewing the implementation" \
  --next "Verify review findings" --note "Implementation is ready for review."
node <workflow-progress-skill>/scripts/progress.mjs render --run <run-id>
# run serve in the background, then list it on the artifacts hub with hub.py app (see "Apps" there)
node <workflow-progress-skill>/scripts/progress.mjs serve --run <run-id>
node <workflow-progress-skill>/scripts/demo.mjs --run workflow-demo-local --interval-ms 3000
```

The demo deletes and re-initializes only runs named `workflow-demo-<id>`. It replays a wave
with three slices: planning, one slice that finishes alone, two slices in parallel at
different stages that later stand on the same step, and the wave close. Along the way it
opens and resolves a run login item, a run blocker, a human decision, a slice-1 live-test
item, and a slice-2 blocker, each for at least two ticks, so the attention panel appears and
then clears. Its notes record that no work, approvals, or Git actions occurred; its one
sample approval is marked simulated. Use a disposable demo ID. Serve that run to watch the
replay in the progress page.

The native map uses the editable draw.io source and explicit stable-ID bindings in
`assets/map.json`. Follow [map setup and updates](references/map-setup.md) to export and
inspect source changes, initialize a run with a map, and add persistent native metadata.
The map can provide visual context for active steps; checklist statuses remain authoritative.
Keep `assets/agent-workflow.drawio`, its paired `assets/workflow.svg`, and `assets/map.json`
as the shipped reference and test fixture when installing or adopting a different diagram.
Copy and customize a separate source and manifest.

`update` changes only the assigned steps and fields. Repeat a status flag to mark several
steps, including several `--active` steps. Use `--reopen <step-id>` to return a step to
`upcoming`; step order never implies completion.

Planning (stages A-C) and Close wave (I) belong to the wave. Each slice keeps its own
delivery steps (D-H), activity, evidence, approvals, blockers, and map info, so several
slices can run at once. `--new-slice <slice-id>` adds a slice with fresh delivery steps and
archives nothing; `--slice <id[,id...]>` targets existing slices. Each opens a group: the
flags after it, up to the next group, update those slices. A comma list gives several slices
the same update; separate groups give them different values:

```sh
node <workflow-progress-skill>/scripts/progress.mjs update --run <run-id> \
  --slice slice-1,slice-2 --done cleanup.audit \
  --slice slice-1 --next "Prepare the demo" --slice slice-2 --next "Fix the audit finding"
```

Update a run from one process at a time, because parallel updates can overwrite each other;
use slice groups to change several slices in one call.

Before any group, flags update the wave activity and add wave notes, and slice-only flags go
to the most recently updated slice; they reject when no slice exists. In a call that adds a
slice they reject too, so place them after `--new-slice <slice-id>`. Planning and Close
wave status flags always update the wave, and run-level `--set` and `--append` fields
always update the run, wherever they appear. The last slice a call names becomes the most
recently updated slice. Older runs load automatically; delivery progress without a slice
becomes `slice-1`.

Use `--set <field=value>` for `repository`, `current-stage`, `planning-mode`, `last-gate`,
`next-action`, `human-decision`, `wave-plan`, `wave-approval-state`,
`wave-approval-reference`, `wave-approval-bounds`, `scope`, `slice-gates`, `activity`,
`slice-context`, `activity-next`, `slice.base-revision`, `slice.worktree`, `slice.checkpoint-hash`,
`slice.final-commit-hash`, `slice.state`, `slice.pr-and-target`, `slice.ci-and-review`,
`slice.human-presentation`, and `slice.completion`. `slice-gates` takes only `each-slice` or
`final-only`, the plan's `Slice gates` answer, and shows in the wave activity. Use
`--append <field=value>` for `planning-evidence`, `approved-amendment`, `approval`,
`slice.depends-on`, `slice.checks-review`, `slice.evidence`, `slice.approval`,
`slice.blocker`, `slice.recovery`, `slice.shipping-action`, `evidence.link`,
`evidence.deferred-finding`, `evidence.unresolved-blocker`, and `evidence.lesson`.
Structured approval rows use JSON, for example:
`--append approval='{"action":"local validation","approvedBounds":"one browser run","reference":"plan §Validation","state":"approved"}'`.
Remove resolved entries with `--resolve-slice-blocker <exact text>` or
`--resolve-unresolved-blocker <exact text>`. Each must match an existing item in its named
list; other blockers and evidence remain unchanged, and an unknown item rejects the update.
Approval and evidence values must come from their real source; never infer them from status.
An unknown step or slice ID, conflicting statuses, an unsupported field, or an invalid value
or record rejects the whole update before it writes. One call adds at most one note, tagged
with the slices of its group; notes keep the latest five distinct versions.

`--append attention=<text>` adds an item to the page's "Needs your attention" panel. Before
any group it belongs to the run; inside a group it is tagged with that group's slices. Start
the text with `login:`, `permission:`, `live-test:`, `question:`, or `other:` to set its
kind; any other text is kind `other`. Each item keeps its creation time, and the same text
with the same slices, in any order, is added once. `--resolve-attention <exact text>` resolves
it: before any group it removes matching run-level items; inside a group every slice in the
group must hold the text, and only those slices are untagged from each matching item. An item
is removed once no slice holds it; other slices keep it with its creation time. A missing item
rejects the update.

Add an attention item only when the user must act soon and you can keep working meanwhile:
credentials, a login, a permission, a live-test environment, a question that can wait, or a
waiting step that needs the user. Never use it for progress notes. A blocker stops the work,
so record it with `slice.blocker` or `evidence.unresolved-blocker` instead; a `blocked` status
alone adds no panel row. Resolve each item as soon as it is handled. Resolving a `permission`
item is not an approval; record approvals with `--append approval=` from their real source.

Run `render` to create a progress snapshot and a sibling `workflow-map.html` native viewer.
When something needs the user, the page starts with a "Needs your attention (N)" panel: run
and slice blockers first in red, then a pending human decision, then attention items with
their kind, slice, and creation time. A human decision is pending unless it is empty or
`None`; clear it with `--set human-decision=None`. Next come a slice table (stage chip,
working steps, next action, current activity), the wave activity, and one steps tab for the
wave and each slice. The map follows the selected tab. Until you click a tab, the page shows
the most recently updated slice; after a click, that tab stays selected across refreshes.
`serve` binds `0.0.0.0` on the first free port from 3100 to 3199 (override the start with
`--port`), prints its URL and `bound 0.0.0.0:<port>`, and refreshes progress every two seconds
while preserving scroll position, expanded sections, and the loaded native map. Start it in the
background, read the port from that output, and register it on the
[artifacts hub](../artifacts/SKILL.md#page-hub) as an app with `--port <port>` and
`--cmd '... serve --run <run-id> --port <port>'`, so Start brings back the same address.
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
