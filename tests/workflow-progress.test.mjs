import { test } from "node:test"
import {
  deepStrictEqual, doesNotMatch, match, notStrictEqual, strictEqual,
} from "node:assert"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawn, spawnSync } from "node:child_process"
import { once } from "node:events"
import { stages } from "../config/skills/workflow-progress/scripts/stages.mjs"

const root = resolve(fileURLToPath(new URL("..", import.meta.url)))
const cli = join(root, "config/skills/workflow-progress/scripts/progress.mjs")
const diagramPath = join(root, "config/skills/workflow-progress/assets/workflow.svg")
const mapPath = join(root, "config/skills/workflow-progress/assets/map.json")

function createRun(t, runId, selectedMap = undefined) {
  const stateHome = mkdtempSync(join(tmpdir(), "workflow-progress-test-"))
  t.after(() => rmSync(stateHome, { recursive: true, force: true }))
  const env = { ...process.env, XDG_STATE_HOME: stateHome }
  // The temporary folder is not a Git repository, so runs stay under the XDG state home.
  const runCli = (args) => spawnSync(process.execPath, [cli, ...args], { cwd: stateHome, env, encoding: "utf8" })
  const initialized = runCli([
    "init", "--run", runId, "--repository", "sample-repo", "--planning-mode", "brief",
    ...(selectedMap ? ["--map", selectedMap] : []),
  ])
  strictEqual(initialized.status, 0, initialized.stderr)
  const path = join(stateHome, "agentic-workflow", runId, "progress.json")
  const readState = () => JSON.parse(readFileSync(path, "utf8"))
  return { cwd: stateHome, env, path, readState, runCli }
}

test("native map manifest anchors refer to unique source cell IDs", () => {
  const svg = readFileSync(diagramPath, "utf8")
  const mapping = JSON.parse(readFileSync(mapPath, "utf8"))
  const cellIds = [...svg.matchAll(/\bdata-cell-id="([^"]+)"/g)].map((match) => match[1])
  const cellCounts = new Map()
  for (const id of cellIds) cellCounts.set(id, (cellCounts.get(id) ?? 0) + 1)
  const stepIds = stages.flatMap((stage) => stage.steps.map((step) => step.id)).sort()
  const anchorIds = new Set(Object.values(mapping.steps).flatMap((step) => step.anchors))
  strictEqual(new Set(cellIds).size, cellIds.length, "source cell IDs are unique")
  deepStrictEqual(Object.keys(mapping.steps).sort(), stepIds)
  for (const [step, entry] of Object.entries(mapping.steps)) {
    for (const id of entry.anchors) strictEqual(cellCounts.get(id), 1, `${step} anchor ${id} exists once`)
  }
  for (const id of Object.keys(mapping.nodes ?? {})) strictEqual(cellCounts.get(id), 1, `native node ${id} exists once`)
  for (const [boxId, members] of Object.entries(mapping.focusBoxes ?? {})) {
    strictEqual(cellCounts.get(boxId), 1, `focus box ${boxId} exists once`)
    strictEqual(anchorIds.has(boxId) || Object.hasOwn(mapping.nodes ?? {}, boxId), false, `focus box ${boxId} is not selectable`)
    strictEqual(Object.values(mapping.steps).some((step) => members.every((id) => step.anchors.includes(id))), true, `a default step focuses all members of ${boxId}`)
    for (const id of members) {
      strictEqual(cellCounts.get(id), 1, `focus box ${boxId} member ${id} exists once`)
      strictEqual(anchorIds.has(id) || Object.hasOwn(mapping.nodes ?? {}, id), true, `focus box ${boxId} member ${id} is selectable`)
    }
  }
})

