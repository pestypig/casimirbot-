import type { HelixAgentRuntimeDescriptor } from "@shared/helix-agent-runtime";
import {
  DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS,
  isHelixAgentRuntimeId,
  resolveHelixAskActualAgentProviderLabel,
} from "@/lib/helix/ask-agent-runtime-display";

type RecordLike = Record<string, unknown>;

export type HelixAskRuntimeTurnSummaryRow = {
  key: string;
  label: string;
  value: string;
};

export type HelixAskRuntimeTurnSummary = {
  rows: HelixAskRuntimeTurnSummaryRow[];
};

function readRecord(value: unknown): RecordLike | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function coerceText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function readNestedRecord(...values: unknown[]): RecordLike | null {
  for (const value of values) {
    const record = readRecord(value);
    if (record) return record;
  }
  return null;
}

function readBackendSelectionDecisionParts(value: unknown): string[] {
  const decision = readRecord(value);
  if (!decision) return [];
  const outcome = coerceText(decision.outcome);
  const terminalOwner = coerceText(decision.terminal_authority_owner);
  return [
    outcome ? `decision ${outcome}` : "",
    decision.selected_runtime_provider_remains_root === true ? "runtime root preserved" : "",
    decision.live_backend_execution_enabled === false ? "no live backend execution" : "",
    terminalOwner ? `terminal authority ${terminalOwner}` : "",
  ].filter(Boolean);
}

function readLanePacketBackendParts(packet: RecordLike | null): string[] {
  const stateDelta = readRecord(packet?.state_delta);
  const shadowExecution = readRecord(stateDelta?.capability_lane_shadow_execution);
  const decision = readRecord(packet?.backend_selection_decision);
  const selectedBackend =
    coerceText(packet?.selected_backend_provider) ||
    coerceText(shadowExecution?.selected_backend_provider) ||
    coerceText(decision?.selected_backend_provider);
  const requestedBackend =
    coerceText(packet?.requested_backend_provider) ||
    coerceText(shadowExecution?.requested_backend_provider) ||
    coerceText(decision?.requested_backend_provider);
  const execution =
    coerceText(packet?.execution_status) ||
    coerceText(shadowExecution?.execution_status);
  const availability =
    coerceText(packet?.availability_status) ||
    coerceText(shadowExecution?.availability_status);
  const permission =
    coerceText(packet?.permission_status) ||
    coerceText(shadowExecution?.permission_status);
  const cost =
    coerceText(packet?.cost_class) ||
    coerceText(shadowExecution?.cost_class);
  const latency =
    coerceText(packet?.latency_class) ||
    coerceText(shadowExecution?.latency_class);
  const privacy =
    coerceText(packet?.privacy_class) ||
    coerceText(shadowExecution?.privacy_class);
  const fallback =
    coerceText(packet?.fallback_backend_provider) ||
    coerceText(shadowExecution?.fallback_backend_provider) ||
    coerceText(decision?.fallback_backend_provider);
  const observationOnly =
    packet?.terminal_eligible === false ||
    packet?.assistant_answer === false ||
    shadowExecution?.terminal_eligible === false ||
    shadowExecution?.assistant_answer === false;
  return [
    selectedBackend ? `backend ${selectedBackend}` : "",
    requestedBackend ? `requested backend ${requestedBackend}` : "",
    execution ? `execution ${execution}` : "",
    availability ? `availability ${availability}` : "",
    permission ? `permission ${permission}` : "",
    cost ? `cost ${cost}` : "",
    latency ? `latency ${latency}` : "",
    privacy ? `privacy ${privacy}` : "",
    fallback ? `fallback ${fallback}` : "",
    ...readBackendSelectionDecisionParts(decision),
    observationOnly ? "observation-only" : "",
  ].filter(Boolean);
}

function readSelectedRuntime(record: RecordLike | null, debug: RecordLike | null): string {
  const provider = readRecord(record?.selected_agent_provider) ?? readRecord(debug?.selected_agent_provider);
  const providerId = provider?.id;
  if (isHelixAgentRuntimeId(record?.agent_runtime)) return record.agent_runtime;
  if (isHelixAgentRuntimeId(debug?.agent_runtime)) return debug.agent_runtime;
  if (isHelixAgentRuntimeId(providerId)) return providerId;
  const manifest = readRecord(record?.capability_lane_manifest) ?? readRecord(debug?.capability_lane_manifest);
  const manifestRuntime = manifest?.selected_runtime_agent_provider;
  return isHelixAgentRuntimeId(manifestRuntime) ? manifestRuntime : "";
}

