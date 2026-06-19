import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2CandidateMetricProfileSpec } from "../../shared/contracts/nhm2-candidate-metric-profile-spec.v1";
import {
  isNhm2MetricRequiredRegionalFullTensorSourceArtifact,
  type Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1,
} from "../../shared/contracts/nhm2-metric-required-regional-full-tensor-source.v1";
import {
  buildNhm2RegionalSourceClosureEvidenceArtifact,
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2ComparisonBasisStatus,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceRegion,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const REQUIRED_COMPONENTS = [
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
] as const satisfies readonly Nhm2TensorComponent[];

const SAME_CHART_TO_REGIONAL: Record<string, Nhm2TensorComponent> = {
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
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

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

const tensorFromMetricRegion = (
  metricRegion: Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1["regions"][number],
): Nhm2RegionalTensor => {
  const tensor: Nhm2RegionalTensor = {};
  for (const component of metricRegion.sameChartFullTensor.components) {
    const mapped = SAME_CHART_TO_REGIONAL[component.componentId];
    if (mapped != null && typeof component.valueSI === "number") {
      tensor[mapped] = component.valueSI;
    }
  }
  return tensor;
};

const comparisonBasisStatusFor = (
  metric: Nhm2RegionalSourceClosureEvidenceRegion["metricRequired"],
  tile: Nhm2RegionalSourceClosureEvidenceRegion["tileEffectiveCounterpart"],
): Nhm2ComparisonBasisStatus => {
  if (metric.chartRef !== tile.chartRef) return "chart_mismatch";
  if (metric.unitsRef !== tile.unitsRef) return "unit_mismatch";
  if (
    metric.aggregationMode !== tile.aggregationMode ||
    metric.normalizationBasis !== tile.normalizationBasis
  ) {
    return "aggregation_mismatch";
  }
  if (
    metric.sampleCount != null &&
    tile.sampleCount != null &&
    metric.sampleCount !== tile.sampleCount
  ) {
    return "sample_count_mismatch";
  }
  return "same_basis";
};

const residualsFor = (
  metric: Nhm2RegionalTensor,
  tile: Nhm2RegionalTensor,
  toleranceRelLInf: number,
): Nhm2RegionalSourceClosureEvidenceRegion["residuals"] => {
  const componentResiduals: Nhm2RegionalSourceClosureEvidenceRegion["residuals"]["componentResiduals"] = {};
  for (const component of REQUIRED_COMPONENTS) {
    const metricRequired = metric[component];
    const tileEffectiveCounterpart = tile[component];
    if (
      typeof metricRequired !== "number" ||
      typeof tileEffectiveCounterpart !== "number"
    ) {
      continue;
    }
    const absResidual = Math.abs(metricRequired - tileEffectiveCounterpart);
    componentResiduals[component] = {
      metricRequired,
      tileEffectiveCounterpart,
      absResidual,
      relResidual:
        Math.abs(metricRequired) > 0
          ? absResidual / Math.abs(metricRequired)
          : absResidual,
    };
  }
  const relResiduals = Object.values(componentResiduals)
    .map((entry) => entry?.relResidual)
    .filter((value): value is number => value != null);
  const absResiduals = Object.values(componentResiduals)
    .map((entry) => entry?.absResidual)
    .filter((value): value is number => value != null);
  const relLInf = relResiduals.length === 0 ? null : Math.max(...relResiduals);
  const absLInf = absResiduals.length === 0 ? null : Math.max(...absResiduals);
  return {
    componentResiduals,
    relLInf,
    absLInf,
    toleranceRelLInf,
    pass: relLInf == null ? null : relLInf <= toleranceRelLInf,
  };
};

export const buildCandidateRegionalSourceClosureEvidence = (args: {
  generatedAt?: string | null;
  candidateProfileSpec: unknown;
  metricRequiredFullRegionalTensor: unknown;
  sourceFullTensor: unknown;
  metricRequiredFullRegionalTensorRef: string;
  sourceFullTensorRef: string;
  toleranceRelLInf?: number | null;
}): Nhm2RegionalSourceClosureEvidenceArtifact => {
  if (!isNhm2CandidateMetricProfileSpec(args.candidateProfileSpec)) {
    throw new Error("candidate profile spec must be nhm2_candidate_metric_profile_spec/v1");
  }
  if (
    !isNhm2MetricRequiredRegionalFullTensorSourceArtifact(
      args.metricRequiredFullRegionalTensor,
    )
  ) {
    throw new Error(
      "metric-required full regional tensor must be nhm2_metric_required_regional_full_tensor_source/v1",
    );
  }
  if (!isNhm2TileEffectiveFullTensorSourceArtifact(args.sourceFullTensor)) {
    throw new Error(
      "source full tensor must be nhm2_tile_effective_full_tensor_source/v1",
    );
  }
  const spec = args.candidateProfileSpec;
  const metric = args.metricRequiredFullRegionalTensor;
  const source = args.sourceFullTensor;
  const toleranceRelLInf = args.toleranceRelLInf ?? 0.1;
  const metricByRegion = new Map(metric.regions.map((region) => [region.regionId, region]));
  const sourceByRegion = new Map(source.regions.map((region) => [region.regionId, region]));
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const metricRegion = metricByRegion.get(regionId);
    const sourceRegion = sourceByRegion.get(regionId);
    if (metricRegion == null || sourceRegion == null) {
      return {
        regionId,
        status: "missing",
        comparisonBasisStatus: "counterpart_missing",
        metricRequired: {
          tensorRef: metricRegion?.tensorRef ?? null,
          tensorAuthorityMode: "unknown",
          tensor: {},
          chartRef: "comoving_cartesian",
          unitsRef: "J/m^3",
          aggregationMode: "unknown",
          normalizationBasis: "unknown",
          sampleCount: null,
        },
        tileEffectiveCounterpart: {
          tensorRef:
            sourceRegion == null ? null : `${args.sourceFullTensorRef}#${regionId}`,
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
          toleranceRelLInf,
          pass: null,
        },
        blockers: ["candidate_regional_source_closure_region_missing"],
      } satisfies Nhm2RegionalSourceClosureEvidenceRegion;
    }
    const metricTensor = tensorFromMetricRegion(metricRegion);
    const tileTensor = sourceRegion.tensor;
    const metricSide: Nhm2RegionalSourceClosureEvidenceRegion["metricRequired"] = {
      tensorRef:
        metricRegion.tensorRef ??
        `${args.metricRequiredFullRegionalTensorRef}#${regionId}`,
      tensorAuthorityMode: metricRegion.sameChartFullTensor.completeness.fullTensorComplete
        ? "symmetric_full_tensor"
        : "unknown",
      tensor: metricTensor,
      chartRef: metric.chartId,
      unitsRef: "J/m^3",
      aggregationMode: metricRegion.aggregationMode,
      normalizationBasis: metricRegion.normalizationBasis,
      sampleCount: metricRegion.sampleCount,
    };
    const tileSide: Nhm2RegionalSourceClosureEvidenceRegion["tileEffectiveCounterpart"] = {
      tensorRef: `${args.sourceFullTensorRef}#${regionId}`,
      tensorAuthorityMode: sourceRegion.tensorAuthorityMode,
      tensor: tileTensor,
      chartRef: sourceRegion.chartRef,
      unitsRef: sourceRegion.unitsRef,
      aggregationMode: sourceRegion.aggregationMode,
      normalizationBasis: sourceRegion.normalizationBasis,
      sampleCount: sourceRegion.sampleCount,
      comparisonRole: "tile_effective_counterpart",
    };
    return {
      regionId,
      status: "review",
      comparisonBasisStatus: comparisonBasisStatusFor(metricSide, tileSide),
      metricRequired: metricSide,
      tileEffectiveCounterpart: tileSide,
      residuals: residualsFor(metricTensor, tileTensor, toleranceRelLInf),
      blockers: [
        ...metricRegion.blockers,
        ...sourceRegion.blockers,
        ...(source.profileMatch ? [] : ["candidate_source_tensor_profile_mismatch"]),
        ...(source.sourceModel.metricRequiredInputRefs.length === 0
          ? []
          : ["candidate_source_tensor_has_metric_required_inputs"]),
      ],
    } satisfies Nhm2RegionalSourceClosureEvidenceRegion;
  });

  return buildNhm2RegionalSourceClosureEvidenceArtifact({
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    runId: `${spec.candidateProfileId}:candidate_regional_source_closure`,
    selectedProfileId: spec.candidateProfileId,
    expectedProfileId: spec.candidateProfileId,
    laneId: "nhm2_shift_lapse",
    ...(spec.executableGeometry.regionalSupportAtlasRef == null
      ? {}
      : { atlasRef: spec.executableGeometry.regionalSupportAtlasRef }),
    regions,
    literatureRefs: [
      "klimchitskaya_mohideen_mostepanenko_2009_lifshitz_review",
      "reid_white_johnson_2010_arbitrary_geometry_casimir",
    ],
  });
};

