# Ship and PR

Use the `git` skill for every Git action and follow its authority section. The approved plan
must name each action, target, and bound; after the human accepts the presented result, do
not request that same Git authorization again. A checkpoint alone does not authorize an
unlisted push. Do not infer an unlisted merge.

For a dependent slice, base its worktree on the predecessor PR's accepted head after its
reviews, required CI, and human gates pass. While the predecessor is unmerged, target its
branch so the child PR shows only the new slice. After the predecessor merges, reconcile
the target and rerun affected checks and reviews. Do not rebase or rewrite history.

Record PR, target, CI, review, and completion state in local progress. Resolve review
feedback through the affected coding and validation gates; a change that alters the
presented result returns to the human before newly required shipping actions.
Route merge-conflict resolution through `git-worker`; rerun affected checks and review.
If the resolved behavior differs from what the human accepted, or cannot be established,
present it again before shipping proceeds.
