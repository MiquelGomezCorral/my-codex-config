# Harness configuration insights

Audit notes and recommendations, 2026-10-03. These are proposals for the repository
pivot, not an approved implementation plan.

## Repository direction

- Use `my-harness-config` in documentation. Preserve the current source layout,
  checkout name, remote name, and existing runtime resource identities.
- Rename `bootstrap.sh` to `bootstrap_codex.sh`, retain the Pi and Antigravity
  entry points, and add `bootstrap_claude.sh`.
- Keep one owner for shared skills, policy, command intent, and role prompts.
  Render native formats for each harness instead of copying its configuration blindly.

## What the audit found

- The repository contains 31 shared skills, 13 command wrappers, and 12 role
  definitions. Claude has no bootstrap yet.
- Pi and Antigravity already install the full shared skill library. Their smaller
  MCP configurations were intentional: they normally act as delegated workers.
- Pi's native child renderer selects skills by role and disables inherited skill
  discovery. Separate Orca sessions do not automatically receive those child limits.
- The documented Pi worker launch allows file tools and Bash but omits MCP tools.
  Installed CodeGraph and SearXNG therefore are not enough to make them callable.
- Antigravity needs verification of CLI discovery paths and ambient customization
  inheritance. Native formats, token handling, and plugin hooks differ across harnesses.

## Agreed installation model

Install the full shared skills, command intent, and role definitions on all four
harnesses, with the MCP selection below. Give workers the full tool surface; their role and task
instructions define scope. The user chose this over the earlier recommendation to
restrict launch tools or select MCP subsets. Do not add worker/orchestrator profiles.

Installation, loaded instructions, and callable tools are different things.
Keeping skill files available does not require loading every skill body. Missing
credentials or an unavailable service must be reported separately from installed
configuration. Role instructions are behavioral limits, not tool access controls.

| Job | Needed capability |
| --- | --- |
| Review | Review standards, repository search, CodeGraph where required |
| Web research | Search and URL reading; Pi uses local SearXNG |
| GitHub/git | Git guidance, `git`, `gh`, and bounded action authority |
| Coding | Quality guidance, editing and build tools |
| Nested coordination | Delegation guidance and an explicit parent budget |
| Human-facing orchestration | Planning, workflow, progress, decisions, private memory |

The audit found seven integrations; the user narrowed the bootstrap selection:

- **Keep:** CodeGraph, SearXNG, BTCA.
- **Remove:** Braintrust, Vidext Operator, Sequential Thinking, and Headroom from
  managed source, bootstrap delivery, and active setup documentation. The user
  confirmed all four removals. Reruns must not restore their retired managed entries.

Preserve unrelated client configuration and private authentication state. A native
web search tool is separate from an MCP. No live home is changed during planning.

### Sequential Thinking and Headroom evidence

Two read-only Codex `gpt-6-luna` researchers, medium tier with high effort, inspected
published reviews and benchmark methods. Both completed; Headroom was released,
and Sequential Thinking release reported user takeover, so its terminal was left
under that owner. Root verified consequential claims against original sources.

