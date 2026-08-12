import { createHash } from "node:crypto";

import {
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION,
} from "./nhm2-prolate-boson-star-branch-bvp.v1";
import {
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_ARTIFACT_ID,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
} from "./nhm2-prolate-boson-star-coherent-candidate-plan.v2";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_ARTIFACT_ID,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CONTRACT_VERSION,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_CANONICAL_JSON,
} from "./nhm2-prolate-boson-star-newtonian-seed.v1";

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ARTIFACT_ID =
  "nhm2.prolate_boson_star_newtonian_seed_run_plan" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTRACT_VERSION =
  "nhm2_prolate_boson_star_newtonian_seed_run_plan/v1" as const;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BLOCKERS =
  Object.freeze([
    "three_stage_specific_oci_images_and_digests_absent",
    "seed_input_closure_manifest_absent",
    "producer_source_toolchain_and_input_ledgers_absent",
    "independent_verifier_source_toolchain_and_input_ledgers_absent",
    "trusted_assembler_source_toolchain_and_input_ledgers_absent",
    "pairwise_stage_code_and_runtime_separation_not_attested",
    "closed_control_plane_evidence_validator_and_receipt_writer_absent",
    "isolated_worker_capability_and_attestation_absent",
    "hash_bound_seccomp_socket_denial_policy_absent",
    "runtime_seccomp_filter_load_receipts_absent",
    "scheduler_host_reserve_lease_absent",
    "absolute_monotonic_run_deadline_receipt_absent",
    "kernel_writable_mount_quota_and_rlimit_fsize_capability_absent",
    "per_stage_quota_setup_and_project_inheritance_receipts_absent",
    "closed_schema_dsl_typed_interpreter_absent",
    "resource_enforcement_receipt_absent",
    "producer_implementation_and_runtime_receipt_absent",
    "secure_staging_reread_and_independent_gate_replay_absent",
    "trusted_descriptor_assembly_and_final_secure_reread_absent",
    "final_descriptor_bundle_projection_equality_receipt_absent",
    "server_replayed_numerical_origin_series_defect_receipt_absent",
    "newtonian_seed_run_not_authorized_or_executed",
    "newtonian_seed_output_artifact_absent",
  ] as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 16,
    maximumNodes: 6912,
    maximumArrayLength: 64,
    maximumObjectPropertyCount: 64,
    maximumStringCodeUnits: 400,
    maximumStringUtf8Bytes: 1024,
    maximumTotalStringUtf8Bytes: 147456,
    maximumPropertyNameCodeUnits: 128,
    maximumPropertyNameUtf8Bytes: 256,
    maximumTotalPropertyNameUtf8Bytes: 82432,
  } as const);

const MIB = 1024 * 1024;
const GIB = 1024 * 1024 * 1024;
const DESCRIPTOR_MAXIMUM_UTF8_BYTES = 16 * MIB;
const VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES = 16 * MIB;
const ENFORCEMENT_RECEIPT_MAXIMUM_UTF8_BYTES = 1 * MIB;
const STDOUT_MAXIMUM_BYTES_PER_STAGE = 1 * MIB;
const STDERR_MAXIMUM_BYTES_PER_STAGE = 1 * MIB;
const SEED_CONTAINER_CLOSURE =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
    .containerClosure;

const OUTPUT_ARRAYS = Object.freeze(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
    (entry) =>
      Object.freeze({
        kind: "array" as const,
        writeOrderIndex: entry.inventoryIndex,
        outputId: `${entry.levelId}.${String(entry.roleIndex).padStart(2, "0")}`,
        levelId: entry.levelId,
        role: entry.role,
        relativePath: entry.relativePath,
        dtype: entry.dtype,
        order: entry.order,
        shape: entry.shape,
        elementCount: entry.elementCount,
        exactByteLength: entry.byteLength,
        producerWriterStage: "untrusted_seed_producer" as const,
        producerDestinationClass: "staging_only" as const,
        finalContainerWriterStage: "trusted_descriptor_assembler" as const,
        assemblerMustCopyVerifiedBytesExactly: true,
        exclusiveCreateRequired: true,
        openFlags: "O_CREAT|O_EXCL|O_WRONLY|O_CLOEXEC|O_NOFOLLOW" as const,
        fileFsyncBeforeCloseRequired: true,
        sha256RecordedInDescriptorRequired: true,
        producerDiagnosticsGrantAuthority: false,
      }),
  ),
);

const OUTPUT_DESCRIPTOR = Object.freeze({
  kind: "descriptor" as const,
  writeOrderIndex: 32,
  outputId: "seed_output_descriptor",
  role: "newtonian_seed.output_descriptor",
  relativePath: SEED_CONTAINER_CLOSURE.descriptorRelativePath,
  writerStage: "trusted_descriptor_assembler" as const,
  producerMayCreate: false,
  verifierMayCreate: false,
  encoding: "RFC8785_JSON_Canonicalization_Scheme_UTF8",
  maximumUtf8Bytes: DESCRIPTOR_MAXIMUM_UTF8_BYTES,
  exclusiveCreateRequired: true,
  openFlags: "O_CREAT|O_EXCL|O_WRONLY|O_CLOEXEC|O_NOFOLLOW" as const,
  temporaryFileOrRenameAllowed: false,
  createdOnlyAfterAllThirtyTwoVerifiedArraysCopiedClosedAndFsynced: true,
  fileFsyncBeforeCloseRequired: true,
  outputDirectoryFsyncAfterCloseRequired: true,
  actsAsLastWriteCommitMarkerOnly: true,
  producerGateOrProofSummariesGrantAuthority: false,
  exactRecursiveSchemaValidationRequired: true,
  rawBytesMustEqualRecanonicalizedUtf8BytesExactly: true,
  byteOrderMarkTrailingWhitespaceAndAlternateJsonSpellingsAllowed: false,
  canonicalByteEqualityRequiredBeforeLastWriteCommitMarkerAdmission: true,
  outputDescriptorSchemaBinding:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
  proofReplayProtocolBinding:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
  requiredServerReplayedReceiptFields: [
    "continuousNodelessProofReceipt",
    "continuousPeakProofReceipt",
    "numericalOriginSeriesDefectReceipt",
  ],
});

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_OUTPUT_INVENTORY =
  Object.freeze([...OUTPUT_ARRAYS, OUTPUT_DESCRIPTOR]);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ENVIRONMENT =
  Object.freeze({
    BLIS_NUM_THREADS: "1",
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    MKL_DYNAMIC: "FALSE",
    MKL_NUM_THREADS: "1",
    NUMEXPR_NUM_THREADS: "1",
    OMP_DYNAMIC: "FALSE",
    OMP_NUM_THREADS: "1",
    OMP_THREAD_LIMIT: "1",
    OPENBLAS_NUM_THREADS: "1",
    TMPDIR: "/run/staging",
    TZ: "UTC",
    VECLIB_MAXIMUM_THREADS: "1",
  } as const);

const VERIFIER_ENVIRONMENT = Object.freeze({
  ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ENVIRONMENT,
  TMPDIR: "/run/replay",
});
const ASSEMBLER_ENVIRONMENT = Object.freeze({
  ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ENVIRONMENT,
  TMPDIR: "/run/output",
});

const INPUT_CLOSURE_DUTIES = Object.freeze([
  {
    index: 0,
    id: "seed_run_request",
    relativePath: "00-seed-run-request.v1.json",
    encoding: "RFC8785_JSON_Canonicalization_Scheme_UTF8",
    duty: "bind_run_plan_seed_candidate_bvp_capability_toolchain_input_and_output_inventory",
  },
  {
    index: 1,
    id: "candidate_plan_v2_canonical_bytes",
    relativePath: "01-candidate-plan-v2.canonical.json",
    encoding: "canonical_json_utf8",
    duty: "supply_exact_imported_candidate_plan_binding_bytes",
  },
  {
    index: 2,
    id: "branch_bvp_v1_canonical_bytes",
    relativePath: "02-branch-bvp-v1.canonical.json",
    encoding: "canonical_json_utf8",
    duty: "supply_exact_imported_branch_bvp_binding_bytes",
  },
  {
    index: 3,
    id: "newtonian_seed_v1_canonical_bytes",
    relativePath: "03-newtonian-seed-v1.canonical.json",
    encoding: "canonical_json_utf8",
    duty: "supply_exact_imported_seed_contract_binding_bytes",
  },
  {
    index: 4,
    id: "proof_replay_protocol_canonical_bytes",
    relativePath: "04-proof-replay-protocol.v1.canonical.json",
    encoding: "canonical_json_utf8",
    duty: "supply_exact_imported_three_receipt_proof_replay_protocol_bytes",
  },
  {
    index: 5,
    id: "output_descriptor_schema_canonical_bytes",
    relativePath: "05-output-descriptor-schema.v1.canonical.json",
    encoding: "canonical_json_utf8",
    duty: "supply_exact_imported_closed_descriptor_and_three_receipt_schema_bytes",
  },
  {
    index: 6,
    id: "verifier_replay_bundle_schema_canonical_bytes",
    relativePath: "06-verifier-replay-bundle-schema.v1.canonical.json",
    encoding: "canonical_json_utf8",
    duty: "supply_exact_run_plan_hash_bound_closed_verifier_replay_bundle_schema_bytes",
  },
  {
    index: 7,
    id: "control_plane_evidence_grammar_registry_canonical_bytes",
    relativePath:
      "07-control-plane-evidence-grammar-registry.v1.canonical.json",
    encoding: "canonical_json_utf8",
    duty: "supply_exact_run_plan_hash_bound_recursive_stage_ledger_envelope_receipt_and_final_admission_grammars",
  },
] as const);

const INPUT_REQUIRED_FILE_PATH_ORDER = Object.freeze(
  INPUT_CLOSURE_DUTIES.map(({ relativePath }) => relativePath),
);
const INPUT_REQUIRED_EXPLICIT_DIRECTORY_PATH_ORDER = Object.freeze([] as const);
const PRODUCER_STAGE_INPUT_FILE_PATH_ORDER = Object.freeze(
  INPUT_REQUIRED_FILE_PATH_ORDER.map(
    (relativePath) => `/run/input/${relativePath}`,
  ),
);
const STAGING_ARRAY_FILE_PATH_ORDER = Object.freeze(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
    ({ relativePath }) => `/run/staging/${relativePath}`,
  ),
);
const VERIFIER_STAGE_INPUT_FILE_PATH_ORDER = Object.freeze([
  ...PRODUCER_STAGE_INPUT_FILE_PATH_ORDER,
  ...STAGING_ARRAY_FILE_PATH_ORDER,
]);
const VERIFIER_REPLAY_BUNDLE_PATH =
  "/run/replay/seed-verifier-replay-bundle.canonical.json" as const;
const VERIFIER_ENFORCEMENT_RECEIPT_PATH =
  "/run/attestation/verifier-stage-enforcement-receipt.canonical.json" as const;
const ASSEMBLER_STAGE_INPUT_FILE_PATH_ORDER = Object.freeze([
  ...VERIFIER_STAGE_INPUT_FILE_PATH_ORDER,
  VERIFIER_REPLAY_BUNDLE_PATH,
  VERIFIER_ENFORCEMENT_RECEIPT_PATH,
]);
const VERIFIER_STAGE_INPUT_DIRECTORY_PATH_ORDER = Object.freeze(
  SEED_CONTAINER_CLOSURE.requiredExplicitDirectoryPathOrder.map(
    (relativePath) => `/run/staging/${relativePath}`,
  ),
);
const STAGING_DIRECTORY_CREATION_PATH_ORDER = Object.freeze([
  "/run/staging",
  ...VERIFIER_STAGE_INPUT_DIRECTORY_PATH_ORDER,
]);
const FINAL_OUTPUT_DIRECTORY_CREATION_PATH_ORDER = Object.freeze([
  "/run/output",
  ...SEED_CONTAINER_CLOSURE.requiredExplicitDirectoryPathOrder.map(
    (relativePath) => `/run/output/${relativePath}`,
  ),
]);
const FINAL_OUTPUT_FILE_PATH_ORDER = Object.freeze(
  SEED_CONTAINER_CLOSURE.requiredFilePathOrder.map(
    (relativePath) => `/run/output/${relativePath}`,
  ),
);
const MAXIMUM_ARRAY_FILE_BYTES = Math.max(
  ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
    ({ byteLength }) => byteLength,
  ),
);
const ASSEMBLER_STAGE_INPUT_DIRECTORY_PATH_ORDER = Object.freeze([
  ...VERIFIER_STAGE_INPUT_DIRECTORY_PATH_ORDER,
  "/run/replay",
  "/run/attestation",
]);

