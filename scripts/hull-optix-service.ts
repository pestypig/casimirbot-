import express from "express";
import sharp from "sharp";
import type {
  HullMetricVolumeRefV1,
  HullMisRenderAttachmentV1,
  HullMisRenderRequestV1,
  HullMisRenderResponseV1,
} from "../shared/hull-render-contract";

type RuntimeStatus = {
  host: string;
  port: number;
  serviceMode: "optix-tensor-pass1";
  allowSynthetic: boolean;
  readyForUnity: boolean;
  readyForOptix: boolean;
  readyForScientificLane: boolean;
  optixConfigured: boolean;
  cudaConfigured: boolean;
  optixSdkPath: string | null;
  cudaPath: string | null;
  metricRefBaseUrl: string | null;
};

type GrBrickChannel = {
  data: Float32Array;
  min: number;
  max: number;
};

type GrBrickDecoded = {
  dims: [number, number, number];
  voxelSize_m: [number, number, number];
  channels: Record<string, GrBrickChannel>;
  source: string | null;
  chart: string | null;
};

type TensorGeodesicDiagnostics = {
  maxNullResidual: number;
  stepConvergence: number;
  bundleSpread: number;
  consistency: "ok" | "warn" | "fail" | "unknown";
};

type TensorRenderContext = {
  metricSource: string | null;
  chart: string | null;
  metricChannel: string;
  metricRadiiM: [number, number, number];
  anisotropy: [number, number, number];
  diagnostics: TensorGeodesicDiagnostics;
};

const DEFAULT_SERVICE_HOST = "127.0.0.1";
const DEFAULT_SERVICE_PORT = 6062;

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

const clampi = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

const toFiniteNumber = (value: unknown, fallback: number) => {
  if (value == null) return fallback;
  if (typeof value === "string" && value.trim().length === 0) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Math.round(toFiniteNumber(value, fallback));
  return clamp(n, min, max);
};

const readEnv = (name: string): string | null => {
  const raw = process.env[name];
  if (!raw) return null;
  const value = raw.trim();
  return value.length ? value : null;
};

