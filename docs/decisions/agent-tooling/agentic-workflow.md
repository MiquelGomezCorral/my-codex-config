# Agentic workflow

## Intent

Help the human define an evidence-backed outcome, challenge its solution, and deliver narrow
slices with inspectable verification and explicit human authority across projects.

## Current decisions

- One workflow skill owns routine stage transitions and tracks their evidence. The human
  owns material decisions and approval gates. Existing skills own their stage procedures;
  super-agent remains the sole delegation-policy owner and the active wrapper owns worker
  lifecycle.
- Supported native planning, coding, and code-review capabilities may execute a stage.
  One workflow capability reference records callable routes and their limits. Custom
  independent plan critique and project review requirements remain; native execution
  preserves scope, approvals, one writer, evidence, memory ownership, and result gates.
- `/commands/workflow` and `$workflow` are the single complete-flow entry point. Progress
  starts at intake. Planning ends in an evidence-backed persisted wave Markdown plan with
  reviewable HTML and any useful editable diagrams/SVG previews. The human sees and
  approves the entire wave before any slice is dispatched. `review-plan` and `refine-plan`
  remain reusable internal stages; swarm coordination lives under `$review`.
- The main orchestrator coordinates and delegates product edits, substantial investigation,
  research, verification, and artifact production. It directly supervises one retained coder
  for a plan marked small; a plan marked large uses a separate read-only coding supervisor
  with an explicit one-coder delegation grant. The human may override the size choice.
- The complete grounded plan is required before coding. The root for small slices, or the
  coding supervisor for large slices, invokes the plan-selected read-only review against
  the resulting head and full approved plan. A reusable critic role challenges plans and
  other proposals; reviewer harness and tier defaults resolve through the model catalog.
- Each approved slice is narrowed against current repository state before coding.
  Technical steps may adapt within approved bounds; changed behavior, scope,
  dependencies, validation, or authority returns to the human.
- Slices run sequentially. Independent slices require explicit approval before parallelism.
  Each slice has one worktree with separate agent sessions and one writer at a time.
- The next slice starts from the preceding accepted PR head only after its reviews, CI,
  and human gates pass. An unmerged parent is a valid starting point.
- Live application testing and live tool preflight require explicit, bounded authorization.
- A local checkpoint commit precedes cleanup. Cleanup audits stay read-only; an approved
  workflow may route verified in-scope simplifications to the implementation worker.
- After the human accepts the result, the Git worker gathers remaining accepted task-owned
  deliverables, excludes working-only agent artifacts and unrelated changes, makes a final
  commit only when needed, and then performs only the plan-authorized push. The shipped tree
  must match the result the human accepted.
- Coding fixes verified in-scope findings at any severity, using P0-P3 to order work.
  Non-blocking out-of-scope findings are
  recorded and excluded; scope-expanding blockers escalate. Two unsuccessful rounds for
  the same unresolved problem escalate rather than silently restarting the count.
- The human validates the final result before named shipping actions. An accepted plan
  authorizes only its specifically named Git actions and bounds; final result acceptance
  does not require a second Git authorization. Implementers never receive merge authority
  merely because they receive coding or shipping context.
- Merge conflicts are resolved through the Git worker, followed by affected checks and
  review; changed or uncertain behavior is presented again before shipping continues.
- Agents are retained within their assigned loops; distinct stages and slices use fresh
  sessions with explicit lifecycle and ownership accounting.
- Approved plans persist implementation decisions and attached approved amendments.
  Decision records preserve lasting project product or architecture intent, not ordinary
  sequencing, temporary implementation choices, or progress.
- Runtime progress stays in local XDG state associated with the wrapper run. Actual
  worker, Git, and hosting-service state remains authoritative for reconciliation.
- A script-maintained progress record generates the local HTML status page. Routine
  workflow runs use it instead of the retained legacy Markdown template. The root updates
  it at dispatches, waits, results, corrections, gates, and resume. Updates preserve
  untouched statuses and slice evidence; starting another slice resets delivery steps
  explicitly. Current activity, main substeps, and the latest five living-note versions
  make progress visible without changing approval or evidence requirements.
- The progress view uses the shared icon catalog. Its editable diagram separates layout
  from run state and maps stable nodes to steps; one graph serves every slice. Diagram
  highlights are derived views, never edits to the shared source or proof of completion.
- Brief tasks reduce effort and artifacts while preserving applicable authority,
  scope, evidence, and human-validation gates.
- Human plan review uses a concise filled-in brief and a reusable workflow-owned HTML
  renderer. The renderer owns layout, icons, tabs, and expandable detail; agents supply
  content and useful artifacts. The complete Markdown specification remains authoritative.
- Plan explanations prioritize understanding over maximum compression. State the purpose
  or consequence first, then show useful deeper explanation without another disclosure.
  Explain concrete behaviour, relevant scenarios, stopping conditions, cost, and tradeoffs
  when they help the human judge the change; do not force every item into one template.
- Authors give actions and risks context and make deeper sections easy to choose through
  an overview, meaningful groups, and visible previews. Named project concepts and code
  identifiers remain visually distinct within ordinary text. Rich details may use lists,
  tables, diagrams, and evidence while retaining the complete written plan.
- Plans present useful diagrams, mockups, and evidence beside the brief or at full width,
  with descriptive clickable viewer links. Optional sections disappear when unused; long
  technical sections remain accessible without overwhelming the initial review.
- Useful diagrams may accompany the first draft and evolve with planning feedback. A
  bounded artifact-only worker receives grounded facts, evidence, scope, and style; the
  coordinator verifies its output and presents accepted artifacts with the complete plan.
  Upstream diagram tooling owns drawing mechanics; workflow owns presentation guidance.

