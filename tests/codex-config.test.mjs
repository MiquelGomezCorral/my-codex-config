import { test } from "node:test"
import { doesNotMatch, match, ok, strictEqual } from "node:assert"
import {
  chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync,
  statSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
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
    "core", "super-agent", "cleanup", "review", "code", "git",
    "review-findings", "codegraph-setup", "agents-memory",
    "plan-implementation", "refine-plan", "review-plan",
    "bro", "orca-cli", "orchestration", "computer-use", "decision-records",
  ]) ok(names.includes(required), `missing skill: ${required}`)
  ok(!names.includes("task-model-recovery"))
  ok(!names.includes("opencode-go-worker"))
  ok(!names.includes("customize-opencode"))
  ok(!statSync(join(root, "config/skills"), { throwIfNoEntry: false }))
})

test("git skill owns five actions that resolve repository rules first", () => {
  const skill = read("agent-home/skills/git/SKILL.md")
  const merge = read("agent-home/skills/git/references/merge.md")

  match(skill, /^## Repository rules win$/m)
  match(skill, /Repository `AGENTS\.md` \/ `CLAUDE\.md`/)
  match(skill, /self-contained on purpose/)
  match(skill, /pre-push/)
  match(skill, /hard gate|Never bypass a hook/)
  for (const reference of ["push", "merge"]) {
    match(read(`agent-home/skills/git/references/${reference}.md`), /hard gate/)
  }
  match(skill, /^## Delegation$/m)
  match(skill, /--no-delegation/)
  match(skill, /merge` and `review-pr-comments` always run inline/)
  for (const reference of ["commit", "push", "pr", "merge", "review-pr-comments"]) {
    match(skill, new RegExp(`references/${reference}\\.md`))
    ok(statSync(join(root, `agent-home/skills/git/references/${reference}.md`), { throwIfNoEntry: false }))
  }

  match(merge, /^## History integrity$/m)
  match(merge, /Never squash/)
  match(merge, /--no-ff/)
  match(merge, /is-ancestor/)
  match(merge, /git log --oneline <base-branch>\.\.<branch>/)
})

test("plan implementation renders deterministically and delegates diagrams only by request", () => {
  const planning = read("agent-home/skills/plan-implementation/SKILL.md")
  const lavish = read("agent-home/skills/lavish/SKILL.md")

  match(planning, /native plan.*authoritative/i)
  match(planning, /render it with `node .*render-plan\.mjs.*`/i)
  match(planning, /normal path is deterministic/i)
  match(planning, /does not launch an agent or delegate to a model/i)
  match(planning, /explicitly requests a custom diagram/i)
  match(planning, /cataloged `medium` model at `low` thinking/i)
  match(planning, /require the `luxury` palette/i)
  match(planning, /absolute artifact path/i)
  match(planning, /\[Open Lavish plan\]\(<target>\)/)
  match(planning, /Do not run\s+`lavish-axi poll` unless the user explicitly asks/i)
  match(planning, /rendering and Lavish failures are non-blocking/i)
  match(planning, /always return the native plan/i)
  match(lavish, /npx -y lavish-axi <html-file>/)
})

test("review-plan delegates final template rendering to refine-plan", () => {
  const reviewPlan = read("agent-home/skills/review-plan/SKILL.md")
  const refinePlan = read("agent-home/skills/refine-plan/SKILL.md")

  match(reviewPlan, /Load the `refine-plan` skill/)
  doesNotMatch(reviewPlan, /^## Planning mode$/m)
  match(refinePlan, /^## Planning mode$/m)
  match(refinePlan, /^## Live validation$/m)
  match(refinePlan, /^## Decision records$/m)
  match(refinePlan, /Do not modify files\./)
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

test("cheap model catalog is harness-first and keeps identifiers centralized", () => {
  const catalog = read("agent-home/skills/super-agent/references/model-catalog.yaml")
  const routing = read("agent-home/skills/super-agent/SKILL.md")
  const routingReference = read("agent-home/skills/super-agent/references/routing.md")
  const modelIds = [...catalog.matchAll(/^\s+-\s+(\S+)$/gm)].map(([, id]) => id)
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  match(catalog, /^max_local_concurrency:\s*1$/m)
  match(catalog, /^codex:\n  low:\n    - \S+$/m)
  for (const harness of ["pi", "agy"]) {
    match(catalog, new RegExp(`^${harness}:$`, "m"))
    for (const tier of ["low", "medium", "high"]) match(catalog, new RegExp(`^  ${tier}:$`, "m"))
  }
  match(catalog, /^  local:\s*$/m)
  match(catalog, /^    medium:\s*$/m)
  match(catalog, /^      -\s+\S+$/m)
  doesNotMatch(catalog, /capability:|models:/)
  strictEqual(modelIds.length, 10)
  strictEqual(new Set(modelIds).size, modelIds.length)
  match(routing, /Read `references\/model-catalog\.yaml` for every delegation/)
  match(routing, /cheapest adequate tier/)
  match(routing, /remaining entries in list order/)
  match(routing, /closed allowlist/)
  match(routing, /Never let\s+a wrapper or harness choose an uncataloged default model/)
  match(routing, /verify it matches; stop a mismatched worker/)
  match(routing, /max_local_concurrency/)
  match(routing, /Count a\s+cataloged local orchestrator/)
  match(routingReference, /Explicit one-shot adapters/)
  match(routingReference, /argument vector/)
  match(routingReference, /Never concatenate catalog values into shell code/)
  for (const harness of ["Codex", "Pi", "AGY", "OpenCode"]) match(routingReference, new RegExp(harness))
  for (const path of [
    "README.md",
    "agent-home/skills/super-agent/references/swarm.md",
    "agent-home/skills/review/SKILL.md",
    "agent-home/skills/multi-agent-review/SKILL.md",
    "agent-home/skills/git/SKILL.md",
  ]) {
    const body = read(path)
    for (const id of modelIds) doesNotMatch(body, new RegExp(escapeRegExp(id)))
  }
  doesNotMatch(read("agent-home/skills/code/SKILL.md"), new RegExp(modelIds.map(escapeRegExp).join("|")))
  doesNotMatch(read("agent-home/skills/cleanup/SKILL.md"), new RegExp(modelIds.map(escapeRegExp).join("|")))
})

test("delegating skills require runtime-native capability-aware routing", () => {
  const routing = read("agent-home/skills/super-agent/SKILL.md")
  const routingReference = read("agent-home/skills/super-agent/references/routing.md")
  const lifecycle = read("agent-home/skills/super-agent/references/lifecycle.md")
  const swarm = read("agent-home/skills/super-agent/references/swarm.md")
  const review = read("agent-home/skills/review/SKILL.md")
  const multiReview = read("agent-home/skills/multi-agent-review/SKILL.md")
  const orchestration = read("agent-home/skills/orchestration/SKILL.md")
  const swarmEvals = JSON.parse(read("agent-home/skills/super-agent/evals/evals.json"))

  match(routing, /ceil\(N \/ 2\)/)
  match(lifecycle, /quota or rate limit is exhausted/)
  match(routing, /must not create a branch or worktree/)
  match(routing, /real configured role/)
  match(routing, /active wrapper/)
  match(routing, /current harness[\s\S]*native/)
  match(routingReference, /codex.*exec.*catalog_model.*prompt/s)
  match(routingReference, /pi.*--print.*catalog_model.*prompt/s)
  match(routingReference, /agy.*--print.*catalog_model.*prompt/s)
  match(routingReference, /opencode.*run.*catalog_model.*prompt/s)
  match(routingReference, /argument vector/)
  match(orchestration, /ORCA_CLI_COMMAND/)
  match(orchestration, /orca-dev/)
  match(read("config/AGENTS.md"), /All agents, including nested workers, must load `super-agent`/)
  doesNotMatch(routing + swarm, /`spawn_agent`|`wait_agent`|`followup_task`/)
  doesNotMatch(routing, /Orca|ORCA/)
  match(read("agent-home/skills/code/SKILL.md"), /active wrapper through `super-agent`/)
  match(read("agent-home/skills/super-agent/references/swarm.md"), /## Isolated tasks/)
  doesNotMatch(routing, /Codex owns all subagent orchestration/)

  match(swarm, /other available harnesses/)
  match(review, /Launch or resume exactly one coordinator through `super-agent`/)
  match(multiReview, /When the user requests five/)
  match(read("agent-home/skills/code/SKILL.md"), /through `super-agent`/)
  match(read("agent-home/skills/cleanup/SKILL.md"), /through `super-agent`/)
  match(read("agent-home/skills/git/SKILL.md"), /through `super-agent`/)
  match(read("agent-home/skills/skill-creator/SKILL.md"), /move the whole pair/)
  strictEqual(swarmEvals.evals.length, 9)
  match(JSON.stringify(swarmEvals), /quota-exhausted/)
  match(JSON.stringify(swarmEvals), /catalog tier/)
  match(JSON.stringify(swarmEvals), /local-search protection/)
  match(JSON.stringify(swarmEvals), /closed allowlist/)
  match(read("codex/agents/review-worker.toml"), /available harnesses/)
  match(read("codex/agents/review-worker.toml"), /pin an exact model from the cheap-model\s+catalog/)

  for (const path of [
    "agent-home/skills/super-agent/SKILL.md",
    "agent-home/skills/super-agent/references/swarm.md",
    "agent-home/skills/review/SKILL.md",
    "agent-home/skills/multi-agent-review/SKILL.md",
  ]) {
    doesNotMatch(read(path), /Do not substitute workmux|exact Sol model has no fallback|Orca is the required lifecycle/)
  }
})

test("cleanup and review quality gates keep external evidence opt-in and read-only", () => {
  const cleanup = read("agent-home/skills/cleanup/SKILL.md")
  const cleanupMetadata = read("agent-home/skills/cleanup/agents/openai.yaml")
  const cleanupWorker = read("codex/agents/cleanup-worker.toml")
  const cleanupEvals = JSON.parse(read("agent-home/skills/cleanup/evals/evals.json"))
  const review = read("agent-home/skills/review/SKILL.md")
  const reviewWorker = read("codex/agents/review-worker.toml")
  const bootstrapPi = read("bootstrap_pi.sh")

  match(cleanup, /explicit `\$cleanup` invocation/)
  match(cleanup, /findings only|findings-only/i)
  match(cleanup, /complete Git status/i)
  match(cleanup, /task-owned.*diff/i)
  match(cleanup, /production and tests/i)
  match(cleanup, /reviewer-arch/)
  match(cleanup, /reviewer-reasoning/)
  match(cleanup, /at most two/)
  match(cleanup, /Slopo mode: enabled/)
  match(cleanup, /Slopo mode: disabled/)
  match(cleanup, /slopo\.conf\.yaml.*does not exist.*\["slopo", "init"\]/s)
  for (const command of ["show-config", "index", "embed", "analyze"]) match(cleanup, new RegExp(`\\["slopo", "${command}"\\]`))
  match(cleanup, /only expected\s+worktree mutation/i)
  match(cleanup, /unexpected mutation/i)
  match(cleanup, /Lean already\. No cleanup findings\./)
  doesNotMatch(cleanup, /diff-size targets|review is stale|run the relevant verification/i)
  match(cleanupMetadata, /read-only deslop findings audit/i)
  match(cleanupWorker, /Never edit, write, delete, stage, commit,\s*push, publish/i)
  match(cleanupWorker, /test changes/i)
  match(cleanupWorker, /reviewer-arch/)
  match(cleanupWorker, /reviewer-reasoning/)
  match(cleanupWorker, /at most\s+two/)
  match(cleanupWorker, /Slopo mode: enabled.*Slopo mode: disabled/s)
  match(cleanupWorker, /slopo\.conf\.yaml.*absent.*\["slopo", "init"\]/s)
  for (const command of ["show-config", "index", "embed", "analyze"]) match(cleanupWorker, new RegExp(`\\["slopo", "${command}"\\]`))
  match(cleanupWorker, /only expected worktree mutation/i)
  match(cleanupWorker, /command-not-found|unsafe.*configuration|unreadable output/i)
  match(cleanupWorker, /unexpected worktree mutation/i)

  strictEqual(cleanupEvals.skill_name, "cleanup")
  strictEqual(cleanupEvals.evals.length, 3)
  match(JSON.stringify(cleanupEvals), /wrapper|overengineered|redundant/i)
  match(JSON.stringify(cleanupEvals), /duplicat|low-value|trust-boundary/i)
  match(JSON.stringify(cleanupEvals), /already lean|Lean already/i)

  match(review, /`\$review --ocr`/)
  match(review, /OCR mode: enabled/)
  match(review, /OCR mode: disabled/)
  match(review, /consume the flag/i)
  match(review, /workspace-diff flow/i)
  match(review, /OCR mode: enabled.*must resolve.*ocr-opencode-go/s)
  match(review, /ocr-opencode-go.*review.*--audience.*agent.*--background/s)
  match(review, /uses Pi only as a fallback credential store|without using the Pi harness/i)
  match(review, /untrusted evidence/i)
  match(review, /deduplicate/i)
  match(review, /does not block\s+the native\s+verdict/i)
  match(reviewWorker, /OCR mode: enabled.*OCR mode: disabled/s)
  match(reviewWorker, /ocr-opencode-go.*review.*--audience.*agent.*--background/s)
  match(reviewWorker, /not\s+as an agent harness/i)
  match(reviewWorker, /Verify every retained claim.*source/s)
  match(reviewWorker, /deduplicate OCR findings against native findings/s)
  match(reviewWorker, /never blocks the native verdict/)
  match(bootstrapPi, /"cleanup-worker": \["core", "cleanup", "super-agent"\]/)
  match(bootstrapPi, /\*\(\["allowNestedSubagents: true"\] if name in \{"cleanup-worker", "review-worker"\} else \[\]\),/)
})

test("OCR OpenCode Go helper resolves Pi credentials and provider settings", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "ocr-opencode-go-test-"))
  const bin = join(temporary, "bin")
  mkdirSync(bin)
  t.after(() => rmSync(temporary, { recursive: true, force: true }))

  const pi = join(bin, "pi")
  const ocr = join(bin, "ocr")
  writeFileSync(pi, `#!/usr/bin/env bash
[[ "$*" == "auth print-api-key --provider opencode-go" ]] || exit 20
printf 'test-token\\n'
`)
  writeFileSync(ocr, `#!/usr/bin/env bash
[[ "$OCR_LLM_TOKEN" == "test-token" ]] || exit 21
[[ "$OCR_LLM_URL" == "https://opencode.ai/zen/go/v1/chat/completions" ]] || exit 22
[[ "$OCR_LLM_MODEL" == "deepseek-v4-flash" ]] || exit 23
[[ "$OCR_LLM_PROTOCOL" == "openai" ]] || exit 24
[[ "$OCR_USE_ANTHROPIC" == "false" ]] || exit 25
[[ "$OCR_LLM_EXTRA_HEADERS" == x-opencode-session=ocr-* ]] || exit 26
[[ "$*" == "review --audience agent --background goal" ]] || exit 27
printf 'ok\\n'
`)
  chmodSync(pi, 0o700)
  chmodSync(ocr, 0o700)

  const result = spawnSync(
    join(root, "agent-home/skills/review/scripts/ocr-opencode-go"),
    ["review", "--audience", "agent", "--background", "goal"],
    {
      encoding: "utf8",
      env: {
        HOME: temporary,
        PATH: `${bin}:/usr/bin:/bin`,
      },
    },
  )
  strictEqual(result.status, 0, result.stderr)
  strictEqual(result.stdout, "ok\n")
})
