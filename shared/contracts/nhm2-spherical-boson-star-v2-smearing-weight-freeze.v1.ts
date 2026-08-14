import { createHash } from "node:crypto";

import { NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING } from "./nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
} from "./nhm2-spherical-boson-star-v2-raw-replay-schema.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_ARTIFACT_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_smearing_weight_freeze" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_spherical_boson_star_smearing_weight_freeze/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_VALUE =
  0.015625 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_COUNT = 64 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256 =
  "25493ecc62734a68fad443881a595d122cb7a93ddf9d07e5ec2060baf84f03fd" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES =
  512 as const;

const REQUIRED_BINDINGS = Object.freeze({
  sourceCandidatePlan: Object.freeze({
    sha256: "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
    canonicalSizeBytes: 93_214,
  }),
  v2CandidateFreeze: Object.freeze({
    sha256: "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    canonicalSizeBytes: 55_997,
  }),
  rawReplaySchema: Object.freeze({
    sha256: "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff",
    canonicalSizeBytes: 163_818,
  }),
} as const);

const WEIGHT_DESCRIPTOR =
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS.find(
    (entry) => entry.role === "smearing_weights",
  );

if (WEIGHT_DESCRIPTOR == null)
  throw new Error("spherical_v2_smearing_weight_descriptor_missing");

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CONTRACT_VERSION,
  phase: "preexecution_candidate_specific_exact_output_content_freeze",
  candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  exactBindings: {
    sourceCandidatePlan:
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
    v2CandidateFreeze: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    rawReplaySchema: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
  },
  correction: {
    priorSurface:
      "nonnegative_weights_with_sum_within_tolerance_of_one_but_no_candidate_bound_bits",
    defect:
      "producer_selected_weights_rescale_the_640_by_640_covariance_basis_and_smeared_mean_denominator_and_are_therefore_a_gate_tuning_lever",
    disposition:
      "this_additive_candidate_bound_freeze_supersedes_only_that_unfixed_content_degree_of_freedom",
    rawSchemaShapeOrFileOrderChanged: false,
    approvedReplayToleranceChanged: false,
    smearingBumpDefinitionChanged: false,
  },
  semanticDistinction: {
    perProbeSpacetimeBump:
      "each_of_the_64_C_infinity_product_bumps_is_individually_normalized_against_sqrt_minus_g_d4x",
    replayAggregationWeights:
      "a_separate_discrete_measure_over_the_64_preregistered_probe_labels",
    bumpQuadratureWeightsMayReplaceReplayAggregationWeights: false,
    replayAggregationWeightsMayRetuneTheBumpNormalization: false,
  },
  exactDiscreteMeasure: {
    rationale:
      "a_preexecution_discrete_uniform_measure_is_preregistered_over_all_64_labels_as_a_definitional_equal_cell_convention_not_inferred_from_observed_science_or_from_symmetry_alone",
    radiusSquaredOrbits: Object.freeze([
      Object.freeze({ radiusSquared: "3/64", sampleCount: 8 }),
      Object.freeze({ radiusSquared: "11/64", sampleCount: 24 }),
      Object.freeze({ radiusSquared: "19/64", sampleCount: 24 }),
      Object.freeze({ radiusSquared: "27/64", sampleCount: 8 }),
    ]),
    signedPermutationSymmetryAloneForcesEqualWeightsAcrossRadiusOrbits: false,
    equalWeightAcrossRadiusOrbitsIsAnExplicitFrozenChoice: true,
    rule: "w_p=1/64=2^-6_for_every_sample_ordinal_p_from_0_through_63",
    observedScienceMayChooseOrChangeWeights: false,
    valueIsExactlyRepresentableInBinary64: true,
    weightExact: "1/64",
    weightBinary64HexBigEndian: "3f90000000000000",
    weightF64LeWordHex: "000000000000903f",
    sampleOrder: "candidate_sampling_ordinal_0_to_63",
    values: Object.freeze(
      Array.from(
        { length: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_COUNT },
        () => NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_VALUE,
      ),
    ),
    exactMathematicalSum: "64*(1/64)=1",
    binary64SummationOrderIndependent: true,
  },
  physicalFileBinding: {
    fileOrdinal: WEIGHT_DESCRIPTOR.fileOrdinal,
    role: WEIGHT_DESCRIPTOR.role,
    path: WEIGHT_DESCRIPTOR.path,
    shape: WEIGHT_DESCRIPTOR.shape,
    componentOrder: WEIGHT_DESCRIPTOR.componentOrder,
    sampleOrder: WEIGHT_DESCRIPTOR.sampleOrder,
    unit: WEIGHT_DESCRIPTOR.unit,
    sizeBytes: WEIGHT_DESCRIPTOR.sizeBytes,
    dtype: WEIGHT_DESCRIPTOR.dtype,
    binaryEncoding: WEIGHT_DESCRIPTOR.binaryEncoding,
    endianness: WEIGHT_DESCRIPTOR.endianness,
    storageOrder: WEIGHT_DESCRIPTOR.storageOrder,
    mediaType: WEIGHT_DESCRIPTOR.mediaType,
    finiteValuesRequired: WEIGHT_DESCRIPTOR.finiteValuesRequired,
    negativeZeroAllowed: WEIGHT_DESCRIPTOR.negativeZeroAllowed,
    exactRawSha256: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
    exactRawSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
    byteConstruction:
      "concatenate_64_copies_of_the_exact_8_byte_word_000000000000903f",
  },
  producerDuty: {
    computeWeightsFromObservedMeanNoiseConstraintsOrErrors: false,
    acceptCallerSuppliedWeightValues: false,
    writeOrCopyExactlyTheFrozen512Bytes: true,
    postwriteSecureReadbackAndExactSha256Required: true,
    manifestEntrySha256MustEqualExactRawSha256: true,
    mismatchDisposition: "fail_this_v2_candidate_without_retuning",
  },
  replayDuty: {
    exactFileSha256CheckBeforeFloatDecode: true,
    exactDecodedLength: 64,
    everyDecodedElementMustHaveBinary64Bits: "3f90000000000000",
    nonnegativeAndSumToleranceChecksRemainDefenseInDepth: true,
    exactBitsFailurePrecedesSmearingNormalizationFailure: true,
    primaryAndIndependentMustPerformTheExactBitsCheck: true,
    pairAgreementMustBindTheExactSameFileSha256: true,
  },
  integrationBoundary: {
    currentRawSchemaAlreadyHasCompatibleOrdinalPathShapeAndEncoding: true,
    currentRawSchemaDoesNotEnforceThisExactContentHash: true,
    rawSchemaExactContentIntegrationComplete: false,
    currentServerRawAdmissionChecksExactHashBeforeFloatDecode: true,
    currentPrimaryReplayEnforcesExactHashThenDecodedBitsThenNormalization: true,
    currentIndependentReplayEnforcesExactHashThenDecodedBitsThenNormalization: true,
    currentPrimaryAndIndependentDecodedBitChecksPresent: true,
    currentPrimaryNormalizedThirtyOutcomeProjectionPresent: true,
    currentIndependentNormalizedThirtyOutcomeProjectionPresent: true,
    currentPairAgreementBindsBothLaneHashesToThisExactValue: true,
    currentPairAgreementBindsBothThirtyOutcomeProjections: true,
    replayAndPairExactContentIntegrationComplete: true,
    integrationComplete: false,
  },
  blockers: Object.freeze([
    "raw_schema_exact_smearing_weight_content_binding_not_integrated",
    "candidate_manifest_and_scientific_preseal_absent",
    "execution_and_output_bytes_absent",
  ]),
  authorityLocks: {
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
  },
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>))
    deepFreeze(child, seen);
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2SmearingWeightFreezeV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE;

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0))
      throw new TypeError("smearing_weight_freeze_noncanonical_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  if (value == null || typeof value !== "object")
    throw new TypeError("smearing_weight_freeze_non_json_value");
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")),
    )
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-smearing-weight-freeze/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE);
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_EXPECTED_SHA256 =
  "4cff97a0c1220dbef8c0df29e500d4c80d88320c97f8d16529c9e98ac290a446" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_EXPECTED_CANONICAL_SIZE_BYTES =
  6_764 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const exactBinding = (
  observed: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
  expected: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
) =>
  observed.sha256 === expected.sha256 &&
  observed.canonicalSizeBytes === expected.canonicalSizeBytes;

