import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2BackreactionResidualReceipt,
  isNhm2BackreactionResidualReceipt,
  type Nhm2BackreactionResidualReceiptV1,
} from "../../shared/contracts/nhm2-backreaction-residual-receipt.v1";
import {
  isNhm2DynamicGeometrySamplesArtifact,
  type Nhm2DynamicGeometrySamplesArtifactV1,
} from "../../shared/contracts/nhm2-dynamic-geometry-samples.v1";
import {
  isNhm2EffectiveGeometryReference,
  type Nhm2EffectiveGeometryReferenceArtifactV1,
} from "../../shared/contracts/nhm2-effective-geometry-reference.v1";
import {
  isNhm2AveragedSourceTensorReceipt,
  type Nhm2AveragedSourceTensorReceiptV1,
} from "../../shared/contracts/nhm2-averaged-source-tensor-receipt.v1";

const DEFAULT_CHANNELS = [
  "alpha",
  "beta_x",
  "beta_y",
  "beta_z",
  "gamma_xx",
  "gamma_yy",
  "gamma_zz",
  "gamma_xy",
  "gamma_xz",
  "gamma_yz",
  "K_xx",
  "K_yy",
  "K_zz",
  "K_xy",
  "K_xz",
  "K_yz",
  "H_constraint",
  "M_constraint_x",
  "M_constraint_y",
  "M_constraint_z",
];

type GrEvolveBrick = {
  kind?: unknown;
  dims?: unknown;
  format?: unknown;
  channelOrder?: unknown;
  channels?: unknown;
};

type ChannelStats = {
  channelId: string;
  sampleCount: number;
  dynamicLInf: number | null;
  effectiveLInf: number | null;
  absoluteLInf: number | null;
  relativeLInf: number | null;
  relativeL2: number | null;
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

const splitCsv = (value: string | null): string[] =>
  value == null
    ? DEFAULT_CHANNELS
    : value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8")) as unknown;

const readDynamicSamples = (
  repoRoot: string,
  path: string,
): Nhm2DynamicGeometrySamplesArtifactV1 => {
  const artifact = readJson(repoRoot, path);
  if (!isNhm2DynamicGeometrySamplesArtifact(artifact)) {
    throw new Error(`dynamic geometry samples has invalid contract: ${path}`);
  }
  return artifact;
};

const readEffectiveReference = (
  repoRoot: string,
  path: string,
): Nhm2EffectiveGeometryReferenceArtifactV1 => {
  const artifact = readJson(repoRoot, path);
  if (!isNhm2EffectiveGeometryReference(artifact)) {
    throw new Error(`effective geometry reference has invalid contract: ${path}`);
  }
  return artifact;
};

const readAveragedSource = (
  repoRoot: string,
  path: string,
): Nhm2AveragedSourceTensorReceiptV1 => {
  const artifact = readJson(repoRoot, path);
  if (!isNhm2AveragedSourceTensorReceipt(artifact)) {
    throw new Error(`averaged source tensor receipt has invalid contract: ${path}`);
  }
  return artifact;
};

const readBrick = (repoRoot: string, path: string): GrEvolveBrick => {
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) throw new Error(`gr-evolve brick missing: ${path}`);
  return JSON.parse(readFileSync(resolved, "utf8")) as GrEvolveBrick;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const brickVoxelCount = (brick: GrEvolveBrick): number | null => {
  if (
    !Array.isArray(brick.dims) ||
    brick.dims.length !== 3 ||
    !brick.dims.every((entry) => typeof entry === "number" && Number.isInteger(entry))
  ) {
    return null;
  }
  return brick.dims.reduce((product, entry) => product * entry, 1);
};

const decodeChannel = (
  brick: GrEvolveBrick,
  channelId: string,
): { values: number[] | null; blockers: string[] } => {
  const blockers: string[] = [];
  if (brick.kind !== "gr-evolve-brick") blockers.push("brick_kind_not_gr_evolve");
  if (brick.format !== "r32f") blockers.push("brick_format_not_r32f");
  const channels = isRecord(brick.channels) ? brick.channels : null;
  const channel = isRecord(channels?.[channelId]) ? channels?.[channelId] : null;
  const encoded = typeof channel?.data === "string" ? channel.data : null;
  const voxelCount = brickVoxelCount(brick);
  if (channel == null) blockers.push("channel_missing");
  if (encoded == null) blockers.push("channel_data_missing");
  if (voxelCount == null) blockers.push("brick_dims_invalid");
  if (blockers.length > 0 || encoded == null || voxelCount == null) {
    return { values: null, blockers };
  }
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.byteLength !== voxelCount * 4) {
    return {
      values: null,
      blockers: ["channel_data_length_mismatch"],
    };
  }
  const values = Array.from({ length: voxelCount }, (_, index) =>
    bytes.readFloatLE(index * 4),
  );
  return { values, blockers };
};

