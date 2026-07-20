import crypto from "node:crypto";
import {
  HELIX_REALTIME_WORKER_ADMISSION_V2_SCHEMA,
  HELIX_REALTIME_WORKER_DISPATCH_V2_SCHEMA,
  type HelixRealtimeWorkerAdmissionOutcomeV2,
  type HelixRealtimeWorkerAdmissionV2,
  type HelixRealtimeWorkerDispatchKindV2,
  type HelixRealtimeWorkerDispatchStateV2,
} from "@shared/contracts/helix-realtime-worker-dispatch.v2";
import type { HelixRealtimeStagePlayGoalBindingV1 } from "@shared/contracts/helix-realtime-stage-play.v1";
import { readWorkstationGatewayCallRequestsForTurn } from "../agent-providers/explicit-workstation-gateway";
import { arbitrateAskSourceTarget } from "../ask-source-target-arbitrator";
import { buildHelixIntentHypotheses } from "../intent-hypothesis";
import { arbitrateHelixIntent } from "../intent-arbitration";
import { isHelixAskClarifyRescueGreetingOnlyQuestion } from "../policy/clarify-rescue";
import { interpretHelixAskPrompt } from "../prompt-interpretation";

type RecordLike = Record<string, unknown>;

const hash = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter((entry): entry is string => Boolean(entry))
    : [];

const unique = (values: Array<string | null | undefined>, limit = 48): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))).slice(0, limit);

const workspaceSnapshotFromBinding = (
  sourceBinding: RecordLike | null | undefined,
): RecordLike => ({
  activePanel:
    readString(sourceBinding?.activePanel ?? sourceBinding?.active_panel) ??
    readString(sourceBinding?.focus_panel_id ?? sourceBinding?.focused_panel_id),
  activeDocPath:
    readString(sourceBinding?.activeDocPath ?? sourceBinding?.active_doc_path) ??
    readString(sourceBinding?.document_ref ?? sourceBinding?.doc_path),
  openPanels: Array.isArray(sourceBinding?.open_panels) ? sourceBinding?.open_panels : [],
});

const capabilityIdsByMode = (
  requests: RecordLike[],
  modes: Set<string>,
): string[] => unique(requests.flatMap((request) => {
  const mode = readString(request.mode) ?? "read";
  const capabilityId = readString(request.capability_id ?? request.capabilityId);
  return capabilityId && modes.has(mode) ? [capabilityId] : [];
}));

