import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import type {
  HullMetricVolumeRefV1,
  HullMisRenderRequestV1,
  HullMisRenderResponseV1,
  HullScientificRenderView,
} from "../shared/hull-render-contract";
import {
  hashFloat32,
  loadHullScientificSnapshot,
  resolveMetricRefHash,
} from "../server/lib/hull-scientific-snapshot";

const DATE_STAMP = new Date().toISOString().slice(0, 10);
const FULL_SOLVE_DIR = path.join("artifacts", "research", "full-solve");
const DOC_AUDIT_DIR = path.join("docs", "audits", "research");
const DEFAULT_BASE_URL = "http://127.0.0.1:5050";
const DEFAULT_FRAME_ENDPOINT = "http://127.0.0.1:6062/api/helix/hull-render/frame";
const DEFAULT_PROXY_FRAME_ENDPOINT = `${DEFAULT_BASE_URL}/api/helix/hull-render/frame`;
const DEFAULT_NHM2_SNAPSHOT_PATH = path.join(
  FULL_SOLVE_DIR,
  "nhm2-snapshot-congruence-evidence-latest.json",
);
const DEFAULT_OUT_JSON = path.join(
  FULL_SOLVE_DIR,
  `warp-york-control-family-proof-pack-${DATE_STAMP}.json`,
);
const DEFAULT_OUT_MD = path.join(
  DOC_AUDIT_DIR,
  `warp-york-control-family-proof-pack-${DATE_STAMP}.md`,
);
const DEFAULT_LATEST_JSON = path.join(
  FULL_SOLVE_DIR,
  "warp-york-control-family-proof-pack-latest.json",
);
const DEFAULT_LATEST_MD = path.join(
  DOC_AUDIT_DIR,
  "warp-york-control-family-proof-pack-latest.md",
);
const BOUNDARY_STATEMENT =
  "This control-family proof pack is a render/geometry audit for York-family interpretation; it is not a physical warp feasibility claim.";
const RETRYABLE_RENDER_ERRORS = new Set([
  "scientific_metric_volume_unavailable",
  "metric_ref_decode_failed",
  "metric_ref_http_502",
  "metric_ref_http_503",
  "metric_ref_http_504",
]);

type CaseId = "alcubierre_control" | "natario_control" | "nhm2_certified";
type DecisionRowStatus = "true" | "false";
type DecisionVerdict =
  | "renderer_or_conversion_wrong"
  | "proof_pack_york_slice_hash_mismatch"
  | "proof_pack_york_rho_remap_mismatch"
  | "proof_pack_york_near_zero_suppression_mismatch"
  | "proof_pack_york_downstream_render_mismatch"
  | "renderer_fine_controls_consistent"
  | "nhm2_low_expansion_family"
  | "solve_family_mismatch"
  | "inconclusive";

type GuardFailure = {
  code: string;
  detail: string;
};

type ProofPackPreconditions = {
  controlsIndependent: boolean;
  allRequiredViewsRendered: boolean;
  provenanceHashesPresent: boolean;
  runtimeStatusProvenancePresent: boolean;
  readyForFamilyVerdict: boolean;
};

type YorkRenderLane = "single" | "direct" | "proxy";

type YorkLaneResultSummary = {
  lane: YorkRenderLane;
  endpoint: string;
  ok: boolean;
  httpStatus: number | null;
  errorCode: string | null;
  responseMessage: string | null;
  preflightBranch: string | null;
  preflightRequirement: string | null;
  error: string | null;
};

type YorkViewSummary = {
  view: HullScientificRenderView;
  ok: boolean;
  backend: string | null;
  scientificTier: string | null;
  error: string | null;
  sourceLane: YorkRenderLane | null;
  endpoint: string | null;
  httpStatus: number | null;
  errorCode: string | null;
  responseMessage: string | null;
  preflightBranch: string | null;
  preflightRequirement: string | null;
  laneResults: YorkLaneResultSummary[];
  note: string | null;
  render: {
    view: HullScientificRenderView | null;
    field_key: string | null;
    slice_plane: string | null;
    coordinate_mode: string | null;
    normalization: string | null;
    magnitude_mode: string | null;
    surface_height: string | null;
    support_overlay: string | null;
  };
  identity: {
    metric_ref_hash: string | null;
    timestamp_ms: number | null;
    chart: string | null;
    observer: string | null;
    theta_definition: string | null;
    kij_sign_convention: string | null;
    unit_system: string | null;
  };
  rawExtrema: {
    min: number | null;
    max: number | null;
    absMax: number | null;
  };
  displayExtrema: {
    min: number | null;
    max: number | null;
    absMax: number | null;
    rangeMethod: string | null;
    gain: number | null;
    heightScale: number | null;
  };
  nearZeroTheta: boolean | null;
  samplingChoice: string | null;
  supportOverlapPct: number | null;
  supportedThetaFraction: number | null;
  hashes: {
    certificate_hash: string | null;
    frame_hash: string | null;
    theta_channel_hash: string | null;
    slice_array_hash: string | null;
    normalized_slice_hash: string | null;
    support_mask_slice_hash: string | null;
    shell_masked_slice_hash: string | null;
  };
};

type CaseSnapshotMetrics = {
  dims: [number, number, number];
  resolvedUrl: string | null;
  metricRefHash: string | null;
  requestMetricRefHash: string | null;
  source: string | null;
  chart: string | null;
  channelHashes: {
    theta: string | null;
    K_trace: string | null;
  };
  sourceFamily: {
    family_id: string | null;
    metricT00Ref: string | null;
    warpFieldType: string | null;
    source_branch: string | null;
    shape_function_id: string | null;
  };
  thetaPlusKTrace: {
    rms: number | null;
    maxAbs: number | null;
    mean: number | null;
    sampleCount: number;
    consistent: boolean;
  };
};

type SourceFamilyEvidence = CaseSnapshotMetrics["sourceFamily"];

type CaseResult = {
  caseId: CaseId;
  label: string;
  familyExpectation: "alcubierre-like-control" | "natario-like-control" | "nhm2-certified";
  metricVolumeRef: HullMetricVolumeRefV1;
  perView: YorkViewSummary[];
  primaryYork: {
    view: HullScientificRenderView;
    rawExtrema: YorkViewSummary["rawExtrema"] | null;
    displayExtrema: YorkViewSummary["displayExtrema"] | null;
    nearZeroTheta: boolean | null;
    coordinateMode: string | null;
    samplingChoice: string | null;
    supportOverlapPct: number | null;
  };
  snapshotMetrics: CaseSnapshotMetrics | null;
  offlineYorkAudit: CaseOfflineYorkAudit | null;
};

type OfflineYorkViewAudit = {
  view: "york-surface-3p1" | "york-surface-rho-3p1";
  coordinateMode: "x-z-midplane" | "x-rho";
  samplingChoice: "x-z midplane" | "x-rho cylindrical remap";
  thetaSliceHash: string | null;
  rawExtrema: {
    min: number | null;
    max: number | null;
    absMax: number | null;
  };
  counts: {
    positive: number;
    negative: number;
    zeroOrNearZero: number;
    total: number;
  };
};

type CaseOfflineYorkAudit = {
  byView: OfflineYorkViewAudit[];
  alcubierreSignedLobeSummary?: {
    foreHalfPositiveTotal: number;
    foreHalfNegativeTotal: number;
    aftHalfPositiveTotal: number;
    aftHalfNegativeTotal: number;
    signedLobeSummary: "fore+/aft-" | "fore-/aft+" | "mixed_or_flat";
  };
};

type YorkCongruenceEvaluation = {
  hashMismatch: boolean;
  rhoRemapMismatch: boolean;
  nearZeroSuppressionMismatch: boolean;
  downstreamRenderMismatch: boolean;
  guardFailures: GuardFailure[];
};

type ControlRequestSelectors = {
  metricT00Ref: string | null;
  metricT00Source: string | null;
  requireCongruentSolve: boolean;
  requireNhm2CongruentFullSolve: boolean;
  warpFieldType: string | null;
};

type ControlDebugEntry = {
  caseId: CaseId;
  label: string;
  requestUrl: string | null;
  requestSelectors: ControlRequestSelectors;
  resolvedMetricRefHash: string | null;
  requestMetricRefHash: string | null;
  thetaHash: string | null;
  kTraceHash: string | null;
  brickSource: string | null;
  chart: string | null;
  family_id: string | null;
  metricT00Ref: string | null;
  warpFieldType: string | null;
  source_branch: string | null;
  shape_function_id: string | null;
};

type DecisionRow = {
  id: string;
  condition: string;
  status: DecisionRowStatus;
  interpretation: string;
};

type ProofPackPayload = {
  artifactType: "warp_york_control_family_proof_pack/v1";
  generatedOn: string;
  generatedAt: string;
  boundaryStatement: string;
  inputs: {
    baseUrl: string;
    frameEndpoint: string;
    proxyFrameEndpoint: string | null;
    compareDirectAndProxy: boolean;
    nhm2SnapshotPath: string;
    yorkViews: HullScientificRenderView[];
    frameSize: { width: number; height: number };
  };
  cases: CaseResult[];
  controlDebug: ControlDebugEntry[];
  preconditions: ProofPackPreconditions;
  guardFailures: GuardFailure[];
  decisionTable: DecisionRow[];
  verdict: DecisionVerdict;
  notes: string[];
  provenance: {
    commitHash: string | null;
    runtimeStatus: {
      statusEndpoint: string;
      serviceVersion: string | null;
      buildHash: string | null;
      commitSha: string | null;
      processStartedAtMs: number | null;
      runtimeInstanceId: string | null;
      reachable: boolean;
    };
  };
  checksum?: string;
};

const REQUIRED_YORK_VIEWS: HullScientificRenderView[] = [
  "york-surface-3p1",
  "york-surface-rho-3p1",
  "york-topology-normalized-3p1",
  "york-shell-map-3p1",
];
const OPTIONAL_YORK_VIEWS: HullScientificRenderView[] = ["york-time-3p1"];
const DEFAULT_YORK_VIEWS: HullScientificRenderView[] = [...REQUIRED_YORK_VIEWS];
const VALID_YORK_VIEW_SET = new Set<HullScientificRenderView>([
  ...REQUIRED_YORK_VIEWS,
  ...OPTIONAL_YORK_VIEWS,
]);
const YORK_NEAR_ZERO_THETA_ABS_THRESHOLD = 1e-20;
const YORK_SIGN_STRUCTURE_EPS = 1e-45;

const ensureRequiredYorkViews = (
  views: HullScientificRenderView[],
): HullScientificRenderView[] => {
  const deduped = Array.from(new Set(views));
  for (const requiredView of REQUIRED_YORK_VIEWS) {
    if (!deduped.includes(requiredView)) deduped.push(requiredView);
  }
  return deduped;
};

const readArgValue = (name: string, argv = process.argv.slice(2)): string | undefined => {
  const index = argv.findIndex((value) => value === name || value.startsWith(`${name}=`));
  if (index < 0) return undefined;
  if (argv[index].includes("=")) return argv[index].split("=", 2)[1];
  return argv[index + 1];
};

const parseYorkViews = (value: string | undefined): HullScientificRenderView[] => {
  if (!value || value.trim().length === 0) return [...DEFAULT_YORK_VIEWS];
  const parsed = value
    .split(",")
    .map((entry) => entry.trim() as HullScientificRenderView)
    .filter((entry) => entry.length > 0);
  if (parsed.length === 0) return [...DEFAULT_YORK_VIEWS];
  const deduped = Array.from(new Set(parsed));
  const invalid = deduped.filter((entry) => !VALID_YORK_VIEW_SET.has(entry));
  if (invalid.length > 0) {
    throw new Error(
      `invalid_york_views: ${invalid.join(", ")} | valid=${Array.from(VALID_YORK_VIEW_SET).join(",")}`,
    );
  }
  return ensureRequiredYorkViews(deduped);
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return rounded > 0 ? rounded : fallback;
};

const parseBooleanArg = (value: string | undefined, fallback = false): boolean => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asText = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return null;
};

const normalizePath = (filePath: string): string => filePath.replace(/\\/g, "/");

