import { test } from "node:test"
import { doesNotMatch, match, ok, strictEqual } from "node:assert"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

const root = resolve(new URL("..", import.meta.url).pathname)
const read = (path) => readFileSync(join(root, path), "utf8")

test("repository has one shared skill owner with unique valid names", () => {
  const skills = join(root, "agent-home/skills")
  const names = []
  for (const entry of readdirSync(skills)) {
    const path = join(skills, entry, "SKILL.md")
    if (!statSync(join(skills, entry)).isDirectory() || !statSync(path, { throwIfNoEntry: false })) continue
    const body = readFileSync(path, "utf8")
    const name = body.match(/^name:\s*([^\n]+)$/m)?.[1]?.trim()
    const description = body.match(/^description:\s*(.+)$/m)?.[1]?.trim()
    strictEqual(name, entry)
    ok(description)
    ok(description.length <= 1024)
    names.push(name)
  }
  strictEqual(new Set(names).size, names.length)
  for (const required of [
    "core", "subagent-routing", "cleanup", "review", "code", "commit",
    "review-findings", "index", "init", "plan-implementation", "review-plan",
    "review-pr-comments", "bro", "orca-cli", "orchestration", "computer-use", "decision-records",
  ]) ok(names.includes(required), `missing skill: ${required}`)
  ok(!names.includes("task-model-recovery"))
  ok(!names.includes("opencode-go-worker"))
  ok(!names.includes("customize-opencode"))
  ok(!statSync(join(root, "config/skills"), { throwIfNoEntry: false }))
})

