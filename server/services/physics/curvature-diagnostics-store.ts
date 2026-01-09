import type {
  TCurvatureKMetrics,
  TCurvatureRidgeSpine,
  TCurvatureRidgeSummary,
} from "@shared/essence-physics";
import { trackRidgeSequence, type RidgeTrack } from "./curvature-metrics";

export type CurvatureDiagnosticsEvent = {
  id: string;
  seq: number;
  ts: string;
  result_hash: string;
  essence_id?: string;
  k_metrics: TCurvatureKMetrics;
  ridge_summary: TCurvatureRidgeSummary;
  ridge_tracking?: CurvatureRidgeTrackingSummary;
};

type AppendCurvatureDiagnosticsEvent = Omit<
  CurvatureDiagnosticsEvent,
  "id" | "seq" | "ts"
> &
  Partial<Pick<CurvatureDiagnosticsEvent, "ts">> & {
    ridges?: TCurvatureRidgeSpine[];
    tracking_key?: string;
    drive_hz?: number;
    max_link_distance_m?: number;
    track_window?: number;
  };

type CurvatureDiagnosticsListener = (event: CurvatureDiagnosticsEvent) => void;

export type CurvatureRidgeTrackingSummary = {
  frame_index: number;
  ridge_count: number;
  matched_count: number;
  new_count: number;
  ended_count: number;
  fragmentation_rate: number;
  ridge_ids: string[];
  tracks: RidgeTrack[];
  k3?: number;
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.CURVATURE_CDS_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 1000);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const DEFAULT_TRACK_WINDOW = 32;
const MAX_TRACK_WINDOW = 256;
const resolveTrackWindow = (value: number | undefined): number => {
  const requested = Number.isFinite(value ?? NaN)
    ? Math.floor(value as number)
    : DEFAULT_TRACK_WINDOW;
  return Math.min(MAX_TRACK_WINDOW, Math.max(1, requested));
};

const events: CurvatureDiagnosticsEvent[] = [];
const listeners = new Set<CurvatureDiagnosticsListener>();
let sequence = 0;
const trackingStates = new Map<
  string,
  { frames: Array<{ t_s?: number; k1?: number; ridges: TCurvatureRidgeSpine[] }> }
>();

const getTrackingState = (key: string) => {
  const existing = trackingStates.get(key);
  if (existing) return existing;
  const state = { frames: [] };
  trackingStates.set(key, state);
  return state;
};

const toEpochSeconds = (ts: string): number | undefined => {
  const ms = Date.parse(ts);
  return Number.isFinite(ms) ? ms / 1000 : undefined;
};

export function recordCurvatureDiagnostics(
  input: AppendCurvatureDiagnosticsEvent,
): CurvatureDiagnosticsEvent {
  const seq = ++sequence;
  const record: CurvatureDiagnosticsEvent = {
    id: String(seq),
    seq,
    ts: input.ts ?? new Date().toISOString(),
    result_hash: input.result_hash,
    essence_id: input.essence_id,
    k_metrics: input.k_metrics,
    ridge_summary: input.ridge_summary,
  };
  if (input.ridges && input.ridges.length > 0) {
    const key = input.tracking_key ?? "default";
    const state = getTrackingState(key);
    state.frames.push({
      t_s: toEpochSeconds(record.ts),
      k1: input.k_metrics.k1,
      ridges: input.ridges,
    });
    const trackWindow = resolveTrackWindow(input.track_window);
    if (state.frames.length > trackWindow) {
      state.frames.splice(0, state.frames.length - trackWindow);
    }

    const tracking = trackRidgeSequence(state.frames, {
      drive_hz: input.drive_hz,
      max_link_distance_m: input.max_link_distance_m,
    });
    const latest = tracking.frames.at(-1);
    if (latest) {
      const ridgeIds = latest.ridges
        .map((ridge) => ridge.id)
        .filter((id): id is string => Boolean(id));
      record.ridge_tracking = {
        frame_index: latest.frame_index,
        ridge_count: latest.ridge_count,
        matched_count: latest.matched_count,
        new_count: latest.new_count,
        ended_count: latest.ended_count,
        fragmentation_rate: latest.fragmentation_rate,
        ridge_ids: ridgeIds,
        tracks: tracking.tracks,
        k3: tracking.k3,
      };
    }
    if (tracking.k3 !== undefined) {
      record.k_metrics = { ...record.k_metrics, k3: tracking.k3 };
    }
  }
  events.push(record);
  if (events.length > MAX_BUFFER_SIZE) {
    events.splice(0, events.length - MAX_BUFFER_SIZE);
  }
  for (const listener of Array.from(listeners)) {
    try {
      listener(record);
    } catch (err) {
      console.warn("[curvature-diagnostics] listener error", err);
    }
  }
  return record;
}

export function getCurvatureDiagnostics(limit = 50): CurvatureDiagnosticsEvent[] {
  const clamped = Math.min(Math.max(1, Math.floor(limit)), MAX_BUFFER_SIZE);
  if (events.length === 0) return [];
  const start = Math.max(0, events.length - clamped);
  return events.slice(start).reverse();
}

export function subscribeCurvatureDiagnostics(
  listener: CurvatureDiagnosticsListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetCurvatureDiagnosticsStore(): void {
  events.length = 0;
  listeners.clear();
  sequence = 0;
  trackingStates.clear();
}
