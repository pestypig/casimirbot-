import type {
  TCurvatureBoundaryCondition2D,
  TCurvatureKMetrics,
  TCurvatureMetricsConfig,
  TCurvatureRidgeFrame,
  TCurvatureRidgeSpine,
  TCurvatureUnitInput,
  TGridFrame2D,
} from "@shared/essence-physics";

type Grid2D = TCurvatureUnitInput["grid"];

const EPS = 1e-12;

type ValidMask = {
  mask: Uint8Array;
  count: number;
};

type RidgeExtractionResult = {
  frame: TCurvatureRidgeFrame;
  ridgeStrengthSum: number;
  totalStrengthSum: number;
};

export type RidgeTrackingConfig = {
  max_link_distance_m?: number;
  drive_hz?: number;
};

export type RidgeTrack = {
  id: string;
  first_frame: number;
  last_frame: number;
  lifetime_frames: number;
};

export type RidgeTrackingFrame = {
  frame_index: number;
  t_s?: number;
  ridge_count: number;
  matched_count: number;
  new_count: number;
  ended_count: number;
  fragmentation_rate: number;
  ridges: TCurvatureRidgeSpine[];
};

export type RidgeTrackingResult = {
  frames: RidgeTrackingFrame[];
  tracks: RidgeTrack[];
  k3?: number;
};

type MetricInput = {
  gradMag: Float32Array;
  laplacian: Float32Array;
  residual: Float32Array;
  grid: Grid2D;
  frame: TGridFrame2D;
  boundary: TCurvatureBoundaryCondition2D;
  maskOn?: Uint8Array;
  config: TCurvatureMetricsConfig;
};

type FieldScanStats = {
  absLapValues: number[];
  meanAbsLap: number;
  lapEnergy: number;
  residualEnergy: number;
};

const clampFinite = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

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

const buildValidMask = (
  nx: number,
  ny: number,
  boundary: TCurvatureBoundaryCondition2D,
  maskOn?: Uint8Array,
): ValidMask => {
  const mask = new Uint8Array(nx * ny);
  let count = 0;
  const skipEdge = boundary !== "periodic";
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      if (skipEdge && (x === 0 || y === 0 || x === nx - 1 || y === ny - 1)) {
        continue;
      }
      const idx = y * nx + x;
      if (maskOn && !maskOn[idx]) {
        continue;
      }
      mask[idx] = 1;
      count += 1;
    }
  }
  return { mask, count };
};

const toCoordinate = (
  idx: number,
  grid: Grid2D,
  frame: TGridFrame2D,
): { x: number; y: number } => {
  const { nx, dx_m, dy_m } = grid;
  const xIdx = idx % nx;
  const yIdx = Math.floor(idx / nx);
  if (frame.kind === "rz-plane") {
    return {
      x: frame.r_min_m + xIdx * dx_m,
      y: frame.z_min_m + yIdx * dy_m,
    };
  }
  const cx = (grid.nx - 1) / 2;
  const cy = (grid.ny - 1) / 2;
  return {
    x: (xIdx - cx) * dx_m,
    y: (yIdx - cy) * dy_m,
  };
};

const scanFieldStats = (
  gradMag: Float32Array,
  laplacian: Float32Array,
  residual: Float32Array,
  validMask: Uint8Array,
): FieldScanStats => {
  const absLapValues: number[] = [];
  let absLapSum = 0;
  let lapSse = 0;
  let resSse = 0;
  let count = 0;
  for (let i = 0; i < validMask.length; i++) {
    if (!validMask[i]) continue;
    const lap = laplacian[i];
    const res = residual[i];
    const grad = gradMag[i];
    if (!Number.isFinite(lap) || !Number.isFinite(res) || !Number.isFinite(grad)) {
      continue;
    }
    const absLap = Math.abs(lap);
    absLapValues.push(absLap);
    absLapSum += absLap;
    lapSse += lap * lap;
    resSse += res * res;
    count += 1;
  }
  if (count === 0) {
    return { absLapValues: [], meanAbsLap: 0, lapEnergy: 0, residualEnergy: 0 };
  }
  return {
    absLapValues,
    meanAbsLap: absLapSum / count,
    lapEnergy: lapSse / count,
    residualEnergy: resSse / count,
  };
};

