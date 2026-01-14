import {
  BSSN_FIELD_KEYS,
  type BssnFieldKey,
  type Vec3,
  clearBssnFieldSet,
  type BssnRhs,
  type BssnState,
} from "./bssn-state";
import {
  diff1,
  diff1Upwind,
  diff2,
  index3D,
  koDissipationAt,
  type BoundaryMode,
  type StencilOrder,
} from "./stencils";
import { rk4Step, type Rk4Scratch } from "./rk4";
import {
  stressEnergyMatchesGrid,
  type StressEnergyFieldSet,
} from "./stress-energy";

export interface GaugeParams {
  lapseKappa?: number;
  shiftEta?: number;
  shiftGamma?: number;
  advect?: boolean;
}

export type AdvectScheme = "centered" | "upwind1";

export interface StencilParams {
  order?: StencilOrder;
  boundary?: BoundaryMode;
}

export interface ExcisionParams {
  radius: number;
  center?: Vec3;
}

export interface BoundaryParams {
  mode?: BoundaryMode;
  spongeCells?: number;
  excision?: ExcisionParams;
}

export interface ConstraintDampingParams {
  enabled?: boolean;
  strength?: number;
}

export interface KoDissipationParams {
  eps?: number;
  targets?: "gauge" | "all";
}

export interface FixupParams {
  detGamma?: boolean;
  traceA?: boolean;
  clampAlpha?: boolean;
  alphaMin?: number;
  alphaMax?: number;
  kMaxAbs?: number;
  constraintDamping?: ConstraintDampingParams;
}

export type FixupStepStats = {
  alphaClampCount: number;
  kClampCount: number;
  detFixCount: number;
  traceFixCount: number;
  maxAlphaBeforeClamp: number;
  maxKBeforeClamp: number;
};

export type FixupStats = FixupStepStats & {
  totalCells: number;
  alphaClampByStep: number[];
  kClampByStep: number[];
  detFixByStep: number[];
  traceFixByStep: number[];
  alphaClampMin: number;
  alphaClampMax: number;
  kClampMaxAbs: number;
  postStep?: FixupStepStats;
  clampFraction?: number;
};

export interface BssnEvolveParams {
  rhs?: (state: BssnState, out: BssnRhs) => void;
  gauge?: GaugeParams;
  stencils?: StencilParams;
  matter?: StressEnergyFieldSet | null;
  boundary?: BoundaryParams;
  fixups?: FixupParams;
  fixupStats?: FixupStats;
  koEps?: number;
  koTargets?: KoDissipationParams["targets"];
  advectScheme?: AdvectScheme;
}

type SymMetric = {
  xx: number;
  yy: number;
  zz: number;
  xy: number;
  xz: number;
  yz: number;
};

const DEFAULT_GAUGE: Required<GaugeParams> = {
  lapseKappa: 2,
  shiftEta: 1,
  shiftGamma: 0.75,
  advect: true,
};

const DEFAULT_STENCILS: Required<StencilParams> = {
  order: 2,
  boundary: "clamp",
};

const DEFAULT_SPONGE_CELLS = 4;
const DEFAULT_CONSTRAINT_DAMPING: Required<ConstraintDampingParams> = {
  enabled: true,
  strength: 0.05,
};
const DEFAULT_KO: Required<KoDissipationParams> = {
  eps: 0,
  targets: "gauge",
};
const DEFAULT_ADVECT_SCHEME: AdvectScheme = "centered";
const DEFAULT_FIXUPS: Required<FixupParams> = {
  detGamma: true,
  traceA: true,
  clampAlpha: true,
  alphaMin: 1e-6,
  alphaMax: 10,
  kMaxAbs: 1e6,
  constraintDamping: DEFAULT_CONSTRAINT_DAMPING,
};
const FOUR_PI = 4 * Math.PI;
const EIGHT_PI = 8 * Math.PI;
const SIXTEEN_PI = 16 * Math.PI;

const KO_GAUGE_FIELDS: BssnFieldKey[] = [
  "alpha",
  "beta_x",
  "beta_y",
  "beta_z",
  "B_x",
  "B_y",
  "B_z",
];

const clampIndex = (value: number, size: number) =>
  Math.max(0, Math.min(size - 1, value));

const wrapIndex = (value: number, size: number) => {
  const mod = value % size;
  return mod < 0 ? mod + size : mod;
};

const resolveIndex = (value: number, size: number, mode: BoundaryMode) =>
  mode === "periodic" ? wrapIndex(value, size) : clampIndex(value, size);

const sample = (
  field: Float32Array,
  i: number,
  j: number,
  k: number,
  dims: [number, number, number],
  boundary: BoundaryMode,
) => {
  const ii = resolveIndex(i, dims[0], boundary);
  const jj = resolveIndex(j, dims[1], boundary);
  const kk = resolveIndex(k, dims[2], boundary);
  return field[index3D(ii, jj, kk, dims)];
};

const diffMixed = (
  field: Float32Array,
  i: number,
  j: number,
  k: number,
  axisA: 0 | 1 | 2,
  axisB: 0 | 1 | 2,
  dims: [number, number, number],
  spacing: [number, number, number],
  boundary: BoundaryMode,
) => {
  const da = axisA === 0 ? 1 : 0;
  const db = axisA === 1 ? 1 : 0;
  const dc = axisA === 2 ? 1 : 0;
  const ea = axisB === 0 ? 1 : 0;
  const eb = axisB === 1 ? 1 : 0;
  const ec = axisB === 2 ? 1 : 0;
  const fpp = sample(field, i + da + ea, j + db + eb, k + dc + ec, dims, boundary);
  const fpm = sample(field, i + da - ea, j + db - eb, k + dc - ec, dims, boundary);
  const fmp = sample(field, i - da + ea, j - db + eb, k - dc + ec, dims, boundary);
  const fmm = sample(field, i - da - ea, j - db - eb, k - dc - ec, dims, boundary);
  const dx = spacing[axisA];
  const dy = spacing[axisB];
  if (dx === 0 || dy === 0) return 0;
  return (fpp - fpm - fmp + fmm) / (4 * dx * dy);
};

const invertSymmetric = (m: SymMetric) => {
  const { xx, yy, zz, xy, xz, yz } = m;
  const a = yy * zz - yz * yz;
  const b = xz * yz - xy * zz;
  const c = xy * yz - xz * yy;
  const d = xx * zz - xz * xz;
  const e = xy * xz - xx * yz;
  const f = xx * yy - xy * xy;
  const det = xx * a + xy * b + xz * c;
  const safeDet = Math.abs(det) > 1e-18 ? det : Math.sign(det || 1) * 1e-18;
  const inv: SymMetric = {
    xx: a / safeDet,
    yy: d / safeDet,
    zz: f / safeDet,
    xy: b / safeDet,
    xz: c / safeDet,
    yz: e / safeDet,
  };
  return { inv, det: safeDet };
};

const metricToMatrix = (m: SymMetric) => ([
  [m.xx, m.xy, m.xz],
  [m.xy, m.yy, m.yz],
  [m.xz, m.yz, m.zz],
] as const);

const traceWithInv = (inv: number[][], tensor: number[][]) => {
  let sum = 0;
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      sum += inv[i][j] * tensor[i][j];
    }
  }
  return sum;
};

const computeAdvection = (
  field: Float32Array,
  i: number,
  j: number,
  k: number,
  beta: [number, number, number],
  state: BssnState,
  options: Required<StencilParams>,
  advectScheme: AdvectScheme,
) => {
  const dx =
    advectScheme === "upwind1"
      ? diff1Upwind(field, i, j, k, 0, state.grid, beta[0], options)
      : diff1(field, i, j, k, 0, state.grid, options);
  const dy =
    advectScheme === "upwind1"
      ? diff1Upwind(field, i, j, k, 1, state.grid, beta[1], options)
      : diff1(field, i, j, k, 1, state.grid, options);
  const dz =
    advectScheme === "upwind1"
      ? diff1Upwind(field, i, j, k, 2, state.grid, beta[2], options)
      : diff1(field, i, j, k, 2, state.grid, options);
  return beta[0] * dx + beta[1] * dy + beta[2] * dz;
};

