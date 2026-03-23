import { Router } from "express";
import sharp from "sharp";
import type {
  HullMisRenderAttachmentV1,
  HullMisRenderRequestV1,
  HullMisRenderResponseV1,
} from "@shared/hull-render-contract";

const router = Router();

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

const toFiniteNumber = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const toInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Math.round(toFiniteNumber(value, fallback));
  return clamp(n, min, max);
};

const readEnvText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length ? text : null;
};

const readRenderBackendMode = (): "auto" | "optix" | "unity" => {
  const value = readEnvText(
    process.env.MIS_RENDER_BACKEND ?? process.env.MIS_RENDER_SERVICE_BACKEND,
  );
  if (value === "optix" || value === "unity") return value;
  return "auto";
};

const normalizeServiceEndpointUrl = (
  value: string | null,
  kind: "frame" | "status",
): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/\/api\/helix\/hull-render\/frame\/?$/i.test(trimmed)) {
    return kind === "frame"
      ? trimmed
      : trimmed.replace(/\/frame\/?$/i, "/status");
  }
  if (/\/api\/helix\/hull-render\/status\/?$/i.test(trimmed)) {
    return kind === "status"
      ? trimmed
      : trimmed.replace(/\/status\/?$/i, "/frame");
  }
  if (/\/api\/helix\/hull-render\//i.test(trimmed)) {
    return trimmed.replace(
      /\/(frame|status)\/?$/i,
      `/${kind}`,
    );
  }
  return `${trimmed.replace(/\/+$/, "")}/api/helix/hull-render/${kind}`;
};

const resolveServiceEndpoint = (
  backend: "optix" | "unity" | "generic",
  kind: "frame" | "status",
): string | null => {
  const prefix =
    backend === "optix"
      ? "OPTIX"
      : backend === "unity"
        ? "UNITY"
        : "MIS";

  const explicitSpecific =
    kind === "frame"
      ? readEnvText(process.env[`${prefix}_RENDER_SERVICE_FRAME_URL`])
      : readEnvText(process.env[`${prefix}_RENDER_SERVICE_STATUS_URL`]);
  if (explicitSpecific) return normalizeServiceEndpointUrl(explicitSpecific, kind);

  const base = readEnvText(process.env[`${prefix}_RENDER_SERVICE_URL`]);
  return normalizeServiceEndpointUrl(base, kind);
};

const normalizeServiceFrameEndpoint = (): string | null => {
  const backendMode = readRenderBackendMode();
  const orderedBackends: Array<"optix" | "unity" | "generic"> =
    backendMode === "optix"
      ? ["optix", "generic"]
      : backendMode === "unity"
        ? ["unity", "generic"]
        : ["generic", "optix", "unity"];

  for (const backend of orderedBackends) {
    const endpoint = resolveServiceEndpoint(backend, "frame");
    if (endpoint) return endpoint;
  }
  return null;
};

const normalizeServiceStatusEndpoint = (): string | null => {
  const backendMode = readRenderBackendMode();
  const orderedBackends: Array<"optix" | "unity" | "generic"> =
    backendMode === "optix"
      ? ["optix", "generic"]
      : backendMode === "unity"
        ? ["unity", "generic"]
        : ["generic", "optix", "unity"];

  for (const backend of orderedBackends) {
    const endpoint = resolveServiceEndpoint(backend, "status");
    if (endpoint) return endpoint;
  }
  const frame = normalizeServiceFrameEndpoint();
  if (!frame) return null;
  return frame.replace(
    /\/api\/helix\/hull-render\/frame\/?$/i,
    "/api/helix/hull-render/status",
  );
};

const readRequiredProvenanceSourcePrefix = (): string | null =>
  readEnvText(process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX)?.toLowerCase() ??
  null;

const DEFAULT_MIS_SERVICE_FRAME_URL =
  "http://127.0.0.1:6061/api/helix/hull-render/frame";
const DEFAULT_MIS_SERVICE_STATUS_URL =
  "http://127.0.0.1:6061/api/helix/hull-render/status";

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

const encodePngDataUrl = (png: Buffer) =>
  `data:image/png;base64,${png.toString("base64")}`;

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
        metric.updatedAt == null ? null : toFiniteNumber(metric.updatedAt, Date.now()),
    },
  };
};

