import type { CasimirMaterialReceiptStatus } from "./casimir-material-receipt.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_TILE_LOCAL_SOURCE_ELEMENTS_ARTIFACT_ID =
  "nhm2_tile_local_source_elements";
export const NHM2_TILE_LOCAL_SOURCE_ELEMENTS_SCHEMA_VERSION =
  "nhm2_tile_local_source_elements/v1";

export const NHM2_TILE_LOCAL_SOURCE_COMPONENT_STATUS_VALUES = [
  "computed",
  "proxy",
  "missing",
  "blocked",
  "not_applicable",
] as const;

export type Nhm2TileLocalSourceComponentStatus =
  (typeof NHM2_TILE_LOCAL_SOURCE_COMPONENT_STATUS_VALUES)[number];

export type Nhm2TileLocalSourceElementRegionWeights = Partial<
  Record<Nhm2RegionalSourceClosureRegionId, number | null>
>;

export type Nhm2TileLocalSourceElementV1 = {
  tileElementId: string;
  tileBatchId: string;
  sectorId: string | null;
  chartId: "comoving_cartesian" | string;
  positionChartMeters: { x: number; y: number; z: number } | null;
  normalChart: { x: number; y: number; z: number } | null;
  areaMeters2: number | null;
  gapMeters: number | null;
  duty: {
    burstDuty: number | null;
    shipDuty: number | null;
    concurrentSectorFraction: number | null;
    effectiveDuty: number | null;
  };
  qFactor: number | null;
  material: {
    materialStack: string | null;
    materialReceiptRef: string | null;
    materialReceiptStatus: CasimirMaterialReceiptStatus | "missing";
  };
  scalarBudget: {
    idealCasimirEnergyPerAreaSI: number | null;
    idealCasimirEnergyPerTileSI: number | null;
    idealGapEnergyDensitySI: number | null;
    cycleAveragedT00SI: number | null;
    status: Nhm2TileLocalSourceComponentStatus;
  };
  localTensor: Nhm2RegionalTensor;
  componentStatus: Partial<Record<Nhm2TensorComponent, Nhm2TileLocalSourceComponentStatus>>;
  tensorAuthorityMode:
    | "full_tensor"
    | "symmetric_full_tensor"
    | "diagonal_reduced_order"
    | "proxy"
    | "unknown";
  missingComponentIds: Nhm2TensorComponent[];
  regionWeights: Nhm2TileLocalSourceElementRegionWeights;
  provenance: {
    producerModule: string;
    producerFunction: string;
    sourceModelId: string;
    sourceModelVersion: string;
    sourceSideOnly: true;
    notDerivedFromMetricRequiredTensor: true;
    inputRefs: string[];
    approximationMode:
      | "representative_sector_bin"
      | "explicit_tile"
      | "voxelized_tile_lattice"
      | "unknown";
  };
  blockers: string[];
  warnings: string[];
};

export type Nhm2TileLocalSourceElementsArtifactV1 = {
  artifactId: typeof NHM2_TILE_LOCAL_SOURCE_ELEMENTS_ARTIFACT_ID;
  schemaVersion: typeof NHM2_TILE_LOCAL_SOURCE_ELEMENTS_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  selectedProfileId: string;
  expectedProfileId: string;
  profileMatch: boolean;
  laneId: "nhm2_shift_lapse";
  sourceModel: {
    sourceModelId: string;
    sourceModelVersion: string;
    sourceSideOnly: true;
    notDerivedFromMetricRequiredTensor: true;
    metricRequiredInputRefs: [];
    sourceInputRefs: string[];
    approximationMode:
      | "representative_sector_bin"
      | "explicit_tile"
      | "voxelized_tile_lattice"
      | "unknown";
  };
  tileUnit: {
    areaMeters2: number | null;
    gapMeters: number | null;
    tileWidthMeters: number | null;
    tileHeightMeters: number | null;
    sectorCount: number | null;
    concurrentSectors: number | null;
    qFactor: number | null;
    dutyCycle: number | null;
    dutyShip: number | null;
    modulationFrequencyHz: number | null;
    materialStack: string | null;
    idealCasimirEnergyPerAreaSI: number | null;
    idealCasimirEnergyPerTileSI: number | null;
    idealGapEnergyDensitySI: number | null;
  };
  elements: Nhm2TileLocalSourceElementV1[];
  summary: {
    elementCount: number;
    hasWallCoverage: boolean;
    wallWeightSum: number;
    anyProxy: boolean;
    anyMissingMaterialReceipt: boolean;
    allElementsHaveLocalTensorAuthority: boolean;
    missingFullTensorComponentIds: Nhm2TensorComponent[];
    firstBlocker: string | null;
  };
  claimBoundary: {
    diagnosticOnly: true;
    tileLocalElementsDoNotValidatePhysicalSource: true;
    idealScalarBudgetIsNotMaterialReceipt: true;
    regionalAggregationRequiredForWallClosure: true;
  };
};

