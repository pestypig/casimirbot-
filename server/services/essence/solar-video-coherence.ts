/**
 * Solar video coherence scaffold (numeric + semantic)
 *
 * - Extracts frames from a GIF/video buffer (sharp animated decode; no ffmpeg dependency)
 * - Normalizes to an NxN Sun-centric disk grid with a circular mask
 * - Produces a coarse coherence map (intensity-normalized proxy) and simple aggregates
 * - Emits an InformationEvent into the star coherence service
 * - Optional: attaches a semantic caption via the pluggable vision provider (Ollama/OpenAI)
 *
 * This stays lightweight so we can iterate quickly toward full limb-fit/optical-flow/Hilbert-based coherence.
 */
import sharp from "sharp";
import { handleInformationEvent } from "../star/service";
import { getVisionProvider, defaultVisionPrompt } from "../vision/provider";

// Reduce sharp/libvips memory pressure: disable caching and keep concurrency low.
sharp.cache({ files: 0, memory: 32, items: 16 });
sharp.concurrency(Math.max(1, Number(process.env.SOLAR_COCO_SHARP_CONCURRENCY ?? 1)));

const CAPTION_TIMEOUT_MS = 12_000;
const CLOCK_OCR_TIMEOUT_MS = 8_000;
// Hard cap for the resized per-frame pixel area (post-downscale) to avoid libvips OOMs.
const OUTPUT_PIXEL_CAP = Math.max(1, Number(process.env.SOLAR_COCO_MAX_PIXELS ?? 4 * 1024 * 1024)); // default 4 MP
// Separate guard for sharp/libvips input decode; keep this comfortably above OUTPUT_PIXEL_CAP so we can downscale.
const envInputPixelLimit = Number(process.env.SOLAR_COCO_INPUT_PIXEL_LIMIT ?? 0);
const INPUT_PIXEL_LIMIT = Math.max(
  1,
  Number.isFinite(envInputPixelLimit) && envInputPixelLimit > 0
    ? envInputPixelLimit
    : Math.max(OUTPUT_PIXEL_CAP * 8, 128 * 1024 * 1024),
); // default fuse: max(8x output cap, 128 MP)
const GRID_SIZE_DEFAULT = 160; // keep default grid moderate for stability
const GRID_SIZE_MIN = 64;
const GRID_SIZE_MAX = 224; // avoid very heavy grids by default
const MAX_FRAMES_DEFAULT = 80;
const MAX_FRAMES_CEILING = 120;
const MAX_FRAMES = Math.max(
  1,
  Math.min(MAX_FRAMES_CEILING, Number(process.env.SOLAR_COCO_MAX_FRAMES ?? MAX_FRAMES_DEFAULT)),
); // hard-cap default frame budget to keep long GIFs from timing out
const parsedBudget = Number(process.env.SOLAR_COCO_JOB_BUDGET_MS ?? 0);
const JOB_BUDGET_MS = Number.isFinite(parsedBudget) && parsedBudget > 0 ? Math.max(10_000, parsedBudget) : null; // allow disable with 0/undefined

export interface SolarVideoCoherenceJob {
  /** GIF / video buffer already staged by ingest (animated images supported). */
  buffer: Buffer;
  mime?: string;
  gridSize?: number; // NxN target grid for the disk model
  maxFrames?: number; // optional per-request cap; defaults to env
  sampleStride?: number; // optional fixed stride override (1 = use every frame)
  instrumentTag?: string;
  sessionId?: string;
  sessionType?: string;
  hostMode?: string;
  prompt?: string;
  timestampMs?: number;
}

export interface DiskGeometry {
  cx: number;
  cy: number;
  r: number;
  thetaObs: number;
  frameWidth: number;
  frameHeight: number;
}

export interface FrameSample {
  t: number; // unix ms
  gridSize: number;
  sunMap: Float32Array; // observer-frame grid (north-up, disk-aligned)
  sunMapCorot?: Float32Array; // differential-rotation cancelled grid (features stay put)
  rotationShiftPx?: number; // kept for compatibility; now derived analytically
  diskGeom: DiskGeometry;
}

