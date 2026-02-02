import { z } from "zod";
import { C, C2, HBAR, PI } from "./physics-const";
import { DpCollapseInput, DpCollapseResultSchema, DpGridSpec, Float32VolumeB64 } from "./dp-collapse";
import { kappa_body } from "./curvature-proxy";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";
import { InformationBoundary } from "./information-boundary";

/**
 * Collapse benchmark (relativity-safe diagnostic)
 *
 * Terminology:
 * - "collapse_benchmark" is a commit/selection benchmark used for simulation diagnostics.
 * - It is NOT a claim of quantum signaling or faster-than-light messaging.
 */

export const CollapseTauSource = z.enum(["manual", "session_dp_tau", "field_estimator", "dp_deltaE"]);
export type TCollapseTauSource = z.infer<typeof CollapseTauSource>;

export const CollapseRcSource = z.enum(["manual", "geometry", "lattice_corrlen", "field_estimator", "dp_smear"]);
export type TCollapseRcSource = z.infer<typeof CollapseRcSource>;

const latticeDimsSchema = z.tuple([
  z.number().int().positive(),
  z.number().int().positive(),
  z.number().int().positive(),
]);

const latticeVec3Schema = z.tuple([z.number().positive(), z.number().positive(), z.number().positive()]);
const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

/**
 * Minimal lattice/field summary for collapse benchmarking.
 * Intended to bind benchmark outputs to a specific lattice generation without uploading 3D textures.
 */
export const LatticeSummary = z.object({
  lattice_generation_hash: z.string().trim().min(1),
  dims: latticeDimsSchema,
  voxel_size_m: z.number().positive(),
  lattice_size_m: latticeVec3Schema.optional(),
  coverage: z.number().min(0).max(1).optional(),
  hull_min_axis_m: z.number().positive().optional(),
  shell_radius_estimate_m: z.number().positive().optional(),
});

export type TLatticeSummary = z.infer<typeof LatticeSummary>;

const dpAdapterBoundsSchema = z.object({
  min: vec3Schema,
  max: vec3Schema,
});

export const DpAdapterGridSpec = z.object({
  dims: latticeDimsSchema,
  spacing_m: latticeVec3Schema,
  bounds: dpAdapterBoundsSchema.optional(),
});

export const DpAdapterGridBounds = z.object({
  dims: latticeDimsSchema,
  bounds: dpAdapterBoundsSchema,
  origin_m: vec3Schema.optional(),
});

export const DpAdapterBranchInput = z
  .object({
    density: Float32VolumeB64,
    units: z.enum(["mass_density_kg_m3", "energy_density_J_m3", "geom_stress"]),
    sign_mode: z.enum(["signed", "absolute", "positive"]).optional(),
    scale: z.number().positive().optional(),
    grid: DpGridSpec.optional(),
    grid_spec: DpAdapterGridSpec.optional(),
    grid_bounds: DpAdapterGridBounds.optional(),
    label: z.string().optional(),
    lattice_generation_hash: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const hasGrid = value.grid != null;
    const hasSpec = value.grid_spec != null;
    const hasBounds = value.grid_bounds != null;
    if (!hasGrid && !hasSpec && !hasBounds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["grid"],
        message: "Provide grid, grid_spec, or grid_bounds",
      });
    }
  });

export type TDpAdapterBranchInput = z.infer<typeof DpAdapterBranchInput>;

export const DpAdapterInput = z.object({
  schema_version: z.literal("dp_adapter/1"),
  ell_m: z.number().positive(),
  r_c_m: z.number().positive().optional(),
  method: DpCollapseInput.shape.method.optional(),
  coarse_graining: DpCollapseInput.shape.coarse_graining.optional(),
  side_effects: DpCollapseInput.shape.side_effects.optional(),
  constraints: DpCollapseInput.shape.constraints.optional(),
  branch_a: DpAdapterBranchInput,
  branch_b: DpAdapterBranchInput,
  seed: z.string().optional(),
  notes: z.array(z.string()).optional(),
});

export type TDpAdapterInput = z.infer<typeof DpAdapterInput>;

