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
export type ObservableGeometryRole = "background_geometry" | "dynamic_forcing_geometry";

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

export interface ObservableGeometryChannel {
  geometry_slot: "G_geometry";
  role: ObservableGeometryRole;
  semantics: "curvature_proxy_observable_response";
  equation_ref: "collective_observable_response_closure";
  source_quantity: {
    id: string;
    density_proxy_kg_m3?: number;
    density_equivalent_proxy_kg_m3?: number;
    energy_density_proxy_j_m3?: number;
    power_proxy_w?: number;
    area_proxy_m2?: number;
    power_flux_proxy_w_m2?: number;
    d_eff?: number;
    gain?: number;
  };
  proxies: {
    canonical_channel: CurvatureBridgeChannel;
    canonical_kappa_m2: number;
    kappa_body_m2?: number | null;
    kappa_u_m2?: number | null;
    kappa_drive_m2?: number | null;
    kappa_body_to_canonical_ratio?: number | null;
    kappa_drive_to_canonical_ratio?: number | null;
  };
  stress_energy_bridge: CurvatureStressBridgeOutput;
  note: string;
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

function safeNonnegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function buildBackgroundGeometryFromDensity(args: {
  densityKgM3: number;
  sourceQuantityId: string;
  note: string;
}): ObservableGeometryChannel {
  const densityKgM3 = safeNonnegative(args.densityKgM3);
  const energyDensityProxyJm3 = densityKgM3 * C2;
  const kappaBodyM2 = kappa_body(densityKgM3);
  const kappaCanonicalM2 = kappa_u(energyDensityProxyJm3);
  const stressEnergyBridge = bridgeCurvatureToStressEnergy({
    channel: "kappa_u",
    kappa_m2: kappaCanonicalM2,
    bound_abs_J_m3: Math.max(1e-30, energyDensityProxyJm3),
    mismatch_threshold_rel: 1e-12,
    provenance: {
      class: "diagnostic",
      method: "density_to_energy_density_to_curvature_proxy",
      reference: "collective_observable_response_closure",
    },
    uncertainty: {
      model: "bounded",
      relative_1sigma: 0,
      confidence: 0.95,
    },
  });

  return {
    geometry_slot: "G_geometry",
    role: "background_geometry",
    semantics: "curvature_proxy_observable_response",
    equation_ref: "collective_observable_response_closure",
    source_quantity: {
      id: args.sourceQuantityId,
      density_proxy_kg_m3: densityKgM3,
      energy_density_proxy_j_m3: energyDensityProxyJm3,
    },
    proxies: {
      canonical_channel: "kappa_u",
      canonical_kappa_m2: kappaCanonicalM2,
      kappa_body_m2: kappaBodyM2,
      kappa_u_m2: kappaCanonicalM2,
      kappa_body_to_canonical_ratio: kappaCanonicalM2 > 0 ? kappaBodyM2 / kappaCanonicalM2 : null,
    },
    stress_energy_bridge: stressEnergyBridge,
    note: args.note,
  };
}

export function buildBackgroundGeometryFromEnergyDensity(args: {
  energyDensityJm3: number;
  sourceQuantityId: string;
  note: string;
}): ObservableGeometryChannel {
  const energyDensityJm3 = safeNonnegative(args.energyDensityJm3);
  const densityEquivalentKgM3 = energyDensityJm3 / C2;
  const kappaBodyM2 = kappa_body(densityEquivalentKgM3);
  const kappaCanonicalM2 = kappa_u(energyDensityJm3);
  const stressEnergyBridge = bridgeCurvatureToStressEnergy({
    channel: "kappa_u",
    kappa_m2: kappaCanonicalM2,
    bound_abs_J_m3: Math.max(1e-30, energyDensityJm3),
    mismatch_threshold_rel: 1e-12,
    provenance: {
      class: "diagnostic",
      method: "energy_density_to_curvature_proxy",
      reference: "collective_observable_response_closure",
    },
    uncertainty: {
      model: "bounded",
      relative_1sigma: 0,
      confidence: 0.95,
    },
  });

  return {
    geometry_slot: "G_geometry",
    role: "background_geometry",
    semantics: "curvature_proxy_observable_response",
    equation_ref: "collective_observable_response_closure",
    source_quantity: {
      id: args.sourceQuantityId,
      density_equivalent_proxy_kg_m3: densityEquivalentKgM3,
      energy_density_proxy_j_m3: energyDensityJm3,
    },
    proxies: {
      canonical_channel: "kappa_u",
      canonical_kappa_m2: kappaCanonicalM2,
      kappa_body_m2: kappaBodyM2,
      kappa_u_m2: kappaCanonicalM2,
      kappa_body_to_canonical_ratio: kappaCanonicalM2 > 0 ? kappaBodyM2 / kappaCanonicalM2 : null,
    },
    stress_energy_bridge: stressEnergyBridge,
    note: args.note,
  };
}

export function buildBackgroundGeometryFromBodyKappa(args: {
  kappaBodyM2: number;
  sourceQuantityId: string;
  note: string;
}): ObservableGeometryChannel {
  const kappaBodyM2 = safeNonnegative(args.kappaBodyM2);
  const densityKgM3 = kappaBodyM2 / curvatureProxyPrefactors.body;
  return buildBackgroundGeometryFromDensity({
    densityKgM3,
    sourceQuantityId: args.sourceQuantityId,
    note: args.note,
  });
}

export function buildDynamicForcingGeometryFromPower(args: {
  powerW: number;
  areaM2: number;
  dEff?: number;
  gain?: number;
  sourceQuantityId: string;
  note: string;
}): ObservableGeometryChannel {
  const powerW = safeNonnegative(args.powerW);
  const areaM2 = Number.isFinite(args.areaM2) && args.areaM2 > 0 ? args.areaM2 : 1;
  const dEff = Number.isFinite(args.dEff) ? args.dEff ?? 1 : 1;
  const gain = Number.isFinite(args.gain) ? args.gain ?? 1 : 1;
  const powerFluxWm2 = powerW / areaM2;
  const kappaDriveM2 = kappa_drive_from_power(powerW, areaM2, dEff, gain);
  const energyDensityProxyJm3 = powerFluxWm2 * dEff * gain / C;
  const stressEnergyBridge = bridgeCurvatureToStressEnergy({
    channel: "kappa_drive",
    kappa_m2: kappaDriveM2,
    bound_abs_J_m3: Math.max(1e-30, energyDensityProxyJm3),
    mismatch_threshold_rel: 1e-12,
    provenance: {
      class: "diagnostic",
      method: "power_flux_to_curvature_proxy",
      reference: "collective_observable_response_closure",
    },
    uncertainty: {
      model: "bounded",
      relative_1sigma: 0,
      confidence: 0.95,
    },
  });

  return {
    geometry_slot: "G_geometry",
    role: "dynamic_forcing_geometry",
    semantics: "curvature_proxy_observable_response",
    equation_ref: "collective_observable_response_closure",
    source_quantity: {
      id: args.sourceQuantityId,
      power_proxy_w: powerW,
      area_proxy_m2: areaM2,
      power_flux_proxy_w_m2: powerFluxWm2,
      d_eff: dEff,
      gain,
    },
    proxies: {
      canonical_channel: "kappa_drive",
      canonical_kappa_m2: kappaDriveM2,
      kappa_drive_m2: kappaDriveM2,
      kappa_u_m2: kappa_u(energyDensityProxyJm3),
      kappa_drive_to_canonical_ratio: 1,
    },
    stress_energy_bridge: stressEnergyBridge,
    note: args.note,
  };
}

export function buildDynamicForcingGeometryFromDriveKappa(args: {
  kappaDriveM2: number;
  sourceQuantityId: string;
  note: string;
}): ObservableGeometryChannel {
  const kappaDriveM2 = safeNonnegative(args.kappaDriveM2);
  const powerFluxEquivalentWm2 = kappaDriveM2 / curvatureProxyPrefactors.drive;
  const energyDensityProxyJm3 = powerFluxEquivalentWm2 / C;
  const stressEnergyBridge = bridgeCurvatureToStressEnergy({
    channel: "kappa_drive",
    kappa_m2: kappaDriveM2,
    bound_abs_J_m3: Math.max(1e-30, energyDensityProxyJm3),
    mismatch_threshold_rel: 1e-12,
    provenance: {
      class: "diagnostic",
      method: "drive_kappa_to_curvature_proxy",
      reference: "collective_observable_response_closure",
    },
    uncertainty: {
      model: "bounded",
      relative_1sigma: 0,
      confidence: 0.95,
    },
  });

  return {
    geometry_slot: "G_geometry",
    role: "dynamic_forcing_geometry",
    semantics: "curvature_proxy_observable_response",
    equation_ref: "collective_observable_response_closure",
    source_quantity: {
      id: args.sourceQuantityId,
      power_flux_proxy_w_m2: powerFluxEquivalentWm2,
      d_eff: 1,
      gain: 1,
    },
    proxies: {
      canonical_channel: "kappa_drive",
      canonical_kappa_m2: kappaDriveM2,
      kappa_drive_m2: kappaDriveM2,
      kappa_u_m2: kappa_u(energyDensityProxyJm3),
      kappa_drive_to_canonical_ratio: 1,
    },
    stress_energy_bridge: stressEnergyBridge,
    note: args.note,
  };
}
