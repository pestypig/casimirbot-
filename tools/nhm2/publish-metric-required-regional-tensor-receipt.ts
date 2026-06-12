import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2MetricRequiredRegionalTensorReceiptArtifact,
  inferNhm2MetricRequiredRegionalTensorAuthorityMode,
  isNhm2MetricRequiredRegionalTensorReceipt,
  missingNhm2MetricRequiredRegionalTensorComponents,
  type Nhm2MetricRequiredRegionalTensorReceiptRegionV1,
  type Nhm2MetricRequiredRegionalTensorReceiptV1,
} from "../../shared/contracts/nhm2-metric-required-regional-tensor-receipt.v1";
import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  isNhm2SameChartFullTensorArtifact,
  type Nhm2SameChartFullTensorArtifactV1,
  type Nhm2SameChartFullTensorComponentId,
  type Nhm2SameChartFullTensorComponentV1,
} from "../../shared/contracts/nhm2-same-chart-full-tensor.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const parseArgs = (argv: string[]): Record<string, string | boolean> => {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
};

export type Nhm2MetricRequiredRegionalFullTensorRegionSource = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  sameChartFullTensor: Nhm2SameChartFullTensorArtifactV1;
  artifactRef?: string | null;
  tensorRef?: string | null;
  regionMaskRef?: string | null;
  aggregationMode?: "mean" | "integral" | "unknown" | null;
  normalizationBasis?: "sample_count" | "volume" | "unknown" | null;
  sampleCount?: number | null;
  unitsRef?: "J/m^3" | string | null;
  blockers?: string[] | null;
  warnings?: string[] | null;
};

const getNested = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>(
    (cursor: unknown, part: string) => asRecord(cursor)?.[part],
    value,
  );

const isTensorComponent = (value: string): value is Nhm2TensorComponent =>
  NHM2_TENSOR_COMPONENTS.includes(value as Nhm2TensorComponent);

const normalizeTensor = (value: unknown): Nhm2RegionalTensor => {
  const record = asRecord(value);
  const tensor: Nhm2RegionalTensor = {};
  if (record == null) return tensor;
  for (const [component, entry] of Object.entries(record)) {
    if (isTensorComponent(component)) tensor[component] = asNumber(entry);
  }
  return tensor;
};

const normalizeAggregationMode = (value: unknown): "mean" | "integral" | "unknown" =>
  value === "mean" || value === "integral" ? value : "unknown";

const normalizeNormalizationBasis = (
  value: unknown,
): "sample_count" | "volume" | "unknown" =>
  value === "sample_count" || value === "volume" ? value : "unknown";

const knownAggregationMode = (...values: unknown[]): "mean" | "integral" | "unknown" => {
  for (const value of values) {
    const normalized = normalizeAggregationMode(value);
    if (normalized !== "unknown") return normalized;
  }
  return "unknown";
};

const knownNormalizationBasis = (
  ...values: unknown[]
): "sample_count" | "volume" | "unknown" => {
  for (const value of values) {
    const normalized = normalizeNormalizationBasis(value);
    if (normalized !== "unknown") return normalized;
  }
  return "unknown";
};

const knownNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const normalized = asNumber(value);
    if (normalized != null) return normalized;
  }
  return null;
};

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => asString(entry))
        .filter((entry): entry is string => entry != null)
    : [];

const componentStatusFromTensor = (
  tensor: Nhm2RegionalTensor,
  missingComponentIds: Nhm2TensorComponent[],
): Nhm2MetricRequiredRegionalTensorReceiptRegionV1["componentStatus"] => {
  const status: Nhm2MetricRequiredRegionalTensorReceiptRegionV1["componentStatus"] = {};
  for (const component of NHM2_TENSOR_COMPONENTS) {
    if (tensor[component] != null) status[component] = "computed";
  }
  for (const component of missingComponentIds) {
    status[component] = "missing";
  }
  return status;
};

const SAME_CHART_COMPONENT_TO_TENSOR_COMPONENT = {
  T00: "T00",
  T0x: "T01",
  T0y: "T02",
  T0z: "T03",
  Txx: "T11",
  Txy: "T12",
  Txz: "T13",
  Tyy: "T22",
  Tyz: "T23",
  Tzz: "T33",
} as const satisfies Record<Nhm2SameChartFullTensorComponentId, Nhm2TensorComponent>;

const isCompleteSameChartStatus = (
  component: Nhm2SameChartFullTensorComponentV1,
): boolean =>
  component.status === "computed" || component.status === "derived_same_chart";

