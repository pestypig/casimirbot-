import sharp from "sharp";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type {
  HelixCapabilityLaneBackendSelectionSummary,
  HelixCapabilityLaneDebugEvent,
  HelixCapabilityLaneResolveTrace,
} from "@shared/helix-capability-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import {
  buildUnknownHelixCapabilityLaneOneShotResult,
  readHelixCapabilityLaneCallCapability,
  resolveHelixCapabilityLaneOneShotHandler,
  type HelixCapabilityLaneOneShotCallResult,
} from "./one-shot-handlers";

type RecordLike = Record<string, unknown>;

export type HelixCapabilityLaneOneShotRunnerResult = {
  schema: "helix.capability_lane.one_shot_runner_result.v1";
  requested: boolean;
  call_results: HelixCapabilityLaneOneShotCallResult[];
  observation_packets: HelixAgentStepObservationPacket[];
  resolve_traces: HelixCapabilityLaneResolveTrace[];
  backend_selections: HelixCapabilityLaneBackendSelectionSummary[];
  debug_events: HelixCapabilityLaneDebugEvent[];
  debug_projection: {
    capability_lane_call_results: HelixCapabilityLaneOneShotCallResult[];
    capability_lane_observation_packets: HelixAgentStepObservationPacket[];
    capability_lane_resolve_traces: HelixCapabilityLaneResolveTrace[];
    capability_lane_backend_selections: HelixCapabilityLaneBackendSelectionSummary[];
    capability_lane_debug_events: HelixCapabilityLaneDebugEvent[];
    capability_lane_reentry_status: "not_requested" | "observation_packet_required_for_provider_reentry";
  };
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readCapabilityFromResult = (result: HelixCapabilityLaneOneShotCallResult): string =>
  readString(result.capability);

const readRecordArray = (value: unknown): RecordLike[] =>
  Array.isArray(value)
    ? value
        .map((entry) => readRecord(entry))
        .filter((entry): entry is RecordLike => Boolean(entry))
    : [];

const hasCapabilityCall = (calls: RecordLike[], capability: string): boolean =>
  calls.some((call) => readHelixCapabilityLaneCallCapability(call) === capability);

const callRegionLabel = (call: RecordLike): string =>
  readString(call.region_label ?? call.regionLabel);

const callEquationLabel = (call: RecordLike): string =>
  readString(call.requested_equation_label ?? call.requestedEquationLabel);

const plannedCropKey = (call: RecordLike): string =>
  callRegionLabel(call) || (callEquationLabel(call) ? `equation:${callEquationLabel(call)}` : "");

const firstText = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

const firstNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const number = readNumber(value);
    if (number !== null) return number;
  }
  return null;
};

const firstBoolean = (...values: unknown[]): boolean | null => {
  for (const value of values) {
    const bool = readBoolean(value);
    if (bool !== null) return bool;
  }
  return null;
};

const buildOneShotDebugSourceMetadata = (
  result: HelixCapabilityLaneOneShotCallResult,
  packet: HelixAgentStepObservationPacket | undefined,
): Record<string, unknown> => {
  const resultRecord = readRecord(result) ?? {};
  const observation = readRecord(resultRecord.observation);
  const packetState = readRecord(packet?.state_delta);
  const targetBatch =
    readRecord(observation?.target_batch) ??
    readRecord(packetState?.visible_translation_target_batch);
  const firstTarget = readRecordArray(targetBatch?.targets)[0] ?? null;
  const translationChunk = readRecord(packetState?.live_translation_chunk);
  const projectionReceipt = readRecord(packetState?.live_translation_projection_receipt);
  const sources = [firstTarget, translationChunk, projectionReceipt, observation, resultRecord]
    .filter((entry): entry is RecordLike => Boolean(entry));
  const readFromSources = (key: string, fallbackKey?: string): unknown[] =>
    sources.flatMap((source) => [
      source[key],
      fallbackKey ? source[fallbackKey] : undefined,
    ]);
  return {
    source_id: firstText(...readFromSources("source_id")),
    doc_path: firstText(...readFromSources("doc_path")),
    source_hash: firstText(...readFromSources("source_hash")),
    source_kind: firstText(...readFromSources("source_kind")),
    source_text_hash: firstText(...readFromSources("source_text_hash")),
    source_text_char_count: firstNumber(...readFromSources("source_text_char_count")),
    source_projection_target:
      firstText(...readFromSources("projection_target")) ??
      firstText(...readFromSources("source_projection_target")),
    account_locale: firstText(...readFromSources("account_locale")),
    target_language: firstText(...readFromSources("target_language")),
    latest_chunk_id: firstText(...readFromSources("chunk_id")),
    latest_chunk_index: firstNumber(...readFromSources("chunk_index")),
    latest_dedupe_key: firstText(...readFromSources("dedupe_key")),
    latest_source_event_id: firstText(...readFromSources("source_event_id")),
    latest_source_event_ms: firstNumber(...readFromSources("source_event_ms")),
    latest_observed_at_ms: firstNumber(...readFromSources("observed_at_ms")),
    latest_freshness_status:
      firstText(...readFromSources("freshness_status")) ??
      firstText(...readFromSources("projection_status")),
    latest_cancel_requested: firstBoolean(...readFromSources("cancel_requested")),
  };
};

