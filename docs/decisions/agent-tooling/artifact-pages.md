# Artifact pages

## Intent

Every page or app an agent shows the user is listed at one fixed address, so nothing an agent
serves gets lost, keeps running unnoticed, or changes address.

## Current decisions

- One page hub on port 3200, bound to `0.0.0.0`, serves every agent page at
  `/<repo>/<worktree>/<page>/` (`/<repo>/<page>/` on the main checkout, `/_local/<page>/` outside
  a repository) and lists them all on its home page with Stop, Serve again, and Delete.
- The hub starts on demand from the artifacts skill and restores every page from a small machine
  file of repository locations; there is no login service.
- Pages and their records stay in each repository's private `agent-memory/artifacts/`; folders
  without a record still appear, so the index is the full catalog for pruning.
- Apps keep their own port and register a link, start command, description, and process; Stop
  and Start act only after the hub confirms the process identity and port ownership.
- The artifacts skill is the single owner of serving; workflow, skill-creator, and the global
  policy point to it. workflow-progress keeps its own live server and registers it as an app.
- The artifacts folder `agent-memory/artifacts/<name>/` is the one home for durable pages,
  diagrams, mockups and samples; other skills point to it instead of keeping their own.
- `hub-ui-policy.json` governs the hub index only; its name keeps lintapple from picking it
  up for artifact pages, which follow the page engine's own type scale.

## Protected invariants

- Pages are added only from the local machine; the network can open, stop, delete, and start,
  never register a folder.
- The hub serves only registered or catalogued page folders, never a repository, the Git
  directory, or the whole private memory tree.
- A page keeps its address across restarts; the hub never falls back to another port.
- Deleting a repository deletes its pages and records with it.

## Rationale and tradeoffs

Per-page servers on the first free port left the user with no catalog, unstopped servers, and
lost URLs. One hub with fixed addresses fixes all three with a single process. Anyone on the LAN
can press the buttons, behind a confirm dialog; the user accepted that trust level. Apps are links
rather than proxied pages so their own ports and protocols keep working.

## Enforcement

- Live validation of the hub (start, addresses, actions, restart, apps, catalog, races) and of
  agents using it unprompted.
- Review-only: [artifacts skill](../../../config/skills/artifacts/SKILL.md) stays the only file
  that explains serving.

## History

- 2026-10-16: Made the artifacts folder the home for plan diagrams and samples too, and scoped
  the UI policy file to the hub after it flagged every artifact page.
- 2026-10-11: User approved the page hub on 3200 replacing per-page servers on 3100-3199, with
  Lavish removed and the eval viewer published as a static page.
