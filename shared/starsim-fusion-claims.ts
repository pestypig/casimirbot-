export const STARSIM_FUSION_CLAIM_IDS = {
  stellarEffectiveTemperatureSurfaceProxy:
    "stellar_effective_temperature_surface_proxy.v1",
  stellarStructureHydrostaticEquilibriumProxy:
    "stellar_structure_hydrostatic_equilibrium_proxy.v1",
  ppChainFusionRateMicrophysics: "pp_chain_fusion_rate_microphysics.v1",
  cnoCycleFusionRateMicrophysics: "cno_cycle_fusion_rate_microphysics.v1",
  fusionZoneVolumeFromEnergyGeneration:
    "fusion_zone_volume_from_energy_generation.v1",
  stellarSpectralHFitCalibrationOnly:
    "stellar_spectral_h_fit_calibration_only.v1",
  stellarAtmosphereMolecularOpacityGuardrail:
    "stellar_atmosphere_molecular_opacity_guardrail.v1",
  astrometricFusionGraphStructurePrior:
    "astrometric_fusion_graph_structure_prior.v1",
  neutronStarGlitchCompactQuantumFluidProxy:
    "neutron_star_glitch_compact_quantum_fluid_proxy.v1",
  stellarMicrophysicsNotDirectErEprEvidence:
    "stellar_microphysics_not_direct_er_epr_evidence.v1",
} as const;

export type StarSimFusionClaimId =
  (typeof STARSIM_FUSION_CLAIM_IDS)[keyof typeof STARSIM_FUSION_CLAIM_IDS];

export const STARSIM_FUSION_CLAIM_SOURCES: Record<StarSimFusionClaimId, string[]> = {
  [STARSIM_FUSION_CLAIM_IDS.stellarEffectiveTemperatureSurfaceProxy]: [
    "https://www.astronomy.swin.edu.au/cosmos/E/Effective%2BTemperature",
  ],
  [STARSIM_FUSION_CLAIM_IDS.stellarStructureHydrostaticEquilibriumProxy]: [
    "https://scixplorer.org/abs/2011ApJS..192....3P/abstract",
  ],
  [STARSIM_FUSION_CLAIM_IDS.ppChainFusionRateMicrophysics]: [
    "https://www.osti.gov/biblio/1013019",
  ],
  [STARSIM_FUSION_CLAIM_IDS.cnoCycleFusionRateMicrophysics]: [
    "https://www.osti.gov/biblio/1013019",
  ],
  [STARSIM_FUSION_CLAIM_IDS.fusionZoneVolumeFromEnergyGeneration]: [
    "https://scixplorer.org/abs/2011ApJS..192....3P/abstract",
  ],
  [STARSIM_FUSION_CLAIM_IDS.stellarSpectralHFitCalibrationOnly]: [
    "https://www.nist.gov/si-redefinition/meet-constants",
  ],
  [STARSIM_FUSION_CLAIM_IDS.stellarAtmosphereMolecularOpacityGuardrail]: [
    "https://www.aanda.org/articles/aa/full_html/2013/05/aa19058-12/aa19058-12.html",
  ],
  [STARSIM_FUSION_CLAIM_IDS.astrometricFusionGraphStructurePrior]: [
    "https://www.aanda.org/articles/aa/full_html/2023/06/aa43940-22/aa43940-22.html",
  ],
  [STARSIM_FUSION_CLAIM_IDS.neutronStarGlitchCompactQuantumFluidProxy]: [
    "https://academic.oup.com/mnras/article/499/1/161/5901443",
  ],
  [STARSIM_FUSION_CLAIM_IDS.stellarMicrophysicsNotDirectErEprEvidence]: [
    "https://arxiv.org/abs/1306.0533",
    "https://arxiv.org/abs/2411.00972",
  ],
};

export type StarSimFusionSourceRole =
  | "supports_model"
  | "supports_guardrail"
  | "supports_boundary"
  | "supports_context";

export type StarSimFusionSourceReference = {
  id: string;
  title: string;
  url: string;
  note: string;
};

export type StarSimFusionValidityDomain = {
  system: string;
  constraints: string[];
};