function readAdapterBoundary(record: RecordLike | null, debug: RecordLike | null, runtime: string): string {
  const selectionTrace =
    readRecord(record?.agent_runtime_selection_trace) ?? readRecord(debug?.agent_runtime_selection_trace);
  const provider =
    readRecord(record?.selected_agent_provider) ??
    readRecord(debug?.selected_agent_provider);
  const adapterContract =
    readRecord(record?.agent_runtime_adapter_contract) ??
    readRecord(debug?.agent_runtime_adapter_contract);
  const value =
    coerceText(selectionTrace?.adapter_boundary) ||
    coerceText(selectionTrace?.adapter_boundary_id) ||
    coerceText(selectionTrace?.provider_adapter_boundary) ||
    coerceText(provider?.adapter_boundary) ||
    coerceText(adapterContract?.adapter_boundary) ||
    coerceText(adapterContract?.boundary);
  if (value) return value;
  return runtime ? "provider adapter boundary" : "";
}

function readLaneStatusSummary(record: RecordLike | null, debug: RecordLike | null): string {
  const manifest = readRecord(record?.capability_lane_manifest) ?? readRecord(debug?.capability_lane_manifest);
  const statuses = readRecord(record?.capability_lane_statuses) ?? readRecord(debug?.capability_lane_statuses);
  const laneRecords = readArray(manifest?.lanes)
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const laneIds = laneRecords.length > 0
    ? laneRecords.map((lane) => coerceText(lane.lane_id)).filter(Boolean)
    : readArray(record?.capability_lane_ids ?? debug?.capability_lane_ids).map(coerceText).filter(Boolean);

  const summaries = laneIds.slice(0, 6).map((laneId) => {
    const lane = laneRecords.find((entry) => coerceText(entry.lane_id) === laneId);
    const status = coerceText(statuses?.[laneId]) || coerceText(lane?.status) || "unknown";
    const backend = coerceText(lane?.backend_family);
    return backend ? `${laneId}: ${status} (${backend})` : `${laneId}: ${status}`;
  });
  if (laneIds.length > 6) summaries.push(`+${laneIds.length - 6} more`);
  return summaries.join(" | ");
}

function readLaneBackendProviderConfigSummary(record: RecordLike | null, debug: RecordLike | null): string {
  const manifest = readRecord(record?.capability_lane_manifest) ?? readRecord(debug?.capability_lane_manifest);
  const laneRecords = readArray(manifest?.lanes)
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const providerSummaries = laneRecords.flatMap((lane) => {
    const laneId = coerceText(lane.lane_id);
    return readArray(lane.backend_providers)
      .map((entry) => readRecord(entry))
      .filter((entry): entry is RecordLike => Boolean(entry))
      .map((provider) => {
        const providerId = coerceText(provider.provider_id);
        if (!providerId) return "";
        const configuration = coerceText(provider.configuration_status);
        const availability = coerceText(provider.availability_status);
        const permission = coerceText(provider.permission_status);
        const latency = coerceText(provider.latency_class);
        const privacy = coerceText(provider.privacy_class);
        const fallback = coerceText(provider.fallback_backend_provider);
        const configuredEnv = readArray(provider.configured_env_vars).map(coerceText).filter(Boolean).join(",");
        return [
          laneId ? `${laneId}/${providerId}` : providerId,
          configuration ? `config ${configuration}` : "",
          availability ? `availability ${availability}` : "",
          permission ? `permission ${permission}` : "",
          latency ? `latency ${latency}` : "",
          privacy ? `privacy ${privacy}` : "",
          fallback ? `fallback ${fallback}` : "",
          configuredEnv ? `configured env ${configuredEnv}` : "",
          provider.raw_secret_exposed === false ? "no raw secrets" : "",
        ].filter(Boolean).join(" | ");
      });
  }).filter(Boolean);

  const unique = Array.from(new Set(providerSummaries));
  const visible = unique.slice(0, 6);
  if (unique.length > visible.length) visible.push(`+${unique.length - visible.length} more`);
  return visible.join(" || ");
}