export type BuildNhm2TileLocalSourceElementsInput = Omit<
  Nhm2TileLocalSourceElementsArtifactV1,
  "artifactId" | "schemaVersion" | "profileMatch" | "summary" | "claimBoundary"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isComponentStatus = (
  value: unknown,
): value is Nhm2TileLocalSourceComponentStatus =>
  NHM2_TILE_LOCAL_SOURCE_COMPONENT_STATUS_VALUES.includes(
    value as Nhm2TileLocalSourceComponentStatus,
  );

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isTensorComponent = (value: string): value is Nhm2TensorComponent =>
  NHM2_TENSOR_COMPONENTS.includes(value as Nhm2TensorComponent);

const componentSet = (tensor: Nhm2RegionalTensor): Set<Nhm2TensorComponent> =>
  new Set(NHM2_TENSOR_COMPONENTS.filter((component) => tensor[component] != null));

export const inferNhm2TileLocalSourceTensorAuthorityMode = (
  tensor: Nhm2RegionalTensor,
): Nhm2TileLocalSourceElementV1["tensorAuthorityMode"] => {
  const components = componentSet(tensor);
  if (NHM2_TENSOR_COMPONENTS.every((component) => components.has(component))) {
    return "full_tensor";
  }
  const symmetric: readonly Nhm2TensorComponent[] = [
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
  ];
  if (symmetric.every((component) => components.has(component))) {
    return "symmetric_full_tensor";
  }
  if (["T00", "T11", "T22", "T33"].every((component) => components.has(component as Nhm2TensorComponent))) {
    return "diagonal_reduced_order";
  }
  return components.size > 0 ? "proxy" : "unknown";
};

export const missingNhm2TileLocalSourceTensorComponents = (
  tensor: Nhm2RegionalTensor,
): Nhm2TensorComponent[] =>
  NHM2_TENSOR_COMPONENTS.filter((component) => tensor[component] == null);

const deriveElementBlockers = (
  element: Nhm2TileLocalSourceElementV1,
): string[] => {
  const blockers = new Set(element.blockers);
  if (element.material.materialReceiptStatus !== "material_receipted") {
    blockers.add("material_receipt_missing_or_not_receipted");
  }
  if (element.tensorAuthorityMode !== "full_tensor" && element.tensorAuthorityMode !== "symmetric_full_tensor") {
    blockers.add("local_full_tensor_authority_missing");
  }
  if (element.missingComponentIds.length > 0) {
    blockers.add("local_full_tensor_components_missing");
  }
  if (element.areaMeters2 == null) blockers.add("tile_area_missing");
  if (element.gapMeters == null) blockers.add("tile_gap_missing");
  return Array.from(blockers);
};

export const buildNhm2TileLocalSourceElementsArtifact = (
  input: BuildNhm2TileLocalSourceElementsInput,
): Nhm2TileLocalSourceElementsArtifactV1 => {
  const elements = input.elements.map((element) => {
    const tensorAuthorityMode =
      element.tensorAuthorityMode === "unknown"
        ? inferNhm2TileLocalSourceTensorAuthorityMode(element.localTensor)
        : element.tensorAuthorityMode;
    const missingComponentIds =
      element.missingComponentIds.length > 0
        ? element.missingComponentIds
        : missingNhm2TileLocalSourceTensorComponents(element.localTensor);
    const normalized = { ...element, tensorAuthorityMode, missingComponentIds };
    return { ...normalized, blockers: deriveElementBlockers(normalized) };
  });
  const wallWeightSum = elements.reduce(
    (sum, element) => sum + Math.max(0, element.regionWeights.wall ?? 0),
    0,
  );
  const blockerList = elements.flatMap((element) => element.blockers);
  const missingFullTensorComponentIds = Array.from(
    new Set(elements.flatMap((element) => element.missingComponentIds)),
  );
  return {
    artifactId: NHM2_TILE_LOCAL_SOURCE_ELEMENTS_ARTIFACT_ID,
    schemaVersion: NHM2_TILE_LOCAL_SOURCE_ELEMENTS_SCHEMA_VERSION,
    ...input,
    profileMatch: input.selectedProfileId === input.expectedProfileId,
    elements,
    summary: {
      elementCount: elements.length,
      hasWallCoverage: wallWeightSum > 0,
      wallWeightSum,
      anyProxy: elements.some(
        (element) =>
          element.tensorAuthorityMode === "proxy" ||
          element.tensorAuthorityMode === "diagonal_reduced_order" ||
          element.tensorAuthorityMode === "unknown",
      ),
      anyMissingMaterialReceipt: elements.some(
        (element) => element.material.materialReceiptStatus !== "material_receipted",
      ),
      allElementsHaveLocalTensorAuthority: elements.every(
        (element) =>
          element.tensorAuthorityMode === "full_tensor" ||
          element.tensorAuthorityMode === "symmetric_full_tensor",
      ),
      missingFullTensorComponentIds,
      firstBlocker: blockerList[0] ?? null,
    },
    claimBoundary: {
      diagnosticOnly: true,
      tileLocalElementsDoNotValidatePhysicalSource: true,
      idealScalarBudgetIsNotMaterialReceipt: true,
      regionalAggregationRequiredForWallClosure: true,
    },
  };
};

