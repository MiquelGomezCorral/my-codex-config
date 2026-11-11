# First draft

Use this phase only inside an approved complete workflow. Gather the problem, caller,
current behavior, desired outcome, examples, constraints, exclusions, available evidence,
and validation method before proposing implementation details.

This phase runs the first two [mandatory planning steps](planning.md#run-the-mandatory-steps):
`grill-me` on the request before any solution plus the investigation (codebase mapping,
research, the independent proposal, artifacts), then "How and who live validates it?".
During the investigation, a qualifying wave also runs the
[probes](planning.md#probe-unproven-assumptions).

A worker writes the independent proposal through `super-agent`. Send it only verified
problem facts, desired outcomes, constraints, and examples. Exclude repository code,
inherited project design context, prior conclusions, and the preferred solution. Describe
this as a task boundary, not as technical isolation. Return a candidate a human can
understand and challenge.

Offer a diagram with the first candidate when it clarifies a real flow, boundary, outcome,
or decision. Follow [the diagram guide](diagrams.md); keep the task in prose when a visual
adds no useful information.

Before the plan, present what discovery found on one discovery page (gate 1). It opens with a
Requirements section, before any summary or stats section, built from the grill-me answers: each requirement with its ID (`R1`, `R2`,
...), its text, and the grill-me answer that set it. Discovery sets the IDs. The page then covers
codebase findings, external research with sources, the independent proposal, options, and the
open questions as a `decisions` block. The `artifacts` rule that keeps small results in chat does
not apply here; every workflow gets this page.

Validation means the real thing, not a unit test. Establish early how the changed behavior
will be exercised live end to end: the flow, what to observe, how to judge it, and who
runs it. Define the expected result here, during discovery, and plan to make the change
runnable first so the live test can start. Unit tests never stand in for the live test.
The [live-test rule](planning.md#define-the-live-test) decides when the route is clear; an
undefined live test is a stop condition for locking scope.

Use `goalcraft` when a durable observable completion contract will help. Do not implement
or write project memory during discovery.