interface CoRotGridMeta {
  N: number;
  lat: Float32Array; // heliographic latitude (rad), +north
  lon0: Float32Array; // reference longitude (rad) at t0, 0 at disk center
  mask: Uint8Array; // 1 = on visible disk
  sinPhi: Float32Array;
  cosPhi: Float32Array;
  omega: Float32Array; // rotation rate (rad/s) per latitude
}

export interface CoherenceMap {
  gridSize: number;
  coherence: Float32Array; // 0..1
  phaseMean: Float32Array; // rad (proxy: zeros)
  phaseDispersion: Float32Array; // proxy
  energy: Float32Array; // simple variance proxy
}

export interface SolarCoherenceResult {
  frames: FrameSample[];
  map: CoherenceMap;
  caption?: string;
  global: {
    coherence: number;
    dispersion: number;
    energy: number;
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms);
    promise.then(resolve, reject);
  }).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

const checkBudget = (deadlineMs: number | null, label: string) => {
  if (deadlineMs && Date.now() > deadlineMs) {
    throw new Error(`solar_coherence_budget_exceeded:${label}`);
  }
};

export async function runSolarVideoCoherenceJob(job: SolarVideoCoherenceJob): Promise<SolarCoherenceResult> {
  const {
    buffer,
    mime = "image/gif",
    gridSize,
    maxFrames,
    sampleStride,
    instrumentTag = "suvi_195",
    sessionId = "solar-video",
    sessionType = "solar",
    hostMode = "sun_like",
    prompt = defaultVisionPrompt(),
    timestampMs = Date.now(),
  } = job;

  const effectiveGrid = Math.min(GRID_SIZE_MAX, Math.max(GRID_SIZE_MIN, gridSize ?? GRID_SIZE_DEFAULT));

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("runSolarVideoCoherenceJob requires a non-empty buffer");
  }
  const tStart = Date.now();
  const budgetDeadline = JOB_BUDGET_MS ? tStart + JOB_BUDGET_MS : undefined;
  console.info("[solar-coherence] start", { bytes: buffer.length, gridSize: effectiveGrid, mime, timestampMs });

  // Attempt to recover true UTC timestamps from the embedded clock (first/last frame).
  const frameCount = await getFrameCount(buffer);
  const tMs = await calibrateFrameTiming(buffer, frameCount, mime, CLOCK_OCR_TIMEOUT_MS).catch((error) => {
    console.warn("[solar-coherence] timing calibration skipped", error);
    return null;
  });

  const frames = await decodeFramesToGrid(buffer, effectiveGrid, tMs ?? undefined, maxFrames, sampleStride, budgetDeadline);
  console.info("[solar-coherence] decoded frames", {
    frames: frames.length,
    gridSize: effectiveGrid,
    duration_ms: Date.now() - tStart,
  });
  const map = buildCoherenceProxy(frames);
  console.info("[solar-coherence] built coherence map", { duration_ms: Date.now() - tStart });

  // Semantic caption via vision provider (Ollama/OpenAI), optional.
  let caption: string | undefined;
  try {
    const vision = getVisionProvider();
    caption = await withTimeout(
      vision.describeImage(buffer.toString("base64"), mime, prompt),
      CAPTION_TIMEOUT_MS,
      "vision describeImage",
    );
  } catch (error) {
    console.warn("[solar-coherence] vision describe failed", error);
  }

  const global = summarizeMap(map);

  // Emit into star coherence loop as an InformationEvent.
  handleInformationEvent({
    session_id: sessionId,
    session_type: sessionType,
    host_mode: hostMode,
    origin: "system",
    bytes: buffer.length,
    complexity_score: clamp01(shannonEntropy(map.coherence) / 5), // crude entropy proxy
    alignment: clamp01(global.coherence),
    timestamp: timestampMs,
    metadata: {
      solar_caption: caption,
      instrument_tag: instrumentTag,
      grid_size: map.gridSize,
      frame_count: frames.length,
      global_coherence: global.coherence,
      global_dispersion: global.dispersion,
      global_energy: global.energy,
      kind: "solar_video_coherence",
    },
  });

  console.info("[solar-coherence] done", {
    duration_ms: Date.now() - tStart,
    frames: frames.length,
    gridSize: map.gridSize,
    coherence: global.coherence,
    dispersion: global.dispersion,
    energy: global.energy,
  });

  return { frames, map, caption, global };
}