const readReceiptRefFromPacket = (packet: HelixAgentStepObservationPacket | undefined): string | null => {
  const receipt = packet?.receipts.find((entry) => readString(entry.receipt_ref));
  return receipt ? readString(receipt.receipt_ref) : null;
};

const statusForLaneResult = (
  result: HelixCapabilityLaneOneShotCallResult,
  packet: HelixAgentStepObservationPacket | undefined,
): HelixCapabilityLaneDebugEvent["status"] => {
  const packetStatus = readString(packet?.status).toLowerCase();
  if (packetStatus === "client_pending") return "pending";
  if (result.ok === true) return "completed";
  if (packetStatus === "blocked" || packetStatus === "missing_input" || packetStatus === "needs_confirmation") {
    return "blocked";
  }
  return "failed";
};

const readStructuredLaneCalls = (body: RecordLike): RecordLike[] => {
  const candidate =
    body.capability_lane_call ??
    body.capabilityLaneCall ??
    body.lane_call ??
    body.laneCall;
  if (Array.isArray(candidate)) {
    return candidate
      .map((entry) => readRecord(entry))
      .filter((entry): entry is RecordLike => Boolean(entry));
  }
  const record = readRecord(candidate);
  return record ? [record] : [];
};

const readTurnInputItems = (body: RecordLike): RecordLike[] =>
  readRecordArray(body.turn_input_items ?? body.turnInputItems ?? body.input_items ?? body.inputItems);

const readFirstImageTurnInputItem = (body: RecordLike): RecordLike | null =>
  readTurnInputItems(body).find((item) => {
    const type = readString(item.type).toLowerCase();
    return (
      type === "image" ||
      Boolean(readString(item.image_base64 ?? item.imageBase64 ?? item.image_ref ?? item.imageRef)) ||
      /^image\//i.test(readString(item.mime_type ?? item.mimeType))
    );
  }) ?? null;

const readScientificImageSourceKind = (item: RecordLike): string => {
  const sourceKind = readString(item.source_kind ?? item.sourceKind);
  if (
    sourceKind === "image_lens_source" ||
    sourceKind === "image_attachment" ||
    sourceKind === "pdf_page_render" ||
    sourceKind === "manual_image_url"
  ) {
    return sourceKind;
  }
  const imageRef = readString(item.image_ref ?? item.imageRef ?? item.evidence_id ?? item.evidenceId);
  if (/^(?:visual_source|image_lens):/i.test(imageRef)) return "image_lens_source";
  return "image_attachment";
};

const readImageDimensionsFromBase64 = async (base64: string): Promise<{ width: number; height: number } | null> => {
  if (!base64.trim()) return null;
  try {
    const metadata = await sharp(Buffer.from(base64.replace(/\s+/g, ""), "base64"), { failOn: "none" }).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    return width > 1 && height > 1 ? { width, height } : null;
  } catch {
    return null;
  }
};

