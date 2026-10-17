# Planning inside `$workflow`

Turn a freeform idea or referenced brief into a scope-locked wave plan. Do not implement,
edit product files, or persist project memory during discovery. Initialize run state with
the [workflow-progress skill](../../workflow-progress/SKILL.md) at intake, before a plan path exists.

Load `first-draft.md`, `improvement-loop.md`, and `adversarial.md` as their phases begin.
Read `diagrams.md` when proposing, commissioning, revising, or checking a diagram.
The context does not replace human approval or authorize
implementation, live actions, or changes to decision records.

## Select Depth

- Accept inline context or an `@file` reference.
- Honor an explicit `--brief` or `--full`; otherwise default to full.
- If both modes or an unknown `--` flag are supplied, ask the user to correct the
  invocation before planning.
- Never downgrade explicit full planning.
- In default full mode, inspect the relevant code first. If the outcome is clear, the
  change is local and conventional, and no material decision or risk remains, explain
  why brief planning is sufficient and ask once before switching.
- If brief planning uncovers a new dependency, persistent state, migration, public
  contract, cross-system behavior, security concern, or other material risk, ask to
  escalate. If the user declines, record the unresolved decision or accepted risk
  instead of guessing.

Full planning still omits irrelevant questions. Brief planning still requires relevant
code inspection, a clear goal and scope, and explicit approval before delivery begins. It
never skips explicit wave approval or lowers the review preset (`full` by default), and an
answer to the depth question is never an approval.

## Run the Mandatory Steps

Every wave runs these three steps in this order, in brief and full mode alike; brief mode
may shorten everything else, never these. Mark each step done when it ends.

Every question in these steps ends with a user answer. An answer the user already gave in
the request counts: list it under `Confirmed` in the next ledger update so the user can
correct it, and do not ask it again. Ask whatever is missing or vague.

1. **Grill me + investigate** (`first-draft.grill-me`, `first-draft.investigate`,
   `first-draft.independent-proposal`): run `grill-me` on the request before proposing
   anything. Then investigate as the [first draft](first-draft.md) describes, always
   including the independent proposal.
