# Implement the agentic planning and delivery workflow

## Goal and approved behavior

Provide a reusable workflow that helps the human define an evidence-backed goal, challenge the proposed solution, and deliver narrow slices through implementation, review, cleanup, human validation, and PR preparation.

The workflow must work across projects and scale down to a small fix without dropping scope control, meaningful verification, or human authority.

Confirmed decisions:

- Run slices sequentially. When independent slices could run concurrently, ask before enabling parallel execution.
- Give each slice one worktree. Its agents use separate sessions in that worktree, with only one writer at a time.
- Start the next slice from the previous PR’s accepted head after its required reviews, CI checks, and human gates pass. Merging is not required.
- Ask before live application testing or live tool preflight. Reuse authorization only within its explicitly approved bounds.
- Make a local checkpoint commit before cleanup.
- Allow verified cleanup simplifications within scope, including non-blocking complexity.
- Escalate after two unsuccessful correction rounds for the same unresolved problem.
- Keep workflow progress and runtime details local.
- Persist implementation decisions with the approved plan. Preserve lasting project intent through `decision-records`.

## Workflow and ownership

Add one `workflow` skill to coordinate the complete process. Keep `super-agent` as the sole owner of delegation policy and Orca as the owner of worker lifecycle.

The main orchestrator handles human decisions, stage transitions, approvals, and concise status. It delegates implementation, substantial investigation, research, evidence verification, and artifact production.

| Stage | Required behavior | Exit condition |
|---|---|---|
| First draft | Gather the problem, existing behavior, desired outcome, scope, exclusions, evidence, and validation method. Obtain an independent proposal without code or the preferred solution. | Human receives an understandable candidate plan. |
| Improvement | Incorporate feedback, resolve material decisions, and produce useful diagrams or mockups. Investigate discoverable facts instead of asking the human. | Human accepts the candidate. |
| Adversarial review | Challenge feasibility, necessity, scope, and assumptions. Verify consequential research claims and bug evidence. Use one critique and one rebuttal; escalate remaining disputes. | Consolidated plan is ready for implementation approval. |
| Slice preparation | Refine the slice against actual repository state. Define its outcome, ownership, verification, samples, required tools, review preset, and artifacts. | Human approves implementation and any required live actions. |
| Coding loop | A coding supervisor directs a retained implementation worker. Review findings are verified before becoming correction instructions. Fix verified in-scope P0/P1 findings. | Required behavior and checks pass, with no unresolved blockers. |
| Cleanup | Create the checkpoint, run a read-only audit, verify findings, and route authorized simplifications to the implementation worker. | Required behavior still passes after cleanup. |
| Present to human | Demonstrate the actual result with the planned evidence and artifacts. Incorporate feedback through the coding loop. | Human approves the final result and shipping actions. |
| Ship and monitor | Commit remaining changes, push, create or update the PR, and inspect required CI and review feedback. | Required gates pass; the next slice may start. |
| Close wave | Record completed and unfinished slices, next decisions, deferred findings, and reusable lessons. | Every slice has an explicit outcome. |

Scope-expanding blockers stop the affected work and escalate. Non-blocking findings outside scope are recorded and excluded from subsequent correction briefs.

Brief tasks use shorter investigations, fewer reviewers, and lighter artifacts. They retain the applicable approval and evidence gates.

## Skills, roles, and persistent artifacts

### Phase files and existing skills

Create `workflow/SKILL.md`, one progress template, and four building references: `coding-loop.md`, `cleanup.md`, `present-to-human.md`, and `ship-pr.md`.

Expand `implementation-planning` with three references: `first-draft.md`, `improvement-loop.md`, and `adversarial.md`. Reuse `grill-me`, `goalcraft`, `review-plan`, and `refine-plan` rather than duplicating their policies.

Update existing stage skills to accept an approved workflow context containing the plan path, slice, stage, local progress path, scope, exclusions, and applicable authorizations. A context marker alone grants no authority.

Preserve standalone command behavior:

- Standalone `$code` still stops after implementation.
- Standalone `$cleanup` remains read-only and findings-only.
- Standalone review never invokes a fixer or publishes feedback.
- The approved complete workflow may coordinate these stages and route verified corrections.

Add `--preset flash|swarm|swarm-smart|full` to review orchestration:

- **Flash:** one brief reviewer.
- **Swarm:** existing adaptive independent review lenses.
- **Swarm-smart:** swarm plus a stronger agent verifying and synthesizing findings.
- **Full:** swarm-smart plus authorized live end-to-end validation.

Provide one reference per preset and an end-to-end reference. Preserve existing flags and require explicit selection of OCR or Slopo; deeper review must not enable them automatically.

Use P0–P3 consistently. Keep an unavailable verification path distinguishable from a demonstrated defect:

- P0: critical failure.
- P1: serious regression or unmet acceptance requirement.
- P2: non-blocking improvement.
- P3: optional observation.
- Blocked/unverified: required evidence is unavailable.

Every retained finding needs scope classification and concrete evidence. Review verdicts identify the inspected head, relevant base, and performed verification.

### Agent groups

Keep existing implementation, review, cleanup, and git roles. Add:

