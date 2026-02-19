import {
  computeTimeDilationRenderPlan,
  type TimeDilationRenderUiToggles,
} from "./time-dilation-render-policy";

type ProofValue = { value: unknown; proxy?: boolean };
type ProofPack = { values?: Record<string, ProofValue> };

type MathTreeNode = {
  id: string;
  stage?: "exploratory" | "reduced-order" | "diagnostic" | "certified" | "unstaged";
  children?: MathTreeNode[];
};

type MathGraphResponse = {
  root?: MathTreeNode;
};

const DEFAULT_GRID_DIV = 12;
const DEFAULT_GRID_SCALE = 1;
const DEFAULT_GR_TARGET_DX_M = 5;
export const DEFAULT_HULL_AXES: [number, number, number] = [503.5, 132, 86.5];
export const DEFAULT_HULL_WALL_THICKNESS_M = 0.45;
const BETA_WARP_PERCENTILE = 0.98;
const THETA_WARP_PERCENTILE = 0.98;
const GAMMA_WARP_PERCENTILE = 0.98;
const SHEAR_WARP_PERCENTILE = 0.98;
const SPEED_OF_LIGHT_MPS = 299_792_458;

const STAGE_RANK: Record<string, number> = {
  unstaged: -1,
  exploratory: 0,
  "reduced-order": 1,
  diagnostic: 2,
  certified: 3,
};

export type TimeDilationDiagnosticsOptions = {
  baseUrl: string;
  quality?: string;
  gridScale?: number;
  grTargetDx?: number;
  includeExtra?: boolean;
  includeMatter?: boolean;
  includeKij?: boolean;
  wallInvariant?: "kretschmann" | "ricci4";
  publish?: boolean;
  timeoutMs?: number;
};

export type TimeDilationDiagnostics = {
  kind: "time_dilation_headless" | "time_dilation_diagnostics";
  captured_at: string;
  gate: {
    banner: string | null;
    reasons: string[];
  };
  definitions: {
    theta_definition: string | null;
    kij_sign_convention: string | null;
    gamma_field_naming: string | null;
    field_provenance_schema: string | null;
  };
  fieldProvenance: Record<string, unknown>;
  congruence: {
    kind: "eulerian_adm" | "grid_static" | "ship_comoving" | "geodesic_bundle";
    requiredFieldsOk: boolean;
    missingFields: string[];
    gaugeNote: string | null;
  };
  observables: Record<string, {
    source: string;
    observerFamily: "eulerian_adm" | "grid_static" | "ship_comoving" | "geodesic_bundle";
    chart: string | null;
    units: string | null;
    valid?: boolean;
    missingFields?: string[];
    value?: number | null;
    formula?: string;
    details?: Record<string, unknown>;
  }>;
  tidal: {
    status: "available" | "unavailable";
    scalar: number | null;
    units: "1/s^2";
    method: "E_ij_frobenius_norm";
    provenance: {
      source: string;
      tensorPath: string | null;
      tensorLayout: "matrix3x3";
      definitionId: "tidal_indicator_v1";
      derivedFrom: "E_ij";
    };
    unavailable?: {
      reason: "required_tensor_missing";
      required: string[];
      deterministicBlockId: "TIDAL_E_IJ_MISSING";
    };
  };
  provenance: Record<string, {
    source: string;
    observer: string | null;
    chart: string | null;
    units: string | null;
    definitionId: string;
    derivedFrom: string;
  }>;
  proofPack?: unknown;
  renderingSeed?: string;
  renderingProbe?: string;
  strict: {
    strictCongruence: boolean;
    latticeMetricOnly: boolean;
    strictMetricMissing: boolean;
    anyProxy: boolean;
    mathStageOK: boolean;
    grCertified: boolean;
    banner: string | null;
    certifiedLabelsAllowed?: boolean;
    strongClaimsAllowed?: boolean;
    failId?: string | null;
    failClosedReasons?: string[];
  };
  canonical: {
    family: string;
    chart: string | null;
    observer: string | null;
    normalization: string | null;
    unitSystem: string | null;
    match: string | null;
  };
  natarioCanonical: {
    requiredFieldsOk: boolean;
    canonicalSatisfied: boolean;
    checks: {
      divBeta: {
        status: "pass" | "fail" | "unknown";
        rms: number | null;
        maxAbs: number | null;
        tolerance: number | null;
        source: string;
      };
      thetaKConsistency: {
        status: "pass" | "fail" | "unknown";
        theta: number | null;
        kTrace: number | null;
        residualAbs: number | null;
        tolerance: number | null;
        source: string;
      };
    };
    reason: string | null;
  };
  metric_contract: {
    metric_t00_contract_ok: unknown;
    metric_chart_contract_status: unknown;
    metric_chart_notes: unknown;
    metric_coordinate_map: unknown;
  };
  render_plan: unknown;
  sources: {
    proof_pack_proxy: boolean;
    gr_guardrails_proxy: boolean;
  };
  wall: unknown;
  gr: {
    dims: unknown;
    meta: unknown;
    solverHealth: unknown;
  };
};

type CanonicalField = {
  family: string;
  chart: string | null;
  observer: string | null;
  normalization: string | null;
  unitSystem: string | null;
  match: string | null;
};

