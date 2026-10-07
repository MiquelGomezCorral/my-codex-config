---
name: workflow
description: Run the complete agentic workflow from an initial idea and evidence through an approved wave plan, scoped slices, review, human validation, and shipping. Use for explicit `$workflow` or `/commands/workflow` requests.
---

# Workflow

Accept the initial request, evidence, ideas, or `@file` as input. Load the
[workflow-progress skill](../workflow-progress/SKILL.md) and initialize run state at
intake; load the [planning reference](references/planning.md) as planning begins. The plan
path remains pending until the wave is finalized. This single entry point owns planning
and delivery. The human owns material
decisions, bounded approvals, final result acceptance, and shipping authority. The
human-facing coordinator advances routine stages when their exit evidence is complete;
pause only for a human decision gate, missing authority, a blocker, or changed scope.
`super-agent` remains the sole owner of delegation policy; the active wrapper owns
worker lifecycle.
The human-facing coordinator alone loads `agents-memory` and writes to the private plan
and memory directory. Workers receive the exact approved plan and relevant context, not
access to other private notes; they report memory candidates and produced artifacts to
the coordinator, which stores accepted artifacts beside the private plan.

Present every artifact the human must review as a descriptive clickable link in the
same message, including plans, diagrams, mockups, reports, and validation evidence.
For browser previews, return the viewer's actual URL as described in the planning
reference; a bare path is not a review link. Apply this at every human gate.
Use the [plan-review icon catalog](references/plan-review-template.md#icons) when selecting
icons for review JSON.

## Authority and context

Keep product edits with a retained implementation worker. Delegate substantial
investigation, research, evidence verification, and artifact production through
`super-agent`. Use fresh sessions for distinct stages and slices, and retain a worker
only within its assigned loop. Never give one slice more than one active writer.

Pass stage skills this context after the wave plan is approved:

```text
Workflow context: approved
Plan path: <absolute private plan path, or an existing approved plan path>
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
   Use a callable native planning mode where available; otherwise use a scoped planning
   prompt, as routed in [native capabilities](references/native-capabilities.md).
   Get an independent code-blind proposal before sharing the preferred solution. Grill
   the human on material decisions after researching discoverable facts. Validation means
   a defined live test of the real behavior, not unit tests; unit tests only cover small
   things, algorithms, and model or shape assertions. Define how to live test every change
   on the plan, and ask the user whenever that route is not fully clear.
2. **Improvement:** incorporate feedback, resolve choices, and add useful diagrams or
   mockups. Build a complete candidate wave with proposed slices, dependencies, checks,
   review depth, artifacts, and bounded authorizations. Present and revise it until the
   human accepts it for adversarial review.
3. **Adversarial review and wave approval:** run `$review-plan` once. It routes two
   concurrent `critic` workers through `super-agent`'s catalog `adversarial` role, which
   owns the family preference and what happens when a provider is unavailable. Preserve an
   explicit user route. Verify consequential claims and bug
   evidence, allow one planner rebuttal, and escalate remaining disputes. `$review-plan` calls
   `$refine-plan`. Persist the complete wave Markdown plan and render its reviewable HTML
   and available editable diagrams/SVG previews as described in the planning reference.
   Show all wave evidence, slices, artifacts, and authorizations to the human. Ask whether
   to start delivery; do not dispatch coding before explicit wave approval.
4. **Slice preparation:** refine and narrow each approved slice against current repository
   state before dispatch. The root does this for `small`; a read-only `coding-supervisor`
   can do it for `large` under a bounded grant. Refinement may change technical steps
   within the approved outcome and scope; report amendments. Escalate changed behavior,
   scope, dependencies, validation method, or authority to the human. Record its
   result, owner, coding size, checks, samples, tools, review preset, artifacts, and exact
   slice base revision before coding. The
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
5. **Coding loop:** send a small plan directly to one retained coder. The writer uses the
   harness's normal native coding capability, as routed in
   [native capabilities](references/native-capabilities.md). For a large plan, use
   a read-only `coding-supervisor` with a bounded grant to direct one retained coder and
   coordinate the selected review within the approved slice. The small-slice coordinator
   or large-slice supervisor invokes `$review --preset <approved preset>` with the complete
   approved plan, amendments, checks, and slice context. In workflow context, the review
   basis includes changes from the recorded slice base through the inspected head plus
   every task-owned staged, unstaged, and untracked change. Pass the base, head, and
   task-owned paths to the reviewer, who reports the inspected revisions. Standalone
   `$review` keeps staged-first selection.
   Verify findings before correction; correct every verified in-scope P0-P3 finding, using
   priority to order work. Escalate after two unsuccessful rounds for the same unresolved
   problem.
6. **Cleanup:** after coding gates pass, run the authorized local checkpoint through
   `$git`, record its hash, then run the read-only `$cleanup` audit with the slice base and
   checkpoint hash. Compare the complete task-owned changes from base through the current
   tree, including the checkpoint and later staged, unstaged, or untracked worktree changes.
   Skip cleanup only when that complete comparison is empty; a clean post-checkpoint status
   alone is not enough. Verify each finding, apply or reject it with a concrete reason, and
   route in-scope simplifications back through the coding loop. A correction must pass
   affected checks, review, and the cleanup closure check before presentation.
7. **Present to human:** show the actual result, planned evidence, checks, known gaps, and
   artifacts after cleanup corrections pass their affected gates. Route feedback through
   the coding loop. After acceptance, the human-facing coordinator applies exact approved
   updates to private agent memory once. Do not ship before human acceptance.
8. **Ship and monitor:** after acceptance, the Git worker inspects remaining changes
   against the approved scope and accepted result, stages explicit task-owned deliverables,
   and creates a final commit only when needed. It excludes private memory, progress files,
   temporary agent artifacts, and unrelated changes; approved skill and agent-configuration
   files remain deliverables. Verify the final tree matches the accepted result before
   performing only the plan-authorized push. Pass it the exact plan path and slice; it
   writes commits and the PR title and body from the plan's goal, as the `git` skill's
   plan context and PR title rules describe. Record checkpoint and final commit hashes.
   Acceptance is a result gate, not a second Git authorization request. If a merge
   conflict occurs, route its resolution through `git-worker`, rerun affected checks and
   review, and re-present the result if behavior changed or remains uncertain. Inspect
   required CI and review feedback; never infer an unnamed action.
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

Use [workflow-progress](../workflow-progress/SKILL.md) at intake and each transition to
record completed gates, evidence, current activity, and next action. Reconcile its state
with the plan and real worker state after interruption; it never supplies missing approval.

## Evidence and recovery

Classify every review finding as in-scope, out-of-scope, or unclear and attach concrete
source evidence. Treat false positives as rejected after verification. Record non-blocking
out-of-scope observations without putting them in correction briefs. Required unavailable
evidence is blocked/unverified, never an invented defect or approval. Deeper review presets
do not enable OCR or Slopo; those remain explicit opt-ins.

Keep script-maintained JSON run state and its generated HTML under `${XDG_STATE_HOME:-$HOME/.local/state}`.
Reconcile them against the selected lifecycle, Git, and hosting-service state; they are not proof of completion.
Do not store raw logs, handles, credentials, or sessions there. Preserve checkpoints and
unrelated changes during recovery. No implicit reset, rebase, squash, amendment, force-push,
or branch deletion; destructive restoration needs explicit approval.

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
- [Workflow progress state and page](../workflow-progress/SKILL.md)
- [Legacy progress template](templates/progress.md)