const resolveKoParams = (
  koEps?: number,
  koTargets?: KoDissipationParams["targets"],
): Required<KoDissipationParams> => {
  const eps =
    Number.isFinite(koEps as number) && (koEps as number) > 0
      ? (koEps as number)
      : DEFAULT_KO.eps;
  const targets = koTargets === "all" ? "all" : DEFAULT_KO.targets;
  return { eps, targets };
};

const applyKoDissipation = (
  state: BssnState,
  out: BssnRhs,
  stencils: Required<StencilParams>,
  params: Required<KoDissipationParams>,
) => {
  if (!(params.eps > 0)) return;
  const fields = params.targets === "all" ? BSSN_FIELD_KEYS : KO_GAUGE_FIELDS;
  const targets = fields.map((key) => ({
    field: state[key],
    rhs: out[key],
  }));
  const [nx, ny, nz] = state.grid.dims;
  let idx = 0;
  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        for (const target of targets) {
          const dissipation = koDissipationAt(target.field, i, j, k, state.grid, stencils);
          if (Number.isFinite(dissipation)) {
            target.rhs[idx] += -params.eps * dissipation;
          }
        }
        idx += 1;
      }
    }
  }
};

const computeBssnRhsWithParams = (
  state: BssnState,
  out: BssnRhs,
  gauge: Required<GaugeParams>,
  stencils: Required<StencilParams>,
  advectScheme: AdvectScheme,
  dissipation: Required<KoDissipationParams>,
  matter?: StressEnergyFieldSet | null,
): void => {
  const { dims, spacing } = state.grid;
  const [nx, ny, nz] = dims;
  const boundary = stencils.boundary;
  const order = stencils.order;
  const matterEnabled = !!matter;

  if (matterEnabled && !stressEnergyMatchesGrid(matter!, state.grid)) {
    throw new Error("Stress-energy field set does not match grid size");
  }

  clearBssnFieldSet(out);

  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const idx = index3D(i, j, k, dims);

        const alpha = state.alpha[idx];
        const betaX = state.beta_x[idx];
        const betaY = state.beta_y[idx];
        const betaZ = state.beta_z[idx];
        const BX = state.B_x[idx];
        const BY = state.B_y[idx];
        const BZ = state.B_z[idx];
        const phi = state.phi[idx];
        const K = state.K[idx];
        const GammaX = state.Gamma_x[idx];
        const GammaY = state.Gamma_y[idx];
        const GammaZ = state.Gamma_z[idx];

        const gamma: SymMetric = {
          xx: state.gamma_xx[idx],
          yy: state.gamma_yy[idx],
          zz: state.gamma_zz[idx],
          xy: state.gamma_xy[idx],
          xz: state.gamma_xz[idx],
          yz: state.gamma_yz[idx],
        };
        const A: SymMetric = {
          xx: state.A_xx[idx],
          yy: state.A_yy[idx],
          zz: state.A_zz[idx],
          xy: state.A_xy[idx],
          xz: state.A_xz[idx],
          yz: state.A_yz[idx],
        };

        const { inv: gammaInv } = invertSymmetric(gamma);
        const gMat = metricToMatrix(gamma);
        const gInvMat = metricToMatrix(gammaInv).map((row) => Array.from(row));
        const AMat = metricToMatrix(A).map((row) => Array.from(row));

        const dAlpha = [
          diff1(state.alpha, i, j, k, 0, state.grid, { order, boundary }),
          diff1(state.alpha, i, j, k, 1, state.grid, { order, boundary }),
          diff1(state.alpha, i, j, k, 2, state.grid, { order, boundary }),
        ] as const;
        const dPhi = [
          diff1(state.phi, i, j, k, 0, state.grid, { order, boundary }),
          diff1(state.phi, i, j, k, 1, state.grid, { order, boundary }),
          diff1(state.phi, i, j, k, 2, state.grid, { order, boundary }),
        ] as const;
        const dK = [
          diff1(state.K, i, j, k, 0, state.grid, { order, boundary }),
          diff1(state.K, i, j, k, 1, state.grid, { order, boundary }),
          diff1(state.K, i, j, k, 2, state.grid, { order, boundary }),
        ] as const;

        const dBeta = [
          [
            diff1(state.beta_x, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.beta_x, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.beta_x, i, j, k, 2, state.grid, { order, boundary }),
          ],
          [
            diff1(state.beta_y, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.beta_y, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.beta_y, i, j, k, 2, state.grid, { order, boundary }),
          ],
          [
            diff1(state.beta_z, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.beta_z, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.beta_z, i, j, k, 2, state.grid, { order, boundary }),
          ],
        ] as const;
        const divBeta = dBeta[0][0] + dBeta[1][1] + dBeta[2][2];

        const dGammaCon = [
          [
            diff1(state.Gamma_x, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.Gamma_x, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.Gamma_x, i, j, k, 2, state.grid, { order, boundary }),
          ],
          [
            diff1(state.Gamma_y, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.Gamma_y, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.Gamma_y, i, j, k, 2, state.grid, { order, boundary }),
          ],
          [
            diff1(state.Gamma_z, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.Gamma_z, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.Gamma_z, i, j, k, 2, state.grid, { order, boundary }),
          ],
        ] as const;

        const dGammaMetric = [
          [
            diff1(state.gamma_xx, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_yy, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_zz, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_xy, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_xz, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_yz, i, j, k, 0, state.grid, { order, boundary }),
          ],
          [
            diff1(state.gamma_xx, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_yy, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_zz, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_xy, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_xz, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_yz, i, j, k, 1, state.grid, { order, boundary }),
          ],
          [
            diff1(state.gamma_xx, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_yy, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_zz, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_xy, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_xz, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_yz, i, j, k, 2, state.grid, { order, boundary }),
          ],
        ] as const;

        const gammaComp = (a: number, b: number) => {
          if (a === b) {
            if (a === 0) return gamma.xx;
            if (a === 1) return gamma.yy;
            return gamma.zz;
          }
          if ((a === 0 && b === 1) || (a === 1 && b === 0)) return gamma.xy;
          if ((a === 0 && b === 2) || (a === 2 && b === 0)) return gamma.xz;
          return gamma.yz;
        };

        const dGammaComp = (axis: number, a: number, b: number) => {
          const values = dGammaMetric[axis];
          if (a === b) {
            if (a === 0) return values[0];
            if (a === 1) return values[1];
            return values[2];
          }
          if ((a === 0 && b === 1) || (a === 1 && b === 0)) return values[3];
          if ((a === 0 && b === 2) || (a === 2 && b === 0)) return values[4];
          return values[5];
        };

        const Gamma = [
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        ];

        for (let ii = 0; ii < 3; ii += 1) {
          for (let jj = 0; jj < 3; jj += 1) {
            for (let kk = 0; kk < 3; kk += 1) {
              let sum = 0;
              for (let ll = 0; ll < 3; ll += 1) {
                const d1 = dGammaComp(jj, kk, ll);
                const d2 = dGammaComp(kk, jj, ll);
                const d3 = dGammaComp(ll, jj, kk);
                sum += gInvMat[ii][ll] * (d1 + d2 - d3);
              }
              Gamma[ii][jj][kk] = 0.5 * sum;
            }
          }
        }

        const GammaLower = [
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        ];
        for (let ii = 0; ii < 3; ii += 1) {
          for (let jj = 0; jj < 3; jj += 1) {
            for (let kk = 0; kk < 3; kk += 1) {
              let sum = 0;
              for (let ll = 0; ll < 3; ll += 1) {
                sum += gMat[ii][ll] * Gamma[ll][jj][kk];
              }
              GammaLower[ii][jj][kk] = sum;
            }
          }
        }

        const ddAlpha = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        const ddPhi = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            if (aa === bb) {
              ddAlpha[aa][bb] = diff2(state.alpha, i, j, k, aa as 0 | 1 | 2, state.grid, {
                order,
                boundary,
              });
              ddPhi[aa][bb] = diff2(state.phi, i, j, k, aa as 0 | 1 | 2, state.grid, {
                order,
                boundary,
              });
            } else {
              ddAlpha[aa][bb] = diffMixed(
                state.alpha,
                i,
                j,
                k,
                aa as 0 | 1 | 2,
                bb as 0 | 1 | 2,
                dims,
                spacing,
                boundary,
              );
              ddPhi[aa][bb] = diffMixed(
                state.phi,
                i,
                j,
                k,
                aa as 0 | 1 | 2,
                bb as 0 | 1 | 2,
                dims,
                spacing,
                boundary,
              );
            }
          }
        }

        const DAlpha = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        const DPhi = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            let corrAlpha = 0;
            let corrPhi = 0;
            for (let cc = 0; cc < 3; cc += 1) {
              corrAlpha += Gamma[cc][aa][bb] * dAlpha[cc];
              corrPhi += Gamma[cc][aa][bb] * dPhi[cc];
            }
            DAlpha[aa][bb] = ddAlpha[aa][bb] - corrAlpha;
            DPhi[aa][bb] = ddPhi[aa][bb] - corrPhi;
          }
        }

        const lapAlpha = traceWithInv(gInvMat, DAlpha);
        const lapPhi = traceWithInv(gInvMat, DPhi);
        let gradPhiSq = 0;
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            gradPhiSq += gInvMat[aa][bb] * dPhi[aa] * dPhi[bb];
          }
        }

        const Rtilde = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            let term1 = 0;
            for (let ll = 0; ll < 3; ll += 1) {
              for (let mm = 0; mm < 3; mm += 1) {
                let d2 = 0;
                if (ll === mm) {
                  d2 = diff2(
                    aa === 0 && bb === 0
                      ? state.gamma_xx
                      : aa === 1 && bb === 1
                        ? state.gamma_yy
                        : aa === 2 && bb === 2
                          ? state.gamma_zz
                          : aa === 0 && bb === 1
                            ? state.gamma_xy
                            : aa === 0 && bb === 2
                              ? state.gamma_xz
                              : state.gamma_yz,
                    i,
                    j,
                    k,
                    ll as 0 | 1 | 2,
                    state.grid,
                    { order, boundary },
                  );
                } else {
                  d2 = diffMixed(
                    aa === 0 && bb === 0
                      ? state.gamma_xx
                      : aa === 1 && bb === 1
                        ? state.gamma_yy
                        : aa === 2 && bb === 2
                          ? state.gamma_zz
                          : aa === 0 && bb === 1
                            ? state.gamma_xy
                            : aa === 0 && bb === 2
                              ? state.gamma_xz
                              : state.gamma_yz,
                    i,
                    j,
                    k,
                    ll as 0 | 1 | 2,
                    mm as 0 | 1 | 2,
                    dims,
                    spacing,
                    boundary,
                  );
                }
                term1 += gInvMat[ll][mm] * d2;
              }
            }
            term1 *= -0.5;

            let term2 = 0;
            for (let kk = 0; kk < 3; kk += 1) {
              term2 += 0.5 * (gammaComp(kk, aa) * dGammaCon[kk][bb] + gammaComp(kk, bb) * dGammaCon[kk][aa]);
            }

            let term3 = 0;
            for (let kk = 0; kk < 3; kk += 1) {
              const GammaVal = kk === 0 ? GammaX : kk === 1 ? GammaY : GammaZ;
              const sym = 0.5 * (GammaLower[aa][bb][kk] + GammaLower[bb][aa][kk]);
              term3 += GammaVal * sym;
            }

            let term4 = 0;
            for (let ll = 0; ll < 3; ll += 1) {
              for (let mm = 0; mm < 3; mm += 1) {
                let sum = 0;
                for (let kk = 0; kk < 3; kk += 1) {
                  sum +=
                    Gamma[kk][ll][aa] * GammaLower[bb][kk][mm] +
                    Gamma[kk][ll][bb] * GammaLower[aa][kk][mm] +
                    Gamma[kk][aa][mm] * GammaLower[kk][ll][bb];
                }
                term4 += gInvMat[ll][mm] * sum;
              }
            }

            Rtilde[aa][bb] = term1 + term2 + term3 + term4;
          }
        }

        const Rphi = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            Rphi[aa][bb] =
              -2 * DPhi[aa][bb] -
              2 * gMat[aa][bb] * lapPhi +
              4 * dPhi[aa] * dPhi[bb] -
              4 * gMat[aa][bb] * gradPhiSq;
          }
        }

        const Rij = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            Rij[aa][bb] = Rtilde[aa][bb] + Rphi[aa][bb];
          }
        }

        const AUpDown = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        const AUp = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            let sum = 0;
            for (let kk = 0; kk < 3; kk += 1) {
              sum += gInvMat[aa][kk] * AMat[kk][bb];
            }
            AUpDown[aa][bb] = sum;
          }
        }
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            let sum = 0;
            for (let kk = 0; kk < 3; kk += 1) {
              sum += gInvMat[bb][kk] * AUpDown[aa][kk];
            }
            AUp[aa][bb] = sum;
          }
        }

        let A2 = 0;
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            A2 += AMat[aa][bb] * AUp[aa][bb];
          }
        }

        const beta = [betaX, betaY, betaZ] as [number, number, number];
        const advectEnabled = gauge.advect;
        const advect = (field: Float32Array) =>
          advectEnabled
            ? computeAdvection(field, i, j, k, beta, state, stencils, advectScheme)
            : 0;

        const phiRhs = -alpha * K / 6 + (divBeta / 6) + advect(state.phi);

        const gammaRhs = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            let lie = advect(
              aa === 0 && bb === 0
                ? state.gamma_xx
                : aa === 1 && bb === 1
                  ? state.gamma_yy
                  : aa === 2 && bb === 2
                    ? state.gamma_zz
                    : aa === 0 && bb === 1
                      ? state.gamma_xy
                      : aa === 0 && bb === 2
                        ? state.gamma_xz
                        : state.gamma_yz,
            );
            let term = 0;
            for (let kk = 0; kk < 3; kk += 1) {
              term += gMat[aa][kk] * dBeta[kk][bb] + gMat[bb][kk] * dBeta[kk][aa];
            }
            lie += term - (2 / 3) * gMat[aa][bb] * divBeta;
            gammaRhs[aa][bb] = -2 * alpha * AMat[aa][bb] + lie;
          }
        }

        let Kdot = -lapAlpha + alpha * (A2 + (K * K) / 3) + advect(state.K);

        const Sij = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            Sij[aa][bb] = -DAlpha[aa][bb] + alpha * Rij[aa][bb];
          }
        }
        const traceS = traceWithInv(gInvMat, Sij);
        const expMinus4Phi = Math.exp(-4 * phi);
        let matterTrace = 0;
        let matterRho = 0;
        let matterSx = 0;
        let matterSy = 0;
        let matterSz = 0;
        let matterSxx = 0;
        let matterSyy = 0;
        let matterSzz = 0;
        let matterSxy = 0;
        let matterSxz = 0;
        let matterSyz = 0;
        if (matterEnabled) {
          matterRho = matter!.rho[idx];
          matterSx = matter!.Sx[idx];
          matterSy = matter!.Sy[idx];
          matterSz = matter!.Sz[idx];
          matterSxx = matter!.S_xx[idx];
          matterSyy = matter!.S_yy[idx];
          matterSzz = matter!.S_zz[idx];
          matterSxy = matter!.S_xy[idx];
          matterSxz = matter!.S_xz[idx];
          matterSyz = matter!.S_yz[idx];
          matterTrace =
            expMinus4Phi *
            (gInvMat[0][0] * matterSxx +
              gInvMat[1][1] * matterSyy +
              gInvMat[2][2] * matterSzz +
              2 *
                (gInvMat[0][1] * matterSxy +
                  gInvMat[0][2] * matterSxz +
                  gInvMat[1][2] * matterSyz));
          Kdot += FOUR_PI * alpha * (matterRho + matterTrace);
        }

        const A_Rhs = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            const tf = Sij[aa][bb] - (gMat[aa][bb] * traceS) / 3;
            let term = expMinus4Phi * tf;
            let AikAkj = 0;
            for (let kk = 0; kk < 3; kk += 1) {
              AikAkj += AMat[aa][kk] * AUpDown[kk][bb];
            }
            term += alpha * (K * AMat[aa][bb] - 2 * AikAkj);
            if (matterEnabled) {
              const sComp =
                aa === 0 && bb === 0
                  ? matterSxx
                  : aa === 1 && bb === 1
                    ? matterSyy
                    : aa === 2 && bb === 2
                      ? matterSzz
                      : aa === 0 && bb === 1
                        ? matterSxy
                        : aa === 0 && bb === 2
                          ? matterSxz
                          : matterSyz;
              const sTf = expMinus4Phi * sComp - (gMat[aa][bb] * matterTrace) / 3;
              term += -EIGHT_PI * alpha * sTf;
            }
            let lie = advect(
              aa === 0 && bb === 0
                ? state.A_xx
                : aa === 1 && bb === 1
                  ? state.A_yy
                  : aa === 2 && bb === 2
                    ? state.A_zz
                    : aa === 0 && bb === 1
                      ? state.A_xy
                      : aa === 0 && bb === 2
                        ? state.A_xz
                        : state.A_yz,
            );
            let ad = 0;
            for (let kk = 0; kk < 3; kk += 1) {
              ad += AMat[aa][kk] * dBeta[kk][bb] + AMat[bb][kk] * dBeta[kk][aa];
            }
            lie += ad - (2 / 3) * AMat[aa][bb] * divBeta;
            A_Rhs[aa][bb] = term + lie;
          }
        }

        const d2Beta = [
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        ];
        const betaFields = [state.beta_x, state.beta_y, state.beta_z];
        for (let bb = 0; bb < 3; bb += 1) {
          const field = betaFields[bb];
          for (let aa = 0; aa < 3; aa += 1) {
            for (let cc = 0; cc < 3; cc += 1) {
              if (aa === cc) {
                d2Beta[bb][aa][cc] = diff2(field, i, j, k, aa as 0 | 1 | 2, state.grid, {
                  order,
                  boundary,
                });
              } else {
                d2Beta[bb][aa][cc] = diffMixed(
                  field,
                  i,
                  j,
                  k,
                  aa as 0 | 1 | 2,
                  cc as 0 | 1 | 2,
                  dims,
                  spacing,
                  boundary,
                );
              }
            }
          }
        }

        const matterSUp = matterEnabled
          ? ([
              expMinus4Phi *
                (gInvMat[0][0] * matterSx +
                  gInvMat[0][1] * matterSy +
                  gInvMat[0][2] * matterSz),
              expMinus4Phi *
                (gInvMat[1][0] * matterSx +
                  gInvMat[1][1] * matterSy +
                  gInvMat[1][2] * matterSz),
              expMinus4Phi *
                (gInvMat[2][0] * matterSx +
                  gInvMat[2][1] * matterSy +
                  gInvMat[2][2] * matterSz),
            ] as const)
          : null;

        const GammaRhs = [0, 0, 0];
        for (let aa = 0; aa < 3; aa += 1) {
          let term1 = 0;
          let lapBeta = 0;
          let gradDiv = 0;
          for (let bb = 0; bb < 3; bb += 1) {
            term1 += -2 * AUp[aa][bb] * dAlpha[bb];
            term1 += -4 * alpha * gInvMat[aa][bb] * dK[bb] / 3;
            gradDiv += gInvMat[aa][bb] * (
              d2Beta[0][bb][0] + d2Beta[1][bb][1] + d2Beta[2][bb][2]
            );
            for (let cc = 0; cc < 3; cc += 1) {
              term1 += 2 * alpha * (Gamma[aa][bb][cc] * AUp[bb][cc]);
              lapBeta += gInvMat[bb][cc] * d2Beta[aa][bb][cc];
            }
          }
          term1 += lapBeta + gradDiv / 3;
          if (matterSUp) {
            term1 += -SIXTEEN_PI * alpha * matterSUp[aa];
          }
          let adv = 0;
          if (advectEnabled) {
            adv = computeAdvection(
              aa === 0 ? state.Gamma_x : aa === 1 ? state.Gamma_y : state.Gamma_z,
              i,
              j,
              k,
              beta,
              state,
              stencils,
              advectScheme,
            );
          }
          const GammaVal = aa === 0 ? GammaX : aa === 1 ? GammaY : GammaZ;
          const shiftTerm =
            -GammaX * dBeta[aa][0] -
            GammaY * dBeta[aa][1] -
            GammaZ * dBeta[aa][2] +
            (2 / 3) * GammaVal * divBeta;
          GammaRhs[aa] = term1 + adv + shiftTerm;
        }

        const betaRhs = [
          gauge.shiftGamma * BX + (advectEnabled ? advect(state.beta_x) : 0),
          gauge.shiftGamma * BY + (advectEnabled ? advect(state.beta_y) : 0),
          gauge.shiftGamma * BZ + (advectEnabled ? advect(state.beta_z) : 0),
        ];

        const BRhs = [
          GammaRhs[0] - gauge.shiftEta * BX + (advectEnabled ? advect(state.B_x) : 0),
          GammaRhs[1] - gauge.shiftEta * BY + (advectEnabled ? advect(state.B_y) : 0),
          GammaRhs[2] - gauge.shiftEta * BZ + (advectEnabled ? advect(state.B_z) : 0),
        ];

        out.alpha[idx] = -gauge.lapseKappa * alpha * K + (advectEnabled ? advect(state.alpha) : 0);
        out.beta_x[idx] = betaRhs[0];
        out.beta_y[idx] = betaRhs[1];
        out.beta_z[idx] = betaRhs[2];
        out.B_x[idx] = BRhs[0];
        out.B_y[idx] = BRhs[1];
        out.B_z[idx] = BRhs[2];
        out.phi[idx] = phiRhs;
        out.gamma_xx[idx] = gammaRhs[0][0];
        out.gamma_yy[idx] = gammaRhs[1][1];
        out.gamma_zz[idx] = gammaRhs[2][2];
        out.gamma_xy[idx] = gammaRhs[0][1];
        out.gamma_xz[idx] = gammaRhs[0][2];
        out.gamma_yz[idx] = gammaRhs[1][2];
        out.A_xx[idx] = A_Rhs[0][0];
        out.A_yy[idx] = A_Rhs[1][1];
        out.A_zz[idx] = A_Rhs[2][2];
        out.A_xy[idx] = A_Rhs[0][1];
        out.A_xz[idx] = A_Rhs[0][2];
        out.A_yz[idx] = A_Rhs[1][2];
        out.K[idx] = Kdot;
        out.Gamma_x[idx] = GammaRhs[0];
        out.Gamma_y[idx] = GammaRhs[1];
        out.Gamma_z[idx] = GammaRhs[2];
      }
    }
  }

  applyKoDissipation(state, out, stencils, dissipation);
};