const canonicalJsonForSubBinding = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJsonForSubBinding).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalJsonForSubBinding(record[key])}`,
    )
    .join(",")}}`;
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA =
  {
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.verifier_replay_bundle_schema",
    schemaVersion:
      "nhm2.prolate_boson_star.newtonian_seed.verifier_replay_bundle_schema/v1",
    authority:
      "nonexecuting_strict_trusted_verifier_to_assembler_schema_preregistration_only",
    runtimeTypedInterpreterBinding: null,
    executableValidationAuthorityPresent: false,
    canonicalization: "RFC8785_JSON_Canonicalization_Scheme_UTF8",
    maximumCanonicalUtf8Bytes: VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES,
    recursiveRules: {
      extraKeysAllowedAtAnyObjectDepth: false,
      sparseArraysAllowed: false,
      extraArrayEntriesAllowed: false,
      nonfiniteNumbersAllowed: false,
      negativeZeroAllowed: false,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "runPlanBinding",
        "runRequestBinding",
        "seedContractBinding",
        "candidatePlanV2Binding",
        "branchBvpV1Binding",
        "outputDescriptorSchemaBinding",
        "proofReplayProtocolBinding",
        "absoluteDeadlineBinding",
        "verifierSourceLedgerBinding",
        "verifierToolchainLedgerBinding",
        "verifierInputLedgerBinding",
        "verifierOciImageDigest",
        "observedArrayInventory",
        "serverRecomputedGateReport",
        "serverRecomputedScalarMetadata",
        "continuousNodelessProofReceipt",
        "continuousPeakProofReceipt",
        "numericalOriginSeriesDefectReceipt",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion: {
          kind: "literal",
          value:
            "nhm2.prolate_boson_star.newtonian_seed.verifier_replay_bundle/v1",
        },
        runPlanBinding: {
          kind: "authoritative_literal_binding",
          source: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
        },
        runRequestBinding: {
          kind: "exact_evidence_grammar_registry_binding_profile",
          profile: "seedRunRequest",
        },
        seedContractBinding: {
          kind: "authoritative_literal_binding",
          source: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING",
        },
        candidatePlanV2Binding: {
          kind: "authoritative_literal_binding",
          source: "NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING",
        },
        branchBvpV1Binding: {
          kind: "authoritative_literal_binding",
          source: "NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING",
        },
        outputDescriptorSchemaBinding: {
          kind: "authoritative_literal_binding",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING",
        },
        proofReplayProtocolBinding: {
          kind: "authoritative_literal_binding",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING",
        },
        absoluteDeadlineBinding: {
          kind: "exact_evidence_grammar_registry_binding_profile",
          profile: "absoluteDeadlineReceipt",
        },
        verifierSourceLedgerBinding: {
          kind: "exact_evidence_grammar_registry_binding_profile",
          profile: "verifierSourceClosureLedger",
        },
        verifierToolchainLedgerBinding: {
          kind: "exact_evidence_grammar_registry_binding_profile",
          profile: "verifierToolchainClosureLedger",
        },
        verifierInputLedgerBinding: {
          kind: "exact_evidence_grammar_registry_binding_profile",
          profile: "verifierInputLedger",
        },
        verifierOciImageDigest: { kind: "sha256_oci_digest" },
        observedArrayInventory: {
          kind: "tuple",
          exactLength: 32,
          extraEntriesAllowed: false,
          order: "imported_seed_output_array_inventory_order",
          itemExactKeys: [
            "inventoryIndex",
            "levelIndex",
            "roleIndex",
            "levelId",
            "role",
            "relativePath",
            "dtype",
            "order",
            "shape",
            "elementCount",
            "byteLength",
            "sha256",
          ],
          itemExtraKeysAllowed: false,
          itemSchemaSource:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA.topLevel.fields.arrayInventory.itemSchema",
          staticFieldsMustEqualImportedSeedInventory: true,
          byteLengthAndSha256MustBeServerObservedFromSecureReread: true,
          oneToOneRule:
            "entry.inventoryIndex_equals_tuple_index_and_every_static_field_equals_the_same_imported_inventory_entry_with_no_duplicate_path_or_index",
          sha256Semantics: {
            domainSource:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy.arraySha256Domain",
            recipeSource:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy.arrayHashRecipe",
            preimage:
              "utf8(domain)+u64be(path_utf8_length)+path_utf8+u64be(role_utf8_length)+role_utf8+u64be(byteLength)+exact_securely_reread_raw_array_bytes",
            digest: "lowercase_hex_sha256",
          },
        },
        serverRecomputedGateReport: {
          kind: "exact_imported_schema_reference",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA.topLevel.fields.serverRecomputedGateReport",
        },
        serverRecomputedScalarMetadata: {
          kind: "exact_imported_schema_reference",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA.topLevel.fields.scalarMetadata",
        },
        continuousNodelessProofReceipt: {
          kind: "exact_imported_schema_reference",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA.topLevel.fields.continuousNodelessProofReceipt",
        },
        continuousPeakProofReceipt: {
          kind: "exact_imported_schema_reference",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA.topLevel.fields.continuousPeakProofReceipt",
        },
        numericalOriginSeriesDefectReceipt: {
          kind: "exact_imported_schema_reference",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA.topLevel.fields.numericalOriginSeriesDefectReceipt",
        },
      },
      crossFieldInvariants: [
        "all_authoritative_binding_objects_equal_the_imported_or_current_singleton_exports",
        "all_32_observed_array_entries_equal_the_imported_static_inventory_and_secure_reread_observations",
        "server_recomputed_scalar_metadata_gate_results_and_three_receipts_are_independently_recomputed_from_exactly_those_32_observed_array_hashes_and_each_other_under_the_imported_cross_field_invariants",
        "all_three_receipts_bind_the_exact_imported_proof_protocol_and_verifier_proof_kernel_binding",
        "no_producer_diagnostic_summary_log_descriptor_or_callback_contributes_authority",
      ],
    },
  } as const;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-verifier-replay-bundle-schema/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_JSON =
  canonicalJsonForSubBinding(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA.artifactId,
    schemaVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA.schemaVersion,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_SIZE_BYTES,
  });
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_EXPECTED_SHA256 =
  "e9e2742d6e3fa1c2549a7bbeee0e917bba311920732078040de10e3d6995fa78" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES =
  5492 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_run_plan_v1_verifier_replay_bundle_schema_binding_drift",
  );
}

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY =
  {
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.control_plane_evidence_grammar_registry",
    registryVersion:
      "nhm2.prolate_boson_star.newtonian_seed.control_plane_evidence_grammar_registry/v1",
    authority:
      "nonexecuting_descriptive_typed_domain_separated_control_plane_preregistration_only",
    canonicalization: "RFC8785_JSON_Canonicalization_Scheme_UTF8",
    recursiveRules: {
      extraKeysAllowedAtAnyObjectDepth: false,
      sparseArraysAllowed: false,
      extraArrayEntriesAllowed: false,
      unregisteredSchemaReferencesAllowed: false,
      nonfiniteNumbersAllowed: false,
      negativeZeroAllowed: false,
      allInstanceBytesMustEqualRecanonicalizedUtf8Bytes: true,
    },
    hashPreimage: {
      algorithm: "SHA-256",
      digestEncoding: "lowercase_hex_64",
      exactBytes: "utf8(domain_literal_with_terminal_LF)+canonical_json_utf8",
      canonicalSizeBytesCountsOnlyCanonicalJsonUtf8: true,
      alternateDelimiterLengthPrefixOrEncodingAllowed: false,
    },
    primitives: {
      lowercaseSha256: "string_regex_^[0-9a-f]{64}$",
      ociSha256Digest: "string_regex_^sha256:[0-9a-f]{64}$",
      safeNonnegativeInteger:
        "JSON_number_integer_0_through_Number.MAX_SAFE_INTEGER_negative_zero_rejected",
      safePositiveInteger:
        "JSON_number_integer_1_through_Number.MAX_SAFE_INTEGER",
      canonicalUnsignedDecimal:
        "UTF8_string_regex_^(0|[1-9][0-9]*)$_no_leading_zero",
      canonicalAbsoluteLinuxPath:
        "UTF8_absolute_normalized_path_no_dot_dot_dot_empty_component_NUL_or_trailing_slash",
      canonicalRelativeLinuxPath:
        "UTF8_nonempty_normalized_relative_path_no_leading_slash_dot_dot_dot_empty_component_NUL_or_trailing_slash",
      canonicalJsonPointer:
        "RFC6901_UTF8_JSON_pointer_with_canonical_tilde_escaping",
      boundedUtf8String:
        "UTF8_string_at_most_8192_bytes_with_no_NUL_or_unpaired_surrogate",
      exactBoolean: "JSON_true_or_false_as_constrained_by_field",
      nullableSafeInteger: "null_or_safe_JSON_integer_negative_zero_rejected",
    },
    domains: {
      seedRunRequest: "nhm2-prolate-boson-star-newtonian-seed-run-request/v1\n",
      stageInputLedgerConstructionPolicy:
        "nhm2-prolate-boson-star-newtonian-seed-stage-input-ledger-construction-policy/v1\n",
      exactOutputInventory:
        "nhm2-prolate-boson-star-newtonian-seed-exact-output-inventory/v1\n",
      producerSourceClosureManifest:
        "nhm2-prolate-boson-star-newtonian-seed-producer-source-closure-manifest/v1\n",
      verifierSourceClosureManifest:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-source-closure-manifest/v1\n",
      assemblerSourceClosureManifest:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-source-closure-manifest/v1\n",
      producerSourceClosureLedger:
        "nhm2-prolate-boson-star-newtonian-seed-producer-source-closure-ledger/v1\n",
      verifierSourceClosureLedger:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-source-closure-ledger/v1\n",
      assemblerSourceClosureLedger:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-source-closure-ledger/v1\n",
      producerToolchainClosureManifest:
        "nhm2-prolate-boson-star-newtonian-seed-producer-toolchain-closure-manifest/v1\n",
      verifierToolchainClosureManifest:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-toolchain-closure-manifest/v1\n",
      assemblerToolchainClosureManifest:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-toolchain-closure-manifest/v1\n",
      producerToolchainClosureLedger:
        "nhm2-prolate-boson-star-newtonian-seed-producer-toolchain-closure-ledger/v1\n",
      verifierToolchainClosureLedger:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-toolchain-closure-ledger/v1\n",
      assemblerToolchainClosureLedger:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-toolchain-closure-ledger/v1\n",
      isolatedWorkerCapability:
        "nhm2-prolate-boson-star-newtonian-seed-isolated-worker-capability/v1\n",
      producerSeccompPolicy:
        "nhm2-prolate-boson-star-newtonian-seed-producer-seccomp-policy/v1\n",
      verifierSeccompPolicy:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-seccomp-policy/v1\n",
      assemblerSeccompPolicy:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-seccomp-policy/v1\n",
      producerSeccompLoadReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-producer-seccomp-load-receipt/v1\n",
      verifierSeccompLoadReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-seccomp-load-receipt/v1\n",
      assemblerSeccompLoadReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-seccomp-load-receipt/v1\n",
      schedulerLease:
        "nhm2-prolate-boson-star-newtonian-seed-scheduler-lease/v1\n",
      producerQuotaCapability:
        "nhm2-prolate-boson-star-newtonian-seed-producer-quota-capability/v1\n",
      verifierQuotaCapability:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-quota-capability/v1\n",
      assemblerQuotaCapability:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-quota-capability/v1\n",
      producerQuotaSetupReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-producer-quota-setup-receipt/v1\n",
      verifierQuotaSetupReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-quota-setup-receipt/v1\n",
      assemblerQuotaSetupReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-quota-setup-receipt/v1\n",
      crossStageSeparationReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-cross-stage-separation-receipt/v1\n",
      verifierProofKernel:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-proof-kernel/v1\n",
      verifierMpfrGmpRuntime:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-mpfr-gmp-runtime/v1\n",
      producerInputLedger:
        "nhm2-prolate-boson-star-newtonian-seed-producer-input-ledger/v1\n",
      verifierInputLedger:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-input-ledger/v1\n",
      assemblerInputLedger:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-input-ledger/v1\n",
      producerLaunchEnvelope:
        "nhm2-prolate-boson-star-newtonian-seed-producer-launch-envelope/v1\n",
      verifierLaunchEnvelope:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-launch-envelope/v1\n",
      assemblerLaunchEnvelope:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-launch-envelope/v1\n",
      stagingPrestateReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-staging-prestate-receipt/v1\n",
      replayPrestateReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-replay-prestate-receipt/v1\n",
      attestationPrestateReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-attestation-prestate-receipt/v1\n",
      finalOutputPrestateReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-final-output-prestate-receipt/v1\n",
      directoryPreparationReceiptBundle:
        "nhm2-prolate-boson-star-newtonian-seed-directory-preparation-receipt-bundle/v1\n",
      producerClosedOutputObservation:
        "nhm2-prolate-boson-star-newtonian-seed-producer-closed-output-observation/v1\n",
      verifierClosedOutputObservation:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-closed-output-observation/v1\n",
      assemblerClosedOutputObservation:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-closed-output-observation/v1\n",
      verifierReplayBundleInstance:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-replay-bundle/v1\n",
      observationCaptureReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-observation-capture-receipt/v1\n",
      absoluteDeadlineReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-absolute-deadline-receipt/v1\n",
      producerEnforcementReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-producer-enforcement-receipt/v1\n",
      verifierEnforcementReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-enforcement-receipt/v1\n",
      assemblerEnforcementReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-enforcement-receipt/v1\n",
      finalProjectionEqualityReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-final-projection-equality-receipt/v1\n",
      finalDescriptorObservation:
        "nhm2-prolate-boson-star-newtonian-seed-final-descriptor-observation/v1\n",
      finalContainerObservation:
        "nhm2-prolate-boson-star-newtonian-seed-final-container-observation/v1\n",
      finalAdmissionReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-final-admission-receipt/v1\n",
    },
    maximumCanonicalUtf8BytesByArtifact: {
      seedRunRequest: 1 * MIB,
      runPlanProjection: 1 * MIB,
      closureManifest: 64 * MIB,
      closureLedger: 64 * MIB,
      isolatedWorkerCapability: 1 * MIB,
      seccompPolicy: 1 * MIB,
      seccompLoadReceipt: 256 * 1024,
      schedulerLease: 256 * 1024,
      quotaCapability: 256 * 1024,
      quotaSetupReceipt: 256 * 1024,
      crossStageSeparationReceipt: 1 * MIB,
      verifierProofKernel: 1 * MIB,
      verifierMpfrGmpRuntime: 1 * MIB,
      stageInputLedger: 1 * MIB,
      stageLaunchEnvelope: 256 * 1024,
      directoryPrestateReceipt: 256 * 1024,
      directoryPreparationReceiptBundle: 256 * 1024,
      closedStageOutputObservation: 1 * MIB,
      verifierReplayBundleInstance: VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES,
      observationCaptureReceipt: 64 * 1024,
      absoluteDeadlineReceipt: 64 * 1024,
      stageEnforcementReceipt: ENFORCEMENT_RECEIPT_MAXIMUM_UTF8_BYTES,
      finalProjectionEqualityReceipt: 1 * MIB,
      finalDescriptorObservation: 256 * 1024,
      finalContainerObservation: 1 * MIB,
      finalAdmissionReceipt: 1 * MIB,
    },
    artifactBindingProfiles: {
      seedRunRequest: {
        artifactKind: "nhm2.prolate_boson_star_newtonian_seed.run_request",
        sha256DomainSource: "domains.seedRunRequest",
      },
      stageInputLedgerConstructionPolicy: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.stage_input_ledger_construction_policy",
        sha256DomainSource: "domains.stageInputLedgerConstructionPolicy",
      },
      exactOutputInventory: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.exact_output_inventory",
        sha256DomainSource: "domains.exactOutputInventory",
      },
      producerSourceClosureManifest: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_source_closure_manifest",
        sha256DomainSource: "domains.producerSourceClosureManifest",
      },
      verifierSourceClosureManifest: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_source_closure_manifest",
        sha256DomainSource: "domains.verifierSourceClosureManifest",
      },
      assemblerSourceClosureManifest: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_source_closure_manifest",
        sha256DomainSource: "domains.assemblerSourceClosureManifest",
      },
      producerSourceClosureLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_source_closure_ledger",
        sha256DomainSource: "domains.producerSourceClosureLedger",
      },
      verifierSourceClosureLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_source_closure_ledger",
        sha256DomainSource: "domains.verifierSourceClosureLedger",
      },
      assemblerSourceClosureLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_source_closure_ledger",
        sha256DomainSource: "domains.assemblerSourceClosureLedger",
      },
      producerToolchainClosureManifest: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_toolchain_closure_manifest",
        sha256DomainSource: "domains.producerToolchainClosureManifest",
      },
      verifierToolchainClosureManifest: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_toolchain_closure_manifest",
        sha256DomainSource: "domains.verifierToolchainClosureManifest",
      },
      assemblerToolchainClosureManifest: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_toolchain_closure_manifest",
        sha256DomainSource: "domains.assemblerToolchainClosureManifest",
      },
      producerToolchainClosureLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_toolchain_closure_ledger",
        sha256DomainSource: "domains.producerToolchainClosureLedger",
      },
      verifierToolchainClosureLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_toolchain_closure_ledger",
        sha256DomainSource: "domains.verifierToolchainClosureLedger",
      },
      assemblerToolchainClosureLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_toolchain_closure_ledger",
        sha256DomainSource: "domains.assemblerToolchainClosureLedger",
      },
      isolatedWorkerCapability: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.isolated_worker_capability",
        sha256DomainSource: "domains.isolatedWorkerCapability",
      },
      producerSeccompPolicy: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_seccomp_policy",
        sha256DomainSource: "domains.producerSeccompPolicy",
      },
      verifierSeccompPolicy: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_seccomp_policy",
        sha256DomainSource: "domains.verifierSeccompPolicy",
      },
      assemblerSeccompPolicy: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_seccomp_policy",
        sha256DomainSource: "domains.assemblerSeccompPolicy",
      },
      producerSeccompLoadReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_seccomp_load_receipt",
        sha256DomainSource: "domains.producerSeccompLoadReceipt",
      },
      verifierSeccompLoadReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_seccomp_load_receipt",
        sha256DomainSource: "domains.verifierSeccompLoadReceipt",
      },
      assemblerSeccompLoadReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_seccomp_load_receipt",
        sha256DomainSource: "domains.assemblerSeccompLoadReceipt",
      },
      schedulerLease: {
        artifactKind: "nhm2.prolate_boson_star_newtonian_seed.scheduler_lease",
        sha256DomainSource: "domains.schedulerLease",
      },
      producerQuotaCapability: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_quota_capability",
        sha256DomainSource: "domains.producerQuotaCapability",
      },
      verifierQuotaCapability: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_quota_capability",
        sha256DomainSource: "domains.verifierQuotaCapability",
      },
      assemblerQuotaCapability: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_quota_capability",
        sha256DomainSource: "domains.assemblerQuotaCapability",
      },
      producerQuotaSetupReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_quota_setup_receipt",
        sha256DomainSource: "domains.producerQuotaSetupReceipt",
      },
      verifierQuotaSetupReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_quota_setup_receipt",
        sha256DomainSource: "domains.verifierQuotaSetupReceipt",
      },
      assemblerQuotaSetupReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_quota_setup_receipt",
        sha256DomainSource: "domains.assemblerQuotaSetupReceipt",
      },
      crossStageSeparationReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.cross_stage_separation_receipt",
        sha256DomainSource: "domains.crossStageSeparationReceipt",
      },
      verifierProofKernel: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_proof_kernel",
        sha256DomainSource: "domains.verifierProofKernel",
      },
      verifierMpfrGmpRuntime: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_mpfr_gmp_runtime",
        sha256DomainSource: "domains.verifierMpfrGmpRuntime",
      },
      producerInputLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_input_ledger",
        sha256DomainSource: "domains.producerInputLedger",
      },
      verifierInputLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_input_ledger",
        sha256DomainSource: "domains.verifierInputLedger",
      },
      assemblerInputLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_input_ledger",
        sha256DomainSource: "domains.assemblerInputLedger",
      },
      producerLaunchEnvelope: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_launch_envelope",
        sha256DomainSource: "domains.producerLaunchEnvelope",
      },
      verifierLaunchEnvelope: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_launch_envelope",
        sha256DomainSource: "domains.verifierLaunchEnvelope",
      },
      assemblerLaunchEnvelope: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_launch_envelope",
        sha256DomainSource: "domains.assemblerLaunchEnvelope",
      },
      absoluteDeadlineReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.absolute_deadline_receipt",
        sha256DomainSource: "domains.absoluteDeadlineReceipt",
      },
      stagingPrestateReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.staging_prestate_receipt",
        sha256DomainSource: "domains.stagingPrestateReceipt",
      },
      replayPrestateReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.replay_prestate_receipt",
        sha256DomainSource: "domains.replayPrestateReceipt",
      },
      attestationPrestateReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.attestation_prestate_receipt",
        sha256DomainSource: "domains.attestationPrestateReceipt",
      },
      finalOutputPrestateReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.final_output_prestate_receipt",
        sha256DomainSource: "domains.finalOutputPrestateReceipt",
      },
      directoryPreparationReceiptBundle: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.directory_preparation_receipt_bundle",
        sha256DomainSource: "domains.directoryPreparationReceiptBundle",
      },
      producerClosedOutputObservation: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_closed_output_observation",
        sha256DomainSource: "domains.producerClosedOutputObservation",
      },
      verifierClosedOutputObservation: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_closed_output_observation",
        sha256DomainSource: "domains.verifierClosedOutputObservation",
      },
      assemblerClosedOutputObservation: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_closed_output_observation",
        sha256DomainSource: "domains.assemblerClosedOutputObservation",
      },
      verifierReplayBundleInstance: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_replay_bundle",
        sha256DomainSource: "domains.verifierReplayBundleInstance",
      },
      observationCaptureReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.observation_capture_receipt",
        sha256DomainSource: "domains.observationCaptureReceipt",
      },
      producerEnforcementReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.producer_enforcement_receipt",
        sha256DomainSource: "domains.producerEnforcementReceipt",
      },
      verifierEnforcementReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_enforcement_receipt",
        sha256DomainSource: "domains.verifierEnforcementReceipt",
      },
      assemblerEnforcementReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_enforcement_receipt",
        sha256DomainSource: "domains.assemblerEnforcementReceipt",
      },
      finalProjectionEqualityReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.final_projection_equality_receipt",
        sha256DomainSource: "domains.finalProjectionEqualityReceipt",
      },
      finalDescriptorObservation: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.final_descriptor_observation",
        sha256DomainSource: "domains.finalDescriptorObservation",
      },
      finalContainerObservation: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.final_container_observation",
        sha256DomainSource: "domains.finalContainerObservation",
      },
      finalAdmissionReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.final_admission_receipt",
        sha256DomainSource: "domains.finalAdmissionReceipt",
      },
    },
    schemaDslMetaSchema: {
      descriptiveBlueprintOnly: true,
      runtimeTypedInterpreterPresent: false,
      runtimeTypedInterpreterBinding: null,
      executableClosedSchemaAuthorityClaimed: false,
      descriptorKindRequiredButNotSufficientForRuntimeValidation: true,
      futureInterpreterMustRejectUnregisteredKindsAttributesAndFieldTypeTokens: true,
      futureInterpreterMustEnforceRequiredAndForbiddenAttributesByKind: true,
      genericControlPlaneBindingWithoutExactFieldProfileAllowed: false,
      allRegisteredDomainsUseRegistryHashPreimage: true,
      namedBindingNameProfiles: {
        producer_enforcement_receipt_binding: "producerEnforcementReceipt",
        verifier_enforcement_receipt_binding: "verifierEnforcementReceipt",
        verifier_replay_bundle_binding: "verifierReplayBundleInstance",
        staging_prestate_receipt_binding: "stagingPrestateReceipt",
        replay_prestate_receipt_binding: "replayPrestateReceipt",
        attestation_prestate_receipt_binding: "attestationPrestateReceipt",
        final_output_prestate_receipt_binding: "finalOutputPrestateReceipt",
      },
      fieldTypesTokenDefinitions: {
        authoritative_imported_descriptor_schema_binding:
          "exact_imported_output_descriptor_schema_binding_object",
        authoritative_imported_proof_protocol_binding:
          "exact_imported_proof_replay_protocol_binding_object",
        authoritative_run_plan_binding: "exact_current_run_plan_binding_object",
        canonicalUnsignedDecimal: "primitives.canonicalUnsignedDecimal",
        controlPlaneBinding:
          "schemas.controlPlaneBinding_resolved_only_through_bindingFieldProfiles",
        exactBoolean: "primitives.exactBoolean",
        literal_1800000000000: "exact_JSON_integer_1800000000000",
        literal_805306368: "exact_JSON_integer_805306368",
        literal_CLOCK_MONOTONIC_RAW: "exact_UTF8_CLOCK_MONOTONIC_RAW",
        literal_by_stage_profile: "exact_literal_selected_by_stageProfiles",
        literal_by_stage_quota_policy:
          "exact_literal_selected_by_stageProfiles.quotaPolicy",
        literal_by_tuple_index: "exact_literal_selected_by_tuple_profile_index",
        literal_closed_output_count_by_stage_profile:
          "exact_stageProfiles.closedOutputFileCount",
        literal_false_for_admission: "exact_JSON_false",
        "literal_nhm2.prolate_boson_star.newtonian_seed.absolute_deadline_receipt/v1":
          "exact_registered_schema_version",
        "literal_nhm2.prolate_boson_star.newtonian_seed.final_admission_receipt/v1":
          "exact_registered_schema_version",
        "literal_nhm2.prolate_boson_star.newtonian_seed.observation_capture_receipt/v1":
          "exact_registered_schema_version",
        "literal_nhm2.prolate_boson_star.newtonian_seed.stage_enforcement_receipt/v1":
          "exact_registered_schema_version",
        literal_run_plan_limit:
          "exact_limit_selected_from_run_plan_stage_policy",
        literal_true: "exact_JSON_true",
        literal_true_for_admission: "exact_JSON_true",
        literal_true_only_after_every_bound_receipt_passes: "exact_JSON_true",
        lowercaseSha256: "primitives.lowercaseSha256",
        nullableSafeInteger: "primitives.nullableSafeInteger",
        ociSha256Digest: "primitives.ociSha256Digest",
        safeNonnegativeInteger: "primitives.safeNonnegativeInteger",
        safeNonnegativeInteger_at_most_1: "exact_JSON_integer_0_or_1",
        safeNonnegativeInteger_equal_sum:
          "primitives.safeNonnegativeInteger_and_cross_field_exact_sum",
        safeNonnegativeInteger_equal_tuple_index:
          "primitives.safeNonnegativeInteger_and_equal_tuple_index",
        safeNonnegativeInteger_within_stage_cap:
          "primitives.safeNonnegativeInteger_and_at_most_stage_capture_cap",
        safeNonnegativeInteger_within_stage_quota:
          "primitives.safeNonnegativeInteger_and_at_most_bound_quota_hard_limit",
      },
      bindingFieldProfiles: {
        "namedControlPlaneBinding.binding":
          "exact_profile_selected_by_namedBindingNameProfiles",
        "closureLedger.manifestBinding":
          "closureManifest_by_stage_and_closure_class",
        "quotaCapability.isolatedWorkerCapabilityBinding":
          "isolatedWorkerCapability",
        "stageInputLedger.runRequestBinding": "seedRunRequest",
        "stageInputLedger.absoluteDeadlineBinding": "absoluteDeadlineReceipt",
        "stageInputLedger.quotaSetupReceiptBinding":
          "quotaSetupReceipt_by_stage_profile",
        "stageLaunchEnvelope.runRequestBinding": "seedRunRequest",
        "stageLaunchEnvelope.sourceManifestBinding":
          "sourceClosureManifest_by_stage_profile",
        "stageLaunchEnvelope.sourceLedgerBinding":
          "sourceClosureLedger_by_stage_profile",
        "stageLaunchEnvelope.toolchainManifestBinding":
          "toolchainClosureManifest_by_stage_profile",
        "stageLaunchEnvelope.toolchainLedgerBinding":
          "toolchainClosureLedger_by_stage_profile",
        "stageLaunchEnvelope.inputLedgerBinding":
          "inputLedger_by_stage_profile",
        "stageLaunchEnvelope.capabilityBinding": "isolatedWorkerCapability",
        "stageLaunchEnvelope.sandboxAndSeccompPolicyBinding":
          "seccompPolicy_by_stage_profile",
        "stageLaunchEnvelope.schedulerLeaseBinding": "schedulerLease",
        "stageLaunchEnvelope.quotaCapabilityBinding":
          "quotaCapability_by_stage_profile",
        "stageLaunchEnvelope.quotaSetupReceiptBinding":
          "quotaSetupReceipt_by_stage_profile",
        "stageLaunchEnvelope.absoluteDeadlineBinding":
          "absoluteDeadlineReceipt",
        "directoryPrestateReceipt.absoluteDeadlineBinding":
          "absoluteDeadlineReceipt",
        "directoryPreparationReceiptBundle.stagingPrestateReceiptBinding":
          "stagingPrestateReceipt",
        "directoryPreparationReceiptBundle.replayPrestateReceiptBinding":
          "replayPrestateReceipt",
        "directoryPreparationReceiptBundle.attestationPrestateReceiptBinding":
          "attestationPrestateReceipt",
        "directoryPreparationReceiptBundle.finalOutputPrestateReceiptBinding":
          "finalOutputPrestateReceipt",
        "closedStageOutputObservation.absoluteDeadlineBinding":
          "absoluteDeadlineReceipt",
        "observationCaptureReceipt.absoluteDeadlineBinding":
          "absoluteDeadlineReceipt",
        "absoluteDeadlineReceipt.schedulerLeaseBinding": "schedulerLease",
        "absoluteDeadlineReceipt.runRequestBinding": "seedRunRequest",
        "stageEnforcementReceipt.launchEnvelopeBinding":
          "launchEnvelope_by_stage_profile",
        "stageEnforcementReceipt.runRequestBinding": "seedRunRequest",
        "stageEnforcementReceipt.sourceManifestBinding":
          "sourceClosureManifest_by_stage_profile",
        "stageEnforcementReceipt.sourceLedgerBinding":
          "sourceClosureLedger_by_stage_profile",
        "stageEnforcementReceipt.toolchainManifestBinding":
          "toolchainClosureManifest_by_stage_profile",
        "stageEnforcementReceipt.toolchainLedgerBinding":
          "toolchainClosureLedger_by_stage_profile",
        "stageEnforcementReceipt.inputLedgerBinding":
          "inputLedger_by_stage_profile",
        "stageEnforcementReceipt.capabilityBinding": "isolatedWorkerCapability",
        "stageEnforcementReceipt.sandboxAndSeccompPolicyBinding":
          "seccompPolicy_by_stage_profile",
        "stageEnforcementReceipt.seccompLoadReceiptBinding":
          "seccompLoadReceipt_by_stage_profile",
        "stageEnforcementReceipt.schedulerLeaseBinding": "schedulerLease",
        "stageEnforcementReceipt.quotaCapabilityBinding":
          "quotaCapability_by_stage_profile",
        "stageEnforcementReceipt.quotaSetupReceiptBinding":
          "quotaSetupReceipt_by_stage_profile",
        "stageEnforcementReceipt.absoluteDeadlineBinding":
          "absoluteDeadlineReceipt",
        "stageEnforcementReceipt.closedStageOutputObservationBinding":
          "closedOutputObservation_by_stage_profile",
        "stageEnforcementReceipt.observationCaptureReceiptBinding":
          "observationCaptureReceipt",
        "finalProjectionEqualityReceipt.absoluteDeadlineBinding":
          "absoluteDeadlineReceipt",
        "finalProjectionEqualityReceipt.replayBundleBinding":
          "verifierReplayBundleInstance",
        "finalProjectionEqualityReceipt.finalDescriptorBinding":
          "finalDescriptorObservation",
        "finalProjectionEqualityReceipt.finalContainerObservationBinding":
          "finalContainerObservation",
        "finalAdmissionReceipt.absoluteDeadlineBinding":
          "absoluteDeadlineReceipt",
        "finalAdmissionReceipt.directoryPreparationReceiptBundleBinding":
          "directoryPreparationReceiptBundle",
        "finalAdmissionReceipt.producerEnforcementReceiptBinding":
          "producerEnforcementReceipt",
        "finalAdmissionReceipt.verifierEnforcementReceiptBinding":
          "verifierEnforcementReceipt",
        "finalAdmissionReceipt.assemblerEnforcementReceiptBinding":
          "assemblerEnforcementReceipt",
        "finalAdmissionReceipt.replayBundleBinding":
          "verifierReplayBundleInstance",
        "finalAdmissionReceipt.finalContainerObservationBinding":
          "finalContainerObservation",
        "finalAdmissionReceipt.finalProjectionEqualityReceiptBinding":
          "finalProjectionEqualityReceipt",
      },
    },
    instanceHashGrammars: {
      seedRunRequest: {
        schema: "schemas.seedRunRequest",
        bindingProfile: "seedRunRequest",
        preimage: "hashPreimage.exactBytes",
      },
      runPlanProjections: {
        schema: "schemas.runPlanProjection",
        exactBindingProfileOrder: [
          "stageInputLedgerConstructionPolicy",
          "exactOutputInventory",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      sourceClosureManifests: {
        schema: "schemas.closureManifest",
        exactBindingProfileOrder: [
          "producerSourceClosureManifest",
          "verifierSourceClosureManifest",
          "assemblerSourceClosureManifest",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      sourceClosureLedgers: {
        schema: "schemas.closureLedger",
        exactBindingProfileOrder: [
          "producerSourceClosureLedger",
          "verifierSourceClosureLedger",
          "assemblerSourceClosureLedger",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      toolchainClosureManifests: {
        schema: "schemas.closureManifest",
        exactBindingProfileOrder: [
          "producerToolchainClosureManifest",
          "verifierToolchainClosureManifest",
          "assemblerToolchainClosureManifest",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      toolchainClosureLedgers: {
        schema: "schemas.closureLedger",
        exactBindingProfileOrder: [
          "producerToolchainClosureLedger",
          "verifierToolchainClosureLedger",
          "assemblerToolchainClosureLedger",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      isolatedWorkerCapability: {
        schema: "schemas.isolatedWorkerCapability",
        bindingProfile: "isolatedWorkerCapability",
        preimage: "hashPreimage.exactBytes",
      },
      seccompPolicies: {
        schema: "schemas.seccompPolicy",
        exactBindingProfileOrder: [
          "producerSeccompPolicy",
          "verifierSeccompPolicy",
          "assemblerSeccompPolicy",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      seccompLoadReceipts: {
        schema: "schemas.seccompLoadReceipt",
        exactBindingProfileOrder: [
          "producerSeccompLoadReceipt",
          "verifierSeccompLoadReceipt",
          "assemblerSeccompLoadReceipt",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      schedulerLease: {
        schema: "schemas.schedulerLease",
        bindingProfile: "schedulerLease",
        preimage: "hashPreimage.exactBytes",
      },
      quotaCapabilities: {
        schema: "schemas.quotaCapability",
        exactBindingProfileOrder: [
          "producerQuotaCapability",
          "verifierQuotaCapability",
          "assemblerQuotaCapability",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      quotaSetupReceipts: {
        schema: "schemas.quotaSetupReceipt",
        exactBindingProfileOrder: [
          "producerQuotaSetupReceipt",
          "verifierQuotaSetupReceipt",
          "assemblerQuotaSetupReceipt",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      crossStageSeparationReceipt: {
        schema: "schemas.crossStageSeparationReceipt",
        bindingProfile: "crossStageSeparationReceipt",
        preimage: "hashPreimage.exactBytes",
      },
      verifierMpfrGmpRuntime: {
        schema: "schemas.verifierMpfrGmpRuntime",
        bindingProfile: "verifierMpfrGmpRuntime",
        preimage: "hashPreimage.exactBytes",
      },
      verifierProofKernel: {
        schema: "schemas.verifierProofKernel",
        bindingProfile: "verifierProofKernel",
        preimage: "hashPreimage.exactBytes",
      },
      stageInputLedgers: {
        schema: "schemas.stageInputLedger",
        exactBindingProfileOrder: [
          "producerInputLedger",
          "verifierInputLedger",
          "assemblerInputLedger",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      stageLaunchEnvelopes: {
        schema: "schemas.stageLaunchEnvelope",
        exactBindingProfileOrder: [
          "producerLaunchEnvelope",
          "verifierLaunchEnvelope",
          "assemblerLaunchEnvelope",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      absoluteDeadlineReceipt: {
        schema: "schemas.absoluteDeadlineReceipt",
        bindingProfile: "absoluteDeadlineReceipt",
        preimage: "hashPreimage.exactBytes",
      },
      directoryPrestateReceipts: {
        schema: "schemas.directoryPrestateReceipt",
        exactBindingProfileOrder: [
          "stagingPrestateReceipt",
          "replayPrestateReceipt",
          "attestationPrestateReceipt",
          "finalOutputPrestateReceipt",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      directoryPreparationReceiptBundle: {
        schema: "schemas.directoryPreparationReceiptBundle",
        bindingProfile: "directoryPreparationReceiptBundle",
        preimage: "hashPreimage.exactBytes",
      },
      closedStageOutputObservations: {
        schema: "schemas.closedStageOutputObservation",
        exactBindingProfileOrder: [
          "producerClosedOutputObservation",
          "verifierClosedOutputObservation",
          "assemblerClosedOutputObservation",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      observationCaptureReceipt: {
        schema: "schemas.observationCaptureReceipt",
        bindingProfile: "observationCaptureReceipt",
        preimage: "hashPreimage.exactBytes",
      },
      stageEnforcementReceipts: {
        schema: "schemas.stageEnforcementReceipt",
        exactBindingProfileOrder: [
          "producerEnforcementReceipt",
          "verifierEnforcementReceipt",
          "assemblerEnforcementReceipt",
        ],
        preimage: "hashPreimage.exactBytes",
      },
      finalProjectionEqualityReceipt: {
        schema: "schemas.finalProjectionEqualityReceipt",
        bindingProfile: "finalProjectionEqualityReceipt",
        preimage: "hashPreimage.exactBytes",
      },
      finalDescriptorObservation: {
        schema: "schemas.finalDescriptorObservation",
        bindingProfile: "finalDescriptorObservation",
        preimage: "hashPreimage.exactBytes",
      },
      finalContainerObservation: {
        schema: "schemas.finalContainerObservation",
        bindingProfile: "finalContainerObservation",
        preimage: "hashPreimage.exactBytes",
      },
      finalAdmissionReceipt: {
        schema: "schemas.finalAdmissionReceipt",
        bindingProfile: "finalAdmissionReceipt",
        preimage: "hashPreimage.exactBytes",
      },
    },
    stageProfiles: {
      producer: {
        stageId: "untrusted_seed_producer",
        sourceManifestBindingProfile: "producerSourceClosureManifest",
        sourceLedgerBindingProfile: "producerSourceClosureLedger",
        toolchainManifestBindingProfile: "producerToolchainClosureManifest",
        toolchainLedgerBindingProfile: "producerToolchainClosureLedger",
        inputLedgerBindingProfile: "producerInputLedger",
        seccompPolicyBindingProfile: "producerSeccompPolicy",
        seccompLoadReceiptBindingProfile: "producerSeccompLoadReceipt",
        quotaCapabilityBindingProfile: "producerQuotaCapability",
        quotaSetupReceiptBindingProfile: "producerQuotaSetupReceipt",
        sourceClosureRootPath: "/opt/nhm2-producer/source",
        toolchainClosureRootPath: "/opt/nhm2-producer/toolchain",
        executableAbsolutePath:
          "/opt/nhm2-producer/toolchain/python/bin/python3",
        bootstrapAbsolutePath:
          "/opt/nhm2-producer/source/producer/bootstrap.py",
        closureDutyProfiles: {
          source: [
            { dutyIndex: 6, dutyId: "producer_bootstrap_and_import_policy" },
            { dutyIndex: 7, dutyId: "seed_solver_and_discretization_source" },
            { dutyIndex: 8, dutyId: "staging_array_serializer" },
            { dutyIndex: 10, dutyId: "producer_seccomp_profile" },
          ],
          toolchain: [
            { dutyIndex: 0, dutyId: "oci_image_manifest_config_and_layers" },
            { dutyIndex: 1, dutyId: "base_os_and_dynamic_loader_closure" },
            { dutyIndex: 2, dutyId: "cpython_runtime_closure" },
            { dutyIndex: 3, dutyId: "numpy_runtime_closure" },
            { dutyIndex: 4, dutyId: "scipy_runtime_closure" },
            { dutyIndex: 5, dutyId: "blas_lapack_runtime_closure" },
            {
              dutyIndex: 9,
              dutyId: "producer_runtime_sbom_and_dependency_lock",
            },
          ],
        },
        criticalFileRoleProfiles: {
          source: [
            { roleId: "bootstrap", dutyIndex: 6 },
            { roleId: "solver_entrypoint", dutyIndex: 7 },
            { roleId: "array_serializer", dutyIndex: 8 },
            { roleId: "seccomp_compiler_source", dutyIndex: 10 },
            { roleId: "source_build_recipe", dutyIndex: 7 },
          ],
          toolchain: [
            { roleId: "oci_manifest", dutyIndex: 0 },
            { roleId: "dynamic_loader", dutyIndex: 1 },
            { roleId: "python_executable", dutyIndex: 2 },
            { roleId: "numpy_runtime", dutyIndex: 3 },
            { roleId: "scipy_runtime", dutyIndex: 4 },
            { roleId: "blas_lapack_runtime", dutyIndex: 5 },
            { roleId: "toolchain_build_recipe", dutyIndex: 9 },
            { roleId: "sbom_dependency_lock", dutyIndex: 9 },
          ],
        },
        quotaPolicy: {
          writableMountPath: "/run/staging",
          maximumChargedBytes: 16 * MIB,
          maximumChargedInodes: 64,
          rlimitFsizeBytes: MAXIMUM_ARRAY_FILE_BYTES,
        },
        inputFileCount: INPUT_CLOSURE_DUTIES.length,
        inputFilePathOrder: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER,
        inputDirectoryPathOrder: INPUT_REQUIRED_EXPLICIT_DIRECTORY_PATH_ORDER,
        priorStageReceiptNameOrder: [],
        launchPrestateReceiptNameOrder: ["staging_prestate_receipt_binding"],
        closedOutputFileCount: 32,
        closedOutputFilePathOrder: STAGING_ARRAY_FILE_PATH_ORDER,
        closedOutputDirectoryPathOrder:
          VERIFIER_STAGE_INPUT_DIRECTORY_PATH_ORDER,
      },
      verifier: {
        stageId: "trusted_independent_verifier",
        sourceManifestBindingProfile: "verifierSourceClosureManifest",
        sourceLedgerBindingProfile: "verifierSourceClosureLedger",
        toolchainManifestBindingProfile: "verifierToolchainClosureManifest",
        toolchainLedgerBindingProfile: "verifierToolchainClosureLedger",
        inputLedgerBindingProfile: "verifierInputLedger",
        seccompPolicyBindingProfile: "verifierSeccompPolicy",
        seccompLoadReceiptBindingProfile: "verifierSeccompLoadReceipt",
        quotaCapabilityBindingProfile: "verifierQuotaCapability",
        quotaSetupReceiptBindingProfile: "verifierQuotaSetupReceipt",
        sourceClosureRootPath: "/opt/nhm2-verifier/source",
        toolchainClosureRootPath: "/opt/nhm2-verifier/toolchain",
        executableAbsolutePath:
          "/opt/nhm2-verifier/toolchain/python/bin/python3",
        bootstrapAbsolutePath:
          "/opt/nhm2-verifier/source/verifier/bootstrap.py",
        closureDutyProfiles: {
          source: [
            {
              dutyIndex: 3,
              dutyId: "secure_staging_array_reader_and_rehasher",
            },
            { dutyIndex: 4, dutyId: "independent_seed_gate_replayer" },
            { dutyIndex: 5, dutyId: "mpfr_gmp_continuous_proof_kernel" },
            { dutyIndex: 6, dutyId: "sealed_replay_bundle_serializer" },
            { dutyIndex: 8, dutyId: "verifier_seccomp_profile" },
          ],
          toolchain: [
            {
              dutyIndex: 0,
              dutyId: "verifier_oci_image_manifest_config_and_layers",
            },
            {
              dutyIndex: 1,
              dutyId: "verifier_base_os_and_dynamic_loader_closure",
            },
            { dutyIndex: 2, dutyId: "verifier_runtime_and_numerics_closure" },
            {
              dutyIndex: 7,
              dutyId: "verifier_runtime_sbom_and_dependency_lock",
            },
          ],
        },
        criticalFileRoleProfiles: {
          source: [
            { roleId: "bootstrap", dutyIndex: 4 },
            { roleId: "secure_array_reader", dutyIndex: 3 },
            { roleId: "independent_gate_replayer", dutyIndex: 4 },
            { roleId: "proof_kernel", dutyIndex: 5 },
            { roleId: "replay_bundle_serializer", dutyIndex: 6 },
            { roleId: "seccomp_compiler_source", dutyIndex: 8 },
            { roleId: "source_build_recipe", dutyIndex: 4 },
          ],
          toolchain: [
            { roleId: "oci_manifest", dutyIndex: 0 },
            { roleId: "dynamic_loader", dutyIndex: 1 },
            { roleId: "verifier_executable", dutyIndex: 2 },
            { roleId: "directed_rounding_runtime", dutyIndex: 2 },
            { roleId: "toolchain_build_recipe", dutyIndex: 7 },
            { roleId: "sbom_dependency_lock", dutyIndex: 7 },
          ],
        },
        quotaPolicy: {
          writableMountPath: "/run/replay",
          maximumChargedBytes: 20 * MIB,
          maximumChargedInodes: 8,
          rlimitFsizeBytes: VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES,
        },
        inputFileCount: VERIFIER_STAGE_INPUT_FILE_PATH_ORDER.length,
        inputFilePathOrder: VERIFIER_STAGE_INPUT_FILE_PATH_ORDER,
        inputDirectoryPathOrder: VERIFIER_STAGE_INPUT_DIRECTORY_PATH_ORDER,
        priorStageReceiptNameOrder: [
          "producer_enforcement_receipt_binding",
          "staging_prestate_receipt_binding",
        ],
        launchPrestateReceiptNameOrder: [
          "staging_prestate_receipt_binding",
          "replay_prestate_receipt_binding",
        ],
        closedOutputFileCount: 1,
        closedOutputFilePathOrder: [VERIFIER_REPLAY_BUNDLE_PATH],
        closedOutputDirectoryPathOrder: [],
      },
      assembler: {
        stageId: "trusted_descriptor_assembler",
        sourceManifestBindingProfile: "assemblerSourceClosureManifest",
        sourceLedgerBindingProfile: "assemblerSourceClosureLedger",
        toolchainManifestBindingProfile: "assemblerToolchainClosureManifest",
        toolchainLedgerBindingProfile: "assemblerToolchainClosureLedger",
        inputLedgerBindingProfile: "assemblerInputLedger",
        seccompPolicyBindingProfile: "assemblerSeccompPolicy",
        seccompLoadReceiptBindingProfile: "assemblerSeccompLoadReceipt",
        quotaCapabilityBindingProfile: "assemblerQuotaCapability",
        quotaSetupReceiptBindingProfile: "assemblerQuotaSetupReceipt",
        sourceClosureRootPath: "/opt/nhm2-assembler/source",
        toolchainClosureRootPath: "/opt/nhm2-assembler/toolchain",
        executableAbsolutePath:
          "/opt/nhm2-assembler/toolchain/python/bin/python3",
        bootstrapAbsolutePath:
          "/opt/nhm2-assembler/source/assembler/bootstrap.py",
        closureDutyProfiles: {
          source: [
            { dutyIndex: 3, dutyId: "verified_array_exclusive_copier" },
            { dutyIndex: 4, dutyId: "descriptor_schema_validator" },
            { dutyIndex: 5, dutyId: "canonical_descriptor_last_writer" },
            { dutyIndex: 7, dutyId: "assembler_seccomp_profile" },
          ],
          toolchain: [
            {
              dutyIndex: 0,
              dutyId: "assembler_oci_image_manifest_config_and_layers",
            },
            {
              dutyIndex: 1,
              dutyId: "assembler_base_os_and_dynamic_loader_closure",
            },
            { dutyIndex: 2, dutyId: "assembler_minimal_runtime_closure" },
            {
              dutyIndex: 6,
              dutyId: "assembler_runtime_sbom_and_dependency_lock",
            },
          ],
        },
        criticalFileRoleProfiles: {
          source: [
            { roleId: "bootstrap", dutyIndex: 3 },
            { roleId: "exclusive_array_copier", dutyIndex: 3 },
            { roleId: "descriptor_schema_validator", dutyIndex: 4 },
            { roleId: "canonical_descriptor_writer", dutyIndex: 5 },
            { roleId: "seccomp_compiler_source", dutyIndex: 7 },
            { roleId: "source_build_recipe", dutyIndex: 5 },
          ],
          toolchain: [
            { roleId: "oci_manifest", dutyIndex: 0 },
            { roleId: "dynamic_loader", dutyIndex: 1 },
            { roleId: "assembler_executable", dutyIndex: 2 },
            { roleId: "toolchain_build_recipe", dutyIndex: 6 },
            { roleId: "sbom_dependency_lock", dutyIndex: 6 },
          ],
        },
        quotaPolicy: {
          writableMountPath: "/run/output",
          maximumChargedBytes: 32 * MIB,
          maximumChargedInodes: 64,
          rlimitFsizeBytes: DESCRIPTOR_MAXIMUM_UTF8_BYTES,
        },
        inputFileCount: ASSEMBLER_STAGE_INPUT_FILE_PATH_ORDER.length,
        inputFilePathOrder: ASSEMBLER_STAGE_INPUT_FILE_PATH_ORDER,
        inputDirectoryPathOrder: ASSEMBLER_STAGE_INPUT_DIRECTORY_PATH_ORDER,
        priorStageReceiptNameOrder: [
          "producer_enforcement_receipt_binding",
          "verifier_enforcement_receipt_binding",
          "verifier_replay_bundle_binding",
          "final_output_prestate_receipt_binding",
        ],
        launchPrestateReceiptNameOrder: [
          "staging_prestate_receipt_binding",
          "replay_prestate_receipt_binding",
          "attestation_prestate_receipt_binding",
          "final_output_prestate_receipt_binding",
        ],
        closedOutputFileCount: 33,
        closedOutputFilePathOrder: FINAL_OUTPUT_FILE_PATH_ORDER,
        closedOutputDirectoryPathOrder:
          FINAL_OUTPUT_DIRECTORY_CREATION_PATH_ORDER.slice(1),
      },
    },
    rootPrestateProfiles: {
      staging: {
        rootAbsolutePath: "/run/staging",
        creationTiming: "before_producer_launch",
        exactDirectoryPathOrder: STAGING_DIRECTORY_CREATION_PATH_ORDER,
      },
      replay: {
        rootAbsolutePath: "/run/replay",
        creationTiming: "after_producer_cgroup_empty_before_verifier_launch",
        exactDirectoryPathOrder: ["/run/replay"],
      },
      attestation: {
        rootAbsolutePath: "/run/attestation",
        creationTiming:
          "after_verifier_exit_before_trusted_broker_writes_post_exit_receipt",
        exactDirectoryPathOrder: ["/run/attestation"],
      },
      final_output: {
        rootAbsolutePath: "/run/output",
        creationTiming:
          "after_verifier_post_exit_receipt_validation_before_assembler_launch",
        exactDirectoryPathOrder: FINAL_OUTPUT_DIRECTORY_CREATION_PATH_ORDER,
      },
    },
    schemas: {
      namedControlPlaneBinding: {
        kind: "object",
        exactKeys: ["name", "binding"],
        extraKeysAllowed: false,
        fields: {
          name: { kind: "literal_by_referencing_tuple_profile" },
          binding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
            bindingProfile:
              "exact_profile_selected_by_name_and_referencing_tuple",
          },
        },
        crossFieldInvariants: [
          "name_and_binding_profile_equal_the_same_exact_referencing_tuple_entry",
        ],
      },
      closureDirectoryItem: {
        kind: "object",
        exactKeys: ["ordinal", "relativePath", "modeOctal"],
        extraKeysAllowed: false,
        fields: {
          ordinal: { kind: "primitive", source: "safeNonnegativeInteger" },
          relativePath: {
            kind: "primitive",
            source: "canonicalRelativeLinuxPath",
          },
          modeOctal: {
            kind: "enum",
            values: ["0555", "0500"],
          },
        },
      },
      closureFileItem: {
        kind: "object",
        exactKeys: [
          "ordinal",
          "relativePath",
          "byteLength",
          "sha256",
          "modeOctal",
          "mediaType",
        ],
        extraKeysAllowed: false,
        fields: {
          ordinal: { kind: "primitive", source: "safeNonnegativeInteger" },
          relativePath: {
            kind: "primitive",
            source: "canonicalRelativeLinuxPath",
          },
          byteLength: {
            kind: "primitive",
            source: "safeNonnegativeInteger",
          },
          sha256: { kind: "primitive", source: "lowercaseSha256" },
          modeOctal: {
            kind: "enum",
            values: ["0444", "0555", "0400", "0500"],
          },
          mediaType: { kind: "primitive", source: "boundedUtf8String" },
        },
      },
      closureDutyCoverageItem: {
        kind: "object",
        exactKeys: ["dutyIndex", "dutyId", "fileOrdinals"],
        extraKeysAllowed: false,
        fields: {
          dutyIndex: { kind: "primitive", source: "safeNonnegativeInteger" },
          dutyId: { kind: "primitive", source: "boundedUtf8String" },
          fileOrdinals: {
            kind: "sorted_unique_tuple",
            minimumLength: 1,
            maximumLength: 65536,
            itemPrimitive: "safeNonnegativeInteger",
            extraEntriesAllowed: false,
          },
        },
      },
      criticalClosureFileRoleItem: {
        kind: "object",
        exactKeys: ["roleId", "dutyIndex", "fileOrdinal"],
        extraKeysAllowed: false,
        fields: {
          roleId: { kind: "primitive", source: "boundedUtf8String" },
          dutyIndex: { kind: "primitive", source: "safeNonnegativeInteger" },
          fileOrdinal: {
            kind: "primitive",
            source: "safeNonnegativeInteger",
          },
        },
      },
      closureManifest: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "closureClass",
          "manifestSha256Domain",
          "rootAbsolutePath",
          "exactDirectoryCount",
          "exactDirectoryPathOrder",
          "directoryItems",
          "exactFileCount",
          "exactFilePathOrder",
          "fileItems",
          "dutyCoverage",
          "criticalFileRoleCoverage",
          "aggregateFileBytes",
          "inventoryComplete",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value: "nhm2.prolate_boson_star.newtonian_seed.closure_manifest/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          closureClass: { kind: "enum", values: ["source", "toolchain"] },
          manifestSha256Domain: {
            kind: "literal_domain_by_stage_and_closure_class",
          },
          rootAbsolutePath: {
            kind: "literal_root_by_stage_and_closure_class",
          },
          exactDirectoryCount: {
            kind: "bounded_count",
            minimum: 1,
            maximum: 8192,
          },
          exactDirectoryPathOrder: {
            kind: "tuple",
            exactLengthFromField: "exactDirectoryCount",
            maximumLength: 8192,
            itemPrimitive: "canonicalRelativeLinuxPath",
            extraEntriesAllowed: false,
          },
          directoryItems: {
            kind: "tuple",
            exactLengthFromField: "exactDirectoryCount",
            maximumLength: 8192,
            itemSchema: "closureDirectoryItem",
            extraEntriesAllowed: false,
          },
          exactFileCount: {
            kind: "bounded_count",
            minimum: 1,
            maximum: 65536,
          },
          exactFilePathOrder: {
            kind: "tuple",
            exactLengthFromField: "exactFileCount",
            maximumLength: 65536,
            itemPrimitive: "canonicalRelativeLinuxPath",
            extraEntriesAllowed: false,
          },
          fileItems: {
            kind: "tuple",
            exactLengthFromField: "exactFileCount",
            maximumLength: 65536,
            itemSchema: "closureFileItem",
            extraEntriesAllowed: false,
          },
          dutyCoverage: {
            kind: "tuple_by_stage_and_closure_class_profile",
            profileProperty: "closureDutyProfiles",
            itemSchema: "closureDutyCoverageItem",
            extraEntriesAllowed: false,
          },
          criticalFileRoleCoverage: {
            kind: "tuple_by_stage_and_closure_class_profile",
            profileProperty: "criticalFileRoleProfiles",
            itemSchema: "criticalClosureFileRoleItem",
            extraEntriesAllowed: false,
          },
          aggregateFileBytes: {
            kind: "primitive",
            source: "safeNonnegativeInteger",
          },
          inventoryComplete: { kind: "literal", value: true },
        },
        crossFieldInvariants: [
          "for_each_i_directoryItems[i].ordinal=i_and_relativePath=exactDirectoryPathOrder[i]",
          "for_each_i_fileItems[i].ordinal=i_and_relativePath=exactFilePathOrder[i]",
          "all_relative_paths_are_unique_normalized_and_every_file_parent_is_declared",
          "aggregateFileBytes_equals_the_exact_safe_integer_sum_of_fileItems.byteLength",
          "dutyCoverage_length_order_dutyIndex_and_dutyId_equal_the_exact_selected_stage_and_closure_class_duty_profile",
          "each_duty_fileOrdinals_tuple_is_nonempty_sorted_unique_and_every_ordinal_is_in_range",
          "every_file_ordinal_appears_in_at_least_one_duty_record_and_every_directory_is_an_ancestor_of_at_least_one_mapped_file",
          "criticalFileRoleCoverage_length_order_roleId_and_dutyIndex_equal_the_exact_selected_stage_and_closure_class_profile_before_each_fileOrdinal_is_resolved",
          "critical_role_file_ordinals_are_pairwise_distinct_and_bind_explicit_build_recipe_SBOM_entrypoint_executable_bootstrap_serializer_proof_kernel_and_seccomp_implementation_files_as_applicable",
          "no_unlisted_file_directory_symlink_hardlink_device_fifo_socket_or_mount_entry_is_admissible",
        ],
      },
      closureLedger: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "closureClass",
          "ledgerSha256Domain",
          "manifestBinding",
          "rootDirectoryObservation",
          "directoryObservations",
          "fileObservations",
          "ociImageDigest",
          "secureObservationComplete",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value: "nhm2.prolate_boson_star.newtonian_seed.closure_ledger/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          closureClass: { kind: "enum", values: ["source", "toolchain"] },
          ledgerSha256Domain: {
            kind: "literal_domain_by_stage_and_closure_class",
          },
          manifestBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
            bindingProfile: "closureManifest_by_stage_and_closure_class",
          },
          rootDirectoryObservation: {
            kind: "schema_reference",
            source: "directoryObservation",
          },
          directoryObservations: {
            kind: "tuple_exact_length_from_bound_manifest",
            itemSchema: "directoryObservation",
            maximumLength: 8192,
            extraEntriesAllowed: false,
          },
          fileObservations: {
            kind: "tuple_exact_length_from_bound_manifest",
            itemSchema: "fileObservation",
            maximumLength: 65536,
            extraEntriesAllowed: false,
          },
          ociImageDigest: { kind: "primitive", source: "ociSha256Digest" },
          secureObservationComplete: { kind: "literal", value: true },
        },
        crossFieldInvariants: [
          "manifestBinding_resolves_to_the_same_stage_and_closure_class_and_recomputes_under_the_exact_registered_manifest_domain",
          "root_and_every_directory_and_file_observation_use_the_secure_file_protocol_and_are_one_to_one_in_the_bound_manifest_order",
          "every_observed_file_byteLength_and_sha256_equals_the_bound_manifest_item",
          "every_duty_and_critical_role_file_ordinal_resolves_to_the_same_one_to_one_secure_file_observation_in_the_bound_manifest_order",
          "the_executable_bootstrap_build_recipe_SBOM_entrypoint_serializer_proof_kernel_and_seccomp_implementation_observations_equal_their_exact_critical_role_manifest_items",
          "the_ledger_OCI_digest_equals_the_stage_image_digest_and_the_observed_roots_are_read_only_at_launch",
        ],
      },
      runPlanProjection: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "projectionId",
          "runPlanJsonPointer",
          "projectedCanonicalValueSha256",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.run_plan_projection/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          projectionId: {
            kind: "enum",
            values: [
              "stage_input_ledger_construction_policy",
              "exact_output_inventory",
            ],
          },
          runPlanJsonPointer: {
            kind: "literal_by_projection_id",
            values: {
              stage_input_ledger_construction_policy:
                "/stageInputLedgerAndLaunchEnvelopePolicy",
              exact_output_inventory: "/outputPolicy/inventory",
            },
          },
          projectedCanonicalValueSha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
        },
        crossFieldInvariants: [
          "projectedCanonicalValueSha256_is_plain_SHA256_of_the_exact_RFC8785_UTF8_value_at_runPlanJsonPointer_in_runPlanBinding",
        ],
      },
      seedRunRequest: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "candidatePlanV2Binding",
          "branchBvpV1Binding",
          "seedContractBinding",
          "outputDescriptorSchemaBinding",
          "proofReplayProtocolBinding",
          "verifierReplayBundleSchemaBinding",
          "controlPlaneEvidenceGrammarRegistryBinding",
          "isolatedWorkerCapabilityBinding",
          "schedulerLeaseBinding",
          "producerSourceManifestBinding",
          "producerSourceLedgerBinding",
          "producerToolchainManifestBinding",
          "producerToolchainLedgerBinding",
          "producerSeccompPolicyBinding",
          "producerQuotaCapabilityBinding",
          "producerOciImageDigest",
          "verifierSourceManifestBinding",
          "verifierSourceLedgerBinding",
          "verifierToolchainManifestBinding",
          "verifierToolchainLedgerBinding",
          "verifierSeccompPolicyBinding",
          "verifierQuotaCapabilityBinding",
          "verifierOciImageDigest",
          "assemblerSourceManifestBinding",
          "assemblerSourceLedgerBinding",
          "assemblerToolchainManifestBinding",
          "assemblerToolchainLedgerBinding",
          "assemblerSeccompPolicyBinding",
          "assemblerQuotaCapabilityBinding",
          "assemblerOciImageDigest",
          "crossStageSeparationReceiptBinding",
          "verifierProofKernelBinding",
          "verifierMpfrGmpRuntimeBinding",
          "stageInputLedgerConstructionPolicyBinding",
          "exactOutputInventoryBinding",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value: "nhm2.prolate_boson_star.newtonian_seed.run_request/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          candidatePlanV2Binding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING",
          },
          branchBvpV1Binding: {
            kind: "authoritative_literal_binding",
            source: "NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING",
          },
          seedContractBinding: {
            kind: "authoritative_literal_binding",
            source: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING",
          },
          outputDescriptorSchemaBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING",
          },
          proofReplayProtocolBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING",
          },
          verifierReplayBundleSchemaBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING",
          },
          controlPlaneEvidenceGrammarRegistryBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING",
          },
          isolatedWorkerCapabilityBinding: {
            kind: "binding_profile",
            profile: "isolatedWorkerCapability",
          },
          schedulerLeaseBinding: {
            kind: "binding_profile",
            profile: "schedulerLease",
          },
          producerSourceManifestBinding: {
            kind: "binding_profile",
            profile: "producerSourceClosureManifest",
          },
          producerSourceLedgerBinding: {
            kind: "binding_profile",
            profile: "producerSourceClosureLedger",
          },
          producerToolchainManifestBinding: {
            kind: "binding_profile",
            profile: "producerToolchainClosureManifest",
          },
          producerToolchainLedgerBinding: {
            kind: "binding_profile",
            profile: "producerToolchainClosureLedger",
          },
          producerSeccompPolicyBinding: {
            kind: "binding_profile",
            profile: "producerSeccompPolicy",
          },
          producerQuotaCapabilityBinding: {
            kind: "binding_profile",
            profile: "producerQuotaCapability",
          },
          producerOciImageDigest: {
            kind: "primitive",
            source: "ociSha256Digest",
          },
          verifierSourceManifestBinding: {
            kind: "binding_profile",
            profile: "verifierSourceClosureManifest",
          },
          verifierSourceLedgerBinding: {
            kind: "binding_profile",
            profile: "verifierSourceClosureLedger",
          },
          verifierToolchainManifestBinding: {
            kind: "binding_profile",
            profile: "verifierToolchainClosureManifest",
          },
          verifierToolchainLedgerBinding: {
            kind: "binding_profile",
            profile: "verifierToolchainClosureLedger",
          },
          verifierSeccompPolicyBinding: {
            kind: "binding_profile",
            profile: "verifierSeccompPolicy",
          },
          verifierQuotaCapabilityBinding: {
            kind: "binding_profile",
            profile: "verifierQuotaCapability",
          },
          verifierOciImageDigest: {
            kind: "primitive",
            source: "ociSha256Digest",
          },
          assemblerSourceManifestBinding: {
            kind: "binding_profile",
            profile: "assemblerSourceClosureManifest",
          },
          assemblerSourceLedgerBinding: {
            kind: "binding_profile",
            profile: "assemblerSourceClosureLedger",
          },
          assemblerToolchainManifestBinding: {
            kind: "binding_profile",
            profile: "assemblerToolchainClosureManifest",
          },
          assemblerToolchainLedgerBinding: {
            kind: "binding_profile",
            profile: "assemblerToolchainClosureLedger",
          },
          assemblerSeccompPolicyBinding: {
            kind: "binding_profile",
            profile: "assemblerSeccompPolicy",
          },
          assemblerQuotaCapabilityBinding: {
            kind: "binding_profile",
            profile: "assemblerQuotaCapability",
          },
          assemblerOciImageDigest: {
            kind: "primitive",
            source: "ociSha256Digest",
          },
          crossStageSeparationReceiptBinding: {
            kind: "binding_profile",
            profile: "crossStageSeparationReceipt",
          },
          verifierProofKernelBinding: {
            kind: "binding_profile",
            profile: "verifierProofKernel",
          },
          verifierMpfrGmpRuntimeBinding: {
            kind: "binding_profile",
            profile: "verifierMpfrGmpRuntime",
          },
          stageInputLedgerConstructionPolicyBinding: {
            kind: "binding_profile",
            profile: "stageInputLedgerConstructionPolicy",
          },
          exactOutputInventoryBinding: {
            kind: "binding_profile",
            profile: "exactOutputInventory",
          },
        },
        crossFieldInvariants: [
          "every_manifest_binding_equals_the_manifestBinding_in_its_corresponding_full_ledger",
          "each_source_and_toolchain_ledger_OCI_digest_equals_the_same_stage_OCI_digest",
          "all_three_source_all_three_toolchain_all_three_seccomp_and_all_three_quota_bindings_are_pairwise_distinct_within_their_respective_classes",
          "crossStageSeparationReceiptBinding_replays_all_six_full_closure_ledger_bindings_and_three_OCI_digests",
          "future_stage_input_ledgers_launch_envelopes_outputs_or_post_exit_receipts_are_forbidden",
        ],
      },
      isolatedWorkerCapability: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "architecture",
          "linuxKernelRelease",
          "ociRuntimeName",
          "ociRuntimeVersion",
          "cgroupVersion",
          "requiredControllerOrder",
          "cgroupKillSupported",
          "openat2ResolveFlagsSupported",
          "seccompFilterSupported",
          "projectQuotaSupported",
          "rlimitFsizeSupported",
          "attestedByBrokerFileObservation",
          "capabilityProbeMonotonicNanoseconds",
          "allRequiredCapabilitiesPresent",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.isolated_worker_capability/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          architecture: { kind: "literal", value: "linux_x86_64" },
          linuxKernelRelease: {
            kind: "primitive",
            source: "boundedUtf8String",
          },
          ociRuntimeName: { kind: "primitive", source: "boundedUtf8String" },
          ociRuntimeVersion: { kind: "primitive", source: "boundedUtf8String" },
          cgroupVersion: { kind: "literal", value: 2 },
          requiredControllerOrder: {
            kind: "literal_tuple",
            values: ["memory", "pids"],
            extraEntriesAllowed: false,
          },
          cgroupKillSupported: { kind: "literal", value: true },
          openat2ResolveFlagsSupported: { kind: "literal", value: true },
          seccompFilterSupported: { kind: "literal", value: true },
          projectQuotaSupported: { kind: "literal", value: true },
          rlimitFsizeSupported: { kind: "literal", value: true },
          attestedByBrokerFileObservation: {
            kind: "schema_reference",
            source: "fileObservation",
          },
          capabilityProbeMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          allRequiredCapabilitiesPresent: { kind: "literal", value: true },
        },
        crossFieldInvariants: [
          "attestedByBrokerFileObservation_is_the_secure_observation_of_the_exact_OCI_runtime_executable_identified_by_ociRuntimeName_and_ociRuntimeVersion",
        ],
      },
      seccompCompilerInvocationBinding: {
        kind: "object",
        exactKeys: [
          "bindingVersion",
          "artifactKind",
          "sha256Domain",
          "sha256",
          "canonicalSizeBytes",
        ],
        extraKeysAllowed: false,
        fields: {
          bindingVersion: {
            kind: "literal",
            value: "nhm2.control_plane.domain_hash_binding/v1",
          },
          artifactKind: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star_newtonian_seed.seccomp_compiler_invocation",
          },
          sha256Domain: {
            kind: "literal",
            value:
              "nhm2-prolate-boson-star-newtonian-seed-seccomp-compiler-invocation/v1\n",
          },
          sha256: { kind: "primitive", source: "lowercaseSha256" },
          canonicalSizeBytes: {
            kind: "primitive",
            source: "safePositiveInteger",
          },
        },
      },
      seccompCompilerInvocation: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "compilerSourceLedgerBinding",
          "compilerToolchainLedgerBinding",
          "compilerSourceObservation",
          "compilerRuntimeExecutableObservation",
          "defaultAction",
          "architectureOrder",
          "allowedSyscallOrder",
          "explicitlyDeniedSocketSyscallOrder",
          "noNewPrivilegesRequired",
          "compilerArgumentOrder",
          "compilerEnvironmentOrder",
          "shellUsed",
          "compiledBpfSha256",
          "compiledBpfByteLength",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.seccomp_compiler_invocation/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          compilerSourceLedgerBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.sourceLedgerBindingProfile",
          },
          compilerToolchainLedgerBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.toolchainLedgerBindingProfile",
          },
          compilerSourceObservation: {
            kind: "schema_reference",
            source: "fileObservation",
          },
          compilerRuntimeExecutableObservation: {
            kind: "schema_reference",
            source: "fileObservation",
          },
          defaultAction: { kind: "literal", value: "SCMP_ACT_KILL_PROCESS" },
          architectureOrder: {
            kind: "literal_tuple",
            values: ["SCMP_ARCH_X86_64"],
            extraEntriesAllowed: false,
          },
          allowedSyscallOrder: {
            kind: "sorted_unique_tuple",
            minimumLength: 1,
            maximumLength: 512,
            itemPrimitive: "boundedUtf8String",
            extraEntriesAllowed: false,
          },
          explicitlyDeniedSocketSyscallOrder: {
            kind: "literal_tuple_from_run_plan_network_policy",
            extraEntriesAllowed: false,
          },
          noNewPrivilegesRequired: { kind: "literal", value: true },
          compilerArgumentOrder: {
            kind: "literal_tuple",
            values: [
              "--canonical-policy-fd=3",
              "--compiled-bpf-fd=4",
              "--reject-nondeterminism",
              "--architecture=SCMP_ARCH_X86_64",
            ],
            extraEntriesAllowed: false,
          },
          compilerEnvironmentOrder: {
            kind: "literal_tuple",
            values: ["LANG=C.UTF-8", "LC_ALL=C.UTF-8", "TZ=UTC"],
            extraEntriesAllowed: false,
          },
          shellUsed: { kind: "literal", value: false },
          compiledBpfSha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          compiledBpfByteLength: {
            kind: "primitive",
            source: "safePositiveInteger",
          },
        },
        crossFieldInvariants: [
          "compilerSourceObservation_recursively_equals_the_bound_source_ledger_observation_for_the_exact_seccomp_compiler_source_critical_role",
          "compilerRuntimeExecutableObservation_recursively_equals_the_bound_toolchain_ledger_observation_for_the_exact_stage_runtime_executable_critical_role",
          "allowed_and_denied_syscall_tuples_are_disjoint_and_equal_the_enclosing_seccomp_policy_tuples",
          "the_compiled_BPF_SHA256_and_byte_length_equal_the_single_deterministic_compiler_output_and_the_enclosing_seccomp_policy_fields",
        ],
      },
      seccompRuntimeLoadAttestationBinding: {
        kind: "object",
        exactKeys: [
          "bindingVersion",
          "artifactKind",
          "sha256Domain",
          "sha256",
          "canonicalSizeBytes",
        ],
        extraKeysAllowed: false,
        fields: {
          bindingVersion: {
            kind: "literal",
            value: "nhm2.control_plane.domain_hash_binding/v1",
          },
          artifactKind: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star_newtonian_seed.seccomp_runtime_load_attestation",
          },
          sha256Domain: {
            kind: "literal",
            value:
              "nhm2-prolate-boson-star-newtonian-seed-seccomp-runtime-load-attestation/v1\n",
          },
          sha256: { kind: "primitive", source: "lowercaseSha256" },
          canonicalSizeBytes: {
            kind: "primitive",
            source: "safePositiveInteger",
          },
        },
      },
      seccompRuntimeLoadAttestation: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "seccompPolicyBinding",
          "capabilityBinding",
          "absoluteDeadlineBinding",
          "ociImageDigest",
          "ociRuntimeExecutableObservation",
          "containerId",
          "containerInitPid",
          "pidNamespaceInode",
          "compiledBpfSha256",
          "loadedBpfSha256",
          "seccompModeReadback",
          "noNewPrivilegesReadback",
          "readbackMonotonicNanoseconds",
          "loadedBeforeScientificWork",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.seccomp_runtime_load_attestation/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          seccompPolicyBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.seccompPolicyBindingProfile",
          },
          capabilityBinding: {
            kind: "binding_profile",
            profile: "isolatedWorkerCapability",
          },
          absoluteDeadlineBinding: {
            kind: "binding_profile",
            profile: "absoluteDeadlineReceipt",
          },
          ociImageDigest: { kind: "primitive", source: "ociSha256Digest" },
          ociRuntimeExecutableObservation: {
            kind: "schema_reference",
            source: "fileObservation",
          },
          containerId: { kind: "primitive", source: "boundedUtf8String" },
          containerInitPid: {
            kind: "primitive",
            source: "safePositiveInteger",
          },
          pidNamespaceInode: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          compiledBpfSha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          loadedBpfSha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          seccompModeReadback: { kind: "literal", value: 2 },
          noNewPrivilegesReadback: { kind: "literal", value: true },
          readbackMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          loadedBeforeScientificWork: { kind: "literal", value: true },
        },
        crossFieldInvariants: [
          "the_OCI_runtime_executable_observation_recursively_equals_the_secure_runtime_observation_bound_by_the_isolated_worker_capability",
          "the_container_ID_init_PID_PID_namespace_image_and_policy_identify_one_exact_stage_container",
          "compiledBpfSha256_equals_loadedBpfSha256_and_the_compiled_BPF_in_the_bound_policy",
          "seccomp_mode_no_new_privileges_and_readback_time_equal_the_enclosing_load_receipt_and_precede_scientific_work_and_the_absolute_deadline",
        ],
      },
      seccompPolicy: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "policySha256Domain",
          "defaultAction",
          "architectureOrder",
          "allowedSyscallOrder",
          "explicitlyDeniedSocketSyscallOrder",
          "compilerSourceLedgerBinding",
          "compilerToolchainLedgerBinding",
          "compilerInvocation",
          "compilerInvocationBinding",
          "compiledBpfSha256",
          "compiledBpfByteLength",
          "noNewPrivilegesRequired",
          "linuxCapabilityOrder",
          "userNotificationOrBrokeredSyscallsAllowed",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value: "nhm2.prolate_boson_star.newtonian_seed.seccomp_policy/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          policySha256Domain: { kind: "literal_domain_by_stage_profile" },
          defaultAction: { kind: "literal", value: "SCMP_ACT_KILL_PROCESS" },
          architectureOrder: {
            kind: "literal_tuple",
            values: ["SCMP_ARCH_X86_64"],
            extraEntriesAllowed: false,
          },
          allowedSyscallOrder: {
            kind: "sorted_unique_tuple",
            minimumLength: 1,
            maximumLength: 512,
            itemPrimitive: "boundedUtf8String",
            extraEntriesAllowed: false,
          },
          explicitlyDeniedSocketSyscallOrder: {
            kind: "literal_tuple_from_run_plan_network_policy",
            extraEntriesAllowed: false,
          },
          compilerSourceLedgerBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.sourceLedgerBindingProfile",
          },
          compilerToolchainLedgerBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.toolchainLedgerBindingProfile",
          },
          compilerInvocation: {
            kind: "schema_reference",
            source: "seccompCompilerInvocation",
          },
          compilerInvocationBinding: {
            kind: "schema_reference",
            source: "seccompCompilerInvocationBinding",
          },
          compiledBpfSha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          compiledBpfByteLength: {
            kind: "primitive",
            source: "safePositiveInteger",
          },
          noNewPrivilegesRequired: { kind: "literal", value: true },
          linuxCapabilityOrder: {
            kind: "literal_tuple",
            values: [],
            extraEntriesAllowed: false,
          },
          userNotificationOrBrokeredSyscallsAllowed: {
            kind: "literal",
            value: false,
          },
        },
        crossFieldInvariants: [
          "allowedSyscallOrder_and_explicitlyDeniedSocketSyscallOrder_are_disjoint",
          "compiler_source_and_toolchain_ledgers_bind_the_exact_deterministic_seccomp_compiler_implementation_and_dependencies",
          "compilerInvocationBinding.sha256_recomputes_from_UTF8_of_its_exact_terminal_LF_domain_followed_by_the_RFC8785_canonical_UTF8_bytes_of_compilerInvocation_and_canonicalSizeBytes_equals_those_JSON_bytes_only",
          "compilerInvocation_recursively_binds_the_same_stage_source_ledger_toolchain_ledger_policy_syscall_tuples_and_compiled_BPF_SHA256_and_byte_length",
          "compiledBpfSha256_and_compiledBpfByteLength_are_recomputed_from_the_single_deterministic_compiler_output_for_this_exact_policy_and_invocation",
        ],
      },
      seccompLoadReceipt: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "runPlanBinding",
          "seccompPolicyBinding",
          "capabilityBinding",
          "absoluteDeadlineBinding",
          "ociImageDigest",
          "compiledBpfSha256",
          "loadedBpfSha256",
          "seccompModeReadback",
          "noNewPrivilegesReadback",
          "runtimeLoadAttestation",
          "runtimeLoadAttestationBinding",
          "readbackMonotonicNanoseconds",
          "loadedBeforeScientificWork",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.seccomp_load_receipt/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          seccompPolicyBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.seccompPolicyBindingProfile",
          },
          capabilityBinding: {
            kind: "binding_profile",
            profile: "isolatedWorkerCapability",
          },
          absoluteDeadlineBinding: {
            kind: "binding_profile",
            profile: "absoluteDeadlineReceipt",
          },
          ociImageDigest: { kind: "primitive", source: "ociSha256Digest" },
          compiledBpfSha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          loadedBpfSha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          seccompModeReadback: { kind: "literal", value: 2 },
          noNewPrivilegesReadback: { kind: "literal", value: true },
          runtimeLoadAttestation: {
            kind: "schema_reference",
            source: "seccompRuntimeLoadAttestation",
          },
          runtimeLoadAttestationBinding: {
            kind: "schema_reference",
            source: "seccompRuntimeLoadAttestationBinding",
          },
          readbackMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          loadedBeforeScientificWork: { kind: "literal", value: true },
        },
        crossFieldInvariants: [
          "compiledBpfSha256_equals_loadedBpfSha256_and_the_compiledBpfSha256_in_the_bound_static_policy",
          "runtimeLoadAttestationBinding.sha256_recomputes_from_UTF8_of_its_exact_terminal_LF_domain_followed_by_the_RFC8785_canonical_UTF8_bytes_of_runtimeLoadAttestation_and_canonicalSizeBytes_equals_those_JSON_bytes_only",
          "runtimeLoadAttestation_recursively_equals_the_exact_policy_capability_deadline_image_compiled_and_loaded_filter_kernel_readbacks_and_timestamps_in_this_receipt_and_identifies_one_exact_stage_container",
          "readbackMonotonicNanoseconds_is_before_scientific_work_and_strictly_before_the_absolute_deadline",
          "a_generic_socket_probe_or_network_namespace_is_not_filter_identity_authority",
        ],
      },
      schedulerLease: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "leaseId",
          "schedulerIdentitySha256",
          "hostIdentitySha256",
          "minimumReservedHostBytes",
          "issuedMonotonicNanoseconds",
          "releaseNotBeforeFinalAdmissionOrTerminalFailure",
          "exclusiveScientificRunLease",
          "active",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value: "nhm2.prolate_boson_star.newtonian_seed.scheduler_lease/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          leaseId: { kind: "primitive", source: "boundedUtf8String" },
          schedulerIdentitySha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          hostIdentitySha256: { kind: "primitive", source: "lowercaseSha256" },
          minimumReservedHostBytes: { kind: "literal", value: 2 * GIB },
          issuedMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          releaseNotBeforeFinalAdmissionOrTerminalFailure: {
            kind: "literal",
            value: true,
          },
          exclusiveScientificRunLease: { kind: "literal", value: true },
          active: { kind: "literal", value: true },
        },
      },
      quotaCapability: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "runPlanBinding",
          "isolatedWorkerCapabilityBinding",
          "quotaSha256Domain",
          "quotaMechanism",
          "projectInheritanceFlag",
          "configuredHardByteLimit",
          "configuredHardInodeLimit",
          "configuredRlimitFsizeSoftBytes",
          "configuredRlimitFsizeHardBytes",
          "quotaGraceAllowed",
          "dynamicStageEvidenceAllowedInStaticCapability",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value: "nhm2.prolate_boson_star.newtonian_seed.quota_capability/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          isolatedWorkerCapabilityBinding: {
            kind: "binding_profile",
            profile: "isolatedWorkerCapability",
          },
          quotaSha256Domain: { kind: "literal_domain_by_stage_profile" },
          quotaMechanism: {
            kind: "literal",
            value: "linux_project_quota",
          },
          projectInheritanceFlag: {
            kind: "literal",
            value: "FS_XFLAG_PROJINHERIT",
          },
          configuredHardByteLimit: { kind: "literal_by_stage_quota_policy" },
          configuredHardInodeLimit: { kind: "literal_by_stage_quota_policy" },
          configuredRlimitFsizeSoftBytes: {
            kind: "literal_by_stage_quota_policy",
          },
          configuredRlimitFsizeHardBytes: {
            kind: "literal_by_stage_quota_policy",
          },
          quotaGraceAllowed: { kind: "literal", value: false },
          dynamicStageEvidenceAllowedInStaticCapability: {
            kind: "literal",
            value: false,
          },
        },
        crossFieldInvariants: [
          "static_capability_contains_only_provider_support_and_frozen_stage_limits_and_is_sealed_before_the_run_request",
          "mount_device_project_namespace_and_kernel_readbacks_are_forbidden_until_the_stage_root_exists",
        ],
      },
      quotaSetupReceipt: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "runPlanBinding",
          "quotaCapabilityBinding",
          "absoluteDeadlineBinding",
          "setupReceiptSha256Domain",
          "writableMountPath",
          "mountId",
          "deviceId",
          "filesystemType",
          "projectId",
          "rootProjectIdReadback",
          "projectInheritFlagName",
          "rootProjectInheritFlagReadback",
          "kernelReadbackHardByteLimit",
          "kernelReadbackHardInodeLimit",
          "kernelReadbackGraceSeconds",
          "preExecRlimitFsizeSoftReadbackBytes",
          "preExecRlimitFsizeHardReadbackBytes",
          "setupMonotonicNanoseconds",
          "rootIdentityStable",
          "readbacksCompletedImmediatelyBeforeExec",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.quota_setup_receipt/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          quotaCapabilityBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.quotaCapabilityBindingProfile",
          },
          absoluteDeadlineBinding: {
            kind: "binding_profile",
            profile: "absoluteDeadlineReceipt",
          },
          setupReceiptSha256Domain: {
            kind: "literal_domain_by_stage_profile",
          },
          writableMountPath: { kind: "literal_by_stage_quota_policy" },
          mountId: { kind: "primitive", source: "canonicalUnsignedDecimal" },
          deviceId: { kind: "primitive", source: "canonicalUnsignedDecimal" },
          filesystemType: { kind: "primitive", source: "boundedUtf8String" },
          projectId: { kind: "primitive", source: "canonicalUnsignedDecimal" },
          rootProjectIdReadback: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          projectInheritFlagName: {
            kind: "literal",
            value: "FS_XFLAG_PROJINHERIT",
          },
          rootProjectInheritFlagReadback: { kind: "literal", value: true },
          kernelReadbackHardByteLimit: {
            kind: "literal_by_stage_quota_policy",
          },
          kernelReadbackHardInodeLimit: {
            kind: "literal_by_stage_quota_policy",
          },
          kernelReadbackGraceSeconds: { kind: "literal", value: 0 },
          preExecRlimitFsizeSoftReadbackBytes: {
            kind: "literal_by_stage_quota_policy",
          },
          preExecRlimitFsizeHardReadbackBytes: {
            kind: "literal_by_stage_quota_policy",
          },
          setupMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          rootIdentityStable: { kind: "literal", value: true },
          readbacksCompletedImmediatelyBeforeExec: {
            kind: "literal",
            value: true,
          },
        },
        crossFieldInvariants: [
          "receipt_is_created_only_after_the_selected_stage_root_mount_and_namespace_exist_and_immediately_before_that_stage_launch",
          "rootProjectIdReadback_equals_projectId_and_FS_XFLAG_PROJINHERIT_is_active_on_the_exact_writable_root",
          "kernel_hard_byte_inode_and_zero_grace_readbacks_equal_the_bound_static_quota_policy",
          "both_RLIMIT_FSIZE_readbacks_equal_the_bound_stage_limit_before_exec",
          "setupMonotonicNanoseconds_is_strictly_before_the_bound_absolute_deadline",
        ],
      },
      crossStageSeparationReceipt: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "producerSourceLedgerBinding",
          "verifierSourceLedgerBinding",
          "assemblerSourceLedgerBinding",
          "producerToolchainLedgerBinding",
          "verifierToolchainLedgerBinding",
          "assemblerToolchainLedgerBinding",
          "producerOciImageDigest",
          "verifierOciImageDigest",
          "assemblerOciImageDigest",
          "allLedgerBindingsPairwiseDistinctByClass",
          "allOciImageDigestsPairwiseDistinct",
          "sharedRootMountOrInodeAuthorityObserved",
          "crossStageImportsObserved",
          "passed",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.cross_stage_separation_receipt/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          producerSourceLedgerBinding: {
            kind: "binding_profile",
            profile: "producerSourceClosureLedger",
          },
          verifierSourceLedgerBinding: {
            kind: "binding_profile",
            profile: "verifierSourceClosureLedger",
          },
          assemblerSourceLedgerBinding: {
            kind: "binding_profile",
            profile: "assemblerSourceClosureLedger",
          },
          producerToolchainLedgerBinding: {
            kind: "binding_profile",
            profile: "producerToolchainClosureLedger",
          },
          verifierToolchainLedgerBinding: {
            kind: "binding_profile",
            profile: "verifierToolchainClosureLedger",
          },
          assemblerToolchainLedgerBinding: {
            kind: "binding_profile",
            profile: "assemblerToolchainClosureLedger",
          },
          producerOciImageDigest: {
            kind: "primitive",
            source: "ociSha256Digest",
          },
          verifierOciImageDigest: {
            kind: "primitive",
            source: "ociSha256Digest",
          },
          assemblerOciImageDigest: {
            kind: "primitive",
            source: "ociSha256Digest",
          },
          allLedgerBindingsPairwiseDistinctByClass: {
            kind: "literal",
            value: true,
          },
          allOciImageDigestsPairwiseDistinct: { kind: "literal", value: true },
          sharedRootMountOrInodeAuthorityObserved: {
            kind: "literal",
            value: false,
          },
          crossStageImportsObserved: { kind: "literal", value: false },
          passed: { kind: "literal", value: true },
        },
      },
      verifierProofKernel: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "proofReplayProtocolBinding",
          "verifierSourceLedgerBinding",
          "verifierToolchainLedgerBinding",
          "entryPointSourceFileOrdinal",
          "entryPointRelativePath",
          "entryPointSha256",
          "producerSourceImported",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.verifier_proof_kernel/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          proofReplayProtocolBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING",
          },
          verifierSourceLedgerBinding: {
            kind: "binding_profile",
            profile: "verifierSourceClosureLedger",
          },
          verifierToolchainLedgerBinding: {
            kind: "binding_profile",
            profile: "verifierToolchainClosureLedger",
          },
          entryPointSourceFileOrdinal: {
            kind: "primitive",
            source: "safeNonnegativeInteger",
          },
          entryPointRelativePath: {
            kind: "primitive",
            source: "canonicalRelativeLinuxPath",
          },
          entryPointSha256: { kind: "primitive", source: "lowercaseSha256" },
          producerSourceImported: { kind: "literal", value: false },
        },
        crossFieldInvariants: [
          "entry_point_ordinal_path_and_sha256_equal_one_bound_verifier_source_manifest_file_and_secure_ledger_observation",
        ],
      },
      verifierMpfrGmpRuntime: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "verifierToolchainLedgerBinding",
          "mpfrVersion",
          "gmpVersion",
          "roundingModeSupport",
          "libraryFileReferences",
          "producerRuntimeImported",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.verifier_mpfr_gmp_runtime/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          verifierToolchainLedgerBinding: {
            kind: "binding_profile",
            profile: "verifierToolchainClosureLedger",
          },
          mpfrVersion: { kind: "primitive", source: "boundedUtf8String" },
          gmpVersion: { kind: "primitive", source: "boundedUtf8String" },
          roundingModeSupport: {
            kind: "literal_tuple",
            values: ["MPFR_RNDD", "MPFR_RNDN", "MPFR_RNDU", "MPFR_RNDZ"],
            extraEntriesAllowed: false,
          },
          libraryFileReferences: {
            kind: "tuple",
            exactLength: 2,
            exactIdOrder: ["mpfr", "gmp"],
            extraEntriesAllowed: false,
            itemSchema: {
              kind: "object",
              exactKeys: [
                "ordinal",
                "libraryId",
                "toolchainManifestFileOrdinal",
                "relativePath",
                "byteLength",
                "sha256",
              ],
              extraKeysAllowed: false,
              fields: {
                ordinal: {
                  kind: "primitive",
                  source: "safeNonnegativeInteger",
                },
                libraryId: { kind: "literal_by_tuple_index" },
                toolchainManifestFileOrdinal: {
                  kind: "primitive",
                  source: "safeNonnegativeInteger",
                },
                relativePath: {
                  kind: "primitive",
                  source: "canonicalRelativeLinuxPath",
                },
                byteLength: {
                  kind: "primitive",
                  source: "safeNonnegativeInteger",
                },
                sha256: { kind: "primitive", source: "lowercaseSha256" },
              },
            },
          },
          producerRuntimeImported: { kind: "literal", value: false },
        },
        crossFieldInvariants: [
          "both_library_file_references_equal_the_bound_verifier_toolchain_manifest_items_and_secure_ledger_observations",
          "the_two_toolchain_manifest_ordinals_are_unique",
        ],
      },
      controlPlaneBinding: {
        kind: "object",
        exactKeys: [
          "bindingVersion",
          "artifactKind",
          "sha256Domain",
          "sha256",
          "canonicalSizeBytes",
        ],
        extraKeysAllowed: false,
        fields: {
          bindingVersion: {
            kind: "literal",
            value: "nhm2.control_plane.domain_hash_binding/v1",
          },
          artifactKind: { kind: "registered_enum_by_referencing_schema" },
          sha256Domain: { kind: "literal_domain_by_referencing_schema" },
          sha256: { kind: "primitive", source: "lowercaseSha256" },
          canonicalSizeBytes: {
            kind: "primitive",
            source: "safeNonnegativeInteger",
          },
        },
      },
      fileObservation: {
        kind: "object",
        exactKeys: [
          "absolutePath",
          "byteLength",
          "sha256",
          "mountId",
          "deviceId",
          "inode",
          "linkCount",
          "modeFileType",
          "mtimeNanoseconds",
          "ctimeNanoseconds",
          "secureResolutionPassed",
          "statReadStatStable",
        ],
        extraKeysAllowed: false,
        fields: {
          absolutePath: {
            kind: "primitive",
            source: "canonicalAbsoluteLinuxPath",
          },
          byteLength: {
            kind: "primitive",
            source: "safeNonnegativeInteger",
          },
          sha256: { kind: "primitive", source: "lowercaseSha256" },
          mountId: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          deviceId: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          inode: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          linkCount: { kind: "literal", value: 1 },
          modeFileType: { kind: "literal", value: "regular_file" },
          mtimeNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          ctimeNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          secureResolutionPassed: { kind: "literal", value: true },
          statReadStatStable: { kind: "literal", value: true },
        },
      },
      directoryObservation: {
        kind: "object",
        exactKeys: [
          "ordinal",
          "absolutePath",
          "resolvedBeneathParentPath",
          "mountId",
          "deviceId",
          "inode",
          "linkCount",
          "modeFileType",
          "identityStable",
        ],
        extraKeysAllowed: false,
        fields: {
          ordinal: { kind: "primitive", source: "safeNonnegativeInteger" },
          absolutePath: {
            kind: "primitive",
            source: "canonicalAbsoluteLinuxPath",
          },
          resolvedBeneathParentPath: {
            kind: "primitive",
            source: "canonicalAbsoluteLinuxPath",
          },
          mountId: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          deviceId: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          inode: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          linkCount: { kind: "primitive", source: "safePositiveInteger" },
          modeFileType: { kind: "literal", value: "directory" },
          identityStable: { kind: "literal", value: true },
        },
      },
      stageInputLedger: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "runPlanBinding",
          "runRequestBinding",
          "absoluteDeadlineBinding",
          "quotaSetupReceiptBinding",
          "ledgerSha256Domain",
          "requiredFileCount",
          "requiredFilePathOrder",
          "requiredExplicitDirectoryPathOrder",
          "fileObservations",
          "directoryIdentityObservations",
          "priorStageReceiptBindings",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.stage_input_ledger/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          runRequestBinding: {
            kind: "binding_profile",
            profile: "seedRunRequest",
          },
          absoluteDeadlineBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
          quotaSetupReceiptBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.quotaSetupReceiptBindingProfile",
          },
          ledgerSha256Domain: { kind: "literal_domain_by_stage_profile" },
          requiredFileCount: { kind: "literal_by_stage_profile" },
          requiredFilePathOrder: {
            kind: "literal_tuple_by_stage_profile",
            extraEntriesAllowed: false,
          },
          requiredExplicitDirectoryPathOrder: {
            kind: "literal_tuple_by_stage_profile",
            extraEntriesAllowed: false,
          },
          fileObservations: {
            kind: "tuple_by_stage_profile",
            itemSchema: "fileObservation",
            extraEntriesAllowed: false,
          },
          directoryIdentityObservations: {
            kind: "tuple_by_stage_profile",
            itemSchema: "directoryObservation",
            extraEntriesAllowed: false,
          },
          priorStageReceiptBindings: {
            kind: "tuple_by_stage_profile",
            itemSchema: "namedControlPlaneBinding",
            exactNameOrderSource: "stageProfiles.priorStageReceiptNameOrder",
            extraEntriesAllowed: false,
          },
        },
        crossFieldInvariants: [
          "fileObservations.length=requiredFileCount=requiredFilePathOrder.length",
          "the_first_8_fileObservations_are_one_to_one_by_tuple_index_in_path_encoding_raw_canonical_UTF8_sha256_size_and_domain_binding_source_with_NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BASE_INPUT_PROFILE",
          "fileObservations[0]_raw_canonical_UTF8_bytes_recompute_the_exact_runRequestBinding_and_entries_1_through_7_recompute_their_exact_authoritative_imported_or_local_domain_bindings",
          "for_each_i_fileObservations[i].absolutePath=requiredFilePathOrder[i]_and_tuple_index_i_is_the_only_contextual_ledger_ordinal",
          "directoryIdentityObservations.length=requiredExplicitDirectoryPathOrder.length",
          "for_each_i_directoryIdentityObservations[i].ordinal=i_and_absolutePath=requiredExplicitDirectoryPathOrder[i]",
          "all_file_and_directory_paths_are_unique_and_have_no_prefix_alias_collision_outside_declared_parent_child_directories",
          "priorStageReceiptBindings_names_order_and_length_equal_the_exact_stage_profile",
          "for_verifier_fileObservations[8..39]_recursively_equal_the_exact_32_producerClosedOutputObservation.fileObservations_bound_by_the_prior_producer_enforcement_receipt_without_contextual_hash_reinterpretation",
          "for_assembler_fileObservations[8..39]_recursively_equal_the_same_broker_bound_producer_staging_observations_and_fileObservations[40]_recursively_equals_the_exact_broker_bound_replay_bundle_observation",
          "assembler_fileObservations[41]_is_a_fresh_secure_observation_of_the_raw_canonical_verifier_enforcement_receipt_bytes_and_its_byteLength_raw_SHA256_and_recanonicalized_schema_valid_bytes_recompute_the_exact_named_verifierEnforcementReceipt_domain_binding_in_priorStageReceiptBindings_without_any_self_referential_receipt_observation",
          "only_verifier_and_assembler_fileObservations[8..39]_and_assembler_fileObservations[40]_reuse_prior_broker_observations_with_the_same_absolutePath_byteLength_raw_SHA256_mount_device_inode_linkCount_type_times_secureResolution_and_statReadStat_fields_while_the_fresh_assembler_receipt_observation_at_index_41_is_explicitly_excluded",
          "quotaSetupReceiptBinding_is_created_after_the_stage_root_exists_and_before_this_stage_ledger_is_sealed",
        ],
      },
      stageLaunchEnvelope: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "runPlanBinding",
          "runRequestBinding",
          "sourceManifestBinding",
          "sourceLedgerBinding",
          "toolchainManifestBinding",
          "toolchainLedgerBinding",
          "inputLedgerBinding",
          "ociImageDigest",
          "capabilityBinding",
          "sandboxAndSeccompPolicyBinding",
          "schedulerLeaseBinding",
          "quotaCapabilityBinding",
          "quotaSetupReceiptBinding",
          "absoluteDeadlineBinding",
          "directoryPrestateReceiptBindings",
          "executableFileObservation",
          "bootstrapFileObservation",
          "exactInvocationSha256",
          "exactEnvironmentSha256",
          "exactMountPolicySha256",
          "exactResourcePolicySha256",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.stage_launch_envelope/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          runRequestBinding: {
            kind: "binding_profile",
            profile: "seedRunRequest",
          },
          sourceManifestBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.sourceManifestBindingProfile",
          },
          sourceLedgerBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.sourceLedgerBindingProfile",
          },
          toolchainManifestBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.toolchainManifestBindingProfile",
          },
          toolchainLedgerBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.toolchainLedgerBindingProfile",
          },
          inputLedgerBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.inputLedgerBindingProfile",
          },
          ociImageDigest: { kind: "primitive", source: "ociSha256Digest" },
          capabilityBinding: {
            kind: "binding_profile",
            profile: "isolatedWorkerCapability",
          },
          sandboxAndSeccompPolicyBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.seccompPolicyBindingProfile",
          },
          schedulerLeaseBinding: {
            kind: "binding_profile",
            profile: "schedulerLease",
          },
          quotaCapabilityBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.quotaCapabilityBindingProfile",
          },
          quotaSetupReceiptBinding: {
            kind: "binding_profile_by_stage",
            profileSource: "stageProfiles.quotaSetupReceiptBindingProfile",
          },
          absoluteDeadlineBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
          directoryPrestateReceiptBindings: {
            kind: "tuple_by_stage_profile",
            itemSchema: "namedControlPlaneBinding",
            exactNameOrderSource:
              "stageProfiles.launchPrestateReceiptNameOrder",
            extraEntriesAllowed: false,
          },
          executableFileObservation: {
            kind: "schema_reference",
            source: "fileObservation",
          },
          bootstrapFileObservation: {
            kind: "schema_reference",
            source: "fileObservation",
          },
          exactInvocationSha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          exactEnvironmentSha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          exactMountPolicySha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
          exactResourcePolicySha256: {
            kind: "primitive",
            source: "lowercaseSha256",
          },
        },
        crossFieldInvariants: [
          "stageId_selects_exactly_one_stage_profile_and_launch_domain",
          "runRequestBinding_resolves_to_the_exact_request_whose_stage_manifest_ledger_image_capability_seccomp_scheduler_and_quota_bindings_equal_this_envelope",
          "inputLedgerBinding.runRequestBinding_recursively_equals_runRequestBinding",
          "sourceLedgerBinding.manifestBinding_equals_sourceManifestBinding_and_toolchainLedgerBinding.manifestBinding_equals_toolchainManifestBinding",
          "inputLedgerBinding_domain_kind_size_and_digest_bind_the_same_validated_stageInputLedger_instance",
          "quotaCapabilityBinding_is_static_and_quotaSetupReceiptBinding_supplies_the_exact_stage_mount_project_inheritance_kernel_limit_and_RLIMIT_readbacks",
          "quotaSetupReceiptBinding_recursively_equals_the_stageInputLedger.quotaSetupReceiptBinding_and_binds_quotaCapabilityBinding_and_absoluteDeadlineBinding",
          "executableFileObservation_absolutePath_equals_stageProfiles.executableAbsolutePath_and_recursively_equals_the_exact_toolchain_ledger_file_observation",
          "bootstrapFileObservation_absolutePath_equals_stageProfiles.bootstrapAbsolutePath_and_recursively_equals_the_exact_source_ledger_file_observation",
          "directoryPrestateReceiptBindings_exactly_equal_the_stage_required_prestate_receipt_name_order",
          "invocation_environment_mount_and_resource_hashes_are_plain_SHA256_of_the_exact_RFC8785_UTF8_authoritative_run_plan_stage_projections_and_are_only_consistency_checks_not_independent_binding_authority",
        ],
      },
      directoryPrestateReceipt: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "rootKind",
          "rootAbsolutePath",
          "creationTiming",
          "exactDirectoryPathOrder",
          "directoryObservations",
          "rootPreviouslyAbsent",
          "allDirectoriesCreatedByTrustedBroker",
          "noFilesOrOtherEntriesObserved",
          "rootIdentityStable",
          "observationMonotonicNanoseconds",
          "absoluteDeadlineBinding",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.directory_prestate_receipt/v1",
          },
          rootKind: {
            kind: "enum",
            values: ["staging", "replay", "attestation", "final_output"],
          },
          rootAbsolutePath: { kind: "literal_by_root_kind" },
          creationTiming: { kind: "literal_by_root_kind" },
          exactDirectoryPathOrder: {
            kind: "literal_tuple_by_root_kind",
            extraEntriesAllowed: false,
          },
          directoryObservations: {
            kind: "tuple_by_root_kind",
            itemSchema: "directoryObservation",
            extraEntriesAllowed: false,
          },
          rootPreviouslyAbsent: { kind: "literal", value: true },
          allDirectoriesCreatedByTrustedBroker: {
            kind: "literal",
            value: true,
          },
          noFilesOrOtherEntriesObserved: { kind: "literal", value: true },
          rootIdentityStable: { kind: "literal", value: true },
          observationMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          absoluteDeadlineBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
        },
        crossFieldInvariants: [
          "directoryObservations.length=exactDirectoryPathOrder.length",
          "for_each_i_directoryObservations[i].ordinal=i_and_absolutePath=exactDirectoryPathOrder[i]",
          "every_observation_time_is_strictly_before_the_bound_absolute_deadline",
        ],
      },
      directoryPreparationReceiptBundle: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stagingPrestateReceiptBinding",
          "replayPrestateReceiptBinding",
          "attestationPrestateReceiptBinding",
          "finalOutputPrestateReceiptBinding",
          "allFourRootIdentitiesPairwiseDistinct",
          "noAliasCollisionPassed",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.directory_preparation_receipt_bundle/v1",
          },
          stagingPrestateReceiptBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
          replayPrestateReceiptBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
          attestationPrestateReceiptBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
          finalOutputPrestateReceiptBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
          allFourRootIdentitiesPairwiseDistinct: {
            kind: "literal",
            value: true,
          },
          noAliasCollisionPassed: { kind: "literal", value: true },
        },
      },
      closedStageOutputObservation: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "absoluteDeadlineBinding",
          "requiredFileCount",
          "requiredFilePathOrder",
          "requiredDirectoryPathOrder",
          "fileObservations",
          "directoryObservations",
          "aggregateLogicalBytes",
          "closedInventoryPassed",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.closed_stage_output_observation/v1",
          },
          stageId: { kind: "literal_by_stage_profile" },
          absoluteDeadlineBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
          requiredFileCount: {
            kind: "literal_closed_output_count_by_stage_profile",
          },
          requiredFilePathOrder: {
            kind: "literal_closed_output_path_tuple_by_stage_profile",
            extraEntriesAllowed: false,
          },
          requiredDirectoryPathOrder: {
            kind: "literal_closed_output_directory_tuple_by_stage_profile",
            extraEntriesAllowed: false,
          },
          fileObservations: {
            kind: "tuple_by_closed_output_stage_profile",
            itemSchema: "fileObservation",
            extraEntriesAllowed: false,
          },
          directoryObservations: {
            kind: "tuple_by_closed_output_stage_profile",
            itemSchema: "directoryObservation",
            extraEntriesAllowed: false,
          },
          aggregateLogicalBytes: {
            kind: "primitive",
            source: "safeNonnegativeInteger",
          },
          closedInventoryPassed: { kind: "literal", value: true },
        },
        crossFieldInvariants: [
          "file_and_directory_tuple_lengths_and_each_ordinal_path_equal_the_selected_stage_profile_one_to_one",
          "aggregateLogicalBytes_equals_the_exact_sum_of_fileObservations.byteLength",
          "producer_array_observations_follow_the_imported_32_array_hash_recipe_verifier_observation_is_the_bound_bundle_instance_and_assembler_observations_match_the_closed_seed_container",
        ],
      },
      finalDescriptorObservation: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "absoluteDeadlineBinding",
          "clockId",
          "phaseStartMonotonicNanoseconds",
          "phaseEndMonotonicNanoseconds",
          "descriptorAbsolutePath",
          "fileObservation",
          "outputDescriptorSchemaBinding",
          "canonicalByteLength",
          "canonicalSha256",
          "rawBytesEqualRecanonicalizedUtf8",
          "descriptorWasLastFilesystemWrite",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.final_descriptor_observation/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          absoluteDeadlineBinding: {
            kind: "binding_profile",
            profile: "absoluteDeadlineReceipt",
          },
          clockId: { kind: "literal", value: "CLOCK_MONOTONIC_RAW" },
          phaseStartMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          phaseEndMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          descriptorAbsolutePath: {
            kind: "literal",
            value: "/run/output/seed-descriptor.canonical.json",
          },
          fileObservation: {
            kind: "schema_reference",
            source: "fileObservation",
          },
          outputDescriptorSchemaBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING",
          },
          canonicalByteLength: {
            kind: "bounded_count",
            minimum: 1,
            maximum: DESCRIPTOR_MAXIMUM_UTF8_BYTES,
          },
          canonicalSha256: { kind: "primitive", source: "lowercaseSha256" },
          rawBytesEqualRecanonicalizedUtf8: { kind: "literal", value: true },
          descriptorWasLastFilesystemWrite: { kind: "literal", value: true },
        },
        crossFieldInvariants: [
          "fileObservation_path_byteLength_and_sha256_equal_descriptorAbsolutePath_canonicalByteLength_and_canonicalSha256",
          "canonicalSha256_is_plain_SHA256_of_the_exact_schema_validated_recanonicalized_descriptor_UTF8_bytes",
          "phaseStart_is_not_after_phaseEnd_and_phaseEnd_is_strictly_before_the_bound_absolute_deadline",
        ],
      },
      finalContainerObservation: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "absoluteDeadlineBinding",
          "clockId",
          "phaseStartMonotonicNanoseconds",
          "phaseEndMonotonicNanoseconds",
          "assemblerClosedOutputObservationBinding",
          "finalDescriptorObservationBinding",
          "requiredFileCount",
          "requiredFilePathOrder",
          "requiredDirectoryPathOrder",
          "fileObservations",
          "directoryObservations",
          "descriptorObservationOrdinal",
          "descriptorWasLastFilesystemWrite",
          "closedInventoryPassed",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.final_container_observation/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          absoluteDeadlineBinding: {
            kind: "binding_profile",
            profile: "absoluteDeadlineReceipt",
          },
          clockId: { kind: "literal", value: "CLOCK_MONOTONIC_RAW" },
          phaseStartMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          phaseEndMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          assemblerClosedOutputObservationBinding: {
            kind: "binding_profile",
            profile: "assemblerClosedOutputObservation",
          },
          finalDescriptorObservationBinding: {
            kind: "binding_profile",
            profile: "finalDescriptorObservation",
          },
          requiredFileCount: { kind: "literal", value: 33 },
          requiredFilePathOrder: {
            kind: "authoritative_literal_tuple",
            source: "FINAL_OUTPUT_FILE_PATH_ORDER",
            extraEntriesAllowed: false,
          },
          requiredDirectoryPathOrder: {
            kind: "authoritative_literal_tuple",
            source: "FINAL_OUTPUT_DIRECTORY_CREATION_PATH_ORDER_without_root",
            extraEntriesAllowed: false,
          },
          fileObservations: {
            kind: "tuple",
            exactLength: 33,
            itemSchema: "fileObservation",
            extraEntriesAllowed: false,
          },
          directoryObservations: {
            kind: "tuple_exact_length_from_final_directory_profile",
            itemSchema: "directoryObservation",
            extraEntriesAllowed: false,
          },
          descriptorObservationOrdinal: { kind: "literal", value: 32 },
          descriptorWasLastFilesystemWrite: { kind: "literal", value: true },
          closedInventoryPassed: { kind: "literal", value: true },
        },
        crossFieldInvariants: [
          "the_full_file_and_directory_observation_tuples_recursively_equal_the_bound_assemblerClosedOutputObservation",
          "finalDescriptorObservationBinding_recomputes_from_fileObservations[32]_and_the_exact_canonical_descriptor_bytes",
          "all_32_array_observations_match_the_assembler_observation_and_descriptor_is_the_unique_last_write_commit_marker",
          "phaseStart_is_not_after_phaseEnd_and_phaseEnd_is_strictly_before_the_bound_absolute_deadline",
        ],
      },
      observationCaptureReceipt: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "absoluteDeadlineBinding",
          "stdoutBytes",
          "stderrBytes",
          "combinedBytes",
          "maximumStdoutBytes",
          "maximumStderrBytes",
          "maximumCombinedBytes",
          "overflowObserved",
          "truncationObserved",
        ],
        extraKeysAllowed: false,
        fieldTypes: {
          schemaVersion:
            "literal_nhm2.prolate_boson_star.newtonian_seed.observation_capture_receipt/v1",
          stageId: "literal_by_stage_profile",
          absoluteDeadlineBinding: "controlPlaneBinding",
          stdoutBytes: "safeNonnegativeInteger",
          stderrBytes: "safeNonnegativeInteger",
          combinedBytes: "safeNonnegativeInteger_equal_sum",
          maximumStdoutBytes: "literal_run_plan_limit",
          maximumStderrBytes: "literal_run_plan_limit",
          maximumCombinedBytes: "literal_run_plan_limit",
          overflowObserved: "literal_false_for_admission",
          truncationObserved: "literal_false_for_admission",
        },
      },
      absoluteDeadlineReceipt: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "runRequestBinding",
          "clockId",
          "runStartMonotonicNanoseconds",
          "absoluteDeadlineMonotonicNanoseconds",
          "maximumWallNanoseconds",
          "schedulerLeaseBinding",
          "issuedBeforeAnyRootPreparation",
        ],
        extraKeysAllowed: false,
        fieldTypes: {
          schemaVersion:
            "literal_nhm2.prolate_boson_star.newtonian_seed.absolute_deadline_receipt/v1",
          runPlanBinding: "authoritative_run_plan_binding",
          runRequestBinding: "controlPlaneBinding",
          clockId: "literal_CLOCK_MONOTONIC_RAW",
          runStartMonotonicNanoseconds: "canonicalUnsignedDecimal",
          absoluteDeadlineMonotonicNanoseconds: "canonicalUnsignedDecimal",
          maximumWallNanoseconds: "literal_1800000000000",
          schedulerLeaseBinding: "controlPlaneBinding",
          issuedBeforeAnyRootPreparation: "literal_true",
        },
        crossFieldInvariants: [
          "absoluteDeadlineMonotonicNanoseconds=runStartMonotonicNanoseconds+1800000000000_exact_integer_nanoseconds",
          "schedulerLeaseBinding_recursively_equals_the_schedulerLeaseBinding_in_runRequestBinding",
        ],
      },
      stageEnforcementReceipt: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "stageId",
          "runPlanBinding",
          "runRequestBinding",
          "launchEnvelopeBinding",
          "sourceManifestBinding",
          "sourceLedgerBinding",
          "toolchainManifestBinding",
          "toolchainLedgerBinding",
          "inputLedgerBinding",
          "ociImageDigest",
          "capabilityBinding",
          "sandboxAndSeccompPolicyBinding",
          "seccompLoadReceiptBinding",
          "schedulerLeaseBinding",
          "quotaCapabilityBinding",
          "quotaSetupReceiptBinding",
          "absoluteDeadlineBinding",
          "clockId",
          "monotonicStartNanoseconds",
          "secureInputRereadStartMonotonicNanoseconds",
          "secureInputRereadEndMonotonicNanoseconds",
          "stageWorkStartMonotonicNanoseconds",
          "stageWorkEndMonotonicNanoseconds",
          "outputCloseAndFsyncStartMonotonicNanoseconds",
          "outputCloseAndFsyncEndMonotonicNanoseconds",
          "monotonicEndNanoseconds",
          "postExitReceiptAssemblyStartMonotonicNanoseconds",
          "memoryPeakBytes",
          "memoryMaxBytes",
          "memoryOomEvents",
          "memoryOomKillEvents",
          "pidsPeak",
          "pidsMaxEvents",
          "seccompViolationCount",
          "toolchainParentExactFirstLevelInventoryObserved",
          "stdoutBytes",
          "stderrBytes",
          "mountIdentityStableThroughStage",
          "projectInheritanceStableThroughStage",
          "descendantOutputFileCount",
          "allDescendantOutputsCarrySetupDeviceAndProjectId",
          "writableMountPeakBytes",
          "writableMountPeakInodes",
          "writableMountQuotaExceeded",
          "rlimitFsizeBytes",
          "rlimitFsizeExceeded",
          "exitCode",
          "timedOut",
          "killed",
          "cgroupPopulatedZero",
          "closedStageOutputObservationBinding",
          "observationCaptureReceiptBinding",
        ],
        extraKeysAllowed: false,
        fieldTypes: {
          schemaVersion:
            "literal_nhm2.prolate_boson_star.newtonian_seed.stage_enforcement_receipt/v1",
          stageId: "literal_by_stage_profile",
          runPlanBinding: "authoritative_run_plan_binding",
          runRequestBinding: "controlPlaneBinding",
          launchEnvelopeBinding: "controlPlaneBinding",
          sourceManifestBinding: "controlPlaneBinding",
          sourceLedgerBinding: "controlPlaneBinding",
          toolchainManifestBinding: "controlPlaneBinding",
          toolchainLedgerBinding: "controlPlaneBinding",
          inputLedgerBinding: "controlPlaneBinding",
          ociImageDigest: "ociSha256Digest",
          capabilityBinding: "controlPlaneBinding",
          sandboxAndSeccompPolicyBinding: "controlPlaneBinding",
          seccompLoadReceiptBinding: "controlPlaneBinding",
          schedulerLeaseBinding: "controlPlaneBinding",
          quotaCapabilityBinding: "controlPlaneBinding",
          quotaSetupReceiptBinding: "controlPlaneBinding",
          absoluteDeadlineBinding: "controlPlaneBinding",
          clockId: "literal_CLOCK_MONOTONIC_RAW",
          monotonicStartNanoseconds: "canonicalUnsignedDecimal",
          secureInputRereadStartMonotonicNanoseconds:
            "canonicalUnsignedDecimal",
          secureInputRereadEndMonotonicNanoseconds: "canonicalUnsignedDecimal",
          stageWorkStartMonotonicNanoseconds: "canonicalUnsignedDecimal",
          stageWorkEndMonotonicNanoseconds: "canonicalUnsignedDecimal",
          outputCloseAndFsyncStartMonotonicNanoseconds:
            "canonicalUnsignedDecimal",
          outputCloseAndFsyncEndMonotonicNanoseconds:
            "canonicalUnsignedDecimal",
          monotonicEndNanoseconds: "canonicalUnsignedDecimal",
          postExitReceiptAssemblyStartMonotonicNanoseconds:
            "canonicalUnsignedDecimal",
          memoryPeakBytes: "safeNonnegativeInteger",
          memoryMaxBytes: "literal_805306368",
          memoryOomEvents: "safeNonnegativeInteger",
          memoryOomKillEvents: "safeNonnegativeInteger",
          pidsPeak: "safeNonnegativeInteger_at_most_1",
          pidsMaxEvents: "safeNonnegativeInteger",
          seccompViolationCount: "safeNonnegativeInteger",
          toolchainParentExactFirstLevelInventoryObserved:
            "literal_true_for_admission",
          stdoutBytes: "safeNonnegativeInteger_within_stage_cap",
          stderrBytes: "safeNonnegativeInteger_within_stage_cap",
          mountIdentityStableThroughStage: "literal_true_for_admission",
          projectInheritanceStableThroughStage: "literal_true_for_admission",
          descendantOutputFileCount:
            "literal_closed_output_count_by_stage_profile",
          allDescendantOutputsCarrySetupDeviceAndProjectId:
            "literal_true_for_admission",
          writableMountPeakBytes: "safeNonnegativeInteger_within_stage_quota",
          writableMountPeakInodes: "safeNonnegativeInteger_within_stage_quota",
          writableMountQuotaExceeded: "literal_false_for_admission",
          rlimitFsizeBytes: "literal_by_stage_quota_policy",
          rlimitFsizeExceeded: "literal_false_for_admission",
          exitCode: "nullableSafeInteger",
          timedOut: "exactBoolean",
          killed: "exactBoolean",
          cgroupPopulatedZero: "literal_true",
          closedStageOutputObservationBinding: "controlPlaneBinding",
          observationCaptureReceiptBinding: "controlPlaneBinding",
        },
        crossFieldInvariants: [
          "runRequest_source_manifest_source_ledger_toolchain_manifest_toolchain_ledger_input_image_capability_seccomp_scheduler_quota_deadline_and_launch_bindings_recursively_equal_the_launch_envelope",
          "seccompLoadReceiptBinding_binds_the_exact_static_policy_domain_separated_compiler_invocation_compiled_BPF_domain_separated_runtime_load_attestation_OCI_image_loaded_filter_capability_and_pre_scientific_work_kernel_readbacks",
          "the_stage_/opt/nhm2_parent_contains_exactly_source_and_toolchain_directories_with_no_extra_entries_and_both_roots_equal_the_bound_ledger_roots",
          "quotaSetupReceiptBinding_recursively_equals_the_launch_envelope_and_input_ledger_binding_and_supplies_the_exact_mount_device_project_FS_XFLAG_PROJINHERIT_kernel_limit_and_RLIMIT_readbacks",
          "the_quota_setup_timestamp_is_not_after_monotonicStartNanoseconds_and_mount_and_project_inheritance_remain_stable_through_stage_exit",
          "every_descendant_output_file_and_directory_is_securely_observed_on_the_setup_device_with_the_setup_projectId_and_no_alias_before_cgroup_empty_admission",
          "all_phase_fields_use_exact_CLOCK_MONOTONIC_RAW_and_monotonicStart_is_not_after_secureInputRereadStart_is_not_after_secureInputRereadEnd_is_not_after_stageWorkStart_is_not_after_stageWorkEnd_is_not_after_outputCloseAndFsyncStart_is_not_after_outputCloseAndFsyncEnd_is_not_after_monotonicEnd_is_not_after_postExitReceiptAssemblyStart_and_every_phase_is_strictly_before_the_bound_absolute_deadline",
          "for_the_verifier_secureInputRereadStart_through_End_is_the_exact_secure_reread_and_rehash_of_the_bound_base_inputs_and_32_staging_arrays_stageWorkStart_through_End_is_the_producer_independent_gate_and_three_proof_receipt_recomputation_and_outputCloseAndFsyncStart_through_End_is_the_exclusive_canonical_replay_bundle_write_fsync_and_close_bound_by_closedStageOutputObservationBinding",
          "monotonicEndNanoseconds_is_the_trusted_broker_time_at_which_stage_exit_and_cgroupPopulatedZero_have_both_been_observed_and_for_the_verifier_it_is_not_before_outputCloseAndFsyncEndMonotonicNanoseconds",
          "postExitReceiptAssemblyStartMonotonicNanoseconds_is_after_stage_exit_and_cgroup_empty_and_before_the_trusted_broker_canonical_receipt_write_while_the_receipt_never_embeds_or_predicts_its_own_binding_or_later_fresh_file_observation",
          "admission_requires_no_oom_no_oom_kill_no_quota_or_fsize_overflow_no_capture_overflow_and_cgroupPopulatedZero",
          "admission_requires_exitCode=0_timedOut=false_killed=false_and_monotonicEndNanoseconds_strictly_before_the_absolute_deadline",
          "verifier_closedStageOutputObservationBinding_binds_the_exact_already_closed_replay_bundle_SHA256_and_size_before_this_post_exit_receipt_is_written",
        ],
      },
      finalProjectionEqualityReceipt: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "absoluteDeadlineBinding",
          "replayBundleBinding",
          "finalDescriptorBinding",
          "finalContainerObservationBinding",
          "clockId",
          "phaseStartMonotonicNanoseconds",
          "phaseEndMonotonicNanoseconds",
          "fieldComparisons",
          "finalArrayBytesMatchObservedInventory",
          "allPassed",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: {
            kind: "literal",
            value:
              "nhm2.prolate_boson_star.newtonian_seed.final_projection_equality_receipt/v1",
          },
          runPlanBinding: {
            kind: "authoritative_literal_binding",
            source:
              "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
          },
          absoluteDeadlineBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
          replayBundleBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
          },
          finalDescriptorBinding: {
            kind: "schema_reference",
            source: "controlPlaneBinding",
            requiredArtifactKind:
              "nhm2.prolate_boson_star_newtonian_seed.final_descriptor_observation",
            requiredSha256DomainSource: "domains.finalDescriptorObservation",
          },
          finalContainerObservationBinding: {
            kind: "binding_profile",
            profile: "finalContainerObservation",
          },
          clockId: { kind: "literal", value: "CLOCK_MONOTONIC_RAW" },
          phaseStartMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          phaseEndMonotonicNanoseconds: {
            kind: "primitive",
            source: "canonicalUnsignedDecimal",
          },
          fieldComparisons: {
            kind: "tuple",
            exactLength: 6,
            extraEntriesAllowed: false,
            exactPointerOrder: [
              ["/serverRecomputedScalarMetadata", "/scalarMetadata"],
              ["/serverRecomputedGateReport", "/serverRecomputedGateReport"],
              [
                "/continuousNodelessProofReceipt",
                "/continuousNodelessProofReceipt",
              ],
              ["/continuousPeakProofReceipt", "/continuousPeakProofReceipt"],
              [
                "/numericalOriginSeriesDefectReceipt",
                "/numericalOriginSeriesDefectReceipt",
              ],
              ["/observedArrayInventory", "/arrayInventory"],
            ],
            itemSchema: {
              kind: "object",
              exactKeys: [
                "ordinal",
                "sourceJsonPointer",
                "targetJsonPointer",
                "sourceCanonicalUtf8Sha256",
                "targetCanonicalUtf8Sha256",
                "canonicalBytesEqual",
                "recursiveValuesEqual",
              ],
              extraKeysAllowed: false,
              fieldTypes: {
                ordinal: "safeNonnegativeInteger_equal_tuple_index",
                sourceJsonPointer: "literal_by_tuple_index",
                targetJsonPointer: "literal_by_tuple_index",
                sourceCanonicalUtf8Sha256: "lowercaseSha256",
                targetCanonicalUtf8Sha256: "lowercaseSha256",
                canonicalBytesEqual: "literal_true",
                recursiveValuesEqual: "literal_true",
              },
            },
          },
          finalArrayBytesMatchObservedInventory: {
            kind: "literal",
            value: true,
          },
          allPassed: { kind: "literal", value: true },
        },
        crossFieldInvariants: [
          "for_each_comparison_source_and_target_values_are_extracted_from_the_exact_broker_bound_bundle_and_securely_reread_final_descriptor_then_recanonicalized_independently",
          "each_source_and_target_canonical_UTF8_byte_string_is_byte_equal_and_its_SHA256_fields_recompute",
          "observedArrayInventory_equals_arrayInventory_entry_for_entry_in_all_12_fields_and_each_final_raw_array_recomputes_to_that_same_hash_and_size",
          "finalDescriptorBinding_and_finalContainerObservationBinding_recursively_equal_the_exact_prior_phase_receipts_used_for_every_comparison",
          "phaseStart_is_not_after_phaseEnd_and_phaseEnd_is_strictly_before_the_bound_absolute_deadline",
        ],
      },
      finalAdmissionReceipt: {
        kind: "object",
        exactKeys: [
          "schemaVersion",
          "runPlanBinding",
          "absoluteDeadlineBinding",
          "directoryPreparationReceiptBundleBinding",
          "producerEnforcementReceiptBinding",
          "verifierEnforcementReceiptBinding",
          "assemblerEnforcementReceiptBinding",
          "replayBundleBinding",
          "finalContainerObservationBinding",
          "finalProjectionEqualityReceiptBinding",
          "outputDescriptorSchemaBinding",
          "proofReplayProtocolBinding",
          "clockId",
          "admissionMonotonicNanoseconds",
          "quotaDeviceProjectPairsDistinct",
          "accepted",
        ],
        extraKeysAllowed: false,
        fieldTypes: {
          schemaVersion:
            "literal_nhm2.prolate_boson_star.newtonian_seed.final_admission_receipt/v1",
          runPlanBinding: "authoritative_run_plan_binding",
          absoluteDeadlineBinding: "controlPlaneBinding",
          directoryPreparationReceiptBundleBinding: "controlPlaneBinding",
          producerEnforcementReceiptBinding: "controlPlaneBinding",
          verifierEnforcementReceiptBinding: "controlPlaneBinding",
          assemblerEnforcementReceiptBinding: "controlPlaneBinding",
          replayBundleBinding: "controlPlaneBinding",
          finalContainerObservationBinding: "controlPlaneBinding",
          finalProjectionEqualityReceiptBinding: "controlPlaneBinding",
          outputDescriptorSchemaBinding:
            "authoritative_imported_descriptor_schema_binding",
          proofReplayProtocolBinding:
            "authoritative_imported_proof_protocol_binding",
          clockId: "literal_CLOCK_MONOTONIC_RAW",
          admissionMonotonicNanoseconds: "canonicalUnsignedDecimal",
          quotaDeviceProjectPairsDistinct: "literal_true",
          accepted: "literal_true_only_after_every_bound_receipt_passes",
        },
        crossFieldInvariants: [
          "all_bindings_resolve_to_the_same_run_plan_stage_chain_bundle_arrays_descriptor_policies_lease_and_absolute_deadline",
          "finalContainerObservationBinding_resolves_to_the_exact_secure_final_container_observation_used_by_finalProjectionEqualityReceiptBinding",
          "admissionMonotonicNanoseconds_is_strictly_before_the_absolute_deadline",
          "descriptor_phaseEnd_is_not_after_container_phaseStart_container_phaseEnd_is_not_after_projection_phaseStart_projection_phaseEnd_is_not_after_admission_and_all_use_CLOCK_MONOTONIC_RAW",
          "the_bound_assemblerEnforcementReceipt.monotonicEndNanoseconds_is_not_after_the_finalDescriptorObservation.phaseStartMonotonicNanoseconds_resolved_through_the_bound_finalProjectionEqualityReceipt_and_all_use_CLOCK_MONOTONIC_RAW",
          "the_three_bound_quotaSetupReceipt_deviceId_projectId_pairs_are_pairwise_distinct_and_every_enforcement_receipt_proves_descendant_project_inheritance",
          "no_stage_or_broker_claim_grants_authority_without_this_closed_final_receipt",
        ],
      },
    },
    verifierReplayBundleInstanceHashGrammar: {
      bindingProfile: "verifierReplayBundleInstance",
      schemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING,
      sha256Domain:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-replay-bundle/v1\n",
      preimage:
        "utf8(sha256Domain)+exact_schema_validated_recanonicalized_bundle_UTF8_bytes",
      bindingSchema: "controlPlaneBinding",
      artifactKind:
        "nhm2.prolate_boson_star_newtonian_seed.verifier_replay_bundle",
      maximumCanonicalUtf8Bytes: VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES,
    },
  } as const;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-control-plane-evidence-grammar-registry/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_JSON =
  canonicalJsonForSubBinding(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY.artifactId,
    registryVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY.registryVersion,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_SIZE_BYTES,
  });
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_EXPECTED_SHA256 =
  "b048a86ef1932cc06bd2d1c829011aa1df8341621ded24e4be13c8fdc4c54c9e" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES =
  120618 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_run_plan_v1_control_plane_evidence_grammar_registry_binding_drift",
  );
}

