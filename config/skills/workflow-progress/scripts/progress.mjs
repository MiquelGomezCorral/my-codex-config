import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { getIcon } from "../../workflow/scripts/icons.mjs"
import {
  buildMapViewer, defaultMapPath, inspectMap, mapConfigurationForStandalone, mapConfigurationFromState,
  readMapConfiguration, rebuildMap, renderMapError, safeJson, validateMapConfiguration, validateMapInfo,
  writeMapViewer,
} from "./map.mjs"
import {
  repeatedStepIds, stages, statuses, stepById,
} from "./stages.mjs"

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const template = readFileSync(resolve(scriptDirectory, "../templates/progress.html"), "utf8")
const referenceImage = readFileSync(resolve(scriptDirectory, "../assets/Whole-Flow.png")).toString("base64")
const usage = `usage:
  node progress.mjs init --run <id> [--repository <path>] [--planning-mode brief|full] [--map <configuration.json>]
  node progress.mjs list-steps
  node progress.mjs update --run <id> [status flags] [metadata flags] [--map <configuration.json>] [--map-info <run-info.json>]
  node progress.mjs render --run <id> [--output <html-file>]
  node progress.mjs serve --run <id> [--port <port>]
  node progress.mjs rebuild-map --map <configuration.json> --drawio <executable>
  node progress.mjs inspect-map --map <configuration.json> --output <inspection.html>

status flags: --active|--done|--upcoming|--waiting|--blocked|--skipped <step-id>, --reopen <step-id>
metadata flags: --current <text>, --slice-context <text>, --next <text>, --note <text>,
                --new-slice <id>, --set <field=value>, --append <field=value>,
                --resolve-slice-blocker <text>, --resolve-unresolved-blocker <text>
map flags: --map <configuration.json> adopts a revised manifest, --map-info <run-info.json>`
const statusFlags = new Map([
  ["--active", "active"], ["--done", "done"], ["--upcoming", "upcoming"],
  ["--waiting", "waiting"], ["--blocked", "blocked"], ["--skipped", "skipped"],
  ["--reopen", "upcoming"],
])
const scalarTargets = {
  repository: (state) => [state.run, "repository"],
  "current-stage": (state) => [state.run, "currentStage"],
  "planning-mode": (state) => [state.run, "planningMode"],
  "last-gate": (state) => [state.run, "lastCompletedGate"],
  "next-action": (state) => [state.run, "nextAction"],
  "human-decision": (state) => [state.run, "humanDecisionPending"],
  "wave-plan": (state) => [state.run, "wavePlan"],
  "wave-approval-state": (state) => [state.run.waveApproval, "state"],
  "wave-approval-reference": (state) => [state.run.waveApproval, "reference"],
  "wave-approval-bounds": (state) => [state.run.waveApproval, "approvedBounds"],
  scope: (state) => [state.run, "scopeAndExclusions"],
  activity: (state) => [state.activity, "explanation"],
  "slice-context": (state) => [state.activity, "sliceContext"],
  "activity-next": (state) => [state.activity, "nextAction"],
  "slice.base-revision": (state) => [currentSlice(state), "baseRevision"],
  "slice.worktree": (state) => [currentSlice(state), "worktree"],
  "slice.checkpoint-hash": (state) => [currentSlice(state), "checkpointHash"],
  "slice.final-commit-hash": (state) => [currentSlice(state), "finalCommitHash"],
  "slice.state": (state) => [currentSlice(state), "state"],
  "slice.pr-and-target": (state) => [currentSlice(state).delivery, "prAndTarget"],
  "slice.ci-and-review": (state) => [currentSlice(state).delivery, "ciAndReview"],
  "slice.human-presentation": (state) => [currentSlice(state).delivery, "humanPresentation"],
  "slice.completion": (state) => [currentSlice(state).delivery, "completion"],
}
const appendTargets = {
  "planning-evidence": (state) => state.run.planningEvidenceAndArtifacts,
  "approved-amendment": (state) => state.run.approvedAmendments,
  approval: (state) => state.approvals,
  "slice.depends-on": (state) => currentSlice(state).dependsOn,
  "slice.checks-review": (state) => currentSlice(state).checksReviews,
  "slice.evidence": (state) => currentSlice(state).evidence,
  "slice.approval": (state) => currentSlice(state).approvals,
  "slice.blocker": (state) => currentSlice(state).blockers,
  "slice.recovery": (state) => currentSlice(state).recovery,
  "slice.shipping-action": (state) => currentSlice(state).delivery.namedShippingActions,
  "evidence.link": (state) => state.evidence.links,
  "evidence.deferred-finding": (state) => state.evidence.deferredFindings,
  "evidence.unresolved-blocker": (state) => state.evidence.unresolvedBlockers,
  "evidence.lesson": (state) => state.evidence.lessons,
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character])
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function parseOptions(args) {
  const options = new Map()
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index]
    if (!name.startsWith("--")) throw new Error(`unexpected argument: ${name}`)
    const value = args[index + 1]
    if (value === undefined) throw new Error(`${name} requires a value`)
    const values = options.get(name) ?? []
    values.push(value)
    options.set(name, values)
    index += 1
  }
  return options
}

