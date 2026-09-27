# Routing reference

Procedures for route selection. The policy itself lives in `SKILL.md`; read both before
launching a worker.

## Harness inventory

- Build the available set from the active wrapper when present; otherwise use only the
  current harness.
- Verify capability and authentication instead of assuming an installed name is usable.
- Exclude a route already known to lack its required authentication or capability.

## Role selection

- A wrapper's agent selector names the harness, not a worker role.
- Carry the selected role's instructions in the worker task, and preserve its model,
  reasoning effort, and permissions through documented launch options.
- If the required configuration cannot be represented, report the limitation instead of
  dropping it.
- Select each harness's real configured role by its description. Never translate a role
  name across harnesses, and use a documented general agent only when that harness exposes
  no role catalog.

## Launch permissions

The approved policy is no permission prompts and no OS sandbox, including reviewers. Codex
uses `--sandbox danger-full-access` and `--ask-for-approval never`; AGY uses
`--dangerously-skip-permissions` without `--sandbox`. These override role-file sandbox
settings for these launches and are not re-approved. Pass them through the active wrapper's
documented launch path; if that path cannot express them, report the limitation.

Read-only review remains a task constraint: preserve no-edit, no-commit, and
no-deployment instructions and any restricted tool lists. Do not describe these workers as
OS-sandboxed.

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
never invoke `eval` or execute a catalog field as a command. These adapters do not own a
worker lifecycle or a retained session, so preserve the same permissions, read-only limits,
task packet, and completion report as the active wrapper or current harness route, and
state that the one-shot adapter was explicitly selected.

## Model pinning

- Confirm the selected identifier is present in the catalog unless the user explicitly
  requested that exact model.
- Pass the identifier through the launcher's explicit model option. If the launcher cannot
  pin it, the route is unavailable.
- When the runtime reports an effective model, verify it matches. Stop a mismatched worker
  and do not use its output.
