import { createHash } from "node:crypto";

import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BASE_INPUT_PROFILE,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
} from "./nhm2-prolate-boson-star-newtonian-seed-run-plan.v1";

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ARTIFACT_ID =
  "nhm2.prolate_boson_star_newtonian_seed_run_plan" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CONTRACT_VERSION =
  "nhm2_prolate_boson_star_newtonian_seed_run_plan/v2" as const;

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

const EXPECTED_PREDECESSOR_V1_BINDING = Object.freeze({
  artifactId: "nhm2.prolate_boson_star_newtonian_seed_run_plan",
  contractVersion: "nhm2_prolate_boson_star_newtonian_seed_run_plan/v1",
  sha256Domain: "nhm2-prolate-boson-star-newtonian-seed-run-plan/v1\n",
  sha256: "3facc28fc62c9515a4c751f47ac9b6d90ab1179216d3d7c29c2a37b48e7e8f41",
  canonicalSizeBytes: 261169,
});

if (
  canonicalJson(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
  ) !== canonicalJson(EXPECTED_PREDECESSOR_V1_BINDING)
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_run_plan_v2_predecessor_binding_drift",
  );
}

const MIB = 1024 * 1024;
const STAGES = Object.freeze([
  "untrusted_seed_producer",
  "trusted_independent_verifier",
  "trusted_descriptor_assembler",
] as const);
const LEVEL_IDS = Object.freeze(["L0", "L1", "L2", "AUDIT"] as const);
const ROLE_STEMS = Object.freeze([
  "rho_nodes",
  "theta_nodes",
  "base_scalar_u0",
  "base_potential_V0",
  "target_scalar_u_A",
  "target_potential_V_A",
  "multipole_scalar_odd",
  "multipole_potential_even",
] as const);
const STAGING_RELATIVE_ARRAY_PATHS = Object.freeze(
  LEVEL_IDS.flatMap((levelId) =>
    ROLE_STEMS.map(
      (stem, roleIndex) =>
        `arrays/${levelId}/${String(roleIndex).padStart(2, "0")}-${stem}.f64le`,
    ),
  ),
);
const STAGING_ABSOLUTE_ARRAY_PATHS = Object.freeze(
  STAGING_RELATIVE_ARRAY_PATHS.map((path) => `/run/staging/${path}`),
);
const BASE_INPUT_RELATIVE_PATHS = Object.freeze([
  "00-seed-run-request.v1.json",
  "01-candidate-plan-v2.canonical.json",
  "02-branch-bvp-v1.canonical.json",
  "03-newtonian-seed-v1.canonical.json",
  "04-proof-replay-protocol.v1.canonical.json",
  "05-output-descriptor-schema.v1.canonical.json",
  "06-verifier-replay-bundle-schema.v1.canonical.json",
  "07-control-plane-evidence-grammar-registry.v1.canonical.json",
] as const);
const BASE_INPUT_ABSOLUTE_PATHS = Object.freeze(
  BASE_INPUT_RELATIVE_PATHS.map((path) => `/run/input/${path}`),
);
const VERIFIER_REPLAY_BUNDLE_PATH =
  "/run/replay/seed-verifier-replay-bundle.canonical.json" as const;
const VERIFIER_ENFORCEMENT_RECEIPT_PATH =
  "/run/attestation/verifier-stage-enforcement-receipt.canonical.json" as const;
const VERIFIER_BROKER_CHANNEL_PATH =
  "/run/broker-channel/verifier-runtime-evidence.canonical.json" as const;
const ASSEMBLER_BROKER_CHANNEL_PATH =
  "/run/broker-channel/assembler-runtime-evidence.canonical.json" as const;

const CONTROL_PLANE_BINDING_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
    .schemas.controlPlaneBinding;
const FILE_OBSERVATION_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
    .schemas.fileObservation;
const ABSOLUTE_DEADLINE_RECEIPT_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
    .schemas.absoluteDeadlineReceipt;

const SECURE_STAGING_OBSERVATION_CLOSURE_SCHEMA = deepFreeze({
  kind: "object",
  exactKeys: [
    "schemaVersion",
    "producerEnforcementReceiptBinding",
    "stagingPrestateReceiptBinding",
    "clockId",
    "observationStartMonotonicNanoseconds",
    "observationEndMonotonicNanoseconds",
    "arrayObservations",
    "allPassed",
  ],
  extraKeysAllowed: false,
  fields: {
    schemaVersion:
      "literal_nhm2.prolate_boson_star.newtonian_seed.secure_staging_observation_closure/v1",
    producerEnforcementReceiptBinding:
      "control_plane_binding:producerEnforcementReceipt",
    stagingPrestateReceiptBinding:
      "control_plane_binding:stagingPrestateReceipt",
    clockId: "literal_CLOCK_MONOTONIC_RAW",
    observationStartMonotonicNanoseconds:
      "canonical_unsigned_decimal_string",
    observationEndMonotonicNanoseconds: "canonical_unsigned_decimal_string",
    arrayObservations: {
      kind: "tuple",
      exactLength: 32,
      exactAbsolutePathOrder: STAGING_ABSOLUTE_ARRAY_PATHS,
      itemSchema: "fileObservation",
    },
    allPassed: "literal_true",
  },
  crossFieldInvariants: [
    "arrayObservations_equal_the_trusted_broker_post_producer_secure_reread_tuples_in_exact_imported_inventory_order",
    "every_observation_uses_openat2_RESOLVE_BENEATH_NO_SYMLINKS_NO_MAGICLINKS_NO_XDEV_regular_file_link_count_one_and_exact_EOF",
    "observationStart_is_not_after_observationEnd_and_both_are_before_verifier_channel_seal",
  ],
});

const CLOSED_STAGE_OUTPUT_OBSERVATION_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
    .schemas.closedStageOutputObservation;

const COMMON_RUN_REQUEST_EXACT_KEYS = Object.freeze([
  ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
    .schemas.seedRunRequest.exactKeys,
]);