const drawDeterministicLocalFrame = async (
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
    consistency === "ok" ? 1 : consistency === "warn" ? 0.75 : 0.52;
  const nullPenalty = clamp(1 / (1 + 30 * nullResidual), 0.2, 1);
  const spreadBoost = clamp(0.7 + spread * 0.6, 0.5, 1.8);

  for (let y = 0; y < height; y += 1) {
    const v = height > 1 ? y / (height - 1) : 0;
    const ny = v * 2 - 1;
    for (let x = 0; x < width; x += 1) {
      const u = width > 1 ? x / (width - 1) : 0;
      const nx = u * 2 - 1;
      const r = Math.sqrt(nx * nx + ny * ny);
      const theta = Math.atan2(ny, nx);

      const bubbleCenter = 0.34 + 0.07 * Math.tanh(beta);
      const shell = Math.exp(
        -Math.pow(r - bubbleCenter, 2) * (7 + sigma * 1.8),
      );
      const tube = Math.exp(
        -Math.pow(nx * nx / Math.max(radius * radius, 0.2) + ny * ny / 0.6, 1.15),
      );
      const swirl =
        0.5 +
        0.5 *
          Math.sin(
            12 * theta + 9 * r + seededPhase + 0.8 * beta - 0.3 * alpha,
          );
      const causal =
        0.5 +
        0.5 *
          Math.cos(
            22 * nx - 8 * ny + seededPhase * 0.7 + spreadBoost * 1.1,
          );

      const brightness =
        clamp((0.18 + 0.74 * shell + 0.42 * tube) * consistencyFactor, 0, 1) *
        nullPenalty;

      const red = toByte(255 * clamp(brightness * (0.44 + 0.62 * swirl), 0, 1));
      const green = toByte(
        255 * clamp(brightness * (0.22 + 0.7 * causal), 0, 1),
      );
      const blue = toByte(
        255 * clamp(brightness * (0.5 + 0.48 * (1 - swirl)), 0, 1),
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

const isValidResponse = (value: unknown): value is HullMisRenderResponseV1 => {
  if (!isRecord(value)) return false;
  if (value.version !== 1) return false;
  if (value.ok !== true && value.ok !== false) return false;
  if (typeof value.imageDataUrl !== "string" || !value.imageDataUrl.length) return false;
  if (value.imageMime !== "image/png") return false;
  if (value.attachments != null) {
    if (!Array.isArray(value.attachments)) return false;
    const attachments = value.attachments as unknown[];
    const ok = attachments.every((entry) => {
      if (!isRecord(entry)) return false;
      if (entry.kind !== "depth-linear-m-f32le" && entry.kind !== "shell-mask-u8") return false;
      if (entry.encoding !== "base64") return false;
      if (typeof entry.dataBase64 !== "string" || !entry.dataBase64.length) return false;
      if (typeof entry.width !== "number" || typeof entry.height !== "number") return false;
      return true;
    });
    if (!ok) return false;
  }
  return true;
};

const proxyRemoteFrame = async (
  endpoint: string,
  payload: HullMisRenderRequestV1,
): Promise<HullMisRenderResponseV1> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = (await response.text()) || response.statusText;
      throw new Error(`remote_mis_http_${response.status}: ${text}`);
    }
    const json = (await response.json()) as unknown;
    if (!isValidResponse(json)) {
      throw new Error("remote_mis_invalid_shape");
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
};

type RemoteServiceStatus = {
  reachable: boolean;
  endpoint: string | null;
  kind: string | null;
  readyForUnity: boolean;
  readyForOptix: boolean;
  readyForScientificLane: boolean;
  allowSynthetic: boolean;
  error: string | null;
};

const fetchRemoteServiceStatus = async (
  endpoint: string,
): Promise<RemoteServiceStatus> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        reachable: false,
        endpoint,
        kind: null,
        readyForUnity: false,
        readyForOptix: false,
        readyForScientificLane: false,
        allowSynthetic: false,
        error: `remote_status_http_${response.status}`,
      };
    }
    const body = (await response.json()) as unknown;
    const root = isRecord(body) ? body : {};
    const runtime = isRecord(root.runtime) ? root.runtime : {};
    const readyForUnity = runtime.readyForUnity === true;
    const readyForOptix = runtime.readyForOptix === true;
    const readyForScientificLane =
      runtime.readyForScientificLane === true || readyForUnity || readyForOptix;
    return {
      reachable: true,
      endpoint,
      kind: typeof root.kind === "string" ? root.kind : null,
      readyForUnity,
      readyForOptix,
      readyForScientificLane,
      allowSynthetic: runtime.allowSynthetic === true,
      error: null,
    };
  } catch (error) {
    return {
      reachable: false,
      endpoint,
      kind: null,
      readyForUnity: false,
      readyForOptix: false,
      readyForScientificLane: false,
      allowSynthetic: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
};

const isScientificRemoteFrame = (frame: HullMisRenderResponseV1): boolean => {
  if (frame.backend !== "proxy") return false;
  const note = String(frame.diagnostics?.note ?? "").toLowerCase();
  const provenance = String(frame.provenance?.source ?? "").toLowerCase();
  if (note.includes("synthetic") || note.includes("fallback")) return false;
  if (provenance.includes("synthetic")) return false;
  return true;
};

const hasRequiredProvenancePrefix = (
  frame: HullMisRenderResponseV1,
  requiredPrefix: string | null,
): boolean => {
  if (!requiredPrefix) return true;
  const source = String(frame.provenance?.source ?? "").toLowerCase();
  return source.startsWith(requiredPrefix);
};

const hasIntegralSignalAttachments = (frame: HullMisRenderResponseV1): boolean => {
  if (!Array.isArray(frame.attachments) || frame.attachments.length === 0) return false;
  const hasDepth = frame.attachments.some(
    (entry) => entry.kind === "depth-linear-m-f32le" && entry.encoding === "base64",
  );
  const hasMask = frame.attachments.some(
    (entry) => entry.kind === "shell-mask-u8" && entry.encoding === "base64",
  );
  return hasDepth && hasMask;
};

const buildLocalIntegralAttachments = (
  payload: HullMisRenderRequestV1,
): HullMisRenderAttachmentV1[] => {
  const width = Math.max(1, payload.width | 0);
  const height = Math.max(1, payload.height | 0);
  const total = width * height;
  const depth = new Float32Array(total);
  const mask = new Uint8Array(total);
  const beta = toFiniteNumber(payload.solve?.beta, 0);
  const sigma = Math.max(1e-3, toFiniteNumber(payload.solve?.sigma, 6));
  const radius = Math.max(1e-3, toFiniteNumber(payload.solve?.R, 1));
  const shellCenter = 0.34 + 0.07 * Math.tanh(beta);
  const shellThickness = Math.max(0.012, 0.06 / Math.sqrt(1 + sigma));
  for (let y = 0; y < height; y += 1) {
    const ny = height > 1 ? (y / (height - 1)) * 2 - 1 : 0;
    for (let x = 0; x < width; x += 1) {
      const nx = width > 1 ? (x / (width - 1)) * 2 - 1 : 0;
      const r = Math.hypot(nx / Math.max(radius, 0.25), ny);
      const shellDelta = Math.abs(r - shellCenter);
      const shell = Math.exp(-Math.pow(r - shellCenter, 2) * (7 + sigma * 1.8));
      const idx = y * width + x;
      const depthValue = 8 + 6 * shell + 1.25 * shellDelta;
      depth[idx] = Number.isFinite(depthValue) ? depthValue : 8;
      mask[idx] = shellDelta <= shellThickness ? 255 : 0;
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

const buildLocalResponse = async (
  payload: HullMisRenderRequestV1,
  renderStartedAt: number,
  note: string,
): Promise<HullMisRenderResponseV1> => {
  const deterministicSeed = hashSeed(payload);
  const png = await drawDeterministicLocalFrame(payload, deterministicSeed);
  return {
    version: 1,
    ok: true,
    backend: "local-deterministic",
    imageMime: "image/png",
    imageDataUrl: encodePngDataUrl(png),
    width: payload.width,
    height: payload.height,
    deterministicSeed,
    renderMs: Date.now() - renderStartedAt,
    diagnostics: {
      note,
      geodesicMode: payload.geodesicDiagnostics?.mode ?? null,
      consistency: payload.geodesicDiagnostics?.consistency ?? "unknown",
      maxNullResidual: payload.geodesicDiagnostics?.maxNullResidual ?? null,
      stepConvergence: payload.geodesicDiagnostics?.stepConvergence ?? null,
      bundleSpread: payload.geodesicDiagnostics?.bundleSpread ?? null,
    },
    attachments: buildLocalIntegralAttachments(payload),
    provenance: {
      source: "casimirbot.local.deterministic",
      serviceUrl: null,
      timestampMs: Date.now(),
    },
  };
};

router.get("/status", async (_req, res) => {
  const backendMode = readRenderBackendMode();
  const endpoint = normalizeServiceFrameEndpoint();
  const statusEndpoint = normalizeServiceStatusEndpoint();
  const strictProxy = process.env.MIS_RENDER_PROXY_STRICT === "1";
  const requireIntegralSignal = process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL !== "0";
  const requiredProvenanceSourcePrefix = readRequiredProvenanceSourcePrefix();
  const remoteStatus = statusEndpoint
    ? await fetchRemoteServiceStatus(statusEndpoint)
    : {
        reachable: false,
        endpoint: null,
        kind: null,
        readyForUnity: false,
        readyForOptix: false,
        readyForScientificLane: false,
        allowSynthetic: false,
        error: "remote_status_not_configured",
      };
  const remoteConfigured = !!endpoint;
  const scientificLaneReady =
    remoteConfigured &&
    strictProxy &&
    remoteStatus.reachable &&
    remoteStatus.readyForScientificLane &&
    !remoteStatus.allowSynthetic;
  res.json({
    kind: "hull-render-status",
    backendHint: "mis-path-tracing",
    backendMode,
    remoteConfigured,
    remoteEndpoint: endpoint,
    remoteStatusEndpoint: statusEndpoint,
    strictProxy,
    requireIntegralSignal,
    requiredProvenanceSourcePrefix,
    scientificLaneReady,
    fallbackLaneActive: !scientificLaneReady,
    remoteStatus,
    recommendedService:
      backendMode === "optix"
        ? "OptiX + CUDA render service"
        : backendMode === "unity"
          ? "RayTracingMIS Unity batch service"
          : "RayTracingMIS Unity batch service",
    recommendedFrameEndpoint: DEFAULT_MIS_SERVICE_FRAME_URL,
    recommendedStatusEndpoint: DEFAULT_MIS_SERVICE_STATUS_URL,
    timestampMs: Date.now(),
  });
});

router.post("/frame", async (req, res) => {
  const renderStartedAt = Date.now();
  const payload = parseRequest(req.body);
  const endpoint = normalizeServiceFrameEndpoint();
  const backendMode = readRenderBackendMode();
  const strictProxy = process.env.MIS_RENDER_PROXY_STRICT === "1";
  const requireIntegralSignalByEnv = process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL !== "0";
  const requiredProvenanceSourcePrefix = readRequiredProvenanceSourcePrefix();

  if (endpoint) {
    try {
      const remote = await proxyRemoteFrame(endpoint, payload);
      if (strictProxy && !isScientificRemoteFrame(remote)) {
        throw new Error("remote_mis_non_scientific_response");
      }
      if (
        strictProxy &&
        !hasRequiredProvenancePrefix(remote, requiredProvenanceSourcePrefix)
      ) {
        throw new Error("remote_mis_provenance_source_prefix_mismatch");
      }
      const requireIntegralSignal =
        payload.scienceLane?.requireIntegralSignal === true ||
        (strictProxy && requireIntegralSignalByEnv);
      if (requireIntegralSignal && !hasIntegralSignalAttachments(remote)) {
        throw new Error("remote_mis_missing_integral_signal_attachments");
      }
      const deterministicSeed = hashSeed(payload);
      const response: HullMisRenderResponseV1 = {
        ...remote,
        version: 1,
        width: payload.width,
        height: payload.height,
        deterministicSeed,
        renderMs:
          Number.isFinite(remote.renderMs) && remote.renderMs > 0
            ? remote.renderMs
            : Date.now() - renderStartedAt,
        provenance: {
          source:
            typeof remote.provenance?.source === "string" &&
            remote.provenance.source.trim().length
              ? remote.provenance.source
              : backendMode === "optix"
                ? "optix/cuda.scaffold"
                : backendMode === "unity"
                  ? "raytracingmis.unity.batch"
                  : "casimirbot.remote.mis.proxy",
          serviceUrl: endpoint,
          timestampMs: Date.now(),
        },
      };
      return res.json(response);
    } catch (error) {
      if (strictProxy) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(502).json({
          error: "mis_proxy_failed",
          message,
          endpoint,
        });
      }
      const fallback = await buildLocalResponse(
        payload,
        renderStartedAt,
        "remote_proxy_failed_fallback_local_teaching_only",
      );
      return res.json(fallback);
    }
  }

  const fallback = await buildLocalResponse(
    payload,
    renderStartedAt,
    "remote_not_configured_fallback_local_teaching_only",
  );
  return res.json(fallback);
});

export const hullRenderRouter = router;
export default router;
