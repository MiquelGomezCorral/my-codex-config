# Page format

Field names, block shapes, and the export buttons of an artifact page. [SKILL.md](../SKILL.md) says when to read it.

## Data shape

Top level: `title`, optional `eyebrow` (small line above the title), `subtitle`,
`layout` (`"slides"` for a deck), `refresh` (seconds, 10 to 86400: the page reloads itself unless
the reader is using it), `statuses`, and `sections`. Each section has a `title`,
an optional `id` for links to it and `intro`, a list of `blocks`, and optional
`layout: "split"`, which puts its figures and any block with `side: true` on the right and
the other blocks on the left. A split section in a deck is a diagram slide. Outside a deck, every
section folds and unfolds on its heading; `collapsed: true` starts it folded, unless it changed
since the version the reader saw. Links to it unfold it. With two or more sections, "Collapse all" and
"Expand all" buttons in the sticky bar at the top fold or unfold every section at once. With three or more
sections (not in a deck), a Contents button at the top left opens a side index of the sections and
their block headings; it starts closed, and a link in it unfolds the section before the jump. The
same outline also appears as a contents list under the subtitle, with a reading time per section.
A sticky bar at the top holds the Contents button, the fold buttons and the export buttons.

Every text field accepts `` `code` ``, `**bold**`, `*italic*`, `<u>underline</u>`,
`[link](url)`, and blank lines between paragraphs. In fields that hold paragraphs (text blocks, callouts, card `text` and `inset`, details rows, finding fields, compare summaries, decision descriptions), lines starting `- `, `* `, `1. ` or `1) ` become a bulleted or numbered list, nested by indenting; a numbered list starts at the number written. Any block can take a `heading` that is shown above it, and, on a top-level block, listed under its section in the Contents index. A `tone`
is one of `ok`, `bad`, `warn`, `info`, or `muted`.

| Block `type` | Fields |
| --- | --- |
| `text` | `text` |
| `callout` | `title`, `text`, `tone` |
| `list` | `items` (strings, or `text` plus nested `items` and `ordered`), `ordered` |
| `stats` | `items` (`value`, `label`, `tone`); `auto: true` adds counts of finding statuses |
| `cards` | `items` (`title`, `text`, optional `status`, `icon`, and `inset`, a second explanation shown in a neutral inset). A `status` is a chip under the title: a word or two, since a label over 24 characters gets hover text, and the chip is cut with an ellipsis at 16em |
| `table` | `columns`, `rows` (arrays of cells; a cell is a string, or a chip: `{ text, tone, icon, title }`), `select` (adds a tick box per row; rows start ticked) |
| `matrix` | `columns` (strings, or `name` plus `note`), `groups` (`title`, `rows` of `label`, `note`, and `cells`, one list of chips per column, where a single chip or a string also works; a chip is `text`, `tone`, `icon`, and `title` for text shown on hover, focus or tap), `legend` (a line of text, or a list of chips and text that explain them). Chips stack one per line |
| `steps` | `items` (`title`, `text`, optional `icon`): A then B, numbered by the page, as a row when every `text` is 80 characters or less and the width allows, else as a vertical rail; `ordered: false` for parts of one change that ship together, as rows in one panel |
| `details` | `items` (`title`, `text`, optional `blocks`, `open`, `icon`, `preview`, a short line under the title) as collapsible rows |
| `inset` | `blocks` drawn inside a neutral inset |
| `findings` | `items` (`id`, `title`, `status`, `fields` of `label`/`text`, `quotes` of `text`/`source`, `open`) |
| `compare` | `options` (`name`, `summary`, `pros`, `cons`), `criteria` (`name`, `values` per option), `recommended` |
| `decisions` | `items` (`id`, `title`, `description`, `question`, `options`, `recommended`, `why`, optional `technical`; older items with only `question` and `context` still render) |
| `code` | `text` |
| `figure` | `src` (a file next to the page: image, `.html`, or `.mp4`/`.webm` video) or `mermaid` (Mermaid text, drawn on the page; no file), `dark` (an image shown instead of `src` in the dark theme), `caption`, `alt`, `source` (editable file or URL), `height` for HTML, optional `details` (`title`, `text`, `code`: a closed fold-out under the caption, as in a gallery item) |
| `gallery` | `items` (`src` or `mermaid`, `dark`, `caption`, `alt`: images, GIFs, videos, Mermaid diagrams, or `.html` plots with a `height`; each figure's media opens in the page's viewer (a plot from its maximize button; a video keeps its player); optional `details` (`title`, `text`, `code`) folds out under the caption, closed, with `code` as monospace lines that scroll inside the card) or `groups` (`title`, optional `note`, `items`: one titled row with a divider line per method or experiment), `width` (card width in px, default 320; cards keep it and never stretch, so it sets how many share a row on a full-width page: up to 334 for 3, 335 to 508 for 2, more for 1; phones show 1), `pixelated` (crisp upscaled pixel art) |
| `html` | `html`, only for a hand-drawn SVG or markup no other block covers |

