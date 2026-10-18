# Plotly

Plots of real data people look at (an artifact page, a notebook, a report) use plotly, not
matplotlib: the reader hovers, zooms and hides lines, and the plot is one HTML file that drops into
an artifact `figure`. Use it when exact values matter; a quick shape of a few numbers is a Pele
`xychart` or `pie`. LaTeX papers draw with pgfplots (see `writing/references/latex.md`).

Follow [`python.md`](../../code-quality/references/python.md) for the project, configuration and
imports. This file adds only the plot. [`plotly/example.py`](plotly/example.py) is the starting
point: one themed plot with the export below.

```
uv run --with plotly python <this skill>/references/plotly/example.py <out dir>
```

It writes `<out dir>/plots/recall.html` and `plotly.min.js` beside it. Without `uv`, install plotly
in the project environment and run `python <this skill>/references/plotly/example.py <out dir>`.

## Library

- Use `plotly.graph_objects` (`go`) and `make_subplots`. Add `plotly` to `requirements.txt`;
  a one-off script runs with `uv run --with plotly python script.py`.
- Use matplotlib only when the output must be a static image plotly cannot make.
- One function builds one `go.Figure` and returns it; saving is a separate call. Every number
  comes from the data files in code, never typed in.

## Export for an artifact

```python
fig.write_html(
    out / "plots" / "recall.html",
    include_plotlyjs="directory",
    config={"displayModeBar": False, "fillFrame": True},
    post_script=THEME_SCRIPT,  # sets the margin and the theme, see below
)
```

`fillFrame` sizes the plot to its frame and hides the scrollbar; plotly.py already turns on
`responsive`, so the plot follows a resized frame. The `post_script` removes the 8 px body margin
that would push the plot off the frame. Leave `height` and `width` off the layout: the frame sets
the size, and a fixed one gets clipped on a phone. Hiding the toolbar (`displayModeBar`) keeps it
from covering the title on a phone.

Point an artifact `figure` at the file: `{ "type": "figure", "src": "plots/recall.html",
"height": 560, "caption": "..." }`. The page runs it in a sandboxed frame, so it must work on its
own; `height` is the plot height.

`include_plotlyjs` decides where plotly's JavaScript (about 4.8 MB) lives:

- `"directory"` writes one `plotly.min.js` next to the HTML files, and every plot in that
  folder shares it. Use it for a page served over HTTP, as artifact pages are: it works
  offline, which matters when the page is opened from another machine on the LAN. Keep the
  plots of a page in one folder.
- `True` embeds the 4.8 MB in every file. Use it when a file must open by itself, from disk
  (`file://`) or as an attachment: a sandboxed frame cannot load the shared script from disk,
  so a `"directory"` plot shows blank there.
- `"cdn"` needs internet on the viewer's machine; the plot stays blank without it.

A plot that must travel with the page (the artifact zip export) or open from disk uses
`include_plotlyjs=True`: the zip collects only the files the data names (`src`, `dark`, `source`),
not a frame's own files, so a `"directory"` plot loses its `plotly.min.js` there and shows blank.

## Match the light and dark themes

The page adds `?theme=light` or `?theme=dark` to the address of a framed `.html` figure (also on
"Open full size") and reloads the frame when the reader toggles the theme. So the plot reads the
parameter once, when it loads, and applies the page palette. Opened alone it has no parameter and
follows `prefers-color-scheme`.

`THEME_SCRIPT` in `example.py` does this in a `post_script`, and needs no edit beyond the layout it
sets:

- Backgrounds: `paper_bgcolor` and `plot_bgcolor` stay `rgba(0,0,0,0)`, and the script paints the
  document in the card colour (`#ffffff` light, `#1d1d21` dark), the same colour the page draws
  behind the frame. Without it, "Open full size" or a file opened alone in the dark theme shows
  pale text on a white browser canvas.
- Text: `--pele-fg`, `#1d1d1f` light and `#ececf0` dark, through `font.color`.
- Grid, zero line, axis line and ticks: the line colour (`#5b5b66` light, `#b9b9c4` dark) at 25 %
  opacity.
- Series: the eight-colour series palette of the theme, through `colorway`
  (light `#2f5bd3 #d96f00 #1f7a4d #b3261e #b03a9a #1b7f8c #6b52c0 #8a6d3b`, dark
  `#8fb0ff #ffa24d #5fd394 #ff8a80 #e58ad2 #5ccfdc #b9a2ff #d8b56b`). Each clears 3:1 against its
  card. Give a method the same colour in every plot of a page, in the order of the palette.
- Font: the page font, `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

Set the light palette in the layout too, so the plot is right when scripts are blocked. Keep the
palette in one Python dict and inject it into the script, as `example.py` does, so Python and
JavaScript cannot drift apart. Colours the script cannot reach, such as a fixed `marker.color` on a
trace, stay the same in both themes: leave trace colours to `colorway`.

## Say what it shows

- The title states the takeaway ("Round 2: the RM methods first solve the map sooner"), not
  the metric. When it quotes numbers, compute them in the script and assert the claim, so a
  rerun on new data cannot keep a false title. Plotly does not wrap a title: break it with `<br>`
  and keep each line near 35 characters, or a phone clips it.
- Every axis has a title with its unit ("Training steps", "Eval exit rate"); format ticks with
  `tickformat` (`".0%"`, `".3~s"`).
- Small multiples (`make_subplots` with shared axes) beat a dozen lines in one panel. One
  legend entry per method.
- A `hovertemplate` shows the exact value and unit.
- The artifact caption says what a line and a band are (mean of the seeds, ±1 std) and when
  the plot was made.
