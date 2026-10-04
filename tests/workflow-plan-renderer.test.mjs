import { test } from "node:test"
import { doesNotMatch, match, notEqual, ok, strictEqual } from "node:assert"
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { isAbsolute, join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

const root = resolve(new URL("..", import.meta.url).pathname)
const renderer = join(root, "config/skills/workflow/scripts/render-plan.mjs")

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character])
}

function runCli(args) {
  return spawnSync(process.execPath, [renderer, ...args], { cwd: root, encoding: "utf8" })
}

function runRenderer(input, output, review) {
  const args = ["--input", input]
  if (review) args.push("--review", review)
  if (output) args.push("--output", output)
  return runCli(args)
}

const sandboxPlan = [
  "# Fix Sandbox Authoring Review Findings",
  "",
  "Opening context stays available in the plan notes.",
  "",
  "## Summary",
  "",
  "Correct the confirmed policy, prompt, and evaluation issues without schema changes.",
  "",
  "## Implementation Changes",
  "",
  "- Policy hook:",
  "  - Reject reuse of a retired reference.",
  "  - Allow unchanged legacy dangling references.",
  "- Prompts:",
  "  - Delete the obsolete non-positional claim.",
  "  - Keep objectives achievable through theory and quizzes.",
  "- Evaluations:",
  "  - Add structured assessment fields.",
  "  - Reject the planted external task.",
  "",
  "## Test Plan",
  "",
  "- Policy tests:",
  "\t- Reject newly introduced dangling references.",
  "\t- Allow normal title edits.",
  "- Evaluation tests:",
  "  - Fail when the podcast character leaks.",
  "  - Pass when it remains podcast-only.",
  "- Run:",
  "  - bun typecheck",
  "  - bun run typecheck:safety",
  "",
  "## Assumptions",
  "",
  "The native plan remains authoritative.",
].join("\n")

const rendererPlan = [
  "# Deterministic Lavish Plan Renderer",
  "",
  "## Summary",
  "",
  "Render approved plans with `Node` and **deterministic** output.",
  "",
  "## Implementation Changes",
  "",
  "| Area | Owner |",
  "| --- | :---: |",
  "| Renderer | Codex |",
  "| Tests | Codex |",
  "| Escaped pipe | printf a\\|b |",
  "",
  "```md",
  "const answer = 42",
  "## Fake section",
  "- Fake group:",
  "  - Allow fake content.",
  "```",
  "",
  "## Test Plan",
  "",
  "1. Render quickly",
  "2. Keep failures readable",
  "",
  "## Assumptions",
  "",
  "- No visualization model runs by default.",
].join("\n")

