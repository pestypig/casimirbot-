import type {
  GrConstraintContract,
  GrEvaluation,
  ProofPack,
  ProofValue,
  VacuumContract,
} from "./schema";
import {
  NHM2_CAVITY_CONTRACT,
  resolveNeedleHullMark2FullHullGeometry,
  resolveNeedleHullMark2FullHullTauLcMs,
  resolveNeedleHullMark2FullHullTauLcNs,
  resolveNeedleHullMark2ReducedOrderReference,
} from "./needle-hull-mark2-cavity-contract";
import { PROMOTED_WARP_PROFILE } from "./warp-promoted-profile";

const AUTHORITY_HULL = resolveNeedleHullMark2FullHullGeometry(NHM2_CAVITY_CONTRACT);
const AUTHORITY_TAU_LC_MS = resolveNeedleHullMark2FullHullTauLcMs(NHM2_CAVITY_CONTRACT);
const AUTHORITY_TAU_LC_NS = resolveNeedleHullMark2FullHullTauLcNs(NHM2_CAVITY_CONTRACT);
const REDUCED_ORDER_REFERENCE = resolveNeedleHullMark2ReducedOrderReference(NHM2_CAVITY_CONTRACT);
const HULL_MATCH_TOLERANCE_M = 1e-6;

type RecordLike = Record<string, unknown>;
type GuardrailStatus = "ok" | "fail" | "proxy" | "missing";
type OverallTone = "good" | "warn" | "bad";

export type MathStageLabel =
  | "exploratory"
  | "reduced-order"
  | "diagnostic"
  | "certified"
  | "unstaged";

export type MathTreeNodeLike = {
  id: string;
  stage?: MathStageLabel;
  children?: MathTreeNodeLike[];
};

export type MathStageGateLike = {
  ok: boolean;
  stage: MathStageLabel;
  pending?: boolean;
  modules?: Array<{
    module: string;
    stage: MathStageLabel;
    minStage: MathStageLabel;
    ok: boolean;
  }>;
};

type MathStageRequirement = {
  module: string;
  minStage: MathStageLabel;
};

const STAGE_RANK: Record<MathStageLabel, number> = {
  unstaged: -1,
  exploratory: 0,
  "reduced-order": 1,
  diagnostic: 2,
  certified: 3,
};

export const NHM2_PROOF_PACK_STAGE_REQUIREMENTS: ReadonlyArray<MathStageRequirement> = [
  { module: "shared/curvature-proxy.ts", minStage: "reduced-order" },
  { module: "client/src/physics/curvature.ts", minStage: "reduced-order" },
  { module: "client/src/lib/warp-proof-math.ts", minStage: "reduced-order" },
  { module: "server/helix-proof-pack.ts", minStage: "reduced-order" },
];

const meetsStage = (stage: MathStageLabel, minStage: MathStageLabel) =>
  STAGE_RANK[stage] >= STAGE_RANK[minStage];

const buildMathNodeIndex = (root?: MathTreeNodeLike | null) => {
  const map = new Map<string, MathTreeNodeLike>();
  if (!root) return map;
  const walk = (node: MathTreeNodeLike) => {
    map.set(node.id, node);
    node.children?.forEach(walk);
  };
  walk(root);
  return map;
};

export function resolveNhm2ProofPackStageGate(
  root?: MathTreeNodeLike | null,
): MathStageGateLike {
  const index = buildMathNodeIndex(root);
  const modules = NHM2_PROOF_PACK_STAGE_REQUIREMENTS.map((req) => {
    const node = index.get(req.module);
    const stage = node?.stage ?? "unstaged";
    return {
      module: req.module,
      stage,
      minStage: req.minStage,
      ok: meetsStage(stage, req.minStage),
    };
  });
  const ok = modules.every((item) => item.ok);
  const stage = modules.reduce<MathStageLabel>((worst, item) => {
    return STAGE_RANK[item.stage] < STAGE_RANK[worst] ? item.stage : worst;
  }, "certified");
  return { ok, stage, modules, pending: false };
}

