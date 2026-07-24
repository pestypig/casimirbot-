// math-stage: diagnostic
import {
  ambientGravityPhaseControl,
  coherenceVisibilityFromRate,
  computeCasimirDpBoundaryPhase,
  computeCasimirDpInterference,
  staticForceProjectionPhase,
} from "./casimir-dp-phase-coherence";
import {
  type CasimirDpOrPhaseStage2Config as CasimirDpOrPhaseStage2ConfigType,
} from "./contracts/casimir-dp-or-phase-stage2.v1";
import {
  type CasimirDpProposalClosureConfig as CasimirDpProposalClosureConfigType,
} from "./contracts/casimir-dp-proposal-closure.v1";
import {
  computeDpCollapse,
  computeDpPotentialEnergyAudit,
  type TDpCollapseInput,
} from "./dp-collapse";
import { C2, HBAR, PI } from "./physics-const";

export type CasimirDpStage1GateSummary = {
  numerical_convergence_gate: "pass" | "not_ready";
  branch_sampling_gate: "pass" | "not_ready";
  provenance_gate: "pass" | "review" | "not_ready";
  experimental_bounds_gate: "pass" | "review" | "not_ready";
};

export type CasimirDpProposalGateSummary = {
  proposal_package: "pass" | "not_ready";
  measured_switching_and_decoherence_evidence: "pass" | "not_ready";
  collapse_identification: "diagnostic_ready" | "blocked";
  manifold_dynamics: "diagnostic_ready" | "blocked";
};

export type CasimirDpStage1DpIdentity = {
  mass_kg: number;
  radius_m: number;
  branch_separation_m: number;
  ell_m: number;
};

function buildProposalSphereDpInput(args: {
  proposal: CasimirDpProposalClosureConfigType;
  config: CasimirDpOrPhaseStage2ConfigType;
  branchSeparationOffset_m?: number;
  gridDimension?: number;
}): TDpCollapseInput {
  const architecture = args.proposal.architecture;
  const radius = architecture.particle_radius_m;
  const mass =
    (4 / 3) * PI * radius ** 3 * architecture.particle_density_kg_m3;
  const separation =
    architecture.branch_separation_m + (args.branchSeparationOffset_m ?? 0);
  if (!(separation > 0)) {
    throw new Error("casimir_dp_stage2_nonpositive_branch_separation");
  }
  const dimension =
    args.gridDimension ?? args.config.dp_audit.grid_dimension;
  const halfSpan =
    radius +
    architecture.branch_separation_m / 2 +
    args.config.dp_audit.padding_radii * radius;
  const voxel = (2 * halfSpan) / dimension;
  return {
    schema_version: "dp_collapse/1",
    ell_m: args.config.dp_audit.ell_m,
    grid: {
      dims: [dimension, dimension, dimension],
      voxel_size_m: [voxel, voxel, voxel],
      origin_m: [0, 0, 0],
    },
    branch_a: {
      kind: "analytic",
      label: `${args.proposal.proposal_id}-stage2-branch-a`,
      primitives: [{
        kind: "sphere",
        mass_kg: mass,
        radius_m: radius,
        center_m: [-separation / 2, 0, 0],
      }],
    },
    branch_b: {
      kind: "analytic",
      label: `${args.proposal.proposal_id}-stage2-branch-b`,
      primitives: [{
        kind: "sphere",
        mass_kg: mass,
        radius_m: radius,
        center_m: [separation / 2, 0, 0],
      }],
    },
    method: {
      kernel: "plummer",
      max_voxels: args.config.dp_audit.max_voxels,
    },
    notes: [
      "Frozen proposal sphere and transverse branch separation.",
      "Analytic homogeneous-sphere input is inferred design evidence, not a measured density map.",
      "Boundary labels do not alter this input in the fixed-branch null replay.",
    ],
  };
}

