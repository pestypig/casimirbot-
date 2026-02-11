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
  curvatureRadius_m?: number | null;
  curvatureRatio?: number | null;
  curvatureOk?: boolean | null;
  curvatureSource?: string | null;
  curvatureNote?: string | null;
  curvatureEnforced?: boolean | null;
  metricDerived?: boolean | null;
  metricDerivedSource?: string | null;
  metricDerivedReason?: string | null;
  metricDerivedChart?: string | null;
}

export type CongruenceMeta = {
  source?: "pipeline" | "metric" | "unknown" | string;
  congruence?: "proxy-only" | "geometry-derived" | "conditional" | "unknown" | string;
  proxy?: boolean;
};

export type GrConstraintDiagnostics = {
  min: number;
  max: number;
  maxAbs: number;
  rms?: number;
  mean?: number;
  sampleCount?: number;
};

export type MetricConstraintAudit = {
  updatedAt: number;
  source: string;
  chart?: string;
  family?: string;
  observer?: string;
  normalization?: string;
  unitSystem?: string;
  rho_constraint: GrConstraintDiagnostics;
};

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
  strictCongruence?: boolean;
  qiGuardrail?: QiGuardrail;
  qiAutoscale?: QiAutoscaleTelemetry | null;
  busVoltage_kV?: number;
  busCurrent_A?: number;
  curvatureMeta?: CongruenceMeta;
  stressMeta?: CongruenceMeta;
  metricConstraint?: MetricConstraintAudit;
  rho_constraint?: GrConstraintDiagnostics;
  rho_constraint_source?: string;
  rho_delta_metric_mean?: number;
  rho_delta_pipeline_mean?: number;
  rho_delta_threshold?: number;
  rho_delta_gate?: boolean;
  rho_delta_gate_reason?: string;
  rho_delta_gate_source?: string;
  rho_delta_missing_parts?: string[];
  congruence_missing_parts?: string[];
  congruence_missing_count?: number;
  congruence_missing_reason?: string;
  vdb_region_ii_derivative_support?: boolean;
  vdb_region_iv_derivative_support?: boolean;
};
