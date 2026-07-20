import { createHash } from "node:crypto";

import {
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS,
  type Nhm2IndependentNumericalReplicationRequiredFieldId,
} from "./nhm2-independent-numerical-replication.v1";
import { NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES } from "./nhm2-primary-raw-content-policy.v1";
import type { Nhm2PrimaryRawOutputFamilyId } from "./nhm2-primary-raw-output-manifest.v1";

export const NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID =
  "nhm2.primary_comparison_projection_manifest" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION =
  "nhm2_primary_comparison_projection_manifest/v1" as const;
export const NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID =
  "nhm2.primary_comparison_ordered_sample_domain" as const;
export const NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION =
  "nhm2_primary_comparison_ordered_sample_domain/v1" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID =
  "nhm2.primary_comparison_projection_policy" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION =
  "nhm2_primary_comparison_projection_policy/v1" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_POLICY_ID =
  "server_owned_projection_frozen_before_independent_spawn" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_POLICY_VERSION =
  "nhm2_primary_comparison_projection_freeze/v1" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_ENCODING =
  "raw_ieee754" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_ENDIANNESS =
  "little" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_STORAGE_ORDER =
  "row-major" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_DOMAIN_ORDERING =
  "ordinal_ascending_no_gaps" as const;

export type Nhm2PrimaryComparisonProjectionRawSourceUse =
  "projection" | "ordered_domain" | "uncertainty";

export type Nhm2PrimaryComparisonProjectionRawSourcePolicyV1 = {
  familyId: Nhm2PrimaryRawOutputFamilyId;
  semanticRole: string;
  uses: readonly Nhm2PrimaryComparisonProjectionRawSourceUse[];
};

export type Nhm2PrimaryComparisonProjectionFieldPolicyV1 = {
  fieldId: Nhm2IndependentNumericalReplicationRequiredFieldId;
  componentOrder: readonly string[];
  componentUnits: readonly string[];
  projectionOperatorId: string;
  projectionDerivationId: string;
  orderedDomainOperatorId: string;
  orderedDomainRowIdentitySchemaId: string;
  uncertaintyOperatorId: string;
  uncertaintyDerivationId: string;
  uncertaintyCoverage: "deterministic_upper_bound_or_95_percent";
  minimumSampleCount: number;
  rawSources: readonly Nhm2PrimaryComparisonProjectionRawSourcePolicyV1[];
};

const raw = (
  familyId: Nhm2PrimaryRawOutputFamilyId,
  semanticRole: string,
  ...uses: Nhm2PrimaryComparisonProjectionRawSourceUse[]
): Nhm2PrimaryComparisonProjectionRawSourcePolicyV1 => ({
  familyId,
  semanticRole,
  uses,
});

const tensorUnits = Array.from({ length: 10 }, () => "J/m^3");

const deepFreeze = <Value>(value: Value): Value => {
  if (value == null || typeof value !== "object") return value;
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
};

/**
 * Frozen primitive lineage for the nine independent-comparison arrays.
 * Comparison-only producer roles are deliberately absent. A future server
 * replay must derive each output from these primitives; copying a producer's
 * residual, optimum, stress, or projected-value array is not an admissible
 * projection.
 */