const ensureDirForFile = (filePath: string): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const mapPreflightFailure = (args: {
  lane: YorkRenderLane;
  errorCode: string | null;
  responseMessage: string | null;
}): { branch: string | null; requirement: string | null } => {
  const code = (args.errorCode ?? "").trim();
  const message = (args.responseMessage ?? "").trim();
  if (!code) {
    return { branch: null, requirement: null };
  }
  const directMap: Record<string, { branch: string; requirement: string }> = {
    scientific_metric_ref_missing_congruent_gate: {
      branch:
        "hull-optix-service:/frame metricRefEnforcesCongruentSolve(requireCongruentSolve=1 or requireNhm2CongruentFullSolve=1)",
      requirement:
        "metricVolumeRef.url must include requireCongruentSolve=1 (or requireNhm2CongruentFullSolve=1)",
    },
    scientific_metric_contract_violation: {
      branch: "hull-optix-service:/frame validateScientificMetricVolume(payload, metricBrick)",
      requirement: "canonical tensor volume contract must pass for requested scientific view",
    },
    scientific_metric_volume_unavailable: {
      branch:
        "hull-optix-service:/frame strictTensorPathRequired && !useTensorPath (fetchMetricBrick/contract decode path)",
      requirement:
        "decodable gr-evolve-brick metric volume required for strict scientific views",
    },
    scientific_york_theta_missing: {
      branch: "hull-optix-service:/frame yorkRequested theta channel preflight",
      requirement: "metric volume must contain canonical theta channel",
    },
    scientific_york_chart_unsupported: {
      branch: "hull-optix-service:/frame yorkRequested chart preflight",
      requirement: "chart must be comoving_cartesian for York views",
    },
    scientific_york_shell_support_missing: {
      branch: "hull-optix-service:/frame yorkShellMapRequested support preflight",
      requirement: "hull_sdf and tile_support_mask channels required for york-shell-map-3p1",
    },
    scientific_york_diagnostics_missing: {
      branch: "hull-optix-service:/frame York certificate diagnostics preflight",
      requirement: "raw/display York diagnostics block must be present in certificate",
    },
    scientific_york_topology_convention_mismatch: {
      branch: "hull-optix-service:/frame york-topology-normalized convention checks",
      requirement:
        "render.normalization=topology-only-unit-max and render.surface_height=theta_norm",
    },
    scientific_york_topology_diagnostics_missing: {
      branch: "hull-optix-service:/frame york-topology-normalized diagnostics checks",
      requirement: "diagnostics.normalized_slice_hash is required",
    },
    scientific_york_shell_map_convention_mismatch: {
      branch: "hull-optix-service:/frame york-shell-map convention checks",
      requirement: "render.support_overlay=hull_sdf+tile_support_mask",
    },
    scientific_york_shell_map_diagnostics_missing: {
      branch: "hull-optix-service:/frame york-shell-map diagnostics checks",
      requirement:
        "shell-localized diagnostics + hashes required (support/shell mask + shell extrema)",
    },
    scientific_york_certificate_mismatch: {
      branch: "hull-optix-service:/frame York certificate identity checks",
      requirement:
        "metric_ref_hash/timestamp/chart/observer/theta_definition/kij_sign_convention/unit_system must match snapshot",
    },
  };
  if (code in directMap) {
    return directMap[code];
  }
  const proxyMap: Record<string, { branch: string; requirement: string }> = {
    mis_proxy_failed: {
      branch: "hull-render route remote proxy attempt loop",
      requirement:
        "remote service must return scientific frame that passes strict proxy validation",
    },
    mis_proxy_unconfigured: {
      branch: "hull-render route endpoint configuration gate",
      requirement: "configured remote render endpoint required when strict scientific frame requested",
    },
    remote_mis_non_scientific_response: {
      branch: "hull-render route strict remote response guard",
      requirement: "remote response must include scientific-tier diagnostics and certificate",
    },
    remote_mis_non_3p1_geodesic_mode: {
      branch: "hull-render route 3+1 geodesic mode guard",
      requirement: "remote response geodesic mode must be full 3+1 christoffel",
    },
    remote_mis_non_research_grade_frame: {
      branch: "hull-render route research-grade guard",
      requirement: "remote response must mark research-grade scientific tier",
    },
    remote_mis_missing_integral_signal_attachments: {
      branch: "hull-render route integral-signal attachment guard",
      requirement: "depth and shell-mask attachments required for strict lane",
    },
  };
  if (code in proxyMap) {
    return proxyMap[code];
  }
  if (code.startsWith("remote_mis_render_certificate_")) {
    return {
      branch: "hull-render route validateRenderCertificateForRequest",
      requirement: "remote certificate metadata must match requested scientific view contract",
    };
  }
  if (code.startsWith("scientific_atlas_")) {
    return {
      branch: "hull-render route validateScientificAtlasForRequest",
      requirement: "full-atlas sidecar pane/channel/coherence checks must pass",
    };
  }
  if (message.length > 0 && code === "scientific_metric_volume_unavailable") {
    return {
      branch:
        "hull-optix-service:/frame strictTensorPathRequired && !useTensorPath (fetchMetricBrick/contract decode path)",
      requirement: message,
    };
  }
  return {
    branch:
      args.lane === "proxy"
        ? "hull-render route remote strict lane"
        : "hull-optix-service:/frame scientific preflight",
    requirement: message.length > 0 ? message : "see errorCode",
  };
};

const withTimeoutFetch = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const stableStringify = (value: unknown): string => {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map((entry) => canonical(entry));
    if (input && typeof input === "object") {
      const src = input as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(src).sort((a, b) => a.localeCompare(b))) {
        out[key] = canonical(src[key]);
      }
      return out;
    }
    return input;
  };
  return JSON.stringify(canonical(value));
};

const computeChecksum = (payload: ProofPackPayload): string => {
  const copy = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  delete copy.generatedAt;
  delete copy.checksum;
  return crypto.createHash("sha256").update(stableStringify(copy)).digest("hex");
};

const getHeadCommit = (): string | null => {
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, "");

const parseBooleanQueryFlag = (
  params: URLSearchParams,
  key: string,
  fallback = false,
): boolean => {
  const raw = params.get(key);
  if (raw == null) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized.length === 0) return fallback;
  return ["1", "true", "yes", "on"].includes(normalized);
};

const clampi = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.trunc(value)));

const idx3 = (x: number, y: number, z: number, dims: [number, number, number]): number =>
  z * dims[0] * dims[1] + y * dims[0] + x;

const computeRawSliceExtrema = (slice: Float32Array): OfflineYorkViewAudit["rawExtrema"] => {
  if (slice.length === 0) return { min: null, max: null, absMax: null };
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < slice.length; i += 1) {
    const value = slice[i];
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: null, max: null, absMax: null };
  return { min, max, absMax: Math.max(Math.abs(min), Math.abs(max)) };
};

const computeSliceSignCounts = (slice: Float32Array): OfflineYorkViewAudit["counts"] => {
  let positive = 0;
  let negative = 0;
  let zeroOrNearZero = 0;
  for (let i = 0; i < slice.length; i += 1) {
    const value = slice[i];
    if (!Number.isFinite(value) || Math.abs(value) <= YORK_SIGN_STRUCTURE_EPS) {
      zeroOrNearZero += 1;
    } else if (value > 0) {
      positive += 1;
    } else if (value < 0) {
      negative += 1;
    } else {
      zeroOrNearZero += 1;
    }
  }
  return { positive, negative, zeroOrNearZero, total: slice.length };
};

const hasMeaningfulSignedStructure = (offline: OfflineYorkViewAudit): boolean => {
  if (offline.rawExtrema.absMax == null || offline.rawExtrema.absMax <= 0) return false;
  const structuralFloor = Math.max(offline.rawExtrema.absMax * 1e-3, 1e-45);
  const enoughSignedCells = offline.counts.positive >= 2 && offline.counts.negative >= 2;
  return enoughSignedCells && offline.rawExtrema.absMax >= structuralFloor;
};

export const extractThetaSliceXZMidplane = (
  theta: Float32Array,
  dims: [number, number, number],
): Float32Array => {
  const [nx, ny, nz] = dims;
  const yMid = clampi(Math.floor(ny * 0.5), 0, ny - 1);
  const out = new Float32Array(nx * nz);
  for (let z = 0; z < nz; z += 1) {
    for (let x = 0; x < nx; x += 1) {
      out[z * nx + x] = theta[idx3(x, yMid, z, dims)] ?? 0;
    }
  }
  return out;
};

export const extractThetaSliceXRho = (
  theta: Float32Array,
  dims: [number, number, number],
): Float32Array => {
  const [nx, ny, nz] = dims;
  const rhoBins = Math.max(2, nz);
  const yCenter = (ny - 1) * 0.5;
  const zCenter = (nz - 1) * 0.5;
  const maxRho = Math.max(1e-9, Math.hypot(Math.max(yCenter, 1), Math.max(zCenter, 1)));
  const out = new Float32Array(nx * rhoBins);
  const sum = new Float64Array(rhoBins);
  const count = new Uint32Array(rhoBins);
  for (let x = 0; x < nx; x += 1) {
    sum.fill(0);
    count.fill(0);
    for (let y = 0; y < ny; y += 1) {
      const dy = y - yCenter;
      for (let z = 0; z < nz; z += 1) {
        const dz = z - zCenter;
        const rhoNorm = Math.hypot(dy, dz) / maxRho;
        const rhoBin = clampi(Math.round(rhoNorm * (rhoBins - 1)), 0, rhoBins - 1);
        const value = theta[idx3(x, y, z, dims)] ?? 0;
        sum[rhoBin] += value;
        count[rhoBin] += 1;
      }
    }
    for (let rho = 0; rho < rhoBins; rho += 1) {
      const n = count[rho];
      out[rho * nx + x] = n > 0 ? Number(sum[rho] / n) : 0;
    }
  }
  return out;
};

export const computeOfflineYorkAudit = (args: {
  caseId: CaseId;
  theta: Float32Array | null;
  dims: [number, number, number];
}): CaseOfflineYorkAudit | null => {
  if (!(args.theta instanceof Float32Array)) return null;
  const xzSlice = extractThetaSliceXZMidplane(args.theta, args.dims);
  const xrhoSlice = extractThetaSliceXRho(args.theta, args.dims);
  const byView: OfflineYorkViewAudit[] = [
    {
      view: "york-surface-3p1",
      coordinateMode: "x-z-midplane",
      samplingChoice: "x-z midplane",
      thetaSliceHash: hashFloat32(xzSlice),
      rawExtrema: computeRawSliceExtrema(xzSlice),
      counts: computeSliceSignCounts(xzSlice),
    },
    {
      view: "york-surface-rho-3p1",
      coordinateMode: "x-rho",
      samplingChoice: "x-rho cylindrical remap",
      thetaSliceHash: hashFloat32(xrhoSlice),
      rawExtrema: computeRawSliceExtrema(xrhoSlice),
      counts: computeSliceSignCounts(xrhoSlice),
    },
  ];

  if (args.caseId !== "alcubierre_control") return { byView };
  const [nx, ny, nz] = args.dims;
  const xMid = Math.floor(nx * 0.5);
  let foreHalfPositiveTotal = 0;
  let foreHalfNegativeTotal = 0;
  let aftHalfPositiveTotal = 0;
  let aftHalfNegativeTotal = 0;
  for (let x = 0; x < nx; x += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let z = 0; z < nz; z += 1) {
        const value = args.theta[idx3(x, y, z, args.dims)] ?? 0;
        if (!Number.isFinite(value) || Math.abs(value) <= YORK_SIGN_STRUCTURE_EPS) {
          continue;
        }
        const isFore = x >= xMid;
        if (value > 0) {
          if (isFore) foreHalfPositiveTotal += value;
          else aftHalfPositiveTotal += value;
        } else {
          if (isFore) foreHalfNegativeTotal += value;
          else aftHalfNegativeTotal += value;
        }
      }
    }
  }
  const signedLobeSummary =
    foreHalfPositiveTotal > 0 && aftHalfNegativeTotal < 0
      ? "fore+/aft-"
      : foreHalfNegativeTotal < 0 && aftHalfPositiveTotal > 0
        ? "fore-/aft+"
        : "mixed_or_flat";
  return {
    byView,
    alcubierreSignedLobeSummary: {
      foreHalfPositiveTotal,
      foreHalfNegativeTotal,
      aftHalfPositiveTotal,
      aftHalfNegativeTotal,
      signedLobeSummary,
    },
  };
};

