import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type { HelixCapabilityLaneMailLoopDebugSummary } from "@shared/helix-capability-lane-mail-loop";
import type {
  HelixCapabilityLaneGoalDispatchAdmission,
  HelixCapabilityLaneGoalDispatchPlan,
  HelixCapabilityLaneGoalDispatchReadiness,
} from "@shared/helix-capability-lane-goal-binding";
import type { HelixAgentProvider } from "../agent-providers/types";
import type { HelixAccountType } from "@shared/helix-account-session";
import type { HelixWorkstationCapabilityManifest } from "../workstation-tool-gateway/types";
import type { HelixAgentModelVisibleCapabilityLaneManifest } from "../agent-providers/runtime-adapter-contract";
import { buildModelVisibleCapabilityLaneManifest } from "../agent-providers/runtime-adapter-contract";
import { listHelixCapabilityLanes } from "./registry";
import { buildHelixCapabilityLaneGoalDispatchReadiness } from "./goal-dispatch-readiness";
import {
  runHelixCapabilityLaneOneShotRequests,
  type HelixCapabilityLaneOneShotRunnerResult,
} from "./one-shot-runner";
import {
  runHelixCapabilityLaneSessionRequests,
  type HelixCapabilityLaneSessionRunnerResult,
} from "./session-runner";
import {
  runHelixCapabilityLaneGoalBindingRequests,
  type HelixCapabilityLaneGoalBindingRunnerResult,
} from "./goal-binding-runner";
import type { HelixCapabilityLaneSessionStore } from "./session-manager";
import type { HelixCapabilityLaneGoalBindingStore } from "./goal-binding";
import { buildHelixCapabilityLaneSessionListTimeline } from "./session-list-timeline";

export type HelixCapabilityLaneProviderAdapterContext = {
  schema: "helix.capability_lane.provider_adapter_context.v1";
  one_shot: HelixCapabilityLaneOneShotRunnerResult;
  sessions: HelixCapabilityLaneSessionRunnerResult;
  goal_bindings: HelixCapabilityLaneGoalBindingRunnerResult;
  model_visible_capability_lane_manifest: HelixAgentModelVisibleCapabilityLaneManifest;
  debug_projection: HelixCapabilityLaneOneShotRunnerResult["debug_projection"] & {
    model_visible_capability_lane_manifest: HelixAgentModelVisibleCapabilityLaneManifest;
    capability_lane_projection_receipts: HelixCapabilityLaneProviderAdapterReceipt[];
    capability_lane_turn_timeline: HelixCapabilityLaneProviderTimelineEvent[];
    capability_lane_session_results: HelixCapabilityLaneSessionRunnerResult["session_results"];
    capability_lane_session_debug_summaries: HelixCapabilityLaneSessionRunnerResult["session_debug_summaries"];
    capability_lane_mail_loop_debug_summaries: HelixCapabilityLaneMailLoopDebugSummary[];
    capability_lane_goal_binding_results: HelixCapabilityLaneGoalBindingRunnerResult["goal_binding_results"];
    capability_lane_goal_binding_debug_summaries: HelixCapabilityLaneGoalBindingRunnerResult["goal_binding_debug_summaries"];
    capability_lane_goal_dispatch_plans: HelixCapabilityLaneGoalDispatchPlan[];
    capability_lane_goal_dispatch_admissions: HelixCapabilityLaneGoalDispatchAdmission[];
    capability_lane_goal_dispatch_readiness: HelixCapabilityLaneGoalDispatchReadiness | null;
  };
  observation_packets: HelixAgentStepObservationPacket[];
  projection_receipts: HelixCapabilityLaneProviderAdapterReceipt[];
  capability_lane_turn_timeline: HelixCapabilityLaneProviderTimelineEvent[];
  artifact_ledger: Array<Record<string, unknown>>;
  prompt_observation_block: string;
  reentry_observation_block: string;
  calls_succeeded: boolean;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneProviderTimelineEvent = {
  schema: "helix.capability_lane.provider_timeline_event.v1";
  seq: number;
  stage:
    | "lane_visible"
    | "lane_requested"
    | "lane_backend_selected"
    | "lane_observation"
    | "lane_projection_receipt"
    | "lane_reentered"
    | "lane_session"
    | "lane_mail_loop"
    | "goal_binding"
    | "lane_goal_dispatch_plan"
    | "lane_goal_dispatch_admission"
    | "lane_goal_dispatch_readiness"
    | "terminal_selected"
    | "terminal_rejected";
  selected_runtime_agent_provider: HelixAgentProvider["id"];
  adapter_boundary: "helix_agent_provider_edge";
  lane_id: string;
  capability_id: string | null;
  status: string;
  lane_visible: boolean;
  lane_requested: boolean;
  lane_executed: boolean;
  observation_reentered: boolean;
  requested_backend_provider?: string | null;
  requested_backend_provider_known?: boolean | null;
  selected_backend_provider: string | null;
  fallback_backend_provider?: string | null;
  selection_reason?: string | null;
  backend_selection_decision?: Record<string, unknown> | null;
  cost_class?: string | null;
  latency_class?: string | null;
  privacy_class?: string | null;
  observation_ref: string | null;
  receipt_ref: string | null;
  latest_event_id: string | null;
  latest_receipt_ref?: string | null;
  lifecycle_action?: string | null;
  session_lifecycle_action?: string | null;
  session_action?: string | null;
  session_debug_phase?: string | null;
  session_observation_status?: string | null;
  session_control_key?: string | null;
  session_event_count?: number | null;
  session_created_at_ms?: number | null;
  session_updated_at_ms?: number | null;
  permissions?: Record<string, unknown> | null;
  permission_profile?: string | null;
  source_binding_key?: string | null;
  source_identity_key?: string | null;
  latest_observation_key?: string | null;
  evidence_refs?: string[];
  has_observation: boolean;
  source_id?: string | null;
  doc_path?: string | null;
  source_hash?: string | null;
  source_kind?: string | null;
  source_projection_target?: string | null;
  account_locale?: string | null;
  latest_chunk_id?: string | null;
  latest_chunk_index?: number | null;
  latest_source_id?: string | null;
  latest_source_hash?: string | null;
  latest_source_binding_key?: string | null;
  latest_source_identity_key?: string | null;
  latest_source_kind?: string | null;
  latest_account_locale?: string | null;
  latest_target_language?: string | null;
  latest_dedupe_key?: string | null;
  latest_source_event_id?: string | null;
  latest_source_event_ms?: number | null;
  latest_observed_at_ms?: number | null;
  latest_freshness_status?: string | null;
  source_text_hash?: string | null;
  source_text_char_count?: number | null;
  latest_projection_target?: string | null;
  target_language?: string | null;
  latest_cancel_requested?: boolean | null;
  latest_mail_loop_wake_kind?: "mailbox_wake" | "none" | null;
  mailbox_wake_expected?: boolean | null;
  decision_wake_expected?: boolean | null;
  goal_id?: string | null;
  goal_binding_id?: string | null;
  lane_session_id?: string | null;
  mail_loop_ref?: string | null;
  dispatch_target?: string | null;
  dispatch_admission_status?: string | null;
  dispatch_blocked_reason?: string | null;
  materialized_mail_loop_evidence?: boolean;
  wake_dispatch_allowed?: boolean;
  side_effects_allowed?: boolean;
  report_action?: string | null;
  report_reason?: string | null;
  report_summary_text?: string | null;
  terminal_authority_status: string;
  selected_runtime_provider_remains_root?: true;
  backend_provider_becomes_root_agent?: false;
  final_reports_require_terminal_authority?: true;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneProviderAdapterReceipt = {
  schema: "helix.capability_lane.provider_adapter_receipt.v1";
  receipt_ref: string;
  kind: string;
  status: string;
  turn_id: string;
  capability_key: string;
  observation_ref: string | null;
  payload: unknown;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter(Boolean)
    : [];

const MODEL_VISIBLE_STRING_LIMIT = 16_000;

export const compactCapabilityLaneModelValue = (value: unknown, depth = 0): unknown => {
  if (depth > 16 || value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (/^(?:data:image\/|blob:)/i.test(value.trim())) {
      return `[inline_image_payload_omitted:${value.length}_chars]`;
    }
    return value.length <= MODEL_VISIBLE_STRING_LIMIT
      ? value
      : `${value.slice(0, MODEL_VISIBLE_STRING_LIMIT)}...[model-visible value truncated]`;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => compactCapabilityLaneModelValue(entry, depth + 1));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, entry]) => [key, compactCapabilityLaneModelValue(entry, depth + 1)]),
    );
  }
  return value;
};