const rawCanonicalUtf8Sha256 = (canonicalJson: string): string =>
  createHash("sha256").update(canonicalJson, "utf8").digest("hex");

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BASE_INPUT_PROFILE =
  Object.freeze([
    Object.freeze({
      ordinal: 0,
      id: INPUT_CLOSURE_DUTIES[0].id,
      absolutePath: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER[0],
      encoding: "RFC8785_JSON_Canonicalization_Scheme_UTF8",
      authoritativeBindingSource: "schemas.seedRunRequest",
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.seedRunRequest,
      domainSeparatedBindingRecipe:
        "domains.seedRunRequest+exact_schema_validated_canonical_json_utf8",
      binding: null,
      rawCanonicalUtf8Sha256: null,
      canonicalSizeBytes: null,
      resolvedFromStageInputLedgerRunRequestBindingBeforeStageLaunch: true,
    }),
    Object.freeze({
      ordinal: 1,
      id: INPUT_CLOSURE_DUTIES[1].id,
      absolutePath: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER[1],
      encoding: "canonical_json_utf8",
      authoritativeBindingSource:
        "NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING",
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING.sha256Domain,
      domainSeparatedBindingRecipe:
        "candidate_binding.sha256Domain+candidate_canonical_json_utf8",
      binding: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
      rawCanonicalUtf8Sha256: rawCanonicalUtf8Sha256(
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON,
      ),
      canonicalSizeBytes: Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON,
        "utf8",
      ),
      resolvedFromStageInputLedgerRunRequestBindingBeforeStageLaunch: false,
    }),
    Object.freeze({
      ordinal: 2,
      id: INPUT_CLOSURE_DUTIES[2].id,
      absolutePath: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER[2],
      encoding: "canonical_json_utf8",
      authoritativeBindingSource:
        "NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING",
      sha256Domain: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING.sha256Domain,
      domainSeparatedBindingRecipe:
        "bvp_binding.sha256Domain+bvp_canonical_json_utf8",
      binding: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
      rawCanonicalUtf8Sha256: rawCanonicalUtf8Sha256(
        NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON,
      ),
      canonicalSizeBytes: Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_JSON,
        "utf8",
      ),
      resolvedFromStageInputLedgerRunRequestBindingBeforeStageLaunch: false,
    }),
    Object.freeze({
      ordinal: 3,
      id: INPUT_CLOSURE_DUTIES[3].id,
      absolutePath: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER[3],
      encoding: "canonical_json_utf8",
      authoritativeBindingSource:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING",
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.sha256Domain,
      domainSeparatedBindingRecipe:
        "seed_binding.sha256Domain+seed_canonical_json_utf8",
      binding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
      rawCanonicalUtf8Sha256: rawCanonicalUtf8Sha256(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
      ),
      canonicalSizeBytes: Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
        "utf8",
      ),
      resolvedFromStageInputLedgerRunRequestBindingBeforeStageLaunch: false,
    }),
    Object.freeze({
      ordinal: 4,
      id: INPUT_CLOSURE_DUTIES[4].id,
      absolutePath: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER[4],
      encoding: "canonical_json_utf8",
      authoritativeBindingSource:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING",
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING.sha256Domain,
      domainSeparatedBindingRecipe:
        "proof_protocol_binding.sha256Domain+proof_protocol_canonical_json_utf8",
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
      rawCanonicalUtf8Sha256: rawCanonicalUtf8Sha256(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_CANONICAL_JSON,
      ),
      canonicalSizeBytes: Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_CANONICAL_JSON,
        "utf8",
      ),
      resolvedFromStageInputLedgerRunRequestBindingBeforeStageLaunch: false,
    }),
    Object.freeze({
      ordinal: 5,
      id: INPUT_CLOSURE_DUTIES[5].id,
      absolutePath: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER[5],
      encoding: "canonical_json_utf8",
      authoritativeBindingSource:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING",
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING.sha256Domain,
      domainSeparatedBindingRecipe:
        "descriptor_schema_binding.sha256Domain+descriptor_schema_canonical_json_utf8",
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
      rawCanonicalUtf8Sha256: rawCanonicalUtf8Sha256(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_CANONICAL_JSON,
      ),
      canonicalSizeBytes: Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_CANONICAL_JSON,
        "utf8",
      ),
      resolvedFromStageInputLedgerRunRequestBindingBeforeStageLaunch: false,
    }),
    Object.freeze({
      ordinal: 6,
      id: INPUT_CLOSURE_DUTIES[6].id,
      absolutePath: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER[6],
      encoding: "canonical_json_utf8",
      authoritativeBindingSource:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING",
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING.sha256Domain,
      domainSeparatedBindingRecipe:
        "replay_schema_binding.sha256Domain+replay_schema_canonical_json_utf8",
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING,
      rawCanonicalUtf8Sha256: rawCanonicalUtf8Sha256(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_JSON,
      ),
      canonicalSizeBytes:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_CANONICAL_SIZE_BYTES,
      resolvedFromStageInputLedgerRunRequestBindingBeforeStageLaunch: false,
    }),
    Object.freeze({
      ordinal: 7,
      id: INPUT_CLOSURE_DUTIES[7].id,
      absolutePath: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER[7],
      encoding: "canonical_json_utf8",
      authoritativeBindingSource:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING",
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING.sha256Domain,
      domainSeparatedBindingRecipe:
        "evidence_registry_binding.sha256Domain+evidence_registry_canonical_json_utf8",
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
      rawCanonicalUtf8Sha256: rawCanonicalUtf8Sha256(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_JSON,
      ),
      canonicalSizeBytes:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_CANONICAL_SIZE_BYTES,
      resolvedFromStageInputLedgerRunRequestBindingBeforeStageLaunch: false,
    }),
  ] as const);