function validateOptions(options, allowed, repeatable = new Set()) {
  for (const [name, values] of options) {
    if (!allowed.has(name)) throw new Error(`unknown option: ${name}`)
    if (values.length > 1 && !repeatable.has(name)) throw new Error(`${name} may only be used once`)
  }
}

function one(options, name, fallback = undefined) {
  const values = options.get(name)
  return values ? values[0] : fallback
}

function many(options, name) {
  return options.get(name) ?? []
}

function requireRunId(value) {
  if (!value || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value) || value === "." || value === "..") {
    throw new Error("--run must be a 1–64 character ID using letters, numbers, dot, underscore, or hyphen")
  }
  return value
}

function statePath(runId) {
  const stateHome = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state")
  return join(resolve(stateHome), "agentic-workflow", requireRunId(runId), "progress.json")
}

function currentSlice(state) {
  const slice = state.slices.find((entry) => entry.id === state.run.currentSliceId)
  if (!slice) throw new Error("no current slice; start one with --new-slice <id>")
  return slice
}

function makeSlice(id, options) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id) || id === "." || id === "..") {
    throw new Error("slice ID must use letters, numbers, dot, underscore, or hyphen")
  }
  return {
    id,
    dependsOn: many(options, "--depends-on"),
    baseRevision: one(options, "--base-revision", ""),
    worktree: one(options, "--worktree", ""),
    checkpointHash: "",
    finalCommitHash: "",
    checksReviews: [],
    state: "in progress",
    statuses: {},
    mapInfo: { steps: {} },
    evidence: [],
    approvals: [],
    blockers: [],
    recovery: [],
    delivery: {
      prAndTarget: "",
      ciAndReview: "",
      humanPresentation: "pending",
      namedShippingActions: [],
      completion: "partial",
    },
  }
}

function makeState(runId, repository, planningMode, map) {
  const stepStatuses = Object.fromEntries([...stepById.keys()].map((id) => [id, "upcoming"]))
  return {
    schemaVersion: 1,
    run: {
      id: runId,
      repository,
      currentStage: "Intake",
      planningMode,
      lastCompletedGate: "None recorded",
      nextAction: "Gather evidence for the first draft",
      humanDecisionPending: "None",
      currentSliceId: null,
      wavePlan: "Pending",
      waveApproval: { state: "pending", reference: "", approvedBounds: "" },
      planningEvidenceAndArtifacts: [],
      approvedAmendments: [],
      scopeAndExclusions: "",
      mapConfig: map.configuration,
      mapDirectory: map.directory,
      mapInfo: { nodes: {}, steps: {} },
    },
    statuses: stepStatuses,
    activity: {
      explanation: "Run initialized at intake.",
      sliceContext: "",
      nextAction: "Gather evidence for the first draft",
      updatedAt: new Date().toISOString(),
    },
    notes: [],
    approvals: [],
    slices: [],
    evidence: { links: [], deferredFindings: [], unresolvedBlockers: [], lessons: [] },
  }
}