export const NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES = deepFreeze([
  {
    fieldId: "full_apparatus_source_tensor.full_tensor",
    componentOrder: [
      ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[0]
        .componentOrder,
    ],
    componentUnits: tensorUnits,
    projectionOperatorId:
      "nhm2_projection.apparatus_term_ledger_same_chart_sum/v1",
    projectionDerivationId:
      "sum_ledger_declared_term_slices_apply_normalization_and_tensor10_remap/v1",
    orderedDomainOperatorId: "nhm2_domain.same_chart_grid_coordinates/v1",
    orderedDomainRowIdentitySchemaId:
      "nhm2_domain_row.same_chart_sample_region_ijk_txyz/v1",
    uncertaintyOperatorId:
      "nhm2_uncertainty.float64_sum_forward_error_bound/v1",
    uncertaintyDerivationId:
      "gamma_n_sum_abs_ledger_terms_after_normalization/v1",
    uncertaintyCoverage: "deterministic_upper_bound_or_95_percent",
    minimumSampleCount:
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.full_apparatus_source_tensor
        .grid_topology_records.minimumRecordCount,
    rawSources: [
      raw(
        "full_apparatus_source_tensor",
        "apparatus_term_ledger",
        "projection",
      ),
      raw(
        "full_apparatus_source_tensor",
        "grid_topology_records",
        "ordered_domain",
      ),
      raw(
        "full_apparatus_source_tensor",
        "coordinate_samples",
        "ordered_domain",
      ),
      raw(
        "full_apparatus_source_tensor",
        "term_tensor_components",
        "projection",
        "uncertainty",
      ),
      raw(
        "full_apparatus_source_tensor",
        "integration_weight_mask_samples",
        "projection",
      ),
      raw(
        "full_apparatus_source_tensor",
        "normalization_samples",
        "projection",
        "uncertainty",
      ),
      raw(
        "full_apparatus_source_tensor",
        "source_provenance_edges",
        "projection",
      ),
    ],
  },
  {
    fieldId: "semiclassical_state.renormalized_full_tensor",
    componentOrder: [
      ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[1]
        .componentOrder,
    ],
    componentUnits: tensorUnits,
    projectionOperatorId: "nhm2_projection.renormalized_mode_tensor_sum/v1",
    projectionDerivationId:
      "state_weighted_mode_tensor_sum_minus_renormalization_subtraction/v1",
    orderedDomainOperatorId: "nhm2_domain.semiclassical_mode_basis_index/v1",
    orderedDomainRowIdentitySchemaId: "nhm2_domain_row.mode_basis_ordinal/v1",
    uncertaintyOperatorId: "nhm2_uncertainty.renormalized_tensor_interval/v1",
    uncertaintyDerivationId:
      "bind_raw_95_interval_and_float64_accumulation_bound/v1",
    uncertaintyCoverage: "deterministic_upper_bound_or_95_percent",
    minimumSampleCount:
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.semiclassical_state
        .mode_basis_samples.minimumFirstAxis,
    rawSources: [
      raw(
        "semiclassical_state",
        "mode_basis_samples",
        "projection",
        "ordered_domain",
      ),
      raw("semiclassical_state", "state_mode_coefficients", "projection"),
      raw(
        "semiclassical_state",
        "mode_tensor_contribution_components",
        "projection",
      ),
      raw(
        "semiclassical_state",
        "renormalization_subtraction_samples",
        "projection",
      ),
      raw("semiclassical_state", "renormalization_inputs", "projection"),
      raw("semiclassical_state", "switching_profile_samples", "projection"),
      raw("semiclassical_state", "uncertainty_samples", "uncertainty"),
    ],
  },
  {
    fieldId: "covariant_conservation.divergence_four_vector",
    componentOrder: [
      ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[2]
        .componentOrder,
    ],
    componentUnits: ["J/m^4", "J/m^4", "J/m^4", "J/m^4"],
    projectionOperatorId:
      "nhm2_projection.covariant_divergence_from_primitives/v1",
    projectionDerivationId:
      "differentiate_replayed_full_tensor_and_recompute_levi_civita_connection/v1",
    orderedDomainOperatorId: "nhm2_domain.same_chart_grid_coordinates/v1",
    orderedDomainRowIdentitySchemaId:
      "nhm2_domain_row.same_chart_sample_region_ijk_txyz/v1",
    uncertaintyOperatorId:
      "nhm2_uncertainty.conservation_refinement_interval/v1",
    uncertaintyDerivationId:
      "combine_stencil_truncation_refinement_and_raw_95_interval/v1",
    uncertaintyCoverage: "deterministic_upper_bound_or_95_percent",
    minimumSampleCount:
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.full_apparatus_source_tensor
        .grid_topology_records.minimumRecordCount,
    rawSources: [
      raw(
        "full_apparatus_source_tensor",
        "apparatus_term_ledger",
        "projection",
      ),
      raw(
        "full_apparatus_source_tensor",
        "grid_topology_records",
        "ordered_domain",
      ),
      raw(
        "full_apparatus_source_tensor",
        "coordinate_samples",
        "ordered_domain",
      ),
      raw(
        "full_apparatus_source_tensor",
        "term_tensor_components",
        "projection",
      ),
      raw(
        "full_apparatus_source_tensor",
        "metric_tensor_components",
        "projection",
      ),
      raw(
        "full_apparatus_source_tensor",
        "normalization_samples",
        "projection",
      ),
      raw(
        "covariant_conservation",
        "derivative_stencil_records",
        "projection",
        "uncertainty",
      ),
      raw(
        "covariant_conservation",
        "switching_transition_components",
        "projection",
      ),
      raw(
        "covariant_conservation",
        "support_control_source_components",
        "projection",
      ),
      raw(
        "covariant_conservation",
        "boundary_normal_weight_samples",
        "projection",
      ),
      raw("covariant_conservation", "refinement_samples", "uncertainty"),
      raw("covariant_conservation", "uncertainty_samples", "uncertainty"),
    ],
  },
  {
    fieldId: "continuous_observer_optimizer.minimum_energy_density",
    componentOrder: [
      ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[3]
        .componentOrder,
    ],
    componentUnits: ["J/m^3"],
    projectionOperatorId: "nhm2_projection.continuous_observer_minimum/v1",
    projectionDerivationId:
      "recontract_replayed_tensor_over_bound_timelike_globality_search/v1",
    orderedDomainOperatorId: "nhm2_domain.observer_spatial_sample_index/v1",
    orderedDomainRowIdentitySchemaId:
      "nhm2_domain_row.observer_sample_region/v1",
    uncertaintyOperatorId: "nhm2_uncertainty.observer_minimum_interval/v1",
    uncertaintyDerivationId:
      "combine_tensor_contraction_roundoff_optimizer_gap_and_raw_95_interval/v1",
    uncertaintyCoverage: "deterministic_upper_bound_or_95_percent",
    minimumSampleCount:
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.continuous_observer_optimizer
        .spatial_sample_index.minimumRecordCount,
    rawSources: [
      raw(
        "full_apparatus_source_tensor",
        "apparatus_term_ledger",
        "projection",
      ),
      raw(
        "full_apparatus_source_tensor",
        "term_tensor_components",
        "projection",
      ),
      raw(
        "continuous_observer_optimizer",
        "spatial_sample_index",
        "ordered_domain",
      ),
      raw(
        "continuous_observer_optimizer",
        "energy_condition_optimizer_bindings",
        "projection",
      ),
      raw(
        "continuous_observer_optimizer",
        "timelike_observer_vectors",
        "projection",
      ),
      raw(
        "continuous_observer_optimizer",
        "condition_optimum_timelike_vectors",
        "projection",
      ),
      raw(
        "continuous_observer_optimizer",
        "null_direction_vectors",
        "projection",
      ),
      raw(
        "continuous_observer_optimizer",
        "adversarial_start_samples",
        "projection",
      ),
      raw(
        "continuous_observer_optimizer",
        "uncertainty_samples",
        "uncertainty",
      ),
    ],
  },
  {
    fieldId: "worldline_qei.sampled_bound_and_margin",
    componentOrder: [
      ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[4]
        .componentOrder,
    ],
    componentUnits: ["J/m^3", "J/m^3", "J/m^3"],
    projectionOperatorId:
      "nhm2_projection.worldline_qei_integral_bound_margin/v1",
    projectionDerivationId:
      "interpolate_replayed_tensor_contract_four_velocity_quadrature_and_theorem_bound/v1",
    orderedDomainOperatorId: "nhm2_domain.qei_worldline_catalog/v1",
    orderedDomainRowIdentitySchemaId:
      "nhm2_domain_row.worldline_region_sampling_family/v1",
    uncertaintyOperatorId:
      "nhm2_uncertainty.qei_integral_and_bound_interval/v1",
    uncertaintyDerivationId:
      "propagate_tensor_interpolation_quadrature_theorem_and_raw_95_intervals/v1",
    uncertaintyCoverage: "deterministic_upper_bound_or_95_percent",
    minimumSampleCount:
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.worldline_qei.worldline_catalog
        .minimumRecordCount,
    rawSources: [
      raw(
        "full_apparatus_source_tensor",
        "apparatus_term_ledger",
        "projection",
      ),
      raw(
        "full_apparatus_source_tensor",
        "term_tensor_components",
        "projection",
      ),
      raw("worldline_qei", "worldline_catalog", "projection", "ordered_domain"),
      raw(
        "worldline_qei",
        "worldline_apparatus_interpolation_entries",
        "projection",
      ),
      raw("worldline_qei", "trajectory_components", "projection"),
      raw("worldline_qei", "proper_time_samples", "projection"),
      raw("worldline_qei", "four_velocity_components", "projection"),
      raw("worldline_qei", "acceleration_curvature_components", "projection"),
      raw("worldline_qei", "sampling_function_samples", "projection"),
      raw("worldline_qei", "theorem_bound_inputs", "projection", "uncertainty"),
      raw("worldline_qei", "uncertainty_samples", "uncertainty"),
    ],
  },
  {
    fieldId:
      "dynamic_backreaction_stability_causality.constraint_stability_causality",
    componentOrder: [
      ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[5]
        .componentOrder,
    ],
    componentUnits: [
      "candidate_normalized",
      "candidate_normalized",
      "candidate_normalized",
      "candidate_normalized",
      "candidate_normalized",
      "1/s",
      "candidate_normalized",
    ],
    projectionOperatorId:
      "nhm2_projection.dynamic_constraint_stability_causality/v1",
    projectionDerivationId:
      "recompute_constraints_backreaction_fixed_point_mode_growth_and_causal_margin/v1",
    orderedDomainOperatorId: "nhm2_domain.dynamic_evolution_grid/v1",
    orderedDomainRowIdentitySchemaId:
      "nhm2_domain_row.dynamic_sample_region_time_grid/v1",
    uncertaintyOperatorId:
      "nhm2_uncertainty.dynamic_refinement_neighborhood/v1",
    uncertaintyDerivationId:
      "combine_resolution_error_parameter_neighborhood_and_float64_bound/v1",
    uncertaintyCoverage: "deterministic_upper_bound_or_95_percent",
    minimumSampleCount:
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES
        .dynamic_backreaction_stability_causality.evolution_grid_records
        .minimumRecordCount,
    rawSources: [
      raw(
        "dynamic_backreaction_stability_causality",
        "evolution_grid_records",
        "ordered_domain",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "initial_data_components",
        "projection",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "evolved_geometry_components",
        "projection",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "evolved_source_components",
        "projection",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "gauge_field_components",
        "projection",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "backreaction_iteration_fields",
        "projection",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "characteristic_ray_samples",
        "projection",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "perturbation_mode_samples",
        "projection",
        "uncertainty",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "causal_screen_samples",
        "projection",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "parameter_neighborhood_samples",
        "uncertainty",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "boundary_flux_samples",
        "projection",
      ),
      raw(
        "dynamic_backreaction_stability_causality",
        "resolution_refinement_samples",
        "uncertainty",
      ),
    ],
  },
  {
    fieldId:
      "finite_temperature_finite_geometry_maxwell_stress.surface_traction_and_gradient",
    componentOrder: [
      ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[6]
        .componentOrder,
    ],
    componentUnits: ["Pa", "Pa", "Pa", "N/m"],
    projectionOperatorId:
      "nhm2_projection.maxwell_surface_traction_force_gradient/v1",
    projectionDerivationId:
      "recompute_finite_temperature_maxwell_stress_contract_surface_normals_and_gap_derivative/v1",
    orderedDomainOperatorId: "nhm2_domain.maxwell_integration_surface/v1",
    orderedDomainRowIdentitySchemaId:
      "nhm2_domain_row.surface_ordinal_xyz_normal_weight/v1",
    uncertaintyOperatorId:
      "nhm2_uncertainty.maxwell_refinement_material_roughness/v1",
    uncertaintyDerivationId:
      "combine_mesh_frequency_refinement_roughness_patch_temperature_and_roundoff/v1",
    uncertaintyCoverage: "deterministic_upper_bound_or_95_percent",
    minimumSampleCount:
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES
        .finite_temperature_finite_geometry_maxwell_stress
        .integration_surface_samples.minimumFirstAxis,
    rawSources: [
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "geometry_mesh_records",
        "projection",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "material_region_records",
        "projection",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "dielectric_response_samples",
        "projection",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "matsubara_mode_samples",
        "projection",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "electric_green_dyadic_components",
        "projection",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "magnetic_green_dyadic_components",
        "projection",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "electric_field_correlation_components",
        "projection",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "magnetic_field_correlation_components",
        "projection",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "integration_surface_samples",
        "projection",
        "ordered_domain",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "roughness_patch_temperature_samples",
        "uncertainty",
      ),
      raw(
        "finite_temperature_finite_geometry_maxwell_stress",
        "mesh_frequency_refinement_samples",
        "uncertainty",
      ),
    ],
  },
  {
    fieldId:
      "mechanical_support_control_margin.stress_displacement_control_margins",
    componentOrder: [
      ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[7]
        .componentOrder,
    ],
    componentUnits: ["m", "Pa", "1", "1", "J"],
    projectionOperatorId:
      "nhm2_projection.mechanical_support_control_observables/v1",
    projectionDerivationId:
      "recompute_fea_stress_displacement_stability_pull_in_and_control_energy/v1",
    orderedDomainOperatorId: "nhm2_domain.mechanical_node_major_index/v1",
    orderedDomainRowIdentitySchemaId:
      "nhm2_domain_row.mechanical_node_ordinal/v1",
    uncertaintyOperatorId:
      "nhm2_uncertainty.mechanical_tolerance_energy_stability/v1",
    uncertaintyDerivationId:
      "propagate_fabrication_tolerance_mode_control_energy_and_float64_bounds/v1",
    uncertaintyCoverage: "deterministic_upper_bound_or_95_percent",
    minimumSampleCount:
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.mechanical_support_control_margin
        .displacement_components.minimumFirstAxis,
    rawSources: [
      raw(
        "mechanical_support_control_margin",
        "fea_mesh_records",
        "projection",
      ),
      raw(
        "mechanical_support_control_margin",
        "material_constitutive_records",
        "projection",
      ),
      raw(
        "mechanical_support_control_margin",
        "boundary_condition_records",
        "projection",
      ),
      raw(
        "mechanical_support_control_margin",
        "stiffness_matrix_entries",
        "projection",
      ),
      raw(
        "mechanical_support_control_margin",
        "load_vector_components",
        "projection",
      ),
      raw(
        "mechanical_support_control_margin",
        "displacement_components",
        "projection",
        "ordered_domain",
      ),
      raw(
        "mechanical_support_control_margin",
        "stability_mode_samples",
        "projection",
        "uncertainty",
      ),
      raw(
        "mechanical_support_control_margin",
        "active_control_cycle_samples",
        "projection",
        "uncertainty",
      ),
      raw(
        "mechanical_support_control_margin",
        "fabrication_tolerance_samples",
        "uncertainty",
      ),
      raw(
        "mechanical_support_control_margin",
        "energy_heat_noise_samples",
        "projection",
        "uncertainty",
      ),
    ],
  },
  {
    fieldId: "prediction_falsifier_freeze.pre_registered_observables",
    componentOrder: [
      ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[8]
        .componentOrder,
    ],
    componentUnits: ["J/m^3", "rad", "s", "N", "1", "1/s^2"],
    projectionOperatorId: "nhm2_projection.pre_registered_observable_vector/v1",
    projectionDerivationId:
      "apply_sparse_projection_operator_to_bound_noncomparison_sources_in_frozen_observable_order/v1",
    orderedDomainOperatorId:
      "nhm2_domain.pre_registered_observable_target_sample/v1",
    orderedDomainRowIdentitySchemaId:
      "nhm2_domain_row.observable_id_target_time/v1",
    uncertaintyOperatorId: "nhm2_uncertainty.observable_jacobian_interval/v1",
    uncertaintyDerivationId:
      "propagate_projection_jacobian_and_bound_source_intervals/v1",
    uncertaintyCoverage: "deterministic_upper_bound_or_95_percent",
    minimumSampleCount:
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.observable_projection
        .observable_definition_records.minimumRecordCount,
    rawSources: [
      raw(
        "observable_projection",
        "observable_definition_records",
        "projection",
        "ordered_domain",
      ),
      raw(
        "observable_projection",
        "projection_derivation_inputs",
        "projection",
      ),
      raw("observable_projection", "projection_operator_entries", "projection"),
      raw("observable_projection", "projection_source_values", "projection"),
      raw(
        "observable_projection",
        "projection_jacobian_components",
        "uncertainty",
      ),
      raw(
        "observable_projection",
        "projection_uncertainty_samples",
        "uncertainty",
      ),
    ],
  },
] as const satisfies readonly Nhm2PrimaryComparisonProjectionFieldPolicyV1[]);

