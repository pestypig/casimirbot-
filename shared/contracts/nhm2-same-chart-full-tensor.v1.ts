export const NHM2_SAME_CHART_FULL_TENSOR_CONTRACT_VERSION =
  "nhm2_same_chart_full_tensor/v1";

export const NHM2_SAME_CHART_FULL_TENSOR_COMPONENT_IDS = [
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

export const NHM2_TENSOR_COMPONENT_STATUS_VALUES = [
  "computed",
  "derived_same_chart",
  "missing",
  "not_applicable",
  "blocked",
] as const;

export const NHM2_SAME_CHART_FULL_TENSOR_PROVENANCE_SOURCE_VALUES = [
  "einstein_tensor_geometry_fd4_v1",
  "adm_projection",
  "runtime_artifact",
  "missing",
] as const;

export type Nhm2TensorComponentStatus =
  (typeof NHM2_TENSOR_COMPONENT_STATUS_VALUES)[number];

export type Nhm2SameChartFullTensorComponentId =
  (typeof NHM2_SAME_CHART_FULL_TENSOR_COMPONENT_IDS)[number];

export type Nhm2SameChartFullTensorProvenanceSource =
  (typeof NHM2_SAME_CHART_FULL_TENSOR_PROVENANCE_SOURCE_VALUES)[number];

export type Nhm2SameChartFullTensorComponentV1 = {
  componentId: Nhm2SameChartFullTensorComponentId;
  valueSI: number | null;
  unit: "J/m^3" | "Pa" | null;
  status: Nhm2TensorComponentStatus;
  provenance: {
    routeId: string;
    chartId: string;
    source: Nhm2SameChartFullTensorProvenanceSource;
    artifactRef?: string;
  };
  assumptions: string[];
  blockers: string[];
};

export type Nhm2SameChartFullTensorArtifactV1 = {
  contractVersion: typeof NHM2_SAME_CHART_FULL_TENSOR_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  chartId: string;
  metricFamily: string;
  adm: {
    alphaStatus: Nhm2TensorComponentStatus;
    betaStatus: Nhm2TensorComponentStatus;
    gammaStatus: Nhm2TensorComponentStatus;
    extrinsicCurvatureStatus: Nhm2TensorComponentStatus;
  };
  components: Nhm2SameChartFullTensorComponentV1[];
  completeness: {
    hasT00: boolean;
    hasT0i: boolean;
    hasDiagonalTij: boolean;
    hasOffDiagonalTij: boolean;
    fullTensorComplete: boolean;
    missingComponentIds: string[];
  };
  claimBoundary: {
    diagnosticOnly: true;
    validatesPhysicalSource: false;
    promotesViability: false;
  };
};

export type BuildNhm2SameChartFullTensorArtifactInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  chartId?: string | null;
  metricFamily?: string | null;
  routeId?: string | null;
  source?: Nhm2SameChartFullTensorProvenanceSource | null;
  artifactRef?: string | null;
  tensor?: Record<string, unknown> | null;
  componentStatuses?: Partial<Record<Nhm2SameChartFullTensorComponentId, Nhm2TensorComponentStatus>>;
  componentAssumptions?: Partial<Record<Nhm2SameChartFullTensorComponentId, string[]>>;
  componentBlockers?: Partial<Record<Nhm2SameChartFullTensorComponentId, string[]>>;
  defaultAssumptions?: string[] | null;
  adm?: Partial<Nhm2SameChartFullTensorArtifactV1["adm"]> | null;
};

type ComponentSpec = {
  componentId: Nhm2SameChartFullTensorComponentId;
  aliases: string[];
  unit: "J/m^3" | "Pa";
  family: "t00" | "t0i" | "diagonal_tij" | "off_diagonal_tij";
};

const COMPONENT_SPECS: ComponentSpec[] = [
  { componentId: "T00", aliases: ["T00"], unit: "J/m^3", family: "t00" },
  { componentId: "T0x", aliases: ["T0x", "T01", "T10"], unit: "J/m^3", family: "t0i" },
  { componentId: "T0y", aliases: ["T0y", "T02", "T20"], unit: "J/m^3", family: "t0i" },
  { componentId: "T0z", aliases: ["T0z", "T03", "T30"], unit: "J/m^3", family: "t0i" },
  { componentId: "Txx", aliases: ["Txx", "T11"], unit: "Pa", family: "diagonal_tij" },
  { componentId: "Txy", aliases: ["Txy", "T12", "T21"], unit: "Pa", family: "off_diagonal_tij" },
  { componentId: "Txz", aliases: ["Txz", "T13", "T31"], unit: "Pa", family: "off_diagonal_tij" },
  { componentId: "Tyy", aliases: ["Tyy", "T22"], unit: "Pa", family: "diagonal_tij" },
  { componentId: "Tyz", aliases: ["Tyz", "T23", "T32"], unit: "Pa", family: "off_diagonal_tij" },
  { componentId: "Tzz", aliases: ["Tzz", "T33"], unit: "Pa", family: "diagonal_tij" },
];

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const unique = (values: string[]): string[] =>
  Array.from(new Set(values.filter((entry) => entry.trim().length > 0)));

