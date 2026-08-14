import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING,
  nhm2SphericalBosonStarV2InitializerBindingViolations,
} from "./nhm2-spherical-boson-star-v2-initializer-bridge.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_preexecution_profile" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_preexecution_profile/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_COMMAND_ARGV_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/command-argv/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/static-input-aggregate/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_FRESHNESS_INVENTORY_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/freshness-inventory/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_DIRTY_TREE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/dirty-tree/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUNTIME_CLOSURE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/runtime-closure/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/output-root/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PRESEAL_ENVELOPE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/preseal-envelope/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PRESEAL_PUBLICATION_RECEIPT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/preseal-publication-receipt/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_AUTHORITY_LOCKS =
  Object.freeze({
    implementationClosureAuthority: false as const,
    runtimeClosureAuthority: false as const,
    presealPersistenceAuthority: false as const,
    executionAuthority: false as const,
    executionObserved: false as const,
    candidateAuthority: false as const,
    branchAuthority: false as const,
    nondegeneracyAuthority: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export type Nhm2SphericalV2LinuxFileStatV1 = Readonly<{
  fileType: "regular";
  ownerUid: string;
  ownerGid: string;
  linkCount: "1";
  modeOctal: "0400" | "0500";
  device: string;
  inode: string;
  changeTimeNanoseconds: string;
  modifyTimeNanoseconds: string;
  sizeBytes: number;
  sha256: string;
}>;

export type Nhm2SphericalV2RunIdentityV1 = Readonly<{
  ownerUid: string;
  ownerGid: string;
  supplementaryGids: readonly [];
}>;

export type Nhm2SphericalV2StaticInputKindV1 =
  | "canonical_json"
  | "source_text"
  | "f64le"
  | "dependency_lock"
  | "executable"
  | "elf_interpreter"
  | "shared_object"
  | "opaque_binary";

export type Nhm2SphericalV2StaticInputRoleV1 =
  | "v2_candidate_freeze"
  | "initializer_bridge"
  | "scientific_candidate_manifest"
  | "scientific_preseal"
  | "scientific_persistence_receipt"
  | "source_manifest"
  | "source_file"
  | "source_payload"
  | "build_recipe"
  | "dependency_lock"
  | "toolchain_manifest"
  | "executable"
  | "elf_interpreter"
  | "shared_object";

export type Nhm2SphericalV2StaticInputEntryV1 = Readonly<{
  relativePath: string;
  semanticRole: Nhm2SphericalV2StaticInputRoleV1;
  semanticKind: Nhm2SphericalV2StaticInputKindV1;
  mediaType: "application/json" | "application/octet-stream" | "text/plain";
  sizeBytes: number;
  sha256: string;
  stat: Nhm2SphericalV2LinuxFileStatV1;
}>;

export type Nhm2SphericalV2FreshnessObservationV1 = Readonly<{
  relativePath: string;
  preopen: Nhm2SphericalV2LinuxFileStatV1;
  postread: Nhm2SphericalV2LinuxFileStatV1;
  stable: true;
}>;

export type Nhm2SphericalV2DirtyTreeEntryV1 = Readonly<{
  relativePath: string;
  gitPorcelainV2RecordHex: string;
  indexStage0ObjectId: string | null;
  worktreeRawBytes: Uint8Array;
  worktreeSizeBytes: number;
  worktreeSha256: string;
  worktreeStat: Nhm2SphericalV2LinuxFileStatV1;
}>;

export type Nhm2SphericalV2DirtyTreeRawEvidenceV1 = Readonly<{
  scopedPathspecs: readonly [string, ...string[]];
  rawPorcelainV2ZBytes: Uint8Array;
}>;

export type Nhm2SphericalV2RawBindingV1 = Readonly<{
  path: string;
  mediaType: "application/json" | "application/octet-stream" | "text/plain";
  sizeBytes: number;
  sha256: string;
}>;

export type Nhm2SphericalV2PresealFileBindingV1 = Readonly<{
  path: string;
  mediaType: "application/json";
  sizeBytes: number;
  rawSha256: string;
  presealEnvelopeSha256: string;
}>;

export type Nhm2SphericalV2RuntimeObjectV1 = Readonly<{
  ordinal: number;
  kind: "elf_interpreter" | "shared_object";
  requestedName: string;
  resolvedAbsolutePath: string;
  binding: Nhm2SphericalV2RawBindingV1;
  stat: Nhm2SphericalV2LinuxFileStatV1;
  elfClass: "ELF64";
  endianness: "little";
  machine: "x86_64";
  buildIdLowercaseHex: string;
  soname: string;
  neededInOrder: readonly string[];
}>;

export type Nhm2SphericalV2RuntimeClosureV1 = Readonly<{
  schemaVersion: "nhm2_spherical_boson_star_v2_runtime_closure/v1";
  authorityFalse: true;
  executableBinding: Nhm2SphericalV2RawBindingV1;
  executableStat: Nhm2SphericalV2LinuxFileStatV1;
  executableElfInterpreter: string;
  executableNeededInOrder: readonly string[];
  objectsInLoadOrder: readonly [
    Nhm2SphericalV2RuntimeObjectV1,
    ...Nhm2SphericalV2RuntimeObjectV1[],
  ];
  ambientLdLibraryPath: "empty";
  loaderCacheUsed: false;
  byteDerivedExpectedClosureComplete: true;
  actualLoaderResolutionObserved: false;
  closureComplete: false;
}>;

export type Nhm2SphericalV2RuntimeFileByteEvidenceV1 = Readonly<{
  kind: "elf_interpreter" | "shared_object";
  requestedName: string;
  resolvedAbsolutePath: string;
  binding: Nhm2SphericalV2RawBindingV1;
  stat: Nhm2SphericalV2LinuxFileStatV1;
  rawBytes: Uint8Array;
}>;

export type Nhm2SphericalV2RuntimeClosureByteEvidenceV1 = Readonly<{
  schemaVersion: "nhm2_spherical_boson_star_v2_runtime_byte_evidence/v1";
  authorityFalse: true;
  executableBinding: Nhm2SphericalV2RawBindingV1;
  executableStat: Nhm2SphericalV2LinuxFileStatV1;
  executableRawBytes: Uint8Array;
  objectsInLoadOrder: readonly [
    Nhm2SphericalV2RuntimeFileByteEvidenceV1,
    ...Nhm2SphericalV2RuntimeFileByteEvidenceV1[],
  ];
  ambientLdLibraryPath: "empty";
  loaderCacheUsed: false;
}>;

export type Nhm2SphericalV2OutputRootObservationV1 = Readonly<{
  role: "primary" | "independent";
  absolutePath: string;
  observedAbsent: true;
}>;

export type Nhm2SphericalV2StaticInputByteEvidenceV1 = Readonly<{
  entry: Nhm2SphericalV2StaticInputEntryV1;
  rawBytes: Uint8Array;
}>;

export type Nhm2SphericalV2PresealEvidenceV1 = Readonly<{
  attemptOrdinal: 1;
  argv: readonly [string, ...string[]];
  bootId: string;
  commit40: string;
  createdMonotonicRawNanoseconds: string;
  createdWallUtc: string;
  dirtyTreeEntries: readonly Nhm2SphericalV2DirtyTreeEntryV1[];
  dirtyTreeRawEvidence: Nhm2SphericalV2DirtyTreeRawEvidenceV1;
  freshnessObservations: readonly Nhm2SphericalV2FreshnessObservationV1[];
  initializerBinding: unknown;
  outputRoots: readonly [
    Nhm2SphericalV2OutputRootObservationV1,
    Nhm2SphericalV2OutputRootObservationV1,
  ];
  runIdentity: Nhm2SphericalV2RunIdentityV1;
  runtimeEvidence: Nhm2SphericalV2RuntimeClosureByteEvidenceV1;
  staticInputByteEvidence: readonly Nhm2SphericalV2StaticInputByteEvidenceV1[];
  workingDirectory: string;
}>;

export type Nhm2SphericalV2DerivedPresealContextV1 = Readonly<{
  contextVersion: "nhm2_spherical_boson_star_v2_derived_preseal_context/v1";
  preseal: Readonly<Record<string, unknown>>;
  rawPresealBytes: Uint8Array;
}>;

const NHM2_V2_SERVER_FILESYSTEM_OBSERVATION_CONTEXT_BRAND: unique symbol =
  Symbol("nhm2-v2-server-filesystem-observation-context");
const NHM2_V2_SERVER_LOADER_OBSERVATION_CONTEXT_BRAND: unique symbol = Symbol(
  "nhm2-v2-server-loader-observation-context",
);
const NHM2_V2_SERVER_SYSCALL_TRACE_CONTEXT_BRAND: unique symbol = Symbol(
  "nhm2-v2-server-syscall-trace-context",
);
const NHM2_V2_VALIDATED_PRESEAL_CONTEXT_BRAND: unique symbol = Symbol(
  "nhm2-v2-validated-preseal-context",
);

/**
 * Opaque capabilities reserved for a future server-owned observer. This module
 * deliberately exports no issuer while that observer is absent. A structural
 * copy (including an `as any` cast) is rejected by the private WeakSets below.
 */
export type Nhm2SphericalV2ServerFilesystemObservationContextV1 = Readonly<{
  contextVersion: "nhm2_spherical_boson_star_v2_server_filesystem_observation_context/v1";
  readonly [NHM2_V2_SERVER_FILESYSTEM_OBSERVATION_CONTEXT_BRAND]: true;
}>;
export type Nhm2SphericalV2ServerLoaderObservationContextV1 = Readonly<{
  contextVersion: "nhm2_spherical_boson_star_v2_server_loader_observation_context/v1";
  readonly [NHM2_V2_SERVER_LOADER_OBSERVATION_CONTEXT_BRAND]: true;
}>;
export type Nhm2SphericalV2ServerSyscallTraceContextV1 = Readonly<{
  contextVersion: "nhm2_spherical_boson_star_v2_server_syscall_trace_context/v1";
  readonly [NHM2_V2_SERVER_SYSCALL_TRACE_CONTEXT_BRAND]: true;
}>;
export type Nhm2SphericalV2ValidatedPresealContextV1 = Readonly<{
  contextVersion: "nhm2_spherical_boson_star_v2_validated_preseal_context/v1";
  preseal: Readonly<Record<string, unknown>>;
  rawPresealBytes: Uint8Array;
  readonly [NHM2_V2_VALIDATED_PRESEAL_CONTEXT_BRAND]: true;
}>;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_READINESS =
  Object.freeze({
    filesystemObservationAuthenticated: false as const,
    syscallTraceAuthenticated: false as const,
    actualRuntimeLoaderResolutionAuthenticated: false as const,
    exactObservationReadiness: false as const,
    runtimeClosureReadiness: false as const,
    launchReadiness: false as const,
    blockers: Object.freeze([
      "server_authenticated_filesystem_observer_not_implemented",
      "server_authenticated_syscall_tracer_not_implemented",
      "server_authenticated_runtime_loader_observer_not_implemented",
      "actual_runtime_loader_path_identity_unobserved",
    ] as const),
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS =
  Object.freeze({
    maximumRawBytesPerFile: 64 * 1024 * 1024,
    maximumAggregateRawBytes: 256 * 1024 * 1024,
    maximumAggregatePreflightEvidenceBytes: 256 * 1024 * 1024,
    maximumCanonicalJsonRawBytesPerFile: 16 * 1024 * 1024,
    maximumCanonicalJsonTokensPerFile: 1_000_000,
    maximumAggregateCanonicalJsonTokens: 2_000_000,
    maximumCanonicalJsonNumberTokenBytes: 64,
    maximumCanonicalJsonNumberDigitsPerToken: 32,
    maximumAggregateCanonicalJsonNumberDigits: 1_000_000,
    maximumDirtyTreeRecordCount: 16_384,
    maximumDirtyTreeRawRecordBytes: 16 * 1024,
    maximumDirtyTreeRecordHexCharacters: 32 * 1024,
    maximumUnsignedDecimalDigits: 20,
  } as const);

const MEDIA_TYPE_BY_KIND = Object.freeze({
  canonical_json: "application/json",
  source_text: "text/plain",
  f64le: "application/octet-stream",
  dependency_lock: "application/octet-stream",
  executable: "application/octet-stream",
  elf_interpreter: "application/octet-stream",
  shared_object: "application/octet-stream",
  opaque_binary: "application/octet-stream",
} as const);

const STATIC_ROLE_KIND = Object.freeze({
  v2_candidate_freeze: "canonical_json",
  initializer_bridge: "canonical_json",
  scientific_candidate_manifest: "canonical_json",
  scientific_preseal: "canonical_json",
  scientific_persistence_receipt: "canonical_json",
  source_manifest: "canonical_json",
  source_file: "source_text",
  source_payload: "f64le",
  build_recipe: "source_text",
  dependency_lock: "dependency_lock",
  toolchain_manifest: "canonical_json",
  executable: "executable",
  elf_interpreter: "elf_interpreter",
  shared_object: "shared_object",
} as const satisfies Readonly<
  Record<Nhm2SphericalV2StaticInputRoleV1, Nhm2SphericalV2StaticInputKindV1>
>);

export const NHM2_SPHERICAL_BOSON_STAR_V2_REQUIRED_STATIC_INPUT_ROLES =
  Object.freeze(
    Object.keys(
      STATIC_ROLE_KIND,
    ) as readonly Nhm2SphericalV2StaticInputRoleV1[],
  );

const REPEATABLE_STATIC_INPUT_ROLES = new Set<Nhm2SphericalV2StaticInputRoleV1>(
  ["source_file", "source_payload", "shared_object"],
);

const PROFILE = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CONTRACT_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  maturity:
    "stage_2_closed_preexecution_provenance_and_durability_grammar_without_run_instance_or_execution_authority",
  frozenBeforeCandidateExecution: true,
  bindings: {
    candidateFreeze: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    initializerBridge: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING,
  },
  platformBoundary: {
    operatingSystem: "Linux",
    minimumKernelInterfaces: [
      "openat2_RESOLVE_BENEATH_NO_SYMLINKS_NO_MAGICLINKS_NO_XDEV",
      "renameat2_RENAME_NOREPLACE",
      "fsync_regular_file_and_directory",
      "CLOCK_MONOTONIC_RAW",
      "statx_nanosecond_identity",
    ],
    currentWindowsHostExecutionAdmissible: false,
    oneLocalFilesystemRequiredForEachAtomicPublication: true,
  },
  identityStringProfile: {
    jsonStrings: "valid_Unicode_scalar_values_without_NUL_and_NFC_required",
    identityBearingPathsRolesIdsAndMediaTypes:
      "printable_ASCII_only_so_Unicode_normalization_is_identity_and_no_non_ASCII_casefold_table_is_implicit",
    pathNormalization: "NFC_required_before_ASCII_admission",
    aliasKey:
      "ASCII_lowercase_of_the_NFC_path_bytes_with_exact_and_alias-key_duplicates_rejected",
    caseSensitivity:
      "raw_path_bytes_remain_case_sensitive_after_alias_rejection",
    argv: "valid_Unicode_scalar_values_without_NUL_each_NFC_and_hashed_as_exact_UTF8_without_shell_reparse",
  },
  mediaTypeRegistry: {
    exactAllowed: [
      "application/json",
      "application/octet-stream",
      "text/plain",
    ],
    exactBySemanticKind: MEDIA_TYPE_BY_KIND,
    parametersAllowed: false,
    comparison: "exact_lowercase_ASCII_bytes",
  },
  linuxFileIdentitySchema: {
    exactKeys: [
      "changeTimeNanoseconds",
      "device",
      "fileType",
      "inode",
      "linkCount",
      "modeOctal",
      "modifyTimeNanoseconds",
      "ownerGid",
      "ownerUid",
      "sha256",
      "sizeBytes",
    ],
    fileType: "regular",
    decimalFields:
      "canonical_unsigned_base10_without_leading_zero_except_literal_0",
    linkCount: "literal_1",
    modes:
      "owner_only_0400_for_data_or_0500_for_executables_with_no_group_or_world_bits",
    ownership:
      "nonzero_ownerUid_and_nonzero_ownerGid_equal_the_predeclared_read_only_run_identity_and_supplementaryGids_is_exactly_empty",
    stability:
      "device_inode_owner_uid_owner_gid_link_count_mode_size_mtime_ctime_and_sha256_identical_preopen_and_postread",
  },
  commandArgv: {
    hashDomain: NHM2_SPHERICAL_BOSON_STAR_V2_COMMAND_ARGV_SHA256_DOMAIN,
    recipe:
      "SHA256(domain_utf8||u64le(argc)||for_each_arg(u64le(arg_utf8_length)||arg_utf8))",
    maximumArgumentCount: 256,
    maximumArgumentUtf8Bytes: 65536,
    shellCommandStringIsEvidenceOnlyAndNeverHashAuthority: true,
    launchMustUseExactArgvWithoutShellReparse: true,
  },
  staticInputInventory: {
    hashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN,
    recipe:
      "SHA256(domain_utf8||u64le(entryCount)||for_each_entry_in_strict_raw_UTF8_path_order(u64le(canonical_entry_length)||canonical_entry_bytes))",
    entryExactKeys: [
      "mediaType",
      "relativePath",
      "semanticKind",
      "semanticRole",
      "sha256",
      "sizeBytes",
      "stat",
    ],
    requiredScopes: [
      "v2_candidate_freeze_and_initializer_bridge",
      "scientific_candidate_manifest_preseal_and_persistence_receipts",
      "source_manifests_and_every_source_file",
      "build_recipes_dependency_locks_toolchain_and_executable",
      "ELF_interpreter_and_transitive_shared_library_closure",
      "exact_command_working_directory_and_predeclared_output_root_identity",
    ],
    maximumEntries: 16384,
    exactAndCaseFoldAliasDuplicatesRejected: true,
    semanticRoleKindRegistry: STATIC_ROLE_KIND,
    requiredRolesExactlyClosed:
      NHM2_SPHERICAL_BOSON_STAR_V2_REQUIRED_STATIC_INPUT_ROLES,
    repeatableRoles: ["source_file", "source_payload", "shared_object"],
    singletonRolesAppearExactlyOnce: true,
    repeatableRolesAppearAtLeastOnce: true,
  },
  freshnessInventory: {
    hashDomain: NHM2_SPHERICAL_BOSON_STAR_V2_FRESHNESS_INVENTORY_SHA256_DOMAIN,
    recipe:
      "SHA256(domain_utf8||u64le(observationCount)||for_each_observation_in_strict_raw_UTF8_path_order(u64le(canonical_observation_length)||canonical_observation_bytes))",
    exactInventoryEqualityWithStaticInputsRequired: true,
    exactPreopenAndPostreadEqualityWithEachStaticInputStatRequired: true,
    preopenCapturedBeforeOpenat2: true,
    postreadCapturedFromSameOpenFileDescriptionAfterHash: true,
    stableLiteralTrueOnlyAfterEveryIdentityFieldMatches: true,
    observationCompletesBeforePresealCreation: true,
  },
  dirtyTreeFraming: {
    hashDomain: NHM2_SPHERICAL_BOSON_STAR_V2_DIRTY_TREE_SHA256_DOMAIN,
    scope:
      "exact_repository_subset_reachable_from_source_build_recipe_lock_contract_fixture_and_static_input_manifests_including_clean_tracked_modified_and_untracked_entries",
    entryExactKeys: [
      "gitPorcelainV2RecordHex",
      "indexStage0ObjectId",
      "relativePath",
      "worktreeRawBytes",
      "worktreeSha256",
      "worktreeSizeBytes",
      "worktreeStat",
    ],
    recipe:
      "SHA256(domain_utf8||commit40_ascii||u64le(scopeCount)||for_each_scope(u64le(scope_utf8_length)||scope_utf8)||u64le(raw_porcelain_v2_z_length)||raw_porcelain_v2_z||u64le(entryCount)||for_each_entry_in_raw_record_order(u64le(path_length)||path||u64le(index_object_id_ascii_length_or_0)||index_object_id_ascii_if_present||u64le(worktreeSizeBytes)||worktreeSha256_32||u64le(canonical_worktree_stat_length)||canonical_worktree_stat_bytes))_after_recomputing_size_and_hash_from_capped_worktreeRawBytes",
    statusCapture:
      "git_status_porcelain_v2_z_with_raw_record_bytes_hex_encoded_canonically_and_cross_bound_to_index_stage0_and_worktree_bytes",
    byteFacingApiRequiresNonoptionalScopedPathspecsAndRawPorcelainV2ZBytes: true,
    everyDirtyEntryRequiresCappedWorktreeBytesAndStableStat: true,
    maximumRecordCount:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumDirtyTreeRecordCount,
    maximumRawRecordBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumDirtyTreeRawRecordBytes,
    maximumRecordHexCharacters:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumDirtyTreeRecordHexCharacters,
    populationPreflight:
      "scan_the_original_byte_view_and_reject_unterminated_empty_unknown_oversized_or_excess_records_and_inventory_count_mismatch_before_raw_or_per_record_Buffer_copy",
    recordHexPreflight:
      "cap_even_nonempty_lowercase_hex_lexical_length_charge_every_character_to_the_whole_evidence_budget_then_validate_all_characters_before_any_hex_decode",
    matchingStaticInputRequiresExactByteAndStatCrossBinding: true,
    trackedCleanCoverage:
      "commit40_binds_clean_tracked_tree_bytes_while_entries_exhaustively_bind_only_scoped_nonclean_or_untracked_porcelain_records",
    emptyEntryInventoryAllowedOnlyForAnExactlyEmptyScopedPorcelainStream: true,
    zeroDigestOrNonemptyStatusOmissionAllowed: false,
  },
  runtimeClosure: {
    hashDomain: NHM2_SPHERICAL_BOSON_STAR_V2_RUNTIME_CLOSURE_SHA256_DOMAIN,
    recipe:
      "SHA256(domain_utf8||u64le(canonical_runtime_manifest_length)||canonical_runtime_manifest_bytes)",
    executable:
      "exact_regular_owned_nonwritable_ELF64_x86_64_little_endian_file",
    interpreter:
      "exact_PT_INTERP_target_is_objectsInLoadOrder[0]_and_is_hash_stat_owner_mode_bound",
    dependencyDiscovery:
      "parse_DT_NEEDED_for_executable_and_every_discovered_object_then_resolve_each_name_once_under_the_empty_ambient_environment_without_ld_so_cache",
    byteFacingParser:
      "ELF64_little_endian_x86_64_program_headers_PT_INTERP_PT_DYNAMIC_DT_STRTAB_DT_STRSZ_DT_NEEDED_DT_SONAME_and_GNU_build_id_are_derived_from_the_bound_raw_bytes",
    closureRule:
      "byte_parsing_derives_only_the_expected_dependency_graph;actual_loader_resolution_and_loaded_object_identity_require_a_separate_opaque_server_loader_observation_context",
    ownership:
      "executable_interpreter_and_every_shared_object_stat_owner_uid_gid_equal_the_predeclared_read_only_run_identity",
    loadOrder:
      "interpreter_first_then_deterministic_breadth_first_DT_NEEDED_order_with_first_discovery_wins",
    ambientLdLibraryPath: "empty",
    loaderCacheUsed: false,
    dlopenAfterLaunchAllowed: false,
    byteDerivedExpectedClosureComplete: true,
    actualLoaderResolutionObserved: false,
    closureComplete: false,
    readinessBlocker:
      "server_authenticated_runtime_loader_observer_not_implemented",
  },
  outputRootIdentity: {
    hashDomain: NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_SHA256_DOMAIN,
    recipe:
      "SHA256(domain_utf8||u64le(2)||for_primary_then_independent(u64le(canonical_observation_length)||canonical_observation_bytes))",
    rootsPredeclaredAbsentAndPairwiseDisjoint: true,
    primaryAndIndependentRootsMayNotCaseFoldAlias: true,
    neitherRootMayBeAnExactOrCasefoldedAncestorOfTheOther: true,
  },
  preexecutionPresealSchema: {
    schemaVersion: "nhm2_spherical_boson_star_v2_preexecution_preseal/v1",
    exactKeys: [
      "artifactId",
      "attemptOrdinal",
      "authorityFalse",
      "bootId",
      "candidateId",
      "claimLocks",
      "commandArgvSha256",
      "commit40",
      "createdMonotonicRawNanoseconds",
      "createdWallUtc",
      "dirtyTreeDigestSha256",
      "executableBinding",
      "freshnessInventorySha256",
      "initializerBinding",
      "outputRootIdentitySha256",
      "presealSha256",
      "runIdentity",
      "runtimeClosureSha256",
      "schemaVersion",
      "scientificPresealBinding",
      "sourceManifestBinding",
      "staticInputAggregateSha256",
      "toolchainManifestBinding",
      "v2CandidateFreezeBinding",
      "workingDirectory",
    ],
    hashDomain: NHM2_SPHERICAL_BOSON_STAR_V2_PRESEAL_ENVELOPE_SHA256_DOMAIN,
    hashRecipe:
      "SHA256(domain_utf8||u64le(canonical_preseal_without_presealSha256_length)||canonical_preseal_without_presealSha256_bytes)",
    noSelfOrPublicationReceiptHashInsideUnsignedEnvelope: true,
    bindingFields: {
      v2CandidateFreezeBinding:
        "exact_NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING",
      initializerBinding:
        "valid_nhm2_spherical_boson_star_v2_initializer_binding_v1",
      sourceManifestBinding:
        "exact_raw_application_json_binding_with_size_and_sha256",
      toolchainManifestBinding:
        "exact_raw_application_json_binding_with_size_and_sha256",
      scientificPresealBinding:
        "exact_raw_application_json_binding_with_size_and_sha256",
      executableBinding:
        "exact_raw_application_octet_stream_binding_with_size_and_sha256",
    },
    immutableAfterExclusiveCreation: true,
  },
  presealDurablePublicationReceiptSchema: {
    contractVersion:
      "nhm2_spherical_boson_star_v2_preseal_publication_receipt/v1",
    authority: "server_observed_durability_only_no_candidate_authority",
    exactKeys: [
      "artifactId",
      "authority",
      "bootId",
      "candidateId",
      "claimLocks",
      "contractVersion",
      "fileFsyncCompletedMonotonicRawNanoseconds",
      "finalFileStat",
      "parentDirectoryFsyncBeforeRenameMonotonicRawNanoseconds",
      "parentDirectoryFsyncAfterRenameMonotonicRawNanoseconds",
      "presealBinding",
      "publicationReceiptSha256",
      "readbackCompletedMonotonicRawNanoseconds",
      "renameNoreplaceCompletedMonotonicRawNanoseconds",
      "runIdentity",
      "syscallTraceBinding",
      "temporaryFileStat",
    ],
    hashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_PRESEAL_PUBLICATION_RECEIPT_SHA256_DOMAIN,
    hashRecipe:
      "SHA256(domain_utf8||u64le(canonical_receipt_without_publicationReceiptSha256_length)||canonical_receipt_without_publicationReceiptSha256_bytes)",
    presealBindingExactKeys: [
      "mediaType",
      "path",
      "presealEnvelopeSha256",
      "rawSha256",
      "sizeBytes",
    ],
    presealBindingRelation:
      "rawSha256_and_size_bind_the_final_canonical_preseal_file_while_presealEnvelopeSha256_equals_the_validated_domain_separated_self_hash_inside_that_file",
    requiredSyscallOrder: [
      "openat2_temp_O_CREAT_O_EXCL_O_NOFOLLOW_mode0400",
      "complete_write_and_fsync_temp_file",
      "close_reopenat2_rehash_and_identity_stability_check",
      "fsync_parent_directory_before_rename",
      "renameat2_RENAME_NOREPLACE_temp_to_final",
      "fsync_parent_directory_after_rename",
      "openat2_final_readback_rehash_and_identity_check",
    ],
    syscallTraceBindingRequired: true,
    syscallTraceMediaType: "application/json",
    syscallTraceMustBeCanonicalValidatedAndContextBound: true,
    receiptValidationRequiresValidatedPresealContextAndBothRawByteStreams: true,
    temporaryAndFinalMode: "0400",
    renameIdentityRelation:
      "device_inode_owner_uid_owner_gid_link_count_mode_size_mtime_and_sha256_stable_while_final_ctime_is_not_less_than_temporary_ctime",
    receiptCannotBeEmbeddedInEarlierPreseal: true,
    launchEnvelopeMustBindPresealAndPublicationReceiptSeparately: true,
  },
  chronology: {
    strictOrder: [
      "candidate_freeze_literal_seal",
      "complete_scientific_manifest_and_scientific_preseal",
      "initializer_binding_materialization",
      "read_only_run_uid_gid_and_output_roots_predeclared",
      "source_toolchain_executable_runtime_and_dirty_tree_closure",
      "static_input_preopen_postread_freshness_inventory",
      "preexecution_preseal_creation",
      "preseal_file_fsync_reopen_rehash_parent_fsync_rename_noreplace_parent_fsync_readback",
      "launch_envelope_creation_binding_both_preseal_and_publication_receipt",
      "process_launch",
      "run_timing_and_postrun_output_freshness_observation",
    ],
    everyMonotonicCounter:
      "canonical_unsigned_decimal_CLOCK_MONOTONIC_RAW_nanoseconds_from_one_boot",
    bootIdentity:
      "lowercase_Linux_boot_id_UUID_bound_in_both_preseal_and_publication_receipt_and_required_equal",
    wallClock:
      "RFC3339_UTC_with_exactly_nine_fractional_digits_for_cross_system_provenance_only",
    processLaunchBeforeDurableReadbackAllowed: false,
    everyPublicationTraceEventAndReceiptCounterNotEarlierThanPresealCreation: true,
  },
  authenticatedObservationBoundary: {
    plainCallerObjectsAcceptedAsObservationAuthority: false,
    opaqueServerFilesystemObservationContextRequired: true,
    opaqueServerSyscallTraceContextRequired: true,
    opaqueServerLoaderObservationContextRequired: true,
    filesystemObserverImplemented: false,
    syscallTracerImplemented: false,
    runtimeLoaderObserverImplemented: false,
    exactObservationReadiness: false,
    blockers: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_READINESS.blockers,
  },
  resourceLimits: {
    ...NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS,
    rawByteLimitsCheckedBeforeBufferCopy: true,
    wholePresealEvidenceRawAggregateCheckedBeforeFirstBufferCopy: true,
    dirtyTreeRecordHexCharactersIncludedInWholeEvidencePreflightBudget: true,
    dirtyTreePopulationAndRecordHexLexicalChecksBeforePerRecordBufferCopy: true,
    canonicalJsonPerFileAndAggregateTokenAndDigitLimitsCheckedBeforeBufferCopyAndJsonParse: true,
    unsignedDecimalDigitAndU64RangeCheckedBeforeBigInt: true,
  },
  failurePolicy: {
    anyHashIdentityOwnershipModeFreshnessRuntimeClosureFsyncOrChronologyMismatch:
      "fail_the_single_frozen_v2_candidate_before_launch",
    retryRetuneAlternateBranchOrThresholdChangeAllowed: false,
    partialPresealOrOutputAuthority: false,
  },
  completionBoundary: {
    profileComplete: true,
    sourceManifestInstancePresent: false,
    toolchainManifestInstancePresent: false,
    runtimeClosureInstancePresent: false,
    freshnessInventoryInstancePresent: false,
    presealInstancePresent: false,
    durablePublicationReceiptPresent: false,
    authenticatedFilesystemObservationPresent: false,
    authenticatedSyscallTracePresent: false,
    authenticatedRuntimeLoaderObservationPresent: false,
    exactObservationReady: false,
    actualRuntimeClosureReady: false,
    launchAuthorized: false,
    executionObserved: false,
  },
  evidenceBuilder: {
    diagnosticDeriverRecomputesAllDigestsFromBoundBytesWithoutObservationAuthority: true,
    validatedBuilderRequiresOpaqueServerFilesystemAndLoaderContexts: true,
    validatedBuilderCurrentlyReachable: false,
    recomputed:
      "argv_static_inventory_freshness_dirty_tree_ELF_runtime_output_roots_raw_manifest_bindings_and_preseal_self_hash",
    handwrittenDigestFieldsAccepted: false,
  },
  authorityLocks: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>))
    deepFreeze(child, seen);
  return Object.freeze(value);
};
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE =
  deepFreeze(PROFILE);

export const nhm2SphericalBosonStarV2PreexecutionCanonicalJson = (
  value: unknown,
): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(nhm2SphericalBosonStarV2PreexecutionCanonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${nhm2SphericalBosonStarV2PreexecutionCanonicalJson(record[key])}`,
    )
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution-profile/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_JSON =
  nhm2SphericalBosonStarV2PreexecutionCanonicalJson(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_EXPECTED_SHA256 =
  "55779b720d9ff362f0598dde0b695f2c69616726c26fd41e40eafa17c13abead" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_EXPECTED_CANONICAL_SIZE_BYTES =
  17720 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_OBJECT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const U64_DECIMAL_MAX = "18446744073709551615";
const LINUX_BOOT_ID =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const ASCII_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\/\/)[\x21-\x7e]+$/;
const HEX_BYTES = /^(?:[a-f0-9]{2})*$/;
const EXACT_STAT_KEYS = [
  "changeTimeNanoseconds",
  "device",
  "fileType",
  "inode",
  "linkCount",
  "modeOctal",
  "modifyTimeNanoseconds",
  "ownerGid",
  "ownerUid",
  "sha256",
  "sizeBytes",
] as const;
const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  );
};
const exactEnumerableDataKeys = (
  value: object,
  expected: readonly string[],
): boolean => {
  const keys = Reflect.ownKeys(value);
  if (
    keys.some((key) => typeof key !== "string") ||
    !exactKeys(value as Record<string, unknown>, expected)
  )
    return false;
  return (keys as string[]).every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return (
      descriptor != null &&
      "value" in descriptor &&
      descriptor.enumerable === true
    );
  });
};
const densePlainArray = (
  value: unknown,
  minimumLength: number,
  maximumLength: number,
): value is readonly unknown[] => {
  if (
    !Array.isArray(value) ||
    isProxy(value) ||
    Object.getPrototypeOf(value) !== Array.prototype ||
    value.length < minimumLength ||
    value.length > maximumLength ||
    Object.keys(value).length !== value.length
  )
    return false;
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!(
      descriptor != null &&
      "value" in descriptor &&
      descriptor.enumerable === true
    ))
      return false;
  }
  return true;
};
const u64le = (value: number): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new TypeError("v2_preexecution_u64_invalid");
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
};
const nonzeroSha = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);
const strictPath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.normalize("NFC") === value &&
  ASCII_PATH.test(value) &&
  !value.includes("\\") &&
  Buffer.byteLength(value, "utf8") <= 4096;
const strictAbsolutePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.startsWith("/") &&
  strictPath(value.slice(1));
const sameCanonical = (left: unknown, right: unknown): boolean =>
  nhm2SphericalBosonStarV2PreexecutionCanonicalJson(left) ===
  nhm2SphericalBosonStarV2PreexecutionCanonicalJson(right);
const sortedUniquePaths = (paths: readonly string[]): boolean =>
  paths.every((path, index) => {
    if (index === 0) return true;
    const prior = Buffer.from(paths[index - 1]!, "utf8");
    return Buffer.compare(prior, Buffer.from(path, "utf8")) < 0;
  }) && new Set(paths.map((path) => path.toLowerCase())).size === paths.length;

const u64DecimalValid = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    value.length >
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumUnsignedDecimalDigits ||
    !DECIMAL.test(value)
  )
    return false;
  return (
    value.length < U64_DECIMAL_MAX.length ||
    (value.length === U64_DECIMAL_MAX.length && value <= U64_DECIMAL_MAX)
  );
};

const u64DecimalBigInt = (value: unknown, code: string): bigint => {
  if (!u64DecimalValid(value)) throw new TypeError(code);
  return BigInt(value);
};

const byteViewLength = (value: unknown, code: string): number => {
  if (
    value == null ||
    typeof value !== "object" ||
    isProxy(value) ||
    !ArrayBuffer.isView(value) ||
    !(value instanceof Uint8Array) ||
    ![Uint8Array.prototype, Buffer.prototype].includes(
      Object.getPrototypeOf(value),
    ) ||
    (typeof SharedArrayBuffer !== "undefined" &&
      value.buffer instanceof SharedArrayBuffer) ||
    !Number.isSafeInteger(value.byteLength) ||
    value.byteLength < 0 ||
    value.byteLength >
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumRawBytesPerFile
  )
    throw new TypeError(code);
  return value.byteLength;
};

const ownedBytes = (value: unknown, code: string): Buffer => {
  byteViewLength(value, code);
  try {
    return Buffer.from(value as Uint8Array);
  } catch {
    throw new TypeError(code);
  }
};

const dirtyTreeRecordHexShapeValid = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length >= 2 &&
  value.length <=
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumDirtyTreeRecordHexCharacters &&
  value.length % 2 === 0;

const dirtyTreeRecordHexCharactersValid = (value: string): boolean =>
  HEX_BYTES.test(value);

const inspectPorcelainV2ZRecordPopulation = (
  rawValue: unknown,
  code: string,
): number => {
  const rawLength = byteViewLength(rawValue, code);
  const raw = rawValue as Uint8Array;
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS;
  let cursor = 0;
  let recordCount = 0;
  while (cursor < rawLength) {
    const firstEnd = Uint8Array.prototype.indexOf.call(raw, 0, cursor);
    const recordKind = raw[cursor];
    if (
      firstEnd <= cursor ||
      raw[cursor + 1] !== 0x20 ||
      (recordKind !== 0x31 &&
        recordKind !== 0x32 &&
        recordKind !== 0x3f &&
        recordKind !== 0x75)
    )
      throw new TypeError(code);
    let recordEnd = firstEnd + 1;
    if (recordKind === 0x32) {
      const secondEnd = Uint8Array.prototype.indexOf.call(raw, 0, recordEnd);
      if (secondEnd <= recordEnd) throw new TypeError(code);
      recordEnd = secondEnd + 1;
    }
    if (recordEnd - cursor > limits.maximumDirtyTreeRawRecordBytes)
      throw new TypeError(code);
    recordCount += 1;
    if (recordCount > limits.maximumDirtyTreeRecordCount)
      throw new TypeError(code);
    cursor = recordEnd;
  }
  return recordCount;
};

const parsePorcelainV2ZRecords = (raw: Buffer): readonly Buffer[] => {
  const records: Buffer[] = [];
  let cursor = 0;
  while (cursor < raw.length) {
    const end = raw.indexOf(0, cursor);
    if (end < 0) throw new TypeError("v2_preexecution_dirty_tree_raw_invalid");
    const first = raw.subarray(cursor, end + 1);
    const text = first.subarray(0, -1).toString("utf8");
    if (!Buffer.from(text, "utf8").equals(first.subarray(0, -1)))
      throw new TypeError("v2_preexecution_dirty_tree_raw_invalid");
    if (text.startsWith("2 ")) {
      const secondEnd = raw.indexOf(0, end + 1);
      if (secondEnd < 0)
        throw new TypeError("v2_preexecution_dirty_tree_raw_invalid");
      const record = raw.subarray(cursor, secondEnd + 1);
      const originalPath = raw.subarray(end + 1, secondEnd).toString("utf8");
      if (
        !Buffer.from(originalPath, "utf8").equals(
          raw.subarray(end + 1, secondEnd),
        ) ||
        !strictPath(originalPath)
      )
        throw new TypeError("v2_preexecution_dirty_tree_raw_invalid");
      records.push(record);
      cursor = secondEnd + 1;
    } else {
      records.push(first);
      cursor = end + 1;
    }
  }
  return records;
};

const porcelainRecordMatchesPathAndIndex = (
  bytes: Buffer,
  relativePath: string,
  indexStage0ObjectId: string | null,
): boolean => {
  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes) || !text.endsWith("\0"))
    return false;
  const fields = text.slice(0, -1).split("\0");
  const head = fields[0] ?? "";
  if (head.startsWith("? "))
    return (
      fields.length === 1 &&
      head.slice(2) === relativePath &&
      indexStage0ObjectId === null
    );
  if (head.startsWith("1 ")) {
    const tokens = head.split(" ");
    return (
      fields.length === 1 &&
      tokens.length === 9 &&
      tokens[8] === relativePath &&
      GIT_OBJECT.test(tokens[7] ?? "") &&
      tokens[7] === indexStage0ObjectId
    );
  }
  if (head.startsWith("2 ")) {
    const tokens = head.split(" ");
    return (
      fields.length === 2 &&
      tokens.length === 10 &&
      tokens[9] === relativePath &&
      strictPath(fields[1]) &&
      GIT_OBJECT.test(tokens[7] ?? "") &&
      tokens[7] === indexStage0ObjectId
    );
  }
  if (head.startsWith("u ")) {
    const tokens = head.split(" ");
    return (
      fields.length === 1 &&
      tokens.length === 11 &&
      tokens[10] === relativePath &&
      indexStage0ObjectId === null
    );
  }
  return false;
};

const statValid = (stat: unknown): stat is Nhm2SphericalV2LinuxFileStatV1 => {
  if (
    stat == null ||
    typeof stat !== "object" ||
    Array.isArray(stat) ||
    isProxy(stat)
  )
    return false;
  const value = stat as Record<string, unknown>;
  return (
    [Object.prototype, null].includes(Object.getPrototypeOf(value)) &&
    exactEnumerableDataKeys(value, EXACT_STAT_KEYS) &&
    value.fileType === "regular" &&
    [
      "ownerUid",
      "ownerGid",
      "device",
      "inode",
      "changeTimeNanoseconds",
      "modifyTimeNanoseconds",
    ].every((key) => u64DecimalValid(value[key])) &&
    value.linkCount === "1" &&
    ["0400", "0500"].includes(String(value.modeOctal)) &&
    Number.isSafeInteger(value.sizeBytes) &&
    Number(value.sizeBytes) >= 0 &&
    nonzeroSha(value.sha256)
  );
};

const runIdentityValid = (
  value: unknown,
): value is Nhm2SphericalV2RunIdentityV1 =>
  value != null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !isProxy(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value)) &&
  exactEnumerableDataKeys(value, [
    "ownerGid",
    "ownerUid",
    "supplementaryGids",
  ]) &&
  typeof (value as Nhm2SphericalV2RunIdentityV1).ownerUid === "string" &&
  u64DecimalValid((value as Nhm2SphericalV2RunIdentityV1).ownerUid) &&
  (value as Nhm2SphericalV2RunIdentityV1).ownerUid !== "0" &&
  typeof (value as Nhm2SphericalV2RunIdentityV1).ownerGid === "string" &&
  u64DecimalValid((value as Nhm2SphericalV2RunIdentityV1).ownerGid) &&
  (value as Nhm2SphericalV2RunIdentityV1).ownerGid !== "0" &&
  Array.isArray((value as Nhm2SphericalV2RunIdentityV1).supplementaryGids) &&
  !isProxy((value as Nhm2SphericalV2RunIdentityV1).supplementaryGids) &&
  Object.getPrototypeOf(
    (value as Nhm2SphericalV2RunIdentityV1).supplementaryGids,
  ) === Array.prototype &&
  (value as Nhm2SphericalV2RunIdentityV1).supplementaryGids.length === 0;

export const computeNhm2SphericalBosonStarV2CommandArgvSha256 = (
  argv: readonly string[],
): string => {
  const safe = snapshot(argv);
  if (!safe.ok || !Array.isArray(safe.value))
    throw new TypeError("v2_preexecution_argv_surface_invalid");
  const safeArgv = safe.value as readonly string[];
  if (safeArgv.length < 1 || safeArgv.length > 256)
    throw new TypeError("v2_preexecution_argv_invalid");
  const hash = createHash("sha256")
    .update(NHM2_SPHERICAL_BOSON_STAR_V2_COMMAND_ARGV_SHA256_DOMAIN, "utf8")
    .update(u64le(safeArgv.length));
  for (const arg of safeArgv) {
    if (
      typeof arg !== "string" ||
      arg.includes("\0") ||
      /[\ud800-\udfff]/u.test(arg) ||
      arg.normalize("NFC") !== arg
    )
      throw new TypeError("v2_preexecution_argv_invalid");
    const bytes = Buffer.from(arg, "utf8");
    if (bytes.length > 65536)
      throw new TypeError("v2_preexecution_argv_invalid");
    hash.update(u64le(bytes.length)).update(bytes);
  }
  return hash.digest("hex");
};

const staticEntryValid = (entry: Nhm2SphericalV2StaticInputEntryV1): boolean =>
  entry != null &&
  typeof entry === "object" &&
  !Array.isArray(entry) &&
  !isProxy(entry) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(entry)) &&
  exactEnumerableDataKeys(entry, [
    "mediaType",
    "relativePath",
    "semanticKind",
    "semanticRole",
    "sha256",
    "sizeBytes",
    "stat",
  ]) &&
  strictPath(entry.relativePath) &&
  Object.hasOwn(STATIC_ROLE_KIND, entry.semanticRole) &&
  Object.hasOwn(MEDIA_TYPE_BY_KIND, entry.semanticKind) &&
  entry.semanticKind === STATIC_ROLE_KIND[entry.semanticRole] &&
  entry.mediaType === MEDIA_TYPE_BY_KIND[entry.semanticKind] &&
  Number.isSafeInteger(entry.sizeBytes) &&
  entry.sizeBytes >= 0 &&
  nonzeroSha(entry.sha256) &&
  statValid(entry.stat) &&
  entry.stat.sizeBytes === entry.sizeBytes &&
  entry.stat.sha256 === entry.sha256 &&
  entry.stat.modeOctal ===
    (entry.semanticKind === "executable" ||
    entry.semanticKind === "elf_interpreter"
      ? "0500"
      : "0400");

const staticSemanticRoleClosureValid = (
  inventory: readonly Nhm2SphericalV2StaticInputEntryV1[],
): boolean => {
  const counts = new Map<Nhm2SphericalV2StaticInputRoleV1, number>();
  for (const entry of inventory)
    counts.set(entry.semanticRole, (counts.get(entry.semanticRole) ?? 0) + 1);
  return NHM2_SPHERICAL_BOSON_STAR_V2_REQUIRED_STATIC_INPUT_ROLES.every(
    (role) => {
      const count = counts.get(role) ?? 0;
      return REPEATABLE_STATIC_INPUT_ROLES.has(role) ? count >= 1 : count === 1;
    },
  );
};

const lengthDelimitedCanonicalAggregate = (
  domain: string,
  entries: readonly unknown[],
): string => {
  const hash = createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(entries.length));
  for (const entry of entries) {
    const bytes = Buffer.from(
      nhm2SphericalBosonStarV2PreexecutionCanonicalJson(entry),
      "utf8",
    );
    hash.update(u64le(bytes.length)).update(bytes);
  }
  return hash.digest("hex");
};

export const computeNhm2SphericalBosonStarV2StaticInputAggregateSha256 = (
  entries: readonly Nhm2SphericalV2StaticInputEntryV1[],
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): string => {
  const safeEntries = snapshot(entries);
  const safeIdentity = snapshot(runIdentity);
  if (
    !safeEntries.ok ||
    !Array.isArray(safeEntries.value) ||
    !safeIdentity.ok ||
    safeIdentity.value == null ||
    typeof safeIdentity.value !== "object" ||
    Array.isArray(safeIdentity.value)
  )
    throw new TypeError("v2_preexecution_static_inventory_surface_invalid");
  const inventory =
    safeEntries.value as readonly Nhm2SphericalV2StaticInputEntryV1[];
  const identity = safeIdentity.value as Nhm2SphericalV2RunIdentityV1;
  if (
    inventory.length < 1 ||
    inventory.length > 16384 ||
    !runIdentityValid(identity) ||
    !inventory.every(staticEntryValid) ||
    !staticSemanticRoleClosureValid(inventory) ||
    inventory.some(
      (entry, index) =>
        entry.stat.ownerUid !== identity.ownerUid ||
        entry.stat.ownerGid !== identity.ownerGid,
    ) ||
    !sortedUniquePaths(inventory.map((entry) => entry.relativePath))
  )
    throw new TypeError("v2_preexecution_static_inventory_invalid");
  return lengthDelimitedCanonicalAggregate(
    NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN,
    inventory,
  );
};

export const computeNhm2SphericalBosonStarV2FreshnessInventorySha256 = (
  observations: readonly Nhm2SphericalV2FreshnessObservationV1[],
  expectedStaticInputs: readonly Nhm2SphericalV2StaticInputEntryV1[],
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): string => {
  const safeObservations = snapshot(observations);
  const safeStaticInputs = snapshot(expectedStaticInputs);
  const safeIdentity = snapshot(runIdentity);
  if (
    !safeObservations.ok ||
    !Array.isArray(safeObservations.value) ||
    !safeStaticInputs.ok ||
    !Array.isArray(safeStaticInputs.value) ||
    !safeIdentity.ok ||
    safeIdentity.value == null ||
    typeof safeIdentity.value !== "object" ||
    Array.isArray(safeIdentity.value)
  )
    throw new TypeError("v2_preexecution_freshness_inventory_surface_invalid");
  const inventory =
    safeObservations.value as readonly Nhm2SphericalV2FreshnessObservationV1[];
  const staticInputs =
    safeStaticInputs.value as readonly Nhm2SphericalV2StaticInputEntryV1[];
  const identity = safeIdentity.value as Nhm2SphericalV2RunIdentityV1;
  if (
    inventory.length < 1 ||
    inventory.length > 16384 ||
    !staticInputs.every(staticEntryValid) ||
    !staticSemanticRoleClosureValid(staticInputs) ||
    !sortedUniquePaths(staticInputs.map((entry) => entry.relativePath)) ||
    !runIdentityValid(identity) ||
    inventory.length !== staticInputs.length ||
    inventory.some(
      (entry, index) =>
        entry.relativePath !== staticInputs[index]?.relativePath,
    ) ||
    !sortedUniquePaths(inventory.map((entry) => entry.relativePath)) ||
    inventory.some(
      (entry, index) =>
        entry == null ||
        typeof entry !== "object" ||
        Array.isArray(entry) ||
        isProxy(entry) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(entry)) ||
        !exactKeys(entry as unknown as Record<string, unknown>, [
          "postread",
          "preopen",
          "relativePath",
          "stable",
        ]) ||
        !strictPath(entry.relativePath) ||
        entry.stable !== true ||
        !statValid(entry.preopen) ||
        !statValid(entry.postread) ||
        entry.preopen.ownerUid !== identity.ownerUid ||
        entry.preopen.ownerGid !== identity.ownerGid ||
        !sameCanonical(entry.preopen, entry.postread) ||
        !sameCanonical(entry.preopen, staticInputs[index]?.stat),
    )
  )
    throw new TypeError("v2_preexecution_freshness_inventory_invalid");
  return lengthDelimitedCanonicalAggregate(
    NHM2_SPHERICAL_BOSON_STAR_V2_FRESHNESS_INVENTORY_SHA256_DOMAIN,
    inventory,
  );
};

export const computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256 = (
  commit40: string,
  rawEvidence: Nhm2SphericalV2DirtyTreeRawEvidenceV1,
  entries: readonly Nhm2SphericalV2DirtyTreeEntryV1[],
  expectedStaticInputs: readonly Nhm2SphericalV2StaticInputByteEvidenceV1[],
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): string => {
  if (
    rawEvidence == null ||
    typeof rawEvidence !== "object" ||
    Array.isArray(rawEvidence) ||
    isProxy(rawEvidence) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(rawEvidence)) ||
    !exactEnumerableDataKeys(rawEvidence, [
      "rawPorcelainV2ZBytes",
      "scopedPathspecs",
    ]) ||
    !densePlainArray(rawEvidence.scopedPathspecs, 1, 4096)
  )
    throw new TypeError("v2_preexecution_dirty_tree_raw_evidence_invalid");
  const rawPorcelainLength = byteViewLength(
    rawEvidence.rawPorcelainV2ZBytes,
    "v2_preexecution_dirty_tree_raw_evidence_invalid",
  );
  const rawRecordCount = inspectPorcelainV2ZRecordPopulation(
    rawEvidence.rawPorcelainV2ZBytes,
    "v2_preexecution_dirty_tree_record_population_invalid",
  );
  if (
    !densePlainArray(
      entries,
      0,
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumDirtyTreeRecordCount,
    ) ||
    !densePlainArray(expectedStaticInputs, 1, 16384) ||
    !runIdentityValid(runIdentity)
  )
    throw new TypeError("v2_preexecution_dirty_tree_surface_invalid");
  if (rawRecordCount !== entries.length)
    throw new TypeError("v2_preexecution_dirty_tree_record_population_invalid");
  if (
    rawEvidence.scopedPathspecs.some((path) => !strictPath(path)) ||
    !/^[a-f0-9]{40}$/.test(commit40) ||
    /^0{40}$/.test(commit40)
  )
    throw new TypeError("v2_preexecution_dirty_tree_raw_evidence_invalid");
  const inventory = entries;
  let aggregateRawBytes = rawPorcelainLength;
  let aggregatePreflightEvidenceBytes = rawPorcelainLength;
  for (const [index, entry] of inventory.entries()) {
    if (
      entry == null ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      isProxy(entry) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(entry)) ||
      !exactEnumerableDataKeys(entry, [
        "gitPorcelainV2RecordHex",
        "indexStage0ObjectId",
        "relativePath",
        "worktreeRawBytes",
        "worktreeSha256",
        "worktreeSizeBytes",
        "worktreeStat",
      ]) ||
      !strictPath(entry.relativePath)
    )
      throw new TypeError(`v2_preexecution_dirty_tree_entry_invalid:${index}`);
    if (!dirtyTreeRecordHexShapeValid(entry.gitPorcelainV2RecordHex))
      throw new TypeError(
        `v2_preexecution_dirty_tree_record_hex_invalid:${index}`,
      );
    aggregatePreflightEvidenceBytes += entry.gitPorcelainV2RecordHex.length;
    if (
      !Number.isSafeInteger(aggregatePreflightEvidenceBytes) ||
      aggregatePreflightEvidenceBytes >
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregatePreflightEvidenceBytes
    )
      throw new TypeError(
        "v2_preexecution_dirty_tree_aggregate_preflight_evidence_bytes_exceeded",
      );
    const worktreeLength = byteViewLength(
      entry.worktreeRawBytes,
      `v2_preexecution_dirty_tree_entry_bytes_invalid:${index}`,
    );
    aggregateRawBytes += worktreeLength;
    aggregatePreflightEvidenceBytes += worktreeLength;
    if (
      !Number.isSafeInteger(aggregateRawBytes) ||
      aggregateRawBytes >
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregateRawBytes
    )
      throw new TypeError(
        "v2_preexecution_dirty_tree_aggregate_bytes_exceeded",
      );
    if (
      !Number.isSafeInteger(aggregatePreflightEvidenceBytes) ||
      aggregatePreflightEvidenceBytes >
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregatePreflightEvidenceBytes
    )
      throw new TypeError(
        "v2_preexecution_dirty_tree_aggregate_preflight_evidence_bytes_exceeded",
      );
  }
  for (const [index, entry] of inventory.entries())
    if (!dirtyTreeRecordHexCharactersValid(entry.gitPorcelainV2RecordHex))
      throw new TypeError(
        `v2_preexecution_dirty_tree_record_hex_invalid:${index}`,
      );
  if (
    !sortedUniquePaths(rawEvidence.scopedPathspecs) ||
    !sortedUniquePaths(inventory.map((entry) => entry.relativePath))
  )
    throw new TypeError("v2_preexecution_dirty_tree_invalid");
  const staticByPath = new Map<
    string,
    Readonly<{
      entry: Nhm2SphericalV2StaticInputEntryV1;
      rawValue: Uint8Array;
    }>
  >();
  for (const [index, item] of expectedStaticInputs.entries()) {
    if (
      item == null ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      isProxy(item) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(item)) ||
      !exactEnumerableDataKeys(item, ["entry", "rawBytes"])
    )
      throw new TypeError(
        `v2_preexecution_dirty_tree_static_evidence_invalid:${index}`,
      );
    const safeEntry = snapshot(item.entry);
    if (!safeEntry.ok || safeEntry.value == null)
      throw new TypeError(
        `v2_preexecution_dirty_tree_static_evidence_invalid:${index}`,
      );
    const entry = safeEntry.value as Nhm2SphericalV2StaticInputEntryV1;
    const length = byteViewLength(
      item.rawBytes,
      `v2_preexecution_dirty_tree_static_evidence_invalid:${index}`,
    );
    aggregateRawBytes += length;
    aggregatePreflightEvidenceBytes += length;
    if (
      !Number.isSafeInteger(aggregateRawBytes) ||
      aggregateRawBytes >
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregateRawBytes ||
      !Number.isSafeInteger(aggregatePreflightEvidenceBytes) ||
      aggregatePreflightEvidenceBytes >
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregatePreflightEvidenceBytes ||
      !staticEntryValid(entry) ||
      entry.stat.ownerUid !== runIdentity.ownerUid ||
      entry.stat.ownerGid !== runIdentity.ownerGid ||
      entry.sizeBytes !== length ||
      staticByPath.has(entry.relativePath)
    )
      throw new TypeError(
        `v2_preexecution_dirty_tree_static_evidence_invalid:${index}`,
      );
    staticByPath.set(entry.relativePath, { entry, rawValue: item.rawBytes });
  }
  const rawPorcelain = ownedBytes(
    rawEvidence.rawPorcelainV2ZBytes,
    "v2_preexecution_dirty_tree_raw_evidence_invalid",
  );
  const rawRecords = parsePorcelainV2ZRecords(rawPorcelain);
  for (const [path, item] of staticByPath) {
    const raw = ownedBytes(
      item.rawValue,
      `v2_preexecution_dirty_tree_static_bytes_invalid:${path}`,
    );
    if (
      item.entry.sha256 !== createHash("sha256").update(raw).digest("hex") ||
      item.entry.stat.sha256 !== item.entry.sha256 ||
      item.entry.stat.sizeBytes !== raw.length
    )
      throw new TypeError(
        `v2_preexecution_dirty_tree_static_binding_mismatch:${path}`,
      );
  }
  if (inventory.length !== rawRecords.length)
    throw new TypeError("v2_preexecution_dirty_tree_record_population_invalid");
  const hash = createHash("sha256")
    .update(NHM2_SPHERICAL_BOSON_STAR_V2_DIRTY_TREE_SHA256_DOMAIN, "utf8")
    .update(commit40, "ascii")
    .update(u64le(rawEvidence.scopedPathspecs.length));
  for (const scope of rawEvidence.scopedPathspecs) {
    const scopeBytes = Buffer.from(scope, "utf8");
    hash.update(u64le(scopeBytes.length)).update(scopeBytes);
  }
  hash
    .update(u64le(rawPorcelain.length))
    .update(rawPorcelain)
    .update(u64le(inventory.length));
  for (const [index, entry] of inventory.entries()) {
    const recordBytes = Buffer.from(entry.gitPorcelainV2RecordHex, "hex");
    const worktreeBytes = ownedBytes(
      entry.worktreeRawBytes,
      `v2_preexecution_dirty_tree_entry_bytes_invalid:${index}`,
    );
    const matchingStatic = staticByPath.get(entry.relativePath);
    if (
      (entry.indexStage0ObjectId !== null &&
        (!GIT_OBJECT.test(entry.indexStage0ObjectId) ||
          /^0+$/.test(entry.indexStage0ObjectId))) ||
      !Number.isSafeInteger(entry.worktreeSizeBytes) ||
      entry.worktreeSizeBytes < 0 ||
      !nonzeroSha(entry.worktreeSha256) ||
      !statValid(entry.worktreeStat) ||
      entry.worktreeStat.ownerUid !== runIdentity.ownerUid ||
      entry.worktreeStat.ownerGid !== runIdentity.ownerGid ||
      entry.worktreeSizeBytes !== worktreeBytes.length ||
      entry.worktreeSha256 !==
        createHash("sha256").update(worktreeBytes).digest("hex") ||
      entry.worktreeStat.sizeBytes !== worktreeBytes.length ||
      entry.worktreeStat.sha256 !== entry.worktreeSha256 ||
      !porcelainRecordMatchesPathAndIndex(
        recordBytes,
        entry.relativePath,
        entry.indexStage0ObjectId,
      ) ||
      !recordBytes.equals(rawRecords[index]!) ||
      (matchingStatic != null &&
        (!worktreeBytes.equals(Buffer.from(matchingStatic.rawValue)) ||
          !sameCanonical(entry.worktreeStat, matchingStatic.entry.stat)))
    )
      throw new TypeError("v2_preexecution_dirty_tree_entry_invalid");
    const pathBytes = Buffer.from(entry.relativePath, "utf8");
    const indexBytes = Buffer.from(entry.indexStage0ObjectId ?? "", "ascii");
    hash
      .update(u64le(pathBytes.length))
      .update(pathBytes)
      .update(u64le(indexBytes.length))
      .update(indexBytes)
      .update(u64le(entry.worktreeSizeBytes))
      .update(Buffer.from(entry.worktreeSha256, "hex"));
    const statBytes = Buffer.from(
      nhm2SphericalBosonStarV2PreexecutionCanonicalJson(entry.worktreeStat),
      "utf8",
    );
    hash.update(u64le(statBytes.length)).update(statBytes);
  }
  return hash.digest("hex");
};

const rawBindingValid = (value: Nhm2SphericalV2RawBindingV1): boolean =>
  value != null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !isProxy(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value)) &&
  exactEnumerableDataKeys(value, [
    "mediaType",
    "path",
    "sha256",
    "sizeBytes",
  ]) &&
  (strictPath(value.path) || strictAbsolutePath(value.path)) &&
  ["application/json", "application/octet-stream", "text/plain"].includes(
    value.mediaType,
  ) &&
  Number.isSafeInteger(value.sizeBytes) &&
  value.sizeBytes > 0 &&
  nonzeroSha(value.sha256);

const runtimeNameValid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[\x21-\x7e]+$/.test(value) &&
  value.normalize("NFC") === value &&
  Buffer.byteLength(value, "ascii") <= 4096;

const runtimeNameListValid = (value: unknown): value is readonly string[] =>
  Array.isArray(value) &&
  Object.getPrototypeOf(value) === Array.prototype &&
  value.length <= 4096 &&
  value.every(runtimeNameValid) &&
  new Set(value).size === value.length;

const hashNhm2SphericalBosonStarV2RuntimeClosureManifest = (
  closure: Nhm2SphericalV2RuntimeClosureV1,
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): string => {
  const safe = snapshot(closure);
  const safeIdentity = snapshot(runIdentity);
  if (
    !safe.ok ||
    safe.value == null ||
    typeof safe.value !== "object" ||
    Array.isArray(safe.value) ||
    !safeIdentity.ok ||
    safeIdentity.value == null ||
    typeof safeIdentity.value !== "object" ||
    Array.isArray(safeIdentity.value)
  )
    throw new TypeError("v2_preexecution_runtime_closure_surface_invalid");
  const manifest = safe.value as Nhm2SphericalV2RuntimeClosureV1;
  const identity = safeIdentity.value as Nhm2SphericalV2RunIdentityV1;
  if (
    !exactKeys(manifest as unknown as Record<string, unknown>, [
      "actualLoaderResolutionObserved",
      "ambientLdLibraryPath",
      "authorityFalse",
      "byteDerivedExpectedClosureComplete",
      "closureComplete",
      "executableBinding",
      "executableElfInterpreter",
      "executableNeededInOrder",
      "executableStat",
      "loaderCacheUsed",
      "objectsInLoadOrder",
      "schemaVersion",
    ]) ||
    manifest.schemaVersion !==
      "nhm2_spherical_boson_star_v2_runtime_closure/v1" ||
    manifest.authorityFalse !== true ||
    manifest.ambientLdLibraryPath !== "empty" ||
    manifest.loaderCacheUsed !== false ||
    manifest.byteDerivedExpectedClosureComplete !== true ||
    manifest.actualLoaderResolutionObserved !== false ||
    manifest.closureComplete !== false ||
    !runIdentityValid(identity) ||
    !rawBindingValid(manifest.executableBinding) ||
    manifest.executableBinding.mediaType !== "application/octet-stream" ||
    !statValid(manifest.executableStat) ||
    manifest.executableBinding.sha256 !== manifest.executableStat.sha256 ||
    manifest.executableBinding.sizeBytes !==
      manifest.executableStat.sizeBytes ||
    manifest.executableStat.ownerUid !== identity.ownerUid ||
    manifest.executableStat.ownerGid !== identity.ownerGid ||
    manifest.executableStat.modeOctal !== "0500" ||
    !strictAbsolutePath(manifest.executableElfInterpreter) ||
    !runtimeNameListValid(manifest.executableNeededInOrder) ||
    !Array.isArray(manifest.objectsInLoadOrder) ||
    manifest.objectsInLoadOrder.length < 1 ||
    manifest.objectsInLoadOrder[0]?.kind !== "elf_interpreter" ||
    manifest.objectsInLoadOrder[0]?.requestedName !==
      manifest.executableElfInterpreter ||
    manifest.objectsInLoadOrder[0]?.resolvedAbsolutePath !==
      manifest.executableElfInterpreter
  )
    throw new TypeError("v2_preexecution_runtime_closure_invalid");
  const sonames = new Set<string>();
  const paths = new Set<string>();
  manifest.objectsInLoadOrder.forEach((entry, index) => {
    if (
      entry == null ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      isProxy(entry) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(entry)) ||
      !exactKeys(entry as unknown as Record<string, unknown>, [
        "binding",
        "buildIdLowercaseHex",
        "elfClass",
        "endianness",
        "kind",
        "machine",
        "neededInOrder",
        "ordinal",
        "requestedName",
        "resolvedAbsolutePath",
        "soname",
        "stat",
      ]) ||
      entry.ordinal !== index ||
      !runtimeNameValid(entry.requestedName) ||
      (entry.kind !== "elf_interpreter" && entry.kind !== "shared_object") ||
      (index === 0
        ? entry.kind !== "elf_interpreter"
        : entry.kind !== "shared_object") ||
      !strictAbsolutePath(entry.resolvedAbsolutePath) ||
      !rawBindingValid(entry.binding) ||
      entry.binding.mediaType !== "application/octet-stream" ||
      entry.binding.path !== entry.resolvedAbsolutePath ||
      !statValid(entry.stat) ||
      entry.binding.sha256 !== entry.stat.sha256 ||
      entry.binding.sizeBytes !== entry.stat.sizeBytes ||
      entry.stat.ownerUid !== identity.ownerUid ||
      entry.stat.ownerGid !== identity.ownerGid ||
      entry.stat.modeOctal !==
        (entry.kind === "elf_interpreter" ? "0500" : "0400") ||
      entry.elfClass !== "ELF64" ||
      entry.endianness !== "little" ||
      entry.machine !== "x86_64" ||
      typeof entry.buildIdLowercaseHex !== "string" ||
      !/^[a-f0-9]{2,128}$/.test(entry.buildIdLowercaseHex) ||
      !runtimeNameValid(entry.soname) ||
      (index > 0 && entry.soname !== entry.requestedName) ||
      !runtimeNameListValid(entry.neededInOrder) ||
      sonames.has(entry.soname) ||
      paths.has(entry.resolvedAbsolutePath.toLowerCase())
    )
      throw new TypeError(`v2_preexecution_runtime_object_invalid:${index}`);
    sonames.add(entry.soname);
    paths.add(entry.resolvedAbsolutePath.toLowerCase());
  });
  const expectedRequests: string[] = [];
  const discovered = new Set<string>();
  const enqueue = (name: string) => {
    if (!discovered.has(name)) {
      discovered.add(name);
      expectedRequests.push(name);
    }
  };
  manifest.executableNeededInOrder.forEach(enqueue);
  manifest.objectsInLoadOrder[0].neededInOrder.forEach(enqueue);
  let cursor = 0;
  while (cursor < expectedRequests.length) {
    const requested = expectedRequests[cursor];
    const object = manifest.objectsInLoadOrder[cursor + 1];
    if (object == null || object.requestedName !== requested)
      throw new TypeError(
        "v2_preexecution_runtime_breadth_first_order_invalid",
      );
    object.neededInOrder.forEach(enqueue);
    cursor += 1;
  }
  if (manifest.objectsInLoadOrder.length !== expectedRequests.length + 1)
    throw new TypeError("v2_preexecution_runtime_extraneous_object");
  const bytes = Buffer.from(
    nhm2SphericalBosonStarV2PreexecutionCanonicalJson(manifest),
    "utf8",
  );
  return createHash("sha256")
    .update(NHM2_SPHERICAL_BOSON_STAR_V2_RUNTIME_CLOSURE_SHA256_DOMAIN, "utf8")
    .update(u64le(bytes.length))
    .update(bytes)
    .digest("hex");
};

type ParsedElf64 = Readonly<{
  interpreter: string | null;
  neededInOrder: readonly string[];
  soname: string | null;
  buildIdLowercaseHex: string;
}>;

type ElfProgramHeader = Readonly<{
  type: number;
  offset: number;
  virtualAddress: number;
  fileSize: number;
}>;

const safeElfU64 = (bytes: Buffer, offset: number): number => {
  const value = bytes.readBigUInt64LE(offset);
  if (value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new TypeError("v2_preexecution_elf_integer_out_of_range");
  return Number(value);
};

const elfRegion = (
  bytes: Buffer,
  offset: number,
  length: number,
  code = "v2_preexecution_elf_region_invalid",
): Buffer => {
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset > bytes.length ||
    length > bytes.length - offset
  )
    throw new TypeError(code);
  return bytes.subarray(offset, offset + length);
};

const align4 = (value: number): number => {
  const aligned = (value + 3) & ~3;
  if (!Number.isSafeInteger(aligned) || aligned < value)
    throw new TypeError("v2_preexecution_elf_note_invalid");
  return aligned;
};

const decodeElfString = (
  table: Buffer,
  offset: number,
  code: string,
): string => {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= table.length)
    throw new TypeError(code);
  const end = table.indexOf(0, offset);
  if (end < 0) throw new TypeError(code);
  const raw = table.subarray(offset, end);
  const value = raw.toString("utf8");
  if (!Buffer.from(value, "utf8").equals(raw) || !runtimeNameValid(value))
    throw new TypeError(code);
  return value;
};

const parseBoundElf64 = (bytes: Buffer, executable: boolean): ParsedElf64 => {
  if (
    bytes.length < 64 ||
    !bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46])) ||
    bytes[4] !== 2 ||
    bytes[5] !== 1 ||
    bytes[6] !== 1 ||
    bytes.readUInt16LE(18) !== 62 ||
    bytes.readUInt32LE(20) !== 1 ||
    bytes.readUInt16LE(52) !== 64 ||
    bytes.readUInt16LE(54) !== 56
  )
    throw new TypeError("v2_preexecution_elf_header_invalid");
  const programHeaderOffset = safeElfU64(bytes, 32);
  const programHeaderCount = bytes.readUInt16LE(56);
  if (programHeaderCount < 1 || programHeaderCount > 4096)
    throw new TypeError("v2_preexecution_elf_program_headers_invalid");
  elfRegion(
    bytes,
    programHeaderOffset,
    programHeaderCount * 56,
    "v2_preexecution_elf_program_headers_invalid",
  );
  const headers: ElfProgramHeader[] = [];
  for (let index = 0; index < programHeaderCount; index += 1) {
    const cursor = programHeaderOffset + index * 56;
    const header = {
      type: bytes.readUInt32LE(cursor),
      offset: safeElfU64(bytes, cursor + 8),
      virtualAddress: safeElfU64(bytes, cursor + 16),
      fileSize: safeElfU64(bytes, cursor + 32),
    };
    elfRegion(bytes, header.offset, header.fileSize);
    headers.push(header);
  }

  const interpreterHeaders = headers.filter((header) => header.type === 3);
  if (
    (executable && interpreterHeaders.length !== 1) ||
    (!executable && interpreterHeaders.length !== 0)
  )
    throw new TypeError("v2_preexecution_elf_pt_interp_invalid");
  let interpreter: string | null = null;
  if (interpreterHeaders.length === 1) {
    const header = interpreterHeaders[0]!;
    const raw = elfRegion(bytes, header.offset, header.fileSize);
    if (
      raw.length < 2 ||
      raw[raw.length - 1] !== 0 ||
      raw.subarray(0, -1).includes(0)
    )
      throw new TypeError("v2_preexecution_elf_pt_interp_invalid");
    const decoded = raw.subarray(0, -1).toString("utf8");
    if (
      !Buffer.from(decoded, "utf8").equals(raw.subarray(0, -1)) ||
      !strictAbsolutePath(decoded)
    )
      throw new TypeError("v2_preexecution_elf_pt_interp_invalid");
    interpreter = decoded;
  }

  const dynamicHeaders = headers.filter((header) => header.type === 2);
  if (dynamicHeaders.length !== 1 || dynamicHeaders[0]!.fileSize % 16 !== 0)
    throw new TypeError("v2_preexecution_elf_dynamic_invalid");
  const dynamic = dynamicHeaders[0]!;
  const neededOffsets: number[] = [];
  let stringTableAddress: number | null = null;
  let stringTableSize: number | null = null;
  let sonameOffset: number | null = null;
  let terminated = false;
  for (let cursor = 0; cursor < dynamic.fileSize; cursor += 16) {
    const offset = dynamic.offset + cursor;
    const tag = safeElfU64(bytes, offset);
    const value = safeElfU64(bytes, offset + 8);
    if (tag === 0) {
      terminated = true;
      break;
    }
    if (tag === 1) neededOffsets.push(value);
    else if (tag === 5) {
      if (stringTableAddress !== null)
        throw new TypeError("v2_preexecution_elf_dynamic_duplicate");
      stringTableAddress = value;
    } else if (tag === 10) {
      if (stringTableSize !== null)
        throw new TypeError("v2_preexecution_elf_dynamic_duplicate");
      stringTableSize = value;
    } else if (tag === 14) {
      if (sonameOffset !== null)
        throw new TypeError("v2_preexecution_elf_dynamic_duplicate");
      sonameOffset = value;
    }
  }
  if (
    !terminated ||
    stringTableAddress === null ||
    stringTableSize === null ||
    stringTableSize < 1
  )
    throw new TypeError("v2_preexecution_elf_dynamic_invalid");
  const load = headers.filter(
    (header) =>
      header.type === 1 &&
      stringTableAddress! >= header.virtualAddress &&
      stringTableAddress! - header.virtualAddress <= header.fileSize &&
      stringTableSize! <=
        header.fileSize - (stringTableAddress! - header.virtualAddress),
  );
  if (load.length !== 1)
    throw new TypeError("v2_preexecution_elf_string_table_mapping_invalid");
  const tableOffset =
    load[0]!.offset + (stringTableAddress - load[0]!.virtualAddress);
  const stringTable = elfRegion(bytes, tableOffset, stringTableSize);
  const neededInOrder = neededOffsets.map((offset) =>
    decodeElfString(stringTable, offset, "v2_preexecution_elf_needed_invalid"),
  );
  if (new Set(neededInOrder).size !== neededInOrder.length)
    throw new TypeError("v2_preexecution_elf_needed_duplicate");
  const soname =
    sonameOffset === null
      ? null
      : decodeElfString(
          stringTable,
          sonameOffset,
          "v2_preexecution_elf_soname_invalid",
        );
  if (!executable && soname === null)
    throw new TypeError("v2_preexecution_elf_soname_missing");

  const buildIds: string[] = [];
  for (const header of headers.filter((entry) => entry.type === 4)) {
    let cursor = header.offset;
    const limit = header.offset + header.fileSize;
    while (cursor < limit) {
      if (limit - cursor < 12)
        throw new TypeError("v2_preexecution_elf_note_invalid");
      const nameSize = bytes.readUInt32LE(cursor);
      const descriptionSize = bytes.readUInt32LE(cursor + 4);
      const type = bytes.readUInt32LE(cursor + 8);
      cursor += 12;
      const name = elfRegion(bytes, cursor, nameSize);
      cursor += align4(nameSize);
      const description = elfRegion(bytes, cursor, descriptionSize);
      cursor += align4(descriptionSize);
      if (cursor > limit)
        throw new TypeError("v2_preexecution_elf_note_invalid");
      if (type === 3 && name.equals(Buffer.from([0x47, 0x4e, 0x55, 0x00]))) {
        if (description.length < 1 || description.length > 64)
          throw new TypeError("v2_preexecution_elf_build_id_invalid");
        buildIds.push(description.toString("hex"));
      }
    }
  }
  if (buildIds.length !== 1)
    throw new TypeError("v2_preexecution_elf_build_id_invalid");
  return Object.freeze({
    interpreter,
    neededInOrder: Object.freeze(neededInOrder),
    soname,
    buildIdLowercaseHex: buildIds[0]!,
  });
};

const rawBindingMatchesBytes = (
  binding: Nhm2SphericalV2RawBindingV1,
  bytes: Buffer,
): boolean =>
  rawBindingValid(binding) &&
  binding.sizeBytes === bytes.length &&
  binding.sha256 === createHash("sha256").update(bytes).digest("hex");

export const buildNhm2SphericalBosonStarV2RuntimeClosureFromBytes = (
  evidence: Nhm2SphericalV2RuntimeClosureByteEvidenceV1,
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): Readonly<{
  closure: Nhm2SphericalV2RuntimeClosureV1;
  runtimeClosureSha256: string;
}> => {
  if (
    evidence == null ||
    typeof evidence !== "object" ||
    Array.isArray(evidence) ||
    isProxy(evidence) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(evidence)) ||
    !exactEnumerableDataKeys(evidence, [
      "ambientLdLibraryPath",
      "authorityFalse",
      "executableBinding",
      "executableRawBytes",
      "executableStat",
      "loaderCacheUsed",
      "objectsInLoadOrder",
      "schemaVersion",
    ]) ||
    evidence.schemaVersion !==
      "nhm2_spherical_boson_star_v2_runtime_byte_evidence/v1" ||
    evidence.authorityFalse !== true ||
    evidence.ambientLdLibraryPath !== "empty" ||
    evidence.loaderCacheUsed !== false ||
    !runIdentityValid(runIdentity) ||
    !rawBindingValid(evidence.executableBinding) ||
    evidence.executableBinding.mediaType !== "application/octet-stream" ||
    !statValid(evidence.executableStat) ||
    evidence.executableStat.modeOctal !== "0500" ||
    evidence.executableStat.ownerUid !== runIdentity.ownerUid ||
    evidence.executableStat.ownerGid !== runIdentity.ownerGid ||
    evidence.executableStat.sha256 !== evidence.executableBinding.sha256 ||
    evidence.executableStat.sizeBytes !==
      evidence.executableBinding.sizeBytes ||
    !densePlainArray(evidence.objectsInLoadOrder, 1, 4096)
  )
    throw new TypeError("v2_preexecution_runtime_byte_evidence_invalid");
  let aggregateRuntimeBytes = byteViewLength(
    evidence.executableRawBytes,
    "v2_preexecution_runtime_executable_bytes_invalid",
  );
  for (const [index, source] of evidence.objectsInLoadOrder.entries()) {
    if (
      source == null ||
      typeof source !== "object" ||
      Array.isArray(source) ||
      isProxy(source) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(source)) ||
      !exactEnumerableDataKeys(source, [
        "binding",
        "kind",
        "rawBytes",
        "requestedName",
        "resolvedAbsolutePath",
        "stat",
      ])
    )
      throw new TypeError(
        `v2_preexecution_runtime_object_byte_evidence_invalid:${index}`,
      );
    aggregateRuntimeBytes += byteViewLength(
      source.rawBytes,
      `v2_preexecution_runtime_object_bytes_invalid:${index}`,
    );
    if (
      !Number.isSafeInteger(aggregateRuntimeBytes) ||
      aggregateRuntimeBytes >
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregateRawBytes
    )
      throw new TypeError("v2_preexecution_runtime_aggregate_bytes_exceeded");
  }
  const executableBytes = ownedBytes(
    evidence.executableRawBytes,
    "v2_preexecution_runtime_executable_bytes_invalid",
  );
  if (!rawBindingMatchesBytes(evidence.executableBinding, executableBytes))
    throw new TypeError("v2_preexecution_runtime_executable_binding_mismatch");
  const executableElf = parseBoundElf64(executableBytes, true);
  const objects: Nhm2SphericalV2RuntimeObjectV1[] = [];
  for (const [index, source] of evidence.objectsInLoadOrder.entries()) {
    if (
      source == null ||
      typeof source !== "object" ||
      Array.isArray(source) ||
      isProxy(source) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(source)) ||
      !exactEnumerableDataKeys(source, [
        "binding",
        "kind",
        "rawBytes",
        "requestedName",
        "resolvedAbsolutePath",
        "stat",
      ]) ||
      source.kind !== (index === 0 ? "elf_interpreter" : "shared_object") ||
      !runtimeNameValid(source.requestedName) ||
      !strictAbsolutePath(source.resolvedAbsolutePath) ||
      !rawBindingValid(source.binding) ||
      source.binding.mediaType !== "application/octet-stream" ||
      source.binding.path !== source.resolvedAbsolutePath ||
      !statValid(source.stat) ||
      source.stat.modeOctal !== (index === 0 ? "0500" : "0400") ||
      source.stat.ownerUid !== runIdentity.ownerUid ||
      source.stat.ownerGid !== runIdentity.ownerGid ||
      source.stat.sha256 !== source.binding.sha256 ||
      source.stat.sizeBytes !== source.binding.sizeBytes
    )
      throw new TypeError(
        `v2_preexecution_runtime_object_byte_evidence_invalid:${index}`,
      );
    const raw = ownedBytes(
      source.rawBytes,
      `v2_preexecution_runtime_object_bytes_invalid:${index}`,
    );
    if (!rawBindingMatchesBytes(source.binding, raw))
      throw new TypeError(
        `v2_preexecution_runtime_object_binding_mismatch:${index}`,
      );
    const parsed = parseBoundElf64(raw, false);
    objects.push(
      Object.freeze({
        ordinal: index,
        kind: source.kind,
        requestedName: source.requestedName,
        resolvedAbsolutePath: source.resolvedAbsolutePath,
        binding: Object.freeze({ ...source.binding }),
        stat: Object.freeze({ ...source.stat }),
        elfClass: "ELF64",
        endianness: "little",
        machine: "x86_64",
        buildIdLowercaseHex: parsed.buildIdLowercaseHex,
        soname: parsed.soname!,
        neededInOrder: parsed.neededInOrder,
      }),
    );
  }
  if (
    objects[0]?.requestedName !== executableElf.interpreter ||
    objects[0]?.resolvedAbsolutePath !== executableElf.interpreter
  )
    throw new TypeError("v2_preexecution_runtime_interpreter_mismatch");
  const closure = Object.freeze({
    schemaVersion: "nhm2_spherical_boson_star_v2_runtime_closure/v1" as const,
    authorityFalse: true as const,
    executableBinding: Object.freeze({ ...evidence.executableBinding }),
    executableStat: Object.freeze({ ...evidence.executableStat }),
    executableElfInterpreter: executableElf.interpreter!,
    executableNeededInOrder: executableElf.neededInOrder,
    objectsInLoadOrder: Object.freeze(objects) as unknown as readonly [
      Nhm2SphericalV2RuntimeObjectV1,
      ...Nhm2SphericalV2RuntimeObjectV1[],
    ],
    ambientLdLibraryPath: "empty" as const,
    loaderCacheUsed: false as const,
    byteDerivedExpectedClosureComplete: true as const,
    actualLoaderResolutionObserved: false as const,
    closureComplete: false as const,
  });
  return Object.freeze({
    closure,
    runtimeClosureSha256: hashNhm2SphericalBosonStarV2RuntimeClosureManifest(
      closure,
      runIdentity,
    ),
  });
};

export const computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256 = (
  observations: readonly [
    Nhm2SphericalV2OutputRootObservationV1,
    Nhm2SphericalV2OutputRootObservationV1,
  ],
): string => {
  const safe = snapshot(observations);
  if (!safe.ok || !Array.isArray(safe.value) || safe.value.length !== 2)
    throw new TypeError("v2_preexecution_output_root_invalid");
  const roots = safe.value as readonly Nhm2SphericalV2OutputRootObservationV1[];
  if (
    roots.some(
      (entry, index) =>
        entry == null ||
        typeof entry !== "object" ||
        Array.isArray(entry) ||
        !exactKeys(entry as unknown as Record<string, unknown>, [
          "absolutePath",
          "observedAbsent",
          "role",
        ]) ||
        entry.role !== (index === 0 ? "primary" : "independent") ||
        entry.observedAbsent !== true ||
        !strictAbsolutePath(entry.absolutePath) ||
        entry.absolutePath.endsWith("/"),
    )
  )
    throw new TypeError("v2_preexecution_output_root_invalid");
  const [primary, independent] = roots.map((entry) =>
    entry.absolutePath.toLowerCase(),
  );
  if (
    primary === independent ||
    primary!.startsWith(`${independent}/`) ||
    independent!.startsWith(`${primary}/`)
  )
    throw new TypeError("v2_preexecution_output_root_disjointness_invalid");
  return lengthDelimitedCanonicalAggregate(
    NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_SHA256_DOMAIN,
    roots,
  );
};

const unsignedSelfHash = (
  domain: string,
  field: string,
  value: Readonly<Record<string, unknown>>,
): string => {
  const safe = snapshot(value);
  if (
    !safe.ok ||
    safe.value == null ||
    typeof safe.value !== "object" ||
    Array.isArray(safe.value)
  )
    throw new TypeError("v2_preexecution_self_hash_surface_invalid");
  const record = safe.value as Record<string, unknown>;
  if (!Object.hasOwn(record, field))
    throw new TypeError("v2_preexecution_self_hash_field_missing");
  const { [field]: ignored, ...unsigned } = record;
  void ignored;
  const bytes = Buffer.from(
    nhm2SphericalBosonStarV2PreexecutionCanonicalJson(unsigned),
    "utf8",
  );
  return createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(bytes.length))
    .update(bytes)
    .digest("hex");
};

export const computeNhm2SphericalBosonStarV2PresealEnvelopeSha256 = (
  value: Readonly<Record<string, unknown>>,
): string =>
  unsignedSelfHash(
    NHM2_SPHERICAL_BOSON_STAR_V2_PRESEAL_ENVELOPE_SHA256_DOMAIN,
    "presealSha256",
    value,
  );

export const computeNhm2SphericalBosonStarV2PresealPublicationReceiptSha256 = (
  value: Readonly<Record<string, unknown>>,
): string =>
  unsignedSelfHash(
    NHM2_SPHERICAL_BOSON_STAR_V2_PRESEAL_PUBLICATION_RECEIPT_SHA256_DOMAIN,
    "publicationReceiptSha256",
    value,
  );

const authorityFalseLocksValid = (value: unknown): boolean =>
  value != null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  exactKeys(
    value as Record<string, unknown>,
    Object.keys(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_AUTHORITY_LOCKS),
  ) &&
  Object.values(value as Record<string, unknown>).every(
    (entry) => entry === false,
  );

const utcNanosecondsValid = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{9}Z$/.test(
      value,
    )
  )
    return false;
  const seconds = value.slice(0, 19);
  const parsed = new Date(`${seconds}.000Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 19) === seconds
  );
};

