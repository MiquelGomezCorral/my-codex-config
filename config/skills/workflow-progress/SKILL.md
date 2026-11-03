---
name: workflow-progress
description: Keep an agentic-workflow run's progress page current on the artifacts hub. Use from `$workflow` at intake and at every dispatch, wait, result, correction, gate, blocker, attention item, resume, and close. Also focuses the native workflow map and replays a visual demo.
---

# Workflow progress

The user reads this page instead of asking what is happening. A page that lags sends them
back to asking, so update it at every event below, and read the script's reply each time.
It records progress and evidence; it never grants approval or proves completion.
For review JSON icons, use the [shared icon catalog](../artifacts/references/plan-page.md#icons).

## When to update

Run `scripts/progress.mjs` from this skill, from any folder, as
`node <workflow-progress-skill>/scripts/progress.mjs <command>`. Each update rewrites the hub
page, which shows it within a few seconds without a reload.

| Event | What to run |
| --- | --- |
| Intake | `init --run <run-id> --repository <repo>`, then, before your next tool call, write the page URL it prints last to the user |
| Dispatch | `update --run <run-id> --new-slice <slice-id> --active <step> --slice-context "<what it builds>"` for a new slice; else `--slice <slice-id> --active <step> --current "<who does what>" --next "<what follows>"` |
| Wait starts | `--slice <slice-id> --waiting <step> --current "Waiting for <what>" --next "<what follows>"` |
| Result | `--slice <slice-id> --done <step> --active <next step> --current "<outcome>" --note "<what the user should know>" --append slice.evidence=<where the proof is>`; a wave result (planning) uses no `--slice` and `--append planning-evidence=<where the proof is>` |
| Correction | `--slice <slice-id> --reopen <step>` or `--slice <slice-id> --active build-review.fix-recheck`, with `--current "Fixing <finding>"` |
| Gate | `--set human-decision="<decision> <page URL>"`, then `--set human-decision=None` after the answer; mark the gate's step `--done` (after `--slice <slice-id>` for a slice step); add `--append approval=<json>` only from the real approval |
| Blocker | `--slice <slice-id> --blocked <step> --append slice.blocker="<what blocks>"`; remove it with `--slice <slice-id> --resolve-slice-blocker "<exact text>"` |
| Attention item | `--append attention="login: <what the user must do>"`; resolve with `--resolve-attention "<exact text>"` |
| Resume | check real worker and Git state first, then `--slice <slice-id> --current "Resumed: <state>" --next "<what follows>"`, or the same without `--slice` for the wave |
| Close | `--done close-wave.<step>`, `--append evidence.lesson="<lesson>"`, `--note "Wave closed: <result>"` |

Flags before any `--slice` or `--new-slice` update the wave. Delivery steps, slice evidence, and
blockers belong to a slice: always name it with `--slice <slice-id>`, because without one they go to
the most recently updated slice, which may not be yours. Examples:

```sh
node <skill>/scripts/progress.mjs update --run <run-id> --new-slice slice-1 \
  --active build-review.implement --slice-context "Slice 1: login form"
node <skill>/scripts/progress.mjs update --run <run-id> --slice slice-1 \
  --done build-review.implement --waiting build-review.live-test \
  --current "Waiting for the live round" --next "Verify the findings"
node <skill>/scripts/progress.mjs update --run <run-id> --slice slice-1 \
  --append "attention=login: sign in to the staging account"
```

A coding supervisor updates only its own slice, every time with `--run <run-id> --slice <its
slice id>`: its steps, activity, next, notes, evidence, and blockers. The root keeps wave
fields, approvals, gates, attention items, and slice creation.

**Read the reply.** A good update prints what changed, then the run's current status and the
page URL. A rejected call exits non-zero, lists every problem found in its flags with the valid
values or the closest match, says `nothing was written`, and points to `progress.mjs help update`.
A problem found only while applying (a missing blocker text, conflicting statuses) stops at the first. Fix the call and run it again; never move on after a rejection.
`help update` lists every flag, `--set` and `--append` field, step ID, and two examples.
[Field and group details](references/fields.md) explain what each does.

## The page

`init` makes a hub page folder with `hub.py dir <run-id>-progress`, renders into it,
publishes it, and prints its address. Each successful `update` rewrites `index.html`, the
`content.html` fragment the page polls every two seconds, and `workflow-map.html`. The poll
keeps scroll, open sections, the selected tab, and the loaded map, and the page shows
"Updated N min ago", recomputed in the browser. Nothing restarts the hub: after a reboot, run
`hub.py ensure` (see the [page hub](../artifacts/SKILL.md#page-hub)); pages published within
the last seven days serve again, and `hub.py resume <id>` brings back older ones.
An older run with no hub page prints one line on `update` and `render` with the command that
publishes one: `publish --run <run-id>`.
`render --run <run-id> [--output <html-file>]` rewrites the page, or writes it to `--output`
with `content.html` and `workflow-map.html` in the same folder.

When something needs the user, the page starts with a "Needs your attention (N)" panel: run
and slice blockers first in red, then a pending human decision, then attention items. Next
come a slice table (stage chip, working steps, next action, current activity), the wave
activity with the stages that have active steps, and one steps tab per wave and slice. The
map follows the selected tab. Until you click a tab, the page shows the most recently updated
slice. The pages escape run content, sandbox the map without same-origin access, and load no
remote resources.

## Records

One JSON record per run lives under
`$(git rev-parse --path-format=absolute --git-common-dir)/agent-memory/workflow-runs/<run-id>/`,
shared by every worktree and never tracked. `init` takes that Git folder from `--repository`,
and from the current folder only when `--repository` is missing or not a Git path. It also
leaves a pointer to the repository under `${XDG_STATE_HOME:-$HOME/.local/state}/agentic-workflow/<run-id>/`.
Other commands look for the run in the current repository, then in the repository the pointer
names, then in the old location below, so they work from `$HOME` or the skill folder. Outside
any Git repository the record stays in the old location. `path --run <run-id>` prints the
record's location. A lock file beside the record serializes updates, so agents can update one
run at once.

Runs started under the old `~/.local/state` location stay loadable there: `render` works, and
`update` refuses with a message when you run it inside a repository. Copy such a run into that
repository with `migrate --run <run-id>`; it leaves the old copy in place. Delete the old copy
once nothing uses it.

## Demo

```sh
node <workflow-progress-skill>/scripts/demo.mjs --run workflow-demo-local --interval-ms 3000
```

The demo deletes and re-initializes only runs named `workflow-demo-<id>`, publishes the run's
hub page and prints its address, then replays a wave with three slices: planning, one slice
that finishes alone, two slices in parallel at different stages that later stand on the same
step, and the wave close. Along the way it opens and resolves a run login item, a run blocker,
a human decision, a slice-1 live-test item, and a slice-2 blocker, each for at least two
ticks, so the attention panel appears and then clears. Its notes record that no work,
approvals, or Git actions occurred; its one sample approval is marked simulated. Use a
disposable demo ID and open the printed address to watch the replay.

## Native map

The native map uses the editable draw.io source and explicit stable-ID bindings in
`assets/map.json`. Follow [map setup and updates](references/map-setup.md) to export and
inspect source changes, initialize a run with a map, and add persistent native metadata.
The map can provide visual context for active steps; checklist statuses remain authoritative.
Keep `assets/agent-workflow.drawio`, its paired `assets/workflow.svg`, and `assets/map.json`
as the shipped reference and test fixture when installing or adopting a different diagram.
Copy and customize a separate source and manifest.

Do not edit `assets/workflow.svg`; it is derived from `assets/agent-workflow.drawio`. Rebuild
and inspect after changing the source, then reconcile stable IDs and bindings before using
the map. Keep the canonical source and generated HTML out of run updates.

For a new run, initialize at intake. For an existing run, reconcile the legacy
[`progress.md` template](../workflow/templates/progress.md) against the plan and real
worker or Git state, then initialize and copy verified fields into the JSON record. Keep
the old template as a legacy reference; do not use it for routine updates.