test("local search setup keeps service and connector ownership separate", () => {
  const bootstrap = read("bootstrap.sh")
  const piBootstrap = read("bootstrap_pi.sh")
  const codegraph = read("agent-home/skills/codegraph-setup/SKILL.md")
  const search = read("agent-home/skills/web-search/SKILL.md")
  const searxng = read("config/searxng/settings.yml")

  match(bootstrap, /--no-searxng/)
  match(bootstrap, /--no-searxng-mcp/)
  match(bootstrap, /docker\.io\/searxng\/searxng:latest/)
  match(bootstrap, /127\.0\.0\.1:8080:8080/)
  match(bootstrap, /--restart unless-stopped/)
  match(bootstrap, /warn 'Docker is unavailable/)
  match(piBootstrap, /pi install npm:pi-mcp-adapter@2\.34\.0/)
  match(piBootstrap, /pi install npm:mcp-searxng@1\.11\.1/)
  match(piBootstrap, /SEARXNG_URL.*http:\/\/localhost:8080/)
  match(piBootstrap, /"lifecycle": "lazy"/)
  match(piBootstrap, /"directTools": True/)
  match(codegraph, /@colbymchenry\/codegraph@1\.6\.0/)
  match(codegraph, /never indexes a project automatically/i)
  match(search, /searxng_web_search/)
  match(search, /web_url_read/)
  match(search, /do not fall back to\s+paid search APIs/i)
  match(searxng, /- json/)
})

test("decision records separate empty-index initialization from concern assessment", () => {
  const records = read("agent-home/skills/decision-records/SKILL.md")
  const planning = read("agent-home/skills/implementation-planning/SKILL.md")
  const code = read("agent-home/skills/code/SKILL.md")
  const indexTemplate = read("agent-home/skills/decision-records/assets/index-template.md")

  ok(indexTemplate.startsWith("# Decision records\n"))
  ok(indexTemplate.includes("No decision records exist yet."))
  ok(records.includes("If the index is missing, treat it as an empty existing-record set"))
  match(records, /including when no significant concern record\s+is needed/)
  ok(records.includes("Never report an approved index write as `none`."))
  ok(planning.includes("otherwise treat it as an empty existing-record set"))
  ok(code.includes("Do not repeat approval after these changes are authorized."))
  ok(statSync(join(root, "docs/decisions/index.md"), { throwIfNoEntry: false }))
})

test("Codex TOML agents use native fields and preserve all eight roles", () => {
  const names = [
    "coder", "cleanup-worker", "commit-worker", "review-worker",
    "reviewer-quick", "reviewer-reasoning", "reviewer-arch", "reviewer-e2e",
  ]
  const config = read("codex/config.toml")
  const result = spawnSync("python3", ["-c", "import pathlib, sys, tomllib; [tomllib.loads(pathlib.Path(p).read_text()) for p in sys.argv[1:]]", "codex/config.toml", ...names.map((name) => `codex/agents/${name}.toml`)], { cwd: root, encoding: "utf8" })
  strictEqual(result.status, 0, result.stderr)
  for (const name of names) {
    const body = read(`codex/agents/${name}.toml`)
    match(body, new RegExp(`^name = "${name}"$`, "m"))
    for (const forbidden of ["mode", "temperature", "steps", "task_key", "permission"]) {
      doesNotMatch(body, new RegExp(`^${forbidden}\\s*=`, "m"))
    }
    match(body, /^approval_policy = "never"$/m)
    match(body, /^sandbox_mode = "danger-full-access"$/m)
    ok(body.includes("developer_instructions"))
  }
  ok(config.includes("[mcp_servers.codegraph]"))
  ok(config.includes('command = "codegraph"'))
  match(config, /^model = "gpt-5\.6-sol"$/m)
  match(config, /^web_search = "live"$/m)
  doesNotMatch(config, /\[mcp_servers\.(?:playwright|searxng)\]/)
  doesNotMatch(config, /\/Users\/|\/Applications\/|\/home\/[^/]+\//)
})

test("Codex hooks and configuration contain no discarded worker boundary", () => {
  const hooks = JSON.parse(read("codex/hooks.json"))
  const hookText = JSON.stringify(hooks)
  ok(hookText.includes("workmux"))
  match(hookText, /\$HOME\\?\/\.orca\/agent-hooks\/codex-hook\.sh/)
  doesNotMatch(hookText, /\/home\/[^/]+\/.orca\/agent-hooks/)
  doesNotMatch(hookText, /vault-context|ObsidianVault/)
  for (const path of [
    "opencode-worker", "config/bin/opencode-go-worker.mjs", "codex/agents/opencode-go-runner.toml",
    "agent-home/skills/opencode-go-worker", "tests/opencode-go-worker.test.mjs",
  ]) {
    ok(!statSync(join(root, path), { throwIfNoEntry: false }), `discarded artifact remains: ${path}`)
  }
  for (const path of [
    "bootstrap.sh", "README.md", "agent-home/skills/subagent-routing/SKILL.md",
    "agent-home/skills/code/SKILL.md", "agent-home/skills/cleanup/SKILL.md",
    "agent-home/skills/review/SKILL.md", "agent-home/skills/agent-swarm/SKILL.md",
    "agent-home/skills/multi-agent-review/SKILL.md", "agent-home/skills/core/SKILL.md",
  ]) {
    doesNotMatch(read(path), /opencode-go|opencode-worker|session-ownership/i)
  }
})

test("cheap model catalog is harness-first and keeps identifiers centralized", () => {
  const catalog = read("agent-home/skills/subagent-routing/references/model-catalog.yaml")
  const routing = read("agent-home/skills/subagent-routing/SKILL.md")
  const modelIds = [...catalog.matchAll(/^\s+-\s+(\S+)$/gm)].map(([, id]) => id)
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  match(catalog, /^max_local_concurrency:\s*1$/m)
  for (const harness of ["pi", "agy"]) {
    match(catalog, new RegExp(`^${harness}:$`, "m"))
    for (const tier of ["low", "medium", "high"]) match(catalog, new RegExp(`^  ${tier}:$`, "m"))
  }
  match(catalog, /^  local:\s*$/m)
  match(catalog, /^    medium:\s*$/m)
  match(catalog, /^      -\s+\S+$/m)
  doesNotMatch(catalog, /capability:|models:/)
  strictEqual(modelIds.length, 7)
  strictEqual(new Set(modelIds).size, modelIds.length)
  match(routing, /Read `references\/model-catalog\.yaml` for every delegation/)
  match(routing, /cheapest adequate tier/)
  match(routing, /remaining entries in list order/)
  match(routing, /closed allowlist/)
  match(routing, /Never let\s+a wrapper or harness choose an uncataloged default model/)
  match(routing, /verify it matches; stop a mismatched worker/)
  match(routing, /max_local_concurrency/)
  match(routing, /Count a\s+cataloged local orchestrator/)
  match(routing, /Explicit one-shot adapters/)
  match(routing, /argument vector/)
  match(routing, /Never concatenate catalog values into shell code/)
  for (const harness of ["Codex", "Pi", "AGY", "OpenCode"]) match(routing, new RegExp(harness))
  for (const path of [
    "README.md",
    "agent-home/skills/agent-swarm/SKILL.md",
    "agent-home/skills/review/SKILL.md",
    "agent-home/skills/multi-agent-review/SKILL.md",
    "agent-home/skills/commit/SKILL.md",
  ]) {
    const body = read(path)
    for (const id of modelIds) doesNotMatch(body, new RegExp(escapeRegExp(id)))
  }
  doesNotMatch(read("agent-home/skills/code/SKILL.md"), new RegExp(modelIds.map(escapeRegExp).join("|")))
  doesNotMatch(read("agent-home/skills/cleanup/SKILL.md"), new RegExp(modelIds.map(escapeRegExp).join("|")))
})

test("delegating skills require runtime-native capability-aware routing", () => {
  const routing = read("agent-home/skills/subagent-routing/SKILL.md")
  const swarm = read("agent-home/skills/agent-swarm/SKILL.md")
  const review = read("agent-home/skills/review/SKILL.md")
  const multiReview = read("agent-home/skills/multi-agent-review/SKILL.md")
  const orchestration = read("agent-home/skills/orchestration/SKILL.md")
  const swarmEvals = JSON.parse(read("agent-home/skills/agent-swarm/evals/evals.json"))

  match(routing, /ceil\(N \/ 2\)/)
  match(routing, /quota or rate limit is exhausted/)
  match(routing, /must not create a branch or worktree/)
  match(routing, /real configured role/)
  match(routing, /active wrapper/)
  match(routing, /current harness[\s\S]*native/)
  match(routing, /codex.*exec.*catalog_model.*prompt/s)
  match(routing, /pi.*--print.*catalog_model.*prompt/s)
  match(routing, /agy.*--print.*catalog_model.*prompt/s)
  match(routing, /opencode.*run.*catalog_model.*prompt/s)
  match(routing, /argument vector/)
  match(orchestration, /ORCA_CLI_COMMAND/)
  match(orchestration, /orca-dev/)
  match(routing, /After an AGY readiness timeout, inspect the terminal before retrying/)
  match(routing, /dispatch without `--inject` and\s+with `--return-preamble`/)
  match(read("config/AGENTS.md"), /All agents, including nested workers, must load `subagent-routing`/)
  doesNotMatch(routing + swarm, /`spawn_agent`|`wait_agent`|`followup_task`/)
  match(read("agent-home/skills/code/SKILL.md"), /active wrapper through `subagent-routing`/)
  for (const name of ["coordinator", "worktree"]) {
    match(read(`agent-home/skills/${name}/SKILL.md`), /Load `subagent-routing`/)
  }
  doesNotMatch(routing, /Codex owns all subagent orchestration/)

  match(swarm, /other available harnesses/)
  match(review, /Launch or resume exactly one coordinator through `subagent-routing`/)
  match(multiReview, /When the user requests five/)
  match(read("agent-home/skills/code/SKILL.md"), /through `subagent-routing`/)
  match(read("agent-home/skills/cleanup/SKILL.md"), /through `subagent-routing`/)
  match(read("agent-home/skills/commit/SKILL.md"), /through `subagent-routing`/)
  match(read("agent-home/skills/skill-creator/SKILL.md"), /move the whole pair/)
  strictEqual(swarmEvals.evals.length, 9)
  match(JSON.stringify(swarmEvals), /quota-exhausted/)
  match(JSON.stringify(swarmEvals), /catalog tier/)
  match(JSON.stringify(swarmEvals), /local-search protection/)
  match(JSON.stringify(swarmEvals), /closed allowlist/)
  match(read("codex/agents/review-worker.toml"), /available harnesses/)
  match(read("codex/agents/review-worker.toml"), /pin an exact model from the cheap-model\s+catalog/)

  for (const path of [
    "agent-home/skills/subagent-routing/SKILL.md",
    "agent-home/skills/agent-swarm/SKILL.md",
    "agent-home/skills/review/SKILL.md",
    "agent-home/skills/multi-agent-review/SKILL.md",
  ]) {
    doesNotMatch(read(path), /Do not substitute workmux|exact Sol model has no fallback|Orca is the required lifecycle/)
  }
})

test("repository excludes runtime and credential-shaped files", () => {
  const output = spawnSync("bash", ["bootstrap.sh", "--check"], { cwd: root, encoding: "utf8" })
  strictEqual(output.status, 0, output.stderr)
  doesNotMatch(output.stdout, /auth|secret|token/i)
})