const presealFileBindingValid = (
  value: unknown,
): value is Nhm2SphericalV2PresealFileBindingV1 =>
  value != null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  exactKeys(value as Record<string, unknown>, [
    "mediaType",
    "path",
    "presealEnvelopeSha256",
    "rawSha256",
    "sizeBytes",
  ]) &&
  strictPath((value as Nhm2SphericalV2PresealFileBindingV1).path) &&
  (value as Nhm2SphericalV2PresealFileBindingV1).mediaType ===
    "application/json" &&
  Number.isSafeInteger(
    (value as Nhm2SphericalV2PresealFileBindingV1).sizeBytes,
  ) &&
  (value as Nhm2SphericalV2PresealFileBindingV1).sizeBytes > 0 &&
  nonzeroSha((value as Nhm2SphericalV2PresealFileBindingV1).rawSha256) &&
  nonzeroSha(
    (value as Nhm2SphericalV2PresealFileBindingV1).presealEnvelopeSha256,
  );

const presealEnvelopeSemanticViolations = (value: unknown): string[] => {
  const safe = snapshot(value);
  if ("violation" in safe) return [`v2_preseal_${safe.violation}`];
  if (
    safe.value == null ||
    typeof safe.value !== "object" ||
    Array.isArray(safe.value)
  )
    return ["v2_preseal_plain_object_required"];
  const record = safe.value as Record<string, unknown>;
  if (
    !exactKeys(
      record,
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE
        .preexecutionPresealSchema.exactKeys,
    )
  )
    return ["v2_preseal_shape_invalid"];
  if (
    record.artifactId !== "nhm2.spherical_boson_star_v2_preexecution_preseal" ||
    record.schemaVersion !==
      "nhm2_spherical_boson_star_v2_preexecution_preseal/v1" ||
    !LINUX_BOOT_ID.test(String(record.bootId)) ||
    record.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
    record.attemptOrdinal !== 1 ||
    record.authorityFalse !== true ||
    !authorityFalseLocksValid(record.claimLocks) ||
    !/^[a-f0-9]{40}$/.test(String(record.commit40)) ||
    /^0{40}$/.test(String(record.commit40)) ||
    ![
      record.commandArgvSha256,
      record.dirtyTreeDigestSha256,
      record.freshnessInventorySha256,
      record.outputRootIdentitySha256,
      record.runtimeClosureSha256,
      record.staticInputAggregateSha256,
    ].every(nonzeroSha) ||
    !u64DecimalValid(record.createdMonotonicRawNanoseconds) ||
    !utcNanosecondsValid(record.createdWallUtc) ||
    !strictAbsolutePath(record.workingDirectory) ||
    !runIdentityValid(record.runIdentity) ||
    !sameCanonical(
      record.v2CandidateFreezeBinding,
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    ) ||
    nhm2SphericalBosonStarV2InitializerBindingViolations(
      record.initializerBinding,
    ).length !== 0 ||
    !rawBindingValid(
      record.sourceManifestBinding as Nhm2SphericalV2RawBindingV1,
    ) ||
    (record.sourceManifestBinding as Nhm2SphericalV2RawBindingV1).mediaType !==
      "application/json" ||
    !rawBindingValid(
      record.toolchainManifestBinding as Nhm2SphericalV2RawBindingV1,
    ) ||
    (record.toolchainManifestBinding as Nhm2SphericalV2RawBindingV1)
      .mediaType !== "application/json" ||
    !rawBindingValid(
      record.scientificPresealBinding as Nhm2SphericalV2RawBindingV1,
    ) ||
    (record.scientificPresealBinding as Nhm2SphericalV2RawBindingV1)
      .mediaType !== "application/json" ||
    !rawBindingValid(record.executableBinding as Nhm2SphericalV2RawBindingV1) ||
    (record.executableBinding as Nhm2SphericalV2RawBindingV1).mediaType !==
      "application/octet-stream"
  )
    return ["v2_preseal_semantics_invalid"];
  try {
    return record.presealSha256 ===
      computeNhm2SphericalBosonStarV2PresealEnvelopeSha256(record)
      ? []
      : ["v2_preseal_sha256_mismatch"];
  } catch {
    return ["v2_preseal_semantics_invalid"];
  }
};

