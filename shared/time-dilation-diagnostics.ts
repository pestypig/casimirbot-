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
  };
  canonical: {
    family: string;
    chart: string | null;
    observer: string | null;
    normalization: string | null;
    unitSystem: string | null;
    match: string | null;
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

const canonicalizeCanonicalField = (canonical: CanonicalField): CanonicalField => ({
  family: canonical.family,
  chart: canonical.chart ?? "unknown",
  observer: canonical.observer ?? "unknown",
  normalization: canonical.normalization ?? "unknown",
  unitSystem: canonical.unitSystem ?? "unknown",
  match: canonical.match ?? "unknown",
});

const toNumber = (value: unknown): number | null => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
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
        (grGuardrails.proxy === false && grGuardrails.source === "pipeline-gr")),
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

  const diagnostics: TimeDilationDiagnostics = {
    kind: "time_dilation_diagnostics",
    captured_at: new Date().toISOString(),
    gate: {
      banner: renderPlan.banner,
      reasons: Array.isArray((renderPlan as { reasons?: string[] }).reasons)
        ? renderPlan.reasons
        : [],
    },
    definitions: {
      theta_definition: definitions.theta_definition,
      kij_sign_convention: definitions.kij_sign_convention,
      gamma_field_naming: definitions.gamma_field_naming,
      field_provenance_schema: definitions.field_provenance_schema,
    },
    fieldProvenance,
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
    },
    canonical: {
      family: canonicalFamily,
      chart: canonical.chart,
      observer: canonical.observer,
      normalization: canonical.normalization,
      unitSystem: canonical.unitSystem,
      match: canonical.match,
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
