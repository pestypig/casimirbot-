import { z } from "zod";
import {
  citationsForStarSimFusionClaims,
  STARSIM_FUSION_CLAIM_IDS,
  type StarSimFusionClaimId,
} from "./starsim-fusion-claims";

export const starSimFusionChannelSchema = z.enum([
  "pp_chain",
  "cno_cycle",
  "triple_alpha",
  "advanced_burning",
  "none",
  "compact_object_not_fusing",
]);

export type StarSimFusionChannel = z.infer<typeof starSimFusionChannelSchema>;

export const starSimObjectClassSchema = z.enum([
  "main_sequence",
  "red_dwarf",
  "red_giant",
  "white_dwarf",
  "neutron_star",
  "brown_dwarf",
  "unknown",
]);

export type StarSimObjectClass = z.infer<typeof starSimObjectClassSchema>;

export const starSimFusionMicrophysicsInputSchema = z.object({
  objectId: z.string().min(1),
  objectClass: starSimObjectClassSchema,
  observables: z.object({
    spectralType: z.string().optional(),
    luminosity_Lsun: z.number().positive().optional(),
    radius_Rsun: z.number().positive().optional(),
    effectiveTemperature_K: z.number().positive().optional(),
    mass_Msun: z.number().positive().optional(),
    metallicity_feh: z.number().optional(),
    logg_cgs: z.number().optional(),
    parallax_mas: z.number().optional(),
    properMotionRa_masyr: z.number().optional(),
    properMotionDec_masyr: z.number().optional(),
    radialVelocity_kms: z.number().optional(),
  }),
  modelMode: z.enum([
    "surface_observable_proxy",
    "polytrope_hydrostatic_proxy",
    "mesa_profile_import",
    "compact_object_glitch_proxy",
  ]),
  qstUse: z.object({
    role: z.enum([
      "stellar_quantum_microphysics_prior",
      "cosmological_structure_prior",
      "not_used",
      "direct_er_epr_evidence",
    ]),
    spacetimeCL: z
      .enum(["proxy_only", "CL0", "CL1", "CL2", "CL3", "CL4"])
      .default("proxy_only"),
    quantumCL: z.enum([
      "QCL0_dimensionless_bookkeeping",
      "QCL1_entropy_stretch_proxy",
    ]),
    mayPromoteToCL4: z.literal(false).catch(false),
  }),
  hSpectralFit: z
    .object({
      mode: z.enum(["blackbody_only", "stellar_atmosphere_model"]),
      fittedH_Js: z.number().positive().optional(),
      atmosphereModel: z.enum(["phoenix", "marcs", "other"]).optional(),
    })
    .optional(),
});

export type StarSimFusionMicrophysicsInput = z.infer<
  typeof starSimFusionMicrophysicsInputSchema
>;