const isLocalMax = (
  idx: number,
  x: number,
  y: number,
  nx: number,
  ny: number,
  boundary: TCurvatureBoundaryCondition2D,
  gradMag: Float32Array,
  validMask: Uint8Array,
): boolean => {
  const val = gradMag[idx];
  let hasLowerNeighbor = false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      let xx = x + dx;
      let yy = y + dy;
      if (boundary === "periodic") {
        xx = (xx + nx) % nx;
        yy = (yy + ny) % ny;
      } else if (xx < 0 || yy < 0 || xx >= nx || yy >= ny) {
        continue;
      }
      const nidx = yy * nx + xx;
      if (!validMask[nidx]) continue;
      const nval = gradMag[nidx];
      if (nval > val + EPS) {
        return false;
      }
      if (nval + EPS < val) {
        hasLowerNeighbor = true;
      }
    }
  }
  return hasLowerNeighbor;
};

const extractRidgeSpines = (input: MetricInput): RidgeExtractionResult => {
  const { gradMag, grid, frame, boundary, maskOn, config } = input;
  const { nx, ny } = grid;
  const { mask: validMask, count: validCount } = buildValidMask(
    nx,
    ny,
    boundary,
    maskOn,
  );
  const values: number[] = [];
  let totalStrengthSum = 0;
  for (let i = 0; i < gradMag.length; i++) {
    if (!validMask[i]) continue;
    const v = gradMag[i];
    if (!Number.isFinite(v)) continue;
    values.push(v);
    totalStrengthSum += v;
  }
  if (!values.length || validCount === 0) {
    return {
      frame: {
        summary: {
          ridge_count: 0,
          ridge_point_count: 0,
          ridge_length_m: 0,
          ridge_density: 0,
          fragmentation_index: 0,
          thresholds: { high: 0, low: 0 },
        },
        spines: [],
      },
      ridgeStrengthSum: 0,
      totalStrengthSum: totalStrengthSum,
    };
  }

  const high = clampFinite(percentile(values, config.ridge_high_percentile));
  const low = clampFinite(high * config.ridge_low_ratio);
  const nms = new Uint8Array(nx * ny);
  const strong = new Uint8Array(nx * ny);
  let strongCount = 0;
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      const idx = y * nx + x;
      if (!validMask[idx]) continue;
      const val = gradMag[idx];
      if (!Number.isFinite(val) || val < low) continue;
      if (!isLocalMax(idx, x, y, nx, ny, boundary, gradMag, validMask)) continue;
      nms[idx] = 1;
      if (val >= high) {
        strong[idx] = 1;
        strongCount += 1;
      }
    }
  }

  if (strongCount === 0) {
    for (let i = 0; i < nms.length; i++) {
      if (nms[i]) {
        strong[i] = 1;
        strongCount += 1;
      }
    }
  }

  const ridgeMask = new Uint8Array(nx * ny);
  const queue: number[] = [];
  for (let i = 0; i < strong.length; i++) {
    if (!strong[i]) continue;
    ridgeMask[i] = 1;
    queue.push(i);
  }

  let qIndex = 0;
  while (qIndex < queue.length) {
    const idx = queue[qIndex++];
    const x = idx % nx;
    const y = Math.floor(idx / nx);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        let xx = x + dx;
        let yy = y + dy;
        if (boundary === "periodic") {
          xx = (xx + nx) % nx;
          yy = (yy + ny) % ny;
        } else if (xx < 0 || yy < 0 || xx >= nx || yy >= ny) {
          continue;
        }
        const nidx = yy * nx + xx;
        if (!nms[nidx] || ridgeMask[nidx]) continue;
        if (gradMag[nidx] < low) continue;
        ridgeMask[nidx] = 1;
        queue.push(nidx);
      }
    }
  }

  const visited = new Uint8Array(nx * ny);
  const spines: TCurvatureRidgeSpine[] = [];
  let ridgePointCount = 0;
  let ridgeLengthSum = 0;

  for (let i = 0; i < ridgeMask.length; i++) {
    if (!ridgeMask[i] || visited[i]) continue;
    const component: number[] = [];
    const stack: number[] = [i];
    visited[i] = 1;
    while (stack.length) {
      const idx = stack.pop() as number;
      component.push(idx);
      const x = idx % nx;
      const y = Math.floor(idx / nx);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          let xx = x + dx;
          let yy = y + dy;
          if (boundary === "periodic") {
            xx = (xx + nx) % nx;
            yy = (yy + ny) % ny;
          } else if (xx < 0 || yy < 0 || xx >= nx || yy >= ny) {
            continue;
          }
          const nidx = yy * nx + xx;
          if (!ridgeMask[nidx] || visited[nidx]) continue;
          visited[nidx] = 1;
          stack.push(nidx);
        }
      }
    }

    if (component.length < config.ridge_min_points) {
      continue;
    }

    const points: Array<{ x: number; y: number; grad: number }> = [];
    let meanX = 0;
    let meanY = 0;
    let meanGrad = 0;
    let maxGrad = 0;
    let xMin = Number.POSITIVE_INFINITY;
    let xMax = Number.NEGATIVE_INFINITY;
    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;

    for (const idx of component) {
      const coord = toCoordinate(idx, grid, frame);
      const grad = clampFinite(gradMag[idx]);
      points.push({ x: coord.x, y: coord.y, grad });
      meanX += coord.x;
      meanY += coord.y;
      meanGrad += grad;
      if (grad > maxGrad) maxGrad = grad;
      xMin = Math.min(xMin, coord.x);
      xMax = Math.max(xMax, coord.x);
      yMin = Math.min(yMin, coord.y);
      yMax = Math.max(yMax, coord.y);
    }

    const count = points.length;
    meanX /= Math.max(1, count);
    meanY /= Math.max(1, count);
    meanGrad /= Math.max(1, count);

    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (const p of points) {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      sxx += dx * dx;
      syy += dy * dy;
      sxy += dx * dy;
    }
    const trace = sxx + syy;
    const det = sxx * syy - sxy * sxy;
    const term = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
    const lambda1 = trace / 2 + term;
    let axisX = sxy;
    let axisY = lambda1 - sxx;
    if (Math.abs(axisX) + Math.abs(axisY) < EPS) {
      axisX = 1;
      axisY = 0;
    }
    const axisLen = Math.hypot(axisX, axisY) || 1;
    axisX /= axisLen;
    axisY /= axisLen;

    const ordered = points
      .map((p) => ({
        t: (p.x - meanX) * axisX + (p.y - meanY) * axisY,
        ...p,
      }))
      .sort((a, b) => a.t - b.t);

    let length_m = 0;
    for (let idx = 1; idx < ordered.length; idx++) {
      const a = ordered[idx - 1];
      const b = ordered[idx];
      length_m += Math.hypot(b.x - a.x, b.y - a.y);
    }

    let sampled = ordered;
    if (ordered.length > config.ridge_max_points) {
      const stride = Math.max(1, Math.ceil(ordered.length / config.ridge_max_points));
      const down: typeof ordered = [];
      for (let idx = 0; idx < ordered.length; idx += stride) {
        down.push(ordered[idx]);
      }
      if (down[down.length - 1] !== ordered[ordered.length - 1]) {
        down.push(ordered[ordered.length - 1]);
      }
      sampled = down;
    }

    spines.push({
      points: sampled.map((p) => ({ x: p.x, y: p.y, grad_mag: p.grad })),
      length_m,
      mean_grad: meanGrad,
      max_grad: maxGrad,
      centroid: { x: meanX, y: meanY },
      bbox: { x_min: xMin, x_max: xMax, y_min: yMin, y_max: yMax },
      point_count: count,
    });
  }

  spines.sort((a, b) => {
    if (Math.abs(b.length_m - a.length_m) > EPS) return b.length_m - a.length_m;
    return b.mean_grad - a.mean_grad;
  });
  if (spines.length > config.ridge_max_count) {
    spines.length = config.ridge_max_count;
  }

  ridgePointCount = spines.reduce((sum, spine) => sum + spine.point_count, 0);
  ridgeLengthSum = spines.reduce((sum, spine) => sum + spine.length_m, 0);
  const ridgeStrengthSum = spines.reduce(
    (sum, spine) => sum + spine.mean_grad * spine.point_count,
    0,
  );
  const ridgeCount = spines.length;
  const ridgeDensity = ridgePointCount / Math.max(1, validCount);
  const fragmentationIndex = ridgeCount / Math.max(1, ridgePointCount);

  const summary = {
    ridge_count: ridgeCount,
    ridge_point_count: ridgePointCount,
    ridge_length_m: ridgeLengthSum,
    ridge_density: ridgeDensity,
    fragmentation_index: fragmentationIndex,
    thresholds: { high, low },
  };

  return {
    frame: { summary, spines },
    ridgeStrengthSum,
    totalStrengthSum,
  };
};