const EXECUTION_STAGES = Object.freeze([
  "untrusted_seed_producer",
  "trusted_independent_verifier",
  "trusted_descriptor_assembler",
] as const);

const PRODUCER_TOOLCHAIN_CLOSURE_DUTIES = Object.freeze([
  {
    index: 0,
    id: "oci_image_manifest_config_and_layers",
    duty: "exact_registry_digest_layer_sha256_byte_lengths_and_media_types",
  },
  {
    index: 1,
    id: "base_os_and_dynamic_loader_closure",
    duty: "exact_os_arch_libc_loader_shared_library_and_certificate_inventory",
  },
  {
    index: 2,
    id: "cpython_runtime_closure",
    duty: "exact_interpreter_version_build_flags_executable_stdlib_extensions_and_hashes",
  },
  {
    index: 3,
    id: "numpy_runtime_closure",
    duty: "exact_numpy_version_wheel_tag_file_inventory_and_hashes",
  },
  {
    index: 4,
    id: "scipy_runtime_closure",
    duty: "exact_scipy_version_wheel_tag_file_inventory_and_hashes",
  },
  {
    index: 5,
    id: "blas_lapack_runtime_closure",
    duty: "exact_vendor_version_build_cpu_dispatch_shared_libraries_and_single_thread_configuration",
  },
  {
    index: 6,
    id: "producer_bootstrap_and_import_policy",
    duty: "exact_source_hash_fixed_sys_path_no_user_site_no_ambient_import_and_no_shell",
  },
  {
    index: 7,
    id: "seed_solver_and_discretization_source",
    duty: "complete_hash_bound_source_build_recipe_and_implementation_data",
  },
  {
    index: 8,
    id: "staging_array_serializer",
    duty: "exact_little_endian_float64_writer_source_with_no_descriptor_or_receipt_writer",
  },
  {
    index: 9,
    id: "producer_runtime_sbom_and_dependency_lock",
    duty: "exact_transitive_files_versions_hashes_licenses_and_build_recipe",
  },
  {
    index: 10,
    id: "producer_seccomp_profile",
    duty: "hash_bound_allowlist_with_explicit_socket_syscall_denials",
  },
] as const);

