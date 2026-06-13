import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2RegionalSourceTransitionKernel,
  isNhm2RegionalSourceTransitionKernel,
  type Nhm2RegionalSourceTransitionInterfaceId,
  type Nhm2RegionalSourceTransitionKernelV1,
} from "../../shared/contracts/nhm2-regional-source-transition-kernel.v1";
import {
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const DEFAULT_TOLERANCE_LINF = 0.1;
const DEFAULT_MAX_SMOOTHING_WEIGHT = 0.95;
const DEFAULT_SAFETY_MARGIN = 0.005;

const INTERFACES = [
  ["global_hull", "global", "hull"],
  ["global_wall", "global", "wall"],
  ["global_exterior_shell", "global", "exterior_shell"],
  ["hull_wall", "hull", "wall"],
  ["wall_exterior_shell", "wall", "exterior_shell"],
] as const satisfies readonly [
  Nhm2RegionalSourceTransitionInterfaceId,
  Nhm2RegionalSourceClosureRegionId,
  Nhm2RegionalSourceClosureRegionId,
][];

type SourceRegion = Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number];

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string" && value.trim().length > 0 && Number.isFinite(Number(value))
      ? Number(value)
      : null;

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

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

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
  return Math.abs(leftValue - rightValue) /
    Math.max(tensorScale(left.tensor), tensorScale(right.tensor), 1);
};

const dominantJump = (
  left: SourceRegion,
  right: SourceRegion,
): { componentId: Nhm2TensorComponent | null; jump: number | null } => {
  let componentId: Nhm2TensorComponent | null = null;
  let jump: number | null = null;
  for (const component of NHM2_TENSOR_COMPONENTS) {
    const candidate = normalizedJump(left, right, component);
    if (candidate == null) continue;
    if (jump == null || candidate > jump) {
      componentId = component;
      jump = candidate;
    }
  }
  return { componentId, jump };
};

export const buildRegionalSourceTransitionKernel = (args: {
  repoRoot: string;
  tileFullTensorSourcePath: string;
  outPath: string;
  toleranceLInf?: number | null;
  maxSmoothingWeight?: number | null;
  safetyMargin?: number | null;
  blendWidthMeters?: number | null;
  auditOnly?: boolean;
}): Nhm2RegionalSourceTransitionKernelV1 => {
  if (!args.auditOnly && pathUsesLatestAlias(args.tileFullTensorSourcePath)) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const source = readJson(resolvePath(args.repoRoot, args.tileFullTensorSourcePath));
  if (!isNhm2TileEffectiveFullTensorSourceArtifact(source)) {
    throw new Error("tile source must be nhm2_tile_effective_full_tensor_source/v1");
  }

  const regions = new Map(source.regions.map((region) => [region.regionId, region]));
  const toleranceLInf = args.toleranceLInf ?? DEFAULT_TOLERANCE_LINF;
  const maxSmoothingWeight = clamp01(
    args.maxSmoothingWeight ?? DEFAULT_MAX_SMOOTHING_WEIGHT,
  );
  const safetyMargin = Math.max(0, args.safetyMargin ?? DEFAULT_SAFETY_MARGIN);
  const interfaces = INTERFACES.map(([interfaceId, leftRegionId, rightRegionId]) => {
    const left = regions.get(leftRegionId);
    const right = regions.get(rightRegionId);
    if (left == null || right == null) {
      return {
        interfaceId,
        leftRegionId,
        rightRegionId,
        kernelKind: "not_available" as const,
        smoothingWeight: 0,
        blendWidthMeters: args.blendWidthMeters ?? null,
        rawJumpLInf: null,
        postKernelJumpLInf: null,
        targetToleranceLInf: toleranceLInf,
        dominantComponentId: null,
        hotspotRef: null,
        status: "missing" as const,
        blockers: ["transition_source_region_missing"],
        warnings: ["transition kernel cannot be derived without both source regions"],
      };
    }
    const dominant = dominantJump(left, right);
    const requiredSmoothing =
      dominant.jump == null || dominant.jump <= toleranceLInf
        ? 0
        : 1 - toleranceLInf / dominant.jump;
    const smoothingWeight =
      dominant.jump == null || dominant.jump <= toleranceLInf
        ? 0
        : clamp01(Math.min(maxSmoothingWeight, requiredSmoothing + safetyMargin));
    const postKernelJumpLInf =
      dominant.jump == null ? null : dominant.jump * (1 - smoothingWeight);
    const blockers =
      requiredSmoothing > maxSmoothingWeight
        ? ["transition_smoothing_budget_insufficient"]
        : [];
    return {
      interfaceId,
      leftRegionId,
      rightRegionId,
      kernelKind: "cosine_blend" as const,
      smoothingWeight,
      blendWidthMeters: args.blendWidthMeters ?? null,
      rawJumpLInf: dominant.jump,
      postKernelJumpLInf,
      targetToleranceLInf: toleranceLInf,
      dominantComponentId: dominant.componentId,
      hotspotRef:
        dominant.componentId == null
          ? null
          : `${leftRegionId}<->${rightRegionId}:${dominant.componentId}`,
      status: "pass" as const,
      blockers,
      warnings: [
        "diagnostic transition kernel only: smoothing attenuates region-aggregate jumps but does not prove local covariant conservation",
        "kernel is source-side and computed from tile tensor discontinuities, not metric-required targets",
      ],
    };
  });

  const artifact = buildNhm2RegionalSourceTransitionKernel({
    generatedAt: new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: source.selectedProfileId,
    chartId: "comoving_cartesian",
    unitsRef: "dimensionless_normalized_tensor_jump",
    sourceTensorRef: args.tileFullTensorSourcePath,
    targetToleranceLInf: toleranceLInf,
    maxAllowedSmoothingWeight: maxSmoothingWeight,
    interfaces,
  });
  if (!isNhm2RegionalSourceTransitionKernel(artifact)) {
    throw new Error("internal error: produced invalid transition kernel artifact");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const argv = parseArgs(process.argv.slice(2));
  const tileFullTensorSourcePath = asString(argv["tile-full-tensor-source"]);
  const outPath = asString(argv.out);
  if (tileFullTensorSourcePath == null || outPath == null) {
    throw new Error("--tile-full-tensor-source and --out are required");
  }
  const artifact = buildRegionalSourceTransitionKernel({
    repoRoot: process.cwd(),
    tileFullTensorSourcePath,
    outPath,
    toleranceLInf: asNumber(argv.tolerance),
    maxSmoothingWeight: asNumber(argv["max-smoothing"]),
    safetyMargin: asNumber(argv["safety-margin"]),
    blendWidthMeters: asNumber(argv["blend-width-meters"]),
    auditOnly: argv["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
