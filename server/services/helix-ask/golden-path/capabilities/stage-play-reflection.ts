import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
  readBoolean,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathStagePlayReflectionDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathStagePlayReflectionRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY) ||
    /\b(?:reflect_stage_play_context|stage\s*play\s*badge\s*graph|live\s+interpretation|stage\s*play\s+reflection|stage_play_reflection_result)\b/.test(
      prompt,
    )
  );
};

export const readCompactStagePlayReflectionResult = (body: RecordLike): RecordLike | null => {
  const direct =
    readRecord(body.stage_play_reflection_result) ??
    readRecord(body.stagePlayReflectionResult) ??
    readRecord(body.stage_play_reflection_tool_result) ??
    readRecord(body.stagePlayReflectionToolResult);
  if (direct) return direct;
  const observation = readRecord(body.live_environment_tool_observation) ?? readRecord(body.liveEnvironmentToolObservation);
  if (observation) {
    const nested = readRecord(observation.observation);
    if (readString(nested?.schema) === "stage_play_reflection_result/v1") return nested;
    if (readString(observation.schema) === "stage_play_reflection_result/v1") return observation;
  }
  const graph = readRecord(body.stage_play_badge_graph) ?? readRecord(body.stagePlayBadgeGraph);
  return graph ? { schema: "stage_play_reflection_result/v1", graph } : null;
};

