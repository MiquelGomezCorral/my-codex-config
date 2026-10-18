# Figures

## Intent

Whatever an agent presents to the user can carry visual evidence made with the cheapest tool
that does the job, and every figure looks like it belongs on the artifact pages, in their light
and dark themes alike.

## Current decisions

- One `figures` skill picks the tool and owns how each one is used. It tries them in this order
  and moves down only when the earlier one cannot meet the need:
  1. Pele: Mermaid text rendered to SVG, for most diagrams and simple charts.
  2. `diagram-design`: refined, editorial diagrams and chart types Pele lacks.
  3. Excalidraw (`excalidraw` for quick template scenes, `excalidraw-draw` for hand-written
     ones): drawings, sketches, wireframes and other open-ended visuals.
  4. Plotly from Python: precise plots of real data, embedded as HTML.
- One catalog (`references/catalog.md`) owns which tool has which figure kind, covering every
  Pele and diagram-design type and the Plotly equivalents. Agents take the first tool in the order
  that has the figure and fall back to the next one that has it.
- Each tool has one reference in the skill. Pele's reference indexes one file per diagram type,
  holding the pele.run examples with only their theme, colour-scheme, font and log settings
  removed, and agents open the exact file for the type they need.
- The Pele browser bundle is vendored and pinned in `figures/assets/pele/` with its MIT
  license, so pages render offline on the LAN. A small drop-in script of ours themes Pele
  diagrams and draws every `pre.mermaid` element, so any HTML file can use Pele with two
  script tags.
- Artifact pages draw a `figure` from Mermaid text (`mermaid` instead of `src`). `fill.py`
  inlines the engine and the drop-in only into pages that use one, and reads them from the
  sibling `figures` skill.
- Figures follow the artifact page palette. Pele maps its colour variables to the page tokens.
  `diagram-design` uses an `artifacts` profile in its own profile format and exports a light
  and a dark SVG, shown through the figure's `dark` image. Plotly reads the `?theme=` value the
  page passes to framed graphs.
- The Plotly plotting rules moved from `code-quality` to `figures`; `code-quality` points there.

## Protected invariants

- One vendored source copy of the Pele engine, at a pinned version, with its license beside it.
  Rendered pages inline it, the skill's own demo page included.
- Pages without a Mermaid figure are unchanged, and the engine is never fetched from a CDN.
- Figure colours have one owner per tool and match the artifact page tokens in both themes.
- External skills (`diagram-design`, `excalidraw`) are used through their documented
  interfaces; this repository never edits their installed files.

## Rationale and tradeoffs

Most figures agents make are flows, sequences and small charts, where Pele's automatic layout
is good enough, renders in milliseconds and keeps an editable text source. `diagram-design`
and Excalidraw take longer and stay for work where layout quality or free drawing matters.
Plotly stays for real data because only it gives exact values, hover and zoom.

Inlining about 680 KB into a page that uses Pele is the cost of a page that works offline, from
disk and inside the zip export. Pages without diagrams pay nothing.

## Enforcement

- Skill instructions: [figures](../../../config/skills/figures/SKILL.md) and
  [artifacts](../../../config/skills/artifacts/SKILL.md).
- Static checks: the [bootstrap check](../../../bootstrap_codex.sh) only confirms the skill exists
  with a valid name. `scripts/check-mermaid.mjs` renders every Pele example. No static check
  guards the engine copy, the CDN rule or the palette.
- Review-only: the protected invariants above, and figure looks in both themes and at phone
  width, checked live on hub pages.

## History

- 2026-10-18: Added the figure catalog after the user asked whether agents know what each tool
  lacks; it replaced the partial lists in `SKILL.md`, `pele.md` and `diagram-design.md`.
- 2026-10-18: Added `demo/index.html`, an artifact page with real output from all four tools, and
  a `README.md` that shows it as a light/dark full-page picture linked to the page (GitHub cannot
  run HTML in Markdown). Its Plotly figure loads Plotly from the CDN to keep about 4.8 MB out of
  the repository.
- 2026-10-18: Created the `figures` skill with the Pele, `diagram-design`, Excalidraw and Plotly
  routing, the vendored Pele 1.6.0 engine, Mermaid figures and dark images on artifact pages,
  and theme-matched output for every tool.