async function decodeFramesToGrid(
  buffer: Buffer,
  N: number,
  tMs?: number[],
  maxFrames?: number,
  sampleStride?: number,
  budgetDeadline?: number,
): Promise<FrameSample[]> {
  checkBudget(budgetDeadline ?? null, "start");
  // Read metadata without an aggressive pixel guard; we'll enforce our own limits after inspecting dimensions.
  const img = sharp(buffer, { animated: true }).greyscale();
  const meta = await img.metadata();
  const pages = meta.pages && meta.pages > 0 ? meta.pages : 1;
  if (!meta.width || !meta.height) {
    throw new Error("Unable to read image dimensions for solar video");
  }
  const fullWidth = meta.width;
  const fullHeight = meta.pageHeight ?? meta.height;
  const fullArea = fullWidth * fullHeight;
  checkBudget(budgetDeadline ?? null, "metadata");

  if (fullArea > INPUT_PIXEL_LIMIT) {
    console.warn("[solar-coherence] input exceeds pixel limit", {
      width: fullWidth,
      height: fullHeight,
      pages,
      fullPixels: fullArea,
      inputPixelLimit: INPUT_PIXEL_LIMIT,
    });
    throw new Error(`input_pixels_exceed_limit: ${fullArea} > ${INPUT_PIXEL_LIMIT}`);
  }
  if (process.env.SOLAR_COCO_LOG_GEOM === "1") {
    console.info("[solar-coherence] source meta", {
      width: fullWidth,
      height: fullHeight,
      pages,
      fullPixels: fullArea,
      outputPixelCap: OUTPUT_PIXEL_CAP,
      inputPixelLimit: INPUT_PIXEL_LIMIT,
      targetWidth: fullWidth,
      targetHeight: fullHeight,
      targetPixels: fullArea,
    });
  }
  let frameWidth = fullWidth;
  let frameHeight = fullHeight;
  const enforcePixelCap = (w: number, h: number) => {
    const area = w * h;
    if (area <= OUTPUT_PIXEL_CAP) return { w, h, scale: 1 };
    const scale = Math.sqrt(OUTPUT_PIXEL_CAP / area);
    const w2 = Math.max(1, Math.floor(w * scale));
    const h2 = Math.max(1, Math.floor(h * scale));
    return { w: w2, h: h2, scale };
  };

  if (fullArea > OUTPUT_PIXEL_CAP) {
    const { w, h, scale } = enforcePixelCap(fullWidth, fullHeight);
    frameWidth = w;
    frameHeight = h;
    console.warn("[solar-coherence] downscaling frames to fit pixel cap", {
      fullWidth,
      fullHeight,
      fullPixels: fullArea,
      targetWidth: frameWidth,
      targetHeight: frameHeight,
      outputPixelCap: OUTPUT_PIXEL_CAP,
      inputPixelLimit: INPUT_PIXEL_LIMIT,
      scale,
    });
  }

  // Belt-and-suspenders: ensure the chosen target dimensions still sit under the cap.
  const capped = enforcePixelCap(frameWidth, frameHeight);
  frameWidth = capped.w;
  frameHeight = capped.h;
  if (process.env.SOLAR_COCO_LOG_GEOM === "1") {
    console.info("[solar-coherence] target dimensions", {
      targetWidth: frameWidth,
      targetHeight: frameHeight,
      targetPixels: frameWidth * frameHeight,
      outputPixelCap: OUTPUT_PIXEL_CAP,
    });
  }
  const capFrames = maxFrames && maxFrames > 0 ? Math.min(maxFrames, MAX_FRAMES) : MAX_FRAMES;
  const stride = sampleStride && sampleStride > 0 ? sampleStride : Math.max(1, Math.ceil(pages / capFrames));
  const frameIndices: number[] = [];
  for (let idx = 0; idx < pages; idx += stride) frameIndices.push(idx);
  // Always include last frame to cover end timestamp if skipped by stride.
  if (frameIndices[frameIndices.length - 1] !== pages - 1) frameIndices.push(pages - 1);
  const firstIndex = frameIndices[0] ?? 0;
  const t0 = Date.now();
  const frameDurationMs =
    typeof meta.delay === "number" && meta.delay > 0 ? meta.delay * 10 : 240_000; // GIF delay is 1/100s
  const resizeOpts: sharp.ResizeOptions = { fit: "fill", withoutEnlargement: true, fastShrinkOnLoad: true };
  let cachedFirstFrame: Uint8Array | null = null;

  // Find a safe decode size by probing the first frame and backing off if libvips fails.
  const settleDecodeDimensions = async (): Promise<{ w: number; h: number }> => {
    let w = frameWidth;
    let h = frameHeight;
    const maxAttempts = 4;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      checkBudget(budgetDeadline ?? null, "settle_decode");
      try {
        const buf = await sharp(buffer, { animated: true, page: firstIndex, limitInputPixels: INPUT_PIXEL_LIMIT })
          .greyscale()
          .removeAlpha()
          .toColourspace("b-w")
          .resize(w, h, resizeOpts)
          .raw({ depth: "uchar" })
          .toBuffer();
        cachedFirstFrame = new Uint8Array(buf);
        if (process.env.SOLAR_COCO_LOG_GEOM === "1") {
          console.info("[solar-coherence] decode dimensions settled", {
            width: w,
            height: h,
            attempt,
            outputPixelCap: OUTPUT_PIXEL_CAP,
          });
        }
        return { w, h };
      } catch (error) {
        if (attempt === maxAttempts - 1) throw error;
        const scale = 0.7;
        w = Math.max(1, Math.floor(w * scale));
        h = Math.max(1, Math.floor(h * scale));
        console.warn("[solar-coherence] decode retry with smaller dimensions", {
          attempt: attempt + 1,
          width: w,
          height: h,
          outputPixelCap: OUTPUT_PIXEL_CAP,
          inputPixelLimit: INPUT_PIXEL_LIMIT,
        });
      }
    }
    throw new Error("Unable to settle decode dimensions");
  };

  const settled = await settleDecodeDimensions();
  frameWidth = settled.w;
  frameHeight = settled.h;

  const baseGeom: DiskGeometry = {
    cx: frameWidth / 2,
    cy: frameHeight / 2,
    r: Math.min(frameWidth, frameHeight) * 0.48, // leave headroom instead of filling edge to edge
    thetaObs: 0,
    frameWidth,
    frameHeight,
  };

  // Precompute timestamps for each selected frame index.
  const frameTimes: number[] = frameIndices.map((i) =>
    Array.isArray(tMs) && Number.isFinite(tMs[i]) ? (tMs[i] as number) : t0 + i * frameDurationMs,
  );

  // Pass 1: measure geometry only (no large frame accumulation).
  const geomSamples: DiskGeometry[] = [];
  for (let k = 0; k < frameIndices.length; k++) {
    checkBudget(budgetDeadline ?? null, "geom_pass");
    const i = frameIndices[k];
    let frameU8: Uint8Array;
    if (i === firstIndex && cachedFirstFrame) {
      frameU8 = cachedFirstFrame;
    } else {
      const frameBuf = await sharp(buffer, { animated: true, page: i, limitInputPixels: INPUT_PIXEL_LIMIT })
        .greyscale()
        .resize(frameWidth, frameHeight, resizeOpts)
        .raw()
        .toBuffer();
      frameU8 = new Uint8Array(frameBuf);
    }
    const measured = estimateSolarDisk(frameU8, frameWidth, frameHeight);
    if (measured) geomSamples.push(measured);
    if (process.env.SOLAR_COCO_LOG_GEOM === "1") {
      console.info("[solar-coherence] geometry sample", {
        frame: i,
        cx_raw: measured?.cx ?? null,
        cy_raw: measured?.cy ?? null,
        r_raw: measured?.r ?? null,
      });
    }
  }

  // Derive canonical geometry (fallback to base if nothing measured).
  const canonicalGeom = deriveReferenceGeometry(geomSamples, baseGeom);

  const frames: FrameSample[] = [];
  // Pass 2: decode again, map with canonical geometry, and emit frames.
  for (let k = 0; k < frameIndices.length; k++) {
    checkBudget(budgetDeadline ?? null, "decode_pass");
    const i = frameIndices[k];
    const frameBuf = await sharp(buffer, { animated: true, page: i, limitInputPixels: INPUT_PIXEL_LIMIT })
      .greyscale()
      .removeAlpha()
      .toColourspace("b-w")
      .resize(frameWidth, frameHeight, resizeOpts)
      .raw({ depth: "uchar" })
      .toBuffer();
    const frameU8 = new Uint8Array(frameBuf);
    const { sunMap, max } = mapFrameToDiskGrid(frameU8, frameWidth, frameHeight, canonicalGeom, N);
    const scale = max > 0 ? max : 1;
    for (let idx = 0; idx < sunMap.length; idx++) {
      sunMap[idx] = sunMap[idx] / scale;
      if (!Number.isFinite(sunMap[idx])) sunMap[idx] = 0;
    }
    frames.push({ t: frameTimes[k], gridSize: N, sunMap, diskGeom: { ...canonicalGeom } });
  }

  // Estimate per-frame solar rotation and build co-rotating maps.
  applyDifferentialDerotation(frames);

  return frames;
}

