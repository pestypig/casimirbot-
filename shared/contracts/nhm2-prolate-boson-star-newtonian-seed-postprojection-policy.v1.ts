import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
} from "./nhm2-prolate-boson-star-newtonian-seed.v1";
import {
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
} from "./nhm2-prolate-boson-star-coherent-candidate-plan.v2";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_LITERAL_SEAL_STATUS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_PRODUCER_32_ARRAY_STAGING_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_STAGING_ENTRY_EXPECTATIONS,
} from "./nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
} from "./nhm2-prolate-boson-star-newtonian-seed-run-plan.v2";

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_ARTIFACT_ID =
  "nhm2.prolate_boson_star_newtonian_seed.postprojection_policy" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CONTRACT_VERSION =
  "nhm2_prolate_boson_star_newtonian_seed_postprojection_policy/v1" as const;

const EXPECTED_SEALED_NUMERIC_POLICY = Object.freeze({
  sha256: "ec9905f87b5d11c902a5b292772bdc11ec755ecd00fa08949382f42f1671652d",
  canonicalSizeBytes: 243_240,
  operationGraphSha256:
    "a4383a581779f90736588de253e2148c392156f001636a2b994e8eb0c905c835",
  operationGraphCanonicalSizeBytes: 39_345,
  literalSealStatus: "sealed_preregistration_read_only_red_team_clear",
} as const);

if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING.sha256 !==
    EXPECTED_SEALED_NUMERIC_POLICY.sha256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING.canonicalSizeBytes !==
    EXPECTED_SEALED_NUMERIC_POLICY.canonicalSizeBytes ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING.sha256 !==
    EXPECTED_SEALED_NUMERIC_POLICY.operationGraphSha256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING.canonicalSizeBytes !==
    EXPECTED_SEALED_NUMERIC_POLICY.operationGraphCanonicalSizeBytes ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_LITERAL_SEAL_STATUS !==
    EXPECTED_SEALED_NUMERIC_POLICY.literalSealStatus
) {
  throw new Error(
    "nhm2_newtonian_seed_postprojection_policy_numeric_dependency_drift",
  );
}

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

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const projectionBinding = (
  value: unknown,
  artifactId: string,
  contractVersion: string,
  sha256Domain: string,
) => {
  const canonical = canonicalJson(value);
  return Object.freeze({
    canonical,
    binding: Object.freeze({
      artifactId,
      contractVersion,
      sha256Domain,
      sha256: createHash("sha256")
        .update(sha256Domain, "utf8")
        .update(canonical, "utf8")
        .digest("hex"),
      canonicalSizeBytes: Buffer.byteLength(canonical, "utf8"),
    }),
  });
};

const closedRuntimeBindingRecipe = (
  artifactId: string,
  schemaVersion: string,
  sha256Domain: string,
) => ({
  bindingExactKeys: [
    "artifactId",
    "schemaVersion",
    "sha256Domain",
    "sha256",
    "canonicalSizeBytes",
  ],
  bindingExtraKeysAllowed: false,
  bindingFields: {
    artifactId: `literal_${artifactId}`,
    schemaVersion: `literal_${schemaVersion}`,
    sha256Domain: `literal_${sha256Domain}`,
    sha256: "exact_64_lowercase_hex_SHA256",
    canonicalSizeBytes: "nonnegative_safe_integer_exact_UTF8_byte_length",
  },
  canonicalHash: {
    algorithm: "SHA-256",
    domain: sha256Domain,
    domainEndsWithExactlyOneLf: true,
    serialization:
      "UTF8_of_no-whitespace_canonical_JSON_with_recursively_lexicographically_sorted_object_keys_and_arrays_in_schema_order",
    orderedPreimage: [
      "domain_UTF8_bytes_including_the_single_terminal_LF",
      "u64be_canonical_value_UTF8_byte_length",
      "canonical_value_UTF8_bytes",
    ],
    hashExpression:
      "sha256(domainUtf8||u64be(canonicalValueUtf8ByteLength)||canonicalValueUtf8Bytes)",
    anyOtherPreimageComponentAllowed: false,
  },
});

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_AUTHORITATIVE_SINGLETONS =
  Object.freeze({
    seedV1: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
    seedGridLevelsV1: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
    seedOutputArrayInventoryV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
    candidatePlanV2: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2,
    numericMaterializationPolicyV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1,
    numericMaterializationOperationGraphV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
    predecessorRunPlanV2RuntimeChannelSchemaRegistry:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY,
  });

const RAW_EVIDENCE_ROLES = Object.freeze([
  Object.freeze({
    roleIndex: 0,
    role: "newtonian_seed.evidence.preprojection.raw_scalar_u",
    stem: "raw-scalar-u",
    parity: "odd",
  }),
  Object.freeze({
    roleIndex: 1,
    role: "newtonian_seed.evidence.preprojection.raw_potential_V",
    stem: "raw-potential-v",
    parity: "even",
  }),
] as const);

const PRODUCTION_LEVELS =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS.slice(0, 3);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY =
  deepFreeze(
    PRODUCTION_LEVELS.flatMap((level, levelIndex) =>
      RAW_EVIDENCE_ROLES.map((role) => {
        const shape = [level.radialNodeCount, level.angularNodeCount] as const;
        const elementCount = shape[0] * shape[1];
        return {
          evidenceIndex:
            levelIndex * RAW_EVIDENCE_ROLES.length + role.roleIndex,
          levelIndex,
          levelId: level.id,
          roleIndex: role.roleIndex,
          role: role.role,
          parity: role.parity,
          relativePath: `${level.id}/${String(role.roleIndex).padStart(2, "0")}-${role.stem}.f64le`,
          absoluteEvidencePath: `/run/postprojection-evidence/${level.id}/${String(role.roleIndex).padStart(2, "0")}-${role.stem}.f64le`,
          dtype: "float64_le",
          order: "C_row_major_radial_index_outer_angular_index_inner",
          shape,
          elementCount,
          byteLength: elementCount * 8,
          sourceChronology:
            "exact_immutable_unpacked_Newton_result_immediately_before_projection_masks_phase_or_resampling_with_endian_serialization_only_and_no_value_normalization",
        };
      }),
    ),
  );

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_TOTALS =
  Object.freeze({
    arrayCount:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY.length,
    float64ElementCount:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY.reduce(
        (sum, item) => sum + item.elementCount,
        0,
      ),
    arrayByteLength:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY.reduce(
        (sum, item) => sum + item.byteLength,
        0,
      ),
  });

if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_TOTALS.arrayCount !==
    6 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_TOTALS.float64ElementCount !==
    29_696 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_TOTALS.arrayByteLength !==
    237_568
) {
  throw new Error("nhm2_newtonian_seed_postprojection_raw_inventory_drift");
}

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_HASH_POLICY =
  deepFreeze({
    sha256Domain:
      "nhm2.prolate_boson_star.newtonian_2p_seed.preprojection_evidence.array.sha256.v1\n",
    recipe:
      "sha256(utf8(domain)+u64be(relative_path_utf8_byte_length)+relative_path_utf8+u64be(role_utf8_byte_length)+role_utf8+u64be(array_byte_length)+exact_securely_reread_raw_array_bytes)",
    preimageOrder: [
      "utf8_domain",
      "u64be_relative_path_utf8_byte_length",
      "relative_path_utf8",
      "u64be_role_utf8_byte_length",
      "role_utf8",
      "u64be_array_byte_length",
      "raw_array_bytes",
    ],
    digestEncoding: "lowercase_hex_sha256",
    plainSha256AlsoRequiredInBrokerFileObservation: true,
    rawBytesMustBeComparedAfterSecureRereadNotDigestOnly: true,
    arrayEncoding:
      "raw_little_endian_IEEE754_binary64_C_order_all_values_finite_negative_zero_forbidden",
    negativeZeroHandling: "reject_the_raw_evidence_array_without_normalization",
  } as const);

