---
name: subagent-routing
description: Route delegation through an active wrapper or the current harness while preserving role, model, directory, permissions, and retained-session ownership. Load before any agent launch or resume, including nested workers.
---

# Agent Routing

This skill owns harness selection. Calling workflows own the task shape, worker count,
permissions, and result contract. A proven active wrapper owns worker lifecycle; without
one, the current harness uses its native subagent tooling.

## Select routes

- Honor user-selected harnesses, agents, models, ratios, and exclusions first. A named
  harness is preferred unless the user explicitly forbids substitutes.
- Read `references/model-catalog.yaml` for every delegation. It is the only owner of
  cheap worker model identifiers; do not copy those identifiers into skills, tests,
  agents, or documentation. Its model identifiers are a closed allowlist for automatic
  worker selection, and list order is preference order. Only an exact model explicitly
  requested by the user may run outside that allowlist.
- Tier vocabulary is exactly `low`, `medium`, `high`, and `local`. A requested online tier
  selects the first available model in that harness's list; a local request uses
  `local.<tier>` and the same list-order rule. An automatic request chooses
  the cheapest adequate tier in catalog order and prefers an adequate local model first.
  A missing current-harness entry makes that route unavailable; do not use its native default.
- If the preferred catalog entry is unavailable, try only compatible remaining entries in list order
  from the catalog. When those entries are exhausted, report the blocker. Never let
  a wrapper or harness choose an uncataloged default model.
- `max_local_concurrency` is a shared limit across the whole delegation tree. Count a
  cataloged local orchestrator against it; when the slot is occupied, use an adequate
  online route or serialize until the slot is free. Never start a second local model
  process when the limit is one; the orchestrator counts even when it is not a worker.
- `$code` and `$cleanup` are deliberate exceptions: their configured Codex workers keep
  orchestrator-strength models and do not use this cheap catalog.
- When a wrapper is active, load its version-matched skill and lifecycle guide, such as
  `orca-cli` and `orchestration` for Orca. Without a wrapper, use the current harness's
  native status, launch, wait, message, cancellation, and resume operations.
- Build the available set from the active wrapper when present; otherwise use only the
  current harness. Verify capability and authentication without assuming an installed
  external name is usable.
- Prefer the active harness. For one worker, use it unless user intent or availability
  requires another route. For `N` workers without an explicit roster, allocate
  `ceil(N / 2)` to the active harness and fill the rest with best-fit workers from other
  available harnesses. If no suitable alternative exists, fill the remaining slots from
  the active harness.
- Select each harness's real configured role by its description. Never translate a role
  name such as `reviewer-quick` into another harness. Use a documented general agent only
  when that harness exposes no role catalog and its default agent fits the task.
- A wrapper's agent selector names the harness, such as `codex`, not a Codex worker role.
  Carry the selected role's instructions in the worker task and preserve its model,
  reasoning effort, and applicable permissions through documented launch options. If the
  required configuration cannot be represented, report that limitation instead of dropping it.
- The user-approved launch policy for Codex and AGY is no permission prompts and no OS
  sandbox, including reviewers. For Codex use `--sandbox danger-full-access` and
  `--ask-for-approval never`; for AGY use `--dangerously-skip-permissions` without
  `--sandbox`. Preserve these flags through Orca's documented custom-command launch
  path when its standard launcher cannot express them. This overrides role-file sandbox
  settings for these launches; do not ask to approve it again. Read-only review remains
  a task constraint: preserve no-edit, no-commit, and no-deployment instructions and any
  restricted tool lists. Do not describe these workers as OS-sandboxed.

## Decision order

Resolve the route in this order, before choosing a tier or model:

1. Detect an active wrapper from runtime evidence. Inside a wrapper, use its skill and
   native worker lifecycle; otherwise stay on the current harness and use its native
   subagent tooling.
2. Outside a wrapper, cross to another harness only when the user explicitly requests its
   documented one-shot adapter. Explicit preset, harness, and model requests remain exact;
   automatic routing never silently crosses that boundary.
3. Apply provider-specific restrictions before generic catalog preference. For Pi search
   work, `web-search` requires the configured local SearXNG tools and never falls back to
   paid search or Codex search.
