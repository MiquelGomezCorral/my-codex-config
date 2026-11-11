---
name: review-plan
description: Validate and finalize the current approved implementation plan against the user's request, repository evidence, and injected instructions. Use when the user explicitly invokes `$review-plan` or an approved complete workflow reaches its adversarial stage; skip ordinary planning, coding, and review requests.
---

# Review Plan

Plan approved. Now review the complete approved plan established in the current conversation against the user's request, relevant repository evidence, and all injected instructions. If no
complete approved plan is present, report the blocker and stop; do not create or infer
one. Treat the invocation input only as optional review context.

Use a supported native planning mode when callable, such as AGY `--mode plan` or Claude
plan permission mode; otherwise use a scoped planning prompt. The two critics are separate
custom, read-only reviews, preferably one from a family other than the planner's; they
receive full evidence and get one shared rebuttal. See [native capabilities](../workflow/references/native-capabilities.md).

When an approved workflow context is supplied, preserve its slice order, scope, exclusions,
and exact bounded authorizations. Plan review does not itself authorize implementation,
live testing, or Git actions; report missing or conflicting approval requirements.

Load `super-agent` without restarting planning. Route two fresh `critic` workers
concurrently from the catalog `adversarial` role: the first critic takes the first entry
that can run and the second the next one, each asked for a slightly different angle so
they do not return the same answer. When a critic's entry is a `pi` entry, it launches
three workers per listed pi model, each asked for a slightly different angle so they do not
all give the same answer; those workers count as that one critic. Prefer at least one critic from a model family other
than the planner's: pass the planner's effective model and family to `super-agent`, using
the runtime-reported model when available, otherwise its configured model. Preserve an
explicit human harness or model choice. `super-agent` reads
`super-agent/references/model-catalog.yaml` and pins the exact harness, model, and thinking
for each launch.
Before launching the critics, the main agent saves the plan under review as `plan.md` and the
complete planning context as `critic-context.md`, both in the plan's folder as
[planning](../workflow/references/planning.md#finalize-the-wave) names it. The context file
holds the user's request and corrections, every decision and answered question, unresolved
questions, alternatives considered and why they were rejected, repository evidence, applicable
instructions, the separate approved `Decision records` section, and the full proposed and
approved plan. Do not assume a critic inherits the conversation; its task names the plan file
and this context file. The first critic's launch gives file paths only, with no inline facts.
It reads the plan file first and opens the context file only after writing a `Plan-only gaps`
section, which lists everything a coder holding only the plan would have to guess. Critics write
no files, so this section goes first in the report it returns, ahead of its usual full critique.
The second critic opens the context file from the start.

Each critic works independently and does not see the other's report: it challenges the plan
using the checks below and returns concrete flaws, supporting evidence, suggested
revisions, and questions that need user input, or explicitly reports no findings. Its
review is read-only; it must not implement or finalize the plan. Wait for both critics,
merge and deduplicate their findings, and rebut the merged critique once. The main agent
assesses findings against source evidence, resolves them or asks the user, and returns the
finalized plan. Launch no third critic and no second round for the same adversarial phase.
If a critic cannot run, or no critic differs in family from the planner, finalize with
the critiques you have and tell the user which coverage was missing; the stage still
passes.

Assume requirements were clarified before this command, often through `grill-me`, but
never manufacture a missing answer. If a remaining ambiguity would change behavior,
scope, or risk, ask the user one focused question and stop without finalizing the plan.

Have each critic reassess whether the plan is the simplest correct way to meet the
user's requirements:

- Verify important assumptions against the repository.
- Remove unnecessary scope, abstractions, dependencies, and compatibility work.
- Confirm the proposed files, symbols, utilities, and commands exist.
- Ensure the implementation can reach live validation with only the minimum useful
  non-live readiness check.
- For each live test, name a plausible wrong build that would still pass it and the extra
  condition that rejects it.
- In a complete workflow, confirm the plan records what `refine-plan` requires. Report a
  missing or vague record as a flaw.

Use the findings to reconsider any problematic part of the plan without silently
overriding user decisions. Resolve material unanswered choices with the user.
Preserve the approved decision-record assessment and exact record/index changes in the
finalized plan. Newly proposed material record changes or unresolved intent conflicts return
to the user; unchanged approved content needs no repeated approval.

Once the findings are resolved, return the revised plan in chat as a self-contained
execution specification for an agent with no conversation history.

Load the `refine-plan` skill and follow it to render the finalized plan in the canonical
template. Do not modify repository files; `refine-plan` owns the finalization statement.
