export const STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS = {
  accordionExpansionIsCosmologicalContext:
    "accordion_expansion_is_cosmological_context.v1",
  boundSystemsNotLocalHubbleFlowGuardrail:
    "bound_systems_not_local_hubble_flow_guardrail.v1",
  gaiaAstrometryPopulationPrior: "gaia_astrometry_population_prior.v1",
  stellarFusionMicrophysicsNotErEprEvidence:
    "stellar_fusion_microphysics_not_er_epr_evidence.v1",
  fusionBasedQuantumComputationTermGuardrail:
    "fusion_based_quantum_computation_term_guardrail.v1",
  sparcRotationCurveNullModelContext:
    "sparc_rotation_curve_null_model_context.v1",
  mondControlModelContext: "mond_control_model_context.v1",
  hydrostaticEquilibriumIsStellarInteriorNotGalacticRotation:
    "hydrostatic_equilibrium_is_stellar_interior_not_galactic_rotation.v1",
  qstEntropyAnnotationProxyOnly: "qst_entropy_annotation_proxy_only.v1",
  erEprStaysToyDualSolverLane: "er_epr_stays_toy_dual_solver_lane.v1",
  erDensityProxyNotWormholeDensity: "er_density_proxy_not_wormhole_density.v1",
} as const;

export type StarSimGalacticDynamicsClaimId =
  (typeof STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS)[keyof typeof STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS];

export type StarSimGalacticDynamicsSourceRole =
  | "supports_observational_context"
  | "supports_model"
  | "supports_guardrail"
  | "supports_boundary";

export const STARSIM_GALACTIC_DYNAMICS_CLAIM_SOURCES: Record<
  StarSimGalacticDynamicsClaimId,
  string[]
> = {
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.accordionExpansionIsCosmologicalContext]: [
    "https://www.frontiersin.org/articles/10.3389/fspas.2023.1071743/full",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.boundSystemsNotLocalHubbleFlowGuardrail]: [
    "https://www.frontiersin.org/articles/10.3389/fspas.2023.1071743/full",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.gaiaAstrometryPopulationPrior]: [
    "https://www.cosmos.esa.int/web/gaia/dr3",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.stellarFusionMicrophysicsNotErEprEvidence]: [
    "https://arxiv.org/abs/1004.2318",
    "https://arxiv.org/abs/1306.0533",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.fusionBasedQuantumComputationTermGuardrail]: [
    "https://www.nature.com/articles/s41467-023-36493-1",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.sparcRotationCurveNullModelContext]: [
    "https://www.osti.gov/biblio/22663739",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.mondControlModelContext]: [
    "https://ui.adsabs.harvard.edu/abs/1983ApJ...270..365M/abstract",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.hydrostaticEquilibriumIsStellarInteriorNotGalacticRotation]: [
    "https://arxiv.org/abs/1009.1622",
    "https://www.osti.gov/biblio/22663739",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.qstEntropyAnnotationProxyOnly]: [
    "https://arxiv.org/abs/2411.00972",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.erEprStaysToyDualSolverLane]: [
    "https://arxiv.org/abs/1306.0533",
    "https://arxiv.org/abs/hep-th/0603001",
  ],
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.erDensityProxyNotWormholeDensity]: [
    "https://arxiv.org/abs/hep-th/0603001",
  ],
};

export const STARSIM_GALACTIC_DYNAMICS_CLAIM_SOURCE_ROLES: Record<
  StarSimGalacticDynamicsClaimId,
  StarSimGalacticDynamicsSourceRole
> = {
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.accordionExpansionIsCosmologicalContext]:
    "supports_model",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.boundSystemsNotLocalHubbleFlowGuardrail]:
    "supports_guardrail",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.gaiaAstrometryPopulationPrior]:
    "supports_observational_context",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.stellarFusionMicrophysicsNotErEprEvidence]:
    "supports_boundary",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.fusionBasedQuantumComputationTermGuardrail]:
    "supports_guardrail",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.sparcRotationCurveNullModelContext]:
    "supports_observational_context",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.mondControlModelContext]:
    "supports_model",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.hydrostaticEquilibriumIsStellarInteriorNotGalacticRotation]:
    "supports_guardrail",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.qstEntropyAnnotationProxyOnly]:
    "supports_boundary",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.erEprStaysToyDualSolverLane]:
    "supports_boundary",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.erDensityProxyNotWormholeDensity]:
    "supports_boundary",
};

export const STARSIM_GALACTIC_DYNAMICS_CLAIM_UNCERTAINTY_NOTES: Record<
  StarSimGalacticDynamicsClaimId,
  string
> = {
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.accordionExpansionIsCosmologicalContext]:
    "Accordion distances and epochs are coordinate/context variables, not local claims about bound-system expansion.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.boundSystemsNotLocalHubbleFlowGuardrail]:
    "Bound stellar and galactic systems require local dynamics; Hubble-flow expansion should not be assigned to stellar cores.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.gaiaAstrometryPopulationPrior]:
    "Gaia-like data support population structure priors, with survey selection and astrometric uncertainties carried separately.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.stellarFusionMicrophysicsNotErEprEvidence]:
    "Stellar fusion is quantum nuclear microphysics and cannot directly establish ER=EPR or bridge inventories.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.fusionBasedQuantumComputationTermGuardrail]:
    "Quantum-information fusion and thermonuclear fusion share a term but not a mechanism; reports must keep them separate.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.sparcRotationCurveNullModelContext]:
    "SPARC-like rotation residuals are dynamics controls and do not select a fundamental explanation by themselves.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.mondControlModelContext]:
    "MOND is included as a comparison control without endorsing it as the selected physical model.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.hydrostaticEquilibriumIsStellarInteriorNotGalacticRotation]:
    "Hydrostatic equilibrium is a stellar interior constraint and should not be used as a standalone galaxy-rotation explanation.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.qstEntropyAnnotationProxyOnly]:
    "QST entropy annotations demote visibility claims and cannot promote to metric or stress-energy congruence.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.erEprStaysToyDualSolverLane]:
    "ER=EPR support remains restricted to controlled holographic or toy-dual simulations.",
  [STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS.erDensityProxyNotWormholeDensity]:
    "An ER-density proxy is an analogy variable and must not be read as physical wormhole density.",
};

export function allStarSimGalacticDynamicsClaimIds(): StarSimGalacticDynamicsClaimId[] {
  return Object.values(STARSIM_GALACTIC_DYNAMICS_CLAIM_IDS);
}

export function citationsForStarSimGalacticDynamicsClaims(
  claimIds: StarSimGalacticDynamicsClaimId[],
): string[] {
  return [...new Set(claimIds.flatMap((claimId) => STARSIM_GALACTIC_DYNAMICS_CLAIM_SOURCES[claimId]))];
}

export function sourceRolesForStarSimGalacticDynamicsClaims(
  claimIds: StarSimGalacticDynamicsClaimId[],
): Record<StarSimGalacticDynamicsClaimId, StarSimGalacticDynamicsSourceRole> {
  return Object.fromEntries(
    claimIds.map((claimId) => [claimId, STARSIM_GALACTIC_DYNAMICS_CLAIM_SOURCE_ROLES[claimId]]),
  ) as Record<StarSimGalacticDynamicsClaimId, StarSimGalacticDynamicsSourceRole>;
}

export function uncertaintyNotesForStarSimGalacticDynamicsClaims(
  claimIds: StarSimGalacticDynamicsClaimId[],
): string[] {
  return claimIds.map((claimId) => STARSIM_GALACTIC_DYNAMICS_CLAIM_UNCERTAINTY_NOTES[claimId]);
}
