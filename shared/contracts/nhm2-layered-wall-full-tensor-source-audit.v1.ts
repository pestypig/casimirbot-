export const NHM2_LAYERED_WALL_FULL_TENSOR_SOURCE_AUDIT_CONTRACT_VERSION =
  "nhm2_layered_wall_full_tensor_source_audit/v1";

export type Nhm2LayeredWallTensorComponentId =
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

export type Nhm2LayeredWallTensorComponentStatus =
  | "computed"
  | "derived_ideal_proxy"
  | "material_receipted"
  | "missing"
  | "blocked";

export type Nhm2LayeredWallTensorAuthorityMode =
  | "full_tensor"
  | "symmetric_full_tensor"
  | "diagonal_reduced_order"
  | "proxy"
  | "missing";

export type Nhm2LayeredWallSourceModelKind =
  | "ideal_parallel_plate_tensor_proxy"
  | "lifshitz_material_tensor"
  | "measured_material_tensor"
  | "declared_research_tensor"
  | "missing";

export type Nhm2LayeredWallFullTensorComponentV1 = {
  componentId: Nhm2LayeredWallTensorComponentId;
  valueSI: number | null;
  unit: "J/m^3" | "Pa" | null;
  status: Nhm2LayeredWallTensorComponentStatus;
  blockers: string[];
};

export type Nhm2LayeredWallFullTensorSourceAuditV1 = {
  contractVersion: typeof NHM2_LAYERED_WALL_FULL_TENSOR_SOURCE_AUDIT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  layeredCandidateRef: string;
  materialReceiptRef: string | null;
  chartId: "comoving_cartesian" | string;
  sourceModel: {
    modelKind: Nhm2LayeredWallSourceModelKind;
    tensorBasis: "coordinate" | "local_wall_orthonormal" | "unknown";
    sourceSideOnly: true;
    notDerivedFromMetricRequiredTensor: true;
  };
  components: Nhm2LayeredWallFullTensorComponentV1[];
  authority: {
    tensorAuthorityMode: Nhm2LayeredWallTensorAuthorityMode;
    hasT00: boolean;
    hasT0i: boolean;
    hasDiagonalTij: boolean;
    hasOffDiagonalTij: boolean;
    fullTensorCandidate: boolean;
  };
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    idealTensorProxyIsNotMaterialReceipt: true;
    missingComponentsAreNotZero: true;
    doesNotValidatePhysicalSource: true;
  };
};

export type BuildNhm2LayeredWallFullTensorSourceAuditInput = Omit<
  Nhm2LayeredWallFullTensorSourceAuditV1,
  "contractVersion" | "authority" | "claimBoundary"
>;