test("custom map rebuild writes sibling provenance and keeps the previous SVG on provenance failure", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "workflow-map-build-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const configuration = JSON.parse(readFileSync(mapPath, "utf8"))
  configuration.source = "source.drawio"
  configuration.svg = "workflow.svg"
  const configurationPath = join(directory, "map.json")
  const svgPath = join(directory, configuration.svg)
  const provenancePath = join(directory, "build-provenance.json")
  const vendorProvenance = join(root, "config/skills/workflow-progress/vendor/archify/provenance.json")
  writeFileSync(configurationPath, JSON.stringify(configuration))
  writeFileSync(join(directory, configuration.source), "custom diagram source")
  writeFileSync(svgPath, "previous SVG")
  const fakeExporter = join(directory, "drawio")
  writeFileSync(fakeExporter, `#!/bin/sh
if [ "$1" = "--version" ]; then
  printf '%s\\n' 'draw.io test exporter'
  exit 0
fi
while [ "$#" -gt 0 ]; do
  if [ "$1" = "--output" ]; then output=$2; shift 2; else shift; fi
done
cat > "$output" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" content="&lt;mxGraphModel/&gt;"></svg>
SVG
`)
  chmodSync(fakeExporter, 0o755)
  const vendorBefore = readFileSync(vendorProvenance)
  const rebuild = () => spawnSync(process.execPath, [cli, "rebuild-map", "--map", configurationPath, "--drawio", fakeExporter], {
    cwd: root, encoding: "utf8",
  })

  let result = rebuild()
  strictEqual(result.status, 0, result.stderr)
  const provenanceText = readFileSync(provenancePath, "utf8")
  const details = JSON.parse(provenanceText).drawioExport
  strictEqual(details.version, "draw.io test exporter")
  strictEqual(details.source.path, "source.drawio")
  strictEqual(details.svg.path, "workflow.svg")
  doesNotMatch(provenanceText, /\/tmp\//)
  strictEqual(readFileSync(vendorProvenance).equals(vendorBefore), true)

  const previousSvg = readFileSync(svgPath)
  rmSync(provenancePath)
  mkdirSync(provenancePath)
  result = rebuild()
  notStrictEqual(result.status, 0)
  strictEqual(readFileSync(svgPath).equals(previousSvg), true)
})