const canonicalJson = (value: unknown): string => {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non_finite_canonical_number");
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (value != null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort((left, right) =>
        Buffer.compare(Buffer.from(left), Buffer.from(right)),
      )
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  throw new Error("unsupported_canonical_value");
};

const sha256Domain = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(`${domain}\n`, "utf8")
    .update(canonicalJson(value), "utf8")
    .digest("hex");

export const NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY = deepFreeze({
  artifactId: NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID,
  contractVersion: NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION,
  exactNineFieldOrderRequired: true,
  rawPrimitiveReplayRequired: true,
  comparisonOnlyPrimaryRolesForbiddenAsAuthority: true,
  outputArrayFormat: {
    dtype: "float64",
    encoding: NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_ENCODING,
    endianness: NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_ENDIANNESS,
    rank: 2,
    storageOrder: NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_STORAGE_ORDER,
  },
  orderedDomain: {
    artifactId: NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID,
    contractVersion: NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION,
    ordering: NHM2_PRIMARY_COMPARISON_PROJECTION_DOMAIN_ORDERING,
    uniqueRowIdsRequired: true,
    syntheticRowDuplicationForbidden: true,
    semanticDigestRequired: true,
  },
  fields: NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES,
  claimBoundary: {
    diagnosticComparisonInputOnly: true,
    theoryClosureAllowed: false,
    physicalViabilityAllowed: false,
    transportAllowed: false,
    propulsionAllowed: false,
    routeEtaAllowed: false,
    certifiedSpeedAllowed: false,
  },
} as const);

export const computeNhm2PrimaryComparisonProjectionPolicySha256 = (): string =>
  sha256Domain(
    "nhm2-primary-comparison-projection-policy/v1",
    NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY,
  );

export const NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256 =
  computeNhm2PrimaryComparisonProjectionPolicySha256();

export type Nhm2PrimaryComparisonProjectionSourceBindingV1 = {
  familyId: Nhm2PrimaryRawOutputFamilyId;
  semanticRole: string;
  fileId: string;
  path: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2PrimaryComparisonProjectionFloat64ArrayV1 = {
  path: string;
  sha256: string;
  sizeBytes: number;
  dtype: "float64";
  encoding: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_ENCODING;
  endianness: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_ENDIANNESS;
  shape: [number, number];
  storageOrder: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_STORAGE_ORDER;
  componentOrder: string[];
  componentUnits: string[];
};

export type Nhm2PrimaryComparisonOrderedSampleDomainRowAxisV1 = {
  axisId: string;
  valueKind: "float64" | "int64" | "string";
  value: number | string;
  unit: string | null;
};

export type Nhm2PrimaryComparisonOrderedSampleDomainRowV1 = {
  ordinal: number;
  rowId: string;
  axes: Nhm2PrimaryComparisonOrderedSampleDomainRowAxisV1[];
};

export type Nhm2PrimaryComparisonOrderedSampleDomainV1 = {
  artifactId: typeof NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID;
  contractVersion: typeof NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION;
  fieldId: Nhm2IndependentNumericalReplicationRequiredFieldId;
  ordering: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_DOMAIN_ORDERING;
  rowIdentitySchemaId: string;
  rowCount: number;
  rows: Nhm2PrimaryComparisonOrderedSampleDomainRowV1[];
  orderedRowsSha256: string;
};

export const computeNhm2PrimaryComparisonOrderedRowsSha256 = (
  domain: Omit<Nhm2PrimaryComparisonOrderedSampleDomainV1, "orderedRowsSha256">,
): string => sha256Domain("nhm2-primary-comparison-ordered-rows/v1", domain);

export type Nhm2PrimaryComparisonProjectionManifestV1 = {
  artifactId: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID;
  contractVersion: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION;
  generatedAt: string;
  identity: {
    candidateId: string;
    laneId: "nhm2_shift_lapse";
    selectedProfileId: string;
    chartId: string;
    primaryRequestId: string;
    primaryRunId: string;
    primaryReceiptId: string;
    primaryRuntimeId: string;
    primarySolverId: string;
    primarySourceCommitSha: string;
    candidateManifest: { inputId: string; sha256: string };
    chartDefinition: { inputId: string; sha256: string };
    units: { inputId: string; sha256: string };
    normalization: { inputId: string; sha256: string };
  };
  rawPackage: {
    artifactId: "nhm2.primary_raw_output_manifest";
    contractVersion: "nhm2_primary_raw_output_manifest/v1";
    manifestRelativePath: string;
    manifestSha256: string;
    contentPolicySha256: string;
    inputClosureSha256: string;
    verifiedFileInventorySha256: string;
  };
  projectionPolicy: {
    artifactId: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID;
    contractVersion: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION;
    semanticSha256: string;
  };
  freeze: {
    policyId: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_POLICY_ID;
    policyVersion: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_POLICY_VERSION;
    registrationId: string;
    independentRequestId: string;
    independentRunId: string;
    independentPlanSha256: string;
    projectionCompletedAt: string;
    frozenBeforeIndependentRun: true;
  };
  fields: Array<{
    ordinal: number;
    fieldId: Nhm2IndependentNumericalReplicationRequiredFieldId;
    componentOrder: string[];
    componentUnits: string[];
    rawSources: Nhm2PrimaryComparisonProjectionSourceBindingV1[];
    projectionOperator: {
      operatorId: string;
      derivationId: string;
    };
    output: Nhm2PrimaryComparisonProjectionFloat64ArrayV1;
    orderedDomainOperator: {
      operatorId: string;
      rowIdentitySchemaId: string;
    };
    orderedDomain: {
      artifactId: typeof NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID;
      contractVersion: typeof NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION;
      path: string;
      sha256: string;
      sizeBytes: number;
      rowCount: number;
      orderedRowsSha256: string;
    };
    uncertainty: {
      operatorId: string;
      derivationId: string;
      coverage: "deterministic_upper_bound_or_95_percent";
      confidenceLevelAtLeast: 0.95;
      output: Nhm2PrimaryComparisonProjectionFloat64ArrayV1;
    };
  }>;
  claimBoundary: {
    diagnosticComparisonInputOnly: true;
    independentComparisonStillRequired: true;
    empiricalReceiptsStillRequired: true;
    theoryClosureEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
  };
};

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;

const isPortableRelativePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !value.startsWith("/") &&
  !/^[A-Za-z]:/.test(value) &&
  value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");

const sameStrings = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const sourceKey = (value: { familyId: string; semanticRole: string }): string =>
  `${value.familyId}:${value.semanticRole}`;

const validIso = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const validIdentifier = (value: unknown): value is string =>
  typeof value === "string" && IDENTIFIER.test(value) && !value.includes("//");

const validateArray = (
  value: Nhm2PrimaryComparisonProjectionFloat64ArrayV1,
  policy: Nhm2PrimaryComparisonProjectionFieldPolicyV1,
  label: string,
  violations: string[],
): void => {
  if (!isPortableRelativePath(value?.path))
    violations.push(`${label}_path_invalid`);
  if (!SHA256.test(value?.sha256 ?? ""))
    violations.push(`${label}_sha256_invalid`);
  if (!Number.isSafeInteger(value?.sizeBytes) || value.sizeBytes <= 0)
    violations.push(`${label}_size_bytes_invalid`);
  if (
    value?.dtype !== "float64" ||
    value.encoding !== NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_ENCODING ||
    value.endianness !== NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_ENDIANNESS ||
    value.storageOrder !==
      NHM2_PRIMARY_COMPARISON_PROJECTION_ARRAY_STORAGE_ORDER
  ) {
    violations.push(`${label}_representation_invalid`);
  }
  if (
    !Array.isArray(value?.shape) ||
    value.shape.length !== 2 ||
    !Number.isSafeInteger(value.shape[0]) ||
    value.shape[0] < policy.minimumSampleCount ||
    value.shape[1] !== policy.componentOrder.length
  ) {
    violations.push(`${label}_shape_invalid`);
  } else if (value.sizeBytes !== value.shape[0] * value.shape[1] * 8) {
    violations.push(`${label}_shape_size_mismatch`);
  }
  if (!sameStrings(value?.componentOrder ?? [], policy.componentOrder))
    violations.push(`${label}_component_order_invalid`);
  if (!sameStrings(value?.componentUnits ?? [], policy.componentUnits))
    violations.push(`${label}_component_units_invalid`);
};

export const nhm2PrimaryComparisonOrderedSampleDomainViolations = (
  value: Nhm2PrimaryComparisonOrderedSampleDomainV1,
  expected?: {
    fieldId: Nhm2IndependentNumericalReplicationRequiredFieldId;
    rowIdentitySchemaId: string;
    minimumRowCount: number;
  },
): string[] => {
  const violations: string[] = [];
  if (value?.artifactId !== NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID)
    violations.push("domain_artifact_id_invalid");
  if (
    value?.contractVersion !==
    NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION
  )
    violations.push("domain_contract_version_invalid");
  if (
    !NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.some(
      (entry) => entry.fieldId === value?.fieldId,
    )
  ) {
    violations.push("domain_field_id_invalid");
  }
  if (expected != null && value?.fieldId !== expected.fieldId)
    violations.push("domain_field_id_mismatch");
  if (value?.ordering !== NHM2_PRIMARY_COMPARISON_PROJECTION_DOMAIN_ORDERING)
    violations.push("domain_ordering_invalid");
  if (!validIdentifier(value?.rowIdentitySchemaId))
    violations.push("domain_row_identity_schema_id_invalid");
  if (
    expected != null &&
    value?.rowIdentitySchemaId !== expected.rowIdentitySchemaId
  )
    violations.push("domain_row_identity_schema_id_mismatch");
  if (
    !Number.isSafeInteger(value?.rowCount) ||
    value.rowCount < (expected?.minimumRowCount ?? 1) ||
    !Array.isArray(value?.rows) ||
    value.rows.length !== value.rowCount
  ) {
    violations.push("domain_row_count_invalid");
  }
  const rowIds = new Set<string>();
  for (const [index, row] of (value?.rows ?? []).entries()) {
    if (row?.ordinal !== index)
      violations.push(`domain_row_ordinal_invalid:${index}`);
    if (!validIdentifier(row?.rowId) || rowIds.has(row.rowId))
      violations.push(`domain_row_id_invalid:${index}`);
    else rowIds.add(row.rowId);
    if (!Array.isArray(row?.axes) || row.axes.length === 0) {
      violations.push(`domain_row_axes_invalid:${index}`);
      continue;
    }
    const axisIds = new Set<string>();
    for (const [axisIndex, axis] of row.axes.entries()) {
      if (!validIdentifier(axis?.axisId) || axisIds.has(axis.axisId))
        violations.push(`domain_axis_id_invalid:${index}:${axisIndex}`);
      else axisIds.add(axis.axisId);
      if (axis?.valueKind === "float64") {
        if (typeof axis.value !== "number" || !Number.isFinite(axis.value))
          violations.push(`domain_axis_value_invalid:${index}:${axisIndex}`);
      } else if (axis?.valueKind === "int64") {
        if (!Number.isSafeInteger(axis.value))
          violations.push(`domain_axis_value_invalid:${index}:${axisIndex}`);
      } else if (axis?.valueKind === "string") {
        if (typeof axis.value !== "string" || axis.value.length === 0)
          violations.push(`domain_axis_value_invalid:${index}:${axisIndex}`);
      } else {
        violations.push(`domain_axis_kind_invalid:${index}:${axisIndex}`);
      }
      if (
        axis?.unit !== null &&
        (typeof axis.unit !== "string" || axis.unit.length === 0)
      )
        violations.push(`domain_axis_unit_invalid:${index}:${axisIndex}`);
    }
  }
  if (SHA256.test(value?.orderedRowsSha256 ?? "")) {
    const { orderedRowsSha256: _ignored, ...semantic } = value;
    let recomputed: string | null = null;
    try {
      recomputed = computeNhm2PrimaryComparisonOrderedRowsSha256(semantic);
    } catch {
      recomputed = null;
    }
    if (recomputed !== value.orderedRowsSha256)
      violations.push("domain_ordered_rows_sha256_mismatch");
  } else {
    violations.push("domain_ordered_rows_sha256_invalid");
  }
  return [...new Set(violations)];
};

export const nhm2PrimaryComparisonProjectionManifestViolations = (
  value: Nhm2PrimaryComparisonProjectionManifestV1,
): string[] => {
  const violations: string[] = [];
  if (
    value?.artifactId !==
    NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID
  )
    violations.push("artifact_id_invalid");
  if (
    value?.contractVersion !==
    NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION
  )
    violations.push("contract_version_invalid");
  if (!validIso(value?.generatedAt)) violations.push("generated_at_invalid");
  const identity = value?.identity;
  for (const [key, entry] of Object.entries({
    candidateId: identity?.candidateId,
    selectedProfileId: identity?.selectedProfileId,
    chartId: identity?.chartId,
    primaryRequestId: identity?.primaryRequestId,
    primaryRunId: identity?.primaryRunId,
    primaryReceiptId: identity?.primaryReceiptId,
    primaryRuntimeId: identity?.primaryRuntimeId,
    primarySolverId: identity?.primarySolverId,
  })) {
    if (!validIdentifier(entry)) violations.push(`identity_${key}_invalid`);
  }
  if (identity?.laneId !== "nhm2_shift_lapse")
    violations.push("identity_lane_invalid");
  if (!GIT_SHA.test(identity?.primarySourceCommitSha ?? ""))
    violations.push("identity_source_commit_invalid");
  for (const [key, binding] of Object.entries({
    candidateManifest: identity?.candidateManifest,
    chartDefinition: identity?.chartDefinition,
    units: identity?.units,
    normalization: identity?.normalization,
  })) {
    if (
      !validIdentifier(binding?.inputId) ||
      !SHA256.test(binding?.sha256 ?? "")
    )
      violations.push(`identity_${key}_binding_invalid`);
  }
  const rawPackage = value?.rawPackage;
  if (rawPackage?.artifactId !== "nhm2.primary_raw_output_manifest")
    violations.push("raw_package_artifact_id_invalid");
  if (rawPackage?.contractVersion !== "nhm2_primary_raw_output_manifest/v1")
    violations.push("raw_package_contract_version_invalid");
  if (!isPortableRelativePath(rawPackage?.manifestRelativePath))
    violations.push("raw_package_manifest_path_invalid");
  for (const [key, digest] of Object.entries({
    manifest: rawPackage?.manifestSha256,
    content_policy: rawPackage?.contentPolicySha256,
    input_closure: rawPackage?.inputClosureSha256,
    verified_file_inventory: rawPackage?.verifiedFileInventorySha256,
  })) {
    if (!SHA256.test(digest ?? ""))
      violations.push(`raw_package_${key}_sha256_invalid`);
  }
  if (
    value?.projectionPolicy?.artifactId !==
      NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID ||
    value?.projectionPolicy?.contractVersion !==
      NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION ||
    value?.projectionPolicy?.semanticSha256 !==
      NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256
  ) {
    violations.push("projection_policy_binding_invalid");
  }
  const freeze = value?.freeze;
  if (
    freeze?.policyId !== NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_POLICY_ID ||
    freeze?.policyVersion !==
      NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_POLICY_VERSION ||
    freeze?.frozenBeforeIndependentRun !== true
  ) {
    violations.push("freeze_policy_invalid");
  }
  for (const [key, entry] of Object.entries({
    registrationId: freeze?.registrationId,
    independentRequestId: freeze?.independentRequestId,
    independentRunId: freeze?.independentRunId,
  })) {
    if (!validIdentifier(entry)) violations.push(`freeze_${key}_invalid`);
  }
  if (!SHA256.test(freeze?.independentPlanSha256 ?? ""))
    violations.push("freeze_independent_plan_sha256_invalid");
  if (!validIso(freeze?.projectionCompletedAt))
    violations.push("freeze_projection_completed_at_invalid");
  if (
    validIso(value?.generatedAt) &&
    validIso(freeze?.projectionCompletedAt) &&
    value.generatedAt !== freeze.projectionCompletedAt
  ) {
    violations.push("generated_at_projection_completed_at_mismatch");
  }
  if (
    !Array.isArray(value?.fields) ||
    value.fields.length !==
      NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.length
  ) {
    violations.push("field_count_invalid");
  }
  const allPaths: string[] = [];
  for (const [
    index,
    policy,
  ] of NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.entries()) {
    const field = value?.fields?.[index];
    const label = `field_${index}`;
    if (field?.ordinal !== index + 1)
      violations.push(`${label}_ordinal_invalid`);
    if (field?.fieldId !== policy.fieldId)
      violations.push(`${label}_field_id_invalid`);
    if (!sameStrings(field?.componentOrder ?? [], policy.componentOrder))
      violations.push(`${label}_component_order_invalid`);
    if (!sameStrings(field?.componentUnits ?? [], policy.componentUnits))
      violations.push(`${label}_component_units_invalid`);
    const expectedSourceKeys = policy.rawSources.map(sourceKey);
    const observedSourceKeys = (field?.rawSources ?? []).map(sourceKey);
    if (!sameStrings(observedSourceKeys, expectedSourceKeys))
      violations.push(`${label}_raw_source_order_invalid`);
    for (const [sourceIndex, source] of (field?.rawSources ?? []).entries()) {
      if (
        !validIdentifier(source?.fileId) ||
        !isPortableRelativePath(source?.path) ||
        !SHA256.test(source?.sha256 ?? "") ||
        !Number.isSafeInteger(source?.sizeBytes) ||
        source.sizeBytes <= 0
      ) {
        violations.push(`${label}_raw_source_binding_invalid:${sourceIndex}`);
      }
    }
    if (
      field?.projectionOperator?.operatorId !== policy.projectionOperatorId ||
      field?.projectionOperator?.derivationId !== policy.projectionDerivationId
    ) {
      violations.push(`${label}_projection_operator_invalid`);
    }
    validateArray(field?.output, policy, `${label}_output`, violations);
    if (
      field?.orderedDomainOperator?.operatorId !==
        policy.orderedDomainOperatorId ||
      field?.orderedDomainOperator?.rowIdentitySchemaId !==
        policy.orderedDomainRowIdentitySchemaId
    ) {
      violations.push(`${label}_ordered_domain_operator_invalid`);
    }
    const domain = field?.orderedDomain;
    if (
      domain?.artifactId !==
        NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID ||
      domain?.contractVersion !==
        NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION ||
      !isPortableRelativePath(domain?.path) ||
      !SHA256.test(domain?.sha256 ?? "") ||
      !SHA256.test(domain?.orderedRowsSha256 ?? "") ||
      !Number.isSafeInteger(domain?.sizeBytes) ||
      domain.sizeBytes <= 0 ||
      !Number.isSafeInteger(domain?.rowCount) ||
      domain.rowCount < policy.minimumSampleCount ||
      domain.rowCount !== field?.output?.shape?.[0]
    ) {
      violations.push(`${label}_ordered_domain_binding_invalid`);
    }
    if (
      field?.uncertainty?.operatorId !== policy.uncertaintyOperatorId ||
      field?.uncertainty?.derivationId !== policy.uncertaintyDerivationId ||
      field?.uncertainty?.coverage !== policy.uncertaintyCoverage ||
      field?.uncertainty?.confidenceLevelAtLeast !== 0.95
    ) {
      violations.push(`${label}_uncertainty_derivation_invalid`);
    }
    validateArray(
      field?.uncertainty?.output,
      policy,
      `${label}_uncertainty_output`,
      violations,
    );
    if (
      field?.uncertainty?.output?.shape?.[0] !== field?.output?.shape?.[0] ||
      field?.uncertainty?.output?.shape?.[1] !== field?.output?.shape?.[1]
    ) {
      violations.push(`${label}_uncertainty_shape_mismatch`);
    }
    allPaths.push(
      field?.output?.path,
      domain?.path,
      field?.uncertainty?.output?.path,
    );
  }
  if (
    allPaths.some((entry) => typeof entry !== "string") ||
    new Set(allPaths).size !== allPaths.length
  )
    violations.push("projection_paths_not_unique");
  const boundary = value?.claimBoundary;
  if (
    boundary?.diagnosticComparisonInputOnly !== true ||
    boundary?.independentComparisonStillRequired !== true ||
    boundary?.empiricalReceiptsStillRequired !== true ||
    boundary?.theoryClosureEstablished !== false ||
    boundary?.physicalViabilityEstablished !== false ||
    boundary?.transportEstablished !== false ||
    boundary?.propulsionEstablished !== false ||
    boundary?.routeEtaEstablished !== false ||
    boundary?.certifiedSpeedEstablished !== false
  ) {
    violations.push("claim_boundary_invalid");
  }
  return [...new Set(violations)];
};

export const isNhm2PrimaryComparisonProjectionManifestV1 = (
  value: unknown,
): value is Nhm2PrimaryComparisonProjectionManifestV1 =>
  nhm2PrimaryComparisonProjectionManifestViolations(
    value as Nhm2PrimaryComparisonProjectionManifestV1,
  ).length === 0;
