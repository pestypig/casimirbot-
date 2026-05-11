import {
  STARSIM_FUSION_SOURCE_REFERENCES,
  type StarSimFusionSourceReference,
} from "./starsim-fusion-claims";

export const STARSIM_FUSION_PROFILE_CLAIM_IDS = {
  mesaProfileImportProfileValidation: "mesa_profile_import_profile_validation.v1",
  fusionLuminosityMassShellIntegration:
    "fusion_luminosity_mass_shell_integration.v1",
  fusionChannelFractionFromIntegratedEps:
    "fusion_channel_fraction_from_integrated_eps.v1",
  fusionZoneRadiiFromCumulativeLuminosity:
    "fusion_zone_radii_from_cumulative_luminosity.v1",
  surfaceLuminosityNotIdenticalToNuclearLuminosityGuardrail:
    "surface_luminosity_not_identical_to_nuclear_luminosity_guardrail.v1",
  neutronStarProfileNotFusionProfile: "neutron_star_profile_not_fusion_profile.v1",
  hSpectralFitCalibrationOnlyExactSiGuardrail:
    "h_spectral_fit_calibration_only_exact_si_guardrail.v1",
  gaiaStarmapPopulationPriorOnly: "gaia_starmap_population_prior_only.v1",
  starsimProfileImportNotDirectErEprEvidence:
    "starsim_profile_import_not_direct_er_epr_evidence.v1",
} as const;

export type StarSimFusionProfileClaimId =
  (typeof STARSIM_FUSION_PROFILE_CLAIM_IDS)[keyof typeof STARSIM_FUSION_PROFILE_CLAIM_IDS];

export const STARSIM_FUSION_PROFILE_SOURCE_REFERENCES = {
  mesa: STARSIM_FUSION_SOURCE_REFERENCES.mesa,
  solarFusionCrossSections: STARSIM_FUSION_SOURCE_REFERENCES.solarFusionCrossSections,
  nistPlanckConstant: STARSIM_FUSION_SOURCE_REFERENCES.nistPlanckConstant,
  gaiaDr3: STARSIM_FUSION_SOURCE_REFERENCES.gaiaDr3,
  neutronStarGlitches: STARSIM_FUSION_SOURCE_REFERENCES.neutronStarGlitches,
  erEprBoundary: STARSIM_FUSION_SOURCE_REFERENCES.erEprBoundary,
} as const satisfies Record<string, StarSimFusionSourceReference>;

export const STARSIM_FUSION_PROFILE_CLAIM_SOURCES: Record<
  StarSimFusionProfileClaimId,
  string[]
> = {
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.mesaProfileImportProfileValidation]: [
    STARSIM_FUSION_PROFILE_SOURCE_REFERENCES.mesa.url,
  ],
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.fusionLuminosityMassShellIntegration]: [
    STARSIM_FUSION_PROFILE_SOURCE_REFERENCES.mesa.url,
  ],
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.fusionChannelFractionFromIntegratedEps]: [
    STARSIM_FUSION_PROFILE_SOURCE_REFERENCES.solarFusionCrossSections.url,
  ],
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.fusionZoneRadiiFromCumulativeLuminosity]: [
    STARSIM_FUSION_PROFILE_SOURCE_REFERENCES.mesa.url,
  ],
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.surfaceLuminosityNotIdenticalToNuclearLuminosityGuardrail]:
    [STARSIM_FUSION_PROFILE_SOURCE_REFERENCES.mesa.url],
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.neutronStarProfileNotFusionProfile]: [
    STARSIM_FUSION_PROFILE_SOURCE_REFERENCES.neutronStarGlitches.url,
  ],
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.hSpectralFitCalibrationOnlyExactSiGuardrail]:
    [STARSIM_FUSION_PROFILE_SOURCE_REFERENCES.nistPlanckConstant.url],
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.gaiaStarmapPopulationPriorOnly]: [
    STARSIM_FUSION_PROFILE_SOURCE_REFERENCES.gaiaDr3.url,
  ],
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.starsimProfileImportNotDirectErEprEvidence]:
    [STARSIM_FUSION_PROFILE_SOURCE_REFERENCES.erEprBoundary.url],
};

export const STARSIM_FUSION_PROFILE_UNCERTAINTY_NOTES: Record<
  StarSimFusionProfileClaimId,
  string
> = {
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.mesaProfileImportProfileValidation]:
    "Profile import validates a shell schema and provenance; it does not certify the upstream stellar model.",
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.fusionLuminosityMassShellIntegration]:
    "Mass-shell integration depends on shell masses and epsilon fields being provided or reconstructable.",
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.fusionChannelFractionFromIntegratedEps]:
    "Channel fractions require component epsilon fields; missing components limit channel attribution.",
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.fusionZoneRadiiFromCumulativeLuminosity]:
    "Fusion-zone radii are cumulative-luminosity diagnostics and inherit profile resolution limits.",
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.surfaceLuminosityNotIdenticalToNuclearLuminosityGuardrail]:
    "Surface luminosity and integrated nuclear luminosity can differ because of transport, storage, and profile truncation.",
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.neutronStarProfileNotFusionProfile]:
    "Neutron-star profiles are compact-object dense-matter context, not PP/CNO stellar fusion profiles.",
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.hSpectralFitCalibrationOnlyExactSiGuardrail]:
    "Spectral h-fit metadata is calibration only because the SI value of h is exact.",
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.gaiaStarmapPopulationPriorOnly]:
    "Gaia-like star maps provide astrometric population context, not direct quantum-spacetime evidence.",
  [STARSIM_FUSION_PROFILE_CLAIM_IDS.starsimProfileImportNotDirectErEprEvidence]:
    "Profile validation can strengthen astrophysical priors but cannot directly establish ER=EPR or CL0-CL4 evidence.",
};

export function citationsForStarSimFusionProfileClaims(
  claimIds: StarSimFusionProfileClaimId[],
): string[] {
  return [
    ...new Set(
      claimIds.flatMap((claimId) => STARSIM_FUSION_PROFILE_CLAIM_SOURCES[claimId]),
    ),
  ];
}

export function uncertaintyNotesForStarSimFusionProfileClaims(
  claimIds: StarSimFusionProfileClaimId[],
): string[] {
  return claimIds.map((claimId) => STARSIM_FUSION_PROFILE_UNCERTAINTY_NOTES[claimId]);
}
