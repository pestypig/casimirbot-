import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

type Vec3 = [number, number, number];
type LayerId = "ricci_only" | "shell_only" | "combined";

type DecodedChannel = {
  data: Float32Array;
  headerMin: number;
  headerMax: number;
  decodedMin: number;
  decodedMax: number;
};

type DecodedBrick = {
  dims: Vec3;
  bounds: { min: Vec3; max: Vec3 } | null;
  voxelSizeM: Vec3;
  channelOrder: string[];
  channels: Record<string, DecodedChannel>;
};

type Triangle = {
  a: Vec3;
  b: Vec3;
  c: Vec3;
  color: { r: number; g: number; b: number };
  alpha: number;
};
type SceneTransform = {
  minM: Vec3;
  spanM: Vec3;
  centerM: Vec3;
  uniformScaleM: number;
};

const ROOT = process.cwd();
const DATE_STAMP = new Date().toISOString().slice(0, 10);
const RAW_INPUT_PATH = path.join(ROOT, "artifacts", "research", "full-solve", "triage-brick-48.raw");
const WRAPPED_INPUT_PATH = path.join(
  ROOT,
  "artifacts",
  "research",
  "full-solve",
  "user-york-brick-latest.json",
);
const OUTPUT_DIR = path.join(
  ROOT,
  "artifacts",
  "research",
  "full-solve",
  "rendered",
  "scientific_3p1_field",
  DATE_STAMP,
);
const TMP_DIR = path.join(OUTPUT_DIR, "tmp");
const ASSET_PREFIX = "nhm2_ricci4_nat3d_iso";

const FRAME_COUNT = 48;
const WIDTH = 640;
const HEIGHT = 640;
const TILT_RAD = (24 * Math.PI) / 180;
const CAMERA_DISTANCE = 3.2;
const FOCAL_PX = 470;
const RICCI_LEVELS = 7;
const SHELL_BAND_MIN_M = 0;
const SHELL_BAND_MAX_M = 80;
const SHELL_CONTOUR_M = 5;
const EPS = 1e-45;
const AXIS_CONVENTION = "x_ship_y_port_z_zenith";

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const ensureDir = (dir: string): void => fs.mkdirSync(dir, { recursive: true });
const sha256Hex = (buf: Buffer): string => createHash("sha256").update(buf).digest("hex");
const hashFloat32 = (values: Float32Array): string =>
  createHash("sha256")
    .update(Buffer.from(values.buffer, values.byteOffset, values.byteLength))
    .digest("hex");

const clearDirPng = (dir: string): void => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    if (entry.toLowerCase().endsWith(".png")) fs.unlinkSync(path.join(dir, entry));
  }
};

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  if (l <= 1e-12) return [0, 0, 0];
  return [a[0] / l, a[1] / l, a[2] / l];
};
const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] * (1 - t) + b[0] * t,
  a[1] * (1 - t) + b[1] * t,
  a[2] * (1 - t) + b[2] * t,
];

const loadBrickBytes = (filePath: string): Buffer => {
  const raw = fs.readFileSync(filePath);
  if (raw.byteLength >= 12) {
    const headerLength = raw.readUInt32LE(0);
    if (headerLength > 0 && 4 + headerLength <= raw.byteLength) return raw;
  }
  const asText = raw.toString("latin1").trim();
  if (!asText.startsWith("\"")) throw new Error("brick_header_invalid");
  const escaped = JSON.parse(asText) as string;
  const out = Buffer.allocUnsafe(escaped.length);
  for (let i = 0; i < escaped.length; i += 1) out[i] = escaped.charCodeAt(i) & 0xff;
  return out;
};

const readVec3 = (raw: unknown, fallback: Vec3): Vec3 => {
  if (!Array.isArray(raw) || raw.length < 3) return fallback;
  return [Number(raw[0]) || fallback[0], Number(raw[1]) || fallback[1], Number(raw[2]) || fallback[2]];
};