const FORBIDDEN_COMMON_RUN_REQUEST_FUTURE_EVIDENCE_KEYS = Object.freeze([
  "absoluteDeadlineReceipt",
  "absoluteDeadlineReceiptBinding",
  "directoryPrestateReceipt",
  "directoryPrestateReceiptBinding",
  "quotaSetupReceipt",
  "quotaSetupReceiptBinding",
  "brokerRuntimeChannel",
  "brokerRuntimeChannelBinding",
  "stageInputLedgerBinding",
  "stageLaunchEnvelopeBinding",
  "closedStageOutputObservation",
  "closedStageOutputObservationBinding",
  "stageEnforcementReceipt",
  "stageEnforcementReceiptBinding",
  "verifierReplayBundleBinding",
  "finalDescriptorBinding",
  "finalContainerObservationBinding",
] as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.verifier_runtime_channel_schema",
    schemaVersion:
      "nhm2.prolate_boson_star.newtonian_seed.verifier_runtime_channel_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV1Binding",
        "runtimeChannelSchemaRegistryBinding",
        "commonRunRequestBinding",
        "channelSchemaBinding",
        "absoluteDeadlineReceipt",
        "absoluteDeadlineReceiptBinding",
        "replayPrestateReceiptBinding",
        "verifierQuotaSetupReceiptBinding",
        "verifierInputLedgerBinding",
        "secureStagingObservationClosure",
        "typedInterpreterBinding",
        "clockId",
        "channelAssemblyStartMonotonicNanoseconds",
        "channelSealMonotonicNanoseconds",
      ],
      extraKeysAllowed: false,
      fieldTypes: {
        schemaVersion:
          "literal_nhm2.prolate_boson_star.newtonian_seed.verifier_runtime_channel/v1",
        successorRunPlanBinding: "authoritative_successor_run_plan_binding",
        predecessorRunPlanV1Binding:
          "authoritative_predecessor_v1_binding",
        runtimeChannelSchemaRegistryBinding:
          "authoritative_successor_runtime_channel_schema_registry_binding",
        commonRunRequestBinding: "control_plane_binding:commonRunRequest",
        channelSchemaBinding:
          "authoritative_verifier_runtime_channel_schema_binding",
        absoluteDeadlineReceipt: "absoluteDeadlineReceipt",
        absoluteDeadlineReceiptBinding:
          "control_plane_binding:absoluteDeadlineReceipt",
        replayPrestateReceiptBinding:
          "control_plane_binding:replayPrestateReceipt",
        verifierQuotaSetupReceiptBinding:
          "control_plane_binding:verifierQuotaSetupReceipt",
        verifierInputLedgerBinding:
          "control_plane_binding:verifierInputLedger",
        secureStagingObservationClosure: "secureStagingObservationClosure",
        typedInterpreterBinding:
          "control_plane_binding:closedSchemaTypedInterpreter",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        channelAssemblyStartMonotonicNanoseconds:
          "canonical_unsigned_decimal_string",
        channelSealMonotonicNanoseconds: "canonical_unsigned_decimal_string",
      },
      crossFieldInvariants: [
        "absoluteDeadlineReceiptBinding_recomputes_from_the_exact_embedded_canonical_absoluteDeadlineReceipt_bytes",
        "common_request_predecessor_runtime_channel_schema_registry_deadline_prestate_quota_input_ledger_and_interpreter_bindings_all_resolve_to_one_run_and_verifier_stage",
        "secureStagingObservationClosure_contains_exactly_32_broker_observations_and_no_producer_summary_or_descriptor",
        "verifierInputLedger_is_already_closed_before_channelAssemblyStart",
        "channelAssemblyStart_is_not_after_channelSeal_and_channelSeal_is_strictly_before_verifier_launch",
        "the_channel_contains_no_channel_instance_binding_self_hash_or_future_enforcement_receipt_binding",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.assembler_runtime_channel_schema",
    schemaVersion:
      "nhm2.prolate_boson_star.newtonian_seed.assembler_runtime_channel_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV1Binding",
        "runtimeChannelSchemaRegistryBinding",
        "commonRunRequestBinding",
        "channelSchemaBinding",
        "absoluteDeadlineReceiptBinding",
        "attestationPrestateReceiptBinding",
        "finalOutputPrestateReceiptBinding",
        "assemblerQuotaSetupReceiptBinding",
        "verifierClosedOutputObservation",
        "verifierClosedOutputObservationBinding",
        "freshVerifierEnforcementReceiptObservation",
        "verifierEnforcementReceiptBinding",
        "verifierReplayBundleBinding",
        "replayBundleRawSha256",
        "replayBundleCanonicalSizeBytes",
        "assemblerInputLedgerBinding",
        "typedInterpreterBinding",
        "clockId",
        "channelAssemblyStartMonotonicNanoseconds",
        "channelSealMonotonicNanoseconds",
      ],
      extraKeysAllowed: false,
      fieldTypes: {
        schemaVersion:
          "literal_nhm2.prolate_boson_star.newtonian_seed.assembler_runtime_channel/v1",
        successorRunPlanBinding: "authoritative_successor_run_plan_binding",
        predecessorRunPlanV1Binding:
          "authoritative_predecessor_v1_binding",
        runtimeChannelSchemaRegistryBinding:
          "authoritative_successor_runtime_channel_schema_registry_binding",
        commonRunRequestBinding: "control_plane_binding:commonRunRequest",
        channelSchemaBinding:
          "authoritative_assembler_runtime_channel_schema_binding",
        absoluteDeadlineReceiptBinding:
          "control_plane_binding:absoluteDeadlineReceipt",
        attestationPrestateReceiptBinding:
          "control_plane_binding:attestationPrestateReceipt",
        finalOutputPrestateReceiptBinding:
          "control_plane_binding:finalOutputPrestateReceipt",
        assemblerQuotaSetupReceiptBinding:
          "control_plane_binding:assemblerQuotaSetupReceipt",
        verifierClosedOutputObservation: "closedStageOutputObservation",
        verifierClosedOutputObservationBinding:
          "control_plane_binding:verifierClosedOutputObservation",
        freshVerifierEnforcementReceiptObservation: "fileObservation",
        verifierEnforcementReceiptBinding:
          "control_plane_binding:verifierSuccessorEnforcementReceipt",
        verifierReplayBundleBinding:
          "control_plane_binding:verifierReplayBundleInstance",
        replayBundleRawSha256: "plain_lowercase_hex_sha256_of_raw_bytes",
        replayBundleCanonicalSizeBytes: "safe_positive_integer",
        assemblerInputLedgerBinding:
          "control_plane_binding:assemblerSuccessorInputLedger",
        typedInterpreterBinding:
          "control_plane_binding:closedSchemaTypedInterpreter",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        channelAssemblyStartMonotonicNanoseconds:
          "canonical_unsigned_decimal_string",
        channelSealMonotonicNanoseconds: "canonical_unsigned_decimal_string",
      },
      crossFieldInvariants: [
        "successor_predecessor_runtime_channel_schema_registry_common_request_deadline_prestate_quota_input_ledger_and_interpreter_bindings_all_resolve_to_one_run_and_assembler_stage",
        "verifierClosedOutputObservationBinding_recomputes_from_the_exact_embedded_canonical_closed_output_observation_bytes",
        "verifierClosedOutputObservation_is_for_trusted_independent_verifier_/run/replay_one_file_and_closes_the_exact_replay_bundle_observation",
        "freshVerifierEnforcementReceiptObservation.absolutePath_is_/run/attestation/verifier-stage-enforcement-receipt.canonical.json_and_is_not_reused_from_any_prior_ledger_ordinal",
        "fresh_receipt_raw_bytes_equal_the_typed_interpreter_recanonicalized_UTF8_exactly;_freshVerifierEnforcementReceiptObservation.sha256_equals_plain_SHA256_of_those_raw_bytes;_its_byteLength_equals_the_raw_byte_length_and_verifierEnforcementReceiptBinding.canonicalSizeBytes;_and_verifierEnforcementReceiptBinding.sha256_equals_SHA256_of_its_registered_domain_UTF8_concatenated_with_the_same_raw_bytes",
        "replay_raw_bytes_equal_the_schema_validated_recanonicalized_UTF8_exactly;_replayBundleRawSha256_equals_plain_SHA256_of_those_raw_bytes;_replayBundleCanonicalSizeBytes_equals_the_raw_byte_length_and_verifierReplayBundleBinding.canonicalSizeBytes;_and_verifierReplayBundleBinding.sha256_equals_SHA256_of_its_registered_domain_UTF8_concatenated_with_the_same_raw_bytes",
        "replayBundleRawSha256_and_replayBundleCanonicalSizeBytes_equal_the_closed_output_file_observation_and_the_assembler_input_ledger_observation_without_reusing_the_plain_digest_as_the_domain_separated_digest",
        "assemblerInputLedger_is_already_closed_before_channelAssemblyStart",
        "channelAssemblyStart_is_not_after_channelSeal_and_channelSeal_is_strictly_before_assembler_launch",
        "the_channel_contains_no_channel_instance_binding_self_hash_or_future_assembler_enforcement_receipt_binding",
      ],
    },
  } as const);

