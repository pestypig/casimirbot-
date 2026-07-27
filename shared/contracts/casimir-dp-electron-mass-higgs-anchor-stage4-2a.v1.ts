import { z } from "zod";

export const CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_VERSION =
  "casimir_dp_electron_mass_higgs_anchor_stage4_2a/1" as const;

export const CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_RUN_ORDER = [
  "hash_link_immutable_stage4_1_authorities",
  "freeze_source_snapshots_roles_paths_and_hashes",
  "freeze_si_natural_mass_frequency_higgs_and_temperature_conventions",
  "validate_dependency_dag_source_overlap_and_covariance_semantics",
  "run_penning_bound_electron_mass_replay",
  "reproduce_correlated_codata_mass_energy_conversions",
  "derive_fermi_scale_and_conditional_tree_yukawa_anchor",
  "replay_stage4_1_compton_and_rydberg_identities",
  "close_planck_spectral_jacobians_and_stefan_boltzmann_integral",
  "recover_tsis_color_and_iau_bolometric_temperatures_separately",
  "enforce_precision_matching_and_collider_upper_bound_nonclaims",
  "run_formal_zero_vf_domain_exit_recovery",
  "enforce_cross_scale_dependency_and_dp_nonbridge_semantics",
  "populate_outcome_nonclaim_falsifier_and_final_gate_ledgers",
  "project_nonpromotable_theory_badges_with_zero_observable_bridges",
  "write_content_addressed_stage4_2a_report_and_receipt",
] as const;

const NonEmpty = z.string().min(1);
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const RunOrderStage = z.enum(
  CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_RUN_ORDER,
);

const AuthorityRef = z.object({
  role: NonEmpty,
  path: NonEmpty,
  sha256: Sha256,
  tracked: z.boolean(),
  required_at_runtime: z.literal(true),
}).strict();

const SourceRef = z.object({
  source_id: NonEmpty,
  url: z.string().url(),
  citation: NonEmpty,
  supports: NonEmpty,
  does_not_support: NonEmpty,
}).strict();

const FixtureRef = z.object({
  role: z.enum(["mass_higgs_fixture", "planck_solar_fixture"]),
  path: NonEmpty,
  sha256: Sha256,
  schema_version: NonEmpty,
  evidence_class: z.enum([
    "source_backed_calculation",
    "source_backed_radiometric_calibration",
  ]),
}).strict();

export const CasimirDpElectronMassHiggsAnchorStage4_2AConfig = z.object({
  schema_version: z.literal(
    CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.literal(
    "casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1",
  ),
  implementation_version: z.literal("1.0.0"),
  evidence_cutoff: NonEmpty,
  evidence_class: z.literal("source_backed_diagnostic_replay"),
  claim_ceiling: z.literal(
    "mass_energy_frequency_and_radiometric_calibration_only",
  ),
  promotion_allowed: z.literal(false),
  observable_bridge_edges_allowed: z.literal(false),
  authority_manifest: AuthorityRef.extend({
    role: z.literal("stage4_2a_authority_manifest"),
    path: z.literal(
      "configs/research/casimir-dp-stage4-2a-authorities.v1.json",
    ),
  }).strict(),
  upstream_authorities: z.array(AuthorityRef).min(6),
  source_registry: z.array(SourceRef).min(8).superRefine(
    (sources, context) => {
      const ids = sources.map((source) => source.source_id);
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stage-4.2A source ids must be unique",
        });
      }
    },
  ),
  evidence_policy: z.object({
    penning_replay_is_static_weighing: z.literal(false),
    codata_conversions_are_independent_confirmations: z.literal(false),
    inferred_tree_yukawa_is_direct_higgs_measurement: z.literal(false),
    collider_upper_limit_is_electron_yukawa_observation: z.literal(false),
    planck_integral_and_sigma_are_independent_theories: z.literal(false),
    solar_color_temperature_equals_bolometric_effective_temperature:
      z.literal(false),
    common_h_or_dimensions_imply_dp_connection: z.literal(false),
    cross_covariance_required_for_independence_significance: z.literal(true),
    measured_casimir_or_coherence_gate_can_be_satisfied: z.literal(false),
    observable_bridge_edges_allowed: z.literal(false),
  }).strict(),
  runtime_fixtures: z.tuple([
    FixtureRef.extend({
      role: z.literal("mass_higgs_fixture"),
      path: z.literal(
        "configs/research/fixtures/casimir-dp-electron-mass-higgs-anchor.source-backed.v1.json",
      ),
      evidence_class: z.literal("source_backed_calculation"),
    }).strict(),
    FixtureRef.extend({
      role: z.literal("planck_solar_fixture"),
      path: z.literal(
        "configs/research/fixtures/casimir-dp-planck-solar-calibration.source-backed.v1.json",
      ),
      evidence_class: z.literal(
        "source_backed_radiometric_calibration",
      ),
    }).strict(),
  ]),
  deterministic_seed: z.number().int().nonnegative(),
  software: z.object({
    runtime: z.literal("typescript"),
    runner: z.literal(
      "scripts/research/run-casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts",
    ),
    module_ids: z.tuple([
      z.literal(
        "shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts",
      ),
      z.literal(
        "shared/casimir-dp-planck-solar-calibration-stage4-2a.ts",
      ),
      z.literal(
        "shared/contracts/casimir-dp-electron-mass-higgs-anchor-stage4-2a.v1.ts",
      ),
      z.literal(
        "shared/theory/casimir-dp-study-theory-badges.ts",
      ),
    ]),
    source_authorities: z.array(AuthorityRef).length(5),
    source_snapshot: z.object({
      git_head: z.string().regex(/^[a-f0-9]{40}$/),
      worktree_state: z.literal(
        "dirty_uncommitted_source_hashes_authoritative",
      ),
      authority_mode: z.literal("content_hashes"),
    }).strict(),
  }).strict(),
  run_order: z.array(RunOrderStage).length(
    CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    source_authority_integrity: z.literal("pass"),
    penning_observational_replay: z.literal("pass"),
    codata_correlated_reproduction: z.literal("pass"),
    unit_dimension_closure: z.literal("pass"),
    conditional_sm_tree_mapping: z.literal("pass"),
    planck_spectral_density_closure: z.literal("pass"),
    stefan_boltzmann_closure: z.literal("pass"),
    solar_color_temperature_recovery: z.literal("pass"),
    solar_bolometric_temperature_recovery: z.literal("pass"),
    temperature_semantics: z.literal("pass"),
    cross_scale_dependency_semantics: z.literal("pass"),
    independent_electron_mass_validation: z.literal("not_ready"),
    running_yukawa_at_higgs_scale: z.literal("blocked"),
    direct_electron_yukawa_observation: z.literal("not_ready"),
    electron_mass_from_higgs_identification: z.literal("blocked"),
    higgs_origin_identification: z.literal("blocked"),
    independent_solar_validation: z.literal("not_ready"),
    measured_spectral_fit_significance: z.literal("not_ready"),
    stellar_structure_inference: z.literal("not_evaluated"),
    measured_casimir_coherence_evidence: z.literal("not_ready"),
    casimir_higgs_dp_transfer: z.literal("blocked"),
    compton_to_collapse_clock: z.literal("blocked"),
    thermal_to_dp_transfer: z.literal("blocked"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    cosmological_lift: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    publication_claim: z.literal(
      "diagnostic_cross_scale_calibration_only",
    ),
  }).strict(),
}).strict();

export type CasimirDpElectronMassHiggsAnchorStage4_2AConfig = z.infer<
  typeof CasimirDpElectronMassHiggsAnchorStage4_2AConfig
>;
