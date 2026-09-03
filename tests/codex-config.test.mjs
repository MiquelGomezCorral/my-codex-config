import { test } from "node:test"
import { doesNotMatch, match, ok, strictEqual } from "node:assert"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs"
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
    "core", "subagent-routing", "ponytail", "cleanup", "review", "code", "commit",
    "review-findings", "index", "init", "plan-implementation", "review-plan",
    "review-pr-comments", "bro",
  ]) ok(names.includes(required), `missing skill: ${required}`)
  ok(!names.includes("task-model-recovery"))
  ok(!names.includes("opencode-go-worker"))
  ok(!names.includes("customize-opencode"))
  ok(!statSync(join(root, "config/skills"), { throwIfNoEntry: false }))
})

test("Codex TOML agents use native fields and preserve all nine roles", () => {
  const names = [
    "coder", "cleanup-worker", "commit-worker", "automation-runner", "review-worker",
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
    match(body, /^sandbox_mode = "(?:read-only|workspace-write)"$/m)
    ok(body.includes("developer_instructions"))
  }
  ok(config.includes("[mcp_servers.codegraph]"))
  ok(config.includes('command = "codegraph"'))
  match(config, /^model = "gpt-5\.6-sol"$/m)
  match(config, /^web_search = "live"$/m)
  doesNotMatch(config, /\[mcp_servers\.(?:playwright|searxng)\]/)
  doesNotMatch(config, /\/Users\/|\/Applications\//)
})

test("Codex hooks and configuration contain no discarded worker boundary", () => {
  const hooks = JSON.parse(read("codex/hooks.json"))
  const hookText = JSON.stringify(hooks)
  ok(hookText.includes("ponytail-hook.mjs"))
  ok(hookText.includes("workmux"))
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
    doesNotMatch(read(path), /opencode-go|opencode-worker|session-ownership|opencode run/i)
  }
})

test("repository excludes runtime and credential-shaped files", () => {
  const output = spawnSync("bash", ["bootstrap.sh", "--check"], { cwd: root, encoding: "utf8" })
  strictEqual(output.status, 0, output.stderr)
  doesNotMatch(output.stdout, /auth|secret|token/i)
})

test("Ponytail defaults prefer valid environment, then config, then full", () => {
  const home = mkdtempSync(join(tmpdir(), "ponytail-default-"))
  const configDir = join(home, ".config", "ponytail")
  const configFile = join(configDir, "config.json")
  const stateFile = join(home, "state", "ponytail-active")
  const hook = join(root, "config/bin/ponytail-hook.mjs")

  const runHook = (environmentMode) => {
    const env = { ...process.env, HOME: home, PONYTAIL_STATE_FILE: stateFile }
    if (environmentMode === undefined) delete env.PONYTAIL_DEFAULT_MODE
    else env.PONYTAIL_DEFAULT_MODE = environmentMode
    const result = spawnSync("node", [hook, "session-start"], { cwd: root, encoding: "utf8", env })
    strictEqual(result.status, 0, result.stderr)
    return JSON.parse(result.stdout).systemMessage
  }

  try {
    mkdirSync(configDir, { recursive: true })
    writeFileSync(configFile, JSON.stringify({ defaultMode: "lite" }))
    strictEqual(runHook("invalid"), "PONYTAIL:LITE")
    strictEqual(runHook("ultra"), "PONYTAIL:ULTRA")

    writeFileSync(configFile, "not json")
    strictEqual(runHook("invalid"), "PONYTAIL:FULL")
    unlinkSync(configFile)
    strictEqual(runHook(undefined), "PONYTAIL:FULL")
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
