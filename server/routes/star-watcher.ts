import path from "node:path";
import express from "express";
import { z } from "zod";
import multer from "multer";
import { runSolarVideoCoherenceJob } from "../services/essence/solar-video-coherence";
import { runSolarCurvatureFromSunpy } from "../services/essence/solar-energy-adapter";
import { CurvatureBoundaryCondition2D } from "@shared/essence-physics";
import { fetchHekEventsForWindow, refineEventsWithSunpy } from "../services/essence/solar-events-hek";
import { ingestSunpyCoherenceBridge, type SunpyExportPayload } from "../services/essence/sunpy-coherence-bridge";
import { runPythonScript } from "../utils/run-python";
import { buildInformationBoundary, buildInformationBoundaryFromHashes, sha256Prefixed } from "../utils/information-boundary";

export const starWatcherRouter = express.Router();

// Permit larger payloads for uploads (defaults to 200 MB).
const MAX_MB = Math.max(1, Number(process.env.STAR_WATCHER_MAX_MB ?? 200));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

// Also accept large JSON bodies when using base64
starWatcherRouter.use(express.json({ limit: `${MAX_MB}mb` }));

const SolarCoherenceSchema = z.object({
  data: z.string().min(8), // base64-encoded GIF/video buffer
  mime: z.string().optional(),
  gridSize: z.preprocess(
    (v) => (typeof v === "string" ? Number.parseInt(v, 10) : v),
    z.number().int().min(32).max(512).optional()
  ),
  maxFrames: z.preprocess(
    (v) => (typeof v === "string" ? Number.parseInt(v, 10) : v),
    z.number().int().min(1).optional()
  ),
  sampleStride: z.preprocess(
    (v) => (typeof v === "string" ? Number.parseInt(v, 10) : v),
    z.number().int().min(1).optional()
  ),
  instrumentTag: z.string().optional(),
  sessionId: z.string().optional(),
  sessionType: z.string().optional(),
  hostMode: z.string().optional(),
  prompt: z.string().optional(),
});

const coerceQueryString = (v: unknown) => {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
};

const SolarEventsQuerySchema = z.object({
  start: z.preprocess(coerceQueryString, z.string().min(4)),
  end: z.preprocess(coerceQueryString, z.string().min(4)),
  eventTypes: z.preprocess(coerceQueryString, z.string().optional()),
  sunpy: z.preprocess(coerceQueryString, z.string().optional()),
});

const toNumber = (v: unknown) => {
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return undefined;
};

const SunpyExportQuerySchema = z.object({
  start: z.preprocess(coerceQueryString, z.string().optional()),
  end: z.preprocess(coerceQueryString, z.string().optional()),
  asOf: z.preprocess(coerceQueryString, z.string().optional()),
  instrument: z.preprocess(coerceQueryString, z.string().optional()),
  wave: z.preprocess(coerceQueryString, z.string().optional()),
  preflight: z.preprocess(coerceQueryString, z.string().optional()),
  eventTypes: z.preprocess(coerceQueryString, z.string().optional()),
  includeEvents: z.preprocess(coerceQueryString, z.string().optional()),
  bridge: z.preprocess(coerceQueryString, z.string().optional()),
  bridgeMode: z.preprocess(coerceQueryString, z.string().optional()),
  maxFrames: z.preprocess((v) => toNumber(coerceQueryString(v)), z.number().int().optional()),
});

const SolarCurvatureRequestSchema = z.object({
  sunpy: z.unknown().optional(),
  start: z.preprocess(coerceQueryString, z.string().optional()),
  end: z.preprocess(coerceQueryString, z.string().optional()),
  asOf: z.preprocess(coerceQueryString, z.string().optional()),
  instrument: z.preprocess(coerceQueryString, z.string().optional()),
  wave: z.preprocess(coerceQueryString, z.string().optional()),
  maxFrames: z.preprocess((v) => toNumber(coerceQueryString(v)), z.number().int().optional()),
  calibrationVersion: z.preprocess(coerceQueryString, z.string().optional()),
  boundary: CurvatureBoundaryCondition2D.optional(),
  persist: z.preprocess(coerceQueryString, z.string().optional()),
});

const clamp = (val: number, min: number, max: number) => {
  if (!Number.isFinite(val)) return min;
  if (val < min) return min;
  if (val > max) return max;
  return val;
};

const MIN_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_WINDOW_MS = 20 * 60 * 1000;
const MAX_WINDOW_MS = 6 * 60 * 60 * 1000;
const SUNPY_FALLBACK_LOOKBACK_MIN = Math.max(10, Number(process.env.SUNPY_FALLBACK_LOOKBACK_MIN ?? 90));
const SUNPY_FALLBACK_MIN_WINDOW_MIN = Math.max(5, Number(process.env.SUNPY_FALLBACK_MIN_WINDOW_MIN ?? 20));
const SUNPY_FALLBACK_MAX_AGE_HOURS = Math.max(1, Number(process.env.SUNPY_FALLBACK_MAX_AGE_HOURS ?? 12));

const parseIsoMs = (iso: string | undefined | null): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
};

const isTimeoutError = (msg: string): boolean => {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return lower.includes("reason=timeout") || lower.includes("etimedout") || lower.includes("timed out");
};