const RAW_EVIDENCE_INVENTORY_PROJECTION = projectionBinding(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY,
  "nhm2.prolate_boson_star.newtonian_seed.postprojection_raw_evidence_inventory",
  "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw_evidence_inventory/v1",
  "nhm2-prolate-boson-star-newtonian-seed-postprojection-raw-evidence-inventory/v1\n",
);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_CANONICAL_JSON =
  RAW_EVIDENCE_INVENTORY_PROJECTION.canonical;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_BINDING =
  RAW_EVIDENCE_INVENTORY_PROJECTION.binding;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_EXPECTED_SHA256 =
  "552ed2911c9b1546fa664c74643ae7d468cf73cd954d87f8db0c5d2041100f4e" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_EXPECTED_CANONICAL_SIZE_BYTES =
  3459 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_BINDING.sha256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_BINDING.canonicalSizeBytes !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_newtonian_seed_postprojection_raw_evidence_inventory_literal_binding_drift",
  );
}

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SOURCE_ROLE_MAPPING =
  deepFreeze([
    {
      evidenceIndex: 0,
      levelId: "L0",
      field: "scalar",
      seedMultipoleInventoryIndex: 6,
      seedBaseInventoryIndex: 2,
      multipoleByteLength: 8_192,
      baseByteLength: 16_384,
    },
    {
      evidenceIndex: 1,
      levelId: "L0",
      field: "potential",
      seedMultipoleInventoryIndex: 7,
      seedBaseInventoryIndex: 3,
      multipoleByteLength: 8_192,
      baseByteLength: 16_384,
    },
    {
      evidenceIndex: 2,
      levelId: "L1",
      field: "scalar",
      seedMultipoleInventoryIndex: 14,
      seedBaseInventoryIndex: 10,
      multipoleByteLength: 18_432,
      baseByteLength: 36_864,
    },
    {
      evidenceIndex: 3,
      levelId: "L1",
      field: "potential",
      seedMultipoleInventoryIndex: 15,
      seedBaseInventoryIndex: 11,
      multipoleByteLength: 18_432,
      baseByteLength: 36_864,
    },
    {
      evidenceIndex: 4,
      levelId: "L2",
      field: "scalar",
      seedMultipoleInventoryIndex: 22,
      seedBaseInventoryIndex: 18,
      multipoleByteLength: 32_768,
      baseByteLength: 65_536,
    },
    {
      evidenceIndex: 5,
      levelId: "L2",
      field: "potential",
      seedMultipoleInventoryIndex: 23,
      seedBaseInventoryIndex: 19,
      multipoleByteLength: 32_768,
      baseByteLength: 65_536,
    },
  ] as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SOURCE_ROLE_TOTALS =
  Object.freeze({
    multipoleByteLength: 118_784,
    comparedBaseByteLength: 237_568,
  });

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_ANALYTIC_Z_PINS =
  deepFreeze([
    {
      levelId: "L0",
      angularNodeCount: 32,
      rawF64leSha256:
        "43df86c4df06c23912e5081c50dacc95770cdb42ead94e76843b5cf1783b6152",
      byteLength: 256,
    },
    {
      levelId: "L1",
      angularNodeCount: 48,
      rawF64leSha256:
        "59b550cace75f27d7e0d09842d2a27c705865ab449a1a3a89e54a0b4afb3d46c",
      byteLength: 384,
    },
    {
      levelId: "L2",
      angularNodeCount: 64,
      rawF64leSha256:
        "e1a253f71ce0a71d52f062be5d20a817df5c8b2d6e86859464058d2a8ec26c28",
      byteLength: 512,
    },
  ] as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.postprojection_operation_graph",
    contractVersion:
      "nhm2_prolate_boson_star_newtonian_seed_postprojection_operation_graph/mpfr256_identity_euclidean_lsq_cholesky_v1",
    status: "preregistered_unexecuted_diagnostic_operation_graph",
    closesOnly:
      "raw_nodal_binary64_bytes_to_postprojection_parity_Legendre_binary64_bytes_and_same_level_base_reconstruction_bytes",
    importedNumericDependency: {
      policyBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
      operationGraphBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
      authoritativeSingletonIdentityRequired: true,
      requiredSubgraphs: [
        "arithmeticKernel",
        "mappedNodes",
        "legendreForward",
        "angularSynthesis",
        "radialDctI",
        "inventoryTraversalAndPreArithmeticMasks",
      ],
      requiredContextSlices: {
        arithmeticKernel:
          "entire_authoritative_singleton_inherited_unchanged_plus_the_local_additive_extension",
        mappedNodes:
          "the_exact_imported_node-generation_primitive_prefix_through_pre-serialization_z_and_only_the_serialized_analytic_z_bits_get_d_barrier;serialized_rho_node_bits_and_serialized_theta_node_bits_are_outside_this_z-only_context_slice_and_are_not_executed",
        legendreForwardAngularSynthesisAndRadialDctI:
          "the_exact_primitive_programs_and_conventions_under_the_explicit_local_source_bindings_named_in_this_graph",
        inventoryTraversalAndPreArithmeticMasks: {
          multipole:
            "reuse_only_the_declared_multipole_mask_inventory_and_canonical_positive-zero_output_bits_after_every_raw_row_projection_and_coefficient_barrier",
          baseNodal:
            "reuse_the_imported_pre-arithmetic_base-nodal_mask_precedence_unchanged_during_reconstruction",
          importedWholeMultipolePreArithmeticShortCircuitReused: false,
        },
      },
      semanticReuse:
        "reference_the_exact_imported_primitive_programs_and_the_explicit_inventory-mask_context_slices_without_copying_reassociating_or_expanding_their_semantics",
    },
    arithmeticKernelExtension: {
      composition:
        "inherit_the_entire_authoritative_imported_arithmeticKernel_singleton_unchanged_then_add_only_the_projection_primitives_barriers_and_prohibitions_named_below",
      importedArithmeticKernel:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH.arithmeticKernel,
      authoritativeSingletonIdentityRequired: true,
      replacementPartialRestatementOrOverrideAllowed: false,
      inheritedPrecisionExponentRangeRoundingFlagGradualUnderflowAndZeroRulesUnchanged: true,
      projectionIntegerInjection:
        "reuse_imported_arithmeticKernel.integerInjection_mpfr_set_z_into_256_bit_destination_for_every_signed_or_unsigned_mathematical_integer",
      projectionBinary64InputInjection:
        "reuse_imported_arithmeticKernel.binary64InputInjection_for_the_exact_IEEE754_binary64_bit_pattern",
      runtimeToolchainBindingRequiredBeforeExecution: true,
      runtimeToolchainBinding: null,
      prohibited: [
        "binary64_intermediate_arithmetic",
        "fused_multiply_add",
        "BLAS_or_LAPACK",
        "default_MPFR_precision",
        "precision_above_or_below_256_bits",
        "rounding_mode_other_than_MPFR_RNDN",
        "pivoting_or_permutation",
        "row_or_column_equilibration",
        "regularization_or_diagonal_jitter",
        "QR_or_SVD_fallback",
        "tolerance_selected_branch",
        "platform_libm",
        "producer_supplied_basis_Gram_factor_or_projector",
      ],
      additiveBinary64BarrierInventory: {
        status:
          "effective_closed_union_of_every_binary64_input_pass-through_and_get_d_barrier_executed_by_this_composed_postprojection_graph_not_merely_the_locally_new_barriers",
        importedMappedNodesContextSlice: {
          exactExecution:
            "execute_the_imported_mappedNodes.commonProgram_statements_in_their_exact_order_from_pi256_through_z=RN256(cos(theta))_then_skip_the_rhoBits_and_thetaBits_get_d_statements_and_execute_only_the_zBits=mpfr_get_d(z,MPFR_RNDN)_serialized_analytic_z_bits_statement",
          includedGetDBarrierIds: ["serialized_analytic_z_bits"],
          excludedAndNotExecutedGetDBarrierIds: [
            "serialized_rho_node_bits",
            "serialized_theta_node_bits",
          ],
          preSerializationThetaAndZMpfrArithmeticStillExecutedExactly: true,
        },
        allowedBarrierIds: [
          "rawPreprojectionNodalInputBits",
          "serialized_analytic_z_bits",
          "provisionalPostprojectionCoefficientBits",
          "maskedProvisionalMultipoleInputBits",
          "provisionalA1ReceiptBits",
          "finalA1ReceiptBits",
          "accepted_postprojection_multipole_input_bits",
          "symbolicBaseMaskBits",
          "final_ordered_array_element_bits",
        ],
        entries: [
          {
            id: "rawPreprojectionNodalInputBits",
            primitive:
              "exact_binary64_input_validation_and_mpfr_set_d_reinjection_without_get_d",
          },
          {
            id: "serialized_analytic_z_bits",
            primitive:
              "exact_imported_mappedNodes_mpfr_get_d_barrier_then_exact_reinjection",
          },
          {
            id: "provisionalPostprojectionCoefficientBits",
            primitive: "mpfr_get_d",
          },
          {
            id: "maskedProvisionalMultipoleInputBits",
            primitive:
              "exact_provisionalPostprojectionCoefficientBits_after_required_canonical-positive-zero_multipole_overwrites_then_exact_binary64_validation_and_mpfr_set_d_reinjection_for_the_local_provisional_phase_DCT_without_new_get_d",
          },
          { id: "provisionalA1ReceiptBits", primitive: "mpfr_get_d" },
          { id: "finalA1ReceiptBits", primitive: "mpfr_get_d" },
          {
            id: "accepted_postprojection_multipole_input_bits",
            primitive:
              "postprojection_coefficient_bits_after_required_overwrite_and_scalar_phase_then_exact_imported_pass_through_or_reinjection_without_new_get_d",
          },
          {
            id: "symbolicBaseMaskBits",
            primitive:
              "exact_imported_base-nodal_pre-arithmetic_symbolic-mask_direct_canonical-positive-zero_output_without_evaluator_or_get_d",
          },
          {
            id: "final_ordered_array_element_bits",
            primitive:
              "exact_imported_angularSynthesis_final_output_mpfr_get_d_barrier_for_base_nodal_arrays",
          },
        ],
        additiveMpfrGetDBarrierIds: [
          "serialized_analytic_z_bits",
          "provisionalPostprojectionCoefficientBits",
          "provisionalA1ReceiptBits",
          "finalA1ReceiptBits",
          "final_ordered_array_element_bits",
        ],
        rule: "every_executable_mpfr_get_d_call_is_labeled_exactly_once_with_one_additiveMpfrGetDBarrierId_and_every_non_get_d_binary64_input_or_pass_through_uses_its_one_named_allowedBarrierId",
        anyOtherImportedBarrierExecutedByThisComposedGraph: false,
        unlistedBinary64IntermediateAllowed: false,
      },
    },
    levelAndFieldOrder: {
      levels: [
        {
          levelId: "L0",
          radialNodeCount: 64,
          angularNodeCount: 32,
          modeCount: 16,
        },
        {
          levelId: "L1",
          radialNodeCount: 96,
          angularNodeCount: 48,
          modeCount: 24,
        },
        {
          levelId: "L2",
          radialNodeCount: 128,
          angularNodeCount: 64,
          modeCount: 32,
        },
      ],
      traversal:
        "level_L0_L1_L2_outer_then_field_scalar_odd_potential_even_then_radial_index_j_then_mode_q",
      scalarDegrees: "ell=2*q+1_for_q_ascending_0_through_modeCount-1",
      potentialDegrees: "ell=2*q_for_q_ascending_0_through_modeCount-1",
      AUDITSolveOrProjectionAllowed: false,
    },
    rawInput: {
      exactInventory:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY,
      exactTotals:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_TOTALS,
      evidenceRoot: "/run/postprojection-evidence",
      evidenceRootClosure:
        "one_separate_broker_observed_exact_six_file_closed_root_with_only_L0_L1_L2_directories_and_two_exact_files_per_level",
      seed32ArrayStagingRoot: "/run/staging",
      seed32ArrayStagingClosureRemainsExactAndUnchanged: true,
      evidenceRootMayBeMergedIntoSeed32ArrayStagingRoot: false,
      validationOrder: [
        "secure_server_observation_matches_exact_inventory_path_shape_length_and_order",
        "raw_bytes_are_exactly_f64le_and_have_no_trailing_bytes",
        "every_binary64_value_is_finite",
        "negative_zero_is_rejected",
        "the_verifier_reinjects_the_observed_bits_without_numeric_text_conversion",
      ],
      producerSummaryOrHashWithoutServerBytesAccepted: false,
      rawBoundaryEntriesAreEvidenceNotSymbolicallyOverwrittenInputs: true,
      sourceRoleMapping:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SOURCE_ROLE_MAPPING,
      sourceRoleTotals:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SOURCE_ROLE_TOTALS,
      rawEvidenceArraysEnterSeedDescriptor: false,
      levelAuthority:
        "L0_and_L1_outputs_remain_diagnostics_and_L2_multipoles_become_an_interior_source_only_after_external_full_seed_v1_admission",
    },
    angularCoordinateAndBasis: {
      coordinateSource:
        "exact_reinjection_of_the_imported_numeric_operation_graph_serialized_analytic_z_bits",
      preSerializationMappedZMayFlowToBasis: false,
      cosOfSerializedThetaMayFlowToBasis: false,
      producerSuppliedZMayFlowToBasis: false,
      endpoints:
        "k=0_uses_exact_+1_and_k=Ntheta-1_uses_symbolic_+0_from_the_imported_mapped_node_graph",
      basisProgram:
        "reuse_the_imported_legendreForward_primitive_program_at_each_k_then_select_exact_parity_degrees",
      basisLayout:
        "B[k,q]_with_k_ascending_0_through_Ntheta-1_and_q_ascending_0_through_modeCount-1",
      normalization: "P_ell(1)=1",
      regeneratedSerializedAnalyticZPins:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_ANALYTIC_Z_PINS,
      analyticZEvidence:
        "derived_internal_evidence_regenerated_from_pre_serialization_theta_to_z_then_serialized_at_the_imported_barrier_and_reinjected;never_staged_never_producer_supplied_and_never_cos_of_binary64_theta",
      exactStructuralFullRankRationale: {
        even: "the_M_even_columns_are_degree_strictly_less_than_M_polynomials_in_t=z_squared_evaluated_at_N_distinct_mapped_rows_with_at_least_M_distinct_t_values_so_the_even_B_has_full_column_rank",
        odd: "after_factoring_z_the_M_odd_columns_are_degree_strictly_less_than_M_polynomials_in_t=z_squared_and_the_nonzero_z_rows_include_at_least_M_distinct_t_values_so_the_odd_B_has_full_column_rank",
        exactRealConsequence:
          "for_either_parity_nonzero_column_coefficients_c_define_a_nonzero_polynomial_that_cannot_vanish_at_all_required_distinct_t_values_therefore_B*c_is_nonzero_and_G=B_transpose_B_is_exact_real_symmetric_positive_definite",
        runtimeConsequence:
          "the_finite_MPFR256_graph_still_requires_every_observed_Cholesky_diagonal_residual_and_pivot_to_be_strictly_positive_without_tolerance_or_fallback",
        numericConditionOrPivotEstimateUsedForAcceptance: false,
      },
    },
    objective: {
      mathematicalTarget:
        "minimize_the_identity_weight_discrete_Euclidean_sum_k_abs(sum_q_B[k,q]*c[q]-y[k])^2",
      weights: "every_angular_row_weight_is_exact_integer_1",
      quadratureWeightsAllowed: false,
      sinThetaWeightsAllowed: false,
      JacobianWeightsAllowed: false,
      endpointHalfWeightsAllowed: false,
      barycentricWeightsAllowed: false,
      adaptiveOrDataDependentWeightsAllowed: false,
      finiteGraphClaim:
        "the_contract_freezes_the_MPFR256_realization_of_the_normal_equations_and_does_not_claim_an_exact_real_minimizer",
      coefficientSemantics:
        "the_raw_Newton_nodal_values_have_no_independent_continuum_authority_identity-row_least-squares_deterministically_selects_one_finite_parity-Legendre_reconstruction_and_each_c_q_is_the_Legendre_coefficient_of_exactly_that_selected_reconstruction_not_an_exact_continuous_projection_of_an_authoritative_raw_field",
      acceptabilityAuthority:
        "only_external_full_seed_residual_convergence_proof_and_admission_gates_decide_whether_the_selected_reconstruction_is_acceptable",
    },
    postprojectionMultipoleOverwrites: {
      chronology:
        "run_basis_RHS_Cholesky_triangular_solve_and_provisional_coefficient_f64_barrier_for_every_raw_radial_row_first_then_overwrite_the_declared_multipole_entries_with_canonical_positive_zero_before_phase",
      projectionExecutedForEveryRawRadialRow: true,
      poisonedOrNonzeroRawBoundaryRowsStillProjectedBeforeOverwrite: true,
      multipoleMasks: [
        "scalar_all_q_at_radial_index_j=0",
        "scalar_all_q_at_radial_index_j=Nr-1",
        "potential_all_q_at_radial_index_j=Nr-1",
      ],
      countsPerLevel: [
        { levelId: "L0", scalar: 32, potential: 16, total: 48 },
        { levelId: "L1", scalar: 48, potential: 24, total: 72 },
        { levelId: "L2", scalar: 64, potential: 32, total: 96 },
      ],
      totals: { scalar: 144, potential: 72, all: 216 },
      overlappingMasksWriteOnce: true,
      preArithmeticMultipoleShortCircuitAllowed: false,
    },
    Gram: {
      definition: "G=B_transpose_times_B_with_identity_row_weights",
      computeOncePerLevelAndParity: true,
      loopOrder:
        "a_ascending_0_through_M-1_outer_b_ascending_0_through_a_middle_k_ascending_0_through_N-1_inner",
      primitiveProgram: [
        "acc=exact_+0",
        "product=RN256(B[k,a]*B[k,b])",
        "acc=RN256(acc+product)",
        "G[a,b]=acc_after_the_last_k",
        "G[b,a]=an_exact_MPFR_value_copy_of_G[a,b]_without_recomputation",
      ],
      producerSuppliedGramAccepted: false,
    },
    rightHandSide: {
      definition: "h=B_transpose_times_y",
      perRawRadialRow: true,
      preprojectionRadialMaskAllowed: false,
      loopOrder:
        "q_ascending_0_through_M-1_outer_k_ascending_0_through_N-1_inner",
      primitiveProgram: [
        "acc=exact_+0",
        "product=RN256(B[k,q]*exactly_reinjected_y[k])",
        "acc=RN256(acc+product)",
        "h[q]=acc_after_the_last_k",
      ],
    },
    noPivotCholesky: {
      factorization: "G=L_times_L_transpose",
      pivotingAllowed: false,
      diagonalJitterAllowed: false,
      combinedInterleavedLoopOrder:
        "for_i_ascending_0_through_M-1_first_compute_each_L[i,j]_for_j_ascending_0_through_i-1_with_k_ascending_0_through_j-1_then_compute_L[i,i]_with_k_ascending_0_through_i-1_before_advancing_to_i+1",
      perRowPrimitiveProgram: {
        offDiagonalForEachJBeforeThisRowsDiagonal: [
          "acc=G[i,j]",
          "for_k_ascending_0_through_j-1_product=RN256(L[i,k]*L[j,k])",
          "acc=RN256(acc-product)_after_each_k_product",
          "L[i,j]=RN256(acc/L[j,j])",
        ],
        diagonalAfterEveryOffDiagonalInThisRow: [
          "diagonalResidual=G[i,i]",
          "for_k_ascending_0_through_i-1_square=RN256(L[i,k]*L[i,k])",
          "diagonalResidual=RN256(diagonalResidual-square)_after_each_k_square",
          "require_diagonalResidual_is_finite_and_strictly_greater_than_positive_zero",
          "L[i,i]=RN256(sqrt(diagonalResidual))",
          "require_L[i,i]_is_finite_and_strictly_greater_than_positive_zero",
        ],
      },
      wholeOffDiagonalMatrixThenWholeDiagonalPassAllowed: false,
      anyNonpositiveOrNonfinitePivot:
        "typed_postprojection_cholesky_pivot_rejection_without_fallback_or_retune",
      producerSuppliedFactorAccepted: false,
    },
    triangularSolves: {
      forward: {
        equation: "L*t=h",
        loopOrder: "i_ascending_0_through_M-1_then_k_ascending_0_through_i-1",
        primitiveProgram: [
          "acc=h[i]",
          "product=RN256(L[i,k]*t[k])",
          "acc=RN256(acc-product)",
          "t[i]=RN256(acc/L[i,i])",
        ],
      },
      backward: {
        equation: "L_transpose*c=t",
        loopOrder:
          "i_descending_M-1_through_0_then_k_ascending_i+1_through_M-1",
        primitiveProgram: [
          "acc=t[i]",
          "product=RN256(L[k,i]*c[k])",
          "acc=RN256(acc-product)",
          "c[i]=RN256(acc/L[i,i])",
        ],
      },
      coefficientBarrier:
        "provisionalCoefficientBits[q]=mpfr_get_d(c[q],MPFR_RNDN)_exactly_once_at_barrier_provisionalPostprojectionCoefficientBits_then_reject_nonfinite_and_canonicalize_either_zero_sign_to_positive;the_required_postprojection_overwrites_follow_only_after_every_row_barrier",
    },
    phase: {
      scope: "one_independent_deterministic_scalar_phase_per_level",
      source:
        "masked_provisional_scalar_multipole_binary64_bits_at_the_maskedProvisionalMultipoleInputBits_barrier_after_the_coefficient_barrier_and_required_overwrites",
      provisionalDctComposition: {
        sourceBinding:
          "local_exact_masked_provisional_scalar_multipole_bits_before_phase_application",
        primitiveReuse:
          "reuse_only_the_exact_imported_radialDctI_DCT-I_normalization_cosine_primitive_program_loop_orders_and_binary64_reinjection_convention_under_the_local_provisional_source_binding",
        importedAcceptedPostprojectionSourceSemanticsReusedForProvisionalPass: false,
      },
      modeFirstProgram: [
        "for_q_ascending_0_through_M-1_reinject_the_exact_masked_provisional_binary64_radial_sequence_f_j_q_for_j_ascending_0_through_Nr-1",
        "for_this_q_execute_the_local_provisional-source_DCT-I_composition_to_compute_a_m_q_for_m_ascending_0_through_Nr-1",
        "derivativeXiAtPlusOne_q=exact_+0",
        "for_m_ascending_1_through_Nr-1_mSquared=exact_integer_m_times_m",
        "term_q_m=RN256(mSquared*a_m_q)",
        "derivativeXiAtPlusOne_q=RN256(derivativeXiAtPlusOne_q+term_q_m)",
        "a1_q=RN256(exact_-2*derivativeXiAtPlusOne_q)_because_xi=1-2*rho_and_partial_x_equals_partial_rho_at_rho=0",
        "a1Candidate=exact_+0_before_q=0_then_for_q_ascending_use_exact_P_(2q+1)(1)=1_and_a1Candidate=RN256(a1Candidate+a1_q)",
      ],
      synthesizeAxisValueBeforeModeDctAllowed: false,
      axisValueBinary64OrMpfrBarrierAllowed: false,
      selector:
        "phaseSign=+1_if_a1Candidate_is_strictly_positive_else_-1_if_strictly_negative_else_typed_zero_phase_rejection",
      MPFRValueComparisonAllowed: true,
      MPFRStatusFlagBranchingAllowed: false,
      provisionalA1ReceiptBarrier:
        "only_after_the_phaseSign_branch_has_queried_the_MPFR256_a1Candidate_value_provisionalA1Bits=mpfr_get_d(a1Candidate,MPFR_RNDN)_at_barrier_provisionalA1ReceiptBits_with_nonfinite_rejected_and_either_zero_sign_canonicalized_positive;the_bits_never_select_phaseSign_and_MPFR_zero_already_caused_rejection",
      application:
        "if_phaseSign=-1_flip_the_sign_bit_of_every_nonzero_finite_scalar_multipole_binary64_pattern_and_leave_every_zero_canonical_positive;potential_bits_are_unchanged",
      finalCheck:
        "reinject_final_accepted_scalar_bits_using_the_imported_accepted-postprojection-source_semantics_recompute_the_same_mode-first_per-q_DCT-I_primitive_program_then_q-ascending_a1_sum_graph_and_require_final_a1_strictly_positive",
      finalA1ReceiptBarrier:
        "only_after_the_final_MPFR256_value_is_recomputed_and_checked_strictly_positive_finalA1Bits=mpfr_get_d(finalA1,MPFR_RNDN)_at_barrier_finalA1ReceiptBits_then_the_receipt_requires_the_bits_decode_to_a_finite_strictly_positive_binary64_value",
      maxMinNorthAxisHeuristicAllowed: false,
      peakHeuristicAllowed: false,
      firstInteriorNodeHeuristicAllowed: false,
      crossLevelPhaseFallbackAllowed: false,
      zeroOrNonfiniteA1:
        "typed_postprojection_phase_rejection_without_fallback_or_retune",
    },
    reconstruction: {
      scalarSource:
        "same_level_phase_fixed_masked_scalar_multipole_binary64_bits",
      potentialSource: "same_level_masked_potential_multipole_binary64_bits",
      evaluator:
        "reuse_imported_analytic_z_reinjection_legendreForward_and_angularSynthesis_graphs",
      accumulationOrder: "q_ascending_0_through_modeCount-1",
      finalBarrier:
        "mpfr_get_d(acc,MPFR_RNDN)_once_per_unmasked_base_nodal_element_then_canonicalize_zero_positive",
      preArithmeticNodalMasks: [
        "scalar_radial_index_j=0",
        "scalar_radial_index_j=Nr-1",
        "scalar_angular_index_k=Ntheta-1",
        "potential_radial_index_j=Nr-1",
      ],
      maskedOutputBarrier:
        "every_pre-arithmetic_masked_base_nodal_entry_uses_symbolicBaseMaskBits_and_emits_literal_0000000000000000_without_evaluator_or_mpfr_get_d;any_observed_negative_zero_is_an_exact_byte_mismatch",
      nodalMaskCountsPerLevel: [
        { levelId: "L0", scalar: 126, potential: 32, total: 158 },
        { levelId: "L1", scalar: 190, potential: 48, total: 238 },
        { levelId: "L2", scalar: 254, potential: 64, total: 318 },
      ],
      nodalMaskTotals: { scalar: 570, potential: 144, all: 714 },
      exactByteComparison:
        "compare_the_complete_recomputed_f64le_byte_strings_to_the_observed_same_level_seed_v1_base_scalar_and_base_potential_arrays_not_only_their_hashes",
    },
    acceptance: {
      kind: "exact_deterministic_map_replay_only",
      perLevelConjunction: [
        "both_raw_evidence_arrays_pass_exact_inventory_and_byte_validation",
        "both_parity_Gram_Cholesky_factorizations_have_only_strictly_positive_finite_pivots",
        "recomputed_scalar_and_potential_multipole_bytes_equal_the_observed_seed_v1_array_bytes_exactly",
        "all_multipole_symbolic_masks_are_exact_positive_zero",
        "the_recomputed_final_scalar_a1_is_strictly_positive",
        "recomputed_base_scalar_and_potential_bytes_equal_the_observed_seed_v1_array_bytes_exactly",
        "all_base_nodal_symbolic_masks_are_exact_positive_zero",
      ],
      rawToReconstructionResidualThreshold: null,
      normalEquationResidualThreshold: null,
      toleranceBasedAcceptanceAllowed: false,
      projectionQualityMetricsMayBeDiagnosticOnly: true,
      scientificAcceptanceEstablished: false,
      seedAdmissionEstablished: false,
      artifactAdmissionEstablished: false,
      proofOrGatePassed: false,
      mismatch:
        "typed_postprojection_replay_rejection_without_tolerance_fallback_reprojection_retune_or_partial_acceptance",
    },
  } as const);

