# Adversarial review

Run `$review-plan` once for this phase; it routes one independent, read-only `critic`
through `super-agent` at the `high` tier to challenge necessity, feasibility, scope,
assumptions, evidence, and acceptance conditions. Prefer an available cataloged critic from
a different model family than the planner. Use the planner's effective model when the
runtime reports it, otherwise its configured model. Under Orca, prefer Pi only when its
cataloged high-tier route meets the family condition; otherwise select another available
cataloged high-tier route. Preserve an explicit human harness or model choice. If that
route cannot meet the family condition, report the limitation instead of silently
substituting. Pass the planner's effective model and family to `super-agent` so it can
select a critic from a different family. Do not launch a second critic before or after
that review. Give the critic the complete candidate plan, claims, cited sources, bug
evidence, user requirements, and
exclusions; require source checks for consequential claims rather than a summary verdict.

Give the planner one rebuttal to address the critique. Consolidate valid findings,
distinguish missing evidence from a demonstrated defect, and resolve remaining material
disputes with the human. Do not run repeated critique rounds. `$review-plan` finalizes
through `$refine-plan`, preserving the approved objective, record changes, and
main-agent memory updates.
