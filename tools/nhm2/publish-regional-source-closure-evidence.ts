import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2RegionalSourceClosureEvidenceArtifact,
  isNhm2RegionalSourceClosureEvidenceArtifact,
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2ComparisonBasisStatus,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceRegion,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorAuthorityMode,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  isNhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartRegion,
} from "../../shared/contracts/nhm2-tile-effective-counterpart.v1";

const SOURCE_CLOSURE_LITERATURE_REFS = [
  "natario_2001_zero_expansion",
  "maldacena_2025_real_observers_v3",
  "ford_roman_negative_energy_quantum_inequality_context",
  "fewster_thompson_2023_stationary_worldline_qei",
];

const TENSOR_COMPONENTS =
  NHM2_TENSOR_COMPONENTS as readonly Nhm2TensorComponent[];
const REQUIRED_REGIONS =
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS as readonly Nhm2RegionalSourceClosureRegionId[];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const getNested = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>(
    (cursor: unknown, part: string) => asRecord(cursor)?.[part],
    value,
  );

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const pathUsesLatestAlias = (path: string): boolean =>
  /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

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

const normalizeTensor = (value: unknown): Nhm2RegionalTensor => {
  const record = asRecord(value);
  const tensor: Nhm2RegionalTensor = {};
  if (record == null) return tensor;
  for (const component of TENSOR_COMPONENTS) {
    if (component in record) tensor[component] = asNumber(record[component]);
  }
  return tensor;
};

const componentSet = (tensor: Nhm2RegionalTensor): Set<Nhm2TensorComponent> =>
  new Set(
    TENSOR_COMPONENTS.filter((component: Nhm2TensorComponent) => tensor[component] != null),
  );

