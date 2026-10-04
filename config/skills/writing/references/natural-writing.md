# Natural writing

Guidance for shaping ideas, outlining, drafting, editing, and reviewing prose. Apply it
throughout the writing process. Two upstream sources are merged here so
every pattern has exactly one owner instead of two lists. Attribution lives in the
repository README, not in this file.

## Choose the job

**Prepare.** Help shape an idea or outline. Identify the reader, purpose, available facts,
and gaps that matter. Build a structure that serves the requested piece.

**Draft.** Write from the request, notes, and supported facts. Use these principles while
composing; no existing draft is required. Do not invent evidence to make the text specific.
Clearly labelled hypothetical illustrations may explain a supported concept; never present
them as real observations, measurements, or personal experience.

**Edit.** The user shares a draft to fix. Make the minimum effective edit with the rules
below. Explain material changes briefly unless the user wants only the finished text.

**Detect.** The user asks whether a piece is AI slop, or asks to audit, scan, or flag a
draft without rewriting it. Name each pattern that causes a contextual problem, quote the line,
and give the fix in a few words. Do not rewrite, add an unsolicited score, or guess whether
AI wrote it. A pattern alone does not establish authorship or poor writing.

Infer the stage, audience, format, and purpose from the request and context. Ask only when
missing information materially changes the result. Request a draft only when the user wants
that draft edited or inspected and it is unavailable. For ordinary assistant replies,
compose the answer directly without requesting a draft or adding an editing report.

## Use judgment before patterns

These are contextual editing heuristics, not universal defects or an AI-authorship test.
Some source observations concern encyclopedic writing and do not transfer to every genre.
Flag an occurrence only when it adds empty padding, obscures meaning, inflates a claim, or
conflicts with the requested voice or format. A matching word or sentence shape is not enough.

Truth, meaning, and coverage come first. Explicit task and publication requirements, the
audience, and the writer's established voice take precedence over generic style defaults.
When writing as Miquel, use his profile's contextual preferences; when editing someone else,
preserve that author's voice. Do not apply Miquel's persona to every author or assistant reply.

## Constraints

Non-negotiable at every stage. An output that breaks one of these fails, whatever else it
improves.

- Preserve meaning, supported factual claims, and intent. Flag suspected factual errors
  instead of silently preserving them as verified or changing the claim without explanation.
- Preserve coverage: do not drop list items, options, or qualifiers (for example, removing
  one option from a list) unless they are truly redundant.
- Do not invent facts, dates, quotes, citations, the author's opinions, or personal experiences.
  Use the supplied material and, when research is part of the task, verified sources. During an edit, do not
  add new factual claims unless the requested scope includes that work.
- Do not imply a source ("according to…") unless you can name the actual source from the
  input or verified research. Preserve attribution, links, uncertainty, and evidence limits.
- Keep genre and audience intact (for example, neutral encyclopedic tone versus personal
  essay). Use `voice-soul` only when that voice fits.
- Do not rewrite quoted material unless the user asked to rewrite the quote itself.
  Preserve code, identifiers, literal strings, and citation formatting unless changing them
  is part of the request.
- Do not introduce new AI patterns. The output must pass the same contextual checks it applies.
  Common traps: "Here's the thing:", "It's not about X, it's about Y", and formulaic hooks
  that try to sound casual.

## Writing and editing principles

- **Preserve the writer's real voice.** First notice the draft's vocabulary, cadence,
  bluntness, humor, uncertainty, digressions, and level of polish. Keep the traits that feel
  personal to the writer. Do not make every paragraph equally tidy, and do not rewrite
  distinctive lines merely for consistency.
- **Make the minimum effective edit.** Fix AI patterns, errors, repetition, and unclear
  passages. Leave strong human sentences alone. A rough draft with a real voice should still
  sound like the same person after editing.
- **Lead with the point when the setup adds nothing.** Cut generic throat-clearing. Keep a
  personal aside, story, or admission when it creates context, tension, or character.
- **Front-load only when it improves clarity.** Put conclusions early when that helps the
  reader. Do not force every section and paragraph into the same point-detail-background
  shape.
- **Keep the user's meaning.** Do not manufacture factual claims, results, or the writer's
  opinions. Keep hypothetical illustrations clearly hypothetical. Ask about uncertainty
  only when resolving it materially changes the result.
- **Open it up, do not dumb it down.** Keep the substance, nuance, and precision. Strip out
  only what makes it hard to read: unexplained jargon, needless abstraction, and tangled
  structure. Keep precise technical terms and explain them when the reader needs it.