const PREDECESSOR_STAGE_INPUT_LEDGER_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
    .schemas.stageInputLedger;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.assembler_successor_input_ledger_schema",
    schemaVersion:
      "nhm2.prolate_boson_star.newtonian_seed.assembler_successor_input_ledger_schema/v1",
    topLevel: {
      ...PREDECESSOR_STAGE_INPUT_LEDGER_SCHEMA,
      exactKeys: [
        ...PREDECESSOR_STAGE_INPUT_LEDGER_SCHEMA.exactKeys,
        "predecessorRunPlanV1Binding",
      ],
      fields: {
        ...PREDECESSOR_STAGE_INPUT_LEDGER_SCHEMA.fields,
        schemaVersion: {
          kind: "literal",
          value:
            "nhm2.prolate_boson_star.newtonian_seed.assembler_successor_input_ledger/v1",
        },
        stageId: {
          kind: "literal",
          value: "trusted_descriptor_assembler",
        },
        runPlanBinding: {
          kind: "authoritative_literal_binding",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING",
        },
        ledgerSha256Domain: {
          kind: "literal",
          value:
            "nhm2-prolate-boson-star-newtonian-seed-assembler-successor-input-ledger/v1\n",
        },
        requiredFileCount: { kind: "literal", value: 42 },
        requiredFilePathOrder: {
          kind: "literal_tuple",
          values: [
            ...BASE_INPUT_ABSOLUTE_PATHS,
            ...STAGING_ABSOLUTE_ARRAY_PATHS,
            VERIFIER_REPLAY_BUNDLE_PATH,
            VERIFIER_ENFORCEMENT_RECEIPT_PATH,
          ],
          extraEntriesAllowed: false,
        },
        fileObservations: {
          kind: "tuple",
          exactLength: 42,
          itemSchema: "inheritedV1.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        priorStageReceiptBindings: {
          kind: "exact_named_binding_tuple",
          exactNameAndProfileOrder: [
            [
              "producer_enforcement_receipt_binding",
              "inheritedV1.artifactBindingProfiles.producerEnforcementReceipt",
            ],
            [
              "verifier_enforcement_receipt_binding",
              "verifierSuccessorEnforcementReceipt",
            ],
            [
              "verifier_replay_bundle_binding",
              "inheritedV1.artifactBindingProfiles.verifierReplayBundleInstance",
            ],
            [
              "final_output_prestate_receipt_binding",
              "inheritedV1.artifactBindingProfiles.finalOutputPrestateReceipt",
            ],
          ],
          extraEntriesAllowed: false,
        },
        predecessorRunPlanV1Binding: {
          kind: "authoritative_literal_binding",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
        },
      },
      crossFieldInvariants: [
        "the_first_8_fileObservations_recursively_equal_the_exact_inherited_v1_base_input_profile_and_fileObservations[0]_recomputes_the_v1_common_run_request_binding",
        "fileObservations[8..39]_recursively_equal_the_exact_32_broker_closed_staging_observations_with_no_new_contextual_hashing",
        "fileObservations[40]_recursively_equals_the_verifier_closed_output_replay_bundle_observation",
        "fileObservations[41]_is_a_fresh_secure_observation_of_the_raw_canonical_successor_verifier_enforcement_receipt_and_is_not_reused_from_any_prior_ledger_ordinal",
        "the_exact_receipt_raw_bytes_equal_typed_recanonicalized_UTF8;_fileObservations[41].sha256_equals_plain_SHA256_of_those_raw_bytes;_its_byteLength_equals_the_raw_byte_length_and_verifierSuccessorEnforcementReceipt.canonicalSizeBytes;_and_the_receipt_binding_sha256_equals_SHA256_of_its_registered_domain_UTF8_concatenated_with_the_same_raw_bytes",
        "requiredFileCount_requiredFilePathOrder_and_fileObservations_have_exact_length_42_and_no_channel_path_or_future_channel_binding_is_present",
        "quotaSetupReceiptBinding_is_closed_after_final_output_root_prestate_and_before_this_ledger",
      ],
    },
  } as const);

const PREDECESSOR_STAGE_LAUNCH_ENVELOPE_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
    .schemas.stageLaunchEnvelope;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.successor_launch_envelope_schema",
    schemaVersion:
      "nhm2.prolate_boson_star.newtonian_seed.successor_launch_envelope_schema/v1",
    topLevel: {
      ...PREDECESSOR_STAGE_LAUNCH_ENVELOPE_SCHEMA,
      exactKeys: [
        ...PREDECESSOR_STAGE_LAUNCH_ENVELOPE_SCHEMA.exactKeys,
        "predecessorRunPlanV1Binding",
        "runtimeChannelSchemaRegistryBinding",
        "channelAbsolutePath",
        "channelSchemaBinding",
        "channelInstanceBinding",
        "channelObservation",
        "channelObservationBinding",
        "typedInterpreterBinding",
        "clockId",
        "channelObservationEndMonotonicNanoseconds",
        "launchEnvelopeSealMonotonicNanoseconds",
      ],
      fields: {
        ...PREDECESSOR_STAGE_LAUNCH_ENVELOPE_SCHEMA.fields,
        schemaVersion: {
          kind: "literal",
          value:
            "nhm2.prolate_boson_star.newtonian_seed.successor_launch_envelope/v1",
        },
        runPlanBinding: {
          kind: "authoritative_literal_binding",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING",
        },
        inputLedgerBinding: {
          kind: "binding_profile_by_successor_stage",
          profileSource: "successorStageProfiles.inputLedgerBindingProfile",
        },
        predecessorRunPlanV1Binding: {
          kind: "authoritative_literal_binding",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING",
        },
        runtimeChannelSchemaRegistryBinding: {
          kind: "authoritative_literal_binding",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING",
        },
        channelAbsolutePath: {
          kind: "literal_by_successor_stage_profile",
        },
        channelSchemaBinding: {
          kind: "authoritative_literal_binding_by_successor_stage_profile",
        },
        channelInstanceBinding: {
          kind: "binding_profile_by_successor_stage",
          profileSource: "successorStageProfiles.channelInstanceBindingProfile",
        },
        channelObservation: {
          kind: "schema_reference",
          source: "inheritedV1.schemas.fileObservation",
        },
        channelObservationBinding: {
          kind: "binding_profile_by_successor_stage",
          profileSource:
            "successorStageProfiles.channelObservationBindingProfile",
        },
        typedInterpreterBinding: {
          kind: "binding_profile",
          profile: "closedSchemaTypedInterpreter",
        },
        clockId: { kind: "literal", value: "CLOCK_MONOTONIC_RAW" },
        channelObservationEndMonotonicNanoseconds: {
          kind: "primitive",
          source: "inheritedV1.primitives.canonicalUnsignedDecimal",
        },
        launchEnvelopeSealMonotonicNanoseconds: {
          kind: "primitive",
          source: "inheritedV1.primitives.canonicalUnsignedDecimal",
        },
      },
      crossFieldInvariants: [
        "all_predecessor_launch_envelope_binding_profile_mount_resource_source_toolchain_capability_seccomp_quota_deadline_and_observation_constraints_remain_required_except_runPlanBinding_inputLedgerBinding_and_exactInvocationSha256_resolve_under_this_successor",
        "channelAbsolutePath_channelSchemaBinding_channelInstanceBinding_and_channelObservationBinding_equal_the_exact_successor_stage_profile",
        "the_channel_observation_has_contextual_position_40_for_verifier_and_42_for_assembler_and_is_the_only_launch_visible_observation_after_the_exact_40_or_42_entry_pre_channel_input_ledger",
        "channel_raw_bytes_equal_the_typed_interpreter_recanonicalized_UTF8_exactly;_channelObservation.sha256_equals_plain_SHA256_of_those_raw_bytes;_channelObservation.byteLength_equals_the_raw_byte_length_and_channelInstanceBinding.canonicalSizeBytes;_and_channelInstanceBinding.sha256_equals_SHA256_of_its_registered_domain_UTF8_concatenated_with_the_same_raw_bytes",
        "channelObservationBinding_recomputes_from_the_exact_schema_validated_channelObservation_canonical_bytes_under_the_stage_observation_domain",
        "inputLedgerBinding_was_closed_before_channel_seal_and_the_channel_embeds_that_exact_binding_but_contains_no_launchEnvelopeBinding",
        "typedInterpreterBinding_recursively_equals_the_binding_embedded_in_the_channel_and_is_required_to_validate_both_channel_and_envelope_before_hash_authority",
        "channelObservationEnd_is_not_after_launchEnvelopeSeal_and_launchEnvelopeSeal_is_strictly_before_exec",
        "the_envelope_contains_no_future_pre_exec_revalidation_timestamp;_provider_policy_requires_that_future_action_and_only_the_post_exit_successor_enforcement_receipt_may_observe_and_bind_its_timestamp_and_recursive_identity_result",
        "exactInvocationSha256_recomputes_from_the_v2_invocation_including_the_exact_--broker-runtime-evidence_path_pair",
      ],
    },
  } as const);

