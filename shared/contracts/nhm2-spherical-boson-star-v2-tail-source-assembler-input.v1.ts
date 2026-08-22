// Program gate: G2 — classical branch proof and terminal state
// Workstream: exact proof-definition implementation
// Capability or component: one-cell tail source assembler input wire
// Current maturity: definition-only, unsealed, with no input instances
// Target maturity: sealed canonical input ABI consumed by native assembly
// Required frozen inputs: branch policy, vacuum ABI, source calculus, endpoint wires
// Required evidence: exact seals, hostile ingress, self-hash, independent audit
// Stop/fail criteria: schema drift, inferred lambda input, retune, or authority
// Explicit non-goals: proof execution, candidate admission, lamps, physical claims
// Downstream gate unlocked: authenticated parameter-center producer and all-cover assembly

import { createHash } from "node:crypto";

export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2.tail_source_assembler_input" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VERSION =
  "nhm2_spherical_boson_star_v2_tail_source_assembler_input/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANDIDATE_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const;

const EXACT_DEPENDENCY_BINDINGS = Object.freeze({
  branchSelectionNumericsV1: Object.freeze({
    relativePath:
      "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts",
    rawSha256:
      "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82",
    sizeBytes: 44_912,
    semanticSha256:
      "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa",
    canonicalSizeBytes: 41_280,
  }),
  vacuumContinuationProofAbiV1: Object.freeze({
    relativePath:
      "shared/contracts/nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi.v1.ts",
    rawSha256:
      "44c6392b56fe31a193e83e298effdd3dcc0b67c7cc684a45558a2ca2e48a8a81",
    sizeBytes: 46_152,
    semanticSha256:
      "2fb589d024463ec1e656a2b180b9fdfcd61713e474666afdc217c49f1bd03251",
    plainCanonicalSha256:
      "4af8b689f175a418cacf252f260aa513407bcdba6161cd6497ec17932b17c732",
    canonicalSizeBytes: 29_628,
  }),
  tailSourceEnvelopeCalculus: Object.freeze({
    relativePath:
      "docs/research/nhm2-spherical-boson-star-v2-g2-d-tail-source-envelope-calculus.md",
    rawSha256:
      "2aa6d2eaf3072a0e69af96f20d85922ece11b1bcd3cd5379d8f20e82a281ca8d",
    sizeBytes: 25_281,
  }),
  parameterSourceChartAudit: Object.freeze({
    relativePath:
      "docs/research/nhm2-spherical-boson-star-v2-g2-d-tail-parameter-source-chart-audit.md",
    rawSha256:
      "5a427b5091d806d5542c893fd108566c020fde2bdfb617dbbeb0ccf34b8785a7",
    sizeBytes: 7_231,
  }),
  endpointSparseAlgebraDefinition: Object.freeze({
    relativePath:
      "docs/research/nhm2-spherical-boson-star-v2-g2-d-tail-endpoint-sparse-algebra-v1.md",
    rawSha256:
      "ac2dde57db64c4824247f7aeb9d8bbab7b91b90754e019c3c13848ae41a00278",
    sizeBytes: 7_281,
  }),
  endpointSparseAlgebraSource: Object.freeze({
    relativePath:
      "tools/nhm2-spherical-boson-star-v2-branch-proof/tail_endpoint_sparse_algebra.py",
    rawSha256:
      "b5bf0fabfe46f7e47eb200ee12d2d2d7189418dcedb311848ab519b4eb2e841e",
    sizeBytes: 18_226,
  }),
  endpointSparseAlgebraHeaderGenerator: Object.freeze({
    relativePath:
      "tools/nhm2-spherical-boson-star-v2-branch-proof/generate_tail_endpoint_sparse_algebra_header.py",
    rawSha256:
      "5231517cb691f931693ec21e6d97486beeaa08b219cfd1af3de3a388ce0fff8c",
    sizeBytes: 6_602,
  }),
  endpointSparseAlgebraGeneratedHeader: Object.freeze({
    relativePath:
      "tools/nhm2-spherical-boson-star-v2-branch-proof/tail_endpoint_sparse_algebra_generated.hpp",
    rawSha256:
      "dee0e4ce1aabaa376eeb3cf004b1aef9d5a7cedfb59c81e6f7f7c098138798fb",
    sizeBytes: 184_649,
  }),
  scalarJetWire: Object.freeze({
    semanticSha256:
      "858e83405870b2a6bb170b42f9b85817f7cfd9413e6206faba1fbbd1ae27826d",
    canonicalSizeBytes: 12_234,
    exactCoefficientCount: 9,
    exactSparseTermCount: 516,
  }),
  endpointQuotientWire: Object.freeze({
    semanticSha256:
      "c19b4795d314597d72d18ab8ad6e8dbfe55d16f58f31472402fff548417022a7",
    canonicalSizeBytes: 99_867,
    exactCoefficientCount: 17,
    exactSparseTermCount: 3_053,
  }),
} as const);

