import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA } from "../../../../../shared/contracts/stage-play-live-source-mail.v1";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathCapabilityGoalSatisfactionEvaluation,
  buildGoldenPathCapabilityPlan,
} from "../capability-contract";
import { buildGoldenPathCapabilityDebugMirror } from "../debug-mirror";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readRecord,
  readString,
  readStringArray,
  type HelixAskGoldenPathRuntimeTerminalResult,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTerminalResponseProjection,
  buildGoldenPathTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathRuntimeStatus } from "../runtime-status";

export type HelixAskGoldenPathProcessedLiveSourceMailDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathProcessedLiveSourceMailRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY) ||
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
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-processed-mail:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const packetPayload = buildProcessedMailPacketPayload({ body: args.body, turnId, createdAtMs });
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = readString(packetPayload?.packetId) ?? `${turnId}:stage_play_processed_mail_packet`;
  const terminalArtifactId = `${turnId}:model_synthesized_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "model_synthesized_answer";
  const goalKind = "processed_live_source_mail_read";

  if (!packetPayload) {
    const failureText =
      "I could not complete this golden-path Ask turn because no processed live-source mail packet was provided.";
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
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      allows_workspace_context: false,
      allows_prior_artifacts: false,
      classifier_reasons: ["explicit_processed_live_source_mail_request"],
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
      missing_requirements: ["stage_play_processed_mail_packet"],
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
      terminal_error_code: "missing_processed_live_source_mail_packet",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: buildGoldenPathRuntimeStatus({
        status: "processed_live_source_mail_missing_packet",
        requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executedCapability: null,
        observedArtifactKind: null,
        observedArtifactRef: null,
        terminalArtifactRef: terminalResult.artifact_id,
        terminalResultId,
        routeGate: "enabled_explicit_request",
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCapabilityPlan({
        requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        sourceTarget: "live_source_mailbox",
        family: "live_environment",
        executedCapability: null,
        requiredObservationKinds: ["stage_play_processed_mail_packet"],
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      ...buildGoldenPathTerminalAuthorityProjection({
        terminalResult,
        route: "golden_path_runtime / processed_live_source_mail",
        completedSolverPath: false,
        firstBrokenRail: "observation",
      }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        routeAuthorityOk: true,
        terminalAuthorityOk: true,
        goalSatisfaction: "not_satisfied",
        requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executedCapability: null,
        observedArtifactKind: null,
        observedArtifactRef: null,
        terminalArtifactKind: "typed_failure",
        firstBrokenRail: "observation",
        terminalErrorCode: "missing_processed_live_source_mail_packet",
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
          requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
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
            terminal_error_code: "missing_processed_live_source_mail_packet",
            first_broken_rail: "observation",
            assistant_answer: false,
            raw_content_included: false,
          },
        }),
      ],
      debug: buildGoldenPathCapabilityDebugMirror({
        status: "processed_live_source_mail_missing_packet",
        privateRuntimeLoopEntered: false,
        requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executedCapability: null,
        terminalResult,
        terminalResultCount: 1,
        terminalErrorCode: "missing_processed_live_source_mail_packet",
        goalSatisfactionEvaluation,
      }),
    };
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
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_processed_live_source_mail_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
    turnId,
    goalKind,
    requiredTerminalKind,
  });
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

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    ...buildGoldenPathTerminalResponseProjection({ terminalResult }),
    golden_path_runtime: buildGoldenPathRuntimeStatus({
      status: "processed_live_source_mail",
      requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      observedArtifactKind: "stage_play_processed_mail_packet",
      observedArtifactRef: observationArtifactId,
      terminalArtifactRef: terminalArtifactId,
      terminalResultId,
      legacyFallbackPossibleWhenUnhandled: true,
      routeGate: "enabled_explicit_request",
    }),
    canonical_goal_frame: canonicalGoalFrame,
    stage_play_processed_mail_packet: packetPayload,
    model_synthesized_answer: {
      schema: "helix.model_synthesized_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
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
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      sourceTarget: "live_source_mailbox",
      family: "live_environment",
      requiredObservationKinds: ["stage_play_processed_mail_packet"],
      requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: "golden_path_runtime / processed_live_source_mail",
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      observedArtifactKind: "stage_play_processed_mail_packet",
      observedArtifactRef: observationArtifactId,
      terminalArtifactKind: terminalResult.artifact_kind,
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
        goalHash,
        requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        goalSatisfactionArtifact,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: observationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "stage_play_processed_mail_packet",
        payload: packetPayload,
      }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: requiredTerminalKind,
        payloadSchema: "helix.model_synthesized_answer.v1",
        terminalResult,
      }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      status: "processed_live_source_mail",
      privateRuntimeLoopEntered: false,
      requestedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      observedArtifactKind: "stage_play_processed_mail_packet",
      observedArtifactRef: observationArtifactId,
      terminalResult,
      goalSatisfactionEvaluation,
    }),
  };
};

export const requiredObservationKinds = ["stage_play_processed_mail_packet"] as const;
export const requiredTerminalKinds = ["model_synthesized_answer"] as const;
export const isRequested = isHelixAskGoldenPathProcessedLiveSourceMailRequested;
export const buildPayload = buildHelixAskGoldenPathProcessedLiveSourceMailPayload;
