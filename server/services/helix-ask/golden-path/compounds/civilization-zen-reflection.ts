import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathObservationLedgerArtifact } from "../artifact-ledger";
import { readCompactCivilizationBoundsToolResult } from "../capabilities/civilization-bounds-reflection";
import { readCompactZenGraphReflectionToolResult } from "../capabilities/zen-graph-reflection";
import {
  buildGoldenPathCompoundCapabilityContract,
  isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested,
} from "../compound-contract";
import { buildGoldenPathCompoundTypedFailurePayload } from "../compound-failure";
import { buildGoldenPathCompoundSuccessPayload } from "../compound-success";
import {
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathCivilizationBoundsZenReflectionCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = [
  "helix_civilization_bounds_tool_result",
  "helix_zen_graph_reflection_tool_result",
] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    observation_kind: "helix_civilization_bounds_tool_result",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
    observation_kind: "helix_zen_graph_reflection_tool_result",
  },
] as const;
export const isRequested = isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested;
export const buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathCivilizationBoundsZenReflectionCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-civilization-zen:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const civilizationObservationArtifactId = `${turnId}:helix_civilization_bounds_tool_result`;
  const zenObservationArtifactId = `${turnId}:helix_zen_graph_reflection_tool_result`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const civilizationResult = readCompactCivilizationBoundsToolResult(args.body);
  const roadmap = readRecord(civilizationResult?.roadmap);
  const zenResult = readCompactZenGraphReflectionToolResult(args.body);
  const reflection = readRecord(zenResult?.reflection);

  const makeFailurePayload = (params: {
    errorCode: "missing_civilization_bounds_tool_result" | "missing_zen_graph_reflection_tool_result";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    return buildGoldenPathCompoundTypedFailurePayload({
      turnId,
      traceId,
      sessionId,
      threadId,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      classifierReasons: ["explicit_civilization_bounds_zen_reflection_compound_request"],
      hashGoalFrame: deps.hashGoalFrame,
      status: "civilization_bounds_zen_reflection_compound_failed",
      route: "golden_path_runtime / civilization_bounds_zen_reflection_compound",
      requiredObservationKinds,
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
    });
  };

  if (!civilizationResult || !roadmap) {
    return makeFailurePayload({
      errorCode: "missing_civilization_bounds_tool_result",
      missingRequirement: "helix_civilization_bounds_tool_result",
      text: "I could not complete this golden-path civilization-bounds/reflection turn because no compact civilization-bounds evidence was provided.",
    });
  }
  if (!zenResult || !reflection) {
    return makeFailurePayload({
      errorCode: "missing_zen_graph_reflection_tool_result",
      missingRequirement: "helix_zen_graph_reflection_tool_result",
      text: "I could not complete this golden-path civilization-bounds/reflection turn because no compact zen graph reflection evidence was provided.",
    });
  }

  const roadmapId =
    readString(roadmap.roadmapId) ?? readString(roadmap.roadmap_id) ?? "civilization-bounds:compact";
  const title = readString(roadmap.title) ?? "Civilization Bounds Roadmap";
  const systems = readArray(roadmap.systems);
  const badges = readArray(roadmap.badges);
  const collaborationBounds = readArray(roadmap.collaborationBounds ?? roadmap.collaboration_bounds);
  const civilizationMissingEvidence = readStringArray(roadmap.missingEvidence ?? roadmap.missing_evidence);
  const civilizationBridgeContext = readRecord(civilizationResult.bridgeContext ?? civilizationResult.bridge_context);
  const civilizationEvidenceRefs = [roadmapId, ...civilizationMissingEvidence]
    .filter((ref): ref is string => ref.length > 0)
    .slice(0, 8);
  const reflectionId =
    readString(reflection.reflectionId) ?? readString(reflection.artifactId) ?? "ideology_context_reflection";
  const input = readRecord(reflection.input);
  const inputSummary = readString(input?.summary) ?? readString(input?.text) ?? promptText;
  const activatedTraits = readArray(reflection.activated_traits ?? reflection.activatedTraits);
  const tensions = readArray(reflection.tensions);
  const recommendedActions = readArray(
    reflection.recommended_actions ?? reflection.recommendedActions ?? zenResult.recommendedActions,
  );
  const proceduralClassification = readRecord(zenResult.proceduralClassification ?? zenResult.procedural_classification);
  const proceduralClassifications = readArray(proceduralClassification?.classifications);
  const locator = readRecord(zenResult.locator);
  const locatorMatches = readArray(locator?.matches ?? locator?.badges ?? locator?.paths);
  const fruition = readRecord(zenResult.fruition);
  const admissions = readArray(zenResult.admissions);
  const zenRefs = readStringArray(input?.refs).length > 0 ? readStringArray(input?.refs) : readStringArray(args.body.refs);
  const zenEvidenceRefs = [reflectionId, ...zenRefs].filter((ref): ref is string => ref.length > 0).slice(0, 8);
  const civilizationReceipt = {
    schema: "helix_civilization_bounds_tool_result.v1",
    kind: "helix_civilization_bounds_tool_result",
    tool_id: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    roadmap,
    bridgeContext: civilizationBridgeContext,
    evidence_refs: civilizationEvidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  const zenReceipt = {
    schema: "helix_zen_graph_reflection_tool_result.v1",
    kind: "helix_zen_graph_reflection_tool_result",
    tool_id: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
    reflection,
    proceduralClassification,
    locator,
    fruition,
    admissions,
    evidence_refs: zenEvidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "civilization_bounds",
        requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        args: { roadmap_id: roadmapId, title },
        observationKind: "helix_civilization_bounds_tool_result",
        observationRef: civilizationObservationArtifactId,
        terminalContributionKind: "civilization_bounds_reflection_answer",
      },
      {
        subgoalIdSuffix: "zen_graph_reflection",
        requestedCapability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        args: { reflection_id: reflectionId, input_summary: inputSummary },
        observationKind: "helix_zen_graph_reflection_tool_result",
        observationRef: zenObservationArtifactId,
        terminalContributionKind: "ideology_context_reflection_answer",
      },
    ],
  });
  const answerText = [
    "Compound civilization-bounds/reflection synthesis completed.",
    `Civilization roadmap: ${title} (${roadmapId})`,
    `Roadmap evidence: systems ${systems.length}, badges ${badges.length}, collaboration bounds ${collaborationBounds.length}.`,
    `Ideology reflection: ${reflectionId}`,
    `Reflection evidence: activated lenses ${activatedTraits.length}, tensions ${tensions.length}, recommended actions ${recommendedActions.length}.`,
    `Procedural classifications: ${proceduralClassifications.length}; badge locator matches: ${locatorMatches.length}.`,
    "Both receipts are evidence-only; synthesis is terminal authority only after the civilization-bounds and ideology-reflection subgoals are satisfied.",
  ].join("\n");
  return buildGoldenPathCompoundSuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    terminalResultId,
    terminalArtifactId,
    requiredTerminalKind,
    classifierReasons: ["explicit_civilization_bounds_zen_reflection_compound_request"],
    includeWorkspaceContextFields: true,
    hashGoalFrame: deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: deps.buildGoalSatisfactionEvaluationArtifact,
    answerText,
    supportArtifactRefs: [civilizationObservationArtifactId, zenObservationArtifactId],
    status: "civilization_bounds_zen_reflection_compound",
    route: "golden_path_runtime / civilization_bounds_zen_reflection_compound",
    observedArtifactRef: civilizationObservationArtifactId,
    requiredObservationKinds,
    observationFields: {
      helix_civilization_bounds_tool_result: civilizationReceipt,
      helix_zen_graph_reflection_tool_result: zenReceipt,
    },
    observationLedgerArtifacts: ({ goalHash }) => [
      buildGoldenPathObservationLedgerArtifact({
        artifactId: civilizationObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "helix_civilization_bounds_tool_result",
        producerItemId: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        terminalEligible: false,
        payload: civilizationReceipt,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: zenObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "helix_zen_graph_reflection_tool_result",
        producerItemId: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        terminalEligible: false,
        payload: zenReceipt,
      }),
    ],
    compoundCapabilityContract,
    routeGateTerminalEligible: false,
    includeRouteGatePromptText: false,
  });
};
export const buildPayload = buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload;