const DYADIC_ENDPOINT_KEYS = Object.freeze([
  "direction",
  "exponent2",
  "mantissaLowercaseHex",
  "precisionBits",
  "sign",
] as const);
const DIRECTED_INTERVAL_KEYS = Object.freeze(["lower", "upper"] as const);
const PROJECTED_MODEL_KEYS = Object.freeze([
  "basis",
  "coefficientCount",
  "coefficients",
  "degree",
  "residualNormUpper",
  "weightExact",
] as const);
const PARAMETER_MODEL_KEYS = Object.freeze(["coordinate", "model"] as const);
const CELL_INPUT_UNSIGNED_KEYS = Object.freeze([
  "authorityFalse",
  "candidateId",
  "cellOrdinal",
  "contractVersion",
  "orderedParameterModels",
  "tailSourceAssemblerInputSemanticSha256",
] as const);
const CELL_INPUT_KEYS = Object.freeze([
  "authorityFalse",
  "candidateId",
  "cellOrdinal",
  "contractVersion",
  "orderedParameterModels",
  "selfSha256",
  "tailSourceAssemblerInputSemanticSha256",
] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SELF_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2/tail-source-assembler-input/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-tail-source-assembler-input/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumWireUtf16CodeUnits: 262_144,
    maximumWireUtf8Bytes: 262_144,
    maximumDepth: 12,
    maximumNodes: 4_096,
    maximumArrayLength: 64,
    maximumObjectPropertyCount: 16,
    maximumStringUtf8Bytes: 4_096,
    maximumAggregateStringUtf8Bytes: 32_768,
  } as const);

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_ARTIFACT_ID,
  authority:
    "definition_only_input_schema_without_producer_runtime_proof_or_candidate_authority",
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANDIDATE_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VERSION,
  currentMaturity:
    "canonical_one_cell_parameter_center_input_definition_only_no_instances",
  exactDependencyBindings: EXACT_DEPENDENCY_BINDINGS,
  cellSchedule: {
    exactCellCount: 1_024,
    exactCellOrdinals: Object.freeze(
      Array.from({ length: 1_024 }, (_, ordinal) => ordinal),
    ),
    lambdaInterval: "[cellOrdinal*2^-15,(cellOrdinal+1)*2^-15]",
    lambdaAffineModel: "lambda(t)=((2*cellOrdinal+1)*2^-16)+(2^-16)*T_1(t)",
    lambdaIsDerivedFromCellOrdinal: true,
    lambdaMayBeCallerSupplied: false,
  },
  parameterModelSchema: {
    orderedCoordinates: ["nu", "m", "c"],
    fullIndependentCoordinateOrder: ["lambda", "nu", "m", "c"],
    basis: "Chebyshev_T_j_on_t_lambda_in_[-1,1]",
    degree: 32,
    coefficientCount: 33,
    coefficientValue:
      "directed_closed_interval_of_canonical_MPFR256_dyadic_endpoints",
    residualNorm: "one_nonnegative_canonical_MPFR256_RNDU_dyadic_upper_bound",
    weightExact: "17/16",
    noDerivedQuantityMayBeSupplied:
      "s_k_w2_sigma_d_b_z_HS_V1S_scalarJet_and_source_values_are_derived_only",
  },
  exactWireKeyOrders: {
    cellInputUnsigned: CELL_INPUT_UNSIGNED_KEYS,
    cellInput: CELL_INPUT_KEYS,
    parameterModel: PARAMETER_MODEL_KEYS,
    projectedModel: PROJECTED_MODEL_KEYS,
    directedInterval: DIRECTED_INTERVAL_KEYS,
    dyadicEndpoint: DYADIC_ENDPOINT_KEYS,
  },
  exactInputInventory: {
    exactTopLevelBindingCount: 1,
    topLevelSemanticRole: "tail_source_assembler_parameter_center_cell_input",
    exactOrderedParameterModelCount: 3,
    exactOrderedParameterRoles: ["nu", "m", "c"],
    finiteScalarJetIsDerivedFromFrozenWire: true,
    endpointQuotientIsDerivedFromFrozenWire: true,
    sourceLedgerIsDefinitionBoundNotCallerSupplied: true,
    runtimeExpectationIsDefinitionBoundNotCallerSupplied: true,
  },
  chronology: [
    "verify_contract_and_every_frozen_raw_semantic_and_size_binding",
    "verify_primitive_canonical_cell_input_and_domain_separated_self_hash",
    "derive_lambda_affine_model_from_cellOrdinal_without_caller_input",
    "decode_exactly_nu_m_c_in_that_order_with_33_coefficients_and_one_residual_each",
    "derive_s_k_w2_sigma_d_then_regular_chart_then_frozen_scalar_jet_then_source_DAG",
    "stop_on_first_binding_domain_margin_model_or_overlap_failure_without_retry_or_retune",
    "persist_reopen_rehash_before_any_future_proof_receipt",
  ],
  instances: {
    orderedCellInputs: null,
    parameterCenterProducer: null,
    sourceManifest: null,
    proofRuntime: null,
    persistenceReceipt: null,
    independentAuditReceipt: null,
  },
  readiness: {
    inputInstancesReady: false,
    producerReady: false,
    nativeAllCoverReady: false,
    proofExecutionAuthorized: false,
    proofObserved: false,
  },
  authorityLocks: {
    definitionIsInputInstance: false,
    syntheticInputIsProof: false,
    inputAuthority: false,
    proofAuthority: false,
    candidateAuthority: false,
    replayAuthority: false,
    diagnosticPass: false,
    theoryGraphLamp: false,
    physicalViability: false,
    propulsion: false,
    transport: false,
  },
  blockers: [
    "parameter_center_producer_not_implemented",
    "ordered_1024_cell_input_instances_absent",
    "native_all_cover_consumer_not_implemented",
    "authenticated_runtime_and_persistence_issuer_absent",
    "independent_full_audit_absent",
  ],
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (
    value === null ||
    typeof value !== "object" ||
    seen.has(value as object)
  ) {
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1 =
  deepFreeze(CONTRACT);
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1);
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_PLAIN_CANONICAL_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_SEMANTIC_SHA256:
  string | null =
  "c90de09dacfb6ed7507dcc1a56f19b28a7bc4dcac4996c9da7066a47e178f9e7";
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_PLAIN_CANONICAL_SHA256:
  string | null =
  "1433ac8efacb99867d518295c92dad11c0bebc7b646ab340c48e0f6364acf3d3";
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_CANONICAL_SIZE_BYTES:
  number | null = 10_136;
