---
name: computer
description: Inspect the current host's hardware, OS, shell, and developer toolchain when live machine facts affect the task. Supports macOS and Linux; never rely on stored version or capacity values.
---

# Computer Inspection

Use live, read-only commands and report only facts relevant to the request.

1. Detect the platform with `uname -s`.
2. On macOS, use `sw_vers`, `system_profiler`, `sysctl`, `df`, and tool `--version`
   commands as needed.
3. On Linux, use `/etc/os-release`, `uname`, `lscpu`, `free`, `df`, and tool
   `--version` commands as needed.
4. Distinguish observed values from inference. Re-run volatile checks such as free
   space, memory, running services, and tool versions.
5. Do not expose hostnames, usernames, serial numbers, network addresses, or secrets
   unless the user explicitly needs that exact value.

Project dependencies and conventions belong to the repository, not this skill.