function readLaneBackendSummary(record: RecordLike | null, debug: RecordLike | null): string {
  const trace =
    readRecord(record?.capability_lane_resolve_trace) ??
    readRecord(debug?.capability_lane_resolve_trace) ??
    readRecord(record?.capability_lane_resolve_trace_shape) ??
    readRecord(debug?.capability_lane_resolve_trace_shape);
  const decision = readRecord(trace?.backend_selection_decision);
  const requestedLane = coerceText(trace?.requested_lane);
  const backend = coerceText(trace?.selected_backend_provider) || coerceText(trace?.resolved_backend_provider);
  const requestedAvailability = coerceText(trace?.requested_backend_availability_status);
  const requestedPermission = coerceText(trace?.requested_backend_permission_status);
  const requestedConfiguration = coerceText(trace?.requested_backend_configuration_status);
  const service = coerceText(trace?.selected_model_or_service) || coerceText(trace?.resolved_model_or_service);
  const status = coerceText(trace?.availability_status) || coerceText(trace?.lane_status);
  const reason = coerceText(trace?.selection_reason) || coerceText(trace?.blocked_reason);
  if (!requestedLane && !backend && !service && !status && !reason) return "";
  return [
    requestedLane ? `lane ${requestedLane}` : "",
    backend ? `backend ${backend}` : "",
    requestedConfiguration ? `requested configuration ${requestedConfiguration}` : "",
    requestedAvailability ? `requested availability ${requestedAvailability}` : "",
    requestedPermission ? `requested permission ${requestedPermission}` : "",
    ...readBackendSelectionDecisionParts(decision),
    service ? `service ${service}` : "",
    status ? `status ${status}` : "",
    reason ? `reason ${reason}` : "",
  ].filter(Boolean).join(" | ");
}

function readTurnToolSummary(record: RecordLike | null, debug: RecordLike | null): string {
  const agentLoop = readNestedRecord(record?.agent_runtime_loop, debug?.agent_runtime_loop);
  const debugExport = readNestedRecord(record?.debug_export, debug?.debug_export);
  const calls = [
    ...readArray(record?.workstation_gateway_call_results),
    ...readArray(debug?.workstation_gateway_call_results),
    ...readArray(agentLoop?.workstation_gateway_call_results),
    ...readArray(debugExport?.workstation_gateway_call_results),
  ]
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const tools = calls
    .map((call) => {
      const admission = readRecord(call.gateway_admission);
      const capability =
        coerceText(call.capability_id) ||
        coerceText(call.capabilityId) ||
        coerceText(admission?.requested_capability);
      const status = call.ok === true ? "ok" : coerceText(call.status) || "blocked";
      return capability ? `${capability} (${status})` : "";
    })
    .filter(Boolean);
  return Array.from(new Set(tools)).slice(0, 6).join(" | ");
}

