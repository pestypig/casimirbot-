export const NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID =
  "nhm2.primary_raw_content_policy" as const;
export const NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION =
  "nhm2_primary_raw_content_policy/v1" as const;

export const NHM2_PRIMARY_RAW_REQUIRED_APPARATUS_TERMS = [
  "casimir_material_field",
  "supports",
  "anchors",
  "housing",
  "controls",
  "switching_return",
  "thermal_return",
  "electromagnetic_return",
  "mechanical_return",
] as const;

export type Nhm2PrimaryRawRequiredApparatusTerm =
  (typeof NHM2_PRIMARY_RAW_REQUIRED_APPARATUS_TERMS)[number];

export const NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS = [
  "DeltaTmunu_xt",
  "delta_phi_f",
  "delta_tau",
  "delta_F",
  "h00_proxy",
  "R_0i0j",
] as const;

export type Nhm2PrimaryRawRequiredObservableId =
  (typeof NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS)[number];

export const NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID = {
  DeltaTmunu_xt: "J/m^3",
  delta_phi_f: "rad",
  delta_tau: "s",
  delta_F: "N",
  h00_proxy: "1",
  R_0i0j: "1/s^2",
} as const satisfies Record<Nhm2PrimaryRawRequiredObservableId, string>;

/**
 * Observable derivations may only cite numerical primitives from these parent
 * families. The replay additionally rejects every role marked comparison-only.
 */
export const NHM2_PRIMARY_RAW_OBSERVABLE_SOURCE_FAMILY_IDS = [
  "semiclassical_state",
  "finite_temperature_finite_geometry_maxwell_stress",
  "mechanical_support_control_margin",
  "full_apparatus_source_tensor",
  "covariant_conservation",
  "continuous_observer_optimizer",
  "worldline_qei",
  "dynamic_backreaction_stability_causality",
] as const;

export type Nhm2PrimaryRawNumericalContentPolicyV1 = {
  kind: "numerical_array";
  rank: 2;
  minimumFirstAxis: number;
  componentOrder: readonly string[];
  unit: string;
  producerValueIsComparisonOnly: boolean;
};

export type Nhm2PrimaryRawRecordFieldPolicyV1 = {
  name: string;
  type:
    "boolean" | "int64" | "float64" | "string" | "timestamp_iso8601" | "sha256";
  unit: string | null;
  nullable: boolean;
};

export type Nhm2PrimaryRawRecordContentPolicyV1 = {
  kind: "records";
  format: "ndjson";
  minimumRecordCount: number;
  schemaId: string;
  schemaVersion: string;
  primaryKey: readonly string[];
  fields: readonly Nhm2PrimaryRawRecordFieldPolicyV1[];
  producerValueIsComparisonOnly: false;
};

export type Nhm2PrimaryRawRoleContentPolicyV1 =
  Nhm2PrimaryRawNumericalContentPolicyV1 | Nhm2PrimaryRawRecordContentPolicyV1;

const numerical = (
  minimumFirstAxis: number,
  componentOrder: readonly string[],
  unit: string,
  producerValueIsComparisonOnly = false,
): Nhm2PrimaryRawNumericalContentPolicyV1 => ({
  kind: "numerical_array",
  rank: 2,
  minimumFirstAxis,
  componentOrder,
  unit,
  producerValueIsComparisonOnly,
});

const field = (
  name: string,
  type: Nhm2PrimaryRawRecordFieldPolicyV1["type"],
  unit: string | null = null,
  nullable = false,
): Nhm2PrimaryRawRecordFieldPolicyV1 => ({ name, type, unit, nullable });

const records = (
  schemaId: string,
  minimumRecordCount: number,
  primaryKey: readonly string[],
  fields: readonly Nhm2PrimaryRawRecordFieldPolicyV1[],
): Nhm2PrimaryRawRecordContentPolicyV1 => ({
  kind: "records",
  format: "ndjson",
  minimumRecordCount,
  schemaId,
  schemaVersion: `${schemaId}/v1`,
  primaryKey,
  fields,
  producerValueIsComparisonOnly: false,
});

