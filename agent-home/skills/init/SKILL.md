---
name: init
description: Bootstrap or repair project agent memory files from repository evidence.
---

# Init

Load `agents-memory` and initialize or repair `AGENTS.md` plus `.agents/` memory files
from facts found in the current repository. Preserve existing decisions and unrelated
changes; leave unsupported sections as `None yet.` rather than guessing.
