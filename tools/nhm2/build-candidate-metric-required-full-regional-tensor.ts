import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  calculateMetricStressEnergyTensorRegionMeansFromShiftField,
  calculateNatarioWarpBubble,
  type MetricStressEnergyTensorMean,
} from "../../modules/warp/natario-warp";
import {
  isNhm2CandidateCampaignGrid,
  type Nhm2CandidateCampaignGridV1,
} from "../../shared/contracts/nhm2-candidate-campaign-grid.v1";
import {
  isNhm2CandidateMetricProfileSpec,
  type Nhm2CandidateMetricProfileSpecV1,
} from "../../shared/contracts/nhm2-candidate-metric-profile-spec.v1";
import {
  buildNhm2MetricRequiredRegionalFullTensorSourceArtifact,
  isNhm2MetricRequiredRegionalFullTensorSourceArtifact,
  type Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1,
  type Nhm2MetricRequiredRegionalFullTensorSourceRegionV1,
} from "../../shared/contracts/nhm2-metric-required-regional-full-tensor-source.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2SameChartFullTensorArtifact,
  type Nhm2SameChartFullTensorArtifactV1,
} from "../../shared/contracts/nhm2-same-chart-full-tensor.v1";

const DEFAULT_DIMS: [number, number, number] = [12, 12, 12];
const BASE_BUBBLE_RADIUS_M = 0.025;
const BASE_SHIFT_AMPLITUDE = 50e-12;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8").replace(/^\uFEFF/, ""));

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

const parseDims = (value: unknown): [number, number, number] => {
  const text = asString(value);
  if (text == null) return DEFAULT_DIMS;
  const parts = text.split(",").map((part) => Number(part.trim()));
  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isFinite(part) || part < 4)
  ) {
    throw new Error("--grid-dims must be three comma-separated integers >= 4");
  }
  return [Math.floor(parts[0]), Math.floor(parts[1]), Math.floor(parts[2])];
};

const tensorForMean = (
  mean: MetricStressEnergyTensorMean,
): Record<string, number> | null => {
  const tensor = mean.fullTensor;
  if (tensor == null) return null;
  const required = [
    tensor.T00,
    tensor.T01,
    tensor.T02,
    tensor.T03,
    tensor.T11,
    tensor.T12,
    tensor.T13,
    tensor.T22,
    tensor.T23,
    tensor.T33,
  ];
  if (required.some((value) => !Number.isFinite(value))) return null;
  return {
    T00: tensor.T00,
    T01: tensor.T01,
    T02: tensor.T02,
    T03: tensor.T03,
    T11: tensor.T11,
    T12: tensor.T12,
    T13: tensor.T13,
    T22: tensor.T22,
    T23: tensor.T23,
    T33: tensor.T33,
  };
};

const regionIdForRadius = (
  radiusOverBubble: number,
): Nhm2RegionalSourceClosureRegionId | null => {
  if (radiusOverBubble <= 0.55) return "hull";
  if (radiusOverBubble <= 1.05) return "wall";
  if (radiusOverBubble <= 1.6) return "exterior_shell";
  return null;
};

const missingTensor = (args: {
  generatedAt: string;
  candidateProfileId: string;
  regionId: Nhm2RegionalSourceClosureRegionId;
  artifactRef: string;
  blocker: string;
}): Nhm2SameChartFullTensorArtifactV1 =>
  buildNhm2SameChartFullTensorArtifact({
    generatedAt: args.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: args.candidateProfileId,
    chartId: "comoving_cartesian",
    metricFamily: "nhm2_shift_lapse",
    routeId: "candidate_adm_shift_field_region_mean_v1",
    source: "adm_projection",
    artifactRef: `${args.artifactRef}#${args.regionId}`,
    defaultAssumptions: [
      `regionId=${args.regionId}`,
      "candidate ADM reduced-order route attempted to evaluate the runtime shift field",
      "missing components are not zero-filled",
    ],
    componentBlockers: {
      T00: [args.blocker],
      T0x: [args.blocker],
      T0y: [args.blocker],
      T0z: [args.blocker],
      Txx: [args.blocker],
      Txy: [args.blocker],
      Txz: [args.blocker],
      Tyy: [args.blocker],
      Tyz: [args.blocker],
      Tzz: [args.blocker],
    },
    adm: {
      alphaStatus: "computed",
      betaStatus: "computed",
      gammaStatus: "derived_same_chart",
      extrinsicCurvatureStatus: "derived_same_chart",
    },
  });

