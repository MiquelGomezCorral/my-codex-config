# Pull request

## Workflow

1. Inspect `git status`, diff/stat, recent commits, branch/upstream, and any existing PR.
2. Review repository instructions and checks. Stop if the worktree contains secrets,
   unclear unrelated changes, or failed required verification.
3. Read the plan from the `SKILL.md` plan-context rules: it gives the goal and the feature
   area that the title and body describe.
4. Find the PR template: a path supplied in the packet or named by the repository shipping
   skill, then `pull_request_template.md` in any letter case under `.github/`, the
   repository root, or `docs/`, then the `.github/PULL_REQUEST_TEMPLATE/` directory. Verify
   a supplied path still exists. Use the template's sections exactly, in order, with no
   extra sections. Only when no template exists, use `Summary`, `Verification`, and `Risks`.
   When a template directory holds several templates, use the template index the packet
   supplies; otherwise read each template and build one: a line per file with what it is
   for, when to use it, and any useful insight. Pick the template that matches the plan's
   change, ask the parent when none clearly fits, and return the index as a memory
   candidate for `workflow.md` so later packets carry it.
5. Create a draft pull request, or refresh the existing one without changing its draft or
   ready state.
6. Take the goal and user-facing outcome from the plan and request; ground every factual
   claim in the diff, commits, and verification. Write `Not provided` rather than inventing
   product claims.

For a sequential slice, target the accepted predecessor PR branch while it remains
unmerged, so the new PR exposes only the child slice. Verify the PR diff contains only the
child slice; stop if ancestry or a squash merge makes that untrue. A merge is not required
before work on the child starts. After the predecessor merges, reconcile the target and
revalidate affected evidence. In a workflow, the accepted plan must name PR creation or
update and its target/bounds; after result acceptance, do not ask for that same
authorization again.

## Title

Use the repository title format when one exists. The subject says what changes and for
whom, named by the feature a teammate would recognize, never by the mechanism that
delivers it. A reader who sees only the title knows the product area and the outcome.

- Lead with the feature area when the type and scope name only a package or directory.
- Take the outcome from the plan's goal, not from code identifiers or plan slice labels.
- Keep it under about 70 characters; the body carries the details.

| Mechanism title | Outcome title |
| --- | --- |
| `Connect inside chat` | `Connect integrations inside chat` |
| `recover failed connections` | `Recover failed integration connections` |
| `One-time file reminder` | `One-time integration reminder` |
| `queue chat attachments while answering` | `Improve queued chat attachments UI while answering` |
| `preserve durable implementation decisions` | `Preserve implementation decisions for agents` |
| `keep courses quiz-bound with stable unit references` | `Remove fake people, limit course checks to quizzes` |

## Reviewer guidance

Add these as sections only when the repository has no template. With a template, put the
points that apply inside its sections and add nothing else.

- Add a TL;DR that matches the actual diff.
- Separate core files from generated or mechanical files.
- Call out risky behavior changes, migration order, rollout plan, and test coverage.
- Link the issue tracker, dashboards, or design docs that explain intent.
- If the pull request is too large to make reviewable with notes, recommend splitting
  instead of polishing around the problem.

## History cleanup

Only rewrite history when the user asks for it or approves the plan. Before rewriting:

```bash
gh pr view <PR> --json title,headRefName,baseRefName,state,commits
git fetch origin <headRefName> <baseRefName>
ORIGINAL_TREE=$(git rev-parse origin/<headRefName>^{tree})
```

After rewriting, verify content identity:

```bash
echo "Original tree: $ORIGINAL_TREE"
echo "Current tree:  $(git rev-parse HEAD^{tree})"
git diff origin/<headRefName> --stat
```

Do not push when the tree changed unintentionally. Preferred commit groupings follow
dependency order: schema/storage or generated API definitions, core logic, wiring and
integration, UI or surface behavior, then tests.

## Hook failures

Pre-commit hooks are a hard gate. If any hook fails, stop — do not push or create the PR.

The Husky general signal is:

```
husky - pre-commit script failed (code N)
```

The exit code identifies which hook failed; inspect the surrounding output to find the
offending check. Read the repository's hook configuration and the full failure output, fix
the reported source, re-stage only the intended files, and create a new commit.

- Never use `--no-verify` or another hook-bypass flag.
- Never amend a failed-hook commit — the commit did not happen. Fix, re-stage, and create a
  new commit.
- If a hook exposes a pre-existing unrelated failure, report the blocker instead of
  bypassing it.

## Guardrails

- Never hide a meaningful behavior change inside "cleanup".
- Do not rebase, amend, force-push, or rewrite history without explicit approval.
