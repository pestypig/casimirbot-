import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2QeiDossierArtifact } from "../../shared/contracts/nhm2-qei-dossier.v1";
import {
  isNhm2QeiWorldlineDossier,
  type Nhm2QeiWorldlineDossierV1,
} from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";
import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2TileEffectiveCounterpartArtifact,
  isNhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartComparisonRole,
  type Nhm2TileEffectiveCounterpartRegion,
  type Nhm2TileEffectiveCounterpartTensorAuthorityMode,
} from "../../shared/contracts/nhm2-tile-effective-counterpart.v1";
import {
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";
import {
  isNhm2TileCounterpartConservationArtifact,
  type Nhm2TileCounterpartConservationArtifact,
} from "../../shared/contracts/nhm2-tile-counterpart-conservation.v1";

const TILE_COUNTERPART_LITERATURE_REFS = [
  "natario_2001_zero_expansion",
  "pfenning_ford_1997_warp_drive_qi_restrictions",
  "ford_roman_1996_negative_energy_restrictions",
  "fewster_thompson_2023_stationary_worldline_qei",
  "maldacena_2025_real_observers_v3",
];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const getNested = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>((cursor, part) => asRecord(cursor)?.[part], value);

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

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

type ConservationStatus = "pass" | "review" | "fail" | "missing" | "unknown";

const conservationBlocker = (status: ConservationStatus): string | null => {
  if (status === "pass") return null;
  return status === "review" || status === "fail"
    ? "conservation_not_pass"
    : "conservation_unknown";
};

const maxFinite = (values: Array<number | null>): number | null => {
  const finiteValues = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return finiteValues.length > 0 ? Math.max(...finiteValues) : null;
};

const summarizeConservationDiagnostics = (
  conservation: Nhm2TileCounterpartConservationArtifact | null,
): Nhm2TileEffectiveCounterpartArtifact["conservationDiagnostics"] => ({
  divTStatus:
    conservation?.overallState === "pass" ||
    conservation?.overallState === "review" ||
    conservation?.overallState === "fail"
      ? conservation.overallState
      : "unknown",
  divTResidualLInf: maxFinite(
    conservation?.regions.map((region) => region.divTResidualLInf) ?? [],
  ),
  continuityResidualLInf: maxFinite(
    conservation?.regions.map((region) => region.continuityResidualLInf) ?? [],
  ),
  momentumResidualLInf: maxFinite(
    conservation?.regions.map((region) => region.momentumResidualLInf) ?? [],
  ),
});

const normalizeTensor = (value: unknown): Nhm2RegionalTensor => {
  const record = asRecord(value);
  const tensor: Nhm2RegionalTensor = {};
  if (record == null) return tensor;
  for (const component of NHM2_TENSOR_COMPONENTS) {
    if (component in record) tensor[component] = asNumber(record[component]);
  }
  return tensor;
};

const qeiStatusFromDossier = (value: unknown): "PASS" | "REVIEW" | "FAIL" | "UNKNOWN" => {
  if (isNhm2QeiDossierArtifact(value)) {
    return value.qeiApplicabilityStatus;
  }
  if (isNhm2QeiWorldlineDossier(value)) {
    if (
      value.summary.dossierComplete &&
      value.summary.hasWallWorldline &&
      value.summary.allMarginsPass === true &&
      !value.summary.anyProxy
    ) {
      return "PASS";
    }
    return value.summary.anyProxy || value.summary.allMarginsPass === null ? "REVIEW" : "FAIL";
  }
  return "UNKNOWN";
};

const qeiWorldline = (value: unknown): Nhm2QeiWorldlineDossierV1 | null =>
  isNhm2QeiWorldlineDossier(value) ? value : null;

const componentSet = (tensor: Nhm2RegionalTensor): Set<Nhm2TensorComponent> =>
  new Set(NHM2_TENSOR_COMPONENTS.filter((component) => tensor[component] != null));

const inferTensorAuthority = (
  tensor: Nhm2RegionalTensor,
  evidenceText: string,
): Nhm2TileEffectiveCounterpartTensorAuthorityMode => {
  const text = evidenceText.toLowerCase();
  if (
    text.includes("diagonal_proxy") ||
    text.includes("pressure proxy") ||
    text.includes("proxy_scaled_from_region_mean_t00")
  ) {
    return "diagonal_reduced_order";
  }
  const components = componentSet(tensor);
  if (NHM2_TENSOR_COMPONENTS.every((component) => components.has(component))) {
    return "full_tensor";
  }
  const symmetric: Nhm2TensorComponent[] = [
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
  return "unknown";
};

const normalizeAggregationMode = (value: unknown): "mean" | "integral" | "unknown" =>
  value === "mean" || value === "integral" ? value : "unknown";

const normalizeNormalizationBasis = (
  value: unknown,
): "sample_count" | "volume" | "unknown" =>
  value === "sample_count" || value === "volume" ? value : "unknown";

const tensorsEqual = (left: Nhm2RegionalTensor, right: Nhm2RegionalTensor): boolean => {
  const keys = NHM2_TENSOR_COMPONENTS.filter(
    (component) => left[component] != null || right[component] != null,
  );
  return keys.length > 0 && keys.every((component) => left[component] === right[component]);
};

const extractTrace = (region: Record<string, unknown> | null) =>
  asRecord(getNested(region, ["tileT00Diagnostics", "trace"]));

const extractPathFacts = (region: Record<string, unknown> | null) =>
  asRecord(extractTrace(region)?.pathFacts);

const normalizeRole = (
  role: string | null,
): Nhm2TileEffectiveCounterpartComparisonRole =>
  role === "tile_effective_counterpart" ||
  role === "gr_matter_channel_observation" ||
  role === "metric_echo_diagnostic_only"
    ? role
    : "unknown";

const metricEchoDetected = (
  metricTensor: Nhm2RegionalTensor,
  tileTensor: Nhm2RegionalTensor,
  evidenceText: string,
): boolean => {
  const lower = evidenceText.toLowerCase();
  return (
    lower.includes("metric_echo") ||
    lower.includes("metric required echo") ||
    lower.includes("copied_from_metric_required") ||
    lower.includes("derived_from_metric_required") ||
    (tensorsEqual(metricTensor, tileTensor) &&
      (lower.includes("metric_echo") || lower.includes("copied_from_metric_required")))
  );
};

const makeMissingRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2TileEffectiveCounterpartRegion => ({
  regionId,
  status: "missing",
  comparisonRole: "unknown",
  tensorAuthorityMode: "unknown",
  tensor: {},
  chartRef: "comoving_cartesian",
  unitsRef: "J/m^3",
  regionMaskRef: null,
  aggregationMode: "unknown",
  normalizationBasis: "unknown",
  sampleCount: null,
  provenance: {
    producerModule: null,
    producerFunction: null,
    inputRefs: [],
    sourceModelId: null,
    sourceModelVersion: null,
    derivationMode: "unknown",
    notDerivedFromMetricRequiredTensor: false,
  },
  blockers: ["tile_effective_counterpart_missing"],
});

const makeRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  sourceRegion: Record<string, unknown> | null,
  sourceClosure: Record<string, unknown>,
): Nhm2TileEffectiveCounterpartRegion => {
  if (sourceRegion == null && regionId !== "global") return makeMissingRegion(regionId);

  const metricTensor =
    regionId === "global"
      ? normalizeTensor(asRecord(asRecord(sourceClosure.tensors)?.metricRequired))
      : normalizeTensor(sourceRegion?.metricRequiredTensor);
  const tileTensor =
    regionId === "global"
      ? normalizeTensor(asRecord(asRecord(sourceClosure.tensors)?.tileEffective))
      : normalizeTensor(sourceRegion?.tileEffectiveTensor);
  const trace = regionId === "global" ? null : extractTrace(sourceRegion);
  const pathFacts = regionId === "global" ? null : extractPathFacts(sourceRegion);
  const accounting =
    regionId === "global"
      ? asRecord(asRecord(sourceClosure.globalAccounting)?.tile)
      : asRecord(sourceRegion?.tileAccounting);
  const diagnostics =
    regionId === "global" ? null : asRecord(sourceRegion?.tileT00Diagnostics);
  const evidenceText = JSON.stringify({ sourceRegion, sourceClosureGlobal: regionId === "global" ? sourceClosure : null });
  const metricEcho = metricEchoDetected(metricTensor, tileTensor, evidenceText);
  const role = metricEcho
    ? "metric_echo_diagnostic_only"
    : regionId === "global"
      ? "tile_effective_counterpart"
      : normalizeRole(asString(pathFacts?.comparisonRole));
  const tensorAuthorityMode = inferTensorAuthority(tileTensor, evidenceText);
  const blockers: string[] = [];
  if (role === "gr_matter_channel_observation") blockers.push("tile_effective_counterpart_missing");
  if (role === "unknown") blockers.push("tile_effective_counterpart_missing");
  if (metricEcho) blockers.push("metric_echo_not_source_closure");
  if (tensorAuthorityMode === "diagonal_reduced_order") {
    blockers.push("full_tensor_authority_missing");
  }
  if (tensorAuthorityMode === "proxy") blockers.push("proxy_tensor_authority");

  return {
    regionId,
    status: metricEcho ? "fail" : blockers.length > 0 ? "review" : "pass",
    comparisonRole: role,
    tensorAuthorityMode,
    tensor: tileTensor,
    chartRef: asString(pathFacts?.chartRef) ?? "comoving_cartesian",
    unitsRef: asString(pathFacts?.unitsRef) ?? "J/m^3",
    regionMaskRef:
      asString(pathFacts?.maskClassifierRef) ??
      asString(trace?.regionMaskRef) ??
      (regionId === "global" ? "global" : null),
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
    provenance: {
      producerModule: asString(pathFacts?.producerModule) ?? null,
      producerFunction: asString(pathFacts?.producerFunction) ?? null,
      inputRefs: [
        asString(pathFacts?.inputFieldRef),
        asString(pathFacts?.preAggregationValueRef),
        asString(trace?.tensorRef),
      ].filter((entry): entry is string => entry != null),
      sourceModelId: asString(pathFacts?.sourceModelId) ?? null,
      sourceModelVersion: asString(pathFacts?.sourceModelVersion) ?? null,
      derivationMode: metricEcho
        ? "metric_echo"
        : tensorAuthorityMode === "diagonal_reduced_order"
          ? "diagonal_proxy"
          : role === "tile_effective_counterpart"
            ? "tile_model_reconstituted_full_tensor"
            : "unknown",
      notDerivedFromMetricRequiredTensor: !metricEcho,
    },
    blockers,
  };
};

const mapSourceDerivationMode = (
  mode: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]["provenance"]["derivationMode"],
): Nhm2TileEffectiveCounterpartRegion["provenance"]["derivationMode"] => {
  if (mode === "metric_echo") return "metric_echo";
  if (mode === "diagonal_proxy") return "diagonal_proxy";
  if (mode === "source_model_direct_full_tensor") return "tile_model_direct_full_tensor";
  if (mode === "source_model_reconstituted_full_tensor") return "tile_model_reconstituted_full_tensor";
  return "unknown";
};