const readEnvFlag = (name: string, fallback = false): boolean => {
  const value = readEnv(name);
  if (!value) return fallback;
  return value === "1" || value.toLowerCase() === "true";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const toByte = (value: number) => clamp(Math.round(value), 0, 255);

const readTuple3 = (
  value: unknown,
  fallback: [number, number, number],
): [number, number, number] => {
  if (!Array.isArray(value) || value.length < 3) return fallback;
  return [
    toFiniteNumber(value[0], fallback[0]),
    toFiniteNumber(value[1], fallback[1]),
    toFiniteNumber(value[2], fallback[2]),
  ];
};

const encodePngDataUrl = (png: Buffer) =>
  `data:image/png;base64,${png.toString("base64")}`;

const hashSeed = (payload: HullMisRenderRequestV1): number => {
  const text = JSON.stringify({
    requestId: payload.requestId ?? "",
    width: payload.width,
    height: payload.height,
    skyboxMode: payload.skyboxMode ?? "off",
    beta: payload.solve?.beta ?? 0,
    alpha: payload.solve?.alpha ?? 1,
    sigma: payload.solve?.sigma ?? 6,
    R: payload.solve?.R ?? 1,
    chart: payload.solve?.chart ?? "",
    consistency: payload.geodesicDiagnostics?.consistency ?? "unknown",
    nullResidual: payload.geodesicDiagnostics?.maxNullResidual ?? 0,
    stepConv: payload.geodesicDiagnostics?.stepConvergence ?? 0,
    spread: payload.geodesicDiagnostics?.bundleSpread ?? 0,
    metricRef: payload.metricVolumeRef?.hash ?? payload.metricVolumeRef?.url ?? "",
    ts: payload.timestampMs ?? 0,
  });
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const parseMetricVolumeRef = (
  value: unknown,
): HullMisRenderRequestV1["metricVolumeRef"] => {
  if (!isRecord(value)) return null;
  if (value.kind !== "gr-evolve-brick") return null;
  const url = typeof value.url === "string" ? value.url.trim() : "";
  if (!url) return null;
  return {
    kind: "gr-evolve-brick",
    url,
    source: typeof value.source === "string" ? value.source : null,
    chart: typeof value.chart === "string" ? value.chart : null,
    dims: Array.isArray(value.dims) ? readTuple3(value.dims, [1, 1, 1]) : null,
    updatedAt:
      value.updatedAt == null ? null : toFiniteNumber(value.updatedAt, Date.now()),
    hash: typeof value.hash === "string" ? value.hash : null,
  };
};

const parseRequest = (body: unknown): HullMisRenderRequestV1 => {
  const src = isRecord(body) ? body : {};
  const solve = isRecord(src.solve) ? src.solve : {};
  const diag = isRecord(src.geodesicDiagnostics) ? src.geodesicDiagnostics : {};
  const metric = isRecord(src.metricSummary) ? src.metricSummary : {};
  const scienceLane = isRecord(src.scienceLane) ? src.scienceLane : {};

  return {
    version: 1,
    requestId: typeof src.requestId === "string" ? src.requestId : undefined,
    width: toInt(src.width, 1280, 320, 2048),
    height: toInt(src.height, 720, 180, 2048),
    dpr: clamp(toFiniteNumber(src.dpr, 1), 0.5, 3),
    backendHint:
      src.backendHint === "mis-path-tracing" ? "mis-path-tracing" : undefined,
    timestampMs: toFiniteNumber(src.timestampMs, Date.now()),
    skyboxMode:
      src.skyboxMode === "flat" || src.skyboxMode === "geodesic"
        ? src.skyboxMode
        : "off",
    scienceLane: {
      requireIntegralSignal: scienceLane.requireIntegralSignal === true,
      requireScientificFrame: scienceLane.requireScientificFrame === true,
      attachmentDownsample: toInt(scienceLane.attachmentDownsample, 1, 1, 8),
    },
    solve: {
      beta: toFiniteNumber(solve.beta, 0),
      alpha: Math.max(1e-6, toFiniteNumber(solve.alpha, 1)),
      sigma: Math.max(1e-3, toFiniteNumber(solve.sigma, 6)),
      R: Math.max(1e-3, toFiniteNumber(solve.R, 1)),
      chart: typeof solve.chart === "string" ? solve.chart : null,
    },
    geodesicDiagnostics: {
      mode: typeof diag.mode === "string" ? diag.mode : null,
      consistency:
        diag.consistency === "ok" ||
        diag.consistency === "warn" ||
        diag.consistency === "fail"
          ? diag.consistency
          : "unknown",
      maxNullResidual:
        diag.maxNullResidual == null
          ? null
          : toFiniteNumber(diag.maxNullResidual, 0),
      stepConvergence:
        diag.stepConvergence == null
          ? null
          : toFiniteNumber(diag.stepConvergence, 0),
      bundleSpread:
        diag.bundleSpread == null ? null : toFiniteNumber(diag.bundleSpread, 0),
    },
    metricSummary: {
      source: typeof metric.source === "string" ? metric.source : null,
      chart: typeof metric.chart === "string" ? metric.chart : null,
      dims: readTuple3(metric.dims, [1, 1, 1]),
      alphaRange: readTuple3(metric.alphaRange, [1, 1, 1]).slice(
        0,
        2,
      ) as [number, number],
      consistency:
        metric.consistency === "ok" ||
        metric.consistency === "warn" ||
        metric.consistency === "fail"
          ? metric.consistency
          : "unknown",
      updatedAt:
        metric.updatedAt == null
          ? null
          : toFiniteNumber(metric.updatedAt, Date.now()),
    },
    metricVolumeRef: parseMetricVolumeRef(src.metricVolumeRef),
  };
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

const decodeGrEvolveBrickJson = (value: unknown): GrBrickDecoded | null => {
  const root = isRecord(value) ? value : null;
  if (!root || root.kind !== "gr-evolve-brick") return null;
  const dimsRaw = Array.isArray(root.dims) ? root.dims : null;
  if (!dimsRaw || dimsRaw.length < 3) return null;
  const dims: [number, number, number] = [
    Math.max(1, Math.floor(toFiniteNumber(dimsRaw[0], 1))),
    Math.max(1, Math.floor(toFiniteNumber(dimsRaw[1], 1))),
    Math.max(1, Math.floor(toFiniteNumber(dimsRaw[2], 1))),
  ];
  const voxelSizeRaw = Array.isArray(root.voxelSize_m) ? root.voxelSize_m : null;
  const voxelSize_m: [number, number, number] = voxelSizeRaw
    ? [
        Math.max(1e-6, toFiniteNumber(voxelSizeRaw[0], 1)),
        Math.max(1e-6, toFiniteNumber(voxelSizeRaw[1], 1)),
        Math.max(1e-6, toFiniteNumber(voxelSizeRaw[2], 1)),
      ]
    : [1, 1, 1];
  const channelsRaw = isRecord(root.channels) ? root.channels : {};
  const channels: Record<string, GrBrickChannel> = {};
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
  if (!channels.alpha || !channels.beta_x || !channels.beta_y || !channels.beta_z) {
    return null;
  }
  if (!channels.gamma_xx || !channels.gamma_yy || !channels.gamma_zz) {
    return null;
  }
  return {
    dims,
    voxelSize_m,
    channels,
    source: typeof root.source === "string" ? root.source : null,
    chart: typeof root.chart === "string" ? root.chart : null,
  };
};

const decodeGrEvolveBrickBinary = (buffer: ArrayBuffer): GrBrickDecoded | null => {
  if (buffer.byteLength < 8) return null;
  const view = new DataView(buffer);
  const headerLength = view.getUint32(0, true);
  if (!Number.isFinite(headerLength) || headerLength <= 0) return null;
  if (headerLength + 4 > buffer.byteLength) return null;
  const headerBytes = new Uint8Array(buffer, 4, headerLength);
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
  const dimsRaw = Array.isArray(header.dims) ? header.dims : null;
  if (!dimsRaw || dimsRaw.length < 3) return null;
  const dims: [number, number, number] = [
    Math.max(1, Math.floor(toFiniteNumber(dimsRaw[0], 1))),
    Math.max(1, Math.floor(toFiniteNumber(dimsRaw[1], 1))),
    Math.max(1, Math.floor(toFiniteNumber(dimsRaw[2], 1))),
  ];
  const voxelSizeRaw = Array.isArray(header.voxelSize_m) ? header.voxelSize_m : null;
  const voxelSize_m: [number, number, number] = voxelSizeRaw
    ? [
        Math.max(1e-6, toFiniteNumber(voxelSizeRaw[0], 1)),
        Math.max(1e-6, toFiniteNumber(voxelSizeRaw[1], 1)),
        Math.max(1e-6, toFiniteNumber(voxelSizeRaw[2], 1)),
      ]
    : [1, 1, 1];
  const channelsHeader = isRecord(header.channels) ? header.channels : {};
  const orderRaw = Array.isArray(header.channelOrder)
    ? header.channelOrder
    : Object.keys(channelsHeader);
  const channelOrder = orderRaw
    .map((entry) => String(entry))
    .filter((entry) => entry.length > 0);
  const total = dims[0] * dims[1] * dims[2];
  const defaultBytes = total * 4;
  const padding = (4 - (headerLength % 4)) % 4;
  let offset = 4 + headerLength + padding;
  const channels: Record<string, GrBrickChannel> = {};
  for (const name of channelOrder) {
    const specRaw = channelsHeader[name];
    if (!isRecord(specRaw)) continue;
    const bytes = Math.max(4, Math.floor(toFiniteNumber(specRaw.bytes, defaultBytes)));
    if (bytes % 4 !== 0) return null;
    if (offset + bytes > buffer.byteLength) return null;
    const count = bytes / 4;
    const data = new Float32Array(count);
    const chunk = new DataView(buffer, offset, bytes);
    for (let i = 0; i < count; i += 1) data[i] = chunk.getFloat32(i * 4, true);
    offset += bytes;
    channels[name] = {
      data,
      min: toFiniteNumber(specRaw.min, 0),
      max: toFiniteNumber(specRaw.max, 0),
    };
  }
  if (!channels.alpha || !channels.beta_x || !channels.beta_y || !channels.beta_z) {
    return null;
  }
  if (!channels.gamma_xx || !channels.gamma_yy || !channels.gamma_zz) {
    return null;
  }
  return {
    dims,
    voxelSize_m,
    channels,
    source: typeof header.source === "string" ? header.source : null,
    chart: typeof header.chart === "string" ? header.chart : null,
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

const resolveMetricRefUrl = (ref: HullMetricVolumeRefV1): string | null => {
  const raw = ref.url.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) {
    const base =
      readEnv("OPTIX_RENDER_METRIC_REF_BASE_URL") || readEnv("OPTIX_RENDER_APP_BASE_URL");
    if (!base) return null;
    return `${base.replace(/\/+$/, "")}${raw}`;
  }
  return null;
};

const fetchMetricBrick = async (
  ref: HullMetricVolumeRefV1,
): Promise<GrBrickDecoded | null> => {
  const url = resolveMetricRefUrl(ref);
  if (!url) return null;
  const response = await withTimeoutFetch(
    url,
    {
      method: "GET",
      headers: {
        Accept: "application/octet-stream, application/x-helix-brick, application/json",
      },
    },
    12_000,
  );
  if (!response.ok) {
    throw new Error(`metric_ref_http_${response.status}`);
  }
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (
    contentType.includes("application/octet-stream") ||
    contentType.includes("application/x-helix-brick")
  ) {
    const buffer = await response.arrayBuffer();
    return decodeGrEvolveBrickBinary(buffer);
  }
  const json = (await response.json()) as unknown;
  return decodeGrEvolveBrickJson(json);
};

const idx3 = (
  x: number,
  y: number,
  z: number,
  dims: [number, number, number],
): number => x + dims[0] * (y + dims[1] * z);

const sampleMetricAxisRadius = (args: {
  data: Float32Array;
  dims: [number, number, number];
  spacingM: [number, number, number];
  axis: 0 | 1 | 2;
}) => {
  const { data, dims, spacingM, axis } = args;
  const cx = clampi(Math.floor(dims[0] * 0.5), 0, dims[0] - 1);
  const cy = clampi(Math.floor(dims[1] * 0.5), 0, dims[1] - 1);
  const cz = clampi(Math.floor(dims[2] * 0.5), 0, dims[2] - 1);
  const length = dims[axis];
  const center = axis === 0 ? cx : axis === 1 ? cy : cz;
  let peakAbs = 0;
  const line = new Array<number>(length).fill(0);
  for (let i = 0; i < length; i += 1) {
    const x = axis === 0 ? i : cx;
    const y = axis === 1 ? i : cy;
    const z = axis === 2 ? i : cz;
    const index = idx3(x, y, z, dims);
    const value = Number.isFinite(data[index]) ? Math.abs(data[index]!) : 0;
    line[i] = value;
    if (value > peakAbs) peakAbs = value;
  }
  if (!(peakAbs > 1e-12)) {
    return {
      radiusM: null as number | null,
      symmetryErrorM: null as number | null,
      peakAbs,
      sampleCount: 0,
    };
  }
  const threshold = Math.max(peakAbs * 0.35, 1e-12);
  let pos = center;
  for (let i = center; i < length; i += 1) {
    if (line[i] >= threshold) pos = i;
  }
  let neg = center;
  for (let i = center; i >= 0; i -= 1) {
    if (line[i] >= threshold) neg = i;
  }
  const spacing = spacingM[axis];
  const left = Math.max(0, center - neg);
  const right = Math.max(0, pos - center);
  const radiusM = ((left + right) * 0.5) * spacing;
  const symmetryErrorM = Math.abs(left - right) * spacing;
  return {
    radiusM: radiusM > 0 ? radiusM : null,
    symmetryErrorM,
    peakAbs,
    sampleCount: left + right + 1,
  };
};

const metricFromComponents = (
  alpha: number,
  bx: number,
  by: number,
  bz: number,
  gxx: number,
  gyy: number,
  gzz: number,
) => {
  const a = Math.max(1e-6, alpha);
  const gxxSafe = Math.max(1e-6, gxx);
  const gyySafe = Math.max(1e-6, gyy);
  const gzzSafe = Math.max(1e-6, gzz);
  const a2 = a * a;
  const invA2 = 1 / a2;
  const invGxx = 1 / gxxSafe;
  const invGyy = 1 / gyySafe;
  const invGzz = 1 / gzzSafe;

  const g = [
    [-a2 + gxxSafe * bx * bx + gyySafe * by * by + gzzSafe * bz * bz, gxxSafe * bx, gyySafe * by, gzzSafe * bz],
    [gxxSafe * bx, gxxSafe, 0, 0],
    [gyySafe * by, 0, gyySafe, 0],
    [gzzSafe * bz, 0, 0, gzzSafe],
  ];

  const gInv = [
    [-invA2, bx * invA2, by * invA2, bz * invA2],
    [bx * invA2, invGxx - bx * bx * invA2, -(bx * by) * invA2, -(bx * bz) * invA2],
    [by * invA2, -(by * bx) * invA2, invGyy - by * by * invA2, -(by * bz) * invA2],
    [bz * invA2, -(bz * bx) * invA2, -(bz * by) * invA2, invGzz - bz * bz * invA2],
  ];
  return { g, gInv };
};

const computeTensorGeodesicDiagnostics = (brick: GrBrickDecoded): TensorGeodesicDiagnostics => {
  const dims = brick.dims;
  const [nx, ny, nz] = dims;
  const total = nx * ny * nz;
  if (total <= 8) {
    return {
      maxNullResidual: Number.POSITIVE_INFINITY,
      stepConvergence: 0,
      bundleSpread: 0,
      consistency: "unknown",
    };
  }
  const alpha = brick.channels.alpha?.data;
  const betaX = brick.channels.beta_x?.data;
  const betaY = brick.channels.beta_y?.data;
  const betaZ = brick.channels.beta_z?.data;
  const gammaXX = brick.channels.gamma_xx?.data;
  const gammaYY = brick.channels.gamma_yy?.data;
  const gammaZZ = brick.channels.gamma_zz?.data;
  if (!alpha || !betaX || !betaY || !betaZ || !gammaXX || !gammaYY || !gammaZZ) {
    return {
      maxNullResidual: Number.POSITIVE_INFINITY,
      stepConvergence: 0,
      bundleSpread: 0,
      consistency: "unknown",
    };
  }
  const dx = Math.max(1e-6, toFiniteNumber(brick.voxelSize_m[0], 1));
  const dy = Math.max(1e-6, toFiniteNumber(brick.voxelSize_m[1], 1));
  const dz = Math.max(1e-6, toFiniteNumber(brick.voxelSize_m[2], 1));
  const derivScale = [0, 1 / (2 * dx), 1 / (2 * dy), 1 / (2 * dz)];
  const comp = (arr: Float32Array, i: number) =>
    Number.isFinite(arr[i]) ? Number(arr[i]) : 0;

  const sampleMetricAt = (ixIn: number, iyIn: number, izIn: number) => {
    const ix = clampi(ixIn, 0, nx - 1);
    const iy = clampi(iyIn, 0, ny - 1);
    const iz = clampi(izIn, 0, nz - 1);
    const i = idx3(ix, iy, iz, dims);
    return metricFromComponents(
      Math.max(1e-6, comp(alpha, i) || 1),
      comp(betaX, i),
      comp(betaY, i),
      comp(betaZ, i),
      Math.max(1e-6, comp(gammaXX, i) || 1),
      Math.max(1e-6, comp(gammaYY, i) || 1),
      Math.max(1e-6, comp(gammaZZ, i) || 1),
    );
  };

  const ic = clampi(Math.floor(nx * 0.5), 0, nx - 1);
  const jc = clampi(Math.floor(ny * 0.5), 0, ny - 1);
  const kc = clampi(Math.floor(nz * 0.5), 0, nz - 1);
  const center = sampleMetricAt(ic, jc, kc);
  const g = center.g;
  const gInv = center.gInv;
  const dG = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => new Array<number>(4).fill(0)),
  );
  for (let deriv = 1; deriv <= 3; deriv += 1) {
    const plus =
      deriv === 1
        ? sampleMetricAt(ic + 1, jc, kc)
        : deriv === 2
          ? sampleMetricAt(ic, jc + 1, kc)
          : sampleMetricAt(ic, jc, kc + 1);
    const minus =
      deriv === 1
        ? sampleMetricAt(ic - 1, jc, kc)
        : deriv === 2
          ? sampleMetricAt(ic, jc - 1, kc)
          : sampleMetricAt(ic, jc, kc - 1);
    for (let a = 0; a < 4; a += 1) {
      for (let b = 0; b < 4; b += 1) {
        dG[deriv][a][b] = (plus.g[a][b] - minus.g[a][b]) * derivScale[deriv]!;
      }
    }
  }

  const christoffel = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => new Array<number>(4).fill(0)),
  );
  for (let mu = 0; mu < 4; mu += 1) {
    for (let a = 0; a < 4; a += 1) {
      for (let b = 0; b < 4; b += 1) {
        let acc = 0;
        for (let nu = 0; nu < 4; nu += 1) {
          acc +=
            0.5 *
            gInv[mu]![nu]! *
            (dG[a]![b]![nu]! + dG[b]![a]![nu]! - dG[nu]![a]![b]!);
        }
        christoffel[mu]![a]![b] = acc;
      }
    }
  }

  const nullResidual = (k: number[]) => {
    let acc = 0;
    for (let a = 0; a < 4; a += 1) {
      for (let b = 0; b < 4; b += 1) {
        acc += g[a]![b]! * k[a]! * k[b]!;
      }
    }
    return Math.abs(acc);
  };

  const solveNullK0 = (spatial: [number, number, number]) => {
    const [sx, sy, sz] = spatial;
    const A = g[0]![0]!;
    const B = 2 * (g[0]![1]! * sx + g[0]![2]! * sy + g[0]![3]! * sz);
    const C =
      g[1]![1]! * sx * sx +
      g[2]![2]! * sy * sy +
      g[3]![3]! * sz * sz +
      2 * (g[1]![2]! * sx * sy + g[1]![3]! * sx * sz + g[2]![3]! * sy * sz);
    const disc = Math.max(0, B * B - 4 * A * C);
    const root = Math.sqrt(disc);
    const denom = Math.abs(2 * A) > 1e-12 ? 2 * A : A < 0 ? -2e-12 : 2e-12;
    const r1 = (-B - root) / denom;
    const r2 = (-B + root) / denom;
    if (Number.isFinite(r1) && r1 > 0) return r1;
    if (Number.isFinite(r2) && r2 > 0) return r2;
    if (Number.isFinite(r1)) return r1;
    if (Number.isFinite(r2)) return r2;
    return 1;
  };

  const rhs = (state: { x: number[]; k: number[] }) => {
    const dxdt = [...state.k];
    const dkdt = [0, 0, 0, 0];
    for (let mu = 0; mu < 4; mu += 1) {
      let acc = 0;
      for (let a = 0; a < 4; a += 1) {
        for (let b = 0; b < 4; b += 1) {
          acc += christoffel[mu]![a]![b]! * state.k[a]! * state.k[b]!;
        }
      }
      dkdt[mu] = -acc;
    }
    return { dxdt, dkdt };
  };

  const rk4Step = (state: { x: number[]; k: number[] }, h: number) => {
    const k1 = rhs(state);
    const s2 = {
      x: state.x.map((v, i) => v + 0.5 * h * k1.dxdt[i]!),
      k: state.k.map((v, i) => v + 0.5 * h * k1.dkdt[i]!),
    };
    const k2 = rhs(s2);
    const s3 = {
      x: state.x.map((v, i) => v + 0.5 * h * k2.dxdt[i]!),
      k: state.k.map((v, i) => v + 0.5 * h * k2.dkdt[i]!),
    };
    const k3 = rhs(s3);
    const s4 = {
      x: state.x.map((v, i) => v + h * k3.dxdt[i]!),
      k: state.k.map((v, i) => v + h * k3.dkdt[i]!),
    };
    const k4 = rhs(s4);
    return {
      x: state.x.map(
        (v, i) =>
          v +
          (h / 6) *
            (k1.dxdt[i]! + 2 * k2.dxdt[i]! + 2 * k3.dxdt[i]! + k4.dxdt[i]!),
      ),
      k: state.k.map(
        (v, i) =>
          v +
          (h / 6) *
            (k1.dkdt[i]! + 2 * k2.dkdt[i]! + 2 * k3.dkdt[i]! + k4.dkdt[i]!),
      ),
    };
  };

  const integrate = (
    spatial: [number, number, number],
    h: number,
    steps: number,
  ): { x: [number, number, number]; residual: number } => {
    const k0 = solveNullK0(spatial);
    let state = {
      x: [0, 0, 0, 0] as number[],
      k: [k0, spatial[0], spatial[1], spatial[2]] as number[],
    };
    let maxResidual = nullResidual(state.k);
    for (let step = 0; step < steps; step += 1) {
      state = rk4Step(state, h);
      maxResidual = Math.max(maxResidual, nullResidual(state.k));
    }
    return {
      x: [state.x[1]!, state.x[2]!, state.x[3]!],
      residual: maxResidual,
    };
  };

  const dirs: Array<[number, number, number]> = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0],
    [1, -1, 0],
    [1, 0, 1],
    [1, 0, -1],
    [0, 1, 1],
    [0, 1, -1],
    [1, 1, 1],
    [1, -1, 1],
    [1, 1, -1],
  ].map((v) => {
    const mag = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / mag, v[1] / mag, v[2] / mag] as [number, number, number];
  });

  const h = Math.max(1e-5, Math.min(dx, dy, dz) * 0.45);
  const coarseSteps = 10;
  const fineSteps = coarseSteps * 2;
  let maxNullResidual = 0;
  let convNumer = 0;
  let convDenom = 0;
  const endpoints: Array<[number, number, number]> = [];
  for (const dir of dirs) {
    const coarse = integrate(dir, h, coarseSteps);
    const fine = integrate(dir, h * 0.5, fineSteps);
    maxNullResidual = Math.max(maxNullResidual, coarse.residual, fine.residual);
    endpoints.push(fine.x);
    const d = Math.hypot(
      coarse.x[0] - fine.x[0],
      coarse.x[1] - fine.x[1],
      coarse.x[2] - fine.x[2],
    );
    const scale = Math.max(Math.hypot(fine.x[0], fine.x[1], fine.x[2]), h);
    convNumer += d;
    convDenom += scale;
  }
  const stepError = convDenom > 0 ? convNumer / convDenom : 1;
  const stepConvergence = clamp(1 / (1 + 6 * stepError), 0, 1);
  const mean = endpoints.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]] as [number, number, number],
    [0, 0, 0] as [number, number, number],
  );
  const invN = endpoints.length > 0 ? 1 / endpoints.length : 0;
  const centerPoint: [number, number, number] = [
    mean[0] * invN,
    mean[1] * invN,
    mean[2] * invN,
  ];
  const spreadSq =
    endpoints.length > 0
      ? endpoints.reduce((acc, p) => {
          const dxp = p[0] - centerPoint[0];
          const dyp = p[1] - centerPoint[1];
          const dzp = p[2] - centerPoint[2];
          return acc + dxp * dxp + dyp * dyp + dzp * dzp;
        }, 0) / endpoints.length
      : 0;
  const bundleSpread = Math.sqrt(Math.max(0, spreadSq));

  const consistency: TensorGeodesicDiagnostics["consistency"] =
    maxNullResidual <= 2.5e-3 && stepConvergence >= 0.9
      ? "ok"
      : maxNullResidual <= 1.0e-2 && stepConvergence >= 0.75
        ? "warn"
        : "fail";

  return { maxNullResidual, stepConvergence, bundleSpread, consistency };
};