test("renderer keeps Markdown-only input readable and collapsed", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-renderer-test-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = join(directory, "sandbox.md")
  const rendererInput = join(directory, "renderer.md")
  writeFileSync(input, sandboxPlan)
  writeFileSync(rendererInput, rendererPlan)

  const first = runRenderer(input)
  const second = runRenderer(input)
  const rendererResult = runRenderer(rendererInput)
  strictEqual(first.status, 0, first.stderr)
  strictEqual(second.status, 0, second.stderr)
  strictEqual(rendererResult.status, 0, rendererResult.stderr)
  const firstPath = first.stdout.trim()
  const secondPath = second.stdout.trim()
  strictEqual(isAbsolute(firstPath), true)
  strictEqual(isAbsolute(secondPath), true)
  strictEqual(readFileSync(firstPath, "utf8"), readFileSync(secondPath, "utf8"))

  const html = readFileSync(firstPath, "utf8")
  for (const expected of [
    "Fix Sandbox Authoring Review Findings", "Implementation Changes", "Policy hook",
    "Prompts", "Evaluations", "Policy tests", "Evaluation tests",
  ]) match(html, new RegExp(expected))
  match(html, /data-status="reject">reject<\/span>Newly introduced dangling references\./)
  match(html, /data-status="allow">allow<\/span>Normal title edits\./)
  match(html, /data-status="fail">fail<\/span>When the podcast character leaks\./)
  match(html, /data-status="pass">pass<\/span>When it remains podcast-only\./)
  match(html, /<code class="lp-command">bun typecheck<\/code>/)
  match(html, /font: 14px\/1\.55 system-ui/)
  match(html, /\.lp-hero h1 \{ font-size: 24px;/)
  match(html, /<details class="lp-detail"><summary><span class="lp-detail-summary-icon"><svg class="lp-icon" aria-hidden="true"/)
  match(html, /<span class="lp-detail-title">Implementation Changes<\/span>/)
  match(html, /<h3 class="lp-source-heading">Source document<\/h3>/)
  match(html, /<details class="lp-detail lp-source"><summary>/)
  match(html, /<span class="lp-detail-title">Plan notes<\/span>/)
  ok(html.includes(escapeHtml(sandboxPlan)))
  doesNotMatch(html, /daisyui|cdn\.jsdelivr|data-theme="luxury"|@tailwind/i)
  doesNotMatch(html, /<details[^>]* open/)
  doesNotMatch(html, /<script/i)

  const rendererHtml = readFileSync(rendererResult.stdout.trim(), "utf8")
  match(rendererHtml, /<span class="lp-detail-title">Implementation Changes<\/span>/)
  match(rendererHtml, /<table class="lp-table">/)
  match(rendererHtml, /printf a\|b/)
  match(rendererHtml, /Render quickly/)
  match(rendererHtml, /No visualization model runs by default/)
  match(rendererHtml, /<th scope="col"/)
  match(rendererHtml, /<code class="language-md">/)
  match(rendererHtml, /## Fake section/)
  doesNotMatch(rendererHtml, /<h2 class="lp-heading" id="fake-section">/)
})

test("renderer escapes HTML, rejects unsafe links, and keeps safe links", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-renderer-safety-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = join(directory, "unsafe.md")
  writeFileSync(input, [
    "# Safety",
    "",
    '<script>alert(1)</script> [safe](https://example.com/a_(b)) [unsafe](javascript:alert(1))',
    "*italic* and _emphasis_ **strong**",
    "",
    "google_drive and CONNECTOR_PROVIDERS, then CONNECTOR_OPTIONS and inspect_connections.",
    "",
    "Use _emphasis_ and __strong__ beside CONNECTOR_OPTIONS, plus _CONNECTOR_OPTIONS_ and __inspect_connections__.",
    "",
    "_word and right_wordtail stay literal without a valid closer.",
    "",
    "_unmatched,_identifier must not close at an identifier opener.",
    "",
    '<u>marked **bold** and `code`</u> <u onclick="bad()">unsafe</u> <U>uppercase</U> <u>unclosed <span>literal</span>',
    "`<u>literal</u> *literal*`",
    "```html",
    "<u>fenced</u> *literal*",
    "```",
  ].join("\n"))
  const output = join(directory, "artifact.html")
  const result = runRenderer(input, output)
  strictEqual(result.status, 0, result.stderr)
  const html = readFileSync(output, "utf8")
  match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  match(html, /href="https:\/\/example\.com\/a_\(b\)"/)
  doesNotMatch(html, /href="javascript:/i)
  match(html, /\[unsafe\]\(javascript:alert\(1\)\)/)
  match(html, /<em class="lp-inline-em">italic<\/em> and <em class="lp-inline-em">emphasis<\/em> <strong>strong<\/strong>/)
  match(html, /<p class="lp-paragraph">google_drive and CONNECTOR_PROVIDERS, then CONNECTOR_OPTIONS and inspect_connections\.<\/p>/)
  match(html, /<p class="lp-paragraph">Use <em class="lp-inline-em">emphasis<\/em> and <strong>strong<\/strong> beside CONNECTOR_OPTIONS, plus <em class="lp-inline-em">CONNECTOR_OPTIONS<\/em> and <strong>inspect_connections<\/strong>\.<\/p>/)
  match(html, /<p class="lp-paragraph">_word and right_wordtail stay literal without a valid closer\.<\/p>/)
  match(html, /<p class="lp-paragraph">_unmatched,_identifier must not close at an identifier opener\.<\/p>/)
  match(html, /<u class="lp-inline-underline">marked <strong>bold<\/strong> and <code class="lp-inline-code">code<\/code><\/u>/)
  match(html, /&lt;u onclick=&quot;bad\(\)&quot;&gt;unsafe&lt;\/u&gt;/)
  match(html, /&lt;U&gt;uppercase&lt;\/U&gt;/)
  match(html, /&lt;u&gt;unclosed &lt;span&gt;literal&lt;\/span&gt;/)
  match(html, /<code class="lp-inline-code">&lt;u&gt;literal&lt;\/u&gt; \*literal\*<\/code>/)
  match(html, /<pre class="lp-code"><code class="language-html">&lt;u&gt;fenced&lt;\/u&gt; \*literal\*<\/code><\/pre>/)
  doesNotMatch(html, /<u[^>]*onclick=/)
})

test("renderer previews local SVG artifacts and keeps editable sources linked", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "workflow-plan-artifacts-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = join(directory, "wave.md")
  writeFileSync(input, "# Wave\n\n![Flow](flow.svg) [Edit flow](flow.excalidraw) ![unsafe](https://example.com/flow.svg)")
  const output = join(directory, "wave.html")
  const result = runRenderer(input, output)
  strictEqual(result.status, 0, result.stderr)
  const html = readFileSync(output, "utf8")
  match(html, /<img src="flow\.svg" alt="Flow" loading="lazy">/)
  match(html, /href="flow\.excalidraw"/)
  doesNotMatch(html, /<img[^>]*https:\/\//)
})

test("renderer rejects missing, empty, and unwritable destinations without artifacts", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-renderer-errors-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const missing = join(directory, "missing.md")
  const missingResult = runRenderer(missing, join(directory, "missing.html"))
  notEqual(missingResult.status, 0)

  const empty = join(directory, "empty.md")
  const emptyOutput = join(directory, "empty.html")
  writeFileSync(empty, "\n")
  const emptyResult = runRenderer(empty, emptyOutput)
  notEqual(emptyResult.status, 0)
  strictEqual(existsSync(emptyOutput), false)

  const valid = join(directory, "valid.md")
  writeFileSync(valid, "# Valid")
  const outputDirectory = join(directory, "output-directory")
  mkdirSync(outputDirectory)
  const unwritableResult = runRenderer(valid, outputDirectory)
  notEqual(unwritableResult.status, 0)
  strictEqual(readdirSync(outputDirectory).length, 0)
})

