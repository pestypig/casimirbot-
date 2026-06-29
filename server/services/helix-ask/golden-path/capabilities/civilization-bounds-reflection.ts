import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathCivilizationBoundsReflectionDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathCivilizationBoundsReflectionRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) ||
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
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-civilization-bounds:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:helix_civilization_bounds_tool_result`;
  const terminalArtifactId = `${turnId}:civilization_bounds_reflection_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "civilization_bounds_reflection_answer";
  const goalKind = "civilization_bounds_reflection";
  const compactResult = readCompactCivilizationBoundsToolResult(args.body);
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
  const answerText = [
    "Civilization bounds reflection completed.",
    `Roadmap: ${title} (${roadmapId})`,
    `Systems: ${systems.length}; badges: ${badges.length}; collaboration bounds: ${collaborationBounds.length}.`,
    missingEvidence.length > 0 ? `Missing evidence hooks: ${missingEvidence.slice(0, 3).join(", ")}.` : null,
    "The civilization-bounds receipt is evidence-only; this answer is a synthesis summary and does not grant prediction, policy, moral, or execution authority.",
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
    assistant_answer: false,
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