function validateState(state, runId) {
  if (!isRecord(state) || state.schemaVersion !== 1 || !isRecord(state.run) || state.run.id !== runId) {
    throw new Error("progress file has an unsupported shape or run ID")
  }
  if (!isRecord(state.statuses) || !Array.isArray(state.notes) || !Array.isArray(state.slices)) {
    throw new Error("progress file is missing status, note, or slice data")
  }
  for (const [id, status] of Object.entries(state.statuses)) {
    if (!stepById.has(id) || !statuses.includes(status)) throw new Error(`progress file has an invalid status for ${id}`)
  }
  for (const id of stepById.keys()) {
    if (!statuses.includes(state.statuses[id])) throw new Error(`progress file is missing status for ${id}`)
  }
  let configuration
  if (state.run.mapConfig !== undefined || state.run.mapDirectory !== undefined) {
    if (state.run.mapConfig === undefined || typeof state.run.mapDirectory !== "string" || !isAbsolute(state.run.mapDirectory)) {
      throw new Error("progress file has an incomplete map configuration")
    }
    configuration = validateMapConfiguration(state.run.mapConfig)
  } else {
    configuration = readMapConfiguration(defaultMapPath).configuration
  }
  const runMapInfo = state.run.mapInfo === undefined ? {} : state.run.mapInfo
  validateMapInfo(runMapInfo, configuration)
  for (const step of Object.keys(runMapInfo.steps ?? {})) {
    if (stepById.get(step).repeated) throw new Error(`run map info cannot override delivery step ${step}`)
  }
  for (const slice of state.slices) {
    if (!isRecord(slice)) throw new Error("progress file has an invalid slice record")
    if (slice.mapInfo === undefined) continue
    if (!isRecord(slice.mapInfo) || Object.keys(slice.mapInfo).some((key) => key !== "steps")) {
      throw new Error(`slice ${slice.id} has invalid map info`)
    }
    const sliceSteps = slice.mapInfo.steps === undefined ? {} : slice.mapInfo.steps
    validateMapInfo({ steps: sliceSteps }, configuration)
    for (const step of Object.keys(sliceSteps)) {
      if (!stepById.get(step).repeated) throw new Error(`slice ${slice.id} cannot override planning step ${step}`)
    }
  }
  if (!state.run.currentSliceId && state.slices.length) throw new Error("progress file has slices but no current slice")
  if (state.run.currentSliceId && !state.slices.some((slice) => slice.id === state.run.currentSliceId)) {
    throw new Error("progress file points to a missing current slice")
  }
  return state
}

function loadState(runId) {
  const path = statePath(runId)
  let state
  try {
    state = JSON.parse(readFileSync(path, "utf8"))
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`run not initialized: ${path}`)
    if (error instanceof SyntaxError) throw new Error(`progress file is invalid JSON: ${path}`)
    throw error
  }
  return validateState(state, runId)
}

function atomicWrite(path, contents) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const temporary = join(dirname(path), `.progress-${process.pid}-${randomUUID()}.tmp`)
  try {
    writeFileSync(temporary, contents, { encoding: "utf8", flag: "wx", mode: 0o600 })
    renameSync(temporary, path)
  } catch (error) {
    rmSync(temporary, { force: true })
    throw error
  }
}

function saveState(state) {
  validateState(state, state.run.id)
  // ponytail: one coordinator writes each run; add locking if updates ever become concurrent.
  atomicWrite(statePath(state.run.id), `${JSON.stringify(state, null, 2)}\n`)
}

function parseAssignments(options) {
  const assignments = new Map()
  for (const [flag, status] of statusFlags) {
    for (const id of many(options, flag)) {
      if (!stepById.has(id)) throw new Error(`unknown step ID: ${id}`)
      const current = assignments.get(id)
      if (current && current !== status) throw new Error(`conflicting statuses for ${id}: ${current} and ${status}`)
      assignments.set(id, status)
    }
  }
  return assignments
}

function beginSlice(state, slice, options) {
  if (state.slices.some((entry) => entry.id === slice.id)) throw new Error(`slice already exists: ${slice.id}`)
  if (state.run.currentSliceId) {
    const previous = currentSlice(state)
    previous.statuses = Object.fromEntries(repeatedStepIds.map((stepId) => [stepId, state.statuses[stepId]]))
  }
  for (const stepId of repeatedStepIds) state.statuses[stepId] = "upcoming"
  state.slices.push(slice)
  state.run.currentSliceId = slice.id
  state.activity.sliceContext = one(options, "--slice-context", `Slice ${slice.id}`)
}

function splitFieldValue(value, flag) {
  const separator = value.indexOf("=")
  if (separator < 1) throw new Error(`${flag} must use field=value`)
  return [value.slice(0, separator), value.slice(separator + 1)]
}

