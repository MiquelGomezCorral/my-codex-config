import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { setTimeout as delay } from "node:timers/promises"
import { stages } from "./stages.mjs"

const skillDirectory = dirname(fileURLToPath(import.meta.url))
const progressScript = resolve(skillDirectory, "progress.mjs")
const usage = "usage: node scripts/demo.mjs --run workflow-demo-<id> [--interval-ms 3000]"

function optionsFrom(args) {
  const options = new Map()
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index]
    if (name !== "--run" && name !== "--interval-ms") throw new Error(`unknown option: ${name}\n${usage}`)
    const value = args[index + 1]
    if (!value || value.startsWith("--")) throw new Error(`${name} requires a value\n${usage}`)
    if (options.has(name)) throw new Error(`${name} may only be used once`)
    options.set(name, value)
    index += 1
  }
  return options
}

function runProgress(args) {
  const result = spawnSync(process.execPath, [progressScript, ...args], { cwd: process.cwd(), encoding: "utf8" })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr.trim() || `progress command failed: ${args[0]}`)
}

function progressRenderWorks(runId) {
  const result = spawnSync(process.execPath, [progressScript, "render", "--run", runId], { cwd: process.cwd(), stdio: "ignore" })
  return result.status === 0
}

async function main() {
  const options = optionsFrom(process.argv.slice(2))
  const runId = options.get("--run")
  if (!runId || !/^workflow-demo-[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/.test(runId)) {
    throw new Error(`--run must use the dedicated workflow-demo-<id> naming convention\n${usage}`)
  }
  const intervalMs = Number(options.get("--interval-ms") ?? 3000)
  if (!Number.isSafeInteger(intervalMs) || intervalMs <= 0) throw new Error("--interval-ms must be a positive integer")

  if (!progressRenderWorks(runId)) runProgress(["init", "--run", runId, "--repository", "Workflow demo"])
  const steps = stages.flatMap((stage) => stage.steps.map((step) => ({ ...step, stage: stage.title })))
  const [first, ...rest] = steps
  runProgress([
    "update", "--run", runId,
    ...rest.flatMap((step) => ["--reopen", step.id]),
    "--active", first.id,
    "--current", `Demo: ${first.title}`,
    "--set", `current-stage=${first.stage}`,
    "--next", `Demo: ${rest[0].title}`,
    "--note", "Demo replay: simulated statuses only; no work, approvals, or Git actions occur.",
  ])

  for (let index = 1; index < steps.length; index += 1) {
    await delay(intervalMs)
    const previous = steps[index - 1]
    const current = steps[index]
    const next = steps[index + 1]
    runProgress([
      "update", "--run", runId,
      "--done", previous.id,
      "--active", current.id,
      "--current", `Demo: ${current.title}`,
      "--set", `current-stage=${current.stage}`,
      "--next", next ? `Demo: ${next.title}` : "Finish the demonstration",
      "--note", `Demo replay: simulated ${current.title}; no work, approvals, or Git actions occur.`,
    ])
  }
  await delay(intervalMs)
  runProgress([
    "update", "--run", runId,
    "--done", steps.at(-1).id,
    "--current", "Demo complete",
    "--next", "Step-by-step display walkthrough finished",
    "--note", "Demo replay complete; no work, approvals, or Git actions occurred.",
  ])
}

main().catch((error) => {
  console.error(`demo failed: ${error.message}`)
  process.exitCode = 1
})
