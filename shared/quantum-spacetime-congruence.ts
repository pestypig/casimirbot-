import { z } from "zod";

export const PLANCK_LENGTH_M = 1.616255e-35;

export const quantumCongruenceLevelSchema = z.enum([
  "QCL0_dimensionless_bookkeeping",
  "QCL1_entropy_stretch_proxy",
  "QCL2_vacuum_field_channel",
  "QCL3_holographic_area_proxy",
  "QCL4_semiclassical_backreaction_candidate",
]);

export const qstClaimTierSchema = z.enum([
  "diagnostic",
  "toy_model",
  "semiclassical_candidate",
]);

export const qstVacuumModeSchema = z.enum([
  "static_casimir_stress",
  "dynamic_casimir_photon_creation",
  "curved_spacetime_particle_creation",
  "none",
]);

export const qstSpacetimeCLSchema = z.enum(["proxy_only", "CL0", "CL1", "CL2", "CL3", "CL4"]);

export const quantumSpacetimeCongruenceInputSchema = z.object({
  claimTier: qstClaimTierSchema.default("diagnostic"),
  entropyStretch: z.object({
    deltaS_nats: z.number().finite().min(0),
    lambda: z.number().finite().positive().optional(),
    quantumVisibility: z.number().finite().nonnegative().optional(),
  }),
  cosmology: z.object({
    H0_sInv: z.number().finite().positive().optional(),
    scaleFactorRatio: z.number().finite().positive().optional(),
    redshift: z.number().finite().min(0).optional(),
    horizonEntropyProxy: z.number().finite().nonnegative().optional(),
  }).default({}),
  holographicProxy: z.object({
    erEprEligible: z.boolean().default(false),
    entanglementEntropy_nats: z.number().finite().nonnegative().optional(),
    regionArea_m2: z.number().finite().positive().optional(),
  }).default({ erEprEligible: false }),
  vacuumChannel: z.object({
    mode: qstVacuumModeSchema.default("none"),
    localDriveFrequency_Hz: z.number().finite().positive().optional(),
    expansionFrequency_Hz: z.number().finite().positive().optional(),
    modelEvidenceRef: z.string().min(1).optional(),
  }).default({ mode: "none" }),
  congruenceGate: z.object({
    spacetimeCL: qstSpacetimeCLSchema.default("proxy_only"),
    quantumCL: quantumCongruenceLevelSchema.default("QCL1_entropy_stretch_proxy"),
  }).default({ spacetimeCL: "proxy_only", quantumCL: "QCL1_entropy_stretch_proxy" }),
});

export type QuantumCongruenceLevel = z.infer<typeof quantumCongruenceLevelSchema>;
export type QuantumSpacetimeCongruenceInput = z.input<typeof quantumSpacetimeCongruenceInputSchema>;
export type ParsedQuantumSpacetimeCongruenceInput = z.output<typeof quantumSpacetimeCongruenceInputSchema>;

export type QuantumSpacetimeCongruence = ParsedQuantumSpacetimeCongruenceInput & {
  entropyStretch: ParsedQuantumSpacetimeCongruenceInput["entropyStretch"] & {
    lambda: number;
    hbarEffectiveRatio: number;
    quantumVisibility: number;
  };
  cosmology: ParsedQuantumSpacetimeCongruenceInput["cosmology"] & {
    scaleFactorRatio?: number;
    areaStretch?: number;
    volumeStretch?: number;
  };
  holographicProxy: ParsedQuantumSpacetimeCongruenceInput["holographicProxy"] & {
    rtAreaProxy_m2?: number;
    erDensityProxy?: number;
    caveat: "not_a_wormhole_count";
  };
  congruenceGate: ParsedQuantumSpacetimeCongruenceInput["congruenceGate"] & {
    edgeType: "holographic_entropy_proxy";
    mayPromoteToCL4: false;
    unsupportedCausalLinks: string[];
  };
};

