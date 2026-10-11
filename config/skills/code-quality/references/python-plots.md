# Python Plots

Plots people look at (an artifact page, a notebook, a report) use plotly, not matplotlib: the
reader hovers, zooms, and hides lines, and the plot is one HTML file that drops into an
artifact `figure`. This file does not cover LaTeX papers; they draw with pgfplots (see
`writing/references/latex.md`).

Follow `python.md` for the project, configuration, and imports. This file adds only the plot.

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
    post_script="document.body.style.margin = 0;",
)
```

`fillFrame` sizes the plot to its frame and hides the scrollbar; plotly.py already turns on
`responsive`, so the plot follows a resized frame; `post_script` removes the 8 px body margin that would push the plot off the frame.
Leave `height` and `width` off the layout: the frame sets the size, and a fixed one gets
clipped on a phone. Hiding the toolbar (`displayModeBar`) keeps it from covering the title on a
phone.

Point an artifact `figure` at the file: `{ "type": "figure", "src": "plots/recall.html",
"height": 560, "caption": "..." }`. The page runs it in a sandboxed frame, so it must work on its
own; `height` is the plot height.

`include_plotlyjs` decides where plotly's 5 MB of JavaScript lives:

- `"directory"` writes one `plotly.min.js` next to the HTML files, and every plot in that
  folder shares it. Use it for a page served over HTTP, as artifact pages are: it works
  offline, which matters when the page is opened from another machine on the LAN. Keep the
  plots of a page in one folder.
- `True` embeds the 5 MB in every file. Use it when a file must open by itself, from disk
  (`file://`) or as an attachment: a sandboxed frame cannot load the shared script from disk,
  so a `"directory"` plot shows blank there.
- `"cdn"` needs internet on the viewer's machine; the plot stays blank without it.

## Read on light and dark pages

The page can be light or dark and the plot cannot ask which.

- Background: `paper_bgcolor` and `plot_bgcolor` set to `"rgba(0,0,0,0)"`. The page draws its own
  card color behind the frame.
- Text and axes: mid-gray (`#7c7c88`), grid lines `rgba(128,128,128,0.22)`. Default black text
  vanishes on a dark page.
- Series: mid-tone colors with at least 3:1 contrast against white and `#1d1d21`, such as
  `#D96F00`, `#2A7FC4`, `#B03A9A`. Give a method the same color in every plot of a page.

## Say what it shows

- The title states the takeaway ("Round 2: the RM methods first solve the map sooner"), not
  the metric. When it quotes numbers, compute them in the script and assert the claim, so a
  rerun on new data cannot keep a false title.
- Every axis has a title with its unit ("Training steps", "Eval exit rate"); format ticks with
  `tickformat` (`".0%"`, `".3~s"`).
- Small multiples (`make_subplots` with shared axes) beat a dozen lines in one panel. One
  legend entry per method.
- A `hovertemplate` shows the exact value and unit.
- The artifact caption says what a line and a band are (mean of the seeds, ±1 std) and when
  the plot was made.