const isVector = (value: unknown): value is { x: number; y: number; z: number } | null => {
  if (value === null) return true;
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.x === "number" &&
    Number.isFinite(record.x) &&
    typeof record.y === "number" &&
    Number.isFinite(record.y) &&
    typeof record.z === "number" &&
    Number.isFinite(record.z)
  );
};

const isTensor = (value: unknown): value is Nhm2RegionalTensor => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    Object.entries(record).every(
      ([key, entry]) => isTensorComponent(key) && isNullableNumber(entry),
    )
  );
};

const isRegionWeights = (
  value: unknown,
): value is Nhm2TileLocalSourceElementRegionWeights => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    Object.entries(record).every(
      ([key, entry]) => isRegionId(key) && isNullableNumber(entry),
    )
  );
};

const isElement = (value: unknown): value is Nhm2TileLocalSourceElementV1 => {
  const record = isRecord(value) ? value : null;
  const duty = isRecord(record?.duty) ? record?.duty : null;
  const material = isRecord(record?.material) ? record?.material : null;
  const scalarBudget = isRecord(record?.scalarBudget) ? record?.scalarBudget : null;
  const provenance = isRecord(record?.provenance) ? record?.provenance : null;
  const componentStatus = isRecord(record?.componentStatus)
    ? record?.componentStatus
    : null;
  return (
    record != null &&
    isText(record.tileElementId) &&
    isText(record.tileBatchId) &&
    isNullableText(record.sectorId) &&
    isText(record.chartId) &&
    isVector(record.positionChartMeters) &&
    isVector(record.normalChart) &&
    isNullableNumber(record.areaMeters2) &&
    isNullableNumber(record.gapMeters) &&
    duty != null &&
    isNullableNumber(duty.burstDuty) &&
    isNullableNumber(duty.shipDuty) &&
    isNullableNumber(duty.concurrentSectorFraction) &&
    isNullableNumber(duty.effectiveDuty) &&
    isNullableNumber(record.qFactor) &&
    material != null &&
    isNullableText(material.materialStack) &&
    isNullableText(material.materialReceiptRef) &&
    isText(material.materialReceiptStatus) &&
    scalarBudget != null &&
    isNullableNumber(scalarBudget.idealCasimirEnergyPerAreaSI) &&
    isNullableNumber(scalarBudget.idealCasimirEnergyPerTileSI) &&
    isNullableNumber(scalarBudget.idealGapEnergyDensitySI) &&
    isNullableNumber(scalarBudget.cycleAveragedT00SI) &&
    isComponentStatus(scalarBudget.status) &&
    isTensor(record.localTensor) &&
    componentStatus != null &&
    Object.entries(componentStatus).every(
      ([key, entry]) => isTensorComponent(key) && isComponentStatus(entry),
    ) &&
    (record.tensorAuthorityMode === "full_tensor" ||
      record.tensorAuthorityMode === "symmetric_full_tensor" ||
      record.tensorAuthorityMode === "diagonal_reduced_order" ||
      record.tensorAuthorityMode === "proxy" ||
      record.tensorAuthorityMode === "unknown") &&
    Array.isArray(record.missingComponentIds) &&
    record.missingComponentIds.every(isTensorComponent) &&
    isRegionWeights(record.regionWeights) &&
    provenance != null &&
    isText(provenance.producerModule) &&
    isText(provenance.producerFunction) &&
    isText(provenance.sourceModelId) &&
    isText(provenance.sourceModelVersion) &&
    provenance.sourceSideOnly === true &&
    provenance.notDerivedFromMetricRequiredTensor === true &&
    Array.isArray(provenance.inputRefs) &&
    provenance.inputRefs.every(isText) &&
    (provenance.approximationMode === "representative_sector_bin" ||
      provenance.approximationMode === "explicit_tile" ||
      provenance.approximationMode === "voxelized_tile_lattice" ||
      provenance.approximationMode === "unknown") &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText) &&
    Array.isArray(record.warnings) &&
    record.warnings.every(isText)
  );
};

