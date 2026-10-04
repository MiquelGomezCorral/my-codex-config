# Orca adapter

Under Orca, review defaults are `flash` Pi/`low`; direct Pi/`medium`; `swarm` Pi/`medium`
coordinator plus justified Pi specialists; `swarm-smart` and `full` add a Pi/`high`
verifier; `full` uses Codex/`high` for live validation. A critic (or plan-critique route)
prefers Pi only when its cataloged high-tier route meets the required different-family
condition. Explicit user or approved-plan routes take precedence. `super-agent` resolves
every model from the catalog.

Resolve one executable for the active session, then load its version-matched guide before
using Orca commands. The guide owns exact arguments and lifecycle behavior; this adapter
does not copy a lifecycle engine.

## Executable and guide

- Use `ORCA_CLI_COMMAND` when set; otherwise use `orca-dev` when `ORCA_DEV_REPO_ROOT` is
  exposed, `orca-ide` on Linux outside an Orca terminal, and `orca` elsewhere.
- If the selected executable fails, report its exact error. Do not try another executable.
- Run `<resolved-orca> skills get orchestration` and read the returned guide. Load only
  its named references when a conditional gate requires them.

## Run, task, and worker lifecycle

Use the selected guide for run/task/worker creation, dispatch, wait, message, resume,
cancellation, completion, and release. Resolve run and task identity from Orca state; never
invent IDs or replay work into an unknown terminal. A dispatched task reports completion
through its documented `worker_done` route with both task and dispatch identity.

Orca Pi launch recipe when the wrapper cannot express Pi's model pin:

```text
orca terminal create --worktree active --title <worker> --command "pi --model <catalog_model>" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration worker-start --task <task_id> --worktree current --terminal <handle> --json
```

For a bounded artifact worker, use its assigned directory and the selected Pi tier with
`--thinking low`. Keep catalog IDs separate from user text. The task packet supplies role
instructions, scope, and tool bounds. Do not use `dispatch --inject`: it leaves a custom
terminal unattached to the supervised worker lifecycle. Verify any reported effective
model and report when the runtime provides none. An output directory is a task constraint,
not a filesystem sandbox. Run only the exact lifecycle commands the task packet names.
The coordinator owns helper checks and exports.

```text
orca terminal create --worktree active --title <worker> --command "cd <artifact_directory> && pi --model <catalog_model> --thinking low" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration worker-start --task <task_id> --worktree current --terminal <handle> --json
```

## Retention and release

Retain a worker only when the calling workflow requires it. Verify parent, harness, role,
model, and directory before resuming; otherwise start fresh through the documented guide.
Release settled workers as the guide requires. Report lifecycle failures and effective-model
gaps; do not fall through to an unmanaged CLI launch.