const VERIFIER_TOOLCHAIN_CLOSURE_DUTIES = Object.freeze([
  {
    index: 0,
    id: "verifier_oci_image_manifest_config_and_layers",
    duty: "exact_registry_digest_layer_sha256_byte_lengths_and_media_types",
  },
  {
    index: 1,
    id: "verifier_base_os_and_dynamic_loader_closure",
    duty: "exact_os_arch_libc_loader_and_shared_library_inventory",
  },
  {
    index: 2,
    id: "verifier_runtime_and_numerics_closure",
    duty: "exact_independent_runtime_numpy_scipy_blas_versions_files_hashes_and_build_recipe",
  },
  {
    index: 3,
    id: "secure_staging_array_reader_and_rehasher",
    duty: "exact_openat2_no_follow_fixed_inventory_reader_recomputes_size_hash_shape_dtype_and_order",
  },
  {
    index: 4,
    id: "independent_seed_gate_replayer",
    duty: "recompute_every_seed_gate_from_securely_reread_arrays_without_producer_code_or_diagnostics",
  },
  {
    index: 5,
    id: "mpfr_gmp_continuous_proof_kernel",
    duty: "exact_directed_rounding_library_kernel_source_build_and_nodeless_peak_origin_series_receipts",
  },
  {
    index: 6,
    id: "sealed_replay_bundle_serializer",
    duty: "write_only_the_hash_bound_gate_report_and_three_receipts_never_the_seed_descriptor",
  },
  {
    index: 7,
    id: "verifier_runtime_sbom_and_dependency_lock",
    duty: "exact_transitive_files_versions_hashes_licenses_and_build_recipe",
  },
  {
    index: 8,
    id: "verifier_seccomp_profile",
    duty: "hash_bound_allowlist_with_explicit_socket_syscall_denials",
  },
] as const);