export const isNhm2TileLocalSourceElementsArtifact = (
  value: unknown,
): value is Nhm2TileLocalSourceElementsArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const sourceModel = isRecord(record?.sourceModel) ? record?.sourceModel : null;
  const tileUnit = isRecord(record?.tileUnit) ? record?.tileUnit : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.artifactId === NHM2_TILE_LOCAL_SOURCE_ELEMENTS_ARTIFACT_ID &&
    record.schemaVersion === NHM2_TILE_LOCAL_SOURCE_ELEMENTS_SCHEMA_VERSION &&
    isText(record.generatedAt) &&
    isText(record.runId) &&
    isText(record.selectedProfileId) &&
    isText(record.expectedProfileId) &&
    record.profileMatch === (record.selectedProfileId === record.expectedProfileId) &&
    record.laneId === "nhm2_shift_lapse" &&
    sourceModel != null &&
    isText(sourceModel.sourceModelId) &&
    isText(sourceModel.sourceModelVersion) &&
    sourceModel.sourceSideOnly === true &&
    sourceModel.notDerivedFromMetricRequiredTensor === true &&
    Array.isArray(sourceModel.metricRequiredInputRefs) &&
    sourceModel.metricRequiredInputRefs.length === 0 &&
    Array.isArray(sourceModel.sourceInputRefs) &&
    sourceModel.sourceInputRefs.every(isText) &&
    (sourceModel.approximationMode === "representative_sector_bin" ||
      sourceModel.approximationMode === "explicit_tile" ||
      sourceModel.approximationMode === "voxelized_tile_lattice" ||
      sourceModel.approximationMode === "unknown") &&
    tileUnit != null &&
    isNullableNumber(tileUnit.areaMeters2) &&
    isNullableNumber(tileUnit.gapMeters) &&
    isNullableNumber(tileUnit.tileWidthMeters) &&
    isNullableNumber(tileUnit.tileHeightMeters) &&
    isNullableNumber(tileUnit.sectorCount) &&
    isNullableNumber(tileUnit.concurrentSectors) &&
    isNullableNumber(tileUnit.qFactor) &&
    isNullableNumber(tileUnit.dutyCycle) &&
    isNullableNumber(tileUnit.dutyShip) &&
    isNullableNumber(tileUnit.modulationFrequencyHz) &&
    isNullableText(tileUnit.materialStack) &&
    isNullableNumber(tileUnit.idealCasimirEnergyPerAreaSI) &&
    isNullableNumber(tileUnit.idealCasimirEnergyPerTileSI) &&
    isNullableNumber(tileUnit.idealGapEnergyDensitySI) &&
    Array.isArray(record.elements) &&
    record.elements.every(isElement) &&
    summary != null &&
    typeof summary.elementCount === "number" &&
    Number.isFinite(summary.elementCount) &&
    typeof summary.hasWallCoverage === "boolean" &&
    typeof summary.wallWeightSum === "number" &&
    Number.isFinite(summary.wallWeightSum) &&
    typeof summary.anyProxy === "boolean" &&
    typeof summary.anyMissingMaterialReceipt === "boolean" &&
    typeof summary.allElementsHaveLocalTensorAuthority === "boolean" &&
    Array.isArray(summary.missingFullTensorComponentIds) &&
    summary.missingFullTensorComponentIds.every(isTensorComponent) &&
    isNullableText(summary.firstBlocker) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.tileLocalElementsDoNotValidatePhysicalSource === true &&
    claimBoundary?.idealScalarBudgetIsNotMaterialReceipt === true &&
    claimBoundary?.regionalAggregationRequiredForWallClosure === true
  );
};
