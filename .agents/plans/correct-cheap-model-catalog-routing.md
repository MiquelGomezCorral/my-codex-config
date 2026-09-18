# Correct the Cheap-Model Catalog and Delegation Flow

## Summary

Repair the invalid YAML, align routing with the original runtime-native design, fix reviewer lifecycle completion, and clean up portability/documentation drift.

The earlier “suggestion” only means that `automation-runner` was removed, leaving eight Codex agents while one README sentence still says nine. Change that sentence and current-state memory to eight; add no agent.

## Catalog Interface

Use valid tiered local lists and retain one global local-process limit:

```yaml
max_local_concurrency: 1

pi:
  low:
    - opencode-go/mimo-v2.5
  medium:
    - opencode-go/deepseek-v4.1-flash
  high:
    - opencode-go/deepseek-v4-pro
  local:
    medium:
      - bonsai-local/Ternary-Bonsai-2-27B-PQ2_0.gguf

agy:
  low:
    - gemini-3.8-flash-low
  medium:
    - gemini-3.8-flash-medium
  high:
    - gemini-3.1-pro-high
```

- `local.<tier>` expresses each local model’s capability.
- `max_local_concurrency` applies across the complete delegation tree, including a local orchestrator.
- Keep model identifiers exclusively in this catalog.
- Do not add per-model concurrency until an actual model needs a different limit.

## Implementation Changes

- Make runtime-native routing authoritative everywhere:
  1. Detect an active wrapper such as Orca.
  2. Use that wrapper’s skill and native lifecycle.
  3. Without a wrapper, use the current harness’s native subagent tooling.
  4. Use another harness only when explicitly requested through a documented one-shot adapter.
- Reconcile `config/AGENTS.md`, `subagent-routing`, delegating skills, evaluations, README, and active `.agents` memory with that policy. Remove contradictory Orca-only assertions.
- Replace the abstract adapter description with verified argument-vector templates for `codex exec`, `pi --print`, `agy --print`, and `opencode run`. Pass the prompt and catalog model as separate arguments; never construct or evaluate shell code from catalog values.
- Allow generated Pi reviewers to use `bash` and AGY reviewers to use `run_command` solely so they can execute Orca’s injected `worker_done` command. Continue withholding their edit/write tools and preserve the read-only review contract.
- Replace committed `/home/turbotowerlnx/...` Orca hook paths with `$HOME/.orca/...`. Extend portability checks to reject committed Linux home paths.
- Change current documentation and memory from nine agents to eight. Leave historical persisted plans unchanged.
- Update `docs/decisions/agent-tooling/delegation-routing.md` to describe `local.<tier>` lists and the runtime-native lifecycle order; keep its index entry unchanged.

## Verification

- Update the existing Node assertions to require the exact catalog hierarchy, seven unique model IDs, centralized identifiers, global local concurrency, portable hook paths, eight agents, and runtime-native routing.
- Extend isolated bootstrap tests to verify Pi and AGY reviewers receive command execution but no direct edit/write tool.
- Run:
  - `./bootstrap.sh --check`
  - `node --test tests/*.mjs config/plugins/vault-context/test/plugin.test.mjs`
  - `bash tests/bootstrap.test.sh`
  - `git diff --check`
- Rerun one bounded quick-review specialist on every catalog model through the depth-2 Orca coordinator. Launch the local Bonsai route alone, require exact-model reporting and settled `worker_done` lifecycle, and report any timeout without substituting another model.

## Assumptions

- Orca’s maximum delegation depth is now two, so no repository change is needed for that earlier runtime blocker.
- Local concurrency remains globally limited to one.
- A model that launches but cannot finish the bounded quick review remains a reported catalog/runtime failure rather than being silently replaced.

Decision records: update — revise the existing delegation-routing record to match the corrected local schema and runtime-native policy.

Record changes: update `docs/decisions/agent-tooling/delegation-routing.md`; keep `docs/decisions/index.md` unchanged.

Enforcement: catalog/configuration tests, bootstrap tests, and the seven-model live swarm.
