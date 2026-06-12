export const NHM2_WALL_MATERIAL_SOURCE_TENSOR_MODEL_CONTRACT_VERSION =
  "nhm2_wall_material_source_tensor_model/v1";

export type Nhm2WallMaterialSourceTensorComponentId =
  | "T00"
  | "T0x"
  | "T0y"
  | "T0z"
  | "Txx"
  | "Txy"
  | "Txz"
  | "Tyy"
  | "Tyz"
  | "Tzz";

export type Nhm2WallMaterialSourceTensorComponentStatus =
  | "computed"
  | "material_receipted"
  | "missing"
  | "blocked";

export type Nhm2WallMaterialSourceTensorModelKind =
  | "lifshitz_wall_tensor"
  | "measured_material_tensor"
  | "declared_research_tensor"
  | "missing";

export type Nhm2WallMaterialSourceTensorBasis =
  | "coordinate"
  | "local_wall_orthonormal";

export type Nhm2WallMaterialSourceTensorComponentV1 = {
  componentId: Nhm2WallMaterialSourceTensorComponentId;
  valueSI: number | null;
  unit: "J/m^3" | "Pa" | null;
  status: Nhm2WallMaterialSourceTensorComponentStatus;
  provenanceRef: string;
  assumptions: string[];
  blockers: string[];
};

export type Nhm2WallMaterialSourceTensorModelV1 = {
  contractVersion: typeof NHM2_WALL_MATERIAL_SOURCE_TENSOR_MODEL_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  chartId: "comoving_cartesian" | string;
  basis: Nhm2WallMaterialSourceTensorBasis;
  modelKind: Nhm2WallMaterialSourceTensorModelKind;
  materialReceiptRef: string | null;
  layeredCandidateRef: string | null;
  notDerivedFromMetricRequiredTensor: true;
  components: Nhm2WallMaterialSourceTensorComponentV1[];
  projection: {
    wallNormalRef: string | null;
    sameChartProjectionStatus: "pass" | "fail" | "missing";
  };
  claimBoundary: {
    diagnosticOnly: true;
    sourceTensorModelDoesNotValidatePhysicalSource: true;
    zeroComponentsMustBeExplicitlyComputed: true;
    metricEchoForbidden: true;
  };
};

export type BuildNhm2WallMaterialSourceTensorModelInput = Omit<
  Nhm2WallMaterialSourceTensorModelV1,
  "contractVersion" | "claimBoundary"
>;

export const NHM2_WALL_MATERIAL_SOURCE_TENSOR_COMPONENT_IDS: readonly Nhm2WallMaterialSourceTensorComponentId[] = [
  "T00",
  "T0x",
  "T0y",
  "T0z",
  "Txx",
  "Txy",
  "Txz",
  "Tyy",
  "Tyz",
  "Tzz",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

export const isNhm2WallMaterialSourceTensorComponentId = (
  value: unknown,
): value is Nhm2WallMaterialSourceTensorComponentId =>
  NHM2_WALL_MATERIAL_SOURCE_TENSOR_COMPONENT_IDS.includes(
    value as Nhm2WallMaterialSourceTensorComponentId,
  );

const isComponentStatus = (
  value: unknown,
): value is Nhm2WallMaterialSourceTensorComponentStatus =>
  value === "computed" ||
  value === "material_receipted" ||
  value === "missing" ||
  value === "blocked";

const isModelKind = (
  value: unknown,
): value is Nhm2WallMaterialSourceTensorModelKind =>
  value === "lifshitz_wall_tensor" ||
  value === "measured_material_tensor" ||
  value === "declared_research_tensor" ||
  value === "missing";

const isBasis = (
  value: unknown,
): value is Nhm2WallMaterialSourceTensorBasis =>
  value === "coordinate" || value === "local_wall_orthonormal";

const isProjectionStatus = (
  value: unknown,
): value is Nhm2WallMaterialSourceTensorModelV1["projection"]["sameChartProjectionStatus"] =>
  value === "pass" || value === "fail" || value === "missing";

export const wallMaterialSourceTensorComponentComputed = (
  component: Nhm2WallMaterialSourceTensorComponentV1 | null | undefined,
): boolean =>
  component?.valueSI != null &&
  (component.status === "computed" ||
    component.status === "material_receipted");

export const getNhm2WallMaterialSourceTensorComponent = (
  model: Nhm2WallMaterialSourceTensorModelV1,
  componentId: Nhm2WallMaterialSourceTensorComponentId,
): Nhm2WallMaterialSourceTensorComponentV1 | null =>
  model.components.find((component) => component.componentId === componentId) ??
  null;

export const buildNhm2WallMaterialSourceTensorModelArtifact = (
  input: BuildNhm2WallMaterialSourceTensorModelInput,
): Nhm2WallMaterialSourceTensorModelV1 => ({
  contractVersion: NHM2_WALL_MATERIAL_SOURCE_TENSOR_MODEL_CONTRACT_VERSION,
  ...input,
  claimBoundary: {
    diagnosticOnly: true,
    sourceTensorModelDoesNotValidatePhysicalSource: true,
    zeroComponentsMustBeExplicitlyComputed: true,
    metricEchoForbidden: true,
  },
});

const isComponent = (
  value: unknown,
): value is Nhm2WallMaterialSourceTensorComponentV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isNhm2WallMaterialSourceTensorComponentId(record.componentId) &&
    isNullableNumber(record.valueSI) &&
    (record.unit === "J/m^3" || record.unit === "Pa" || record.unit === null) &&
    isComponentStatus(record.status) &&
    isText(record.provenanceRef) &&
    Array.isArray(record.assumptions) &&
    record.assumptions.every(isText) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText)
  );
};

export const isNhm2WallMaterialSourceTensorModelArtifact = (
  value: unknown,
): value is Nhm2WallMaterialSourceTensorModelV1 => {
  const record = isRecord(value) ? value : null;
  const projection = isRecord(record?.projection) ? record?.projection : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_WALL_MATERIAL_SOURCE_TENSOR_MODEL_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.chartId) &&
    isBasis(record.basis) &&
    isModelKind(record.modelKind) &&
    isNullableText(record.materialReceiptRef) &&
    isNullableText(record.layeredCandidateRef) &&
    record.notDerivedFromMetricRequiredTensor === true &&
    Array.isArray(record.components) &&
    record.components.every(isComponent) &&
    projection != null &&
    isNullableText(projection.wallNormalRef) &&
    isProjectionStatus(projection.sameChartProjectionStatus) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.sourceTensorModelDoesNotValidatePhysicalSource === true &&
    claimBoundary?.zeroComponentsMustBeExplicitlyComputed === true &&
    claimBoundary?.metricEchoForbidden === true
  );
};
