import { z } from "zod";

export const CASIMIR_DP_APPARATUS_COHERENCE_RESIDUAL_STAGE4_2B_VERSION =
  "casimir_dp_apparatus_coherence_residual_stage4_2b_campaign/1" as const;

export const CASIMIR_DP_APPARATUS_COHERENCE_RESIDUAL_STAGE4_2B_RUN_ORDER = [
  "freeze_claim_policy_conventions_sources_and_upstream_authorities",
  "freeze_dp_manifest_external_bounds_ordinary_registry_and_bridge_policy",
  "validate_blind_generation_and_synthetic_custody_mode",
  "ingest_calibration_and_pilot_artifacts_only",
  "validate_object_mass_composition_density_geometry_and_hierarchy",
  "validate_complete_joint_system_branches_and_equivalence",
  "validate_material_response_kk_geometry_surfaces_and_solver_receipts",
  "fit_response_corrected_spectral_thermometry_from_pilot",
  "fit_sensor_noise_and_cross_spectral_response_from_pilot",
  "predict_all_registered_ordinary_phase_and_decoherence_lanes",
  "compute_frozen_dp_density_functional_scaling_and_companion",
  "reconcile_dp_manifests_and_conditional_boundary_identity",
  "construct_pilot_likelihood_residual_covariance_and_coverage",
  "forecast_signature_identifiability_power_and_coverage",
  "run_synthetic_recovery_and_fail_closed_fixtures",
  "freeze_code_exclusions_covariance_predictions_cells_and_scoring",
  "ingest_synthetic_held_out_artifacts_after_freeze",
  "estimate_held_out_complex_coherence_without_refitting",
  "retain_custodian_authority_and_prohibit_automatic_unblinding",
  "score_blinded_synthetic_held_out_comparison",
  "populate_outcome_claim_nonclaim_and_blocker_ledger",
  "write_content_addressed_report_receipt_and_downstream_evidence_state",
] as const;

const NonEmpty = z.string().min(1);
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const FrozenAxisId = z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);
const RunOrderStage = z.enum(
  CASIMIR_DP_APPARATUS_COHERENCE_RESIDUAL_STAGE4_2B_RUN_ORDER,
);

export const CASIMIR_DP_STAGE4_2B_REQUIRED_AUTHORITY_ROLES = [
  "stage3_config",
  "stage3_authority_manifest",
  "stage3_immutable_report_json",
  "stage3_immutable_report_markdown",
  "stage3_campaign_receipt",
  "stage3_downstream_verification_receipt",
  "stage4_config",
  "stage4_authority_manifest",
  "stage4_immutable_report_json",
  "stage4_immutable_report_markdown",
  "stage4_campaign_receipt",
  "stage4_downstream_verification_receipt",
  "stage4_1_config",
  "stage4_1_authority_manifest",
  "stage4_1_immutable_report_json",
  "stage4_1_immutable_report_markdown",
  "stage4_1_campaign_receipt",
  "stage4_1_downstream_verification_receipt",
  "stage4_2a_config",
  "stage4_2a_authority_manifest",
  "stage4_2a_immutable_report_json",
  "stage4_2a_immutable_report_markdown",
  "stage4_2a_campaign_receipt",
  "stage4_2a_downstream_verification_receipt",
  "proposal_closure_config_at_stage4_2b_freeze",
  "proposal_closure_report_at_stage4_2b_freeze",
  "data_readiness_config_at_stage4_2b_freeze",
  "data_readiness_report_at_stage4_2b_freeze",
] as const;

export const CASIMIR_DP_STAGE4_2B_REQUIRED_FIXTURE_CASE_IDS = [
  "ordinary_closure_only",
  "isolated_thermal_injection",
  "em_patch_injection",
  "vibration_and_correlated_tilt_injection",
  "residual_gas_injection",
  "optical_readout_injection",
  "correlated_covariance_false_residual",
  "strict_frozen_dp_injection",
  "generic_irreversible_non_dp_loss",
  "boundary_only_residual",
  "joint_system_branch_mismatch",
  "echo_recoverable_quasistatic_dephasing",
  "blind_label_leakage",
  "post_hoc_parameter_retuning_attempt",
  "signature_collinearity_failure",
  "underpowered_null",
  "sensor_self_noise_false_decoherence",
  "singular_covariance_jitter_rescue_attempt",
  "low_visibility_gaussian_coverage_failure",
] as const;

