# Template guide

Read the entry for your template before you fill it. Field names live in the data-shape
table in [SKILL.md](../SKILL.md); this guide says which template to pick, what it ships,
which block fits which content, and where fills go wrong. Every snippet is a complete page
that renders as written.

## Pick a template

| The reader should | Template | Not |
| --- | --- | --- |
| Judge findings from a test, audit, or review, each with a verdict and evidence | [`report.json`](#reportjson) | `results.json`: that is a grid of runs. `decisions.json`: that asks questions |
| Read pass/fail results of many runs, with plots and GIFs, and watch them fill in | [`results.json`](#resultsjson) | `report.json`: its rows are findings, not runs |
| Answer questions and send the picks back | [`decisions.json`](#decisionsjson) | `comparison.json`: it shows trade-offs but saves no picks |
| Choose between two to four approaches | [`comparison.json`](#comparisonjson) | `decisions.json`: it saves picks but explains no trade-offs |
| Understand how a system or concept works | [`explainer.json`](#explainerjson) | `slides.json`: one screen at a time, for presenting |
| Be walked through a few points, one screen each | [`slides.json`](#slidesjson) | `explainer.json`: it scrolls and holds long reading |
| Review a Markdown plan before approving it | [`plan-review.json`](#plan-reviewjson) | the others: they would copy the plan; this brief is merged with it by `render-plan.mjs` |

When no template fits, take the closest one and add blocks from another. Any section can
use any block.

## Before you render, for every template

- **Lead with plain words.** The plain-first rule at the top of SKILL.md applies to every
  page; each entry below says where its two layers go.
- **Put an `id` on sections, findings, and decisions.** Ids keep section links and change
  marks stable when a title changes. Without one, a renamed title reads as one removed item
  plus one added.
- **Fold long reference sections.** Every section folds on its heading. Set
  `collapsed: true` on one the reader rarely needs open, such as a long gallery or raw data;
  it still opens by itself when it changed, from a link to it, or with "Show only changes".
- **Add new blocks at the end of a section.** Blocks match by position, so one inserted in
  the middle marks every block after it as changed.
- **Keep table rows distinct.** A row has no `id`: its key is all its cell text, so a row
  whose cell changes shows as one removed row plus one added.
- **Save media next to the page.** `src` and gallery `src` are paths relative to the
  `index.html`. Copy files in first, then render.
- **Open the page.** Check it at desktop and phone width: labels fit, nothing is clipped,
  no "Unknown block type" box. For the phone view use `--width 390`, as
  [SKILL.md](../SKILL.md#live-evidence) sets out.

## Icons, never emoji

For a run: `circle-check` with tone `ok` passed, `circle-x` with `bad` failed, `loader-circle`
with `info` running, `circle-dashed` with `muted` not started.

Give every card, step, and details row an icon that says what it is about, not a generic
document. Each entry in `icons.json` has a `label` and a `category`; the catalog, by category:

- **Status:** `circle-check` passed, `circle-x` failed, `loader-circle` running,
  `circle-dashed` not started, `circle-alert` partial, `triangle-alert` risk, `info`,
  `circle-help` question or FAQ.
- **Decisions and goals:** `scale` trade-off, `thumbs-up` adopted, `thumbs-down` rejected, `ban`
  out of scope, `target` goal, `flag` gate or milestone, `lightbulb` idea or lesson, `compass`
  planning.
- **Changes:** `circle-plus` added, `circle-minus` removed, `git-compare` before and after,
  `history` earlier version, `rotate-ccw` retry, `refresh-cw` rebuild, `trash-2` deleted, `trending-up`,
  `trending-down`.
- **Plans and work:** `clipboard-list`, `clipboard-check` readiness, `list-checks`
  requirements, `list-ordered` steps, `list`, `notebook-pen` notes or memory, `book-open`
  context or guide, `workflow`, `rocket` delivery.
- **Code:** `file-code`, `file-text` prose document, `files`, `folder`, `terminal` command or
  output, `bug`, `wrench` fix, `git-branch`, `git-commit-horizontal`, `git-merge`,
  `git-pull-request`, `settings`, `sliders-horizontal` parameters, `package`, `package-x`,
  `puzzle` module.
- **Data and results:** `database`, `table`, `chart-line`, `chart-column`, `sigma` formula,
  `filter` rank, `search`, `save`, `images`, `gauge` performance, `repeat` several runs,
  `dice-5` seed, `shuffle` procedural, `flask-conical` experiment or test.
- **Systems:** `server`, `cpu`, `memory-stick`, `cloud`, `globe`, `network`, `monitor`,
  `panels-top-left` page, `layers`, `plug` integration, `unplug`, `link`, `zap`, `clock`,
  `calendar`, `activity` live behavior.
- **People and access:** `users`, `user`, `bot` agent, `brain` model reasoning, `key-round`
  credentials, `lock`, `shield-check`, `shield-alert`, `eye` shown, `eye-off` hidden, `tag` name.
- **Messages and media:** `message-square-text` prompt or note, `mail`, `bell` reminder,
  `bell-off` muted, `mic` audio, `play` video.
- **Environments:** `gamepad-2`, `map`, `grid-3x3` layout.

`fill.py` warns about an icon name the catalog lacks, because the page draws nothing for it.

To add a Lucide icon the catalog lacks:

1. Fetch `https://unpkg.com/lucide-static@0.460.0/icons/<name>.svg`. Use that version for every
   icon so the strokes match.
2. Keep every shape inside its `<svg>`; drop the license comment and the `class` attribute, and
   put the shapes in this wrapper, on one line:
   `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">...</svg>`.
3. Add `"<name>": { "label": "<what it means>", "category": "<one of the groups above>", "svg": "<that line>" }`
   to `icons.json`, and add the name to its group above. That file is shared by every page and
   plan page, so name the icon you added in your report.
4. Render a page that uses it and look at it: a chip draws it at 14 px.

## report.json

**Ships**
- **Summary:** `stats` with `auto: true`, then a `list` of the main points.
- **Findings:** one `findings` block, most important first, then a `figure` for the
  finding it explains.
- **Live evidence:** one `findings` row per live test with `Ran on` and `Evidence`, then the
  screenshots or videos as `figure`s.
- **Next steps:** a `table` of step, owner, and why.

**Blocks**
- **One finding is one `findings` row.** What we did, what we expected, and what happened
  go in its fields; verbatim text goes in its quotes. Rows open on click.
- **Plain first** (rule in SKILL.md): a finding's title says in plain words what happened;
  the mechanics go in its fields and quotes.
- **Counts come from `stats` with `auto: true`.** Do not type totals.
- **Live evidence is one `findings` row per live test.** `Ran on` is the commit, or the
  snapshot name when nothing is committed; `Evidence` names the screenshot or video, captured
  with `scripts/capture.mjs`.

```json
{
  "eyebrow": "Audit · 2026-10-06",
  "title": "Login flow audit",
  "subtitle": "Two checks: one failed, one passed.",
  "sections": [
    { "id": "summary", "title": "Summary", "blocks": [{ "type": "stats", "auto": true }] },
    {
      "id": "findings",
      "title": "Findings",
      "blocks": [
        {
          "type": "findings",
          "items": [
            {
              "id": "F1",
              "title": "Expired session redirect loop",
              "status": "bad",
              "fields": [
                { "label": "Expected", "text": "One redirect to `/login`." },
                { "label": "What happened", "text": "Five redirects, then the browser stopped the loop." }
              ],
              "quotes": [{ "text": "ERR_TOO_MANY_REDIRECTS", "source": "Chrome, turn 3" }]
            },
            {
              "id": "F2",
              "title": "Lockout after five failed attempts",
              "status": "ok",
              "fields": [{ "label": "What happened", "text": "Locked on the fifth failure, as expected." }]
            }
          ]
        },
        {
          "type": "figure",
          "src": "loop.png",
          "caption": "F1: the guard sends an expired session to `/login`, which sends it straight back."
        }
      ]
    }
  ]
}
```

**Pitfalls**
- **`statuses` replaces the default map, it does not extend it.** List every status key you
  use, as the template does for `no-evidence`. A key left out draws a grey pill named after
  the key.
- **A live test with no evidence takes the red `no-evidence` status, never `ok`.** Keep it
  in the list.
- **`auto` counts every `findings` row placed directly in a section.** Live-evidence rows
  count too, so the total is findings plus live tests. A `findings` block inside `details`
  or `inset` is not counted.
- **Quotes are verbatim.** Keep the turn number or source.

## results.json

**Ships**
- **Header:** `eyebrow` with the update time, `subtitle` with the setup in one sentence.
- **Where we are:** `stats` with the run counts, a `list` of one bullet per phase, and a
  `callout` called "How to read the grids".
- **One section per phase:** a `matrix` summary grid, an "All runs" `table`, `figure`s for
  plots, and a `gallery` of GIFs.
- **Phase notes:** `details`, one row per section of your notes.

**Blocks**
- **Plain first** (rule in SKILL.md): "Where we are" and the callout lead in plain words;
  the grid, table, and plots follow.
- **Settings by method is a `matrix`.** Rows are settings, grouped by round or setting
  family; columns are methods; each cell holds one chip per run, stacked one per line. Hover
  text on a chip carries the detail that does not fit in it.
- **A baseline from an earlier phase or another method is one more column.** Add it to the
  matrix or the table and label it with where it comes from.
- **Run status is an icon chip** (see [Icons, never emoji](#icons-never-emoji)): the `icon`
  and `tone` say pass, fail, or running, and the text holds the score and the seed. The
  `legend` is a list of the same chips, each with its meaning as its text.
- **One line per run is a `table`.** Its status cell is the same chip.
- **A plot is a `figure`.** The plot row in [SKILL.md](../SKILL.md#diagrams-and-illustrations)
  says how to make it and what goes in `src`.
- **GIFs and videos are a `gallery`.** With several methods or experiments, use `groups`, one
  per method: each gets a title, a divider line, and its own wrapping row, so runs of
  different methods never mix. Plots of several experiments can use the same groups: give
  each item an `.html` `src` and a `height`, and the block a `width` near 500. Set `pixelated`
  only for upscaled pixel art.
- **Pick the gallery `width` for the cards per row you want.** Cards keep that width and
  never stretch. On a full-width page, up to 334 fits 3 per row, 335 to 508 fits 2, and more
  gives 1 per row; phones always show 1. A width between those steps leaves empty space at
  the end of each row.
- **Text that belongs to one picture folds out under it.** Give the gallery item `details`
  (`title`, and `text` or `code`), such as a reward machine's transitions under its graph. It
  starts closed and keeps to the card's width; a separate `details` block would lose which text
  goes with which picture.
- **A page rewritten during a long run sets `refresh`.** Drop it once the runs are done.

```json
{
  "eyebrow": "Ranker experiments · updated 2026-10-10 14:20",
  "title": "Ranker experiments",
  "subtitle": "Two rankers on a 20k-document corpus, three seeds each.",
  "sections": [
    {
      "id": "phase-1",
      "title": "Phase 1 · Small corpus",
      "intro": "Can each ranker reach 90% recall@10? Pass means the finished model does.",
      "blocks": [
        {
          "type": "matrix",
          "heading": "Summary",
          "legend": [
            { "icon": "circle-check", "text": "passed", "tone": "ok" },
            { "icon": "circle-x", "text": "failed", "tone": "bad" },
            { "icon": "loader-circle", "text": "running, % done", "tone": "info" }
          ],
          "columns": [{ "name": "Baseline", "note": "BM25 only" }, "Tuned ranker"],
          "groups": [
            {
              "title": "Round 1",
              "rows": [
                {
                  "label": "c1",
                  "note": "50k steps",
                  "cells": [
                    [{ "icon": "circle-x", "text": "62% s1", "tone": "bad", "title": "never reached 90%; 11 min" }],
                    [
                      { "icon": "circle-check", "text": "95% s1", "tone": "ok", "title": "first passed at 20k steps; 14 min" },
                      { "icon": "loader-circle", "text": "40% s2", "tone": "info", "title": "training, last check 71%" }
                    ]
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "table",
          "heading": "All runs",
          "columns": ["Method", "Setting", "Seed", "Status", "Final score"],
          "rows": [
            ["Baseline", "round 1 · c1", "1", { "icon": "circle-x", "text": "fail", "tone": "bad" }, "62%"],
            ["Tuned ranker", "round 1 · c1", "1", { "icon": "circle-check", "text": "pass", "tone": "ok" }, "95%"]
          ]
        },
        {
          "type": "figure",
          "src": "recall.html",
          "height": 420,
          "caption": "The tuned ranker passes the 90% line by 20k steps; the baseline never gets there. Plotly export, 2026-10-10 14:20."
        },
        {
          "type": "gallery",
          "heading": "Example queries",
          "width": 320,
          "groups": [
            { "title": "Baseline", "items": [{ "src": "gifs/q1-baseline.gif", "caption": "Query 1: rank 7 of 10" }] },
            { "title": "Tuned ranker", "items": [{ "src": "gifs/q1-tuned.gif", "caption": "Query 1: rank 1 of 10",
              "details": { "title": "Ranked list", "code": "1  q1-doc-04  0.93\n2  q1-doc-11  0.88" } }] }
          ]
        }
      ]
    }
  ]
}
```

**Pitfalls**
- **Give each column its own list of chips.** Do not flatten the chips of a row into one
  list; the snippet shows the shape.
- **Put the seed in the chip text.** A cell with several runs must say which is which.
  Say what the chip means in the `legend`.
- **Keep row labels stable between renders.** A matrix row is identified by its group title
  and label, so a renamed row reads as removed plus added. Progress that keeps changing
  reads better in a matrix chip than in a table row.
- **Rewrite with `--keep-baseline` during a run.** Each rewrite then still compares with
  what the user last saw. Render without it when you present the page: that render becomes
  the new baseline.
- **Derive every number from the run files with a script, and keep the script.** Write
  down how each number is computed; never retype results.
- **Show the run counts, not just pass counts.** Runs still training are not failures.

## decisions.json

**Ships**
- **Context:** a `callout` that says why the answer is needed now.
- **Decisions:** a `decisions` block, with the recommended option preselected.

**Blocks**
- **Plain first** (rule in SKILL.md): keep ids, flags, and commands out of the description;
  they go in `technical`.

```json
{
  "eyebrow": "Decisions needed",
  "title": "Search rollout choices",
  "subtitle": "Pick an option for each decision, then press Copy my decisions and paste the result back.",
  "sections": [
    {
      "id": "decisions",
      "title": "Decisions",
      "intro": "The recommended option is preselected. Your picks are saved in this browser.",
      "blocks": [
        {
          "type": "decisions",
          "items": [
            {
              "id": "D1",
              "title": "Who sees the new search first?",
              "description": "The new index is ready. This decides how many people get the new search on day one, and how fast we can switch it off if results look wrong.",
              "question": "How should the rollout start?",
              "options": ["Behind a flag for 10% of users", "Everyone at once"],
              "recommended": "Behind a flag for 10% of users",
              "why": "A small group is enough to show problems early, and the flag turns the new search off in seconds without a deploy.",
              "technical": "The flag `search_v2` is read on every request and assigns a user to a bucket by user id, so the same people keep seeing the new search between visits."
            }
          ]
        }
      ]
    }
  ]
}
```

**Pitfalls**
- **Give every decision a unique, stable `id`** (`D1`, `D2`). Saved picks and copied text
  use it.
- **Copy `recommended` exactly from `options`.** The match is by text; a mismatch
  preselects nothing.
- **Write each option as the full answer.** The copied text carries the option's words, not
  a number.
- **Put the reason for your recommendation in `why`.** Do not repeat the option's name.
  Leave `recommended` and `why` out when you have no recommendation.
- **The title is a short question; the `question` is the same ask, spelled out.** "Push the
  three commits?" is the title, "Push `consolidate-agent-skills` to origin?" the question.
  The description says what is decided and why it matters, so do not repeat it in the
  question.
- **Renaming the page `title` or moving the file drops saved picks.** The browser keeps
  them under the page address and title.

## comparison.json

**Ships**
- **Options:** a `compare` block with a card per option and a criteria table.
- **What users would see:** a `figure`, usually a small HTML mockup with `height`.
- **Recommendation:** a `callout` with `tone: "ok"`.

**Blocks**
- **Plain first** (rule in SKILL.md): an option's summary says in plain words what it is;
  the pros, cons, and criteria carry the detail.
- **Each approach is one option card.** Keep pros and cons short.
- **`criteria` is the table under the cards**, one row per thing you compare.
- **A recommendation is `recommended` plus a callout** that gives the deciding reason.

```json
{
  "eyebrow": "Options",
  "title": "Where to store session state",
  "subtitle": "Two approaches compared on what matters for this change.",
  "sections": [
    {
      "id": "options",
      "title": "Options",
      "blocks": [
        {
          "type": "compare",
          "recommended": "Redis",
          "options": [
            {
              "name": "Redis",
              "summary": "Shared store already used for rate limits.",
              "pros": ["Already deployed", "Survives app restarts"],
              "cons": ["One more dependency on the request path"]
            },
            {
              "name": "Signed cookie",
              "summary": "State travels with the browser.",
              "pros": ["No server storage"],
              "cons": ["4 KB limit", "Cannot revoke one session"]
            }
          ],
          "criteria": [
            { "name": "Revoke one session", "values": ["Yes", "No"] },
            { "name": "Extra latency", "values": ["~1 ms", "None"] }
          ]
        }
      ]
    },
    {
      "id": "recommendation",
      "title": "Recommendation",
      "blocks": [
        {
          "type": "callout",
          "tone": "ok",
          "title": "Use Redis",
          "text": "It is the only option that is already running and can revoke a single session."
        }
      ]
    }
  ]
}
```

**Pitfalls**
- **`recommended` must equal an option `name`.** The card gets the border and the badge
  only on an exact match.
- **`values` follows the option order.** One value per option; a missing value leaves the
  row short.
- **Compare the same things across options.** Use numbers where you have them.
- **Name each option for what it is.** The name is also the column header.
- **A comparison saves nothing.** When the user must choose, add a `decisions` block.

## explainer.json

**Ships**
- **In short:** a `callout` with the answer in one or two sentences.
- **The flow:** a `steps` block, then `details` rows for the questions each step raises.
- **Where it runs:** a `split` section with text and a list on the left and a `figure` on
  the right.
- **FAQ:** `details` rows.
- **Glossary:** a `table` of term and meaning.

**Blocks**
- **Plain first** (rule in SKILL.md): the TL;DR is the plain layer; the `details` rows hold
  the mechanics.
- **Three to six steps in order are `steps`.** Each has a short title and a short text; when
  every text is short and the width allows, the page draws a row.
- **Depth goes in `details`.** The title is the reader's question.
- **Branching flows and architecture are figures** made with `diagram-design`, not `steps`.

```json
{
  "eyebrow": "How it works",
  "title": "How the job queue retries work",
  "subtitle": "For someone who was not there when it was built.",
  "sections": [
    {
      "id": "tldr",
      "title": "In short",
      "blocks": [
        {
          "type": "callout",
          "tone": "info",
          "title": "TL;DR",
          "text": "A failed job goes back to the queue with a growing delay, up to five tries, then lands in the dead-letter table."
        }
      ]
    },
    {
      "id": "flow",
      "title": "The flow",
      "blocks": [
        {
          "type": "steps",
          "items": [
            { "title": "Enqueue", "text": "API writes the job row" },
            { "title": "Run", "text": "Worker picks the oldest due job" },
            { "title": "Retry", "text": "On failure, delay doubles" }
          ]
        },
        {
          "type": "details",
          "items": [
            {
              "title": "Where the delay is computed",
              "text": "`retry_delay()` in `queue/worker.py` doubles from 30 s, capped at 1 hour."
            }
          ]
        }
      ]
    }
  ]
}
```

**Pitfalls**
- **The TL;DR must stand alone.** A reader who stops there should still know the answer.
- **Steps mean A, then B.** The page picks a row or a rail. Parts of one change that ship
  together, not in sequence, take `"ordered": false`. A flow with branches or loops goes in
  a diagram.
- **Use the terms the glossary defines.** Define a term once; do not rename it later.
- **Three or more sections add a nav bar.** Section `id`s keep its links stable across
  renames.

## slides.json

The URL hash holds the slide number, so a link can open a given slide.

**Ships**
- **A title slide** from `title`, `eyebrow`, and `subtitle`.
- **One slide per section:** numbers as `stats`, points as a `list`, a diagram slide as a
  `split` section, and a closing `steps` block.

**Blocks**
- **Plain first** (rule in SKILL.md): a slide shows a plain title and one idea; the
  technical layer lives in the report or explainer behind the deck.
- **One idea per slide.** A section is one slide, so keep it to one or two blocks.
- **A diagram slide is a `split` section:** the list on the left, the `figure` on the
  right.

```json
{
  "layout": "slides",
  "eyebrow": "Weekly · 2026-10-06",
  "title": "Team sync",
  "subtitle": "Use the arrow keys or space to move between slides.",
  "sections": [
    {
      "id": "where",
      "title": "Where we are",
      "blocks": [
        {
          "type": "stats",
          "items": [
            { "value": "92%", "label": "Queries answered under 200 ms", "tone": "ok" },
            { "value": "3", "label": "Open bugs", "tone": "warn" }
          ]
        }
      ]
    },
    {
      "id": "next",
      "title": "Next",
      "blocks": [
        {
          "type": "steps",
          "items": [
            { "title": "This week", "text": "10% rollout" },
            { "title": "Next week", "text": "Everyone" }
          ]
        }
      ]
    }
  ]
}
```

**Pitfalls**
- **Set `layout: "slides"` at the top level.** Without it the sections stack as a page.
- **A slide that overflows the screen scrolls.** Cut it, or put the long table in a report.
- **Slide titles carry the point.** "Results update within one minute" beats "Update".
- **The nav bar and "Show only changes" are off in slides.** A revision still lists its
  changes at the top of the first slide.

## plan-review.json

Not page data: a review brief that `render-plan.mjs` merges with the plan. The command, the
fields, and the writing rules are in [plan-page.md](plan-page.md); start from
`templates/plan-review.json`.

**Pitfalls**
- **Do not pass the brief to `fill.py`.** It has no `sections`, so the page shows only the title.
