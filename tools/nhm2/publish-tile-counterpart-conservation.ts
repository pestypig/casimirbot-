import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  NHM2_TENSOR_COMPONENTS,
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalTensor,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2RegionalSourceTransitionKernel,
  type Nhm2RegionalSourceTransitionKernelV1,
} from "../../shared/contracts/nhm2-regional-source-transition-kernel.v1";
import {
  getNhm2RegionalSupportFunctionAtlasHash,
  isNhm2RegionalSupportFunctionAtlas,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  buildNhm2TileCounterpartConservationArtifact,
  type Nhm2TileCounterpartConservationArtifact,
} from "../../shared/contracts/nhm2-tile-counterpart-conservation.v1";
import {
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string" && value.trim().length > 0 && Number.isFinite(Number(value))
      ? Number(value)
      : null;

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const DEFAULT_CONSERVATION_TOLERANCE_LINF = 0.1;

const REGION_NEIGHBORS: Record<
  Nhm2RegionalSourceClosureRegionId,
  Nhm2RegionalSourceClosureRegionId[]
> = {
  global: ["hull", "wall", "exterior_shell"],
  hull: ["wall"],
  wall: ["hull", "exterior_shell"],
  exterior_shell: ["wall"],
};

const MOMENTUM_COMPONENTS = [
  "T01",
  "T02",
  "T03",
  "T10",
  "T20",
  "T30",
] as const satisfies readonly Nhm2TensorComponent[];

type SourceRegion = Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number];
type TransitionInterface = Nhm2RegionalSourceTransitionKernelV1["interfaces"][number];
type TransitionContext = {
  ref: string;
  byPair: Map<string, TransitionInterface>;
};

