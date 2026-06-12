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
}): Nhm2MetricRequiredRegionalTensorReceiptV1 => {
  if (!isNhm2ReferenceRunArtifact(args.referenceRun)) {
    throw new Error("reference run must be nhm2_reference_run/v1");
  }
  const sourceClosure = asRecord(args.sourceClosure);
  if (sourceClosure == null) throw new Error("source closure artifact must be a JSON object");
  const tensors = asRecord(sourceClosure.tensors);
  const tensorRefs = asRecord(sourceClosure.tensorRefs);
  const regionMap = sourceClosureRegions(sourceClosure);

  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
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
    sourceArtifactRefs: [args.sourceClosureRef],
    regions,
  });
};

export const publishMetricRequiredRegionalTensorReceipt = (args: {
  repoRoot: string;
  referenceRunPath: string;
  sourceClosurePath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2MetricRequiredRegionalTensorReceiptV1 => {
  if (
    !args.auditOnly &&
    (pathUsesLatestAlias(args.referenceRunPath) ||
      pathUsesLatestAlias(args.sourceClosurePath))
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  const sourceClosure = readJson(resolvePath(args.repoRoot, args.sourceClosurePath));
  const artifact = buildMetricRequiredRegionalTensorReceiptFromSourceClosure({
    referenceRun,
    sourceClosure,
    sourceClosureRef: args.sourceClosurePath,
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
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

const invokedPath = process.argv[1] ? normalize(process.argv[1]) : "";
if (existsSync(invokedPath) && invokedPath === normalize(fileURLToPath(import.meta.url))) {
  main();
}
