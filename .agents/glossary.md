# Glossary

## Terms

- Managed path: a destination replaced by a repository-owned symlink.
- Agent home: shared skills installed under `~/.agents/skills`.
- Explicit Vault search: a user-requested invocation of the Vault adapter, never automatic
  prompt injection.
- Runtime state: authentication, session, database, log, cache, and memory data kept
  outside Git.
- Wrapper: a proven active orchestration runtime that owns worker launch and lifecycle.
- Super agent: the root or delegated agent that owns delegation for its subtree and loads
  `super-agent`.
- Harness: an agent runtime, such as Codex, Pi, or AGY, available directly or through a
  wrapper.
- Preset: one catalog strength label: `low`, `medium`, `high`, or `local`.
- Capability tier: the minimum preset strength a task or local model can satisfy.
- Local route: a catalog model executed on the current machine and subject to the shared
  local concurrency limit.
- Direct adapter: a documented one-shot command for an explicitly requested harness when
  no wrapper owns the lifecycle.
- Local concurrency slot: one permitted active cataloged local-model process; the
  orchestrator consumes it when it uses such a model.