export const DpAdapterBuildSource = z.enum(["stress_energy_brick", "gr_evolve_brick"]);
export type TDpAdapterBuildSource = z.infer<typeof DpAdapterBuildSource>;

export const DpAdapterBuildBranch = z.object({
  params: z.record(z.unknown()).optional(),
  label: z.string().optional(),
  sign_mode: z.enum(["signed", "absolute", "positive"]).optional(),
});

export const DpAdapterBuildInput = z
  .object({
    schema_version: z.literal("dp_adapter_build/1"),
    source: DpAdapterBuildSource,
    ell_m: z.number().positive(),
    r_c_m: z.number().positive().optional(),
    method: DpCollapseInput.shape.method.optional(),
    coarse_graining: DpCollapseInput.shape.coarse_graining.optional(),
    side_effects: DpCollapseInput.shape.side_effects.optional(),
    constraints: DpCollapseInput.shape.constraints.optional(),
    grid: DpGridSpec.optional(),
    grid_spec: DpAdapterGridSpec.optional(),
    grid_bounds: DpAdapterGridBounds.optional(),
    branch_a: DpAdapterBuildBranch,
    branch_b: DpAdapterBuildBranch,
    include_matter: z.boolean().optional(),
    seed: z.string().optional(),
    notes: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    const gridFlags = [value.grid != null, value.grid_spec != null, value.grid_bounds != null];
    if (gridFlags.filter(Boolean).length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["grid"],
        message: "Provide at most one of grid, grid_spec, or grid_bounds",
      });
    }
  });

export type TDpAdapterBuildInput = z.infer<typeof DpAdapterBuildInput>;

export const DpAdapterBranchDiagnostics = z.object({
  source: DpAdapterBuildSource,
  label: z.string().optional(),
  sign_mode: z.enum(["signed", "absolute", "positive"]),
  units: z.enum(["mass_density_kg_m3", "energy_density_J_m3", "geom_stress"]),
  stats: z.object({
    min: z.number(),
    max: z.number(),
    mean: z.number(),
    abs_max: z.number(),
    finite_fraction: z.number().min(0).max(1),
  }),
  notes: z.array(z.string()),
});

export const DpAdapterBuildResult = z.object({
  ok: z.literal(true),
  schema_version: z.literal("dp_adapter_build/1"),
  dp_adapter: DpAdapterInput,
  grid: DpGridSpec,
  branches: z.object({
    a: DpAdapterBranchDiagnostics,
    b: DpAdapterBranchDiagnostics,
  }),
  data_cutoff_iso: z.string().datetime(),
  inputs_hash: z.string(),
  features_hash: z.string().optional(),
  information_boundary: InformationBoundary,
});

export type TDpAdapterBuildResult = z.infer<typeof DpAdapterBuildResult>;

export type DerivedRcFromLatticeSummary = {
  r_c_m: number;
  r_c_source: TCollapseRcSource;
  rc_proxy: {
    kind: "hull_min_axis" | "lattice_size_m" | "dims_voxel";
    min_axis_m: number;
  };
};

