---
name: review-plan
description: Validate and finalize the current approved implementation plan against the user's request, repository evidence, and injected instructions. Use only when the user explicitly invokes `$review-plan`; skip ordinary planning, coding, and review requests.
---

# Review Plan

Plan approved. Now review the complete approved plan established in the current conversation against the
user's request, relevant repository evidence, and all injected instructions. If no
complete approved plan is present, report the blocker and stop; do not create or infer
one. Treat the invocation input only as optional review context.

Assume requirements were clarified before this command, often through `grill-me`, but
never manufacture a missing answer. If a remaining ambiguity would change behavior,
scope, or risk, ask the user one focused question and stop without finalizing the plan.

Before finalizing the plan you can stop and think once again and not follow the specifications if
you find anything problematic with the plan, such as not really the best / most optimal:

- Verify important assumptions against the repository.
- Remove unnecessary scope, abstractions, dependencies, and compatibility work.
- Confirm the proposed files, symbols, utilities, and commands exist.
- Ensure the implementation can reach live validation with only the minimum useful
  non-live readiness check.

Take this a second chance to review the plan and loop to ask to the user/reconsider.
We can reconsider just one part, a few or the whole plan if you new thoughts do comply against the plan.


Otherwise, if the plan is okey, return the revised plan in chat as a self-contained execution specification
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

## Out of scope
Files, behavior, cleanup, and follow-up work the executor must not perform.

Do not modify files. End by stating that the plan is finalized in chat and ready for
`$code`; do not request another verification pass. The finalized plan remains in the
conversation until `$code` persists it for execution.
