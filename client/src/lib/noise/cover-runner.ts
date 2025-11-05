import type { CoverEvidence, CoverJob, ImmersionScores, TempoMeta } from "@/types/noise-gens";
import { apiRequest } from "@/lib/queryClient";

const WORKER_URL = new URL("../../workers/cover-worker.ts", import.meta.url);
const TEMPO_STORAGE_KEY = "noisegen:tempo";

type CoverWorkerProgress = { t: "progress"; pct: number; stage: string };
type CoverWorkerReady = { t: "ready"; wavBlob: Blob; duration: number; immersion: ImmersionScores };
type CoverWorkerError = { t: "error"; error: string };

type CoverWorkerEvent = CoverWorkerProgress | CoverWorkerReady | CoverWorkerError;

type UploadPreviewFn = (blob: Blob) => Promise<string>;

export interface FulfillOptions {
  onProgress?: (pct: number, stage: string) => void;
  uploadPreview?: UploadPreviewFn;
  signal?: AbortSignal;
}

export interface FulfillResult {
  previewUrl: string;
  blob: Blob;
  duration: number;
  evidence: CoverEvidence;
}

export function canFulfillLocally(): boolean {
  if (typeof window === "undefined") return false;
  return typeof Worker !== "undefined" && typeof (window as Window & typeof globalThis).OfflineAudioContext !== "undefined";
}

export async function fulfillCoverJob(job: CoverJob, options: FulfillOptions = {}): Promise<FulfillResult> {
  if (!canFulfillLocally()) {
    throw new Error("Offline rendering is not supported in this browser");
  }

  const worker = new Worker(WORKER_URL, { type: "module", name: `cover-job:${job.id}` });
  let settled = false;

  const cleanup = () => {
    if (settled) return;
    settled = true;
    worker.onerror = null;
    worker.onmessage = null;
    worker.terminate();
  };

  const tempo = resolveTempo(job);
  const original = await resolveOriginalAudio(job.request.originalId);
  const payload = {
    t: "render" as const,
    jobId: job.id,
    original,
    tempo,
    barWindows: job.request.barWindows,
    helix: job.request.helix,
    kbTexture: job.request.kbTexture ?? null,
    sampleInfluence: job.request.sampleInfluence ?? 0.7,
    styleInfluence: job.request.styleInfluence ?? 0.3,
    weirdness: job.request.weirdness ?? 0.2,
  };

  const ready = new Promise<FulfillResult>((resolve, reject) => {
    worker.onerror = (event) => {
      cleanup();
      reject(event instanceof ErrorEvent ? event.error ?? new Error(event.message) : new Error("cover worker error"));
    };

    worker.onmessage = (event: MessageEvent<CoverWorkerEvent>) => {
      const message = event.data;
      if (!message) return;
      if (message.t === "progress") {
        options.onProgress?.(message.pct, message.stage);
        return;
      }
      if (message.t === "error") {
        cleanup();
        reject(new Error(message.error || "cover render failed"));
        return;
      }
      if (message.t === "ready") {
        cleanup();
        resolve(handleReady(message, job, options.uploadPreview));
      }
    };
  });

  const abortListener = () => {
    worker.postMessage({ t: "abort", jobId: job.id });
    cleanup();
  };

  if (options.signal) {
    if (options.signal.aborted) {
      abortListener();
      throw new DOMException("Render aborted", "AbortError");
    }
    options.signal.addEventListener("abort", abortListener, { once: true });
  }

  worker.postMessage(payload);

  try {
    const result = await ready;
    await apiRequest(
      "PUT",
      `/api/noise-gens/jobs/${encodeURIComponent(job.id)}/ready`,
      { previewUrl: result.previewUrl, evidence: result.evidence },
    );
    return result;
  } finally {
    options.signal?.removeEventListener?.("abort", abortListener);
    cleanup();
  }
}

async function handleReady(message: CoverWorkerReady, _job: CoverJob, uploadPreview?: UploadPreviewFn): Promise<FulfillResult> {
  const blob = message.wavBlob;
  const duration = message.duration;
  const previewUrl = uploadPreview ? await uploadPreview(blob) : URL.createObjectURL(blob);
  const evidence: CoverEvidence = {
    idi: message.immersion.idi,
    idiConfidence: message.immersion.confidence,
    immersion: message.immersion,
  };
  return { previewUrl, blob, duration, evidence };
}

async function resolveOriginalAudio(originalId: string): Promise<{ instrumentalUrl: string; vocalUrl?: string }> {
  const slug = encodeURIComponent(originalId.toLowerCase());
  const rootCandidates = [`/originals/${slug}`, `/audio/originals/${slug}`];
  for (const root of rootCandidates) {
    const instrumentalUrl = `${root}/instrumental.wav`;
    const exists = await resourceExists(instrumentalUrl);
    if (exists) {
      const vocalUrl = (await resourceExists(`${root}/vocal.wav`)) ? `${root}/vocal.wav` : undefined;
      return { instrumentalUrl, vocalUrl };
    }
  }
  return {
    instrumentalUrl: "/originals/default/instrumental.wav",
    vocalUrl: (await resourceExists("/originals/default/vocal.wav")) ? "/originals/default/vocal.wav" : undefined,
  };
}

const resourceCache = new Map<string, Promise<boolean>>();

async function resourceExists(url: string): Promise<boolean> {
  let cached = resourceCache.get(url);
  if (!cached) {
    cached = fetch(url, { method: "HEAD" })
      .then((res) => res.ok)
      .catch(() => false);
    resourceCache.set(url, cached);
  }
  return cached;
}

function resolveTempo(job: CoverJob): TempoMeta {
  const fromJob = (job.request as { tempo?: TempoMeta }).tempo;
  const fromStorage = readStoredTempo();
  const candidate = fromJob ?? fromStorage;
  if (candidate) {
    return {
      bpm: clampNumber(candidate.bpm, 40, 240),
      timeSig: sanitizeTimeSig(candidate.timeSig),
      offsetMs: clampNumber(candidate.offsetMs ?? 0, -2000, 2000),
      barsInLoop: candidate.barsInLoop,
      quantized: candidate.quantized ?? true,
    };
  }
  return {
    bpm: 120,
    timeSig: "4/4",
    offsetMs: 0,
    barsInLoop: 8,
    quantized: true,
  };
}

function readStoredTempo(): TempoMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TEMPO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.bpm !== "number" || typeof parsed.timeSig !== "string") return null;
    return parsed as TempoMeta;
  } catch {
    return null;
  }
}

function sanitizeTimeSig(value: string | undefined): TempoMeta["timeSig"] {
  if (!value || !/^\d+\/\d+$/.test(value)) return "4/4";
  return value as TempoMeta["timeSig"];
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