test("served progress refreshes retain the native map frame and export an unchanged source", async (t) => {
  const run = createRun(t, "diagram-refresh")
  const graphBeforeRender = readFileSync(diagramPath, "utf8")
  let result = run.runCli([
    "update", "--run", "diagram-refresh", "--new-slice", "slice-1",
    "--active", "build-review.review", "--waiting", "human-validation.await-feedback",
    "--done", "first-draft.draft",
  ])
  strictEqual(result.status, 0, result.stderr)

  const server = spawn(process.execPath, [cli, "serve", "--run", "diagram-refresh"], {
    cwd: run.cwd, env: run.env, stdio: ["ignore", "pipe", "pipe"],
  })
  t.after(async () => {
    if (server.exitCode !== null) return
    const exited = once(server, "exit")
    server.kill()
    await exited
  })
  let stderr = ""
  server.stderr.setEncoding("utf8")
  server.stderr.on("data", (chunk) => { stderr += chunk })
  const baseUrl = await new Promise((resolveUrl, reject) => {
    let stdout = ""
    let settled = false
    const timeout = setTimeout(() => finish(reject, new Error(`server did not start: ${stderr}`)), 5000)
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      callback(value)
    }
    server.stdout.setEncoding("utf8")
    server.stdout.on("data", (chunk) => {
      stdout += chunk
      const url = stdout.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0]
      if (url) finish(resolveUrl, url)
    })
    server.once("error", (error) => finish(reject, error))
    server.once("exit", (code) => finish(reject, new Error(`server exited ${code}: ${stderr}`)))
  })
  const dashboardCsp = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:; frame-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'"

  let response = await fetch(new URL("content", baseUrl))
  strictEqual(response.status, 200)
  strictEqual(response.headers.get("content-security-policy"), dashboardCsp)
  let content = await response.text()
  match(content, /data-step-id="build-review\.review" data-status="active"/)
  match(content, /data-step-id="human-validation\.await-feedback" data-status="waiting"/)
  match(content, /data-step-id="first-draft\.draft" data-status="done"/)
  doesNotMatch(content, /workflow-diagram-image/)

  result = run.runCli(["update", "--run", "diagram-refresh", "--done", "build-review.review", "--active", "cleanup.audit"])
  strictEqual(result.status, 0, result.stderr)
  response = await fetch(new URL("workflow-map.html", baseUrl))
  strictEqual(response.status, 200)
  strictEqual(response.headers.get("content-security-policy"), dashboardCsp.replace("img-src data:", "img-src data: blob:"))
  let nativeHtml = await response.text()
  match(nativeHtml, /data-preset="signal-flow"/)
  strictEqual(/http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'/.test(nativeHtml), true, "native viewer allows local images and remains isolated")
  const nativeInput = nativeHtml.match(/<script type="application\/json" id="workflow-map-input">([\s\S]*?)<\/script>/)
  strictEqual(nativeInput?.length, 2)
  deepStrictEqual(JSON.parse(nativeInput[1]).svgText, graphBeforeRender)

  response = await fetch(new URL("/", baseUrl))
  strictEqual(response.status, 200)
  strictEqual(response.headers.get("content-security-policy"), dashboardCsp)
  const page = await response.text()
  match(page, /<iframe id="workflow-map-frame"[^>]+sandbox="allow-scripts"/)
  const frameUrl = page.match(/<iframe id="workflow-map-frame"[^>]+src="([^"]+)"/)?.[1]
  strictEqual(frameUrl, "workflow-map.html?theme=dark&amp;present=1")
  doesNotMatch(frameUrl, /(?:\?|&)embed=1(?:&|$)/)
  doesNotMatch(page, /sandbox="[^"]*allow-same-origin/)
  match(response.headers.get("content-security-policy"), /frame-src 'self'/)

  response = await fetch(new URL("content", baseUrl))
  strictEqual(response.status, 200)
  content = await response.text()
  match(content, /data-step-id="build-review\.review" data-status="done"/)
  match(content, /data-step-id="cleanup\.audit" data-status="active"/)

  result = run.runCli(["render", "--run", "diagram-refresh"])
  strictEqual(result.status, 0, result.stderr)
  const snapshot = readFileSync(result.stdout.trim(), "utf8")
  match(snapshot, /summary>Original workflow diagram reference<\/summary>/)
  match(snapshot, /data-step-id="cleanup\.audit" data-status="active"/)
  match(snapshot, /<iframe id="workflow-map-frame"[^>]+sandbox="allow-scripts"/)
  const nativeSnapshot = readFileSync(join(dirname(result.stdout.trim()), "workflow-map.html"), "utf8")
  match(nativeSnapshot, /data-preset="signal-flow"/)
  const snapshotInput = nativeSnapshot.match(/<script type="application\/json" id="workflow-map-input">([\s\S]*?)<\/script>/)
  strictEqual(snapshotInput?.length, 2)
  deepStrictEqual(JSON.parse(snapshotInput[1]).svgText, graphBeforeRender)
  strictEqual(readFileSync(diagramPath, "utf8"), graphBeforeRender)
})

test("updates preserve untouched data, allow parallel active steps, and reopen completed steps", (t) => {
  const run = createRun(t, "delta")
  const approval = {
    action: "Local browser validation",
    approvedBounds: "One localhost run",
    reference: "Approved plan",
    state: "approved",
  }
  let result = run.runCli([
    "update", "--run", "delta", "--new-slice", "slice-1",
    "--done", "first-draft.investigate",
    "--active", "build-review.implement", "--active", "cleanup.audit",
    "--current", "Reviewing the implementation",
    "--slice-context", "Slice 1: progress page",
    "--next", "Check the rendered snapshot",
    "--append", "slice.evidence=review-report.md",
    "--append", `slice.approval=${JSON.stringify(approval)}`,
  ])
  strictEqual(result.status, 0, result.stderr)

  result = run.runCli(["update", "--run", "delta", "--reopen", "build-review.implement", "--note", "The review found one item to correct."])
  strictEqual(result.status, 0, result.stderr)
  const state = run.readState()
  strictEqual(state.statuses["first-draft.investigate"], "done")
  strictEqual(state.slices[0].statuses["build-review.implement"], "upcoming")
  strictEqual(state.slices[0].statuses["cleanup.audit"], "active")
  strictEqual(state.slices[0].statuses["human-validation.await-feedback"], "upcoming")
  deepStrictEqual(state.slices[0].activity, {
    explanation: "Reviewing the implementation",
    sliceContext: "Slice 1: progress page",
    nextAction: "Check the rendered snapshot",
  })
  deepStrictEqual(state.slices[0].evidence, ["review-report.md"])
  deepStrictEqual(state.slices[0].approvals, [approval])
  deepStrictEqual(state.notes.map((note) => note.text), ["The review found one item to correct."])
})

