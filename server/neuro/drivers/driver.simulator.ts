import { performance } from "node:perf_hooks";
import type {
  NeuroDriver,
  NeuroFrameListener,
  NeuroMarkerListener,
} from "./driver.base.js";
import type {
  NeuroFrame,
  NeuroMarker,
  NeuroStreamKind,
} from "../schemas/neuro.schemas.js";

export type NeuroSimulatorOptions = {
  stream?: NeuroStreamKind;
  deviceId?: string;
  sampleRateHz?: number;
  frameSize?: number;
  channelCount?: number;
  signalHz?: number;
  amplitude?: number;
  noiseStd?: number;
  markerEveryMs?: number;
  artifactEveryMs?: number;
  artifactDurationMs?: number;
  artifactAmplitude?: number;
};

const DEFAULT_OPTIONS: Required<
  Omit<
    NeuroSimulatorOptions,
    "markerEveryMs" | "artifactEveryMs" | "artifactDurationMs" | "artifactAmplitude"
  >
> = {
  stream: "eeg",
  deviceId: "sim-1",
  sampleRateHz: 250,
  frameSize: 25,
  channelCount: 8,
  signalHz: 12,
  amplitude: 1,
  noiseStd: 0.15,
};

export class NeuroSimulatorDriver implements NeuroDriver {
  id: string;
  kind: "sim" = "sim";
  private options: NeuroSimulatorOptions;
  private frameListeners = new Set<NeuroFrameListener>();
  private markerListeners = new Set<NeuroMarkerListener>();
  private timer: NodeJS.Timeout | null = null;
  private sampleIndex = 0;
  private phase = 0;
  private nextMarkerAtMs: number | null = null;
  private nextArtifactAtMs: number | null = null;

  constructor(options: NeuroSimulatorOptions = {}) {
    this.options = options;
    this.id = options.deviceId ?? DEFAULT_OPTIONS.deviceId;
  }

  async start(): Promise<void> {
    if (this.timer) {
      return;
    }
    const resolved = this.resolveOptions();
    const intervalMs = Math.max(
      1,
      Math.round((resolved.frameSize / resolved.sampleRateHz) * 1000),
    );
    this.timer = setInterval(() => this.emitFrame(), intervalMs);
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onFrame(cb: NeuroFrameListener): () => void {
    this.frameListeners.add(cb);
    return () => this.frameListeners.delete(cb);
  }

  onMarker(cb: NeuroMarkerListener): () => void {
    this.markerListeners.add(cb);
    return () => this.markerListeners.delete(cb);
  }

  private resolveOptions() {
    return {
      ...DEFAULT_OPTIONS,
      ...this.options,
    };
  }

  private emitMarker(label: string, payload?: Record<string, unknown>) {
    if (this.markerListeners.size === 0) {
      return;
    }
    const tsRecvMono = performance.now();
    const marker: NeuroMarker = {
      tsRecvMono,
      source: "sim",
      label,
      payload,
    };
    this.markerListeners.forEach((listener) => listener(marker));
  }

  private emitFrame() {
    const resolved = this.resolveOptions();
    const {
      stream,
      deviceId,
      sampleRateHz,
      frameSize,
      channelCount,
      signalHz,
      amplitude,
      noiseStd,
    } = resolved;
    const nowMono = performance.now();
    const phaseStep = (2 * Math.PI * signalHz) / sampleRateHz;
    const twoPi = Math.PI * 2;
    const samples: number[][] = [];
    const artifactHit = this.shouldEmitArtifact(nowMono);
    const artifactSamples = artifactHit
      ? Math.max(
          1,
          Math.round(
            ((this.options.artifactDurationMs ?? 80) / 1000) * sampleRateHz,
          ),
        )
      : 0;
    const artifactAmplitude = this.options.artifactAmplitude ?? 2.5;
    for (let ch = 0; ch < channelCount; ch += 1) {
      const channelSamples = new Array<number>(frameSize);
      for (let i = 0; i < frameSize; i += 1) {
        const base = amplitude * Math.sin(this.phase);
        const noise = noiseStd * (Math.random() * 2 - 1);
        let value = base + noise;
        if (artifactHit && i < artifactSamples) {
          value += artifactAmplitude;
        }
        channelSamples[i] = value;
        this.phase += phaseStep;
        if (this.phase > twoPi) {
          this.phase -= twoPi;
        }
      }
      samples.push(channelSamples);
    }
    const frame: NeuroFrame = {
      stream,
      deviceId,
      tsDevice: (this.sampleIndex / sampleRateHz) * 1000,
      tsRecvMono: nowMono,
      samples,
      sampleRateHz,
      channelNames: Array.from(
        { length: channelCount },
        (_, idx) => `ch-${idx + 1}`,
      ),
      units: "uV",
    };
    this.sampleIndex += frameSize;
    if (artifactHit) {
      this.emitMarker("SIM_ARTIFACT", {
        artifactSamples,
        artifactAmplitude,
      });
    }
    this.emitMarkerIfDue(nowMono);
    this.frameListeners.forEach((listener) => listener(frame));
  }

  private emitMarkerIfDue(nowMono: number) {
    const markerEveryMs = this.options.markerEveryMs ?? 0;
    if (markerEveryMs <= 0) {
      return;
    }
    if (this.nextMarkerAtMs === null) {
      this.nextMarkerAtMs = nowMono + markerEveryMs;
      return;
    }
    if (nowMono >= this.nextMarkerAtMs) {
      this.nextMarkerAtMs = nowMono + markerEveryMs;
      this.emitMarker("SIM_PULSE", { periodMs: markerEveryMs });
    }
  }

  private shouldEmitArtifact(nowMono: number): boolean {
    const artifactEveryMs = this.options.artifactEveryMs ?? 0;
    if (artifactEveryMs <= 0) {
      return false;
    }
    if (this.nextArtifactAtMs === null) {
      this.nextArtifactAtMs = nowMono + artifactEveryMs;
      return false;
    }
    if (nowMono >= this.nextArtifactAtMs) {
      this.nextArtifactAtMs = nowMono + artifactEveryMs;
      return true;
    }
    return false;
  }
}