function normalizeSunpyWindow(startIso: string, endIso: string) {
  const nowMs = Date.now();
  const startMs = parseIsoMs(startIso);
  const endMs = parseIsoMs(endIso);
  if (startMs !== null && endMs !== null && endMs > startMs) {
    return { start: startIso, end: endIso, windowMs: endMs - startMs, normalized: false };
  }
  const safeEndMs = endMs ?? nowMs;
  const guessedWindow = startMs !== null && endMs !== null ? Math.abs(endMs - startMs) : DEFAULT_WINDOW_MS;
  const windowMs = Math.max(MIN_WINDOW_MS, Math.min(MAX_WINDOW_MS, guessedWindow || DEFAULT_WINDOW_MS));
  return {
    start: new Date(safeEndMs - windowMs).toISOString(),
    end: new Date(safeEndMs).toISOString(),
    windowMs,
    normalized: true,
  };
}

function summarizeSunpyPayload(payload: SunpyExportPayload | null, maxFrames: number) {
  const frameCount = Array.isArray(payload?.frames) ? payload.frames.length : 0;
  const mapB64Count = Array.isArray(payload?.frames)
    ? payload.frames.filter((f: any) => typeof (f as any)?.map_b64 === "string" && (f as any)?.map_b64.length > 0)
        .length
    : 0;
  const gridSizes = Array.isArray(payload?.frames)
    ? Array.from(new Set(payload.frames.map((f: any) => (f as any)?.grid_size).filter(Boolean)))
    : [];
  const framesMissing =
    Boolean((payload as any)?.meta?.frames_missing) || (!frameCount && maxFrames > 0) || mapB64Count === 0;
  const framesMissingReason =
    (payload as any)?.meta?.frames_missing_reason ??
    ((!frameCount && maxFrames > 0) ? "no_frames_from_exporter" : undefined) ??
    (mapB64Count === 0 ? "no_intensity_grids" : undefined);
  return { frameCount, mapB64Count, gridSizes, framesMissing, framesMissingReason };
}

starWatcherRouter.get("/solar-events", async (req, res) => {
  const parsed = SolarEventsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }
  try {
    const { start, end, eventTypes, sunpy } = parsed.data;
    const useSunpy = sunpy === "1" || sunpy === "true";
    let events = await fetchHekEventsForWindow({
      start,
      end,
      eventTypes,
    });
    if (useSunpy) {
      events = await refineEventsWithSunpy(events);
    }
    const endMs = parseIsoMs(end);
    const dataCutoffIso = new Date(endMs ?? Date.now()).toISOString();
    const informationBoundary = buildInformationBoundary({
      data_cutoff_iso: dataCutoffIso,
      mode: "labels",
      labels_used_as_features: true,
      event_features_included: true,
      inputs: {
        kind: "star_watcher/solar_events",
        v: 1,
        query: {
          start,
          end,
          event_types: eventTypes ?? null,
          sunpy_refine: useSunpy,
        },
        events: events
          .map((ev: any) => ({
            id: ev?.id ?? ev?.ivorn ?? null,
            ivorn: ev?.ivorn ?? null,
            event_type: (ev?.event_type ?? "").toUpperCase() || null,
            start: ev?.start ?? ev?.start_time ?? null,
            end: ev?.end ?? ev?.end_time ?? null,
            goes_class: ev?.goes_class ?? null,
            peak_flux: Number.isFinite(ev?.peak_flux ?? NaN) ? (ev.peak_flux as number) : null,
            noaa_ar: Number.isFinite(ev?.noaa_ar ?? NaN) ? (ev.noaa_ar as number) : null,
            ch_area: Number.isFinite(ev?.ch_area ?? NaN) ? (ev.ch_area as number) : null,
            u: Number.isFinite(ev?.u ?? NaN) ? (ev.u as number) : null,
            v: Number.isFinite(ev?.v ?? NaN) ? (ev.v as number) : null,
          }))
          .sort((a: any, b: any) => `${a.event_type ?? ""}:${a.start ?? ""}:${a.id ?? ""}`.localeCompare(`${b.event_type ?? ""}:${b.start ?? ""}:${b.id ?? ""}`)),
      },
    });
    res.json({ ok: true, events, information_boundary: informationBoundary });
  } catch (error) {
    console.error("[star-watcher] solar-events failed", error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "solar_events_failed", message });
  }
});

