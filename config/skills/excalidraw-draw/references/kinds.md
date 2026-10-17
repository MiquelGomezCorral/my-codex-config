# Kinds of drawing

Pick the kind before drawing. Each has a layout that readers already know. Do not force a
subject into a row of boxes when a reader expects another composition.

| Kind | Layout | Notes |
| --- | --- | --- |
| Diagram (flow, tree, architecture) | Tiers or columns on the grid; zones for layers | Cards for actors, chips for tools, labelled arrows. A parent with several children uses `fan_out()`. Group with white space first, zones only when space is not enough. |
| Wireframe / UI mockup | One rectangle per screen at a real device size: phone 375 x 812, tablet 768 x 1024, desktop 1440 x 900 | The phone outline is the one place for rounded corners (`rounded=True`). Use rectangles, not frames, for screens: arrows bind to shapes, not frames. Grey boxes with an X for images, real copy instead of lorem ipsum, `NOTE` red only for annotations. Kits in [libraries.md](libraries.md). |
| Slides | One frame per slide, 1600 x 900, frame name = slide title | Render each slide with `excalidraw render deck.excalidraw --frame-id <id> --out slide-1.png`. One idea per slide. |
| Infographic / sketchnote | One reading path: linear, vertical, radial, path, or modular | Number the sections; big numbers or icons as anchors; short text. |
| Timeline / roadmap | A horizontal line with dot markers and labels alternating above and below | Dates in mono; today or the current phase in the accent colour. |
| Map / floor plan | Closed filled lines for areas, a scale or compass only if it matters | Labels outside small areas with a short leader line. |
| Comparison | Side-by-side columns or a matrix | Same rows in every column; differences highlighted, sameness muted. |
| Illustration | Objects built from simple shapes | See below. |

## Illustrations and free drawing

Models are weak at free-form geometry, so decompose before drawing:

1. List the objects in the scene.
2. Split each object into simple parts: ellipses, rectangles, diamonds, closed lines.
3. Give each part a position, size, and colour on the grid.
4. Write the parts back to front (background first, details last).

Rules:

- Do not label the parts of a drawing ("a drawing of a cat") unless the user asks for a
  diagram ("a diagram of a cat").
- A closed line (last point equals the first) with a `backgroundColor` draws any filled
  shape: `Scene.line(points, closed=True, fill="#ffd8a8")`.
- Use freedraw only for organic curves no shape can express.
- Prefer a library item or icon when the object has a recognisable form (a person, a
  device, a cloud service, a logo). Simple boxes, fields, and buttons are quicker by hand.
- No emoji: they do not render in Excalidraw's fonts. Use an embedded icon instead.

## Mermaid

Excalidraw's own converter turns Mermaid flowchart, sequence, class, ER, and state
diagrams into scenes, but it needs a browser runtime that this skill does not ship. When a
Mermaid source exists and the user wants Excalidraw, draw it with the helper instead.
