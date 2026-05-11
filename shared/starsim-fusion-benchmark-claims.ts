export const STARSIM_FUSION_BENCHMARK_CLAIM_IDS = {
  mesaProfileBenchmarkRequiresMetadata: "mesa_profile_benchmark_requires_metadata.v1",
  stellarProfileLuminosityClosureCheck: "stellar_profile_luminosity_closure_check.v1",
  stellarProfileUncertaintyPropagationRequired:
    "stellar_profile_uncertainty_propagation_required.v1",
  fusionChannelBenchmarkFromIntegratedEps:
    "fusion_channel_benchmark_from_integrated_eps.v1",
  fusionZoneBenchmarkFromCumulativeLuminosity:
    "fusion_zone_benchmark_from_cumulative_luminosity.v1",
  surfaceTeffIsObservableClosureNotCoreTemperature:
    "surface_teff_is_observable_closure_not_core_temperature.v1",
  hSpectralFitBenchmarkCalibrationOnly: "h_spectral_fit_benchmark_calibration_only.v1",
  neutronStarGlitchBenchmarkNotFusion: "neutron_star_glitch_benchmark_not_fusion.v1",
  gaiaPopulationPriorBenchmarkBoundary: "gaia_population_prior_benchmark_boundary.v1",
  starsimFusionBenchmarkNotDirectErEprEvidence:
    "starsim_fusion_benchmark_not_direct_er_epr_evidence.v1",
} as const;

export type StarSimFusionBenchmarkClaimId =
  (typeof STARSIM_FUSION_BENCHMARK_CLAIM_IDS)[keyof typeof STARSIM_FUSION_BENCHMARK_CLAIM_IDS];

export const STARSIM_FUSION_BENCHMARK_CLAIM_SOURCES: Record<
  StarSimFusionBenchmarkClaimId,
  string[]
> = {
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.mesaProfileBenchmarkRequiresMetadata]: [
    "https://arxiv.org/abs/1009.1622",
  ],
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.stellarProfileLuminosityClosureCheck]: [
    "https://arxiv.org/abs/1009.1622",
  ],
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.stellarProfileUncertaintyPropagationRequired]:
    ["https://arxiv.org/abs/2411.00972"],
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.fusionChannelBenchmarkFromIntegratedEps]:
    ["https://arxiv.org/abs/1004.2318"],
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.fusionZoneBenchmarkFromCumulativeLuminosity]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.surfaceTeffIsObservableClosureNotCoreTemperature]:
    ["https://www.astronomy.swin.edu.au/cosmos/E/Effective%2BTemperature"],
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.hSpectralFitBenchmarkCalibrationOnly]: [
    "https://www.nist.gov/si-redefinition/meet-constants",
  ],
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.neutronStarGlitchBenchmarkNotFusion]: [
    "https://academic.oup.com/mnras/article/499/1/161/5901443",
  ],
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.gaiaPopulationPriorBenchmarkBoundary]: [
    "https://www.aanda.org/articles/aa/full_html/2023/06/aa43940-22/aa43940-22.html",
  ],
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.starsimFusionBenchmarkNotDirectErEprEvidence]:
    ["https://arxiv.org/abs/1306.0533"],
};

export const STARSIM_FUSION_BENCHMARK_UNCERTAINTY_NOTES: Record<
  StarSimFusionBenchmarkClaimId,
  string
> = {
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.mesaProfileBenchmarkRequiresMetadata]:
    "Benchmark support depends on profile metadata quality and cannot certify the upstream MESA run by itself.",
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.stellarProfileLuminosityClosureCheck]:
    "Luminosity closure is a diagnostic tolerance, not proof that the imported profile is complete.",
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.stellarProfileUncertaintyPropagationRequired]:
    "Uncertainty propagation is fixture-level unless backed by full profile ensembles or reproduced solver runs.",
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.fusionChannelBenchmarkFromIntegratedEps]:
    "Integrated epsilon channel fractions inherit the imported profile's nuclear network and resolution limits.",
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.fusionZoneBenchmarkFromCumulativeLuminosity]:
    "Fusion-zone radii inherit shell spacing and energy-generation profile resolution.",
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.surfaceTeffIsObservableClosureNotCoreTemperature]:
    "Surface effective temperature is an observable closure check and does not provide core temperature.",
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.hSpectralFitBenchmarkCalibrationOnly]:
    "hSpectralFit is calibration-only because h is exact in the revised SI.",
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.neutronStarGlitchBenchmarkNotFusion]:
    "Neutron-star benchmark context is compact-object dense matter, not PP/CNO fusion.",
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.gaiaPopulationPriorBenchmarkBoundary]:
    "Gaia-like inputs are population-prior context, not direct QST evidence.",
  [STARSIM_FUSION_BENCHMARK_CLAIM_IDS.starsimFusionBenchmarkNotDirectErEprEvidence]:
    "Benchmark support cannot directly establish ER=EPR, propulsion, stress-energy sourcing, or CL0-CL4 evidence.",
};

export function citationsForStarSimFusionBenchmarkClaims(
  claimIds: StarSimFusionBenchmarkClaimId[],
): string[] {
  return [
    ...new Set(
      claimIds.flatMap((claimId) => STARSIM_FUSION_BENCHMARK_CLAIM_SOURCES[claimId]),
    ),
  ];
}

export function uncertaintyNotesForStarSimFusionBenchmarkClaims(
  claimIds: StarSimFusionBenchmarkClaimId[],
): string[] {
  return claimIds.map((claimId) => STARSIM_FUSION_BENCHMARK_UNCERTAINTY_NOTES[claimId]);
}
