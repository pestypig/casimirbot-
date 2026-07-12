import crypto from "node:crypto";
import type {
  HelixRuntimeGoalDebugEvent,
  HelixRuntimeGoalDebugExport,
  HelixRuntimeGoalJobBrief,
  HelixRuntimeGoalProgressSummary,
  HelixRuntimeGoalQuietPolicy,
  HelixRuntimeGoalReportPolicy,
  HelixRuntimeGoalSession,
  HelixRuntimeGoalSourceBinding,
  HelixRuntimeGoalSessionStatus,
  HelixRuntimeGoalTerminalAuthorityStatus,
  HelixRuntimeGoalWakeEvent,
  HelixRuntimeGoalWakeEventKind,
  HelixRuntimeGoalWakePlan,
  HelixRuntimeGoalWakePolicy,
  HelixRuntimeGoalStopPolicy,
} from "@shared/helix-runtime-goal-session";
import {
  defaultHelixRuntimeGoalQuietPolicy,
  defaultHelixRuntimeGoalStopPolicy,
  defaultHelixRuntimeGoalWakePolicy,
} from "@shared/helix-runtime-goal-session";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixAgentProvider } from "./types";
import { getHelixAgentProviderById } from "./registry";
import { buildHelixAgentRuntimeAdapterContract } from "./runtime-adapter-contract";
import { buildHelixProviderReasoningReentry } from "./provider-terminal-authority";
import { buildHelixCapabilityLaneProviderAdapterContext } from "../capability-lanes/provider-adapter-context";
import {
  readWorkstationGatewayCallRequestsForTurn,
  runExplicitWorkstationGatewayCalls,
} from "./explicit-workstation-gateway";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";

type RecordLike = Record<string, unknown>;

type GoalProviderAuthorityProjection = {
  providerTerminalCandidate: RecordLike | null;
  providerReasoningReentry: RecordLike | null;
  providerTerminalAuthorityBridge: RecordLike | null;
  terminalAnswerAuthority: RecordLike | null;
  terminalPresentation: RecordLike | null;
};

export type StartGoalRuntimeSessionInput = {
  objective: string;
  runtimeAgentProvider: HelixAgentRuntimeId;
  goalId?: string | null;
  runtimeSessionId?: string | null;
  sourceBinding?: HelixRuntimeGoalSourceBinding | null;
  allowedLanes?: string[];
  allowedWorkstationTools?: string[];
  wakePolicy?: Partial<HelixRuntimeGoalWakePolicy>;
  stopPolicy?: Partial<HelixRuntimeGoalStopPolicy>;
  reportPolicy?: HelixRuntimeGoalReportPolicy;
  quietPolicy?: Partial<HelixRuntimeGoalQuietPolicy>;
};

export type ResumeGoalRuntimeSessionInput = {
  goalId: string;
  wakeEventKind?: HelixRuntimeGoalWakeEventKind;
  turnId?: string | null;
  body?: RecordLike;
};

export type StopGoalRuntimeSessionInput = {
  goalId: string;
  status?: Extract<HelixRuntimeGoalSessionStatus, "completed" | "cancelled" | "failed">;
  reason?: string | null;
};

export type GoalRuntimeSessionResult = {
  ok: boolean;
  session: HelixRuntimeGoalSession;
  wake_event?: HelixRuntimeGoalWakeEvent;
  debug_export: HelixRuntimeGoalDebugExport;
  blocked_reason?: string | null;
};

const runtimeIds = new Set<HelixAgentRuntimeId>(["helix", "codex", "future"]);