export interface ConstraintFields {
  H: Float32Array;
  Mx: Float32Array;
  My: Float32Array;
  Mz: Float32Array;
}

const buildAupArrays = (state: BssnState): {
  xx: Float32Array;
  yy: Float32Array;
  zz: Float32Array;
  xy: Float32Array;
  xz: Float32Array;
  yz: Float32Array;
} => {
  const total = state.alpha.length;
  const Aup_xx = new Float32Array(total);
  const Aup_yy = new Float32Array(total);
  const Aup_zz = new Float32Array(total);
  const Aup_xy = new Float32Array(total);
  const Aup_xz = new Float32Array(total);
  const Aup_yz = new Float32Array(total);

  for (let idx = 0; idx < total; idx += 1) {
    const gamma: SymMetric = {
      xx: state.gamma_xx[idx],
      yy: state.gamma_yy[idx],
      zz: state.gamma_zz[idx],
      xy: state.gamma_xy[idx],
      xz: state.gamma_xz[idx],
      yz: state.gamma_yz[idx],
    };
    const A: SymMetric = {
      xx: state.A_xx[idx],
      yy: state.A_yy[idx],
      zz: state.A_zz[idx],
      xy: state.A_xy[idx],
      xz: state.A_xz[idx],
      yz: state.A_yz[idx],
    };
    const { inv: gammaInv } = invertSymmetric(gamma);
    const gInv = metricToMatrix(gammaInv).map((row) => Array.from(row));
    const AMat = metricToMatrix(A).map((row) => Array.from(row));
    const Aup = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let ii = 0; ii < 3; ii += 1) {
      for (let jj = 0; jj < 3; jj += 1) {
        let sum = 0;
        for (let kk = 0; kk < 3; kk += 1) {
          for (let ll = 0; ll < 3; ll += 1) {
            sum += gInv[ii][kk] * gInv[jj][ll] * AMat[kk][ll];
          }
        }
        Aup[ii][jj] = sum;
      }
    }
    Aup_xx[idx] = Aup[0][0];
    Aup_yy[idx] = Aup[1][1];
    Aup_zz[idx] = Aup[2][2];
    Aup_xy[idx] = 0.5 * (Aup[0][1] + Aup[1][0]);
    Aup_xz[idx] = 0.5 * (Aup[0][2] + Aup[2][0]);
    Aup_yz[idx] = 0.5 * (Aup[1][2] + Aup[2][1]);
  }

  return {
    xx: Aup_xx,
    yy: Aup_yy,
    zz: Aup_zz,
    xy: Aup_xy,
    xz: Aup_xz,
    yz: Aup_yz,
  };
};