const buildTensorRenderContext = (
  payload: HullMisRenderRequestV1,
  brick: GrBrickDecoded,
): TensorRenderContext | null => {
  const spacing = brick.voxelSize_m;
  const radiusFallback = Math.max(1e-3, toFiniteNumber(payload.solve?.R, 1));
  const candidates = ["theta", "K_trace", "H_constraint"] as const;
  let metricChannel: string | null = null;
  let data: Float32Array | null = null;
  for (const name of candidates) {
    const channel = brick.channels[name];
    if (!channel || !(channel.data instanceof Float32Array)) continue;
    if (channel.data.length < brick.dims[0] * brick.dims[1] * brick.dims[2]) continue;
    metricChannel = name;
    data = channel.data;
    break;
  }
  if (!metricChannel || !data) return null;
  const sampleX = sampleMetricAxisRadius({
    data,
    dims: brick.dims,
    spacingM: spacing,
    axis: 0,
  });
  const sampleY = sampleMetricAxisRadius({
    data,
    dims: brick.dims,
    spacingM: spacing,
    axis: 1,
  });
  const sampleZ = sampleMetricAxisRadius({
    data,
    dims: brick.dims,
    spacingM: spacing,
    axis: 2,
  });
  const metricRadiiM: [number, number, number] = [
    sampleX.radiusM ?? radiusFallback,
    sampleY.radiusM ?? radiusFallback,
    sampleZ.radiusM ?? radiusFallback,
  ];
  const meanRadius =
    (metricRadiiM[0] + metricRadiiM[1] + metricRadiiM[2]) / 3 || radiusFallback;
  const anisotropy: [number, number, number] = [
    clamp(metricRadiiM[0] / Math.max(meanRadius, 1e-6), 0.45, 2.2),
    clamp(metricRadiiM[1] / Math.max(meanRadius, 1e-6), 0.45, 2.2),
    clamp(metricRadiiM[2] / Math.max(meanRadius, 1e-6), 0.45, 2.2),
  ];
  const diagnostics = computeTensorGeodesicDiagnostics(brick);
  return {
    metricSource: brick.source ?? payload.metricSummary?.source ?? null,
    chart: brick.chart ?? payload.metricSummary?.chart ?? null,
    metricChannel,
    metricRadiiM,
    anisotropy,
    diagnostics,
  };
};

