import crypto from "node:crypto";
import {
  HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  type HelixAgentStepObservationPacket,
} from "@shared/helix-agent-step-observation-packet";
import type { HelixCapabilityLaneId, HelixCapabilityLaneResolveTrace } from "@shared/helix-capability-lane";
import {
  HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA,
  type HelixLiveTranslationOneShotRequest,
  type HelixLiveTranslationOneShotResult,
} from "@shared/helix-live-translation-lane";
import {
  HELIX_UTILITY_TEXT_NORMALIZE_REQUEST_SCHEMA,
  type HelixUtilityTextNormalizeRequest,
  type HelixUtilityTextNormalizeResult,
} from "@shared/helix-utility-text-lane";
import {
  HELIX_WORKSTATION_TOOL_REFERENCE_LIST_REQUEST_SCHEMA,
  type HelixWorkstationToolReferenceListRequest,
  type HelixWorkstationToolReferenceListResult,
} from "@shared/helix-workstation-tool-reference-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import { runLiveTranslationTranslateText } from "./live-translation";
import { resolveHelixCapabilityLaneRequest } from "./registry";
import { runUtilityTextNormalizeText } from "./utility-text";
import { runWorkstationToolReferenceListCapabilities } from "./workstation-tool-reference";

type RecordLike = Record<string, unknown>;

