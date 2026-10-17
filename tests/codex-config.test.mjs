import { test } from "node:test"
import { deepStrictEqual, doesNotMatch, match, ok, strictEqual } from "node:assert"
import {
  chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync,
  statSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

const root = resolve(new URL("..", import.meta.url).pathname)
const read = (path) => readFileSync(join(root, path), "utf8")

test("repository has one shared skill owner with unique valid names", () => {
  const skills = join(root, "config/skills")
  const names = []
  for (const entry of readdirSync(skills)) {
    const path = join(skills, entry, "SKILL.md")
    if (!statSync(join(skills, entry)).isDirectory() || !statSync(path, { throwIfNoEntry: false })) continue
    const body = readFileSync(path, "utf8")
    const name = body.match(/^name:\s*([^\n]+)$/m)?.[1]?.trim()
    const description = body.match(/^description:\s*(.+)$/m)?.[1]?.trim()
    strictEqual(name, entry)
    ok(description)
    ok(description.length <= 1024)
    names.push(name)
  }
  strictEqual(new Set(names).size, names.length)
  for (const required of [
    "writing", "super-agent", "cleanup", "review", "code", "git",
    "review-findings", "codegraph-setup", "agents-memory",
    "refine-plan", "review-plan", "workflow", "test-audit", "code-quality", "skill-scout", "btca",
    "bro", "orchestration", "decision-records",
  ]) ok(names.includes(required), `missing skill: ${required}`)
  for (const removed of ["core", "miquel-voice", "objective-scholar", "plan-implementation", "implementation-planning", "multi-agent-review", "code-review", "python-coding", "skillspector", "find-skills", "btca-first", "btca-cli", "orca-cli", "computer-use"]) {
    ok(!names.includes(removed), `removed skill still present: ${removed}`)
  }
  ok(!names.includes("task-model-recovery"))
  ok(!names.includes("opencode-go-worker"))
  ok(!names.includes("customize-opencode"))
  ok(statSync(join(root, "config/skills"), { throwIfNoEntry: false }))
  ok(!statSync(join(root, "agent-home"), { throwIfNoEntry: false }))
})

test("review is a thin router and code-quality owns its language references", () => {
  const review = read("config/skills/review/SKILL.md")
  const quality = read("config/skills/code-quality/SKILL.md")
  const bootstrapPi = read("bootstrap_pi.sh")

  match(review, /^## Review modes$/m)
  for (const reference of [
    "code-review", "orchestration", "ocr-evidence", "convention-audit",
  ]) {
    match(review, new RegExp(`\\[references/${reference}\\.md\\]\\(references/${reference}\\.md\\)`))
    ok(
      statSync(join(root, `config/skills/review/references/${reference}.md`), { throwIfNoEntry: false }),
      `missing review reference: ${reference}`,
    )
  }
  ok(review.split("\n").length < 100, "review/SKILL.md must stay a short router")

  const standard = read("config/skills/review/references/code-review.md")
  for (const marker of [
    "P0", "P1", "P2", "P3", "Blocked/unverified", "Approve with non-blocking comments",
    "in-scope", "out-of-scope", "unclear",
  ]) match(standard, new RegExp(marker))

  match(quality, /references\/<language>\.md/)
  match(quality, /references\/python\.md/)
  match(quality, /universal rules apply first/)
  const python = read("config/skills/code-quality/references/python.md")
  match(python, /^# Python Project Setup$/m)
  ok(python.split("\n").length >= 631)

  match(read("config/AGENTS.md"), /The standard is mandatory, not advisory/)

  const assets = read("config/bin/harness-assets.py")
  match(bootstrapPi, /harness-assets\.py/)
  match(assets, /systemPromptMode: append/)
  match(assets, /inheritProjectContext: true/)
  match(assets, /inheritGlobalContext: true/)
  match(assets, /inheritSkills: true/)
  match(assets, /async: true/)
  match(assets, /allowNestedSubagents: true/)
  doesNotMatch(assets, /^\s*tools:/m)
  doesNotMatch(bootstrapPi, /skills = \{/)

})

test("writing skill owns prose with two always-read references and two opt-in ones", () => {
  const skill = read("config/skills/writing/SKILL.md")
  const natural = read("config/skills/writing/references/natural-writing.md")
  const profile = read("config/skills/writing/references/voice-profile.md")

  match(skill, /^name: writing$/m)
  match(skill, /^## Read these two first$/m)
  match(skill, /references\/natural-writing\.md/)
  match(skill, /references\/voice-profile\.md/)
  match(skill, /only when the request is a paper, thesis, or\s+formal report/)
  match(skill, /references\/academic\.md/)
  match(skill, /references\/latex\.md/)
  match(skill, /Ask who this is for and where\s+it will be published only when/)

  for (const reference of ["natural-writing.md", "voice-profile.md", "voice-interview.md", "academic.md", "latex.md"]) {
    ok(
      statSync(join(root, `config/skills/writing/references/${reference}`), { throwIfNoEntry: false }),
      `missing reference: ${reference}`,
    )
  }

  match(natural, /Preserve coverage/)
  match(natural, /Do not introduce new AI patterns/)
  match(natural, /must pass the same contextual checks it applies/)
  match(natural, /Keep genre and audience intact/)
  for (const prefix of ["content-", "language-", "style-", "comm-", "filler-", "voice-"]) {
    match(natural, new RegExp(`\`${prefix}[a-z-]+\``))
  }
  match(natural, /^Start at 100\./m)
  match(natural, /Below 70: many deductions/)

  match(profile, /^## How to apply this profile$/m)
  for (const tier of ["HARD RULE", "STRONG TENDENCY", "LIGHT PREFERENCE"]) {
    match(profile, new RegExp(`\\*\\*${tier}`))
  }
  match(profile, /When no label exists, assume/)
  match(profile, /^## Anti-overfitting$/m)
  match(profile, /pasted unchanged into a message about anything/)
  match(profile, /calibrate rhythm, not to be quoted back/)

  const interview = read("config/skills/writing/references/voice-interview.md")
  match(skill, /references\/voice-interview\.md/)
  ok(
    profile.split("\n").length < 200,
    `compressed voice profile must stay short, got ${profile.split("\n").length} lines`,
  )
  strictEqual((interview.match(/^### Q\d+/gm) ?? []).length, 100, "the interview keeps all 100 questions")
  strictEqual((interview.match(/^## SECTION /gm) ?? []).length, 7, "the interview keeps all 7 sections")
  match(interview, /^## POST-INTERVIEW CALIBRATION$/m)
  match(interview, /ruben\.substack\.com\/p\/i-am-just-a-text-file/)
  match(profile, /ruben\.substack\.com\/p\/i-am-just-a-text-file/)
  doesNotMatch(interview, /QUICK REFERENCE CARD|HOW TO USE THIS DOCUMENT|INSTRUCTIONS FOR AGENTS/)
  doesNotMatch(profile, /^### Q\d+/m)

  ok(
    !statSync(join(root, "config/skills/writing/evals"), { throwIfNoEntry: false }),
    "writing must not carry evals",
  )
})

test("writing score example totals agree with its individual impacts and formula", () => {
  const natural = read("config/skills/writing/references/natural-writing.md")
  const rules = [...natural.matchAll(/^- \*\*`([a-z-]+)` \((HIGH|MEDIUM|LOW)\):/gm)]
  strictEqual(rules.length, 30)
  strictEqual(new Set(rules.map(rule => rule[1])).size, 30)
  for (const [id, impact] of [
    ["content-notability", "MEDIUM"],
    ["language-contractions", "LOW"],
    ["style-title-case", "LOW"],
  ]) {
    strictEqual(rules.find(rule => rule[1] === id)?.[2], impact)
  }

  const rows = [...natural.matchAll(/^(\w+) +\| +(\d+)\/(\d+)\/(\d+) +\| +(\d+)\/(\d+)\/(\d+) *$/gm)]
  const categories = rows.filter(row => row[1] !== "Overall")
  deepStrictEqual(categories.map(row => row[1]), ["Content", "Language", "Style", "Communication", "Filler", "Voice"])
  const overall = rows.find(row => row[1] === "Overall")
  ok(overall)
  const scores = natural.match(/^Score +\| +(\d+) +\| +(\d+) *$/m)
  ok(scores)
  for (const [side, offset] of [[1, 2], [2, 5]]) {
    const counts = [0, 1, 2].map(index => categories.reduce((sum, row) => sum + Number(row[offset + index]), 0))
    deepStrictEqual(overall.slice(offset, offset + 3).map(Number), counts)
    strictEqual(Number(scores[side]), Math.max(0, 100 - 3 * counts[0] - counts[1]))
  }
})

test("git skill owns five actions that resolve repository rules first", () => {
  const skill = read("config/skills/git/SKILL.md")
  const merge = read("config/skills/git/references/merge.md")
  const gitWorker = read("config/agents/git-worker.toml")
  const pr = read("config/skills/git/references/pr.md")

  match(skill, /^## Repository rules win$/m)
  match(skill, /Repository `AGENTS\.md` \/ `CLAUDE\.md`/)
  match(skill, /self-contained on purpose/)
  match(skill, /pre-push/)
  match(skill, /hard gate|Never bypass a hook/)
  for (const reference of ["push", "merge"]) {
    match(read(`config/skills/git/references/${reference}.md`), /hard gate/)
  }
  match(skill, /^## Delegation$/m)
  match(skill, /--no-delegation/)
  match(skill, /all five actions[\s\S]*exactly one worker via `super-agent`/i)
  match(skill, /in Codex, use `git-worker`/)
  match(skill, /accepted human-approved plan authorizes only its named Git actions/)
  match(skill, /not a second Git authorization request/)
  doesNotMatch(skill, /merge` and `review-pr-comments` always run inline/)
  match(gitWorker, /Read\s+the shared `git` skill and matching references/)
  match(gitWorker, /repository's own commit,\s+push, or PR skill/)
  match(skill, /^## Plan context$/m)
  match(pr, /^## Title$/m)
  match(pr, /pull_request_template\.md/)
  doesNotMatch(gitWorker, /--no-ff|force-push|pre-commit|--no-delegation/)
  for (const reference of ["commit", "push", "pr", "merge", "review-pr-comments"]) {
    match(skill, new RegExp(`references/${reference}\\.md`))
    ok(statSync(join(root, `config/skills/git/references/${reference}.md`), { throwIfNoEntry: false }))
  }

  match(merge, /^## History integrity$/m)
  match(merge, /Never squash/)
  match(merge, /--no-ff/)
  match(merge, /Sync the selected base branch into the current feature branch/)
  match(merge, /git merge --no-ff <base-branch>/)
  match(merge, /git merge-base --is-ancestor <base-branch> <feature-branch>/)
  doesNotMatch(merge, /git checkout <base-branch>/)
  match(pr, /^## Own commits only$/m)
  match(pr, /git log --oneline <remote>\/<target>\.\.HEAD/)
  match(pr, /--force-with-lease=<branch>:<pushed-sha>/)
  match(pr, /never `git rebase --skip`/)
  match(pr, /accepted plan must name PR creation or\s+update and its target\/bounds/)
})

test("workflow renders its native wave plan and can commission useful planning diagrams", () => {
  const planning = read("config/skills/workflow/references/planning.md")
  const firstDraft = read("config/skills/workflow/references/first-draft.md")
  const improvement = read("config/skills/workflow/references/improvement-loop.md")
  const routing = read("config/skills/super-agent/references/routing.md")
  const orcaAdapter = read("config/skills/orchestration/references/orca.md")

  match(planning, /Markdown file\s+authoritative/i)
  match(planning, /scripts\/render-plan\.mjs/)
  doesNotMatch(planning, /\$HOME\/\.agents\/skills/)
  match(planning, /references\/plan-page\.md/)
  match(planning, /deterministic renderer never delegates/i)
  match(firstDraft, /diagram guide/)
  match(improvement, /revise affected diagrams with feedback/)
  match(planning, /useful custom\s+diagram may use `super-agent`/i)
  doesNotMatch(planning, /custom diagram may use `super-agent` only\s+when requested/i)
  const artifactRoute = orcaAdapter.slice(orcaAdapter.indexOf("For a bounded artifact worker"), orcaAdapter.indexOf("## Retention and release"))
  doesNotMatch(artifactRoute, /--tools\b/)
  match(artifactRoute, /output directory is a task constraint,\s+not a filesystem sandbox/i)
  match(artifactRoute, /exact lifecycle commands the task packet names/)
  match(artifactRoute, /coordinator owns\s+helper checks and exports/i)
  match(planning, /always present the native plan/i)
})

test("review-plan delegates final template rendering to refine-plan", () => {
  const reviewPlan = read("config/skills/review-plan/SKILL.md")
  const refinePlan = read("config/skills/refine-plan/SKILL.md")

  match(reviewPlan, /Load the `refine-plan` skill/)
  doesNotMatch(reviewPlan, /^## Planning mode$/m)
  match(refinePlan, /^## Planning mode$/m)
  match(refinePlan, /^## Live validation$/m)
  match(refinePlan, /^## Decision records$/m)
  match(refinePlan, /Do not modify files\./)
})

test("local search setup keeps service and connector ownership separate", () => {
  const bootstrap = read("bootstrap_codex.sh")
  const piBootstrap = read("bootstrap_pi.sh")
  const common = read("bootstrap_common.sh")
  const mcpConfig = read("config/bin/mcp-config.py")
  const codegraph = read("config/skills/codegraph-setup/SKILL.md")
  const search = read("config/skills/web-search/SKILL.md")
  const searxng = read("config/searxng/settings.yml")

  match(bootstrap, /--no-searxng/)
  match(bootstrap, /--no-searxng-mcp/)
  match(common, /docker\.io\/searxng\/searxng:latest/)
  match(common, /127\.0\.0\.1:8080:8080/)
  match(common, /--restart unless-stopped/)
  match(common, /Docker is unavailable/)
  match(piBootstrap, /install_pi_package pi-mcp-adapter npm:pi-mcp-adapter@2\.34\.0 2\.34\.0/)
  match(common, /npm install --global mcp-searxng@1\.11\.1/)
  match(mcpConfig, /SEARXNG_URL.*http:\/\/localhost:8080/)
  match(piBootstrap, /npm\/node_modules\/\.bin\/mcp-searxng/)
  match(mcpConfig, /lifecycle="lazy", directTools=True/)
  match(codegraph, /@colbymchenry\/codegraph@1\.6\.0/)
  match(codegraph, /never indexes a project automatically/i)
  match(search, /searxng_web_search/)
  match(search, /web_url_read/)
  match(search, /do not fall back to\s+paid search APIs/i)
  match(searxng, /- json/)
})

test("decision records separate empty-index initialization from concern assessment", () => {
  const records = read("config/skills/decision-records/SKILL.md")
  const planning = read("config/skills/workflow/references/planning.md")
  const code = read("config/skills/code/SKILL.md")
  const indexTemplate = read("config/skills/decision-records/assets/index-template.md")

  ok(indexTemplate.startsWith("# Decision records\n"))
  ok(indexTemplate.includes("No decision records exist yet."))
  ok(records.includes("If the index is missing, treat it as an empty existing-record set"))
  match(records, /including when no significant concern record\s+is needed/)
  ok(records.includes("Never report an approved index write as `none`."))
  ok(planning.includes("otherwise treat it as an empty existing-record set"))
  ok(code.includes("Do not repeat approval after these changes are authorized."))
  ok(statSync(join(root, "docs/decisions/index.md"), { throwIfNoEntry: false }))
})

test("four native bootstraps share dependencies and deliver portable assets", () => {
  const readme = read("README.md")
  const scripts = ["bootstrap_codex.sh", "bootstrap_claude.sh", "bootstrap_pi.sh", "bootstrap_agy.sh"]
  const source = scripts.map(read)
  const common = read("bootstrap_common.sh")
  const assets = read("config/bin/harness-assets.py")
  const mcpConfig = read("config/bin/mcp-config.py")
  const mcp = JSON.parse(read("config/mcp.json"))

  match(readme, /^## What gets installed where$/m)
  for (const harness of ["Codex", "Claude Code", "Pi", "Antigravity"]) {
    match(readme, new RegExp(`\\| ${harness} \\|`))
  }
  match(readme, /harness-init/)
  match(readme, /configured-root connector-path repair/)
  for (const script of source) match(script, /common_install_shared/)
  match(common, /ensure_codegraph/)
  match(common, /bun add -g btca/)
  match(common, /mcp-searxng@1\.11\.1/)
  match(common, /external-skills/)
  deepStrictEqual(Object.keys(mcp.mcpServers).sort(), ["btca", "codegraph", "searxng"])
  for (const retired of ["braintrust", "vidext-operator-my-workspace", "headroom", "sequential-thinking"]) {
    ok(mcpConfig.includes(retired), `missing managed retirement rule: ${retired}`)
  }
  match(assets, /Load and follow the `\{skill\}` skill/)
  match(assets, /\$@/)
  match(assets, /\{\{args\}\}/)
  match(assets, /the full invocation text/)
  match(assets, /reserved = \{"init", "review", "code-review"\}/)
  match(assets, /return f"harness-\{name\}" if name in reserved else name/)
  doesNotMatch(assets, /^\s*tools:/m)
  const temp = mkdtempSync(join(tmpdir(), "harness-renderer-"))
  try {
    for (const [command, alias] of [["init", "harness-init"], ["review", "harness-review"]]) {
      const target = join(temp, command)
      const result = spawnSync("python3", [
        "config/bin/harness-assets.py", "render-command", "--format", "claude",
        "--source", `config/commands/${command}.md`, "--target", target,
        "--backup", join(temp, "backups"),
      ], { cwd: root, encoding: "utf8" })
      strictEqual(result.status, 0, result.stderr)
      ok(statSync(join(target, alias, "SKILL.md"), { throwIfNoEntry: false }))
    }
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
  for (const agent of readdirSync(join(root, "config/agents"))) {
    if (!agent.endsWith(".toml")) continue
    const body = read(`config/agents/${agent}`)
    doesNotMatch(body, /^sandbox_mode = "(?:read-only|workspace-write)"$/m)
  }
})

test("legacy policy migration preserves local tails and backs up the replaced file", () => {
  const temp = mkdtempSync(join(tmpdir(), "harness-policy-"))
  const source = join(temp, "source.md")
  const backupRoot = join(temp, "backups")
  const policy = "# Global Agent Rules\n\nCurrent shared instructions.\n\n# Security Rules\n\nCurrent security instructions."
  const legacyMarker = "# Generated by my-codex-config bootstrap."
  const security = policy.slice(policy.indexOf("# Security Rules"))
  const legacyPolicy = `# Global Agent Rules\n\nOld generated global instructions.\n\n${security}`
  const prefix = "Local introduction."
  const tails = [
    ["heading", "# Local Instructions\n\nKeep this locally added section."],
    ["subheading", "## Local Instructions\n\nKeep this locally added section."],
    ["plain", "Keep this plain local tail."],
  ]

  try {
    writeFileSync(source, `${policy}\n`)
    const install = (target) => spawnSync("python3", [
      "config/bin/harness-assets.py", "install-policy", "--source", source,
      "--target", target, "--backup", backupRoot,
    ], { cwd: root, encoding: "utf8" })

    for (const [name, tail] of tails) {
      const target = join(temp, `AGENTS-${name}.md`)
      const original = `${prefix}\n\n${legacyMarker}\n\n${legacyPolicy}\n\n${tail}\n`
      const installed = `${prefix}\n\n<!-- BEGIN my-harness-config policy -->\n\n${policy}\n\n<!-- END my-harness-config policy -->\n\n${tail}\n`
      writeFileSync(target, original)

      let result = install(target)
      strictEqual(result.status, 0, result.stderr)
      strictEqual(readFileSync(target, "utf8"), installed)
      strictEqual(readFileSync(join(backupRoot, `AGENTS-${name}.md`), "utf8"), original)
      strictEqual((installed.match(/^# Global Agent Rules$/gm) ?? []).length, 1)
      strictEqual((installed.match(/^# Security Rules$/gm) ?? []).length, 1)

      result = install(target)
      strictEqual(result.status, 0, result.stderr)
      strictEqual(readFileSync(target, "utf8"), installed)
    }

    const wholeTarget = join(temp, "AGENTS-whole.md")
    const wholeLegacy = `${legacyMarker}\n\n${legacyPolicy}\n`
    writeFileSync(wholeTarget, wholeLegacy)
    const wholeResult = install(wholeTarget)
    strictEqual(wholeResult.status, 0, wholeResult.stderr)
    strictEqual(
      readFileSync(wholeTarget, "utf8"),
      `<!-- BEGIN my-harness-config policy -->\n\n${policy}\n\n<!-- END my-harness-config policy -->\n`,
    )
    strictEqual(readFileSync(join(backupRoot, "AGENTS-whole.md"), "utf8"), wholeLegacy)

    const uncertainTarget = join(temp, "AGENTS-uncertain.md")
    const uncertain = `${legacyMarker}\n\n# Global Agent Rules\n\nOld rules.\n\n# Security Rules\n\nLocally edited security content.\n`
    writeFileSync(uncertainTarget, uncertain)
    const uncertainResult = install(uncertainTarget)
    strictEqual(uncertainResult.status, 1)
    strictEqual(readFileSync(uncertainTarget, "utf8"), uncertain)
    ok(!statSync(join(backupRoot, "AGENTS-uncertain.md"), { throwIfNoEntry: false }))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test("Codex TOML agents use native fields and preserve all twelve roles", () => {
  const names = [
    "coder", "cleanup-worker", "git-worker", "review-worker",
    "reviewer-quick", "reviewer-reasoning", "reviewer-arch", "reviewer-e2e",
    "coding-supervisor", "live-validator", "critic", "diagram-worker",
  ]
  const config = read("config/codex.toml")
  ok(!statSync(join(root, "config/agents/commit-worker.toml"), { throwIfNoEntry: false }))
  const result = spawnSync("python3", ["-c", "import pathlib, sys, tomllib; [tomllib.loads(pathlib.Path(p).read_text()) for p in sys.argv[1:]]", "config/codex.toml", ...names.map((name) => `config/agents/${name}.toml`)], { cwd: root, encoding: "utf8" })
  strictEqual(result.status, 0, result.stderr)
  for (const name of names) {
    const body = read(`config/agents/${name}.toml`)
    match(body, new RegExp(`^name = "${name}"$`, "m"))
    for (const forbidden of ["mode", "temperature", "steps", "task_key", "permission"]) {
      doesNotMatch(body, new RegExp(`^${forbidden}\\s*=`, "m"))
    }
    match(body, /^approval_policy = "never"$/m)
    doesNotMatch(body, /^sandbox_mode = "(?:read-only|workspace-write)"$/m)
    ok(body.includes("developer_instructions"))
  }
  for (const name of ["coding-supervisor", "live-validator", "critic"]) {
    const body = read(`config/agents/${name}.toml`)
    doesNotMatch(body, /^model\s*=/m)
    doesNotMatch(body, /^model_reasoning_effort\s*=/m)
    doesNotMatch(body, /^sandbox_mode = "read-only"$/m)
  }
  const supervisor = read("config/agents/coding-supervisor.toml")
  match(supervisor, /exactly\s+one retained `coder` through\s+`super-agent`/)
  match(supervisor, /must never edit product\s+source/)
  match(supervisor, /only for a workflow slice whose human-approved plan marks it `large`/)
  match(supervisor, /bounded grant to direct exactly\s+one retained `coder`/)
  match(supervisor, /every verified\s+in-scope P0-P3 correction/)
  match(supervisor, /two unsuccessful\s+rounds/)
  const validator = read("config/agents/live-validator.toml")
  match(validator, /target environment, exact flow, sample inputs, expected results/)
  match(validator, /Do not install or authenticate\s+tools/)
  match(validator, /blocked\/unverified/)
  const critic = read("config/agents/critic.toml")
  match(critic, /plan, design,\s+research claim, bug diagnosis, or decision/)
  match(critic, /complete supplied artifact and cited primary evidence/)
  match(critic, /Do not change the goal/)
  const diagramWorker = read("config/agents/diagram-worker.toml")
  doesNotMatch(diagramWorker, /^model\s*=/m)
  doesNotMatch(diagramWorker, /^model_reasoning_effort\s*=/m)
  match(diagramWorker, /Write only the requested editable source and preview inside the assigned output directory/)
  match(diagramWorker, /task constraint, not a filesystem sandbox/i)
  match(diagramWorker, /Use Bash only for the exact dispatch commands\s+documented by the selected lifecycle/)
  match(diagramWorker, /The coordinator owns helper checks and exports/)
  match(diagramWorker, /operate Git.*install tools; publish; or delegate/s)
  doesNotMatch(config, /^\[mcp_servers\./m)
  deepStrictEqual(Object.keys(JSON.parse(read("config/mcp.json")).mcpServers).sort(), ["btca", "codegraph", "searxng"])
  match(config, /^web_search = "live"$/m)
  doesNotMatch(config, /\[mcp_servers\.(?:playwright|searxng)\]/)
  doesNotMatch(config, /\/Users\/|\/Applications\/|\/home\/[^/]+\//)
})

test("cheap model catalog is harness-first and keeps identifiers centralized", () => {
  const catalog = read("config/skills/super-agent/references/model-catalog.yaml")
  const routing = read("config/skills/super-agent/SKILL.md")
  const routingReference = read("config/skills/super-agent/references/routing.md")
  const orcaAdapter = read("config/skills/orchestration/references/orca.md")
  const modelIds = [...catalog.matchAll(/^\s+(?:-\s+|model:\s+)(\S+)$/gm)].map(([, id]) => id)
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const defaultSubagentModel = read("config/codex.toml").match(/^default_subagent_model = "([^"]+)"$/m)?.[1]

  match(catalog, /^max_local_concurrency:\s*0$/m)
  match(catalog, /^codex:\n  low:\n    model: \S+\n    thinking: \S+$/m)
  strictEqual(defaultSubagentModel, "gpt-6-luna")
  ok(modelIds.includes(defaultSubagentModel), "Codex default subagent model must come from the catalog")
  const rootModel = read("config/codex.toml").match(/^model = "([^"]+)"$/m)?.[1]
  ok(modelIds.includes(rootModel), "Codex root model must come from the catalog")
  for (const harness of ["pi", "agy"]) {
    match(catalog, new RegExp(`^${harness}:$`, "m"))
    for (const tier of ["low", "medium", "high"]) match(catalog, new RegExp(`^  ${tier}:$`, "m"))
  }
  match(catalog, /^  local:\s*$/m)
  match(catalog, /^    medium:\s*$/m)
  match(catalog, /^      model:\n        - \S+$/m)
  doesNotMatch(catalog, /capability:|^models:/m)
  match(routing, /Read `references\/model-catalog\.yaml` for every delegation/)
  match(routing, /cheapest adequate tier/)
  match(routing, /remaining entries in list order/)
  match(routing, /closed allowlist/)
  match(routing, /Never let\s+a wrapper or harness choose an uncataloged default model/)
  match(routing, /verify it matches; stop a mismatched worker/)
  match(routing, /max_local_concurrency/)
  match(routing, /Count a\s+cataloged local orchestrator/)
  match(routingReference, /Explicit one-shot adapters/)
  match(routingReference, /argument vector/)
  match(orcaAdapter, /Pi launch recipe/)
  match(orcaAdapter, /worker-start --task <task_id> --worktree current --terminal <handle>/)
  match(orcaAdapter, /Do not use `dispatch --inject`/)
  match(orcaAdapter, /runtime provides none/)
  match(routingReference, /Never concatenate catalog values into shell code/)
  for (const harness of ["Codex", "Pi", "AGY", "OpenCode"]) match(routingReference, new RegExp(harness))
  for (const path of [
    "README.md",
    "config/skills/super-agent/references/swarm.md",
    "config/skills/review/SKILL.md",
    "config/skills/review/references/orchestration.md",
    "config/skills/review/references/ocr-evidence.md",
    "config/skills/review/references/swarm-coordination.md",
    "config/skills/git/SKILL.md",
  ]) {
    const body = read(path)
    for (const id of modelIds) doesNotMatch(body, new RegExp(escapeRegExp(id)))
  }
  doesNotMatch(read("config/skills/code/SKILL.md"), new RegExp(modelIds.map(escapeRegExp).join("|")))
  doesNotMatch(read("config/skills/cleanup/SKILL.md"), new RegExp(modelIds.map(escapeRegExp).join("|")))
})

test("delegating skills require runtime-native capability-aware routing", () => {
  const routing = read("config/skills/super-agent/SKILL.md")
  const routingReference = read("config/skills/super-agent/references/routing.md")
  const lifecycle = read("config/skills/super-agent/references/lifecycle.md")
  const swarm = read("config/skills/super-agent/references/swarm.md")
  const review = read("config/skills/review/SKILL.md")
  const reviewOrchestration = read("config/skills/review/references/orchestration.md")
  const multiReview = read("config/skills/review/references/swarm-coordination.md")
  const orchestration = read("config/skills/orchestration/SKILL.md")
  const orcaAdapter = read("config/skills/orchestration/references/orca.md")
  const swarmEvals = JSON.parse(read("config/skills/super-agent/evals/evals.json"))

  match(routing, /ceil\(N \/ 2\)/)
  match(lifecycle, /quota or rate limit is exhausted/)
  match(routing, /must not create a branch or worktree/)
  match(routing, /real configured role/)
  match(routing, /active wrapper/)
  match(routing, /current harness[\s\S]*native/)
  match(routingReference, /codex.*exec.*catalog_model.*prompt/s)
  match(routingReference, /pi.*--print.*catalog_model.*prompt/s)
  match(routingReference, /agy.*--print.*catalog_model.*prompt/s)
  match(routingReference, /opencode.*run.*catalog_model.*prompt/s)
  match(routingReference, /argument vector/)
  match(orcaAdapter, /ORCA_CLI_COMMAND/)
  match(orcaAdapter, /orca-dev/)
  match(read("config/AGENTS.md"), /All agents, including nested workers, must load `super-agent`/)
  doesNotMatch(routing + swarm, /`spawn_agent`|`wait_agent`|`followup_task`/)
  doesNotMatch(routing, /worker-start|dispatch --inject|orca terminal create/)
  match(read("config/skills/code/SKILL.md"), /active wrapper through `super-agent`/)
  match(read("config/skills/super-agent/references/swarm.md"), /## Isolated tasks/)
  doesNotMatch(routing, /Codex owns all subagent orchestration/)

  match(swarm, /other available harnesses/)
  match(orcaAdapter, /role selection precedes lifecycle mechanics/)
  match(reviewOrchestration, /Preserve an explicit AGY\/Pi roster exactly/)
  match(reviewOrchestration, /For `flash`, resolve the catalog role `reviewer-fast` through `super-agent`/)
  match(multiReview, /When the user requests five/)
  match(multiReview, /explicit or review-preset\s+preference/)
  match(read("config/skills/code/SKILL.md"), /through `super-agent`/)
  match(read("config/skills/cleanup/SKILL.md"), /through `super-agent`/)
  match(read("config/skills/git/SKILL.md"), /via `super-agent`/)
  match(read("config/skills/skill-creator/SKILL.md"), /move the whole pair/)
  strictEqual(swarmEvals.evals.length, 9)
  match(JSON.stringify(swarmEvals), /quota-exhausted/)
  match(JSON.stringify(swarmEvals), /catalog tier/)
  match(JSON.stringify(swarmEvals), /local-search protection/)
  match(JSON.stringify(swarmEvals), /closed allowlist/)
  match(read("config/agents/review-worker.toml"), /available harnesses/)
  match(read("config/agents/review-worker.toml"), /resolve the exact model and thinking from the\s+catalog `swarms` role/)

  for (const path of [
    "config/skills/super-agent/SKILL.md",
    "config/skills/super-agent/references/swarm.md",
    "config/skills/review/SKILL.md",
    "config/skills/review/references/swarm-coordination.md",
  ]) {
    doesNotMatch(read(path), /Do not substitute workmux|exact Sol model has no fallback|Orca is the required lifecycle/)
  }
})

test("cleanup and review quality gates keep external evidence opt-in and read-only", () => {
  const cleanup = read("config/skills/cleanup/SKILL.md")
  const cleanupMetadata = read("config/skills/cleanup/agents/openai.yaml")
  const cleanupWorker = read("config/agents/cleanup-worker.toml")
  const cleanupEvals = JSON.parse(read("config/skills/cleanup/evals/evals.json"))
  const review = read("config/skills/review/SKILL.md")
  const reviewOcr = read("config/skills/review/references/ocr-evidence.md")
  const reviewOrchestration = read("config/skills/review/references/orchestration.md")
  const reviewWorker = read("config/agents/review-worker.toml")
  const bootstrapPi = read("bootstrap_pi.sh")

  match(cleanup, /explicit `\$cleanup` invocation/)
  match(cleanup, /findings only|findings-only/i)
  match(cleanup, /complete Git status/i)
  match(cleanup, /task-owned changes/i)
  match(cleanup, /production and tests/i)
  match(cleanup, /reviewer-arch/)
  match(cleanup, /reviewer-reasoning/)
  match(cleanup, /always runs the cleanup\s+swarm/)
  match(cleanup, /`reviewer-high` simplest-design\s+reviewers/)
  match(cleanup, /Slopo mode: enabled/)
  match(cleanup, /Slopo mode: disabled/)
  match(cleanup, /slopo\.conf\.yaml.*does not exist.*\["slopo", "init"\]/s)
  for (const command of ["show-config", "index", "embed", "analyze"]) match(cleanup, new RegExp(`\\["slopo", "${command}"\\]`))
  match(cleanup, /only expected\s+worktree mutation/i)
  match(cleanup, /unexpected mutation/i)
  match(cleanup, /Lean already\. No cleanup findings\./)
  doesNotMatch(cleanup, /diff-size targets|review is stale|run the relevant verification/i)
  match(cleanupMetadata, /read-only deslop findings audit/i)
  match(cleanupWorker, /Never edit, write, delete, stage, commit,\s*push, publish/i)
  match(cleanupWorker, /test changes/i)
  match(cleanupWorker, /reviewer-arch/)
  match(cleanupWorker, /reviewer-reasoning/)
  match(cleanupWorker, /Always run the cleanup swarm/)
  match(cleanupWorker, /before reading the diff, writes the\s+simplest design/)
  match(cleanupWorker, /Slopo mode: enabled.*Slopo mode: disabled/s)
  match(cleanupWorker, /slopo\.conf\.yaml.*absent.*\["slopo", "init"\]/s)
  for (const command of ["show-config", "index", "embed", "analyze"]) match(cleanupWorker, new RegExp(`\\["slopo", "${command}"\\]`))
  match(cleanupWorker, /only expected worktree mutation/i)
  match(cleanupWorker, /command-not-found|unsafe.*configuration|unreadable output/i)
  match(cleanupWorker, /unexpected worktree mutation/i)

  strictEqual(cleanupEvals.skill_name, "cleanup")
  strictEqual(cleanupEvals.evals.length, 3)
  match(JSON.stringify(cleanupEvals), /wrapper|overengineered|redundant/i)
  match(JSON.stringify(cleanupEvals), /duplicat|low-value|trust-boundary/i)
  match(JSON.stringify(cleanupEvals), /already lean|Lean already/i)

  match(review, /references\/code-review\.md/)
  match(review, /references\/ocr-evidence\.md/)
  match(reviewOrchestration, /`\$review --ocr`/)
  match(reviewOrchestration, /OCR mode: enabled/)
  match(reviewOrchestration, /OCR mode: disabled/)
  match(reviewOrchestration, /consume the flag/i)
  match(reviewOcr, /workspace-diff flow/i)
  match(reviewOcr, /OCR mode: enabled.*must resolve.*ocr-opencode-go/s)
  match(reviewOcr, /ocr-opencode-go.*review.*--audience.*agent.*--background/s)
  match(reviewOcr, /uses Pi only as a fallback credential store|without using the Pi harness/i)
  match(reviewOcr, /untrusted evidence/i)
  match(reviewOcr, /deduplicate/i)
  match(reviewOcr, /does not block\s+the native\s+verdict/i)
  match(reviewWorker, /OCR mode: enabled.*OCR mode: disabled/s)
  match(reviewWorker, /ocr-opencode-go.*review.*--audience.*agent.*--background/s)
  match(reviewWorker, /not\s+as an agent harness/i)
  match(reviewWorker, /Verify every retained claim.*source/s)
  match(reviewWorker, /deduplicate OCR findings against native findings/s)
  match(reviewWorker, /never blocks the native verdict/)
  match(bootstrapPi, /render-agent --format pi/)
  match(read("config/bin/harness-assets.py"), /inheritSkills: true/)
  doesNotMatch(read("config/bin/harness-assets.py"), /^\s*tools:/m)
  doesNotMatch(bootstrapPi, /"core"/)
})

test("test-audit gates new tests and audits existing ones", () => {
  const skill = read("config/skills/test-audit/SKILL.md")
  const campaign = read("config/skills/test-audit/references/campaign.md")
  const assets = read("config/bin/harness-assets.py")

  match(skill, /^## Repository rules win$/m)
  match(skill, /^## Authoring gate$/m)
  for (const question of [
    /observable behavior, invariant, or independent contract/,
    /credible regression makes it fail/,
    /one primary\s+test owner at the strongest boundary/,
    /production seam/,
  ]) match(skill, question)
  match(skill, /^## Junk patterns$/m)
  match(skill, /^## Retention bar$/m)
  match(skill, /^## Candidate evidence$/m)
  match(skill, /^## Edit shape$/m)
  match(skill, /^## Validation$/m)
  match(skill, /references\/campaign\.md/)
  match(skill, /node --test <path>/)
  match(skill, /classify the change with it and run the gate/)
  match(skill, /never for coverage or\s+convention/i)
  doesNotMatch(skill, /openclaw|Vitest|crabbox|autoreview|run-vitest/)

  match(campaign, /^## 1\. Baseline$/m)
  match(campaign, /^## 8\. Reconcile and hand off$/m)
  match(campaign, /`R`: retain/)
  match(campaign, /`F`: retain the contract but repair/)
  match(campaign, /`C`: consolidate/)
  match(campaign, /`D`: delete/)
  match(campaign, /mutation/)
  doesNotMatch(campaign, /openclaw|telegram|Vitest|run-vitest/i)

  for (const role of [
    "cleanup-worker", "coder", "coding-supervisor", "live-validator", "review-worker",
    "reviewer-arch", "reviewer-e2e", "reviewer-quick", "reviewer-reasoning",
  ]) {
    match(read(`config/agents/${role}.toml`), /^developer_instructions =/m)
  }
  doesNotMatch(assets, /^\s*tools:/m)
  match(read("config/skills/code-quality/SKILL.md"), /load `test-audit`/)
})

test("agentic workflow keeps stage contracts, approvals, and scenario definitions explicit", () => {
  const workflowPath = "config/skills/workflow/SKILL.md"
  const workflow = read(workflowPath)
  const codingLoop = read("config/skills/workflow/references/coding-loop.md")
  const cleanup = read("config/skills/cleanup/SKILL.md")
  const code = read("config/skills/code/SKILL.md")
  const reviewOrchestration = read("config/skills/review/references/orchestration.md")
  const orcaAdapter = read("config/skills/orchestration/references/orca.md")
  const findings = read("config/skills/review/references/code-review.md")
  const shipPr = read("config/skills/workflow/references/ship-pr.md")
  const scenariosPath = "config/skills/workflow/references/scenarios.md"
  const scenarios = read(scenariosPath)
  const hooks = JSON.parse(read("config/codex-hooks.json"))
  const hookCommands = Object.values(hooks.hooks).flatMap((events) => (
    events.flatMap(({ hooks: registeredHooks }) => registeredHooks.map(({ command }) => command))
  ))

  for (const path of [
    "config/skills/workflow/templates/progress.md",
    "config/skills/workflow/references/coding-loop.md",
    "config/skills/workflow/references/cleanup.md",
    "config/skills/workflow/references/present-to-human.md",
    "config/skills/workflow/references/ship-pr.md",
    "config/skills/workflow/references/end-to-end.md",
    scenariosPath,
    "config/skills/workflow/references/planning.md",
    "config/skills/workflow/references/diagrams.md",
    "config/skills/workflow/references/first-draft.md",
    "config/skills/workflow/references/improvement-loop.md",
    "config/skills/workflow/references/adversarial.md",
    "config/skills/review/references/presets/flash.md",
    "config/skills/review/references/presets/swarm.md",
    "config/skills/review/references/presets/swarm-smart.md",
    "config/skills/review/references/presets/full.md",
  ]) ok(statSync(join(root, path), { throwIfNoEntry: false }), `missing workflow artifact: ${path}`)

  for (const match of workflow.matchAll(/\]\(([^)#]+\.md)\)/g)) {
    const target = resolve(join(root, "config/skills/workflow"), match[1])
    ok(statSync(target, { throwIfNoEntry: false }), `broken workflow reference: ${match[1]}`)
  }
  match(workflow, /Workflow context: approved/)
  match(workflow, /context routes work and narrows scope; it adds no authority/i)
  match(workflow, /Keep slices sequential by default/)
  match(workflow, /authorized local checkpoint/)
  match(workflow, /small plan directly to one retained coder/)
  match(workflow, /large plan.*bounded grant to direct one retained coder/s)
  match(workflow, /two unsuccessful rounds/i)
  match(codingLoop, /every verified in-scope P0-P3 finding/)
  match(codingLoop, /For `small`.*For `large`/s)
  match(codingLoop, /root coordinates and does not edit product code/i)
  match(cleanup, /read-only, findings-only contract/)
  match(cleanup, /committed checkpoint changes/)
  match(cleanup, /complete task-owned comparison is empty/)
  match(shipPr, /follow its authority section/)
  match(shipPr, /do\s+not request that same Git authorization again/)
  match(shipPr, /stages explicit task-owned deliverables/)
  match(shipPr, /final tree matches the accepted result/)
  match(reviewOrchestration, /task-owned staged, unstaged, and\s+untracked worktree changes/)
  match(reviewOrchestration, /reviewers report those revisions/)
  strictEqual(hookCommands.length, 1)
  match(hookCommands[0], /codex-command-dispatch\.mjs/)
  doesNotMatch(read("config/codex-hooks.json"), /codex-hook\.sh/)
  match(read("bootstrap_codex.sh"), /merge-hooks/)
  match(code, /`\$code` itself still stops after implementation/)
  match(findings, /Blocked\/unverified/)
  for (const preset of ["flash", "swarm", "swarm-smart", "full"]) {
    match(reviewOrchestration, new RegExp(`--preset[^\\n]*${preset}`))
  }
  match(read("config/skills/review/references/presets/swarm-smart.md"), /resolves the catalog role entry.*pin the resolved harness, model, and thinking/s)
  match(orcaAdapter, /[Rr]eview\s+modes and presets choose the review shape only;\s+they never set a harness, model, or\s+thinking default/)
  match(codingLoop, /\$review --preset/)
  match(codingLoop, /reviewer reads the full plan/)
  match(workflow, /coordinator advances routine stages/)
  match(read("config/skills/review/references/presets/full.md"), /bounded authorization/)
  match(scenarios, /Small localized fix/)
  match(scenarios, /Dependent two-slice feature/)
  match(scenarios, /Interrupted slice with mixed findings/)
  match(scenarios, /false-positive\s+review claim/)
  match(scenarios, /out-of-scope observation/)
  match(scenarios, /cleanup simplification\s+that regresses/)
  match(scenarios, /pending separate authorization/)
})

test("OCR OpenCode Go helper resolves Pi credentials and provider settings", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "ocr-opencode-go-test-"))
  const bin = join(temporary, "bin")
  mkdirSync(bin)
  t.after(() => rmSync(temporary, { recursive: true, force: true }))

  const pi = join(bin, "pi")
  const ocr = join(bin, "ocr")
  writeFileSync(pi, `#!/usr/bin/env bash
[[ "$*" == "auth print-api-key --provider opencode-go" ]] || exit 20
printf 'test-token\\n'
`)
  writeFileSync(ocr, `#!/usr/bin/env bash
[[ "$OCR_LLM_TOKEN" == "test-token" ]] || exit 21
[[ "$OCR_LLM_URL" == "https://opencode.ai/inference/go/v1/chat/completions" ]] || exit 22
[[ "$OCR_LLM_MODEL" == "deepseek-v4.1-flash" ]] || exit 23
[[ "$OCR_LLM_PROTOCOL" == "openai" ]] || exit 24
[[ "$OCR_USE_ANTHROPIC" == "false" ]] || exit 25
[[ "$OCR_LLM_EXTRA_HEADERS" == x-opencode-session=ocr-* ]] || exit 26
[[ "$*" == "review --audience agent --background goal" ]] || exit 27
printf 'ok\\n'
`)
  chmodSync(pi, 0o700)
  chmodSync(ocr, 0o700)

  const result = spawnSync(
    join(root, "config/skills/review/scripts/ocr-opencode-go"),
    ["review", "--audience", "agent", "--background", "goal"],
    {
      encoding: "utf8",
      env: {
        HOME: temporary,
        PATH: `${bin}:/usr/bin:/bin`,
      },
    },
  )
  strictEqual(result.status, 0, result.stderr)
  strictEqual(result.stdout, "ok\n")
})

test("skill-scout vets before installing and never merges on its own", () => {
  const skill = read("config/skills/skill-scout/SKILL.md")
  const sources = read("config/skills/skill-scout/references/sources.md")
  const vetting = read("config/skills/skill-scout/references/vetting.md")
  const evidence = read("config/skills/skill-scout/references/evidence.md")
  const catalog = read("config/skills/skill-scout/references/catalog.md")

  for (const reference of ["sources.md", "vetting.md", "evidence.md", "catalog.md"]) {
    ok(
      statSync(join(root, `config/skills/skill-scout/references/${reference}`), { throwIfNoEntry: false }),
      `missing reference: ${reference}`,
    )
  }

  // the usefulness gate, in the user's words
  match(skill, /what does this tell the agent that it does\s+not already know/)
  match(skill, /If the answer is nothing, skip it/)
  match(skill, /Recent\s+commits, real issues\s+with real\s+answers, and a named maintainer matter more than star\s+count/)
  match(skill, /Evidence of real use/)
  match(skill, /Stars alone never pass the gate/)

  // pull first, report overlap, never merge
  match(skill, /even when two of them overlap/)
  match(skill, /Do not craft,\s+rewrite, trim, or merge/)
  match(skill, /Never merge, rewrite, or craft a skill/)
  match(skill, /## Catalog/)
  match(skill, /Ask; do not assume/)

  // the folded security pass
  match(skill, /references\/vetting\.md/)
  match(vetting, /skillspector scan <path-or-url> --no-llm/)
  match(vetting, /request for\s+manual investigation, not a verdict/)
  match(vetting, /Report real concerns and false positives separately, with `file:line` evidence/)
  match(vetting, /## 3\. Reachability/)
  match(vetting, /granted\s+to the\s+role that needs it/)

  // the measured base rate
  match(evidence, /2603\.15401/)
  match(evidence, /39 of 49 produced zero pass-rate improvement/)
  match(evidence, /2602\.12670/)
  match(evidence, /Self-generated skills gave no benefit/)
  match(evidence, /16% of runs/)
  match(evidence, /\+451%/)

  // sources and catalog
  for (const source of [
    "VoltAgent/awesome-agent-skills", "agenticskills.io", "autoskills.sh", "skills.sh",
  ]) match(sources, new RegExp(source.replace(/[.]/g, "\\.")))
  match(sources, /A listing is a lead, not evidence/)
  match(catalog, /Add an entry only after the user says yes/)
})

test("btca is scoped to registered upstream sources and proposes missing resources", () => {
  const skill = read("config/skills/btca/SKILL.md")
  const agents = read("config/AGENTS.md")

  match(skill, /^## Scope$/m)
  match(skill, /External library, SDK, or framework behavior that may have changed upstream/)
  match(skill, /What this repository already does\. Read the local code first/)
  match(skill, /up to 40 provider steps/)
  match(skill, /^## When a resource is missing$/m)
  match(skill, /propose adding the source instead of guessing/)
  match(skill, /Ask before adding one/)
  match(skill, /there is no resource for X — add one\?/)
  match(skill, /^## Administration$/m)
  match(skill, /btca resources/)
  match(skill, /btca connect -g -p <provider> -m <model>/)
  match(skill, /Never write a key into a repository/)
  match(skill, /session-based endpoint on\s+`\/zen\/go\/v1`/)

  match(agents, /Ground current external library, SDK, or framework behavior with `btca`/)
  match(agents, /not a first step in every task/)
  match(agents, /propose adding the resource instead of guessing/)

  doesNotMatch(read("config/skills/grill-me/SKILL.md"), /btca-first|btca-cli/)
  doesNotMatch(read("config/skills/review/references/effect-checks.md"), /btca-first|btca-cli/)
  doesNotMatch(read("config/skills/workflow/references/planning.md"), /btca-first|btca-cli/)
})