export const CASIMIR_DP_STAGE4_2B_REQUIRED_NUISANCE_CONTROL_AXES = [
  "temperature",
  "pressure",
  "vibration",
  "charge",
  "distance",
  "polarization",
  "readout_power",
] as const;

export const CASIMIR_DP_STAGE4_2B_CELL_AXIS_ORDER = [
  "partition_id",
  "replication_id",
  "object_configuration_id",
  "branch_separation_id",
  "hold_time_id",
  "sequence_kind",
  "boundary_or_control_state_id",
  "nuisance_control_axis_id",
  "nuisance_control_level_id",
] as const;

export const CASIMIR_DP_STAGE4_2B_REQUIRED_CELL_RECORD_FIELDS = [
  "cell_id",
  "cell_index",
  "partition_id",
  "replication_id",
  "object_configuration_id",
  "nominal_mass_kg",
  "nominal_radius_m",
  "branch_separation_id",
  "branch_separation_m",
  "hold_time_id",
  "hold_time_s",
  "sequence_kind",
  "boundary_or_control_state_id",
  "nuisance_control_axis_id",
  "nuisance_control_level_id",
] as const;

const AuthorityRef = z.object({
  role: NonEmpty,
  path: NonEmpty,
  sha256: Sha256,
  tracked: z.boolean(),
  required_at_runtime: z.literal(true),
}).strict();

const SourceRef = z.object({
  source_id: NonEmpty,
  citation: NonEmpty,
  url: z.string().url(),
  supports: NonEmpty,
  does_not_support: NonEmpty,
  numeric_values_admitted: z.boolean(),
}).strict();

const FixtureRef = z.object({
  role: z.literal("stage4_2b_synthetic_campaign_matrix"),
  path: z.literal(
    "configs/research/fixtures/casimir-dp-stage4-2b-campaign.synthetic.v1.json",
  ),
  sha256: Sha256,
  schema_version: z.literal("casimir_dp_stage4_2b_synthetic_campaign/1"),
  evidence_class: z.literal("synthetic_fixture"),
  required_case_ids: z.array(NonEmpty).length(19),
}).strict().superRefine((fixture, context) => {
  const ids = fixture.required_case_ids;
  const required = new Set(CASIMIR_DP_STAGE4_2B_REQUIRED_FIXTURE_CASE_IDS);
  if (
    new Set(ids).size !== ids.length ||
    ids.some(
      (id, index) =>
        id !== CASIMIR_DP_STAGE4_2B_REQUIRED_FIXTURE_CASE_IDS[index],
    ) ||
    ids.some((id) => !required.has(
      id as typeof CASIMIR_DP_STAGE4_2B_REQUIRED_FIXTURE_CASE_IDS[number],
    )) ||
    CASIMIR_DP_STAGE4_2B_REQUIRED_FIXTURE_CASE_IDS.some(
      (id) => !ids.includes(id),
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Stage-4.2B fixture case ids must exactly match the 19-case matrix",
    });
  }
});

const ObjectConfiguration = z.object({
  object_configuration_id: FrozenAxisId,
  material: NonEmpty,
  nominal_mass_kg: z.number().positive(),
  nominal_radius_m: z.number().positive(),
  nominal_bulk_density_kg_m3: z.number().positive(),
  independent_metrology_plan_id: NonEmpty,
  independent_metrology_required: z.literal(true),
  metrology_evidence_class: z.literal("design_assumption"),
  metrology_receipt_status: z.literal("not_ready"),
}).strict();

const ObjectConfigurations = z.array(ObjectConfiguration).min(3).superRefine(
  (configurations, context) => {
    const ids = configurations.map(
      (configuration) => configuration.object_configuration_id,
    );
    const metrologyPlanIds = configurations.map(
      (configuration) => configuration.independent_metrology_plan_id,
    );
    const physicalSignatures = configurations.map((configuration) =>
      [
        configuration.nominal_mass_kg,
        configuration.nominal_radius_m,
        configuration.nominal_bulk_density_kg_m3,
      ].join(":")
    );
    if (
      new Set(ids).size !== ids.length ||
      new Set(metrologyPlanIds).size !== metrologyPlanIds.length ||
      new Set(physicalSignatures).size !== physicalSignatures.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Stage-4.2B requires at least three distinct object configurations with unique independent metrology plans",
      });
    }
  },
);

