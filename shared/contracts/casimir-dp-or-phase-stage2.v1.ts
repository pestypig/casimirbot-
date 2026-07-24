import { z } from "zod";

export const CASIMIR_DP_OR_PHASE_STAGE2_VERSION =
  "casimir_dp_or_phase_stage2/1" as const;

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

const UpstreamAuthority = z.object({
  role: z.enum(["stage1_gated_computations", "proposal_closure"]),
  path: z.string().min(1),
  sha256: Sha256,
});

const BridgeRegistration = z.object({
  status: z.literal("blocked"),
  model_id: z.null(),
  source_ref: z.null(),
  renormalized_stress_tensor_prescription: z.null(),
  stress_noise_kernel_prescription: z.null(),
  causal_metric_response_kernel: z.null(),
  gauge_and_coordinate_contract: z.null(),
  metric_to_coherence_dynamics: z.null(),
  consistency_or_complete_positivity_proof: z.null(),
  standard_qed_and_dp_recovery_limit: z.null(),
  frozen_parameter_manifest: z.null(),
  required_falsifiers: z.array(z.string().min(1)).min(4),
});

export const CasimirDpOrPhaseStage2Config = z.object({
  schema_version: z.literal(CASIMIR_DP_OR_PHASE_STAGE2_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.literal("casimir-dp-or-phase-stage2-v1"),
  evidence_cutoff: z.string().min(1),
  claim_tier: z.literal("diagnostic"),
  promotion_allowed: z.literal(false),
  run_order: z.array(z.string().min(1)).min(1),
  upstream_authorities: z.array(UpstreamAuthority).length(2).superRefine(
    (authorities, context) => {
      const roles = authorities.map((authority) => authority.role);
      if (new Set(roles).size !== roles.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "upstream authority roles must be unique",
        });
      }
    },
  ),
  dp_audit: z.object({
    grid_dimension: z.number().int().min(8).max(32),
    resolution_grid_dimensions: z.array(
      z.number().int().min(8).max(32),
    ).min(3).refine(
      (dimensions) =>
        new Set(dimensions).size === dimensions.length &&
        dimensions.every(
          (dimension, index) =>
            index === 0 || dimension > dimensions[index - 1],
        ),
      "resolution_grid_dimensions must be strictly increasing and unique",
    ),
    resolution_relative_tolerance: z.number().positive().max(1),
    ell_m: z.number().positive(),
    padding_radii: z.number().min(0.5).max(5),
    max_voxels: z.number().int().min(512).max(32_768),
    potential_relative_tolerance: z.number().positive().max(1),
    potential_absolute_tolerance_J: z.number().nonnegative(),
    component_identity_relative_tolerance: z.number().positive().max(1),
    mass_conservation_relative_tolerance: z.number().positive().max(1),
    branch_symmetry_relative_tolerance: z.number().positive().max(1),
    maximum_boundary_shell_mass_fraction: z.number().nonnegative().max(1),
    perturbation_mass_drift_relative_tolerance: z.number().positive().max(1),
    branch_separation_offsets_m: z.array(z.number()).min(3).refine(
      (offsets) =>
        offsets.includes(0) && offsets.some((offset) => offset !== 0),
      "branch_separation_offsets_m must include nominal zero and a perturbation",
    ),
  }),
  ordinary_phase: z.object({
    on_minus_off_branch_energy_difference_J: z.number(),
    energy_model_class: z.literal("qed_casimir_polder"),
    evidence_class: z.literal("design_assumption"),
    source_ref: z.string().min(1),
    raw_artifact_sha256: z.null(),
    uncertainty_model: z.literal("not_registered"),
    uncertainty_model_ref: z.null(),
    uncertainty_artifact_sha256: z.null(),
    initial_visibility: z.number().gt(0).lte(1),
    baseline_decoherence_rate_s: z.number().nonnegative(),
  }),
  ambient_gravity_control: z.object({
    gravitational_acceleration_m_s2: z.number().positive(),
    maximum_boundary_correlated_phase_rad: z.number().positive(),
    evidence_status: z.literal("design_target"),
    required_receipts: z.array(z.string().min(1)).min(3),
  }),
  bridge_registration: BridgeRegistration,
  orch_or_scope: z.object({
    status: z.literal("out_of_scope"),
    source_ref: z.string().min(1),
    excluded_claims: z.array(z.string().min(1)).min(3),
  }),
});

export type CasimirDpOrPhaseStage2Config = z.infer<
  typeof CasimirDpOrPhaseStage2Config
>;
