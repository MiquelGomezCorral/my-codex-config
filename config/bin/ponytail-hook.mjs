#!/usr/bin/env node

import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const modes = new Set(["off", "lite", "full", "ultra"])
const statePath = process.env.PONYTAIL_STATE_FILE || join(
  process.env.XDG_STATE_HOME || join(process.env.HOME || ".", ".local", "state"),
  "my-codex-config",
  "ponytail-active",
)

function normalizeMode(value) {
  if (typeof value !== "string") return undefined
  const mode = value.trim().toLowerCase()
  return modes.has(mode) ? mode : undefined
}

function ponytailConfigPath() {
  if (process.platform === "win32") {
    return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "ponytail", "config.json")
  }
  return join(process.env.HOME || homedir(), ".config", "ponytail", "config.json")
}

function configDefaultMode() {
  try {
    const config = JSON.parse(readFileSync(ponytailConfigPath(), "utf8"))
    return normalizeMode(config?.defaultMode)
  } catch {
    return undefined
  }
}

function defaultMode() {
  return normalizeMode(process.env.PONYTAIL_DEFAULT_MODE) || configDefaultMode() || "full"
}

function setMode(mode) {
  mkdirSync(join(statePath, ".."), { recursive: true, mode: 0o700 })
  writeFileSync(statePath, `${mode}\n`, { mode: 0o600 })
}

function clearMode() {
  try { unlinkSync(statePath) } catch { /* The flag is best effort. */ }
}

function currentMode() {
  try {
    const mode = readFileSync(statePath, "utf8").trim().toLowerCase()
    return modes.has(mode) ? mode : defaultMode()
  } catch {
    return defaultMode()
  }
}

function output(event, mode, context = "") {
  process.stdout.write(JSON.stringify({
    systemMessage: `PONYTAIL:${mode.toUpperCase()}`,
    ...(context ? {
      hookSpecificOutput: { hookEventName: event, additionalContext: context },
    } : {}),
  }))
}

async function readInput() {
  let input = ""
  for await (const chunk of process.stdin) input += chunk
  try { return JSON.parse(input.replace(/^\uFEFF/, "")) } catch { return {} }
}

const event = process.argv[2]
if (event === "session-start") {
  const mode = defaultMode()
  if (mode === "off") {
    clearMode()
  } else {
    setMode(mode)
    output("SessionStart", mode, `PONYTAIL MODE ACTIVE — level: ${mode}\n\nUse the $ponytail skill when you need the full rules.`)
  }
} else if (event === "prompt") {
  const data = await readInput()
  const prompt = typeof data.prompt === "string" ? data.prompt.trim().toLowerCase() : ""
  let mode
  if (/^[/@$]ponytail(?:\s|$)/.test(prompt)) {
    const argument = prompt.split(/\s+/)[1]
    mode = modes.has(argument) ? argument : defaultMode()
  }
  if (/\b(stop ponytail|normal mode)\b/.test(prompt)) mode = "off"
  if (mode === "off") {
    clearMode()
    output("UserPromptSubmit", "off", "PONYTAIL MODE OFF")
  } else if (mode) {
    setMode(mode)
    output("UserPromptSubmit", mode, `PONYTAIL MODE CHANGED — level: ${mode}`)
  }
}
