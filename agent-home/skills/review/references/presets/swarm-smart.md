# Swarm-smart preset

Run the existing adaptive swarm, then route its report and the same head, base, goal,
complete approved plan and amendments in workflow context, scope, and exclusions to one
fresh configured review coordinator for independent verification and
synthesis. Mark the primary review `Review mode: swarm` with its normalized `Swarm models`;
mark the verifier `Review mode: direct` and omit `Swarm models`. Use the default Pi/`high`
route and catalog-selected model from the review skill, or an approved explicit route. The verifier
loads `review-findings`, checks every retained
claim against source evidence, classifies scope, and returns only verified findings with
the `code-review` output contract.

The verifier is read-only and does not delegate. Never launch it while authoring or
testing this skill; it is future workflow behavior. If `--ocr` was explicit, the primary
review has already run it; pass the verifier `OCR mode: disabled` so it verifies reported
OCR claims without rerunning the helper. This preset does not enable Slopo or live
validation.
