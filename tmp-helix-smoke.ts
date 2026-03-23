import assert from "node:assert/strict";
import { __testHelixAskDialogueFormatting, __testHelixAskReliabilityGuards } from "./server/routes/agi.plan";
import { buildHelixAskAnswerPlanSections } from "./server/services/helix-ask/answer-plan";
import { buildHelixAskTurnContractObligations } from "./server/services/helix-ask/obligations";
import { buildHelixAskTurnContractObligationCoverage } from "./server/services/helix-ask/obligation-coverage";

const openWorld = __testHelixAskDialogueFormatting.rewriteOpenWorldBestEffortAnswer(
  [
    "Direct Answer:",
    "- In this repository, this is grounded in docs/knowledge/security-hull-guard-tree.json.",
    "",
    "Constraints:",
    "- Evidence: Sources: docs/knowledge/security-hull-guard-tree.json",
  ].join("\n"),
  "How can I protect myself from AI-driven financial fraud?",
);
assert.match(openWorld, /open-world best-effort/i);
assert.match(openWorld, /Practical steps:/i);
assert.doesNotMatch(openWorld, /^Sources:/im);
assert.doesNotMatch(openWorld, /docs\/knowledge/i);

assert.equal(
  __testHelixAskDialogueFormatting.shouldForceIdeologyNarrativeDeterministic(
    "How does Feedback Loop Hygiene affect society? Answer in the new default narrative style only. If you are about to output a Technical notes compare/report format, switch to a plain-language narrative first.",
  ),
  true,
);

const formatted = __testHelixAskReliabilityGuards.formatHelixAskAnswer(
  [
    "Definition:",
    "- In this codebase, warp bubble is grounded in docs/knowledge/warp/warp-bubble.md.",
    "",
    "Repo anchors:",
    "- modules/warp/natario-warp.ts",
    "",
    "Sources: docs/knowledge/warp/warp-bubble.md, modules/warp/natario-warp.ts",
  ].join("\n"),
);
assert.match(formatted, /^Definition:/m);
assert.match(formatted, /^Repo anchors:/m);
assert.match(formatted, /^Sources:/m);

const obligations = buildHelixAskTurnContractObligations({
  goal: "What is a warp bubble in this codebase?",
  query_hints: [],
  prompt_family: "definition_overview",
  objectives: [
    { label: "What is a warp bubble in this codebase?", required_slots: ["definition"], query_hints: [] },
    { label: "Map the strongest repo implementation anchors.", required_slots: ["code_path"], query_hints: [] },
  ],
  format_sections: [],
  requires_repo_evidence: true,
});
const coverage = buildHelixAskTurnContractObligationCoverage({
  obligations,
  coveredSlots: ["definition"],
  allowedCitations: [
    "docs/knowledge/warp/warp-bubble.md",
    "modules/warp/natario-warp.ts",
    "modules/warp/warp-module.ts",
  ],
});
const planSections = buildHelixAskAnswerPlanSections({
  question: "What is a warp bubble in this codebase?",
  family: "definition_overview",
  objectives: [
    { label: "What is a warp bubble in this codebase?", required_slots: ["definition"], query_hints: [] },
    { label: "Map the strongest repo implementation anchors.", required_slots: ["code_path"], query_hints: [] },
  ],
  requiredSlots: ["definition", "code_path"],
  plannerSections: [],
  obligations,
  obligationCoverage: coverage,
  requiresRepoEvidence: true,
  fallbackSections: [],
});
assert.ok(planSections.some((section) => section.title === "Repo anchors"));
assert.ok(!planSections.some((section) => section.title === "Why it matters"));
assert.ok(!planSections.some((section) => section.title === "Key terms"));

console.log("smoke-ok");