test("brief view hides unused areas and keeps its authority context visible", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-renderer-brief-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = join(directory, "plan.md")
  const reviewFile = join(directory, "review.json")
  const output = join(directory, "plan.html")
  writeFileSync(input, "# Full Plan\n\n## Technical plan\n\nKeep the full specification here.\n\n## Verification\n\nThe focused check remains visible.")
  writeFileSync(reviewFile, JSON.stringify({
    title: "Small <review>",
    summary: "A concise view of the approved intent.",
    actions: [{ title: "Keep scope clear", description: "Make only the listed changes." }],
    success: [{ title: "Checks pass", description: "Expected outcomes stay separate from completed checks." }],
    boundary: "Local renderer and checks only. Human approval still applies.",
    risksIntro: "This intro is hidden while there are no material risks.",
  }))

  const result = runRenderer(input, output, reviewFile)
  strictEqual(result.status, 0, result.stderr)
  const html = readFileSync(output, "utf8")
  match(html, /Small &lt;review&gt;/)
  match(html, /Proposed actions/)
  match(html, /Review boundary/)
  match(html, /Human approval still applies/)
  match(html, /<summary[^>]*>[\s\S]*?Expected outcomes[\s\S]*?1 outcome[\s\S]*?<\/summary>/)
  match(html, /<span class="lp-detail-title">Technical plan<\/span>/)
  match(html, /<span class="lp-detail-title">Verification<\/span>/)
  strictEqual(
    html.indexOf('<span class="lp-detail-title">Technical plan')
      < html.indexOf('<span class="lp-detail-title">Verification'),
    true,
  )
  doesNotMatch(html, /This intro is hidden while there are no material risks/)
  match(html, /<h3 class="lp-source-heading">Source document<\/h3>/)
  match(html, /class="lp-detail-summary-icon"><svg class="lp-icon" aria-hidden="true"/)
  doesNotMatch(html, /<section class="lp-risk|<section class="lp-questions|<section class="lp-visual-slot/)
  doesNotMatch(html, /<div class="lp-tabs"/)
  doesNotMatch(html, /<details[^>]* open/)
})

