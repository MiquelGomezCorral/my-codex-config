# Orca adapter

Orca's own guide, hooks, and lifecycle come first. Resolve one executable for the active
session, then load its version-matched guide before using Orca commands. The guide owns
exact arguments and lifecycle behavior and wins wherever it differs from this adapter;
this adapter does not copy a lifecycle engine and never edits, regenerates, or works
around files, hooks, or skill stubs Orca owns.

Under Orca, role selection precedes lifecycle mechanics: `super-agent` resolves the stage's catalog
role entry and supplies its harness, exact model, and thinking for the launch commands the
guide documents, before this adapter runs any of them. Review
modes and presets choose the review shape only; they never set a harness, model, or
thinking default. Explicit user or approved-plan routes take precedence. The invoking planning
skill owns adversarial count and family preference; `super-agent` resolves the resulting catalog route.

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

Orca Pi launch recipe, for when the wrapper cannot express Pi's model pin. Verified only against
Orca 1.4.243 help: `worker-start --model` takes Claude, Codex, Cursor, Antigravity and Muse ids,
cannot combine with `--terminal`, and does not list Pi. The flags below appear in that help; no
Pi launch has run end to end. `--command` is typed into the host shell, so this is the one path
where catalog values reach a shell string: substitute only values copied exactly from the catalog,
never user text. For a bounded artifact worker, prefix `cd <artifact_directory> && ` to the
`--command` value.

```text
orca terminal create --worktree active --title <worker> --command "pi --model <catalog_model> --thinking <catalog_thinking>" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration worker-start --task <task_id> --worktree current --terminal <handle> --json
```

For a bounded artifact worker, use its assigned directory and the resolved catalog role's
model and thinking. Keep catalog IDs separate from user text. The task packet supplies role
instructions, scope, and tool bounds. Do not use `dispatch --inject`: it leaves a custom
terminal unattached to the supervised worker lifecycle. Verify any reported effective
model and thinking, and report the unverified value when the runtime provides none. An
output directory is a task constraint, not a filesystem sandbox.
Run only the exact lifecycle commands the task packet names.
The coordinator owns helper checks and exports.

## Waiting, stalls, and questions

The live guide owns waits, nudges, questions, fencing, stops, and release. Read the matching
reference with `orca skills get orchestration --reference references/<file>.md`: `coordinator-loop.md`
for the coordinator flow, `messaging-and-gates.md` for messages, nudges and questions,
`recovery-and-cleanup.md` for stalls, stops and release, and `worker-contract.md` for `check --wait`,
worker reports, fencing and helper workers. Adapter rules on top:

- Never poll with repeated `check`, `worker-list`, `worker-read`, `worker-show` or `orca terminal read` calls.
- A failed worker's `dispatch.lastFailure` is not verified on Orca 1.4.243: it is absent from the live guide and from `worker-show --help`. Do not rely on it.
- Always write `orca orchestration check`, not a bare `orca check`.
- Never `pkill` or `kill` by command pattern (it killed other agents' waits); stop only what you started, by dispatch, handle or PID.

## Ports

For ports, follow the Ports paragraph in the `agent-artifacts` skill.

## Retention and release

Retain a worker only when the calling workflow requires it. Verify parent, harness, role,
model, thinking, and directory before resuming; otherwise start fresh through the documented guide.
Release settled workers as the guide requires. Report lifecycle failures and effective-model
gaps; do not fall through to an unmanaged CLI launch.