const decodeBinaryBrick = (fileBytes: Buffer): DecodedBrick => {
  if (fileBytes.byteLength < 12) throw new Error("brick_file_too_small");
  const headerLength = fileBytes.readUInt32LE(0);
  if (headerLength <= 0 || 4 + headerLength > fileBytes.byteLength) throw new Error("brick_header_invalid");
  const headerText = fileBytes.subarray(4, 4 + headerLength).toString("utf8");
  const header = JSON.parse(headerText) as Record<string, unknown>;
  if (header.kind !== "gr-evolve-brick") throw new Error("brick_kind_invalid");
  if (!Array.isArray(header.dims) || header.dims.length < 3) throw new Error("brick_dims_missing");
  const dims: Vec3 = [
    Math.max(1, Math.floor(Number(header.dims[0]) || 1)),
    Math.max(1, Math.floor(Number(header.dims[1]) || 1)),
    Math.max(1, Math.floor(Number(header.dims[2]) || 1)),
  ];
  const voxelSizeM = readVec3(header.voxelSize_m, [1, 1, 1]).map((v) => Math.max(1e-6, v)) as Vec3;
  const boundsRaw = header.bounds as Record<string, unknown> | undefined;
  const bounds =
    boundsRaw && Array.isArray(boundsRaw.min) && Array.isArray(boundsRaw.max)
      ? { min: readVec3(boundsRaw.min, [0, 0, 0]), max: readVec3(boundsRaw.max, [0, 0, 0]) }
      : null;
  const channelsMeta =
    header.channels && typeof header.channels === "object"
      ? (header.channels as Record<string, Record<string, unknown>>)
      : {};
  const orderRaw = Array.isArray(header.channelOrder) ? (header.channelOrder as unknown[]) : Object.keys(channelsMeta);
  const channelOrder = orderRaw.map((entry) => String(entry)).filter((entry) => entry.length > 0);
  const padding = (4 - (headerLength % 4)) % 4;
  let offset = 4 + headerLength + padding;
  const channels: Record<string, DecodedChannel> = {};
  for (const channelName of channelOrder) {
    const spec = channelsMeta[channelName];
    if (!spec) continue;
    const bytes = Math.max(4, Math.floor(Number(spec.bytes) || 0));
    if (bytes % 4 !== 0) throw new Error(`brick_channel_alignment_invalid:${channelName}`);
    if (offset + bytes > fileBytes.byteLength) throw new Error(`brick_channel_missing_bytes:${channelName}`);
    const floats = new Float32Array(bytes / 4);
    const dv = new DataView(fileBytes.buffer, fileBytes.byteOffset + offset, bytes);
    let decodedMin = Number.POSITIVE_INFINITY;
    let decodedMax = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < floats.length; i += 1) {
      const value = dv.getFloat32(i * 4, true);
      floats[i] = value;
      if (value < decodedMin) decodedMin = value;
      if (value > decodedMax) decodedMax = value;
    }
    channels[channelName] = {
      data: floats,
      headerMin: Number(spec.min) || 0,
      headerMax: Number(spec.max) || 0,
      decodedMin,
      decodedMax,
    };
    offset += bytes;
  }
  return { dims, bounds, voxelSizeM, channelOrder, channels };
};

const idx3 = (x: number, y: number, z: number, dims: Vec3): number => x + dims[0] * (y + dims[1] * z);
const gridFrac = (i: number, n: number): number => (n <= 1 ? 0 : i / (n - 1));

const buildSceneTransform = (dims: Vec3, bounds: { min: Vec3; max: Vec3 } | null, voxelSizeM: Vec3): SceneTransform => {
  const minM: Vec3 = bounds
    ? [...bounds.min]
    : [-(dims[0] - 1) * voxelSizeM[0] * 0.5, -(dims[1] - 1) * voxelSizeM[1] * 0.5, -(dims[2] - 1) * voxelSizeM[2] * 0.5];
  const maxM: Vec3 = bounds
    ? [...bounds.max]
    : [(dims[0] - 1) * voxelSizeM[0] * 0.5, (dims[1] - 1) * voxelSizeM[1] * 0.5, (dims[2] - 1) * voxelSizeM[2] * 0.5];
  const spanM: Vec3 = [maxM[0] - minM[0], maxM[1] - minM[1], maxM[2] - minM[2]];
  const centerM: Vec3 = [(minM[0] + maxM[0]) * 0.5, (minM[1] + maxM[1]) * 0.5, (minM[2] + maxM[2]) * 0.5];
  const uniformScaleM = Math.max(spanM[0], spanM[1], spanM[2]) * 0.5 || 1;
  return { minM, spanM, centerM, uniformScaleM };
};