const ASSEMBLER_TOOLCHAIN_CLOSURE_DUTIES = Object.freeze([
  {
    index: 0,
    id: "assembler_oci_image_manifest_config_and_layers",
    duty: "exact_registry_digest_layer_sha256_byte_lengths_and_media_types",
  },
  {
    index: 1,
    id: "assembler_base_os_and_dynamic_loader_closure",
    duty: "exact_os_arch_libc_loader_and_shared_library_inventory",
  },
  {
    index: 2,
    id: "assembler_minimal_runtime_closure",
    duty: "exact_runtime_files_hashes_build_recipe_and_fixed_import_or_linker search path",
  },
  {
    index: 3,
    id: "verified_array_exclusive_copier",
    duty: "copy_only_verifier_admitted_array_bytes_into_a_fresh_final_root_and_recheck_hashes",
  },
  {
    index: 4,
    id: "descriptor_schema_validator",
    duty: "validate_the_exact_imported_closed_descriptor_schema_and_three_receipt_fields",
  },
  {
    index: 5,
    id: "canonical_descriptor_last_writer",
    duty: "exact_RFC8785_UTF8_serializer_exclusive_writer_fsync_and_raw_byte_recanonicalization_check",
  },
  {
    index: 6,
    id: "assembler_runtime_sbom_and_dependency_lock",
    duty: "exact_transitive_files_versions_hashes_licenses_and_build_recipe",
  },
  {
    index: 7,
    id: "assembler_seccomp_profile",
    duty: "hash_bound_allowlist_with_explicit_socket_syscall_denials",
  },
] as const);

const EXECUTION_LOCKS = Object.freeze({
  capabilityPresent: false,
  capabilityAttested: false,
  inputClosureSealed: false,
  producerSourceToolchainAndImageClosureSealed: false,
  verifierSourceToolchainAndImageClosureSealed: false,
  assemblerSourceToolchainAndImageClosureSealed: false,
  producerInputLedgerAndLaunchEnvelopeSealed: false,
  verifierInputLedgerAndLaunchEnvelopeSealedAfterProducerObservation: false,
  assemblerInputLedgerAndLaunchEnvelopeSealedAfterVerifierReceipt: false,
  pairwiseStageCodeAndRuntimeSeparationAttested: false,
  producerOciImageDigestBound: false,
  verifierOciImageDigestBound: false,
  assemblerOciImageDigestBound: false,
  seccompPolicyBound: false,
  runtimeSeccompLoadedFilterReceiptsPassed: false,
  schedulerReserveLeaseHeld: false,
  absoluteMonotonicDeadlineEstablished: false,
  kernelWritableMountQuotasAndRlimitFsizeEstablished: false,
  allStageQuotaSetupReceiptsPassed: false,
  executionAuthorized: false,
  producerStarted: false,
  producerCgroupEmptyObserved: false,
  verifierStarted: false,
  verifierCgroupEmptyObserved: false,
  assemblerStarted: false,
  cgroupResourceEnforcementObserved: false,
  assemblerCgroupEmptyObserved: false,
  networkAndSocketDenialObserved: false,
  boundedStdoutAndStderrEnforcementObservedForAllStages: false,
  allStageQuotaAndRlimitReceiptsPassed: false,
  runCompleted: false,
});

const ARTIFACT_LOCKS = Object.freeze({
  trustedBrokerDirectoryPrestateReceiptsPresent: false,
  runtimeRootsPairwiseIdentityDistinct: false,
  producerStagingRootAndExactDirectoriesPrecreatedByTrustedBroker: false,
  verifierReplayRootPrecreatedByTrustedBroker: false,
  verifierAttestationRootPrecreatedByTrustedBroker: false,
  exactProducerStagingArrayInventoryObserved: false,
  producerDescriptorAbsenceObserved: false,
  verifierSecureRereadPassed: false,
  secureStatReadStatProtocolPassedForEveryObservedFile: false,
  verifierReplayBundlePresent: false,
  verifierReplayBundleInstanceHashBound: false,
  finalOutputRootAndExactDirectoriesPrecreatedByTrustedBroker: false,
  exactVerifiedArrayCopiesObserved: false,
  descriptorWrittenLast: false,
  outputArtifactPresent: false,
  outputArtifactHashBound: false,
  secureRereadPassed: false,
  independentGateReplayPassed: false,
  continuousNodelessReplayPassed: false,
  continuousPeakReplayPassed: false,
  numericalOriginSeriesDefectReplayPassed: false,
  finalDescriptorBundleProjectionEqualityPassed: false,
  outputDescriptorSchemaBindingValidated: false,
  proofReplayProtocolBindingValidated: false,
  diagnosticSeedAdmissible: false,
});

const CLAIM_LOCKS = Object.freeze({
  ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.claimLocks,
  seedRunCapabilityEstablished: false,
  threeStageSourceToolchainAndInputClosuresEstablished: false,
  threeStageRuntimeIsolationEstablished: false,
  seedRunResourcePolicyEnforced: false,
  seedRunAbsoluteDeadlineEnforced: false,
  seedRunKernelOutputQuotasEnforced: false,
  seedRunNetworkDenied: false,
  seedRunExecuted: false,
  seedRunArtifactAccepted: false,
  seedRunIndependentReplayAccepted: false,
  seedRunTrustedDescriptorAssemblyAccepted: false,
  seedRunFinalSecureRereadAccepted: false,
  seedRunDescriptorBundleProjectionEqualityAccepted: false,
  seedRunNumericalOriginSeriesDefectAccepted: false,
  relativisticBranchSolvedBySeedRun: false,
  physicalSourceRealizedBySeedRun: false,
  physicalViabilityEstablishedBySeedRun: false,
  transportOrPropulsionEstablishedBySeedRun: false,
} as const);

