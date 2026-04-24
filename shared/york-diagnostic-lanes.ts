export const YORK_DIAGNOSTIC_BASELINE_LANE_ID =
  "lane_a_eulerian_comoving_theta_minus_trk" as const;

export const YORK_DIAGNOSTIC_ALTERNATE_LANE_ID =
  "lane_b_shift_drift_theta_plus_div_beta_over_alpha" as const;

export type YorkDiagnosticLaneId =
  | typeof YORK_DIAGNOSTIC_BASELINE_LANE_ID
  | typeof YORK_DIAGNOSTIC_ALTERNATE_LANE_ID;

export type YorkDiagnosticLaneConvention = {
  lane_id: YorkDiagnosticLaneId;
  chart: string;
  observer: string;
  observer_definition_id: string;
  observer_inputs_required: string[];
  observer_construction_inputs: string[];
  observer_construction_formula: string;
  observer_normalized: boolean;
  observer_approximation: string | null;
  semantic_mode:
    | "eulerian_normal"
    | "observer_proxy"
    | "cross_lane_reference"
    | "diagnostic_local_only";
  lane_semantic_mode: string;
  foliation: string;
  foliation_definition: string;
  theta_definition: string;
  kij_sign_convention: string;
  requires_gamma_metric: boolean;
  is_proxy: boolean;
  is_reference_only: boolean;
  is_authoritative_for_readiness: boolean;
  is_cross_lane_promotable: boolean;
  semantics_closed: boolean;
  cross_lane_claim_ready: boolean;
  reference_comparison_ready: boolean;
  cross_lane_claim_block_reason: string | null;
};

export const YORK_DIAGNOSTIC_LANE_CONVENTIONS: Record<
  YorkDiagnosticLaneId,
  YorkDiagnosticLaneConvention
> = {
  [YORK_DIAGNOSTIC_BASELINE_LANE_ID]: {
    lane_id: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
    chart: "comoving_cartesian",
    observer: "eulerian_n",
    observer_definition_id: "obs.eulerian_n",
    observer_inputs_required: ["alpha"],
    observer_construction_inputs: ["alpha"],
    observer_construction_formula: "u^a = n^a (Eulerian normal observer)",
    observer_normalized: true,
    observer_approximation: null,
    semantic_mode: "eulerian_normal",
    lane_semantic_mode: "baseline-eulerian-theta-minus-trk",
    foliation: "comoving_cartesian_3p1",
    foliation_definition:
      "Eulerian normal observer on the fixed comoving Cartesian 3+1 foliation.",
    theta_definition: "theta=-trK",
    kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
    requires_gamma_metric: false,
    is_proxy: false,
    is_reference_only: false,
    is_authoritative_for_readiness: true,
    is_cross_lane_promotable: true,
    semantics_closed: true,
    cross_lane_claim_ready: true,
    reference_comparison_ready: true,
    cross_lane_claim_block_reason: null,
  },
  [YORK_DIAGNOSTIC_ALTERNATE_LANE_ID]: {
    lane_id: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
    chart: "comoving_cartesian",
    observer: "shift_drift_u(beta_over_alpha)",
    observer_definition_id: "obs.shift_drift_beta_over_alpha_covariant_divergence_v1",
    observer_inputs_required: [
      "alpha",
      "beta_x",
      "beta_y",
      "beta_z",
      "gamma_xx",
      "gamma_xy",
      "gamma_xz",
      "gamma_yy",
      "gamma_yz",
      "gamma_zz",
      "K_trace",
    ],
    observer_construction_inputs: [
      "alpha",
      "beta_x",
      "beta_y",
      "beta_z",
      "gamma_xx",
      "gamma_xy",
      "gamma_xz",
      "gamma_yy",
      "gamma_yz",
      "gamma_zz",
      "K_trace",
    ],
    observer_construction_formula:
      "u^i_proxy = beta^i/alpha; theta_B = -trK + div_gamma(u_proxy); div_gamma(v)=1/sqrt(det(gamma))*partial_i(sqrt(det(gamma))*v^i)",
    observer_normalized: false,
    observer_approximation:
      "diagnostic-local observer-only drift proxy on fixed comoving foliation; u^i_proxy is not renormalized to a full alternate slicing congruence",
    semantic_mode: "observer_proxy",
    lane_semantic_mode: "diagnostic-observer-proxy-covariant-divergence",
    foliation: "comoving_cartesian_3p1",
    foliation_definition:
      "Diagnostic-local observer-drift proxy evaluated on the same fixed comoving Cartesian 3+1 foliation as Lane A.",
    theta_definition: "theta=-trK+div(beta/alpha)",
    kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
    requires_gamma_metric: true,
    is_proxy: true,
    is_reference_only: true,
    is_authoritative_for_readiness: false,
    is_cross_lane_promotable: false,
    semantics_closed: true,
    cross_lane_claim_ready: false,
    reference_comparison_ready: true,
    cross_lane_claim_block_reason: null,
  },
};