const gridToScene = (x: number, y: number, z: number, dims: Vec3, xf: SceneTransform): Vec3 => {
  const mx = xf.minM[0] + gridFrac(x, dims[0]) * xf.spanM[0];
  const my = xf.minM[1] + gridFrac(y, dims[1]) * xf.spanM[1];
  const mz = xf.minM[2] + gridFrac(z, dims[2]) * xf.spanM[2];
  return [
    (mx - xf.centerM[0]) / xf.uniformScaleM,
    (my - xf.centerM[1]) / xf.uniformScaleM,
    (mz - xf.centerM[2]) / xf.uniformScaleM,
  ];
};

const quantile = (values: Float32Array, q: number): number => {
  const sample: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const v = Math.abs(values[i] ?? 0);
    if (v > 0 && Number.isFinite(v)) sample.push(v);
  }
  if (sample.length === 0) return 1;
  sample.sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sample.length - 1, Math.floor((sample.length - 1) * q)));
  return sample[index] ?? sample[sample.length - 1] ?? 1;
};

const natarioColormap = (t: number): { r: number; g: number; b: number } => {
  const n = clamp01(t);
  const stops = [
    { t: 0.0, c: [8, 17, 54] },
    { t: 0.22, c: [28, 84, 140] },
    { t: 0.42, c: [60, 182, 196] },
    { t: 0.62, c: [168, 224, 122] },
    { t: 0.8, c: [252, 214, 96] },
    { t: 0.92, c: [245, 138, 56] },
    { t: 1.0, c: [220, 52, 52] },
  ] as const;
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (n < a.t || n > b.t) continue;
    const u = (n - a.t) / Math.max(1e-9, b.t - a.t);
    return {
      r: Math.round(a.c[0] * (1 - u) + b.c[0] * u),
      g: Math.round(a.c[1] * (1 - u) + b.c[1] * u),
      b: Math.round(a.c[2] * (1 - u) + b.c[2] * u),
    };
  }
  return { r: 220, g: 52, b: 52 };
};

const rotatePoint = (p: Vec3, yawRad: number): Vec3 => {
  const cy = Math.cos(-yawRad);
  const sy = Math.sin(-yawRad);
  const cx = Math.cos(-TILT_RAD);
  const sx = Math.sin(-TILT_RAD);
  const y1 = p[1] * cx - p[2] * sx;
  const z1 = p[1] * sx + p[2] * cx;
  const x2 = p[0] * cy + z1 * sy;
  const z2 = -p[0] * sy + z1 * cy;
  return [x2, y1, z2];
};

const validateChannelConsistency = (channel: DecodedChannel, id: string): { minDelta: number; maxDelta: number } => {
  const minTol = 1e-6 * Math.max(1, Math.abs(channel.headerMin));
  const maxTol = 1e-6 * Math.max(1, Math.abs(channel.headerMax));
  const minDelta = Math.abs(channel.decodedMin - channel.headerMin);
  const maxDelta = Math.abs(channel.decodedMax - channel.headerMax);
  if (minDelta > minTol || maxDelta > maxTol) {
    throw new Error(`channel_consistency_failed:${id}:minDelta=${minDelta}:maxDelta=${maxDelta}`);
  }
  return { minDelta, maxDelta };
};

const selectIsoBand = (ricciAbs: Float32Array): { qLow: number; qHigh: number; low: number; high: number } => {
  let qLow = 0.97;
  const qHigh = 0.999;
  let low = Math.max(EPS, quantile(ricciAbs, qLow));
  const high = Math.max(low * 1.001, Math.max(EPS, quantile(ricciAbs, qHigh)));
  const countActive = (threshold: number): number => {
    let count = 0;
    for (let i = 0; i < ricciAbs.length; i += 1) if (ricciAbs[i] >= threshold) count += 1;
    return count;
  };
  while (qLow > 0.9 && countActive(low) < 1800) {
    qLow -= 0.01;
    low = Math.max(EPS, quantile(ricciAbs, qLow));
  }
  return { qLow, qHigh, low, high };
};

