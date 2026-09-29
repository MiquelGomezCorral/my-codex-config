# Agentic workflow

## Intent

Help the human define an evidence-backed outcome, challenge its solution, and deliver narrow
slices with inspectable verification and explicit human authority across projects.

## Current decisions

- One workflow skill owns routine stage transitions and tracks their evidence. The human
  owns material decisions and approval gates. Existing skills own their stage procedures;
  super-agent remains the sole delegation-policy owner and the active wrapper owns worker
  lifecycle.
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
- Brief tasks reduce effort and artifacts while preserving applicable authority,
  scope, evidence, and human-validation gates.

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
- Raw logs, runtime handles, credentials, and sessions are not persisted in tracked source.
- Standalone commands retain their stopping behavior; complete-flow continuation requires
  approved workflow context.

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

## History

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
