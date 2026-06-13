import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2QeiWorldlineSamplingReceipt,
  isNhm2QeiWorldlineSamplingReceipt,
  type Nhm2QeiWorldlineSampleV1,
  type Nhm2QeiWorldlineSamplingReceiptV1,
} from "../../shared/contracts/nhm2-qei-worldline-sampling-receipt.v1";
import {
  isNhm2QeiWorldlineSamplePlan,
  type Nhm2QeiWorldlineSamplePlanEntryV1,
} from "../../shared/contracts/nhm2-qei-worldline-sample-plan.v1";
import { isNhm2QeiPointwiseTransitionSourceSamples } from "../../shared/contracts/nhm2-qei-pointwise-transition-source-samples.v1";
import type { Nhm2QeiWorldlineRegionId } from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  fullTensorSourceRegionHasSamplingAuthority,
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

type ExplicitSampleInput = {
  regionId: Nhm2QeiWorldlineRegionId;
  valueSI: number | null;
  provenanceRef?: string;
  sourceTensorRef?: string | null;
  sampleLocationsRef?: string | null;
  supportFunctionRef?: string | null;
  status?: "computed" | "proxy" | "missing";
};

type QeiWorldlineSamplePlan = {
  plans: Map<Nhm2QeiWorldlineRegionId, Nhm2QeiWorldlineSamplePlanEntryV1>;
  blockers: string[];
};

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

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const readRequired = <T>(
  repoRoot: string,
  path: string,
  validator: (value: unknown) => value is T,
  label: string,
): T => {
  const value = readJson(resolvePath(repoRoot, path));
  if (!validator(value)) throw new Error(`${label} has invalid contract: ${path}`);
  return value;
};

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const t00FromTensor = (tensor: Nhm2RegionalTensor): number | null =>
  typeof tensor.T00 === "number" && Number.isFinite(tensor.T00) ? tensor.T00 : null;

const sourceRegionMap = (
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
): Map<Nhm2RegionalSourceClosureRegionId, Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]> =>
  new Map(source.regions.map((region) => [region.regionId, region]));

const regionHasAuthority = (
  region: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number] | null | undefined,
): boolean =>
  fullTensorSourceRegionHasSamplingAuthority(region);

const worldlineId = (regionId: Nhm2QeiWorldlineRegionId): string =>
  `qei:${regionId}:atlas`;

const isClosureRegion = (
  regionId: Nhm2QeiWorldlineRegionId,
): regionId is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    regionId as Nhm2RegionalSourceClosureRegionId,
  );

const atlasSupportRef = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  regionId: Nhm2QeiWorldlineRegionId,
): string | null => {
  if (
    regionId === "hull" ||
    regionId === "wall" ||
    regionId === "exterior_shell" ||
    regionId === "hull_wall_transition" ||
    regionId === "wall_exterior_transition"
  ) {
    return atlas.regions[regionId]?.supportFunctionRef ?? null;
  }
  return null;
};

const atlasSampleLocationsRef = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  regionId: Nhm2QeiWorldlineRegionId,
): string | null =>
  `${atlas.runIdentity.samplePlanRef}:${regionId}:worldline_samples`;

const closureSample = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
  regionId: Nhm2RegionalSourceClosureRegionId,
  plan?: Nhm2QeiWorldlineSamplePlanEntryV1 | null,
): Nhm2QeiWorldlineSampleV1 => {
  const sourceRegions = sourceRegionMap(source);
  const region = sourceRegions.get(regionId);
  const value = region == null ? null : t00FromTensor(region.tensor);
  const authority = regionHasAuthority(region);
  return {
    worldlineId: worldlineId(regionId),
    regionId,
    chartId: atlas.runIdentity.chartId,
    supportFunctionRef: plan?.supportFunctionRef ?? atlasSupportRef(atlas, regionId),
    sampleLocationsRef: plan?.sampleLocationsRef ?? atlasSampleLocationsRef(atlas, regionId),
    sampleMethod: value == null ? "missing" : "atlas_region_source_tensor",
    sampledRho: {
      valueSI: value,
      ...(region == null ? {} : { provenanceRef: `${source.artifactId}:${regionId}:T00` }),
      status: value == null ? "missing" : authority ? "computed" : "proxy",
    },
    sourceTensorRef: region == null ? null : `${source.artifactId}:${regionId}`,
    blockers: [
      ...(plan == null ? [] : plan.blockers),
      ...(region == null ? [`${regionId}:source_region_missing`] : []),
      ...(value == null ? [`${regionId}:sampled_rho_missing`] : []),
      ...(region != null && !authority
        ? [`${regionId}:source_full_tensor_authority_not_pass`]
        : []),
    ],
    warnings: [],
  };
};