const TETS: number[][] = [
  [0, 5, 1, 6],
  [0, 5, 6, 4],
  [0, 2, 6, 1],
  [0, 2, 3, 6],
  [0, 7, 4, 6],
  [0, 3, 7, 6],
];
const CORNERS: Vec3[] = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1],
];

type VertexSample = { p: Vec3; f: number; sdf: number };

const buildTetTriangles = (
  v: [VertexSample, VertexSample, VertexSample, VertexSample],
  iso: number,
): Array<{ p: Vec3[]; sdfAvg: number }> => {
  const inside = [v[0].f >= iso, v[1].f >= iso, v[2].f >= iso, v[3].f >= iso];
  const insideIds = [0, 1, 2, 3].filter((i) => inside[i]);
  const outsideIds = [0, 1, 2, 3].filter((i) => !inside[i]);
  const count = insideIds.length;
  if (count === 0 || count === 4) return [];
  const edgePoint = (i: number, j: number): { p: Vec3; sdf: number } => {
    const vi = v[i];
    const vj = v[j];
    const denom = vj.f - vi.f;
    const t = Math.abs(denom) < 1e-16 ? 0.5 : (iso - vi.f) / denom;
    const tc = clamp01(t);
    return {
      p: lerpVec3(vi.p, vj.p, tc),
      sdf: vi.sdf * (1 - tc) + vj.sdf * tc,
    };
  };
  if (count === 1 || count === 3) {
    const pivot = count === 1 ? insideIds[0] : outsideIds[0];
    const others = count === 1 ? outsideIds : insideIds;
    const p0 = edgePoint(pivot, others[0]);
    const p1 = edgePoint(pivot, others[1]);
    const p2 = edgePoint(pivot, others[2]);
    const tri = count === 1 ? [p0.p, p1.p, p2.p] : [p0.p, p2.p, p1.p];
    const sdfAvg = (p0.sdf + p1.sdf + p2.sdf) / 3;
    return [{ p: tri, sdfAvg }];
  }
  const [i0, i1] = insideIds;
  const [o0, o1] = outsideIds;
  const p0 = edgePoint(i0, o0);
  const p1 = edgePoint(i0, o1);
  const p2 = edgePoint(i1, o0);
  const p3 = edgePoint(i1, o1);
  return [
    { p: [p0.p, p1.p, p2.p], sdfAvg: (p0.sdf + p1.sdf + p2.sdf) / 3 },
    { p: [p1.p, p3.p, p2.p], sdfAvg: (p1.sdf + p3.sdf + p2.sdf) / 3 },
  ];
};

