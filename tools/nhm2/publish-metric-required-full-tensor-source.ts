import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2MetricRequiredRegionalFullTensorSourceArtifact,
  isNhm2MetricRequiredRegionalFullTensorSourceArtifact,
  type Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1,
  type Nhm2MetricRequiredRegionalFullTensorSourceRegionV1,
  type Nhm2MetricRequiredRegionalFullTensorSourceRoute,
} from "../../shared/contracts/nhm2-metric-required-regional-full-tensor-source.v1";
import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2SameChartFullTensorArtifact,
  isNhm2SameChartFullTensorArtifact,
  type Nhm2SameChartFullTensorArtifactV1,
  type Nhm2SameChartFullTensorComponentId,
  type Nhm2SameChartFullTensorProvenanceSource,
  type Nhm2TensorComponentStatus,
} from "../../shared/contracts/nhm2-same-chart-full-tensor.v1";

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

const getNested = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>(
    (cursor: unknown, part: string) => asRecord(cursor)?.[part],
    value,
  );

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => asString(entry))
        .filter((entry): entry is string => entry != null)
    : [];

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

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const sameChartComponentIds: Nhm2SameChartFullTensorComponentId[] = [
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
];

const allComponentStatuses = (
  status: Nhm2TensorComponentStatus,
): Partial<Record<Nhm2SameChartFullTensorComponentId, Nhm2TensorComponentStatus>> =>
  Object.fromEntries(sameChartComponentIds.map((componentId) => [componentId, status]));

const allComponentBlockers = (
  blocker: string,
): Partial<Record<Nhm2SameChartFullTensorComponentId, string[]>> =>
  Object.fromEntries(sameChartComponentIds.map((componentId) => [componentId, [blocker]]));

type RegionMetadata = {
  regionMaskRef: string | null;
  aggregationMode: "mean" | "integral" | "unknown";
  normalizationBasis: "sample_count" | "volume" | "unknown";
  sampleCount: number | null;
};

const defaultRegionMetadata = (): RegionMetadata => ({
  regionMaskRef: null,
  aggregationMode: "unknown",
  normalizationBasis: "unknown",
  sampleCount: null,
});

const sourceClosureRegions = (
  sourceClosure: Record<string, unknown> | null,
): Map<Nhm2RegionalSourceClosureRegionId, Record<string, unknown>> => {
  const regions = new Map<Nhm2RegionalSourceClosureRegionId, Record<string, unknown>>();
  const regionList = getNested(sourceClosure, ["regionComparisons", "regions"]);
  if (!Array.isArray(regionList)) return regions;
  for (const entry of regionList) {
    const record = asRecord(entry);
    const regionId = asString(record?.regionId);
    if (record != null && isRegionId(regionId)) {
      regions.set(regionId, record);
    }
  }
  return regions;
};

const metadataFromSourceClosure = (
  sourceClosure: Record<string, unknown> | null,
  regionId: Nhm2RegionalSourceClosureRegionId,
): RegionMetadata => {
  if (sourceClosure == null) return defaultRegionMetadata();
  if (regionId === "global") {
    const globalAccounting = asRecord(sourceClosure.globalAccounting);
    const metricAccounting =
      asRecord(sourceClosure.metricAccounting) ?? asRecord(globalAccounting?.metric);
    return {
      regionMaskRef: asString(metricAccounting?.regionMaskRef),
      aggregationMode: normalizeAggregationMode(metricAccounting?.aggregationMode),
      normalizationBasis: normalizeNormalizationBasis(metricAccounting?.normalizationBasis),
      sampleCount: asNumber(metricAccounting?.sampleCount),
    };
  }
  const region = sourceClosureRegions(sourceClosure).get(regionId) ?? null;
  const diagnostics = asRecord(region?.metricT00Diagnostics);
  const trace = asRecord(diagnostics?.trace);
  const accounting = asRecord(region?.metricAccounting);
  return {
    regionMaskRef:
      asString(trace?.regionMaskRef) ??
      asString(accounting?.regionMaskRef) ??
      null,
    aggregationMode: knownAggregationMode(
      trace?.aggregationMode,
      diagnostics?.aggregationMode,
      accounting?.aggregationMode,
    ),
    normalizationBasis: knownNormalizationBasis(
      trace?.normalizationBasis,
      diagnostics?.normalizationBasis,
      accounting?.normalizationBasis,
    ),
    sampleCount: knownNumber(trace?.sampleCount, diagnostics?.sampleCount, accounting?.sampleCount),
  };
};

const tensorSourceRank = (source: Nhm2SameChartFullTensorProvenanceSource): number => {
  if (source === "einstein_tensor_geometry_fd4_v1") return 3;
  if (source === "adm_projection") return 2;
  if (source === "runtime_artifact") return 1;
  return 0;
};