const BranchSeparations = z.array(z.object({
  branch_separation_id: FrozenAxisId,
  separation_m: z.number().positive(),
}).strict()).min(2).superRefine((separations, context) => {
  const ids = separations.map((separation) => separation.branch_separation_id);
  const values = separations.map((separation) => separation.separation_m);
  const strictlyIncreasing = values.every(
    (value, index) => index === 0 || value > values[index - 1],
  );
  if (
    new Set(ids).size !== ids.length ||
    new Set(values).size !== values.length ||
    !strictlyIncreasing
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Stage-4.2B requires at least two uniquely identified, strictly increasing branch separations",
    });
  }
});

const HoldTimes = z.array(z.object({
  hold_time_id: FrozenAxisId,
  hold_time_s: z.number().nonnegative(),
}).strict()).min(4).superRefine((holdTimes, context) => {
  const ids = holdTimes.map((holdTime) => holdTime.hold_time_id);
  const values = holdTimes.map((holdTime) => holdTime.hold_time_s);
  const positiveValues = values.filter((value) => value > 0);
  const strictlyIncreasing = values.every(
    (value, index) => index === 0 || value > values[index - 1],
  );
  const positiveSpan = positiveValues.length > 0
    ? Math.max(...positiveValues) / Math.min(...positiveValues)
    : 0;
  if (
    new Set(ids).size !== ids.length ||
    new Set(values).size !== values.length ||
    values.filter((value) => value === 0).length !== 1 ||
    !strictlyIncreasing ||
    positiveSpan < 4
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Stage-4.2B requires at least four unique ordered hold times, exactly one zero-time intercept, and max-positive/min-positive span >= 4",
    });
  }
});

const NuisanceControlAxes = z.array(z.object({
  axis_id: z.enum(CASIMIR_DP_STAGE4_2B_REQUIRED_NUISANCE_CONTROL_AXES),
  level_ids: z.array(FrozenAxisId).min(2),
  minimum_levels: z.number().int().min(2),
  varied_independently_of_boundary_state: z.literal(true),
  other_nuisance_axes_held_nominal: z.literal(true),
  evidence_class: z.literal("design_assumption"),
}).strict().superRefine((axis, context) => {
  if (
    new Set(axis.level_ids).size !== axis.level_ids.length ||
    axis.level_ids.length < axis.minimum_levels
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Each Stage-4.2B nuisance-control axis requires unique frozen levels meeting minimum_levels",
    });
  }
})).length(
  CASIMIR_DP_STAGE4_2B_REQUIRED_NUISANCE_CONTROL_AXES.length,
).superRefine((axes, context) => {
  if (
    axes.some(
      (axis, index) =>
        axis.axis_id !==
          CASIMIR_DP_STAGE4_2B_REQUIRED_NUISANCE_CONTROL_AXES[index],
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Stage-4.2B nuisance-control axes must exactly match the frozen independent-axis order",
    });
  }
});

