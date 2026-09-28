---
name: review-plan
description: Validate and finalize the current approved implementation plan against the user's request, repository evidence, and injected instructions. Use when the user explicitly invokes `$review-plan` or an approved complete workflow reaches its adversarial stage; skip ordinary planning, coding, and review requests.
---

# Review Plan

Plan approved. Now review the complete approved plan established in the current conversation against the user's request, relevant repository evidence, and all injected instructions. If no
complete approved plan is present, report the blocker and stop; do not create or infer
one. Treat the invocation input only as optional review context.

When an approved workflow context is supplied, preserve its slice order, scope, exclusions,
and exact bounded authorizations. Plan review does not itself authorize implementation,
live testing, or Git actions; report missing or conflicting approval requirements.

Load `super-agent` without restarting planning. Under Orca, route one fresh `critic` role
through Pi at the `high` tier; otherwise use the current harness at `high`. Select the
exact model from `super-agent/references/model-catalog.yaml` and preserve an explicit
human route. Give it the main agent's complete planning context: the user's
request and corrections, every decision and answered question, unresolved questions,
alternatives considered and why they were rejected, repository evidence, applicable
instructions, the separate approved `Decision records` section, and the full proposed and
approved plan. Do not assume it inherits the
conversation; explicitly include this context in its task when inheritance is unavailable.

The subagent acts as an independent critic: challenge the plan using the checks below
and return concrete flaws, supporting evidence, suggested revisions, and questions
that need user input, or explicitly report no findings. Its review is read-only;
it must not implement or finalize the plan. The main agent may rebut the critique once.
It assesses findings against source evidence, resolves them or asks the user, and returns the
finalized plan. Do not launch a second critic for the same adversarial phase.

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

Once the findings are resolved, return the revised plan in chat as a self-contained
execution specification for an agent with no conversation history.

Load the `refine-plan` skill and follow it to render the finalized plan in the canonical
template. Do not modify files; `refine-plan` owns the finalization statement.