const IMPORTED_NUMERIC_STAGING_MANIFEST_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1
    .selectionDAG.verifierAdmissibilityDAG.producer32ArrayStagingEvidenceSchema;
const IMPORTED_V2_SECURE_STAGING_OBSERVATION_CLOSURE_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
    .schemas.secureStagingObservationClosure;
const IMPORTED_V2_FILE_OBSERVATION_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
    .schemas.fileObservation;

const RAW6_POST_STATE_ROOT_OBSERVATION_SCHEMA = deepFreeze({
  schemaVersion:
    "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_post_state_root_observation/v1",
  exactKeys: [
    "schemaVersion",
    "successorRunPlanBinding",
    "commonRunRequestBinding",
    "producerEnforcementReceiptBinding",
    "rootAbsolutePath",
    "rootMountId",
    "rootDeviceId",
    "rootInode",
    "rootModeFileType",
    "rootListingSha256",
    "rootEntryCount",
    "levelDirectories",
    "secureResolutionPassed",
    "statReadStatStable",
    "noExtraEntriesPassed",
    "allPassed",
  ],
  extraKeysAllowed: false,
  fields: {
    schemaVersion: "literal_schema_version",
    successorRunPlanBinding: "exact_future_successor_run_plan_binding",
    commonRunRequestBinding: "exact_same_common_run_request_binding",
    producerEnforcementReceiptBinding:
      "exact_same_successful_producer_enforcement_receipt_binding",
    rootAbsolutePath: "literal_/run/postprojection-evidence",
    rootMountId: "canonical_unsigned_decimal_string",
    rootDeviceId: "canonical_unsigned_decimal_string",
    rootInode: "canonical_unsigned_decimal_string",
    rootModeFileType: "literal_directory",
    rootListingSha256:
      "exact_64_lowercase_hex_SHA256_under_listingHashRecipe_for_the_three_exact_root_entries",
    rootEntryCount: "literal_3",
    levelDirectories: {
      kind: "tuple",
      exactLength: 3,
      order: "literal_L0_then_L1_then_L2",
      itemExactKeys: [
        "levelId",
        "absolutePath",
        "mountId",
        "deviceId",
        "inode",
        "modeFileType",
        "listingSha256",
        "entryCount",
        "fileEntries",
        "secureResolutionPassed",
        "statReadStatStable",
        "noExtraEntriesPassed",
      ],
      itemExtraKeysAllowed: false,
      itemFields: {
        levelId: "literal_indexed_L0_or_L1_or_L2",
        absolutePath: "literal_/run/postprojection-evidence/{same_levelId}",
        mountId: "same_canonical_unsigned_decimal_string_as_rootMountId",
        deviceId: "canonical_unsigned_decimal_string",
        inode: "canonical_unsigned_decimal_string_unique_across_levels",
        modeFileType: "literal_directory",
        listingSha256:
          "exact_64_lowercase_hex_SHA256_under_listingHashRecipe_for_the_two_exact_file_entries",
        entryCount: "literal_2",
        fileEntries: {
          kind: "tuple",
          exactLength: 2,
          order: "literal_00-raw-scalar-u_then_01-raw-potential-v",
          itemExactKeys: ["name", "evidenceIndex", "fileObservation"],
          itemExtraKeysAllowed: false,
          itemFields: {
            name: "literal_indexed_inventory_basename",
            evidenceIndex: "literal_indexed_evidenceIndex_0_through_5",
            fileObservation: IMPORTED_V2_FILE_OBSERVATION_SCHEMA,
          },
        },
        secureResolutionPassed: "literal_true",
        statReadStatStable: "literal_true",
        noExtraEntriesPassed: "literal_true",
      },
      exactEntryExpectations: [
        {
          levelId: "L0",
          absolutePath: "/run/postprojection-evidence/L0",
          entryCount: 2,
          fileNames: ["00-raw-scalar-u.f64le", "01-raw-potential-v.f64le"],
          evidenceIndices: [0, 1],
        },
        {
          levelId: "L1",
          absolutePath: "/run/postprojection-evidence/L1",
          entryCount: 2,
          fileNames: ["00-raw-scalar-u.f64le", "01-raw-potential-v.f64le"],
          evidenceIndices: [2, 3],
        },
        {
          levelId: "L2",
          absolutePath: "/run/postprojection-evidence/L2",
          entryCount: 2,
          fileNames: ["00-raw-scalar-u.f64le", "01-raw-potential-v.f64le"],
          evidenceIndices: [4, 5],
        },
      ],
    },
    secureResolutionPassed: "literal_true",
    statReadStatStable: "literal_true",
    noExtraEntriesPassed: "literal_true",
    allPassed:
      "literal_true_iff_every_root_level_and_file_identity_listing_secure-resolution_stability_exact-count_and_no-extra_check_passed",
  },
  listingHashRecipe: {
    sha256Domain:
      "nhm2-prolate-boson-star-newtonian-seed-postprojection/raw6-directory-listing/v1\n",
    domainEndsWithExactlyOneLf: true,
    entryEncoding:
      "u64be(entry_count)_then_for_each_bytewise-name-ascending_entry_u8(type_1_directory_2_regular_file)+u64be(name_utf8_length)+name_utf8",
    hashExpression:
      "sha256(domainUtf8||u64be(encodedListingByteLength)||encodedListingBytes)",
    symlinkHardlinkReparsePointMagiclinkOrMountCrossingAllowed: false,
  },
  crossFieldInvariants: [
    "root_listing_contains_exactly_the_three_directories_L0_L1_L2_and_no_other_entry",
    "each_level_listing_contains_exactly_the_two_named_regular_files_and_no_other_entry",
    "all_six_embedded_fileObservation_values_recursively_equal_the_same-index_raw6SecureObservationClosure.arrayObservations_values",
    "all_directory_and_file_observations_are_beneath_one_resolved_root_mount_with_no_symlink_magiclink_reparse-point_or_mount crossing_and_every_file_linkCount_is_literal_one",
  ],
  bindingRecipe: closedRuntimeBindingRecipe(
    "nhm2.prolate_boson_star.newtonian_seed.postprojection_raw6_post_state_root_observation",
    "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_post_state_root_observation/v1",
    "nhm2-prolate-boson-star-newtonian-seed-postprojection/raw6-post-state-root-observation/v1\n",
  ),
} as const);

const projectionImplementationSchema = (role: "producer" | "verifier") => ({
  schemaVersion: `nhm2_prolate_boson_star_newtonian_seed_postprojection_${role}_projection_implementation/v1`,
  exactKeys: [
    "schemaVersion",
    "role",
    "sourceRootLabel",
    "sourceEntryCount",
    "sourceEntries",
    "sourceManifestSha256",
    "toolchainEntryCount",
    "toolchainEntries",
    "executableObservation",
    "allPassed",
  ],
  extraKeysAllowed: false,
  fields: {
    schemaVersion: "literal_schema_version",
    role: `literal_${role}`,
    sourceRootLabel: `literal_${role}_projection_source_root`,
    sourceEntryCount: "safe_positive_integer_equal_to_sourceEntries_length",
    sourceEntries: {
      kind: "tuple",
      minimumLength: 1,
      maximumLength: 4_096,
      order: "relativePath_UTF8_bytewise_ascending",
      itemExactKeys: ["ordinal", "relativePath", "byteLength", "sha256"],
      itemExtraKeysAllowed: false,
      itemFields: {
        ordinal: "safe_nonnegative_integer_equal_to_tuple_index",
        relativePath:
          "canonical_relative_POSIX_path_no_dot_dot_no_empty_segment",
        byteLength: "safe_nonnegative_integer",
        sha256: "exact_64_lowercase_hex_SHA256_of_source_file_bytes",
      },
    },
    sourceManifestSha256:
      "exact_hash_of_sourceEntries_under_sourceManifestHashRecipe",
    toolchainEntryCount:
      "safe_positive_integer_equal_to_toolchainEntries_length",
    toolchainEntries: {
      kind: "tuple",
      minimumLength: 1,
      maximumLength: 64,
      order: "component_UTF8_bytewise_ascending",
      itemExactKeys: ["component", "version", "abi", "binarySha256"],
      itemExtraKeysAllowed: false,
      itemFields: {
        component: "nonempty_UTF8_component_identifier",
        version: "nonempty_exact_version_string",
        abi: "nonempty_exact_ABI_identifier",
        binarySha256: "exact_64_lowercase_hex_SHA256",
      },
    },
    executableObservation: IMPORTED_V2_FILE_OBSERVATION_SCHEMA,
    allPassed:
      "literal_true_iff_every_static_source_toolchain_and_executable_identity_hash_check_passed",
  },
  sourceManifestHashRecipe: {
    sha256Domain: `nhm2-prolate-boson-star-newtonian-seed-postprojection/${role}-projection-source-manifest/v1\n`,
    domainEndsWithExactlyOneLf: true,
    entryEncoding:
      "u64be(entry_count)_then_each_entry_as_u64be(ordinal)+u64be(relativePath_utf8_length)+relativePath_utf8+u64be(byteLength)+sha256_digest_bytes",
    hashExpression:
      "sha256(domainUtf8||u64be(encodedManifestByteLength)||encodedManifestBytes)",
  },
  crossFieldInvariants: [
    "sourceEntries_are_securely_observed_complete_role-specific_projection_sources_with_no_unlisted_generated_projector_Gram_Cholesky_or_coefficient_table",
    "toolchainEntries_bind_the_exact_static_component_version_ABI_and_binary_hash_inventory_used_to_build_or_package_the_observed_executable_without_claiming_which_future_process_launch_uses_it",
    "executableObservation.sha256_equals_the_securely_observed_executable_bytes_selected_by_the_static_source-and-toolchain_evidence",
    "this_static_implementation_evidence_contains_no_run-request_launch-envelope_enforcement-context_mount_cgroup_namespace_or_runtime-conformance_binding_and_grants_no_same-attempt_or_runtime-isolation_authority",
  ],
  bindingRecipe: closedRuntimeBindingRecipe(
    `nhm2.prolate_boson_star.newtonian_seed.postprojection_${role}_projection_implementation`,
    `nhm2_prolate_boson_star_newtonian_seed_postprojection_${role}_projection_implementation/v1`,
    `nhm2-prolate-boson-star-newtonian-seed-postprojection/${role}-projection-implementation/v1\n`,
  ),
});

const PRODUCER_PROJECTION_IMPLEMENTATION_SCHEMA = deepFreeze(
  projectionImplementationSchema("producer"),
);
const VERIFIER_PROJECTION_IMPLEMENTATION_SCHEMA = deepFreeze(
  projectionImplementationSchema("verifier"),
);