export type Nhm2SolveState = {
  overall: {
    tone: OverallTone;
    label: string;
    reasons: string[];
  };
  authority: {
    solutionCategory: string;
    profileVersion: string;
    contractStatus: string;
    generatorVersion: string;
    warpFieldType: string;
    metricT00Source: string;
  };
  pipeline: {
    available: boolean;
    claimTier: string | null;
    provenanceClass: string | null;
    currentMode: string | null;
    warpFieldType: string | null;
    gammaGeo: number | null;
    gammaVanDenBroeck: number | null;
    qCavity: number | null;
    qSpoilingFactor: number | null;
    dutyCycle: number | null;
    sectorCount: number | null;
    concurrentSectors: number | null;
    zeta: number | null;
    congruentSolvePass: boolean | null;
    geometryFallback: {
      mode: string | null;
      applied: boolean;
      blocked: boolean;
      reasons: string[];
    };
  };
  geometry: {
    authority: {
      Lx_m: number;
      Ly_m: number;
      Lz_m: number;
      hullReferenceRadius_m: number;
    };
    live: {
      Lx_m: number | null;
      Ly_m: number | null;
      Lz_m: number | null;
    };
    matchesAuthority: boolean | null;
    mismatchAxes: string[];
  };
  timing: {
    fullHullTauLcMs: number;
    fullHullTauLcNs: number;
    reducedOrderRadiusM: number;
    reducedOrderTauLcMs: number | null;
    liveTauLcMs: number | null;
  };
  proof: {
    available: boolean;
    strictMode: boolean;
    strictProxy: boolean;
    stage: string | null;
    stageOk: boolean;
    stagePending: boolean;
    metricAdapterFamily: string | null;
    chartStatus: string | null;
    chartReason: string | null;
    proofHullMatchesAuthority: boolean | null;
  };
  contract: {
    available: boolean;
    source: string | null;
    proxy: boolean;
    evaluationPass: boolean | null;
    certificateStatus: string | null;
    admissibleStatus: string | null;
    certificateHash: string | null;
    integrityOk: boolean | null;
    brickStatus: string | null;
    failingConstraints: string[];
    guardrails: {
      fordRoman: GuardrailStatus;
      thetaAudit: GuardrailStatus;
      tsRatio: GuardrailStatus;
      vdbBand: GuardrailStatus;
    };
  };
  vacuum: {
    available: boolean;
    status: string | null;
    fingerprint: string | null;
    changed: string[];
  };
};

export type Nhm2SolveStateInput = {
  pipeline?: unknown;
  proofPack?: ProofPack | null;
  grConstraintContract?: GrConstraintContract | null;
  grEvaluation?: GrEvaluation | null;
  vacuumContract?: VacuumContract | null;
  stageGate?: MathStageGateLike | null;
};

const asRecord = (value: unknown): RecordLike | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as RecordLike;
};

const asFinite = (value: unknown): number | null => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readNumber = (source: RecordLike | null, ...keys: string[]): number | null => {
  if (!source) return null;
  for (const key of keys) {
    const value = asFinite(source[key]);
    if (value != null) return value;
  }
  return null;
};

const readText = (source: RecordLike | null, ...keys: string[]): string | null => {
  if (!source) return null;
  for (const key of keys) {
    const value = asText(source[key]);
    if (value != null) return value;
  }
  return null;
};

const getProofValue = (
  pack: ProofPack | null | undefined,
  key: string,
): ProofValue | undefined => pack?.values?.[key];

const readProofBoolean = (
  pack: ProofPack | null | undefined,
  key: string,
): boolean | null => {
  const value = getProofValue(pack, key)?.value;
  return typeof value === "boolean" ? value : null;
};

const isStrictProofPack = (pack: ProofPack | null | undefined): boolean => {
  const thetaStrict = readProofBoolean(pack, "theta_strict_mode");
  const qiStrict = readProofBoolean(pack, "qi_strict_mode");
  return thetaStrict === true || qiStrict === true;
};

const STRICT_TELEMETRY_KEYS = new Set<string>([
  "theta_pipeline_raw",
  "theta_pipeline_cal",
  "theta_pipeline_proxy",
  "mechanical_safety_min",
  "mechanical_note",
  "gr_cl3_rho_delta_pipeline_mean_telemetry",
]);

const isStrictBlocked = (
  pack: ProofPack | null | undefined,
  entry: ProofValue | undefined,
  strictOverride?: boolean,
): boolean => {
  if (!entry) return false;
  const strict =
    typeof strictOverride === "boolean"
      ? strictOverride
      : isStrictProofPack(pack);
  return strict && entry.proxy === true;
};

