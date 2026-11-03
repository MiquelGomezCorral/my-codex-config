# Update flags, fields, and slice groups

`progress.mjs help update` lists every flag, `--set` field, `--append` field, and step ID,
read from the same tables the parser uses. This page explains what they do.

## Steps and slices

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

Before any group, flags update the wave activity and add wave notes, and slice-only flags go
to the most recently updated slice; they reject when no slice exists. In a call that adds a
slice they reject too, so place them after `--new-slice <slice-id>`. Planning and Close
wave status flags always update the wave, and run-level `--set` and `--append` fields
always update the run, wherever they appear. The last slice a call names becomes the most
recently updated slice. Older runs load automatically; delivery progress without a slice
becomes `slice-1`.

## Fields

`--set <field=value>` writes one field; `--append <field=value>` adds one entry to a list.
`slice-gates` takes only `each-slice` or `final-only`, the plan's `Slice gates` answer, and
shows in the wave activity. The stage the page shows comes from the active steps, so
`--set current-stage=` and `--set last-gate=` are rejected: mark steps with `--active`,
`--waiting`, or `--done` instead.

Structured approval rows use JSON, for example:
`--append approval='{"action":"local validation","approvedBounds":"one browser run","reference":"plan §Validation","state":"approved"}'`.
Approval and evidence values must come from their real source; never infer them from status.

Remove resolved entries with `--resolve-slice-blocker <exact text>` or
`--resolve-unresolved-blocker <exact text>`. Each must match an existing item in its named
list; other blockers and evidence remain unchanged, and an unknown item rejects the update.

An unknown flag, field, step ID, or slice ID, a missing value, conflicting statuses, or an
invalid value or record rejects the whole update before it writes. One call adds at most one
note, tagged with the slices of its group; notes keep the latest five distinct versions.

## Human decision

A human decision is pending unless the field is empty or `None`. Set it with
`--set human-decision=<what to decide> <page URL>` and clear it with
`--set human-decision=None`.

## Attention items

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