export const publishCandidateRegionalSourceClosureEvidence = (args: {
  repoRoot: string;
  candidateProfileSpecPath: string;
  metricRequiredFullRegionalTensorPath: string;
  sourceFullTensorPath: string;
  outPath: string;
  toleranceRelLInf?: number | null;
  auditOnly?: boolean;
}): Nhm2RegionalSourceClosureEvidenceArtifact => {
  if (
    !args.auditOnly &&
    [
      args.candidateProfileSpecPath,
      args.metricRequiredFullRegionalTensorPath,
      args.sourceFullTensorPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const artifact = buildCandidateRegionalSourceClosureEvidence({
    candidateProfileSpec: readJson(resolvePath(args.repoRoot, args.candidateProfileSpecPath)),
    metricRequiredFullRegionalTensor: readJson(
      resolvePath(args.repoRoot, args.metricRequiredFullRegionalTensorPath),
    ),
    sourceFullTensor: readJson(resolvePath(args.repoRoot, args.sourceFullTensorPath)),
    metricRequiredFullRegionalTensorRef: args.metricRequiredFullRegionalTensorPath,
    sourceFullTensorRef: args.sourceFullTensorPath,
    toleranceRelLInf: args.toleranceRelLInf ?? null,
  });
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const candidateProfileSpecPath = asString(args["candidate-profile-spec"]);
  const metricRequiredFullRegionalTensorPath = asString(
    args["metric-required-full-regional-tensor"],
  );
  const sourceFullTensorPath = asString(args["source-full-tensor"]);
  const outPath = asString(args.out);
  if (
    candidateProfileSpecPath == null ||
    metricRequiredFullRegionalTensorPath == null ||
    sourceFullTensorPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--candidate-profile-spec, --metric-required-full-regional-tensor, --source-full-tensor, and --out are required",
    );
  }
  const artifact = publishCandidateRegionalSourceClosureEvidence({
    repoRoot: process.cwd(),
    candidateProfileSpecPath,
    metricRequiredFullRegionalTensorPath,
    sourceFullTensorPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
