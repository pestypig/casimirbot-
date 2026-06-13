import crypto from "node:crypto";
import {
  HELIX_WORKSTATION_COMMAND_RECEIPT_SCHEMA,
  HELIX_WORKSTATION_COMMAND_RELIABILITY_SCHEMA,
  buildHelixWorkstationTaskManagerAuthority,
  withHelixWorkstationBrowserPerformanceAuthority,
  withHelixWorkstationCommandReceiptAuthority,
  type HelixWorkstationBrowserPerformanceSample,
  type HelixWorkstationCommandReceipt,
  type HelixWorkstationCommandReceiptStage,
  type HelixWorkstationCommandReceiptStatus,
  type HelixWorkstationCommandReliabilityStatus,
  type HelixWorkstationInteractionKind,
  type HelixWorkstationUiFramePressure,
} from "@shared/helix-workstation-task-manager";

const MAX_RECEIPTS = 120;
const RECEIPT_WINDOW_MS = 5 * 60_000;
const SAMPLE_STALE_MS = 15_000;
const REDACTED = "[redacted]";

let latestBrowserSample: HelixWorkstationBrowserPerformanceSample | null = null;
const commandReceipts: HelixWorkstationCommandReceipt[] = [];

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const roundOne = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
};

const clampNumber = (value: unknown, min: number, max: number): number | null => {
  const rounded = roundOne(value);
  if (rounded == null) return null;
  return Math.min(max, Math.max(min, rounded));
};

const intNumber = (value: unknown, min: number, max: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
};