type Definitions = {
  theta_definition: string | null;
  kij_sign_convention: string | null;
  gamma_field_naming: string | null;
  field_provenance_schema: string | null;
};

type CongruenceKind = "eulerian_adm" | "grid_static" | "ship_comoving" | "geodesic_bundle";

type DiagnosticsVerification = {
  certified: boolean;
  strongClaimsAllowed: boolean;
  certifiedLabelsAllowed: boolean;
  failId: string | null;
  reasons: string[];
};

const canonicalizeCanonicalField = (canonical: CanonicalField): CanonicalField => ({
  family: canonical.family,
  chart: canonical.chart ?? "unknown",
  observer: canonical.observer ?? "unknown",
  normalization: canonical.normalization ?? "unknown",
  unitSystem: canonical.unitSystem ?? "unknown",
  match: canonical.match ?? "unknown",
});

const resolveCongruenceKind = (canonical: CanonicalField): CongruenceKind => {
  const observer = (canonical.observer ?? "").toLowerCase();
  const chart = (canonical.chart ?? "").toLowerCase();
  if (observer.includes("euler") || chart.includes("adm")) return "eulerian_adm";
  if (observer.includes("grid") || chart.includes("static")) return "grid_static";
  if (observer.includes("ship") || chart.includes("comoving")) return "ship_comoving";
  return "geodesic_bundle";
};

const resolveCongruenceRequirements = (canonical: CanonicalField, definitions: Definitions) => {
  const missingFields = [
    canonical.chart === "unknown" ? "canonical.chart" : null,
    canonical.observer === "unknown" ? "canonical.observer" : null,
    canonical.normalization === "unknown" ? "canonical.normalization" : null,
    !definitions.theta_definition ? "definitions.theta_definition" : null,
    !definitions.kij_sign_convention ? "definitions.kij_sign_convention" : null,
  ].filter((value): value is string => typeof value === "string");

  return {
    requiredFieldsOk: missingFields.length === 0,
    missingFields,
  };
};

const finiteVec3 = (value: unknown): [number, number, number] | null => {
  if (!Array.isArray(value) || value.length < 3) return null;
  const x = toNumber(value[0]);
  const y = toNumber(value[1]);
  const z = toNumber(value[2]);
  if (x == null || y == null || z == null) return null;
  return [x, y, z];
};

const resolveShipWorldline = (pipeline: any): { dxdt: [number, number, number] | null; source: string | null } => {
  const candidates: Array<{ value: unknown; source: string }> = [
    { value: pipeline?.shipKinematics?.dxdt, source: "pipeline.shipKinematics.dxdt" },
    { value: pipeline?.shipKinematics?.dxdt_mps, source: "pipeline.shipKinematics.dxdt_mps" },
    { value: pipeline?.shipKinematics?.velocity_mps, source: "pipeline.shipKinematics.velocity_mps" },
    { value: pipeline?.worldline?.dxdt, source: "pipeline.worldline.dxdt" },
    { value: pipeline?.navPose?.velocity_mps, source: "pipeline.navPose.velocity_mps" },
  ];
  for (const entry of candidates) {
    const parsed = finiteVec3(entry.value);
    if (parsed) return { dxdt: parsed, source: entry.source };
  }
  return { dxdt: null, source: null };
};

const resolveShipComovingDtauDt = (pipeline: any, proofPack: ProofPack | null) => {
  const missingFields: string[] = [];
  const alpha = toNumber((pipeline as any)?.warp?.metricAdapter?.alpha) ?? toNumber(readProofString(proofPack, "metric_alpha"));
  const gammaDiag = finiteVec3((pipeline as any)?.warp?.metricAdapter?.gammaDiag) ?? [
    toNumber(readProofString(proofPack, "metric_gamma_xx")) ?? NaN,
    toNumber(readProofString(proofPack, "metric_gamma_yy")) ?? NaN,
    toNumber(readProofString(proofPack, "metric_gamma_zz")) ?? NaN,
  ];
  const beta =
    finiteVec3((pipeline as any)?.shipKinematics?.betaCoord) ??
    finiteVec3((pipeline as any)?.shipKinematics?.beta_xyz) ??
    finiteVec3((pipeline as any)?.warp?.metricAdapter?.betaVector) ??
    finiteVec3((pipeline as any)?.warp?.shiftVectorField?.betaVector);
  const { dxdt, source: worldlineSource } = resolveShipWorldline(pipeline);

  if (alpha == null) missingFields.push("warp.metricAdapter.alpha");
  if (!finiteVec3(gammaDiag)) missingFields.push("warp.metricAdapter.gammaDiag");
  if (!beta) missingFields.push("shipKinematics.betaCoord");
  if (!dxdt) missingFields.push("shipKinematics.dxdt");

  const valid = missingFields.length === 0;
  if (!valid) {
    return { valid, missingFields, value: null, details: { worldlineSource } };
  }

  const vRaw = dxdt as [number, number, number];
  const mpsLike = Math.max(Math.abs(vRaw[0]), Math.abs(vRaw[1]), Math.abs(vRaw[2])) > 1;
  const vCoord: [number, number, number] = mpsLike
    ? [vRaw[0] / SPEED_OF_LIGHT_MPS, vRaw[1] / SPEED_OF_LIGHT_MPS, vRaw[2] / SPEED_OF_LIGHT_MPS]
    : vRaw;
  const betaEff: [number, number, number] = [
    vCoord[0] + (beta as [number, number, number])[0],
    vCoord[1] + (beta as [number, number, number])[1],
    vCoord[2] + (beta as [number, number, number])[2],
  ];
  const gamma = gammaDiag as [number, number, number];
  const spatialTerm =
    gamma[0] * betaEff[0] * betaEff[0] +
    gamma[1] * betaEff[1] * betaEff[1] +
    gamma[2] * betaEff[2] * betaEff[2];
  const underRoot = (alpha as number) * (alpha as number) - spatialTerm;

  return {
    valid: underRoot > 0,
    missingFields,
    value: underRoot > 0 ? Math.sqrt(underRoot) : null,
    details: {
      worldlineSource,
      velocityInput: vRaw,
      velocityInterpreted: mpsLike ? "m/s" : "coordinate",
      velocityCoord: vCoord,
      betaCoord: beta,
      gammaDiag: gamma,
      alpha,
      underRoot,
    },
  };
};

