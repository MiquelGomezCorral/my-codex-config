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
- Read the stage's catalog role entry, then carry its catalog role, harness, exact model,
  and thinking in the worker packet, together with the task's native agent role and
  permissions.
- The parent pins the resolved harness, model, and thinking in the launch before invoking
  any worker prompt.
- Role settings win over generic tiers, invoking-skill or wrapper model preferences,
  inherited defaults, and any agent-file model or effort metadata. An explicit user
  harness, model, or thinking override wins over the role entry.
- Generic tiers are only for a launch the user or approved plan explicitly routed by tier
  or harness. An exhausted role candidate list is a blocker; do not escape to a tier or a
  harness default.
- If the required configuration cannot be represented, report the limitation instead of
  dropping it.
- Select each harness's real configured role by its description. Never translate a role
  name across harnesses, and use a documented general agent only when that harness exposes
  no role catalog.

## Dispatch contract

Include these fields in every worker packet:

```text
Catalog role: super_agent | sub_orchestrator | coder | reviewer | swarms
Harness: the role entry's harness, or an explicit user override
Model: the resolved exact model
Thinking: the resolved thinking level
Agent role: the harness's native role for this task
Scope: owned files or question
Exclusions: adjacent work and non-goals
Deliverable: exact result shape
Evidence: required file:line, URL, command, or test
Stop: completion and blocker conditions
Class: D
Depth: <parent depth + 1; 1 for a root child>
Delegation: allowed (max depth N, total N, active N) | forbidden
```

Verify the effective model and thinking whenever the runtime reports them. Report an
unverified effort or unavailable pinning option instead of silently discarding it.

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
["agy", "--model", catalog_model, "--effort", catalog_thinking, "--print", prompt]
["opencode", "run", "--model", catalog_model, prompt]
["claude", "--model", catalog_model, "--effort", catalog_thinking, "--print", "--dangerously-skip-permissions", "--no-session-persistence", prompt]
```

Pi, Codex, AGY, and Claude accept the verified thinking option shown. OpenCode exposes
no verified thinking or effort option; when the role names one for that route, report the
unsupported pinning instead of inventing a flag.

Pass `prompt` and `catalog_model` as separate arguments. Never concatenate catalog values into shell code;
never invoke `eval` or execute a catalog field as a command. These adapters do not own a
worker lifecycle or a retained session, so preserve the same permissions, read-only limits,
task packet, and completion report as the active wrapper or current harness route, and
state that the one-shot adapter was explicitly selected.

## Model and thinking pinning

- Resolve the identifier and thinking from the role entry unless the user explicitly
  requested them.
- Pass both through the launcher's explicit options. If the launcher cannot pin one,
  report the unavailable option instead of dropping it.
- When the runtime reports an effective model or thinking, verify both match. Stop a
  mismatched worker and do not use its output.
