import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import type { HullMetricVolumeRefV1 } from "@shared/hull-render-contract";

type Vec3 = [number, number, number];

export type HullScientificSnapshotChannel = {
  data: Float32Array;
  min: number;
  max: number;
};

export type HullScientificSnapshot = {
  metricVolumeRef: HullMetricVolumeRefV1;
  resolvedUrl: string;
  metricRefHash: string;
  dims: Vec3;
  bounds: { min: Vec3; max: Vec3 } | null;
  origin_m: Vec3 | null;
  voxelSize_m: Vec3;
  channels: Record<string, HullScientificSnapshotChannel>;
  source: string | null;
  chart: string | null;
  stats: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const readVec3 = (value: unknown, fallback: Vec3): Vec3 => {
  if (!Array.isArray(value) || value.length < 3) return fallback;
  return [
    toFiniteNumber(value[0], fallback[0]),
    toFiniteNumber(value[1], fallback[1]),
    toFiniteNumber(value[2], fallback[2]),
  ];
};

const readDims = (value: unknown): Vec3 | null => {
  if (!Array.isArray(value) || value.length < 3) return null;
  return [
    Math.max(1, Math.floor(toFiniteNumber(value[0], 1))),
    Math.max(1, Math.floor(toFiniteNumber(value[1], 1))),
    Math.max(1, Math.floor(toFiniteNumber(value[2], 1))),
  ];
};

const decodeFloat32FromBase64 = (payload: unknown): Float32Array | null => {
  if (typeof payload !== "string" || payload.length === 0) return null;
  try {
    const bytes = Buffer.from(payload, "base64");
    if (bytes.length % 4 !== 0) return null;
    const out = new Float32Array(bytes.length / 4);
    for (let i = 0; i < out.length; i += 1) out[i] = bytes.readFloatLE(i * 4);
    return out;
  } catch {
    return null;
  }
};

const decodeJsonBrick = (
  value: unknown,
  metricVolumeRef: HullMetricVolumeRefV1,
  resolvedUrl: string,
): HullScientificSnapshot | null => {
  const root = isRecord(value) ? value : null;
  if (!root || root.kind !== "gr-evolve-brick") return null;
  const dims = readDims(root.dims);
  if (!dims) return null;
  const voxelSize_m = readVec3(root.voxelSize_m, [1, 1, 1]).map((entry) =>
    Math.max(1e-6, toFiniteNumber(entry, 1)),
  ) as Vec3;
  const boundsRaw = isRecord(root.bounds) ? root.bounds : null;
  const bounds =
    boundsRaw && Array.isArray(boundsRaw.min) && Array.isArray(boundsRaw.max)
      ? {
          min: readVec3(boundsRaw.min, [0, 0, 0]),
          max: readVec3(boundsRaw.max, [0, 0, 0]),
        }
      : null;
  const channelsRaw = isRecord(root.channels) ? root.channels : {};
  const channels: Record<string, HullScientificSnapshotChannel> = {};
  for (const [name, raw] of Object.entries(channelsRaw)) {
    if (!isRecord(raw)) continue;
    const data = decodeFloat32FromBase64(raw.data);
    if (!data) continue;
    channels[name] = {
      data,
      min: toFiniteNumber(raw.min, 0),
      max: toFiniteNumber(raw.max, 0),
    };
  }
  return {
    metricVolumeRef,
    resolvedUrl,
    metricRefHash: resolveMetricRefHash(metricVolumeRef),
    dims,
    bounds,
    origin_m: bounds ? [...bounds.min] : null,
    voxelSize_m,
    channels,
    source: typeof root.source === "string" ? root.source : metricVolumeRef.source ?? null,
    chart: typeof root.chart === "string" ? root.chart : metricVolumeRef.chart ?? null,
    stats: isRecord(root.stats) ? root.stats : null,
    meta: isRecord(root.meta) ? root.meta : null,
  };
};

const decodeBinaryBrick = (
  value: ArrayBuffer,
  metricVolumeRef: HullMetricVolumeRefV1,
  resolvedUrl: string,
): HullScientificSnapshot | null => {
  if (value.byteLength < 8) return null;
  const view = new DataView(value);
  const headerLength = view.getUint32(0, true);
  if (!Number.isFinite(headerLength) || headerLength <= 0) return null;
  if (headerLength + 4 > value.byteLength) return null;
  const headerBytes = new Uint8Array(value, 4, headerLength);
  let header: Record<string, unknown>;
  try {
    header = JSON.parse(Buffer.from(headerBytes).toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
  if (header.kind !== "gr-evolve-brick") return null;
  const dims = readDims(header.dims);
  if (!dims) return null;
  const voxelSize_m = readVec3(header.voxelSize_m, [1, 1, 1]).map((entry) =>
    Math.max(1e-6, toFiniteNumber(entry, 1)),
  ) as Vec3;
  const boundsRaw = isRecord(header.bounds) ? header.bounds : null;
  const bounds =
    boundsRaw && Array.isArray(boundsRaw.min) && Array.isArray(boundsRaw.max)
      ? {
          min: readVec3(boundsRaw.min, [0, 0, 0]),
          max: readVec3(boundsRaw.max, [0, 0, 0]),
        }
      : null;
  const channelsHeader = isRecord(header.channels) ? header.channels : {};
  const orderRaw = Array.isArray(header.channelOrder)
    ? header.channelOrder
    : Object.keys(channelsHeader);
  const channelOrder = orderRaw
    .map((entry) => String(entry))
    .filter((entry) => entry.length > 0);
  const expectedCount = dims[0] * dims[1] * dims[2];
  const defaultBytes = expectedCount * 4;
  const padding = (4 - (headerLength % 4)) % 4;
  let offset = 4 + headerLength + padding;
  const channels: Record<string, HullScientificSnapshotChannel> = {};
  for (const name of channelOrder) {
    const specRaw = channelsHeader[name];
    if (!isRecord(specRaw)) continue;
    const bytes = Math.max(4, Math.floor(toFiniteNumber(specRaw.bytes, defaultBytes)));
    if (bytes % 4 !== 0) return null;
    if (offset + bytes > value.byteLength) return null;
    const count = bytes / 4;
    const data = new Float32Array(count);
    const chunk = new DataView(value, offset, bytes);
    for (let i = 0; i < count; i += 1) {
      data[i] = chunk.getFloat32(i * 4, true);
    }
    offset += bytes;
    channels[name] = {
      data,
      min: toFiniteNumber(specRaw.min, 0),
      max: toFiniteNumber(specRaw.max, 0),
    };
  }
  return {
    metricVolumeRef,
    resolvedUrl,
    metricRefHash: resolveMetricRefHash(metricVolumeRef),
    dims,
    bounds,
    origin_m: bounds ? [...bounds.min] : null,
    voxelSize_m,
    channels,
    source: typeof header.source === "string" ? header.source : metricVolumeRef.source ?? null,
    chart: typeof header.chart === "string" ? header.chart : metricVolumeRef.chart ?? null,
    stats: isRecord(header.stats) ? header.stats : null,
    meta: isRecord(header.meta) ? header.meta : null,
  };
};

const withTimeoutFetch = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const resolveMetricRefHash = (ref: HullMetricVolumeRefV1): string => {
  const explicit = typeof ref.hash === "string" ? ref.hash.trim() : "";
  if (explicit.length > 0) return explicit;
  return createHash("sha256").update(ref.url.trim()).digest("hex");
};

const resolveMetricRefBaseUrl = (explicitBaseUrl?: string | null): string | null => {
  const candidate =
    explicitBaseUrl ??
    process.env.HULL_EXPORT_METRIC_REF_BASE_URL ??
    process.env.HULL_EXPORT_APP_BASE_URL ??
    process.env.OPTIX_RENDER_METRIC_REF_BASE_URL ??
    process.env.OPTIX_RENDER_APP_BASE_URL ??
    null;
  if (!candidate) return null;
  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized.replace(/\/+$/, "") : null;
};

export const resolveMetricRefUrl = (
  ref: HullMetricVolumeRefV1,
  explicitBaseUrl?: string | null,
): string | null => {
  const raw = ref.url.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!raw.startsWith("/")) return null;
  const base = resolveMetricRefBaseUrl(explicitBaseUrl);
  if (!base) return null;
  return `${base}${raw}`;
};

export const loadHullScientificSnapshot = async (
  ref: HullMetricVolumeRefV1,
  options?: { baseUrl?: string | null; timeoutMs?: number },
): Promise<HullScientificSnapshot> => {
  const resolvedUrl = resolveMetricRefUrl(ref, options?.baseUrl ?? null);
  if (!resolvedUrl) {
    throw new Error("metric_ref_url_unresolvable");
  }
  const timeoutMs = Math.max(5_000, Math.min(300_000, options?.timeoutMs ?? 45_000));
  const response = await withTimeoutFetch(
    resolvedUrl,
    {
      method: "GET",
      headers: {
        Accept: "application/octet-stream, application/x-helix-brick, application/json",
      },
    },
    timeoutMs,
  );
  if (!response.ok) {
    throw new Error(`metric_ref_http_${response.status}`);
  }
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  const decoded =
    contentType.includes("application/octet-stream") ||
    contentType.includes("application/x-helix-brick")
      ? decodeBinaryBrick(await response.arrayBuffer(), ref, resolvedUrl)
      : decodeJsonBrick((await response.json()) as unknown, ref, resolvedUrl);
  if (!decoded) {
    throw new Error("metric_ref_decode_failed");
  }
  return decoded;
};

export const hashFloat32 = (value: Float32Array): string => {
  const bytes = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  return createHash("sha256").update(bytes).digest("hex");
};

export const computeSnapshotChannelHashes = (
  snapshot: HullScientificSnapshot,
): Record<string, string> => {
  const hashes: Record<string, string> = {};
  const channelNames = Object.keys(snapshot.channels).sort((a, b) => a.localeCompare(b));
  for (const name of channelNames) {
    const channel = snapshot.channels[name];
    if (!(channel?.data instanceof Float32Array) || channel.data.length <= 0) continue;
    hashes[name] = hashFloat32(channel.data);
  }
  return hashes;
};

export const computeSnapshotConstraintRms = (
  snapshot: HullScientificSnapshot,
): number | null => {
  const h = snapshot.channels.H_constraint?.data;
  const mx = snapshot.channels.M_constraint_x?.data;
  const my = snapshot.channels.M_constraint_y?.data;
  const mz = snapshot.channels.M_constraint_z?.data;
  if (!h || !mx || !my || !mz) return null;
  const n = Math.min(h.length, mx.length, my.length, mz.length);
  if (n <= 0) return null;
  let sumSq = 0;
  let samples = 0;
  for (let i = 0; i < n; i += 1) {
    const hv = h[i] ?? 0;
    const mxv = mx[i] ?? 0;
    const myv = my[i] ?? 0;
    const mzv = mz[i] ?? 0;
    sumSq += hv * hv + mxv * mxv + myv * myv + mzv * mzv;
    samples += 4;
  }
  if (samples <= 0) return null;
  return Math.sqrt(sumSq / samples);
};

export const computeSnapshotSupportCoveragePct = (
  snapshot: HullScientificSnapshot,
): number | null => {
  const mask = snapshot.channels.tile_support_mask?.data;
  if (mask && mask.length > 0) {
    let covered = 0;
    for (let i = 0; i < mask.length; i += 1) {
      if ((mask[i] ?? 0) > 0) covered += 1;
    }
    return (covered / mask.length) * 100;
  }
  const hullSdf = snapshot.channels.hull_sdf?.data;
  if (!hullSdf || hullSdf.length <= 0) return null;
  let covered = 0;
  for (let i = 0; i < hullSdf.length; i += 1) {
    if ((hullSdf[i] ?? Number.POSITIVE_INFINITY) <= 0) covered += 1;
  }
  return (covered / hullSdf.length) * 100;
};