- **Sequential Thinking:** the pinned server tracks thoughts supplied by the model;
  it does not supply an independent reasoning engine. The bounded search found no
  convincing reproducible same-model benchmark showing better task quality. Public
  overhead measurements and user anecdotes do not establish a quality gain.
  [Pinned implementation](https://github.com/modelcontextprotocol/servers/blob/2026.7.4/src/sequentialthinking/lib.ts).
- **Headroom:** our MCP-only setup provides on-demand compression, not automatic
  compression of traffic. Output shaping belongs to the proxy path. Published proxy
  results are mixed: a competitor-sponsored 100-task SWE-bench comparison reports
  58 solves versus 57 baseline, with 44% higher cost and 13% more wall time. A positive
  SQLite fixture measures token compression and estimates savings without a separate
  uncompressed-agent run or scored answer accuracy. Neither tests our MCP setup.
  [MCP architecture](https://docs.headroomlabs.ai/docs/mcp),
  [coding benchmark](https://github.com/daseinlabs/code-compression-bench),
  [fixture method](https://github.com/shreyassks/headroom-benchmarks/blob/main/src/headroom_benchmarks/langgraph/README.md).

Decision: keep only CodeGraph, SearXNG, and BTCA in the bootstraps. Prune the four
retired integrations; add no utility flags, profiles, proxy integration, or local
benchmark work. Absence of located evidence does not prove either utility is never
useful. No local benchmarks were run.

## Agreed delivery shape

One wave, two sequential slices:

1. **Complete installation.** Four dedicated bootstrap commands, shared assets,
   native renderings, compatible MCPs, policy, documentation, and focused checks.
2. **Reuse native behavior.** Make workflow instructions call documented native
   planning, coding, review, and swarm capabilities where suitable. Retain our
   approval, scope, evidence, ownership, and independent critique requirements.

Keep each harness's default main agent. Custom subagents keep focused roles and
can discover the shared skills without preloading the entire library. Preserve
native command access when a shared command has the same name.

Centralize lifecycle discovery and adapter selection through the orchestration
entry point; `super-agent` remains the sole delegation-policy owner. Keep Orca as
the supported adapter, with its version-matched runtime guides. Shared stages
refer to the selected lifecycle instead of embedding Orca commands. Without a
wrapper, use only capabilities the current harness actually provides. Do not
build a new orchestration engine or promise identical lifecycle operations.

The user accepted the candidate and confirmed the MCP selection. The independent Pi DeepSeek critic completed one pass. Its technical findings
are resolved in the finalized wave; implementation approval remains before delivery.

## Native capabilities: research findings

Prefer native execution when it covers the required job. Keep our workflow as the
owner of scope, approvals, worker ownership, evidence, and result acceptance. Add
only the requirements the native capability does not already cover.

This refines the installation recommendation above: make shared assets available,
but preserve native command names and defaults. Do not register every custom skill
blindly when a harness already has the same capability.

### What maintainers and users say

- **OpenAI recommends revisiting old scaffolding.** Its current guidance says long
  descriptions, broad triggers, and rigid recipes can hinder newer models. Keep
  contextual instructions and short routers. The guidance also distinguishes model
  families; deleting guidance for cheaper workers is not automatically justified.
  [OpenAI guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).
- **Anthropic is simplifying its own instructions.** Its engineering account
  describes removing redundant constraints and moving review/verification guidance
  into selectively loaded skills. This supports reusing updated native capabilities.
  [Anthropic guidance](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models).
- **Practitioner views favor specific value.** In one public discussion, users
  criticize generic expert-persona prompts while describing benefits from repeatable
  procedures, brand rules, and fixes for concrete omissions. These are anecdotes,
  not evidence of a community consensus or a performance guarantee.
  [Discussion](https://www.reddit.com/r/claudeskills/comments/1uhpndu/why_are_all_the_claude_code_skill_files_i_see/).

Research on repository context files is mixed: one study reports higher cost without
general success gains; another reports efficiency improvements. These studies concern
context files, not our skills or a direct native-versus-custom comparison.
[Context-file evaluation](https://arxiv.org/abs/2602.11988),
[Efficiency study](https://arxiv.org/abs/2601.20404).

### Native features differ

| Harness | Reuse candidate | Boundary |
| --- | --- | --- |
| Claude Code | Plan mode, normal coding, bundled `/code-review` | `/simplify` applies cleanup fixes; `/batch` creates worktrees and publishes changes |
| Codex | Native `/plan`, `/review`, `codex review`, normal coding | Native review targets and custom instructions have CLI constraints |
| Antigravity | Native `/plan` and normal coding | A visual diff review is not evidence of an equivalent automated review engine |
| Pi | Default coding plus selected extensions | Core intentionally omits plan mode and subagents; upstream examples are optional |

Sources: [Claude commands](https://code.claude.com/docs/en/commands),
[Codex commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli),
[Antigravity planning](https://antigravity.google/docs/plan/), and
[Pi's current README](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md).
Official plugins, bundled skills, runtime modes, and model training are different
things. There is no portable instruction that inherits all their implementations.

### Consequences for this repository

- **Keep the coordination contract.** `workflow/SKILL.md:62` owns human gates;
  `code/SKILL.md:59` owns one retained writer;
  `review/references/orchestration.md:82` owns the complete review basis.
  A native task runner does not automatically preserve these choices.
- **Delegate execution to native behavior.** Our `code` skill is a dispatch contract,
  not a replacement coding engine. Review and planning wrappers can become thinner
  where native invocation preserves scope and authority. Use the supported invocation
  route instead of copying the vendor's prompt text into this repository.
- **Preserve the base prompt.** Claude documents that nonempty custom agent prompts
  replace its default prompt. Pi currently emits `systemPromptMode: replace`
  (`bootstrap_pi.sh:129`). Prefer default or append behavior where it meets the role;
  keep a specialized replacement only for a demonstrated need.
  [Claude agent behavior](https://code.claude.com/docs/en/sub-agents).
- **Keep review and fixing separate.** Claude's native `/code-review` makes fixing
  and posting explicit options. Our review authority excludes both unless requested
  (`review/references/code-review.md:51`). Its mutating `/simplify` cannot directly
  replace our findings-only cleanup gate. Avoid command collisions that hide native
  skills; Claude documents that user skills can replace bundled commands.
  [Claude commands](https://code.claude.com/docs/en/commands),
  [Name precedence](https://code.claude.com/docs/en/skills).

Vendor tuning is a useful baseline, not proof that every native feature is better
for every task. Representative comparisons would be needed before claiming an
improvement. Preserve the approved wrapper lifecycle and validate native invocation
compatibility before replacing any stage. No skill or bootstrap changes are approved
by this research note.

### Focused readiness follow-up

- Claude's canonical bundled `code-review` is the planned invocation through its
  Skill tool. Keep that name free; shared `review` can retain the extra workflow
  contract. The reverse alias collision is not explicitly settled by the docs,
  so do not rely on `/review` to reach the bundled implementation.
  [Claude invocation and name precedence](https://code.claude.com/docs/en/slash-commands).
- Pi's pinned MCP adapter 2.34.0 supports runtime `bearerTokenEnv` and environment
  references in HTTP headers, according to the installed README/server manager.
  This resolves the earlier source-version uncertainty, not live connectivity.
  [Versioned package](https://www.npmjs.com/package/pi-mcp-adapter/v/2.34.0).
- Historical finding, superseded by removing Braintrust: AGY 1.2.12 help and official MCP docs establish no equivalent HTTP token-reference
  route. Braintrust authentication there remains unverified. Do not persist the
  token or invent interpolation support; keep this compatibility gap visible.
  [AGY MCP configuration](https://antigravity.google/docs/mcp).
- Native modes, agent tools, and swarm interfaces differ. Codex session `/plan`,
  AGY's interactive teamwork preview, and Pi extensions must not be described as
  the same automatically callable feature. Wrapper-owned worker lifecycle still
  applies when a separate agent session is required.

The follow-up used two read-only Codex `gpt-6-luna` explorers, medium catalog tier,
with medium and high effort respectively; launcher and transcript model matched.
Both completed and were released. No native task or MCP connection was executed.

## Evidence and limits

The initial audit used Pi `opencode-go/deepseek-v4.1-flash` and independent Codex
explorers. Sources include `bootstrap_pi.sh:92`, `bootstrap_agy.sh:69`,
`codex/commands/`, `codex/agents/`, and
`agent-home/skills/super-agent/references/routing.md:45`.

The native-overlap explorer used Codex `gpt-6-luna`, medium tier and effort; the
launcher reported that model. Its read-only findings were checked against local
skill sources. `codex review --help` confirmed the installed review command's
interface. Native review/planning execution was not run.

The explorer accidentally ran `slopo init` through shell substitution while
formatting a lifecycle report. The resulting empty template was traced to that
command and removed; no Slopo analysis was run. The requested document is the only
repository addition from this research.

Relevant upstream documentation: [Pi skills](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md),
[Pi role controls](https://github.com/nicobailon/pi-subagents/blob/main/docs/agents.md),
[Antigravity subagents](https://antigravity.google/docs/subagents/), and
[Claude skills](https://code.claude.com/docs/en/skills).

The audit inspected source and documentation. It did not run tests, install into live
homes, connect MCP servers, or change Git history. Existing edits from another
session must be preserved.
