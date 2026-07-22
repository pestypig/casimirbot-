import { z } from "zod";
import { CorrelationPowerInput } from "../casimir-dp-data-readiness";

export const CASIMIR_DP_DATA_READINESS_VERSION = "casimir_dp_data_readiness/1" as const;
const SHA256 = z.string().regex(/^[a-f0-9]{64}$/);

const ArtifactPointer = z.object({
  path: z.string().min(1),
  sha256: SHA256,
  evidence_class: z.enum(["measured", "literature_anchored", "synthetic_fixture"]),
});

const DatasetManifestEntry = z.object({
  dataset_id: z.string().min(1),
  title: z.string().min(1),
  study_doi: z.string().min(1),
  access_url: z.string().url(),
  repository: z.string().min(1),
  access_status: z.enum([
    "open_machine_package",
    "open_source_data",
    "repository_landing_page",
    "supplement_only_raw_not_authenticated",
    "theory_reference_no_dataset",
  ]),
  retrieved_metadata_utc: z.string().datetime(),
  file_name: z.string().min(1).nullable(),
  repository_checksum: z.string().min(1).nullable(),
  intended_use: z.string().min(1),
  admissible_as_study_measurement: z.literal(false),
});

const SecondaryObservableProtocol = z.object({
  preregistration_id: z.string().min(1),
  blinded_boundary_labels: z.boolean(),
  primary_observable: z.literal("coherence_decay_rate_s"),
  secondary_observables: z.array(z.enum([
    "interferometric_phase_rad",
    "coupled_heat_W",
    "force_mismatch_N",
    "switch_cross_correlation",
  ])).min(3),
  negative_controls: z.array(z.enum([
    "matched_heating",
    "detuned_boundary",
    "identical_boundary",
    "label_permutation",
    "switch_disabled",
  ])).min(4),
  registered_null: z.string().min(1),
  registered_alternative: z.string().min(1),
  collapse_signature_source_ref: z.null(),
  identifiability_status: z.literal("blocked"),
});

export const CasimirDpDataReadinessConfig = z.object({
  schema_version: z.literal(CASIMIR_DP_DATA_READINESS_VERSION),
  study_id: z.literal("casimir-dp-quantum-foam-study"),
  campaign_id: z.string().min(1),
  evidence_cutoff: z.string().min(1),
  claim_tier: z.literal("diagnostic"),
  run_order: z.array(z.string().min(1)).min(1),
  optical_validation_fixture: ArtifactPointer,
  switching_sidecar: ArtifactPointer,
  decoherence_sidecar: ArtifactPointer,
  dataset_manifest: z.array(DatasetManifestEntry).min(4),
  secondary_observable_protocol: SecondaryObservableProtocol,
  correlation_power_cases: z.array(z.object({
    case_id: z.string().min(1),
    input: CorrelationPowerInput,
  })).min(2),
});

export type CasimirDpDataReadinessConfig = z.infer<typeof CasimirDpDataReadinessConfig>;