export const isYorkDiagnosticLaneId = (
  value: string | null | undefined,
): value is YorkDiagnosticLaneId =>
  value === YORK_DIAGNOSTIC_BASELINE_LANE_ID ||
  value === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID;

export const normalizeYorkDiagnosticLaneId = (
  value: string | null | undefined,
): YorkDiagnosticLaneId =>
  isYorkDiagnosticLaneId(value) ? value : YORK_DIAGNOSTIC_BASELINE_LANE_ID;

const idx3 = (x: number, y: number, z: number, dims: [number, number, number]): number =>
  z * dims[0] * dims[1] + y * dims[0] + x;

const finiteOrZero = (value: number | undefined): number =>
  Number.isFinite(value) ? Number(value) : 0;

const safeSpacing = (value: number | undefined): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(Math.abs(parsed), 1e-9);
};

const signedSafeAlpha = (value: number): number => {
  if (!Number.isFinite(value)) return 1e-9;
  if (Math.abs(value) >= 1e-9) return value;
  return value < 0 ? -1e-9 : 1e-9;
};

const safeMetricVolumeElement = (value: number): number => {
  if (!Number.isFinite(value)) return 1e-12;
  return Math.sqrt(Math.max(Math.abs(value), 1e-24));
};

const metricDet3 = (
  gxx: number,
  gxy: number,
  gxz: number,
  gyy: number,
  gyz: number,
  gzz: number,
): number =>
  gxx * (gyy * gzz - gyz * gyz) -
  gxy * (gxy * gzz - gyz * gxz) +
  gxz * (gxy * gyz - gyy * gxz);

const derivativeAxis = (args: {
  field: Float32Array;
  dims: [number, number, number];
  spacing: [number, number, number];
  x: number;
  y: number;
  z: number;
  axis: 0 | 1 | 2;
}): number => {
  const { field, dims, spacing, x, y, z, axis } = args;
  const [nx, ny, nz] = dims;
  const h = safeSpacing(spacing[axis]);
  if (axis === 0) {
    if (nx <= 1) return 0;
    if (x <= 0) {
      return (
        finiteOrZero(field[idx3(1, y, z, dims)]) -
        finiteOrZero(field[idx3(0, y, z, dims)])
      ) / h;
    }
    if (x >= nx - 1) {
      return (
        finiteOrZero(field[idx3(nx - 1, y, z, dims)]) -
        finiteOrZero(field[idx3(nx - 2, y, z, dims)])
      ) / h;
    }
    return (
      finiteOrZero(field[idx3(x + 1, y, z, dims)]) -
      finiteOrZero(field[idx3(x - 1, y, z, dims)])
    ) / (2 * h);
  }
  if (axis === 1) {
    if (ny <= 1) return 0;
    if (y <= 0) {
      return (
        finiteOrZero(field[idx3(x, 1, z, dims)]) -
        finiteOrZero(field[idx3(x, 0, z, dims)])
      ) / h;
    }
    if (y >= ny - 1) {
      return (
        finiteOrZero(field[idx3(x, ny - 1, z, dims)]) -
        finiteOrZero(field[idx3(x, ny - 2, z, dims)])
      ) / h;
    }
    return (
      finiteOrZero(field[idx3(x, y + 1, z, dims)]) -
      finiteOrZero(field[idx3(x, y - 1, z, dims)])
    ) / (2 * h);
  }
  if (nz <= 1) return 0;
  if (z <= 0) {
    return (
      finiteOrZero(field[idx3(x, y, 1, dims)]) -
      finiteOrZero(field[idx3(x, y, 0, dims)])
    ) / h;
  }
  if (z >= nz - 1) {
    return (
      finiteOrZero(field[idx3(x, y, nz - 1, dims)]) -
      finiteOrZero(field[idx3(x, y, nz - 2, dims)])
    ) / h;
  }
  return (
    finiteOrZero(field[idx3(x, y, z + 1, dims)]) -
    finiteOrZero(field[idx3(x, y, z - 1, dims)])
  ) / (2 * h);
};

