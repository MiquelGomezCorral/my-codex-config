import { spawnSync } from "node:child_process"
import { rmSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { setTimeout as delay } from "node:timers/promises"
import { stages } from "./stages.mjs"

const skillDirectory = dirname(fileURLToPath(import.meta.url))
const progressScript = resolve(skillDirectory, "progress.mjs")
const usage = "usage: node scripts/demo.mjs --run workflow-demo-<id> [--interval-ms 3000]"
const steps = stages.flatMap((stage) => stage.steps.map((step) => ({ ...step, stageId: stage.id, repeated: stage.repeated })))
const planningSteps = steps.filter((step) => !step.repeated && step.stageId !== "close-wave")
const deliverySteps = steps.filter((step) => step.repeated)
const closeSteps = steps.filter((step) => step.stageId === "close-wave")
const simulated = "simulated statuses only; no work, approvals, or Git actions occur."
const sampleApproval = JSON.stringify({
  action: "Demo shipping sample", approvedBounds: "Simulated replay only", reference: "Demo replay, not a real approval", state: "simulated",
})

// A lane walks its steps one per tick, and the last frame marks the final step done.
function laneFrames(laneSteps) {
  return [...laneSteps.map((_, index) => ({ index, status: "active" })), { index: laneSteps.length, status: "done" }]
}

// slice-1 finishes alone; slice-2 and slice-3 run in parallel at different stages until slice-2
// waits at feedback for slice-3, so both stand on the same step before the wave closes. Lane
// starts keep each tick to one --note.
const planningFrames = laneFrames(planningSteps)
const deliveryStart = planningFrames.length - 1
const feedbackIndex = deliverySteps.findIndex((step) => step.id === "human-validation.await-feedback")
const feedbackWait = ["blocked", "blocked", "waiting", "active"].map((status) => ({ index: feedbackIndex, status }))
const slices = [
  { id: "slice-1", context: "Summary table", start: deliveryStart, frames: laneFrames(deliverySteps) },
  {
    id: "slice-2", context: "Slice tabs", start: deliveryStart + 5,
    frames: laneFrames(deliverySteps).toSpliced(feedbackIndex + 1, 0, ...feedbackWait),
  },
  { id: "slice-3", context: "Demo replay", start: deliveryStart + 9, frames: laneFrames(deliverySteps) },
]
const close = { start: Math.max(...slices.map((lane) => lane.start + lane.frames.length)), frames: laneFrames(closeSteps) }

// Records for the "Needs your attention" panel. Each stays open at least two ticks so a page
// polling every few seconds sees it, and all close before the wave does, so the panel clears.
const loginItem = "login: Demo: sign in to the simulated staging account"
const runBlocker = "Demo: simulated plan input is missing"
const liveTestItem = "live-test: Demo: start the simulated staging environment"
const sliceBlocker = "Demo: simulated feedback has not arrived"
const approvalTick = planningSteps.findIndex((step) => step.id === "challenge-approve.approval")
const liveTestIndex = deliverySteps.findIndex((step) => step.id === "build-review.live-test")
const runAttention = [
  [1, ["--append", `attention=${loginItem}`]],
  [2, ["--append", `evidence.unresolved-blocker=${runBlocker}`]],
  [4, ["--resolve-attention", loginItem, "--resolve-unresolved-blocker", runBlocker]],
  [approvalTick, ["--set", "human-decision=Demo: approve the simulated wave plan"]],
  [approvalTick + 2, ["--set", "human-decision=None"]],
]

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
  return result.stdout
}

// progress.mjs owns where a run lives; main() only accepts workflow-demo-<id> run IDs.
function demoRunDirectory(runId) {
  const result = spawnSync(process.execPath, [progressScript, "path", "--run", runId], { cwd: process.cwd(), encoding: "utf8" })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr.trim() || "progress command failed: path")
  return dirname(result.stdout.trim())
}