const buildAdmission = (input: {
  handoffId: string;
  realtimeSessionId: string;
  threadId: string;
  decisionPhase: HelixRealtimeWorkerAdmissionV2["decision_phase"];
  outcome: HelixRealtimeWorkerAdmissionOutcomeV2;
  reasonCodes: string[];
  primaryIntent?: string | null;
  selectedRoute?: string | null;
  runtimeProvider?: string | null;
  selectedModel?: string | null;
  candidateReadonlyCapabilityIds?: string[];
  observedReadonlyCapabilityIds?: string[];
  actionCandidateCapabilityIds?: string[];
  goalId?: string | null;
  runtimeGoalSessionRef?: string | null;
  dispatchState?: HelixRealtimeWorkerDispatchStateV2;
  workerTurnDispatched?: boolean;
  evidenceRefs?: string[];
  nowMs?: number;
}): HelixRealtimeWorkerAdmissionV2 => {
  const decidedAtMs = input.nowMs ?? Date.now();
  const dispatchKind: HelixRealtimeWorkerDispatchKindV2 =
    input.outcome === "conversation_local"
      ? "none"
      : input.outcome === "durable_goal_bound"
        ? "goal_wake"
        : input.outcome === "action_candidate"
          ? "ask_runtime_read_only"
          : "ask_runtime";
  const dispatchRequested = dispatchKind !== "none";
  const dispatchState = input.dispatchState ??
    (dispatchRequested ? "requested" : "not_required");
  return {
    schema: HELIX_REALTIME_WORKER_ADMISSION_V2_SCHEMA,
    admission_id: `realtime-worker-admission:${hash([
      input.handoffId,
      input.decisionPhase,
      input.outcome,
      input.candidateReadonlyCapabilityIds,
      input.observedReadonlyCapabilityIds,
    ]).slice(0, 20)}`,
    handoff_id: input.handoffId,
    realtime_session_id: input.realtimeSessionId,
    thread_id: input.threadId,
    decision_phase: input.decisionPhase,
    outcome: input.outcome,
    reason_codes: unique(input.reasonCodes),
    selected_primary_intent: input.primaryIntent ?? null,
    selected_route: input.selectedRoute ?? null,
    selected_runtime_agent_provider: input.runtimeProvider ?? null,
    selected_model: input.selectedModel ?? null,
    candidate_readonly_capability_ids: unique(input.candidateReadonlyCapabilityIds ?? []),
    observed_readonly_capability_ids: unique(input.observedReadonlyCapabilityIds ?? []),
    action_candidate_capability_ids: unique(input.actionCandidateCapabilityIds ?? []),
    dispatch: {
      schema: HELIX_REALTIME_WORKER_DISPATCH_V2_SCHEMA,
      kind: dispatchKind,
      state: dispatchState,
      requested: dispatchRequested,
      completed: dispatchState === "completed",
      target_runtime_agent_provider: input.runtimeProvider ?? null,
      runtime_selection_source: input.outcome === "durable_goal_bound"
        ? "goal_binding"
        : dispatchRequested && Boolean(input.runtimeProvider)
          ? "ask_ui_selected_runtime"
          : "none",
      goal_id: input.goalId ?? null,
      runtime_goal_session_ref: input.runtimeGoalSessionRef ?? null,
      suppress_parallel_ask_turn:
        input.outcome === "conversation_local" || input.outcome === "durable_goal_bound",
      read_only: true,
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    worker_turn_dispatched: input.workerTurnDispatched === true,
    spoken_relay_eligible:
      input.outcome === "worker_grounded" || input.outcome === "durable_goal_bound",
    workstation_action_execution_allowed: false,
    realtime_provider_tool_execution_allowed: false,
    evidence_refs: unique(input.evidenceRefs ?? []),
    decided_at_ms: decidedAtMs,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildRealtimeTranscriptWorkerAdmission = (input: {
  handoffId: string;
  realtimeSessionId: string;
  threadId: string;
  transcriptText: string;
  sourceBinding?: RecordLike | null;
  activeGoalBinding?: HelixRealtimeStagePlayGoalBindingV1 | null;
  selectedRuntimeAgentProvider?: string | null;
  evidenceRefs?: string[];
  nowMs?: number;
}): HelixRealtimeWorkerAdmissionV2 => {
  const workspaceSnapshot = workspaceSnapshotFromBinding(input.sourceBinding);
  const interpretation = interpretHelixAskPrompt(input.transcriptText);
  const hypotheses = buildHelixIntentHypotheses({
    promptText: input.transcriptText,
    promptInterpretation: interpretation,
  });
  const arbitration = arbitrateHelixIntent({
    promptInterpretation: interpretation,
    hypotheses,
  });
  const sourceTargetIntent = arbitrateAskSourceTarget({
    turnId: input.handoffId,
    threadId: input.threadId,
    promptText: input.transcriptText,
    activeWorkspaceSourceResolution: {
      active_panel_id: workspaceSnapshot.activePanel,
      active_doc_path: workspaceSnapshot.activeDocPath,
    },
  });
  let requests: RecordLike[] = [];
  let plannerFailed = false;
  try {
    requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question: input.transcriptText,
        source_target_intent: sourceTargetIntent,
        workspace_context_snapshot: workspaceSnapshot,
      },
      includePlannerDerived: true,
    });
  } catch {
    plannerFailed = true;
  }
  const readonlyCapabilityIds = capabilityIdsByMode(requests, new Set(["read", "observe"]));
  const actionCapabilityIds = capabilityIdsByMode(requests, new Set(["act"]));
  const primaryIntent = arbitration.selected_primary_intent_kind;
  const greetingOnly = isHelixAskClarifyRescueGreetingOnlyQuestion(input.transcriptText);
  const sourceTargetRequiresEvidence =
    sourceTargetIntent.target_source !== "unknown" &&
    sourceTargetIntent.target_source !== "model_only" &&
    sourceTargetIntent.allow_no_tool_direct === false;
  const outcome: HelixRealtimeWorkerAdmissionOutcomeV2 = input.activeGoalBinding
    ? "durable_goal_bound"
    : actionCapabilityIds.length > 0 || primaryIntent === "control_command"
      ? "action_candidate"
      : greetingOnly
        ? "conversation_local"
        : readonlyCapabilityIds.length > 0 ||
            sourceTargetRequiresEvidence ||
            primaryIntent !== "general_reasoning"
        ? "worker_grounded"
        : "conversation_local";
  const reasonCodes = [
    input.activeGoalBinding ? "active_runtime_goal_binding" : null,
    !input.activeGoalBinding && input.selectedRuntimeAgentProvider
      ? "ask_ui_selected_runtime"
      : null,
    actionCapabilityIds.length > 0 ? "normal_ask_policy_found_action_candidate" : null,
    readonlyCapabilityIds.length > 0 ? "normal_ask_policy_found_readonly_capability" : null,
    sourceTargetRequiresEvidence
      ? `source_target_${sourceTargetIntent.target_source}`
      : null,
    greetingOnly ? "ask_smalltalk_greeting_only_policy" : null,
    primaryIntent !== "general_reasoning" ? `intent_${primaryIntent}` : "intent_general_reasoning",
    plannerFailed ? "normal_ask_gateway_policy_unavailable" : null,
  ].filter((entry): entry is string => Boolean(entry));
  return buildAdmission({
    handoffId: input.handoffId,
    realtimeSessionId: input.realtimeSessionId,
    threadId: input.threadId,
    decisionPhase: "transcript_handoff",
    outcome,
    reasonCodes,
    primaryIntent,
    selectedRoute: sourceTargetIntent.target_source,
    runtimeProvider:
      input.activeGoalBinding?.runtime_agent_provider ??
      input.selectedRuntimeAgentProvider ??
      null,
    goalId: input.activeGoalBinding?.goal_id ?? null,
    runtimeGoalSessionRef: input.activeGoalBinding?.runtime_session_ref ?? null,
    candidateReadonlyCapabilityIds: readonlyCapabilityIds,
    actionCandidateCapabilityIds: actionCapabilityIds,
    evidenceRefs: input.evidenceRefs,
    nowMs: input.nowMs,
  });
};