export const starSimFusionMicrophysicsEvaluationSchema = z.object({
  objectId: z.string(),
  inferred: z.object({
    dominantFusionChannel: starSimFusionChannelSchema,
    secondaryFusionChannels: z.array(starSimFusionChannelSchema),
    effectiveTemperature_K: z.number().positive().optional(),
    estimatedCoreTemperature_K: z.number().positive().optional(),
    estimatedCoreDensity_g_cm3: z.number().positive().optional(),
    fusionActive: z.boolean(),
  }),
  fusionZone: z.object({
    mode: z.enum([
      "core_fusion",
      "shell_fusion",
      "distributed_convective_core",
      "compact_object_not_applicable",
      "unknown",
    ]),
    r10_Rstar: z.number().min(0).max(1).optional(),
    r50_Rstar: z.number().min(0).max(1).optional(),
    r90_Rstar: z.number().min(0).max(1).optional(),
    activeVolumeFraction: z.number().min(0).max(1).optional(),
    definition: z.enum(["cumulative_luminosity_fraction", "epsilon_threshold"]),
  }),
  quantumMicrophysics: z.object({
    tunnelingRequired: z.boolean(),
    role: z.enum([
      "microphysical_rate_law",
      "degenerate_compact_object_quantum_fluid",
      "not_applicable",
    ]),
    quantumProcessIndex: z.number().min(0).max(1),
    entropyVisibilityProxy: z.number().min(0).max(1).optional(),
  }),
  hSpectralFit: z
    .object({
      mode: z.enum(["blackbody_only", "stellar_atmosphere_model"]),
      status: z.enum([
        "not_requested",
        "calibration_only",
        "atmosphere_model_supported",
        "blocked_molecular_blackbody_only",
      ]),
      fittedH_Js: z.number().positive().optional(),
      exactH_Js: z.literal(6.62607015e-34),
      caveats: z.array(z.string()),
    })
    .optional(),
  qstPrior: z.object({
    role: z.enum([
      "stellar_quantum_microphysics_prior",
      "cosmological_structure_prior",
      "not_direct_er_epr_evidence",
    ]),
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    caveats: z.array(z.string()).min(1),
    blockedClaims: z.array(z.string()),
  }),
  evidence: z.object({
    stage: z.literal("STARSIM_FUSION_MICROPHYSICS_STAGE1"),
    claimTier: z.literal("Stage1_reduced_order_astrophysical_prior"),
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
  }),
});

export type StarSimFusionMicrophysicsEvaluation = z.infer<
  typeof starSimFusionMicrophysicsEvaluationSchema
>;

const T_SUN_K = 5772;

function startsWithSpectralClass(spectralType: string | undefined, classes: string[]) {
  const normalized = spectralType?.trim().toUpperCase();
  return Boolean(normalized && classes.some((klass) => normalized.startsWith(klass)));
}

function isCoolMolecularSpectrum(spectralType: string | undefined) {
  return startsWithSpectralClass(spectralType, ["M", "L", "T", "Y"]);
}

function effectiveTemperatureFromSurface(input: StarSimFusionMicrophysicsInput) {
  const { effectiveTemperature_K, luminosity_Lsun, radius_Rsun } = input.observables;
  if (effectiveTemperature_K) return effectiveTemperature_K;
  if (luminosity_Lsun && radius_Rsun) {
    return T_SUN_K * Math.pow(luminosity_Lsun / (radius_Rsun * radius_Rsun), 0.25);
  }
  return undefined;
}

function inferDominantChannel(input: StarSimFusionMicrophysicsInput): StarSimFusionChannel {
  const { objectClass, observables } = input;
  const mass = observables.mass_Msun;
  const teff = effectiveTemperatureFromSurface(input);

  if (objectClass === "neutron_star" || objectClass === "white_dwarf") {
    return "compact_object_not_fusing";
  }
  if (objectClass === "brown_dwarf" || (mass !== undefined && mass < 0.075)) {
    return "none";
  }
  if (objectClass === "red_giant") {
    return mass !== undefined && mass >= 1.3 ? "cno_cycle" : "pp_chain";
  }
  if (
    (mass !== undefined && mass >= 1.3) ||
    (teff !== undefined && teff >= 6500) ||
    startsWithSpectralClass(observables.spectralType, ["O", "B", "A"])
  ) {
    return "cno_cycle";
  }
  if (objectClass === "main_sequence" || objectClass === "red_dwarf") {
    return "pp_chain";
  }
  return "none";
}

function estimateCoreTemperatureK(
  input: StarSimFusionMicrophysicsInput,
  channel: StarSimFusionChannel,
) {
  if (channel === "none" || channel === "compact_object_not_fusing") return undefined;
  const mass = input.observables.mass_Msun ?? 1;
  const radius = input.observables.radius_Rsun ?? Math.max(0.1, Math.pow(mass, 0.8));
  const compactnessScale = Math.max(0.2, Math.min(4, mass / radius));
  if (input.objectClass === "red_giant") return 2.2e7 * Math.min(1.5, compactnessScale);
  return (channel === "cno_cycle" ? 2.0e7 : 1.5e7) * compactnessScale;
}