export const NHM2_LAYERED_WALL_TENSOR_COMPONENT_IDS: readonly Nhm2LayeredWallTensorComponentId[] = [
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

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isNumber(value);

const isComponentId = (
  value: unknown,
): value is Nhm2LayeredWallTensorComponentId =>
  NHM2_LAYERED_WALL_TENSOR_COMPONENT_IDS.includes(
    value as Nhm2LayeredWallTensorComponentId,
  );

const isComponentStatus = (
  value: unknown,
): value is Nhm2LayeredWallTensorComponentStatus =>
  value === "computed" ||
  value === "derived_ideal_proxy" ||
  value === "material_receipted" ||
  value === "missing" ||
  value === "blocked";

const isAuthorityMode = (
  value: unknown,
): value is Nhm2LayeredWallTensorAuthorityMode =>
  value === "full_tensor" ||
  value === "symmetric_full_tensor" ||
  value === "diagonal_reduced_order" ||
  value === "proxy" ||
  value === "missing";

const isModelKind = (
  value: unknown,
): value is Nhm2LayeredWallSourceModelKind =>
  value === "ideal_parallel_plate_tensor_proxy" ||
  value === "lifshitz_material_tensor" ||
  value === "measured_material_tensor" ||
  value === "declared_research_tensor" ||
  value === "missing";

const isTensorBasis = (
  value: unknown,
): value is "coordinate" | "local_wall_orthonormal" | "unknown" =>
  value === "coordinate" ||
  value === "local_wall_orthonormal" ||
  value === "unknown";

const computedComponent = (
  component: Nhm2LayeredWallFullTensorComponentV1,
): boolean =>
  component.valueSI != null &&
  (component.status === "computed" ||
    component.status === "derived_ideal_proxy" ||
    component.status === "material_receipted");

const componentById = (
  components: Nhm2LayeredWallFullTensorComponentV1[],
  componentId: Nhm2LayeredWallTensorComponentId,
): Nhm2LayeredWallFullTensorComponentV1 | null =>
  components.find((component) => component.componentId === componentId) ?? null;

export const deriveNhm2LayeredWallTensorAuthority = (
  components: Nhm2LayeredWallFullTensorComponentV1[],
): Nhm2LayeredWallFullTensorSourceAuditV1["authority"] => {
  const hasT00 = computedComponent(componentById(components, "T00") ?? {
    componentId: "T00",
    valueSI: null,
    unit: null,
    status: "missing",
    blockers: [],
  });
  const hasT0i = (["T0x", "T0y", "T0z"] as const).every((componentId) =>
    computedComponent(componentById(components, componentId) ?? {
      componentId,
      valueSI: null,
      unit: null,
      status: "missing",
      blockers: [],
    }),
  );
  const hasDiagonalTij = (["Txx", "Tyy", "Tzz"] as const).every((componentId) =>
    computedComponent(componentById(components, componentId) ?? {
      componentId,
      valueSI: null,
      unit: null,
      status: "missing",
      blockers: [],
    }),
  );
  const hasOffDiagonalTij = (["Txy", "Txz", "Tyz"] as const).every((componentId) =>
    computedComponent(componentById(components, componentId) ?? {
      componentId,
      valueSI: null,
      unit: null,
      status: "missing",
      blockers: [],
    }),
  );
  const fullTensorCandidate =
    hasT00 && hasT0i && hasDiagonalTij && hasOffDiagonalTij;
  const tensorAuthorityMode: Nhm2LayeredWallTensorAuthorityMode =
    fullTensorCandidate
      ? "symmetric_full_tensor"
      : hasT00 && hasDiagonalTij
        ? "diagonal_reduced_order"
        : hasT00
          ? "proxy"
          : "missing";

  return {
    tensorAuthorityMode,
    hasT00,
    hasT0i,
    hasDiagonalTij,
    hasOffDiagonalTij,
    fullTensorCandidate,
  };
};

export const buildNhm2LayeredWallFullTensorSourceAuditArtifact = (
  input: BuildNhm2LayeredWallFullTensorSourceAuditInput,
): Nhm2LayeredWallFullTensorSourceAuditV1 => ({
  contractVersion: NHM2_LAYERED_WALL_FULL_TENSOR_SOURCE_AUDIT_CONTRACT_VERSION,
  ...input,
  authority: deriveNhm2LayeredWallTensorAuthority(input.components),
  claimBoundary: {
    diagnosticOnly: true,
    idealTensorProxyIsNotMaterialReceipt: true,
    missingComponentsAreNotZero: true,
    doesNotValidatePhysicalSource: true,
  },
});

const isComponent = (
  value: unknown,
): value is Nhm2LayeredWallFullTensorComponentV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isComponentId(record.componentId) &&
    isNullableNumber(record.valueSI) &&
    (record.unit === "J/m^3" || record.unit === "Pa" || record.unit === null) &&
    isComponentStatus(record.status) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText)
  );
};

export const isNhm2LayeredWallFullTensorSourceAuditArtifact = (
  value: unknown,
): value is Nhm2LayeredWallFullTensorSourceAuditV1 => {
  const record = isRecord(value) ? value : null;
  const sourceModel = isRecord(record?.sourceModel) ? record?.sourceModel : null;
  const authority = isRecord(record?.authority) ? record?.authority : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record?.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_LAYERED_WALL_FULL_TENSOR_SOURCE_AUDIT_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.layeredCandidateRef) &&
    isNullableText(record.materialReceiptRef) &&
    isText(record.chartId) &&
    sourceModel != null &&
    isModelKind(sourceModel.modelKind) &&
    isTensorBasis(sourceModel.tensorBasis) &&
    sourceModel.sourceSideOnly === true &&
    sourceModel.notDerivedFromMetricRequiredTensor === true &&
    Array.isArray(record.components) &&
    record.components.every(isComponent) &&
    authority != null &&
    isAuthorityMode(authority.tensorAuthorityMode) &&
    typeof authority.hasT00 === "boolean" &&
    typeof authority.hasT0i === "boolean" &&
    typeof authority.hasDiagonalTij === "boolean" &&
    typeof authority.hasOffDiagonalTij === "boolean" &&
    typeof authority.fullTensorCandidate === "boolean" &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.idealTensorProxyIsNotMaterialReceipt === true &&
    claimBoundary?.missingComponentsAreNotZero === true &&
    claimBoundary?.doesNotValidatePhysicalSource === true
  );
};