An `icon` is a key of `icons.json`, the skill's Lucide catalog of 100 icons, and draws on cards, steps, details rows, and
chips; pick one by meaning from the [template guide](templates.md#icons-never-emoji). An unknown name draws
nothing, and `fill.py` warns about it. Never use emoji on a page: use an icon, and add a missing one as the
[template guide](templates.md#icons-never-emoji) says.

`statuses` maps each finding `status` key to a `label` and a `tone`. Without it, the keys
are `ok`, `bad`, `decide`, and `info`.

**Keep chips short.** A chip is a status label, not a sentence: card `status`, table cells,
and matrix chips hold a word or two ("Official", "Fail, seed 3"). Put the detail in the
card's `text` or `inset`, or in the chip's `title`, which shows on hover, focus and tap. A
card status over 24 characters gets its full text as hover text by itself, and the chip is cut
with an ellipsis at 16em (about 26 ordinary characters, fewer capitals); table and matrix chips are not cut, so a long one stretches its column and the table scrolls.

Use `select: true` when the user picks which rows to keep, such as a cleanup plan. Decision
picks, notes, and ticked rows are saved in the viewer's browser. They reach the agent only
when the user presses **Copy my decisions**, shown at the end of every section that holds a
`decisions` block or a `select` table, even inside `details`, and pastes the text back.
Copied rows list every cell, so keep rows distinct.

Every page follows the system light or dark theme. The button at the bottom right switches
it, and the viewer's browser keeps that choice for every artifact.

The page prints in the theme on screen, with folded sections and rows opened, the page controls
hidden, and galleries and split sections as on a desktop window. Paper is the desktop layout (1060px) on a sheet
the page sizes itself with `@page`, A4's shape but larger than A4: choose "fit to page" in the print dialog to get A4,
where text is about 7.5 pt.
Paper shows the contents list under the subtitle, open in full, and neither the side index nor the top bar. A deck prints every slide, one per page. A graph
in a frame can print empty from Ctrl+P, and on a narrow window Ctrl+P prints graphs stretched; for a PDF with every
graph, use "Export PDF" below, or `capture.mjs --pdf` (see [Live evidence](../SKILL.md#live-evidence)).

## Exporting a page

Every page has four buttons at the right of its sticky bar at the top, apart from the section index:

- **Export PDF** prepares the page, then opens the print dialog: light theme, every section and row
  open, every graph and Mermaid diagram loaded and drawn at the desktop layout width, the same sheet as Ctrl+P. Afterwards the page goes back as it was.
- **Export Markdown** downloads `<title-slug>.md` with the whole page as text. Image and graph
  paths stay as the page writes them, a Mermaid figure becomes a ```` ```mermaid ```` fence (GitHub draws it) with its caption below, and each row is a foldable `<details>`.
- **Export zip** downloads `<title-slug>.zip`: that `.md`, every file the page shows (figure and
  gallery `src`, `dark` and `source`, with their relative paths) and `data.json`. A file that cannot be
  fetched is left out and the page says how many. A framed `.html` figure's own files are not
  collected, so a plot that must travel in the zip or open from disk should be self-contained
  (Plotly: `include_plotlyjs=True`).
- **Copy Markdown** copies a plain version for a chat: no paths, no HTML, each figure one
  `[figure: caption]` line, each row a bold title over a quote.

The Markdown includes the reader's saved decision picks and notes. The converter lives in
`page.html`, so a page gets the buttons when it is rendered again. For the same text without a
browser and without the reader's saved picks, run `python3 <skill>/scripts/fill.py --markdown <dir>/data.json <out.md>` (needs Node).
[How each block becomes Markdown](templates.md#markdown-export).
