import { createHash } from "node:crypto";

export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_BYTE_MATERIALIZER_ARTIFACT_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_smearing_weight_byte_materializer" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_BYTE_MATERIALIZER_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_spherical_boson_star_smearing_weight_byte_materializer/v1" as const;

const CANDIDATE_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const;
const WEIGHT_COUNT = 64 as const;
const WEIGHT_RAW_SHA256 =
  "25493ecc62734a68fad443881a595d122cb7a93ddf9d07e5ec2060baf84f03fd" as const;
const WEIGHT_RAW_SIZE_BYTES = 512 as const;

const REQUIRED_BINDING_LITERALS = Object.freeze({
  meanNoiseRealization: Object.freeze({
    sha256: "bf9875496a7aa8f5bde0509e597b373454ddea072f1d1af2ae18b746f7646467",
    canonicalSizeBytes: 25_213,
  }),
  rawReplaySchema: Object.freeze({
    sha256: "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff",
    canonicalSizeBytes: 163_818,
  }),
  smearingWeightFreeze: Object.freeze({
    sha256: "4cff97a0c1220dbef8c0df29e500d4c80d88320c97f8d16529c9e98ac290a446",
    canonicalSizeBytes: 6_764,
  }),
  candidateFreeze: Object.freeze({
    sha256: "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    canonicalSizeBytes: 55_997,
  }),
} as const);

const REQUIRED_WEIGHT_F64_LE_WORD_HEX = "000000000000903f" as const;
const REQUIRED_WORD_SIZE_BYTES = 8 as const;

const PHYSICAL_FILE = Object.freeze({
  fileOrdinal: 4,
  role: "smearing_weights",
  path: "{outputDirectory}/fixed/04-smearing_weights.f64le",
  shape: Object.freeze([64] as const),
  componentOrder: Object.freeze(["weight"] as const),
  sampleOrder: "candidate_sampling_ordinal_0_to_63",
  unit: "dimensionless",
  sizeBytes: 512,
  dtype: "float64",
  binaryEncoding: "raw_ieee754",
  endianness: "little",
  storageOrder: "row-major",
  mediaType: "application/octet-stream",
  finiteValuesRequired: true,
  negativeZeroAllowed: false,
} as const);

const MATERIALIZED_NONCONSTRAINT_ROLES = Object.freeze([
  "smearing_weights",
] as const);
const ABSENT_NONCONSTRAINT_ROLES = Object.freeze([
  "noise_kernel",
  "noise_kernel_absolute_uncertainty95",
  "mean_rset",
  "mean_rset_absolute_uncertainty95",
] as const);
const BLOCKERS = Object.freeze([
  "live_dependency_module_observation_not_performed",
  "filesystem_persistence_and_secure_readback_not_performed",
  "successor_manifest_entry_not_materialized",
  "preexecution_and_execution_observation_not_bound",
  "remaining_four_nonconstraint_scientific_arrays_absent",
  "complete_68_file_output_inventory_absent",
] as const);
const AUTHORITY_LOCKS = Object.freeze({
  implementationAuthority: false,
  filesystemPersistenceAuthority: false,
  manifestAuthority: false,
  candidateManifestAuthority: false,
  scientificPresealAuthority: false,
  executionAuthority: false,
  outputAuthority: false,
  replayAuthority: false,
  independentAgreement: false,
  semiclassicalStressNoiseLamp: false,
  semiclassicalConstraintAlgebraLamp: false,
  diagnosticPass: false,
  theoryGraphPromotion: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
} as const);

export type Nhm2SphericalBosonStarV2SmearingWeightByteMaterializationReceiptV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_BYTE_MATERIALIZER_ARTIFACT_ID;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_BYTE_MATERIALIZER_CONTRACT_VERSION;
    candidateId: typeof CANDIDATE_ID;
    stage: "stage_2_candidate_specific_ordinal_4_in_memory_byte_materialization";
    calculationOnly: true;
    serverOwned: true;
    deterministic: true;
    noCallerInputConsumed: true;
    exactBindings: typeof REQUIRED_BINDING_LITERALS;
    dependencyObservationBoundary: Readonly<{
      bindingLiteralsFrozen: true;
      descriptorLiteralFrozen: true;
      liveDependencyModuleObservationPerformed: false;
      liveDependencyBindingMatchClaimed: false;
      dependencyIdentityAuthority: false;
    }>;
    physicalFile: typeof PHYSICAL_FILE;
    construction: Readonly<{
      wordF64LeHex: typeof REQUIRED_WEIGHT_F64_LE_WORD_HEX;
      wordSizeBytes: typeof REQUIRED_WORD_SIZE_BYTES;
      copyCount: typeof WEIGHT_COUNT;
      ordinalOrder: "sample_ordinal_0_to_63";
      floatingPointArithmeticUsed: false;
      observedScientificOutputRead: false;
    }>;
    content: Readonly<{
      sha256: typeof WEIGHT_RAW_SHA256;
      sizeBytes: typeof WEIGHT_RAW_SIZE_BYTES;
      exactContentVerified: true;
      freshBytesPerCall: true;
      bytesAreFreshCallerOwnedCopy: true;
    }>;
    persistenceBoundary: Readonly<{
      filesystemPersistencePerformed: false;
      secureReadbackPerformed: false;
      manifestEntryMaterialized: false;
      preexecutionSealMaterialized: false;
      executionObserved: false;
    }>;
    completeness: Readonly<{
      materializedNonconstraintRoles: typeof MATERIALIZED_NONCONSTRAINT_ROLES;
      absentNonconstraintRoles: typeof ABSENT_NONCONSTRAINT_ROLES;
      materializedNonconstraintFileCount: 1;
      allFiveNonconstraintFilesPresent: false;
      exact68PhysicalFileInventoryPresent: false;
    }>;
    blockers: typeof BLOCKERS;
    authorityLocks: typeof AUTHORITY_LOCKS;
  }>;