function safeMinAxisMeters(vec: [number, number, number] | null | undefined): number | null {
  if (!vec) return null;
  const [x, y, z] = vec;
  if (![x, y, z].every((v) => Number.isFinite(v) && v > 0)) return null;
  return Math.min(x, y, z);
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const clampPositive = (x: number, floor = 0): number => {
  if (!Number.isFinite(x)) return floor;
  return Math.max(floor, x);
};

export const CollapseCurvatureCouplingInputs = z.object({
  /**
   * Curvature-unit and coherence outputs used to heuristically tie tau/r_c to field stability.
   * All fields are optional; the estimator will fall back to bounded defaults when missing.
   */
  kappa_drive_m2: z.number().nonnegative().optional(),
  kappa_body_m2: z.number().nonnegative().optional(),
  coherence: z.number().min(0).max(1).optional(),
  dispersion: z.number().min(0).max(1).optional(),
  residual_rms: z.number().nonnegative().optional(),
  roots_count: z.number().int().nonnegative().optional(),
  /**
   * Optional geometric hints for the correlation length.
   * When provided, the estimator blends these against instability penalties.
   */
  r_c_hint_m: z.number().positive().optional(),
  r_c_lattice_m: z.number().positive().optional(),
  /**
   * Optional anchor for the collapse cadence; higher instability shortens tau from this anchor.
   */
  tau_hint_ms: z.number().positive().optional(),
});

export type TCollapseCurvatureCouplingInputs = z.infer<typeof CollapseCurvatureCouplingInputs>;

export type CollapseCurvatureHeuristicResult = {
  tau_ms: number;
  r_c_m: number;
  instability: number;
  components: {
    drive_vs_body: number;
    residual: number;
    dispersion: number;
    incoherence: number;
    roots: number;
  };
  bounds: {
    tau_floor_ms: number;
    tau_ceiling_ms: number;
    r_c_floor_m: number;
    r_c_ceiling_m: number;
  };
};

const logNormalizedRatio = (value: number, reference: number, logSpan = 6): number => {
  const safeRef = Math.max(1e-30, reference);
  const ratio = Math.max(0, value) / safeRef;
  const scaled = Math.log10(1 + ratio);
  return clamp01(scaled / logSpan);
};

const normalizeResidual = (residual: number | undefined): number => {
  const safe = clampPositive(residual ?? 0);
  const ref = 1e-4;
  return clamp01(safe / (safe + ref));
};

const normalizeRoots = (roots: number | undefined): number => {
  const safe = clampPositive(roots ?? 0);
  const ref = 48; // treat ~50 vector roots as fully fragmented
  return clamp01(safe / ref);
};

/**
 * Heuristic mapping from curvature/coherence diagnostics to {tau, r_c}.
 * - Higher instability -> shorter tau and smaller r_c.
 * - Instability increases with residuals, dispersion, low coherence, strong drive/body ratio, and root fragmentation.
 * - Deterministic and bounded so CI can catch drift.
 */
export function estimateTauRcFromCurvature(
  inputs: TCollapseCurvatureCouplingInputs,
  opts?: {
    tau_floor_ms?: number;
    tau_ceiling_ms?: number;
    r_c_floor_m?: number;
    r_c_ceiling_m?: number;
    default_tau_ms?: number;
    default_r_c_m?: number;
  },
): CollapseCurvatureHeuristicResult {
  const incoherence = clamp01(1 - clamp01(inputs.coherence ?? 0.5));
  const dispersion = clamp01(inputs.dispersion ?? 0.5);
  const residual = normalizeResidual(inputs.residual_rms);
  const roots = normalizeRoots(inputs.roots_count);
  const driveVsBody = logNormalizedRatio(inputs.kappa_drive_m2 ?? 0, (inputs.kappa_body_m2 ?? 0) + 1e-12, 6);

  const weights = {
    drive_vs_body: 0.28,
    residual: 0.22,
    dispersion: 0.18,
    incoherence: 0.18,
    roots: 0.14,
  } as const;

  const instability =
    weights.drive_vs_body * driveVsBody +
    weights.residual * residual +
    weights.dispersion * dispersion +
    weights.incoherence * incoherence +
    weights.roots * roots;

  const anchorTau = clampPositive(inputs.tau_hint_ms ?? opts?.default_tau_ms ?? 1_000, 1);
  const tau_floor_ms = clampPositive(opts?.tau_floor_ms ?? anchorTau * 0.05, 1);
  const tau_ceiling_ms = Math.max(opts?.tau_ceiling_ms ?? anchorTau * 2, tau_floor_ms + 1);
  const tau_ms = tau_ceiling_ms - instability * (tau_ceiling_ms - tau_floor_ms);

  const baseRc = clampPositive(inputs.r_c_hint_m ?? inputs.r_c_lattice_m ?? opts?.default_r_c_m ?? 1, 1e-9);
  const r_c_floor_m = clampPositive(opts?.r_c_floor_m ?? baseRc * 0.2, 1e-9);
  const r_c_ceiling_m = Math.max(opts?.r_c_ceiling_m ?? baseRc * 2.5, r_c_floor_m * 1.01);

  const coherenceGain = 0.6 + 0.6 * clamp01(inputs.coherence ?? 0.5); // 0.6 .. 1.2
  const dispersionPenalty = 1 - 0.55 * dispersion; // 0.45 .. 1
  const residualPenalty = 1 - 0.5 * residual; // 0.5 .. 1
  const rootsPenalty = 1 - 0.35 * roots; // 0.65 .. 1
  const rcCandidate = baseRc * coherenceGain * dispersionPenalty * residualPenalty * rootsPenalty;
  const r_c_m = Math.min(r_c_ceiling_m, Math.max(r_c_floor_m, rcCandidate));

  return {
    tau_ms,
    r_c_m,
    instability,
    components: { drive_vs_body: driveVsBody, residual, dispersion, incoherence, roots },
    bounds: { tau_floor_ms, tau_ceiling_ms, r_c_floor_m, r_c_ceiling_m },
  };
}

export function deriveRcFromLatticeSummary(lattice: TLatticeSummary): DerivedRcFromLatticeSummary {
  const fromHullMin = Number(lattice.hull_min_axis_m);
  if (Number.isFinite(fromHullMin) && fromHullMin > 0) {
    return {
      r_c_m: 0.5 * fromHullMin,
      r_c_source: "geometry",
      rc_proxy: { kind: "hull_min_axis", min_axis_m: fromHullMin },
    };
  }

  const fromSize = safeMinAxisMeters(lattice.lattice_size_m ?? null);
  if (fromSize != null) {
    return {
      r_c_m: 0.5 * fromSize,
      r_c_source: "geometry",
      rc_proxy: { kind: "lattice_size_m", min_axis_m: fromSize },
    };
  }

  const [nx, ny, nz] = lattice.dims;
  const voxel = lattice.voxel_size_m;
  const size: [number, number, number] = [nx * voxel, ny * voxel, nz * voxel];
  const minAxis = safeMinAxisMeters(size) ?? voxel;
  return {
    r_c_m: 0.5 * minAxis,
    r_c_source: "geometry",
    rc_proxy: { kind: "dims_voxel", min_axis_m: minAxis },
  };
}

export const CollapseBenchmarkInput = z.object({
  schema_version: z.literal("collapse_benchmark/1"),
  dt_ms: z.number().nonnegative(),
  tau_ms: z.number().positive().optional(),
  tau_estimator: CollapseCurvatureCouplingInputs.optional(),
  dp: DpCollapseInput.optional(),
  dp_adapter: DpAdapterInput.optional(),
  r_c_m: z.number().positive().optional(),
  lattice: LatticeSummary.optional(),
  expected_lattice_generation_hash: z.string().trim().min(1).optional(),
  seed: z.string().min(1).optional(),
  c_mps: z.number().positive().optional(),
}).superRefine((value, ctx) => {
  const hasTau = typeof value.tau_ms === "number" && Number.isFinite(value.tau_ms);
  const hasEstimator = value.tau_estimator != null;
  const hasDp = value.dp != null || value.dp_adapter != null;
  if (!hasTau && !hasEstimator && !hasDp) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tau_ms"],
      message: "Provide tau_ms, tau_estimator, dp, or dp_adapter",
    });
  }

  if (value.dp && value.dp_adapter) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dp_adapter"],
      message: "Provide dp or dp_adapter, not both",
    });
  }

  const hasRc =
    value.r_c_m != null ||
    value.lattice != null ||
    value.tau_estimator?.r_c_hint_m != null ||
    value.tau_estimator?.r_c_lattice_m != null ||
    value.dp?.r_c_m != null ||
    value.dp?.ell_m != null ||
    value.dp_adapter?.r_c_m != null ||
    value.dp_adapter?.ell_m != null;
  if (!hasRc) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["r_c_m"],
      message: "Provide r_c_m, lattice, tau_estimator.r_c_hint_m, or dp_adapter.ell_m",
    });
  }
  if (value.expected_lattice_generation_hash != null && value.lattice == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expected_lattice_generation_hash"],
      message: "expected_lattice_generation_hash requires lattice",
    });
  }
});

