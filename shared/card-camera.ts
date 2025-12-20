import { HULL_BASIS_IDENTITY } from "./hull-basis";
import type { CardCameraPreset, HullBasisResolved, HullPreviewOBB } from "./schema";

type Vec3 = [number, number, number];

export type CardCameraOrbit = {
  preset: CardCameraPreset;
  eye: Vec3;
  target: Vec3;
  up: Vec3;
  fov_deg: number;
  radius_m: number;
  yaw_deg: number;
  pitch_deg: number;
};

type FrameCameraOpts = {
  preset?: CardCameraPreset | null;
  obb?: Partial<HullPreviewOBB> | null;
  halfSize?: Vec3 | null;
  domainScale?: number;
  fov_deg?: number;
  minRadius?: number;
  yawOffset_rad?: number;
  basis?: HullBasisResolved | null;
};

const normalize = (vec: Vec3, fallback: Vec3): Vec3 => {
  const m = Math.hypot(vec[0], vec[1], vec[2]);
  if (!Number.isFinite(m) || m < 1e-9) return fallback;
  return [vec[0] / m, vec[1] / m, vec[2] / m];
};

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const negate = (v: Vec3): Vec3 => [-v[0], -v[1], -v[2]];

const rotateAroundAxis = (vec: Vec3, axis: Vec3, angle: number): Vec3 => {
  const k = normalize(axis, [0, 1, 0]);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const vDotK = dot(vec, k);
  return [
    vec[0] * c + s * (k[1] * vec[2] - k[2] * vec[1]) + (1 - c) * vDotK * k[0],
    vec[1] * c + s * (k[2] * vec[0] - k[0] * vec[2]) + (1 - c) * vDotK * k[1],
    vec[2] * c + s * (k[0] * vec[1] - k[1] * vec[0]) + (1 - c) * vDotK * k[2],
  ];
};

const pickHalfSize = (value?: Vec3 | null): Vec3 | null => {
  if (!value || !Array.isArray(value) || value.length < 3) return null;
  const nx = Math.abs(Number(value[0]));
  const ny = Math.abs(Number(value[1]));
  const nz = Math.abs(Number(value[2]));
  if (![nx, ny, nz].every((v) => Number.isFinite(v) && v > 0)) return null;
  return [nx, ny, nz];
};

export function frameCardCameraToObb(opts: FrameCameraOpts): CardCameraOrbit {
  const preset = opts.preset ?? "threeQuarterFront";
  const domainScale = Number.isFinite(opts.domainScale) ? Math.max(0.01, opts.domainScale as number) : 1;
  const half = (pickHalfSize((opts.obb as any)?.halfSize) ?? pickHalfSize(opts.halfSize)) ?? [1, 1, 1];
  const scaledHalf: Vec3 = [half[0] * domainScale, half[1] * domainScale, half[2] * domainScale];
  const center = (() => {
    const c = (opts.obb as any)?.center;
    if (Array.isArray(c) && c.length >= 3) {
      const x = Number(c[0]);
      const y = Number(c[1]);
      const z = Number(c[2]);
      if ([x, y, z].every((v) => Number.isFinite(v))) return [x, y, z] as Vec3;
    }
    return [0, 0, 0] as Vec3;
  })();
  const axesRaw = Array.isArray((opts.obb as any)?.axes) ? ((opts.obb as any).axes as Vec3[]) : null;
  const basisResolved: HullBasisResolved = opts.basis ?? HULL_BASIS_IDENTITY;
  let right = normalize(
    (axesRaw?.[0] as Vec3) ?? (basisResolved as any).right ?? HULL_BASIS_IDENTITY.right,
    HULL_BASIS_IDENTITY.right,
  );
  let up = normalize(
    (axesRaw?.[1] as Vec3) ?? (basisResolved as any).up ?? HULL_BASIS_IDENTITY.up,
    HULL_BASIS_IDENTITY.up,
  );
  let forward = normalize(
    (axesRaw?.[2] as Vec3) ?? (basisResolved as any).forward ?? HULL_BASIS_IDENTITY.forward,
    HULL_BASIS_IDENTITY.forward,
  );
  // OBB axes are sign-ambiguous; keep camera "upright" by forcing up to the same hemisphere as world +Y.
  // Flip both up and right (leaving forward intact) to preserve handedness while avoiding upside-down orbits.
  if (dot(up, HULL_BASIS_IDENTITY.up) < 0) {
    up = negate(up);
    right = negate(right);
  }

  const weights: Record<CardCameraPreset, { right: number; up: number; forward: number; distanceScale?: number }> = {
    threeQuarterFront: { forward: 1.0, right: 0.7, up: 0.4, distanceScale: 1.0 },
    broadside: { forward: 0.05, right: 1.0, up: 0.25, distanceScale: 1.05 },
    topDown: { forward: 0.08, right: 0.08, up: 1.0, distanceScale: 0.95 },
    inside: { forward: 0.9, right: 0.35, up: 0.2, distanceScale: 0.45 },
    outside: { forward: 1.0, right: 0.65, up: 0.35, distanceScale: 1.6 },
    wallGrazing: { forward: 0.12, right: 1.0, up: 0.12, distanceScale: 0.85 },
  };

  const w = weights[preset] ?? weights.threeQuarterFront;
  const baseDir: Vec3 = normalize(
    [
      forward[0] * w.forward + right[0] * w.right + up[0] * w.up,
      forward[1] * w.forward + right[1] * w.right + up[1] * w.up,
      forward[2] * w.forward + right[2] * w.right + up[2] * w.up,
    ],
    forward,
  );
  const yawOffset = Number.isFinite(opts.yawOffset_rad) ? (opts.yawOffset_rad as number) : 0;
  const dir = Math.abs(yawOffset) > 1e-6 ? rotateAroundAxis(baseDir, up, yawOffset) : baseDir;
  const maxHalf = Math.max(scaledHalf[0], scaledHalf[1], scaledHalf[2], 1e-3);
  const baseRadius = Math.max(maxHalf * 1.35, opts.minRadius ?? 0, 0);
  const radius = baseRadius * (w.distanceScale ?? 1);
  const eye: Vec3 = [
    center[0] + dir[0] * radius,
    center[1] + dir[1] * radius,
    center[2] + dir[2] * radius,
  ];
  const dirRight = dot(dir, right);
  const dirForward = dot(dir, forward);
  const dirUp = dot(dir, up);
  const yaw = Math.atan2(dirRight, dirForward);
  const pitch = Math.atan2(dirUp, Math.max(1e-6, Math.hypot(dirRight, dirForward)));
  const fov_deg = Number.isFinite(opts.fov_deg) ? (opts.fov_deg as number) : 45;

  return {
    preset,
    eye,
    target: center,
    up,
    fov_deg,
    radius_m: radius,
    yaw_deg: (yaw * 180) / Math.PI,
    pitch_deg: (pitch * 180) / Math.PI,
  };
}
