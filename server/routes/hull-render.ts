import { spawn, type ChildProcess } from "node:child_process";
import { Router, type Request } from "express";
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

const DEFAULT_OPTIX_SERVICE_FRAME_URL =
  "http://127.0.0.1:6062/api/helix/hull-render/frame";
const DEFAULT_OPTIX_SERVICE_STATUS_URL =
  "http://127.0.0.1:6062/api/helix/hull-render/status";
const DEFAULT_UNITY_SERVICE_FRAME_URL =
  "http://127.0.0.1:6061/api/helix/hull-render/frame";
const DEFAULT_UNITY_SERVICE_STATUS_URL =
  "http://127.0.0.1:6061/api/helix/hull-render/status";
const AUTO_START_OPTIX_COOLDOWN_MS = 3_000;
const AUTO_START_OPTIX_WAIT_INTERVAL_MS = 250;

const readRenderBackendMode = (): "auto" | "optix" | "unity" => {
  const value = readEnvText(
    process.env.MIS_RENDER_BACKEND ?? process.env.MIS_RENDER_SERVICE_BACKEND,
  );
  if (value === "auto" || value === "optix" || value === "unity") return value;
  // Default to OptiX-first scientific lane.
  return "optix";
};

type RemoteBackendKey = "optix" | "unity" | "generic";

type RemoteEndpointCandidate = {
  backend: RemoteBackendKey;
  frameEndpoint: string;
  statusEndpoint: string | null;
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
  if (base) return normalizeServiceEndpointUrl(base, kind);

  // Compatibility bridge: allow MIS_* endpoint vars to drive canonical backends
  // when backend-specific vars are not set.
  if (backend !== "generic") {
    const genericSpecific =
      kind === "frame"
        ? readEnvText(process.env.MIS_RENDER_SERVICE_FRAME_URL)
        : readEnvText(process.env.MIS_RENDER_SERVICE_STATUS_URL);
    if (genericSpecific) {
      return normalizeServiceEndpointUrl(genericSpecific, kind);
    }
    const genericBase = readEnvText(process.env.MIS_RENDER_SERVICE_URL);
    if (genericBase) return normalizeServiceEndpointUrl(genericBase, kind);
  }

  // Scientific lane default endpoints (optix/unity) unless explicitly disabled.
  if (process.env.MIS_RENDER_DISABLE_DEFAULT_ENDPOINT !== "1") {
    if (backend === "optix") {
      return kind === "frame"
        ? DEFAULT_OPTIX_SERVICE_FRAME_URL
        : DEFAULT_OPTIX_SERVICE_STATUS_URL;
    }
    if (backend === "unity") {
      return kind === "frame"
        ? DEFAULT_UNITY_SERVICE_FRAME_URL
        : DEFAULT_UNITY_SERVICE_STATUS_URL;
    }
  }

  return null;
};

const statusEndpointFromFrameEndpoint = (frameEndpoint: string): string =>
  frameEndpoint.replace(
    /\/api\/helix\/hull-render\/frame\/?$/i,
    "/api/helix/hull-render/status",
  );

const readEndpointBackendOrder = (
  backendMode: "auto" | "optix" | "unity",
): RemoteBackendKey[] => {
  if (backendMode === "optix") return ["optix", "generic"];
  if (backendMode === "unity") return ["unity", "generic"];
  // Prefer canonical scientific lanes before legacy generic endpoint.
  return ["optix", "unity", "generic"];
};

const collectRemoteEndpointCandidates = (): RemoteEndpointCandidate[] => {
  const backendMode = readRenderBackendMode();
  const orderedBackends = readEndpointBackendOrder(backendMode);
  const allowLegacyGenericEndpoint = readAllowLegacyGenericEndpoint();
  const canonicalConfigured =
    !!resolveServiceEndpoint("optix", "frame") || !!resolveServiceEndpoint("unity", "frame");
  const seen = new Set<string>();
  const out: RemoteEndpointCandidate[] = [];
  for (const backend of orderedBackends) {
    if (backend === "generic" && !allowLegacyGenericEndpoint) {
      if (backendMode !== "auto") continue;
      if (canonicalConfigured) continue;
    }
    const frameEndpoint = resolveServiceEndpoint(backend, "frame");
    if (!frameEndpoint || seen.has(frameEndpoint)) continue;
    seen.add(frameEndpoint);
    const statusEndpoint =
      resolveServiceEndpoint(backend, "status") ??
      statusEndpointFromFrameEndpoint(frameEndpoint);
    out.push({
      backend,
      frameEndpoint,
      statusEndpoint,
    });
  }
  return out;
};