function buildCoherenceProxy(frames: FrameSample[]): CoherenceMap {
  const N = frames[0].gridSize;
  const N2 = N * N;
  const coherence = new Float32Array(N2);
  const phaseMean = new Float32Array(N2); // zeros; placeholder
  const phaseDispersion = new Float32Array(N2);
  const energy = new Float32Array(N2);

  // Simple proxy: average normalized intensity across frames; energy = variance; phaseDispersion = 0
  const T = frames.length;
  for (const frame of frames) {
    const src = frame.sunMapCorot ?? frame.sunMap;
    for (let k = 0; k < N2; k++) {
      const v = src[k];
      coherence[k] += v / T;
      energy[k] += (v * v) / T;
    }
  }

  return { gridSize: N, coherence, phaseMean, phaseDispersion, energy };
}

function summarizeMap(map: CoherenceMap) {
  const N2 = map.gridSize * map.gridSize;
  let sumC = 0,
    sumDisp = 0,
    sumE = 0;
  for (let k = 0; k < N2; k++) {
    sumC += map.coherence[k];
    sumDisp += map.phaseDispersion[k];
    sumE += map.energy[k];
  }
  return {
    coherence: sumC / N2,
    dispersion: sumDisp / N2,
    energy: sumE,
  };
}

function shannonEntropy(vals: Float32Array): number {
  const bins = new Array(32).fill(0);
  for (let i = 0; i < vals.length; i++) {
    const v = Math.min(0.9999, Math.max(0, vals[i]));
    const b = Math.floor(v * bins.length);
    bins[b]++;
  }
  const n = vals.length || 1;
  let H = 0;
  for (const c of bins) {
    if (!c) continue;
    const p = c / n;
    H -= p * Math.log2(p);
  }
  return H;
}

