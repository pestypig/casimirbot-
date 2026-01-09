import { CurvatureMetricsConfig, type TGridFrame2D } from "@shared/essence-physics";
import {
  TokamakSyntheticDiagnosticsInput,
  TokamakSyntheticDiagnosticsReport,
  TokamakSyntheticSensorConfig,
  type TTokamakSyntheticChord,
  type TTokamakSyntheticProbeSample,
  type TTokamakSyntheticChordSpec,
} from "@shared/tokamak-synthetic-diagnostics";
import { TokamakPrecursorScoreKey } from "@shared/tokamak-precursor";
import { computeCurvatureFieldMaps } from "../../skills/physics.curvature";
import { computeCurvatureMetricsAndRidges } from "./curvature-metrics";
import { hashStableJson } from "../../utils/information-boundary";

type RasterPayload = { data_b64: string };

const decodeFloat32Raster = (
  payload: RasterPayload,
  expectedCount: number,
  label: string,
): Float32Array => {
  const clean = (payload.data_b64 ?? "")
    .trim()
    .replace(/^data:[^,]+,/, "")
    .replace(/\s+/g, "");
  const buf = Buffer.from(clean, "base64");
  const expectedBytes = expectedCount * 4;
  if (buf.byteLength !== expectedBytes) {
    throw new Error(
      `${label}_size_mismatch: expected ${expectedBytes} bytes, got ${buf.byteLength}`,
    );
  }
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
};

const float32ToB64 = (arr: Float32Array): string =>
  Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString("base64");

const buildMaskOn = (mask: Float32Array): Uint8Array => {
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    out[i] = mask[i] > 0 ? 1 : 0;
  }
  return out;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const percentile = (values: number[], p: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = Math.min(1, Math.max(0, p)) * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) return sorted[lower];
  const t = pos - lower;
  return sorted[lower] * (1 - t) + sorted[upper] * t;
};

const collectMaskedValues = (arr: Float32Array, maskOn?: Uint8Array): number[] => {
  const values: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (maskOn && !maskOn[i]) continue;
    const v = arr[i];
    if (Number.isFinite(v)) values.push(v);
  }
  return values;
};

const seedFrom = (value: unknown): number => {
  const hash = hashStableJson(value).replace(/^sha256:/, "");
  const seed = parseInt(hash.slice(0, 8), 16);
  return Number.isFinite(seed) ? seed : 0;
};

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const gaussian = (rng: () => number): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const applyNoise = (value: number, rng: () => number, std?: number): number =>
  std && std > 0 ? value + gaussian(rng) * std : value;

const toGridCoords = (
  r_m: number,
  z_m: number,
  grid: { dx_m: number; dy_m: number },
  frame: Extract<TGridFrame2D, { kind: "rz-plane" }>,
): { x: number; y: number } => {
  const axisX = frame.axis_order?.[0] ?? "r";
  const axisY = frame.axis_order?.[1] ?? "z";
  const xCoord = axisX === "r" ? r_m : z_m;
  const yCoord = axisY === "z" ? z_m : r_m;
  const x0 = axisX === "r" ? frame.r_min_m : frame.z_min_m;
  const y0 = axisY === "z" ? frame.z_min_m : frame.r_min_m;
  return {
    x: (xCoord - x0) / grid.dx_m,
    y: (yCoord - y0) / grid.dy_m,
  };
};

const toPhysical = (
  xIdx: number,
  yIdx: number,
  grid: { dx_m: number; dy_m: number },
  frame: Extract<TGridFrame2D, { kind: "rz-plane" }>,
): [number, number] => {
  const axisX = frame.axis_order?.[0] ?? "r";
  const axisY = frame.axis_order?.[1] ?? "z";
  const xVal =
    (axisX === "r" ? frame.r_min_m : frame.z_min_m) + xIdx * grid.dx_m;
  const yVal =
    (axisY === "r" ? frame.r_min_m : frame.z_min_m) + yIdx * grid.dy_m;
  const r = axisX === "r" ? xVal : yVal;
  const z = axisX === "z" ? xVal : yVal;
  return [r, z];
};

