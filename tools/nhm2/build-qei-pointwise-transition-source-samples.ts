import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2QeiPointwiseTransitionSourceSamples,
  type Nhm2QeiPointwiseTransitionSampleRegionId,
  type Nhm2QeiPointwiseTransitionSourceSampleV1,
  type Nhm2QeiPointwiseTransitionSourceSamplesV1,
} from "../../shared/contracts/nhm2-qei-pointwise-transition-source-samples.v1";
import {
  isNhm2QeiWorldlineSamplePlan,
  type Nhm2QeiWorldlineSamplePlanV1,
} from "../../shared/contracts/nhm2-qei-worldline-sample-plan.v1";
import {
  isNhm2RegionalSourceTransitionKernel,
  type Nhm2RegionalSourceTransitionKernelV1,
} from "../../shared/contracts/nhm2-regional-source-transition-kernel.v1";
import type {
  Nhm2RegionalSourceClosureRegionId,
  Nhm2RegionalTensor,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  fullTensorSourceHasFullAuthority,
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const TRANSITION_REGIONS: Nhm2QeiPointwiseTransitionSampleRegionId[] = [
  "hull_wall_transition",
  "wall_exterior_transition",
];

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

const t00FromTensor = (tensor: Nhm2RegionalTensor): number | null =>
  typeof tensor.T00 === "number" && Number.isFinite(tensor.T00) ? tensor.T00 : null;

const sourceRegionMap = (
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
): Map<Nhm2RegionalSourceClosureRegionId, Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]> =>
  new Map(source.regions.map((region) => [region.regionId, region]));

const regionHasAuthority = (
  region: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number] | null | undefined,
): boolean =>
  region != null &&
  region.status === "pass" &&
  region.provenance.notDerivedFromMetricRequiredTensor === true &&
  fullTensorSourceHasFullAuthority(region.tensor, region.tensorAuthorityMode);

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const pointwiseSample = (
  samplePlan: Nhm2QeiWorldlineSamplePlanV1,
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
  transitionKernel: Nhm2RegionalSourceTransitionKernelV1,
  transitionKernelPath: string,
  regionId: Nhm2QeiPointwiseTransitionSampleRegionId,
): Nhm2QeiPointwiseTransitionSourceSampleV1 => {
  const plan = samplePlan.worldlines.find((entry) => entry.regionId === regionId);
  const interfaceId = plan?.transitionInterfaceId;
  const transitionInterface = transitionKernel.interfaces.find(
    (entry) => entry.interfaceId === interfaceId,
  );
  const regions = sourceRegionMap(source);
  const leftRegionId = transitionInterface?.leftRegionId ?? null;
  const rightRegionId = transitionInterface?.rightRegionId ?? null;
  const left = leftRegionId == null ? null : regions.get(leftRegionId);
  const right = rightRegionId == null ? null : regions.get(rightRegionId);
  const leftT00 = left == null ? null : t00FromTensor(left.tensor);
  const rightT00 = right == null ? null : t00FromTensor(right.tensor);
  const blendWeight =
    transitionInterface == null ? null : clamp01(transitionInterface.smoothingWeight);
  const value =
    leftT00 == null || rightT00 == null || blendWeight == null
      ? null
      : leftT00 * (1 - blendWeight) + rightT00 * blendWeight;
  const leftAuthority = regionHasAuthority(left);
  const rightAuthority = regionHasAuthority(right);
  const status =
    value == null
      ? "missing"
      : leftAuthority && rightAuthority
        ? "computed"
        : "proxy";
  return {
    worldlineId: plan?.worldlineId ?? `qei:${regionId}:atlas`,
    regionId,
    valueSI: value,
    unit: "J/m^3",
    ...(value == null
      ? {}
      : {
          provenanceRef:
            `${source.artifactId}:${regionId}:transition_kernel_source_tensor:T00`,
        }),
    sourceTensorRef: source.artifactId,
    supportFunctionRef: plan?.supportFunctionRef ?? null,
    sampleLocationsRef: plan?.sampleLocationsRef ?? null,
    samplingModel:
      value == null ? "missing" : "transition_kernel_support_weighted_source_tensor",
    transitionKernelRef:
      interfaceId == null ? null : `${transitionKernelPath}:${interfaceId}`,
    transitionInterfaceId: interfaceId ?? null,
    leftRegionId,
    rightRegionId,
    leftT00_SI: leftT00,
    rightT00_SI: rightT00,
    blendWeight,
    status,
    blockers: [
      ...(plan == null ? [`${regionId}:sample_plan_entry_missing`] : []),
      ...(transitionInterface == null ? [`${regionId}:transition_interface_missing`] : []),
      ...(transitionInterface != null && transitionInterface.status !== "pass"
        ? [`${regionId}:transition_interface_${transitionInterface.status}`]
        : []),
      ...(left == null ? [`${regionId}:left_source_region_missing`] : []),
      ...(right == null ? [`${regionId}:right_source_region_missing`] : []),
      ...(left != null && !leftAuthority
        ? [`${regionId}:left_source_full_tensor_authority_not_pass`]
        : []),
      ...(right != null && !rightAuthority
        ? [`${regionId}:right_source_full_tensor_authority_not_pass`]
        : []),
    ],
    warnings: [
      "reduced-order transition sample uses source-side transition kernel support weighting, not adjacent-region averaging",
      "sample is diagnostic evidence for QEI dossier intake and does not prove QEI or material credibility",
    ],
  };
};