test("invalid step IDs and conflicting assignments leave the saved record unchanged", (t) => {
  const run = createRun(t, "invalid")
  let result = run.runCli(["update", "--run", "invalid", "--new-slice", "slice-1", "--done", "first-draft.investigate"])
  strictEqual(result.status, 0, result.stderr)
  const initial = readFileSync(run.path, "utf8")

  result = run.runCli(["update", "--run", "invalid", "--done", "missing.step"])
  notStrictEqual(result.status, 0)
  match(result.stderr, /unknown step ID/)
  strictEqual(readFileSync(run.path, "utf8"), initial)

  result = run.runCli([
    "update", "--run", "invalid", "--done", "first-draft.investigate",
    "--active", "first-draft.investigate",
  ])
  notStrictEqual(result.status, 0)
  match(result.stderr, /conflicting statuses/)
  strictEqual(readFileSync(run.path, "utf8"), initial)

  result = run.runCli(["update", "--run", "invalid", "--new-slice", "", "--done", "build-review.implement"])
  notStrictEqual(result.status, 0)
  match(result.stderr, /non-empty slice ID/)
  strictEqual(readFileSync(run.path, "utf8"), initial)
})

test("blocker and attention resolution removes only named entries in scope and rejects unknown items without saving", (t) => {
  const run = createRun(t, "blockers")
  let result = run.runCli([
    "update", "--run", "blockers",
    "--append", "attention=question: <b>Which port?</b>",
    "--append", "attention=shared request",
    "--new-slice", "slice-1",
    "--append", "attention=shared request",
    "--append", "slice.blocker=resolved slice blocker",
    "--append", "slice.blocker=keep slice blocker",
    "--append", "evidence.unresolved-blocker=resolved run blocker",
    "--append", "evidence.unresolved-blocker=keep run blocker",
    "--append", "slice.evidence=review.md",
    "--append", "evidence.link=plan.md",
    "--new-slice", "slice-2",
    "--slice", "slice-1,slice-2", "--append", "attention=permission: shared",
    "--slice", "slice-2,slice-1", "--append", "attention=permission: shared",
  ])
  strictEqual(result.status, 0, result.stderr)
  const sharedCreatedAt = run.readState().attention.find((item) => item.text === "permission: shared").createdAt

  result = run.runCli([
    "update", "--run", "blockers",
    "--resolve-slice-blocker", "resolved slice blocker",
    "--resolve-unresolved-blocker", "resolved run blocker",
    "--resolve-attention", "shared request",
    "--active", "build-review.review",
    "--slice", "slice-1", "--resolve-attention", "permission: shared",
  ])
  strictEqual(result.status, 0, result.stderr)
  const state = run.readState()
  deepStrictEqual(state.slices[0].blockers, ["keep slice blocker"])
  deepStrictEqual(state.evidence.unresolvedBlockers, ["keep run blocker"])
  deepStrictEqual(state.attention.map(({ text, sliceIds }) => ({ text, sliceIds })), [
    { text: "question: <b>Which port?</b>", sliceIds: [] },
    { text: "shared request", sliceIds: ["slice-1"] },
    { text: "permission: shared", sliceIds: ["slice-2"] },
  ])
  strictEqual(state.attention.at(-1).createdAt, sharedCreatedAt)
  deepStrictEqual(state.slices[0].evidence, ["review.md"])
  deepStrictEqual(state.evidence.links, ["plan.md"])
  strictEqual(state.slices[0].statuses["build-review.review"], "active")

  result = run.runCli(["render", "--run", "blockers"])
  strictEqual(result.status, 0, result.stderr)
  const page = readFileSync(result.stdout.trim(), "utf8")
  match(page, /Needs your attention \(5\)/)
  match(page, /&lt;b&gt;Which port\?&lt;\/b&gt;/)
  doesNotMatch(page, /<b>Which port/)

  const beforeInvalid = readFileSync(run.path, "utf8")
  result = run.runCli([
    "update", "--run", "blockers", "--resolve-slice-blocker", "missing blocker",
    "--done", "build-review.implement",
  ])
  notStrictEqual(result.status, 0)
  match(result.stderr, /blocker not found/)
  strictEqual(readFileSync(run.path, "utf8"), beforeInvalid)

  result = run.runCli([
    "update", "--run", "blockers", "--done", "build-review.implement",
    "--slice", "slice-1", "--resolve-attention", "question: <b>Which port?</b>",
  ])
  notStrictEqual(result.status, 0)
  match(result.stderr, /attention item not found in slice-1/)
  strictEqual(readFileSync(run.path, "utf8"), beforeInvalid)
})

