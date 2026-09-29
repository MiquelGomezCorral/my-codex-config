# Plan review brief

Use this small file for the human-facing view of a complete Markdown plan. The brief
does not replace the plan, summarize it automatically, or change its approval boundary.

Start from [the example](../templates/review.example.json) and render it beside the plan:

`node "$HOME/.agents/skills/workflow/scripts/render-plan.mjs" --input plan.md --review review.json --output plan.html`

The renderer keeps only supplied brief content. Agents compare it with the full plan
before presenting the page.

## Fields

- `title`, `summary`: a short name and intended outcome.
- `actions`: one or more `{ "title", "description", "icon?" }` entries. Titles use 2–10 words.
- `success`: expected outcomes in the same entry shape. These are not completed checks.
- `boundary`: what this approval covers.
- `risks`, `questions`: optional arrays in the same entry shape; include material items only.
- `artifacts`: optional related visuals or files. Each needs a `title` and `caption`, then
  either a `steps` array of at least two `{ "title", "icon?" }` entries, or a local `path`.
  A path may include an editable `sourcePath`; `placement` is `side` by default or `wide`.

Artifact paths are relative to the Markdown plan, must point to existing files in that
directory, and may not escape it. SVG, PNG, JPEG, and WebP files preview inline; other
files appear as descriptive links. HTML files load in a sandboxed frame.

Icons are names from the bundled bank, never pasted SVG. Use `--list-icons` to list names
and `--icon <name>` to print one SVG. The layout shows risks, open questions, and the
review boundary in the initial view, keeps expected outcomes collapsed, and puts complete
Markdown sections in native accordions. No button in the page grants approval.

Branching flows and larger diagrams use the existing `diagram-design` skill. Keep labels
readable and include editable sources where available.