export const STARSIM_FUSION_SOURCE_REFERENCES = {
  effectiveTemperature: {
    id: "swimburne-cosmos-effective-temperature",
    title: "Effective Temperature",
    url: "https://www.astronomy.swin.edu.au/cosmos/E/Effective%2BTemperature",
    note: "Reference for the Stefan-Boltzmann surface effective-temperature relation.",
  },
  mesa: {
    id: "paxton-2011-mesa",
    title: "Modules for Experiments in Stellar Astrophysics (MESA)",
    url: "https://arxiv.org/abs/1009.1622",
    note: "Primary MESA reference for one-dimensional stellar evolution and structure modeling.",
  },
  solarFusionCrossSections: {
    id: "adelberger-2011-solar-fusion-cross-sections",
    title: "Solar fusion cross sections II: the pp chain and CNO cycles",
    url: "https://arxiv.org/abs/1004.2318",
    note: "Reference for pp-chain and CNO-cycle cross sections in hydrogen-burning stars.",
  },
  nistPlanckConstant: {
    id: "nist-revised-si-planck-constant",
    title: "Meet the Constants",
    url: "https://www.nist.gov/si-redefinition/meet-constants",
    note: "NIST reference for the exact revised-SI value of the Planck constant.",
  },
  phoenixAtmospheres: {
    id: "husser-2013-phoenix-library",
    title: "A new extensive library of PHOENIX stellar atmospheres and synthetic spectra",
    url: "https://www.aanda.org/articles/aa/full_html/2013/05/aa19058-12/aa19058-12.html",
    note: "Reference for high-resolution synthetic stellar spectra and atmosphere-model support.",
  },
  gaiaDr3: {
    id: "gaia-dr3-summary",
    title: "Gaia Data Release 3: Summary of the content and survey properties",
    url: "https://www.aanda.org/articles/aa/full_html/2023/06/aa43940-22/aa43940-22.html",
    note: "Reference for Gaia DR3 astrometry, photometry, radial velocities, and source characterization.",
  },
  neutronStarGlitches: {
    id: "khomenko-2020-pinned-superfluids",
    title: "Turbulent, pinned superfluids in neutron stars and pulsar glitch recoveries",
    url: "https://academic.oup.com/mnras/article/499/1/161/5901443",
    note: "Reference for pinned/turbulent superfluid context in neutron-star glitch recovery models.",
  },
  erEprBoundary: {
    id: "maldacena-susskind-2013-er-epr",
    title: "Cool horizons for entangled black holes",
    url: "https://arxiv.org/abs/1306.0533",
    note: "ER=EPR boundary context; does not make stellar fusion direct ER=EPR evidence.",
  },
  entropyVisibility: {
    id: "carcassi-landini-aidala-2024-high-entropy-limit",
    title: "Classical mechanics as the high-entropy limit of quantum mechanics",
    url: "https://arxiv.org/abs/2411.00972",
    note: "Reference for high entropy masking quantum effects in diagnostic QST bookkeeping.",
  },
} as const satisfies Record<string, StarSimFusionSourceReference>;

export const STARSIM_FUSION_CLAIM_SOURCE_ROLES: Record<
  StarSimFusionClaimId,
  StarSimFusionSourceRole
> = {
  [STARSIM_FUSION_CLAIM_IDS.stellarEffectiveTemperatureSurfaceProxy]:
    "supports_model",
  [STARSIM_FUSION_CLAIM_IDS.stellarStructureHydrostaticEquilibriumProxy]:
    "supports_model",
  [STARSIM_FUSION_CLAIM_IDS.ppChainFusionRateMicrophysics]: "supports_model",
  [STARSIM_FUSION_CLAIM_IDS.cnoCycleFusionRateMicrophysics]: "supports_model",
  [STARSIM_FUSION_CLAIM_IDS.fusionZoneVolumeFromEnergyGeneration]:
    "supports_model",
  [STARSIM_FUSION_CLAIM_IDS.stellarSpectralHFitCalibrationOnly]:
    "supports_guardrail",
  [STARSIM_FUSION_CLAIM_IDS.stellarAtmosphereMolecularOpacityGuardrail]:
    "supports_guardrail",
  [STARSIM_FUSION_CLAIM_IDS.astrometricFusionGraphStructurePrior]:
    "supports_context",
  [STARSIM_FUSION_CLAIM_IDS.neutronStarGlitchCompactQuantumFluidProxy]:
    "supports_context",
  [STARSIM_FUSION_CLAIM_IDS.stellarMicrophysicsNotDirectErEprEvidence]:
    "supports_boundary",
};

export const STARSIM_FUSION_CLAIM_UNCERTAINTY_NOTES: Record<
  StarSimFusionClaimId,
  string
> = {
  [STARSIM_FUSION_CLAIM_IDS.stellarEffectiveTemperatureSurfaceProxy]:
    "Effective temperature is a surface observable relation and cannot determine core conditions without a stellar-structure model.",
  [STARSIM_FUSION_CLAIM_IDS.stellarStructureHydrostaticEquilibriumProxy]:
    "Reduced-order structure estimates are priors; stronger claims require a solver or imported stellar profile.",
  [STARSIM_FUSION_CLAIM_IDS.ppChainFusionRateMicrophysics]:
    "PP-chain classification is a channel prior and does not encode detailed reaction-network uncertainties.",
  [STARSIM_FUSION_CLAIM_IDS.cnoCycleFusionRateMicrophysics]:
    "CNO-cycle classification is a channel prior sensitive to mass, temperature, metallicity, and evolutionary state.",
  [STARSIM_FUSION_CLAIM_IDS.fusionZoneVolumeFromEnergyGeneration]:
    "Stage 1 fusion-zone radii are reduced-order metadata unless backed by an imported energy-generation profile.",
  [STARSIM_FUSION_CLAIM_IDS.stellarSpectralHFitCalibrationOnly]:
    "Spectral h fitting is calibration bookkeeping; the Planck constant is exact in the revised SI.",
  [STARSIM_FUSION_CLAIM_IDS.stellarAtmosphereMolecularOpacityGuardrail]:
    "Cool-star spectral inference needs atmosphere-model support because molecular opacity can dominate blackbody residuals.",
  [STARSIM_FUSION_CLAIM_IDS.astrometricFusionGraphStructurePrior]:
    "Star-map graph structure is an ordinary astrometric and population prior, not quantum-gravity evidence.",
  [STARSIM_FUSION_CLAIM_IDS.neutronStarGlitchCompactQuantumFluidProxy]:
    "Neutron-star glitch context is compact-object dense-matter physics and should not be mapped to stellar fusion rates.",
  [STARSIM_FUSION_CLAIM_IDS.stellarMicrophysicsNotDirectErEprEvidence]:
    "Stellar microphysics can inform QST context but cannot directly establish ER=EPR, physical bridge inventories, or propulsion claims.",
};