const readControlRequestSelectors = (requestUrl: string | null): ControlRequestSelectors => {
  if (!requestUrl || requestUrl.trim().length === 0) {
    return {
      metricT00Ref: null,
      metricT00Source: null,
      requireCongruentSolve: false,
      requireNhm2CongruentFullSolve: false,
      warpFieldType: null,
    };
  }
  try {
    const parsed = new URL(requestUrl);
    const params = parsed.searchParams;
    return {
      metricT00Ref: asText(params.get("metricT00Ref")),
      metricT00Source: asText(params.get("metricT00Source")),
      requireCongruentSolve: parseBooleanQueryFlag(params, "requireCongruentSolve", false),
      requireNhm2CongruentFullSolve: parseBooleanQueryFlag(
        params,
        "requireNhm2CongruentFullSolve",
        false,
      ),
      warpFieldType: asText(params.get("warpFieldType")),
    };
  } catch {
    return {
      metricT00Ref: null,
      metricT00Source: null,
      requireCongruentSolve: false,
      requireNhm2CongruentFullSolve: false,
      warpFieldType: null,
    };
  }
};

const statusEndpointFromFrameEndpoint = (frameEndpoint: string): string => {
  const trimmed = frameEndpoint.trim();
  if (/\/api\/helix\/hull-render\/status\/?$/i.test(trimmed)) return trimmed;
  if (/\/frame\/?$/i.test(trimmed)) return trimmed.replace(/\/frame\/?$/i, "/status");
  return `${trimmed.replace(/\/+$/, "")}/status`;
};

const fetchRuntimeStatusProvenance = async (
  frameEndpoint: string,
): Promise<ProofPackPayload["provenance"]["runtimeStatus"]> => {
  const statusEndpoint = statusEndpointFromFrameEndpoint(frameEndpoint);
  try {
    const response = await withTimeoutFetch(statusEndpoint, { method: "GET" }, 20_000);
    if (!response.ok) {
      return {
        statusEndpoint,
        serviceVersion: null,
        buildHash: null,
        commitSha: null,
        processStartedAtMs: null,
        runtimeInstanceId: null,
        reachable: false,
      };
    }
    const payload = asRecord(await response.json());
    const rootProvenance = asRecord(payload.provenance);
    const runtime = asRecord(payload.runtime);
    const runtimeProvenance = asRecord(runtime.provenance);
    const remoteStatus = asRecord(payload.remoteStatus);
    const remoteProvenance = asRecord(remoteStatus.provenance);
    const serviceVersion =
      asText(rootProvenance.serviceVersion) ??
      asText(runtimeProvenance.serviceVersion) ??
      asText(remoteProvenance.serviceVersion) ??
      asText(payload.serviceVersion);
    const buildHash =
      asText(rootProvenance.buildHash) ??
      asText(runtimeProvenance.buildHash) ??
      asText(remoteProvenance.buildHash) ??
      asText(payload.buildHash);
    const commitSha =
      asText(rootProvenance.commitSha) ??
      asText(runtimeProvenance.commitSha) ??
      asText(remoteProvenance.commitSha) ??
      asText(payload.commitSha);
    const processStartedAtMs =
      toFiniteNumber(rootProvenance.processStartedAtMs) ??
      toFiniteNumber(runtimeProvenance.processStartedAtMs) ??
      toFiniteNumber(remoteProvenance.processStartedAtMs) ??
      toFiniteNumber(payload.processStartedAtMs);
    const runtimeInstanceId =
      asText(rootProvenance.runtimeInstanceId) ??
      asText(runtimeProvenance.runtimeInstanceId) ??
      asText(remoteProvenance.runtimeInstanceId) ??
      asText(payload.runtimeInstanceId);
    return {
      statusEndpoint,
      serviceVersion,
      buildHash,
      commitSha,
      processStartedAtMs,
      runtimeInstanceId,
      reachable: true,
    };
  } catch {
    return {
      statusEndpoint,
      serviceVersion: null,
      buildHash: null,
      commitSha: null,
      processStartedAtMs: null,
      runtimeInstanceId: null,
      reachable: false,
    };
  }
};

export const buildControlMetricVolumeRef = (
  args: {
    baseUrl: string;
    metricT00Ref: string;
    metricT00Source: string;
    dutyFR: number;
    q: number;
    gammaGeo: number;
    gammaVdB: number;
    zeta: number;
    phase01: number;
    dims?: [number, number, number];
    requireCongruentSolve?: boolean;
    requireNhm2CongruentFullSolve?: boolean;
  },
): HullMetricVolumeRefV1 => {
  const dims = args.dims ?? [48, 48, 48];
  const params = new URLSearchParams();
  params.set("dims", `${dims[0]}x${dims[1]}x${dims[2]}`);
  params.set("time_s", "0");
  params.set("dt_s", "0.01");
  params.set("steps", "1");
  params.set("includeExtra", "1");
  params.set("includeKij", "1");
  params.set("includeMatter", "1");
  params.set("dutyFR", String(args.dutyFR));
  params.set("q", String(args.q));
  params.set("gammaGeo", String(args.gammaGeo));
  params.set("gammaVdB", String(args.gammaVdB));
  params.set("zeta", String(args.zeta));
  params.set("phase01", String(args.phase01));
  params.set("metricT00Source", args.metricT00Source);
  params.set("metricT00Ref", args.metricT00Ref);
  params.set("format", "raw");
  if (args.requireCongruentSolve) {
    params.set("requireCongruentSolve", "1");
  }
  if (args.requireNhm2CongruentFullSolve) {
    params.set("requireNhm2CongruentFullSolve", "1");
  }
  const url = `${normalizeBaseUrl(args.baseUrl)}/api/helix/gr-evolve-brick?${params.toString()}`;
  return {
    kind: "gr-evolve-brick",
    url,
    chart: "comoving_cartesian",
    source: `york-control.${args.metricT00Ref}`,
    dims,
    updatedAt: Date.now(),
    hash: crypto.createHash("sha256").update(url).digest("hex"),
  };
};