const IMPLEMENTATION_SEPARATION_RECEIPT_SCHEMA = deepFreeze({
  schemaVersion:
    "nhm2_prolate_boson_star_newtonian_seed_postprojection_implementation_separation_receipt/v1",
  exactKeys: [
    "schemaVersion",
    "producerProjectionImplementationBinding",
    "verifierProjectionImplementationBinding",
    "producerSourceManifestSha256",
    "verifierSourceManifestSha256",
    "producerExecutableSha256",
    "verifierExecutableSha256",
    "separationChecks",
    "allPassed",
  ],
  extraKeysAllowed: false,
  fields: {
    schemaVersion: "literal_schema_version",
    producerProjectionImplementationBinding:
      "exact_binding_of_one_valid_static_producerProjectionImplementation_instance",
    verifierProjectionImplementationBinding:
      "exact_binding_of_one_valid_static_verifierProjectionImplementation_instance",
    producerSourceManifestSha256:
      "exact_resolved_producer_instance_sourceManifestSha256",
    verifierSourceManifestSha256:
      "exact_resolved_verifier_instance_sourceManifestSha256",
    producerExecutableSha256:
      "exact_resolved_producer_instance_executableObservation.sha256",
    verifierExecutableSha256:
      "exact_resolved_verifier_instance_executableObservation.sha256",
    separationChecks: {
      kind: "tuple",
      exactLength: 6,
      itemExactKeys: ["checkId", "passed"],
      itemExtraKeysAllowed: false,
      exactCheckIdsInOrder: [
        "implementation_bindings_differ",
        "source_manifest_hashes_differ",
        "executable_hashes_differ",
        "producer_source_does_not_import_verifier_projection",
        "verifier_source_does_not_import_or_invoke_producer_projection",
        "no_shared_generated_projector_Gram_Cholesky_or_coefficient_table",
      ],
      passed: "literal_true_for_every_entry",
    },
    allPassed: "literal_true_iff_all_6_static_separationChecks_are_true",
  },
  crossFieldInvariants: [
    "both_implementation_bindings_resolve_under_the_exact_role-specific_static_source_toolchain_and_executable_schemas",
    "the_resolved_source_entries_toolchain_entries_and_executable_observations_satisfy_each_literal_static_check_without_trusting_self-reported_summaries",
    "producer_and_verifier_may_share_policy_text_and_libraries_but_may_share_no_generated_projection_arithmetic_artifact_or_runtime_callback",
    "this_receipt_contains_no_launch_enforcement_mount_namespace_cgroup_or_process-observation_evidence_and_does_not_establish_same-attempt_execution_or_runtime_isolation",
  ],
  evidenceMaturity:
    "static_prelaunch_source_toolchain_executable_separation_only",
  brokerSameAttemptEstablished: false,
  runtimeIsolationEstablished: false,
  bindingRecipe: closedRuntimeBindingRecipe(
    "nhm2.prolate_boson_star.newtonian_seed.postprojection_implementation_separation_receipt",
    "nhm2_prolate_boson_star_newtonian_seed_postprojection_implementation_separation_receipt/v1",
    "nhm2-prolate-boson-star-newtonian-seed-postprojection/implementation-separation-receipt/v1\n",
  ),
} as const);

