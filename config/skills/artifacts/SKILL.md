---
name: artifacts
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

**Apps.** An app, such as a dev server or a progress page, keeps its own port; the hub only
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

**Ports.** Before you start a server, run `orca ports --all` (or open the Ports section of the hub) and
pick a port nothing listens on. The scan is a snapshot and reserves nothing, so another agent can take
the port after you look. Never stop a process you did not start: contact its Orca terminal or your
coordinator instead.

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

## Data shape

Top level: `title`, optional `eyebrow` (small line above the title), `subtitle`,
`layout` (`"slides"` for a deck), `refresh` (seconds, 10 to 86400: the page reloads itself unless
the reader is using it), `statuses`, and `sections`. Each section has a `title`,
an optional `id` for links to it and `intro`, a list of `blocks`, and optional
`layout: "split"`, which puts its figures and any block with `side: true` on the right and
the other blocks on the left. A split section in a deck is a diagram slide. Outside a deck, every
section folds and unfolds on its heading; `collapsed: true` starts it folded, unless it changed
since the version the reader saw. Links to it unfold it. With two or more sections, "Collapse all" and
"Expand all" buttons in the sticky bar at the top fold or unfold every section at once. With three or more
sections (not in a deck), a Contents button at the top left opens a side index of the sections and
their block headings; it starts closed, and a link in it unfolds the section before the jump. The
same outline also appears as a contents list under the subtitle, with a reading time per section.
A sticky bar at the top holds the Contents button, the fold buttons and the export buttons.

Every text field accepts `` `code` ``, `**bold**`, `*italic*`, `<u>underline</u>`,
`[link](url)`, and blank lines between paragraphs. In fields that hold paragraphs (text blocks, callouts, card `text` and `inset`, details rows, finding fields, compare summaries, decision descriptions), lines starting `- `, `* `, `1. ` or `1) ` become a bulleted or numbered list, nested by indenting; a numbered list starts at the number written. Any block can take a `heading` that is shown above it, and, on a top-level block, listed under its section in the Contents index. A `tone`
is one of `ok`, `bad`, `warn`, `info`, or `muted`.

| Block `type` | Fields |
| --- | --- |
| `text` | `text` |
| `callout` | `title`, `text`, `tone` |
| `list` | `items` (strings, or `text` plus nested `items` and `ordered`), `ordered` |
| `stats` | `items` (`value`, `label`, `tone`); `auto: true` adds counts of finding statuses |
| `cards` | `items` (`title`, `text`, optional `status`, `icon`, and `inset`, a second explanation shown in a neutral inset). A `status` is a chip under the title: a word or two, since a label over 24 characters gets hover text, and the chip is cut with an ellipsis at 16em |
| `table` | `columns`, `rows` (arrays of cells; a cell is a string, or a chip: `{ text, tone, icon, title }`), `select` (adds a tick box per row; rows start ticked) |
| `matrix` | `columns` (strings, or `name` plus `note`), `groups` (`title`, `rows` of `label`, `note`, and `cells`, one list of chips per column, where a single chip or a string also works; a chip is `text`, `tone`, `icon`, and `title` for text shown on hover, focus or tap), `legend` (a line of text, or a list of chips and text that explain them). Chips stack one per line |
| `steps` | `items` (`title`, `text`, optional `icon`): A then B, numbered by the page, as a row when every `text` is 80 characters or less and the width allows, else as a vertical rail; `ordered: false` for parts of one change that ship together, as rows in one panel |
| `details` | `items` (`title`, `text`, optional `blocks`, `open`, `icon`, `preview`, a short line under the title) as collapsible rows |
| `inset` | `blocks` drawn inside a neutral inset |
| `findings` | `items` (`id`, `title`, `status`, `fields` of `label`/`text`, `quotes` of `text`/`source`, `open`) |
| `compare` | `options` (`name`, `summary`, `pros`, `cons`), `criteria` (`name`, `values` per option), `recommended` |
| `decisions` | `items` (`id`, `title`, `description`, `question`, `options`, `recommended`, `why`, optional `technical`; older items with only `question` and `context` still render) |
| `code` | `text` |
| `figure` | `src` (a file next to the page: image, `.html`, or `.mp4`/`.webm` video) or `mermaid` (Mermaid text, drawn on the page; no file), `dark` (an image shown instead of `src` in the dark theme), `caption`, `alt`, `source` (editable file or URL), `height` for HTML, optional `details` (`title`, `text`, `code`: a closed fold-out under the caption, as in a gallery item) |
| `gallery` | `items` (`src` or `mermaid`, `dark`, `caption`, `alt`: images, GIFs, videos, Mermaid diagrams, or `.html` plots with a `height`; each figure's media opens in the page's viewer (a plot from its maximize button; a video keeps its player); optional `details` (`title`, `text`, `code`) folds out under the caption, closed, with `code` as monospace lines that scroll inside the card) or `groups` (`title`, optional `note`, `items`: one titled row with a divider line per method or experiment), `width` (card width in px, default 320; cards keep it and never stretch, so it sets how many share a row on a full-width page: up to 334 for 3, 335 to 508 for 2, more for 1; phones show 1), `pixelated` (crisp upscaled pixel art) |
| `html` | `html`, only for a hand-drawn SVG or markup no other block covers |