const loadNhm2MetricVolumeRef = (snapshotPath: string): HullMetricVolumeRefV1 => {
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`NHM2 snapshot evidence is missing: ${snapshotPath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as Record<string, unknown>;
  const rawMetricVolumeRef = asRecord(parsed.metricVolumeRef);
  const url = asText(rawMetricVolumeRef.url);
  if (!url) {
    throw new Error(`NHM2 snapshot evidence has invalid metricVolumeRef: ${snapshotPath}`);
  }
  const dimsRaw = rawMetricVolumeRef.dims;
  const dims =
    Array.isArray(dimsRaw) && dimsRaw.length >= 3
      ? [
          Math.max(1, Math.floor(toFiniteNumber(dimsRaw[0]) ?? 48)),
          Math.max(1, Math.floor(toFiniteNumber(dimsRaw[1]) ?? 48)),
          Math.max(1, Math.floor(toFiniteNumber(dimsRaw[2]) ?? 48)),
        ]
      : undefined;
  const metricVolumeRef: HullMetricVolumeRefV1 = {
    kind: "gr-evolve-brick",
    url,
    chart: asText(rawMetricVolumeRef.chart) ?? "comoving_cartesian",
    source: asText(rawMetricVolumeRef.source) ?? "york-control.nhm2-certified",
    updatedAt: toFiniteNumber(rawMetricVolumeRef.updatedAt) ?? Date.now(),
    hash: asText(rawMetricVolumeRef.hash) ?? "",
    dims,
  };
  if (!metricVolumeRef.hash) {
    metricVolumeRef.hash = resolveMetricRefHash(metricVolumeRef);
  }
  return metricVolumeRef;
};

const buildYorkPayload = (args: {
  caseId: CaseId;
  renderView: HullScientificRenderView;
  metricVolumeRef: HullMetricVolumeRefV1;
  requireCongruentNhm2FullSolve: boolean;
  width: number;
  height: number;
}): HullMisRenderRequestV1 => {
  const solveByCase: Record<CaseId, { beta: number; sigma: number; R: number }> = {
    alcubierre_control: { beta: 0.2, sigma: 6, R: 1.1 },
    natario_control: { beta: 0.02, sigma: 6, R: 1.1 },
    nhm2_certified: { beta: 0.02, sigma: 6, R: 1.1 },
  };
  const solve = solveByCase[args.caseId];
  return {
    version: 1,
    requestId: `york-control-family-${args.caseId}-${args.renderView}`,
    width: args.width,
    height: args.height,
    dpr: 1,
    backendHint: "mis-path-tracing",
    timestampMs: Date.now(),
    skyboxMode: "geodesic",
    solve: {
      beta: solve.beta,
      alpha: 1,
      sigma: solve.sigma,
      R: solve.R,
      chart: "comoving_cartesian",
    },
    metricVolumeRef: {
      ...args.metricVolumeRef,
      hash: args.metricVolumeRef.hash ?? resolveMetricRefHash(args.metricVolumeRef),
      updatedAt: args.metricVolumeRef.updatedAt ?? Date.now(),
      chart: args.metricVolumeRef.chart ?? "comoving_cartesian",
    },
    scienceLane: {
      requireScientificFrame: true,
      requireCanonicalTensorVolume: true,
      requireCongruentNhm2FullSolve: args.requireCongruentNhm2FullSolve,
      requireIntegralSignal: true,
      renderView: args.renderView,
      samplingMode: "trilinear",
      minVolumeDims: [32, 32, 32],
    },
  };
};

const parseYorkViewSummary = (
  view: HullScientificRenderView,
  lane: YorkRenderLane,
  endpoint: string,
  httpStatus: number,
  response: HullMisRenderResponseV1,
): YorkViewSummary => {
  const cert = response.renderCertificate ?? null;
  const diagnostics = {
    ...asRecord(response.diagnostics ?? {}),
    ...asRecord(cert?.diagnostics ?? {}),
  };
  return {
    view,
    ok: response.ok === true,
    backend: asText(response.backend),
    scientificTier: asText(response.diagnostics?.scientificTier),
    error: null,
    sourceLane: lane,
    endpoint,
    httpStatus,
    errorCode: null,
    responseMessage: null,
    preflightBranch: null,
    preflightRequirement: null,
    laneResults: [],
    note: asText(response.diagnostics?.note),
    render: {
      view: asText(cert?.render?.view) as HullScientificRenderView | null,
      field_key: asText(cert?.render?.field_key),
      slice_plane: asText(cert?.render?.slice_plane),
      coordinate_mode: asText(cert?.render?.coordinate_mode),
      normalization: asText(cert?.render?.normalization),
      magnitude_mode: asText(cert?.render?.magnitude_mode),
      surface_height: asText(cert?.render?.surface_height),
      support_overlay: asText(cert?.render?.support_overlay),
    },
    identity: {
      metric_ref_hash: asText(cert?.metric_ref_hash),
      timestamp_ms: toFiniteNumber(cert?.timestamp_ms),
      chart: asText(cert?.chart),
      observer: asText(cert?.observer),
      theta_definition: asText(cert?.theta_definition),
      kij_sign_convention: asText(cert?.kij_sign_convention),
      unit_system: asText(cert?.unit_system),
    },
    rawExtrema: {
      min: toFiniteNumber(diagnostics.theta_min_raw ?? diagnostics.theta_min),
      max: toFiniteNumber(diagnostics.theta_max_raw ?? diagnostics.theta_max),
      absMax: toFiniteNumber(diagnostics.theta_abs_max_raw ?? diagnostics.theta_abs_max),
    },
    displayExtrema: {
      min: toFiniteNumber(diagnostics.theta_min_display ?? diagnostics.theta_min),
      max: toFiniteNumber(diagnostics.theta_max_display ?? diagnostics.theta_max),
      absMax: toFiniteNumber(diagnostics.theta_abs_max_display ?? diagnostics.theta_abs_max),
      rangeMethod: asText(diagnostics.display_range_method),
      gain: toFiniteNumber(diagnostics.display_gain),
      heightScale: toFiniteNumber(diagnostics.height_scale),
    },
    nearZeroTheta:
      typeof diagnostics.near_zero_theta === "boolean"
        ? diagnostics.near_zero_theta
        : null,
    samplingChoice: asText(diagnostics.sampling_choice),
    supportOverlapPct: toFiniteNumber(diagnostics.shell_theta_overlap_pct),
    supportedThetaFraction: toFiniteNumber(diagnostics.supported_theta_fraction),
    hashes: {
      certificate_hash: asText(cert?.certificate_hash),
      frame_hash: asText(cert?.frame_hash),
      theta_channel_hash: asText(diagnostics.theta_channel_hash),
      slice_array_hash: asText(diagnostics.slice_array_hash),
      normalized_slice_hash: asText(diagnostics.normalized_slice_hash),
      support_mask_slice_hash: asText(diagnostics.support_mask_slice_hash),
      shell_masked_slice_hash: asText(diagnostics.shell_masked_slice_hash),
    },
  };
};

const isRetryableRenderFailure = (status: number, errorText: string | null): boolean => {
  if (status >= 500) return true;
  if (!errorText) return false;
  if (RETRYABLE_RENDER_ERRORS.has(errorText)) return true;
  if (errorText.startsWith("metric_ref_http_")) return true;
  return false;
};

const renderYorkView = async (args: {
  frameEndpoint: string;
  payload: HullMisRenderRequestV1;
  view: HullScientificRenderView;
  lane: YorkRenderLane;
}): Promise<YorkViewSummary> => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await withTimeoutFetch(
        args.frameEndpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args.payload),
        },
        65_000,
      );
      const json = (await response.json()) as HullMisRenderResponseV1 | Record<string, unknown>;
      if (!response.ok || !(json as HullMisRenderResponseV1).renderCertificate) {
        const errorBody = asRecord(json);
        const errorText = asText(errorBody.error);
        const responseMessage = asText(errorBody.message);
        if (attempt < 2 && isRetryableRenderFailure(response.status, errorText)) {
          await sleep(250 * attempt);
          continue;
        }
        const preflight = mapPreflightFailure({
          lane: args.lane,
          errorCode: errorText,
          responseMessage,
        });
        return buildErrorYorkViewSummary(
          args.view,
          {
            lane: args.lane,
            endpoint: args.frameEndpoint,
            httpStatus: response.status,
            errorCode: errorText,
            responseMessage,
            preflightBranch: preflight.branch,
            preflightRequirement: preflight.requirement,
            message: `http_${response.status}: ${errorText ?? response.statusText}`,
          },
        );
      }
      return parseYorkViewSummary(
        args.view,
        args.lane,
        args.frameEndpoint,
        response.status,
        json as HullMisRenderResponseV1,
      );
    } catch (error) {
      if (attempt < 2) {
        await sleep(250 * attempt);
        continue;
      }
      return buildErrorYorkViewSummary(
        args.view,
        {
          lane: args.lane,
          endpoint: args.frameEndpoint,
          httpStatus: null,
          errorCode: null,
          responseMessage: null,
          preflightBranch: null,
          preflightRequirement: null,
          message: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }
  return buildErrorYorkViewSummary(args.view, {
    lane: args.lane,
    endpoint: args.frameEndpoint,
    httpStatus: null,
    errorCode: null,
    responseMessage: null,
    preflightBranch: null,
    preflightRequirement: null,
    message: "unknown_render_failure",
  });
};

const buildErrorYorkViewSummary = (
  view: HullScientificRenderView,
  failure: {
    lane: YorkRenderLane;
    endpoint: string;
    httpStatus: number | null;
    errorCode: string | null;
    responseMessage: string | null;
    preflightBranch: string | null;
    preflightRequirement: string | null;
    message: string;
  },
): YorkViewSummary => ({
  view,
  ok: false,
  backend: null,
  scientificTier: null,
  error: failure.message,
  sourceLane: failure.lane,
  endpoint: failure.endpoint,
  httpStatus: failure.httpStatus,
  errorCode: failure.errorCode,
  responseMessage: failure.responseMessage,
  preflightBranch: failure.preflightBranch,
  preflightRequirement: failure.preflightRequirement,
  laneResults: [],
  note: null,
  render: {
    view: null,
    field_key: null,
    slice_plane: null,
    coordinate_mode: null,
    normalization: null,
    magnitude_mode: null,
    surface_height: null,
    support_overlay: null,
  },
  identity: {
    metric_ref_hash: null,
    timestamp_ms: null,
    chart: null,
    observer: null,
    theta_definition: null,
    kij_sign_convention: null,
    unit_system: null,
  },
  rawExtrema: { min: null, max: null, absMax: null },
  displayExtrema: {
    min: null,
    max: null,
    absMax: null,
    rangeMethod: null,
    gain: null,
    heightScale: null,
  },
  nearZeroTheta: null,
  samplingChoice: null,
  supportOverlapPct: null,
  supportedThetaFraction: null,
  hashes: {
    certificate_hash: null,
    frame_hash: null,
    theta_channel_hash: null,
    slice_array_hash: null,
    normalized_slice_hash: null,
    support_mask_slice_hash: null,
    shell_masked_slice_hash: null,
  },
});

const computeThetaPlusKTraceConsistency = (theta: Float32Array, kTrace: Float32Array) => {
  const n = Math.min(theta.length, kTrace.length);
  if (n <= 0) {
    return { rms: null, maxAbs: null, mean: null, sampleCount: 0, consistent: false };
  }
  let sum = 0;
  let sumSq = 0;
  let maxAbs = 0;
  let sampleCount = 0;
  let maxSignal = 0;
  for (let i = 0; i < n; i += 1) {
    const tv = Number(theta[i] ?? Number.NaN);
    const kv = Number(kTrace[i] ?? Number.NaN);
    if (!Number.isFinite(tv) || !Number.isFinite(kv)) continue;
    const residual = tv + kv;
    sum += residual;
    sumSq += residual * residual;
    maxAbs = Math.max(maxAbs, Math.abs(residual));
    maxSignal = Math.max(maxSignal, Math.abs(tv), Math.abs(kv));
    sampleCount += 1;
  }
  if (sampleCount <= 0) {
    return { rms: null, maxAbs: null, mean: null, sampleCount: 0, consistent: false };
  }
  const mean = sum / sampleCount;
  const rms = Math.sqrt(sumSq / sampleCount);
  const tolerance = Math.max(1e-12, maxSignal * 1e-6);
  return {
    rms,
    maxAbs,
    mean,
    sampleCount,
    consistent: maxAbs <= tolerance,
  };
};

export const readSourceFamilyEvidence = (snapshot: {
  stats: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
}): SourceFamilyEvidence => {
  const hasSourceFamilyEvidence = (mapping: Record<string, unknown> | null): boolean => {
    if (!mapping) return false;
    return (
      asText(mapping.family_id) !== null ||
      asText(mapping.metricT00Ref) !== null ||
      asText(mapping.warpFieldType) !== null ||
      asText(mapping.source_branch) !== null ||
      asText(mapping.shape_function_id) !== null
    );
  };
  const statsRoot = asRecord(snapshot.stats);
  const stressEnergyStats = asRecord(statsRoot?.stressEnergy);
  const preferredMapping = asRecord(stressEnergyStats?.mapping);
  const fallbackStressEnergy = asRecord(snapshot.meta?.stressEnergy);
  const fallbackMapping = asRecord(fallbackStressEnergy?.mapping);
  const selectedMapping = hasSourceFamilyEvidence(preferredMapping)
    ? preferredMapping
    : hasSourceFamilyEvidence(fallbackMapping)
      ? fallbackMapping
      : null;
  return {
    family_id: asText(selectedMapping?.family_id),
    metricT00Ref: asText(selectedMapping?.metricT00Ref),
    warpFieldType: asText(selectedMapping?.warpFieldType),
    source_branch: asText(selectedMapping?.source_branch),
    shape_function_id: asText(selectedMapping?.shape_function_id),
  };
};

const runCase = async (args: {
  caseId: CaseId;
  label: string;
  familyExpectation: CaseResult["familyExpectation"];
  metricVolumeRef: HullMetricVolumeRefV1;
  frameEndpoint: string;
  proxyFrameEndpoint: string | null;
  compareDirectAndProxy: boolean;
  requireCongruentNhm2FullSolve: boolean;
  yorkViews: HullScientificRenderView[];
  frameSize: { width: number; height: number };
}): Promise<CaseResult> => {
  const perView: YorkViewSummary[] = [];
  const laneConfigs: Array<{ lane: YorkRenderLane; endpoint: string }> =
    args.compareDirectAndProxy && args.proxyFrameEndpoint
      ? [
          { lane: "direct", endpoint: args.frameEndpoint },
          { lane: "proxy", endpoint: args.proxyFrameEndpoint },
        ]
      : [{ lane: "single", endpoint: args.frameEndpoint }];
  for (const view of args.yorkViews) {
    const payload = buildYorkPayload({
      caseId: args.caseId,
      renderView: view,
      metricVolumeRef: args.metricVolumeRef,
      requireCongruentNhm2FullSolve: args.requireCongruentNhm2FullSolve,
      width: args.frameSize.width,
      height: args.frameSize.height,
    });
    const laneSummaries: YorkViewSummary[] = [];
    for (const laneConfig of laneConfigs) {
      laneSummaries.push(
        await renderYorkView({
          frameEndpoint: laneConfig.endpoint,
          payload,
          view,
          lane: laneConfig.lane,
        }),
      );
    }
    const selected =
      laneSummaries.find((entry) => entry.ok) ??
      laneSummaries.find((entry) => entry.sourceLane === "direct") ??
      laneSummaries[0];
    const laneResults: YorkLaneResultSummary[] = laneSummaries.map((entry) => ({
      lane: entry.sourceLane ?? "single",
      endpoint: entry.endpoint ?? args.frameEndpoint,
      ok: entry.ok,
      httpStatus: entry.httpStatus,
      errorCode: entry.errorCode,
      responseMessage: entry.responseMessage,
      preflightBranch: entry.preflightBranch,
      preflightRequirement: entry.preflightRequirement,
      error: entry.error,
    }));
    perView.push({
      ...selected,
      laneResults,
    });
  }

  let snapshotMetrics: CaseSnapshotMetrics | null = null;
  let offlineYorkAudit: CaseOfflineYorkAudit | null = null;
  try {
    const snapshot = await loadHullScientificSnapshot(args.metricVolumeRef, {
      baseUrl: null,
      timeoutMs: 120_000,
    });
    const theta = snapshot.channels.theta?.data;
    const kTrace = snapshot.channels.K_trace?.data;
    const sourceFamily = readSourceFamilyEvidence(snapshot);
    snapshotMetrics = {
      dims: snapshot.dims,
      resolvedUrl: snapshot.resolvedUrl,
      metricRefHash: snapshot.metricRefHash,
      requestMetricRefHash: resolveMetricRefHash(args.metricVolumeRef),
      source: snapshot.source,
      chart: snapshot.chart,
      channelHashes: {
        theta: theta instanceof Float32Array ? hashFloat32(theta) : null,
        K_trace: kTrace instanceof Float32Array ? hashFloat32(kTrace) : null,
      },
      sourceFamily,
      thetaPlusKTrace:
        theta instanceof Float32Array && kTrace instanceof Float32Array
          ? computeThetaPlusKTraceConsistency(theta, kTrace)
          : {
              rms: null,
              maxAbs: null,
              mean: null,
              sampleCount: 0,
              consistent: false,
            },
    };
    offlineYorkAudit = computeOfflineYorkAudit({
      caseId: args.caseId,
      theta: theta instanceof Float32Array ? theta : null,
      dims: snapshot.dims,
    });
  } catch {
    snapshotMetrics = null;
    offlineYorkAudit = null;
  }

  const primaryViewId = args.yorkViews.includes("york-surface-rho-3p1")
    ? "york-surface-rho-3p1"
    : args.yorkViews[0];
  const primaryView = perView.find((entry) => entry.view === primaryViewId) ?? null;
  return {
    caseId: args.caseId,
    label: args.label,
    familyExpectation: args.familyExpectation,
    metricVolumeRef: args.metricVolumeRef,
    perView,
    primaryYork: {
      view: primaryViewId,
      rawExtrema: primaryView?.rawExtrema ?? null,
      displayExtrema: primaryView?.displayExtrema ?? null,
      nearZeroTheta: primaryView?.nearZeroTheta ?? null,
      coordinateMode: primaryView?.render.coordinate_mode ?? null,
      samplingChoice: primaryView?.samplingChoice ?? null,
      supportOverlapPct: primaryView?.supportOverlapPct ?? null,
    },
    snapshotMetrics,
    offlineYorkAudit,
  };
};

export const buildControlDebug = (cases: CaseResult[]): ControlDebugEntry[] =>
  cases.map((entry) => {
    const requestUrl = asText(entry.metricVolumeRef.url);
    const selectors = readControlRequestSelectors(requestUrl);
    return {
      caseId: entry.caseId,
      label: entry.label,
      requestUrl,
      requestSelectors: selectors,
      resolvedMetricRefHash: entry.snapshotMetrics?.metricRefHash ?? null,
      requestMetricRefHash:
        entry.snapshotMetrics?.requestMetricRefHash ??
        (entry.metricVolumeRef ? resolveMetricRefHash(entry.metricVolumeRef) : null),
      thetaHash: entry.snapshotMetrics?.channelHashes.theta ?? null,
      kTraceHash: entry.snapshotMetrics?.channelHashes.K_trace ?? null,
      brickSource: entry.snapshotMetrics?.source ?? null,
      chart: entry.snapshotMetrics?.chart ?? null,
      family_id: entry.snapshotMetrics?.sourceFamily.family_id ?? null,
      metricT00Ref: entry.snapshotMetrics?.sourceFamily.metricT00Ref ?? null,
      warpFieldType: entry.snapshotMetrics?.sourceFamily.warpFieldType ?? null,
      source_branch: entry.snapshotMetrics?.sourceFamily.source_branch ?? null,
      shape_function_id: entry.snapshotMetrics?.sourceFamily.shape_function_id ?? null,
    };
  });

const hasStrictYorkDiagnostics = (summary: YorkViewSummary): boolean => {
  const raw = summary.rawExtrema;
  const display = summary.displayExtrema;
  const identity = summary.identity;
  return (
    Number.isFinite(raw.min ?? Number.NaN) &&
    Number.isFinite(raw.max ?? Number.NaN) &&
    Number.isFinite(raw.absMax ?? Number.NaN) &&
    Number.isFinite(display.min ?? Number.NaN) &&
    Number.isFinite(display.max ?? Number.NaN) &&
    Number.isFinite(display.absMax ?? Number.NaN) &&
    typeof display.rangeMethod === "string" &&
    display.rangeMethod.trim().length > 0 &&
    Number.isFinite(display.gain ?? Number.NaN) &&
    Number.isFinite(display.heightScale ?? Number.NaN) &&
    typeof summary.nearZeroTheta === "boolean" &&
    typeof summary.samplingChoice === "string" &&
    summary.samplingChoice.trim().length > 0 &&
    typeof identity.metric_ref_hash === "string" &&
    identity.metric_ref_hash.trim().length > 0 &&
    Number.isFinite(identity.timestamp_ms ?? Number.NaN) &&
    typeof identity.theta_definition === "string" &&
    identity.theta_definition.trim().length > 0
  );
};

const requiredYorkHashesByView: Record<HullScientificRenderView, Array<keyof YorkViewSummary["hashes"]>> =
  {
    "york-time-3p1": ["theta_channel_hash", "slice_array_hash"],
    "york-surface-3p1": ["theta_channel_hash", "slice_array_hash"],
    "york-surface-rho-3p1": ["theta_channel_hash", "slice_array_hash"],
    "york-topology-normalized-3p1": [
      "theta_channel_hash",
      "slice_array_hash",
      "normalized_slice_hash",
    ],
    "york-shell-map-3p1": [
      "theta_channel_hash",
      "slice_array_hash",
      "support_mask_slice_hash",
      "shell_masked_slice_hash",
    ],
    "diagnostic-quad": ["theta_channel_hash", "slice_array_hash"],
    "paper-rho": ["theta_channel_hash", "slice_array_hash"],
    "transport-3p1": ["theta_channel_hash", "slice_array_hash"],
    "shift-shell-3p1": ["theta_channel_hash", "slice_array_hash"],
    "full-atlas": ["theta_channel_hash", "slice_array_hash"],
  };

export const evaluateProofPackPreconditions = (args: {
  yorkViews: HullScientificRenderView[];
  cases: CaseResult[];
  runtimeStatus: ProofPackPayload["provenance"]["runtimeStatus"];
}): { preconditions: ProofPackPreconditions; guardFailures: GuardFailure[] } => {
  const guardFailures: GuardFailure[] = [];
  const requiredViews = ensureRequiredYorkViews([...args.yorkViews]);

  for (const entry of args.cases) {
    for (const requiredView of requiredViews) {
      const summary = entry.perView.find((candidate) => candidate.view === requiredView);
      if (!summary) {
        guardFailures.push({
          code: "proof_pack_required_view_missing",
          detail: `${entry.caseId}:${requiredView}`,
        });
        continue;
      }
      if (!summary.ok || summary.error) {
        guardFailures.push({
          code: "proof_pack_required_view_render_failed",
          detail: `${entry.caseId}:${requiredView}:lane=${summary.sourceLane ?? "null"}:status=${summary.httpStatus ?? "null"}:error=${summary.errorCode ?? "null"}:message=${summary.responseMessage ?? summary.error ?? "render_failed"}:branch=${summary.preflightBranch ?? "unknown"}:requirement=${summary.preflightRequirement ?? "unknown"}`,
        });
        continue;
      }
      if (!summary.render.view || summary.render.view === "diagnostic-quad") {
        guardFailures.push({
          code: "proof_pack_required_view_fell_back_to_diagnostic_quad",
          detail: `${entry.caseId}:${requiredView}`,
        });
      }
      if (summary.render.view !== requiredView) {
        guardFailures.push({
          code: "proof_pack_required_view_mismatch",
          detail: `${entry.caseId}:requested=${requiredView}:rendered=${summary.render.view ?? "null"}`,
        });
      }
      if (!hasStrictYorkDiagnostics(summary)) {
        guardFailures.push({
          code: "proof_pack_required_view_missing_strict_york_diagnostics",
          detail: `${entry.caseId}:${requiredView}`,
        });
      }
      const requiredHashes = requiredYorkHashesByView[requiredView] ?? [
        "theta_channel_hash",
        "slice_array_hash",
      ];
      for (const hashKey of requiredHashes) {
        const hashValue = summary.hashes[hashKey];
        if (typeof hashValue !== "string" || hashValue.trim().length === 0) {
          guardFailures.push({
            code: "proof_pack_required_view_missing_provenance_hash",
            detail: `${entry.caseId}:${requiredView}:${hashKey}`,
          });
        }
      }
    }
  }

  const alc = args.cases.find((entry) => entry.caseId === "alcubierre_control") ?? null;
  const nat = args.cases.find((entry) => entry.caseId === "natario_control") ?? null;
  const alcUrl = asText(alc?.metricVolumeRef?.url ?? null);
  const natUrl = asText(nat?.metricVolumeRef?.url ?? null);
  const controlRequestUrlsDiffer =
    typeof alcUrl === "string" &&
    alcUrl.length > 0 &&
    typeof natUrl === "string" &&
    natUrl.length > 0 &&
    alcUrl !== natUrl;
  const alcThetaHash = alc?.snapshotMetrics?.channelHashes.theta ?? null;
  const natThetaHash = nat?.snapshotMetrics?.channelHashes.theta ?? null;
  const alcKTraceHash = alc?.snapshotMetrics?.channelHashes.K_trace ?? null;
  const natKTraceHash = nat?.snapshotMetrics?.channelHashes.K_trace ?? null;
  const controlThetaHashesEqual =
    typeof alcThetaHash === "string" &&
    alcThetaHash.trim().length > 0 &&
    typeof natThetaHash === "string" &&
    natThetaHash.trim().length > 0 &&
    alcThetaHash === natThetaHash;
  const controlKTraceHashesEqual =
    typeof alcKTraceHash === "string" &&
    alcKTraceHash.trim().length > 0 &&
    typeof natKTraceHash === "string" &&
    natKTraceHash.trim().length > 0 &&
    alcKTraceHash === natKTraceHash;
  const controlSourceMappingVisible = [alc, nat].every((entry) => {
    const source = asText(entry?.snapshotMetrics?.source ?? null);
    const family = entry?.snapshotMetrics?.sourceFamily;
    return (
      typeof source === "string" &&
      source.trim().length > 0 &&
      typeof family?.family_id === "string" &&
      family.family_id.trim().length > 0 &&
      typeof family.metricT00Ref === "string" &&
      family.metricT00Ref.trim().length > 0 &&
      typeof family.warpFieldType === "string" &&
      family.warpFieldType.trim().length > 0 &&
      typeof family.source_branch === "string" &&
      family.source_branch.trim().length > 0 &&
      typeof family.shape_function_id === "string" &&
      family.shape_function_id.trim().length > 0
    );
  });
  for (const controlCase of [alc, nat]) {
    if (!controlCase) continue;
    const thetaHash = asText(controlCase.snapshotMetrics?.channelHashes.theta ?? null);
    const kTraceHash = asText(controlCase.snapshotMetrics?.channelHashes.K_trace ?? null);
    const hasProvenanceHash =
      (typeof thetaHash === "string" && thetaHash.length > 0) ||
      (typeof kTraceHash === "string" && kTraceHash.length > 0);
    if (!hasProvenanceHash) continue;
    const family = controlCase.snapshotMetrics?.sourceFamily;
    const missingFields: string[] = [];
    if (!asText(family?.family_id ?? null)) missingFields.push("family_id");
    if (!asText(family?.warpFieldType ?? null)) missingFields.push("warpFieldType");
    if (!asText(family?.source_branch ?? null)) missingFields.push("source_branch");
    if (missingFields.length > 0) {
      guardFailures.push({
        code: "proof_pack_control_mapping_evidence_missing_in_payload",
        detail: `${controlCase.caseId}:missing=${missingFields.join(",")}:thetaHash=${thetaHash ?? "null"}:kTraceHash=${kTraceHash ?? "null"}`,
      });
    }
  }
  if (controlRequestUrlsDiffer && controlThetaHashesEqual && controlKTraceHashesEqual) {
    guardFailures.push({
      code: "proof_pack_control_theta_hash_collision",
      detail: `alc_url=${alcUrl} nat_url=${natUrl} theta_hash=${alcThetaHash} K_trace_hash=${alcKTraceHash}`,
    });
  }
  if (!controlRequestUrlsDiffer) {
    guardFailures.push({
      code: "proof_pack_control_request_url_not_distinct",
      detail: `alc_url=${alcUrl ?? "null"} nat_url=${natUrl ?? "null"}`,
    });
  }
  const controlsIndependent =
    controlRequestUrlsDiffer &&
    controlSourceMappingVisible &&
    (
      (typeof alcThetaHash === "string" &&
        alcThetaHash.trim().length > 0 &&
        typeof natThetaHash === "string" &&
        natThetaHash.trim().length > 0 &&
        alcThetaHash !== natThetaHash) ||
      (typeof alcKTraceHash === "string" &&
        alcKTraceHash.trim().length > 0 &&
        typeof natKTraceHash === "string" &&
        natKTraceHash.trim().length > 0 &&
        alcKTraceHash !== natKTraceHash)
    );
  if (!controlSourceMappingVisible) {
    guardFailures.push({
      code: "proof_pack_controls_collapsed_source_branch_missing",
      detail: `alc_source=${alc?.snapshotMetrics?.source ?? "null"} nat_source=${nat?.snapshotMetrics?.source ?? "null"} alc_source_branch=${alc?.snapshotMetrics?.sourceFamily.source_branch ?? "null"} nat_source_branch=${nat?.snapshotMetrics?.sourceFamily.source_branch ?? "null"}`,
    });
  }
  if (!controlsIndependent) {
    guardFailures.push({
      code: "proof_pack_controls_not_independent",
      detail: `alc_theta_hash=${alcThetaHash ?? "null"} nat_theta_hash=${natThetaHash ?? "null"} alc_k_trace_hash=${alcKTraceHash ?? "null"} nat_k_trace_hash=${natKTraceHash ?? "null"}`,
    });
    if (controlSourceMappingVisible && controlRequestUrlsDiffer) {
      guardFailures.push({
        code: "proof_pack_controls_diverged_upstream_but_collapsed_later",
        detail: `alc_theta_hash=${alcThetaHash ?? "null"} nat_theta_hash=${natThetaHash ?? "null"} alc_k_trace_hash=${alcKTraceHash ?? "null"} nat_k_trace_hash=${natKTraceHash ?? "null"}`,
      });
    }
  }

  const allRequiredViewsRendered = !guardFailures.some((failure) =>
    failure.code.startsWith("proof_pack_required_view_"),
  );
  const provenanceHashesPresent = !guardFailures.some(
    (failure) => failure.code === "proof_pack_required_view_missing_provenance_hash",
  );
  const runtimeStatusProvenancePresent =
    args.runtimeStatus.reachable &&
    typeof args.runtimeStatus.serviceVersion === "string" &&
    args.runtimeStatus.serviceVersion.trim().length > 0 &&
    Number.isFinite(args.runtimeStatus.processStartedAtMs ?? Number.NaN) &&
    typeof args.runtimeStatus.runtimeInstanceId === "string" &&
    args.runtimeStatus.runtimeInstanceId.trim().length > 0;
  if (!runtimeStatusProvenancePresent) {
    guardFailures.push({
      code: "proof_pack_runtime_status_provenance_missing",
      detail: `statusEndpoint=${args.runtimeStatus.statusEndpoint}`,
    });
  }
  if (!args.runtimeStatus.buildHash || args.runtimeStatus.buildHash.trim().length === 0) {
    guardFailures.push({
      code: "proof_pack_runtime_status_build_hash_missing",
      detail: `statusEndpoint=${args.runtimeStatus.statusEndpoint}`,
    });
  }
  if (!args.runtimeStatus.commitSha || args.runtimeStatus.commitSha.trim().length === 0) {
    guardFailures.push({
      code: "proof_pack_runtime_status_commit_sha_missing",
      detail: `statusEndpoint=${args.runtimeStatus.statusEndpoint}`,
    });
  }

  const preconditions: ProofPackPreconditions = {
    controlsIndependent,
    allRequiredViewsRendered,
    provenanceHashesPresent,
    runtimeStatusProvenancePresent,
    readyForFamilyVerdict:
      controlsIndependent &&
      allRequiredViewsRendered &&
      provenanceHashesPresent &&
      runtimeStatusProvenancePresent,
  };
  return { preconditions, guardFailures };
};

export const decideControlFamilyVerdict = (args: {
  preconditions: ProofPackPreconditions;
  alcStrong: boolean;
  alcSignalSufficient?: boolean;
  natLow: boolean;
  nhm2Low: boolean;
  nhm2IntendedAlcubierre: boolean;
  yorkCongruence?: YorkCongruenceEvaluation;
}): DecisionVerdict => {
  if (!args.preconditions.readyForFamilyVerdict) return "inconclusive";
  if (args.yorkCongruence?.rhoRemapMismatch) return "proof_pack_york_rho_remap_mismatch";
  if (args.yorkCongruence?.hashMismatch) return "proof_pack_york_slice_hash_mismatch";
  if (args.yorkCongruence?.nearZeroSuppressionMismatch) {
    return "proof_pack_york_near_zero_suppression_mismatch";
  }
  if (args.yorkCongruence?.downstreamRenderMismatch) {
    return "proof_pack_york_downstream_render_mismatch";
  }
  if (args.alcSignalSufficient === false) return "inconclusive";
  if (!args.alcStrong) return "renderer_or_conversion_wrong";
  if (args.alcStrong && args.natLow && args.nhm2Low && args.nhm2IntendedAlcubierre) {
    return "solve_family_mismatch";
  }
  if (args.alcStrong && args.natLow && args.nhm2Low) return "nhm2_low_expansion_family";
  if (args.alcStrong && args.natLow) return "renderer_fine_controls_consistent";
  return "inconclusive";
};

const approxEqual = (a: number | null, b: number | null, tol = 1e-15): boolean => {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= tol;
};

export const evaluateYorkSliceCongruence = (cases: CaseResult[]): YorkCongruenceEvaluation => {
  const guardFailures: GuardFailure[] = [];
  let hashMismatch = false;
  let rhoRemapMismatch = false;
  let nearZeroSuppressionMismatch = false;
  let downstreamRenderMismatch = false;
  for (const entry of cases) {
    const offlineByView = new Map(
      (entry.offlineYorkAudit?.byView ?? []).map((view) => [view.view, view]),
    );
    for (const view of ["york-surface-3p1", "york-surface-rho-3p1"] as const) {
      const rendered = entry.perView.find((candidate) => candidate.view === view);
      const offline = offlineByView.get(view);
      if (!rendered || !offline) continue;
      if (!rendered.hashes.slice_array_hash || !offline.thetaSliceHash) continue;
      const hashesMatch = rendered.hashes.slice_array_hash === offline.thetaSliceHash;
      if (!hashesMatch) {
        hashMismatch = true;
        if (view === "york-surface-rho-3p1") rhoRemapMismatch = true;
        guardFailures.push({
          code:
            view === "york-surface-rho-3p1"
              ? "proof_pack_york_rho_remap_mismatch"
              : "proof_pack_york_slice_hash_mismatch",
          detail: `${entry.caseId}:${view}:offline=${offline.thetaSliceHash}:rendered=${rendered.hashes.slice_array_hash}`,
        });
      }
      const extremaMatch =
        approxEqual(offline.rawExtrema.min, rendered.rawExtrema.min) &&
        approxEqual(offline.rawExtrema.max, rendered.rawExtrema.max) &&
        approxEqual(offline.rawExtrema.absMax, rendered.rawExtrema.absMax);
      const semanticsMatch =
        rendered.render.coordinate_mode === offline.coordinateMode &&
        rendered.samplingChoice === offline.samplingChoice;
      if (hashesMatch && (!extremaMatch || !semanticsMatch)) {
        downstreamRenderMismatch = true;
        guardFailures.push({
          code: "proof_pack_york_slice_hash_mismatch",
          detail: `${entry.caseId}:${view}:hash_match=true:extrema_match=${extremaMatch}:semantics_match=${semanticsMatch}:coordinate_mode=${rendered.render.coordinate_mode ?? "null"}:sampling_choice=${rendered.samplingChoice ?? "null"}`,
        });
      }
      const structureMeaningful = hasMeaningfulSignedStructure(offline);
      const flattened =
        rendered.nearZeroTheta === true &&
        ((rendered.displayExtrema.absMax ?? 0) <= YORK_NEAR_ZERO_THETA_ABS_THRESHOLD ||
          (rendered.displayExtrema.heightScale ?? 0) <= 1e-12);
      if (hashesMatch && structureMeaningful && flattened) {
        nearZeroSuppressionMismatch = true;
        guardFailures.push({
          code: "proof_pack_york_near_zero_suppression_mismatch",
          detail: `${entry.caseId}:${view}:raw_abs_max=${offline.rawExtrema.absMax}:display_abs_max=${rendered.displayExtrema.absMax ?? "null"}:height_scale=${rendered.displayExtrema.heightScale ?? "null"}:near_zero_theta=${String(rendered.nearZeroTheta)}`,
        });
      }
    }
  }
  return {
    hashMismatch,
    rhoRemapMismatch,
    nearZeroSuppressionMismatch,
    downstreamRenderMismatch,
    guardFailures,
  };
};

const hasStrongForeAftYork = (summary: CaseResult["primaryYork"]): boolean => {
  if (!summary.rawExtrema) return false;
  const min = summary.rawExtrema.min;
  const max = summary.rawExtrema.max;
  const absMax = summary.rawExtrema.absMax;
  if (min == null || max == null || absMax == null) return false;
  const hasBothSigns = min < 0 && max > 0;
  const notNearZero = summary.nearZeroTheta === false;
  return hasBothSigns && notNearZero && absMax > 1e-20;
};

const hasConsistentAlcubierreSignedLobes = (
  offlineYorkAudit: CaseOfflineYorkAudit | null,
): boolean => {
  const signedLobeSummary = offlineYorkAudit?.alcubierreSignedLobeSummary?.signedLobeSummary;
  return signedLobeSummary === "fore+/aft-" || signedLobeSummary === "fore-/aft+";
};

const hasOfflineSignedStructure = (offlineYorkAudit: CaseOfflineYorkAudit | null): boolean =>
  (offlineYorkAudit?.byView ?? []).some(
    (view) => view.counts.positive > 0 && view.counts.negative > 0,
  );

export const hasSufficientSignalForAlcubierreControl = (entry: CaseResult): boolean => {
  const summary = entry.primaryYork;
  const min = summary.rawExtrema?.min;
  const max = summary.rawExtrema?.max;
  const absMax = summary.rawExtrema?.absMax;
  const hasRawSignPair =
    min != null && max != null && absMax != null && absMax > YORK_SIGN_STRUCTURE_EPS && min < 0 && max > 0;
  if (!hasRawSignPair) return false;

  if (summary.nearZeroTheta === false) {
    return true;
  }

  const offlineSignedStructure = hasOfflineSignedStructure(entry.offlineYorkAudit);
  if (offlineSignedStructure) return true;

  return hasConsistentAlcubierreSignedLobes(entry.offlineYorkAudit);
};

const isLowExpansion = (summary: CaseResult["primaryYork"]): boolean => {
  if (summary.nearZeroTheta === true) return true;
  const absMax = summary.rawExtrema?.absMax;
  if (absMax == null) return false;
  return absMax <= 1e-20;
};

const renderMarkdown = (payload: ProofPackPayload): string => {
  const primaryViewLabel = payload.cases[0]?.primaryYork.view ?? "n/a";
  const laneRows = payload.cases
    .flatMap((entry) =>
      entry.perView.flatMap((view) =>
        view.laneResults.map(
          (laneResult) =>
            `| ${entry.caseId} | ${view.view} | ${laneResult.lane} | ${laneResult.endpoint} | ${laneResult.ok} | ${laneResult.httpStatus ?? "null"} | ${laneResult.errorCode ?? "null"} | ${laneResult.responseMessage ?? "null"} | ${laneResult.preflightBranch ?? "null"} | ${laneResult.preflightRequirement ?? "null"} |`,
        ),
      ),
    )
    .join("\n");
  const controlRows = payload.controlDebug
    .map(
      (entry) =>
        `| ${entry.caseId} | ${entry.requestUrl ?? "null"} | ${entry.requestSelectors.metricT00Ref ?? "null"} | ${entry.requestSelectors.metricT00Source ?? "null"} | ${entry.requestSelectors.requireCongruentSolve} | ${entry.requestSelectors.requireNhm2CongruentFullSolve} | ${entry.requestSelectors.warpFieldType ?? "null"} | ${entry.requestMetricRefHash ?? "null"} | ${entry.resolvedMetricRefHash ?? "null"} | ${entry.thetaHash ?? "null"} | ${entry.kTraceHash ?? "null"} | ${entry.brickSource ?? "null"} | ${entry.chart ?? "null"} | ${entry.family_id ?? "null"} | ${entry.metricT00Ref ?? "null"} | ${entry.warpFieldType ?? "null"} | ${entry.source_branch ?? "null"} | ${entry.shape_function_id ?? "null"} |`,
    )
    .join("\n");
  const viewRows = payload.cases
    .flatMap((entry) =>
      entry.perView.map((view) => {
        const thetaK = entry.snapshotMetrics?.thetaPlusKTrace;
        return `| ${entry.caseId} | ${view.view} | ${view.ok} | ${view.rawExtrema.min ?? "null"} | ${view.rawExtrema.max ?? "null"} | ${view.rawExtrema.absMax ?? "null"} | ${view.displayExtrema.min ?? "null"} | ${view.displayExtrema.max ?? "null"} | ${view.displayExtrema.absMax ?? "null"} | ${view.render.coordinate_mode ?? "null"} | ${view.samplingChoice ?? "null"} | ${view.supportOverlapPct ?? "null"} | ${thetaK?.maxAbs ?? "null"} | ${thetaK?.rms ?? "null"} | ${thetaK?.consistent ?? "null"} | ${view.hashes.theta_channel_hash ?? "null"} | ${view.hashes.slice_array_hash ?? "null"} | ${view.hashes.normalized_slice_hash ?? "null"} | ${view.hashes.support_mask_slice_hash ?? "null"} | ${view.hashes.shell_masked_slice_hash ?? "null"} |`;
      }),
    )
    .join("\n");

  const caseRows = payload.cases
    .map((entry) => {
      const raw = entry.primaryYork.rawExtrema;
      const display = entry.primaryYork.displayExtrema;
      const thetaK = entry.snapshotMetrics?.thetaPlusKTrace;
      return `| ${entry.caseId} | ${entry.familyExpectation} | ${raw?.min ?? "null"} | ${raw?.max ?? "null"} | ${raw?.absMax ?? "null"} | ${display?.min ?? "null"} | ${display?.max ?? "null"} | ${display?.absMax ?? "null"} | ${entry.primaryYork.coordinateMode ?? "null"} | ${entry.primaryYork.samplingChoice ?? "null"} | ${entry.primaryYork.supportOverlapPct ?? "null"} | ${thetaK?.maxAbs ?? "null"} | ${thetaK?.rms ?? "null"} | ${thetaK?.consistent ?? "null"} |`;
    })
    .join("\n");
  const offlineRows = payload.cases
    .flatMap((entry) =>
      (entry.offlineYorkAudit?.byView ?? []).map((audit) => {
        const lobe = entry.offlineYorkAudit?.alcubierreSignedLobeSummary;
        return `| ${entry.caseId} | ${audit.view} | ${audit.coordinateMode} | ${audit.samplingChoice} | ${audit.rawExtrema.min ?? "null"} | ${audit.rawExtrema.max ?? "null"} | ${audit.rawExtrema.absMax ?? "null"} | ${audit.counts.positive} | ${audit.counts.negative} | ${audit.counts.zeroOrNearZero} | ${audit.thetaSliceHash ?? "null"} | ${lobe?.foreHalfPositiveTotal ?? "null"} | ${lobe?.foreHalfNegativeTotal ?? "null"} | ${lobe?.aftHalfPositiveTotal ?? "null"} | ${lobe?.aftHalfNegativeTotal ?? "null"} | ${lobe?.signedLobeSummary ?? "null"} |`;
      }),
    )
    .join("\n");
  const decisionRows = payload.decisionTable
    .map((row) => `| ${row.id} | ${row.condition} | ${row.status} | ${row.interpretation} |`)
    .join("\n");
  const preconditionRows = [
    [
      "controlsIndependent",
      payload.preconditions.controlsIndependent,
      "control families must not share the same theta channel hash",
    ],
    [
      "allRequiredViewsRendered",
      payload.preconditions.allRequiredViewsRendered,
      "all required York views must render without fallback",
    ],
    [
      "provenanceHashesPresent",
      payload.preconditions.provenanceHashesPresent,
      "strict York provenance hashes must be present for each requested view",
    ],
    [
      "runtimeStatusProvenancePresent",
      payload.preconditions.runtimeStatusProvenancePresent,
      "runtime status endpoint must expose serviceVersion/buildHash/commitSha/processStartedAtMs/runtimeInstanceId",
    ],
    [
      "readyForFamilyVerdict",
      payload.preconditions.readyForFamilyVerdict,
      "family verdict is allowed only when all preconditions pass",
    ],
  ]
    .map(([name, value, policy]) => `| ${String(name)} | ${value ? "true" : "false"} | ${String(policy)} |`)
    .join("\n");
  const guardRows =
    payload.guardFailures.length > 0
      ? payload.guardFailures
          .map((failure) => `| ${failure.code} | ${failure.detail} |`)
          .join("\n")
      : "| none | none |";
  const notes = payload.notes.length
    ? payload.notes.map((entry) => `- ${entry}`).join("\n")
    : "- none";

  return `# Warp York Control-Family Proof Pack (${payload.generatedOn})

"${payload.boundaryStatement}"

## Inputs
- baseUrl: \`${payload.inputs.baseUrl}\`
- frameEndpoint: \`${payload.inputs.frameEndpoint}\`
- proxyFrameEndpoint: \`${payload.inputs.proxyFrameEndpoint ?? "null"}\`
- compareDirectAndProxy: \`${payload.inputs.compareDirectAndProxy}\`
- frameSize: \`${payload.inputs.frameSize.width}x${payload.inputs.frameSize.height}\`
- nhm2SnapshotPath: \`${payload.inputs.nhm2SnapshotPath}\`
- yorkViews: \`${payload.inputs.yorkViews.join(", ")}\`

## Runtime Status Provenance
- statusEndpoint: \`${payload.provenance.runtimeStatus.statusEndpoint}\`
- reachable: \`${payload.provenance.runtimeStatus.reachable}\`
- serviceVersion: \`${payload.provenance.runtimeStatus.serviceVersion ?? "null"}\`
- buildHash: \`${payload.provenance.runtimeStatus.buildHash ?? "null"}\`
- commitSha: \`${payload.provenance.runtimeStatus.commitSha ?? "null"}\`
- processStartedAtMs: \`${payload.provenance.runtimeStatus.processStartedAtMs ?? "null"}\`
- runtimeInstanceId: \`${payload.provenance.runtimeStatus.runtimeInstanceId ?? "null"}\`

## Control Debug (pre-render brick audit)
| case | request_url | metricT00Ref | metricT00Source | requireCongruentSolve | requireNhm2CongruentFullSolve | warpFieldType | request_metric_ref_hash | resolved_metric_ref_hash | theta_hash | K_trace_hash | brick_source | chart | family_id | branch_metricT00Ref | branch_warpFieldType | source_branch | shape_function_id |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${controlRows}

## Per-View Lane Failure Trace
| case | view | lane | endpoint | ok | http_status | error_code | response_message | preflight_branch | requirement |
|---|---|---|---|---|---:|---|---|---|---|
${laneRows}

## Per-Case Per-View York Evidence
| case | view | ok | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent | theta_channel_hash | slice_array_hash | normalized_slice_hash | support_mask_slice_hash | shell_masked_slice_hash |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
${viewRows}

## Offline York slice audit (numeric)
| case | view | coordinate_mode | sampling_choice | theta_min_raw | theta_max_raw | theta_abs_max_raw | positive_cells | negative_cells | zero_or_near_zero_cells | offline_slice_hash | fore_pos_total | fore_neg_total | aft_pos_total | aft_neg_total | signed_lobe_summary |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---|
${offlineRows}

## Case Summary (primary York = ${primaryViewLabel})
| case | expectation | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|
${caseRows}

## Preconditions
| precondition | pass | policy |
|---|---|---|
${preconditionRows}

## Guard Failures
| code | detail |
|---|---|
${guardRows}

## Decision Table
| id | condition | status | interpretation |
|---|---|---|---|
${decisionRows}

## Verdict
- \`${payload.verdict}\`

## Notes
${notes}
`;
};

