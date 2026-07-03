import type { HelixAgentRuntimeId } from "./helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "./helix-agent-step-observation-packet";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneResolveTrace,
} from "./helix-capability-lane";
import type { HelixLiveTranslationProjectionTarget } from "./helix-live-translation-projection-target";

export const HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA =
  "helix.live_translation.one_shot_request.v1" as const;
export const HELIX_LIVE_TRANSLATION_ONE_SHOT_OBSERVATION_SCHEMA =
  "helix.live_translation.observation.v1" as const;
export const HELIX_LIVE_TRANSLATION_ONE_SHOT_RESULT_SCHEMA =
  "helix.live_translation.one_shot_result.v1" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_RECEIPT_SCHEMA =
  "helix.live_translation.projection_receipt.v1" as const;

export type HelixLiveTranslationChunkFreshnessStatus =
  | "fresh"
  | "stale"
  | "unknown";

export type HelixLiveTranslationOneShotRequest = {
  schema: typeof HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA;
  capability: "live_translation.translate_text";
  text: string;
  target_language: string;
  source_language?: string | null;
  requested_backend_provider?: string | null;
  lane_session_id?: string | null;
  turn_id?: string | null;
  source_id?: string | null;
  source_hash?: string | null;
  chunk_id?: string | null;
  chunk_index?: number | null;
  dedupe_key?: string | null;
  source_event_id?: string | null;
  source_event_ms?: number | null;
  projection_target?: HelixLiveTranslationProjectionTarget | null;
  cancel_requested?: boolean | null;
  assistant_answer: false;
  terminal_eligible: false;
};

export type HelixLiveTranslationOneShotObservation = {
  schema: typeof HELIX_LIVE_TRANSLATION_ONE_SHOT_OBSERVATION_SCHEMA;
  observation_id: string;
  observation_ref: string;
  lane_id: "live_translation";
  capability: "live_translation.translate_text";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  requested_backend_provider: string | null;
  selected_backend_provider: string | null;
  selection_reason: string;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  lane_session_id: string | null;
  source_language: string | null;
  target_language: string;
  source_id: string;
  source_hash: string | null;
  chunk_id: string;
  chunk_index: number | null;
  dedupe_key: string;
  source_event_id: string | null;
  source_event_ms: number | null;
  observed_at_ms: number;
  freshness_status: HelixLiveTranslationChunkFreshnessStatus;
  projection_target: HelixLiveTranslationProjectionTarget;
  cancel_requested: false;
  source_text_hash: string;
  source_text_char_count: number;
  translated_text: string;
  deterministic: true;
  confidence: number;
  reentry_required: true;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixLiveTranslationProjectionReceipt = {
  schema: typeof HELIX_LIVE_TRANSLATION_PROJECTION_RECEIPT_SCHEMA;
  receipt_ref: string;
  observation_ref: string;
  projection_key: string;
  lane_id: "live_translation";
  capability: "live_translation.translate_text";
  lane_session_id: string | null;
  selected_backend_provider: string | null;
  projection_target: HelixLiveTranslationProjectionTarget;
  projection_status: "projected" | "stale" | "cancelled" | "failed";
  source_id: string;
  source_hash: string | null;
  chunk_id: string;
  chunk_index: number | null;
  dedupe_key: string;
  source_event_id: string | null;
  source_event_ms: number | null;
  observed_at_ms: number;
  freshness_status: HelixLiveTranslationChunkFreshnessStatus;
  target_language: string;
  source_text_hash: string | null;
  source_text_char_count: number | null;
  translated_text: string | null;
  stale: boolean;
  cancel_requested: boolean;
  reentry_required: true;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixLiveTranslationOneShotResult = {
  schema: typeof HELIX_LIVE_TRANSLATION_ONE_SHOT_RESULT_SCHEMA;
  ok: boolean;
  lane_id: "live_translation";
  capability: "live_translation.translate_text";
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  observation: HelixLiveTranslationOneShotObservation | null;
  observation_packet: HelixAgentStepObservationPacket;
  artifact_refs: string[];
  translated_text?: string;
  error?: string;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};
