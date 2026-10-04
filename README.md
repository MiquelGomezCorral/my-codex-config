# my-harness-config

Repository-managed configuration for Codex, Claude Code, Pi, and Antigravity. All four
share the same skills, roles, command intent, policy, and three managed MCP servers; each
bootstrap writes native assets while preserving unrelated user configuration. Delegation
uses an active wrapper's lifecycle when one is present; otherwise it uses the current
harness's native worker tools.

OpenCode configuration remains separately owned by `my-opencode-config`.

## Workflow diagrams

![Whole workflow](workflow-diagrams/Whole-Flow.png)

<details>
<summary>Stage diagrams and legend</summary>

### Legend

![Diagram legend](workflow-diagrams/Legend.png)

### First draft

![First draft](workflow-diagrams/First-Draft.png)

### Planning

![Planning](workflow-diagrams/Planning.png)

### Adversarial review

![Adversarial review](workflow-diagrams/Adversarial.png)

### Improvement plan loop

![Improvement plan loop](workflow-diagrams/Improvement-Plan-Loop.png)

### Wave implementation

![Wave implementation](workflow-diagrams/Wave-Implementation.png)

### Coding loop

![Coding loop](workflow-diagrams/Coding-loop.png)

### Review

![Review](workflow-diagrams/Reviw.png)

</details>

## Requirements

- Bash, Git, Python 3, Node.js, npm, and `npx`.
- Install each desired harness separately: Codex CLI, Claude Code, Pi, or Antigravity.
- If BTCA is missing, install Bun first; the shared bootstrap then uses the official
  `bun add -g btca` command. The bootstrap does not install Bun.
- Docker is optional. If it is available and running, SearXNG is deployed at
  `http://localhost:8080`; otherwise setup continues with a warning.
- GitHub CLI (`gh`) authenticated to clone this private repository.

## Install On Another Computer

Clone the repository, then run the bootstraps for the harnesses you use:

```bash
gh auth login
gh repo clone MiquelGomezCorral/my-codex-config ~/code/my-codex-config
cd ~/code/my-codex-config
./bootstrap_codex.sh
./bootstrap_claude.sh
./bootstrap_pi.sh
./bootstrap_agy.sh
```

Each dedicated bootstrap calls `bootstrap_common.sh`. It checks for CodeGraph, BTCA, the
pinned SearXNG connector, the portable skill sources, and the SearXNG service; it installs
or starts only what is missing. It never installs a harness CLI, Docker, or authentication.
Portable Ponytail, diagram-design, and Excalidraw skills do not require Codex login. The four
scripts can also run separately.

Use `--no-searxng` to skip only the shared Docker service or `--no-searxng-mcp` to skip the
connector and managed SearXNG entry. Both defaults enable them.

Default user locations are `~/.codex`, `${CLAUDE_CONFIG_DIR:-~/.claude}`,
`${PI_CODING_AGENT_DIR:-~/.pi/agent}`, and `~/.gemini/config`; Antigravity CLI assets
also use `~/.gemini/antigravity-cli`. Existing configured roots remain supported.
Conflicting managed entries are backed up under
`${XDG_STATE_HOME:-$HOME/.local/state}/my-codex-config/backups/<timestamp>/` with private
permissions. Shared external skill sources live under
`${XDG_DATA_HOME:-$HOME/.local/share}/my-codex-config/external-skills/`.

CodeGraph does not index projects automatically. In each project where semantic search is
needed, run `codegraph init` and `codegraph index`, then restart the harness so its MCP
tools are discovered. Pi keeps its configured-root connector-path repair and continues to
use local SearXNG search without paid-search or Codex-search fallback.
Pi also pins `pi-subagents@0.73.1` and `pi-mcp-adapter@2.34.0`, and installs the
diagram-design Pi extension when missing.
`config/bin/update-codex` remains an explicit, opt-in updater; bootstrap never runs it.

