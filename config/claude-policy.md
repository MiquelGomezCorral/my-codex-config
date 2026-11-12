# Claude Code only

- On Opus sessions a hook denies the fourth distinct file read in one human message; `agent-guard unlock reads` lifts it for the session, and only on the user's explicit words; `agent-guard lock reads` restores it.
- On Opus sessions, a helper's reads count against its parent's three-file reading budget for the same human message; helpers on other models are exempt.
- Never `rm -r` a shell variable or a `$(...)` result; delete a temp folder by its literal path in its own command, or leave it in the scratchpad. Claude Code prompts the user for such removals even in bypass mode.
- On Opus sessions a hook enforces the handoff of browser and desktop work to `computer-controller`; `agent-guard unlock browser` lifts it for the session, and only on the user's explicit words; `agent-guard lock browser` restores it.