function parseApproval(value, field) {
  let approval
  try {
    approval = JSON.parse(value)
  } catch {
    throw new Error(`${field} must contain a JSON approval object`)
  }
  if (!isRecord(approval) || ["action", "approvedBounds", "reference", "state"].some((key) => typeof approval[key] !== "string" || !approval[key].trim())) {
    throw new Error(`${field} needs non-empty action, approvedBounds, reference, and state strings`)
  }
  return {
    action: approval.action,
    approvedBounds: approval.approvedBounds,
    reference: approval.reference,
    state: approval.state,
  }
}

function applyMetadata(state, options) {
  for (const value of many(options, "--set")) {
    const [field, text] = splitFieldValue(value, "--set")
    const target = scalarTargets[field]
    if (!target) throw new Error(`unsupported metadata field: ${field}`)
    const [record, key] = target(state)
    record[key] = text
    if (field === "next-action") state.activity.nextAction = text
  }
  for (const value of many(options, "--append")) {
    const [field, text] = splitFieldValue(value, "--append")
    const target = appendTargets[field]
    if (!target) throw new Error(`unsupported append field: ${field}`)
    const list = target(state)
    list.push(field === "approval" || field === "slice.approval" ? parseApproval(text, field) : text)
  }
  const current = one(options, "--current")
  if (current !== undefined) state.activity.explanation = current
  const sliceContext = one(options, "--slice-context")
  if (sliceContext !== undefined) state.activity.sliceContext = sliceContext
  const next = one(options, "--next")
  if (next !== undefined) {
    state.activity.nextAction = next
    state.run.nextAction = next
  }
  const note = one(options, "--note")
  if (note !== undefined && state.notes.at(-1)?.text !== note) {
    state.notes.push({ text: note, sliceId: state.run.currentSliceId, updatedAt: new Date().toISOString() })
    state.notes = state.notes.slice(-5)
  }
  state.activity.updatedAt = new Date().toISOString()
}

function resolveBlockers(state, options) {
  const targets = [
    ["--resolve-slice-blocker", (current) => currentSlice(current).blockers],
    ["--resolve-unresolved-blocker", (current) => current.evidence.unresolvedBlockers],
  ]
  const removals = []
  for (const [flag, getList] of targets) {
    const names = many(options, flag)
    if (!names.length) continue
    const list = getList(state)
    for (const name of names) {
      if (!name.trim()) throw new Error(`${flag} requires non-empty blocker text`)
      if (!list.includes(name)) throw new Error(`blocker not found in ${flag}: ${name}`)
    }
    removals.push([list, new Set(names)])
  }
  for (const [list, names] of removals) {
    const remaining = list.filter((name) => !names.has(name))
    list.splice(0, list.length, ...remaining)
  }
}

function initialize(options) {
  validateOptions(options, new Set(["--run", "--repository", "--planning-mode", "--map"]))
  const runId = requireRunId(one(options, "--run"))
  const path = statePath(runId)
  if (existsSync(path)) throw new Error(`run already initialized: ${path}`)
  const planningMode = one(options, "--planning-mode", "full")
  if (planningMode !== "brief" && planningMode !== "full") throw new Error("--planning-mode must be brief or full")
  const map = readMapConfiguration(one(options, "--map", defaultMapPath))
  const state = makeState(runId, one(options, "--repository", process.cwd()), planningMode, map)
  saveState(state)
  console.log(path)
}

function readMapInfo(path, configuration) {
  const inputPath = resolve(path)
  let value
  try {
    value = JSON.parse(readFileSync(inputPath, "utf8"))
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`map info is invalid JSON: ${inputPath}`)
    throw new Error(`map info cannot be read: ${inputPath}`)
  }
  validateMapInfo(value, configuration)
  const run = { nodes: structuredClone(value.nodes ?? {}), steps: {} }
  const slice = { steps: {} }
  for (const [step, metadata] of Object.entries(value.steps ?? {})) {
    const target = stepById.get(step).repeated ? slice.steps : run.steps
    target[step] = structuredClone(metadata)
  }
  return { run, slice }
}