const sanitizeText = (value: unknown, fallback: string, maxLength = 100): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const redacted = trimmed
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`)
    .replace(/(?:api[_-]?key|token|secret|password)=\S+/gi, `$1=${REDACTED}`)
    .replace(/[A-Za-z0-9._~+/=-]{48,}/g, REDACTED)
    .slice(0, maxLength);
  return redacted || fallback;
};

const sanitizeId = (value: unknown, fallback = "unknown"): string => {
  const text = sanitizeText(value, fallback, 140);
  if (!/^[a-z0-9_.:-]+$/i.test(text)) return `hashed_${hashShort(text)}`;
  return text;
};

const isoTime = (value: unknown, fallback = new Date()): string => {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return fallback.toISOString();
};

const pressure = (value: unknown): HelixWorkstationUiFramePressure => {
  if (value === "normal" || value === "degraded" || value === "blocked" || value === "unknown") return value;
  return "unknown";
};

const visibilityState = (
  value: unknown,
): HelixWorkstationBrowserPerformanceSample["visibility_state"] => {
  if (value === "visible" || value === "hidden" || value === "prerender" || value === "unloaded" || value === "unknown") {
    return value;
  }
  return "unknown";
};

const interactionKind = (value: unknown): HelixWorkstationInteractionKind | null => {
  if (
    value === "click" ||
    value === "scroll" ||
    value === "panel_drag" ||
    value === "panel_resize" ||
    value === "pointer" ||
    value === "keyboard" ||
    value === "unknown"
  ) {
    return value;
  }
  return null;
};

const receiptStage = (value: unknown): HelixWorkstationCommandReceiptStage => {
  if (
    value === "interaction_received" ||
    value === "request_started" ||
    value === "request_succeeded" ||
    value === "request_failed" ||
    value === "clipboard_write_succeeded" ||
    value === "clipboard_write_failed"
  ) {
    return value;
  }
  return "interaction_received";
};

const receiptStatus = (value: unknown): HelixWorkstationCommandReceiptStatus => {
  if (value === "received" || value === "in_flight" || value === "succeeded" || value === "failed" || value === "unknown") {
    return value;
  }
  return "unknown";
};

export const sanitizeHelixWorkstationBrowserPerformanceSample = (
  value: unknown,
  now = new Date(),
): HelixWorkstationBrowserPerformanceSample => {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return withHelixWorkstationBrowserPerformanceAuthority({
    schema_version: "helix.workstation_browser_performance.v1",
    sampled_at: isoTime(record.sampled_at, now),
    window_ms: intNumber(record.window_ms, 1000, 120_000),
    fps: clampNumber(record.fps, 0, 240),
    average_frame_ms: clampNumber(record.average_frame_ms, 0, 10_000),
    p95_frame_ms: clampNumber(record.p95_frame_ms, 0, 10_000),
    worst_frame_ms: clampNumber(record.worst_frame_ms, 0, 10_000),
    long_frame_count: intNumber(record.long_frame_count, 0, 100_000),
    long_frame_ratio: clampNumber(record.long_frame_ratio, 0, 1),
    long_task_count: intNumber(record.long_task_count, 0, 100_000),
    long_task_total_ms: clampNumber(record.long_task_total_ms, 0, 600_000) ?? 0,
    dom_node_count: intNumber(record.dom_node_count, 0, 5_000_000),
    open_panel_count: intNumber(record.open_panel_count, 0, 500),
    focused_panel_id: record.focused_panel_id == null ? null : sanitizeId(record.focused_panel_id, "unknown"),
    visibility_state: visibilityState(record.visibility_state),
    advisory_pressure: pressure(record.advisory_pressure),
    interaction_event_count: intNumber(record.interaction_event_count, 0, 100_000),
    input_delay_p95_ms: clampNumber(record.input_delay_p95_ms, 0, 10_000),
    input_to_next_frame_p95_ms: clampNumber(record.input_to_next_frame_p95_ms, 0, 10_000),
    click_to_next_frame_p95_ms: clampNumber(record.click_to_next_frame_p95_ms, 0, 10_000),
    scroll_jank_count: intNumber(record.scroll_jank_count, 0, 100_000),
    drag_jank_count: intNumber(record.drag_jank_count, 0, 100_000),
    active_interaction_kind: interactionKind(record.active_interaction_kind),
    active_panel_id: record.active_panel_id == null ? null : sanitizeId(record.active_panel_id, "unknown"),
    responsiveness_pressure: pressure(record.responsiveness_pressure),
  });
};

export const recordHelixWorkstationBrowserPerformanceSample = (
  value: unknown,
  now = new Date(),
): HelixWorkstationBrowserPerformanceSample => {
  latestBrowserSample = sanitizeHelixWorkstationBrowserPerformanceSample(value, now);
  return latestBrowserSample;
};

export const getLatestHelixWorkstationBrowserPerformanceSample = (
  now = new Date(),
): HelixWorkstationBrowserPerformanceSample | null => {
  if (!latestBrowserSample) return null;
  const ageMs = now.getTime() - Date.parse(latestBrowserSample.sampled_at);
  if (!Number.isFinite(ageMs) || ageMs > SAMPLE_STALE_MS) return null;
  return latestBrowserSample;
};

export const sanitizeHelixWorkstationCommandReceipt = (
  value: unknown,
  now = new Date(),
): HelixWorkstationCommandReceipt => {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const occurredAt = isoTime(record.occurred_at, now);
  return withHelixWorkstationCommandReceiptAuthority({
    schema_version: HELIX_WORKSTATION_COMMAND_RECEIPT_SCHEMA,
    receipt_id: sanitizeId(record.receipt_id ?? `receipt.${hashShort([occurredAt, record.command_id, record.stage])}`),
    command_id: sanitizeId(record.command_id, "unknown.command"),
    command_family: sanitizeId(record.command_family, "unknown"),
    stage: receiptStage(record.stage),
    status: receiptStatus(record.status),
    occurred_at: occurredAt,
    panel_id: record.panel_id == null ? null : sanitizeId(record.panel_id, "unknown"),
    latency_ms: clampNumber(record.latency_ms, 0, 120_000),
    failure_reason: record.failure_reason == null ? null : sanitizeText(record.failure_reason, "command_failed", 140),
  });
};

export const recordHelixWorkstationCommandReceipt = (
  value: unknown,
  now = new Date(),
): HelixWorkstationCommandReceipt => {
  const receipt = sanitizeHelixWorkstationCommandReceipt(value, now);
  commandReceipts.push(receipt);
  while (commandReceipts.length > MAX_RECEIPTS) {
    commandReceipts.shift();
  }
  return receipt;
};

const percentile = (values: readonly number[], percentileRank: number): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(percentileRank * sorted.length) - 1));
  return sorted[index] ?? null;
};

export const getHelixWorkstationCommandReliabilityStatus = (
  now = new Date(),
): HelixWorkstationCommandReliabilityStatus => {
  const cutoff = now.getTime() - RECEIPT_WINDOW_MS;
  const receipts = commandReceipts.filter((receipt) => {
    const occurredAt = Date.parse(receipt.occurred_at);
    return Number.isFinite(occurredAt) && occurredAt >= cutoff;
  });
  const latencies = receipts
    .map((receipt) => receipt.latency_ms)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0);
  return {
    schema_version: HELIX_WORKSTATION_COMMAND_RELIABILITY_SCHEMA,
    generated_at: now.toISOString(),
    window_ms: RECEIPT_WINDOW_MS,
    receipts,
    summary: {
      recent_receipt_count: receipts.length,
      failed_receipt_count: receipts.filter((receipt) => receipt.status === "failed").length,
      in_flight_receipt_count: receipts.filter((receipt) => receipt.status === "in_flight").length,
      succeeded_receipt_count: receipts.filter((receipt) => receipt.status === "succeeded").length,
      last_command_id: receipts[receipts.length - 1]?.command_id ?? null,
      p95_latency_ms: roundOne(percentile(latencies, 0.95)),
    },
    authority: buildHelixWorkstationTaskManagerAuthority(),
  };
};

export const clearHelixWorkstationBrowserPerformanceDiagnosticsForTest = (): void => {
  latestBrowserSample = null;
  commandReceipts.length = 0;
};