const PREDECESSOR_STAGE_ENFORCEMENT_RECEIPT_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
    .schemas.stageEnforcementReceipt;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.successor_enforcement_receipt_schema",
    schemaVersion:
      "nhm2.prolate_boson_star.newtonian_seed.successor_enforcement_receipt_schema/v1",
    topLevel: {
      ...PREDECESSOR_STAGE_ENFORCEMENT_RECEIPT_SCHEMA,
      exactKeys: [
        ...PREDECESSOR_STAGE_ENFORCEMENT_RECEIPT_SCHEMA.exactKeys,
        "predecessorRunPlanV1Binding",
        "runtimeChannelSchemaRegistryBinding",
        "channelSchemaBinding",
        "channelInstanceBinding",
        "channelLaunchObservationBinding",
        "typedInterpreterBinding",
        "channelPreExecObservation",
        "channelBootstrapReadObservation",
        "channelPostExitObservation",
        "channelReadOnlyMountHeldThroughCgroupEmpty",
        "brokerWriterAndWritableAliasCount",
        "channelNamespaceMutationCount",
        "channelPreExecRevalidationMonotonicNanoseconds",
        "channelBootstrapReadMonotonicNanoseconds",
        "channelPostExitObservationMonotonicNanoseconds",
      ],
      fieldTypes: {
        ...PREDECESSOR_STAGE_ENFORCEMENT_RECEIPT_SCHEMA.fieldTypes,
        schemaVersion:
          "literal_nhm2.prolate_boson_star.newtonian_seed.successor_enforcement_receipt/v1",
        runPlanBinding: "authoritative_successor_run_plan_binding",
        launchEnvelopeBinding:
          "successor_stage_launch_envelope_binding_by_stage_profile",
        predecessorRunPlanV1Binding:
          "authoritative_predecessor_v1_binding",
        runtimeChannelSchemaRegistryBinding:
          "authoritative_successor_runtime_channel_schema_registry_binding",
        channelSchemaBinding:
          "authoritative_channel_schema_binding_by_stage_profile",
        channelInstanceBinding:
          "channel_instance_binding_by_stage_profile",
        channelLaunchObservationBinding:
          "channel_observation_binding_by_stage_profile",
        typedInterpreterBinding:
          "closed_schema_typed_interpreter_binding",
        channelPreExecObservation: "inheritedV1.schemas.fileObservation",
        channelBootstrapReadObservation:
          "inheritedV1.schemas.fileObservation",
        channelPostExitObservation: "inheritedV1.schemas.fileObservation",
        channelReadOnlyMountHeldThroughCgroupEmpty:
          "literal_true_for_admission",
        brokerWriterAndWritableAliasCount:
          "literal_0_for_admission",
        channelNamespaceMutationCount: "literal_0_for_admission",
        channelPreExecRevalidationMonotonicNanoseconds:
          "canonicalUnsignedDecimal",
        channelBootstrapReadMonotonicNanoseconds:
          "canonicalUnsignedDecimal",
        channelPostExitObservationMonotonicNanoseconds:
          "canonicalUnsignedDecimal",
      },
      crossFieldInvariants: [
        ...PREDECESSOR_STAGE_ENFORCEMENT_RECEIPT_SCHEMA.crossFieldInvariants,
        "launchEnvelopeBinding_recursively_binds_channelSchemaBinding_channelInstanceBinding_channelLaunchObservationBinding_typedInterpreterBinding_and_inputLedgerBinding",
        "channelPreExecObservation_channelBootstrapReadObservation_and_channelPostExitObservation_all_recursively_equal_the_launch_observation_in_absolutePath_mount_device_inode_linkCount_type_size_times_raw_SHA256_secureResolution_and_statReadStat_fields",
        "the_channel_source_writer_was_closed_before_launch_observation_no_writable_alias_or_inherited_writer_descriptor_existed_and_the_final_mount_namespace_remained_immutable_through_cgroup_empty",
        "the_bound_launch_envelope.launchEnvelopeSealMonotonicNanoseconds_is_not_after_channelPreExecRevalidationMonotonicNanoseconds_which_is_strictly_before_monotonicStartNanoseconds_exec;_monotonicStart_is_not_after_channelBootstrapRead_is_not_after_monotonicEnd_is_not_after_channelPostExitObservation_and_all_are_strictly_before_the_absolute_deadline",
        "post_exit_receipt_assembly_occurs_only_after_channelPostExitObservation_stage_exit_and_cgroupPopulatedZero_and_never_predicts_its_own_binding_or_a_later_file_observation",
      ],
    },
  } as const);

const bindSchema = (
  artifactId: string,
  schemaVersion: string,
  sha256Domain: string,
  schema: unknown,
) => {
  const canonical = canonicalJson(schema);
  return Object.freeze({
    artifactId,
    schemaVersion,
    sha256Domain,
    sha256: createHash("sha256")
      .update(sha256Domain, "utf8")
      .update(canonical, "utf8")
      .digest("hex"),
    canonicalSizeBytes: Buffer.byteLength(canonical, "utf8"),
  });
};