starWatcherRouter.get("/sunpy-export", async (req, res) => {
  const parsed = SunpyExportQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }
  const now = new Date();
  // Keep the default request light so SunPy returns quickly.
  const defaultStart = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const defaultEnd = now.toISOString();
  const requestedStart = parsed.data.start || defaultStart;
  const requestedEnd = parsed.data.end || defaultEnd;
  const normalized = normalizeSunpyWindow(requestedStart, requestedEnd);
  const start = normalized.start;
  const end = normalized.end;

  const asOf = parsed.data.asOf?.trim() || null;
  const asOfMs = parseIsoMs(asOf);
  if (asOf && asOfMs === null) {
    return res.status(400).json({ error: "invalid_request", message: "asOf must be an ISO timestamp" });
  }
  const endMs = parseIsoMs(end);
  if (asOfMs !== null && endMs !== null && endMs > asOfMs) {
    return res.status(400).json({ error: "invalid_request", message: "end must be <= asOf (no future leakage)" });
  }

  const includeEventsFlag = parsed.data.includeEvents?.trim().toLowerCase();
  const includeEvents =
    includeEventsFlag == null || includeEventsFlag === "" || includeEventsFlag === "1" || includeEventsFlag === "true";

  const bridgeFlag = parsed.data.bridge?.trim().toLowerCase();
  const bridgeEnabled = !(bridgeFlag === "0" || bridgeFlag === "false" || bridgeFlag === "off");
  const bridgeModeRaw = parsed.data.bridgeMode?.trim().toLowerCase() ?? "";
  const bridgeMode = bridgeModeRaw.includes("observ") ? "observables" : "full";
  const includeEventFeatures = bridgeMode === "full";
  const emitBridgeEvents = includeEventFeatures;
  const preflight = parsed.data.preflight === "1" || parsed.data.preflight === "true";
  const instrument = parsed.data.instrument?.trim() || "AIA";
  const wave = parsed.data.wave?.trim() || "193";
  const eventTypes = parsed.data.eventTypes?.trim() || "FL,AR,CH";
  const maxFrames = clamp(parsed.data.maxFrames ?? 4, 0, 40);
  const sunpyTimeoutMs = Math.max(20_000, Number(process.env.SUNPY_TIMEOUT_MS ?? 180_000));
  const scriptPath = path.resolve(process.cwd(), "tools", "hek_movie_export.py");
  const jsocEmail = process.env.JSOC_EMAIL ?? "danylejbruce@gmail.com";
  const pythonEnv = { ...process.env, JSOC_EMAIL: jsocEmail };

  // Probe-only path: light SunPy search without fetch/HEK.
  if (preflight) {
    try {
      const runProbe = async (probeStart: string, probeEnd: string) => {
        const args = ["--start", probeStart, "--end", probeEnd, "--instrument", instrument, "--wavelength", wave, "--probe-only"];
        return runPythonScript(scriptPath, { args, timeoutMs: sunpyTimeoutMs, env: pythonEnv });
      };

      const initialPayload = (await runProbe(start, end)) as Record<string, unknown>;
      const initialReason = (initialPayload as any)?.reason ?? null;
      const initialFrames = Number((initialPayload as any)?.available_frames ?? 0);
      const endMs = parseIsoMs(end);
      const isRecentWindow =
        endMs !== null &&
        endMs <= Date.now() + 5 * 60 * 1000 &&
        Date.now() - endMs <= SUNPY_FALLBACK_MAX_AGE_HOURS * 60 * 60 * 1000;

      let payload: Record<string, unknown> = {
        ...initialPayload,
        requested_start: requestedStart,
        requested_end: requestedEnd,
      };
      let fallbackAttempted = false;
      let fallbackApplied = false;
      let fallbackStart: string | undefined;
      let fallbackEnd: string | undefined;

      if ((initialFrames <= 0 || initialReason === "no_aia_data") && isRecentWindow && instrument.toUpperCase() === "AIA") {
        fallbackAttempted = true;
        const fallbackWindowMs = Math.max(normalized.windowMs, SUNPY_FALLBACK_MIN_WINDOW_MIN * 60 * 1000);
        const fallbackEndMs = (endMs ?? Date.now()) - SUNPY_FALLBACK_LOOKBACK_MIN * 60 * 1000;
        const fallbackStartMs = fallbackEndMs - fallbackWindowMs;
        fallbackStart = new Date(fallbackStartMs).toISOString();
        fallbackEnd = new Date(fallbackEndMs).toISOString();

        try {
          const retryPayload = (await runProbe(fallbackStart, fallbackEnd)) as Record<string, unknown>;
          const retryFrames = Number((retryPayload as any)?.available_frames ?? 0);
          if (retryFrames > 0) {
            fallbackApplied = true;
            payload = {
              ...retryPayload,
              requested_start: requestedStart,
              requested_end: requestedEnd,
              start: fallbackStart,
              end: fallbackEnd,
              fallback_applied: true,
              fallback_attempted: true,
              fallback_start: fallbackStart,
              fallback_end: fallbackEnd,
              initial_reason: initialReason ?? undefined,
            };
          } else {
            payload = {
              ...payload,
              fallback_attempted: true,
              fallback_start: fallbackStart,
              fallback_end: fallbackEnd,
              initial_reason: initialReason ?? undefined,
            };
          }
        } catch (error) {
          console.warn("[star-watcher] sunpy-export preflight fallback probe failed", error);
          payload = {
            ...payload,
            fallback_attempted: true,
            fallback_start: fallbackStart,
            fallback_end: fallbackEnd,
            initial_reason: initialReason ?? undefined,
          };
        }
      }

      const finalFrames = Number((payload as any)?.available_frames ?? 0);
      const finalReason = (payload as any)?.reason ?? (finalFrames > 0 ? "ok" : initialReason ?? "no_aia_data");
      const informationBoundary = buildInformationBoundary({
        data_cutoff_iso: asOf ?? end,
        mode: "observables",
        labels_used_as_features: false,
        event_features_included: false,
        inputs: {
          kind: "star_watcher/sunpy_export_preflight",
          v: 1,
          request: {
            start,
            end,
            asOf,
            instrument,
            wave,
            max_frames: maxFrames,
          },
          probe: payload,
        },
      });
      return res.json({
        ...payload,
        reason: finalReason,
        fallback_attempted: (payload as any)?.fallback_attempted ?? (fallbackAttempted || undefined),
        fallback_applied: (payload as any)?.fallback_applied ?? (fallbackApplied || undefined),
        fallback_start: (payload as any)?.fallback_start ?? fallbackStart,
        fallback_end: (payload as any)?.fallback_end ?? fallbackEnd,
        initial_reason: (payload as any)?.initial_reason ?? initialReason ?? undefined,
        information_boundary: informationBoundary,
      });
    } catch (error) {
      console.error("[star-watcher] sunpy-export preflight failed", error);
      const message = error instanceof Error ? error.message : String(error);
      const timeout = isTimeoutError(message);
      return res.status(timeout ? 504 : 502).json({
        error: timeout ? "sunpy_timeout" : "sunpy_preflight_failed",
        message,
        timeout_ms: timeout ? sunpyTimeoutMs : undefined,
      });
    }
  }

  try {
    // Fast path: HEK-only when maxFrames=0 (skip SunPy export entirely).
    if (maxFrames === 0) {
      const events = await fetchHekEventsForWindow({ start, end, eventTypes });
      const strippedEvents = includeEvents ? events : [];
      const informationBoundary = buildInformationBoundary({
        data_cutoff_iso: asOf ?? end,
        mode: includeEvents ? "labels" : "observables",
        labels_used_as_features: false,
        event_features_included: false,
        inputs: {
          kind: "star_watcher/sunpy_export",
          v: 1,
          request: {
            start,
            end,
            asOf,
            instrument,
            wave,
            max_frames: maxFrames,
            bridge: bridgeEnabled,
            bridge_mode: bridgeMode,
            include_events: includeEvents,
            event_types: eventTypes,
          },
          observables: { frames: [] },
          labels: includeEvents
            ? strippedEvents
                .map((ev: any) => ({
                  id: ev?.id ?? ev?.ivorn ?? null,
                  event_type: (ev?.event_type ?? "").toUpperCase() || null,
                  start: ev?.start ?? ev?.start_time ?? null,
                  end: ev?.end ?? ev?.end_time ?? null,
                  goes_class: ev?.goes_class ?? null,
                  peak_flux: Number.isFinite(ev?.peak_flux ?? NaN) ? (ev.peak_flux as number) : null,
                }))
                .sort((a: any, b: any) => `${a.event_type ?? ""}:${a.start ?? ""}:${a.id ?? ""}`.localeCompare(`${b.event_type ?? ""}:${b.start ?? ""}:${b.id ?? ""}`))
            : null,
        },
      });
      return res.json({
        instrument,
        wavelength_A: Number.isFinite(Number(wave)) ? Number(wave) : 193,
        meta: {
          start,
          end,
          instrument,
          wavelength: Number.isFinite(Number(wave)) ? Number(wave) : wave,
          cadence_s: null,
          max_frames: maxFrames,
          requestedEventTypes: eventTypes.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean),
          frames_skipped: true,
          source: "hek-only",
        },
        frames: [],
        events: strippedEvents,
        bridge: null,
        information_boundary: informationBoundary,
        debug: {
          frames: 0,
          map_b64_frames: 0,
          grid_sizes: [],
          fallback: "hek_only_maxFrames_0",
          timeout_ms: 0,
          error: null,
        },
      });
    }

    const args = [
      "--start",
      start,
      "--end",
      end,
      "--instrument",
      instrument,
      "--wavelength",
      wave,
      "--max-frames",
      String(maxFrames),
      "--event-types",
      eventTypes,
    ];
    let payload: SunpyExportPayload | null = null;
    let scriptError: unknown = null;
    let scriptErrorMessage = "";
    try {
      payload = (await runPythonScript(scriptPath, { args, timeoutMs: sunpyTimeoutMs, env: pythonEnv })) as SunpyExportPayload;
    } catch (err) {
      scriptError = err;
      scriptErrorMessage = err instanceof Error ? err.message : String(err ?? "");
      console.warn("[star-watcher] sunpy-export python failed (will fall back to HEK-only)", err);
    }

    // If the python bridge timed out or failed, fall back to HEK-only payload so the UI can still render glyphs.
    if (!payload) {
      const noResults =
        typeof scriptErrorMessage === "string" &&
        scriptErrorMessage.toLowerCase().includes("no results for this time range");
      const timedOut = isTimeoutError(scriptErrorMessage);
      const reason = timedOut ? "timeout" : noResults ? "no_aia_data" : "python_error";
      const fallbackReason = timedOut ? "sunpy_timeout" : noResults ? "sunpy_no_results" : "hek_only";
      const errorHint = timedOut
        ? "SunPy exporter timed out; try a shorter window or raise SUNPY_TIMEOUT_MS."
        : noResults
          ? "SunPy returned no images for this time range/wavelength; widen the window or try another channel."
          : undefined;
      const framesMissingReason = timedOut ? "timeout" : noResults ? "no_results" : "python_error";
      const events = await fetchHekEventsForWindow({ start, end, eventTypes });
      const strippedEvents = includeEvents ? events : [];
      const informationBoundary = buildInformationBoundary({
        data_cutoff_iso: asOf ?? end,
        mode: includeEvents ? "labels" : "observables",
        labels_used_as_features: false,
        event_features_included: false,
        inputs: {
          kind: "star_watcher/sunpy_export_fallback",
          v: 1,
          request: {
            start,
            end,
            asOf,
            instrument,
            wave,
            max_frames: maxFrames,
            bridge: bridgeEnabled,
            bridge_mode: bridgeMode,
            include_events: includeEvents,
            event_types: eventTypes,
            reason,
            fallback: fallbackReason,
          },
          observables: { frames: [] },
          labels: includeEvents
            ? strippedEvents
                .map((ev: any) => ({
                  id: ev?.id ?? ev?.ivorn ?? null,
                  event_type: (ev?.event_type ?? "").toUpperCase() || null,
                  start: ev?.start ?? ev?.start_time ?? null,
                  end: ev?.end ?? ev?.end_time ?? null,
                  goes_class: ev?.goes_class ?? null,
                  peak_flux: Number.isFinite(ev?.peak_flux ?? NaN) ? (ev.peak_flux as number) : null,
                }))
                .sort((a: any, b: any) => `${a.event_type ?? ""}:${a.start ?? ""}:${a.id ?? ""}`.localeCompare(`${b.event_type ?? ""}:${b.start ?? ""}:${b.id ?? ""}`))
            : null,
        },
      });
      return res.json({
        reason,
        instrument,
        wavelength_A: Number.isFinite(Number(wave)) ? Number(wave) : 193,
        meta: {
          start,
          end,
          instrument,
          wavelength: Number.isFinite(Number(wave)) ? Number(wave) : wave,
          cadence_s: null,
          max_frames: maxFrames,
          requestedEventTypes: eventTypes.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean),
          frames_missing: true,
          frames_missing_reason: framesMissingReason,
          reason,
          source: fallbackReason,
        },
        frames: [],
        events: strippedEvents,
        bridge: null,
        information_boundary: informationBoundary,
        debug: {
          reason,
          frames: 0,
          map_b64_frames: 0,
          grid_sizes: [],
          fallback: fallbackReason,
          error: scriptErrorMessage,
          error_hint: errorHint,
          timeout_ms: sunpyTimeoutMs,
          frames_missing: true,
          frames_missing_reason: framesMissingReason,
        },
      });
    }

    // Bridge SunPy frames + HEK events into the star coherence loop (5-minute bins) and surface a summary.
    let fallbackAttempted = false;
    let fallbackApplied = false;
    let fallbackRange: { start: string; end: string } | null = null;
    let summary = summarizeSunpyPayload(payload, maxFrames);
    const endMs = parseIsoMs(end);
    const isRecentWindow =
      endMs !== null &&
      endMs <= Date.now() + 5 * 60 * 1000 &&
      Date.now() - endMs <= SUNPY_FALLBACK_MAX_AGE_HOURS * 60 * 60 * 1000;

    // Second chance: if the archive returned nothing for the live window, hop backwards to dodge ingest latency.
    if (
      summary.framesMissing &&
      summary.framesMissingReason === "no_results" &&
      isRecentWindow &&
      instrument.toUpperCase() === "AIA"
    ) {
      fallbackAttempted = true;
      const fallbackWindowMs = Math.max(normalized.windowMs, SUNPY_FALLBACK_MIN_WINDOW_MIN * 60 * 1000);
      const fallbackEndMs = (endMs ?? Date.now()) - SUNPY_FALLBACK_LOOKBACK_MIN * 60 * 1000;
      const fallbackStartMs = fallbackEndMs - fallbackWindowMs;
      const fallbackStartIso = new Date(fallbackStartMs).toISOString();
      const fallbackEndIso = new Date(fallbackEndMs).toISOString();
      fallbackRange = { start: fallbackStartIso, end: fallbackEndIso };

      try {
        const retryArgs = [...args];
        const idxStart = retryArgs.indexOf("--start");
        if (idxStart >= 0 && idxStart + 1 < retryArgs.length) retryArgs[idxStart + 1] = fallbackStartIso;
        const idxEnd = retryArgs.indexOf("--end");
        if (idxEnd >= 0 && idxEnd + 1 < retryArgs.length) retryArgs[idxEnd + 1] = fallbackEndIso;
        const retryPayload = (await runPythonScript(scriptPath, {
          args: retryArgs,
          timeoutMs: sunpyTimeoutMs,
          env: pythonEnv,
        })) as SunpyExportPayload;
        const retrySummary = summarizeSunpyPayload(retryPayload, maxFrames);
        if (retryPayload && retrySummary.frameCount > 0 && retrySummary.mapB64Count > 0) {
          payload = retryPayload;
          summary = retrySummary;
          fallbackApplied = true;
        }
      } catch (error) {
        console.warn("[star-watcher] sunpy-export fallback window failed", error);
      }
    }

    let bridgeSummary: unknown = null;
    const frameCount = summary.frameCount;
    const mapB64Count = summary.mapB64Count;
    const gridSizes = summary.gridSizes;
    const framesMissing = summary.framesMissing;
    const framesMissingReason = summary.framesMissingReason;
    const reasonFromPayload = (payload as any)?.reason;
    const reason = reasonFromPayload ?? (framesMissingReason === "no_results" ? "no_aia_data" : undefined);
    const fallbackTag = framesMissing
      ? framesMissingReason === "no_results"
        ? "sunpy_no_results"
        : "sunpy_no_data"
      : undefined;
    const debugErrorHint =
      framesMissingReason === "no_results"
        ? "SunPy found no AIA images for this time range/wavelength (data gap or ingest latency)."
      : framesMissingReason === "no_valid_maps"
        ? "SunPy fetched data but could not decode any valid maps."
        : framesMissingReason === "no_intensity_grids"
          ? "SunPy returned frames but no intensity grids (map_b64) were available."
        : framesMissing
          ? "SunPy returned no images for this time range/wavelength; showing HEK-only HEK glyphs."
          : undefined;
    const mergedMeta = {
      ...(payload.meta ?? {}),
      start: (payload.meta as any)?.start ?? start,
      end: (payload.meta as any)?.end ?? end,
      requested_start: requestedStart,
      requested_end: requestedEnd,
      normalized_window: normalized.normalized || undefined,
      frames_missing: framesMissing || (payload.meta as any)?.frames_missing,
      frames_missing_reason: framesMissingReason ?? (payload.meta as any)?.frames_missing_reason,
      reason: (payload.meta as any)?.reason ?? reason,
      source: (payload.meta as any)?.source ?? (fallbackTag ?? "sunpy"),
      fallback_applied: fallbackApplied || undefined,
      fallback_start: fallbackRange?.start,
      fallback_end: fallbackRange?.end,
    };
    console.info("[star-watcher] sunpy-export payload", {
      frames: frameCount,
      map_b64_frames: mapB64Count,
      grid_sizes: gridSizes,
      events: Array.isArray(payload?.events) ? payload.events.length : 0,
      frames_missing: framesMissing,
      frames_missing_reason: framesMissingReason,
      fallback_attempted: fallbackAttempted,
      fallback_applied: fallbackApplied,
      reason,
    });
    try {
      if (bridgeEnabled) {
        bridgeSummary = await ingestSunpyCoherenceBridge(payload, {
          sessionId: "solar-hek",
          sessionType: "solar",
          hostMode: "sun_like",
          emitEvents: emitBridgeEvents,
          includeEventFeatures,
        });
      }
    } catch (error) {
      console.warn("[star-watcher] sunpy-coherence-bridge failed (non-fatal)", error);
    }

    const payloadEvents = includeEvents ? payload.events : [];
    payload.events = payloadEvents;

    const framesForHash = Array.isArray(payload.frames)
      ? payload.frames
          .map((frame: any) => ({
            index: Number.isFinite(frame?.index ?? NaN) ? (frame.index as number) : null,
            obstime: typeof frame?.obstime === "string" ? frame.obstime : null,
            grid_size: Number.isFinite(frame?.grid_size ?? NaN) ? (frame.grid_size as number) : null,
            map_b64: typeof frame?.map_b64 === "string" ? frame.map_b64 : null,
          }))
          .sort((a: any, b: any) => `${a.obstime ?? ""}:${a.index ?? 0}`.localeCompare(`${b.obstime ?? ""}:${b.index ?? 0}`))
      : [];
    const eventsForHash = includeEvents
      ? payloadEvents
          .map((ev: any) => ({
            id: ev?.id ?? ev?.ivorn ?? null,
            event_type: (ev?.event_type ?? "").toUpperCase() || null,
            start_time: ev?.start_time ?? ev?.start ?? null,
            end_time: ev?.end_time ?? ev?.end ?? null,
            goes_class: ev?.goes_class ?? null,
            peak_flux: Number.isFinite(ev?.peak_flux ?? NaN) ? (ev.peak_flux as number) : null,
            noaa_ar: Number.isFinite(ev?.noaa_ar ?? NaN) ? (ev.noaa_ar as number) : null,
          }))
          .sort((a: any, b: any) => `${a.event_type ?? ""}:${a.start_time ?? ""}:${a.id ?? ""}`.localeCompare(`${b.event_type ?? ""}:${b.start_time ?? ""}:${b.id ?? ""}`))
      : null;

    const labelsUsedAsFeatures = Boolean(bridgeEnabled && includeEventFeatures);
    const informationBoundary = buildInformationBoundary({
      data_cutoff_iso: asOf ?? mergedMeta.end ?? end,
      mode: labelsUsedAsFeatures || includeEvents ? "mixed" : "observables",
      labels_used_as_features: labelsUsedAsFeatures,
      event_features_included: labelsUsedAsFeatures,
      inputs: {
        kind: "star_watcher/sunpy_export",
        v: 1,
        request: {
          start,
          end,
          asOf,
          instrument,
          wave,
          max_frames: maxFrames,
          bridge: bridgeEnabled,
          bridge_mode: bridgeMode,
          include_events: includeEvents,
          event_types: eventTypes,
        },
        observables: {
          frames: framesForHash,
          cdaweb: payload.cdaweb ?? null,
          goes_xrs: payload.goes_xrs ?? null,
          jsoc_sharp: payload.jsoc_sharp ?? null,
          jsoc_cutout: payload.jsoc_cutout ?? null,
        },
        labels: eventsForHash,
      },
      features:
        bridgeEnabled && bridgeSummary
          ? {
              kind: "star_watcher/sunpy_bridge_summary",
              v: 1,
              bridge: bridgeSummary,
              bridge_mode: bridgeMode,
            }
          : undefined,
    });

    res.json({
      ...payload,
      reason,
      meta: mergedMeta,
      bridge: bridgeSummary,
      information_boundary: informationBoundary,
      debug: {
        reason,
        bridge_mode: bridgeMode,
        bridge_enabled: bridgeEnabled,
        bridge_event_features: includeEventFeatures,
        bridge_emit_events: emitBridgeEvents,
        include_events: includeEvents,
        frames: frameCount,
        map_b64_frames: mapB64Count,
        grid_sizes: gridSizes,
        fallback: fallbackTag,
        frames_missing: framesMissing || undefined,
        frames_missing_reason: framesMissingReason,
        error_hint: debugErrorHint,
        timeout_ms: sunpyTimeoutMs,
        fallback_attempted: fallbackAttempted || undefined,
        fallback_applied: fallbackApplied || undefined,
        fallback_start: fallbackRange?.start,
        fallback_end: fallbackRange?.end,
      },
    });
  } catch (error) {
    console.error("[star-watcher] sunpy-export failed", error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "sunpy_export_failed", message });
  }
});

