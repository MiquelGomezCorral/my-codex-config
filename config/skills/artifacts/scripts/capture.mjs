#!/usr/bin/env node
// Capture evidence of a running page: a PNG screenshot or a short video.
// Headless Chrome records the page over the DevTools protocol; ffmpeg joins video frames.
import { execFileSync, spawn } from "node:child_process"
import { once } from "node:events"
import { accessSync, constants, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { delimiter, dirname, extname, join, resolve } from "node:path"
import { parseArgs } from "node:util"

const usage = "usage: node capture.mjs <url> --screenshot <file.png>\n"
  + "       node capture.mjs <url> --video <file.webm> [--seconds <n>]"
const VIEWPORT = { width: 1280, height: 720 }
const CHROME_NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome"]
const TIMEOUT_MS = 30_000
const CHROME_STOP_GRACE_MS = 5_000
const MAX_SECONDS = 120

async function withTimeout(promise, milliseconds, message) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), milliseconds)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  for (const directory of (process.env.PATH ?? "").split(delimiter)) {
    for (const name of CHROME_NAMES) {
      const candidate = join(directory, name)
      try {
        accessSync(candidate, constants.X_OK)
        return candidate
      } catch {
        // Not here; try the next candidate.
      }
    }
  }
  throw new Error("Chrome not found; install it or set CHROME_PATH")
}