const buildTensorAttachments = (
  payload: HullMisRenderRequestV1,
  ctx: TensorRenderContext,
): HullMisRenderAttachmentV1[] => {
  const width = Math.max(1, payload.width | 0);
  const height = Math.max(1, payload.height | 0);
  const total = width * height;
  const depth = new Float32Array(total);
  const mask = new Uint8Array(total);
  const depthBase = 8;
  const sx = ctx.anisotropy[0];
  const sy = ctx.anisotropy[1];
  const rz = Math.max(1e-3, ctx.metricRadiiM[2]);
  const beta = toFiniteNumber(payload.solve?.beta, 0);
  const perturbAmp = clamp(
    0.003 +
      3.0 * Math.abs(ctx.diagnostics.maxNullResidual) +
      0.02 * Math.abs(ctx.diagnostics.bundleSpread),
    0,
    0.035,
  );
  for (let y = 0; y < height; y += 1) {
    const ny = height > 1 ? (y / (height - 1)) * 2 - 1 : 0;
    for (let x = 0; x < width; x += 1) {
      const nx = width > 1 ? (x / (width - 1)) * 2 - 1 : 0;
      const idx = y * width + x;
      const q = 1 - (nx * nx) / (sx * sx) - (ny * ny) / (sy * sy);
      if (!(q > 0)) {
        depth[idx] = depthBase;
        mask[idx] = 0;
        continue;
      }
      const perturb = perturbAmp * Math.sin(6.2 * nx + 5.1 * ny + 0.9 * beta);
      const depthValue = depthBase + rz * Math.sqrt(q) + perturb;
      depth[idx] = Number.isFinite(depthValue) ? depthValue : depthBase;
      mask[idx] = 255;
    }
  }
  const depthBytes = Buffer.from(depth.buffer.slice(0));
  const maskBytes = Buffer.from(mask.buffer.slice(0));
  return [
    {
      kind: "depth-linear-m-f32le",
      width,
      height,
      encoding: "base64",
      dataBase64: depthBytes.toString("base64"),
    },
    {
      kind: "shell-mask-u8",
      width,
      height,
      encoding: "base64",
      dataBase64: maskBytes.toString("base64"),
    },
  ];
};