const MPFR_GMP_RUNTIME_CONFORMANCE_RECEIPT_SCHEMA = deepFreeze({
  schemaVersion:
    "nhm2_prolate_boson_star_newtonian_seed_postprojection_mpfr_gmp_runtime_conformance_receipt/v1",
  exactKeys: [
    "schemaVersion",
    "successorRunPlanBinding",
    "commonRunRequestBinding",
    "mpfrBinarySha256",
    "mpfrVersion",
    "mpfrAbi",
    "gmpBinarySha256",
    "gmpVersion",
    "gmpAbi",
    "eminSetExact",
    "emaxSetExact",
    "exponentRangeSetSucceeded",
    "nonconcurrentExponentRangeMutation",
    "everyDestinationPrecisionBits",
    "flagsClearedAtNamedBoundaries",
    "noFlagDependentBranching",
    "binary64GradualUnderflowRNDNTiesToEven",
    "flushToZeroDisabled",
    "denormalsAreZeroDisabled",
    "allPassed",
  ],
  extraKeysAllowed: false,
  fields: {
    schemaVersion: "literal_schema_version",
    successorRunPlanBinding: "exact_future_successor_run_plan_binding",
    commonRunRequestBinding: "exact_same_common_run_request_binding",
    mpfrBinarySha256: "exact_64_lowercase_hex_SHA256",
    mpfrVersion: "exact_nonempty_version_string",
    mpfrAbi: "exact_nonempty_ABI_identifier",
    gmpBinarySha256: "exact_64_lowercase_hex_SHA256",
    gmpVersion: "exact_nonempty_version_string",
    gmpAbi: "exact_nonempty_ABI_identifier",
    eminSetExact: "literal_-1000000",
    emaxSetExact: "literal_1000000",
    exponentRangeSetSucceeded: "literal_true",
    nonconcurrentExponentRangeMutation: "literal_true",
    everyDestinationPrecisionBits: "literal_256",
    flagsClearedAtNamedBoundaries: "literal_true",
    noFlagDependentBranching: "literal_true",
    binary64GradualUnderflowRNDNTiesToEven: "literal_true",
    flushToZeroDisabled: "literal_true",
    denormalsAreZeroDisabled: "literal_true",
    allPassed:
      "literal_true_iff_every_imported_arithmeticKernel_runtimeConformanceBindingRequirements_field_is_present_exact_and_positive",
  },
  importedRequirementExactKeys:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH
      .arithmeticKernel.runtimeConformanceBindingRequirements.exactKeys,
  bindingRecipe: closedRuntimeBindingRecipe(
    "nhm2.prolate_boson_star.newtonian_seed.postprojection_mpfr_gmp_runtime_conformance_receipt",
    "nhm2_prolate_boson_star_newtonian_seed_postprojection_mpfr_gmp_runtime_conformance_receipt/v1",
    "nhm2-prolate-boson-star-newtonian-seed-postprojection/mpfr-gmp-runtime-conformance-receipt/v1\n",
  ),
} as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS =
  deepFreeze({
    raw6PostStateRootObservation: RAW6_POST_STATE_ROOT_OBSERVATION_SCHEMA,
    mpfrGmpRuntimeConformanceReceipt:
      MPFR_GMP_RUNTIME_CONFORMANCE_RECEIPT_SCHEMA,
    producerProjectionImplementation: PRODUCER_PROJECTION_IMPLEMENTATION_SCHEMA,
    verifierProjectionImplementation: VERIFIER_PROJECTION_IMPLEMENTATION_SCHEMA,
    implementationSeparationReceipt: IMPLEMENTATION_SEPARATION_RECEIPT_SCHEMA,
    importedDependencies: {
      predecessorRunPlanV2Binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
      predecessorRuntimeChannelSchemaRegistryBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
      inheritedV2SecureStagingObservationClosureSchema:
        IMPORTED_V2_SECURE_STAGING_OBSERVATION_CLOSURE_SCHEMA,
      inheritedV2FileObservationSchema: IMPORTED_V2_FILE_OBSERVATION_SCHEMA,
      numericPolicyStagingManifestSchema:
        IMPORTED_NUMERIC_STAGING_MANIFEST_SCHEMA,
      numericPolicyStagingManifestBindingRecipe:
        IMPORTED_NUMERIC_STAGING_MANIFEST_SCHEMA.bindingRecipe,
      numericPolicyStagingManifestSha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_PRODUCER_32_ARRAY_STAGING_SHA256_DOMAIN,
      numericPolicyStagingEntryExpectations:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_STAGING_ENTRY_EXPECTATIONS,
      everyImportedObjectRequiresAuthoritativeSingletonIdentity: true,
    },
    raw6SecureObservationClosure: {
      schemaVersion:
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_secure_observation_closure/v1",
      exactKeys: [
        "schemaVersion",
        "predecessorRunPlanV2Binding",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "producerClosedOutputObservationBinding",
        "producerEnforcementReceiptBinding",
        "postprojectionEvidenceDirectoryPrestateReceiptBinding",
        "clockId",
        "observationStartMonotonicNanoseconds",
        "observationEndMonotonicNanoseconds",
        "recursivePostStateRootObservation",
        "arrayObservations",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion: "literal_schema_version",
        predecessorRunPlanV2Binding:
          "exact_imported_predecessor_run_plan_v2_binding",
        successorRunPlanBinding: "exact_future_successor_run_plan_binding",
        commonRunRequestBinding: "one_exact_common_run_request_binding",
        producerClosedOutputObservationBinding:
          "one_pre-enforcement_broker_closed-output_observation_binding_enumerating_exactly_38_producer_files_across_the_disjoint_raw6_and_seed32_roots",
        producerEnforcementReceiptBinding:
          "one_successful_producer_enforcement_receipt_binding_closed_before_this_observation_and_recursively_binding_producerClosedOutputObservationBinding",
        postprojectionEvidenceDirectoryPrestateReceiptBinding:
          "one_broker_directory_prestate_receipt_binding_for_the_exact_empty_then_producer-written_/run/postprojection-evidence_root",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        observationStartMonotonicNanoseconds:
          "canonical_unsigned_decimal_string",
        observationEndMonotonicNanoseconds:
          "canonical_unsigned_decimal_string_not_before_start",
        recursivePostStateRootObservation:
          RAW6_POST_STATE_ROOT_OBSERVATION_SCHEMA,
        arrayObservations: {
          kind: "tuple",
          exactLength: 6,
          order: "evidenceIndex_ascending_0_through_5",
          exactAbsolutePathOrder:
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY.map(
              (entry) => entry.absoluteEvidencePath,
            ),
          itemSchema: IMPORTED_V2_FILE_OBSERVATION_SCHEMA,
          noSparseEntriesOrExtraProperties: true,
        },
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "producerEnforcementReceiptBinding_resolves_to_the_same_common_run_and_a_preceding_successful_producer_exit_whose_closed-output_observation_contains_the_raw6_and_seed32_files_but_does_not_bind_any_future_secure_observation_closure",
        "producerClosedOutputObservationBinding_recursively_enumerates_exactly_38_regular_single-link_files_total_composed_of_the_exact_6_raw_evidence_paths_and_exact_32_seed_staging_paths_under_two_disjoint_roots_with_no_extra_entries_links_reparse_points_or_mount_crossings",
        "recursivePostStateRootObservation_recursively_enumerates_only_root_directories_L0_L1_L2_and_exactly_the_two_inventory-named_regular_files_per_level_with_no_extra_root_or_level_entries",
        "all_six_observations_are_post-exit_broker_secure_rereads_using_the_inherited_v2_fileObservation_schema_and_exact_paths_sizes_regular-file_single-link_secure-resolution_and_stat-read-stat_rules",
        "the_observation_interval_is_after_producer_enforcement_closure_and_before_any_postprojection_or_numeric_replay",
      ],
      bindingRecipe: closedRuntimeBindingRecipe(
        "nhm2.prolate_boson_star.newtonian_seed.postprojection_raw6_secure_observation_closure",
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_secure_observation_closure/v1",
        "nhm2-prolate-boson-star-newtonian-seed-postprojection/raw6-secure-observation-closure/v1\n",
      ),
    },
    raw6Manifest: {
      schemaVersion:
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_manifest/v1",
      exactKeys: [
        "schemaVersion",
        "seedBinding",
        "policyBinding",
        "operationGraphBinding",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "producerEnforcementReceiptBinding",
        "entryCount",
        "entries",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion: "literal_schema_version",
        seedBinding: "exact_bound_seed_v1_binding",
        policyBinding: "exact_bound_postprojection_policy_binding",
        operationGraphBinding:
          "exact_bound_postprojection_operation_graph_binding",
        successorRunPlanBinding: "exact_same_future_successor_run_plan_binding",
        commonRunRequestBinding: "exact_same_common_run_request_binding",
        producerEnforcementReceiptBinding:
          "exact_same_successful_producer_enforcement_receipt_binding",
        entryCount: "literal_6",
        entries: {
          kind: "tuple",
          exactLength: 6,
          order: "evidenceIndex_ascending_0_through_5",
          itemExactKeys: [
            "evidenceIndex",
            "levelId",
            "role",
            "parity",
            "relativePath",
            "shape",
            "elementCount",
            "byteLength",
            "dtype",
            "order",
            "plainSha256",
            "domainSha256",
          ],
          itemExtraKeysAllowed: false,
          itemFieldTypes: {
            evidenceIndex: "safe_nonnegative_integer_exact_index_0_through_5",
            levelId: "literal_inventory_levelId",
            role: "literal_inventory_role",
            parity: "literal_inventory_parity",
            relativePath: "literal_inventory_relativePath",
            shape: "exact_two_safe-positive-integer_tuple_from_inventory",
            elementCount: "safe_positive_integer_exact_inventory_value",
            byteLength: "safe_positive_integer_exact_inventory_value",
            dtype: "literal_float64_le",
            order: "literal_C_row_major_radial_index_outer_angular_index_inner",
            plainSha256: "exact_64_lowercase_hex_SHA256_of_secure_raw_bytes",
            domainSha256:
              "exact_64_lowercase_hex_SHA256_recomputed_under_rawEvidenceHashPolicy",
          },
          exactInventoryExpectations:
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY.map(
              ({
                evidenceIndex,
                levelId,
                role,
                parity,
                relativePath,
                shape,
                elementCount,
                byteLength,
                dtype,
                order,
              }) => ({
                evidenceIndex,
                levelId,
                role,
                parity,
                relativePath,
                shape,
                elementCount,
                byteLength,
                dtype,
                order,
              }),
            ),
          noSparseEntriesOrExtraProperties: true,
        },
      },
      bindingRecipe: closedRuntimeBindingRecipe(
        "nhm2.prolate_boson_star.newtonian_seed.postprojection_raw6_manifest",
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_manifest/v1",
        "nhm2-prolate-boson-star-newtonian-seed-postprojection/raw6-manifest/v1\n",
      ),
    },
    raw6SecureToManifestProjectionReceipt: {
      schemaVersion:
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_secure_to_manifest_projection_receipt/v1",
      exactKeys: [
        "schemaVersion",
        "secureObservationClosureBinding",
        "rawEvidenceManifestBinding",
        "entryCount",
        "entries",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion: "literal_schema_version",
        secureObservationClosureBinding:
          "exact_bound_raw6SecureObservationClosure_instance",
        rawEvidenceManifestBinding: "exact_bound_raw6Manifest_instance",
        entryCount: "literal_6",
        entries: {
          kind: "tuple",
          exactLength: 6,
          order: "evidenceIndex_ascending_0_through_5",
          itemExactKeys: [
            "evidenceIndex",
            "secureObservationIndex",
            "manifestEntryIndex",
            "absolutePath",
            "relativePath",
            "byteLength",
            "secureObservationSha256",
            "manifestPlainSha256",
            "manifestDomainSha256",
            "fieldwiseMatched",
          ],
          itemExtraKeysAllowed: false,
          itemSemantics:
            "indices_are_the_same_literal_index_absolutePath_equals_/run/postprojection-evidence/+relativePath_byteLength_equals_inventory_and_both_sources_secureObservationSha256_equals_the_inherited_fileObservation.sha256_manifestPlainSha256_equals_raw6Manifest.plainSha256_the_two_plain_hashes_are_equal_manifestDomainSha256_recomputes_from_the_securely_reread_bytes_under_rawEvidenceHashPolicy_and_fieldwiseMatched_is_literal_true",
        },
        allPassed: "literal_true_iff_all_six_fieldwiseMatched_are_true",
      },
      bindingRecipe: closedRuntimeBindingRecipe(
        "nhm2.prolate_boson_star.newtonian_seed.postprojection_raw6_secure_to_manifest_projection_receipt",
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_secure_to_manifest_projection_receipt/v1",
        "nhm2-prolate-boson-star-newtonian-seed-postprojection/raw6-secure-to-manifest-projection/v1\n",
      ),
    },
    rawEvidenceRuntimeClosure: {
      schemaVersion:
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_runtime_closure/v1",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "producerEnforcementReceiptBinding",
        "secureObservationClosureBinding",
        "rawEvidenceManifestBinding",
        "secureToManifestProjectionReceiptBinding",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion: "literal_schema_version",
        successorRunPlanBinding:
          "exact_future_successor_run_plan_binding_shared_by_all_components",
        commonRunRequestBinding:
          "exact_common_run_request_binding_shared_by_all_components",
        producerEnforcementReceiptBinding:
          "exact_successful_producer_enforcement_receipt_binding_shared_by_all_components",
        secureObservationClosureBinding:
          "exact_raw6SecureObservationClosure_binding",
        rawEvidenceManifestBinding: "exact_raw6Manifest_binding",
        secureToManifestProjectionReceiptBinding:
          "exact_positive_raw6SecureToManifestProjectionReceipt_binding",
      },
      bindingRecipe: closedRuntimeBindingRecipe(
        "nhm2.prolate_boson_star.newtonian_seed.postprojection_raw6_runtime_closure",
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw6_runtime_closure/v1",
        "nhm2-prolate-boson-star-newtonian-seed-postprojection/raw6-runtime-closure/v1\n",
      ),
    },
    numericStaging32SecureToManifestProjectionReceipt: {
      schemaVersion:
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_seed32_secure_to_numeric_manifest_projection_receipt/v1",
      exactKeys: [
        "schemaVersion",
        "inheritedV2SecureStagingObservationClosureBinding",
        "numericPolicyStagingManifestBinding",
        "entryCount",
        "entries",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion: "literal_schema_version",
        inheritedV2SecureStagingObservationClosureBinding:
          "binding_of_one_instance_validated_against_the_exact_imported_v2_secureStagingObservationClosure_schema",
        numericPolicyStagingManifestBinding:
          "binding_recomputed_by_the_exact_imported_numeric_policy_producer32ArrayStagingEvidenceSchema.bindingRecipe",
        entryCount: "literal_32",
        entries: {
          kind: "tuple",
          exactLength: 32,
          order: "inventoryIndex_ascending_0_through_31",
          itemExactKeys: [
            "inventoryIndex",
            "secureObservationIndex",
            "stagingManifestEntryIndex",
            "absolutePath",
            "relativePath",
            "byteLength",
            "secureObservationSha256",
            "manifestRawArraySha256",
            "fieldwiseMatched",
          ],
          itemExtraKeysAllowed: false,
          itemSemantics:
            "all_three_indices_are_the_same_literal_index_absolutePath_equals_/run/staging/+relativePath_the_first_eight_imported_numeric_manifest_entry_fields_equal_the_same_imported_STAGING_ENTRY_EXPECTATIONS_entry_secureObservationSha256_equals_the_inherited_v2_fileObservation.sha256_manifestRawArraySha256_equals_the_numeric_manifest_rawArraySha256_the_two_hashes_are_equal_and_fieldwiseMatched_is_literal_true",
        },
        allPassed: "literal_true_iff_all_32_fieldwiseMatched_are_true",
      },
      bindingRecipe: closedRuntimeBindingRecipe(
        "nhm2.prolate_boson_star.newtonian_seed.postprojection_seed32_secure_to_numeric_manifest_projection_receipt",
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_seed32_secure_to_numeric_manifest_projection_receipt/v1",
        "nhm2-prolate-boson-star-newtonian-seed-postprojection/seed32-secure-to-numeric-manifest-projection/v1\n",
      ),
    },
    numericStaging32RuntimeClosure: {
      schemaVersion:
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_numeric_staging32_runtime_closure/v1",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "producerEnforcementReceiptBinding",
        "inheritedV2SecureStagingObservationClosureBinding",
        "numericPolicyStagingManifestBinding",
        "secureToNumericManifestProjectionReceiptBinding",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion: "literal_schema_version",
        successorRunPlanBinding:
          "exact_future_successor_run_plan_binding_shared_by_all_components",
        commonRunRequestBinding:
          "exact_common_run_request_binding_shared_by_all_components",
        producerEnforcementReceiptBinding:
          "exact_successful_producer_enforcement_receipt_binding_shared_by_all_components",
        inheritedV2SecureStagingObservationClosureBinding:
          "exact_binding_of_the_inherited_v2_secure_staging_observation_closure_instance",
        numericPolicyStagingManifestBinding:
          "exact_binding_of_the_imported_numeric_policy_staging_manifest_instance",
        secureToNumericManifestProjectionReceiptBinding:
          "exact_positive_seed32_secure_to_numeric_manifest_projection_receipt_binding",
      },
      bindingRecipe: closedRuntimeBindingRecipe(
        "nhm2.prolate_boson_star.newtonian_seed.postprojection_numeric_staging32_runtime_closure",
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_numeric_staging32_runtime_closure/v1",
        "nhm2-prolate-boson-star-newtonian-seed-postprojection/numeric-staging32-runtime-closure/v1\n",
      ),
    },
    candidateInstanceIdentity: {
      schemaVersion:
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_candidate_instance_identity/v1",
      exactKeys: [
        "schemaVersion",
        "commonRunRequestBinding",
        "producerEnforcementReceiptBinding",
        "numericStaging32RuntimeClosureBinding",
        "rawEvidenceRuntimeClosureBinding",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion: "literal_schema_version",
        commonRunRequestBinding:
          "one_broker_replayed_common_run_request_instance_binding",
        producerEnforcementReceiptBinding:
          "one_successful_producer_stage_enforcement_receipt_binding_for_the_same_run",
        numericStaging32RuntimeClosureBinding:
          "one_exact_numericStaging32RuntimeClosure_composite_binding",
        rawEvidenceRuntimeClosureBinding:
          "one_exact_rawEvidenceRuntimeClosure_composite_binding",
      },
      crossFieldIdentity:
        "both_composites_recursively_bind_the_same_commonRunRequestBinding_producerEnforcementReceiptBinding_successorRunPlanBinding_and_the_same_pre-verifier_post-producer-exit_snapshot_while_their_roots_and_entry_sets_are_nonoverlapping",
      bindingRecipe: closedRuntimeBindingRecipe(
        "nhm2.prolate_boson_star.newtonian_seed.postprojection_candidate_instance_identity",
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_candidate_instance_identity/v1",
        "nhm2-prolate-boson-star-newtonian-seed-postprojection/candidate-instance-identity/v1\n",
      ),
    },
    chronology: {
      exactAcyclicOrder: [
        "O_pre_enforcement_closed_producer_output_observation_of_raw6_plus_seed32",
        "E_producer_enforcement_receipt_binding_O",
        "S6_and_S32_post_enforcement_secure_observation_closures_binding_E",
        "R6_and_N32_manifests_and_their_S_to_manifest_projection_receipts",
        "P_candidate_postprojection_math_match-or-typed-rejection_value_computed_from_R6_N32_and_static_implementation_evidence_without_transport_runtime-isolation_or_registration_authority",
      ],
      producerEnforcementReceiptMayBindFutureSecureClosures: false,
      candidateReceiptTransportOrCompositeOutputPathDefined: false,
      candidateReceiptMayBindFutureEnforcementOrRegistrationEvidence: false,
      brokerSameAttemptEstablished: false,
      runtimeIsolationEstablished: false,
      authoritativeRegistrationAllowed: false,
      postprojectionReceiptMayBindFutureNumericReplayOrFullAdmission: false,
      futureV3CompositeMustPreserveThreeStageTopology: true,
      futureV3MustCrossBindTheSameN32ManifestNamedByTheS32N32Composite: true,
      futureV3RequiredSingleVerifierPreExitOrder: [
        "compute_untrusted_candidate_P_postprojection_math_match",
        "only_if_candidate_P_matches_compute_untrusted_candidate_N_numeric_replay",
        "only_if_candidate_N_matches_compute_untrusted_candidate_F_full-gate_result",
        "close_exactly_one_successor-bound_composite_replay_bundle_containing_candidate_P_then_N_then_F",
        "single_verifier_exit",
      ],
      futureV3RequiredPostExitOrder: [
        "full_successor_verifier_output-observation_and_enforcement",
        "broker_runtime-separation_and_typed-interpreter_validation_of_the_one_composite_bundle",
        "atomic_dependency-ordered_registration_of_nested_P_then_N_then_F_bindings",
      ],
      postExitCandidateComputationAllowed: false,
      standaloneCandidatePOutputAllowed: false,
      secondVerifierStageAllowed: false,
      temporalCycleAllowed: false,
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.postprojection_replay_receipt_schema",
    schemaVersion:
      "nhm2.prolate_boson_star.newtonian_seed.postprojection_replay_receipt_schema/v1",
    discriminator: { field: "outcome", values: ["match", "rejection"] },
    matchExactKeys: [
      "schemaVersion",
      "outcome",
      "policyBinding",
      "operationGraphBinding",
      "seedV1Binding",
      "candidatePlanV2Binding",
      "successorRunPlanBinding",
      "candidateInstanceIdentity",
      "candidateInstanceIdentityBinding",
      "numericMaterializationPolicyBinding",
      "numericMaterializationOperationGraphBinding",
      "mpfrGmpRuntimeBinding",
      "producerProjectionImplementationBinding",
      "verifierProjectionImplementationBinding",
      "implementationSeparationReceiptBinding",
      "rawEvidenceInventoryBinding",
      "levelReceipts",
      "allRawEvidenceBytesReplayed",
      "allCholeskyPivotsStrictlyPositive",
      "allMultipoleBytesMatched",
      "allReconstructionBytesMatched",
      "allMasksMatched",
      "allPhasesMatched",
      "allReplayMatched",
      "brokerSameAttemptEstablished",
      "runtimeIsolationEstablished",
      "authoritativeRegistrationAllowed",
      "scientificAdmissionGranted",
      "seedAdmissionGranted",
      "artifactAdmissionGranted",
    ],
    rejectionExactKeys: [
      "schemaVersion",
      "outcome",
      "policyBinding",
      "operationGraphBinding",
      "seedV1Binding",
      "candidatePlanV2Binding",
      "successorRunPlanBindingOrNull",
      "candidateInstanceIdentityOrNull",
      "candidateInstanceIdentityBindingOrNull",
      "numericStaging32RuntimeClosureBindingOrNull",
      "rawEvidenceRuntimeClosureBindingOrNull",
      "numericMaterializationPolicyBinding",
      "numericMaterializationOperationGraphBinding",
      "attemptedMpfrGmpRuntimeBindingOrNull",
      "attemptedProducerProjectionImplementationBindingOrNull",
      "attemptedVerifierProjectionImplementationBindingOrNull",
      "attemptedImplementationSeparationReceiptBindingOrNull",
      "failureCode",
      "firstMismatch",
      "positiveReplayBinding",
      "brokerSameAttemptEstablished",
      "runtimeIsolationEstablished",
      "authoritativeRegistrationAllowed",
      "scientificAdmissionGranted",
      "seedAdmissionGranted",
      "artifactAdmissionGranted",
    ],
    extraKeysAllowed: false,
    matchFields: {
      schemaVersion: "literal_receipt_schemaVersion",
      outcome: "literal_match",
      policyBinding: "exact_bound_postprojection_policy_binding",
      operationGraphBinding:
        "exact_bound_postprojection_operation_graph_binding",
      seedV1Binding: "exact_direct_imported_seed_v1_binding",
      candidatePlanV2Binding: "exact_direct_imported_candidate_plan_v2_binding",
      successorRunPlanBinding:
        "exact_future_successor_run_plan_binding_recursively_equal_across_both_runtime_composites",
      candidateInstanceIdentity:
        "one_value_valid_against_runtimeClosureSchemas.candidateInstanceIdentity",
      candidateInstanceIdentityBinding:
        "exact_recomputed_binding_of_candidateInstanceIdentity_under_its_literal_domain_and_recipe",
      numericMaterializationPolicyBinding:
        "exact_direct_imported_sealed_numeric_policy_binding",
      numericMaterializationOperationGraphBinding:
        "exact_direct_imported_sealed_numeric_operation_graph_binding",
      mpfrGmpRuntimeBinding:
        "one_non-null_binding_of_an_exact_runtimeClosureSchemas.mpfrGmpRuntimeConformanceReceipt_instance_that_satisfies_the_entire_imported_arithmeticKernel_runtimeConformanceBindingRequirements",
      producerProjectionImplementationBinding:
        "one_non-null_binding_of_an_exact_static_runtimeClosureSchemas.producerProjectionImplementation_instance",
      verifierProjectionImplementationBinding:
        "one_non-null_binding_of_an_exact_static_runtimeClosureSchemas.verifierProjectionImplementation_instance_different_from_producer",
      implementationSeparationReceiptBinding:
        "one_non-null_binding_of_an_exact_positive_runtimeClosureSchemas.implementationSeparationReceipt_instance",
      rawEvidenceInventoryBinding:
        "exact_bound_postprojection_raw_evidence_inventory_binding",
      levelReceipts:
        "exact_three-element_tuple_L0_L1_L2_each_valid_against_levelReceipt_and_recursively_bound_to_the_same_R6_N32_and_z_pin_entries",
      allRawEvidenceBytesReplayed:
        "literal_true_iff_all_six_R6_arrays_were_reinjected_and_every_required_projection_arithmetic_step_consumed_them",
      allCholeskyPivotsStrictlyPositive:
        "literal_true_iff_every_odd_and_even_pivot_at_all_three_levels_was_finite_and_strictly_positive",
      allMultipoleBytesMatched:
        "literal_true_iff_all_six_complete_recomputed_multipole_byte_strings_matched_N32",
      allReconstructionBytesMatched:
        "literal_true_iff_all_six_complete_recomputed_base_nodal_byte_strings_matched_N32",
      allMasksMatched:
        "literal_true_iff_every_declared_multipole_and_base_nodal_mask_bit_was_canonical_positive_zero",
      allPhasesMatched:
        "literal_true_iff_all_three_provisional_MPFR_sign_branches_completed_and_all_three_recomputed_final_MPFR_a1_values_were_strictly_positive",
      allReplayMatched:
        "allReplayMatched_is_true_if_and_only_if_all_three_levelReplayMatched_values_and_all_six_root_replay_booleans_before_allReplayMatched_are_true",
      brokerSameAttemptEstablished: "literal_false",
      runtimeIsolationEstablished: "literal_false",
      authoritativeRegistrationAllowed: "literal_false",
      scientificAdmissionGranted: "literal_false",
      seedAdmissionGranted: "literal_false",
      artifactAdmissionGranted: "literal_false",
    },
    matchOutcomeIff:
      "outcome_is_match_if_and_only_if_every_candidate-identity_runtime-static-implementation-separation_recursive-observation_level-and-root_math-check_is_valid_allReplayMatched_is_literal_true_and_brokerSameAttemptEstablished_runtimeIsolationEstablished_authoritativeRegistrationAllowed_and_all_three_admission_fields_are_literal_false;otherwise_only_the_typed_rejection_variant_is_schema-valid",
    matchCrossFieldInvariants: [
      "resolve_mpfrGmpRuntimeBinding_under_its_exact_schema_and_require_its_commonRunRequestBinding_recursively_equals_candidateInstanceIdentity.commonRunRequestBinding_and_its_successorRunPlanBinding_recursively_equals_match.successorRunPlanBinding",
      "require_match.producerProjectionImplementationBinding_and_match.verifierProjectionImplementationBinding_recursively_equal_the_corresponding_exact_fields_in_the_resolved_implementationSeparationReceipt",
      "require_the_resolved_implementationSeparationReceipt.allPassed_is_literal_true_but_treat_it_only_as_static_source-toolchain-executable-no-import_separation_without_same-attempt_or_runtime-isolation_authority",
      "require_candidateInstanceIdentityBinding_recomputes_from_candidateInstanceIdentity_and_both_composite_closures_resolve_to_the_same_common_run_successor_producer-enforcement_receipt_and_post-exit_snapshot",
      "require_brokerSameAttemptEstablished_runtimeIsolationEstablished_authoritativeRegistrationAllowed_scientificAdmissionGranted_seedAdmissionGranted_and_artifactAdmissionGranted_are_all_literal_false",
    ],
    rejectionFields: {
      schemaVersion: "literal_receipt_schemaVersion",
      outcome: "literal_rejection",
      policyBinding: "exact_bound_postprojection_policy_binding",
      operationGraphBinding:
        "exact_bound_postprojection_operation_graph_binding",
      seedV1Binding: "exact_direct_imported_seed_v1_binding",
      candidatePlanV2Binding: "exact_direct_imported_candidate_plan_v2_binding",
      successorRunPlanBindingOrNull:
        "exact_future_successor_run_plan_binding_or_null_only_when_failure_precedes_its_binding",
      candidateInstanceIdentityOrNull:
        "candidate_identity_value_or_null_only_when_unformable",
      candidateInstanceIdentityBindingOrNull:
        "recomputed_candidate_identity_binding_or_null_only_when_unformable",
      numericStaging32RuntimeClosureBindingOrNull:
        "attempted_numeric_staging32_composite_binding_or_null_when_unformable",
      rawEvidenceRuntimeClosureBindingOrNull:
        "attempted_raw_evidence_composite_binding_or_null_when_unformable",
      numericMaterializationPolicyBinding:
        "exact_direct_imported_sealed_numeric_policy_binding",
      numericMaterializationOperationGraphBinding:
        "exact_direct_imported_sealed_numeric_operation_graph_binding",
      attemptedMpfrGmpRuntimeBindingOrNull:
        "attempted_runtime_binding_or_null_when_absent_or_unformable",
      attemptedProducerProjectionImplementationBindingOrNull:
        "attempted_producer_implementation_binding_or_null_when_absent_or_unformable",
      attemptedVerifierProjectionImplementationBindingOrNull:
        "attempted_verifier_implementation_binding_or_null_when_absent_or_unformable",
      attemptedImplementationSeparationReceiptBindingOrNull:
        "attempted_separation_receipt_binding_or_null_when_absent_or_unformable",
      failureCode: "one_literal_from_typedRejection.failureCodeEnum",
      firstMismatch: "one_value_valid_against_typedRejection.firstMismatch",
      positiveReplayBinding: "literal_null",
      brokerSameAttemptEstablished: "literal_false",
      runtimeIsolationEstablished: "literal_false",
      authoritativeRegistrationAllowed: "literal_false",
      scientificAdmissionGranted: "literal_false",
      seedAdmissionGranted: "literal_false",
      artifactAdmissionGranted: "literal_false",
    },
    directIdentityBindings: {
      seedV1Binding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
      candidatePlanV2Binding:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
      successorRunPlanBinding:
        "the_exact_future_successor_run_plan_binding_that_delivers_the_two_nonoverlapping_runtime_closures",
    },
    candidateInstanceIdentity: {
      schema:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.candidateInstanceIdentity,
      instanceBindingRequired: true,
      bindingRecomputedBeforeReplay: true,
    },
    runtimeClosures: {
      rawEvidenceExact6: {
        root: "/run/postprojection-evidence",
        closureLength: 6,
        inventoryBinding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_BINDING,
        entryOrder: "evidenceIndex_0_through_5",
        everyEntryServerSecurelyReread: true,
        secureObservationSchema:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.raw6SecureObservationClosure,
        manifestSchema:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.raw6Manifest,
        secureToManifestProjectionReceiptSchema:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.raw6SecureToManifestProjectionReceipt,
        compositeSchema:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.rawEvidenceRuntimeClosure,
      },
      numericStagingExact32: {
        root: "/run/staging",
        closureLength: 32,
        inheritedSecureObservationSchema:
          IMPORTED_V2_SECURE_STAGING_OBSERVATION_CLOSURE_SCHEMA,
        importedNumericStagingManifestSchema:
          IMPORTED_NUMERIC_STAGING_MANIFEST_SCHEMA,
        importedNumericStagingManifestBindingRecipe:
          IMPORTED_NUMERIC_STAGING_MANIFEST_SCHEMA.bindingRecipe,
        inventorySource:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_STAGING_ENTRY_EXPECTATIONS,
        entryOrder: "seed_v1_inventoryIndex_0_through_31",
        everyEntryServerSecurelyReread: true,
        secureToNumericManifestProjectionReceiptSchema:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.numericStaging32SecureToManifestProjectionReceipt,
        compositeSchema:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.numericStaging32RuntimeClosure,
      },
      combinedOrOverlappingClosureAllowed: false,
    },
    levelReceipt: {
      exactKeys: [
        "levelId",
        "rawScalarEvidenceObservation",
        "rawPotentialEvidenceObservation",
        "regeneratedAnalyticZObservation",
        "observedScalarMultipoleObservation",
        "observedPotentialMultipoleObservation",
        "observedBaseScalarObservation",
        "observedBasePotentialObservation",
        "scalarPhaseSign",
        "provisionalA1Bits",
        "finalA1Bits",
        "oddCholeskyPivotCount",
        "evenCholeskyPivotCount",
        "allLevelCholeskyPivotsStrictlyPositive",
        "scalarMultipoleBytesMatched",
        "potentialMultipoleBytesMatched",
        "baseScalarBytesMatched",
        "basePotentialBytesMatched",
        "multipoleMasksMatched",
        "baseNodalMasksMatched",
        "finalA1StrictlyPositive",
        "levelReplayMatched",
      ],
      extraKeysAllowed: false,
      fields: {
        levelId: "literal_indexed_levelId_L0_then_L1_then_L2",
        rawScalarEvidenceObservation:
          "exact_raw6Observation_recursively_equal_to_the_indexed_R6_scalar_entry",
        rawPotentialEvidenceObservation:
          "exact_raw6Observation_recursively_equal_to_the_indexed_R6_potential_entry",
        regeneratedAnalyticZObservation:
          "exact_regeneratedAnalyticZObservation_recursively_equal_to_the_indexed_imported_pin",
        observedScalarMultipoleObservation:
          "exact_seed32Observation_recursively_equal_to_the_indexed_N32_scalar_multipole_entry",
        observedPotentialMultipoleObservation:
          "exact_seed32Observation_recursively_equal_to_the_indexed_N32_potential_multipole_entry",
        observedBaseScalarObservation:
          "exact_seed32Observation_recursively_equal_to_the_indexed_N32_base_scalar_entry",
        observedBasePotentialObservation:
          "exact_seed32Observation_recursively_equal_to_the_indexed_N32_base_potential_entry",
        scalarPhaseSign: "literal_-1_or_+1_from_the_MPFR_value_sign_branch",
        provisionalA1Bits:
          "exact_binary64Bits_format_from_provisionalA1ReceiptBits_barrier_finite_and_either_zero_sign_canonicalized_positive",
        finalA1Bits:
          "exact_binary64Bits_format_from_finalA1ReceiptBits_barrier_decoding_finite_and_strictly_positive",
        oddCholeskyPivotCount:
          "exact_same-level_modeCount_and_every_counted_pivot_strictly_positive_finite",
        evenCholeskyPivotCount:
          "exact_same-level_modeCount_and_every_counted_pivot_strictly_positive_finite",
        allLevelCholeskyPivotsStrictlyPositive: "literal_true",
        scalarMultipoleBytesMatched: "literal_true",
        potentialMultipoleBytesMatched: "literal_true",
        baseScalarBytesMatched: "literal_true",
        basePotentialBytesMatched: "literal_true",
        multipoleMasksMatched: "literal_true",
        baseNodalMasksMatched: "literal_true",
        finalA1StrictlyPositive: "literal_true",
        levelReplayMatched:
          "literal_true_iff_every_preceding_same-level_boolean_is_true_and_finalA1Bits_decodes_finite_strictly_positive",
      },
      levelOrder: ["L0", "L1", "L2"],
      exactLength: 3,
      phaseSignEnum: [-1, 1],
      binary64Bits:
        "exact_16_lowercase_hex_characters_encoding_the_MSB_first_IEEE754_binary64_numeric_bit_pattern_finite_negative_zero_forbidden",
      choleskyPivotCountByLevel: { L0: 16, L1: 24, L2: 32 },
      closureIndexMapByLevel: [
        {
          levelId: "L0",
          rawScalarEvidenceIndex: 0,
          rawPotentialEvidenceIndex: 1,
          scalarMultipoleSeedInventoryIndex: 6,
          potentialMultipoleSeedInventoryIndex: 7,
          baseScalarSeedInventoryIndex: 2,
          basePotentialSeedInventoryIndex: 3,
          analyticZPinIndex: 0,
        },
        {
          levelId: "L1",
          rawScalarEvidenceIndex: 2,
          rawPotentialEvidenceIndex: 3,
          scalarMultipoleSeedInventoryIndex: 14,
          potentialMultipoleSeedInventoryIndex: 15,
          baseScalarSeedInventoryIndex: 10,
          basePotentialSeedInventoryIndex: 11,
          analyticZPinIndex: 1,
        },
        {
          levelId: "L2",
          rawScalarEvidenceIndex: 4,
          rawPotentialEvidenceIndex: 5,
          scalarMultipoleSeedInventoryIndex: 22,
          potentialMultipoleSeedInventoryIndex: 23,
          baseScalarSeedInventoryIndex: 18,
          basePotentialSeedInventoryIndex: 19,
          analyticZPinIndex: 2,
        },
      ],
      recursiveObservationEquality:
        "each_raw_observation_recursively_equals_its_exact_indexed_R6_rawEvidenceManifest_entry_each_multipole_and_base_observation_recursively_equals_its_exact_indexed_N32_imported_numeric_staging_manifest_entry_and_each_regenerated_z_observation_recursively_equals_its_exact_imported_analytic_z_pin;S6_and_S32_secure_file_observations_are_reached_only_through_the_bound_positive_projection_receipts_and_are_not_shape-aliased_to_R6_or_N32_entries",
      replayMatchConjunction:
        "levelReplayMatched_is_true_if_and_only_if_allLevelCholeskyPivotsStrictlyPositive_scalarMultipoleBytesMatched_potentialMultipoleBytesMatched_baseScalarBytesMatched_basePotentialBytesMatched_multipoleMasksMatched_baseNodalMasksMatched_and_finalA1StrictlyPositive_are_all_true_and_finalA1Bits_decode_to_a_strictly_positive_finite_binary64_value",
    },
    raw6Observation: {
      schemaSource:
        "runtimeClosures.rawEvidenceExact6.manifestSchema.fields.entries.itemExactKeys_and_itemFieldTypes",
      exactKeys:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS
          .raw6Manifest.fields.entries.itemExactKeys,
      recursivelyEqualsExactIndexedR6ManifestEntry: true,
      plainSha256Source:
        "R6_plainSha256_equal_to_S6_inherited_fileObservation.sha256_through_the_positive_S6_to_R6_projection_receipt",
      domainSha256Source:
        "R6_domainSha256_recomputed_from_secure_raw_bytes_under_rawEvidenceHashPolicy",
      rawBytesComparedNotDigestOnly: true,
    },
    seed32Observation: {
      schemaSource:
        "exact_imported_numeric_policy_producer32ArrayStagingEvidenceSchema_entries_item",
      exactKeys:
        IMPORTED_NUMERIC_STAGING_MANIFEST_SCHEMA.fields.entries.itemExactKeys,
      recursivelyEqualsExactIndexedN32ManifestEntry: true,
      rawArraySha256Source:
        "N32_rawArraySha256_equal_to_S32_inherited_fileObservation.sha256_through_the_positive_S32_to_N32_projection_receipt",
      domainSha256FieldAllowed: false,
      plainSha256FieldAllowed: false,
      rawBytesComparedNotDigestOnly: true,
    },
    regeneratedAnalyticZObservation: {
      exactKeys: [
        "levelId",
        "angularNodeCount",
        "byteLength",
        "rawF64leSha256",
      ],
      extraKeysAllowed: false,
      fields: {
        levelId: "literal_L0_or_L1_or_L2_at_the_same_level_receipt_index",
        angularNodeCount: "exact_imported_pin_angularNodeCount",
        byteLength: "exact_imported_pin_byteLength",
        rawF64leSha256: "exact_imported_pin_rawF64leSha256",
      },
      recursivelyEqualsExactIndexedImportedAnalyticZPin: true,
      stagedRelativePathRoleOrDomainHashAllowed: false,
      derivedInternalEvidenceOnly: true,
    },
    implementationIndependence: {
      mpfrGmpRuntimeConformanceReceiptSchema:
        MPFR_GMP_RUNTIME_CONFORMANCE_RECEIPT_SCHEMA,
      producerProjectionImplementationSchema:
        PRODUCER_PROJECTION_IMPLEMENTATION_SCHEMA,
      verifierProjectionImplementationSchema:
        VERIFIER_PROJECTION_IMPLEMENTATION_SCHEMA,
      implementationSeparationReceiptSchema:
        IMPLEMENTATION_SEPARATION_RECEIPT_SCHEMA,
      producerAndVerifierSourceBindingsMustDiffer: true,
      producerSourceMayBeImportedByVerifier: false,
      verifierSourceMayInvokeProducerProjection: false,
      sharedGeneratedProjectorGramCholeskyOrCoefficientTableAllowed: false,
      verifierRegeneratesZBasisGramCholeskyRhsSolveMasksPhaseAndReconstruction: true,
      sharedPolicyTextAllowed: true,
      sharedBoundMpfrAndGmpRuntimeAllowed: true,
      separationReceiptClosesStaticSourceToolchainAndExecutableEvidenceOnly: true,
      separationReceiptEstablishesBrokerSameAttempt: false,
      separationReceiptEstablishesRuntimeIsolation: false,
      currentProducerSpectralImplementationCompatibleAndBound: false,
      currentVerifierDiagnosticOperatorsCompatibleAndBound: false,
      currentSourcePresenceGrantsAuthority: false,
    },
    rootConjunction:
      "allReplayMatched_is_true_if_and_only_if_all_three_levelReplayMatched_values_and_all_six_root_replay_booleans_before_allReplayMatched_are_true",
    typedRejection: {
      failureCodeEnum: [
        "run_candidate_identity_mismatch",
        "runtime_binding_mismatch",
        "static_implementation_evidence_mismatch",
        "raw_evidence_closure_mismatch",
        "numeric_staging_closure_mismatch",
        "raw_evidence_inventory_mismatch",
        "raw_evidence_nonfinite",
        "raw_evidence_negative_zero",
        "analytic_z_bits_mismatch",
        "odd_cholesky_nonpositive_pivot",
        "even_cholesky_nonpositive_pivot",
        "scalar_coefficient_serialization_nonfinite",
        "potential_coefficient_serialization_nonfinite",
        "scalar_multipole_byte_mismatch",
        "potential_multipole_byte_mismatch",
        "scalar_multipole_mask_mismatch",
        "potential_multipole_mask_mismatch",
        "phase_a1_zero_or_nonfinite",
        "phase_final_a1_not_positive",
        "scalar_base_reconstruction_serialization_nonfinite",
        "potential_base_reconstruction_serialization_nonfinite",
        "base_scalar_byte_mismatch",
        "base_potential_byte_mismatch",
        "base_scalar_mask_mismatch",
        "base_potential_mask_mismatch",
        "implementation_independence_mismatch",
      ],
      deterministicFailurePrecedence:
        "the_closed_failureCodeEnum_order_is_first-failure_precedence_then_level_L0_L1_L2_then_field_scalar_potential_then_radial_index_then_mode_or_angular_index_then_byte_offset",
      firstMismatch: {
        exactKeys: [
          "levelId",
          "field",
          "radialIndex",
          "modeOrAngularIndex",
          "byteOffset",
        ],
        extraKeysAllowed: false,
        levelId: "L0_or_L1_or_L2_or_null_when_failure_precedes_a_level",
        field:
          "scalar_or_potential_or_raw_evidence_or_runtime_or_identity_or_independence",
        radialIndex: "nonnegative_safe_integer_or_null",
        modeOrAngularIndex: "nonnegative_safe_integer_or_null",
        byteOffset: "nonnegative_safe_integer_or_null",
        selection:
          "the_first_coordinate_or_byte_under_the_same_closed_failure_precedence_with_irrelevant_coordinates_literal_null",
      },
      positiveReplayBindingLiteralOnRejection: null,
      rejectionEmitsPositiveReplayBinding: false,
      fallbackRetuneOrPartialPositiveReceiptAllowed: false,
    },
    receiptInstanceBindingPolicy: {
      matchSha256Domain:
        "nhm2-prolate-boson-star-newtonian-seed-postprojection-replay-receipt-instance/v1\n",
      rejectionSha256Domain:
        "nhm2-prolate-boson-star-newtonian-seed-postprojection-replay-rejection-instance/v1\n",
      canonicalEncoding:
        "exact_RFC8785_canonical_JSON_UTF8_with_no_BOM_prefix_suffix_whitespace_or_trailing_bytes",
      hashRecipe:
        "sha256(utf8(outcome_specific_literal_domain)+u64be(exact_canonical_receipt_UTF8_byte_length)+exact_canonical_receipt_UTF8_bytes)",
      canonicalSizeBytes:
        "exact_byte_length_of_the_same_canonical_receipt_UTF8_bytes",
      matchBindingRecipe: closedRuntimeBindingRecipe(
        "nhm2.prolate_boson_star.newtonian_seed.postprojection_replay_match",
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_replay_match/v1",
        "nhm2-prolate-boson-star-newtonian-seed-postprojection-replay-receipt-instance/v1\n",
      ),
      rejectionBindingRecipe: closedRuntimeBindingRecipe(
        "nhm2.prolate_boson_star.newtonian_seed.postprojection_replay_rejection",
        "nhm2_prolate_boson_star_newtonian_seed_postprojection_replay_rejection/v1",
        "nhm2-prolate-boson-star-newtonian-seed-postprojection-replay-rejection-instance/v1\n",
      ),
      selfBindingEmbeddedInReceipt: false,
      bindingIdentityIsCandidateMathEvidenceOnly: true,
      candidateEvidenceMayBeNestedInFutureV3Composite: true,
      standaloneOutputPath: null,
      serverAuthoritativeBindingEstablished: false,
      authoritativeRegistrationAllowed: false,
      brokerSameAttemptEstablished: false,
      runtimeIsolationEstablished: false,
      matchBindingRecipeProducesAuthoritativeRegistration: false,
      staticPolicySingletonValidatorIsRuntimeReceiptSchemaInterpreter: false,
      executableRuntimeSchemaAuthorityUntilInterpreterBound: false,
      runtimeTypedInterpreterBinding: null,
      proseSchemaAloneMayRegisterMatchBinding: false,
      rejectionBindingIsTypedFailureOnlyAndNeverPositiveReplayBinding: true,
    },
    downstreamCrossBindings: {
      candidateMathMatchMayDirectlyGateNumericMaterialization: false,
      candidateMathMatchMayDirectlyGateFullSeedAdmission: false,
      candidateMathReceiptIsAdditionalUntrustedFutureV3CompositeEvidence: true,
      futureV3MustBindFullProducerAndVerifierEnforcement: true,
      futureV3MustBindCandidateCompositeOutputAndBrokerRuntimeSeparation: true,
      futureV3MustBindTypedInterpreterAndAtomicNestedRegistration: true,
      futureV3MustPreserveSameNumericPolicyN32ManifestBinding: true,
      candidateMathMatchMayBeInferredFromNumericMultipolePassThrough: false,
      assemblerMustMountRawEvidenceClosure: false,
    },
    chronology:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.chronology,
    authorityBoundary: {
      candidateReceiptClaimsOnly:
        "the_candidate_self-reports_that_the_named_postprojection_multipole_and_base-nodal_bytes_are_the_exact_frozen-map_image_of_the_named_raw-nodal-evidence_bytes",
      currentReceiptEstablishesMapping: false,
      futureV3FullValidationRequiredToEstablishMapping: true,
      candidateReceiptEstablishesObservationProvenance: false,
      candidateReceiptEstablishesSameRunOrAttemptProvenance: false,
      brokerSameAttemptEstablishedLiteral: false,
      runtimeIsolationEstablishedLiteral: false,
      authoritativeRegistrationAllowedLiteral: false,
      scientificAdmissionGrantedLiteral: false,
      seedAdmissionGrantedLiteral: false,
      artifactAdmissionGrantedLiteral: false,
      proofGateOrCertificateAuthority: false,
      physicalPropulsionTransportOrSemiclassicalAuthority: false,
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.postprojection_bounded_fixtures",
    contractVersion:
      "nhm2_prolate_boson_star_newtonian_seed_postprojection_bounded_fixtures/v1",
    status: "nonphysical_non_authoritative_bounded_expected_bit_fixtures",
    scientificAuthority: false,
    runtimeConformanceAuthority: false,
    proofAuthority: false,
    gateAuthority: false,
    admissionAuthority: false,
    bitEncoding:
      "exact_16_lowercase_hex_MSB_first_IEEE754_binary64_numeric_bit_pattern",
    rationalEncoding:
      "strict_reduced_slash_grammar_^(0|-[1-9][0-9]*|[1-9][0-9]*)/[1-9][0-9]*$_with_gcd_abs_numerator_denominator_equals_1_zero_only_as_0/1_no_plus_no_leading_zero_and_no_negative_denominator",
    kernelGridNote:
      "z_equals_[1,1/2,0]_is_a_bounded_rational_kernel_fixture_not_a_seed_mapped_grid",
    common: {
      z: ["1/1", "1/2", "0/1"],
      zBits: ["3ff0000000000000", "3fe0000000000000", "0000000000000000"],
    },
    consistentOdd: {
      degrees: [1, 3],
      basisRows: [
        ["1/1", "1/1"],
        ["1/2", "-7/16"],
        ["0/1", "0/1"],
      ],
      Gram: [
        ["5/4", "25/32"],
        ["25/32", "305/256"],
      ],
      rawY: ["1/4", "23/64", "0/1"],
      rawYBits: ["3fd0000000000000", "3fd7000000000000", "0000000000000000"],
      rightHandSide: ["55/128", "95/1024"],
      exactRealCholeskyReference: [
        ["sqrt(5)/2", "0"],
        ["5*sqrt(5)/16", "3*sqrt(5)/8"],
      ],
      expectedCoefficients: ["1/2", "-1/4"],
      expectedCoefficientBits: ["3fe0000000000000", "bfd0000000000000"],
      expectedReconstruction: ["1/4", "23/64", "0/1"],
    },
    consistentEven: {
      degrees: [0, 2],
      basisRows: [
        ["1/1", "1/1"],
        ["1/1", "-1/8"],
        ["1/1", "-1/2"],
      ],
      Gram: [
        ["3/1", "3/8"],
        ["3/8", "81/64"],
      ],
      rawY: ["1/4", "17/32", "5/8"],
      rawYBits: ["3fd0000000000000", "3fe1000000000000", "3fe4000000000000"],
      rightHandSide: ["45/32", "-33/256"],
      exactRealCholeskyReference: [
        ["sqrt(3)", "0"],
        ["sqrt(3)/8", "sqrt(78)/8"],
      ],
      expectedCoefficients: ["1/2", "-1/4"],
      expectedCoefficientBits: ["3fe0000000000000", "bfd0000000000000"],
      expectedReconstruction: ["1/4", "17/32", "5/8"],
    },
    identityWeightDiscriminatorEven: {
      purpose:
        "an_inconsistent_overdetermined_vector_that_distinguishes_identity_weights_from_alternate_weighting_rules",
      basisSource: "consistentEven.basisRows",
      rawY: ["1/1", "0/1", "0/1"],
      rawYBits: ["3ff0000000000000", "0000000000000000", "0000000000000000"],
      exactCoefficients: ["19/78", "28/39"],
      expectedCoefficientBits: ["3fcf2df2df2df2df", "3fe6f96f96f96f97"],
      exactReconstruction: ["25/26", "2/13", "-3/26"],
      expectedReconstructionBits: [
        "3feec4ec4ec4ec4f",
        "3fc3b13b13b13b14",
        "bfbd89d89d89d89e",
      ],
      exactResidualRawMinusReconstruction: ["1/26", "-2/13", "3/26"],
      exactNormalEquationResidual: ["0/1", "0/1"],
    },
    phaseAndMask: {
      radialNodeOrdinals: [0, 1, 2],
      provisionalScalarMultipoleBits: [
        "0000000000000000",
        "bfe0000000000000",
        "0000000000000000",
      ],
      provisionalA1ExactRealReference: "-2/1",
      provisionalDctICoefficientsExactRealReference: ["-1/4", "0/1", "1/4"],
      provisionalEndpointDerivativeSumExactRealReference: "1/1",
      provisionalA1Bits: "c000000000000000",
      expectedPhaseSign: -1,
      acceptedScalarMultipoleBits: [
        "0000000000000000",
        "3fe0000000000000",
        "0000000000000000",
      ],
      finalA1ExactRealReference: "2/1",
      acceptedDctICoefficientsExactRealReference: ["1/4", "0/1", "-1/4"],
      acceptedEndpointDerivativeSumExactRealReference: "-1/1",
      finalA1Bits: "4000000000000000",
      endpointMasksRemainPositiveZero: true,
      mpfrDctNuance:
        "the_imported_runtime_graph_evaluates_cos(pi256*m*j/n)_so_for_n=2_cos(pi256/2)_need_not_be_symbolic_exact_zero;the_exact_real_references_validate_only_the_mathematical_sign_and_formula_and_the_expected_bits_require_a_future_bound_MPFR_runtime_harness",
    },
    limitations: [
      "literal_expected_bits_are_not_executed_MPFR_runtime_evidence",
      "phase_expected_bits_are_not_claimed_equal_to_an_unexecuted_MPFR256_graph_result",
      "fixtures_do_not_bind_a_producer_or_verifier_implementation",
      "fixtures_do_not_establish_any_candidate_seed_or_artifact_acceptance",
    ],
  } as const);

const RAW_EVIDENCE_INVENTORY_REPROJECTION = projectionBinding(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY,
  "nhm2.prolate_boson_star_newtonian_seed.postprojection_raw_evidence_inventory",
  "nhm2_prolate_boson_star_newtonian_seed_postprojection_raw_evidence_inventory/v1",
  "nhm2-prolate-boson-star-newtonian-seed-postprojection-raw-evidence-inventory/v1\n",
);
if (
  RAW_EVIDENCE_INVENTORY_REPROJECTION.canonical !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_CANONICAL_JSON ||
  RAW_EVIDENCE_INVENTORY_REPROJECTION.binding.sha256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_BINDING.sha256
) {
  throw new Error(
    "nhm2_newtonian_seed_postprojection_raw_inventory_reprojection_drift",
  );
}

const OPERATION_GRAPH_PROJECTION = projectionBinding(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH.artifactId,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH.contractVersion,
  "nhm2-prolate-boson-star-newtonian-seed-postprojection-operation-graph/mpfr256-identity-euclidean-lsq-cholesky-v1\n",
);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_CANONICAL_JSON =
  OPERATION_GRAPH_PROJECTION.canonical;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING =
  OPERATION_GRAPH_PROJECTION.binding;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_EXPECTED_SHA256 =
  "091ec81bbe981363bb7e1b83897d2e18eede13f04ce17a45da955fb4814c3148" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_EXPECTED_CANONICAL_SIZE_BYTES =
  28272 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING.sha256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING.canonicalSizeBytes !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_newtonian_seed_postprojection_operation_graph_literal_binding_drift",
  );
}