export const computeBssnConstraints = (
  state: BssnState,
  params: { stencils?: StencilParams; matter?: StressEnergyFieldSet | null } = {},
): ConstraintFields => {
  const stencils = { ...DEFAULT_STENCILS, ...(params.stencils ?? {}) };
  const { dims, spacing } = state.grid;
  const [nx, ny, nz] = dims;
  const boundary = stencils.boundary;
  const order = stencils.order;
  const matter = params.matter ?? null;
  const matterEnabled = !!matter;

  if (matterEnabled && !stressEnergyMatchesGrid(matter!, state.grid)) {
    throw new Error("Stress-energy field set does not match grid size");
  }
  const total = nx * ny * nz;
  const H = new Float32Array(total);
  const Mx = new Float32Array(total);
  const My = new Float32Array(total);
  const Mz = new Float32Array(total);

  const Aup = buildAupArrays(state);

  const AupComp = (idx: number, a: number, b: number) => {
    if (a === b) {
      if (a === 0) return Aup.xx[idx];
      if (a === 1) return Aup.yy[idx];
      return Aup.zz[idx];
    }
    if ((a === 0 && b === 1) || (a === 1 && b === 0)) return Aup.xy[idx];
    if ((a === 0 && b === 2) || (a === 2 && b === 0)) return Aup.xz[idx];
    return Aup.yz[idx];
  };

  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const idx = index3D(i, j, k, dims);
        const phi = state.phi[idx];
        const K = state.K[idx];
        const GammaX = state.Gamma_x[idx];
        const GammaY = state.Gamma_y[idx];
        const GammaZ = state.Gamma_z[idx];

        const gamma: SymMetric = {
          xx: state.gamma_xx[idx],
          yy: state.gamma_yy[idx],
          zz: state.gamma_zz[idx],
          xy: state.gamma_xy[idx],
          xz: state.gamma_xz[idx],
          yz: state.gamma_yz[idx],
        };
        const A: SymMetric = {
          xx: state.A_xx[idx],
          yy: state.A_yy[idx],
          zz: state.A_zz[idx],
          xy: state.A_xy[idx],
          xz: state.A_xz[idx],
          yz: state.A_yz[idx],
        };

        const { inv: gammaInv } = invertSymmetric(gamma);
        const gMat = metricToMatrix(gamma);
        const gInvMat = metricToMatrix(gammaInv).map((row) => Array.from(row));

        const dPhi = [
          diff1(state.phi, i, j, k, 0, state.grid, { order, boundary }),
          diff1(state.phi, i, j, k, 1, state.grid, { order, boundary }),
          diff1(state.phi, i, j, k, 2, state.grid, { order, boundary }),
        ] as const;
        const dK = [
          diff1(state.K, i, j, k, 0, state.grid, { order, boundary }),
          diff1(state.K, i, j, k, 1, state.grid, { order, boundary }),
          diff1(state.K, i, j, k, 2, state.grid, { order, boundary }),
        ] as const;

        const dGammaCon = [
          [
            diff1(state.Gamma_x, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.Gamma_x, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.Gamma_x, i, j, k, 2, state.grid, { order, boundary }),
          ],
          [
            diff1(state.Gamma_y, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.Gamma_y, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.Gamma_y, i, j, k, 2, state.grid, { order, boundary }),
          ],
          [
            diff1(state.Gamma_z, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.Gamma_z, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.Gamma_z, i, j, k, 2, state.grid, { order, boundary }),
          ],
        ] as const;

        const dGammaMetric = [
          [
            diff1(state.gamma_xx, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_yy, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_zz, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_xy, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_xz, i, j, k, 0, state.grid, { order, boundary }),
            diff1(state.gamma_yz, i, j, k, 0, state.grid, { order, boundary }),
          ],
          [
            diff1(state.gamma_xx, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_yy, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_zz, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_xy, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_xz, i, j, k, 1, state.grid, { order, boundary }),
            diff1(state.gamma_yz, i, j, k, 1, state.grid, { order, boundary }),
          ],
          [
            diff1(state.gamma_xx, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_yy, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_zz, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_xy, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_xz, i, j, k, 2, state.grid, { order, boundary }),
            diff1(state.gamma_yz, i, j, k, 2, state.grid, { order, boundary }),
          ],
        ] as const;

        const gammaComp = (a: number, b: number) => {
          if (a === b) {
            if (a === 0) return gamma.xx;
            if (a === 1) return gamma.yy;
            return gamma.zz;
          }
          if ((a === 0 && b === 1) || (a === 1 && b === 0)) return gamma.xy;
          if ((a === 0 && b === 2) || (a === 2 && b === 0)) return gamma.xz;
          return gamma.yz;
        };

        const dGammaComp = (axis: number, a: number, b: number) => {
          const values = dGammaMetric[axis];
          if (a === b) {
            if (a === 0) return values[0];
            if (a === 1) return values[1];
            return values[2];
          }
          if ((a === 0 && b === 1) || (a === 1 && b === 0)) return values[3];
          if ((a === 0 && b === 2) || (a === 2 && b === 0)) return values[4];
          return values[5];
        };

        const Gamma = [
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        ];

        for (let ii = 0; ii < 3; ii += 1) {
          for (let jj = 0; jj < 3; jj += 1) {
            for (let kk = 0; kk < 3; kk += 1) {
              let sum = 0;
              for (let ll = 0; ll < 3; ll += 1) {
                const d1 = dGammaComp(jj, kk, ll);
                const d2 = dGammaComp(kk, jj, ll);
                const d3 = dGammaComp(ll, jj, kk);
                sum += gInvMat[ii][ll] * (d1 + d2 - d3);
              }
              Gamma[ii][jj][kk] = 0.5 * sum;
            }
          }
        }

        const GammaLower = [
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        ];
        for (let ii = 0; ii < 3; ii += 1) {
          for (let jj = 0; jj < 3; jj += 1) {
            for (let kk = 0; kk < 3; kk += 1) {
              let sum = 0;
              for (let ll = 0; ll < 3; ll += 1) {
                sum += gMat[ii][ll] * Gamma[ll][jj][kk];
              }
              GammaLower[ii][jj][kk] = sum;
            }
          }
        }

        const ddPhi = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            if (aa === bb) {
              ddPhi[aa][bb] = diff2(state.phi, i, j, k, aa as 0 | 1 | 2, state.grid, {
                order,
                boundary,
              });
            } else {
              ddPhi[aa][bb] = diffMixed(
                state.phi,
                i,
                j,
                k,
                aa as 0 | 1 | 2,
                bb as 0 | 1 | 2,
                dims,
                spacing,
                boundary,
              );
            }
          }
        }

        const DPhi = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            let corrPhi = 0;
            for (let cc = 0; cc < 3; cc += 1) {
              corrPhi += Gamma[cc][aa][bb] * dPhi[cc];
            }
            DPhi[aa][bb] = ddPhi[aa][bb] - corrPhi;
          }
        }

        const lapPhi = traceWithInv(gInvMat, DPhi);
        let gradPhiSq = 0;
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            gradPhiSq += gInvMat[aa][bb] * dPhi[aa] * dPhi[bb];
          }
        }

        const Rtilde = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            let term1 = 0;
            for (let ll = 0; ll < 3; ll += 1) {
              for (let mm = 0; mm < 3; mm += 1) {
                let d2 = 0;
                if (ll === mm) {
                  d2 = diff2(
                    aa === 0 && bb === 0
                      ? state.gamma_xx
                      : aa === 1 && bb === 1
                        ? state.gamma_yy
                        : aa === 2 && bb === 2
                          ? state.gamma_zz
                          : aa === 0 && bb === 1
                            ? state.gamma_xy
                            : aa === 0 && bb === 2
                              ? state.gamma_xz
                              : state.gamma_yz,
                    i,
                    j,
                    k,
                    ll as 0 | 1 | 2,
                    state.grid,
                    { order, boundary },
                  );
                } else {
                  d2 = diffMixed(
                    aa === 0 && bb === 0
                      ? state.gamma_xx
                      : aa === 1 && bb === 1
                        ? state.gamma_yy
                        : aa === 2 && bb === 2
                          ? state.gamma_zz
                          : aa === 0 && bb === 1
                            ? state.gamma_xy
                            : aa === 0 && bb === 2
                              ? state.gamma_xz
                              : state.gamma_yz,
                    i,
                    j,
                    k,
                    ll as 0 | 1 | 2,
                    mm as 0 | 1 | 2,
                    dims,
                    spacing,
                    boundary,
                  );
                }
                term1 += gInvMat[ll][mm] * d2;
              }
            }
            term1 *= -0.5;

            let term2 = 0;
            for (let kk = 0; kk < 3; kk += 1) {
              term2 += 0.5 * (gammaComp(kk, aa) * dGammaCon[kk][bb] + gammaComp(kk, bb) * dGammaCon[kk][aa]);
            }

            let term3 = 0;
            for (let kk = 0; kk < 3; kk += 1) {
              const GammaVal = kk === 0 ? GammaX : kk === 1 ? GammaY : GammaZ;
              const sym = 0.5 * (GammaLower[aa][bb][kk] + GammaLower[bb][aa][kk]);
              term3 += GammaVal * sym;
            }

            let term4 = 0;
            for (let ll = 0; ll < 3; ll += 1) {
              for (let mm = 0; mm < 3; mm += 1) {
                let sum = 0;
                for (let kk = 0; kk < 3; kk += 1) {
                  sum +=
                    Gamma[kk][ll][aa] * GammaLower[bb][kk][mm] +
                    Gamma[kk][ll][bb] * GammaLower[aa][kk][mm] +
                    Gamma[kk][aa][mm] * GammaLower[kk][ll][bb];
                }
                term4 += gInvMat[ll][mm] * sum;
              }
            }

            Rtilde[aa][bb] = term1 + term2 + term3 + term4;
          }
        }

        const Rphi = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            Rphi[aa][bb] =
              -2 * DPhi[aa][bb] -
              2 * gMat[aa][bb] * lapPhi +
              4 * dPhi[aa] * dPhi[bb] -
              4 * gMat[aa][bb] * gradPhiSq;
          }
        }

        const Rij = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (let aa = 0; aa < 3; aa += 1) {
          for (let bb = 0; bb < 3; bb += 1) {
            Rij[aa][bb] = Rtilde[aa][bb] + Rphi[aa][bb];
          }
        }

        const expMinus4Phi = Math.exp(-4 * phi);
        const Rscalar = expMinus4Phi * traceWithInv(gInvMat, Rij);

        const A2 =
          A.xx * Aup.xx[idx] +
          A.yy * Aup.yy[idx] +
          A.zz * Aup.zz[idx] +
          2 * (A.xy * Aup.xy[idx] + A.xz * Aup.xz[idx] + A.yz * Aup.yz[idx]);

        let Hval = Rscalar + (2 / 3) * K * K - A2;
        if (matterEnabled) {
          Hval -= SIXTEEN_PI * matter!.rho[idx];
        }
        H[idx] = Hval;

        const dAup_xx_dx = diff1(Aup.xx, i, j, k, 0, state.grid, stencils);
        const dAup_xy_dy = diff1(Aup.xy, i, j, k, 1, state.grid, stencils);
        const dAup_xz_dz = diff1(Aup.xz, i, j, k, 2, state.grid, stencils);
        const dAup_xy_dx = diff1(Aup.xy, i, j, k, 0, state.grid, stencils);
        const dAup_yy_dy = diff1(Aup.yy, i, j, k, 1, state.grid, stencils);
        const dAup_yz_dz = diff1(Aup.yz, i, j, k, 2, state.grid, stencils);
        const dAup_xz_dx = diff1(Aup.xz, i, j, k, 0, state.grid, stencils);
        const dAup_yz_dy = diff1(Aup.yz, i, j, k, 1, state.grid, stencils);
        const dAup_zz_dz = diff1(Aup.zz, i, j, k, 2, state.grid, stencils);

        const dAup = [
          dAup_xx_dx + dAup_xy_dy + dAup_xz_dz,
          dAup_xy_dx + dAup_yy_dy + dAup_yz_dz,
          dAup_xz_dx + dAup_yz_dy + dAup_zz_dz,
        ];

        const gammaTrace = [
          Gamma[0][0][0] + Gamma[1][1][0] + Gamma[2][2][0],
          Gamma[0][0][1] + Gamma[1][1][1] + Gamma[2][2][1],
          Gamma[0][0][2] + Gamma[1][1][2] + Gamma[2][2][2],
        ];

        const M = [0, 0, 0];
        for (let aa = 0; aa < 3; aa += 1) {
          let sumGamma = 0;
          let sumTrace = 0;
          for (let bb = 0; bb < 3; bb += 1) {
            for (let cc = 0; cc < 3; cc += 1) {
              sumGamma += Gamma[aa][bb][cc] * AupComp(idx, cc, bb);
            }
            sumTrace += gammaTrace[bb] * AupComp(idx, aa, bb);
          }
          let gradPhiTerm = 0;
          let gradKTerm = 0;
          for (let bb = 0; bb < 3; bb += 1) {
            gradPhiTerm += AupComp(idx, aa, bb) * dPhi[bb];
            gradKTerm += gInvMat[aa][bb] * dK[bb];
          }
          let Mval =
            dAup[aa] + sumGamma + sumTrace + 6 * gradPhiTerm - (2 / 3) * gradKTerm;
          if (matterEnabled) {
            const s =
              aa === 0 ? matter!.Sx[idx] : aa === 1 ? matter!.Sy[idx] : matter!.Sz[idx];
            Mval -= EIGHT_PI * s;
          }
          M[aa] = Mval;
        }

        Mx[idx] = M[0];
        My[idx] = M[1];
        Mz[idx] = M[2];
      }
    }
  }

  return { H, Mx, My, Mz };
};