const readRequiredProvenanceSourcePrefix = (): string | null =>
  readEnvText(process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX)?.toLowerCase() ??
  null;

const readAllowLegacyGenericEndpoint = (): boolean =>
  process.env.MIS_RENDER_ALLOW_LEGACY_GENERIC_ENDPOINT === "1";

const readAllowConfiguredFallback = (): boolean =>
  process.env.MIS_RENDER_ALLOW_CONFIGURED_FALLBACK === "1";

const readStrictProxy = (): boolean =>
  process.env.MIS_RENDER_PROXY_STRICT !== "0";

const readRequireIntegralSignal = (): boolean =>
  process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL !== "0";

const readRequireScientificFrameByDefault = (): boolean =>
  process.env.MIS_RENDER_REQUIRE_SCIENTIFIC_FRAME !== "0";

const readAutoStartOptixEnabled = (): boolean => {
  const value = readEnvText(process.env.MIS_RENDER_AUTOSTART_OPTIX);
  if (value != null) {
    const normalized = value.toLowerCase();
    return normalized !== "0" && normalized !== "false";
  }
  if (process.env.NODE_ENV === "test" || !!process.env.VITEST) return false;
  return true;
};

type LoopbackEndpoint = {
  host: string;
  port: number;
};

const parseLoopbackServiceEndpoint = (endpoint: string): LoopbackEndpoint | null => {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "http:") return null;
    const hostname = url.hostname.toLowerCase();
    if (hostname !== "127.0.0.1" && hostname !== "localhost") return null;
    const port = Number(url.port || "80");
    if (!Number.isFinite(port) || port <= 0) return null;
    return {
      host: hostname === "localhost" ? "127.0.0.1" : hostname,
      port,
    };
  } catch {
    return null;
  }
};

const findAutoStartOptixCandidate = (
  candidates: RemoteEndpointCandidate[],
): RemoteEndpointCandidate | null => {
  for (const candidate of candidates) {
    if (candidate.backend !== "optix") continue;
    if (parseLoopbackServiceEndpoint(candidate.frameEndpoint)) return candidate;
  }
  return null;
};

const buildRequestBaseUrl = (req: Request): string => {
  const forwardedProtoRaw = req.headers["x-forwarded-proto"];
  const forwardedProto = Array.isArray(forwardedProtoRaw)
    ? forwardedProtoRaw[0]
    : forwardedProtoRaw;
  const forwarded = readEnvText(forwardedProto)?.split(",")[0]?.trim().toLowerCase();
  const protocol = forwarded || req.protocol || "http";
  const host = req.get("host") || "127.0.0.1:5050";
  return `${protocol}://${host}`;
};

