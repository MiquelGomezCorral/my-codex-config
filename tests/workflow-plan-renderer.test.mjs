import { test } from "node:test"
import { deepStrictEqual, match, notEqual, strictEqual } from "node:assert"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

const root = resolve(new URL("..", import.meta.url).pathname)
const renderer = join(root, "config/skills/artifacts/scripts/render-plan.mjs")

function runRenderer(input, output, review) {
  const args = [renderer, "--input", input, "--output", output]
  if (review) args.push("--review", review)
  return spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" })
}

function pageData(output) {
  const html = readFileSync(output, "utf8")
  return JSON.parse(html.match(/<script type="application\/json" id="data">\n([\s\S]*?)\n<\/script>/)[1])
}

function detailTitles(section) {
  return section.blocks.filter((block) => block.type === "details").map((block) => [block.heading ?? null, block.items.map((item) => item.title)])
}

const plan = [
  "# Full Plan",
  "",
  "Opening context.",
  "",
  "## Scope",
  "",
  "```md",
  "## Fake section",
  "```",
  "",
  "## Verification",
  "",
  "The focused check.",
].join("\n")

const brief = {
  title: "Check the brief",
  summary: "Validate the small human-facing brief.",
  actions: [{ title: "Keep input valid", description: "Show actionable field errors." }],
  success: [{ title: "Reject bad paths", description: "Do not write a broken page." }],
  boundary: "Validation only.",
}

test("plan page keeps every section, with or without detail groups", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-renderer-sections-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = join(directory, "plan.md")
  const reviewFile = join(directory, "review.json")
  writeFileSync(input, plan)

  const plain = runRenderer(input, join(directory, "plain.html"))
  strictEqual(plain.status, 0, plain.stderr)
  const plainPage = pageData(join(directory, "plain.html"))
  deepStrictEqual(plainPage.sections[0].blocks, [{ type: "text", text: "Opening context." }])
  const plainDetails = plainPage.sections.at(-1)
  deepStrictEqual(detailTitles(plainDetails), [
    [null, ["Scope", "Verification"]],
    ["Source document", ["Full Markdown source"]],
  ])
  strictEqual(plainDetails.blocks.at(-1).items[0].blocks[0].text, plan)

  writeFileSync(reviewFile, JSON.stringify({
    ...brief,
    details: { intro: "Where checks run.", groups: [{ title: "How it works", sections: [{ heading: "Verification", summary: "The check." }] }] },
  }))
  const grouped = runRenderer(input, join(directory, "grouped.html"), reviewFile)
  strictEqual(grouped.status, 0, grouped.stderr)
  deepStrictEqual(detailTitles(pageData(join(directory, "grouped.html")).sections.at(-1)), [
    [null, ["Plan notes"]],
    ["How it works", ["Verification"]],
    ["Additional details", ["Scope"]],
    ["Source document", ["Full Markdown source"]],
  ])
})

test("renderer rejects malformed briefs, unknown icons, and unsafe or missing artifacts before writing", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-renderer-invalid-review-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const input = join(directory, "plan.md")
  const reviewFile = join(directory, "review.json")
  writeFileSync(input, "# Full Plan\n\n## Scope\n\nThe plan remains complete.")
  const details = (sections) => ({ intro: "Read the destination flow and its checks.", groups: [{ title: "How it works", sections }] })
  const steps = [{ title: "Read", description: "Reads the value." }, { title: "Return" }]

  const malformedFile = join(directory, "malformed.json")
  writeFileSync(malformedFile, "{")
  const malformed = runRenderer(input, join(directory, "malformed.html"), malformedFile)
  notEqual(malformed.status, 0)
  match(malformed.stderr, /--review file is not valid JSON/)
  strictEqual(existsSync(join(directory, "malformed.html")), false)

  const cases = [
    ["unknown-icon", { ...brief, actions: [{ ...brief.actions[0], icon: "not-in-bank" }] }, /--review\.actions\[0\]\.icon names an unknown icon/],
    ["technical-type", { ...brief, actions: [{ ...brief.actions[0], technical: 42 }] }, /--review\.actions\[0\]\.technical must be a non-empty string/],
    ["details-layered-type", { ...brief, details: details([{ heading: "Scope", summary: "A preview.", layered: "yes" }]) }, /\.layered must be a boolean/],
    ["stale-heading", { ...brief, details: details([{ heading: "Old scope", summary: "A preview." }]) }, /\.heading does not match a plan H2 section/],
    ["duplicate-assignment", { ...brief, details: details([{ heading: "Scope", summary: "One." }, { heading: "Scope", summary: "Two." }]) }, /\.heading assigns a plan H2 section more than once/],
    ["step-description", { ...brief, artifacts: [{ title: "Flow", caption: "What the flow shows.", steps }] }, /--review\.artifacts\[0\]\.steps\[1\]\.description must be a non-empty string/],
    ["missing-file", { ...brief, artifacts: [{ title: "Missing", caption: "This path is absent.", path: "missing.svg" }] }, /--review\.artifacts\[0\]\.path file does not exist/],
    ["outside-path", { ...brief, artifacts: [{ title: "Outside", caption: "This path escapes the plan.", path: "../outside.svg" }] }, /--review\.artifacts\[0\]\.path must stay inside the plan directory/],
  ]
  for (const [name, value, error] of cases) {
    const output = join(directory, name + ".html")
    writeFileSync(reviewFile, JSON.stringify(value))
    const result = runRenderer(input, output, reviewFile)
    notEqual(result.status, 0, name)
    match(result.stderr, error)
    strictEqual(existsSync(output), false)
  }
})