export const buildHelixAskGoldenPathStagePlayReflectionPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathStagePlayReflectionDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-stage-play-reflection",
    });
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:stage_play_reflection_result`;
  const terminalArtifactId = `${turnId}:stage_play_reflection_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "stage_play_reflection_answer";
  const goalKind = "stage_play_reflection";
  const observation = readCompactStagePlayReflectionResult(args.body);

  const makeFailurePayload = (): RecordLike => {
    const failureText =
      "I could not complete this golden-path Stage Play reflection turn because no compact Stage Play reflection result was provided.";
    return buildGoldenPathCapabilityTypedFailurePayload({
      turnId,
      traceId,
      sessionId,
      threadId,
      ok: true,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      goalKind,
      canonicalGoalFrameExtra: {
        allows_workspace_context: true,
        allows_prior_artifacts: false,
      },
      classifierReasons: ["explicit_stage_play_reflection_request"],
      requestedCapability: HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
      sourceTarget: "stage_play",
      family: "live_environment",
      requiredObservationKinds: ["stage_play_reflection_result"],
      status: "stage_play_reflection_missing_result",
      route: "golden_path_runtime / stage_play_reflection",
      errorCode: "missing_stage_play_reflection_result",
      brokenRail: "observation",
      missingRequirement: "stage_play_reflection_result",
      text: failureText,
      terminalArtifactId,
      routeGate: "enabled_explicit_request",
      routeGateTerminalEligible: false,
      includeRouteGateGoalSatisfactionArtifact: true,
      debugStatus: "stage_play_reflection_missing_result",
      debugPrivateRuntimeLoopEntered: false,
      debugTerminalResultCount: 1,
      includeFirstBrokenRailInDebug: false,
      observedArtifactKind: null,
      observedArtifactRef: null,
      terminalArtifactRef: terminalArtifactId,
      terminalResultIdInRuntimeStatus: terminalResultId,
      completedSolverPath: false,
      goalSatisfaction: "not_satisfied",
      goalSatisfactionRepairTarget: "stage_play_reflection_input",
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      solverTraceExtra: {
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
      includeGoalSatisfactionInDebug: true,
      includeTerminalErrorCodeInSolverTrace: true,
      includeFirstBrokenRailInTerminalAuthority: true,
      useTerminalErrorLedgerArtifact: true,
      includeGoalHashInTerminalErrorLedger: true,
      buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
      hashGoalFrame: args.deps.hashGoalFrame,
    });
  };

  if (!observation) return makeFailurePayload();

  const graph = readRecord(observation.graph) ?? {};
  const liveAnswerProjection =
    readRecord(observation.liveAnswerProjection) ?? readRecord(observation.live_answer_projection) ?? {};
  const debugReceipt = readRecord(observation.debugReceipt) ?? readRecord(observation.debug_receipt) ?? {};
  const checkpointFreshness =
    readRecord(debugReceipt.checkpointFreshness) ?? readRecord(debugReceipt.checkpoint_freshness) ?? {};
  const graphId =
    readString(debugReceipt.graphId) ??
    readString(debugReceipt.graph_id) ??
    readString(graph.graphId) ??
    readString(graph.graph_id) ??
    "stage_play_badge_graph:compact";
  const sourceRefs = readStringArray(debugReceipt.sourceRefs ?? debugReceipt.source_refs);
  const projectedLineKeys = readStringArray(
    liveAnswerProjection.projectedLineKeys ?? liveAnswerProjection.projected_line_keys,
  );
  const changedLineKeys = readStringArray(liveAnswerProjection.changedLineKeys ?? liveAnswerProjection.changed_line_keys);
  const skippedLineKeys = readStringArray(liveAnswerProjection.skippedLineKeys ?? liveAnswerProjection.skipped_line_keys);
  const checkpointOnlySkipped = readStringArray(
    liveAnswerProjection.checkpointOnlySkipped ??
      liveAnswerProjection.checkpoint_only_skipped ??
      debugReceipt.checkpointOnlySkipped ??
      debugReceipt.checkpoint_only_skipped,
  );
  const projected = readBoolean(liveAnswerProjection.projected) === true;
  const reason = readString(liveAnswerProjection.reason);
  const checkpointReviewed =
    readBoolean(checkpointFreshness.reviewed) ?? readBoolean(checkpointFreshness.modelReviewed) ?? false;
  const missingEvidence = readStringArray(
    graph.missingEvidence ?? graph.missing_evidence ?? debugReceipt.missingEvidence ?? debugReceipt.missing_evidence,
  );
  const projectedKeys = projectedLineKeys.length ? projectedLineKeys : changedLineKeys;
  const evidenceRefs = [graphId, ...sourceRefs].filter((ref, index, refs) => refs.indexOf(ref) === index).slice(0, 8);
  const stagePlayReceipt = {
    schema: "stage_play_reflection_result/v1",
    kind: "stage_play_reflection_result",
    tool_id: HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
    graph,
    liveAnswerProjection,
    debugReceipt,
    projected,
    reason,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerText = [
    "Stage Play reflection completed.",
    `Graph: ${graphId}.`,
    projected
      ? `Projected live interpretation: ${projectedKeys.length ? projectedKeys.join(", ") : "projection selected"}.`
      : `No live interpretation projection was selected${reason ? ` (${reason})` : ""}.`,
    skippedLineKeys.length ? `Skipped lines: ${skippedLineKeys.join(", ")}.` : null,
    checkpointOnlySkipped.length ? `Checkpoint-only skipped lines: ${checkpointOnlySkipped.join(", ")}.` : null,
    `Checkpoint reviewed: ${checkpointReviewed ? "true" : "false"}.`,
    missingEvidence.length ? `Missing evidence: ${missingEvidence.join(", ")}.` : null,
    "The Stage Play graph and projection are evidence-only; this answer is a synthesis summary and did not start capture, request checkpoints, or execute world actions.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

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
    sourceTarget: "stage_play",
    family: "live_environment",
    classifierReasons: ["explicit_stage_play_reflection_request"],
    allowsWorkspaceContext: true,
    requestedCapability: HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
    observedArtifactKind: "stage_play_reflection_result",
    observationPayload: stagePlayReceipt,
    terminalPayloadField: "stage_play_reflection_answer",
    terminalPayloadSchema: "helix.stage_play_reflection_answer.v1",
    terminalPayloadExtra: { graph_id: graphId },
    answerText,
    status: "stage_play_reflection",
    route: "golden_path_runtime / stage_play_reflection",
    requiredObservationKinds: ["stage_play_reflection_result"],
    routeGateTerminalEligible: false,
    includeRouteGatePromptText: false,
    includeRouteGateGoalSatisfactionEvaluation: false,
    additionalSupportRefs: sourceRefs,
    answerLedgerExtraPayload: {
      graph_id: graphId,
    },
    additionalTopLevelFields: ({ goalSatisfactionArtifact }) => ({
      model_turn_input: {
        schema: "helix.ask_model_turn_input.v1",
        turn_id: turnId,
        prompt_text: promptText,
        available_capabilities: [HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY],
        function_call_outputs: [
          {
            call_id: `${turnId}:call:reflect_stage_play_context`,
            name: HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
            output_ref: observationArtifactId,
            output_kind: "stage_play_reflection_result",
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


export const requiredObservationKinds = ["stage_play_reflection_result"] as const;
export const requiredTerminalKinds = ["stage_play_reflection_answer"] as const;
export const isRequested = isHelixAskGoldenPathStagePlayReflectionRequested;
export const buildPayload = buildHelixAskGoldenPathStagePlayReflectionPayload;