function applyMapInfo(state, update) {
  const current = state.run.mapInfo ?? {}
  current.nodes ??= {}
  current.steps ??= {}
  for (const [id, fields] of Object.entries(update.run.nodes)) {
    current.nodes[id] = { ...(current.nodes[id] ?? {}), ...fields }
  }
  for (const [id, fields] of Object.entries(update.run.steps)) {
    current.steps[id] = { ...(current.steps[id] ?? {}), ...fields }
  }
  state.run.mapInfo = current
  if (Object.keys(update.slice.steps).length) {
    const slice = currentSlice(state)
    slice.mapInfo ??= { steps: {} }
    for (const [id, fields] of Object.entries(update.slice.steps)) {
      slice.mapInfo.steps[id] = { ...(slice.mapInfo.steps[id] ?? {}), ...fields }
    }
  }
}

function validateSavedMapOverrides(state, configuration) {
  try {
    validateMapInfo(state.run.mapInfo ?? {}, configuration)
    for (const slice of state.slices) {
      if (slice.mapInfo !== undefined) validateMapInfo(slice.mapInfo, configuration)
    }
  } catch (error) {
    throw new Error(`saved map overrides are incompatible with the requested map: ${error.message}`)
  }
}

function listSteps() {
  for (const stage of stages) {
    for (const step of stage.steps) console.log(`${step.id}\t${stage.title}\t${step.title}`)
  }
}

function update(options) {
  const allowed = new Set([
    ...statusFlags.keys(), "--run", "--new-slice", "--depends-on", "--base-revision", "--worktree",
    "--current", "--slice-context", "--next", "--note", "--set", "--append",
    "--resolve-slice-blocker", "--resolve-unresolved-blocker", "--map", "--map-info",
  ])
  validateOptions(options, allowed, new Set([
    ...statusFlags.keys(), "--depends-on", "--set", "--append",
    "--resolve-slice-blocker", "--resolve-unresolved-blocker",
  ]))
  const assignments = parseAssignments(options)
  const runId = requireRunId(one(options, "--run"))
  const requestsNewSlice = options.has("--new-slice")
  const newSliceId = one(options, "--new-slice")
  if (requestsNewSlice && !newSliceId) throw new Error("--new-slice requires a non-empty slice ID")
  const newSlice = requestsNewSlice ? makeSlice(newSliceId, options) : null
  if (!requestsNewSlice && ["--depends-on", "--base-revision", "--worktree"].some((name) => options.has(name))) {
    throw new Error("--depends-on, --base-revision, and --worktree require --new-slice")
  }
  const original = loadState(runId)
  const mapConfigurationUpdate = options.has("--map") ? readMapConfiguration(one(options, "--map")) : null
  if (mapConfigurationUpdate) validateSavedMapOverrides(original, mapConfigurationUpdate.configuration)
  const mapConfiguration = mapConfigurationUpdate?.configuration ?? mapConfigurationFromState(original).configuration
  const mapInfoUpdate = options.has("--map-info")
    ? readMapInfo(one(options, "--map-info"), mapConfiguration)
    : null
  if (mapInfoUpdate && Object.keys(mapInfoUpdate.slice.steps).length && !original.run.currentSliceId && !newSlice) {
    throw new Error("delivery-step map info requires a current slice")
  }
  const state = structuredClone(original)
  if (mapConfigurationUpdate) {
    state.run.mapConfig = mapConfigurationUpdate.configuration
    state.run.mapDirectory = mapConfigurationUpdate.directory
  }
  if (newSlice) beginSlice(state, newSlice, options)
  if (mapInfoUpdate) applyMapInfo(state, mapInfoUpdate)
  for (const [id, status] of assignments) state.statuses[id] = status
  applyMetadata(state, options)
  resolveBlockers(state, options)
  saveState(state)
  console.log(statePath(runId))
}

function empty(value) {
  return value ? escapeHtml(value) : '<span class="empty">Not recorded</span>'
}

