# Planning inside `$workflow`

Turn a freeform idea or referenced brief into a scope-locked wave plan. Do not implement,
edit product files, or persist project memory during discovery. Initialize run state with
the [workflow-progress skill](../workflow-progress/SKILL.md) at intake, before a plan path exists.

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

Full planning still omits irrelevant questions. Brief planning may abbreviate or skip
non-material phases, but both modes require relevant code inspection, a clear goal and
scope, and explicit approval before delivery begins.

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
3. Load `grill-me` when material user judgments remain and use its decision-tree
   method. Ask the highest-leverage question by default, or up to three related
   questions. Research facts available from code, tests, history, logs, or
   documentation instead of asking the user.
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

Unit tests are not enough. They only cover small things, algorithms, and model or shape
assertions; they never prove the real change works. Every plan must define how the actual
changed behavior gets exercised live, end to end, with the real app, tool, service, data,
or artifact.

- State the live test as exactly `Flow`, `Expected`, and `Can run`, naming the current
  tool that can run it, or marking it user-only.
- Prefer the closest realistic path a real user or caller takes. Do not substitute a unit
  test, mocked harness, or shape assertion for the live route, and do not treat passing
  small tests as evidence that the live behavior works.
- Record any approved live-action bounds the run needs. Live execution still requires
  that bounded authorization before it happens.
- If the route is not fully clear — how to reach the changed behavior, what to observe,
  and how to judge it — ask the user. Do not guess, invent a route, or assume the answer.
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
- Implementation outline, readiness check, and the concrete live-test route (`Flow`,
  `Expected`, `Can run`) required by the live-test rule above.
- Candidate wave map: proposed PR-sized slices, dependencies, scope/exclusions,
  per-slice validation, review depth, artifacts, and exact action bounds or none.
- Exact private agent-memory updates for the main agent, or state that no project
  memory should change.

Wait for explicit approval. If the user changes scope, resume the relevant phase and
update only the changed ledger items. If the user rejects the package without revising
scope, write nothing and report that planning stopped without an approved plan.

## Finalize the wave

After the human accepts the candidate, run the one adversarial `$review-plan` pass and
resolve its findings. Use `$refine-plan` to produce a self-contained final wave plan.
Keep it proportional: a clear small task needs a compact plan, while cross-boundary work
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
- Minimum non-live readiness check and the concrete live `Flow`, `Expected`, and
  `Can run` that names a real tool or user-only runner and satisfies the live-test rule.
  Never finalize a plan whose live route is unanswered, assumed, or only covered by unit
  tests.
- `Main-agent memory updates` with exact paths and facts; these are not coder tasks.
- The slice map: one PR per slice, dependencies, order, owners, approved scope and
  exclusions, per-slice coding size, checks, samples, tool availability, review preset,
  artifacts, human gates, and exact bounded Git/live authorizations or none.

Do not turn unanswered choices into assumptions. Resolve the Git common directory through
`agents-memory` and persist each new native plan under its `agent-memory/plans/` directory;
preserve exact existing plan paths when continuing older work. List supporting evidence
and artifacts. Keep implementation choices and durable project decisions distinct.
For human review, fill a concise brief from
`plan-review-template.md`; read that reference only when producing the brief. Keep the
full Markdown plan complete and authoritative, then check that the brief preserves its
risks, questions, expected outcomes, useful artifacts, and approval boundary. Render both:
`node "$HOME/.agents/skills/workflow/scripts/render-plan.mjs" --input <plan.md> --review <review.json> --output <artifact.html>`.
Then open the resulting HTML with `npx -y lavish-axi <artifact.html>`. Capture the actual review
URL returned by the viewer and include it as a descriptive Markdown link when presenting
the plan, before asking for approval. Do not substitute the HTML path or guess the URL.
For a direct browser link, serve only the artifact directory with the shared standard-library
helper: `python3 <workflow-skill>/scripts/serve-artifact.py --directory <artifact-directory>`.
It follows the global artifact-sharing rule and prints the local URL and chosen port.
Share the actual direct URL and any Lavish viewer URL as separate links. If neither is
available, report that and link to the local artifact using the chat's clickable file-link
format. Keep the Markdown file authoritative.
Keep the new HTML and any plan-specific editable diagrams/SVG previews
beside the private plan so relative links work and no new plan artifact enters Git.
Lavish displays the HTML and does not itself produce SVG. Only make diagrams that
clarify a real decision or flow. Follow `diagrams.md` for the brief, presentation, artifact,
and validation contract. The deterministic renderer never delegates. A useful custom
diagram may use `super-agent`: route an artifact-only worker through Pi at `medium` tier and
`low` thinking, resolving the exact model from the catalog at dispatch. Give it the chosen
project style or pass diagram-design's `Minimal dark` template explicitly. Do not run
`lavish-axi poll` unless the user asks for an
interactive feedback session. Rendering or Lavish failure is non-blocking: report it and
always present the native plan and available artifacts.

Show the human the complete wave, evidence, slice map, and artifact links before asking
whether to start delivery. The planning acceptance and adversarial resolution do not
substitute for this wave approval. Record the approval reference and exact bounds in the
progress file, then advance to slice preparation in the same `$workflow` run.
