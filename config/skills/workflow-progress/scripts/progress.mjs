import { randomUUID } from "node:crypto"
import { execFileSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildMapViewer, defaultMapPath, inspectMap, mapConfigurationFromState,
  readMapConfiguration, rebuildMap, renderMapError, safeJson, validateMapConfiguration, validateMapInfo,
  writeMapViewer,
} from "./map.mjs"
import {
  deliveryStages, doneSliceChip, repeatedStepIds, stages, statuses, stepById, waveStages, waveStepIds,
} from "./stages.mjs"

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const template = readFileSync(resolve(scriptDirectory, "../templates/progress.html"), "utf8")
const referenceImage = readFileSync(resolve(scriptDirectory, "../assets/Whole-Flow.png")).toString("base64")
const usage = `usage:
  node progress.mjs init --run <id> [--repository <path>] [--planning-mode brief|full] [--map <configuration.json>]
  node progress.mjs list-steps
  node progress.mjs path --run <id>
  node progress.mjs migrate --run <id>
  node progress.mjs update --run <id> [flags] [--slice <id[,id...]>|--new-slice <id> [flags]]... [--map <configuration.json>]
  node progress.mjs render --run <id> [--output <html-file>]
  node progress.mjs serve --run <id> [--port <port 3100-3199>]
  node progress.mjs rebuild-map --map <configuration.json> --drawio <executable>
  node progress.mjs inspect-map --map <configuration.json> --output <inspection.html>

status flags: --active|--done|--upcoming|--waiting|--blocked|--skipped <step-id>, --reopen <step-id>
metadata flags: --current <text>, --slice-context <text>, --next <text>, --note <text>,
                --new-slice <id>, --set <field=value>, --append <field=value>,
                --resolve-slice-blocker <text>, --resolve-unresolved-blocker <text>,
                --resolve-attention <text>
slice groups: --slice <id[,id...]> or --new-slice <id> sends the flags after it (delivery statuses,
              activity, notes, slice.* fields, slice blockers, attention items, delivery map info) to those slices;
              before any group they go to the wave, and slice-only flags to the latest slice
              (rejected when the call adds a slice)
map flags: --map <configuration.json> adopts a revised manifest, --map-info <run-info.json>`
const statusFlags = new Map([
  ["--active", "active"], ["--done", "done"], ["--upcoming", "upcoming"],
  ["--waiting", "waiting"], ["--blocked", "blocked"], ["--skipped", "skipped"],
  ["--reopen", "upcoming"],
])
const runScalarTargets = {
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
  "slice-gates": (state) => [state.run, "sliceGates"],
}
const sliceGateModes = ["each-slice", "final-only"]
// Activity text by flag, --set field, and record key. It updates the wave before the first slice
// group and each grouped slice after it; slice context, like slice.* fields, always updates slices.
const activityTargets = [
  ["--current", "activity", "explanation"],
  ["--slice-context", "slice-context", "sliceContext"],
  ["--next", "activity-next", "nextAction"],
]
const sliceScalarTargets = {
  "slice.base-revision": (slice) => [slice, "baseRevision"],
  "slice.worktree": (slice) => [slice, "worktree"],
  "slice.checkpoint-hash": (slice) => [slice, "checkpointHash"],
  "slice.final-commit-hash": (slice) => [slice, "finalCommitHash"],
  "slice.state": (slice) => [slice, "state"],
  "slice.pr-and-target": (slice) => [slice.delivery, "prAndTarget"],
  "slice.ci-and-review": (slice) => [slice.delivery, "ciAndReview"],
  "slice.human-presentation": (slice) => [slice.delivery, "humanPresentation"],
  "slice.completion": (slice) => [slice.delivery, "completion"],
}
const runAppendTargets = {
  "planning-evidence": (state) => state.run.planningEvidenceAndArtifacts,
  "approved-amendment": (state) => state.run.approvedAmendments,
  approval: (state) => state.approvals,
  "evidence.link": (state) => state.evidence.links,
  "evidence.deferred-finding": (state) => state.evidence.deferredFindings,
  "evidence.unresolved-blocker": (state) => state.evidence.unresolvedBlockers,
  "evidence.lesson": (state) => state.evidence.lessons,
}
const sliceAppendTargets = {
  "slice.depends-on": (slice) => slice.dependsOn,
  "slice.checks-review": (slice) => slice.checksReviews,
  "slice.evidence": (slice) => slice.evidence,
  "slice.approval": (slice) => slice.approvals,
  "slice.blocker": (slice) => slice.blockers,
  "slice.recovery": (slice) => slice.recovery,
  "slice.shipping-action": (slice) => slice.delivery.namedShippingActions,
}
const workingStatuses = ["active", "waiting", "blocked"]
const attentionKinds = ["login", "permission", "live-test", "question", "other"]

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character])
}

// An http or https URL in free text becomes a link; every piece of the text is escaped.
function linkUrls(text) {
  return String(text).split(/(https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]])/g)
    .map((part, index) => index % 2
      ? `<a href="${escapeHtml(part)}" target="_blank" rel="noopener noreferrer">${escapeHtml(part)}</a>`
      : escapeHtml(part))
    .join("")
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function parsePairs(args) {
  const pairs = []
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index]
    if (!name.startsWith("--")) throw new Error(`unexpected argument: ${name}`)
    const value = args[index + 1]
    if (value === undefined) throw new Error(`${name} requires a value`)
    pairs.push([name, value])
  }
  return pairs
}