function median(values: number[]): number {
  if (!values.length) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return 0.5 * (sorted[mid - 1] + sorted[mid]);
  }
  return sorted[mid];
}

function deriveReferenceGeometry(samples: DiskGeometry[], fallback: DiskGeometry): DiskGeometry {
  if (!samples.length) return fallback;
  const cxRef = median(samples.map((g) => g.cx));
  const cyRef = median(samples.map((g) => g.cy));
  const rRef = median(samples.map((g) => g.r));
  const cx = Number.isFinite(cxRef) ? cxRef : fallback.cx;
  const cy = Number.isFinite(cyRef) ? cyRef : fallback.cy;
  const r = Number.isFinite(rRef) ? rRef : fallback.r;
  return { ...fallback, cx, cy, r };
}

export function estimateSolarDisk(frame: Uint8Array, width: number, height: number): DiskGeometry | null {
  const captionFrac = 0.12; // bottom caption/logo band
  const usableHeight = Math.floor(height * (1 - captionFrac));
  if (usableHeight <= 0 || width <= 0) return null;

  let min = Infinity;
  let max = -Infinity;
  const edgeSample: number[] = [];
  const usableLen = usableHeight * width;
  for (let i = 0; i < usableLen; i++) {
    const v = frame[i];
    if (v < min) min = v;
    if (v > max) max = v;
    // Sample a thin border (background proxy) to avoid caption bias.
    if (i < width * 4 || i % width < 4 || width - (i % width) <= 4) {
      edgeSample.push(v);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;

  const edgeMean =
    edgeSample.length > 0 ? edgeSample.reduce((a, b) => a + b, 0) / edgeSample.length : min;
  const thr = edgeMean + 0.08 * (max - edgeMean); // modest lift above background

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let y = 0; y < usableHeight; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const v = frame[row + x];
      if (v > thr) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }
  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxY) ||
    count < 50
  ) {
    return null;
  }

  const cx = sumX / count;
  const cy = sumY / count;
  const spanX = maxX - minX + 1;
  const spanY = maxY - minY + 1;
  const rBox = 0.25 * (spanX + spanY);
  const rArea = Math.sqrt(count / Math.PI);
  const r = Math.max(1, 0.5 * (rBox + rArea)); // blend bbox and area for stability
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r) || r <= 0) return null;

  return { cx, cy, r, thetaObs: 0, frameWidth: width, frameHeight: height };
}

