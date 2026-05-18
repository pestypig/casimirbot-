export const NHM2_REPRESENTATION_SPACE_NAVIGATION_SCHEMA_VERSION =
  "nhm2_representation_space_navigation/v1";

export type Nhm2RepresentationSpaceCategory =
  | "quantum_projective_prediction_space"
  | "adm_dimensional_metric_space"
  | "source_mechanism_space"
  | "quantum_spacetime_proxy_space"
  | "bounded_contract_output_space";

export type Nhm2RepresentationInvariant =
  | "born_rule_prediction_equivalence"
  | "same_chart_tensor_equivalence"
  | "source_side_tensor_independence"
  | "proxy_non_promotion"
  | "bounded_contract_semantics";

export type Nhm2RepresentationBoundaryId =
  | "projective_quantum_to_adm_dimensional_boundary"
  | "qst_proxy_to_adm_metric_boundary"
  | "source_mechanism_to_metric_required_boundary"
  | "bounded_output_to_route_claim_boundary";

export type Nhm2RepresentationSpaceBoundary = {
  schemaVersion: typeof NHM2_REPRESENTATION_SPACE_NAVIGATION_SCHEMA_VERSION;
  boundaryId: Nhm2RepresentationBoundaryId;
  title: string;
  summary: string;
  sourceCategory: Nhm2RepresentationSpaceCategory;
  targetCategory: Nhm2RepresentationSpaceCategory;
  sourceInvariant: Nhm2RepresentationInvariant;
  targetInvariant: Nhm2RepresentationInvariant;
  allowedUse: readonly string[];
  blockedOverclaims: readonly string[];
  claimEffect: "navigation_only" | "diagnostic_only" | "contract_only";
  promotionAllowed: false;
  physicalMechanismClaimAllowed: false;
  validationClaimAllowed: false;
  referenceRoles: {
    physicsInsight: string;
    nhm2Counterpart: string;
  };
};

export const PROJECTIVE_QUANTUM_TO_ADM_DIMENSIONAL_BOUNDARY: Nhm2RepresentationSpaceBoundary = {
  schemaVersion: NHM2_REPRESENTATION_SPACE_NAVIGATION_SCHEMA_VERSION,
  boundaryId: "projective_quantum_to_adm_dimensional_boundary",
  title: "Projective quantum state space vs ADM dimensional metric space",
  summary:
    "Quantum ray/Born-rule equivalence and ADM same-chart tensor equivalence are both representation-boundary disciplines. They rhyme, but neither promotes the other.",
  sourceCategory: "quantum_projective_prediction_space",
  targetCategory: "adm_dimensional_metric_space",
  sourceInvariant: "born_rule_prediction_equivalence",
  targetInvariant: "same_chart_tensor_equivalence",
  allowedUse: [
    "Use projective quantum state space as a navigation analogy for separating representatives from physical predictions.",
    "Use ADM dimensional metric space for lapse, shift, spatial metric, same-chart tensors, and observer projections.",
    "Use the boundary to label the conceptual handoff before asking for source-to-geometry evidence.",
  ],
  blockedOverclaims: [
    "hilbert_vector_linearity_as_nhm2_metric_linearity",
    "born_rule_preservation_as_source_to_geometry_closure",
    "projective_quantum_state_as_adm_metric_state",
    "quantum_representation_choice_as_transport_or_viability_claim",
  ],
  claimEffect: "navigation_only",
  promotionAllowed: false,
  physicalMechanismClaimAllowed: false,
  validationClaimAllowed: false,
  referenceRoles: {
    physicsInsight: "projective_state_space_born_rule_linearity_caveat",
    nhm2Counterpart: "same_chart_adm_tensor_observer_closure_caveat",
  },
};

export const QST_PROXY_TO_ADM_METRIC_BOUNDARY: Nhm2RepresentationSpaceBoundary = {
  schemaVersion: NHM2_REPRESENTATION_SPACE_NAVIGATION_SCHEMA_VERSION,
  boundaryId: "qst_proxy_to_adm_metric_boundary",
  title: "Quantum-spacetime proxy lane vs ADM metric lane",
  summary:
    "Entropy stretch, holographic-area analogies, and vacuum-channel bookkeeping remain proxy-only until a separate same-chart stress-energy route is admitted.",
  sourceCategory: "quantum_spacetime_proxy_space",
  targetCategory: "adm_dimensional_metric_space",
  sourceInvariant: "proxy_non_promotion",
  targetInvariant: "same_chart_tensor_equivalence",
  allowedUse: [
    "Use QST_PROXY values for diagnostic visibility, analogy, and overclaim detection.",
    "Route any proposed quantum-to-geometry claim through same-chart stress-energy, observer, QEI, conservation, and reproducibility gates.",
    "Keep entropy, ER/EPR, holographic-area, and expansion context machine-detectable but non-promoting.",
  ],
  blockedOverclaims: [
    "qst_proxy_as_metric_equivalence",
    "holographic_area_proxy_as_wormhole_inventory",
    "entropy_visibility_ratio_as_physical_hbar_change",
    "hubble_expansion_as_local_dynamic_casimir_drive",
    "qst_proxy_to_spacetime_cl4_promotion",
  ],
  claimEffect: "diagnostic_only",
  promotionAllowed: false,
  physicalMechanismClaimAllowed: false,
  validationClaimAllowed: false,
  referenceRoles: {
    physicsInsight: "quantum_spacetime_context_without_metric_equivalence",
    nhm2Counterpart: "qst_proxy_guardrails_and_same_chart_metric_gate",
  },
};

