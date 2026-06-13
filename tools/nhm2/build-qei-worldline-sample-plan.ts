import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2QeiWorldlineSamplePlan,
  type Nhm2QeiWorldlineSamplePlanEntryV1,
  type Nhm2QeiWorldlineSamplePlanRegionId,
  type Nhm2QeiWorldlineSamplePlanV1,
} from "../../shared/contracts/nhm2-qei-worldline-sample-plan.v1";
import type { Nhm2QeiWorldlineRegionId } from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  isNhm2RegionalSourceTransitionKernel,
  type Nhm2RegionalSourceTransitionInterfaceId,
  type Nhm2RegionalSourceTransitionKernelV1,
} from "../../shared/contracts/nhm2-regional-source-transition-kernel.v1";
import {
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import type { Nhm2RegionalSourceClosureRegionId } from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  fullTensorSourceRegionHasSamplingAuthority,
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const PLAN_REGION_IDS: Nhm2QeiWorldlineSamplePlanRegionId[] = [
  "wall",
  "hull_wall_transition",
  "wall_exterior_transition",
];

const TRANSITION_INTERFACE_BY_REGION: Record<
  Extract<Nhm2QeiWorldlineSamplePlanRegionId, "hull_wall_transition" | "wall_exterior_transition">,
  Nhm2RegionalSourceTransitionInterfaceId
> = {
  hull_wall_transition: "hull_wall",
  wall_exterior_transition: "wall_exterior_shell",
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

const worldlineId = (regionId: Nhm2QeiWorldlineRegionId): string =>
  `qei:${regionId}:atlas`;

const atlasSampleLocationsRef = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  regionId: Nhm2QeiWorldlineSamplePlanRegionId,
): string => `${atlas.runIdentity.samplePlanRef}:${regionId}:worldline_samples`;

const sourceRegionMap = (
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
): Map<Nhm2RegionalSourceClosureRegionId, Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]> =>
  new Map(source.regions.map((region) => [region.regionId, region]));

const regionHasAuthority = (
  region: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number] | null | undefined,
): boolean =>
  fullTensorSourceRegionHasSamplingAuthority(region);

const closurePlan = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
  regionId: Extract<Nhm2QeiWorldlineSamplePlanRegionId, "wall">,
): Nhm2QeiWorldlineSamplePlanEntryV1 => {
  const region = sourceRegionMap(source).get(regionId);
  const authority = regionHasAuthority(region);
  return {
    worldlineId: worldlineId(regionId),
    regionId,
    supportFunctionRef: atlas.regions[regionId]?.supportFunctionRef ?? null,
    sampleLocationsRef: atlasSampleLocationsRef(atlas, regionId),
    sampleCount: atlas.regions[regionId]?.sampleCount ?? null,
    sampleMethod: "atlas_support_source_tensor",
    sourceTensorRef: region == null ? null : `${source.artifactId}:${regionId}`,
    transitionKernelRef: null,
    transitionInterfaceId: null,
    blockers: [
      ...(region == null ? [`${regionId}:source_region_missing`] : []),
      ...(region != null && !authority
        ? [`${regionId}:source_full_tensor_authority_not_pass`]
        : []),
    ],
    warnings: [
      "wall worldline plan uses atlas support and region source tensor aggregation; it is not a QEI pass proof",
    ],
  };
};

const transitionPlan = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
  transitionKernel: Nhm2RegionalSourceTransitionKernelV1,
  transitionKernelPath: string,
  regionId: Extract<
    Nhm2QeiWorldlineSamplePlanRegionId,
    "hull_wall_transition" | "wall_exterior_transition"
  >,
): Nhm2QeiWorldlineSamplePlanEntryV1 => {
  const interfaceId = TRANSITION_INTERFACE_BY_REGION[regionId];
  const transitionInterface = transitionKernel.interfaces.find(
    (entry) => entry.interfaceId === interfaceId,
  );
  return {
    worldlineId: worldlineId(regionId),
    regionId,
    supportFunctionRef: atlas.regions[regionId]?.supportFunctionRef ?? null,
    sampleLocationsRef: atlasSampleLocationsRef(atlas, regionId),
    sampleCount: atlas.regions[regionId]?.sampleCount ?? null,
    sampleMethod: "missing_pointwise_tensor",
    sourceTensorRef: source.artifactId,
    transitionKernelRef:
      transitionInterface == null ? null : `${transitionKernelPath}:${interfaceId}`,
    transitionInterfaceId: transitionInterface == null ? null : interfaceId,
    blockers: [
      ...(transitionInterface == null ? [`${regionId}:transition_interface_missing`] : []),
      ...(transitionInterface != null && transitionInterface.status !== "pass"
        ? [`${regionId}:transition_interface_${transitionInterface.status}`]
        : []),
      "transition_worldline_source_sample_missing",
      "transition_samples_must_not_use_adjacent_region_averages",
    ],
    warnings: [
      "transition support is planned from atlas/kernel metadata, but no pointwise transition source tensor sample is available",
    ],
  };
};

export const buildQeiWorldlineSamplePlan = (args: {
  repoRoot: string;
  regionalSupportAtlasPath: string;
  sourceFullTensorPath: string;
  transitionKernelPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2QeiWorldlineSamplePlanV1 => {
  const paths = [
    args.regionalSupportAtlasPath,
    args.sourceFullTensorPath,
    args.transitionKernelPath,
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
  const transitionKernel = readRequired(
    args.repoRoot,
    args.transitionKernelPath,
    isNhm2RegionalSourceTransitionKernel,
    "regional source transition kernel",
  );
  const globalBlockers = [
    ...(transitionKernel.atlasHash === atlas.provenance.atlasHash
      ? []
      : ["transition_kernel_atlas_hash_mismatch"]),
    ...(transitionKernel.sourceTensorRef === args.sourceFullTensorPath ||
    transitionKernel.sourceTensorRef === source.artifactId
      ? []
      : ["transition_kernel_source_tensor_ref_mismatch"]),
  ];
  const worldlines = PLAN_REGION_IDS.map((regionId) =>
    regionId === "wall"
      ? closurePlan(atlas, source, regionId)
      : transitionPlan(atlas, source, transitionKernel, args.transitionKernelPath, regionId),
  );
  const artifact = buildNhm2QeiWorldlineSamplePlan({
    generatedAt: new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: atlas.runIdentity.profileId,
    atlasRef: args.regionalSupportAtlasPath,
    atlasHash: atlas.provenance.atlasHash,
    tensorRef: source.artifactId,
    transitionKernelRef: args.transitionKernelPath,
    transitionKernelAtlasHash: transitionKernel.atlasHash ?? null,
    worldlines,
    blockers: globalBlockers,
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
  const transitionKernelPath = asString(raw["transition-kernel"]);
  const outPath = asString(raw.out);
  if (
    regionalSupportAtlasPath == null ||
    sourceFullTensorPath == null ||
    transitionKernelPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--regional-support-atlas, --source-full-tensor, --transition-kernel, and --out are required",
    );
  }
  const artifact = buildQeiWorldlineSamplePlan({
    repoRoot: process.cwd(),
    regionalSupportAtlasPath,
    sourceFullTensorPath,
    transitionKernelPath,
    outPath,
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
