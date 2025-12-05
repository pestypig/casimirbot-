import type { PhysicsCertificate } from "./physicsCertificate";

export type ViabilityStatus = "ADMISSIBLE" | "MARGINAL" | "INADMISSIBLE" | "NOT_CERTIFIED";
export type ConstraintSeverity = "HARD" | "SOFT";

export interface WarpConfig {
  bubbleRadius_m?: number;
  wallThickness_m?: number;
  targetVelocity_c?: number;
  tileConfigId?: string;
  tileCount?: number;
  dutyCycle?: number;
  gammaGeoOverride?: number;
}

export interface ViabilityConstraint {
  id: string;
  description: string;
  severity: ConstraintSeverity;
  passed: boolean;
  lhs?: number;
  rhs?: number;
  margin?: number | null;
  details?: string;
}

export interface WarpSnapshot {
  TS_ratio?: number;
  gamma_VdB?: number;
  d_eff?: number;
  U_static?: number;
  T00_min?: number;
  M_exotic?: number;
  thetaCal?: number;
  gamma_geo_cubed?: number;
  T00_avg?: number;
  [k: string]: number | undefined;
}

export interface WarpViabilityPayload {
  status: ViabilityStatus;
  config: WarpConfig;
  constraints: ViabilityConstraint[];
  snapshot: WarpSnapshot;
  citations?: string[];
}

export interface ViabilityResult {
  status: ViabilityStatus;
  constraints: ViabilityConstraint[];
  snapshot: WarpSnapshot;
  citations?: string[];
  config?: WarpConfig;
  certificate?: WarpViabilityCertificate | null;
  integrityOk?: boolean;
  certificateHash?: string;
  certificateId?: string;
}

export type ConstraintResult = ViabilityConstraint;
export type WarpViabilitySnapshot = WarpSnapshot;
export type WarpViabilityCertificate = PhysicsCertificate<WarpViabilityPayload>;

export interface CertificateDifference {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface CertificateRecheckResult {
  integrityOk: boolean;
  physicsOk: boolean;
  differences?: CertificateDifference[];
}
