export interface QiGuardrail {
  lhs_Jm3?: number; // numerator (J/m^3)
  bound_Jm3?: number; // Ford-Roman bound (J/m^3, negative)
  marginRatioRaw?: number; // |lhs|/|bound| (unclamped)
  marginRatio?: number; // policy-clamped
  window_ms?: number; // integration window
  sampler?: "gaussian" | "lorentzian" | "compact" | string;
  fieldType?: string;
  duty?: number; // ship-wide d_eff used by guard
  patternDuty?: number; // mask duty (pattern on-fraction)
  maskSum?: number; // sum of mask weights
  effectiveRho?: number; // duty-weighted rho
  rhoOn?: number; // instantaneous rho when mask is on
  rhoOnDuty?: number; // rhoOn averaged by duty (if sent separately)
  rhoSource?: "tile-telemetry" | "gate-pulses" | "pump-tones" | "duty-fallback" | string;
  sumWindowDt?: number; // Sigma g*dt check (~1)
}

export type QiAutoscaleClamp = {
  kind?: string;
  before?: number;
  after?: number;
  limit?: number;
  floor?: number;
  ceiling?: number;
  perSec?: number;
  dt_s?: number;
  toneOmegaHz?: number;
};

export interface QiAutoscaleTelemetry {
  enabled?: boolean;
  target?: number;
  zetaRaw?: number | null;
  proposedScale?: number | null;
  appliedScale?: number | null;
  scale?: number | null;
  engaged?: boolean;
  minScale?: number | null;
  slew?: number | null;
  slewPerSec?: number | null;
  source?: string | null;
  rhoSource?: string | null;
  sumWindowDt?: number | null;
  gating?: string;
  note?: string | null;
  clamps?: QiAutoscaleClamp[];
}

export type PipelineSnapshot = {
  zeta?: number;
  zetaRaw?: number;
  qiGuardrail?: QiGuardrail;
  qiAutoscale?: QiAutoscaleTelemetry | null;
};