starWatcherRouter.post("/solar-curvature", async (req, res) => {
  const parsed = SolarCurvatureRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }
  const now = new Date();
  const defaultStart = new Date(now.getTime() - DEFAULT_WINDOW_MS).toISOString();
  const defaultEnd = now.toISOString();
  const requestedStart = parsed.data.start || defaultStart;
  const requestedEnd = parsed.data.end || defaultEnd;
  const normalized = normalizeSunpyWindow(requestedStart, requestedEnd);
  const start = normalized.start;
  const end = normalized.end;

  const asOf = parsed.data.asOf?.trim() || end;
  const asOfMs = parseIsoMs(asOf);
  if (asOf && asOfMs === null) {
    return res.status(400).json({ error: "invalid_request", message: "asOf must be an ISO timestamp" });
  }
  const endMs = parseIsoMs(end);
  if (asOfMs !== null && endMs !== null && endMs > asOfMs) {
    return res.status(400).json({ error: "invalid_request", message: "end must be <= asOf (no future leakage)" });
  }

  let payload = (parsed.data.sunpy as SunpyExportPayload | undefined) ?? null;
  const instrument = parsed.data.instrument?.trim() || "AIA";
  const wave = parsed.data.wave?.trim() || "193";
  const maxFrames = clamp(parsed.data.maxFrames ?? 4, 0, 20);
  if (!payload) {
    const sunpyTimeoutMs = Math.max(20_000, Number(process.env.SUNPY_TIMEOUT_MS ?? 180_000));
    const scriptPath = path.resolve(process.cwd(), "tools", "hek_movie_export.py");
    const jsocEmail = process.env.JSOC_EMAIL ?? "danylejbruce@gmail.com";
    const pythonEnv = { ...process.env, JSOC_EMAIL: jsocEmail };
    const args = ["--start", start, "--end", end, "--instrument", instrument, "--wavelength", wave, "--max-frames", String(maxFrames)];
    try {
      payload = (await runPythonScript(scriptPath, { args, timeoutMs: sunpyTimeoutMs, env: pythonEnv })) as SunpyExportPayload;
    } catch (error) {
      console.error("[star-watcher] solar-curvature sunpy fetch failed", error);
      const message = error instanceof Error ? error.message : String(error);
      const timeout = isTimeoutError(message);
      return res
        .status(timeout ? 504 : 502)
        .json({ error: timeout ? "sunpy_timeout" : "sunpy_fetch_failed", message, timeout_ms: timeout ? sunpyTimeoutMs : undefined });
    }
  }

  try {
    const personaId = typeof req.auth?.sub === "string" ? req.auth.sub : "persona:solar-curvature";
    const persistFlagRaw = parsed.data.persist ?? "";
    const persist =
      typeof persistFlagRaw === "string"
        ? !(persistFlagRaw.toLowerCase() === "0" || persistFlagRaw.toLowerCase() === "false" || persistFlagRaw.toLowerCase() === "off")
        : true;
    const leakageSentinel =
      process.env.SUNPY_ENERGY_LEAKAGE_SENTINEL === "1" || process.env.SOLAR_FORECAST_LEAKAGE_SENTINEL === "1";
    const { energyField, curvature } = await runSolarCurvatureFromSunpy(payload as SunpyExportPayload, {
      asOf,
      boundary: parsed.data.boundary ?? "dirichlet0",
      calibrationVersion: parsed.data.calibrationVersion ?? undefined,
      personaId,
      persistEnvelope: persist,
      leakageSentinel,
    });
    res.json({
      ok: true,
      start,
      end,
      calibration_version: (energyField.meta as any)?.calibration_version ?? null,
      energy_field: energyField,
      curvature,
      information_boundary: energyField.information_boundary,
    });
  } catch (error) {
    console.error("[star-watcher] solar-curvature failed", error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "solar_curvature_failed", message });
  }
});