// Chrome picks a free debugging port and prints the browser endpoint on stderr.
function launchChrome(chromePath, profile) {
  const args = [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`, "--hide-scrollbars", "--no-first-run",
    "--no-default-browser-check", "about:blank",
  ]
  // Its own process group lets cleanup stop Chrome's helper processes along with it.
  const chrome = spawn(chromePath, args, { detached: true, stdio: ["ignore", "ignore", "pipe"] })
  const endpoint = new Promise((resolveEndpoint, reject) => {
    let log = ""
    chrome.stderr.on("data", (chunk) => {
      log += chunk
      const match = log.match(/DevTools listening on (ws:\/\/\S+)/)
      if (match) resolveEndpoint(match[1])
    })
    chrome.on("error", reject)
    chrome.on("exit", (code, signal) => reject(new Error(`Chrome exited (${code ?? signal}) before it was ready:\n${log}`)))
  })
  return { chrome, endpoint }
}

// Chrome's whole process group gets SIGTERM; SIGKILL follows if it ignores it, so a hung Chrome
// cannot hold the capture open.
async function stopChrome(chrome) {
  if (chrome.pid === undefined || chrome.exitCode !== null || chrome.signalCode !== null) return
  const exited = once(chrome, "exit")
  signalGroup(chrome.pid, "SIGTERM")
  const forceKill = setTimeout(signalGroup, CHROME_STOP_GRACE_MS, chrome.pid, "SIGKILL")
  try {
    await exited
  } finally {
    clearTimeout(forceKill)
  }
}

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal)
  } catch (error) {
    // ESRCH: the group is already gone, which is what the caller wants.
    if (error.code !== "ESRCH") throw error
  }
}

async function connect(endpoint) {
  const socket = new WebSocket(endpoint)
  await withTimeout(new Promise((resolveOpen, reject) => {
    socket.onopen = resolveOpen
    socket.onerror = () => reject(new Error("could not connect to Chrome DevTools"))
  }), TIMEOUT_MS, "Chrome DevTools did not accept the connection")

  let lastId = 0
  let failure
  const pending = new Map()
  const listeners = new Map()
  // Once the socket is gone no reply can arrive, so every waiting and later request fails at once.
  const fail = (message) => {
    failure ??= new Error(message)
    for (const { reject } of pending.values()) reject(failure)
    pending.clear()
  }
  socket.onclose = () => fail("Chrome DevTools connection closed")
  socket.onerror = () => fail("Chrome DevTools connection failed")
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.id === undefined) {
      listeners.get(message.method)?.(message.params)
      return
    }
    const call = pending.get(message.id)
    if (!call) return // The request already timed out.
    pending.delete(message.id)
    if (message.error) call.reject(new Error(message.error.message))
    else call.resolveCall(message.result)
  }

  return {
    send: (method, params = {}, sessionId = undefined) => {
      if (failure) return Promise.reject(failure)
      lastId += 1
      const id = lastId
      const reply = new Promise((resolveCall, reject) => {
        pending.set(id, { resolveCall, reject })
        socket.send(JSON.stringify({ id, method, params, sessionId }))
      })
      return withTimeout(reply, TIMEOUT_MS, `Chrome did not answer ${method}`)
        .finally(() => pending.delete(id))
    },
    on: (method, listener) => listeners.set(method, listener),
    once: (method) => new Promise((resolveEvent) => listeners.set(method, resolveEvent)),
    close: () => socket.close(),
  }
}

async function openPage(cdp, url) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
  const send = (method, params) => cdp.send(method, params, sessionId)
  await send("Page.enable")
  await send("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 1, mobile: false })

  const loaded = cdp.once("Page.loadEventFired")
  const { errorText } = await send("Page.navigate", { url })
  if (errorText) throw new Error(`cannot open ${url}: ${errorText}`)
  await withTimeout(loaded, TIMEOUT_MS, `${url} did not finish loading`)
  return send
}

async function saveScreenshot(send, file) {
  const { data } = await send("Page.captureScreenshot", { format: "png" })
  writeFileSync(file, Buffer.from(data, "base64"))
}

// The screencast only sends a frame when the page repaints, so a still page starts with one
// screenshot to guarantee a first frame.
async function recordFrames(cdp, send, seconds, framesDirectory) {
  const frames = []
  const keep = (data) => {
    const file = join(framesDirectory, `frame-${String(frames.length).padStart(6, "0")}.jpg`)
    writeFileSync(file, Buffer.from(data, "base64"))
    frames.push({ file, at: Date.now() / 1000 })
  }
  keep((await send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data)
  cdp.on("Page.screencastFrame", ({ data, sessionId }) => {
    keep(data)
    // Chrome stops sending frames until each one is acknowledged; a late failure is harmless.
    send("Page.screencastFrameAck", { sessionId }).catch(() => {})
  })
  await send("Page.startScreencast", { format: "jpeg", quality: 80, maxWidth: VIEWPORT.width, maxHeight: VIEWPORT.height })
  await new Promise((resolveWait) => setTimeout(resolveWait, seconds * 1000))
  await send("Page.stopScreencast")
  return { frames, end: Date.now() / 1000 }
}

// ffmpeg's concat list needs the last frame named twice for its duration to count.
function encodeVideo({ frames, end }, listFile, output) {
  const lines = frames.map((frame, index) => {
    const next = frames[index + 1]?.at ?? end
    return `file '${frame.file}'\nduration ${(next - frame.at).toFixed(3)}`
  })
  lines.push(`file '${frames.at(-1).file}'`)
  writeFileSync(listFile, lines.join("\n"))

  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listFile,
    "-vf", "fps=25,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
    "-c:v", "libvpx-vp9", "-crf", "35", "-b:v", "0", "-an", output,
  ])
}

function parseOptions(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { screenshot: { type: "string" }, video: { type: "string" }, seconds: { type: "string", default: "5" } },
  })
  const [url] = positionals
  if (positionals.length !== 1 || !/^https?:\/\//i.test(url)) throw new Error(`need one http or https URL\n${usage}`)
  if (Boolean(values.screenshot) === Boolean(values.video)) throw new Error(`pass exactly one of --screenshot and --video\n${usage}`)

  const output = resolve(values.screenshot ?? values.video)
  const extension = values.screenshot ? ".png" : ".webm"
  if (extname(output) !== extension) throw new Error(`output must end in ${extension}`)
  const seconds = Number(values.seconds)
  if (!(seconds > 0 && seconds <= MAX_SECONDS)) throw new Error(`--seconds must be between 0 and ${MAX_SECONDS}`)
  return { url, output, video: Boolean(values.video), seconds }
}

async function main() {
  const { url, output, video, seconds } = parseOptions(process.argv.slice(2))
  const chromePath = findChrome()
  mkdirSync(dirname(output), { recursive: true })
  const work = mkdtempSync(join(tmpdir(), "capture-"))
  let chrome
  let cdp
  try {
    const launched = launchChrome(chromePath, join(work, "profile"))
    chrome = launched.chrome
    const endpoint = await withTimeout(launched.endpoint, TIMEOUT_MS, "Chrome did not start in time")
    cdp = await connect(endpoint)
    const send = await openPage(cdp, url)
    if (video) {
      const framesDirectory = join(work, "frames")
      mkdirSync(framesDirectory)
      encodeVideo(await recordFrames(cdp, send, seconds, framesDirectory), join(work, "frames.txt"), output)
    } else {
      await saveScreenshot(send, output)
    }
    console.log(output)
  } finally {
    cdp?.close()
    try {
      if (chrome) await stopChrome(chrome)
    } finally {
      // Chrome writes to its profile until it exits, so remove the work directory afterwards.
      try {
        rmSync(work, { recursive: true, force: true, maxRetries: 5 })
      } catch (error) {
        console.error(`capture: could not remove ${work}: ${error.message}`)
      }
    }
  }
}

try {
  await main()
} catch (error) {
  console.error(`capture: ${error.message || "failed"}`)
  process.exitCode = 1
}
