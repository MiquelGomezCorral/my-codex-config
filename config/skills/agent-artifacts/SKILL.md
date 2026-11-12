---
name: agent-artifacts
description: Present work to the user as a local HTML page filled from a JSON template instead of a long chat answer - findings reports, decision sheets, option comparisons, explainers, and short slide decks. Use when results, choices, or explanations are easier to review as a page, or when the user asks for a page, summary app, report, or deck. Also the one way to serve a page or list a running app for the user; never start a server of your own.
---

# Artifacts

One page engine, `page.html`, draws every artifact from a JSON block at the top of the
file. Pick a template, fill its JSON, and run `fill.py`. Never write or edit the CSS or
JavaScript for a single artifact.

## Plain first, then technical

Everything a page shows the user leads with a plain title and an easy description, in words
a newcomer follows. When the layout allows, a more technical but still understandable layer
follows it: a card's `inset`, a decision's `technical`, a finding's fields, an `inset`
block, a plan page's `technical`. Never open with mechanics or terms the reader must
already know.

## When a page earns its place

The human-facing agent filters what reaches the user and in what form. Workers return
findings and artifacts to it; they do not present to the user directly.

- **Use a page** for important, dense content: several findings with evidence, options
  the user must choose between, research that changes the plan, or a flow a diagram
  explains better than prose.
- **Stay in chat** when the content fits in a few short lines, has one obvious answer, or
  needs only a yes or no.

`$workflow` is the exception: it requires a page at each human gate (discovery, plan,
result), so this filter does not apply there.

## Templates

| Template | Use for |
| --- | --- |
| `templates/report.json` | Findings from tests, audits, or reviews, with live evidence |
| `templates/results.json` | Experiment, benchmark, or training results: run grid, plots, GIFs; without the run sections it is a gallery page |
| `templates/decisions.json` | Questions the user must answer, with saved picks and "Copy my decisions" |
| `templates/comparison.json` | Two to four approaches side by side, with a recommendation |
| `templates/explainer.json` | How a system or concept works: TL;DR, flow, FAQ, glossary |
| `templates/slides.json` | A short deck; arrow keys or space move between sections |
| `templates/plan-review.json` | A plan review brief; render it with `scripts/render-plan.mjs` ([plan page](references/plan-page.md)) |

Before you fill a template, read the pick table and its entry in
[references/templates.md](references/templates.md): the blocks that fit each part, a minimal
example, and the usual mistakes.

Templates are starting shapes, not limits. Any section can use any block, so a report can
end with a decisions block, and an explainer can include a comparison.

## Steps

`<skill>` is this skill's directory. Run every command from the project you work in, not from
`<skill>`: `hub.py` takes the repo and the worktree from the current directory.

1. Get the page folder: `python3 <skill>/scripts/hub.py dir <name>`, with a short lowercase
   `<name>` such as `dqn-results`. It prints `<dir>`. Copy the closest `<skill>/templates/`
   file to `<dir>/data.json`.
2. Replace every example value with real content. Delete blocks and sections you do not
   need; never leave example text or empty sections.
3. Render it: `python3 <skill>/scripts/fill.py <dir>/data.json <dir>/index.html`
4. Publish it:
   `python3 <skill>/scripts/hub.py publish <dir> --title "<plain title>" --desc "<one plain line>" --by "<harness> · <model>"`.
   The first word of `--by` (`claude`, `codex`, `pi`, `agy`) picks the mark on the index. It
   prints the page's LAN URL, then a local one: give the user the LAN URL. To change the page,
   edit `data.json` and run steps 3 and 4 again; the address stays. Never start a server of your
   own for a page.

## Page hub

One small server, the hub, lists every page and app agents show the user. It listens on port
3200 on every network interface (`0.0.0.0`) and starts itself the first time `publish` or `app`
needs it. The user opens `http://<lan-ip>:3200/` to see everything, and can Stop a page, Serve
it again, or Delete it there. Anyone on the local network can press those buttons, and every
file in a page folder and every app command is readable there, so keep secrets out of page
folders, app commands, and descriptions. The hub answers only by IP address, `localhost:3200` or
`127.0.0.1:3200`, this machine's host name or its Tailscale name: any other name or a forwarded port gets 403.

