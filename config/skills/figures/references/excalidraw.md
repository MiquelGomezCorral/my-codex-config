# Excalidraw

Draw when the picture is not a standard diagram: sketches, wireframes and mockups, illustrations,
slides, maps, icon-rich or free-form visuals, and a whiteboard drawing the user may keep editing.
For flows, sequences and charts go back up the order (Pele, then `diagram-design`).

Two installed skills; load the one you need and read its `SKILL.md` first:

| Skill | Use it for | How it works |
| --- | --- | --- |
| `excalidraw` | A quick node-and-edge scene, or a scene the user will keep editing in Excalidraw | Template scripts turn a small JSON spec into a `.excalidraw` file and a light preview SVG. Hand-drawn look. |
| `excalidraw-draw` | Anything the template cannot express, and any drawing that must look professional | You write the scene with its `scene.py` helper (house style: straight lines, Nunito and Cascadia, at most four role colours, 20 px grid), lint it, render it with the official CLI and review the render. |

Pick `excalidraw-draw` for wireframes, slides, illustrations and anything a reader will judge on
polish. Pick `excalidraw` for a fast whiteboard sketch. The template's arrow labels can touch the
boxes next to them; look at the render and move to `excalidraw-draw` when they do.

Keep scenes local. The `excalidraw` skill's `scripts/create_web_diagram.py` uploads the scene to
Excalidraw's public JSON storage by default and returns a link (`--no-web-link` turns that off), and
its `generate_excalidraw.py` uploads only with `--web-link`. An upload is outward-facing: do it only
when the user asks for the link. The `excalidraw` CLI's `render` never uploads.

## Put it in a figure

- `src`: the rendered image. PNG from `excalidraw render` (`excalidraw-draw`), or the preview SVG
  (`excalidraw`).
- `source`: the `.excalidraw` file, so the reader can open and edit it.
- `dark`: the dark render, when you make one (below).
- `caption`: the takeaway, in a sentence. A drawing is not evidence that the thing it shows exists.

```json
{ "type": "figure", "src": "drawings/signup.png", "dark": "drawings/signup-dark.png",
  "source": "drawings/signup.excalidraw", "alt": "Signup wireframe, three steps",
  "caption": "Three steps, one decision per screen." }
```

Render at `--scale 2 --max-width 8192 --max-height 8192`; without the limits the CLI shrinks a large
scene to 2048 px and it blurs.

## Both themes

Excalidraw draws on its own canvas, so a drawing does not follow the page colours. What each tool can
do, checked with CLI 0.2.0:

- **`excalidraw render --theme dark`** exports a dark version of any `.excalidraw` scene, from either
  skill: background `#121212`, strokes and text inverted, role colours shifted to read on dark.
  `--transparent` leaves the background out, so the page card (`#ffffff` light, `#1d1d21` dark) shows
  through and the drawing sits on the page like the other figures.
- **Make both and let the page choose.** Render the light PNG as `src` and the dark PNG as `dark`,
  both with `--transparent`:

  ```
  excalidraw render scene.excalidraw --out signup.png --scale 2 --max-width 8192 --max-height 8192 --transparent
  excalidraw render scene.excalidraw --out signup-dark.png --theme dark --scale 2 --max-width 8192 --max-height 8192 --transparent
  ```

  Look at both on their card colours; the dark export inverts fills, so a white card inside the
  drawing turns near-black and can sit darker than the page card. That is acceptable. Cut anything
  that becomes unreadable.
- **The `excalidraw` preview SVG is light only.** For a dark version render its `.excalidraw`
  scene with the command above and use the PNG as `dark`.
- **No dark export, or the CLI is missing** (`command -v excalidraw` finds nothing; do not install
  it): the drawing keeps its light card in both themes. Draw it on a white filled background
  rectangle so it reads as a card on a dark page, and say so in the report.

Embed a drawing once per theme; never invert an image in CSS.
