import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import { buildHelixReflectionObservationLayers } from "../reflection-answer-guidance";
import { buildGoldenPathPromptCivilizationBoundsToolResult } from "../reflection-prompt-evidence";

export type HelixAskGoldenPathCivilizationBoundsReflectionDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathCivilizationBoundsReflectionRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityNamedInRequest(body, [HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    /\b(?:civilization\s+bounds|civilization\s+roadmap|bounded\s+civilization|collaboration\s+constraints|capacity\s+bounds|system\s+limits)\b/.test(prompt)
  );
};


export const readCompactCivilizationBoundsToolResult = (body: RecordLike): RecordLike | null => {
  const direct =
    readRecord(body.civilization_bounds_tool_result) ??
    readRecord(body.civilizationBoundsToolResult) ??
    readRecord(body.helix_civilization_bounds_tool_result) ??
    readRecord(body.helixCivilizationBoundsToolResult);
  if (direct) return direct;
  const roadmap = readRecord(body.civilization_bounds_roadmap) ?? readRecord(body.civilizationBoundsRoadmap);
  return roadmap ? { roadmap } : null;
};


export const buildHelixAskGoldenPathCivilizationBoundsReflectionPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathCivilizationBoundsReflectionDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-civilization-bounds",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const observationArtifactId = `${turnId}:helix_civilization_bounds_tool_result`;
  const terminalArtifactId = `${turnId}:civilization_bounds_reflection_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "civilization_bounds_reflection_answer";
  const goalKind = "civilization_bounds_reflection";
  const compactResult =
    readCompactCivilizationBoundsToolResult(args.body) ??
    buildGoldenPathPromptCivilizationBoundsToolResult(promptText);
  const roadmap = readRecord(compactResult?.roadmap);

  if (!compactResult || !roadmap) {
    const failureText =
      "I could not complete this golden-path civilization-bounds turn because no compact civilization-bounds tool result was provided.";
    return buildGoldenPathCapabilityTypedFailurePayload({
      turnId,
      traceId,
      sessionId,
      threadId,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      answerScope: "runtime_evidence",
      goalKind,
      classifierReasons: ["explicit_civilization_bounds_reflection_request"],
      requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      sourceTarget: "civilization_bounds",
      family: "civilization_bounds",
      requiredObservationKinds: ["helix_civilization_bounds_tool_result"],
      status: "civilization_bounds_reflection_missing_result",
      route: "golden_path_runtime / civilization_bounds_reflection",
      errorCode: "missing_civilization_bounds_tool_result",
      brokenRail: "observation",
      missingRequirement: "helix_civilization_bounds_tool_result",
      text: failureText,
      routeGate: "enabled_explicit_request",
      routeGateTerminalEligible: false,
      includeRouteGateGoalHash: false,
      debugStatus: "civilization_bounds_reflection_missing_result",
      debugPrivateRuntimeLoopEntered: false,
      observedArtifactKind: null,
      observedArtifactRef: null,
      terminalArtifactRef: `${turnId}:typed_failure`,
      terminalResultIdInRuntimeStatus: terminalResultId,
      completedSolverPath: false,
      goalSatisfaction: "not_satisfied",
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      solverTraceExtra: {
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
      includeGoalSatisfactionInDebug: true,
      includeLedgerSupportRefs: true,
      includeTerminalErrorCodeInSolverTrace: true,
      includeFirstBrokenRailInTerminalAuthority: true,
      useTerminalErrorLedgerArtifact: true,
      hashGoalFrame: args.deps.hashGoalFrame,
    });
  }

  const roadmapId =
    readString(roadmap.roadmapId) ?? readString(roadmap.roadmap_id) ?? "civilization-bounds:compact";
  const title = readString(roadmap.title) ?? "Civilization Bounds Roadmap";
  const badges = readArray(roadmap.badges);
  const systems = readArray(roadmap.systems);
  const collaborationBounds = readArray(roadmap.collaborationBounds ?? roadmap.collaboration_bounds);
  const missingEvidence = readStringArray(roadmap.missingEvidence ?? roadmap.missing_evidence);
  const bridgeContext = readRecord(compactResult.bridgeContext ?? compactResult.bridge_context);
  const evidenceRefs = [roadmapId, ...missingEvidence].filter((ref): ref is string => ref.length > 0).slice(0, 8);
  const reflectionLayers = buildHelixReflectionObservationLayers({
    promptText,
    selectedNodes: [roadmap, ...systems.slice(0, 4), ...badges.slice(0, 4), ...collaborationBounds.slice(0, 4)],
    locatorRationale:
      "The civilization-bounds roadmap was selected because the turn asks how possibility is constrained by capacity, materials, fairness, and review gates.",
    supportRefs: evidenceRefs,
    constraintsIntroduced: [
      "Treat the idea as a bounded scenario or hypothesis, not as feasibility proof.",
      "Capacity, material inventory, fairness, and review ownership bound any actionable claim.",
      "Review gates must remain explicit before stronger authority is granted.",
    ],
    missingEvidence,
    practicalFraming:
      "Use the roadmap to explain what the scenario may explore, what evidence is missing, and what must stay conditional.",
    allowedClaims: [
      "The idea can be explored as a bounded scenario.",
      "Civilization constraints determine what would need evidence before action.",
    ],
    conditionalClaims: [
      "Actionability is conditional on capacity measurements, material inventory, fairness analysis, and review ownership.",
    ],
    blockedClaims: [
      "Do not claim feasibility.",
      "Do not claim implementation readiness.",
      "Do not claim policy, prediction, moral, or execution authority from this receipt.",
    ],
    reasoningMoves: [
      "Name the located roadmap.",
      "State the constraints introduced by the roadmap.",
      "Separate allowed exploration from blocked feasibility claims.",
      "Ask for the next missing evidence item.",
    ],
    suggestedAnswerShape: [
      "Start by framing the idea as a bounded hypothesis.",
      "Explain the roadmap constraints in plain language.",
      "List the evidence still missing.",
      "Give the next review or evidence step.",
    ],
    wordingGuidance:
      "Use direct prose about constraints and evidence gaps; avoid reporting only system, badge, or bound counts.",
    compoundHandoffNotes: {
      docs: "Retrieve sources for the missing evidence hooks before strengthening claims.",
      calculator: "Only compute scalar quantities named by the capacity or material evidence.",
      reflection: "Use these bounds as claim limits for any later ideology or theory reflection.",
    },
  });
  const answerText = [
    `The reflection locates the prompt in ${title} (${roadmapId}), so it treats the idea as a bounded hypothesis rather than proof.`,
    "The allowed claim is that the scenario can be explored under civilization constraints: capacity, material inventory, fairness, and explicit review ownership.",
    missingEvidence.length > 0
      ? `What is still missing: ${missingEvidence.slice(0, 3).join(", ")}.`
      : "No explicit missing evidence hooks were supplied, so the answer should keep feasibility and readiness conditional.",
    "It cannot grant prediction, policy, moral, execution, or implementation authority.",
  ]
    .filter((line): line is string => typeof line === "string" && line.length > 0)
    .join("\n");
  const civilizationBoundsReceipt = {
    schema: "helix_civilization_bounds_tool_result.v1",
    kind: "helix_civilization_bounds_tool_result",
    tool_id: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    roadmap,
    bridgeContext,
    evidence_refs: evidenceRefs,
    ...reflectionLayers,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };

  return buildGoldenPathCapabilitySuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    observationArtifactId,
    terminalArtifactId,
    terminalResultId,
    requiredTerminalKind,
    goalKind,
    answerScope: "runtime_evidence",
    sourceTarget: "civilization_bounds",
    family: "civilization_bounds",
    planArgs: { roadmap_id: roadmapId, title },
    classifierReasons: ["explicit_civilization_bounds_reflection_request"],
    allowsWorkspaceContext: false,
    includeWorkspaceContextFields: false,
    requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    observedArtifactKind: "helix_civilization_bounds_tool_result",
    observationPayload: civilizationBoundsReceipt,
    terminalPayloadField: "civilization_bounds_reflection_answer",
    terminalPayloadSchema: "helix.civilization_bounds_reflection_answer.v1",
    terminalPayloadExtra: { roadmap_id: roadmapId, title },
    answerText,
    status: "civilization_bounds_reflection",
    route: "golden_path_runtime / civilization_bounds_reflection",
    requiredObservationKinds: ["helix_civilization_bounds_tool_result"],
    routeGateTerminalEligible: false,
    includeRouteGatePromptText: false,
    answerLedgerExtraPayload: {
      roadmap_id: roadmapId,
      title,
      answer_guidance: reflectionLayers.answer_guidance,
    },
    additionalTopLevelFields: ({ goalSatisfactionArtifact }) => ({
      model_turn_input: {
        schema: "helix.ask_model_turn_input.v1",
        turn_id: turnId,
        prompt_text: promptText,
        available_capabilities: [HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY],
        function_call_outputs: [
          {
            call_id: `${turnId}:call:civilization_bounds_reflection`,
            name: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
            output_ref: observationArtifactId,
            output_kind: "helix_civilization_bounds_tool_result",
          },
        ],
        model_visible_artifacts: [observationArtifactId, goalSatisfactionArtifact.artifact_id],
        loop_policy: {
          max_model_steps: 1,
          private_runtime_loop_entered: false,
        },
        assistant_answer: false,
        raw_content_included: false,
      },
    }),
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};

export const requiredObservationKinds = ["helix_civilization_bounds_tool_result"] as const;
export const requiredTerminalKinds = ["civilization_bounds_reflection_answer"] as const;
export const isRequested = isHelixAskGoldenPathCivilizationBoundsReflectionRequested;
export const buildPayload = buildHelixAskGoldenPathCivilizationBoundsReflectionPayload;