const buildRicciIsoMesh = (
  dims: Vec3,
  sceneTransform: SceneTransform,
  ricciAbs: Float32Array,
  hullSdf: Float32Array,
  isoLow: number,
  isoHigh: number,
): { triangles: Triangle[]; isoLevels: number[] } => {
  const levels: number[] = [];
  for (let i = 0; i < RICCI_LEVELS; i += 1) {
    const t = i / Math.max(1, RICCI_LEVELS - 1);
    const lvl = isoLow * Math.pow(Math.max(isoHigh / Math.max(isoLow, EPS), 1.0000001), t);
    levels.push(lvl);
  }
  const tris: Triangle[] = [];
  const [nx, ny, nz] = dims;
  for (const iso of levels) {
    const cIdx = levels.indexOf(iso);
    const color = natarioColormap(cIdx / Math.max(1, levels.length - 1));
    for (let z = 0; z < nz - 1; z += 1) {
      for (let y = 0; y < ny - 1; y += 1) {
        for (let x = 0; x < nx - 1; x += 1) {
          const cube: VertexSample[] = new Array(8);
          for (let c = 0; c < 8; c += 1) {
            const cx = x + CORNERS[c][0];
            const cy = y + CORNERS[c][1];
            const cz = z + CORNERS[c][2];
            const id = idx3(cx, cy, cz, dims);
            cube[c] = {
              p: gridToScene(cx, cy, cz, dims, sceneTransform),
              f: ricciAbs[id] ?? 0,
              sdf: Math.abs(hullSdf[id] ?? Number.POSITIVE_INFINITY),
            };
          }
          for (const tet of TETS) {
            const tetVerts = [cube[tet[0]], cube[tet[1]], cube[tet[2]], cube[tet[3]]] as [
              VertexSample,
              VertexSample,
              VertexSample,
              VertexSample,
            ];
            const tt = buildTetTriangles(tetVerts, iso);
            for (const tri of tt) {
              if (tri.sdfAvg < SHELL_BAND_MIN_M || tri.sdfAvg > SHELL_BAND_MAX_M) continue;
              tris.push({
                a: tri.p[0],
                b: tri.p[1],
                c: tri.p[2],
                color,
                alpha: 0.9,
              });
            }
          }
        }
      }
    }
  }
  return { triangles: tris, isoLevels: levels };
};

const buildHullIsoMesh = (dims: Vec3, sceneTransform: SceneTransform, hullSdf: Float32Array): Triangle[] => {
  const [nx, ny, nz] = dims;
  const tris: Triangle[] = [];
  const color = { r: 188, g: 228, b: 252 };
  for (let z = 0; z < nz - 1; z += 1) {
    for (let y = 0; y < ny - 1; y += 1) {
      for (let x = 0; x < nx - 1; x += 1) {
        const cube: VertexSample[] = new Array(8);
        for (let c = 0; c < 8; c += 1) {
          const cx = x + CORNERS[c][0];
          const cy = y + CORNERS[c][1];
          const cz = z + CORNERS[c][2];
          const id = idx3(cx, cy, cz, dims);
          cube[c] = {
            p: gridToScene(cx, cy, cz, dims, sceneTransform),
            f: hullSdf[id] ?? 0,
            sdf: Math.abs(hullSdf[id] ?? 0),
          };
        }
        for (const tet of TETS) {
          const tetVerts = [cube[tet[0]], cube[tet[1]], cube[tet[2]], cube[tet[3]]] as [
            VertexSample,
            VertexSample,
            VertexSample,
            VertexSample,
          ];
          const tt = buildTetTriangles(tetVerts, 0);
          for (const tri of tt) {
            tris.push({
              a: tri.p[0],
              b: tri.p[1],
              c: tri.p[2],
              color,
              alpha: 0.28,
            });
          }
        }
      }
    }
  }
  return tris;
};

