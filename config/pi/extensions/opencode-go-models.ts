import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"

// Owner of the OpenCode Go model allowlist. The ocr-go helper keeps its own copy of these ids
// in config/skills/review/scripts/ocr-opencode-go; change both together.
const OPENCODE_GO_ALLOWED_MODELS = ["deepseek-v4.1-flash", "glm-5.3-flash"]

export default function (pi: ExtensionAPI) {
  pi.on("before_provider_request", (_event, ctx) => {
    const model = ctx.model
    if (model?.provider !== "opencode-go" || OPENCODE_GO_ALLOWED_MODELS.includes(model.id)) return
    // Pi reports a throw from this hook but still sends the request, so abort the run first:
    // the provider SDKs reject an already-aborted signal before any network call.
    ctx.abort()
    throw new Error(
      `Model ${model.id} is not allowed on OpenCode Go (allowed: ${OPENCODE_GO_ALLOWED_MODELS.join(", ")}). ` +
        "Edit OPENCODE_GO_ALLOWED_MODELS in config/pi/extensions/opencode-go-models.ts and restart Pi.",
    )
  })
}