An `icon` is a key of `icons.json`, the skill's Lucide catalog of 100 icons, and draws on cards, steps, details rows, and
chips; pick one by meaning from the [template guide](references/templates.md#icons-never-emoji). An unknown name draws
nothing, and `fill.py` warns about it. Never use emoji on a page: use an icon, and add a missing one as the
[template guide](references/templates.md#icons-never-emoji) says.

`statuses` maps each finding `status` key to a `label` and a `tone`. Without it, the keys
are `ok`, `bad`, `decide`, and `info`.

**Keep chips short.** A chip is a status label, not a sentence: card `status`, table cells,
and matrix chips hold a word or two ("Official", "Fail, seed 3"). Put the detail in the
card's `text` or `inset`, or in the chip's `title`, which shows on hover, focus and tap. A
card status over 24 characters gets its full text as hover text by itself, and the chip is cut
with an ellipsis at 16em (about 26 ordinary characters, fewer capitals); table and matrix chips are not cut, so a long one stretches its column and the table scrolls.

Use `select: true` when the user picks which rows to keep, such as a cleanup plan. Decision
picks, notes, and ticked rows are saved in the viewer's browser. They reach the agent only
when the user presses **Copy my decisions**, shown at the end of every section that holds a
`decisions` block or a `select` table, even inside `details`, and pastes the text back.
Copied rows list every cell, so keep rows distinct.

Every page follows the system light or dark theme. The button at the bottom right switches
it, and the viewer's browser keeps that choice for every artifact.

The page prints in the theme on screen, with folded sections and rows opened, the page controls
hidden, and galleries and split sections as on a desktop window. Paper is the desktop layout (1060px) on a sheet
the page sizes itself with `@page`, A4's shape but larger than A4: choose "fit to page" in the print dialog to get A4,
where text is about 7.5 pt.
Paper shows the contents list under the subtitle, open in full, and neither the side index nor the top bar. A deck prints every slide, one per page. A graph
in a frame can print empty from Ctrl+P, and on a narrow window Ctrl+P prints graphs stretched; for a PDF with every
graph, use "Export PDF" below, or `capture.mjs --pdf` (see [Live evidence](#live-evidence)).

## Exporting a page

Every page has four buttons at the right of its sticky bar at the top, apart from the section index:

- **Export PDF** prepares the page, then opens the print dialog: light theme, every section and row
  open, every graph and Mermaid diagram loaded and drawn at the desktop layout width, the same sheet as Ctrl+P. Afterwards the page goes back as it was.
- **Export Markdown** downloads `<title-slug>.md` with the whole page as text. Image and graph
  paths stay as the page writes them, a Mermaid figure becomes a ```` ```mermaid ```` fence (GitHub draws it) with its caption below, and each row is a foldable `<details>`.
- **Export zip** downloads `<title-slug>.zip`: that `.md`, every file the page shows (figure and
  gallery `src`, `dark` and `source`, with their relative paths) and `data.json`. A file that cannot be
  fetched is left out and the page says how many. A framed `.html` figure's own files are not
  collected, so a plot that must travel in the zip or open from disk should be self-contained
  (Plotly: `include_plotlyjs=True`).
- **Copy Markdown** copies a plain version for a chat: no paths, no HTML, each figure one
  `[figure: caption]` line, each row a bold title over a quote.

The Markdown includes the reader's saved decision picks and notes. The converter lives in
`page.html`, so a page gets the buttons when it is rendered again. For the same text without a
browser and without the reader's saved picks, run `python3 <skill>/scripts/fill.py --markdown <dir>/data.json <out.md>` (needs Node).
[How each block becomes Markdown](references/templates.md#markdown-export).


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
  must be installed beside `artifacts` (the bootstraps install every skill together). `fill.py`
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