const sleepMs = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const npmExecPath = readEnvText(process.env.npm_execpath);
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const spawnDetachedOptixService = (args: {
  host: string;
  port: number;
  appBaseUrl: string;
}): ChildProcess => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    OPTIX_RENDER_SERVICE_HOST: args.host,
    OPTIX_RENDER_SERVICE_PORT: String(args.port),
    OPTIX_RENDER_APP_BASE_URL: args.appBaseUrl,
    OPTIX_RENDER_METRIC_REF_BASE_URL: args.appBaseUrl,
    OPTIX_RENDER_ALLOW_SYNTHETIC:
      process.env.OPTIX_RENDER_ALLOW_SYNTHETIC ?? "0",
  };
  const child = npmExecPath
    ? spawn(process.execPath, [npmExecPath, "run", "-s", "hull:optix:service"], {
        env,
        shell: false,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      })
    : spawn(npmCmd, ["run", "-s", "hull:optix:service"], {
        env,
        shell: false,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
  child.unref();
  return child;
};

const isChildProcessRunning = (child: ChildProcess | null): boolean =>
  !!child && child.exitCode == null && child.signalCode == null && child.killed !== true;

const optixAutoStartState: {
  child: ChildProcess | null;
  inFlight: Promise<boolean> | null;
  lastAttemptAtMs: number;
  lastError: string | null;
} = {
  child: null,
  inFlight: null,
  lastAttemptAtMs: 0,
  lastError: null,
};

const isLocalFallbackAllowed = (opts: {
  backendMode: "auto" | "optix" | "unity";
  strictProxy: boolean;
  remoteConfigured: boolean;
  requireScientificFrame: boolean;
}): boolean => {
  if (opts.requireScientificFrame) return false;
  if (opts.strictProxy) return false;
  if (opts.backendMode !== "auto") return false;
  if (!opts.remoteConfigured) return true;
  return readAllowConfiguredFallback();
};

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
  const metricVolumeRef = isRecord(src.metricVolumeRef) ? src.metricVolumeRef : {};
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
      requireScientificFrame: scienceLane.requireScientificFrame === true,
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
    metricVolumeRef:
      metricVolumeRef.kind === "gr-evolve-brick" &&
      typeof metricVolumeRef.url === "string" &&
      metricVolumeRef.url.trim().length > 0
        ? {
            kind: "gr-evolve-brick",
            url: metricVolumeRef.url.trim(),
            source:
              typeof metricVolumeRef.source === "string"
                ? metricVolumeRef.source
                : null,
            chart:
              typeof metricVolumeRef.chart === "string"
                ? metricVolumeRef.chart
                : null,
            dims: Array.isArray(metricVolumeRef.dims)
              ? readTuple3(metricVolumeRef.dims, [1, 1, 1])
              : null,
            updatedAt:
              metricVolumeRef.updatedAt == null
                ? null
                : toFiniteNumber(metricVolumeRef.updatedAt, Date.now()),
            hash:
              typeof metricVolumeRef.hash === "string"
                ? metricVolumeRef.hash
                : null,
          }
        : null,
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

const waitForRemoteServiceReady = async (
  statusEndpoint: string,
  timeoutMs: number,
): Promise<RemoteServiceStatus> => {
  let latest = await fetchRemoteServiceStatus(statusEndpoint);
  if (latest.reachable || timeoutMs <= 0) return latest;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleepMs(AUTO_START_OPTIX_WAIT_INTERVAL_MS);
    latest = await fetchRemoteServiceStatus(statusEndpoint);
    if (latest.reachable) return latest;
  }
  return latest;
};