const readProofNumberStrict = (
  pack: ProofPack | null | undefined,
  key: string,
  strictOverride?: boolean,
): number | null => {
  const entry = getProofValue(pack, key);
  if (isStrictBlocked(pack, entry, strictOverride)) return null;
  const value = entry?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const readProofStringStrict = (
  pack: ProofPack | null | undefined,
  key: string,
  strictOverride?: boolean,
): string | null => {
  const entry = getProofValue(pack, key);
  if (isStrictBlocked(pack, entry, strictOverride)) return null;
  const value = entry?.value;
  return typeof value === "string" ? value : null;
};

const hasStrictProxy = (
  pack: ProofPack | null | undefined,
  keys?: string[],
): boolean => {
  if (!pack) return true;
  const values = pack.values ?? {};
  const strictKeys = keys ?? Object.keys(values);
  return strictKeys.some((key) => {
    if (STRICT_TELEMETRY_KEYS.has(key)) return false;
    return values[key]?.proxy === true;
  });
};

const normalizeGuardrailStatus = (value: unknown): GuardrailStatus => {
  if (value === "ok" || value === "fail" || value === "proxy" || value === "missing") {
    return value;
  }
  return "missing";
};

const compareAxis = (authority: number, live: number | null) =>
  live != null && Math.abs(authority - live) <= HULL_MATCH_TOLERANCE_M;

export function buildNhm2SolveState(input: Nhm2SolveStateInput = {}): Nhm2SolveState {
  const pipeline = input.pipeline ?? null;
  const proofPack = input.proofPack ?? null;
  const grConstraintContract = input.grConstraintContract ?? null;
  const grEvaluation = input.grEvaluation ?? null;
  const vacuumContract = input.vacuumContract ?? null;
  const stageGate = input.stageGate ?? null;

  const pipelineRecord = asRecord(pipeline);
  const hull = asRecord(pipelineRecord?.hull);
  const lightCrossing = asRecord(pipelineRecord?.lightCrossing);
  const geometryFallback = asRecord(pipelineRecord?.geometryFallback);
  const proofStrictMode = isStrictProofPack(proofPack);

  const liveHull = {
    Lx_m: readNumber(hull, "Lx_m", "Lx"),
    Ly_m: readNumber(hull, "Ly_m", "Ly"),
    Lz_m: readNumber(hull, "Lz_m", "Lz"),
  };

  const mismatchAxes = [
    !compareAxis(AUTHORITY_HULL.Lx_m, liveHull.Lx_m) && liveHull.Lx_m != null ? "Lx" : null,
    !compareAxis(AUTHORITY_HULL.Ly_m, liveHull.Ly_m) && liveHull.Ly_m != null ? "Ly" : null,
    !compareAxis(AUTHORITY_HULL.Lz_m, liveHull.Lz_m) && liveHull.Lz_m != null ? "Lz" : null,
  ].filter((value): value is string => Boolean(value));
  const liveHullAvailable = liveHull.Lx_m != null && liveHull.Ly_m != null && liveHull.Lz_m != null;
  const liveHullMatchesAuthority = liveHullAvailable ? mismatchAxes.length === 0 : null;

  const proofHull = {
    Lx_m: readProofNumberStrict(proofPack, "hull_Lx_m", proofStrictMode),
    Ly_m: readProofNumberStrict(proofPack, "hull_Ly_m", proofStrictMode),
    Lz_m: readProofNumberStrict(proofPack, "hull_Lz_m", proofStrictMode),
  };
  const proofHullAvailable = proofHull.Lx_m != null && proofHull.Ly_m != null && proofHull.Lz_m != null;
  const proofHullMatchesAuthority = proofHullAvailable
    ? compareAxis(AUTHORITY_HULL.Lx_m, proofHull.Lx_m) &&
      compareAxis(AUTHORITY_HULL.Ly_m, proofHull.Ly_m) &&
      compareAxis(AUTHORITY_HULL.Lz_m, proofHull.Lz_m)
    : null;

  const contractGuardrails = grConstraintContract?.guardrails;
  const guardrails = {
    fordRoman: normalizeGuardrailStatus(contractGuardrails?.fordRoman),
    thetaAudit: normalizeGuardrailStatus(contractGuardrails?.thetaAudit),
    tsRatio: normalizeGuardrailStatus(contractGuardrails?.tsRatio),
    vdbBand: normalizeGuardrailStatus(contractGuardrails?.vdbBand),
  };

  const guardrailStatuses = Object.values(guardrails);
  const failingConstraints = (grEvaluation?.constraints ?? grConstraintContract?.constraints ?? [])
    .filter((entry) => entry?.status === "fail")
    .map((entry) => asText(entry?.id) ?? "unknown_constraint");

  const evaluationCertificate = grEvaluation?.certificate ?? null;
  const contractCertificate = grConstraintContract?.certificate ?? null;
  const certificateStatus =
    asText(evaluationCertificate?.status) ?? asText(contractCertificate?.status);
  const admissibleStatus =
    asText(evaluationCertificate?.admissibleStatus) ??
    asText(contractCertificate?.admissibleStatus);
  const certificateHash =
    asText(evaluationCertificate?.certificateHash) ??
    asText(contractCertificate?.certificateHash);
  const integrityOk =
    typeof evaluationCertificate?.integrityOk === "boolean"
      ? evaluationCertificate.integrityOk
      : null;
  const stagePending = stageGate?.pending === true;
  const stageOk = stageGate?.ok === true;
  const strictProxy = hasStrictProxy(proofPack);
  const geometryFallbackApplied = geometryFallback?.applied === true;
  const geometryFallbackBlocked = geometryFallback?.blocked === true;
  const overallReasons: string[] = [];

  if (!pipeline) overallReasons.push("pipeline unavailable");
  if (stagePending) overallReasons.push("math stage gate pending");
  else if (!stageOk) overallReasons.push("proof-pack stage gate not satisfied");
  if (!proofPack) overallReasons.push("proof-pack unavailable");
  else if (strictProxy) overallReasons.push("strict proof-pack proxy present");
  if (grEvaluation?.pass === false) overallReasons.push("GR evaluation failed");
  if (integrityOk === false) overallReasons.push("certificate integrity failed");
  else if (!certificateHash) overallReasons.push("certificate hash unavailable");
  if (grConstraintContract?.proxy === true) overallReasons.push("GR constraint contract marked proxy");
  if (grConstraintContract?.diagnostics?.brickMeta?.status === "NOT_CERTIFIED") {
    overallReasons.push("GR brick not certified");
  }
  if (geometryFallbackBlocked) overallReasons.push("geometry fallback blocked");
  else if (geometryFallbackApplied) overallReasons.push("geometry fallback applied");
  if (liveHullMatchesAuthority === false) {
    overallReasons.push(`live hull drift on ${mismatchAxes.join("/")}`);
  }
  if (guardrailStatuses.some((status) => status === "fail")) {
    overallReasons.push("one or more GR guardrails failed");
  } else if (guardrailStatuses.some((status) => status === "proxy")) {
    overallReasons.push("one or more GR guardrails remain proxy-derived");
  } else if (guardrailStatuses.some((status) => status === "missing")) {
    overallReasons.push("one or more GR guardrails are missing");
  }

  const overallTone: OverallTone =
    !pipeline ||
    strictProxy ||
    grEvaluation?.pass === false ||
    integrityOk === false ||
    geometryFallbackBlocked
      ? "bad"
      : overallReasons.length > 0
        ? "warn"
        : "good";

  return {
    overall: {
      tone: overallTone,
      label:
        overallTone === "good"
          ? "Authority wired"
          : overallTone === "warn"
            ? "Guarded / partial"
            : "Blocked / proxy",
      reasons: overallReasons,
    },
    authority: {
      solutionCategory: NHM2_CAVITY_CONTRACT.solutionCategory,
      profileVersion: NHM2_CAVITY_CONTRACT.profileVersion,
      contractStatus: NHM2_CAVITY_CONTRACT.status,
      generatorVersion: NHM2_CAVITY_CONTRACT.generator_version,
      warpFieldType: NHM2_CAVITY_CONTRACT.geometry.warpFieldType,
      metricT00Source: NHM2_CAVITY_CONTRACT.readout.metricT00Source,
    },
    pipeline: {
      available: Boolean(pipeline),
      claimTier: readText(pipelineRecord, "claim_tier", "claimTier"),
      provenanceClass: readText(pipelineRecord, "provenance_class", "provenanceClass"),
      currentMode: readText(pipelineRecord, "currentMode"),
      warpFieldType:
        readText(pipelineRecord, "warpFieldType") ?? PROMOTED_WARP_PROFILE.warpFieldType,
      gammaGeo: readNumber(pipelineRecord, "gammaGeo"),
      gammaVanDenBroeck: readNumber(
        pipelineRecord,
        "gammaVanDenBroeck",
        "gammaVdB",
        "gammaVanDenBroeck_vis",
      ),
      qCavity: readNumber(pipelineRecord, "qCavity"),
      qSpoilingFactor: readNumber(pipelineRecord, "qSpoilingFactor", "deltaAOverA"),
      dutyCycle: readNumber(
        pipelineRecord,
        "dutyCycle",
        "dutyShip",
        "dutyEffectiveFR",
        "dutyEffective_FR",
      ),
      sectorCount: readNumber(pipelineRecord, "sectorCount", "sectorsTotal"),
      concurrentSectors: readNumber(
        pipelineRecord,
        "concurrentSectors",
        "sectorsConcurrent",
        "sectorStrobing",
      ),
      zeta: readNumber(pipelineRecord, "zeta", "deltaAOverA"),
      congruentSolvePass:
        typeof pipelineRecord?.congruentSolvePass === "boolean"
          ? (pipelineRecord.congruentSolvePass as boolean)
          : null,
      geometryFallback: {
        mode: readText(geometryFallback, "mode"),
        applied: geometryFallbackApplied,
        blocked: geometryFallbackBlocked,
        reasons: Array.isArray(geometryFallback?.reasons)
          ? geometryFallback.reasons.filter(
              (value): value is string =>
                typeof value === "string" && value.trim().length > 0,
            )
          : [],
      },
    },
    geometry: {
      authority: {
        Lx_m: AUTHORITY_HULL.Lx_m,
        Ly_m: AUTHORITY_HULL.Ly_m,
        Lz_m: AUTHORITY_HULL.Lz_m,
        hullReferenceRadius_m: Math.max(
          AUTHORITY_HULL.Lx_m,
          AUTHORITY_HULL.Ly_m,
          AUTHORITY_HULL.Lz_m,
        ) / 2,
      },
      live: liveHull,
      matchesAuthority: liveHullMatchesAuthority,
      mismatchAxes,
    },
    timing: {
      fullHullTauLcMs: AUTHORITY_TAU_LC_MS,
      fullHullTauLcNs: AUTHORITY_TAU_LC_NS,
      reducedOrderRadiusM: REDUCED_ORDER_REFERENCE.radius_m,
      reducedOrderTauLcMs: REDUCED_ORDER_REFERENCE.tauLC_ms ?? null,
      liveTauLcMs:
        readNumber(lightCrossing, "tauLC_ms", "tauLcMs", "fullHullTauLCMs") ??
        readNumber(pipelineRecord, "tauLC_ms", "tauLcMs"),
    },
    proof: {
      available: Boolean(proofPack),
      strictMode: proofStrictMode,
      strictProxy,
      stage: stageGate?.stage ?? null,
      stageOk,
      stagePending,
      metricAdapterFamily:
        readProofStringStrict(proofPack, "metric_adapter_family", proofStrictMode) ??
        readText(pipelineRecord, "warpFieldType"),
      chartStatus: readProofStringStrict(
        proofPack,
        "metric_chart_contract_status",
        proofStrictMode,
      ),
      chartReason: readProofStringStrict(
        proofPack,
        "metric_chart_contract_reason",
        proofStrictMode,
      ),
      proofHullMatchesAuthority,
    },
    contract: {
      available: Boolean(grConstraintContract || grEvaluation),
      source: grConstraintContract?.sources?.grDiagnostics ?? null,
      proxy: grConstraintContract?.proxy === true,
      evaluationPass:
        typeof grEvaluation?.pass === "boolean" ? grEvaluation.pass : null,
      certificateStatus,
      admissibleStatus,
      certificateHash,
      integrityOk,
      brickStatus: grConstraintContract?.diagnostics?.brickMeta?.status ?? null,
      failingConstraints,
      guardrails,
    },
    vacuum: {
      available: Boolean(vacuumContract),
      status: vacuumContract?.status ?? null,
      fingerprint: vacuumContract?.fingerprint ?? null,
      changed: Array.isArray(vacuumContract?.changed) ? vacuumContract.changed : [],
    },
  };
}
