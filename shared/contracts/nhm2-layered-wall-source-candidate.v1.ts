import type { CasimirMaterialReceiptStatus } from "./casimir-material-receipt.v1";

export const NHM2_LAYERED_WALL_SOURCE_CANDIDATE_CONTRACT_VERSION =
  "nhm2_layered_wall_source_candidate/v1";

export type Nhm2LayeredWallSourceVolumeMode =
  | "fixed_control_volume"
  | "expanded_wall_volume";

export type Nhm2LayeredWallSourceScalarStatus =
  | "pass_1pct"
  | "pass_10pct"
  | "fail"
  | "missing";

export type Nhm2LayeredWallSourceTensorStatus =
  | "scalar_t00_only"
  | "diagonal_proxy"
  | "full_tensor_candidate"
  | "missing";

export type Nhm2LayeredWallSourceMaterialStatus =
  | "ideal_scalar_only"
  | "material_receipted"
  | "blocked"
  | "missing";

export type Nhm2LayeredWallSourceCandidateV1 = {
  contractVersion: typeof NHM2_LAYERED_WALL_SOURCE_CANDIDATE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  sourceSweepRef: string;
  selectedRowId: string;
  layerCount: number;
  idealStackThicknessMeters: number;
  requiredWallT00AbsSI: number;
  baselineTileLocalWallT00AbsSI: number;
  candidateWallT00AbsSI: number;
  effectiveClosureWallT00AbsSI: number;
  sourceMultiplier: number;
  metricReliefFactor: number;
  fixedVolumeResidual: number;
  expandedVolumeResidual: number;
  selectedVolumeMode: Nhm2LayeredWallSourceVolumeMode;
  scalarWallT00Status: Nhm2LayeredWallSourceScalarStatus;
  tensorStatus: Nhm2LayeredWallSourceTensorStatus;
  materialStatus: Nhm2LayeredWallSourceMaterialStatus;
  passPath: {
    scalarWallT00Candidate: boolean;
    sameBasisTensorAuthority: boolean;
    materialReceipt: boolean;
    conservation: boolean;
    qeiDossier: boolean;
    observerRobustEnergyConditions: boolean;
    fullSolvePassEligible: false;
  };
  evidenceRefs: {
    materialReceiptRef: string | null;
    sameBasisAuthorityRef: string | null;
    conservationRef: string | null;
    qeiDossierRef: string | null;
    observerRobustEnergyConditionsRef: string | null;
  };
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    scalarLayeringDoesNotCloseSource: true;
    fullTensorRequired: true;
    materialReceiptRequired: true;
    fixedVolumeAssumptionRequiresAudit: true;
  };
};

export type BuildNhm2LayeredWallSourceCandidateInput = Omit<
  Nhm2LayeredWallSourceCandidateV1,
  "contractVersion" | "claimBoundary"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isVolumeMode = (
  value: unknown,
): value is Nhm2LayeredWallSourceVolumeMode =>
  value === "fixed_control_volume" || value === "expanded_wall_volume";

const isScalarStatus = (
  value: unknown,
): value is Nhm2LayeredWallSourceScalarStatus =>
  value === "pass_1pct" ||
  value === "pass_10pct" ||
  value === "fail" ||
  value === "missing";

const isTensorStatus = (
  value: unknown,
): value is Nhm2LayeredWallSourceTensorStatus =>
  value === "scalar_t00_only" ||
  value === "diagonal_proxy" ||
  value === "full_tensor_candidate" ||
  value === "missing";

const isMaterialStatus = (
  value: unknown,
): value is Nhm2LayeredWallSourceMaterialStatus =>
  value === "ideal_scalar_only" ||
  value === "material_receipted" ||
  value === "blocked" ||
  value === "missing";

export const mapCasimirReceiptStatusToLayeredWallMaterialStatus = (
  status: CasimirMaterialReceiptStatus | null | undefined,
): Nhm2LayeredWallSourceMaterialStatus => {
  if (status === "material_receipted") return "material_receipted";
  if (status === "blocked") return "blocked";
  if (status === "missing") return "missing";
  return "ideal_scalar_only";
};

export const buildNhm2LayeredWallSourceCandidateArtifact = (
  input: BuildNhm2LayeredWallSourceCandidateInput,
): Nhm2LayeredWallSourceCandidateV1 => ({
  contractVersion: NHM2_LAYERED_WALL_SOURCE_CANDIDATE_CONTRACT_VERSION,
  ...input,
  passPath: {
    ...input.passPath,
    fullSolvePassEligible: false,
  },
  claimBoundary: {
    diagnosticOnly: true,
    scalarLayeringDoesNotCloseSource: true,
    fullTensorRequired: true,
    materialReceiptRequired: true,
    fixedVolumeAssumptionRequiresAudit: true,
  },
});

export const isNhm2LayeredWallSourceCandidateArtifact = (
  value: unknown,
): value is Nhm2LayeredWallSourceCandidateV1 => {
  const record = isRecord(value) ? value : null;
  const passPath = isRecord(record?.passPath) ? record?.passPath : null;
  const evidenceRefs = isRecord(record?.evidenceRefs)
    ? record?.evidenceRefs
    : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;

  return (
    record != null &&
    record.contractVersion === NHM2_LAYERED_WALL_SOURCE_CANDIDATE_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.sourceSweepRef) &&
    isText(record.selectedRowId) &&
    isNumber(record.layerCount) &&
    isNumber(record.idealStackThicknessMeters) &&
    isNumber(record.requiredWallT00AbsSI) &&
    isNumber(record.baselineTileLocalWallT00AbsSI) &&
    isNumber(record.candidateWallT00AbsSI) &&
    isNumber(record.effectiveClosureWallT00AbsSI) &&
    isNumber(record.sourceMultiplier) &&
    isNumber(record.metricReliefFactor) &&
    isNumber(record.fixedVolumeResidual) &&
    isNumber(record.expandedVolumeResidual) &&
    isVolumeMode(record.selectedVolumeMode) &&
    isScalarStatus(record.scalarWallT00Status) &&
    isTensorStatus(record.tensorStatus) &&
    isMaterialStatus(record.materialStatus) &&
    passPath != null &&
    typeof passPath.scalarWallT00Candidate === "boolean" &&
    typeof passPath.sameBasisTensorAuthority === "boolean" &&
    typeof passPath.materialReceipt === "boolean" &&
    typeof passPath.conservation === "boolean" &&
    typeof passPath.qeiDossier === "boolean" &&
    typeof passPath.observerRobustEnergyConditions === "boolean" &&
    passPath.fullSolvePassEligible === false &&
    evidenceRefs != null &&
    isNullableText(evidenceRefs.materialReceiptRef) &&
    isNullableText(evidenceRefs.sameBasisAuthorityRef) &&
    isNullableText(evidenceRefs.conservationRef) &&
    isNullableText(evidenceRefs.qeiDossierRef) &&
    isNullableText(evidenceRefs.observerRobustEnergyConditionsRef) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.scalarLayeringDoesNotCloseSource === true &&
    claimBoundary?.fullTensorRequired === true &&
    claimBoundary?.materialReceiptRequired === true &&
    claimBoundary?.fixedVolumeAssumptionRequiresAudit === true
  );
};
