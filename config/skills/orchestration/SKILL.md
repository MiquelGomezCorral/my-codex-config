---
name: orchestration
description: >-
  Coordinate supervised workers, task DAGs, decision gates, and coordinator loops through
  the active wrapper or current harness lifecycle.
---

# Orchestration

Resolve the active wrapper from session context, its documented environment, or an
installed wrapper skill. If present, load its version-matched guide before using its
lifecycle. If no wrapper is active, use only the current harness's documented native
lifecycle. Never invent a shared launch, wait, resume, cancellation, or release API.

When Orca is active, use the [Orca adapter](references/orca.md) for executable resolution,
guide loading, and Orca-specific lifecycle mechanics. When another wrapper is active, use
that wrapper's own guide. Report unsupported operations and exact failures; do not bypass
the selected lifecycle with unmanaged CLI launches.

`super-agent` remains the sole owner of delegation, model selection, nesting, and worker
policy. This skill owns discovery only.
