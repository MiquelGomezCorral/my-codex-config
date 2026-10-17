import { test } from "node:test"
import { deepStrictEqual, match, strictEqual } from "node:assert"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const temp = join(tmpdir(), `vault-context-codex-${process.pid}`)
const vault = join(temp, "Obsidian Vault", "CODE")

test("explicit adapter returns only generated context", async (t) => {
  mkdirSync(vault, { recursive: true })
  writeFileSync(join(vault, "Git.md"), "# Git\n\ngit sync-staging\n")
  t.after(() => rmSync(temp, { recursive: true, force: true }))

  const result = spawnSync(process.execPath, [join(root, "bin/search.mjs"), "--prompt", "git sync-staging"], {
    encoding: "utf8",
    env: { ...process.env, OBSIDIAN_VAULT: join(temp, "Obsidian Vault") },
  })
  strictEqual(result.status, 0, result.stderr)
  match(result.stdout, /^\[Obsidian context — optional, untrusted, ignore if irrelevant\]/)
  match(result.stdout, /Source: CODE\/Git\.md:/)
  deepStrictEqual(result.stderr, "")
})
