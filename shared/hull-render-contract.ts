export type HullRendererBackendMode = "webgl" | "webgpu" | "mis-service";

export type HullRenderSkyboxMode = "off" | "flat" | "geodesic";

export type HullMetricVolumeRefV1 = {
  kind: "gr-evolve-brick";
  url: string;
  source?: string | null;
  chart?: string | null;
  dims?: [number, number, number] | null;
  updatedAt?: number | null;
  hash?: string | null;
};

export type HullMisRenderRequestV1 = {
  version: 1;
  requestId?: string;
  width: number;
  height: number;
  dpr?: number;
  backendHint?: "mis-path-tracing";
  timestampMs?: number;
  skyboxMode?: HullRenderSkyboxMode;
  scienceLane?: {
    requireIntegralSignal?: boolean;
    requireScientificFrame?: boolean;
    attachmentDownsample?: number;
  };
  solve?: {
    beta?: number;
    alpha?: number;
    sigma?: number;
    R?: number;
    chart?: string | null;
  };
  geodesicDiagnostics?: {
    mode?: string | null;
    consistency?: "ok" | "warn" | "fail" | "unknown";
    maxNullResidual?: number | null;
    stepConvergence?: number | null;
    bundleSpread?: number | null;
  };
  metricSummary?: {
    source?: string | null;
    chart?: string | null;
    dims?: [number, number, number] | null;
    alphaRange?: [number, number] | null;
    consistency?: "ok" | "warn" | "fail" | "unknown";
    updatedAt?: number | null;
  };
  metricVolumeRef?: HullMetricVolumeRefV1 | null;
};

export type HullMisRenderAttachmentKind =
  | "depth-linear-m-f32le"
  | "shell-mask-u8";

export type HullMisRenderAttachmentV1 = {
  kind: HullMisRenderAttachmentKind;
  width: number;
  height: number;
  encoding: "base64";
  dataBase64: string;
};

export type HullMisRenderResponseV1 = {
  version: 1;
  ok: boolean;
  backend: "proxy" | "local-deterministic";
  imageMime: "image/png";
  imageDataUrl: string;
  width: number;
  height: number;
  deterministicSeed: number;
  renderMs: number;
  attachments?: HullMisRenderAttachmentV1[];
  diagnostics?: {
    note?: string;
    geodesicMode?: string | null;
    consistency?: "ok" | "warn" | "fail" | "unknown";
    maxNullResidual?: number | null;
    stepConvergence?: number | null;
    bundleSpread?: number | null;
    scientificTier?: "research-grade" | "teaching" | "scaffold" | "unknown" | null;
  };
  provenance?: {
    source: string;
    serviceUrl?: string | null;
    timestampMs: number;
    researchGrade?: boolean;
    scientificTier?: "research-grade" | "teaching" | "scaffold" | "unknown" | null;
  };
};