const renderTrianglesFrame = async (outPath: string, triangles: Triangle[], yawRad: number): Promise<void> => {
  const rgba = new Uint8Array(WIDTH * HEIGHT * 4);
  const zbuf = new Float32Array(WIDTH * HEIGHT);
  for (let i = 0; i < WIDTH * HEIGHT; i += 1) {
    rgba[i * 4] = 10;
    rgba[i * 4 + 1] = 13;
    rgba[i * 4 + 2] = 22;
    rgba[i * 4 + 3] = 255;
    zbuf[i] = Number.POSITIVE_INFINITY;
  }
  const light = norm([0.35, 0.45, 1.0]);
  const edge = (ax: number, ay: number, bx: number, by: number, px: number, py: number): number =>
    (px - ax) * (by - ay) - (py - ay) * (bx - ax);

  for (const tri of triangles) {
    const pa = rotatePoint(tri.a, yawRad);
    const pb = rotatePoint(tri.b, yawRad);
    const pc = rotatePoint(tri.c, yawRad);
    const za = pa[2] + CAMERA_DISTANCE;
    const zb = pb[2] + CAMERA_DISTANCE;
    const zc = pc[2] + CAMERA_DISTANCE;
    if (za <= 0.2 || zb <= 0.2 || zc <= 0.2) continue;
    const sa: Vec3 = [WIDTH * 0.5 + (pa[0] / za) * FOCAL_PX, HEIGHT * 0.5 - (pa[1] / za) * FOCAL_PX, za];
    const sb: Vec3 = [WIDTH * 0.5 + (pb[0] / zb) * FOCAL_PX, HEIGHT * 0.5 - (pb[1] / zb) * FOCAL_PX, zb];
    const sc: Vec3 = [WIDTH * 0.5 + (pc[0] / zc) * FOCAL_PX, HEIGHT * 0.5 - (pc[1] / zc) * FOCAL_PX, zc];
    const area = edge(sa[0], sa[1], sb[0], sb[1], sc[0], sc[1]);
    if (Math.abs(area) < 1e-6) continue;
    const camN = norm(cross(sub(pb, pa), sub(pc, pa)));
    const facing = dot(camN, [0, 0, 1]);
    if (facing <= 0) continue;
    const shade = 0.26 + 0.74 * Math.max(0, dot(camN, light));
    const cr = Math.round(tri.color.r * shade);
    const cg = Math.round(tri.color.g * shade);
    const cb = Math.round(tri.color.b * shade);
    const minX = Math.max(0, Math.floor(Math.min(sa[0], sb[0], sc[0])));
    const maxX = Math.min(WIDTH - 1, Math.ceil(Math.max(sa[0], sb[0], sc[0])));
    const minY = Math.max(0, Math.floor(Math.min(sa[1], sb[1], sc[1])));
    const maxY = Math.min(HEIGHT - 1, Math.ceil(Math.max(sa[1], sb[1], sc[1])));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const px = x + 0.5;
        const py = y + 0.5;
        const w0 = edge(sb[0], sb[1], sc[0], sc[1], px, py) / area;
        const w1 = edge(sc[0], sc[1], sa[0], sa[1], px, py) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
        const z = w0 * sa[2] + w1 * sb[2] + w2 * sc[2];
        const idx = y * WIDTH + x;
        if (z >= zbuf[idx]) continue;
        zbuf[idx] = z;
        const bi = idx * 4;
        const a = tri.alpha;
        rgba[bi] = Math.round(rgba[bi] * (1 - a) + cr * a);
        rgba[bi + 1] = Math.round(rgba[bi + 1] * (1 - a) + cg * a);
        rgba[bi + 2] = Math.round(rgba[bi + 2] * (1 - a) + cb * a);
      }
    }
  }
  await sharp(rgba, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } }).png().toFile(outPath);
};

const encodeTurntable = (framesDir: string, outBase: string): { gif: string; mp4: string } => {
  const gifPath = `${outBase}.gif`;
  const mp4Path = `${outBase}.mp4`;
  const palettePath = path.join(framesDir, "palette.png");
  execFileSync(
    "ffmpeg",
    ["-y", "-framerate", "16", "-i", path.join(framesDir, "frame_%03d.png"), "-vf", "palettegen=stats_mode=full", palettePath],
    { stdio: "ignore" },
  );
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "16",
      "-i",
      path.join(framesDir, "frame_%03d.png"),
      "-i",
      palettePath,
      "-lavfi",
      "paletteuse=dither=bayer:bayer_scale=5",
      gifPath,
    ],
    { stdio: "ignore" },
  );
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "16",
      "-i",
      path.join(framesDir, "frame_%03d.png"),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      mp4Path,
    ],
    { stdio: "ignore" },
  );
  return { gif: gifPath, mp4: mp4Path };
};