const lInf = (values: number[]): number =>
  values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);

const l2 = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sumSquares = values.reduce((sum, value) => sum + value * value, 0);
  return Math.sqrt(sumSquares / values.length);
};

const compareChannel = (
  channelId: string,
  dynamicBricks: GrEvolveBrick[],
  effectiveBrick: GrEvolveBrick,
  epsilon: number,
): ChannelStats => {
  const blockers: string[] = [];
  const dynamicDecoded = dynamicBricks.map((brick, index) => {
    const decoded = decodeChannel(brick, channelId);
    blockers.push(
      ...decoded.blockers.map((blocker) => `dynamic_sample_${index}:${blocker}`),
    );
    return decoded.values;
  });
  const effectiveDecoded = decodeChannel(effectiveBrick, channelId);
  blockers.push(
    ...effectiveDecoded.blockers.map((blocker) => `effective:${blocker}`),
  );
  const validDynamic = dynamicDecoded.filter(
    (values): values is number[] => values != null,
  );
  const effective = effectiveDecoded.values;
  if (validDynamic.length !== dynamicBricks.length) {
    blockers.push("dynamic_channel_sample_decode_incomplete");
  }
  if (effective == null) blockers.push("effective_channel_decode_missing");
  if (validDynamic.length === 0 || effective == null) {
    return {
      channelId,
      sampleCount: validDynamic.length,
      dynamicLInf: null,
      effectiveLInf: effective == null ? null : lInf(effective),
      absoluteLInf: null,
      relativeLInf: null,
      relativeL2: null,
      blockers,
    };
  }
  const length = effective.length;
  if (!validDynamic.every((values) => values.length === length)) {
    blockers.push("dynamic_effective_channel_shape_mismatch");
    return {
      channelId,
      sampleCount: validDynamic.length,
      dynamicLInf: null,
      effectiveLInf: lInf(effective),
      absoluteLInf: null,
      relativeLInf: null,
      relativeL2: null,
      blockers,
    };
  }
  const averaged = Array.from({ length }, (_, valueIndex) => {
    const sum = validDynamic.reduce(
      (accumulator, values) => accumulator + values[valueIndex],
      0,
    );
    return sum / validDynamic.length;
  });
  const delta = averaged.map((value, index) => value - effective[index]);
  const effectiveLInf = lInf(effective);
  const effectiveL2 = l2(effective);
  const absoluteLInf = lInf(delta);
  return {
    channelId,
    sampleCount: validDynamic.length,
    dynamicLInf: lInf(averaged),
    effectiveLInf,
    absoluteLInf,
    relativeLInf: absoluteLInf / Math.max(effectiveLInf, epsilon),
    relativeL2: l2(delta) / Math.max(effectiveL2, epsilon),
    blockers,
  };
};