Retired MCP entries are removed from managed native configuration when a harness bootstrap
runs. Packages and authentication state are not uninstalled or deleted.

Verify source and local prerequisites with:

```bash
./bootstrap_codex.sh --check
```

The isolated bootstrap tests use temporary directories and stub external installers and
services. They do not install into a live home or require authentication.

## Authentication

Authentication stays in each harness's native store and is never copied into this
repository or inspected by the bootstraps. Sign in through each harness's own documented
flow.

## What gets installed where

All 31 repository skills, 12 focused roles, and 13 command intents share the sources under
`config/`. Native adapters load each command's owning skill and forward its arguments.
Skills are linked one entry at a time, so unrelated user skills remain available. Native
mutable config is merged; malformed files are left untouched and managed conflicts receive
private backups.

| Harness | Shared assets and policy | Roles and commands | MCP configuration |
| --- | --- | --- | --- |
| Codex | `~/.agents/skills`, individual links; managed policy appended to `~/.codex/AGENTS.md` | `~/.codex/agents` private role copies; linked `commands/` | `~/.codex/config.toml` merged with local MCPs and runtime tables preserved; native hooks, plugins, dispatcher, and updater remain Codex-owned |
| Claude Code | `~/.claude/skills`, individual links; policy appended to `CLAUDE.md` | `agents/*.md`; command aliases are thin skills, with `harness-init` and `harness-review` reserved | User-scoped `claude mcp` commands add the three managed stdio servers and remove retired IDs |
| Pi | Configured agent-root `skills/`; `AGENTS.md` policy append | `agents/*.md`, native `prompts/*.md`; async child agents inherit project/global context and skills | `mcp.json` merged; uses a compatible configured-root connector executable when present, otherwise the resolved shared binary |
| Antigravity | CLI and IDE plugin each link shared skill entries; global policy and plugin policy are appended | CLI command TOML plus plugin skill aliases; CLI/IDE roles derive from the shared role source | `mcp_config.json` merged while preserving unrelated entries |

The common MCP source is exactly CodeGraph, SearXNG, and BTCA in `config/mcp.json`.
Clients receive native command paths and fields. MCP connection success still depends on
the service, executable, and each harness's native runtime.

## Skills and agents

All shared skills are owned by `config/skills`. Invoke one explicitly with `$skill-name`,
for example `$workflow`, `$code`, `$review`, `$cleanup`, or `$writing`. `$workflow` starts
with the idea and evidence, then carries an approved wave through its PR slices. Twelve
focused TOML roles in `config/agents/` render to each harness's native role format.
`diagram-worker` creates planning visuals under the workflow's
[diagram guide](config/skills/workflow/references/diagrams.md). All five Git actions use
`git-worker` by default; the `git` skill remains the sole owner of Git policy.

`$workflow` renders a short human view from the complete Markdown plan and a small
`review.json` brief. See the [brief field guide](config/skills/workflow/references/plan-review-template.md)
and [compact example](config/skills/workflow/templates/review.example.json). Existing
Markdown-only renderer calls still work.

Shared product decision records live in each repository's `docs/decisions/`. Only the
human-facing agent uses `agents-memory`: it reads relevant existing repository context and
stores new private working notes, agent decisions, and plans under `agent-memory/` in the
Git common directory shared by linked worktrees. Workers receive the relevant task context
and return memory suggestions to that agent. Existing tracked `.agents/` files remain in
place; separate clones do not share the private directory. Planning assesses applicable
records and includes exact proposed record/index changes for approval; after approval,
the main orchestrator applies those changes
and passes protected invariants to implementation and review workers. Routine work reports no
change, while intent conflicts require user resolution.

Delegating skills load `super-agent`. A proven active wrapper such as Orca owns the
worker lifecycle and exposes eligible harnesses; without a wrapper, delegation stays on
the current harness and uses its native worker tools. Generic mixed swarms keep at least
half their workers, rounded up, on the current harness when no harness preference was
supplied. The review skill prefers Pi reviewers under Orca, preserves explicit AGY/Pi
rosters, and keeps live end-to-end validation on Codex. The active adapter owns default
harness routes. Outside a wrapper, another harness
requires an explicit documented one-shot adapter; quota substitutions and missing coverage
remain visible.

