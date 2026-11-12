# Routing reference

Procedures for route selection. The policy itself lives in `SKILL.md`; read both before
launching a worker.

## Harness inventory

- Build the available set from the active wrapper when present; otherwise use only the
  current harness.
- Verify capability and authentication instead of assuming an installed name is usable.
- Exclude a route already known to lack its required authentication or capability.
- Filtering may drop a role candidate, but it never silently switches the role's harness or
  thinking level. Report the blocker when the required route is unavailable.

## Role selection

- A wrapper's agent selector names the harness, not a worker role.
- Catalog role, size, current-harness roles, tiers, fallback, and pinning follow `SKILL.md`
  (Select the route, Invariants); this file adds only the packet and launch mechanics below.
- If the required configuration cannot be represented, report the limitation instead of
  dropping it.
- Select each harness's real configured role by its description. Never translate a role
  name across harnesses, and use a documented general agent only when that harness exposes
  no role catalog.

## Dispatch contract

This is the one packet template; `swarm.md` adds only its own fields. Include these fields in
every worker packet:

```text
Catalog role: the resolved catalog role (SKILL.md, Catalog roles)
Size: the slice's size, for a sized role only
Harness: the role entry's harness, or an explicit user override
Model: the resolved exact model
Thinking: the resolved thinking level
Agent role: the harness's native role for this task
Scope: owned files or question
Exclusions: adjacent work and non-goals
Deliverable: exact result shape
Evidence: required file:line, URL, command, or test
Stop: completion and blocker conditions
Worktrees: every absolute worktree path the worker reads; CodeGraph first (when it explores code)
Agent memory: the resolved absolute agent-memory path; on any error, before a retry, and when
  a step drags, grep known-errors.md and workflow.md there and read only the matches
Report: ends with `Memory candidates:` or `none`
Class: D
Depth: <parent depth + 1; 1 for a root child>
Delegation: allowed (max depth N, total N, active N) | forbidden
```

## Launch permissions

The approved policy is no permission prompts and no OS sandbox, including reviewers. Codex
uses `--sandbox danger-full-access` and `--ask-for-approval never`; AGY uses
`--dangerously-skip-permissions` without `--sandbox`. These override role-file sandbox
settings for these launches and are not re-approved. Pass them through the active wrapper's
documented launch path; if that path cannot express them, report the limitation.

Role metadata does not restrict tools. The role task still defines read-only work, output
directories, nesting grants, and any no-edit, no-commit, or no-deployment boundaries. Keep
those limits in the task packet and report gaps. All tools remain available; do not add
launch tool allowlists or describe these workers as OS-sandboxed.

## Explicit one-shot adapters

Direct cross-harness execution is an explicit escape hatch, not automatic fallback. The
verified argument vector (argv) templates for Codex, Pi, AGY, OpenCode, and the
user-selected Claude one-shot route are:

```text
["codex", "exec", "-c", "model_reasoning_effort=<catalog_thinking>", "--model", catalog_model, prompt]
["pi", "--model", catalog_model, "--thinking", catalog_thinking, "--print", "--", prompt]
["agy", "--model", catalog_model, "--effort", catalog_thinking, "--print", "--dangerously-skip-permissions", prompt]
["opencode", "run", "--model", catalog_model, "--variant", catalog_thinking, prompt]
["claude", "--model", catalog_model, "--effort", catalog_thinking, "--print", "--dangerously-skip-permissions", "--no-session-persistence", prompt]
```

Pi, Codex, AGY, Claude, and OpenCode (`--variant`, its provider-specific reasoning
effort) accept the thinking option shown. A model that rejects the value is an unavailable
pin: report it instead of inventing a flag. For an AGY model alias that already encodes its thinking level, pass the catalog's matching value.

The one exception is the `explorer` role. Launch `explore "<question>" [paths]` in the
foreground instead of a harness adapter. The command reads the catalog's explorer candidates
itself and runs them in order; it needs no explicit user request because its work is read-only.

Pass `prompt` and `catalog_model` as separate arguments. Never concatenate catalog values into shell code;
never invoke `eval` or execute a catalog field as a command. These adapters do not own a
worker lifecycle or a retained session, so preserve the same permissions, read-only limits,
task packet, and completion report as the active wrapper or current harness route, and
state that the one-shot adapter was explicitly selected.
