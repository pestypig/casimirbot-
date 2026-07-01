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
  HELIX_UTILITY_TEXT_NORMALIZE_OBSERVATION_SCHEMA,
  HELIX_UTILITY_TEXT_NORMALIZE_RESULT_SCHEMA,
  type HelixUtilityTextNormalizeMode,
  type HelixUtilityTextNormalizeObservation,
  type HelixUtilityTextNormalizeRequest,
  type HelixUtilityTextNormalizeResult,
} from "@shared/helix-utility-text-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import { resolveHelixCapabilityLaneRequest } from "./registry";

const CAPABILITY_ID = "utility_text.normalize_text" as const;

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const normalizeMode = (value: unknown): HelixUtilityTextNormalizeMode => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    normalized === "compact_whitespace" ||
    normalized === "lowercase" ||
    normalized === "trim" ||
    normalized === "sentence_case"
  ) {
    return normalized;
  }
  return "compact_whitespace";
};

const compactWhitespace = (text: string): string =>
  text.replace(/\s+/g, " ").trim();

const normalizeText = (input: {
  text: string;
  mode: HelixUtilityTextNormalizeMode;
}): string => {
  switch (input.mode) {
    case "trim":
      return input.text.trim();
    case "lowercase":
      return compactWhitespace(input.text).toLowerCase();
    case "sentence_case": {
      const compacted = compactWhitespace(input.text);
      if (!compacted) return "";
      return compacted.charAt(0).toUpperCase() + compacted.slice(1);
    }
    case "compact_whitespace":
      return compactWhitespace(input.text);
  }
};

const buildLaneObservationPacket = (input: {
  turnId: string;
  iteration: number;
  status: HelixAgentStepObservationPacket["status"];
  summary: string;
  observationRef: string;
  backendSelectionDecision: HelixCapabilityLaneBackendSelectionDecision;
  mode: HelixUtilityTextNormalizeMode;
  missingRequirements?: HelixAgentStepObservationPacket["missing_requirements"];
}): HelixAgentStepObservationPacket => ({
  schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  turn_id: input.turnId,
  iteration: input.iteration,
  call_id: `${input.turnId}:capability_lane:${CAPABILITY_ID}:call`,
  decision_id: `${input.turnId}:capability_lane:${CAPABILITY_ID}:decision`,
  capability_key: CAPABILITY_ID,
  panel_id: "capability_lane",
  action: "normalize_text",
  status: input.status,
  produced_artifact_refs: [input.observationRef],
  observation_summary: input.summary,
  receipts: [],
  missing_requirements: input.missingRequirements ?? [],
  backend_selection_decision: input.backendSelectionDecision,
  state_delta: {
    utility_text_normalization: {
      normalization_mode: input.mode,
      observation_ref: input.observationRef,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
  },
  suggested_next_steps:
    input.status === "succeeded"
      ? ["answer", "use_another_tool"]
      : input.status === "missing_input"
        ? ["ask_user", "repair"]
        : ["repair", "fail_closed"],
  produced_affordances: [],
  consumed_affordances: [],
  typed_handoff_contract: {
    schema: "helix.workstation_typed_handoff_contract.v1",
    producer_capability: CAPABILITY_ID,
    consumer_capability: null,
    required_affordance_kinds: [],
    produced_affordance_kinds: ["text_evidence"],
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

export const runUtilityTextNormalizeText = (input: {
  provider: HelixAgentProvider;
  request: HelixUtilityTextNormalizeRequest;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixUtilityTextNormalizeResult => {
  const turnId = input.turnId?.trim() || input.request.turn_id?.trim() || "ask:lane:utility_text";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const sourceText = readText(input.request.text);
  const mode = normalizeMode(input.request.normalization_mode);
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: "utility_text",
    requestedBackendProvider: input.request.requested_backend_provider,
    env: input.env,
  });

  if (!sourceText.trim()) {
    const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
      status: "missing_text",
      mode,
    })}`;
    const packet = buildLaneObservationPacket({
      turnId,
      iteration,
      status: "missing_input",
      summary: "Utility text normalization missing required text.",
      observationRef,
      backendSelectionDecision: trace.backend_selection_decision,
      mode,
      missingRequirements: [{
        code: "missing_text",
        message: "utility_text.normalize_text requires non-empty text.",
        repair_action: "provide_text",
      }],
    });
    return {
      schema: HELIX_UTILITY_TEXT_NORMALIZE_RESULT_SCHEMA,
      ok: false,
      lane_id: "utility_text",
      capability: CAPABILITY_ID,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        status: "not_executed_shadow_only",
        blockedReason: "missing_text",
      }),
      observation: null,
      observation_packet: packet,
      artifact_refs: packet.produced_artifact_refs,
      error: "missing_text",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (trace.admission_status !== "admitted_shadow_only") {
    const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
      status: trace.admission_status,
      mode,
    })}`;
    const packet = buildLaneObservationPacket({
      turnId,
      iteration,
      status: "blocked",
      summary: `Utility text lane blocked: ${trace.blocked_reason ?? "not_admitted"}.`,
      observationRef,
      backendSelectionDecision: trace.backend_selection_decision,
      mode,
    });
    return {
      schema: HELIX_UTILITY_TEXT_NORMALIZE_RESULT_SCHEMA,
      ok: false,
      lane_id: "utility_text",
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
      error: trace.blocked_reason ?? "utility_text_lane_blocked",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const normalizedText = normalizeText({ text: sourceText, mode });
  const observationRef = `${turnId}:capability_lane:${CAPABILITY_ID}:${hashShort({
    sourceText,
    mode,
    normalizedText,
  })}`;
  const observation: HelixUtilityTextNormalizeObservation = {
    schema: HELIX_UTILITY_TEXT_NORMALIZE_OBSERVATION_SCHEMA,
    observation_id: `${turnId}:utility_text:observation`,
    observation_ref: observationRef,
    lane_id: "utility_text",
    capability: CAPABILITY_ID,
    selected_runtime_agent_provider: input.provider.id,
    requested_backend_provider: trace.requested_backend_provider,
    selected_backend_provider: trace.selected_backend_provider,
    selection_reason: trace.selection_reason,
    backend_selection_decision: trace.backend_selection_decision,
    normalization_mode: mode,
    source_text_hash: hashShort(sourceText),
    source_text_char_count: sourceText.length,
    normalized_text: normalizedText,
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
    summary: `Utility text normalization ready: ${mode}.`,
    observationRef,
    backendSelectionDecision: trace.backend_selection_decision,
    mode,
  });

  return {
    schema: HELIX_UTILITY_TEXT_NORMALIZE_RESULT_SCHEMA,
    ok: true,
    lane_id: "utility_text",
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
    normalized_text: normalizedText,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