const DERIVED_PRESEAL_CONTEXTS =
  new WeakSet<Nhm2SphericalV2DerivedPresealContextV1>();
const DERIVED_PRESEAL_BYTES = new WeakMap<
  Nhm2SphericalV2DerivedPresealContextV1,
  Buffer
>();
const VALIDATED_PRESEAL_CONTEXTS =
  new WeakSet<Nhm2SphericalV2ValidatedPresealContextV1>();
const VALIDATED_PRESEAL_BYTES = new WeakMap<
  Nhm2SphericalV2ValidatedPresealContextV1,
  Buffer
>();
const SERVER_FILESYSTEM_OBSERVATION_CONTEXTS =
  new WeakSet<Nhm2SphericalV2ServerFilesystemObservationContextV1>();
const SERVER_LOADER_OBSERVATION_CONTEXTS =
  new WeakSet<Nhm2SphericalV2ServerLoaderObservationContextV1>();
const SERVER_SYSCALL_TRACE_CONTEXTS =
  new WeakSet<Nhm2SphericalV2ServerSyscallTraceContextV1>();

export const isNhm2SphericalBosonStarV2ServerFilesystemObservationContext = (
  value: unknown,
): value is Nhm2SphericalV2ServerFilesystemObservationContextV1 =>
  value != null &&
  typeof value === "object" &&
  SERVER_FILESYSTEM_OBSERVATION_CONTEXTS.has(
    value as Nhm2SphericalV2ServerFilesystemObservationContextV1,
  );