Workflow stages use harness-native planning, coding, and findings-only review routes where
available. The compact route and limitation matrix is
[here](config/skills/workflow/references/native-capabilities.md). Wrapper discovery stays
generic; Orca executable resolution, guide loading, and launch mechanics live in its
[adapter](config/skills/orchestration/references/orca.md).

Cheap worker choices live only in
`config/skills/super-agent/references/model-catalog.yaml`, organized by harness
and the `low`, `medium`, `high`, and `local` tiers. `super-agent` selects models from the
catalog, preferring the cheapest adequate local or online choice for the requested route;
automatic selection and fallback use only compatible catalog entries. Exhausted catalog
choices are reported as blockers instead of using a harness default. `$code` and `$cleanup`
intentionally retain their configured orchestrator-strength models. Pi's Orca route pins
the selected model in a custom terminal and attaches the task through the supervised
worker lifecycle described by the adapter. Explicit cross-harness one-shot adapters are
documented by `super-agent`;
they pass catalog values as arguments and never evaluate them as shell code. Pi search
remains on its local SearXNG MCP tools.

The `orchestration`, `orca-cli`, and `computer-use` skills are version-matched discovery
stubs that fetch their guide from the installed binary; their content is intentionally not
duplicated here.

Repository command intents pass their arguments to one named skill, and that skill owns the
workflow. Each harness gets its native form: Codex slash commands, Pi prompt templates,
Claude thin skill aliases, and Antigravity CLI command TOML plus IDE skill aliases. Claude
reserves native `init`, `review`, and `code-review` names, producing `harness-init` and
`harness-review`; it also prefixes aliases that match their owning skill. Each alias loads
its owning skill and forwards the full invocation arguments.

| Command | Skill |
| --- | --- |
| `bro` | `bro` |
| `cleanup` | `cleanup` |
| `code` | `code` |
| `commit` | `git` |
| `index` | `codegraph-setup` |
| `init` | `agents-memory` |
| `merge` | `git` |
| `workflow` | `workflow` |
| `refine-plan` | `refine-plan` |
| `review-findings` | `review-findings` |
| `review-plan` | `review-plan` |
| `review-pr-comments` | `git` |
| `review` | `review` |

For example, a native `review` alias passes `quick focus on the payment path` to the
`review` skill. Direct `$skill-name` invocation also remains available.

The `$review --preset` values are `flash`, `swarm`, `swarm-smart`, and `full`, for one
brief reviewer, adaptive swarm, verified swarm synthesis, or authorized live end-to-end
validation. OCR stays a separate explicit `$review --ocr` opt-in. Install OCR separately,
then authenticate `opencode-go` in Pi with `/login`; Pi is only the credential store, not
the review harness. The review helper calls OpenCode Go directly, defaults to
`deepseek-v4-flash`, and stores no credential or session state in this repository. Set
`OCR_OPENCODE_GO_MODEL` before launching the harness to select another Go model. Without
Pi, provide `OPENCODE_API_KEY` through the approved secret store.

```bash
npm install -g @alibaba-group/open-code-review
pi auth check --provider opencode-go --no-refresh
ocr --version
```

From any repository, run `ocr-go review --preview` and then `ocr-go review`.

The shared installer obtains only the skill folders for Ponytail, diagram-design, and
Excalidraw from their public repositories, then links those skills into each harness.
Sources are cached outside the repository under the XDG data directory. Native plugin
hooks are not copied or translated.

### Attribution

The `writing` skill's natural-writing rules merge two upstream sources:

- [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop/blob/main/skills/no-ai-slop/SKILL.md)
  (MIT) — editing principles, voice preservation, pattern list.