const scalar = ["value"] as const;
const complex = ["real", "imag"] as const;
const spacetimeVector = ["c0", "c1", "c2", "c3"] as const;
const spatialVector = ["x", "y", "z"] as const;
const tensor10 = [
  "t00",
  "t01",
  "t02",
  "t03",
  "t11",
  "t12",
  "t13",
  "t22",
  "t23",
  "t33",
] as const;
const spatialTensor6 = ["xx", "xy", "xz", "yy", "yz", "zz"] as const;
const complexDyadic18 = [
  "xx_real",
  "xx_imag",
  "xy_real",
  "xy_imag",
  "xz_real",
  "xz_imag",
  "yx_real",
  "yx_imag",
  "yy_real",
  "yy_imag",
  "yz_real",
  "yz_imag",
  "zx_real",
  "zx_imag",
  "zy_real",
  "zy_imag",
  "zz_real",
  "zz_imag",
] as const;

const sampleRegionFields = [
  field("sample_id", "string"),
  field("region_id", "string"),
] as const;

const deepFreeze = <Value>(value: Value): Value => {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
};

/**
 * Frozen, non-vacuous primitive-output policy. A comparison-only entry may be
 * emitted for solver cross-checking, but an outer replay must recompute it from
 * the primitive entries before it can influence a diagnostic disposition.
 */
const NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES_VALUE = {
  semiclassical_state: {
    mode_basis_samples: numerical(64, complex, "candidate_normalized"),
    state_mode_coefficients: numerical(64, complex, "candidate_normalized"),
    mode_tensor_contribution_components: numerical(64, tensor10, "J/m^3"),
    two_point_function_samples: numerical(
      64,
      complex,
      "candidate_normalized",
      true,
    ),
    renormalization_subtraction_samples: numerical(64, tensor10, "J/m^3"),
    renormalized_tensor_components: numerical(64, tensor10, "J/m^3", true),
    ward_divergence_components: numerical(64, spacetimeVector, "J/m^4", true),
    switching_profile_samples: numerical(
      64,
      ["value", "first_derivative", "second_derivative"],
      "candidate_normalized",
    ),
    renormalization_inputs: records(
      "nhm2_semiclassical_renormalization_input",
      4,
      ["parameter_id"],
      [
        field("parameter_id", "string"),
        field("value", "float64", "candidate_normalized"),
        field("source_sha256", "sha256"),
      ],
    ),
    uncertainty_samples: numerical(
      64,
      ["lower95", "central", "upper95"],
      "J/m^3",
    ),
    backreaction_iteration_fields: numerical(3, tensor10, "J/m^3"),
  },
  finite_temperature_finite_geometry_maxwell_stress: {
    geometry_mesh_records: records(
      "nhm2_casimir_geometry_tetrahedron",
      64,
      ["cell_id"],
      [
        field("cell_id", "string"),
        field("node0", "int64"),
        field("node1", "int64"),
        field("node2", "int64"),
        field("node3", "int64"),
        field("material_region_id", "string"),
      ],
    ),
    material_region_records: records(
      "nhm2_casimir_material_region",
      2,
      ["material_region_id"],
      [
        field("material_region_id", "string"),
        field("material_model_id", "string"),
        field("measurement_receipt_sha256", "sha256"),
      ],
    ),
    dielectric_response_samples: numerical(
      64,
      [
        "omega",
        "temperature",
        "epsilon_real",
        "epsilon_imag",
        "mu_real",
        "mu_imag",
      ],
      "candidate_normalized",
    ),
    matsubara_mode_samples: numerical(
      64,
      ["temperature", "mode_index", "xi", "quadrature_weight"],
      "candidate_normalized",
    ),
    electric_green_dyadic_components: numerical(
      64,
      complexDyadic18,
      "candidate_normalized",
    ),
    magnetic_green_dyadic_components: numerical(
      64,
      complexDyadic18,
      "candidate_normalized",
    ),
    electric_field_correlation_components: numerical(
      64,
      spatialTensor6,
      "candidate_normalized",
    ),
    magnetic_field_correlation_components: numerical(
      64,
      spatialTensor6,
      "candidate_normalized",
    ),
    integration_surface_samples: numerical(
      64,
      ["x", "y", "z", "nx", "ny", "nz", "weight"],
      "candidate_normalized",
    ),
    maxwell_stress_components: numerical(64, spatialTensor6, "Pa", true),
    force_gap_gradient_samples: numerical(
      16,
      ["gap", "force", "force_gradient"],
      "candidate_normalized",
      true,
    ),
    roughness_patch_temperature_samples: numerical(
      64,
      ["roughness_rms", "patch_rms", "temperature", "stress_delta"],
      "candidate_normalized",
    ),
    mesh_frequency_refinement_samples: numerical(
      3,
      ["resolution", "observable", "estimated_error"],
      "candidate_normalized",
    ),
  },
  mechanical_support_control_margin: {
    fea_mesh_records: records(
      "nhm2_mechanical_tetrahedron",
      64,
      ["cell_id"],
      [
        field("cell_id", "string"),
        field("node0", "int64"),
        field("node1", "int64"),
        field("node2", "int64"),
        field("node3", "int64"),
        field("material_id", "string"),
      ],
    ),
    material_constitutive_records: records(
      "nhm2_mechanical_constitutive_material",
      1,
      ["material_id"],
      [
        field("material_id", "string"),
        field("model_id", "string"),
        field("coupon_receipt_sha256", "sha256"),
      ],
    ),
    boundary_condition_records: records(
      "nhm2_mechanical_boundary_condition",
      1,
      ["boundary_id"],
      [
        field("boundary_id", "string"),
        field("node_set_ref", "string"),
        field("condition_id", "string"),
        field("value_ref", "string"),
      ],
    ),
    stiffness_matrix_entries: records(
      "nhm2_mechanical_stiffness_entry",
      64,
      ["row_index", "column_index"],
      [
        field("row_index", "int64"),
        field("column_index", "int64"),
        field("value", "float64", "N/m"),
      ],
    ),
    load_vector_components: numerical(64, spatialVector, "N"),
    displacement_components: numerical(64, spatialVector, "m"),
    stress_strain_components: numerical(
      64,
      [
        "stress_xx",
        "stress_xy",
        "stress_xz",
        "stress_yy",
        "stress_yz",
        "stress_zz",
        "strain_xx",
        "strain_xy",
        "strain_xz",
        "strain_yy",
        "strain_yz",
        "strain_zz",
      ],
      "candidate_normalized",
      true,
    ),
    residual_force_components: numerical(64, spatialVector, "N", true),
    stability_mode_samples: numerical(
      16,
      ["frequency", "damping", "growth_rate"],
      "candidate_normalized",
    ),
    support_retention_samples: numerical(
      64,
      [
        "support_fraction",
        "structural_margin",
        "retention_fraction",
        "source_retention_margin",
        "stress",
      ],
      "candidate_normalized",
      true,
    ),
    active_control_cycle_samples: numerical(
      64,
      ["time", "force", "displacement", "power", "energy", "temperature"],
      "candidate_normalized",
    ),
    fabrication_tolerance_samples: numerical(
      64,
      ["gap_error", "roughness", "alignment_error", "margin"],
      "candidate_normalized",
    ),
    energy_heat_noise_samples: numerical(
      64,
      ["energy", "heat", "noise", "timing_fraction"],
      "candidate_normalized",
    ),
  },
  full_apparatus_source_tensor: {
    apparatus_term_ledger: records(
      "nhm2_apparatus_source_term",
      1,
      ["term_id"],
      [
        field("term_id", "string"),
        field("term_category", "string"),
        field("producer_id", "string"),
        field("source_field_ref", "string"),
        field("source_file_id", "string"),
        field("source_sha256", "sha256"),
        field("constitutive_file_id", "string"),
        field("constitutive_sha256", "sha256"),
        field("tensor_file_id", "string"),
        field("sample_offset", "int64"),
        field("sample_count", "int64"),
        field("coefficient", "float64", "1"),
        field("tensor_sha256", "sha256"),
        field("returned_to_source_tensor", "boolean"),
        field("metric_target_dependency_count", "int64"),
        field("forbidden_target_echo_count", "int64"),
      ],
    ),
    grid_topology_records: records(
      "nhm2_same_chart_grid_sample",
      64,
      ["sample_id"],
      [
        ...sampleRegionFields,
        field("i", "int64"),
        field("j", "int64"),
        field("k", "int64"),
      ],
    ),
    coordinate_samples: numerical(64, ["t", "x", "y", "z"], "m"),
    term_tensor_components: numerical(64, tensor10, "J/m^3"),
    total_tensor_components: numerical(64, tensor10, "J/m^3", true),
    metric_tensor_components: numerical(64, tensor10, "1"),
    metric_required_tensor_components: numerical(64, tensor10, "J/m^3", true),
    residual_components: numerical(64, tensor10, "J/m^3", true),
    integration_weight_mask_samples: numerical(
      64,
      ["quadrature_weight", "mask_weight"],
      "candidate_normalized",
    ),
    normalization_samples: numerical(
      10,
      ["scale", "offset"],
      "candidate_normalized",
    ),
    source_provenance_edges: records(
      "nhm2_source_provenance_edge",
      1,
      ["edge_id"],
      [
        field("edge_id", "string"),
        field("parent_term_id", "string"),
        field("child_term_id", "string"),
        field("relation_id", "string"),
        field("source_sha256", "sha256"),
      ],
    ),
  },
  covariant_conservation: {
    derivative_stencil_records: records(
      "nhm2_derivative_stencil_entry",
      8,
      ["stencil_id", "axis_id", "offset"],
      [
        field("stencil_id", "string"),
        field("axis_id", "string"),
        field("offset", "int64"),
        field("coefficient", "float64", "1"),
        field("observed_order", "float64", "1"),
      ],
    ),
    connection_coefficient_components: numerical(
      64,
      Array.from({ length: 64 }, (_, index) => `gamma_${index}`),
      "1/m",
      true,
    ),
    tensor_derivative_components: numerical(
      64,
      Array.from({ length: 40 }, (_, index) => `dt_${index}`),
      "J/m^4",
      true,
    ),
    divergence_components: numerical(64, spacetimeVector, "J/m^4", true),
    switching_transition_components: numerical(64, tensor10, "J/m^3"),
    support_control_source_components: numerical(64, tensor10, "J/m^3"),
    boundary_normal_weight_samples: numerical(
      64,
      ["n0", "n1", "n2", "n3", "weight"],
      "candidate_normalized",
    ),
    boundary_flux_components: numerical(64, spacetimeVector, "J/m^3", true),
    cycle_energy_samples: numerical(
      64,
      ["time", "source_energy", "flux_energy", "control_energy", "residual"],
      "candidate_normalized",
      true,
    ),
    refinement_samples: numerical(
      3,
      ["resolution", "residual", "estimated_error"],
      "candidate_normalized",
    ),
    uncertainty_samples: numerical(
      64,
      ["lower95", "central", "upper95"],
      "J/m^4",
    ),
  },
  continuous_observer_optimizer: {
    spatial_sample_index: records(
      "nhm2_observer_spatial_sample",
      64,
      ["sample_id"],
      sampleRegionFields,
    ),
    energy_condition_optimizer_bindings: records(
      "nhm2_observer_energy_condition_optimizer_binding",
      192,
      ["binding_id"],
      [
        field("binding_id", "string"),
        field("sample_id", "string"),
        field("energy_condition_id", "string"),
        field("objective_formula_id", "string"),
        field("optimum_row", "int64"),
        field("trace_offset", "int64"),
        field("trace_count", "int64"),
        field("adversarial_start_offset", "int64"),
        field("adversarial_start_count", "int64"),
        field("globality_offset", "int64"),
        field("globality_count", "int64"),
      ],
    ),
    timelike_observer_vectors: numerical(64, spacetimeVector, "1"),
    condition_optimum_timelike_vectors: numerical(192, spacetimeVector, "1"),
    condition_optimum_objective_samples: numerical(192, scalar, "J/m^3", true),
    null_direction_vectors: numerical(8192, spacetimeVector, "1"),
    tensor_contraction_samples: numerical(
      8192,
      ["timelike_contraction", "null_contraction", "energy_flux_norm"],
      "J/m^3",
      true,
    ),
    energy_condition_extrema: numerical(
      64,
      ["wec_value", "nec_value", "dec_margin"],
      "J/m^3",
      true,
    ),
    optimizer_trace_samples: numerical(
      192,
      ["iteration", "gradient_norm", "step_norm"],
      "candidate_normalized",
      true,
    ),
    optimizer_trace_objective_samples: numerical(192, scalar, "J/m^3", true),
    adversarial_start_samples: numerical(384, spacetimeVector, "1"),
    adversarial_start_objective_samples: numerical(384, scalar, "J/m^3", true),
    globality_search_samples: numerical(
      576,
      ["resolution", "start_count"],
      "candidate_normalized",
    ),
    globality_objective_samples: numerical(
      576,
      ["best_value", "spread"],
      "J/m^3",
      true,
    ),
    uncertainty_samples: numerical(
      64,
      ["lower95", "central", "upper95"],
      "J/m^3",
    ),
  },
  worldline_qei: {
    worldline_catalog: records(
      "nhm2_qei_worldline",
      24,
      ["worldline_id"],
      [
        field("worldline_id", "string"),
        field("region_id", "string"),
        field("sampling_family_id", "string"),
        field("sample_offset", "int64"),
        field("sample_count", "int64"),
      ],
    ),
    worldline_apparatus_interpolation_entries: records(
      "nhm2_qei_worldline_apparatus_interpolation_entry",
      1536,
      ["worldline_sample_index", "entry_index"],
      [
        field("worldline_id", "string"),
        field("worldline_sample_index", "int64"),
        field("entry_index", "int64"),
        field("apparatus_sample_index", "int64"),
        field("weight", "float64", "1"),
      ],
    ),
    trajectory_components: numerical(1536, ["t", "x", "y", "z"], "m"),
    proper_time_samples: numerical(1536, ["tau", "quadrature_weight"], "s"),
    four_velocity_components: numerical(1536, spacetimeVector, "1"),
    acceleration_curvature_components: numerical(
      1536,
      ["a0", "a1", "a2", "a3", "curvature", "torsion", "jerk", "snap"],
      "candidate_normalized",
    ),
    pulled_back_tensor_components: numerical(1536, tensor10, "J/m^3", true),
    pulled_back_metric_components: numerical(1536, tensor10, "1", true),
    contracted_tensor_samples: numerical(1536, scalar, "J/m^3", true),
    sampling_function_samples: numerical(
      1536,
      ["tau", "g", "g_first", "g_second"],
      "candidate_normalized",
    ),
    quadrature_integrand_samples: numerical(
      1536,
      ["tau", "weighted_energy", "quadrature_weight"],
      "candidate_normalized",
      true,
    ),
    theorem_bound_inputs: numerical(
      24,
      ["curvature", "acceleration_squared", "sampling_width", "bound_density"],
      "candidate_normalized",
    ),
    uncertainty_samples: numerical(
      1536,
      ["lower95", "central", "upper95"],
      "J/m^3",
    ),
  },
  dynamic_backreaction_stability_causality: {
    evolution_grid_records: records(
      "nhm2_dynamic_grid_sample",
      16,
      ["sample_id"],
      [
        ...sampleRegionFields,
        field("time_index", "int64"),
        field("grid_index", "int64"),
      ],
    ),
    initial_data_components: numerical(
      16,
      Array.from({ length: 20 }, (_, index) => `initial_${index}`),
      "candidate_normalized",
    ),
    evolved_geometry_components: numerical(
      16,
      Array.from({ length: 20 }, (_, index) => `geometry_${index}`),
      "candidate_normalized",
    ),
    evolved_source_components: numerical(16, tensor10, "J/m^3"),
    gauge_field_components: numerical(
      16,
      spacetimeVector,
      "candidate_normalized",
    ),
    constraint_residual_components: numerical(
      16,
      ["hamiltonian", "momentum_x", "momentum_y", "momentum_z", "gauge"],
      "candidate_normalized",
      true,
    ),
    backreaction_iteration_fields: numerical(16, tensor10, "J/m^3"),
    characteristic_ray_samples: numerical(
      16,
      ["affine_parameter", "t", "x", "y", "z", "frequency", "expansion"],
      "candidate_normalized",
    ),
    perturbation_mode_samples: numerical(
      16,
      ["time", "mode_real", "mode_imag", "growth_rate"],
      "candidate_normalized",
    ),
    causal_screen_samples: numerical(
      16,
      [
        "timelike_gradient",
        "interval_squared",
        "affine_parameter",
        "outgoing_expansion",
        "hyperbolicity_margin",
      ],
      "candidate_normalized",
    ),
    parameter_neighborhood_samples: numerical(
      64,
      ["parameter_delta", "margin", "uncertainty95"],
      "candidate_normalized",
    ),
    boundary_flux_samples: numerical(
      16,
      ["time", "energy_flux", "momentum_x", "momentum_y", "momentum_z"],
      "candidate_normalized",
    ),
    resolution_refinement_samples: numerical(
      3,
      ["resolution", "constraint_norm", "estimated_error"],
      "candidate_normalized",
    ),
  },
  observable_projection: {
    observable_definition_records: records(
      "nhm2_numerical_observable_definition",
      6,
      ["observable_id"],
      [
        field("observable_id", "string"),
        field("target_time", "timestamp_iso8601"),
        field("unit", "string"),
        field("projection_id", "string"),
      ],
    ),
    observable_sample_vectors: numerical(
      6,
      ["target_time_offset", "predicted_value", "uncertainty95"],
      "candidate_normalized",
      true,
    ),
    projection_derivation_inputs: records(
      "nhm2_observable_projection_input",
      6,
      ["input_id"],
      [
        field("input_id", "string"),
        field("observable_id", "string"),
        field("source_file_id", "string"),
        field("source_sha256", "sha256"),
      ],
    ),
    projection_operator_entries: records(
      "nhm2_observable_projection_operator_entry",
      6,
      ["observable_id", "source_index"],
      [
        field("observable_id", "string"),
        field("source_index", "int64"),
        field("coefficient", "float64", "candidate_normalized"),
      ],
    ),
    projection_source_values: numerical(6, scalar, "candidate_normalized"),
    projection_jacobian_components: numerical(
      6,
      scalar,
      "candidate_normalized",
    ),
    projection_uncertainty_samples: numerical(
      6,
      ["lower95", "central", "upper95"],
      "candidate_normalized",
    ),
  },
} as const;

