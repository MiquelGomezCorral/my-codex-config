---
name: figures
description: Make the visual evidence for anything shown to the user. Use before drawing any diagram, chart, graph, plot, figure, flowchart, sequence diagram, architecture view, timeline, Gantt, mind map, drawing, sketch or wireframe, and whenever a page, report, plan or answer would be clearer with a picture. Routes each need to the right tool (Pele, diagram-design, Excalidraw, Plotly), gives the exact starting examples, and makes every figure match the artifact pages' light and dark themes. Load it before `diagram-design`, `excalidraw`, `excalidraw-draw` or any plotting code.
---

# Figures

Pick the tool, start from its example, match the page themes, check the result. Each tool has one
reference; read it before you draw.

## Order

For diagrams and drawings, try the tools in this order and move down only when the one above
cannot meet the need:

1. **Pele**: Mermaid text rendered to SVG. Most diagrams and simple charts.
2. **diagram-design**: refined, editorial diagrams and chart types Pele lacks.
3. **Excalidraw**: drawings, and anything open-ended or not in the catalog.
4. **Plotly** from Python: precise plots of real data. Real data goes here directly, and a chart
   only Plotly has never falls to Excalidraw.

Escalate when Pele's layout tangles or looks rough for a reader who needs polish, the type is missing
from Pele, the figure is a free drawing, or it is real data with exact values.

## Route

Look the figure up in [references/catalog.md](references/catalog.md). It lists every figure kind
(about 60) and which of Pele, diagram-design and Plotly have it, in that column order. Use the first
tool that has it; when its result falls short, move to the next tool that has the same figure. Real measured data goes to
Plotly even when another tool has the chart. A figure the catalog does not list, or one that is
drawn rather than diagrammed, goes to Excalidraw.

Then read that tool's reference before drawing: [pele.md](references/pele.md) (and the example
file the catalog links), [diagram-design.md](references/diagram-design.md),
[excalidraw.md](references/excalidraw.md) or [plotly.md](references/plotly.md).

Do not draw when a sentence or a table does the job; a short linear flow is a `steps` block
(`artifacts` skill).

## Put it on an artifact page

A `figure` block takes the output of every tool (field list in the `artifacts` skill):

- Pele: `figure.mermaid` holds the Mermaid text. No file.
- diagram-design, Excalidraw: `figure.src` is the light image and `figure.dark` the dark one.
- Plotly: `figure.src` is the `.html` plot; the page adds `?theme=light|dark` to its frame.
- Any `.html` frame, including a page with Pele: the same `?theme=` parameter.

Outside an artifact page, Pele works in any HTML with two script tags (`pele.md`), and Plotly's
HTML opens alone and follows the system theme.

## Theme promise

Every tool's output uses the artifact page palette, in both themes: card `#ffffff` or `#1d1d21`, ink,
muted, line and accent from the page tokens, the page font, and the shared series colours. The
palette table lives in `references/pele.md` ("Both themes"). Its copies change with it:
`references/plotly.md`, `references/plotly/example.py`, `references/diagram-design/artifacts.md`
and `assets/pele/pele-embed.js`. Each reference says how its tool applies it. Never invert an image with CSS and never fix a colour that the theme should set (Mermaid `style`
and `classDef` colours do not follow the theme: leave them out).

## Before you show it

1. The caption states the takeaway in a sentence, not the chart type.
2. Look at it in light and in dark, at desktop width and at 390 px. For a page served by the hub, use
   the `artifacts` skill's `scripts/capture.mjs <page url> --screenshot <file.png> [--width 390]
   [--theme dark]` (it takes `http(s)` URLs only). For a standalone file, open it from disk in
   headless Chrome or Playwright, at desktop width and at 390 px. Open the image.
3. Labels fit and are readable, nothing is clipped, and the figure does not make the page scroll
   sideways. Fix the source and render again; do not ship a figure you have not looked at.
4. Put the source (Mermaid text, `.excalidraw`, the script) next to the page when the reader may
   want to edit it.
