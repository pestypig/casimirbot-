import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2CandidateMetricProfileSpec } from "../../shared/contracts/nhm2-candidate-metric-profile-spec.v1";
import {
  isNhm2CandidateCampaignGrid,
  type Nhm2CandidateCampaignGridV1,
} from "../../shared/contracts/nhm2-candidate-campaign-grid.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2TileEffectiveFullTensorSourceArtifact,
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

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

const DEFAULT_DIMS: [number, number, number] = [12, 12, 12];
const BASE_BUBBLE_RADIUS_M = 0.025;

const asNumber = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

const regionWeight = (
  regionId: Nhm2RegionalSourceClosureRegionId,
): number => {
  switch (regionId) {
    case "global":
      return 0.6;
    case "hull":
      return 0.35;
    case "wall":
      return 1;
    case "exterior_shell":
      return 0.2;
  }
};

const regionIdForRadius = (
  radiusOverBubble: number,
): Nhm2RegionalSourceClosureRegionId | null => {
  if (radiusOverBubble <= 0.55) return "hull";
  if (radiusOverBubble <= 1.05) return "wall";
  if (radiusOverBubble <= 1.6) return "exterior_shell";
  return null;
};

const campaignEvaluationSampleCounts = (args: {
  wallThicknessScale: number;
  gridDims: [number, number, number];
  domainScale: number;
}): Record<Nhm2RegionalSourceClosureRegionId, number> => {
  const [nx, ny, nz] = args.gridDims;
  const bubbleRadius_m =
    BASE_BUBBLE_RADIUS_M * Math.max(1e-6, args.wallThicknessScale);
  const bound = bubbleRadius_m * Math.max(1.7, args.domainScale);
  const counts: Record<Nhm2RegionalSourceClosureRegionId, number> = {
    global: nx * ny * nz,
    hull: 0,
    wall: 0,
    exterior_shell: 0,
  };
  const coord = (index: number, count: number): number =>
    -bound + (index + 0.5) * ((2 * bound) / count);
  for (let ix = 0; ix < nx; ix += 1) {
    for (let iy = 0; iy < ny; iy += 1) {
      for (let iz = 0; iz < nz; iz += 1) {
        const x = coord(ix, nx);
        const y = coord(iy, ny);
        const z = coord(iz, nz);
        const regionId = regionIdForRadius(
          Math.hypot(x, y, z) / Math.max(1e-12, bubbleRadius_m),
        );
        if (regionId != null) counts[regionId] += 1;
      }
    }
  }
  return counts;
};

const declaredTensorFor = (args: {
  regionId: Nhm2RegionalSourceClosureRegionId;
  baseEnergyDensity: number;
  shiftAmplitudeScale: number;
  smoothingWidthScale: number;
}): Nhm2RegionalTensor => {
  const weight = regionWeight(args.regionId);
  const rho = -Math.abs(args.baseEnergyDensity * weight);
  const momentumScale = Math.max(args.shiftAmplitudeScale, 1e-12);
  const shearScale = 1 / Math.max(args.smoothingWidthScale, 1);
  const j = Math.abs(rho) * momentumScale;
  const stress = -0.18 * rho;
  return {
    T00: rho,
    T01: j,
    T02: 0.7 * j,
    T03: 0.4 * j,
    T11: stress,
    T12: stress * 0.01 * shearScale,
    T13: stress * 0.006 * shearScale,
    T22: stress * 0.85,
    T23: stress * 0.004 * shearScale,
    T33: stress * 0.7,
  };
};

