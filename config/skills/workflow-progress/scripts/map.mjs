import { createHash, randomUUID } from "node:crypto"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { applyTemplate, esc } from "../vendor/archify/utils.mjs"
import { stages, stepById } from "./stages.mjs"

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
export const defaultMapPath = resolve(scriptDirectory, "../assets/map.json")
const templatePath = resolve(scriptDirectory, "../vendor/archify/template.html")
const viewerScriptPath = resolve(scriptDirectory, "map-viewer.js")
const provenancePath = resolve(scriptDirectory, "../vendor/archify/provenance.json")
const allowedKinds = new Set(["frontend", "backend", "database", "cloud", "security", "messagebus", "external"])
const metadataFields = new Set(["description", "context", "tag"])
const cellIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
const stepFields = new Set(["anchors", ...metadataFields])
const nodeFields = new Set(["kind", ...metadataFields])
const mapFields = new Set(["version", "source", "svg", "steps", "focusBoxes", "nodes"])

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex")
}

export function safeJson(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029")
}

function validateText(value, field) {
  if (typeof value !== "string" || value.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) {
    throw new Error(`${field} must be text of at most 500 characters`)
  }
}

function validateMetadata(value, field, allowedFields, { requireKind = false, requireAnchors = false } = {}) {
  if (!isRecord(value)) throw new Error(`${field} must be an object`)
  for (const key of Object.keys(value)) {
    if (!allowedFields.has(key)) throw new Error(`${field} has unknown field ${key}`)
  }
  if (requireKind && !allowedKinds.has(value.kind)) throw new Error(`${field}.kind must be a native palette category`)
  if (value.kind !== undefined && !allowedKinds.has(value.kind)) throw new Error(`${field}.kind must be a native palette category`)
  if (requireAnchors && !Array.isArray(value.anchors)) throw new Error(`${field}.anchors must be a non-empty array`)
  if (value.anchors !== undefined) {
    if (!Array.isArray(value.anchors) || !value.anchors.length || value.anchors.some((id) => typeof id !== "string" || !cellIdPattern.test(id))) {
      throw new Error(`${field}.anchors must be a non-empty array of cell IDs`)
    }
    if (new Set(value.anchors).size !== value.anchors.length) throw new Error(`${field}.anchors cannot repeat a cell ID`)
  }
  for (const key of metadataFields) {
    if (value[key] !== undefined) validateText(value[key], `${field}.${key}`)
  }
}

function assetPath(directory, value, field) {
  if (typeof value !== "string" || !value.trim() || isAbsolute(value)) {
    throw new Error(`map ${field} must be a relative path`)
  }
  const base = resolve(directory)
  const result = resolve(base, value)
  const remainder = relative(base, result)
  if (!remainder || remainder === ".." || remainder.startsWith(`..${sep}`) || isAbsolute(remainder)) {
    throw new Error(`map ${field} must stay inside its configuration directory`)
  }
  return result
}