export const readSuccessfulRealtimeGatewayCapabilityIds = (input: {
  payload: RecordLike;
  debug?: RecordLike | null;
}): string[] => unique([
  ...(Array.isArray(input.payload.workstation_gateway_call_results)
    ? input.payload.workstation_gateway_call_results
    : []),
  ...(Array.isArray(input.debug?.workstation_gateway_call_results)
    ? input.debug?.workstation_gateway_call_results
    : []),
].flatMap((value) => {
  const result = readRecord(value);
  const observation = readRecord(result?.observation_packet);
  const capabilityId = readString(result?.capability_id ?? result?.capabilityId);
  return result?.ok === true && observation?.status === "succeeded" && capabilityId
    ? [capabilityId]
    : [];
}));

const readSelectedRuntimeProvider = (
  payload: RecordLike,
  debug: RecordLike | null,
  fallback: string | null,
): string | null => {
  const selected = readRecord(payload.selected_agent_provider) ?? readRecord(debug?.selected_agent_provider);
  const laneLoop = readRecord(debug?.runtime_lane_request_loop);
  return readString(payload.selected_agent_provider) ??
    readString(debug?.selected_agent_provider) ??
    readString(selected?.id ?? selected?.provider_id ?? selected?.runtime) ??
    readString(laneLoop?.selected_runtime_agent_provider) ??
    fallback;
};

