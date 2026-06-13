import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_REGIONAL_SUPPORT_FUNCTION_ATLAS_ARTIFACT_TYPE =
  "nhm2_regional_support_function_atlas/v1";
export const NHM2_REGIONAL_SUPPORT_FUNCTION_ATLAS_SCHEMA_VERSION = "1.0.0";

export const NHM2_REGIONAL_SUPPORT_FUNCTION_REGION_IDS = [
  "global",
  "hull",
  "wall",
  "exterior_shell",
  "hull_wall_transition",
  "wall_exterior_transition",
] as const;

export type Nhm2RegionalSupportFunctionRegionId =
  (typeof NHM2_REGIONAL_SUPPORT_FUNCTION_REGION_IDS)[number];

export type Nhm2RegionalSupportFunctionRegionV1 = {
  regionId: Nhm2RegionalSupportFunctionRegionId;
  semanticRole: "closure_region" | "transition_region" | "global_region";
  maskRef: string;
  supportFunctionRef: string;
  sampleCount: number;
  supportStats: {
    minWeight: number;
    maxWeight: number;
    meanWeight: number;
    nonzeroFraction: number;
    effectiveVolume?: number;
  };
  aggregationPolicy: {
    weighting: "support_weighted" | "mask_mean" | "global_weighted";
    normalization: "sum_weights" | "sample_count" | "volume";
    includeTransitionSamples: boolean;
  };
};

export type Nhm2RegionalSupportFunctionTransitionKernelV1 = {
  kernelId: string;
  fromRegion: Nhm2RegionalSourceClosureRegionId;
  toRegion: Nhm2RegionalSourceClosureRegionId;
  supportRegion: Extract<
    Nhm2RegionalSupportFunctionRegionId,
    "hull_wall_transition" | "wall_exterior_transition"
  >;
  kernelKind:
    | "smoothstep_c1"
    | "smootherstep_c2"
    | "compact_bump"
    | "declared_reduced_order";
  smoothnessClass: "C0" | "C1" | "C2" | "Cinf";
  widthMeters: number;
  derivativeTermsAvailable: boolean;
  derivativeRef?: string;
};

export type Nhm2RegionalSupportFunctionAtlasV1 = {
  artifactType: typeof NHM2_REGIONAL_SUPPORT_FUNCTION_ATLAS_ARTIFACT_TYPE;
  schemaVersion: typeof NHM2_REGIONAL_SUPPORT_FUNCTION_ATLAS_SCHEMA_VERSION;
  runIdentity: {
    runId: string;
    profileId: string;
    chartId: string;
    metricRef: string;
    sourceModelRef?: string;
    gridRef: string;
    samplePlanRef: string;
    createdAt: string;
  };
  basisAndUnits: {
    tensorBasis: "chart" | "local_orthonormal_to_chart";
    coordinateSystem: string;
    lengthUnit: string;
    energyDensityUnit: string;
    stressEnergyConvention: string;
    signatureConvention: string;
  };
  regions: Record<
    Nhm2RegionalSupportFunctionRegionId,
    Nhm2RegionalSupportFunctionRegionV1
  >;
  transitionKernels: Nhm2RegionalSupportFunctionTransitionKernelV1[];
  partitionOfUnity: {
    appliesTo: Nhm2RegionalSourceClosureRegionId[];
    sumWeightsMean: number;
    sumWeightsMaxAbsError: number;
    negativeWeightMin: number;
    overlapPolicy: "partition_of_unity" | "explicit_overlap_allowed";
    status: "pass" | "review" | "fail";
  };
  derivativeSupport: {
    partialMuWAvailable: boolean;
    covariantDerivativeSupportAvailable: boolean;
    derivativeBasis: "chart";
    derivativeRef?: string;
    transitionDerivativeTermsRequired: true;
  };
  provenance: {
    generatedFrom: string[];
    inputHashes: Record<string, string>;
    atlasHash: string;
    targetTensorHash?: string;
    targetEchoForbidden: true;
    targetDerivedFieldsUsed: false;
  };
  eligibility: {
    atlasAvailable: true;
    sameRunIdentityAvailable: boolean;
    sameBasisMetadataAvailable: boolean;
    downstreamConsumersRequired: string[];
    atlasEligibleForClosureHarness: boolean;
  };
  claimBoundary: {
    diagnosticOnly: true;
    atlasDoesNotFitPhysicsNumbers: true;
    atlasDoesNotValidateMaterialSource: true;
    physicalTransportClaimAllowed: false;
  };
};

export type BuildNhm2RegionalSupportFunctionAtlasInput = Omit<
  Nhm2RegionalSupportFunctionAtlasV1,
  "artifactType" | "schemaVersion" | "eligibility" | "claimBoundary"
>;