const finiteTensorValue = (
  tensor: Nhm2RegionalTensor,
  component: Nhm2TensorComponent,
): number | null => {
  const value = tensor[component];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const tensorScale = (tensor: Nhm2RegionalTensor): number => {
  const values = NHM2_TENSOR_COMPONENTS.flatMap((component) => {
    const value = finiteTensorValue(tensor, component);
    return value == null ? [] : [Math.abs(value)];
  });
  return Math.max(1, ...values);
};

const normalizedJump = (
  left: SourceRegion,
  right: SourceRegion,
  component: Nhm2TensorComponent,
): number | null => {
  const leftValue = finiteTensorValue(left.tensor, component);
  const rightValue = finiteTensorValue(right.tensor, component);
  if (leftValue == null || rightValue == null) return null;
  const scale = Math.max(tensorScale(left.tensor), tensorScale(right.tensor), 1);
  return Math.abs(leftValue - rightValue) / scale;
};

const pairKey = (
  leftRegionId: Nhm2RegionalSourceClosureRegionId,
  rightRegionId: Nhm2RegionalSourceClosureRegionId,
): string => [leftRegionId, rightRegionId].sort().join("|");

const transitionFor = (
  transition: TransitionContext | null,
  leftRegionId: Nhm2RegionalSourceClosureRegionId,
  rightRegionId: Nhm2RegionalSourceClosureRegionId,
): TransitionInterface | null =>
  transition?.byPair.get(pairKey(leftRegionId, rightRegionId)) ?? null;

const transitionWeightFor = (
  transition: TransitionContext | null,
  leftRegionId: Nhm2RegionalSourceClosureRegionId,
  rightRegionId: Nhm2RegionalSourceClosureRegionId,
): number => {
  const entry = transitionFor(transition, leftRegionId, rightRegionId);
  return entry == null ? 0 : Math.min(1, Math.max(0, entry.smoothingWeight));
};

const adjustedJump = (
  left: SourceRegion,
  right: SourceRegion,
  component: Nhm2TensorComponent,
  transition: TransitionContext | null,
): number | null => {
  const raw = normalizedJump(left, right, component);
  if (raw == null) return null;
  const weight = transitionWeightFor(
    transition,
    left.regionId,
    right.regionId,
  );
  return raw * (1 - weight);
};

const maxFinite = (values: Array<number | null>): number | null => {
  const finiteValues = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return finiteValues.length > 0 ? Math.max(...finiteValues) : null;
};

const findDominantJump = (
  region: SourceRegion,
  neighbors: SourceRegion[],
  transition: TransitionContext | null,
): { componentId: Nhm2TensorComponent | null; residual: number | null; hotspotRef: string | null } => {
  let componentId: Nhm2TensorComponent | null = null;
  let residual: number | null = null;
  let hotspotRef: string | null = null;
  for (const neighbor of neighbors) {
    for (const component of NHM2_TENSOR_COMPONENTS) {
      const jump = adjustedJump(region, neighbor, component, transition);
      if (jump == null) continue;
      if (residual == null || jump > residual) {
        componentId = component;
        residual = jump;
        hotspotRef = `${region.regionId}<->${neighbor.regionId}:${component}`;
      }
    }
  }
  return { componentId, residual, hotspotRef };
};

const buildConservationRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  sourceRegions: Map<Nhm2RegionalSourceClosureRegionId, SourceRegion>,
  toleranceLInf: number,
  transition: TransitionContext | null,
): Nhm2TileCounterpartConservationArtifact["regions"][number] => {
  const region = sourceRegions.get(regionId);
  if (region == null) {
    return {
      regionId,
      status: "missing",
      divTResidualLInf: null,
      continuityResidualLInf: null,
      momentumResidualLInf: null,
      toleranceLInf,
      sampleCount: null,
      diagnosticMode:
        transition == null
          ? "regional_jump_linf_v1"
          : "regional_jump_linf_with_transition_kernel_v1",
      neighborRegionIds: REGION_NEIGHBORS[regionId],
      transitionKernelRef: transition?.ref ?? null,
      preTransitionResidualLInf: null,
      postTransitionResidualLInf: null,
      transitionSmoothingWeight: null,
      transitionLayerResidualLInf: null,
      dominantComponentId: null,
      maxHotspotRef: null,
      warnings: ["source region was absent from the tile-effective full tensor source"],
      blockers: ["source_region_missing"],
    };
  }

  const neighborIds = REGION_NEIGHBORS[regionId];
  const neighbors = neighborIds.flatMap((neighborId) => {
    const neighbor = sourceRegions.get(neighborId);
    return neighbor == null ? [] : [neighbor];
  });
  const preTransitionResidualLInf = maxFinite(
    neighbors.flatMap((neighbor) =>
      NHM2_TENSOR_COMPONENTS.map((component) => normalizedJump(region, neighbor, component)),
    ),
  );
  const continuityResidualLInf = maxFinite(
    neighbors.map((neighbor) => adjustedJump(region, neighbor, "T00", transition)),
  );
  const momentumResidualLInf = maxFinite(
    neighbors.flatMap((neighbor) =>
      MOMENTUM_COMPONENTS.map((component) =>
        adjustedJump(region, neighbor, component, transition),
      ),
    ),
  );
  const divTResidualLInf = maxFinite(
    neighbors.flatMap((neighbor) =>
      NHM2_TENSOR_COMPONENTS.map((component) =>
        adjustedJump(region, neighbor, component, transition),
      ),
    ),
  );
  const dominant = findDominantJump(region, neighbors, transition);
  const transitionSmoothingWeight = maxFinite(
    neighbors.map((neighbor) =>
      transitionWeightFor(transition, region.regionId, neighbor.regionId),
    ),
  );
  const warnings =
    neighbors.length === neighborIds.length
      ? transition == null
        ? [
            "reduced-order diagnostic only: region-aggregate tensor jumps are not a full covariant finite-difference conservation solve",
          ]
        : [
            "transition-kernel regularized diagnostic only: smoothed region-aggregate jumps are not a full covariant finite-difference conservation solve",
          ]
      : [
          "one or more neighbor regions were absent from the source artifact",
          "reduced-order diagnostic only: region-aggregate tensor jumps are not a full covariant finite-difference conservation solve",
        ];

  return {
    regionId,
    status: "pass",
    divTResidualLInf,
    continuityResidualLInf,
    momentumResidualLInf,
    toleranceLInf,
    sampleCount: region.sampleCount ?? null,
    diagnosticMode:
      transition == null
        ? "regional_jump_linf_v1"
        : "regional_jump_linf_with_transition_kernel_v1",
    neighborRegionIds: neighborIds,
    transitionKernelRef: transition?.ref ?? null,
    preTransitionResidualLInf,
    postTransitionResidualLInf: divTResidualLInf,
    transitionSmoothingWeight,
    transitionLayerResidualLInf: dominant.residual,
    dominantComponentId: dominant.componentId,
    maxHotspotRef: dominant.hotspotRef,
    warnings,
    blockers: [],
  };
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

export const publishTileCounterpartConservation = (args: {
  repoRoot: string;
  referenceRunPath: string;
  tileFullTensorSourcePath: string;
  transitionKernelPath?: string | null;
  regionalSupportAtlasPath?: string | null;
  outPath: string;
  toleranceLInf?: number | null;
  auditOnly?: boolean;
}): Nhm2TileCounterpartConservationArtifact => {
  if (
    !args.auditOnly &&
    [
      args.referenceRunPath,
      args.tileFullTensorSourcePath,
      args.transitionKernelPath,
      args.regionalSupportAtlasPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  if (!isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be a valid nhm2_reference_run/v1 artifact");
  }
  const source = readJson(resolvePath(args.repoRoot, args.tileFullTensorSourcePath));
  if (!isNhm2TileEffectiveFullTensorSourceArtifact(source)) {
    throw new Error("tile full tensor source must be nhm2_tile_effective_full_tensor_source/v1");
  }
  const transitionKernel =
    args.transitionKernelPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.transitionKernelPath));
  if (
    transitionKernel != null &&
    !isNhm2RegionalSourceTransitionKernel(transitionKernel)
  ) {
    throw new Error("transition kernel must be nhm2_regional_source_transition_kernel/v1");
  }
  const atlas =
    args.regionalSupportAtlasPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.regionalSupportAtlasPath));
  if (atlas != null && !isNhm2RegionalSupportFunctionAtlas(atlas)) {
    throw new Error("regional support atlas must be nhm2_regional_support_function_atlas/v1");
  }
  const atlasHash = getNhm2RegionalSupportFunctionAtlasHash(atlas);
  if (
    atlasHash != null &&
    transitionKernel != null &&
    transitionKernel.atlasHash != null &&
    transitionKernel.atlasHash !== atlasHash
  ) {
    throw new Error("transition kernel atlasHash does not match regional support atlas");
  }
  const transition =
    transitionKernel == null
      ? null
      : {
          ref: args.transitionKernelPath as string,
          byPair: new Map(
            transitionKernel.interfaces.map((entry) => [
              pairKey(entry.leftRegionId, entry.rightRegionId),
              entry,
            ]),
          ),
        };
  const sourceRegions = new Map(source.regions.map((region) => [region.regionId, region]));
  const toleranceLInf = args.toleranceLInf ?? DEFAULT_CONSERVATION_TOLERANCE_LINF;
  const regions: Nhm2TileCounterpartConservationArtifact["regions"] =
    NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
      return buildConservationRegion(
        regionId as Nhm2RegionalSourceClosureRegionId,
        sourceRegions,
        toleranceLInf,
        transition,
      );
    });

  const artifact = buildNhm2TileCounterpartConservationArtifact({
    runId: referenceRun.runId,
    selectedProfileId: referenceRun.selectedFamily.selectedProfileId,
    expectedProfileId: referenceRun.selectedFamily.expectedProfileId,
    laneId: "nhm2_shift_lapse",
    chartRef: "comoving_cartesian",
    derivativeStencil:
      transition == null
        ? "regional_jump_linf_v1"
        : "regional_jump_linf_with_transition_kernel_v1",
    unitsRef: "dimensionless_normalized_tensor_jump",
    ...(args.regionalSupportAtlasPath == null
      ? {}
      : {
          atlasRef: args.regionalSupportAtlasPath,
          atlasHash,
        }),
    regions,
  });
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const referenceRunPath = asString(args["reference-run"]);
  const sourcePath = asString(args["tile-full-tensor-source"]);
  const transitionKernelPath = asString(args["transition-kernel"]);
  const outPath = asString(args.out);
  const toleranceLInf = asNumber(args.tolerance);
  if (referenceRunPath == null || sourcePath == null || outPath == null) {
    throw new Error("--reference-run, --tile-full-tensor-source, and --out are required");
  }
  const artifact = publishTileCounterpartConservation({
    repoRoot: process.cwd(),
    referenceRunPath,
    tileFullTensorSourcePath: sourcePath,
    transitionKernelPath,
    regionalSupportAtlasPath: asString(args["regional-support-atlas"]),
    outPath,
    toleranceLInf,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