test("current stages show working wave stages without order inference", (t) => {
  const run = createRun(t, "current-stages")
  let result = run.runCli([
    "update", "--run", "current-stages", "--new-slice", "slice-1",
    "--active", "first-draft.draft",
    "--waiting", "challenge-approve.critique",
    "--blocked", "close-wave.regression",
    "--active", "build-review.review",
    "--current", "Reviewing the implementation",
    "--set", "current-stage=Intake",
  ])
  strictEqual(result.status, 0, result.stderr)
  result = run.runCli(["render", "--run", "current-stages"])
  strictEqual(result.status, 0, result.stderr)
  let html = readFileSync(result.stdout.trim(), "utf8")
  match(html, /<p class="field-label">Current stages<\/p><p class="field-value">First draft · Challenge and approve · Close wave<\/p>/)
  match(html, /<span class="field-label">Recorded current stage<\/span><br>Intake/)

  result = run.runCli([
    "update", "--run", "current-stages",
    "--done", "first-draft.draft", "--done", "challenge-approve.critique", "--done", "close-wave.regression",
  ])
  strictEqual(result.status, 0, result.stderr)
  result = run.runCli(["render", "--run", "current-stages"])
  strictEqual(result.status, 0, result.stderr)
  html = readFileSync(result.stdout.trim(), "utf8")
  match(html, /<p class="field-label">Current stages<\/p><p class="field-value"><span class="empty">None active\.<\/span><\/p>/)
})

test("new slices start fresh delivery steps and keep earlier slices intact while notes keep five versions", (t) => {
  const run = createRun(t, "slices")
  const approval = {
    action: "Local review",
    approvedBounds: "Slice 1 only",
    reference: "Approved wave plan",
    state: "approved",
  }
  let result = run.runCli([
    "update", "--run", "slices", "--new-slice", "slice-1",
    "--done", "first-draft.investigate", "--done", "build-review.implement", "--done", "cleanup.audit",
    "--append", "planning-evidence=plan.md",
    "--append", `approval=${JSON.stringify(approval)}`,
    "--append", "slice.evidence=build-check.md",
    "--append", `slice.approval=${JSON.stringify(approval)}`,
    "--append", "slice.blocker=Browser validation pending",
    "--append", "slice.recovery=Resume after approval",
  ])
  strictEqual(result.status, 0, result.stderr)

  for (let version = 1; version <= 6; version += 1) {
    result = run.runCli(["update", "--run", "slices", "--note", `Note ${version}`])
    strictEqual(result.status, 0, result.stderr)
  }
  const latestBeforeRepeat = run.readState().notes.at(-1)
  result = run.runCli(["update", "--run", "slices", "--note", "Note 6"])
  strictEqual(result.status, 0, result.stderr)
  const notes = run.readState().notes
  strictEqual(notes.length, 5)
  deepStrictEqual(notes.map((note) => note.text), ["Note 2", "Note 3", "Note 4", "Note 5", "Note 6"])
  deepStrictEqual(notes.at(-1), latestBeforeRepeat)

  result = run.runCli(["update", "--run", "slices", "--new-slice", "slice-2"])
  strictEqual(result.status, 0, result.stderr)
  const state = run.readState()
  strictEqual(state.run.currentSliceId, "slice-2")
  strictEqual(state.statuses["first-draft.investigate"], "done")
  strictEqual(state.slices[1].statuses["prepare-slice.readiness"], "upcoming")
  strictEqual(state.slices[1].statuses["build-review.implement"], "upcoming")
  strictEqual(state.slices[1].statuses["cleanup.audit"], "upcoming")
  deepStrictEqual(state.run.planningEvidenceAndArtifacts, ["plan.md"])
  deepStrictEqual(state.approvals, [approval])
  deepStrictEqual(state.slices[0].statuses["build-review.implement"], "done")
  deepStrictEqual(state.slices[0].statuses["cleanup.audit"], "done")
  deepStrictEqual(state.slices[0].evidence, ["build-check.md"])
  deepStrictEqual(state.slices[0].approvals, [approval])
  deepStrictEqual(state.slices[0].blockers, ["Browser validation pending"])
  deepStrictEqual(state.slices[0].recovery, ["Resume after approval"])
  strictEqual(state.notes.length, 5)

  result = run.runCli(["update", "--run", "slices", "--note", "<script>alert(1)</script>"])
  strictEqual(result.status, 0, result.stderr)
  result = run.runCli(["render", "--run", "slices"])
  strictEqual(result.status, 0, result.stderr)
  const html = readFileSync(result.stdout.trim(), "utf8")
  match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  doesNotMatch(html, /<script>alert\(1\)<\/script>/)
  match(html, /src="data:image\/png;base64,/)
  doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i)
})

