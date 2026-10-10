---
name: artifacts
description: Present work to the user as a local HTML page filled from a JSON template instead of a long chat answer - findings reports, decision sheets, option comparisons, explainers, and short slide decks. Use when results, choices, or explanations are easier to review as a page, or when the user asks for a page, summary app, report, or deck.
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
| `templates/results.json` | Experiment, benchmark, or training results: run grid, plots, GIFs |
| `templates/decisions.json` | Questions the user must answer, with saved picks and "Copy my decisions" |
| `templates/comparison.json` | Two to four approaches side by side, with a recommendation |
| `templates/explainer.json` | How a system or concept works: TL;DR, flow, FAQ, glossary |
| `templates/slides.json` | A short deck; arrow keys or space move between sections |
| `templates/plan-review.json` | A plan review brief; render it with `scripts/render-plan.mjs` ([plan page](references/plan-page.md)) |

Before you fill a template, read its entry in [references/templates.md](references/templates.md):
when to pick it over the others, the blocks that fit each part, a minimal example, and the
usual mistakes.

Templates are starting shapes, not limits. Any section can use any block, so a report can
end with a decisions block, and an explainer can include a comparison.

## Steps

1. Copy the closest template to `<dir>/data.json`, where `<dir>` is
   `agent-memory/artifacts/<name>/` in the Git common directory, so the page survives
   reboots and other worktrees can reach it. Never use a temporary directory.
2. Replace every example value with real content. Delete blocks and sections you do not
   need; never leave example text or empty sections.
3. Render it from this skill's directory:
   `python3 scripts/fill.py <dir>/data.json <dir>/index.html`