export type Nhm2SphericalBosonStarV2SmearingWeightByteMaterializationV1 =
  Readonly<{
    bytes: Uint8Array;
    receipt: Nhm2SphericalBosonStarV2SmearingWeightByteMaterializationReceiptV1;
  }>;

const RECEIPT = Object.freeze({
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_BYTE_MATERIALIZER_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_BYTE_MATERIALIZER_CONTRACT_VERSION,
  candidateId: CANDIDATE_ID,
  stage: "stage_2_candidate_specific_ordinal_4_in_memory_byte_materialization",
  calculationOnly: true,
  serverOwned: true,
  deterministic: true,
  noCallerInputConsumed: true,
  exactBindings: REQUIRED_BINDING_LITERALS,
  dependencyObservationBoundary: Object.freeze({
    bindingLiteralsFrozen: true,
    descriptorLiteralFrozen: true,
    liveDependencyModuleObservationPerformed: false,
    liveDependencyBindingMatchClaimed: false,
    dependencyIdentityAuthority: false,
  }),
  physicalFile: PHYSICAL_FILE,
  construction: Object.freeze({
    wordF64LeHex: REQUIRED_WEIGHT_F64_LE_WORD_HEX,
    wordSizeBytes: REQUIRED_WORD_SIZE_BYTES,
    copyCount: WEIGHT_COUNT,
    ordinalOrder: "sample_ordinal_0_to_63",
    floatingPointArithmeticUsed: false,
    observedScientificOutputRead: false,
  }),
  content: Object.freeze({
    sha256: WEIGHT_RAW_SHA256,
    sizeBytes: WEIGHT_RAW_SIZE_BYTES,
    exactContentVerified: true,
    freshBytesPerCall: true,
    bytesAreFreshCallerOwnedCopy: true,
  }),
  persistenceBoundary: Object.freeze({
    filesystemPersistencePerformed: false,
    secureReadbackPerformed: false,
    manifestEntryMaterialized: false,
    preexecutionSealMaterialized: false,
    executionObserved: false,
  }),
  completeness: Object.freeze({
    materializedNonconstraintRoles: MATERIALIZED_NONCONSTRAINT_ROLES,
    absentNonconstraintRoles: ABSENT_NONCONSTRAINT_ROLES,
    materializedNonconstraintFileCount: 1,
    allFiveNonconstraintFilesPresent: false,
    exact68PhysicalFileInventoryPresent: false,
  }),
  blockers: BLOCKERS,
  authorityLocks: AUTHORITY_LOCKS,
} as const) satisfies Nhm2SphericalBosonStarV2SmearingWeightByteMaterializationReceiptV1;

const materializeLiteralWeightBytes = (): Uint8Array => {
  const word = Buffer.from(REQUIRED_WEIGHT_F64_LE_WORD_HEX, "hex");
  if (word.byteLength !== REQUIRED_WORD_SIZE_BYTES)
    throw new Error("spherical_v2_smearing_weight_materializer_literal_word");

  const bytes = new Uint8Array(WEIGHT_RAW_SIZE_BYTES);
  let byteOffset = 0;
  for (let ordinal = 0; ordinal < WEIGHT_COUNT; ordinal += 1) {
    bytes.set(word, byteOffset);
    byteOffset += REQUIRED_WORD_SIZE_BYTES;
  }
  return bytes;
};

const verifyExactContent = (bytes: Uint8Array): void => {
  if (
    bytes.byteLength !== WEIGHT_RAW_SIZE_BYTES ||
    createHash("sha256").update(bytes).digest("hex") !== WEIGHT_RAW_SHA256
  )
    throw new Error("spherical_v2_smearing_weight_materializer_content");
};

if (
  !Object.isFrozen(REQUIRED_BINDING_LITERALS) ||
  Object.values(REQUIRED_BINDING_LITERALS).some(
    (binding) => !Object.isFrozen(binding),
  ) ||
  !Object.isFrozen(PHYSICAL_FILE) ||
  !Object.isFrozen(PHYSICAL_FILE.shape) ||
  !Object.isFrozen(PHYSICAL_FILE.componentOrder) ||
  Object.values(RECEIPT.authorityLocks).some((value) => value !== false) ||
  RECEIPT.dependencyObservationBoundary
    .liveDependencyModuleObservationPerformed !== false ||
  RECEIPT.dependencyObservationBoundary.liveDependencyBindingMatchClaimed !==
    false ||
  RECEIPT.dependencyObservationBoundary.dependencyIdentityAuthority !== false ||
  RECEIPT.completeness.absentNonconstraintRoles.length !== 4 ||
  RECEIPT.completeness.allFiveNonconstraintFilesPresent !== false ||
  RECEIPT.completeness.exact68PhysicalFileInventoryPresent !== false ||
  !RECEIPT.blockers.includes("live_dependency_module_observation_not_performed")
)
  throw new Error("spherical_v2_smearing_weight_materializer_authority_drift");

/**
 * Returns the frozen ordinal-4 content as fresh in-memory bytes.
 *
 * The production module carries literal dependency identities but deliberately
 * does not import or observe their live modules. This zero-input boundary
 * neither observes nor persists scientific output and cannot issue a manifest,
 * preexecution seal, execution claim, or replay claim.
 */
export function materializeNhm2SphericalBosonStarV2SmearingWeightBytes(): Nhm2SphericalBosonStarV2SmearingWeightByteMaterializationV1 {
  const bytes = materializeLiteralWeightBytes();
  verifyExactContent(bytes);
  return Object.freeze({ bytes, receipt: RECEIPT });
}