test("map info merges partial metadata, separates planning from slice data, and renders safely", (t) => {
  const run = createRun(t, "map-info")
  const description = "Implementation $& $$ $' $` <script>alert(1)</script>"
  let result = run.runCli([
    "update", "--run", "map-info", "--new-slice", "slice-1", "--active", "build-review.implement",
  ])
  strictEqual(result.status, 0, result.stderr)
  const inputPath = join(dirname(run.path), "map-info.json")
  writeFileSync(inputPath, JSON.stringify({
    nodes: { c48: { description, context: "Approved scope" } },
    steps: {
      "first-draft.draft": { description: "Planning context" },
      "build-review.implement": { anchors: ["c46"], description: "Small-slice branch" },
    },
  }))
  result = run.runCli(["update", "--run", "map-info", "--map-info", inputPath])
  strictEqual(result.status, 0, result.stderr)
  let state = run.readState()
  strictEqual(state.run.mapInfo.nodes.c48.description, description)
  strictEqual(state.run.mapInfo.steps["first-draft.draft"].description, "Planning context")
  deepStrictEqual(state.slices[0].mapInfo.steps["build-review.implement"], {
    anchors: ["c46"], description: "Small-slice branch",
  })

  writeFileSync(inputPath, JSON.stringify({ nodes: { c48: { context: "Additional context" } } }))
  result = run.runCli(["update", "--run", "map-info", "--map-info", inputPath])
  strictEqual(result.status, 0, result.stderr)
  state = run.readState()
  strictEqual(state.run.mapInfo.nodes.c48.description, description)
  strictEqual(state.run.mapInfo.nodes.c48.context, "Additional context")

  result = run.runCli(["render", "--run", "map-info"])
  strictEqual(result.status, 0, result.stderr)
  const html = readFileSync(result.stdout.trim(), "utf8")
  const payload = html.match(/<script id="workflow-map-state" type="application\/json">([\s\S]*?)<\/script>/)
  strictEqual(payload?.length, 2)
  const renderedState = JSON.parse(payload[1])
  strictEqual(renderedState.defaultTab, "slice:slice-1")
  const sliceTab = renderedState.tabs["slice:slice-1"]
  strictEqual(sliceTab.runInfo.nodes.c48.description, description)
  strictEqual(sliceTab.sliceInfo.steps["build-review.implement"].anchors[0], "c46")
  doesNotMatch(html, /Implementation <script>alert/)
  strictEqual(existsSync(join(dirname(result.stdout.trim()), "workflow-map.html")), true)

  result = run.runCli(["update", "--run", "map-info", "--new-slice", "slice-2"])
  strictEqual(result.status, 0, result.stderr)
  state = run.readState()
  strictEqual(state.run.mapInfo.steps["first-draft.draft"].description, "Planning context")
  strictEqual(state.slices[0].mapInfo.steps["build-review.implement"].anchors[0], "c46")
  deepStrictEqual(state.slices[1].mapInfo, { steps: {} })
})