export const computeCurvatureMetricsAndRidges = (
  input: MetricInput,
): { k_metrics: TCurvatureKMetrics; ridges: TCurvatureRidgeFrame } => {
  const { gradMag, laplacian, residual, boundary, maskOn, config } = input;
  const { mask: validMask } = buildValidMask(
    input.grid.nx,
    input.grid.ny,
    boundary,
    maskOn,
  );
  const stats = scanFieldStats(gradMag, laplacian, residual, validMask);
  const ridgeResult = extractRidgeSpines(input);
  const k0 = stats.meanAbsLap > 0
    ? clampFinite(
        percentile(stats.absLapValues, config.k0_percentile) /
          (stats.meanAbsLap + EPS),
      )
    : 0;
  const k1 = ridgeResult.totalStrengthSum > 0
    ? clampFinite(ridgeResult.ridgeStrengthSum / (ridgeResult.totalStrengthSum + EPS))
    : 0;
  const k2 = (stats.lapEnergy + stats.residualEnergy) > 0
    ? clampFinite(stats.residualEnergy / (stats.lapEnergy + stats.residualEnergy + EPS))
    : 0;

  return {
    k_metrics: { k0, k1, k2 },
    ridges: ridgeResult.frame,
  };
};

export const computePhaseLockScore = (
  samples: Array<{ t_s: number; k1: number }>,
  drive_hz: number,
): number => {
  if (!Number.isFinite(drive_hz) || drive_hz <= 0 || samples.length < 2) {
    return 0;
  }
  let sumRe = 0;
  let sumIm = 0;
  let sumW = 0;
  const omega = 2 * Math.PI * drive_hz;
  for (const sample of samples) {
    if (!Number.isFinite(sample.t_s) || !Number.isFinite(sample.k1)) continue;
    const w = Math.max(0, sample.k1);
    const phase = omega * sample.t_s;
    sumRe += w * Math.cos(phase);
    sumIm += w * Math.sin(phase);
    sumW += w;
  }
  if (sumW <= 0) return 0;
  return Math.min(1, Math.max(0, Math.hypot(sumRe, sumIm) / sumW));
};

