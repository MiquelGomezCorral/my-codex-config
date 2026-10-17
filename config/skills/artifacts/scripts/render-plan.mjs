// Turns a Markdown plan and its review brief into artifact data and renders it with fill.py,
// so the plan page shares the artifacts engine: palette, icons, versions, and change marks.
import { spawnSync } from "node:child_process"
import { accessSync, constants, mkdtempSync, readFileSync, realpathSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const usage = "usage: node render-plan.mjs --input <plan.md> [--review <review.json>] [--output <artifact.html>] [--keep-baseline]"
const FILL = fileURLToPath(new URL("./fill.py", import.meta.url))
const ICONS = JSON.parse(readFileSync(fileURLToPath(new URL("../icons.json", import.meta.url)), "utf8"))

function tableCells(line) {
  let value = line.trim()
  if (value.startsWith("|")) value = value.slice(1)
  if (value.endsWith("|") && !value.endsWith("\\|")) value = value.slice(0, -1)
  const cells = []
  let cell = ""
  let codeMarker = null

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "\\" && value[index + 1] === "|") {
      cell += "|"
      index += 1
      continue
    }
    if (value[index] === "`") {
      const marker = value.slice(index).match(/^`+/)[0]
      codeMarker = codeMarker === marker ? null : codeMarker || marker
      cell += marker
      index += marker.length - 1
      continue
    }
    if (value[index] === "|" && !codeMarker) {
      cells.push(cell.trim())
      cell = ""
      continue
    }
    cell += value[index]
  }
  cells.push(cell.trim())
  return cells
}

function isTableSeparator(line) {
  const cells = tableCells(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function isTableRow(line) {
  return line.trim().includes("|")
}

function isFence(line) {
  return line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
}

function listItem(line) {
  const match = line.match(/^([ \t]*)([-*+]|\d+[.)])\s+(.+)$/)
  if (!match) return null
  const indent = [...match[1]].reduce((width, character) => width + (character === "\t" ? 4 : 1), 0)
  return { indent, ordered: /^\d/.test(match[2]), text: match[3] }
}

function headingLine(line) {
  return line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/)
}

function isBlockStart(lines, index) {
  const line = lines[index]
  return Boolean(
    headingLine(line)
    || isFence(line)
    || listItem(line)
    || (isTableRow(line) && index + 1 < lines.length && isTableSeparator(lines[index + 1])),
  )
}

// Returns the page's list items: strings, or { text, items, ordered } when a nested list follows.
function readList(lines, start) {
  const first = listItem(lines[start])
  const items = []
  let index = start

  while (index < lines.length) {
    if (!lines[index].trim()) {
      let next = index + 1
      while (next < lines.length && !lines[next].trim()) next += 1
      const nextItem = next < lines.length ? listItem(lines[next]) : null
      if (nextItem && nextItem.indent >= first.indent) {
        index = next
        continue
      }
      break
    }

    const current = listItem(lines[index])
    if (!current || current.indent < first.indent) break
    if (current.indent > first.indent) {
      if (!items.length) break
      const nested = readList(lines, index)
      const parent = typeof items.at(-1) === "string" ? { text: items.at(-1), items: [] } : items.at(-1)
      items[items.length - 1] = { text: parent.text, items: [...parent.items, ...nested.items], ordered: parent.ordered ?? nested.ordered }
      index = nested.index
      continue
    }
    if (current.ordered !== first.ordered) break

    let text = current.text
    index += 1
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      text += ` ${lines[index].trim()}`
      index += 1
    }
    items.push(text)
  }
  return { items, ordered: first.ordered, index }
}

// Converts Markdown to artifact blocks. A heading becomes the `heading` of the block after it;
// consecutive paragraphs share one text block, and soft line breaks become spaces.
function markdownBlocks(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n")
  const blocks = []
  let heading = null
  let index = 0

  const push = (block) => {
    if (heading) block.heading = heading
    heading = null
    blocks.push(block)
  }

  while (index < lines.length) {
    if (!lines[index].trim()) {
      index += 1
      continue
    }

    const fence = isFence(lines[index])
    if (fence) {
      const marker = fence[1]
      const code = []
      index += 1
      while (index < lines.length && !new RegExp(`^ {0,3}${marker[0]}{${marker.length},}[ \t]*$`).test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      push({ type: "code", text: code.join("\n") })
      continue
    }

    const title = headingLine(lines[index])
    if (title) {
      if (heading) push({ type: "text", text: "" })
      heading = title[2]
      index += 1
      continue
    }

    if (isTableRow(lines[index]) && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const columns = tableCells(lines[index])
      const rows = []
      index += 2
      while (index < lines.length && isTableRow(lines[index]) && lines[index].trim()) {
        const cells = tableCells(lines[index])
        rows.push(columns.map((_, column) => cells[column] ?? ""))
        index += 1
      }
      push({ type: "table", columns, rows })
      continue
    }

    if (listItem(lines[index])) {
      const list = readList(lines, index)
      push(list.ordered ? { type: "list", items: list.items, ordered: true } : { type: "list", items: list.items })
      index = list.index
      continue
    }

    const paragraph = [lines[index].trim()]
    index += 1
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    const text = paragraph.join(" ")
    const last = blocks.at(-1)
    if (!heading && last?.type === "text" && last.text) last.text += "\n\n" + text
    else push({ type: "text", text })
  }
  if (heading) push({ type: "text", text: "" })
  return blocks
}

function trimBlankLines(lines) {
  let start = 0
  let end = lines.length
  while (start < end && !lines[start].trim()) start += 1
  while (end > start && !lines[end - 1].trim()) end -= 1
  return lines.slice(start, end)
}

function parsePlan(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n")
  const plan = { title: "Implementation plan", preamble: [], sections: [] }
  let current = null
  let titleFound = false
  let fence = null

  const append = (line) => {
    if (current) current.lines.push(line)
    else plan.preamble.push(line)
  }

  for (const line of lines) {
    if (fence) {
      append(line)
      if (new RegExp(`^ {0,3}${fence[0]}{${fence.length},}[ \\t]*$`).test(line)) fence = null
      continue
    }
    const openingFence = isFence(line)
    if (openingFence) {
      fence = openingFence[1]
      append(line)
      continue
    }
    const title = line.match(/^ {0,3}#(?!#)[ \t]+(.+?)[ \t]*#*[ \t]*$/)
    if (title && !titleFound) {
      plan.title = title[1]
      titleFound = true
      continue
    }
    const section = line.match(/^ {0,3}##(?!#)[ \t]+(.+?)[ \t]*#*[ \t]*$/)
    if (section) {
      current = { title: section[1], lines: [] }
      plan.sections.push(current)
      continue
    }
    append(line)
  }

  plan.preamble = trimBlankLines(plan.preamble)
  for (const section of plan.sections) section.lines = trimBlankLines(section.lines)
  return plan
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function onlyKeys(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(field + "." + key + " is not a supported field")
  }
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(field + " must be a non-empty string")
  return value
}

function optionalIcon(value, field) {
  if (value === undefined) return null
  const name = requiredText(value, field)
  if (!ICONS[name]) throw new Error(field + " names an unknown icon: " + name + " (icons: " + Object.keys(ICONS).join(", ") + ")")
  return name
}

function validateEntries(value, field, actionTitles = false, required = true) {
  if (value === undefined && !required) return []
  if (!Array.isArray(value) || (required && !value.length)) {
    throw new Error(field + " must be a non-empty array")
  }
  return value.map((entry, index) => {
    const entryField = field + "[" + index + "]"
    if (!isRecord(entry)) throw new Error(entryField + " must be an object")
    onlyKeys(entry, ["title", "description", "technical", "icon"], entryField)
    const title = requiredText(entry.title, entryField + ".title")
    if (actionTitles) {
      const wordCount = title.trim().split(/\s+/).length
      if (wordCount < 2 || wordCount > 10) {
        throw new Error(entryField + ".title must contain 2–10 words")
      }
    }
    return {
      title,
      description: requiredText(entry.description, entryField + ".description"),
      technical: entry.technical === undefined ? null : requiredText(entry.technical, entryField + ".technical"),
      icon: optionalIcon(entry.icon, entryField + ".icon"),
    }
  })
}

function validateDetails(value) {
  if (value === undefined) return null
  const field = "--review.details"
  if (!isRecord(value)) throw new Error(field + " must be an object")
  onlyKeys(value, ["intro", "groups"], field)
  if (!Array.isArray(value.groups) || !value.groups.length) {
    throw new Error(field + ".groups must be a non-empty array")
  }
  return {
    intro: requiredText(value.intro, field + ".intro"),
    groups: value.groups.map((group, groupIndex) => {
      const groupField = field + ".groups[" + groupIndex + "]"
      if (!isRecord(group)) throw new Error(groupField + " must be an object")
      onlyKeys(group, ["title", "sections"], groupField)
      if (!Array.isArray(group.sections) || !group.sections.length) {
        throw new Error(groupField + ".sections must be a non-empty array")
      }
      return {
        title: requiredText(group.title, groupField + ".title"),
        sections: group.sections.map((section, sectionIndex) => {
          const sectionField = groupField + ".sections[" + sectionIndex + "]"
          if (!isRecord(section)) throw new Error(sectionField + " must be an object")
          onlyKeys(section, ["heading", "summary", "icon", "layered"], sectionField)
          if (section.layered !== undefined && typeof section.layered !== "boolean") {
            throw new Error(sectionField + ".layered must be a boolean")
          }
          return {
            heading: requiredText(section.heading, sectionField + ".heading"),
            summary: requiredText(section.summary, sectionField + ".summary"),
            icon: optionalIcon(section.icon, sectionField + ".icon"),
            layered: section.layered === true,
          }
        }),
      }
    }),
  }
}

function firstProseParagraph(section, field) {
  const lines = section.lines
  const start = lines.findIndex((line) => line.trim())
  if (start < 0 || isBlockStart(lines, start)) {
    throw new Error(field + " layered body must start with a prose paragraph")
  }
  let end = start + 1
  while (end < lines.length && lines[end].trim() && !isBlockStart(lines, end)) end += 1
  return {
    explanation: lines.slice(start, end).join("\n"),
    deeper: lines.slice(end).join("\n"),
  }
}

function validateDetailReferences(details, plan) {
  if (!details) return null
  const assigned = new Set()
  return {
    ...details,
    groups: details.groups.map((group, groupIndex) => ({
      ...group,
      sections: group.sections.map((reference, sectionIndex) => {
        const field = "--review.details.groups[" + groupIndex + "].sections[" + sectionIndex + "]"
        const matches = plan.sections.filter((section) => section.title === reference.heading)
        if (!matches.length) throw new Error(field + ".heading does not match a plan H2 section: " + reference.heading)
        if (matches.length > 1) throw new Error(field + ".heading matches more than one plan H2 section: " + reference.heading)
        const section = matches[0]
        if (assigned.has(section)) throw new Error(field + ".heading assigns a plan H2 section more than once: " + reference.heading)
        assigned.add(section)
        return {
          ...reference,
          section,
          body: reference.layered ? firstProseParagraph(section, field) : null,
        }
      }),
    })),
  }
}

function isWithin(directory, file) {
  const path = relative(directory, file)
  return path !== "" && path !== ".." && !path.startsWith(".." + sep) && !isAbsolute(path)
}

function resolveAsset(directory, value, field) {
  const relativePath = requiredText(value, field)
  if (
    isAbsolute(relativePath)
    || /^[a-z][a-z\d+.-]*:/i.test(relativePath)
    || relativePath.includes("\\")
    || relativePath.includes("\0")
  ) {
    throw new Error(field + " must be a relative file path beside the plan")
  }
  const base = realpathSync(directory)
  const candidate = resolve(directory, relativePath)
  if (!isWithin(resolve(directory), candidate)) {
    throw new Error(field + " must stay inside the plan directory")
  }
  let resolvedPath
  try {
    resolvedPath = realpathSync(candidate)
  } catch {
    throw new Error(field + " file does not exist: " + relativePath)
  }
  if (!isWithin(base, resolvedPath)) {
    throw new Error(field + " must stay inside the plan directory")
  }
  if (!statSync(resolvedPath).isFile()) throw new Error(field + " must point to a file: " + relativePath)
  try {
    accessSync(resolvedPath, constants.R_OK)
  } catch {
    throw new Error(field + " file is not readable: " + relativePath)
  }
  return { path: relativePath, resolvedPath }
}

function validateSteps(value, field) {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error(field + " must be a short array with at least two steps")
  }
  return value.map((step, index) => {
    const stepField = field + "[" + index + "]"
    if (!isRecord(step)) throw new Error(stepField + " must be an object")
    onlyKeys(step, ["title", "description", "icon"], stepField)
    return {
      title: requiredText(step.title, stepField + ".title"),
      description: requiredText(step.description, stepField + ".description"),
      icon: optionalIcon(step.icon, stepField + ".icon"),
    }
  })
}

function validateArtifacts(value, directory) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error("--review.artifacts must be an array")
  return value.map((artifact, index) => {
    const field = "--review.artifacts[" + index + "]"
    if (!isRecord(artifact)) throw new Error(field + " must be an object")
    onlyKeys(artifact, ["title", "caption", "steps", "path", "sourcePath", "placement"], field)
    const hasSteps = artifact.steps !== undefined
    const hasPath = artifact.path !== undefined
    if (hasSteps === hasPath) throw new Error(field + " must provide either steps or path")
    if (artifact.sourcePath !== undefined && !hasPath) {
      throw new Error(field + ".sourcePath requires path")
    }
    const placement = artifact.placement === undefined ? "side" : artifact.placement
    if (placement !== "side" && placement !== "wide") {
      throw new Error(field + '.placement must be "side" or "wide"')
    }
    return {
      title: requiredText(artifact.title, field + ".title"),
      caption: requiredText(artifact.caption, field + ".caption"),
      placement,
      path: hasPath ? resolveAsset(directory, artifact.path, field + ".path") : null,
      sourcePath: artifact.sourcePath === undefined
        ? null
        : resolveAsset(directory, artifact.sourcePath, field + ".sourcePath"),
      steps: hasSteps ? validateSteps(artifact.steps, field + ".steps") : null,
    }
  })
}

function validateReview(value, directory) {
  if (!isRecord(value)) throw new Error("--review must contain a JSON object")
  onlyKeys(value, ["title", "summary", "actions", "actionsIntro", "success", "boundary", "risks", "risksIntro", "questions", "details", "artifacts"], "--review")
  return {
    title: requiredText(value.title, "--review.title"),
    summary: requiredText(value.summary, "--review.summary"),
    actionsIntro: value.actionsIntro === undefined ? null : requiredText(value.actionsIntro, "--review.actionsIntro"),
    actions: validateEntries(value.actions, "--review.actions", true),
    success: validateEntries(value.success, "--review.success"),
    boundary: requiredText(value.boundary, "--review.boundary"),
    risks: validateEntries(value.risks, "--review.risks", false, false),
    risksIntro: value.risksIntro === undefined ? null : requiredText(value.risksIntro, "--review.risksIntro"),
    questions: validateEntries(value.questions, "--review.questions", false, false),
    details: validateDetails(value.details),
    artifacts: validateArtifacts(value.artifacts, directory),
  }
}

function entryCards(entries, defaultIcon = null) {
  return {
    type: "cards",
    items: entries.map((entry) => ({
      title: entry.title,
      text: entry.description,
      ...(entry.technical ? { inset: entry.technical } : {}),
      ...(entry.icon || defaultIcon ? { icon: entry.icon || defaultIcon } : {}),
    })),
  }
}

function assetHref(outputDirectory, file) {
  // Parentheses are encoded too, so the path is safe inside a Markdown link.
  const path = relative(outputDirectory, file).split(sep)
    .map((part) => encodeURIComponent(part).replace(/[()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()))
    .join("/")
  return path.startsWith(".") ? path : "./" + path
}

const FIGURE_TYPES = [".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".html", ".htm", ".mp4", ".webm"]

function visualBlocks(artifact, outputDirectory) {
  const side = artifact.placement === "side" ? { side: true } : {}
  if (artifact.steps) {
    return [
      { type: "text", heading: artifact.title, text: artifact.caption, ...side },
      {
        type: "steps",
        items: artifact.steps.map((step) => ({ title: step.title, text: step.description, ...(step.icon ? { icon: step.icon } : {}) })),
        ...side,
      },
    ]
  }
  const href = assetHref(outputDirectory, artifact.path.resolvedPath)
  if (!FIGURE_TYPES.includes(extname(artifact.path.path).toLowerCase())) {
    return [{ type: "text", heading: artifact.title, text: `${artifact.caption}\n\n[Open the file](${href})`, ...side }]
  }
  const source = artifact.sourcePath ? { source: assetHref(outputDirectory, artifact.sourcePath.resolvedPath) } : {}
  return [{ type: "figure", heading: artifact.title, src: href, caption: artifact.caption, alt: artifact.title, ...source, ...side }]
}

// Icons for the refine-plan template's own headings; a brief's icon wins, and any other heading gets the document icon.
const PLAN_SECTION_ICONS = {
  "planning mode": "compass", goal: "target", context: "book-open", "files touched": "files", requirements: "list-checks",
  steps: "list-ordered", "applicable instructions": "clipboard-list", "readiness check": "clipboard-check",
  "live validation": "flask-conical", "main-agent memory updates": "notebook-pen", "decision records": "scale",
  "workflow and authorizations": "key-round", "out of scope": "ban", "current behavior": "activity",
}
const planSectionIcon = (title) => PLAN_SECTION_ICONS[title.replace(/\s*\(.*\)$/, "").trim().toLowerCase()] || "file-text"

function sectionItem(section, metadata = {}) {
  const blocks = metadata.body
    ? [
      ...markdownBlocks(metadata.body.explanation),
      ...(metadata.body.deeper.trim() ? [{ type: "inset", blocks: markdownBlocks(metadata.body.deeper) }] : []),
    ]
    : markdownBlocks(section.lines.join("\n"))
  return {
    title: section.title,
    icon: metadata.icon || planSectionIcon(section.title),
    ...(metadata.summary ? { preview: metadata.summary } : {}),
    blocks,
  }
}

// Every plan section stays on the page: sections no detail group names go under "Additional details".
function detailsSection(plan, source, details) {
  const blocks = []
  if (plan.preamble.length) {
    blocks.push({
      type: "details",
      items: [{ title: "Plan notes", icon: "file-text", preview: "Opening context from the original plan.", blocks: markdownBlocks(plan.preamble.join("\n")) }],
    })
  }
  const assigned = new Set(details ? details.groups.flatMap((group) => group.sections.map((item) => item.section)) : [])
  for (const group of details?.groups || []) {
    blocks.push({ type: "details", heading: group.title, items: group.sections.map(({ section, ...metadata }) => sectionItem(section, metadata)) })
  }
  const rest = plan.sections.filter((section) => !assigned.has(section))
  if (rest.length) {
    blocks.push({ type: "details", ...(details ? { heading: "Additional details" } : {}), items: rest.map((section) => sectionItem(section)) })
  }
  blocks.push({
    type: "details",
    heading: "Source document",
    items: [{ title: "Full Markdown source", icon: "file-code", preview: "Complete Markdown used to render this page.", blocks: [{ type: "code", text: source }] }],
  })
  return { id: "details", title: "Plan details", ...(details ? { intro: details.intro } : {}), blocks }
}

function briefData(review, plan, source, outputDirectory) {
  const sideVisuals = review.artifacts.filter((artifact) => artifact.placement === "side")
  const wideVisuals = review.artifacts.filter((artifact) => artifact.placement === "wide")
  const count = review.success.length
  const sections = [{
    id: "actions",
    title: "Proposed actions",
    ...(review.actionsIntro ? { intro: review.actionsIntro } : {}),
    ...(sideVisuals.length ? { layout: "split" } : {}),
    blocks: [
      entryCards(review.actions),
      {
        type: "details",
        items: [{ title: "Expected outcomes", icon: "circle-check", preview: `${count} ${count === 1 ? "outcome" : "outcomes"}`, blocks: [entryCards(review.success, "circle-check")] }],
      },
      ...sideVisuals.flatMap((artifact) => visualBlocks(artifact, outputDirectory)),
    ],
  }]
  if (review.risks.length) {
    sections.push({ id: "risks", title: "Material risks", ...(review.risksIntro ? { intro: review.risksIntro } : {}), blocks: [entryCards(review.risks, "triangle-alert")] })
  }
  if (review.questions.length) sections.push({ id: "questions", title: "Open questions", blocks: [entryCards(review.questions)] })
  sections.push({ id: "boundary", title: "Review boundary", blocks: markdownBlocks(review.boundary) })
  if (wideVisuals.length) {
    sections.push({ id: "visuals", title: "Supporting visuals", blocks: wideVisuals.flatMap((artifact) => visualBlocks(artifact, outputDirectory)) })
  }
  sections.push(detailsSection(plan, source, review.details))
  return { eyebrow: "Plan review", title: review.title, subtitle: review.summary, sections }
}

function markdownPlanData(plan, source) {
  const summaryIndex = plan.sections.findIndex((section) => section.title.toLowerCase() === "summary")
  const summary = summaryIndex >= 0 ? plan.sections[summaryIndex].lines : plan.preamble
  const rest = { ...plan, preamble: summaryIndex >= 0 ? plan.preamble : [], sections: plan.sections.filter((_, index) => index !== summaryIndex) }
  const sections = summary.length ? [{ id: "summary", title: "Summary", blocks: markdownBlocks(summary.join("\n")) }] : []
  sections.push(detailsSection(rest, source, null))
  return { eyebrow: "Implementation plan", title: plan.title, sections }
}

function parseArgs(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (["--input", "--review", "--output"].includes(flag)) {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) throw new Error(flag + " requires a value")
      options[flag.slice(2)] = value
      index += 1
    } else if (flag === "--keep-baseline") {
      options.keepBaseline = true
    } else if (flag === "--help") {
      console.log(usage)
      return null
    } else {
      throw new Error("unknown argument: " + flag)
    }
  }
  if (!options.input) throw new Error("missing --input; " + usage)
  if (options.keepBaseline && !options.output) throw new Error("--keep-baseline requires --output")
  return options
}

function readReview(file, directory) {
  let source
  try {
    source = readFileSync(file, "utf8")
  } catch {
    throw new Error("--review file cannot be read: " + file)
  }
  let value
  try {
    value = JSON.parse(source)
  } catch {
    throw new Error("--review file is not valid JSON: " + file)
  }
  return validateReview(value, directory)
}

// fill.py owns the page: it keeps the shown version as the baseline and bumps the version.
function fillPage(data, output, keepBaseline) {
  const args = [FILL, "-", output, ...(keepBaseline ? ["--keep-baseline"] : [])]
  const result = spawnSync("python3", args, { input: JSON.stringify(data), encoding: "utf8" })
  if (result.error) throw new Error("cannot run fill.py: " + result.error.message)
  if (result.status !== 0) throw new Error("fill.py failed: " + (result.stderr || result.stdout).trim())
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options) return

  const input = resolve(options.input)
  let source
  try {
    source = readFileSync(input, "utf8")
  } catch {
    throw new Error("input plan cannot be read: " + input)
  }
  if (!source.trim()) throw new Error("input plan is empty: " + input)
  const review = options.review ? readReview(resolve(options.review), dirname(input)) : null
  const plan = parsePlan(source)
  const output = options.output ? resolve(options.output) : join(mkdtempSync(join(tmpdir(), "codex-plan-")), "plan.html")
  const data = review
    ? briefData({ ...review, details: validateDetailReferences(review.details, plan) }, plan, source, dirname(output))
    : markdownPlanData(plan, source)
  fillPage(data, output, options.keepBaseline)
  console.log(output)
}

try {
  main()
} catch (error) {
  console.error(`render-plan: ${error.message || "failed"}`)
  process.exitCode = 1
}