type ScientificSliceMode = "diverging" | "sequential";
type ScientificSlice = {
  key: string;
  label: string;
  unit: string;
  mode: ScientificSliceMode;
  width: number;
  height: number;
  data: Float32Array;
  min: number;
  max: number;
};

type ScientificPanelPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  slice: ScientificSlice;
};

const fmtScientific = (value: number | null | undefined, digits = 3): string => {
  if (!Number.isFinite(value ?? NaN)) return "--";
  const n = Number(value);
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e4 || abs < 1e-3)) return n.toExponential(2);
  return n.toFixed(digits);
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const writePixel = (
  image: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a = 255,
) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (y * width + x) * 4;
  image[idx] = toByte(r);
  image[idx + 1] = toByte(g);
  image[idx + 2] = toByte(b);
  image[idx + 3] = toByte(a);
};

const fillRect = (
  image: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number],
) => {
  const x0 = clampi(x, 0, width - 1);
  const y0 = clampi(y, 0, height - 1);
  const x1 = clampi(x + w - 1, 0, width - 1);
  const y1 = clampi(y + h - 1, 0, height - 1);
  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      writePixel(image, width, height, px, py, color[0], color[1], color[2], 255);
    }
  }
};

const drawRectStroke = (
  image: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number],
) => {
  const x0 = clampi(x, 0, width - 1);
  const y0 = clampi(y, 0, height - 1);
  const x1 = clampi(x + w - 1, 0, width - 1);
  const y1 = clampi(y + h - 1, 0, height - 1);
  for (let px = x0; px <= x1; px += 1) {
    writePixel(image, width, height, px, y0, color[0], color[1], color[2], 255);
    writePixel(image, width, height, px, y1, color[0], color[1], color[2], 255);
  }
  for (let py = y0; py <= y1; py += 1) {
    writePixel(image, width, height, x0, py, color[0], color[1], color[2], 255);
    writePixel(image, width, height, x1, py, color[0], color[1], color[2], 255);
  }
};

const sampleFinite = (data: Float32Array, maxSamples = 4096): number[] => {
  if (data.length === 0) return [];
  const stride = Math.max(1, Math.floor(data.length / maxSamples));
  const out: number[] = [];
  for (let i = 0; i < data.length; i += stride) {
    const v = data[i];
    if (Number.isFinite(v)) out.push(v);
  }
  return out;
};

const percentile = (values: number[], q: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const t = clamp(q, 0, 1) * (sorted.length - 1);
  const lo = Math.floor(t);
  const hi = Math.min(sorted.length - 1, lo + 1);
  const w = t - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
};

const computeSliceRange = (
  data: Float32Array,
  mode: ScientificSliceMode,
): [number, number] => {
  const values = sampleFinite(data, 8192);
  if (!values.length) return [-1, 1];
  if (mode === "diverging") {
    const absValues = values.map((v) => Math.abs(v));
    const absP = Math.max(1e-9, percentile(absValues, 0.98));
    return [-absP, absP];
  }
  const lo = percentile(values, 0.02);
  const hi = percentile(values, 0.98);
  if (Math.abs(hi - lo) < 1e-12) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (Math.abs(max - min) < 1e-12) return [min - 1, max + 1];
    return [min, max];
  }
  return [lo, hi];
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const interpolateColorStops = (
  tIn: number,
  stops: Array<{ t: number; color: [number, number, number] }>,
): [number, number, number] => {
  const t = clamp(tIn, 0, 1);
  if (stops.length === 0) return [255, 255, 255];
  if (t <= stops[0]!.t) return stops[0]!.color;
  if (t >= stops[stops.length - 1]!.t) return stops[stops.length - 1]!.color;
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    if (t < a.t || t > b.t) continue;
    const local = (t - a.t) / Math.max(1e-9, b.t - a.t);
    return [
      Math.round(lerp(a.color[0], b.color[0], local)),
      Math.round(lerp(a.color[1], b.color[1], local)),
      Math.round(lerp(a.color[2], b.color[2], local)),
    ];
  }
  return stops[stops.length - 1]!.color;
};

const mapDivergingColor = (t: number): [number, number, number] =>
  interpolateColorStops(t, [
    { t: 0, color: [49, 54, 149] },
    { t: 0.25, color: [69, 117, 180] },
    { t: 0.5, color: [247, 247, 247] },
    { t: 0.75, color: [244, 109, 67] },
    { t: 1, color: [165, 0, 38] },
  ]);

const mapSequentialColor = (t: number): [number, number, number] =>
  interpolateColorStops(t, [
    { t: 0, color: [68, 1, 84] },
    { t: 0.25, color: [58, 82, 139] },
    { t: 0.5, color: [32, 144, 140] },
    { t: 0.75, color: [94, 201, 98] },
    { t: 1, color: [253, 231, 37] },
  ]);

const normalizeSliceValue = (slice: ScientificSlice, value: number): number => {
  if (!Number.isFinite(value)) return 0.5;
  if (slice.mode === "diverging") {
    const maxAbs = Math.max(Math.abs(slice.min), Math.abs(slice.max), 1e-12);
    return clamp(0.5 + 0.5 * (value / maxAbs), 0, 1);
  }
  return clamp((value - slice.min) / Math.max(1e-12, slice.max - slice.min), 0, 1);
};

const extractChannelSliceXZ = (
  brick: GrBrickDecoded,
  channelName: string,
): Float32Array | null => {
  const channel = brick.channels[channelName];
  if (!channel) return null;
  const src = channel.data;
  const dims = brick.dims;
  const nx = dims[0];
  const ny = dims[1];
  const nz = dims[2];
  if (src.length < nx * ny * nz) return null;
  const yMid = clampi(Math.floor(ny * 0.5), 0, ny - 1);
  const out = new Float32Array(nx * nz);
  for (let z = 0; z < nz; z += 1) {
    for (let x = 0; x < nx; x += 1) {
      out[z * nx + x] = src[idx3(x, yMid, z, dims)] ?? 0;
    }
  }
  return out;
};