export const isNhm2SphericalBosonStarV2ServerLoaderObservationContext = (
  value: unknown,
): value is Nhm2SphericalV2ServerLoaderObservationContextV1 =>
  value != null &&
  typeof value === "object" &&
  SERVER_LOADER_OBSERVATION_CONTEXTS.has(
    value as Nhm2SphericalV2ServerLoaderObservationContextV1,
  );
export const isNhm2SphericalBosonStarV2ServerSyscallTraceContext = (
  value: unknown,
): value is Nhm2SphericalV2ServerSyscallTraceContextV1 =>
  value != null &&
  typeof value === "object" &&
  SERVER_SYSCALL_TRACE_CONTEXTS.has(
    value as Nhm2SphericalV2ServerSyscallTraceContextV1,
  );

const canonicalJsonEvidenceSnapshot = (
  value: unknown,
  depth = 0,
  budget = { nodes: 0, utf8: 0 },
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> => {
  budget.nodes += 1;
  if (depth > 64 || budget.nodes > 131072) return { ok: false };
  if (value === null || typeof value === "boolean") return { ok: true, value };
  if (typeof value === "number")
    return Number.isFinite(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false };
  if (typeof value === "string") {
    if (
      value.includes("\0") ||
      /[\ud800-\udfff]/u.test(value) ||
      value.normalize("NFC") !== value
    )
      return { ok: false };
    budget.utf8 += Buffer.byteLength(value, "utf8");
    return budget.utf8 <= 16 * 1024 * 1024
      ? { ok: true, value }
      : { ok: false };
  }
  if (
    typeof value !== "object" ||
    isProxy(value) ||
    ![Object.prototype, Array.prototype].includes(Object.getPrototypeOf(value))
  )
    return { ok: false };
  if (Array.isArray(value)) {
    if (!densePlainArray(value, 0, 131072)) return { ok: false };
    const output: unknown[] = [];
    for (const child of value) {
      const safe = canonicalJsonEvidenceSnapshot(child, depth + 1, budget);
      if (!safe.ok) return safe;
      output.push(safe.value);
    }
    return { ok: true, value: output };
  }
  const keys = Object.keys(value);
  if (
    keys.length > 16384 ||
    keys.some(
      (key) =>
        key.includes("\0") ||
        /[\ud800-\udfff]/u.test(key) ||
        key.normalize("NFC") !== key,
    ) ||
    !exactEnumerableDataKeys(value, keys)
  )
    return { ok: false };
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    budget.utf8 += Buffer.byteLength(key, "utf8");
    if (budget.utf8 > 16 * 1024 * 1024) return { ok: false };
    const safe = canonicalJsonEvidenceSnapshot(
      (value as Record<string, unknown>)[key],
      depth + 1,
      budget,
    );
    if (!safe.ok) return safe;
    output[key] = safe.value;
  }
  return { ok: true, value: output };
};

