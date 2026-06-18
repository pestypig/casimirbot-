import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildGrEvolveBrick,
  serializeGrEvolveBrick,
} from "../../server/gr-evolve-brick.ts";
import {
  NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_REQUIRED_CHANNELS,
} from "../../shared/contracts/nhm2-dynamic-geometry-samples.v1";
import {
  buildNhm2EffectiveGeometryReference,
  isNhm2EffectiveGeometryReference,
} from "../../shared/contracts/nhm2-effective-geometry-reference.v1";

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const channelNamesFromGrEvolveBrick = (value: unknown): string[] => {
  const record = isRecord(value) ? value : null;
  const channels = isRecord(record?.channels) ? record.channels : null;
  if (record?.kind !== "gr-evolve-brick" || channels == null) return [];
  return Object.keys(channels).sort();
};

export const runNhm2GrEvolveEffectiveGeometryReferenceCapture = (args: {
  repoRoot: string;
  outPath: string;
  brickOutPath: string;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  chartId?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  dims?: [number, number, number] | null;
  timeSeconds?: number | null;
}) => {
  const brick = buildGrEvolveBrick({
    dims: args.dims ?? [8, 8, 8],
    steps: 0,
    dt_s: 0,
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

  const reread = JSON.parse(readFileSync(brickOutPath, "utf8")) as unknown;
  const availableChannels = channelNamesFromGrEvolveBrick(reread);
  const requiredChannels = [...NHM2_GR_EVOLVE_DYNAMIC_GEOMETRY_REQUIRED_CHANNELS];
  const missingChannels = requiredChannels.filter(
    (channel) => !availableChannels.includes(channel),
  );
  const artifact = buildNhm2EffectiveGeometryReference({
    laneId: args.laneId ?? null,
    selectedProfileId: args.selectedProfileId ?? null,
    runId: args.runId ?? null,
    chartId: args.chartId ?? null,
    atlasRef: args.atlasRef ?? null,
    atlasHash: args.atlasHash ?? null,
    effectiveGeometryRef: args.brickOutPath,
    sourceKind: "gr_evolve_brick_static_reference",
    requiredChannels,
    availableChannels,
    missingChannels,
    status: missingChannels.length === 0 ? "computed" : "missing",
  });
  if (!isNhm2EffectiveGeometryReference(artifact)) {
    throw new Error("built artifact failed nhm2_effective_geometry_reference/v1 validation");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
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
  const artifact = runNhm2GrEvolveEffectiveGeometryReferenceCapture({
    repoRoot: process.cwd(),
    outPath,
    brickOutPath,
    laneId: asString(args["lane-id"]),
    selectedProfileId: asString(args["selected-profile-id"]),
    runId: asString(args["run-id"]),
    chartId: asString(args["chart-id"]),
    atlasRef: asString(args["atlas-ref"]),
    atlasHash: asString(args["atlas-hash"]),
    dims: parseDims(args.dims),
    timeSeconds: asNumber(args["time-s"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
  process.exit(0);
}
