import type { Vec3 } from "./brick-io.js";

export interface Triangle {
  a: Vec3;
  b: Vec3;
  c: Vec3;
  color: [number, number, number, number];
}

export interface SceneTransform {
  dims: Vec3;
  origin: Vec3;
  spacing: Vec3;
  center: Vec3;
  scale: number;
  preservePhysicalAxes: boolean;
}

export interface LayerStyle {
  color?: [number, number, number, number];
  colorBy?: "sdf" | "constant";
  alpha?: number;
}

const EPS = 1e-45;
const TETS = [
  [0, 5, 1, 6],
  [0, 1, 2, 6],
  [0, 2, 3, 6],
  [0, 3, 7, 6],
  [0, 7, 4, 6],
  [0, 4, 5, 6],
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

interface VertexSample {
  p: Vec3;
  f: number;
  w: number;
}

export function buildSceneTransform(
  dims: Vec3,
  origin: Vec3,
  spacing: Vec3,
  options: { preservePhysicalAxes?: boolean } = {},
): SceneTransform {
  const span: Vec3 = [
    spacing[0] * (dims[0] - 1),
    spacing[1] * (dims[1] - 1),
    spacing[2] * (dims[2] - 1),
  ];
  const center: Vec3 = [
    origin[0] + span[0] / 2,
    origin[1] + span[1] / 2,
    origin[2] + span[2] / 2,
  ];
  const maxSpan = Math.max(span[0], span[1], span[2], 1);
  return {
    dims,
    origin,
    spacing,
    center,
    scale: 2 / maxSpan,
    preservePhysicalAxes: options.preservePhysicalAxes ?? true,
  };
}

export function selectIsoBand(values: Float32Array, levelCount = 7): number[] {
  const positive = Array.from(values)
    .map((v) => Math.log10(Math.max(Math.abs(v), EPS)))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  if (positive.length === 0) return [];

  const levels: number[] = [];
  for (let i = 0; i < levelCount; i += 1) {
    const q = 0.72 + (i / Math.max(1, levelCount - 1)) * 0.255;
    levels.push(10 ** quantile(positive, q));
  }
  return Array.from(new Set(levels.map((v) => Number(v.toPrecision(4))))).sort((a, b) => a - b);
}

export function buildRicciIsoMesh(
  dims: Vec3,
  sceneTransform: SceneTransform,
  ricci4: Float32Array,
  hullSdf?: Float32Array,
  options: {
    levels?: number[];
    levelCount?: number;
    shellBandMinM?: number;
    shellBandMaxM?: number;
    stride?: number;
  } = {},
): Triangle[] {
  const levels = options.levels ?? selectIsoBand(ricci4, options.levelCount ?? 7);
  const stride = options.stride ?? 1;
  const shellBandMinM = options.shellBandMinM ?? 0;
  const shellBandMaxM = options.shellBandMaxM ?? 80;
  const triangles: Triangle[] = [];

  for (const level of levels) {
    for (let z = 0; z < dims[2] - 1; z += stride) {
      for (let y = 0; y < dims[1] - 1; y += stride) {
        for (let x = 0; x < dims[0] - 1; x += stride) {
          const samples = CORNERS.map(([dx, dy, dz]) => {
            const gx = Math.min(x + dx * stride, dims[0] - 1);
            const gy = Math.min(y + dy * stride, dims[1] - 1);
            const gz = Math.min(z + dz * stride, dims[2] - 1);
            const index = idx3(gx, gy, gz, dims);
            const absValue = Math.abs(ricci4[index]);
            const signedDistance = hullSdf ? hullSdf[index] : 0;
            const inShellBand =
              !hullSdf || (signedDistance >= shellBandMinM && signedDistance <= shellBandMaxM);
            return {
              p: gridToScene(gx, gy, gz, sceneTransform),
              f: inShellBand ? Math.log10(Math.max(absValue, EPS)) - Math.log10(level) : -999,
              w: absValue,
            };
          });

          for (const tet of TETS) {
            const tetSamples = tet.map((cornerIndex) => samples[cornerIndex]);
            const color = natarioColormap(Math.log10(level), Math.log10(levels[0]), Math.log10(levels[levels.length - 1]), 212);
            triangles.push(...buildTetTriangles(tetSamples, color));
          }
        }
      }
    }
  }

  return triangles;
}

export function buildHullIsoMesh(
  dims: Vec3,
  sceneTransform: SceneTransform,
  hullSdf: Float32Array,
  options: { isoLevel?: number; color?: [number, number, number, number]; stride?: number } = {},
): Triangle[] {
  return buildSdfIsoMesh(dims, sceneTransform, hullSdf, options.isoLevel ?? 0, {
    color: options.color ?? [216, 224, 220, 60],
    alpha: options.color?.[3] ?? 60,
  }, options.stride);
}

export function buildSdfIsoMesh(
  dims: Vec3,
  sceneTransform: SceneTransform,
  sdfField: Float32Array,
  isoLevel: number,
  layerStyle: LayerStyle = {},
  stride = 1,
): Triangle[] {
  const triangles: Triangle[] = [];
  const baseColor = layerStyle.color ?? [112, 225, 229, layerStyle.alpha ?? 96];

  for (let z = 0; z < dims[2] - 1; z += stride) {
    for (let y = 0; y < dims[1] - 1; y += stride) {
      for (let x = 0; x < dims[0] - 1; x += stride) {
        const samples = CORNERS.map(([dx, dy, dz]) => {
          const gx = Math.min(x + dx * stride, dims[0] - 1);
          const gy = Math.min(y + dy * stride, dims[1] - 1);
          const gz = Math.min(z + dz * stride, dims[2] - 1);
          const index = idx3(gx, gy, gz, dims);
          return {
            p: gridToScene(gx, gy, gz, sceneTransform),
            f: sdfField[index] - isoLevel,
            w: sdfField[index],
          };
        });

        for (const tet of TETS) {
          const tetSamples = tet.map((cornerIndex) => samples[cornerIndex]);
          const color =
            layerStyle.colorBy === "sdf"
              ? natarioColormap(isoLevel, -80, 80, layerStyle.alpha ?? 120)
              : baseColor;
          triangles.push(...buildTetTriangles(tetSamples, color));
        }
      }
    }
  }

  return triangles;
}

export function buildSdfBandMeshes(
  dims: Vec3,
  sceneTransform: SceneTransform,
  sdfField: Float32Array,
  isoLevels: number[],
  layerStyles: LayerStyle[],
  stride = 1,
): Triangle[] {
  const meshes: Triangle[] = [];
  for (let i = 0; i < isoLevels.length; i += 1) {
    meshes.push(...buildSdfIsoMesh(dims, sceneTransform, sdfField, isoLevels[i], layerStyles[i] ?? {}, stride));
  }
  return meshes;
}

function idx3(x: number, y: number, z: number, dims: Vec3): number {
  return x + dims[0] * (y + dims[1] * z);
}

function gridToScene(x: number, y: number, z: number, transform: SceneTransform): Vec3 {
  const wx = transform.origin[0] + x * transform.spacing[0];
  const wy = transform.origin[1] + y * transform.spacing[1];
  const wz = transform.origin[2] + z * transform.spacing[2];
  return [
    (wx - transform.center[0]) * transform.scale,
    (wy - transform.center[1]) * transform.scale,
    (wz - transform.center[2]) * transform.scale,
  ];
}

function quantile(sorted: number[], q: number): number {
  const pos = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
  return sorted[pos];
}

function buildTetTriangles(samples: VertexSample[], color: [number, number, number, number]): Triangle[] {
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3],
  ];
  const points: Vec3[] = [];

  for (const [i, j] of edges) {
    const a = samples[i];
    const b = samples[j];
    if ((a.f < 0 && b.f >= 0) || (a.f >= 0 && b.f < 0)) {
      const t = a.f / (a.f - b.f);
      points.push([
        a.p[0] + t * (b.p[0] - a.p[0]),
        a.p[1] + t * (b.p[1] - a.p[1]),
        a.p[2] + t * (b.p[2] - a.p[2]),
      ]);
    }
  }

  if (points.length < 3) return [];
  if (points.length === 3) return [{ a: points[0], b: points[1], c: points[2], color }];
  return [
    { a: points[0], b: points[1], c: points[2], color },
    { a: points[0], b: points[2], c: points[3], color },
  ];
}

function natarioColormap(value: number, min: number, max: number, alpha: number): [number, number, number, number] {
  const t = Math.max(0, Math.min(1, (value - min) / Math.max(1e-12, max - min)));
  const stops: [number, [number, number, number]][] = [
    [0, [33, 58, 186]],
    [0.23, [19, 149, 202]],
    [0.45, [133, 209, 106]],
    [0.62, [250, 224, 92]],
    [0.78, [246, 143, 45]],
    [1, [216, 39, 39]],
  ];
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [aT, aC] = stops[i];
    const [bT, bC] = stops[i + 1];
    if (t >= aT && t <= bT) {
      const u = (t - aT) / (bT - aT);
      return [
        Math.round(aC[0] + u * (bC[0] - aC[0])),
        Math.round(aC[1] + u * (bC[1] - aC[1])),
        Math.round(aC[2] + u * (bC[2] - aC[2])),
        alpha,
      ];
    }
  }
  return [216, 39, 39, alpha];
}
