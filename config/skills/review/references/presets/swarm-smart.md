# Swarm-smart preset

Run the existing adaptive swarm, then route its report and the same head, base, goal,
complete approved plan and amendments in workflow context, scope, and exclusions to one
fresh configured review coordinator for independent verification and
synthesis. Mark the primary review `Review mode: swarm` with its normalized `Swarm models`;
mark the verifier `Review mode: direct` and omit `Swarm models`. Route it through
`super-agent`, which resolves the catalog role entry and any approved explicit route, then
pin the resolved harness, model, and thinking. The verifier
loads `review-findings`, checks every retained
claim against source evidence, classifies scope, and returns only verified findings with
the `references/code-review.md` output
contract.

The verifier is read-only and does not delegate. Never launch it while authoring or
testing this skill. If `--ocr` was explicit, the primary
review has already run it; pass the verifier `OCR mode: disabled` so it verifies reported
OCR claims without rerunning the helper. This preset does not enable Slopo or live
validation.