const inferAuthorityMode = (
  tensor: Nhm2RegionalTensor,
  evidenceText: string,
): Nhm2TensorAuthorityMode => {
  const text = evidenceText.toLowerCase();
  if (
    text.includes("diagonal_proxy") ||
    text.includes("pressure proxy") ||
    text.includes("proxy_scaled_from_region_mean_t00")
  ) {
    return "proxy";
  }
  const components = componentSet(tensor);
  if (TENSOR_COMPONENTS.every((component: Nhm2TensorComponent) => components.has(component))) {
    return "full_tensor";
  }
  const symmetricSet: Nhm2TensorComponent[] = [
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
  if (symmetricSet.every((component) => components.has(component))) {
    return "symmetric_full_tensor";
  }
  const diagonalSet: Nhm2TensorComponent[] = ["T00", "T11", "T22", "T33"];
  if (diagonalSet.every((component) => components.has(component))) {
    return "diagonal_reduced_order";
  }
  return "unknown";
};

const normalizeAggregationMode = (value: unknown): "mean" | "integral" | "unknown" =>
  value === "mean" || value === "integral" ? value : "unknown";

const normalizeNormalizationBasis = (
  value: unknown,
): "sample_count" | "volume" | "unknown" =>
  value === "sample_count" || value === "volume" ? value : "unknown";

const extractTrace = (record: Record<string, unknown> | null, side: "metric" | "tile") =>
  side === "metric"
    ? asRecord(getNested(record, ["metricT00Diagnostics", "trace"]))
    : asRecord(getNested(record, ["tileT00Diagnostics", "trace"]));

const extractSideMeta = (
  region: Record<string, unknown> | null,
  side: "metric" | "tile",
) => {
  const accounting = asRecord(region?.[side === "metric" ? "metricAccounting" : "tileAccounting"]);
  const diagnostics = asRecord(
    region?.[side === "metric" ? "metricT00Diagnostics" : "tileT00Diagnostics"],
  );
  const trace = extractTrace(region, side);
  const pathFacts = asRecord(trace?.pathFacts);
  return {
    tensorRef:
      asString(side === "metric" ? region?.metricTensorRef : region?.tileTensorRef) ??
      asString(trace?.tensorRef),
    chartRef: asString(pathFacts?.chartRef) ?? "comoving_cartesian",
    unitsRef: asString(pathFacts?.unitsRef) ?? "J/m^3",
    aggregationMode: normalizeAggregationMode(
      accounting?.aggregationMode ?? diagnostics?.aggregationMode ?? trace?.aggregationMode,
    ),
    normalizationBasis: normalizeNormalizationBasis(
      accounting?.normalizationBasis ??
        diagnostics?.normalizationBasis ??
        trace?.normalizationBasis,
    ),
    sampleCount:
      asNumber(accounting?.sampleCount) ??
      asNumber(diagnostics?.sampleCount) ??
      asNumber(trace?.sampleCount),
    comparisonRole: asString(pathFacts?.comparisonRole),
    evidenceText: JSON.stringify({
      accounting,
      diagnostics,
      trace,
      tensorRef: side === "metric" ? region?.metricTensorRef : region?.tileTensorRef,
    }),
  };
};

const normalizeComparisonRole = (
  value: string | null,
): Nhm2RegionalSourceClosureEvidenceRegion["tileEffectiveCounterpart"]["comparisonRole"] =>
  value === "tile_effective_counterpart" ||
  value === "gr_matter_channel_observation" ||
  value === "metric_echo_diagnostic_only"
    ? value
    : "unknown";

const residualForComponents = (
  residuals: unknown,
): Nhm2RegionalSourceClosureEvidenceRegion["residuals"]["componentResiduals"] => {
  const record = asRecord(residuals);
  const normalized: Nhm2RegionalSourceClosureEvidenceRegion["residuals"]["componentResiduals"] = {};
  if (record == null) return normalized;
  for (const component of TENSOR_COMPONENTS) {
    const entry = asRecord(record[component]);
    if (entry == null) continue;
    normalized[component] = {
      metricRequired: asNumber(entry.metricRequired ?? entry.metricValue),
      tileEffectiveCounterpart: asNumber(
        entry.tileEffective ?? entry.tileEffectiveCounterpart ?? entry.tileValue,
      ),
      absResidual: asNumber(entry.absResidual),
      relResidual: asNumber(entry.relResidual),
    };
  }
  return normalized;
};

const computeResiduals = (
  metric: Nhm2RegionalTensor,
  tile: Nhm2RegionalTensor,
  residualComponents: unknown,
  residualNorms: Record<string, unknown> | null,
): Nhm2RegionalSourceClosureEvidenceRegion["residuals"] => {
  const componentResiduals = residualForComponents(residualComponents);
  for (const component of NHM2_TENSOR_COMPONENTS) {
    if (componentResiduals[component] != null) continue;
    const metricValue = metric[component];
    const tileValue = tile[component];
    if (metricValue == null || tileValue == null) continue;
    const signedResidual = metricValue - tileValue;
    const absResidual = Math.abs(signedResidual);
    componentResiduals[component] = {
      metricRequired: metricValue,
      tileEffectiveCounterpart: tileValue,
      absResidual,
      relResidual:
        Math.abs(metricValue) > 0 ? absResidual / Math.abs(metricValue) : null,
    };
  }
  const absLInf =
    asNumber(residualNorms?.absLInf) ??
    Math.max(
      0,
      ...Object.values(componentResiduals)
        .map((entry: { absResidual: number | null } | undefined) => entry?.absResidual)
        .filter((entry): entry is number => entry != null),
    );
  const relLInf =
    asNumber(residualNorms?.relLInf) ??
    Math.max(
      0,
      ...Object.values(componentResiduals)
        .map((entry: { relResidual: number | null } | undefined) => entry?.relResidual)
        .filter((entry): entry is number => entry != null),
    );
  const toleranceRelLInf = asNumber(residualNorms?.toleranceRelLInf);
  const pass =
    asBoolean(residualNorms?.pass) ??
    (toleranceRelLInf != null && Number.isFinite(relLInf)
      ? relLInf <= toleranceRelLInf
      : null);
  return {
    componentResiduals,
    relLInf: Number.isFinite(relLInf) ? relLInf : null,
    absLInf: Number.isFinite(absLInf) ? absLInf : null,
    toleranceRelLInf,
    pass,
  };
};

const basisStatusFor = (
  regionStatus: string | null,
  metricMeta: ReturnType<typeof extractSideMeta>,
  tileMeta: ReturnType<typeof extractSideMeta>,
  comparisonRole: Nhm2RegionalSourceClosureEvidenceRegion["tileEffectiveCounterpart"]["comparisonRole"],
): Nhm2ComparisonBasisStatus => {
  if (regionStatus === "profile_mismatch") return "profile_mismatch";
  if (metricMeta.chartRef !== tileMeta.chartRef) return "chart_mismatch";
  if (metricMeta.unitsRef !== tileMeta.unitsRef) return "unit_mismatch";
  if (
    metricMeta.aggregationMode !== tileMeta.aggregationMode ||
    metricMeta.normalizationBasis !== tileMeta.normalizationBasis
  ) {
    return "aggregation_mismatch";
  }
  if (comparisonRole !== "tile_effective_counterpart") {
    return comparisonRole === "gr_matter_channel_observation"
      ? "diagnostic_only"
      : "counterpart_missing";
  }
  return regionStatus === "same_basis" || regionStatus == null
    ? "same_basis"
    : (regionStatus as Nhm2ComparisonBasisStatus);
};

const makeGlobalRegion = (
  sourceClosure: Record<string, unknown>,
  tileCounterpartRegion?: Nhm2TileEffectiveCounterpartRegion | null,
): Nhm2RegionalSourceClosureEvidenceRegion => {
  const tensors = asRecord(sourceClosure.tensors);
  const tensorRefs = asRecord(sourceClosure.tensorRefs);
  const globalAccounting = asRecord(sourceClosure.globalAccounting);
  const metricAccounting =
    asRecord(sourceClosure.metricAccounting) ?? asRecord(globalAccounting?.metric);
  const tileAccounting =
    asRecord(sourceClosure.tileAccounting) ?? asRecord(globalAccounting?.tile);
  const metric = normalizeTensor(asRecord(tensors?.metricRequired));
  const tile = tileCounterpartRegion?.tensor ?? normalizeTensor(asRecord(tensors?.tileEffective));
  const metricMeta = {
    tensorRef: asString(tensorRefs?.metricRequired),
    chartRef: asString(metricAccounting?.chartRef) ?? "comoving_cartesian",
    unitsRef: asString(metricAccounting?.unitsRef) ?? "J/m^3",
    aggregationMode: normalizeAggregationMode(metricAccounting?.aggregationMode),
    normalizationBasis: normalizeNormalizationBasis(metricAccounting?.normalizationBasis),
    sampleCount: asNumber(metricAccounting?.sampleCount),
    comparisonRole: null,
    evidenceText: JSON.stringify({ metricAccounting, tensorRef: tensorRefs?.metricRequired }),
  };
  const legacyTileMeta = {
    tensorRef: asString(tensorRefs?.tileEffective),
    chartRef: asString(tileAccounting?.chartRef) ?? "comoving_cartesian",
    unitsRef: asString(tileAccounting?.unitsRef) ?? "J/m^3",
    aggregationMode: normalizeAggregationMode(tileAccounting?.aggregationMode),
    normalizationBasis: normalizeNormalizationBasis(tileAccounting?.normalizationBasis),
    sampleCount: asNumber(tileAccounting?.sampleCount),
    comparisonRole: "tile_effective_counterpart",
    evidenceText: JSON.stringify({ tileAccounting, tensorRef: tensorRefs?.tileEffective }),
  };
  const tileMeta =
    tileCounterpartRegion == null
      ? legacyTileMeta
      : {
          ...legacyTileMeta,
          chartRef: tileCounterpartRegion.chartRef,
          unitsRef: tileCounterpartRegion.unitsRef,
          aggregationMode: tileCounterpartRegion.aggregationMode,
          normalizationBasis: tileCounterpartRegion.normalizationBasis,
          sampleCount: tileCounterpartRegion.sampleCount,
          comparisonRole: tileCounterpartRegion.comparisonRole,
          evidenceText: JSON.stringify(tileCounterpartRegion),
        };
  const comparisonRole =
    tileCounterpartRegion?.comparisonRole ??
    normalizeComparisonRole(tileMeta.comparisonRole);
  const residualNorms =
    tileCounterpartRegion == null
      ? asRecord(sourceClosure.residualNorms)
      : {
          toleranceRelLInf: asNumber(asRecord(sourceClosure.residualNorms)?.toleranceRelLInf),
        };
  const residuals = computeResiduals(
    metric,
    tile,
    tileCounterpartRegion == null ? sourceClosure.residualComponents : null,
    residualNorms,
  );
  return {
    regionId: "global",
    status:
      sourceClosure.status === "pass" ||
      sourceClosure.status === "review" ||
      sourceClosure.status === "fail"
      ? sourceClosure.status
      : "review",
    comparisonBasisStatus: basisStatusFor(
      asString(sourceClosure.comparisonBasisStatus),
      metricMeta,
      tileMeta,
      comparisonRole,
    ),
    metricRequired: {
      tensorRef: asString(tensorRefs?.metricRequired),
      tensorAuthorityMode: inferAuthorityMode(metric, JSON.stringify(tensors?.metricRequired)),
      tensor: metric,
      chartRef: metricMeta.chartRef,
      unitsRef: metricMeta.unitsRef,
      aggregationMode: metricMeta.aggregationMode,
      normalizationBasis: metricMeta.normalizationBasis,
      sampleCount: metricMeta.sampleCount,
    },
    tileEffectiveCounterpart: {
      tensorRef:
        tileCounterpartRegion == null
          ? asString(tensorRefs?.tileEffective)
          : `nhm2_tile_effective_counterpart:${tileCounterpartRegion.regionId}`,
      tensorAuthorityMode:
        tileCounterpartRegion?.tensorAuthorityMode ??
        inferAuthorityMode(tile, JSON.stringify(tensors?.tileEffective)),
      tensor: tile,
      chartRef: tileMeta.chartRef,
      unitsRef: tileMeta.unitsRef,
      aggregationMode: tileMeta.aggregationMode,
      normalizationBasis: tileMeta.normalizationBasis,
      sampleCount: tileMeta.sampleCount,
      comparisonRole,
    },
    residuals,
    blockers: tileCounterpartRegion?.blockers ?? [],
  };
};

const makeRegionalRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  sourceRegion: Record<string, unknown> | null,
  tileCounterpartRegion?: Nhm2TileEffectiveCounterpartRegion | null,
): Nhm2RegionalSourceClosureEvidenceRegion => {
  if (sourceRegion == null) {
    return {
      regionId,
      status: "missing",
      comparisonBasisStatus: "counterpart_missing",
      metricRequired: {
        tensorRef: null,
        tensorAuthorityMode: "unknown",
        tensor: {},
        chartRef: "comoving_cartesian",
        unitsRef: "J/m^3",
        aggregationMode: "unknown",
        normalizationBasis: "unknown",
        sampleCount: null,
      },
      tileEffectiveCounterpart: {
        tensorRef: null,
        tensorAuthorityMode: "unknown",
        tensor: {},
        chartRef: "comoving_cartesian",
        unitsRef: "J/m^3",
        aggregationMode: "unknown",
        normalizationBasis: "unknown",
        sampleCount: null,
        comparisonRole: "unknown",
      },
      residuals: {
        componentResiduals: {},
        relLInf: null,
        absLInf: null,
        toleranceRelLInf: null,
        pass: null,
      },
      blockers: ["region_missing"],
    };
  }

  const metric = normalizeTensor(sourceRegion.metricRequiredTensor);
  const tile = tileCounterpartRegion?.tensor ?? normalizeTensor(sourceRegion.tileEffectiveTensor);
  const metricMeta = extractSideMeta(sourceRegion, "metric");
  const legacyTileMeta = extractSideMeta(sourceRegion, "tile");
  const tileMeta =
    tileCounterpartRegion == null
      ? legacyTileMeta
      : {
          ...legacyTileMeta,
          chartRef: tileCounterpartRegion.chartRef,
          unitsRef: tileCounterpartRegion.unitsRef,
          aggregationMode: tileCounterpartRegion.aggregationMode,
          normalizationBasis: tileCounterpartRegion.normalizationBasis,
          sampleCount: tileCounterpartRegion.sampleCount,
          comparisonRole: tileCounterpartRegion.comparisonRole,
          evidenceText: JSON.stringify(tileCounterpartRegion),
        };
  const role = tileCounterpartRegion?.comparisonRole ?? normalizeComparisonRole(tileMeta.comparisonRole);
  const comparisonBasisStatus = basisStatusFor(
    asString(sourceRegion.comparisonBasisStatus),
    metricMeta,
    tileMeta,
    role,
  );
  const residualNorms =
    tileCounterpartRegion == null
      ? asRecord(sourceRegion.residualNorms)
      : {
          toleranceRelLInf: asNumber(asRecord(sourceRegion.residualNorms)?.toleranceRelLInf),
        };
  const residuals = computeResiduals(
    metric,
    tile,
    tileCounterpartRegion == null ? sourceRegion.residualComponents : null,
    residualNorms,
  );
  const blockers = [
    ...((Array.isArray(sourceRegion.reasonCodes)
      ? sourceRegion.reasonCodes
      : []) as unknown[]).filter((entry): entry is string => typeof entry === "string"),
  ];
  const authorityReason = asString(sourceRegion.comparisonBasisAuthorityStatus);
  if (authorityReason === "counterpart_missing") blockers.push("counterpart_missing");
  if (sourceRegion.counterpartResolutionStatus === "missing") {
    blockers.push("counterpart_missing");
  }

  return {
    regionId,
    status:
      sourceRegion.status === "pass" ||
      sourceRegion.status === "review" ||
      sourceRegion.status === "fail"
        ? sourceRegion.status
        : "review",
    comparisonBasisStatus,
    metricRequired: {
      tensorRef: metricMeta.tensorRef,
      tensorAuthorityMode: inferAuthorityMode(metric, metricMeta.evidenceText),
      tensor: metric,
      chartRef: metricMeta.chartRef,
      unitsRef: metricMeta.unitsRef,
      aggregationMode: metricMeta.aggregationMode,
      normalizationBasis: metricMeta.normalizationBasis,
      sampleCount: metricMeta.sampleCount,
    },
    tileEffectiveCounterpart: {
      tensorRef:
        tileCounterpartRegion == null
          ? tileMeta.tensorRef
          : `nhm2_tile_effective_counterpart:${tileCounterpartRegion.regionId}`,
      tensorAuthorityMode:
        tileCounterpartRegion?.tensorAuthorityMode ??
        inferAuthorityMode(tile, tileMeta.evidenceText),
      tensor: tile,
      chartRef: tileCounterpartRegion?.chartRef ?? tileMeta.chartRef,
      unitsRef: tileCounterpartRegion?.unitsRef ?? tileMeta.unitsRef,
      aggregationMode: tileCounterpartRegion?.aggregationMode ?? tileMeta.aggregationMode,
      normalizationBasis:
        tileCounterpartRegion?.normalizationBasis ?? tileMeta.normalizationBasis,
      sampleCount: tileCounterpartRegion?.sampleCount ?? tileMeta.sampleCount,
      comparisonRole: role,
    },
    residuals,
    blockers: [...blockers, ...(tileCounterpartRegion?.blockers ?? [])],
  };
};