export type TCollapseBenchmarkInput = z.infer<typeof CollapseBenchmarkInput>;

export const CollapseBenchmarkResult = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("collapse_benchmark/1"),
  kind: z.literal("collapse_benchmark"),

  dt_ms: z.number().nonnegative(),
  tau_ms: z.number().positive(),
  tau_source: CollapseTauSource,

  r_c_m: z.number().positive(),
  r_c_source: CollapseRcSource,

  c_mps: z.number().positive(),

  lattice_generation_hash: z.string().min(1).optional(),

  p_trigger: z.number().min(0).max(1),
  L_present_m: z.number().positive(),
  kappa_present_m2: z.number().nonnegative(),

  diagnostics: z
    .object({
      tau_s: z.number().positive(),
      L_lc_m: z.number().positive(),
      E_G_J: z.number().nonnegative(),
      V_c_m3: z.number().positive(),
      rho_eff_kg_m3: z.number().nonnegative(),
      kappa_collapse_m2: z.number().nonnegative(),
    })
    .optional(),
  dp: DpCollapseResultSchema.optional(),
  tau_estimator: z
    .object({
      mode: z.literal("curvature_heuristic"),
      instability: z.number().min(0).max(1),
      components: z.record(z.number()),
      bounds: z.object({
        tau_floor_ms: z.number().positive(),
        tau_ceiling_ms: z.number().positive(),
        r_c_floor_m: z.number().positive(),
        r_c_ceiling_m: z.number().positive(),
      }),
    })
    .optional(),
});