- **Make agency clear when it matters.** Prefer active voice when it makes responsibility
  or action clearer. "The parser rejects invalid input" is clear with a technical subject.
  Keep passive voice when the actor is unknown, irrelevant, or the recipient is the focus.
  Never invent an actor to make a sentence active.
- **Make every sentence earn its place.** Cut empty qualifiers and throat-clearing. Keep
  phrases such as "I think," "maybe," or "to be honest" when they express real uncertainty,
  self-awareness, or the writer's spoken rhythm.
- **Untangle sentences without flattening the cadence.** Split sentences and paragraphs when
  they are genuinely hard to follow. Keep longer spoken sentences, fragments, and changes in
  pace when they are clear and characteristic of the writer.
- **Be concrete and specific.** Prefer supported names, numbers, dates, mechanisms, and
  examples to abstractions. "The integration improved efficiency" can become "The integration
  cut deploy time from 40 minutes to 4" only if those measurements are supplied or verified.
  If evidence is missing, ask, flag the gap, or narrow the claim; never supply plausible data.
- **Use the portability test.** If a sentence could move unchanged to another person,
  company, country, or product, check whether it contributes anything here. General principles,
  definitions, and necessary instructions can still be useful. Cut empty filler or replace it
  with supported detail specific to this subject.
- **Support the interpretation.** Let facts, actions, examples, and consequences carry the
  emphasis. Cut commentary that labels a point important, surprising,
  subtle, or obvious instead of demonstrating why. If the surrounding prose already shows the
  point, trust the reader and delete redundant commentary. Keep an explanation of why a
  distinction matters when it helps the reader understand or act.
- **Protect the specific fact.** Do not smooth a useful detail into generic importance. "The
  tool significantly improves engineering productivity" can become "The tool cut review time
  from 30 minutes to 8" only when that measurement is supported.
- **Make verbs do the work.** Replace weak verb phrases with direct verbs. "Made a decision"
  becomes "decided." "Has the ability to" becomes "can."
- **Know the job.** Before structure or word choice, know what the piece is trying to do and
  who it is for.
- **Preserve useful edge and character.** Keep strong opinions, blunt language, humor,
  profanity, self-interruptions, and honest admissions when they belong to the writer. Do not
  replace them with safer or more professional wording.
- **Keep structure unless it hurts the piece.** Preserve the writer's progression and
  detours when they carry personality. Explain material reorganization when a change report
  is appropriate; respect requests for only the finished text.

## Words to cut

Three groups of contextual signals. The governing test is the same for all of them: cut
the word when it adds nothing, keep it when it carries emphasis, uncertainty, contrast, or the
writer's rhythm. Precise terminology, literal usage, names, and quotations are not filler.

**Often-inflated vocabulary, prefer a plain alternative when it preserves meaning:**
delve, foster, leverage, utilize, facilitate, empower, streamline, robust, cutting-edge,
paradigm shift, game changer, this is huge, this changes everything, tapestry, realm, beacon,
multifaceted, meticulous, intricate, paramount, transformative, elevate, embark, supercharge,
harness, ever-evolving.

For example, keep "test harness" as a technical term and "robust" when the described
evidence supports robustness. Do not replace a precise term merely because it is on this list.

**Often-empty adverbs, cut when they add nothing:** just, literally, honestly, simply,
actually, truly, fundamentally, importantly, crucially, inherently, inevitably. Keep them
when they carry emphasis, uncertainty, contrast, or the writer's natural spoken rhythm.

**Often-empty phrases, cut when they delay the point:** it's worth noting, it's important to
note, at the end of the day, when it comes to, at its core, in today's world, in the age of,
in the world of, the reality is, the truth is, in terms of, with regard to, in order to,
going forward, in this article, let's dive in. Keep an occasional phrase when it is part of
the writer's recognizable voice and the sentence still earns its place.

## Patterns to cut

One owner per pattern. Each entry carries its upstream rule id where one exists and its
individual rule-reference impact: HIGH, MEDIUM, or LOW. Impact applies only to an occurrence
that fails the contextual test above; a justified use is not a violation.

### Content

- **`content-significance` (HIGH): importance puffery.** "Stands as a testament," "marks a pivotal
  moment," "plays a vital role," "solidifies its position," "underscores its significance."
  State the fact and let the reader judge whether it matters. "The launch marks a pivotal
  moment for the company" becomes "The company launched the product"; add why it matters
  only when the input or verified evidence supports that claim.
- **`content-notability` (MEDIUM): media name-dropping.** Cut outlet lists used only to imply
  prestige. Keep named sources, links, and publication context when they substantiate a claim;
  say what the source actually reported.
