import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA } from "../../../../../shared/helix-visual-frame-evidence";
import {
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import { buildGoldenPathCapabilityPlan } from "../capability-contract";
import { buildGoldenPathCapabilityDebugMirror } from "../debug-mirror";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathRuntimeStatus } from "../runtime-status";

export type HelixAskGoldenPathVisualCaptureDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathVisualCaptureRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY)) return true;
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY) return true;
  if (requestedCapability === HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body);
  return (
    /\bimage_lens\.inspect\b/i.test(prompt) ||
    /\bsituation-room\.describe_visual_capture\b/i.test(prompt) ||
    (/\b(?:visual capture|visual frame|image lens|screen capture|current screen|visible right now)\b/i.test(prompt) &&
      /\b(?:inspect|describe|review|summarize|what|seeing|visible)\b/i.test(prompt))
  );
};

export const readVisualCaptureSummary = (body: RecordLike): string | null =>
  readString(body.visual_summary) ??
  readString(body.visualSummary) ??
  readString(body.scene_text) ??
  readString(body.sceneText) ??
  readString(readRecord(body.visual_frame_evidence)?.summary) ??
  readString(readRecord(body.visualFrameEvidence)?.summary);


export const buildHelixAskGoldenPathVisualCapturePayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathVisualCaptureDependencies;
}): RecordLike => {
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-visual:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId) ?? "helix-ask:visual";
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const requestedCapability =
    readString(args.body.requested_capability) ??
    readString(args.body.requestedCapability) ??
    readString(args.body.capability) ??
    (/\bimage_lens\.inspect\b/i.test(promptText)
      ? HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY
      : HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY);
  const visualSummary = readVisualCaptureSummary(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:visual_frame_evidence`;
  const terminalArtifactId = `${turnId}:situation_context_pack`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "situation_context_pack";
  const goalKind = "visual_capture_describe";

  if (!visualSummary) {
    const failureText =
      "I could not complete this golden-path visual capture turn because no compact visual evidence was provided.";
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
      classifier_reasons: ["explicit_visual_capture"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: ["visual_frame_evidence"],
      first_broken_rail: "observation",
      assistant_answer: false,
      raw_content_included: false,
    };

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: "missing_compact_visual_evidence",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: buildGoldenPathRuntimeStatus({
        status: "visual_capture_missing_evidence",
        requestedCapability,
        selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executedCapability: null,
        observedArtifactKind: null,
        observedArtifactRef: null,
        terminalArtifactRef: terminalResult.artifact_id,
        terminalResultId,
        routeGate: "enabled_explicit_request",
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCapabilityPlan({
        requestedCapability,
        selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executedCapability: null,
        sourceTarget: "visual_capture",
        family: "visual_capture",
        requiredObservationKinds: ["visual_frame_evidence", "situation_context_pack"],
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      ...buildGoldenPathTerminalAuthorityProjection({
        terminalResult,
        route: "golden_path_runtime / visual_capture",
        completedSolverPath: false,
        firstBrokenRail: "observation",
      }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        routeAuthorityOk: true,
        terminalAuthorityOk: true,
        goalSatisfaction: "not_satisfied",
        requestedCapability,
        selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executedCapability: null,
        observedArtifactKind: null,
        observedArtifactRef: null,
        terminalArtifactKind: "typed_failure",
        firstBrokenRail: "observation",
        terminalErrorCode: "missing_compact_visual_evidence",
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
          requestedCapability,
        }),
        buildGoldenPathPayloadLedgerArtifact({
          artifactId: terminalResult.artifact_id,
          turnId,
          createdAtMs,
          kind: "typed_failure",
          terminalEligible: true,
          payload: {
            schema: "helix.typed_failure.v1",
            text: failureText,
            answer_text: failureText,
            terminal_error_code: "missing_compact_visual_evidence",
            first_broken_rail: "observation",
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        }),
      ],
      debug: buildGoldenPathCapabilityDebugMirror({
        status: "visual_capture_missing_evidence",
        privateRuntimeLoopEntered: false,
        requestedCapability,
        selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executedCapability: null,
        terminalResult,
        firstBrokenRail: "observation",
        terminalErrorCode: "missing_compact_visual_evidence",
        goalSatisfactionEvaluation,
      }),
    };
  }

  const detectedObjects = readStringArray(args.body.detected_objects ?? args.body.detectedObjects);
  const detectedRelations = readStringArray(args.body.detected_scene_relations ?? args.body.detectedSceneRelations);
  const uncertainty = readStringArray(args.body.uncertainty);
  const sourceId = readString(args.body.source_id) ?? readString(args.body.sourceId) ?? "golden_path_visual_capture";
  const frameId = readString(args.body.frame_id) ?? readString(args.body.frameId) ?? `${turnId}:visual_frame`;
  const evidence = {
    schema: HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA,
    frame_id: frameId,
    evidence_id: observationArtifactId,
    source_id: sourceId,
    thread_id: threadId,
    ts: now.toISOString(),
    image_model: readString(args.body.image_model) ?? readString(args.body.imageModel) ?? "golden_path_compact_visual_evidence",
    model_invoked: true,
    summary: visualSummary,
    detected_objects: detectedObjects,
    detected_scene_relations: detectedRelations,
    uncertainty,
    supports_claims: [],
    raw_image_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
  const answerText = [
    "Visual capture compact evidence was inspected.",
    `Summary: ${visualSummary}`,
    detectedObjects.length > 0 ? `Detected objects: ${detectedObjects.slice(0, 8).join(", ")}.` : "Detected objects: none provided.",
    detectedRelations.length > 0 ? `Scene relations: ${detectedRelations.slice(0, 6).join(", ")}.` : "Scene relations: none provided.",
    uncertainty.length > 0 ? `Uncertainty: ${uncertainty.slice(0, 4).join(", ")}.` : "Uncertainty: none provided.",
    "This is compact visual evidence; no raw image is included or promoted as answer authority.",
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "runtime_evidence",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_visual_capture", "golden_path_visual_capture"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = args.deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = args.deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult = buildGoldenPathTerminalResult({
    resultId: terminalResultId,
    artifactId: terminalArtifactId,
    artifactKind: requiredTerminalKind,
    finalAnswerSource: requiredTerminalKind,
    text: answerText,
    supportRefs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
  });
  const substitutionApplied = requestedCapability === HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY;
  const situationContextPack = {
    schema: "helix.situation_context_pack.v1",
    artifact_id: terminalArtifactId,
    turn_id: turnId,
    answer_text: answerText,
    visual_frame_evidence_ref: observationArtifactId,
    source_observation_refs: [observationArtifactId],
    support_refs: terminalResult.support_refs,
    terminal_eligible: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: buildGoldenPathRuntimeStatus({
      status: "visual_capture",
      requestedCapability,
      selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      observedArtifactKind: "visual_frame_evidence",
      observedArtifactRef: observationArtifactId,
      terminalArtifactRef: terminalArtifactId,
      terminalResultId,
      legacyFallbackPossibleWhenUnhandled: true,
      routeGate: "enabled_explicit_request",
    }),
    canonical_goal_frame: canonicalGoalFrame,
    visual_frame_evidence: evidence,
    situation_context_pack: situationContextPack,
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability,
      selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      sourceTarget: "visual_capture",
      family: "visual_capture",
      extraFields: {
        substitution_rule_applied: substitutionApplied,
        substitution_rule_id: substitutionApplied ? "image_lens.inspect->situation-room.describe_visual_capture" : null,
      },
      requiredObservationKinds: ["visual_frame_evidence", "situation_context_pack"],
      requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: "golden_path_runtime / visual_capture",
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability,
      selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      observedArtifactKind: "visual_frame_evidence",
      observedArtifactRef: observationArtifactId,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
        substitution_rule_applied: substitutionApplied,
        substitution_rule_id: substitutionApplied ? "image_lens.inspect->situation-room.describe_visual_capture" : null,
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
    }),
    current_turn_artifact_ledger: [
      buildGoldenPathRouteGateLedgerArtifact({
        artifactId: routeGateArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        terminalEligible: false,
        requestedCapability,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: observationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        producerItemId: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        kind: "visual_frame_evidence",
        payload: evidence,
      }),
      buildGoldenPathPayloadLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId,
        createdAtMs,
        terminalEligible: true,
        goalHash,
        producerItemId: "golden_path_visual_capture_synthesis",
        kind: requiredTerminalKind,
        payload: situationContextPack,
      }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      status: "visual_capture",
      privateRuntimeLoopEntered: false,
      requestedCapability,
      selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      observedArtifactKind: "visual_frame_evidence",
      observedArtifactRef: observationArtifactId,
      terminalResult,
      goalSatisfactionEvaluation,
    }),
  };
};

export const requiredObservationKinds = ["visual_frame_evidence"] as const;
export const requiredTerminalKinds = ["visual_capture_answer"] as const;
export const isRequested = isHelixAskGoldenPathVisualCaptureRequested;
export const buildPayload = buildHelixAskGoldenPathVisualCapturePayload;
