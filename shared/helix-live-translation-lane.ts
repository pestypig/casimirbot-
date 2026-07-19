import type { HelixAgentRuntimeId } from "./helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "./helix-agent-step-observation-packet";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneResolveTrace,
} from "./helix-capability-lane";
import type { HelixLiveTranslationProjectionTarget } from "./helix-live-translation-projection-target";

export type { HelixLiveTranslationProjectionTarget } from "./helix-live-translation-projection-target";

export const HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA =
  "helix.live_translation.one_shot_request.v1" as const;
export const HELIX_LIVE_TRANSLATION_ONE_SHOT_OBSERVATION_SCHEMA =
  "helix.live_translation.observation.v1" as const;
export const HELIX_LIVE_TRANSLATION_ONE_SHOT_RESULT_SCHEMA =
  "helix.live_translation.one_shot_result.v1" as const;
export const HELIX_LIVE_TRANSLATION_PROJECTION_RECEIPT_SCHEMA =
  "helix.live_translation.projection_receipt.v1" as const;
export const HELIX_VISIBLE_TRANSLATION_TARGET_SCHEMA =
  "helix.visible_translation_target.v1" as const;
export const HELIX_VISIBLE_TRANSLATION_TARGET_BATCH_SCHEMA =
  "helix.visible_translation_target_batch.v1" as const;
export const HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_CAPABILITY =
  "workstation_tool_reference.collect_visible_translation_targets" as const;
export const HELIX_WORKSTATION_VISIBLE_TEXT_TRANSLATION_TARGETS_CAPABILITY =
  "workstation.visible_text.collect_translation_targets" as const;

export type HelixVisibleTranslationTargetCollectorCapability =
  | typeof HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_CAPABILITY
  | typeof HELIX_WORKSTATION_VISIBLE_TEXT_TRANSLATION_TARGETS_CAPABILITY;

export type HelixVisibleTranslationTargetSourceKind =
  | "docs_viewer"
  | "panel_text"
  | "button_label"
  | "note"
  | "selection"
  | "hover_region";

export type HelixLiveTranslationTerminalAuthorityStatus =
  | "not_terminal_authority"
  | "pending_helix_terminal_authority"
  | "terminal_authority_rejected";

export type HelixVisibleTranslationTarget = {
  schema: typeof HELIX_VISIBLE_TRANSLATION_TARGET_SCHEMA;
  source_kind: HelixVisibleTranslationTargetSourceKind;
  panel_id: string | null;
  doc_path: string | null;
  document_source_kind?: "canonical_docs" | "research_library" | null;
  document_ref?: string | null;
  private_source?: boolean;
  source_id: string;
  source_hash: string;
  source_text_hash: string;
  source_text_char_count: number;
  source_event_id: string;
  source_event_ms: number | null;
  observed_at_ms: number | null;
  visible_text: string;
  chunk_id: string;
  chunk_index: number;
  region_id: string | null;
  bbox: Record<string, unknown> | null;
  dedupe_key: string;
  projection_target: HelixLiveTranslationProjectionTarget;
  account_locale: string | null;
  target_language: string;
  existing_observation_ref: string | null;
  existing_receipt_ref: string | null;
  existing_translation_receipt_ref: string | null;
  existing_projection_status: "projected" | "stale" | "cancelled" | "failed" | null;
  existing_freshness_status: HelixLiveTranslationChunkFreshnessStatus | null;
  existing_terminal_authority_status: HelixLiveTranslationTerminalAuthorityStatus | null;
  existing_source_event_ms: number | null;
  existing_observed_at_ms: number | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  reentry_required: true;
};

export type HelixVisibleTranslationTargetBatch = {
  schema: typeof HELIX_VISIBLE_TRANSLATION_TARGET_BATCH_SCHEMA;
  batch_ref: string;
  target_count: number;
  targets: HelixVisibleTranslationTarget[];
  visible_only: boolean;
  max_chunks: number;
  requested_collector_capability: HelixVisibleTranslationTargetCollectorCapability | null;
  collector_capability: typeof HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_CAPABILITY;
  translation_capability_required: "live_translation.translate_text";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  reentry_required: true;
};

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
  session_control_key?: string | null;
  source_binding_key?: string | null;
  source_identity_key?: string | null;
  latest_source_identity_key?: string | null;
  latest_observation_key?: string | null;
  latest_mail_loop_observation_key?: string | null;
  goal_binding_id?: string | null;
  goal_binding_key?: string | null;
  turn_id?: string | null;
  source_id?: string | null;
  panel_id?: string | null;
  region_id?: string | null;
  bbox?: Record<string, unknown> | null;
  doc_path?: string | null;
  document_source_kind?: "canonical_docs" | "research_library" | null;
  document_ref?: string | null;
  private_source?: boolean | null;
  source_hash?: string | null;
  source_kind?: string | null;
  source_text_hash?: string | null;
  source_text_char_count?: number | null;
  account_locale?: string | null;
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
  session_control_key: string | null;
  source_binding_key: string | null;
  source_identity_key: string | null;
  latest_source_identity_key: string | null;
  latest_observation_key: string | null;
  latest_mail_loop_observation_key: string | null;
  goal_binding_id: string | null;
  goal_binding_key: string | null;
  source_language: string | null;
  target_language: string;
  source_id: string;
  panel_id: string | null;
  region_id: string | null;
  bbox: Record<string, unknown> | null;
  doc_path: string | null;
  document_source_kind?: "canonical_docs" | "research_library" | null;
  document_ref?: string | null;
  private_source?: boolean;
  source_hash: string | null;
  source_kind: string | null;
  account_locale: string | null;
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
  deterministic: boolean;
  confidence: number;
  reentry_required: true;
  terminal_authority_status: HelixLiveTranslationTerminalAuthorityStatus;
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
  session_control_key: string | null;
  source_binding_key: string | null;
  source_identity_key: string | null;
  latest_source_identity_key: string | null;
  latest_observation_key: string | null;
  latest_mail_loop_observation_key: string | null;
  goal_binding_id: string | null;
  goal_binding_key: string | null;
  selected_backend_provider: string | null;
  projection_target: HelixLiveTranslationProjectionTarget;
  projection_status: "projected" | "stale" | "cancelled" | "failed";
  source_id: string;
  panel_id: string | null;
  region_id: string | null;
  bbox: Record<string, unknown> | null;
  doc_path: string | null;
  document_source_kind?: "canonical_docs" | "research_library" | null;
  document_ref?: string | null;
  private_source?: boolean;
  source_hash: string | null;
  source_kind: string | null;
  account_locale: string | null;
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
  terminal_authority_status: HelixLiveTranslationTerminalAuthorityStatus;
  answer_authority: false;
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