- **`content-ing-endings` (HIGH): superficial analysis.** Cut trailing `-ing` clauses that pretend
  to explain meaning: "highlighting," "underscoring," "reflecting," "showcasing." "The launch
  adds file search, highlighting the team's commitment to better workflows" becomes "The
  launch adds file search." Add a concrete user benefit only when it is supported.
- **`content-promotional` (HIGH): travel-brochure adjectives.** Cut "nestled," "vibrant,"
  "breathtaking," and their relatives when they are decorating rather than describing.
- **`content-vague-attribution` (HIGH): weasel attribution.** "Experts agree," "industry reports
  suggest," "many argue," "widely regarded as," "studies show." Name the actual source or
  flag the unsupported attribution. Never invent a source, delete a material claim silently,
  or convert an attributed view into an established fact.
- **`content-challenges` (MEDIUM): formulaic difficulty sections.** Remove the stock "Despite
  challenges…" paragraph that lists obstacles before declaring they were overcome. Report the
  actual obstacle. Preserve substantive obstacles, limitations, and unresolved problems.

### Language

- **`language-ai-vocabulary` (HIGH): inflated word stock.** Replace the often-inflated
  vocabulary above when a plain word preserves the meaning. Keep precise or characteristic usage.
- **`language-dual-adjectives` (MEDIUM): adjective padding.** Remove "innovative and
  comprehensive" style pairs when they add no information. Keep independent properties such
  as "read-only and encrypted"; do not choose one merely to reduce the adjective count.
- **`language-copula` (HIGH): fake-strong verbs.** Prefer "is" and "has" when they are clearer.
  "The app serves as a sponsor-management tool" becomes "The app is a sponsor-management
  tool." Do not invent capabilities to replace a vague description. "Stands as" and "serves as" are
  the usual offenders.
- **`language-contractions` (LOW): unnecessary stiffness.** Prefer contractions when the
  genre allows. "It is," "does not," and "cannot" read stiff in a message or a post; formal
  academic prose may keep the expanded form.
- **`language-negative-parallelism` (HIGH): empty binary contrasts and negative listing.** "This is not
  X. It's Y." / "The question isn't X, it's Y." / "It's not just X but Y." / "Not an X. Not a
  Y. A Z." State the claim directly when the contrast adds no information. Keep meaningful
  exclusions and distinctions: "The failure is in image decoding, not PDF parsing" identifies
  both the failing component and the component ruled out. Do not turn an exclusion into a
  comparative claim such as "Y matters more than X."
- **`language-rule-of-three` (MEDIUM): forced triples.** Do not push ideas into groups of three to
  sound complete. Use the number of items the content actually has.
- **`language-synonym-cycling` (MEDIUM): rotating the clear word.** If the clear word is right,
  repeat it. "The agent reviews the draft. The assistant scores the piece. The tool suggests
  fixes" becomes "The agent reviews the draft, scores it, and suggests fixes" only if all
  three subjects refer to the same agent. Preserve distinct actors and technical terms.
- **`language-false-ranges` (LOW): fake "from X to Y."** Cut the construction when X and Y are not
  part of a meaningful scale, progression, or scope.

### Style

- **`style-em-dash` (MEDIUM): em dash as a rhythm crutch.** Prefer commas, periods, or
  parentheses when they read naturally. Keep an occasional dash when it clarifies the sentence
  or preserves the writer's cadence. Remove repetitive or decorative dashes; do not impose a quota.
- **`style-boldface` (LOW): mechanical bold emphasis.** Reduce bold sprinkled mid-sentence for
  emphasis. Keep bold for skimmable headers and labels the reader genuinely scans.
- **`style-inline-headers` (MEDIUM): mechanical "Header: list" lines.** Keep the pattern when it
  improves skimming, and remove it when a plain sentence reads better. A short section can
  need a heading for navigation, and a short list can help readers compare or scan items.
  Format follows the content, it does not decorate it.
- **`style-title-case` (LOW): unnecessary title case in headings.** Default to sentence case;
  preserve names and follow the publication's house style.
- **`style-emojis` (MEDIUM): decorative emojis.** Remove decoration that does not fit the
  audience or voice. Keep functional symbols with accessible text labels and natural private
  message usage. Follow Miquel's explicit social-media prohibition when writing as him.
- **`style-curly-quotes` (LOW): inconsistent quote formatting.** Follow the publication's
  typography; use straight quotes in code and literal strings. Curly quotes in typeset prose
  are not a defect or evidence of AI authorship.
