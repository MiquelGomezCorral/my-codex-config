---
name: artifacts
description: Present work to the user as a local HTML page filled from a JSON template instead of a long chat answer - findings reports, decision sheets, option comparisons, explainers, and short slide decks. Use when results, choices, or explanations are easier to review as a page, or when the user asks for a page, summary app, report, or deck.
---

# Artifacts

One page engine, `page.html`, draws every artifact from a JSON block at the top of the
file. Pick a template, fill its JSON, and run `fill.py`. Never write or edit the CSS or
JavaScript for a single artifact.

## When a page earns its place

The human-facing agent filters what reaches the user and in what form. Workers return
findings and artifacts to it; they do not present to the user directly.

- **Use a page** for important, dense content: several findings with evidence, options
  the user must choose between, research that changes the plan, or a flow a diagram
  explains better than prose.
- **Stay in chat** when the content fits in a few short lines, has one obvious answer, or
  needs only a yes or no.

## Templates

| Template | Use for |
| --- | --- |
| `templates/report.json` | Results of tests, audits, or reviews: counts, main findings, click-to-open items, next steps |
| `templates/decisions.json` | Questions the user must answer: options, a recommendation, saved picks, "Copy my decisions" |
| `templates/comparison.json` | Two to four approaches side by side, with criteria and a recommendation |
| `templates/explainer.json` | How a system or concept works: TL;DR, flow, collapsible steps, FAQ, glossary |
| `templates/slides.json` | A short deck; arrow keys or space move between sections |

Templates are starting shapes, not limits. Any section can use any block, so a report can
end with a decisions block, and an explainer can include a comparison.

## Steps

1. Copy the closest template into a working directory outside the repository, such as the
   session scratchpad, next to the page it will become.
2. Replace every example value with real content. Delete blocks and sections you do not
   need; never leave example text or empty sections.
3. Render it from this skill's directory:
   `python3 scripts/fill.py <dir>/data.json <dir>/index.html`
4. Serve `<dir>` with the shared artifact server named in the global rules and give the
   user the reachable URL. To change the page, edit `data.json` and run step 3 again.

Write the text with the `writing` skill. Keep quotes verbatim and claims backed by what
was actually observed.

## Data shape

Top level: `title`, optional `eyebrow` (small line above the title), `subtitle`,
`layout` (`"slides"` for a deck), `statuses`, and `sections`. Each section has a `title`,
an optional `id` for the navigation links and `intro`, a list of `blocks`, and optional
`layout: "split"`, which puts its figures on the right and the other blocks on the left. A
split section in a deck is a diagram slide.

Every text field accepts `` `code` ``, `**bold**`, `*italic*`, `[link](url)`, and blank
lines between paragraphs. Any block can take a `heading` that is shown above it. A `tone`
is one of `ok`, `bad`, `warn`, `info`, or `muted`.

| Block `type` | Fields |
| --- | --- |
| `text` | `text` |
| `callout` | `title`, `text`, `tone` |
| `list` | `items` (strings), `ordered` |
| `stats` | `items` (`value`, `label`, `tone`); `auto: true` adds counts of finding statuses |
| `cards` | `items` (`title`, `text`, optional `status`) |
| `table` | `columns`, `rows` (arrays of strings) |
| `steps` | `items` (`title`, `text`) drawn as a left-to-right flow |
| `details` | `items` (`title`, `text`, optional `blocks`, `open`) as collapsible rows |
| `findings` | `items` (`id`, `title`, `status`, `fields` of `label`/`text`, `quotes` of `text`/`source`, `open`) |
| `compare` | `options` (`name`, `summary`, `pros`, `cons`), `criteria` (`name`, `values` per option), `recommended` |
| `decisions` | `items` (`id`, `question`, `context`, `options`, `recommended`) |
| `code` | `text` |
| `figure` | `src` (a file next to the page), `caption`, `alt`, `source` (editable file or URL), `height` for HTML |
| `html` | `html`, only for a hand-drawn SVG or markup no other block covers |

`statuses` maps each finding `status` key to a `label` and a `tone`. Without it, the keys
are `ok`, `bad`, `decide`, and `info`.

Decision picks and notes are saved in the viewer's browser. They reach the agent only when
the user presses **Copy my decisions** and pastes the text back.

## Diagrams and illustrations

A `figure` shows any diagram, chart, sketch, mockup, or screenshot saved next to the page.
SVG, PNG, JPEG, WebP, and GIF files show as images; an `.html` file runs in a sandboxed
frame. Make the file with the skill that fits, then point `src` at it:

| Need | Make it with | Put in `src` / `source` |
| --- | --- | --- |
| Architecture, flowchart, sequence, state, ER, timeline, or chart | `diagram-design` | its SVG export (`scripts/export_svg.py`); its HTML pages do not shrink to fit |
| Whiteboard-style sketch the user may keep editing | `excalidraw` | the preview SVG; the `.excalidraw` file or web link as `source` |
| UI mockup or clickable prototype | a small standalone HTML file | the HTML file, with a `height` |
| A short linear flow | no file: use a `steps` block | - |
| A tiny one-off drawing | inline SVG in an `html` block | - |

Give every figure a caption that states its takeaway. A diagram explains; it is not evidence
that the behavior it shows exists. Open the page and check that labels fit and nothing is
clipped at desktop and phone widths.

## Changing the engine

Add a block type to `page.html` only when a recurring need has no block, then document it
in the table above. A one-off need uses the `html` block.
