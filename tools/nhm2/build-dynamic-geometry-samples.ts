import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_REQUIRED_CHANNELS,
  buildNhm2DynamicGeometrySamples,
  isNhm2DynamicGeometrySamplesArtifact,
  type Nhm2DynamicGeometrySamplesArtifactV1,
  type Nhm2DynamicGeometrySampleStatus,
} from "../../shared/contracts/nhm2-dynamic-geometry-samples.v1";

export const NHM2_REQUIRED_GR_EVOLVE_DYNAMIC_GEOMETRY_CHANNELS = [
  ...NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_REQUIRED_CHANNELS,
] as const;

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

const asBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const asStatus = (value: unknown): Nhm2DynamicGeometrySampleStatus | null => {
  const text = asString(value);
  return text === "computed" || text === "missing" || text === "proxy" || text === "not_run"
    ? text
    : null;
};

const parseCsv = (value: unknown): string[] => {
  const text = asString(value);
  if (text == null) return [];
  return text
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const channelNamesFromGrEvolveBrick = (value: unknown): string[] => {
  const record = isRecord(value) ? value : null;
  const channels = isRecord(record?.channels) ? record.channels : null;
  if (record?.kind !== "gr-evolve-brick" || channels == null) return [];
  return Object.keys(channels).sort();
};

const sampleFromGrEvolveBrickRef = (
  repoRoot: string,
  ref: string,
  index: number,
) => {
  const requiredChannels = [...NHM2_REQUIRED_GR_EVOLVE_DYNAMIC_GEOMETRY_CHANNELS];
  const resolved = resolvePath(repoRoot, ref);
  if (!existsSync(resolved)) {
    return {
      sampleId: `dynamic_geometry_sample_${index}`,
      timeSeconds: index,
      geometryRef: ref,
      sourceKind: "missing" as const,
      requiredChannels,
      availableChannels: [],
      missingChannels: requiredChannels,
      status: "missing" as const,
      blockers: ["gr_evolve_brick_artifact_missing"],
    };
  }
  const brick = readJson(resolved);
  const availableChannels = channelNamesFromGrEvolveBrick(brick);
  const missingChannels = requiredChannels.filter(
    (channel) => !availableChannels.includes(channel),
  );
  return {
    sampleId: `dynamic_geometry_sample_${index}`,
    timeSeconds: isRecord(brick) && typeof brick.time_s === "number" ? brick.time_s : index,
    geometryRef: ref,
    sourceKind: "gr_evolve_brick" as const,
    requiredChannels,
    availableChannels,
    missingChannels,
    status: (missingChannels.length === 0 ? "computed" : "missing") as const,
    blockers:
      isRecord(brick) && brick.kind === "gr-evolve-brick"
        ? []
        : ["gr_evolve_brick_contract_missing"],
  };
};

export const runNhm2DynamicGeometrySamples = (args: {
  repoRoot: string;
  outPath: string;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  chartId?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  sourceTensorRef?: string | null;
  switchingConservationRef?: string | null;
  frequencyConvergenceRef?: string | null;
  cycleCount?: number | null;
  averagingWindowSeconds?: number | null;
  fixedCycleAverageSource?: boolean | null;
  sampleRefs?: string[];
  grEvolveBrickRefs?: string[];
  sampleStatus?: Nhm2DynamicGeometrySampleStatus | null;
}): Nhm2DynamicGeometrySamplesArtifactV1 => {
  const sampleRefs = args.sampleRefs ?? [];
  const grEvolveBrickSamples = (args.grEvolveBrickRefs ?? []).map((ref, index) =>
    sampleFromGrEvolveBrickRef(args.repoRoot, ref, index),
  );
  const artifact = buildNhm2DynamicGeometrySamples({
    laneId: args.laneId ?? null,
    selectedProfileId: args.selectedProfileId ?? null,
    runId: args.runId ?? null,
    chartId: args.chartId ?? null,
    atlasRef: args.atlasRef ?? null,
    atlasHash: args.atlasHash ?? null,
    sourceTensorRef: args.sourceTensorRef ?? null,
    switchingConservationRef: args.switchingConservationRef ?? null,
    frequencyConvergenceRef: args.frequencyConvergenceRef ?? null,
    cycleCount: args.cycleCount ?? null,
    averagingWindowSeconds: args.averagingWindowSeconds ?? null,
    fixedCycleAverageSource: args.fixedCycleAverageSource ?? null,
    samples:
      grEvolveBrickSamples.length > 0
        ? grEvolveBrickSamples
        : sampleRefs.map((geometryRef, index) => ({
            sampleId: `dynamic_geometry_sample_${index}`,
            timeSeconds: index,
            geometryRef,
            status: args.sampleStatus ?? "computed",
            blockers: [],
          })),
  });
  if (!isNhm2DynamicGeometrySamplesArtifact(artifact)) {
    throw new Error("built artifact failed nhm2_dynamic_geometry_samples/v1 validation");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const outPath = asString(args.out);
  if (outPath == null) {
    throw new Error("missing required --out");
  }
  const artifact = runNhm2DynamicGeometrySamples({
    repoRoot: process.cwd(),
    outPath,
    laneId: asString(args["lane-id"]),
    selectedProfileId: asString(args["selected-profile-id"]),
    runId: asString(args["run-id"]),
    chartId: asString(args["chart-id"]),
    atlasRef: asString(args["atlas-ref"]),
    atlasHash: asString(args["atlas-hash"]),
    sourceTensorRef: asString(args["source-tensor-ref"]),
    switchingConservationRef: asString(args["switching-conservation-ref"]),
    frequencyConvergenceRef: asString(args["frequency-convergence-ref"]),
    cycleCount: asNumber(args["cycle-count"]),
    averagingWindowSeconds: asNumber(args["averaging-window-seconds"]),
    fixedCycleAverageSource: asBoolean(args["fixed-cycle-average-source"]),
    sampleRefs: parseCsv(args["sample-refs"]),
    grEvolveBrickRefs: parseCsv(args["gr-evolve-brick-refs"]),
    sampleStatus: asStatus(args["sample-status"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