const tensorFromSameChartFullTensor = (
  artifact: Nhm2SameChartFullTensorArtifactV1,
): Nhm2RegionalTensor => {
  const tensor: Nhm2RegionalTensor = {};
  for (const component of artifact.components) {
    if (!isCompleteSameChartStatus(component) || component.valueSI == null) continue;
    tensor[SAME_CHART_COMPONENT_TO_TENSOR_COMPONENT[component.componentId]] =
      component.valueSI;
  }
  return tensor;
};

const derivationModeFromSameChartFullTensor = (
  artifact: Nhm2SameChartFullTensorArtifactV1,
): Nhm2MetricRequiredRegionalTensorReceiptRegionV1["derivationMode"] => {
  if (
    artifact.components.some(
      (component) => component.provenance.source === "einstein_tensor_geometry_fd4_v1",
    )
  ) {
    return "einstein_tensor_geometry_fd4_v1";
  }
  if (
    artifact.components.some(
      (component) => component.provenance.source === "adm_projection",
    )
  ) {
    return "adm_projection";
  }
  return "source_closure_existing_metric_required";
};

const blockersFromSameChartFullTensor = (
  artifact: Nhm2SameChartFullTensorArtifactV1,
  sourceBlockers: string[] = [],
): string[] => {
  const blockers = new Set<string>();
  for (const blocker of sourceBlockers) blockers.add(blocker);
  if (!artifact.completeness.fullTensorComplete) {
    blockers.add("same_chart_full_tensor_incomplete");
  }
  for (const component of artifact.components) {
    if (isCompleteSameChartStatus(component)) continue;
    blockers.add(`same_chart_component_missing:${component.componentId}`);
    for (const blocker of component.blockers) blockers.add(blocker);
  }
  return Array.from(blockers);
};

const buildRegionFromSameChartFullTensor = (
  source: Nhm2MetricRequiredRegionalFullTensorRegionSource,
): Nhm2MetricRequiredRegionalTensorReceiptRegionV1 => {
  const tensor = tensorFromSameChartFullTensor(source.sameChartFullTensor);
  const authority = inferNhm2MetricRequiredRegionalTensorAuthorityMode(tensor);
  const missingComponentIds = missingNhm2MetricRequiredRegionalTensorComponents(tensor);
  const hasTensor = Object.values(tensor).some((value) => value != null);
  const artifactRef = asString(source.artifactRef);
  const tensorRef =
    asString(source.tensorRef) ??
    (artifactRef == null
      ? `nhm2_same_chart_full_tensor:${source.regionId}`
      : `${artifactRef}#${source.regionId}`);
  return {
    regionId: source.regionId,
    status: !hasTensor ? "missing" : missingComponentIds.length > 0 ? "partial" : "computed",
    tensor,
    tensorAuthorityMode: authority,
    componentStatus: componentStatusFromTensor(tensor, missingComponentIds),
    missingComponentIds,
    chartRef: source.sameChartFullTensor.chartId,
    basisRef: "same_basis",
    unitsRef: asString(source.unitsRef) ?? "J/m^3",
    regionMaskRef: asString(source.regionMaskRef),
    aggregationMode: normalizeAggregationMode(source.aggregationMode),
    normalizationBasis: normalizeNormalizationBasis(source.normalizationBasis),
    sampleCount: asNumber(source.sampleCount),
    tensorRef,
    derivationMode: derivationModeFromSameChartFullTensor(source.sameChartFullTensor),
    blockers: blockersFromSameChartFullTensor(
      source.sameChartFullTensor,
      stringList(source.blockers),
    ),
    warnings: [
      "metric_required_full_tensor_source_consumed",
      "component_units_are_declared_per_same_chart_component",
      ...stringList(source.warnings),
    ],
  };
};

const sourceClosureRegions = (
  sourceClosure: Record<string, unknown>,
): Map<Nhm2RegionalSourceClosureRegionId, Record<string, unknown>> => {
  const regions = new Map<Nhm2RegionalSourceClosureRegionId, Record<string, unknown>>();
  const regionList = getNested(sourceClosure, ["regionComparisons", "regions"]);
  if (!Array.isArray(regionList)) return regions;
  for (const entry of regionList) {
    const record = asRecord(entry);
    const regionId = asString(record?.regionId);
    if (
      record != null &&
      NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
        regionId as Nhm2RegionalSourceClosureRegionId,
      )
    ) {
      regions.set(regionId as Nhm2RegionalSourceClosureRegionId, record);
    }
  }
  return regions;
};

const regionTrace = (
  region: Record<string, unknown> | null,
): Record<string, unknown> | null =>
  asRecord(getNested(region, ["metricT00Diagnostics", "trace"]));

const regionPathFacts = (
  region: Record<string, unknown> | null,
): Record<string, unknown> | null => asRecord(regionTrace(region)?.pathFacts);

