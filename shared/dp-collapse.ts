import { z } from "zod";
import { G, HBAR, PI } from "./physics-const";

export type Vec3 = [number, number, number];

const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
const Vec3Positive = z.tuple([z.number().positive(), z.number().positive(), z.number().positive()]);
const Vec3IntPositive = z.tuple([
  z.number().int().positive(),
  z.number().int().positive(),
  z.number().int().positive(),
]);

const stripDataUrlPrefix = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed.startsWith("data:")) {
    const comma = trimmed.indexOf(",");
    if (comma >= 0) {
      return trimmed.slice(comma + 1).replace(/\s+/g, "");
    }
  }
  return trimmed.replace(/\s+/g, "");
};

export const Float32VolumeB64 = z.object({
  encoding: z.literal("base64"),
  dtype: z.literal("float32"),
  endian: z.literal("little"),
  order: z.literal("row-major"),
  data_b64: z.preprocess(stripDataUrlPrefix, z.string().min(1)),
});
export type TFloat32VolumeB64 = z.infer<typeof Float32VolumeB64>;

export const DpGridSpec = z.object({
  dims: Vec3IntPositive,
  voxel_size_m: Vec3Positive,
  origin_m: Vec3Schema.default([0, 0, 0]),
});
export type TDpGridSpec = z.infer<typeof DpGridSpec>;

const DpSphere = z.object({
  kind: z.literal("sphere"),
  mass_kg: z.number().positive(),
  radius_m: z.number().positive(),
  center_m: Vec3Schema.default([0, 0, 0]),
});

const DpShell = z.object({
  kind: z.literal("shell"),
  mass_kg: z.number().positive(),
  inner_radius_m: z.number().nonnegative(),
  outer_radius_m: z.number().positive(),
  center_m: Vec3Schema.default([0, 0, 0]),
});

const DpGaussian = z.object({
  kind: z.literal("gaussian"),
  mass_kg: z.number().positive(),
  sigma_m: z.number().positive(),
  center_m: Vec3Schema.default([0, 0, 0]),
});

export const DpMassPrimitive = z.discriminatedUnion("kind", [DpSphere, DpShell, DpGaussian]);
export type TDpMassPrimitive = z.infer<typeof DpMassPrimitive>;

export const DpMassDistribution = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("analytic"),
    primitives: z.array(DpMassPrimitive).default([]),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("density_grid"),
    rho_kg_m3: Float32VolumeB64,
    grid: DpGridSpec.optional(),
    lattice_generation_hash: z.string().optional(),
    label: z.string().optional(),
  }),
]);
export type TDpMassDistribution = z.infer<typeof DpMassDistribution>;

export const DpSideEffectInput = z.object({
  model: z.string().min(1),
  heating_W_kg: z.number().nonnegative().optional(),
  momentum_diffusion_kg2_m2_s3: z.number().nonnegative().optional(),
  force_noise_N2_Hz: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});
export type TDpSideEffectInput = z.infer<typeof DpSideEffectInput>;

export const DpSideEffectDiagnostics = DpSideEffectInput.extend({
  status: z.enum(["provided", "missing_inputs"]),
});
export type TDpSideEffectDiagnostics = z.infer<typeof DpSideEffectDiagnostics>;

export const DpConstraintInput = z.object({
  heating_W_kg_max: z.number().positive().optional(),
  momentum_diffusion_kg2_m2_s3_max: z.number().positive().optional(),
  force_noise_N2_Hz_max: z.number().positive().optional(),
});
export type TDpConstraintInput = z.infer<typeof DpConstraintInput>;

export const DpCollapseInput = z.object({
  schema_version: z.literal("dp_collapse/1"),
  ell_m: z.number().positive(),
  grid: DpGridSpec,
  branch_a: DpMassDistribution,
  branch_b: DpMassDistribution,
  r_c_m: z.number().positive().optional(),
  coarse_graining: z
    .object({
      model: z.enum(["voxel_average", "gaussian"]).default("voxel_average"),
      notes: z.string().optional(),
    })
    .optional(),
  method: z
    .object({
      kernel: z.enum(["plummer"]).default("plummer"),
      max_voxels: z.number().int().positive().default(4096),
    })
    .optional(),
  side_effects: DpSideEffectInput.optional(),
  constraints: DpConstraintInput.optional(),
  seed: z.string().optional(),
  notes: z.array(z.string()).optional(),
});
export type TDpCollapseInput = z.infer<typeof DpCollapseInput>;

