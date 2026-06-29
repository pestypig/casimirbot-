import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  buildGoldenPathTypedFailureTerminalErrorLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathCapabilityGoalSatisfactionEvaluation,
  buildGoldenPathCapabilityPlan,
} from "../capability-contract";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityDebugMirror } from "../debug-mirror";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTypedFailureResponseProjection,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathRuntimeStatus } from "../runtime-status";

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
    const terminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "runtime_evidence",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_civilization_bounds_reflection_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
      turnId,
      goalKind,
      requiredTerminalKind,
      satisfaction: "not_satisfied",
      selectedTerminalArtifactKind: "typed_failure",
      missingRequirements: ["helix_civilization_bounds_tool_result"],
      firstBrokenRail: "observation",
    });

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      ...buildGoldenPathTypedFailureResponseProjection({
        terminalResult,
        terminalErrorCode: "missing_civilization_bounds_tool_result",
      }),
      golden_path_runtime: buildGoldenPathRuntimeStatus({
        status: "civilization_bounds_reflection_missing_result",
        requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        executedCapability: null,
        observedArtifactKind: null,
        observedArtifactRef: null,
        terminalArtifactRef: terminalResult.artifact_id,
        terminalResultId,
        routeGate: "enabled_explicit_request",
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCapabilityPlan({
        requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        sourceTarget: "civilization_bounds",
        family: "civilization_bounds",
        executedCapability: null,
        requiredObservationKinds: ["helix_civilization_bounds_tool_result"],
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      ...buildGoldenPathTerminalAuthorityProjection({
        terminalResult,
        route: "golden_path_runtime / civilization_bounds_reflection",
        completedSolverPath: false,
        firstBrokenRail: "observation",
      }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        routeAuthorityOk: true,
        terminalAuthorityOk: true,
        goalSatisfaction: "not_satisfied",
        requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        executedCapability: null,
        observedArtifactKind: null,
        observedArtifactRef: null,
        terminalArtifactKind: "typed_failure",
        firstBrokenRail: "observation",
        terminalErrorCode: "missing_civilization_bounds_tool_result",
        extra: {
          solver_risk_flags: [],
          solver_short_circuit_flags: [],
        },
      }),
      current_turn_artifact_ledger: [
        buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          terminalEligible: false,
          requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        }),
        buildGoldenPathTypedFailureTerminalErrorLedgerArtifact({
          artifactId: terminalResult.artifact_id,
          turnId,
          createdAtMs,
          terminalResult,
          terminalErrorCode: "missing_civilization_bounds_tool_result",
          firstBrokenRail: "observation",
          includeSupportRefs: true,
        }),
      ],
      debug: buildGoldenPathCapabilityDebugMirror({
        status: "civilization_bounds_reflection_missing_result",
        privateRuntimeLoopEntered: false,
        requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        executedCapability: null,
        terminalResult,
        firstBrokenRail: "observation",
        terminalErrorCode: "missing_civilization_bounds_tool_result",
        goalSatisfactionEvaluation,
      }),
    };
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
