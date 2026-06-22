import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";
import type {
  Nhm2TileSourceEvidenceTier,
  Nhm2TileSourceFullApparatusTensorEvidenceV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_VALUES_CONTRACT_VERSION =
  "nhm2_tile_source_full_apparatus_tensor_values/v1";

export const NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const satisfies readonly Nhm2TensorComponent[];

export const NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS = [
  "supportStructureStressEnergy",
  "spacerContactStressEnergy",
  "activeControlFieldEnergy",
  "thermalLoadStressEnergy",
  "patchPotentialElectrostaticStress",
  "fatigueDamageEvolution",
  "layerScalingCrossTerms",
  "casimirInteractionStressEnergy",
  "materialStrainEnergy",
] as const;

export type Nhm2FullApparatusTensorTermId =
  (typeof NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS)[number];

export type Nhm2FullApparatusTensorValueStatus =
  | "computed"
  | "measured"
  | "validated_simulation"
  | "proxy"
  | "missing"
  | "blocked";

export type Nhm2FullApparatusComponentAuthority =
  | "source_model"
  | "constitutive_model"
  | "measured_or_simulated"
  | "scalar_proxy"
  | "metric_echo"
  | "missing";

export type Nhm2FullApparatusTensorValueRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "computed" | "partial" | "missing" | "blocked";
  tensor: Nhm2RegionalTensor;
  componentStatus: Partial<
    Record<Nhm2TensorComponent, Nhm2FullApparatusTensorValueStatus>
  >;
  componentAuthority: Partial<
    Record<Nhm2TensorComponent, Nhm2FullApparatusComponentAuthority>
  >;
  termContributions: Partial<Record<Nhm2FullApparatusTensorTermId, Nhm2RegionalTensor>>;
  chartRef: "comoving_cartesian" | string;
  basisRef: "same_basis" | "unknown" | string;
  unitsRef: "J/m^3" | string;
  regionSupportRef: string | null;
  aggregationMode: "support_weighted" | "volume_integral" | "sample_mean" | "unknown";
  normalizationBasis: "sample_count" | "volume" | "area" | "unknown";
  sampleCount: number | null;
  valueReceiptRef: string | null;
  blockers: string[];
  warnings: string[];
};