const writeSliceImage = async (
  outPath: string,
  layer: LayerId,
  axis: "xz" | "yz",
  dims: Vec3,
  ricciAbs: Float32Array,
  hullSdf: Float32Array,
  isoLow: number,
  isoHigh: number,
): Promise<void> => {
  const [nx, ny, nz] = dims;
  const w = axis === "xz" ? nx : ny;
  const h = nz;
  const yMid = Math.floor(ny * 0.5);
  const xMid = Math.floor(nx * 0.5);
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 10;
    rgba[i + 1] = 13;
    rgba[i + 2] = 22;
    rgba[i + 3] = 255;
  }
  for (let iz = 0; iz < nz; iz += 1) {
    for (let iu = 0; iu < w; iu += 1) {
      const x = axis === "xz" ? iu : xMid;
      const y = axis === "xz" ? yMid : iu;
      const i3 = idx3(x, y, iz, dims);
      const absRicci = ricciAbs[i3] ?? 0;
      const absSdf = Math.abs(hullSdf[i3] ?? Number.POSITIVE_INFINITY);
      const inShellBand = absSdf >= SHELL_BAND_MIN_M && absSdf <= SHELL_BAND_MAX_M;
      const inIsoBand = absRicci >= isoLow && absRicci <= isoHigh;
      const dst = ((h - 1 - iz) * w + iu) * 4;
      if ((layer === "ricci_only" || layer === "combined") && inShellBand && inIsoBand) {
        const logNum = Math.log(Math.max(absRicci, EPS) / Math.max(isoLow, EPS));
        const logDen = Math.max(1e-9, Math.log(Math.max(isoHigh, EPS) / Math.max(isoLow, EPS)));
        const n = clamp01(logNum / logDen);
        const c = natarioColormap(n);
        rgba[dst] = c.r;
        rgba[dst + 1] = c.g;
        rgba[dst + 2] = c.b;
      }
      if ((layer === "shell_only" || layer === "combined") && absSdf <= SHELL_CONTOUR_M) {
        const a = layer === "combined" ? 0.35 : 1;
        rgba[dst] = Math.round(rgba[dst] * (1 - a) + 188 * a);
        rgba[dst + 1] = Math.round(rgba[dst + 1] * (1 - a) + 228 * a);
        rgba[dst + 2] = Math.round(rgba[dst + 2] * (1 - a) + 252 * a);
      }
    }
  }
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .resize({ width: 720, height: 360, kernel: sharp.kernel.nearest })
    .png()
    .toFile(outPath);
};

