import crypto from "node:crypto";
import type { HelixEventJournalQueryResult } from "@shared/helix-event-journal-query";
import type { HelixLiveLineToolEvaluation } from "@shared/helix-live-line-tool-evaluation";
import type { HelixLiveLineToolRequest } from "@shared/helix-live-line-tool-request";
import type { HelixMinecraftWorldSenseContext } from "@shared/helix-minecraft-world-sense";
import { getLiveAnswerEnvironment, updateLiveAnswerEnvironment } from "../situation-room/live-answer-environment-store";
import { appendInterpretedEvent } from "../situation-room/interpreted-event-log-store";
import {
  getLiveLineToolRequest,
  updateLiveLineToolRequestStatus,
} from "../situation-room/live-line-tool-request-store";
import { lookupGameSemanticReference } from "../situation-room/game-semantic-reference";
import { alignVisualFrameWithEvents, getLatestVisualFrame } from "../situation-room/visual-snapshot-store";
import { getLatestMinecraftWorldSenseContextForRoom } from "../situation-room/minecraft-world-sense-window";
import { queryMinecraftNavigationState } from "../situation-room/minecraft-navigation-state-store";
import { queryEventWindow } from "../situation-room/event-window-query";
import { evaluateLiveLineToolRequest } from "./live-line-tool-evaluator";

type LineToolReceiptStatus = "observed" | "failed";

export type LiveLineToolChainReceipt = {
  schema: "helix.live_line_tool_chain_receipt.v1";
  ok: boolean;
  request_id: string;
  requested_tool: HelixLiveLineToolRequest["requested_tool"];
  receipt_id: string;
  status: LineToolReceiptStatus;
  summary: string;
  evidence_refs: string[];
  observation?: unknown;
  deterministic_content_role: "evidence_not_assistant_answer";
  assistant_answer: false;
  raw_content_included: false;
};

