import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES,
} from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_PRODUCER_ARTIFACT_ID =
  "nhm2.semiclassical_v2_metric_demand_producer_receipt" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_PRODUCER_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_metric_demand_producer_receipt/v1" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_PRODUCER_CONFIGURATION_ID =
  "nhm2.alpha_0p995.epsilon_tilt_adm_probe.fixed_64/v1" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_OUTPUT_FILE_NAME =
  "metric-demand-tensor.f64" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_EXPECTED_ROUTE_ID =
  "adm_quasi_stationary_recovery_v1" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLE_COUNT = 64 as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_COMPONENT_COUNT = 10 as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SIZE_BYTES =
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLE_COUNT *
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_COMPONENT_COUNT *
  8;

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_GEOMETRY = Object.freeze({
  geometryId: "nhm2.alpha_0p995.epsilon_tilt_adm_probe_geometry/v1" as const,
  metricFamily: "nhm2_shift_lapse" as const,
  chartId: "comoving_cartesian" as const,
  shiftLapseProfileId: "stage1_centerline_alpha_0p995_v1" as const,
  alphaCenterline: 0.995 as const,
  bowlRadiusUm: 250_000 as const,
  sagDepthNm: 16 as const,
  gapNm: 8 as const,
  cavityQ: 1e9 as const,
  burstDurationUs: 10 as const,
  cycleDurationUs: 1000 as const,
  sectorCount: 80 as const,
  dutyFactor: 0.01 as const,
  expansionTolerance: 1e-12 as const,
  bubbleRadiusM: 0.25 as const,
  bubbleSigma: 0.05 as const,
  hullWallThicknessM: 0.025 as const,
  shiftAmplitude: 0 as const,
  epsilonTilt: 1e-15 as const,
  betaTiltVec: Object.freeze([0, -1, 0] as const),
  effectiveDuty: 0.001 as const,
  shiftFieldProjection: "unprojected_direct_natario_shift_field" as const,
  shiftFieldConstructionMassArgumentKg: 0 as const,
  shiftFieldConstructionMassArgumentSemantics:
    "ignored_by_calculateNatarioShiftField" as const,
});

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLING = Object.freeze({
  samplingBasisId: "nhm2.cartesian_4x4x4_interior_probe.fixed_order/v1" as const,
  coordinateMultipliers: Object.freeze([-0.5, -0.2, 0.2, 0.5] as const),
  coordinateScaleM: 0.25 as const,
  ordering: "z_major_then_y_then_x" as const,
  sampleCount: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLE_COUNT,
});

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_EVALUATOR = Object.freeze({
  shiftFieldRoute:
    "modules/warp/natario-warp.ts#calculateNatarioShiftField" as const,
  pointTensorRoute:
    "modules/warp/natario-warp.ts#calculateMetricStressEnergyTensorAtPointFromShiftField" as const,
  routePreference: "adm_only" as const,
  expectedRouteId: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_EXPECTED_ROUTE_ID,
  derivativeStepM: 0.25 / 120,
  scaleM: 0.25 as const,
  componentOrder: Object.freeze([...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS]),
  componentMultiplicities: Object.freeze([
    ...NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES,
  ]),
  outputSemantics:
    "reduced_order_adm_eulerian_channels_encoded_in_symmetric_tensor_order" as const,
});

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SEMANTIC_LIMITS =
  Object.freeze({
    maturity: "diagnostic_only" as const,
    modelTermAdmission: "experimental_not_admitted" as const,
    lapseProfileRegistered: true as const,
    lapseConsumedByPointKernel: false as const,
    lapseSensitivityEstablished: false as const,
    fullEinsteinTensorEstablished: false as const,
    coordinateCovariantTensorEstablished: false as const,
    zeroExpansionProjectionEstablished: false as const,
    sourceTensorUsed: false as const,
    declaredLeverTensorUsed: false as const,
    quantumStateUsed: false as const,
    physicalSourceRealizationEstablished: false as const,
  });

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RUN_PROVENANCE_BLOCKERS =
  Object.freeze([
    "git_sha_not_observed",
    "service_command_not_bound",
    "implementation_source_hash_not_observed",
    "evaluator_source_hash_not_observed",
  ] as const);

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CLAIM_LOCKS = Object.freeze({
  serverAuthorizedOutputRootEstablished: false as const,
  sameUserMutationExclusionEstablished: false as const,
  candidateManifestAuthority: false as const,
  scientificPresealAuthority: false as const,
  replayAuthority: false as const,
  independentAgreement: false as const,
  semiclassicalStressNoiseLamp: false as const,
  constraintClosureLamp: false as const,
  theoryGraphPromotion: false as const,
  theoryClosure: false as const,
  physicalViability: false as const,
  propulsion: false as const,
  transport: false as const,
  routeEta: false as const,
  certifiedSpeed: false as const,
  empiricalValidation: false as const,
});