const transitionMissingSample = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
  regionId: Extract<Nhm2QeiWorldlineRegionId, "hull_wall_transition" | "wall_exterior_transition">,
  plan?: Nhm2QeiWorldlineSamplePlanEntryV1 | null,
): Nhm2QeiWorldlineSampleV1 => ({
  worldlineId: worldlineId(regionId),
  regionId,
  chartId: atlas.runIdentity.chartId,
  supportFunctionRef: plan?.supportFunctionRef ?? atlasSupportRef(atlas, regionId),
  sampleLocationsRef: plan?.sampleLocationsRef ?? atlasSampleLocationsRef(atlas, regionId),
  sampleMethod: "missing",
  sampledRho: {
    valueSI: null,
    status: "missing",
  },
  sourceTensorRef: plan?.sourceTensorRef ?? source.artifactId,
  blockers: [
    ...(plan == null ? [] : plan.blockers),
    "transition_worldline_source_sample_missing",
    "transition_samples_must_not_use_adjacent_region_averages",
  ],
  warnings: [],
});

const explicitSample = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
  sample: ExplicitSampleInput,
): Nhm2QeiWorldlineSampleV1 => ({
  worldlineId: worldlineId(sample.regionId),
  regionId: sample.regionId,
  chartId: atlas.runIdentity.chartId,
  supportFunctionRef: sample.supportFunctionRef ?? atlasSupportRef(atlas, sample.regionId),
  sampleLocationsRef:
    sample.sampleLocationsRef ?? atlasSampleLocationsRef(atlas, sample.regionId),
  sampleMethod:
    sample.regionId === "hull_wall_transition" ||
    sample.regionId === "wall_exterior_transition"
      ? "explicit_transition_source_tensor"
      : "explicit_source_tensor_sample",
  sampledRho: {
    valueSI: sample.valueSI,
    ...(sample.provenanceRef == null ? {} : { provenanceRef: sample.provenanceRef }),
    status: sample.status ?? (sample.valueSI == null ? "missing" : "computed"),
  },
  sourceTensorRef: sample.sourceTensorRef ?? source.artifactId,
  blockers: [
    ...(sample.valueSI == null ? ["sampled_rho_missing"] : []),
    ...(sample.provenanceRef == null ? ["sampled_rho_provenance_missing"] : []),
    ...(sample.status === "proxy" ? ["sampled_rho_proxy"] : []),
    ...(sample.status === "missing" ? ["sampled_rho_missing"] : []),
  ],
  warnings: [],
});

const parseExplicitSamples = (
  repoRoot: string,
  path: string | null | undefined,
): Map<Nhm2QeiWorldlineRegionId, ExplicitSampleInput> => {
  if (path == null || !existsSync(resolvePath(repoRoot, path))) return new Map();
  const value = readJson(resolvePath(repoRoot, path));
  if (isNhm2QeiWorldlineSamplingReceipt(value)) {
    return new Map(
      value.worldlineSamples.map((sample) => [
        sample.regionId,
        {
          regionId: sample.regionId,
          valueSI: sample.sampledRho.valueSI,
          provenanceRef: sample.sampledRho.provenanceRef,
          sourceTensorRef: sample.sourceTensorRef,
          supportFunctionRef: sample.supportFunctionRef,
          sampleLocationsRef: sample.sampleLocationsRef,
          status: sample.sampledRho.status,
        },
      ]),
    );
  }
  if (isNhm2QeiPointwiseTransitionSourceSamples(value)) {
    return new Map(
      value.samples.map((sample) => [
        sample.regionId,
        {
          regionId: sample.regionId,
          valueSI: sample.valueSI,
          provenanceRef: sample.provenanceRef,
          sourceTensorRef: sample.sourceTensorRef,
          supportFunctionRef: sample.supportFunctionRef,
          sampleLocationsRef: sample.sampleLocationsRef,
          status: sample.status,
        },
      ]),
    );
  }
  const record = asRecord(value);
  const entries = Array.isArray(record?.worldlines)
    ? record?.worldlines
    : Array.isArray(record?.samples)
      ? record?.samples
      : [];
  return new Map(
    entries.flatMap((entry): Array<[Nhm2QeiWorldlineRegionId, ExplicitSampleInput]> => {
      const sample = asRecord(entry);
      const regionId = asString(sample?.regionId) as Nhm2QeiWorldlineRegionId | null;
      if (
        regionId !== "hull" &&
        regionId !== "wall" &&
        regionId !== "exterior_shell" &&
        regionId !== "hull_wall_transition" &&
        regionId !== "wall_exterior_transition"
      ) {
        return [];
      }
      return [[
        regionId,
        {
          regionId,
          valueSI: asNumber(sample?.valueSI),
          provenanceRef: asString(sample?.provenanceRef) ?? undefined,
          sourceTensorRef: asString(sample?.sourceTensorRef),
          supportFunctionRef: asString(sample?.supportFunctionRef),
          sampleLocationsRef: asString(sample?.sampleLocationsRef),
          status:
            sample?.status === "computed" ||
            sample?.status === "proxy" ||
            sample?.status === "missing"
              ? sample.status
              : undefined,
        },
      ]];
    }),
  );
};

