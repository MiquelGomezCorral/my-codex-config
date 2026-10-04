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

## Planning mode
Preserve the approved `brief` or `full` mode. Keep a brief plan proportional rather
than expanding it to fill every optional section.

## Goal
One sentence describing the observable outcome.

## Context
Current behavior, relevant evidence, and why the change is needed.

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
Define one representative live test using exactly `Flow`, `Expected`, and `Can run`.
Name the current tool that can run it, or mark it user-only. Mark the flow pending user
approval; neither the planner nor executor may run it automatically.

Unit tests are not enough: they only cover small things, algorithms, and model or shape
assertions, so they never replace the live test. If the live route is not fully clear —
how to reach the changed behavior, what to observe, and how to judge it — ask the user one
focused question and stop without finalizing. Never guess a route, and never finalize a
plan whose only validation is unit tests.

## Main-agent memory updates
Preserve the exact approved memory updates or the explicit statement that none are
needed. Challenge them when incorrect, but never silently drop them; they are not coder
tasks.

## Decision records
Preserve the approved assessment, applicable record paths, protected invariants, and exact
record/index changes. The main orchestrator owns those approved document changes during
execution; coders receive them as constraints and report conflicts.

## Workflow and authorizations (complete workflow only)
Record slice order, dependencies, per-slice scope and exclusions, coding size, owners,
checks, samples, tool availability, review preset, acceptance evidence, required
artifacts with editable source and preview paths, human gates, and known starting
revisions; for later slices state the accepted-predecessor-head rule instead. List
each approved live or Git action separately with its target and bounds; state `none` when
there is no authorization. Workflow context and progress state do not create permission.
Omit this section for standalone plans.

## Out of scope
Files, behavior, cleanup, and follow-up work the executor must not perform.

Do not modify files. End by stating that the plan is finalized in chat and ready for
`$code`; do not request another verification pass. The finalized plan remains in the
conversation until `$code` persists it for execution.
