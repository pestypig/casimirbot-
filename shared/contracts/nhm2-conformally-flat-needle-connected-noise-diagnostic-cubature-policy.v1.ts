import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-connected-noise-smearing-fourier.v1";
import {
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-connected-noise-two-particle-symbol.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_BLOCK_DIAGNOSTIC_SCHEMA_VERSION } from "../../server/services/theory/nhm2-conformally-flat-needle-connected-noise-spectral-block-diagnostic";
import {
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseSpectralMomentMapJson,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR,
} from "../../server/services/theory/nhm2-conformally-flat-needle-connected-noise-spectral-moment-map";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_connected_noise_diagnostic_cubature_policy" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_diagnostic_cubature_policy/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SHA256 =
  "5ce5b293559b42b26a1c71dff782aebe5b4daf88ddfcdec131101a3fc4fee57a" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SIZE_BYTES =
  18025 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SHA256 =
  "e05e74621a1616fd7d37150f71e98632005938d42f285e30a83e760a5f1d6faf" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SIZE_BYTES =
  12107 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_EXPECTED_SCHEMA_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_spectral_block_diagnostic/v1" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_SOURCE_EXPECTED_SHA256 =
  "d2ce9b262eca4c9006625a9e0565e89745bfdb7cacce2dc2a01db371edbcf113" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_SOURCE_EXPECTED_SIZE_BYTES =
  33398 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SHA256 =
  "4a09a273d759851979b6b7ef7a1f381d19dec82474e4fc5088cbdf87ac086fff" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SIZE_BYTES =
  7738 as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_connected_noise_diagnostic_cubature_worker_policy" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SCHEMA_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_diagnostic_cubature_worker_policy/v1" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CONTENT_EXPECTED_SHA256 =
  "796907c4c0a82b464ba1cd311b0ebfaef91df029c68413122007a95464c97eab" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CONTENT_EXPECTED_SIZE_BYTES =
  18325 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_EXPECTED_SHA256 =
  "a07fa41375f2cdb00340d5eaef1fbd9fa1a9d573520a55ad13c7ff737270212f" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_EXPECTED_SIZE_BYTES =
  18704 as const;

// Literal drift pins remain outside the canonical bytes and change only in an
// audited contract revision.
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTENT_EXPECTED_SHA256 =
  "62383bd24eaecba785a1bbe3b27f2a786ddb3aa90026b3ed60834c5ccf9078aa" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTENT_EXPECTED_SIZE_BYTES =
  22022 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_EXPECTED_SHA256 =
  "84ecd8e8755bc79d2fb482ffe4d4df4fe4c63dfd651169643c4b31e37475d199" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_EXPECTED_SIZE_BYTES =
  22389 as const;

const CANONICALIZATION = "utf8_lexicographic_object_keys_json_v1" as const;

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new TypeError(
        "Canonical JSON requires finite, non-negative-zero numbers.",
      );
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (
    value == null ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError("Canonical JSON requires plain JSON objects.");
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const canonicalBinding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return Object.freeze({
    canonicalization: CANONICALIZATION,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  });
};

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

const exactCanonicalBinding = (
  label: string,
  value: unknown,
  canonicalizer: (entry: unknown) => string,
  expectedSha256: string,
  expectedSizeBytes: number,
  reportedSha256: string,
  reportedSizeBytes: number,
): void => {
  const bytes = Buffer.from(canonicalizer(value), "utf8");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (
    sha256 !== expectedSha256 ||
    bytes.byteLength !== expectedSizeBytes ||
    reportedSha256 !== expectedSha256 ||
    reportedSizeBytes !== expectedSizeBytes
  ) {
    throw new Error(
      `nhm2_connected_noise_diagnostic_cubature_policy_${label}_literal_pin_mismatch`,
    );
  }
};

exactCanonicalBinding(
  "two_particle_symbol",
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
);
exactCanonicalBinding(
  "smearing_fourier",
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER,
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES,
);

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_BLOCK_DIAGNOSTIC_SCHEMA_VERSION !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_EXPECTED_SCHEMA_VERSION ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content
    .executionAdmissible !== false ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content
      .authority.locks,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content
      .claimLocks,
  ).some((value) => value !== false)
) {
  throw new Error(
    "nhm2_connected_noise_diagnostic_cubature_policy_upstream_schema_or_blocked_state_drift",
  );
}