export const STARSIM_FUSION_CLAIM_VALIDITY_DOMAINS: Record<
  StarSimFusionClaimId,
  StarSimFusionValidityDomain
> = {
  [STARSIM_FUSION_CLAIM_IDS.stellarEffectiveTemperatureSurfaceProxy]: {
    system: "stellar surface observable proxy",
    constraints: ["surface proxy only", "not a core-temperature solver", "proxy-only"],
  },
  [STARSIM_FUSION_CLAIM_IDS.stellarStructureHydrostaticEquilibriumProxy]: {
    system: "reduced-order stellar structure and profile import",
    constraints: ["requires model assumptions", "MESA/imported profiles preferred", "proxy-only"],
  },
  [STARSIM_FUSION_CLAIM_IDS.ppChainFusionRateMicrophysics]: {
    system: "normal lower-mass hydrogen-burning stars",
    constraints: ["reduced-order channel classification", "not a full reaction network", "proxy-only"],
  },
  [STARSIM_FUSION_CLAIM_IDS.cnoCycleFusionRateMicrophysics]: {
    system: "hotter or higher-mass hydrogen-burning stars",
    constraints: ["reduced-order channel classification", "metallicity sensitive", "proxy-only"],
  },
  [STARSIM_FUSION_CLAIM_IDS.fusionZoneVolumeFromEnergyGeneration]: {
    system: "stellar nuclear energy-generation profiles",
    constraints: ["profile metadata required for high confidence", "not whole-star volume", "proxy-only"],
  },
  [STARSIM_FUSION_CLAIM_IDS.stellarSpectralHFitCalibrationOnly]: {
    system: "spectral calibration diagnostics",
    constraints: ["calibration only", "does not vary h", "proxy-only"],
  },
  [STARSIM_FUSION_CLAIM_IDS.stellarAtmosphereMolecularOpacityGuardrail]: {
    system: "cool-star molecular-band spectral inference",
    constraints: ["blackbody-only fits are surface proxies", "atmosphere support required", "proxy-only"],
  },
  [STARSIM_FUSION_CLAIM_IDS.astrometricFusionGraphStructurePrior]: {
    system: "Gaia-like astrometric stellar population graph",
    constraints: ["ordinary structure prior only", "not direct ER=EPR evidence", "proxy-only"],
  },
  [STARSIM_FUSION_CLAIM_IDS.neutronStarGlitchCompactQuantumFluidProxy]: {
    system: "neutron-star compact-object diagnostics",
    constraints: ["not fusion", "dense-matter context only", "proxy-only"],
  },
  [STARSIM_FUSION_CLAIM_IDS.stellarMicrophysicsNotDirectErEprEvidence]: {
    system: "StarSim to QST boundary",
    constraints: ["not direct ER=EPR evidence", "no CL0-CL4 promotion", "proxy-only"],
  },
};

export function citationsForStarSimFusionClaims(
  claimIds: StarSimFusionClaimId[],
): string[] {
  return [...new Set(claimIds.flatMap((claimId) => STARSIM_FUSION_CLAIM_SOURCES[claimId]))];
}

export function sourceRolesForStarSimFusionClaims(
  claimIds: StarSimFusionClaimId[],
): Record<StarSimFusionClaimId, StarSimFusionSourceRole> {
  return Object.fromEntries(
    claimIds.map((claimId) => [claimId, STARSIM_FUSION_CLAIM_SOURCE_ROLES[claimId]]),
  ) as Record<StarSimFusionClaimId, StarSimFusionSourceRole>;
}

export function uncertaintyNotesForStarSimFusionClaims(
  claimIds: StarSimFusionClaimId[],
): string[] {
  return claimIds.map((claimId) => STARSIM_FUSION_CLAIM_UNCERTAINTY_NOTES[claimId]);
}

export function validityDomainsForStarSimFusionClaims(
  claimIds: StarSimFusionClaimId[],
): Record<StarSimFusionClaimId, StarSimFusionValidityDomain> {
  return Object.fromEntries(
    claimIds.map((claimId) => [claimId, STARSIM_FUSION_CLAIM_VALIDITY_DOMAINS[claimId]]),
  ) as Record<StarSimFusionClaimId, StarSimFusionValidityDomain>;
}
