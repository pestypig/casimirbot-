import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildGrEvolveBrick,
  serializeGrEvolveBrick,
} from "../../server/gr-evolve-brick.ts";
import {
  runNhm2DynamicGeometrySamples,
} from "./build-dynamic-geometry-samples.ts";

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

const parseDims = (value: unknown): [number, number, number] => {
  const text = asString(value);
  if (text == null) return [8, 8, 8];
  const parts = text.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part) || part < 2)) {
    throw new Error("--dims must be three comma-separated integers");
  }
  return parts.map((part) => Math.floor(part)) as [number, number, number];
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

export const runNhm2GrEvolveDynamicGeometryCapture = (args: {
  repoRoot: string;
  outPath: string;
  brickOutPath: string;
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
  dims?: [number, number, number] | null;
  steps?: number | null;
  dtSeconds?: number | null;
  timeSeconds?: number | null;
}) => {
  const brick = buildGrEvolveBrick({
    dims: args.dims ?? [8, 8, 8],
    steps: Math.max(0, Math.floor(args.steps ?? 1)),
    dt_s: Math.max(0, args.dtSeconds ?? 0),
    time_s: Math.max(0, args.timeSeconds ?? 0),
    includeExtra: true,
    includeKij: true,
    includeMatter: true,
    includeInvariants: true,
  });
  const serialized = serializeGrEvolveBrick(brick);
  const brickOutPath = resolvePath(args.repoRoot, args.brickOutPath);
  mkdirSync(dirname(brickOutPath), { recursive: true });
  writeFileSync(brickOutPath, `${JSON.stringify(serialized, null, 2)}\n`, "utf8");

  return runNhm2DynamicGeometrySamples({
    repoRoot: args.repoRoot,
    outPath: args.outPath,
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
    grEvolveBrickRefs: [args.brickOutPath],
  });
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const outPath = asString(args.out);
  const brickOutPath = asString(args["brick-out"]);
  if (outPath == null) {
    throw new Error("missing required --out");
  }
  if (brickOutPath == null) {
    throw new Error("missing required --brick-out");
  }
  const artifact = runNhm2GrEvolveDynamicGeometryCapture({
    repoRoot: process.cwd(),
    outPath,
    brickOutPath,
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
    dims: parseDims(args.dims),
    steps: asNumber(args.steps),
    dtSeconds: asNumber(args["dt-s"]),
    timeSeconds: asNumber(args["time-s"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
  process.exit(0);
}
