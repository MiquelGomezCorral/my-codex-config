---
name: decision-records
description: Assess, create, or update living repository decision records after implementation planning and during review. Use when work may change important non-derivable product or architecture intent.
---

# Decision records

Preserve the important intent behind a feature without turning the repository into a changelog.
Decision records are living current-state documents; Git preserves their complete history. Code,
schemas, tests, and checks remain authoritative for facts they can enforce.

## Assessment

After planning and before implementation, read `docs/decisions/index.md` when it exists and every
applicable record. If the index is missing, treat it as an empty existing-record set, continue the
significance assessment, and propose exact index initialization during read-only planning. Planning
and review never write the index; authorized execution may initialize it. A task that skips planning
does not acquire a mandatory assessment. Whenever this skill is used, finish with exactly one
assessment: `Decision records: create`, `update`, or `no change`, followed by a concise reason or
record link.

Record a decision when non-derivable intent exists and at least one signal applies:

- Feature success semantics could regress while the feature still appears functional.
- Behavior crosses product, package, worker, role, locale, or public-contract boundaries.
- The choice affects security, privacy, reliability, performance, availability, or data integrity.
- Reversal is expensive or dangerous.
- A plausible rejected alternative is likely to recur.
- The change establishes a reusable, blessed approach.
- A critical constraint cannot be encoded mechanically.

Do not record routine fixes, mechanical refactors, self-describing local code, progress notes, or
facts fully owned by code or checks. Prefer updating an existing concern record over creating a new
file; create a file only for a distinct stable concern.

## Workflow

1. Find the applicable records as described in [Assessment](#assessment).
2. Compare that behavior with their `Protected invariants`.
3. If intent conflicts, whether intentionally or accidentally, show the recorded requirement, the
   planned behavior and evidence, and let the developer choose: revise the plan, revise the record,
   or reopen planning. Do not resolve the conflict yourself.
4. Propose the exact record and index changes before writing them. Plan approval authorizes only
   those exact changes.

## Record format

Use [the record template](assets/record-template.md) when creating a record and [the index
template](assets/index-template.md) when initializing a missing index.

Records live at `docs/decisions/<capability>/<stable-concern>.md`, one file per stable concern. Each
contains `Intent`, `Current decisions`, `Protected invariants`, `Rationale and tradeoffs`,
`Enforcement`, and `History`.

The index lives at `docs/decisions/index.md` and contains links with brief descriptions. Preserve
existing index content; do not overwrite it or add duplicate links. Initialize a missing index from
the template only after explicit execution approval, including when no significant concern record
is needed.

- Keep current intent in the main sections and date meaningful decisions and changes in `History`.
- Prefer updating an existing concern over creating a new record.
- Keep the index to links with brief descriptions; do not invent records.
- Update the index atomically with any created, renamed, moved, or removed concern file. Preserve
  links and descriptions, and remove the empty-state sentence when the first record is added.
- Create a capability folder or concern record only for a real approved concern; index
  initialization alone does not justify either.
- Link enforcement to authoritative code, schemas, tests, or checks. If none can enforce it, say
  `Review-only` and state why.
- Exclude routine fixes, implementation progress, and PR-by-PR logs.

During review, read applicable records and compare the change with their protected invariants. If
they conflict, including when the same change removes or weakens an invariant, show the record,
implementation evidence, and the developer's choices to revise code, revise the record, or reopen
planning. For a missing index, follow [Assessment](#assessment) and report any approved
initialization requirement without writing it. Never silently rewrite a record to match the
implementation.

## Output contract

```text
Decision records: <create|update|no change> — <reason or link>
Record changes: <exact record and index changes, including index initialization, or none>
Enforcement: <authoritative guard or Review-only>
```

Keep concern assessment separate from index initialization: `Decision records: no change` may
describe a routine or otherwise non-significant concern, while `Record changes` explicitly names
approved index initialization. Never report an approved index write as `none`.

## Boundaries

Do not create product APIs, database tables, generated indexes, validators, or dependencies as part
of this skill. Do not write or change a decision record or index entry without the developer's
approval; planning and review remain read-only. Never silently overwrite an existing index or
duplicate a link.