export const NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES = deepFreeze(
  NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES_VALUE,
);

export const NHM2_PRIMARY_RAW_CONTENT_POLICY = deepFreeze({
  artifactId: NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID,
  contractVersion: NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION,
  rawPrimitiveOutputsOnly: true,
  comparisonValuesHaveNoAuthority: true,
  outerReplayRequired: true,
  conventions: {
    spacetimeDimension: 4,
    metricSignature: "-+++",
    tensor10Variance: "covariant",
    tensor10ComponentOrder: tensor10,
    spacetimeVectorVariance: "contravariant",
    connectionCoefficientIndex: "upper_index_major_then_lower1_then_lower2",
    tensorDerivativeIndex: "derivative_axis_major_then_tensor10_component",
    apparatusTermLayout: "ledger_declared_row_slice",
    apparatusRequiredTerms: NHM2_PRIMARY_RAW_REQUIRED_APPARATUS_TERMS,
    apparatusSourceBinding:
      "each required term binds its packed tensor slice to separately hashed non-target raw source and constitutive files; declared zero target-dependency counts do not replace an independent non-echo audit",
    observerObjectiveLayout:
      "binding_record_declared_slices_by_sample_then_energy_condition",
    observerEnergyConditionOrder: ["wec", "sec", "dec"],
    observerObjectiveFormulaIds: {
      wec: "wec_tmunu_u_u/v1",
      sec: "sec_trace_reversed_tmunu_u_u/v1",
      dec: "dec_future_causal_margin/v1",
    },
    modeTensorLayout: "sample_major_then_mode_minor",
    matsubaraGreenDyadicLayout: "surface_major_then_mode_minor",
    worldlineLayout: "catalog_declared_row_slice",
    worldlineInterpolationLayout:
      "worldline_sample_index_then_entry_index_sparse",
    worldlineInterpolationWeightNormalization:
      "sum_weights_equals_one_per_worldline_sample",
    mechanicalDofLayout: "node_major_xyz",
    projectionOperatorLayout: "observable_id_by_source_index_sparse",
    projectionRequiredObservableIds: NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS,
    projectionObservableUnitById: NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID,
    projectionAllowedSourceFamilyIds:
      NHM2_PRIMARY_RAW_OBSERVABLE_SOURCE_FAMILY_IDS,
    projectionDerivationSourcePolicy:
      "filesystem_verified_upstream_numerical_non_comparison_role",
    projectionDimensionalNormalizationContract:
      "unresolved_v1_requires_source_component_unit_and_conversion_binding",
  },
  rolePolicies: NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES,
  claimBoundary: {
    theoryClosureClaimAllowed: false,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
    routeEtaClaimAllowed: false,
    speedClaimAllowed: false,
  },
} as const);