const rawBindingFromStaticInput = (
  entry: Nhm2SphericalV2StaticInputEntryV1,
): Nhm2SphericalV2RawBindingV1 =>
  Object.freeze({
    path: entry.relativePath,
    mediaType: entry.mediaType,
    sizeBytes: entry.sizeBytes,
    sha256: entry.sha256,
  });

type CanonicalJsonLexicalCounts = Readonly<{
  numberDigits: number;
  tokens: number;
}>;

const canonicalJsonLexicalCounts = (
  rawBytes: Uint8Array,
): CanonicalJsonLexicalCounts | null => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS;
  let tokens = 0;
  let numberDigits = 0;
  let cursor = 0;
  let inString = false;
  let escaped = false;
  while (cursor < rawBytes.length) {
    const byte = rawBytes[cursor]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (byte === 0x5c) escaped = true;
      else if (byte === 0x22) inString = false;
      cursor += 1;
      continue;
    }
    if (byte === 0x22) {
      tokens += 1;
      inString = true;
      cursor += 1;
    } else if (byte === 0x2d || (byte >= 0x30 && byte <= 0x39)) {
      tokens += 1;
      const start = cursor;
      let tokenDigits = 0;
      while (cursor < rawBytes.length) {
        const current = rawBytes[cursor]!;
        if (current >= 0x30 && current <= 0x39) tokenDigits += 1;
        if (!(
          current === 0x2b ||
          current === 0x2d ||
          current === 0x2e ||
          current === 0x45 ||
          current === 0x65 ||
          (current >= 0x30 && current <= 0x39)
        ))
          break;
        cursor += 1;
      }
      if (
        cursor - start > limits.maximumCanonicalJsonNumberTokenBytes ||
        tokenDigits > limits.maximumCanonicalJsonNumberDigitsPerToken
      )
        return null;
      numberDigits += tokenDigits;
    } else {
      if (
        byte === 0x7b ||
        byte === 0x7d ||
        byte === 0x5b ||
        byte === 0x5d ||
        byte === 0x2c ||
        byte === 0x3a ||
        byte === 0x74 ||
        byte === 0x66 ||
        byte === 0x6e
      )
        tokens += 1;
      cursor += 1;
    }
    if (tokens > limits.maximumCanonicalJsonTokensPerFile) return null;
  }
  return inString || escaped ? null : Object.freeze({ numberDigits, tokens });
};

