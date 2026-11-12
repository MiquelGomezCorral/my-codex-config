---
name: workflow
description: Run the complete agentic workflow from an initial idea and evidence through an approved wave plan, scoped slices, review, human validation, and shipping. Use for explicit `$workflow` or `/commands/workflow` requests.
---

# Workflow

Accept the initial request, evidence, ideas, or `@file` as input. Load the
[workflow-progress skill](../workflow-progress/SKILL.md) and initialize run state at
intake; write the page link it prints to the user before your next tool call. Every run uses
that skill from intake to close, at each event in its "When to update" table, so the user
reads the page instead of asking. Load the [planning reference](references/planning.md) as planning begins. The plan
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
the coordinator, which stores accepted artifacts in the agent-artifacts skill's `agent-memory/artifacts/<name>/` folder.

Present every artifact the human must review as a descriptive clickable link in the
same message, including plans, diagrams, mockups, reports, and validation evidence.
Publish every browser preview, gate pages included, through the
[agent-artifacts skill's page hub](../agent-artifacts/SKILL.md#page-hub) and return the URL it prints; a
bare path is not a review link. The progress page is a hub page too, published at intake
and refreshed by every update ([workflow-progress](../workflow-progress/SKILL.md)). Apply
this at every human gate.
Each gate has a required page: the discovery page after the first draft, the plan page at
wave approval, and the result page ([present to human](references/present-to-human.md)).
When you ask for a decision, set `--set human-decision=<what to decide> <page URL>` and
clear it with `--set human-decision=None` after the answer. A revised page is rendered over
the same output path, so it marks what changed since the user last saw it. A required page
that fails to render is fixed or reported as a blocker, never skipped.
Use the [plan-review icon catalog](../agent-artifacts/references/plan-page.md#icons) when selecting
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
Run ID: <workflow-progress run id>
Slice ID: <the slice's id in that run>
Progress script: node <absolute path to workflow-progress>/scripts/progress.mjs
Progress path: <path printed by workflow-progress `path --run <id>`>
Scope: <approved paths and behavior>
Exclusions: <explicit boundaries>
Size: <small|medium|large, as recorded for the slice in the approved plan>
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
   Run the planning reference's three mandatory steps in order, in brief mode too:
   1. `grill-me`, then investigation that always includes the code-blind proposal, written
      by a worker through `super-agent`.
   2. "How and who live validates it?" until flow, expected result, and runner are confirmed.
   3. The slice-gate question after the human accepts the candidate, before `$review-plan`.

   Initialize progress at intake. Mark `first-draft.grill-me`, `first-draft.investigate`,
   `first-draft.independent-proposal`, `first-draft.live-validation`, and
   `challenge-approve.slice-gates` done as each ends. Validation means a defined live test
   of the real behavior; unit tests never replace it. Define how to live test every change
   on the plan. Show the discovery page (gate 1) and revise it from the feedback.
2. **Improvement:** incorporate feedback, resolve choices, and add useful diagrams or
   mockups. Build a complete candidate wave with proposed slices, dependencies, checks,
   review depth, artifacts, and bounded authorizations. Present and revise it until the
   human accepts it for adversarial review.
3. **Adversarial review and wave approval:** once the human accepts the candidate, run the
   planning reference's third mandatory step (the slice-gate question), then run
   `$review-plan` once. It routes two concurrent `critic` workers through `super-agent`'s
   catalog `adversarial` role and owns the family preference and what happens when a
   provider is unavailable. Preserve an explicit user route. Verify consequential claims and
   bug evidence, allow one planner rebuttal, and escalate remaining disputes. `$review-plan`
   calls `$refine-plan`. Persist the complete wave Markdown plan and render its reviewable HTML
   and available editable diagrams/SVG previews as described in the planning reference.
   Show all wave evidence, slices, artifacts, and authorizations to the human on the plan
   page (gate 2), and give the progress page link, which stays served during delivery. Ask
   whether to start delivery; do not dispatch coding before explicit wave approval. That approval
   also covers each slice's live test set, or the recorded opt-out (`refine-plan`
   *Live validation*), and fixes the wave's `Slice gates` mode.
4. **Slice preparation:** the stage owner for stages 4-6 is the root for a `small` slice and
   the read-only `coding-supervisor` for a `medium` or `large` one (stage 5 sets its grant).
   A supervisor never asks the human; it escalates every human decision to the root, which
   asks. The stage owner refines and narrows each approved slice against current repository
   state before dispatch. Refinement may change technical steps
   within the approved outcome and scope; report amendments. Escalate changed behavior,
   scope, dependencies, validation method, or authority to the human, except that the
   stage owner may adjust live tests within their approved bounds and report each change;
   widening a test's environment or side-effect bounds still needs approval. Before coding,
   the stage owner lists open PRs that touch the slice's files (for example,
   `gh pr list --json number,title,files`). If one replaces or reworks that code, it stacks
   the slice on that PR or waits, and reports which. Record the slice's
   result, owner, `Size:`, checks, samples, tools, review preset, artifacts, and exact
   slice base revision before coding for a `small` slice (stage 6 says who writes the record
   for a supervisor's slice). The
   human-approved plan records each slice's `Size: small|medium|large`, proposed by the
   planner and approved with the plan, with any human override. The wave
   approval covers its exact implementation and worktree bounds; ask for missing live
   authorization before that action. The root applies only the exact approved decision-record
   changes once through their owning skill before coding; it never delegates those writes.
   Require the complete grounded plan: verified current behavior and sources, desired
   result, scope and exclusions, implementation decisions, acceptance evidence, and an
   executable validation method with samples and available tools. Check the planned
   non-live test route before coding; preflight a live tool only within approved bounds.
   Then the stage owner runs each new live test once on the slice base (the base live run):
   it must fail or show the old behavior. Redefine a test that passes there within its
   bounds and report it; if the behavior already exists, ask the human.
   Stop if required evidence or a usable validation route is missing.
5. **Coding loop:** send a small plan directly to one retained coder. The writer uses the
   harness's normal native coding capability, as routed in
   [native capabilities](references/native-capabilities.md). For a medium or large plan, use
   a read-only `coding-supervisor` with a bounded grant to direct one retained coder and
   coordinate the selected review within the approved slice. It owns stages 4-6 for the
   slice and never edits product source or commits (the coder edits; a git worker
   commits). The grant is `Delegation: allowed (max depth 3, total 65, active 4)`, covering
   one coder, git workers, review and cleanup coordinators, the `full` verifier, and
   `computer-controller` testers. The total covers three review and three cleanup rounds
   at their widest; active is one coordinator plus three of its workers at a time, and a
   bigger swarm follows `super-agent`'s `active` cap rule. If Orca cannot nest 3 levels,
   the root starts only the review and cleanup coordinator workers, on the supervisor's
   request, and relays their reports, questions and escalations to it, and the supervisor's
   answers back; the supervisor stays the `$review` and `$cleanup` parent, launching the
   `full` verifier and the live-round testers itself and verifying the findings.
   `super-agent` takes the supervisor and coder models from the catalog's sized entries.
   The stage owner invokes `$review` at the size the
   coding loop's *Size the review* picks (the approved preset by default) with the complete
   approved plan, amendments, checks, and slice context. In workflow context, the review
   basis includes changes from the recorded slice base through the inspected head plus
   every task-owned staged, unstaged, and untracked change. Pass the reviewer the base, head,
   task-owned paths, and any `Review focus`; it reports the inspected revisions. Standalone
   `$review` keeps staged-first selection. Each round runs the code review and the slice's
   live tests together, gathers insights, and plans fixes, as the
   [coding loop](references/coding-loop.md) describes.
   Verify findings before correction, then route and escalate them as the
   [coding loop](references/coding-loop.md) step 6 sets.
6. **Cleanup:** after coding gates pass, the stage owner runs the
   authorized local checkpoint through a git worker under `$git`, records its hash, then
   runs the read-only `$cleanup` audit. The comparison from the
   slice base is the skip test and the basis of the slice's first round: compare the
   complete task-owned changes from base through the current tree, including the checkpoint
   and later staged, unstaged, or untracked worktree changes. A later round passes the
   checkpoint the previous round audited as its `$cleanup` basis, with the base comparison
   as context; with no new changes, it runs only the earlier-fix check.
   Skip cleanup only when that complete comparison is empty; a clean post-checkpoint status
   alone is not enough. Verify each finding and accept or reject it with a concrete reason.
   Before a later round can pass, the stage owner checks every earlier
   accepted finding the human did not leave as recorded risk against the current tree; one
   that did not fully land, including a fix that changed nothing, counts as an accepted
   finding of that round. Cleanup passes only when an audit round has no accepted findings;
   accepted findings go through stage 5, then a new checkpoint and the next round. From
   round 3 on (the cap), ask the human before applying a round's accepted findings. Stage 6
   ends with a clean round or with recorded risk the human accepted; recorded risk never
   counts as clean. Every later code change, from human feedback, PR review, wave close,
   merge conflicts, or CI, takes stages 5 and 6 before it returns to the human, before a
   `final-only` slice's local commit, or before a push. Each such change restarts the round
   count. Its first round audits from the checkpoint the last cleanup round audited, or from
   the slice base when the change needs the whole slice.
   The full slice live test set reruns on the final head. Before presentation, a
   `final-only` slice's local commit, or a push, the task-owned diff from the checkpoint the
   last cleanup round audited to the current tree must be empty. With no task-owned
   change at all, cleanup is skipped and the comparison from the slice base is empty.
   [Cleanup](references/cleanup.md) owns what each round audits, how big each audit is, and
   the cap's outcomes.
   A supervisor ends stage 6 with one evidence packet: the base, checkpoint and head
   revisions; check results; a per-finding disposition table for review and cleanup; its
   stage 4 record and each round's progress note (tree hash and step 5 labels);
   live results with evidence paths; the requirement rows for the slice's `Covers` IDs
   ([present to human](references/present-to-human.md) shapes them); the diff stat;
   amendments, blockers and escalations; gaps; and `Memory candidates:`. A supervisor updates
   only its own slice in the run record, on every step change, wait, result, and blocker, with
   the packet's `Progress script` as `update --run <Run ID> --slice <Slice ID>`: steps, activity,
   next action, notes, evidence, and blockers. That update is its one allowed write; it never
   edits `progress.json` by hand. The root keeps the wave fields, approvals, gates, attention
   items, and slice creation: it records the slice's owner, `Size:` and base at dispatch, writes
   the rest from the packet without appending slice evidence the supervisor already wrote, and
   verifies consequential packet claims against the cited evidence. It also
   keeps wave approval, sizes, human gates and pages,
   feedback routing, shipping (stage 8), memory writes and the wave regression (stage 9).
   For a `medium` or `large` slice, the root sends each later code change, with the last
   packet, to a fresh coding supervisor, which runs stage 4's base live run for any new
   live test on the checkpoint the last cleanup round audited, not the slice base, then
   stages 5 and 6 from that checkpoint, and returns a new packet.
7. **Present to human:** show the result page (gate 3) with the actual result, live evidence,
   checks, known gaps, and artifacts after stage 6 ends. Before the page, the root checks
   the slice's `Covers` IDs against the current head and live evidence ([present to
   human](references/present-to-human.md) shapes the requirements table). A missing ID follows
   [evidence and recovery](#evidence-and-recovery). For a noticeable or big slice, add
   the UI evidence code-quality `ui.md` (*Inspect the running app*) lists for the human.
   Route feedback that changes code through stages 5 and 6 before presenting again. After
   acceptance, the human-facing coordinator applies exact approved updates to private agent
   memory once. Do not ship before human acceptance.
   In a `final-only` wave, skip this per-slice presentation. After stage 6 ends, the Git
   worker makes the slice's local commit on the wave's branch, as the plan names it: not
   shipping, no push or PR. Record its hash as `slice.final-commit-hash`. In one update,
   mark the slice's `human-validation.*`, `ship-monitor.conflicts`, and
   `ship-monitor.ci-feedback` steps `skipped` and `ship-monitor.commit-push-pr` done, with
   the note "final-only, commit only". The next slice starts on the same branch. Reviews,
   live tests, and cleanup still run for every slice. A red check, a blocking finding, or
   missing evidence stops the chain and goes to blockers.
8. **Ship and monitor:** after acceptance, the Git worker inspects remaining changes
   against the approved scope and accepted result, stages explicit task-owned deliverables,
   and creates a final commit only when needed. It excludes private memory, progress files,
   temporary agent artifacts, and unrelated changes; approved skill and agent-configuration
   files remain deliverables. Verify the final tree matches the accepted result before
   performing only the plan-authorized push; a merge-conflict, CI, or review fix that leaves
   behavior unchanged is the only exception. Pass it the exact plan path and slice; it
   writes commits and the PR title and body from the plan's goal, as the `git` skill's
   plan context and PR title rules describe. Record checkpoint and final commit hashes.
   Acceptance is a result gate, not a second Git authorization request. Route a
   merge-conflict resolution through `git-worker`, and inspect required CI and review
   feedback. A conflict resolution or a fix that changes code takes stages 5 and 6 before
   the push, and the result returns to the human only if behavior changed or remains
   uncertain. Never infer an unnamed action. In a `final-only` wave this stage runs once,
   after final acceptance in stage 9: push only if the plan names it, and open a PR only
   when the user asks.
9. **Close the wave:** after the last slice, rerun every slice's live test set on the
   final head. Fix a failure inside the owning slice's scope when it
   [fits](#evidence-and-recovery) the last slice's grant, routed through stages 5-8,
   cleanup included; otherwise use a bounded correction slice the human approves. After a
   correction, rerun the whole wave set. Ask the human
   about unclear results; close only when the set passes. Before the final gate and at
   wave close, the root checks every requirement ID against the current head and live
   evidence. A missing one follows [evidence and recovery](#evidence-and-recovery). Record
   completed and unfinished slices, next decisions, deferred findings, and lessons in
   local progress state. In a `final-only` wave, the passing set opens the final gate:
   present one result page with a section per slice, and route feedback as [present to
   human](references/present-to-human.md)
   describes, then ship through stage 8.

Keep slices sequential by default. Ask before independent parallelism. Give each slice one
worktree; use separate sessions in that worktree with one writer at a time. Start the next
slice from the previous PR's accepted head only after its required reviews, checks, and
human gates pass. An unmerged parent is valid; target its branch. Every PR holds only its
own commits, as the `git` skill's `Own commits only` rule says. After a parent merge,
retarget the child, drop the parent's commits that way, and revalidate affected evidence.
Retain workers only within their assigned loop and explicitly settle, retain, or release
them through the active wrapper.

A `final-only` wave instead keeps one worktree and one branch for all its slices (the
plan's branch), and each slice starts from the previous slice's local commit. The human
may switch the mode mid-wave; record the switch with `--append approved-amendment=...` and
`--set slice-gates=...`. A switch changes only whether the remaining slices get their
human gate: completed slices keep their state, and the shipping layout chosen at approval
stays.

Use [workflow-progress](../workflow-progress/SKILL.md) at intake and each transition to
record completed gates, evidence, current activity, and next action; read each reply and fix
and rerun a rejected call. Reconcile its state with the plan and real worker state after
interruption; it never supplies missing approval. Record what the user must act on while
work continues as attention items, following that skill's attention rule.

## Evidence and recovery

Classify every review finding as in-scope, out-of-scope, or unclear and attach concrete
source evidence. Treat false positives as rejected after verification. Record non-blocking
out-of-scope observations without putting them in correction briefs. Required unavailable
evidence is blocked/unverified, never an invented defect or approval. Deeper review presets
do not enable OCR or Slopo; those remain explicit opt-ins.

A missing requirement is a P1 finding, so the round cap never defers it. A P2/P3 finding
that the cap defers counts as missing when it leaves a requirement unmet. It is routed
back without asking the human: at a slice gate into that slice's coding loop
(stages 5 and 6), and at wave close as the owning slice's correction task through
stages 5 and 6 when the fix fits. A fix fits when it stays inside that slice's approved
scope and its own stage 5-6 route, with no new kind of agent. After two unsuccessful
correction rounds it escalates as [coding loop](references/coding-loop.md) step 6 sets.
The human is asked to approve a bounded correction slice only when the fix does not fit,
would change scope, or is impossible.

Keep script-maintained JSON run state and its generated HTML where [workflow-progress](../workflow-progress/SKILL.md) puts them, under the repository's `agent-memory/workflow-runs/`.
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