const ensureAutoStartOptixForCandidate = async (args: {
  candidate: RemoteEndpointCandidate | null;
  appBaseUrl: string;
  waitMs: number;
}): Promise<{ attempted: boolean; ready: boolean; error: string | null }> => {
  const { candidate, appBaseUrl, waitMs } = args;
  if (!readAutoStartOptixEnabled()) {
    return { attempted: false, ready: false, error: null };
  }
  if (!candidate || candidate.backend !== "optix") {
    return { attempted: false, ready: false, error: null };
  }
  const loopback = parseLoopbackServiceEndpoint(candidate.frameEndpoint);
  if (!loopback) {
    return { attempted: false, ready: false, error: null };
  }

  const statusEndpoint =
    candidate.statusEndpoint ?? statusEndpointFromFrameEndpoint(candidate.frameEndpoint);
  const currentStatus = await fetchRemoteServiceStatus(statusEndpoint);
  if (currentStatus.reachable) {
    return { attempted: false, ready: true, error: null };
  }

  if (optixAutoStartState.inFlight) {
    const ready = await optixAutoStartState.inFlight;
    const statusAfter = await waitForRemoteServiceReady(statusEndpoint, Math.min(waitMs, 1200));
    return {
      attempted: true,
      ready: ready || statusAfter.reachable,
      error: statusAfter.reachable ? null : statusAfter.error ?? optixAutoStartState.lastError,
    };
  }

  const inFlight = (async (): Promise<boolean> => {
    const now = Date.now();
    if (
      !isChildProcessRunning(optixAutoStartState.child) &&
      now - optixAutoStartState.lastAttemptAtMs >= AUTO_START_OPTIX_COOLDOWN_MS
    ) {
      try {
        const child = spawnDetachedOptixService({
          host: loopback.host,
          port: loopback.port,
          appBaseUrl,
        });
        optixAutoStartState.child = child;
        child.once("exit", () => {
          if (optixAutoStartState.child === child) {
            optixAutoStartState.child = null;
          }
        });
        optixAutoStartState.lastAttemptAtMs = now;
        optixAutoStartState.lastError = null;
      } catch (error) {
        optixAutoStartState.lastAttemptAtMs = now;
        optixAutoStartState.lastError =
          error instanceof Error ? error.message : String(error);
        return false;
      }
    }
    const statusAfter = await waitForRemoteServiceReady(statusEndpoint, waitMs);
    if (!statusAfter.reachable) {
      optixAutoStartState.lastError = statusAfter.error ?? "autostart_not_ready";
    } else {
      optixAutoStartState.lastError = null;
    }
    return statusAfter.reachable;
  })();

  optixAutoStartState.inFlight = inFlight;
  try {
    const ready = await inFlight;
    return {
      attempted: true,
      ready,
      error: ready ? null : optixAutoStartState.lastError,
    };
  } finally {
    if (optixAutoStartState.inFlight === inFlight) {
      optixAutoStartState.inFlight = null;
    }
  }
};

const isScientificRemoteFrame = (frame: HullMisRenderResponseV1): boolean => {
  if (frame.backend !== "proxy") return false;
  const note = String(frame.diagnostics?.note ?? "").toLowerCase();
  const provenance = String(frame.provenance?.source ?? "").toLowerCase();
  if (
    note.includes("synthetic") ||
    note.includes("fallback") ||
    note.includes("scaffold") ||
    note.includes("teaching")
  ) {
    return false;
  }
  if (
    provenance.includes("synthetic") ||
    provenance.includes("scaffold") ||
    provenance.includes("teaching")
  ) {
    return false;
  }
  return true;
};

const isResearchGradeRemoteFrame = (frame: HullMisRenderResponseV1): boolean => {
  if (!isScientificRemoteFrame(frame)) return false;
  const provenanceSource = String(frame.provenance?.source ?? "").toLowerCase();
  const note = String(frame.diagnostics?.note ?? "").toLowerCase();
  const provenanceTier = String(frame.provenance?.scientificTier ?? "").toLowerCase();
  const diagnosticsTier = String(frame.diagnostics?.scientificTier ?? "").toLowerCase();
  const explicitResearch =
    frame.provenance?.researchGrade === true ||
    provenanceTier === "research-grade" ||
    diagnosticsTier === "research-grade";
  if (explicitResearch) return true;
  if (provenanceSource.includes("research") || note.includes("research")) return true;
  return false;
};

const isFullThreePlusOneGeodesicFrame = (
  frame: HullMisRenderResponseV1,
): boolean =>
  String(frame.diagnostics?.geodesicMode ?? "").toLowerCase() ===
  "full-3+1-christoffel";

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
      scientificTier: "teaching",
    },
    attachments: buildLocalIntegralAttachments(payload),
    provenance: {
      source: "casimirbot.local.deterministic",
      serviceUrl: null,
      timestampMs: Date.now(),
      researchGrade: false,
      scientificTier: "teaching",
    },
  };
};

