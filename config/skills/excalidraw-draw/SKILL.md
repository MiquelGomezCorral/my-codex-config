---
name: excalidraw-draw
description: Hand-write or edit `.excalidraw` scenes in a clean, professional style and render them to PNG with the official Excalidraw CLI, reviewing every render before delivery. Use when `diagram-design` or the `excalidraw` skill templates cannot express the drawing, and for drawing beyond diagrams - wireframes, slides, illustrations, maps, timelines, icon-rich visuals, or reusing Excalidraw library items and icons. Not for quick node-and-edge web-link diagrams (`excalidraw`) or standard branded diagram types (`diagram-design`).
---

# Excalidraw drawing

Draw editable `.excalidraw` scenes, render them locally with the official CLI, look at the
result, and fix it before anyone else sees it. The CLI draws every element exactly where
the file says. It does not centre labels, measure text, or repair arrows, so the file must
be right. `scripts/scene.py` computes that geometry and lints the result.

## Before you start

- Run `command -v excalidraw`. If it is missing, report the gap and use another diagram
  route; do not install it. The user installs it with `npm install -g @excalidraw/cli`
  (Node 22+). Rendering also needs Chrome, Chromium, Edge, or Firefox.
- CLI docs: <https://github.com/excalidraw/cli#readme>. Fetch them, or run
  `excalidraw <command> --help`, before using any flag not shown here.
- From the CLI, use only `render` and `--help`. `login`, `logout`, `scenes`,
  `collections`, `workspace`, `logs`, and `update` touch the user's Excalidraw+ account,
  API key, or installation; use them only when the user asks for that exact action.
- This skill owns drawing mechanics. What makes a drawing clear (one question, a
  takeaway, legends, labels, verified facts, the caption) comes from the shared
  [presentation rules](../workflow/references/diagrams.md#presentation), and from the
  [agent-artifacts figure rules](../agent-artifacts/SKILL.md#diagrams-and-illustrations) when the
  drawing goes on a page. Apply them to every drawing, inside or outside a workflow.

## Workflow

1. **Name the job.** Write the one question the drawing answers and its takeaway in a
   sentence. Pick the kind of drawing in [kinds.md](references/kinds.md); each kind has its
   own layout rules.
2. **Plan on the grid.** List rows, columns, and groups on the 20 px grid from
   [style.md](references/style.md). Decide positions by grid slot. Do not reason about
   pixel coordinates in prose; render and look instead.
3. **Build with the helper.** Write a small builder script next to the output that imports
   `scene.py`, and run it with
   `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=<this skill>/scripts python3 build.py`.
   `scripts/house_style_example.py` shows the core building blocks; its result is
   `assets/house-style.excalidraw` and `assets/house-style.png`. Reuse library items and
   icons from [libraries.md](references/libraries.md) for objects with a recognisable form.
   When you must write JSON yourself, follow [format.md](references/format.md).
4. **Lint.** `Scene.save()` prints findings; for any other file run
   `python3 <this skill>/scripts/scene.py lint scene.excalidraw`. Fix every `error:`. A `style:`
   finding is acceptable only when the user asked for that look.
5. **Render and look.** Run
   `excalidraw render scene.excalidraw --out scene.png --scale 2 --max-width 8192 --max-height 8192`
   and open the PNG. Without the two limits the CLI shrinks anything wider or taller than
   2048 px, so large scenes come out blurry. Review the render against the checklist below
   as if you had never seen the plan. When a large render is shrunk in your viewer, check
   detail area by area: `python3 <this skill>/scripts/scene.py crop scene.excalidraw X Y W H`
   writes a copy with a crop frame and prints the render command for it. Fix, rebuild,
   re-render. Stop when it passes or after three rounds, and report anything still wrong.
6. **Deliver.** Keep the `.excalidraw` (editable), the PNG (the preview), and the builder
   script together in the assigned output directory, or `agent-memory/artifacts/<name>/`
   when none was given, and link the PNG and the source.

## Review checklist

You are the first reviewer. Check the render, not the code: first against the
presentation rules above, read as a newcomer would, then for what goes wrong in Excalidraw
renders specifically.

- **Literal geometry:** labels centred in their shapes, nothing clipped or spilling out of
  a card, no glyph drawn in a fallback font. The lint catches most of these; the render
  shows the rest.
- **Arrows:** each starts and ends on its shapes' edges, none runs through a box or lands
  in empty space, no two arrowheads share a point, and label chips leave most of the
  arrow visible.
- **Space:** even gaps on the grid, no cramped corner beside an empty one, and no
  oversized empty box: a parent keeps its normal size and reaches many children through
  `Scene.fan_out()`. The lint cannot see empty space; only the render shows it.
- **House style:** straight strokes (roughness 0), Nunito and Cascadia fonts, at most four
  role colours (neutral grey and white do not count), a title and a subtitle. Use the
  hand-drawn look only when the user asks for it.

## Who renders

The agent that draws reviews its own render. Inside its output directory it may run
exactly these, and this list is the one owner of that permission:

- `command -v excalidraw`, `excalidraw render`, and `excalidraw <command> --help`.
- `scene.py` (`lint`, `measure`, `crop`) and its own builder script.
- Downloads of public library and icon files, saved as data and never executed.

A coordinator still verifies the delivered files and preview before presenting them.
