import { z } from "zod";

export const CASIMIR_DP_PENROSE_CANDIDATE_THEORY_STAGE0_VERSION =
  "casimir_dp_penrose_candidate_theory_stage0/1" as const;

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const PenroseTheoryRequirement = z.object({
  status: z.enum(["supplied", "missing", "justified_null"]),
  specification: z.string().min(1).nullable(),
  source_ids: z.array(z.string().min(1)),
  equation_ids: z.array(z.string().min(1)),
  evidence_receipt_sha256: Sha256.nullable(),
});

const Source = z.object({
  source_id: z.string().min(1),
  citation: z.string().min(1),
  url: z.string().url(),
  supports: z.string().min(1),
  does_not_support: z.string().min(1),
});

const UpstreamAuthority = z.object({
  role: z.enum([
    "or_phase_authority",
    "stage3_outcome_authority",
    "manifold_registry_authority",
  ]),
  path: z.string().min(1),
  sha256: Sha256,
});

const Outcome = z.object({
  outcome_id: z.string().min(1),
  observation: z.string().min(1),
  establishes: z.string().min(1),
  disfavors: z.string().min(1),
  does_not_establish: z.string().min(1),
  maximum_claim: z.enum([
    "apparatus_or_ordinary_physics_only",
    "candidate_parameter_region_excluded",
    "candidate_compatible_not_validated",
    "boundary_interaction_anomaly_only",
    "named_generator_supported_among_registered_alternatives",
  ]),
});

const Falsifier = z.object({
  falsifier_id: z.string().min(1),
  class: z.enum(["experiment_internal", "theory_internal", "independent"]),
  observable_or_check: z.string().min(1),
  rejection_criterion: z.string().min(1),
  requires_power_or_receipt: z.boolean(),
});

const BoundaryPolicy = z.object({
  mode: z.enum(["boundary_independent", "registered_extension"]),
  fixed_branch_difference_null: z.boolean(),
  extension_model_id: z.string().min(1).nullable(),
  manifold_registry_fixture_path: z.string().min(1).nullable(),
  manifold_registry_fixture_sha256: Sha256.nullable(),
  interpretation: z.string().min(1),
});

export const CasimirDpPenroseCandidateTheoryStage0Config = z.object({
  schema_version: z.literal(
    CASIMIR_DP_PENROSE_CANDIDATE_THEORY_STAGE0_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.literal("casimir-dp-penrose-candidate-theory-stage0-v1"),
  candidate_id: z.literal("penrose_relational_branch_incompatibility_v0"),
  candidate_version: z.literal("0.1.0"),
  canonical_generated_at: z.literal("2026-08-11T18:20:00.000Z"),
  maturity: z.literal("stage0_exploratory"),
  evidence_class: z.literal("theory_definition_preflight"),
  claim_ceiling: z.literal("formal_candidate_definition_only"),
  promotion_allowed: z.literal(false),
  numerical_prediction_allowed: z.literal(false),
  sources: z.array(Source).min(5),
  upstream_authorities: z.array(UpstreamAuthority).length(3).superRefine(
    (rows, context) => {
      const roles = rows.map((row) => row.role);
      if (new Set(roles).size !== roles.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "upstream authority roles must be unique",
        });
      }
    },
  ),
  theory_definition: z.object({
    scope: z.string().min(1),
    branch_state_contract: PenroseTheoryRequirement,
    branch_correspondence: PenroseTheoryRequirement,
    invariant_incompatibility_functional: PenroseTheoryRequirement,
    equivalence_principle_recovery: PenroseTheoryRequirement,
    proper_time_is_unitary_phase_not_reduction: z.literal(true),
  }),
  dynamics: z.object({
    kind: z.enum(["unspecified", "markovian", "non_markovian"]),
    reduction_law: PenroseTheoryRequirement,
    lifetime_distribution: PenroseTheoryRequirement,
    stochastic_unravelling: PenroseTheoryRequirement,
    born_probability_law: PenroseTheoryRequirement,
    normalization_contract: PenroseTheoryRequirement,
    phase_and_contraction_separated: z.boolean(),
    markovian_cptp_contract: PenroseTheoryRequirement,
    non_markovian_consistency_contract: PenroseTheoryRequirement,
  }),
  consistency: z.object({
    causal_support_and_no_signalling: PenroseTheoryRequirement,
    energy_momentum_balance: PenroseTheoryRequirement,
    gauge_and_diffeomorphism_robustness: PenroseTheoryRequirement,
    vacuum_stability_or_hadamard_contract: PenroseTheoryRequirement,
    recovery_limits: z.object({
      identical_branches: z.boolean(),
      zero_gravitational_coupling: z.boolean(),
      deterministic_metric_phase_only: z.boolean(),
      newtonian_penrose_energy: z.boolean(),
      ordinary_qm_qed: z.boolean(),
      ordinary_gr_proper_time: z.boolean(),
      gaussian_diosi_limit_if_claimed: z.boolean(),
      no_boundary_contrast: z.boolean(),
    }),
  }),
  observable_contract: z.object({
    complex_coherence_projection: PenroseTheoryRequirement,
    companion_prediction_or_justified_null: PenroseTheoryRequirement,
    required_axes: z.array(z.enum([
      "mass_density",
      "branch_separation",
      "hold_time",
      "density_profile",
      "trajectory",
      "path_swap",
      "echo",
      "boundary_state",
    ])).min(8),
  }),
  boundary_policy: BoundaryPolicy,
  falsifiers: z.array(Falsifier).min(8),
  outcome_map: z.array(Outcome).min(7),
  nonbridges: z.array(z.object({
    nonbridge_id: z.string().min(1),
    statement: z.string().min(1),
    status: z.enum(["null", "blocked", "not_imported"]),
  })).min(8),
  final_status_policy: z.object({
    measured_evidence: z.literal("not_ready"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    integrated_pilot: z.literal("not_authorized"),
  }),
});

export type PenroseTheoryRequirement = z.infer<
  typeof PenroseTheoryRequirement
>;

export type CasimirDpPenroseCandidateTheoryStage0Config = z.infer<
  typeof CasimirDpPenroseCandidateTheoryStage0Config
>;
