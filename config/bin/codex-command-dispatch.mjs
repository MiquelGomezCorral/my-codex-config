#!/usr/bin/env node

import { readFileSync, realpathSync } from "node:fs"
import { homedir } from "node:os"
import { join, relative } from "node:path"

const prefix = "/commands/"

function output(value) {
  process.stdout.write(JSON.stringify(value))
}

function block(reason) {
  output({
    decision: "block",
    reason,
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: "" },
  })
}

function commandRoot() {
  return realpathSync(join(process.env.CODEX_HOME || join(homedir(), ".codex"), "commands"))
}

function commandFile(root, name) {
  const path = realpathSync(join(root, `${name}.md`))
  if (relative(root, path).startsWith("..")) throw new Error("Command path escaped its directory")
  return path
}

async function readInput() {
  let input = ""
  for await (const chunk of process.stdin) input += chunk
  try { return JSON.parse(input.replace(/^\uFEFF/, "")) } catch { return {} }
}

const data = await readInput()
const prompt = typeof data.prompt === "string" ? data.prompt : ""
if (!prompt.startsWith(prefix)) process.exit(0)

const match = /^\/commands\/([a-z0-9][a-z0-9-]*)(?:(?:[ \t]+|\r?\n)([\s\S]*))?$/i.exec(prompt)
if (!match) {
  block("Invalid repository command. Use /commands/<name> [arguments].")
  process.exit(0)
}

const [, name, argumentsText = ""] = match
try {
  const source = readFileSync(commandFile(commandRoot(), name), "utf8")
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!frontmatter) throw new Error("Command wrapper is missing frontmatter")
  const skill = frontmatter[1].match(/^skill:\s*([a-z0-9-]+)\s*$/mi)?.[1]
  const body = source.slice(frontmatter[0].length).trim()
  if (!skill) throw new Error("Command wrapper is missing a skill")
  if (!body.includes("$ARGUMENTS")) throw new Error("Command wrapper is missing $ARGUMENTS")
  const expanded = body.replaceAll("$ARGUMENTS", () => argumentsText)
  output({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: `Repository command /commands/${name} matched. Load \`$${skill}\` and follow its workflow before responding to the original user prompt.\n\n${expanded}`,
    },
  })
} catch (error) {
  block(`Repository command /commands/${name} is unavailable: ${error.message}`)
}