function renderList(items) {
  if (!items?.length) return '<p class="empty">None recorded.</p>'
  return `<ul class="plain-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
}

function icon(name) {
  const svg = getIcon(name)
  return svg ? svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ') : ""
}

function renderStep(step, state, stageLetter, stepNumber) {
  const status = state.statuses[step.id]
  const symbol = status === "done"
    ? icon("circle-check")
    : status === "blocked"
      ? icon("triangle-alert")
      : `<span aria-hidden="true">${status === "active" ? "●" : "·"}</span>`
  return `<li class="step-row" data-step-id="${escapeHtml(step.id)}" data-status="${status}"><span class="step-name">${stageLetter}${stepNumber} · ${escapeHtml(step.title)}</span><span class="status status-${status}"><span class="status-symbol">${symbol}</span><span>${status[0].toUpperCase()}${status.slice(1)}</span></span></li>`
}

function renderProgress(state) {
  const latestNote = state.notes.at(-1)
  const olderNotes = state.notes.slice(0, -1).reverse()
  const activeSlice = state.slices.find((slice) => slice.id === state.run.currentSliceId)
  const activeStages = stages
    .filter((stage) => stage.steps.some((step) => ["active", "waiting", "blocked"].includes(state.statuses[step.id])))
    .map((stage) => escapeHtml(stage.title))
  const currentStages = activeStages.length ? activeStages.join(" · ") : '<span class="empty">None active.</span>'
  const stageCards = stages.map((stage, stageIndex) => {
    const stageLetter = String.fromCharCode(65 + stageIndex)
    return `
    <section class="stage" aria-label="${stageLetter} ${escapeHtml(stage.title)}">
      <h3 class="stage-title"><span class="stage-icon">${icon("workflow")}</span>${stageLetter} · ${escapeHtml(stage.title)}</h3>
      <ul class="step-list">${stage.steps.map((step, stepIndex) => renderStep(step, state, stageLetter, stepIndex + 1)).join("")}</ul>
    </section>`
  }).join("")
  const approvalRows = [
    ...state.approvals.map((approval) => `<li><strong>${escapeHtml(approval.action)}</strong><br>Bounds: ${escapeHtml(approval.approvedBounds)}<br>Reference: ${escapeHtml(approval.reference)}<br>State: ${escapeHtml(approval.state)}</li>`),
    ...(activeSlice?.approvals ?? []).map((approval) => `<li><strong>${escapeHtml(approval.action)}</strong><br>Bounds: ${escapeHtml(approval.approvedBounds)}<br>Reference: ${escapeHtml(approval.reference)}<br>State: ${escapeHtml(approval.state)} <span class="muted">(${escapeHtml(activeSlice.id)})</span></li>`),
  ]
  const sliceRecords = state.slices.map((slice) => `
    <article class="slice-card">
      <h4>${escapeHtml(slice.id)}${slice.id === state.run.currentSliceId ? " · current" : ""}</h4>
      <div class="slice-meta">
        <p><span class="field-label">Depends on</span><br>${empty(slice.dependsOn.join(", "))}</p>
        <p><span class="field-label">Base revision</span><br>${empty(slice.baseRevision)}</p>
        <p><span class="field-label">Worktree</span><br>${empty(slice.worktree)}</p>
        <p><span class="field-label">Checkpoint</span><br>${empty(slice.checkpointHash)}</p>
        <p><span class="field-label">Final commit</span><br>${empty(slice.finalCommitHash)}</p>
        <p><span class="field-label">State</span><br>${empty(slice.state)}</p>
      </div>
      <h4>Checks and reviews</h4>${renderList(slice.checksReviews)}
      <h4>Delivery-step history</h4>${renderList(Object.entries(slice.statuses).map(([stepId, status]) => `${stepId}: ${status}`))}
      <h4>Slice evidence</h4>${renderList(slice.evidence)}
      <h4>Approvals</h4>${renderList(slice.approvals.map((approval) => `${approval.action} · ${approval.approvedBounds} · ${approval.reference} · ${approval.state}`))}
      <h4>Blockers and recovery</h4>${renderList([...slice.blockers, ...slice.recovery])}
      <h4>Delivery</h4>
      <div class="slice-meta">
        <p><span class="field-label">PR and target</span><br>${empty(slice.delivery.prAndTarget)}</p>
        <p><span class="field-label">CI and review</span><br>${empty(slice.delivery.ciAndReview)}</p>
        <p><span class="field-label">Human presentation</span><br>${empty(slice.delivery.humanPresentation)}</p>
        <p><span class="field-label">Named shipping actions</span><br>${empty(slice.delivery.namedShippingActions.join(", "))}</p>
        <p><span class="field-label">Completion</span><br>${empty(slice.delivery.completion)}</p>
      </div>
    </article>`).join("")
  const updated = state.activity.updatedAt ? escapeHtml(state.activity.updatedAt) : "Not recorded"
  const mapState = {
    statuses: state.statuses,
    runInfo: state.run.mapInfo ?? { nodes: {}, steps: {} },
    sliceInfo: activeSlice?.mapInfo ?? { steps: {} },
  }
  return `<main id="progress-content">
    <section class="panel activity">
      <p class="eyebrow">${escapeHtml(state.run.id)} · ${escapeHtml(state.run.repository)}</p>
      <h2>Current activity</h2>
      <p class="field-value">${empty(state.activity.explanation)}</p>
      <div class="activity-grid">
        <div><p class="field-label">Slice context</p><p class="field-value">${empty(state.activity.sliceContext)}</p></div>
        <div><p class="field-label">Next action</p><p class="field-value">${empty(state.activity.nextAction)}</p></div>
        <div><p class="field-label">Current stages</p><p class="field-value">${currentStages}</p></div>
      </div>
      <p class="last-update">Last update: <time>${updated}</time></p>
    </section>
    <section aria-labelledby="progress-title">
      <div class="progress-heading"><h2 id="progress-title">Progress</h2><span class="muted">Numbers show reading order; loops and alternatives can return to earlier steps.</span></div>
      <div class="stage-grid">${stageCards}</div>
    </section>
    <section class="panel notes">
      <h2>Living notes</h2>
      ${latestNote
        ? `<article class="note-card"><p class="note-meta muted">${escapeHtml(latestNote.updatedAt)}${latestNote.sliceId ? ` · ${escapeHtml(latestNote.sliceId)}` : ""}</p><div>${escapeHtml(latestNote.text)}</div></article>`
        : '<p class="empty">No notes recorded.</p>'}
      ${olderNotes.length
        ? `<details data-panel="note-history"><summary>Previous versions (${olderNotes.length})</summary>${olderNotes.map((note) => `<article class="note-card"><p class="note-meta muted">${escapeHtml(note.updatedAt)}${note.sliceId ? ` · ${escapeHtml(note.sliceId)}` : ""}</p><div>${escapeHtml(note.text)}</div></article>`).join("")}</details>`
        : ""}
    </section>
    <section class="panel supporting">
      <details data-panel="supporting"><summary>Supporting details</summary>
        <div class="detail-grid">
          <section><h3>Plan and scope</h3>
            <p><span class="field-label">Wave plan</span><br>${empty(state.run.wavePlan)}</p>
            <p><span class="field-label">Wave approval</span><br>${escapeHtml(state.run.waveApproval.state)}${state.run.waveApproval.reference ? ` · ${escapeHtml(state.run.waveApproval.reference)}` : ""}${state.run.waveApproval.approvedBounds ? ` · ${escapeHtml(state.run.waveApproval.approvedBounds)}` : ""}</p>
            <p><span class="field-label">Recorded current stage</span><br>${empty(state.run.currentStage)}</p>
            <p><span class="field-label">Last completed gate</span><br>${empty(state.run.lastCompletedGate)}</p>
            <p><span class="field-label">Human decision pending</span><br>${empty(state.run.humanDecisionPending)}</p>
            <p><span class="field-label">Scope and exclusions</span><br>${empty(state.run.scopeAndExclusions)}</p>
            <h3>Planning evidence and artifacts</h3>${renderList(state.run.planningEvidenceAndArtifacts)}
            <h3>Approved amendments</h3>${renderList(state.run.approvedAmendments)}
          </section>
          <section><h3>Approval references</h3>${approvalRows.length ? `<ul class="plain-list">${approvalRows.join("")}</ul>` : '<p class="empty">None recorded.</p>'}
            <h3>Run evidence</h3>${renderList(state.evidence.links)}
            <h3>Deferred findings</h3>${renderList(state.evidence.deferredFindings)}
            <h3>Unresolved blockers</h3>${renderList(state.evidence.unresolvedBlockers)}
            <h3>Lessons</h3>${renderList(state.evidence.lessons)}
          </section>
        </div>
        <h3>Slice records</h3>${sliceRecords || '<p class="empty">No slices recorded.</p>'}
      </details>
    </section>
    <script id="workflow-map-state" type="application/json">${safeJson(mapState)}</script>
  </main>`
}

function renderDiagram() {
  return `<section class="panel diagram" aria-labelledby="diagram-title">
    <div class="diagram-heading"><div><h2 id="diagram-title">Workflow map</h2><p class="muted">Native map context follows active work. The checklist remains the status record.</p></div>
      <button type="button" id="workflow-map-return">Return to current work</button>
    </div>
    <p id="diagram-warning" class="diagram-warning" role="alert" aria-live="polite" hidden></p>
    <iframe id="workflow-map-frame" class="workflow-map-frame" src="workflow-map.html?theme=dark&amp;present=1" sandbox="allow-scripts" title="Interactive native workflow map"></iframe>
    <details data-panel="original-diagram"><summary>Original workflow diagram reference</summary>
      <img class="diagram-image" src="data:image/png;base64,${referenceImage}" alt="Original agentic workflow diagram">
    </details>
  </section>`
}

function renderPage(state) {
  return template.replace("{{DIAGRAM}}", () => renderDiagram()).replace("{{CONTENT}}", () => renderProgress(state))
}

function render(options) {
  validateOptions(options, new Set(["--run", "--output"]))
  const runId = requireRunId(one(options, "--run"))
  const state = loadState(runId)
  const output = resolve(one(options, "--output", join(dirname(statePath(runId)), "progress.html")))
  atomicWrite(output, renderPage(state))
  let mapWarning = ""
  try {
    const map = mapConfigurationForStandalone(state)
    writeMapViewer(join(dirname(output), "workflow-map.html"), map.configuration, map.directory)
  } catch (error) {
    mapWarning = error.message
    atomicWrite(join(dirname(output), "workflow-map.html"), renderMapError(error))
  }
  console.log(output)
  if (mapWarning) console.error(`warning: native map could not be built: ${mapWarning}`)
}

function serve(options) {
  validateOptions(options, new Set(["--run", "--port"]))
  const runId = requireRunId(one(options, "--run"))
  const state = loadState(runId)
  const port = Number(one(options, "--port", "4173"))
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("--port must be an integer from 0 to 65535")
  const server = createServer((request, response) => {
    if (request.method !== "GET") {
      response.writeHead(405, { "content-type": "text/plain; charset=utf-8", allow: "GET" }).end("Method not allowed")
      return
    }
    const pathname = new URL(request.url, "http://127.0.0.1").pathname
    if (pathname !== "/" && pathname !== "/content" && pathname !== "/workflow-map.html") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found")
      return
    }
    try {
      const latest = loadState(runId)
      let body
      if (pathname === "/content") body = renderProgress(latest)
      else if (pathname === "/workflow-map.html") {
        try {
          const map = mapConfigurationFromState(latest)
          body = buildMapViewer(map.configuration, map.directory)
        } catch (error) {
          body = renderMapError(error)
        }
      } else body = renderPage(latest)
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-security-policy": `default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src ${pathname === "/workflow-map.html" ? "data: blob:" : "data:"}; font-src data:; frame-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'`,
        "content-type": "text/html; charset=utf-8",
        "x-content-type-options": "nosniff",
      }).end(body)
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" })
        .end(`Progress refresh failed: ${error.message}`)
    }
  })
  server.on("error", (error) => {
    console.error(`serve failed: ${error.message}`)
    process.exitCode = 1
  })
  server.listen(port, "127.0.0.1", () => {
    console.log(`http://127.0.0.1:${server.address().port}/`)
  })
}

function main() {
  const [, , command, ...args] = process.argv
  if (!command || command === "--help" || command === "-h") {
    console.log(usage)
    return
  }
  const options = parseOptions(args)
  if (command === "init") initialize(options)
  else if (command === "list-steps") {
    validateOptions(options, new Set())
    listSteps()
  } else if (command === "update") update(options)
  else if (command === "render") render(options)
  else if (command === "serve") serve(options)
  else if (command === "rebuild-map") {
    validateOptions(options, new Set(["--map", "--drawio"]))
    rebuildMap(one(options, "--map"), one(options, "--drawio"))
  } else if (command === "inspect-map") {
    validateOptions(options, new Set(["--map", "--output"]))
    inspectMap(one(options, "--map"), one(options, "--output"))
  }
  else throw new Error(`unknown command: ${command}\n${usage}`)
}

try {
  main()
} catch (error) {
  console.error(`error: ${error.message}`)
  process.exitCode = 1
}