test("brief view renders grouped details, rich explanations, and supporting visuals", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-renderer-rich-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = join(directory, "plan.md")
  const reviewFile = join(directory, "review.json")
  const outputDirectory = join(directory, "viewer")
  mkdirSync(outputDirectory)
  const plan = [
    "# Full Plan",
    "",
    "## Technical plan",
    "",
    "The plan explains where destination checks run.",
    "",
    "The handler reuses `CONNECTOR_OPTIONS`. See [source](https://example.com/spec).",
    "",
    "| Value | Result |",
    "| --- | --- |",
    "| Current | Kept |",
    "| `<bad>` | Rejected |",
    "",
    "- Keep callers on one validator.",
    "",
    "```sh",
    "node verify.mjs",
    "```",
    "",
    "## Verification",
    "",
    "The focused check covers current and saved destinations.",
    "",
    "## Deferred work",
    "",
    "The provider flow remains outside this change.",
  ].join("\n")
  writeFileSync(input, plan)
  writeFileSync(join(directory, "flow.svg"), '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect width="200" height="50"/></svg>')
  writeFileSync(join(directory, "flow.excalidraw"), "{}")
  writeFileSync(join(directory, "preview.png"), "png placeholder")
  writeFileSync(join(directory, "preview.jpg"), "jpg placeholder")
  writeFileSync(join(directory, "preview.jpeg"), "jpeg placeholder")
  writeFileSync(join(directory, "preview.webp"), "webp placeholder")
  writeFileSync(join(directory, "mockup.html"), '<script>window.parent.parentCanary = true</script><p>Mockup</p>')
  writeFileSync(join(directory, "notes.pdf"), "pdf placeholder")
  writeFileSync(reviewFile, JSON.stringify({
    title: "Review a complete proposal",
    summary: "Compare proposed actions and supporting evidence.",
    actionsIntro: "Both actions keep existing checks in control and preserve current caller behavior.",
    actions: [{
      title: "Keep **`CONNECTOR_OPTIONS`** <safe>",
      description: "Retain current destination checks.",
      technical: "The saved value reaches the current validator.\n\n- Reject invalid values.\n- Keep the existing fallback.\n\n```sh\nnode verify.mjs\n```",
      icon: "shield-check",
    }],
    success: [{ title: "Existing flow works", description: "The original caller still succeeds." }],
    boundary: "Source changes and focused checks only.",
    risksIntro: "Confidence depends on checking both existing and saved destination paths.",
    risks: [{
      title: "Caller behavior can vary",
      description: "The full plan covers each caller.",
      technical: "Some callers may supply different destination forms. The plan keeps that uncertainty visible.",
    }],
    questions: [{ title: "Review sample data", description: "Confirm the generic example fits." }],
    details: {
      intro: "The deeper sections explain where destination checks run, how a saved value returns, and what remains to verify.",
      groups: [
        {
          title: "How it works",
          sections: [{
            heading: "Technical plan",
            summary: "Shows the shared destination check and its current failure cases.",
            icon: "workflow",
            layered: true,
          }],
        },
        {
          title: "Checks",
          sections: [{
            heading: "Verification",
            summary: "Covers the current and saved destination paths.",
            icon: "clipboard-list",
            layered: true,
          }],
        },
      ],
    },
    artifacts: [
      {
        title: "Linear flow",
        caption: "Steps show a short path.",
        steps: [{ title: "Read input", icon: "file-text" }, { title: "Return result", icon: "workflow" }],
      },
      {
        title: "SVG preview",
        caption: "The original-size image stays scrollable.",
        path: "flow.svg",
        sourcePath: "flow.excalidraw",
      },
      { title: "PNG preview", caption: "PNG files preview inline.", path: "preview.png" },
      { title: "JPG preview", caption: "JPG files preview inline.", path: "preview.jpg" },
      { title: "JPEG preview", caption: "JPEG files preview inline.", path: "preview.jpeg" },
      { title: "WebP preview", caption: "WebP files preview inline.", path: "preview.webp" },
      { title: "HTML mockup", caption: "HTML stays in its sandbox.", path: "mockup.html", placement: "wide" },
      { title: "Notes file", caption: "Other files use a descriptive link.", path: "notes.pdf" },
    ],
  }))

  const output = join(outputDirectory, "plan.html")
  const result = runRenderer(input, output, reviewFile)
  strictEqual(result.status, 0, result.stderr)
  const html = readFileSync(output, "utf8")
  match(html, /role="tablist" aria-label="Supporting visuals"/)
  match(html, /role="tab" aria-controls="lp-artifact-1" aria-selected="true"/)
  match(html, /aria-labelledby="lp-artifact-1-tab" tabindex="0"/)
  match(html, /data-placement="wide"/)
  match(html, /class="lp-icon" aria-hidden="true"/)
  match(html, /src="\.\.\/flow\.svg" alt="SVG preview"/)
  match(html, /src="\.\.\/preview\.png"/)
  match(html, /src="\.\.\/preview\.jpg"/)
  match(html, /src="\.\.\/preview\.jpeg"/)
  match(html, /src="\.\.\/preview\.webp"/)
  match(html, /href="\.\.\/flow\.excalidraw"/)
  match(html, /Open full size/)
  match(html, /Open Notes file/)
  match(html, /PDF file/)
  match(html, /sandbox="allow-scripts"/)
  doesNotMatch(html, /parentCanary/)
  doesNotMatch(html, /<article class="lp-artifact[^>]* hidden=/)
  match(html, /Tabs need JavaScript; all artifact panels remain visible below/)
  match(html, /ArrowRight/)
  match(html, /ArrowLeft/)
  match(html, /event\.key === "Home"/)
  match(html, /event\.key === "End"/)
  match(html, /Material risks/)
  match(html, /<h2>Proposed actions<\/h2><p class="lp-section-intro">Both actions keep existing checks in control and preserve current caller behavior\.<\/p><ul class="lp-entry-list">/)
  match(html, /<h2>Material risks<\/h2><p class="lp-section-intro">Confidence depends on checking both existing and saved destination paths\.<\/p><ul class="lp-entry-list">/)
  match(html, /<strong><code class="lp-inline-code">CONNECTOR_OPTIONS<\/code><\/strong> &lt;safe&gt;/)
  match(html, /class="lp-entry-technical"><p class="lp-paragraph">The saved value reaches the current validator\.<\/p>\n<ul class="lp-list">[\s\S]*?<pre class="lp-code"><code class="language-sh">node verify\.mjs<\/code><\/pre>/)
  match(html, /Some callers may supply different destination forms\./)
  match(html, /Open questions/)
  match(html, /Review boundary/)
  match(html, /<p class="lp-plan-intro">The deeper sections explain where destination checks run, how a saved value returns, and what remains to verify\.<\/p>/)
  const groupPositions = ["How it works", "Checks", "Additional details"].map((title) => html.indexOf(title))
  strictEqual(groupPositions.every((position) => position >= 0), true)
  strictEqual(groupPositions[0] < groupPositions[1] && groupPositions[1] < groupPositions[2], true)
  match(html, /<span class="lp-detail-title">Technical plan<\/span><span class="lp-detail-preview">Shows the shared destination check and its current failure cases\.<\/span>/)
  match(html, /<div class="lp-detail-deeper"><p class="lp-paragraph">The handler reuses <code class="lp-inline-code">CONNECTOR_OPTIONS<\/code>\./)
  match(html, /<table class="lp-table">[\s\S]*&lt;bad&gt;[\s\S]*?<ul class="lp-list">[\s\S]*?<pre class="lp-code"><code class="language-sh">node verify\.mjs<\/code><\/pre>/)
  match(html, /<span class="lp-detail-title">Deferred work<\/span>/)
  const verificationStart = html.indexOf('<span class="lp-detail-title">Verification')
  const additionalStart = html.indexOf("Additional details", verificationStart)
  const verification = html.slice(verificationStart, additionalStart)
  doesNotMatch(verification, /lp-detail-deeper/)
  match(html, /<h3 class="lp-source-heading">Source document<\/h3><details class="lp-detail lp-source"><summary>/)
  ok(html.includes('<pre><code>' + escapeHtml(plan) + '</code></pre>'))
  match(html, /href="https:\/\/example\.com\/spec"/)
  match(html, /The focused check covers current and saved destinations/)
})

