# Known skills that work

Skills that are **project-agnostic** and have earned a place here by being used and proving
useful. Add an entry only after the user says yes, and only for a skill that was actually
used, not merely vetted.

Before searching anywhere else, read this file. If an entry already covers the need, install
it instead of hunting for a replacement.

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

## UI principles

- **What it does:** Applies a structured design review to UI work so screens follow
  established visual and interaction principles instead of ad-hoc styling.
- **Source:** <https://github.com/humbleteam/design-review>
- **Install:** `git clone https://github.com/humbleteam/design-review .agents/skills/design-review`
- **Scope:** project-agnostic — any repository with a user interface.
- **Vetted:** not yet. Clone and run the vetting in `references/vetting.md` before relying
  on it.
- **Used in:** none recorded yet.
- **Notes:** seeded from the user's example. Confirm the cloned directory actually contains
  `SKILL.md` and that the frontmatter `name` matches, or the install location needs
  adjusting.