const resolveTidalTensorEij = (pipeline: any, proofPack: ProofPack | null) => {
  const pipelineCandidates: Array<{ value: unknown; source: string; tensorPath: string }> = [
    {
      value: pipeline?.warp?.metricAdapter?.tidalTensorEij,
      source: "pipeline.warp.metricAdapter.tidalTensorEij",
      tensorPath: "pipeline.warp.metricAdapter.tidalTensorEij",
    },
    {
      value: pipeline?.warp?.metricAdapter?.electricWeylEij,
      source: "pipeline.warp.metricAdapter.electricWeylEij",
      tensorPath: "pipeline.warp.metricAdapter.electricWeylEij",
    },
    {
      value: pipeline?.warp?.metricAdapter?.E_ij,
      source: "pipeline.warp.metricAdapter.E_ij",
      tensorPath: "pipeline.warp.metricAdapter.E_ij",
    },
  ];

  for (const candidate of pipelineCandidates) {
    const matrix = finiteMatrix3x3(candidate.value);
    if (matrix) {
      return {
        matrix,
        source: candidate.source,
        tensorPath: candidate.tensorPath,
      };
    }
  }

  const fromProof = [
    ["tidal_e_ij_xx", "tidal_e_ij_xy", "tidal_e_ij_xz"],
    ["tidal_e_ij_yx", "tidal_e_ij_yy", "tidal_e_ij_yz"],
    ["tidal_e_ij_zx", "tidal_e_ij_zy", "tidal_e_ij_zz"],
  ].map((row) => row.map((entry) => toNumber(readProofString(proofPack, entry))));

  if (fromProof.flat().every((entry) => entry != null)) {
    return {
      matrix: fromProof as [[number, number, number], [number, number, number], [number, number, number]],
      source: "proof_pack",
      tensorPath: "proof.values.tidal_e_ij_*",
    };
  }

  return null;
};

const finiteMatrix3x3 = (value: unknown): [[number, number, number], [number, number, number], [number, number, number]] | null => {
  if (!Array.isArray(value) || value.length < 3) return null;
  const rows = value.slice(0, 3).map((row) => finiteVec3(row));
  if (rows.some((entry) => !entry)) return null;
  return rows as [[number, number, number], [number, number, number], [number, number, number]];
};

const resolveTidalIndicator = (pipeline: any, proofPack: ProofPack | null) => {
  const tensor = resolveTidalTensorEij(pipeline, proofPack);
  const units = "1/s^2" as const;
  if (!tensor) {
    return {
      status: "unavailable" as const,
      scalar: null,
      units,
      method: "E_ij_frobenius_norm" as const,
      provenance: {
        source: "unavailable",
        tensorPath: null,
        tensorLayout: "matrix3x3" as const,
        definitionId: "tidal_indicator_v1" as const,
        derivedFrom: "E_ij" as const,
      },
      unavailable: {
        reason: "required_tensor_missing" as const,
        required: [
          "warp.metricAdapter.tidalTensorEij",
          "warp.metricAdapter.electricWeylEij",
          "warp.metricAdapter.E_ij",
        ],
        deterministicBlockId: "TIDAL_E_IJ_MISSING" as const,
      },
    };
  }

  const scalar = Math.sqrt(
    tensor.matrix
      .flat()
      .reduce((sum, component) => sum + component * component, 0),
  );
  return {
    status: "available" as const,
    scalar,
    units,
    method: "E_ij_frobenius_norm" as const,
    provenance: {
      source: tensor.source,
      tensorPath: tensor.tensorPath,
      tensorLayout: "matrix3x3" as const,
      definitionId: "tidal_indicator_v1" as const,
      derivedFrom: "E_ij" as const,
    },
  };
};