export type Nhm2AtlasConsumerIdentity = {
  atlasRef?: string | null;
  atlasHash?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || isText(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isRegionId = (value: unknown): value is Nhm2RegionalSupportFunctionRegionId =>
  NHM2_REGIONAL_SUPPORT_FUNCTION_REGION_IDS.includes(
    value as Nhm2RegionalSupportFunctionRegionId,
  );

const isClosureRegionId = (
  value: unknown,
): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const allRegionRecordsPresent = (
  regions: Record<Nhm2RegionalSupportFunctionRegionId, Nhm2RegionalSupportFunctionRegionV1>,
): boolean =>
  NHM2_REGIONAL_SUPPORT_FUNCTION_REGION_IDS.every(
    (regionId) => regions[regionId]?.regionId === regionId,
  );

export const buildNhm2RegionalSupportFunctionAtlas = (
  input: BuildNhm2RegionalSupportFunctionAtlasInput,
): Nhm2RegionalSupportFunctionAtlasV1 => {
  const sameRunIdentityAvailable =
    isText(input.runIdentity.runId) &&
    isText(input.runIdentity.profileId) &&
    isText(input.runIdentity.chartId) &&
    isText(input.runIdentity.metricRef) &&
    isText(input.runIdentity.gridRef) &&
    isText(input.runIdentity.samplePlanRef);
  const sameBasisMetadataAvailable =
    isText(input.basisAndUnits.coordinateSystem) &&
    isText(input.basisAndUnits.lengthUnit) &&
    isText(input.basisAndUnits.energyDensityUnit) &&
    isText(input.basisAndUnits.stressEnergyConvention) &&
    isText(input.basisAndUnits.signatureConvention);
  const atlasEligibleForClosureHarness =
    sameRunIdentityAvailable &&
    sameBasisMetadataAvailable &&
    allRegionRecordsPresent(input.regions) &&
    input.partitionOfUnity.status === "pass";
  return {
    artifactType: NHM2_REGIONAL_SUPPORT_FUNCTION_ATLAS_ARTIFACT_TYPE,
    schemaVersion: NHM2_REGIONAL_SUPPORT_FUNCTION_ATLAS_SCHEMA_VERSION,
    ...input,
    eligibility: {
      atlasAvailable: true,
      sameRunIdentityAvailable,
      sameBasisMetadataAvailable,
      downstreamConsumersRequired: [
        "regional_source_closure_evidence",
        "regional_source_transition_kernel",
        "tile_counterpart_conservation",
        "qei_worldline_dossier",
        "observer_robust_energy_conditions",
        "coupled_closure_pass_candidate",
        "regional_tensor_pass_path_harness",
      ],
      atlasEligibleForClosureHarness,
    },
    claimBoundary: {
      diagnosticOnly: true,
      atlasDoesNotFitPhysicsNumbers: true,
      atlasDoesNotValidateMaterialSource: true,
      physicalTransportClaimAllowed: false,
    },
  };
};

const isRegion = (value: unknown): value is Nhm2RegionalSupportFunctionRegionV1 => {
  const record = isRecord(value) ? value : null;
  const stats = isRecord(record?.supportStats) ? record?.supportStats : null;
  const aggregation = isRecord(record?.aggregationPolicy)
    ? record?.aggregationPolicy
    : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    (record.semanticRole === "closure_region" ||
      record.semanticRole === "transition_region" ||
      record.semanticRole === "global_region") &&
    isText(record.maskRef) &&
    isText(record.supportFunctionRef) &&
    isFiniteNumber(record.sampleCount) &&
    stats != null &&
    isFiniteNumber(stats.minWeight) &&
    isFiniteNumber(stats.maxWeight) &&
    isFiniteNumber(stats.meanWeight) &&
    isFiniteNumber(stats.nonzeroFraction) &&
    (stats.effectiveVolume === undefined || isFiniteNumber(stats.effectiveVolume)) &&
    aggregation != null &&
    (aggregation.weighting === "support_weighted" ||
      aggregation.weighting === "mask_mean" ||
      aggregation.weighting === "global_weighted") &&
    (aggregation.normalization === "sum_weights" ||
      aggregation.normalization === "sample_count" ||
      aggregation.normalization === "volume") &&
    typeof aggregation.includeTransitionSamples === "boolean"
  );
};

const isTransitionKernel = (
  value: unknown,
): value is Nhm2RegionalSupportFunctionTransitionKernelV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isText(record.kernelId) &&
    isClosureRegionId(record.fromRegion) &&
    isClosureRegionId(record.toRegion) &&
    (record.supportRegion === "hull_wall_transition" ||
      record.supportRegion === "wall_exterior_transition") &&
    (record.kernelKind === "smoothstep_c1" ||
      record.kernelKind === "smootherstep_c2" ||
      record.kernelKind === "compact_bump" ||
      record.kernelKind === "declared_reduced_order") &&
    (record.smoothnessClass === "C0" ||
      record.smoothnessClass === "C1" ||
      record.smoothnessClass === "C2" ||
      record.smoothnessClass === "Cinf") &&
    isFiniteNumber(record.widthMeters) &&
    typeof record.derivativeTermsAvailable === "boolean" &&
    (record.derivativeRef === undefined || isText(record.derivativeRef))
  );
};

