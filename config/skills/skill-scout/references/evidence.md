# What the measurements say

These are the reasons this skill defaults to no. Numbers are as reported by the sources
below; re-read the primary papers before quoting them in anything published.

## SWE-Skills-Bench

*SWE-Skills-Bench: Do Agent Skills Actually Help in Real-World Software Engineering?*
<https://arxiv.org/abs/2603.15401>

- 49 public software-engineering skills were tested.
- **39 of 49 produced zero pass-rate improvement.**
- The average gain across the set was about **+1.2%**.
- Token overhead ranged from modest savings to a **+451%** increase.

**What it means here:** the base rate is bad. A randomly chosen public skill is more likely
to change nothing than to help, and it can multiply context cost. Every candidate starts at
"skip" until the usefulness gate in `SKILL.md` gives a reason to keep it.

## SkillsBench

*SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks*
<https://arxiv.org/abs/2602.12670v1>. The self-generated finding is in version 1; the
current version of the abstract no longer mentions it.

- Curated skills help significantly but **inconsistently** across tasks.
- **Self-generated skills gave no benefit.**

**What it means here:** selection is the whole game, and the effort belongs in curation
rather than authoring. Prefer an existing vetted skill over writing one. Curated, tested,
third-party skills are the ones with measured value.

## Loading rate

A study of 34,000 real skills (<https://arxiv.org/abs/2604.04323>, reported by
[The Decoder](https://the-decoder.com/agent-skills-look-great-in-benchmarks-but-fall-apart-under-realistic-conditions-researchers-find/))
found that in the hardest retrieval setting Claude loaded a skill in only **16% of runs**.
Other models differed: Kimi K2.5 loaded skills in 86% of runs in the curated setting.

**What it means here:** a skill that is never loaded is worthless no matter how good its
content is. That is why `vetting.md` includes a reachability check: the name and directory
must match, the frontmatter must parse, and the description must actually trigger on the
user's phrasing. In a harness that grants skills per role, a skill granted to no role is dead
weight.

## How this changes a scout's behavior

1. Default to no, and require the usefulness gate to flip it.
2. Prefer curated and externally used skills over newly authored ones.
3. Verify the skill is reachable by the role that will use it, not merely present on disk.
4. Always report the context cost alongside the claimed benefit.
5. Never let popularity stand in for evidence.
