import {
  accessSync, constants, existsSync, mkdtempSync, readFileSync,
  renameSync, rmSync, statSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

const usage = "usage: node render-plan.mjs --input <plan.md> [--output <artifact.html>]"

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

    if (text[index] === "[") {
      const labelEnd = text.indexOf("]", index + 1)
      if (labelEnd > index && text[labelEnd + 1] === "(") {
        const linkEnd = findLinkEnd(text, labelEnd + 2)
        if (linkEnd !== null) {
          const label = text.slice(index + 1, labelEnd)
          const href = safeHref(text.slice(labelEnd + 2, linkEnd))
          const token = text.slice(index, linkEnd + 1)
          output += href
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
    while (next < text.length && !"`[*_".includes(text[next])) next += 1
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

function dedent(lines) {
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^[ \t]*/)[0].replace(/\t/g, "    ").length)
  const width = indents.length ? Math.min(...indents) : 0
  return lines.map((line) => {
    let index = 0
    let removed = 0
    while (index < line.length && removed < width && /[ \t]/.test(line[index])) {
      removed += line[index] === "\t" ? 4 : 1
      index += 1
    }
    return line.slice(index)
  })
}

function structuralListItems(lines) {
  const items = []
  let fence = null
  for (let index = 0; index < lines.length; index += 1) {
    if (fence) {
      if (new RegExp(`^ {0,3}${fence[0]}{${fence.length},}[ \\t]*$`).test(lines[index])) fence = null
      continue
    }
    const openingFence = isFence(lines[index])
    if (openingFence) {
      fence = openingFence[1]
      continue
    }
    const item = listItem(lines[index])
    if (item) items.push({ index, item })
  }
  return items
}

function sectionEntries(lines) {
  const items = structuralListItems(lines)
  if (!items.length) return { intro: lines, entries: [] }
  const baseIndent = Math.min(...items.map(({ item }) => item.indent))
  const itemsByIndex = new Map(items.map(({ index, item }) => [index, item]))
  const entries = []
  const first = items.find(({ item }) => item.indent === baseIndent)
  const intro = lines.slice(0, first.index)
  let current = null

  for (let index = first.index; index < lines.length; index += 1) {
    const item = itemsByIndex.get(index)
    if (item && item.indent === baseIndent) {
      if (current) entries.push(current)
      current = { title: item.text, lines: [] }
    } else if (current) {
      current.lines.push(lines[index])
    }
  }
  if (current) entries.push(current)
  return { intro: trimBlankLines(intro), entries }
}

function cleanGroupTitle(value) {
  return value.replace(/\s*:\s*$/, "").trim()
}

function renderGroupRow(entry) {
  const title = cleanGroupTitle(entry.title)
  const body = trimBlankLines(dedent(entry.lines))
  const commandGroup = /^(?:run|checks?|commands?|verification)\b/i.test(title)
  const bodyHtml = body.length ? renderMarkdown(body.join("\n")) : ""
  return `<article class="lp-group-row${commandGroup ? " lp-command-row" : ""}">
        <h3>${renderInline(title)}</h3>
        <div class="lp-group-content">${bodyHtml}</div>
      </article>`
}

function renderSection(section) {
  const structured = sectionEntries(section.lines)
  const grouped = structured.entries.filter((entry) => structuralListItems(trimBlankLines(entry.lines)).length)
  const simple = structured.entries.filter((entry) => !grouped.includes(entry))
  const intro = structured.intro.length ? `<div class="lp-section-intro">${renderMarkdown(structured.intro.join("\n"))}</div>` : ""

  let content
  if (grouped.length) {
    const rows = grouped.map(renderGroupRow)
    if (simple.length) {
      const list = simple.map((entry) => `- ${entry.title}`).join("\n")
      rows.push(`<article class="lp-group-row"><h3>Additional decisions</h3><div class="lp-group-content">${renderMarkdown(list)}</div></article>`)
    }
    content = `${intro}<div class="lp-rows">${rows.join("\n")}</div>`
  } else {
    content = `<div class="lp-section-content">${renderMarkdown(section.lines.join("\n"))}</div>`
  }

  return `<section class="lp-section">
      <h2>${renderInline(section.title)}</h2>
      ${content}
    </section>`
}

function renderDocument(source) {
  const plan = parsePlan(source)
  const summaryIndex = plan.sections.findIndex((section) => section.title.toLowerCase() === "summary")
  const summary = summaryIndex >= 0 ? plan.sections[summaryIndex].lines : plan.preamble
  const sections = plan.sections.filter((_, index) => index !== summaryIndex)
  return `<!doctype html>
<html lang="en" data-theme="luxury">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(plan.title)}</title>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5.5.19/daisyui.css" rel="stylesheet" type="text/css">
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5.5.19/themes.css" rel="stylesheet" type="text/css">
  <style>
    :root { color-scheme: dark; --lp-bg: #17120e; --lp-surface: #21170f; --lp-raised: #2a1d12; --lp-text: #f7ead4; --lp-muted: #cbbda8; --lp-accent: #f6c453; --lp-border: #5d4528; --lp-success: #8bd17c; --lp-danger: #ff8b7f; }
    html, body { margin: 0; min-height: 100%; background: var(--color-base-100, #17120e); color: var(--color-base-content, #f7ead4); }
    body { background: var(--color-base-100, var(--lp-bg)); color: var(--color-base-content, var(--lp-text)); font: 16px/1.6 system-ui, sans-serif; }
    *, *::before, *::after { box-sizing: border-box; }
    .lp-shell { width: min(100% - 2rem, 64rem); margin: 0 auto; padding: 2rem 0 4rem; }
    .lp-hero { border-bottom: 1px solid var(--lp-border); padding: 1rem 0 1.5rem; }
    .lp-kicker { color: var(--color-primary, var(--lp-accent)); font-size: .75rem; font-weight: 800; letter-spacing: .16em; margin: 0 0 .7rem; text-transform: uppercase; }
    .lp-hero h1 { color: var(--color-base-content, var(--lp-text)); font-size: clamp(2rem, 5vw, 2.25rem); line-height: 1.1; margin: 0; max-width: 28ch; }
    .lp-hero-copy { color: var(--lp-muted); margin-top: 1.1rem; max-width: 75ch; }
    .lp-hero-copy .lp-paragraph { color: inherit; }
    .lp-section { margin-top: 2rem; min-width: 0; }
    .lp-section > h2 { color: var(--color-base-content, var(--lp-text)); font-size: clamp(1.25rem, 3vw, 1.55rem); line-height: 1.2; margin: 0 0 .65rem; }
    .lp-section-content, .lp-group-content { max-width: 70ch; overflow-wrap: anywhere; }
    .lp-rows { border-top: 1px solid var(--lp-border); }
    .lp-group-row { display: grid; grid-template-columns: minmax(9rem, 18ch) minmax(0, 1fr); gap: 1.5rem; border-bottom: 1px solid color-mix(in srgb, var(--lp-border) 65%, transparent); padding: 1rem 0; }
    .lp-group-row h3 { color: var(--color-primary, var(--lp-accent)); font-size: .95rem; margin: 0; }
    .lp-section-intro { color: var(--lp-muted); margin-bottom: 1rem; }
    .lp-heading { color: var(--color-base-content, var(--lp-text)); line-height: 1.2; margin: 1.6em 0 .6em; }
    .lp-heading:first-child { margin-top: 0; }
    .lp-paragraph { color: var(--color-base-content, var(--lp-text)); margin: .7rem 0; }
    .lp-list { color: var(--color-base-content, var(--lp-text)); margin: .25rem 0; padding-inline-start: 1.3rem; }
    ul.lp-list { list-style: none; padding-inline-start: 1.2rem; }
    ul.lp-list > li { position: relative; }
    ul.lp-list > li::before { color: var(--lp-muted); content: "–"; left: -1.1rem; position: absolute; }
    .lp-list .lp-list { border-left: 1px solid var(--lp-border); margin-top: .45rem; }
    .lp-list li { margin: .45rem 0; padding-left: .2rem; }
    .lp-code, .lp-native pre { max-width: 100%; overflow: auto; background: #0f0b08; color: var(--lp-text); border: 1px solid var(--lp-border); border-radius: .65rem; padding: 1rem; }
    .lp-code code, .lp-native code { white-space: pre; font: .9em/1.5 ui-monospace, monospace; }
    .lp-inline-code, .lp-command { background: #0f0b08; border: 1px solid var(--lp-border); border-radius: .3rem; color: var(--color-primary, var(--lp-accent)); padding: .1em .35em; }
    .lp-command { white-space: normal; }
    .lp-command-row .lp-command { background: #15100c; }
    .lp-status { border: 1px solid currentColor; border-radius: 999px; display: inline-block; font-size: .68rem; font-weight: 800; letter-spacing: .04em; margin-right: .45rem; padding: .08rem .42rem; text-transform: uppercase; vertical-align: .08rem; }
    .lp-status-success { color: var(--color-success, var(--lp-success)); }
    .lp-status-danger { color: var(--color-error, var(--lp-danger)); }
    .lp-link { color: var(--color-primary, var(--lp-accent)); text-decoration-thickness: .12em; }
    .lp-table-wrap { max-width: 100%; overflow-x: auto; margin: 1.25rem 0; }
    .lp-table { width: 100%; border-collapse: collapse; min-width: 30rem; }
    .lp-table th, .lp-table td { border: 1px solid var(--lp-border); padding: .7rem .85rem; vertical-align: top; }
    .lp-table th { background: var(--color-base-300, var(--lp-raised)); color: var(--color-primary, var(--lp-accent)); }
    .lp-native { margin-top: 2.5rem; border-top: 1px solid var(--lp-border); padding-top: 1rem; }
    .lp-native summary { cursor: pointer; color: var(--lp-muted); font-weight: 700; }
    p, h1, h2, h3, h4, h5, h6, li, td, th, code { overflow-wrap: anywhere; }
    img, svg, video, canvas, iframe { max-width: 100%; height: auto; }
    pre, table { max-width: 100%; }
    @media (max-width: 40rem) { .lp-shell { width: min(100% - 1rem, 64rem); padding-top: .5rem; } .lp-group-row { display: block; } .lp-group-row h3 { margin-bottom: .45rem; } }
  </style>
</head>
<body>
  <main class="lp-shell">
    <header class="lp-hero">
      <p class="lp-kicker">Approved implementation plan</p>
      <h1>${renderInline(plan.title)}</h1>
      ${summary.length ? `<div class="lp-hero-copy">${renderMarkdown(summary.join("\n"))}</div>` : ""}
    </header>
    ${sections.map(renderSection).join("\n")}
    <details class="lp-native">
      <summary>Native plan</summary>
      <pre><code>${escapeHtml(source)}</code></pre>
    </details>
  </main>
</body>
</html>
`
}

function parseArgs(argv) {
  let input
  let output
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag === "--input" || flag === "--output") {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) throw new Error(`${flag} requires a path`)
      if (flag === "--input") input = value
      else output = value
      index += 1
    } else if (flag === "--help") {
      console.log(usage)
      return null
    } else {
      throw new Error(`unknown argument: ${flag}`)
    }
  }
  if (!input) throw new Error(`missing --input; ${usage}`)
  return { input, output }
}

function writeArtifact(html, requestedOutput) {
  if (!requestedOutput) {
    const directory = mkdtempSync(join(tmpdir(), "codex-plan-"))
    const path = join(directory, "plan.html")
    writeFileSync(path, html, { encoding: "utf8", flag: "wx" })
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
    writeFileSync(path, html, { encoding: "utf8", flag: "wx" })
    renameSync(path, output)
    return output
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options) return
  const input = resolve(options.input)
  let source
  try {
    source = readFileSync(input, "utf8")
  } catch {
    throw new Error("input plan cannot be read")
  }
  if (!source.trim()) throw new Error("input plan is empty")
  const path = writeArtifact(renderDocument(source), options.output)
  console.log(resolve(path))
}

try {
  main()
} catch (error) {
  console.error(`render-plan: ${error.message || "failed"}`)
  process.exitCode = 1
}
