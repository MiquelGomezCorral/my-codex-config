# House style

The look that reads as professional: straight lines, square corners, a plain sans font with
monospace tags, a clear type hierarchy, muted grey secondary text, boxed edge labels, one
light fill per role, and generous white space. `scripts/scene.py` applies these defaults;
`assets/house-style.png` shows them together.

The common amateur look comes from Excalidraw's defaults: the hand-drawn Excalifont
(`fontFamily` 5), sketchy strokes (`roughness` 1), rounded corners on every box, and one
text size for everything. Change all four.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| Sans font | `fontFamily` 6 (Nunito) | titles, labels, body |
| Mono font | `fontFamily` 3 (Cascadia) | tags, chips, model names, code, step numbers |
| Strokes | `roughness` 0, `strokeWidth` 1, `fillStyle` `solid`, `roundness` null | every shape |
| Arrows | width 1, `endArrowhead` `triangle` | flows |
| Title | 28 px, ink | one per drawing |
| Section | 20 px, ink | group headings; card and zone titles in the role text colour |
| Body | 16 px, ink | box labels |
| Secondary | 14 px, `#495057` | details, captions, legend text |
| Subtitle | 16 px, `#495057` | one line under the title: what was read, and when |
| Muted | 14 px, `#6c757d` | footnotes, step numbers, dashed "not a model" items; on white only |
| Note | 14 px, `#c92a2a` | annotations and behaviour notes (`NOTE` in `scene.py`) |
| Ink | `#1e1e1e` | main text and strokes |
| Canvas | `#ffffff` | background |

`#6c757d` is the lightest grey that keeps 4.5:1 contrast on white at 14 px; Excalidraw's
own `#868e96` fails, and the lint reports it. On a grey zone or card fill, use `#495057`
for small text instead: `#6c757d` drops to 4.2:1 there. Nunito lacks arrows and symbols
such as `→` and `≥`; write words, or set them in the mono font. Avoid Helvetica
(`fontFamily` 2): the CLI does not bundle it and falls back to a system font.

## Role colours

One role per colour, at most four in a drawing; neutral grey and white do not count. The
stroke is the strong shade, the fill the lightest, and titles use the darker text shade,
which keeps 4.5:1 contrast on the fill and on white (WCAG treats only 24 px and larger as
large text). The colours are open-color, except the green and orange text shades, which are
darker to reach that contrast. These are the `ROLES` in `scene.py`; pass `fill=` and `stroke=` to
`Scene.box()` for a one-off such as a dark primary button with white text.

| Role | Stroke | Fill | Text |
| --- | --- | --- | --- |
| grey (neutral, the person, steps) | `#868e96` | `#f1f3f5` | `#495057` |
| blue | `#1971c2` | `#e7f5ff` | `#1864ab` |
| indigo | `#4263eb` | `#dbe4ff` | `#364fc7` |
| violet | `#7048e8` | `#e5dbff` | `#5f3dc4` |
| green | `#2f9e44` | `#ebfbee` | `#237032` |
| teal | `#0c8599` | `#e3fafc` | `#0b7285` |
| orange | `#e8590c` | `#fff4e6` | `#c2410c` |
| red (errors, risks) | `#e03131` | `#fff5f5` | `#c92a2a` |
| white (plain card) | `#adb5bd` | `#ffffff` | `#495057` |

## Spacing

- 20 px grid. Same-role shapes share one size.
- 40 px or more between siblings; 120 px or more between tiers joined by labelled arrows
  (a label chip needs room on the arrow); 80 px when the arrows carry no label.
- 40 px margin round the drawing; 16 px padding inside cards; 20 px or more from a zone's
  edge to anything inside it.
- Draw a stage or layer area with `Scene.zone()`: a thin outline in the role colour with
  its title at the top-left. Never bind a title to a zone as a label (it would sit in the
  middle). Draw zones first so their contents sit on top.

## Patterns

- **Title block:** 28 px title, the subtitle under it, then the legend as chips with short
  secondary text beside each.
- **Card:** `Scene.card()`: title in the role text colour, a monospace meta line (model,
  version, counts), then one or two short secondary lines; `wrap(text, width)` splits a
  long line to fit. Pass `height=` to align a row of cards.
- **Emphasis:** `strong=True` on a box or card doubles its stroke. Use it on the one
  element a reader should see first, never on several. Detail beyond that goes in a side panel or the caption, not the card.
- **One parent, many children:** `Scene.fan_out()` draws a trunk with one branch per child,
  labelled and optionally dashed. Never stretch the parent box to span its children.
- **Chip:** `Scene.chip()`: monospace 14 px label in a small grey box. Use it for tags,
  tool names, legend keys, and arrow labels. A legend explains only chips the drawing
  shows.
- **Edge label:** `Scene.arrow(..., label=...)` puts a chip on the arrow's midpoint. Keep
  labels to a word or two (12 characters or fewer); the lint warns when a label covers
  most of its arrow.
- **Annotation:** note text in `NOTE` red beside the subject, with a `Scene.pointer()`
  leader to it. Also use `pointer()` for legend sample arrows.
- **Not-a-model / external / optional:** dashed stroke, muted text, explained in the
  legend or a footnote.
- **Numbered steps:** muted two-digit mono number left of each step box, detail text to its
  right, arrows straight down between boxes.
- **Side detail:** long explanations go in text beside or under the drawing, never inside
  small shapes.