const CONTRACT = {
  artifactId: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ARTIFACT_ID,
  contractVersion:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTRACT_VERSION,
  authority: "nonexecuting_preregistered_external_seed_run_plan_only",
  maturity: "diagnostic_execution_plan_no_capability_no_execution_no_artifact",
  executionAuthorized: false,
  bindings: {
    authoritativeImportedSingletonBindingsRequired: true,
    candidatePlanV2: {
      artifactId:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_ARTIFACT_ID,
      contractVersion:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
      canonicalBinding:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
    },
    branchBvpV1: {
      artifactId: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID,
      contractVersion: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION,
      canonicalBinding: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
    },
    newtonianSeedV1: {
      artifactId: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_ARTIFACT_ID,
      contractVersion:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CONTRACT_VERSION,
      canonicalBinding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
    },
    seedOutputAndProofProtocol: {
      outputDescriptorSchemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
      proofReplayProtocolBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
      verifierReplayBundleSchemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING,
      controlPlaneEvidenceGrammarRegistryBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
      allImportedSeedOutputProofReplayAndRegistryBindingsRequiredInRunRequest: true,
      authoritativeSingletonIdentityRequired: true,
    },
  },
  controlPlaneEvidenceGrammar: {
    registry:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY,
    binding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
    futureTypedInterpreterMustValidateEveryLedgerEnvelopeReceiptObservationBundleAndAdmissionInstanceBeforeHashAuthority: true,
    everyInstanceBindingMustUseTheRegisteredDomainPreimageAndControlPlaneBindingSchema: true,
    typedInterpreterBinding: null,
    executableValidationAuthorityPresent: false,
    runtimeInstanceOrReceipt: null,
  },
  invocation: {
    stageId: EXECUTION_STAGES[0],
    executionTarget: "external_linux_oci_cgroup_v2_worker",
    executableAbsolutePath: "/opt/nhm2-producer/toolchain/python/bin/python3",
    argvAfterExecutable: [
      "-I",
      "-S",
      "-B",
      "-X",
      "utf8",
      "/opt/nhm2-producer/source/producer/bootstrap.py",
      "--input-manifest",
      "/run/input/00-seed-run-request.v1.json",
      "--output-root",
      "/run/staging",
    ],
    workingDirectory: "/run/staging",
    writesOnlyExactThirtyTwoStagingArrays: true,
    descriptorReceiptOrGateReportWritesAllowed: false,
    shellAllowed: false,
    stdin: "closed",
    stdoutAndStderr:
      "exact_run_plan_observation_capture_policy_no_artifact_or_gate_authority",
    inheritedEnvironmentAllowed: false,
    environment: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ENVIRONMENT,
    environmentAllowlist: Object.keys(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ENVIRONMENT,
    ).sort(),
    forbiddenAmbientVariables: [
      "CONDA_PREFIX",
      "HOME",
      "LD_LIBRARY_PATH",
      "PATH",
      "PYTHONHOME",
      "PYTHONPATH",
      "PYTHONUSERBASE",
      "USERPROFILE",
      "VIRTUAL_ENV",
    ],
    pythonImportPolicy:
      "isolated_minus_I_minus_S_with_bootstrap_fixed_hash_bound_sys_path",
    launchApi: null,
    callbackApi: null,
    remoteExecutionApi: null,
  },
  trustedStageInvocations: {
    verifier: {
      stageId: EXECUTION_STAGES[1],
      executionTarget: "external_linux_oci_cgroup_v2_worker",
      executableAbsolutePath: "/opt/nhm2-verifier/toolchain/python/bin/python3",
      argvAfterExecutable: [
        "-I",
        "-S",
        "-B",
        "-X",
        "utf8",
        "/opt/nhm2-verifier/source/verifier/bootstrap.py",
        "--input-manifest",
        "/run/input/00-seed-run-request.v1.json",
        "--staging-root",
        "/run/staging",
        "--replay-bundle",
        VERIFIER_REPLAY_BUNDLE_PATH,
      ],
      workingDirectory: "/run/replay",
      shellAllowed: false,
      stdin: "closed",
      stdoutAndStderr:
        "exact_run_plan_observation_capture_policy_no_artifact_or_gate_authority",
      inheritedEnvironmentAllowed: false,
      environment: VERIFIER_ENVIRONMENT,
      environmentAllowlist: Object.keys(VERIFIER_ENVIRONMENT).sort(),
      launchApi: null,
      callbackApi: null,
      remoteExecutionApi: null,
    },
    assembler: {
      stageId: EXECUTION_STAGES[2],
      executionTarget: "external_linux_oci_cgroup_v2_worker",
      executableAbsolutePath:
        "/opt/nhm2-assembler/toolchain/python/bin/python3",
      argvAfterExecutable: [
        "-I",
        "-S",
        "-B",
        "-X",
        "utf8",
        "/opt/nhm2-assembler/source/assembler/bootstrap.py",
        "--input-manifest",
        "/run/input/00-seed-run-request.v1.json",
        "--staging-root",
        "/run/staging",
        "--replay-bundle",
        VERIFIER_REPLAY_BUNDLE_PATH,
        "--verifier-enforcement-receipt",
        VERIFIER_ENFORCEMENT_RECEIPT_PATH,
        "--output-root",
        "/run/output",
      ],
      workingDirectory: "/run/output",
      shellAllowed: false,
      stdin: "closed",
      stdoutAndStderr:
        "exact_run_plan_observation_capture_policy_no_artifact_or_gate_authority",
      inheritedEnvironmentAllowed: false,
      environment: ASSEMBLER_ENVIRONMENT,
      environmentAllowlist: Object.keys(ASSEMBLER_ENVIRONMENT).sort(),
      launchApi: null,
      callbackApi: null,
      remoteExecutionApi: null,
    },
    exactArgvAndEnvironmentRequired: true,
    shellOrStringCommandParsingAllowed: false,
  },
  observationCapturePolicy: {
    appliesToExactStages: EXECUTION_STAGES,
    receiptSchema:
      "control_plane_evidence_grammar_registry.schemas.observationCaptureReceipt",
    receiptSha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
        .domains.observationCaptureReceipt,
    perStage: {
      producer: {
        maximumStdoutBytes: STDOUT_MAXIMUM_BYTES_PER_STAGE,
        maximumStderrBytes: STDERR_MAXIMUM_BYTES_PER_STAGE,
        maximumCombinedCaptureBytes:
          STDOUT_MAXIMUM_BYTES_PER_STAGE + STDERR_MAXIMUM_BYTES_PER_STAGE,
        maximumFilesystemOutputBytes:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.byteLength,
        maximumCombinedCaptureAndFilesystemOutputBytes:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.byteLength +
          STDOUT_MAXIMUM_BYTES_PER_STAGE +
          STDERR_MAXIMUM_BYTES_PER_STAGE,
      },
      verifier: {
        maximumStdoutBytes: STDOUT_MAXIMUM_BYTES_PER_STAGE,
        maximumStderrBytes: STDERR_MAXIMUM_BYTES_PER_STAGE,
        maximumCombinedCaptureBytes:
          STDOUT_MAXIMUM_BYTES_PER_STAGE + STDERR_MAXIMUM_BYTES_PER_STAGE,
        maximumFilesystemOutputBytes: VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES,
        maximumCombinedCaptureAndFilesystemOutputBytes:
          VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES +
          STDOUT_MAXIMUM_BYTES_PER_STAGE +
          STDERR_MAXIMUM_BYTES_PER_STAGE,
      },
      assembler: {
        maximumStdoutBytes: STDOUT_MAXIMUM_BYTES_PER_STAGE,
        maximumStderrBytes: STDERR_MAXIMUM_BYTES_PER_STAGE,
        maximumCombinedCaptureBytes:
          STDOUT_MAXIMUM_BYTES_PER_STAGE + STDERR_MAXIMUM_BYTES_PER_STAGE,
        maximumFilesystemOutputBytes:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.byteLength +
          DESCRIPTOR_MAXIMUM_UTF8_BYTES,
        maximumCombinedCaptureAndFilesystemOutputBytes:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.byteLength +
          DESCRIPTOR_MAXIMUM_UTF8_BYTES +
          STDOUT_MAXIMUM_BYTES_PER_STAGE +
          STDERR_MAXIMUM_BYTES_PER_STAGE,
      },
    },
    brokerEnforcementReceiptMaximumUtf8Bytes:
      ENFORCEMENT_RECEIPT_MAXIMUM_UTF8_BYTES,
    captureMustBeStreamingAndMayNotAccumulateBeyondLiteralCaps: true,
    overflowAction: "kill_active_stage_cgroup_and_wait_for_populated_zero",
    truncationOrOverflowCanNeverBeAdmitted: true,
    captureGrantsArtifactGateOrClaimAuthority: false,
    receiptBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
  },
  stageSequence: {
    exactStageOrder: EXECUTION_STAGES,
    concurrentStageExecutionAllowed: false,
    runWideWallDeadlineCoversAllStagesAndFinalReread: true,
    producer: {
      stageId: EXECUTION_STAGES[0],
      trustClass: "untrusted_numerical_producer",
      inputAccess: "sealed_base_input_read_only",
      onlyWritableRoot: "/run/staging",
      launchRequiresTrustedBrokerStagingDirectoryPrestateReceipt: true,
      exactPermittedWrites: "thirty_two_imported_seed_array_files_only",
      descriptorReceiptGateReportOrFinalOutputWritesAllowed: false,
      mustExitAndLeaveCgroupEmptyBeforeVerifierStarts: true,
    },
    verifier: {
      stageId: EXECUTION_STAGES[1],
      trustClass: "trusted_server_owned_independent_verifier",
      stagingAndBaseInputAccess:
        "read_only_fixed_imported_inventory_plus_server_observed_hash_size_shape_dtype_order_reread",
      onlyWritableRoot: "/run/replay",
      exactPermittedWrite: VERIFIER_REPLAY_BUNDLE_PATH,
      launchRequiresTrustedBrokerReplayDirectoryPrestateReceipt: true,
      stagingRereadUsesExactSecureFileObservationProtocol: true,
      recomputesEverySeedGateAndThreeReceiptsFromArrays: true,
      derivesItsScientificOperatorsIndependentlyFromTheFrozenSeedBvpAndProofProtocol: true,
      producerSourceDiagnosticsOrRuntimeImportsAllowed: false,
      seedDescriptorWritesAllowed: false,
      mustExitAndLeaveCgroupEmptyBeforeAssemblerStarts: true,
    },
    assembler: {
      stageId: EXECUTION_STAGES[2],
      trustClass: "trusted_descriptor_assembler",
      verifiedArraysReplayBundleAndVerifierReceiptAccess: "read_only",
      verifierEnforcementReceiptPath: VERIFIER_ENFORCEMENT_RECEIPT_PATH,
      launchRequiresBrokerValidatedVerifierReceiptBindingClosedBundleHashAndSize: true,
      onlyWritableRoot: "/run/output",
      launchRequiresTrustedBrokerFinalDirectoryPrestateReceipt: true,
      outputRootMustBeFreshAndIdentityDistinctFromStagingAndReplayRoots: true,
      copiesOnlyVerifierAdmittedArrayBytesExclusively: true,
      rechecksEveryCopiedArrayHashAndByteLength: true,
      copySourceAndDestinationUseExactSecureFileObservationProtocol: true,
      writesExactCanonicalDescriptorExclusivelyAfterArrayFsyncs: true,
      descriptorIsLastFilesystemWriteCommitMarker: true,
      producerOrVerifierSourceRuntimeImportsAllowed: false,
      mustExitAndLeaveCgroupEmptyBeforeFinalReread: true,
    },
    finalAdmission: {
      owner: "trusted_server_outside_all_three_stage_runtimes",
      securelyRereadsRehashesAndRecanonicalizesFinalClosedContainer: true,
      exactSecureFileObservationProtocolRequired: true,
      allDirectoryPrestateAndRootIdentityReceiptsRequired: true,
      replaysDescriptorSchemaAndBindingChecks: true,
      sourceReplayBundleMustBeTheExactInstanceBoundByTheVerifierPostExitReceipt: true,
      descriptorRuntimeProjectionPointerPairs:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .schemas.finalProjectionEqualityReceipt.fields.fieldComparisons
          .exactPointerOrder,
      everyProjectedSourceAndTargetCanonicalUtf8ByteStringAndRecursiveValueMustMatch: true,
      observedArrayInventoryMustEqualDescriptorArrayInventoryInAllTwelveFieldsAndFinalRawBytes: true,
      clockId: "CLOCK_MONOTONIC_RAW",
      exactPhaseOrder: [
        "final_descriptor_observation",
        "final_container_closed_reread",
        "final_projection_equality",
        "final_admission",
      ],
      descriptorPhaseEndNotAfterContainerPhaseStart: true,
      containerPhaseEndNotAfterProjectionPhaseStart: true,
      projectionPhaseEndNotAfterAdmission: true,
      assemblerEnforcementEndNotAfterDescriptorPhaseStart: true,
      everyPhaseEndStrictlyBeforeAbsoluteDeadline: true,
      finalDescriptorObservationBinding: null,
      finalContainerObservationBinding: null,
      projectionEqualityReceiptSchema:
        "control_plane_evidence_grammar_registry.schemas.finalProjectionEqualityReceipt",
      projectionEqualityReceipt: null,
      finalAdmissionReceiptSchema:
        "control_plane_evidence_grammar_registry.schemas.finalAdmissionReceipt",
      producerVerifierOrAssemblerClaimsGrantAuthority: false,
      receipt: null,
      accepted: false,
    },
  },
  inputClosure: {
    duties: INPUT_CLOSURE_DUTIES,
    baseInputProfile:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BASE_INPUT_PROFILE,
    baseInputProfileCount: 8,
    firstEightStageLedgerObservationsMustMatchProfileOneToOne: true,
    requiredFileCount: INPUT_CLOSURE_DUTIES.length,
    requiredFilePathOrder: INPUT_REQUIRED_FILE_PATH_ORDER,
    requiredExplicitDirectoryPathOrder:
      INPUT_REQUIRED_EXPLICIT_DIRECTORY_PATH_ORDER,
    exactClosedFileInventoryRequired: true,
    extraFilesOrDirectoriesAllowed: false,
    everyFileRequiresSha256AndByteLength: true,
    symlinksReparsePointsAndHardlinksAllowed: false,
    mountPath: "/run/input",
    mountAccess: "read_only",
    seedRunRequestBinding: null,
    inputLedgerBinding: null,
    inputClosureManifestBinding: null,
    runRequestSchema:
      "control_plane_evidence_grammar_registry.schemas.seedRunRequest",
    runRequestSha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
        .domains.seedRunRequest,
    runRequestExactKeyOrder:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
        .schemas.seedRunRequest.exactKeys,
    runRequestBinding: null,
    futureVerifierOrAssemblerInputLedgerDigestMayAppearInRunRequest: false,
    runtimeLaunchEnvelopeOrPriorStageReceiptMayAppearInRunRequest: false,
    sealed: false,
  },
  stageClosures: {
    exactStageOrder: EXECUTION_STAGES,
    closureManifestSchema:
      "control_plane_evidence_grammar_registry.schemas.closureManifest",
    closureLedgerSchema:
      "control_plane_evidence_grammar_registry.schemas.closureLedger",
    producer: {
      stageId: EXECUTION_STAGES[0],
      duties: PRODUCER_TOOLCHAIN_CLOSURE_DUTIES,
      sourceDutyProfile:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .stageProfiles.producer.closureDutyProfiles.source,
      toolchainDutyProfile:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .stageProfiles.producer.closureDutyProfiles.toolchain,
      requiredInputFileCount: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER.length,
      requiredInputFilePathOrder: PRODUCER_STAGE_INPUT_FILE_PATH_ORDER,
      requiredExplicitDirectoryPathOrder:
        INPUT_REQUIRED_EXPLICIT_DIRECTORY_PATH_ORDER,
      exactClosedInputLedgerRequired: true,
      extraInputFilesOrDirectoriesAllowed: false,
      sourceManifestSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.producerSourceClosureManifest,
      sourceLedgerSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.producerSourceClosureLedger,
      toolchainManifestSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.producerToolchainClosureManifest,
      toolchainLedgerSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.producerToolchainClosureLedger,
      sourceManifestBinding: null,
      sourceLedgerBinding: null,
      toolchainManifestBinding: null,
      toolchainLedgerBinding: null,
      inputLedgerBinding: null,
      ociImageDigest: null,
      sourceToolchainAndImageClosureSealedBeforeRunLaunch: false,
      inputLedgerSealedBeforeProducerLaunch: false,
      launchEnvelopeBinding: null,
      stageLaunchAuthorized: false,
      selectedPythonRuntime: null,
      selectedNumpyRuntime: null,
      selectedScipyRuntime: null,
      selectedBlasLapackRuntime: null,
      importsFromVerifierOrAssemblerSourceAllowed: false,
      sealed: false,
    },
    verifier: {
      stageId: EXECUTION_STAGES[1],
      duties: VERIFIER_TOOLCHAIN_CLOSURE_DUTIES,
      sourceDutyProfile:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .stageProfiles.verifier.closureDutyProfiles.source,
      toolchainDutyProfile:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .stageProfiles.verifier.closureDutyProfiles.toolchain,
      requiredInputFileCount: VERIFIER_STAGE_INPUT_FILE_PATH_ORDER.length,
      requiredInputFilePathOrder: VERIFIER_STAGE_INPUT_FILE_PATH_ORDER,
      requiredExplicitDirectoryPathOrder:
        VERIFIER_STAGE_INPUT_DIRECTORY_PATH_ORDER,
      exactClosedInputLedgerRequired: true,
      extraInputFilesOrDirectoriesAllowed: false,
      sourceManifestSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.verifierSourceClosureManifest,
      sourceLedgerSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.verifierSourceClosureLedger,
      toolchainManifestSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.verifierToolchainClosureManifest,
      toolchainLedgerSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.verifierToolchainClosureLedger,
      sourceManifestBinding: null,
      sourceLedgerBinding: null,
      toolchainManifestBinding: null,
      toolchainLedgerBinding: null,
      inputLedgerBinding: null,
      ociImageDigest: null,
      sourceToolchainAndImageClosureSealedBeforeRunLaunch: false,
      inputLedgerSealedOnlyAfterProducerExitAndTrustedStagingObservation: false,
      launchEnvelopeBinding: null,
      stageLaunchAuthorized: false,
      selectedVerifierRuntime: null,
      selectedDirectedRoundingRuntime: null,
      importsFromProducerOrAssemblerSourceAllowed: false,
      sealed: false,
    },
    assembler: {
      stageId: EXECUTION_STAGES[2],
      duties: ASSEMBLER_TOOLCHAIN_CLOSURE_DUTIES,
      sourceDutyProfile:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .stageProfiles.assembler.closureDutyProfiles.source,
      toolchainDutyProfile:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .stageProfiles.assembler.closureDutyProfiles.toolchain,
      requiredInputFileCount: ASSEMBLER_STAGE_INPUT_FILE_PATH_ORDER.length,
      requiredInputFilePathOrder: ASSEMBLER_STAGE_INPUT_FILE_PATH_ORDER,
      requiredExplicitDirectoryPathOrder:
        ASSEMBLER_STAGE_INPUT_DIRECTORY_PATH_ORDER,
      exactClosedInputLedgerRequired: true,
      extraInputFilesOrDirectoriesAllowed: false,
      sourceManifestSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.assemblerSourceClosureManifest,
      sourceLedgerSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.assemblerSourceClosureLedger,
      toolchainManifestSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.assemblerToolchainClosureManifest,
      toolchainLedgerSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.assemblerToolchainClosureLedger,
      sourceManifestBinding: null,
      sourceLedgerBinding: null,
      toolchainManifestBinding: null,
      toolchainLedgerBinding: null,
      inputLedgerBinding: null,
      ociImageDigest: null,
      sourceToolchainAndImageClosureSealedBeforeRunLaunch: false,
      inputLedgerSealedOnlyAfterVerifierBundleCloseAndPostExitReceiptValidation: false,
      launchEnvelopeBinding: null,
      stageLaunchAuthorized: false,
      selectedAssemblerRuntime: null,
      importsFromProducerOrVerifierSourceAllowed: false,
      sealed: false,
    },
    commonClosureDuties: {
      exactVersionHashAndByteLengthForEveryTransitiveFileRequired: true,
      exactRuntimeVersionsMustBeLiteralsNotRanges: true,
      ambientSitePackagesAllowed: false,
      sourceBuildsRequireCompilerAndBuildRecipeClosure: true,
      everySourceToolchainAndInputLedgerIsClosedOrderedAndHashBound: true,
    },
    crossStageIsolation: {
      pairwiseDistinctNonNullBindingsRequiredBeforeProducerLaunch: [
        "sourceManifestBinding",
        "sourceLedgerBinding",
        "toolchainManifestBinding",
        "toolchainLedgerBinding",
        "ociImageDigest",
      ],
      producerInputLedgerRequiredBeforeProducerLaunch: true,
      verifierInputLedgerConstructedAfterProducerOutputObservationAndRequiredBeforeVerifierLaunch: true,
      assemblerInputLedgerConstructedAfterVerifierBundleAndPostExitReceiptAndRequiredBeforeAssemblerLaunch: true,
      allThreeInputLedgerBindingsMustBeNonNullAndPairwiseDistinctByFinalAdmission: true,
      sourceImportsAcrossStagesAllowed: false,
      sharedExecutableOrRuntimeLedgerAuthorityAllowed: false,
      sharedInProcessAddressSpaceAllowed: false,
      dynamicPluginOrCallbackLoadingAcrossStagesAllowed: false,
      onlyHashBoundContractAndDataArtifactsMayCrossStageBoundaries: true,
      separationReceiptSchema:
        "control_plane_evidence_grammar_registry.schemas.crossStageSeparationReceipt",
      separationReceiptSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.crossStageSeparationReceipt,
      separationReceiptBinding: null,
      established: false,
    },
  },
  stageInputLedgerAndLaunchEnvelopePolicy: {
    authority:
      "trusted_broker_constructed_stage_local_ledgers_and_launch_envelopes_no_future_digest_preregistration",
    canonicalization: "RFC8785_JSON_Canonicalization_Scheme_UTF8",
    evidenceGrammarRegistryBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
    inputLedgerSchema:
      "control_plane_evidence_grammar_registry.schemas.stageInputLedger",
    launchEnvelopeSchema:
      "control_plane_evidence_grammar_registry.schemas.stageLaunchEnvelope",
    inputLedgerSha256Domains: {
      producer:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.producerInputLedger,
      verifier:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.verifierInputLedger,
      assembler:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.assemblerInputLedger,
    },
    launchEnvelopeSha256Domains: {
      producer:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.producerLaunchEnvelope,
      verifier:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.verifierLaunchEnvelope,
      assembler:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.assemblerLaunchEnvelope,
    },
    stageProfiles:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY.stageProfiles,
    exactBaseInputProfile:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BASE_INPUT_PROFILE,
    everyStageFirstEightObservationsOneToOneEqualExactBaseProfile: true,
    everyInputFileMustPassTheSecureFileObservationProtocol: true,
    producer: {
      inputLedgerConstructionTiming:
        "after_common_8_file_input_closure_staging_prestate_and_producer_quota_setup_receipt_are_sealed_before_producer_launch",
      priorStageReceiptBindingsExactLength: 0,
      launchRequiresSealedInputLedgerAndEnvelope: true,
    },
    verifier: {
      inputLedgerConstructionTiming:
        "after_producer_exit_cgroup_empty_trusted_broker_secure_observation_of_exact_32_staging_arrays_replay_prestate_and_verifier_quota_setup_receipt",
      laterFileObservationProjection:
        "indices_8_through_39_recursively_equal_the_exact_broker_bound_producer_closed_output_observations",
      priorStageReceiptBindings: [
        "producer_enforcement_receipt_binding",
        "staging_prestate_receipt_binding",
      ],
      launchRequiresSealedInputLedgerAndEnvelope: true,
    },
    assembler: {
      inputLedgerConstructionTiming:
        "after_verifier_bundle_close_verifier_exit_cgroup_empty_broker_post_exit_receipt_validation_final_prestate_and_assembler_quota_setup_receipt",
      laterFileObservationProjection:
        "indices_8_through_39_equal_the_prior_broker_bound_staging_observations_index_40_equals_the_bound_replay_bundle_observation_and_index_41_securely_observes_raw_canonical_post_exit_receipt_bytes_that_recompute_the_exact_named_verifier_enforcement_receipt_domain_binding",
      priorStageReceiptBindings: [
        "producer_enforcement_receipt_binding",
        "verifier_enforcement_receipt_binding",
        "verifier_replay_bundle_binding",
        "final_output_prestate_receipt_binding",
      ],
      launchRequiresSealedInputLedgerAndEnvelope: true,
    },
    eachStageEnforcementReceiptMustBindExactLaunchEnvelopeSha256: true,
    commonRunRequestMayBindOnlyThisConstructionPolicyNotFutureLedgerDigests: true,
    producerInputLedgerBinding: null,
    verifierInputLedgerBinding: null,
    assemblerInputLedgerBinding: null,
    producerLaunchEnvelopeBinding: null,
    verifierLaunchEnvelopeBinding: null,
    assemblerLaunchEnvelopeBinding: null,
  },
  outputPolicy: {
    finalOutputMountPath: "/run/output",
    assemblerOutputMountIsOnlyWritableMount: true,
    umask: "0077",
    seedContainerClosure: SEED_CONTAINER_CLOSURE,
    expectedFilePathOrder: SEED_CONTAINER_CLOSURE.requiredFilePathOrder,
    expectedDirectories:
      SEED_CONTAINER_CLOSURE.requiredExplicitDirectoryPathOrder,
    descriptorByteAdmission: {
      rawBytesReadBeforeJsonAuthority: true,
      recursiveSchemaValidationUsesAuthoritativeImportedBinding: true,
      parsedValueRecanonicalizedUnderFrozenSeedCanonicalization: true,
      recanonicalizedUtf8MustEqualRawBytesByteForByte: true,
      byteOrderMarkTrailingWhitespaceAndAlternateJsonSpellingsReject: true,
      equalityRequiredBeforeDescriptorLastWriteAdmission: true,
    },
    directoryPreparationPolicy: {
      exclusiveOwner: "trusted_broker_outside_all_three_stage_runtimes",
      prestateReceiptSchema:
        "control_plane_evidence_grammar_registry.schemas.directoryPrestateReceipt",
      preparationReceiptBundleSchema:
        "control_plane_evidence_grammar_registry.schemas.directoryPreparationReceiptBundle",
      prestateReceiptSha256Domains: {
        staging:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.stagingPrestateReceipt,
        replay:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.replayPrestateReceipt,
        attestation:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.attestationPrestateReceipt,
        finalOutput:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.finalOutputPrestateReceipt,
        bundle:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.directoryPreparationReceiptBundle,
      },
      stagingPrestate: {
        creationTiming: "before_producer_launch",
        exactDirectoryCreationPathOrder: STAGING_DIRECTORY_CREATION_PATH_ORDER,
        rootMustBeNewlyCreatedAndPreviouslyAbsent: true,
        exactDirectoriesObservedWithNoFilesOrOtherEntries: true,
        producerMayCreateRemoveRenameOrAliasDirectories: false,
        receipt: null,
      },
      replayPrestate: {
        creationTiming: "after_producer_cgroup_empty_before_verifier_launch",
        exactDirectoryCreationPathOrder: ["/run/replay"],
        rootMustBeNewlyCreatedAndPreviouslyAbsent: true,
        rootObservedEmpty: true,
        verifierMayCreateRemoveRenameOrAliasDirectories: false,
        receipt: null,
      },
      attestationPrestate: {
        creationTiming:
          "after_verifier_exit_before_trusted_broker_writes_post_exit_receipt",
        exactDirectoryCreationPathOrder: ["/run/attestation"],
        rootMustBeNewlyCreatedAndPreviouslyAbsent: true,
        rootObservedEmptyBeforeExclusiveBrokerReceiptWrite: true,
        stageRuntimesMayCreateRemoveRenameOrAliasDirectoryOrReceipt: false,
        receipt: null,
      },
      finalOutputPrestate: {
        creationTiming:
          "after_verifier_post_exit_receipt_validation_before_assembler_launch",
        exactDirectoryCreationPathOrder:
          FINAL_OUTPUT_DIRECTORY_CREATION_PATH_ORDER,
        rootMustBeNewlyCreatedAndPreviouslyAbsent: true,
        exactDirectoriesObservedWithNoFilesOrOtherEntries: true,
        assemblerMayCreateRemoveRenameOrAliasDirectories: false,
        receipt: null,
      },
      exactRootIdentityObservationFields: [
        "mount_id",
        "st_dev",
        "st_ino",
        "resolved_beneath_parent_path",
      ],
      stagingReplayAttestationAndFinalRootsMustBePairwiseIdentityDistinct: true,
      bindMountJunctionSymlinkHardlinkOrPathAliasCollisionsAllowed: false,
      rootIdentityMustRemainStableThroughOwningStageAndSecureReread: true,
      preparationReceiptBundle: null,
      established: false,
    },
    secureFileObservationProtocol: {
      fileObservationSchema:
        "control_plane_evidence_grammar_registry.schemas.fileObservation",
      directoryObservationSchema:
        "control_plane_evidence_grammar_registry.schemas.directoryObservation",
      closedStageOutputObservationSchema:
        "control_plane_evidence_grammar_registry.schemas.closedStageOutputObservation",
      appliesTo: [
        "trusted_broker_staging_input_ledger_observation",
        "trusted_verifier_staging_reread",
        "trusted_broker_replay_bundle_and_attestation_input_ledger_observation",
        "trusted_assembler_staging_copy_source",
        "trusted_assembler_verifier_receipt_read",
        "trusted_assembler_final_copy_destination",
        "trusted_server_final_container_reread",
      ],
      pathResolution:
        "directory_fd_openat2_RESOLVE_BENEATH_RESOLVE_NO_SYMLINKS_RESOLVE_NO_MAGICLINKS_RESOLVE_NO_XDEV",
      acceptedFileType: "regular_file_only",
      symlinksHardlinksDevicesFifosSocketsOrOtherSpecialFilesAllowed: false,
      requiredLinkCount: 1,
      preOpenPathStatOpenHandleStatPostReadHandleStatAndPostReadPathStatRequired: true,
      invariantIdentityFields: [
        "mount_id",
        "st_dev",
        "st_ino",
        "mode_file_type",
        "st_nlink",
        "st_uid",
        "st_gid",
        "st_size",
        "st_mtime_ns",
        "st_ctime_ns",
      ],
      everyIdentityAndTimeFieldMustRemainEqualAcrossStatReadStat: true,
      bytesMustBeReadOnlyFromTheValidatedOpenHandleToExactEof: true,
      directoryFdIdentityAndClosedInventoryMustRemainStableAcrossReread: true,
      assemblerDestinationMustBeExclusivelyCreatedThenSecurelyReread: true,
      assemblerSourceAndDestinationByteLengthAndSha256MustMatchExactly: true,
      anyMismatchReplacementMutationOrExtraEntryFailsClosed: true,
      observationBindings: {
        brokerStagingInputLedger: null,
        verifierStagingReplay: null,
        assemblerSourceAndDestination: null,
        finalContainer: null,
      },
      passed: false,
    },
    producerStaging: {
      writerStage: EXECUTION_STAGES[0],
      root: "/run/staging",
      onlyWritableMountForStage: true,
      exactFileCount: 32,
      exactFilePathOrder: STAGING_ARRAY_FILE_PATH_ORDER,
      exactRelativeFilePathOrder:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
          ({ relativePath }) => relativePath,
        ),
      requiredExplicitDirectoryPathOrder:
        SEED_CONTAINER_CLOSURE.requiredExplicitDirectoryPathOrder,
      arraysWrittenInImportedInventoryOrder: true,
      descriptorPathMustNotExist: SEED_CONTAINER_CLOSURE.descriptorRelativePath,
      receiptsGateReportsLogsTempFilesOrOtherWritesAllowed: false,
      extraFilesDirectoriesSocketsDevicesOrPipesAllowed: false,
      grantsArtifactOrGateAuthority: false,
    },
    verifierReplay: {
      writerStage: EXECUTION_STAGES[1],
      root: "/run/replay",
      onlyWritableMountForStage: true,
      exactFileCount: 1,
      exactFilePathOrder: [VERIFIER_REPLAY_BUNDLE_PATH],
      requiredExplicitDirectoryPathOrder:
        INPUT_REQUIRED_EXPLICIT_DIRECTORY_PATH_ORDER,
      exactPermittedFilePath: VERIFIER_REPLAY_BUNDLE_PATH,
      maximumCanonicalUtf8Bytes: VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES,
      schema:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA,
      schemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING,
      instanceHashGrammar:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY.verifierReplayBundleInstanceHashGrammar,
      instanceSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.verifierReplayBundleInstance,
      instanceBinding: null,
      rawBytesMustEqualSchemaValidatedCanonicalUtf8BytesExactly: true,
      replayBundleMustBindAllThirtyTwoStagingArrayHashes: true,
      replayBundleMustContainScalarMetadataAllGateResultsAndThreeProofReceipts: true,
      verifierMayNotPredictEmbedOrReceiveItsPostExitEnforcementReceipt: true,
      descriptorPathMayNotBeCreated: true,
      extraFilesDirectoriesSocketsDevicesOrPipesAllowed: false,
      grantsFinalArtifactAuthority: false,
      replayBundle: null,
    },
    trustedFinalAssembly: {
      writerStage: EXECUTION_STAGES[2],
      root: "/run/output",
      onlyWritableMountForStage: true,
      rootMustBeFreshAndIdentityDistinctFromStagingAndReplayRoots: true,
      arraysCopiedExclusivelyInImportedInventoryOrder: true,
      copiedArrayBytesSizesAndHashesMustEqualVerifierAdmittedValues: true,
      descriptorRuntimeFieldsMustMapExactlyFromTheClosedReplayBundle: [
        "scalarMetadata<-serverRecomputedScalarMetadata",
        "serverRecomputedGateReport<-serverRecomputedGateReport",
        "continuousNodelessProofReceipt<-continuousNodelessProofReceipt",
        "continuousPeakProofReceipt<-continuousPeakProofReceipt",
        "numericalOriginSeriesDefectReceipt<-numericalOriginSeriesDefectReceipt",
        "arrayInventory<-observedArrayInventory_exact_12_field_tuple",
      ],
      descriptorStaticFieldsMustBeCopiedFromTheImportedSeedContract: true,
      everyArrayClosedAndFsyncedBeforeDescriptorCreate: true,
      descriptorCreatedExclusivelyAsTheLastWrite: true,
      descriptorRawBytesMustEqualCanonicalUtf8BytesExactly: true,
      exactFileCount: SEED_CONTAINER_CLOSURE.requiredFileCount,
      exactFilePathOrder: SEED_CONTAINER_CLOSURE.requiredFilePathOrder,
      requiredExplicitDirectoryPathOrder:
        SEED_CONTAINER_CLOSURE.requiredExplicitDirectoryPathOrder,
      extraFilesDirectoriesSocketsDevicesOrPipesAllowed: false,
      finalRootSecureRereadRequiredBeforeAdmission: true,
      exactFinalProjectionEqualityReceiptRequired: true,
      assemblerEnforcementReceiptBinding: null,
      admitted: false,
    },
    arraysFirstInImportedInventoryOrder: true,
    descriptorLast: true,
    closedInventory: true,
    extraFilesDirectoriesSocketsDevicesOrPipesAllowed: false,
    inventory:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_OUTPUT_INVENTORY,
    arrayCount: 32,
    totalFileCount: 33,
    exactArrayByteLength:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.byteLength,
    descriptorMaximumUtf8Bytes: DESCRIPTOR_MAXIMUM_UTF8_BYTES,
    maximumAggregateOutputBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.byteLength +
      DESCRIPTOR_MAXIMUM_UTF8_BYTES,
    partialOutputOnFailureGrantsAuthority: false,
    outputArtifactBinding: null,
  },
  producerIndependentAcceptanceReplay: {
    required: true,
    serverOwnedAndProducerIndependent: true,
    verifierStageId: EXECUTION_STAGES[1],
    mayImportProducerResidualObservableOrProofSummaryCode: false,
    mayImportProducerOrAssemblerExecutableSourceOrRuntime: false,
    producerDescriptorIsForbiddenAndDoesNotExistAtReplayTime: true,
    allThirtyTwoStagingArraysMustBeSecurelyRereadAndRehashedFirst: true,
    secureRereadMustValidateExactClosedArrayInventoryShapeDtypeOrderAndSize: true,
    outputDescriptorSchemaBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
    proofReplayProtocolBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
    verifierReplayBundleSchemaBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING,
    controlPlaneEvidenceGrammarRegistryBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
    requiredServerReplayedReceipts: [
      "continuousNodelessProofReceipt",
      "continuousPeakProofReceipt",
      "numericalOriginSeriesDefectReceipt",
    ],
    numericalOriginSeriesReceiptAuthorityBoundary:
      "numerical_defect_gate_only_no_exact_regularity_or_PDE_series_equality_authority",
    allThreeReceiptsMustBindTheSameProtocolAndProofKernel: true,
    allThreeReceiptsMustBindAllThirtyTwoSecurelyRereadArrayHashes: true,
    assemblerAndFinalAdmissionMustValidateExactRecursiveDescriptorSchema: true,
    everyScientificGateMustBeRecomputedFromRawArrays: true,
    verifierMustDeriveScientificOperatorsIndependentlyFromFrozenSeedBvpAndProofProtocol: true,
    producerSpecificOperatorQuadratureOrProlongationBytesMayAppearOnlyInProducerSealedClosure: true,
    verifierMaySeeOrImportProducerSpecificOperatorQuadratureOrProlongationBytes: false,
    mpfrGmpRuntimeSchema:
      "control_plane_evidence_grammar_registry.schemas.verifierMpfrGmpRuntime",
    mpfrGmpRuntimeBinding: null,
    replayBundlePath: VERIFIER_REPLAY_BUNDLE_PATH,
    replayBundleRawBytesMustEqualSchemaValidatedCanonicalUtf8BytesExactly: true,
    verifierMayWriteOnlyTheSealedReplayBundleAndNeverTheDescriptor: true,
    verifierReplayBundleInstanceBinding: null,
    accepted: false,
  },
  isolatedWorkerCapabilityRequirements: {
    capabilityKind: "attested_external_linux_oci_cgroup_v2_worker",
    appliesIndependentlyToExactStages: EXECUTION_STAGES,
    oneProcessOneThreadAndOneBlasThreadRequiredPerStage: true,
    currentHostWorkstationExecutionAllowed: false,
    capabilitySchema:
      "control_plane_evidence_grammar_registry.schemas.isolatedWorkerCapability",
    capabilitySha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
        .domains.isolatedWorkerCapability,
    capabilityBinding: null,
    capabilityAttestation: null,
    seccompPolicyBindingByStage: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    capabilityPresent: false,
    executionBlockedUntilCapabilityPresent: true,
    cgroupV2: {
      required: true,
      freshDedicatedCgroupPerStageRequired: true,
      stageCgroupsMayNotOverlap: true,
      aggregateChargedMemoryMetric: "cgroup_v2_memory.current",
      aggregateChargedMemoryScope:
        "active_stage_cgroup_including_all_descendants_and_threads",
      maximumAggregateChargedMemoryBytes: 768 * MIB,
      memoryMaxExact: "805306368",
      memorySwapMaxExact: "0",
      memoryOomGroupExact: "1",
      pidsAndTasksMetric: "cgroup_v2_pids.current",
      maximumContainedPidsAndTasks: 1,
      pidsMaxExact: "1",
      threadsCountAsTasks: true,
      trustedBrokerIncludedInContainedTaskCount: false,
      descendantsAndThreadsMayEscapeCgroup: false,
      eachStageCgroupMustReportPopulatedZeroBeforeNextStageOrFinalReread: true,
    },
    wallLimit: {
      maximumWallMilliseconds: 1_800_000,
      scope: "run_wide_across_all_three_sequential_stages_and_final_reread",
      clock: "CLOCK_MONOTONIC_RAW",
      timeoutAction: "write_1_to_cgroup.kill",
      completionCondition:
        "cgroup_events_populated_equals_zero_before_receipt_or_completion",
      direct_child_signal_or_taskkillAloneSufficient: false,
    },
    absoluteMonotonicDeadline: {
      evidenceSchema:
        "control_plane_evidence_grammar_registry.schemas.absoluteDeadlineReceipt",
      clockId: "CLOCK_MONOTONIC_RAW",
      maximumWallNanoseconds: "1800000000000",
      issuedWithSchedulerLeaseBeforeAnyRootPreparation: true,
      exactlyOneRunStartAndAbsoluteDeadlineForTheEntireSequence: true,
      checkedBeforeAndAfterExactOrderedPhases: [
        "staging_root_and_directory_preparation",
        "producer_input_ledger_and_launch_envelope_sealing",
        "producer_launch_execution_exit_and_cgroup_empty",
        "broker_staging_secure_observation",
        "replay_root_preparation",
        "verifier_quota_setup_receipt",
        "verifier_input_ledger_and_launch_envelope_sealing",
        "verifier_launch_execution_bundle_close_exit_and_cgroup_empty",
        "attestation_root_preparation_and_verifier_post_exit_receipt_write",
        "verifier_receipt_bundle_cross_validation",
        "final_output_root_and_directory_preparation",
        "assembler_input_ledger_and_launch_envelope_sealing",
        "assembler_launch_execution_exit_and_cgroup_empty",
        "final_container_secure_reread_and_rehash",
        "descriptor_bundle_projection_equality_replay",
        "final_admission_receipt_write",
      ],
      everyBrokerGapWaitObservationReadHashValidationAndFsyncCharged: true,
      stageLaunchAtOrAfterDeadlineAllowed: false,
      finalAdmissionAtOrAfterDeadlineAllowed: false,
      activeStageAtDeadlineAction:
        "write_1_to_active_stage_cgroup.kill_then_wait_for_cgroup_events_populated_zero",
      expiryWithNoActiveStageAction:
        "terminal_fail_closed_no_future_stage_launch_or_final_admission",
      everyPrestateLedgerEnvelopeBundleEnforcementProjectionAndFinalReceiptMustBindSameDeadline: true,
      absoluteDeadlineReceiptBinding: null,
      established: false,
    },
    filesystem: {
      rootFilesystemReadOnly: true,
      inputMount: { path: "/run/input", access: "read_only" },
      stageMounts: {
        producer: {
          toolchainMount: {
            path: "/opt/nhm2-producer",
            access: "read_only",
            sourceClosureRoot: "/opt/nhm2-producer/source",
            toolchainClosureRoot: "/opt/nhm2-producer/toolchain",
            exactFirstLevelDirectoryOrder: ["source", "toolchain"],
            extraFirstLevelEntriesAllowed: false,
          },
          stagingMount: { path: "/run/staging", access: "read_write" },
          writablePaths: ["/run/staging"],
          replayOrFinalOutputMountVisible: false,
        },
        verifier: {
          toolchainMount: {
            path: "/opt/nhm2-verifier",
            access: "read_only",
            sourceClosureRoot: "/opt/nhm2-verifier/source",
            toolchainClosureRoot: "/opt/nhm2-verifier/toolchain",
            exactFirstLevelDirectoryOrder: ["source", "toolchain"],
            extraFirstLevelEntriesAllowed: false,
          },
          stagingMount: { path: "/run/staging", access: "read_only" },
          replayMount: { path: "/run/replay", access: "read_write" },
          writablePaths: ["/run/replay"],
          finalOutputMountVisible: false,
        },
        assembler: {
          toolchainMount: {
            path: "/opt/nhm2-assembler",
            access: "read_only",
            sourceClosureRoot: "/opt/nhm2-assembler/source",
            toolchainClosureRoot: "/opt/nhm2-assembler/toolchain",
            exactFirstLevelDirectoryOrder: ["source", "toolchain"],
            extraFirstLevelEntriesAllowed: false,
          },
          stagingMount: { path: "/run/staging", access: "read_only" },
          replayMount: { path: "/run/replay", access: "read_only" },
          attestationMount: {
            path: "/run/attestation",
            access: "read_only",
          },
          outputMount: { path: "/run/output", access: "read_write" },
          writablePaths: ["/run/output"],
        },
      },
      exactlyOneDeclaredStageOutputRootWritablePerStage: true,
      otherWritableMountsAllowed: false,
      hostPathsOutsideDeclaredMountsVisible: false,
      deviceSecretDockerSocketOrControlSocketMountsAllowed: false,
    },
    kernelWritableMountQuotaAndFileSizePolicy: {
      kernelEnforcedLinuxProjectQuotaRequired: true,
      userspaceAccountingAloneSufficient: false,
      staticQuotaCapabilityMustBeSealedInCommonRunRequest: true,
      dynamicQuotaSetupReceiptMayExistBeforeItsStageRootExists: false,
      dynamicQuotaSetupReceiptCreatedAfterRootMountExistsImmediatelyBeforeStageLaunch: true,
      quotaChargedBytesIncludeAllocatedBlocksAndFilesystemMetadata: true,
      quotaChargedInodesIncludeBrokerPrecreatedRootAndDirectories: true,
      projectInheritanceFlagRequired: "FS_XFLAG_PROJINHERIT",
      zeroGraceHardLimitsRequired: true,
      everyDescendantOutputMustCarryTheRootDeviceAndProjectId: true,
      stageDeviceAndProjectIdPairsMustBePairwiseDistinct: true,
      stagePolicies: {
        producer: {
          writableMountPath: "/run/staging",
          maximumChargedBytes: 16 * MIB,
          maximumChargedInodes: 64,
          rlimitFsizeBytes: MAXIMUM_ARRAY_FILE_BYTES,
          exactLogicalOutputBytes: 6_482_304,
          exactOutputFileCount: 32,
        },
        verifier: {
          writableMountPath: "/run/replay",
          maximumChargedBytes: 20 * MIB,
          maximumChargedInodes: 8,
          rlimitFsizeBytes: VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES,
          maximumLogicalOutputBytes: VERIFIER_REPLAY_BUNDLE_MAXIMUM_UTF8_BYTES,
          exactOutputFileCount: 1,
        },
        assembler: {
          writableMountPath: "/run/output",
          maximumChargedBytes: 32 * MIB,
          maximumChargedInodes: 64,
          rlimitFsizeBytes: DESCRIPTOR_MAXIMUM_UTF8_BYTES,
          maximumLogicalOutputBytes:
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.byteLength +
            DESCRIPTOR_MAXIMUM_UTF8_BYTES,
          exactOutputFileCount: 33,
        },
      },
      rlimitFsizeSetBeforeExecAndInheritedUnchanged: true,
      rlimitFsizeSoftAndHardLimitsMustBothEqualTheStageLiteral: true,
      preExecKernelReadbackMustEqualConfiguredByteInodeAndRlimitHardLimits: true,
      quotaIdentityFieldsRequired: [
        "writableMountPath",
        "mountId",
        "deviceId",
        "projectId",
        "quotaMechanism",
      ],
      mountDeviceAndProjectIdentityMustRemainStableThroughStageExit: true,
      quotaAndRlimitOverflowAction:
        "kill_active_stage_cgroup_wait_for_populated_zero_and_fail_closed",
      everyStageEnforcementReceiptMustRecordConfiguredLimitsPeaksAndOverflowEvents: true,
      quotaCapabilityBindingSchema:
        "control_plane_evidence_grammar_registry.schemas.quotaCapability",
      quotaCapabilitySha256DomainsByStage: {
        producer:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.producerQuotaCapability,
        verifier:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.verifierQuotaCapability,
        assembler:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.assemblerQuotaCapability,
      },
      quotaCapabilityBindings: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      quotaSetupReceiptBindingSchema:
        "control_plane_evidence_grammar_registry.schemas.quotaSetupReceipt",
      quotaSetupReceiptSha256DomainsByStage: {
        producer:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.producerQuotaSetupReceipt,
        verifier:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.verifierQuotaSetupReceipt,
        assembler:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.assemblerQuotaSetupReceipt,
      },
      quotaSetupReceiptBindings: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      established: false,
    },
    privilege: {
      linuxCapabilitiesAllowed: [],
      dropAllLinuxCapabilitiesRequired: true,
      noNewPrivilegesRequired: true,
      privilegedContainerAllowed: false,
      hostPidIpcUserOrNetworkNamespaceAllowed: false,
    },
    networkAndSeccomp: {
      isolatedNetworkNamespaceRequired: true,
      networkNamespaceAloneSufficient: false,
      loopbackSocketUseAllowed: false,
      seccompProfileRequired: true,
      allowedAndDeniedSyscallSetsMustBeDisjoint: true,
      deterministicCompiledBpfMustBindCompilerSourceToolchainAndPolicy: true,
      genericSocketProbeGrantsLoadedFilterAuthority: false,
      seccompPolicyBindingsByStage: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      seccompLoadReceiptSchema:
        "control_plane_evidence_grammar_registry.schemas.seccompLoadReceipt",
      seccompLoadReceiptSha256DomainsByStage: {
        producer:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.producerSeccompLoadReceipt,
        verifier:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.verifierSeccompLoadReceipt,
        assembler:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .domains.assemblerSeccompLoadReceipt,
      },
      seccompLoadReceiptBindingsByStage: {
        producer: null,
        verifier: null,
        assembler: null,
      },
      runtimeLoadedFilterIdentityAndSeccompModeReadbackRequiredBeforeScientificWork: true,
      socketSyscallsExplicitlyDenied: [
        "socket",
        "socketpair",
        "connect",
        "bind",
        "listen",
        "accept",
        "accept4",
        "sendto",
        "recvfrom",
        "sendmsg",
        "recvmsg",
        "shutdown",
      ],
      dnsIpv4Ipv6UnixAndLoopbackAttemptsMustFail: true,
    },
    schedulerAdmissionLease: {
      required: true,
      minimumHostReserveBytes: 2 * GIB,
      minimumHostReserveGiB: 2,
      issuedBeforeCgroupCreation: true,
      heldUntilAllStageCgroupsEmptyAndFinalSecureRereadComplete: true,
      serializesCompetingScientificRuns: true,
      oneTimeFreeMemorySampleGrantsAuthority: false,
      leaseSchema:
        "control_plane_evidence_grammar_registry.schemas.schedulerLease",
      leaseSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.schedulerLease,
      leaseBinding: null,
    },
    enforcementReceiptSchema:
      "control_plane_evidence_grammar_registry.schemas.stageEnforcementReceipt",
    enforcementReceiptSha256Domains: {
      producer:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.producerEnforcementReceipt,
      verifier:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.verifierEnforcementReceipt,
      assembler:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.assemblerEnforcementReceipt,
    },
    maximumCanonicalUtf8BytesPerEnforcementReceipt:
      ENFORCEMENT_RECEIPT_MAXIMUM_UTF8_BYTES,
    verifierPostExitReceiptClosure: {
      receiptPathForAssemblerReadOnlyInput: VERIFIER_ENFORCEMENT_RECEIPT_PATH,
      maximumCanonicalUtf8Bytes: ENFORCEMENT_RECEIPT_MAXIMUM_UTF8_BYTES,
      receiptSchema:
        "control_plane_evidence_grammar_registry.schemas.stageEnforcementReceipt",
      receiptSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.verifierEnforcementReceipt,
      replayBundleInstanceBindingSchema:
        "control_plane_evidence_grammar_registry.schemas.controlPlaneBinding",
      trustedBrokerIsExclusiveWriter: true,
      createdOnlyAfterVerifierExitAndCgroupPopulatedZero: true,
      mustBindAlreadyClosedReplayBundleSha256AndByteLength: true,
      brokerMayNotRewriteReplayBundle: true,
      assemblerLaunchRequiresReceiptValidation: true,
      finalAdmissionRequiresReceiptAndBundleCrossValidation: true,
      receipt: null,
    },
    stageEnforcementReceipts: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    exactlyThreeStageEnforcementReceiptsRequired: true,
    everyStageReceiptMustBindItsDistinctSourceToolchainInputAndImageLedgers: true,
    everyStageReceiptMustReportCgroupEmptyAfterExit: true,
  },
  rejectedCurrentExecutionSurfaces: {
    hostNodeExecutor: {
      module:
        "server/services/theory/nhm2-external-numerical-kernel-executor.ts",
      callable: "executeNhm2ExternalNumericalKernel",
      maySupplyLedgerFormatOrOutputObservationReference: true,
      mayExecuteThisSeedRun: false,
      grantsOperatingSystemHermeticity: false,
      grantsTreeMemoryProcessThreadOrNetworkEnforcement: false,
      directChildKillOrTimeoutGrantsTreeEmptyReceipt: false,
      acceptedAsCapabilityAuthority: false,
    },
    ambientHostCpython: {
      interpreter: "CPython 3.13.7",
      interpreterLocationClass: "system_installation",
      importedNumpy: "2.2.6_from_user_roaming_site_packages",
      importedScipy: "1.16.1_from_separate_Manim_environment",
      rootUvLockNumpy: "2.3.2",
      rootUvLockScipy: "1.16.3",
      uvCliPresent: false,
      exactTransitiveRuntimeClosureEstablished: false,
      allowedAsProducerRuntime: false,
      allowedAsVerifierRuntime: false,
      allowedAsAssemblerRuntime: false,
    },
  },
  executionState: {
    executionPresent: false,
    launchRequest: null,
    spawnOrCallback: null,
    seedRunRequestBinding: null,
    sourceManifestBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    sourceLedgerBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    toolchainManifestBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    toolchainLedgerBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    producerInputLedgerBinding: null,
    verifierInputLedgerBinding: null,
    assemblerInputLedgerBinding: null,
    producerLaunchEnvelopeBinding: null,
    verifierLaunchEnvelopeBinding: null,
    assemblerLaunchEnvelopeBinding: null,
    capabilityBinding: null,
    seccompPolicyBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    seccompLoadReceiptBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    schedulerLeaseBinding: null,
    absoluteDeadlineReceiptBinding: null,
    quotaCapabilityBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    quotaSetupReceiptBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    crossStageSeparationReceiptBinding: null,
    verifierMpfrGmpRuntimeBinding: null,
    verifierProofKernelBinding: null,
    directoryPreparationReceiptBundleBinding: null,
    observationCaptureReceiptBindings: {
      producer: null,
      verifier: null,
      assembler: null,
    },
    producerClosedOutputObservationBinding: null,
    verifierClosedOutputObservationBinding: null,
    assemblerClosedOutputObservationBinding: null,
    producerEnforcementReceiptBinding: null,
    verifierEnforcementReceiptBinding: null,
    assemblerEnforcementReceiptBinding: null,
    verifierReplayBundleInstanceBinding: null,
    continuousNodelessProofReceipt: null,
    continuousPeakProofReceipt: null,
    numericalOriginSeriesDefectReceipt: null,
    numericalOriginSeriesDefectGatePassed: false,
    finalContainerObservationBinding: null,
    finalProjectionEqualityReceiptBinding: null,
    finalAdmissionReceiptBinding: null,
    outputArtifactBinding: null,
    structurallyAdmissibleDiagnosticSeed: false,
  },
  executionLocks: EXECUTION_LOCKS,
  artifactLocks: ARTIFACT_LOCKS,
  claimLocks: CLAIM_LOCKS,
  claimLockKeys: Object.keys(CLAIM_LOCKS),
  blockers: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BLOCKERS,
  claimBoundary: {
    preregistrationOnly: true,
    executesByItself: false,
    producerOutputHasGateAuthority: false,
    verifierReplayCompleted: false,
    trustedDescriptorAssemblyCompleted: false,
    finalSecureRereadCompleted: false,
    descriptorBundleProjectionEqualityCompleted: false,
    independentReplayCompleted: false,
    numericalOriginSeriesDefectGateEstablished: false,
    newtonianSeedEstablished: false,
    relativisticBranchSolved: false,
    candidateAdmissibilityEstablished: false,
    empiricalValidationEstablished: false,
    physicalSourceRealized: false,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
    routeEtaClaimAllowed: false,
    speedAuthorityClaimAllowed: false,
  },
} as const;

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value as object)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.isFrozen(value) ? value : Object.freeze(value);
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1 =
  deepFreeze(CONTRACT);

