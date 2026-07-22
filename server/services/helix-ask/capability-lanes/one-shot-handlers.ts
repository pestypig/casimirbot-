import crypto from "node:crypto";
import {
  HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  type HelixAgentStepObservationPacket,
} from "@shared/helix-agent-step-observation-packet";
import type { HelixCapabilityLaneId, HelixCapabilityLaneResolveTrace } from "@shared/helix-capability-lane";
import {
  HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA,
  type HelixVisibleTranslationTargetCollectorCapability,
  type HelixLiveTranslationOneShotRequest,
  type HelixLiveTranslationOneShotResult,
} from "@shared/helix-live-translation-lane";
import {
  HELIX_UTILITY_TEXT_NORMALIZE_REQUEST_SCHEMA,
  type HelixUtilityTextNormalizeRequest,
  type HelixUtilityTextNormalizeResult,
} from "@shared/helix-utility-text-lane";
import {
  HELIX_TEXT_TO_SPEECH_ONE_SHOT_REQUEST_SCHEMA,
  type HelixTextToSpeechOneShotRequest,
  type HelixTextToSpeechOneShotResult,
} from "@shared/helix-text-to-speech-lane";
import {
  HELIX_SPEECH_TO_TEXT_ONE_SHOT_REQUEST_SCHEMA,
  type HelixSpeechToTextOneShotRequest,
  type HelixSpeechToTextOneShotResult,
} from "@shared/helix-speech-to-text-lane";
import {
  HELIX_WORKSTATION_TOOL_REFERENCE_LIST_REQUEST_SCHEMA,
  HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_REQUEST_SCHEMA,
  type HelixWorkstationToolReferenceListRequest,
  type HelixWorkstationToolReferenceListResult,
  type HelixWorkstationToolReferenceVisibleTranslationTargetsRequest,
  type HelixWorkstationToolReferenceVisibleTranslationTargetsResult,
} from "@shared/helix-workstation-tool-reference-lane";
import {
  IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
  IMAGE_LENS_REGION_INSPECTION_REQUEST_SCHEMA,
  type ImageLensRegionInspectionRequestV1,
  type ImageLensRegionInspectionResultV1,
} from "@shared/contracts/image-lens-region-inspection.v1";
import type { DocumentImageBboxPxV1 } from "@shared/contracts/document-image-region-receipt.v1";
import { HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY } from "@shared/helix-paper-evidence-enrichment";
import {
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
} from "@shared/helix-scholarly-research-observation";
import type { HelixAgentProvider } from "../agent-providers/types";
import { callWorkstationGatewayCapability } from "../workstation-tool-gateway/registry";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import type { HelixWorkstationCapabilityManifest } from "../workstation-tool-gateway/types";
import { runImageLensRegionInspection } from "./image-lens-region-inspection";
import { runLiveTranslationTranslateText } from "./live-translation";
import { resolveHelixCapabilityLaneRequest } from "./registry";
import { runSpeechToTextTranscribeAudio } from "./speech-to-text";
import { runTextToSpeechSpeakText } from "./text-to-speech";
import { runUtilityTextNormalizeText } from "./utility-text";
import {
  runWorkstationToolReferenceCollectVisibleTranslationTargets,
  runWorkstationToolReferenceListCapabilities,
  runWorkstationToolReferenceTheoryContextReflection,
  type HelixWorkstationTheoryContextReflectionBridgeResult,
} from "./workstation-tool-reference";

type RecordLike = Record<string, unknown>;

