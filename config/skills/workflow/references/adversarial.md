# Adversarial review

For native planning routes and their limits, use
[native capabilities](native-capabilities.md). Plan critique remains a separate custom,
read-only independent review: two critics, preferably one from a family other than the
planner's, the full evidence and plan, and one rebuttal. Do not substitute native code review for plan critique.

Run `$review-plan` once for this phase; it routes two independent, read-only `critic`
workers concurrently through `super-agent`'s catalog `adversarial` role to challenge
necessity, feasibility, scope, assumptions, evidence, and acceptance conditions.
`$review-plan` owns the critic count (including its `pi` entry rule), the family
preference, and what happens when a provider is unavailable. Pass the planner's effective model and family to it, using the
runtime-reported model when available, otherwise its configured model. Preserve an
explicit human harness or model choice. Never substitute an uncataloged model or fall back
to a generic tier.
Launch no third critic and no further round. Give each critic the complete candidate plan, claims, cited sources, bug
evidence, user requirements, and exclusions; require source checks for consequential
claims rather than a summary verdict. The critics work independently and do not see each
other's reports.

Merge both critiques, then give the planner one rebuttal that covers both. Consolidate
valid findings, distinguish missing evidence from a demonstrated defect, and resolve
remaining material disputes with the human. Do not run repeated critique rounds.
`$review-plan` finalizes through `$refine-plan`, preserving the approved objective, record
changes, and main-agent memory updates.