const estimateSpacing = (spines: TCurvatureRidgeSpine[]): number => {
  const distances: number[] = [];
  for (const spine of spines) {
    const pts = spine.points;
    for (let i = 1; i < pts.length; i++) {
      distances.push(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
  }
  if (!distances.length) return 1;
  distances.sort((a, b) => a - b);
  return distances[Math.floor(distances.length / 2)] || 1;
};

export const trackRidgeSequence = (
  frames: Array<{ t_s?: number; ridges: TCurvatureRidgeSpine[]; k1?: number }>,
  config?: RidgeTrackingConfig,
): RidgeTrackingResult => {
  const tracks: RidgeTrack[] = [];
  const results: RidgeTrackingFrame[] = [];
  const active: Map<string, { centroid: { x: number; y: number }; lastFrame: number }> =
    new Map();
  let idCounter = 0;

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
    const frame = frames[frameIndex];
    const ridges = frame.ridges.map((ridge) => ({ ...ridge }));
    const prevIds = Array.from(active.keys());
    const prevCentroids = prevIds.map((id) => active.get(id)!.centroid);

    const spacing = estimateSpacing(ridges);
    const maxDist =
      config?.max_link_distance_m ?? Math.max(1e-6, spacing * 3);

    const matches: Array<{ prevIdx: number; currIdx: number; dist: number }> = [];
    for (let i = 0; i < prevCentroids.length; i++) {
      for (let j = 0; j < ridges.length; j++) {
        const curr = ridges[j].centroid;
        const prev = prevCentroids[i];
        const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        if (dist <= maxDist) {
          matches.push({ prevIdx: i, currIdx: j, dist });
        }
      }
    }
    matches.sort((a, b) => a.dist - b.dist);

    const usedPrev = new Set<number>();
    const usedCurr = new Set<number>();
    for (const match of matches) {
      if (usedPrev.has(match.prevIdx) || usedCurr.has(match.currIdx)) {
        continue;
      }
      usedPrev.add(match.prevIdx);
      usedCurr.add(match.currIdx);
      const id = prevIds[match.prevIdx];
      ridges[match.currIdx].id = id;
      const current = active.get(id);
      if (current) {
        current.centroid = ridges[match.currIdx].centroid;
        current.lastFrame = frameIndex;
      }
    }

    const newCount = ridges.filter((ridge) => !ridge.id).length;
    for (const ridge of ridges) {
      if (!ridge.id) {
        const id = `ridge-${idCounter++}`;
        ridge.id = id;
        active.set(id, { centroid: ridge.centroid, lastFrame: frameIndex });
        tracks.push({
          id,
          first_frame: frameIndex,
          last_frame: frameIndex,
          lifetime_frames: 1,
        });
      }
    }

    const matchedCount = usedCurr.size;
    const ended: string[] = [];
    for (const id of prevIds) {
      const entry = active.get(id);
      if (!entry) continue;
      if (entry.lastFrame < frameIndex) {
        ended.push(id);
      }
    }
    for (const id of ended) {
      active.delete(id);
    }

    for (const track of tracks) {
      if (track.id === undefined) continue;
      const entry = active.get(track.id);
      if (entry) {
        track.last_frame = frameIndex;
        track.lifetime_frames = track.last_frame - track.first_frame + 1;
      }
    }

    const prevCount = prevIds.length;
    const ridgeCount = ridges.length;
    const endedCount = ended.length;
    const fragmentationRate =
      (newCount + endedCount) / Math.max(1, prevCount + ridgeCount);

    results.push({
      frame_index: frameIndex,
      t_s: frame.t_s,
      ridge_count: ridgeCount,
      matched_count: matchedCount,
      new_count: newCount,
      ended_count: endedCount,
      fragmentation_rate: fragmentationRate,
      ridges,
    });
  }

  const driveHz = config?.drive_hz;
  const k3 =
    Number.isFinite(driveHz ?? NaN) &&
    (driveHz ?? 0) > 0 &&
    frames.length > 1 &&
    frames.some((frame) => Number.isFinite(frame.k1 ?? NaN))
      ? computePhaseLockScore(
          frames
            .filter(
              (frame) =>
                Number.isFinite(frame.k1 ?? NaN) &&
                Number.isFinite(frame.t_s ?? NaN),
            )
            .map((frame) => ({ t_s: frame.t_s as number, k1: frame.k1 as number })),
          driveHz as number,
        )
      : undefined;

  return { frames: results, tracks, k3 };
};
