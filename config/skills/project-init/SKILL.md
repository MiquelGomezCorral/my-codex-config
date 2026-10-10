---
name: project-init
description: Set up or repair a repository for agent work in one pass - Git and `.gitignore`, one `AGENTS.md` that every harness follows, private agent memory, applicable code-quality references, decision records, CodeGraph, BTCA sources, repo-local skills, template leftovers, and a closing commit. Use for the repository `init` command (`/commands/init` in Codex, `/harness-init` in Claude Code), a new or newly cloned repository, or when the user asks to set up, onboard, or refresh a project for agents.
---

# Project init

Make a repository ready for agents. It works on new and existing repositories: every step
first checks what is there, keeps what is right, and fills only the gaps, so running it
again repairs instead of duplicating. Work at `git rev-parse --show-toplevel` once a
repository exists, never in a subdirectory.

## Take the user's guidelines

Start from what the user gave with the request: files to read, skills to check, other
repositories to copy conventions from, the stack, or any rule. Read those first. They win
over every default below.

## Inspect before changing

- **Git:** whether it is a repository, `git status --porcelain`, default branch, remotes,
  commit history and its message style, worktrees, PR template.
- **Instruction files:** `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/`,
  `.github/copilot-instructions.md`, `.agents/`, `docs/decisions/`.
- **Stack:** manifests (`package.json`, `pyproject.toml`, `requirements.txt`, `go.mod`,
  `Cargo.toml`, and similar), main languages, existing lint, format, test, pre-commit, and
  CI configuration, and their commands.
- **Template leftovers:** README, project and package names, descriptions, authors,
  versions, URLs, license holder, and example env files that still carry a template's
  generic values. Note each one as `path:line`.

Tell the user the inventory in a few lines.

## Order

1. Do every step below that needs no answer.
2. Ask every open question in one message: unclear Git rules, the proposed checks, BTCA
   sources and provider pinning, vetted skills, decision records, template values, and
   dirty files the run must touch.
3. Finish the answered steps, commit, and list what still waits on an answer.

Before editing a file that `git status` showed as already modified, ask; otherwise leave it
untouched and out of the commit.

## Steps

Skip a step that is already done; update one that is stale.

1. **Git.** When there is no repository, run `git init` and keep the user's configured
   default branch. Never add a remote or push. Keep `.gitignore` current for the stack:
   `.env` and other secret files (keep `.env.example` or `example.env` tracked), build
   output, caches, virtual environments, OS and editor files, and `.btca/` when BTCA keeps
   local data. CodeGraph ignores its own `.codegraph/` contents. Add missing entries; never
   remove one without asking. Never ignore `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`,
   `.agents/`, `docs/decisions/`, or `btca.config.jsonc`; ask when an existing rule does.
2. **One instruction file.** `AGENTS.md` is the instruction file for every agent. Create it
   from the `agents-memory` template when missing, or add only its missing sections. Codex,
   Pi, Antigravity, and Claude Code read `AGENTS.md` when their own file is absent, so
   create no harness files. When `CLAUDE.md` exists, keep its content and add
   `@AGENTS.md` near the top, because Claude Code then stops loading `AGENTS.md` on its own.
   When `GEMINI.md` exists, keep it; Antigravity reads both. Report rules that conflict with
   `AGENTS.md` and ask which one wins.
3. **Git rules.** Fill `AGENTS.md` `## Git` with the default branch, the commit message
   style from history, the PR template, and the worktree model. When the repository does
   not document one of these, propose it in the questions and write it after the answer.
   The proposed worktree model: independent workers each get their own worktree and
   branch, and the main agent combines their work.
4. **Private memory.** Run the `agents-memory` bootstrap: `agent-memory/` in the Git common
   directory, never in the worktree.
5. **Code quality.** Compare the repository's languages with the references listed in the
   `code-quality` skill. Under `## Code quality` in private `agent-memory/conventions.md`,
   record which references apply and which languages have none. The check commands go only
   in `AGENTS.md` `## Commands`. Propose missing checks (linter, formatter, test runner,
   pre-commit) and add them only after approval.
6. **Decision records.** Load `decision-records`. Running init approves initializing a
   missing `docs/decisions/index.md` from its template. Propose any record for product or
   architecture intent the user stated, with its exact text, and write it after approval.
   Report the skill's `Decision records:` line.
7. **CodeGraph.** Run `codegraph-setup` when `.codegraph/` is missing.
8. **BTCA.** Load `btca`. From the manifests, pick the external frameworks and SDKs whose
   behavior changes and matters here, check `btca resources`, and propose the missing
   ones. Write the approved ones into the project `btca.config.jsonc` by hand, never with
   `btca init` (it prompts and writes its own defaults). A project file replaces the global
   provider, model, `providerTimeoutMs`, and `maxSteps`, so copy those from the global
   config and ask before pinning them for every clone. Verify with `btca resources`.
9. **Repository skills.** Load `skill-scout`, check its catalog for the stack and any
   skill the user named, and install approved skills repo-locally in `.agents/skills/`.
   List every repo-local skill in `AGENTS.md` `## Repository skills` with one line on when
   to use it, because not every harness discovers that folder on its own.
10. **Template leftovers.** Propose the real value for each leftover, or ask for it, and
    replace it only after the answer. Do not run the template's own setup (environments,
    installs); the user starts projects from templates. In a repository with no commits,
    ask whether the template files go in a first commit of their own.
11. **Commit.** Running init is the request for local commits of its own work. Commit
    through the `git` skill, with the repository's rules first and its grouping of
    commits, and give the Git worker this goal: set up the repository for agent work.
    Commit only files this run created or changed. Never include private memory,
    `.codegraph/`, secrets, files that were dirty before the run, or unrelated changes, and
    do not push unless asked. If the repository forbids agent commits, leave the changes
    and say so.

## Report

One short line per step (done, skipped, or waiting on an answer), the files changed, the
commits, and "restart the harness so it loads the CodeGraph tools" when CodeGraph indexed.
End with the `Memory:` line.