export type DpDownsampleMeta = {
  original_dims: Vec3;
  used_dims: Vec3;
  original_voxel_size_m: Vec3;
  used_voxel_size_m: Vec3;
  scale: Vec3;
};

export type DpCollapseResult = {
  deltaE_J: number;
  tau_s: number;
  tau_ms: number;
  tau_infinite: boolean;
  ell_m: number;
  kernel: "plummer";
  method: "exact" | "downsampled";
  downsample?: DpDownsampleMeta;
  grid: TDpGridSpec;
  mass_a_kg: number;
  mass_b_kg: number;
  overlap_mass_kg: number;
  overlap_fraction_min_mass: number;
  components: {
    self_a_J: number;
    self_b_J: number;
    cross_J: number;
  };
  side_effects?: TDpSideEffectDiagnostics;
  constraints?: {
    status: "ok" | "exceeds" | "missing_inputs";
    checks: Array<{ name: string; value?: number; limit?: number; ok?: boolean }>;
  };
  notes?: string[];
};

export const DpCollapseResultSchema = z.object({
  deltaE_J: z.number().nonnegative(),
  tau_s: z.number().positive(),
  tau_ms: z.number().positive(),
  tau_infinite: z.boolean(),
  ell_m: z.number().positive(),
  kernel: z.literal("plummer"),
  method: z.enum(["exact", "downsampled"]),
  downsample: z
    .object({
      original_dims: Vec3Schema,
      used_dims: Vec3Schema,
      original_voxel_size_m: Vec3Schema,
      used_voxel_size_m: Vec3Schema,
      scale: Vec3Schema,
    })
    .optional(),
  grid: DpGridSpec,
  mass_a_kg: z.number().nonnegative(),
  mass_b_kg: z.number().nonnegative(),
  overlap_mass_kg: z.number().nonnegative(),
  overlap_fraction_min_mass: z.number().nonnegative(),
  components: z.object({
    self_a_J: z.number().nonnegative(),
    self_b_J: z.number().nonnegative(),
    cross_J: z.number().nonnegative(),
  }),
  side_effects: DpSideEffectDiagnostics.optional(),
  constraints: z
    .object({
      status: z.enum(["ok", "exceeds", "missing_inputs"]),
      checks: z.array(
        z.object({
          name: z.string().min(1),
          value: z.number().optional(),
          limit: z.number().optional(),
          ok: z.boolean().optional(),
        }),
      ),
    })
    .optional(),
  notes: z.array(z.string()).optional(),
});

const TWO_PI = 2 * PI;

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

const decodeFloat32 = (payload: TFloat32VolumeB64, expectedLength: number): Float32Array => {
  const data = payload.data_b64.trim();
  const buffer = (() => {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(data, "base64");
    }
    if (typeof atob === "function") {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    throw new Error("base64 decode unavailable in this runtime");
  })();

  const byteLength = buffer.byteLength;
  const floatCount = Math.floor(byteLength / 4);
  if (floatCount < expectedLength) {
    throw new Error(`density_field_length_mismatch: expected ${expectedLength}, got ${floatCount}`);
  }
  const view =
    buffer instanceof Uint8Array
      ? new Float32Array(buffer.buffer, buffer.byteOffset, expectedLength)
      : new Float32Array(buffer.buffer, buffer.byteOffset, expectedLength);
  return new Float32Array(view);
};

