# Ponytail core

## Intent

Agents write the smallest complete change and review code the way Ponytail teaches, through our own
`code-quality` and `review` skills. Ponytail's text is copied in at a pinned version, so an upstream release
changes agent behavior only after someone reads it and syncs it on purpose.

## Current decisions

- Pinned version: Ponytail v5.3.2 (tag `v5.3.2`, commit `16352ac`, 2026-10-17) by Dietrich Gebert, MIT,
  <https://github.com/DietrichGebert/ponytail>.
- No bootstrap clones or links Ponytail. The skill installer never removes links, so a home that ran an older
  bootstrap keeps the six `ponytail*` links until they are deleted by hand:
  `find -H ~/.agents/skills "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills" "${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/skills" "${AGY_CLI_ROOT:-$HOME/.gemini/antigravity-cli}/skills" "${AGY_CONFIG_ROOT:-$HOME/.gemini/config}" -maxdepth 4 -lname '*/external-skills/ponytail/*' -delete 2>/dev/null`
  (a harness this home does not have is just skipped).
- Ponytail's own Codex plugin is not installed either: it brings back the upstream skills and its hooks, and
  every plugin update makes Codex ask to trust those hooks again. A home that added it by hand removes it with
  `codex plugin remove ponytail@ponytail` and `codex plugin marketplace remove ponytail`.
- Where each upstream part went:

  | Upstream (v5.3.2) | Ours | How |
  | --- | --- | --- |
  | `skills/ponytail/SKILL.md` (same rules as its root `AGENTS.md`) | `config/skills/code-quality/SKILL.md` | Base text; our rules added where it is silent |
  | `skills/ponytail-review/SKILL.md` | `config/skills/review/references/code-review.md` | Base text; our P0-P3, scope and evidence rules kept |
  | `skills/ponytail-audit/SKILL.md` | The whole-repo audit section of `code-review.md`, and the audit mode in `config/skills/review/SKILL.md` | Only what differs from a diff review |
  | `LICENSE` | `LICENSE-ponytail` in both skills | Unchanged copy |
  | `ponytail-debt`, `ponytail-gain`, `ponytail-help`, levels, Band, Board, hooks, commands, MCP | Not adopted | |

- Deliberate differences, kept on every sync:
  - Tests: upstream asks for one small test for new non-trivial logic. Here the check is the live validation
    `AGENTS.md` asks for or an assert in the code, and a unit test only when `test-audit`'s bar calls for one.
  - Review keeps P0-P3, the scope labels and Blocked/unverified. Upstream's groups map onto them: Must fix is
    P0 and P1, Should fix is P2, Nice to have is P3.
  - Verdict words stay ours (`Approve`, `Approve with non-blocking comments`, `Request changes`, `Blocked`)
    instead of upstream's `Verdict: Ship.`; upstream's "fix 1 and 3 first" is kept as a suffix.
  - Left out on purpose: review's "give it in full" (reports stay short), its "nothing named: the last commit"
    fallback (`review` owns target selection), and audit's extra yagni examples (the review list covers them).
  - A bare `$review audit` uses the `swarm` preset, not `full`: an audit is a one-shot report with no live tests.
  - No levels and no session mode switching (they need Ponytail's hooks and mode state).
  - The `shortcut: <the limit>, <when to upgrade>` comment is kept, and review still accepts the older
    `ponytail:` form; the debt ledger that collects them is not.
  - Dependencies: upstream's "Never add a dependency for a few lines" became "look for a maintained library
    for a known algorithm; skip one only for about 20 lines or fewer" (code-size audit, 2026-11-03).
- Syncing a later version:
  1. Clone the full repository into an empty temporary folder:
     `git clone https://github.com/DietrichGebert/ponytail.git`.
  2. Read what changed since the pin:
     `git diff v5.3.2 <new tag> -- skills/ponytail skills/ponytail-review skills/ponytail-audit LICENSE AGENTS.md`,
     and `git diff --stat v5.3.2 <new tag> -- skills` for new skills.
  3. Port each change into the file the table names, keeping the deliberate differences above.
  4. Update the pinned version and commit here, in both skills' attribution lines and in the README attribution,
     and add a History entry.

## Protected invariants

- Nothing downloads Ponytail; a new version arrives only through a manual sync recorded here.
- `AGENTS.md`'s test policy and the `test-audit` gate win over any upstream test rule.
- Review output keeps P0-P3, the scope labels and Blocked/unverified, which the workflow, the coding loop and the
  coding supervisor depend on.
- Ponytail's rules have one owner each: core rules in `code-quality`, review and audit in `review`. No second
  Ponytail skill or plugin is installed beside them.
- Each skill that holds Ponytail text ships `LICENSE-ponytail`.

## Rationale and tradeoffs

- Installing upstream as it is was rejected. In v5, `ponytail-review` and `ponytail-audit` claim the same triggers
  as `review` ("review this", "code review", "review the whole repo") with a report that has no P0-P3; its test
  rule contradicts `AGENTS.md`; and two always-on skills would own the same preference ladder.
- Tracking upstream automatically was rejected: third-party prompt text would change every agent without review.
  The bootstraps also cloned upstream HEAD once and never updated it, which left 4.10.3 installed while 5.3.2 was out.
- The cost is a manual sync for each upstream release worth taking.

## Enforcement

- Review-only: the rules are prose in skills and no check can tell whether they still follow upstream.
- Review output markers (P0-P3, scope labels, Blocked/unverified and one verdict string):
  [configuration tests](../../../tests/codex-config.test.mjs).
- Install behavior of the remaining portable skills: [bootstrap tests](../../../tests/bootstrap.test.sh).

## History

- 2026-10-19: Removed the hand-installed Ponytail Codex plugin, because its skills and hooks duplicated the
  merge and its updates kept stopping Codex sessions on the hook review prompt.
- 2026-10-19: Adopted Ponytail v5.3.2 as the base text of `code-quality` and `review`, added a whole-repo audit
  mode to `review`, and stopped installing upstream Ponytail, because v5's review skills collided with `review`
  and the unpinned clone had stayed on 4.10.3.
- Before 2026-10-19: the bootstraps cloned Ponytail once and linked its six skills into every harness, without
  its hooks.