const makeRegionFromFullTensorSource = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  sourceRegion: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number] | null,
  sourceArtifact: Nhm2TileEffectiveFullTensorSourceArtifact,
  qeiStatus: "PASS" | "REVIEW" | "FAIL" | "UNKNOWN",
  conservationStatus: "pass" | "review" | "fail" | "missing" | "unknown",
): Nhm2TileEffectiveCounterpartRegion => {
  if (sourceRegion == null) return makeMissingRegion(regionId);
  const sourceSide =
    sourceArtifact.sourceModel.sourceSideOnly &&
    sourceArtifact.sourceModel.notDerivedFromMetricRequiredTensor &&
    sourceArtifact.sourceModel.metricRequiredInputRefs.length === 0 &&
    sourceRegion.provenance.notDerivedFromMetricRequiredTensor &&
    sourceRegion.provenance.derivationMode !== "metric_echo";
  const fullAuthority =
    sourceRegion.tensorAuthorityMode === "full_tensor" ||
    sourceRegion.tensorAuthorityMode === "symmetric_full_tensor";
  const blockers = [...sourceRegion.blockers];
  if (!sourceSide) blockers.push("metric_required_derivation_not_allowed");
  if (!fullAuthority) blockers.push("full_tensor_authority_missing");
  if (qeiStatus !== "PASS") blockers.push("qei_not_promotion_safe");
  const conservationGateBlocker = conservationBlocker(conservationStatus);
  if (conservationGateBlocker != null) blockers.push(conservationGateBlocker);
  const comparisonRole =
    sourceSide && fullAuthority
      ? "tile_effective_counterpart"
      : sourceRegion.provenance.derivationMode === "metric_echo"
        ? "metric_echo_diagnostic_only"
        : "unknown";
  return {
    regionId,
    status:
      sourceRegion.status === "fail" || !sourceSide
        ? "fail"
        : blockers.length > 0
          ? "review"
          : "pass",
    comparisonRole,
    tensorAuthorityMode:
      sourceRegion.tensorAuthorityMode === "metric_echo_forbidden"
        ? "unknown"
        : sourceRegion.tensorAuthorityMode,
    tensor: sourceRegion.tensor,
    chartRef: sourceRegion.chartRef,
    unitsRef: sourceRegion.unitsRef,
    regionMaskRef: sourceRegion.regionMaskRef,
    aggregationMode: sourceRegion.aggregationMode,
    normalizationBasis: sourceRegion.normalizationBasis,
    sampleCount: sourceRegion.sampleCount,
    provenance: {
      producerModule: sourceRegion.provenance.producerModule,
      producerFunction: sourceRegion.provenance.producerFunction,
      inputRefs: sourceRegion.provenance.inputRefs,
      sourceModelId: sourceArtifact.sourceModel.sourceModelId,
      sourceModelVersion: sourceArtifact.sourceModel.sourceModelVersion,
      derivationMode: mapSourceDerivationMode(sourceRegion.provenance.derivationMode),
      notDerivedFromMetricRequiredTensor: sourceSide,
    },
    blockers,
  };
};