const sameChartTensorForMean = (args: {
  generatedAt: string;
  candidateProfileSpec: Nhm2CandidateMetricProfileSpecV1;
  mean: MetricStressEnergyTensorMean;
  regionId: Nhm2RegionalSourceClosureRegionId;
  artifactRef: string;
  gridDims: [number, number, number];
  bubbleRadius_m: number;
}): Nhm2SameChartFullTensorArtifactV1 => {
  const tensor = tensorForMean(args.mean);
  if (tensor == null) {
    return missingTensor({
      generatedAt: args.generatedAt,
      candidateProfileId: args.candidateProfileSpec.candidateProfileId,
      regionId: args.regionId,
      artifactRef: args.artifactRef,
      blocker: "candidate_adm_metric_required_region_tensor_unavailable",
    });
  }
  return buildNhm2SameChartFullTensorArtifact({
    generatedAt: args.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: args.candidateProfileSpec.candidateProfileId,
    chartId: "comoving_cartesian",
    metricFamily: "nhm2_shift_lapse",
    routeId: "candidate_adm_shift_field_region_mean_v1",
    source: "adm_projection",
    artifactRef: `${args.artifactRef}#${args.regionId}`,
    tensor,
    defaultAssumptions: [
      `regionId=${args.regionId}`,
      `runtimeProfileId=${args.candidateProfileSpec.executableGeometry.runtimeProfileId ?? "unknown"}`,
      `sampleCount=${args.mean.sampleCount}`,
      `gridDims=${args.gridDims.join("x")}`,
      `bubbleRadius_m=${args.bubbleRadius_m}`,
      "candidate metric-required full regional tensor was evaluated from the registered runtime shift field",
      "candidate levers are consumed as reduced-order geometry/sampling controls, not as source-side evidence",
      "this artifact is metric-required geometry evidence only and does not validate material/source realizability",
    ],
    adm: {
      alphaStatus: "computed",
      betaStatus: "computed",
      gammaStatus: "derived_same_chart",
      extrinsicCurvatureStatus: "derived_same_chart",
    },
  });
};

const buildCandidateShiftField = (spec: Nhm2CandidateMetricProfileSpecV1) => {
  const wallScale = Math.max(1e-6, spec.profileDefinition.wallThicknessScale);
  const smoothingScale = Math.max(1, spec.profileDefinition.smoothingWidthScale);
  const shiftAmplitudeScale = Math.max(0, spec.profileDefinition.shiftAmplitudeScale);
  const bubbleRadius_m = BASE_BUBBLE_RADIUS_M * wallScale;
  const result = calculateNatarioWarpBubble({
    bowlRadius: bubbleRadius_m * 1e6,
    sagDepth: 16,
    gap: 8,
    cavityQ: 1e9,
    burstDuration: 10,
    cycleDuration: 1000,
    sectorCount: 80,
    dutyFactor: 0.01,
    effectiveDuty: 0.001,
    shiftAmplitude: BASE_SHIFT_AMPLITUDE * shiftAmplitudeScale,
    expansionTolerance: 1e-12,
    warpFieldType: "nhm2_shift_lapse",
    shiftLapseProfileId:
      spec.executableGeometry.runtimeProfileId ?? "stage1_centerline_alpha_0p995_v1",
    alphaCenterline: spec.alphaCenterline,
    bubbleRadius_m,
    bubbleSigma: 1 / smoothingScale,
    hullWallThickness_m: 0.0025 * wallScale,
  });
  return { evaluateShiftVector: result.shiftVectorField.evaluateShiftVector, bubbleRadius_m };
};

