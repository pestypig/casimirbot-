import { z } from "zod";

export const CASIMIR_DP_QED_SCALE_HIERARCHY_STAGE4_1_VERSION =
  "casimir_dp_qed_scale_hierarchy_stage4_1/1" as const;

export const CASIMIR_DP_QED_SCALE_HIERARCHY_STAGE4_1_RUN_ORDER = [
  "hash_link_immutable_stage4_authorities",
  "freeze_codata_units_symbols_species_mass_and_frequency_conventions",
  "validate_source_provenance_uncertainty_covariance_and_rounding",
  "compute_compton_energy_frequency_and_wavelength_closure",
  "compute_bohr_classical_radius_rydberg_and_hartree_closure",
  "compute_leading_hydrogenic_reduced_mass_closure",
  "validate_dimensionless_scale_hierarchy_and_reference_envelopes",
  "freeze_precision_correction_ledger_and_semantic_nonbridge",
  "populate_stage4_1_outcome_nonclaim_and_falsifier_ledger",
  "write_hash_backed_stage4_1_receipt_report_and_evidence_state",
] as const;

const NonEmpty = z.string().min(1);
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const RunOrderStage = z.enum(
  CASIMIR_DP_QED_SCALE_HIERARCHY_STAGE4_1_RUN_ORDER,
);

const AuthorityRef = z.object({
  role: NonEmpty,
  path: NonEmpty,
  sha256: Sha256,
  tracked: z.boolean(),
  required_at_runtime: z.boolean(),
}).strict();

const RequiredSourceAuthority = <
  Role extends string,
  Path extends string,
  Tracked extends boolean,
>(
  role: Role,
  path: Path,
  tracked: Tracked,
) =>
  AuthorityRef.extend({
    role: z.literal(role),
    path: z.literal(path),
    tracked: z.literal(tracked),
    required_at_runtime: z.literal(true),
  }).strict();

const SourceRef = z.object({
  source_id: NonEmpty,
  url: z.string().url(),
  citation: NonEmpty,
  supports: NonEmpty,
  does_not_support: NonEmpty,
}).strict();