export type Nhm2TileSourceFullApparatusTensorValuesV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_VALUES_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  artifactRef: string | null;
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
    fullApparatusTensorEvidenceRef: string | null;
    apparatusModelRef: string | null;
    atlasRef: string | null;
  };
  sourceSideOnly: true;
  notDerivedFromMetricRequiredTensor: true;
  targetEchoForbidden: true;
  targetDerivedFieldsUsed: false;
  chartId: "comoving_cartesian" | string;
  basisRef: "same_basis" | "unknown" | string;
  unitsRef: "J/m^3" | string;
  regions: Nhm2FullApparatusTensorValueRegionV1[];
  summary: {
    allRequiredRegionsPresent: boolean;
    allRequiredRegionsFullTensor: boolean;
    allRequiredRegionsTermComplete: boolean;
    allRequiredRegionsSameBasis: boolean;
    allRequiredRegionsHaveValueReceipts: boolean;
    anyMetricEchoComponent: boolean;
    anyScalarProxyComponent: boolean;
    anyMissingComponent: boolean;
    missingRegionIds: Nhm2RegionalSourceClosureRegionId[];
    missingComponentRefs: string[];
    missingTermRefs: string[];
    missingTermComponentRefs: string[];
    termBalanceMaxAbsResidualSI: number | null;
    termBalanceMaxRelativeResidual: number | null;
    termBalanceToleranceRelative: number;
    valueArtifactReadyForReceipt: boolean;
    firstBlocker: string;
  };
  claimBoundary: {
    diagnosticOnly: true;
    tensorValuesOnly: true;
    valueArtifactDoesNotValidateMaterialMechanism: true;
    sourceSideOnlyRequired: true;
    metricEchoForbidden: true;
    downstreamResidualConservationQeiObserverStillRequired: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceFullApparatusTensorValuesInput = Omit<
  Nhm2TileSourceFullApparatusTensorValuesV1,
  "contractVersion" | "summary" | "claimBoundary"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const finiteTensorValue = (
  tensor: Nhm2RegionalTensor,
  componentId: Nhm2TensorComponent,
): number | null => {
  const value = tensor[componentId];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const TERM_BALANCE_RELATIVE_TOLERANCE = 1e-9;

const termComponentSum = (
  region: Nhm2FullApparatusTensorValueRegionV1,
  componentId: Nhm2TensorComponent,
): number | null => {
  let sum = 0;
  for (const termId of NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS) {
    const contribution = region.termContributions[termId];
    if (contribution == null) return null;
    const value = finiteTensorValue(contribution, componentId);
    if (value == null) return null;
    sum += value;
  }
  return sum;
};

const missingComponents = (region: Nhm2FullApparatusTensorValueRegionV1): string[] =>
  NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.filter((componentId) => {
    const status = region.componentStatus[componentId];
    return (
      finiteTensorValue(region.tensor, componentId) == null ||
      status == null ||
      status === "missing" ||
      status === "blocked"
    );
  }).map((componentId) => `${region.regionId}:${componentId}`);

const missingTerms = (region: Nhm2FullApparatusTensorValueRegionV1): string[] =>
  NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS.filter((termId) => {
    const contribution = region.termContributions[termId];
    if (contribution == null) return true;
    return NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.every(
      (componentId) => finiteTensorValue(contribution, componentId) == null,
    );
  }).map((termId) => `${region.regionId}:${termId}`);

const missingTermComponents = (region: Nhm2FullApparatusTensorValueRegionV1): string[] =>
  NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS.flatMap((termId) => {
    const contribution = region.termContributions[termId];
    if (contribution == null) {
      return NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.map(
        (componentId) => `${region.regionId}:${termId}:${componentId}`,
      );
    }
    return NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.filter(
      (componentId) => finiteTensorValue(contribution, componentId) == null,
    ).map((componentId) => `${region.regionId}:${termId}:${componentId}`);
  });

const termBalanceResiduals = (
  region: Nhm2FullApparatusTensorValueRegionV1,
): Array<{
  componentId: Nhm2TensorComponent;
  absResidual: number;
  relativeResidual: number;
}> =>
  NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.flatMap((componentId) => {
    const total = finiteTensorValue(region.tensor, componentId);
    const termSum = termComponentSum(region, componentId);
    if (total == null || termSum == null) return [];
    const absResidual = Math.abs(total - termSum);
    const denominator = Math.max(Math.abs(total), Math.abs(termSum), 1);
    return [
      {
        componentId,
        absResidual,
        relativeResidual: absResidual / denominator,
      },
    ];
  });

const termBalanceBlockers = (region: Nhm2FullApparatusTensorValueRegionV1): string[] =>
  termBalanceResiduals(region)
    .filter((entry) => entry.relativeResidual > TERM_BALANCE_RELATIVE_TOLERANCE)
    .map(
      (entry) =>
        `${region.regionId}:${entry.componentId}:term_sum_balance_residual_exceeds_tolerance`,
    );

const regionBlockers = (region: Nhm2FullApparatusTensorValueRegionV1): string[] => {
  const missing = missingComponents(region);
  const terms = missingTerms(region);
  const metricEcho = NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.filter(
    (componentId) => region.componentAuthority[componentId] === "metric_echo",
  );
  const scalarProxy = NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.filter(
    (componentId) => region.componentAuthority[componentId] === "scalar_proxy",
  );
  return [
    ...region.blockers,
    ...(region.regionSupportRef == null ? [`${region.regionId}:region_support_ref_missing`] : []),
    ...(region.valueReceiptRef == null ? [`${region.regionId}:value_receipt_ref_missing`] : []),
    ...(region.chartRef !== "comoving_cartesian" ? [`${region.regionId}:chart_mismatch`] : []),
    ...(region.basisRef !== "same_basis" ? [`${region.regionId}:basis_mismatch`] : []),
    ...(region.unitsRef !== "J/m^3" ? [`${region.regionId}:units_mismatch`] : []),
    ...(region.aggregationMode === "unknown" ? [`${region.regionId}:aggregation_unknown`] : []),
    ...(region.normalizationBasis === "unknown"
      ? [`${region.regionId}:normalization_unknown`]
      : []),
    ...(region.sampleCount == null ? [`${region.regionId}:sample_count_missing`] : []),
    ...missing.map((componentRef) => `${componentRef}:component_value_missing`),
    ...terms.map((termRef) => `${termRef}:term_contribution_missing`),
    ...missingTermComponents(region).map(
      (termComponentRef) => `${termComponentRef}:term_component_value_missing`,
    ),
    ...termBalanceBlockers(region),
    ...metricEcho.map((componentId) => `${region.regionId}:${componentId}:metric_echo_forbidden`),
    ...scalarProxy.map((componentId) => `${region.regionId}:${componentId}:scalar_proxy_forbidden`),
  ];
};

export const buildNhm2TileSourceFullApparatusTensorValues = (
  input: BuildNhm2TileSourceFullApparatusTensorValuesInput,
): Nhm2TileSourceFullApparatusTensorValuesV1 => {
  const presentRegionIds = new Set(input.regions.map((region) => region.regionId));
  const missingRegionIds = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.filter(
    (regionId) => !presentRegionIds.has(regionId),
  );
  const regionBlockerRows = input.regions.flatMap(regionBlockers);
  const missingComponentRefs = input.regions.flatMap(missingComponents);
  const missingTermRefs = input.regions.flatMap(missingTerms);
  const missingTermComponentRefs = input.regions.flatMap(missingTermComponents);
  const balanceResiduals = input.regions.flatMap(termBalanceResiduals);
  const termBalanceMaxAbsResidualSI =
    balanceResiduals.length === 0
      ? null
      : Math.max(...balanceResiduals.map((entry) => entry.absResidual));
  const termBalanceMaxRelativeResidual =
    balanceResiduals.length === 0
      ? null
      : Math.max(...balanceResiduals.map((entry) => entry.relativeResidual));
  const allRequiredRegionsPresent = missingRegionIds.length === 0;
  const allRequiredRegionsFullTensor = missingComponentRefs.length === 0;
  const allRequiredRegionsTermComplete =
    missingTermRefs.length === 0 && missingTermComponentRefs.length === 0;
  const allRequiredRegionsSameBasis = input.regions.every(
    (region) =>
      region.chartRef === "comoving_cartesian" &&
      region.basisRef === "same_basis" &&
      region.unitsRef === "J/m^3",
  );
  const allRequiredRegionsHaveValueReceipts = input.regions.every(
    (region) => region.valueReceiptRef != null && region.regionSupportRef != null,
  );
  const anyMetricEchoComponent = input.regions.some((region) =>
    Object.values(region.componentAuthority).includes("metric_echo"),
  );
  const anyScalarProxyComponent = input.regions.some((region) =>
    Object.values(region.componentAuthority).includes("scalar_proxy"),
  );
  const anyMissingComponent = missingComponentRefs.length > 0;
  const topLevelBlockers = [
    ...(input.sourceSideOnly !== true ? ["source_side_only_not_asserted"] : []),
    ...(input.notDerivedFromMetricRequiredTensor !== true
      ? ["not_derived_from_metric_required_tensor_not_asserted"]
      : []),
    ...(input.targetEchoForbidden !== true ? ["target_echo_forbidden_not_asserted"] : []),
    ...(input.targetDerivedFieldsUsed !== false ? ["target_derived_fields_used"] : []),
    ...(input.chartId !== "comoving_cartesian" ? ["artifact_chart_mismatch"] : []),
    ...(input.basisRef !== "same_basis" ? ["artifact_basis_mismatch"] : []),
    ...(input.unitsRef !== "J/m^3" ? ["artifact_units_mismatch"] : []),
    ...missingRegionIds.map((regionId) => `${regionId}:region_missing`),
    ...regionBlockerRows,
  ];
  return {
    ...input,
    contractVersion: NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_VALUES_CONTRACT_VERSION,
    sourceSideOnly: true,
    notDerivedFromMetricRequiredTensor: true,
    targetEchoForbidden: true,
    targetDerivedFieldsUsed: false,
    summary: {
      allRequiredRegionsPresent,
      allRequiredRegionsFullTensor,
      allRequiredRegionsTermComplete,
      allRequiredRegionsSameBasis,
      allRequiredRegionsHaveValueReceipts,
      anyMetricEchoComponent,
      anyScalarProxyComponent,
      anyMissingComponent,
      missingRegionIds,
      missingComponentRefs,
      missingTermRefs,
      missingTermComponentRefs,
      termBalanceMaxAbsResidualSI,
      termBalanceMaxRelativeResidual,
      termBalanceToleranceRelative: TERM_BALANCE_RELATIVE_TOLERANCE,
      valueArtifactReadyForReceipt: topLevelBlockers.length === 0,
      firstBlocker: topLevelBlockers[0] ?? "none",
    },
    claimBoundary: {
      diagnosticOnly: true,
      tensorValuesOnly: true,
      valueArtifactDoesNotValidateMaterialMechanism: true,
      sourceSideOnlyRequired: true,
      metricEchoForbidden: true,
      downstreamResidualConservationQeiObserverStillRequired: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const buildFullApparatusTensorEvidenceFromTensorValues = (args: {
  artifact: Nhm2TileSourceFullApparatusTensorValuesV1;
  evidenceTier: Extract<Nhm2TileSourceEvidenceTier, "measured" | "validated_simulation">;
  evidenceRef?: string | null;
}): Nhm2TileSourceFullApparatusTensorEvidenceV1 => {
  const artifact = args.artifact;
  const componentAvailable = (componentIds: readonly Nhm2TensorComponent[]): boolean =>
    artifact.summary.valueArtifactReadyForReceipt &&
    artifact.regions.every((region) =>
      componentIds.every(
        (componentId) =>
          finiteTensorValue(region.tensor, componentId) != null &&
          region.componentStatus[componentId] !== "missing" &&
          region.componentStatus[componentId] !== "blocked" &&
          region.componentAuthority[componentId] !== "metric_echo" &&
          region.componentAuthority[componentId] !== "scalar_proxy",
      ),
    );
  const termAvailable = (termId: Nhm2FullApparatusTensorTermId): boolean =>
    artifact.summary.valueArtifactReadyForReceipt &&
    artifact.regions.every((region) => {
      const contribution = region.termContributions[termId];
      return (
        contribution != null &&
        NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.every(
          (componentId) => finiteTensorValue(contribution, componentId) != null,
        )
      );
    });
  const regionAvailable = (regionId: Nhm2RegionalSourceClosureRegionId): boolean =>
    artifact.regions.some((region) => region.regionId === regionId && region.status !== "missing");
  return {
    evidenceTier: args.evidenceTier,
    evidenceRef: args.evidenceRef ?? artifact.artifactRef,
    tensorValueArtifactRef: artifact.artifactRef,
    tensorValueArtifactContract: NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_VALUES_CONTRACT_VERSION,
    sameChart: artifact.chartId === "comoving_cartesian",
    sameBasis: artifact.basisRef === "same_basis",
    sameUnits: artifact.unitsRef === "J/m^3",
    noMetricTargetEcho:
      artifact.notDerivedFromMetricRequiredTensor &&
      artifact.targetEchoForbidden &&
      !artifact.targetDerivedFieldsUsed &&
      !artifact.summary.anyMetricEchoComponent,
    components: {
      T00: componentAvailable(["T00"]),
      T0i: componentAvailable(["T01", "T02", "T03"]),
      diagonalTij: componentAvailable(["T11", "T22", "T33"]),
      offDiagonalTij: componentAvailable(["T12", "T13", "T23"]),
    },
    componentRefs: {
      T00: artifact.summary.missingComponentRefs.some((entry) => entry.endsWith(":T00"))
        ? null
        : `${artifact.artifactRef ?? "artifact://full-apparatus-tmunu/values"}/components/T00`,
      T0i: componentAvailable(["T01", "T02", "T03"])
        ? `${artifact.artifactRef ?? "artifact://full-apparatus-tmunu/values"}/components/T0i`
        : null,
      diagonalTij: componentAvailable(["T11", "T22", "T33"])
        ? `${artifact.artifactRef ?? "artifact://full-apparatus-tmunu/values"}/components/diagonal-Tij`
        : null,
      offDiagonalTij: componentAvailable(["T12", "T13", "T23"])
        ? `${artifact.artifactRef ?? "artifact://full-apparatus-tmunu/values"}/components/off-diagonal-Tij`
        : null,
    },
    componentDetailRefs: Object.fromEntries(
      NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.map((componentId) => [
        componentId,
        componentAvailable([componentId])
          ? `${artifact.artifactRef ?? "artifact://full-apparatus-tmunu/values"}/components/${componentId}`
          : null,
      ]),
    ),
    termCoverage: {
      supportStructureStressEnergy: termAvailable("supportStructureStressEnergy"),
      spacerContactStressEnergy: termAvailable("spacerContactStressEnergy"),
      activeControlFieldEnergy: termAvailable("activeControlFieldEnergy"),
      thermalLoadStressEnergy: termAvailable("thermalLoadStressEnergy"),
      patchPotentialElectrostaticStress: termAvailable("patchPotentialElectrostaticStress"),
      fatigueDamageEvolution: termAvailable("fatigueDamageEvolution"),
      layerScalingCrossTerms: termAvailable("layerScalingCrossTerms"),
      casimirInteractionStressEnergy: termAvailable("casimirInteractionStressEnergy"),
      materialStrainEnergy: termAvailable("materialStrainEnergy"),
    },
    termRefs: Object.fromEntries(
      NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS.map((termId) => [
        termId,
        termAvailable(termId)
          ? `${artifact.artifactRef ?? "artifact://full-apparatus-tmunu/values"}/terms/${termId}`
          : null,
      ]),
    ),
    regionalCoverage: {
      wall: regionAvailable("wall"),
      hull: regionAvailable("hull"),
      exteriorShell: regionAvailable("exterior_shell"),
    },
    regionalSupportRefs: {
      wall: artifact.regions.find((region) => region.regionId === "wall")?.regionSupportRef ?? null,
      hull: artifact.regions.find((region) => region.regionId === "hull")?.regionSupportRef ?? null,
      exteriorShell:
        artifact.regions.find((region) => region.regionId === "exterior_shell")?.regionSupportRef ??
        null,
    },
  };
};

const isComponentStatus = (value: unknown): value is Nhm2FullApparatusTensorValueStatus =>
  value === "computed" ||
  value === "measured" ||
  value === "validated_simulation" ||
  value === "proxy" ||
  value === "missing" ||
  value === "blocked";

const isComponentAuthority = (value: unknown): value is Nhm2FullApparatusComponentAuthority =>
  value === "source_model" ||
  value === "constitutive_model" ||
  value === "measured_or_simulated" ||
  value === "scalar_proxy" ||
  value === "metric_echo" ||
  value === "missing";

const isTensor = (value: unknown): value is Nhm2RegionalTensor => {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(
    ([key, entry]) =>
      NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.includes(key as Nhm2TensorComponent) &&
      isNullableNumber(entry),
  );
};

const isTermContributionMap = (
  value: unknown,
): value is Partial<Record<Nhm2FullApparatusTensorTermId, Nhm2RegionalTensor>> => {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(
    ([key, entry]) =>
      NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS.includes(key as Nhm2FullApparatusTensorTermId) &&
      isTensor(entry),
  );
};

const isRegion = (value: unknown): value is Nhm2FullApparatusTensorValueRegionV1 => {
  if (!isRecord(value)) return false;
  const componentStatus = isRecord(value.componentStatus) ? value.componentStatus : null;
  const componentAuthority = isRecord(value.componentAuthority) ? value.componentAuthority : null;
  return (
    isRegionId(value.regionId) &&
    (value.status === "computed" ||
      value.status === "partial" ||
      value.status === "missing" ||
      value.status === "blocked") &&
    isTensor(value.tensor) &&
    componentStatus != null &&
    Object.entries(componentStatus).every(
      ([key, entry]) =>
        NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.includes(key as Nhm2TensorComponent) &&
        isComponentStatus(entry),
    ) &&
    componentAuthority != null &&
    Object.entries(componentAuthority).every(
      ([key, entry]) =>
        NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.includes(key as Nhm2TensorComponent) &&
        isComponentAuthority(entry),
    ) &&
    isTermContributionMap(value.termContributions) &&
    typeof value.chartRef === "string" &&
    typeof value.basisRef === "string" &&
    typeof value.unitsRef === "string" &&
    isNullableText(value.regionSupportRef) &&
    (value.aggregationMode === "support_weighted" ||
      value.aggregationMode === "volume_integral" ||
      value.aggregationMode === "sample_mean" ||
      value.aggregationMode === "unknown") &&
    (value.normalizationBasis === "sample_count" ||
      value.normalizationBasis === "volume" ||
      value.normalizationBasis === "area" ||
      value.normalizationBasis === "unknown") &&
    isNullableNumber(value.sampleCount) &&
    isNullableText(value.valueReceiptRef) &&
    Array.isArray(value.blockers) &&
    value.blockers.every((entry) => typeof entry === "string") &&
    Array.isArray(value.warnings) &&
    value.warnings.every((entry) => typeof entry === "string")
  );
};

export const isNhm2TileSourceFullApparatusTensorValues = (
  value: unknown,
): value is Nhm2TileSourceFullApparatusTensorValuesV1 => {
  if (!isRecord(value)) return false;
  const sourceRefs = isRecord(value.sourceRefs) ? value.sourceRefs : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_FULL_APPARATUS_TENSOR_VALUES_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isNullableText(value.artifactRef) &&
    sourceRefs != null &&
    isNullableText(sourceRefs.materialEvidenceReceiptsRef) &&
    isNullableText(sourceRefs.fullApparatusTensorEvidenceRef) &&
    isNullableText(sourceRefs.apparatusModelRef) &&
    isNullableText(sourceRefs.atlasRef) &&
    value.sourceSideOnly === true &&
    value.notDerivedFromMetricRequiredTensor === true &&
    value.targetEchoForbidden === true &&
    value.targetDerivedFieldsUsed === false &&
    typeof value.chartId === "string" &&
    typeof value.basisRef === "string" &&
    typeof value.unitsRef === "string" &&
    Array.isArray(value.regions) &&
    value.regions.every(isRegion) &&
    summary != null &&
    typeof summary.allRequiredRegionsPresent === "boolean" &&
    typeof summary.allRequiredRegionsFullTensor === "boolean" &&
    typeof summary.allRequiredRegionsTermComplete === "boolean" &&
    typeof summary.allRequiredRegionsSameBasis === "boolean" &&
    typeof summary.allRequiredRegionsHaveValueReceipts === "boolean" &&
    typeof summary.anyMetricEchoComponent === "boolean" &&
    typeof summary.anyScalarProxyComponent === "boolean" &&
    typeof summary.anyMissingComponent === "boolean" &&
    Array.isArray(summary.missingRegionIds) &&
    summary.missingRegionIds.every(isRegionId) &&
    Array.isArray(summary.missingComponentRefs) &&
    summary.missingComponentRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(summary.missingTermRefs) &&
    summary.missingTermRefs.every((entry) => typeof entry === "string") &&
    Array.isArray(summary.missingTermComponentRefs) &&
    summary.missingTermComponentRefs.every((entry) => typeof entry === "string") &&
    (summary.termBalanceMaxAbsResidualSI === null ||
      (typeof summary.termBalanceMaxAbsResidualSI === "number" &&
        Number.isFinite(summary.termBalanceMaxAbsResidualSI))) &&
    (summary.termBalanceMaxRelativeResidual === null ||
      (typeof summary.termBalanceMaxRelativeResidual === "number" &&
        Number.isFinite(summary.termBalanceMaxRelativeResidual))) &&
    typeof summary.termBalanceToleranceRelative === "number" &&
    Number.isFinite(summary.termBalanceToleranceRelative) &&
    typeof summary.valueArtifactReadyForReceipt === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.tensorValuesOnly === true &&
    boundary.valueArtifactDoesNotValidateMaterialMechanism === true &&
    boundary.sourceSideOnlyRequired === true &&
    boundary.metricEchoForbidden === true &&
    boundary.downstreamResidualConservationQeiObserverStillRequired === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