export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_LITERAL_SEAL_STATUS =
  "sealed_after_independent_parent_acknowledgement_before_parameter_center_producer_implementation" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_ARTIFACT_ID,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANDIDATE_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VERSION,
    semanticSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256,
    plainCanonicalSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_PLAIN_CANONICAL_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_SIZE_BYTES,
    observedRawBinding: null,
    literalSealStatus:
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_LITERAL_SEAL_STATUS,
  });

const exactKeys = (
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  JSON.stringify(Object.keys(value)) === JSON.stringify(keys);

const hasUnpairedSurrogate = (value: string): boolean => {
  for (let index = 0; index < value.length; ++index) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      if (index + 1 >= value.length) return true;
      const low = value.charCodeAt(++index);
      if (low < 0xdc00 || low > 0xdfff) return true;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
};

const preparseDepthWithinLimit = (wire: string): boolean => {
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (const character of wire) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === "{" || character === "[") {
      if (
        ++depth >
        NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VALIDATOR_LIMITS.maximumDepth
      ) {
        return false;
      }
    } else if (character === "}" || character === "]") {
      --depth;
    }
  }
  return true;
};

const boundedTree = (root: unknown): boolean => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VALIDATOR_LIMITS;
  const stack: Array<{ depth: number; value: unknown }> = [
    { depth: 0, value: root },
  ];
  let nodes = 0;
  let aggregateStringBytes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (++nodes > limits.maximumNodes || current.depth > limits.maximumDepth)
      return false;
    if (typeof current.value === "string") {
      if (hasUnpairedSurrogate(current.value)) return false;
      const bytes = Buffer.byteLength(current.value, "utf8");
      if (bytes > limits.maximumStringUtf8Bytes) return false;
      aggregateStringBytes += bytes;
      if (aggregateStringBytes > limits.maximumAggregateStringUtf8Bytes)
        return false;
    } else if (Array.isArray(current.value)) {
      if (current.value.length > limits.maximumArrayLength) return false;
      for (const value of current.value)
        stack.push({ depth: current.depth + 1, value });
    } else if (current.value !== null && typeof current.value === "object") {
      const entries = Object.entries(current.value as Record<string, unknown>);
      if (entries.length > limits.maximumObjectPropertyCount) return false;
      for (const [key, value] of entries) {
        if (hasUnpairedSurrogate(key)) return false;
        aggregateStringBytes += Buffer.byteLength(key, "utf8");
        if (aggregateStringBytes > limits.maximumAggregateStringUtf8Bytes)
          return false;
        stack.push({ depth: current.depth + 1, value });
      }
    }
  }
  return true;
};