router.get("/status", async (req, res) => {
  const backendMode = readRenderBackendMode();
  const endpointCandidates = collectRemoteEndpointCandidates();
  const autoStartOptixEnabled = readAutoStartOptixEnabled();
  const autoStartCandidate = findAutoStartOptixCandidate(endpointCandidates);
  const autoStartResult = await ensureAutoStartOptixForCandidate({
    candidate: autoStartCandidate,
    appBaseUrl: buildRequestBaseUrl(req),
    waitMs: 1200,
  });
  const allowLegacyGenericEndpoint = readAllowLegacyGenericEndpoint();
  const strictProxy = readStrictProxy();
  const requireIntegralSignal = readRequireIntegralSignal();
  const requireScientificFrame = readRequireScientificFrameByDefault();
  const requiredProvenanceSourcePrefix = readRequiredProvenanceSourcePrefix();
  const remoteConfigured = endpointCandidates.length > 0;
  const localFallbackAllowed = isLocalFallbackAllowed({
    backendMode,
    strictProxy,
    remoteConfigured,
    requireScientificFrame,
  });
  let selectedCandidate: RemoteEndpointCandidate | null =
    endpointCandidates.length > 0 ? endpointCandidates[0] : null;
  let remoteStatus: RemoteServiceStatus = {
    reachable: false,
    endpoint: null,
    kind: null,
    readyForUnity: false,
    readyForOptix: false,
    readyForScientificLane: false,
    allowSynthetic: false,
    error: "remote_status_not_configured",
  };
  if (remoteConfigured) {
    let firstFailure: RemoteServiceStatus | null = null;
    for (const candidate of endpointCandidates) {
      const statusEndpoint =
        candidate.statusEndpoint ?? statusEndpointFromFrameEndpoint(candidate.frameEndpoint);
      const candidateStatus = await fetchRemoteServiceStatus(statusEndpoint);
      if (!firstFailure) {
        firstFailure = candidateStatus;
        selectedCandidate = candidate;
      }
      if (candidateStatus.reachable) {
        selectedCandidate = candidate;
        remoteStatus = candidateStatus;
        break;
      }
    }
    if (!remoteStatus.reachable && firstFailure) {
      remoteStatus = firstFailure;
    }
  }
  const scientificLaneReady =
    remoteConfigured &&
    strictProxy &&
    remoteStatus.reachable &&
    remoteStatus.readyForScientificLane &&
    !remoteStatus.allowSynthetic;
  const recommendedFrameEndpoint =
    backendMode === "optix"
      ? DEFAULT_OPTIX_SERVICE_FRAME_URL
      : backendMode === "unity"
        ? DEFAULT_UNITY_SERVICE_FRAME_URL
        : DEFAULT_OPTIX_SERVICE_FRAME_URL;
  const recommendedStatusEndpoint =
    backendMode === "optix"
      ? DEFAULT_OPTIX_SERVICE_STATUS_URL
      : backendMode === "unity"
        ? DEFAULT_UNITY_SERVICE_STATUS_URL
        : DEFAULT_OPTIX_SERVICE_STATUS_URL;
  res.json({
    kind: "hull-render-status",
    backendHint: "mis-path-tracing",
    backendMode,
    remoteConfigured,
    remoteEndpoint: selectedCandidate?.frameEndpoint ?? null,
    remoteStatusEndpoint:
      selectedCandidate?.statusEndpoint ??
      (selectedCandidate
        ? statusEndpointFromFrameEndpoint(selectedCandidate.frameEndpoint)
        : null),
    strictProxy,
    requireIntegralSignal,
    requireScientificFrame,
    requiredProvenanceSourcePrefix,
    allowLegacyGenericEndpoint,
    autoStartOptixEnabled,
    autoStartOptixAttempted: autoStartResult.attempted,
    autoStartOptixReady: autoStartResult.ready,
    autoStartOptixError: autoStartResult.error,
    scientificLaneReady,
    fallbackLaneActive: !scientificLaneReady && localFallbackAllowed,
    localFallbackAllowed,
    endpointCandidates: endpointCandidates.map((candidate) => ({
      backend: candidate.backend,
      frameEndpoint: candidate.frameEndpoint,
      statusEndpoint:
        candidate.statusEndpoint ?? statusEndpointFromFrameEndpoint(candidate.frameEndpoint),
    })),
    remoteStatus,
    recommendedService:
      backendMode === "optix"
        ? "OptiX + CUDA render service"
        : backendMode === "unity"
          ? "RayTracingMIS Unity batch service"
          : "RayTracingMIS Unity batch service",
    recommendedFrameEndpoint,
    recommendedStatusEndpoint,
    timestampMs: Date.now(),
  });
});

