export const NHM2_WALL_SOURCE_LAYERING_SWEEP_CONTRACT_VERSION =
  "nhm2_wall_source_layering_sweep/v1";

export type Nhm2WallSourceLayeringTensorAuthority =
  | "scalar_t00_only"
  | "diagonal_proxy"
  | "full_tensor_candidate";

export type Nhm2WallSourceLayeringSweepRowV1 = {
  rowId: string;
  layerCount: number;
  idealStackThicknessMeters: number;
  packingFraction: number;
  orientationProjection: number;
  materialCorrectionProduct: number;
  qMultiplier: number;
  dutyMultiplier: number;
  metricReliefFactor: number;
  requiredSourceMultiplier: number;
  requiredIdealLayerCountAtCurrentFactors: number | null;
  fixedVolumeSourceMultiplier: number;
  expandedVolumeSourceMultiplier: number;
  closureProductFixedVolume: number;
  closureProductExpandedVolume: number;
  fixedVolumeResidual: number;
  expandedVolumeResidual: number;
  scalarT00Pass10pct: boolean;
  scalarT00Pass1pct: boolean;
  expandedScalarT00Pass10pct: boolean;
  expandedScalarT00Pass1pct: boolean;
  physicalPassAllowed: false;
  tensorAuthority: Nhm2WallSourceLayeringTensorAuthority;
  blockers: string[];
};

export type Nhm2WallSourceLayeringSweepV1 = {
  contractVersion: typeof NHM2_WALL_SOURCE_LAYERING_SWEEP_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  baseline: {
    requiredWallT00AbsSI: number;
    tileLocalWallT00AbsSI: number;
    requiredMultiplier: number;
    sourceRef: string;
    metricRef: string;
    baselineWarnings: string[];
  };
  layerAssumptions: {
    topMirrorThicknessMeters: number;
    bottomMirrorThicknessMeters: number;
    gapMeters: number;
    oneIdealLayerThicknessMeters: number;
    referenceWallControlThicknessMeters: number;
    expandedVolumeMode: "fixed_control_volume" | "radial_stack_expands_wall_volume";
  };
  hullSurfaceEstimate: {
    tileAreaMeters2: number;
    boxAreaMeters2: number;
    ellipsoidAreaMeters2: number;
    boxTilesPerLayer: number;
    ellipsoidTilesPerLayer: number;
  };
  sweepRows: Nhm2WallSourceLayeringSweepRowV1[];
  bestRows: {
    closestFixedVolumeRowId: string | null;
    closestExpandedVolumeRowId: string | null;
    firstTenPercentFixedVolumeRowId: string | null;
    firstOnePercentFixedVolumeRowId: string | null;
  };
  claimBoundary: {
    diagnosticOnly: true;
    sweepDoesNotValidatePhysicalSource: true;
    scalarT00CannotSubstituteForFullTensor: true;
    materialReceiptStillRequired: true;
  };
};

export type BuildNhm2WallSourceLayeringSweepInput = Omit<
  Nhm2WallSourceLayeringSweepV1,
  "contractVersion" | "bestRows" | "claimBoundary"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isNumber(value);

const isTensorAuthority = (
  value: unknown,
): value is Nhm2WallSourceLayeringTensorAuthority =>
  value === "scalar_t00_only" ||
  value === "diagonal_proxy" ||
  value === "full_tensor_candidate";

const isRow = (value: unknown): value is Nhm2WallSourceLayeringSweepRowV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isText(record.rowId) &&
    isNumber(record.layerCount) &&
    isNumber(record.idealStackThicknessMeters) &&
    isNumber(record.packingFraction) &&
    isNumber(record.orientationProjection) &&
    isNumber(record.materialCorrectionProduct) &&
    isNumber(record.qMultiplier) &&
    isNumber(record.dutyMultiplier) &&
    isNumber(record.metricReliefFactor) &&
    isNumber(record.requiredSourceMultiplier) &&
    isNullableNumber(record.requiredIdealLayerCountAtCurrentFactors) &&
    isNumber(record.fixedVolumeSourceMultiplier) &&
    isNumber(record.expandedVolumeSourceMultiplier) &&
    isNumber(record.closureProductFixedVolume) &&
    isNumber(record.closureProductExpandedVolume) &&
    isNumber(record.fixedVolumeResidual) &&
    isNumber(record.expandedVolumeResidual) &&
    typeof record.scalarT00Pass10pct === "boolean" &&
    typeof record.scalarT00Pass1pct === "boolean" &&
    typeof record.expandedScalarT00Pass10pct === "boolean" &&
    typeof record.expandedScalarT00Pass1pct === "boolean" &&
    record.physicalPassAllowed === false &&
    isTensorAuthority(record.tensorAuthority) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText)
  );
};