export type HelixCapabilityLaneShadowOneShotResult = {
  schema: "helix.capability_lane.shadow_one_shot_result.v1";
  ok: false;
  lane_id: HelixCapabilityLaneId;
  capability: string;
  selected_runtime_agent_provider: HelixAgentProvider["id"];
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  observation: null;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  error: string;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneOneShotCallResult =
  | HelixLiveTranslationOneShotResult
  | HelixUtilityTextNormalizeResult
  | HelixWorkstationToolReferenceListResult
  | HelixCapabilityLaneShadowOneShotResult;

export type HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: string;
  laneId: HelixCapabilityLaneId;
  run(input: {
    provider: HelixAgentProvider;
    call: RecordLike;
    turnId: string | null;
    iteration?: number | null;
    env?: NodeJS.ProcessEnv;
  }): HelixCapabilityLaneOneShotCallResult;
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const readHelixCapabilityLaneCallCapability = (call: RecordLike): string =>
  readString(call.capability ?? call.capability_id ?? call.capabilityId);

const buildShadowObservationPacket = (input: {
  turnId: string;
  iteration: number;
  capability: string;
  laneId: HelixCapabilityLaneId;
  observationRef: string;
  summary: string;
  error: string;
}): HelixAgentStepObservationPacket => ({
  schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  turn_id: input.turnId,
  iteration: input.iteration,
  call_id: `${input.turnId}:capability_lane:${input.capability}:call`,
  decision_id: `${input.turnId}:capability_lane:${input.capability}:decision`,
  capability_key: input.capability,
  panel_id: "capability_lane",
  action: input.capability.split(".").at(-1) || input.capability,
  status: "blocked",
  produced_artifact_refs: [input.observationRef],
  observation_summary: input.summary,
  receipts: [],
  missing_requirements: [{
    code: input.error,
    message: `${input.capability} is represented in the provider-neutral lane catalog but is not executable in this deterministic slice.`,
    repair_action: "use_configured_lane_backend_or_supported_capability",
  }],
  state_delta: {
    capability_lane_shadow_execution: {
      lane_id: input.laneId,
      capability: input.capability,
      execution_status: "not_executed_shadow_only",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
  },
  suggested_next_steps: ["repair", "use_another_tool"],
  produced_affordances: [],
  consumed_affordances: [],
  typed_handoff_contract: {
    schema: "helix.workstation_typed_handoff_contract.v1",
    producer_capability: input.capability,
    consumer_capability: null,
    required_affordance_kinds: [],
    produced_affordance_kinds: [],
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

const buildShadowResult = (input: {
  provider: HelixAgentProvider;
  laneId: HelixCapabilityLaneId;
  capability: string;
  requestedBackendProvider: string | null;
  turnId: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixCapabilityLaneShadowOneShotResult => {
  const turnId = input.turnId || "ask:lane:shadow";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: input.laneId,
    requestedBackendProvider: input.requestedBackendProvider,
    env: input.env,
  });
  const observationRef = `${turnId}:capability_lane:${input.capability}:${hashShort({
    laneId: input.laneId,
    capability: input.capability,
    trace,
  })}`;
  const error = trace.admission_status === "admitted_shadow_only"
    ? "capability_lane_shadow_only_not_executed"
    : trace.blocked_reason ?? "capability_lane_not_admitted";
  const packet = buildShadowObservationPacket({
    turnId,
    iteration,
    capability: input.capability,
    laneId: input.laneId,
    observationRef,
    summary: `${input.capability} is cataloged on ${input.laneId} but did not execute; lane output remains non-terminal.`,
    error,
  });
  return {
    schema: "helix.capability_lane.shadow_one_shot_result.v1",
    ok: false,
    lane_id: input.laneId,
    capability: input.capability,
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: {
      ...trace,
      result_ref: observationRef,
      observation_ref: observationRef,
      execution_status: "not_executed_shadow_only",
      blocked_reason: error,
    },
    observation: null,
    observation_packet: packet,
    artifact_refs: packet.produced_artifact_refs,
    error,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const toLiveTranslationRequest = (
  call: RecordLike,
  turnId: string | null,
): HelixLiveTranslationOneShotRequest | null => {
  const capability = readHelixCapabilityLaneCallCapability(call);
  if (capability !== "live_translation.translate_text") return null;
  return {
    schema: HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA,
    capability: "live_translation.translate_text",
    text: readString(call.text),
    source_language: readString(call.source_language ?? call.sourceLanguage) || null,
    target_language: readString(call.target_language ?? call.targetLanguage),
    requested_backend_provider:
      readString(call.requested_backend_provider ?? call.requestedBackendProvider) || null,
    turn_id: readString(call.turn_id ?? call.turnId) || turnId,
    source_id: readString(call.source_id ?? call.sourceId) || null,
    chunk_id: readString(call.chunk_id ?? call.chunkId) || null,
    chunk_index: typeof call.chunk_index === "number" ? call.chunk_index : null,
    dedupe_key: readString(call.dedupe_key ?? call.dedupeKey) || null,
    source_event_ms: typeof call.source_event_ms === "number" ? call.source_event_ms : null,
    projection_target: readString(call.projection_target ?? call.projectionTarget) as HelixLiveTranslationOneShotRequest["projection_target"] || null,
    cancel_requested: call.cancel_requested === true || call.cancelRequested === true,
    assistant_answer: false,
    terminal_eligible: false,
  };
};

const toUtilityTextNormalizeRequest = (
  call: RecordLike,
  turnId: string | null,
): HelixUtilityTextNormalizeRequest | null => {
  const capability = readHelixCapabilityLaneCallCapability(call);
  if (capability !== "utility_text.normalize_text") return null;
  return {
    schema: HELIX_UTILITY_TEXT_NORMALIZE_REQUEST_SCHEMA,
    capability: "utility_text.normalize_text",
    text: readString(call.text),
    normalization_mode:
      readString(call.normalization_mode ?? call.normalizationMode) as HelixUtilityTextNormalizeRequest["normalization_mode"] || null,
    requested_backend_provider:
      readString(call.requested_backend_provider ?? call.requestedBackendProvider) || null,
    turn_id: readString(call.turn_id ?? call.turnId) || turnId,
    assistant_answer: false,
    terminal_eligible: false,
  };
};

const toWorkstationToolReferenceListRequest = (
  call: RecordLike,
  turnId: string | null,
): HelixWorkstationToolReferenceListRequest | null => {
  const capability = readHelixCapabilityLaneCallCapability(call);
  if (capability !== "workstation_tool_reference.list_capabilities") return null;
  return {
    schema: HELIX_WORKSTATION_TOOL_REFERENCE_LIST_REQUEST_SCHEMA,
    capability: "workstation_tool_reference.list_capabilities",
    mode: readString(call.mode) as HelixWorkstationToolReferenceListRequest["mode"] || null,
    requested_backend_provider:
      readString(call.requested_backend_provider ?? call.requestedBackendProvider) || null,
    turn_id: readString(call.turn_id ?? call.turnId) || turnId,
    assistant_answer: false,
    terminal_eligible: false,
  };
};

const liveTranslationHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "live_translation.",
  laneId: "live_translation",
  run(input) {
    const request = toLiveTranslationRequest(input.call, input.turnId);
    if (!request) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "live_translation",
        capability: readHelixCapabilityLaneCallCapability(input.call) || "live_translation.unknown",
        requestedBackendProvider: readString(input.call.requested_backend_provider ?? input.call.requestedBackendProvider) || null,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    return runLiveTranslationTranslateText({
      provider: input.provider,
      request,
      turnId: input.turnId,
      iteration: input.iteration,
      env: input.env,
    });
  },
};

const utilityTextHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "utility_text.",
  laneId: "utility_text",
  run(input) {
    const request = toUtilityTextNormalizeRequest(input.call, input.turnId);
    if (!request) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "utility_text",
        capability: readHelixCapabilityLaneCallCapability(input.call) || "utility_text.unknown",
        requestedBackendProvider: readString(input.call.requested_backend_provider ?? input.call.requestedBackendProvider) || null,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    return runUtilityTextNormalizeText({
      provider: input.provider,
      request,
      turnId: input.turnId,
      iteration: input.iteration,
      env: input.env,
    });
  },
};

const workstationToolReferenceHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "workstation_tool_reference.",
  laneId: "workstation_tool_reference",
  run(input) {
    const request = toWorkstationToolReferenceListRequest(input.call, input.turnId);
    if (!request) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability: readHelixCapabilityLaneCallCapability(input.call) || "workstation_tool_reference.unknown",
        requestedBackendProvider: readString(input.call.requested_backend_provider ?? input.call.requestedBackendProvider) || null,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    return runWorkstationToolReferenceListCapabilities({
      provider: input.provider,
      request,
      turnId: input.turnId,
      iteration: input.iteration,
      env: input.env,
    });
  },
};

const shadowHandler = (
  laneId: HelixCapabilityLaneId,
  capabilityPrefix: string,
): HelixCapabilityLaneOneShotHandler => ({
  capabilityPrefix,
  laneId,
  run(input) {
    return buildShadowResult({
      provider: input.provider,
      laneId,
      capability: readHelixCapabilityLaneCallCapability(input.call) || `${capabilityPrefix}unknown`,
      requestedBackendProvider: readString(input.call.requested_backend_provider ?? input.call.requestedBackendProvider) || null,
      turnId: input.turnId,
      iteration: input.iteration,
      env: input.env,
    });
  },
});

export const HELIX_CAPABILITY_LANE_ONE_SHOT_HANDLERS: HelixCapabilityLaneOneShotHandler[] = [
  liveTranslationHandler,
  utilityTextHandler,
  shadowHandler("interactive_text", "interactive_text."),
  shadowHandler("deliberate_text", "deliberate_text."),
  shadowHandler("code_text", "code_text."),
  shadowHandler("speech_to_text", "speech_to_text."),
  shadowHandler("text_to_speech", "text_to_speech."),
  shadowHandler("visual_analysis", "visual_analysis."),
  workstationToolReferenceHandler,
];

export const resolveHelixCapabilityLaneOneShotHandler = (
  capability: string,
): HelixCapabilityLaneOneShotHandler | null =>
  HELIX_CAPABILITY_LANE_ONE_SHOT_HANDLERS.find((handler) => capability.startsWith(handler.capabilityPrefix)) ?? null;