export type TCollapseBenchmarkResult = z.infer<typeof CollapseBenchmarkResult>;

export const CollapseBenchmarkRunInput = z
  .object({
    steps: z.number().int().min(1).max(1_000_000),
    dt_ms: z.number().nonnegative(),
    tau_ms: z.number().positive().optional(),
    tau_estimator: CollapseCurvatureCouplingInputs.optional(),
    dp: DpCollapseInput.optional(),
    dp_adapter: DpAdapterInput.optional(),
    r_c_m: z.number().positive().optional(),
    lattice: LatticeSummary.optional(),
    expected_lattice_generation_hash: z.string().trim().min(1).optional(),
    seed: z.string().min(1).optional(),
    c_mps: z.number().positive().optional(),
    histogram_bins: z.number().int().min(2).max(100).optional(),
  })
  .superRefine((value, ctx) => {
    const hasTau = typeof value.tau_ms === "number" && Number.isFinite(value.tau_ms);
    const hasEstimator = value.tau_estimator != null;
    const hasDp = value.dp != null || value.dp_adapter != null;
    if (!hasTau && !hasEstimator && !hasDp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tau_ms"],
        message: "Provide tau_ms, tau_estimator, dp, or dp_adapter",
      });
    }
    if (value.dp && value.dp_adapter) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dp_adapter"],
        message: "Provide dp or dp_adapter, not both",
      });
    }
    const hasRc =
      value.r_c_m != null ||
      value.lattice != null ||
      value.tau_estimator?.r_c_hint_m != null ||
      value.tau_estimator?.r_c_lattice_m != null ||
      value.dp?.r_c_m != null ||
      value.dp?.ell_m != null ||
      value.dp_adapter?.r_c_m != null ||
      value.dp_adapter?.ell_m != null;
    if (!hasRc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["r_c_m"],
        message: "Provide r_c_m, lattice, tau_estimator.r_c_hint_m, or dp_adapter.ell_m",
      });
    }
    if (value.expected_lattice_generation_hash != null && value.lattice == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expected_lattice_generation_hash"],
        message: "expected_lattice_generation_hash requires lattice",
      });
    }
  });

export type TCollapseBenchmarkRunInput = z.infer<typeof CollapseBenchmarkRunInput>;

export const CollapseBenchmarkManifestEntry = z.object({
  id: z.string().min(1),
  asOf: z.string().datetime().optional(),
  run: CollapseBenchmarkRunInput,
});

export const CollapseBenchmarkManifest = z.object({
  schema_version: z.literal("collapse_benchmark_manifest/1"),
  kind: z.literal("collapse_benchmark_manifest"),
  created_at: z.string().datetime(),
  runs: z.array(CollapseBenchmarkManifestEntry).min(1),
});