export const runWarpYorkControlFamilyProofPack = async (options?: {
  baseUrl?: string;
  frameEndpoint?: string;
  proxyFrameEndpoint?: string;
  compareDirectAndProxy?: boolean;
  nhm2SnapshotPath?: string;
  outJsonPath?: string;
  outMdPath?: string;
  latestJsonPath?: string;
  latestMdPath?: string;
  yorkViews?: HullScientificRenderView[];
  frameSize?: { width: number; height: number };
}) => {
  const baseUrl = normalizeBaseUrl(options?.baseUrl ?? DEFAULT_BASE_URL);
  const frameEndpoint = options?.frameEndpoint ?? DEFAULT_FRAME_ENDPOINT;
  const compareDirectAndProxy = options?.compareDirectAndProxy === true;
  const proxyFrameEndpoint =
    options?.proxyFrameEndpoint ??
    (compareDirectAndProxy
      ? `${baseUrl}/api/helix/hull-render/frame`
      : null);
  const nhm2SnapshotPath = options?.nhm2SnapshotPath ?? DEFAULT_NHM2_SNAPSHOT_PATH;
  const outJsonPath = options?.outJsonPath ?? DEFAULT_OUT_JSON;
  const outMdPath = options?.outMdPath ?? DEFAULT_OUT_MD;
  const latestJsonPath = options?.latestJsonPath ?? DEFAULT_LATEST_JSON;
  const latestMdPath = options?.latestMdPath ?? DEFAULT_LATEST_MD;
  const yorkViews = ensureRequiredYorkViews(
    options?.yorkViews?.length ? [...options.yorkViews] : [...DEFAULT_YORK_VIEWS],
  );
  const frameSize = {
    width: Math.max(128, Math.floor(options?.frameSize?.width ?? 1280)),
    height: Math.max(128, Math.floor(options?.frameSize?.height ?? 720)),
  };
  const runtimeStatus = await fetchRuntimeStatusProvenance(frameEndpoint);

  const nhm2MetricVolumeRef = loadNhm2MetricVolumeRef(nhm2SnapshotPath);
  const alcMetricVolumeRef = buildControlMetricVolumeRef({
    baseUrl,
    metricT00Source: "metric",
    metricT00Ref: "warp.metric.T00.alcubierre.analytic",
    dutyFR: 0.0015,
    q: 3,
    gammaGeo: 26,
    gammaVdB: 500,
    zeta: 0.84,
    phase01: 0,
    dims: [48, 48, 48],
    requireCongruentSolve: true,
    requireNhm2CongruentFullSolve: false,
  });
  const natMetricVolumeRef = buildControlMetricVolumeRef({
    baseUrl,
    metricT00Source: "metric",
    metricT00Ref: "warp.metric.T00.natario.shift",
    dutyFR: 0.0015,
    q: 3,
    gammaGeo: 26,
    gammaVdB: 500,
    zeta: 0.84,
    phase01: 0,
    dims: [48, 48, 48],
    requireCongruentSolve: true,
    requireNhm2CongruentFullSolve: false,
  });

  const cases = await Promise.all([
    runCase({
      caseId: "alcubierre_control",
      label: "Alcubierre-like control",
      familyExpectation: "alcubierre-like-control",
      metricVolumeRef: alcMetricVolumeRef,
      frameEndpoint,
      proxyFrameEndpoint,
      compareDirectAndProxy,
      requireCongruentNhm2FullSolve: false,
      yorkViews,
      frameSize,
    }),
    runCase({
      caseId: "natario_control",
      label: "Natario-like control",
      familyExpectation: "natario-like-control",
      metricVolumeRef: natMetricVolumeRef,
      frameEndpoint,
      proxyFrameEndpoint,
      compareDirectAndProxy,
      requireCongruentNhm2FullSolve: false,
      yorkViews,
      frameSize,
    }),
    runCase({
      caseId: "nhm2_certified",
      label: "NHM2 certified snapshot",
      familyExpectation: "nhm2-certified",
      metricVolumeRef: nhm2MetricVolumeRef,
      frameEndpoint,
      proxyFrameEndpoint,
      compareDirectAndProxy,
      requireCongruentNhm2FullSolve: true,
      yorkViews,
      frameSize,
    }),
  ]);

  const alc = cases.find((entry) => entry.caseId === "alcubierre_control")!;
  const nat = cases.find((entry) => entry.caseId === "natario_control")!;
  const nhm2 = cases.find((entry) => entry.caseId === "nhm2_certified")!;

  const alcStrong = hasStrongForeAftYork(alc.primaryYork);
  const alcSignalSufficient = hasSufficientSignalForAlcubierreControl(alc);
  const natLow = isLowExpansion(nat.primaryYork);
  const nhm2Low = isLowExpansion(nhm2.primaryYork);
  const nhm2MatchesNatLowExpansion = natLow && nhm2Low;
  const nhm2IntendedAlcubierre = /warp\.metric\.t00\.alcubierre/i.test(
    nhm2.metricVolumeRef.url ?? "",
  );
  const { preconditions, guardFailures } = evaluateProofPackPreconditions({
    yorkViews,
    cases,
    runtimeStatus,
  });
  const yorkCongruence = evaluateYorkSliceCongruence(cases);
  guardFailures.push(...yorkCongruence.guardFailures);
  const controlDebug = buildControlDebug(cases);

  const decisionTable: DecisionRow[] = [
    {
      id: "preconditions_ready_for_family_verdict",
      condition:
        "Controls independent, required views rendered, provenance hashes present, and runtime status provenance present",
      status: preconditions.readyForFamilyVerdict.toString() as DecisionRowStatus,
      interpretation: preconditions.readyForFamilyVerdict
        ? "Evidence integrity prerequisites satisfied."
        : "Evidence prerequisites failed; verdict must remain inconclusive.",
    },
    {
      id: "offline_raw_slice_matches_rendered_slice_hashes",
      condition:
        "Offline York slice hash matches rendered slice_array_hash for x-z and x-rho views",
      status:
        (
          preconditions.readyForFamilyVerdict &&
          !yorkCongruence.hashMismatch
        ).toString() as DecisionRowStatus,
      interpretation:
        preconditions.readyForFamilyVerdict && !yorkCongruence.hashMismatch
          ? "Offline extraction and rendered slice arrays are congruent."
          : preconditions.readyForFamilyVerdict
            ? "At least one rendered York slice hash diverges from offline extraction."
            : "Skipped because preconditions failed.",
    },
    {
      id: "xz_matches_but_xrho_differs_isolate_rho_remap",
      condition:
        "x-z York slice congruent while x-rho York slice diverges from offline remap",
      status:
        (
          preconditions.readyForFamilyVerdict && yorkCongruence.rhoRemapMismatch
        ).toString() as DecisionRowStatus,
      interpretation:
        preconditions.readyForFamilyVerdict && yorkCongruence.rhoRemapMismatch
          ? "Likely cylindrical remap mismatch between offline and renderer path."
          : preconditions.readyForFamilyVerdict
            ? "No isolated cylindrical remap mismatch detected."
            : "Skipped because preconditions failed.",
    },
    {
      id: "raw_structure_nontrivial_but_near_zero_flattened",
      condition:
        "Offline raw York structure is nontrivial but rendered diagnostics report near-zero flattening",
      status:
        (
          preconditions.readyForFamilyVerdict &&
          yorkCongruence.nearZeroSuppressionMismatch
        ).toString() as DecisionRowStatus,
      interpretation:
        preconditions.readyForFamilyVerdict && yorkCongruence.nearZeroSuppressionMismatch
          ? "Display suppression policy likely flattening meaningful structure."
          : preconditions.readyForFamilyVerdict
            ? "No near-zero suppression mismatch detected."
            : "Skipped because preconditions failed.",
    },
    {
      id: "hash_match_but_downstream_render_or_display_issue",
      condition:
        "Offline and rendered hashes match but extrema/semantics disagree (downstream display/render issue)",
      status:
        (
          preconditions.readyForFamilyVerdict &&
          yorkCongruence.downstreamRenderMismatch
        ).toString() as DecisionRowStatus,
      interpretation:
        preconditions.readyForFamilyVerdict && yorkCongruence.downstreamRenderMismatch
          ? "Downstream render/display interpretation is likely responsible."
          : preconditions.readyForFamilyVerdict
            ? "No downstream mismatch detected after hash congruence."
            : "Skipped because preconditions failed.",
    },
    {
      id: "alcubierre_control_signal_sufficient",
      condition:
        "Alcubierre control has enough signed York structure (raw and offline lobe evidence) to support renderer/conversion attribution",
      status:
        (preconditions.readyForFamilyVerdict && alcSignalSufficient).toString() as DecisionRowStatus,
      interpretation:
        preconditions.readyForFamilyVerdict && alcSignalSufficient
          ? "Alcubierre control signal is sufficient for strong pass/fail attribution."
          : preconditions.readyForFamilyVerdict
            ? "Alcubierre control is low-signal; keep renderer/conversion verdict inconclusive."
            : "Skipped because preconditions failed.",
    },
    {
      id: "renderer_or_conversion_wrong_if_alc_control_fails",
      condition:
        "Alcubierre control fails to show expected fore/aft York numerically (signed non-near-zero)",
      status:
        (
          preconditions.readyForFamilyVerdict &&
          alcSignalSufficient &&
          !alcStrong
        ).toString() as DecisionRowStatus,
      interpretation: preconditions.readyForFamilyVerdict && alcSignalSufficient && !alcStrong
        ? "Renderer/conversion lane is suspect under this control-family proof test."
        : preconditions.readyForFamilyVerdict && !alcSignalSufficient
          ? "Skipped because Alcubierre control is low-signal under this run."
          : preconditions.readyForFamilyVerdict
          ? "Alcubierre control passes this guard."
          : "Skipped because preconditions failed.",
    },
    {
      id: "renderer_fine_if_alc_works_nat_low",
      condition:
        "Alcubierre control works and Natario control remains near-zero expansion",
      status:
        (preconditions.readyForFamilyVerdict && alcStrong && natLow).toString() as DecisionRowStatus,
      interpretation:
        preconditions.readyForFamilyVerdict && alcStrong && natLow
          ? "Renderer and conversion are consistent with control-family behavior."
          : preconditions.readyForFamilyVerdict
            ? "Control-family consistency not yet established."
            : "Skipped because preconditions failed.",
    },
    {
      id: "nhm2_not_wrong_if_matches_nat_low_expansion",
      condition:
        "NHM2 matches Natario-like low-expansion behavior under same York pipeline",
      status:
        (
          preconditions.readyForFamilyVerdict &&
          alcStrong &&
          nhm2MatchesNatLowExpansion
        ).toString() as DecisionRowStatus,
      interpretation:
        preconditions.readyForFamilyVerdict && alcStrong && nhm2MatchesNatLowExpansion
          ? "NHM2 is not wrong by York appearance alone; it behaves as low-expansion family."
          : preconditions.readyForFamilyVerdict
            ? "NHM2 low-expansion match not established from this run."
            : "Skipped because preconditions failed.",
    },
    {
      id: "solve_family_mismatch_if_nhm2_intended_alcubierre",
      condition:
        "NHM2 was intended Alcubierre-like but numerically matches Natario-like low-expansion behavior",
      status:
        (
          preconditions.readyForFamilyVerdict &&
          alcStrong &&
          nhm2MatchesNatLowExpansion &&
          nhm2IntendedAlcubierre
        ).toString() as DecisionRowStatus,
      interpretation:
        preconditions.readyForFamilyVerdict &&
        alcStrong &&
        nhm2MatchesNatLowExpansion &&
        nhm2IntendedAlcubierre
          ? "Solve-family mismatch detected (intent vs realized family)."
          : preconditions.readyForFamilyVerdict
            ? "No solve-family mismatch trigger under current intent metadata."
            : "Skipped because preconditions failed.",
    },
  ];

  const verdict = decideControlFamilyVerdict({
    preconditions,
    alcStrong,
    alcSignalSufficient,
    natLow,
    nhm2Low,
    nhm2IntendedAlcubierre,
    yorkCongruence,
  });

  const notes: string[] = [];
  if (!preconditions.readyForFamilyVerdict) {
    notes.push(
      "Family verdict forced to inconclusive because proof-pack preconditions are not satisfied.",
    );
  }
  if (guardFailures.length > 0) {
    notes.push(
      `Guard failures: ${guardFailures.map((entry) => `${entry.code}:${entry.detail}`).join("; ")}`,
    );
  }
  if (
    guardFailures.some((entry) => entry.code === "proof_pack_control_theta_hash_collision")
  ) {
    notes.push(
      "Collapse-point hint: gr-evolve-brick forwards metricT00Ref in sourceParams, but stress-energy field construction in buildStressEnergyBrick is driven by metricT00 scalar and warpFieldType, so differing metricT00Ref alone may not diverge theta.",
    );
  }
  if (!alcStrong && alcSignalSufficient) {
    notes.push(
      "Alcubierre control did not present a strong signed fore/aft York lane in primary view; renderer/conversion suspicion is raised by policy.",
    );
  }
  if (!alcSignalSufficient) {
    notes.push(
      "Alcubierre control signal is below near-zero threshold for strict renderer fault attribution; verdict remains inconclusive unless a concrete congruence mismatch is detected.",
    );
  }
  if (yorkCongruence.hashMismatch) {
    notes.push("Offline-vs-rendered York slice hash mismatch detected.");
  }
  if (yorkCongruence.rhoRemapMismatch) {
    notes.push("x-rho cylindrical remap mismatch isolated against x-z baseline.");
  }
  if (yorkCongruence.nearZeroSuppressionMismatch) {
    notes.push(
      "Rendered near-zero/height suppression appears active despite meaningful offline signed structure.",
    );
  }
  if (alcStrong && natLow) {
    notes.push(
      "Control behavior is separated: Alcubierre-like strong signed lane vs Natario-like near-zero lane.",
    );
  }
  if (nhm2MatchesNatLowExpansion) {
    notes.push(
      "NHM2 primary York behavior aligns with low-expansion Natario-like control in this run.",
    );
  }
  if (nhm2.snapshotMetrics?.thetaPlusKTrace.consistent === false) {
    notes.push("NHM2 theta + K_trace consistency check is not within tolerance.");
  }

  const payloadBase: ProofPackPayload = {
    artifactType: "warp_york_control_family_proof_pack/v1",
    generatedOn: DATE_STAMP,
    generatedAt: new Date().toISOString(),
    boundaryStatement: BOUNDARY_STATEMENT,
    inputs: {
      baseUrl,
      frameEndpoint,
      proxyFrameEndpoint,
      compareDirectAndProxy,
      nhm2SnapshotPath: normalizePath(nhm2SnapshotPath),
      yorkViews: [...yorkViews],
      frameSize,
    },
    cases,
    controlDebug,
    preconditions,
    guardFailures,
    decisionTable,
    verdict,
    notes,
    provenance: {
      commitHash: getHeadCommit(),
      runtimeStatus,
    },
  };
  const payload: ProofPackPayload = {
    ...payloadBase,
    checksum: computeChecksum(payloadBase),
  };

  ensureDirForFile(outJsonPath);
  ensureDirForFile(outMdPath);
  ensureDirForFile(latestJsonPath);
  ensureDirForFile(latestMdPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(latestJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  const markdown = renderMarkdown(payload);
  fs.writeFileSync(outMdPath, `${markdown}\n`);
  fs.writeFileSync(latestMdPath, `${markdown}\n`);

  return {
    outJsonPath,
    outMdPath,
    latestJsonPath,
    latestMdPath,
    payload,
  };
};

const isEntryPoint = (() => {
  if (!process.argv[1]) return false;
  try {
    return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
})();

if (isEntryPoint) {
  const width = parsePositiveInt(readArgValue("--width"), 1280);
  const height = parsePositiveInt(readArgValue("--height"), 720);
  const compareDirectAndProxy = parseBooleanArg(
    readArgValue("--compare-direct-proxy"),
    false,
  );
  runWarpYorkControlFamilyProofPack({
    baseUrl: readArgValue("--base-url"),
    frameEndpoint: readArgValue("--frame-endpoint"),
    proxyFrameEndpoint: readArgValue("--proxy-frame-endpoint"),
    compareDirectAndProxy,
    nhm2SnapshotPath: readArgValue("--nhm2-snapshot"),
    outJsonPath: readArgValue("--out-json"),
    outMdPath: readArgValue("--out-md"),
    latestJsonPath: readArgValue("--latest-json"),
    latestMdPath: readArgValue("--latest-md"),
    yorkViews: parseYorkViews(readArgValue("--views")),
    frameSize: { width, height },
  })
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result.payload, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(
        `[warp-york-control-family-proof-pack] ${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