const sampleBilinear = (
  field: Float32Array,
  nx: number,
  ny: number,
  x: number,
  y: number,
): number => {
  if (x < 0 || y < 0 || x > nx - 1 || y > ny - 1) {
    return 0;
  }
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(nx - 1, x0 + 1);
  const y1 = Math.min(ny - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const v00 = field[y0 * nx + x0] ?? 0;
  const v10 = field[y0 * nx + x1] ?? 0;
  const v01 = field[y1 * nx + x0] ?? 0;
  const v11 = field[y1 * nx + x1] ?? 0;
  const v0 = v00 * (1 - tx) + v10 * tx;
  const v1 = v01 * (1 - tx) + v11 * tx;
  return v0 * (1 - ty) + v1 * ty;
};

const integrateChord = (args: {
  field: Float32Array;
  nx: number;
  ny: number;
  grid: { dx_m: number; dy_m: number };
  frame: Extract<TGridFrame2D, { kind: "rz-plane" }>;
  start_m: [number, number];
  end_m: [number, number];
  step_m: number;
}): number => {
  const dx = args.end_m[0] - args.start_m[0];
  const dy = args.end_m[1] - args.start_m[1];
  const length = Math.hypot(dx, dy);
  if (length <= 0) return 0;
  const steps = Math.max(1, Math.ceil(length / args.step_m));
  const step = length / steps;
  let sum = 0;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const r = args.start_m[0] + dx * t;
    const z = args.start_m[1] + dy * t;
    const { x, y } = toGridCoords(r, z, args.grid, args.frame);
    sum += sampleBilinear(args.field, args.nx, args.ny, x, y) * step;
  }
  return sum;
};

const accumulateChord = (args: {
  accum: Float32Array;
  weights: Float32Array;
  nx: number;
  ny: number;
  grid: { dx_m: number; dy_m: number };
  frame: Extract<TGridFrame2D, { kind: "rz-plane" }>;
  start_m: [number, number];
  end_m: [number, number];
  value: number;
  step_m: number;
}): void => {
  const dx = args.end_m[0] - args.start_m[0];
  const dy = args.end_m[1] - args.start_m[1];
  const length = Math.hypot(dx, dy);
  if (length <= 0) return;
  const steps = Math.max(1, Math.ceil(length / args.step_m));
  const step = length / steps;
  const valuePerLength = args.value / Math.max(length, 1e-9);
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const r = args.start_m[0] + dx * t;
    const z = args.start_m[1] + dy * t;
    const { x, y } = toGridCoords(r, z, args.grid, args.frame);
    if (x < 0 || y < 0 || x > args.nx - 1 || y > args.ny - 1) {
      continue;
    }
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(args.nx - 1, x0 + 1);
    const y1 = Math.min(args.ny - 1, y0 + 1);
    const tx = x - x0;
    const ty = y - y0;
    const w00 = (1 - tx) * (1 - ty);
    const w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty;
    const w11 = tx * ty;
    const idx00 = y0 * args.nx + x0;
    const idx10 = y0 * args.nx + x1;
    const idx01 = y1 * args.nx + x0;
    const idx11 = y1 * args.nx + x1;
    const contribution = valuePerLength * step;
    args.accum[idx00] += contribution * w00;
    args.accum[idx10] += contribution * w10;
    args.accum[idx01] += contribution * w01;
    args.accum[idx11] += contribution * w11;
    args.weights[idx00] += w00;
    args.weights[idx10] += w10;
    args.weights[idx01] += w01;
    args.weights[idx11] += w11;
  }
};

