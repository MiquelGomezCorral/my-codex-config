---
name: subagent-routing
description: Route workers through the active agent harness or other available harnesses while preserving role, model, directory, permissions, and retained-session ownership.
---

# Agent Routing

This skill owns agent-harness selection. Calling workflows own the task shape, worker
count, permissions, and result contract.

## Select routes

- Honor user-selected harnesses, agents, models, ratios, and exclusions first. A named
  harness is preferred unless the user explicitly forbids substitutes.
- Build the available set only from agent tools, orchestration skills, and launcher
  commands documented by the current environment. Do not invent a command, probe an
  undocumented product, or assume that a recognizable harness is installed or authenticated.
  OpenCode, Antigravity, or an Orca agent manager is eligible only when such a capability
  is actually exposed and its instructions can be loaded.
- Prefer the active harness. For one worker, use it unless user intent or availability
  requires another route. For `N` workers without an explicit roster, allocate
  `ceil(N / 2)` to the active harness and fill the rest with best-fit workers from other
  available harnesses. If no suitable alternative exists, fill the remaining slots from
  the active harness.
- Select each harness's real configured role by its description. Never translate a role
  name such as `reviewer-quick` into another harness. Use a documented general agent only
  when that harness exposes no role catalog and its default agent fits the task.

## Launch and lifecycle

- Load and follow the selected harness's orchestration skill before using it. Prefer the
  active harness's structured collaboration tools; use an external command only when its
  installed skill or current environment documents the launch and result flow.
- Preserve the worker packet's scope, exclusions, permissions, directory, delegation
  allowance, deliverable, and stop conditions across every route.
- Do not broaden filesystem, network, mutation, publication, or delegation authority to
  make a route work. Read-only work must not create a branch or worktree unless the user
  explicitly authorizes that state change.
- Use a harness's own status, wait, message, cancellation, and identity operations. Resume
  only an exact retained session whose parent, role, model, and directory still match.
  Otherwise launch a fresh suitable worker and report the ownership mismatch.
- When the active harness is Codex, use `spawn_agent`, `wait_agent`, `send_message`,
  `followup_task`, `interrupt_agent`, and `list_agents` for Codex-routed workers.

## Recovery

- Exclude a route already known to lack its required authentication or capability.
- When a launch fails specifically because its quota or rate limit is exhausted, replace
  only that slot with the next best available harness. Keep the same scope, lens,
  permissions, and evidence contract; do not retry the exhausted route.
- Do not silently reinterpret an unsupported role or model as quota exhaustion. Report
  unsupported explicit selections and other failures unless the user supplied an allowed
  alternative.
- Report the final harness and agent used for each slot plus every quota substitution or
  missing coverage. Do not create hidden fallback chains, task keys, or queues.