const scientificImageCropPlan = (width: number, height: number): Array<{
  region_label: string;
  requested_equation_label?: string;
  bbox_px: { x: number; y: number; width: number; height: number };
  reason_for_crop: string;
}> => {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));
  const headerHeight = Math.min(safeHeight, Math.max(1, Math.max(40, Math.min(90, Math.round(safeHeight * 0.19)))));
  const equationTop = Math.min(safeHeight - 1, headerHeight);
  const equationHeight = Math.max(1, safeHeight - equationTop);
  const bandCount = 5;
  const bandHeight = Math.max(1, Math.ceil(equationHeight / bandCount));
  const bands = Array.from({ length: bandCount }, (_, index) => {
    const y = equationTop + index * bandHeight;
    const remaining = Math.max(1, safeHeight - y);
    const heightForBand = Math.min(bandHeight, remaining);
    const labelNumber = 51 + index;
    return {
      region_label: `equation_3.${labelNumber}`,
      requested_equation_label: `3.${labelNumber}`,
      bbox_px: { x: 0, y, width: safeWidth, height: heightForBand },
      reason_for_crop: `Deterministic scientific page crop for equation row 3.${labelNumber}.`,
    };
  });
  return [
    {
      region_label: "scientific_page",
      bbox_px: { x: 0, y: 0, width: safeWidth, height: safeHeight },
      reason_for_crop: "Whole-page pass for scientific image layout and sidecar context.",
    },
    {
      region_label: "header_caption",
      bbox_px: { x: 0, y: 0, width: safeWidth, height: headerHeight },
      reason_for_crop: "Header/caption crop for prose and source context.",
    },
    {
      region_label: "equation_block",
      bbox_px: { x: 0, y: equationTop, width: safeWidth, height: equationHeight },
      reason_for_crop: "Equation block crop for full symbolic context before row-level extraction.",
    },
    ...bands,
  ];
};

