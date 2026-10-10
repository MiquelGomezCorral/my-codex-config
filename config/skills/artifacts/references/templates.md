# Template guide

Read the entry for your template before you fill it. Field names live in the data-shape
table in [SKILL.md](../SKILL.md); this guide says which template to pick, what it ships,
which block fits which content, and where fills go wrong. Every snippet is a complete page
that renders as written. Replace every value in it.

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

- **Replace every example value.** Delete the blocks and sections you do not use; never
  leave example text or an empty section.
- **Put an `id` on sections, findings, and decisions.** Ids keep section links and change
  marks stable when a title changes. Without one, a renamed title reads as one removed item
  plus one added.
- **Add new blocks at the end of a section.** Blocks match by position, so one inserted in
  the middle marks every block after it as changed.
- **Keep table rows distinct.** A row has no `id`: its key is all its cell text. Copied
  picks list every cell, and a row whose cell changes shows as one removed row plus one added.
- **Write a caption that states the takeaway.** "Recall by method" says what the figure is;
  "The tuned ranker passes the 90% line by 20k steps" says what to see.
- **Save media next to the page.** `src` and gallery `src` are paths relative to the
  `index.html`. Copy files in first, then render.
- **Open the page.** Check it at desktop and phone width: labels fit, nothing is clipped,
  no "Unknown block type" box. For the phone view run
  `google-chrome --headless=new --window-size=390,844 --screenshot=<file> <url>`; a taller
  window shows more of the page.

## report.json

For findings someone must read and judge: a test run, an audit, a review, the result gate
of a workflow.

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
              "title": "Expired session loops between `/login` and `/home`",
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

For experiment, benchmark, or training results over several runs, where the reader scans a
grid of pass and fail and then opens plots or GIFs. It is the page type a long run rewrites
as runs finish.

**Ships**
- **Header:** `eyebrow` with the update time, `subtitle` with the setup in one sentence.
- **Where we are:** `stats` with the run counts, a `list` of one bullet per phase, and a
  `callout` called "How to read the grids".
- **One section per phase:** a `matrix` summary grid, an "All runs" `table`, `figure`s for
  plots, and a `gallery` of GIFs.
- **Phase notes:** `details`, one row per section of your notes.

**Blocks**
- **Settings by method is a `matrix`.** Rows are settings, grouped by round or setting
  family; columns are methods; each cell holds one chip per run, stacked one per line. Hover
  text on a chip carries the detail that does not fit in it.
- **A baseline from an earlier phase or another method is one more column.** Add it to the
  matrix or the table and label it with where it comes from.
- **One line per run is a `table`.** A status cell draws a chip. Use `ok` for pass, `bad`
  for fail, `info` for still running.
- **A plot is a `figure`:** a PNG, or an HTML export from plotly, bokeh, or altair with a
  `height`.