const minkowskiValueForKey = (key: (typeof BSSN_FIELD_KEYS)[number]) => {
  switch (key) {
    case "alpha":
    case "gamma_xx":
    case "gamma_yy":
    case "gamma_zz":
      return 1;
    default:
      return 0;
  }
};

const applyMinkowskiAtIndex = (state: BssnState, idx: number) => {
  for (const key of BSSN_FIELD_KEYS) {
    state[key][idx] = minkowskiValueForKey(key);
  }
};

const clampInteriorIndex = (value: number, size: number) => {
  if (size <= 2) return Math.max(0, Math.min(size - 1, value));
  return Math.max(1, Math.min(size - 2, value));
};

const applyOutflowBoundary = (state: BssnState) => {
  const { dims } = state.grid;
  const [nx, ny, nz] = dims;
  if (nx < 2 || ny < 2 || nz < 2) return;
  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        if (i > 0 && i < nx - 1 && j > 0 && j < ny - 1 && k > 0 && k < nz - 1) {
          continue;
        }
        const srcI = clampInteriorIndex(i, nx);
        const srcJ = clampInteriorIndex(j, ny);
        const srcK = clampInteriorIndex(k, nz);
        const idx = index3D(i, j, k, dims);
        const srcIdx = index3D(srcI, srcJ, srcK, dims);
        for (const key of BSSN_FIELD_KEYS) {
          state[key][idx] = state[key][srcIdx];
        }
      }
    }
  }
};

