import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEnergyPipeline } from "./use-energy-pipeline";
import { publishWhisper } from "@/lib/luma-whispers";
import {
  ensureDriveSamplesWired,
  getDriveSampleMeta,
  sampleStream,
  type DriveSampleMessage,
} from "@/lib/drive-samples-bridge";
import type { FractionalScanConfig } from "@/workers/fractional-scan";

export type FractionalSidebands = {
  plus: number;
  minus: number;
  symmetry: number;
};

export type FractionalLine = {
  ratio: number;
  fHz: number;
  A: number;
  P: number;
  phase: number;
  snr: number;
  sidebands?: FractionalSidebands;
};

export type FractionalPayload = {
  CP: number;
  IFC: number;
  SS: number;
  lines: FractionalLine[];
};

export type FractionalEMA = {
  CP: number | null;
  IFC: number | null;
  SS: number | null;
};

export type FractionalCoherenceState = {
  live: FractionalPayload | null;
  CP: number | null;
  IFC: number | null;
  SS: number | null;
  EMA: FractionalEMA;
  lastUpdated: number | null;
};

const DEFAULT_RATIOS = Object.freeze([
  0.5,
  1.5,
  2.5,
  4 / 3,
  5 / 3,
  7 / 3,
  8 / 3,
  7 / 2,
  3.5,
] as number[]);

const DEFAULT_WINDOW_MS = 48;
const DEFAULT_HOP_MS = 24;
const MIN_FS = 4_096;
const MAX_FS = 262_144;

function ema(prev: number | null, next: number, alpha = 0.2) {
  return prev == null ? next : alpha * next + (1 - alpha) * prev;
}

function clampFs(fs: number) {
  if (!Number.isFinite(fs) || fs <= 0) return MIN_FS;
  return Math.max(MIN_FS, Math.min(MAX_FS, fs));
}

function deriveBasebandF0(pipeline: any): number | null {
  if (!pipeline) return null;
  const fields = [
    pipeline?.coherence?.basebandHz,
    pipeline?.coherence?.f0_Hz,
    pipeline?.drive?.f0_Hz,
    pipeline?.Omega0_Hz,
    pipeline?.Omega_Hz,
    pipeline?.modulationFreq_Hz,
    pipeline?.modulationFreq_kHz ? pipeline.modulationFreq_kHz * 1e3 : undefined,
    pipeline?.modulationFreq_GHz ? pipeline.modulationFreq_GHz * 1e6 : undefined,
  ];
  for (const candidate of fields) {
    const num = Number(candidate);
    if (Number.isFinite(num) && num > 0 && num < 5e6) {
      return num;
    }
  }
  return null;
}

function buildConfig(
  baseConfig: Partial<FractionalScanConfig> | null,
  ratios: readonly number[],
): FractionalScanConfig | null {
  const f0 = Number(baseConfig?.f0);
  if (!Number.isFinite(f0) || f0 <= 0) return null;
  const fsCandidate = Number(baseConfig?.fs);
  const fs =
    Number.isFinite(fsCandidate) && fsCandidate > 0
      ? clampFs(fsCandidate)
      : clampFs(Math.max(f0 * 16, 16_384));

  const windowMs =
    Number.isFinite(baseConfig?.windowMs) && (baseConfig?.windowMs ?? 0) > 0
      ? baseConfig!.windowMs!
      : DEFAULT_WINDOW_MS;
  const hopMs =
    Number.isFinite(baseConfig?.hopMs) && (baseConfig?.hopMs ?? 0) > 0
      ? baseConfig!.hopMs!
      : DEFAULT_HOP_MS;
  const sidebandDeltaHz =
    Number.isFinite(baseConfig?.sidebandDeltaHz) && (baseConfig?.sidebandDeltaHz ?? 0) > 0
      ? baseConfig!.sidebandDeltaHz!
      : Math.max(0.25, fs / 4096);

  return {
    fs,
    f0,
    windowMs,
    hopMs,
    ratios: Array.from(ratios),
    sidebandDeltaHz,
  };
}

