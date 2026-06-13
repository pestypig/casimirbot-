import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  calculateEnergyPipeline,
  initializePipelineState,
  type EnergyPipelineState,
} from "../../server/energy-pipeline";
import {
  buildNhm2RegionalFullTensorCoverageArtifact,
  isNhm2RegionalFullTensorCoverageArtifact,
  type BuildNhm2RegionalFullTensorCoverageRegionInput,
  type Nhm2RegionalFullTensorCoverageArtifactV1,
} from "../../shared/contracts/nhm2-regional-full-tensor-coverage.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2SameChartFullTensorArtifact,
  type Nhm2SameChartFullTensorArtifactV1,
} from "../../shared/contracts/nhm2-same-chart-full-tensor.v1";
import {
  isNhm2SourceClosureV2Artifact,
  type Nhm2SourceClosureV2Artifact,
} from "../../shared/contracts/nhm2-source-closure.v2";

const DEFAULT_SELECTED_PROFILE_ID = "stage1_centerline_alpha_0p995_v1";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

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

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const writeJson = (repoRoot: string, path: string, value: unknown): void => {
  const resolved = resolvePath(repoRoot, path);
  mkdirSync(dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const getNested = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>((cursor, part) => asRecord(cursor)?.[part], value);

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const sampleCountFromRegion = (region: Record<string, unknown>): number | null =>
  asNumber(region.sampleCount) ??
  asNumber(getNested(region, ["metricAccounting", "sampleCount"])) ??
  asNumber(getNested(region, ["metricT00Diagnostics", "sampleCount"])) ??
  asNumber(getNested(region, ["metricT00Diagnostics", "trace", "sampleCount"]));

const artifactRefFromTensor = (
  tensor: Nhm2SameChartFullTensorArtifactV1 | null,
  fallback: string,
): string =>
  tensor?.components
    .map((component) => asString(component.provenance.artifactRef))
    .find((ref): ref is string => ref != null) ?? fallback;

const buildCoverageRegionFromSourceClosureRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  region: Record<string, unknown> | null,
  runtimeArtifactRef: string,
): BuildNhm2RegionalFullTensorCoverageRegionInput => {
  const tensor = isNhm2SameChartFullTensorArtifact(region?.metricRequiredSameChartFullTensor)
    ? region.metricRequiredSameChartFullTensor
    : null;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (region == null) {
    blockers.push("source_closure_region_missing");
  }
  if (tensor != null) {
    warnings.push("metric_required_same_chart_full_tensor_frozen_from_current_runtime");
  }

  return {
    regionId,
    artifactRef: artifactRefFromTensor(
      tensor,
      `${runtimeArtifactRef}#nhm2SourceClosure.regionComparisons.regions.${regionId}.metricRequiredSameChartFullTensor`,
    ),
    sampleCount: region == null ? null : sampleCountFromRegion(region),
    sameChartFullTensor: tensor,
    blockers,
    warnings,
  };
};

const sourceClosureRegions = (
  sourceClosure: Nhm2SourceClosureV2Artifact,
): Map<Nhm2RegionalSourceClosureRegionId, Record<string, unknown>> => {
  const regions = new Map<Nhm2RegionalSourceClosureRegionId, Record<string, unknown>>();
  for (const entry of sourceClosure.regionComparisons.regions) {
    if (isRegionId(entry.regionId)) {
      regions.set(entry.regionId, entry as unknown as Record<string, unknown>);
    }
  }
  return regions;
};

export const buildRegionalFullTensorCoverageFromSourceClosure = (args: {
  generatedAt?: string | null;
  sourceClosure: Nhm2SourceClosureV2Artifact;
  sourceClosureRef: string;
  runtimeArtifactRef: string;
  globalSameChartFullTensor?: Nhm2SameChartFullTensorArtifactV1 | null;
}): Nhm2RegionalFullTensorCoverageArtifactV1 => {
  const byRegion = sourceClosureRegions(args.sourceClosure);
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
    buildCoverageRegionFromSourceClosureRegion(
      regionId,
      byRegion.get(regionId) ??
        (regionId === "global" &&
        isNhm2SameChartFullTensorArtifact(args.globalSameChartFullTensor)
          ? ({
              regionId,
              metricRequiredSameChartFullTensor: args.globalSameChartFullTensor,
            } as Record<string, unknown>)
          : null),
      args.runtimeArtifactRef,
    ),
  );
  return buildNhm2RegionalFullTensorCoverageArtifact({
    generatedAt: args.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId:
      asString(args.sourceClosure.wallSourceClosure.selectedProfileId) ??
      DEFAULT_SELECTED_PROFILE_ID,
    sourceClosureRef: args.sourceClosureRef,
    runtimeArtifactRef: args.runtimeArtifactRef,
    regions,
  });
};

