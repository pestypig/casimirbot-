import { describe, expect, it } from "vitest";
import { loadIdeologyGraphFromFile } from "../load-ideology-graph";
import { reflectWithMoralGraphToolV1 } from "../moral-graph-reflection-tool";
import { buildMoralGraphDebugTraceViewV1 } from "../moral-graph-debug-trace";

const debugRequest = {
  reflectionId: "moral-graph-reflection:debug-snapshot",
  loopDepth: 0,
  sourceKind: "user_text" as const,
  inputKind: "user_prompt" as const,
  text: "Use direct observation, right speech, and non-harm to reflect on an uncertain conflict.",
  refs: ["turn:debug-snapshot"],
  requestedPresetIds: ["moral.preset.wisdom.default"],
  options: {
    includeTrace: true,
    includeRecommendedActions: true,
    includeAdmissions: true,
  },
};

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

describe("MoralGraph debug trace view", () => {
  it("builds a stable structured debug view without raw prompt text or private reasoning", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const response = reflectWithMoralGraphToolV1(graph, debugRequest);
    const view = buildMoralGraphDebugTraceViewV1({
      response,
      routeId: "route:debug-snapshot",
      validationIssues: [],
    });
    const compact = {
      artifactId: view.artifactId,
      schemaVersion: view.schemaVersion,
      source: view.source,
      activatedBadgeIds: uniqueSorted(view.activatedBadges.map((badge) => badge.badgeId)),
      matchedNodeIds: uniqueSorted(view.matchedIdeologyNodes.map((match) => match.nodeId)),
      directObservationPath: view.pathsToRoot.find((path) => path.nodeId === "direct-observation-before-claim"),
      rightSpeechPath: view.pathsToRoot.find((path) => path.nodeId === "right-speech-and-accurate-formulation"),
      objectiveTraceSteps: view.objectiveBinding.trace.map((step) => step.step),
      presetOverlaySubjectKinds: view.presetOverlays.map((overlay) => overlay.subjectKind),
      missingEvidence: view.missingEvidence,
      recommendedActionTypes: view.recommendedActions.map((action) => action.type),
      admissionDecisions: view.admissionDecisions.map((decision) => ({
        actionId: decision.actionId,
        admission: decision.admission,
        risk: decision.risk,
        displayPolicy: decision.displayPolicy,
        agentExecutable: decision.agentExecutable,
      })),
      antiPoisonLoop: view.antiPoisonLoop,
      exposurePolicy: view.exposurePolicy,
    };

    expect(compact).toEqual({
      artifactId: "moral_graph_debug_trace",
      schemaVersion: "moral_graph_debug_trace/v1",
      source: {
        inputKind: "user_prompt",
        sourceKind: "user_text",
        sourceTrust: "primary",
        refs: ["turn:debug-snapshot"],
      },
      activatedBadgeIds: [
        "dignified-exit-design",
        "direct-observation-before-claim",
        "falsifiability-and-truth-convergence",
        "harm-weighted-priority-standard",
        "lawful-interface-protocol",
        "no-bypass-guardrail",
        "non-harm-and-compassionate-constraint",
        "right-speech-and-accurate-formulation",
        "right-speech-infrastructure",
        "skillful-mediation",
        "wisdom-first-principles",
      ],
      matchedNodeIds: [
        "dignified-exit-design",
        "direct-observation-before-claim",
        "falsifiability-and-truth-convergence",
        "harm-weighted-priority-standard",
        "lawful-interface-protocol",
        "no-bypass-guardrail",
        "non-harm-and-compassionate-constraint",
        "right-speech-and-accurate-formulation",
        "right-speech-infrastructure",
        "skillful-mediation",
        "wisdom-first-principles",
      ],
      directObservationPath: {
        nodeId: "direct-observation-before-claim",
        pathToRoot: ["direct-observation-before-claim", "wisdom-first-principles"],
      },
      rightSpeechPath: {
        nodeId: "right-speech-and-accurate-formulation",
        pathToRoot: ["right-speech-and-accurate-formulation", "wisdom-first-principles"],
      },
      objectiveTraceSteps: ["resolve_situation_locator"],
      presetOverlaySubjectKinds: ["wisdom_preset"],
      missingEvidence: {
        reflection: [],
        objectiveBinding: [],
      },
      recommendedActionTypes: ["highlight_ideology_lens", "show_path_to_root", "show_nearby_safeguard"],
      admissionDecisions: [
        {
          actionId: "moral-graph.highlight_ideology_lens",
          admission: "auto",
          risk: "claim_sensitive",
          displayPolicy: "diagnostic_only",
          agentExecutable: false,
        },
        {
          actionId: "moral-graph.show_path_to_root",
          admission: "auto",
          risk: "claim_sensitive",
          displayPolicy: "diagnostic_only",
          agentExecutable: false,
        },
        {
          actionId: "moral-graph.show_nearby_safeguard",
          admission: "auto",
          risk: "claim_sensitive",
          displayPolicy: "diagnostic_only",
          agentExecutable: false,
        },
      ],
      antiPoisonLoop: {
        reflectionId: "moral-graph-reflection:debug-snapshot",
        loopDepth: 0,
        sourceKind: "user_text",
        sourceTrust: "primary",
        continuityOnly: false,
        confirmationEligible: true,
        confidenceCap: 1,
      },
      exposurePolicy: {
        structuredTraceOnly: true,
        rawInputIncluded: false,
        hiddenChainOfThoughtIncluded: false,
        assistantAnswer: false,
      },
    });

    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain(debugRequest.text);
    expect(serialized).not.toMatch(/chain.of.thought|private reasoning|hidden agent state/i);
  });

  it("surfaces anti-poison metadata for lower-trust assistant summaries", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const response = reflectWithMoralGraphToolV1(graph, {
      ...debugRequest,
      reflectionId: "moral-graph-reflection:debug-assistant-summary",
      sourceKind: "assistant_summary",
      loopDepth: 1,
      text: "Assistant summary: the user may be dealing with a conflict.",
    });
    const view = buildMoralGraphDebugTraceViewV1({ response });

    expect(view.antiPoisonLoop).toMatchObject({
      reflectionId: "moral-graph-reflection:debug-assistant-summary",
      loopDepth: 1,
      sourceKind: "assistant_summary",
      sourceTrust: "low_trust",
      continuityOnly: false,
      confirmationEligible: false,
      confidenceCap: 0.55,
    });
    expect(view.missingEvidence.objectiveBinding.map((entry) => entry.id)).toContain(
      "primary_user_or_workstation_evidence",
    );
    expect(view.exposurePolicy.hiddenChainOfThoughtIncluded).toBe(false);
  });
});
