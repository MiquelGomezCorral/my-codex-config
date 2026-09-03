#!/usr/bin/env node

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function parsePrompt(argv) {
  if (argv[0] === "--prompt") return argv.slice(1).join(" ")
  if (argv.length) return argv.join(" ")
  try { return readFileSync(0, "utf8").trim() } catch { return "" }
}

export async function searchVault(prompt) {
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Usage: search.mjs [--prompt TEXT | TEXT]")
  }

  // This adapter is explicit by design; ordinary Codex prompts never call it.
  process.env.VAULT_CONTEXT_MODE = "force"
  const module = await import(join(root, "vault-context.js"))
  const plugin = await module.default()
  const output = {
    message: { id: "codex-vault-search" },
    parts: [{ type: "text", text: prompt }],
  }
  await plugin["chat.message"]({ sessionID: "codex-vault-search" }, output)
  return output.parts.find((part) => part?.synthetic && part.type === "text")?.text || ""
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(await searchVault(parsePrompt(process.argv.slice(2))))
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
