# diagram-design

Use it when the figure must look refined, or Pele cannot draw it:

- A dense or editorial layout you need to control (architecture overviews with zones, swimlanes with
  handoffs, a hand-routed flow).
- A figure Pele does not have. [catalog.md](catalog.md) shows which ones: its diagram-design
  column names the type file (`type-<name>.md`) to load from the diagram-design skill's
  `references/`.
- A figure a reader will screenshot or reuse, where Pele's automatic layout looks rough.

It takes longer than Pele and its text cannot be edited as a short source. Do not use it for a
plain flow or sequence.

**Phone width.** The SVG is a fixed canvas (about 920 px). On a 390 px phone it shows at about 40 %,
so names and sublabels are unreadable there. Keep the diagram to what the caption needs, say the
takeaway in the caption (page text), and rely on "Open full size" for detail; if the reader must
read the labels on a phone, choose Pele.

## Use the `artifacts` profile

[`diagram-design/artifacts.md`](diagram-design/artifacts.md) is a diagram-design profile: the artifact
page palette in a light and a dark column and the page's system font. diagram-design reads a named
profile from `~/.diagram-design/profiles/<slug>.md`, chosen by a `.diagram-design` marker.

**Install the profile once.** If `~/.diagram-design/profiles/artifacts.md` is missing, create it:

```
mkdir -p ~/.diagram-design/profiles
[ -e ~/.diagram-design/profiles/artifacts.md ] || cp <this skill>/references/diagram-design/artifacts.md ~/.diagram-design/profiles/artifacts.md
```

If the file exists and differs (`cmp`), tell the user and ask before replacing it; their copy may be
edited. The library sits outside the installed skill, so updates cannot erase it.

**Select it with a marker in a throwaway build folder.** Work in a scratch folder for this figure
(for example `agent-memory/artifacts/<page>/build/`, or a temporary directory), and write one file
there, `.diagram-design`, whose whole content is:

```
profile: artifacts
```

diagram-design then reads the profile directly for every diagram made in that folder: run the
generation from the folder that holds the marker (it is the "project root" the marker is read from).
Why this route, among the documented ones:

| Route | Effect | Verdict |
| --- | --- | --- |
| `load artifacts` or `switch` | Copies the profile over the installed `references/style-guide.md`, so every project's diagrams change and an installed file is rewritten | No |
| Marker in a project root | Reads the profile directly, but adds a tracked-looking file to that project | Only if the user agrees |
| Marker in a throwaway build folder | Reads the profile directly; no installed file changes, no project gets a file, other projects keep their skin | Yes |
| `onboarding` or `save` | Rewrites the working copy or the library from a new source | No |

Never put the marker in this repository or in the user's project unasked. If a project already has its
own marker, leave it: the build folder's marker wins only for diagrams made there.

## Make the light and the dark SVG

1. Pick the type and read its reference, state the plan (type, size, cuts), as diagram-design asks.
   Use the `fit` size with a viewBox about 920 px wide, `min-width` equal to the viewBox width, and
   the scrolling wrapper from its template.
2. Copy `assets/template.html` of the installed skill into the build folder, build the diagram with
   the profile's **light** column, and set the fonts as the profile's font stack says: three `--font-*`
   lines in `:root`, the same families in each SVG `font-family`, and no Google Fonts `<link>`.
3. Copy `assets/template-dark.html`, keep the geometry exactly, and swap every colour to the
   **dark** column. Name the files `<name>.html` and `<name>-dark.html`; the file name is the SVG id
   prefix, so the two twins can share one page.
4. Export each, then remove the web-font import the exporter adds (the figure must not fetch anything
   when viewed), and run its self check:

   ```
   python3 <diagram-design>/scripts/export_svg.py <name>.html <name>.svg
   python3 <diagram-design>/scripts/export_svg.py <name>-dark.html <name>-dark.svg
   sed -i.bak -E "s/@import url\('[^']*'\);//" <name>.svg <name>-dark.svg && rm <name>.svg.bak <name>-dark.svg.bak
   python3 <diagram-design>/scripts/self_check.py <name>.html
   ```

   The type verifiers (`verify-waterfall.py` and its siblings) live only in diagram-design's repository
   checkout, not in the install. `verify-waterfall.py` knows only the default accent `#eb6c36`: run it on
   a copy with the profile's accent hex swapped, never on the original.
5. Look at both: the light SVG on `#ffffff` and the dark one on `#1d1d21`, labels readable, nothing
   clipped, connectors clear of other boxes. Fix, export again.

## Put it in a figure

```json
{ "type": "figure", "src": "figures/waterfall.svg", "dark": "figures/waterfall-dark.svg",
  "alt": "Open bugs: 42 at the start, 30 at the end, 27 fixed",
  "caption": "Fixes outran new reports by 12 bugs this sprint." }
```

Copy the two `.svg` files next to the page. Keep the `.html` source in the build folder.

## Examples to start from

Each pair has its source HTML and its exported light and dark SVG in
[`diagram-design/`](diagram-design/). Copy the HTML closest to your need and change its content.

| Need | Light | Dark | Notes |
| --- | --- | --- | --- |
| Architecture overview: a zone, fan-in connectors, a focal node | `architecture-overview.html` / `.svg` | `architecture-overview-dark.html` / `.svg` | Four tools into one block, each connector with its own attach point |
| Dense flow across lanes, handoffs and a loop back | `swimlane-flow.html` / `.svg` | `swimlane-flow-dark.html` / `.svg` | Three lanes, a dashed return path, one accent handoff |
| A chart type Pele lacks: waterfall | `waterfall.html` / `.svg` | `waterfall-dark.html` / `.svg` | Running total conserved; the numbers are illustrative |