const buildGridCenters = (grid: TDpGridSpec): { x: number[]; y: number[]; z: number[] } => {
  const [nx, ny, nz] = grid.dims;
  const [dx, dy, dz] = grid.voxel_size_m;
  const [ox, oy, oz] = grid.origin_m;
  const x: number[] = new Array(nx);
  const y: number[] = new Array(ny);
  const z: number[] = new Array(nz);
  const cx = (nx - 1) / 2;
  const cy = (ny - 1) / 2;
  const cz = (nz - 1) / 2;
  for (let ix = 0; ix < nx; ix += 1) x[ix] = (ix - cx) * dx + ox;
  for (let iy = 0; iy < ny; iy += 1) y[iy] = (iy - cy) * dy + oy;
  for (let iz = 0; iz < nz; iz += 1) z[iz] = (iz - cz) * dz + oz;
  return { x, y, z };
};

const massDensityAt = (primitive: TDpMassPrimitive, x: number, y: number, z: number): number => {
  const dx = x - primitive.center_m[0];
  const dy = y - primitive.center_m[1];
  const dz = z - primitive.center_m[2];
  const r2 = dx * dx + dy * dy + dz * dz;

  switch (primitive.kind) {
    case "sphere": {
      const r = primitive.radius_m;
      if (r2 > r * r) return 0;
      const volume = (4 / 3) * PI * r * r * r;
      return primitive.mass_kg / Math.max(1e-30, volume);
    }
    case "shell": {
      const rInner = primitive.inner_radius_m;
      const rOuter = primitive.outer_radius_m;
      if (r2 < rInner * rInner || r2 > rOuter * rOuter) return 0;
      const volume = (4 / 3) * PI * (Math.pow(rOuter, 3) - Math.pow(rInner, 3));
      return primitive.mass_kg / Math.max(1e-30, volume);
    }
    case "gaussian": {
      const sigma = primitive.sigma_m;
      const norm = primitive.mass_kg / (Math.pow(TWO_PI, 1.5) * Math.pow(sigma, 3));
      return norm * Math.exp(-r2 / (2 * sigma * sigma));
    }
    default:
      return 0;
  }
};

const validateAnalyticPrimitives = (primitives: TDpMassPrimitive[]): void => {
  for (const primitive of primitives) {
    if (primitive.kind !== "shell") continue;
    if (!(primitive.outer_radius_m > primitive.inner_radius_m)) {
      throw new Error("dp_shell_invalid: outer_radius_m must exceed inner_radius_m");
    }
  }
};

const buildAnalyticDensity = (primitives: TDpMassPrimitive[], grid: TDpGridSpec): Float32Array => {
  const [nx, ny, nz] = grid.dims;
  const { x, y, z } = buildGridCenters(grid);
  const out = new Float32Array(nx * ny * nz);
  let idx = 0;
  for (let iz = 0; iz < nz; iz += 1) {
    const zc = z[iz];
    for (let iy = 0; iy < ny; iy += 1) {
      const yc = y[iy];
      for (let ix = 0; ix < nx; ix += 1) {
        const xc = x[ix];
        let rho = 0;
        for (const primitive of primitives) {
          rho += massDensityAt(primitive, xc, yc, zc);
        }
        out[idx] = rho;
        idx += 1;
      }
    }
  }
  return out;
};

const resolveBranchDensity = (
  branch: TDpMassDistribution,
  grid: TDpGridSpec,
): { rho: Float32Array; label?: string; lattice_generation_hash?: string } => {
  if (branch.kind === "analytic") {
    validateAnalyticPrimitives(branch.primitives);
    return {
      rho: buildAnalyticDensity(branch.primitives, grid),
      label: branch.label,
    };
  }

  if (branch.grid) {
    const matchDims = branch.grid.dims.every((v, i) => v === grid.dims[i]);
    const matchVoxel = branch.grid.voxel_size_m.every((v, i) => v === grid.voxel_size_m[i]);
    if (!matchDims || !matchVoxel) {
      throw new Error("density_grid_mismatch: branch grid does not match DP grid");
    }
  }
  const expectedLength = grid.dims[0] * grid.dims[1] * grid.dims[2];
  return {
    rho: decodeFloat32(branch.rho_kg_m3, expectedLength),
    label: branch.label,
    lattice_generation_hash: branch.lattice_generation_hash,
  };
};