const REPLAY_RECEIPT_SCHEMA_PROJECTION = projectionBinding(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA.artifactId,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA.schemaVersion,
  "nhm2-prolate-boson-star-newtonian-seed-postprojection-replay-receipt-schema/v1\n",
);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_CANONICAL_JSON =
  REPLAY_RECEIPT_SCHEMA_PROJECTION.canonical;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING =
  REPLAY_RECEIPT_SCHEMA_PROJECTION.binding;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_EXPECTED_SHA256 =
  "7650326d16968df1939f9470382bb39b24bb25b74560914f0843a43932cc25fe" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES =
  91888 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING.sha256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING.canonicalSizeBytes !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_newtonian_seed_postprojection_replay_receipt_schema_literal_binding_drift",
  );
}

const BOUNDED_FIXTURES_PROJECTION = projectionBinding(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES.artifactId,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES.contractVersion,
  "nhm2-prolate-boson-star-newtonian-seed-postprojection-bounded-fixtures/v1\n",
);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_CANONICAL_JSON =
  BOUNDED_FIXTURES_PROJECTION.canonical;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_BINDING =
  BOUNDED_FIXTURES_PROJECTION.binding;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_EXPECTED_SHA256 =
  "65d8ed4408cc5155952136961b548eab7a210b86a458cdcab91a4db5f6a192a8" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_EXPECTED_CANONICAL_SIZE_BYTES =
  3759 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_BINDING.sha256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_BINDING.canonicalSizeBytes !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_newtonian_seed_postprojection_bounded_fixtures_literal_binding_drift",
  );
}

