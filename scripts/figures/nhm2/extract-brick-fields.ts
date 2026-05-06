import {
  decodeBinaryBrick,
  hashFloat32,
  loadBrickBytes,
  validateChannelConsistency,
  type DecodedBrick,
  type Vec3,
} from "../../rendering/scientific-3p1/brick-io.js";

export interface BrickFieldBundle {
  brick: DecodedBrick;
  dims: Vec3;
  hashes: Record<string, string>;
}

export function loadBrickFieldBundle(brickPath: string, wrappedBrickPath: string): BrickFieldBundle {
  const brick = decodeBinaryBrick(loadBrickBytes(brickPath, wrappedBrickPath));
  const { dims } = validateChannelConsistency(brick);
  const hashes: Record<string, string> = {};
  for (const [name, channel] of brick.channels.entries()) {
    hashes[name] = hashFloat32(channel.values);
  }
  return { brick, dims, hashes };
}

export function requireChannel(bundle: BrickFieldBundle, name: string): Float32Array {
  const channel = bundle.brick.channels.get(name);
  if (!channel) throw new Error(`required_channel_missing:${name}`);
  return channel.values;
}

export function sampleCenterSlice(
  bundle: BrickFieldBundle,
  channelName: string,
  options: { axis?: "xz" | "yz"; samples?: number; signed?: boolean } = {},
): Array<{ x: number; y: number; value: number }> {
  const axis = options.axis ?? "xz";
  const samples = options.samples ?? 32;
  const values = requireChannel(bundle, channelName);
  const [nx, ny, nz] = bundle.dims;
  const width = axis === "xz" ? nx : ny;
  const height = nz;
  const yMid = Math.floor(ny / 2);
  const xMid = Math.floor(nx / 2);
  const rows: Array<{ x: number; y: number; value: number }> = [];
  for (let sy = 0; sy < samples; sy += 1) {
    for (let sx = 0; sx < samples; sx += 1) {
      const u = Math.min(width - 1, Math.round((sx / Math.max(1, samples - 1)) * (width - 1)));
      const z = Math.min(height - 1, Math.round((sy / Math.max(1, samples - 1)) * (height - 1)));
      const x = axis === "xz" ? u : xMid;
      const y = axis === "xz" ? yMid : u;
      const index = x + nx * (y + ny * z);
      const raw = Number(values[index] ?? 0);
      rows.push({ x: sx, y: samples - 1 - sy, value: options.signed ? raw : Math.abs(raw) });
    }
  }
  return rows;
}

export function sampleCenterline(bundle: BrickFieldBundle, channelName: string, samples = 64): Array<{ s: number; value: number }> {
  const values = requireChannel(bundle, channelName);
  const [nx, ny, nz] = bundle.dims;
  const y = Math.floor(ny / 2);
  const z = Math.floor(nz / 2);
  const rows: Array<{ s: number; value: number }> = [];
  for (let i = 0; i < samples; i += 1) {
    const x = Math.min(nx - 1, Math.round((i / Math.max(1, samples - 1)) * (nx - 1)));
    rows.push({ s: i, value: Number(values[x + nx * (y + ny * z)] ?? 0) });
  }
  return rows;
}

export function channelExtent(bundle: BrickFieldBundle, channelName: string): { min: number; max: number; meanAbs: number } {
  const values = requireChannel(bundle, channelName);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sumAbs = 0;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
    sumAbs += Math.abs(value);
  }
  return { min, max, meanAbs: sumAbs / Math.max(1, values.length) };
}