function readLaneProjectionSummary(record: RecordLike | null, debug: RecordLike | null): string {
  const calls = [
    ...readArray(record?.capability_lane_call_results),
    ...readArray(record?.capability_lane_results),
    ...readArray(debug?.capability_lane_call_results),
    ...readArray(debug?.capability_lane_results),
  ]
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const packets = [
    ...readArray(record?.capability_lane_observation_packets),
    ...readArray(debug?.capability_lane_observation_packets),
  ]
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const projectionReceipts = [
    ...readArray(record?.capability_lane_projection_receipts),
    ...readArray(debug?.capability_lane_projection_receipts),
  ]
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));

  const summaries = calls.map((call) => {
    const capability = coerceText(call.capability) || coerceText(call.capability_key) || coerceText(call.capability_id);
    const observation = readRecord(call.observation);
    const packet = readRecord(call.observation_packet);
    const packetState = readRecord(packet?.state_delta);
    const observationRef = coerceText(observation?.observation_ref) || coerceText(call.observation_ref);
    const fallbackPacket = observationRef
      ? packets.find((candidate) => coerceText(candidate.observation_ref) === observationRef)
      : null;
    const packetForBackend = packet ?? fallbackPacket;
    const backendParts = readLanePacketBackendParts(packetForBackend);
    const fallbackState = readRecord(fallbackPacket?.state_delta);
    const status = call.ok === true ? "projected" : coerceText(packet?.status) || "not_projected";
    const packetSummary = coerceText(packet?.observation_summary) || coerceText(call.observation_summary);

    if (capability === "live_translation.translate_text") {
      const directChunk = readRecord(packetState?.live_translation_chunk);
      const chunk = directChunk ?? readRecord(fallbackState?.live_translation_chunk);
      const projectionReceipt =
        readRecord(packetState?.live_translation_projection_receipt) ??
        readRecord(fallbackState?.live_translation_projection_receipt);
      const translatedText = coerceText(call.translated_text) || coerceText(observation?.translated_text);
      const targetLanguage = coerceText(observation?.target_language);
      const projectionTarget = coerceText(observation?.projection_target) || coerceText(chunk?.projection_target);
      const projectionStatus = coerceText(projectionReceipt?.projection_status);
      const receiptRef = coerceText(projectionReceipt?.receipt_ref);
      const laneSessionId =
        coerceText(call.lane_session_id) ||
        coerceText(observation?.lane_session_id) ||
        coerceText(chunk?.lane_session_id);
      const sourceId = coerceText(observation?.source_id) || coerceText(chunk?.source_id);
      const chunkId = coerceText(observation?.chunk_id) || coerceText(chunk?.chunk_id);
      const chunkIndex = coerceText(observation?.chunk_index) || coerceText(chunk?.chunk_index);
      const dedupeKey = coerceText(observation?.dedupe_key) || coerceText(chunk?.dedupe_key);
      const sourceEventMs = coerceText(observation?.source_event_ms) || coerceText(chunk?.source_event_ms);
      const observedAtMs = coerceText(observation?.observed_at_ms) || coerceText(chunk?.observed_at_ms);
      const freshness = coerceText(observation?.freshness_status) || coerceText(chunk?.freshness_status);
      const cancelled = observation?.cancel_requested === true || chunk?.cancel_requested === true;
      const stale = projectionReceipt?.stale === true;
      const pieces = [
        "live_translation",
        projectionStatus ? `projection ${projectionStatus}` : "",
        projectionTarget ? `target ${projectionTarget}` : "",
        laneSessionId ? `session ${laneSessionId}` : "",
        targetLanguage ? `language ${targetLanguage}` : "",
        sourceId ? `source ${sourceId}` : "",
        chunkId ? `chunk ${chunkId}` : "",
        chunkIndex ? `index ${chunkIndex}` : "",
        dedupeKey ? `dedupe ${dedupeKey}` : "",
        sourceEventMs ? `source event ${sourceEventMs}` : "",
        observedAtMs ? `observed ${observedAtMs}` : "",
        freshness ? `freshness ${freshness}` : "",
        stale ? "stale" : "",
        cancelled ? "cancelled" : status,
        translatedText && !cancelled ? `text ${translatedText}` : "",
        receiptRef ? `receipt ${receiptRef}` : "",
        observationRef ? `ref ${observationRef}` : "",
        ...backendParts,
      ].filter(Boolean);
      return pieces.join(" | ");
    }

    if (capability === "utility_text.normalize_text") {
      const normalizedText = coerceText(call.normalized_text) || coerceText(observation?.normalized_text);
      const mode = coerceText(observation?.normalization_mode);
      const pieces = [
        "utility_text",
        "normalize_text",
        mode ? `mode ${mode}` : "",
        status,
        normalizedText ? `text ${normalizedText}` : "",
        observationRef ? `ref ${observationRef}` : "",
        ...backendParts,
      ].filter(Boolean);
      return pieces.join(" | ");
    }

    if (capability === "workstation_tool_reference.list_capabilities") {
      const count = coerceText(call.capability_count) || coerceText(observation?.capability_count);
      const mode = coerceText(observation?.gateway_mode);
      const pieces = [
        "workstation_tool_reference",
        "list_capabilities",
        mode ? `mode ${mode}` : "",
        count ? `count ${count}` : "",
        status,
        observationRef ? `ref ${observationRef}` : "",
        ...backendParts,
      ].filter(Boolean);
      return pieces.join(" | ");
    }

    if (!capability) return "";
    const pieces = [
      capability,
      status,
      packetSummary ? `summary ${packetSummary}` : "",
      observationRef ? `ref ${observationRef}` : "",
      ...backendParts,
    ].filter(Boolean);
    return pieces.join(" | ");
  }).filter(Boolean);

  const receiptSummaries = projectionReceipts.map((receipt) => {
    const payload = readRecord(receipt.payload);
    const capability =
      coerceText(receipt.capability) ||
      coerceText(receipt.capability_key) ||
      coerceText(payload?.capability);
    const projectionStatus =
      coerceText(receipt.projection_status) ||
      coerceText(payload?.projection_status) ||
      coerceText(receipt.status);
    const projectionTarget =
      coerceText(receipt.projection_target) ||
      coerceText(payload?.projection_target);
    const targetLanguage =
      coerceText(receipt.target_language) ||
      coerceText(payload?.target_language);
    const receiptRef = coerceText(receipt.receipt_ref);
    const observationRef = coerceText(receipt.observation_ref) || coerceText(payload?.observation_ref);
    const pieces = [
      capability || "capability_lane_projection",
      projectionStatus ? `projection ${projectionStatus}` : "",
      projectionTarget ? `target ${projectionTarget}` : "",
      targetLanguage ? `language ${targetLanguage}` : "",
      receiptRef ? `receipt ${receiptRef}` : "",
      observationRef ? `ref ${observationRef}` : "",
      "observation-only",
    ].filter(Boolean);
    return pieces.join(" | ");
  }).filter(Boolean);

  return Array.from(new Set([...summaries, ...receiptSummaries])).slice(0, 3).join(" || ");
}

