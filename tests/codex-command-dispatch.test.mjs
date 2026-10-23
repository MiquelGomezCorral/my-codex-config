import { doesNotMatch, match, strictEqual } from "node:assert"
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { test } from "node:test"

const root = resolve(new URL("..", import.meta.url).pathname)
const dispatcher = join(root, "config/bin/codex-command-dispatch.mjs")

function runCommand(home, prompt) {
  return spawnSync("node", [dispatcher], {
    input: JSON.stringify({ prompt }),
    encoding: "utf8",
    env: { ...process.env, CODEX_HOME: home },
  })
}

test("repository commands load one skill and preserve arguments", () => {
  const home = mkdtempSync(join(tmpdir(), "codex-command-"))
  try {
    symlinkSync(join(root, "config/commands"), join(home, "commands"), "dir")
    for (const [name, skill] of [
      ["cleanup", "cleanup"], ["code", "code"], ["commit", "git"],
      ["index", "codegraph-setup"], ["init", "project-init"], ["merge", "git"],
      ["workflow", "workflow"],
      ["refine-plan", "refine-plan"],
      ["review-findings", "review-findings"], ["review-plan", "review-plan"],
      ["review-pr-comments", "git"], ["review", "review"],
    ]) {
      const result = runCommand(home, `/commands/${name} preserve the public API`)
      strictEqual(result.status, 0, result.stderr)
      match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, new RegExp(`\\$${skill}`))
    }

    const argumentsText = "preserve the public API\nand rerun $& "
    const result = runCommand(home, `/commands/cleanup ${argumentsText}`)
    strictEqual(result.status, 0, result.stderr)
    const context = JSON.parse(result.stdout).hookSpecificOutput.additionalContext
    match(context, /\$cleanup/)
    match(context, /preserve the public API\nand rerun \$& /)
    doesNotMatch(context, /\$ARGUMENTS|\(none\)/)

    const empty = runCommand(home, "/commands/cleanup")
    strictEqual(empty.status, 0, empty.stderr)
    doesNotMatch(JSON.parse(empty.stdout).hookSpecificOutput.additionalContext, /\(none\)/)

    const combinedGit = runCommand(home, "/commands/commit --push --pr")
    strictEqual(combinedGit.status, 0, combinedGit.stderr)
    const gitContext = JSON.parse(combinedGit.stdout).hookSpecificOutput.additionalContext
    match(gitContext, /\$git/)
    match(gitContext, /--push --pr/)

    const unknown = runCommand(home, "/commands/does-not-exist")
    strictEqual(unknown.status, 0, unknown.stderr)
    strictEqual(JSON.parse(unknown.stdout).decision, "block")

    const plain = runCommand(home, "ordinary prompt")
    strictEqual(plain.status, 0, plain.stderr)
    strictEqual(plain.stdout, "")

    const escapedHome = mkdtempSync(join(tmpdir(), "codex-command-escape-"))
    try {
      mkdirSync(join(escapedHome, "commands"))
      const outside = join(escapedHome, "outside.md")
      writeFileSync(outside, "---\nskill: cleanup\n---\n$ARGUMENTS\n")
      symlinkSync(outside, join(escapedHome, "commands", "cleanup.md"))
      const escaped = runCommand(escapedHome, "/commands/cleanup")
      strictEqual(JSON.parse(escaped.stdout).decision, "block")
    } finally {
      rmSync(escapedHome, { recursive: true, force: true })
    }
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