const nowIso = (): string => new Date().toISOString();

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readFiniteNumber = (value: unknown): number | null => {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter(Boolean)
    : [];

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const normalizeRuntimeId = (value: string): HelixAgentRuntimeId | null =>
  runtimeIds.has(value as HelixAgentRuntimeId) ? (value as HelixAgentRuntimeId) : null;

const mergeWakePolicy = (policy?: Partial<HelixRuntimeGoalWakePolicy>): HelixRuntimeGoalWakePolicy => ({
  ...defaultHelixRuntimeGoalWakePolicy(),
  ...(policy ?? {}),
});

const mergeStopPolicy = (policy?: Partial<HelixRuntimeGoalStopPolicy>): HelixRuntimeGoalStopPolicy => ({
  ...defaultHelixRuntimeGoalStopPolicy(),
  ...(policy ?? {}),
});

const mergeQuietPolicy = (
  reportPolicy: HelixRuntimeGoalReportPolicy,
  policy?: Partial<HelixRuntimeGoalQuietPolicy>,
): HelixRuntimeGoalQuietPolicy => ({
  ...defaultHelixRuntimeGoalQuietPolicy(reportPolicy),
  ...(policy ?? {}),
  report_policy: policy?.report_policy ?? reportPolicy,
});

const hasCapabilityLaneCall = (body: RecordLike): boolean =>
  Boolean(
    readRecord(body.capability_lane_call ?? body.capabilityLaneCall ?? body.lane_call ?? body.laneCall) ||
      Array.isArray(body.capability_lane_call ?? body.capabilityLaneCall ?? body.lane_call ?? body.laneCall)
  );

const requestedLaneCapabilityFromBody = (body: RecordLike): string | null => {
  const candidate = body.capability_lane_call ?? body.capabilityLaneCall ?? body.lane_call ?? body.laneCall;
  const first = Array.isArray(candidate) ? readRecord(candidate[0]) : readRecord(candidate);
  return readString(first?.capability ?? first?.capability_id ?? first?.capabilityId) || null;
};

const gatewayRequestsFromBody = (body: RecordLike): RecordLike[] =>
  readWorkstationGatewayCallRequestsForTurn({
    body,
    includePlannerDerived: false,
  });

const requestedGatewayCapabilitiesFromBody = (body: RecordLike): string[] =>
  gatewayRequestsFromBody(body)
    .map((request) => readString(request.capability_id ?? request.capabilityId))
    .filter(Boolean);

const firstGatewayRequestFromBody = (body: RecordLike): RecordLike | null =>
  gatewayRequestsFromBody(body)[0] ?? null;

const sourceBindingFromBody = (body: RecordLike): HelixRuntimeGoalSourceBinding | null => {
  const snapshot = readRecord(body.workspace_context_snapshot ?? body.workspaceContextSnapshot);
  const gatewayRequest = firstGatewayRequestFromBody(body);
  const gatewayArgs = readRecord(gatewayRequest?.arguments ?? gatewayRequest?.args) ?? {};
  const activePanelId =
    readString(snapshot?.activePanelId) ||
    readString(snapshot?.active_panel_id) ||
    readString(snapshot?.activePanel) ||
    null;
  const docPath =
    readString(gatewayArgs.path) ||
    readString(gatewayArgs.source_doc_path) ||
    readString(snapshot?.active_doc_path) ||
    readString(snapshot?.activeDocPath) ||
    readString(body.doc_path ?? body.docPath) ||
    null;
  const sourceId =
    readString(gatewayArgs.source_id) ||
    readString(snapshot?.source_id) ||
    readString(body.source_id ?? body.sourceId) ||
    null;
  const sourceHash =
    readString(gatewayArgs.source_hash) ||
    readString(snapshot?.source_hash) ||
    readString(body.source_hash ?? body.sourceHash) ||
    null;
  const freshness = readFiniteNumber(
    body.source_freshness_ms ??
      body.sourceFreshnessMs ??
      snapshot?.source_freshness_ms ??
      snapshot?.sourceFreshnessMs,
  );
  if (!activePanelId && !docPath && !sourceId && !sourceHash && freshness === null) return null;
  return {
    schema: "helix.runtime_goal.source_binding.v1",
    source_kind: docPath ? "docs_viewer_visible_surface" : activePanelId ? "workstation_panel" : "unknown",
    active_panel_id: activePanelId,
    doc_path: docPath,
    source_id: sourceId,
    source_hash: sourceHash,
    source_freshness_ms: freshness,
    source_label: docPath || activePanelId || sourceId,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const hasWorkstationGatewayCall = (body: RecordLike): boolean =>
  requestedGatewayCapabilitiesFromBody(body).length > 0;

const latestObservationRefsFromContext = (context: Awaited<ReturnType<typeof buildHelixCapabilityLaneProviderAdapterContext>>): string[] =>
  context.one_shot.observation_packets.flatMap((packet) => packet.produced_artifact_refs).filter(Boolean);

const latestReceiptRefsFromContext = (context: Awaited<ReturnType<typeof buildHelixCapabilityLaneProviderAdapterContext>>): string[] =>
  context.one_shot.observation_packets
    .flatMap((packet) => packet.receipts.map((receipt) => receipt.receipt_ref))
    .filter(Boolean);

const selectedBackendFromContext = (context: Awaited<ReturnType<typeof buildHelixCapabilityLaneProviderAdapterContext>>): string | null =>
  context.one_shot.backend_selections.map((entry) => readString(entry.selected_backend_provider)).find(Boolean) ?? null;

const observationRefsFromGatewayResults = (results: HelixWorkstationGatewayCallResult[]): string[] =>
  results
    .flatMap((result) => [
      ...result.observation_packet.produced_artifact_refs,
      ...result.artifact_refs,
    ])
    .filter(Boolean);

const receiptRefsFromGatewayResults = (results: HelixWorkstationGatewayCallResult[]): string[] =>
  results
    .flatMap((result) => result.observation_packet.receipts.map((receipt) => receipt.receipt_ref))
    .filter(Boolean);

const providerTextFromResult = (result: Awaited<ReturnType<HelixAgentProvider["runTurn"]>>): string =>
  readString(result.selected_final_answer) || readString(result.answer) || readString(result.text);

const buildHelixNativeGoalResumeResult = (input: {
  objective: string;
  observationRefs: string[];
  receiptRefs: string[];
  requestedCapability: string | null;
}): Awaited<ReturnType<HelixAgentProvider["runTurn"]>> => {
  const evidenceCount = input.observationRefs.length;
  const receiptCount = input.receiptRefs.length;
  const capabilityText = input.requestedCapability
    ? ` for ${input.requestedCapability}`
    : "";
  const text = [
    `Helix goal evidence re-entry completed${capabilityText}.`,
    `Objective: ${input.objective}`,
    `Observation refs: ${evidenceCount}. Receipt refs: ${receiptCount}.`,
  ].join("\n");
  return {
    ok: true,
    runtime: "helix",
    response_type: "final_answer",
    final_status: "completed",
    text,
    answer: text,
    selected_final_answer: text,
    debug: {
      agent_runtime: "helix",
      runtime_goal_resume_candidate: true,
      evidence_reentry_required: true,
      observation_refs: input.observationRefs,
      receipt_refs: input.receiptRefs,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
  };
};

const buildGoalJobBrief = (input: {
  goalId: string;
  objective: string;
  runtimeAgentProvider: HelixAgentRuntimeId;
  createdAt: string;
  sourceBinding: HelixRuntimeGoalSourceBinding | null;
  allowedLanes: string[];
  allowedWorkstationTools: string[];
  stopPolicy?: HelixRuntimeGoalStopPolicy;
  reportPolicy: HelixRuntimeGoalReportPolicy;
}): HelixRuntimeGoalJobBrief => {
  const stopPolicy = input.stopPolicy ?? defaultHelixRuntimeGoalStopPolicy;
  return {
    schema: "helix.runtime_goal.job_brief.v1",
    goal_id: input.goalId,
    user_goal_text: input.objective,
    selected_runtime_agent_provider: input.runtimeAgentProvider,
    created_at: input.createdAt,
    source_binding: input.sourceBinding,
    expected_wake_behavior:
      "On wake, inspect admitted workstation evidence, re-enter observations, and report job progress through Helix terminal authority.",
    allowed_capability_lanes: [...input.allowedLanes],
    allowed_workstation_tools: [...input.allowedWorkstationTools],
    stop_condition: [
      stopPolicy.user_cancel ? "user_cancel" : null,
      stopPolicy.goal_completed ? "goal_completed" : null,
      stopPolicy.permission_revoked ? "permission_revoked" : null,
      stopPolicy.lane_unavailable ? "lane_unavailable" : null,
      stopPolicy.runtime_provider_unavailable ? "runtime_provider_unavailable" : null,
      stopPolicy.repeated_failure_threshold > 0
        ? `repeated_failure_threshold:${stopPolicy.repeated_failure_threshold}`
        : null,
      stopPolicy.stale_source_ms !== null ? `stale_source_ms:${stopPolicy.stale_source_ms}` : null,
    ].filter(Boolean).join(", "),
    report_policy: input.reportPolicy,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const buildGoalWakePlan = (input: {
  session: HelixRuntimeGoalSession;
  wakeEvent: HelixRuntimeGoalWakeEvent;
  body: RecordLike;
  requestedCapability: string | null;
}): HelixRuntimeGoalWakePlan => ({
  schema: "helix.runtime_goal.wake_plan.v1",
  goal_id: input.session.goal_id,
  wake_event_id: input.wakeEvent.wake_event_id,
  turn_id: input.wakeEvent.turn_id,
  job_brief_ref: `${input.session.goal_id}:job_brief`,
  current_source_binding: sourceBindingFromBody(input.body) ?? input.session.latest_source_binding,
  requested_observation_or_lane: input.requestedCapability,
  relevance_reason: input.requestedCapability
    ? `The wake plan requests ${input.requestedCapability} so the runtime can update the assigned job from current workstation evidence.`
    : "No tool or lane was requested for this wake.",
  expected_terminal_product: "job_progress_report",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const providerCandidatePreview = (projection: GoalProviderAuthorityProjection | null): string =>
  readString(projection?.providerTerminalCandidate?.candidate_text_preview) ||
  readString(projection?.terminalPresentation?.concise_text);

const buildGoalProgressSummary = (input: {
  session: HelixRuntimeGoalSession;
  wakeEvent: HelixRuntimeGoalWakeEvent;
  requestedCapability: string | null;
  observationRefs: string[];
  receiptRefs: string[];
  providerTerminalCandidateRef: string | null;
  providerAuthorityProjection: GoalProviderAuthorityProjection | null;
  terminalAuthorityStatus: HelixRuntimeGoalTerminalAuthorityStatus;
}): HelixRuntimeGoalProgressSummary => {
  const providerSummary = providerCandidatePreview(input.providerAuthorityProjection);
  const source = input.session.latest_source_binding;
  const evidenceLabel = input.requestedCapability ?? "none";
  const currentSummary = providerSummary || [
    `Goal: ${input.session.objective}`,
    source?.source_label ? `Observed source: ${source.source_label}` : "Observed source: not reported",
    `Evidence used: ${evidenceLabel}; observations ${input.observationRefs.length}; receipts ${input.receiptRefs.length}.`,
  ].join("\n");
  return {
    schema: "helix.runtime_goal.progress_summary.v1",
    goal_id: input.session.goal_id,
    wake_event_id: input.wakeEvent.wake_event_id,
    turn_id: input.wakeEvent.turn_id,
    job: input.session.objective,
    runtime_agent_provider: input.session.runtime_agent_provider,
    observed_source: source,
    evidence_used: {
      requested_tool_or_lane: input.requestedCapability,
      observation_refs: input.observationRefs,
      receipt_refs: input.receiptRefs,
      provider_terminal_candidate_ref: input.providerTerminalCandidateRef,
    },
    current_summary: currentSummary,
    next_wake_behavior: "Waiting for the next /goal wake, admitted workstation wake, or configured timer candidate.",
    terminal_authority_status: input.terminalAuthorityStatus,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const buildProviderGoalResumeQuestion = (input: {
  session: HelixRuntimeGoalSession;
  wakeEvent: HelixRuntimeGoalWakeEvent;
  requestedCapability: string | null;
  observationRefs: string[];
  receiptRefs: string[];
}): string => {
  const source = input.session.latest_source_binding;
  return [
    "Continue the supervised workstation goal after Helix re-entered governed evidence.",
    "",
    `Assigned job: ${input.session.objective}`,
    `Runtime goal id: ${input.session.goal_id}`,
    `Wake event: ${input.wakeEvent.wake_event_id}`,
    source?.source_label ? `Observed source: ${source.source_label}` : "Observed source: not reported",
    `Requested tool or lane: ${input.requestedCapability ?? "none"}`,
    `Observation refs: ${input.observationRefs.join(", ") || "none"}`,
    `Receipt refs: ${input.receiptRefs.join(", ") || "none"}`,
    "",
    "Produce a concise job progress report that states the assigned job, what evidence was inspected, what the current summary/progress is, and what you will keep doing on the next wake.",
    "Do not claim tool use beyond the observation refs Helix provided. Do not treat observations or receipts as terminal authority.",
  ].join("\n");
};

const stripToolRequestsForProviderResume = (body: RecordLike): RecordLike => {
  const {
    capability_lane_call: _capabilityLaneCall,
    capabilityLaneCall: _capabilityLaneCallCamel,
    lane_call: _laneCall,
    laneCall: _laneCallCamel,
    workstation_gateway_call: _workstationGatewayCall,
    workstationGatewayCall: _workstationGatewayCallCamel,
    workstation_gateway_calls: _workstationGatewayCalls,
    workstationGatewayCalls: _workstationGatewayCallsCamel,
    ...rest
  } = body;
  return rest;
};

const quietDecisionFor = (input: {
  session: HelixRuntimeGoalSession;
  terminalAuthorityStatus: HelixRuntimeGoalTerminalAuthorityStatus;
  blocked: boolean;
}): HelixRuntimeGoalDebugExport["quiet_report_decision"] => {
  if (input.blocked) return "report_failure";
  if (input.session.report_policy === "report_every_terminal_authorized_result") {
    return input.terminalAuthorityStatus === "authorized" ? "report" : "quiet";
  }
  if (input.session.report_policy === "report_summary_every_n_wakes") {
    const every = input.session.quiet_policy.summary_every_n_wakes ?? 5;
    return input.session.wake_count > 0 && input.session.wake_count % every === 0 ? "report" : "quiet";
  }
  return "quiet";
};

export class HelixRuntimeGoalSessionStore {
  private sessions = new Map<string, HelixRuntimeGoalSession>();
  private wakeEvents = new Map<string, HelixRuntimeGoalWakeEvent[]>();
  private debugEvents = new Map<string, HelixRuntimeGoalDebugEvent[]>();
  private providerAuthority = new Map<string, GoalProviderAuthorityProjection>();

  clear(): void {
    this.sessions.clear();
    this.wakeEvents.clear();
    this.debugEvents.clear();
    this.providerAuthority.clear();
  }

  listGoalRuntimeSessions(): HelixRuntimeGoalSession[] {
    return Array.from(this.sessions.values());
  }

  getGoalRuntimeSession(goalId: string): HelixRuntimeGoalSession | null {
    return this.sessions.get(goalId) ?? null;
  }

  async startGoalRuntimeSession(input: StartGoalRuntimeSessionInput): Promise<GoalRuntimeSessionResult> {
    const runtimeId = normalizeRuntimeId(input.runtimeAgentProvider);
    if (!runtimeId) {
      const provider = getHelixAgentProviderById("helix");
      if (!provider) throw new Error("Helix provider registry is unavailable");
      const session = this.buildBlockedSession({
        input,
        provider,
        runtimeId: "helix",
        reason: "unavailable_runtime_provider",
      });
      this.sessions.set(session.goal_id, session);
      this.appendDebugEvent(session, {
        stage: "goal_blocked",
        status: "blocked",
        reason: "unavailable_runtime_provider",
      });
      return this.resultFor(session, false, "unavailable_runtime_provider");
    }

    const provider = getHelixAgentProviderById(runtimeId);
    if (!provider?.enabled()) {
      const fallbackProvider = provider ?? getHelixAgentProviderById("helix");
      if (!fallbackProvider) throw new Error("Helix provider registry is unavailable");
      const session = this.buildBlockedSession({
        input,
        provider: fallbackProvider,
        runtimeId,
        reason: "unavailable_runtime_provider",
      });
      this.sessions.set(session.goal_id, session);
      this.appendDebugEvent(session, {
        stage: "goal_blocked",
        status: "blocked",
        reason: "unavailable_runtime_provider",
      });
      return this.resultFor(session, false, "unavailable_runtime_provider");
    }

    const adapterContract = buildHelixAgentRuntimeAdapterContract({
      route: "/ask/turn",
      requestedRuntime: runtimeId,
      provider,
      gatewayMode: provider.permissionProfile.allows.act ? "act" : "observe",
    });
    const reportPolicy = input.reportPolicy ?? "report_only_failure";
    const timestamp = nowIso();
    const goalId = readString(input.goalId) || `goal:${crypto.randomUUID()}`;
    const objective = readString(input.objective);
    const allowedLanes = input.allowedLanes?.length ? [...input.allowedLanes] : [...adapterContract.capability_lane_ids];
    const allowedWorkstationTools = input.allowedWorkstationTools?.length
      ? [...input.allowedWorkstationTools]
      : [...adapterContract.workstation_gateway_admitted_capability_ids];
    const stopPolicy = mergeStopPolicy(input.stopPolicy);
    const sourceBinding = input.sourceBinding ?? null;
    const jobBrief = buildGoalJobBrief({
      goalId,
      objective,
      runtimeAgentProvider: provider.id,
      createdAt: timestamp,
      sourceBinding,
      allowedLanes,
      allowedWorkstationTools,
      stopPolicy,
      reportPolicy,
    });
    const session: HelixRuntimeGoalSession = {
      schema: "helix.runtime_goal.session.v1",
      goal_id: goalId,
      objective,
      runtime_agent_provider: provider.id,
      runtime_session_id: readString(input.runtimeSessionId) || `runtime:${provider.id}:${crypto.randomUUID()}`,
      status: "waiting",
      status_reason: null,
      permission_profile: provider.permissionProfile,
      allowed_lanes: allowedLanes,
      allowed_workstation_tools: allowedWorkstationTools,
      wake_policy: mergeWakePolicy(input.wakePolicy),
      stop_policy: stopPolicy,
      report_policy: reportPolicy,
      quiet_policy: mergeQuietPolicy(reportPolicy, input.quietPolicy),
      job_brief: jobBrief,
      latest_wake_plan: null,
      latest_progress_summary: null,
      latest_source_binding: sourceBinding,
      latest_turn_id: null,
      latest_observation_refs: [],
      latest_receipt_refs: [],
      latest_provider_terminal_candidate_ref: null,
      latest_final_answer_source: null,
      terminal_authority_status: "not_evaluated",
      failure_count: 0,
      last_failure_reason: null,
      wake_count: 0,
      created_at: timestamp,
      updated_at: timestamp,
      completed_at: null,
      cancelled_at: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    this.sessions.set(session.goal_id, session);
    this.appendDebugEvent(session, {
      stage: "goal_started",
      status: "completed",
      reason: null,
    });
    return this.resultFor(session, true);
  }

  async resumeGoalRuntimeSession(input: ResumeGoalRuntimeSessionInput): Promise<GoalRuntimeSessionResult> {
    const session = this.sessions.get(input.goalId);
    if (!session) {
      throw new Error(`Goal session not found: ${input.goalId}`);
    }
    if (session.status === "cancelled" || session.status === "completed" || session.status === "failed") {
      this.appendDebugEvent(session, {
        stage: "goal_blocked",
        status: "blocked",
        reason: "goal_not_resumable",
      });
      return this.resultFor(session, false, "goal_not_resumable");
    }

    const provider = getHelixAgentProviderById(session.runtime_agent_provider);
    if (!provider?.enabled()) {
      const blocked = this.updateSession(session.goal_id, {
        status: "blocked",
        status_reason: "unavailable_runtime_provider",
        terminal_authority_status: "blocked",
      });
      this.appendDebugEvent(blocked, {
        stage: "goal_blocked",
        status: "blocked",
        reason: "unavailable_runtime_provider",
      });
      return this.resultFor(blocked, false, "unavailable_runtime_provider");
    }

    const body = input.body ?? {};
    const wakeEvent = this.appendWakeEvent(session, {
      kind: input.wakeEventKind ?? "manual_resume",
      turnId: input.turnId ?? (readString(body.turn_id ?? body.turnId) || null),
      observationRefs: readStringArray(body.observation_refs ?? body.observationRefs),
      receiptRefs: readStringArray(body.receipt_refs ?? body.receiptRefs),
      payloadRef: readString(body.payload_ref ?? body.payloadRef) || null,
    });
    this.appendDebugEvent(session, {
      stage: "wake_received",
      status: "completed",
      wakeEventId: wakeEvent.wake_event_id,
      reason: null,
    });

    const sourceFreshnessMs = readFiniteNumber(
      body.source_freshness_ms ??
        body.sourceFreshnessMs ??
        body.freshness_ms ??
        body.freshnessMs,
    );
    if (
      session.stop_policy.stale_source_ms !== null &&
      sourceFreshnessMs !== null &&
      sourceFreshnessMs > session.stop_policy.stale_source_ms
    ) {
      const blocked = this.updateSession(session.goal_id, {
        status: "blocked",
        status_reason: "stale_source",
        latest_turn_id: wakeEvent.turn_id,
        wake_count: session.wake_count + 1,
        terminal_authority_status: "blocked",
        last_failure_reason: "stale_source",
      });
      this.appendDebugEvent(blocked, {
        stage: "goal_blocked",
        status: "blocked",
        wakeEventId: wakeEvent.wake_event_id,
        reason: "stale_source",
      });
      return this.resultFor(blocked, false, "stale_source", wakeEvent);
    }

    if (wakeEvent.kind === "failure" || wakeEvent.kind === "escalation") {
      const failureResult = this.recordGoalFailure({
        session,
        wakeEventId: wakeEvent.wake_event_id,
        turnId: wakeEvent.turn_id,
        reason: readString(body.reason ?? body.error ?? body.failure_reason ?? body.failureReason) || wakeEvent.kind,
      });
      return this.resultFor(
        failureResult.session,
        failureResult.ok,
        failureResult.blockedReason,
        wakeEvent,
      );
    }

    const requestedLaneCapability = requestedLaneCapabilityFromBody(body);
    const requestedGatewayCapabilities = requestedGatewayCapabilitiesFromBody(body);
    const requestedCapability = requestedLaneCapability ?? requestedGatewayCapabilities[0] ?? null;
    const wakeSourceBinding = sourceBindingFromBody(body) ?? session.latest_source_binding;
    const wakePlan = buildGoalWakePlan({
      session,
      wakeEvent,
      body,
      requestedCapability,
    });
    if (!hasCapabilityLaneCall(body) && !hasWorkstationGatewayCall(body)) {
      const waiting = this.updateSession(session.goal_id, {
        status: "waiting",
        latest_turn_id: wakeEvent.turn_id,
        latest_wake_plan: wakePlan,
        latest_source_binding: wakeSourceBinding,
        wake_count: session.wake_count + 1,
        terminal_authority_status: "pending_helix_terminal_authority",
      });
      this.appendDebugEvent(waiting, {
        stage: "runtime_resumed",
        status: "completed",
        wakeEventId: wakeEvent.wake_event_id,
        reason: "runtime_provider_made_no_tool_or_lane_request",
      });
      return this.resultFor(waiting, true, null, wakeEvent);
    }

    const disallowedGatewayCapability = requestedGatewayCapabilities.find(
      (capability) => !this.sessionAllowsWorkstationTool(session, capability),
    );
    const disallowedCapability =
      requestedLaneCapability && !this.sessionAllowsCapabilityLane(session, requestedLaneCapability)
        ? requestedLaneCapability
        : disallowedGatewayCapability ?? null;

    this.appendDebugEvent(session, {
      stage: "tool_or_lane_requested",
      status: "completed",
      wakeEventId: wakeEvent.wake_event_id,
      requestedToolOrLane: requestedCapability,
      reason: null,
    });

    if (disallowedCapability) {
      const blocked = this.updateSession(session.goal_id, {
        status: "blocked",
        status_reason: requestedLaneCapability === disallowedCapability ? "unavailable_lane" : "unavailable_workstation_tool",
        latest_turn_id: wakeEvent.turn_id,
        latest_wake_plan: wakePlan,
        latest_source_binding: wakeSourceBinding,
        wake_count: session.wake_count + 1,
        terminal_authority_status: "blocked",
      });
      this.appendDebugEvent(blocked, {
        stage: "tool_or_lane_rejected",
        status: "blocked",
        wakeEventId: wakeEvent.wake_event_id,
        requestedToolOrLane: disallowedCapability,
        reason: requestedLaneCapability === disallowedCapability ? "unavailable_lane" : "unavailable_workstation_tool",
      });
      return this.resultFor(blocked, false, blocked.status_reason, wakeEvent);
    }

    const context = hasCapabilityLaneCall(body)
      ? await buildHelixCapabilityLaneProviderAdapterContext({
          provider,
          body: {
            ...body,
            turn_id: wakeEvent.turn_id,
          },
          env: process.env,
        })
      : null;
    const gatewayResults = hasWorkstationGatewayCall(body)
      ? await runExplicitWorkstationGatewayCalls({
          body: {
            ...body,
            turn_id: wakeEvent.turn_id,
          },
          agentRuntime: provider.id,
          turnId: wakeEvent.turn_id,
        })
      : [];
    const observationRefs = [
      ...(context ? latestObservationRefsFromContext(context) : []),
      ...observationRefsFromGatewayResults(gatewayResults),
    ];
    const receiptRefs = [
      ...(context ? latestReceiptRefsFromContext(context) : []),
      ...receiptRefsFromGatewayResults(gatewayResults),
    ];
    const allGatewayCallsSucceeded = gatewayResults.every((result) => result.ok === true);
    const toolOrLaneSucceeded = observationRefs.length > 0 && allGatewayCallsSucceeded;
    const terminalAuthorityStatus: HelixRuntimeGoalTerminalAuthorityStatus =
      toolOrLaneSucceeded ? "pending_helix_terminal_authority" : "blocked";
    const nextStatus: HelixRuntimeGoalSessionStatus = toolOrLaneSucceeded ? "waiting" : "blocked";
    const updated = this.updateSession(session.goal_id, {
      status: nextStatus,
      status_reason: toolOrLaneSucceeded ? null : hasWorkstationGatewayCall(body) ? "workstation_tool_failed" : "unavailable_lane",
      latest_turn_id: wakeEvent.turn_id,
      latest_wake_plan: wakePlan,
      latest_source_binding: wakeSourceBinding,
      latest_observation_refs: observationRefs,
      latest_receipt_refs: receiptRefs,
      terminal_authority_status: terminalAuthorityStatus,
      wake_count: session.wake_count + 1,
    });
    this.appendDebugEvent(updated, {
      stage: toolOrLaneSucceeded ? "tool_or_lane_admitted" : "tool_or_lane_rejected",
      status: toolOrLaneSucceeded ? "completed" : "blocked",
      wakeEventId: wakeEvent.wake_event_id,
      requestedToolOrLane: requestedCapability,
      admitted: toolOrLaneSucceeded,
      backendSelected: context ? selectedBackendFromContext(context) : null,
      observationRefs,
      receiptRefs,
      reason: toolOrLaneSucceeded ? null : updated.status_reason,
    });
    if (toolOrLaneSucceeded) {
      this.appendDebugEvent(updated, {
        stage: "observation_recorded",
        status: "completed",
        wakeEventId: wakeEvent.wake_event_id,
        requestedToolOrLane: requestedCapability,
        observationRefs,
        receiptRefs,
        reason: null,
      });
      this.appendDebugEvent(updated, {
        stage: "evidence_reentered",
        status: "completed",
        wakeEventId: wakeEvent.wake_event_id,
        requestedToolOrLane: requestedCapability,
        observationRefs,
        receiptRefs,
        reason: "structured_goal_evidence_ready_for_provider_resume",
      });
    }
    let providerAuthorityProjection: GoalProviderAuthorityProjection | null = null;
    let providerTerminalCandidateRef: string | null = null;
    let providerTerminalAuthorityStatus = terminalAuthorityStatus;
    if (toolOrLaneSucceeded) {
      const providerResult = provider.id === "helix"
        ? buildHelixNativeGoalResumeResult({
            objective: session.objective,
            observationRefs,
            receiptRefs,
            requestedCapability,
          })
        : await provider.runTurn({
            runtime: provider.id,
            route: "/ask/turn",
            body: {
              ...stripToolRequestsForProviderResume(body),
              turn_id: wakeEvent.turn_id,
              turnId: wakeEvent.turn_id,
              thread_id: session.runtime_session_id,
              threadId: session.runtime_session_id,
              agent_runtime: provider.id,
              provider_reasoning_resume: true,
              question:
                buildProviderGoalResumeQuestion({
                  session: updated,
                  wakeEvent,
                  requestedCapability,
                  observationRefs,
                  receiptRefs,
                }),
              runtime_goal_session: {
                schema: "helix.runtime_goal.provider_resume_context.v1",
                goal_id: session.goal_id,
                objective: session.objective,
                job_brief: updated.job_brief,
                wake_plan: updated.latest_wake_plan,
                source_binding: updated.latest_source_binding,
                runtime_session_id: session.runtime_session_id,
                wake_event_id: wakeEvent.wake_event_id,
                observation_refs: observationRefs,
                receipt_refs: receiptRefs,
                terminal_eligible: false,
                assistant_answer: false,
                raw_content_included: false,
              },
            },
          });
      const providerText = providerTextFromResult(providerResult);
      const providerTextAvailable = providerText.length > 0;
      const authority = buildHelixProviderReasoningReentry({
        runtime: provider.id,
        providerLabel: provider.label,
        turnId: wakeEvent.turn_id ?? `${session.goal_id}:provider-resume`,
        threadId: session.runtime_session_id,
        route: "/ask/turn",
        gatewayCallResults: gatewayResults,
        capabilityLaneObservationPackets: context?.one_shot.observation_packets ?? [],
        providerText,
        ok: providerResult.ok || providerTextAvailable,
        solverCompleted: true,
        goalSatisfied: true,
      });
      providerAuthorityProjection = {
        providerTerminalCandidate: readRecord(authority.providerTerminalCandidate),
        providerReasoningReentry: readRecord(authority.providerReasoningReentry),
        providerTerminalAuthorityBridge: readRecord(authority.providerTerminalAuthorityBridge),
        terminalAnswerAuthority: readRecord(authority.terminalAnswerAuthority),
        terminalPresentation: readRecord(authority.terminalPresentation),
      };
      this.providerAuthority.set(session.goal_id, providerAuthorityProjection);
      providerTerminalCandidateRef =
        readString(providerAuthorityProjection.providerTerminalCandidate?.candidate_id) ||
        readString(providerAuthorityProjection.providerReasoningReentry?.provider_terminal_candidate_ref) ||
        null;
      providerTerminalAuthorityStatus = providerAuthorityProjection.terminalAnswerAuthority
        ? "authorized"
        : "blocked";
      const progressSummary = buildGoalProgressSummary({
        session: updated,
        wakeEvent,
        requestedCapability,
        observationRefs,
        receiptRefs,
        providerTerminalCandidateRef,
        providerAuthorityProjection,
        terminalAuthorityStatus: providerTerminalAuthorityStatus,
      });
      const providerResumeAccepted =
        providerResult.ok ||
        (providerTextAvailable && providerTerminalAuthorityStatus === "authorized");
      const providerFailureCount = providerResumeAccepted ? 0 : updated.failure_count + 1;
      const providerFailureThreshold =
        Math.max(1, updated.stop_policy.repeated_failure_threshold || defaultHelixRuntimeGoalStopPolicy().repeated_failure_threshold);
      const providerFailureExceededThreshold =
        !providerResumeAccepted && providerFailureCount >= providerFailureThreshold;
      const candidateUpdated = this.updateSession(session.goal_id, {
        status: providerFailureExceededThreshold ? "failed" : updated.status,
        status_reason: providerFailureExceededThreshold
          ? "repeated_failure_threshold"
          : updated.status_reason,
        latest_provider_terminal_candidate_ref: providerTerminalCandidateRef,
        latest_final_answer_source: providerAuthorityProjection.terminalAnswerAuthority
          ? "agent_provider_terminal_candidate"
          : null,
        latest_progress_summary: progressSummary,
        terminal_authority_status: providerTerminalAuthorityStatus,
        failure_count: providerFailureCount,
        last_failure_reason: providerResumeAccepted ? null : "runtime_provider_resume_failed",
      });
      this.appendDebugEvent(candidateUpdated, {
        stage: "runtime_candidate_generated",
        status: providerResumeAccepted ? "completed" : "failed",
        wakeEventId: wakeEvent.wake_event_id,
        requestedToolOrLane: requestedCapability,
        observationRefs,
        receiptRefs,
        providerTerminalCandidateRef,
        reason: providerFailureExceededThreshold
          ? "repeated_failure_threshold"
          : providerResumeAccepted ? null : "runtime_provider_resume_failed",
      });
      if (providerFailureExceededThreshold) {
        this.appendDebugEvent(candidateUpdated, {
          stage: "goal_blocked",
          status: "failed",
          wakeEventId: wakeEvent.wake_event_id,
          requestedToolOrLane: requestedCapability,
          observationRefs,
          receiptRefs,
          providerTerminalCandidateRef,
          reason: "repeated_failure_threshold",
        });
      }
    }
    const finalSession = this.sessions.get(session.goal_id) ?? updated;
    this.appendDebugEvent(finalSession, {
      stage: "terminal_authority_evaluated",
      status: providerTerminalAuthorityStatus === "authorized" ? "completed" : providerTerminalAuthorityStatus === "blocked" ? "blocked" : "pending",
      wakeEventId: wakeEvent.wake_event_id,
      requestedToolOrLane: requestedCapability,
      observationRefs,
      receiptRefs,
      providerTerminalCandidateRef,
      reason: providerTerminalAuthorityStatus === "authorized"
        ? "provider_candidate_authorized_after_goal_evidence_reentry"
        : "lane_or_tool_output_is_not_terminal_authority",
    });
    this.appendDebugEvent(this.sessions.get(session.goal_id) ?? finalSession, {
      stage: "quiet_policy_applied",
      status: "completed",
      wakeEventId: wakeEvent.wake_event_id,
      requestedToolOrLane: requestedCapability,
      observationRefs,
      receiptRefs,
      reason: null,
    });
    const resultSession = this.sessions.get(session.goal_id) ?? finalSession;
    return this.resultFor(
      resultSession,
      toolOrLaneSucceeded && resultSession.status !== "failed",
      resultSession.status_reason,
      wakeEvent,
    );
  }

  stopGoalRuntimeSession(input: StopGoalRuntimeSessionInput): GoalRuntimeSessionResult {
    const session = this.sessions.get(input.goalId);
    if (!session) {
      throw new Error(`Goal session not found: ${input.goalId}`);
    }
    const timestamp = nowIso();
    const status = input.status ?? "cancelled";
    const updated = this.updateSession(session.goal_id, {
      status,
      status_reason: input.reason ?? status,
      terminal_authority_status: status === "completed" ? session.terminal_authority_status : "blocked",
      completed_at: status === "completed" ? timestamp : session.completed_at,
      cancelled_at: status === "cancelled" ? timestamp : session.cancelled_at,
    });
    this.appendDebugEvent(updated, {
      stage: "goal_stopped",
      status: "completed",
      reason: input.reason ?? status,
    });
    return this.resultFor(updated, true);
  }

  blockGoalRuntimeSession(input: { goalId: string; reason: string; wakeEventId?: string | null }): GoalRuntimeSessionResult {
    const session = this.sessions.get(input.goalId);
    if (!session) {
      throw new Error(`Goal session not found: ${input.goalId}`);
    }
    const updated = this.updateSession(session.goal_id, {
      status: "blocked",
      status_reason: input.reason,
      terminal_authority_status: "blocked",
      last_failure_reason: input.reason,
    });
    this.appendDebugEvent(updated, {
      stage: "goal_blocked",
      status: "blocked",
      wakeEventId: input.wakeEventId ?? null,
      reason: input.reason,
    });
    return this.resultFor(updated, false, input.reason);
  }

  buildGoalDebugExport(goalId: string): HelixRuntimeGoalDebugExport | null {
    const session = this.sessions.get(goalId);
    return session ? this.debugExportFor(session) : null;
  }

  private buildBlockedSession(input: {
    input: StartGoalRuntimeSessionInput;
    provider: HelixAgentProvider;
    runtimeId: HelixAgentRuntimeId;
    reason: string;
  }): HelixRuntimeGoalSession {
    const reportPolicy = input.input.reportPolicy ?? "report_only_failure";
    const timestamp = nowIso();
    const goalId = readString(input.input.goalId) || `goal:${crypto.randomUUID()}`;
    const objective = readString(input.input.objective);
    const allowedLanes = input.input.allowedLanes ?? [];
    const allowedWorkstationTools = input.input.allowedWorkstationTools ?? [];
    const jobBrief = buildGoalJobBrief({
      goalId,
      objective,
      runtimeAgentProvider: input.runtimeId,
      createdAt: timestamp,
      sourceBinding: input.input.sourceBinding ?? null,
      allowedLanes,
      allowedWorkstationTools,
      reportPolicy,
    });
    return {
      schema: "helix.runtime_goal.session.v1",
      goal_id: goalId,
      objective,
      runtime_agent_provider: input.runtimeId,
      runtime_session_id: readString(input.input.runtimeSessionId) || `runtime:${input.runtimeId}:${crypto.randomUUID()}`,
      status: "blocked",
      status_reason: input.reason,
      permission_profile: input.provider.permissionProfile,
      allowed_lanes: allowedLanes,
      allowed_workstation_tools: allowedWorkstationTools,
      wake_policy: mergeWakePolicy(input.input.wakePolicy),
      stop_policy: mergeStopPolicy(input.input.stopPolicy),
      report_policy: reportPolicy,
      quiet_policy: mergeQuietPolicy(reportPolicy, input.input.quietPolicy),
      job_brief: jobBrief,
      latest_wake_plan: null,
      latest_progress_summary: null,
      latest_source_binding: input.input.sourceBinding ?? null,
      latest_turn_id: null,
      latest_observation_refs: [],
      latest_receipt_refs: [],
      latest_provider_terminal_candidate_ref: null,
      latest_final_answer_source: null,
      terminal_authority_status: "blocked",
      failure_count: 0,
      last_failure_reason: input.reason,
      wake_count: 0,
      created_at: timestamp,
      updated_at: timestamp,
      completed_at: null,
      cancelled_at: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  private sessionAllowsCapabilityLane(session: HelixRuntimeGoalSession, capability: string): boolean {
    const lane = capability.split(".")[0] ?? capability;
    return session.allowed_lanes.includes(lane) || session.allowed_lanes.includes(capability);
  }

  private sessionAllowsWorkstationTool(session: HelixRuntimeGoalSession, capability: string): boolean {
    return session.allowed_workstation_tools.includes(capability);
  }

  private updateSession(goalId: string, patch: Partial<HelixRuntimeGoalSession>): HelixRuntimeGoalSession {
    const current = this.sessions.get(goalId);
    if (!current) throw new Error(`Goal session not found: ${goalId}`);
    const updated = {
      ...current,
      ...patch,
      updated_at: nowIso(),
    };
    this.sessions.set(goalId, updated);
    return updated;
  }

  private recordGoalFailure(input: {
    session: HelixRuntimeGoalSession;
    wakeEventId: string;
    turnId: string | null;
    reason: string;
  }): { session: HelixRuntimeGoalSession; ok: boolean; blockedReason: string | null } {
    const nextFailureCount = input.session.failure_count + 1;
    const threshold = Math.max(
      1,
      input.session.stop_policy.repeated_failure_threshold ||
        defaultHelixRuntimeGoalStopPolicy().repeated_failure_threshold,
    );
    const thresholdReached = nextFailureCount >= threshold;
    const updated = this.updateSession(input.session.goal_id, {
      status: thresholdReached ? "failed" : "waiting",
      status_reason: thresholdReached ? "repeated_failure_threshold" : null,
      latest_turn_id: input.turnId,
      wake_count: input.session.wake_count + 1,
      terminal_authority_status: thresholdReached ? "blocked" : "pending_helix_terminal_authority",
      failure_count: nextFailureCount,
      last_failure_reason: input.reason,
    });
    this.appendDebugEvent(updated, {
      stage: "goal_failure_recorded",
      status: thresholdReached ? "failed" : "pending",
      wakeEventId: input.wakeEventId,
      reason: thresholdReached ? "repeated_failure_threshold" : input.reason,
    });
    return {
      session: updated,
      ok: !thresholdReached,
      blockedReason: thresholdReached ? "repeated_failure_threshold" : null,
    };
  }

  private appendWakeEvent(
    session: HelixRuntimeGoalSession,
    input: {
      kind: HelixRuntimeGoalWakeEventKind;
      turnId: string | null;
      observationRefs: string[];
      receiptRefs: string[];
      payloadRef: string | null;
    },
  ): HelixRuntimeGoalWakeEvent {
    const event: HelixRuntimeGoalWakeEvent = {
      schema: "helix.runtime_goal.wake_event.v1",
      wake_event_id: `goal-wake:${crypto.randomUUID()}`,
      goal_id: session.goal_id,
      kind: input.kind,
      created_at: nowIso(),
      turn_id: input.turnId,
      observation_refs: input.observationRefs,
      receipt_refs: input.receiptRefs,
      payload_ref: input.payloadRef,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    this.wakeEvents.set(session.goal_id, [...(this.wakeEvents.get(session.goal_id) ?? []), event]);
    return event;
  }

  private appendDebugEvent(
    session: HelixRuntimeGoalSession,
    input: {
      stage: HelixRuntimeGoalDebugEvent["stage"];
      status: HelixRuntimeGoalDebugEvent["status"];
      wakeEventId?: string | null;
      requestedToolOrLane?: string | null;
      admitted?: boolean | null;
      backendSelected?: string | null;
      observationRefs?: string[];
      receiptRefs?: string[];
      reason?: string | null;
      providerTerminalCandidateRef?: string | null;
    },
  ): HelixRuntimeGoalDebugEvent {
    const existing = this.debugEvents.get(session.goal_id) ?? [];
    const terminalAuthorityStatus = session.terminal_authority_status;
    const quietReportDecision = quietDecisionFor({
      session,
      terminalAuthorityStatus,
      blocked: input.status === "blocked" || input.status === "failed",
    });
    const event: HelixRuntimeGoalDebugEvent = {
      schema: "helix.runtime_goal.debug_event.v1",
      event_id: `goal-debug:${crypto.randomUUID()}`,
      seq: existing.length,
      goal_id: session.goal_id,
      runtime_agent_provider: session.runtime_agent_provider,
      runtime_session_id: session.runtime_session_id,
      wake_event_id: input.wakeEventId ?? null,
      stage: input.stage,
      status: input.status,
      requested_tool_or_lane: input.requestedToolOrLane ?? null,
      admitted: input.admitted ?? null,
      backend_selected: input.backendSelected ?? null,
      observation_refs: input.observationRefs ?? session.latest_observation_refs,
      receipt_refs: input.receiptRefs ?? session.latest_receipt_refs,
      reentry_status:
        input.stage === "evidence_reentered"
          ? "reentered"
          : input.status === "blocked"
            ? "blocked"
            : (input.observationRefs?.length ?? session.latest_observation_refs.length) > 0
              ? "pending_provider_reentry"
              : "not_requested",
      terminal_authority_status: terminalAuthorityStatus,
      quiet_report_decision: quietReportDecision,
      provider_terminal_candidate_ref: input.providerTerminalCandidateRef ?? session.latest_provider_terminal_candidate_ref,
      reason: input.reason ?? null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    this.debugEvents.set(session.goal_id, [...existing, event]);
    return event;
  }

  private debugExportFor(session: HelixRuntimeGoalSession): HelixRuntimeGoalDebugExport {
    const debugEvents = this.debugEvents.get(session.goal_id) ?? [];
    const authority = this.providerAuthority.get(session.goal_id);
    const latestDecision =
      debugEvents[debugEvents.length - 1]?.quiet_report_decision ??
      quietDecisionFor({
        session,
        terminalAuthorityStatus: session.terminal_authority_status,
        blocked: session.status === "blocked" || session.status === "failed",
      });
    return {
      schema: "helix.runtime_goal.debug_export.v1",
      goal_id: session.goal_id,
      runtime_provider: session.runtime_agent_provider,
      runtime_session_id: session.runtime_session_id,
      session_status: session.status,
      wake_events: this.wakeEvents.get(session.goal_id) ?? [],
      debug_events: debugEvents,
      runtime_goal_job_brief: session.job_brief,
      runtime_goal_wake_plan: session.latest_wake_plan,
      runtime_goal_progress_summary: session.latest_progress_summary,
      runtime_goal_source_binding: session.latest_source_binding,
      runtime_goal_observation_refs: session.latest_observation_refs,
      runtime_goal_terminal_authority_status: session.terminal_authority_status,
      latest_observation_refs: session.latest_observation_refs,
      latest_receipt_refs: session.latest_receipt_refs,
      provider_terminal_candidate: authority?.providerTerminalCandidate ?? null,
      provider_reasoning_reentry: authority?.providerReasoningReentry ?? null,
      provider_terminal_authority_bridge: authority?.providerTerminalAuthorityBridge ?? null,
      terminal_answer_authority: authority?.terminalAnswerAuthority ?? null,
      terminal_presentation: authority?.terminalPresentation ?? null,
      terminal_authority_status: session.terminal_authority_status,
      quiet_report_decision: latestDecision,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  private resultFor(
    session: HelixRuntimeGoalSession,
    ok: boolean,
    blockedReason: string | null = null,
    wakeEvent?: HelixRuntimeGoalWakeEvent,
  ): GoalRuntimeSessionResult {
    return {
      ok,
      session,
      ...(wakeEvent ? { wake_event: wakeEvent } : {}),
      debug_export: this.debugExportFor(session),
      blocked_reason: blockedReason,
    };
  }
}

export const helixRuntimeGoalSessionStore = new HelixRuntimeGoalSessionStore();