const momentMapCanonicalBytes = Buffer.from(
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseSpectralMomentMapJson(),
  "utf8",
);
if (
  createHash("sha256").update(momentMapCanonicalBytes).digest("hex") !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SHA256 ||
  momentMapCanonicalBytes.byteLength !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR.commonDenominator !==
    6 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR
    .numeratorRows.length !== 100 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR
    .monomialExponents.length !== 22
) {
  throw new Error(
    "nhm2_connected_noise_diagnostic_cubature_policy_moment_map_literal_pin_or_shape_mismatch",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_INHERITED_BLOCKERS =
  Object.freeze([
    ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_ADDED_BLOCKERS =
  Object.freeze([
    "cubature_primary_source_receipt_not_bound",
    "q_evaluator_source_and_formula_equivalence_not_proved",
    "q0_enclosure_not_frozen",
    "cp_enclosures_not_frozen",
    "d12_enclosure_not_frozen",
    "k0_analytic_moment_equivalence_not_proved",
    "tensor_to_22_exact_moments_equivalence_not_proved",
    "signed_to_absolute_displacement_reduction_equivalence_not_proved",
    "absolute_to_yz_canonical_reduction_equivalence_not_proved",
    "normalization_orbit_reduction_equivalence_not_proved",
    "sobol_direction_number_source_bytes_not_verified",
    "inverse_q_squared_cdf_enclosure_not_frozen",
    "q_cdf_table_discretization_convergence_not_certified",
    "gauss_legendre_runtime_source_not_bound",
    "compact_core_cutoff_adequacy_not_certified",
    "compact_core_interval_enclosure_not_frozen",
    "tail_formula_not_frozen_or_certified",
    "tail_enclosure_not_frozen",
    "central_refinement_cutoff_joint_enclosure_not_frozen",
    "simultaneous_u95_construction_not_frozen",
    "full_array_emitter_not_implemented",
    "raw_output_atomic_writer_not_implemented",
    "runtime_binary_and_dependency_hash_manifest_not_observed",
    "runtime_resource_caps_not_observed",
    "primary_executor_lineage_not_observed",
    "independent_executor_lineage_not_observed",
    "independent_algorithm_not_frozen",
    "execution_contract_absent",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_BLOCKERS =
  Object.freeze([
    ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_INHERITED_BLOCKERS,
    ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_ADDED_BLOCKERS,
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_AUTHORITY_LOCKS =
  Object.freeze({
    primarySourceByteAuthority: false as const,
    qEvaluatorAuthority: false as const,
    q0Authority: false as const,
    sampleNormalizationCpAuthority: false as const,
    d12Authority: false as const,
    reductionEquivalenceAuthority: false as const,
    cubatureAuthority: false as const,
    compactCoreAuthority: false as const,
    tailAuthority: false as const,
    numericalEnclosureAuthority: false as const,
    simultaneousU95Authority: false as const,
    runtimeAuthority: false as const,
    independentLineageAuthority: false as const,
    fixedBackgroundRunAuthority: false as const,
    executionAuthority: false as const,
    replayAuthority: false as const,
    agreementAuthority: false as const,
    lampAuthority: false as const,
    constraintAuthority: false as const,
    admConstraintAuthority: false as const,
    bracketAuthority: false as const,
    physicalClaimAuthority: false as const,
    propulsionAuthority: false as const,
    transportAuthority: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CLAIM_LOCKS =
  Object.freeze({
    sourceBytesBound: false as const,
    qFormulaEquivalent: false as const,
    q0Certified: false as const,
    sampleNormalizationCpCertified: false as const,
    d12Certified: false as const,
    reductionEquivalenceProved: false as const,
    coreEnclosed: false as const,
    tailEnclosed: false as const,
    deterministicErrorCertified: false as const,
    simultaneousU95Certified: false as const,
    fullArrayProduced: false as const,
    primaryExecutionPass: false as const,
    independentExecutionPass: false as const,
    independentAgreementPass: false as const,
    replayPass: false as const,
    connectedNoiseDiagnosticPass: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    admConstraintClosure: false as const,
    bracketClosure: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateEligibility: false as const,
    certificateIssued: false as const,
  });

const upstreamBinding = (
  artifactId: string,
  contractVersion: string,
  canonicalSha256: string,
  canonicalSizeBytes: number,
  role: string,
) => ({
  artifactId,
  contractVersion,
  canonicalSha256,
  canonicalSizeBytes,
  canonicalization: CANONICALIZATION,
  exactIdentityVerifiedAtModuleInitialization: true,
  semanticSubstitutionAllowed: false,
  role,
});

const SAMPLE_X_CENTER_MICROMETERS = Object.freeze([
  -125000, -50000, 50000, 125000,
] as const);
const SAMPLE_YZ_CENTER_MICROMETERS = Object.freeze([
  -25000, -10000, 10000, 25000,
] as const);
const SAMPLE_CENTERS_MICROMETERS = Object.freeze(
  SAMPLE_YZ_CENTER_MICROMETERS.flatMap((z) =>
    SAMPLE_YZ_CENTER_MICROMETERS.flatMap((y) =>
      SAMPLE_X_CENTER_MICROMETERS.map((x) => Object.freeze([x, y, z] as const)),
    ),
  ),
);
const ABSOLUTE_X_DISPLACEMENTS_MICROMETERS = Object.freeze([
  0, 75000, 100000, 175000, 250000,
] as const);
const ABSOLUTE_YZ_DISPLACEMENTS_MICROMETERS = Object.freeze([
  0, 15000, 20000, 35000, 50000,
] as const);
const CANONICAL_DISPLACEMENTS_MICROMETERS = Object.freeze(
  ABSOLUTE_X_DISPLACEMENTS_MICROMETERS.flatMap((x) =>
    ABSOLUTE_YZ_DISPLACEMENTS_MICROMETERS.flatMap((y, yOrdinal) =>
      ABSOLUTE_YZ_DISPLACEMENTS_MICROMETERS.slice(yOrdinal).map((z) =>
        Object.freeze([x, y, z] as const),
      ),
    ),
  ),
);
const NORMALIZATION_ORBIT_REPRESENTATIVES_MICROMETERS = Object.freeze(
  [50000, 125000].flatMap((x) =>
    [10000, 25000].flatMap((y, yOrdinal, yz) =>
      yz.slice(yOrdinal).map((z) => Object.freeze([x, y, z] as const)),
    ),
  ),
);
const normalizationOrbitOrdinal = (
  center: readonly [number, number, number],
): number => {
  const canonical = [
    Math.abs(center[0]),
    ...[Math.abs(center[1]), Math.abs(center[2])].sort(
      (left, right) => left - right,
    ),
  ];
  const ordinal = NORMALIZATION_ORBIT_REPRESENTATIVES_MICROMETERS.findIndex(
    (entry) => entry.every((value, index) => value === canonical[index]),
  );
  if (ordinal < 0) {
    throw new Error(
      "nhm2_connected_noise_diagnostic_cubature_policy_normalization_orbit_mapping_incomplete",
    );
  }
  return ordinal;
};
const NORMALIZATION_ORBIT_ORDINAL_BY_SAMPLE = Object.freeze(
  SAMPLE_CENTERS_MICROMETERS.map(normalizationOrbitOrdinal),
);

if (
  SAMPLE_CENTERS_MICROMETERS.length !== 64 ||
  CANONICAL_DISPLACEMENTS_MICROMETERS.length !== 75 ||
  NORMALIZATION_ORBIT_REPRESENTATIVES_MICROMETERS.length !== 6 ||
  NORMALIZATION_ORBIT_ORDINAL_BY_SAMPLE.length !== 64
) {
  throw new Error(
    "nhm2_connected_noise_diagnostic_cubature_policy_finite_enumeration_count_drift",
  );
}

const EXACT_MOMENT_EXPONENT_TRIPLES = Object.freeze([
  "0,0,0",
  "2,0,0",
  "1,1,0",
  "1,0,1",
  "0,2,0",
  "0,1,1",
  "0,0,2",
  "4,0,0",
  "3,1,0",
  "3,0,1",
  "2,2,0",
  "2,1,1",
  "2,0,2",
  "1,3,0",
  "1,2,1",
  "1,1,2",
  "1,0,3",
  "0,4,0",
  "0,3,1",
  "0,2,2",
  "0,1,3",
  "0,0,4",
] as const);

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR.monomialExponents.some(
    (entry, index) =>
      entry.slice(1).join(",") !== EXACT_MOMENT_EXPONENT_TRIPLES[index],
  )
) {
  throw new Error(
    "nhm2_connected_noise_diagnostic_cubature_policy_moment_order_mismatch",
  );
}

const WORKER_POLICY_CONTENT = {
  diagnosticWorkerImplementationInputsFrozen: true,
  authoritativeExecutionReady: false,
  inputBoundary: {
    acceptedCallerConfigurationKeys: [],
    acceptsNumericArguments: false,
    acceptsUserArguments: false,
    acceptsEnvironmentOverrides: false,
    acceptsCommandLineOverrides: false,
    acceptsToleranceOverrides: false,
    acceptsWorkOverrides: false,
    acceptsAuthorityOverrides: false,
    contractOwnedValuesOnly: true,
  },
  prefixesAndBatching: {
    sequence: "unscrambled_nested_base_2_sobol_3d",
    sequenceIndexOrigin: 0,
    coarsePointCount: 131072,
    finePointCount: 262144,
    batchPointCount: 4096,
    maximumBatchCount: 64,
    coarseIsExactInitialPrefixOfFine: true,
  },
  geometryAndScatter: {
    coordinateUnit: "micrometer_integer",
    micrometersPerMeter: 1000000,
    halfWidthsM: [0.002, 0.01, 0.002, 0.002],
    exactHalfWidthsM: ["2/1000", "1/100", "2/1000", "2/1000"],
    halfWidthOrder: ["a0", "ax", "ay", "az"],
    exactVolumeM4: "8/100000000000",
    volumeM4: 8e-11,
    xCenterAxisMicrometers: SAMPLE_X_CENTER_MICROMETERS,
    yCenterAxisMicrometers: SAMPLE_YZ_CENTER_MICROMETERS,
    zCenterAxisMicrometers: SAMPLE_YZ_CENTER_MICROMETERS,
    sampleOrdinalIdentity: "p=16*i_z+4*i_y+i_x",
    sampleEnumerationOrder: ["z_outer", "y_middle", "x_inner"],
    sampleCentersXYZMicrometersInOrdinalOrder: SAMPLE_CENTERS_MICROMETERS,
    displacementIdentity:
      "Delta_xyz_micrometers=left_sample_center_minus_right_sample_center",
    absoluteXDisplacementsMicrometers: ABSOLUTE_X_DISPLACEMENTS_MICROMETERS,
    absoluteYZDisplacementsMicrometers: ABSOLUTE_YZ_DISPLACEMENTS_MICROMETERS,
    canonicalDisplacementIdentity:
      "[abs(Delta_x),min(abs(Delta_y),abs(Delta_z)),max(abs(Delta_y),abs(Delta_z))]",
    canonicalDisplacementEnumerationOrder: [
      "absolute_x_outer",
      "absolute_y_middle_ascending",
      "absolute_z_inner_ascending_from_y",
    ],
    canonicalDisplacementsXYZMicrometersInOrdinalOrder:
      CANONICAL_DISPLACEMENTS_MICROMETERS,
    canonicalDisplacementCount: 75,
    zeroReflectionSign: 1,
    reflectionSignIdentity:
      "sign_j=minus_1_when_Delta_j_less_than_0_else_plus_1",
    yzSwapIdentity: "yzSwap=true_exactly_when_abs(Delta_y)>abs(Delta_z)",
    normalizationOrbitRepresentativeEnumerationOrder: [
      "absolute_x_outer_ascending",
      "absolute_y_middle_ascending",
      "absolute_z_inner_ascending_from_y",
    ],
    normalizationOrbitRepresentativesXYZMicrometers:
      NORMALIZATION_ORBIT_REPRESENTATIVES_MICROMETERS,
    normalizationOrbitOrdinalBySampleOrdinal:
      NORMALIZATION_ORBIT_ORDINAL_BY_SAMPLE,
    normalizationOrbitExpansionIdentity:
      "C_p=C_orbit[normalizationOrbitOrdinalBySampleOrdinal[p]]",
    samplePairReconstruction: {
      pairEnumerationOrder: [
        "left_sample_ordinal_0_through_63_outer",
        "right_sample_ordinal_0_through_63_middle",
        "target_component_pair_ordinal_0_through_99_inner",
      ],
      deltaIdentity:
        "Delta_j_micrometers=left_center_j_micrometers-right_center_j_micrometers",
      signIdentity: "sign_j=minus_1_if_Delta_j_less_than_0_else_plus_1",
      yzSwapIdentity: "yzSwap=abs(Delta_y)>abs(Delta_z)",
      canonicalLookupIdentity:
        "find_exact_ordinal_of_[abs(Delta_x),min(abs(Delta_y),abs(Delta_z)),max(abs(Delta_y),abs(Delta_z))]",
      baseComponentPairOrdinalIdentity:
        "yzSwap?momentDescriptor.yzExchangeComponentPairOrdinals[targetComponentPairOrdinal]:targetComponentPairOrdinal",
      reflectionMultiplierIdentity:
        "product_axis(Delta_axis<0?momentDescriptor.pairReflectionSignatures[targetComponentPairOrdinal][axis]:1)",
      orientedValueIdentity:
        "reflectionMultiplier*canonicalBlock[canonicalDisplacementOrdinal][baseComponentPairOrdinal]",
      sampleNormalizationMultiplierIdentity: "C_left*C_right",
      missingCanonicalLookupDisposition: "abort_without_output",
    },
    componentReflectionSignaturesDelegatedToMomentDescriptorField:
      "pairReflectionSignatures",
    yzComponentPermutationDelegatedToMomentDescriptorField:
      "yzExchangeComponentPairOrdinals",
    yzMonomialPermutationDelegatedToMomentDescriptorField:
      "yzExchangeMonomialOrdinals",
    componentPairExchangeDelegatedToMomentDescriptorField:
      "exchangeComponentPairOrdinals",
    fullArrayFlattening:
      "left_sample_outer_right_sample_middle_component_pair_inner_row_major",
    fullArrayFlatIndexIdentity:
      "((leftSampleOrdinal*64+rightSampleOrdinal)*100)+componentPairOrdinal",
  },
  diagnosticNumerics: {
    arithmetic: "ieee754_binary64",
    canonicalFiniteOutputRequired: true,
    negativeZeroCanonicalizedToPositiveZero: true,
    qEvaluator: {
      exactBumpIdentity:
        "q(u)=exp(-u^2/(1-u^2)) for abs(u)<1 and q(u)=0 otherwise",
      qIdentity: "Q(z)=2*integral_0^1_du*q(u)*cos(z*u)",
      quadratureFamily: "gauss_legendre",
      quadratureOrder: 256,
      mappedInterval: [0, 1],
      nodeOrder: "ascending",
      summationOrder: "ascending_node_index_naive_binary64",
      rowBatchPointCount: 1024,
      libraryRoutine: "numpy.polynomial.legendre.leggauss",
      dependencyVersionMustBeRuntimePinned: true,
      deterministicEnclosure: null,
    },
    qSquaredTable: {
      variable: "z_dimensionless",
      lowerInclusive: 0,
      upperInclusive: 256,
      intervalCount: 65536,
      pointCount: 65537,
      exactStep: "1/256",
      binary64Step: 0.00390625,
      pointIdentity: "z_i=i/256 for integer i in [0,65536]",
      storedColumns: ["z", "Q(z)", "Q(z)^2"],
    },
    truncatedCdfAndInverse: {
      cdfIdentity: "F_Q^256(u)=integral_0^u_dv*Q(v)^2/integral_0^256_dv*Q(v)^2",
      implementedDensitySurrogate:
        "on_[z_i,z_(i+1))_q2_density_is_constant_(Q(z_i)^2+Q(z_(i+1))^2)/2",
      cdfIsExactIntegralOfImplementedDensitySurrogate: true,
      implementedDensitySurrogateEqualsContinuousQSquaredClaimed: false,
      accumulationRule: "composite_trapezoid_left_to_right_binary64",
      accumulationRoutine: "numpy.cumsum_dtype_float64",
      inverseSearch:
        "smallest_table_index_with_cdf_greater_than_or_equal_target",
      inverseInterpolation: "piecewise_linear_in_cdf",
      plateauTieBreak: "leftmost_table_coordinate",
      zeroTargetResult: 0,
      usedAsInfiniteDomainCdf: false,
      omittedSpatialTailEnclosed: false,
    },
    sampleNormalizationCp: {
      q0Computation: "same_Q_evaluator_at_z_equals_0",
      spatialQuadratureFamily: "tensor_product_gauss_legendre",
      spatialQuadratureOrderPerAxis: 32,
      mappedAxisInterval: [-1, 1],
      normalizationOrbitCount: 6,
      sIdentity:
        "S_p=integral_[-1,1]^3_du_x_du_y_du_z*q(u_x)*q(u_y)*q(u_z)*Omega(X_p+ax*u_x,Y_p+ay*u_y,Z_p+az*u_z)^4",
      cpIdentity: "C_p=1/(V*Q0*S_p)",
      volumeM4: 8e-11,
      orbitExpansionOrder: "sample_ordinal_0_through_63",
      conformalGeometry: {
        ellipsoidAxesM: [0.25, 0.05, 0.05],
        sIdentity: "s=(X/0.25)^2+(Y/0.05)^2+(Z/0.05)^2",
        compactBumpIdentity:
          "b(s)=exp(-s/(1-s)) for 0<=s<1 and b(s)=0 for s>=1",
        omegaIdentity: "Omega=1+1e-6*b(s)",
        conformalAmplitude: 0.000001,
        physicalPointIdentity:
          "[X,Y,Z]=sample_center_xyz_m+[ax*u_x,ay*u_y,az*u_z]",
      },
      tensorProductTraversalOrder: [
        "u_x_node_ordinal_0_through_31_outer",
        "u_y_node_ordinal_0_through_31_middle",
        "u_z_node_ordinal_0_through_31_inner",
      ],
      summationOrder:
        "left_to_right_scalar_binary64_accumulator_in_frozen_tensor_product_traversal_order",
      deterministicEnclosure: null,
    },
    k0DimensionReduction: {
      a0M: 0.002,
      primaryUpperCutoffDimensionless: 128,
      comparisonUpperCutoffDimensionless: 256,
      primaryUpperCutoffMInverse: 64000,
      comparisonUpperCutoffMInverse: 128000,
      retainedK0Powers: [0, 2, 4],
      exactScalingIdentity:
        "integral_r^T_dK0*K0^m*Q(a0*K0)^2=a0^(-(m+1))*integral_(a0*r)^(a0*T)_dt*t^m*Q(t)^2",
      tableGrid: "same_z_i_equals_i_over_256_grid",
      accumulationRule:
        "composite_trapezoid_prefix_tables_left_to_right_binary64",
      accumulationRoutine:
        "numpy.cumsum_dtype_float64_for_each_power_in_[0,2,4]_order",
      lowerLimitInterpolation: "piecewise_linear_in_each_prefix_integral",
      lowerAtOrAboveCutoffResult: 0,
      primaryAndComparisonAccumulatedInSamePointVisit: true,
      cutoffAdequacyCertified: false,
      deterministicEnclosure: null,
    },
    positiveOctantReconstruction: {
      signOrder: ["---", "--+", "-+-", "-++", "+--", "+-+", "++-", "+++"],
      phaseWeightIdentity:
        "sum_sigma_in_{minus_1,plus_1}^3 product_j(sigma_j^alpha_j)*cos(sum_j sigma_j*K_j*Delta_j)",
      signSumEvaluatedInFrozenOrder: true,
      octantEquivalenceCertified: false,
      parityClassMomentOrdinals: {
        evenEvenEven: [0, 1, 4, 6, 7, 10, 12, 17, 19, 21],
        oddOddEven: [2, 8, 13, 15],
        oddEvenOdd: [3, 9, 14, 16],
        evenOddOdd: [5, 11, 18, 20],
      },
      factorizedBinary64PhaseIdentities: {
        evenEvenEven: "8*cos(A)*cos(B)*cos(C)",
        oddOddEven: "-8*sin(A)*sin(B)*cos(C)",
        oddEvenOdd: "-8*sin(A)*cos(B)*sin(C)",
        evenOddOdd: "-8*cos(A)*sin(B)*sin(C)",
      },
      angleIdentities: [
        "A=(u_x/ax)*Delta_x",
        "B=(u_y/ay)*Delta_y",
        "C=(u_z/az)*Delta_z",
      ],
      binary64EvaluationOrder:
        "numpy_ufunc_each_axis_then_left_associative_numpy_multiply_then_exact_integer_scale",
    },
    momentMapBoundary: {
      descriptorSourcePath:
        "server/services/theory/nhm2-conformally-flat-needle-connected-noise-spectral-moment-map.ts",
      descriptorExportName:
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR",
      canonicalization: "JSON.stringify_of_frozen_ordered_payload_v1",
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SIZE_BYTES,
      exactLiteralPinMustBeVerifiedByWrapper: true,
      commonDenominator: 6,
      numeratorRowCount: 100,
      momentCountPerRow: 22,
      coefficientMeaning: "parity_projected_s2Pi_abcd_quartic_polynomial_only",
      coefficientIncludesRhoPlusFactor: false,
      coefficientIncludesInverseFourierFactor: false,
      coefficientIncludesHbarCSquared: false,
      coefficientIncludesSmearingFactors: false,
      coefficientIncludesD4KJacobian: false,
    },
    scalarIntegrationAndScatter: {
      connectedKernelIdentity:
        "N_pq,ABCD=(hbar*c)^2/(2*pi)^4*C_p*C_q*V^2*integral_future_cone_d4K*product_mu(Q(a_mu*K_mu)^2)*cos(K_spatial_dot_(X_p-X_q))*s2Pi_ABCD(K)/(480*pi)",
      planckConstantExactJouleSeconds: 6.62607015e-34,
      reducedPlanckConstantBinary64Identity: "hbar=h/(2*pi)",
      reducedPlanckConstantJouleSecondsBinary64: 1.0545718176461565e-34,
      speedOfLightExactMPerS: 299792458,
      hbarC_JouleMetersBinary64: 3.1615267734966903e-26,
      inverseFourierMeasureIdentity: "1/(2*pi)^4",
      inverseFourierMeasureBinary64: 0.0006416238909177711,
      positiveFrequencySpectralFactorIdentity: "1/(480*pi)",
      positiveFrequencySpectralFactorBinary64: 0.0006631455962162307,
      hbarCSquaredTimesInverseFourierBinary64: 6.413192183499182e-55,
      hbarCSquaredTimesInverseFourierAndRhoBinary64: 4.2528801541758355e-58,
      scalarPrefactorIdentity: "((hbar*c)^2/(2*pi)^4)*(C_p*C_q*V^2)/(480*pi)",
      spatialVariableIdentity: "u_j=a_j*abs(K_j)",
      spatialJacobianIdentity: "dKx*dKy*dKz=du_x*du_y*du_z/(ax*ay*az)",
      inverseCdfDensityCancellationIdentity:
        "du_x*du_y*du_z*product_j(q2_table_surrogate(u_j))=Z_Q_table^3*dF_x*dF_y*dF_z",
      truncatedCdfNormalizerSymbol:
        "Z_Q_table=integral_0^256_du*q2_table_surrogate(u)",
      continuousQSquaredReplacedByTableSurrogateInDiagnosticCubature: true,
      tableSurrogateDiscretizationEnclosed: false,
      k0MomentIdentity:
        "for monomial exponents [e0,ex,ey,ez], J_e0^T(r)=integral_r^T_dK0*K0^e0*Q(a0*K0)^2",
      spatialPowerIdentity:
        "Kx^ex*Ky^ey*Kz^ez=(u_x/ax)^ex*(u_y/ay)^ey*(u_z/az)^ez",
      signSumIdentity:
        "sum_sigma product_j(sigma_j^e_j)*cos(sum_j sigma_j*(u_j/a_j)*Delta_j)",
      perMomentMonteCarloSummandIdentity:
        "Z_Q^3/(ax*ay*az)*J_e0^T(r)*product_j((u_j/a_j)^e_j)*sign_sum",
      sobolAverageNormalization:
        "sum_over_prefix_divided_by_prefix_point_count",
      coefficientApplicationIdentity:
        "s2Pi_component_integral=sum_m(numeratorRows[component][m]/6)*momentIntegral[m]",
      rhoFactorAppliedAfterRationalMomentMap: true,
      scatterTargetShape: [64, 64, 100],
      scatterFlatIndexIdentity:
        "((leftSampleOrdinal*64+rightSampleOrdinal)*100)+componentPairOrdinal",
      pairExchangeScatterRequired: true,
      centralUsesFinePrimaryCutoff: true,
      refinementUsesFineMinusCoarseAtPrimaryCutoff: true,
      cutoffUsesFineComparisonMinusFinePrimary: true,
      deterministicEnclosure: null,
    },
    accumulationPrimitive: {
      matrixProductRoutine: "numpy.matmul",
      parityClassOrder: [
        "evenEvenEven",
        "oddOddEven",
        "oddEvenOdd",
        "evenOddOdd",
      ],
      phaseMatrixShapePerClassPerFullBatch: [4096, 75],
      momentContributionColumnCountsByParityClass: [10, 4, 4, 4],
      batchProductIdentity:
        "for_each_parity_class_in_frozen_order_numpy.matmul(phase_class_matrix.T,moment_contribution_class_matrix)",
      combinedBatchProductShape: [75, 22],
      arrayDtype: "numpy.float64",
      arrayMemoryOrder: "C_contiguous",
      pointOrderWithinBatch: "ascending_sobol_index",
      batchOrder: "ascending_batch_index_0_through_63",
      accumulatorUpdate:
        "numpy.add(accumulator,batch_product,out=accumulator) in C index order",
      coarseSnapshotAfterExclusiveBatchOrdinal: 32,
      fineSnapshotAfterExclusiveBatchOrdinal: 64,
      momentMapProductRoutine: "numpy.matmul",
      momentMapProductIdentity:
        "numpy.matmul(moment_integrals,numeratorRows.T)/6",
      threadEnvironmentRequiredBeforeNumpyImport: {
        OPENBLAS_NUM_THREADS: "1",
        MKL_NUM_THREADS: "1",
        OMP_NUM_THREADS: "1",
        VECLIB_MAXIMUM_THREADS: "1",
        NUMEXPR_NUM_THREADS: "1",
      },
      workerProcessCount: 1,
      numpySeterr: "raise",
      fusedMultiplyAddPermission: "runtime_dependent_not_attested",
      byteDeterminismAcrossUnattestedRuntimesClaimed: false,
      deterministicEnclosure: null,
    },
  },
  diagnosticRuntimePolicy: {
    requiredUnattestedVersionTuple: {
      implementation: "CPython",
      pythonVersion: "3.13.7",
      numpyVersion: "2.2.6",
      scipyVersion: "1.16.1",
    },
    tupleStatus: "required_for_diagnostic_reproduction_but_unattested",
    pythonBinarySha256: null,
    numpyDistributionSha256: null,
    scipyDistributionSha256: null,
    dependencyLockfileSha256: null,
    runtimeReceipt: null,
    sobolImplementation:
      "contract_owned_dependency_independent_uint32_gray_code_recurrence",
    scipySobolImplementationAllowed: false,
    numpyRandomImplementationAllowed: false,
    runtimeAuthority: false,
  },
  hardCaps: {
    maximumPointCount: 262144,
    maximumCanonicalDisplacementCount: 75,
    maximumExactMomentCount: 22,
    maximumCutoffEvaluationsPerPointMoment: 2,
    maximumMomentAccumulatorUpdates: 865075200,
    maximumQTablePointCount: 65537,
    maximumQQuadratureNodeApplications: 16777472,
    maximumNormalizationTensorProductNodeApplications: 196608,
    maximumPhaseTrigonometricEvaluations: 117964800,
    maximumParityClassMatrixProductsPerCutoffPerBatch: 4,
    maximumCutoffMatrixProductsPerBatch: 8,
    maximumResidentBytes: 268435456,
    maximumRawBytesPerFullArray: 3276800,
    maximumFullArrayInventoryBytes: 9830400,
    disposition: "abort_without_output",
    partialOutputAllowed: false,
  },
  reductions: {
    signedDisplacementCount: 729,
    absoluteDisplacementCount: 125,
    yzCanonicalDisplacementCount: 75,
    normalizationOrbitCount: 6,
    exactMomentCount: 22,
    exponentTripleOrderKxKyKz: EXACT_MOMENT_EXPONENT_TRIPLES,
    numericalEquivalenceCertified: false,
  },
  outputInventory: [
    {
      id: "central",
      shape: [64, 64, 100],
      elementRepresentation: "ieee754_binary64_little_endian",
      exactByteCount: 3276800,
      status: "diagnostic_binary64_truncated_not_enclosed",
      interpretation: "central_fine_prefix_at_primary_upper_cutoff",
    },
    {
      id: "refinement_observation",
      shape: [64, 64, 100],
      elementRepresentation: "ieee754_binary64_little_endian",
      exactByteCount: 3276800,
      status: "diagnostic_binary64_refinement_observation_not_an_error_bound",
      interpretation:
        "fine_prefix_minus_coarse_prefix_at_same_primary_upper_cutoff",
    },
    {
      id: "cutoff_observation",
      shape: [64, 64, 100],
      elementRepresentation: "ieee754_binary64_little_endian",
      exactByteCount: 3276800,
      status: "diagnostic_binary64_cutoff_observation_not_a_tail_enclosure",
      interpretation:
        "fine_prefix_at_comparison_upper_cutoff_minus_fine_prefix_at_primary_upper_cutoff",
    },
  ],
  unresolvedExecutionInputs: {
    q0Enclosure: null,
    sampleNormalizationCpEnclosures: null,
    runtimeBinaryAndDependencyHashManifest: null,
  },
  outputAuthority: {
    deterministicEnclosure: null,
    simultaneousAbsoluteUncertainty95: null,
    tailEnclosure: null,
    mayFeedFixedBackgroundRun: false,
    executionAuthority: false,
    replayAuthority: false,
    lampAuthority: false,
    constraintAuthority: false,
    physicalClaimAuthority: false,
    propulsionAuthority: false,
    transportAuthority: false,
  },
} as const;

const WORKER_POLICY_CONTENT_BINDING = canonicalBinding(WORKER_POLICY_CONTENT);
if (
  WORKER_POLICY_CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CONTENT_EXPECTED_SHA256 ||
  WORKER_POLICY_CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    `nhm2_connected_noise_diagnostic_cubature_worker_policy_content_literal_pin_mismatch:${WORKER_POLICY_CONTENT_BINDING.sha256}/${WORKER_POLICY_CONTENT_BINDING.sizeBytes}`,
  );
}

const WORKER_POLICY = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_ARTIFACT_ID,
  schemaVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SCHEMA_VERSION,
  contentBinding: WORKER_POLICY_CONTENT_BINDING,
  content: WORKER_POLICY_CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY =
  deepFreeze(WORKER_POLICY);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CANONICAL_JSON =
  canonicalJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY,
  );
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_CANONICAL_JSON,
    "utf8",
  );

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    `nhm2_connected_noise_diagnostic_cubature_worker_policy_literal_pin_mismatch:${NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SHA256}/${NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SIZE_BYTES}`,
  );
}

const CONTENT = {
  maturity: "stage_2_frozen_diagnostic_policy_not_an_enclosure",
  status: "blocked_frozen_diagnostic_cubature_policy_no_emitter",
  executionAdmissible: false,
  scopeBoundary: {
    role: "additive_full_connected_noise_central_diagnostic_policy_only",
    targetCandidateCount: 1,
    sampleCount: 64,
    orderedTetradComponentPairCount: 100,
    fixedBackgroundDiagnosticOnly: true,
    modifiesAnyUpstreamContract: false,
    replacesAnyUpstreamContract: false,
    declaredLeverTensorInputAllowed: false,
    metricDemandSubstitutionAllowed: false,
    constraintOrBracketObservable: false,
    fullSemiclassicalBackreaction: false,
    executionOrReplayAuthorityGranted: false,
    physicalPropulsionOrTransportClaimGranted: false,
  },
  upstreamBindings: {
    twoParticleSymbol: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SYMBOL_EXPECTED_SIZE_BYTES,
      "frozen_exact_two_particle_symbol_and_100_component_order",
    ),
    smearingFourier: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SMEARING_FOURIER_EXPECTED_SIZE_BYTES,
      "frozen_bump_Q_normalization_and_729_signed_displacement_mapping",
    ),
    spectralBlockDiagnostic: {
      schemaVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_EXPECTED_SCHEMA_VERSION,
      implementationSourcePath:
        "server/services/theory/nhm2-conformally-flat-needle-connected-noise-spectral-block-diagnostic.ts",
      implementationSourceSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_SOURCE_EXPECTED_SHA256,
      implementationSourceSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SPECTRAL_BLOCK_SOURCE_EXPECTED_SIZE_BYTES,
      exactSchemaVerifiedAtModuleInitialization: true,
      sourceBytePinVerificationRequired: true,
      sourceBytesVerifiedAtModuleInitialization: false,
      semanticSubstitutionAllowed: false,
      role: "single_strict_future_cone_100_component_block_identity_only",
    },
    spectralMomentMap: {
      schemaVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR.schemaVersion,
      descriptorSourcePath:
        "server/services/theory/nhm2-conformally-flat-needle-connected-noise-spectral-moment-map.ts",
      descriptorExportName:
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR",
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SIZE_BYTES,
      canonicalization: "JSON.stringify_of_frozen_ordered_payload_v1",
      exactIdentityVerifiedAtModuleInitialization: true,
      semanticSubstitutionAllowed: false,
      role: "exact_integer_over_6_parity_projected_s2Pi_map_only",
    },
  },
  immutableConfiguration: {
    contractIsZeroArgumentConstant: true,
    runtimeConfigurationObjectAccepted: false,
    numericOverridesAccepted: false,
    userOverridesAccepted: false,
    environmentOverridesAccepted: false,
    commandLineOverridesAccepted: false,
    toleranceOverridesAccepted: false,
    workOverridesAccepted: false,
    outputShapeOverridesAccepted: false,
    authorityOverridesAccepted: false,
    retuningAfterObservationAllowed: false,
  },
  workerPolicyDescriptorBinding: {
    artifactId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_ARTIFACT_ID,
    schemaVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SCHEMA_VERSION,
    canonicalSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SHA256,
    canonicalSizeBytes:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_WORKER_POLICY_SIZE_BYTES,
    canonicalization: CANONICALIZATION,
    exactIdentityVerifiedAtModuleInitialization: true,
    descriptorDeeplyFrozen: true,
    descriptorJsonSerializable: true,
    callerOverrideSurfacePresent: false,
  },
  rawArrayLayout: {
    sampleAxisCount: 64,
    leftSampleAxisCount: 64,
    rightSampleAxisCount: 64,
    orderedComponentPairAxisCount: 100,
    shape: [64, 64, 100],
    elementRepresentation: "ieee754_binary64_little_endian",
    bytesPerElement: 8,
    elementCount: 409600,
    exactRawByteCount: 3276800,
    flattening:
      "left_sample_outer_right_sample_middle_ordered_component_pair_inner_row_major",
    outputStatus: "diagnostic_binary64_truncated_not_enclosed",
    centralArrayPresentInThisContract: false,
    uncertaintyArrayPresentInThisContract: false,
    rawOutputWriterPresentInThisContract: false,
  },
  structuralReductionPlan: {
    signedDisplacements: {
      axisCardinalities: [9, 9, 9],
      exactTripleCount: 729,
      mechanicalCardinalityIdentity: "9*9*9=729",
    },
    absoluteDisplacements: {
      axisCardinalities: [5, 5, 5],
      exactTripleCount: 125,
      mechanicalCardinalityIdentity: "5*5*5=125",
      signedToAbsoluteNumericalEquivalenceCertified: false,
    },
    yzCanonicalDisplacements: {
      absoluteXCardinality: 5,
      unorderedYZPairCardinality: 15,
      exactTripleCount: 75,
      mechanicalCardinalityIdentity: "5*binomial(5+2-1,2)=5*15=75",
      yzExchangeNumericalEquivalenceCertified: false,
    },
    normalizationOrbits: {
      absoluteXCenterCardinality: 2,
      unorderedAbsoluteYZCenterPairCardinality: 3,
      exactOrbitCount: 6,
      mechanicalCardinalityIdentity: "2*binomial(2+2-1,2)=2*3=6",
      normalizationOrbitNumericalEquivalenceCertified: false,
    },
    allCountsMechanicallyWitnessedByFrozenFiniteCardinalities: true,
    anyNumericalReductionEquivalenceCertified: false,
  },
  exactMomentPlan: {
    homogeneousFourMomentumPolynomialDegree: 4,
    allSpatialMonomialsThroughDegreeFourCount: 35,
    allSpatialMonomialsMechanicalIdentity: "binomial(4+3,3)=35",
    retainedEvenSpatialDegreeCounts: {
      degree0: 1,
      degree2: 6,
      degree4: 15,
    },
    eliminatedOddSpatialDegreeCounts: {
      degree1: 3,
      degree3: 10,
      total: 13,
    },
    exactRetainedMomentCount: 22,
    retainedCountMechanicalIdentity: "1+6+15=22=35-(3+10)",
    exponentTripleOrderKxKyKz: EXACT_MOMENT_EXPONENT_TRIPLES,
    exponentTripleOrderFrozen: true,
    parityReductionIsDesignIdentityOnly: true,
    tensorToMomentMapPresent: true,
    tensorToMomentMapCanonicalSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SHA256,
    tensorToMomentMapCanonicalSizeBytes:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SIZE_BYTES,
    tensorToMomentMapCommonDenominator: 6,
    tensorToMomentMapCoefficientBoundary:
      "parity_projected_s2Pi_quartic_polynomial_only_excludes_rho_SI_smearing_and_integration_factors",
    tensorToMomentEquivalenceCertified: false,
  },
  analyticK0IntegrationPlan: {
    futureConeLowerLimitIdentity: "r=sqrt(Kx^2+Ky^2+Kz^2)",
    finiteTruncationMomentIdentity:
      "J_(4-d)^T(r)=integral_r^T_dK0*K0^(4-d)*Q(a0*K0)^2",
    spatialDegreeSymbol: "d=alpha_x+alpha_y+alpha_z in {0,2,4}",
    integrationOrder: "K0_analytic_design_then_three_dimensional_cubature",
    a0M: 0.002,
    retainedK0Powers: [0, 2, 4],
    primaryUpperCutoffDimensionless: 128,
    comparisonUpperCutoffDimensionless: 256,
    primaryUpperCutoffMInverse: 64000,
    comparisonUpperCutoffMInverse: 128000,
    exactCutoffScalingIdentities: [
      "128/0.002=64000_m^-1",
      "256/0.002=128000_m^-1",
    ],
    exactDimensionReductionScalingIdentity:
      "integral_r^T_dK0*K0^m*Q(a0*K0)^2=a0^(-(m+1))*integral_(a0*r)^(a0*T)_dt*t^m*Q(t)^2",
    exactAntiderivativePresent: false,
    binary64PrefixTableAlgorithmFrozen: true,
    numericalJImplementationPresent: false,
    analyticReductionEquivalenceProof: null,
    tailFormula: null,
    tailFormulaCertified: false,
    d12Enclosure: null,
    coreEnclosure: null,
    tailEnclosure: null,
  },
  importanceTransformPlan: {
    transformedDimensionCount: 3,
    positiveAxisVariableOrder: ["u_x", "u_y", "u_z"],
    nonnegativeAxisFoldingPlanned: true,
    intendedInfiniteCdfIdentity:
      "F_Q(u)=integral_0^u_dv*Q(v)^2/integral_0^infinity_dv*Q(v)^2",
    usedTruncatedCdfIdentity:
      "F_Q^256(u)=integral_0^u_dv*Q(v)^2/integral_0^256_dv*Q(v)^2",
    implementedTrapezoidDensitySurrogate:
      "on_[z_i,z_(i+1))_q2_density_is_constant_(Q(z_i)^2+Q(z_(i+1))^2)/2",
    implementedCdfExactlyIntegratesTableDensitySurrogate: true,
    tableDensitySurrogateEqualsContinuousQSquaredClaimed: false,
    inverseTransform: "u_j=(F_Q^256)_inverse(sobol_coordinate_j)",
    cdfUsesFrozenExactQBumpDefinition: true,
    qEvaluator: {
      exactBumpIdentity:
        "q(u)=exp(-u^2/(1-u^2)) for abs(u)<1 and q(u)=0 otherwise",
      qIdentity: "Q(z)=2*integral_0^1_du*q(u)*cos(z*u)",
      quadratureFamily: "gauss_legendre",
      quadratureOrder: 256,
      interval: [0, 1],
      nodeOrder: "ascending",
      summationOrder: "ascending_node_index_naive_binary64",
      rowBatchPointCount: 1024,
      libraryRoutine: "numpy.polynomial.legendre.leggauss",
      dependencyVersionMustBeRuntimePinned: true,
      binary64DiagnosticOnly: true,
    },
    qSquaredTable: {
      lowerInclusive: 0,
      upperInclusive: 256,
      intervalCount: 65536,
      pointCount: 65537,
      exactStep: "1/256",
      binary64Step: 0.00390625,
      pointIdentity: "z_i=i/256 for integer i in [0,65536]",
    },
    cdfAccumulator: {
      rule: "composite_trapezoid_left_to_right_binary64",
      inverseSearch:
        "smallest_table_index_with_cdf_greater_than_or_equal_target",
      inverseInterpolation: "piecewise_linear_in_cdf",
      plateauTieBreak: "leftmost_table_coordinate",
      zeroTargetResult: 0,
    },
    q0Enclosure: null,
    truncatedCdfNormalizerEnclosure: null,
    inverseCdfEnclosure: null,
    spatialTailEnclosure: null,
    transformReadyForBinary64DiagnosticImplementation: true,
    transformReadyForAuthoritativeExecution: false,
  },
  sampleNormalizationCpPlan: {
    q0Computation: "same_Q_evaluator_at_z_equals_0",
    spatialQuadratureFamily: "tensor_product_gauss_legendre",
    spatialQuadratureOrderPerAxis: 32,
    spatialAxisIntervals: [
      [-1, 1],
      [-1, 1],
      [-1, 1],
    ],
    normalizationOrbitCount: 6,
    exactSIdentity:
      "S_p=integral_[-1,1]^3_du_x_du_y_du_z*q(u_x)*q(u_y)*q(u_z)*Omega(X_p+ax*u_x,Y_p+ay*u_y,Z_p+az*u_z)^4",
    exactCpIdentity: "C_p=1/(V*Q0*S_p)",
    volumeM4: 8e-11,
    orbitExpansionOrder: "sample_ordinal_0_through_63",
    numericalQ0Value: null,
    numericalCpValues64: null,
    q0Enclosure: null,
    cpEnclosures: null,
    algorithmReadyForBinary64DiagnosticImplementation: true,
    algorithmReadyForAuthoritativeExecution: false,
  },
  sobolPolicy: {
    family: "base_2_sobol_digital_net",
    dimensionCount: 3,
    coordinateWordBits: 32,
    scramble: false,
    digitalShift: null,
    sequenceIndexOrigin: 0,
    nestedPrefixRequired: true,
    directionNumberParameters: [
      { dimension: 1, degreeS: 0, coefficientA: 0, initialOddM: [1] },
      { dimension: 2, degreeS: 1, coefficientA: 0, initialOddM: [1] },
      { dimension: 3, degreeS: 2, coefficientA: 1, initialOddM: [1, 3] },
    ],
    directionNumberRecurrence:
      "V_j=m_j<<(32-j) for j<=s; V_j=V_(j-s) xor (V_(j-s)>>s) xor coefficient_bit_terms for j>s",
    pointConstruction:
      "X_n=xor_of_direction_numbers_selected_by_bits_of_gray_code_g=n_xor_(n>>1); coordinate=X_n/2^32",
    maximumDirectionExponentUsed: 18,
    directionNumberSourceReceipt: null,
    coarsePrefix: {
      exponent: 17,
      pointCount: 131072,
      exactIdentity: "2^17=131072",
    },
    finePrefix: {
      exponent: 18,
      pointCount: 262144,
      exactIdentity: "2^18=262144",
    },
    coarseIsExactInitialPrefixOfFine: true,
    deterministicSequenceDesignFrozen: true,
    sourceProvenanceCertified: false,
  },
  diagnosticRuntimePolicy: {
    requiredUnattestedVersionTuple: {
      implementation: "CPython",
      pythonVersion: "3.13.7",
      numpyVersion: "2.2.6",
      scipyVersion: "1.16.1",
    },
    tupleStatus: "required_for_diagnostic_reproduction_but_unattested",
    pythonBinarySha256: null,
    numpyDistributionSha256: null,
    scipyDistributionSha256: null,
    dependencyLockfileSha256: null,
    runtimeReceipt: null,
    sobolImplementation:
      "contract_owned_dependency_independent_uint32_gray_code_recurrence",
    scipySobolImplementationAllowed: false,
    numpyRandomImplementationAllowed: false,
    runtimeAuthority: false,
  },
  positiveOctantReconstructionPlan: {
    signOrder: ["---", "--+", "-+-", "-++", "+--", "+-+", "++-", "+++"],
    phaseWeightIdentity:
      "sum_sigma_in_{minus_1,plus_1}^3 product_j(sigma_j^alpha_j)*cos(sum_j sigma_j*K_j*Delta_j)",
    signSumEvaluatedInFrozenOrder: true,
    positiveOctantReductionEquivalenceCertified: false,
  },
  batchingAndHardCaps: {
    batchPointCount: 4096,
    maximumPointCount: 262144,
    maximumBatchCount: 64,
    maximumCanonicalDisplacementCount: 75,
    maximumExactMomentCount: 22,
    maximumCutoffEvaluationsPerPointMoment: 2,
    maximumMomentAccumulatorUpdates: 865075200,
    accumulatorUpdateMechanicalIdentity: "262144*75*22*2=865075200",
    maximumOutputElementCount: 409600,
    maximumRawBytesPerFullArray: 3276800,
    maximumFullArrayInventoryBytes: 9830400,
    maximumResidentBytes: 268435456,
    hardCapsCheckedBeforeAllocationAndWork: true,
    hardCapDisposition: "abort_without_output",
    partialOutputAllowed: false,
    runtimeCapOverrideAccepted: false,
    memoryCapObservedInAnImplementation: false,
    workCapObservedInAnImplementation: false,
  },
  observationSeparation: {
    centralObservation: {
      definition: "fine_prefix_at_primary_upper_cutoff",
      outputStatus: "diagnostic_binary64_truncated_not_enclosed",
      rawArray: null,
    },
    refinementObservation: {
      definition:
        "fine_prefix_minus_coarse_prefix_at_same_primary_upper_cutoff",
      rawArray: null,
      interpretedAsU95: false,
      interpretedAsDeterministicErrorBound: false,
    },
    cutoffObservation: {
      definition:
        "fine_prefix_at_comparison_upper_cutoff_minus_fine_prefix_at_primary_upper_cutoff",
      rawArray: null,
      interpretedAsTailEnclosure: false,
      interpretedAsDeterministicErrorBound: false,
    },
    observationsStoredSeparately: true,
    refinementAndCutoffMayNotBeAddedAsCertifiedUncertainty: true,
    deterministicEnclosure: null,
    simultaneousAbsoluteUncertainty95: null,
    tailEnclosure: null,
  },
  unavailableProofAndExecutionInputs: {
    primarySourceReceipt: null,
    sourceToFormulaEquivalenceProof: null,
    qEvaluatorSourceIdentity: null,
    qEvaluatorFormulaEquivalenceProof: null,
    q0Enclosure: null,
    sampleNormalizationCpEnclosures: null,
    d12Enclosure: null,
    signedAbsoluteReductionEquivalenceProof: null,
    yzCanonicalReductionEquivalenceProof: null,
    normalizationOrbitEquivalenceProof: null,
    tensorToMomentMapBinding: {
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_MOMENT_MAP_EXPECTED_SIZE_BYTES,
      descriptorExportName:
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR",
      exactLiteralPinVerifiedAtModuleInitialization: true,
    },
    tensorToMomentEquivalenceProof: null,
    k0AnalyticReductionEquivalenceProof: null,
    sobolDirectionNumberSourceReceipt: null,
    inverseCdfEnclosure: null,
    coreCutoffAdequacyProof: null,
    compactCoreIntervalEnclosure: null,
    certifiedTailFormula: null,
    certifiedTailEnclosure: null,
    centralRefinementCutoffJointEnclosure: null,
    simultaneousU95Construction: null,
    runtimeBinaryAndDependencyHashManifest: null,
    runtimeResourceObservationReceipt: null,
    primaryExecutorLineage: null,
    independentExecutorLineage: null,
    independentAlgorithmContract: null,
    executionContract: null,
    allFieldsRequiredBeforeAuthoritativeExecution: true,
    nullFieldAuthoritativeExecutionAllowed: false,
  },
  implementationBoundary: {
    tensorToMomentMapPresent: true,
    vectorizedCubatureWorkerPresent: false,
    serverWrapperPresent: false,
    centralArrayBuilderPresent: false,
    rawOutputWriterPresent: false,
    atomicReceiptWriterPresent: false,
    primaryExecutorPresent: false,
    independentExecutorPresent: false,
    replayIntegrationPresent: false,
    lampProjectionPresent: false,
    mayFeedFixedBackgroundRun: false,
  },
  blockerAccounting: {
    inheritedBlockerCount:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_INHERITED_BLOCKERS.length,
    inheritedBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_INHERITED_BLOCKERS,
    addedBlockerCount:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_ADDED_BLOCKERS.length,
    addedBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_ADDED_BLOCKERS,
    totalBlockerCount:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_BLOCKERS.length,
    totalBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_BLOCKERS,
    resolvesAnyInheritedBlocker: false,
    freezesPolicyButDoesNotResolveProofOrExecutionBlockers: true,
  },
  authority: {
    status: "blocked",
    firstBlocker: "primary_source_artifact_bytes_not_verified",
    blockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_BLOCKERS,
    locks:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_AUTHORITY_LOCKS,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    `nhm2_connected_noise_diagnostic_cubature_policy_content_literal_pin_mismatch:${CONTENT_BINDING.sha256}/${CONTENT_BINDING.sizeBytes}`,
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY;

const SNAPSHOT_LIMITS = Object.freeze({
  maximumDepth: 32,
  maximumNodes: 4096,
  maximumOwnKeys: 16384,
  maximumArrayLength: 1024,
  maximumCanonicalBytes: 262144,
} as const);
const FORBIDDEN_DATA_KEYS = new Set(["__proto__", "prototype", "constructor"]);

type SnapshotResult =
  { ok: true; value: unknown } | { ok: false; violation: string };

type SnapshotFrame =
  | {
      kind: "visit";
      input: unknown;
      pointer: string;
      depth: number;
      assign: (value: unknown) => void;
    }
  | { kind: "exit"; input: object };

const snapshotPlainData = (value: unknown): SnapshotResult => {
  let root: unknown;
  let nodeCount = 0;
  let ownKeyCount = 0;
  const ancestors = new WeakSet<object>();
  const stack: SnapshotFrame[] = [
    {
      kind: "visit",
      input: value,
      pointer: "",
      depth: 0,
      assign: (entry) => {
        root = entry;
      },
    },
  ];

  while (stack.length > 0) {
    const frame = stack.pop() as SnapshotFrame;
    if (frame.kind === "exit") {
      ancestors.delete(frame.input);
      continue;
    }

    const at = frame.pointer || "/";
    const input = frame.input;
    if (
      input === null ||
      typeof input === "string" ||
      typeof input === "boolean"
    ) {
      frame.assign(input);
      continue;
    }
    if (typeof input === "number") {
      if (!Number.isFinite(input)) {
        return { ok: false, violation: `nonfinite_number:${at}` };
      }
      if (Object.is(input, -0)) {
        return { ok: false, violation: `negative_zero:${at}` };
      }
      frame.assign(input);
      continue;
    }
    if (typeof input !== "object") {
      return { ok: false, violation: `non_json_value:${at}` };
    }
    if (nodeUtilTypes.isProxy(input)) {
      return { ok: false, violation: `proxy_forbidden:${at}` };
    }
    if (frame.depth > SNAPSHOT_LIMITS.maximumDepth) {
      return { ok: false, violation: `maximum_depth_exceeded:${at}` };
    }
    nodeCount += 1;
    if (nodeCount > SNAPSHOT_LIMITS.maximumNodes) {
      return { ok: false, violation: `maximum_nodes_exceeded:${at}` };
    }
    if (ancestors.has(input)) {
      return { ok: false, violation: `cycle_forbidden:${at}` };
    }

    const isArray = Array.isArray(input);
    const prototype = Object.getPrototypeOf(input);
    if (
      (isArray && prototype !== Array.prototype) ||
      (!isArray && prototype !== Object.prototype)
    ) {
      return {
        ok: false,
        violation: `${isArray ? "non_plain_array" : "non_plain_object"}:${at}`,
      };
    }

    const keys = Reflect.ownKeys(input);
    if (keys.some((key) => typeof key !== "string")) {
      return { ok: false, violation: `symbol_key_forbidden:${at}` };
    }
    const stringKeys = keys as string[];
    ownKeyCount += stringKeys.length;
    if (ownKeyCount > SNAPSHOT_LIMITS.maximumOwnKeys) {
      return { ok: false, violation: `maximum_own_keys_exceeded:${at}` };
    }
    const forbiddenKey = stringKeys.find((key) => FORBIDDEN_DATA_KEYS.has(key));
    if (forbiddenKey != null) {
      return {
        ok: false,
        violation: `forbidden_data_key:${frame.pointer}/${forbiddenKey}`,
      };
    }
    const descriptors = Object.getOwnPropertyDescriptors(input);

    if (isArray) {
      const array = input as unknown[];
      if (array.length > SNAPSHOT_LIMITS.maximumArrayLength) {
        return { ok: false, violation: `maximum_array_length_exceeded:${at}` };
      }
      if (
        stringKeys.length !== array.length + 1 ||
        !stringKeys.includes("length") ||
        stringKeys.some((key) => {
          if (key === "length") return false;
          if (!/^(?:0|[1-9][0-9]*)$/.test(key)) return true;
          const index = Number(key);
          return !Number.isSafeInteger(index) || index >= array.length;
        })
      ) {
        return { ok: false, violation: `array_keys_invalid:${at}` };
      }
      const lengthDescriptor = descriptors.length;
      if (
        lengthDescriptor == null ||
        !("value" in lengthDescriptor) ||
        lengthDescriptor.value !== array.length
      ) {
        return {
          ok: false,
          violation: `array_length_descriptor_invalid:${at}`,
        };
      }
      const output: unknown[] = new Array(array.length);
      frame.assign(output);
      ancestors.add(input);
      stack.push({ kind: "exit", input });
      for (let index = array.length - 1; index >= 0; index -= 1) {
        const descriptor = descriptors[String(index)];
        if (
          descriptor == null ||
          !("value" in descriptor) ||
          descriptor.enumerable !== true
        ) {
          return {
            ok: false,
            violation: `accessor_sparse_or_hidden_array_entry:${frame.pointer}/${index}`,
          };
        }
        stack.push({
          kind: "visit",
          input: descriptor.value,
          pointer: `${frame.pointer}/${index}`,
          depth: frame.depth + 1,
          assign: (entry) => {
            output[index] = entry;
          },
        });
      }
      continue;
    }

    const output: Record<string, unknown> = {};
    frame.assign(output);
    ancestors.add(input);
    stack.push({ kind: "exit", input });
    for (let index = stringKeys.length - 1; index >= 0; index -= 1) {
      const key = stringKeys[index];
      const descriptor = descriptors[key];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return {
          ok: false,
          violation: `accessor_or_hidden_property_forbidden:${frame.pointer}/${key}`,
        };
      }
      stack.push({
        kind: "visit",
        input: descriptor.value,
        pointer: `${frame.pointer}/${key}`,
        depth: frame.depth + 1,
        assign: (entry) => {
          output[key] = entry;
        },
      });
    }
  }

  return { ok: true, value: root };
};

export const canonicalNhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyJson =
  (value: unknown): string => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) {
      throw new TypeError(
        `Cannot canonicalize unsafe cubature policy data: ${snapshot.violation}`,
      );
    }
    const canonical = canonicalJson(snapshot.value);
    if (
      Buffer.byteLength(canonical, "utf8") >
      SNAPSHOT_LIMITS.maximumCanonicalBytes
    ) {
      throw new TypeError(
        "Cannot canonicalize unsafe cubature policy data: maximum_canonical_bytes_exceeded:/",
      );
    }
    return canonical;
  };

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CANONICAL_JSON =
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY,
  );
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_CANONICAL_JSON,
    "utf8",
  );

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    `nhm2_connected_noise_diagnostic_cubature_policy_contract_literal_pin_mismatch:${NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SHA256}/${NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY_SIZE_BYTES}`,
  );
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const exactDifferences = (
  actual: unknown,
  expected: unknown,
  pointer = "",
): string[] => {
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    if (actual.length !== expected.length) {
      violations.push(`array_length_drift:${pointer || "/"}`);
    }
    for (
      let index = 0;
      index < Math.min(actual.length, expected.length);
      index += 1
    ) {
      violations.push(
        ...exactDifferences(
          actual[index],
          expected[index],
          `${pointer}/${index}`,
        ),
      );
    }
    return violations;
  }
  if (isRecord(actual) || isRecord(expected)) {
    if (!isRecord(actual) || !isRecord(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    for (const key of actualKeys) {
      if (!expectedKeys.includes(key)) {
        violations.push(`extra_key:${pointer}/${key}`);
      }
    }
    for (const key of expectedKeys) {
      if (!actualKeys.includes(key)) {
        violations.push(`missing_key:${pointer}/${key}`);
      } else {
        violations.push(
          ...exactDifferences(actual[key], expected[key], `${pointer}/${key}`),
        );
      }
    }
    return violations;
  }
  return Object.is(actual, expected) ? [] : [`value_drift:${pointer || "/"}`];
};

const unique = (values: readonly string[]): string[] => [...new Set(values)];

export const nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations =
  (value: unknown): string[] => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) return [snapshot.violation];

    const violations = exactDifferences(
      snapshot.value,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DIAGNOSTIC_CUBATURE_POLICY,
    );
    const root = isRecord(snapshot.value) ? snapshot.value : null;
    const content =
      root != null && isRecord(root.content) ? root.content : null;

    if (content != null) {
      try {
        const actualBinding = canonicalBinding(content);
        const declared = isRecord(root?.contentBinding)
          ? root.contentBinding
          : null;
        if (
          declared == null ||
          declared.sha256 !== actualBinding.sha256 ||
          declared.sizeBytes !== actualBinding.sizeBytes ||
          declared.canonicalization !== CANONICALIZATION
        ) {
          violations.push("content_binding_invalid");
        }
      } catch {
        violations.push("content_binding_invalid");
      }
    } else {
      violations.push("content_binding_invalid");
    }

    const immutable =
      content != null && isRecord(content.immutableConfiguration)
        ? content.immutableConfiguration
        : null;
    if (
      immutable == null ||
      immutable.contractIsZeroArgumentConstant !== true ||
      Object.entries(immutable).some(([key, entry]) =>
        key === "contractIsZeroArgumentConstant"
          ? entry !== true
          : entry !== false,
      )
    ) {
      violations.push("numeric_and_user_overrides_must_remain_forbidden");
    }

    const layout =
      content != null && isRecord(content.rawArrayLayout)
        ? content.rawArrayLayout
        : null;
    if (
      layout == null ||
      layout.sampleAxisCount !== 64 ||
      layout.leftSampleAxisCount !== 64 ||
      layout.rightSampleAxisCount !== 64 ||
      layout.orderedComponentPairAxisCount !== 100 ||
      layout.elementCount !== 409600 ||
      layout.bytesPerElement !== 8 ||
      layout.exactRawByteCount !== 3276800 ||
      layout.outputStatus !== "diagnostic_binary64_truncated_not_enclosed"
    ) {
      violations.push("raw_64x64x100_binary64_layout_invalid");
    }

    const observation =
      content != null && isRecord(content.observationSeparation)
        ? content.observationSeparation
        : null;
    if (
      observation == null ||
      observation.observationsStoredSeparately !== true ||
      observation.deterministicEnclosure !== null ||
      observation.simultaneousAbsoluteUncertainty95 !== null ||
      observation.tailEnclosure !== null
    ) {
      violations.push(
        "central_refinement_cutoff_observations_must_remain_unenclosed",
      );
    }

    const implementation =
      content != null && isRecord(content.implementationBoundary)
        ? content.implementationBoundary
        : null;
    if (
      implementation == null ||
      implementation.tensorToMomentMapPresent !== true ||
      Object.entries(implementation).some(([key, entry]) =>
        key === "tensorToMomentMapPresent" ? entry !== true : entry !== false,
      )
    ) {
      violations.push("implementation_and_run_feed_must_remain_absent");
    }

    const authority =
      content != null && isRecord(content.authority) ? content.authority : null;
    const locks =
      authority != null && isRecord(authority.locks) ? authority.locks : null;
    if (
      authority?.status !== "blocked" ||
      authority?.firstBlocker !==
        "primary_source_artifact_bytes_not_verified" ||
      locks == null ||
      Object.values(locks).some((entry) => entry !== false)
    ) {
      violations.push("authority_must_remain_blocked");
    }

    const claims =
      content != null && isRecord(content.claimLocks)
        ? content.claimLocks
        : null;
    if (
      claims == null ||
      Object.values(claims).some((entry) => entry !== false)
    ) {
      violations.push("claim_locks_must_remain_false");
    }
    if (content == null || content.executionAdmissible !== false) {
      violations.push("execution_must_remain_blocked");
    }

    return unique(violations);
  };

export const isNhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyV1 =
  (
    value: unknown,
  ): value is Nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyV1 =>
    nhm2ConformallyFlatNeedleConnectedNoiseDiagnosticCubaturePolicyViolations(
      value,
    ).length === 0;