export const CasimirDpQedScaleHierarchyStage4_1Config = z.object({
  schema_version: z.literal(
    CASIMIR_DP_QED_SCALE_HIERARCHY_STAGE4_1_VERSION,
  ),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.literal(
    "casimir-dp-qed-scale-hierarchy-stage4-1-v1",
  ),
  implementation_version: z.literal("1.0.0"),
  evidence_cutoff: NonEmpty,
  evidence_class: z.literal("source_backed_calculation"),
  claim_ceiling: z.literal("qed_scale_identity_calibration"),
  promotion_allowed: z.literal(false),
  stage4_1_authority_manifest: RequiredSourceAuthority(
    "stage4_1_authority_manifest",
    "configs/research/casimir-dp-stage4-1-authorities.v1.json",
    false,
  ),
  upstream_authorities: z.tuple([
    RequiredSourceAuthority(
      "stage4_config",
      "configs/research/casimir-dp-polarization-congruence-stage4.v1.json",
      false,
    ),
    RequiredSourceAuthority(
      "stage4_input_authority_manifest",
      "configs/research/casimir-dp-stage4-authorities.v1.json",
      false,
    ),
    RequiredSourceAuthority(
      "stage4_immutable_report_json",
      "artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/polarization-congruence-stage4-report.json",
      false,
    ),
    RequiredSourceAuthority(
      "stage4_immutable_report_markdown",
      "artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/polarization-congruence-stage4-report.md",
      false,
    ),
    RequiredSourceAuthority(
      "stage4_immutable_campaign_receipt",
      "artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/polarization-congruence-stage4-receipt.json",
      false,
    ),
    RequiredSourceAuthority(
      "stage4_downstream_verification_receipt",
      "docs/research/casimir-dp-polarization-congruence-stage4-verification-receipt.json",
      false,
    ),
    RequiredSourceAuthority(
      "codata_2022_constants_registry",
      "configs/constants/codata-2022.v1.json",
      true,
    ),
  ]),
  source_registry: z.array(SourceRef).min(4).superRefine(
    (sources, context) => {
      const ids = sources.map((source) => source.source_id);
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stage-4.1 source ids must be unique",
        });
      }
    },
  ),
  evidence_policy: z.object({
    constants_calibration_is_independent_measurement: z.literal(false),
    codata_tabulations_are_correlated: z.literal(true),
    cross_covariance_required_for_significance: z.literal(true),
    leading_hydrogenic_scale_is_precision_spectroscopy: z.literal(false),
    same_identity_family_implies_casimir_dp_connection: z.literal(false),
    alpha_fs_is_universal_emission_probability: z.literal(false),
    calibration_can_modify_immutable_stage4: z.literal(false),
    calibration_can_satisfy_measured_gate: z.literal(false),
    observable_bridge_edges_allowed: z.literal(false),
  }).strict(),
  runtime_fixture: z.object({
    path: z.literal(
      "configs/research/fixtures/casimir-dp-qed-scale-hierarchy.codata2022.v1.json",
    ),
    sha256: Sha256,
    schema_version: z.literal(
      "casimir_dp_qed_scale_hierarchy_calibration/1",
    ),
    evidence_class: z.literal("source_backed_calculation"),
  }).strict(),
  deterministic_seed: z.number().int().nonnegative(),
  software: z.object({
    runtime: z.literal("typescript"),
    runner: z.literal(
      "scripts/research/run-casimir-dp-qed-scale-hierarchy-stage4-1.ts",
    ),
    module_ids: z.tuple([
      z.literal(
        "shared/casimir-dp-qed-scale-hierarchy-calibration.ts",
      ),
      z.literal(
        "shared/contracts/casimir-dp-qed-scale-hierarchy-stage4-1.v1.ts",
      ),
    ]),
    source_authorities: z.tuple([
      RequiredSourceAuthority(
        "qed_scale_hierarchy_runtime",
        "shared/casimir-dp-qed-scale-hierarchy-calibration.ts",
        false,
      ),
      RequiredSourceAuthority(
        "stage4_1_contract",
        "shared/contracts/casimir-dp-qed-scale-hierarchy-stage4-1.v1.ts",
        false,
      ),
      RequiredSourceAuthority(
        "stage4_1_runner",
        "scripts/research/run-casimir-dp-qed-scale-hierarchy-stage4-1.ts",
        false,
      ),
    ]),
    source_snapshot: z.object({
      git_head: z.string().regex(/^[a-f0-9]{40}$/),
      worktree_state: z.literal(
        "dirty_uncommitted_source_hashes_authoritative",
      ),
      authority_mode: z.literal("content_hashes"),
    }).strict(),
  }).strict(),
  run_order: z.array(RunOrderStage).length(
    CASIMIR_DP_QED_SCALE_HIERARCHY_STAGE4_1_RUN_ORDER.length,
  ),
  final_status_policy: z.object({
    software_identity_calibration: z.literal("pass"),
    source_authority_integrity: z.literal("pass"),
    algebraic_identity_closure: z.literal("pass"),
    codata_tabulation_consistency: z.literal("pass"),
    covariance_semantics: z.literal("pass"),
    leading_reduced_mass_closure: z.literal("pass"),
    measured_evidence: z.literal("not_ready"),
    apparatus_material_response: z.literal("not_ready"),
    ordinary_physics_apparatus_closure: z.literal("not_ready"),
    precision_spectroscopy: z.literal("not_ready"),
    independent_empirical_validation: z.literal("not_evaluated"),
    polarization_or_helicity_model: z.literal("not_evaluated"),
    casimir_to_atomic_transfer: z.literal("blocked"),
    atomic_to_dp_transfer: z.literal("blocked"),
    compton_to_collapse_clock: z.literal("blocked"),
    collapse_identification: z.literal("blocked"),
    manifold_dynamics: z.literal("blocked"),
    physical_viability: z.literal("not_evaluated"),
    publication_claim: z.literal(
      "diagnostic_constants_calibration_only",
    ),
  }).strict(),
}).strict();

export type CasimirDpQedScaleHierarchyStage4_1Config = z.infer<
  typeof CasimirDpQedScaleHierarchyStage4_1Config
>;