function estimateCoreDensity(
  input: StarSimFusionMicrophysicsInput,
  channel: StarSimFusionChannel,
) {
  if (channel === "none" || channel === "compact_object_not_fusing") return undefined;
  const mass = input.observables.mass_Msun ?? 1;
  const radius = input.observables.radius_Rsun ?? Math.max(0.1, Math.pow(mass, 0.8));
  const densityScale = Math.max(0.05, Math.min(20, mass / Math.pow(radius, 3)));
  if (input.objectClass === "red_giant") return 10 * Math.min(5, densityScale);
  return (channel === "cno_cycle" ? 60 : 150) * densityScale;
}

function fusionZoneFor(
  input: StarSimFusionMicrophysicsInput,
  channel: StarSimFusionChannel,
): StarSimFusionMicrophysicsEvaluation["fusionZone"] {
  if (channel === "none") {
    return { mode: "unknown", definition: "cumulative_luminosity_fraction" };
  }
  if (channel === "compact_object_not_fusing") {
    return {
      mode: "compact_object_not_applicable",
      definition: "cumulative_luminosity_fraction",
    };
  }
  if (input.objectClass === "red_giant") {
    return {
      mode: "shell_fusion",
      r10_Rstar: 0.02,
      r50_Rstar: 0.08,
      r90_Rstar: 0.2,
      activeVolumeFraction: Math.pow(0.2, 3),
      definition: "cumulative_luminosity_fraction",
    };
  }
  if (channel === "cno_cycle") {
    return {
      mode: "distributed_convective_core",
      r10_Rstar: 0.03,
      r50_Rstar: 0.08,
      r90_Rstar: 0.15,
      activeVolumeFraction: Math.pow(0.15, 3),
      definition: "cumulative_luminosity_fraction",
    };
  }
  return {
    mode: "core_fusion",
    r10_Rstar: 0.05,
    r50_Rstar: 0.12,
    r90_Rstar: 0.25,
    activeVolumeFraction: Math.pow(0.25, 3),
    definition: "cumulative_luminosity_fraction",
  };
}

function buildHSpectralFit(
  input: StarSimFusionMicrophysicsInput,
): StarSimFusionMicrophysicsEvaluation["hSpectralFit"] {
  if (!input.hSpectralFit) return undefined;
  const molecularBlocked =
    input.hSpectralFit.mode === "blackbody_only" &&
    isCoolMolecularSpectrum(input.observables.spectralType);
  const status = molecularBlocked
    ? "blocked_molecular_blackbody_only"
    : input.hSpectralFit.mode === "stellar_atmosphere_model"
      ? "atmosphere_model_supported"
      : "calibration_only";
  const caveats = [
    "hSpectralFit is a calibration and inference exercise; the SI value of h is exact.",
  ];
  if (molecularBlocked) {
    caveats.push(
      "Blackbody-only fitting is blocked for molecular-band dominated cool spectra without atmosphere model support.",
    );
  }
  return {
    mode: input.hSpectralFit.mode,
    status,
    fittedH_Js: input.hSpectralFit.fittedH_Js,
    exactH_Js: 6.62607015e-34,
    caveats,
  };
}