export const publishNhm2CandidateTileEffectiveFullTensorSource = (args: {
  repoRoot: string;
  candidateProfileSpecPath: string;
  candidateCampaignGridPath?: string | null;
  outPath: string;
  runId?: string | null;
  gridDims?: [number, number, number] | null;
  domainScale?: number | null;
  auditOnly?: boolean;
}): Nhm2TileEffectiveFullTensorSourceArtifact => {
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

  const spec = readJson(resolvePath(args.repoRoot, args.candidateProfileSpecPath));
  if (!isNhm2CandidateMetricProfileSpec(spec)) {
    throw new Error("candidate profile spec must be nhm2_candidate_metric_profile_spec/v1");
  }
  const candidateCampaignGrid =
    args.candidateCampaignGridPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.candidateCampaignGridPath));
  if (
    candidateCampaignGrid != null &&
    !isNhm2CandidateCampaignGrid(candidateCampaignGrid)
  ) {
    throw new Error("candidate campaign grid must be nhm2_candidate_campaign_grid/v1");
  }
  if (
    candidateCampaignGrid != null &&
    candidateCampaignGrid.candidateProfileId !== spec.candidateProfileId
  ) {
    throw new Error("candidate campaign grid/profile spec mismatch");
  }
  const levers = spec.profileDefinition;
  const gridDims = args.gridDims ?? DEFAULT_DIMS;
  const domainScale = args.domainScale ?? 2;
  const evaluationSampleCounts = campaignEvaluationSampleCounts({
    wallThicknessScale: levers.wallThicknessScale,
    gridDims,
    domainScale,
  });
  const baseEnergyDensity =
    1e9 *
    Math.max(levers.shiftAmplitudeScale, 1e-12) *
    Math.max(levers.wallThicknessScale, 1) /
    Math.max(levers.smoothingWidthScale, 1);

  const artifact = buildNhm2TileEffectiveFullTensorSourceArtifact({
    generatedAt: new Date().toISOString(),
    runId: args.runId ?? `${spec.candidateProfileId}:candidate_source_tensor`,
    selectedProfileId: spec.candidateProfileId,
    expectedProfileId: spec.candidateProfileId,
    laneId: "nhm2_shift_lapse",
    sourceModel: {
      sourceModelId: "candidate_declared_tile_effective_tensor_lever_model",
      sourceModelVersion: "v1",
      sourceModelClass: "cycle_averaged_tile_model",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
      metricRequiredInputRefs: [],
      sourceInputRefs: [
        args.candidateProfileSpecPath,
        ...(args.candidateCampaignGridPath == null
          ? []
          : [args.candidateCampaignGridPath]),
      ],
      qeiDossierRef: null,
      conservationRef: null,
    },
    regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
      const regionSample =
        candidateCampaignGrid == null
          ? null
          : (candidateCampaignGrid as Nhm2CandidateCampaignGridV1).regionSamples[
              regionId
            ];
      return {
        regionId,
        status: "pass",
        tensorAuthorityMode: "symmetric_full_tensor",
        tensor: declaredTensorFor({
          regionId,
          baseEnergyDensity,
          shiftAmplitudeScale: levers.shiftAmplitudeScale,
          smoothingWidthScale: levers.smoothingWidthScale,
        }),
        symmetry: {
          declared: true,
          kind: "symmetric",
          lowerComponentsDerivedBySymmetry: true,
        },
        chartRef: "comoving_cartesian",
        unitsRef: "J/m^3",
        regionMaskRef:
          regionSample?.maskRef ??
          (regionId === "global"
            ? "candidate_tile_source.aggregate.global"
            : `candidate_tile_source.region.${regionId}`),
        aggregationMode: "mean",
        normalizationBasis: "sample_count",
        sampleCount:
          candidateCampaignGrid == null ? 1 : evaluationSampleCounts[regionId],
        sourceSupport: {
          supportKernelId: spec.profileDefinition.transitionKernel,
          cycleAverageStatus: "review",
          dutyCycleStatus: "review",
          lightCrossingConsistencyStatus: "review",
        },
        provenance: {
          producerModule:
            "tools/nhm2/build-candidate-tile-effective-full-tensor-source.ts",
          producerFunction: "publishNhm2CandidateTileEffectiveFullTensorSource",
          derivationMode: "source_model_direct_full_tensor",
          inputRefs: [
            args.candidateProfileSpecPath,
            ...(args.candidateCampaignGridPath == null
              ? []
              : [args.candidateCampaignGridPath]),
          ],
          preAggregationValueRefs: [
            `candidate_levers:lapseDepthScale=${levers.lapseDepthScale}`,
            `candidate_levers:shiftAmplitudeScale=${levers.shiftAmplitudeScale}`,
            `candidate_levers:wallThicknessScale=${levers.wallThicknessScale}`,
            `candidate_levers:smoothingWidthScale=${levers.smoothingWidthScale}`,
            `campaign_support:gridDims=${gridDims.join("x")}`,
            `campaign_support:domainScale=${domainScale}`,
            ...(regionSample == null
              ? []
              : [
                  `campaign_support:maskRef=${regionSample.maskRef}`,
                  `campaign_support:supportFunctionRef=${regionSample.supportFunctionRef}`,
                  `campaign_support:declaredGridRegionSampleCount=${regionSample.sampleCount}`,
                ]),
            `campaign_support:evaluationRegionSampleCount=${evaluationSampleCounts[regionId]}`,
          ],
          notDerivedFromMetricRequiredTensor: true,
        },
        blockers: [],
      };
    }),
    literatureRefs: [
      "klimchitskaya_mohideen_mostepanenko_2009_lifshitz_review",
      "reid_white_johnson_2010_arbitrary_geometry_casimir",
    ],
  });
  if (!isNhm2TileEffectiveFullTensorSourceArtifact(artifact)) {
    throw new Error("internal error: produced invalid candidate tile source tensor");
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
  if (candidateProfileSpecPath == null || outPath == null) {
    throw new Error("--candidate-profile-spec and --out are required");
  }
  const artifact = publishNhm2CandidateTileEffectiveFullTensorSource({
    repoRoot: process.cwd(),
    candidateProfileSpecPath,
    candidateCampaignGridPath,
    outPath,
    runId: asString(args["run-id"]),
    gridDims: parseDims(args["grid-dims"]),
    domainScale: asNumber(args["domain-scale"]),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
