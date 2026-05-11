export const STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS = {
  mesaExternalReproductionRequiresInlistAndProfileHash:
    "mesa_external_reproduction_requires_inlist_and_profile_hash.v1",
  solarAnchorRequiresNeutrinoClosure: "solar_anchor_requires_neutrino_closure.v1",
  solarNeutrinoPpChainObservationalProbe:
    "solar_neutrino_pp_chain_observational_probe.v1",
  gyreAsteroseismicClosureModelComparison:
    "gyre_asteroseismic_closure_model_comparison.v1",
  stellarProfileStage2GateRequiresUncertainty:
    "stellar_profile_stage2_gate_requires_uncertainty.v1",
  stellarProfileStage2GateNotCertification:
    "stellar_profile_stage2_gate_not_certification.v1",
  hSpectralFitStage2GateCalibrationOnly:
    "h_spectral_fit_stage2_gate_calibration_only.v1",
  neutronStarStage2GateCompactObjectOnly:
    "neutron_star_stage2_gate_compact_object_only.v1",
  gaiaPopulationPriorStage2Boundary: "gaia_population_prior_stage2_boundary.v1",
  starsimFusionStage2GateNotDirectErEprEvidence:
    "starsim_fusion_stage2_gate_not_direct_er_epr_evidence.v1",
} as const;

export type StarSimFusionStage2GateClaimId =
  (typeof STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS)[keyof typeof STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS];

export const STARSIM_FUSION_STAGE2_GATE_CLAIM_SOURCES: Record<
  StarSimFusionStage2GateClaimId,
  string[]
> = {
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.mesaExternalReproductionRequiresInlistAndProfileHash]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.solarAnchorRequiresNeutrinoClosure]: [
    "https://www.nature.com/articles/s41586-018-0624-y",
  ],
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.solarNeutrinoPpChainObservationalProbe]:
    ["https://www.nature.com/articles/s41586-018-0624-y"],
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.gyreAsteroseismicClosureModelComparison]:
    [
      "https://academic.oup.com/mnras/article/435/4/3406/1033475",
      "https://gyre.readthedocs.io/en/stable/index.html",
    ],
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.stellarProfileStage2GateRequiresUncertainty]:
    ["https://arxiv.org/abs/2411.00972"],
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.stellarProfileStage2GateNotCertification]:
    ["https://arxiv.org/abs/1009.1622"],
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.hSpectralFitStage2GateCalibrationOnly]:
    ["https://www.nist.gov/si-redefinition/meet-constants"],
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.neutronStarStage2GateCompactObjectOnly]:
    ["https://academic.oup.com/mnras/article/499/1/161/5901443"],
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.gaiaPopulationPriorStage2Boundary]:
    ["https://www.aanda.org/articles/aa/full_html/2023/06/aa43940-22/aa43940-22.html"],
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.starsimFusionStage2GateNotDirectErEprEvidence]:
    ["https://arxiv.org/abs/1306.0533"],
};

export const STARSIM_FUSION_STAGE2_GATE_UNCERTAINTY_NOTES: Record<
  StarSimFusionStage2GateClaimId,
  string
> = {
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.mesaExternalReproductionRequiresInlistAndProfileHash]:
    "External reproduction evidence depends on solver input hashes, profile hashes, and retained model metadata.",
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.solarAnchorRequiresNeutrinoClosure]:
    "Solar-anchor readiness depends on explicit core-sensitive observational closure, not surface observables alone.",
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.solarNeutrinoPpChainObservationalProbe]:
    "Solar neutrino residuals inherit composition, opacity, reaction-rate, and flavor-conversion assumptions.",
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.gyreAsteroseismicClosureModelComparison]:
    "Asteroseismic closure depends on imported mode summaries and does not certify the upstream pulsation calculation.",
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.stellarProfileStage2GateRequiresUncertainty]:
    "Stage 2 gate review requires uncertainty notes and cannot treat one deterministic profile as a population proof.",
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.stellarProfileStage2GateNotCertification]:
    "Ready-for-review is a gate verdict and not a maturity promotion.",
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.hSpectralFitStage2GateCalibrationOnly]:
    "hSpectralFit remains calibration-only because h is exact in the revised SI.",
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.neutronStarStage2GateCompactObjectOnly]:
    "Neutron-star context remains compact-object dense matter and not PP/CNO fusion closure.",
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.gaiaPopulationPriorStage2Boundary]:
    "Gaia-like structure inputs remain population-prior context and not direct quantum-spacetime evidence.",
  [STARSIM_FUSION_STAGE2_GATE_CLAIM_IDS.starsimFusionStage2GateNotDirectErEprEvidence]:
    "The gate cannot establish ER=EPR, local bridge counts, propulsion, stress-energy sourcing, or CL0-CL4 evidence.",
};

export function citationsForStarSimFusionStage2GateClaims(
  claimIds: StarSimFusionStage2GateClaimId[],
): string[] {
  return [
    ...new Set(
      claimIds.flatMap((claimId) => STARSIM_FUSION_STAGE2_GATE_CLAIM_SOURCES[claimId]),
    ),
  ];
}

export function uncertaintyNotesForStarSimFusionStage2GateClaims(
  claimIds: StarSimFusionStage2GateClaimId[],
): string[] {
  return claimIds.map((claimId) => STARSIM_FUSION_STAGE2_GATE_UNCERTAINTY_NOTES[claimId]);
}