function readGoalBoundLaneSummary(record: RecordLike | null, debug: RecordLike | null): string {
  const agentLoop = readNestedRecord(record?.agent_runtime_loop, debug?.agent_runtime_loop);
  const debugExport = readNestedRecord(record?.debug_export, debug?.debug_export);
  const directDispatchPlans = [
    ...readArray(record?.capability_lane_goal_dispatch_plans),
    ...readArray(debug?.capability_lane_goal_dispatch_plans),
    ...readArray(agentLoop?.capability_lane_goal_dispatch_plans),
    ...readArray(debugExport?.capability_lane_goal_dispatch_plans),
  ]
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const directDispatchAdmissions = [
    ...readArray(record?.capability_lane_goal_dispatch_admissions),
    ...readArray(debug?.capability_lane_goal_dispatch_admissions),
    ...readArray(agentLoop?.capability_lane_goal_dispatch_admissions),
    ...readArray(debugExport?.capability_lane_goal_dispatch_admissions),
  ]
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const summaries = [
    ...readArray(record?.capability_lane_goal_binding_debug_summaries),
    ...readArray(debug?.capability_lane_goal_binding_debug_summaries),
    ...readArray(agentLoop?.capability_lane_goal_binding_debug_summaries),
    ...readArray(debugExport?.capability_lane_goal_binding_debug_summaries),
  ]
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((summary) => {
      const lane = coerceText(summary.lane_id) || "capability_lane";
      const goal = coerceText(summary.goal_id);
      const session = coerceText(summary.lane_session_id);
      const backend = coerceText(summary.selected_backend_provider);
      const decisionParts = readBackendSelectionDecisionParts(summary.backend_selection_decision);
      const latestMailLoop = readRecord(summary.latest_mail_loop_summary);
      const mailLoop =
        coerceText(latestMailLoop?.stage_play_mail_id) ||
        coerceText(latestMailLoop?.observation_ref) ||
        readArray(summary.mail_loop_refs).map(coerceText).filter(Boolean).at(-1) ||
        "";
      const receipt =
        coerceText(latestMailLoop?.receipt_ref) ||
        coerceText(readRecord(summary.latest_goal_binding_event)?.receipt_ref) ||
        coerceText(readRecord(summary.report_decision)?.receipt_ref) ||
        coerceText(readRecord(summary.dispatch_plan)?.receipt_ref);
      const latestGoalEvent = coerceText(readRecord(summary.latest_goal_binding_event)?.event);
      const reportDecision = readRecord(summary.report_decision);
      const reportAction = coerceText(reportDecision?.action);
      const dispatchPlan = directDispatchPlans.find((plan) =>
        coerceText(plan.goal_binding_id) === coerceText(summary.goal_binding_id)) ??
        readRecord(summary.dispatch_plan);
      const dispatchTarget = coerceText(dispatchPlan?.target);
      const dispatchAdmission = directDispatchAdmissions.find((admission) =>
        coerceText(admission.goal_binding_id) === coerceText(summary.goal_binding_id)) ??
        readRecord(summary.dispatch_admission);
      const dispatchAdmissionStatus = coerceText(dispatchAdmission?.status);
      const status = [coerceText(summary.binding_status), coerceText(summary.session_status)]
        .filter(Boolean)
        .join("/");
      const observation = coerceText(summary.last_observation_ref);
      const terminalAuthority = coerceText(summary.terminal_authority_status);
      const cost = coerceText(summary.cost_class);
      const latency = coerceText(summary.latency_class);
      const privacy = coerceText(summary.privacy_class);
      const fallback = coerceText(summary.fallback_backend_provider);
      return [
        lane,
        goal ? `goal ${goal}` : "",
        session ? `session ${session}` : "",
        status ? `status ${status}` : "",
        backend ? `backend ${backend}` : "",
        cost ? `cost ${cost}` : "",
        latency ? `latency ${latency}` : "",
        privacy ? `privacy ${privacy}` : "",
        fallback ? `fallback ${fallback}` : "",
        ...decisionParts,
        observation ? `observation ${observation}` : "",
        mailLoop ? `mail ${mailLoop}` : "",
        latestGoalEvent ? `event ${latestGoalEvent}` : "",
        receipt ? `receipt ${receipt}` : "",
        reportAction ? `report ${reportAction}` : "",
        dispatchTarget ? `dispatch ${dispatchTarget}` : "",
        dispatchAdmissionStatus ? `admission ${dispatchAdmissionStatus}` : "",
        terminalAuthority ? `authority ${terminalAuthority}` : "",
        "observation-only",
      ].filter(Boolean).join(" | ");
    });

  if (summaries.length === 0 && directDispatchPlans.length > 0) {
    return Array.from(new Set(directDispatchPlans.map((plan) => {
      const lane = coerceText(plan.lane_id) || "capability_lane";
      const goal = coerceText(plan.goal_id);
      const session = coerceText(plan.lane_session_id);
      const target = coerceText(plan.target);
      const status = coerceText(plan.status);
      const receipt = coerceText(plan.receipt_ref);
      return [
        lane,
        goal ? `goal ${goal}` : "",
        session ? `session ${session}` : "",
        target ? `dispatch ${target}` : "",
        status ? `status ${status}` : "",
        receipt ? `receipt ${receipt}` : "",
        "observation-only",
      ].filter(Boolean).join(" | ");
    }))).slice(0, 3).join(" || ");
  }

  if (summaries.length === 0 && directDispatchAdmissions.length > 0) {
    return Array.from(new Set(directDispatchAdmissions.map((admission) => {
      const lane = coerceText(admission.lane_id) || "capability_lane";
      const goal = coerceText(admission.goal_id);
      const session = coerceText(admission.lane_session_id);
      const target = coerceText(admission.target);
      const status = coerceText(admission.status);
      return [
        lane,
        goal ? `goal ${goal}` : "",
        session ? `session ${session}` : "",
        target ? `dispatch ${target}` : "",
        status ? `admission ${status}` : "",
        "observation-only",
      ].filter(Boolean).join(" | ");
    }))).slice(0, 3).join(" || ");
  }

  return Array.from(new Set(summaries)).slice(0, 3).join(" || ");
}