const isStatus = (value: unknown): value is Nhm2TensorComponentStatus =>
  NHM2_TENSOR_COMPONENT_STATUS_VALUES.includes(value as Nhm2TensorComponentStatus);

const isSource = (
  value: unknown,
): value is Nhm2SameChartFullTensorProvenanceSource =>
  NHM2_SAME_CHART_FULL_TENSOR_PROVENANCE_SOURCE_VALUES.includes(
    value as Nhm2SameChartFullTensorProvenanceSource,
  );

const isCompleteStatus = (status: Nhm2TensorComponentStatus): boolean =>
  status === "computed" || status === "derived_same_chart";

const resolveSource = (
  routeId: string | null,
  source?: Nhm2SameChartFullTensorProvenanceSource | null,
): Nhm2SameChartFullTensorProvenanceSource => {
  if (isSource(source)) return source;
  if (routeId === "einstein_tensor_geometry_fd4_v1") {
    return "einstein_tensor_geometry_fd4_v1";
  }
  if (routeId != null && routeId.toLowerCase().includes("adm")) {
    return "adm_projection";
  }
  return "runtime_artifact";
};

const resolveComponentValue = (
  spec: ComponentSpec,
  tensor: Record<string, unknown> | null,
): number | null => {
  if (tensor == null) return null;
  for (const alias of spec.aliases) {
    const value = toFinite(tensor[alias]);
    if (value != null) return value;
  }
  return null;
};

const defaultStatusFor = (
  value: number | null,
  source: Nhm2SameChartFullTensorProvenanceSource,
  blockers: string[],
): Nhm2TensorComponentStatus => {
  if (value != null) {
    return source === "adm_projection" ? "derived_same_chart" : "computed";
  }
  return blockers.length > 0 ? "blocked" : "missing";
};

const defaultBlockersFor = (
  spec: ComponentSpec,
  status: Nhm2TensorComponentStatus,
): string[] => {
  if (isCompleteStatus(status) || status === "not_applicable") return [];
  if (spec.family === "t00") return ["same_chart_T00_not_computed"];
  if (spec.family === "t0i") return ["same_chart_T0i_not_computed"];
  if (spec.family === "diagonal_tij") return ["same_chart_diagonal_Tij_not_computed"];
  return ["same_chart_off_diagonal_Tij_not_computed"];
};

const defaultAssumptionsFor = (
  spec: ComponentSpec,
  status: Nhm2TensorComponentStatus,
): string[] => {
  const assumptions = ["component is reported in the declared same chart"];
  if (!isCompleteStatus(status)) {
    assumptions.push("missing or blocked components are not zero-filled");
  }
  if (spec.family === "t0i") {
    assumptions.push("T0i is treated as the same-chart momentum-density channel");
  }
  return assumptions;
};

const normalizeAdmStatus = (
  value: unknown,
  fallback: Nhm2TensorComponentStatus = "missing",
): Nhm2TensorComponentStatus => (isStatus(value) ? value : fallback);

export const buildNhm2SameChartFullTensorArtifact = (
  input: BuildNhm2SameChartFullTensorArtifactInput = {},
): Nhm2SameChartFullTensorArtifactV1 => {
  const routeId = asText(input.routeId) ?? "missing";
  const chartId = asText(input.chartId) ?? "unknown";
  const source = resolveSource(routeId === "missing" ? null : routeId, input.source);
  const tensor = input.tensor ?? null;
  const defaultAssumptions = Array.isArray(input.defaultAssumptions)
    ? input.defaultAssumptions.filter((entry): entry is string => typeof entry === "string")
    : [];
  const components = COMPONENT_SPECS.map((spec): Nhm2SameChartFullTensorComponentV1 => {
    const valueSI = resolveComponentValue(spec, tensor);
    const explicitStatus = input.componentStatuses?.[spec.componentId];
    const explicitBlockers = input.componentBlockers?.[spec.componentId] ?? [];
    const status = isStatus(explicitStatus)
      ? explicitStatus
      : defaultStatusFor(valueSI, source, explicitBlockers);
    const blockers = unique([
      ...explicitBlockers,
      ...defaultBlockersFor(spec, status),
    ]);
    const assumptions = unique([
      ...defaultAssumptions,
      ...defaultAssumptionsFor(spec, status),
      ...(input.componentAssumptions?.[spec.componentId] ?? []),
    ]);
    const provenanceSource =
      status === "missing" && valueSI == null && routeId === "missing"
        ? "missing"
        : source;
    const artifactRef = asText(input.artifactRef);
    return {
      componentId: spec.componentId,
      valueSI,
      unit: spec.unit,
      status,
      provenance: {
        routeId,
        chartId,
        source: provenanceSource,
        ...(artifactRef ? { artifactRef } : {}),
      },
      assumptions,
      blockers,
    };
  });

  const hasT00 = components.some(
    (component) => component.componentId === "T00" && isCompleteStatus(component.status),
  );
  const hasT0i = ["T0x", "T0y", "T0z"].every((componentId) =>
    components.some(
      (component) => component.componentId === componentId && isCompleteStatus(component.status),
    ),
  );
  const hasDiagonalTij = ["Txx", "Tyy", "Tzz"].every((componentId) =>
    components.some(
      (component) => component.componentId === componentId && isCompleteStatus(component.status),
    ),
  );
  const hasOffDiagonalTij = ["Txy", "Txz", "Tyz"].every((componentId) =>
    components.some(
      (component) => component.componentId === componentId && isCompleteStatus(component.status),
    ),
  );
  const missingComponentIds = components
    .filter((component) => !isCompleteStatus(component.status))
    .map((component) => component.componentId);

  return {
    contractVersion: NHM2_SAME_CHART_FULL_TENSOR_CONTRACT_VERSION,
    generatedAt: asText(input.generatedAt) ?? new Date().toISOString(),
    laneId: asText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId: asText(input.selectedProfileId) ?? "unknown",
    chartId,
    metricFamily: asText(input.metricFamily) ?? "unknown",
    adm: {
      alphaStatus: normalizeAdmStatus(input.adm?.alphaStatus),
      betaStatus: normalizeAdmStatus(input.adm?.betaStatus),
      gammaStatus: normalizeAdmStatus(input.adm?.gammaStatus),
      extrinsicCurvatureStatus: normalizeAdmStatus(
        input.adm?.extrinsicCurvatureStatus,
      ),
    },
    components,
    completeness: {
      hasT00,
      hasT0i,
      hasDiagonalTij,
      hasOffDiagonalTij,
      fullTensorComplete:
        hasT00 && hasT0i && hasDiagonalTij && hasOffDiagonalTij,
      missingComponentIds,
    },
    claimBoundary: {
      diagnosticOnly: true,
      validatesPhysicalSource: false,
      promotesViability: false,
    },
  };
};