export function evaluateStarSimFusionMicrophysics(
  rawInput: StarSimFusionMicrophysicsInput,
): StarSimFusionMicrophysicsEvaluation {
  const input = starSimFusionMicrophysicsInputSchema.parse(rawInput);
  const dominantFusionChannel = inferDominantChannel(input);
  const effectiveTemperature_K = effectiveTemperatureFromSurface(input);
  const fusionActive =
    dominantFusionChannel !== "none" &&
    dominantFusionChannel !== "compact_object_not_fusing";
  const isCompactQuantumObject = input.objectClass === "neutron_star";
  const hSpectralFit = buildHSpectralFit(input);
  const claimIds: StarSimFusionClaimId[] = [
    STARSIM_FUSION_CLAIM_IDS.stellarMicrophysicsNotDirectErEprEvidence,
  ];

  if (effectiveTemperature_K) {
    claimIds.push(STARSIM_FUSION_CLAIM_IDS.stellarEffectiveTemperatureSurfaceProxy);
  }
  if (
    input.modelMode === "polytrope_hydrostatic_proxy" ||
    input.modelMode === "mesa_profile_import"
  ) {
    claimIds.push(STARSIM_FUSION_CLAIM_IDS.stellarStructureHydrostaticEquilibriumProxy);
    claimIds.push(STARSIM_FUSION_CLAIM_IDS.fusionZoneVolumeFromEnergyGeneration);
  }
  if (dominantFusionChannel === "pp_chain") {
    claimIds.push(STARSIM_FUSION_CLAIM_IDS.ppChainFusionRateMicrophysics);
  }
  if (dominantFusionChannel === "cno_cycle") {
    claimIds.push(STARSIM_FUSION_CLAIM_IDS.cnoCycleFusionRateMicrophysics);
  }
  if (hSpectralFit) {
    claimIds.push(STARSIM_FUSION_CLAIM_IDS.stellarSpectralHFitCalibrationOnly);
    if (hSpectralFit.status === "blocked_molecular_blackbody_only") {
      claimIds.push(STARSIM_FUSION_CLAIM_IDS.stellarAtmosphereMolecularOpacityGuardrail);
    }
  }
  if (isCompactQuantumObject || input.modelMode === "compact_object_glitch_proxy") {
    claimIds.push(STARSIM_FUSION_CLAIM_IDS.neutronStarGlitchCompactQuantumFluidProxy);
  }

  const blockedClaims: string[] = [];
  const caveats = [
    "Fusion microphysics is an astrophysical prior, not direct ER=EPR evidence.",
    "StarSim fusion outputs cannot promote QST, Needle Hull, or warp claims to CL0-CL4.",
  ];
  if (input.qstUse.role === "direct_er_epr_evidence") {
    blockedClaims.push("direct_er_epr_evidence");
    caveats.push("StarSim-to-ER=EPR direct-evidence claims are blocked by the Stage 1 claim boundary.");
  }
  if (input.qstUse.spacetimeCL !== "proxy_only") {
    blockedClaims.push(`requested_spacetimeCL_${input.qstUse.spacetimeCL}`);
    caveats.push("Requested spacetime congruence promotion was forced back to proxy_only.");
  }
  if (input.objectClass === "red_giant") {
    caveats.push("Red-giant output uses shell_fusion rather than normal main-sequence core fusion.");
  }
  if (input.modelMode === "surface_observable_proxy") {
    caveats.push("Surface effective temperature does not directly determine core temperature.");
  }
  if (hSpectralFit?.status === "blocked_molecular_blackbody_only") {
    caveats.push("Cool-star molecular opacity requires stellar-atmosphere model support.");
  }

  const dedupedClaimIds = [...new Set(claimIds)];
  return starSimFusionMicrophysicsEvaluationSchema.parse({
    objectId: input.objectId,
    inferred: {
      dominantFusionChannel,
      secondaryFusionChannels:
        input.objectClass === "red_giant" && dominantFusionChannel !== "none"
          ? ["triple_alpha"]
          : [],
      effectiveTemperature_K,
      estimatedCoreTemperature_K: estimateCoreTemperatureK(input, dominantFusionChannel),
      estimatedCoreDensity_g_cm3: estimateCoreDensity(input, dominantFusionChannel),
      fusionActive,
    },
    fusionZone: fusionZoneFor(input, dominantFusionChannel),
    quantumMicrophysics: {
      tunnelingRequired: fusionActive,
      role: fusionActive
        ? "microphysical_rate_law"
        : isCompactQuantumObject || input.modelMode === "compact_object_glitch_proxy"
          ? "degenerate_compact_object_quantum_fluid"
          : "not_applicable",
      quantumProcessIndex: fusionActive
        ? dominantFusionChannel === "cno_cycle"
          ? 0.8
          : 0.65
        : isCompactQuantumObject
          ? 0.55
          : 0,
      entropyVisibilityProxy: fusionActive ? 0.5 : undefined,
    },
    hSpectralFit,
    qstPrior: {
      role:
        input.qstUse.role === "stellar_quantum_microphysics_prior"
          ? "stellar_quantum_microphysics_prior"
          : input.qstUse.role === "cosmological_structure_prior"
            ? "cosmological_structure_prior"
            : "not_direct_er_epr_evidence",
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      caveats,
      blockedClaims,
    },
    evidence: {
      stage: "STARSIM_FUSION_MICROPHYSICS_STAGE1",
      claimTier: "Stage1_reduced_order_astrophysical_prior",
      claimIds: dedupedClaimIds,
      citations: citationsForStarSimFusionClaims(dedupedClaimIds),
    },
  });
}

