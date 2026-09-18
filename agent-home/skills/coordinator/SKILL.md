---
name: coordinator
description: Coordinate multiple workers through subagent-routing and an active wrapper or current harness when a supervised workflow needs distinct scopes.
---

# Coordinator

Load `subagent-routing` before any launch or resume. A proven active wrapper owns worker
lifecycle; without one, use the current harness's native lifecycle. Do not use Workmux or
direct harness processes as unrequested substitutes.

The coordinator owns scope, integration, verification, and the final report. Use a worker
only when its scope is independent and worth the coordination cost; otherwise keep the
work in one worker. For each worker:

- state the goal, owned paths, exclusions, permissions, delegation policy, evidence, and
  stop condition;
- assign the requested or lowest adequate catalog tier and let `subagent-routing` choose
  the model, fallback, and local serialization;
- preserve the current harness unless the user explicitly requests another one, and use
  its configured role rather than copying a role name across harnesses;
- launch, message, wait, resume, cancel, and release through the active wrapper's guide,
  or the current harness's native operations, verifying parent, harness, role, model, and
  directory before resuming.

Keep concurrent writers in disjoint scopes or serialize them. Count a cataloged local
orchestrator against `max_local_concurrency`; never exceed the shared local limit. Never
create branches or worktrees, commit, push, publish, or change shared infrastructure
unless the user explicitly authorizes that action. Report the final harness, role, tier,
exact effective model, catalog fallbacks, missing coverage, and verification gaps.
