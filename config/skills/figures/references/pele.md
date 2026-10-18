# Pele

Pele draws Mermaid text as SVG with its own layout and no network. It is the first choice for
flows, sequences, state, ER, schedules, mind maps and simple charts. The source stays editable text.

- Version 1.6.0 (npm `pele`, MIT, obsidianmd/pele), vendored and pinned in
  `assets/pele/pele.global.js` with its `LICENSE`. Never edit the bundle and never load it from a CDN.
- `assets/pele/pele-embed.js` themes the diagrams and draws every `pre.mermaid` on a page.
- Pele supports every diagram type of Mermaid 12.1.0 plus some of its own (the Pele column of [catalog.md](catalog.md)).
  ZenUML and other external Mermaid plugins are not supported.

## Write Mermaid for Pele

Plain Mermaid works. Where Pele differs:

- **Layout is its own.** Node positions and edge routes differ from Mermaid's. Do not tune the
  source to a Mermaid screenshot; render it and look.
- **Colours come from CSS variables.** `style`, `classDef` and `linkStyle` colours are fixed and
  do not follow the light or dark theme, so leave them out. Show emphasis with structure
  (subgraphs, labels, shapes, line styles) and let the theme colour it.
- **No HTML labels.** Labels are SVG text with line breaks, bold and italic. `<br/>` works;
  `<span style=...>` does not.
- **Links are `click` statements** that open a URL. JavaScript callbacks are ignored.
- **Narrow screens:** `mount()` re-renders at the container width, and a wide flowchart can switch
  to a vertical layout (breakpoint 640 px). Keep labels short; the phone view is a check, not an
  afterthought.
- **Limits:** 50,000 characters of source, 5,000 edges in a flowchart or agentflow, 4,000,000
  characters of SVG. Split a bigger diagram into an overview and details.
- **Frontmatter** (`---` `config:` ...) and `%%{init}%%` work for type options (for example
  `xyChart`, `gantt`). Do not put `theme`, `look` or colours in them. When an example starts with a
  `---` config block or `%%{init}%%`, keep it inside `figure.mermaid`, as the first lines.

## On an artifact page

Put the Mermaid text in a figure instead of a file:

```json
{ "type": "figure", "mermaid": "flowchart LR\n  A[Request] --> B{Cached?}\n  B -->|yes| C[Serve]\n  B -->|no| D[Fetch] --> C", "caption": "Cache hits skip the fetch." }
```

Also in gallery items; `source` and `details` work as on any figure. The page inlines the engine and the theme script only when a page has a
Mermaid figure, redraws on the theme toggle without a reload, draws it inside folded sections when
opened, shows a syntax error in place of the diagram, and exports the text as a `mermaid` fence in
the Markdown. See the `artifacts` skill for the field list.

## In any HTML

Load the engine, then the drop-in, and write each diagram in a `pre.mermaid`. Both files sit in
`assets/pele/` of this skill. Copy them beside the HTML, or paste their text into two inline
`<script>` blocks to get one self-contained file (a sandboxed frame or an attachment cannot load a
sibling script from disk).

```html
<pre class="mermaid">
flowchart LR
  A[Request] --> B{Cached?}
  B -->|yes| C[Serve]
  B -->|no| D[Fetch] --> C
</pre>
<script src="pele.global.js"></script>
<script src="pele-embed.js"></script>
```

- The drop-in draws every `pre.mermaid` when the page has loaded. For a diagram added later, call
  `peleEmbed.mountAll(container)`; after a layout change that fires no resize, call
  `peleEmbed.refreshAll()`.
- `pre.mermaid` gets `background: var(--pele-bg)`, so a themed diagram stays readable on an unthemed
  page. Variables are set on `pre.mermaid` and `.pele`; mounted elements carry `data-pele-mounted`;
  the stylesheet has the id `pele-embed-style`. Pele's zoom buttons are off (`zoom: false`).
