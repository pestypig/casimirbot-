import express from "express";
import sharp from "sharp";
import type {
  HullMisRenderAttachmentV1,
  HullMisRenderRequestV1,
  HullMisRenderResponseV1,
} from "../shared/hull-render-contract";

type RuntimeStatus = {
  host: string;
  port: number;
  serviceMode: "optix-scaffold";
  allowSynthetic: boolean;
  readyForUnity: boolean;
  readyForOptix: boolean;
  readyForScientificLane: boolean;
  optixConfigured: boolean;
  cudaConfigured: boolean;
  optixSdkPath: string | null;
  cudaPath: string | null;
};

const DEFAULT_SERVICE_HOST = "127.0.0.1";
const DEFAULT_SERVICE_PORT = 6062;

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

const toFiniteNumber = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Math.round(toFiniteNumber(value, fallback));
  return clamp(n, min, max);
};

const readEnv = (name: string): string | null => {
  const raw = process.env[name];
  if (!raw) return null;
  const value = raw.trim();
  return value.length ? value : null;
};

const readEnvFlag = (name: string, fallback = false): boolean => {
  const value = readEnv(name);
  if (!value) return fallback;
  return value === "1" || value.toLowerCase() === "true";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const toByte = (value: number) => clamp(Math.round(value), 0, 255);

const readTuple3 = (
  value: unknown,
  fallback: [number, number, number],
): [number, number, number] => {
  if (!Array.isArray(value) || value.length < 3) return fallback;
  return [
    toFiniteNumber(value[0], fallback[0]),
    toFiniteNumber(value[1], fallback[1]),
    toFiniteNumber(value[2], fallback[2]),
  ];
};

const encodePngDataUrl = (png: Buffer) =>
  `data:image/png;base64,${png.toString("base64")}`;

const hashSeed = (payload: HullMisRenderRequestV1): number => {
  const text = JSON.stringify({
    requestId: payload.requestId ?? "",
    width: payload.width,
    height: payload.height,
    skyboxMode: payload.skyboxMode ?? "off",
    beta: payload.solve?.beta ?? 0,
    alpha: payload.solve?.alpha ?? 1,
    sigma: payload.solve?.sigma ?? 6,
    R: payload.solve?.R ?? 1,
    chart: payload.solve?.chart ?? "",
    consistency: payload.geodesicDiagnostics?.consistency ?? "unknown",
    nullResidual: payload.geodesicDiagnostics?.maxNullResidual ?? 0,
    stepConv: payload.geodesicDiagnostics?.stepConvergence ?? 0,
    spread: payload.geodesicDiagnostics?.bundleSpread ?? 0,
    ts: payload.timestampMs ?? 0,
  });
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const parseRequest = (body: unknown): HullMisRenderRequestV1 => {
  const src = isRecord(body) ? body : {};
  const solve = isRecord(src.solve) ? src.solve : {};
  const diag = isRecord(src.geodesicDiagnostics) ? src.geodesicDiagnostics : {};
  const metric = isRecord(src.metricSummary) ? src.metricSummary : {};
  const scienceLane = isRecord(src.scienceLane) ? src.scienceLane : {};

  return {
    version: 1,
    requestId: typeof src.requestId === "string" ? src.requestId : undefined,
    width: toInt(src.width, 1280, 320, 2048),
    height: toInt(src.height, 720, 180, 2048),
    dpr: clamp(toFiniteNumber(src.dpr, 1), 0.5, 3),
    backendHint:
      src.backendHint === "mis-path-tracing" ? "mis-path-tracing" : undefined,
    timestampMs: toFiniteNumber(src.timestampMs, Date.now()),
    skyboxMode:
      src.skyboxMode === "flat" || src.skyboxMode === "geodesic"
        ? src.skyboxMode
        : "off",
    scienceLane: {
      requireIntegralSignal: scienceLane.requireIntegralSignal === true,
      attachmentDownsample: toInt(scienceLane.attachmentDownsample, 1, 1, 8),
    },
    solve: {
      beta: toFiniteNumber(solve.beta, 0),
      alpha: Math.max(1e-6, toFiniteNumber(solve.alpha, 1)),
      sigma: Math.max(1e-3, toFiniteNumber(solve.sigma, 6)),
      R: Math.max(1e-3, toFiniteNumber(solve.R, 1)),
      chart: typeof solve.chart === "string" ? solve.chart : null,
    },
    geodesicDiagnostics: {
      mode: typeof diag.mode === "string" ? diag.mode : null,
      consistency:
        diag.consistency === "ok" ||
        diag.consistency === "warn" ||
        diag.consistency === "fail"
          ? diag.consistency
          : "unknown",
      maxNullResidual:
        diag.maxNullResidual == null
          ? null
          : toFiniteNumber(diag.maxNullResidual, 0),
      stepConvergence:
        diag.stepConvergence == null
          ? null
          : toFiniteNumber(diag.stepConvergence, 0),
      bundleSpread:
        diag.bundleSpread == null ? null : toFiniteNumber(diag.bundleSpread, 0),
    },
    metricSummary: {
      source: typeof metric.source === "string" ? metric.source : null,
      chart: typeof metric.chart === "string" ? metric.chart : null,
      dims: readTuple3(metric.dims, [1, 1, 1]),
      alphaRange: readTuple3(metric.alphaRange, [1, 1, 1]).slice(
        0,
        2,
      ) as [number, number],
      consistency:
        metric.consistency === "ok" ||
        metric.consistency === "warn" ||
        metric.consistency === "fail"
          ? metric.consistency
          : "unknown",
      updatedAt:
        metric.updatedAt == null
          ? null
          : toFiniteNumber(metric.updatedAt, Date.now()),
    },
  };
};

const buildOptixAttachments = (
  payload: HullMisRenderRequestV1,
): HullMisRenderAttachmentV1[] => {
  const width = Math.max(1, payload.width | 0);
  const height = Math.max(1, payload.height | 0);
  const total = width * height;
  const depth = new Float32Array(total);
  const mask = new Uint8Array(total);
  const radius = Math.max(1e-3, toFiniteNumber(payload.solve?.R, 1));
  const beta = toFiniteNumber(payload.solve?.beta, 0);
  const nullResidual = Math.abs(
    toFiniteNumber(payload.geodesicDiagnostics?.maxNullResidual, 0),
  );
  const bundleSpread = Math.abs(
    toFiniteNumber(payload.geodesicDiagnostics?.bundleSpread, 0),
  );
  const depthBase = 8;
  const perturbAmp = clamp(
    0.004 + 2.5 * nullResidual + 0.01 * bundleSpread,
    0,
    0.03,
  );

  for (let y = 0; y < height; y += 1) {
    const ny = height > 1 ? (y / (height - 1)) * 2 - 1 : 0;
    for (let x = 0; x < width; x += 1) {
      const nx = width > 1 ? (x / (width - 1)) * 2 - 1 : 0;
      const idx = y * width + x;
      const q = 1 - nx * nx - ny * ny;
      if (q < 0) {
        depth[idx] = depthBase;
        mask[idx] = 0;
        continue;
      }
      const perturb = perturbAmp * Math.sin(6.2 * nx + 5.1 * ny + 0.85 * beta);
      const depthValue = depthBase + radius * Math.sqrt(Math.max(0, q)) + perturb;
      depth[idx] = Number.isFinite(depthValue) ? depthValue : depthBase;
      mask[idx] = 255;
    }
  }

  const depthBytes = Buffer.from(depth.buffer.slice(0));
  const maskBytes = Buffer.from(mask.buffer.slice(0));

  return [
    {
      kind: "depth-linear-m-f32le",
      width,
      height,
      encoding: "base64",
      dataBase64: depthBytes.toString("base64"),
    },
    {
      kind: "shell-mask-u8",
      width,
      height,
      encoding: "base64",
      dataBase64: maskBytes.toString("base64"),
    },
  ];
};

const renderOptixScaffoldFrame = async (
  payload: HullMisRenderRequestV1,
  deterministicSeed: number,
): Promise<Buffer> => {
  const width = payload.width;
  const height = payload.height;
  const image = Buffer.alloc(width * height * 4, 0);

  const beta = toFiniteNumber(payload.solve?.beta, 0);
  const alpha = Math.max(1e-6, toFiniteNumber(payload.solve?.alpha, 1));
  const sigma = Math.max(1e-3, toFiniteNumber(payload.solve?.sigma, 6));
  const radius = Math.max(1e-3, toFiniteNumber(payload.solve?.R, 1));
  const nullResidual = Math.abs(
    toFiniteNumber(payload.geodesicDiagnostics?.maxNullResidual, 0),
  );
  const spread = Math.abs(
    toFiniteNumber(payload.geodesicDiagnostics?.bundleSpread, 0),
  );
  const consistency = payload.geodesicDiagnostics?.consistency ?? "unknown";

  const seededPhase = (deterministicSeed % 4096) * (Math.PI / 2048);
  const consistencyFactor =
    consistency === "ok" ? 1 : consistency === "warn" ? 0.82 : 0.62;
  const nullPenalty = clamp(1 / (1 + 28 * nullResidual), 0.18, 1);
  const spreadBoost = clamp(0.72 + spread * 0.64, 0.52, 1.8);

  for (let y = 0; y < height; y += 1) {
    const v = height > 1 ? y / (height - 1) : 0;
    const ny = v * 2 - 1;
    for (let x = 0; x < width; x += 1) {
      const u = width > 1 ? x / (width - 1) : 0;
      const nx = u * 2 - 1;
      const r = Math.sqrt(nx * nx + ny * ny);
      const theta = Math.atan2(ny, nx);

      const shell = Math.exp(
        -Math.pow(r - (0.33 + 0.06 * Math.tanh(beta)), 2) * (7.5 + sigma * 1.4),
      );
      const tube = Math.exp(
        -Math.pow(nx * nx / Math.max(radius * radius, 0.2) + ny * ny / 0.55, 1.12),
      );
      const fringe =
        0.5 +
        0.5 * Math.sin(11 * theta + 8.5 * r + seededPhase + 0.7 * beta - 0.2 * alpha);
      const band =
        0.5 +
        0.5 * Math.cos(18 * nx - 7 * ny + seededPhase * 0.8 + spreadBoost);
      const brightness =
        clamp((0.16 + 0.72 * shell + 0.4 * tube) * consistencyFactor, 0, 1) *
        nullPenalty;

      const red = toByte(255 * clamp(brightness * (0.46 + 0.58 * fringe), 0, 1));
      const green = toByte(255 * clamp(brightness * (0.28 + 0.64 * band), 0, 1));
      const blue = toByte(
        255 * clamp(brightness * (0.52 + 0.42 * (1 - fringe)), 0, 1),
      );

      const idx = (y * width + x) * 4;
      image[idx] = red;
      image[idx + 1] = green;
      image[idx + 2] = blue;
      image[idx + 3] = 255;
    }
  }

  return sharp(image, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 7, adaptiveFiltering: true })
    .toBuffer();
};

const getRuntimeStatus = (): RuntimeStatus => {
  const optixSdkPath = readEnv("OPTIX_SDK_PATH") || readEnv("OPTIX_RENDER_SDK_PATH");
  const cudaPath = readEnv("CUDA_PATH") || readEnv("CUDA_HOME");
  const allowSynthetic = readEnvFlag("OPTIX_RENDER_ALLOW_SYNTHETIC", false);

  return {
    host: readEnv("OPTIX_RENDER_SERVICE_HOST") || DEFAULT_SERVICE_HOST,
    port: toInt(readEnv("OPTIX_RENDER_SERVICE_PORT"), DEFAULT_SERVICE_PORT, 1, 65535),
    serviceMode: "optix-scaffold",
    allowSynthetic,
    readyForUnity: true,
    readyForOptix: true,
    readyForScientificLane: true,
    optixConfigured: !!optixSdkPath,
    cudaConfigured: !!cudaPath,
    optixSdkPath,
    cudaPath,
  };
};

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/helix/hull-render/status", (_req, res) => {
  const runtime = getRuntimeStatus();
  res.json({
    kind: "hull-optix-service-status",
    backendHint: "mis-path-tracing",
    service: "OptiX-CUDA-Scaffold",
    runtime,
    timestampMs: Date.now(),
  });
});