export const getNhm2RegionalSupportFunctionAtlasHash = (
  value: unknown,
): string | null => {
  const record = isRecord(value) ? value : null;
  const provenance = isRecord(record?.provenance) ? record?.provenance : null;
  return isText(provenance?.atlasHash) ? provenance.atlasHash : null;
};

export const getNhm2AtlasConsumerHash = (value: unknown): string | null => {
  const record = isRecord(value) ? value : null;
  return isText(record?.atlasHash) ? record.atlasHash : null;
};

export const isNhm2RegionalSupportFunctionAtlas = (
  value: unknown,
): value is Nhm2RegionalSupportFunctionAtlasV1 => {
  const record = isRecord(value) ? value : null;
  const runIdentity = isRecord(record?.runIdentity) ? record?.runIdentity : null;
  const basisAndUnits = isRecord(record?.basisAndUnits) ? record?.basisAndUnits : null;
  const regions = isRecord(record?.regions) ? record?.regions : null;
  const partition = isRecord(record?.partitionOfUnity)
    ? record?.partitionOfUnity
    : null;
  const derivativeSupport = isRecord(record?.derivativeSupport)
    ? record?.derivativeSupport
    : null;
  const provenance = isRecord(record?.provenance) ? record?.provenance : null;
  const inputHashes = isRecord(provenance?.inputHashes)
    ? provenance?.inputHashes
    : null;
  const eligibility = isRecord(record?.eligibility) ? record?.eligibility : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  return (
    record != null &&
    record.artifactType === NHM2_REGIONAL_SUPPORT_FUNCTION_ATLAS_ARTIFACT_TYPE &&
    record.schemaVersion === NHM2_REGIONAL_SUPPORT_FUNCTION_ATLAS_SCHEMA_VERSION &&
    runIdentity != null &&
    isText(runIdentity.runId) &&
    isText(runIdentity.profileId) &&
    isText(runIdentity.chartId) &&
    isText(runIdentity.metricRef) &&
    isNullableText(runIdentity.sourceModelRef) &&
    isText(runIdentity.gridRef) &&
    isText(runIdentity.samplePlanRef) &&
    isText(runIdentity.createdAt) &&
    basisAndUnits != null &&
    (basisAndUnits.tensorBasis === "chart" ||
      basisAndUnits.tensorBasis === "local_orthonormal_to_chart") &&
    isText(basisAndUnits.coordinateSystem) &&
    isText(basisAndUnits.lengthUnit) &&
    isText(basisAndUnits.energyDensityUnit) &&
    isText(basisAndUnits.stressEnergyConvention) &&
    isText(basisAndUnits.signatureConvention) &&
    regions != null &&
    NHM2_REGIONAL_SUPPORT_FUNCTION_REGION_IDS.every(
      (regionId) => isRegion(regions[regionId]),
    ) &&
    Array.isArray(record.transitionKernels) &&
    record.transitionKernels.every(isTransitionKernel) &&
    partition != null &&
    Array.isArray(partition.appliesTo) &&
    partition.appliesTo.every(isClosureRegionId) &&
    isFiniteNumber(partition.sumWeightsMean) &&
    isFiniteNumber(partition.sumWeightsMaxAbsError) &&
    isFiniteNumber(partition.negativeWeightMin) &&
    (partition.overlapPolicy === "partition_of_unity" ||
      partition.overlapPolicy === "explicit_overlap_allowed") &&
    (partition.status === "pass" ||
      partition.status === "review" ||
      partition.status === "fail") &&
    derivativeSupport != null &&
    typeof derivativeSupport.partialMuWAvailable === "boolean" &&
    typeof derivativeSupport.covariantDerivativeSupportAvailable === "boolean" &&
    derivativeSupport.derivativeBasis === "chart" &&
    isNullableText(derivativeSupport.derivativeRef) &&
    derivativeSupport.transitionDerivativeTermsRequired === true &&
    provenance != null &&
    Array.isArray(provenance.generatedFrom) &&
    provenance.generatedFrom.every(isText) &&
    inputHashes != null &&
    Object.values(inputHashes).every(isText) &&
    isText(provenance.atlasHash) &&
    isNullableText(provenance.targetTensorHash) &&
    provenance.targetEchoForbidden === true &&
    provenance.targetDerivedFieldsUsed === false &&
    eligibility != null &&
    eligibility.atlasAvailable === true &&
    typeof eligibility.sameRunIdentityAvailable === "boolean" &&
    typeof eligibility.sameBasisMetadataAvailable === "boolean" &&
    Array.isArray(eligibility.downstreamConsumersRequired) &&
    eligibility.downstreamConsumersRequired.every(isText) &&
    typeof eligibility.atlasEligibleForClosureHarness === "boolean" &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.atlasDoesNotFitPhysicsNumbers === true &&
    claimBoundary?.atlasDoesNotValidateMaterialSource === true &&
    claimBoundary?.physicalTransportClaimAllowed === false
  );
};
