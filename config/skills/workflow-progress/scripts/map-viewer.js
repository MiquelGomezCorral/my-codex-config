(() => {
  const SVG_NS = "http://www.w3.org/2000/svg"
  const HTML_NS = "http://www.w3.org/1999/xhtml"
  const cellIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
  const nodeKinds = new Set(["frontend", "backend", "database", "cloud", "security", "messagebus", "external"])
  const statuses = new Set(["active", "done", "upcoming", "waiting", "blocked", "skipped"])
  const svgElements = new Set([
    "svg", "g", "defs", "marker", "pattern", "rect", "ellipse", "circle",
    "line", "polyline", "polygon", "path", "text", "tspan", "title", "desc", "foreignobject", "clippath", "use", "image", "switch", "a",
  ])
  const htmlLabels = new Set(["div", "span", "p", "br", "strong", "b", "em", "i"])
  const svgAttributes = new Set([
    "viewBox", "width", "height", "x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry",
    "d", "points", "transform", "preserveAspectRatio", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap",
    "stroke-linejoin", "stroke-miterlimit", "fill", "stroke", "stroke-width", "fill-opacity", "stroke-opacity",
    "opacity", "display", "visibility", "overflow", "text-anchor", "dominant-baseline", "font-size", "font-weight",
    "font-family", "clip-path", "marker-start", "marker-mid", "marker-end", "pointer-events", "href", "xlink:href", "xmlns", "xml:space",
  ])
  const htmlAttributes = new Set(["style", "dir", "lang"])
  const styleProperties = new Set([
    "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin",
    "stroke-miterlimit", "fill-opacity", "stroke-opacity", "opacity", "font-size", "font-weight", "font-family",
    "font-style", "text-decoration", "text-align", "vertical-align", "white-space", "line-height", "letter-spacing",
    "display", "visibility", "overflow", "text-anchor", "dominant-baseline", "width", "height",
    "padding-top", "margin-left", "align-items", "justify-content", "box-sizing", "pointer-events",
  ])
  const paintProperties = new Set(["fill", "stroke", "fill-opacity", "stroke-opacity"])
  const inputNode = document.getElementById("workflow-map-input")
  if (!inputNode) return

  const input = JSON.parse(inputNode.textContent)
  const configuration = input.configuration
  const stepIds = Object.keys(configuration.steps)
  const baseNodeIds = new Set(Object.keys(configuration.nodes ?? {}))
  for (const step of Object.values(configuration.steps)) {
    for (const id of step.anchors) baseNodeIds.add(id)
  }
  const issues = []
  const normalizationIssues = []
  const prefixes = "drawio-"

  function record(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value)
  }

  function safeId(value) {
    return typeof value === "string" && /^[A-Za-z_][A-Za-z0-9_.:-]{0,127}$/.test(value)
  }

  function scopedId(value) {
    return `${prefixes}${value}`
  }

  function safeCssValue(value) {
    return !/(?:url\s*\(\s*(?!#[A-Za-z0-9_.:-]+\s*\))|expression\s*\(|javascript:|@import|<|>|\\)/i.test(value)
  }

  function scopedUrls(value) {
    return value.replace(/url\(\s*#([A-Za-z0-9_.:-]+)\s*\)/g, (_match, id) => `url(#${scopedId(id)})`)
  }

  function safeStyle(source, removed = new Set()) {
    const declarations = []
    for (const declaration of source.split(";")) {
      const split = declaration.indexOf(":")
      if (split < 1) continue
      const property = declaration.slice(0, split).trim().toLowerCase()
      let value = declaration.slice(split + 1).trim()
      if (!styleProperties.has(property) || removed.has(property) || !value || !safeCssValue(value)) continue
      value = scopedUrls(value)
      declarations.push(`${property}:${value}`)
    }
    return declarations.join(";")
  }

  function sourceClassNames(value) {
    return value.split(/\s+/).filter((name) => /^[A-Za-z_][A-Za-z0-9_-]{0,80}$/.test(name)).map((name) => `${prefixes}${name}`)
  }

  function sanitizedStyles(svg) {
    const css = [...svg.querySelectorAll("style")].map((style) => style.textContent).join("\n")
    const declarations = []
    const plainCss = css.replace(/\/\*[\s\S]*?\*\//g, "")
    for (const match of plainCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = match[1].trim()
      if (!selector || selector.startsWith("@") || !/^[A-Za-z0-9_.,\s>*#:-]+$/.test(selector)) continue
      const scoped = selector
        .replace(/\.([A-Za-z_][A-Za-z0-9_-]*)/g, (_all, name) => `.${prefixes}${name}`)
        .replace(/#([A-Za-z_][A-Za-z0-9_.:-]*)/g, (_all, name) => `#${scopedId(name)}`)
      const style = safeStyle(match[2])
      if (style) declarations.push(`svg[data-workflow-source] ${scoped}{${style}}`)
    }
    return declarations.join("\n")
  }

  function copyAttributes(source, target, inLabel) {
    for (const attribute of source.attributes) {
      const name = attribute.name
      const lower = name.toLowerCase()
      const value = attribute.value
      if (lower.startsWith("on") || lower === "content" || lower.startsWith("data-") && lower !== "data-cell-id") continue
      if (lower === "class") {
        const classes = sourceClassNames(value)
        if (classes.length) target.setAttribute("class", classes.join(" "))
        continue
      }
      if (lower === "id") {
        if (safeId(value)) target.setAttribute("id", scopedId(value))
        continue
      }
      if (lower === "data-cell-id") {
        if (cellIdPattern.test(value)) target.setAttribute("data-cell-id", value)
        continue
      }
      if (lower === "style") {
        const style = safeStyle(value, inLabel ? new Set(["fill", "stroke", "color", "background", "background-color"]) : new Set())
        if (style) target.setAttribute("style", style)
        continue
      }
      if (lower === "requiredfeatures") {
        if (value === "http://www.w3.org/TR/SVG11/feature#Extensibility") target.setAttribute(name, value)
        continue
      }
      if (!svgAttributes.has(name) && !(inLabel && htmlAttributes.has(name))) continue
      if ((lower === "href" || lower === "xlink:href")) {
        if (target.localName.toLowerCase() === "use" && /^#[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value)) {
          target.setAttribute("href", `#${scopedId(value.slice(1))}`)
        } else if (target.localName.toLowerCase() === "image" && /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(value)) {
          target.setAttribute("href", value)
        }
        continue
      }
      if (["clip-path", "marker-start", "marker-mid", "marker-end", "fill", "stroke"].includes(lower) && /url\(/i.test(value)) {
        if (!/^url\(\s*#[A-Za-z0-9_.:-]+\s*\)$/.test(value)) continue
        target.setAttribute(name, scopedUrls(value))
        continue
      }
      if (safeCssValue(value)) target.setAttribute(name, value)
    }
  }

  function cloneSafe(source, inLabel = false) {
    if (source.nodeType === Node.TEXT_NODE) return document.createTextNode(source.nodeValue)
    if (source.nodeType !== Node.ELEMENT_NODE) return null
    const name = source.localName.toLowerCase()
    const isSvg = source.namespaceURI === SVG_NS && svgElements.has(name)
    const isHtmlLabel = inLabel && source.namespaceURI === HTML_NS && htmlLabels.has(name)
    if (!isSvg && !isHtmlLabel) {
      if (["script", "style", "iframe", "object", "embed"].includes(name)) return null
      const fragment = document.createDocumentFragment()
      for (const child of source.childNodes) {
        const safeChild = cloneSafe(child, inLabel)
        if (safeChild) fragment.append(safeChild)
      }
      return fragment
    }
    if (name === "image" && !(source.getAttribute("href") || source.getAttribute("xlink:href"))?.startsWith("data:image/")) return null
    const target = document.createElementNS(source.namespaceURI, source.localName)
    copyAttributes(source, target, inLabel || name === "foreignobject")
    const childLabel = inLabel || name === "foreignobject"
    for (const child of source.childNodes) {
      const safeChild = cloneSafe(child, childLabel)
      if (safeChild) target.append(safeChild)
    }
    return target
  }

  function modelCells(model) {
    return new Map([...model.querySelectorAll("mxCell[id]")].map((cell) => [cell.getAttribute("id"), cell]))
  }

  function normalizeCellGroups(svg, cells) {
    const groups = [...svg.querySelectorAll("[data-cell-id]")].filter((group) => {
      const cell = cells.get(group.getAttribute("data-cell-id"))
      return cell?.getAttribute("vertex") === "1" || cell?.getAttribute("edge") === "1"
    })
    const wrappers = new Set()
    for (const group of groups) {
      let parent = group.parentElement
      while (parent !== svg) {
        if (!parent || parent.namespaceURI !== SVG_NS || parent.localName !== "g") {
          throw new Error("workflow SVG has an unsupported wrapper around authored cells")
        }
        const id = parent.getAttribute("data-cell-id")
        const cell = parent.hasAttribute("data-cell-id") ? cells.get(id) : null
        if ([...parent.attributes].some(({ name }) => name !== "data-cell-id")
          || parent.hasAttribute("data-cell-id") && (!cell || cell.getAttribute("vertex") === "1" || cell.getAttribute("edge") === "1")) {
          throw new Error("workflow SVG has a cell-group wrapper with inherited rendering")
        }
        wrappers.add(parent)
        parent = parent.parentElement
      }
    }
    if (wrappers.size && [...svg.querySelectorAll("style")].some((style) => style.textContent.trim())) {
      throw new Error("workflow SVG has styles that may depend on cell-group wrappers")
    }
    const depth = (group) => {
      let value = 0
      for (let parent = group; parent !== svg; parent = parent.parentElement) value += 1
      return value
    }
    for (const wrapper of [...wrappers].sort((left, right) => depth(left) - depth(right))) {
      const parent = wrapper.parentNode
      if (!parent) throw new Error("workflow SVG cell-group wrapper is detached")
      const next = wrapper.nextSibling
      for (const child of [...wrapper.childNodes]) parent.insertBefore(child, next)
      if (!wrapper.hasAttribute("data-cell-id")) wrapper.remove()
    }
    if (groups.some((group) => group.parentElement !== svg)) {
      throw new Error("workflow SVG cell groups could not be promoted to its root")
    }
  }

  function modelGeometry(cell) {
    const geometry = [...(cell?.children ?? [])].find((child) => child.localName === "mxGeometry" && child.getAttribute("as") === "geometry")
    const x = Number(geometry?.getAttribute("x"))
    const y = Number(geometry?.getAttribute("y"))
    const width = Number(geometry?.getAttribute("width"))
    const height = Number(geometry?.getAttribute("height"))
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? { x: Number.isFinite(x) ? x : null, y: Number.isFinite(y) ? y : null, width, height }
      : null
  }

  function cssPixels(element, property) {
    const value = element?.style?.getPropertyValue(property) ?? ""
    const match = value.trim().match(/^([+-]?[0-9]+(?:\.[0-9]+)?)px$/i)
    return match ? Number(match[1]) : null
  }

  function setCssPixels(element, property, value) {
    element.style.setProperty(property, `${value}px`)
  }

  function translationOnly(element, root) {
    let x = 0
    let y = 0
    for (let current = element; current && current !== root; current = current.parentElement) {
      const transform = current.getAttribute("transform")?.trim()
      if (!transform) continue
      const parts = [...transform.matchAll(/translate\(\s*(-?\d+(?:\.\d+)?)(?:[ ,]+(-?\d+(?:\.\d+)?))?\s*\)/g)]
      if (!parts.length || parts.map((part) => part[0].replace(/\s+/g, "")).join("") !== transform.replace(/\s+/g, "")) {
        return null
      }
      for (const part of parts) {
        x += Number(part[1])
        y += Number(part[2] ?? 0)
      }
    }
    return { x, y }
  }

  function normalizeForeignObjects(svg, cells) {
    for (const foreignObject of svg.querySelectorAll("foreignObject")) {
      const group = foreignObject.closest("[data-cell-id]")
      const id = group?.getAttribute("data-cell-id")
      const geometry = modelGeometry(cells.get(id))
      const widthValue = foreignObject.getAttribute("width") ?? ""
      const heightValue = foreignObject.getAttribute("height") ?? ""
      const percentSized = widthValue === "100%" && heightValue === "100%"
      if ((widthValue.includes("%") || heightValue.includes("%")) && !percentSized) {
        normalizationIssues.push(`Cell ${id} has a label viewport with unsupported percentage dimensions; it was left unchanged.`)
        continue
      }
      const width = Number(widthValue)
      const height = Number(heightValue)
      if (!percentSized && (!Number.isFinite(width) || !Number.isFinite(height))) {
        normalizationIssues.push(`Cell ${id} has a label viewport with unsupported dimensions; it was left unchanged.`)
        continue
      }
      if (!geometry) {
        if (percentSized) normalizationIssues.push(`Cell ${id} has an oversized label viewport without usable model geometry; it was left unchanged.`)
        continue
      }
      const labelBoxes = [...foreignObject.querySelectorAll("div")]
      if (percentSized) {
        const translation = translationOnly(foreignObject, svg)
        const label = labelBoxes.find((box) => box.style?.getPropertyValue("display").trim() === "flex"
          && cssPixels(box, "width") === 1 && cssPixels(box, "height") === 1
          && cssPixels(box, "margin-left") !== null && cssPixels(box, "padding-top") !== null
          && box.style.getPropertyValue("align-items").trim() && box.style.getPropertyValue("justify-content").trim())
        if (!translation) {
          normalizationIssues.push(`Cell ${id} has a 100%-sized label viewport with a non-translation transform; it was left unchanged.`)
          continue
        }
        if (!label || geometry.x === null || geometry.y === null) {
          normalizationIssues.push(`Cell ${id} has a 100%-sized label viewport outside the recognized draw.io offset-label pattern; it was left unchanged.`)
          continue
        }
        const rawX = foreignObject.getAttribute("x")
        const rawY = foreignObject.getAttribute("y")
        const x = rawX === null ? 0 : Number(rawX)
        const y = rawY === null ? 0 : Number(rawY)
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          normalizationIssues.push(`Cell ${id} has a 100%-sized label viewport with an unsupported position; it was left unchanged.`)
          continue
        }
        const targetX = geometry.x - translation.x
        const targetY = geometry.y - translation.y
        setCssPixels(label, "margin-left", x + cssPixels(label, "margin-left") - targetX)
        setCssPixels(label, "padding-top", y + cssPixels(label, "padding-top") - targetY)
        foreignObject.setAttribute("x", String(targetX))
        foreignObject.setAttribute("y", String(targetY))
        foreignObject.setAttribute("width", String(geometry.width))
        foreignObject.setAttribute("height", String(geometry.height))
        continue
      }
      const wide = width > Math.max(geometry.width * 2, geometry.width + 64)
      const tall = height > Math.max(geometry.height * 2, geometry.height + 64)
      if (!wide && !tall) continue
      const translation = translationOnly(foreignObject, svg)
      const rawX = foreignObject.getAttribute("x")
      const rawY = foreignObject.getAttribute("y")
      const x = rawX === null ? 0 : Number(rawX)
      const y = rawY === null ? 0 : Number(rawY)
      if (!translation || !Number.isFinite(x) || !Number.isFinite(y)) {
        normalizationIssues.push(`Cell ${id} has an oversized label viewport with an unsupported transform or position; it was left unchanged.`)
        continue
      }
      const fixedWidth = labelBoxes.map((label) => cssPixels(label, "width")).find((value) => value !== null && value > 1)
      const fixedHeight = labelBoxes.map((label) => cssPixels(label, "height")).find((value) => value !== null && value > 1)
      const offsetsFit = labelBoxes.every((label) => {
        const left = cssPixels(label, "margin-left") ?? 0
        const top = cssPixels(label, "padding-top") ?? 0
        return left >= 0 && top >= 0 && left <= geometry.width && top <= geometry.height
      })
      const anchored = geometry.x !== null && geometry.y !== null
        && Math.abs(x + translation.x - geometry.x) <= 0.51
        && Math.abs(y + translation.y - geometry.y) <= 0.51
      if (!anchored || !offsetsFit || wide && (fixedWidth === undefined || fixedWidth > geometry.width + 1)
        || tall && (fixedHeight === undefined || fixedHeight > geometry.height + 1)) {
        normalizationIssues.push(`Cell ${id} has an oversized label viewport whose position or wrapping cannot be preserved; it was left unchanged.`)
        continue
      }
      if (wide) foreignObject.setAttribute("width", String(geometry.width))
      if (tall) foreignObject.setAttribute("height", String(geometry.height))
    }
  }

  function parseInput() {
    const svgDocument = new DOMParser().parseFromString(input.svgText, "image/svg+xml")
    if (svgDocument.querySelector("parsererror") || svgDocument.documentElement.localName !== "svg" || svgDocument.documentElement.namespaceURI !== SVG_NS) {
      throw new Error("workflow SVG could not be parsed")
    }
    const sourceSvg = svgDocument.documentElement
    const viewBox = (sourceSvg.getAttribute("viewBox") ?? "").trim().split(/[ ,]+/).map(Number)
    if (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0) {
      throw new Error("workflow SVG has no usable viewBox")
    }
    const embedded = sourceSvg.getAttribute("content")
    if (!embedded || !embedded.includes("mxGraphModel")) throw new Error("workflow SVG has no uncompressed embedded diagram model")
    const model = new DOMParser().parseFromString(embedded, "application/xml")
    if (model.querySelector("parsererror") || !model.querySelector("mxGraphModel")) throw new Error("embedded workflow model could not be parsed")
    const cells = modelCells(model)
    const styles = sanitizedStyles(sourceSvg)
    normalizeForeignObjects(sourceSvg, cells)
    normalizeCellGroups(sourceSvg, cells)
    const safeSvg = cloneSafe(sourceSvg)
    if (!safeSvg || safeSvg.localName !== "svg") throw new Error("workflow SVG has no safe root")
    safeSvg.setAttribute("data-workflow-source", "drawio")
    safeSvg.setAttribute("data-preset", "signal-flow")
    safeSvg.setAttribute("data-animation", "trace")
    if (styles) {
      const style = document.createElementNS(SVG_NS, "style")
      style.textContent = styles
      safeSvg.insertBefore(style, safeSvg.firstChild)
    }
    return { sourceSvg, safeSvg, cells, viewBox }
  }

  function normalizeLabel(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim()
  }

  function visibleLabel(element) {
    const copy = element?.cloneNode(true)
    if (!copy) return ""
    for (const lineBreak of copy.querySelectorAll("br")) lineBreak.replaceWith(" ")
    for (const text of copy.querySelectorAll("text")) text.append(" ")
    return normalizeLabel(copy.textContent)
  }

  function mappingIssues(sourceGroups, cells) {
    const groupCounts = new Map()
    for (const group of sourceGroups) {
      const id = group.getAttribute("data-cell-id")
      groupCounts.set(id, (groupCounts.get(id) ?? 0) + 1)
    }
    const errors = []
    for (const step of stepIds) {
      if (!configuration.steps[step]?.anchors?.length) errors.push(`Step ${step} has no map anchor.`)
    }
    for (const [id, node] of Object.entries(configuration.nodes ?? {})) {
      const cell = cells.get(id)
      if (!cell || cell.getAttribute("vertex") !== "1") errors.push(`Native node ${id} is missing from the source diagram.`)
      if (!groupCounts.has(id)) errors.push(`Native node ${id} has no rendered SVG group.`)
      if (groupCounts.get(id) > 1) errors.push(`Native node ${id} appears more than once in the SVG.`)
      if (!nodeKinds.has(node.kind)) errors.push(`Native node ${id} has an unsupported kind.`)
    }
    for (const [boxId, members] of Object.entries(configuration.focusBoxes ?? {})) {
      const box = cells.get(boxId)
      if (!box || box.getAttribute("vertex") !== "1" || baseNodeIds.has(boxId)) errors.push(`Focus box ${boxId} is missing or selectable.`)
      if (!groupCounts.has(boxId)) errors.push(`Focus box ${boxId} has no rendered SVG group.`)
      if (groupCounts.get(boxId) > 1) errors.push(`Focus box ${boxId} appears more than once in the SVG.`)
      for (const id of members) {
        const cell = cells.get(id)
        if (!baseNodeIds.has(id) || cell?.getAttribute("vertex") !== "1") errors.push(`Focus box ${boxId} uses non-selectable node ${id}.`)
        if (!groupCounts.has(id)) errors.push(`Focus box ${boxId} member ${id} has no rendered SVG group.`)
      }
    }
    for (const [step, entry] of Object.entries(configuration.steps)) {
      if (!stepIds.includes(step)) errors.push(`Map uses unknown step ${step}.`)
      for (const id of entry.anchors) {
        if (!cells.has(id) || cells.get(id).getAttribute("vertex") !== "1") errors.push(`Step ${step} uses missing vertex ${id}.`)
        if (!groupCounts.has(id)) errors.push(`Step ${step} has no rendered anchor ${id}.`)
        if (groupCounts.get(id) > 1) errors.push(`Step ${step} anchor ${id} appears more than once in the SVG.`)
      }
    }
    return [...new Set(errors)]
  }

  function safeSvgStyles(element, removePaint = false) {
    const style = safeStyle(element.getAttribute("style") ?? "", removePaint ? paintProperties : new Set())
    if (style) element.setAttribute("style", style)
    else element.removeAttribute("style")
    if (removePaint) {
      for (const name of paintProperties) element.removeAttribute(name)
    }
  }

  function addTextTokens(svg) {
    for (const text of svg.querySelectorAll("text, tspan")) {
      const group = text.closest("[data-cell-id]")
      const node = group?.hasAttribute("data-node-id")
      text.setAttribute("class", node ? "t-primary" : "t-muted")
      safeSvgStyles(text, true)
    }
    for (const foreignObject of svg.querySelectorAll("foreignObject")) {
      const label = foreignObject.querySelector("div")
      if (!label) continue
      label.style.setProperty("color", "var(--text)")
    }
  }

  function semanticShapes(group, kind) {
    const shapes = [...group.querySelectorAll("rect, ellipse, polygon, path")]
    const painted = shapes.filter((shape) => {
      const fill = shape.getAttribute("fill") ?? ""
      const styleFill = shape.style?.getPropertyValue("fill") ?? ""
      return fill !== "none" && styleFill !== "none"
    })
    for (const shape of painted) {
      safeSvgStyles(shape, true)
      shape.setAttribute("class", `c-${kind}`)
    }
    return painted.length
  }

  function decorateNodes(svg, cells) {
    const groups = new Map([...svg.querySelectorAll("[data-cell-id]")].map((group) => [group.getAttribute("data-cell-id"), group]))
    for (const id of baseNodeIds) {
      const group = groups.get(id)
      const cell = cells.get(id)
      if (!group || !cell || cell.getAttribute("vertex") !== "1") continue
      const label = visibleLabel(group)
      const metadata = configuration.nodes?.[id] ?? {}
      group.setAttribute("data-node-id", id)
      group.setAttribute("data-node-label", label || id)
      group.setAttribute("tabindex", "0")
      group.setAttribute("role", "button")
      group.setAttribute("aria-label", `Focus ${label || id}${metadata.description ? `, ${metadata.description}` : ""}${metadata.context ? `, ${metadata.context}` : ""}`)
      if (metadata.kind) group.setAttribute("data-node-kind", metadata.kind)
      if (metadata.description) group.setAttribute("data-node-sublabel", metadata.description)
      if (metadata.context) group.setAttribute("data-node-context", metadata.context)
      if (metadata.tag) group.setAttribute("data-node-tag", metadata.tag)
      if (metadata.kind) semanticShapes(group, metadata.kind)
    }
  }

  function decorateStructure(svg, cells, viewBox) {
    for (const group of svg.querySelectorAll("[data-cell-id]")) {
      const id = group.getAttribute("data-cell-id")
      if (baseNodeIds.has(id) || cells.get(id)?.getAttribute("vertex") !== "1") continue
      const style = cells.get(id).getAttribute("style") ?? ""
      const geometry = modelGeometry(cells.get(id))
      const lane = /(?:^|;)shape=swimlane(?:;|$)/.test(style)
      // ponytail: a 12% area threshold marks broad unbound cells as washes; use explicit structure IDs if a future source makes that ambiguous.
      const broad = geometry && geometry.width * geometry.height >= viewBox[2] * viewBox[3] * 0.12
      if (!lane && !broad) continue
      for (const shape of group.querySelectorAll("rect, ellipse, polygon, path")) {
        safeSvgStyles(shape, true)
        shape.setAttribute("class", lane ? "c-lane" : "c-lane-wash")
      }
    }
  }

  function neutralizeStaticCells(svg, cells) {
    for (const group of svg.querySelectorAll("[data-cell-id]")) {
      const id = group.getAttribute("data-cell-id")
      if (baseNodeIds.has(id) || cells.get(id)?.getAttribute("vertex") !== "1") continue
      for (const shape of group.querySelectorAll("rect, ellipse, polygon, path")) {
        if (shape.classList.contains("c-lane") || shape.classList.contains("c-lane-wash")) continue
        const fill = shape.style?.getPropertyValue("fill").trim() || shape.getAttribute("fill") || ""
        const stroke = shape.style?.getPropertyValue("stroke").trim() || shape.getAttribute("stroke") || ""
        if ((!fill || fill === "none") && (!stroke || stroke === "none")) continue
        safeSvgStyles(shape, true)
        shape.style.setProperty("fill", fill && fill !== "none" ? "var(--lane-fill)" : "none")
        shape.style.setProperty("stroke", stroke && stroke !== "none" ? "var(--lane-stroke)" : "none")
      }
    }
  }

  function decorateEdges(svg, cells) {
    const groups = new Map([...svg.querySelectorAll("[data-cell-id]")].map((group) => [group.getAttribute("data-cell-id"), group]))
    const nativeIds = new Set([...svg.querySelectorAll("[data-node-id]")].map((node) => node.getAttribute("data-node-id")))
    const edges = [...cells.values()].filter((cell) => cell.getAttribute("edge") === "1")
    const decorated = []
    let missingTerminalCount = 0
    let unselectableTerminalCount = 0
    for (const cell of edges) {
      const id = cell.getAttribute("id")
      const from = cell.getAttribute("source")
      const to = cell.getAttribute("target")
      const group = groups.get(id)
      if (group) {
        for (const shape of group.querySelectorAll("path, line, polyline")) {
          safeSvgStyles(shape, true)
          shape.setAttribute("class", "a-default")
        }
      }
      if (!from || !to || !cells.has(from) || !cells.has(to)) {
        missingTerminalCount += 1
        continue
      }
      if (!group || !nativeIds.has(from) || !nativeIds.has(to)) {
        unselectableTerminalCount += 1
        continue
      }
      const label = visibleLabel(group)
      const key = `${id}:${from}:${to}`
      group.setAttribute("data-edge-from", from)
      group.setAttribute("data-edge-to", to)
      group.setAttribute("data-edge-key", key)
      group.setAttribute("data-edge-id", id)
      if (label) group.setAttribute("data-edge-label", label)
      decorated.push(group)
    }
    if (missingTerminalCount) issues.push(`${missingTerminalCount} authored connectors have a missing terminal; no relationship was inferred.`)
    if (unselectableTerminalCount) issues.push(`${unselectableTerminalCount} authored connectors touch a non-selectable cell; no relationship was inferred.`)
    return decorated
  }

  function inventoryFor(parsed, sourceGroups, validation) {
    const groups = new Map([...parsed.safeSvg.querySelectorAll("[data-cell-id]")].map((group) => [group.getAttribute("data-cell-id"), group]))
    const terminals = []
    const edges = []
    for (const cell of parsed.cells.values()) {
      if (cell.getAttribute("edge") !== "1") continue
      const id = cell.getAttribute("id")
      const from = cell.getAttribute("source") || null
      const to = cell.getAttribute("target") || null
      const edgeCell = parsed.cells.get(id)
      const targetCell = parsed.cells.get(to)
      const sourceNode = parsed.cells.get(from)
      const edge = {
        id,
        label: visibleLabel(groups.get(id)),
        source: from,
        target: to,
        relationship: Boolean(from && to && edgeCell?.getAttribute("edge") === "1" && groups.has(id)
          && sourceNode?.getAttribute("vertex") === "1" && targetCell?.getAttribute("vertex") === "1"
          && baseNodeIds.has(from) && baseNodeIds.has(to)),
      }
      edges.push(edge)
      if (!from || !to || !parsed.cells.has(from) || !parsed.cells.has(to)) terminals.push(edge)
    }
    const cells = sourceGroups.map((group) => {
      const id = group.getAttribute("data-cell-id")
      const model = parsed.cells.get(id)
      return {
        id,
        label: visibleLabel(groups.get(id)),
        kind: model?.getAttribute("vertex") === "1" ? "vertex" : model?.getAttribute("edge") === "1" ? "edge" : "other",
        source: model?.getAttribute("source") || null,
        target: model?.getAttribute("target") || null,
        selectable: baseNodeIds.has(id) && model?.getAttribute("vertex") === "1",
      }
    })
    return {
      viewBox: parsed.viewBox,
      cells,
      edges,
      steps: configuration.steps,
      compatible: validation.length === 0,
      warnings: [...new Set([...validation, ...issues, ...normalizationIssues])],
      focusBoxes: configuration.focusBoxes ?? {},
      missingTerminalEdges: terminals,
      nonSelectableEdges: edges.filter((edge) => edge.source && edge.target && parsed.cells.has(edge.source) && parsed.cells.has(edge.target) && !edge.relationship),
    }
  }

  function mergeInfo(target, source) {
    for (const [id, fields] of Object.entries(source?.nodes ?? {})) target.nodes[id] = { ...(target.nodes[id] ?? {}), ...fields }
    for (const [id, fields] of Object.entries(source?.steps ?? {})) target.steps[id] = { ...(target.steps[id] ?? {}), ...fields }
    return target
  }

  function validateInfo(info) {
    if (!record(info)) return false
    if (Object.keys(info).some((key) => !["nodes", "steps"].includes(key))) return false
    if (info.nodes !== undefined && !record(info.nodes) || info.steps !== undefined && !record(info.steps)) return false
    const validText = (value) => typeof value === "string" && value.length <= 500 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)
    for (const [id, value] of Object.entries(info.nodes ?? {})) {
      if (!baseNodeIds.has(id) || !record(value) || Object.keys(value).some((key) => !["kind", "description", "context", "tag"].includes(key))) return false
      if (value.kind !== undefined && !nodeKinds.has(value.kind)) return false
      if (["description", "context", "tag"].some((key) => value[key] !== undefined && !validText(value[key]))) return false
    }
    for (const [step, value] of Object.entries(info.steps ?? {})) {
      if (!stepIds.includes(step) || !record(value) || Object.keys(value).some((key) => !["anchors", "description", "context", "tag"].includes(key))) return false
      if (value.anchors !== undefined && (!Array.isArray(value.anchors) || !value.anchors.length
        || value.anchors.some((id) => !baseNodeIds.has(id) || !cellIdPattern.test(id))
        || new Set(value.anchors).size !== value.anchors.length)) return false
      if (["description", "context", "tag"].some((key) => value[key] !== undefined && !validText(value[key]))) return false
    }
    return true
  }

  function validateProgress(message) {
    if (!record(message) || Object.keys(message).some((key) => !["type", "statuses", "runInfo", "sliceInfo"].includes(key))) return false
    if (!record(message.statuses) || Object.keys(message.statuses).some((step) => !stepIds.includes(step) || !statuses.has(message.statuses[step]))) return false
    if (stepIds.some((step) => !statuses.has(message.statuses[step]))) return false
    return validateInfo(message.runInfo ?? {}) && validateInfo(message.sliceInfo ?? {})
  }

  function applyEffectiveMetadata(info, activeStepIds, svg) {
    const metadata = structuredClone(info.nodes)
    for (const step of activeStepIds) {
      const entry = info.steps[step]
      if (!entry) continue
      for (const id of entry.anchors ?? configuration.steps[step].anchors) {
        metadata[id] = { ...(metadata[id] ?? {}), ...Object.fromEntries(["description", "context", "tag"].filter((key) => entry[key] !== undefined).map((key) => [key, entry[key]])) }
      }
    }
    for (const [id, node] of Object.entries(metadata)) {
      const element = svg.querySelector(`[data-node-id="${CSS.escape(id)}"]`)
      if (!element) continue
      for (const [field, attribute] of Object.entries({ description: "data-node-sublabel", context: "data-node-context", tag: "data-node-tag" })) {
        if (node[field] === undefined || node[field] === "") element.removeAttribute(attribute)
        else element.setAttribute(attribute, node[field])
      }
      if (node.kind && node.kind !== element.getAttribute("data-node-kind")) {
        element.setAttribute("data-node-kind", node.kind)
        semanticShapes(element, node.kind)
      }
      const label = element.getAttribute("data-node-label") ?? id
      element.setAttribute("aria-label", `Focus ${label}${node.description ? `, ${node.description}` : ""}${node.context ? `, ${node.context}` : ""}`)
    }
  }

  function activeState(message, parsed) {
    const info = mergeInfo(
      { nodes: structuredClone(configuration.nodes ?? {}), steps: structuredClone(configuration.steps) },
      message.runInfo,
    )
    mergeInfo(info, message.sliceInfo)
    const activeSteps = stepIds.filter((step) => message.statuses[step] === "active")
    const anchors = []
    for (const step of activeSteps) {
      const entry = info.steps[step]
      for (const id of entry?.anchors ?? []) {
        const cell = parsed.cells.get(id)
        if (cell?.getAttribute("vertex") === "1" && parsed.safeSvg.querySelector(`[data-cell-id="${CSS.escape(id)}"]`)) {
          if (!anchors.includes(id)) anchors.push(id)
        } else if (!issues.includes(`Step ${step} anchor ${id} is missing; activation was skipped.`)) {
          issues.push(`Step ${step} anchor ${id} is missing; activation was skipped.`)
        }
      }
    }
    return { info, activeSteps, anchors }
  }

  function bootstrapNative(parsed, inventory, edges) {
    const placeholder = document.querySelector(".diagram-container > svg")
    if (!placeholder) throw new Error("native viewer has no diagram slot")
    parsed.safeSvg.removeAttribute("width")
    parsed.safeSvg.removeAttribute("height")
    placeholder.replaceWith(parsed.safeSvg)
    const embedded = window.parent !== window
    let lastFocusSignature = null
    let lastMetadata = ""
    let tokenSignature = ""
    let tokenOverlays = []
    let lastActiveAnchors = []
    // A frame below the fold gets no animation frames, so a camera move started there stalls.
    // The embedded map frames its anchors once enough of it is on screen.
    let onScreen = !embedded
    let pendingReveal = null
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null

    function cellBounds(id) {
      const cell = parsed.safeSvg.querySelector(`[data-cell-id="${CSS.escape(id)}"]`)
      if (!cell) return null
      const box = cell.getBBox()
      const matrix = cell.getCTM()
      if (!matrix || ![box.x, box.y, box.width, box.height].every(Number.isFinite)) return null
      const points = [
        new DOMPoint(box.x, box.y).matrixTransform(matrix),
        new DOMPoint(box.x + box.width, box.y).matrixTransform(matrix),
        new DOMPoint(box.x, box.y + box.height).matrixTransform(matrix),
        new DOMPoint(box.x + box.width, box.y + box.height).matrixTransform(matrix),
      ]
      return {
        left: Math.min(...points.map(({ x }) => x)),
        right: Math.max(...points.map(({ x }) => x)),
        top: Math.min(...points.map(({ y }) => y)),
        bottom: Math.max(...points.map(({ y }) => y)),
      }
    }

    function syncFocusBoxes() {
      const focused = new Set((parsed.safeSvg.getAttribute("data-focus-active") ?? "").trim().split(/\s+/).filter(Boolean))
      const selected = Object.entries(configuration.focusBoxes ?? {})
        .filter(([, members]) => members.some((id) => focused.has(id)))
        .map(([id]) => id)
      const bounds = new Map(selected.map((id) => [id, cellBounds(id)]))
      const emphasized = selected.filter((id, index) => !selected.some((otherId, otherIndex) => {
        if (id === otherId) return false
        const outer = bounds.get(otherId)
        const inner = bounds.get(id)
        if (!outer || !inner) return false
        const contains = outer.left <= inner.left && outer.top <= inner.top
          && outer.right >= inner.right && outer.bottom >= inner.bottom
        if (!contains) return false
        const equal = outer.left === inner.left && outer.top === inner.top
          && outer.right === inner.right && outer.bottom === inner.bottom
        return !equal || otherIndex < index
      }))
      const emphasizedIds = new Set(emphasized)
      for (const [boxId] of Object.entries(configuration.focusBoxes ?? {})) {
        const box = parsed.safeSvg.querySelector(`[data-cell-id="${CSS.escape(boxId)}"]`)
        if (!box) continue
        const active = emphasizedIds.has(boxId)
        box.toggleAttribute("data-focus-match", active)
        box.toggleAttribute("data-focus-selected", active)
      }
    }

    const focusBoxObserver = new MutationObserver(syncFocusBoxes)

    function observeFocusBoxes() {
      focusBoxObserver.observe(parsed.safeSvg, { attributes: true, attributeFilter: ["data-focus-active"] })
      syncFocusBoxes()
    }

    function removeTokens() {
      const overlays = tokenOverlays
      tokenOverlays = []
      tokenSignature = ""
      for (const overlay of overlays) {
        const motion = overlay.querySelector("animateMotion")
        try { motion?.endElement() } catch (_) {}
        overlay.remove()
      }
    }

    function teardown() {
      removeTokens()
      focusBoxObserver.disconnect()
    }

    function motionAllowed() {
      const governor = window.Archify?.motionGovernor
      return !document.hidden && !reducedMotion?.matches && !(governor && governor.isPaused())
    }

    function syncTokens(anchors) {
      if (!anchors.length || !motionAllowed() || !window.Archify?.flowTokens?.create) {
        removeTokens()
        return
      }
      const signature = JSON.stringify(anchors)
      if (signature === tokenSignature) return
      removeTokens()
      const selected = new Set(anchors)
      const selectionMode = anchors.length > 1
      for (const edge of edges) {
        if (!parsed.safeSvg.contains(edge) || !edge.hasAttribute("data-edge-from")) continue
        const from = selected.has(edge.getAttribute("data-edge-from"))
        const to = selected.has(edge.getAttribute("data-edge-to"))
        // Match native focus.setMany: multi-selection animates only fully selected connectors.
        if (selectionMode ? !from || !to : !from && !to) continue
        const shape = edge.querySelector("path, line, polyline")
        const token = shape && window.Archify.flowTokens.create(edge, shape)
        if (!token) continue
        const motion = token.querySelector("animateMotion")
        if (!motion) continue
        const overlay = document.createElementNS(SVG_NS, "g")
        overlay.setAttribute("class", "relationship-pulse-overlay")
        overlay.setAttribute("data-relationship-pulse-overlay", "")
        overlay.setAttribute("aria-hidden", "true")
        const wrapper = document.createElementNS(SVG_NS, "g")
        if (edge.hasAttribute("transform")) wrapper.setAttribute("transform", edge.getAttribute("transform"))
        wrapper.append(token)
        overlay.append(wrapper)
        parsed.safeSvg.append(overlay)
        motion.addEventListener("endEvent", () => {
          overlay.remove()
          tokenOverlays = tokenOverlays.filter((activeOverlay) => activeOverlay !== overlay)
        }, { once: true })
        try { motion.beginElement() } catch (_) {
          overlay.remove()
          continue
        }
        tokenOverlays.push(overlay)
      }
      tokenSignature = signature
    }

    function setFocus(anchors) {
      removeTokens()
      if (anchors.length) {
        window.Archify.focus.setMany(anchors, { toggle: false, updateUrl: false, hideChip: true })
        if (onScreen) window.Archify.view.reveal(anchors, { includeNeighbors: false, maxScale: 3, reason: "focus" })
        else pendingReveal = anchors
      } else {
        pendingReveal = null
        window.Archify.focus.clear({ updateUrl: false, preserveView: true })
      }
      syncFocusBoxes()
      syncTokens(anchors)
    }

    function reopenManualDetails(event) {
      if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return
      const node = event.target?.closest?.("[data-node-id]")
      if (!node) return
      const id = node.getAttribute("data-node-id")
      const focused = (parsed.safeSvg.getAttribute("data-focus-active") ?? "").trim().split(/\s+/).filter(Boolean)
      const chip = document.getElementById("focus-chip")
      if (!chip?.hidden || focused.length !== 1 || focused[0] !== id || !window.Archify?.focus?.set) return
      event.preventDefault()
      event.stopPropagation()
      window.Archify.focus.set(id, { toggle: false, updateUrl: false })
      window.Archify.view?.reveal?.([id], { includeNeighbors: true, reason: "focus" })
    }

    function acceptProgress(message) {
      if (!validateProgress(message)) {
        warn(["Rejected an invalid progress message."])
        return
      }
      const state = activeState(message, parsed)
      lastActiveAnchors = state.anchors
      const metadataSignature = JSON.stringify({ nodes: state.info.nodes, steps: state.info.steps })
      if (metadataSignature !== lastMetadata) {
        applyEffectiveMetadata(state.info, state.activeSteps, parsed.safeSvg)
        lastMetadata = metadataSignature
      }
      // Shared anchors still resume following when the active workflow step changes.
      const signature = JSON.stringify({ steps: state.activeSteps, anchors: state.anchors })
      if (!inventory.compatible) {
        removeTokens()
      } else if (signature !== lastFocusSignature) {
        lastFocusSignature = signature
        setFocus(state.anchors)
      } else {
        syncTokens(state.anchors)
      }
      if (issues.length) warn([...new Set(issues)].slice(0, 40))
    }

    function validReturnMessage(message) {
      return record(message) && Object.keys(message).length === 1 && message.type === "workflow-return-current"
    }

    window.addEventListener("message", (event) => {
      if (event.source !== window.parent || !record(event.data)) return
      if (event.data.type === "workflow-progress") acceptProgress(event.data)
      else if (validReturnMessage(event.data) && inventory.compatible && window.Archify?.focus) setFocus(lastActiveAnchors)
    })
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) removeTokens()
      else syncTokens(lastActiveAnchors)
    })
    reducedMotion?.addEventListener?.("change", () => {
      if (reducedMotion.matches) removeTokens()
      else syncTokens(lastActiveAnchors)
    })
    parsed.safeSvg.addEventListener("click", reopenManualDetails, true)
    parsed.safeSvg.addEventListener("keydown", reopenManualDetails, true)
    window.addEventListener("pagehide", teardown)
    window.addEventListener("pageshow", observeFocusBoxes)
    window.addEventListener("beforeunload", teardown, { once: true })
    observeFocusBoxes()
    if (embedded) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.intersectionRatio >= 0.6
        if (onScreen && pendingReveal) {
          const anchors = pendingReveal
          pendingReveal = null
          // The viewer's own first sync runs on the first frame on screen; frame after it.
          requestAnimationFrame(() => window.Archify.view.reveal(anchors, { includeNeighbors: false, maxScale: 3, reason: "focus" }))
        }
      }, { threshold: [0.6] }).observe(document.querySelector(".diagram-container"))
    }
    window.setInterval(() => inventory.compatible && syncTokens(lastActiveAnchors), 2000)
    if (embedded) send({ type: "workflow-map-ready" })
  }

  function send(message) {
    if (window.parent !== window) window.parent.postMessage(message, "*")
  }

  function warn(messages) {
    if (window.parent === window) {
      const warning = document.getElementById("workflow-map-warning")
      if (warning) {
        warning.textContent = `Map warning: ${messages.join(" ")}`
        warning.hidden = false
      }
    }
    send({ type: "workflow-map-warning", messages })
  }

  try {
    const parsed = parseInput()
    const sourceGroups = [...parsed.sourceSvg.querySelectorAll("[data-cell-id]")]
    const validation = mappingIssues(sourceGroups, parsed.cells)
    issues.push(...validation)
    decorateNodes(parsed.safeSvg, parsed.cells)
    decorateStructure(parsed.safeSvg, parsed.cells, parsed.viewBox)
    neutralizeStaticCells(parsed.safeSvg, parsed.cells)
    const authoredEdges = decorateEdges(parsed.safeSvg, parsed.cells)
    addTextTokens(parsed.safeSvg)
    const inventory = inventoryFor(parsed, sourceGroups, validation)
    if (input.mode === "inspect") {
      window.workflowMapInventory = inventory
      document.getElementById("workflow-map-inventory").textContent = JSON.stringify(inventory, null, 2)
      return
    }
    if (input.mode !== "viewer") throw new Error("unsupported workflow map mode")
    bootstrapNative(parsed, inventory, authoredEdges)
    if (inventory.warnings.length) warn(inventory.warnings.slice(0, 40))
  } catch (error) {
    const message = `Workflow map could not be loaded: ${error.message}`
    const report = document.getElementById("workflow-map-inventory")
    if (report) report.textContent = JSON.stringify({ warnings: [message] }, null, 2)
    warn([message])
  }
})()
