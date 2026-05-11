export const STARSIM_SOLAR_REFERENCE_CLAIM_IDS = {
  solarReferenceRunRequiresSolverMetadata:
    "solar_reference_run_requires_solver_metadata.v1",
  solarReferenceRunFixtureNotExternalReproduction:
    "solar_reference_run_fixture_not_external_reproduction.v1",
  mesaSolarProfileReproductionContext: "mesa_solar_profile_reproduction_context.v1",
  solarPpChainCrossSectionsContext: "solar_pp_chain_cross_sections_context.v1",
  borexinoNeutrinoClosureContext: "borexino_neutrino_closure_context.v1",
  gyreSolarOscillationSummaryContext: "gyre_solar_oscillation_summary_context.v1",
  solarReferenceRunNotErEprEvidence: "solar_reference_run_not_er_epr_evidence.v1",
  solarReferenceRunProxyOnlyQstBoundary:
    "solar_reference_run_proxy_only_qst_boundary.v1",
  hSpectralFitSolarReferenceCalibrationOnly:
    "h_spectral_fit_solar_reference_calibration_only.v1",
} as const;

export type StarSimSolarReferenceClaimId =
  (typeof STARSIM_SOLAR_REFERENCE_CLAIM_IDS)[keyof typeof STARSIM_SOLAR_REFERENCE_CLAIM_IDS];

export const STARSIM_SOLAR_REFERENCE_CLAIM_SOURCES: Record<
  StarSimSolarReferenceClaimId,
  string[]
> = {
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunRequiresSolverMetadata]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunFixtureNotExternalReproduction]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.mesaSolarProfileReproductionContext]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarPpChainCrossSectionsContext]:
    ["https://arxiv.org/abs/1004.2318"],
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.borexinoNeutrinoClosureContext]:
    ["https://www.nature.com/articles/s41586-018-0624-y"],
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.gyreSolarOscillationSummaryContext]:
    ["https://academic.oup.com/mnras/article/435/4/3406/1033475"],
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunNotErEprEvidence]:
    ["https://arxiv.org/abs/1306.0533"],
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunProxyOnlyQstBoundary]:
    ["https://arxiv.org/abs/2411.00972"],
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.hSpectralFitSolarReferenceCalibrationOnly]:
    ["https://www.nist.gov/si-redefinition/meet-constants"],
};

export const STARSIM_SOLAR_REFERENCE_UNCERTAINTY_NOTES: Record<
  StarSimSolarReferenceClaimId,
  string
> = {
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunRequiresSolverMetadata]:
    "Solar reference runs require solver fingerprints before they can be treated as solver-backed.",
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunFixtureNotExternalReproduction]:
    "Fixture-only runs are useful regression artifacts but are not external reproduction.",
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.mesaSolarProfileReproductionContext]:
    "MESA profile fidelity depends on inlist, physics options, network, opacity, EOS, and age calibration.",
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarPpChainCrossSectionsContext]:
    "PP-chain and CNO closure inherit nuclear reaction-rate and solar composition uncertainties.",
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.borexinoNeutrinoClosureContext]:
    "Neutrino closure residuals depend on solar model choices and neutrino flavor-conversion assumptions.",
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.gyreSolarOscillationSummaryContext]:
    "GYRE summary closure depends on imported mode summaries and does not certify a full pulsation run.",
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunNotErEprEvidence]:
    "Solar reference fidelity cannot directly establish ER=EPR or QST metric evidence.",
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.solarReferenceRunProxyOnlyQstBoundary]:
    "QST use remains proxy-only and cannot promote CL0-CL4 claims.",
  [STARSIM_SOLAR_REFERENCE_CLAIM_IDS.hSpectralFitSolarReferenceCalibrationOnly]:
    "hSpectralFit remains calibration-only because h is exact in the revised SI.",
};

export function citationsForStarSimSolarReferenceClaims(
  claimIds: StarSimSolarReferenceClaimId[],
): string[] {
  return [
    ...new Set(
      claimIds.flatMap((claimId) => STARSIM_SOLAR_REFERENCE_CLAIM_SOURCES[claimId]),
    ),
  ];
}

export function uncertaintyNotesForStarSimSolarReferenceClaims(
  claimIds: StarSimSolarReferenceClaimId[],
): string[] {
  return claimIds.map((claimId) => STARSIM_SOLAR_REFERENCE_UNCERTAINTY_NOTES[claimId]);
}