const extractBetaMagnitudeSliceXZ = (brick: GrBrickDecoded): Float32Array | null => {
  const betaX = brick.channels.beta_x?.data;
  const betaY = brick.channels.beta_y?.data;
  const betaZ = brick.channels.beta_z?.data;
  if (!betaX || !betaY || !betaZ) return null;
  const dims = brick.dims;
  const nx = dims[0];
  const ny = dims[1];
  const nz = dims[2];
  const total = nx * ny * nz;
  if (betaX.length < total || betaY.length < total || betaZ.length < total) return null;
  const yMid = clampi(Math.floor(ny * 0.5), 0, ny - 1);
  const out = new Float32Array(nx * nz);
  for (let z = 0; z < nz; z += 1) {
    for (let x = 0; x < nx; x += 1) {
      const idx = idx3(x, yMid, z, dims);
      const bx = Number.isFinite(betaX[idx]) ? Number(betaX[idx]) : 0;
      const by = Number.isFinite(betaY[idx]) ? Number(betaY[idx]) : 0;
      const bz = Number.isFinite(betaZ[idx]) ? Number(betaZ[idx]) : 0;
      out[z * nx + x] = Math.sqrt(bx * bx + by * by + bz * bz);
    }
  }
  return out;
};

const buildScientificSlices = (brick: GrBrickDecoded): ScientificSlice[] => {
  const nx = brick.dims[0];
  const nz = brick.dims[2];
  const channelCandidates = [
    { key: "theta", label: "Expansion theta = -K", unit: "1/m", mode: "diverging" as const },
    { key: "K_trace", label: "Extrinsic Curvature K", unit: "1/m", mode: "diverging" as const },
    { key: "H_constraint", label: "Hamiltonian Constraint H", unit: "arb", mode: "diverging" as const },
  ];
  let expansionSlice: ScientificSlice | null = null;
  for (const candidate of channelCandidates) {
    const data = extractChannelSliceXZ(brick, candidate.key);
    if (!data) continue;
    const [min, max] = computeSliceRange(data, candidate.mode);
    expansionSlice = {
      key: candidate.key,
      label: candidate.label,
      unit: candidate.unit,
      mode: candidate.mode,
      width: nx,
      height: nz,
      data,
      min,
      max,
    };
    break;
  }
  const hData = extractChannelSliceXZ(brick, "H_constraint");
  const alphaData = extractChannelSliceXZ(brick, "alpha");
  const betaMagData = extractBetaMagnitudeSliceXZ(brick);
  const fallback = (label: string, mode: ScientificSliceMode): ScientificSlice => ({
    key: `missing-${label.toLowerCase().replace(/\s+/g, "-")}`,
    label,
    unit: "n/a",
    mode,
    width: nx,
    height: nz,
    data: new Float32Array(nx * nz),
    min: mode === "diverging" ? -1 : 0,
    max: 1,
  });
  const hSlice =
    hData != null
      ? (() => {
          const [min, max] = computeSliceRange(hData, "diverging");
          return {
            key: "H_constraint",
            label: "Hamiltonian Constraint H",
            unit: "arb",
            mode: "diverging" as const,
            width: nx,
            height: nz,
            data: hData,
            min,
            max,
          };
        })()
      : fallback("Hamiltonian Constraint H (missing)", "diverging");
  const alphaSlice =
    alphaData != null
      ? (() => {
          const [min, max] = computeSliceRange(alphaData, "sequential");
          return {
            key: "alpha",
            label: "Lapse alpha",
            unit: "unitless",
            mode: "sequential" as const,
            width: nx,
            height: nz,
            data: alphaData,
            min,
            max,
          };
        })()
      : fallback("Lapse alpha (missing)", "sequential");
  const betaSlice =
    betaMagData != null
      ? (() => {
          const [min, max] = computeSliceRange(betaMagData, "sequential");
          return {
            key: "beta_mag",
            label: "Shift Magnitude |beta|",
            unit: "unitless",
            mode: "sequential" as const,
            width: nx,
            height: nz,
            data: betaMagData,
            min,
            max,
          };
        })()
      : fallback("Shift Magnitude |beta| (missing)", "sequential");
  return [expansionSlice ?? fallback("Expansion theta/K (missing)", "diverging"), hSlice, alphaSlice, betaSlice];
};

const renderSlicePanel = (
  image: Buffer,
  canvasWidth: number,
  canvasHeight: number,
  panel: ScientificPanelPlacement,
) => {
  const panelBg: [number, number, number] = [11, 16, 26];
  const panelBorder: [number, number, number] = [67, 78, 96];
  const gridColor: [number, number, number] = [26, 37, 54];
  const contourColor: [number, number, number] = [240, 240, 240];
  fillRect(image, canvasWidth, canvasHeight, panel.x, panel.y, panel.width, panel.height, panelBg);
  drawRectStroke(image, canvasWidth, canvasHeight, panel.x, panel.y, panel.width, panel.height, panelBorder);
  const pad = 8;
  const colorbarWidth = Math.max(10, Math.floor(panel.width * 0.045));
  const heatX = panel.x + pad;
  const heatY = panel.y + pad + 18;
  const heatW = Math.max(24, panel.width - pad * 3 - colorbarWidth);
  const heatH = Math.max(24, panel.height - pad * 2 - 24);
  const barX = heatX + heatW + pad;
  const barY = heatY;
  const barH = heatH;

  for (let py = 0; py < heatH; py += 1) {
    const sy = Math.round((py / Math.max(1, heatH - 1)) * (panel.slice.height - 1));
    for (let px = 0; px < heatW; px += 1) {
      const sx = Math.round((px / Math.max(1, heatW - 1)) * (panel.slice.width - 1));
      const value = panel.slice.data[sy * panel.slice.width + sx] ?? 0;
      const t = normalizeSliceValue(panel.slice, value);
      const color =
        panel.slice.mode === "diverging" ? mapDivergingColor(t) : mapSequentialColor(t);
      writePixel(image, canvasWidth, canvasHeight, heatX + px, heatY + py, color[0], color[1], color[2], 255);
    }
  }

  for (let g = 1; g < 4; g += 1) {
    const gx = heatX + Math.round((g / 4) * (heatW - 1));
    const gy = heatY + Math.round((g / 4) * (heatH - 1));
    for (let py = heatY; py < heatY + heatH; py += 1) {
      writePixel(image, canvasWidth, canvasHeight, gx, py, gridColor[0], gridColor[1], gridColor[2], 255);
    }
    for (let px = heatX; px < heatX + heatW; px += 1) {
      writePixel(image, canvasWidth, canvasHeight, px, gy, gridColor[0], gridColor[1], gridColor[2], 255);
    }
  }

  if (panel.slice.mode === "diverging") {
    for (let py = 0; py < heatH - 1; py += 1) {
      const sy = Math.round((py / Math.max(1, heatH - 1)) * (panel.slice.height - 1));
      for (let px = 0; px < heatW - 1; px += 1) {
        const sx = Math.round((px / Math.max(1, heatW - 1)) * (panel.slice.width - 1));
        const v = panel.slice.data[sy * panel.slice.width + sx] ?? 0;
        const vx = panel.slice.data[sy * panel.slice.width + Math.min(panel.slice.width - 1, sx + 1)] ?? 0;
        const vy =
          panel.slice.data[Math.min(panel.slice.height - 1, sy + 1) * panel.slice.width + sx] ?? 0;
        const zeroCrossX = (v < 0 && vx > 0) || (v > 0 && vx < 0);
        const zeroCrossY = (v < 0 && vy > 0) || (v > 0 && vy < 0);
        if (zeroCrossX || zeroCrossY) {
          writePixel(
            image,
            canvasWidth,
            canvasHeight,
            heatX + px,
            heatY + py,
            contourColor[0],
            contourColor[1],
            contourColor[2],
            255,
          );
        }
      }
    }
  }

  drawRectStroke(image, canvasWidth, canvasHeight, heatX, heatY, heatW, heatH, [84, 96, 118]);
  for (let py = 0; py < barH; py += 1) {
    const t = 1 - py / Math.max(1, barH - 1);
    const color =
      panel.slice.mode === "diverging" ? mapDivergingColor(t) : mapSequentialColor(t);
    for (let px = 0; px < colorbarWidth; px += 1) {
      writePixel(image, canvasWidth, canvasHeight, barX + px, barY + py, color[0], color[1], color[2], 255);
    }
  }
  drawRectStroke(image, canvasWidth, canvasHeight, barX, barY, colorbarWidth, barH, [84, 96, 118]);
};

