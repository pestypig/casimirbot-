export interface TsAutoscale {
  engaged: boolean;
  gating: "active" | "ts_safe" | "idle" | "window_bad" | "disabled";
  appliedBurst_ns: number;
  proposedBurst_ns?: number;
  target: number;
}

export interface QiAutoscale {
  engaged: boolean;
  gating: "active" | "idle" | "source_mismatch" | "window_bad" | "disabled";
  appliedScale: number;
  proposedScale?: number;
  target: number;
}

export interface TsSnapshot {
  ratio: number;
  tauLC_ms: number;
  tauPulse_ns: number;
  epsilon?: number;
  autoscale?: TsAutoscale;
}

export interface QiGuardrail {
  marginRatioRaw: number | null;
  marginRatio: number | null;
  lhs_Jm3: number | null;
  bound_Jm3: number | null;
  window_ms: number | null;
  sampler?: string | null;
  sumWindowDt?: number | null;
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
  rhoSource?:
    | "tile-telemetry"
    | "gate-pulses"
    | "pump-tones"
    | "duty-fallback"
    | string;
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

export interface PipelineSnapshot {
  zetaRaw?: number | null;
  zeta?: number | null;
  strictCongruence?: boolean;
  ts?: TsSnapshot;
  qiGuardrail?: QiGuardrail;
  qiAutoscale?: QiAutoscale;
   /** Ship HV bus voltage and current (derived from mode power policy). */
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
  __ts?: number;
  __pid?: number;
  __ts_baseBurst_ms?: number;
  __ts_baseBurst_source?: string;
  [k: string]: unknown;
}
