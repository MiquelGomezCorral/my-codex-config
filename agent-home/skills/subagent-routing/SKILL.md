---
name: subagent-routing
description: Route native Codex subagents while preserving role, model, directory, and retained-thread ownership.
---

# Subagent Routing

Codex owns all subagent orchestration. Use only the configured native Codex agents.

## Native path

- Select the smallest available native role from the configured agent descriptions.
- Launch with `spawn_agent`, collect with `wait_agent`, and use `send_message` only for
  a bounded clarification.
- Use `list_agents` to inspect session ownership and state before resuming. Use
  `followup_task` only with the exact returned session and only when its parent, role,
  model, and absolute directory still match the current request.
- Use `interrupt_agent` for cancellation; never replay a prompt into an unknown session.

## Recovery

A model failure is a failed attempt, not permission to change role or silently fall back.
Report the failure and let the parent choose a new explicit request. Do not create task
keys, queues, event subscriptions, or hidden fallback chains.