export const publishTileEffectiveCounterpart = (args: {
  repoRoot: string;
  referenceRunPath: string;
  sourceClosurePath: string;
  outPath: string;
  qeiDossierPath?: string | null;
  tileFullTensorSourcePath?: string | null;
  conservationPath?: string | null;
  auditOnly?: boolean;
}): Nhm2TileEffectiveCounterpartArtifact => {
  const paths = [
    args.referenceRunPath,
    args.sourceClosurePath,
    args.qeiDossierPath ?? "",
    args.tileFullTensorSourcePath ?? "",
    args.conservationPath ?? "",
  ];
  if (!args.auditOnly && paths.some((path) => path.length > 0 && pathUsesLatestAlias(path))) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  if (!isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be a valid nhm2_reference_run/v1 artifact");
  }
  const sourceClosure = asRecord(readJson(resolvePath(args.repoRoot, args.sourceClosurePath)));
  if (sourceClosure == null) throw new Error("source closure artifact must be a JSON object");
  const qeiDossier =
    args.qeiDossierPath != null && existsSync(resolvePath(args.repoRoot, args.qeiDossierPath))
      ? readJson(resolvePath(args.repoRoot, args.qeiDossierPath))
      : null;
  const qei = isNhm2QeiDossierArtifact(qeiDossier) ? qeiDossier : null;
  const qeiWorldlineDossier = qeiWorldline(qeiDossier);
  const qeiStatus = qeiStatusFromDossier(qeiDossier);
  const fullTensorSource =
    args.tileFullTensorSourcePath != null &&
    existsSync(resolvePath(args.repoRoot, args.tileFullTensorSourcePath))
      ? readJson(resolvePath(args.repoRoot, args.tileFullTensorSourcePath))
      : null;
  if (fullTensorSource != null && !isNhm2TileEffectiveFullTensorSourceArtifact(fullTensorSource)) {
    throw new Error("tile full tensor source must be nhm2_tile_effective_full_tensor_source/v1");
  }
  const conservation =
    args.conservationPath != null && existsSync(resolvePath(args.repoRoot, args.conservationPath))
      ? readJson(resolvePath(args.repoRoot, args.conservationPath))
      : null;
  if (conservation != null && !isNhm2TileCounterpartConservationArtifact(conservation)) {
    throw new Error("conservation must be nhm2_tile_counterpart_conservation/v1");
  }
  const sourceArtifact = isNhm2TileEffectiveFullTensorSourceArtifact(fullTensorSource)
    ? fullTensorSource
    : null;
  const conservationArtifact = isNhm2TileCounterpartConservationArtifact(conservation)
    ? conservation
    : null;
  const conservationRegionMap = new Map(
    conservationArtifact?.regions.map((region) => [region.regionId, region]) ?? [],
  );
  const conservationStatusForRegion = (
    regionId: Nhm2RegionalSourceClosureRegionId,
  ): ConservationStatus => {
    if (args.conservationPath == null || conservationArtifact == null) return "unknown";
    return conservationRegionMap.get(regionId)?.status ?? "unknown";
  };
  const sourceRegionMap = new Map(
    sourceArtifact?.regions.map((region) => [region.regionId, region]) ?? [],
  );

  const regionMap = new Map<string, Record<string, unknown>>();
  const sourceRegions = getNested(sourceClosure, ["regionComparisons", "regions"]);
  if (Array.isArray(sourceRegions)) {
    for (const entry of sourceRegions) {
      const region = asRecord(entry);
      const regionId = asString(region?.regionId);
      if (region != null && regionId != null) regionMap.set(regionId, region);
    }
  }

  const artifact = buildNhm2TileEffectiveCounterpartArtifact({
    generatedAt: new Date().toISOString(),
    runId: referenceRun.runId,
    selectedProfileId: referenceRun.selectedFamily.selectedProfileId,
    expectedProfileId: referenceRun.selectedFamily.expectedProfileId,
    laneId: "nhm2_shift_lapse",
    sourceAuthorityMode: "unknown",
    sourceTensorArtifactRef: args.tileFullTensorSourcePath ?? null,
    sourceTensorAuthorityMode: sourceArtifact?.sourceModel.sourceModelClass ?? null,
    conservationRef: args.conservationPath ?? null,
    conservationStatus: conservationArtifact?.overallState ?? "unknown",
    qeiDossierRef: args.qeiDossierPath ?? null,
    qeiApplicabilityStatus: qeiStatus,
    quantumStateAssumptions: qei?.quantumStateAssumptions ?? [],
    renormalizationConvention: qei?.renormalizationConvention ?? null,
    cavityBoundaryModel: qei?.cavityBoundaryModel ?? null,
    cycleAverageClosureStatus:
      qei?.cycleAverageClosureStatus ??
      (qeiWorldlineDossier?.summary.dossierComplete === true ? "pass" : "unknown"),
    dutyCycleStatus:
      qei?.dutyCyclePass == null
        ? qeiWorldlineDossier?.summary.dossierComplete === true
          ? "pass"
          : "unknown"
        : qei.dutyCyclePass
          ? "pass"
          : "fail",
    lightCrossingConsistencyStatus:
      qei?.lightCrossingConsistencyStatus ??
      (qeiWorldlineDossier?.summary.dossierComplete === true ? "pass" : "unknown"),
    conservationDiagnostics: summarizeConservationDiagnostics(conservationArtifact),
    regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
      sourceArtifact == null
        ? makeRegion(regionId, regionMap.get(regionId) ?? null, sourceClosure)
        : makeRegionFromFullTensorSource(
            regionId,
            sourceRegionMap.get(regionId) ?? null,
            sourceArtifact,
            qeiStatus,
            conservationStatusForRegion(regionId),
          ),
    ),
    literatureRefs: TILE_COUNTERPART_LITERATURE_REFS,
  });

  if (!isNhm2TileEffectiveCounterpartArtifact(artifact)) {
    throw new Error("internal error: produced invalid tile-effective counterpart artifact");
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
  const artifact = publishTileEffectiveCounterpart({
    repoRoot: process.cwd(),
    referenceRunPath,
    sourceClosurePath,
    qeiDossierPath: asString(args["qei-dossier"]),
    tileFullTensorSourcePath: asString(args["tile-full-tensor-source"]),
    conservationPath: asString(args.conservation),
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

const invokedPath = process.argv[1] ? normalize(process.argv[1]) : "";
if (existsSync(invokedPath) && invokedPath === normalize(fileURLToPath(import.meta.url))) {
  main();
}
