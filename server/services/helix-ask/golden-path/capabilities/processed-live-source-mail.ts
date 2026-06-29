import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA } from "../../../../../shared/contracts/stage-play-live-source-mail.v1";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathProcessedLiveSourceMailDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathProcessedLiveSourceMailRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityNamedInRequest(body, [HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    /\bread[_\s-]?processed[_\s-]?live[_\s-]?source[_\s-]?mail\b/.test(prompt) ||
    /\bprocessed\s+live[-\s]?source\s+mail\b/.test(prompt)
  );
};

export const readProcessedMailPacketInput = (body: RecordLike): RecordLike | null =>
  readRecord(body.processed_mail_packet) ??
  readRecord(body.processedMailPacket) ??
  readRecord(body.stage_play_processed_mail_packet) ??
  readRecord(body.stagePlayProcessedMailPacket) ??
  null;

export const readProcessedMailPacketStringArray = (packet: RecordLike, camelKey: string, snakeKey: string): string[] =>
  readStringArray(packet[camelKey] ?? packet[snakeKey]);

export const buildProcessedMailPacketPayload = (args: {
  body: RecordLike;
  turnId: string;
  createdAtMs: number;
}): RecordLike | null => {
  const input = readProcessedMailPacketInput(args.body);
  if (!input) return null;
  const packetId =
    readString(input.packetId) ??
    readString(input.packet_id) ??
    readString(input.artifactId) ??
    readString(input.artifact_id) ??
    `${args.turnId}:stage_play_processed_mail_packet`;
  const evidenceRefs = readProcessedMailPacketStringArray(input, "evidenceRefs", "evidence_refs");
  return {
    artifactId: "stage_play_processed_mail_packet",
    schemaVersion: STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA,
    packetId,
    jobId: readString(input.jobId) ?? readString(input.job_id) ?? `${args.turnId}:live_source_job`,
    sourceId: readString(input.sourceId) ?? readString(input.source_id) ?? "golden_path_compact_mail_source",
    mailIds: readProcessedMailPacketStringArray(input, "mailIds", "mail_ids"),
    observedFacts: readProcessedMailPacketStringArray(input, "observedFacts", "observed_facts"),
    inferredFacts: readProcessedMailPacketStringArray(input, "inferredFacts", "inferred_facts"),
    uncertainties: readProcessedMailPacketStringArray(input, "uncertainties", "uncertainties"),
    sceneTags: readProcessedMailPacketStringArray(input, "sceneTags", "scene_tags"),
    visualEvidenceRefs: readProcessedMailPacketStringArray(input, "visualEvidenceRefs", "visual_evidence_refs"),
    recommendedNext: readString(input.recommendedNext) ?? readString(input.recommended_next) ?? "inspect_if_needed",
    watchNext: readProcessedMailPacketStringArray(input, "watchNext", "watch_next"),
    resolutionState: readString(input.resolutionState) ?? readString(input.resolution_state) ?? "processed",
    microReasonerRunRefs: readProcessedMailPacketStringArray(input, "microReasonerRunRefs", "micro_reasoner_run_refs"),
    evidenceRefs: evidenceRefs.length ? evidenceRefs : [packetId],
    createdAt: readString(input.createdAt) ?? new Date(args.createdAtMs).toISOString(),
    assistant_answer: false,
    terminal_eligible: false,
  };
};


export const buildHelixAskGoldenPathProcessedLiveSourceMailPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathProcessedLiveSourceMailDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-processed-mail",
    });
  const packetPayload = buildProcessedMailPacketPayload({ body: args.body, turnId, createdAtMs });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const observationArtifactId = readString(packetPayload?.packetId) ?? `${turnId}:stage_play_processed_mail_packet`;
  const terminalArtifactId = `${turnId}:model_synthesized_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "model_synthesized_answer";
  const goalKind = "processed_live_source_mail_read";

  if (!packetPayload) {
    const failureText =
      "I could not complete this golden-path Ask turn because no processed live-source mail packet was provided.";
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
      goalKind,
      canonicalGoalFrameExtra: {
        allows_workspace_context: false,
        allows_prior_artifacts: false,
      },
      classifierReasons: ["explicit_processed_live_source_mail_request"],
      requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      sourceTarget: "live_source_mailbox",
      family: "live_environment",
      requiredObservationKinds: ["stage_play_processed_mail_packet"],
      status: "processed_live_source_mail_missing_packet",
      route: "golden_path_runtime / processed_live_source_mail",
      errorCode: "missing_processed_live_source_mail_packet",
      brokenRail: "observation",
      missingRequirement: "stage_play_processed_mail_packet",
      text: failureText,
      routeGate: "enabled_explicit_request",
      includeRouteGateGoalHash: false,
      debugStatus: "processed_live_source_mail_missing_packet",
      debugPrivateRuntimeLoopEntered: false,
      debugTerminalResultCount: 1,
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
      includeTerminalErrorCodeInSolverTrace: true,
      includeFirstBrokenRailInTerminalAuthority: true,
      useTerminalErrorLedgerArtifact: true,
      hashGoalFrame: args.deps.hashGoalFrame,
    });
  }

  const observedFacts = readStringArray(packetPayload.observedFacts);
  const inferredFacts = readStringArray(packetPayload.inferredFacts);
  const uncertainties = readStringArray(packetPayload.uncertainties);
  const recommendedNext = readString(packetPayload.recommendedNext) ?? "inspect_if_needed";
  const answerText = [
    `Processed live-source mail packet read: ${observationArtifactId}.`,
    observedFacts.length ? `Observed facts: ${observedFacts.join("; ")}.` : "Observed facts: none supplied.",
    inferredFacts.length ? `Inferred facts: ${inferredFacts.join("; ")}.` : "Inferred facts: none supplied.",
    uncertainties.length ? `Uncertainties: ${uncertainties.join("; ")}.` : "Uncertainties: none supplied.",
    `Recommended next: ${recommendedNext}.`,
  ].join("\n");

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
    sourceTarget: "live_source_mailbox",
    family: "live_environment",
    classifierReasons: ["explicit_processed_live_source_mail_request"],
    allowsWorkspaceContext: false,
    requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
    observedArtifactKind: "stage_play_processed_mail_packet",
    observationPayload: packetPayload,
    terminalPayloadField: "model_synthesized_answer",
    terminalPayloadSchema: "helix.model_synthesized_answer.v1",
    answerText,
    status: "processed_live_source_mail",
    route: "golden_path_runtime / processed_live_source_mail",
    requiredObservationKinds: ["stage_play_processed_mail_packet"],
    includeRouteGatePromptText: false,
    includeRouteGateGoalSatisfactionEvaluation: false,
    additionalTopLevelFields: ({ goalSatisfactionArtifact }) => ({
      model_turn_input: {
        schema: "helix.ask_model_turn_input.v1",
        turn_id: turnId,
        prompt_text: promptText,
        available_capabilities: [HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY],
        function_call_outputs: [
          {
            call_id: `${turnId}:call:read_processed_live_source_mail`,
            name: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
            output_ref: observationArtifactId,
            output_kind: "stage_play_processed_mail_packet",
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

export const requiredObservationKinds = ["stage_play_processed_mail_packet"] as const;
export const requiredTerminalKinds = ["model_synthesized_answer"] as const;
export const isRequested = isHelixAskGoldenPathProcessedLiveSourceMailRequested;
export const buildPayload = buildHelixAskGoldenPathProcessedLiveSourceMailPayload;
