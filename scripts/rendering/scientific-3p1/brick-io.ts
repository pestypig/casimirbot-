import crypto from "node:crypto";
import fs from "node:fs";

export type Vec3 = [number, number, number];

export interface DecodedChannel {
  dims: Vec3;
  origin: Vec3;
  spacing: Vec3;
  values: Float32Array;
  headerMin?: number;
  headerMax?: number;
  decodedMin?: number;
  decodedMax?: number;
}

export interface DecodedBrick {
  channels: Map<string, DecodedChannel>;
}

export function loadBrickBytes(brickPath: string, wrappedPath?: string): Buffer {
  if (fs.existsSync(brickPath)) {
    return fs.readFileSync(brickPath);
  }

  if (!wrappedPath || !fs.existsSync(wrappedPath)) {
    throw new Error(`Brick not found: ${brickPath}`);
  }

  const wrapped = JSON.parse(fs.readFileSync(wrappedPath, "utf8"));
  const binary =
    wrapped?.binaryBrickBase64 ??
    wrapped?.brickBase64 ??
    wrapped?.rawBase64 ??
    wrapped?.brick?.base64;
  if (typeof binary !== "string" || binary.length === 0) {
    throw new Error(`Wrapped brick did not contain a base64 brick payload: ${wrappedPath}`);
  }
  return Buffer.from(binary, "base64");
}

export function sha256Hex(bytes: Buffer | string): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function hashFloat32(values: Float32Array): string {
  return sha256Hex(Buffer.from(values.buffer, values.byteOffset, values.byteLength));
}

export function decodeBinaryBrick(bytes: Buffer): DecodedBrick {
  if (bytes.byteLength >= 12) {
    const headerLength = bytes.readUInt32LE(0);
    if (headerLength > 0 && 4 + headerLength <= bytes.byteLength) {
      const headerText = bytes.subarray(4, 4 + headerLength).toString("utf8");
      try {
        const header = JSON.parse(headerText) as Record<string, unknown>;
        if (header.kind === "gr-evolve-brick") return decodeJsonHeaderBrick(bytes, header, headerLength);
      } catch {
        // Fall through to legacy magic decoding.
      }
    }
  }

  let offset = 0;

  const u32 = () => {
    const v = bytes.readUInt32LE(offset);
    offset += 4;
    return v;
  };
  const f64 = () => {
    const v = bytes.readDoubleLE(offset);
    offset += 8;
    return v;
  };

  const magic = u32();
  const MAGIC = 0x33424d48;
  const VERSION = 1;
  if (magic !== MAGIC) throw new Error(`Invalid brick magic 0x${magic.toString(16)}`);
  const version = u32();
  if (version !== VERSION) throw new Error(`Unsupported brick version ${version}`);

  const channelCount = u32();
  const channels = new Map<string, DecodedChannel>();

  for (let c = 0; c < channelCount; c += 1) {
    const nameLength = u32();
    const name = bytes.subarray(offset, offset + nameLength).toString("utf8");
    offset += nameLength;

    const dims: Vec3 = [u32(), u32(), u32()];
    const origin: Vec3 = [f64(), f64(), f64()];
    const spacing: Vec3 = [f64(), f64(), f64()];
    const count = dims[0] * dims[1] * dims[2];
    const byteLength = count * 4;
    const values = new Float32Array(
      bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + byteLength),
    );
    offset += byteLength;
    channels.set(name, { dims, origin, spacing, values });
  }

  return { channels };
}