router.post("/frame", async (req, res) => {
  const renderStartedAt = Date.now();
  const payload = parseRequest(req.body);
  const backendMode = readRenderBackendMode();
  const endpointCandidates = collectRemoteEndpointCandidates();
  const allowLegacyGenericEndpoint = readAllowLegacyGenericEndpoint();
  const remoteConfigured = endpointCandidates.length > 0;
  const strictProxy = readStrictProxy();
  const requireIntegralSignalByEnv = readRequireIntegralSignal();
  const requireScientificFrameByEnv = readRequireScientificFrameByDefault();
  const requiredProvenanceSourcePrefix = readRequiredProvenanceSourcePrefix();
  const requireScientificFrame =
    requireScientificFrameByEnv || payload.scienceLane?.requireScientificFrame === true;
  const enforceScientificFrame = strictProxy || requireScientificFrame;
  const localFallbackAllowed = isLocalFallbackAllowed({
    backendMode,
    strictProxy: enforceScientificFrame,
    remoteConfigured,
    requireScientificFrame,
  });

  if (remoteConfigured) {
    const autoStartCandidate = findAutoStartOptixCandidate(endpointCandidates);
    await ensureAutoStartOptixForCandidate({
      candidate: autoStartCandidate,
      appBaseUrl: buildRequestBaseUrl(req),
      waitMs: 7_000,
    });
    const attemptErrors: string[] = [];
    for (const candidate of endpointCandidates) {
      try {
        const remote = await proxyRemoteFrame(candidate.frameEndpoint, payload);
        if (enforceScientificFrame && !isScientificRemoteFrame(remote)) {
          throw new Error("remote_mis_non_scientific_response");
        }
        if (requireScientificFrame && !isFullThreePlusOneGeodesicFrame(remote)) {
          throw new Error("remote_mis_non_3p1_geodesic_mode");
        }
        if (requireScientificFrame && !isResearchGradeRemoteFrame(remote)) {
          throw new Error("remote_mis_non_research_grade_frame");
        }
        if (
          enforceScientificFrame &&
          !hasRequiredProvenancePrefix(remote, requiredProvenanceSourcePrefix)
        ) {
          throw new Error("remote_mis_provenance_source_prefix_mismatch");
        }
        const requireIntegralSignal =
          payload.scienceLane?.requireIntegralSignal === true ||
          (strictProxy && requireIntegralSignalByEnv) ||
          requireScientificFrame;
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
            serviceUrl: candidate.frameEndpoint,
            timestampMs: Date.now(),
            researchGrade: remote.provenance?.researchGrade === true,
            scientificTier:
              remote.provenance?.scientificTier ??
              remote.diagnostics?.scientificTier ??
              null,
          },
        };
        return res.json(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attemptErrors.push(`${candidate.backend}@${candidate.frameEndpoint} :: ${message}`);
      }
    }
    if (!localFallbackAllowed) {
      return res.status(502).json({
        error: "mis_proxy_failed",
        message: attemptErrors.join(" | "),
        endpointCandidates: endpointCandidates.map((candidate) => candidate.frameEndpoint),
        allowLegacyGenericEndpoint,
      });
    }
    const fallback = await buildLocalResponse(
      payload,
      renderStartedAt,
      "remote_proxy_failed_fallback_local_teaching_only",
    );
    return res.json(fallback);
  }

  if (!localFallbackAllowed) {
    return res.status(502).json({
      error: "mis_proxy_unconfigured",
      message:
        requireScientificFrame
          ? "scientific frame requested, but no remote scientific MIS endpoint is configured"
          : backendMode === "auto"
            ? "no remote MIS render endpoint configured"
            : `required remote MIS render endpoint not configured for backend=${backendMode}`,
      backendMode,
      requireScientificFrame,
      allowLegacyGenericEndpoint,
    });
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
