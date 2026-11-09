# Harness portability

## Intent

Keep one secret-free configuration home for Codex, Claude, Pi and Antigravity.
Make normal setup simple: each client bootstrap calls one shared installer, then
links shared assets and renders only the native files that differ.

## Current decisions

- config/skills, config/agents and config/commands own shared skills, roles and
  command intent. The old agent-home/ and codex/ source roots are removed.
- config/AGENTS.md owns global policy including security rules. The root AGENTS.md
  remains repository instructions; native policy filenames are delivery adapters.
- config/mcp.json owns CodeGraph, SearXNG and BTCA definitions. Braintrust, Vidext
  Operator, Headroom and Sequential Thinking are retired managed integrations.
- bootstrap_common.sh checks actual installed shared dependencies, external
  portable skills and SearXNG before installing missing items. Four dedicated
  bootstrap_<harness>.sh commands call it; none dispatches other client setup.
- Native extensions/plugins remain their client's responsibility and skip
  already installed compatible packages. No profiles or duplicate inventories.
- One repo-owned exception: bootstrap_pi.sh links
  `config/pi/extensions/opencode-go-models.ts`, the closed OpenCode Go model list
  (user, 2026-11-09), because Pi's `models.json` cannot remove built-in models.
- Shared portable assets use symlinks. Native format rendering and safe merging
  preserve mutable settings/MCP/auth state and unrelated user configuration.
- Claude and Codex compact their context at 300k tokens, set by their bootstraps
  (Claude `autoCompactWindow` merged into settings, Codex
  `model_auto_compact_token_limit` in `config/codex.toml`). The Claude bootstrap owns only
  that key, its default-helper-model env key, its model-guard and UI reminder hooks, and the `skillOverrides`
  entries in `SKILLS_OFF`, which switch off claude.ai-synced and bundled skills the user does
  not want loaded (other overrides are kept).
- Claude alone gets the UI reminder hook (`config/bin/ui-open-reminder.py` on PostToolUse, Stop and
  SubagentStop), merged by `bootstrap_claude.sh` next to its guard hooks. Codex, Pi and AGY get no
  such hook for now; they rely on `ui.md` and the `config/AGENTS.md` pointer.
- `install-skills` backs up a dangling link in a target folder only when its target lies in
  a source this repository manages (the skills folder or a portable root); live links, real
  folders, and links into anywhere else, such as `npx skills` links, stay.
- Full tool access is available; focused role/task instructions govern authority.
  Native main agents keep their normal prompts. Skills load when needed.
- Installation uses normal client folders. Existing custom roots continue to work
  without becoming user-facing configuration modes.
- Fresh independent harness sessions validate actual discovery and bounded
  read-only MCP execution after the normal bootstraps run.
- A wrapper's own files stay with the wrapper. The repository ships only its own
  Codex hook (the command dispatcher) and merges it into the native hooks file;
  wrapper hooks and the wrapper's own installed skills are never shipped,
  replaced or deleted.
- Trusting Codex hooks stays the user's choice. The Codex bootstrap never writes hook
  trust or passes Codex's bypass flag; at the end it asks Codex which user and plugin
  hooks wait for review and lists them, and the agent asks the user to trust them in
  Codex. A repository's own Codex hooks are not checked.
- The managed SearXNG service gets a per-machine secret at deploy time; the
  repository settings file carries none.
- Skill and role text never hard-codes a harness skill root or a user home path;
  shared files point at sibling skills relatively, and `--check` rejects the rest.

## Protected invariants

- Shared facts have one source owner; native adapters do not duplicate policy.
- Already installed compatible shared dependencies are not reinstalled.
- Retired managed MCP entries cannot return through extra-entry preservation.
- Authentication, sessions, caches and private memories remain outside the repo.
- Preserve unrelated settings, skills, agents, MCPs and existing local policy.
- No harness CLI/Docker installation, credential migration, unrelated container
  replacement or automatic project indexing.
- Runtime identities and remote/local folder names remain unchanged.
- A generated file or agent-reported guess is not proof of runtime discovery.
- Native tool access never grants edit/Git/publish/nesting authority by itself.
- A bootstrap never removes or rewrites native entries it does not own, including
  wrapper hooks and wrapper-installed skills, and re-runs leave them unchanged.
- No bootstrap or agent trusts Codex hooks for the user or bypasses hook trust.

## Rationale and tradeoffs

One config directory removes misleading Codex ownership of shared assets.
One common installer avoids repeated dependency setup; separate bootstraps keep
native formats clear. Mutable native files still need safe merging rather than
whole-directory symlinks. Full tools simplify setup while read-only tasks remain
instruction constraints.
Trusted hooks run outside the sandbox, so Codex's per-run bypass flag and
bootstrap-written trust hashes were rejected; the cost is one trust step in Codex
after a hook or a plugin with hooks changes.

## Enforcement

- Four dedicated bootstraps, bootstrap_common.sh and native helpers under config/bin.
- Existing bootstrap and configuration checks cover generated outputs, reruns,
  retired MCP entries and unrelated-state preservation.
- Review-only: fresh Codex/Claude/Pi/AGY sessions establish actual discovery and MCP
  access; static checks cannot prove those runtime behaviors.
- Review-only: the hook review list reads live Codex trust state, so only a real
  bootstrap run shows it; the repository `AGENTS.md` tells agents to pass it on. Review
  also checks that no bootstrap writes hook trust or passes the bypass flag.

## History

- 2026-11-03: Added the Claude-only UI reminder hook; the user chose to leave Codex, Pi and AGY without one.
- 2026-10-22: Added the repo-owned `skillOverrides` list to the Claude settings merge and
  dangling-link pruning to `install-skills`, because skills removed from the repository left
  dangling links in every harness folder and synced or bundled Claude skills duplicated the
  repository's own.
- 2026-10-19: The user set compaction at 300k for Claude and Codex to cut context re-reading; they raise it if sessions compact too often.
- 2026-10-19: The Codex bootstrap now lists hooks waiting for trust, because Codex
  sessions and Orca workers kept stopping on the review prompt after a plugin update;
  bypassing hook trust was rejected.

- 2026-10-16: Stopped shipping the wrapper's hooks and its own skills after each Codex
  bootstrap and the wrapper kept overwriting each other; added the per-machine SearXNG
  secret and a check against machine-only skill paths, which kept coming back.
- 2026-10-03: User approved the consolidated config layout, merged security policy,
  one repeat-safe common installer, normal four-bootstrap runs and a fresh
  four-harness validation swarm.
