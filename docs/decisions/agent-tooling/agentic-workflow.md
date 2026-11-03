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
  research, verification, and artifact production. Each slice carries `Size: small|medium|large`,
  proposed by the planner and approved by the human with the plan. The orchestrator directly
  supervises one retained coder for a small slice; a medium or large slice uses a separate
  read-only coding supervisor that owns stages 4-6 (base live run, coding, review, checkpoint,
  cleanup and its verification, final live rerun), may launch one coder, git workers, review
  and cleanup coordinators and testers to depth 3, and returns one evidence packet; the size
  picks the supervisor and coder models from the catalog.
- The complete grounded plan is required before coding. The root for small slices, or the
  coding supervisor for medium and large slices, invokes the plan-selected read-only review against
  the resulting head and full approved plan. A reusable critic role challenges plans and
  other proposals; reviewer harness and tier defaults resolve through the model catalog.
- The root keeps wave approval, human gates, shipping, memory and the wave regression, and
  verifies consequential claims in the packet against its evidence.
- Each approved slice is narrowed against current repository state before coding.
  Technical steps may adapt within approved bounds; changed behavior, scope,
  dependencies, validation, or authority returns to the human. The coordinator may adjust
  the approved live test set within its environment and side-effect bounds and reports each
  change; widening those bounds returns to the human.
- Slices run sequentially. Independent slices require explicit approval before parallelism.
  In an `each-slice` wave each slice has one worktree with separate agent sessions and one
  writer at a time, and the next slice starts from the preceding accepted PR head only after
  its reviews, CI, and human gates pass; an unmerged parent is a valid starting point. A
  `final-only` wave follows the shipping layout its plan approved (workflow stages 7-9).
- Planning always runs three steps, in brief and full mode alike: a grill-me with investigation,
  "how and who live validates it", and whether each slice needs the human's thumbs up. A wave
  may choose `final-only`: the human accepts every slice at one final gate before any push. The
  choice lives only in that wave's plan, never as a standing preference.
- Live application testing and live tool preflight require explicit, bounded authorization.
  A bare "test" from the user means a live test of the real thing. Planning asks whether
  the wave wants live tests (default yes); an approved wave's live test set is the bounded
  authorization for running it.
- Review includes live testing by default (`full`). Each slice tests only its own behavior,
  and a wave regression reruns every slice's set after the last slice. A wave without live
  tests records the opt-out, and its review and presentation state the waived evidence.
- Each workflow review and cleanup round is sized to its change by agent judgment, guided by the
  coding loop: changed-line bands (about 1-25 `flash`, 25-50 `swarm`, more `full`) moved by
  reach, and fix rounds review what changed since the last review plus what it reaches. Live
  tests (unless opted out) and cleanup still run every round.
- A local checkpoint commit, made through a git worker, precedes cleanup. Cleanup audits stay read-only; an approved
  workflow may route verified in-scope simplifications to the implementation worker.
  Cleanup must pass clean: accepted findings go back through coding and review, then cleanup
  runs again on those changes until an audit has no accepted findings. After three rounds that
  still have accepted findings, the human chooses another round or accepts the rest as
  recorded risk, which never counts as clean. Every later code change, from human feedback,
  PR review, wave close, merge conflicts, or CI, takes the same coding, review, and cleanup
  path before it returns to the human, a `final-only` slice's local commit, or a push.
- After the human accepts the result, the Git worker gathers remaining accepted task-owned
  deliverables, excludes working-only agent artifacts and unrelated changes, makes a final
  commit only when needed, and then performs only the plan-authorized push. The shipped tree
  must match the result the human accepted. A later merge-conflict, CI, or review fix that
  leaves behavior unchanged is the only exception.
- Coding fixes verified in-scope findings at any severity, using P0-P3 to order work.
  Non-blocking out-of-scope findings are
  recorded and excluded; scope-expanding blockers escalate. Two unsuccessful rounds for
  the same unresolved problem escalate rather than silently restarting the count.
- The human validates the final result before named shipping actions. An accepted plan
  authorizes only its specifically named Git actions and bounds; final result acceptance
  does not require a second Git authorization. Implementers never receive merge authority
  merely because they receive coding or shipping context.