const sourceRouteFromTensor = (
  tensor: Nhm2SameChartFullTensorArtifactV1 | null,
): Nhm2MetricRequiredRegionalFullTensorSourceRoute => {
  if (tensor == null) return "runtime_artifact";
  let selected: Nhm2SameChartFullTensorProvenanceSource = "missing";
  for (const component of tensor.components) {
    if (tensorSourceRank(component.provenance.source) > tensorSourceRank(selected)) {
      selected = component.provenance.source;
    }
  }
  return selected === "missing" ? "runtime_artifact" : selected;
};

const findSameChartTensor = (value: unknown): Nhm2SameChartFullTensorArtifactV1 | null => {
  if (isNhm2SameChartFullTensorArtifact(value)) return value;
  const record = asRecord(value);
  if (record == null) return null;
  for (const key of [
    "sameChartFullTensor",
    "metricRequiredSameChartFullTensor",
    "metricRequiredFullTensor",
    "nhm2SameChartFullTensor",
    "nhm2_same_chart_full_tensor",
  ]) {
    const candidate = record[key];
    if (isNhm2SameChartFullTensorArtifact(candidate)) return candidate;
  }
  return null;
};

const findGlobalSameChartTensor = (
  runtimeArtifact: unknown,
): Nhm2SameChartFullTensorArtifactV1 | null => {
  const direct = findSameChartTensor(runtimeArtifact);
  if (direct != null) return direct;
  for (const path of [
    ["natario"],
    ["pipeline"],
    ["result"],
    ["sections", "same_chart_full_tensor"],
    ["sections", "closure_stack"],
  ]) {
    const candidate = findSameChartTensor(getNested(runtimeArtifact, path));
    if (candidate != null) return candidate;
  }
  return null;
};

const candidateRegionLists = (
  runtimeArtifact: unknown,
  sourceClosure: Record<string, unknown> | null,
): unknown[] => [
  getNested(runtimeArtifact, ["regions"]),
  getNested(runtimeArtifact, ["regionComparisons", "regions"]),
  getNested(runtimeArtifact, ["sourceClosure", "regionComparisons", "regions"]),
  getNested(runtimeArtifact, ["sections", "source_closure", "regionComparisons", "regions"]),
  getNested(sourceClosure, ["regionComparisons", "regions"]),
];

const findRegionalSameChartTensors = (
  runtimeArtifact: unknown,
  sourceClosure: Record<string, unknown> | null,
): Map<Nhm2RegionalSourceClosureRegionId, Nhm2SameChartFullTensorArtifactV1> => {
  const byRegion = new Map<
    Nhm2RegionalSourceClosureRegionId,
    Nhm2SameChartFullTensorArtifactV1
  >();
  for (const list of candidateRegionLists(runtimeArtifact, sourceClosure)) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      const record = asRecord(entry);
      const regionId = asString(record?.regionId);
      const tensor = findSameChartTensor(record);
      if (isRegionId(regionId) && tensor != null) byRegion.set(regionId, tensor);
    }
  }
  return byRegion;
};

const statusFromSameChartTensor = (
  tensor: Nhm2SameChartFullTensorArtifactV1,
): Nhm2MetricRequiredRegionalFullTensorSourceRegionV1["status"] => {
  if (tensor.completeness.fullTensorComplete) return "computed";
  if (tensor.components.some((component) => component.valueSI != null)) return "partial";
  return "missing";
};

const missingSameChartTensor = (args: {
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  chartId: string;
  metricFamily: string;
  blocker: string;
}): Nhm2SameChartFullTensorArtifactV1 =>
  buildNhm2SameChartFullTensorArtifact({
    generatedAt: args.generatedAt,
    laneId: args.laneId,
    selectedProfileId: args.selectedProfileId,
    chartId: args.chartId,
    metricFamily: args.metricFamily,
    routeId: "missing",
    source: "runtime_artifact",
    componentStatuses: allComponentStatuses("blocked"),
    componentBlockers: allComponentBlockers(args.blocker),
    defaultAssumptions: [
      "regional same-chart full tensor evidence is required and was not inferred from a global tensor",
      "missing regional components are not zero-filled",
    ],
    adm: {
      alphaStatus: "blocked",
      betaStatus: "blocked",
      gammaStatus: "blocked",
      extrinsicCurvatureStatus: "blocked",
    },
  });

const buildRegion = (args: {
  regionId: Nhm2RegionalSourceClosureRegionId;
  tensor: Nhm2SameChartFullTensorArtifactV1;
  runtimeArtifactRef: string;
  metadata: RegionMetadata;
  status?: Nhm2MetricRequiredRegionalFullTensorSourceRegionV1["status"];
  blockers?: string[];
  warnings?: string[];
}): Nhm2MetricRequiredRegionalFullTensorSourceRegionV1 => ({
  regionId: args.regionId,
  status: args.status ?? statusFromSameChartTensor(args.tensor),
  artifactRef: `${args.runtimeArtifactRef}#metric-required-full-tensor/${args.regionId}`,
  tensorRef: `${args.runtimeArtifactRef}#metric-required-full-tensor/${args.regionId}/sameChartFullTensor`,
  regionMaskRef: args.metadata.regionMaskRef,
  aggregationMode: args.metadata.aggregationMode,
  normalizationBasis: args.metadata.normalizationBasis,
  sampleCount: args.metadata.sampleCount,
  sameChartFullTensor: args.tensor,
  blockers: args.blockers ?? [],
  warnings: args.warnings ?? [],
});