type DyadicEndpoint = {
  direction: "RNDD" | "RNDU";
  exponent2: number;
  mantissaLowercaseHex: string;
  precisionBits: 256;
  sign: "minus" | "plus" | "zero";
};

const parseEndpoint = (
  value: unknown,
  direction: "RNDD" | "RNDU",
): DyadicEndpoint | null => {
  if (!exactKeys(value, DYADIC_ENDPOINT_KEYS)) return null;
  const record = value as Record<string, unknown>;
  if (
    record.direction !== direction ||
    record.precisionBits !== 256 ||
    !Number.isSafeInteger(record.exponent2) ||
    (record.exponent2 as number) < -1_073_741_823 ||
    (record.exponent2 as number) > 1_073_741_823 ||
    typeof record.mantissaLowercaseHex !== "string" ||
    typeof record.sign !== "string" ||
    !["minus", "plus", "zero"].includes(record.sign)
  )
    return null;
  const mantissa = record.mantissaLowercaseHex;
  if (record.sign === "zero") {
    if (mantissa !== "0" || record.exponent2 !== 0) return null;
  } else if (
    !/^[1-9a-f][0-9a-f]{0,63}$/.test(mantissa) ||
    !/[13579bdf]$/.test(mantissa)
  ) {
    return null;
  }
  return record as DyadicEndpoint;
};

const compareDyadic = (left: DyadicEndpoint, right: DyadicEndpoint): number => {
  const signOrdinal = (value: DyadicEndpoint): number => {
    if (value.sign === "minus") return -1;
    if (value.sign === "plus") return 1;
    return 0;
  };
  const leftSign = signOrdinal(left);
  const rightSign = signOrdinal(right);
  if (leftSign !== rightSign) return leftSign < rightSign ? -1 : 1;
  if (leftSign === 0) return 0;

  const bitLength = (hex: string): number => {
    const first = Number.parseInt(hex[0], 16);
    const firstBits = first >= 8 ? 4 : first >= 4 ? 3 : first >= 2 ? 2 : 1;
    return (hex.length - 1) * 4 + firstBits;
  };
  const leftBits = bitLength(left.mantissaLowercaseHex);
  const rightBits = bitLength(right.mantissaLowercaseHex);
  const leftTop = left.exponent2 + leftBits;
  const rightTop = right.exponent2 + rightBits;
  let magnitudeComparison: number;
  if (leftTop !== rightTop) {
    magnitudeComparison = leftTop < rightTop ? -1 : 1;
  } else {
    const exponent = Math.min(left.exponent2, right.exponent2);
    const leftInteger =
      BigInt(`0x${left.mantissaLowercaseHex}`) <<
      BigInt(left.exponent2 - exponent);
    const rightInteger =
      BigInt(`0x${right.mantissaLowercaseHex}`) <<
      BigInt(right.exponent2 - exponent);
    magnitudeComparison =
      leftInteger < rightInteger ? -1 : leftInteger > rightInteger ? 1 : 0;
  }
  return leftSign > 0 ? magnitudeComparison : -magnitudeComparison;
};

const validModel = (value: unknown, coordinate: string): boolean => {
  if (!exactKeys(value, PARAMETER_MODEL_KEYS)) return false;
  if (
    value.coordinate !== coordinate ||
    !exactKeys(value.model, PROJECTED_MODEL_KEYS)
  )
    return false;
  const model = value.model;
  if (
    model.basis !== "Chebyshev_T_j_on_t_lambda_in_[-1,1]" ||
    model.coefficientCount !== 33 ||
    model.degree !== 32 ||
    model.weightExact !== "17/16" ||
    !Array.isArray(model.coefficients) ||
    model.coefficients.length !== 33
  )
    return false;
  for (const coefficient of model.coefficients) {
    if (!exactKeys(coefficient, DIRECTED_INTERVAL_KEYS)) return false;
    const lower = parseEndpoint(coefficient.lower, "RNDD");
    const upper = parseEndpoint(coefficient.upper, "RNDU");
    if (lower === null || upper === null || compareDyadic(lower, upper) > 0)
      return false;
  }
  const residual = parseEndpoint(model.residualNormUpper, "RNDU");
  return residual !== null && residual.sign !== "minus";
};

