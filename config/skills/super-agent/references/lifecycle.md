# Lifecycle reference

Procedures for worker launch, steering, recovery, and release. The policy itself lives in
`SKILL.md`.

## Operations

- Launch, status, wait, message, cancellation, resume, and release follow the
  environment-provided lifecycle when one is present; otherwise use the harness's native
  operations.
- Preserve the worker packet's scope, exclusions, permissions, directory, delegation
  allowance, deliverable, and stop conditions across every route.
- Tell each worker to load `super-agent` before any authorized nested delegation, and to
  follow the environment's dispatch preamble when one is provided.
- Use identity checks before resuming: an exact retained session whose parent, harness,
  role, model, and directory still match. Otherwise launch a fresh worker and report the
  ownership mismatch.

## Retention

- Keep a worker only when the calling workflow explicitly requires retention; otherwise
  release settled workers as the environment's guide requires.
- Reuse requires a fresh dispatch. Never replay a prompt into an unknown terminal.

## Recovery

- When a launch fails specifically because its quota or rate limit is exhausted, replace
  only that slot with the next compatible catalog entry available through the active
  wrapper. Keep the same scope, lens, permissions, and evidence contract; never retry the
  exhausted route.
- If the active wrapper, or a required guide, capability, or runtime, is unavailable, report
  the exact blocker while native current-harness routing remains valid.
- Never silently reinterpret an unsupported role or model as quota exhaustion. Report
  unsupported explicit selections and other failures unless the user supplied an allowed
  alternative.
- Do not create hidden fallback chains, task keys, or queues. A failure from an earlier task
  is context, not evidence that a new launch failed.
