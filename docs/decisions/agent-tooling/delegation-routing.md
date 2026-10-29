# Delegation routing

## Intent

Workflows resolve each role's harness, model, and thinking from one frequently editable catalog while preserving the runtime's orchestration lifecycle. Delegation policy lives in one skill; runtime mechanics stay in its adapters.

## Current decisions

- `config/skills/super-agent/references/model-catalog.yaml` owns workflow model defaults. Its `super_agent`, `sub_orchestrator`, `coder`, `git-worker`, `explorer`, `adversarial`, `reviewer-high`, `reviewer-fast`, `computer-controller`, and `swarms` entries each specify a harness, model or ordered candidate list, and thinking level; `reviewer-fast`, `computer-controller`, and `swarms` name the current harness and list a model per harness instead; `sub_orchestrator`, `coder`, and `git-worker` have `large`, `medium`, and `small` entries; the `git` skill takes the Git worker's size from the user or the approved plan, or asks for it. A role written as a list is an ordered fallback: the first entry that can run is used. Several workers of one role run only when the invoking skill states the count. Harness tiers remain available for explicit harness/tier overrides.
- `super-agent` is the single owner of delegation policy and class grants: whether to delegate, which harness, role, and cataloged model run the work, how much nesting is allowed, and what the caller reports. The former routing, swarm, and unused coordinator skills no longer own any part of that policy.
- A proven active wrapper owns worker lifecycle and exposes the harnesses available through it; the policy names no wrapper product. Without a wrapper, automatic delegation stays on the current harness and uses its native subagent tooling.
- The generic `orchestration` skill selects the active lifecycle adapter. Orca executable
  resolution and runtime-guide discovery belong only to its adapter reference; stages
  load that reference through the generic entry rather than copying wrapper mechanics.
- Supported native stages and agent teams may run within the same scope, model, nesting,
  one-writer, and observable-lifecycle bounds. Claude's documented one-shot adapter is
  available only when explicitly selected; it is neither an automatic fallback nor a
  retained supervised session.
- Outside a wrapper, another harness is eligible only when the user names it explicitly, using its documented one-shot direct adapter. The one exception is the `explore` command, which runs the `explorer` candidates read-only through their one-shot adapters without a request.
- Each plan slice carries `Size: small|medium|large`, proposed by the planner and approved by the user with the plan; without a plan, the agent proposes size and route and waits for approval. `small` goes straight to one coder; `medium` and `large` get a coding supervisor. The size picks the supervisor and coder entries.
- The super agent does lookups itself with CodeGraph plus about three targeted file reads; more reading goes to `explorer`, which returns a brief of 20 lines or fewer with `file:line` references. Most super-agent context came from its own file reading, not from helper reports. The `explore` command launches it without loading `super-agent`, because loading that skill to start one cheap reader cost more main-agent context than the reader saved; the explorer agent file owns the brief contract.
- Coordinators wait on workers with one blocking wait and never poll; every wait is bounded, so a stalled worker is noticed, nudged once, then stopped and reported. The Orca adapter reference owns the commands.
- On Claude, a hook installed by the bootstrap blocks helper launches on Opus or Fable outside the roles listed in the catalog's `model_guard`; `AGENT_MODEL_GUARD=off` disables it for one session. Helpers launched without a model get the catalog's Claude `medium` model through the bootstrap's default-helper-model setting, because agent files carry no model line.
- The same hook refuses helper launches that set a name, because named helpers send idle notices that wake their parent; helpers are reached by their returned ID.
- Every dispatch rereads the applicable role entry. Role settings override generic tier preferences, wrapper defaults, and agent-file model metadata; explicit user instructions remain authoritative. List order defines fallback. When a skill asks for more workers than can run, the stage continues with those that ran and the user is told about the reduced coverage. Only a role with no runnable entry is a blocker.
- `reviewer-fast`, `computer-controller`, and `swarms` run on the current harness, the harness of the agent that launches them. Each harness lists one named cheap model for them in the catalog: `reviewer-fast` and `swarms` at the highest thinking that model supports, `computer-controller` at the lower thinking it lists, for speed. When the model is unavailable, the harness's `low` tier runs instead. Direct review and verification run on `reviewer-fast`, live validation and other browser or desktop work on `computer-controller`, and specialists on `swarms`, so every harness has a runnable route for each.
- Local routes are grouped under their capability tier, and at most one local model process may run at a time. The current orchestrator consumes that slot when it uses a cataloged local model. `max_local_concurrency: 0` turns local routes off; tier-routed work then takes an online route.
- Agents follow the active environment's own tools, guides, and lifecycle first, and this routing only for what the environment leaves open. The repository never rewrites environment-owned files to make a route work.
- Plan critique runs two critics from the first two runnable `adversarial` entries; `review-plan` owns the count. A critic from a family other than the planner's is preferred, not required: without one the stage still passes and the user is told. A pi entry launches three workers per listed model, each asked for a different angle.
- Review swarms and cleanup audits add one `reviewer-high` worker, or two for risky or large changes, with the same pi rule; the review and cleanup skills own the count. An explicit user roster stays exact and gets no added strong reviewers.
- Coding, reviews, cleanup, and delegated coordination use the stage-to-role mapping in `super-agent`. Agent files own behavior and authority, without independent model or effort defaults.
- Presets keep their review shape and capability requirements, while catalog roles choose models. A required capability that cannot run on the configured route is reported; it does not authorize silent harness substitution.
- `super_agent` specifies new root launches. Reading the catalog cannot switch the harness of an existing conversation; report configured versus observed mismatches without automatically replacing the main agent.

## Protected invariants

