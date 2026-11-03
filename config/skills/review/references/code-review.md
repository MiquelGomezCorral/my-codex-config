# Code Review

Review a change like the senior developer who will be paged when it breaks. Order of
importance: correct, safe, holds under load, tested, fast, lean. Lean still matters: every
extra line must be read, tested and fixed later.

Findings are more valuable than commentary. False positives are worse than silence.

## Understand first

1. Identify the stated goal. If none exists, state that limitation and review only
   for regressions.
2. Inspect repository state, the complete relevant diff, and untracked files.
3. Read the code the diff touches before asserting patterns, contracts, or behavior:
   callers of every changed function, the functions it calls, the tests, the README. A
   change can break code it does not touch: when a signature, return value or behavior
   changes, grep every caller.
4. Read applicable decision records and compare the reviewed behavior with their protected
   invariants, including any invariant removed or weakened by the same change.
5. Trace the real flow (where data comes in, what is stored, what goes out) and realistic
   inputs through changed branches and boundaries. Verify that the change solves the
   stated problem, not merely that it compiles.
6. Find the expected load in the repo (README, deploy config): one person running a
   script, or many users and processes at once. Judge scale against that, and say which
   load you assumed.

## Look for

1. **Bug:** wrong result, crash, wrong state transition, broken error path, missed edge case
   (empty, zero, last item, rounding, time zones), a caller broken by the change, a fix
   applied in one caller while the shared function stays broken.
2. **Contract:** a public contract, migration, integration point or fixture left behind by
   a changed signature, return value, schema or behavior.
3. **Risk:** security holes (injection, weak randomness, secrets, missing checks on input
   from users or at other trust boundaries), data loss (errors swallowed, writes in the
   wrong order, no transaction, unsafe partial completion).
4. **Scale:** fine for one user, wrong for many: check-then-write races, the same work done
   by every process, memory or lists that only grow, a query per item, O(n^2) on big
   input, per-process state that must be shared.
5. **Missing test:** whether the important checks can fail when the behavior breaks, and
   low-value tests, both judged by the `test-audit` bar. Report a missing unit test only
   when that bar calls for one, never for coverage.
6. **Speed:** big slowdowns are problems. Small wins (work repeated in a hot loop) are
   suggestions; some software counts every millisecond.
7. **Lean:** code that should not exist or should be smaller.
   - delete: dead code, unused options, speculative features
   - reuse: the repo already has this helper (name the path)
   - stdlib / native: a standard library, the platform, or a maintained library already does
     it (hand-rolled known algorithms included); a new dependency for a few lines (about 20 or fewer)
   - yagni: abstraction with one implementation, config nobody sets
   - merge: near-copies that must change together
   - split: one function doing several unrelated jobs, so it is hard to read or test.
     Split by job, never by line count, and never into helpers that exist only to make a
     function shorter.
8. **Design:** coupling, ownership, naming, and stale documentation.

## Check before you report

- Every finding needs a concrete case: "this input or situation leads to this wrong
  result". No case, no finding.
- Re-read the lines and confirm: the caller exists, the value can really be empty, the
  code really is unused.
- A shortcut marked with a `shortcut:` (or older `ponytail:`) comment that names its limit is
  a decision, not a finding, unless the expected load already crosses it.
- Propose the smallest fix that works. Prefer fixes that delete code. Never add layers,
  frameworks or config the problem does not need.
- No style taste, no "consider", no vague worries.
- Run only repository-defined verification justified by the change.
- Use specialist reviewers only for distinct risk surfaces; verify and deduplicate
  their claims before reporting.

## Findings

Order findings by severity. Every finding carries its P label, `path:line`, a scope
classification (`in-scope`, `out-of-scope`, or `unclear`), and concrete source evidence.

- **P0:** critical failure, security breach, data loss, or unusable behavior.
- **P1:** serious regression or unmet acceptance requirement.
- **P2:** non-blocking improvement.
- **P3:** optional observation.
- **Blocked/unverified:** required evidence is unavailable. This is a verification state,
  not a severity or demonstrated defect.

## Output

Very simple English: short sentences, everyday words. Explain a technical term the first
time you use it. The reader may never have seen this code.

Start with `What this change does:` in two or three sentences.

Then the findings in three groups, skip empty groups:
- **Must fix:** P0 and P1.
- **Should fix:** P2.
- **Nice to have:** P3.

Number findings across all groups, so the user can say "fix 2 and 5". Every finding has all
four parts, each one or two short sentences:

2. **Orders land on the wrong day** (P1, `billing/close_day.py:44`, in-scope)
   - **What this is:** At midnight this job closes the day and bills all orders of that day.
   - **Problem:** Line 44 takes "today" from the server clock, which runs in UTC. An order
     placed at 00:30 in Berlin is billed on the day before.
   - **Fix:** Compute the day once in the shop's time zone:
     `datetime.now(ZoneInfo("Europe/Berlin")).date()`. One line, nothing else changes.
   - **If we skip it:** Late orders show the wrong date, and accounting fixes them by hand.

Then the problem-solution check when a goal exists, and the inspected head, relevant base,
verification commands, and observed results.

End with:
- `Verdict:` `Approve`, `Approve with non-blocking comments`, `Request changes` (name the
  findings to fix first, for example `Request changes, fix 1 and 3 first`), or `Blocked`
  (say what is missing).
- `Lean: -<N> lines possible.` when lean findings exist.
- `Not checked:` the blocked/unverified evidence and open questions, one line.

Nothing found: `What this change does:`, then `No findings.`, one line on what you checked
and any residual verification gap, and the verdict. No praise or filler.

Review-only requests never authorize edits, commits, pushes, or published comments.

## Whole-repo audit

The target is a tree, not a diff: the folder, package or repo the user names, or the whole
repo when none is named. Everything above applies except steps 1-3 of "Understand first":
the goal is the audit itself, and there is no diff or touched code to start from. These
points differ:

- Map first: read the README, the deploy and build config, the dependency list, the entry
  points (main, routes, handlers, jobs, CLI commands) and the tests. Read fully the paths
  where a mistake costs the most: input from users, money, auth, data writes, background
  jobs, anything shared between processes. In a big repo go deep there, not file by file,
  and say which parts you did not read.
- Also look for callers that disagree with what a function returns, the same rule applied
  differently in two places, two helpers doing the same thing (keep one, name the path),
  and a dependency doing what a few lines or the platform can do.
- Before calling code unused, grep the whole tree for it, including tests, fixtures,
  config, and string or dynamic references.
- Scope is the named tree: findings inside it are `in-scope`.
- Start with `What this repo does:` in two or three sentences, and the load you assumed.
- At most 20 findings, most important first. If you left smaller ones out, say how many.
- End with `Verdict:` one line, healthy or what to fix first, in place of the change
  verdicts, then `Lean: -<N> lines, -<M> dependencies possible.` when lean findings exist,
  and `Not checked:` with the parts you did not read or could not run.
- Nothing found: `What this repo does:`, then `Healthy. Nothing to fix.` and one line on
  what you checked.
