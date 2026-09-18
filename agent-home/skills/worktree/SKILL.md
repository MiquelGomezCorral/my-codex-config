---
name: worktree
description: Launch explicitly requested isolated tasks through subagent-routing and the active wrapper or current harness.
disable-model-invocation: true
allowed-tools: Bash, Write
---

Load `subagent-routing` before launching. This skill is a thin dispatcher: do not inspect
or implement the task in the parent, and do not use Workmux or an undocumented launcher.

Create an Orca-managed worktree only when the user explicitly requests one. Give the
worker a self-contained packet with the goal, relative owned paths, exclusions, allowed
actions, delegation policy, requested harness/model, catalog tier, deliverable, evidence,
and stop condition. Route it through the active wrapper's documented lifecycle, or the
current harness's native lifecycle when no wrapper is active, and preserve the user's
permissions and directory intent.

The routing policy chooses the first preferred model for the requested or cheapest adequate
tier, permits fallbacks only to compatible catalog entries, and enforces the shared
`max_local_concurrency` limit, counting a local orchestrator. Do not silently cross
harnesses. Release the worker when complete unless the calling workflow explicitly
requires retention; never commit, push, publish, or mutate shared infrastructure without
authorization.
