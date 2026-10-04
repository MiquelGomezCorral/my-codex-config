# Adversarial review

For native planning routes and their limits, use
[native capabilities](native-capabilities.md). Plan critique remains a separate custom,
read-only independent review: choose a different model family, pass the full evidence and
plan, and allow one rebuttal. Do not substitute native code review for plan critique.

Run `$review-plan` once for this phase; it routes one independent, read-only `critic`
through `super-agent`'s catalog `reviewer` role to challenge necessity, feasibility, scope,
assumptions, evidence, and acceptance conditions. Filter the role's candidates to a model
family different from the planner's; use the planner's effective model when the runtime
reports it, otherwise its configured model. Preserve an explicit human harness or model
choice. If that route cannot meet the family condition, report the limitation instead of
silently substituting, and do not fall back to a generic tier. Pass the planner's effective
model and family to `super-agent` so it can select a critic from a different family. Do not
launch a second critic before or after that review. Give the critic the complete candidate plan, claims, cited sources, bug
evidence, user requirements, and
exclusions; require source checks for consequential claims rather than a summary verdict.

Give the planner one rebuttal to address the critique. Consolidate valid findings,
distinguish missing evidence from a demonstrated defect, and resolve remaining material
disputes with the human. Do not run repeated critique rounds. `$review-plan` finalizes
through `$refine-plan`, preserving the approved objective, record changes, and
main-agent memory updates.
