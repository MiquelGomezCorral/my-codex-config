---
name: review-plan
description: Validate and finalize the current approved implementation plan against the user's request, repository evidence, and injected instructions. Use only when the user explicitly invokes `$review-plan`; skip ordinary planning, coding, and review requests.
---

# Review Plan

Plan approved. Now review the complete approved plan established in the current conversation against the user's request, relevant repository evidence, and all injected instructions. If no
complete approved plan is present, report the blocker and stop; do not create or infer
one. Treat the invocation input only as optional review context.

Load `subagent-routing` and delegate the review to one fresh `gpt-5.6-sol` subagent
with `high` reasoning. Give it the main agent's complete planning context: the user's
request and corrections, every decision and answered question, unresolved questions,
alternatives considered and why they were rejected, repository evidence, applicable
instructions, the separate approved `Decision records` section, and the full proposed and
approved plan. Do not assume it inherits the
conversation; explicitly include this context in its task when inheritance is unavailable.

The subagent acts as an independent critic: challenge the plan using the checks below
and return concrete flaws, supporting evidence, suggested revisions, and questions
that need user input, or explicitly report no findings. Its review is read-only;
it must not implement or finalize the plan. The main agent assesses the findings,
resolves them or asks the user, and returns the finalized plan.

Assume requirements were clarified before this command, often through `grill-me`, but
never manufacture a missing answer. If a remaining ambiguity would change behavior,
scope, or risk, ask the user one focused question and stop without finalizing the plan.

Have the critic reassess whether the plan is the simplest correct way to meet the
user's requirements:

- Verify important assumptions against the repository.
- Remove unnecessary scope, abstractions, dependencies, and compatibility work.
- Confirm the proposed files, symbols, utilities, and commands exist.
- Ensure the implementation can reach live validation with only the minimum useful
  non-live readiness check.

Use the findings to reconsider any problematic part of the plan without silently
overriding user decisions. Resolve material unanswered choices with the user.
Preserve the approved decision-record assessment and exact record/index changes in the
finalized plan. Newly proposed material record changes or unresolved intent conflicts return
to the user; unchanged approved content needs no repeated approval.

Once the findings are resolved, return the revised plan in chat as a self-contained execution specification
for an agent with no conversation history.

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

## Main-agent memory updates
Preserve the exact approved memory updates or the explicit statement that none are
needed. Challenge them when incorrect, but never silently drop them; they are not coder
tasks.

## Decision records
Preserve the approved assessment, applicable record paths, protected invariants, and exact
record/index changes. The main orchestrator owns those approved document changes during
execution; coders receive them as constraints and report conflicts.

## Out of scope
Files, behavior, cleanup, and follow-up work the executor must not perform.

Do not modify files. End by stating that the plan is finalized in chat and ready for
`$code`; do not request another verification pass. The finalized plan remains in the
conversation until `$code` persists it for execution.