export type HelixCapabilityLaneShadowOneShotResult = {
  schema: "helix.capability_lane.shadow_one_shot_result.v1";
  ok: false;
  lane_id: HelixCapabilityLaneId | string;
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

export type HelixWorkstationPaperEvidenceEnrichmentBridgeResult = {
  schema: "helix.workstation_tool_reference.gateway_bridge_result.v1";
  ok: boolean;
  lane_id: "workstation_tool_reference";
  capability: typeof HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY;
  delegated_capability_id: typeof HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY;
  delegation_status: "gateway_executed";
  selected_runtime_agent_provider: HelixAgentProvider["id"];
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  delegated_gateway_call_result: HelixWorkstationGatewayCallResult;
  gateway_admission: HelixWorkstationGatewayCallResult["gateway_admission"];
  tool_lifecycle_trace: HelixWorkstationGatewayCallResult["tool_lifecycle_trace"];
  tool_followup_decision: HelixWorkstationGatewayCallResult["tool_followup_decision"];
  observation: unknown;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  error?: string;
  reentry_required: true;
  answer_authority: false;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

type HelixScholarlyResearchGatewayCapability =
  | typeof HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY
  | typeof HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY
  | typeof HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY;

const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const DOCS_SEARCH_CAPABILITY = "docs.search" as const;
const DOCS_OPEN_CAPABILITY = "docs-viewer.open_doc" as const;

type HelixDocsGatewayCapability =
  | typeof DOCS_SEARCH_CAPABILITY
  | typeof DOCS_OPEN_CAPABILITY;

export type HelixWorkstationCalculatorGatewayBridgeResult = {
  schema: "helix.workstation_tool_reference.gateway_bridge_result.v1";
  ok: boolean;
  lane_id: "workstation_tool_reference";
  capability: typeof CALCULATOR_SOLVE_EXPRESSION_CAPABILITY;
  delegated_capability_id: typeof CALCULATOR_SOLVE_EXPRESSION_CAPABILITY;
  delegation_status: "gateway_executed";
  selected_runtime_agent_provider: HelixAgentProvider["id"];
  arguments: Record<string, unknown>;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  delegated_gateway_call_result: HelixWorkstationGatewayCallResult;
  gateway_admission: HelixWorkstationGatewayCallResult["gateway_admission"];
  tool_lifecycle_trace: HelixWorkstationGatewayCallResult["tool_lifecycle_trace"];
  tool_followup_decision: HelixWorkstationGatewayCallResult["tool_followup_decision"];
  observation: unknown;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  error?: string;
  reentry_required: true;
  answer_authority: false;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationScholarlyResearchGatewayBridgeResult = {
  schema: "helix.workstation_tool_reference.gateway_bridge_result.v1";
  ok: boolean;
  lane_id: "workstation_tool_reference";
  capability: HelixScholarlyResearchGatewayCapability;
  delegated_capability_id: HelixScholarlyResearchGatewayCapability;
  delegation_status: "gateway_executed";
  selected_runtime_agent_provider: HelixAgentProvider["id"];
  arguments: Record<string, unknown>;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  delegated_gateway_call_result: HelixWorkstationGatewayCallResult;
  gateway_admission: HelixWorkstationGatewayCallResult["gateway_admission"];
  tool_lifecycle_trace: HelixWorkstationGatewayCallResult["tool_lifecycle_trace"];
  tool_followup_decision: HelixWorkstationGatewayCallResult["tool_followup_decision"];
  observation: unknown;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  error?: string;
  reentry_required: true;
  answer_authority: false;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationDocsGatewayBridgeResult = {
  schema: "helix.workstation_tool_reference.gateway_bridge_result.v1";
  ok: boolean;
  lane_id: "workstation_tool_reference";
  capability: HelixDocsGatewayCapability;
  delegated_capability_id: HelixDocsGatewayCapability;
  delegation_status: "gateway_executed";
  selected_runtime_agent_provider: HelixAgentProvider["id"];
  arguments: Record<string, unknown>;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  delegated_gateway_call_result: HelixWorkstationGatewayCallResult;
  gateway_admission: HelixWorkstationGatewayCallResult["gateway_admission"];
  tool_lifecycle_trace: HelixWorkstationGatewayCallResult["tool_lifecycle_trace"];
  tool_followup_decision: HelixWorkstationGatewayCallResult["tool_followup_decision"];
  observation: unknown;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  error?: string;
  reentry_required: true;
  answer_authority: false;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixWorkstationGovernedGatewayBridgeResult = {
  schema: "helix.workstation_tool_reference.gateway_bridge_result.v1";
  ok: boolean;
  lane_id: "workstation_tool_reference";
  capability: string;
  delegated_capability_id: string;
  delegation_status: "gateway_executed";
  selected_runtime_agent_provider: HelixAgentProvider["id"];
  arguments: Record<string, unknown>;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  delegated_gateway_call_result: HelixWorkstationGatewayCallResult;
  gateway_admission: HelixWorkstationGatewayCallResult["gateway_admission"];
  tool_lifecycle_trace: HelixWorkstationGatewayCallResult["tool_lifecycle_trace"];
  tool_followup_decision: HelixWorkstationGatewayCallResult["tool_followup_decision"];
  observation: unknown;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  error?: string;
  reentry_required: true;
  answer_authority: false;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneOneShotCallResult =
  | HelixLiveTranslationOneShotResult
  | HelixSpeechToTextOneShotResult
  | HelixTextToSpeechOneShotResult
  | HelixUtilityTextNormalizeResult
  | HelixWorkstationToolReferenceListResult
  | HelixWorkstationToolReferenceVisibleTranslationTargetsResult
  | HelixWorkstationTheoryContextReflectionBridgeResult
  | HelixWorkstationPaperEvidenceEnrichmentBridgeResult
  | HelixWorkstationCalculatorGatewayBridgeResult
  | HelixWorkstationScholarlyResearchGatewayBridgeResult
  | HelixWorkstationDocsGatewayBridgeResult
  | HelixWorkstationGovernedGatewayBridgeResult
  | ImageLensRegionInspectionResultV1
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
    authorizedGatewayCapability?: HelixWorkstationCapabilityManifest | null;
    accountType?: "developer" | "user" | null;
    profileId?: string | null;
  }): HelixCapabilityLaneOneShotCallResult | Promise<HelixCapabilityLaneOneShotCallResult>;
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readNowMs = (call: RecordLike): number | null =>
  readNumber(call.now_ms ?? call.nowMs);

export const readHelixCapabilityLaneCallCapability = (call: RecordLike): string =>
  readString(call.capability ?? call.capability_id ?? call.capabilityId);

const buildShadowObservationPacket = (input: {
  turnId: string;
  iteration: number;
  capability: string;
  laneId: HelixCapabilityLaneId | string;
  observationRef: string;
  summary: string;
  error: string;
  trace: HelixCapabilityLaneResolveTrace;
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
    message: input.trace.lane_status === "unknown"
      ? `${input.capability} does not match a known provider-neutral capability lane.`
      : `${input.capability} is represented in the provider-neutral lane catalog but is not executable in this deterministic slice.`,
    repair_action: "use_configured_lane_backend_or_supported_capability",
  }],
  backend_selection_decision: input.trace.backend_selection_decision,
  state_delta: {
    capability_lane_shadow_execution: {
      lane_id: input.laneId as HelixCapabilityLaneId,
      capability: input.capability,
      requested_backend_provider: input.trace.requested_backend_provider,
      requested_backend_provider_known: input.trace.requested_backend_provider_known,
      selected_backend_provider: input.trace.selected_backend_provider,
      backend_selection_decision: input.trace.backend_selection_decision,
      selection_reason: input.trace.selection_reason,
      availability_status: input.trace.availability_status,
      permission_status: input.trace.permission_status,
      cost_class: input.trace.cost_class,
      latency_class: input.trace.latency_class,
      privacy_class: input.trace.privacy_class,
      fallback_backend_provider: input.trace.fallback_backend_provider,
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
  laneId: HelixCapabilityLaneId | string;
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
    summary: trace.lane_status === "unknown"
      ? `${input.capability} did not match a known capability lane; the request was blocked and remains non-terminal.`
      : `${input.capability} is cataloged on ${input.laneId} but did not execute; lane output remains non-terminal.`,
    error,
    trace,
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

export const inferHelixCapabilityLaneFromCapability = (capability: string): string | null => {
  const normalized = readString(capability);
  if (!normalized) return null;
  const [prefix] = normalized.split(".");
  return readString(prefix) || null;
};

export const buildUnknownHelixCapabilityLaneOneShotResult = (input: {
  provider: HelixAgentProvider;
  call: RecordLike;
  turnId: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixCapabilityLaneShadowOneShotResult => {
  const capability = readHelixCapabilityLaneCallCapability(input.call) || "unknown_capability_lane.unknown";
  return buildShadowResult({
    provider: input.provider,
    laneId: inferHelixCapabilityLaneFromCapability(capability) ?? "unknown",
    capability,
    requestedBackendProvider:
      readString(input.call.requested_backend_provider ?? input.call.requestedBackendProvider) || null,
    turnId: input.turnId,
    iteration: input.iteration,
    env: input.env,
  });
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
    lane_session_id: readString(call.lane_session_id ?? call.laneSessionId) || null,
    session_control_key: readString(call.session_control_key ?? call.sessionControlKey) || null,
    source_binding_key: readString(call.source_binding_key ?? call.sourceBindingKey) || null,
    source_identity_key: readString(call.source_identity_key ?? call.sourceIdentityKey) || null,
    latest_observation_key: readString(call.latest_observation_key ?? call.latestObservationKey) || null,
    latest_mail_loop_observation_key:
      readString(call.latest_mail_loop_observation_key ?? call.latestMailLoopObservationKey) || null,
    goal_binding_id: readString(call.goal_binding_id ?? call.goalBindingId) || null,
    goal_binding_key: readString(call.goal_binding_key ?? call.goalBindingKey) || null,
    source_id: readString(call.source_id ?? call.sourceId) || null,
    panel_id: readString(call.panel_id ?? call.panelId) || null,
    region_id: readString(call.region_id ?? call.regionId) || null,
    bbox: readRecord(call.bbox ?? call.bbox_px ?? call.bboxPx),
    doc_path: readString(call.doc_path ?? call.docPath) || null,
    document_source_kind:
      readString(call.document_source_kind ?? call.documentSourceKind) as HelixLiveTranslationOneShotRequest["document_source_kind"] || null,
    document_ref: readString(call.document_ref ?? call.documentRef) || null,
    private_source: call.private_source === true || call.privateSource === true,
    source_hash: readString(call.source_hash ?? call.sourceHash) || null,
    source_kind: readString(call.source_kind ?? call.sourceKind) || null,
    source_text_hash: readString(call.source_text_hash ?? call.sourceTextHash) || null,
    source_text_char_count: readNumber(call.source_text_char_count ?? call.sourceTextCharCount),
    account_locale: readString(call.account_locale ?? call.accountLocale) || null,
    chunk_id: readString(call.chunk_id ?? call.chunkId) || null,
    chunk_index: readNumber(call.chunk_index ?? call.chunkIndex),
    dedupe_key: readString(call.dedupe_key ?? call.dedupeKey) || null,
    source_event_id: readString(call.source_event_id ?? call.sourceEventId) || null,
    source_event_ms: readNumber(call.source_event_ms ?? call.sourceEventMs),
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

const toTextToSpeechSpeakTextRequest = (
  call: RecordLike,
  turnId: string | null,
): HelixTextToSpeechOneShotRequest | null => {
  const capability = readHelixCapabilityLaneCallCapability(call);
  if (capability !== "text_to_speech.speak_text") return null;
  return {
    schema: HELIX_TEXT_TO_SPEECH_ONE_SHOT_REQUEST_SCHEMA,
    capability: "text_to_speech.speak_text",
    text: readString(call.text ?? call.message),
    voice: readString(call.voice) || null,
    profile: readString(call.profile ?? call.voice_profile ?? call.voiceProfile) || null,
    locale: readString(call.locale) || null,
    voice_playback_kind:
      readString(call.voice_playback_kind ?? call.voicePlaybackKind) as HelixTextToSpeechOneShotRequest["voice_playback_kind"] || null,
    requested_backend_provider:
      readString(call.requested_backend_provider ?? call.requestedBackendProvider) || null,
    turn_id: readString(call.turn_id ?? call.turnId) || turnId,
    thread_id: readString(call.thread_id ?? call.threadId) || null,
    source_observation_ref:
      readString(call.source_observation_ref ?? call.sourceObservationRef) || null,
    assistant_answer: false,
    terminal_eligible: false,
  };
};

const toSpeechToTextTranscribeAudioRequest = (
  call: RecordLike,
  turnId: string | null,
): HelixSpeechToTextOneShotRequest | null => {
  const capability = readHelixCapabilityLaneCallCapability(call);
  if (capability !== "speech_to_text.transcribe_audio") return null;
  return {
    schema: HELIX_SPEECH_TO_TEXT_ONE_SHOT_REQUEST_SCHEMA,
    capability: "speech_to_text.transcribe_audio",
    transcript_text: readString(call.transcript_text ?? call.transcriptText ?? call.text) || null,
    audio_ref: readString(call.audio_ref ?? call.audioRef) || null,
    audio_hash: readString(call.audio_hash ?? call.audioHash) || null,
    language: readString(call.language ?? call.source_language ?? call.sourceLanguage) || null,
    locale: readString(call.locale) || null,
    confidence: typeof call.confidence === "number" ? call.confidence : null,
    requested_backend_provider:
      readString(call.requested_backend_provider ?? call.requestedBackendProvider) || null,
    turn_id: readString(call.turn_id ?? call.turnId) || turnId,
    thread_id: readString(call.thread_id ?? call.threadId) || null,
    room_id: readString(call.room_id ?? call.roomId) || null,
    environment_id: readString(call.environment_id ?? call.environmentId) || null,
    source_id: readString(call.source_id ?? call.sourceId) || null,
    capture_session_id: readString(call.capture_session_id ?? call.captureSessionId) || null,
    chunk_id: readString(call.chunk_id ?? call.chunkId) || null,
    chunk_index: typeof call.chunk_index === "number" ? call.chunk_index : null,
    duration_ms: typeof call.duration_ms === "number" ? call.duration_ms : null,
    capture_source: readString(call.capture_source ?? call.captureSource) || null,
    source_event_ms: typeof call.source_event_ms === "number" ? call.source_event_ms : null,
    assistant_answer: false,
    terminal_eligible: false,
  };
};

const readBbox = (value: unknown): DocumentImageBboxPxV1 | null => {
  const record = readRecord(value);
  if (!record) return null;
  const x = readNumber(record.x);
  const y = readNumber(record.y);
  const width = readNumber(record.width);
  const height = readNumber(record.height);
  if (x === null || y === null || width === null || height === null) return null;
  return { x, y, width, height };
};

const inferRequestedEquationLabelFromExactBlockIntent = (value: string): string | null => {
  const positiveTarget = value.split(/\b(?:excluding|exclude|without|but\s+not)\b/i, 1)[0] ?? "";
  const patterns = [
    /\b(?:equation(?:\s+block)?|block)\s+(?:labeled?\s*)?\(\s*([a-z0-9][a-z0-9._'-]*)\s*\)/i,
    /\blabeled?\s*\(\s*([a-z0-9][a-z0-9._'-]*)\s*\)/i,
  ];
  for (const pattern of patterns) {
    const match = positiveTarget.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

const toImageLensRegionInspectionRequest = (
  call: RecordLike,
  turnId: string | null,
): ImageLensRegionInspectionRequestV1 | null => {
  const capability = readHelixCapabilityLaneCallCapability(call);
  if (capability !== IMAGE_LENS_REGION_INSPECTION_CAPABILITY) return null;
  const bbox =
    readBbox(call.bbox_px) ??
    readBbox(call.bboxPx) ??
    { x: 0, y: 0, width: 1, height: 1 };
  const explicitRequestedEquationLabel =
    readString(call.requested_equation_label ?? call.requestedEquationLabel) || null;
  const captureModeRaw = readString(call.equation_capture_mode ?? call.equationCaptureMode);
  const captureIntentText = [
    readString(call.question),
    readString(call.reason_for_crop ?? call.reasonForCrop),
    readString(call.region_label ?? call.regionLabel),
  ].filter(Boolean).join(" ");
  const equationCaptureMode: ImageLensRegionInspectionRequestV1["equation_capture_mode"] =
    captureModeRaw === "exact_block" || captureModeRaw === "exact_row" || captureModeRaw === "context"
      ? captureModeRaw
      : /\b(?:complete|entire|full|multi[-\s]?line|displayed)\b[^.!?;\n]{0,100}\b(?:equation|display)\s+block\b|\bequation\s+block\b/i.test(captureIntentText)
        ? "exact_block"
        : explicitRequestedEquationLabel
          ? "exact_row"
          : "context";
  const requestedEquationLabel = explicitRequestedEquationLabel ?? (
    equationCaptureMode === "exact_block"
      ? inferRequestedEquationLabelFromExactBlockIntent(captureIntentText)
      : null
  );
  return {
    schema: IMAGE_LENS_REGION_INSPECTION_REQUEST_SCHEMA,
    capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
    source_id: readString(call.source_id ?? call.sourceId),
    frame_id: readString(call.frame_id ?? call.frameId) || null,
    source_attachment_id:
      readString(call.source_attachment_id ?? call.sourceAttachmentId) || null,
    source_kind:
      readString(call.source_kind ?? call.sourceKind) as ImageLensRegionInspectionRequestV1["source_kind"] || null,
    source_image_ref:
      readString(call.source_image_ref ?? call.sourceImageRef) || null,
    page_number:
      readNumber(call.page_number ?? call.pageNumber),
    page_count:
      readNumber(call.page_count ?? call.pageCount),
    page_image_ref:
      readString(call.page_image_ref ?? call.pageImageRef) || null,
    scholarly_source_pdf_ref:
      readString(call.scholarly_source_pdf_ref ?? call.scholarlySourcePdfRef) || null,
    scholarly_pdf_cache_path:
      readString(call.scholarly_pdf_cache_path ?? call.scholarlyPdfCachePath) || null,
    source_dimensions_px: (
      readRecord(call.source_dimensions_px ?? call.sourceDimensionsPx) as ImageLensRegionInspectionRequestV1["source_dimensions_px"]
    ) ?? null,
    source_mount_only:
      call.source_mount_only === true || call.sourceMountOnly === true,
    bbox_px: bbox,
    crop_ref:
      readString(call.crop_ref ?? call.cropRef) || null,
    current_crop_ref:
      readString(call.current_crop_ref ?? call.currentCropRef) || null,
    crop_image_ref:
      readString(call.crop_image_ref ?? call.cropImageRef) || null,
    question: readString(call.question) || null,
    reason_for_crop:
      readString(call.reason_for_crop ?? call.reasonForCrop) || null,
    region_label:
      readString(call.region_label ?? call.regionLabel) || null,
    requested_equation_label: requestedEquationLabel,
    equation_capture_mode: equationCaptureMode,
    parent_region_id:
      readString(call.parent_region_id ?? call.parentRegionId) || null,
    detail:
      readString(call.detail) as ImageLensRegionInspectionRequestV1["detail"] || "auto",
    region_kind:
      readString(call.region_kind ?? call.regionKind) as ImageLensRegionInspectionRequestV1["region_kind"] || null,
    confidence: readNumber(call.confidence),
    summary: readString(call.summary) || null,
    text_candidate:
      readString(call.text_candidate ?? call.textCandidate) || null,
    latex_candidate:
      readString(call.latex_candidate ?? call.latexCandidate) || null,
    visual_layout_candidate: (
      readRecord(call.visual_layout_candidate ?? call.visualLayoutCandidate) as ImageLensRegionInspectionRequestV1["visual_layout_candidate"]
    ) ?? null,
    extraction_status:
      readString(call.extraction_status ?? call.extractionStatus) as ImageLensRegionInspectionRequestV1["extraction_status"] || null,
    table_candidate_ref:
      readString(call.table_candidate_ref ?? call.tableCandidateRef) || null,
    uncertainty: Array.isArray(call.uncertainty)
      ? call.uncertainty.map((entry) => readString(entry)).filter(Boolean)
      : [],
    requested_backend_provider:
      readString(call.requested_backend_provider ?? call.requestedBackendProvider) || null,
    turn_id: readString(call.turn_id ?? call.turnId) || turnId,
    thread_id: readString(call.thread_id ?? call.threadId) || null,
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

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readVisibleTranslationContext = (call: RecordLike): RecordLike | null =>
  readRecord(
    call.active_doc_visible_translation_context ??
    call.activeDocVisibleTranslationContext ??
    call.visible_translation_context ??
    call.visibleTranslationContext,
  );

const readVisibleTranslationContextChunks = (
  call: RecordLike,
  context: RecordLike | null,
): Array<Record<string, unknown>> | null => {
  const chunks = Array.isArray(call.visible_text_chunks)
    ? call.visible_text_chunks
    : Array.isArray(call.visibleTextChunks)
      ? call.visibleTextChunks
      : Array.isArray(context?.chunks)
        ? context.chunks
        : null;
  return chunks as Array<Record<string, unknown>> | null;
};

const readRecordArray = (value: unknown): Array<Record<string, unknown>> | null =>
  Array.isArray(value)
    ? value.filter((entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      )
    : null;

const isVisibleTranslationTargetCollectorCapability = (
  capability: string,
): capability is HelixVisibleTranslationTargetCollectorCapability =>
  capability === "workstation_tool_reference.collect_visible_translation_targets" ||
  capability === "workstation.visible_text.collect_translation_targets";

const toWorkstationToolReferenceVisibleTranslationTargetsRequest = (
  call: RecordLike,
  turnId: string | null,
): HelixWorkstationToolReferenceVisibleTranslationTargetsRequest | null => {
  const capability = readHelixCapabilityLaneCallCapability(call);
  if (!isVisibleTranslationTargetCollectorCapability(capability)) return null;
  const visibleContext = readVisibleTranslationContext(call);
  const chunks = readVisibleTranslationContextChunks(call, visibleContext);
  return {
    schema: HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_REQUEST_SCHEMA,
    capability: "workstation_tool_reference.collect_visible_translation_targets",
    requested_collector_capability: capability,
    active_panel_id:
      readString(call.active_panel_id ?? call.activePanelId) ||
      readString(visibleContext?.panel_id ?? visibleContext?.panelId) ||
      null,
    doc_path:
      readString(call.doc_path ?? call.docPath) ||
      readString(visibleContext?.doc_path ?? visibleContext?.docPath) ||
      null,
    source_hash:
      readString(call.source_hash ?? call.sourceHash) ||
      readString(visibleContext?.source_hash ?? visibleContext?.sourceHash) ||
      null,
    projection_target:
      readString(call.projection_target ?? call.projectionTarget) ||
      readString(visibleContext?.projection_target ?? visibleContext?.projectionTarget) ||
      null,
    account_locale:
      readString(call.account_locale ?? call.accountLocale) ||
      readString(visibleContext?.account_locale ?? visibleContext?.accountLocale) ||
      null,
    target_language:
      readString(call.target_language ?? call.targetLanguage) ||
      readString(visibleContext?.target_language ?? visibleContext?.targetLanguage) ||
      null,
    max_chunks: readNumber(call.max_chunks ?? call.maxChunks),
    visible_only: readBoolean(call.visible_only ?? call.visibleOnly),
    selected_text:
      readString(
        call.selected_text ??
        call.selectedText ??
        call.selection_text ??
        call.selectionText,
      ) || null,
    selection_ref:
      readString(call.selection_ref ?? call.selectionRef) || null,
    hover_text:
      readString(
        call.hover_text ??
        call.hoverText ??
        call.hover_region_text ??
        call.hoverRegionText ??
        call.active_region_text ??
        call.activeRegionText,
      ) || null,
    hover_ref:
      readString(
        call.hover_ref ??
        call.hoverRef ??
        call.active_region_ref ??
        call.activeRegionRef,
      ) || null,
    visible_text: readString(call.visible_text ?? call.visibleText ?? call.text) || null,
    title_text: readString(call.title_text ?? call.titleText) || null,
    body_text: readString(call.body_text ?? call.bodyText) || null,
    visible_text_chunks: chunks,
    ui_text_regions:
      readRecordArray(
        call.ui_text_regions ??
        call.uiTextRegions ??
        call.panel_text_regions ??
        call.panelTextRegions ??
        call.visible_ui_text_regions ??
        call.visibleUiTextRegions ??
        visibleContext?.ui_text_regions ??
        visibleContext?.uiTextRegions ??
        visibleContext?.panel_text_regions ??
        visibleContext?.panelTextRegions ??
        visibleContext?.visible_ui_text_regions ??
        visibleContext?.visibleUiTextRegions,
      ),
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
      nowMs: readNowMs(input.call),
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

const textToSpeechHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "text_to_speech.",
  laneId: "text_to_speech",
  run(input) {
    const request = toTextToSpeechSpeakTextRequest(input.call, input.turnId);
    if (!request) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "text_to_speech",
        capability: readHelixCapabilityLaneCallCapability(input.call) || "text_to_speech.unknown",
        requestedBackendProvider: readString(input.call.requested_backend_provider ?? input.call.requestedBackendProvider) || null,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    return runTextToSpeechSpeakText({
      provider: input.provider,
      request,
      turnId: input.turnId,
      iteration: input.iteration,
      env: input.env,
    });
  },
};

const speechToTextHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "speech_to_text.",
  laneId: "speech_to_text",
  run(input) {
    const request = toSpeechToTextTranscribeAudioRequest(input.call, input.turnId);
    if (!request) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "speech_to_text",
        capability: readHelixCapabilityLaneCallCapability(input.call) || "speech_to_text.unknown",
        requestedBackendProvider: readString(input.call.requested_backend_provider ?? input.call.requestedBackendProvider) || null,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    return runSpeechToTextTranscribeAudio({
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
    const visibleTargetsRequest = toWorkstationToolReferenceVisibleTranslationTargetsRequest(input.call, input.turnId);
    if (visibleTargetsRequest) {
      return runWorkstationToolReferenceCollectVisibleTranslationTargets({
        provider: input.provider,
        request: visibleTargetsRequest,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
        nowMs: readNowMs(input.call),
      });
    }
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

const theoryContextReflectionGatewayBridgeHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "helix_ask.reflect_theory_context",
  laneId: "workstation_tool_reference",
  run(input) {
    return runWorkstationToolReferenceTheoryContextReflection({
      provider: input.provider,
      call: input.call,
      turnId: input.turnId,
      iteration: input.iteration,
      env: input.env,
    });
  },
};

const paperEvidenceEnrichmentGatewayBridgeHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY,
  laneId: "workstation_tool_reference",
  async run(input) {
    const requestedBackendProvider = readString(
      input.call.requested_backend_provider ?? input.call.requestedBackendProvider,
    ) || null;
    const trace = resolveHelixCapabilityLaneRequest({
      provider: input.provider,
      requestedLane: "workstation_tool_reference",
      requestedBackendProvider,
      env: input.env,
    });
    if (trace.admission_status !== "admitted_shadow_only") {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability: HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY,
        requestedBackendProvider,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    const turnId = input.turnId || readString(input.call.turn_id ?? input.call.turnId) ||
      "ask:lane:paper_evidence_enrichment";
    const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
      ? Math.max(0, Math.trunc(input.iteration))
      : 0;
    const profileId = readString(input.call.profile_id ?? input.call.profileId);
    const documentId = readString(input.call.document_id ?? input.call.documentId);
    const proposal = readRecord(input.call.proposal);
    const sourceTargetIntent = readRecord(input.call.source_target_intent ?? input.call.sourceTargetIntent);
    const gatewayResult = await callWorkstationGatewayCapability({
      agentRuntime: input.provider.id,
      mode: "act",
      capabilityId: HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY,
      arguments: {
        ...(documentId ? { document_id: documentId } : {}),
        ...(proposal ? { proposal } : {}),
        ...(sourceTargetIntent ? { source_target_intent: sourceTargetIntent } : {}),
      },
      profileId: profileId || null,
      turnId,
      iteration,
    });
    const observationRef = gatewayResult.artifact_refs[0] ??
      `${turnId}:capability_lane:${HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY}:${hashShort({
        ok: gatewayResult.ok,
        documentId,
      })}`;
    return {
      schema: "helix.workstation_tool_reference.gateway_bridge_result.v1",
      ok: gatewayResult.ok,
      lane_id: "workstation_tool_reference",
      capability: HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY,
      delegated_capability_id: HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY,
      delegation_status: "gateway_executed",
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: {
        ...trace,
        execution_status: "executed_observation_only",
        result_ref: observationRef,
        observation_ref: observationRef,
        receipt_ref: null,
        blocked_reason: gatewayResult.error ?? trace.blocked_reason,
      },
      delegated_gateway_call_result: gatewayResult,
      gateway_admission: gatewayResult.gateway_admission,
      tool_lifecycle_trace: gatewayResult.tool_lifecycle_trace,
      tool_followup_decision: gatewayResult.tool_followup_decision,
      observation: gatewayResult.observation,
      observation_packet: gatewayResult.observation_packet,
      artifact_refs: gatewayResult.artifact_refs,
      ...(gatewayResult.error ? { error: gatewayResult.error } : {}),
      reentry_required: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  },
};

const SCHOLARLY_RESEARCH_GATEWAY_CAPABILITIES = new Set<string>([
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
]);

const GATEWAY_LANE_CONTROL_KEYS = new Set([
  "capability",
  "capability_id",
  "capabilityId",
  "arguments",
  "args",
  "mode",
  "requested_backend_provider",
  "requestedBackendProvider",
  "profile_id",
  "profileId",
  "turn_id",
  "turnId",
  "iteration",
  "terminal_eligible",
  "assistant_answer",
  "raw_content_included",
]);

const gatewayArgumentsFromLaneCall = (call: RecordLike): RecordLike => {
  const nested = readRecord(call.arguments) ?? readRecord(call.args);
  if (nested) return nested;
  return Object.fromEntries(
    Object.entries(call).filter(([key, value]) =>
      !GATEWAY_LANE_CONTROL_KEYS.has(key) && value !== undefined
    ),
  );
};

export const governedWorkstationGatewayBridgeHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "",
  laneId: "workstation_tool_reference",
  async run(input) {
    const capability = readHelixCapabilityLaneCallCapability(input.call);
    const authorizedCapability = input.authorizedGatewayCapability;
    if (!capability || authorizedCapability?.capability_id !== capability) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability: capability || "workstation_gateway.unknown",
        requestedBackendProvider: null,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    const requestedBackendProvider = readString(
      input.call.requested_backend_provider ?? input.call.requestedBackendProvider,
    ) || null;
    const trace = resolveHelixCapabilityLaneRequest({
      provider: input.provider,
      requestedLane: "workstation_tool_reference",
      requestedBackendProvider,
      env: input.env,
    });
    if (trace.admission_status !== "admitted_shadow_only") {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability,
        requestedBackendProvider,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    const turnId = input.turnId || readString(input.call.turn_id ?? input.call.turnId) ||
      "ask:lane:governed_gateway";
    const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
      ? Math.max(0, Math.trunc(input.iteration))
      : 0;
    const gatewayArguments = gatewayArgumentsFromLaneCall(input.call);
    const gatewayResult = await callWorkstationGatewayCapability({
      agentRuntime: input.provider.id,
      mode: authorizedCapability.mode,
      capabilityId: capability,
      arguments: gatewayArguments,
      turnId,
      iteration,
      accountType: input.accountType ?? undefined,
      profileId: input.profileId ?? null,
    });
    const observationRef = gatewayResult.artifact_refs[0] ??
      `${turnId}:capability_lane:${capability}:${hashShort({ ok: gatewayResult.ok, arguments: gatewayArguments })}`;
    return {
      schema: "helix.workstation_tool_reference.gateway_bridge_result.v1",
      ok: gatewayResult.ok,
      lane_id: "workstation_tool_reference",
      capability,
      delegated_capability_id: capability,
      delegation_status: "gateway_executed",
      selected_runtime_agent_provider: input.provider.id,
      arguments: gatewayArguments,
      lane_resolve_trace: {
        ...trace,
        execution_status: "executed_observation_only",
        result_ref: observationRef,
        observation_ref: observationRef,
        receipt_ref: null,
        blocked_reason: gatewayResult.error ?? trace.blocked_reason,
      },
      delegated_gateway_call_result: gatewayResult,
      gateway_admission: gatewayResult.gateway_admission,
      tool_lifecycle_trace: gatewayResult.tool_lifecycle_trace,
      tool_followup_decision: gatewayResult.tool_followup_decision,
      observation: gatewayResult.observation,
      observation_packet: gatewayResult.observation_packet,
      artifact_refs: gatewayResult.artifact_refs,
      ...(gatewayResult.error ? { error: gatewayResult.error } : {}),
      reentry_required: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  },
};

const calculatorGatewayBridgeHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "scientific-calculator.",
  laneId: "workstation_tool_reference",
  async run(input) {
    const capability = readHelixCapabilityLaneCallCapability(input.call);
    const requestedBackendProvider = readString(
      input.call.requested_backend_provider ?? input.call.requestedBackendProvider,
    ) || null;
    if (capability !== CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability: capability || "scientific-calculator.unknown",
        requestedBackendProvider,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    const trace = resolveHelixCapabilityLaneRequest({
      provider: input.provider,
      requestedLane: "workstation_tool_reference",
      requestedBackendProvider,
      env: input.env,
    });
    if (trace.admission_status !== "admitted_shadow_only") {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability,
        requestedBackendProvider,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    const turnId = input.turnId || readString(input.call.turn_id ?? input.call.turnId) ||
      "ask:lane:scientific_calculator";
    const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
      ? Math.max(0, Math.trunc(input.iteration))
      : 0;
    const gatewayArguments = gatewayArgumentsFromLaneCall(input.call);
    const gatewayResult = await callWorkstationGatewayCapability({
      agentRuntime: input.provider.id,
      mode: "read",
      capabilityId: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      arguments: gatewayArguments,
      turnId,
      iteration,
    });
    const observationRef = gatewayResult.artifact_refs[0] ??
      `${turnId}:capability_lane:${CALCULATOR_SOLVE_EXPRESSION_CAPABILITY}:${hashShort({
        ok: gatewayResult.ok,
        arguments: gatewayArguments,
      })}`;
    return {
      schema: "helix.workstation_tool_reference.gateway_bridge_result.v1",
      ok: gatewayResult.ok,
      lane_id: "workstation_tool_reference",
      capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      delegated_capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      delegation_status: "gateway_executed",
      selected_runtime_agent_provider: input.provider.id,
      arguments: gatewayArguments,
      lane_resolve_trace: {
        ...trace,
        execution_status: "executed_observation_only",
        result_ref: observationRef,
        observation_ref: observationRef,
        receipt_ref: null,
        blocked_reason: gatewayResult.error ?? trace.blocked_reason,
      },
      delegated_gateway_call_result: gatewayResult,
      gateway_admission: gatewayResult.gateway_admission,
      tool_lifecycle_trace: gatewayResult.tool_lifecycle_trace,
      tool_followup_decision: gatewayResult.tool_followup_decision,
      observation: gatewayResult.observation,
      observation_packet: gatewayResult.observation_packet,
      artifact_refs: gatewayResult.artifact_refs,
      ...(gatewayResult.error ? { error: gatewayResult.error } : {}),
      reentry_required: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  },
};

const scholarlyResearchGatewayBridgeHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "scholarly-research.",
  laneId: "workstation_tool_reference",
  async run(input) {
    const capability = readHelixCapabilityLaneCallCapability(input.call);
    const requestedBackendProvider = readString(
      input.call.requested_backend_provider ?? input.call.requestedBackendProvider,
    ) || null;
    if (!SCHOLARLY_RESEARCH_GATEWAY_CAPABILITIES.has(capability)) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability: capability || "scholarly-research.unknown",
        requestedBackendProvider,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    const trace = resolveHelixCapabilityLaneRequest({
      provider: input.provider,
      requestedLane: "workstation_tool_reference",
      requestedBackendProvider,
      env: input.env,
    });
    if (trace.admission_status !== "admitted_shadow_only") {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability,
        requestedBackendProvider,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    const scholarlyCapability = capability as HelixScholarlyResearchGatewayCapability;
    const turnId = input.turnId || readString(input.call.turn_id ?? input.call.turnId) ||
      "ask:lane:scholarly_research";
    const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
      ? Math.max(0, Math.trunc(input.iteration))
      : 0;
    const gatewayArguments = gatewayArgumentsFromLaneCall(input.call);
    const gatewayResult = await callWorkstationGatewayCapability({
      agentRuntime: input.provider.id,
      mode: "read",
      capabilityId: scholarlyCapability,
      arguments: gatewayArguments,
      turnId,
      iteration,
    });
    const observationRef = gatewayResult.artifact_refs[0] ??
      `${turnId}:capability_lane:${scholarlyCapability}:${hashShort({
        ok: gatewayResult.ok,
        arguments: gatewayArguments,
      })}`;
    return {
      schema: "helix.workstation_tool_reference.gateway_bridge_result.v1",
      ok: gatewayResult.ok,
      lane_id: "workstation_tool_reference",
      capability: scholarlyCapability,
      delegated_capability_id: scholarlyCapability,
      delegation_status: "gateway_executed",
      selected_runtime_agent_provider: input.provider.id,
      arguments: gatewayArguments,
      lane_resolve_trace: {
        ...trace,
        execution_status: "executed_observation_only",
        result_ref: observationRef,
        observation_ref: observationRef,
        receipt_ref: null,
        blocked_reason: gatewayResult.error ?? trace.blocked_reason,
      },
      delegated_gateway_call_result: gatewayResult,
      gateway_admission: gatewayResult.gateway_admission,
      tool_lifecycle_trace: gatewayResult.tool_lifecycle_trace,
      tool_followup_decision: gatewayResult.tool_followup_decision,
      observation: gatewayResult.observation,
      observation_packet: gatewayResult.observation_packet,
      artifact_refs: gatewayResult.artifact_refs,
      ...(gatewayResult.error ? { error: gatewayResult.error } : {}),
      reentry_required: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  },
};

const docsGatewayBridgeHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "docs",
  laneId: "workstation_tool_reference",
  async run(input) {
    const capability = readHelixCapabilityLaneCallCapability(input.call);
    const requestedBackendProvider = readString(
      input.call.requested_backend_provider ?? input.call.requestedBackendProvider,
    ) || null;
    if (capability !== DOCS_SEARCH_CAPABILITY && capability !== DOCS_OPEN_CAPABILITY) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability: capability || "docs.unknown",
        requestedBackendProvider,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    const trace = resolveHelixCapabilityLaneRequest({
      provider: input.provider,
      requestedLane: "workstation_tool_reference",
      requestedBackendProvider,
      env: input.env,
    });
    if (trace.admission_status !== "admitted_shadow_only") {
      return buildShadowResult({
        provider: input.provider,
        laneId: "workstation_tool_reference",
        capability,
        requestedBackendProvider,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    const turnId = input.turnId || readString(input.call.turn_id ?? input.call.turnId) ||
      "ask:lane:docs";
    const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
      ? Math.max(0, Math.trunc(input.iteration))
      : 0;
    const gatewayArguments = gatewayArgumentsFromLaneCall(input.call);
    const gatewayResult = await callWorkstationGatewayCapability({
      agentRuntime: input.provider.id,
      mode: capability === DOCS_OPEN_CAPABILITY ? "act" : "read",
      capabilityId: capability,
      arguments: gatewayArguments,
      turnId,
      iteration,
    });
    const observationRef = gatewayResult.artifact_refs[0] ??
      `${turnId}:capability_lane:${capability}:${hashShort({
        ok: gatewayResult.ok,
        arguments: gatewayArguments,
      })}`;
    return {
      schema: "helix.workstation_tool_reference.gateway_bridge_result.v1",
      ok: gatewayResult.ok,
      lane_id: "workstation_tool_reference",
      capability,
      delegated_capability_id: capability,
      delegation_status: "gateway_executed",
      selected_runtime_agent_provider: input.provider.id,
      arguments: gatewayArguments,
      lane_resolve_trace: {
        ...trace,
        execution_status: "executed_observation_only",
        result_ref: observationRef,
        observation_ref: observationRef,
        receipt_ref: null,
        blocked_reason: gatewayResult.error ?? trace.blocked_reason,
      },
      delegated_gateway_call_result: gatewayResult,
      gateway_admission: gatewayResult.gateway_admission,
      tool_lifecycle_trace: gatewayResult.tool_lifecycle_trace,
      tool_followup_decision: gatewayResult.tool_followup_decision,
      observation: gatewayResult.observation,
      observation_packet: gatewayResult.observation_packet,
      artifact_refs: gatewayResult.artifact_refs,
      ...(gatewayResult.error ? { error: gatewayResult.error } : {}),
      reentry_required: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  },
};

const workstationVisibleTextHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "workstation.visible_text.",
  laneId: "workstation_tool_reference",
  run(input) {
    const visibleTargetsRequest = toWorkstationToolReferenceVisibleTranslationTargetsRequest(input.call, input.turnId);
    if (visibleTargetsRequest) {
      return runWorkstationToolReferenceCollectVisibleTranslationTargets({
        provider: input.provider,
        request: visibleTargetsRequest,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
        nowMs: readNowMs(input.call),
      });
    }
    return buildShadowResult({
      provider: input.provider,
      laneId: "workstation_tool_reference",
      capability: readHelixCapabilityLaneCallCapability(input.call) || "workstation.visible_text.unknown",
      requestedBackendProvider: readString(input.call.requested_backend_provider ?? input.call.requestedBackendProvider) || null,
      turnId: input.turnId,
      iteration: input.iteration,
      env: input.env,
    });
  },
};

const visualAnalysisHandler: HelixCapabilityLaneOneShotHandler = {
  capabilityPrefix: "visual_analysis.",
  laneId: "visual_analysis",
  run(input) {
    const request = toImageLensRegionInspectionRequest(input.call, input.turnId);
    if (!request) {
      return buildShadowResult({
        provider: input.provider,
        laneId: "visual_analysis",
        capability: readHelixCapabilityLaneCallCapability(input.call) || "visual_analysis.unknown",
        requestedBackendProvider: readString(input.call.requested_backend_provider ?? input.call.requestedBackendProvider) || null,
        turnId: input.turnId,
        iteration: input.iteration,
        env: input.env,
      });
    }
    return runImageLensRegionInspection({
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
  speechToTextHandler,
  textToSpeechHandler,
  visualAnalysisHandler,
  theoryContextReflectionGatewayBridgeHandler,
  paperEvidenceEnrichmentGatewayBridgeHandler,
  calculatorGatewayBridgeHandler,
  scholarlyResearchGatewayBridgeHandler,
  docsGatewayBridgeHandler,
  workstationVisibleTextHandler,
  workstationToolReferenceHandler,
];

export const resolveHelixCapabilityLaneOneShotHandler = (
  capability: string,
): HelixCapabilityLaneOneShotHandler | null => {
  const handler = HELIX_CAPABILITY_LANE_ONE_SHOT_HANDLERS.find(
    (candidate) => capability.startsWith(candidate.capabilityPrefix),
  ) ?? null;
  if (handler === calculatorGatewayBridgeHandler && capability !== CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) {
    return null;
  }
  if (
    handler === scholarlyResearchGatewayBridgeHandler &&
    !SCHOLARLY_RESEARCH_GATEWAY_CAPABILITIES.has(capability)
  ) {
    return null;
  }
  if (
    handler === docsGatewayBridgeHandler &&
    capability !== DOCS_SEARCH_CAPABILITY &&
    capability !== DOCS_OPEN_CAPABILITY
  ) {
    return null;
  }
  return handler;
};