const chooseDownsampleDims = (dims: Vec3, maxVoxels: number): { dims: Vec3; scale: Vec3 } => {
  const [nx, ny, nz] = dims;
  const total = nx * ny * nz;
  if (total <= maxVoxels) {
    return { dims: [nx, ny, nz], scale: [1, 1, 1] };
  }
  const ratio = Math.cbrt(maxVoxels / total);
  const next = (n: number) => Math.max(1, Math.floor(n * ratio));
  const nx2 = next(nx);
  const ny2 = next(ny);
  const nz2 = next(nz);
  const scale: Vec3 = [nx / nx2, ny / ny2, nz / nz2];
  return { dims: [nx2, ny2, nz2], scale };
};

const downsampleDensity = (
  rho: Float32Array,
  grid: TDpGridSpec,
  targetDims: Vec3,
  scale: Vec3,
): { rho: Float32Array; grid: TDpGridSpec } => {
  const [nx, ny, nz] = grid.dims;
  const [nx2, ny2, nz2] = targetDims;
  const [dx, dy, dz] = grid.voxel_size_m;
  const [sx, sy, sz] = scale;
  const newGrid: TDpGridSpec = {
    dims: targetDims,
    voxel_size_m: [dx * sx, dy * sy, dz * sz],
    origin_m: grid.origin_m,
  };

  const out = new Float32Array(nx2 * ny2 * nz2);
  const dV = dx * dy * dz;
  const newDv = newGrid.voxel_size_m[0] * newGrid.voxel_size_m[1] * newGrid.voxel_size_m[2];

  for (let iz = 0; iz < nz; iz += 1) {
    const iz2 = Math.min(nz2 - 1, Math.floor(iz / sz));
    for (let iy = 0; iy < ny; iy += 1) {
      const iy2 = Math.min(ny2 - 1, Math.floor(iy / sy));
      for (let ix = 0; ix < nx; ix += 1) {
        const ix2 = Math.min(nx2 - 1, Math.floor(ix / sx));
        const idx = ix + nx * (iy + ny * iz);
        const idx2 = ix2 + nx2 * (iy2 + ny2 * iz2);
        out[idx2] += rho[idx] * dV;
      }
    }
  }

  for (let i = 0; i < out.length; i += 1) {
    out[i] = out[i] / Math.max(1e-30, newDv);
  }

  return { rho: out, grid: newGrid };
};

const computeMass = (rho: Float32Array, dV: number): number => {
  let sum = 0;
  for (let i = 0; i < rho.length; i += 1) sum += rho[i] * dV;
  return sum;
};

const computeOverlapMass = (rhoA: Float32Array, rhoB: Float32Array, dV: number): number => {
  let sum = 0;
  for (let i = 0; i < rhoA.length; i += 1) {
    const a = rhoA[i];
    const b = rhoB[i];
    if (a <= 0 || b <= 0) continue;
    sum += Math.min(a, b) * dV;
  }
  return sum;
};