const buildRuntimeState = (selectedProfileId: string): EnergyPipelineState => {
  const state = initializePipelineState();
  state.warpFieldType = "nhm2_shift_lapse";
  state.dynamicConfig = {
    ...(asRecord(state.dynamicConfig) ?? {}),
    warpFieldType: "nhm2_shift_lapse",
    shiftLapseProfileId: selectedProfileId,
  } as EnergyPipelineState["dynamicConfig"];
  return state;
};

export type PublishCurrentNhm2RuntimeSourceClosureArgs = {
  repoRoot: string;
  selectedProfileId?: string | null;
  runId?: string | null;
  outRoot?: string | null;
  runtimeOut?: string | null;
  sourceClosureOut?: string | null;
  coverageOut?: string | null;
};

export type PublishCurrentNhm2RuntimeSourceClosureResult = {
  runtimeArtifactPath: string;
  sourceClosurePath: string;
  coveragePath: string;
  runtimeArtifact: Record<string, unknown>;
  sourceClosure: Nhm2SourceClosureV2Artifact;
  coverage: Nhm2RegionalFullTensorCoverageArtifactV1;
};

export const publishCurrentNhm2RuntimeSourceClosure = async (
  args: PublishCurrentNhm2RuntimeSourceClosureArgs,
): Promise<PublishCurrentNhm2RuntimeSourceClosureResult> => {
  const selectedProfileId =
    asString(args.selectedProfileId) ?? DEFAULT_SELECTED_PROFILE_ID;
  const runId = asString(args.runId) ?? "current-nhm2-runtime";
  const outRoot = asString(args.outRoot) ?? "artifacts/research/full-solve/current-runtime";
  const runtimeArtifactPath =
    asString(args.runtimeOut) ?? `${outRoot}/nhm2-runtime-current.json`;
  const sourceClosurePath =
    asString(args.sourceClosureOut) ?? `${outRoot}/nhm2-source-closure-current.json`;
  const coveragePath =
    asString(args.coverageOut) ?? `${outRoot}/nhm2-regional-full-tensor-coverage.json`;
  const generatedAt = new Date().toISOString();
  const state = buildRuntimeState(selectedProfileId);
  const result = await calculateEnergyPipeline(state, { sweepMode: "skip" });
  const resultRecord = result as unknown as Record<string, unknown>;
  const sourceClosure = resultRecord.nhm2SourceClosure;

  if (!isNhm2SourceClosureV2Artifact(sourceClosure)) {
    throw new Error("current NHM2 runtime did not emit nhm2_source_closure/v2");
  }

  const runtimeArtifact: Record<string, unknown> = {
    artifactId: "nhm2_current_runtime_snapshot",
    schemaVersion: "nhm2_current_runtime_snapshot/v1",
    generatedAt,
    runId,
    laneId: "nhm2_shift_lapse",
    selectedProfileId,
    nhm2SameChartFullTensor: resultRecord.nhm2SameChartFullTensor,
    nhm2SourceClosure: sourceClosure,
    regionComparisons: sourceClosure.regionComparisons,
    claimBoundary: {
      diagnosticOnly: true,
      currentRuntimeSnapshotOnly: true,
      doesNotValidateSourceSide: true,
      doesNotPromotePhysicalViability: true,
    },
  };

  const coverage = buildRegionalFullTensorCoverageFromSourceClosure({
    generatedAt,
    sourceClosure,
    sourceClosureRef: sourceClosurePath,
    runtimeArtifactRef: runtimeArtifactPath,
    globalSameChartFullTensor: isNhm2SameChartFullTensorArtifact(
      resultRecord.nhm2SameChartFullTensor,
    )
      ? resultRecord.nhm2SameChartFullTensor
      : null,
  });
  if (!isNhm2RegionalFullTensorCoverageArtifact(coverage)) {
    throw new Error("internal error: produced invalid regional full tensor coverage artifact");
  }

  writeJson(args.repoRoot, runtimeArtifactPath, runtimeArtifact);
  writeJson(args.repoRoot, sourceClosurePath, sourceClosure);
  writeJson(args.repoRoot, coveragePath, coverage);

  return {
    runtimeArtifactPath,
    sourceClosurePath,
    coveragePath,
    runtimeArtifact,
    sourceClosure,
    coverage,
  };
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const result = await publishCurrentNhm2RuntimeSourceClosure({
    repoRoot: process.cwd(),
    selectedProfileId: asString(args["selected-profile-id"]),
    runId: asString(args["run-id"]),
    outRoot: asString(args["out-root"]),
    runtimeOut: asString(args["runtime-out"]),
    sourceClosureOut: asString(args["source-closure-out"]),
    coverageOut: asString(args["coverage-out"]),
  });
  process.stdout.write(`${JSON.stringify(result.coverage, null, 2)}\n`);
};

if (
  existsSync(process.argv[1] ?? "") &&
  normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))
) {
  main()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    });
}
