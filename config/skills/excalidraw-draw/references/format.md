# Raw scene format

Read this before writing or editing `.excalidraw` JSON without `scripts/scene.py`. Facts
below were checked against `@excalidraw/cli` 0.2.0 renders on 2026-10-08.

## The file

```json
{"type": "excalidraw", "version": 2, "source": "...", "elements": [],
 "appState": {"viewBackgroundColor": "#ffffff"}, "files": {}}
```

Keep unknown keys when editing an existing file, and keep `files` whenever the scene has
images. Every element needs `id` (unique), `type`, `x`, `y`, `width`, `height`, `angle`,
`strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `strokeStyle`, `roughness`,
`opacity`, `groupIds`, `frameId`, `roundness`, `seed`, `version`, `versionNonce`,
`isDeleted`, `boundElements`, `updated`, `link`, and `locked`.

## The renderer trusts the file

The CLI does not re-centre labels, re-measure text, or repair one-sided bindings.

- **Text geometry:** `width` and `height` must match the text. Height is
  `lines x fontSize x lineHeight` (1.25 for Nunito, 1.2 for Cascadia). Get the width from
  `python3 scripts/scene.py measure "label" --size 16 --font 6`. Export bounds use the
  stored width, so a wrong width also crops or pads the image.
- **Labels in shapes:** the text has `containerId: <shape id>`, `textAlign: "center"`,
  `verticalAlign: "middle"`, and x/y that centre it in the shape. The shape lists it in
  `boundElements: [{"id": <text id>, "type": "text"}]`. A label left at the shape's corner
  renders at the corner.
- **Arrows and lines:** `points` are offsets from the element's own `x`/`y`, starting at
  `[0, 0]`. `width` and `height` must be zero or positive even when points go negative,
  or the CLI rejects the file. Bind both ends with
  `startBinding`/`endBinding: {"elementId": ..., "focus": 0, "gap": 4}` and add
  `{"id": <arrow id>, "type": "arrow"}` to each shape's `boundElements`. This older binding
  form works in both current and older Excalidraw builds.
- Skeleton shorthands from Excalidraw's API docs (`label`, `start`, `end`,
  `startElementId`) are not file fields. The CLI ignores them.

## Fonts

| `fontFamily` | Font | Look | Bundled in the CLI |
| --- | --- | --- | --- |
| 6 | Nunito | clean sans (house default) | yes |
| 3 | Cascadia | monospace (house tags) | yes |
| 9 | Liberation Sans | plain sans | yes |
| 5 | Excalifont | hand-drawn (Excalidraw default) | yes |
| 1 | Virgil | old hand-drawn | yes |
| 8 | Comic Shanns | playful mono | yes |
| 7 | Lilita One | display headline | yes |
| 2 | Helvetica | system font | no; renders as 9 |

## What renders

| Feature | How | CLI |
| --- | --- | --- |
| Frame | `type: "frame"`, `name`; children set `frameId` | outline, name above it, children clipped |
| Image | `type: "image"`, `fileId`, `status: "saved"`, `scale: [1, 1]`; `files[fileId]` holds `mimeType` and a base64 `dataURL` | yes, only when embedded |
| SVG icon | as an image | the root `<svg>` needs numeric `width` and `height`, or it renders cropped; replace `currentColor` with a hex colour |
| Filled custom shape | `line` whose last point equals the first, with `backgroundColor` | yes |
| Freedraw | `points`, `pressures: []`, `simulatePressure: true` | yes |
| Groups, locked elements | shared `groupIds`; `locked: true` | yes (no visual effect) |
| Image URLs, embeds, iframes | `link` | no: an empty box |
| Link icons | `link` on any element | not drawn |
| Emoji | text | system font only; avoid |

## Render options

- `--scale 2 --max-width 8192 --max-height 8192` for review and delivery. The limits
  default to 2048 px and silently shrink anything larger.
- `--frame-id <id>` renders one frame (a slide or a screen).
- `--theme dark`, `--transparent`, and `--padding <px>` when the destination needs them.
- `--out -` writes PNG bytes to stdout for piping.