const buildShiftDriftDivergence = (args: {
  dims: [number, number, number];
  voxelSizeM: [number, number, number];
  betaX: Float32Array;
  betaY: Float32Array;
  betaZ: Float32Array;
  alpha: Float32Array;
  gammaXX: Float32Array;
  gammaXY: Float32Array;
  gammaXZ: Float32Array;
  gammaYY: Float32Array;
  gammaYZ: Float32Array;
  gammaZZ: Float32Array;
}): Float32Array => {
  const {
    dims,
    voxelSizeM,
    betaX,
    betaY,
    betaZ,
    alpha,
    gammaXX,
    gammaXY,
    gammaXZ,
    gammaYY,
    gammaYZ,
    gammaZZ,
  } = args;
  const total = dims[0] * dims[1] * dims[2];
  const sqrtGamma = new Float32Array(total);
  const vx = new Float32Array(total);
  const vy = new Float32Array(total);
  const vz = new Float32Array(total);
  const fluxX = new Float32Array(total);
  const fluxY = new Float32Array(total);
  const fluxZ = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    const alphaLocal = signedSafeAlpha(finiteOrZero(alpha[i]));
    const gammaDet = metricDet3(
      finiteOrZero(gammaXX[i]),
      finiteOrZero(gammaXY[i]),
      finiteOrZero(gammaXZ[i]),
      finiteOrZero(gammaYY[i]),
      finiteOrZero(gammaYZ[i]),
      finiteOrZero(gammaZZ[i]),
    );
    const sqrtDet = safeMetricVolumeElement(gammaDet);
    sqrtGamma[i] = sqrtDet;
    vx[i] = finiteOrZero(betaX[i]) / alphaLocal;
    vy[i] = finiteOrZero(betaY[i]) / alphaLocal;
    vz[i] = finiteOrZero(betaZ[i]) / alphaLocal;
    fluxX[i] = sqrtDet * vx[i];
    fluxY[i] = sqrtDet * vy[i];
    fluxZ[i] = sqrtDet * vz[i];
  }
  const divergence = new Float32Array(total);
  for (let z = 0; z < dims[2]; z += 1) {
    for (let y = 0; y < dims[1]; y += 1) {
      for (let x = 0; x < dims[0]; x += 1) {
        const i = idx3(x, y, z, dims);
        const dvxDx = derivativeAxis({
          field: fluxX,
          dims,
          spacing: voxelSizeM,
          x,
          y,
          z,
          axis: 0,
        });
        const dvyDy = derivativeAxis({
          field: fluxY,
          dims,
          spacing: voxelSizeM,
          x,
          y,
          z,
          axis: 1,
        });
        const dvzDz = derivativeAxis({
          field: fluxZ,
          dims,
          spacing: voxelSizeM,
          x,
          y,
          z,
          axis: 2,
        });
        const sqrtDet = Math.max(finiteOrZero(sqrtGamma[i]), 1e-12);
        divergence[i] = (dvxDx + dvyDy + dvzDz) / sqrtDet;
      }
    }
  }
  return divergence;
};

