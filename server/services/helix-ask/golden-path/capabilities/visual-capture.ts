import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA } from "../../../../../shared/helix-visual-frame-evidence";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import { buildGoldenPathCapabilityTerminalPayloadSuccessPayload } from "../capability-terminal-payload-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathVisualCaptureDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathVisualCaptureRequested = (body: RecordLike): boolean => {
  const prompt = readHelixAskGoldenPathPrompt(body);
  if (
    /\bwhat\s+changed\s+since\s+(?:the\s+)?(?:last|previous|prior)\s+(?:scene|epoch|frame|visual|screen|capture)\b/i.test(prompt) ||
    /\b(?:compare|compared|changed|difference|different)\b[\s\S]{0,140}\b(?:last|previous|prior)\s+(?:scene|epoch|frame|visual|screen|capture)\b|\b(?:last|previous|prior)\s+(?:scene|epoch|frame|visual|screen|capture)\b[\s\S]{0,140}\b(?:compare|compared|changed|difference|different|running)\b|\bscene\s+epoch\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    isHelixAskGoldenPathCapabilityNamedInRequest(body, [
      HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
      HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
    ])
  )
    return true;
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
  const context = readHelixAskGoldenPathTurnContext({
    body: args.body,
    now: args.deps.now(),
    fallbackTurnIdPrefix: "ask:golden-visual",
  });
  const { now, createdAtMs, turnId, traceId, sessionId, promptText } = context;
  const threadId = context.threadId ?? "helix-ask:visual";
  const requestedCapability =
    readString(args.body.requested_capability) ??
    readString(args.body.requestedCapability) ??
    readString(args.body.capability) ??
    (/\bimage_lens\.inspect\b/i.test(promptText)
      ? HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY
      : HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY);
  const visualSummary = readVisualCaptureSummary(args.body);
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const observationArtifactId = `${turnId}:visual_frame_evidence`;
  const terminalArtifactId = `${turnId}:situation_context_pack`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "situation_context_pack";
  const goalKind = "visual_capture_describe";

  if (!visualSummary) {
    const failureText =
      "I could not complete this golden-path visual capture turn because no compact visual evidence was provided.";
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
      classifierReasons: ["explicit_visual_capture"],
      requestedCapability,
      selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      sourceTarget: "visual_capture",
      family: "visual_capture",
      requiredObservationKinds: ["visual_frame_evidence", "situation_context_pack"],
      status: "visual_capture_missing_evidence",
      route: "golden_path_runtime / visual_capture",
      errorCode: "missing_compact_visual_evidence",
      brokenRail: "observation",
      missingRequirement: "visual_frame_evidence",
      text: failureText,
      routeGate: "enabled_explicit_request",
      routeGateTerminalEligible: false,
      includeRouteGateGoalHash: false,
      debugStatus: "visual_capture_missing_evidence",
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
  const substitutionApplied = requestedCapability === HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY;
  const situationContextPack = {
    schema: "helix.situation_context_pack.v1",
    artifact_id: terminalArtifactId,
    turn_id: turnId,
    answer_text: answerText,
    visual_frame_evidence_ref: observationArtifactId,
    source_observation_refs: [observationArtifactId],
    terminal_eligible: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return buildGoldenPathCapabilityTerminalPayloadSuccessPayload({
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
    sourceTarget: "visual_capture",
    family: "visual_capture",
    classifierReasons: ["explicit_visual_capture", "golden_path_visual_capture"],
    allowsWorkspaceContext: true,
    requestedCapability,
    selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
    executedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
    observedArtifactKind: "visual_frame_evidence",
    observationPayload: evidence,
    terminalPayload: situationContextPack,
    terminalPayloadProducerItemId: "golden_path_visual_capture_synthesis",
    answerText,
    status: "visual_capture",
    route: "golden_path_runtime / visual_capture",
    requiredObservationKinds: ["visual_frame_evidence", "situation_context_pack"],
    capabilityPlanExtraFields: {
      substitution_rule_applied: substitutionApplied,
      substitution_rule_id: substitutionApplied ? "image_lens.inspect->situation-room.describe_visual_capture" : null,
    },
    solverTraceExtra: {
      substitution_rule_applied: substitutionApplied,
      substitution_rule_id: substitutionApplied ? "image_lens.inspect->situation-room.describe_visual_capture" : null,
    },
    routeGateTerminalEligible: false,
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};

export const requiredObservationKinds = ["visual_frame_evidence"] as const;
export const requiredTerminalKinds = ["visual_capture_answer"] as const;
export const isRequested = isHelixAskGoldenPathVisualCaptureRequested;
export const buildPayload = buildHelixAskGoldenPathVisualCapturePayload;