const rawBytes = Buffer.alloc(
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SIZE_BYTES,
);
for (
  let index = 0;
  index < NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_COUNT;
  index += 1
)
  rawBytes.writeDoubleLE(
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_VALUE,
    index * 8,
  );

if (
  !exactBinding(
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
    REQUIRED_BINDINGS.sourceCandidatePlan,
  ) ||
  !exactBinding(
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    REQUIRED_BINDINGS.v2CandidateFreeze,
  ) ||
  !exactBinding(
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    REQUIRED_BINDINGS.rawReplaySchema,
  ) ||
  WEIGHT_DESCRIPTOR.fileOrdinal !== 4 ||
  WEIGHT_DESCRIPTOR.path !==
    "{outputDirectory}/fixed/04-smearing_weights.f64le" ||
  createHash("sha256").update(rawBytes).digest("hex") !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256 ||
  CONTRACT.exactDiscreteMeasure.values.length !== 64 ||
  CONTRACT.exactDiscreteMeasure.values.some(
    (value) => value !== NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_VALUE,
  ) ||
  CONTRACT.integrationBoundary.rawSchemaExactContentIntegrationComplete !==
    false ||
  CONTRACT.integrationBoundary.replayAndPairExactContentIntegrationComplete !==
    true ||
  CONTRACT.integrationBoundary.integrationComplete !== false ||
  new Set<string>(CONTRACT.blockers).has(
    "pair_agreement_exact_smearing_weight_outcome_not_integrated",
  ) ||
  Object.values(CONTRACT.authorityLocks).some((value) => value !== false)
)
  throw new Error("spherical_v2_smearing_weight_freeze_invariant");

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_EXPECTED_CANONICAL_SIZE_BYTES
)
  throw new Error("spherical_v2_smearing_weight_freeze_literal_seal_mismatch");

export const nhm2SphericalBosonStarV2SmearingWeightFreezeViolations = (
  value: unknown,
): string[] =>
  value === NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE
    ? []
    : ["spherical_v2_smearing_weight_freeze_identity_required"];

export const isNhm2SphericalBosonStarV2SmearingWeightFreezeV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2SmearingWeightFreezeV1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE;