export type QuantumSpacetimeCongruenceScore = {
  C_QST: number;
  P_entropy: number;
  P_vacuum: number;
  P_holographic: number;
  unsupportedCausalLinks: string[];
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const hbarEffectiveRatioFromEntropyStretch = (lambda: number): number => 1 / lambda;

export const entropyStretchLambdaFromDeltaS = (deltaS_nats: number): number => Math.exp(deltaS_nats);

export const rtAreaProxyM2 = (entanglementEntropy_nats: number): number =>
  4 * PLANCK_LENGTH_M ** 2 * entanglementEntropy_nats;

export function buildQuantumSpacetimeCongruence(
  input: QuantumSpacetimeCongruenceInput,
): QuantumSpacetimeCongruence {
  const parsed = quantumSpacetimeCongruenceInputSchema.parse(input);
  const lambda = parsed.entropyStretch.lambda ?? entropyStretchLambdaFromDeltaS(parsed.entropyStretch.deltaS_nats);
  const hbarEffectiveRatio = hbarEffectiveRatioFromEntropyStretch(lambda);
  const quantumVisibility = parsed.entropyStretch.quantumVisibility ?? hbarEffectiveRatio;
  const scaleFactorRatio = parsed.cosmology.scaleFactorRatio ?? (
    parsed.cosmology.redshift !== undefined ? 1 + parsed.cosmology.redshift : undefined
  );
  const rtArea = parsed.holographicProxy.entanglementEntropy_nats !== undefined
    ? rtAreaProxyM2(parsed.holographicProxy.entanglementEntropy_nats)
    : undefined;
  const erDensityProxy = parsed.holographicProxy.erEprEligible &&
    rtArea !== undefined &&
    parsed.holographicProxy.regionArea_m2 !== undefined
    ? rtArea / parsed.holographicProxy.regionArea_m2
    : undefined;
  const unsupportedCausalLinks = collectUnsupportedQstCausalLinks(parsed);

  return {
    ...parsed,
    entropyStretch: {
      ...parsed.entropyStretch,
      lambda,
      hbarEffectiveRatio,
      quantumVisibility,
    },
    cosmology: {
      ...parsed.cosmology,
      scaleFactorRatio,
      areaStretch: scaleFactorRatio !== undefined ? scaleFactorRatio ** 2 : undefined,
      volumeStretch: scaleFactorRatio !== undefined ? scaleFactorRatio ** 3 : undefined,
    },
    holographicProxy: {
      ...parsed.holographicProxy,
      rtAreaProxy_m2: rtArea,
      erDensityProxy,
      caveat: "not_a_wormhole_count",
    },
    congruenceGate: {
      ...parsed.congruenceGate,
      spacetimeCL: "proxy_only",
      edgeType: "holographic_entropy_proxy",
      mayPromoteToCL4: false,
      unsupportedCausalLinks,
    },
  };
}

export function collectUnsupportedQstCausalLinks(
  input: ParsedQuantumSpacetimeCongruenceInput,
): string[] {
  const unsupported: string[] = [];
  if (
    input.vacuumChannel.mode === "dynamic_casimir_photon_creation" &&
    input.vacuumChannel.expansionFrequency_Hz !== undefined &&
    input.vacuumChannel.localDriveFrequency_Hz === undefined
  ) {
    unsupported.push("H0_to_local_virtual_photon_production_rate");
  }
  if (
    input.holographicProxy.erEprEligible &&
    input.holographicProxy.entanglementEntropy_nats !== undefined &&
    input.holographicProxy.regionArea_m2 === undefined
  ) {
    unsupported.push("entanglement_area_proxy_without_region_area");
  }
  if (input.congruenceGate.spacetimeCL !== "proxy_only") {
    unsupported.push("qst_proxy_to_spacetime_CL_promotion");
  }
  return unsupported;
}

export function evaluateQuantumSpacetimeCongruenceScore(
  qstInput: QuantumSpacetimeCongruenceInput,
  options: { base?: number; beta?: number } = {},
): QuantumSpacetimeCongruenceScore {
  const qst = buildQuantumSpacetimeCongruence(qstInput);
  const base = options.base ?? 1;
  const beta = options.beta ?? 1;
  const P_entropy = 1 / (1 + beta * Math.max(0, qst.entropyStretch.lambda - 1));
  const P_holographic = qst.holographicProxy.erEprEligible
    ? clamp01(qst.holographicProxy.erDensityProxy ?? 0)
    : 0;
  const P_vacuum = resolveVacuumPenalty(qst);

  return {
    C_QST: base * P_entropy * P_vacuum * P_holographic,
    P_entropy,
    P_vacuum,
    P_holographic,
    unsupportedCausalLinks: qst.congruenceGate.unsupportedCausalLinks,
  };
}

function resolveVacuumPenalty(qst: QuantumSpacetimeCongruence): number {
  switch (qst.vacuumChannel.mode) {
    case "static_casimir_stress":
      return 1;
    case "dynamic_casimir_photon_creation":
      return qst.vacuumChannel.localDriveFrequency_Hz !== undefined &&
        !qst.congruenceGate.unsupportedCausalLinks.includes("H0_to_local_virtual_photon_production_rate")
        ? 1
        : 0;
    case "curved_spacetime_particle_creation":
      return qst.vacuumChannel.modelEvidenceRef ? 1 : 0;
    case "none":
      return 0;
  }
}