- **`style-rhythm` (MEDIUM): robotic cadence.** Adjust repetitive sentence and paragraph
  shapes when they make the prose monotonous. Do not manufacture variation in clear lists,
  parallel instructions, or the writer's natural rhythm.

### Communication

- **`comm-artifacts` (HIGH): assistant leftovers.** Remove "I hope this helps!", "Let me know if
  you need anything else", and other scaffolding that belongs to a chat reply rather than the
  document. Preserve a genuine invitation, request, or offer that belongs in the intended message.
- **`comm-cutoff` (HIGH): irrelevant version disclaimers.** Remove assistant boilerplate
  such as "as of my last update" from a document. Keep material dates, source limitations,
  verification gaps, and uncertainty; never make an unverified claim sound current or certain.
- **`comm-sycophantic` (HIGH): empty flattery.** Cut automatic praise and agreement that add
  nothing. Keep sincere, relevant thanks or praise in correspondence.

### Filler

- **`filler-openings` (MEDIUM): throat-clearing and faux-insight setups.** Cut "Here's the thing,"
  "Here's what I mean," "Let me be clear," "I'll be honest," "The uncomfortable truth is,"
  "In today's fast-paced world," "This is the part most people skip," "What most people get
  wrong," "Here's what nobody tells you," "The part everyone misses." These flatter the
  writer as the lone expert before making the point. "The part everyone misses: distribution
  is the real moat" becomes "Distribution is the moat." Keep a personal opening when it
  contributes context or the writer's characteristic tone.
- **`filler-phrases` (MEDIUM): padded connectives.** Shorten the often-empty phrase list
  when the phrase delays the point; keep wording that conveys a relationship or natural cadence.
- **`filler-hedging` (MEDIUM): redundant uncertainty.** Reduce "could potentially possibly"
  without strengthening the claim. Preserve distinct limits such as "may help some users"
  and qualifiers about confidence, scope, conditions, or evidence.
- **`filler-transitions` (MEDIUM): needless signposting.** Reduce "moreover," "furthermore,"
  and "additionally" when the relationship is already clear. Keep connectors that help readers
  follow a comparison, inference, or shift in thought.
- **`filler-conclusions` (MEDIUM): empty or unnecessary endings.** Cut a recap when it merely
  repeats a short message. Keep a useful conclusion or recap in a long explanation, paper,
  or presentation. Replace vague optimism with a supported outcome or next action.

### Voice

- **`voice-soul` (HIGH): lost authorial voice.** Preserve the writer's supplied opinions,
  humor, uncertainty, and cadence when they fit the genre. Do not inject experiences, feelings,
  or opinions to make neutral writing seem personal. Reference prose can remain neutral.

### Patterns with no upstream id

These come from the editing source and have no upstream rule id. Their local impact is
noted beside each pattern. Apply the same contextual test and scoring rules.

- **Colon reveals (Style, MEDIUM).** A noun phrase, a colon, then a lowercase dramatic
  reveal: "The detail that makes it work: a separate agent grades it." "The best part: it
  learns." Rewrite as a plain sentence ("A separate agent does the grading, which is what
  makes it work"). Use colons for lists, labels, and quotes, not fake drama, and prefer
  sentence case after a colon unless grammar, a proper noun, a title, or code requires
  otherwise. Keep a natural colon that introduces an explanation without manufactured drama.
- **Interpretive metadiscourse (Content, HIGH).** Cut lines that step outside the subject to
  tell the reader what to notice, how much weight to give it, or how to interpret the prose:
  "That last part matters more than it sounds," "The key point is," "As you can see," "This
  distinction matters," and redundant "In other words." If the point is clear, delete the
  aside. Otherwise keep a useful explanation or replace empty commentary with supported
  reasoning. Explanatory glosses such as "in other words" can help readers learn.
- **Dramatic fragmentation (Style, MEDIUM).** "X. And Y. And Z." or "That's it. That's the
  whole thing." Combine fragments when the cadence is artificial or unclear; preserve a
  characteristic fragment or deliberate emphasis that works for the reader.
- **Rhetorical setups (Filler, MEDIUM).** "What if I told you…", "Think about it:", "Plot
  twist:", and self-answered "Question? Answer." pairs. Drop empty dramatic setups. Keep
  genuine questions, FAQs, and teaching questions when they serve the requested format.