export type TCollapseBenchmarkManifestEntry = z.infer<typeof CollapseBenchmarkManifestEntry>;
export type TCollapseBenchmarkManifest = z.infer<typeof CollapseBenchmarkManifest>;

export function hazardProbability(dt_ms: number, tau_ms: number): number {
  if (!Number.isFinite(dt_ms) || !Number.isFinite(tau_ms) || dt_ms <= 0 || tau_ms <= 0) return 0;
  return clamp01(1 - Math.exp(-dt_ms / tau_ms));
}

export function presentLengthMeters(r_c_m: number, tau_ms: number, c_mps: number = C): number {
  if (!Number.isFinite(r_c_m) || !Number.isFinite(tau_ms) || !Number.isFinite(c_mps)) return Number.NaN;
  if (r_c_m <= 0 || tau_ms <= 0 || c_mps <= 0) return Number.NaN;
  const tau_s = tau_ms / 1000;
  const L_lc_m = c_mps * tau_s;
  return Math.min(r_c_m, L_lc_m);
}

export function kappaPresentFromLength(L_present_m: number): number {
  if (!Number.isFinite(L_present_m) || L_present_m <= 0) return Number.NaN;
  return 1 / (L_present_m * L_present_m);
}

export function collapseBenchmarkDiagnostics(params: { tau_ms: number; r_c_m: number; c_mps?: number }) {
  const c_mps = params.c_mps ?? C;
  const tau_s = params.tau_ms / 1000;
  const L_lc_m = c_mps * tau_s;
  const L_present_m = Math.min(params.r_c_m, L_lc_m);
  const kappa_present_m2 = kappaPresentFromLength(L_present_m);

  // GR-inspired diagnostic tie-in (benchmark/proxy only):
  // E_G = ħ/τ ; V_c = (4/3)π r_c^3 ; ρ_eff = E_G/(c^2 V_c) ; κ_collapse = κ_body(ρ_eff)
  const tau_for_E = Math.max(1e-30, tau_s);
  const E_G_J = HBAR / tau_for_E;
  const V_c_m3 = (4 / 3) * PI * Math.pow(Math.max(1e-30, params.r_c_m), 3);
  const rho_eff_kg_m3 = E_G_J / (Math.max(1e-30, C2 * V_c_m3));
  const kappa_collapse_m2 = kappa_body(rho_eff_kg_m3);

  return {
    tau_s,
    L_lc_m,
    L_present_m,
    kappa_present_m2,
    E_G_J,
    V_c_m3,
    rho_eff_kg_m3,
    kappa_collapse_m2,
  };
}

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32OneShot(seedU32: number): number {
  let t = (seedU32 + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function toIntStepIndex(stepIndex: number): number {
  if (!Number.isFinite(stepIndex)) return 0;
  return Math.max(0, Math.floor(stepIndex));
}

/**
 * Deterministic uniform RNG for collapse trigger decisions.
 * - Pure and replayable: depends only on {seed, stepIndex}.
 * - Uses FNV-1a (u32) + mulberry32 (single-sample) for stable cross-platform behavior.
 */
export function collapseDeterministicUniform01(seed: string, stepIndex: number): number {
  const safeSeed = typeof seed === "string" ? seed : String(seed ?? "");
  const safeStep = toIntStepIndex(stepIndex);
  const seedU32 = fnv1a32(`${safeSeed}:${safeStep}`);
  return mulberry32OneShot(seedU32);
}

export type TCollapseTriggerDecision = {
  seed: string;
  step_index: number;
  u: number;
  trigger: boolean;
};

/**
 * Deterministic "trigger" decision helper for benchmark replay.
 */
export function collapseTriggerDecision(seed: string, stepIndex: number, p_trigger: number): TCollapseTriggerDecision {
  const safeSeed = typeof seed === "string" ? seed : String(seed ?? "");
  const safeStep = toIntStepIndex(stepIndex);
  const safeP = clamp01(Number.isFinite(p_trigger) ? p_trigger : 0);
  const u = collapseDeterministicUniform01(safeSeed, safeStep);
  return { seed: safeSeed, step_index: safeStep, u, trigger: u < safeP };
}