function decodeJsonHeaderBrick(bytes: Buffer, header: Record<string, unknown>, headerLength: number): DecodedBrick {
  const dims = readVec3(header.dims, [1, 1, 1]).map((v) => Math.max(1, Math.floor(v))) as Vec3;
  const voxelSize = readVec3(header.voxelSize_m, [1, 1, 1]).map((v) => Math.max(1e-6, v)) as Vec3;
  const bounds = header.bounds as Record<string, unknown> | undefined;
  const origin =
    bounds && Array.isArray(bounds.min)
      ? readVec3(bounds.min, [0, 0, 0])
      : ([
          -((dims[0] - 1) * voxelSize[0]) / 2,
          -((dims[1] - 1) * voxelSize[1]) / 2,
          -((dims[2] - 1) * voxelSize[2]) / 2,
        ] as Vec3);
  const max =
    bounds && Array.isArray(bounds.max)
      ? readVec3(bounds.max, [
          origin[0] + (dims[0] - 1) * voxelSize[0],
          origin[1] + (dims[1] - 1) * voxelSize[1],
          origin[2] + (dims[2] - 1) * voxelSize[2],
        ])
      : ([
          origin[0] + (dims[0] - 1) * voxelSize[0],
          origin[1] + (dims[1] - 1) * voxelSize[1],
          origin[2] + (dims[2] - 1) * voxelSize[2],
        ] as Vec3);
  const spacing: Vec3 = [
    dims[0] <= 1 ? voxelSize[0] : (max[0] - origin[0]) / (dims[0] - 1),
    dims[1] <= 1 ? voxelSize[1] : (max[1] - origin[1]) / (dims[1] - 1),
    dims[2] <= 1 ? voxelSize[2] : (max[2] - origin[2]) / (dims[2] - 1),
  ];
  const channelsMeta =
    header.channels && typeof header.channels === "object"
      ? (header.channels as Record<string, Record<string, unknown>>)
      : {};
  const orderRaw = Array.isArray(header.channelOrder) ? (header.channelOrder as unknown[]) : Object.keys(channelsMeta);
  const channelOrder = orderRaw.map((entry) => String(entry)).filter(Boolean);
  const padding = (4 - (headerLength % 4)) % 4;
  let offset = 4 + headerLength + padding;
  const channels = new Map<string, DecodedChannel>();

  for (const channelName of channelOrder) {
    const spec = channelsMeta[channelName];
    if (!spec) continue;
    const byteLength = Math.max(4, Math.floor(Number(spec.bytes) || 0));
    if (byteLength % 4 !== 0) throw new Error(`brick_channel_alignment_invalid:${channelName}`);
    if (offset + byteLength > bytes.byteLength) throw new Error(`brick_channel_missing_bytes:${channelName}`);
    const values = new Float32Array(byteLength / 4);
    const dv = new DataView(bytes.buffer, bytes.byteOffset + offset, byteLength);
    let decodedMin = Number.POSITIVE_INFINITY;
    let decodedMax = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < values.length; i += 1) {
      const value = dv.getFloat32(i * 4, true);
      values[i] = value;
      if (value < decodedMin) decodedMin = value;
      if (value > decodedMax) decodedMax = value;
    }
    channels.set(channelName, {
      dims,
      origin,
      spacing,
      values,
      headerMin: Number(spec.min) || 0,
      headerMax: Number(spec.max) || 0,
      decodedMin,
      decodedMax,
    });
    offset += byteLength;
  }

  return { channels };
}

function readVec3(value: unknown, fallback: Vec3): Vec3 {
  if (!Array.isArray(value) || value.length < 3) return [...fallback] as Vec3;
  return [
    Number.isFinite(Number(value[0])) ? Number(value[0]) : fallback[0],
    Number.isFinite(Number(value[1])) ? Number(value[1]) : fallback[1],
    Number.isFinite(Number(value[2])) ? Number(value[2]) : fallback[2],
  ];
}

export function validateChannelConsistency(brick: DecodedBrick): { dims: Vec3; origin: Vec3; spacing: Vec3 } {
  const first = brick.channels.values().next().value as DecodedChannel | undefined;
  if (!first) throw new Error("Brick has no channels");

  for (const [name, channel] of brick.channels) {
    if (channel.values.length !== channel.dims[0] * channel.dims[1] * channel.dims[2]) {
      throw new Error(`Channel ${name} has inconsistent dimensions and value length`);
    }
    if (channel.dims.some((v, i) => v !== first.dims[i])) {
      throw new Error(`Channel ${name} dimensions do not match the first channel`);
    }
    if (channel.origin.some((v, i) => v !== first.origin[i])) {
      throw new Error(`Channel ${name} origin does not match the first channel`);
    }
    if (channel.spacing.some((v, i) => v !== first.spacing[i])) {
      throw new Error(`Channel ${name} spacing does not match the first channel`);
    }
  }

  return { dims: first.dims, origin: first.origin, spacing: first.spacing };
}