export const publishRegionalSourceClosureEvidence = (args: {
  repoRoot: string;
  referenceRunPath: string;
  sourceClosurePath: string;
  outPath: string;
  tileEffectiveCounterpartPath?: string | null;
  auditOnly?: boolean;
}): Nhm2RegionalSourceClosureEvidenceArtifact => {
  if (
    !args.auditOnly &&
    (pathUsesLatestAlias(args.referenceRunPath) ||
      pathUsesLatestAlias(args.sourceClosurePath) ||
      pathUsesLatestAlias(args.tileEffectiveCounterpartPath ?? ""))
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  if (!isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be a valid nhm2_reference_run/v1 artifact");
  }
  const sourceClosure = asRecord(
    readJson(resolvePath(args.repoRoot, args.sourceClosurePath)),
  );
  if (sourceClosure == null) {
    throw new Error("source closure artifact must be a JSON object");
  }
  const tileCounterpart =
    args.tileEffectiveCounterpartPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.tileEffectiveCounterpartPath));
  if (
    tileCounterpart != null &&
    !isNhm2TileEffectiveCounterpartArtifact(tileCounterpart)
  ) {
    throw new Error("tile-effective counterpart must be nhm2_tile_effective_counterpart/v1");
  }
  const tileRegionMap = new Map<string, Nhm2TileEffectiveCounterpartRegion>();
  if (isNhm2TileEffectiveCounterpartArtifact(tileCounterpart)) {
    for (const region of tileCounterpart.regions) {
      tileRegionMap.set(region.regionId, region);
    }
  }

  const sourceRegions = new Map<string, Record<string, unknown>>();
  const regionList = getNested(sourceClosure, ["regionComparisons", "regions"]);
  if (Array.isArray(regionList)) {
    for (const region of regionList) {
      const record = asRecord(region);
      const regionId = asString(record?.regionId);
      if (record != null && regionId != null) sourceRegions.set(regionId, record);
    }
  }

  const regions = REQUIRED_REGIONS.map((regionId: Nhm2RegionalSourceClosureRegionId) =>
    regionId === "global"
      ? makeGlobalRegion(sourceClosure, tileRegionMap.get(regionId) ?? null)
      : makeRegionalRegion(
          regionId,
          sourceRegions.get(regionId) ?? null,
          tileRegionMap.get(regionId) ?? null,
        ),
  );

  const artifact = buildNhm2RegionalSourceClosureEvidenceArtifact({
    generatedAt: new Date().toISOString(),
    runId: referenceRun.runId,
    selectedProfileId: referenceRun.selectedFamily.selectedProfileId,
    expectedProfileId: referenceRun.selectedFamily.expectedProfileId,
    laneId: "nhm2_shift_lapse",
    regions,
    literatureRefs: SOURCE_CLOSURE_LITERATURE_REFS,
  });
  if (!isNhm2RegionalSourceClosureEvidenceArtifact(artifact)) {
    throw new Error("internal error: produced invalid source-closure evidence artifact");
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
  const artifact = publishRegionalSourceClosureEvidence({
    repoRoot: process.cwd(),
    referenceRunPath,
    sourceClosurePath,
    tileEffectiveCounterpartPath: asString(args["tile-effective-counterpart"]),
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

const invokedPath = process.argv[1] ? normalize(process.argv[1]) : "";
if (existsSync(invokedPath) && invokedPath === normalize(fileURLToPath(import.meta.url))) {
  main();
}