const computePairwiseEnergy = (
  rhoA: Float32Array,
  rhoB: Float32Array,
  grid: TDpGridSpec,
  ell_m: number,
): { selfA: number; selfB: number; cross: number; delta: number } => {
  const [nx, ny, nz] = grid.dims;
  const { x, y, z } = buildGridCenters(grid);
  const dV = grid.voxel_size_m[0] * grid.voxel_size_m[1] * grid.voxel_size_m[2];
  const n = rhoA.length;

  let sumDelta = 0;
  let sumA = 0;
  let sumB = 0;
  let sumCross = 0;

  for (let iz = 0; iz < nz; iz += 1) {
    const zc = z[iz];
    for (let iy = 0; iy < ny; iy += 1) {
      const yc = y[iy];
      for (let ix = 0; ix < nx; ix += 1) {
        const idx = ix + nx * (iy + ny * iz);
        const rhoAi = rhoA[idx];
        const rhoBi = rhoB[idx];
        const deltaI = rhoAi - rhoBi;
        if (rhoAi === 0 && rhoBi === 0) {
          continue;
        }
        const xi = x[ix];

        for (let jz = iz; jz < nz; jz += 1) {
          const zcj = z[jz];
          for (let jy = jz === iz ? iy : 0; jy < ny; jy += 1) {
            const ycj = y[jy];
            const jxStart = jz === iz && jy === iy ? ix : 0;
            for (let jx = jxStart; jx < nx; jx += 1) {
              const jdx = jx + nx * (jy + ny * jz);
              const rhoAj = rhoA[jdx];
              const rhoBj = rhoB[jdx];
              if (rhoAj === 0 && rhoBj === 0) continue;
              const deltaJ = rhoAj - rhoBj;
              const dx = xi - x[jx];
              const dy = yc - ycj;
              const dz = zc - zcj;
              const r2 = dx * dx + dy * dy + dz * dz;
              const kernel = 1 / Math.sqrt(r2 + ell_m * ell_m);
              const weight = jdx === idx ? 1 : 2;
              sumDelta += weight * deltaI * deltaJ * kernel;
              sumA += weight * rhoAi * rhoAj * kernel;
              sumB += weight * rhoBi * rhoBj * kernel;
              sumCross += weight * rhoAi * rhoBj * kernel;
            }
          }
        }
      }
    }
  }

  const scale = 0.5 * G * dV * dV;
  return {
    delta: scale * sumDelta,
    selfA: scale * sumA,
    selfB: scale * sumB,
    cross: scale * sumCross,
  };
};

const normalizeSideEffects = (input: TDpSideEffectInput | undefined): TDpSideEffectDiagnostics | undefined => {
  if (!input) return undefined;
  const hasValues =
    isFiniteNumber(input.heating_W_kg ?? NaN) ||
    isFiniteNumber(input.momentum_diffusion_kg2_m2_s3 ?? NaN) ||
    isFiniteNumber(input.force_noise_N2_Hz ?? NaN);
  return {
    ...input,
    status: hasValues ? "provided" : "missing_inputs",
  };
};

const evaluateConstraints = (
  sideEffects: TDpSideEffectDiagnostics | undefined,
  constraints: TDpConstraintInput | undefined,
): DpCollapseResult["constraints"] | undefined => {
  if (!constraints) return undefined;
  const checks: Array<{ name: string; value?: number; limit?: number; ok?: boolean }> = [];
  const addCheck = (name: string, value: number | undefined, limit: number | undefined) => {
    if (!Number.isFinite(limit ?? NaN)) {
      checks.push({ name, value });
      return;
    }
    if (!Number.isFinite(value ?? NaN)) {
      checks.push({ name, limit, ok: false });
      return;
    }
    checks.push({ name, value, limit, ok: (value as number) <= (limit as number) });
  };

  addCheck("heating_W_kg", sideEffects?.heating_W_kg, constraints.heating_W_kg_max);
  addCheck(
    "momentum_diffusion_kg2_m2_s3",
    sideEffects?.momentum_diffusion_kg2_m2_s3,
    constraints.momentum_diffusion_kg2_m2_s3_max,
  );
  addCheck("force_noise_N2_Hz", sideEffects?.force_noise_N2_Hz, constraints.force_noise_N2_Hz_max);

  const hasMissing = checks.some((c) => c.ok === false && c.value === undefined);
  const hasExceeds = checks.some((c) => c.ok === false && c.value !== undefined);
  const status = hasMissing ? "missing_inputs" : hasExceeds ? "exceeds" : "ok";

  return { status, checks };
};