const readScientificImageEvidenceSidecarFromPacket = (
  packet: HelixAgentStepObservationPacket,
): Record<string, unknown> | null => {
  const stateDelta = readRecord(packet.state_delta);
  const regionInspection = readRecord(stateDelta?.visual_analysis_region_inspection);
  const receipt = readRecord(regionInspection?.receipt);
  const candidates = [
    regionInspection?.scientific_evidence_sidecar,
    receipt?.scientific_evidence_sidecar,
  ];
  return candidates
    .map(readRecord)
    .find((sidecar) => readString(sidecar?.schema) === "helix.scientific_image_evidence_sidecar.v1") ?? null;
};

const readRankedReceiptRef = (...values: unknown[]): string | null => {
  const records = values
    .map(readRecord)
    .filter((value): value is Record<string, unknown> => Boolean(value));

  for (const key of ["latest_receipt_ref", "receipt_ref", "last_receipt_ref"]) {
    for (const record of records) {
      const ref = readString(record[key]);
      if (ref) return ref;
    }
  }

  for (const value of values) {
    const ref = readString(value);
    if (ref) return ref;
  }

  return null;
};

const isObservedTextToSpeechReceiptResult = (result: Record<string, unknown>): boolean => {
  const capability = readString(result.capability ?? result.capability_id ?? result.capabilityId);
  if (capability !== "text_to_speech.speak_text") return false;
  const packet = readRecord(result.observation_packet);
  const stateDelta = readRecord(packet?.state_delta);
  const receipt = readRecord(result.receipt) ?? readRecord(stateDelta?.text_to_speech_receipt);
  const playbackStatus = readString(receipt?.playback_status);
  return ["pending", "played", "blocked", "failed"].includes(playbackStatus);
};

const compactKey = (parts: Array<string | null | undefined>): string | null => {
  const key = parts
    .map((part) => readString(part))
    .filter(Boolean)
    .join("::");
  return key || null;
};

