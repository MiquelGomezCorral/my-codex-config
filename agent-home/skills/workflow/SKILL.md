---
name: workflow
description: Run the complete agentic workflow from an initial idea and evidence through an approved wave plan, scoped slices, review, human validation, and shipping. Use for explicit `$workflow` or `/commands/workflow` requests.
---

# Workflow

Accept the initial request, evidence, ideas, or `@file` as input. Load the [planning
reference](references/planning.md) and create [progress](templates/progress.md) at intake;
the plan path remains pending until the wave is finalized. This single entry point owns
planning and delivery. The human owns material
decisions, bounded approvals, final result acceptance, and shipping authority. The
human-facing coordinator advances routine stages when their exit evidence is complete;
pause only for a human decision gate, missing authority, a blocker, or changed scope.
`super-agent` remains the sole owner of delegation policy; the active wrapper owns
worker lifecycle.

## Authority and context

Keep product edits with a retained implementation worker. Delegate substantial
investigation, research, evidence verification, and artifact production through
`super-agent`. Use fresh sessions for distinct stages and slices, and retain a worker
only within its assigned loop. Never give one slice more than one active writer.

Pass stage skills this context after the wave plan is approved:

```text
Workflow context: approved
Plan path: <tracked plan path>
Slice: <slice id or name>
Stage: <current stage>
Progress path: <XDG state path outside the repository>
Scope: <approved paths and behavior>
Exclusions: <explicit boundaries>
Coding size: <small|large, as recorded in the approved plan>
Authorizations: <exact action and bounds, or none>
```

The context routes work and narrows scope; it adds no authority. The `git` skill owns Git
action authority and procedure. Live application testing and live tool preflight still
need explicit bounded authorization; reuse it only within those bounds. Stop when required
context conflicts or a non-Git action's bounds are missing.

## Run the stages

1. **First draft:** follow the planning reference and its first-draft phase: establish
   the problem, current and desired behavior, scope, exclusions, evidence, and validation.
   Get an independent code-blind proposal before sharing the preferred solution. Grill
   the human on material decisions after researching discoverable facts.
2. **Improvement:** incorporate feedback, resolve choices, and add useful diagrams or
   mockups. Build a complete candidate wave with proposed slices, dependencies, checks,
   review depth, artifacts, and bounded authorizations. Present and revise it until the
   human accepts it for adversarial review.
3. **Adversarial review and wave approval:** run `$review-plan` once. It routes one
   reusable `critic` through `super-agent`; verify consequential claims and bug evidence,
   allow one planner rebuttal, and escalate remaining disputes. `$review-plan` calls
   `$refine-plan`. Persist the complete wave Markdown plan and render its reviewable HTML
   and available editable diagrams/SVG previews as described in the planning reference.
   Show all wave evidence, slices, artifacts, and authorizations to the human. Ask whether
   to start delivery; do not dispatch coding before explicit wave approval.
4. **Slice preparation:** refine and narrow each approved slice against current repository
   state before dispatch. The root does this for `small`; a read-only `coding-supervisor`
   can do it for `large` under a bounded grant. Refinement may change technical steps
   within the approved outcome and scope; report amendments. Escalate changed behavior,
   scope, dependencies, validation method, or authority to the human. Record its
   result, owner, coding size, checks, samples, tools, review preset, and artifacts. The
   human-approved plan records `small` or `large`, with any human override. The wave
   approval covers its exact implementation and worktree bounds; ask for missing live
   authorization before that action. Apply only the exact approved decision-record
   changes once through their owning skill before coding; never delegate those writes
   to the coder.
   Require the complete grounded plan: verified current behavior and sources, desired
   result, scope and exclusions, implementation decisions, acceptance evidence, and an
   executable validation method with samples and available tools. Check the planned
   non-live test route before coding; preflight a live tool only within approved bounds.
   Stop if required evidence or a usable validation route is missing.
5. **Coding loop:** send a small plan directly to one retained coder. For a large plan, use
   a read-only `coding-supervisor` with a bounded grant to direct one retained coder and
   coordinate the selected review within the approved slice. The small-slice coordinator
   or large-slice supervisor invokes `$review --preset <approved preset>` on the resulting
   head with the complete approved plan, amendments, diff basis, checks, and slice context.
   Verify findings before correction; correct every verified in-scope P0-P3 finding, using
   priority to order work. Escalate after two unsuccessful rounds for the same unresolved
   problem.
6. **Cleanup:** after coding gates pass, run the authorized local checkpoint through
   `$git`, record its hash, then run the read-only `$cleanup` audit. Verify each finding
   before routing an in-scope simplification back through the coding loop.
7. **Present to human:** show the actual result, planned evidence, checks, known gaps, and
   artifacts. Route feedback through the coding loop. After acceptance, apply the exact
   approved main-agent memory updates once. Do not ship before human acceptance.
8. **Ship and monitor:** after the human accepts the presented result, run `$git` only for
   actions and bounds named by the approved plan. Acceptance is a result gate, not a second
   Git authorization request. If a merge conflict occurs, route its resolution through
   `git-worker`, rerun affected checks and review, and re-present the result if behavior
   changed or remains uncertain. Inspect required CI and review feedback; never infer an
   unnamed action.
9. **Close the wave:** record completed and unfinished slices, next decisions, deferred
   findings, and lessons in local progress state.

Keep slices sequential by default. Ask before independent parallelism. Give each slice one
worktree; use separate sessions in that worktree with one writer at a time. Start the next
slice from the previous PR's accepted head only after its required reviews, checks, and
human gates pass. An unmerged parent is valid; target its branch and verify that the child
PR contains only its own slice. Stop if ancestry or a squash merge makes that check untrue.
After a parent merge, reconcile the target and revalidate affected evidence. Retain workers
only within their assigned loop and explicitly settle, retain, or release them through the
active wrapper.

Use [the progress template](templates/progress.md) from intake to record each completed gate, its
evidence, the current stage, and the next action before advancing. Reconcile that record
with the plan and real worker state after interruption; it never supplies missing approval.

## Evidence and recovery

Classify every review finding as in-scope, out-of-scope, or unclear and attach concrete
source evidence. Treat false positives as rejected after verification. Record non-blocking
out-of-scope observations without putting them in correction briefs. Required unavailable
evidence is blocked/unverified, never an invented defect or approval. Deeper review presets
do not enable OCR or Slopo; those remain explicit opt-ins.

Keep the human-editable progress record under `${XDG_STATE_HOME:-$HOME/.local/state}`
and associate it with the repository and active run. Reconcile it against Orca, Git, and hosting-service
state; it is not proof of completion. Do not store raw logs, handles, credentials, or
sessions there. Preserve checkpoints and unrelated changes during recovery. No implicit
reset, rebase, squash, amendment, force-push, or branch deletion; destructive restoration
needs explicit approval.

Brief tasks may shorten investigation and artifacts but retain applicable scope,
evidence, authorization, and human-validation gates. Scope-expanding blockers stop the
affected work and escalate.

## References

- [Planning](references/planning.md), [first draft](references/first-draft.md),
  [improvement loop](references/improvement-loop.md), and
  [adversarial review](references/adversarial.md)
- [Coding loop](references/coding-loop.md)
- [Cleanup](references/cleanup.md)
- [Present to human](references/present-to-human.md)
- [Ship and PR](references/ship-pr.md)
- [End-to-end flow](references/end-to-end.md)
- [Scenario definitions](references/scenarios.md)
- [Progress template](templates/progress.md)
