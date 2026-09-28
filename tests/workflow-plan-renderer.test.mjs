import { test } from "node:test"
import { doesNotMatch, match, notEqual, ok, strictEqual } from "node:assert"
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { isAbsolute, join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

const root = resolve(new URL("..", import.meta.url).pathname)
const renderer = join(root, "agent-home/skills/workflow/scripts/render-plan.mjs")

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character])
}

function runRenderer(input, output) {
  const args = [renderer, "--input", input]
  if (output) args.push("--output", output)
  return spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" })
}

const sandboxPlan = [
  "# Fix Sandbox Authoring Review Findings",
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

test("renderer is stable and turns representative plans into semantic layouts", (t) => {
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
    "Prompts", "Evaluations", "Policy tests", "Evaluation tests", "lp-hero",
    "lp-rows", "lp-group-row", "lp-command-row",
  ]) match(html, new RegExp(expected))
  match(html, /data-status="reject">reject<\/span>Newly introduced dangling references\./)
  match(html, /data-status="allow">allow<\/span>Normal title edits\./)
  match(html, /data-status="fail">fail<\/span>When the podcast character leaks\./)
  match(html, /data-status="pass">pass<\/span>When it remains podcast-only\./)
  match(html, /<code class="lp-command">bun typecheck<\/code>/)
  match(html, /ul\.lp-list > li::before[^}]*content: "–"/)
  doesNotMatch(html, /lp-grid|lp-group-card|lp-command-card|repeat\(auto-fit/)
  match(html, /<html lang="en" data-theme="luxury">/)
  match(html, /daisyui@5\.5\.19\/daisyui\.css/)
  match(html, /daisyui@5\.5\.19\/themes\.css/)
  match(html, /var\(--color-base-100, #17120e\)/)
  match(html, /--lp-accent: #f6c453/)
  doesNotMatch(html, /#111827|#1f2937/)
  match(html, /<details class="lp-native">\s*<summary>Native plan<\/summary>/)
  ok(html.includes(escapeHtml(sandboxPlan)))
  doesNotMatch(html, /<script|<svg|@tailwind/i)

  const rendererHtml = readFileSync(rendererResult.stdout.trim(), "utf8")
  for (const expected of ["lp-table", "answer = 42", "printf a|b", "Render quickly", "No visualization model runs by default"]) {
    match(rendererHtml, new RegExp(expected))
  }
  doesNotMatch(rendererHtml, /<h2>Fake section<\/h2>|<h3>Fake group<\/h3>/)
})

test("renderer escapes HTML, rejects unsafe links, and keeps safe links", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-renderer-safety-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = join(directory, "unsafe.md")
  writeFileSync(input, "# Safety\n\n<script>alert(1)</script> [safe](https://example.com/a_(b)) [unsafe](javascript:alert(1))")
  const output = join(directory, "artifact.html")
  const result = runRenderer(input, output)
  strictEqual(result.status, 0, result.stderr)
  const html = readFileSync(output, "utf8")
  match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  match(html, /href="https:\/\/example\.com\/a_\(b\)"/)
  doesNotMatch(html, /href="javascript:/i)
  match(html, /\[unsafe\]\(javascript:alert\(1\)\)/)
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