export type WorkstationToolChainRunResult = {
  request: HelixLiveLineToolRequest;
  receipt: LiveLineToolChainReceipt;
  evaluation: HelixLiveLineToolEvaluation;
  dynamic_tool_call: {
    schema: "helix.dynamic_tool_call.v1";
    tool_id: HelixLiveLineToolRequest["requested_tool"];
    request_id: string;
    thread_id: string;
    assistant_answer: false;
    raw_content_included: false;
  };
  environment_delta?: unknown | null;
  interpreted_event?: unknown | null;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const inferMinecraftEventTypes = (request: HelixLiveLineToolRequest): string[] => {
  const text = lower([
    request.line_key,
    request.line_label,
    request.line_value,
    request.reason_summary,
  ].join(" "));
  if (/\b(?:lava|bucket|fluid|water|light)\b/.test(text)) {
    return ["bucket_empty", "bucket_fill", "fluid_changed", "light_level_sample"];
  }
  if (/\b(?:threat|risk|danger|hostile|creeper|explosion|damage)\b/.test(text)) {
    return ["hostile_nearby", "creeper_fuse_started", "explosion_imminent", "player_damage"];
  }
  if (/\b(?:chicken|cow|zombie|entity|farm|egg|mob|containment)\b/.test(text)) {
    return ["entity_cluster_sample", "containment_context_sample", "item_flow_context", "item_used", "item_acquired"];
  }
  if (/\b(?:block|stair|trench|mine|structure)\b/.test(text)) {
    return ["block_edit", "block_broken", "block_placed", "bucket_empty", "fluid_changed"];
  }
  return [];
};

const contextQueryRefs = (context: HelixMinecraftWorldSenseContext | null, request: HelixLiveLineToolRequest): string[] => {
  const refs: string[] = [request.line_key, request.line_label, request.line_value ?? ""];
  for (const cluster of context?.entity_clusters ?? []) {
    refs.push(cluster.entity_type);
    for (const flow of cluster.item_flow ?? []) refs.push(flow.item_type);
  }
  for (const note of context?.environment_notes ?? []) {
    if (/lava/i.test(note)) refs.push("minecraft:lava");
    if (/water/i.test(note)) refs.push("minecraft:water");
    if (/hostile|creeper/i.test(note)) refs.push("minecraft:entity/creeper");
  }
  return uniqueStrings(refs.flatMap((value) => String(value).split(/\s+/))).slice(0, 24);
};

const makeReceipt = (input: {
  request: HelixLiveLineToolRequest;
  ok: boolean;
  summary: string;
  evidence_refs?: string[];
  observation?: unknown;
}): LiveLineToolChainReceipt => ({
  schema: "helix.live_line_tool_chain_receipt.v1",
  ok: input.ok,
  request_id: input.request.request_id,
  requested_tool: input.request.requested_tool,
  receipt_id: `live_line_tool_receipt:${hashShort([
    input.request.request_id,
    input.request.requested_tool,
    input.summary,
    input.evidence_refs ?? [],
  ])}`,
  status: input.ok ? "observed" : "failed",
  summary: input.summary,
  evidence_refs: uniqueStrings(input.evidence_refs ?? []),
  observation: input.observation,
  deterministic_content_role: "evidence_not_assistant_answer",
  assistant_answer: false,
  raw_content_included: false,
});

const runMinecraftEventWindow = (input: {
  request: HelixLiveLineToolRequest;
  roomId?: string | null;
  sourceId?: string | null;
  worldId?: string | null;
  limit?: number;
}): {
  receipt: LiveLineToolChainReceipt;
  supports: HelixLiveLineToolEvaluation["supports_line"];
  nextLineValue: string | null;
  missingEvidence: string[];
} => {
  const eventTypes = inferMinecraftEventTypes(input.request);
  const result: HelixEventJournalQueryResult = queryEventWindow({
    thread_id: null,
    room_id: input.roomId ?? null,
    source_id: input.sourceId ?? null,
    world_id: input.worldId ?? null,
    event_types: eventTypes,
    limit: input.limit ?? 40,
    include_raw_events: false,
  });
  const evidenceRefs = uniqueStrings(result.events.flatMap((event) => event.evidence_refs));
  const eventLabel = eventTypes.length > 0 ? eventTypes.join(", ") : "recent Minecraft";
  const summary = result.returned_count > 0
    ? `Found ${result.returned_count} compact ${eventLabel} event(s) for ${input.request.line_label}.`
    : `No compact ${eventLabel} event was found for ${input.request.line_label}.`;
  return {
    receipt: makeReceipt({
      request: input.request,
      ok: true,
      summary,
      evidence_refs: evidenceRefs,
      observation: {
        schema: "helix.event_journal_query_result.v1",
        query_id: result.query_id,
        matched_count: result.matched_count,
        returned_count: result.returned_count,
        event_types: eventTypes,
        compact_summaries: result.events.map((event) => event.compact_summary).slice(-8),
        raw_content_included: result.raw_content_included,
        assistant_answer: result.assistant_answer,
      },
    }),
    supports: result.returned_count > 0 ? "supports" : "unknown",
    nextLineValue: result.returned_count > 0
      ? `${input.request.line_label} check: ${summary}`
      : null,
    missingEvidence: result.returned_count > 0 ? [] : [`No ${eventLabel} event observed in the queried compact window.`],
  };
};

const runMinecraftWorldSenseWindow = (input: {
  request: HelixLiveLineToolRequest;
  roomId?: string | null;
}): {
  receipt: LiveLineToolChainReceipt;
  supports: HelixLiveLineToolEvaluation["supports_line"];
  nextLineValue: string | null;
  missingEvidence: string[];
} => {
  const context = input.roomId ? getLatestMinecraftWorldSenseContextForRoom(input.roomId) : null;
  const hints = context?.interpretation_hints ?? [];
  const clusters = context?.entity_clusters ?? [];
  const summary = context
    ? `World-sense window has ${clusters.length} entity cluster(s), ${hints.length} interpretation hint(s), and ${context.missing_evidence.length} missing-evidence note(s).`
    : "No compact Minecraft world-sense window is available yet.";
  return {
    receipt: makeReceipt({
      request: input.request,
      ok: true,
      summary,
      evidence_refs: context?.evidence_refs ?? [],
      observation: context
        ? {
            schema: context.schema,
            context_id: context.context_id,
            entity_clusters: clusters.map((cluster) => ({
              entity_type: cluster.entity_type,
              count: cluster.count,
              density: cluster.density,
              has_containment: Boolean(cluster.containment),
              item_flow_count: cluster.item_flow?.length ?? 0,
            })),
            interpretation_hints: hints.map((hint) => ({
              label: hint.label,
              confidence: hint.confidence,
              missing_evidence: hint.missing_evidence,
            })),
            raw_logs_included: context.raw_logs_included,
          }
        : null,
    }),
    supports: context && (hints.length > 0 || clusters.length > 0) ? "partial" : "unknown",
    nextLineValue: context && (hints.length > 0 || clusters.length > 0)
      ? `${input.request.line_label} check: ${summary}`
      : null,
    missingEvidence: context?.missing_evidence ?? ["No world-sense context has been built for this room yet."],
  };
};

const runMinecraftSemanticLookup = (input: {
  request: HelixLiveLineToolRequest;
  roomId?: string | null;
}): {
  receipt: LiveLineToolChainReceipt;
  supports: HelixLiveLineToolEvaluation["supports_line"];
  nextLineValue: string | null;
  missingEvidence: string[];
} => {
  const context = input.roomId ? getLatestMinecraftWorldSenseContextForRoom(input.roomId) : null;
  const { receipt: semanticReceipt, entries } = lookupGameSemanticReference({
    threadId: input.request.thread_id,
    gameId: "minecraft",
    queryRefs: contextQueryRefs(context, input.request),
  });
  const summary = semanticReceipt.compact_summary;
  return {
    receipt: makeReceipt({
      request: input.request,
      ok: true,
      summary,
      evidence_refs: [semanticReceipt.lookup_id, ...(context?.evidence_refs ?? [])],
      observation: {
        schema: semanticReceipt.schema,
        lookup_id: semanticReceipt.lookup_id,
        matched_entry_ids: semanticReceipt.matched_entry_ids,
        compact_summary: semanticReceipt.compact_summary,
        raw_reference_included: semanticReceipt.raw_reference_included,
        assistant_answer: semanticReceipt.assistant_answer,
      },
    }),
    supports: entries.length > 0 ? "partial" : "unknown",
    nextLineValue: entries.length > 0
      ? `${input.request.line_label} semantic check: ${summary}`
      : null,
    missingEvidence: entries.length > 0 ? [] : ["No semantic reference matched the compact line/world-sense refs."],
  };
};

const runMinecraftNavigationStateQuery = (input: {
  request: HelixLiveLineToolRequest;
  roomId?: string | null;
  worldId?: string | null;
  limit?: number;
}): {
  receipt: LiveLineToolChainReceipt;
  supports: HelixLiveLineToolEvaluation["supports_line"];
  nextLineValue: string | null;
  missingEvidence: string[];
} => {
  const result = queryMinecraftNavigationState({
    roomId: input.roomId ?? null,
    worldId: input.worldId ?? null,
    limit: input.limit ?? 6,
  });
  const state = result.navigation_state ?? null;
  const summary = state
    ? `Navigation state has route_status=${state.route_status}, policy_surface_status=${state.policy_surface_status}, solver_observations=${result.latest_solver_observations.length}.`
    : "No compact Minecraft navigation state is available yet.";
  return {
    receipt: makeReceipt({
      request: input.request,
      ok: true,
      summary,
      evidence_refs: state?.evidence_refs ?? [],
      observation: result,
    }),
    supports: state ? "partial" : "unknown",
    nextLineValue: state
      ? `${input.request.line_label} check: route_status=${state.route_status}; policy_surface_status=${state.policy_surface_status}; missing_evidence=${state.missing_evidence.length}.`
      : null,
    missingEvidence: result.missing_evidence,
  };
};

const runVisualEventAlignment = (input: {
  request: HelixLiveLineToolRequest;
  roomId?: string | null;
  sourceId?: string | null;
  worldId?: string | null;
  limit?: number;
}): {
  receipt: LiveLineToolChainReceipt;
  supports: HelixLiveLineToolEvaluation["supports_line"];
  nextLineValue: string | null;
  missingEvidence: string[];
} => {
  const frame = getLatestVisualFrame({ threadId: input.request.thread_id });
  const result = queryEventWindow({
    thread_id: null,
    room_id: input.roomId ?? null,
    source_id: input.sourceId ?? null,
    world_id: input.worldId ?? null,
    limit: input.limit ?? 40,
    include_raw_events: false,
  });
  const eventRefs = result.events.map((event) => event.journal_event_id);
  const alignment = alignVisualFrameWithEvents({
    thread_id: input.request.thread_id,
    frame_ids: frame ? [frame.frame_id] : [],
    event_refs: eventRefs,
    summary: frame
      ? `Aligned latest visual frame with ${eventRefs.length} compact event(s) for ${input.request.line_label}.`
      : "No latest visual frame is available for visual-event alignment.",
    confidence: frame && eventRefs.length > 0 ? 0.65 : 0.25,
    missing_evidence: frame ? [] : ["No visual frame has been captured for this thread yet."],
  });
  const supported = frame && eventRefs.length > 0;
  return {
    receipt: makeReceipt({
      request: input.request,
      ok: true,
      summary: alignment.summary,
      evidence_refs: [alignment.alignment_id, ...alignment.frame_ids, ...alignment.event_refs],
      observation: {
        schema: alignment.schema,
        alignment_id: alignment.alignment_id,
        frame_ids: alignment.frame_ids,
        event_refs: alignment.event_refs,
        confidence: alignment.confidence,
        assistant_answer: alignment.assistant_answer,
        raw_image_included: alignment.raw_image_included,
      },
    }),
    supports: supported ? "partial" : "unknown",
    nextLineValue: supported ? `${input.request.line_label} visual check: ${alignment.summary}` : null,
    missingEvidence: alignment.missing_evidence.length > 0
      ? alignment.missing_evidence
      : supported
        ? []
        : ["No visual/event pair was available to align."],
  };
};

export function runLiveLineToolChainWithReceipt(input: {
  request?: HelixLiveLineToolRequest | null;
  threadId?: string | null;
  requestId?: string | null;
  roomId?: string | null;
  sourceId?: string | null;
  worldId?: string | null;
  limit?: number;
  ok?: boolean;
  receiptId?: string | null;
  summary?: string | null;
}): WorkstationToolChainRunResult {
  const request = input.request ?? (
    input.threadId && input.requestId
      ? getLiveLineToolRequest({ threadId: input.threadId, requestId: input.requestId })
      : null
  );
  if (!request) throw new Error("live_line_tool_request_not_found");
  updateLiveLineToolRequestStatus({
    threadId: request.thread_id,
    requestId: request.request_id,
    status: "dispatched",
  });

  const environment = request.environment_id ? getLiveAnswerEnvironment(request.environment_id) : null;
  const roomId = input.roomId ?? environment?.room_id ?? null;
  const sourceId = input.sourceId ?? environment?.source_ids?.[0] ?? null;
  const worldId = input.worldId ?? null;

  const toolResult = request.requested_tool === "minecraft.query_event_window"
    ? runMinecraftEventWindow({ request, roomId, sourceId, worldId, limit: input.limit })
    : request.requested_tool === "minecraft.query_world_sense_window"
      ? runMinecraftWorldSenseWindow({ request, roomId })
      : request.requested_tool === "minecraft.query_navigation_state"
        ? runMinecraftNavigationStateQuery({ request, roomId, worldId, limit: input.limit })
        : request.requested_tool === "minecraft.lookup_semantics"
          ? runMinecraftSemanticLookup({ request, roomId })
          : request.requested_tool === "visual.align_latest_with_event_window"
            ? runVisualEventAlignment({ request, roomId, sourceId, worldId, limit: input.limit })
          : {
            receipt: makeReceipt({
              request,
              ok: false,
              summary: `${request.requested_tool} is not executable by the live-line runner yet.`,
              evidence_refs: [],
            }),
            supports: "unknown" as const,
            nextLineValue: null,
            missingEvidence: [`${request.requested_tool} runner is not implemented yet.`],
          };

  updateLiveLineToolRequestStatus({
    threadId: request.thread_id,
    requestId: request.request_id,
    status: toolResult.receipt.status,
  });

  const evaluation = evaluateLiveLineToolRequest({
    request,
    tool_receipt_refs: [toolResult.receipt.receipt_id],
    receipts: [toolResult.receipt],
    state_observation_refs: toolResult.receipt.evidence_refs,
    supports_line: toolResult.supports,
    next_line_value: toolResult.nextLineValue,
    missing_evidence: toolResult.missingEvidence,
    summary: input.summary ?? toolResult.receipt.summary,
  });

  const environmentDelta = request.environment_id && evaluation.next_line_value
    ? updateLiveAnswerEnvironment({
        environment_id: request.environment_id,
        reason: "manual_refresh",
        line_values: {
          [request.line_key]: {
            value: evaluation.next_line_value,
            confidence: null,
            evidence_refs: evaluation.tool_receipt_refs,
            source: "tool_observation",
            model_invoked: false,
            deterministic: true,
          },
        },
        latest_summary: evaluation.summary,
        evidence_refs: evaluation.tool_receipt_refs,
        source_event_count: toolResult.receipt.evidence_refs.length,
      })
    : null;

  const interpretedEvent = appendInterpretedEvent({
    thread_id: request.thread_id,
    room_id: roomId,
    source_family: "minecraft_events",
    kind: "line_tool_evaluation",
    title: `${request.line_label} tool check`,
    summary: evaluation.summary,
    confidence: evaluation.confidence_delta > 0 ? Math.min(1, 0.5 + evaluation.confidence_delta) : null,
    evidence_refs: evaluation.tool_receipt_refs,
    related_artifact_ids: [request.request_id, evaluation.evaluation_id],
    model_invoked: evaluation.model_invoked,
    deterministic: evaluation.deterministic,
    created_at: evaluation.created_at,
  });

  return {
    request: {
      ...request,
      status: "evaluated",
    },
    receipt: toolResult.receipt,
    evaluation,
    dynamic_tool_call: {
      schema: "helix.dynamic_tool_call.v1",
      tool_id: request.requested_tool,
      request_id: request.request_id,
      thread_id: request.thread_id,
      assistant_answer: false,
      raw_content_included: false,
    },
    environment_delta: environmentDelta?.delta ?? null,
    interpreted_event: interpretedEvent,
  };
}