const hasExactComponentSet = (
  components: Nhm2SameChartFullTensorComponentV1[],
): boolean => {
  const ids = new Set(components.map((component) => component.componentId));
  return (
    ids.size === NHM2_SAME_CHART_FULL_TENSOR_COMPONENT_IDS.length &&
    NHM2_SAME_CHART_FULL_TENSOR_COMPONENT_IDS.every((id) => ids.has(id))
  );
};

const isComponent = (
  value: unknown,
): value is Nhm2SameChartFullTensorComponentV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const provenance =
    record.provenance && typeof record.provenance === "object"
      ? (record.provenance as Record<string, unknown>)
      : null;
  return (
    NHM2_SAME_CHART_FULL_TENSOR_COMPONENT_IDS.includes(
      record.componentId as Nhm2SameChartFullTensorComponentId,
    ) &&
    (record.valueSI === null || Number.isFinite(Number(record.valueSI))) &&
    (record.unit === "J/m^3" || record.unit === "Pa" || record.unit === null) &&
    isStatus(record.status) &&
    provenance != null &&
    typeof provenance.routeId === "string" &&
    typeof provenance.chartId === "string" &&
    isSource(provenance.source) &&
    (provenance.artifactRef === undefined || typeof provenance.artifactRef === "string") &&
    Array.isArray(record.assumptions) &&
    record.assumptions.every((entry) => typeof entry === "string") &&
    Array.isArray(record.blockers) &&
    record.blockers.every((entry) => typeof entry === "string")
  );
};

export const isNhm2SameChartFullTensorArtifact = (
  value: unknown,
): value is Nhm2SameChartFullTensorArtifactV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const adm =
    record.adm && typeof record.adm === "object"
      ? (record.adm as Record<string, unknown>)
      : null;
  const completeness =
    record.completeness && typeof record.completeness === "object"
      ? (record.completeness as Record<string, unknown>)
      : null;
  const claimBoundary =
    record.claimBoundary && typeof record.claimBoundary === "object"
      ? (record.claimBoundary as Record<string, unknown>)
      : null;
  const components = Array.isArray(record.components)
    ? record.components
    : null;
  return (
    record.contractVersion === NHM2_SAME_CHART_FULL_TENSOR_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.chartId === "string" &&
    typeof record.metricFamily === "string" &&
    adm != null &&
    isStatus(adm.alphaStatus) &&
    isStatus(adm.betaStatus) &&
    isStatus(adm.gammaStatus) &&
    isStatus(adm.extrinsicCurvatureStatus) &&
    components != null &&
    hasExactComponentSet(components as Nhm2SameChartFullTensorComponentV1[]) &&
    components.every(isComponent) &&
    completeness != null &&
    typeof completeness.hasT00 === "boolean" &&
    typeof completeness.hasT0i === "boolean" &&
    typeof completeness.hasDiagonalTij === "boolean" &&
    typeof completeness.hasOffDiagonalTij === "boolean" &&
    typeof completeness.fullTensorComplete === "boolean" &&
    Array.isArray(completeness.missingComponentIds) &&
    completeness.missingComponentIds.every((entry) => typeof entry === "string") &&
    claimBoundary != null &&
    claimBoundary.diagnosticOnly === true &&
    claimBoundary.validatesPhysicalSource === false &&
    claimBoundary.promotesViability === false
  );
};