A page keeps its address: `http://<lan-ip>:3200/<repo>/<page>/`. A page made in a worktree adds
the worktree's folder name: `<repo>/<worktree>/<page>/`. Outside any Git repo the address is
`_local/<page>/`. A name that another worktree already uses gets `-2`, so check the address
`publish` prints.

`hub.py` below is `python3 <skill>/scripts/hub.py`.

**Apps.** An app, such as a dev server, keeps its own port; the hub only
links to it. Make it listen on `0.0.0.0` (or pass `--url`), start it in the background and keep
its pid, then register it with the same command:

```
nohup sh -c '<command>' > <log> 2>&1 &
python3 <skill>/scripts/hub.py app <name> --port <port> --pid $! --cmd '<command>' --desc "<one plain line>" --by "<harness> · <model>"
```

The hub keeps the command and the folder you ran `app` from (or `--cwd`), and runs the command
again with `/bin/sh` when the user presses Start. It gets the hub's environment, not your
shell's, so the command must run in the foreground, set its own variables or activate its venv
itself, and use plain `sh` syntax: no `source`, use `. file` or `bash -c '...'`.

**Ports.** Before you start a server, run `orca ports --all --json` and pick a port nothing listens on.
If the current folder is not inside an Orca worktree, add `--worktree path:<a managed checkout>`;
otherwise the command fails with `selector_not_found`. The scan is a snapshot and reserves nothing, so
another agent can take the port after you look. Never stop a process you did not start: contact its
Orca terminal or your coordinator instead.

**Cleanup.** When you replace a page or an app, stop or delete the old one so the index stays
short. `hub.py list` shows the ids (`<repo>/<page>` or `<repo>/<worktree>/<page>`). `stop <id>`
keeps the files and `resume <id>` serves the page again at the same address; `delete <id> --yes`
removes the folder. `stop` and `delete` also take `--repo R`. When the hub starts, it stops every
page nobody opened or published in the last 7 days; the files stay, and Serve or `resume <id>`
brings it back. Leave pages and apps you did not make alone unless the user asks. `hub.py --help`
lists the rest.

## Revising a page

Get the folder again with `hub.py dir <same name>` from the same worktree, render to the same
output path, and publish again (step 4). `fill.py` treats the page already there as the version
the user last saw: its data becomes `previous` and `version` goes up by one. The page then shows
a collapsible "Changed since v<N>" list with the added, changed, and removed entries, a badge on
each changed block or item (changed collapsible rows open), and two toggles above the list:
"Highlight changes", which the reader can turn off to see that version as a new page, and "Show
only changes" (decks get only the first). The browser remembers turning highlights off for that
version only, so the next revision shows its own changes.
The engine finds the changes; never mark them yourself, and never write `version` or `previous`
in `data.json`.

Pass `--keep-baseline` to fix a page before the user has seen it. The version and baseline
stay as they were, so the page still compares against what the user last saw.

Sections match by `id`, else title; blocks by position inside their section; items by `id`,
else title or name, else their own text; gallery items by `src`, else their `mermaid` text (moving one to another group reads as changed), matrix rows
by group title and label. Give a gallery item an optional `id` to keep its identity when its `src` or
`mermaid` text changes: an edited diagram then reads as changed, not as added plus removed. A removed item is listed by title only.

Write the text with the `writing` skill. Keep quotes verbatim and claims backed by what
was actually observed.

## Page format

Read [references/page-format.md](references/page-format.md) when you fill or change a page's data blocks, or touch printing, downloads or export.

## Diagrams and illustrations

A `figure` shows any diagram, chart, sketch, mockup, or screenshot. The `figures` skill picks
the tool and makes the file; this section holds what the page does with it.