const CLAIM_LOCK_KEYS = Object.freeze([
  "sourceAuthority",
  "runtimeAuthority",
  "producerProjectionAuthority",
  "verifierProjectionAuthority",
  "replayReceiptAuthority",
  "postprojectionScientificAuthority",
  "postprojectionProofAuthority",
  "postprojectionGateAuthority",
  "postprojectionArtifactAuthority",
  "postprojectionPhysicalAuthority",
  "toleranceBasedAcceptanceAllowed",
  "sharedImplementationAllowed",
  "runtimeToolchainBound",
  "runtimeSchemaInterpreterAuthority",
  "brokerSameAttemptEstablished",
  "runtimeIsolationEstablished",
  "authoritativeRegistrationAllowed",
  "observationProvenanceEstablished",
  "sameRunOrAttemptProvenanceEstablished",
  "executionAuthorized",
  "rawEvidencePresent",
  "rawEvidenceAccepted",
  "producerProjectionObserved",
  "independentVerifierObserved",
  "postprojectionReplayMatchPresent",
  "postprojectionInputAcceptancePresent",
  "numericMaterializationAdmissionPresent",
  "fullSeedV1AdmissionPresent",
  "policyMayAdmitSeed",
  "policyMayAdmitArtifact",
  "policyMaySatisfyFullSeedGateReport",
  "artifactAccepted",
  "candidateAdmissible",
  "relativisticBranchSolved",
  "physicalViabilityEstablished",
  "propulsionCapabilityEstablished",
  "transportCapabilityEstablished",
  "anySemiclassicalClaimEstablished",
  "retuningAllowed",
  "solverExecutionAuthorized",
  "descriptorAssemblyAuthorized",
  "certificateAuthority",
] as const);

const CLAIM_LOCKS = deepFreeze(
  Object.fromEntries(CLAIM_LOCK_KEYS.map((key) => [key, false])),
);

