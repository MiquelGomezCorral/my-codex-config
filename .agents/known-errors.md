# Known Errors

## Errors

- `Missing required commands`: install or expose the app-managed `codex` binary; bootstrap
  does not replace or upgrade it.
- `AGY readiness timeout`: inspect the terminal before retrying; the timeout can be an
  unsubmitted prompt rather than a launch failure. Follow the loaded environment guide for
  the recovery sequence.
- `Forbidden runtime file found in repository`: remove the runtime artifact and keep it
  in the user home rather than the repository.