function readGoalDispatchReadinessSummary(record: RecordLike | null, debug: RecordLike | null): string {
  const agentLoop = readNestedRecord(record?.agent_runtime_loop, debug?.agent_runtime_loop);
  const debugExport = readNestedRecord(record?.debug_export, debug?.debug_export);
  const readiness =
    readRecord(record?.capability_lane_goal_dispatch_readiness) ??
    readRecord(debug?.capability_lane_goal_dispatch_readiness) ??
    readRecord(agentLoop?.capability_lane_goal_dispatch_readiness) ??
    readRecord(debugExport?.capability_lane_goal_dispatch_readiness);
  if (!readiness) return "";

  const totalPlans = coerceText(readiness.total_plans);
  const totalAdmissions = coerceText(readiness.total_admissions);
  const admitted = coerceText(readiness.admitted_count);
  const blocked = coerceText(readiness.blocked_count);
  const pendingWake = coerceText(readiness.pending_wake_count);
  const pendingTerminal = coerceText(readiness.pending_terminal_authority_count);
  const projectionOnly = coerceText(readiness.projection_only_count);
  const manualReview = coerceText(readiness.manual_review_count);
  const debugOnly = coerceText(readiness.debug_only_count);
  const lanes = readArray(readiness.next_lane_ids).map(coerceText).filter(Boolean).join(", ");
  const sessions = readArray(readiness.next_lane_session_ids).map(coerceText).filter(Boolean).join(", ");
  const targets = readArray(readiness.next_dispatch_targets).map(coerceText).filter(Boolean).join(", ");
  const goalBindings = readArray(readiness.next_goal_binding_ids).map(coerceText).filter(Boolean).join(", ");
  const evidenceRefs = readArray(readiness.next_evidence_refs).map(coerceText).filter(Boolean).join(", ");
  const receipts = readArray(readiness.next_receipt_refs).map(coerceText).filter(Boolean).join(", ");
  const blockedReasons = readArray(readiness.blocked_reasons).map(coerceText).filter(Boolean).join(", ");

  return [
    totalPlans ? `plans ${totalPlans}` : "",
    totalAdmissions ? `admissions ${totalAdmissions}` : "",
    admitted ? `admitted ${admitted}` : "",
    blocked ? `blocked ${blocked}` : "",
    pendingWake && pendingWake !== "0" ? `pending wake ${pendingWake}` : "",
    pendingTerminal && pendingTerminal !== "0" ? `pending terminal ${pendingTerminal}` : "",
    projectionOnly && projectionOnly !== "0" ? `projection only ${projectionOnly}` : "",
    manualReview && manualReview !== "0" ? `manual review ${manualReview}` : "",
    debugOnly && debugOnly !== "0" ? `debug only ${debugOnly}` : "",
    lanes ? `lanes ${lanes}` : "",
    sessions ? `sessions ${sessions}` : "",
    targets ? `targets ${targets}` : "",
    goalBindings ? `goal bindings ${goalBindings}` : "",
    evidenceRefs ? `evidence ${evidenceRefs}` : "",
    receipts ? `receipts ${receipts}` : "",
    blockedReasons ? `blocked ${blockedReasons}` : "",
    "no side effects",
    "observation-only",
  ].filter(Boolean).join(" | ");
}