const applySommerfeldSponge = (state: BssnState, spongeCells: number) => {
  const { dims } = state.grid;
  const [nx, ny, nz] = dims;
  const width = Math.max(1, Math.floor(spongeCells));
  if (width <= 0) return;
  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const dist = Math.min(i, j, k, nx - 1 - i, ny - 1 - j, nz - 1 - k);
        if (dist >= width) continue;
        const weight = (width - dist) / width;
        const idx = index3D(i, j, k, dims);
        for (const key of BSSN_FIELD_KEYS) {
          const base = minkowskiValueForKey(key);
          state[key][idx] = state[key][idx] * (1 - weight) + base * weight;
        }
      }
    }
  }
};

const applyExcision = (state: BssnState, excision?: ExcisionParams) => {
  if (!excision || !(excision.radius > 0)) return;
  const { grid } = state;
  const { dims, spacing } = grid;
  const [nx, ny, nz] = dims;
  const [dx, dy, dz] = spacing;
  const bounds = grid.bounds;
  const min: Vec3 = bounds?.min ?? [
    -0.5 * nx * dx,
    -0.5 * ny * dy,
    -0.5 * nz * dz,
  ];
  const center = excision.center ?? [0, 0, 0];
  const r2 = excision.radius * excision.radius;
  for (let k = 0; k < nz; k += 1) {
    const z = min[2] + (k + 0.5) * dz;
    for (let j = 0; j < ny; j += 1) {
      const y = min[1] + (j + 0.5) * dy;
      for (let i = 0; i < nx; i += 1) {
        const x = min[0] + (i + 0.5) * dx;
        const dxC = x - center[0];
        const dyC = y - center[1];
        const dzC = z - center[2];
        if (dxC * dxC + dyC * dyC + dzC * dzC <= r2) {
          applyMinkowskiAtIndex(state, index3D(i, j, k, dims));
        }
      }
    }
  }
};

