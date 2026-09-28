---
name: code-quality
description: Apply the shared code-quality standard when writing or reviewing code, plus the language reference for the files you touch.
---

# Code Quality Standard

## Purpose

Writers use this standard before and during implementation. Reviewers use it to assess
changed behavior and its surrounding design. It supplements, rather than repeats, the
universal rules in `AGENTS.md`.

When tests are in scope, load `test-audit`. It gates every new or changed test at write
time and audits existing tests that re-assert source, duplicate stronger proof, couple
behavior to implementation, or keep test-only production seams alive.

## Language references

Read `references/<language>.md` for the language of the file you are about to touch. The
universal rules apply first; the language reference narrows them for that language.

- [Python](references/python.md)

## Choose a solution in this order

Stop at the first option that fully solves the verified problem:

1. Existing project capability.
2. Standard library.
3. Native platform feature.
4. Already-installed dependency.
5. Existing local abstraction.
6. Minimum new code.

Do not build custom infrastructure when an existing mechanism owns the behavior.

## Understand ownership before editing

Read the target function, its callers, and the functions it calls. Identify inputs,
outputs, side effects, ownership boundaries, invariants, validation, and failure cases.
Find where related policy already lives. Make the smallest component own the requested
behavior and do not change unrelated code for consistency or speculation.

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
- Let structure and naming explain straightforward code. Comments explain rationale,
  constraints, invariants, external quirks, and non-obvious trade-offs, not narration.
- Public documentation states purpose, calling contract, inputs, outputs, side effects,
  and relevant failures without exposing implementation details callers do not need.

## Duplication, concision, and changeability

- Remove duplicated knowledge and policy, not every repeated sequence. Keep one authoritative
  owner for each rule and do not duplicate validation guaranteed elsewhere.
- Delete unused code, parameters, branches, wrappers, comments, and compatibility paths.
  Do not combine meaningful operations merely to reduce lines.
- Localize policy and decisions so likely changes affect the smallest area. Separate code
  that changes for different reasons and do not design for hypothetical variants.