const parseCanonical = (wire: string): unknown | null => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VALIDATOR_LIMITS;
  if (
    wire.length > limits.maximumWireUtf16CodeUnits ||
    Buffer.byteLength(wire, "utf8") > limits.maximumWireUtf8Bytes ||
    hasUnpairedSurrogate(wire) ||
    !preparseDepthWithinLimit(wire)
  )
    return null;
  try {
    const parsed: unknown = JSON.parse(wire);
    if (!boundedTree(parsed) || canonicalJson(parsed) !== wire) return null;
    return parsed;
  } catch {
    return null;
  }
};

const u64le = (value: number): Buffer => {
  const result = Buffer.alloc(8);
  result.writeBigUInt64LE(BigInt(value));
  return result;
};

const unsignedCellInput = (
  record: Record<string, unknown>,
): Record<string, unknown> => {
  const unsigned: Record<string, unknown> = {};
  for (const key of CELL_INPUT_UNSIGNED_KEYS) unsigned[key] = record[key];
  return unsigned;
};

export const nhm2SphericalBosonStarV2TailSourceAssemblerInputV1CalculateSelfHash =
  (unsignedCanonicalWire: unknown): string => {
    if (typeof unsignedCanonicalWire !== "string") {
      throw new Error("tail_source_input_primitive_string_required");
    }
    const parsed = parseCanonical(unsignedCanonicalWire);
    if (!exactKeys(parsed, CELL_INPUT_UNSIGNED_KEYS)) {
      throw new Error("tail_source_input_unsigned_schema_invalid");
    }
    const bytes = Buffer.from(unsignedCanonicalWire, "utf8");
    return createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SELF_HASH_DOMAIN,
        "utf8",
      )
      .update(u64le(bytes.byteLength))
      .update(bytes)
      .digest("hex");
  };

export const nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations =
  (wire: unknown): readonly string[] => {
    if (typeof wire !== "string")
      return Object.freeze(["tail_source_input_primitive_string_required"]);
    const parsed = parseCanonical(wire);
    if (!exactKeys(parsed, CELL_INPUT_KEYS))
      return Object.freeze(["tail_source_input_canonical_schema_required"]);
    const orderedParameterModels = parsed.orderedParameterModels;
    if (
      parsed.authorityFalse !== true ||
      parsed.candidateId !==
        NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANDIDATE_ID ||
      parsed.contractVersion !==
        NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VERSION ||
      parsed.tailSourceAssemblerInputSemanticSha256 !==
        NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256 ||
      !Number.isInteger(parsed.cellOrdinal) ||
      (parsed.cellOrdinal as number) < 0 ||
      (parsed.cellOrdinal as number) >= 1_024 ||
      typeof parsed.selfSha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(parsed.selfSha256) ||
      !Array.isArray(orderedParameterModels) ||
      orderedParameterModels.length !== 3 ||
      !["nu", "m", "c"].every((coordinate, ordinal) =>
        validModel(orderedParameterModels[ordinal], coordinate),
      )
    )
      return Object.freeze(["tail_source_input_semantic_or_model_invalid"]);
    const unsignedWire = canonicalJson(unsignedCellInput(parsed));
    if (
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1CalculateSelfHash(
        unsignedWire,
      ) !== parsed.selfSha256
    )
      return Object.freeze(["tail_source_input_self_hash_mismatch"]);
    return Object.freeze([]);
  };

const expected = [
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_CANONICAL_SIZE_BYTES,
];
if (
  expected.some((value) => value === null) &&
  !expected.every((value) => value === null)
)
  throw new Error("tail_source_input_partial_literal_seal");
if (
  expected.every((value) => value !== null) &&
  (expected[0] !==
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256 ||
    expected[1] !==
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_PLAIN_CANONICAL_SHA256 ||
    expected[2] !==
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_SIZE_BYTES)
)
  throw new Error("tail_source_input_literal_seal_mismatch");
