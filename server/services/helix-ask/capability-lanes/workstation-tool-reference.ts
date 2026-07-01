import crypto from "node:crypto";
import {
  HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  type HelixAgentStepObservationPacket,
} from "@shared/helix-agent-step-observation-packet";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneResolveTrace,
} from "@shared/helix-capability-lane";
import {
  HELIX_WORKSTATION_TOOL_REFERENCE_LIST_OBSERVATION_SCHEMA,
  HELIX_WORKSTATION_TOOL_REFERENCE_LIST_RESULT_SCHEMA,
  type HelixWorkstationToolReferenceCapabilitySummary,
  type HelixWorkstationToolReferenceListObservation,
  type HelixWorkstationToolReferenceListRequest,
  type HelixWorkstationToolReferenceListResult,
  type HelixWorkstationToolReferenceMode,
} from "@shared/helix-workstation-tool-reference-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import { listWorkstationGatewayCapabilities } from "../workstation-tool-gateway/registry";
import type { HelixWorkstationGatewayMode } from "../workstation-tool-gateway/types";
import { resolveHelixCapabilityLaneRequest } from "./registry";

const CAPABILITY_ID = "workstation_tool_reference.list_capabilities" as const;

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeMode = (value: unknown): HelixWorkstationToolReferenceMode => {
  const normalized = readText(value).toLowerCase();
  if (
    normalized === "read" ||
    normalized === "observe" ||
    normalized === "act" ||
    normalized === "verify"
  ) {
    return normalized;
  }
  return "observe";
};

const buildLaneObservationPacket = (input: {
  turnId: string;
  iteration: number;
  status: HelixAgentStepObservationPacket["status"];
  summary: string;
  observationRef: string;
  backendSelectionDecision: HelixCapabilityLaneBackendSelectionDecision;
  mode: HelixWorkstationToolReferenceMode;
}): HelixAgentStepObservationPacket => ({
  schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  turn_id: input.turnId,
  iteration: input.iteration,
  call_id: `${input.turnId}:capability_lane:${CAPABILITY_ID}:call`,
  decision_id: `${input.turnId}:capability_lane:${CAPABILITY_ID}:decision`,
  capability_key: CAPABILITY_ID,
  panel_id: "capability_lane",
  action: "list_capabilities",
  status: input.status,
  produced_artifact_refs: [input.observationRef],
  observation_summary: input.summary,
  receipts: [],
  missing_requirements: [],
  backend_selection_decision: input.backendSelectionDecision,
  state_delta: {
    workstation_tool_reference: {
      gateway_mode: input.mode,
      observation_ref: input.observationRef,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
  },
  suggested_next_steps:
    input.status === "succeeded"
      ? ["answer", "use_another_tool"]
      : ["repair", "fail_closed"],
  produced_affordances: [],
  consumed_affordances: [],
  typed_handoff_contract: {
    schema: "helix.workstation_typed_handoff_contract.v1",
    producer_capability: CAPABILITY_ID,
    consumer_capability: null,
    required_affordance_kinds: [],
    produced_affordance_kinds: ["system_status"],
    missing_affordance_kinds: [],
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

const withExecutionTrace = (input: {
  trace: HelixCapabilityLaneResolveTrace;
  observationRef: string | null;
  status: "executed_observation_only" | "not_executed_shadow_only";
  blockedReason?: string | null;
}): HelixCapabilityLaneResolveTrace => ({
  ...input.trace,
  execution_status: input.status,
  result_ref: input.observationRef,
  observation_ref: input.observationRef,
  receipt_ref: null,
  blocked_reason: input.blockedReason ?? input.trace.blocked_reason,
});

const summarizeCapabilities = (
  capabilities: ReturnType<typeof listWorkstationGatewayCapabilities>["capabilities"],
): HelixWorkstationToolReferenceCapabilitySummary[] =>
  capabilities.map((capability) => ({
    capability_id: capability.capability_id,
    label: capability.label,
    panel_id: capability.panel_id,
    action_id: capability.action_id,
    mode: capability.mode,
    permission_profile_required: capability.permission_profile_required,
    requires_confirmation: capability.requires_confirmation,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  }));

export const runWorkstationToolReferenceListCapabilities = (input: {
  provider: HelixAgentProvider;
  request: HelixWorkstationToolReferenceListRequest;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixWorkstationToolReferenceListResult => {
  const turnId = input.turnId?.trim() || input.request.turn_id?.trim() || "ask:lane:workstation_tool_reference";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const mode = normalizeMode(input.request.mode);
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: "workstation_tool_reference",
    requestedBackendProvider: input.request.requested_backend_provider,
    env: input.env,
  });

  if (trace.admission_status !== "admitted_shadow_only") {
    const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
      status: trace.admission_status,
      mode,
    })}`;
    const packet = buildLaneObservationPacket({
      turnId,
      iteration,
      status: "blocked",
      summary: `Workstation tool reference lane blocked: ${trace.blocked_reason ?? "not_admitted"}.`,
      observationRef,
      backendSelectionDecision: trace.backend_selection_decision,
      mode,
    });
    return {
      schema: HELIX_WORKSTATION_TOOL_REFERENCE_LIST_RESULT_SCHEMA,
      ok: false,
      lane_id: "workstation_tool_reference",
      capability: CAPABILITY_ID,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        status: "not_executed_shadow_only",
        blockedReason: trace.blocked_reason,
      }),
      observation: null,
      observation_packet: packet,
      artifact_refs: packet.produced_artifact_refs,
      error: trace.blocked_reason ?? "workstation_tool_reference_lane_blocked",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const manifest = listWorkstationGatewayCapabilities({
    agentRuntime: input.provider.id,
    mode: mode as HelixWorkstationGatewayMode,
  });
  const capabilities = summarizeCapabilities(manifest.capabilities);
  const capabilityIds = capabilities.map((capability) => capability.capability_id);
  const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
    runtime: input.provider.id,
    mode,
    capabilityIds,
  })}`;
  const observation: HelixWorkstationToolReferenceListObservation = {
    schema: HELIX_WORKSTATION_TOOL_REFERENCE_LIST_OBSERVATION_SCHEMA,
    observation_id: `${turnId}:workstation_tool_reference:observation`,
    observation_ref: observationRef,
    lane_id: "workstation_tool_reference",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    requested_backend_provider: trace.requested_backend_provider,
    selected_backend_provider: trace.selected_backend_provider,
    selection_reason: trace.selection_reason,
    backend_selection_decision: trace.backend_selection_decision,
    gateway_manifest_version: manifest.manifest_version,
    gateway_mode: manifest.mode,
    capability_count: capabilities.length,
    capability_ids: capabilityIds,
    capabilities,
    deterministic: true,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const packet = buildLaneObservationPacket({
    turnId,
    iteration,
    status: "succeeded",
    summary: `Workstation gateway catalog ready: ${capabilities.length} capabilities.`,
    observationRef,
    backendSelectionDecision: trace.backend_selection_decision,
    mode,
  });

  return {
    schema: HELIX_WORKSTATION_TOOL_REFERENCE_LIST_RESULT_SCHEMA,
    ok: true,
    lane_id: "workstation_tool_reference",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace,
      observationRef,
      status: "executed_observation_only",
    }),
    observation,
    observation_packet: packet,
    artifact_refs: packet.produced_artifact_refs,
    capability_count: capabilities.length,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