const resolveFixups = (fixups?: FixupParams): Required<FixupParams> => {        
  if (!fixups) return DEFAULT_FIXUPS;
  const damping = fixups.constraintDamping ?? {};
  const alphaMin = Number.isFinite(fixups.alphaMin as number)
    ? (fixups.alphaMin as number)
    : DEFAULT_FIXUPS.alphaMin;
  const alphaMax = Number.isFinite(fixups.alphaMax as number)
    ? (fixups.alphaMax as number)
    : DEFAULT_FIXUPS.alphaMax;
  const kMaxAbs = Number.isFinite(fixups.kMaxAbs as number)
    ? Math.max(0, fixups.kMaxAbs as number)
    : DEFAULT_FIXUPS.kMaxAbs;
  const resolvedAlphaMin = Math.max(1e-12, alphaMin);
  const resolvedAlphaMax = Math.max(resolvedAlphaMin, alphaMax);
  return {
    detGamma: fixups.detGamma ?? DEFAULT_FIXUPS.detGamma,
    traceA: fixups.traceA ?? DEFAULT_FIXUPS.traceA,
    clampAlpha: fixups.clampAlpha ?? DEFAULT_FIXUPS.clampAlpha,
    alphaMin: resolvedAlphaMin,
    alphaMax: resolvedAlphaMax,
    kMaxAbs,
    constraintDamping: {
      enabled: damping.enabled ?? DEFAULT_FIXUPS.constraintDamping.enabled,     
      strength: damping.strength ?? DEFAULT_FIXUPS.constraintDamping.strength,  
    },
  };
};

export const initFixupStats = (
  totalCells: number,
  steps: number,
  fixups?: FixupParams,
): FixupStats => {
  const resolved = resolveFixups(fixups);
  return {
    totalCells: Math.max(0, totalCells),
    alphaClampCount: 0,
    kClampCount: 0,
    detFixCount: 0,
    traceFixCount: 0,
    maxAlphaBeforeClamp: 0,
    maxKBeforeClamp: 0,
    alphaClampByStep: Array.from({ length: Math.max(0, steps) }, () => 0),
    kClampByStep: Array.from({ length: Math.max(0, steps) }, () => 0),
    detFixByStep: Array.from({ length: Math.max(0, steps) }, () => 0),
    traceFixByStep: Array.from({ length: Math.max(0, steps) }, () => 0),
    alphaClampMin: resolved.alphaMin,
    alphaClampMax: resolved.alphaMax,
    kClampMaxAbs: resolved.kMaxAbs,
    clampFraction: 0,
  };
};

const recordFixupStep = (
  stats: FixupStats | undefined,
  stepStats: FixupStepStats,
  stepIndex?: number | null,
) => {
  if (!stats) return;
  stats.alphaClampCount += stepStats.alphaClampCount;
  stats.kClampCount += stepStats.kClampCount;
  stats.detFixCount += stepStats.detFixCount;
  stats.traceFixCount += stepStats.traceFixCount;
  stats.maxAlphaBeforeClamp = Math.max(
    stats.maxAlphaBeforeClamp,
    stepStats.maxAlphaBeforeClamp,
  );
  stats.maxKBeforeClamp = Math.max(stats.maxKBeforeClamp, stepStats.maxKBeforeClamp);
  if (
    typeof stepIndex === "number" &&
    stepIndex >= 0 &&
    stepIndex < stats.alphaClampByStep.length
  ) {
    stats.alphaClampByStep[stepIndex] = stepStats.alphaClampCount;
    stats.kClampByStep[stepIndex] = stepStats.kClampCount;
    stats.detFixByStep[stepIndex] = stepStats.detFixCount;
    stats.traceFixByStep[stepIndex] = stepStats.traceFixCount;
  } else {
    stats.postStep = stepStats;
  }
};