const parseCanonicalJsonEvidence = (
  rawValue: unknown,
  code: string,
): Readonly<{ rawBytes: Buffer; value: unknown }> => {
  const rawLength = byteViewLength(rawValue, code);
  if (
    rawLength < 2 ||
    rawLength >
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumCanonicalJsonRawBytesPerFile ||
    canonicalJsonLexicalCounts(rawValue as Uint8Array) == null
  )
    throw new TypeError(code);
  const rawBytes = ownedBytes(rawValue, code);
  const text = rawBytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(rawBytes)) throw new TypeError(code);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new TypeError(code);
  }
  const safe = canonicalJsonEvidenceSnapshot(parsed);
  if (!safe.ok) throw new TypeError(code);
  if (nhm2SphericalBosonStarV2PreexecutionCanonicalJson(safe.value) !== text)
    throw new TypeError(code);
  return Object.freeze({ rawBytes, value: safe.value });
};

type PreexecutionRawResourceBudget = {
  canonicalJsonNumberDigits: number;
  canonicalJsonTokens: number;
  preflightEvidenceBytes: number;
  rawBytes: number;
};

const accountPreexecutionEvidenceBytes = (
  budget: PreexecutionRawResourceBudget,
  byteCount: number,
): void => {
  budget.preflightEvidenceBytes += byteCount;
  if (
    !Number.isSafeInteger(budget.preflightEvidenceBytes) ||
    budget.preflightEvidenceBytes >
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregatePreflightEvidenceBytes
  )
    throw new TypeError(
      "v2_preexecution_aggregate_preflight_evidence_bytes_exceeded",
    );
};

const accountPreexecutionRawView = (
  budget: PreexecutionRawResourceBudget,
  rawValue: unknown,
  code: string,
  canonicalJson: boolean,
  canonicalJsonCode = code,
): void => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS;
  const rawLength = byteViewLength(rawValue, code);
  budget.rawBytes += rawLength;
  if (
    !Number.isSafeInteger(budget.rawBytes) ||
    budget.rawBytes > limits.maximumAggregateRawBytes
  )
    throw new TypeError("v2_preexecution_aggregate_raw_bytes_exceeded");
  accountPreexecutionEvidenceBytes(budget, rawLength);
  if (!canonicalJson) return;
  if (rawLength < 2 || rawLength > limits.maximumCanonicalJsonRawBytesPerFile)
    throw new TypeError(canonicalJsonCode);
  const lexicalCounts = canonicalJsonLexicalCounts(rawValue as Uint8Array);
  if (lexicalCounts == null) throw new TypeError(canonicalJsonCode);
  budget.canonicalJsonTokens += lexicalCounts.tokens;
  budget.canonicalJsonNumberDigits += lexicalCounts.numberDigits;
  if (
    !Number.isSafeInteger(budget.canonicalJsonTokens) ||
    budget.canonicalJsonTokens > limits.maximumAggregateCanonicalJsonTokens
  )
    throw new TypeError(
      "v2_preexecution_aggregate_canonical_json_tokens_exceeded",
    );
  if (
    !Number.isSafeInteger(budget.canonicalJsonNumberDigits) ||
    budget.canonicalJsonNumberDigits >
      limits.maximumAggregateCanonicalJsonNumberDigits
  )
    throw new TypeError(
      "v2_preexecution_aggregate_canonical_json_number_digits_exceeded",
    );
};

