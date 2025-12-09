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
  rhoSource?:
    | "tile-telemetry"
    | "gate-pulses"
    | "pump-tones"
    | "duty-fallback"
    | string;
}

export interface PipelineSnapshot {
  zetaRaw?: number | null;
  zeta?: number | null;
  ts?: TsSnapshot;
  qiGuardrail?: QiGuardrail;
  qiAutoscale?: QiAutoscale;
   /** Ship HV bus voltage and current (derived from mode power policy). */
  busVoltage_kV?: number;
  busCurrent_A?: number;
  __ts?: number;
  __pid?: number;
  __ts_baseBurst_ms?: number;
  __ts_baseBurst_source?: string;
  [k: string]: unknown;
}