const run = async (): Promise<void> => {
  ensureDir(OUTPUT_DIR);
  ensureDir(TMP_DIR);
  const inputPath = fs.existsSync(RAW_INPUT_PATH) ? RAW_INPUT_PATH : WRAPPED_INPUT_PATH;
  const bytes = loadBrickBytes(inputPath);
  const brick = decodeBinaryBrick(bytes);
  const ricci4 = brick.channels.ricci4;
  const hullSdf = brick.channels.hull_sdf;
  if (!ricci4 || !hullSdf) throw new Error("required_channels_missing:ricci4_or_hull_sdf");
  const ricciConsistency = validateChannelConsistency(ricci4, "ricci4");
  const hullConsistency = validateChannelConsistency(hullSdf, "hull_sdf");

  const ricciAbs = new Float32Array(ricci4.data.length);
  for (let i = 0; i < ricciAbs.length; i += 1) ricciAbs[i] = Math.abs(ricci4.data[i] ?? 0);
  const band = selectIsoBand(ricciAbs);
  const sceneTransform = buildSceneTransform(brick.dims, brick.bounds, brick.voxelSizeM);

  const ricciMesh = buildRicciIsoMesh(brick.dims, sceneTransform, ricciAbs, hullSdf.data, band.low, band.high);
  const hullMesh = buildHullIsoMesh(brick.dims, sceneTransform, hullSdf.data);
  const meshLayers: Record<LayerId, Triangle[]> = {
    ricci_only: ricciMesh.triangles,
    shell_only: hullMesh,
    combined: [...hullMesh, ...ricciMesh.triangles],
  };

  const outputs: Record<
    LayerId,
    { gif: string; mp4: string; framesDir: string; xzSlice: string; yzSlice: string; triangleCount: number }
  > = {
    ricci_only: { gif: "", mp4: "", framesDir: "", xzSlice: "", yzSlice: "", triangleCount: meshLayers.ricci_only.length },
    shell_only: { gif: "", mp4: "", framesDir: "", xzSlice: "", yzSlice: "", triangleCount: meshLayers.shell_only.length },
    combined: { gif: "", mp4: "", framesDir: "", xzSlice: "", yzSlice: "", triangleCount: meshLayers.combined.length },
  };

  for (const layer of ["ricci_only", "shell_only", "combined"] as const) {
    const layerTag = layer === "ricci_only" ? "r" : layer === "shell_only" ? "s" : "c";
    const framesDir = path.join(TMP_DIR, `n4iso_${layerTag}`);
    ensureDir(framesDir);
    clearDirPng(framesDir);
    for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
      const yaw = (frame / FRAME_COUNT) * Math.PI * 2;
      await renderTrianglesFrame(path.join(framesDir, `frame_${String(frame).padStart(3, "0")}.png`), meshLayers[layer], yaw);
    }
    const outBase = path.join(OUTPUT_DIR, `${ASSET_PREFIX}-${layer}`);
    const turntable = encodeTurntable(framesDir, outBase);
    const xzSlice = path.join(OUTPUT_DIR, `${ASSET_PREFIX}-${layer}-xz_slice.png`);
    const yzSlice = path.join(OUTPUT_DIR, `${ASSET_PREFIX}-${layer}-yz_slice.png`);
    await writeSliceImage(xzSlice, layer, "xz", brick.dims, ricciAbs, hullSdf.data, band.low, band.high);
    await writeSliceImage(yzSlice, layer, "yz", brick.dims, ricciAbs, hullSdf.data, band.low, band.high);
    outputs[layer] = {
      gif: turntable.gif,
      mp4: turntable.mp4,
      framesDir,
      xzSlice,
      yzSlice,
      triangleCount: meshLayers[layer].length,
    };
  }

  const metadataPath = path.join(OUTPUT_DIR, `${ASSET_PREFIX}-metadata.json`);
  const metadata = {
    artifactType: "nhm2_ricci4_natario_turntable_iso_surface/v3",
    generatedOn: new Date().toISOString(),
    axisConvention: AXIS_CONVENTION,
    method: {
      isoExtractor: "marching_tetrahedra",
      isoLevels: ricciMesh.isoLevels,
      interpolation: "linear_edge_interpolation",
      renderer: "software_triangle_rasterizer",
    },
    camera: {
      frameCount: FRAME_COUNT,
      tiltRad: TILT_RAD,
      cameraDistance: CAMERA_DISTANCE,
      focalPx: FOCAL_PX,
      width: WIDTH,
      height: HEIGHT,
    },
    input: {
      path: inputPath,
      sha256: sha256Hex(bytes),
    },
    grid: {
      dims: brick.dims,
      bounds: brick.bounds,
      voxelSizeM: brick.voxelSizeM,
    },
    sceneTransform: {
      centerM: sceneTransform.centerM,
      uniformScaleM: sceneTransform.uniformScaleM,
      note: "Vertices are mapped from physical brick bounds (meters) then uniformly scaled for camera framing.",
    },
    channels: {
      ricci4: {
        hash: hashFloat32(ricci4.data),
        headerMin: ricci4.headerMin,
        headerMax: ricci4.headerMax,
        decodedMin: ricci4.decodedMin,
        decodedMax: ricci4.decodedMax,
        consistency: ricciConsistency,
      },
      hull_sdf: {
        hash: hashFloat32(hullSdf.data),
        headerMin: hullSdf.headerMin,
        headerMax: hullSdf.headerMax,
        decodedMin: hullSdf.decodedMin,
        decodedMax: hullSdf.decodedMax,
        consistency: hullConsistency,
      },
    },
    isoBand: {
      lowQuantile: band.qLow,
      highQuantile: band.qHigh,
      low: band.low,
      high: band.high,
      levels: RICCI_LEVELS,
      shellBandMinM: SHELL_BAND_MIN_M,
      shellBandMaxM: SHELL_BAND_MAX_M,
      shellContourM: SHELL_CONTOUR_M,
    },
    outputs,
  };
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        inputPath,
        metadataPath,
        isoBand: metadata.isoBand,
        method: metadata.method,
        outputs,
      },
      null,
      2,
    )}\n`,
  );
};

run().catch((error) => {
  process.stderr.write(`${String(error instanceof Error ? error.message : error)}\n`);
  process.exitCode = 1;
});
