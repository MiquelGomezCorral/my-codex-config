export const stages = [
  {
    id: "first-draft",
    title: "First draft",
    repeated: false,
    steps: [
      ["investigate", "Investigate"],
      ["independent-proposal", "Independent proposal"],
      ["draft", "Draft"],
    ],
  },
  {
    id: "improve-plan",
    title: "Improve plan",
    repeated: false,
    steps: [
      ["questions", "Questions"],
      ["revisions-artifacts", "Revisions and artifacts"],
      ["acceptance", "Acceptance"],
    ],
  },
  {
    id: "challenge-approve",
    title: "Challenge and approve",
    repeated: false,
    steps: [
      ["critique", "Critique"],
      ["resolve-findings", "Resolve findings"],
      ["final-wave", "Final wave"],
      ["approval", "Approval"],
    ],
  },
  {
    id: "prepare-slice",
    title: "Prepare slice",
    repeated: true,
    steps: [
      ["narrow-worker-plan", "Narrow worker plan"],
      ["readiness", "Readiness"],
    ],
  },
  {
    id: "build-review",
    title: "Build and review",
    repeated: true,
    steps: [
      ["implement", "Implement"],
      ["check", "Check"],
      ["review", "Review"],
      ["verify-findings", "Verify findings"],
      ["fix-recheck", "Fix and recheck"],
    ],
  },
  {
    id: "cleanup",
    title: "Cleanup",
    repeated: true,
    steps: [
      ["checkpoint", "Checkpoint"],
      ["audit", "Audit"],
      ["resolve-findings", "Resolve findings"],
    ],
  },
  {
    id: "human-validation",
    title: "Human validation",
    repeated: true,
    steps: [
      ["prepare-evidence-demo", "Prepare evidence and demo"],
      ["await-feedback", "Await feedback"],
    ],
  },
  {
    id: "ship-monitor",
    title: "Ship and monitor",
    repeated: true,
    steps: [
      ["commit-push-pr", "Commit, push, and PR"],
      ["conflicts", "Conflicts"],
      ["ci-feedback", "CI and feedback"],
    ],
  },
  {
    id: "close-wave",
    title: "Close wave",
    repeated: true,
    steps: [
      ["summarize", "Summarize"],
      ["record-unfinished-work", "Record unfinished work"],
    ],
  },
].map((stage) => ({
  ...stage,
  steps: stage.steps.map(([step, title]) => ({ id: `${stage.id}.${step}`, title })),
}))

export const statuses = ["active", "done", "upcoming", "waiting", "blocked", "skipped"]
export const stepById = new Map(stages.flatMap((stage) => stage.steps.map((step) => [step.id, stage])))
export const repeatedStepIds = stages
  .filter((stage) => stage.repeated)
  .flatMap((stage) => stage.steps.map((step) => step.id))