function bridgeMissingFields(
  registration: CasimirDpOrPhaseStage2ConfigType["bridge_registration"],
): string[] {
  const required = [
    "model_id",
    "source_ref",
    "renormalized_stress_tensor_prescription",
    "stress_noise_kernel_prescription",
    "causal_metric_response_kernel",
    "gauge_and_coordinate_contract",
    "metric_to_coherence_dynamics",
    "consistency_or_complete_positivity_proof",
    "standard_qed_and_dp_recovery_limit",
    "frozen_parameter_manifest",
  ] as const;
  return required.filter((field) => registration[field] == null);
}

export function buildCasimirDpOrPhaseStage2Report(args: {
  config: CasimirDpOrPhaseStage2ConfigType;
  proposal: CasimirDpProposalClosureConfigType;
  stage1Gates: CasimirDpStage1GateSummary;
  stage1DpIdentity: CasimirDpStage1DpIdentity;
  proposalGates: CasimirDpProposalGateSummary;
  upstreamIntegrity: Array<{
    role: "stage1_gated_computations" | "proposal_closure";
    path: string;
    expected_sha256: string;
    actual_sha256: string;
    gate: "pass" | "not_ready";
  }>;
  now?: Date;
}) {
  const architecture = args.proposal.architecture;
  const particleMass =
    (4 / 3) *
    PI *
    architecture.particle_radius_m ** 3 *
    architecture.particle_density_kg_m3;
  const observationTime = architecture.observation_time_s;
  const branchSeparation = architecture.branch_separation_m;
  const planckConstant = 2 * PI * HBAR;

  const dpInput = buildProposalSphereDpInput({
    proposal: args.proposal,
    config: args.config,
  });
  const dp = computeDpCollapse(dpInput);
  const stage1InputComparisons = [
    {
      field: "mass_kg" as const,
      stage1_value: args.stage1DpIdentity.mass_kg,
      proposal_value: particleMass,
      matches: args.stage1DpIdentity.mass_kg === particleMass,
    },
    {
      field: "radius_m" as const,
      stage1_value: args.stage1DpIdentity.radius_m,
      proposal_value: architecture.particle_radius_m,
      matches:
        args.stage1DpIdentity.radius_m === architecture.particle_radius_m,
    },
    {
      field: "branch_separation_m" as const,
      stage1_value: args.stage1DpIdentity.branch_separation_m,
      proposal_value: branchSeparation,
      matches:
        args.stage1DpIdentity.branch_separation_m === branchSeparation,
    },
    {
      field: "ell_m" as const,
      stage1_value: args.stage1DpIdentity.ell_m,
      proposal_value: args.config.dp_audit.ell_m,
      matches: args.stage1DpIdentity.ell_m === args.config.dp_audit.ell_m,
    },
  ];
  const stage1InputIdentityPass = stage1InputComparisons.every(
    (comparison) => comparison.matches,
  );
  const proposalResolutionRows =
    args.config.dp_audit.resolution_grid_dimensions.map(
      (gridDimension, index, dimensions) => {
        const input = buildProposalSphereDpInput({
          proposal: args.proposal,
          config: args.config,
          gridDimension,
        });
        const result = computeDpCollapse(input);
        const previousResult = index === 0
          ? null
          : computeDpCollapse(buildProposalSphereDpInput({
            proposal: args.proposal,
            config: args.config,
            gridDimension: dimensions[index - 1],
          }));
        return {
          grid_dimension: gridDimension,
          voxel_size_m: input.grid.voxel_size_m,
          deltaE_J: result.deltaE_J,
          rate_s: result.tau_infinite ? 0 : 1 / result.tau_s,
          relative_change_from_prior:
            previousResult == null
              ? null
              : Math.abs(result.deltaE_J - previousResult.deltaE_J) /
                Math.max(Math.abs(result.deltaE_J), Number.MIN_VALUE),
          mass_relative_error_a:
            Math.abs(result.mass_a_kg - particleMass) / particleMass,
          mass_relative_error_b:
            Math.abs(result.mass_b_kg - particleMass) / particleMass,
          branch_mass_symmetry_relative_error:
            Math.abs(result.mass_a_kg - result.mass_b_kg) /
            Math.max(result.mass_a_kg, result.mass_b_kg, Number.MIN_VALUE),
          boundary_shell_mass_fraction_a:
            result.boundary_shell_mass_fraction_a,
          boundary_shell_mass_fraction_b:
            result.boundary_shell_mass_fraction_b,
        };
      },
    );
  const proposalResolutionSamplingPass = proposalResolutionRows.every(
    (row) =>
      row.mass_relative_error_a <=
        args.config.dp_audit.mass_conservation_relative_tolerance &&
      row.mass_relative_error_b <=
        args.config.dp_audit.mass_conservation_relative_tolerance &&
      row.branch_mass_symmetry_relative_error <=
        args.config.dp_audit.branch_symmetry_relative_tolerance &&
      row.boundary_shell_mass_fraction_a <=
        args.config.dp_audit.maximum_boundary_shell_mass_fraction &&
      row.boundary_shell_mass_fraction_b <=
        args.config.dp_audit.maximum_boundary_shell_mass_fraction,
  );
  const proposalResolutionConverged =
    proposalResolutionSamplingPass &&
    proposalResolutionRows.slice(1).every(
      (row) =>
        row.relative_change_from_prior != null &&
        row.relative_change_from_prior <=
          args.config.dp_audit.resolution_relative_tolerance,
    );
  const potentialAudit = computeDpPotentialEnergyAudit(dpInput, {
    relative_tolerance: args.config.dp_audit.potential_relative_tolerance,
    absolute_tolerance_J: args.config.dp_audit.potential_absolute_tolerance_J,
  });
  const reconstructedComponentEnergy =
    dp.components.self_a_J +
    dp.components.self_b_J -
    2 * dp.components.cross_J;
  const componentIdentityRelativeError =
    Math.abs(reconstructedComponentEnergy - dp.deltaE_J) /
    Math.max(dp.deltaE_J, Number.MIN_VALUE);
  const massErrorA =
    Math.abs(dp.mass_a_kg - particleMass) / particleMass;
  const massErrorB =
    Math.abs(dp.mass_b_kg - particleMass) / particleMass;
  const branchMassSymmetryError =
    Math.abs(dp.mass_a_kg - dp.mass_b_kg) /
    Math.max(dp.mass_a_kg, dp.mass_b_kg, Number.MIN_VALUE);
  const massGate =
    massErrorA <= args.config.dp_audit.mass_conservation_relative_tolerance &&
    massErrorB <= args.config.dp_audit.mass_conservation_relative_tolerance;
  const symmetryGate =
    branchMassSymmetryError <=
    args.config.dp_audit.branch_symmetry_relative_tolerance;
  const containmentGate =
    dp.boundary_shell_mass_fraction_a <=
      args.config.dp_audit.maximum_boundary_shell_mass_fraction &&
    dp.boundary_shell_mass_fraction_b <=
      args.config.dp_audit.maximum_boundary_shell_mass_fraction;

  const fixedBranchBoundaryOff = computeDpCollapse(dpInput);
  const fixedBranchBoundaryOn = computeDpCollapse(dpInput);
  const fixedBranchRateOff = fixedBranchBoundaryOff.tau_infinite
    ? 0
    : 1 / fixedBranchBoundaryOff.tau_s;
  const fixedBranchRateOn = fixedBranchBoundaryOn.tau_infinite
    ? 0
    : 1 / fixedBranchBoundaryOn.tau_s;
  const fixedBranchBoundaryNull =
    fixedBranchBoundaryOff.deltaE_J === fixedBranchBoundaryOn.deltaE_J &&
    fixedBranchRateOff === fixedBranchRateOn;

  const perturbationRows = args.config.dp_audit.branch_separation_offsets_m.map(
    (offset) => {
      const input = buildProposalSphereDpInput({
        proposal: args.proposal,
        config: args.config,
        branchSeparationOffset_m: offset,
      });
      const result = computeDpCollapse(input);
      const rate = result.tau_infinite ? 0 : 1 / result.tau_s;
      return {
        branch_separation_offset_m: offset,
        branch_separation_m: branchSeparation + offset,
        grid_dims: input.grid.dims,
        voxel_size_m: input.grid.voxel_size_m,
        grid_origin_m: input.grid.origin_m,
        deltaE_J: result.deltaE_J,
        rate_s: rate,
        relative_rate_change_from_nominal:
          (rate - fixedBranchRateOff) /
          Math.max(Math.abs(fixedBranchRateOff), Number.MIN_VALUE),
        sampled_mass_a_kg: result.mass_a_kg,
        sampled_mass_b_kg: result.mass_b_kg,
        branch_receipt_changed: offset !== 0,
      };
    },
  );
  const nominalPerturbationRow = perturbationRows.find(
    (row) => row.branch_separation_offset_m === 0,
  );
  if (nominalPerturbationRow == null) {
    throw new Error("casimir_dp_stage2_perturbation_nominal_missing");
  }
  const perturbationGridIdentityPass = perturbationRows.every(
    (row) =>
      row.grid_dims.every(
        (dimension, index) =>
          dimension === nominalPerturbationRow.grid_dims[index],
      ) &&
      row.voxel_size_m.every(
        (voxel, index) =>
          voxel === nominalPerturbationRow.voxel_size_m[index],
      ) &&
      row.grid_origin_m.every(
        (origin, index) =>
          origin === nominalPerturbationRow.grid_origin_m[index],
      ),
  );
  const perturbationMassDrift = Math.max(
    ...perturbationRows.flatMap((row) => [
      Math.abs(
        row.sampled_mass_a_kg -
          nominalPerturbationRow.sampled_mass_a_kg,
      ) / Math.max(
        nominalPerturbationRow.sampled_mass_a_kg,
        Number.MIN_VALUE,
      ),
      Math.abs(
        row.sampled_mass_b_kg -
          nominalPerturbationRow.sampled_mass_b_kg,
      ) / Math.max(
        nominalPerturbationRow.sampled_mass_b_kg,
        Number.MIN_VALUE,
      ),
    ]),
  );
  const perturbationMassStabilityPass =
    perturbationMassDrift <=
    args.config.dp_audit.perturbation_mass_drift_relative_tolerance;
  const minimumNonzeroSeparationOffset = Math.min(
    ...args.config.dp_audit.branch_separation_offsets_m
      .filter((offset) => offset !== 0)
      .map((offset) => Math.abs(offset)),
  );
  const perturbationSpatialResolutionPass =
    Number.isFinite(minimumNonzeroSeparationOffset) &&
    minimumNonzeroSeparationOffset >=
      Math.min(...nominalPerturbationRow.voxel_size_m);
  const perturbationSensitivityPass =
    perturbationGridIdentityPass &&
    perturbationMassStabilityPass &&
    perturbationSpatialResolutionPass;

  const phase = computeCasimirDpBoundaryPhase({
    schema_version: "casimir_dp_boundary_phase/1",
    sign_convention: "phase_a_minus_b",
    boundary_contrast: "on_minus_off",
    uncertainty_model: args.config.ordinary_phase.uncertainty_model,
    uncertainty_model_ref: args.config.ordinary_phase.uncertainty_model_ref,
    uncertainty_artifact_sha256:
      args.config.ordinary_phase.uncertainty_artifact_sha256,
    on_state_id: "boundary_on",
    off_state_id: "boundary_off",
    states: [
      {
        state_id: "boundary_on",
        time_s: [0, observationTime],
        branch_a_energy_J: [
          args.config.ordinary_phase.on_minus_off_branch_energy_difference_J,
          args.config.ordinary_phase.on_minus_off_branch_energy_difference_J,
        ],
        branch_b_energy_J: [0, 0],
        branch_a_standard_uncertainty_J: null,
        branch_b_standard_uncertainty_J: null,
        energy_model_class: args.config.ordinary_phase.energy_model_class,
        evidence_class: args.config.ordinary_phase.evidence_class,
        source_ref: args.config.ordinary_phase.source_ref,
        raw_artifact_sha256: args.config.ordinary_phase.raw_artifact_sha256,
      },
      {
        state_id: "boundary_off",
        time_s: [0, observationTime],
        branch_a_energy_J: [0, 0],
        branch_b_energy_J: [0, 0],
        branch_a_standard_uncertainty_J: null,
        branch_b_standard_uncertainty_J: null,
        energy_model_class: args.config.ordinary_phase.energy_model_class,
        evidence_class: args.config.ordinary_phase.evidence_class,
        source_ref: args.config.ordinary_phase.source_ref,
        raw_artifact_sha256: args.config.ordinary_phase.raw_artifact_sha256,
      },
    ],
  });
  const visibility = coherenceVisibilityFromRate({
    initial_visibility: args.config.ordinary_phase.initial_visibility,
    rate_s: args.config.ordinary_phase.baseline_decoherence_rate_s,
    observation_time_s: observationTime,
  });
  const interference = computeCasimirDpInterference({
    schema_version: "casimir_dp_interference/1",
    visibility,
    phase_rad: phase.boundary_phase_contrast_rad,
  });

  const maximumDifferentialForce =
    HBAR * args.config.ambient_gravity_control.maximum_boundary_correlated_phase_rad /
    (branchSeparation * observationTime);
  const forceEquivalentPhase = staticForceProjectionPhase({
    projected_differential_force_N: maximumDifferentialForce,
    branch_separation_m: branchSeparation,
    observation_time_s: observationTime,
  });
  const gravity = ambientGravityPhaseControl({
    mass_kg: particleMass,
    gravitational_acceleration_m_s2:
      args.config.ambient_gravity_control.gravitational_acceleration_m_s2,
    branch_separation_m: branchSeparation,
    observation_time_s: observationTime,
    maximum_boundary_correlated_phase_rad:
      args.config.ambient_gravity_control.maximum_boundary_correlated_phase_rad,
  });

  const missingBridgeFields = bridgeMissingFields(args.config.bridge_registration);
  const upstreamIntegrityPass = args.upstreamIntegrity.every(
    (authority) => authority.gate === "pass",
  );
  const dpNumericalAuditPass =
    potentialAudit.gate === "pass" &&
    componentIdentityRelativeError <=
      args.config.dp_audit.component_identity_relative_tolerance &&
    massGate &&
    symmetryGate &&
    containmentGate &&
    fixedBranchBoundaryNull;
  const stage1AuthorityTransferPass =
    stage1InputIdentityPass &&
    args.stage1Gates.numerical_convergence_gate === "pass" &&
    args.stage1Gates.branch_sampling_gate === "pass" &&
    args.stage1Gates.provenance_gate === "pass" &&
    args.stage1Gates.experimental_bounds_gate === "pass";
  const proposalBranchProvenanceGate = dp.certifying
    ? "pass" as const
    : "not_ready" as const;
  const proposalExperimentalBoundsGate = stage1AuthorityTransferPass
    ? "pass" as const
    : "not_ready" as const;

  const lanes = [
    {
      lane_id: "qed_open_system_baseline" as const,
      theory_authority: "established_reference" as const,
      computability: "computable" as const,
      evidence_gate: phase.measured_evidence_gate,
      observable_ids: [
        "observable.coherence.boundary_conditioned_phase_residual",
        "observable.coherence.boundary_conditioned_decay_residual",
        "observable.casimir.force_residual",
      ],
      prediction:
        "Boundary-conditioned QED and ordinary couplings may change phase, heating, correlations, and visibility.",
      falsifier:
        "The calibrated ordinary transfer model fails held-out boundary-state phase, force, heat, or correlation data.",
      artifact_refs: [
        "shared/casimir-dp-phase-coherence.ts",
        "configs/research/casimir-dp-proposal-closure.v1.json",
      ],
      permitted_claim:
        "Ordinary boundary-conditioned phase and coherence diagnostic with measured status stated.",
      forbidden_claim:
        "Objective collapse, manifold manipulation, or quantum-foam detection.",
    },
    {
      lane_id: "or_dp_branch_instability" as const,
      theory_authority: "sourced_conjecture" as const,
      computability: "diagnostic_only" as const,
      evidence_gate:
        dpNumericalAuditPass &&
        proposalResolutionConverged &&
        massGate &&
        symmetryGate &&
        containmentGate &&
        proposalBranchProvenanceGate === "pass" &&
        proposalExperimentalBoundsGate === "pass" &&
        stage1AuthorityTransferPass
          ? "pass" as const
          : "not_ready" as const,
      observable_ids: [
        "observable.dp.gravitational_self_energy_difference",
        "observable.collapse.objective_rate",
      ],
      prediction:
        "The registered weak-field estimator gives a branch-dependent rate and a zero boundary-label differential when every branch input is fixed.",
      falsifier:
        "Numerical identities fail, branch sampling or convergence fails, or independent bounds exclude the registered parameter choice.",
      artifact_refs: [
        "shared/dp-collapse.ts",
        "docs/DP_COLLAPSE_DERIVATION.md",
      ],
      permitted_claim:
        "Penrose-motivated, regularized weak-field branch-instability diagnostic.",
      forbidden_claim:
        "Observed reduction, a covariant quantum geometry, or a Casimir-modulated OR clock.",
    },
    {
      lane_id: "boundary_conditioned_spacetime_bridge" as const,
      theory_authority: "unregistered" as const,
      computability: "blocked" as const,
      evidence_gate: "blocked" as const,
      observable_ids: [
        "observable.coherence.boundary_conditioned_decay_residual",
        "observable.coherence.boundary_conditioned_phase_residual",
      ],
      prediction:
        "No numerical prediction is admitted until a sourced tensor-to-metric-to-coherence dynamics is registered.",
      falsifier: args.config.bridge_registration.required_falsifiers.join("; "),
      artifact_refs: [
        "study.casimir_dp.manifold_response_hypothesis",
        "study.casimir_dp.frequency_bridge_gate",
      ],
      permitted_claim:
        "A preregistered extension question with explicit missing dynamics.",
      forbidden_claim:
        "A manifold-response rate, quantum-foam resonance, or direct OR confirmation.",
    },
  ];

  return {
    schema_version: "casimir_dp_or_phase_stage2_report/1" as const,
    campaign_id: args.config.campaign_id,
    generated_at: (args.now ?? new Date()).toISOString(),
    evidence_cutoff: args.config.evidence_cutoff,
    claim_tier: "diagnostic" as const,
    promotion_allowed: false as const,
    run_order: [...args.config.run_order],
    upstream_integrity: {
      authorities: args.upstreamIntegrity,
      gate: upstreamIntegrityPass ? "pass" as const : "not_ready" as const,
    },
    notation: {
      particle_mass_kg: particleMass,
      compton_frequency_Hz: particleMass * C2 / planckConstant,
      penrose_1996_symbol: "E_Delta",
      penrose_2014_symbol: "E_G",
      repository_symbol: "Delta_E_G_repo(ell)",
      repository_field: "deltaE_J",
      dp_characteristic_frequency_Hz: dp.deltaE_J / planckConstant,
      dp_angular_rate_rad_s: dp.deltaE_J / HBAR,
      tau_or_order_of_magnitude_s: dp.tau_s,
      crosswalk_status:
        "conceptual_weak_field_correspondence_not_numerical_identity_across_conventions" as const,
      compton_bridge_status: "blocked" as const,
    },
    dp_audit: {
      input_identity:
        "frozen_proposal_sphere_centered_grid_plummer_stage2" as const,
      stage1_input_compatibility: {
        comparisons: stage1InputComparisons,
        gate: stage1InputIdentityPass
          ? "pass" as const
          : "not_ready" as const,
        authority_effect:
          stage1InputIdentityPass
            ? "Stage-1 gates may be evaluated for transfer only if every Stage-1 promotion gate also passes."
            : "Stage-1 convergence, provenance, and bounds are contextual only because the frozen mass/radius input differs from the proposal sphere.",
      },
      proposal_resolution_sweep: {
        rows: proposalResolutionRows,
        relative_tolerance:
          args.config.dp_audit.resolution_relative_tolerance,
        sampling_gate: proposalResolutionSamplingPass
          ? "pass" as const
          : "not_ready" as const,
        convergence_gate: proposalResolutionConverged
          ? "pass" as const
          : "not_ready" as const,
      },
      pairwise: dp,
      potential: potentialAudit,
      component_identity: {
        reconstructed_deltaE_J: reconstructedComponentEnergy,
        relative_error: componentIdentityRelativeError,
        gate:
          componentIdentityRelativeError <=
            args.config.dp_audit.component_identity_relative_tolerance
            ? "pass" as const
            : "not_ready" as const,
      },
      branch_sampling: {
        declared_mass_kg: particleMass,
        sampled_mass_a_kg: dp.mass_a_kg,
        sampled_mass_b_kg: dp.mass_b_kg,
        mass_relative_error_a: massErrorA,
        mass_relative_error_b: massErrorB,
        branch_mass_symmetry_relative_error: branchMassSymmetryError,
        boundary_shell_mass_fraction_a: dp.boundary_shell_mass_fraction_a,
        boundary_shell_mass_fraction_b: dp.boundary_shell_mass_fraction_b,
        mass_conservation_gate: massGate ? "pass" as const : "not_ready" as const,
        branch_symmetry_gate: symmetryGate ? "pass" as const : "not_ready" as const,
        containment_gate: containmentGate ? "pass" as const : "not_ready" as const,
      },
      upstream_stage1_gates: args.stage1Gates,
      stage1_authority_transfer_gate: stage1AuthorityTransferPass
        ? "pass" as const
        : "not_ready" as const,
      proposal_branch_provenance_gate: proposalBranchProvenanceGate,
      proposal_experimental_bounds_gate: proposalExperimentalBoundsGate,
      fixed_branch_boundary_null: {
        boundary_off_deltaE_J: fixedBranchBoundaryOff.deltaE_J,
        boundary_on_deltaE_J: fixedBranchBoundaryOn.deltaE_J,
        boundary_off_rate_s: fixedBranchRateOff,
        boundary_on_rate_s: fixedBranchRateOn,
        delta_boundary_rate_s: fixedBranchRateOn - fixedBranchRateOff,
        gate: fixedBranchBoundaryNull ? "pass" as const : "not_ready" as const,
        scope:
          "Software invariance under boundary-label replay with identical branch inputs; not evidence that real switching leaves the branches unchanged.",
      },
      branch_perturbation_sensitivity: {
        rows: perturbationRows,
        frozen_grid_identity_gate: perturbationGridIdentityPass
          ? "pass" as const
          : "not_ready" as const,
        sampled_mass_stability_gate: perturbationMassStabilityPass
          ? "pass" as const
          : "not_ready" as const,
        maximum_sampled_mass_drift_relative: perturbationMassDrift,
        minimum_nonzero_separation_offset_m:
          minimumNonzeroSeparationOffset,
        minimum_voxel_size_m:
          Math.min(...nominalPerturbationRow.voxel_size_m),
        spatial_resolution_gate: perturbationSpatialResolutionPass
          ? "pass" as const
          : "not_ready" as const,
        sensitivity_gate: perturbationSensitivityPass
          ? "pass" as const
          : "not_ready" as const,
        interpretation:
          perturbationSensitivityPass
            ? "The paired perturbation uses one frozen grid and passes mass-stability and spatial-resolution gates."
            : "No physical separation derivative is admitted: the frozen-grid perturbation remains below spatial resolution or fails sampled-mass stability.",
      },
      numerical_audit_gate: dpNumericalAuditPass
        ? "pass" as const
        : "not_ready" as const,
      model_authority:
        "newtonian_plummer_mass_density_difference_diagnostic" as const,
      generic_signed_stress_adapter_bridge_status: "not_admitted" as const,
    },
    ordinary_phase_and_coherence: {
      boundary_phase: phase,
      visibility,
      interference,
      maximum_differential_force_noise_N: maximumDifferentialForce,
      force_equivalent_phase_rad: forceEquivalentPhase,
      measured_evidence_gate: "not_ready" as const,
      interpretation:
        "The static boundary has a state, not a phase. The measured phase is the material-branch action difference.",
    },
    ambient_gravity_control: {
      ...gravity,
      evidence_status: args.config.ambient_gravity_control.evidence_status,
      required_receipts: args.config.ambient_gravity_control.required_receipts,
      measured_gate: "not_ready" as const,
    },
    plausibility_lanes: lanes,
    bridge_gate: {
      status: "blocked" as const,
      missing_fields: missingBridgeFields,
      required_falsifiers: args.config.bridge_registration.required_falsifiers,
      no_numerical_plausibility_score: true as const,
    },
    orch_or_scope: args.config.orch_or_scope,
    proposal_gates: args.proposalGates,
    final_gates: {
      software_and_algebraic_diagnostics:
        upstreamIntegrityPass && dpNumericalAuditPass ? "pass" as const : "not_ready" as const,
      stage1_spatial_convergence: args.stage1Gates.numerical_convergence_gate,
      stage2_proposal_spatial_convergence: proposalResolutionConverged
        ? "pass" as const
        : "not_ready" as const,
      stage2_proposal_branch_provenance: proposalBranchProvenanceGate,
      stage2_proposal_experimental_bounds:
        proposalExperimentalBoundsGate,
      perturbation_sensitivity: perturbationSensitivityPass
        ? "pass" as const
        : "not_ready" as const,
      measured_qed_phase_and_coherence: "not_ready" as const,
      ordinary_decoherence_closure: "not_ready" as const,
      collapse_identification: "blocked" as const,
      manifold_dynamics: "blocked" as const,
      publication_claim: "diagnostic_protocol_only" as const,
    },
    claim_boundaries: [
      "Penrose OR supplies conceptual motivation and an order-of-magnitude timescale conjecture; it does not supply the Casimir boundary coupling.",
      "The repository Delta E_G is a grid- and Plummer-regularized weak-field diagnostic, not a covariant superposition of geometries.",
      "Ambient gravity and QED boundary forces produce ordinary unitary phase controls, not an OR collapse rate.",
      "Positive and negative regions of Delta rho are signed branch differences, not negative mass or Casimir vacuum energy.",
      "The generic signed stress-to-DP adapter is not admitted as a Casimir-to-OR bridge because it omits the required tensor dynamics and observable transfer.",
      "Constructive or destructive interference diagnoses phase and visibility; it does not by itself diagnose objective collapse.",
      "Gravitational-wave observations establish classical metric dynamics, not quantum geometry superposition or OR.",
      "This experiment has no biological Orch OR observable and cannot validate Orch OR, microtubules, or consciousness claims.",
    ],
  };
}
