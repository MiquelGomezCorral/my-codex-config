# Known skills that work

Skills that are **project-agnostic** and have earned a place here by being used and proving
useful. Add an entry only after the user says yes, and only for a skill that was actually
used, not merely vetted.

Before searching anywhere else, read this file. If an entry already covers the need, install
it instead of hunting for a replacement. A lead (below) is not an entry: vet it first and
install only after the user approves.

## How to add an entry

1. The skill was installed in a real repository and used for real work.
2. Ask the user whether it should be kept for future, similar repositories.
3. On their yes, add it below with every field filled in. Leave `Vetted` honest: an
   unvetted entry says so.

```markdown
## <Short name>

- **What it does:** one line, in terms of the observable outcome.
- **Source:** <repository URL>
- **Install:** `<exact command>`
- **Scope:** project-agnostic — say which kind of repository it applies to.
- **Vetted:** date, security pass result, and any false positives that were reviewed.
- **Used in:** repositories where it has actually run.
- **Notes:** overlap with other entries, caveats, or why it beat the alternative.
```

If two entries overlap, record the overlap in `Notes` and leave the decision to the user.
Do not merge or retire entries on your own.

---

## Leads

Skills the user pointed at that are not vetted or used yet. Do not install a lead into an
active location. Fetch it into a scratch directory, run `references/vetting.md`, and ask
the user before installing. Once it has been used and the user says yes, move it above as
an entry with an exact install command.

### UI principles

- **What it does:** Applies a structured design review to UI work so screens follow
  established visual and interaction principles instead of ad-hoc styling.
- **Source:** <https://github.com/humbleteam/design-review>
- **Vetted:** not yet.
- **Used in:** none recorded yet.
- **Notes:** seeded from the user's example. Confirm the repository contains `SKILL.md` and
  that the frontmatter `name` (`design-review`) matches its directory.
