import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type { HelixCapabilityLaneMailLoopDebugSummary } from "@shared/helix-capability-lane-mail-loop";
import type { HelixAgentProvider } from "../agent-providers/types";
import type { HelixAgentModelVisibleCapabilityLaneManifest } from "../agent-providers/runtime-adapter-contract";
import { buildModelVisibleCapabilityLaneManifest } from "../agent-providers/runtime-adapter-contract";
import { listHelixCapabilityLanes } from "./registry";
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
  };
  observation_packets: HelixAgentStepObservationPacket[];
  projection_receipts: HelixCapabilityLaneProviderAdapterReceipt[];
  capability_lane_turn_timeline: HelixCapabilityLaneProviderTimelineEvent[];
  artifact_ledger: Array<Record<string, unknown>>;
  prompt_observation_block: string;
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
    | "goal_binding"
    | "terminal_selected"
    | "terminal_rejected";
  selected_runtime_agent_provider: HelixAgentProvider["id"];
  lane_id: string;
  capability_id: string | null;
  status: string;
  lane_visible: boolean;
  lane_requested: boolean;
  lane_executed: boolean;
  observation_reentered: boolean;
  selected_backend_provider: string | null;
  observation_ref: string | null;
  receipt_ref: string | null;
  latest_event_id: string | null;
  lifecycle_action?: string | null;
  session_lifecycle_action?: string | null;
  session_action?: string | null;
  session_control_key?: string | null;
  source_binding_key?: string | null;
  latest_observation_key?: string | null;
  has_observation: boolean;
  source_id?: string | null;
  source_hash?: string | null;
  source_kind?: string | null;
  source_projection_target?: string | null;
  account_locale?: string | null;
  latest_chunk_id?: string | null;
  latest_chunk_index?: number | null;
  latest_source_id?: string | null;
  latest_source_hash?: string | null;
  latest_source_kind?: string | null;
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
  report_action?: string | null;
  report_reason?: string | null;
  report_summary_text?: string | null;
  terminal_authority_status: string;
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