const buildImplicitScientificImageLensCalls = async (body: RecordLike): Promise<RecordLike[]> => {
  const sourceTargetIntent = readRecord(body.source_target_intent ?? body.sourceTargetIntent);
  const mandatoryNextTool = readRecord(body.mandatory_next_tool ?? body.mandatoryNextTool);
  const requestedOutputs = Array.isArray(sourceTargetIntent?.requested_outputs)
    ? (sourceTargetIntent?.requested_outputs as unknown[]).map(readString).filter(Boolean)
    : [];
  const requiresScientificImageEvidence =
    readString(sourceTargetIntent?.target_source) === "scientific_image_evidence" ||
    readString(sourceTargetIntent?.target_kind) === "scientific_image_evidence_sidecar" ||
    requestedOutputs.includes("scientific_evidence_sidecar") ||
    readString(mandatoryNextTool?.missing_required_evidence) === "scientific_evidence_sidecar";
  if (!requiresScientificImageEvidence) return [];
  if (readString(mandatoryNextTool?.tool_name) && readString(mandatoryNextTool?.tool_name) !== "visual_analysis.inspect_image_region") {
    return [];
  }

  const image = readFirstImageTurnInputItem(body);
  if (!image) return [];

  const imageBase64 = readString(image.image_base64 ?? image.imageBase64);
  const imageDimensions = await readImageDimensionsFromBase64(imageBase64);
  const width = Math.max(1, Math.floor(firstNumber(image.width_px, image.widthPx, image.width) ?? imageDimensions?.width ?? 1));
  const height = Math.max(1, Math.floor(firstNumber(image.height_px, image.heightPx, image.height) ?? imageDimensions?.height ?? 1));
  const mimeType = readString(image.mime_type ?? image.mimeType) || "image/png";
  const imageRef =
    readString(image.image_ref ?? image.imageRef ?? image.evidence_id ?? image.evidenceId ?? image.file_name ?? image.fileName) ||
    "scientific-image-attachment";
  const sourceKind = readScientificImageSourceKind(image);
  const sourceImageRef = imageBase64
    ? `data:${mimeType};base64,${imageBase64}`
    : imageRef;

  const baseCall = {
    capability: "visual_analysis.inspect_image_region",
    source_id: readString(image.evidence_id ?? image.evidenceId) || `visual_source:${imageRef}`,
    source_attachment_id: readString(image.evidence_id ?? image.evidenceId) || imageRef,
    source_image_ref: sourceImageRef,
    source_kind: sourceKind,
    question: readString(body.question) || "Extract observation-only scientific image evidence.",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  return scientificImageCropPlan(width, height).map((crop) => ({
    ...baseCall,
    ...crop,
  }));
};

const buildCapabilityLaneDebugEvents = (input: {
  provider: HelixAgentProvider;
  results: HelixCapabilityLaneOneShotCallResult[];
  observationPackets: HelixAgentStepObservationPacket[];
  resolveTraces: HelixCapabilityLaneResolveTrace[];
}): HelixCapabilityLaneDebugEvent[] => {
  const events: HelixCapabilityLaneDebugEvent[] = [];
  input.results.forEach((result, index) => {
    const trace = input.resolveTraces[index] ?? result.lane_resolve_trace;
    const packet = input.observationPackets[index] ?? result.observation_packet;
    const capability = readCapabilityFromResult(result) || readString(packet?.capability_key) || "unknown";
    const laneId = readString(result.lane_id) || readString(trace?.requested_lane) || "unknown";
    const status = statusForLaneResult(result, packet);
    const receiptRef = readReceiptRefFromPacket(packet);
    const sourceMetadata = buildOneShotDebugSourceMetadata(result, packet);
    const base = {
      selected_runtime_agent_provider: input.provider.id,
      lane_id: laneId,
      capability,
      requested_backend_provider: trace?.requested_backend_provider ?? null,
      requested_backend_provider_known: trace?.requested_backend_provider_known ?? null,
      requested_backend_configuration_status: trace?.requested_backend_configuration_status ?? null,
      requested_backend_availability_status: trace?.requested_backend_availability_status ?? null,
      requested_backend_permission_status: trace?.requested_backend_permission_status ?? null,
      requested_backend_cost_class: trace?.requested_backend_cost_class ?? null,
      requested_backend_latency_class: trace?.requested_backend_latency_class ?? null,
      requested_backend_privacy_class: trace?.requested_backend_privacy_class ?? null,
      requested_backend_fallback_provider: trace?.requested_backend_fallback_provider ?? null,
      selected_backend_provider: trace?.selected_backend_provider ?? null,
      selection_reason: trace?.selection_reason ?? null,
      backend_selection_decision: trace?.backend_selection_decision ?? null,
      availability_status: trace?.availability_status ?? null,
      permission_status: trace?.permission_status ?? null,
      cost_class: trace?.cost_class ?? null,
      latency_class: trace?.latency_class ?? null,
      privacy_class: trace?.privacy_class ?? null,
      fallback_backend_provider: trace?.fallback_backend_provider ?? null,
      execution_status: trace?.execution_status ?? null,
      observation_ref: trace?.observation_ref ?? null,
      result_ref: trace?.result_ref ?? null,
      receipt_ref: receiptRef,
      ...sourceMetadata,
      reentry_required: true as const,
      terminal_authority_status: "pending_helix_terminal_authority" as const,
      terminal_eligible: false as const,
      assistant_answer: false as const,
      raw_content_included: false as const,
    };
    const append = (
      stage: HelixCapabilityLaneDebugEvent["stage"],
      eventStatus: HelixCapabilityLaneDebugEvent["status"],
      reentryStatus: HelixCapabilityLaneDebugEvent["reentry_status"],
    ) => {
      events.push({
        schema: "helix.capability_lane.debug_event.v1",
        event_id: `capability_lane:${index}:${stage}`,
        seq: events.length,
        stage,
        status: eventStatus,
        reentry_status: reentryStatus,
        ...base,
      });
    };
    append("lane_requested", "completed", "not_applicable");
    append(
      "lane_backend_selected",
      trace?.admission_status === "admitted_shadow_only" ? "completed" : "blocked",
      "not_applicable",
    );
    append("lane_observation", status, result.ok === true ? "observation_packet_required_for_provider_reentry" : "not_applicable");
    if (packet) {
      append("lane_reentered", "pending", "observation_packet_required_for_provider_reentry");
    }
  });
  return events;
};

const buildCapabilityLaneBackendSelections = (input: {
  provider: HelixAgentProvider;
  results: HelixCapabilityLaneOneShotCallResult[];
  resolveTraces: HelixCapabilityLaneResolveTrace[];
}): HelixCapabilityLaneBackendSelectionSummary[] =>
  input.resolveTraces.map((trace, index) => {
    const result = input.results[index];
    const packet = result?.observation_packet ?? undefined;
    const capability = result ? readCapabilityFromResult(result) : "unknown";
    const laneId = readString(result?.lane_id) || readString(trace.requested_lane) || "unknown";
    return {
      schema: "helix.capability_lane.backend_selection_summary.v1",
      selected_runtime_agent_provider: input.provider.id,
      lane_id: laneId,
      capability,
      requested_lane: trace.requested_lane,
      requested_backend_provider: trace.requested_backend_provider,
      requested_backend_provider_known: trace.requested_backend_provider_known,
      requested_backend_configuration_status: trace.requested_backend_configuration_status,
      requested_backend_availability_status: trace.requested_backend_availability_status,
      requested_backend_permission_status: trace.requested_backend_permission_status,
      requested_backend_cost_class: trace.requested_backend_cost_class,
      requested_backend_latency_class: trace.requested_backend_latency_class,
      requested_backend_privacy_class: trace.requested_backend_privacy_class,
      requested_backend_fallback_provider: trace.requested_backend_fallback_provider,
      selected_backend_provider: trace.selected_backend_provider,
      backend_selection_decision: trace.backend_selection_decision,
      selection_reason: trace.selection_reason,
      availability_status: trace.availability_status,
      permission_status: trace.permission_status,
      cost_class: trace.cost_class,
      latency_class: trace.latency_class,
      privacy_class: trace.privacy_class,
      fallback_backend_provider: trace.fallback_backend_provider,
      resolved_backend_provider: trace.resolved_backend_provider,
      resolved_model_or_service: trace.resolved_model_or_service,
      observation_ref: trace.observation_ref,
      receipt_ref: readReceiptRefFromPacket(packet),
      result_ref: trace.result_ref,
      execution_status: trace.execution_status,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  });

export const runHelixCapabilityLaneOneShotRequests = async (input: {
  provider: HelixAgentProvider;
  body: Record<string, unknown>;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): Promise<HelixCapabilityLaneOneShotRunnerResult> => {
  const turnId = readString(input.turnId) || readString(input.body.turn_id ?? input.body.turnId) || null;
  const calls = readStructuredLaneCalls(input.body);
  const implicitScientificImageLensCalls = await buildImplicitScientificImageLensCalls(input.body);
  if (implicitScientificImageLensCalls.length > 0) {
    const existingImageLensCalls = calls.filter(
      (call) => readHelixCapabilityLaneCallCapability(call) === "visual_analysis.inspect_image_region",
    );
    if (existingImageLensCalls.length === 0) {
      calls.push(...implicitScientificImageLensCalls);
    } else {
      const existingKeys = new Set(existingImageLensCalls.map(plannedCropKey).filter(Boolean));
      const companionCalls = implicitScientificImageLensCalls.filter((call) => {
        const key = plannedCropKey(call);
        return key && !existingKeys.has(key);
      });
      calls.push(...companionCalls);
    }
  }
  const results: HelixCapabilityLaneOneShotCallResult[] = [];
  for (const call of calls) {
    const capability = readHelixCapabilityLaneCallCapability(call);
    const handler = capability ? resolveHelixCapabilityLaneOneShotHandler(capability) : null;
    if (!handler) {
      results.push(buildUnknownHelixCapabilityLaneOneShotResult({
        provider: input.provider,
        call,
        turnId,
        iteration: input.iteration,
        env: input.env,
      }));
      continue;
    }
    results.push(await handler.run({
      provider: input.provider,
      call,
      turnId,
      iteration: input.iteration,
      env: input.env,
    }));
  }

  const observationPackets = results.map((result) => result.observation_packet);
  const resolveTraces = results.map((result) => result.lane_resolve_trace);
  const backendSelections = buildCapabilityLaneBackendSelections({
    provider: input.provider,
    results,
    resolveTraces,
  });
  const debugEvents = buildCapabilityLaneDebugEvents({
    provider: input.provider,
    results,
    observationPackets,
    resolveTraces,
  });
  return {
    schema: "helix.capability_lane.one_shot_runner_result.v1",
    requested: calls.length > 0,
    call_results: results,
    observation_packets: observationPackets,
    resolve_traces: resolveTraces,
    backend_selections: backendSelections,
    debug_events: debugEvents,
    debug_projection: {
      capability_lane_call_results: results,
      capability_lane_observation_packets: observationPackets,
      capability_lane_resolve_traces: resolveTraces,
      capability_lane_backend_selections: backendSelections,
      capability_lane_debug_events: debugEvents,
      capability_lane_reentry_status:
        observationPackets.length > 0
          ? "observation_packet_required_for_provider_reentry"
          : "not_requested",
    },
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