export const buildMetricRequiredRegionalFullTensorSourceFromRuntime = (args: {
  generatedAt?: string;
  referenceRun: unknown;
  runtimeArtifact: unknown;
  runtimeArtifactRef: string;
  sourceClosure?: unknown;
  sourceClosureRef?: string | null;
}): Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1 => {
  if (!isNhm2ReferenceRunArtifact(args.referenceRun)) {
    throw new Error("reference run must be a valid nhm2_reference_run/v1 artifact");
  }
  if (isNhm2MetricRequiredRegionalFullTensorSourceArtifact(args.runtimeArtifact)) {
    return args.runtimeArtifact;
  }
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const sourceClosure = asRecord(args.sourceClosure);
  const globalTensor = findGlobalSameChartTensor(args.runtimeArtifact);
  const regionalTensors = findRegionalSameChartTensors(args.runtimeArtifact, sourceClosure);
  const representativeTensor =
    regionalTensors.values().next().value ?? globalTensor ?? null;
  const laneId = representativeTensor?.laneId ?? "nhm2_shift_lapse";
  const selectedProfileId =
    representativeTensor?.selectedProfileId ??
    args.referenceRun.selectedFamily.selectedProfileId;
  const chartId = representativeTensor?.chartId ?? "comoving_cartesian";
  const metricFamily = representativeTensor?.metricFamily ?? "nhm2_shift_lapse";
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const metadata = metadataFromSourceClosure(sourceClosure, regionId);
    const regionalTensor = regionalTensors.get(regionId);
    if (regionalTensor != null) {
      return buildRegion({
        regionId,
        tensor: regionalTensor,
        runtimeArtifactRef: args.runtimeArtifactRef,
        metadata,
        warnings: ["metric_required_regional_same_chart_full_tensor_source_consumed"],
      });
    }
    if (regionId === "global" && globalTensor != null) {
      return buildRegion({
        regionId,
        tensor: globalTensor,
        runtimeArtifactRef: args.runtimeArtifactRef,
        metadata,
        warnings: ["metric_required_global_same_chart_full_tensor_source_consumed"],
      });
    }
    const blocker =
      globalTensor != null
        ? "metric_required_region_full_tensor_aggregation_missing"
        : "metric_required_region_same_chart_full_tensor_missing";
    return buildRegion({
      regionId,
      tensor: missingSameChartTensor({
        generatedAt,
        laneId,
        selectedProfileId,
        chartId,
        metricFamily,
        blocker,
      }),
      runtimeArtifactRef: args.runtimeArtifactRef,
      metadata,
      status: "blocked",
      blockers: [blocker],
      warnings:
        globalTensor != null
          ? ["global_same_chart_tensor_not_reused_as_regional_tensor"]
          : ["metric_required_same_chart_full_tensor_source_missing"],
    });
  });

  return buildNhm2MetricRequiredRegionalFullTensorSourceArtifact({
    generatedAt,
    laneId,
    selectedProfileId,
    chartId,
    metricFamily,
    sourceRoute: sourceRouteFromTensor(representativeTensor),
    sourceArtifactRefs: [
      args.runtimeArtifactRef,
      ...((args.sourceClosureRef == null ? [] : [args.sourceClosureRef])),
    ],
    regions,
  });
};

export const publishMetricRequiredFullTensorSource = (args: {
  repoRoot: string;
  referenceRunPath: string;
  runtimeArtifactPath: string;
  outPath: string;
  sourceClosurePath?: string | null;
  auditOnly?: boolean;
}): Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1 => {
  if (
    !args.auditOnly &&
    [
      args.referenceRunPath,
      args.runtimeArtifactPath,
      args.sourceClosurePath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  const runtimeArtifact = readJson(resolvePath(args.repoRoot, args.runtimeArtifactPath));
  const sourceClosure =
    args.sourceClosurePath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.sourceClosurePath));
  const artifact = buildMetricRequiredRegionalFullTensorSourceFromRuntime({
    referenceRun,
    runtimeArtifact,
    runtimeArtifactRef: args.runtimeArtifactPath,
    sourceClosure,
    sourceClosureRef: args.sourceClosurePath,
  });
  if (!isNhm2MetricRequiredRegionalFullTensorSourceArtifact(artifact)) {
    throw new Error("internal error: produced invalid metric-required full tensor source");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const referenceRunPath = asString(args["reference-run"]);
  const runtimeArtifactPath = asString(args["runtime-artifact"]);
  const outPath = asString(args.out);
  if (referenceRunPath == null || runtimeArtifactPath == null || outPath == null) {
    throw new Error("--reference-run, --runtime-artifact, and --out are required");
  }
  const artifact = publishMetricRequiredFullTensorSource({
    repoRoot: process.cwd(),
    referenceRunPath,
    runtimeArtifactPath,
    sourceClosurePath: asString(args["source-closure"]),
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (existsSync(process.argv[1] ?? "") && normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