export function mapFrameToDiskGrid(
  frame: Uint8Array,
  width: number,
  height: number,
  geom: DiskGeometry,
  N: number,
): { sunMap: Float32Array; max: number } {
  const sunMap = new Float32Array(N * N);
  let max = 0;
  const { cx, cy, r } = geom;
  for (let y = 0; y < N; y++) {
    const v = (y / (N - 1)) * 2 - 1;
    for (let x = 0; x < N; x++) {
      const u = (x / (N - 1)) * 2 - 1;
      const idx = y * N + x;
      if (u * u + v * v > 1) {
        sunMap[idx] = 0;
        continue;
      }
      const xImg = cx + u * r;
      const yImg = cy - v * r; // v is +north-up, image y grows downward
      const sample = bilinearSample(frame, width, height, xImg, yImg) / 255;
      sunMap[idx] = sample;
      if (sample > max) max = sample;
    }
  }
  return { sunMap, max };
}

function bilinearSample(frame: Uint8Array, width: number, height: number, x: number, y: number): number {
  if (width <= 0 || height <= 0) return 0;
  const xClamped = Math.max(0, Math.min(width - 1 - 1e-6, x));
  const yClamped = Math.max(0, Math.min(height - 1 - 1e-6, y));
  const x0 = Math.floor(xClamped);
  const y0 = Math.floor(yClamped);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const wx = xClamped - x0;
  const wy = yClamped - y0;

  const idx = (yy: number, xx: number) => yy * width + xx;
  const v00 = frame[idx(y0, x0)];
  const v10 = frame[idx(y0, x1)];
  const v01 = frame[idx(y1, x0)];
  const v11 = frame[idx(y1, x1)];

  const top = v00 * (1 - wx) + v10 * wx;
  const bottom = v01 * (1 - wx) + v11 * wx;
  return top * (1 - wy) + bottom * wy;
}

function bilinearSampleFloat32(frame: Float32Array, width: number, height: number, x: number, y: number): number {
  if (width <= 0 || height <= 0) return 0;
  const xClamped = Math.max(0, Math.min(width - 1 - 1e-6, x));
  const yClamped = Math.max(0, Math.min(height - 1 - 1e-6, y));
  const x0 = Math.floor(xClamped);
  const y0 = Math.floor(yClamped);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const wx = xClamped - x0;
  const wy = yClamped - y0;
  const idx = (yy: number, xx: number) => yy * width + xx;
  const v00 = frame[idx(y0, x0)];
  const v10 = frame[idx(y0, x1)];
  const v01 = frame[idx(y1, x0)];
  const v11 = frame[idx(y1, x1)];
  const top = v00 * (1 - wx) + v10 * wx;
  const bottom = v01 * (1 - wx) + v11 * wx;
  return top * (1 - wy) + bottom * wy;
}

// Differential rotation law (Snodgrass/Ulrich style) in rad/s.
function rotationOmega(phi: number): number {
  const A = 14.713;
  const B = -2.396;
  const C = -1.787;
  const s2 = Math.sin(phi) ** 2;
  const s4 = s2 * s2;
  const omegaDegPerDay = A + B * s2 + C * s4;
  return (omegaDegPerDay * Math.PI) / 180 / (24 * 3600);
}

