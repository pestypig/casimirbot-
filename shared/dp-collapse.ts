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

export const Float64VolumeB64 = z.object({
  encoding: z.literal("base64"),
  dtype: z.literal("float64"),
  endian: z.literal("little"),
  order: z.literal("row-major"),
  data_b64: z.preprocess(stripDataUrlPrefix, z.string().min(1)),
});
export type TFloat64VolumeB64 = z.infer<typeof Float64VolumeB64>;

export const DpDensityVolumeB64 = z.discriminatedUnion("dtype", [
  Float32VolumeB64,
  Float64VolumeB64,
]);
export type TDpDensityVolumeB64 = z.infer<typeof DpDensityVolumeB64>;

const LowercaseSha256 = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "must be a lowercase SHA-256 hex digest");

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
    rho_kg_m3: DpDensityVolumeB64,
    grid: DpGridSpec.optional(),
    lattice_generation_hash: LowercaseSha256.optional(),
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
  boundary_shell_mass_fraction_a: number;
  boundary_shell_mass_fraction_b: number;
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
  provenance_class: "measured" | "proxy" | "inferred";
  claim_tier: "diagnostic" | "reduced-order" | "certified";
  certifying: boolean;
  fail_reason?: "DP_COLLAPSE_PROVENANCE_NON_ADMISSIBLE" | "DP_COLLAPSE_PROVENANCE_UNKNOWN";
  notes?: string[];
};

export type DpPotentialEnergyAuditResult = {
  schema_version: "dp_potential_energy_audit_result/1";
  pairwise_deltaE_J: number;
  source_potential_deltaE_J: number;
  absolute_error_J: number;
  relative_error: number;
  relative_tolerance: number;
  absolute_tolerance_J: number;
  gate: "pass" | "not_ready";
  kernel: "plummer";
  method: "exact" | "downsampled";
  grid: TDpGridSpec;
  active_difference_voxels: number;
  potential_min_m2_s2: number;
  potential_max_m2_s2: number;
  claim_tier: "diagnostic";
  certifying: false;
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
  boundary_shell_mass_fraction_a: z.number().nonnegative(),
  boundary_shell_mass_fraction_b: z.number().nonnegative(),
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
  provenance_class: z.enum(["measured", "proxy", "inferred"]),
  claim_tier: z.enum(["diagnostic", "reduced-order", "certified"]),
  certifying: z.boolean(),
  fail_reason: z
    .enum(["DP_COLLAPSE_PROVENANCE_NON_ADMISSIBLE", "DP_COLLAPSE_PROVENANCE_UNKNOWN"])
    .optional(),
  notes: z.array(z.string()).optional(),
});

const DP_COLLAPSE_FAIL_REASON = {
  nonAdmissible: "DP_COLLAPSE_PROVENANCE_NON_ADMISSIBLE",
  unknown: "DP_COLLAPSE_PROVENANCE_UNKNOWN",
} as const;

const TWO_PI = 2 * PI;

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

const SHA256_ROUND_CONSTANTS = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotateRight = (value: number, bits: number): number =>
  (value >>> bits) | (value << (32 - bits));

const sha256Bytes = (input: Uint8Array): string => {
  const paddedLength = Math.ceil((input.byteLength + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.byteLength] = 0x80;
  const bitLength = input.byteLength * 8;
  const view = new DataView(padded.buffer);
  view.setUint32(
    paddedLength - 8,
    Math.floor(bitLength / 0x1_0000_0000),
    false,
  );
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const state = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);
  const words = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, false);
    }
    for (let index = 16; index < 64; index += 1) {
      const word15 = words[index - 15];
      const word2 = words[index - 2];
      const sigma0 =
        rotateRight(word15, 7) ^ rotateRight(word15, 18) ^ (word15 >>> 3);
      const sigma1 =
        rotateRight(word2, 17) ^ rotateRight(word2, 19) ^ (word2 >>> 10);
      words[index] =
        (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    let e = state[4];
    let f = state[5];
    let g = state[6];
    let h = state[7];
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temporary1 =
        (h + sum1 + choice + SHA256_ROUND_CONSTANTS[index] + words[index]) >>>
        0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temporary1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temporary1 + temporary2) >>> 0;
    }
    state[0] = (state[0] + a) >>> 0;
    state[1] = (state[1] + b) >>> 0;
    state[2] = (state[2] + c) >>> 0;
    state[3] = (state[3] + d) >>> 0;
    state[4] = (state[4] + e) >>> 0;
    state[5] = (state[5] + f) >>> 0;
    state[6] = (state[6] + g) >>> 0;
    state[7] = (state[7] + h) >>> 0;
  }

  return Array.from(state)
    .map((word) => word.toString(16).padStart(8, "0"))
    .join("");
};

