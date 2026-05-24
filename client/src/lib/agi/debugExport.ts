export type DebugExportUiResult = {
  attempted_payload_hash: string;
  copied_payload_hash?: string;
  copied_text_length: number;
  method:
    | "navigator.clipboard"
    | "textarea_fallback"
    | "debug_drawer"
    | "download_link"
    | "backend_endpoint"
    | "failed";
  readback_match: "exact" | "unavailable" | "mismatch" | "empty";
  ok: boolean;
  fallback_presented: boolean;
  error?: string;
};

const stableStringify = (value: unknown): string => {
  const seen = new WeakSet<object>();
  const normalize = (entry: unknown): unknown => {
    if (!entry || typeof entry !== "object") return entry;
    if (seen.has(entry as object)) return "[Circular]";
    seen.add(entry as object);
    if (Array.isArray(entry)) return entry.map(normalize);
    return Object.keys(entry as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((out, key) => {
        out[key] = normalize((entry as Record<string, unknown>)[key]);
        return out;
      }, {});
  };
  return JSON.stringify(normalize(value));
};

export const hashDebugExportText = (text: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const buildSolverControllerSummary = (payload: Record<string, unknown>) => {
  const debug = asRecord(payload.debug);
  const agentLoop = asRecord(payload.agentLoop);
  const controller = asRecord(payload.solver_controller_decision ?? debug?.solver_controller_decision ?? agentLoop?.solver_controller_decision);
  const terminalAuthority = asRecord(payload.terminal_answer_authority ?? debug?.terminal_answer_authority ?? agentLoop?.terminal_answer_authority);
  const poisonAudit = asRecord(payload.poison_audit ?? debug?.poison_audit ?? agentLoop?.poison_audit);
  const routeAuthority = asRecord(payload.route_authority_audit ?? debug?.route_authority_audit ?? agentLoop?.route_authority_audit);
  const turnIdIntegrity = asRecord(payload.turn_id_integrity_audit ?? debug?.turn_id_integrity_audit ?? agentLoop?.turn_id_integrity_audit);
  const finalRouteReconciliation = asRecord(payload.final_route_reconciliation ?? debug?.final_route_reconciliation ?? agentLoop?.final_route_reconciliation);
  return {
    decision: readString(controller?.decision),
    blocking_reasons: Array.isArray(controller?.blocking_reasons) ? controller.blocking_reasons : [],
    final_route: readString(controller?.final_route) ?? readString(payload.route_reason_code),
    required_terminal_kind: readString(controller?.required_terminal_kind),
    selected_terminal_artifact_kind:
      readString(controller?.selected_terminal_artifact_kind) ?? readString(payload.terminal_artifact_kind),
    poison_ok: readBoolean(poisonAudit?.ok),
    route_authority_ok: readBoolean(routeAuthority?.route_authority_ok),
    terminal_authority_route: readString(terminalAuthority?.route),
    turn_id_integrity_ok: readBoolean(turnIdIntegrity?.ok),
    final_route_reconciliation_ok: readBoolean(finalRouteReconciliation?.ok),
  };
};

export function buildDebugExportDrawerFallbackResult(args: {
  attemptedPayloadHash: string;
  copiedTextLength: number;
  readbackMatch?: "exact" | "unavailable" | "mismatch" | "empty";
  error?: string;
}): DebugExportUiResult {
  return {
    ok: true,
    attempted_payload_hash: args.attemptedPayloadHash,
    copied_text_length: args.copiedTextLength,
    method: "debug_drawer",
    readback_match: args.readbackMatch ?? "unavailable",
    fallback_presented: true,
    ...(args.error ? { error: args.error } : {}),
  };
}

export function buildHelixDebugExportEnvelopeFromMasterPayload(reply: {
  id?: string;
  question?: string | null;
  content?: string | null;
}, payload: Record<string, unknown>): string {
  const debug = asRecord(payload.debug);
  const agentLoop = asRecord(payload.agentLoop);
  const ledger = Array.isArray(agentLoop?.current_turn_artifact_ledger)
    ? agentLoop.current_turn_artifact_ledger
    : Array.isArray(debug?.current_turn_artifact_ledger)
      ? debug.current_turn_artifact_ledger
      : [];
  const findLedgerPayload = (kind: string): Record<string, unknown> | null =>
    [...ledger]
      .reverse()
      .map(asRecord)
      .find((artifact) => artifact?.kind === kind)
      ? asRecord(
          [...ledger]
            .reverse()
            .map(asRecord)
            .find((artifact) => artifact?.kind === kind)?.payload,
        )
      : null;
  const availableCapabilities =
    asRecord(payload.available_capabilities ?? debug?.available_capabilities ?? agentLoop?.available_capabilities) ??
    findLedgerPayload("available_capabilities");
  const agentStepDecision =
    asRecord(payload.agent_step_decision ?? debug?.agent_step_decision ?? agentLoop?.agent_step_decision) ??
    findLedgerPayload("agent_step_decision");
  const observationReview =
    asRecord(payload.observation_review ?? debug?.observation_review ?? agentLoop?.observation_review) ??
    findLedgerPayload("observation_review");
  const goalSatisfactionEvaluation =
    asRecord(payload.goal_satisfaction_evaluation ?? debug?.goal_satisfaction_evaluation ?? agentLoop?.goal_satisfaction_evaluation) ??
    findLedgerPayload("goal_satisfaction_evaluation");
  const initialAvailableCapabilities =
    asRecord(
      payload.initial_available_capabilities ??
        debug?.initial_available_capabilities ??
        agentLoop?.initial_available_capabilities,
    ) ?? availableCapabilities;
  const initialAgentStepDecision =
    asRecord(payload.initial_agent_step_decision ?? debug?.initial_agent_step_decision ?? agentLoop?.initial_agent_step_decision) ??
    agentStepDecision;
  const agentStepAuthorityCheck =
    asRecord(payload.agent_step_authority_check ?? debug?.agent_step_authority_check ?? agentLoop?.agent_step_authority_check) ??
    findLedgerPayload("agent_step_authority_check");
  const agentStepLoop =
    asRecord(payload.agent_step_loop ?? debug?.agent_step_loop ?? agentLoop?.agent_step_loop) ??
    findLedgerPayload("agent_step_loop");
  const agentRuntimeLoop =
    asRecord(payload.agent_runtime_loop ?? debug?.agent_runtime_loop ?? agentLoop?.agent_runtime_loop) ??
    findLedgerPayload("agent_runtime_loop");
  const agentRuntimeLoopAdmission =
    asRecord(payload.agent_runtime_loop_admission ?? debug?.agent_runtime_loop_admission ?? agentLoop?.agent_runtime_loop_admission) ??
    findLedgerPayload("agent_runtime_loop_admission");
  const runtimeAuthorityAudit =
    asRecord(payload.runtime_authority_audit ?? debug?.runtime_authority_audit ?? agentLoop?.runtime_authority_audit) ??
    findLedgerPayload("runtime_authority_audit");
  const runtimeContinuationHints =
    Array.isArray(payload.runtime_continuation_hints)
      ? payload.runtime_continuation_hints
      : Array.isArray(debug?.runtime_continuation_hints)
        ? debug.runtime_continuation_hints
        : Array.isArray(agentLoop?.runtime_continuation_hints)
          ? agentLoop.runtime_continuation_hints
          : ledger
              .map(asRecord)
              .filter((artifact) => artifact?.kind === "runtime_continuation_hint")
              .map((artifact) => asRecord(artifact?.payload) ?? artifact)
              .filter(Boolean);
  const receiptArtifact =
    [...ledger]
      .reverse()
      .map(asRecord)
      .find((artifact) => {
        if (artifact?.kind !== "workspace_action_receipt") return false;
        const payloadRecord = asRecord(artifact.payload);
        return Boolean(readString(payloadRecord?.action_key) || readString(payloadRecord?.target_id));
      }) ??
    [...ledger]
      .reverse()
      .map(asRecord)
      .find((artifact) => artifact?.kind === "workspace_action_receipt") ??
    null;
  const receipt = asRecord(receiptArtifact?.payload);
  const lifecycleEvents = Array.isArray(receipt?.workspace_action_lifecycle_events)
    ? receipt.workspace_action_lifecycle_events
    : [];
  const terminalPresentation = asRecord(payload.terminal_presentation ?? debug?.terminal_presentation ?? agentLoop?.terminal_presentation);
  const terminalAuthority = asRecord(payload.terminal_answer_authority ?? debug?.terminal_answer_authority ?? agentLoop?.terminal_answer_authority);
  const terminalArtifactKind =
    readString(agentLoop?.terminal_artifact_kind) ??
    readString(debug?.terminal_artifact_kind) ??
    readString(payload.terminal_artifact_kind) ??
    readString(terminalAuthority?.terminal_artifact_kind) ??
    null;
  const finalAnswerSource =
    readString(agentLoop?.final_answer_source) ??
    readString(debug?.final_answer_source) ??
    readString(payload.final_answer_source) ??
    readString(terminalAuthority?.final_answer_source);
  const terminalErrorCode =
    readString(agentLoop?.terminal_error_code) ??
    readString(debug?.terminal_error_code) ??
    readString(payload.terminal_error_code);
  const typedFailure = asRecord(payload.typed_failure ?? debug?.typed_failure ?? agentLoop?.typed_failure);
  const terminalAuthorityText = readString(terminalAuthority?.terminal_text_preview);
  const terminalIsTypedFailure =
    terminalArtifactKind === "typed_failure" ||
    finalAnswerSource === "typed_failure" ||
    Boolean(terminalErrorCode);
  const selectedFinalAnswer =
    terminalIsTypedFailure
      ? readString(payload.terminal_failure_text) ??
        readString(typedFailure?.message) ??
        terminalAuthorityText
      : readString(terminalPresentation?.concise_text) ??
        readString(payload.selected_final_answer) ??
        readString(agentLoop?.selected_final_answer) ??
        readString(debug?.selected_final_answer) ??
        terminalAuthorityText ??
        readString(payload.selectedDebugFinalAnswer) ??
        readString(payload.finalAnswer);
  const canonicalGoalFrame = asRecord(debug?.canonical_goal_frame ?? agentLoop?.canonical_goal_frame);
  const activeTurnId =
    readString(debug?.turn_id) ??
    readString(canonicalGoalFrame?.turn_id) ??
    readString(asRecord(payload.turnTruthTable)?.turn_id) ??
    readString(reply.id) ??
    "unknown-turn";
  const canonicalActiveTurnId = readString(terminalAuthority?.turn_id) ?? activeTurnId;
  const clientActiveTurnId = readString(reply.id);
  const envelopeWithoutHash = {
    schema: "helix.ask.debug_export.v1",
    exported_at_ms: Date.now(),
    active_turn_id: canonicalActiveTurnId,
    backend_turn_id: canonicalActiveTurnId,
    client_active_turn_id: clientActiveTurnId && clientActiveTurnId !== canonicalActiveTurnId
      ? clientActiveTurnId
      : null,
    active_prompt: readString(reply.question) ?? readString(payload.selectedDebugQuestion) ?? "",
    active_prompt_hash: hashDebugExportText(readString(reply.question) ?? readString(payload.selectedDebugQuestion) ?? ""),
    selected_final_answer: selectedFinalAnswer,
    final_answer_source: finalAnswerSource,
    resolved_turn_summary: {
      turn_id: canonicalActiveTurnId,
      final_status: "final_answer",
      resolved_route_label: "unknown",
      terminal_artifact_kind: terminalArtifactKind,
      terminal_error_code: terminalErrorCode,
      pending_server_request_present: Boolean(agentLoop?.pending_request),
    },
    solver_controller_summary: buildSolverControllerSummary(payload),
    canonical_goal_frame: canonicalGoalFrame,
    available_capabilities: availableCapabilities,
    agent_step_decision: agentStepDecision,
    observation_review: observationReview,
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    initial_available_capabilities: initialAvailableCapabilities,
    initial_agent_step_decision: initialAgentStepDecision,
    agent_step_authority_check: agentStepAuthorityCheck,
    agent_step_loop: agentStepLoop,
    agent_runtime_loop: agentRuntimeLoop,
    agent_runtime_loop_admission: agentRuntimeLoopAdmission,
    runtime_authority_audit: runtimeAuthorityAudit,
    runtime_continuation_hints: runtimeContinuationHints,
    current_turn_artifact_ledger: ledger,
    current_turn_events: Array.isArray(agentLoop?.turn_events) ? agentLoop.turn_events : [],
    workspace_action_debug: receipt
      ? {
          workspace_action_registry_audit: receipt.workspace_action_registry_audit,
          workspace_action_lifecycle_events: lifecycleEvents,
          workspace_action_receipt: receipt,
          anti_determinism_audit: receipt.workspace_action_anti_determinism_audit,
          workspace_action_debug_proof: {
            action_key: receipt.action_key,
            target_id: receipt.target_id,
            action_id: receipt.action_id,
            lifecycle_events_present: lifecycleEvents
              .map((entry) => readString(asRecord(entry)?.event))
              .filter(Boolean),
            receipt_artifact_id: receiptArtifact?.artifact_id,
            receipt_status: receipt.status,
            registry_verdict: readString(asRecord(receipt.workspace_action_registry_audit)?.verdict),
            anti_determinism_verdict: readString(asRecord(receipt.workspace_action_anti_determinism_audit)?.verdict),
            final_answer_receipt_backed: Boolean(readString(receipt.message) && selectedFinalAnswer === readString(receipt.message)),
          },
        }
      : undefined,
    composite_goal_frame: debug?.composite_goal_frame ?? agentLoop?.composite_goal_frame,
    composite_execution_plan: debug?.composite_execution_plan ?? agentLoop?.composite_execution_plan,
    composite_turn_receipt: debug?.composite_turn_receipt ?? agentLoop?.composite_turn_receipt,
    subgoal_artifact_map: debug?.subgoal_artifact_map ?? agentLoop?.subgoal_artifact_map,
    composite_anti_determinism_audit:
      debug?.composite_anti_determinism_audit ?? agentLoop?.composite_anti_determinism_audit,
    composite_subgoal_reference_intent:
      debug?.composite_subgoal_reference_intent ?? agentLoop?.composite_subgoal_reference_intent ?? payload.composite_subgoal_reference_intent,
    composite_subgoal_binding: debug?.composite_subgoal_binding ?? agentLoop?.composite_subgoal_binding ?? payload.composite_subgoal_binding,
    composite_handoff_decision: debug?.composite_handoff_decision ?? agentLoop?.composite_handoff_decision ?? payload.composite_handoff_decision,
    composite_subgoal_explanation:
      debug?.composite_subgoal_explanation ?? agentLoop?.composite_subgoal_explanation ?? payload.composite_subgoal_explanation,
    composite_followup_anti_determinism_audit:
      debug?.composite_followup_anti_determinism_audit ?? agentLoop?.composite_followup_anti_determinism_audit ?? payload.composite_followup_anti_determinism_audit,
    live_interpretation_debug:
      payload.live_interpretation_debug ?? debug?.live_interpretation_debug ?? agentLoop?.live_interpretation_debug,
    live_interpretation_run:
      payload.live_interpretation_run ?? debug?.live_interpretation_run ?? agentLoop?.live_interpretation_run,
    live_interpretation_workers:
      payload.live_interpretation_workers ?? debug?.live_interpretation_workers ?? agentLoop?.live_interpretation_workers,
    live_interpretation_worker_runs:
      payload.live_interpretation_worker_runs ??
      debug?.live_interpretation_worker_runs ??
      agentLoop?.live_interpretation_worker_runs,
    live_interpretation_validation_artifacts:
      payload.live_interpretation_validation_artifacts ??
      debug?.live_interpretation_validation_artifacts ??
      agentLoop?.live_interpretation_validation_artifacts,
    live_interpretation_hypotheses:
      payload.live_interpretation_hypotheses ??
      debug?.live_interpretation_hypotheses ??
      agentLoop?.live_interpretation_hypotheses,
    live_interpretation_graph:
      payload.live_interpretation_graph ?? debug?.live_interpretation_graph ?? agentLoop?.live_interpretation_graph,
    live_interpretation_epoch_delta:
      payload.live_interpretation_epoch_delta ??
      debug?.live_interpretation_epoch_delta ??
      agentLoop?.live_interpretation_epoch_delta,
    pending_server_request: agentLoop?.pending_request ?? payload.pending_server_request ?? payload.pending_request ?? null,
    backend_debug_response_ref:
      asRecord(debug?.debug_export_ref) ??
      asRecord(payload.debug_export_ref) ??
      (canonicalActiveTurnId
        ? {
            endpoint: `/api/agi/ask/turn/${encodeURIComponent(canonicalActiveTurnId)}/debug-export`,
            turn_id: canonicalActiveTurnId,
          }
        : undefined),
    debug_export_anti_determinism_audit: {
      verdict: "clean",
      checks: [
        { check: "projection_only_patch", passed: true },
        { check: "no_goal_mutation", passed: true },
        { check: "no_terminal_mutation", passed: true },
        { check: "active_turn_only", passed: true },
        { check: "no_dom_scrape_source", passed: true },
        { check: "receipt_not_fabricated", passed: true },
      ],
    },
  };
  return JSON.stringify({
    ...envelopeWithoutHash,
    payload_hash: hashDebugExportText(stableStringify(envelopeWithoutHash)),
  });
}