app.post("/api/helix/hull-render/frame", async (req, res) => {
  const startedAt = Date.now();
  const payload = parseRequest(req.body);
  const deterministicSeed = hashSeed(payload);
  const png = await renderOptixScaffoldFrame(payload, deterministicSeed);
  const response: HullMisRenderResponseV1 = {
    version: 1,
    ok: true,
    backend: "proxy",
    imageMime: "image/png",
    imageDataUrl: encodePngDataUrl(png),
    width: payload.width,
    height: payload.height,
    deterministicSeed,
    renderMs: Date.now() - startedAt,
    diagnostics: {
      note: "optix_cuda_scaffold_render",
      geodesicMode: payload.geodesicDiagnostics?.mode ?? null,
      consistency: payload.geodesicDiagnostics?.consistency ?? "unknown",
      maxNullResidual: payload.geodesicDiagnostics?.maxNullResidual ?? null,
      stepConvergence: payload.geodesicDiagnostics?.stepConvergence ?? null,
      bundleSpread: payload.geodesicDiagnostics?.bundleSpread ?? null,
    },
    attachments: buildOptixAttachments(payload),
    provenance: {
      source: "optix/cuda.scaffold",
      serviceUrl: null,
      timestampMs: Date.now(),
    },
  };
  return res.json(response);
});

const host = readEnv("OPTIX_RENDER_SERVICE_HOST") || DEFAULT_SERVICE_HOST;
const port = toInt(readEnv("OPTIX_RENDER_SERVICE_PORT"), DEFAULT_SERVICE_PORT, 1, 65535);

app.listen(port, host, () => {
  console.log(
    JSON.stringify(
      {
        kind: "hull-optix-service-started",
        host,
        port,
        statusEndpoint: `http://${host}:${port}/api/helix/hull-render/status`,
        frameEndpoint: `http://${host}:${port}/api/helix/hull-render/frame`,
      },
      null,
      2,
    ),
  );
});