export function validateMapConfiguration(configuration) {
  if (!isRecord(configuration)) throw new Error("map configuration must be an object")
  for (const key of Object.keys(configuration)) {
    if (!mapFields.has(key)) throw new Error(`map configuration has unknown field ${key}`)
  }
  if (configuration.version !== 1) throw new Error("map configuration version must be 1")
  if (typeof configuration.source !== "string" || !configuration.source.trim()) throw new Error("map source must be a relative path")
  if (typeof configuration.svg !== "string" || !configuration.svg.trim()) throw new Error("map svg must be a relative path")
  if (!isRecord(configuration.steps)) throw new Error("map steps must be an object")
  const knownSteps = new Set(stages.flatMap((stage) => stage.steps.map((step) => step.id)))
  for (const step of knownSteps) {
    if (!configuration.steps[step]) throw new Error(`map is missing step ${step}`)
    validateMetadata(configuration.steps[step], `map.steps.${step}`, stepFields, { requireAnchors: true })
  }
  for (const step of Object.keys(configuration.steps)) {
    if (!knownSteps.has(step)) throw new Error(`map refers to unknown step ${step}`)
  }
  if (configuration.nodes !== undefined && !isRecord(configuration.nodes)) throw new Error("map nodes must be an object")
  for (const [id, node] of Object.entries(configuration.nodes ?? {})) {
    if (!cellIdPattern.test(id)) throw new Error(`map has invalid node ID ${id}`)
    validateMetadata(node, `map.nodes.${id}`, nodeFields, { requireKind: true })
  }
  if (configuration.focusBoxes !== undefined && !isRecord(configuration.focusBoxes)) throw new Error("map focusBoxes must be an object")
  const selectableIds = new Set([
    ...Object.keys(configuration.nodes ?? {}),
    ...Object.values(configuration.steps).flatMap((entry) => entry.anchors),
  ])
  for (const [boxId, members] of Object.entries(configuration.focusBoxes ?? {})) {
    if (!cellIdPattern.test(boxId)) throw new Error(`map has invalid focus box ID ${boxId}`)
    if (selectableIds.has(boxId)) throw new Error(`map focus box ${boxId} cannot be a selectable node`)
    if (!Array.isArray(members) || !members.length || members.some((id) => typeof id !== "string" || !cellIdPattern.test(id))) {
      throw new Error(`map focus box ${boxId} must list selectable node IDs`)
    }
    if (new Set(members).size !== members.length) throw new Error(`map focus box ${boxId} repeats a member ID`)
    for (const id of members) {
      if (!selectableIds.has(id)) throw new Error(`map focus box ${boxId} uses unknown node ${id}`)
    }
  }
  return configuration
}

export function readMapConfiguration(mapPath = defaultMapPath) {
  const path = resolve(mapPath)
  let configuration
  try {
    configuration = JSON.parse(readFileSync(path, "utf8"))
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`map configuration is invalid JSON: ${path}`)
    throw new Error(`map configuration cannot be read: ${path}`)
  }
  validateMapConfiguration(configuration)
  const directory = dirname(path)
  return {
    configuration,
    directory,
    sourcePath: assetPath(directory, configuration.source, "source"),
    svgPath: assetPath(directory, configuration.svg, "svg"),
  }
}

export function validateMapInfo(value, configuration) {
  if (!isRecord(value)) throw new Error("map info must be an object")
  for (const key of Object.keys(value)) {
    if (key !== "nodes" && key !== "steps") throw new Error(`map info has unknown field ${key}`)
  }
  if (value.nodes !== undefined && !isRecord(value.nodes)) throw new Error("map info nodes must be an object")
  if (value.steps !== undefined && !isRecord(value.steps)) throw new Error("map info steps must be an object")
  const nodeIds = new Set(Object.keys(configuration.nodes ?? {}))
  for (const entry of Object.values(configuration.steps)) {
    for (const id of entry.anchors) nodeIds.add(id)
  }
  const knownSteps = new Set(stepById.keys())
  for (const [id, metadata] of Object.entries(value.nodes ?? {})) {
    if (!nodeIds.has(id)) throw new Error(`map info refers to unknown node ${id}`)
    validateMetadata(metadata, `map info node ${id}`, nodeFields)
  }
  for (const [step, metadata] of Object.entries(value.steps ?? {})) {
    if (!knownSteps.has(step)) throw new Error(`map info refers to unknown step ${step}`)
    validateMetadata(metadata, `map info step ${step}`, stepFields)
    for (const id of metadata.anchors ?? []) {
      if (!nodeIds.has(id)) throw new Error(`map info step ${step} uses unknown node ${id}`)
    }
  }
  return value
}

export function overlayMapInfo(configuration, ...infoRecords) {
  const result = structuredClone(configuration)
  for (const info of infoRecords) {
    for (const [id, fields] of Object.entries(info?.nodes ?? {})) {
      result.nodes ??= {}
      result.nodes[id] = { ...(result.nodes[id] ?? {}), ...fields }
    }
    for (const [id, fields] of Object.entries(info?.steps ?? {})) {
      result.steps[id] = { ...(result.steps[id] ?? {}), ...fields }
    }
  }
  return result
}

function browserScript() {
  return readFileSync(viewerScriptPath, "utf8")
}

function nativeShell(svgText, configuration) {
  const input = safeJson({ mode: "viewer", svgText, configuration })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" role="img" aria-label="Workflow map"><script type="application/json" id="workflow-map-input">${input}</script></svg><script>${browserScript()}</script>`
}