function buildCoRotGridMeta(N: number): CoRotGridMeta {
  const lat = new Float32Array(N * N);
  const lon0 = new Float32Array(N * N);
  const mask = new Uint8Array(N * N);
  const sinPhi = new Float32Array(N * N);
  const cosPhi = new Float32Array(N * N);
  const omega = new Float32Array(N * N);
  const denom = Math.max(1, N - 1);
  for (let y = 0; y < N; y++) {
    const vMap = ((y + 0.5) / denom) * 2 - 1; // +south (image row), we'll flip for physical north
    const vPhys = -vMap;
    for (let x = 0; x < N; x++) {
      const u = ((x + 0.5) / denom) * 2 - 1; // +east/right
      const idx = y * N + x;
      const rho2 = u * u + vPhys * vPhys;
      if (rho2 >= 1) {
        mask[idx] = 0;
        lat[idx] = 0;
        lon0[idx] = 0;
        continue;
      }
      mask[idx] = 1;
      const z = Math.sqrt(1 - rho2);
      const phi = Math.asin(vPhys);
      const lambda0 = Math.atan2(u, z); // central meridian = 0
      lat[idx] = phi;
      lon0[idx] = lambda0;
      const sPhi = Math.sin(phi);
      const cPhi = Math.cos(phi);
      sinPhi[idx] = sPhi;
      cosPhi[idx] = cPhi;
      omega[idx] = rotationOmega(phi);
    }
  }
  return { N, lat, lon0, mask, sinPhi, cosPhi, omega };
}

function derotateFrameToReferenceGrid(mapObserver: Float32Array, meta: CoRotGridMeta, dtSec: number): Float32Array {
  const { N, lon0, mask, sinPhi: sinPhiArr, cosPhi: cosPhiArr, omega } = meta;
  const out = new Float32Array(N * N);
  const denom = Math.max(1, N - 1);
  for (let idx = 0; idx < out.length; idx++) {
    if (!mask[idx]) {
      out[idx] = 0;
      continue;
    }
    const lambdaObs = lon0[idx] + omega[idx] * dtSec;
    const sinPhi = sinPhiArr[idx];
    const cosPhi = cosPhiArr[idx];
    const x = cosPhi * Math.sin(lambdaObs); // +east
    const y = sinPhi; // +north
    const z = cosPhi * Math.cos(lambdaObs); // toward observer
    if (z <= 0) {
      out[idx] = 0;
      continue;
    }
    const u = x;
    const vPhys = y;
    const vMap = -vPhys; // flip back to map row convention (+south)
    const gx = ((u + 1) * 0.5) * denom;
    const gy = ((vMap + 1) * 0.5) * denom;
    out[idx] = bilinearSampleFloat32(mapObserver, N, N, gx, gy);
  }
  return out;
}

function estimateDiskCenterFromGrid(
  grid: Float32Array,
  N: number,
  threshold?: number,
): { cx: number; cy: number } | null {
  // Use a very low threshold so we include the whole limb; avoid intensity bias.
  let maxVal = 0;
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    if (v > maxVal) maxVal = v;
  }
  const thr = threshold ?? Math.max(maxVal * 0.001, 1e-6);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let y = 0; y < N; y++) {
    const row = y * N;
    for (let x = 0; x < N; x++) {
      if (grid[row + x] > thr) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }

  if (count < 50 || minX === Infinity) return null;
  return { cx: sumX / count, cy: sumY / count };
}

function recenterDiskGrid(grid: Float32Array, N: number, threshold?: number): Float32Array {
  const center = estimateDiskCenterFromGrid(grid, N, threshold);
  if (!center) return grid;
  const targetCx = (N - 1) / 2;
  const targetCy = (N - 1) / 2;
  const dx = targetCx - center.cx;
  const dy = targetCy - center.cy;
  if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return grid;

  const out = new Float32Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const idx = y * N + x;
      const srcX = x - dx;
      const srcY = y - dy;
      out[idx] = bilinearSampleFloat32(grid, N, N, srcX, srcY);
    }
  }

  // Re-apply circular mask to keep limb clean after shift.
  const half = N / 2;
  for (let y = 0; y < N; y++) {
    const v = (half - (y + 0.5)) / half;
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5 - half) / half;
      if (u * u + v * v > 1) {
        out[y * N + x] = 0;
      }
    }
  }

  return out;
}