const preflightNhm2SphericalBosonStarV2PresealResources = (
  evidence: Nhm2SphericalV2PresealEvidenceV1,
): void => {
  const budget: PreexecutionRawResourceBudget = {
    canonicalJsonNumberDigits: 0,
    canonicalJsonTokens: 0,
    preflightEvidenceBytes: 0,
    rawBytes: 0,
  };
  for (const [index, item] of evidence.staticInputByteEvidence.entries()) {
    if (
      item == null ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      isProxy(item) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(item)) ||
      !exactEnumerableDataKeys(item, ["entry", "rawBytes"])
    )
      throw new TypeError(
        `v2_preexecution_static_byte_evidence_invalid:${index}`,
      );
    const safeEntry = snapshot(item.entry);
    if (
      !safeEntry.ok ||
      safeEntry.value == null ||
      !staticEntryValid(safeEntry.value as Nhm2SphericalV2StaticInputEntryV1)
    )
      throw new TypeError(
        `v2_preexecution_static_byte_evidence_invalid:${index}`,
      );
    const entry = safeEntry.value as Nhm2SphericalV2StaticInputEntryV1;
    accountPreexecutionRawView(
      budget,
      item.rawBytes,
      `v2_preexecution_static_byte_evidence_invalid:${index}`,
      entry.semanticKind === "canonical_json",
      `v2_preexecution_static_canonical_json_invalid:${index}`,
    );
  }
  const dirtyRaw = evidence.dirtyTreeRawEvidence;
  if (
    dirtyRaw == null ||
    typeof dirtyRaw !== "object" ||
    Array.isArray(dirtyRaw) ||
    isProxy(dirtyRaw) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(dirtyRaw)) ||
    !exactEnumerableDataKeys(dirtyRaw, [
      "rawPorcelainV2ZBytes",
      "scopedPathspecs",
    ])
  )
    throw new TypeError("v2_preexecution_dirty_tree_raw_evidence_invalid");
  accountPreexecutionRawView(
    budget,
    dirtyRaw.rawPorcelainV2ZBytes,
    "v2_preexecution_dirty_tree_raw_evidence_invalid",
    false,
  );
  const rawRecordCount = inspectPorcelainV2ZRecordPopulation(
    dirtyRaw.rawPorcelainV2ZBytes,
    "v2_preexecution_dirty_tree_record_population_invalid",
  );
  if (
    !densePlainArray(
      evidence.dirtyTreeEntries,
      0,
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumDirtyTreeRecordCount,
    )
  )
    throw new TypeError("v2_preexecution_dirty_tree_surface_invalid");
  if (rawRecordCount !== evidence.dirtyTreeEntries.length)
    throw new TypeError("v2_preexecution_dirty_tree_record_population_invalid");
  for (const [index, entry] of evidence.dirtyTreeEntries.entries()) {
    if (
      entry == null ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      isProxy(entry) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(entry)) ||
      !exactEnumerableDataKeys(entry, [
        "gitPorcelainV2RecordHex",
        "indexStage0ObjectId",
        "relativePath",
        "worktreeRawBytes",
        "worktreeSha256",
        "worktreeSizeBytes",
        "worktreeStat",
      ])
    )
      throw new TypeError(`v2_preexecution_dirty_tree_entry_invalid:${index}`);
    if (!dirtyTreeRecordHexShapeValid(entry.gitPorcelainV2RecordHex))
      throw new TypeError(
        `v2_preexecution_dirty_tree_record_hex_invalid:${index}`,
      );
    accountPreexecutionEvidenceBytes(
      budget,
      entry.gitPorcelainV2RecordHex.length,
    );
    accountPreexecutionRawView(
      budget,
      entry.worktreeRawBytes,
      `v2_preexecution_dirty_tree_entry_bytes_invalid:${index}`,
      false,
    );
  }
  for (const [index, entry] of evidence.dirtyTreeEntries.entries())
    if (!dirtyTreeRecordHexCharactersValid(entry.gitPorcelainV2RecordHex))
      throw new TypeError(
        `v2_preexecution_dirty_tree_record_hex_invalid:${index}`,
      );
  const runtime = evidence.runtimeEvidence;
  if (
    runtime == null ||
    typeof runtime !== "object" ||
    Array.isArray(runtime) ||
    isProxy(runtime) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(runtime)) ||
    !exactEnumerableDataKeys(runtime, [
      "ambientLdLibraryPath",
      "authorityFalse",
      "executableBinding",
      "executableRawBytes",
      "executableStat",
      "loaderCacheUsed",
      "objectsInLoadOrder",
      "schemaVersion",
    ]) ||
    !densePlainArray(runtime.objectsInLoadOrder, 1, 4096)
  )
    throw new TypeError("v2_preexecution_runtime_byte_evidence_invalid");
  accountPreexecutionRawView(
    budget,
    runtime.executableRawBytes,
    "v2_preexecution_runtime_executable_bytes_invalid",
    false,
  );
  for (const [index, object] of runtime.objectsInLoadOrder.entries()) {
    if (
      object == null ||
      typeof object !== "object" ||
      Array.isArray(object) ||
      isProxy(object) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(object)) ||
      !exactEnumerableDataKeys(object, [
        "binding",
        "kind",
        "rawBytes",
        "requestedName",
        "resolvedAbsolutePath",
        "stat",
      ])
    )
      throw new TypeError(
        `v2_preexecution_runtime_object_byte_evidence_invalid:${index}`,
      );
    accountPreexecutionRawView(
      budget,
      object.rawBytes,
      `v2_preexecution_runtime_object_bytes_invalid:${index}`,
      false,
    );
  }
};

const derivedPresealContext = (
  preseal: Readonly<Record<string, unknown>>,
  rawBytes: Buffer,
): Nhm2SphericalV2DerivedPresealContextV1 => {
  const context = Object.freeze({
    contextVersion:
      "nhm2_spherical_boson_star_v2_derived_preseal_context/v1" as const,
    preseal,
    rawPresealBytes: new Uint8Array(rawBytes),
  });
  DERIVED_PRESEAL_CONTEXTS.add(context);
  DERIVED_PRESEAL_BYTES.set(context, Buffer.from(rawBytes));
  return context;
};

export const deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence = (
  evidence: Nhm2SphericalV2PresealEvidenceV1,
): Nhm2SphericalV2DerivedPresealContextV1 => {
  if (
    evidence == null ||
    typeof evidence !== "object" ||
    Array.isArray(evidence) ||
    isProxy(evidence) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(evidence)) ||
    !exactEnumerableDataKeys(evidence, [
      "argv",
      "attemptOrdinal",
      "bootId",
      "commit40",
      "createdMonotonicRawNanoseconds",
      "createdWallUtc",
      "dirtyTreeEntries",
      "dirtyTreeRawEvidence",
      "freshnessObservations",
      "initializerBinding",
      "outputRoots",
      "runIdentity",
      "runtimeEvidence",
      "staticInputByteEvidence",
      "workingDirectory",
    ]) ||
    evidence.attemptOrdinal !== 1 ||
    !LINUX_BOOT_ID.test(evidence.bootId) ||
    !/^[a-f0-9]{40}$/.test(evidence.commit40) ||
    /^0{40}$/.test(evidence.commit40) ||
    !u64DecimalValid(evidence.createdMonotonicRawNanoseconds) ||
    !utcNanosecondsValid(evidence.createdWallUtc) ||
    !strictAbsolutePath(evidence.workingDirectory) ||
    !runIdentityValid(evidence.runIdentity) ||
    nhm2SphericalBosonStarV2InitializerBindingViolations(
      evidence.initializerBinding,
    ).length !== 0 ||
    !densePlainArray(evidence.staticInputByteEvidence, 1, 16384)
  )
    throw new TypeError("v2_preexecution_preseal_evidence_invalid");

  preflightNhm2SphericalBosonStarV2PresealResources(evidence);
  const staticInputs: Nhm2SphericalV2StaticInputEntryV1[] = [];
  const rawByRole = new Map<Nhm2SphericalV2StaticInputRoleV1, Buffer[]>();
  for (const [index, item] of evidence.staticInputByteEvidence.entries()) {
    if (
      item == null ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      isProxy(item) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(item)) ||
      !exactEnumerableDataKeys(item, ["entry", "rawBytes"])
    )
      throw new TypeError(
        `v2_preexecution_static_byte_evidence_invalid:${index}`,
      );
    const safeEntry = snapshot(item.entry);
    if (!safeEntry.ok || safeEntry.value == null)
      throw new TypeError(
        `v2_preexecution_static_byte_evidence_invalid:${index}`,
      );
    const entry = safeEntry.value as Nhm2SphericalV2StaticInputEntryV1;
    const rawBytes = ownedBytes(
      item.rawBytes,
      `v2_preexecution_static_byte_evidence_invalid:${index}`,
    );
    if (
      !staticEntryValid(entry) ||
      entry.sizeBytes !== rawBytes.length ||
      entry.sha256 !== createHash("sha256").update(rawBytes).digest("hex") ||
      entry.stat.sizeBytes !== rawBytes.length ||
      entry.stat.sha256 !== entry.sha256
    )
      throw new TypeError(
        `v2_preexecution_static_byte_binding_mismatch:${index}`,
      );
    if (entry.semanticKind === "canonical_json")
      parseCanonicalJsonEvidence(
        rawBytes,
        `v2_preexecution_static_canonical_json_invalid:${index}`,
      );
    staticInputs.push(entry);
    const list = rawByRole.get(entry.semanticRole) ?? [];
    list.push(rawBytes);
    rawByRole.set(entry.semanticRole, list);
  }
  const staticInputAggregateSha256 =
    computeNhm2SphericalBosonStarV2StaticInputAggregateSha256(
      staticInputs,
      evidence.runIdentity,
    );
  if (
    staticInputs.some(
      (entry) =>
        !evidence.dirtyTreeRawEvidence.scopedPathspecs.some(
          (scope) =>
            entry.relativePath === scope ||
            entry.relativePath.startsWith(`${scope}/`),
        ),
    )
  )
    throw new TypeError("v2_preexecution_dirty_tree_scope_incomplete");
  const singleton = (
    role: Nhm2SphericalV2StaticInputRoleV1,
  ): Readonly<{ entry: Nhm2SphericalV2StaticInputEntryV1; raw: Buffer }> => {
    const matching = staticInputs
      .map((entry, index) => ({ entry, raw: rawByRole.get(role)?.[0], index }))
      .filter(({ entry }) => entry.semanticRole === role);
    if (matching.length !== 1 || matching[0]!.raw == null)
      throw new TypeError(`v2_preexecution_static_singleton_invalid:${role}`);
    const actualIndex = staticInputs.findIndex(
      (entry) => entry.semanticRole === role,
    );
    return { entry: staticInputs[actualIndex]!, raw: matching[0]!.raw! };
  };
  const candidateFreeze = singleton("v2_candidate_freeze");
  const initializerBridge = singleton("initializer_bridge");
  if (
    !candidateFreeze.raw.equals(
      Buffer.from(
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON,
        "utf8",
      ),
    ) ||
    !initializerBridge.raw.equals(
      Buffer.from(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON,
        "utf8",
      ),
    )
  )
    throw new TypeError("v2_preexecution_static_policy_bytes_mismatch");
  const sourceManifest = singleton("source_manifest");
  const toolchainManifest = singleton("toolchain_manifest");
  const scientificPreseal = singleton("scientific_preseal");
  const executable = singleton("executable");
  for (const item of [sourceManifest, toolchainManifest, scientificPreseal])
    parseCanonicalJsonEvidence(
      item.raw,
      "v2_preexecution_manifest_bytes_invalid",
    );

  const commandArgvSha256 = computeNhm2SphericalBosonStarV2CommandArgvSha256(
    evidence.argv,
  );
  const dirtyTreeDigestSha256 =
    computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256(
      evidence.commit40,
      evidence.dirtyTreeRawEvidence,
      evidence.dirtyTreeEntries,
      evidence.staticInputByteEvidence,
      evidence.runIdentity,
    );
  const freshnessInventorySha256 =
    computeNhm2SphericalBosonStarV2FreshnessInventorySha256(
      evidence.freshnessObservations,
      staticInputs,
      evidence.runIdentity,
    );
  const outputRootIdentitySha256 =
    computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256(
      evidence.outputRoots,
    );
  const runtime = buildNhm2SphericalBosonStarV2RuntimeClosureFromBytes(
    evidence.runtimeEvidence,
    evidence.runIdentity,
  );
  if (
    !sameCanonical(
      runtime.closure.executableBinding,
      rawBindingFromStaticInput(executable.entry),
    )
  )
    throw new TypeError("v2_preexecution_executable_cross_binding_mismatch");
  const interpreterStatic = singleton("elf_interpreter");
  const interpreterRuntime = evidence.runtimeEvidence.objectsInLoadOrder[0];
  if (
    interpreterRuntime == null ||
    interpreterStatic.entry.sizeBytes !==
      interpreterRuntime.binding.sizeBytes ||
    interpreterStatic.entry.sha256 !== interpreterRuntime.binding.sha256 ||
    !interpreterStatic.raw.equals(Buffer.from(interpreterRuntime.rawBytes))
  )
    throw new TypeError("v2_preexecution_interpreter_cross_binding_mismatch");
  const sharedStatic = staticInputs.filter(
    (entry) => entry.semanticRole === "shared_object",
  );
  const sharedRuntime = evidence.runtimeEvidence.objectsInLoadOrder.slice(1);
  if (
    sharedStatic.length !== sharedRuntime.length ||
    sharedStatic.some((entry) => {
      const matches = sharedRuntime.filter(
        (object) =>
          object.binding.sizeBytes === entry.sizeBytes &&
          object.binding.sha256 === entry.sha256,
      );
      return matches.length !== 1;
    })
  )
    throw new TypeError("v2_preexecution_shared_object_cross_binding_mismatch");

  const preseal: Record<string, unknown> = {
    artifactId: "nhm2.spherical_boson_star_v2_preexecution_preseal",
    attemptOrdinal: 1,
    authorityFalse: true,
    bootId: evidence.bootId,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    claimLocks: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_AUTHORITY_LOCKS,
    },
    commandArgvSha256,
    commit40: evidence.commit40,
    createdMonotonicRawNanoseconds: evidence.createdMonotonicRawNanoseconds,
    createdWallUtc: evidence.createdWallUtc,
    dirtyTreeDigestSha256,
    executableBinding: rawBindingFromStaticInput(executable.entry),
    freshnessInventorySha256,
    initializerBinding: evidence.initializerBinding,
    outputRootIdentitySha256,
    presealSha256: "f".repeat(64),
    runIdentity: evidence.runIdentity,
    runtimeClosureSha256: runtime.runtimeClosureSha256,
    schemaVersion: "nhm2_spherical_boson_star_v2_preexecution_preseal/v1",
    scientificPresealBinding: rawBindingFromStaticInput(
      scientificPreseal.entry,
    ),
    sourceManifestBinding: rawBindingFromStaticInput(sourceManifest.entry),
    staticInputAggregateSha256,
    toolchainManifestBinding: rawBindingFromStaticInput(
      toolchainManifest.entry,
    ),
    v2CandidateFreezeBinding:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    workingDirectory: evidence.workingDirectory,
  };
  preseal.presealSha256 =
    computeNhm2SphericalBosonStarV2PresealEnvelopeSha256(preseal);
  const safePreseal = snapshot(preseal);
  if (!safePreseal.ok || safePreseal.value == null)
    throw new TypeError("v2_preexecution_preseal_build_invalid");
  const frozenPreseal = deepFreeze(
    safePreseal.value as Readonly<Record<string, unknown>>,
  );
  const violations = presealEnvelopeSemanticViolations(frozenPreseal);
  if (violations.length !== 0)
    throw new TypeError(
      `v2_preexecution_preseal_build_invalid:${violations[0]}`,
    );
  const rawPresealBytes = Buffer.from(
    nhm2SphericalBosonStarV2PreexecutionCanonicalJson(frozenPreseal),
    "utf8",
  );
  return derivedPresealContext(frozenPreseal, rawPresealBytes);
};

export const buildNhm2SphericalBosonStarV2PresealEvidence = (
  evidence: Nhm2SphericalV2PresealEvidenceV1,
  filesystemObservationContext: Nhm2SphericalV2ServerFilesystemObservationContextV1,
  loaderObservationContext: Nhm2SphericalV2ServerLoaderObservationContextV1,
): Nhm2SphericalV2ValidatedPresealContextV1 => {
  if (
    !isNhm2SphericalBosonStarV2ServerFilesystemObservationContext(
      filesystemObservationContext,
    )
  )
    throw new TypeError(
      "v2_preexecution_server_filesystem_observation_context_required:server_authenticated_filesystem_observer_not_implemented",
    );
  if (
    !isNhm2SphericalBosonStarV2ServerLoaderObservationContext(
      loaderObservationContext,
    )
  )
    throw new TypeError(
      "v2_preexecution_server_loader_observation_context_required:server_authenticated_runtime_loader_observer_not_implemented",
    );
  const derived =
    deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(evidence);
  const rawBytes = DERIVED_PRESEAL_BYTES.get(derived);
  if (rawBytes == null)
    throw new TypeError("v2_preexecution_derived_context_invalid");
  const context = Object.freeze({
    contextVersion:
      "nhm2_spherical_boson_star_v2_validated_preseal_context/v1" as const,
    preseal: derived.preseal,
    rawPresealBytes: new Uint8Array(rawBytes),
    [NHM2_V2_VALIDATED_PRESEAL_CONTEXT_BRAND]: true as const,
  });
  VALIDATED_PRESEAL_CONTEXTS.add(context);
  VALIDATED_PRESEAL_BYTES.set(context, Buffer.from(rawBytes));
  DERIVED_PRESEAL_CONTEXTS.add(
    context as unknown as Nhm2SphericalV2DerivedPresealContextV1,
  );
  DERIVED_PRESEAL_BYTES.set(
    context as unknown as Nhm2SphericalV2DerivedPresealContextV1,
    Buffer.from(rawBytes),
  );
  return context;
};

export const nhm2SphericalBosonStarV2DiagnosticPresealEnvelopeViolations = (
  value: unknown,
  context: Nhm2SphericalV2DerivedPresealContextV1,
  rawPresealBytes: Uint8Array,
): string[] => {
  if (!DERIVED_PRESEAL_CONTEXTS.has(context))
    return ["v2_preseal_derived_context_required"];
  let parsed: Readonly<{ rawBytes: Buffer; value: unknown }>;
  try {
    parsed = parseCanonicalJsonEvidence(
      rawPresealBytes,
      "v2_preseal_raw_bytes_invalid",
    );
  } catch {
    return ["v2_preseal_raw_bytes_invalid"];
  }
  const contextBytes = DERIVED_PRESEAL_BYTES.get(context);
  if (contextBytes == null) return ["v2_preseal_derived_context_required"];
  const safeValue = snapshot(value);
  if ("violation" in safeValue) return [`v2_preseal_${safeValue.violation}`];
  if (
    !parsed.rawBytes.equals(contextBytes) ||
    !sameCanonical(parsed.value, context.preseal) ||
    !sameCanonical(safeValue.value, context.preseal)
  )
    return ["v2_preseal_context_binding_mismatch"];
  return presealEnvelopeSemanticViolations(parsed.value);
};

