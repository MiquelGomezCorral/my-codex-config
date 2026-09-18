---
name: implementation-planning
description: Run a manual, adaptive planning interview for a non-trivial implementation, from a rough idea to an approved native plan. Use only when the user explicitly invokes `$plan-implementation` or asks to run this workflow; skip ordinary coding requests, already-approved plans, and simple Q&A.
---

# Implementation Planning

Turn a freeform idea or referenced brief into a scope-locked implementation plan. Do
not implement, edit project files, or persist project memory during discovery.

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
scope, and explicit approval before the final plan is written.

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
2. Load `agents-memory` for repository work and read only relevant memory. Load the selected
   `decision-records` skill explicitly and follow its missing-index behavior: read
   `docs/decisions/index.md` when present, otherwise treat it as an empty existing-record set and
   propose exact initialization in the approval scope. Then read every applicable record. Inspect
   the existing implementation before proposing changes: what already exists, how it is called,
   what data and state it owns, what can be reused, and the smallest real gap. Keep this assessment
   read-only; do not create an index or record speculatively. Use `codegraph_context` first for
   feature or architecture context.
3. Load `grill-me` bc material user judgments will remain and use its decision-tree
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
   usage first. Load `btca-first` for current source behavior or `web-search` for other
   current external facts. Research a concrete open decision; do not browse a generic
   tutorial merely because the technology is unfamiliar.

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
- Implementation outline, readiness check, and pending live validation.
- Exact durable `.agents` memory updates for the main agent, or state that no project
  memory should change.

Wait for explicit approval. If the user changes scope, resume the relevant phase and
update only the changed ledger items. If the user rejects the package without revising
scope, write nothing and report that planning stopped without an approved plan.

## Present The Final Plan

After approval, return the current native plan in chat without creating or editing
files. Keep it proportional: a clear small task needs a compact plan, while
cross-boundary work needs the detail required to remove implementation decisions.
Include only applicable sections from:

- Planning mode and original user intent.
- `Goal` as a standalone statement of the user's final approved objective,
  independent of implementation steps.
- Success, current behavior, scope, and exclusions.
- Decisions, consequences, components, and technical flow.
- Exact files or symbols, implementation steps, and relevant failures.
- A separate `Decision records` section preserving the approved assessment, protected constraints,
  and exact record/index changes; these remain main-orchestrator-owned execution inputs.
- Minimum non-live readiness check and pending live `Flow`, `Expected`, and `Can run`.
- `Main-agent memory updates` with exact paths and facts; these are not coder tasks.

Do not turn unanswered choices into assumptions. End by telling the user the plan is
ready for the separate adversarial `$review-plan` review. That review may challenge any
decision, but preserves the approved objective, planning mode, and memory updates unless
the user reopens them. Explain that `$code` then persists the finalized plan unchanged
before execution. Do not execute the review yourself.