test("renderer identifies malformed briefs, unknown icons, and unsafe or missing artifacts", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-renderer-invalid-review-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = join(directory, "plan.md")
  const reviewFile = join(directory, "review.json")
  writeFileSync(input, "# Full Plan\n\n## Scope\n\nThe plan remains complete.")
  const base = {
    title: "Check review input",
    summary: "Validate the small human-facing brief.",
    actions: [{ title: "Keep input valid", description: "Show actionable field errors." }],
    success: [{ title: "Reject bad paths", description: "Do not write a broken page." }],
    boundary: "Validation only.",
  }
  const details = (sections) => ({
    intro: "Read the destination flow and its checks.",
    groups: [{ title: "How it works", sections }],
  })
  const malformedFile = join(directory, "malformed.json")
  writeFileSync(malformedFile, "{")
  const malformed = runRenderer(input, join(directory, "malformed.html"), malformedFile)
  notEqual(malformed.status, 0)
  match(malformed.stderr, /--review file is not valid JSON/)
  strictEqual(existsSync(join(directory, "malformed.html")), false)

  const cases = [
    ["unknown-icon", { ...base, actions: [{ ...base.actions[0], icon: "not-in-bank" }] }, /--review\.actions\[0\]\.icon names an unknown icon/],
    ["actions-intro-type", { ...base, actionsIntro: 42 }, /--review\.actionsIntro must be a non-empty string/],
    ["technical-type", { ...base, actions: [{ ...base.actions[0], technical: 42 }] }, /--review\.actions\[0\]\.technical must be a non-empty string/],
    ["details-icon", { ...base, details: details([{ heading: "Scope", summary: "A preview.", icon: "not-in-bank" }]) }, /--review\.details\.groups\[0\]\.sections\[0\]\.icon names an unknown icon/],
    ["details-layered-type", { ...base, details: details([{ heading: "Scope", summary: "A preview.", layered: "yes" }]) }, /--review\.details\.groups\[0\]\.sections\[0\]\.layered must be a boolean/],
    ["stale-heading", { ...base, details: details([{ heading: "Old scope", summary: "A preview." }]) }, /\.heading does not match a plan H2 section/],
    ["duplicate-assignment", { ...base, details: details([
      { heading: "Scope", summary: "First preview." },
      { heading: "Scope", summary: "Second preview." },
    ]) }, /\.heading assigns a plan H2 section more than once/],
    ["missing-file", { ...base, artifacts: [{ title: "Missing preview", caption: "This path is absent.", path: "missing.svg" }] }, /--review\.artifacts\[0\]\.path file does not exist/],
    ["outside-path", { ...base, artifacts: [{ title: "Outside preview", caption: "This path escapes the plan.", path: "../outside.svg" }] }, /--review\.artifacts\[0\]\.path must stay inside the plan directory/],
  ]
  for (const [name, value, error] of cases) {
    const output = join(directory, name + ".html")
    writeFileSync(reviewFile, JSON.stringify(value))
    const result = runRenderer(input, output, reviewFile)
    notEqual(result.status, 0)
    match(result.stderr, error)
    strictEqual(existsSync(output), false)
  }

  writeFileSync(input, "# Full Plan\n\n## Scope\n\nFirst section.\n\n## Scope\n\nSecond section.")
  writeFileSync(reviewFile, JSON.stringify({
    ...base,
    details: details([{ heading: "Scope", summary: "A preview." }]),
  }))
  const ambiguousOutput = join(directory, "ambiguous-heading.html")
  const ambiguous = runRenderer(input, ambiguousOutput, reviewFile)
  notEqual(ambiguous.status, 0)
  match(ambiguous.stderr, /\.heading matches more than one plan H2 section/)
  strictEqual(existsSync(ambiguousOutput), false)

  writeFileSync(input, "# Full Plan\n\n## Scope\n\n- A list cannot start a layered explanation.")
  writeFileSync(reviewFile, JSON.stringify({
    ...base,
    details: details([{ heading: "Scope", summary: "A preview.", layered: true }]),
  }))
  const layeredOutput = join(directory, "layered-without-prose.html")
  const layered = runRenderer(input, layeredOutput, reviewFile)
  notEqual(layered.status, 0)
  match(layered.stderr, /layered body must start with a prose paragraph/)
  strictEqual(existsSync(layeredOutput), false)
})

test("icon commands list names and return one SVG", () => {
  const names = runCli(["--list-icons"])
  strictEqual(names.status, 0, names.stderr)
  match(names.stdout, /^file-text\tDocument/m)
  match(names.stdout, /^workflow\tWorkflow/m)
  match(names.stdout, /^triangle-alert\tRisk status/m)

  const icon = runCli(["--icon", "workflow"])
  strictEqual(icon.status, 0, icon.stderr)
  match(icon.stdout, /^<svg[^>]+viewBox="0 0 24 24"/)
  match(icon.stdout, /<rect/)
  doesNotMatch(icon.stdout, /file-text|triangle-alert/)

  const unknown = runCli(["--icon", "unknown"])
  notEqual(unknown.status, 0)
  match(unknown.stderr, /--icon names an unknown icon/)
})
