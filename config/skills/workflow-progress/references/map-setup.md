# Native workflow map

The editable source is `assets/agent-workflow.drawio`. The SVG beside it is generated with
draw.io Desktop; `assets/map.json` owns stable-ID bindings and native node metadata. The
workflow step catalog remains in `scripts/stages.mjs`. Keep source geometry, connector
directions, labels, and IDs authoritative. Do not edit the generated SVG or infer a connector
relationship from its appearance.

## Adopt or update a diagram

Use this lifecycle:

1. Draw anywhere and obtain an editable `.drawio` file.
2. Compare the recreated diagram with the supplied reference and correct it with the human.
3. Keep the shipped `agent-workflow.drawio`, `workflow.svg`, and `map.json` together as the
   default reference and test fixture. For a different diagram, copy its source and manifest
   to separate files, update the manifest's relative source and SVG paths, then export it with
   the installed draw.io Desktop version:

   ```sh
   node <workflow-progress-skill>/scripts/progress.mjs rebuild-map \
     --map <custom-map-directory>/map.json --drawio <draw.io-executable>
   ```

   On a headless machine, prefix the command with `xvfb-run -a`. The exporter path is a
   local argument; do not store a machine-specific executable path in the repository. Export
   with the embedded uncompressed model and transparent SVG settings; do not apply a layout
   or normalization pass. Default-map provenance stays with the pinned viewer; a custom map
   writes `build-provenance.json` beside its configuration. Both record exporter version and
   relative source/SVG hashes, not the executable path. A failed rebuild keeps the prior SVG.
   Do not replace the shipped reference files when adopting a custom graph.
4. Inspect the exported IDs, labels, authored connector terminals, bindings, and warnings:

   ```sh
   node <workflow-progress-skill>/scripts/progress.mjs inspect-map \
     --map <workflow-progress-skill>/assets/map.json --output <inspection.html>
   ```

   Open the offline report in a browser. Its inventory is exposed as
   `window.workflowMapInventory` for review. Confirm missing terminals and non-selectable
   connector endpoints with the human; the adapter keeps those connectors visible but does
   not guess relationships.
5. Review the source comparison and IDs, then assign the smallest useful anchor or anchor
   list to every workflow step. Stable IDs identify map cells; they never merge the checklist
   statuses of separate steps. Add supported node descriptions while planning when they
   improve context.
6. Initialize or update a run with the CLI. Rebuild and inspect after source edits. Adopt a
   revised manifest into an existing run with:

   ```sh
   node <workflow-progress-skill>/scripts/progress.mjs update --run <run-id> \
     --map <workflow-progress-skill>/assets/map.json
   ```

   Adoption preserves run history and deliberate metadata overrides; if an override refers
   to an ID missing from the new manifest, the update fails without changing the run.

AI recreation may miss details or require correction; it is not deterministic. Use the
requested Claude Sonnet 5.5 browser/free-tier conversion route when it is available on your
account and within its current usage limits. No request is guaranteed to be free, and the
source diagram is not uploaded automatically. The exact prompt is:

```text
do you know this page? https://app.diagrams.net/

can you recreate on it (give me a .drawio file that is readible by that page) a copy of this diagram? <paste image of your diagram>. Do it as acurate as possible! each detail, text, style, arrows, nodes... ALL
```

## Map configuration

`assets/map.json` has a version, relative source and SVG paths, one `steps` object, optional
`focusBoxes` membership, and optional `nodes` metadata. Every current step ID from
`scripts/stages.mjs` needs one or more anchors. A step may anchor a complete subflow, including
review alternatives; an explicit run or slice override replaces that full list. Repeated
anchors between steps are allowed. `nodes` metadata uses native categories `frontend`,
`backend`, `database`, `cloud`, `security`, `messagebus`, or `external`, and optional
`description`, `context`, and `tag` text. Descriptions, context, and tags are plain text, up to
500 characters. Native selectability and one-hop relationships come from `nodes` keys and
every step anchor. Register meaningful extra cells, including real artifact and reviewer
chips; headings, notes, enclosures, and ellipsis placeholders stay static.