export const buildCapabilityLaneArtifactLedger = (input: {
  turnId: string;
  packets: HelixAgentStepObservationPacket[];
}): Array<Record<string, unknown>> =>
  input.packets.map((packet, index) => {
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
    return {
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

const buildCapabilityLaneProviderTimeline = (input: {
  provider: HelixAgentProvider;
  manifest: HelixAgentModelVisibleCapabilityLaneManifest;
  oneShot: HelixCapabilityLaneOneShotRunnerResult;
  projectionReceipts: HelixCapabilityLaneProviderAdapterReceipt[];
  sessions: HelixCapabilityLaneSessionRunnerResult;
  goalBindings: HelixCapabilityLaneGoalBindingRunnerResult;
}): HelixCapabilityLaneProviderTimelineEvent[] => {
  const rows: HelixCapabilityLaneProviderTimelineEvent[] = [];
  const push = (row: Omit<HelixCapabilityLaneProviderTimelineEvent, "schema" | "seq">) => {
    rows.push({
      schema: "helix.capability_lane.provider_timeline_event.v1",
      seq: rows.length,
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
      lane_executed: event.stage === "lane_observation" && event.status === "completed",
      observation_reentered: event.stage === "lane_reentered",
      selected_backend_provider: event.selected_backend_provider,
      observation_ref: event.observation_ref,
      receipt_ref: event.receipt_ref,
      latest_event_id: null,
      has_observation: Boolean(event.observation_ref),
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
      source_hash: readString(payload?.source_hash) || null,
      source_kind: readString(payload?.source_kind) || null,
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

  input.sessions.session_debug_summaries.forEach((summary) => {
    push({
      stage: "lane_session",
      selected_runtime_agent_provider: summary.selected_runtime_agent_provider,
      lane_id: summary.lane_id,
      capability_id: null,
      status: summary.session_status,
      lane_visible: false,
      lane_requested: true,
      lane_executed: Boolean(summary.last_observation_ref),
      observation_reentered: false,
      selected_backend_provider: summary.selected_backend_provider,
      observation_ref: summary.last_observation_ref,
      receipt_ref: summary.last_receipt_ref,
      latest_event_id: summary.latest_event_id,
      lifecycle_action: summary.lifecycle_action,
      session_lifecycle_action: summary.session_lifecycle_action,
      session_action: summary.session_action,
      session_control_key: summary.session_control_key,
      source_binding_key: summary.source_binding_key,
      latest_observation_key: summary.latest_observation_key,
      has_observation: summary.has_observation,
      source_id: summary.source_id,
      source_hash: summary.source_hash,
      source_kind: summary.source_kind,
      source_projection_target: summary.projection_target,
      account_locale: summary.account_locale,
      latest_chunk_id: summary.latest_chunk_id,
      latest_chunk_index: summary.latest_chunk_index,
      latest_source_id: summary.latest_source_id,
      latest_source_hash: summary.latest_source_hash,
      latest_source_kind: summary.latest_source_kind,
      latest_target_language: summary.latest_target_language,
      latest_dedupe_key: summary.latest_dedupe_key,
      latest_source_event_id: summary.latest_source_event_id,
      latest_source_event_ms: summary.latest_source_event_ms,
      latest_observed_at_ms: summary.latest_observed_at_ms,
      latest_freshness_status: summary.latest_freshness_status,
      source_text_hash: summary.source_text_hash,
      source_text_char_count: summary.source_text_char_count,
      latest_projection_target: summary.latest_projection_target,
      target_language: summary.target_language,
      latest_cancel_requested: summary.latest_cancel_requested,
      terminal_authority_status: summary.terminal_authority_status,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  input.goalBindings.goal_binding_debug_summaries.forEach((summary) => {
    const mailLoopSummary = summary.latest_mail_loop_summary;
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
      lane_executed: Boolean(summary.last_observation_ref),
      observation_reentered: Boolean(summary.latest_mail_loop_summary),
      selected_backend_provider: summary.selected_backend_provider,
      observation_ref: summary.last_observation_ref,
      receipt_ref: summary.last_receipt_ref,
      latest_event_id: summary.latest_event_id,
      lifecycle_action: summary.lifecycle_action,
      session_lifecycle_action: summary.session_lifecycle_action,
      session_action: summary.session_action,
      session_control_key: summary.session_control_key,
      source_binding_key: summary.source_binding_key,
      latest_observation_key: summary.latest_observation_key,
      has_observation: summary.has_observation,
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
      report_summary_text: reportSummaryText,
      terminal_authority_status: summary.terminal_authority_status,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  return rows;
};

export const buildHelixCapabilityLaneProviderAdapterContext = (input: {
  provider: HelixAgentProvider;
  body: Record<string, unknown>;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
  sessionStore?: HelixCapabilityLaneSessionStore;
  goalBindingStore?: HelixCapabilityLaneGoalBindingStore;
}): HelixCapabilityLaneProviderAdapterContext => {
  const turnId = readString(input.turnId) || readString(input.body.turn_id ?? input.body.turnId) || "ask:capability-lane";
  const oneShot = runHelixCapabilityLaneOneShotRequests({
    provider: input.provider,
    body: input.body,
    turnId,
    iteration: input.iteration,
    env: input.env,
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
  const timeline = buildCapabilityLaneProviderTimeline({
    provider: input.provider,
    manifest: modelVisibleCapabilityLaneManifest,
    oneShot,
    projectionReceipts,
    sessions,
    goalBindings,
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
    },
    observation_packets: oneShot.observation_packets,
    projection_receipts: projectionReceipts,
    capability_lane_turn_timeline: timeline,
    artifact_ledger: artifactLedger,
    prompt_observation_block: JSON.stringify({
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
      capability_lane_reentry_status: oneShot.debug_projection.capability_lane_reentry_status,
    }, null, 2),
    calls_succeeded:
      (oneShot.call_results.length === 0 ||
        oneShot.call_results.every((result) => result.ok === true)) &&
      sessions.session_results.every((result) => result.ok === true) &&
      goalBindings.goal_binding_results.every((result) => result.ok === true),
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