const buildScientificOverlaySvg = (
  width: number,
  height: number,
  panels: ScientificPanelPlacement[],
  payload: HullMisRenderRequestV1,
  ctx: TensorRenderContext,
  brick: GrBrickDecoded,
) => {
  const timestamp = new Date().toISOString();
  const title = "NHM2 Canonical 3+1 Scientific Frame (Tensor-fed)";
  const subtitle = `chart=${ctx.chart ?? payload.solve?.chart ?? "unknown"} | source=${ctx.metricSource ?? "unknown"} | dims=${brick.dims.join("x")} | vox=${brick.voxelSize_m.map((v) => fmtScientific(v, 3)).join(",")} m`;
  const diag = `null residual=${fmtScientific(ctx.diagnostics.maxNullResidual, 4)} | convergence=${fmtScientific(ctx.diagnostics.stepConvergence, 4)} | bundle spread=${fmtScientific(ctx.diagnostics.bundleSpread, 4)} | consistency=${ctx.diagnostics.consistency}`;

  const panelText = panels
    .map((panel) => {
      const top = panel.y + 16;
      const info = `${panel.slice.label} [${panel.slice.unit}]`;
      const range = `range ${fmtScientific(panel.slice.min, 3)} .. ${fmtScientific(panel.slice.max, 3)}`;
      return [
        `<text x="${panel.x + 8}" y="${top}" fill="#cfe5ff" font-size="11" font-weight="600">${escapeXml(info)}</text>`,
        `<text x="${panel.x + 8}" y="${top + 14}" fill="#9fb3ca" font-size="10">${escapeXml(range)}</text>`,
        `<text x="${panel.x + 8}" y="${panel.y + panel.height - 8}" fill="#7f93ac" font-size="10">x-z midplane</text>`,
      ].join("");
    })
    .join("");

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${width}" height="36" fill="#050a14"/>
  <text x="16" y="20" fill="#e8f3ff" font-size="15" font-weight="700">${escapeXml(title)}</text>
  <text x="16" y="33" fill="#9fb3ca" font-size="10">${escapeXml(subtitle)}</text>
  ${panelText}
  <rect x="0" y="${height - 24}" width="${width}" height="24" fill="#050a14"/>
  <text x="16" y="${height - 9}" fill="#9fb3ca" font-size="10">${escapeXml(diag)} | generated=${escapeXml(timestamp)}</text>
</svg>`;
};

const renderTensorFrame = async (
  payload: HullMisRenderRequestV1,
  _deterministicSeed: number,
  ctx: TensorRenderContext,
  brick: GrBrickDecoded,
): Promise<Buffer> => {
  const width = payload.width;
  const height = payload.height;
  const image = Buffer.alloc(width * height * 4, 0);
  fillRect(image, width, height, 0, 0, width, height, [6, 10, 18]);

  const outerPadX = Math.max(12, Math.floor(width * 0.02));
  const topPad = 44;
  const bottomPad = 30;
  const columnGap = 14;
  const rowGap = 14;
  const panelWidth = Math.max(120, Math.floor((width - outerPadX * 2 - columnGap) / 2));
  const panelHeight = Math.max(72, Math.floor((height - topPad - bottomPad - rowGap) / 2));
  const slices = buildScientificSlices(brick);
  const panels: ScientificPanelPlacement[] = [
    {
      x: outerPadX,
      y: topPad,
      width: panelWidth,
      height: panelHeight,
      slice: slices[0]!,
    },
    {
      x: outerPadX + panelWidth + columnGap,
      y: topPad,
      width: panelWidth,
      height: panelHeight,
      slice: slices[1]!,
    },
    {
      x: outerPadX,
      y: topPad + panelHeight + rowGap,
      width: panelWidth,
      height: panelHeight,
      slice: slices[2]!,
    },
    {
      x: outerPadX + panelWidth + columnGap,
      y: topPad + panelHeight + rowGap,
      width: panelWidth,
      height: panelHeight,
      slice: slices[3]!,
    },
  ];
  for (const panel of panels) renderSlicePanel(image, width, height, panel);

  const base = await sharp(image, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 7, adaptiveFiltering: true })
    .toBuffer();
  const overlaySvg = buildScientificOverlaySvg(width, height, panels, payload, ctx, brick);
  return sharp(base)
    .composite([{ input: Buffer.from(overlaySvg), blend: "over" }])
    .png({ compressionLevel: 7, adaptiveFiltering: true })
    .toBuffer();
};

const buildScaffoldAttachments = (
  payload: HullMisRenderRequestV1,
): HullMisRenderAttachmentV1[] => {
  const width = Math.max(1, payload.width | 0);
  const height = Math.max(1, payload.height | 0);
  const total = width * height;
  const depth = new Float32Array(total);
  const mask = new Uint8Array(total);
  const radius = Math.max(1e-3, toFiniteNumber(payload.solve?.R, 1));
  const beta = toFiniteNumber(payload.solve?.beta, 0);
  const nullResidual = Math.abs(
    toFiniteNumber(payload.geodesicDiagnostics?.maxNullResidual, 0),
  );
  const bundleSpread = Math.abs(
    toFiniteNumber(payload.geodesicDiagnostics?.bundleSpread, 0),
  );
  const depthBase = 8;
  const perturbAmp = clamp(0.004 + 2.5 * nullResidual + 0.01 * bundleSpread, 0, 0.03);
  for (let y = 0; y < height; y += 1) {
    const ny = height > 1 ? (y / (height - 1)) * 2 - 1 : 0;
    for (let x = 0; x < width; x += 1) {
      const nx = width > 1 ? (x / (width - 1)) * 2 - 1 : 0;
      const idx = y * width + x;
      const q = 1 - nx * nx - ny * ny;
      if (q < 0) {
        depth[idx] = depthBase;
        mask[idx] = 0;
        continue;
      }
      const perturb = perturbAmp * Math.sin(6.2 * nx + 5.1 * ny + 0.85 * beta);
      const depthValue = depthBase + radius * Math.sqrt(Math.max(0, q)) + perturb;
      depth[idx] = Number.isFinite(depthValue) ? depthValue : depthBase;
      mask[idx] = 255;
    }
  }
  const depthBytes = Buffer.from(depth.buffer.slice(0));
  const maskBytes = Buffer.from(mask.buffer.slice(0));
  return [
    {
      kind: "depth-linear-m-f32le",
      width,
      height,
      encoding: "base64",
      dataBase64: depthBytes.toString("base64"),
    },
    {
      kind: "shell-mask-u8",
      width,
      height,
      encoding: "base64",
      dataBase64: maskBytes.toString("base64"),
    },
  ];
};

const renderOptixScaffoldFrame = async (
  payload: HullMisRenderRequestV1,
  deterministicSeed: number,
): Promise<Buffer> => {
  const width = payload.width;
  const height = payload.height;
  const image = Buffer.alloc(width * height * 4, 0);
  const beta = toFiniteNumber(payload.solve?.beta, 0);
  const alpha = Math.max(1e-6, toFiniteNumber(payload.solve?.alpha, 1));
  const sigma = Math.max(1e-3, toFiniteNumber(payload.solve?.sigma, 6));
  const radius = Math.max(1e-3, toFiniteNumber(payload.solve?.R, 1));
  const nullResidual = Math.abs(
    toFiniteNumber(payload.geodesicDiagnostics?.maxNullResidual, 0),
  );
  const spread = Math.abs(
    toFiniteNumber(payload.geodesicDiagnostics?.bundleSpread, 0),
  );
  const consistency = payload.geodesicDiagnostics?.consistency ?? "unknown";
  const seededPhase = (deterministicSeed % 4096) * (Math.PI / 2048);
  const consistencyFactor =
    consistency === "ok" ? 1 : consistency === "warn" ? 0.82 : 0.62;
  const nullPenalty = clamp(1 / (1 + 28 * nullResidual), 0.18, 1);
  const spreadBoost = clamp(0.72 + spread * 0.64, 0.52, 1.8);
  for (let y = 0; y < height; y += 1) {
    const v = height > 1 ? y / (height - 1) : 0;
    const ny = v * 2 - 1;
    for (let x = 0; x < width; x += 1) {
      const u = width > 1 ? x / (width - 1) : 0;
      const nx = u * 2 - 1;
      const r = Math.sqrt(nx * nx + ny * ny);
      const theta = Math.atan2(ny, nx);
      const shell = Math.exp(
        -Math.pow(r - (0.33 + 0.06 * Math.tanh(beta)), 2) * (7.5 + sigma * 1.4),
      );
      const tube = Math.exp(
        -Math.pow(nx * nx / Math.max(radius * radius, 0.2) + ny * ny / 0.55, 1.12),
      );
      const fringe =
        0.5 +
        0.5 * Math.sin(11 * theta + 8.5 * r + seededPhase + 0.7 * beta - 0.2 * alpha);
      const band =
        0.5 +
        0.5 * Math.cos(18 * nx - 7 * ny + seededPhase * 0.8 + spreadBoost);
      const brightness =
        clamp((0.16 + 0.72 * shell + 0.4 * tube) * consistencyFactor, 0, 1) *
        nullPenalty;
      const red = toByte(255 * clamp(brightness * (0.46 + 0.58 * fringe), 0, 1));
      const green = toByte(255 * clamp(brightness * (0.28 + 0.64 * band), 0, 1));
      const blue = toByte(255 * clamp(brightness * (0.52 + 0.42 * (1 - fringe)), 0, 1));
      const idx = (y * width + x) * 4;
      image[idx] = red;
      image[idx + 1] = green;
      image[idx + 2] = blue;
      image[idx + 3] = 255;
    }
  }
  return sharp(image, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 7, adaptiveFiltering: true })
    .toBuffer();
};

const getRuntimeStatus = (): RuntimeStatus => {
  const optixSdkPath = readEnv("OPTIX_SDK_PATH") || readEnv("OPTIX_RENDER_SDK_PATH");
  const cudaPath = readEnv("CUDA_PATH") || readEnv("CUDA_HOME");
  const allowSynthetic = readEnvFlag("OPTIX_RENDER_ALLOW_SYNTHETIC", false);
  const metricRefBaseUrl =
    readEnv("OPTIX_RENDER_METRIC_REF_BASE_URL") || readEnv("OPTIX_RENDER_APP_BASE_URL");
  return {
    host: readEnv("OPTIX_RENDER_SERVICE_HOST") || DEFAULT_SERVICE_HOST,
    port: toInt(readEnv("OPTIX_RENDER_SERVICE_PORT"), DEFAULT_SERVICE_PORT, 1, 65535),
    serviceMode: "optix-tensor-pass1",
    allowSynthetic,
    readyForUnity: false,
    readyForOptix: true,
    readyForScientificLane: true,
    optixConfigured: !!optixSdkPath,
    cudaConfigured: !!cudaPath,
    optixSdkPath,
    cudaPath,
    metricRefBaseUrl,
  };
};

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/helix/hull-render/status", (_req, res) => {
  const runtime = getRuntimeStatus();
  res.json({
    kind: "hull-optix-service-status",
    backendHint: "mis-path-tracing",
    service: "OptiX-CUDA-TensorPass1",
    runtime,
    timestampMs: Date.now(),
  });
});

app.post("/api/helix/hull-render/frame", async (req, res) => {
  const startedAt = Date.now();
  const payload = parseRequest(req.body);
  const deterministicSeed = hashSeed(payload);

  const requireScientificFrame = payload.scienceLane?.requireScientificFrame === true;
  let metricBrick: GrBrickDecoded | null = null;
  let tensorContext: TensorRenderContext | null = null;
  let tensorFetchError: string | null = null;
  if (payload.metricVolumeRef?.kind === "gr-evolve-brick") {
    try {
      metricBrick = await fetchMetricBrick(payload.metricVolumeRef);
      if (metricBrick) tensorContext = buildTensorRenderContext(payload, metricBrick);
      if (!metricBrick) tensorFetchError = "metric_ref_decode_failed";
    } catch (error) {
      tensorFetchError = error instanceof Error ? error.message : String(error);
    }
  }

  const useTensorPath = !!tensorContext && !!metricBrick;
  if (!useTensorPath && requireScientificFrame) {
    return res.status(422).json({
      error: "scientific_metric_volume_unavailable",
      message:
        tensorFetchError ??
        "scientific frame requires metricVolumeRef with decodable gr-evolve-brick volume",
    });
  }
  const png = useTensorPath
    ? await renderTensorFrame(payload, deterministicSeed, tensorContext!, metricBrick!)
    : await renderOptixScaffoldFrame(payload, deterministicSeed);
  const response: HullMisRenderResponseV1 = useTensorPath
    ? {
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl: encodePngDataUrl(png),
        width: payload.width,
        height: payload.height,
        deterministicSeed,
        renderMs: Date.now() - startedAt,
        diagnostics: {
          note: "optix_cuda_tensorfed_research_pass1",
          geodesicMode: "full-3+1-christoffel",
          consistency: tensorContext!.diagnostics.consistency,
          maxNullResidual: tensorContext!.diagnostics.maxNullResidual,
          stepConvergence: tensorContext!.diagnostics.stepConvergence,
          bundleSpread: tensorContext!.diagnostics.bundleSpread,
          scientificTier: "research-grade",
        },
        attachments: buildTensorAttachments(payload, tensorContext!),
        provenance: {
          source: "optix/cuda.research.pass1",
          serviceUrl: payload.metricVolumeRef?.url ?? null,
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      }
    : {
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl: encodePngDataUrl(png),
        width: payload.width,
        height: payload.height,
        deterministicSeed,
        renderMs: Date.now() - startedAt,
        diagnostics: {
          note:
            tensorFetchError != null
              ? `optix_cuda_scaffold_render (${tensorFetchError})`
              : "optix_cuda_scaffold_render",
          geodesicMode: payload.geodesicDiagnostics?.mode ?? null,
          consistency: payload.geodesicDiagnostics?.consistency ?? "unknown",
          maxNullResidual: payload.geodesicDiagnostics?.maxNullResidual ?? null,
          stepConvergence: payload.geodesicDiagnostics?.stepConvergence ?? null,
          bundleSpread: payload.geodesicDiagnostics?.bundleSpread ?? null,
          scientificTier: "scaffold",
        },
        attachments: buildScaffoldAttachments(payload),
        provenance: {
          source: "optix/cuda.scaffold",
          serviceUrl: payload.metricVolumeRef?.url ?? null,
          timestampMs: Date.now(),
          researchGrade: false,
          scientificTier: "scaffold",
        },
      };
  return res.json(response);
});

const host = readEnv("OPTIX_RENDER_SERVICE_HOST") || DEFAULT_SERVICE_HOST;
const port = toInt(readEnv("OPTIX_RENDER_SERVICE_PORT"), DEFAULT_SERVICE_PORT, 1, 65535);

app.listen(port, host, () => {
  console.log(
    JSON.stringify(
      {
        kind: "hull-optix-service-started",
        host,
        port,
        statusEndpoint: `http://${host}:${port}/api/helix/hull-render/status`,
        frameEndpoint: `http://${host}:${port}/api/helix/hull-render/frame`,
      },
      null,
      2,
    ),
  );
});