export type Nhm2SemiclassicalV2MetricDemandPointV1 = readonly [
  number,
  number,
  number,
];

export const buildNhm2SemiclassicalV2MetricDemandSamplePoints = (): readonly Nhm2SemiclassicalV2MetricDemandPointV1[] => {
  const points: Nhm2SemiclassicalV2MetricDemandPointV1[] = [];
  const scale = NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLING.coordinateScaleM;
  for (const z of NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLING.coordinateMultipliers) {
    for (const y of NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLING.coordinateMultipliers) {
      for (const x of NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLING.coordinateMultipliers) {
        points.push(Object.freeze([x * scale, y * scale, z * scale] as const));
      }
    }
  }
  return Object.freeze(points);
};

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLE_POINTS =
  buildNhm2SemiclassicalV2MetricDemandSamplePoints();

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON requires finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (typeof value !== "object" || value === undefined) {
    throw new TypeError("canonical JSON requires JSON values");
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CONFIGURATION = Object.freeze({
  configurationId: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_PRODUCER_CONFIGURATION_ID,
  geometry: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_GEOMETRY,
  sampling: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLING,
  samplePointsM: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SAMPLE_POINTS,
  evaluator: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_EVALUATOR,
  minimumMetricDemandFrobeniusSI:
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI,
  requiredMetricDemandSampleFraction:
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.requiredMetricDemandSampleFraction,
  semanticLimits: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SEMANTIC_LIMITS,
});

export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CONFIGURATION_SHA256 =
  createHash("sha256")
    .update(canonicalJson(NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CONFIGURATION), "utf8")
    .digest("hex");

export type Nhm2SemiclassicalV2MetricDemandProducerReceiptV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_PRODUCER_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_PRODUCER_CONTRACT_VERSION;
  authority: "server_owned_geometry_only_reduced_order";
  status: "diagnostic_metric_demand_bytes_persisted_and_securely_reread";
  generatedAt: string;
  configuration: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CONFIGURATION;
  configurationSha256: string;
  execution: {
    invocationId: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    gitSha: null;
    command: null;
    argv: null;
    implementationSourceSha256: null;
    evaluatorSourceSha256: null;
    runProvenanceState: "partial_server_observation";
    provenanceBlockers: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RUN_PROVENANCE_BLOCKERS;
  };
  provenance: {
    inputMode: "frozen_geometry_only";
    sourceTensorInputsAccepted: false;
    sourceTensorRead: false;
    declaredLeverTensorRead: false;
    quantumStateRead: false;
    routeIdBySample: string[];
    modelTermAdmissionBySample: string[];
    routeFallbackObserved: false;
  };
  nondegeneracy: {
    algorithm: "stable_scaled_symmetric_tensor_frobenius_per_sample_float64_v1";
    minimumMetricDemandFrobeniusSI: number;
    requiredNondegenerateSampleFraction: 1;
    observedNondegenerateSampleCount: 64;
    observedNondegenerateSampleFraction: 1;
    minimumObservedFrobeniusSI: number;
    maximumObservedFrobeniusSI: number;
  };
  output: {
    absolutePath: string;
    fileName: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_OUTPUT_FILE_NAME;
    sha256: string;
    sizeBytes: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SIZE_BYTES;
    dtype: "float64";
    binaryEncoding: "raw_ieee754";
    endianness: "little";
    shape: readonly [64, 10];
    storageOrder: "row-major";
    componentOrder: readonly string[];
    unit: "J/m^3";
    prestate: "absent_observed_before_create";
    creation: "directory_and_file_created_exclusively";
    freshness: "new";
    secureReadbackVerified: true;
    exactFloat64RoundTripVerified: true;
    filesystemIdentity: {
      dev: string;
      ino: string;
      sizeBytes: string;
      mtimeNs: string;
      ctimeNs: string;
    };
  };
  semanticLimits: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SEMANTIC_LIMITS;
  claimLocks: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CLAIM_LOCKS;
  receiptHashAlgorithm: "sha256";
  receiptCanonicalization: "utf8_lexicographic_object_keys_json_v1";
  receiptSha256: string;
};

type UnsignedReceipt = Omit<
  Nhm2SemiclassicalV2MetricDemandProducerReceiptV1,
  "receiptSha256"
>;

export const computeNhm2SemiclassicalV2MetricDemandProducerReceiptSha256 = (
  receipt: UnsignedReceipt,
): string =>
  createHash("sha256").update(canonicalJson(receipt), "utf8").digest("hex");

