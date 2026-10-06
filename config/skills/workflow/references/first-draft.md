# First draft

Use this phase only inside an approved complete workflow. Gather the problem, caller,
current behavior, desired outcome, examples, constraints, exclusions, available evidence,
and validation method before proposing implementation details.

For the independent proposal, send only verified problem facts, desired outcomes,
constraints, and examples. Exclude repository code, inherited project design context,
prior conclusions, and the preferred solution. Describe this as a task boundary, not as
technical isolation. Return a candidate a human can understand and challenge.

Offer a diagram with the first candidate when it clarifies a real flow, boundary, outcome,
or decision. Follow [the diagram guide](diagrams.md); keep the task in prose when a visual
adds no useful information.

Before the plan, present what discovery found: codebase findings, external research with
sources, the independent proposal, options, and open questions. Filter it with the
[`artifacts` rule for when a page earns its place](../../artifacts/SKILL.md#when-a-page-earns-its-place).
When it does, put everything on one page, with open questions as a `decisions` block, and
link it. Small results stay in chat.

Validation means the real thing, not a unit test. Establish early how the changed behavior
will be exercised live end to end: the flow, what to observe, how to judge it, and which
current tool can run it or that it is user-only. Unit tests only cover small things,
algorithms, and model or shape assertions; they never stand in for the live test. If the
live route is not fully clear, ask the user instead of guessing. An undefined live test is
a stop condition for locking scope.

Use `goalcraft` when a durable observable completion contract will help. Do not implement
or write project memory during discovery.