const readSamplePlan = (
  repoRoot: string,
  path: string | null | undefined,
  atlasHash: string,
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
  sourceFullTensorPath: string,
): QeiWorldlineSamplePlan => {
  if (path == null || !existsSync(resolvePath(repoRoot, path))) {
    return { plans: new Map(), blockers: [] };
  }
  const value = readJson(resolvePath(repoRoot, path));
  if (!isNhm2QeiWorldlineSamplePlan(value)) {
    return {
      plans: new Map(),
      blockers: ["qei_worldline_sample_plan_invalid_contract"],
    };
  }
  const sourceTensorRefs = new Set([source.artifactId, sourceFullTensorPath]);
  const blockers = [
    ...(value.atlasHash === atlasHash
      ? []
      : ["qei_worldline_sample_plan_atlas_hash_mismatch"]),
    ...(sourceTensorRefs.has(value.tensorRef)
      ? []
      : ["qei_worldline_sample_plan_tensor_ref_mismatch"]),
    ...(value.status === "fail" || value.status === "missing"
      ? [`qei_worldline_sample_plan_${value.status}`]
      : []),
  ];
  return {
    plans: new Map(value.worldlines.map((plan) => [plan.regionId, plan])),
    blockers,
  };
};

export const buildQeiWorldlineSamplingReceipt = (args: {
  repoRoot: string;
  regionalSupportAtlasPath: string;
  sourceFullTensorPath: string;
  outPath: string;
  qeiWorldlineSamplePlanPath?: string | null;
  explicitWorldlineSamplesPath?: string | null;
  auditOnly?: boolean;
}): Nhm2QeiWorldlineSamplingReceiptV1 => {
  const paths = [
    args.regionalSupportAtlasPath,
    args.sourceFullTensorPath,
    args.qeiWorldlineSamplePlanPath,
    args.explicitWorldlineSamplesPath,
  ];
  if (!args.auditOnly && paths.some(pathUsesLatestAlias)) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const atlas = readRequired(
    args.repoRoot,
    args.regionalSupportAtlasPath,
    isNhm2RegionalSupportFunctionAtlas,
    "regional support-function atlas",
  );
  const source = readRequired(
    args.repoRoot,
    args.sourceFullTensorPath,
    isNhm2TileEffectiveFullTensorSourceArtifact,
    "source full tensor",
  );
  const explicitSamples = parseExplicitSamples(
    args.repoRoot,
    args.explicitWorldlineSamplesPath,
  );
  const samplePlan = readSamplePlan(
    args.repoRoot,
    args.qeiWorldlineSamplePlanPath,
    atlas.provenance.atlasHash,
    source,
    args.sourceFullTensorPath,
  );
  const regionIds: Nhm2QeiWorldlineRegionId[] = [
    "wall",
    "hull_wall_transition",
    "wall_exterior_transition",
  ];
  const worldlineSamples = regionIds.map((regionId) => {
    const explicit = explicitSamples.get(regionId);
    if (explicit != null) return explicitSample(atlas, source, explicit);
    const plan = samplePlan.plans.get(regionId) ?? null;
    if (isClosureRegion(regionId)) return closureSample(atlas, source, regionId, plan);
    return transitionMissingSample(atlas, source, regionId, plan);
  });
  const artifact = buildNhm2QeiWorldlineSamplingReceipt({
    generatedAt: new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: atlas.runIdentity.profileId,
    atlasRef: args.regionalSupportAtlasPath,
    atlasHash: atlas.provenance.atlasHash,
    tensorRef: source.artifactId,
    worldlineSamples,
    blockers: samplePlan.blockers,
  });
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const raw = parseArgs(process.argv.slice(2));
  const regionalSupportAtlasPath = asString(raw["regional-support-atlas"]);
  const sourceFullTensorPath = asString(raw["source-full-tensor"]);
  const outPath = asString(raw.out);
  if (regionalSupportAtlasPath == null || sourceFullTensorPath == null || outPath == null) {
    throw new Error("--regional-support-atlas, --source-full-tensor, and --out are required");
  }
  const artifact = buildQeiWorldlineSamplingReceipt({
    repoRoot: process.cwd(),
    regionalSupportAtlasPath,
    sourceFullTensorPath,
    outPath,
    qeiWorldlineSamplePlanPath: asString(raw["qei-worldline-sample-plan"]),
    explicitWorldlineSamplesPath: asString(raw["explicit-worldline-samples"]),
    auditOnly: raw["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (
  existsSync(normalize(process.argv[1] ?? "")) &&
  normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))
) {
  main();
}