export type YorkDiagnosticLaneTensorInputs = {
  laneId: YorkDiagnosticLaneId;
  dims: [number, number, number];
  voxelSizeM: [number, number, number];
  theta: Float32Array | null;
  kTrace: Float32Array | null;
  betaX: Float32Array | null;
  betaY: Float32Array | null;
  betaZ: Float32Array | null;
  alpha: Float32Array | null;
  gammaXX: Float32Array | null;
  gammaXY: Float32Array | null;
  gammaXZ: Float32Array | null;
  gammaYY: Float32Array | null;
  gammaYZ: Float32Array | null;
  gammaZZ: Float32Array | null;
};

export type YorkDiagnosticObserverConstructionInfo = {
  observer_definition_id: string;
  observer_inputs_required: string[];
  observer_construction_inputs: string[];
  observer_construction_formula: string;
  observer_normalized: boolean;
  observer_approximation: string | null;
  semantic_mode:
    | "eulerian_normal"
    | "observer_proxy"
    | "cross_lane_reference"
    | "diagnostic_local_only";
  foliation_definition: string;
  is_proxy: boolean;
  is_reference_only: boolean;
  is_authoritative_for_readiness: boolean;
  is_cross_lane_promotable: boolean;
  observer_inputs_present: boolean;
  lane_b_semantic_mode: string;
  lane_b_geometry_ready: boolean;
  requires_gamma_metric: boolean;
  semantics_closed: boolean;
  cross_lane_claim_ready: boolean;
  reference_comparison_ready: boolean;
  cross_lane_claim_block_reason: string | null;
};

export type YorkDiagnosticLaneFieldResult =
  | {
      ok: true;
      theta: Float32Array;
      contractField: Float32Array;
      source:
        | "canonical_theta_channel"
        | "recomputed_theta_from_ktrace_and_div_beta_over_alpha";
      contractSource:
        | "neg_k_trace"
        | "neg_k_trace_plus_div_beta_over_alpha";
      observerConstruction: YorkDiagnosticObserverConstructionInfo;
    }
  | {
      ok: false;
      error:
        | "scientific_york_theta_missing"
        | "scientific_york_lane_tensor_missing";
      missingChannels: string[];
    };