- **GIFs and videos are a `gallery`.** Set `pixelated` only for upscaled pixel art.
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
          "legend": "✓ passed · ✗ failed · ⏳ running. One chip per seed; hover for the first passing step.",
          "columns": [{ "name": "Baseline", "note": "BM25 only" }, "Tuned ranker"],
          "groups": [
            {
              "title": "Round 1",
              "rows": [
                {
                  "label": "c1",
                  "note": "50k steps",
                  "cells": [
                    [{ "text": "✗ 62% s1", "tone": "bad", "title": "never reached 90%; 11 min" }],
                    [
                      { "text": "✓ 95% s1", "tone": "ok", "title": "first passed at 20k steps; 14 min" },
                      { "text": "⏳ 40% s2", "tone": "info", "title": "training, last check 71%" }
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
            ["Baseline", "round 1 · c1", "1", { "text": "✗ fail", "tone": "bad" }, "62%"],
            ["Tuned ranker", "round 1 · c1", "1", { "text": "✓ pass", "tone": "ok" }, "95%"]
          ]
        },
        {
          "type": "figure",
          "src": "recall.png",
          "caption": "The tuned ranker passes the 90% line by 20k steps; the baseline never gets there."
        },
        {
          "type": "figure",
          "src": "latency.html",
          "height": 380,
          "caption": "Query latency, from a plotly export: the tuned ranker costs about 4x the baseline."
        },
        {
          "type": "gallery",
          "heading": "Example queries",
          "width": 320,
          "items": [{ "src": "gifs/q1-tuned.gif", "caption": "Tuned ranker, query 1: rank 1 of 10" }]
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
  and label, so a renamed row reads as removed plus added. A table row is identified by all
  its cells, so a run whose progress changes shows as one removed row plus one added;
  progress that keeps changing reads better in a matrix chip.
- **Rewrite with `--keep-baseline` during a run.** Each rewrite then still compares with
  what the user last saw. Render without it when you present the page: that render becomes
  the new baseline.
- **Derive every number from the run files with a script, and keep the script.** Write
  down how each number is computed; never retype results.
- **Say when a plot was made.** A plot from a notebook shows the runs finished at that time,
  so put the time in the caption. A phase without a plot gets no `figure`.
- **Show the run counts, not just pass counts.** Runs still training are not failures.
- **Plot images keep their own background.** A white export shows as a light card in dark
  mode. Save with `savefig(transparent=True)` and mid-gray text and axes; default black text
  vanishes on the dark card.

## decisions.json

For questions only the user can answer. The page saves the picks in the user's browser, and
the user presses **Copy my decisions** and pastes the text back to you.

**Ships**
- **Context:** a `callout` that says why the answer is needed now.
- **Decisions:** a `decisions` block, with the recommended option preselected.

**Blocks**
- **One question is one `decisions` item** (fields in SKILL.md).
- **Rows to keep or drop go in a `table` with `select: true`.** Use it for a cleanup list.
  The copy bar appears at the end of any section that holds either block.

```json
{
  "eyebrow": "Decisions needed",
  "title": "Search rollout choices",
  "subtitle": "Pick an option for each question, then press Copy my decisions and paste the result back.",
  "sections": [
    {
      "id": "decisions",
      "title": "Decisions",
      "blocks": [
        {
          "type": "decisions",
          "items": [
            {
              "id": "D1",
              "question": "How should the rollout start?",
              "context": "A flag lets us turn it off without a deploy.",
              "options": ["Behind a flag for 10% of users", "Everyone at once"],
              "recommended": "Behind a flag for 10% of users"
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
- **Keep your own opinion in `recommended`, not in the context.** Leave a question open
  when you have no recommendation.
- **Renaming the page `title` or moving the file drops saved picks.** The browser keeps
  them under the page address and title.
- **You only see the picks the user pastes back.** Do not read the page as an answer.

## comparison.json

For a choice between two to four approaches, where the reader needs the trade-offs and your
recommendation, but you do not need saved picks.

**Ships**
- **Options:** a `compare` block with a card per option and a criteria table.
- **What users would see:** a `figure`, usually a small HTML mockup with `height`.
- **Recommendation:** a `callout` with `tone: "ok"`.

**Blocks**
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

For how a system or concept works, written for someone who was not there when it was built.

**Ships**
- **In short:** a `callout` with the answer in one or two sentences.
- **The flow:** a `steps` block, then `details` rows for the questions each step raises.
- **Where it runs:** a `split` section with text and a list on the left and a `figure` on
  the right.
- **FAQ:** `details` rows.
- **Glossary:** a `table` of term and meaning.

**Blocks**
- **Three to six steps in a line are `steps`.** Each has a short title and one line.
- **Depth goes in `details`.** The title is the reader's question; a `preview` is a short
  line under the title, open or closed.
- **Side by side is `layout: "split"`.** Figures and blocks with `side: true` go right.
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
- **Steps are one line, left to right.** A flow with branches or loops goes in a diagram.
- **Use the terms the glossary defines.** Define a term once; do not rename it later.
- **Three or more sections add a nav bar.** Section `id`s keep its links stable across
  renames.

## slides.json

For a short deck presented or read one screen at a time. Arrow keys or space move between
slides; the URL hash holds the slide number.

**Ships**
- **A title slide** from `title`, `eyebrow`, and `subtitle`.
- **One slide per section:** numbers as `stats`, points as a `list`, a diagram slide as a
  `split` section, and a closing `steps` block.

**Blocks**
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

For a complete Markdown plan that the user must review before approving. It is not page
data: it is a review brief that `scripts/render-plan.mjs` merges with the plan.

```
node scripts/render-plan.mjs --input plan.md --review review.json --output plan.html
```

Start from `templates/plan-review.json`. The fields, the writing rules for the brief, and
the icon list are in [plan-page.md](plan-page.md); do not repeat them here.

**Pitfalls**
- **Do not pass the brief to `fill.py`.** It has no `sections`, so the page shows only the title.
- **The brief does not replace the plan.** Compare it with the full plan before you show
  the page.
- **Render a revision to the same output path** so the page marks what changed.
