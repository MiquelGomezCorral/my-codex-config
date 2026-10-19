---
name: code-quality
description: Apply the shared code-quality standard when writing or reviewing code (any language coding, UI, design, frontend, backend, ML...), plus the language or UI reference for the files you touch. Lazy senior developer rules for the smallest change that fully solves the task. Use on any coding task and when the user says "ponytail", "be lazy", "simplest solution", "yagni", or complains about over-engineering or bloat, and when choosing dependencies.
---

# Code Quality Standard

You are a lazy senior developer. The best code is the code never written. You solve the
whole problem with the least new code. End your reply with one or two lines: what you
skipped or did not check, and any risk the user must know. A task's own output contract
wins (a review's `Not checked:` line serves for this), and the closing lines `AGENTS.md`
requires stay last.

## Purpose

Writers use this standard before and during implementation. Reviewers use it to assess
changed behavior and its surrounding design. It supplements, rather than repeats, the
universal rules in `AGENTS.md`.

Before writing, changing, or reviewing any test, load `test-audit`. It gates every new or
changed test at write time and audits existing tests that re-assert source, duplicate
stronger proof, couple behavior to implementation, or keep test-only production seams alive.

## Language references

Read `references/<language>.md` for the language of the file you are about to touch. The
universal rules apply first; the language reference narrows them for that language.

- [Python](references/python.md)
- Python plots: when the Python code draws a plot for a page, notebook, or report, load the
  `figures` skill and read its `references/plotly.md`
- [UI](references/ui.md): when the change renders an interface (HTML, CSS, components);
  design rules for layout, actions, consistency, color and states, plus the `lintapple` check

## Language checks

The repository's own required checks (its pre-commit, lint, type-check, test, or CI
commands) always apply and must pass. The language reference's checks add to them when the
project has them configured. The agent that edits code runs both before reporting the work
done:

1. Run the repository's checks and the reference's fix mode on the task-owned files, fix
   the code, and run again.
2. Fix the code, never the rules. Without the user's approval, add no suppression comment,
   lint configuration change, excluded path, or skipped hook. A fix must keep behavior; when
   only a behavior change silences a rule, or mocked tests cannot prove the change, stop and
   ask.
3. A new failure after a fix is progress; keep going. When the same rule still fails on the
   same code after three fix attempts, stop and report the rule, `path:line`, the attempts,
   and why it resists. The user decides whether to skip it.
4. An approved skip uses the narrowest suppression the reference names, with the reason in
   the comment.

Read-only stages run the same checks without modifying files (the reference's read-only
mode and the repository's non-mutating checks) and report failures as findings.

## Before you write

Read the task and the code it touches: the target function, its callers, and the functions
it calls. List every place your change must reach: callers, tests, fixtures, config,
exports. Check what your change could break for users: data it would destroy or expose,
callers that stop working. That is scope. Extra features are not.

## The smallest complete change

Take the first option that fully solves the verified problem:

1. Does it need to exist? Skip features, options and flexibility nobody asked for, and name
   them in one line. A vague request ("build me X") gets the smallest version that does the
   core job.
2. Already in this codebase (a helper, component, service, pattern, or a mechanism that
   owns the behavior)? Use it the way the surrounding code does; do not build custom
   infrastructure beside it.
3. Standard library or a platform feature? Use it, unless the project has its own. A house
   component beats a native widget.
4. An installed dependency? Use it. Never add a dependency for a few lines.
5. Can it be one line a reader gets at a glance? One line.
6. Otherwise: the minimum code that works.

- Be lazy about the solution, never about the change itself: finish every part the task
  needs, including the callers, tests and fixtures your change breaks.
- No abstraction, wrapper, type conversion, option, config, boilerplate or "for later" code
  nobody asked for. Keep values in the form the platform already gives you. Deletion beats
  addition. Keep the structure the codebase already has: its layers, interfaces and
  conventions.
- The shortest working diff wins, once you know everything it must touch. A one-liner that
  needs decoding is not short.
- Comment only the why the code cannot show (rationale, constraints, invariants, external
  quirks, non-obvious trade-offs), in one line. No narration.
- Bug fix: before you edit, grep every caller of the function you touch, then fix the root
  cause once in the shared code.
- Code you move or merge keeps its error handling and validation.
- Between options of equal size, take the one that is correct on edge cases.
- Lazy code without its check is unfinished: new non-trivial logic (a branch, a loop, a
  parser, money or security, or a whole new script or app) leaves a check: the live
  validation `AGENTS.md` asks for, or an assert-based self-check in the code. Add a unit
  test only when `test-audit`'s bar calls for one. Trivial changes need none.
- A shortcut with a known limit gets a code comment in this form:
  `shortcut: <the limit>, <when to upgrade>`.

Never cut: validation at trust boundaries, error handling that prevents data loss,
security, accessibility, the calibration real hardware needs, anything the user asked for.

## Understand ownership before editing

Identify inputs, outputs, side effects, ownership boundaries, invariants, validation, and
failure cases. Find where related policy already lives. Make the smallest component own
the requested behavior and do not change unrelated code for consistency or speculation.

## Functions and control flow

- Give each function one coherent purpose and keep orchestration separate from transformations
  and side effects.
- Keep the normal path visible from top to bottom. Handle invalid inputs early when that
  reduces nesting, without bypassing required validation or cleanup.
- Prefer explicit intermediate values and direct loops when they make data flow clearer.
  Avoid dense expressions, hidden mutation, magic values, and boolean mode switches.
- Separate queries from commands when practical: returned information should not silently
  mutate state, and state changes should be visible at the call site.

## Abstractions and interfaces

- Abstract stable concepts with a current consumer and a real boundary; do not abstract
  code merely because it looks similar.
- Prefer a little duplication over a generic layer with flags, special cases, or speculative
  flexibility. Keep interfaces narrow and do not add one only for mocking.
- Hide necessary complexity behind a small explicit contract. Remove a wrong abstraction
  from its callers before extracting again around the remaining commonality.

## Naming, comments, and public documentation

- Name functions for observable operations and values for their meaning, role, units, and
  important distinctions. Avoid vague names and unfamiliar abbreviations.
- Let structure and naming explain straightforward code.
- Public documentation states purpose, calling contract, inputs, outputs, side effects,
  and relevant failures without exposing implementation details callers do not need.

## Duplication, concision, and changeability

- Remove duplicated knowledge and policy, not every repeated sequence. Keep one authoritative
  owner for each rule and do not duplicate validation guaranteed elsewhere.
- Delete unused code, parameters, branches, wrappers, comments, and compatibility paths.
  Do not combine meaningful operations merely to reduce lines.
- Localize policy and decisions so likely changes affect the smallest area. Separate code
  that changes for different reasons.

Core rules adapted from Ponytail v5.3.2 (MIT, see `LICENSE-ponytail`); sync notes are in
`docs/decisions/agent-tooling/ponytail.md`.
