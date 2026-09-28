# Adversarial review

Run `$review-plan` once for this phase; it routes one independent, read-only `critic`
through `super-agent` to challenge necessity, feasibility, scope, assumptions, evidence,
and acceptance conditions. Do not launch a second critic before or after that review.
Under Orca, default
to the Pi harness and `high` tier; otherwise use the current harness and `high` tier.
Read the exact model identifier from `super-agent/references/model-catalog.yaml` at
dispatch. Preserve an explicit human harness or model choice. Give the critic the complete
candidate plan, claims, cited sources, bug evidence, user requirements, and exclusions;
require source checks for consequential claims rather than a summary verdict.

Give the planner one rebuttal to address the critique. Consolidate valid findings,
distinguish missing evidence from a demonstrated defect, and resolve remaining material
disputes with the human. Do not run repeated critique rounds. `$review-plan` finalizes
through `$refine-plan`, preserving the approved objective, record changes, and
main-agent memory updates.
