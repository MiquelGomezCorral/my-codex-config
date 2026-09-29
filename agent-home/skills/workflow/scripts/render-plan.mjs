import {
  accessSync, constants, existsSync, mkdtempSync, readFileSync, realpathSync,
  renameSync, rmSync, statSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { getIcon, listIcons } from "./icons.mjs"

const usage = "usage: node render-plan.mjs --input <plan.md> [--review <review.json>] [--output <artifact.html>]"

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character])
}

function safeHref(value) {
  const href = value.trim()
  if (!href || /[\u0000-\u0020"'<>]/.test(href) || href.startsWith("//")) return null
  if (/^(?:javascript|data|vbscript):/i.test(href)) return null
  if (/^[a-z][a-z\d+.-]*:/i.test(href) && !/^(?:https?|mailto):/i.test(href)) return null
  return href
}

function findClosing(text, marker, start) {
  const closing = text.indexOf(marker, start)
  return closing < 0 ? null : closing
}

function findLinkEnd(text, start) {
  let depth = 1
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "\\") {
      index += 1
      continue
    }
    if (text[index] === "(") depth += 1
    if (text[index] === ")" && --depth === 0) return index
  }
  return null
}

function renderInline(text) {
  let output = ""
  let index = 0
  while (index < text.length) {
    if (text[index] === "`") {
      const ticks = text.slice(index).match(/^`+/)[0]
      const end = findClosing(text, ticks, index + ticks.length)
      if (end !== null) {
        output += `<code class="lp-inline-code">${escapeHtml(text.slice(index + ticks.length, end).trim())}</code>`
        index = end + ticks.length
        continue
      }
    }

    if (text[index] === "[" || text.startsWith("![", index)) {
      const image = text[index] === "!"
      const labelEnd = text.indexOf("]", index + (image ? 2 : 1))
      if (labelEnd > index && text[labelEnd + 1] === "(") {
        const linkEnd = findLinkEnd(text, labelEnd + 2)
        if (linkEnd !== null) {
          const label = text.slice(index + (image ? 2 : 1), labelEnd)
          const href = safeHref(text.slice(labelEnd + 2, linkEnd))
          const token = text.slice(index, linkEnd + 1)
          const localSvg = image && href && !href.startsWith("/") && !/^[a-z][a-z\d+.-]*:/i.test(href) && !href.split("/").includes("..") && /\.svg$/i.test(href)
          output += localSvg
            ? `<img src="${escapeHtml(href)}" alt="${escapeHtml(label)}" loading="lazy">`
            : !image && href
              ? `<a class="lp-link" href="${escapeHtml(href)}">${renderInline(label)}</a>`
              : escapeHtml(token)
          index = linkEnd + 1
          continue
        }
      }
    }

    let marker = null
    if (text.startsWith("**", index) || text.startsWith("__", index)) marker = text.slice(index, index + 2)
    else if (text[index] === "*" || text[index] === "_") marker = text[index]
    if (marker && text[index + marker.length] !== " ") {
      const end = findClosing(text, marker, index + marker.length)
      if (end !== null && end > index + marker.length) {
        const tag = marker.length === 2 ? "strong" : "em"
        output += `<${tag}>${renderInline(text.slice(index + marker.length, end))}</${tag}>`
        index = end + marker.length
        continue
      }
    }

    let next = index + 1
    while (next < text.length && !"`![*_".includes(text[next])) next += 1
    output += escapeHtml(text.slice(index, next))
    index = next
  }
  return output
}

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

function isBlockStart(lines, index) {
  const line = lines[index]
  return Boolean(
    /^ {0,3}#{1,6}[ \t]+/.test(line)
    || isFence(line)
    || listItem(line)
    || (isTableRow(line) && index + 1 < lines.length && isTableSeparator(lines[index + 1])),
  )
}

function slugify(value, used) {
  const base = value
    .replace(/[`*_~]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section"
  let slug = base
  let suffix = 2
  while (used.has(slug)) slug = `${base}-${suffix++}`
  used.add(slug)
  return slug
}

function renderTable(headerLine, separatorLine, bodyLines) {
  const headers = tableCells(headerLine)
  const alignments = tableCells(separatorLine).map((cell) => (
    cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.startsWith(":") ? "left" : cell.endsWith(":") ? "right" : ""
  ))
  const heading = headers.map((cell, index) => {
    const align = alignments[index] ? ` style="text-align:${alignments[index]}"` : ""
    return `<th scope="col"${align}>${renderInline(cell)}</th>`
  }).join("")
  const rows = bodyLines.map((line) => {
    const cells = tableCells(line)
    return `<tr>${headers.map((_, index) => {
      const align = alignments[index] ? ` style="text-align:${alignments[index]}"` : ""
      return `<td${align}>${renderInline(cells[index] ?? "")}</td>`
    }).join("")}</tr>`
  }).join("")
  return `<div class="lp-table-wrap"><table class="lp-table"><thead><tr>${heading}</tr></thead><tbody>${rows}</tbody></table></div>`
}

function renderListText(text) {
  const status = text.match(/^(allow|pass|reject|fail)\b(?:\s*[:—-]\s*)?(.*)$/i)
  if (status) {
    const value = status[1].toLowerCase()
    const kind = value === "allow" || value === "pass" ? "success" : "danger"
    const remainder = status[2].trim()
    const sentence = remainder ? remainder[0].toUpperCase() + remainder.slice(1) : ""
    return `<span class="lp-status lp-status-${kind}" data-status="${value}">${value}</span>${renderInline(sentence)}`
  }
  if (/^(?:\.\/|bun\b|npm\b|npx\b|pnpm\b|yarn\b|node\b|bash\b|deno\b|cargo\b|go test\b|pytest\b)/.test(text)) {
    return `<code class="lp-command">${escapeHtml(text)}</code>`
  }
  return renderInline(text)
}

function renderList(lines, start) {
  const first = listItem(lines[start])
  const baseIndent = first.indent
  const ordered = first.ordered
  const items = []
  let index = start

  while (index < lines.length) {
    if (!lines[index].trim()) {
      let next = index + 1
      while (next < lines.length && !lines[next].trim()) next += 1
      const nextItem = next < lines.length ? listItem(lines[next]) : null
      if (nextItem && nextItem.indent >= baseIndent) {
        index = next
        continue
      }
      break
    }

    const current = listItem(lines[index])
    if (!current || current.indent < baseIndent) break
    if (current.indent > baseIndent) {
      if (!items.length) break
      const nested = renderList(lines, index)
      items.at(-1).children.push(nested.html)
      index = nested.index
      continue
    }
    if (current.ordered !== ordered) break

    const item = { children: [], text: current.text }
    items.push(item)
    index += 1
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      item.text += ` ${lines[index].trim()}`
      index += 1
    }
  }

  const tag = ordered ? "ol" : "ul"
  const content = items.map((item) => `<li>${renderListText(item.text)}${item.children.join("")}</li>`).join("")
  return { html: `<${tag} class="lp-list">${content}</${tag}>`, index }
}

function renderMarkdown(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n")
  const usedSlugs = new Set()
  const blocks = []
  let index = 0

  while (index < lines.length) {
    if (!lines[index].trim()) {
      index += 1
      continue
    }

    const fence = isFence(lines[index])
    if (fence) {
      const marker = fence[1]
      const language = fence[2].trim().split(/[ \t]/, 1)[0]
      const code = []
      index += 1
      while (index < lines.length && !new RegExp(`^ {0,3}${marker[0]}{${marker.length},}[ \t]*$`).test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      const languageClass = language ? ` class="language-${escapeHtml(language)}"` : ""
      blocks.push(`<pre class="lp-code"><code${languageClass}>${escapeHtml(code.join("\n"))}</code></pre>`)
      continue
    }

    const heading = lines[index].match(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/)
    if (heading) {
      const level = heading[1].length
      const title = heading[2]
      blocks.push(`<h${level} class="lp-heading" id="${slugify(title, usedSlugs)}">${renderInline(title)}</h${level}>`)
      index += 1
      continue
    }

    if (isTableRow(lines[index]) && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const header = lines[index]
      const separator = lines[index + 1]
      const body = []
      index += 2
      while (index < lines.length && isTableRow(lines[index]) && lines[index].trim()) {
        body.push(lines[index])
        index += 1
      }
      blocks.push(renderTable(header, separator, body))
      continue
    }

    if (listItem(lines[index])) {
      const list = renderList(lines, index)
      blocks.push(list.html)
      index = list.index
      continue
    }

    const paragraph = [lines[index]]
    index += 1
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraph.push(lines[index])
      index += 1
    }
    blocks.push(`<p class="lp-paragraph">${renderInline(paragraph.join("\n"))}</p>`)
  }

  return blocks.join("\n")
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
  if (!getIcon(name)) throw new Error(field + " names an unknown icon: " + name)
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
    onlyKeys(entry, ["title", "description", "icon"], entryField)
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
      icon: optionalIcon(entry.icon, entryField + ".icon"),
    }
  })
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
    onlyKeys(step, ["title", "icon"], stepField)
    return {
      title: requiredText(step.title, stepField + ".title"),
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
    const path = hasPath ? resolveAsset(directory, artifact.path, field + ".path") : null
    const sourcePath = artifact.sourcePath === undefined
      ? null
      : resolveAsset(directory, artifact.sourcePath, field + ".sourcePath")
    return {
      title: requiredText(artifact.title, field + ".title"),
      caption: requiredText(artifact.caption, field + ".caption"),
      placement,
      path,
      sourcePath,
      steps: hasSteps ? validateSteps(artifact.steps, field + ".steps") : null,
    }
  })
}

function validateReview(value, directory) {
  if (!isRecord(value)) throw new Error("--review must contain a JSON object")
  onlyKeys(value, ["title", "summary", "actions", "success", "boundary", "risks", "questions", "artifacts"], "--review")
  return {
    title: requiredText(value.title, "--review.title"),
    summary: requiredText(value.summary, "--review.summary"),
    actions: validateEntries(value.actions, "--review.actions", true),
    success: validateEntries(value.success, "--review.success"),
    boundary: requiredText(value.boundary, "--review.boundary"),
    risks: validateEntries(value.risks, "--review.risks", false, false),
    questions: validateEntries(value.questions, "--review.questions", false, false),
    artifacts: validateArtifacts(value.artifacts, directory),
  }
}

function iconMarkup(name) {
  if (!name) return '<span class="lp-dot" aria-hidden="true"></span>'
  return getIcon(name).replace("<svg ", '<svg class="lp-icon" aria-hidden="true" ')
}

function renderEntries(entries, label, className, defaultIcon = null) {
  if (!entries.length) return ""
  const items = entries.map((entry) => {
    const icon = entry.icon || defaultIcon
    return '<li class="lp-entry"><span class="lp-entry-marker">' + iconMarkup(icon) + '</span>'
      + '<div><h3>' + renderInline(entry.title) + '</h3>'
      + '<p>' + renderInline(entry.description) + '</p></div></li>'
  }).join("\n")
  return '<section class="lp-entry-section ' + className + '"><h2>' + label + '</h2>'
    + '<ul class="lp-entry-list">' + items + '</ul></section>'
}

function renderSuccess(entries) {
  const count = entries.length
  const label = count === 1 ? "outcome" : "outcomes"
  return '<details class="lp-success"><summary><span>Expected outcomes</span>'
    + '<span class="lp-count">' + count + " " + label + '</span></summary>'
    + '<ul class="lp-entry-list">' + entries.map((entry) => {
      return '<li class="lp-entry"><span class="lp-entry-marker">'
        + iconMarkup(entry.icon || "circle-check") + '</span><div><h3>'
        + renderInline(entry.title) + '</h3><p>' + renderInline(entry.description)
        + '</p></div></li>'
    }).join("\n") + '</ul></details>'
}

function renderSteps(steps) {
  return '<ol class="lp-flow" aria-label="Linear flow">' + steps.map((step) => {
    return '<li><span class="lp-step-icon">' + iconMarkup(step.icon)
      + '</span><span>' + renderInline(step.title) + '</span></li>'
  }).join("\n") + '</ol>'
}

function assetHref(outputDirectory, file) {
  const path = relative(outputDirectory, file).split(sep).map(encodeURIComponent).join("/")
  return path.startsWith(".") ? path : "./" + path
}

function fileLink(href, label) {
  return '<a class="lp-file-link" href="' + escapeHtml(href)
    + '" target="_blank" rel="noopener noreferrer">' + label
    + ' <span aria-hidden="true">↗</span></a>'
}

function renderArtifactContent(artifact, outputDirectory) {
  if (artifact.steps) return renderSteps(artifact.steps)
  const href = assetHref(outputDirectory, artifact.path.resolvedPath)
  const extension = extname(artifact.path.path).toLowerCase()
  if (extension === ".html") {
    return '<iframe class="lp-html-preview" src="' + escapeHtml(href)
      + '" title="' + escapeHtml(artifact.title)
      + '" loading="lazy" sandbox="allow-scripts"></iframe>'
      + fileLink(href, "Open HTML artifact")
  }
  if ([".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(extension)) {
    return '<div class="lp-image-scroll"><a href="' + escapeHtml(href)
      + '" target="_blank" rel="noopener noreferrer" aria-label="Open full-size '
      + escapeHtml(artifact.title) + '"><img src="' + escapeHtml(href)
      + '" alt="' + escapeHtml(artifact.title) + '" loading="lazy"></a></div>'
      + fileLink(href, "Open full size")
  }
  return '<div class="lp-attachment">' + fileLink(href, "Open " + escapeHtml(artifact.title))
    + '<span>' + escapeHtml(extension ? extension.slice(1).toUpperCase() + " file" : "File")
    + '</span></div>'
}

function renderArtifact(artifact, index, outputDirectory, tabbed) {
  const id = "lp-artifact-" + (index + 1)
  const tabAttributes = tabbed
    ? ' role="tabpanel" aria-labelledby="' + id + '-tab" tabindex="0"'
    : ""
  const source = artifact.sourcePath
    ? fileLink(assetHref(outputDirectory, artifact.sourcePath.resolvedPath), "Editable source")
    : ""
  return '<article class="lp-artifact lp-artifact--' + artifact.placement + '" id="' + id
    + '" data-placement="' + artifact.placement + '"' + tabAttributes + '>'
    + '<header><div><h3>' + renderInline(artifact.title) + '</h3><p>'
    + renderInline(artifact.caption) + '</p></div></header>'
    + renderArtifactContent(artifact, outputDirectory)
    + (source ? '<p class="lp-source-link">' + source + '</p>' : "")
    + '</article>'
}

function renderArtifactTabs(artifacts) {
  if (artifacts.length < 2) return ""
  return '<div class="lp-tabs" role="tablist" aria-label="Supporting visuals">'
    + artifacts.map((artifact, index) => {
      const id = "lp-artifact-" + (index + 1)
      const selected = index === 0
      return '<button type="button" id="' + id + '-tab" role="tab" aria-controls="'
        + id + '" aria-selected="' + selected + '" tabindex="' + (selected ? "0" : "-1")
        + '">' + renderInline(artifact.title) + '</button>'
    }).join("\n") + '</div><noscript><p>Tabs need JavaScript; all artifact panels remain visible below.</p></noscript>'
}

function renderPlanDetails(plan, source) {
  const preamble = plan.preamble.length
    ? '<details class="lp-detail"><summary>Plan notes</summary><div class="lp-detail-body">'
      + renderMarkdown(plan.preamble.join("\n")) + '</div></details>'
    : ""
  const sections = plan.sections.map((section) => {
    return '<details class="lp-detail"><summary>' + renderInline(section.title)
      + '</summary><div class="lp-detail-body">'
      + renderMarkdown(section.lines.join("\n")) + '</div></details>'
  }).join("\n")
  return '<section class="lp-plan-details"><h2>Plan details</h2>'
    + preamble + sections
    + '<details class="lp-detail lp-source"><summary>Full Markdown source</summary>'
    + '<pre><code>' + escapeHtml(source) + '</code></pre></details></section>'
}

function renderBrief(review, plan, source, outputDirectory) {
  const artifacts = review.artifacts
  const gridClass = artifacts.length
    ? (artifacts.every((artifact) => artifact.placement === "wide")
      ? "lp-review-grid lp-review-grid--wide-only"
      : "lp-review-grid lp-review-grid--with-visuals")
    : "lp-review-grid lp-review-grid--no-visuals"
  const activePlacement = artifacts.length
    ? ' data-active-placement="' + artifacts[0].placement + '"'
    : ""
  const visualSlot = artifacts.length
    ? '<section class="lp-visual-slot" aria-labelledby="lp-visual-heading">'
      + '<h2 id="lp-visual-heading">Supporting visuals</h2>'
      + renderArtifactTabs(artifacts)
      + artifacts.map((artifact, index) => renderArtifact(artifact, index, outputDirectory, artifacts.length > 1)).join("\n")
      + '</section>'
    : ""
  return '<main class="lp-shell"><header class="lp-hero"><p class="lp-kicker">Plan review</p>'
    + '<h1>' + renderInline(review.title) + '</h1><div class="lp-hero-copy">'
    + renderMarkdown(review.summary) + '</div></header>'
    + '<div class="' + gridClass + '"' + activePlacement + '><section class="lp-actions">'
    + '<h2>Proposed actions</h2><ul class="lp-entry-list">'
    + review.actions.map((entry) => {
      return '<li class="lp-entry"><span class="lp-entry-marker">' + iconMarkup(entry.icon)
        + '</span><div><h3>' + renderInline(entry.title) + '</h3><p>'
        + renderInline(entry.description) + '</p></div></li>'
    }).join("\n") + '</ul>' + renderSuccess(review.success)
    + renderEntries(review.risks, "Material risks", "lp-risk", "triangle-alert")
    + renderEntries(review.questions, "Open questions", "lp-questions")
    + '<section class="lp-boundary"><h2>Review boundary</h2>'
    + renderMarkdown(review.boundary) + '</section></section>' + visualSlot + '</div>'
    + renderPlanDetails(plan, source) + '</main>'
}

function renderMarkdownPlan(plan, source) {
  const summaryIndex = plan.sections.findIndex((section) => section.title.toLowerCase() === "summary")
  const summary = summaryIndex >= 0 ? plan.sections[summaryIndex].lines : plan.preamble
  const sections = summaryIndex >= 0
    ? plan.sections.filter((_, index) => index !== summaryIndex)
    : plan.sections
  return '<main class="lp-shell"><header class="lp-hero"><p class="lp-kicker">Implementation plan</p>'
    + '<h1>' + renderInline(plan.title) + '</h1>'
    + (summary.length ? '<div class="lp-hero-copy">' + renderMarkdown(summary.join("\n")) + '</div>' : "")
    + '</header>' + renderPlanDetails({ ...plan, sections }, source) + '</main>'
}

function renderDocument(source, review, outputDirectory) {
  const plan = parsePlan(source)
  const body = review
    ? renderBrief(review, plan, source, outputDirectory)
    : renderMarkdownPlan(plan, source)
  const style = [
    ":root { color-scheme: dark; --lp-bg: #12171e; --lp-surface: #1a212a; --lp-raised: #222b36; --lp-text: #edf1f6; --lp-muted: #b5bfcb; --lp-accent: #66baf2; --lp-border: #35414e; --lp-success: #79d6b0; --lp-danger: #ff9888; }",
    "html, body { margin: 0; min-height: 100%; background: var(--lp-bg); color: var(--lp-text); }",
    "body { font: 14px/1.55 system-ui, sans-serif; }",
    "*, *::before, *::after { box-sizing: border-box; }",
    ".lp-shell { width: 100%; max-width: none; margin: 0; padding: 1.4rem clamp(1rem, 2.7vw, 2.75rem) 3.5rem; }",
    ".lp-hero { border-bottom: 1px solid var(--lp-border); padding: 0 0 1rem; }",
    ".lp-kicker { color: var(--lp-muted); font-size: .75rem; letter-spacing: .08em; margin: 0 0 .45rem; text-transform: uppercase; }",
    ".lp-hero h1 { font-size: 24px; line-height: 1.2; margin: 0; }",
    ".lp-hero-copy { color: var(--lp-muted); margin-top: .4rem; }",
    ".lp-hero-copy .lp-paragraph { margin: 0; }",
    ".lp-review-grid { display: block; margin-top: 1.6rem; }",
    ".lp-review-grid--with-visuals, .lp-review-grid--wide-only { gap: 1.3rem; }",
    ".js-enabled .lp-review-grid--with-visuals { display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); grid-template-areas: \"actions visuals\"; align-items: start; }",
    ".js-enabled .lp-review-grid--wide-only, .js-enabled .lp-review-grid--with-visuals[data-active-placement=\"wide\"] { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: \"actions\" \"visuals\"; }",
    ".lp-review-grid--no-visuals { display: block; }",
    ".lp-actions { grid-area: actions; min-width: 0; }",
    ".lp-actions > h2, .lp-visual-slot > h2, .lp-plan-details > h2 { font-size: 17px; line-height: 1.3; margin: 0 0 .85rem; }",
    ".lp-entry-list { list-style: none; margin: 0; padding: 0; }",
    ".lp-entry { display: grid; grid-template-columns: 1.25rem minmax(0, 1fr); gap: .65rem; margin: .85rem 0; }",
    ".lp-entry-marker { color: var(--lp-accent); padding-top: .12rem; }",
    ".lp-dot { display: block; width: .58rem; height: .58rem; margin: .38rem 0 0 .14rem; border-radius: 50%; background: var(--lp-accent); }",
    ".lp-icon { display: block; width: 1.1rem; height: 1.1rem; stroke: currentColor; }",
    ".lp-entry h3, .lp-artifact h3 { font-size: 14px; font-weight: 650; line-height: 1.4; margin: 0; }",
    ".lp-entry p, .lp-artifact header p { color: var(--lp-muted); margin: .16rem 0 0; }",
    ".lp-success, .lp-risk, .lp-questions, .lp-boundary { margin-top: 1rem; }",
    ".lp-success { border: 1px solid var(--lp-border); border-radius: .45rem; padding: .72rem .85rem; }",
    ".lp-success summary { align-items: center; cursor: pointer; display: flex; font-weight: 650; justify-content: space-between; gap: 1rem; }",
    ".lp-count { color: var(--lp-muted); font-size: .82rem; font-weight: 400; }",
    ".lp-success .lp-entry-list { padding-top: .5rem; }",
    ".lp-risk .lp-entry, .lp-questions .lp-entry { border: 1px solid var(--lp-border); border-radius: .45rem; margin: .5rem 0; padding: .7rem .8rem; }",
    ".lp-risk .lp-entry-marker { color: var(--lp-danger); }",
    ".lp-boundary { border-top: 1px solid var(--lp-border); padding-top: .8rem; }",
    ".lp-boundary h2, .lp-entry-section h2 { font-size: 14px; margin: 0 0 .4rem; }",
    ".lp-boundary p { color: var(--lp-muted); margin: .25rem 0; }",
    ".lp-visual-slot { grid-area: visuals; min-width: 0; }",
    ".lp-visual-slot > h2 { margin-bottom: .55rem; }",
    ".lp-artifact { background: var(--lp-surface); border: 1px solid var(--lp-border); border-radius: .5rem; margin-top: .6rem; min-width: 0; padding: .85rem; }",
    ".lp-artifact header { align-items: flex-start; display: flex; justify-content: space-between; gap: 1rem; margin-bottom: .85rem; }",
    ".lp-tabs { border-bottom: 1px solid var(--lp-border); display: flex; gap: .3rem; overflow-x: auto; }",
    ".lp-tabs button { background: transparent; border: 0; border-bottom: 2px solid transparent; color: var(--lp-muted); cursor: pointer; font: inherit; padding: .55rem .65rem; white-space: nowrap; }",
    ".lp-tabs button[aria-selected=\"true\"] { border-bottom-color: var(--lp-accent); color: var(--lp-text); }",
    ".lp-tabs button:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid var(--lp-accent); outline-offset: 3px; }",
    ".lp-flow { display: grid; gap: .7rem; grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr)); list-style: none; margin: .5rem 0; padding: 0; }",
    ".lp-flow li { align-items: center; background: var(--lp-raised); border: 1px solid var(--lp-border); border-radius: .45rem; display: flex; flex-direction: column; gap: .4rem; justify-content: center; min-height: 6rem; padding: .8rem; position: relative; text-align: center; }",
    ".lp-flow li:not(:last-child)::after { color: var(--lp-accent); content: \"→\"; font-size: 1.25rem; position: absolute; right: -.55rem; top: 50%; transform: translate(50%, -50%); z-index: 1; }",
    ".lp-step-icon { color: var(--lp-accent); }",
    ".lp-image-scroll { max-width: 100%; overflow: auto; }",
    ".lp-image-scroll img { display: block; height: auto; max-width: none; width: auto; }",
    ".lp-html-preview { background: #fff; border: 1px solid var(--lp-border); border-radius: .35rem; height: min(70vh, 52rem); min-height: 28rem; width: 100%; }",
    ".lp-file-link { color: var(--lp-accent); display: inline-block; margin-top: .45rem; text-decoration-thickness: .08em; }",
    ".lp-attachment { align-items: center; background: var(--lp-raised); border: 1px solid var(--lp-border); border-radius: .4rem; display: flex; justify-content: space-between; gap: 1rem; padding: .8rem; }",
    ".lp-attachment .lp-file-link { margin: 0; }",
    ".lp-attachment > span, .lp-source-link { color: var(--lp-muted); font-size: .85rem; }",
    ".lp-source-link { margin: .5rem 0 0; }",
    ".lp-plan-details { margin-top: 2.2rem; }",
    ".lp-detail { border: 1px solid var(--lp-border); border-radius: .35rem; margin: .35rem 0; }",
    ".lp-detail summary { align-items: center; color: var(--lp-text); cursor: pointer; display: flex; font-weight: 600; justify-content: space-between; padding: .72rem .85rem; }",
    ".lp-detail-body { border-top: 1px solid var(--lp-border); overflow-wrap: anywhere; padding: .65rem .85rem .9rem; }",
    ".lp-detail-body > :first-child { margin-top: 0; }",
    ".lp-detail-body > :last-child { margin-bottom: 0; }",
    ".lp-heading { font-size: 16px; line-height: 1.3; margin: 1.35em 0 .55em; }",
    ".lp-paragraph { margin: .65rem 0; }",
    ".lp-list { margin: .35rem 0; padding-inline-start: 1.35rem; }",
    ".lp-list li { margin: .35rem 0; }",
    ".lp-code, .lp-source pre { background: #0c1015; border: 1px solid var(--lp-border); border-radius: .35rem; max-width: 100%; overflow: auto; padding: .85rem; }",
    ".lp-code code, .lp-source code { font: .9em/1.5 ui-monospace, monospace; white-space: pre; }",
    ".lp-inline-code, .lp-command { background: #0c1015; border: 1px solid var(--lp-border); border-radius: .25rem; color: var(--lp-accent); padding: .08em .3em; }",
    ".lp-table-wrap { max-width: 100%; overflow-x: auto; }",
    ".lp-table { border-collapse: collapse; min-width: 30rem; width: 100%; }",
    ".lp-table th, .lp-table td { border: 1px solid var(--lp-border); padding: .55rem .7rem; text-align: start; vertical-align: top; }",
    ".lp-table th { background: var(--lp-raised); }",
    ".lp-link { color: var(--lp-accent); }",
    "img, video, canvas, iframe { max-width: 100%; }",
    "pre, table { max-width: 100%; }",
    "@media (max-width: 44rem) { .js-enabled .lp-review-grid--with-visuals, .js-enabled .lp-review-grid--wide-only, .js-enabled .lp-review-grid--with-visuals[data-active-placement=\"wide\"] { display: block; } .lp-visual-slot { margin-top: 1.2rem; } .lp-flow { grid-template-columns: 1fr; } .lp-flow li:not(:last-child)::after { content: \"↓\"; bottom: -.8rem; right: 50%; top: auto; transform: translate(50%, 50%); } .lp-attachment { align-items: flex-start; flex-direction: column; } }",
  ].join("\n")
  const tabsScript = review && review.artifacts.length ? [
    "<script>",
    "(() => {",
    '  document.documentElement.classList.add("js-enabled");',
    '  const grid = document.querySelector(".lp-review-grid");',
    '  const tabs = Array.from(document.querySelectorAll(".lp-tabs [role=tab]"));',
    "  if (!grid || !tabs.length) return;",
    "  const select = (index, moveFocus = false) => {",
    '    const panel = document.getElementById(tabs[index].getAttribute("aria-controls"));',
    "    tabs.forEach((tab, tabIndex) => {",
    '      const selected = tabIndex === index;',
    '      tab.setAttribute("aria-selected", String(selected));',
    '      tab.setAttribute("tabindex", selected ? "0" : "-1");',
    '      document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;',
    "    });",
    '    grid.dataset.activePlacement = panel.dataset.placement;',
    "    if (moveFocus) tabs[index].focus();",
    "  };",
    "  tabs.forEach((tab, index) => {",
    '    tab.addEventListener("click", () => select(index));',
    '    tab.addEventListener("keydown", (event) => {',
    "      let next = index;",
    '      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;',
    '      else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;',
    '      else if (event.key === "Home") next = 0;',
    '      else if (event.key === "End") next = tabs.length - 1;',
    "      else return;",
    "      event.preventDefault();",
    "      select(next, true);",
    "    });",
    "  });",
    "  select(0);",
    "})();",
    "</script>",
  ].join("\n") : ""
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<meta name="color-scheme" content="dark">\n<title>' + escapeHtml(review ? review.title : plan.title)
    + '</title>\n<style>\n' + style + '\n</style>\n</head>\n<body>\n'
    + body + '\n' + tabsScript + '\n</body>\n</html>\n'
}

function parseArgs(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (["--input", "--review", "--output", "--icon"].includes(flag)) {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) throw new Error(flag + " requires a value")
      options[flag.slice(2)] = value
      index += 1
    } else if (flag === "--list-icons") {
      options.listIcons = true
    } else if (flag === "--help") {
      console.log(usage + "\n       node render-plan.mjs --list-icons\n       node render-plan.mjs --icon <name>")
      return null
    } else {
      throw new Error("unknown argument: " + flag)
    }
  }
  if (options.listIcons || options.icon) {
    if (options.listIcons && options.icon) throw new Error("--list-icons and --icon cannot be combined")
    if (options.input || options.review || options.output) {
      throw new Error("icon lookup cannot be combined with plan rendering")
    }
    return options
  }
  if (!options.input) throw new Error("missing --input; " + usage)
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

function writeArtifact(render, requestedOutput) {
  if (!requestedOutput) {
    const directory = mkdtempSync(join(tmpdir(), "codex-plan-"))
    const path = join(directory, "plan.html")
    writeFileSync(path, render(directory), { encoding: "utf8", flag: "wx" })
    return path
  }

  const output = resolve(requestedOutput)
  const parent = dirname(output)
  if (!existsSync(parent) || !statSync(parent).isDirectory()) throw new Error("output directory does not exist")
  accessSync(parent, constants.W_OK)
  if (existsSync(output)) {
    if (!statSync(output).isFile()) throw new Error("output path is not a file")
    accessSync(output, constants.W_OK)
  }
  const temporary = mkdtempSync(join(parent, ".render-plan-"))
  try {
    const path = join(temporary, "plan.html")
    writeFileSync(path, render(parent), { encoding: "utf8", flag: "wx" })
    renameSync(path, output)
    return output
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options) return
  if (options.listIcons) {
    console.log(listIcons())
    return
  }
  if (options.icon) {
    const icon = getIcon(options.icon)
    if (!icon) throw new Error("--icon names an unknown icon: " + options.icon)
    console.log(icon)
    return
  }

  const input = resolve(options.input)
  let source
  try {
    source = readFileSync(input, "utf8")
  } catch {
    throw new Error("input plan cannot be read: " + input)
  }
  if (!source.trim()) throw new Error("input plan is empty: " + input)
  const review = options.review ? readReview(resolve(options.review), dirname(input)) : null
  const path = writeArtifact(
    (outputDirectory) => renderDocument(source, review, outputDirectory),
    options.output,
  )
  console.log(resolve(path))
}

try {
  main()
} catch (error) {
  console.error(`render-plan: ${error.message || "failed"}`)
  process.exitCode = 1
}