export const computeDpCollapse = (input: TDpCollapseInput): DpCollapseResult => {
  const parsed = DpCollapseInput.parse(input);
  const grid = parsed.grid;
  const maxVoxels = parsed.method?.max_voxels ?? 4096;

  const downsample = chooseDownsampleDims(grid.dims, maxVoxels);
  let workingGrid = grid;

  const branchA = resolveBranchDensity(parsed.branch_a, grid);
  const branchB = resolveBranchDensity(parsed.branch_b, grid);

  let rhoA = branchA.rho;
  let rhoB = branchB.rho;

  let downsampleMeta: DpDownsampleMeta | undefined;

  if (downsample.scale.some((v) => v > 1.001)) {
    const downA = downsampleDensity(rhoA, grid, downsample.dims, downsample.scale);
    const downB = downsampleDensity(rhoB, grid, downsample.dims, downsample.scale);
    rhoA = downA.rho;
    rhoB = downB.rho;
    workingGrid = downA.grid;
    downsampleMeta = {
      original_dims: grid.dims,
      used_dims: downsample.dims,
      original_voxel_size_m: grid.voxel_size_m,
      used_voxel_size_m: workingGrid.voxel_size_m,
      scale: downsample.scale,
    };
  }

  const dV = workingGrid.voxel_size_m[0] * workingGrid.voxel_size_m[1] * workingGrid.voxel_size_m[2];
  const massA = computeMass(rhoA, dV);
  const massB = computeMass(rhoB, dV);
  const overlapMass = computeOverlapMass(rhoA, rhoB, dV);
  const overlapFraction = overlapMass / Math.max(1e-30, Math.min(massA, massB));

  const energy = computePairwiseEnergy(rhoA, rhoB, workingGrid, parsed.ell_m);
  const deltaE_J = Math.max(0, energy.delta);
  const selfA = Math.max(0, energy.selfA);
  const selfB = Math.max(0, energy.selfB);
  const cross = Math.max(0, energy.cross);
  const tau_infinite = !(deltaE_J > 0);
  const tau_s = tau_infinite ? 1e30 : HBAR / deltaE_J;
  const tau_ms = tau_s * 1000;

  const sideEffects = normalizeSideEffects(parsed.side_effects);
  const constraints = evaluateConstraints(sideEffects, parsed.constraints);

  return {
    deltaE_J,
    tau_s,
    tau_ms,
    tau_infinite,
    ell_m: parsed.ell_m,
    kernel: "plummer",
    method: downsampleMeta ? "downsampled" : "exact",
    downsample: downsampleMeta,
    grid: workingGrid,
    mass_a_kg: massA,
    mass_b_kg: massB,
    overlap_mass_kg: overlapMass,
    overlap_fraction_min_mass: overlapFraction,
    components: {
      self_a_J: selfA,
      self_b_J: selfB,
      cross_J: cross,
    },
    side_effects: sideEffects,
    constraints,
    notes: parsed.notes,
  };
};

export const dpDeltaEPointPairPlummer = (mass_kg: number, separation_m: number, ell_m: number): number => {
  if (!(mass_kg > 0 && separation_m >= 0 && ell_m > 0)) return Number.NaN;
  const self = 1 / ell_m;
  const cross = 1 / Math.sqrt(separation_m * separation_m + ell_m * ell_m);
  return G * mass_kg * mass_kg * (2 * self - 2 * cross);
};

export const dpSelfEnergyUniformSphere = (mass_kg: number, radius_m: number): number => {
  if (!(mass_kg > 0 && radius_m > 0)) return Number.NaN;
  return (3 / 5) * G * mass_kg * mass_kg / radius_m;
};

export const dpSelfEnergyUniformShell = (
  mass_kg: number,
  inner_radius_m: number,
  outer_radius_m: number,
): number => {
  if (!(mass_kg > 0 && outer_radius_m > inner_radius_m && inner_radius_m >= 0)) return Number.NaN;
  const a = inner_radius_m;
  const b = outer_radius_m;
  const denom = b * b * b - a * a * a;
  if (!(denom > 0)) return Number.NaN;
  const term = (b ** 5 - a ** 5) / 5 - 0.5 * a * a * a * (b * b - a * a);
  return (3 * G * mass_kg * mass_kg * term) / (denom * denom);
};

export const dpSelfEnergyThinShell = (mass_kg: number, radius_m: number): number => {
  if (!(mass_kg > 0 && radius_m > 0)) return Number.NaN;
  return 0.5 * G * mass_kg * mass_kg / radius_m;
};