const VERIFIER_CHANNEL_SCHEMA_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-verifier-runtime-channel-schema/v1\n";
const ASSEMBLER_CHANNEL_SCHEMA_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-assembler-runtime-channel-schema/v1\n";
const ASSEMBLER_INPUT_LEDGER_SCHEMA_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-assembler-successor-input-ledger-schema/v1\n";
const SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-successor-launch-envelope-schema/v1\n";
const SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-successor-enforcement-receipt-schema/v1\n";

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA_BINDING =
  bindSchema(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA.artifactId,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA.schemaVersion,
    VERIFIER_CHANNEL_SCHEMA_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA_BINDING =
  bindSchema(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA.artifactId,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA.schemaVersion,
    ASSEMBLER_CHANNEL_SCHEMA_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA_BINDING =
  bindSchema(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA.artifactId,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA.schemaVersion,
    ASSEMBLER_INPUT_LEDGER_SCHEMA_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA_BINDING =
  bindSchema(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA.artifactId,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA.schemaVersion,
    SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA_BINDING =
  bindSchema(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA.artifactId,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA.schemaVersion,
    SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA,
  );

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.successor_runtime_channel_schema_registry",
    registryVersion:
      "nhm2.prolate_boson_star.newtonian_seed.successor_runtime_channel_schema_registry/v1",
    authority:
      "nonexecuting_closed_schema_preregistration_pending_hash_bound_typed_interpreter",
    predecessorRunPlanV1Binding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
    inheritedV1ControlPlaneEvidenceGrammarRegistryBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
    canonicalization: "RFC8785_JSON_Canonicalization_Scheme_UTF8",
    hashRecipe:
      "sha256(utf8(exact_domain_literal_with_terminal_LF)+exact_schema_validated_recanonicalized_canonical_json_utf8)",
    alternateDelimiterLengthPrefixOrEncodingAllowed: false,
    recursiveRules: {
      extraKeysAllowedAtAnyObjectDepth: false,
      sparseArraysAllowed: false,
      extraArrayEntriesAllowed: false,
      nonfiniteNumbersAllowed: false,
      negativeZeroAllowed: false,
      duplicateKeysAllowed: false,
      rawBytesMustEqualRecanonicalizedUtf8Exactly: true,
    },
    domains: {
      commonRunRequest:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .domains.seedRunRequest,
      registry:
        "nhm2-prolate-boson-star-newtonian-seed-successor-runtime-channel-schema-registry/v1\n",
      verifierChannelSchema: VERIFIER_CHANNEL_SCHEMA_DOMAIN,
      assemblerChannelSchema: ASSEMBLER_CHANNEL_SCHEMA_DOMAIN,
      verifierChannelInstance:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-runtime-channel/v1\n",
      assemblerChannelInstance:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-runtime-channel/v1\n",
      closedSchemaTypedInterpreter:
        "nhm2-prolate-boson-star-newtonian-seed-closed-schema-typed-interpreter/v1\n",
      verifierChannelObservation:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-runtime-channel-observation/v1\n",
      assemblerChannelObservation:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-runtime-channel-observation/v1\n",
      verifierSuccessorLaunchEnvelope:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-successor-launch-envelope/v1\n",
      assemblerSuccessorLaunchEnvelope:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-successor-launch-envelope/v1\n",
      verifierSuccessorEnforcementReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-verifier-successor-enforcement-receipt/v1\n",
      assemblerSuccessorEnforcementReceipt:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-successor-enforcement-receipt/v1\n",
      assemblerSuccessorInputLedger:
        "nhm2-prolate-boson-star-newtonian-seed-assembler-successor-input-ledger/v1\n",
    },
    bindingProfiles: {
      commonRunRequest: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.run_request",
        domain: "domains.commonRunRequest",
      },
      closedSchemaTypedInterpreter: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.closed_schema_typed_interpreter",
        domain: "domains.closedSchemaTypedInterpreter",
      },
      verifierChannelInstance: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_runtime_channel",
        domain: "domains.verifierChannelInstance",
      },
      assemblerChannelInstance: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_runtime_channel",
        domain: "domains.assemblerChannelInstance",
      },
      verifierChannelObservation: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_runtime_channel_observation",
        domain: "domains.verifierChannelObservation",
      },
      assemblerChannelObservation: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_runtime_channel_observation",
        domain: "domains.assemblerChannelObservation",
      },
      verifierSuccessorLaunchEnvelope: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_successor_launch_envelope",
        domain: "domains.verifierSuccessorLaunchEnvelope",
      },
      assemblerSuccessorLaunchEnvelope: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_successor_launch_envelope",
        domain: "domains.assemblerSuccessorLaunchEnvelope",
      },
      verifierSuccessorEnforcementReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.verifier_successor_enforcement_receipt",
        domain: "domains.verifierSuccessorEnforcementReceipt",
      },
      assemblerSuccessorEnforcementReceipt: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_successor_enforcement_receipt",
        domain: "domains.assemblerSuccessorEnforcementReceipt",
      },
      assemblerSuccessorInputLedger: {
        artifactKind:
          "nhm2.prolate_boson_star_newtonian_seed.assembler_successor_input_ledger",
        domain: "domains.assemblerSuccessorInputLedger",
      },
    },
    schemas: {
      controlPlaneBinding: CONTROL_PLANE_BINDING_SCHEMA,
      fileObservation: FILE_OBSERVATION_SCHEMA,
      absoluteDeadlineReceipt: ABSOLUTE_DEADLINE_RECEIPT_SCHEMA,
      secureStagingObservationClosure:
        SECURE_STAGING_OBSERVATION_CLOSURE_SCHEMA,
      closedStageOutputObservation: CLOSED_STAGE_OUTPUT_OBSERVATION_SCHEMA,
      commonRunRequest:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
          .schemas.seedRunRequest,
      verifierRuntimeChannel:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA,
      assemblerRuntimeChannel:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA,
      successorLaunchEnvelope:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA,
      successorEnforcementReceipt:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA,
      assemblerSuccessorInputLedger:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA,
    },
    commonRunRequestFutureEvidencePolicy: {
      exactKeys: COMMON_RUN_REQUEST_EXACT_KEYS,
      forbiddenFutureEvidenceKeys:
        FORBIDDEN_COMMON_RUN_REQUEST_FUTURE_EVIDENCE_KEYS,
      futureInstanceHashOrBindingPreregistrationAllowed: false,
      typedInterpreterInstanceBindingMustArriveOnlyInStageLocalChannel: true,
    },
    schemaBindings: {
      verifierRuntimeChannel:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA_BINDING,
      assemblerRuntimeChannel:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA_BINDING,
      successorLaunchEnvelope:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA_BINDING,
      successorEnforcementReceipt:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA_BINDING,
      assemblerSuccessorInputLedger:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA_BINDING,
    },
    successorStageProfiles: {
      verifier: {
        stageId: "trusted_independent_verifier",
        channelAbsolutePath: VERIFIER_BROKER_CHANNEL_PATH,
        channelObservationContextualPosition: 40,
        channelSchemaBindingProfile: "verifierRuntimeChannel",
        channelSchemaBindingSource:
          "schemaBindings.verifierRuntimeChannel",
        channelInstanceBindingProfile: "verifierChannelInstance",
        channelObservationBindingProfile: "verifierChannelObservation",
        inputLedgerBindingProfile:
          "inheritedV1.artifactBindingProfiles.verifierInputLedger",
        launchEnvelopeBindingProfile: "verifierSuccessorLaunchEnvelope",
        enforcementReceiptBindingProfile:
          "verifierSuccessorEnforcementReceipt",
      },
      assembler: {
        stageId: "trusted_descriptor_assembler",
        channelAbsolutePath: ASSEMBLER_BROKER_CHANNEL_PATH,
        channelObservationContextualPosition: 42,
        channelSchemaBindingProfile: "assemblerRuntimeChannel",
        channelSchemaBindingSource:
          "schemaBindings.assemblerRuntimeChannel",
        channelInstanceBindingProfile: "assemblerChannelInstance",
        channelObservationBindingProfile: "assemblerChannelObservation",
        inputLedgerBindingProfile:
          "assemblerSuccessorInputLedger",
        launchEnvelopeBindingProfile: "assemblerSuccessorLaunchEnvelope",
        enforcementReceiptBindingProfile:
          "assemblerSuccessorEnforcementReceipt",
      },
    },
    runtimeTypedInterpreterBinding: null,
    executableValidationAuthorityPresent: false,
  } as const);