- **Fake-profound kickers (Content, HIGH).** Cut the final "deep" line when it turns the
  point into an unearned metaphor, aphorism, or mic-drop sentence. Do not replace an empty
  flourish with another. Preserve a distinctive ending that earns its place. Otherwise end
  on a concrete sentence already in the draft. If the ending needs more closure, add a plain
  takeaway or next action supported by the piece.

## Scoring

Optional. Include a score only when requested or when a before/after comparison is the
requested result. This is an editorial heuristic for this checklist, not a validated measure
of quality, authenticity, authorship, or fidelity to Miquel's voice.

Start at 100. Subtract 3 points for each HIGH-impact violation and 1 point for each
MEDIUM-impact violation, using the individual rule impacts above. LOW-impact findings are
advisory and do not lower the score. The minimum is 0: `score = max(0, 100 - 3H - M)`.

Count only occurrences that fail the contextual test. Count each offending passage once,
under the most relevant pattern; if multiple patterns apply, use the highest impact and
note the overlap without another deduction. Count a repeated cadence across several
sentences as one passage, not a penalty per sentence. Explain findings with locations and
reasons, including LOW findings. Never penalize a justified use or optimize prose solely to
increase its score. Compare the same piece before and after; raw counts favor short texts,
so scores across pieces of different lengths or genres are not directly comparable.

For an edit, report before and after. For a requested assessment without rewriting, report
the current text only. Category rows show counts, not separate scores; the example below
has `H=3, M=4` before and `H=0, M=1` after.

```
Category        | Before H/M/L | After H/M/L
----------------|--------------|------------
Content         | 2/0/0        | 0/0/0
Language        | 1/1/1        | 0/0/1
Style           | 0/2/1        | 0/0/1
Communication   | 0/0/0        | 0/0/0
Filler          | 0/1/0        | 0/1/0
Voice           | 0/0/0        | 0/0/0
----------------|--------------|------------
Overall         | 3/4/2        | 0/1/2
Score           | 87           | 99
```

Reading the result (local descriptive bands, not calibrated thresholds):

- 95-100: few deductions under this checklist.
- 85-94: some issues to inspect.
- 70-84: several issues to inspect.
- Below 70: many deductions; inspect length, repeated patterns, and the actual findings.

A high score does not establish that claims are true, useful, or written in the right voice.

## Workflow

1. Read the request and available material; read the full draft when one exists. Identify
   the stage, core point, reader, genre, factual boundaries, and voice traits to preserve.
2. For preparation, shape the idea or outline around supported material and flag important
   gaps. For drafting, compose from that material with the principles above.
3. For detection, inspect contextual problems, return the findings from **Choose the job**,
   and stop. Do not rewrite; include a score only if explicitly requested.
4. For editing, make the minimum effective changes. Preserve useful structure and voice.
5. Check your own output against the constraints and relevant self-check items below.
   Correct substantive failures and re-check; do not keep rewriting justified style choices
   to make every surface pattern disappear.
6. Return the requested ideas, outline, draft, or findings. For an edit, add a short **What
   changed** section when useful or requested, unless the user wants only the finished text.
   Add the optional score report only under **Scoring**. Drafting a response for Miquel's
   review does not require a separate approval; publication or delivery under his name does.

### Self-check

Use the relevant checks at every stage. Apply the same exceptions as the rules above;
this checklist does not turn contextual guidance into bans.

- Does the output serve the requested stage, reader, and purpose without an unnecessary
  request for a draft, clarification, or approval?
- Are factual claims supported and hypothetical illustrations clearly labelled, with no
  invented data, author's opinions, experiences, sources, capabilities, actors, or certainty?
  Are suspected factual errors flagged clearly?
- For an edit, did meaning and coverage survive, including distinct actors, properties,
  exclusions, qualifications, evidence limits, attribution, quotations, and literal strings?
- Are changes proportional to the actual problem, with the writer's distinctive vocabulary,
  cadence, edge, humor, uncertainty, fragments, and useful structure preserved?
- Is agency clear where it matters, without forcing technical subjects or useful passive
  constructions into an invented human action?
- Did you remove empty padding and inflated claims while retaining precise terms, meaningful
  contrasts, useful connectors, explanatory glosses, and genuinely needed recaps?
- Does formatting help the reader and respect house style and the writer's explicit
  boundaries? Are punctuation and rhythm natural without arbitrary quotas or forced variation?
- Does the text sound natural for this writer and reader when read aloud, without forced
  personality, copied signature phrases, or generic flourishes?
- For detection, does each finding quote a contextual problem and suggest a short fix,
  without rewriting, guessing authorship, or adding an unsolicited score? If a score was
  requested, do the counts and arithmetic agree, with overlaps counted once?