export const buildCapabilityLaneArtifactLedger = (input: {
  turnId: string;
  packets: HelixAgentStepObservationPacket[];
}): Array<Record<string, unknown>> =>
  input.packets.flatMap((packet, index) => {
    const stateDelta = readRecord(packet.state_delta);
    const shadowExecution = readRecord(stateDelta?.capability_lane_shadow_execution);
    const inferredLaneId = readString(shadowExecution?.lane_id) ||
      readString(packet.capability_key).split(".")[0] ||
      null;
    const selectedBackendProvider =
      readString(shadowExecution?.selected_backend_provider) ||
      readString(packet.backend_selection_decision?.selected_backend_provider) ||
      null;
    const laneExecutionStatus =
      readString(shadowExecution?.execution_status) ||
      (packet.status === "succeeded" ? "executed_observation_only" : "not_executed_shadow_only");
    const firstProducedRef = packet.produced_artifact_refs.find((ref) => ref.trim().length > 0);
    const artifactId =
      firstProducedRef ??
      `${input.turnId}:capability_lane_observation:${packet.capability_key}:${index + 1}`;
    const packetArtifact = {
      schema: "helix.current_turn_artifact.v1",
      artifact_id: artifactId,
      producer_item_id: packet.call_id,
      kind: "capability_lane_observation_packet",
      observation_kind: packet.capability_key,
      turn_id: input.turnId,
      capability_key: packet.capability_key,
      lane_id: inferredLaneId,
      selected_backend_provider: selectedBackendProvider,
      backend_selection_decision: packet.backend_selection_decision ?? null,
      lane_execution_status: laneExecutionStatus,
      lane_availability_status: readString(shadowExecution?.availability_status) || null,
      lane_permission_status: readString(shadowExecution?.permission_status) || null,
      lane_cost_class: readString(shadowExecution?.cost_class) || null,
      lane_latency_class: readString(shadowExecution?.latency_class) || null,
      lane_privacy_class: readString(shadowExecution?.privacy_class) || null,
      lane_fallback_backend_provider: readString(shadowExecution?.fallback_backend_provider) || null,
      produced_artifact_refs: packet.produced_artifact_refs,
      payload: packet,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };

    const scientificSidecar = readScientificImageEvidenceSidecarFromPacket(packet);
    if (!scientificSidecar) return [packetArtifact];

    const sidecarId =
      readString(scientificSidecar.sidecar_id) ||
      `${input.turnId}:scientific_image_evidence_sidecar:${index + 1}`;
    const memoryClassification = readRecord(scientificSidecar.memory_classification);
    const admissibility = readRecord(scientificSidecar.admissibility);
    const sourceRefs = readStringArray(scientificSidecar.packet_refs);

    return [
      packetArtifact,
      {
        schema: "helix.current_turn_artifact.v1",
        artifact_id: sidecarId,
        producer_item_id: packet.call_id,
        kind: "scientific_image_evidence_sidecar",
        observation_kind: packet.capability_key,
        turn_id: input.turnId,
        capability_key: packet.capability_key,
        lane_id: inferredLaneId,
        selected_backend_provider: selectedBackendProvider,
        backend_selection_decision: packet.backend_selection_decision ?? null,
        lane_execution_status: laneExecutionStatus,
        sidecar_id: sidecarId,
        sidecar_kind: readString(scientificSidecar.sidecar_kind) || "transient_scientific_image_evidence",
        memory_kind: readString(memoryClassification?.memory_kind) || "transient_scientific_image_evidence",
        retrieval_tags: readStringArray(memoryClassification?.retrieval_tags),
        suggested_consumers: readStringArray(memoryClassification?.suggested_consumers),
        source_ref_hash: readString(scientificSidecar.source_ref_hash) || null,
        source_kind: readString(scientificSidecar.source_kind) || null,
        packet_count: typeof scientificSidecar.packet_count === "number" ? scientificSidecar.packet_count : null,
        packet_refs: sourceRefs,
        crop_regions: Array.isArray(scientificSidecar.crop_regions) ? scientificSidecar.crop_regions : [],
        primary_packet_ref: readString(scientificSidecar.primary_packet_ref) || null,
        primary_domain: readString(scientificSidecar.primary_domain) || null,
        primary_domains: readStringArray(scientificSidecar.primary_domains),
        extraction_summary: readRecord(scientificSidecar.extraction_summary),
        admissibility_status: readString(admissibility?.status) || null,
        admissibility_reasons: readStringArray(admissibility?.reasons),
        compound_route_stages: Array.isArray(scientificSidecar.compound_route_stages)
          ? scientificSidecar.compound_route_stages
          : [],
        produced_artifact_refs: [sidecarId, ...sourceRefs],
        payload: scientificSidecar,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
    ];
  });

export const buildCapabilityLaneProviderAdapterReceipts = (input: {
  packets: HelixAgentStepObservationPacket[];
}): HelixCapabilityLaneProviderAdapterReceipt[] =>
  input.packets.flatMap((packet) => {
    const stateDelta = readRecord(packet.state_delta);
    const liveTranslationReceipt = readRecord(stateDelta?.live_translation_projection_receipt);
    return packet.receipts
      .map((receipt) => {
        const receiptRef = readString(receipt.receipt_ref);
        if (!receiptRef) return null;
        const observationRef =
          readString(liveTranslationReceipt?.observation_ref) ||
          packet.produced_artifact_refs.find((ref) => readString(ref)) ||
          null;
        return {
          schema: "helix.capability_lane.provider_adapter_receipt.v1" as const,
          receipt_ref: receiptRef,
          kind: readString(receipt.kind) || "capability_lane_receipt",
          status: readString(receipt.status) || packet.status,
          turn_id: packet.turn_id,
          capability_key: packet.capability_key,
          observation_ref: observationRef,
          payload: liveTranslationReceipt?.receipt_ref === receiptRef
            ? liveTranslationReceipt
            : receipt,
          reentry_required: true as const,
          terminal_eligible: false as const,
          assistant_answer: false as const,
          raw_content_included: false as const,
        };
      })
      .filter((entry): entry is HelixCapabilityLaneProviderAdapterReceipt => Boolean(entry));
  });

const buildCapabilityLaneMailLoopDebugSummaries = (
  goalBindingSummaries: HelixCapabilityLaneGoalBindingRunnerResult["goal_binding_debug_summaries"],
): HelixCapabilityLaneMailLoopDebugSummary[] =>
  goalBindingSummaries
    .map((summary) => summary.latest_mail_loop_summary)
    .filter((summary): summary is HelixCapabilityLaneMailLoopDebugSummary => Boolean(summary));

const buildCapabilityLaneGoalDispatchPlans = (
  goalBindingSummaries: HelixCapabilityLaneGoalBindingRunnerResult["goal_binding_debug_summaries"],
): HelixCapabilityLaneGoalDispatchPlan[] =>
  goalBindingSummaries
    .map((summary) => summary.dispatch_plan)
    .filter((plan): plan is HelixCapabilityLaneGoalDispatchPlan => Boolean(plan));

const buildCapabilityLaneGoalDispatchAdmissions = (
  goalBindingSummaries: HelixCapabilityLaneGoalBindingRunnerResult["goal_binding_debug_summaries"],
): HelixCapabilityLaneGoalDispatchAdmission[] =>
  goalBindingSummaries
    .map((summary) => summary.dispatch_admission)
    .filter((admission): admission is HelixCapabilityLaneGoalDispatchAdmission => Boolean(admission));

const readGoalDispatchReadinessTimelineStatus = (
  readiness: HelixCapabilityLaneGoalDispatchReadiness,
): "ready" | "blocked" | "partial" =>
  readiness.blocked_count > 0 && readiness.admitted_count > 0
    ? "partial"
    : readiness.blocked_count > 0
      ? "blocked"
      : "ready";

export const reconcileCapabilityLaneProviderTimelineReentry = (input: {
  timeline: HelixCapabilityLaneProviderTimelineEvent[];
  reenteredObservationRefs: string[];
}): HelixCapabilityLaneProviderTimelineEvent[] => {
  const reenteredRefs = new Set(
    input.reenteredObservationRefs
      .map((ref) => ref.trim())
      .filter(Boolean),
  );
  return input.timeline.map((event) => {
    if (event.stage !== "lane_reentered") return event;
    const observationReentered = Boolean(
      event.observation_ref && reenteredRefs.has(event.observation_ref),
    );
    return {
      ...event,
      status: observationReentered ? "completed" : "pending",
      observation_reentered: observationReentered,
    };
  });
};

export const buildCapabilityLaneProviderTimeline = (input: {
  provider: HelixAgentProvider;
  manifest: HelixAgentModelVisibleCapabilityLaneManifest;
  oneShot: HelixCapabilityLaneOneShotRunnerResult;
  projectionReceipts: HelixCapabilityLaneProviderAdapterReceipt[];
  sessions: HelixCapabilityLaneSessionRunnerResult;
  mailLoopDebugSummaries: HelixCapabilityLaneMailLoopDebugSummary[];
  goalBindings: HelixCapabilityLaneGoalBindingRunnerResult;
  goalDispatchPlans: HelixCapabilityLaneGoalDispatchPlan[];
  goalDispatchAdmissions: HelixCapabilityLaneGoalDispatchAdmission[];
  goalDispatchReadiness: HelixCapabilityLaneGoalDispatchReadiness | null;
}): HelixCapabilityLaneProviderTimelineEvent[] => {
  const rows: HelixCapabilityLaneProviderTimelineEvent[] = [];
  const push = (row: Omit<HelixCapabilityLaneProviderTimelineEvent, "schema" | "seq" | "adapter_boundary">) => {
    rows.push({
      schema: "helix.capability_lane.provider_timeline_event.v1",
      seq: rows.length,
      adapter_boundary: "helix_agent_provider_edge",
      ...row,
    });
  };

  input.manifest.lanes.forEach((lane) => {
    lane.capabilities.forEach((capability) => {
      push({
        stage: "lane_visible",
        selected_runtime_agent_provider: input.provider.id,
        lane_id: lane.lane_id,
        capability_id: capability.capability_id,
        status: lane.status,
        lane_visible: true,
        lane_requested: false,
        lane_executed: false,
        observation_reentered: false,
        selected_backend_provider: lane.default_backend_provider,
        observation_ref: null,
        receipt_ref: null,
        latest_event_id: null,
        has_observation: false,
        terminal_authority_status: "not_terminal_authority",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
    });
  });

  input.oneShot.debug_events.forEach((event) => {
    push({
      stage: event.stage,
      selected_runtime_agent_provider: input.provider.id,
      lane_id: event.lane_id,
      capability_id: event.capability,
      status: event.status,
      lane_visible: false,
      lane_requested: true,
      lane_executed:
        event.stage === "lane_observation" &&
        event.execution_status === "executed_observation_only",
      observation_reentered:
        event.stage === "lane_reentered" && event.status === "completed",
      requested_backend_provider: event.requested_backend_provider,
      requested_backend_provider_known: event.requested_backend_provider_known,
      selected_backend_provider: event.selected_backend_provider,
      fallback_backend_provider: event.fallback_backend_provider,
      selection_reason: event.selection_reason,
      observation_ref: event.observation_ref,
      receipt_ref: event.receipt_ref,
      latest_event_id: null,
      has_observation: Boolean(event.observation_ref),
      source_id: event.source_id ?? null,
      doc_path: event.doc_path ?? null,
      source_hash: event.source_hash ?? null,
      source_kind: event.source_kind ?? null,
      source_projection_target: event.source_projection_target ?? null,
      account_locale: event.account_locale ?? null,
      latest_chunk_id: event.latest_chunk_id ?? null,
      latest_chunk_index: event.latest_chunk_index ?? null,
      latest_dedupe_key: event.latest_dedupe_key ?? null,
      latest_source_event_id: event.latest_source_event_id ?? null,
      latest_source_event_ms: event.latest_source_event_ms ?? null,
      latest_observed_at_ms: event.latest_observed_at_ms ?? null,
      latest_freshness_status: event.latest_freshness_status ?? null,
      source_text_hash: event.source_text_hash ?? null,
      source_text_char_count: event.source_text_char_count ?? null,
      target_language: event.target_language ?? null,
      latest_cancel_requested: event.latest_cancel_requested ?? null,
      terminal_authority_status: event.terminal_authority_status,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  input.projectionReceipts.forEach((receipt) => {
    const payload = readRecord(receipt.payload);
    push({
      stage: "lane_projection_receipt",
      selected_runtime_agent_provider: input.provider.id,
      lane_id: readString(payload?.lane_id) || receipt.capability_key.split(".")[0] || "capability_lane",
      capability_id: receipt.capability_key,
      status: receipt.status,
      lane_visible: false,
      lane_requested: true,
      lane_executed: true,
      observation_reentered: false,
      selected_backend_provider: readString(payload?.selected_backend_provider) || null,
      observation_ref: receipt.observation_ref,
      receipt_ref: receipt.receipt_ref,
      latest_event_id: readString(payload?.source_event_id) || null,
      has_observation: Boolean(receipt.observation_ref),
      source_id: readString(payload?.source_id) || null,
      doc_path: readString(payload?.doc_path) || null,
      source_hash: readString(payload?.source_hash) || null,
      source_kind: readString(payload?.source_kind) || null,
      source_identity_key: readString(payload?.source_identity_key) || null,
      latest_source_identity_key:
        readString(payload?.latest_source_identity_key) ||
        readString(payload?.latestSourceIdentityKey) ||
        readString(payload?.source_identity_key) ||
        null,
      source_projection_target: readString(payload?.projection_target) || null,
      account_locale: readString(payload?.account_locale) || null,
      latest_chunk_id: readString(payload?.chunk_id) || null,
      latest_chunk_index: typeof payload?.chunk_index === "number" ? payload.chunk_index : null,
      latest_source_id: readString(payload?.source_id) || null,
      latest_source_hash: readString(payload?.source_hash) || null,
      latest_source_kind: readString(payload?.source_kind) || null,
      latest_target_language: readString(payload?.target_language) || null,
      latest_dedupe_key: readString(payload?.dedupe_key) || null,
      latest_source_event_id: readString(payload?.source_event_id) || null,
      latest_source_event_ms: typeof payload?.source_event_ms === "number" ? payload.source_event_ms : null,
      latest_observed_at_ms: typeof payload?.observed_at_ms === "number" ? payload.observed_at_ms : null,
      latest_freshness_status: readString(payload?.projection_status) || readString(payload?.freshness_status) || null,
      source_text_hash: readString(payload?.source_text_hash) || null,
      source_text_char_count: typeof payload?.source_text_char_count === "number"
        ? payload.source_text_char_count
        : null,
      latest_projection_target: readString(payload?.projection_target) || null,
      target_language: readString(payload?.target_language) || null,
      latest_cancel_requested: typeof payload?.cancel_requested === "boolean" ? payload.cancel_requested : null,
      terminal_authority_status: "not_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  buildHelixCapabilityLaneSessionListTimeline(input.sessions.session_debug_summaries).forEach((sessionRow) => {
    const { schema: _schema, seq: _seq, adapter_boundary: _adapterBoundary, ...row } = sessionRow;
    push(row);
  });

  input.mailLoopDebugSummaries.forEach((summary) => {
    const mailLoopEvidenceRef =
      readString(summary.observation_ref) ||
      readString(summary.receipt_ref) ||
      readString(summary.mail_loop_observation_key);
    const materializedMailLoopEvidence =
      summary.materialized_mail_loop_evidence === true ||
      Boolean(!summary.blocked_reason && summary.stage_play_mail_id && mailLoopEvidenceRef);
    const mailDeliveryStatus =
      readString(summary.stage_play_mail_delivery_status) ||
      (summary.blocked_reason ? "blocked" : summary.stage_play_mail_id ? "created" : "blocked");
    const sourceBindingKey =
      readString(summary.lane_session_source_binding_key) ||
      compactKey([
        summary.lane_session_source_id ?? summary.source_id,
        summary.lane_session_source_hash ?? summary.source_hash,
        summary.lane_session_projection_target ?? summary.projection_target,
        summary.lane_session_account_locale ?? summary.account_locale,
        summary.lane_session_target_language ?? summary.target_language,
      ]);
    const sourceIdentityKey =
      readString(summary.lane_session_source_identity_key) ||
      readString(summary.source_identity_key) ||
      compactKey([
        summary.lane_session_source_id ?? summary.source_id,
        summary.lane_session_source_hash ?? summary.source_hash,
        summary.lane_session_source_text_hash ?? summary.source_text_hash,
        typeof summary.lane_session_source_text_char_count === "number"
          ? String(summary.lane_session_source_text_char_count)
          : typeof summary.source_text_char_count === "number"
            ? String(summary.source_text_char_count)
            : null,
        summary.source_kind,
        summary.lane_session_projection_target ?? summary.projection_target,
        summary.lane_session_account_locale ?? summary.account_locale,
        summary.lane_session_target_language ?? summary.target_language,
      ]);
    const latestSourceIdentityKey =
      readString(summary.latest_source_identity_key) ||
      readString(summary.source_identity_key) ||
      sourceIdentityKey ||
      null;
    const sessionControlKey =
      readString(summary.lane_session_control_key) ||
      compactKey([summary.lane_session_id, sourceBindingKey]);
    const observationKey =
      readString(summary.mail_loop_observation_key) ||
      compactKey([
        summary.source_id,
        summary.source_hash,
        summary.projection_target,
        summary.target_language,
        summary.chunk_id,
        summary.receipt_ref ?? summary.observation_ref,
      ]);
    push({
      stage: "lane_mail_loop",
      selected_runtime_agent_provider: input.provider.id,
      lane_id: summary.lane_id,
      capability_id: summary.capability,
      status: mailDeliveryStatus,
      lane_visible: false,
      lane_requested: true,
      lane_executed: materializedMailLoopEvidence,
      observation_reentered: materializedMailLoopEvidence,
      selected_backend_provider: summary.selected_backend_provider,
      observation_ref: summary.observation_ref,
      receipt_ref: summary.receipt_ref,
      latest_receipt_ref: summary.receipt_ref,
      latest_event_id: summary.stage_play_mail_id,
      lifecycle_action: "mail_loop",
      session_lifecycle_action: "mail_loop",
      session_action: "mail_loop",
      session_control_key: sessionControlKey,
      source_binding_key: sourceBindingKey,
      source_identity_key: sourceIdentityKey,
      latest_source_identity_key: latestSourceIdentityKey,
      latest_observation_key: observationKey,
      has_observation: Boolean(mailLoopEvidenceRef),
      source_id: summary.source_id,
      source_hash: summary.source_hash ?? null,
      source_kind: summary.source_kind,
      source_projection_target: summary.projection_target,
      account_locale: summary.account_locale,
      latest_chunk_id: summary.chunk_id,
      latest_chunk_index: summary.chunk_index,
      latest_source_id: summary.source_id,
      latest_source_hash: summary.source_hash ?? null,
      latest_source_kind: summary.source_kind,
      latest_target_language: summary.target_language,
      latest_dedupe_key: summary.dedupe_key,
      latest_source_event_id: summary.source_event_id,
      latest_source_event_ms: summary.source_event_ms,
      latest_observed_at_ms: summary.observed_at_ms,
      latest_freshness_status: summary.freshness_status,
      source_text_hash: summary.source_text_hash ?? null,
      source_text_char_count: summary.source_text_char_count ?? null,
      latest_projection_target: summary.projection_target,
      target_language: summary.target_language,
      latest_cancel_requested: summary.cancel_requested,
      latest_mail_loop_wake_kind: summary.stage_play_wake_kind,
      mailbox_wake_expected: summary.mailbox_wake_expected,
      decision_wake_expected: summary.decision_wake_expected,
      report_action: summary.stage_play_wake_kind === "mailbox_wake" ? "mailbox_wake" : "record_only",
      report_reason: summary.blocked_reason ?? mailDeliveryStatus,
      report_summary_text: materializedMailLoopEvidence
        ? "lane mail loop materialized observation evidence"
        : "lane mail loop did not materialize observation evidence",
      terminal_authority_status: summary.terminal_authority_status,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  input.goalBindings.goal_binding_debug_summaries.forEach((summary) => {
    const mailLoopSummary = summary.latest_mail_loop_summary;
    const summaryRecord = summary as unknown as Record<string, unknown>;
    const latestReceiptRef = readRankedReceiptRef(
      summaryRecord,
      mailLoopSummary,
    );
    const goalBindingEvidenceRef =
      readString(summary.last_observation_ref) ||
      latestReceiptRef ||
      readString(summary.latest_observation_key) ||
      readString(mailLoopSummary?.observation_ref) ||
      readString(mailLoopSummary?.receipt_ref) ||
      readString(mailLoopSummary?.mail_loop_observation_key);
    const reportDecision = readRecord(summary.report_decision);
    const reportSummaryText =
      readString(summary.report_summary_text) ||
      readString(reportDecision?.summary_text) ||
      null;
    push({
      stage: "goal_binding",
      selected_runtime_agent_provider: summary.selected_runtime_agent_provider,
      lane_id: summary.lane_id,
      capability_id: null,
      status: summary.binding_status,
      lane_visible: false,
      lane_requested: true,
      lane_executed: summary.has_observation === true || Boolean(goalBindingEvidenceRef),
      observation_reentered: Boolean(summary.latest_mail_loop_summary),
      selected_backend_provider: summary.selected_backend_provider,
      observation_ref: summary.last_observation_ref ?? mailLoopSummary?.observation_ref ?? null,
      receipt_ref: latestReceiptRef,
      latest_receipt_ref: latestReceiptRef,
      latest_event_id: summary.latest_event_id,
      lifecycle_action: summary.lifecycle_action,
      session_lifecycle_action: summary.session_lifecycle_action,
      session_action: summary.session_action,
      goal_id: summary.goal_id,
      goal_binding_id: summary.goal_binding_id,
      lane_session_id: summary.lane_session_id,
      session_control_key: summary.session_control_key,
      source_binding_key: summary.source_binding_key,
      source_identity_key: summary.source_identity_key,
      latest_observation_key:
        summary.latest_observation_key ?? summary.latest_mail_loop_observation_key ?? mailLoopSummary?.mail_loop_observation_key ?? null,
      has_observation: summary.has_observation === true || Boolean(goalBindingEvidenceRef),
      source_id: mailLoopSummary?.source_id ?? summary.source_id,
      source_hash: mailLoopSummary?.source_hash ?? summary.source_hash,
      source_kind: mailLoopSummary?.source_kind ?? summary.source_kind,
      source_projection_target: summary.source_projection_target,
      account_locale: summary.account_locale,
      latest_chunk_id: mailLoopSummary?.chunk_id ?? summary.latest_chunk_id,
      latest_chunk_index: mailLoopSummary?.chunk_index ?? summary.latest_chunk_index,
      latest_source_id: mailLoopSummary?.source_id ?? summary.latest_source_id,
      latest_source_hash: mailLoopSummary?.source_hash ?? summary.latest_source_hash,
      latest_source_kind: mailLoopSummary?.source_kind ?? summary.latest_source_kind,
      latest_target_language: mailLoopSummary?.target_language ?? summary.latest_target_language,
      latest_dedupe_key: mailLoopSummary?.dedupe_key ?? summary.latest_dedupe_key,
      latest_source_event_id: mailLoopSummary?.source_event_id ?? summary.latest_source_event_id,
      latest_source_event_ms: mailLoopSummary?.source_event_ms ?? summary.latest_source_event_ms,
      latest_observed_at_ms: mailLoopSummary?.observed_at_ms ?? summary.latest_observed_at_ms,
      latest_freshness_status: mailLoopSummary?.freshness_status ?? summary.latest_freshness_status,
      source_text_hash: summary.source_text_hash,
      source_text_char_count: summary.source_text_char_count,
      latest_projection_target: mailLoopSummary?.projection_target ?? summary.latest_projection_target,
      target_language: mailLoopSummary?.target_language ?? summary.target_language,
      latest_cancel_requested: mailLoopSummary?.cancel_requested ?? summary.latest_cancel_requested,
      latest_mail_loop_wake_kind: mailLoopSummary?.stage_play_wake_kind ?? summary.latest_mail_loop_wake_kind,
      report_action: readString(reportDecision?.action) || null,
      report_reason: readString(reportDecision?.reason) || null,
      quiet_behavior_applied: reportDecision?.quiet_behavior_applied === true,
      wake_expected: reportDecision?.wake_expected === true,
      surface_badge_expected: reportDecision?.surface_badge_expected === true,
      terminal_report_requested: reportDecision?.terminal_report_requested === true,
      terminal_report_authorized: reportDecision?.terminal_report_authorized === true,
      report_summary_text: reportSummaryText,
      terminal_authority_status: summary.terminal_authority_status,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  input.goalDispatchPlans.forEach((plan) => {
    push({
      stage: "lane_goal_dispatch_plan",
      selected_runtime_agent_provider: plan.selected_runtime_agent_provider,
      lane_id: plan.lane_id,
      capability_id: null,
      status: plan.status,
      lane_visible: false,
      lane_requested: true,
      lane_executed: false,
      observation_reentered: Boolean(plan.mail_loop_ref),
      requested_backend_provider: plan.requested_backend_provider,
      selected_backend_provider: plan.selected_backend_provider ?? null,
      fallback_backend_provider: plan.fallback_backend_provider,
      selection_reason: plan.backend_selection_reason,
      cost_class: plan.cost_class,
      latency_class: plan.latency_class,
      privacy_class: plan.privacy_class,
      observation_ref: plan.evidence_ref,
      receipt_ref: plan.receipt_ref,
      latest_event_id: plan.latest_event_id,
      session_control_key: plan.session_control_key,
      source_binding_key: plan.source_binding_key,
      source_identity_key: plan.source_identity_key,
      latest_observation_key: plan.latest_mail_loop_observation_key,
      has_observation: plan.has_observation,
      source_id: plan.source_id,
      source_hash: plan.source_hash,
      source_kind: plan.source_kind,
      source_projection_target: plan.source_projection_target,
      account_locale: plan.account_locale,
      latest_chunk_id: plan.latest_chunk_id,
      latest_chunk_index: plan.latest_chunk_index,
      latest_source_id: plan.latest_source_id,
      latest_source_hash: plan.latest_source_hash,
      latest_source_kind: plan.latest_source_kind,
      latest_target_language: plan.latest_target_language,
      latest_dedupe_key: plan.latest_dedupe_key,
      latest_source_event_id: plan.latest_source_event_id,
      latest_source_event_ms: plan.latest_source_event_ms,
      latest_observed_at_ms: plan.latest_observed_at_ms,
      latest_freshness_status: plan.latest_freshness_status,
      source_text_hash: plan.source_text_hash,
      source_text_char_count: plan.source_text_char_count,
      latest_projection_target: plan.latest_projection_target,
      target_language: plan.target_language,
      latest_cancel_requested: plan.latest_cancel_requested,
      latest_mail_loop_wake_kind: plan.latest_mail_loop_wake_kind,
      goal_id: plan.goal_id,
      goal_binding_id: plan.goal_binding_id,
      lane_session_id: plan.lane_session_id,
      mail_loop_ref: plan.mail_loop_ref,
      dispatch_target: plan.target,
      materialized_mail_loop_evidence: Boolean(plan.mail_loop_ref),
      wake_dispatch_allowed: false,
      side_effects_allowed: false,
      report_action: plan.source_report_action,
      report_reason: plan.reason,
      report_summary_text: plan.source_report_summary_text,
      terminal_authority_status: plan.terminal_authority_status,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  input.goalDispatchAdmissions.forEach((admission) => {
    push({
      stage: "lane_goal_dispatch_admission",
      selected_runtime_agent_provider: admission.selected_runtime_agent_provider,
      lane_id: admission.lane_id,
      capability_id: null,
      status: admission.status,
      lane_visible: false,
      lane_requested: true,
      lane_executed: false,
      observation_reentered: Boolean(admission.mail_loop_ref),
      requested_backend_provider: admission.requested_backend_provider,
      selected_backend_provider: admission.selected_backend_provider ?? null,
      fallback_backend_provider: admission.fallback_backend_provider,
      selection_reason: admission.backend_selection_reason,
      cost_class: admission.cost_class,
      latency_class: admission.latency_class,
      privacy_class: admission.privacy_class,
      observation_ref: admission.evidence_ref,
      receipt_ref: admission.receipt_ref,
      latest_event_id: admission.latest_event_id,
      session_control_key: admission.session_control_key,
      source_binding_key: admission.source_binding_key,
      source_identity_key: admission.source_identity_key,
      latest_observation_key: admission.latest_mail_loop_observation_key,
      has_observation: admission.has_observation,
      source_id: admission.source_id,
      source_hash: admission.source_hash,
      source_kind: admission.source_kind,
      source_projection_target: admission.source_projection_target,
      account_locale: admission.account_locale,
      latest_chunk_id: admission.latest_chunk_id,
      latest_chunk_index: admission.latest_chunk_index,
      latest_source_id: admission.latest_source_id,
      latest_source_hash: admission.latest_source_hash,
      latest_source_kind: admission.latest_source_kind,
      latest_target_language: admission.latest_target_language,
      latest_dedupe_key: admission.latest_dedupe_key,
      latest_source_event_id: admission.latest_source_event_id,
      latest_source_event_ms: admission.latest_source_event_ms,
      latest_observed_at_ms: admission.latest_observed_at_ms,
      latest_freshness_status: admission.latest_freshness_status,
      source_text_hash: admission.source_text_hash,
      source_text_char_count: admission.source_text_char_count,
      latest_projection_target: admission.latest_projection_target,
      target_language: admission.target_language,
      latest_cancel_requested: admission.latest_cancel_requested,
      latest_mail_loop_wake_kind: admission.latest_mail_loop_wake_kind,
      goal_id: admission.goal_id,
      goal_binding_id: admission.goal_binding_id,
      lane_session_id: admission.lane_session_id,
      mail_loop_ref: admission.mail_loop_ref,
      dispatch_target: admission.target,
      dispatch_admission_status: admission.status,
      dispatch_blocked_reason: admission.blocked_reason,
      materialized_mail_loop_evidence: Boolean(admission.mail_loop_ref),
      wake_dispatch_allowed: admission.wake_dispatch_allowed,
      side_effects_allowed: admission.side_effects_allowed,
      report_action: admission.target,
      report_reason: admission.reason,
      terminal_authority_status: admission.terminal_authority_status,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  if (input.goalDispatchReadiness) {
    const readinessStatus = readGoalDispatchReadinessTimelineStatus(input.goalDispatchReadiness);
    push({
      stage: "lane_goal_dispatch_readiness",
      selected_runtime_agent_provider: input.goalDispatchReadiness.next_runtime_agent_providers?.[0] ?? input.provider.id,
      lane_id: input.goalDispatchReadiness.next_lane_ids[0] ?? "capability_lane_goal_dispatch",
      capability_id: null,
      status: readinessStatus,
      lane_visible: false,
      lane_requested: input.goalDispatchReadiness.total_plans > 0,
      lane_executed: false,
      observation_reentered: input.goalDispatchReadiness.next_evidence_refs.length > 0,
      requested_backend_provider: input.goalDispatchReadiness.next_requested_backend_providers?.[0] ?? null,
      selected_backend_provider: input.goalDispatchReadiness.next_selected_backend_providers?.[0] ?? null,
      fallback_backend_provider: input.goalDispatchReadiness.next_fallback_backend_providers?.[0] ?? null,
      selection_reason: input.goalDispatchReadiness.next_backend_selection_reasons?.[0] ?? null,
      cost_class: input.goalDispatchReadiness.next_cost_classes?.[0] ?? null,
      latency_class: input.goalDispatchReadiness.next_latency_classes?.[0] ?? null,
      privacy_class: input.goalDispatchReadiness.next_privacy_classes?.[0] ?? null,
      observation_ref: input.goalDispatchReadiness.next_evidence_refs[0] ?? null,
      receipt_ref: input.goalDispatchReadiness.next_receipt_refs[0] ?? null,
      latest_event_id: input.goalDispatchReadiness.next_latest_event_ids[0] ?? null,
      session_control_key: input.goalDispatchReadiness.next_session_control_keys[0] ?? null,
      source_binding_key: input.goalDispatchReadiness.next_source_binding_keys[0] ?? null,
      source_identity_key: input.goalDispatchReadiness.next_source_identity_keys?.[0] ?? null,
      latest_observation_key: input.goalDispatchReadiness.next_mail_loop_observation_keys[0] ?? null,
      has_observation: input.goalDispatchReadiness.next_has_observation,
      source_id: input.goalDispatchReadiness.next_source_ids[0] ?? null,
      source_hash: input.goalDispatchReadiness.next_source_hashes[0] ?? null,
      source_kind: input.goalDispatchReadiness.next_source_kinds[0] ?? null,
      source_projection_target: input.goalDispatchReadiness.next_source_projection_targets[0] ?? null,
      account_locale: input.goalDispatchReadiness.next_account_locales[0] ?? null,
      latest_chunk_id: input.goalDispatchReadiness.next_chunk_ids[0] ?? null,
      latest_chunk_index: input.goalDispatchReadiness.next_chunk_indexes[0] ?? null,
      latest_source_id: input.goalDispatchReadiness.next_latest_source_ids[0] ?? null,
      latest_source_hash: input.goalDispatchReadiness.next_latest_source_hashes[0] ?? null,
      latest_source_kind: input.goalDispatchReadiness.next_latest_source_kinds[0] ?? null,
      latest_target_language: input.goalDispatchReadiness.next_latest_target_languages[0] ?? null,
      latest_dedupe_key: input.goalDispatchReadiness.next_dedupe_keys[0] ?? null,
      latest_source_event_id: input.goalDispatchReadiness.next_source_event_ids[0] ?? null,
      latest_source_event_ms: input.goalDispatchReadiness.next_source_event_mses[0] ?? null,
      latest_observed_at_ms: input.goalDispatchReadiness.next_observed_at_mses[0] ?? null,
      latest_freshness_status: input.goalDispatchReadiness.next_freshness_statuses[0] ?? null,
      source_text_hash: input.goalDispatchReadiness.next_source_text_hashes[0] ?? null,
      source_text_char_count: input.goalDispatchReadiness.next_source_text_char_counts[0] ?? null,
      latest_projection_target: input.goalDispatchReadiness.next_projection_targets[0] ?? null,
      target_language: input.goalDispatchReadiness.next_target_languages[0] ?? null,
      latest_cancel_requested: input.goalDispatchReadiness.next_cancel_requested,
      latest_mail_loop_wake_kind: input.goalDispatchReadiness.next_mail_loop_wake_kinds[0] ?? null,
      goal_binding_id: input.goalDispatchReadiness.next_goal_binding_ids[0] ?? null,
      lane_session_id: input.goalDispatchReadiness.next_lane_session_ids[0] ?? null,
      dispatch_target: input.goalDispatchReadiness.next_dispatch_targets[0] ?? null,
      dispatch_admission_status: readinessStatus,
      dispatch_blocked_reason: input.goalDispatchReadiness.blocked_reasons[0] ?? null,
      materialized_mail_loop_evidence: input.goalDispatchReadiness.next_mail_loop_observation_keys.length > 0,
      wake_dispatch_allowed: input.goalDispatchReadiness.wake_dispatch_allowed,
      side_effects_allowed: input.goalDispatchReadiness.side_effects_allowed,
      terminal_authority_status: "not_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }

  return rows;
};

export const buildHelixCapabilityLaneProviderAdapterContext = async (input: {
  provider: HelixAgentProvider;
  body: Record<string, unknown>;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
  sessionStore?: HelixCapabilityLaneSessionStore;
  goalBindingStore?: HelixCapabilityLaneGoalBindingStore;
  authorizedGatewayCapabilities?: HelixWorkstationCapabilityManifest[];
  accountType?: HelixAccountType | null;
  profileId?: string | null;
}): Promise<HelixCapabilityLaneProviderAdapterContext> => {
  const turnId = readString(input.turnId) || readString(input.body.turn_id ?? input.body.turnId) || "ask:capability-lane";
  const oneShot = await runHelixCapabilityLaneOneShotRequests({
    provider: input.provider,
    body: input.body,
    turnId,
    iteration: input.iteration,
    env: input.env,
    authorizedGatewayCapabilities: input.authorizedGatewayCapabilities,
    accountType: input.accountType,
    profileId: input.profileId,
  });
  const sessions = runHelixCapabilityLaneSessionRequests({
    provider: input.provider,
    body: input.body,
    env: input.env,
    store: input.sessionStore,
  });
  const goalBindings = runHelixCapabilityLaneGoalBindingRequests({
    body: input.body,
    store: input.goalBindingStore,
    sessionStore: input.sessionStore,
  });
  const modelVisibleCapabilityLaneManifest = buildModelVisibleCapabilityLaneManifest(listHelixCapabilityLanes({
    provider: input.provider,
    env: input.env,
  }));
  const artifactLedger = buildCapabilityLaneArtifactLedger({
    turnId,
    packets: oneShot.observation_packets,
  });
  const projectionReceipts = buildCapabilityLaneProviderAdapterReceipts({
    packets: oneShot.observation_packets,
  });
  const mailLoopDebugSummaries = buildCapabilityLaneMailLoopDebugSummaries(
    goalBindings.goal_binding_debug_summaries,
  );
  const goalDispatchPlans = buildCapabilityLaneGoalDispatchPlans(
    goalBindings.goal_binding_debug_summaries,
  );
  const goalDispatchAdmissions = buildCapabilityLaneGoalDispatchAdmissions(
    goalBindings.goal_binding_debug_summaries,
  );
  const goalDispatchReadiness = goalDispatchPlans.length > 0 || goalDispatchAdmissions.length > 0
    ? buildHelixCapabilityLaneGoalDispatchReadiness({
      plans: goalDispatchPlans,
      admissions: goalDispatchAdmissions,
    })
    : null;
  const timeline = buildCapabilityLaneProviderTimeline({
    provider: input.provider,
    manifest: modelVisibleCapabilityLaneManifest,
    oneShot,
    projectionReceipts,
    sessions,
    mailLoopDebugSummaries,
    goalBindings,
    goalDispatchPlans,
    goalDispatchAdmissions,
    goalDispatchReadiness,
  });
  const reentryCallSummaries = oneShot.call_results.map((result) => {
    const record = readRecord(result) ?? {};
    const observation = readRecord(record.observation);
    const receipt = readRecord(record.receipt);
    const resultValues = Object.fromEntries(
      Object.entries(record).filter(([key]) => ![
        "lane_resolve_trace",
        "observation",
        "observation_packet",
        "receipt",
      ].includes(key)),
    );
    return {
      ...resultValues,
      capability: readString(record.capability),
      ok: record.ok === true,
      status: readString(record.status) || (record.ok === true ? "succeeded" : "failed"),
      observation_ref:
        readString(record.observation_ref) ||
        readString(observation?.observation_ref) ||
        null,
      receipt_ref:
        readString(record.receipt_ref) ||
        readString(receipt?.receipt_ref) ||
        null,
      selected_backend_provider: readString(record.selected_backend_provider) || null,
      error: readString(record.error) || null,
      terminal_eligible: false,
      assistant_answer: false,
    };
  });
  return {
    schema: "helix.capability_lane.provider_adapter_context.v1",
    one_shot: oneShot,
    sessions,
    goal_bindings: goalBindings,
    model_visible_capability_lane_manifest: modelVisibleCapabilityLaneManifest,
    debug_projection: {
      ...oneShot.debug_projection,
      model_visible_capability_lane_manifest: modelVisibleCapabilityLaneManifest,
      capability_lane_projection_receipts: projectionReceipts,
      capability_lane_turn_timeline: timeline,
      capability_lane_session_results: sessions.session_results,
      capability_lane_session_debug_summaries: sessions.session_debug_summaries,
      capability_lane_mail_loop_debug_summaries: mailLoopDebugSummaries,
      capability_lane_goal_binding_results: goalBindings.goal_binding_results,
      capability_lane_goal_binding_debug_summaries: goalBindings.goal_binding_debug_summaries,
      capability_lane_goal_dispatch_plans: goalDispatchPlans,
      capability_lane_goal_dispatch_admissions: goalDispatchAdmissions,
      capability_lane_goal_dispatch_readiness: goalDispatchReadiness,
    },
    observation_packets: oneShot.observation_packets,
    projection_receipts: projectionReceipts,
    capability_lane_turn_timeline: timeline,
    artifact_ledger: artifactLedger,
    prompt_observation_block: JSON.stringify(compactCapabilityLaneModelValue({
      model_visible_capability_lane_manifest: modelVisibleCapabilityLaneManifest,
      capability_lane_call_results: oneShot.call_results,
      capability_lane_observation_packets: oneShot.observation_packets,
      capability_lane_backend_selections: oneShot.backend_selections,
      capability_lane_projection_receipts: projectionReceipts,
      capability_lane_turn_timeline: timeline,
      capability_lane_session_results: sessions.session_results,
      capability_lane_session_debug_summaries: sessions.session_debug_summaries,
      capability_lane_mail_loop_debug_summaries: mailLoopDebugSummaries,
      capability_lane_goal_binding_results: goalBindings.goal_binding_results,
      capability_lane_goal_binding_debug_summaries: goalBindings.goal_binding_debug_summaries,
      capability_lane_goal_dispatch_plans: goalDispatchPlans,
      capability_lane_goal_dispatch_admissions: goalDispatchAdmissions,
      capability_lane_goal_dispatch_readiness: goalDispatchReadiness,
      capability_lane_reentry_status: oneShot.debug_projection.capability_lane_reentry_status,
    }), null, 2),
    reentry_observation_block: JSON.stringify(compactCapabilityLaneModelValue({
      capability_lane_call_summaries: reentryCallSummaries,
      capability_lane_observation_packets: oneShot.observation_packets,
      capability_lane_projection_receipts: projectionReceipts,
      capability_lane_session_results: sessions.session_results,
      capability_lane_goal_binding_results: goalBindings.goal_binding_results,
      capability_lane_goal_dispatch_plans: goalDispatchPlans,
      capability_lane_goal_dispatch_admissions: goalDispatchAdmissions,
      capability_lane_goal_dispatch_readiness: goalDispatchReadiness,
      capability_lane_reentry_status: oneShot.debug_projection.capability_lane_reentry_status,
    }), null, 2),
    calls_succeeded:
      (oneShot.call_results.length === 0 ||
        oneShot.call_results.every((result) =>
          result.ok === true || isObservedTextToSpeechReceiptResult(result as Record<string, unknown>)
        )) &&
      sessions.session_results.every((result) => result.ok === true) &&
      goalBindings.goal_binding_results.every((result) => result.ok === true),
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