4. Serve `<dir>` detached, so the server outlives the shell that started it:
   `setsid python3 "$HOME/.agents/skills/workflow/scripts/serve-artifact.py" --directory <dir> > <dir>/.serve.log 2>&1 < /dev/null &`
   (or the harness's background task). It picks a free port in 3100-3199 and prints the LAN
   URL, `http://<ip>:<port>/`. Wait until `<dir>/.serve.log` has its lines (the first can take
   a few seconds), read the LAN URL from it, and give it to the user. To change the page,
   edit `data.json` and run step 3 again.

## Revising a page

Render a revised page to the same output path. `fill.py` treats the page already there as
the version the user last saw: its data becomes `previous` and `version` goes up by one. The
page then shows a collapsible "Changed since v<N>" list with the added, changed, and removed
entries, a badge on each changed block or item (changed collapsible rows open), and a "Show
only changes" toggle. The engine finds the
changes; never mark them yourself, and never write `version` or `previous` in `data.json`.

Pass `--keep-baseline` to fix a page before the user has seen it. The version and baseline
stay as they were, so the page still compares against what the user last saw.

Sections match by `id`, else title; blocks by position inside their section; items by `id`,
else title or name, else their own text; gallery items by `src`, matrix rows by group title and
label. A removed item is listed by title only.

Write the text with the `writing` skill. Keep quotes verbatim and claims backed by what
was actually observed.

## Data shape

Top level: `title`, optional `eyebrow` (small line above the title), `subtitle`,
`layout` (`"slides"` for a deck), `refresh` (seconds, 10 to 86400: the page reloads itself, for a
page rewritten during a long run; a reload waits while the reader has opened a row, "Show only changes" is on, or a
note field has focus), `statuses`, and `sections`. Each section has a `title`,
an optional `id` for the navigation links and `intro`, a list of `blocks`, and optional
`layout: "split"`, which puts its figures and any block with `side: true` on the right and
the other blocks on the left. A split section in a deck is a diagram slide.

Every text field accepts `` `code` ``, `**bold**`, `*italic*`, `<u>underline</u>`,
`[link](url)`, and blank lines between paragraphs. Any block can take a `heading` that is shown above it. A `tone`
is one of `ok`, `bad`, `warn`, `info`, or `muted`.

| Block `type` | Fields |
| --- | --- |
| `text` | `text` |
| `callout` | `title`, `text`, `tone` |
| `list` | `items` (strings, or `text` plus nested `items` and `ordered`), `ordered` |
| `stats` | `items` (`value`, `label`, `tone`); `auto: true` adds counts of finding statuses |
| `cards` | `items` (`title`, `text`, optional `status`, `icon`, and `inset`, a second explanation shown in a neutral inset) |
| `table` | `columns`, `rows` (arrays of cells; a cell is a string, or `{ text, tone }` for a status chip), `select` (adds a tick box per row; rows start ticked) |
| `matrix` | `columns` (strings, or `name` plus `note`), `groups` (`title`, `rows` of `label`, `note`, and `cells`, one list of chips per column, where a single chip or a string also works; a chip is `text`, `tone`, and `title` for hover text), `legend`. Chips stack one per line |
| `steps` | `items` (`title`, `text`, optional `icon`) drawn as a left-to-right flow |
| `details` | `items` (`title`, `text`, optional `blocks`, `open`, `icon`, `preview`, a short line under the title) as collapsible rows |
| `inset` | `blocks` drawn inside a neutral inset |
| `findings` | `items` (`id`, `title`, `status`, `fields` of `label`/`text`, `quotes` of `text`/`source`, `open`) |
| `compare` | `options` (`name`, `summary`, `pros`, `cons`), `criteria` (`name`, `values` per option), `recommended` |
| `decisions` | `items` (`id`, `title`, `description`, `question`, `options`, `recommended`, `why`, optional `technical` in an inset; older items with `context` still render) |
| `code` | `text` |
| `figure` | `src` (a file next to the page: image, `.html`, or `.mp4`/`.webm` video), `caption`, `alt`, `source` (editable file or URL), `height` for HTML |
| `gallery` | `items` (`src`, `caption`, `alt`: images, GIFs, videos; each opens full size), `width` (thumbnail px, default 320), `pixelated` (crisp upscaled pixel art) |
| `html` | `html`, only for a hand-drawn SVG or markup no other block covers |

An `icon` is a key of `icons.json`, the skill's Lucide catalog; an unknown name draws nothing.

`statuses` maps each finding `status` key to a `label` and a `tone`. Without it, the keys
are `ok`, `bad`, `decide`, and `info`.

Use `select: true` when the user picks which rows to keep, such as a cleanup plan. Decision
picks, notes, and ticked rows are saved in the viewer's browser. They reach the agent only
when the user presses **Copy my decisions**, shown at the end of every section that holds a
`decisions` block or a `select` table, even inside `details`, and pastes the text back.
Copied rows list every cell, so keep rows distinct.

Every page follows the system light or dark theme. The button at the bottom right switches
it, and the viewer's browser keeps that choice for every artifact.

## Diagrams and illustrations

A `figure` shows any diagram, chart, sketch, mockup, or screenshot saved next to the page.
SVG, PNG, JPEG, WebP, and GIF files show as images; an `.html` file runs in a sandboxed
frame; an `.mp4` or `.webm` file plays with controls. Make the file with the skill that fits,
then point `src` at it:

| Need | Make it with | Put in `src` / `source` |
| --- | --- | --- |
| Architecture, flowchart, sequence, state, ER, timeline, or chart | `diagram-design` | its SVG export (`scripts/export_svg.py`); its HTML pages do not shrink to fit |
| Whiteboard-style sketch the user may keep editing | `excalidraw` | the preview SVG; the `.excalidraw` file or web link as `source` |
| Clean or free-form drawing no template covers: wireframe, slides, illustration, icon-rich visual | `excalidraw-draw` | its rendered PNG; the `.excalidraw` file as `source` |
| Plot from Python (plotly, bokeh, altair) | its HTML export (self-contained when the library has that option) | the HTML file, with a `height`; a saved PNG goes in as an image |
| UI mockup or clickable prototype | a small standalone HTML file | the HTML file, with a `height` |
| A short linear flow | no file: use a `steps` block | - |
| A tiny one-off drawing | inline SVG in an `html` block | - |

Give every figure a caption that states its takeaway. A diagram explains; it is not evidence
that the behavior it shows exists. Open the page and check that labels fit and nothing is
clipped at desktop and phone widths; for the phone view run
`google-chrome --headless=new --window-size=390,844 --screenshot=<file> <url>`.

## Live evidence

`scripts/capture.mjs` records a running page with headless Chrome and ffmpeg (Node 22, nothing
to install):

```
node scripts/capture.mjs <url> --screenshot <file.png>
node scripts/capture.mjs <url> --video <file.webm> [--seconds <n>]
```

`--seconds` defaults to 5. Chrome sends a video frame only when the page repaints, so a still
page gives one frame for the whole length; record pages that animate or load. Save the files
next to the page and point a `figure` at them. `templates/report.json` has a "Live evidence"
section for them; see its entry in the [template guide](references/templates.md#reportjson).

## Changing the engine

Add a block type to `page.html` only when a recurring need has no block, then document it
in the table above. A one-off need uses the `html` block.