const canonicalDpDensityFloat64Bytes = (
  density: ArrayLike<number>,
): Uint8Array => {
  const bytes = new Uint8Array(density.length * Float64Array.BYTES_PER_ELEMENT);
  if (bytes.byteLength !== density.length * 8) {
    throw new Error("density_field_canonical_byte_length_mismatch");
  }
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < density.length; index += 1) {
    const value = density[index];
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(
        `density_field_invalid_value: index ${index} must be finite and nonnegative`,
      );
    }
    view.setFloat64(index * 8, value === 0 ? 0 : value, true);
  }
  return bytes;
};

export const sha256DpCanonicalDensityValues = (
  density: ArrayLike<number>,
): string => sha256Bytes(canonicalDpDensityFloat64Bytes(density));

type DecodedDpDensity = {
  rho: Float64Array;
  canonical_payload_sha256: string;
};

type DpDensityArray = Float32Array | Float64Array;

const decodeDensityVolume = (
  payload: TDpDensityVolumeB64,
  expectedLength: number,
): DecodedDpDensity => {
  const data = payload.data_b64.trim();
  const buffer: Uint8Array = (() => {
    if (typeof Buffer !== "undefined") {
      return new Uint8Array(Buffer.from(data, "base64"));
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

  const bytesPerElement =
    payload.dtype === "float64"
      ? Float64Array.BYTES_PER_ELEMENT
      : Float32Array.BYTES_PER_ELEMENT;
  const expectedByteLength = expectedLength * bytesPerElement;
  if (buffer.byteLength !== expectedByteLength) {
    throw new Error(
      `density_field_byte_length_mismatch: expected ${expectedByteLength}, got ${buffer.byteLength}`,
    );
  }
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const rho = new Float64Array(expectedLength);
  for (let index = 0; index < expectedLength; index += 1) {
    rho[index] =
      payload.dtype === "float64"
        ? view.getFloat64(index * bytesPerElement, true)
        : view.getFloat32(index * bytesPerElement, true);
  }
  const canonicalBytes = canonicalDpDensityFloat64Bytes(rho);
  if (canonicalBytes.byteLength !== expectedLength * 8) {
    throw new Error(
      `density_field_canonical_byte_length_mismatch: expected ${expectedLength * 8}, got ${canonicalBytes.byteLength}`,
    );
  }
  return {
    rho,
    canonical_payload_sha256: sha256Bytes(canonicalBytes),
  };
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
): {
  rho: DpDensityArray;
  label?: string;
  lattice_generation_hash?: string;
  canonical_payload_sha256?: string;
  lattice_generation_hash_verified?: boolean;
} => {
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
    const matchOrigin = branch.grid.origin_m.every((v, i) => v === grid.origin_m[i]);
    if (!matchDims || !matchVoxel || !matchOrigin) {
      throw new Error("density_grid_mismatch: branch grid does not match DP grid");
    }
  }
  const expectedLength = grid.dims[0] * grid.dims[1] * grid.dims[2];
  const decoded = decodeDensityVolume(branch.rho_kg_m3, expectedLength);
  if (
    branch.lattice_generation_hash !== undefined &&
    branch.lattice_generation_hash !== decoded.canonical_payload_sha256
  ) {
    throw new Error(
      `density_grid_hash_mismatch: expected ${branch.lattice_generation_hash}, got ${decoded.canonical_payload_sha256}`,
    );
  }
  return {
    rho: decoded.rho,
    label: branch.label,
    lattice_generation_hash: branch.lattice_generation_hash,
    canonical_payload_sha256: decoded.canonical_payload_sha256,
    lattice_generation_hash_verified:
      branch.lattice_generation_hash !== undefined,
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
  rho: DpDensityArray,
  grid: TDpGridSpec,
  targetDims: Vec3,
  scale: Vec3,
): { rho: DpDensityArray; grid: TDpGridSpec } => {
  const [nx, ny, nz] = grid.dims;
  const [nx2, ny2, nz2] = targetDims;
  const [dx, dy, dz] = grid.voxel_size_m;
  const [sx, sy, sz] = scale;
  const newGrid: TDpGridSpec = {
    dims: targetDims,
    voxel_size_m: [dx * sx, dy * sy, dz * sz],
    origin_m: grid.origin_m,
  };

  const out =
    rho instanceof Float64Array
      ? new Float64Array(nx2 * ny2 * nz2)
      : new Float32Array(nx2 * ny2 * nz2);
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

const computeMass = (rho: DpDensityArray, dV: number): number => {
  let sum = 0;
  for (let i = 0; i < rho.length; i += 1) sum += rho[i] * dV;
  return sum;
};

const computeOverlapMass = (rhoA: DpDensityArray, rhoB: DpDensityArray, dV: number): number => {
  let sum = 0;
  for (let i = 0; i < rhoA.length; i += 1) {
    const a = rhoA[i];
    const b = rhoB[i];
    if (a <= 0 || b <= 0) continue;
    sum += Math.min(a, b) * dV;
  }
  return sum;
};

const computeBoundaryShellMassFraction = (
  rho: DpDensityArray,
  grid: TDpGridSpec,
  dV: number,
): number => {
  const [nx, ny, nz] = grid.dims;
  let boundaryMass = 0;
  let totalMass = 0;
  for (let iz = 0; iz < nz; iz += 1) {
    for (let iy = 0; iy < ny; iy += 1) {
      for (let ix = 0; ix < nx; ix += 1) {
        const index = ix + nx * (iy + ny * iz);
        const voxelMass = Math.abs(rho[index]) * dV;
        totalMass += voxelMass;
        if (
          ix === 0 ||
          iy === 0 ||
          iz === 0 ||
          ix === nx - 1 ||
          iy === ny - 1 ||
          iz === nz - 1
        ) {
          boundaryMass += voxelMass;
        }
      }
    }
  }
  return boundaryMass / Math.max(totalMass, Number.MIN_VALUE);
};

const computePairwiseEnergy = (
  rhoA: DpDensityArray,
  rhoB: DpDensityArray,
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
              sumCross += (
                jdx === idx
                  ? rhoAi * rhoBi
                  : rhoAi * rhoBj + rhoAj * rhoBi
              ) * kernel;
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

const resolveProvenanceContract = (
  branchA: {
    lattice_generation_hash?: string;
    lattice_generation_hash_verified?: boolean;
  },
  branchB: {
    lattice_generation_hash?: string;
    lattice_generation_hash_verified?: boolean;
  },
  input: TDpCollapseInput,
): Pick<DpCollapseResult, "provenance_class" | "claim_tier" | "certifying" | "fail_reason"> => {
  const isDensityGridPath = input.branch_a.kind === "density_grid" && input.branch_b.kind === "density_grid";
  const hasVerifiedHashes =
    branchA.lattice_generation_hash_verified === true &&
    branchB.lattice_generation_hash_verified === true;

  if (isDensityGridPath && hasVerifiedHashes) {
    return {
      provenance_class: "measured",
      claim_tier: "certified",
      certifying: true,
    };
  }

  if (isDensityGridPath) {
    return {
      provenance_class: "proxy",
      claim_tier: "reduced-order",
      certifying: false,
      fail_reason: DP_COLLAPSE_FAIL_REASON.unknown,
    };
  }

  return {
    provenance_class: "inferred",
    claim_tier: "diagnostic",
    certifying: false,
    fail_reason: DP_COLLAPSE_FAIL_REASON.nonAdmissible,
  };
};

type PreparedDpBranches = {
  branchA: ReturnType<typeof resolveBranchDensity>;
  branchB: ReturnType<typeof resolveBranchDensity>;
  rhoA: DpDensityArray;
  rhoB: DpDensityArray;
  workingGrid: TDpGridSpec;
  downsampleMeta?: DpDownsampleMeta;
};

const prepareDpBranches = (parsed: TDpCollapseInput): PreparedDpBranches => {
  const grid = parsed.grid;
  const maxVoxels = parsed.method?.max_voxels ?? 4096;
  const downsample = chooseDownsampleDims(grid.dims, maxVoxels);
  let workingGrid = grid;

  const branchA = resolveBranchDensity(parsed.branch_a, grid);
  const branchB = resolveBranchDensity(parsed.branch_b, grid);
  let rhoA = branchA.rho;
  let rhoB = branchB.rho;
  let downsampleMeta: DpDownsampleMeta | undefined;

  if (downsample.scale.some((value) => value > 1.001)) {
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

  return {
    branchA,
    branchB,
    rhoA,
    rhoB,
    workingGrid,
    downsampleMeta,
  };
};

export const computeDpCollapse = (input: TDpCollapseInput): DpCollapseResult => {
  const parsed = DpCollapseInput.parse(input);
  const {
    branchA,
    branchB,
    rhoA,
    rhoB,
    workingGrid,
    downsampleMeta,
  } = prepareDpBranches(parsed);

  const dV = workingGrid.voxel_size_m[0] * workingGrid.voxel_size_m[1] * workingGrid.voxel_size_m[2];
  const massA = computeMass(rhoA, dV);
  const massB = computeMass(rhoB, dV);
  const overlapMass = computeOverlapMass(rhoA, rhoB, dV);
  const overlapFraction = overlapMass / Math.max(1e-30, Math.min(massA, massB));
  const boundaryShellMassFractionA = computeBoundaryShellMassFraction(
    rhoA,
    workingGrid,
    dV,
  );
  const boundaryShellMassFractionB = computeBoundaryShellMassFraction(
    rhoB,
    workingGrid,
    dV,
  );

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
  const provenance = resolveProvenanceContract(branchA, branchB, parsed);

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
    boundary_shell_mass_fraction_a: boundaryShellMassFractionA,
    boundary_shell_mass_fraction_b: boundaryShellMassFractionB,
    components: {
      self_a_J: selfA,
      self_b_J: selfB,
      cross_J: cross,
    },
    side_effects: sideEffects,
    constraints,
    provenance_class: provenance.provenance_class,
    claim_tier: provenance.claim_tier,
    certifying: provenance.certifying,
    fail_reason: provenance.fail_reason,
    notes: parsed.notes,
  };
};

export const computeDpPotentialEnergyAudit = (
  input: TDpCollapseInput,
  options: {
    relative_tolerance?: number;
    absolute_tolerance_J?: number;
  } = {},
): DpPotentialEnergyAuditResult => {
  const parsed = DpCollapseInput.parse(input);
  const relativeTolerance = options.relative_tolerance ?? 1e-12;
  const absoluteTolerance = options.absolute_tolerance_J ?? 0;
  if (!(relativeTolerance > 0) || !(absoluteTolerance >= 0)) {
    throw new Error("dp_potential_audit_invalid_tolerance");
  }

  const {
    rhoA,
    rhoB,
    workingGrid,
    downsampleMeta,
  } = prepareDpBranches(parsed);
  const pairwise = computePairwiseEnergy(rhoA, rhoB, workingGrid, parsed.ell_m);
  const dV =
    workingGrid.voxel_size_m[0] *
    workingGrid.voxel_size_m[1] *
    workingGrid.voxel_size_m[2];
  const [nx, ny, nz] = workingGrid.dims;
  const centers = buildGridCenters(workingGrid);
  const active: Array<{ rho: number; x: number; y: number; z: number }> = [];

  for (let iz = 0; iz < nz; iz += 1) {
    for (let iy = 0; iy < ny; iy += 1) {
      for (let ix = 0; ix < nx; ix += 1) {
        const index = ix + nx * (iy + ny * iz);
        const difference = rhoA[index] - rhoB[index];
        if (difference === 0) continue;
        active.push({
          rho: difference,
          x: centers.x[ix],
          y: centers.y[iy],
          z: centers.z[iz],
        });
      }
    }
  }

  let potentialEnergy = 0;
  let potentialMinimum = Number.POSITIVE_INFINITY;
  let potentialMaximum = Number.NEGATIVE_INFINITY;
  for (const source of active) {
    let differencePotential = 0;
    for (const target of active) {
      const dx = source.x - target.x;
      const dy = source.y - target.y;
      const dz = source.z - target.z;
      const kernel = 1 / Math.sqrt(
        dx * dx + dy * dy + dz * dz + parsed.ell_m * parsed.ell_m,
      );
      differencePotential -= G * target.rho * dV * kernel;
    }
    potentialMinimum = Math.min(potentialMinimum, differencePotential);
    potentialMaximum = Math.max(potentialMaximum, differencePotential);
    potentialEnergy += -0.5 * source.rho * differencePotential * dV;
  }

  const pairwiseEnergy = Math.max(0, pairwise.delta);
  const sourcePotentialEnergy = Math.max(0, potentialEnergy);
  const absoluteError = Math.abs(pairwiseEnergy - sourcePotentialEnergy);
  const scale = Math.max(
    Math.abs(pairwiseEnergy),
    Math.abs(sourcePotentialEnergy),
    Number.MIN_VALUE,
  );
  const relativeError = absoluteError / scale;
  const gate =
    absoluteError <= absoluteTolerance + relativeTolerance * scale
      ? "pass"
      : "not_ready";

  return {
    schema_version: "dp_potential_energy_audit_result/1",
    pairwise_deltaE_J: pairwiseEnergy,
    source_potential_deltaE_J: sourcePotentialEnergy,
    absolute_error_J: absoluteError,
    relative_error: relativeError,
    relative_tolerance: relativeTolerance,
    absolute_tolerance_J: absoluteTolerance,
    gate,
    kernel: "plummer",
    method: downsampleMeta ? "downsampled" : "exact",
    grid: workingGrid,
    active_difference_voxels: active.length,
    potential_min_m2_s2: active.length === 0 ? 0 : potentialMinimum,
    potential_max_m2_s2: active.length === 0 ? 0 : potentialMaximum,
    claim_tier: "diagnostic",
    certifying: false,
  };
};

export const dpDeltaEPointPairPlummer = (mass_kg: number, separation_m: number, ell_m: number): number => {
  if (!(mass_kg > 0 && separation_m >= 0 && ell_m > 0)) return Number.NaN;
  const self = 1 / ell_m;
  const cross = 1 / Math.sqrt(separation_m * separation_m + ell_m * ell_m);
  return G * mass_kg * mass_kg * (self - cross);
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