const REGISTRY_CANONICAL_JSON = canonicalJson(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY,
);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-successor-runtime-channel-schema-registry/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY.artifactId,
    registryVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY.registryVersion,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_SHA256_DOMAIN,
    sha256: createHash("sha256")
      .update(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_SHA256_DOMAIN,
        "utf8",
      )
      .update(REGISTRY_CANONICAL_JSON, "utf8")
      .digest("hex"),
    canonicalSizeBytes: Buffer.byteLength(REGISTRY_CANONICAL_JSON, "utf8"),
  });
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_EXPECTED_SHA256 =
  "3aae03da02aca1ec23210eeba24536bca6cca880241c18778bf335fad78df284" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES =
  52841 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING.sha256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING.canonicalSizeBytes !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_run_plan_v2_runtime_channel_schema_registry_binding_drift",
  );
}

const BASE_ENVIRONMENT = Object.freeze({
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
  TZ: "UTC",
  VECLIB_MAXIMUM_THREADS: "1",
});

const EXTERNAL_BINDINGS = deepFreeze({
  isolatedWorkerCapabilityBinding: null,
  schedulerLeaseBinding: null,
  producerSourceManifestBinding: null,
  producerSourceLedgerBinding: null,
  producerToolchainManifestBinding: null,
  producerToolchainLedgerBinding: null,
  producerSeccompPolicyBinding: null,
  producerQuotaCapabilityBinding: null,
  producerOciImageDigest: null,
  verifierSourceManifestBinding: null,
  verifierSourceLedgerBinding: null,
  verifierToolchainManifestBinding: null,
  verifierToolchainLedgerBinding: null,
  verifierSeccompPolicyBinding: null,
  verifierQuotaCapabilityBinding: null,
  verifierOciImageDigest: null,
  assemblerSourceManifestBinding: null,
  assemblerSourceLedgerBinding: null,
  assemblerToolchainManifestBinding: null,
  assemblerToolchainLedgerBinding: null,
  assemblerSeccompPolicyBinding: null,
  assemblerQuotaCapabilityBinding: null,
  assemblerOciImageDigest: null,
  crossStageSeparationReceiptBinding: null,
  verifierProofKernelBinding: null,
  verifierMpfrGmpRuntimeBinding: null,
  stageInputLedgerConstructionPolicyBinding: null,
  exactOutputInventoryBinding: null,
  closedSchemaTypedInterpreterBinding: null,
});

const BLOCKERS = Object.freeze([
  "isolated_worker_capability_binding_absent",
  "scheduler_lease_binding_absent",
  "producer_source_toolchain_image_seccomp_and_quota_bindings_absent",
  "verifier_source_toolchain_image_seccomp_quota_proof_kernel_and_mpfr_gmp_bindings_absent",
  "assembler_source_toolchain_image_seccomp_and_quota_bindings_absent",
  "closed_schema_typed_interpreter_binding_and_executable_authority_absent",
  "stage_local_broker_channel_writer_observer_and_read_only_mount_provider_absent",
  "verifier_runtime_channel_instance_and_observation_absent",
  "assembler_runtime_channel_instance_and_observation_absent",
  "three_stage_input_ledgers_launch_envelopes_and_enforcement_receipts_absent",
  "seed_run_not_authorized_or_executed",
  "newtonian_seed_artifact_absent",
] as const);

const PREDECESSOR_CLAIM_LOCKS =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1.claimLocks;
if (Object.values(PREDECESSOR_CLAIM_LOCKS).some((value) => value !== false)) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_run_plan_v2_predecessor_claim_lock_drift",
  );
}

const SUCCESSOR_CLAIM_LOCKS = Object.freeze({
  successorExecutionAuthorized: false,
  successorProducerStarted: false,
  successorVerifierStarted: false,
  successorAssemblerStarted: false,
  successorVerifierRuntimeChannelAccepted: false,
  successorAssemblerRuntimeChannelAccepted: false,
  successorTypedInterpreterAuthorityEstablished: false,
  successorAssemblerInputLedgerAccepted: false,
  successorLaunchEnvelopeAccepted: false,
  successorEnforcementReceiptAccepted: false,
});

const CLAIM_LOCKS = Object.freeze({
  ...PREDECESSOR_CLAIM_LOCKS,
  ...SUCCESSOR_CLAIM_LOCKS,
});