The viewer colors a node by its `kind`, so the shipped map gives each source-legend color
family one `kind` and registers the legend chips (`c9` to `c17`) with that same `kind`, which
explains every color:

| Legend role (dashed variant shares the color) | `kind` | Viewer color |
| --- | --- | --- |
| Super-agent, Sub orchestrator | `frontend` | cyan |
| Agent worker | `database` | violet |
| Intermediate artifact, Optional mid-artifact | `cloud` | amber |
| Main flow output | `backend` | green |
| Human decision | `messagebus` | orange |
| Decision (human and agent) | `security` | rose |
| Incoming work (no legend chip) | `external` | slate |

Keep a new node's `kind` in step with the fill color of its draw.io cell.

`focusBoxes` maps a non-selectable enclosing cell ID to its real selectable members. Use it
when the draw.io cells are flat siblings and model parentage cannot identify the box contents.
The viewer applies native focus emphasis once to the outer configured box in a nested chain; it
keeps separate and partially overlapping boxes emphasized. It never registers boxes as nodes.
Automatic progress focus excludes unselected connector neighbors from its frame, so long return
arrows do not pull the camera away from the active steps. The embedded frame waits until most of it is on screen before it frames the active nodes,
because a frame below the fold gets no animation frames. Automatic progress focus hides Semantic
Passport. Clicking or keyboard-activating the focused node or label opens the native details
panel. Unchanged progress polls preserve manual map exploration, and clearing focus removes box
emphasis. Use the demo replay to inspect lower review, cleanup, presentation, conflict, and CI
steps in the browser; check both selected nodes and frame visibility. Unsupported connector
warnings remain warnings, and this does not validate every custom diagram automatically.

Initialization copies the selected configuration and its directory into run state. Existing
runs keep that snapshot until `update --map` explicitly adopts a revised manifest. Adoption
preserves run identity, statuses, history, notes, approvals, evidence, and compatible
overrides; incompatible saved overrides are rejected without changing the run. Reconcile any
override that refers to a missing ID before retrying; IDs are never silently remapped.

Initialize a run with the default configuration or an explicit map file:

```sh
node <workflow-progress-skill>/scripts/progress.mjs init --run <run-id> --map <configuration.json>
```

Run-info JSON can partially update configured nodes and steps:

```json
{
  "nodes": {
    "c48": { "description": "Implement the approved slice", "context": "Worker-owned scope" }
  },
  "steps": {
    "build-review.implement": { "anchors": ["c46"], "description": "Small-slice supervision" }
  }
}
```

Apply it with `update --run <run-id> --map-info <run-info.json>`. The example's
`build-review.implement` entry is delivery-step metadata, so a current slice must exist first;
start one with `--new-slice <slice-id>` if needed. Omitted fields keep their saved values; an
empty string clears optional text. The CLI rejects unknown fields, workflow steps, and node IDs
outside the run's map snapshot before saving. It does not validate bindings against the SVG:
`inspect-map` and the browser report missing source/rendered cells and unsupported connector
terminals as compatibility warnings. Node metadata and planning and Close wave step metadata
live at run level. Delivery-step metadata belongs to the targeted slice (`--slice`, or the
most recently updated slice), stays with it, and does not carry forward to new slices. New
runs do not inherit another run's metadata. Legacy runs without map fields use the installed
default map.

`render` creates `progress.html` and a sibling `workflow-map.html`. `serve` exposes the map
through the same server and keeps its native frame loaded while progress refreshes.
The host opens the map in the native presentation viewport. Both viewers start with the native
dark theme; the theme control remains available. The frame is sandboxed and isolated from the
host page. Native selection, arrows, Passport, and Route Probe
Journey provide exploration; the CLI checklist remains the source of status.