export const computeYorkDiagnosticLaneField = (
  args: YorkDiagnosticLaneTensorInputs,
): YorkDiagnosticLaneFieldResult => {
  const total = args.dims[0] * args.dims[1] * args.dims[2];
  const laneConvention = YORK_DIAGNOSTIC_LANE_CONVENTIONS[args.laneId];
  const observerConstruction: YorkDiagnosticObserverConstructionInfo = {
    observer_definition_id: laneConvention.observer_definition_id,
    observer_inputs_required: [...laneConvention.observer_inputs_required],
    observer_construction_inputs: [...laneConvention.observer_construction_inputs],
    observer_construction_formula: laneConvention.observer_construction_formula,
    observer_normalized: laneConvention.observer_normalized,
    observer_approximation: laneConvention.observer_approximation,
    semantic_mode: laneConvention.semantic_mode,
    foliation_definition: laneConvention.foliation_definition,
    is_proxy: laneConvention.is_proxy,
    is_reference_only: laneConvention.is_reference_only,
    is_authoritative_for_readiness: laneConvention.is_authoritative_for_readiness,
    is_cross_lane_promotable: laneConvention.is_cross_lane_promotable,
    observer_inputs_present: false,
    lane_b_semantic_mode: laneConvention.lane_semantic_mode,
    lane_b_geometry_ready: false,
    requires_gamma_metric: laneConvention.requires_gamma_metric,
    semantics_closed: laneConvention.semantics_closed,
    cross_lane_claim_ready: laneConvention.cross_lane_claim_ready,
    reference_comparison_ready: laneConvention.reference_comparison_ready,
    cross_lane_claim_block_reason: laneConvention.cross_lane_claim_block_reason,
  };
  if (args.laneId === YORK_DIAGNOSTIC_BASELINE_LANE_ID) {
    if (!(args.theta instanceof Float32Array) || args.theta.length < total) {
      return {
        ok: false,
        error: "scientific_york_theta_missing",
        missingChannels: ["theta"],
      };
    }
    if (!(args.kTrace instanceof Float32Array) || args.kTrace.length < total) {
      return {
        ok: false,
        error: "scientific_york_lane_tensor_missing",
        missingChannels: ["K_trace"],
      };
    }
    const negKTrace = new Float32Array(total);
    for (let i = 0; i < total; i += 1) {
      negKTrace[i] = -finiteOrZero(args.kTrace[i]);
    }
    return {
      ok: true,
      theta: args.theta,
      contractField: negKTrace,
      source: "canonical_theta_channel",
      contractSource: "neg_k_trace",
      observerConstruction: {
        ...observerConstruction,
        observer_inputs_present: true,
        lane_b_geometry_ready: true,
      },
    };
  }

  const missing: string[] = [];
  if (!(args.kTrace instanceof Float32Array) || args.kTrace.length < total) {
    missing.push("K_trace");
  }
  if (!(args.betaX instanceof Float32Array) || args.betaX.length < total) {
    missing.push("beta_x");
  }
  if (!(args.betaY instanceof Float32Array) || args.betaY.length < total) {
    missing.push("beta_y");
  }
  if (!(args.betaZ instanceof Float32Array) || args.betaZ.length < total) {
    missing.push("beta_z");
  }
  if (!(args.alpha instanceof Float32Array) || args.alpha.length < total) {
    missing.push("alpha");
  }
  if (!(args.gammaXX instanceof Float32Array) || args.gammaXX.length < total) {
    missing.push("gamma_xx");
  }
  if (!(args.gammaXY instanceof Float32Array) || args.gammaXY.length < total) {
    missing.push("gamma_xy");
  }
  if (!(args.gammaXZ instanceof Float32Array) || args.gammaXZ.length < total) {
    missing.push("gamma_xz");
  }
  if (!(args.gammaYY instanceof Float32Array) || args.gammaYY.length < total) {
    missing.push("gamma_yy");
  }
  if (!(args.gammaYZ instanceof Float32Array) || args.gammaYZ.length < total) {
    missing.push("gamma_yz");
  }
  if (!(args.gammaZZ instanceof Float32Array) || args.gammaZZ.length < total) {
    missing.push("gamma_zz");
  }
  if (missing.length > 0) {
    return {
      ok: false,
      error: "scientific_york_lane_tensor_missing",
      missingChannels: missing,
    };
  }

  const kTrace = args.kTrace as Float32Array;
  const betaX = args.betaX as Float32Array;
  const betaY = args.betaY as Float32Array;
  const betaZ = args.betaZ as Float32Array;
  const alpha = args.alpha as Float32Array;
  const gammaXX = args.gammaXX as Float32Array;
  const gammaXY = args.gammaXY as Float32Array;
  const gammaXZ = args.gammaXZ as Float32Array;
  const gammaYY = args.gammaYY as Float32Array;
  const gammaYZ = args.gammaYZ as Float32Array;
  const gammaZZ = args.gammaZZ as Float32Array;

  const divergence = buildShiftDriftDivergence({
    dims: args.dims,
    voxelSizeM: args.voxelSizeM,
    betaX,
    betaY,
    betaZ,
    alpha,
    gammaXX,
    gammaXY,
    gammaXZ,
    gammaYY,
    gammaYZ,
    gammaZZ,
  });
  const thetaLane = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    thetaLane[i] = -finiteOrZero(kTrace[i]) + finiteOrZero(divergence[i]);
  }
  return {
    ok: true,
    theta: thetaLane,
    contractField: thetaLane,
    source: "recomputed_theta_from_ktrace_and_div_beta_over_alpha",
    contractSource: "neg_k_trace_plus_div_beta_over_alpha",
    observerConstruction: {
      ...observerConstruction,
      observer_inputs_present: true,
      lane_b_geometry_ready: true,
    },
  };
};
