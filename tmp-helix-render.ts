import { __testHelixAskReliabilityGuards } from "./server/routes/agi.plan";
const question = "What is a warp bubble in this codebase?";
const queryConstraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
const turnContract = __testHelixAskReliabilityGuards.buildHelixAskTurnContract({
  question,
  intentDomain: "repo",
  requiresRepoEvidence: true,
  queryConstraints,
  equationPrompt: false,
  definitionFocus: true,
  equationIntentContract: null,
  plannerMode: "deterministic",
  plannerValid: true,
  plannerSource: "test",
});
const rendered = __testHelixAskReliabilityGuards.buildDeterministicFamilyRepoRuntimeFallback({
  question,
  family: "definition_overview",
  intentDomain: "repo",
  queryConstraints,
  equationPrompt: false,
  definitionFocus: true,
  equationIntentContract: null,
  selectorPrimaryKey: null,
  selectorLocked: false,
  selectorFamily: null,
  lockIdSeed: "ask:test",
  allowedCitations: [
    "docs/knowledge/warp/warp-bubble.md",
    "modules/warp/natario-warp.ts",
    "modules/warp/warp-module.ts",
    "server/energy-pipeline.ts"
  ],
  contextFiles: [
    "docs/knowledge/warp/warp-bubble.md",
    "modules/warp/natario-warp.ts",
    "modules/warp/warp-module.ts",
    "server/energy-pipeline.ts"
  ],
  turnContract,
  slotCoverageRatio: 0.5,
  slotMissing: ["mechanism", "failure-path"],
  connectedHintPathCount: 12,
  retrievalConfidence: 0.8,
  objectiveSupport: [],
  existingText: "In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints.",
});
console.log(rendered);