export const starMapFusionGraphNodeSchema = z.object({
  objectId: z.string().min(1),
  position_pc: z.tuple([z.number(), z.number(), z.number()]),
  velocity_km_s: z.tuple([z.number(), z.number(), z.number()]).optional(),
  spectralType: z.string().optional(),
  mass_Msun: z.number().positive().optional(),
  luminosity_Lsun: z.number().positive().optional(),
  dominantFusionChannel: starSimFusionChannelSchema,
  quantumProcessIndex: z.number().min(0).max(1),
  fusionActiveVolumeFraction: z.number().min(0).max(1).optional(),
});

export type StarMapFusionGraphNode = z.infer<typeof starMapFusionGraphNodeSchema>;

export const starMapFusionGraphSchema = z.object({
  nodes: z.array(starMapFusionGraphNodeSchema),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      distance_pc: z.number().nonnegative(),
      relativeVelocity_km_s: z.number().nonnegative().optional(),
      structureWeight: z.number().min(0),
      fusionContrastWeight: z.number().min(0),
    }),
  ),
  qstRole: z.literal("astrophysical_population_prior"),
  caveat: z.literal("star_map_structure_is_not_direct_er_epr_evidence"),
  claimIds: z.array(z.string()).min(1),
  citations: z.array(z.string()).min(1),
});

export type StarMapFusionGraph = z.infer<typeof starMapFusionGraphSchema>;

function distance3(a: [number, number, number], b: [number, number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function buildStarMapFusionGraph(nodes: StarMapFusionGraphNode[]): StarMapFusionGraph {
  const parsedNodes = z.array(starMapFusionGraphNodeSchema).parse(nodes);
  const edges: StarMapFusionGraph["edges"] = [];
  for (let i = 0; i < parsedNodes.length; i += 1) {
    for (let j = i + 1; j < parsedNodes.length; j += 1) {
      const source = parsedNodes[i];
      const target = parsedNodes[j];
      const distance_pc = distance3(source.position_pc, target.position_pc);
      const relativeVelocity_km_s =
        source.velocity_km_s && target.velocity_km_s
          ? distance3(source.velocity_km_s, target.velocity_km_s)
          : undefined;
      edges.push({
        source: source.objectId,
        target: target.objectId,
        distance_pc,
        relativeVelocity_km_s,
        structureWeight: 1 / (1 + distance_pc),
        fusionContrastWeight: Math.abs(
          source.quantumProcessIndex - target.quantumProcessIndex,
        ),
      });
    }
  }
  const claimIds = [
    STARSIM_FUSION_CLAIM_IDS.astrometricFusionGraphStructurePrior,
    STARSIM_FUSION_CLAIM_IDS.stellarMicrophysicsNotDirectErEprEvidence,
  ];
  return starMapFusionGraphSchema.parse({
    nodes: parsedNodes,
    edges,
    qstRole: "astrophysical_population_prior",
    caveat: "star_map_structure_is_not_direct_er_epr_evidence",
    claimIds,
    citations: citationsForStarSimFusionClaims(claimIds),
  });
}