- **`coding-supervisor`:** refines the approved completion contract, supervises the implementation worker, verifies correction scope, and reports blockers. It does not edit product code.
- **`live-validator`:** exercises the approved application flow and inspects outputs, interactions, logs, and telemetry where available. It does not edit product source.

Use the existing stronger coordinator configuration—`gpt-6-sol` with high reasoning—as the default for these two roles. Preserve explicit per-plan model choices and existing cheap-model catalog ownership.

Use focused fresh briefs for researchers, independent proposers, critics, and evidence verifiers instead of creating a permanent role for every assignment.

The independent proposer receives verified problem facts, desired outcomes, constraints, and examples. Exclude repository code, inherited project design context, prior conclusions, and the proposed solution. Do not describe it as technically sandboxed when isolation is only a task constraint.

Retain agent identities within their assigned loops. Start fresh sessions for distinct stages and slices. Preserve runtime identity checks and explicitly settle, retain, or release workers through Orca.

Update role configuration, Pi role generation, bootstrap inventories, and relevant tests. Keep the version-matched Orca discovery stubs unchanged.

### Worktrees, checkpoints, and shipping

For sequential execution, create each new slice worktree from the preceding accepted PR head. Record that head as the slice’s starting revision.

While its parent PR remains unmerged, target the parent branch so the new PR exposes only the slice’s changes. Reconcile the target when the parent merges and revalidate affected evidence. Preserve history: no rebase, squash, amendment, or force-push.

Create the checkpoint through the git worker after the coding gates pass and before cleanup. It is a local commit, not permission to push.

Record the checkpoint hash. A cleanup regression returns to the coding supervisor. Recovery must preserve unrelated work and history; destructive restoration requires explicit authorization.

“All OK” at the shipping gate authorizes only the named commit, push, and PR actions. Later fixes that alter the approved result return through affected validation and human presentation.

### Plans, project decisions, and local state

Persist the approved execution plan under `.agents/plans/`. Include its implementation decisions, rationale, boundaries, validation, and authorizations.

Preserve the original approved plan. Attach later approved amendments and correction decisions to that plan without silently rewriting its objective.

Use `decision-records` for lasting product or architecture intent. Implementation sequencing, temporary choices, progress, and ordinary correction history do not automatically become project records.

Keep progress outside tracked repository state, under the XDG state directory, associated with the Orca run. The human-editable record contains:

- Current stage and slice.
- Plan and amendment references.
- Approvals and their bounds.
- Slice dependencies and starting revision.
- Checkpoint, PR, review, CI, and completion states.
- Evidence links, deferred findings, and unresolved blockers.

Orca remains authoritative for dispatch and worker lifecycle. Git and the hosting service remain authoritative for revisions and PR state. Reconcile the progress record against them; it is not proof of completion.

## Decision records and repository memory

**Decision records: create** — this establishes a reusable workflow crossing planning, worker, review, validation, and git boundaries.

Approved record changes:

- Create `docs/decisions/agent-tooling/agentic-workflow.md` and add its index entry. Protect human gates, sequential stacked slices, one worktree per slice, checkpoint recovery, local runtime state, and the distinction between implementation and project decisions.
- Update the quality-gate record to distinguish standalone findings-only audits from correction orchestration inside an approved workflow.
- Update the git record for explicitly authorized local checkpoints, stacked PR targets, and shipping authorization carried by an approved plan.
- Preserve delegation-routing invariants; the workflow does not acquire a second delegation policy.

**Enforcement:** role instructions, focused configuration checks, and observed workflow trials. Human approval and evidence quality remain review-dependent.

Main-orchestrator memory updates:

- Append the user’s stated workflow requirements and confirmed answers to `.agents/requirements.md`.
- Update architecture and workflow memory after successful implementation to describe ownership, entry points, and verification.
- Link lasting decisions from `.agents/decisions.md` without duplicating their full policies.
- Preserve unrelated changes and existing requirements.

## Verification and execution boundaries

Run the relevant existing checks after implementation:

- `node --test tests/codex-config.test.mjs`
- `bash tests/bootstrap.test.sh`
- `./bootstrap.sh --check`

Extend checks for role generation, phase-reference integrity, review presets, and preservation of standalone behavior. Report pre-existing unrelated failures without broadening this task.

Evaluate three representative scenarios against the previous workflow:

1. A small localized fix using the brief path.
2. A dependent two-slice feature using separate stacked worktrees.
3. A blocked or interrupted slice requiring evidence verification, escalation, and recovery.

Include a false-positive finding, an out-of-scope observation, and a cleanup regression. Verify that none becomes an unauthorized edit or a false completion claim.

**Live validation**

- **Flow:** In an explicitly authorized disposable project, run the workflow through planning, implementation, review, checkpoint, cleanup, human presentation, and shipping; then start a dependent slice.
- **Expected:** Correct approvals, narrow changes, inspectable evidence, one worktree per slice, preserved checkpoint history, and accurate progress after interruption.
- **Can run:** Orca-managed agents with approved application and git access. Pending separate live-validation authorization.

Do not install or authenticate tools, modify Orca itself, deploy configuration, or commit/push/create worktrees in this configuration repository. Required unavailable capabilities become explicit blockers.

The native plan is ready for the separate `$review-plan` adversarial review; `$code` then persists the finalized execution specification before implementation.
