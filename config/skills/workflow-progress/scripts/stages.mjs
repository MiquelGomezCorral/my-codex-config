// Stage chips for the progress page; icons come from the shared workflow icon catalog.
const planningChip = { label: "Planning", color: "#8ab4f8", icon: "clipboard-list" }

export const stages = [
  {
    id: "first-draft",
    title: "First draft",
    repeated: false,
    chip: planningChip,
    steps: [
      ["grill-me", "Grill me"],
      ["investigate", "Investigate"],
      ["independent-proposal", "Independent proposal"],
      ["live-validation", "How and who live validates it"],
      ["draft", "Draft"],
    ],
  },
  {
    id: "improve-plan",
    title: "Improve plan",
    repeated: false,
    chip: planningChip,
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
    chip: planningChip,
    steps: [
      ["slice-gates", "Slice gates"],
      ["critique", "Critique"],
      ["resolve-findings", "Resolve findings"],
      ["final-wave", "Final wave"],
      ["live-test-set", "Live test set"],
      ["approval", "Approval"],
    ],
  },
  {
    id: "prepare-slice",
    title: "Prepare slice",
    repeated: true,
    chip: { label: "Preparing", color: "#6fd3c7", icon: "file-text" },
    steps: [
      ["narrow-worker-plan", "Narrow worker plan"],
      ["readiness", "Readiness"],
    ],
  },
  {
    id: "build-review",
    title: "Build and review",
    repeated: true,
    chip: { label: "Coding · review · live test", color: "#b79cf2", icon: "server" },
    steps: [
      ["implement", "Implement"],
      ["check", "Check"],
      ["review", "Review"],
      ["live-test", "Live test"],
      ["verify-findings", "Verify findings"],
      ["fix-recheck", "Fix and recheck"],
    ],
  },
  {
    id: "cleanup",
    title: "Cleanup",
    repeated: true,
    chip: { label: "Cleanup", color: "#e6c27b", icon: "shield-check" },
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
    chip: { label: "On human review", color: "#f5a97f", icon: "users" },
    steps: [
      ["prepare-evidence-demo", "Prepare evidence and demo"],
      ["await-feedback", "Await feedback"],
    ],
  },
  {
    id: "ship-monitor",
    title: "Ship and monitor",
    repeated: true,
    chip: { label: "Shipping", color: "#8fd694", icon: "git-branch" },
    steps: [
      ["commit-push-pr", "Commit, push, and PR"],
      ["conflicts", "Conflicts"],
      ["ci-feedback", "CI and feedback"],
    ],
  },
  {
    id: "close-wave",
    title: "Close wave",
    repeated: false,
    chip: { label: "Closing wave", color: "#a3a8b0", icon: "network" },
    steps: [
      ["regression", "Wave regression"],
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
export const waveStages = stages.filter((stage) => !stage.repeated)
export const deliveryStages = stages.filter((stage) => stage.repeated)
export const repeatedStepIds = deliveryStages.flatMap((stage) => stage.steps.map((step) => step.id))
export const waveStepIds = waveStages.flatMap((stage) => stage.steps.map((step) => step.id))
export const doneSliceChip = { label: "Done", color: "#9a9ea6", icon: "circle-check" }