function readLaneSessionSummary(record: RecordLike | null, debug: RecordLike | null): string {
  const agentLoop = readNestedRecord(record?.agent_runtime_loop, debug?.agent_runtime_loop);
  const debugExport = readNestedRecord(record?.debug_export, debug?.debug_export);
  const summaries = [
    ...readArray(record?.capability_lane_session_debug_summaries),
    ...readArray(debug?.capability_lane_session_debug_summaries),
    ...readArray(agentLoop?.capability_lane_session_debug_summaries),
    ...readArray(debugExport?.capability_lane_session_debug_summaries),
  ]
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((summary) => {
      const lane = coerceText(summary.lane_id) || "capability_lane";
      const session = coerceText(summary.lane_session_id);
      const backend = coerceText(summary.selected_backend_provider);
      const cost = coerceText(summary.cost_class);
      const latency = coerceText(summary.latency_class);
      const privacy = coerceText(summary.privacy_class);
      const fallback = coerceText(summary.fallback_backend_provider);
      const decisionParts = readBackendSelectionDecisionParts(summary.backend_selection_decision);
      const status = [coerceText(summary.session_status), coerceText(summary.session_health)]
        .filter(Boolean)
        .join("/");
      const source = coerceText(summary.source_id);
      const projection = coerceText(summary.projection_target);
      const locale = coerceText(summary.account_locale);
      const observation = coerceText(summary.last_observation_ref);
      const receipt = coerceText(summary.last_receipt_ref);
      const terminalAuthority = coerceText(summary.terminal_authority_status);
      return [
        lane,
        session ? `session ${session}` : "",
        status ? `status ${status}` : "",
        backend ? `backend ${backend}` : "",
        cost ? `cost ${cost}` : "",
        latency ? `latency ${latency}` : "",
        privacy ? `privacy ${privacy}` : "",
        fallback ? `fallback ${fallback}` : "",
        ...decisionParts,
        source ? `source ${source}` : "",
        projection ? `projection ${projection}` : "",
        locale ? `locale ${locale}` : "",
        observation ? `observation ${observation}` : "",
        receipt ? `receipt ${receipt}` : "",
        terminalAuthority ? `authority ${terminalAuthority}` : "",
        "observation-only",
      ].filter(Boolean).join(" | ");
    });

  return Array.from(new Set(summaries)).slice(0, 3).join(" || ");
}

function readLaneMailLoopSummary(record: RecordLike | null, debug: RecordLike | null): string {
  const agentLoop = readNestedRecord(record?.agent_runtime_loop, debug?.agent_runtime_loop);
  const debugExport = readNestedRecord(record?.debug_export, debug?.debug_export);
  const summaries = [
    ...readArray(record?.capability_lane_mail_loop_debug_summaries),
    ...readArray(debug?.capability_lane_mail_loop_debug_summaries),
    ...readArray(agentLoop?.capability_lane_mail_loop_debug_summaries),
    ...readArray(debugExport?.capability_lane_mail_loop_debug_summaries),
  ]
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((summary) => {
      const lane = coerceText(summary.lane_id) || "capability_lane";
      const session = coerceText(summary.lane_session_id);
      const mail = coerceText(summary.stage_play_mail_id);
      const wake = summary.stage_play_wake_expected === true ? "wake expected" : "wake not expected";
      const observation = coerceText(summary.observation_ref);
      const receipt = coerceText(summary.receipt_ref);
      const source = coerceText(summary.source_id);
      const chunk = coerceText(summary.chunk_id);
      const chunkIndex = coerceText(summary.chunk_index);
      const dedupeKey = coerceText(summary.dedupe_key);
      const sourceEventMs = coerceText(summary.source_event_ms);
      const observedAtMs = coerceText(summary.observed_at_ms);
      const backend = coerceText(summary.selected_backend_provider);
      const cost = coerceText(summary.cost_class);
      const latency = coerceText(summary.latency_class);
      const privacy = coerceText(summary.privacy_class);
      const fallback = coerceText(summary.fallback_backend_provider);
      const decisionParts = readBackendSelectionDecisionParts(summary.backend_selection_decision);
      const blocked = coerceText(summary.blocked_reason);
      const terminalAuthority = coerceText(summary.terminal_authority_status);
      const cancelled = summary.cancel_requested === true;
      return [
        lane,
        session ? `session ${session}` : "",
        mail ? `mail ${mail}` : "",
        wake,
        observation ? `observation ${observation}` : "",
        receipt ? `receipt ${receipt}` : "",
        source ? `source ${source}` : "",
        chunk ? `chunk ${chunk}` : "",
        chunkIndex ? `index ${chunkIndex}` : "",
        dedupeKey ? `dedupe ${dedupeKey}` : "",
        sourceEventMs ? `source event ${sourceEventMs}` : "",
        observedAtMs ? `observed ${observedAtMs}` : "",
        cancelled ? "cancelled" : "",
        backend ? `backend ${backend}` : "",
        cost ? `cost ${cost}` : "",
        latency ? `latency ${latency}` : "",
        privacy ? `privacy ${privacy}` : "",
        fallback ? `fallback ${fallback}` : "",
        ...decisionParts,
        blocked ? `blocked ${blocked}` : "",
        terminalAuthority ? `authority ${terminalAuthority}` : "",
        "evidence-only",
      ].filter(Boolean).join(" | ");
    });

  return Array.from(new Set(summaries)).slice(0, 3).join(" || ");
}