const viewerCsp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
const standaloneTheme = `<script>(function(){try{var url=new URL(window.location.href);var theme=url.searchParams.get("theme");if(theme!=="dark"&&theme!=="light"){url.searchParams.set("theme","dark");window.history.replaceState(null,"",url.href)}}catch(_){}})()</script>`

export function renderNativeMap(svgText, configuration) {
  validateMapConfiguration(configuration)
  const template = readFileSync(templatePath, "utf8")
  const warning = `    <p id="workflow-map-warning" role="status" aria-live="polite" hidden style="margin:0;padding:0.75rem;color:#ffd0d0;background:#2a1717"></p>`
  const diagramContainerSeam = `    <div class="diagram-container" data-detail-level="read"
         data-preset-badge-editorial-plate="{{i18n:viewer.preset.badge.editorialPlate}}">`
  if (!template.includes(diagramContainerSeam)) throw new Error("native template missing diagram-container seam")
  const templateWithWarning = template.replace(diagramContainerSeam, () => `${warning}\n${diagramContainerSeam}`)
  let html = applyTemplate(templateWithWarning, {
    title: "Workflow map",
    subtitle: "Native workflow context from the editable draw.io source.",
    svg: nativeShell(svgText, configuration),
    cards: "",
    locale: "en",
    visualPreset: "signal-flow",
  })
  html = html.replace("<meta charset=\"UTF-8\">", `<meta charset="UTF-8">\n  <meta http-equiv="Content-Security-Policy" content="${viewerCsp}">\n  ${standaloneTheme}`)
  return html
}