- It sets `data-theme` on the root from `?theme=light|dark` in the page address, so a page inside an
  artifact `figure` frame follows the page. Without the parameter it follows
  `prefers-color-scheme`. A page that already sets `data-theme` on `<html>` keeps it.
- Inside `pre` the browser parses HTML first: write `<` as `&lt;` and `&` as `&amp;` (so a `<br/>` line break is `&lt;br/&gt;`). `-->` needs no escape. In an artifact `figure` the text is a JSON string and needs none of this.
- The error of a bad source shows in place of the diagram. Check sources first (below).

## Both themes

The drop-in maps Pele's variables to the artifact page tokens. A page that defines those tokens
(artifact pages do) switches with them; any other page gets the literals. Light is the default;
dark applies under `prefers-color-scheme: dark` and under `data-theme="dark"`.

| Pele variable | Page token | Light | Dark |
| --- | --- | --- | --- |
| `--pele-bg` | `--card` | `#ffffff` | `#1d1d21` |
| `--pele-fg` | `--ink` | `#1d1d1f` | `#ececf0` |
| `--pele-muted` | `--muted` | `#6b6b70` | `#a0a0aa` |
| `--pele-line` | `--muted-tone` | `#5b5b66` | `#b9b9c4` |
| `--pele-surface` | `--mutedbg` | `#ececf0` | `#2a2a30` |
| `--pele-surface-alt` | `--bg` | `#f7f7f5` | `#141416` |
| `--pele-border` | `--muted` | `#6b6b70` | `#a0a0aa` |
| `--pele-accent` | `--acc` | `#2f5bd3` | `#8fb0ff` |
| `--pele-critical`, `--pele-error` | `--bad` | `#b3261e` | `#ff8a80` |
| `--pele-font` | page font | `system-ui,-apple-system,"Segoe UI",Roboto,sans-serif` | same |
| `--pele-series-1` to `-8` | none | `#2f5bd3 #d96f00 #1f7a4d #b3261e #b03a9a #1b7f8c #6b52c0 #8a6d3b` | `#8fb0ff #ffa24d #5fd394 #ff8a80 #e58ad2 #5ccfdc #b9a2ff #d8b56b` |

To theme Pele without the drop-in (your own page), set the same variables on `.pele` or an ancestor
and override them for dark. Pele has no theme switch: the variables are the whole interface, and a
change needs no redraw.

```css
.pele { --pele-bg: #ffffff; --pele-fg: #1d1d1f; /* ... the rest of the light column */ }
:root[data-theme="dark"] .pele { --pele-bg: #1d1d21; --pele-fg: #ececf0; /* ... the dark column */ }
```

## Check a source

Render the source with the vendored bundle before it goes on a page:

```
node <this skill>/scripts/check-mermaid.mjs diagram.mmd notes.md
echo 'flowchart TD; A-->B' | node <this skill>/scripts/check-mermaid.mjs -
```

A `.md` or `.markdown` file is checked fence by fence (every `mermaid` block, also indented, quoted
or in a list item, as the artifact Markdown export writes them); any other file is one source. Each
source prints `OK file:block N` or `file:block N:line:column message` (line and column inside the
source). A file that cannot be read prints `file: cannot read (ENOENT)` and fails; the rest still
run. A Markdown file with no `mermaid` block prints `file: no mermaid block` and does not fail.
The exit code is 1 when any source or file fails. Needs Node 22 and nothing else. A pass means the
syntax parses and lays out; still look at the picture.

## Pick the type and start from its example

Do not write a type from memory. Find your figure in [catalog.md](catalog.md): its Pele column
names the keyword and links the example file. Open that file and start from its example. Each file
holds the pele.run examples with only their theme, colour-scheme, font and log settings removed, so
they follow the page; everything else is as published. A figure with no Pele cell is not a Pele type:
take the next tool the catalog names.

The full gallery with edge cases is at https://pele.run/examples. Pele docs: https://pele.run/api, /theming, /security, /compatibility.
