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

export type PipelineSnapshot = {
  zeta?: number;
  zetaRaw?: number;
  qiGuardrail?: QiGuardrail;
};
