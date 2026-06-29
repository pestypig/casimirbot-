import { buildHelixGoalSatisfactionEvaluationArtifact } from "../goal-satisfaction-artifact";
import {
  buildAskTurnCompositeFollowupAudit,
  buildAskTurnCompositeHandoffDecision,
} from "../composite-followup-helpers";
import {
  buildStagePlayAskCheckpointReceiptPayload,
  type StagePlayCheckpointReceiptArtifactLike,
} from "../live-source/stage-play-checkpoint-receipt";
import { buildGoldenPathCompositeDebug } from "./compound-contract";
import {
  buildGoldenPathRouteGateLedgerArtifact,
  buildGoldenPathTerminalLedgerArtifact,
} from "./artifact-ledger";
import { buildGoldenPathCapabilityGoalSatisfactionEvaluation } from "./capability-contract";
import {
  buildHelixAskGoldenPathContractAnswerArtifactId,
  buildHelixAskGoldenPathModelTurnPacketRef,
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  readHelixAskGoldenPathTurnContext,
  type RecordLike,
} from "./core";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTerminalResponseProjection,
  buildGoldenPathTerminalResult,
} from "./terminal-envelope";
import { buildGoldenPathSolverTrace } from "./solver-trace";

export type HelixAskGoldenPathRuntimeContractPayloadDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
  buildCompositeHandoffDecision: typeof buildAskTurnCompositeHandoffDecision;
  buildCompositeFollowupAudit: typeof buildAskTurnCompositeFollowupAudit;
  buildStagePlayCheckpointReceiptPayload: typeof buildStagePlayAskCheckpointReceiptPayload;
};
export const buildHelixAskGoldenPathRuntimeContractPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathRuntimeContractPayloadDependencies;
}): RecordLike => {
  const deps = args.deps;
  const context = readHelixAskGoldenPathTurnContext({
    body: args.body,
    now: deps.now(),
    fallbackTurnIdPrefix: "ask:golden-path",
  });
  const { now, createdAtMs, turnId, traceId, sessionId, threadId, promptText } = context;
  const modelPacketRef = buildHelixAskGoldenPathModelTurnPacketRef(turnId);
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const artifactId = buildHelixAskGoldenPathContractAnswerArtifactId(turnId);
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const answerText =
    "Helix Ask golden path runtime returned a contract-only final answer. This scaffold verifies routing, ledger, and terminal-source invariants without entering a private runtime loop.";

  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "golden_path_runtime_contract",
    answer_scope: "current_turn",
    required_terminal_kind: "golden_path_contract_answer",
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_golden_path_runtime_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
    turnId,
    goalKind: "golden_path_runtime_contract",
    requiredTerminalKind: "golden_path_contract_answer",
  });
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const compositeDebug = buildGoldenPathCompositeDebug({ deps, turnId });
  const terminalResult = buildGoldenPathTerminalResult({
    resultId: terminalResultId,
    artifactId,
    artifactKind: "golden_path_contract_answer",
    finalAnswerSource: "helix_ask_golden_path_runtime",
    text: answerText,
    supportRefs: [routeGateArtifactId, modelPacketRef, goalSatisfactionArtifact.artifact_id],
  });
  const stagePlayCheckpointReceiptPayload = deps.buildStagePlayCheckpointReceiptPayload({
    payload: {
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1" },
      final_answer_source: terminalResult.final_answer_source,
      terminal_artifact_kind: terminalResult.artifact_kind,
      thread_id: threadId,
      session_id: sessionId,
    },
    turnId,
    artifacts: [] as StagePlayCheckpointReceiptArtifactLike[],
    finalAnswerDraft: { text: answerText, authority: "golden_path_contract" },
    finalAnswerDraftRef: artifactId,
    createdAt: now.toISOString(),
  });

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "contract_only",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      model_turn_packet_ref: modelPacketRef,
      route_gate_artifact_ref: routeGateArtifactId,
      terminal_artifact_ref: artifactId,
      terminal_result_id: terminalResultId,
      terminal_result_count: 1,
      reused_extracted_helpers: ["S275", "S276", "S277"],
      assistant_answer: false,
      raw_content_included: false,
    },
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    canonical_goal_frame: canonicalGoalFrame,
    route_reason_code: "golden_path_runtime / contract_only",
    route: "golden_path_runtime / contract_only",
    ...buildGoldenPathTerminalResponseProjection({ terminalResult }),
    model_turn_packet: {
      schema: "helix.model_turn_packet.v1",
      packet_ref: modelPacketRef,
      turn_id: turnId,
      prompt_text: promptText,
      available_capabilities: [],
      model_visible_artifacts: [goalSatisfactionArtifact.artifact_id],
      loop_policy: {
        max_model_steps: 1,
        allow_tools: false,
        require_model_authored_terminal: false,
        deterministic_fallback_terminal_allowed: false,
      },
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: "golden_path_runtime / contract_only",
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
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
        promptText,
        modelPacketRef,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
        reusedExtractedHelpers: ["S275", "S276", "S277"],
      }),
      buildGoldenPathTerminalLedgerArtifact({
        artifactId,
        turnId,
        createdAtMs,
        goalHash,
        terminalResult,
      }),
    ],
    stage_play_checkpoint_receipt_payload: stagePlayCheckpointReceiptPayload,
    composite_handoff_decision: { ...compositeDebug.decision, non_authoritative_debug_probe: true },
    composite_followup_anti_determinism_audit: { ...compositeDebug.audit, non_authoritative_debug_probe: true },
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "contract_only",
      private_runtime_loop_entered: false,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      composite_handoff_decision: compositeDebug.decision,
      composite_followup_anti_determinism_audit: compositeDebug.audit,
      stage_play_checkpoint_receipt_payload: stagePlayCheckpointReceiptPayload,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