function optionsFromPairs(pairs) {
  const options = new Map()
  for (const [name, value] of pairs) options.set(name, [...(options.get(name) ?? []), value])
  return options
}

function parseSliceIds(value) {
  const ids = value.split(",").map((id) => id.trim())
  if (ids.some((id) => !id)) throw new Error("--slice requires comma-separated slice IDs")
  return [...new Set(ids)]
}

// Each --slice or --new-slice opens a group: the flags after it, up to the next group, update
// those slices. Flags before the first group update the wave; --run and --map are run-wide.
function parseSliceGroups(pairs) {
  const groups = [{ sliceIds: [], newSliceId: undefined, pairs: [] }]
  for (const [name, value] of pairs) {
    if (name === "--slice") groups.push({ sliceIds: parseSliceIds(value), newSliceId: undefined, pairs: [] })
    else if (name === "--new-slice") groups.push({ sliceIds: [value], newSliceId: value, pairs: [] })
    else if (name === "--run" || name === "--map") groups[0].pairs.push([name, value])
    else groups.at(-1).pairs.push([name, value])
  }
  return groups.map(({ pairs: groupPairs, ...group }) => ({ ...group, options: optionsFromPairs(groupPairs) }))
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

// Runs live in the private agent-memory of the Git repository they belong to, shared by its
// worktrees. `init` picks that repository from `--repository`; the working folder is only the
// fallback. Outside any repository they stay under the XDG state home.
function repositoryRunsOf(directory) {
  try {
    const gitCommonDirectory = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    return join(gitCommonDirectory, "agent-memory", "workflow-runs")
  } catch {
    return null
  }
}

function legacyRunDirectory(runId) {
  const stateHome = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state")
  return join(resolve(stateHome), "agentic-workflow", runId)
}

// `init` leaves this pointer to the run's repository beside the old location, so later commands
// find the run from any folder.
function pointerPath(runId) {
  return join(legacyRunDirectory(runId), "repository")
}

function pointedRuns(runId) {
  const path = pointerPath(runId)
  return existsSync(path) ? repositoryRunsOf(readFileSync(path, "utf8").trim()) : null
}

// A run is found in the current repository, then in the repository recorded at init, then in the
// old XDG location. Old runs stay loadable inside a repository but read-only until `migrate`
// copies them. A run that does not exist yet gets the recorded or current repository.
function locateRun(runId) {
  requireRunId(runId)
  const legacy = legacyRunDirectory(runId)
  const currentRuns = repositoryRunsOf(process.cwd())
  const pointed = pointedRuns(runId)
  for (const runs of [currentRuns, pointed]) {
    if (runs && existsSync(join(runs, runId, "progress.json"))) return { directory: join(runs, runId), readOnly: false }
  }
  if (existsSync(join(legacy, "progress.json"))) return { directory: legacy, readOnly: Boolean(currentRuns) }
  const runs = pointed ?? currentRuns
  return { directory: runs ? join(runs, runId) : legacy, readOnly: false }
}

function statePath(runId) {
  return join(locateRun(runId).directory, "progress.json")
}

function currentSlice(state) {
  const slice = state.slices.find((entry) => entry.id === state.run.currentSliceId)
  if (!slice) throw new Error("no current slice; start one with --new-slice <id>")
  return slice
}

function findSlice(state, id) {
  const slice = state.slices.find((entry) => entry.id === id)
  if (!slice) throw new Error(`unknown slice ID: ${id}`)
  return slice
}

function emptyActivity() {
  return { explanation: "", sliceContext: "", nextAction: "" }
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
    statuses: Object.fromEntries(repeatedStepIds.map((stepId) => [stepId, "upcoming"])),
    activity: emptyActivity(),
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
  const stepStatuses = Object.fromEntries(waveStepIds.map((id) => [id, "upcoming"]))
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
      nextAction: "Gather evidence for the first draft",
      updatedAt: new Date().toISOString(),
    },
    notes: [],
    attention: [],
    approvals: [],
    slices: [],
    evidence: { links: [], deferredFindings: [], unresolvedBlockers: [], lessons: [] },
  }
}