export const runNhm2BackreactionResidualReceipt = (args: {
  repoRoot: string;
  outPath: string;
  dynamicGeometrySamplesPath: string;
  effectiveGeometryReferencePath: string;
  averagedSourceTensorReceiptPath: string;
  channels?: string[] | null;
  toleranceLInf?: number | null;
  epsilon?: number | null;
}): Nhm2BackreactionResidualReceiptV1 => {
  const dynamicSamples = readDynamicSamples(args.repoRoot, args.dynamicGeometrySamplesPath);
  const effectiveReference = readEffectiveReference(
    args.repoRoot,
    args.effectiveGeometryReferencePath,
  );
  const averagedSource = readAveragedSource(
    args.repoRoot,
    args.averagedSourceTensorReceiptPath,
  );
  const dynamicBricks = dynamicSamples.samples
    .filter((sample) => sample.status === "computed" && sample.geometryRef != null)
    .map((sample) => readBrick(args.repoRoot, sample.geometryRef as string));
  const effectiveRef = effectiveReference.effectiveGeometryRef;
  const effectiveBrick =
    effectiveRef == null
      ? null
      : readBrick(args.repoRoot, effectiveRef);
  const topLevelBlockers = [
    dynamicSamples.summary.dynamicGeometrySamplesAvailable
      ? null
      : (dynamicSamples.summary.firstBlocker ?? "dynamic_geometry_samples_not_pass"),
    effectiveReference.summary.effectiveGeometryAvailable
      ? null
      : (effectiveReference.summary.firstBlocker ?? "effective_geometry_reference_not_pass"),
    averagedSource.summary.averagedSourceTensorAvailable
      ? null
      : (averagedSource.summary.firstBlocker ?? "averaged_source_tensor_not_pass"),
    dynamicBricks.length > 0 ? null : "dynamic_geometry_bricks_missing",
    effectiveBrick == null ? "effective_geometry_brick_missing" : null,
  ].filter((entry): entry is string => entry != null);
  const channelIds = args.channels ?? DEFAULT_CHANNELS;
  const channels =
    effectiveBrick == null
      ? channelIds.map((channelId) => ({
          channelId,
          sampleCount: dynamicBricks.length,
          dynamicLInf: null,
          effectiveLInf: null,
          absoluteLInf: null,
          relativeLInf: null,
          relativeL2: null,
          blockers: ["effective_geometry_brick_missing"],
        }))
      : channelIds.map((channelId) =>
          compareChannel(channelId, dynamicBricks, effectiveBrick, args.epsilon ?? 1e-12),
        );
  const receipt = buildNhm2BackreactionResidualReceipt({
    laneId: dynamicSamples.laneId,
    selectedProfileId: dynamicSamples.selectedProfileId,
    runId: dynamicSamples.runId,
    chartId: dynamicSamples.chartId,
    atlasRef: dynamicSamples.atlasRef,
    atlasHash: dynamicSamples.atlasHash,
    dynamicGeometrySamplesRef: args.dynamicGeometrySamplesPath,
    effectiveGeometryReferenceRef: args.effectiveGeometryReferencePath,
    averagedSourceTensorRef: args.averagedSourceTensorReceiptPath,
    toleranceLInf: args.toleranceLInf,
    channels,
    blockers: topLevelBlockers,
  });
  if (!isNhm2BackreactionResidualReceipt(receipt)) {
    throw new Error(
      "built artifact failed nhm2_backreaction_residual_receipt/v1 validation",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return receipt;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const outPath = asString(args.out);
  const dynamicGeometrySamplesPath = asString(args["dynamic-geometry-samples"]);
  const effectiveGeometryReferencePath = asString(args["effective-geometry-reference"]);
  const averagedSourceTensorReceiptPath = asString(args["averaged-source-tensor-receipt"]);
  if (outPath == null) throw new Error("missing required --out");
  if (dynamicGeometrySamplesPath == null) {
    throw new Error("missing required --dynamic-geometry-samples");
  }
  if (effectiveGeometryReferencePath == null) {
    throw new Error("missing required --effective-geometry-reference");
  }
  if (averagedSourceTensorReceiptPath == null) {
    throw new Error("missing required --averaged-source-tensor-receipt");
  }
  const receipt = runNhm2BackreactionResidualReceipt({
    repoRoot: process.cwd(),
    outPath,
    dynamicGeometrySamplesPath,
    effectiveGeometryReferencePath,
    averagedSourceTensorReceiptPath,
    channels: splitCsv(asString(args.channels)),
    toleranceLInf: asNumber(args["tolerance-linf"]),
    epsilon: asNumber(args.epsilon),
  });
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}
