# Planning diagrams

Use a diagram when it helps the human assess a real flow, boundary, outcome, or decision.
Keep small tasks in prose when a visual adds no useful information. The complete written
plan remains authoritative; a diagram never proves a behavior or grants approval.

## Worker brief

Before dispatch, apply the [super-agent route availability policy](../../super-agent/SKILL.md#select-the-route)
to verify the chosen drawing skill is available on the selected route: `diagram-design`,
or `excalidraw-draw` for Excalidraw and free-form drawings. If not, report the optional
artifact gap and continue with the written plan; do not install it or switch harnesses.

Give the worker one concrete question to answer, the subject and scope,
the audience, verified facts with their evidence, proposed changes, alternatives, unknowns,
material dependencies and risks, and the output directory. Resolve style first: use the
chosen project style, or pass one explicitly when there is none: `Minimal dark` for
`diagram-design`, the house style for `excalidraw-draw`.
Include only relevant evidence. The worker may create or revise assigned artifacts; it
cannot edit product files, browse unrelated private memory, use Git, install tools, publish,
or delegate.

## Presentation

1. Choose the clearest form for one concrete question. Flowcharts, architecture views,
   comparisons, and tables are examples, not a restricted menu.
2. Label verified current behavior, proposed changes, alternatives, and unknowns where
   they appear. A polished diagram is not evidence.
3. Show the overview first. If it has detail views, match their titles to overview labels
   and tell the reader how to reach each one.
4. Use familiar names, consistent abstraction levels, clear arrow direction, and named
   decision branches. Add a legend only when notation needs one.
5. Inspect full-size and embedded views. Check labels, overlaps, arrow direction, clipping,
   and navigation. Split a crowded view instead of shrinking text; avoid distinctions
   carried only by color.
6. Give every diagram a short takeaway and keep material risks, decisions, or uncertainty
   visible. Complex visuals also need a useful text explanation.
7. Simplify without changing meaning. State material omissions and where their details live.
   Apply database modeling advice only to diagrams that need entities and relationships.

After feedback or adversarial changes, revise affected diagrams against the complete plan.
Have an independent reader identify the current outcome, proposed changed branch, material
risk or decision, and matching detail view from the diagram and its caption; compare that
reading with the full plan.

## Artifacts

HTML is the default preview. Use SVG when requested or easier to embed, and keep the editable
source supplied by the tool. An `excalidraw-draw` drawing previews as its rendered PNG. Do not promise an Excalidraw export of a `diagram-design`
drawing. Attach accepted artifacts through the existing `title`, `caption`, `path`,
`sourcePath`, and `placement` fields. Keep the takeaway and review question in the caption,
and link the artifact in its `agent-memory/artifacts/<name>/` folder (see the
[artifacts skill](../../artifacts/SKILL.md#page-hub)).

When `diagram-design` and the `excalidraw` skill templates cannot express the drawing, or
it goes beyond diagrams (wireframes, slides, illustrations, maps), use
[`excalidraw-draw`](../../excalidraw-draw/SKILL.md). It writes the `.excalidraw` scene,
renders it with the official Excalidraw CLI, and has the drawing agent review the render.
It owns the install check, the CLI docs link, and the commands an agent may run.

Diagram creation is optional. If a worker or preview fails, report the missing artifact and
give the explanation in text; do not present an unverified diagram as completed evidence.
The coordinator owns any helper-script checks or exports, then verifies the resulting files
and preview. An `excalidraw-draw` worker is the exception: it renders and lints the files in
its own output directory to review its work. Report unavailable or failing helpers; never
imply the worker ran them.

For the native workflow-progress map source, export, stable-ID bindings, and run metadata,
follow the [map setup guide](../../workflow-progress/references/map-setup.md).
