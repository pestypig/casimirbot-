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