export const buildCandidateMetricRequiredFullRegionalTensor = (args: {
  generatedAt?: string | null;
  candidateProfileSpec: Nhm2CandidateMetricProfileSpecV1;
  candidateCampaignGrid: Nhm2CandidateCampaignGridV1;
  candidateProfileSpecRef: string;
  candidateCampaignGridRef: string;
  outArtifactRef: string;
  gridDims?: [number, number, number] | null;
  domainScale?: number | null;
}): Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1 => {
  const spec = args.candidateProfileSpec;
  const grid = args.candidateCampaignGrid;
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  if (!spec.campaignReadiness.canEnterFullAdmMetricTensorRoute) {
    throw new Error(
      `candidate profile is not ready for full ADM route: ${spec.campaignReadiness.firstBlocker ?? "unknown"}`,
    );
  }
  if (!grid.readiness.admSamplingReady) {
    throw new Error(
      `candidate campaign grid is not ready for ADM sampling: ${grid.readiness.blockers[0] ?? "unknown"}`,
    );
  }
  if (grid.candidateProfileId !== spec.candidateProfileId) {
    throw new Error("candidate campaign grid/profile spec mismatch");
  }

  const gridDims = args.gridDims ?? DEFAULT_DIMS;
  const { evaluateShiftVector, bubbleRadius_m } = buildCandidateShiftField(spec);
  const domainScale = Math.max(1.7, args.domainScale ?? 2);
  const bound = bubbleRadius_m * domainScale;
  const means = calculateMetricStressEnergyTensorRegionMeansFromShiftField(
    evaluateShiftVector,
    {
      dims: gridDims,
      bounds: {
        min: [-bound, -bound, -bound],
        max: [bound, bound, bound],
      },
      classifyRegion: ({ position }) =>
        regionIdForRadius(Math.hypot(...position) / Math.max(1e-12, bubbleRadius_m)),
    },
  );
  const byRegion = new Map<
    Nhm2RegionalSourceClosureRegionId,
    MetricStressEnergyTensorMean
  >([
    ["global", means.global],
    ...means.regions
      .filter((entry): entry is typeof entry & { regionId: Nhm2RegionalSourceClosureRegionId } =>
        NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
          entry.regionId as Nhm2RegionalSourceClosureRegionId,
        ),
      )
      .map((entry) => [entry.regionId, entry] as const),
  ]);

  const regions: Nhm2MetricRequiredRegionalFullTensorSourceRegionV1[] =
    NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
      const mean = byRegion.get(regionId) ?? { sampleCount: 0, diagonalTensor: null, fullTensor: null };
      const tensor = sameChartTensorForMean({
        generatedAt,
        candidateProfileSpec: spec,
        mean,
        regionId,
        artifactRef: args.outArtifactRef,
        gridDims,
        bubbleRadius_m,
      });
      const regionSample = grid.regionSamples[regionId];
      const blockers =
        mean.fullTensor == null
          ? ["candidate_adm_metric_required_region_tensor_unavailable"]
          : [];
      return {
        regionId,
        status: tensor.completeness.fullTensorComplete ? "computed" : "blocked",
        artifactRef: `${args.outArtifactRef}#metric-required-full-tensor/${regionId}`,
        tensorRef: `${args.outArtifactRef}#metric-required-full-tensor/${regionId}/sameChartFullTensor`,
        regionMaskRef: regionSample.maskRef,
        aggregationMode: "mean",
        normalizationBasis: "sample_count",
        sampleCount: mean.sampleCount,
        sameChartFullTensor: tensor,
        blockers,
        warnings: [
          "candidate_metric_required_full_tensor_from_reduced_order_adm_shift_field_route",
          "not_a_source_side_material_tensor",
          "not_a_physical_viability_or_route_eta_claim",
        ],
      };
    });

  return buildNhm2MetricRequiredRegionalFullTensorSourceArtifact({
    generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: spec.candidateProfileId,
    chartId: "comoving_cartesian",
    metricFamily: "nhm2_shift_lapse",
    sourceRoute: "adm_projection",
    sourceArtifactRefs: [
      args.candidateProfileSpecRef,
      args.candidateCampaignGridRef,
      ...(spec.executableGeometry.regionalSupportAtlasRef == null
        ? []
        : [spec.executableGeometry.regionalSupportAtlasRef]),
      ...(spec.executableGeometry.runtimeProfileRef == null
        ? []
        : [spec.executableGeometry.runtimeProfileRef]),
    ],
    regions,
  });
};

export const publishCandidateMetricRequiredFullRegionalTensor = (args: {
  repoRoot: string;
  candidateProfileSpecPath: string;
  candidateCampaignGridPath: string;
  outPath: string;
  gridDims?: [number, number, number] | null;
  domainScale?: number | null;
  auditOnly?: boolean;
}): Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1 => {
  if (
    !args.auditOnly &&
    [
      args.candidateProfileSpecPath,
      args.candidateCampaignGridPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const candidateProfileSpec = readJson(args.repoRoot, args.candidateProfileSpecPath);
  if (!isNhm2CandidateMetricProfileSpec(candidateProfileSpec)) {
    throw new Error("candidate profile spec must be nhm2_candidate_metric_profile_spec/v1");
  }
  const candidateCampaignGrid = readJson(args.repoRoot, args.candidateCampaignGridPath);
  if (!isNhm2CandidateCampaignGrid(candidateCampaignGrid)) {
    throw new Error("candidate campaign grid must be nhm2_candidate_campaign_grid/v1");
  }
  const artifact = buildCandidateMetricRequiredFullRegionalTensor({
    candidateProfileSpec,
    candidateCampaignGrid,
    candidateProfileSpecRef: args.candidateProfileSpecPath,
    candidateCampaignGridRef: args.candidateCampaignGridPath,
    outArtifactRef: args.outPath,
    gridDims: args.gridDims,
    domainScale: args.domainScale,
  });
  if (!isNhm2MetricRequiredRegionalFullTensorSourceArtifact(artifact)) {
    throw new Error(
      "internal error: produced invalid candidate metric-required full regional tensor artifact",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const candidateProfileSpecPath = asString(args["candidate-profile-spec"]);
  const candidateCampaignGridPath = asString(args["candidate-campaign-grid"]);
  const outPath = asString(args.out);
  if (
    candidateProfileSpecPath == null ||
    candidateCampaignGridPath == null ||
    outPath == null
  ) {
    throw new Error("--candidate-profile-spec, --candidate-campaign-grid, and --out are required");
  }
  const artifact = publishCandidateMetricRequiredFullRegionalTensor({
    repoRoot: process.cwd(),
    candidateProfileSpecPath,
    candidateCampaignGridPath,
    outPath,
    gridDims: parseDims(args["grid-dims"]),
    domainScale: asNumber(args["domain-scale"]),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