- Merge-conflict, CI, and review fixes take affected checks, review, and cleanup (merge
  conflicts through the Git worker); changed or uncertain behavior is presented again before
  shipping continues.
- Agents are retained within their assigned loops; distinct stages and slices use fresh
  sessions with explicit lifecycle and ownership accounting.
- Approved plans persist implementation decisions and attached approved amendments.
  Decision records preserve lasting project product or architecture intent, not ordinary
  sequencing, temporary implementation choices, or progress.
- Runtime progress lives in the repository's private `agent-memory/` in the Git common
  directory, beside the rest of the agent's work; outside a Git repository it uses local XDG
  state. Runs started under the old XDG location stay readable. Actual worker, Git, and
  hosting-service state remains authoritative for reconciliation.
- Plan-specific editable diagrams, SVG previews, mockups and live-test samples live in
  `agent-memory/artifacts/<name>/`, which the artifacts skill owns; the plan links to them.
- A script-maintained progress record generates the status page, published on the artifacts
  hub at intake. Every update rewrites it and the open page refreshes itself, so the user
  reads progress instead of asking. Every `/workflow` run uses it from intake to close
  instead of the retained legacy Markdown template: the root updates it at dispatches,
  waits, results, corrections, gates, and resume, and a coding supervisor updates only its
  own slice (steps, activity, next action, notes, evidence, blockers). The root keeps wave
  fields, approvals, gates, attention items, and slice creation. A lock file serializes
  updates, and the script answers every call: a rejected one lists each problem and writes
  nothing, a good one prints the current status. Updates preserve
  untouched statuses and slice evidence. The page derives the current stage from the
  active steps; no one sets it by hand. Each slice keeps its own delivery steps and
  activity, so parallel slices show side by side; planning and close-wave steps are
  wave-level. A summary table, per-slice tabs, and the latest five living-note versions
  make progress visible without changing approval or evidence requirements.
  A "Needs your attention" panel at the top lists blockers, a pending human decision, and
  non-blocking items the user must act on (logins, permissions, live-test setup, questions);
  resolving an item never grants approval.
- The progress view uses the shared icon catalog. Its editable diagram separates layout
  from run state and maps stable nodes to steps; one graph serves every slice. Diagram
  highlights are derived views, never edits to the shared source or proof of completion.
- Brief tasks reduce effort and artifacts while preserving applicable authority,
  scope, evidence, and human-validation gates.
- Human plan review uses a concise filled-in brief drawn by the artifacts page engine, so
  plan pages share the artifact palette, icons, versions, and change marks. The engine owns
  layout, icons, and expandable detail; agents supply content and useful artifacts. The
  complete Markdown specification remains authoritative.
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
  The repository's `excalidraw-draw` skill owns hand-written Excalidraw mechanics, and its
  worker renders and reviews its own output before the coordinator verifies it.

- The workflow map uses a pinned, unchanged native Archify viewer around a derived SVG
  exported from editable draw.io source. A thin adapter translates explicit active-step
  bindings and native-supported run metadata into viewer inputs and calls. Manual graph
  exploration is transient and cannot change workflow progress or approval. Shared diagram
  layout and bindings remain separate from local run content; native viewer defaults own
  graph interaction and styling. Every viewer colour maps to a role in the diagram's own
  legend, and the legend is registered so the colours stay explained.

## Protected invariants

- A workflow marker or progress file cannot manufacture approval or prove completion.
- Repository-specific constraints override workflow defaults, including prohibitions on
  commits, worktrees, publication, and live actions.
- Parallelism, scope expansion, live actions, destructive recovery, and shipping never
  acquire authority solely from entering a stage.
- Sequential slices inherit only a positively accepted predecessor revision, except in a
  `final-only` wave, where a slice inherits its predecessor's reviewed and live-tested local
  commit and the human accepts all slices at the final gate; reviewers report the inspected
  head and relevant base, and changed evidence is revalidated.