const ConfirmatoryDesignGrid = z.object({
  schema_version: z.literal(
    "casimir_dp_stage4_2b_confirmatory_design_grid/1",
  ),
  evidence_class: z.literal("design_assumption"),
  forecast_evidence_class: z.literal("synthetic_fixture"),
  measured_evidence: z.literal("not_ready"),
  claim_ceiling: z.literal("confirmatory_design_grid_contract_only"),
  promotion_allowed: z.literal(false),
  object_configurations: ObjectConfigurations,
  branch_separations: BranchSeparations,
  hold_times: HoldTimes,
  sequence_kinds: z.tuple([
    z.literal("ramsey"),
    z.literal("path_swap"),
    z.literal("echo"),
  ]),
  boundary_pair: z.object({
    states: z.tuple([
      z.object({
        boundary_state_id: FrozenAxisId,
        state_role: z.literal("active"),
      }).strict(),
      z.object({
        boundary_state_id: FrozenAxisId,
        state_role: z.literal("reference"),
      }).strict(),
    ]).superRefine((states, context) => {
      if (states[0].boundary_state_id === states[1].boundary_state_id) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Paired Stage-4.2B boundary-state ids must be distinct",
        });
      }
    }),
    paired_within_window: z.literal(true),
    randomized_order: z.literal(true),
    blinded_to_analysis: z.literal(true),
    blind_mapping_custody: z.literal("synthetic_contract_only"),
    automatic_unblinding_allowed: z.literal(false),
  }).strict(),
  boundary_controls: z.object({
    sham_switch: z.object({
      control_state_id: FrozenAxisId,
      required: z.literal(true),
      switching_waveform_matched: z.literal(true),
      matched_heating_required: z.literal(true),
    }).strict(),
    detuned_boundary: z.object({
      control_state_id: FrozenAxisId,
      required: z.literal(true),
      detuned_from_casimir_sensitive_configuration: z.literal(true),
    }).strict(),
  }).strict().superRefine((controls, context) => {
    if (
      controls.sham_switch.control_state_id ===
        controls.detuned_boundary.control_state_id
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Stage-4.2B sham-switch and detuned-boundary control-state ids must be distinct",
      });
    }
  }),
  nuisance_control_axes: NuisanceControlAxes,
  partitions: z.tuple([
    z.object({
      partition_id: FrozenAxisId,
      replication_id: FrozenAxisId,
      role: z.literal("pilot_training"),
      confirmatory_scoring_allowed: z.literal(false),
      nuisance_fit_allowed: z.literal(true),
      acquired_after_analysis_freeze: z.literal(false),
      independent_replication: z.literal(false),
      artifact_separation_from_primary: z.literal("disjoint_rows_and_artifacts"),
    }).strict(),
    z.object({
      partition_id: FrozenAxisId,
      replication_id: FrozenAxisId,
      role: z.literal("confirmatory_primary"),
      confirmatory_scoring_allowed: z.literal(true),
      nuisance_fit_allowed: z.literal(false),
      acquired_after_analysis_freeze: z.literal(true),
      independent_replication: z.literal(false),
      scored_separately: z.literal(true),
    }).strict(),
    z.object({
      partition_id: FrozenAxisId,
      replication_id: FrozenAxisId,
      role: z.literal("confirmatory_replication"),
      confirmatory_scoring_allowed: z.literal(true),
      nuisance_fit_allowed: z.literal(false),
      acquired_after_analysis_freeze: z.literal(true),
      independent_replication: z.literal(true),
      shares_experimental_units_with_primary: z.literal(false),
      independent_apparatus_run_and_operators_required: z.literal(true),
      scored_separately: z.literal(true),
    }).strict(),
  ]).superRefine((partitions, context) => {
    const partitionIds = partitions.map((partition) => partition.partition_id);
    const replicationIds = partitions.map(
      (partition) => partition.replication_id,
    );
    if (
      new Set(partitionIds).size !== partitions.length ||
      new Set(replicationIds).size !== partitions.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Stage-4.2B pilot, primary, and independent-replication partitions require unique partition and replication ids",
      });
    }
  }),
  cell_generation: z.object({
    physics_grid_policy: z.literal(
      "full_factorial_object_separation_hold_sequence_paired_boundary",
    ),
    control_cell_policy: z.literal(
      "independent_one_axis_at_a_time_with_sham_and_detuned_boundary",
    ),
    partition_coverage: z.literal(
      "same_frozen_axis_definition_primary_and_independent_replication",
    ),
    baseline_nuisance_control_axis_id: z.literal("nominal"),
    baseline_nuisance_control_level_id: z.literal("nominal"),
    axis_order: z.tuple([
      z.literal("partition_id"),
      z.literal("replication_id"),
      z.literal("object_configuration_id"),
      z.literal("branch_separation_id"),
      z.literal("hold_time_id"),
      z.literal("sequence_kind"),
      z.literal("boundary_or_control_state_id"),
      z.literal("nuisance_control_axis_id"),
      z.literal("nuisance_control_level_id"),
    ]),
    required_cell_record_fields: z.tuple([
      z.literal("cell_id"),
      z.literal("cell_index"),
      z.literal("partition_id"),
      z.literal("replication_id"),
      z.literal("object_configuration_id"),
      z.literal("nominal_mass_kg"),
      z.literal("nominal_radius_m"),
      z.literal("branch_separation_id"),
      z.literal("branch_separation_m"),
      z.literal("hold_time_id"),
      z.literal("hold_time_s"),
      z.literal("sequence_kind"),
      z.literal("boundary_or_control_state_id"),
      z.literal("nuisance_control_axis_id"),
      z.literal("nuisance_control_level_id"),
    ]),
    cell_id_template: z.literal(
      "{partition_id}__{replication_id}__{object_configuration_id}__{branch_separation_id}__{hold_time_id}__{sequence_kind}__{boundary_or_control_state_id}__{nuisance_control_axis_id}__{nuisance_control_level_id}",
    ),
    numeric_values_resolved_from_frozen_axis_ids: z.literal(true),
    duplicate_cell_ids_allowed: z.literal(false),
    order: z.literal("lexicographic_declared_axis_order"),
  }).strict(),
  alternative_design_sweep: z.object({
    allowed: z.literal(true),
    separate_from_frozen_proposal: z.literal(true),
    may_retroactively_change_feasibility_verdict: z.literal(false),
  }).strict(),
}).strict().superRefine((grid, context) => {
  const stateIds = [
    ...grid.boundary_pair.states.map((state) => state.boundary_state_id),
    grid.boundary_controls.sham_switch.control_state_id,
    grid.boundary_controls.detuned_boundary.control_state_id,
  ];
  if (new Set(stateIds).size !== stateIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Stage-4.2B boundary and control state ids must be globally unique",
    });
  }
});

