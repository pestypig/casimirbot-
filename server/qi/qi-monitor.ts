import type { QiSettings, QiStats, SamplingKind } from "../../shared/schema.js";
import { fordRomanBound } from "./qi-bounds.js";

type Kernel = {
  weights: Float64Array;
  dt_ms: number;
  window_ms: number;
  kind: SamplingKind;
  tau_s_ms: number;
};

export class QiMonitor {
  private kernel: Kernel;
  private buf: Float64Array;
  private idx = 0;
  private filled = 0;

  constructor(
    private settings: QiSettings,
    dt_ms: number,
    private boundScalar: number,
  ) {
    this.kernel = makeKernel(settings.sampler, settings.tau_s_ms, dt_ms);
    this.buf = new Float64Array(this.kernel.weights.length);
  }

  tick(effectiveRho: number): QiStats {
    this.buf[this.idx] = effectiveRho;
    this.idx = (this.idx + 1) % this.buf.length;
    this.filled = Math.min(this.filled + 1, this.buf.length);

    let acc = 0;
    let j = this.idx;
    const w = this.kernel.weights;
    for (let k = 0; k < this.filled; k += 1) {
      acc += this.buf[j] * w[k];
      j = (j + 1) % this.buf.length;
    }

    const bound = fordRomanBound({
      tau_s_ms: this.settings.tau_s_ms,
      sampler: this.settings.sampler,
      fieldKind: this.settings.fieldType,
      scalarFallback: this.boundScalar,
    });

    return {
      sampler: this.settings.sampler,
      tau_s_ms: this.settings.tau_s_ms,
      observerId: this.settings.observerId,
      fieldType: this.settings.fieldType,
      dt_ms: this.kernel.dt_ms,
      avg: acc,
      bound,
      margin: acc - bound,
      window_ms: this.kernel.window_ms,
      samples: this.filled,
    };
  }

  reconfigure(next: Partial<QiSettings> & { dt_ms?: number; boundScalar?: number }) {
    this.settings = { ...this.settings, ...next };
    const dt_ms = next.dt_ms ?? this.kernel.dt_ms;

    if (
      next.dt_ms !== undefined ||
      next.tau_s_ms !== undefined ||
      next.sampler !== undefined
    ) {
      this.kernel = makeKernel(this.settings.sampler, this.settings.tau_s_ms, dt_ms);
      this.buf = new Float64Array(this.kernel.weights.length);
      this.idx = 0;
      this.filled = 0;
    }

    if (next.boundScalar !== undefined) {
      this.boundScalar = next.boundScalar;
    }
  }
}

function makeKernel(kind: SamplingKind, tau_s_ms: number, dt_ms: number): Kernel {
  const span = Math.max(6, Math.ceil((8 * tau_s_ms) / Math.max(dt_ms, 1e-6)));
  const weights = new Float64Array(span);

  if (kind === "gaussian") {
    const sigma2 = tau_s_ms * tau_s_ms;
    for (let k = 0; k < span; k += 1) {
      const t = (k - span + 1) * dt_ms;
      weights[k] = Math.exp(-(t * t) / (2 * sigma2 || 1));
    }
  } else if (kind === "compact") {
    const radius = Math.max(tau_s_ms, dt_ms);
    for (let k = 0; k < span; k += 1) {
      const t = Math.abs((k - span + 1) * dt_ms);
      if (t > radius) {
        weights[k] = 0;
      } else {
        // Raised-cosine bump with compact support on [-tau, tau]
        const x = t / Math.max(radius, 1e-6);
        weights[k] = 0.5 * (1 + Math.cos(Math.PI * x));
      }
    }
  } else {
    for (let k = 0; k < span; k += 1) {
      const t = (k - span + 1) * dt_ms;
      weights[k] = 1 / (1 + (t * t) / (tau_s_ms * tau_s_ms || 1));
    }
  }

  let sum = 0;
  for (let k = 0; k < span; k += 1) sum += weights[k];
  if (sum <= 0) sum = 1;
  for (let k = 0; k < span; k += 1) weights[k] /= sum;

  return {
    weights,
    dt_ms,
    window_ms: span * dt_ms,
    kind,
    tau_s_ms,
  };
}


export function evaluateQiGuardrail(args: { avg: number; bound: number }) {
  const margin = args.avg - args.bound;
  return {
    pass: Number.isFinite(margin) && margin >= 0,
    margin,
  };
}