- **A file next to the page.** SVG, PNG, JPEG, WebP, and GIF files show as images; an `.html`
  file runs in a sandboxed frame, and the page adds `?theme=light` or `?theme=dark` to its
  address so a graph can follow the page theme; an `.mp4` or `.webm` file plays with controls.
  The kind comes from the path before any `?query` or `#hash`.
- **Click a figure to open it.** The page's own viewer fits it to the screen; the wheel, a pinch,
  `+`/`-` or the zoom buttons go up to 20x, a drag moves it, `0` or a double-click fits it again,
  and the arrows step through the gallery the figure sits in. A `.html` plot opens from the
  maximize button over its corner and keeps its own hover and zoom; a video keeps its player and
  never opens the viewer. Only the media opens it, never the caption or a link. Inside a full-screen
  plot, Esc works only before you click the plot; after that, close with the button or a click
  outside it.
- **`mermaid` instead of `src`.** Mermaid text is drawn on the page with the Pele engine, in the
  page's colours, and follows the light and dark toggle without a reload. It has no file, and it
  works anywhere a figure does: galleries, split sections, rows, insets, decks, and the viewer,
  where it zooms and keeps its colours. A text Pele cannot draw, empty text included, shows its
  error in place and leaves the page working. The engine comes from the `figures` skill, which
  must be installed beside `agent-artifacts` (the bootstraps install every skill together). `fill.py`
  inlines it (about 0.7 MB) only into a page that has a `mermaid` figure and stops with a message
  when that skill is missing. Check the text with the `figures` skill before filling.
- **`dark` beside `src`.** An image for the dark theme: the page shows one of the two, following
  the toggle, and the viewer opens the shown one and swaps it if the theme changes while it is
  open. The hidden one loads only when needed.
- **Other kinds.** A short linear flow is a `steps` block; a tiny one-off drawing is inline SVG in
  an `html` block.

Give every figure a caption that states its takeaway. A diagram explains; it is not evidence
that the behavior it shows exists. Open the page and check that labels fit and nothing is
clipped at desktop and phone widths; for the phone view use `--width 390` (see
[Live evidence](#live-evidence)).

## Live evidence

`scripts/capture.mjs` records a running page with headless Chrome and ffmpeg (Node 22, nothing
to install):

```
node <skill>/scripts/capture.mjs <url> --screenshot <file.png> [--width <px>]
node <skill>/scripts/capture.mjs <url> --video <file.webm> [--seconds <n>] [--width <px>]
node <skill>/scripts/capture.mjs <url> --pdf <file.pdf>
```

Add `--theme light|dark` to any of them to set the page's colour scheme (a fresh browser has no
saved choice, so this decides). `--pdf` opens every row, loads every frame, waits for the graphs to
draw, and prints on the sheet the page's own `@page` asks for (A4's shape, larger than A4); `--width` is ignored with `--pdf`
(it warns on stderr).

For a screenshot or video, `--width` sets the width the page lays out at, 1280 by default, and the shot is 720 px tall.
`--width 390` is the phone check. Chrome's own `--window-size=390,...` is not: it still lays the
page out at 500 px, so an overflow between 390 and 500 px stays hidden.

`--seconds` defaults to 5. Chrome sends a video frame only when the page repaints, so a still
page gives one frame for the whole length; record pages that animate or load. Save the files
next to the page and point a `figure` at them. `templates/report.json` has a "Live evidence"
section for them; see its entry in the [template guide](references/templates.md#reportjson).

## Linting the pages

`ui-policy.json` is `hub.html`'s policy, and it covers `hub.html` only: `page.html` has its own
type scale and fails it by design. The file is therefore named `hub-ui-policy.json`, so a
`lintapple` run from this folder on an artifact page does not load it. Lint the hub with
`lintapple <hub url> --config hub-ui-policy.json` from this folder, and an artifact page
from any other folder.

## Changing the engine

Add a block type to `page.html` only when a recurring need has no block, then document it
in the table above. A one-off need uses the `html` block.