export function renderMapInspection(svgText, configuration) {
  const input = safeJson({ mode: "inspect", svgText, configuration })
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${viewerCsp}">
  <title>Workflow map inspection</title>
  <style>body{font:14px/1.5 system-ui,sans-serif;margin:24px;max-width:1100px}pre{white-space:pre-wrap;overflow-wrap:break-word}</style>
</head>
<body>
  <h1>Workflow map inspection</h1>
  <p>Open this file in a browser. The inventory is also exposed as <code>window.workflowMapInventory</code>.</p>
  <pre id="workflow-map-inventory">Inspection is loading.</pre>
  <script type="application/json" id="workflow-map-input">${input}</script>
  <script>${browserScript()}</script>
</body>
</html>
`
}

function stageWrite(path, content, mode = 0o600) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const temporary = join(dirname(path), `.workflow-map-${randomUUID()}.tmp`)
  try {
    writeFileSync(temporary, content, { encoding: "utf8", flag: "wx", mode })
    return temporary
  } catch (error) {
    rmSync(temporary, { force: true })
    throw error
  }
}

function atomicWrite(path, content, mode = 0o600) {
  const temporary = stageWrite(path, content, mode)
  try {
    renameSync(temporary, path)
  } catch (error) {
    rmSync(temporary, { force: true })
    throw error
  }
}

export function inspectMap(mapPath, outputPath) {
  if (!mapPath || !outputPath) throw new Error("inspect-map requires --map and --output")
  const map = readMapConfiguration(mapPath)
  const svgText = readFileSync(map.svgPath, "utf8")
  const output = resolve(outputPath)
  atomicWrite(output, renderMapInspection(svgText, map.configuration))
  console.log(output)
}

function commandResult(executable, args, field) {
  const result = spawnSync(executable, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  if (result.error) throw new Error(`${field} failed: ${result.error.message}`)
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim().slice(0, 1200)
    throw new Error(`${field} failed${detail ? `: ${detail}` : ` with exit code ${result.status}`}`)
  }
  return result
}

function validateExport(svg) {
  if (!/<svg\b/.test(svg) || !/\bviewBox="[^"]+"/.test(svg)) throw new Error("draw.io did not produce an SVG with a viewBox")
  if (!/\bcontent="[^"]*mxGraphModel/.test(svg)) throw new Error("draw.io SVG is missing its uncompressed embedded model")
}

function provenanceUpdate(mapPath, exportDetails) {
  const resolvedMapPath = resolve(mapPath)
  const outputPath = resolvedMapPath === defaultMapPath
    ? provenancePath
    : join(dirname(resolvedMapPath), "build-provenance.json")
  if (outputPath === resolvedMapPath) throw new Error("custom map configuration conflicts with its build-provenance output")
  let provenance = {}
  if (outputPath === provenancePath) provenance = JSON.parse(readFileSync(outputPath, "utf8"))
  provenance.drawioExport = exportDetails
  return {
    path: outputPath,
    content: `${JSON.stringify(provenance, null, 2)}\n`,
    mode: outputPath === provenancePath ? 0o644 : 0o600,
  }
}

function existingBytes(path) {
  try {
    return readFileSync(path)
  } catch (error) {
    if (error.code === "ENOENT") return null
    throw error
  }
}

function restoreFile(path, contents, mode) {
  if (contents === null) rmSync(path, { force: true })
  else atomicWrite(path, contents, mode)
}

export function rebuildMap(mapPath, executable) {
  if (!mapPath || !executable) throw new Error("rebuild-map requires --map and --drawio")
  const map = readMapConfiguration(mapPath)
  const versionResult = commandResult(executable, ["--version"], "draw.io version check")
  const version = versionResult.stdout.trim()
  if (!version) throw new Error("draw.io returned an empty version")
  const sourceBytes = readFileSync(map.sourcePath)
  const temporaryDirectory = mkdtempSync(join(dirname(map.svgPath), ".workflow-map-export-"))
  const temporarySvg = join(temporaryDirectory, basename(map.svgPath))
  let temporaryProvenance = null
  try {
    commandResult(executable, [
      "--export", "--format", "svg", "--uncompressed", "--embed-diagram", "--transparent",
      "--output", temporarySvg, map.sourcePath,
    ], "draw.io export")
    const svg = readFileSync(temporarySvg, "utf8")
    validateExport(svg)
    const details = {
      tool: "draw.io Desktop",
      version,
      settings: ["--format svg", "--uncompressed", "--embed-diagram", "--transparent"],
      source: { path: relative(map.directory, map.sourcePath), sha256: digest(sourceBytes) },
      svg: { path: relative(map.directory, map.svgPath), sha256: digest(svg) },
    }
    const provenance = provenanceUpdate(mapPath, details)
    const previousProvenance = existingBytes(provenance.path)
    temporaryProvenance = stageWrite(provenance.path, provenance.content, provenance.mode)
    let provenanceCommitted = false
    try {
      renameSync(temporaryProvenance, provenance.path)
      temporaryProvenance = null
      provenanceCommitted = true
      renameSync(temporarySvg, map.svgPath)
    } catch (error) {
      if (provenanceCommitted) {
        try {
          restoreFile(provenance.path, previousProvenance, provenance.mode)
        } catch (rollbackError) {
          throw new Error(`${error.message}; build-provenance rollback failed: ${rollbackError.message}`)
        }
      }
      throw error
    }
    console.log(map.svgPath)
  } finally {
    if (temporaryProvenance) rmSync(temporaryProvenance, { force: true })
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }
}

export function mapConfigurationFromState(state) {
  const configuration = state.run.mapConfig ?? readMapConfiguration().configuration
  const directory = state.run.mapDirectory ?? dirname(defaultMapPath)
  validateMapConfiguration(configuration)
  if (typeof directory !== "string" || !isAbsolute(directory)) throw new Error("saved map directory must be an absolute path")
  return { configuration, directory, svgPath: assetPath(directory, configuration.svg, "svg") }
}

export function mapConfigurationForStandalone(state) {
  const map = mapConfigurationFromState(state)
  const slice = state.slices.find((entry) => entry.id === state.run.currentSliceId)
  return {
    ...map,
    configuration: overlayMapInfo(map.configuration, state.run.mapInfo, slice?.mapInfo),
  }
}

export function buildMapViewer(configuration, directory) {
  const svgPath = assetPath(directory, configuration.svg, "svg")
  return renderNativeMap(readFileSync(svgPath, "utf8"), configuration)
}

export function writeMapViewer(path, configuration, directory) {
  atomicWrite(path, buildMapViewer(configuration, directory))
}

export function renderMapError(error) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Workflow map unavailable</title><style>body{margin:1rem;background:#101113;color:#ececec;font:14px/1.5 system-ui,sans-serif}</style><main><h1>Workflow map unavailable</h1><p>${esc(String(error?.message ?? error))}</p></main></html>`
}