- The workflow map uses a pinned, unchanged native Archify viewer around a derived SVG
  exported from editable draw.io source. A thin adapter translates explicit active-step
  bindings and native-supported run metadata into viewer inputs and calls. Manual graph
  exploration is transient and cannot change workflow progress or approval. Shared diagram
  layout and bindings remain separate from local run content; native viewer defaults own
  graph interaction and styling.

## Protected invariants

- A workflow marker or progress file cannot manufacture approval or prove completion.
- Repository-specific constraints override workflow defaults, including prohibitions on
  commits, worktrees, publication, and live actions.
- Parallelism, scope expansion, live actions, destructive recovery, and shipping never
  acquire authority solely from entering a stage.
- Sequential slices inherit only a positively accepted predecessor revision; reviewers
  report the inspected head and relevant base, and changed evidence is revalidated.
- Checkpoint recovery preserves unrelated work and existing history; no implicit reset,
  rebase, squash, amendment, force-push, or branch deletion is introduced.
- A checkpoint alone does not prove that cleanup corrections were committed or shipped;
  ambiguous ownership or a changed accepted result stops the final Git handoff.
- Read-only reviewers and cleanup auditors never edit product source or become fixers.
- Required unavailable evidence is blocked/unverified, not an approval or invented defect.
- Original approved plans keep their objective; approved amendments remain attached.
- A concise review must preserve material risks, unresolved decisions, and approval bounds;
  collapsed details and visual controls never create or expand approval.
- Clearer explanations must preserve evidence limits and cannot add unsupported guarantees.
  Behaviour clarified in conversation must be reconciled with the authoritative plan before
  the brief presents it as a commitment.
- Diagrams distinguish verified current behavior, proposals, alternatives, and unknowns.
  They never replace the authoritative written plan or create approval. Optional artifact
  failures remain visible and do not block a usable written planning outcome.
- Artifact workers cannot edit product source, access unrelated private memory, operate
  Git, or delegate. Their writable output scope does not broaden reviewer permissions.
- Raw logs, runtime handles, credentials, and sessions are not persisted in tracked source.
- Standalone commands retain their stopping behavior; complete-flow continuation requires
  approved workflow context.

- Progress activation uses validated stable focus anchors; complete subflows may include
  visual alternatives while execution follows only the selected plan branch;
  native neighboring context never changes execution status. Imported graph content never
  executes arbitrary scripts or loads external resources. A viewer highlight, animated arrow
  or metadata description is presentation, not evidence of execution or permission.

## Rationale and tradeoffs

Reuse existing skills and runtime coordination instead of creating a second execution
engine. Narrow sequential slices and stable checkpoints favor inspectable progress over
keeping agents busy. Separate plan decisions from project intent so temporary choices
do not become accidental permanent policy.

## Enforcement

Approved implementation targets are the workflow and stage skills, coding-supervisor and
live-validator roles, Pi role generation, and focused configuration/bootstrap checks.
Human approvals, context independence, evidence quality, and real lifecycle recovery
remain Review-only until demonstrated in an explicitly authorized live trial.
Plan presentation is owned by the workflow renderer and planning reference, with focused
renderer tests. Agreement between the human brief and full specification remains Review-only.
Explanation quality and meaningful grouping remain Review-only: a reader should be able to
predict relevant behaviour and find the supporting detail without opening every section.
The `workflow-progress` CLI owns progress validation and rendering. Focused CLI tests
cover state preservation, slice resets, notes, and invalid updates; browser refresh,
view preservation, and offline presentation require a bounded local walkthrough.
Diagram presentation and comprehension remain Review-only: compare the revised diagram
with its grounded brief and full plan, including the actual embedded view.

The workflow-progress map manifest owns focus bindings; the CLI validates run content, and
its browser adapter validates imported graph inputs before native display. Focused
workflow-progress tests cover persistence and invalid updates. Native interaction, authored
geometry, sandbox isolation and animation require a bounded local browser walkthrough;
diagram comprehension remains Review-only.

## History

- 2026-10-04: Approved native stage reuse beneath the existing workflow gates, with
  capability limits recorded once and vendor prompts left with their harnesses.
- 2026-10-02: Automatic map updates keep native details hidden and emphasize complete
  subflows, including review alternatives; manual details and execution-status authority
  remain unchanged.

- 2026-10-02: Approved comprehension-first explanations, contextual introductions, grouped
  detail previews, and integrated inline project terms while preserving full-plan authority.

- 2026-10-01: Adopted a pinned native Archify viewer with editable draw.io source, validated
  step anchors, local planning descriptions and a thin presentation adapter; native context
  and manual exploration remain separate from workflow authority.

- 2026-09-30: Approved a script-maintained HTML progress page replacing routine Markdown
  progress updates, followed by an editable diagram after acceptance of the simple page.
- 2026-09-27: Approved the agentic planning and delivery workflow, sequential stacked
  slices, one worktree per slice, bounded live authorization, checkpoint cleanup,
  two-round escalation, local progress, and separate plan/project decision ownership.
- 2026-09-28: Made coding supervision depend on the approved size decision, required
  correction of verified in-scope findings at any severity, and made named plan authority
  sufficient for Git actions subject to the final result gate and repository rules.
- 2026-09-28: Consolidated planning and delivery under `$workflow`, moved swarm
  coordination under `$review`, and made the full visual wave and per-slice refinement
  explicit gates.
- 2026-09-28: Clarified that the final Git worker commits accepted task deliverables left
  after cleanup before an authorized push, while excluding working-only agent artifacts.
- 2026-09-29: Approved a reusable concise plan-review template with useful visible artifacts,
  expandable full specifications, and unchanged human approval boundaries.
- 2026-09-30: Approved optional diagrams during drafting and revision, artifact-only
  delegation, and explicit separation of current facts, proposals, and unknowns.