export function useFractionalCoherence(
  ratios: readonly number[] = DEFAULT_RATIOS,
): FractionalCoherenceState {
  const { data: pipeline } = useEnergyPipeline();
  const [busMeta, setBusMeta] = useState(() => {
    const meta = getDriveSampleMeta();
    return {
      fs: typeof meta.fs === "number" ? meta.fs : null,
      f0: typeof meta.f0 === "number" ? meta.f0 : null,
    };
  });
  const pipelineConfig = useMemo(() => {
    const pipelineAny = pipeline as any;
    const fallbackF0 = typeof busMeta.f0 === "number" && Number.isFinite(busMeta.f0) && busMeta.f0 > 0 ? busMeta.f0 : 1_500;
    const f0 = deriveBasebandF0(pipelineAny) ?? fallbackF0;
    const metaFs = busMeta.fs;
    const sampleRate =
      pipelineAny?.coherence && Number.isFinite(pipelineAny.coherence.sampleRateHz)
        ? Number(pipelineAny.coherence.sampleRateHz)
        : typeof metaFs === "number" && Number.isFinite(metaFs) && metaFs > 0
          ? metaFs
          : NaN;
    const fs =
      Number.isFinite(sampleRate) && sampleRate > 0
        ? sampleRate
        : Math.max(f0 * 16, 16_384);
    return { f0, fs };
  }, [pipeline, busMeta.f0, busMeta.fs]);

  const [live, setLive] = useState<FractionalPayload | null>(null);
  const [emaCP, setEmaCP] = useState<number | null>(null);
  const [emaIFC, setEmaIFC] = useState<number | null>(null);
  const [emaSS, setEmaSS] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const configRef = useRef<FractionalScanConfig | null>(null);
  const lastWarnAtRef = useRef<number>(0);
  const lastFeedAtRef = useRef<number>(0);
  const ratiosKey = useMemo(() => ratios.join(","), [ratios]);

  const reinitWorker = useCallback((config: FractionalScanConfig) => {
    configRef.current = config;
    if (!workerRef.current) {
      if (typeof Worker === "undefined") return;
      workerRef.current = new Worker(
        new URL("../workers/fractional-scan.ts", import.meta.url),
        { type: "module", name: "fractional-scan" },
      );
      workerRef.current.onmessage = (evt: MessageEvent<FractionalPayload>) => {
        const payload = evt.data;
        setLive(payload);
        setEmaCP((prev) => ema(prev, payload.CP));
        setEmaIFC((prev) => ema(prev, payload.IFC));
        setEmaSS((prev) => ema(prev, payload.SS));
        setLastUpdated(typeof performance !== "undefined" ? performance.now() : Date.now());

        const emaSnapshot = emaCP ?? payload.CP;
        if (emaSnapshot > 0) {
          const dip = payload.CP < 0.7 * emaSnapshot;
          const now = typeof performance !== "undefined" ? performance.now() : Date.now();
          if (dip && now - lastWarnAtRef.current > 4_000) {
            publishWhisper("drive:coherence", {
              level: "warn",
              msg: "Fractional coherence dip detected",
              CP: payload.CP,
              IFC: payload.IFC,
              SS: payload.SS,
              timestamp: now,
            });
            lastWarnAtRef.current = now;
          }
        }
      };
    }
    workerRef.current!.postMessage({ type: "init", config });
  }, [emaCP]);

  const processSamples = useCallback(
    (payload: DriveSampleMessage) => {
      setBusMeta((prev) => {
        let nextFS = prev.fs;
        let nextF0 = prev.f0;
        if (typeof payload.fs === "number" && Number.isFinite(payload.fs) && payload.fs > 0) {
          nextFS = payload.fs;
        }
        if (typeof payload.f0 === "number" && Number.isFinite(payload.f0) && payload.f0 > 0) {
          nextF0 = payload.f0;
        }
        if (nextFS === prev.fs && nextF0 === prev.f0) {
          return prev;
        }
        return {
          fs: typeof nextFS === "number" ? nextFS : null,
          f0: typeof nextF0 === "number" ? nextF0 : null,
        };
      });

      if (payload.flush) {
        const worker = workerRef.current;
        if (worker) {
          worker.postMessage({ type: "flush" });
        }
        return;
      }

      const worker = workerRef.current;
      if (!worker) return;

      const chunk = payload.samples;
      if (!(chunk instanceof Float32Array)) return;

      const overrides: Partial<FractionalScanConfig> = {};
      if (typeof payload.f0 === "number" && Number.isFinite(payload.f0) && payload.f0 > 0) {
        overrides.f0 = payload.f0;
      }
      if (typeof payload.fs === "number" && Number.isFinite(payload.fs) && payload.fs > 0) {
        overrides.fs = payload.fs;
      }
      if (typeof payload.windowMs === "number" && Number.isFinite(payload.windowMs) && payload.windowMs > 0) {
        overrides.windowMs = payload.windowMs;
      }
      if (typeof payload.hopMs === "number" && Number.isFinite(payload.hopMs) && payload.hopMs > 0) {
        overrides.hopMs = payload.hopMs;
      }
      if (
        typeof payload.sidebandDeltaHz === "number" &&
        Number.isFinite(payload.sidebandDeltaHz) &&
        payload.sidebandDeltaHz > 0
      ) {
        overrides.sidebandDeltaHz = payload.sidebandDeltaHz;
      }

      const nextRatios =
        Array.isArray(payload.ratios) && payload.ratios.length
          ? payload.ratios
          : ratios;

      const nextConfig = buildConfig(
        {
          ...(configRef.current ?? {}),
          ...overrides,
        },
        nextRatios,
      );

      if (nextConfig) {
        const current = configRef.current;
        const ratiosChanged =
          !current ||
          current.ratios.length !== nextConfig.ratios.length ||
          current.ratios.some((value, idx) => value !== nextConfig.ratios[idx]);
        const changed =
          !current ||
          Math.abs(current.f0 - nextConfig.f0) > 1e-3 ||
          Math.abs(current.fs - nextConfig.fs) > 1 ||
          current.windowMs !== nextConfig.windowMs ||
          current.hopMs !== nextConfig.hopMs ||
          current.sidebandDeltaHz !== nextConfig.sidebandDeltaHz ||
          ratiosChanged;
        if (changed) {
          reinitWorker(nextConfig);
        }
      }

      const copy = new Float32Array(chunk);
      worker.postMessage({ type: "push", samples: copy }, [copy.buffer]);
      lastFeedAtRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    },
    [ratios, reinitWorker],
  );

  useEffect(() => {
    const config = buildConfig(
      {
        f0: pipelineConfig.f0,
        fs: pipelineConfig.fs,
        windowMs: DEFAULT_WINDOW_MS,
        hopMs: DEFAULT_HOP_MS,
      },
      ratios,
    );
    if (!config) return;
    reinitWorker(config);

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      configRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineConfig.f0, pipelineConfig.fs, ratiosKey]);

  useEffect(() => {
    let cancelled = false;
    ensureDriveSamplesWired();
    const iterator = sampleStream();

    const run = async () => {
      try {
        for await (const message of iterator) {
          if (cancelled) break;
          processSamples(message);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[useFractionalCoherence] drive sample stream error", err);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      if (typeof iterator.return === "function") {
        iterator.return(undefined).catch(() => {});
      }
    };
  }, [processSamples]);

  return useMemo(
    () => ({
      live,
      CP: live?.CP ?? null,
      IFC: live?.IFC ?? null,
      SS: live?.SS ?? null,
      EMA: { CP: emaCP, IFC: emaIFC, SS: emaSS },
      lastUpdated,
    }),
    [live, emaCP, emaIFC, emaSS, lastUpdated],
  );
}

export default useFractionalCoherence;