4. Select the requested tier from the catalog, or choose the cheapest adequate tier. Use
   the first model in the selected list, then report the harness, tier, model, fallback,
   and any local serialization. If the current harness has no compatible catalog entry,
   use another allowed cataloged route exposed by the active wrapper or report the blocker.

## Explicit one-shot adapters

Direct cross-harness execution is an explicit escape hatch, not automatic fallback. The
verified argument vector (argv) templates for Codex, Pi, AGY, and OpenCode are:

```text
["codex", "exec", "--model", catalog_model, prompt]
["pi", "--model", catalog_model, "--print", "--", prompt]
["agy", "--model", catalog_model, "--print", prompt]
["opencode", "run", "--model", catalog_model, prompt]
```

Pass `prompt` and `catalog_model` as separate arguments. Never concatenate catalog values into shell code;
never invoke `eval` or execute a catalog field as a command. These adapters do
not own a worker lifecycle or retained session, so preserve the same permissions,
read-only limits, task packet, and completion report as the active wrapper or current
harness route, and state that the one-shot adapter was explicitly selected.

## Launch and lifecycle

- Follow the active wrapper's loaded guide for worker launch, completion, messaging, waits,
  and release or retention. Without a wrapper, use the current harness's native lifecycle;
  do not use Workmux or a direct harness process as an unrequested substitute.
- Preserve the worker packet's scope, exclusions, permissions, directory, delegation
  allowance, deliverable, and stop conditions across every route.
- Before launch, confirm the selected identifier is present in the catalog unless the user
  explicitly requested that exact model, and pass it through the launcher's explicit model
  option. If the launcher cannot pin that identifier, the route is unavailable. When the
  runtime reports an effective model, verify it matches; stop a mismatched worker and do
  not use its output.
- Tell each worker to load `subagent-routing` before any authorized nested delegation and
  to follow the active wrapper's dispatch preamble when a wrapper is present.
- Do not broaden filesystem, network, mutation, publication, or delegation authority to
  make a route work. Read-only work must not create a branch or worktree unless the user
  explicitly authorizes that state change.
- Use the active wrapper's status, wait, message, cancellation, and identity operations,
  or the current harness's native equivalents when no wrapper is active. Resume only an
  exact retained session whose parent, role, model, and directory still match. Otherwise
  launch a fresh suitable worker and report the ownership mismatch.
- After an AGY readiness timeout, inspect the terminal before retrying. If it shows an
  authenticated, idle AGY prompt, use the loaded Orca guide and command help to confirm
  the supported manual recovery: keep the tracked task, dispatch without `--inject` and
  with `--return-preamble`, then deliver that exact preamble to the terminal. Send another
  Enter only when inspection shows the prompt remains unsubmitted. Preserve completion
  reporting; after settlement, close only a test-owned terminal when worker release reports
  that it owns no resource. Treat authentication failures as blockers, not readiness timeouts.
- A workflow explicitly requesting a retained worker authorizes recording that retention
  through Orca. Otherwise release settled workers as its guide requires. Reuse needs a
  fresh Dispatch; it does not mean replaying a prompt into an unknown terminal.

## Recovery

- Exclude a route already known to lack its required authentication or capability.
- When a launch fails specifically because its quota or rate limit is exhausted, replace
  only that slot with the next compatible catalog entry available inside Orca. Keep the
  same scope, lens, permissions, and evidence contract; do not retry the exhausted route.
- If an active wrapper or its required guide, capability, or runtime is unavailable, report
  the exact blocker; without a wrapper, native current-harness routing remains valid. Do not
  start another harness outside an explicit one-shot adapter request.
- Do not silently reinterpret an unsupported role or model as quota exhaustion. Report
  unsupported explicit selections and other failures unless the user supplied an allowed
  alternative.
- Report the final harness, agent, and exact effective model for each slot plus every quota
  substitution or missing coverage. Do not create hidden fallback chains, task keys, or queues.
- Distinguish unattempted workers from failed workers. A failure from an earlier task
  is context, not evidence that a new launch or another harness has failed.