export const SOURCE_MECHANISM_TO_METRIC_REQUIRED_BOUNDARY: Nhm2RepresentationSpaceBoundary = {
  schemaVersion: NHM2_REPRESENTATION_SPACE_NAVIGATION_SCHEMA_VERSION,
  boundaryId: "source_mechanism_to_metric_required_boundary",
  title: "Source mechanism lane vs metric-required stress-energy lane",
  summary:
    "A Casimir/tile source narrative becomes source-to-geometry evidence only if it supplies an independently defined same-basis tile-effective tensor.",
  sourceCategory: "source_mechanism_space",
  targetCategory: "adm_dimensional_metric_space",
  sourceInvariant: "source_side_tensor_independence",
  targetInvariant: "same_chart_tensor_equivalence",
  allowedUse: [
    "Use source-side tensors as candidates only when they are not metric echoes.",
    "Compare regional tensors on the same chart, tensor basis, units, masks, profile, run, and aggregation rules.",
    "Treat diagonal/proxy source tensors as diagnostic until full tensor authority and provenance gates pass.",
  ],
  blockedOverclaims: [
    "metric_echo_as_source_tensor",
    "diagonal_proxy_as_full_observer_tensor",
    "global_residual_as_regional_source_closure",
    "casimir_tile_bookkeeping_as_macroscopic_gr_source_proof",
  ],
  claimEffect: "diagnostic_only",
  promotionAllowed: false,
  physicalMechanismClaimAllowed: false,
  validationClaimAllowed: false,
  referenceRoles: {
    physicsInsight: "source_representative_must_preserve_independent_physical_basis",
    nhm2Counterpart: "tile_effective_full_tensor_source_counterpart_gate",
  },
};

export const BOUNDED_OUTPUT_TO_ROUTE_CLAIM_BOUNDARY: Nhm2RepresentationSpaceBoundary = {
  schemaVersion: NHM2_REPRESENTATION_SPACE_NAVIGATION_SCHEMA_VERSION,
  boundaryId: "bounded_output_to_route_claim_boundary",
  title: "Bounded contract output vs route or speed claim",
  summary:
    "Worldline, mission-time, and in-hull acceleration contracts preserve bounded output semantics without certifying speed, route ETA, comfort, or broad viability.",
  sourceCategory: "bounded_contract_output_space",
  targetCategory: "adm_dimensional_metric_space",
  sourceInvariant: "bounded_contract_semantics",
  targetInvariant: "same_chart_tensor_equivalence",
  allowedUse: [
    "Use bounded contracts for declared local descriptors, clocking comparisons, and observer-defined acceleration diagnostics.",
    "Keep route, speed, and viability language outside the contract unless a separate admitted gate supplies it.",
    "Treat shift descriptors and lapse clocking targets as chart-declared quantities, not scalar ship-speed claims.",
  ],
  blockedOverclaims: [
    "shift_descriptor_as_ship_speed",
    "mission_time_comparison_as_route_eta_certification",
    "proper_acceleration_contract_as_curvature_gravity_or_comfort_certification",
    "clocking_target_as_lower_alpha_validation",
  ],
  claimEffect: "contract_only",
  promotionAllowed: false,
  physicalMechanismClaimAllowed: false,
  validationClaimAllowed: false,
  referenceRoles: {
    physicsInsight: "representation_boundary_for_observable_quantities",
    nhm2Counterpart: "bounded_contract_semantics_guard",
  },
};

export const NHM2_REPRESENTATION_SPACE_BOUNDARIES: Nhm2RepresentationSpaceBoundary[] = [
  PROJECTIVE_QUANTUM_TO_ADM_DIMENSIONAL_BOUNDARY,
  QST_PROXY_TO_ADM_METRIC_BOUNDARY,
  SOURCE_MECHANISM_TO_METRIC_REQUIRED_BOUNDARY,
  BOUNDED_OUTPUT_TO_ROUTE_CLAIM_BOUNDARY,
];

export const getNhm2RepresentationSpaceBoundary = (
  boundaryId: Nhm2RepresentationBoundaryId,
): Nhm2RepresentationSpaceBoundary => {
  const boundary = NHM2_REPRESENTATION_SPACE_BOUNDARIES.find(
    (candidate) => candidate.boundaryId === boundaryId,
  );
  if (!boundary) {
    throw new Error(`Unknown NHM2 representation-space boundary: ${boundaryId}`);
  }
  return boundary;
};

export const listNhm2RepresentationSpaceBoundariesForCategory = (
  category: Nhm2RepresentationSpaceCategory,
): Nhm2RepresentationSpaceBoundary[] =>
  NHM2_REPRESENTATION_SPACE_BOUNDARIES.filter(
    (boundary) => boundary.sourceCategory === category || boundary.targetCategory === category,
  );
