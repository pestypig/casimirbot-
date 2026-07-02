import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
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

export type HelixCapabilityLaneProviderAdapterContext = {
  schema: "helix.capability_lane.provider_adapter_context.v1";
  one_shot: HelixCapabilityLaneOneShotRunnerResult;
  sessions: HelixCapabilityLaneSessionRunnerResult;
  model_visible_capability_lane_manifest: HelixAgentModelVisibleCapabilityLaneManifest;
  debug_projection: HelixCapabilityLaneOneShotRunnerResult["debug_projection"] & {
    model_visible_capability_lane_manifest: HelixAgentModelVisibleCapabilityLaneManifest;
    capability_lane_projection_receipts: HelixCapabilityLaneProviderAdapterReceipt[];
    capability_lane_session_results: HelixCapabilityLaneSessionRunnerResult["session_results"];
    capability_lane_session_debug_summaries: HelixCapabilityLaneSessionRunnerResult["session_debug_summaries"];
  };
  observation_packets: HelixAgentStepObservationPacket[];
  projection_receipts: HelixCapabilityLaneProviderAdapterReceipt[];
  artifact_ledger: Array<Record<string, unknown>>;
  prompt_observation_block: string;
  calls_succeeded: boolean;
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
    const selectedBackendProvider =
      readString(shadowExecution?.selected_backend_provider) ||
      readString(packet.backend_selection_decision?.selected_backend_provider) ||
      null;
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
      lane_id: readString(shadowExecution?.lane_id) || null,
      selected_backend_provider: selectedBackendProvider,
      backend_selection_decision: packet.backend_selection_decision ?? null,
      lane_execution_status: readString(shadowExecution?.execution_status) || null,
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

export const buildHelixCapabilityLaneProviderAdapterContext = (input: {
  provider: HelixAgentProvider;
  body: Record<string, unknown>;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
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
  return {
    schema: "helix.capability_lane.provider_adapter_context.v1",
    one_shot: oneShot,
    sessions,
    model_visible_capability_lane_manifest: modelVisibleCapabilityLaneManifest,
    debug_projection: {
      ...oneShot.debug_projection,
      model_visible_capability_lane_manifest: modelVisibleCapabilityLaneManifest,
      capability_lane_projection_receipts: projectionReceipts,
      capability_lane_session_results: sessions.session_results,
      capability_lane_session_debug_summaries: sessions.session_debug_summaries,
    },
    observation_packets: oneShot.observation_packets,
    projection_receipts: projectionReceipts,
    artifact_ledger: artifactLedger,
    prompt_observation_block: JSON.stringify({
      model_visible_capability_lane_manifest: modelVisibleCapabilityLaneManifest,
      capability_lane_call_results: oneShot.call_results,
      capability_lane_observation_packets: oneShot.observation_packets,
      capability_lane_backend_selections: oneShot.backend_selections,
      capability_lane_projection_receipts: projectionReceipts,
      capability_lane_session_results: sessions.session_results,
      capability_lane_session_debug_summaries: sessions.session_debug_summaries,
      capability_lane_reentry_status: oneShot.debug_projection.capability_lane_reentry_status,
    }, null, 2),
    calls_succeeded:
      (oneShot.call_results.length === 0 ||
        oneShot.call_results.every((result) => result.ok === true)) &&
      sessions.session_results.every((result) => result.ok === true),
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