export const hasValidNhm2SemiclassicalV2MetricDemandProducerReceiptIntegrity = (
  value: unknown,
): value is Nhm2SemiclassicalV2MetricDemandProducerReceiptV1 => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
  const receipt = value as Nhm2SemiclassicalV2MetricDemandProducerReceiptV1;
  if (
    receipt.artifactId !== NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_PRODUCER_ARTIFACT_ID ||
    receipt.contractVersion !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_PRODUCER_CONTRACT_VERSION ||
    receipt.authority !== "server_owned_geometry_only_reduced_order" ||
    receipt.status !==
      "diagnostic_metric_demand_bytes_persisted_and_securely_reread" ||
    receipt.configurationSha256 !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CONFIGURATION_SHA256 ||
    JSON.stringify(receipt.configuration) !==
      JSON.stringify(NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CONFIGURATION) ||
    !Number.isFinite(Date.parse(receipt.generatedAt)) ||
    !/^[a-f0-9]{64}$/.test(receipt.execution?.invocationId ?? "") ||
    receipt.execution?.gitSha !== null ||
    receipt.execution.command !== null ||
    receipt.execution.argv !== null ||
    receipt.execution.implementationSourceSha256 !== null ||
    receipt.execution.evaluatorSourceSha256 !== null ||
    receipt.execution.runProvenanceState !== "partial_server_observation" ||
    JSON.stringify(receipt.execution.provenanceBlockers) !==
      JSON.stringify(
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RUN_PROVENANCE_BLOCKERS,
      ) ||
    !Number.isFinite(receipt.execution.durationMs) ||
    receipt.execution.durationMs < 0 ||
    !Number.isFinite(Date.parse(receipt.execution.startedAt)) ||
    !Number.isFinite(Date.parse(receipt.execution.completedAt)) ||
    Date.parse(receipt.execution.startedAt) >
      Date.parse(receipt.execution.completedAt) ||
    receipt.receiptHashAlgorithm !== "sha256" ||
    receipt.receiptCanonicalization !==
      "utf8_lexicographic_object_keys_json_v1" ||
    !/^[a-f0-9]{64}$/.test(receipt.receiptSha256) ||
    receipt.output?.sha256 == null ||
    !/^[a-f0-9]{64}$/.test(receipt.output.sha256) ||
    receipt.output.sizeBytes !== NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SIZE_BYTES ||
    receipt.output.prestate !== "absent_observed_before_create" ||
    receipt.output.creation !== "directory_and_file_created_exclusively" ||
    receipt.output.freshness !== "new" ||
    JSON.stringify(receipt.output.shape) !== JSON.stringify([64, 10]) ||
    JSON.stringify(receipt.output.componentOrder) !==
      JSON.stringify(NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_EVALUATOR.componentOrder) ||
    receipt.output.secureReadbackVerified !== true ||
    receipt.output.exactFloat64RoundTripVerified !== true ||
    receipt.nondegeneracy?.observedNondegenerateSampleCount !== 64 ||
    receipt.nondegeneracy.observedNondegenerateSampleFraction !== 1 ||
    !Number.isFinite(receipt.nondegeneracy.minimumObservedFrobeniusSI) ||
    receipt.nondegeneracy.minimumObservedFrobeniusSI <=
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CONFIGURATION.minimumMetricDemandFrobeniusSI ||
    !Number.isFinite(receipt.nondegeneracy.maximumObservedFrobeniusSI) ||
    receipt.nondegeneracy.maximumObservedFrobeniusSI <
      receipt.nondegeneracy.minimumObservedFrobeniusSI ||
    receipt.provenance?.routeFallbackObserved !== false ||
    receipt.provenance.sourceTensorInputsAccepted !== false ||
    receipt.provenance.sourceTensorRead !== false ||
    receipt.provenance.declaredLeverTensorRead !== false ||
    receipt.provenance.quantumStateRead !== false ||
    receipt.provenance.routeIdBySample?.length !== 64 ||
    receipt.provenance.routeIdBySample.some(
      (route) => route !== NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_EXPECTED_ROUTE_ID,
    ) ||
    receipt.provenance.modelTermAdmissionBySample?.length !== 64 ||
    receipt.provenance.modelTermAdmissionBySample.some(
      (admission) => admission !== "experimental_not_admitted",
    ) ||
    JSON.stringify(receipt.semanticLimits) !==
      JSON.stringify(NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_SEMANTIC_LIMITS) ||
    JSON.stringify(receipt.claimLocks) !==
      JSON.stringify(NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_CLAIM_LOCKS)
  ) {
    return false;
  }
  const { receiptSha256, ...unsigned } = receipt;
  try {
    return (
      receiptSha256 ===
      computeNhm2SemiclassicalV2MetricDemandProducerReceiptSha256(unsigned)
    );
  } catch {
    return false;
  }
};