function laneArgs(laneSteps, frame, [doneCurrent, doneNext]) {
  const step = laneSteps[frame.index]
  const next = laneSteps[frame.index + 1]
  const previous = frame.index > 0 ? ["--done", laneSteps[frame.index - 1].id] : []
  if (!step) return [...previous, "--current", doneCurrent, "--next", doneNext]
  const pause = frame.status === "active" ? "" : ` (${frame.status} on simulated feedback)`
  return [
    ...previous, `--${frame.status}`, step.id,
    "--current", `Demo: ${step.title}${pause}`, "--next", next ? `Demo: ${next.title}` : "Demo: finish",
  ]
}

function waveArgs(tick) {
  const planningFrame = planningFrames[tick]
  if (planningFrame) {
    return [
      ...laneArgs(planningSteps, planningFrame, ["Demo: three slices in delivery", "Demo: close the wave"]),
      ...(tick === 0 ? ["--note", `Demo replay: ${simulated}`] : []),
    ]
  }
  const closeFrame = close.frames[tick - close.start]
  if (!closeFrame) return []
  const finished = closeFrame.index === closeSteps.length
  return [
    ...laneArgs(closeSteps, closeFrame, ["Demo complete", "Step-by-step display walkthrough finished"]),
    ...(finished ? ["--note", "Demo replay complete; no work, approvals, or Git actions occurred."] : []),
  ]
}

function sliceArgs(lane, tick) {
  const position = tick - lane.start
  const frame = lane.frames[position]
  if (!frame) return []
  const args = [position === 0 ? "--new-slice" : "--slice", lane.id, ...laneArgs(deliverySteps, frame, ["Demo: slice complete", "None"])]
  const wasBlocked = position > 0 && lane.frames[position - 1].status === "blocked"
  if (position === 0) args.push("--slice-context", lane.context, "--note", `Demo replay: ${lane.id} started; ${simulated}`)
  else if (frame.status === "blocked" && !wasBlocked) {
    args.push("--note", `Demo replay: ${lane.id} is blocked on simulated feedback.`, "--append", `slice.blocker=${sliceBlocker}`)
  } else if (frame.status !== "blocked" && wasBlocked) args.push("--resolve-slice-blocker", sliceBlocker)
  if (lane.id === "slice-1" && deliverySteps[frame.index]?.id === "ship-monitor.commit-push-pr") {
    args.push("--append", `slice.approval=${sampleApproval}`)
  }
  if (lane.id === "slice-1" && frame.index === liveTestIndex) args.push("--append", `attention=${liveTestItem}`)
  if (lane.id === "slice-1" && frame.index === liveTestIndex + 2) args.push("--resolve-attention", liveTestItem)
  return args
}

async function main() {
  const options = optionsFrom(process.argv.slice(2))
  const runId = options.get("--run")
  if (!runId || !/^workflow-demo-[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/.test(runId)) {
    throw new Error(`--run must use the dedicated workflow-demo-<id> naming convention\n${usage}`)
  }
  const intervalMs = Number(options.get("--interval-ms") ?? 3000)
  if (!Number.isSafeInteger(intervalMs) || intervalMs <= 0) throw new Error("--interval-ms must be a positive integer")

  rmSync(demoRunDirectory(runId), { recursive: true, force: true })
  // init prints the record path, then the hub page address to open while the replay runs.
  console.log(runProgress(["init", "--run", runId, "--repository", "Workflow demo"]).trim().split("\n").at(-1))
  const lastTick = close.start + close.frames.length - 1
  for (let tick = 0; tick <= lastTick; tick += 1) {
    if (tick > 0) await delay(intervalMs)
    const attentionArgs = runAttention.filter(([at]) => at === tick).flatMap(([, args]) => args)
    runProgress(["update", "--run", runId, ...waveArgs(tick), ...attentionArgs, ...slices.flatMap((lane) => sliceArgs(lane, tick))])
  }
}

main().catch((error) => {
  console.error(`demo failed: ${error.message}`)
  process.exitCode = 1
})