- [Humanize by Rich Tabor](https://github.com/richtabor/agent-skills/tree/main/skills/humanize),
  also listed as `natural-writing-humanizer` on MCP Market, derives its catalogue from
  [Wikipedia's "Signs of AI writing"](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
  (WikiProject AI Cleanup, CC BY-SA) — rule identifiers, individual reference impacts,
  scoring framework, and the coverage, no-new-patterns, and genre safeguards.

The adaptation treats patterns as contextual heuristics, retaining source exceptions and
the writer's preferences. It uses individual reference impacts instead of Humanize's
inconsistent category-level summary. Its optional score retains the HIGH/MEDIUM deductions,
treats LOW findings as advisory, avoids duplicate deductions, and measures checklist
findings only; it is not a validated quality or authorship measure.

The personal voice profile is built from Miquel's own 100-question interview, using the
interview and anti-overfitting method in [Ruben Hassid's "I am just a text file"](https://ruben.substack.com/p/i-am-just-a-text-file).

That full interview is stored verbatim at
`config/skills/writing/references/voice-interview.md` (100 questions, 7 sections, plus
the post-interview calibration). It is the source material. The operating profile the
agent reads by default is the compressed `voice-profile.md`, which carries only the rules,
the boundaries, the quick reference card, and the anti-overfitting guide. The upstream
article link above is the standing reference for regenerating or extending the interview.

The `test-audit` skill adapts [OpenClaw's `test-audit`](https://github.com/openclaw/openclaw/blob/main/.agents/skills/test-audit/SKILL.md)
(MIT, OpenClaw Foundation). Its value bar, junk patterns, retention bar, candidate evidence,
edit shape, and campaign phases are kept. Its OpenClaw-specific skill names, Vitest scripts,
and PR flow are replaced by this repository's own test commands and the `git` skill.

The workflow renderer bundles selected [Lucide](https://github.com/lucide-icons/lucide)
SVGs. Lucide's ISC notice and the MIT notice for Feather-derived icons are in
`config/skills/workflow/licenses/lucide.LICENSE`.

The `skill-scout` skill replaces the former `find-skills` and `skillspector` skills, folding
their marketplace discovery and static security scan into one find-vet-catalog flow. Its
`references/evidence.md` cites the measurements it reasons from:
[SWE-Skills-Bench](https://arxiv.org/abs/2603.15401),
[SkillsBench](https://arxiv.org/abs/2605.31408), and a study of 34,000 real skills reported
by The Decoder.

## Repository ownership

Workers use the active wrapper's documented lifecycle or the current harness's native
lifecycle. Retained sessions resume only when their parent, harness, role, model, and
directory still match. This repository does not install or authenticate another harness.

`my-opencode-config` remains the owner of OpenCode's `config/skills/` and
`config/commands/`. It is a separate rollback path and is not modified or installed by
this repository; an already-exposed OpenCode agent may still be selected by the portable
routing policy.

Vault Context is explicit-only:

```bash
node "${CODEX_HOME:-$HOME/.codex}/vault-context/bin/search.mjs" --prompt "search text"
```

No prompt hook performs Vault search, and no OpenCode plugin adapter is installed in
Codex.

## Check

```bash
./bootstrap_codex.sh --check
bash tests/bootstrap.test.sh
node --test tests/*.mjs config/plugins/vault-context/test/plugin.test.mjs
```

The first command is the minimum readiness check. The isolated-home test uses temporary
directories and does not install into a live home or require authentication.

## Rollback

The existing OpenCode installation remains untouched. Stop using the Codex configuration,
then run `my-opencode-config`'s documented bootstrap or restore its prior links. This
repository does not install or upgrade OpenCode.

## Never commit

- Credentials, auth state, sessions, histories, databases, logs, caches, memories,
  installation IDs, or plugin caches.
- Machine-specific absolute paths or private connection data.
- Generated dependencies such as `node_modules`.