const computeGradMagFromPhi = (
  phi: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
): Float32Array => {
  const grad = new Float32Array(phi.length);
  const inv2dx = 1 / (2 * dx);
  const inv2dy = 1 / (2 * dy);
  for (let y = 0; y < ny; y++) {
    const yPrev = y > 0 ? y - 1 : y;
    const yNext = y < ny - 1 ? y + 1 : y;
    for (let x = 0; x < nx; x++) {
      const xPrev = x > 0 ? x - 1 : x;
      const xNext = x < nx - 1 ? x + 1 : x;
      const idx = y * nx + x;
      const dphidx =
        (phi[y * nx + xNext] - phi[y * nx + xPrev]) * inv2dx;
      const dphidy =
        (phi[yNext * nx + x] - phi[yPrev * nx + x]) * inv2dy;
      grad[idx] = Math.hypot(dphidx, dphidy);
    }
  }
  return grad;
};

const buildBoundaryPoints = (args: {
  maskOn?: Uint8Array;
  nx: number;
  ny: number;
}): Array<{ x: number; y: number }> => {
  const points: Array<{ x: number; y: number }> = [];
  const seen = new Set<number>();
  if (args.maskOn) {
    const mask = args.maskOn;
    for (let y = 0; y < args.ny; y++) {
      for (let x = 0; x < args.nx; x++) {
        const idx = y * args.nx + x;
        if (!mask[idx]) continue;
        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        let boundary = false;
        for (const [nxPos, nyPos] of neighbors) {
          if (nxPos < 0 || nyPos < 0 || nxPos >= args.nx || nyPos >= args.ny) {
            boundary = true;
            break;
          }
          const nidx = nyPos * args.nx + nxPos;
          if (!mask[nidx]) {
            boundary = true;
            break;
          }
        }
        if (boundary && !seen.has(idx)) {
          seen.add(idx);
          points.push({ x, y });
        }
      }
    }
    return points;
  }
  for (let x = 0; x < args.nx; x++) {
    points.push({ x, y: 0 });
    if (args.ny > 1) points.push({ x, y: args.ny - 1 });
  }
  for (let y = 1; y < args.ny - 1; y++) {
    points.push({ x: 0, y });
    if (args.nx > 1) points.push({ x: args.nx - 1, y });
  }
  return points;
};

const selectProbePoints = (args: {
  points: Array<{ x: number; y: number }>;
  count: number;
  grid: { dx_m: number; dy_m: number };
  frame: Extract<TGridFrame2D, { kind: "rz-plane" }>;
}): Array<{ x: number; y: number }> => {
  if (args.points.length <= args.count) return args.points;
  const centerR = (args.frame.r_min_m + args.frame.r_max_m) / 2;
  const centerZ = (args.frame.z_min_m + args.frame.z_max_m) / 2;
  const sorted = [...args.points].sort((a, b) => {
    const [ra, za] = toPhysical(a.x, a.y, args.grid, args.frame);
    const [rb, zb] = toPhysical(b.x, b.y, args.grid, args.frame);
    const angA = Math.atan2(za - centerZ, ra - centerR);
    const angB = Math.atan2(zb - centerZ, rb - centerR);
    return angA - angB;
  });
  const step = sorted.length / args.count;
  const selection: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < args.count; i++) {
    selection.push(sorted[Math.floor(i * step)]);
  }
  return selection;
};

const buildChordSet = (args: {
  count: number;
  kind: "bolometry" | "interferometry";
  frame: Extract<TGridFrame2D, { kind: "rz-plane" }>;
}): Array<TTokamakSyntheticChordSpec> => {
  const chords: Array<TTokamakSyntheticChordSpec> = [];
  const rSpan = args.frame.r_max_m - args.frame.r_min_m;
  const zSpan = args.frame.z_max_m - args.frame.z_min_m;
  const count = Math.max(1, args.count);
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    if (args.kind === "bolometry") {
      const r = args.frame.r_min_m + rSpan * t;
      chords.push({
        id: `bolo-${i}`,
        kind: "bolometry",
        start_m: [r, args.frame.z_min_m],
        end_m: [r, args.frame.z_max_m],
      });
    } else {
      const z = args.frame.z_min_m + zSpan * t;
      chords.push({
        id: `inter-${i}`,
        kind: "interferometry",
        start_m: [args.frame.r_min_m, z],
        end_m: [args.frame.r_max_m, z],
      });
    }
  }
  return chords;
};