function applyDifferentialDerotation(frames: FrameSample[]): void {
  if (!frames.length) return;
  const meta = buildCoRotGridMeta(frames[0].gridSize);
  const t0 = frames[0].t;
  for (const frame of frames) {
    const dtSec = (frame.t - t0) / 1000;
    const rawCorot = dtSec ? derotateFrameToReferenceGrid(frame.sunMap, meta, dtSec) : frame.sunMap;
    frame.sunMapCorot = rawCorot; // keep co-rot map anchored to canonical geometry; no intensity recentering
    frame.rotationShiftPx = 0;
  }
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

async function getFrameCount(buffer: Buffer): Promise<number> {
  const meta = await sharp(buffer, { animated: true }).metadata();
  return meta.pages && meta.pages > 0 ? meta.pages : 1;
}

async function calibrateFrameTiming(
  buffer: Buffer,
  frameCount: number,
  mime: string,
  timeoutMs?: number,
): Promise<number[]> {
  if (frameCount < 2) throw new Error("Need at least two frames for timing calibration");
  const samples = [0, frameCount - 1];
  const timestamps: Array<{ frameIndex: number; tMs: number }> = [];

  for (const idx of samples) {
    const cropped = await extractClockStrip(buffer, idx);
    // cropped strip is forced to PNG; pass the correct mime to the vision OCR
    const iso = await readUtcClockFromFramePng(cropped, "image/png", timeoutMs);
    const tMs = Date.parse(iso);
    if (!Number.isFinite(tMs)) {
      throw new Error(`Invalid UTC clock parse for frame ${idx}: ${iso}`);
    }
    timestamps.push({ frameIndex: idx, tMs });
  }

  const first = timestamps[0];
  const last = timestamps[timestamps.length - 1];
  const dtTotal = last.tMs - first.tMs;
  const steps = last.frameIndex - first.frameIndex;
  if (steps <= 0 || !Number.isFinite(dtTotal) || dtTotal <= 0) {
    throw new Error("Bad timing calibration (non-positive dt)");
  }
  const dt = dtTotal / steps;
  const tMs: number[] = new Array(frameCount);
  for (let i = 0; i < frameCount; i++) {
    tMs[i] = first.tMs + (i - first.frameIndex) * dt;
  }
  return tMs;
}

async function extractClockStrip(buffer: Buffer, frameIndex: number): Promise<Buffer> {
  const img = sharp(buffer, { animated: true, page: frameIndex, limitInputPixels: INPUT_PIXEL_LIMIT });
  const meta = await img.metadata();
  const width = Math.max(1, meta.width ?? (meta as any)?.pageWidth ?? 0);
  const height = Math.max(1, meta.pageHeight ?? meta.height ?? 0);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Missing frame dimensions for clock strip");
  }
  const stripHeight = Math.max(8, Math.min(height, Math.floor(height * 0.15)));
  const top = Math.max(0, height - stripHeight);
  const targetWidth = Math.min(width, 4096); // avoid very wide clock crops blowing up memory
  const targetHeight = Math.max(1, Math.floor(stripHeight * (targetWidth / width)));
  return img
    .extract({ left: 0, top, width, height: stripHeight })
    .resize(targetWidth, targetHeight, { fit: "fill", fastShrinkOnLoad: true })
    .greyscale()
    .png()
    .toBuffer();
}

async function readUtcClockFromFramePng(png: Buffer, mime: string, timeoutMs?: number): Promise<string> {
  const vision = getVisionProvider();
  const prompt = [
    "You see a solar EUV full-disk frame (GOES/SUVI 195 A.).",
    "At the bottom there is a UTC timestamp like: Sun, 30 Nov 2025 16:09:34 UTC GOES-19 SUVI 195 Angstroms.",
    "Return ONLY an ISO UTC string, e.g. 2025-11-30T16:09:34Z.",
    "If unsure, give your best guess in that exact format. No extra text.",
  ].join(" ");
  const iso = await withTimeout(
    vision.describeImage(png.toString("base64"), mime || "image/png", prompt),
    timeoutMs ?? CLOCK_OCR_TIMEOUT_MS,
    "vision clock OCR",
  );
  if (!iso) throw new Error("Vision provider returned empty clock string");
  return iso.trim();
}
