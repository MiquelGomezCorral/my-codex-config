---
name: grill-me
description: Pressure-test a plan, architecture, implementation approach, migration, PRD, RFC, goal, or product decision through a direct decision-tree interview before execution.
---

# Grill Me

Adapted from `grp06/useful-codex-skills/grill-me` under MIT.

Resolve important decisions, dependencies, assumptions, and failure modes or record
them as accepted risk. Do not implement until the user explicitly switches modes.

## Workflow

1. Inspect the plan and available evidence. For repository plans, load
   `agents-memory` and only relevant project memory.
2. Summarize current understanding in 3-6 bullets.
3. Build a dependency-ordered decision tree: goal, success, constraints, non-goals,
   architecture, ownership, state, operations, risk, validation, rollout, rollback.
4. Investigate answers available from files, logs, tests, history, or current docs.
   Load `btca` when decisions depend on current external SDK behavior. Ask only
   for user judgment that remains.
5. Ask the highest-leverage unresolved question, explain why it matters, recommend an
   answer, and state what it unlocks. Batch up to three questions only when they share
   one branch.
6. After each answer, restate the decision and continue to its dependent branch.

Be concrete and challenge hidden coupling, vague success, unowned state, fake metrics,
and complexity pushed onto callers or operators. Do not accept vague answers as closed.

Maintain a ledger of confirmed decisions, open decisions, assumptions, risks,
validation, and follow-up artifacts. Stop when all major branches are resolved or
accepted, the user changes modes, or further questioning would repeat a blocker. End
with the ledger and next action.