function readTerminalArtifactKind(record: RecordLike | null, debug: RecordLike | null): string {
  const resolved = readNestedRecord(record?.resolved_turn_summary, debug?.resolved_turn_summary);
  const authority = readNestedRecord(record?.terminal_authority, debug?.terminal_authority);
  return (
    coerceText(record?.terminal_artifact_kind) ||
    coerceText(debug?.terminal_artifact_kind) ||
    coerceText(resolved?.terminal_artifact_kind) ||
    coerceText(authority?.selected_terminal_artifact_kind) ||
    coerceText(authority?.terminal_artifact_kind)
  );
}

function readDebugExportRef(record: RecordLike | null, debug: RecordLike | null): string {
  const debugExport = readNestedRecord(record?.debug_export, debug?.debug_export);
  return (
    coerceText(record?.debug_export_ref) ||
    coerceText(debug?.debug_export_ref) ||
    coerceText(debugExport?.debug_export_ref) ||
    coerceText(record?.debug_ref) ||
    coerceText(debug?.debug_ref)
  );
}

export function buildHelixAskRuntimeTurnSummary(
  response: unknown,
  providers: HelixAgentRuntimeDescriptor[] = DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS,
): HelixAskRuntimeTurnSummary | null {
  const record = readRecord(response);
  const debug = readRecord(record?.debug);
  const runtime = readSelectedRuntime(record, debug);
  const providerLabel = resolveHelixAskActualAgentProviderLabel(response, providers)?.replace(/^Provider:\s*/i, "");
  const adapter = readAdapterBoundary(record, debug, runtime);
  const lanes = readLaneStatusSummary(record, debug);
  const backendProviders = readLaneBackendProviderConfigSummary(record, debug);
  const backend = readLaneBackendSummary(record, debug);
  const tools = readTurnToolSummary(record, debug);
  const projection = readLaneProjectionSummary(record, debug);
  const laneSessions = readLaneSessionSummary(record, debug);
  const laneMail = readLaneMailLoopSummary(record, debug);
  const goalBoundLanes = readGoalBoundLaneSummary(record, debug);
  const goalDispatchReadiness = readGoalDispatchReadinessSummary(record, debug);
  const terminal = readTerminalArtifactKind(record, debug);
  const debugRef = readDebugExportRef(record, debug);

  const rows: HelixAskRuntimeTurnSummaryRow[] = [
    providerLabel || runtime
      ? {
          key: "runtime_provider",
          label: "Runtime provider",
          value: [runtime || null, providerLabel || null].filter(Boolean).join(" / "),
        }
      : null,
    adapter ? { key: "adapter_boundary", label: "Adapter boundary", value: adapter } : null,
    lanes ? { key: "capability_lanes", label: "Capability lanes", value: lanes } : null,
    backendProviders
      ? { key: "lane_backend_providers", label: "Lane backend providers", value: backendProviders }
      : null,
    backend ? { key: "lane_backend", label: "Lane backend", value: backend } : null,
    tools ? { key: "turn_tools", label: "Turn tools", value: tools } : null,
    projection ? { key: "lane_projection", label: "Lane projection", value: projection } : null,
    laneSessions ? { key: "lane_sessions", label: "Lane sessions", value: laneSessions } : null,
    laneMail ? { key: "lane_mail", label: "Lane mail", value: laneMail } : null,
    goalBoundLanes ? { key: "goal_bound_lanes", label: "Goal-bound lanes", value: goalBoundLanes } : null,
    goalDispatchReadiness
      ? { key: "goal_dispatch_readiness", label: "Goal dispatch readiness", value: goalDispatchReadiness }
      : null,
    terminal ? { key: "terminal_artifact", label: "Terminal artifact", value: terminal } : null,
    debugRef ? { key: "debug_export", label: "Debug export", value: debugRef } : null,
  ].filter((row): row is HelixAskRuntimeTurnSummaryRow => Boolean(row));

  return rows.length > 0 ? { rows } : null;
}