// Runs saved before slices kept their own delivery steps hold steps D-H and the slice context at
// top level. They move, with the run activity, into the current slice, or into a new slice-1
// when a run without slices already made delivery progress; with no such slice they are dropped.
// Close wave became wave-level, so slices drop its statuses and the current slice's Close wave
// map overrides move to run level. Other planning keys under a slice were already invalid; they
// stay for validation to reject.
function moveDeliveryIntoSlices(state) {
  const isCloseWaveStep = (id) => stepById.get(id)?.id === "close-wave"
  if (!isRecord(state?.run) || !isRecord(state.statuses) || !isRecord(state.activity) || !Array.isArray(state.slices)) return state
  if (!repeatedStepIds.some((id) => Object.hasOwn(state.statuses, id))) return state
  const delivery = {}
  for (const id of repeatedStepIds.filter((stepId) => Object.hasOwn(state.statuses, stepId))) {
    delivery[id] = state.statuses[id]
    delete state.statuses[id]
  }
  let receiver = state.slices.find((slice) => slice?.id === state.run.currentSliceId)
  if (!state.slices.length && Object.values(delivery).some((status) => status !== "upcoming")) {
    receiver = makeSlice("slice-1", new Map())
    state.slices.push(receiver)
    state.run.currentSliceId = receiver.id
  }
  for (const slice of state.slices.filter(isRecord)) {
    slice.activity ??= emptyActivity()
    for (const id of Object.keys(isRecord(slice.statuses) ? slice.statuses : {})) {
      if (isCloseWaveStep(id)) delete slice.statuses[id]
    }
    const overrides = isRecord(slice.mapInfo?.steps) ? slice.mapInfo.steps : {}
    for (const id of Object.keys(overrides).filter(isCloseWaveStep)) {
      if (slice === receiver) {
        state.run.mapInfo ??= { nodes: {}, steps: {} }
        state.run.mapInfo.steps ??= {}
        state.run.mapInfo.steps[id] = overrides[id]
      }
      delete overrides[id]
    }
  }
  if (receiver) {
    receiver.statuses = delivery
    receiver.activity = {
      explanation: state.activity.explanation,
      sliceContext: state.activity.sliceContext ?? "",
      nextAction: state.activity.nextAction,
    }
    state.activity.explanation = ""
    state.activity.nextAction = ""
  }
  delete state.activity.sliceContext
  return state
}

// Runs saved before a catalog step existed load it as upcoming in the wave or in every slice,
// except as skipped in a slice whose saved delivery steps are all done or skipped, so finished
// slices stay finished. Their map snapshot borrows that step's anchors from the installed map;
// validation still covers the result.
function addNewCatalogSteps(state) {
  if (!isRecord(state?.run) || !isRecord(state.statuses)) return state
  for (const id of waveStepIds) {
    if (state.statuses[id] === undefined) state.statuses[id] = "upcoming"
  }
  for (const slice of Array.isArray(state.slices) ? state.slices : []) {
    if (!isRecord(slice?.statuses)) continue
    const saved = repeatedStepIds.map((id) => slice.statuses[id]).filter((status) => status !== undefined)
    const finished = saved.length > 0 && saved.every((status) => status === "done" || status === "skipped")
    for (const id of repeatedStepIds) {
      if (slice.statuses[id] === undefined) slice.statuses[id] = finished ? "skipped" : "upcoming"
    }
  }
  const savedSteps = state.run.mapConfig?.steps
  if (!isRecord(savedSteps)) return state
  const missingSteps = [...stepById.keys()].filter((id) => savedSteps[id] === undefined)
  if (!missingSteps.length) return state
  const installedSteps = readMapConfiguration(defaultMapPath).configuration.steps
  for (const id of missingSteps) savedSteps[id] = installedSteps[id]
  return state
}

function isAttentionItem(item) {
  return isRecord(item) && typeof item.text === "string" && item.text.trim() !== ""
    && Array.isArray(item.sliceIds) && item.sliceIds.every((id) => typeof id === "string")
    && typeof item.createdAt === "string"
}