const assertInvariants = (): void => {
  const contract = NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1;
  const inventory = contract.outputPolicy.inventory;
  const arrays = inventory.slice(0, -1);
  const descriptor = inventory[inventory.length - 1];
  if (
    contract.bindings.candidatePlanV2.canonicalBinding !==
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING ||
    contract.bindings.branchBvpV1.canonicalBinding !==
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING ||
    contract.bindings.newtonianSeedV1.canonicalBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING ||
    contract.bindings.seedOutputAndProofProtocol
      .outputDescriptorSchemaBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING ||
    contract.bindings.seedOutputAndProofProtocol.proofReplayProtocolBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING ||
    contract.bindings.seedOutputAndProofProtocol
      .verifierReplayBundleSchemaBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING ||
    contract.bindings.seedOutputAndProofProtocol
      .controlPlaneEvidenceGrammarRegistryBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING ||
    contract.controlPlaneEvidenceGrammar.registry !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY ||
    inventory.length !== 33 ||
    arrays.length !== 32 ||
    arrays.some(
      (entry, index) =>
        entry.kind !== "array" ||
        entry.writeOrderIndex !== index ||
        entry.producerWriterStage !== EXECUTION_STAGES[0] ||
        entry.producerDestinationClass !== "staging_only" ||
        entry.finalContainerWriterStage !== EXECUTION_STAGES[2] ||
        entry.relativePath !==
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY[
            index
          ]?.relativePath,
    ) ||
    descriptor?.kind !== "descriptor" ||
    descriptor.writeOrderIndex !== 32 ||
    descriptor.writerStage !== EXECUTION_STAGES[2] ||
    descriptor.producerMayCreate !== false ||
    descriptor.verifierMayCreate !== false ||
    descriptor.relativePath !== SEED_CONTAINER_CLOSURE.descriptorRelativePath ||
    contract.inputClosure.requiredFileCount !== 8 ||
    contract.inputClosure.requiredFilePathOrder !==
      INPUT_REQUIRED_FILE_PATH_ORDER ||
    contract.inputClosure.requiredExplicitDirectoryPathOrder.length !== 0 ||
    contract.inputClosure
      .futureVerifierOrAssemblerInputLedgerDigestMayAppearInRunRequest !==
      false ||
    contract.stageClosures.producer.requiredInputFileCount !== 8 ||
    contract.stageClosures.producer.requiredInputFilePathOrder !==
      PRODUCER_STAGE_INPUT_FILE_PATH_ORDER ||
    contract.stageClosures.producer.requiredExplicitDirectoryPathOrder
      .length !== 0 ||
    contract.stageClosures.verifier.requiredInputFileCount !== 40 ||
    contract.stageClosures.verifier.requiredInputFilePathOrder !==
      VERIFIER_STAGE_INPUT_FILE_PATH_ORDER ||
    contract.stageClosures.verifier.requiredExplicitDirectoryPathOrder !==
      VERIFIER_STAGE_INPUT_DIRECTORY_PATH_ORDER ||
    contract.stageClosures.assembler.requiredInputFileCount !== 42 ||
    contract.stageClosures.assembler.requiredInputFilePathOrder !==
      ASSEMBLER_STAGE_INPUT_FILE_PATH_ORDER ||
    contract.stageClosures.assembler.requiredExplicitDirectoryPathOrder !==
      ASSEMBLER_STAGE_INPUT_DIRECTORY_PATH_ORDER ||
    contract.stageClosures.crossStageIsolation.established !== false ||
    contract.stageInputLedgerAndLaunchEnvelopePolicy
      .verifierInputLedgerBinding !== null ||
    contract.stageInputLedgerAndLaunchEnvelopePolicy
      .assemblerLaunchEnvelopeBinding !== null ||
    contract.stageSequence.exactStageOrder !== EXECUTION_STAGES ||
    contract.stageSequence.finalAdmission.accepted !== false ||
    !contract.outputPolicy.descriptorLast ||
    contract.outputPolicy.seedContainerClosure !== SEED_CONTAINER_CLOSURE ||
    contract.outputPolicy.expectedFilePathOrder !==
      SEED_CONTAINER_CLOSURE.requiredFilePathOrder ||
    contract.outputPolicy.expectedDirectories !==
      SEED_CONTAINER_CLOSURE.requiredExplicitDirectoryPathOrder ||
    contract.outputPolicy.producerStaging.exactFileCount !== 32 ||
    contract.outputPolicy.producerStaging.descriptorPathMustNotExist !==
      SEED_CONTAINER_CLOSURE.descriptorRelativePath ||
    contract.outputPolicy.directoryPreparationPolicy.established !== false ||
    contract.outputPolicy.secureFileObservationProtocol.passed !== false ||
    contract.outputPolicy.verifierReplay.schema !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA ||
    contract.outputPolicy.verifierReplay.schemaBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VERIFIER_REPLAY_BUNDLE_SCHEMA_BINDING ||
    contract.outputPolicy.verifierReplay.maximumCanonicalUtf8Bytes !==
      16_777_216 ||
    contract.outputPolicy.verifierReplay.instanceBinding !== null ||
    contract.outputPolicy.trustedFinalAssembly.exactFileCount !== 33 ||
    contract.outputPolicy.trustedFinalAssembly.admitted !== false ||
    contract.outputPolicy.exactArrayByteLength !== 6_482_304 ||
    contract.isolatedWorkerCapabilityRequirements.cgroupV2
      .maximumAggregateChargedMemoryBytes !== 805_306_368 ||
    contract.isolatedWorkerCapabilityRequirements.cgroupV2
      .maximumContainedPidsAndTasks !== 1 ||
    contract.isolatedWorkerCapabilityRequirements.wallLimit
      .maximumWallMilliseconds !== 1_800_000 ||
    contract.isolatedWorkerCapabilityRequirements.schedulerAdmissionLease
      .minimumHostReserveBytes !== 2_147_483_648 ||
    contract.isolatedWorkerCapabilityRequirements.absoluteMonotonicDeadline
      .established !== false ||
    contract.isolatedWorkerCapabilityRequirements
      .kernelWritableMountQuotaAndFileSizePolicy.established !== false ||
    contract.observationCapturePolicy.perStage.producer.maximumStdoutBytes !==
      1_048_576 ||
    contract.observationCapturePolicy.perStage.assembler
      .maximumCombinedCaptureAndFilesystemOutputBytes !== 25_356_672 ||
    Object.values(contract.observationCapturePolicy.receiptBindings).some(
      (value) => value !== null,
    ) ||
    Object.keys(
      contract.isolatedWorkerCapabilityRequirements.stageEnforcementReceipts,
    ).length !== 3 ||
    contract.isolatedWorkerCapabilityRequirements.capabilityPresent !== false ||
    contract.executionState.executionPresent !== false ||
    contract.executionState.outputArtifactBinding !== null ||
    contract.executionState.numericalOriginSeriesDefectReceipt !== null ||
    contract.executionState.directoryPreparationReceiptBundleBinding !== null ||
    contract.executionState.verifierEnforcementReceiptBinding !== null ||
    contract.executionState.verifierReplayBundleInstanceBinding !== null ||
    contract.executionState.assemblerEnforcementReceiptBinding !== null ||
    contract.executionState.finalProjectionEqualityReceiptBinding !== null ||
    contract.executionState.finalAdmissionReceiptBinding !== null ||
    contract.producerIndependentAcceptanceReplay.accepted !== false ||
    Object.values(contract.executionLocks).some((value) => value !== false) ||
    Object.values(contract.artifactLocks).some((value) => value !== false) ||
    Object.values(contract.claimLocks).some((value) => value !== false) ||
    contract.claimLockKeys.length !== Object.keys(contract.claimLocks).length
  ) {
    throw new Error(
      "nhm2_prolate_boson_star_newtonian_seed_run_plan_v1_invariant_violation",
    );
  }
};

assertInvariants();

export type Nhm2ProlateBosonStarNewtonianSeedRunPlanV1 =
  typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1;

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
type SnapshotBudget = {
  visitedNodes: number;
  totalStringUtf8Bytes: number;
  totalPropertyNameUtf8Bytes: number;
};

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  depth = 0,
  budget: SnapshotBudget = {
    visitedNodes: 0,
    totalStringUtf8Bytes: 0,
    totalPropertyNameUtf8Bytes: 0,
  },
): SnapshotResult => {
  const limits =
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  }
  budget.visitedNodes += 1;
  if (budget.visitedNodes > limits.maximumNodes) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_node_limit:${pointer || "/"}`,
    });
  }
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "string") {
    if (value.length > limits.maximumStringCodeUnits) {
      return Object.freeze({
        ok: false,
        violation: `string_code_unit_limit:${pointer || "/"}`,
      });
    }
    const utf8Bytes = Buffer.byteLength(value, "utf8");
    budget.totalStringUtf8Bytes += utf8Bytes;
    return utf8Bytes <= limits.maximumStringUtf8Bytes &&
      budget.totalStringUtf8Bytes <= limits.maximumTotalStringUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation:
            utf8Bytes > limits.maximumStringUtf8Bytes
              ? `string_byte_length_limit:${pointer || "/"}`
              : `total_string_byte_length_limit:${pointer || "/"}`,
        });
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_number:${pointer || "/"}`,
        });
  }
  if (typeof value !== "object") {
    return Object.freeze({
      ok: false,
      violation: `non_json_value:${pointer || "/"}`,
    });
  }
  if (ancestors.has(value)) {
    return Object.freeze({
      ok: false,
      violation: `cyclic_value:${pointer || "/"}`,
    });
  }
  ancestors.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      return Object.freeze({
        ok: false,
        violation: `non_plain_array:${pointer || "/"}`,
      });
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    const length =
      lengthDescriptor && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (!Number.isSafeInteger(length) || length < 0) {
      return Object.freeze({
        ok: false,
        violation: `array_length:${pointer || "/"}`,
      });
    }
    if (length > limits.maximumArrayLength) {
      return Object.freeze({
        ok: false,
        violation: `array_length_limit:${pointer || "/"}`,
      });
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) {
      return Object.freeze({
        ok: false,
        violation: `symbol_key:${pointer || "/"}`,
      });
    }
    const indexKeys = (keys as string[]).filter((key) => key !== "length");
    if (
      keys.length !== length + 1 ||
      indexKeys.length !== length ||
      indexKeys.some((key) => {
        if (!/^(0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index < 0 || index >= length;
      })
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_surface:${pointer || "/"}`,
      });
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        !descriptor ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return Object.freeze({
          ok: false,
          violation: `array_entry_surface:${pointer}/${index}`,
        });
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        depth + 1,
        budget,
      );
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    ancestors.delete(value);
    return Object.freeze({ ok: true, value: output });
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return Object.freeze({
      ok: false,
      violation: `non_plain_object:${pointer || "/"}`,
    });
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    return Object.freeze({
      ok: false,
      violation: `symbol_key:${pointer || "/"}`,
    });
  }
  if (keys.length > limits.maximumObjectPropertyCount) {
    return Object.freeze({
      ok: false,
      violation: `object_property_count_limit:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    if (key.length > limits.maximumPropertyNameCodeUnits) {
      return Object.freeze({
        ok: false,
        violation: `property_name_code_unit_limit:${pointer || "/"}`,
      });
    }
    const keyUtf8Bytes = Buffer.byteLength(key, "utf8");
    budget.totalPropertyNameUtf8Bytes += keyUtf8Bytes;
    if (
      keyUtf8Bytes > limits.maximumPropertyNameUtf8Bytes ||
      budget.totalPropertyNameUtf8Bytes >
        limits.maximumTotalPropertyNameUtf8Bytes
    ) {
      return Object.freeze({
        ok: false,
        violation:
          keyUtf8Bytes > limits.maximumPropertyNameUtf8Bytes
            ? `property_name_byte_length_limit:${pointer || "/"}`
            : `total_property_name_byte_length_limit:${pointer || "/"}`,
      });
    }
    if (FORBIDDEN_KEYS.has(key)) {
      return Object.freeze({
        ok: false,
        violation: `forbidden_key:${pointer}/${key}`,
      });
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      !descriptor ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return Object.freeze({
        ok: false,
        violation: `object_property_surface:${pointer}/${key}`,
      });
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      depth + 1,
      budget,
    );
    if (!nested.ok) return nested;
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  ancestors.delete(value);
  return Object.freeze({ ok: true, value: output });
};

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_JSON =
  canonicalJson(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-run-plan/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_EXPECTED_SHA256 =
  "3facc28fc62c9515a4c751f47ac9b6d90ab1179216d3d7c29c2a37b48e7e8f41" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  261169 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_run_plan_v1_canonical_binding_drift",
  );
}
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING =
  Object.freeze({
    artifactId: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_ARTIFACT_ID,
    contractVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTRACT_VERSION,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256_DOMAIN,
    sha256: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_SIZE_BYTES,
  });

const EXPECTED_CANONICAL_JSON =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CANONICAL_JSON;

export const nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1) return [];
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["seed_run_plan_v1_plain_data_snapshot_invalid"];
  }
  if (snapshot.ok === false) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["seed_run_plan_v1_external_copy_not_authoritative"]
      : ["seed_run_plan_v1_semantic_mismatch"];
  } catch {
    return ["seed_run_plan_v1_plain_data_snapshot_invalid"];
  }
};

export const isNhm2ProlateBosonStarNewtonianSeedRunPlanV1 = (
  value: unknown,
): value is Nhm2ProlateBosonStarNewtonianSeedRunPlanV1 =>
  nhm2ProlateBosonStarNewtonianSeedRunPlanV1Violations(value).length === 0;
