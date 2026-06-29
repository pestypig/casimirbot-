import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathRouteGateLedgerArtifact } from "../artifact-ledger";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAnswerAuthority,
  buildGoldenPathTerminalAuthoritySingleWriter,
  buildGoldenPathTerminalResult,
} from "../terminal-envelope";

export type HelixAskGoldenPathWorkspaceStatusDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathWorkspaceStatusRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY)) return true;
  const requestedCapability = readString(body.requested_capability ?? body.requestedCapability);
  if (requestedCapability === HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return prompt.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY);
};

export const workspaceStatusSummaryText = (observation: RecordLike): string => {
  const counts = readRecord(observation.capability_counts) ?? {};
  return `Workspace OS status completed: ${readNumber(counts.total) ?? 0} total, ${readNumber(counts.available) ?? 0} available, ${readNumber(counts.degraded) ?? 0} degraded, ${readNumber(counts.blocked) ?? 0} blocked, ${readNumber(counts.error) ?? 0} error, ${readNumber(counts.unknown) ?? 0} unknown.`;
};

export const buildGoldenPathWorkspaceStatusObservation = (args: {
  body: RecordLike;
  turnId: string;
  createdAtMs: number;
}): RecordLike => {
  const statusRecord = readRecord(args.body.workspace_os_status) ?? readRecord(args.body.workspaceOsStatus) ?? {};
  const countsRecord = readRecord(statusRecord.counts) ?? readRecord(statusRecord.capability_counts) ?? {};
  const total = readNumber(countsRecord.total) ?? 0;
  const available = readNumber(countsRecord.available) ?? 0;
  const degraded = readNumber(countsRecord.degraded) ?? 0;
  const blocked = readNumber(countsRecord.blocked) ?? 0;
  const error = readNumber(countsRecord.error) ?? 0;
  const unknown = readNumber(countsRecord.unknown) ?? Math.max(0, total - available - degraded - blocked - error);
  return {
    schema: "helix.workspace_os_status_observation.v1",
    artifact_id: `${args.turnId}:workspace_os_status_observation`,
    created_at_ms: args.createdAtMs,
    capability_key: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
    status: readString(statusRecord.status) ?? "available",
    capability_counts: {
      total,
      available,
      degraded,
      blocked,
      error,
      unknown,
    },
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const buildHelixAskGoldenPathWorkspaceStatusPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathWorkspaceStatusDependencies;
}): RecordLike => {
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-workspace-status:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const workspaceObservation = buildGoldenPathWorkspaceStatusObservation({ body: args.body, turnId, createdAtMs });
  const observationArtifactId = readString(workspaceObservation.artifact_id) ?? `${turnId}:workspace_os_status_observation`;
  const terminalArtifactId = `${turnId}:workspace_status_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "workspace_status_answer";
  const answerText = workspaceStatusSummaryText(workspaceObservation);
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "workspace_status_diagnostic",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_workspace_status_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "workspace_status_diagnostic",
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
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "workspace_status",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      observed_artifact_kind: "workspace_os_status_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    workspace_os_status_observation: workspaceObservation,
    workspace_status_answer: {
      schema: "helix.workspace_status_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      source_target: "workspace_os",
      family: "workspace_status",
      required_observation_kinds: ["workspace_os_status_observation"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
      terminalResult,
      route: "golden_path_runtime / workspace_status",
    }),
    terminal_authority_single_writer: buildGoldenPathTerminalAuthoritySingleWriter({ terminalResult }),
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      observed_artifact_kind: "workspace_os_status_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        ...buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          goalHash,
          promptText,
          requestedCapability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
          goalSatisfactionArtifact,
          goalSatisfactionEvaluation,
        }),
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "workspace_os_status_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: workspaceObservation,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.workspace_status_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "workspace_status",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      observed_artifact_kind: "workspace_os_status_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};


export const requiredObservationKinds = ["workspace_os_status_observation"] as const;
export const requiredTerminalKinds = ["workspace_status_answer"] as const;
export const isRequested = isHelixAskGoldenPathWorkspaceStatusRequested;
export const buildPayload = buildHelixAskGoldenPathWorkspaceStatusPayload;