function validateState(state, runId) {
  if (!isRecord(state) || state.schemaVersion !== 1 || !isRecord(state.run) || state.run.id !== runId) {
    throw new Error("progress file has an unsupported shape or run ID")
  }
  if (!isRecord(state.statuses) || !Array.isArray(state.notes) || !Array.isArray(state.slices)) {
    throw new Error("progress file is missing status, note, or slice data")
  }
  if (!Array.isArray(state.attention) || !state.attention.every(isAttentionItem)) {
    throw new Error("progress file has an invalid attention item")
  }
  for (const [id, status] of Object.entries(state.statuses)) {
    if (stepById.get(id)?.repeated !== false || !statuses.includes(status)) throw new Error(`progress file has an invalid status for ${id}`)
  }
  for (const id of waveStepIds) {
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
    if (!isRecord(slice) || !isRecord(slice.statuses) || !isRecord(slice.activity)) {
      throw new Error("progress file has an invalid slice record")
    }
    for (const [id, status] of Object.entries(slice.statuses)) {
      if (!stepById.get(id)?.repeated || !statuses.includes(status)) throw new Error(`slice ${slice.id} has an invalid status for ${id}`)
    }
    for (const id of repeatedStepIds) {
      if (!statuses.includes(slice.statuses[id])) throw new Error(`slice ${slice.id} is missing status for ${id}`)
    }
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
  // Runs saved before attention items existed load with none.
  if (isRecord(state)) state.attention ??= []
  return validateState(addNewCatalogSteps(moveDeliveryIntoSlices(state)), runId)
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
  const { directory, readOnly } = locateRun(state.run.id)
  if (readOnly) {
    throw new Error(`run ${state.run.id} is read-only at ${directory}; copy it into the repository with: migrate --run ${state.run.id}`)
  }
  // shortcut: one coordinator writes each run; add locking if updates ever become concurrent.
  atomicWrite(statePath(state.run.id), `${JSON.stringify(state, null, 2)}\n`)
}

function parseAssignments(options) {
  const assignments = []
  for (const [flag, status] of statusFlags) {
    for (const id of many(options, flag)) {
      if (!stepById.has(id)) throw new Error(`unknown step ID: ${id}`)
      assignments.push([id, status])
    }
  }
  return assignments
}

function addSlice(state, slice) {
  if (state.slices.some((entry) => entry.id === slice.id)) throw new Error(`slice already exists: ${slice.id}`)
  state.slices.push(slice)
}

// A group without slice IDs targets the wave; its slice-only changes go to the most recently
// updated slice. In a call that adds a slice they reject: they read as meant for the new slice
// but would change the previous one.
function groupTarget(state, sliceIds, callAddsSlice) {
  if (!sliceIds.length) {
    const latestSlice = () => {
      if (callAddsSlice) {
        throw new Error("slice-only flags before --new-slice would change the previous slice; place them after --new-slice <id>, or after --slice <id> for an existing slice")
      }
      return [currentSlice(state)]
    }
    return { sliceIds, slices: latestSlice, activities: [state.activity] }
  }
  const slices = sliceIds.map((id) => findSlice(state, id))
  return { sliceIds, slices: () => slices, activities: slices.map((slice) => slice.activity) }
}

// `assigned` spans the whole update, so one call cannot give a step two different statuses.
function assignStatuses(state, assignments, target, assigned) {
  for (const [id, status] of assignments) {
    const records = stepById.get(id).repeated
      ? target.slices().map((slice) => [slice.id, slice.statuses])
      : [["", state.statuses]]
    for (const [owner, record] of records) {
      const previous = assigned.get(`${owner}/${id}`)
      if (previous && previous !== status) throw new Error(`conflicting statuses for ${id}: ${previous} and ${status}`)
      assigned.set(`${owner}/${id}`, status)
      record[id] = status
    }
  }
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

function scalarRecords(state, target, field) {
  if (Object.hasOwn(sliceScalarTargets, field)) return target.slices().map(sliceScalarTargets[field])
  const [, , activityKey] = activityTargets.find(([, setField]) => setField === field) ?? []
  if (activityKey) {
    const activities = activityKey === "sliceContext" ? target.slices().map((slice) => slice.activity) : target.activities
    return activities.map((activity) => [activity, activityKey])
  }
  if (Object.hasOwn(runScalarTargets, field)) return [runScalarTargets[field](state)]
  throw new Error(`unsupported metadata field: ${field}`)
}

function appendLists(state, target, field) {
  if (Object.hasOwn(sliceAppendTargets, field)) return target.slices().map(sliceAppendTargets[field])
  if (Object.hasOwn(runAppendTargets, field)) return [runAppendTargets[field](state)]
  throw new Error(`unsupported append field: ${field}`)
}

// An attention item belongs to the run before any slice group and to the group's slices inside
// one. The text keeps any kind prefix; the page derives the kind when it renders. Ownership is a
// set, so reordered slices still match the existing item.
function addAttention(state, target, text) {
  if (!text.trim()) throw new Error("attention requires non-empty text")
  const ownersKey = (sliceIds) => [...sliceIds].sort().join()
  const sliceKey = ownersKey(target.sliceIds)
  if (state.attention.some((item) => item.text === text && ownersKey(item.sliceIds) === sliceKey)) return
  state.attention.push({ text, sliceIds: target.sliceIds, createdAt: new Date().toISOString() })
}

function applyMetadata(state, options, target) {
  for (const value of many(options, "--set")) {
    const [field, text] = splitFieldValue(value, "--set")
    if (field === "slice-gates" && !sliceGateModes.includes(text)) throw new Error(`slice-gates must be ${sliceGateModes.join(" or ")}`)
    for (const [record, key] of scalarRecords(state, target, field)) record[key] = text
    if (field === "next-action") state.activity.nextAction = text
  }
  for (const value of many(options, "--append")) {
    const [field, text] = splitFieldValue(value, "--append")
    if (field === "attention") {
      addAttention(state, target, text)
      continue
    }
    const lists = appendLists(state, target, field)
    const entry = field === "approval" || field === "slice.approval" ? parseApproval(text, field) : text
    for (const list of lists) list.push(entry)
  }
  for (const [flag, field] of activityTargets) {
    const text = one(options, flag)
    if (text === undefined) continue
    for (const [record, key] of scalarRecords(state, target, field)) record[key] = text
  }
  const next = one(options, "--next")
  if (next !== undefined && !target.sliceIds.length) state.run.nextAction = next
  const note = one(options, "--note")
  const latest = state.notes.at(-1)
  if (note !== undefined && (latest?.text !== note || latest.sliceIds?.join() !== target.sliceIds.join())) {
    state.notes.push({ text: note, sliceIds: target.sliceIds, updatedAt: new Date().toISOString() })
    state.notes = state.notes.slice(-5)
  }
}

function resolveBlockers(state, options, target) {
  const targets = [
    ["--resolve-slice-blocker", () => target.slices().map((slice) => slice.blockers)],
    ["--resolve-unresolved-blocker", () => [state.evidence.unresolvedBlockers]],
  ]
  const removals = []
  for (const [flag, getLists] of targets) {
    const names = many(options, flag)
    if (!names.length) continue
    for (const list of getLists()) {
      for (const name of names) {
        if (!name.trim()) throw new Error(`${flag} requires non-empty blocker text`)
        if (!list.includes(name)) throw new Error(`blocker not found in ${flag}: ${name}`)
      }
      removals.push([list, new Set(names)])
    }
  }
  for (const [list, names] of removals) {
    const remaining = list.filter((name) => !names.has(name))
    list.splice(0, list.length, ...remaining)
  }
}

// Before any slice group the run's own items are removed; inside one, every slice in the group
// must hold the text, and those slices leave each matching item. An item that loses its last
// slice is removed; one still owned by other slices stays with its creation time.
function resolveAttention(state, options, target) {
  const texts = many(options, "--resolve-attention")
  if (!texts.length) return
  const scopes = target.sliceIds.length ? target.sliceIds : [null]
  const inScope = (item, sliceId) => (sliceId === null ? !item.sliceIds.length : item.sliceIds.includes(sliceId))
  for (const text of texts) {
    if (!text.trim()) throw new Error("--resolve-attention requires non-empty text")
    for (const sliceId of scopes) {
      if (!state.attention.some((item) => item.text === text && inScope(item, sliceId))) {
        throw new Error(`attention item not found ${sliceId === null ? "at run level" : `in ${sliceId}`}: ${text}`)
      }
    }
  }
  const targeted = new Set(target.sliceIds)
  state.attention = state.attention.flatMap((item) => {
    if (!texts.includes(item.text)) return [item]
    if (!targeted.size) return item.sliceIds.length ? [item] : []
    const owners = item.sliceIds.filter((sliceId) => !targeted.has(sliceId))
    if (owners.length === item.sliceIds.length) return [item]
    return owners.length ? [{ ...item, sliceIds: owners }] : []
  })
}

function initialize(options) {
  validateOptions(options, new Set(["--run", "--repository", "--planning-mode", "--map"]))
  const runId = requireRunId(one(options, "--run"))
  const repository = resolve(one(options, "--repository", process.cwd()))
  const runs = repositoryRunsOf(repository)
  for (const existing of [statePath(runId), runs && join(runs, runId, "progress.json")]) {
    if (existing && existsSync(existing)) throw new Error(`run already initialized: ${existing}`)
  }
  const planningMode = one(options, "--planning-mode", "full")
  if (planningMode !== "brief" && planningMode !== "full") throw new Error("--planning-mode must be brief or full")
  const map = readMapConfiguration(one(options, "--map", defaultMapPath))
  const state = makeState(runId, repository, planningMode, map)
  if (runs) atomicWrite(pointerPath(runId), `${repository}\n`)
  saveState(state)
  console.log(statePath(runId))
}

function migrate(options) {
  validateOptions(options, new Set(["--run"]))
  const runId = requireRunId(one(options, "--run"))
  const { directory, readOnly } = locateRun(runId)
  if (!readOnly) throw new Error(`run ${runId} has no old-location copy to migrate`)
  const target = join(repositoryRunsOf(process.cwd()), runId)
  mkdirSync(target, { recursive: true, mode: 0o700 })
  cpSync(directory, target, { recursive: true })
  console.log(join(target, "progress.json"))
  console.error(`copied from ${directory}; the old copy stays until you delete it`)
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

function applyMapInfo(state, update, target) {
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
  if (!Object.keys(update.slice.steps).length) return
  for (const slice of target.slices()) {
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

function applyGroup(state, group, mapConfiguration, assigned, callAddsSlice) {
  if (group.newSlice) addSlice(state, group.newSlice)
  const target = groupTarget(state, group.sliceIds, callAddsSlice)
  const mapInfoPath = one(group.options, "--map-info")
  if (mapInfoPath !== undefined) applyMapInfo(state, readMapInfo(mapInfoPath, mapConfiguration), target)
  assignStatuses(state, group.assignments, target, assigned)
  applyMetadata(state, group.options, target)
  resolveBlockers(state, group.options, target)
  resolveAttention(state, group.options, target)
  if (group.sliceIds.length) state.run.currentSliceId = group.sliceIds.at(-1)
}

function update(pairs) {
  const allowed = new Set([
    ...statusFlags.keys(), "--run", "--depends-on", "--base-revision", "--worktree",
    "--current", "--slice-context", "--next", "--note", "--set", "--append",
    "--resolve-slice-blocker", "--resolve-unresolved-blocker", "--resolve-attention", "--map", "--map-info",
  ])
  const repeatable = new Set([
    ...statusFlags.keys(), "--depends-on", "--set", "--append",
    "--resolve-slice-blocker", "--resolve-unresolved-blocker", "--resolve-attention",
  ])
  const groups = parseSliceGroups(pairs).map((group) => {
    validateOptions(group.options, allowed, repeatable)
    if (group.newSliceId === "") throw new Error("--new-slice requires a non-empty slice ID")
    if (group.newSliceId === undefined && ["--depends-on", "--base-revision", "--worktree"].some((name) => group.options.has(name))) {
      throw new Error("--depends-on, --base-revision, and --worktree only set up a new slice; place them after --new-slice <id>")
    }
    return {
      ...group,
      assignments: parseAssignments(group.options),
      newSlice: group.newSliceId === undefined ? null : makeSlice(group.newSliceId, group.options),
    }
  })
  // One call adds at most one note version, tagged with the slices of the group it sits in.
  if (groups.filter((group) => group.options.has("--note")).length > 1) throw new Error("--note may only be used once")
  const waveOptions = groups[0].options
  const runId = requireRunId(one(waveOptions, "--run"))
  const original = loadState(runId)
  const mapConfigurationUpdate = waveOptions.has("--map") ? readMapConfiguration(one(waveOptions, "--map")) : null
  if (mapConfigurationUpdate) validateSavedMapOverrides(original, mapConfigurationUpdate.configuration)
  const mapConfiguration = mapConfigurationUpdate?.configuration ?? mapConfigurationFromState(original).configuration
  const state = structuredClone(original)
  if (mapConfigurationUpdate) {
    state.run.mapConfig = mapConfigurationUpdate.configuration
    state.run.mapDirectory = mapConfigurationUpdate.directory
  }
  const assigned = new Map()
  const callAddsSlice = groups.some((group) => group.newSlice)
  for (const group of groups) applyGroup(state, group, mapConfiguration, assigned, callAddsSlice)
  state.activity.updatedAt = new Date().toISOString()
  saveState(state)
  console.log(statePath(runId))
}

function empty(value, render = escapeHtml) {
  return value ? render(value) : '<span class="empty">Not recorded</span>'
}

function renderList(items) {
  if (!items?.length) return '<p class="empty">None recorded.</p>'
  return `<ul class="plain-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
}

// The artifacts skill owns the icon catalog shared by every generated page.
const icons = JSON.parse(readFileSync(fileURLToPath(new URL("../../artifacts/icons.json", import.meta.url)), "utf8"))

function icon(name) {
  const svg = icons[name]?.svg
  return svg ? svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ') : ""
}

const stageLetters = new Map(stages.map((stage, index) => [stage.id, String.fromCharCode(65 + index)]))

function stepLabel(stage, step, stepIndex) {
  return `${stageLetters.get(stage.id)}${stepIndex + 1} · ${step.title}`
}

function renderChip(chip, blocked = false) {
  const warning = blocked ? `<span class="chip-warning" role="img" aria-label="blocked">${icon("triangle-alert")}</span>` : ""
  return `<span class="stage-chip" style="--chip-color: ${chip.color}">${icon(chip.icon)}<span>${escapeHtml(chip.label)}</span>${warning}</span>`
}

function renderStep(step, status, label) {
  const symbol = status === "done"
    ? icon("circle-check")
    : status === "blocked"
      ? icon("triangle-alert")
      : `<span aria-hidden="true">${status === "active" ? "●" : "·"}</span>`
  return `<li class="step-row" data-step-id="${escapeHtml(step.id)}" data-status="${status}"><span class="step-name">${escapeHtml(label)}</span><span class="status status-${status}"><span class="status-symbol">${symbol}</span><span>${status[0].toUpperCase()}${status.slice(1)}</span></span></li>`
}

function renderStageCards(stageList, stepStatuses) {
  return stageList.map((stage) => {
    const stageLetter = stageLetters.get(stage.id)
    return `
    <section class="stage" aria-label="${stageLetter} ${escapeHtml(stage.title)}">
      <h3 class="stage-title">${renderChip(stage.chip)}${stageLetter} · ${escapeHtml(stage.title)}</h3>
      <ul class="step-list">${stage.steps.map((step, stepIndex) => renderStep(step, stepStatuses[step.id], stepLabel(stage, step, stepIndex))).join("")}</ul>
    </section>`
  }).join("")
}

// The stage column shows the stages of a slice's working steps, or of its next step while it pauses.
function renderSliceRow(slice) {
  const steps = deliveryStages.flatMap((stage) => stage.steps.map((step, index) => ({
    stage, status: slice.statuses[step.id], label: stepLabel(stage, step, index),
  })))
  const working = steps.filter(({ status }) => workingStatuses.includes(status))
  const done = steps.every(({ status }) => status === "done" || status === "skipped")
  const focus = working.length ? working : steps.filter(({ status }) => status === "upcoming").slice(0, 1)
  const chips = done
    ? renderChip(doneSliceChip)
    : [...new Set(focus.map(({ stage }) => stage))]
      .map((stage) => renderChip(stage.chip, working.some((entry) => entry.stage === stage && entry.status === "blocked")))
      .join("")
  const workingSteps = working.length
    ? working.map(({ label, status }) => escapeHtml(status === "active" ? label : `${label} (${status})`)).join("<br>")
    : '<span class="empty">None active</span>'
  const context = slice.activity.sliceContext ? `<br><span class="muted">${escapeHtml(slice.activity.sliceContext)}</span>` : ""
  return `<tr data-slice-id="${escapeHtml(slice.id)}"><th scope="row">${escapeHtml(slice.id)}${context}</th><td>${chips}</td><td>${workingSteps}</td><td>${empty(slice.activity.nextAction)}</td><td>${empty(slice.activity.explanation)}</td></tr>`
}

// Each tab carries a complete map message: the Wave tab shows delivery steps as upcoming.
function progressTabs(state) {
  const runInfo = state.run.mapInfo ?? { nodes: {}, steps: {} }
  const idleDelivery = Object.fromEntries(repeatedStepIds.map((id) => [id, "upcoming"]))
  return [
    {
      id: "wave",
      label: "Wave",
      cards: renderStageCards(waveStages, state.statuses),
      map: { statuses: { ...state.statuses, ...idleDelivery }, runInfo, sliceInfo: { steps: {} } },
    },
    ...state.slices.map((slice) => ({
      id: `slice:${slice.id}`,
      label: slice.id,
      cards: renderStageCards(deliveryStages, slice.statuses),
      map: { statuses: { ...state.statuses, ...slice.statuses }, runInfo, sliceInfo: slice.mapInfo ?? { steps: {} } },
    })),
  ]
}

function renderNote(note) {
  const sliceIds = note.sliceIds ?? (note.sliceId ? [note.sliceId] : [])
  return `<article class="note-card"><p class="note-meta muted">${escapeHtml(note.updatedAt)}${sliceIds.length ? ` · ${escapeHtml(sliceIds.join(", "))}` : ""}</p><div>${escapeHtml(note.text)}</div></article>`
}

function renderApproval(approval, sliceId = "") {
  return `<li><strong>${escapeHtml(approval.action)}</strong><br>Bounds: ${escapeHtml(approval.approvedBounds)}<br>Reference: ${escapeHtml(approval.reference)}<br>State: ${escapeHtml(approval.state)}${sliceId ? ` <span class="muted">(${escapeHtml(sliceId)})</span>` : ""}</li>`
}

const attentionColor = "#e6c27b"
const blockerChip = { label: "blocker", color: "#f0a6a6", icon: "triangle-alert" }

// A known `kind:` prefix sets the chip; any other text, prefix included, is kind other.
function attentionKind(text) {
  const separator = text.indexOf(":")
  const kind = text.slice(0, separator)
  const body = text.slice(separator + 1).trim()
  return separator > 0 && attentionKinds.includes(kind) && body ? { kind, body } : { kind: "other", body: text }
}

function renderAttentionRow(kind, chip, text, details) {
  const meta = details.filter(Boolean).map(escapeHtml).join(" · ")
  return `<li class="attention-row" data-kind="${kind}">${renderChip(chip)}<span class="attention-text">${linkUrls(text)}</span>${meta ? `<span class="attention-meta muted">${meta}</span>` : ""}</li>`
}

// Blockers come first, then a pending human decision (`None` is the fresh-run default), then
// attention items. Blockers and the decision are plain fields with no time to show.
function renderAttention(state) {
  const decision = (state.run.humanDecisionPending ?? "").trim()
  const rows = [
    ...state.evidence.unresolvedBlockers.map((text) => renderAttentionRow("blocker", blockerChip, text, [])),
    ...state.slices.flatMap((slice) => slice.blockers.map((text) => renderAttentionRow("blocker", blockerChip, text, [slice.id]))),
    ...(decision && decision !== "None"
      ? [renderAttentionRow("decision", { label: "decision", color: attentionColor }, decision, [])]
      : []),
    ...state.attention.map((item) => {
      const { kind, body } = attentionKind(item.text)
      return renderAttentionRow(kind, { label: kind, color: attentionColor }, body, [item.sliceIds.join(", "), item.createdAt])
    }),
  ]
  if (!rows.length) return ""
  return `<section class="panel attention" aria-labelledby="attention-title">
      <h2 id="attention-title">Needs your attention (${rows.length})</h2>
      <ul class="attention-list">${rows.join("")}</ul>
    </section>`
}

function renderProgress(state) {
  const latestNote = state.notes.at(-1)
  const olderNotes = state.notes.slice(0, -1).reverse()
  const activeStages = waveStages
    .filter((stage) => stage.steps.some((step) => workingStatuses.includes(state.statuses[step.id])))
    .map((stage) => escapeHtml(stage.title))
  const currentStages = activeStages.length ? activeStages.join(" · ") : '<span class="empty">None active.</span>'
  const sliceTable = state.slices.length
    ? `<div class="table-wrap"><table class="slice-table"><thead><tr><th scope="col">Slice</th><th scope="col">Stage</th><th scope="col">Step</th><th scope="col">Next</th><th scope="col">Doing now</th></tr></thead><tbody>${state.slices.map(renderSliceRow).join("")}</tbody></table></div>`
    : '<p class="empty">No slices started.</p>'
  const tabs = progressTabs(state)
  const defaultTab = state.run.currentSliceId ? `slice:${state.run.currentSliceId}` : "wave"
  const tabButtons = tabs.map((tab, index) => `<button type="button" role="tab" id="progress-tab-${index}" aria-controls="progress-panel-${index}" aria-selected="${tab.id === defaultTab}" data-tab="${escapeHtml(tab.id)}">${escapeHtml(tab.label)}</button>`).join("")
  const tabPanels = tabs.map((tab, index) => `
      <div class="tab-panel" role="tabpanel" id="progress-panel-${index}" aria-labelledby="progress-tab-${index}" data-tab-panel="${escapeHtml(tab.id)}"${tab.id === defaultTab ? "" : " hidden"}><div class="stage-grid">${tab.cards}</div></div>`).join("")
  const approvalRows = [
    ...state.approvals.map((approval) => renderApproval(approval)),
    ...state.slices.flatMap((slice) => slice.approvals.map((approval) => renderApproval(approval, slice.id))),
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
  const mapState = { defaultTab, tabs: Object.fromEntries(tabs.map((tab) => [tab.id, tab.map])) }
  return `<main id="progress-content">
    ${renderAttention(state)}
    <section class="panel slices" aria-labelledby="slices-title">
      <p class="eyebrow">${escapeHtml(state.run.id)} · ${escapeHtml(state.run.repository)}</p>
      <h2 id="slices-title">Slices</h2>
      ${sliceTable}
    </section>
    <section class="panel activity">
      <h2>Wave activity</h2>
      <p class="field-value">${empty(state.activity.explanation)}</p>
      <div class="activity-grid">
        <div><p class="field-label">Next action</p><p class="field-value">${empty(state.activity.nextAction)}</p></div>
        <div><p class="field-label">Current stages</p><p class="field-value">${currentStages}</p></div>
        <div><p class="field-label">Slice gates</p><p class="field-value">${empty(state.run.sliceGates)}</p></div>
      </div>
      <p class="last-update">Last update: <time>${updated}</time></p>
    </section>
    <section aria-labelledby="progress-title">
      <div class="progress-heading"><h2 id="progress-title">Progress</h2><span class="muted">Numbers show reading order; loops and alternatives can return to earlier steps.</span></div>
      <div class="tab-list" role="tablist" aria-label="Wave and slice steps">${tabButtons}</div>${tabPanels}
    </section>
    <section class="panel notes">
      <h2>Living notes</h2>
      ${latestNote ? renderNote(latestNote) : '<p class="empty">No notes recorded.</p>'}
      ${olderNotes.length
        ? `<details data-panel="note-history"><summary>Previous versions (${olderNotes.length})</summary>${olderNotes.map(renderNote).join("")}</details>`
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
            <p><span class="field-label">Human decision pending</span><br>${empty(state.run.humanDecisionPending, linkUrls)}</p>
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
    const map = mapConfigurationFromState(state)
    writeMapViewer(join(dirname(output), "workflow-map.html"), map.configuration, map.directory)
  } catch (error) {
    mapWarning = error.message
    atomicWrite(join(dirname(output), "workflow-map.html"), renderMapError(error))
  }
  console.log(output)
  if (mapWarning) console.error(`warning: native map could not be built: ${mapWarning}`)
}

const artifactPorts = { first: 3100, last: 3199 }

function serve(options) {
  validateOptions(options, new Set(["--run", "--port"]))
  const runId = requireRunId(one(options, "--run"))
  loadState(runId)
  const firstPort = Number(one(options, "--port", String(artifactPorts.first)))
  if (!Number.isInteger(firstPort) || firstPort < artifactPorts.first || firstPort > artifactPorts.last) {
    throw new Error(`--port must be an integer from ${artifactPorts.first} to ${artifactPorts.last}`)
  }
  let port = firstPort
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
    if (error.code === "EADDRINUSE" && port < artifactPorts.last) {
      port += 1
      server.listen(port, "0.0.0.0")
      return
    }
    if (error.code === "EADDRINUSE") {
      console.error(`serve failed: no free port from ${firstPort} to ${artifactPorts.last}`)
    } else {
      console.error(`serve failed: ${error.message}`)
    }
    process.exitCode = 1
  })
  server.on("listening", () => {
    const chosenPort = server.address().port
    console.log(`http://127.0.0.1:${chosenPort}/`)
    console.log(`bound 0.0.0.0:${chosenPort}; remote clients use this machine's observed host/IP with the same port`)
  })
  server.listen(port, "0.0.0.0")
}

// One command's usage: its line, plus update's flag notes. An unknown command throws, as main does.
function commandUsage(command) {
  const [commands, flags] = usage.split("\n\n")
  const lines = commands.split("\n").filter((line) => line.trim().split(/\s+/)[2] === command)
  if (!lines.length) throw new Error(`unknown command: ${command}\n${usage}`)
  return ["usage:", ...lines, ...(command === "update" ? ["", flags] : [])].join("\n")
}

function main() {
  const [, , command, ...args] = process.argv
  if (!command || command === "--help" || command === "-h") {
    console.log(usage)
    return
  }
  if (args.includes("--help") || args.includes("-h")) {
    console.log(commandUsage(command))
    return
  }
  const pairs = parsePairs(args)
  if (command === "update") {
    update(pairs)
    return
  }
  const options = optionsFromPairs(pairs)
  if (command === "init") initialize(options)
  else if (command === "list-steps") {
    validateOptions(options, new Set())
    listSteps()
  } else if (command === "path") {
    validateOptions(options, new Set(["--run"]))
    console.log(statePath(one(options, "--run")))
  } else if (command === "migrate") migrate(options)
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
