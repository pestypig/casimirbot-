import { z } from "zod";
import { LifshitzSolverInput } from "../casimir-lifshitz";
import { DynamicsSignatureInput } from "../casimir-dp-inference";

export const CASIMIR_DP_NEXT_COMPUTATIONS_VERSION = "casimir_dp_next_computations/1" as const;

const EvidenceClass = z.enum([
  "measured",
  "literature_anchored",
  "design_assumption",
  "unregistered",
]);

const EvidenceDatumBase = z.object({
  value: z.number(),
  standard_uncertainty: z.number().nonnegative(),
  unit: z.string().min(1),
  evidence_class: EvidenceClass,
  source_ref: z.string().min(1),
  raw_artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
});

const requireMeasuredHash = (
  datum: { evidence_class: z.infer<typeof EvidenceClass>; raw_artifact_sha256: string | null },
  context: z.RefinementCtx,
) => {
  if (datum.evidence_class === "measured" && datum.raw_artifact_sha256 == null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["raw_artifact_sha256"],
      message: "Measured data require a raw artifact SHA-256.",
    });
  }
};

const EvidenceDatum = EvidenceDatumBase.superRefine(requireMeasuredHash);

const RateDatum = EvidenceDatumBase.extend({
  value: z.number().nonnegative(),
  standard_uncertainty: z.number().nonnegative(),
  unit: z.literal("s^-1"),
}).superRefine(requireMeasuredHash);

const SwitchingSidecar = z.object({
  sidecar_id: z.string().min(1),
  candidate_id: z.string().min(1),
  modulation_frequency: EvidenceDatum,
  dissipated_power: EvidenceDatum,
  coupled_heat: EvidenceDatum,
  force_mismatch: EvidenceDatum,
  acquisition_window_s: z.number().positive(),
  calibration_refs: z.array(z.string().min(1)),
});

const DecoherenceSidecar = z.object({
  sidecar_id: z.string().min(1),
  candidate_id: z.string().min(1),
  terms: z.object({
    gas: RateDatum,
    blackbody: RateDatum,
    thermal: RateDatum,
    vibration: RateDatum,
    electromagnetic: RateDatum,
    readout: RateDatum,
    switching: RateDatum,
  }),
  covariance_s2: z.array(z.array(z.number())).nullable(),
  acquisition_window_s: z.number().positive(),
  blinded_boundary_labels: z.boolean(),
});

const RigidSphereDpCampaign = z.object({
  campaign_id: z.string().min(1),
  candidate_id: z.string().min(1),
  mass_kg: z.number().positive(),
  radius_m: z.number().positive(),
  branch_separation_m: z.number().positive(),
  ell_m: z.number().positive(),
  grid_dimensions: z.array(z.number().int().min(8).max(48)).min(3),
  padding_radii: z.number().min(0.5).max(5),
  max_voxels: z.number().int().min(512).max(65_536),
  density_evidence_class: EvidenceClass,
  density_source_ref: z.string().min(1),
  convergence_relative_tolerance: z.number().positive().max(1),
});

const PowerPlan = z.object({
  baseline_rate_s: z.number().nonnegative(),
  observation_time_s: z.number().positive(),
  type_i_error: z.number().gt(0).lt(0.5),
  target_power: z.number().gt(0.5).lt(1),
  technical_variance_inflation: z.number().min(1),
  target_rate_source: z.literal("rigid_sphere_dp_campaign"),
});

const ManifoldResponseRegistration = z.object({
  status: z.literal("blocked"),
  model_id: z.null(),
  source_ref: z.null(),
  renormalized_stress_tensor_prescription: z.null(),
  stress_noise_kernel_prescription: z.null(),
  causal_metric_response_kernel: z.null(),
  gauge_and_coordinate_contract: z.null(),
  metric_to_coherence_dynamics: z.null(),
  complete_positivity_or_consistency_proof: z.null(),
  standard_model_recovery_limit: z.null(),
  frozen_parameter_manifest: z.null(),
  required_falsifiers: z.array(z.string().min(1)).min(3),
});

export const CasimirDpNextComputationsConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_NEXT_COMPUTATIONS_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.string().min(1),
  evidence_cutoff: z.string().min(1),
  claim_tier: z.literal("diagnostic"),
  run_order: z.array(z.string().min(1)).min(1),
  lifshitz_cases: z.array(z.object({ case_id: z.string().min(1), input: LifshitzSolverInput })).min(2),
  unsupported_boundary_models: z.array(z.object({
    candidate_id: z.string().min(1),
    status: z.literal("not_ready"),
    required_operator: z.string().min(1),
  })).min(3),
  switching_sidecar: SwitchingSidecar,
  decoherence_sidecar: DecoherenceSidecar,
  dp_campaign: RigidSphereDpCampaign,
  power_plan: PowerPlan,
  dynamics_signature: DynamicsSignatureInput,
  manifold_response_registration: ManifoldResponseRegistration,
});

export type CasimirDpNextComputationsConfig = z.infer<typeof CasimirDpNextComputationsConfig>;
