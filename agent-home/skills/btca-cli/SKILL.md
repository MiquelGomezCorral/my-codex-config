---
name: btca-cli
description: "Configure and operate the btca CLI: connect providers, add or inspect local/Git/npm resources, troubleshoot setup, and run explicit source-grounded queries. Use for BTCA administration or when the user says to use btca."
---

# BTCA CLI

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
- Project `btca.config.jsonc` overrides the global config and owns provider/model and
  resource choices.
- For provider failures, run `btca status`; connect only when user interaction is
  available. For unknown resources, inspect the catalog instead of guessing.

Use `btca-first` for the research workflow rather than administration.