starWatcherRouter.post("/solar-coherence", upload.single("file"), async (req, res) => {
  const tStart = Date.now();
  const debug = (msg: string, extra?: Record<string, unknown>) => {
    const base = `[star-watcher] solar-coherence ${msg}`;
    if (extra) {
      console.info(base, extra);
    } else {
      console.info(base);
    }
  };
  try {
    let buffer: Buffer | null = null;
    let mime: string | undefined;
    let gridSize: number | undefined;
    let maxFrames: number | undefined;
    let sampleStride: number | undefined;
    let instrumentTag: string | undefined;
    let sessionId: string | undefined;
    let sessionType: string | undefined;
    let hostMode: string | undefined;
    let prompt: string | undefined;

    // Prefer multipart file upload to avoid base64 bloat.
    if ((req as any).file && Buffer.isBuffer((req as any).file.buffer)) {
      buffer = (req as any).file.buffer as Buffer;
      mime = (req as any).file.mimetype;
      gridSize = Number.parseInt((req.body as any)?.gridSize, 10);
      if (!Number.isFinite(gridSize)) gridSize = undefined;
      maxFrames = Number.parseInt((req.body as any)?.maxFrames, 10);
      if (!Number.isFinite(maxFrames)) maxFrames = undefined;
      sampleStride = Number.parseInt((req.body as any)?.sampleStride, 10);
      if (!Number.isFinite(sampleStride)) sampleStride = undefined;
      instrumentTag = typeof (req.body as any)?.instrumentTag === "string" ? (req.body as any).instrumentTag : undefined;
      sessionId = typeof (req.body as any)?.sessionId === "string" ? (req.body as any).sessionId : undefined;
      sessionType = typeof (req.body as any)?.sessionType === "string" ? (req.body as any).sessionType : undefined;
      hostMode = typeof (req.body as any)?.hostMode === "string" ? (req.body as any).hostMode : undefined;
      prompt = typeof (req.body as any)?.prompt === "string" ? (req.body as any).prompt : undefined;
      debug("received multipart payload", {
        bytes: buffer.length,
        mime,
        gridSize,
        instrumentTag,
        sessionId,
        sessionType,
        hostMode,
      });
    } else {
      const parsed = SolarCoherenceSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      }
      const raw = parsed.data.data.trim();
      const base64 = raw.startsWith("data:") ? raw.split(",")[1] ?? "" : raw;
      try {
        buffer = Buffer.from(base64, "base64");
      } catch {
        return res.status(400).json({ error: "invalid_base64" });
      }
      if (!buffer.length) {
        return res.status(400).json({ error: "empty_payload" });
      }
      mime = parsed.data.mime;
      gridSize = parsed.data.gridSize;
      maxFrames = parsed.data.maxFrames;
      sampleStride = parsed.data.sampleStride;
      instrumentTag = parsed.data.instrumentTag;
      sessionId = parsed.data.sessionId;
      sessionType = parsed.data.sessionType;
      hostMode = parsed.data.hostMode;
      prompt = parsed.data.prompt;
      debug("received JSON payload", {
        bytes: buffer.length,
        mime,
        gridSize,
        instrumentTag,
        sessionId,
        sessionType,
        hostMode,
      });
    }

    const result = await runSolarVideoCoherenceJob({
      buffer,
      mime,
      gridSize,
      instrumentTag,
      sessionId,
      sessionType,
      hostMode,
      prompt,
      maxFrames,
      sampleStride,
    });
    debug("job complete", {
      duration_ms: Date.now() - tStart,
      frames: result.frames.length,
      gridSize: result.map.gridSize,
      coherence: result.global.coherence,
      dispersion: result.global.dispersion,
      energy: result.global.energy,
    });

    // Serialize float arrays as base64 to keep payload compact and avoid float precision loss in JSON.
    const encode = (arr: Float32Array) => Buffer.from(new Uint8Array(arr.buffer)).toString("base64");
    const frames = result.frames.map((frame) => ({
      t: frame.t,
      gridSize: frame.gridSize,
      mapSun_b64: encode(frame.sunMap), // observer-frame grid
      mapSunCorot_b64: frame.sunMapCorot ? encode(frame.sunMapCorot) : undefined,
      rotationShiftPx: frame.rotationShiftPx,
      diskGeom: frame.diskGeom,
    }));

    const dataCutoffMs = result.frames.length
      ? Math.max(...result.frames.map((frame) => (Number.isFinite(frame.t) ? frame.t : 0)))
      : Date.now();
    const dataCutoffIso = new Date(Math.max(0, dataCutoffMs)).toISOString();
    const mapToBuffer = (arr: Float32Array) => Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    const informationBoundary = buildInformationBoundaryFromHashes({
      data_cutoff_iso: dataCutoffIso,
      mode: "observables",
      labels_used_as_features: false,
      event_features_included: false,
      inputs_hash: sha256Prefixed(buffer),
      features_hash: sha256Prefixed(Buffer.concat([
        Buffer.from(`grid:${result.map.gridSize};v1;`, "utf8"),
        mapToBuffer(result.map.coherence),
        mapToBuffer(result.map.phaseDispersion),
        mapToBuffer(result.map.energy),
      ])),
    });

    res.json({
      ok: true,
      caption: result.caption,
      global: result.global,
      information_boundary: informationBoundary,
      map: {
        gridSize: result.map.gridSize,
        coherence_b64: encode(result.map.coherence),
        phaseDispersion_b64: encode(result.map.phaseDispersion),
        energy_b64: encode(result.map.energy),
      },
      frames,
      frameCount: frames.length,
    });
  } catch (error) {
    console.error("[star-watcher] solar-coherence failed", error);
    const message = error instanceof Error ? error.message : String(error);
    console.error("[star-watcher] solar-coherence duration_ms", Date.now() - tStart);
    res.status(500).json({ error: "solar_coherence_failed", message });
  }
});
