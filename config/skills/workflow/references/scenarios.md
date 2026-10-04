# Scenario definitions

These are static workflow scenarios for non-live contract checks. Their expected outcomes
are requirements, not results from paired agent runs or a live application trial. Both
remain pending separate authorization.

## Small localized fix

- **Setup:** one reproducible, narrow bug; one slice; brief planning is explicitly
  appropriate; no live action is needed.
- **Expected:** keep the plan short, record `small` in the approved plan, send the work
  directly to one retained coder, implement and verify one slice, then present the result
  before any named shipping action.
- **Must not:** infer live validation, create a worktree without authorization, skip review
  evidence because the task is small, or claim completion from unit tests alone.

## Unclear live-test route

- **Setup:** a change whose real behavior cannot yet be reached or judged with the tools
  at hand, and the user has not described how to test it.
- **Expected:** treat the undefined live test as a planning blocker, ask the user how to
  exercise the real behavior end to end, and record the concrete `Flow`, `Expected`, and
  `Can run` route before locking scope.
- **Must not:** finalize the plan on unit tests, assume the flow, invent a live route, or
  claim the change works because small tests pass.

## Dependent two-slice feature

- **Setup:** slice B depends on the accepted head of slice A; A's PR is still unmerged.
- **Expected:** work sequentially, give each slice one worktree, start B from A's accepted
  PR head after A's reviews, CI, and human gates pass, target A's branch for B's PR, and
  verify B's PR contains only B's slice.
- **Must not:** start B from A's working tree, require a merge before B, or run independent
  slices in parallel without asking.

## Interrupted slice with mixed findings

- **Setup:** a slice is interrupted with incomplete required evidence, one false-positive
  review claim, one out-of-scope observation, and a cleanup simplification that regresses
  accepted behavior.
- **Expected:** label unavailable evidence blocked/unverified; verify and reject the false
  positive; record but exclude the out-of-scope observation; correct all verified in-scope
  P0-P3 findings by priority; return the cleanup regression to coding with the checkpoint
  intact; escalate after two unsuccessful rounds for the same unresolved issue; reconcile
  progress against the selected lifecycle and Git before resuming.
- **Must not:** convert missing evidence into a defect or approval, edit for the out-of-scope
  observation, discard the checkpoint, or report the interrupted slice complete.