const closestRowId = (
  rows: Nhm2WallSourceLayeringSweepRowV1[],
  residualKey: "fixedVolumeResidual" | "expandedVolumeResidual",
): string | null =>
  rows
    .slice()
    .sort((a, b) => a[residualKey] - b[residualKey])
    .at(0)?.rowId ?? null;

const firstPassingRowId = (
  rows: Nhm2WallSourceLayeringSweepRowV1[],
  key: "scalarT00Pass10pct" | "scalarT00Pass1pct",
): string | null =>
  rows
    .filter((row) => row[key])
    .sort((a, b) => a.layerCount - b.layerCount)
    .at(0)?.rowId ?? null;

export const buildNhm2WallSourceLayeringSweepArtifact = (
  input: BuildNhm2WallSourceLayeringSweepInput,
): Nhm2WallSourceLayeringSweepV1 => ({
  contractVersion: NHM2_WALL_SOURCE_LAYERING_SWEEP_CONTRACT_VERSION,
  ...input,
  bestRows: {
    closestFixedVolumeRowId: closestRowId(input.sweepRows, "fixedVolumeResidual"),
    closestExpandedVolumeRowId: closestRowId(input.sweepRows, "expandedVolumeResidual"),
    firstTenPercentFixedVolumeRowId: firstPassingRowId(
      input.sweepRows,
      "scalarT00Pass10pct",
    ),
    firstOnePercentFixedVolumeRowId: firstPassingRowId(
      input.sweepRows,
      "scalarT00Pass1pct",
    ),
  },
  claimBoundary: {
    diagnosticOnly: true,
    sweepDoesNotValidatePhysicalSource: true,
    scalarT00CannotSubstituteForFullTensor: true,
    materialReceiptStillRequired: true,
  },
});

export const isNhm2WallSourceLayeringSweepArtifact = (
  value: unknown,
): value is Nhm2WallSourceLayeringSweepV1 => {
  const record = isRecord(value) ? value : null;
  const baseline = isRecord(record?.baseline) ? record?.baseline : null;
  const layerAssumptions = isRecord(record?.layerAssumptions)
    ? record?.layerAssumptions
    : null;
  const hullSurfaceEstimate = isRecord(record?.hullSurfaceEstimate)
    ? record?.hullSurfaceEstimate
    : null;
  const bestRows = isRecord(record?.bestRows) ? record?.bestRows : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion === NHM2_WALL_SOURCE_LAYERING_SWEEP_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    baseline != null &&
    isNumber(baseline.requiredWallT00AbsSI) &&
    isNumber(baseline.tileLocalWallT00AbsSI) &&
    isNumber(baseline.requiredMultiplier) &&
    isText(baseline.sourceRef) &&
    isText(baseline.metricRef) &&
    Array.isArray(baseline.baselineWarnings) &&
    baseline.baselineWarnings.every(isText) &&
    layerAssumptions != null &&
    isNumber(layerAssumptions.topMirrorThicknessMeters) &&
    isNumber(layerAssumptions.bottomMirrorThicknessMeters) &&
    isNumber(layerAssumptions.gapMeters) &&
    isNumber(layerAssumptions.oneIdealLayerThicknessMeters) &&
    isNumber(layerAssumptions.referenceWallControlThicknessMeters) &&
    (layerAssumptions.expandedVolumeMode === "fixed_control_volume" ||
      layerAssumptions.expandedVolumeMode === "radial_stack_expands_wall_volume") &&
    hullSurfaceEstimate != null &&
    isNumber(hullSurfaceEstimate.tileAreaMeters2) &&
    isNumber(hullSurfaceEstimate.boxAreaMeters2) &&
    isNumber(hullSurfaceEstimate.ellipsoidAreaMeters2) &&
    isNumber(hullSurfaceEstimate.boxTilesPerLayer) &&
    isNumber(hullSurfaceEstimate.ellipsoidTilesPerLayer) &&
    Array.isArray(record.sweepRows) &&
    record.sweepRows.every(isRow) &&
    bestRows != null &&
    (bestRows.closestFixedVolumeRowId === null ||
      isText(bestRows.closestFixedVolumeRowId)) &&
    (bestRows.closestExpandedVolumeRowId === null ||
      isText(bestRows.closestExpandedVolumeRowId)) &&
    (bestRows.firstTenPercentFixedVolumeRowId === null ||
      isText(bestRows.firstTenPercentFixedVolumeRowId)) &&
    (bestRows.firstOnePercentFixedVolumeRowId === null ||
      isText(bestRows.firstOnePercentFixedVolumeRowId)) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.sweepDoesNotValidatePhysicalSource === true &&
    claimBoundary?.scalarT00CannotSubstituteForFullTensor === true &&
    claimBoundary?.materialReceiptStillRequired === true
  );
};