const CONTRACT = {
  artifactId:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_ARTIFACT_ID,
  contractVersion:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CONTRACT_VERSION,
  status: "sealed_preregistration_read_only_red_team_clear",
  additiveSuccessorOnly: true,
  mutatesSeedV1: false,
  mutatesRunPlanV1: false,
  mutatesRunPlanV2: false,
  mutatesNumericMaterializationPolicyV1: false,
  bindings: {
    seedV1: {
      authoritativeSingletonIdentityRequired: true,
      singletonExportName: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1",
      binding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
    },
    candidatePlanV2: {
      authoritativeSingletonIdentityRequired: true,
      singletonExportName: "NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2",
      binding: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
    },
    predecessorRunPlanV2: {
      authoritativeSingletonIdentityRequired: true,
      binding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
      runtimeChannelSchemaRegistryBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
      inheritedSecureStagingObservationClosureSchemaIdentityRequired: true,
    },
    numericMaterializationPolicyV1: {
      authoritativeSingletonIdentityRequired: true,
      singletonExportName:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1",
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
      requiredLiteralSealStatus:
        EXPECTED_SEALED_NUMERIC_POLICY.literalSealStatus,
    },
    numericMaterializationOperationGraphV1: {
      authoritativeSingletonIdentityRequired: true,
      singletonExportName:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH",
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
    },
    rawEvidenceInventoryV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_BINDING,
    operationGraphV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING,
    replayReceiptSchemaV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING,
    boundedFixturesV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_BINDING,
  },
  interpretationBoundary: {
    closesOnly:
      "deterministic_nodal_to_postprojection_parity_Legendre_mapping_and_same_level_base_reconstruction_semantics",
    producerRawInput:
      "six_external_server_observed_preprojection_binary64_nodal_arrays",
    policyTerminalDuty:
      "candidate_postprojection_math_match_or_typed_rejection_value_only",
    brokerSameAttemptEstablished: false,
    runtimeIsolationEstablished: false,
    authoritativeRegistrationAllowed: false,
    candidateReceiptEstablishesObservationProvenance: false,
    candidateReceiptEstablishesSameRunOrAttemptProvenance: false,
    exactReplayMatchIsScientificAdmission: false,
    changesSeedV1ProofAcceptance: false,
    changesSeedV1GateThresholds: false,
    changesDescriptorAcceptance: false,
    suppliesMissingProofOperators: false,
    suppliesSolverExecution: false,
    suppliesRunPlanEvidenceChannel: false,
    currentProducerSpectralPy:
      "present_but_incompatible_binary64_BLAS_normal_equations_and_heuristic_phase_not_a_bound_policy_implementation",
    currentVerifierOperatorsPy:
      "present_but_incompatible_diagnostic_binary64_without_raw6_projection_replay_not_a_bound_independent_implementation",
    sourceFilePresenceGrantsAuthority: false,
    candidateMathMatchMayBeInferredFromNumericPolicyPassThrough: false,
  },
  chronology: {
    topology:
      "producer_raw6_and_seed32_observation_closure_then_candidate_postprojection_math_match-or-rejection_value_only;future_v3_three-stage_composite_transport_full-enforcement_runtime-separation_interpretation_and_atomic_nested-registration_are_out_of_scope_and_absent",
    exactAcyclicOrder:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS
        .chronology.exactAcyclicOrder,
    producerEnforcementMayBindFutureSecureClosures: false,
    candidateReceiptTransportOrCompositeOutputPathDefined: false,
    candidateReceiptEstablishesObservationProvenance: false,
    candidateReceiptEstablishesSameRunOrAttemptProvenance: false,
    brokerSameAttemptEstablished: false,
    runtimeIsolationEstablished: false,
    authoritativeRegistrationAllowed: false,
    postprojectionReceiptMayBindFutureNumericOrAdmissionEvidence: false,
    temporalCycleAllowed: false,
    rawEvidenceBeforeProjectionMasksPhaseAndResampling: true,
    producerProjectionMayAdmitScience: false,
    producerReceiptAccepted: false,
    verifierMustRecomputeFromRawBytes: true,
    verifierMayTrustProducerBasisGramFactorProjectorCoefficientsOrSummary: false,
    serverRawByteObservationRequired: true,
    candidateMathMatchDefinesFutureV3DependencyOrderBeforeCandidateNumericReplay: true,
    candidateMathMatchAuthorizesNumericReplay: false,
    futureV3RequiredSingleVerifierPreExitOrder:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS
        .chronology.futureV3RequiredSingleVerifierPreExitOrder,
    futureV3RequiredPostExitOrder:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS
        .chronology.futureV3RequiredPostExitOrder,
    postExitCandidateComputationAllowed: false,
    standaloneCandidatePOutputAllowed: false,
    secondVerifierStageAllowed: false,
    exactReplayReceiptAloneMayReachDescriptorAssembler: false,
    noRetuneAfterMismatch: true,
  },
  rawEvidenceInventory:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY,
  rawEvidenceTotals:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_TOTALS,
  rawEvidenceHashPolicy:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_HASH_POLICY,
  operationGraph:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH,
  runtimeClosureSchemas:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS,
  replayReceiptSchema:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
  boundedFixtures:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES,
  successorIntegrationRequirements: {
    sealedRunPlanV1OrV2MutationAllowed: false,
    futureRunPlanSuccessorRequired: true,
    futureSuccessorMustBindThisPolicyAndNumericMaterializationPolicy: true,
    seedStagingRoot: "/run/staging",
    seedStagingArrayClosureCount: 32,
    seedStagingClosureRemainsExactAndUnchanged: true,
    postprojectionEvidenceRoot: "/run/postprojection-evidence",
    postprojectionEvidenceClosureCount: 6,
    postprojectionEvidenceLocalOrdinals: [0, 1, 2, 3, 4, 5],
    rootsMustBeNonoverlapping: true,
    combinedThirtyEightFileStagingViewAllowed: false,
    secureObservation:
      "Linux_x86_64_openat2_no_symlink_no_magiclink_no_xdev_beneath_single_link_exact_size_stat_read_stat_plain_and_domain_hash_then_read_only_verifier_delivery",
    producerAndVerifierImplementationsRequired: true,
    staticImplementationSeparationEvidenceRequired: true,
    candidateMathReceiptMayBeStandaloneRuntimeOutput: false,
    futureV3MustPreserveProducerVerifierAssemblerThreeStageTopology: true,
    futureV3SingleVerifierComputesCandidatePThenNThenFBeforeOneExit: true,
    futureV3CandidateRejectionShortCircuitsCandidateNAndF: true,
    futureV3CompositeReplayBundleCount: 1,
    futureV3CompositeReplayBundleAbsolutePathDefinedAndBoundOnlyBySuccessor: true,
    futureV3PostExitCandidateComputationAllowed: false,
    futureV3SecondVerifierStageAllowed: false,
    futureV3StandaloneCandidatePOutputAllowed: false,
    futureV3MustBindFullProducerAndVerifierEnforcementReceipts: true,
    futureV3MustBindExactContextDeliveryAndCandidateCompositeOutput: true,
    futureV3MustBindBrokerRuntimeSeparationReceipt: true,
    futureV3MustBindCompleteClosedSchemaRuntimeTypedInterpreter: true,
    futureV3MustAtomicallyRegisterNestedCandidatePThenNThenFBindings: true,
    futureV3AuthorityArtifactsDefinedByThisPolicy: false,
    implementationPresentInThisPolicy: false,
  },
  executionState: {
    executionAuthorized: false,
    mpfrGmpRuntimeBinding: null,
    rawEvidenceBundleBinding: null,
    serverSecureObservationBinding: null,
    raw6SecureObservationClosureBinding: null,
    raw6ManifestBinding: null,
    raw6SecureToManifestProjectionReceiptBinding: null,
    rawEvidenceRuntimeClosureBinding: null,
    inheritedV2SecureStagingObservationClosureBinding: null,
    numericPolicyStagingManifestBinding: null,
    numericStaging32SecureToManifestProjectionReceiptBinding: null,
    numericStaging32RuntimeClosureBinding: null,
    candidateInstanceIdentity: null,
    candidateInstanceIdentityBinding: null,
    producerProjectionImplementationBinding: null,
    verifierProjectionImplementationBinding: null,
    implementationSeparationReceiptBinding: null,
    runtimeTypedInterpreterBinding: null,
    executableRuntimeSchemaAuthority: false,
    candidatePostprojectionMathMatchOrRejectionReceipt: null,
    candidatePostprojectionMathReceiptBinding: null,
    brokerSameAttemptEstablished: false,
    runtimeIsolationEstablished: false,
    authoritativeRegistrationAllowed: false,
    numericMaterializationMatchBinding: null,
    fullSeedV1AdmissionBinding: null,
    verified: false,
    descriptorAssembled: false,
    artifactAccepted: false,
  },
  blockers: [
    "future_run_plan_successor_binding_both_postprojection_and_numeric_materialization_policies_absent",
    "six_raw_preprojection_evidence_array_delivery_channel_absent_from_sealed_run_plans_v1_and_v2",
    "external_Linux_x86_64_isolated_worker_provider_absent",
    "bound_MPFR_GMP_runtime_conformance_receipt_absent",
    "producer_MPFR256_postprojection_implementation_binding_absent",
    "independent_verifier_MPFR256_postprojection_implementation_binding_absent",
    "producer_verifier_static_source_toolchain_executable_separation_receipt_absent",
    "future_v3_three-stage_authority_layer_absent_including_full_producer-and-verifier_enforcement_exact_context-delivery_candidate-composite-output_broker-runtime-separation_receipt_complete-typed-interpreter_and_post-exit-atomic_nested-P-then-N-then-F_registration",
    "server_secure_observation_of_all_six_raw_evidence_arrays_absent",
    "independent_candidate_postprojection_math_receipt_absent",
    "candidate_postprojection_math_match_absent_and_even_if_present_would_remain_untrusted_unregistered_evidence",
    "numeric_materialization_match_absent",
    "external_full_seed_v1_admission_with_complete_gate_report_and_nodeless_origin_peak_receipts_absent",
    "bounded_expected_bit_fixtures_are_literals_not_executed_MPFR_evidence",
  ],
  claimLockKeys: CLAIM_LOCK_KEYS,
  claimLocks: CLAIM_LOCKS,
} as const;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1 =
  deepFreeze(CONTRACT);

export type Nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1 =
  typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1;

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

const SNAPSHOT_LIMITS = Object.freeze({
  maximumDepth: 24,
  maximumNodes: 7_500,
  maximumKeys: 8_192,
  maximumOwnKeysPerObject: 64,
  maximumArrayLength: 64,
  maximumStringCodeUnits: 180_000,
  maximumPropertyNameCodeUnits: 90_000,
  maximumSingleStringCodeUnits: 1_024,
});
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
type SnapshotBudget = {
  nodes: number;
  keys: number;
  stringCodeUnits: number;
  propertyNameCodeUnits: number;
};

const invalid = (violation: string): SnapshotResult =>
  Object.freeze({ ok: false, violation });

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  budget: SnapshotBudget = {
    nodes: 0,
    keys: 0,
    stringCodeUnits: 0,
    propertyNameCodeUnits: 0,
  },
  depth = 0,
): SnapshotResult => {
  const at = pointer || "/";
  budget.nodes += 1;
  if (budget.nodes > SNAPSHOT_LIMITS.maximumNodes)
    return invalid(`snapshot_node_limit:${at}`);
  if (depth > SNAPSHOT_LIMITS.maximumDepth)
    return invalid(`snapshot_depth_limit:${at}`);
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return invalid(`nonfinite_number:${at}`);
    if (Object.is(value, -0)) return invalid(`negative_zero:${at}`);
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "string") {
    if (value.length > SNAPSHOT_LIMITS.maximumSingleStringCodeUnits)
      return invalid(`single_string_limit:${at}`);
    budget.stringCodeUnits += value.length;
    if (budget.stringCodeUnits > SNAPSHOT_LIMITS.maximumStringCodeUnits)
      return invalid(`snapshot_string_limit:${at}`);
    return Object.freeze({ ok: true, value });
  }
  if (typeof value !== "object") return invalid(`non_json_value:${at}`);
  if (nodeUtilTypes.isProxy(value)) return invalid(`proxy_forbidden:${at}`);
  if (ancestors.has(value as object)) return invalid(`cycle_forbidden:${at}`);
  ancestors.add(value as object);

  let keys: PropertyKey[];
  try {
    keys = Reflect.ownKeys(value as object);
  } catch {
    ancestors.delete(value as object);
    return invalid(`reflection_failed:${at}`);
  }
  if (keys.length > SNAPSHOT_LIMITS.maximumOwnKeysPerObject) {
    ancestors.delete(value as object);
    return invalid(`own_keys_limit:${at}`);
  }
  if (keys.some((key) => typeof key !== "string")) {
    ancestors.delete(value as object);
    return invalid(`symbol_key:${at}`);
  }
  for (const key of keys as string[]) {
    budget.propertyNameCodeUnits += key.length;
    if (
      budget.propertyNameCodeUnits >
      SNAPSHOT_LIMITS.maximumPropertyNameCodeUnits
    ) {
      ancestors.delete(value as object);
      return invalid(`snapshot_property_name_limit:${at}`);
    }
  }

  let prototype: object | null;
  try {
    prototype = Object.getPrototypeOf(value);
  } catch {
    ancestors.delete(value as object);
    return invalid(`reflection_failed:${at}`);
  }

  if (Array.isArray(value)) {
    if (prototype !== Array.prototype) {
      ancestors.delete(value);
      return invalid(`array_prototype:${at}`);
    }
    let lengthDescriptor: PropertyDescriptor | undefined;
    try {
      lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    } catch {
      ancestors.delete(value);
      return invalid(`reflection_failed:${at}`);
    }
    const length =
      lengthDescriptor && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > SNAPSHOT_LIMITS.maximumArrayLength
    ) {
      ancestors.delete(value);
      return invalid(`array_length:${at}`);
    }
    budget.keys += keys.length;
    if (budget.keys > SNAPSHOT_LIMITS.maximumKeys) {
      ancestors.delete(value);
      return invalid(`snapshot_key_limit:${at}`);
    }
    const expected = new Set([
      "length",
      ...Array.from({ length }, (_, index) => String(index)),
    ]);
    if (
      keys.length !== expected.size ||
      keys.some((key) => !expected.has(key as string))
    ) {
      ancestors.delete(value);
      return invalid(`array_surface:${at}`);
    }
    let descriptors: Record<PropertyKey, PropertyDescriptor>;
    try {
      descriptors = Object.getOwnPropertyDescriptors(
        value,
      ) as unknown as Record<PropertyKey, PropertyDescriptor>;
    } catch {
      ancestors.delete(value);
      return invalid(`reflection_failed:${at}`);
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        !descriptor ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        ancestors.delete(value);
        return invalid(`array_entry_surface:${pointer}/${index}`);
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        budget,
        depth + 1,
      );
      if (!nested.ok) {
        ancestors.delete(value);
        return nested;
      }
      output.push(nested.value);
    }
    ancestors.delete(value);
    return Object.freeze({ ok: true, value: output });
  }

  if (prototype !== Object.prototype) {
    ancestors.delete(value as object);
    return invalid(`non_plain_object:${at}`);
  }
  budget.keys += keys.length;
  if (budget.keys > SNAPSHOT_LIMITS.maximumKeys) {
    ancestors.delete(value as object);
    return invalid(`snapshot_key_limit:${at}`);
  }
  let descriptors: Record<PropertyKey, PropertyDescriptor>;
  try {
    descriptors = Object.getOwnPropertyDescriptors(value) as Record<
      PropertyKey,
      PropertyDescriptor
    >;
  } catch {
    ancestors.delete(value as object);
    return invalid(`reflection_failed:${at}`);
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    if (FORBIDDEN_KEYS.has(key)) {
      ancestors.delete(value as object);
      return invalid(`forbidden_key:${pointer}/${key}`);
    }
    const descriptor = descriptors[key];
    if (
      !descriptor ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      ancestors.delete(value as object);
      return invalid(`object_property_surface:${pointer}/${key}`);
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      budget,
      depth + 1,
    );
    if (!nested.ok) {
      ancestors.delete(value as object);
      return nested;
    }
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  ancestors.delete(value as object);
  return Object.freeze({ ok: true, value: output });
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON =
  canonicalJson(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-postprojection-policy/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_EXPECTED_SHA256 =
  "8894ad4c3fe5c104d8e97a8488ea8a203d35934938798f0be7ae7c13573d8072" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  220450 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_newtonian_seed_postprojection_policy_literal_binding_drift",
  );
}
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_ARTIFACT_ID,
    contractVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CONTRACT_VERSION,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_SIZE_BYTES,
  });
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_LITERAL_SEAL_STATUS =
  "sealed_preregistration_read_only_red_team_clear" as const;

const EXPECTED_CANONICAL_JSON =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON;

export const nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations =
  (value: unknown): string[] => {
    if (
      value === NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1
    ) {
      return [];
    }
    let snapshot: SnapshotResult;
    try {
      snapshot = snapshotPlainData(value);
    } catch {
      return ["postprojection_policy_v1_plain_data_snapshot_invalid"];
    }
    if (!snapshot.ok) return [snapshot.violation];
    try {
      return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
        ? ["postprojection_policy_v1_external_copy_not_authoritative"]
        : ["postprojection_policy_v1_semantic_mismatch"];
    } catch {
      return ["postprojection_policy_v1_plain_data_snapshot_invalid"];
    }
  };

export const isNhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1 = (
  value: unknown,
): value is Nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1 =>
  nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(value)
    .length === 0;
