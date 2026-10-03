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

## Pi through Orca

The supervised Orca worker launcher does not expose Pi's catalog model pin. For a Pi
read-only worker, including a reviewer or critic, create the Pi terminal with the selected
catalog ID, wait until it is ready, then
attach the Task with `worker-start --terminal`. This keeps the Orca Dispatch lifecycle
supervised while pinning the model in Pi's own command:

```text
orca terminal create --worktree active --title <worker> --command "pi --model <catalog_model> --tools read,grep,find,ls,bash" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration worker-start --task <task_id> --worktree current --terminal <handle> --json
```

Use only a catalog model ID, never user text, in the terminal command. The task packet
supplies the role instructions. Keep these Pi workers read-only: do not enable `edit` or `write`,
and use `bash` only for the exact Orca lifecycle commands required to complete the Dispatch.
Do not use `dispatch --inject` here; that leaves a custom terminal unsupervised. Compare any
runtime-reported effective model with the catalog ID. If the runtime exposes no effective
model, report the gap instead of claiming verification.

For a bounded artifact worker, select the `medium` Pi tier and `low` thinking from the
catalog, then create the terminal in its assigned artifact directory with only the tools it
needs to read evidence and write those artifacts:

```text
orca terminal create --worktree active --title <worker> --command "cd <artifact_directory> && pi --model <catalog_model> --thinking low --tools read,edit,write,bash" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration worker-start --task <task_id> --worktree current --terminal <handle> --json
```

The task packet must supply the `diagram-worker` contract, grounded brief, relevant evidence,
and exact output directory. The directory is a task constraint, not a filesystem sandbox;
the Pi launch remains unsandboxed under the approved launch policy. Enable `bash` only for
the exact Orca Dispatch lifecycle commands named in the injected task packet, such as its
heartbeat, check, and `worker_done` calls. Do not use it for other shell commands, file
operations, Git, package installation, or helper checks and exports. The coordinator owns
helper checks and exports. Preserve the read-only tool list for reviewers. Verify returned
files stay in the assigned directory, compare their claims with the full plan, and report
unavailable or failing helpers, or an unavailable or mismatched route without using its
output.

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
