# Discovery

How to turn a request into searches, and what to do when they find nothing. Where to
search and the commands are in `sources.md`; the gate that judges each lead is in `SKILL.md`.

## Is it a search request?

"How do I do X" and "can you do X" are search requests only when a published skill could
plausibly exist: a repeatable, specialized workflow or domain (testing a framework,
deploying to a platform, a document format). A one-off question, or something this
repository's own skills already cover, is not.

## Build the queries

- Name the domain and the task, then search both together: `react performance` finds more
  than `performance`, and `pr review` more than `review`.
- On an empty or noisy result, try the neighbouring words (`deploy`, `deployment`, `ci-cd`)
  before giving up, and add `--owner <owner>` once the user names an owner.
- For a broad domain, glance at the skills.sh leaderboard after the catalog check and before
  the CLI search. It is a list of leads, not a verdict.

## When nothing turns up

Say that no matching skill was found and list the queries tried. Offer to do the task
directly. If the need keeps coming back, offer to write a skill with `skill-creator`, and
note that `evidence.md` found no benefit from self-authored skills, so it is a
choice for the user.