const inferDerivationMode = (
  diagnostics: Record<string, unknown> | null,
): Nhm2MetricRequiredRegionalTensorReceiptRegionV1["derivationMode"] => {
  const mode = asString(diagnostics?.derivationMode);
  if (mode != null && /metric|einstein|finite|runtime_integrated/i.test(mode)) {
    return "einstein_tensor_geometry_fd4_v1";
  }
  return "source_closure_existing_metric_required";
};

const buildRegion = (args: {
  regionId: Nhm2RegionalSourceClosureRegionId;
  tensor: Nhm2RegionalTensor;
  tensorRef: string | null;
  accounting: Record<string, unknown> | null;
  diagnostics: Record<string, unknown> | null;
  warnings?: string[];
}): Nhm2MetricRequiredRegionalTensorReceiptRegionV1 => {
  const trace = asRecord(args.diagnostics?.trace);
  const pathFacts = asRecord(trace?.pathFacts);
  const authority = inferNhm2MetricRequiredRegionalTensorAuthorityMode(args.tensor);
  const missingComponentIds = missingNhm2MetricRequiredRegionalTensorComponents(args.tensor);
  const hasTensor = Object.values(args.tensor).some((value) => value != null);
  const blockers = stringList(args.accounting?.blockers);
  return {
    regionId: args.regionId,
    status: !hasTensor ? "missing" : missingComponentIds.length > 0 ? "partial" : "computed",
    tensor: args.tensor,
    tensorAuthorityMode: authority,
    componentStatus: componentStatusFromTensor(args.tensor, missingComponentIds),
    missingComponentIds,
    chartRef: asString(pathFacts?.chartRef) ?? "comoving_cartesian",
    basisRef: "same_basis",
    unitsRef: asString(pathFacts?.unitsRef) ?? "J/m^3",
    regionMaskRef:
      asString(trace?.regionMaskRef) ??
      asString(args.accounting?.regionMaskRef) ??
      null,
    aggregationMode: knownAggregationMode(
      trace?.aggregationMode,
      args.diagnostics?.aggregationMode,
      args.accounting?.aggregationMode,
    ),
    normalizationBasis: knownNormalizationBasis(
      trace?.normalizationBasis,
      args.diagnostics?.normalizationBasis,
      args.accounting?.normalizationBasis,
    ),
    sampleCount: knownNumber(
      trace?.sampleCount,
      args.diagnostics?.sampleCount,
      args.accounting?.sampleCount,
    ),
    tensorRef: args.tensorRef ?? asString(trace?.tensorRef),
    derivationMode: inferDerivationMode(args.diagnostics),
    blockers,
    warnings: args.warnings ?? [],
  };
};

