---
name: btca
description: Ground current external library, SDK, or framework behavior with btca before trusting memory, and administer btca itself — providers, resources, and CLI troubleshooting. Use when implementation, review, or an answer depends on how an upstream package behaves now.
---

# BTCA

`btca` answers questions about **registered upstream sources** by searching the real
repository or documentation with a configured model provider. It is not a general search
engine and it cannot see this repository.

## Scope

Use it for:

- External library, SDK, or framework behavior that may have changed upstream.
- Current API shape, recommended composition, deprecations, and migration guidance.
- A question you would otherwise answer from memory or from possibly stale documentation.

Do not use it for:

- What this repository already does. Read the local code first.
- General programming knowledge, or anything stable enough that memory is reliable.
- A topic with no registered resource behind it.

It is neither free nor instant: one question can run up to 40 provider steps against your
provider account. Reach for it where being wrong is expensive, not as a first step in every
task.

## Ask

1. Inspect the live catalog first; never assume a resource name exists: `btca resources`.
2. Identify the narrow external behavior that needs fresh evidence.
3. Choose the fewest relevant resources.
4. Ask one implementation-shaped question:
   `btca ask -r <resource> -q "<focused question>"`.
5. Preserve the supporting paths or URLs, and keep source evidence separate from inference.
6. If BTCA is unavailable, incomplete, or has no resource for the topic, say so and fall
   back to local integration code plus official documentation.

Do not skip local code inspection when the task asks how this repository already uses the
SDK. When repository behavior and upstream guidance disagree, surface the mismatch.

## When a resource is missing

A resource is a pinned clone of an upstream repository or documentation site. When the same
external uncertainty comes up more than once, or you are about to answer upstream behavior
from memory, propose adding the source instead of guessing:

- Name the library or package, and the question that needs grounding.
- Ask before adding one; a resource costs disk (tens to hundreds of MB) and clone time.
- Then `btca add`, verify with `btca resources`, and re-ask the original question.

Say "there is no resource for X — add one?" rather than silently answering from memory.

## Administration

Use live `--help` output for command shapes; do not invent flags.

```bash
btca resources
btca status
btca ask --help
btca ask -r <resource> -q "<focused question>"
```

- Add resources with `btca add`; verify them with `btca resources`.
- Accept configured names returned by the live catalog, HTTPS Git URLs, or
  `npm:<package>` one-off references.
- A project `btca.config.jsonc` adds its resources to the global ones, but its provider,
  model, `providerTimeoutMs`, and `maxSteps` replace the global values; when it leaves them
  out, btca falls back to its own defaults, not the global config. `btca init` prompts and
  writes those defaults; write the project file by hand instead.
- Providers: `opencode`, `openai`, `anthropic`, `google`, `github-copilot`, `openrouter`,
  `minimax`, `openai-compat`. Switch with `btca connect -g -p <provider> -m <model>`.
- Credentials come from the provider's environment variable, such as `OPENCODE_API_KEY`, or
  from the shared OpenCode auth store. Never write a key into a repository.
- The OpenCode **Go** subscription is not usable here: it is a session-based endpoint on
  `/zen/go/v1` that requires an `x-opencode-session` header, while btca speaks the plain
  OpenAI-compatible `/zen/v1`.
- For provider failures run `btca status`; connect only when user interaction is available.
  For unknown resources, inspect the catalog instead of guessing.