const splitChordsByKind = (chords: TTokamakSyntheticChordSpec[]) => {
  const bolometry: TTokamakSyntheticChordSpec[] = [];
  const interferometry: TTokamakSyntheticChordSpec[] = [];
  for (const chord of chords) {
    if (chord.kind === "bolometry") {
      bolometry.push(chord);
    } else {
      interferometry.push(chord);
    }
  }
  return { bolometry, interferometry };
};

const summarizeKMetrics = (
  truth: { k0: number; k1: number; k2: number },
  recon: { k0: number; k1: number; k2: number },
) => {
  const k0Abs = Math.abs(truth.k0 - recon.k0);
  const k1Abs = Math.abs(truth.k1 - recon.k1);
  const k2Abs = Math.abs(truth.k2 - recon.k2);
  const k0Rel = truth.k0 > 0 ? k0Abs / truth.k0 : undefined;
  const k1Rel = truth.k1 > 0 ? k1Abs / truth.k1 : undefined;
  const k2Rel = truth.k2 > 0 ? k2Abs / truth.k2 : undefined;
  return { k0_abs: k0Abs, k1_abs: k1Abs, k2_abs: k2Abs, k0_rel: k0Rel, k1_rel: k1Rel, k2_rel: k2Rel };
};

export function runTokamakSyntheticDiagnostics(
  rawInput: unknown,
): TTokamakSyntheticDiagnosticsReport {
  const input = TokamakSyntheticDiagnosticsInput.parse(rawInput);
  const config = TokamakSyntheticSensorConfig.parse(input.config ?? {});
  const frame = input.frame;
  const { grid } = input;
  const reconstructionMode = input.reconstruction_mode;
  const expectedCount = grid.nx * grid.ny;
  const uTotal = decodeFloat32Raster(input.u_total, expectedCount, "u_total");
  const mask = input.separatrix_mask
    ? decodeFloat32Raster(input.separatrix_mask, expectedCount, "separatrix_mask")
    : null;
  const maskOn = mask ? buildMaskOn(mask) : undefined;
  const metricsConfig = CurvatureMetricsConfig.parse({});
  const fieldMaps = computeCurvatureFieldMaps({
    grid,
    frame,
    boundary: "dirichlet0",
    u_field: uTotal,
    mask,
  });
  const truthMetrics = computeCurvatureMetricsAndRidges({
    gradMag: fieldMaps.gradMag,
    laplacian: fieldMaps.laplacian,
    residual: fieldMaps.residual,
    grid,
    frame,
    boundary: "dirichlet0",
    maskOn: fieldMaps.maskOn,
    config: metricsConfig,
  });
  const truth = {
    k_metrics: truthMetrics.k_metrics,
    ridge_summary: truthMetrics.ridges.summary,
    residual_rms: fieldMaps.stats.residual_rms,
  };

  const phi = input.phi
    ? decodeFloat32Raster(input.phi, expectedCount, "phi")
    : null;
  const gradMagForProbes = phi
    ? computeGradMagFromPhi(phi, grid.nx, grid.ny, grid.dx_m, grid.dy_m)
    : fieldMaps.gradMag;

  const step_m =
    config.integration_step_m ?? Math.min(grid.dx_m, grid.dy_m) * 0.5;
  const baseSeed = seedFrom({
    device_id: input.device_id ?? null,
    shot_id: input.shot_id ?? null,
    timestamp_iso: input.timestamp_iso,
  });
  const boloRng = mulberry32(baseSeed ^ 0x9e3779b1);
  const interRng = mulberry32(baseSeed ^ 0x85ebca6b);
  const probeRng = mulberry32(baseSeed ^ 0xc2b2ae35);

  const customChords = input.chords ?? [];
  const customByKind = splitChordsByKind(customChords);
  const boloSpecs =
    customByKind.bolometry.length > 0
      ? customByKind.bolometry
      : buildChordSet({
          count: config.bolometry_chords,
          kind: "bolometry",
          frame,
        });
  const interSpecs =
    customByKind.interferometry.length > 0
      ? customByKind.interferometry
      : buildChordSet({
          count: config.interferometry_chords,
          kind: "interferometry",
          frame,
        });
  const boloChords = boloSpecs.map((chord) => ({
    ...chord,
    integral: applyNoise(
      integrateChord({
        field: uTotal,
        nx: grid.nx,
        ny: grid.ny,
        grid,
        frame,
        start_m: chord.start_m,
        end_m: chord.end_m,
        step_m,
      }),
      boloRng,
      config.noise_std,
    ),
  }));

  const interChords = interSpecs.map((chord) => ({
    ...chord,
    integral: applyNoise(
      integrateChord({
        field: uTotal,
        nx: grid.nx,
        ny: grid.ny,
        grid,
        frame,
        start_m: chord.start_m,
        end_m: chord.end_m,
        step_m,
      }),
      interRng,
      config.noise_std,
    ),
  }));

  const boundaryPoints = buildBoundaryPoints({
    maskOn,
    nx: grid.nx,
    ny: grid.ny,
  });
  const probePoints = selectProbePoints({
    points: boundaryPoints,
    count: config.probe_count,
    grid,
    frame,
  });
  const probes: TTokamakSyntheticProbeSample[] = probePoints.map((point, idx) => {
    const [r, z] = toPhysical(point.x, point.y, grid, frame);
    const { x, y } = toGridCoords(r, z, grid, frame);
    const value = sampleBilinear(gradMagForProbes, grid.nx, grid.ny, x, y);
    return {
      id: `probe-${idx}`,
      position_m: [r, z],
      value: applyNoise(value, probeRng, config.noise_std),
    };
  });

  let recon = new Float32Array(uTotal);
  if (reconstructionMode === "backprojection") {
    const accum = new Float32Array(expectedCount);
    const weights = new Float32Array(expectedCount);
    const allChords: TTokamakSyntheticChord[] = [...boloChords, ...interChords];
    for (const chord of allChords) {
      accumulateChord({
        accum,
        weights,
        nx: grid.nx,
        ny: grid.ny,
        grid,
        frame,
        start_m: chord.start_m,
        end_m: chord.end_m,
        value: chord.integral,
        step_m,
      });
    }
    recon = new Float32Array(expectedCount);
    for (let i = 0; i < expectedCount; i++) {
      recon[i] = weights[i] > 0 ? accum[i] / weights[i] : 0;
      if (maskOn && !maskOn[i]) recon[i] = 0;
    }
  }

  let reconMaps = computeCurvatureFieldMaps({
    grid,
    frame,
    boundary: "dirichlet0",
    u_field: recon,
    mask,
  });
  if (probes.length > 0) {
    const probeAvg =
      probes.reduce((sum, probe) => sum + probe.value, 0) / probes.length;
    const reconProbeAvg =
      probes
        .map((probe) => {
          const { x, y } = toGridCoords(probe.position_m[0], probe.position_m[1], grid, frame);
          return sampleBilinear(reconMaps.gradMag, grid.nx, grid.ny, x, y);
        })
        .reduce((sum, value) => sum + value, 0) / probes.length;
    if (reconProbeAvg > 0 && Number.isFinite(probeAvg)) {
      const scale = clampNumber(probeAvg / reconProbeAvg, 0.1, 10);
      if (Math.abs(scale - 1) > 1e-3) {
        for (let i = 0; i < recon.length; i++) {
          recon[i] *= scale;
        }
        reconMaps = computeCurvatureFieldMaps({
          grid,
          frame,
          boundary: "dirichlet0",
          u_field: recon,
          mask,
        });
      }
    }
  }

  const reconMetrics = computeCurvatureMetricsAndRidges({
    gradMag: reconMaps.gradMag,
    laplacian: reconMaps.laplacian,
    residual: reconMaps.residual,
    grid,
    frame,
    boundary: "dirichlet0",
    maskOn: reconMaps.maskOn,
    config: metricsConfig,
  });

  const reconstruction = {
    k_metrics: reconMetrics.k_metrics,
    ridge_summary: reconMetrics.ridges.summary,
    residual_rms: reconMaps.stats.residual_rms,
    u_total_recon: {
      encoding: "base64",
      dtype: "float32",
      endian: "little",
      order: "row-major",
      data_b64: float32ToB64(recon),
    },
  };

  const info_loss = {
    k_metrics: summarizeKMetrics(truth.k_metrics, reconstruction.k_metrics),
    ridge_count_delta:
      reconstruction.ridge_summary.ridge_count - truth.ridge_summary.ridge_count,
    ridge_length_delta:
      reconstruction.ridge_summary.ridge_length_m - truth.ridge_summary.ridge_length_m,
    fragmentation_index_delta:
      reconstruction.ridge_summary.fragmentation_index -
      truth.ridge_summary.fragmentation_index,
    residual_rms_delta: Math.abs(reconstruction.residual_rms - truth.residual_rms),
  };

  const requestedScoreKey = input.score_key;
  let scoreKey = requestedScoreKey ?? "k2";
  let scoreNote: string | undefined;
  const computeScore = (
    key: string,
    field: Float32Array,
    metrics: { k2: number },
    ridge: { fragmentation_index: number },
  ): number | undefined => {
    switch (key) {
      case "k2":
        return metrics.k2;
      case "u_total_p95": {
        const values = collectMaskedValues(field, maskOn);
        return percentile(values, 0.95);
      }
      case "fragmentation_rate":
        scoreNote = "fragmentation_rate_proxy:fragmentation_index";
        return ridge.fragmentation_index;
      default:
        return undefined;
    }
  };
  let truthScore = computeScore(
    scoreKey,
    uTotal,
    truth.k_metrics,
    truth.ridge_summary,
  );
  let reconScore = computeScore(
    scoreKey,
    recon,
    reconstruction.k_metrics,
    reconstruction.ridge_summary,
  );
  if (truthScore === undefined || reconScore === undefined) {
    scoreKey = "k2";
    scoreNote =
      scoreNote ??
      (requestedScoreKey ? `unsupported_score_key:${requestedScoreKey}` : undefined);
    truthScore = truth.k_metrics.k2;
    reconScore = reconstruction.k_metrics.k2;
  }
  const scoreKeyUsed = TokamakPrecursorScoreKey.parse(scoreKey);
  const scoreDelta = truthScore - reconScore;
  const scoreComparison = {
    score_key: scoreKeyUsed,
    truth_score: truthScore,
    recon_score: reconScore,
    delta: scoreDelta,
    abs_delta: Math.abs(scoreDelta),
    rel_delta: truthScore !== 0 ? Math.abs(scoreDelta) / Math.abs(truthScore) : undefined,
    ...(scoreNote ? { notes: scoreNote } : {}),
  };

  return TokamakSyntheticDiagnosticsReport.parse({
    schema_version: "tokamak_synthetic_report/1",
    kind: "tokamak_synthetic_report",
    generated_at_iso: new Date().toISOString(),
    device_id: input.device_id,
    shot_id: input.shot_id,
    timestamp_iso: input.timestamp_iso,
    grid,
    frame,
    sensors: {
      config,
      bolometry: boloChords,
      interferometry: interChords,
      probes,
    },
    reconstruction_mode: reconstructionMode,
    truth,
    reconstruction,
    info_loss,
    score_comparison: scoreComparison,
  });
}