const CONTRACT = {
  artifactId:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ARTIFACT_ID,
  contractVersion:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CONTRACT_VERSION,
  authority:
    "nonexecuting_immutable_successor_run_plan_closing_stage_local_broker_runtime_evidence_channels",
  maturity:
    "diagnostic_execution_contract_sealed_preregistration_no_capability_no_execution_no_artifact",
  predecessor: {
    binding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
    exactExpectedBinding: EXPECTED_PREDECESSOR_V1_BINDING,
    v1MutationAllowed: false,
    v1ExecutionOrAuthorityStateInheritedAsTrue: false,
    successorChangesOnlyRuntimeEvidenceTransportAndBindingClosure: true,
    claimLocks: PREDECESSOR_CLAIM_LOCKS,
    claimLockKeys: Object.keys(PREDECESSOR_CLAIM_LOCKS),
    allClaimLocksRemainExactlyFalse: true,
  },
  sealedPreregistrationPolicy: {
    literalExpectedSha256AndCanonicalSizeAddedOnlyAfterReadOnlyRedTeamClear:
      true,
    sealedPreregistrationBindingGrantsExecutionAuthority: false,
    sealedPreregistrationBindingGrantsArtifactOrScientificAuthority: false,
  },
  externalBindings: EXTERNAL_BINDINGS,
  sourceClosureDisposition: {
    producer: {
      binding: null,
      reason:
        "producer_source_exists_only_as_new_unsealed_files_pending_review_and_source_closure_manifest",
    },
    verifier: {
      binding: null,
      reason:
        "independent_verifier_source_exists_only_as_new_unsealed_files_pending_review_and_source_closure_manifest",
    },
    assembler: {
      binding: null,
      reason:
        "assembler_source_exists_only_as_new_unsealed_files_pending_review_and_source_closure_manifest",
    },
    sourcePresenceAloneGrantsClosureAuthority: false,
  },
  commonRunRequestPolicy: {
    path: "/run/input/00-seed-run-request.v1.json",
    canonicalization: "RFC8785_JSON_Canonicalization_Scheme_UTF8",
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
        .domains.commonRunRequest,
    hashRecipe:
      "sha256(utf8(exact_domain_literal_with_terminal_LF)+exact_schema_validated_recanonicalized_common_request_utf8)",
    exactKeys: COMMON_RUN_REQUEST_EXACT_KEYS,
    forbiddenFutureEvidenceKeys:
      FORBIDDEN_COMMON_RUN_REQUEST_FUTURE_EVIDENCE_KEYS,
    futureHashOrBindingPreregistrationAllowed: false,
    stageLocalRuntimeEvidenceMayAppearInCommonRunRequest: false,
    binding: null,
  },
  inputPathInventories: {
    inheritedV1BaseInputProfile:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BASE_INPUT_PROFILE,
    inheritedV1BaseInputProfileExactFileCount: 8,
    everyStageFirstEightObservationsMustRecursivelyEqualInheritedProfile: true,
    baseInputRelativePathOrder: BASE_INPUT_RELATIVE_PATHS,
    baseInputAbsolutePathOrder: BASE_INPUT_ABSOLUTE_PATHS,
    stagingRelativeArrayPathOrder: STAGING_RELATIVE_ARRAY_PATHS,
    stagingAbsoluteArrayPathOrder: STAGING_ABSOLUTE_ARRAY_PATHS,
    verifier: {
      preChannelInputLedgerFilePathOrder: [
        ...BASE_INPUT_ABSOLUTE_PATHS,
        ...STAGING_ABSOLUTE_ARRAY_PATHS,
      ],
      launchVisibleFilePathOrder: [
        ...BASE_INPUT_ABSOLUTE_PATHS,
        ...STAGING_ABSOLUTE_ARRAY_PATHS,
        VERIFIER_BROKER_CHANNEL_PATH,
      ],
      brokerChannelPath: VERIFIER_BROKER_CHANNEL_PATH,
      preChannelInputLedgerFileCount: 40,
      launchVisibleFileCount: 41,
      channelObservationContextualPosition: 40,
      channelIsSoleLaunchVisibleExtraFile: true,
    },
    assembler: {
      preChannelInputLedgerFilePathOrder: [
        ...BASE_INPUT_ABSOLUTE_PATHS,
        ...STAGING_ABSOLUTE_ARRAY_PATHS,
        VERIFIER_REPLAY_BUNDLE_PATH,
        VERIFIER_ENFORCEMENT_RECEIPT_PATH,
      ],
      launchVisibleFilePathOrder: [
        ...BASE_INPUT_ABSOLUTE_PATHS,
        ...STAGING_ABSOLUTE_ARRAY_PATHS,
        VERIFIER_REPLAY_BUNDLE_PATH,
        VERIFIER_ENFORCEMENT_RECEIPT_PATH,
        ASSEMBLER_BROKER_CHANNEL_PATH,
      ],
      brokerChannelPath: ASSEMBLER_BROKER_CHANNEL_PATH,
      preChannelInputLedgerFileCount: 42,
      launchVisibleFileCount: 43,
      channelObservationContextualPosition: 42,
      channelIsSoleLaunchVisibleExtraFile: true,
    },
    exactStagingDirectoryPathOrder: [
      "/run/staging/arrays",
      "/run/staging/arrays/L0",
      "/run/staging/arrays/L1",
      "/run/staging/arrays/L2",
      "/run/staging/arrays/AUDIT",
    ],
    perStageBrokerChannelDirectoryContainsExactlyOneDeclaredFile: true,
    extrasLinksAliasesDevicesSocketsFifosOrReparsePointsAllowed: false,
  },
  runtimeChannelSchemas: {
    registry:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY,
    registryBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
    verifier: {
      path: VERIFIER_BROKER_CHANNEL_PATH,
      schema:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA,
      schemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_VERIFIER_RUNTIME_CHANNEL_SCHEMA_BINDING,
      instanceSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
          .domains.verifierChannelInstance,
      instanceBinding: null,
      observationBinding: null,
    },
    assemblerSuccessorInputLedger: {
      schema:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA,
      schemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_INPUT_LEDGER_SCHEMA_BINDING,
      instanceSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
          .domains.assemblerSuccessorInputLedger,
      instanceBinding: null,
    },
    successorLaunchEnvelope: {
      schema:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA,
      schemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_LAUNCH_ENVELOPE_SCHEMA_BINDING,
      verifierBinding: null,
      assemblerBinding: null,
    },
    successorEnforcementReceipt: {
      schema:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA,
      schemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SUCCESSOR_ENFORCEMENT_RECEIPT_SCHEMA_BINDING,
      verifierBinding: null,
      assemblerBinding: null,
    },
    assembler: {
      path: ASSEMBLER_BROKER_CHANNEL_PATH,
      schema:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA,
      schemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA_BINDING,
      instanceSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
          .domains.assemblerChannelInstance,
      instanceBinding: null,
      observationBinding: null,
    },
    instanceHashRecipe:
      "sha256(utf8(exact_stage_instance_domain_with_terminal_LF)+exact_schema_validated_recanonicalized_channel_utf8)",
    futureInstanceHashInCommonRunRequestAllowed: false,
    channelMayContainItsOwnBindingOrHash: false,
  },
  brokerChannelOwnershipAndMountPolicy: {
    exclusiveWriter:
      "trusted_broker_outside_producer_verifier_and_assembler_cgroups",
    stageProcessesMayCreateWriteTruncateRenameUnlinkOrReplaceChannel: false,
    creationFlags: ["O_CREAT", "O_EXCL", "O_WRONLY", "O_CLOEXEC", "O_NOFOLLOW"],
    canonicalBytesWrittenOnceThenFileFsyncAndDirectoryFsyncRequired: true,
    secureObservationAfterCloseBeforeLaunchRequired: true,
    brokerWriterDescriptorClosedBeforeSecureObservation: true,
    stageMountAccess: "read_only",
    writableAliasOrSecondPathToChannelAllowed: false,
    channelRegularFileLinkCount: 1,
    channelRootMustBeIdentityDistinctFrom: [
      "/run/input",
      "/run/staging",
      "/run/replay",
      "/run/attestation",
      "/run/output",
      "/opt/nhm2-producer",
      "/opt/nhm2-verifier",
      "/opt/nhm2-assembler",
    ],
    secureResolution:
      "openat2_RESOLVE_BENEATH_RESOLVE_NO_SYMLINKS_RESOLVE_NO_MAGICLINKS_RESOLVE_NO_XDEV",
    prePathStatOpenHandleStatPostReadHandleStatAndPostPathStatRequired: true,
    launchEnvelopeBindsPostMountObservationNotPreMountSourceObservation: true,
    mountNamespaceSealedAfterObservationBeforeEnvelopeSeal: true,
    preExecOpenat2ObservationMustRecursivelyEqualLaunchObservation: true,
    bootstrapFirstReadObservationMustRecursivelyEqualLaunchObservation: true,
    postExitBeforeUnmountObservationMustRecursivelyEqualLaunchObservation: true,
    mountAndUnderlyingFileMustRemainNonmutableThroughStageExitAndCgroupEmpty:
      true,
    channelDescriptorInheritanceToChildOrDescendantAllowed: false,
    networkOrCallbackTransportAllowed: false,
  },
  stageLocalChronology: {
    clockId: "CLOCK_MONOTONIC_RAW",
    verifierExactOrder: [
      "producer_exit_and_cgroup_empty",
      "trusted_broker_secure_staging_observation_closure",
      "replay_root_creation_and_empty_prestate_receipt",
      "verifier_quota_setup_receipt",
      "verifier_input_ledger_seal_excluding_future_channel_instance",
      "verifier_channel_exclusive_canonical_seal_embedding_the_closed_input_ledger_binding",
      "verifier_channel_secure_observation_and_read_only_mount",
      "verifier_launch_envelope_seal_binding_the_exact_channel_instance_and_secure_observation",
      "verifier_pre_exec_channel_mount_identity_and_bytes_revalidation",
      "verifier_launch",
    ],
    assemblerExactOrder: [
      "verifier_replay_bundle_close_and_fsync",
      "verifier_exit_and_cgroup_empty",
      "trusted_broker_verifier_closed_output_observation",
      "attestation_root_creation_and_empty_prestate_receipt",
      "trusted_broker_verifier_enforcement_receipt_exclusive_write_close_and_fsync",
      "fresh_secure_verifier_enforcement_receipt_observation",
      "final_output_root_creation_and_empty_prestate_receipt",
      "assembler_quota_setup_receipt",
      "assembler_input_ledger_seal_excluding_future_channel_instance",
      "assembler_channel_exclusive_canonical_seal_embedding_the_closed_input_ledger_binding",
      "assembler_channel_secure_observation_and_read_only_mount",
      "assembler_launch_envelope_seal_binding_the_exact_channel_instance_and_secure_observation",
      "assembler_pre_exec_channel_mount_identity_and_bytes_revalidation",
      "assembler_launch",
    ],
    inputLedgerOrLaunchEnvelopeMayBindFutureChannelInstance: false,
    channelMustEmbedAlreadyClosedInputLedgerBinding: true,
    channelMayEmbedLaunchEnvelopeBinding: false,
    launchEnvelopeMustBindExactChannelInstanceAndSecureObservation: true,
    enforcementReceiptMustBindObservedChannelInstanceAfterStageExit: true,
    noCycleProof:
      "input_ledger_closes_without_a_future_channel_instance;_the_channel_then_closes_and_embeds_that_ledger_binding;_secure_observation_closes_the_channel_instance;_the_launch_envelope_then_binds_the_exact_channel_instance_and_observation;_post_exit_enforcement_rebinds_both_without_any_reverse_reference",
    everyStepStrictlyBeforeAbsoluteDeadline: true,
  },
  invocations: {
    producer: {
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
      environment: { ...BASE_ENVIRONMENT, TMPDIR: "/run/staging" },
    },
    verifier: {
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
        "--broker-runtime-evidence",
        VERIFIER_BROKER_CHANNEL_PATH,
      ],
      workingDirectory: "/run/replay",
      environment: { ...BASE_ENVIRONMENT, TMPDIR: "/run/replay" },
    },
    assembler: {
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
        "--broker-runtime-evidence",
        ASSEMBLER_BROKER_CHANNEL_PATH,
        "--output-root",
        "/run/output",
      ],
      workingDirectory: "/run/output",
      environment: { ...BASE_ENVIRONMENT, TMPDIR: "/run/output" },
    },
    exactArgvEnvironmentAndWorkingDirectoryRequired: true,
    shellOrStringCommandParsingAllowed: false,
    stdin: "closed",
  },
  providerPolicy: {
    onlyExecutionTarget: "external_linux_oci_cgroup_v2_worker",
    currentHostFallbackAllowed: false,
    windowsProviderLaunchAllowed: false,
    defaultProviderLaunchAllowed: false,
    hostNodeExecutorAllowed: false,
    ambientHostCpythonAllowed: false,
    inProcessCallbackOrRemoteApiAllowed: false,
    providerBinding: null,
    linuxCapabilityBinding: null,
    currentHostLaunchCount: 0,
    windowsLaunchCount: 0,
    defaultProviderLaunchCount: 0,
  },
  resourcePolicy: {
    maximumChildRssBytes: 805306368,
    maximumWallNanoseconds: "1800000000000",
    maximumProcesses: 1,
    maximumThreads: 1,
    networkDenied: true,
    verifierChannelMaximumCanonicalUtf8Bytes: 2 * MIB,
    assemblerChannelMaximumCanonicalUtf8Bytes: 2 * MIB,
  },
  executionState: {
    executionAuthorized: false,
    commonRunRequestBinding: null,
    absoluteDeadlineReceiptBinding: null,
    replayPrestateReceiptBinding: null,
    verifierQuotaSetupReceiptBinding: null,
    verifierInputLedgerBinding: null,
    verifierLaunchEnvelopeBinding: null,
    verifierChannelBinding: null,
    verifierChannelObservationBinding: null,
    verifierEnforcementReceiptBinding: null,
    attestationPrestateReceiptBinding: null,
    assemblerDirectoryPrestateReceiptBinding: null,
    assemblerQuotaSetupReceiptBinding: null,
    assemblerInputLedgerBinding: null,
    assemblerLaunchEnvelopeBinding: null,
    assemblerChannelBinding: null,
    assemblerChannelObservationBinding: null,
    assemblerEnforcementReceiptBinding: null,
    verifierReplayBundleBinding: null,
    finalArtifactBinding: null,
    finalAdmissionReceiptBinding: null,
    executed: false,
    artifactAccepted: false,
  },
  blockers: BLOCKERS,
  exactStageOrder: STAGES,
  predecessorClaimLockKeys: Object.keys(PREDECESSOR_CLAIM_LOCKS),
  successorClaimLockKeys: Object.keys(SUCCESSOR_CLAIM_LOCKS),
  claimLockKeys: Object.keys(CLAIM_LOCKS),
  claimLocks: CLAIM_LOCKS,
} as const;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2 =
  deepFreeze(CONTRACT);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_JSON =
  canonicalJson(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-run-plan/v2\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_EXPECTED_SHA256 =
  "c2483042ce046e2226e83ef9a3e90b381fe583483c0810ebd99d0af643c52f3f" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_EXPECTED_CANONICAL_SIZE_BYTES =
  128964 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_run_plan_v2_binding_drift",
  );
}

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_ARTIFACT_ID,
    contractVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CONTRACT_VERSION,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256_DOMAIN,
    sha256: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_SIZE_BYTES,
  });

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_LITERAL_SEAL_STATUS =
  "sealed_preregistration_read_only_red_team_clear" as const;

export const nhm2ProlateBosonStarNewtonianSeedRunPlanV2Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2) return [];
  try {
    return canonicalJson(value) ===
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_CANONICAL_JSON
      ? ["seed_run_plan_v2_external_copy_not_authoritative"]
      : ["seed_run_plan_v2_semantic_mismatch"];
  } catch {
    return ["seed_run_plan_v2_plain_data_snapshot_invalid"];
  }
};

export const isNhm2ProlateBosonStarNewtonianSeedRunPlanV2 = (
  value: unknown,
): value is typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2 =>
  nhm2ProlateBosonStarNewtonianSeedRunPlanV2Violations(value).length === 0;
