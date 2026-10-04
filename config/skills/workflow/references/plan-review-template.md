# Plan review brief

Use this small file for the human-facing view of a complete Markdown plan. The brief
does not replace the plan, summarize it automatically, or change its approval boundary.

Start from [the example](../templates/review.example.json) and render it beside the plan:

`node "$HOME/.agents/skills/workflow/scripts/render-plan.mjs" --input plan.md --review review.json --output plan.html`

The renderer keeps only supplied brief content. Agents compare it with the full plan
before presenting the page.

## Fields

- `title`, `summary`: a short name and intended outcome.
- `actions`: one or more `{ "title", "description", "technical?", "icon?" }` entries. Titles use 2–10 words.
- `success`: expected outcomes in the same entry shape. These are not completed checks.
- `boundary`: what this approval covers.
- `risks`, `questions`: optional arrays in the same entry shape; include material items only.
- `actionsIntro`, `risksIntro`: optional context before those lists. Explain how the actions fit together and what affects delivery or confidence.
- `details`: optional `{ "intro", "groups" }` presentation metadata. When used, provide a non-empty intro and groups. Each group has a non-empty `title` and one or more `sections`; each section names one exact, unique Markdown H2 in `heading`, gives a non-empty `summary` preview, and may set a catalog `icon` or boolean `layered`.
- `artifacts`: optional related visuals or files. Each needs a `title` and `caption`, then
  either a `steps` array of at least two `{ "title", "icon?" }` entries, or a local `path`.
  A path may include an editable `sourcePath`; `placement` is `side` by default or `wide`.

## Writing the explanations

- Use the [writing skill](../../writing/SKILL.md) for brief text and full-plan Markdown. Give explanatory bullets meaningful, self-contained labels.
- Give actions, expected outcomes, risks, and questions a clear description. Any can include a `technical` Markdown string when it adds distinct mechanics, evidence, or a useful scenario. It stays visible in a neutral inset without a repeated label; do not pad entries that need no second explanation.
- Use actor, trigger, state change, stopping point, scenarios, reuse, and cost as lenses, not a checklist. Include supported details only when they help readers predict behavior; a simple static change may need one plain paragraph. Explain uncertainty when it affects the decision.
- Define unfamiliar project terms by saying what they refer to and what they do. Use backticks for named operations such as `restore reads` as well as code identifiers; the renderer gives them a pale blue accent in the surrounding typography. Do not mark ordinary prose indiscriminately or invent a definition the plan does not support.
- Use `*text*` or `_text_` for restrained emphasis and exact `<u>text</u>` syntax for a subtle underline. Keep meaning clear without color; other inline HTML stays literal.
- Inside a section marked `layered: true`, begin the Markdown body with a plain explanation. Put the mechanism, scenarios, evidence, or tradeoffs after it. The renderer keeps that first prose paragraph outside a subtle inset and renders the remaining Markdown inside it. Tables, lists, code, links, and other useful content stay in the full body.
- Use short labelled bullets or a table when behavior differs across scenarios. State material failure consequences and tradeoffs plainly; do not hide them in a closed section or imply a guarantee that the evidence does not support.
- In full-plan sections and rich explanations, use a few labeled subpoints under one takeaway when they clarify distinct phases, results, or exceptions. Keep simple lists flat, do not nest every sentence or impose a length quota, and follow the linked writing skill.
- Read the visible page by itself before delivery. You should be able to explain the proposed change and material risk, then point to the closed section that answers a reader's next question.
- Cross-check both brief and full Markdown against supplied evidence and chat. Preserve exact thresholds, units and time windows, actor and state ownership, ordering and stopping conditions, scope, and unverified limits. If a trigger or transition is unspecified, label it unknown or omit it; never guess. Sync clarifications into the full plan, and repeat mechanics across sections or layers only when repetition adds distinct information.
- For a new brief, provide a useful `actionsIntro`, a `risksIntro` when risks exist, and a `details` overview, groups, and previews for relevant full-plan sections. These fields remain optional for older JSON; that compatibility is not a reason to omit useful context from a new brief.
- When using `details`, group sections by the reader's likely questions and preview what each section will teach. Provide a preview for every relevant section; each section stays a separate accordion with its own catalog icon. The renderer supplies a neutral document icon when one is omitted, places unmapped sections under **Additional details**, and never drops source content.

Artifact paths are relative to the Markdown plan, must point to existing files in that
directory, and may not escape it. SVG, PNG, JPEG, and WebP files preview inline; other
files appear as descriptive links. HTML files load in a sandboxed frame.

The layout shows risks, open questions, and the review boundary in the initial view, keeps
expected outcomes collapsed, and puts complete Markdown sections in native accordions.
Both explanation layers remain visible. Detail groups and previews help readers choose a
section; the full Markdown source stays available under **Source document**. No button in the
page grants approval.

## Icons

The renderer owns the icon catalog. This prints one tab-separated name/label pair per icon;
`workflow` / `Workflow` is one example. List the pairs with:

`node "$HOME/.agents/skills/workflow/scripts/render-plan.mjs" --list-icons`

Use `--icon <name>` to print one SVG. Replace `<name>` with a listed name, as in:

`node "$HOME/.agents/skills/workflow/scripts/render-plan.mjs" --icon workflow`

Use these commands instead of opening or dumping `scripts/icons.mjs` or copying the full
SVG bank into context. In `review.json`, set `icon` to a listed name; never paste SVG markup.

Branching flows and larger diagrams can use the existing `diagram-design` skill. Follow
[the workflow diagram guide](diagrams.md), keep labels readable, and include editable
sources where available.
