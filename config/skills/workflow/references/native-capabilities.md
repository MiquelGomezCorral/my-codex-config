# Native capabilities

Use this routing reference for planning, coding, review, and delegation. Keep workflow
scope, approvals, one writer, evidence, cleanup, and result acceptance in this repository.
Routes below describe callable capabilities; a skill or role is not proof that runtime
authentication or execution is available.

| Harness and stage | Route, input, and result | Side effects, prerequisites, unsupported operations, and gaps |
| --- | --- | --- |
| Codex planning | Planning is a session collaboration mode, not a standalone scriptable command. Use a scoped planning prompt in the current session. | No scriptable native plan invocation is established. |
| Codex coding | Use normal `codex exec` for non-interactive coding, with a scoped task prompt. | Requires authenticated Codex. It can edit the selected workspace; it is not a retained worker lifecycle. |
| Codex review | `codex review --uncommitted` OR `--base <branch>` OR `--commit <sha>`; `--title` only with `--commit`. Input is one target; result is a non-interactive findings report. Alternatively, provide one custom prompt with no target flag. Evidence: installed Codex 0.159.2 `codex review --help`, [developer command reference](https://learn.chatgpt.com/docs/developer-commands?surface=cli), and [openai/codex#7825](https://github.com/openai/codex/issues/7825), [#22145](https://github.com/openai/codex/issues/22145). | Authenticated Codex required; consumes paid tokens. Target and custom prompt conflict, so target review cannot include the full plan/scope prompt. Assess scope explicitly against the target and report unsupported isolation; never expand to unrelated dirty changes. No posting, commit, or edits in this route. |
| Codex agents/swarm | Use in-session agent tools where available; input is an explicit roster and bounded task packets; result is returned worker evidence. | Model, nesting, scope, one-writer, and observable lifecycle constraints still apply. A scriptable planning command and cross-session lifecycle are not implied. |
| Claude planning | Use supported plan permission mode with a scoped planning task; see installed Claude Code plan mode and [commands](https://code.claude.com/docs/en/commands). | Requires an authenticated Claude runtime; this environment has none. Do not prompt for login. |
| Claude coding | Use normal Claude Code capability with a scoped coding task, as exposed by the installed client. | Runtime unavailable here; no automatic fallback. |
| Claude review | Invoke bundled `code-review` through the Skill tool using canonical `code-review`, with the approved target and findings-only scope, only when the installed client exposes it as callable; otherwise report the route unsupported instead of invoking. A local review runs in a fork by default ([Claude commands](https://code.claude.com/docs/en/commands)); installed Claude 2.1.289 supplies the command. | Paid tokens and Claude auth required; runtime unavailable here. `--fix` mutates files; `--comment`/`--post` publish; `ultra` is user-triggered paid cloud multi-agent review. None substitutes for findings-only review. Installed `claude --help` confirms user-selected one-shot argv: `claude --model <catalog_id> --print --dangerously-skip-permissions --no-session-persistence <prompt>`; it is not automatic fallback or a retained session. |
| Claude agents/swarm | Use native subagents with an explicit roster, model, and read-only task packet. | Paid tokens and auth required. `/batch` and cloud `ultra` are not automatic replacements for supervised local work. |
| Pi planning | Use a scoped planning prompt; Pi 0.84.4 core has no plan mode (installed `pi --help`; an extension may add one). | No core scriptable plan route. |
| Pi coding | Use Pi's normal coding capability with a scoped prompt. Pin worker model in its terminal: `pi --model <catalog_id> --thinking <level>` (installed `pi --help`). | Separate terminal launch must use the active wrapper; `worker-start --terminal` attaches its task. This is wrapper lifecycle, not Pi core plan mode. |
| Pi review | No bundled review engine. Use a scoped read-only review role through pi-subagents 0.73.1 and the active wrapper; input is target diff plus task packet; result is findings. | Requires installed pi-subagents and wrapper lifecycle; pin model in terminal. Search stays local SearXNG only; no paid fallback. |
| Pi agents/swarm | pi-subagents 0.73.1 via the active wrapper, with explicit roster, pinned terminal model, nesting budget, and bounded tasks (installed pi-subagents help/docs). | Pi core does not own worker lifecycle; do not invent a direct launch/wait API. |
| AGY planning | `agy --print --mode plan <task packet>` returns a plan (installed `agy --help`). | Requires installed AGY CLI; no interactive teamwork substitution is implied. |
| AGY coding | Use `agy --print <task packet>` for non-interactive scoped coding (installed `agy --help`). | Can make workspace edits; exact model and permissions must be explicit. |
| AGY review | No bundled review engine; visual diff is not an automated review. Use `agy --print` with a scoped, read-only review task packet; result is findings (installed `agy --help`). | Requires AGY CLI; paid interactive teamwork is not a findings-only substitute. |
| AGY agents/swarm | Discover agents with `agy agents`; route scoped native agent tasks through `agy --print` and the selected wrapper lifecycle (installed `agy agents --help`). | Keep explicit roster and model, nesting budget, scope, one writer, and observable lifecycle. Do not infer lifecycle calls from discovery. |

Codex and Claude review consume paid tokens; Codex needs authenticated Codex, while Claude
authentication is unavailable here. Findings-only routes do not post, commit, or edit.
Mutating or publishing routes (`--fix`, `--comment`/`--post`, `ultra`, `/simplify`,
`/batch`) require explicit user authorization and never replace review or cleanup gates.

Do not copy vendor prompt text into stage skills. Sources for installed command facts are
the named client help output; primary documentation includes the linked Codex reference and
[Claude model overview](https://platform.claude.com/docs/en/models/overview). Pi facts are
from installed Pi/pi-subagents help and documentation; AGY facts are from installed `agy`
help. No native runtime was launched to validate execution in this task.
