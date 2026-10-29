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
thinking default. Explicit user or approved-plan routes take precedence, and the
adversarial stage follows `super-agent`'s family preference for the `adversarial` role.

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

Orca Pi launch recipe when the wrapper cannot express Pi's model pin. `--command` is typed
into the host shell, so this is the one path where catalog values reach a shell string:
substitute only values copied exactly from the catalog, never user text.

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

```text
orca terminal create --worktree active --title <worker> --command "cd <artifact_directory> && pi --model <catalog_model> --thinking <catalog_thinking>" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration worker-start --task <task_id> --worktree current --terminal <handle> --json
```

## Waiting, stalls, and questions

- Wait for workers with one blocking command:
  `orca orchestration check --wait --timeout-ms 1800000 --types worker_done,escalation,question --json`.
  `--types` wakes you only for results (`worker_done`), errors (`escalation`) and questions
  (`question`). Exact 1.4.243 forms, with no `--help` step:

  ```text
  # after a batch, ack it and wait for the next
  orca orchestration check --ack <delivery_id> --wait --types worker_done,escalation,question --timeout-ms <ms> --json
  # start a worker, then compare launch.effective with the request
  orca orchestration worker-start --spec "<packet>" --worktree current --agent <agent> --model <id> --effort <level> --json
  # top-level coordinator only
  orca orchestration run-create --objective "<objective>" --json
  ```
- In Claude, start that wait as a background command and end the turn. The harness wakes you
  when it exits. On timeout, start it once more.
- Next to each message wait, start a stall watch the same way:
  `orca terminal wait --terminal <worker handle> --for tui-idle --timeout-ms <expected duration, default 1800000>`.
  Whichever wait exits first wakes you. A later wake for a worker whose result you already
  processed needs no action.
- If the worker goes idle without its result, run one
  `orca orchestration worker-show --dispatch <id> --json`. When `observation.agentWait` is set,
  the worker waits on a human prompt: tell the user. Otherwise send one nudge and start a new
  stall watch:
  `orca orchestration send --to dispatch:<id> --subject "Status?" --body "Send your result as worker_done, or your blocker as an escalation."`
  A worker may still answer with a heartbeat, which the message wait ignores; if the new watch
  fires with no result, run `orca orchestration check --peek` once before stopping it.
- If the watch times out with no result, run one
  `orca orchestration worker-read --dispatch <id>` to judge progress, then send the same nudge.
- To stop a stalled worker: `orca orchestration worker-stop --dispatch <id>`. When it returns
  `stop_unknown` (an external terminal, such as a Pi worker), run
  `orca orchestration worker-abandon --dispatch <id>`, then
  `orca orchestration task-update --id <task id> --status failed --result "cancelled: stalled"`,
  acknowledge its inbox batch, and `orca terminal close --terminal <worker handle>`.
- Coordinators sharing one Orca terminal fence each other (`consumer_fenced`, which ends a wait
  at once and looks like a stall); give each coordinator its own terminal.
- Use `orca terminal wait` only for terminal start-up and the stall watch. Never poll with
  repeated `check`, `worker-list`, `worker-read`, `worker-show` or `orca terminal read` calls.
- A worker that needs the coordinator runs
  `orca orchestration ask --question <text> --timeout-ms 1800000`, which blocks until answered
  or times out. A timed-out question stays pending; resume it with `--resume <message_id>`.
- A worker that cannot proceed sends its blocker as an escalation,
  `orca orchestration send --type escalation --subject "blocked: <reason>"`, then ends its turn.
- A dispatched worker that starts helpers adds `--from <own handle>` to `worker-start`, never
  `--run` (Orca rejects it with `worker_cannot_coordinate_own_run`), and reads helper mail with
  plain `check --terminal <own handle>`. A top-level coordinator's `check` is bound to its Run
  by `run-create`/`run-use`.
- When a worker shows `failed`, read `dispatch.lastFailure` in
  `worker-show --dispatch <id> --json`.
- Always write `orca orchestration check`; a bare `orca check` is denied by the Opus guard.
- Never `pkill` or `kill` by command pattern (it killed other agents' waits); stop only what
  you started, by dispatch, handle or PID.

## Retention and release

Retain a worker only when the calling workflow requires it. Verify parent, harness, role,
model, thinking, and directory before resuming; otherwise start fresh through the documented guide.
Release settled workers as the guide requires. Report lifecycle failures and effective-model
gaps; do not fall through to an unmanaged CLI launch.
