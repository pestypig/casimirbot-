/**
 * Synthetic harness to probe disk detection + mapping robustness.
 *
 * Generates simple grayscale frames with a bright solar disk, optional active regions,
 * optional caption band, and noise; then runs estimateSolarDisk and mapFrameToDiskGrid.
 */
import { estimateSolarDisk, mapFrameToDiskGrid, DiskGeometry } from "../services/essence/solar-video-coherence";

type Spot = { ux: number; vy: number; radiusFrac: number; peak: number };

type Scenario = {
  name: string;
  width: number;
  height: number;
  cx: number;
  cy: number;
  r: number;
  captionFrac?: number;
  bgNoise?: number;
  captionNoise?: number;
  limbDarkening?: number;
  spots?: Spot[];
};

function clamp255(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function generateFrame(opts: Scenario): Uint8Array {
  const {
    width,
    height,
    cx,
    cy,
    r,
    captionFrac = 0.12,
    bgNoise = 1,
    captionNoise = 10,
    limbDarkening = 0.35,
    spots = [],
  } = opts;
  const frame = new Uint8Array(width * height);
  const captionTop = Math.floor(height * (1 - captionFrac));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      // base background with small noise
      let val = bgNoise * Math.random();

      // caption band
      if (y >= captionTop) {
        val += 20 + captionNoise * Math.random();
      }

      // solar disk
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= r) {
        const limb = 1 - dist / r;
        const limbWeight = Math.pow(Math.max(0, limb), limbDarkening);
        val += 200 * limbWeight;
        // active regions
        for (const spot of spots) {
          const sx = cx + spot.ux * r;
          const sy = cy - spot.vy * r; // vy is +north/up
          const sdx = x + 0.5 - sx;
          const sdy = y + 0.5 - sy;
          const sr = spot.radiusFrac * r;
          const falloff = Math.exp(-(sdx * sdx + sdy * sdy) / (2 * sr * sr + 1e-6));
          val += spot.peak * falloff;
        }
      }

      frame[idx] = clamp255(val);
    }
  }

  return frame;
}

function gridCentroid(grid: Float32Array, N: number, thr = 0.01): { cx: number; cy: number; count: number } | undefined {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let idx = 0; idx < grid.length; idx++) {
    const v = grid[idx];
    if (v <= thr) continue;
    const y = Math.floor(idx / N);
    const x = idx - y * N;
    sumX += x;
    sumY += y;
    count++;
  }
  if (!count) return undefined;
  return { cx: sumX / count, cy: sumY / count, count };
}

function runScenario(s: Scenario, gridSize = 192) {
  const frame = generateFrame(s);
  const detected = estimateSolarDisk(frame, s.width, s.height);
  let mapStats: { centroid?: { cx: number; cy: number; count: number }; max: number } | null = null;
  if (detected) {
    const { sunMap, max } = mapFrameToDiskGrid(frame, s.width, s.height, detected, gridSize);
    mapStats = {
      centroid: gridCentroid(sunMap, gridSize),
      max,
    };
  }
  return {
    name: s.name,
    trueGeom: { cx: s.cx, cy: s.cy, r: s.r },
    detected:
      detected && {
        cx: detected.cx,
        cy: detected.cy,
        r: detected.r,
      },
    errors:
      detected && {
        dx: detected.cx - s.cx,
        dy: detected.cy - s.cy,
        dr: detected.r - s.r,
      },
    mapCentroid: mapStats?.centroid,
    mapMax: mapStats?.max,
  };
}

const scenarios: Scenario[] = [
  {
    name: "centered_uniform",
    width: 320,
    height: 240,
    cx: 160,
    cy: 120,
    r: 80,
  },
  {
    name: "offset_plus5_7",
    width: 320,
    height: 240,
    cx: 160 * 1.05,
    cy: 120 * 0.93,
    r: 80,
  },
  {
    name: "bright_AR_east",
    width: 320,
    height: 240,
    cx: 160,
    cy: 120,
    r: 80,
    spots: [{ ux: 0.8, vy: 0, radiusFrac: 0.12, peak: 80 }],
  },
  {
    name: "bright_AR_west",
    width: 320,
    height: 240,
    cx: 160,
    cy: 120,
    r: 80,
    spots: [{ ux: -0.8, vy: 0, radiusFrac: 0.12, peak: 80 }],
  },
  {
    name: "caption_20pct",
    width: 320,
    height: 240,
    cx: 160,
    cy: 120,
    r: 80,
    captionFrac: 0.2,
  },
  {
    name: "high_noise",
    width: 320,
    height: 240,
    cx: 160,
    cy: 120,
    r: 80,
    bgNoise: 8,
    captionNoise: 25,
  },
  {
    name: "small_disk_15pct_offcenter",
    width: 320,
    height: 240,
    cx: 160 * 0.85,
    cy: 120 * 1.1,
    r: 60,
  },
];

const results = scenarios.map((s) => runScenario(s));
console.log(JSON.stringify(results, null, 2));