const readSelectedModel = (payload: RecordLike, debug: RecordLike | null): string | null => {
  const policy = readRecord(payload.language_model_policy) ?? readRecord(debug?.language_model_policy);
  return readString(policy?.resolved_model ?? payload.selected_model ?? debug?.selected_model);
};

export const resolveRealtimeFinalWorkerAdmission = (input: {
  preliminary: HelixRealtimeWorkerAdmissionV2;
  payload: RecordLike;
  debug?: RecordLike | null;
  solverTrace?: RecordLike | null;
  evidenceRefs?: string[];
  nowMs?: number;
}): HelixRealtimeWorkerAdmissionV2 => {
  const debug = input.debug ?? null;
  const solverTrace = input.solverTrace ?? null;
  const observedCapabilities = readSuccessfulRealtimeGatewayCapabilityIds({
    payload: input.payload,
    debug,
  });
  const primaryIntent = readString(solverTrace?.selected_primary_intent) ??
    input.preliminary.selected_primary_intent;
  const finalArbitration = readRecord(solverTrace?.final_arbitration);
  const selectedRoute = readString(finalArbitration?.selected_route) ??
    input.preliminary.selected_route;
  const greetingOnlyPolicy = input.preliminary.reason_codes.includes(
    "ask_smalltalk_greeting_only_policy",
  );
  const outcome: HelixRealtimeWorkerAdmissionOutcomeV2 =
    input.preliminary.outcome === "durable_goal_bound"
      ? "durable_goal_bound"
      : input.preliminary.outcome === "action_candidate" || primaryIntent === "control_command"
        ? "action_candidate"
        : greetingOnlyPolicy
          ? "conversation_local"
          : observedCapabilities.length > 0
            ? "worker_grounded"
            : "conversation_local";
  return buildAdmission({
    handoffId: input.preliminary.handoff_id,
    realtimeSessionId: input.preliminary.realtime_session_id,
    threadId: input.preliminary.thread_id,
    decisionPhase: "solver_final",
    outcome,
    reasonCodes: [
      ...input.preliminary.reason_codes,
      observedCapabilities.length > 0
        ? "completed_solver_has_readonly_gateway_observation"
        : "completed_solver_has_no_readonly_gateway_observation",
      greetingOnlyPolicy ? "ask_smalltalk_greeting_only_policy_retained" : null,
      outcome === "conversation_local" ? "delayed_spoken_relay_suppressed" : null,
      outcome === "action_candidate" ? "read_only_realtime_action_execution_forbidden" : null,
    ].filter((entry): entry is string => Boolean(entry)),
    primaryIntent,
    selectedRoute,
    runtimeProvider: readSelectedRuntimeProvider(
      input.payload,
      debug,
      input.preliminary.selected_runtime_agent_provider,
    ),
    selectedModel: readSelectedModel(input.payload, debug),
    goalId: input.preliminary.dispatch.goal_id,
    runtimeGoalSessionRef: input.preliminary.dispatch.runtime_goal_session_ref,
    dispatchState: input.preliminary.dispatch.requested ? "completed" : "not_required",
    workerTurnDispatched: input.preliminary.dispatch.requested,
    candidateReadonlyCapabilityIds: input.preliminary.candidate_readonly_capability_ids,
    observedReadonlyCapabilityIds: observedCapabilities,
    actionCandidateCapabilityIds: input.preliminary.action_candidate_capability_ids,
    evidenceRefs: unique([
      ...input.preliminary.evidence_refs,
      ...(input.evidenceRefs ?? []),
      ...readStringArray(input.payload.selected_terminal_support_refs),
      ...readStringArray(input.payload.terminal_synthesis_support_refs),
    ]),
    nowMs: input.nowMs,
  });
};
