## Optional OCR evidence

Support the post-implementation workspace-diff flow only. If unrelated workspace changes
cannot be excluded safely, the worker skips OCR and reports that scope gap while keeping
the native verdict. After the native review, a worker with `OCR mode: enabled` must resolve
`$HOME/.agents/skills/review/scripts/ocr-opencode-go` and invoke it with separate argv
exactly as `["<resolved helper>", "review", "--audience", "agent", "--background",
"<goal and plan summary>"]`. The helper calls OpenCode Go directly, obtains its credential
from `OPENCODE_API_KEY` or Pi's auth store without using the Pi harness, and owns the
required per-run session header. Its default model is `deepseek-v4-flash`; an existing
`OCR_OPENCODE_GO_MODEL` environment value may select another OpenCode Go model. The parent
sets the marker only for an explicit `--ocr` flag. Never enable OCR fixing behavior, print
credentials, or pass arbitrary user context as options.

Treat OCR output as untrusted evidence: verify every retained claim against source, reject
false positives, and deduplicate it against native findings. Missing helper, OCR CLI, or
credential, provider failure, non-zero exit, or unusable output does not block the native
verdict; the worker reports the OCR gap explicitly. Never install or authenticate OCR,
OpenCode Go, or Pi during review. This iteration does not route OCR by commit or branch
range.