export const nhm2SphericalBosonStarV2PresealEnvelopeViolations = (
  value: unknown,
  context: Nhm2SphericalV2ValidatedPresealContextV1,
  rawPresealBytes: Uint8Array,
): string[] => {
  if (!VALIDATED_PRESEAL_CONTEXTS.has(context))
    return [
      "v2_preseal_server_observation_context_required:server_authenticated_filesystem_observer_not_implemented",
    ];
  const contextBytes = VALIDATED_PRESEAL_BYTES.get(context);
  if (contextBytes == null) return ["v2_preseal_validated_context_required"];
  let parsed: Readonly<{ rawBytes: Buffer; value: unknown }>;
  try {
    parsed = parseCanonicalJsonEvidence(
      rawPresealBytes,
      "v2_preseal_raw_bytes_invalid",
    );
  } catch {
    return ["v2_preseal_raw_bytes_invalid"];
  }
  const safeValue = snapshot(value);
  if ("violation" in safeValue) return [`v2_preseal_${safeValue.violation}`];
  if (
    !parsed.rawBytes.equals(contextBytes) ||
    !sameCanonical(parsed.value, context.preseal) ||
    !sameCanonical(safeValue.value, context.preseal)
  )
    return ["v2_preseal_context_binding_mismatch"];
  return presealEnvelopeSemanticViolations(parsed.value);
};

export const nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations =
  (
    value: unknown,
    context: Nhm2SphericalV2DerivedPresealContextV1,
    rawReceiptBytes: Uint8Array,
    rawSyscallTraceBytes: Uint8Array,
  ): string[] => {
    if (!DERIVED_PRESEAL_CONTEXTS.has(context))
      return ["v2_preseal_receipt_derived_context_required"];
    const receiptResourceBudget: PreexecutionRawResourceBudget = {
      canonicalJsonNumberDigits: 0,
      canonicalJsonTokens: 0,
      preflightEvidenceBytes: 0,
      rawBytes: 0,
    };
    try {
      accountPreexecutionRawView(
        receiptResourceBudget,
        rawReceiptBytes,
        "v2_preseal_receipt_raw_bytes_invalid",
        true,
      );
      accountPreexecutionRawView(
        receiptResourceBudget,
        rawSyscallTraceBytes,
        "v2_preseal_receipt_trace_bytes_invalid",
        true,
      );
    } catch (error) {
      return [
        error instanceof TypeError && error.message.includes("aggregate")
          ? error.message.replace(
              "v2_preexecution_aggregate_",
              "v2_preseal_receipt_aggregate_",
            )
          : error instanceof TypeError && error.message.includes("trace")
            ? "v2_preseal_receipt_trace_bytes_invalid"
            : "v2_preseal_receipt_raw_bytes_invalid",
      ];
    }
    let receiptEvidence: Readonly<{ rawBytes: Buffer; value: unknown }>;
    let traceEvidence: Readonly<{ rawBytes: Buffer; value: unknown }>;
    try {
      receiptEvidence = parseCanonicalJsonEvidence(
        rawReceiptBytes,
        "v2_preseal_receipt_raw_bytes_invalid",
      );
      traceEvidence = parseCanonicalJsonEvidence(
        rawSyscallTraceBytes,
        "v2_preseal_receipt_trace_bytes_invalid",
      );
    } catch (error) {
      return [
        error instanceof TypeError && error.message.includes("trace")
          ? "v2_preseal_receipt_trace_bytes_invalid"
          : "v2_preseal_receipt_raw_bytes_invalid",
      ];
    }
    const supplied = snapshot(value);
    if ("violation" in supplied)
      return [`v2_preseal_receipt_${supplied.violation}`];
    if (!sameCanonical(supplied.value, receiptEvidence.value))
      return ["v2_preseal_receipt_raw_binding_mismatch"];
    const safe = snapshot(receiptEvidence.value);
    if ("violation" in safe) return [`v2_preseal_receipt_${safe.violation}`];
    if (
      safe.value == null ||
      typeof safe.value !== "object" ||
      Array.isArray(safe.value)
    )
      return ["v2_preseal_receipt_plain_object_required"];
    const record = safe.value as Record<string, unknown>;
    if (
      !exactKeys(
        record,
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE
          .presealDurablePublicationReceiptSchema.exactKeys,
      )
    )
      return ["v2_preseal_receipt_shape_invalid"];
    const presealBinding = record.presealBinding;
    const temporaryStat = record.temporaryFileStat;
    const finalStat = record.finalFileStat;
    const runIdentity = record.runIdentity;
    const counters = [
      record.fileFsyncCompletedMonotonicRawNanoseconds,
      record.parentDirectoryFsyncBeforeRenameMonotonicRawNanoseconds,
      record.renameNoreplaceCompletedMonotonicRawNanoseconds,
      record.parentDirectoryFsyncAfterRenameMonotonicRawNanoseconds,
      record.readbackCompletedMonotonicRawNanoseconds,
    ];
    const contextPreseal = context.preseal;
    const contextRaw = DERIVED_PRESEAL_BYTES.get(context);
    if (contextRaw == null)
      return ["v2_preseal_receipt_derived_context_required"];
    const trace = traceEvidence.value as Record<string, unknown> | null;
    const traceEvents =
      trace != null && Array.isArray(trace.events)
        ? (trace.events as readonly Record<string, unknown>[])
        : [];
    const createdMonotonicRawNanoseconds =
      contextPreseal.createdMonotonicRawNanoseconds;
    const expectedOperations = [
      "openat2_temp_O_CREAT_O_EXCL_O_NOFOLLOW_mode0400",
      "complete_write_and_fsync_temp_file",
      "close_reopenat2_rehash_and_identity_stability_check",
      "fsync_parent_directory_before_rename",
      "renameat2_RENAME_NOREPLACE_temp_to_final",
      "fsync_parent_directory_after_rename",
      "openat2_final_readback_rehash_and_identity_check",
    ] as const;
    const traceValid =
      trace != null &&
      typeof trace === "object" &&
      !Array.isArray(trace) &&
      exactKeys(trace, [
        "artifactId",
        "bootId",
        "candidateId",
        "events",
        "finalPath",
        "presealEnvelopeSha256",
        "presealRawSha256",
        "schemaVersion",
        "temporaryPath",
      ]) &&
      trace.artifactId ===
        "nhm2.spherical_boson_star_v2_preseal_syscall_trace" &&
      trace.schemaVersion ===
        "nhm2_spherical_boson_star_v2_preseal_syscall_trace/v1" &&
      trace.bootId === contextPreseal.bootId &&
      trace.candidateId === contextPreseal.candidateId &&
      trace.presealEnvelopeSha256 === contextPreseal.presealSha256 &&
      trace.presealRawSha256 ===
        createHash("sha256").update(contextRaw).digest("hex") &&
      strictPath(trace.temporaryPath) &&
      strictPath(trace.finalPath) &&
      trace.temporaryPath !== trace.finalPath &&
      trace.finalPath ===
        (presealBinding as Nhm2SphericalV2PresealFileBindingV1 | null)?.path &&
      traceEvents.length === expectedOperations.length &&
      traceEvents.every(
        (event, index) =>
          event != null &&
          typeof event === "object" &&
          !Array.isArray(event) &&
          exactKeys(event, [
            "monotonicRawNanoseconds",
            "operation",
            "ordinal",
          ]) &&
          event.ordinal === index &&
          event.operation === expectedOperations[index] &&
          u64DecimalValid(event.monotonicRawNanoseconds) &&
          u64DecimalValid(createdMonotonicRawNanoseconds) &&
          u64DecimalBigInt(
            event.monotonicRawNanoseconds,
            "v2_preseal_receipt_trace_counter_invalid",
          ) >=
            u64DecimalBigInt(
              createdMonotonicRawNanoseconds,
              "v2_preseal_creation_counter_invalid",
            ) &&
          (index === 0 ||
            u64DecimalBigInt(
              event.monotonicRawNanoseconds,
              "v2_preseal_receipt_trace_counter_invalid",
            ) >
              u64DecimalBigInt(
                traceEvents[index - 1]?.monotonicRawNanoseconds,
                "v2_preseal_receipt_trace_counter_invalid",
              )),
      ) &&
      traceEvents[1]?.monotonicRawNanoseconds === counters[0] &&
      traceEvents[3]?.monotonicRawNanoseconds === counters[1] &&
      traceEvents[4]?.monotonicRawNanoseconds === counters[2] &&
      traceEvents[5]?.monotonicRawNanoseconds === counters[3] &&
      traceEvents[6]?.monotonicRawNanoseconds === counters[4];
    const stableAcrossRenameExceptCtime =
      statValid(temporaryStat) &&
      statValid(finalStat) &&
      temporaryStat.fileType === finalStat.fileType &&
      temporaryStat.ownerUid === finalStat.ownerUid &&
      temporaryStat.ownerGid === finalStat.ownerGid &&
      temporaryStat.linkCount === finalStat.linkCount &&
      temporaryStat.modeOctal === finalStat.modeOctal &&
      temporaryStat.device === finalStat.device &&
      temporaryStat.inode === finalStat.inode &&
      temporaryStat.modifyTimeNanoseconds === finalStat.modifyTimeNanoseconds &&
      temporaryStat.sizeBytes === finalStat.sizeBytes &&
      temporaryStat.sha256 === finalStat.sha256 &&
      u64DecimalBigInt(
        finalStat.changeTimeNanoseconds,
        "v2_preseal_receipt_final_ctime_invalid",
      ) >=
        u64DecimalBigInt(
          temporaryStat.changeTimeNanoseconds,
          "v2_preseal_receipt_temporary_ctime_invalid",
        );
    if (
      record.artifactId !==
        "nhm2.spherical_boson_star_v2_preseal_publication_receipt" ||
      record.contractVersion !==
        "nhm2_spherical_boson_star_v2_preseal_publication_receipt/v1" ||
      !LINUX_BOOT_ID.test(String(record.bootId)) ||
      record.authority !==
        "server_observed_durability_only_no_candidate_authority" ||
      record.candidateId !==
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
      !authorityFalseLocksValid(record.claimLocks) ||
      !presealFileBindingValid(presealBinding) ||
      !runIdentityValid(runIdentity) ||
      !statValid(temporaryStat) ||
      !statValid(finalStat) ||
      !stableAcrossRenameExceptCtime ||
      temporaryStat.modeOctal !== "0400" ||
      finalStat.modeOctal !== "0400" ||
      temporaryStat.ownerUid !== runIdentity.ownerUid ||
      temporaryStat.ownerGid !== runIdentity.ownerGid ||
      temporaryStat.sha256 !== presealBinding.rawSha256 ||
      temporaryStat.sizeBytes !== presealBinding.sizeBytes ||
      presealBinding.rawSha256 !==
        createHash("sha256").update(contextRaw).digest("hex") ||
      presealBinding.sizeBytes !== contextRaw.length ||
      presealBinding.presealEnvelopeSha256 !== contextPreseal.presealSha256 ||
      record.bootId !== contextPreseal.bootId ||
      !sameCanonical(runIdentity, contextPreseal.runIdentity) ||
      !rawBindingValid(
        record.syscallTraceBinding as Nhm2SphericalV2RawBindingV1,
      ) ||
      (record.syscallTraceBinding as Nhm2SphericalV2RawBindingV1).mediaType !==
        "application/json" ||
      (record.syscallTraceBinding as Nhm2SphericalV2RawBindingV1).sizeBytes !==
        traceEvidence.rawBytes.length ||
      (record.syscallTraceBinding as Nhm2SphericalV2RawBindingV1).sha256 !==
        createHash("sha256").update(traceEvidence.rawBytes).digest("hex") ||
      !traceValid ||
      !u64DecimalValid(createdMonotonicRawNanoseconds) ||
      !counters.every((counter) => u64DecimalValid(counter)) ||
      !counters.every(
        (counter) =>
          u64DecimalBigInt(counter, "v2_preseal_receipt_counter_invalid") >=
          u64DecimalBigInt(
            createdMonotonicRawNanoseconds,
            "v2_preseal_creation_counter_invalid",
          ),
      ) ||
      !counters.every(
        (counter, index) =>
          index === 0 ||
          u64DecimalBigInt(counter, "v2_preseal_receipt_counter_invalid") >
            u64DecimalBigInt(
              counters[index - 1],
              "v2_preseal_receipt_counter_invalid",
            ),
      )
    )
      return ["v2_preseal_receipt_semantics_invalid"];
    try {
      return record.publicationReceiptSha256 ===
        computeNhm2SphericalBosonStarV2PresealPublicationReceiptSha256(record)
        ? []
        : ["v2_preseal_receipt_sha256_mismatch"];
    } catch {
      return ["v2_preseal_receipt_semantics_invalid"];
    }
  };

export const nhm2SphericalBosonStarV2PresealPublicationReceiptViolations = (
  value: unknown,
  context: Nhm2SphericalV2ValidatedPresealContextV1,
  rawReceiptBytes: Uint8Array,
  rawSyscallTraceBytes: Uint8Array,
  syscallTraceContext: Nhm2SphericalV2ServerSyscallTraceContextV1,
): string[] => {
  if (!VALIDATED_PRESEAL_CONTEXTS.has(context))
    return [
      "v2_preseal_receipt_server_observation_context_required:server_authenticated_filesystem_observer_not_implemented",
    ];
  if (!isNhm2SphericalBosonStarV2ServerSyscallTraceContext(syscallTraceContext))
    return [
      "v2_preseal_receipt_server_syscall_trace_context_required:server_authenticated_syscall_tracer_not_implemented",
    ];
  return nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations(
    value,
    context as unknown as Nhm2SphericalV2DerivedPresealContextV1,
    rawReceiptBytes,
    rawSyscallTraceBytes,
  );
};

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
const snapshot = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  depth = 0,
  budget = { nodes: 0, utf8: 0 },
): SnapshotResult => {
  if (depth > 32) return { ok: false, violation: `depth:${pointer || "/"}` };
  budget.nodes += 1;
  if (budget.nodes > 32768)
    return { ok: false, violation: `nodes:${pointer || "/"}` };
  if (value === null || typeof value === "boolean") return { ok: true, value };
  if (typeof value === "number")
    return Number.isSafeInteger(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false, violation: `number:${pointer || "/"}` };
  if (typeof value === "string") {
    if (value.includes("\0") || /[\ud800-\udfff]/u.test(value))
      return { ok: false, violation: `string:${pointer || "/"}` };
    budget.utf8 += Buffer.byteLength(value, "utf8");
    return budget.utf8 <= 1048576
      ? { ok: true, value }
      : { ok: false, violation: `utf8:${pointer || "/"}` };
  }
  if (typeof value !== "object" || isProxy(value))
    return { ok: false, violation: `surface:${pointer || "/"}` };
  if (ancestors.has(value))
    return { ok: false, violation: `cycle:${pointer || "/"}` };
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      value.length > 16384 ||
      Reflect.ownKeys(value).some(
        (key) =>
          key !== "length" &&
          (typeof key !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(key)),
      ) ||
      Object.keys(value).length !== value.length
    )
      return { ok: false, violation: `array:${pointer || "/"}` };
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      )
        return { ok: false, violation: `array:${pointer || "/"}` };
      const child = snapshot(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        depth + 1,
        budget,
      );
      if (!child.ok) return child;
      output.push(child.value);
    }
    ancestors.delete(value);
    return { ok: true, value: output };
  }
  if (![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    return { ok: false, violation: `object:${pointer || "/"}` };
  const keys = Reflect.ownKeys(value);
  if (keys.length > 256 || keys.some((key) => typeof key !== "string"))
    return { ok: false, violation: `object:${pointer || "/"}` };
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      return { ok: false, violation: `property:${pointer}/${key}` };
    const child = snapshot(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      depth + 1,
      budget,
    );
    if (!child.ok) return child;
    output[key] = child.value;
  }
  ancestors.delete(value);
  return { ok: true, value: output };
};

export const nhm2SphericalBosonStarV2PreexecutionProfileViolations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE) return [];
  const safe = snapshot(value);
  if ("violation" in safe) return [`v2_preexecution_profile_${safe.violation}`];
  return nhm2SphericalBosonStarV2PreexecutionCanonicalJson(safe.value) ===
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_JSON
    ? ["v2_preexecution_profile_external_copy_not_authoritative"]
    : ["v2_preexecution_profile_semantic_mismatch"];
};

export const isNhm2SphericalBosonStarV2PreexecutionProfile = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE =>
  value === NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE;

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_EXPECTED_CANONICAL_SIZE_BYTES ||
  Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_AUTHORITY_LOCKS).some(
    (value) => value !== false,
  ) ||
  Object.entries(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_READINESS)
    .filter(([key]) => key !== "blockers")
    .some(([, value]) => value !== false) ||
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE.completionBoundary
    .launchAuthorized !== false ||
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE.completionBoundary
    .actualRuntimeClosureReady !== false ||
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE.platformBoundary
    .currentWindowsHostExecutionAdmissible !== false
) {
  throw new Error("nhm2_spherical_v2_preexecution_profile_invariant_violation");
}
