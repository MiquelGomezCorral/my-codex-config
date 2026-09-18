# Harness-First Cheap Model Catalog

## Summary

Add one editable YAML catalog organized by harness, using the vocabulary `low`, `medium`, `high`, and `local`. Delegating skills will read it whenever they create workers and will use the active wrapper or harness’s native orchestration.

## Catalog Interface

Create `agent-home/skills/subagent-routing/references/model-catalog.yaml`:

```yaml
max_local_concurrency: 1

pi:
  low:
    - opencode-zen/nemotron-3-ultra-free
  medium:
    - opencode-zen/nemotron-3.5-lightning-free
  high:
    - opencode-go/deepseek-v4-pro
  local:
    capability: medium
    models:
      - bonsai-local/Ternary-Bonsai-2-27B-PQ2_0.gguf

agy:
  low:
    - gemini-3.8-flash-low
  medium:
    - gemini-3.8-flash-medium
  high:
    - gemini-3.1-pro-high
```

Model identifiers exist only in this file. List order is preference order.

## Routing Changes

- Update `subagent-routing` as the single owner of catalog interpretation:
  1. Detect an active wrapper from runtime evidence.
  2. Inside a wrapper, use its skill and native worker lifecycle.
  3. Outside a wrapper, use the current harness’s native subagent tooling.
  4. Use another harness outside a wrapper only when explicitly requested.
  5. Select the requested tier or automatically choose the cheapest adequate tier.
- Prefer an adequate local model when its single concurrency slot is free. Count the orchestrator if it already runs locally. Route additional workers online or serialize them when no adequate online route exists.
- A missing current-harness catalog entry falls back to that harness’s native default. Report selected harness, tier, model, fallback, and local serialization.
- Preserve the Pi local-search decision before applying generic model routing.
- Update swarm, review, multi-agent review, commit, coordinator, and worktree skills to delegate through this policy. Keep `$code` and `$cleanup` on their existing orchestrator-strength models.
- Document direct one-shot adapters for explicit cross-harness execution through Codex, Pi, AGY, and OpenCode. Pass arguments directly without shell-evaluating catalog values.

## Tests

- Validate catalog shape, harness-first tier lookup, ordered fallback, native-default fallback, and explicit cross-harness routing.
- Verify that no more than one local process can run, including a local orchestrator.
- Add focused skill evals for swarm tier assignment, review workers, commit classification, wrapper detection, and Pi local-search protection.
- Ensure tests reference catalog structure without copying mutable model identifiers.
- Run skill validation, repository tests, bootstrap tests, and `./bootstrap.sh --check`.

## Assumptions

- `local.capability` determines which requests a local model can satisfy; the initial local model is `medium`.
- Tier names describe intended task strength exactly as entered by the user; routing does not infer strength from model names.
- Provider authentication, automatic catalog refresh, pricing discovery, multiple concurrent local models, commits, and live-home changes remain outside this change.