test("invalid or unscoped delivery map info leaves saved state unchanged and legacy runs use defaults", (t) => {
  const run = createRun(t, "map-info-invalid")
  const inputPath = join(dirname(run.path), "map-info.json")
  const before = readFileSync(run.path, "utf8")
  writeFileSync(inputPath, JSON.stringify({ steps: { "build-review.implement": { anchors: ["c46"] } } }))
  let result = run.runCli(["update", "--run", "map-info-invalid", "--map-info", inputPath])
  notStrictEqual(result.status, 0)
  match(result.stderr, /current slice/)
  strictEqual(readFileSync(run.path, "utf8"), before)

  writeFileSync(inputPath, JSON.stringify({ nodes: { unknown: { description: "invalid" } } }))
  result = run.runCli(["update", "--run", "map-info-invalid", "--map-info", inputPath])
  notStrictEqual(result.status, 0)
  match(result.stderr, /unknown node/)
  strictEqual(readFileSync(run.path, "utf8"), before)

  const legacy = run.readState()
  delete legacy.run.mapConfig
  delete legacy.run.mapDirectory
  delete legacy.run.mapInfo
  writeFileSync(run.path, `${JSON.stringify(legacy, null, 2)}\n`)
  result = run.runCli(["render", "--run", "map-info-invalid"])
  strictEqual(result.status, 0, result.stderr)
  strictEqual(existsSync(join(dirname(result.stdout.trim()), "workflow-map.html")), true)
})

test("init snapshots an explicit map configuration and its resolved directory", (t) => {
  const run = createRun(t, "explicit-map", mapPath)
  const state = run.readState()
  deepStrictEqual(state.run.mapConfig, JSON.parse(readFileSync(mapPath, "utf8")))
  strictEqual(state.run.mapDirectory, dirname(mapPath))
})

test("update adopts a map for an existing run and rejects incompatible overrides", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "workflow-map-adoption-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const currentMap = JSON.parse(readFileSync(mapPath, "utf8"))
  const previousMap = structuredClone(currentMap)
  previousMap.steps["first-draft.investigate"].anchors = ["c20"]
  const previousMapPath = join(directory, "previous-map.json")
  writeFileSync(previousMapPath, JSON.stringify(previousMap))
  const run = createRun(t, "existing-map-adoption", previousMapPath)
  const approval = {
    action: "Local review",
    approvedBounds: "Map adoption only",
    reference: "Approved correction",
    state: "approved",
  }
  let result = run.runCli([
    "update", "--run", "existing-map-adoption", "--new-slice", "slice-1",
    "--done", "first-draft.investigate", "--active", "build-review.review",
    "--note", "Preserve this note.", "--append", "planning-evidence=plan.md",
    "--append", `approval=${JSON.stringify(approval)}`, "--append", "slice.evidence=review.md",
    "--append", "evidence.link=run-evidence.md",
  ])
  strictEqual(result.status, 0, result.stderr)

  const mapInfoPath = join(directory, "map-info.json")
  writeFileSync(mapInfoPath, JSON.stringify({
    nodes: { c48: { description: "Keep this node override" } },
    steps: {
      "first-draft.draft": { anchors: ["c21"], description: "Keep this planning override" },
      "build-review.implement": { anchors: ["c46"], description: "Keep this slice override" },
    },
  }))
  result = run.runCli(["update", "--run", "existing-map-adoption", "--map-info", mapInfoPath])
  strictEqual(result.status, 0, result.stderr)

  const before = run.readState()
  result = run.runCli(["update", "--run", "existing-map-adoption", "--map", mapPath])
  strictEqual(result.status, 0, result.stderr)
  const adopted = run.readState()
  const expected = structuredClone(before)
  expected.run.mapConfig = currentMap
  expected.run.mapDirectory = dirname(mapPath)
  expected.activity.updatedAt = adopted.activity.updatedAt
  deepStrictEqual(adopted, expected)

  const incompatibleMap = structuredClone(currentMap)
  delete incompatibleMap.nodes.c46
  const incompatibleMapPath = join(directory, "incompatible-map.json")
  writeFileSync(incompatibleMapPath, JSON.stringify(incompatibleMap))
  const beforeInvalidUpdate = readFileSync(run.path, "utf8")
  result = run.runCli(["update", "--run", "existing-map-adoption", "--map", incompatibleMapPath])
  notStrictEqual(result.status, 0)
  match(result.stderr, /saved map overrides are incompatible.*c46/s)
  strictEqual(readFileSync(run.path, "utf8"), beforeInvalidUpdate)
})