- Checkpoint recovery preserves unrelated work and existing history; no implicit reset,
  rebase, squash, amendment, force-push, or branch deletion is introduced. Folding final-gate
  feedback into an earlier slice's commit needs the human's approval each time and touches only
  unpushed commits.
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
  They never replace the authoritative written plan or create approval. Each human gate gets a
  page (discovery, plan, result with live evidence); a revised page shows what changed since the
  human last saw it. A required gate page that fails to render is fixed or reported as a blocker;
  optional artifact failures remain visible and do not block a usable written planning outcome.
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
the `computer-controller` role, Pi role generation, and focused configuration/bootstrap checks.
Human approvals, context independence, evidence quality, and real lifecycle recovery
remain Review-only until demonstrated in an explicitly authorized live trial.
Plan presentation is owned by the workflow renderer and planning reference, with focused
renderer tests. Agreement between the human brief and full specification remains Review-only.
Explanation quality and meaningful grouping remain Review-only: a reader should be able to
predict relevant behaviour and find the supporting detail without opening every section.
The `workflow-progress` CLI owns progress validation and rendering. Focused CLI tests
cover state preservation, per-slice statuses, notes, and invalid updates; old-run
migration and slice targeting are covered by the live progress walkthrough; browser refresh,
view preservation, and offline presentation require a bounded local walkthrough.
Diagram presentation and comprehension remain Review-only: compare the revised diagram
with its grounded brief and full plan, including the actual embedded view.

The workflow-progress map manifest owns focus bindings; the CLI validates run content, and
its browser adapter validates imported graph inputs before native display. Focused
workflow-progress tests cover persistence and invalid updates. Native interaction, authored
geometry, sandbox isolation and animation require a bounded local browser walkthrough;
diagram comprehension remains Review-only.

## History

- 2026-11-02: Progress pages went stale during real runs and agents never knew whether an
  update worked. The page is now a hub page refreshed by every update (no server of its own),
  the script reports every call's outcome, the hand-set stage and last-gate fields were
  removed, and coding supervisors update their own slice under a lock. Every `/workflow` run
  must use it, and the user gets the link at intake.
- 2026-10-29: A subscription-usage audit found the root's long Opus context driving most
  spend while it ran each slice's live runs, checkpoint, cleanup and reruns. The user kept the
  catalog models and approved handing those stages of a medium or large slice to its coding
  supervisor, which returns one evidence packet; the root keeps the gates.
- 2026-10-26: Review and cleanup rounds are sized to the change by agent judgment, because a
  1-line change or a 3-line fix round still launched the full swarm. `swarm-smart` was removed:
  with live tests in every round it launched the same reviewers as `full`. Cleanup's big-change
  question became agent judgment.
- 2026-10-23: Cleanup loops until clean and reruns after every later code change, because
  feedback fixes on a final-only wave skipped cleanup and about 60 lines of waste reached the PR.
- 2026-10-19: Slice size became per slice with three values (small, medium, large), approved by the human with the plan; medium and large both get a supervisor, and the size picks the models.
- 2026-10-16: Moved run state into private `agent-memory/` and plan diagrams and samples into
  `agent-memory/artifacts/<name>/`, so durable agent work has one home and the artifacts skill
  stays the central owner; the map viewer's colours now follow the diagram legend.
- 2026-10-11: Gate pages are published through the artifacts page hub; the Lavish viewer was removed.
- 2026-10-10: Required a page at each human gate, with changes since the last version shown and live evidence at the result gate.
- 2026-10-10: Made grill-me + investigation, live-validation, and slice-gate questions mandatory planning steps.
- 2026-10-10: Added the per-wave `final-only` slice-gate option chosen at planning.
- 2026-10-10: Moved plan review rendering onto the artifacts page engine; answers already in
  the request settle mandatory planning questions once shown back to the user.
- 2026-10-09: Added the "Needs your attention" panel to the progress page.
- 2026-10-08: Gave each slice its own progress steps and activity, with a summary table and
  per-slice tabs; close-wave became wave-level.
- 2026-10-08: Made live acceptance tests part of the approved wave, review include live
  testing by default with the `full` preset, and added the wave regression pass.
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
- 2026-10-08: Added `excalidraw-draw` for clean and free-form Excalidraw drawings rendered
  with the official CLI; its drawing worker may render and lint inside its output directory
  to review its own work.
