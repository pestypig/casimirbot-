import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type {
  HelixCapabilityLaneBackendSelectionSummary,
  HelixCapabilityLaneDebugEvent,
  HelixCapabilityLaneResolveTrace,
} from "@shared/helix-capability-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import {
  readHelixCapabilityLaneCallCapability,
  resolveHelixCapabilityLaneOneShotHandler,
  type HelixCapabilityLaneOneShotCallResult,
} from "./one-shot-handlers";

type RecordLike = Record<string, unknown>;

export type HelixCapabilityLaneOneShotRunnerResult = {
  schema: "helix.capability_lane.one_shot_runner_result.v1";
  requested: boolean;
  call_results: HelixCapabilityLaneOneShotCallResult[];
  observation_packets: HelixAgentStepObservationPacket[];
  resolve_traces: HelixCapabilityLaneResolveTrace[];
  backend_selections: HelixCapabilityLaneBackendSelectionSummary[];
  debug_events: HelixCapabilityLaneDebugEvent[];
  debug_projection: {
    capability_lane_call_results: HelixCapabilityLaneOneShotCallResult[];
    capability_lane_observation_packets: HelixAgentStepObservationPacket[];
    capability_lane_resolve_traces: HelixCapabilityLaneResolveTrace[];
    capability_lane_backend_selections: HelixCapabilityLaneBackendSelectionSummary[];
    capability_lane_debug_events: HelixCapabilityLaneDebugEvent[];
    capability_lane_reentry_status: "not_requested" | "observation_packet_required_for_provider_reentry";
  };
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readCapabilityFromResult = (result: HelixCapabilityLaneOneShotCallResult): string =>
  readString(result.capability);

const statusForLaneResult = (
  result: HelixCapabilityLaneOneShotCallResult,
  packet: HelixAgentStepObservationPacket | undefined,
): HelixCapabilityLaneDebugEvent["status"] => {
  if (result.ok === true) return "completed";
  const packetStatus = readString(packet?.status).toLowerCase();
  if (packetStatus === "blocked" || packetStatus === "missing_input" || packetStatus === "needs_confirmation") {
    return "blocked";
  }
  return "failed";
};

const readStructuredLaneCalls = (body: RecordLike): RecordLike[] => {
  const candidate =
    body.capability_lane_call ??
    body.capabilityLaneCall ??
    body.lane_call ??
    body.laneCall;
  if (Array.isArray(candidate)) {
    return candidate
      .map((entry) => readRecord(entry))
      .filter((entry): entry is RecordLike => Boolean(entry));
  }
  const record = readRecord(candidate);
  return record ? [record] : [];
};

const buildCapabilityLaneDebugEvents = (input: {
  provider: HelixAgentProvider;
  results: HelixCapabilityLaneOneShotCallResult[];
  observationPackets: HelixAgentStepObservationPacket[];
  resolveTraces: HelixCapabilityLaneResolveTrace[];
}): HelixCapabilityLaneDebugEvent[] => {
  const events: HelixCapabilityLaneDebugEvent[] = [];
  input.results.forEach((result, index) => {
    const trace = input.resolveTraces[index] ?? result.lane_resolve_trace;
    const packet = input.observationPackets[index] ?? result.observation_packet;
    const capability = readCapabilityFromResult(result) || readString(packet?.capability_key) || "unknown";
    const laneId = readString(result.lane_id) || readString(trace?.requested_lane) || "unknown";
    const status = statusForLaneResult(result, packet);
    const base = {
      selected_runtime_agent_provider: input.provider.id,
      lane_id: laneId,
      capability,
      requested_backend_provider: trace?.requested_backend_provider ?? null,
      requested_backend_provider_known: trace?.requested_backend_provider_known ?? null,
      requested_backend_configuration_status: trace?.requested_backend_configuration_status ?? null,
      requested_backend_availability_status: trace?.requested_backend_availability_status ?? null,
      requested_backend_permission_status: trace?.requested_backend_permission_status ?? null,
      requested_backend_cost_class: trace?.requested_backend_cost_class ?? null,
      requested_backend_latency_class: trace?.requested_backend_latency_class ?? null,
      requested_backend_privacy_class: trace?.requested_backend_privacy_class ?? null,
      requested_backend_fallback_provider: trace?.requested_backend_fallback_provider ?? null,
      selected_backend_provider: trace?.selected_backend_provider ?? null,
      selection_reason: trace?.selection_reason ?? null,
      backend_selection_decision: trace?.backend_selection_decision ?? null,
      availability_status: trace?.availability_status ?? null,
      permission_status: trace?.permission_status ?? null,
      execution_status: trace?.execution_status ?? null,
      observation_ref: trace?.observation_ref ?? null,
      result_ref: trace?.result_ref ?? null,
      receipt_ref: null,
      reentry_required: true as const,
      terminal_authority_status: "pending_helix_terminal_authority" as const,
      terminal_eligible: false as const,
      assistant_answer: false as const,
      raw_content_included: false as const,
    };
    const append = (
      stage: HelixCapabilityLaneDebugEvent["stage"],
      eventStatus: HelixCapabilityLaneDebugEvent["status"],
      reentryStatus: HelixCapabilityLaneDebugEvent["reentry_status"],
    ) => {
      events.push({
        schema: "helix.capability_lane.debug_event.v1",
        event_id: `capability_lane:${index}:${stage}`,
        seq: events.length,
        stage,
        status: eventStatus,
        reentry_status: reentryStatus,
        ...base,
      });
    };
    append("lane_requested", "completed", "not_applicable");
    append(
      "lane_backend_selected",
      trace?.admission_status === "admitted_shadow_only" ? "completed" : "blocked",
      "not_applicable",
    );
    append("lane_observation", status, result.ok === true ? "observation_packet_required_for_provider_reentry" : "not_applicable");
  });

  if (input.observationPackets.length > 0) {
    const firstTrace = input.resolveTraces[0];
    events.push({
      schema: "helix.capability_lane.debug_event.v1",
      event_id: "capability_lane:reentry",
      seq: events.length,
      stage: "lane_reentered",
      selected_runtime_agent_provider: input.provider.id,
      lane_id: "capability_lane",
      capability: "capability_lane.reentry",
      status: "pending",
      requested_backend_provider: null,
      requested_backend_provider_known: null,
      requested_backend_configuration_status: null,
      requested_backend_availability_status: null,
      requested_backend_permission_status: null,
      requested_backend_cost_class: null,
      requested_backend_latency_class: null,
      requested_backend_privacy_class: null,
      requested_backend_fallback_provider: null,
      selected_backend_provider: null,
      selection_reason: null,
      backend_selection_decision: null,
      availability_status: null,
      permission_status: null,
      execution_status: firstTrace?.execution_status ?? null,
      observation_ref: null,
      result_ref: null,
      receipt_ref: null,
      reentry_required: true,
      reentry_status: "observation_packet_required_for_provider_reentry",
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  return events;
};

const buildCapabilityLaneBackendSelections = (input: {
  provider: HelixAgentProvider;
  results: HelixCapabilityLaneOneShotCallResult[];
  resolveTraces: HelixCapabilityLaneResolveTrace[];
}): HelixCapabilityLaneBackendSelectionSummary[] =>
  input.resolveTraces.map((trace, index) => {
    const result = input.results[index];
    const capability = result ? readCapabilityFromResult(result) : "unknown";
    const laneId = readString(result?.lane_id) || readString(trace.requested_lane) || "unknown";
    return {
      schema: "helix.capability_lane.backend_selection_summary.v1",
      selected_runtime_agent_provider: input.provider.id,
      lane_id: laneId,
      capability,
      requested_lane: trace.requested_lane,
      requested_backend_provider: trace.requested_backend_provider,
      requested_backend_provider_known: trace.requested_backend_provider_known,
      requested_backend_configuration_status: trace.requested_backend_configuration_status,
      requested_backend_availability_status: trace.requested_backend_availability_status,
      requested_backend_permission_status: trace.requested_backend_permission_status,
      requested_backend_cost_class: trace.requested_backend_cost_class,
      requested_backend_latency_class: trace.requested_backend_latency_class,
      requested_backend_privacy_class: trace.requested_backend_privacy_class,
      requested_backend_fallback_provider: trace.requested_backend_fallback_provider,
      selected_backend_provider: trace.selected_backend_provider,
      backend_selection_decision: trace.backend_selection_decision,
      selection_reason: trace.selection_reason,
      availability_status: trace.availability_status,
      permission_status: trace.permission_status,
      cost_class: trace.cost_class,
      latency_class: trace.latency_class,
      privacy_class: trace.privacy_class,
      fallback_backend_provider: trace.fallback_backend_provider,
      resolved_backend_provider: trace.resolved_backend_provider,
      resolved_model_or_service: trace.resolved_model_or_service,
      observation_ref: trace.observation_ref,
      receipt_ref: null,
      result_ref: trace.result_ref,
      execution_status: trace.execution_status,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  });

export const runHelixCapabilityLaneOneShotRequests = (input: {
  provider: HelixAgentProvider;
  body: Record<string, unknown>;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixCapabilityLaneOneShotRunnerResult => {
  const turnId = readString(input.turnId) || readString(input.body.turn_id ?? input.body.turnId) || null;
  const calls = readStructuredLaneCalls(input.body);
  const results: HelixCapabilityLaneOneShotCallResult[] = [];
  for (const call of calls) {
    const capability = readHelixCapabilityLaneCallCapability(call);
    const handler = capability ? resolveHelixCapabilityLaneOneShotHandler(capability) : null;
    if (!handler) continue;
    results.push(handler.run({
      provider: input.provider,
      call,
      turnId,
      iteration: input.iteration,
      env: input.env,
    }));
  }

  const observationPackets = results.map((result) => result.observation_packet);
  const resolveTraces = results.map((result) => result.lane_resolve_trace);
  const backendSelections = buildCapabilityLaneBackendSelections({
    provider: input.provider,
    results,
    resolveTraces,
  });
  const debugEvents = buildCapabilityLaneDebugEvents({
    provider: input.provider,
    results,
    observationPackets,
    resolveTraces,
  });
  return {
    schema: "helix.capability_lane.one_shot_runner_result.v1",
    requested: calls.length > 0,
    call_results: results,
    observation_packets: observationPackets,
    resolve_traces: resolveTraces,
    backend_selections: backendSelections,
    debug_events: debugEvents,
    debug_projection: {
      capability_lane_call_results: results,
      capability_lane_observation_packets: observationPackets,
      capability_lane_resolve_traces: resolveTraces,
      capability_lane_backend_selections: backendSelections,
      capability_lane_debug_events: debugEvents,
      capability_lane_reentry_status:
        observationPackets.length > 0
          ? "observation_packet_required_for_provider_reentry"
          : "not_requested",
    },
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
