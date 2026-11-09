---
name: refine-plan
description: Refine the current implementation plan into the canonical self-contained execution-spec template. Use when the user explicitly invokes `$refine-plan`, or when `review-plan` hands off a finalized plan for template rendering.
---

# Refine Plan

Refine the current implementation plan established in the conversation into the
self-contained execution specification below, then return it in chat. Treat the
invocation input only as optional refinement context. If no complete plan is present,
report the blocker and stop; do not create or infer one.

Preserve the approved content: the user's request and corrections, resolved decisions,
repository evidence, the separate approved `Decision records` section, and the approved
`brief` or `full` mode. Do not silently override user decisions or add scope. If a
remaining ambiguity would change behavior, scope, or risk, ask the user one focused
question and stop without finalizing the plan.

In a complete workflow, do not finalize without the *Context*, `Can run` (or the recorded
live-test opt-out), and `Slice gates` records below. Name the missing one and stop.

## Planning mode
Preserve the approved `brief` or `full` mode. Keep a brief plan proportional rather
than expanding it to fill every optional section.

## Goal
One sentence describing the observable outcome.

## Context
Current behavior, relevant evidence, and why the change is needed. In a complete
workflow, include the grill-me answers and what the investigation found: codebase mapping,
research, and the code-blind proposal.

## Files touched
Exact implementation paths only.

## Requirements
Required behavior, invariants, interfaces, and important edge cases. Include only
facts established by the user or repository; do not turn unanswered choices into
assumptions.

## Steps
Numbered actions. Name the exact file and symbol where possible, the intended change,
and the existing technique or pattern to use. Include enough detail to avoid design
decisions during execution without writing the implementation.

## Applicable instructions
List 3-5 applicable instructions with their source path and a concise paraphrase. Do
not duplicate long passages from instruction files.

## Readiness check
Give only the smallest existing non-live command or check needed to establish that the
changed app, project, or artifact is ready to start for live validation. Do not add a
broad test suite or unrelated checks.

## Live validation
Define the live test set, one set per slice in a complete workflow, ordered from broad and
simple (start the app, smoke, simple mock data) to precise (real data, edge cases). Give
each test these fields:

- `Flow`: the steps a real user or caller takes.
- `Samples`: the files and data it needs, prepared during planning and saved in the plan's `agent-memory/artifacts/<name>/` folder (see the [artifacts skill](../artifacts/SKILL.md#page-hub)).
- `Where`: the environment it runs in.
- `Can run`: who runs it (the agent with the current tool and commands, the user only, or
  both).
- `Expected`: the observable result that decides pass or fail.
- `Reset`: how to stop the app and restore its data after a run.
- `Bounds`: the side effects it may cause and what it must not touch.

The approved wave authorizes, within each test's `Where` and `Bounds`, its base run, review
rounds, final rerun, and wave regression. Without an approved wave, running it still needs
the user's bounded authorization.

Unit tests never replace the live test. If the live route is not clear by the planning
reference's [definition](../workflow/references/planning.md#define-the-live-test), ask the
user one focused question and stop without finalizing. Never guess a route, and never
finalize a plan whose only validation is unit tests.

If the user declined live tests, record that opt-out explicitly in place of the set; the
live-test rules above then do not apply.

## Main-agent memory updates
Preserve the exact approved memory updates or the explicit statement that none are
needed. Challenge them when incorrect, but never silently drop them; they are not coder
tasks.

## Decision records
Preserve the approved assessment, applicable record paths, protected invariants, and exact
record/index changes. The main orchestrator owns those approved document changes during
execution; coders receive them as constraints and report conflicts.

## Workflow and authorizations (complete workflow only)
Record slice order, dependencies, per-slice scope and exclusions, `Size: small|medium|large`
(approved with the plan; it picks the coder and supervisor route),
`UI impact: none|low|noticeable|big` with a one-line reason (the expected level, sized as
code-quality `ui.md` says; each review round re-sizes it), owners,
checks, samples, tool availability, review preset, acceptance evidence, required
artifacts with editable source and preview paths, human gates, and known starting
revisions; for later slices state the accepted-predecessor-head rule instead. Record
`Slice gates: each-slice` (the default) or `Slice gates: final-only` from the human's
answer to the slice-gate question; for `final-only`, name the wave's one branch and state
that each later slice starts from the previous slice's local commit. List
each approved live or Git action separately with its target and bounds; state `none` when
there is no authorization. Workflow context and progress state do not create permission.
Omit this section for standalone plans.

## Out of scope
Files, behavior, cleanup, and follow-up work the executor must not perform.

Do not modify files. End by stating that the plan is finalized in chat and ready for
`$code`; do not request another verification pass. In a standalone use the finalized plan
remains in the conversation until `$code` persists it for execution. In a complete workflow
the coordinator persists it and returns to the wave-approval gate before any coding.