const applyDetTraceFixups = (
  state: BssnState,
  detGamma: boolean,
  traceA: boolean,
  clampAlpha: boolean,
  alphaMin: number,
  alphaMax: number,
  kMaxAbs: number,
) : FixupStepStats | null => {
  const clampK = Number.isFinite(kMaxAbs) && kMaxAbs > 0;
  if (!detGamma && !traceA && !clampAlpha && !clampK) return null;
  const stepStats: FixupStepStats = {
    alphaClampCount: 0,
    kClampCount: 0,
    detFixCount: 0,
    traceFixCount: 0,
    maxAlphaBeforeClamp: 0,
    maxKBeforeClamp: 0,
  };
  const total = state.alpha.length;
  for (let idx = 0; idx < total; idx += 1) {
    if (clampAlpha) {
      const alpha = state.alpha[idx];
      if (Number.isFinite(alpha)) {
        stepStats.maxAlphaBeforeClamp = Math.max(stepStats.maxAlphaBeforeClamp, Math.abs(alpha));
      }
      if (!Number.isFinite(alpha)) {
        state.alpha[idx] = alphaMin;
        stepStats.alphaClampCount += 1;
      } else if (alpha < alphaMin) {
        state.alpha[idx] = alphaMin;
        stepStats.alphaClampCount += 1;
      } else if (alpha > alphaMax) {
        state.alpha[idx] = alphaMax;
        stepStats.alphaClampCount += 1;
      }
    }
    if (clampK) {
      const K = state.K[idx];
      if (Number.isFinite(K)) {
        stepStats.maxKBeforeClamp = Math.max(stepStats.maxKBeforeClamp, Math.abs(K));
      }
      if (!Number.isFinite(K)) {
        state.K[idx] = 0;
        stepStats.kClampCount += 1;
      } else if (Math.abs(K) > kMaxAbs) {
        state.K[idx] = Math.sign(K) * kMaxAbs;
        stepStats.kClampCount += 1;
      }
    }
    if (!detGamma && !traceA) continue;

    let gxx = state.gamma_xx[idx];
    let gyy = state.gamma_yy[idx];
    let gzz = state.gamma_zz[idx];
    let gxy = state.gamma_xy[idx];
    let gxz = state.gamma_xz[idx];
    let gyz = state.gamma_yz[idx];

    if (detGamma) {
      const det = invertSymmetric({
        xx: gxx,
        yy: gyy,
        zz: gzz,
        xy: gxy,
        xz: gxz,
        yz: gyz,
      }).det;
      const detSafe = Math.max(1e-12, Math.abs(det));
      const scale = Math.pow(detSafe, -1 / 3);
      if (Number.isFinite(scale) && Math.abs(scale - 1) > 1e-6) {
        stepStats.detFixCount += 1;
      }
      if (Number.isFinite(scale)) {
        gxx *= scale;
        gyy *= scale;
        gzz *= scale;
        gxy *= scale;
        gxz *= scale;
        gyz *= scale;
        state.gamma_xx[idx] = gxx;
        state.gamma_yy[idx] = gyy;
        state.gamma_zz[idx] = gzz;
        state.gamma_xy[idx] = gxy;
        state.gamma_xz[idx] = gxz;
        state.gamma_yz[idx] = gyz;
        const phi = state.phi[idx];
        if (Number.isFinite(phi)) {
          state.phi[idx] = phi + Math.log(detSafe) / 12;
        }
      }
    }

    if (traceA) {
      const { inv } = invertSymmetric({
        xx: gxx,
        yy: gyy,
        zz: gzz,
        xy: gxy,
        xz: gxz,
        yz: gyz,
      });
      const Axx = state.A_xx[idx];
      const Ayy = state.A_yy[idx];
      const Azz = state.A_zz[idx];
      const Axy = state.A_xy[idx];
      const Axz = state.A_xz[idx];
      const Ayz = state.A_yz[idx];
      const trace =
        inv.xx * Axx +
        inv.yy * Ayy +
        inv.zz * Azz +
        2 * (inv.xy * Axy + inv.xz * Axz + inv.yz * Ayz);
      const traceScale = trace / 3;
      if (Number.isFinite(traceScale) && Math.abs(traceScale) > 1e-6) {
        stepStats.traceFixCount += 1;
      }
      if (Number.isFinite(traceScale)) {
        state.A_xx[idx] = Axx - gxx * traceScale;
        state.A_yy[idx] = Ayy - gyy * traceScale;
        state.A_zz[idx] = Azz - gzz * traceScale;
        state.A_xy[idx] = Axy - gxy * traceScale;
        state.A_xz[idx] = Axz - gxz * traceScale;
        state.A_yz[idx] = Ayz - gyz * traceScale;
      }
    }
  }
  return stepStats;
};

const applyConstraintDamping = (
  state: BssnState,
  stencils: StencilParams,
  matter: StressEnergyFieldSet | null,
  damping: ConstraintDampingParams,
  dt: number,
) => {
  if (!damping.enabled) return;
  const strength = damping.strength ?? 0;
  if (!(strength > 0) || !(dt > 0)) return;
  const constraints = computeBssnConstraints(state, { stencils, matter });
  const scale = Math.min(1, strength * dt);
  const total = state.K.length;
  for (let idx = 0; idx < total; idx += 1) {
    state.K[idx] -= scale * constraints.H[idx];
    state.Gamma_x[idx] -= scale * constraints.Mx[idx];
    state.Gamma_y[idx] -= scale * constraints.My[idx];
    state.Gamma_z[idx] -= scale * constraints.Mz[idx];
  }
};

const applyFixups = (
  state: BssnState,
  fixups: FixupParams | undefined,
  stencils: StencilParams,
  matter: StressEnergyFieldSet | null,
  dt: number,
  fixupStats?: FixupStats,
  stepIndex?: number | null,
) => {
  const resolved = resolveFixups(fixups);
  const stepStats = applyDetTraceFixups(
    state,
    resolved.detGamma,
    resolved.traceA,
    resolved.clampAlpha,
    resolved.alphaMin,
    resolved.alphaMax,
    resolved.kMaxAbs,
  );
  if (stepStats) {
    recordFixupStep(fixupStats, stepStats, stepIndex ?? null);
  }
  applyConstraintDamping(state, stencils, matter, resolved.constraintDamping, dt);
};

export const applyBssnDetTraceFixups = (
  state: BssnState,
  fixups?: FixupParams,
  fixupStats?: FixupStats,
): FixupStepStats | null => {
  const resolved = resolveFixups(fixups);
  const stepStats = applyDetTraceFixups(
    state,
    resolved.detGamma,
    resolved.traceA,
    resolved.clampAlpha,
    resolved.alphaMin,
    resolved.alphaMax,
    resolved.kMaxAbs,
  );
  if (stepStats) {
    recordFixupStep(fixupStats, stepStats, null);
  }
  return stepStats;
};

const applyBoundaryConditions = (
  state: BssnState,
  boundary: BoundaryParams | undefined,
  boundaryMode: BoundaryMode,
) => {
  if (boundaryMode === "outflow") {
    applyOutflowBoundary(state);
  } else if (boundaryMode === "sommerfeld") {
    applyOutflowBoundary(state);
    applySommerfeldSponge(state, boundary?.spongeCells ?? DEFAULT_SPONGE_CELLS);
  }
  if (boundary?.excision) {
    applyExcision(state, boundary.excision);
  }
};

export const computeBssnRhs = (state: BssnState, out: BssnRhs): void => {
  computeBssnRhsWithParams(
    state,
    out,
    DEFAULT_GAUGE,
    DEFAULT_STENCILS,
    DEFAULT_ADVECT_SCHEME,
    DEFAULT_KO,
    null,
  );
};

export const buildBssnRhs = (params: BssnEvolveParams = {}) => {
  const gauge = { ...DEFAULT_GAUGE, ...(params.gauge ?? {}) };
  const boundaryMode =
    params.boundary?.mode ?? params.stencils?.boundary ?? DEFAULT_STENCILS.boundary;
  const stencils = {
    ...DEFAULT_STENCILS,
    ...(params.stencils ?? {}),
    boundary: boundaryMode,
  };
  const matter = params.matter ?? null;
  const advectScheme =
    params.advectScheme === "upwind1" ? "upwind1" : DEFAULT_ADVECT_SCHEME;
  const dissipation = resolveKoParams(params.koEps, params.koTargets);
  return (state: BssnState, out: BssnRhs) =>
    computeBssnRhsWithParams(
      state,
      out,
      gauge,
      stencils,
      advectScheme,
      dissipation,
      matter,
    );
};

export const evolveBssn = (
  state: BssnState,
  dt: number,
  steps: number,
  params: BssnEvolveParams = {},
  scratch?: Rk4Scratch,
): Rk4Scratch => {
  const rhs = params.rhs ?? buildBssnRhs(params);
  const boundaryMode =
    params.boundary?.mode ?? params.stencils?.boundary ?? DEFAULT_STENCILS.boundary;
  const stencils = {
    ...DEFAULT_STENCILS,
    ...(params.stencils ?? {}),
    boundary: boundaryMode,
  };
  const matter = params.matter ?? null;
  const boundaryParams = params.boundary;
  const fixupStats = params.fixupStats;
  let active = scratch;
  for (let i = 0; i < steps; i += 1) {
    active = rk4Step(state, dt, rhs, active);
    applyFixups(state, params.fixups, stencils, matter, dt, fixupStats, i);
    applyBoundaryConditions(state, boundaryParams, boundaryMode);
  }
  if (active) return active;
  const fallback = rk4Step(state, dt, rhs);
  applyFixups(state, params.fixups, stencils, matter, dt, fixupStats, null);
  applyBoundaryConditions(state, boundaryParams, boundaryMode);
  return fallback;
};