export const CasimirDpApparatusCoherenceResidualStage4_2BConfig = z.object({
  schema_version: z.literal(
    CASIMIR_DP_APPARATUS_COHERENCE_RESIDUAL_STAGE4_2B_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.literal(
    "casimir-dp-apparatus-coherence-residual-stage4-2b-v1",
  ),
  implementation_version: z.literal("1.0.0"),
  evidence_cutoff: NonEmpty,
  evidence_class: z.literal("synthetic_fixture"),
  claim_ceiling: z.literal(
    "apparatus_coupled_residual_and_dp_scaling_sensitivity_forecast_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: AuthorityRef.extend({
    role: z.literal("stage4_2b_authority_manifest"),
    path: z.literal(
      "configs/research/casimir-dp-stage4-2b-authorities.v1.json",
    ),
  }).strict(),
  upstream_authorities: z.array(AuthorityRef).length(
    CASIMIR_DP_STAGE4_2B_REQUIRED_AUTHORITY_ROLES.length,
  ).superRefine(
    (authorities, context) => {
      const roles = authorities.map((authority) => authority.role);
      if (new Set(roles).size !== roles.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stage-4.2B authority roles must be unique",
        });
      }
      const required = new Set(CASIMIR_DP_STAGE4_2B_REQUIRED_AUTHORITY_ROLES);
      if (
        roles.some((role) => !required.has(
          role as typeof CASIMIR_DP_STAGE4_2B_REQUIRED_AUTHORITY_ROLES[number],
        )) ||
        CASIMIR_DP_STAGE4_2B_REQUIRED_AUTHORITY_ROLES.some(
          (role) => !roles.includes(role),
        )
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stage-4.2B authority roles must exactly match the frozen role set",
        });
      }
    },
  ),
  source_registry: z.array(SourceRef).min(14).superRefine(
    (sources, context) => {
      const ids = sources.map((source) => source.source_id);
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stage-4.2B source ids must be unique",
        });
      }
    },
  ),
  conventions: z.object({
    units: z.literal("SI"),
    phase_sign: z.literal("phase_a_minus_b"),
    boundary_contrast: z.literal("on_minus_off"),
    angular_frequency_relation: z.literal("omega=2*pi*f"),
    psd_sidedness: z.literal("two_sided"),
    psd_normalization: NonEmpty,
    residual_definition: z.literal(
      "minus_log_visibility_ratio_minus_ordinary_chi",
    ),
    dp_rate_definition: z.literal("Gamma_DP=E_G/hbar"),
  }).strict(),
  evidence_policy: z.object({
    parameter_transport_is_evidential_transport: z.literal(false),
    synthetic_can_validate_software_only: z.literal(true),
    synthetic_can_satisfy_measured_gate: z.literal(false),
    unexplained_residual_is_collapse: z.literal(false),
    boundary_residual_confirms_unmodified_dp: z.literal(false),
    conditional_boundary_null_scope: z.literal(
      "registered_nonrelativistic_markovian_mass_density_dp_with_complete_joint_system_equivalence_only",
    ),
    shared_constants_open_observable_bridge: z.literal(false),
    automatic_unblinding_allowed: z.literal(false),
    null_excludes_only_powered_preregistered_region: z.literal(true),
  }).strict(),
  apparatus: z.object({
    object_material: z.literal("silica"),
    nominal_radius_m: z.number().positive(),
    nominal_mass_kg: z.number().positive(),
    nominal_branch_separation_m: z.number().positive(),
    nominal_hold_time_s: z.number().positive(),
    nominal_surface_distance_m: z.number().positive(),
    nominal_environment_temperature_K: z.number().positive(),
    planned_paired_windows: z.number().int().positive(),
    state_preparation_evidence_class: z.literal("design_assumption"),
  }).strict(),
  confirmatory_design_grid: ConfirmatoryDesignGrid,
  apparatus_density_transport: z.object({
    transport_prescription: z.literal(
      "continuum_uniform_sphere_bulk_mass_geometry_transport_only",
    ),
    transport_role: z.literal(
      "apparatus_scale_and_complete_branch_density_design_input",
    ),
    dp_dynamics_implication: z.literal(
      "none_stage3_single_effective_gaussian_particle_remains_named_dp_model",
    ),
    model_limitation: z.literal(
      "uniform_sphere_transport_is_not_uniform_sphere_dp_dynamics",
    ),
    evidence_class: z.literal("design_assumption"),
    measured_density_receipts: z.literal("not_ready"),
  }).strict(),
  dp_applicability_manifest: z.object({
    model_id: z.literal("M_dp_regularized_synthetic_v1"),
    generator: z.literal("nonrelativistic_markovian_mass_density_dp"),
    density_prescription: z.literal("single_effective_gaussian_particle"),
    smearing_kernel: z.literal("gaussian_mass_density_smearing"),
    r0_m: z.number().positive(),
    r0_frozen_before_held_out: z.literal(true),
    fitted_amplitude_allowed: z.literal(false),
    boundary_variable_in_unmodified_generator: z.literal(false),
    complete_joint_system_equivalence_required_for_boundary_identity:
      z.literal(true),
    stage3_manifest_sha256: z.literal(
      "4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6",
    ),
    xenon_r0_parameter_map_status: z.literal("contextual_not_admitted"),
    xenon_bound_used_to_truncate_parameter_space: z.literal(false),
  }).strict(),
  thresholds: z.object({
    mass_conservation_relative_error_max: z.number().positive().lt(1),
    numerical_null_absolute_error_max_s: z.number().positive(),
    numerical_null_relative_error_max: z.number().positive().lt(1),
    branch_systematic_fraction_max: z.number().positive().lt(1),
    spectral_covariance_symmetry_tolerance: z.number().positive(),
    residual_covariance_condition_max: z.number().gt(1),
    minimum_temperature_fisher_information: z.number().positive(),
    minimum_signature_rank: z.number().int().min(4),
    maximum_abs_whitened_signature_cosine: z.number().gt(0).lt(0.98),
    augmented_design_condition_number_max: z.number().gt(1),
    minimum_power: z.number().gte(0.8).lt(1),
    maximum_false_positive_rate: z.number().gt(0).lt(0.5),
    minimum_companion_snr: z.number().gte(5),
  }).strict(),
  runtime_fixture: FixtureRef,
  software: z.object({
    runtime: z.literal("typescript"),
    runner: z.literal(
      "scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts",
    ),
    module_ids: z.tuple([
      z.literal("shared/casimir-dp-apparatus-scale-transport-stage4-2b.ts"),
      z.literal(
        "shared/casimir-dp-apparatus-spectral-thermometry-stage4-2b.ts",
      ),
      z.literal(
        "shared/casimir-dp-apparatus-response-covariance-stage4-2b.ts",
      ),
      z.literal("shared/casimir-dp-dp-scaling-forecast-stage4-2b.ts"),
      z.literal(
        "shared/casimir-dp-apparatus-coherence-residual-stage4-2b.ts",
      ),
      z.literal(
        "shared/casimir-dp-apparatus-identifiability-stage4-2b.ts",
      ),
      z.literal(
        "shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.ts",
      ),
    ]),
    reused_module_ids: z.array(NonEmpty).min(10),
  }).strict(),
  run_order: z.array(RunOrderStage).length(
    CASIMIR_DP_APPARATUS_COHERENCE_RESIDUAL_STAGE4_2B_RUN_ORDER.length,
  ).superRefine((stages, context) => {
    if (
      stages.some(
        (stage, index) =>
          stage !==
            CASIMIR_DP_APPARATUS_COHERENCE_RESIDUAL_STAGE4_2B_RUN_ORDER[index],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Stage-4.2B run_order must exactly preserve the frozen 22-stage order.",
      });
    }
  }),
  final_status_policy: z.object({
    software_and_synthetic_diagnostics: z.literal("pass"),
    measured_evidence: z.literal("not_ready"),
    ordinary_decoherence_closure: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    publication_claim: z.literal(
      "apparatus_power_and_identifiability_forecast_only",
    ),
  }).strict(),
}).strict();

export type CasimirDpApparatusCoherenceResidualStage4_2BConfig = z.infer<
  typeof CasimirDpApparatusCoherenceResidualStage4_2BConfig
>;
