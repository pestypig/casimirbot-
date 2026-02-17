import { C, C2, G, PI } from "./physics-const";

/**
 * Curvature proxy contract (SI).
 *
 * These helpers provide the shared `kappa_*` conversions used across the project:
 * - `kappa_body(rho)`   = (8πG / (3c²)) ρ          [m^-2] from mass density ρ [kg/m^3]
 * - `kappa_drive(P/A)`  = (8πG / c⁵) (P/A) d_eff 𝓖 [m^-2] from power flux (P/A) [W/m^2]
 * - `kappa_u(u)`        = (8πG / c⁴) u            [m^-2] from energy density u [J/m^3]
 */

const C4 = C2 * C2;
const C5 = C4 * C;

export const curvatureProxyPrefactors = {
  drive: (8 * PI * G) / C5,
  body: (8 * PI * G) / (3 * C2),
  energy_density: (8 * PI * G) / C4,
} as const;

export function kappa_body(rho_kg_m3: number): number {
  if (!Number.isFinite(rho_kg_m3)) return Number.NaN;
  return curvatureProxyPrefactors.body * rho_kg_m3;
}

export function kappa_drive(powerFlux_W_m2: number, d_eff = 1, gain = 1): number {
  if (!Number.isFinite(powerFlux_W_m2) || !Number.isFinite(d_eff) || !Number.isFinite(gain)) {
    return Number.NaN;
  }
  return curvatureProxyPrefactors.drive * powerFlux_W_m2 * d_eff * gain;
}

export function kappa_drive_from_power(power_W: number, area_m2: number, d_eff = 1, gain = 1): number {
  if (!Number.isFinite(power_W) || !Number.isFinite(area_m2) || area_m2 <= 0) {
    return Number.NaN;
  }
  return kappa_drive(power_W / area_m2, d_eff, gain);
}

export function kappa_u(u_J_m3: number): number {
  if (!Number.isFinite(u_J_m3)) return Number.NaN;
  return curvatureProxyPrefactors.energy_density * u_J_m3;
}



export type CurvatureBridgeChannel = "kappa_body" | "kappa_drive" | "kappa_u";
export type BridgeClaimTier = "diagnostic" | "reduced-order" | "certified";

export interface CurvatureStressBridgeInput {
  channel: CurvatureBridgeChannel;
  kappa_m2: number;
  bound_abs_J_m3: number;
  mismatch_threshold_rel: number;
  provenance: {
    class: BridgeClaimTier;
    method: string;
    reference?: string;
  };
  uncertainty?: {
    model?: "bounded" | "gaussian" | "interval";
    relative_1sigma?: number;
    confidence?: number;
  };
}

export interface CurvatureStressBridgeOutput {
  source: {
    channel: CurvatureBridgeChannel;
    kappa_m2: number;
  };
  surrogate: {
    t00_J_m3: number;
    bounded: boolean;
    bound_abs_J_m3: number;
  };
  units: {
    system: "SI";
    length: "m";
    time: "s";
    mass: "kg";
    energy: "J";
    density: "J/m^3";
  };
  provenance: {
    class: BridgeClaimTier;
    method: string;
    reference?: string;
  };
  uncertainty: {
    model: "bounded" | "gaussian" | "interval";
    relative_1sigma: number;
    absolute_1sigma_J_m3: number;
    confidence: number;
  };
  parity: {
    canonical_kappa_m2: number;
    mismatch_rel: number;
    mismatch_threshold_rel: number;
    pass: boolean;
  };
}

const KAPPA_TO_T00_J_M3 = C4 / (8 * PI * G);

const canonicalKappaFromChannel = (channel: CurvatureBridgeChannel, t00_J_m3: number): number => {
  if (channel === "kappa_body") {
    return kappa_body(t00_J_m3 / C2);
  }
  if (channel === "kappa_drive") {
    return kappa_drive(t00_J_m3 * C, 1, 1);
  }
  return kappa_u(t00_J_m3);
};

export function bridgeCurvatureToStressEnergy(input: CurvatureStressBridgeInput): CurvatureStressBridgeOutput {
  const t00Raw = input.kappa_m2 * KAPPA_TO_T00_J_M3;
  const bounded = Number.isFinite(input.bound_abs_J_m3) && input.bound_abs_J_m3 > 0;
  const t00Bounded = bounded
    ? Math.max(-input.bound_abs_J_m3, Math.min(input.bound_abs_J_m3, t00Raw))
    : Number.NaN;

  const canonical_kappa_m2 = canonicalKappaFromChannel(input.channel, t00Bounded);
  const denom = Math.max(1e-30, Math.abs(canonical_kappa_m2));
  const mismatch_rel = Math.abs(canonical_kappa_m2 - input.kappa_m2) / denom;
  const pass = Number.isFinite(mismatch_rel) && mismatch_rel <= input.mismatch_threshold_rel;

  const rel1 = input.uncertainty?.relative_1sigma ?? 0;
  const conf = input.uncertainty?.confidence ?? 0.95;
  const abs1 = Math.abs(t00Bounded) * rel1;

  return {
    source: {
      channel: input.channel,
      kappa_m2: input.kappa_m2,
    },
    surrogate: {
      t00_J_m3: t00Bounded,
      bounded,
      bound_abs_J_m3: input.bound_abs_J_m3,
    },
    units: {
      system: "SI",
      length: "m",
      time: "s",
      mass: "kg",
      energy: "J",
      density: "J/m^3",
    },
    provenance: {
      class: input.provenance.class,
      method: input.provenance.method,
      reference: input.provenance.reference,
    },
    uncertainty: {
      model: input.uncertainty?.model ?? "bounded",
      relative_1sigma: rel1,
      absolute_1sigma_J_m3: abs1,
      confidence: conf,
    },
    parity: {
      canonical_kappa_m2,
      mismatch_rel,
      mismatch_threshold_rel: input.mismatch_threshold_rel,
      pass,
    },
  };
}
