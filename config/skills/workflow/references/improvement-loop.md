# Improvement loop

Incorporate feedback into the candidate while keeping its original objective visible.
Investigate facts available from source, tests, history, and documentation instead of
asking the human. Resolve choices that change behavior, scope, or risk; list non-blocking
drift separately. Use `grill-me` for material human decisions. When feedback changes the
live route or who runs a test, ask "How and who live validates it?" again.

Add a diagram or mockup when it makes a real flow, boundary, or user outcome easier to
assess. Skip decorative or redundant artifacts. Follow [the diagram guide](diagrams.md),
revise affected diagrams with feedback, and run its comprehension check after each revision.
Map the proposed wave into PR-sized slices with dependencies, scope, checks, review depth,
artifacts, and bounded actions. For a wave that the
[probe rule](planning.md#probe-unproven-assumptions) covers, make the first slice a thin
end-to-end path through the riskiest assumption, built on the kept probe file when there is one,
wherever it lives. Thin means the smallest path that takes the risky step from real input to one
real output, with the rest of the feature left to later slices. The riskiest assumption is the
one left after the probes. The candidate is ready when the goal, scope, evidence,
exclusions, risks, slice map, and unresolved decisions are clear and the human accepts it
for adversarial review.