const toNumber = (value: unknown): number | null => {
  if (value == null) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const boolFromProof = (proofPack: ProofPack | null, key: string): boolean | null => {
  const entry = getProofValue(proofPack, key);
  if (!entry || entry.proxy) return null;
  return entry.value === true;
};

const fetchJson = async <T>(url: string, timeoutMs?: number): Promise<T> => {
  const controller = timeoutMs ? new AbortController() : null;
  const timeout = timeoutMs
    ? setTimeout(() => controller?.abort(), timeoutMs)
    : null;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: controller?.signal,
  });
  if (timeout) clearTimeout(timeout);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed (${res.status}) ${url}: ${text}`);
  }
  return (await res.json()) as T;
};

const buildMathNodeIndex = (root?: MathTreeNode) => {
  const map = new Map<string, MathTreeNode>();
  if (!root) return map;
  const walk = (node: MathTreeNode) => {
    map.set(node.id, node);
    node.children?.forEach(walk);
  };
  walk(root);
  return map;
};

const meetsStage = (stage: string | undefined, minStage: string) => {
  const rank = STAGE_RANK[stage ?? "unstaged"] ?? -1;
  return rank >= (STAGE_RANK[minStage] ?? 0);
};

const resolveHullAxes = (pipeline: any): [number, number, number] => {
  const hull = pipeline?.hull ?? {};
  const Lx = toNumber(hull.Lx_m) ?? (toNumber(hull.a) != null ? (toNumber(hull.a) as number) * 2 : null);
  const Ly = toNumber(hull.Ly_m) ?? (toNumber(hull.b) != null ? (toNumber(hull.b) as number) * 2 : null);
  const Lz = toNumber(hull.Lz_m) ?? (toNumber(hull.c) != null ? (toNumber(hull.c) as number) * 2 : null);
  return [
    Lx != null ? Lx / 2 : DEFAULT_HULL_AXES[0],
    Ly != null ? Ly / 2 : DEFAULT_HULL_AXES[1],
    Lz != null ? Lz / 2 : DEFAULT_HULL_AXES[2],
  ];
};

const isDefaultHullAxes = (axes: [number, number, number]) =>
  Math.abs(axes[0] - DEFAULT_HULL_AXES[0]) < 1e-6 &&
  Math.abs(axes[1] - DEFAULT_HULL_AXES[1]) < 1e-6 &&
  Math.abs(axes[2] - DEFAULT_HULL_AXES[2]) < 1e-6;

const resolveUserHullChoice = (pipeline: any) =>
  Boolean(
    pipeline?.warpGeometry ||
      pipeline?.warpGeometryKind ||
      pipeline?.warpGeometryAssetId ||
      pipeline?.geometryPreview ||
      pipeline?.hullBrick ||
      pipeline?.hull?.Lx_m ||
      pipeline?.hull?.Ly_m ||
      pipeline?.hull?.Lz_m,
  );

const resolveGrGuardrails = (pipeline: any) => {
  const raw = pipeline?.physics?.warp?.viability ?? pipeline?.warp?.viability ?? pipeline?.viability;
  const snapshot =
    raw?.snapshot ??
    raw?.certificate?.payload?.snapshot ??
    raw?.certificate?.snapshot ??
    raw?.payload?.snapshot;
  return snapshot?.grGuardrails ?? null;
};

const resolveStrictVerificationGate = (pipeline: any): DiagnosticsVerification => {
  const raw = pipeline?.physics?.warp?.viability ?? pipeline?.warp?.viability ?? pipeline?.viability ?? null;
  const certificate = raw?.certificate ?? null;
  const certificateHashRaw =
    typeof raw?.certificateHash === "string"
      ? raw.certificateHash
      : typeof certificate?.certificateHash === "string"
        ? certificate.certificateHash
        : "";
  const certificateHash = certificateHashRaw.trim();
  const integrityOk =
    typeof raw?.integrityOk === "boolean"
      ? raw.integrityOk
      : typeof certificate?.integrityOk === "boolean"
        ? certificate.integrityOk
        : null;
  const constraints = Array.isArray(raw?.constraints)
    ? raw.constraints
    : Array.isArray(certificate?.payload?.constraints)
      ? certificate.payload.constraints
      : [];
  const hardConstraints = constraints.filter((entry: any) => String(entry?.severity ?? "SOFT") === "HARD");
  const hardFail = hardConstraints.find((entry: any) => entry?.passed === false || String(entry?.status ?? "").toLowerCase() === "fail");
  const hardUnknown = hardConstraints.find((entry: any) => {
    if (entry?.passed === true || entry?.passed === false) return false;
    const status = String(entry?.status ?? "").toLowerCase();
    return !status || status === "unknown";
  });

  if (!certificateHash) {
    return {
      certified: false,
      strongClaimsAllowed: false,
      certifiedLabelsAllowed: false,
      failId: "ADAPTER_CERTIFICATE_MISSING",
      reasons: ["certificate_missing"],
    };
  }

  if (integrityOk !== true) {
    return {
      certified: false,
      strongClaimsAllowed: false,
      certifiedLabelsAllowed: false,
      failId: "ADAPTER_CERTIFICATE_INTEGRITY",
      reasons: ["certificate_integrity_failed"],
    };
  }

  if (!hardConstraints.length || hardUnknown) {
    return {
      certified: false,
      strongClaimsAllowed: false,
      certifiedLabelsAllowed: false,
      failId: "ADAPTER_CONSTRAINTS_UNKNOWN",
      reasons: ["hard_constraints_unknown"],
    };
  }

  if (hardFail) {
    const failId = typeof hardFail.id === "string" && hardFail.id.trim().length > 0
      ? hardFail.id.trim()
      : "ADAPTER_CONSTRAINT_FAIL";
    return {
      certified: false,
      strongClaimsAllowed: false,
      certifiedLabelsAllowed: false,
      failId,
      reasons: ["hard_constraints_failed"],
    };
  }

  return {
    certified: true,
    strongClaimsAllowed: true,
    certifiedLabelsAllowed: true,
    failId: null,
    reasons: [],
  };
};

const getProofValue = (proofPack: ProofPack | null, key: string): ProofValue | null =>
  (proofPack?.values && proofPack.values[key]) ? proofPack.values[key] : null;

const readProofString = (proofPack: ProofPack | null, key: string): string | null => {
  const entry = getProofValue(proofPack, key);
  if (!entry || entry.value == null) return null;
  return String(entry.value);
};

const hasAnyProxy = (proofPack: ProofPack | null) => {
  const values = proofPack?.values ? Object.values(proofPack.values) : [];
  return values.some((entry) => entry?.proxy);
};

export async function buildTimeDilationDiagnostics(
  options: TimeDilationDiagnosticsOptions,
): Promise<TimeDilationDiagnostics> {
  const gridScale = Number.isFinite(options.gridScale as number)
    ? (options.gridScale as number)
    : DEFAULT_GRID_SCALE;
  const grTargetDx = Number.isFinite(options.grTargetDx as number)
    ? (options.grTargetDx as number)
    : DEFAULT_GR_TARGET_DX_M;
  const includeExtra = options.includeExtra !== false;
  const includeMatter = options.includeMatter !== false;
  const includeKij = options.includeKij !== false;

  const timeoutMs = Number.isFinite(options.timeoutMs as number)
    ? (options.timeoutMs as number)
    : undefined;

  const pipeline = await fetchJson<any>(`${options.baseUrl}/api/helix/pipeline`, timeoutMs);
  const proofPack = await fetchJson<ProofPack>(
    `${options.baseUrl}/api/helix/pipeline/proofs`,
    timeoutMs,
  );
  const mathGraph = await fetchJson<MathGraphResponse>(
    `${options.baseUrl}/api/helix/math/graph`,
    timeoutMs,
  );

  const axes = resolveHullAxes(pipeline);
  const hasGeometry = Boolean(
    pipeline?.hull ||
      pipeline?.warpGeometry ||
      pipeline?.warpGeometryKind ||
      pipeline?.warpGeometryAssetId ||
      pipeline?.geometryPreview ||
      pipeline?.hullBrick,
  );
  const hasHull = hasGeometry && (!isDefaultHullAxes(axes) || resolveUserHullChoice(pipeline));

  const dims: [number, number, number] = [
    Math.max(1, Math.ceil((axes[0] * 2) / grTargetDx)),
    Math.max(1, Math.ceil((axes[1] * 2) / grTargetDx)),
    Math.max(1, Math.ceil((axes[2] * 2) / grTargetDx)),
  ];
  const dimsParam = dims.join("x");

  const grParams = new URLSearchParams();
  grParams.set("dims", dimsParam);
  if (options.quality) grParams.set("quality", options.quality);
  if (includeExtra) grParams.set("includeExtra", "1");
  if (includeMatter) grParams.set("includeMatter", "1");
  if (includeKij) grParams.set("includeKij", "1");
  grParams.set("format", "json");

  const grBrick = await fetchJson<any>(
    `${options.baseUrl}/api/helix/gr-evolve-brick?${grParams.toString()}`,
    timeoutMs,
  );

  const lapseBrick = await fetchJson<any>(
    `${options.baseUrl}/api/helix/lapse-brick?dims=${dimsParam}&format=json`,
    timeoutMs,
  ).catch(() => null);

  const wallParams = new URLSearchParams();
  const canonicalFamily =
    readProofString(proofPack, "warp_canonical_family") ??
    (pipeline as any)?.warp?.metricT00Contract?.family ??
    "unknown";
  const wallInvariant =
    options.wallInvariant ??
    (canonicalFamily === "natario" ? "ricci4" : "kretschmann");
  wallParams.set("dims", dimsParam);
  wallParams.set("wallMetrics", "1");
  wallParams.set("wallInvariant", wallInvariant);
  const regionStats = await fetchJson<any>(
    `${options.baseUrl}/api/helix/gr-region-stats?${wallParams.toString()}`,
    timeoutMs,
  ).catch(() => null);

  const mathIndex = buildMathNodeIndex(mathGraph.root);
  const gateRequirements = [
    { module: "server/energy-pipeline.ts", minStage: "reduced-order" },
    { module: "server/gr-evolve-brick.ts", minStage: "diagnostic" },
  ];
  const mathStageOKBase = gateRequirements.every((entry) =>
    meetsStage(mathIndex.get(entry.module)?.stage, entry.minStage),
  );

  const strictCongruence = (pipeline as any)?.strictCongruence !== false;
  const latticeMetricOnly = strictCongruence && canonicalFamily === "natario";
  const mathStageOK = latticeMetricOnly ? true : mathStageOKBase;
  const requirePresent = (key: string) => {
    const entry = getProofValue(proofPack, key);
    return !entry || entry.proxy;
  };
  const requireTrue = (key: string) => {
    const entry = getProofValue(proofPack, key);
    if (!entry || entry.proxy) return true;
    return entry.value !== true;
  };
  const strictMetricMissing = latticeMetricOnly
    ? requirePresent("metric_t00_rho_si_mean") ||
      requirePresent("metric_k_trace_mean") ||
      requirePresent("metric_k_sq_mean") ||
      requirePresent("theta_geom") ||
      requireTrue("metric_t00_contract_ok") ||
      requireTrue("theta_metric_derived") ||
      requireTrue("qi_metric_derived") ||
      requireTrue("ts_metric_derived")
    : false;

  const grGuardrails = resolveGrGuardrails(pipeline);
  const verificationGate = resolveStrictVerificationGate(pipeline);
  const grProxy = Boolean(grGuardrails?.proxy);
  const proofPackProxy = hasAnyProxy(proofPack);
  const anyProxy = latticeMetricOnly
    ? grProxy || strictMetricMissing
    : proofPackProxy || grProxy || strictMetricMissing;

  const wallDiagnostics = regionStats?.summary?.wall ?? null;
  const wallDetectionAvailable = Boolean(wallDiagnostics);
  const wallDetected = wallDiagnostics?.detected ?? null;
  const wallSource = wallDiagnostics?.source;

  const solverStatus = grBrick?.stats?.solverHealth?.status ?? "NOT_CERTIFIED";
  const grCertified = Boolean(
    grBrick?.meta?.status === "CERTIFIED" &&
      (grBrick?.stats?.solverHealth?.status ?? "NOT_CERTIFIED") === "CERTIFIED" &&
      (!grGuardrails ||
        (grGuardrails.proxy === false && grGuardrails.source === "pipeline-gr")) &&
      verificationGate.certified,
  );

  const cellSize = (gridScale * 2) / DEFAULT_GRID_DIV;

  const ui: TimeDilationRenderUiToggles = {
    hasHull,
    wallDetectionAvailable,
    wallDetected,
    wallSource,
    grRequested: true,
    grCertified,
    anyProxy,
    mathStageOK,
    cellSize,
    solverStatus,
    natarioGeometryWarp: true,
    visualTuning: {
      betaScale: 1,
      gammaScale: 1,
      kijScale: 1,
      gammaEnabled: true,
      kijEnabled: true,
    },
    betaPercentile: BETA_WARP_PERCENTILE,
    thetaPercentile: THETA_WARP_PERCENTILE,
    gammaPercentile: GAMMA_WARP_PERCENTILE,
    shearPercentile: SHEAR_WARP_PERCENTILE,
  };

  const renderPlan = computeTimeDilationRenderPlan(
    pipeline,
    grBrick ?? null,
    lapseBrick ?? null,
    ui,
  );

  const canonical = canonicalizeCanonicalField({
    family: canonicalFamily,
    chart: readProofString(proofPack, "warp_canonical_chart"),
    observer: readProofString(proofPack, "warp_canonical_observer"),
    normalization: readProofString(proofPack, "warp_canonical_normalization"),
    unitSystem: readProofString(proofPack, "warp_canonical_unit_system"),
    match: readProofString(proofPack, "warp_canonical_match"),
  });

  const definitions: Definitions = {
    theta_definition:
      readProofString(proofPack, "theta_definition") ??
      "theta = -Ktrace_eulerian (canonical declaration missing)",
    kij_sign_convention:
      readProofString(proofPack, "kij_sign_convention") ??
      "ADM (check sign convention in runtime)",
    gamma_field_naming:
      readProofString(proofPack, "gamma_field_naming") ??
      "gamma_phys_ij (or phi+tilde_gamma_ij)",
    field_provenance_schema:
      readProofString(proofPack, "field_provenance_schema") ??
      "runtime-field-provenance-v1",
  };
  const provenanceBase = {
    theta_definition: definitions.theta_definition,
    kij_sign_convention: definitions.kij_sign_convention,
  };

  const fieldProvenance = {
    fieldProvenanceSchema: definitions.field_provenance_schema,
    alpha: {
      source: renderPlan.sourceForAlpha,
      observer: canonical.observer,
      chart: canonical.chart,
      units: canonical.unitSystem,
      definitionId: "alpha",
      derivedFrom: "warp.metricAdapter.alpha",
    },
    beta: {
      source: renderPlan.sourceForBeta,
      observer: canonical.observer,
      chart: canonical.chart,
      units: "1/s",
      definitionId: "betaU",
      derivedFrom: "warp.metricAdapter.beta",
    },
    gamma: {
      source: "gr-brick",
      observer: canonical.observer,
      chart: canonical.chart,
      units: canonical.unitSystem,
      definitionId: "gamma",
      derivedFrom: "warp.metricAdapter.gammaDiag",
    },
    theta: {
      source: renderPlan.sourceForTheta,
      observer: canonical.observer,
      chart: canonical.chart,
      units: "1/s",
      definitionId: "theta",
      derivedFrom: "warp.metricAdapter.theta",
    },
    kTrace: {
      source: "gr-brick",
      observer: canonical.observer,
      chart: canonical.chart,
      units: "1/s",
      definitionId: "K",
      derivedFrom: "warp.metricAdapter.Ktrace",
    },
    ...provenanceBase,
  };

  const renderingSeed = [
    canonical.family,
    canonical.chart,
    canonical.observer,
    canonical.normalization,
    String(renderPlan.sourceForAlpha),
    String(renderPlan.sourceForBeta),
    String(renderPlan.sourceForTheta),
    String(renderPlan.metricBlend),
    String(renderPlan.warpCap),
  ].join("|");

  const renderingProbe = JSON.stringify({
    mode: renderPlan.mode,
    chart: canonical.chart,
    observer: canonical.observer,
    metricBlend: renderPlan.metricBlend,
    warpCap: renderPlan.warpCap,
    norm: renderPlan.normalization,
    betaWeight: renderPlan.betaWarpWeight,
    thetaWeight: renderPlan.thetaWarpWeight,
    shearWeight: renderPlan.shearWeight,
    geomScale: renderPlan.warpCap * renderPlan.metricBlend,
    geometryEnabled: renderPlan.enableGeometryWarp,
  });

  const congruenceKind = resolveCongruenceKind(canonical);
  const congruenceRequirements = resolveCongruenceRequirements(canonical, definitions);
  const shipComovingDtauDt = resolveShipComovingDtauDt(pipeline, proofPack);
  const tidalIndicator = resolveTidalIndicator(pipeline, proofPack);

  if (congruenceKind === "ship_comoving" && !shipComovingDtauDt.valid) {
    congruenceRequirements.requiredFieldsOk = false;
    congruenceRequirements.missingFields = [
      ...congruenceRequirements.missingFields,
      ...shipComovingDtauDt.missingFields,
    ];
  }

  const provenance = {
    alpha: {
      source: String(renderPlan.sourceForAlpha),
      observer: canonical.observer,
      chart: canonical.chart,
      units: canonical.unitSystem,
      definitionId: "alpha",
      derivedFrom: "warp.metricAdapter.alpha",
    },
    beta: {
      source: String(renderPlan.sourceForBeta),
      observer: canonical.observer,
      chart: canonical.chart,
      units: "1/s",
      definitionId: "betaU",
      derivedFrom: "warp.metricAdapter.beta",
    },
    gamma: {
      source: "gr-brick",
      observer: canonical.observer,
      chart: canonical.chart,
      units: canonical.unitSystem,
      definitionId: "gamma",
      derivedFrom: "warp.metricAdapter.gammaDiag",
    },
    theta: {
      source: String(renderPlan.sourceForTheta),
      observer: canonical.observer,
      chart: canonical.chart,
      units: "1/s",
      definitionId: "theta",
      derivedFrom: "warp.metricAdapter.theta",
    },
    kTrace: {
      source: "gr-brick",
      observer: canonical.observer,
      chart: canonical.chart,
      units: "1/s",
      definitionId: "K",
      derivedFrom: "warp.metricAdapter.Ktrace",
    },
    tidal_indicator: {
      source: tidalIndicator.provenance.source,
      observer: canonical.observer,
      chart: canonical.chart,
      units: tidalIndicator.units,
      definitionId: tidalIndicator.provenance.definitionId,
      derivedFrom: tidalIndicator.provenance.derivedFrom,
    },
  };

  const observables = Object.fromEntries(
    Object.entries(provenance).map(([field, info]) => [
      field,
      {
        source: info.source,
        observerFamily: congruenceKind,
        chart: info.chart,
        units: info.units,
      },
    ]),
  );

  observables.ship_comoving_dtau_dt = {
    source: "adm_worldline",
    observerFamily: "ship_comoving",
    chart: canonical.chart,
    units: "dimensionless",
    valid: shipComovingDtauDt.valid,
    missingFields: shipComovingDtauDt.missingFields,
    value: shipComovingDtauDt.value,
    formula: "dτ/dt = sqrt(alpha^2 - gamma_ij (dx^i/dt + beta^i)(dx^j/dt + beta^j))",
    details: shipComovingDtauDt.details,
  };

  observables.tidal_indicator = {
    source: tidalIndicator.provenance.source,
    observerFamily: congruenceKind,
    chart: canonical.chart,
    units: tidalIndicator.units,
    valid: tidalIndicator.status === "available",
    missingFields: tidalIndicator.status === "available" ? [] : tidalIndicator.unavailable?.required,
    value: tidalIndicator.scalar,
    formula: "||E_ij||_F = sqrt(sum_ij E_ij E^ij)",
    details:
      tidalIndicator.status === "available"
        ? {
          method: tidalIndicator.method,
          tensorPath: tidalIndicator.provenance.tensorPath,
          tensorLayout: tidalIndicator.provenance.tensorLayout,
        }
        : {
          status: tidalIndicator.status,
          reason: tidalIndicator.unavailable?.reason,
          deterministicBlockId: tidalIndicator.unavailable?.deterministicBlockId,
        },
  };

  const divBetaRms = toNumber((pipeline as any)?.warp?.metricAdapter?.betaDiagnostics?.divBetaRms);
  const divBetaMaxAbs = toNumber((pipeline as any)?.warp?.metricAdapter?.betaDiagnostics?.divBetaMaxAbs);
  const natarioExpansionTolerance = toNumber(readProofString(proofPack, "natario_expansion_tolerance")) ?? 1e-3;
  const divBetaStatus: "pass" | "fail" | "unknown" = divBetaRms == null
    ? "unknown"
    : divBetaRms <= natarioExpansionTolerance
      ? "pass"
      : "fail";
  const thetaGeom = toNumber(readProofString(proofPack, "theta_geom"));
  const kTrace = toNumber(readProofString(proofPack, "metric_k_trace_mean"));
  const thetaKTolerance = toNumber(readProofString(proofPack, "theta_k_tolerance")) ?? 1e-3;
  const thetaKResidualAbs = thetaGeom != null && kTrace != null ? Math.abs(thetaGeom + kTrace) : null;
  const thetaKStatus: "pass" | "fail" | "unknown" = thetaKResidualAbs == null
    ? "unknown"
    : thetaKResidualAbs <= thetaKTolerance
      ? "pass"
      : "fail";
  const natarioRequiredFieldsOk = thetaGeom != null && kTrace != null && divBetaRms != null;
  const natarioCanonicalSatisfied = natarioRequiredFieldsOk && divBetaStatus === "pass" && thetaKStatus === "pass";
  const natarioReason = natarioCanonicalSatisfied
    ? null
    : !natarioRequiredFieldsOk
      ? "natario_required_fields_missing"
      : divBetaStatus === "fail"
        ? "natario_divergence_constraint_failed"
        : thetaKStatus === "fail"
          ? "natario_theta_k_consistency_failed"
          : "natario_constraints_unknown";

  const diagnostics: TimeDilationDiagnostics = {
    kind: "time_dilation_diagnostics",
    captured_at: new Date().toISOString(),
    gate: {
      banner: renderPlan.banner,
      reasons: [
        ...(Array.isArray((renderPlan as { reasons?: string[] }).reasons)
          ? renderPlan.reasons
          : []),
        ...verificationGate.reasons.map((reason) => `verification:${reason}`),
      ],
    },
    definitions: {
      theta_definition: definitions.theta_definition,
      kij_sign_convention: definitions.kij_sign_convention,
      gamma_field_naming: definitions.gamma_field_naming,
      field_provenance_schema: definitions.field_provenance_schema,
    },
    fieldProvenance,
    congruence: {
      kind: congruenceKind,
      requiredFieldsOk: congruenceRequirements.requiredFieldsOk,
      missingFields: congruenceRequirements.missingFields,
      gaugeNote:
        canonical.chart === "unknown"
          ? "Gauge/chart metadata is incomplete; interpret plotted diagnostics as observer-relative only."
          : null,
    },
    observables,
    tidal: tidalIndicator,
    provenance,
    proofPack,
    renderingSeed,
    renderingProbe,
    strict: {
      strictCongruence,
      latticeMetricOnly,
      strictMetricMissing,
      anyProxy,
      mathStageOK,
      grCertified,
      banner: renderPlan.banner,
      certifiedLabelsAllowed: verificationGate.certifiedLabelsAllowed,
      strongClaimsAllowed: verificationGate.strongClaimsAllowed,
      failId: verificationGate.failId,
      failClosedReasons: verificationGate.reasons,
    },
    canonical: {
      family: canonicalFamily,
      chart: canonical.chart,
      observer: canonical.observer,
      normalization: canonical.normalization,
      unitSystem: canonical.unitSystem,
      match: canonical.match,
    },
    natarioCanonical: {
      requiredFieldsOk: natarioRequiredFieldsOk,
      canonicalSatisfied: natarioCanonicalSatisfied,
      checks: {
        divBeta: {
          status: divBetaStatus,
          rms: divBetaRms,
          maxAbs: divBetaMaxAbs,
          tolerance: natarioExpansionTolerance,
          source: "pipeline.warp.metricAdapter.betaDiagnostics",
        },
        thetaKConsistency: {
          status: thetaKStatus,
          theta: thetaGeom,
          kTrace,
          residualAbs: thetaKResidualAbs,
          tolerance: thetaKTolerance,
          source: "pipeline.theta_geom + proof.metric_k_trace_mean",
        },
      },
      reason: natarioReason,
    },
    metric_contract: {
      metric_t00_contract_ok: getProofValue(proofPack, "metric_t00_contract_ok")?.value ?? null,
      metric_chart_contract_status:
        getProofValue(proofPack, "metric_chart_contract_status")?.value ?? null,
      metric_chart_notes:
        getProofValue(proofPack, "metric_chart_notes")?.value ?? null,
      metric_coordinate_map:
        getProofValue(proofPack, "metric_coordinate_map")?.value ?? null,
    },
    render_plan: renderPlan,
    sources: {
      proof_pack_proxy: proofPackProxy,
      gr_guardrails_proxy: grProxy,
    },
    wall: wallDiagnostics,
    gr: {
      dims: grBrick?.dims ?? null,
      meta: grBrick?.meta ?? null,
      solverHealth: grBrick?.stats?.solverHealth ?? null,
    },
  };

  if (options.publish) {
    await fetch(`${options.baseUrl}/api/helix/time-dilation/diagnostics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "time-dilation-headless", ...diagnostics }),
    }).catch(() => null);
  }

  return diagnostics;
}