export const buildMetricRequiredRegionalTensorReceiptFromSourceClosure = (args: {
  generatedAt?: string;
  referenceRun: unknown;
  sourceClosure: unknown;
  sourceClosureRef: string;
  fullTensorRegionSources?: Nhm2MetricRequiredRegionalFullTensorRegionSource[] | null;
  fullTensorSourceRef?: string | null;
}): Nhm2MetricRequiredRegionalTensorReceiptV1 => {
  if (!isNhm2ReferenceRunArtifact(args.referenceRun)) {
    throw new Error("reference run must be nhm2_reference_run/v1");
  }
  const sourceClosure = asRecord(args.sourceClosure);
  if (sourceClosure == null) throw new Error("source closure artifact must be a JSON object");
  const tensors = asRecord(sourceClosure.tensors);
  const tensorRefs = asRecord(sourceClosure.tensorRefs);
  const regionMap = sourceClosureRegions(sourceClosure);
  const fullTensorRegionMap = new Map<
    Nhm2RegionalSourceClosureRegionId,
    Nhm2MetricRequiredRegionalFullTensorRegionSource
  >();
  for (const source of args.fullTensorRegionSources ?? []) {
    fullTensorRegionMap.set(source.regionId, source);
  }

  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const fullTensorRegionSource = fullTensorRegionMap.get(regionId);
    if (fullTensorRegionSource != null) {
      return buildRegionFromSameChartFullTensor(fullTensorRegionSource);
    }
    if (regionId === "global") {
      const globalAccounting = asRecord(sourceClosure.globalAccounting);
      const metricAccounting =
        asRecord(sourceClosure.metricAccounting) ?? asRecord(globalAccounting?.metric);
      const tensor = normalizeTensor(tensors?.metricRequired);
      return buildRegion({
        regionId,
        tensor,
        tensorRef: asString(tensorRefs?.metricRequired),
        accounting: metricAccounting,
        diagnostics: null,
        warnings: metricAccounting == null ? ["global_metric_accounting_missing"] : [],
      });
    }
    const sourceRegion = regionMap.get(regionId) ?? null;
    return buildRegion({
      regionId,
      tensor: normalizeTensor(sourceRegion?.metricRequiredTensor),
      tensorRef: asString(sourceRegion?.metricTensorRef),
      accounting: asRecord(sourceRegion?.metricAccounting),
      diagnostics: asRecord(sourceRegion?.metricT00Diagnostics),
    });
  });

  return buildNhm2MetricRequiredRegionalTensorReceiptArtifact({
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: args.referenceRun.selectedFamily.selectedProfileId,
    chartId: "comoving_cartesian",
    metricFamily: "nhm2_shift_lapse",
    sourceArtifactRefs: [
      args.sourceClosureRef,
      ...(asString(args.fullTensorSourceRef) == null
        ? []
        : [asString(args.fullTensorSourceRef) as string]),
    ],
    regions,
  });
};

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const readFullTensorRegionSources = (
  manifest: unknown,
): Nhm2MetricRequiredRegionalFullTensorRegionSource[] => {
  const record = asRecord(manifest);
  const regionEntries = Array.isArray(record?.regions) ? record.regions : null;
  if (regionEntries == null) {
    throw new Error("metric-required full tensor source must contain regions[]");
  }
  return regionEntries.map((entry, index) => {
    const region = asRecord(entry);
    const regionId = region?.regionId;
    const sameChartFullTensor =
      region?.sameChartFullTensor ?? region?.artifact ?? region?.tensorArtifact;
    if (!isRegionId(regionId)) {
      throw new Error(`metric-required full tensor source regions[${index}] has invalid regionId`);
    }
    if (!isNhm2SameChartFullTensorArtifact(sameChartFullTensor)) {
      throw new Error(
        `metric-required full tensor source regions[${index}] must include nhm2_same_chart_full_tensor/v1`,
      );
    }
    return {
      regionId,
      sameChartFullTensor,
      artifactRef: asString(region.artifactRef),
      tensorRef: asString(region.tensorRef),
      regionMaskRef: asString(region.regionMaskRef),
      aggregationMode: normalizeAggregationMode(region.aggregationMode),
      normalizationBasis: normalizeNormalizationBasis(region.normalizationBasis),
      sampleCount: asNumber(region.sampleCount),
      unitsRef: asString(region.unitsRef),
      blockers: stringList(region.blockers),
      warnings: stringList(region.warnings),
    };
  });
};

export const publishMetricRequiredRegionalTensorReceipt = (args: {
  repoRoot: string;
  referenceRunPath: string;
  sourceClosurePath: string;
  metricRequiredFullTensorSourcePath?: string | null;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2MetricRequiredRegionalTensorReceiptV1 => {
  if (
    !args.auditOnly &&
    (pathUsesLatestAlias(args.referenceRunPath) ||
      pathUsesLatestAlias(args.sourceClosurePath) ||
      pathUsesLatestAlias(args.metricRequiredFullTensorSourcePath))
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  const sourceClosure = readJson(resolvePath(args.repoRoot, args.sourceClosurePath));
  const fullTensorSource =
    args.metricRequiredFullTensorSourcePath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.metricRequiredFullTensorSourcePath));
  const artifact = buildMetricRequiredRegionalTensorReceiptFromSourceClosure({
    referenceRun,
    sourceClosure,
    sourceClosureRef: args.sourceClosurePath,
    fullTensorRegionSources:
      fullTensorSource == null ? null : readFullTensorRegionSources(fullTensorSource),
    fullTensorSourceRef: args.metricRequiredFullTensorSourcePath,
  });
  if (!isNhm2MetricRequiredRegionalTensorReceipt(artifact)) {
    throw new Error("internal error: produced invalid metric-required regional tensor receipt");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const referenceRunPath = asString(args["reference-run"]);
  const sourceClosurePath = asString(args["source-closure"]);
  const outPath = asString(args.out);
  if (referenceRunPath == null || sourceClosurePath == null || outPath == null) {
    throw new Error("--reference-run, --source-closure, and --out are required");
  }
  const artifact = publishMetricRequiredRegionalTensorReceipt({
    repoRoot: process.cwd(),
    referenceRunPath,
    sourceClosurePath,
    metricRequiredFullTensorSourcePath: asString(
      args["metric-required-full-tensor-source"],
    ),
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

const invokedPath = process.argv[1] ? normalize(process.argv[1]) : "";
if (existsSync(invokedPath) && invokedPath === normalize(fileURLToPath(import.meta.url))) {
  main();
}