test("runs in a Git repository live in its agent-memory; old-location runs stay read-only until migrated", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "workflow-progress-repo-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const stateHome = join(directory, "state")
  const repository = join(directory, "repo")
  mkdirSync(repository)
  strictEqual(spawnSync("git", ["init", "-q"], { cwd: repository }).status, 0)
  const env = { ...process.env, XDG_STATE_HOME: stateHome }
  const runCli = (cwd, args) => spawnSync(process.execPath, [cli, ...args], { cwd, env, encoding: "utf8" })

  let result = runCli(repository, ["init", "--run", "fresh"])
  strictEqual(result.status, 0, result.stderr)
  const fresh = join(repository, ".git/agent-memory/workflow-runs/fresh/progress.json")
  strictEqual(existsSync(fresh), true)
  strictEqual(existsSync(join(stateHome, "agentic-workflow/fresh/progress.json")), false)

  // An old run: initialized outside a repository, so it lands under the XDG state home.
  result = runCli(directory, ["init", "--run", "old"])
  strictEqual(result.status, 0, result.stderr)
  const old = join(stateHome, "agentic-workflow/old/progress.json")
  const before = readFileSync(old, "utf8")
  result = runCli(repository, ["update", "--run", "old", "--new-slice", "slice-1"])
  notStrictEqual(result.status, 0)
  match(result.stderr, /read-only.*migrate --run old/s)
  strictEqual(readFileSync(old, "utf8"), before)
  result = runCli(repository, ["render", "--run", "old"])
  strictEqual(result.status, 0, result.stderr)

  result = runCli(repository, ["migrate", "--run", "old"])
  strictEqual(result.status, 0, result.stderr)
  const migrated = join(repository, ".git/agent-memory/workflow-runs/old/progress.json")
  strictEqual(result.stdout.trim(), migrated)
  result = runCli(repository, ["update", "--run", "old", "--new-slice", "slice-1"])
  strictEqual(result.status, 0, result.stderr)
  strictEqual(readFileSync(old, "utf8"), before)
})

test("a run follows the repository given to init, from any folder", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "workflow-progress-follow-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const repository = join(directory, "repo")
  mkdirSync(repository)
  strictEqual(spawnSync("git", ["init", "-q"], { cwd: repository }).status, 0)
  const env = { ...process.env, XDG_STATE_HOME: join(directory, "state") }
  const runCli = (cwd, args) => spawnSync(process.execPath, [cli, ...args], { cwd, env, encoding: "utf8" })

  // Started outside Git, the run still lands in the named repository and updates from inside it.
  let result = runCli(directory, ["init", "--run", "named", "--repository", repository])
  strictEqual(result.status, 0, result.stderr)
  const named = join(repository, ".git/agent-memory/workflow-runs/named/progress.json")
  strictEqual(result.stdout.trim(), named)
  result = runCli(repository, ["update", "--run", "named", "--new-slice", "slice-1"])
  strictEqual(result.status, 0, result.stderr)

  // Started inside Git, the run is found and updated from a folder outside it.
  result = runCli(repository, ["init", "--run", "inside"])
  strictEqual(result.status, 0, result.stderr)
  result = runCli(directory, ["update", "--run", "inside", "--new-slice", "slice-1"])
  strictEqual(result.status, 0, result.stderr)
})