export const buildQeiPointwiseTransitionSourceSamples = (args: {
  repoRoot: string;
  qeiWorldlineSamplePlanPath: string;
  sourceFullTensorPath: string;
  transitionKernelPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2QeiPointwiseTransitionSourceSamplesV1 => {
  const paths = [
    args.qeiWorldlineSamplePlanPath,
    args.sourceFullTensorPath,
    args.transitionKernelPath,
  ];
  if (!args.auditOnly && paths.some(pathUsesLatestAlias)) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const samplePlan = readRequired(
    args.repoRoot,
    args.qeiWorldlineSamplePlanPath,
    isNhm2QeiWorldlineSamplePlan,
    "QEI worldline sample plan",
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
  const blockers = [
    ...(samplePlan.tensorRef === source.artifactId ||
    samplePlan.tensorRef === args.sourceFullTensorPath
      ? []
      : ["sample_plan_tensor_ref_mismatch"]),
    ...(samplePlan.transitionKernelRef === args.transitionKernelPath
      ? []
      : ["sample_plan_transition_kernel_ref_mismatch"]),
    ...(transitionKernel.sourceTensorRef === args.sourceFullTensorPath ||
    transitionKernel.sourceTensorRef === source.artifactId
      ? []
      : ["transition_kernel_source_tensor_ref_mismatch"]),
    ...(transitionKernel.atlasHash == null || transitionKernel.atlasHash === samplePlan.atlasHash
      ? []
      : ["transition_kernel_atlas_hash_mismatch"]),
  ];
  const artifact = buildNhm2QeiPointwiseTransitionSourceSamples({
    generatedAt: new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: samplePlan.selectedProfileId,
    atlasRef: samplePlan.atlasRef,
    atlasHash: samplePlan.atlasHash,
    tensorRef: source.artifactId,
    samplePlanRef: args.qeiWorldlineSamplePlanPath,
    transitionKernelRef: args.transitionKernelPath,
    samples: TRANSITION_REGIONS.map((regionId) =>
      pointwiseSample(samplePlan, source, transitionKernel, args.transitionKernelPath, regionId),
    ),
    blockers,
  });
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const raw = parseArgs(process.argv.slice(2));
  const qeiWorldlineSamplePlanPath = asString(raw["qei-worldline-sample-plan"]);
  const sourceFullTensorPath = asString(raw["source-full-tensor"]);
  const transitionKernelPath = asString(raw["transition-kernel"]);
  const outPath = asString(raw.out);
  if (
    qeiWorldlineSamplePlanPath == null ||
    sourceFullTensorPath == null ||
    transitionKernelPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--qei-worldline-sample-plan, --source-full-tensor, --transition-kernel, and --out are required",
    );
  }
  const artifact = buildQeiPointwiseTransitionSourceSamples({
    repoRoot: process.cwd(),
    qeiWorldlineSamplePlanPath,
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