- Wrapper detection and the allowed harness set are resolved before catalog selection.
- Class is relative: every agent is a delegate toward its parent and a root over its own children, and only a parent grants nesting. A missing class means delegate, a missing delegation grant means forbidden, and a missing depth means one.
- Every delegating role has catalog access, so a role that may launch workers can pin a cataloged model.
- Delegation policy contains no vendor names; vendor mechanics stay in the policy's references.
- Automatic routing never crosses to another harness outside a wrapper, except the read-only `explore` command.
- Claude helpers run on Opus or Fable only in roles the catalog's `model_guard` lists, unless the user turned the guard off for the session.
- Claude helper launches carry no name; the parent reaches each helper by the ID its launch returns.
- Explicit preset requests stay within that preset, and explicit harness/model requests remain exact.
- Catalog identifiers are secret-free and have one authoritative owner.
- An automatically selected worker is launched with an explicit catalog model and thinking level. Report unavailable pinning or verification; stop a reported effective-setting mismatch and do not use its output.
- Local-model concurrency never exceeds `max_local_concurrency`; excess work uses adequate online routes or waits for the local slot.
- Route choice, fallback, serialization, and missing coverage remain visible to the caller.
- Applicable provider-specific records, including harness-declared capability restrictions, filter candidate routes before generic preference rules.
- Catalog role settings take precedence over calling-skill model preferences and the generic current-harness majority default; explicit user harness choices remain exact.

## Rationale and tradeoffs

Role defaults change often. Keeping their harness, model, and thinking in one catalog avoids editing each agent and stage. Runtime-owned orchestration preserves lifecycle; explicit-only direct adapters prevent silent cross-harness launches. One local slot keeps memory use predictable. Instructions require catalog resolution, while live runtime evidence is needed to prove the selected settings actually ran.

## Enforcement

- Catalog and behavior checks: [configuration tests](../../../tests/codex-config.test.mjs) and [bootstrap tests](../../../tests/bootstrap.test.sh).
- Claude model guard and named-helper refusal: [guard hook](../../../config/bin/agent-model-guard.py), installed by [the Claude bootstrap](../../../bootstrap_claude.sh).
- Delegation instructions and evaluations: [super agent](../../../config/skills/super-agent/SKILL.md), its [routing reference](../../../config/skills/super-agent/references/routing.md), and its [swarm evaluations](../../../config/skills/super-agent/evals/evals.json).
- Review-only: confirm runtime evidence and wrapper-native lifecycle for live launches, which static checks cannot prove.

## History

- 2026-10-29: A subscription-usage audit found coordinators waking for idle notices from named Claude helpers, and the guard refusing `Catalog role: coder.` and `**Catalog role:**` spellings. The user approved refusing named helper launches and a tolerant role line; catalog model routes stay unchanged.
- 2026-10-25: Live tests showed Playwright CLI about twice as fast as Orca's browser and more reliable, so the user put it first: Playwright CLI, Orca's browser, the harness browser, then desktop control.
- 2026-10-23: The user replaced `live-validator` with a generic `computer-controller` agent that any agent hands browser and desktop work to. It runs on each harness's cheap model at low or medium thinking, tries Orca's browser, the harness browser, Playwright CLI and desktop control in that order, and uses no MCP server.
- 2026-10-20: A live test showed the super agent delegating reading but loading `super-agent` to do it and getting briefs of 34 and ~147 lines. The user approved an explorer agent file and one `explore` command, pi first, that reads the catalog itself. The user also sized `git-worker` in the catalog and asked the `git` skill to take that size from the user or plan, or ask for it. The code-blind proposal moved to `adversarial` (it designs a solution and needs strong, independent judgement); planning web research and bug-evidence checks moved to `swarms` (cheap search and summary); code facts go to `explore`. Skill files stopped counting toward the reading budget, so loading a skill never pushes reading to the explorer.
- 2026-10-19: A token-burn audit showed the super agent's own file reading, polling turns, and Opus helpers drove most use. The user made catalog lists ordered fallbacks with counts owned by skills, sized `sub_orchestrator` and `coder` by user-approved slice size, added `explorer`, a Claude model guard with a one-session off switch, a Sonnet default for helpers launched without a model, and blocking, stall-aware waits.

- 2026-10-16: After Pi became unavailable and left direct review and specialists without a route, the user made `reviewer-fast` and `swarms` follow the current harness's cheap model with its `low` tier as fallback, confirmed local routes stay off, and asked that the environment's own tools come first without the repository overriding them.
- 2026-10-07: Split the reviewer role into `reviewer-fast` and `reviewer-high`, added the two-slot `adversarial` role, and defined list-valued roles as independent slots. A missing provider or a missing different-family critic reduces coverage and is reported, but never blocks the stage.
- 2026-10-04: Made role entries mandatory for workflow routing, including coding and cleanup, with explicit model and thinking pins. Removed competing per-agent defaults while preserving runtime lifecycle, user overrides, and capability restrictions.
- 2026-10-04: Approved one replaceable wrapper adapter and conditional native stage
  execution, preserving explicit routing and lifecycle authority.
- 2026-09-28: Allowed the review skill to express its Pi-first routing preference while keeping model identifiers in the catalog and explicit user rosters authoritative.
- 2026-09-25: Merged the former routing, swarm, and coordinator skills into `super-agent`; moved procedures and the model catalog into its references, made class grants relative, and removed vendor mechanics from the delegation policy.
- 2026-09-18: Closed automatic worker selection over catalog identifiers; removed native-default fallback and required effective-model verification when the runtime exposes it.
- 2026-09-18: Corrected local routes to tiered model lists and reaffirmed wrapper-native lifecycle ownership with current-harness native delegation when no wrapper is active.
- 2026-09-18: Approved the harness-first cheap-model catalog, runtime-aware delegation precedence, explicit direct adapters, and one-process local-model limit.