2. **How and who live validates it?** (`first-draft.live-validation`): resolve the
   [live-test questions](#define-the-live-test).
3. **Thumbs up on each slice?** (`challenge-approve.slice-gates`): resolve the
   [slice-gate question](#ask-about-slice-gates).

## Track Decisions In Conversation

Reconstruct cumulative state from the conversation rather than repeating it every
turn. After a meaningful answer or discovery, report only newly confirmed or changed
items under `Ledger update`, using only the applicable labels: `Mode`, `Confirmed`,
`Open`, `Scope`, `Consequences`, `Drift`, and `Next`.

Show a compact consolidated ledger at these applicable checkpoints, or whenever the
user asks for a recap:

1. Intent is understood.
2. Repository discovery is complete.
3. The technical flow is understood.
4. Scope is ready for approval.

In brief mode, combine or skip non-material intermediate checkpoints. The final
checkpoint is the scope-lock package rather than a duplicate ledger summary.

## Plan Adaptively

1. Preserve the user's stated intent. Clarify the problem, affected user or caller,
   desired outcome, purpose, observable success, constraints, and non-goals only as
   needed. High-level behavior comes before implementation details.
2. The human-facing coordinator loads `agents-memory` for repository work and reads only
   relevant tracked context and private notes. Load the selected
   `decision-records` skill explicitly and follow its missing-index behavior: read
   `docs/decisions/index.md` when present, otherwise treat it as an empty existing-record set and
   propose exact initialization in the approval scope. Then read every applicable record. Inspect
   the existing implementation before proposing changes: what already exists, how it is called,
   what data and state it owns, what can be reused, and the smallest real gap. Keep this assessment
   read-only; do not create an index or record speculatively. Use `codegraph_context` first for
   feature or architecture context.
3. Return to `grill-me` whenever material user judgments remain and use its decision-tree
   method. Ask the highest-leverage question by default, or up to three related
   questions. Research facts available from code, tests, history, logs, or
   documentation instead of asking the user, and send anything else unclear to a worker
   through `super-agent` rather than guessing.
4. Define the minimum coherent change and only the affected boundaries. Prefer the
   existing pattern and simplest in-scope design. Adjacent cleanup requires explicit
   inclusion unless simplification is itself the requested outcome.
5. When material, describe the trigger, caller, affected components, integration
   points, input data, validation, state ownership, persistence, side effects,
   external calls, output data, user-visible result, and relevant failure behavior.
6. If an external package or service matters, inspect its installed version and local
   usage first. Load `btca` for current source behavior of a registered resource, and
   propose adding one when the same external question keeps coming back; use `web-search`
   for other current external facts. Research a concrete open decision; do not browse a
   generic tutorial merely because the technology is unfamiliar.

## Define the Live Test

Unit tests never replace the live test. Every plan must define how the actual changed
behavior gets exercised live, end to end, with the real app, tool, service, data, or
artifact.

- During the first draft, ask "How and who live validates it?": whether this wave gets
  live tests (the default is yes), the route, and who runs each test. Record a
  "no" in the plan. It removes every live-test step: the base run, the live round and its
  progress steps, the final rerun, the wave regression, and the undefined-test blocker.
  Review still runs the code review, and the result presentation states the waived
  evidence. An opted-in test that cannot run stays blocked/unverified; it is never waived.
  A slice with live tests uses the `full` review preset.
- Write a live test set per slice with the fields `refine-plan` lists under *Live
  validation*. Each slice's set covers only that slice's behavior; regressions wait for
  the wave regression.
- Prefer the closest realistic path a real user or caller takes. Do not substitute a unit
  test, mocked harness, or shape assertion for the live route, and do not treat passing
  small tests as evidence that the live behavior works.
- The route is clear only when it settles how to reach the changed behavior, what to
  observe, how to judge it, and who runs it. Otherwise investigate, re-ask with a concrete
  proposal, and get it confirmed. Do not guess, invent a route, or assume the answer.
- Treat an undefined live test as a planning blocker: do not lock scope or finalize the
  wave until the route is defined and understood.

## Control Scope

Keep non-blocking adjacent findings in the conversational drift list. Interrupt only
when excluding one blocks the goal or creates material risk. At each checkpoint, batch
the remaining candidates and ask the user to include or defer each one. Never expand
scope silently. Deferred work stays out of the implementation plan and is not written
to a backlog automatically.

## Lock Scope

When no material branch remains unresolved, present one proportional approval package:

- Original intent, goal, and observable success.
- Verified current behavior and evidence.
- In-scope behavior and explicit exclusions.
- Decisions, rationale, consequences, and accepted risks.
- Decision-record assessment, protected invariants, and the exact proposed record/index changes.
- Affected components and end-to-end flow when material.
- Implementation outline, readiness check, and the per-slice live test set required by
  the live-test rule above.
- Candidate wave map: proposed PR-sized slices, dependencies, scope/exclusions,
  per-slice validation, review preset (`full` by default), artifacts, and exact action
  bounds or none.
- Exact private agent-memory updates for the main agent, or state that no project
  memory should change.

Wait for explicit approval. If the user changes scope, resume the relevant phase and
update only the changed ledger items. If the user rejects the package without revising
scope, write nothing and report that planning stopped without an approved plan.

## Ask About Slice Gates

After the human accepts the candidate and before `$review-plan`, so it and its
`$refine-plan` handoff already have the answer, ask whenever the wave has two or more
slices: "Do we wait for your thumbs up on each slice, or only at the end?" A one-slice wave
is not asked: record `each-slice`, since its only gate is the result gate. Either way,
record the mode as the plan's `Slice gates` field (`refine-plan` *Workflow and
authorizations*) and in progress with `--set slice-gates=<mode>`:

- `each-slice` (default): the human validates each slice's result before it ships, and
  each slice gets its own PR.
- `final-only`: slices run back to back on one branch, each ending with a local commit, and
  the human validates every slice at one final gate before any push (workflow stages 7-9).

Recommend `final-only` when the slices stack and each depends on the one before. The
answer belongs to this run only: it lives in this wave's plan. Never save it as a
preference in private agent memory (`agent-memory/decisions.md`).

## Finalize the wave

After the human accepts the candidate and the slice-gate step is done, run the one
adversarial `$review-plan` pass and resolve its findings. Use `$refine-plan` to produce a
self-contained final wave plan. Keep it proportional: a clear small task needs a compact plan, while cross-boundary work
needs the detail required to remove implementation decisions.
Include only applicable sections from:

- Planning mode and original user intent.
- `Goal` as a standalone statement of the user's final approved objective,
  independent of implementation steps.
- Success, current behavior, scope, and exclusions.
- Decisions, consequences, components, and technical flow.
- Exact files or symbols, implementation steps, and relevant failures.
- A separate `Decision records` section preserving the approved assessment, protected constraints,
  and exact record/index changes; these remain main-orchestrator-owned execution inputs.
- Minimum non-live readiness check and the per-slice live test set that satisfies the
  live-test rule. Never finalize a plan whose live route is unanswered, assumed, or only
  covered by unit tests.
- `Main-agent memory updates` with exact paths and facts; these are not coder tasks.
- The slice map, following the approved shipping layout (`each-slice`: one PR per slice;
  `final-only`: workflow stages 7-9), with dependencies, order, owners, approved scope and
  exclusions, per-slice coding size, checks, samples, tool availability, review preset,
  artifacts, human gates, and exact bounded Git/live authorizations or none.

Do not turn unanswered choices into assumptions. Resolve the Git common directory through
`agents-memory` and persist each new native plan under its `agent-memory/plans/` directory;
preserve exact existing plan paths when continuing older work. List supporting evidence
and artifacts. Keep implementation choices and durable project decisions distinct.
For human review, fill a concise brief from the artifacts skill's
`references/plan-page.md`; read that reference only when producing the brief. Keep the
full Markdown plan complete and authoritative, then check that the brief preserves its
risks, questions, expected outcomes, useful artifacts, and approval boundary. Get the page
folder, render, and publish exactly as `references/plan-page.md` says: it copies the plan and
its diagrams into the page folder before each render (`scripts/render-plan.mjs` only links
files beside its input), so do not shorten it. This plan page is the gate 2 page.
`--keep-baseline` keeps the old baseline for a re-render before the user sees it. Share the
LAN URL `hub.py publish` prints as a descriptive Markdown link; never start a server of your
own. If rendering or publishing fails, report it as a blocker and link the local page file
meanwhile. Keep the Markdown file authoritative.
Keep plan-specific editable diagrams, SVG previews, and live-test samples in the
`agent-memory/artifacts/<name>/` folder that the [artifacts skill](../../artifacts/SKILL.md#page-hub)
hands out with `hub.py dir`, not beside the plan. Delete on the hub removes that folder. No
plan artifact enters Git.
Only make diagrams that clarify a real decision or flow. Follow `diagrams.md` for the
brief, presentation, artifact, and validation contract. The deterministic renderer never delegates.
A useful custom diagram may use `super-agent`: resolve the catalog `coder` role for an
artifact-only worker and pin its harness, exact model, and thinking at dispatch. Give it the
chosen project style or pass diagram-design's `Minimal dark` template explicitly.
A required gate page that fails to render or publish is fixed or reported as a blocker,
never skipped. For optional extras such as extra diagrams, a rendering failure is
non-blocking: report it and always present the native plan and available artifacts.

Show the human the complete wave, evidence, slice map, and artifact links before asking
whether to start delivery. Give the progress page link too and keep it served during delivery.
The planning acceptance and adversarial resolution do not substitute for this wave approval. Record the approval reference and exact bounds in the
progress file, then advance to slice preparation in the same `$workflow` run.
