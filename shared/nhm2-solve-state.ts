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
  closureStack: {
    sameChartFullTensor: {
      available: boolean;
      fullTensorComplete: boolean | null;
      missingComponentIds: string[];
    };
    sourceSideSameBasisTensorAuthority: {
      available: boolean;
      hasWallAuthority: boolean | null;
      allRequiredRegionsAuthoritative: boolean | null;
      blockers: string[];
    };
    wallSourceClosure: {
      available: boolean;
      pass: boolean | null;
      relativeResidual: number | null;
      blockers: string[];
    };
    observerRobustEnergyConditions: {
      available: boolean;
      robustCheckComplete: boolean | null;
      eulerianOnly: boolean | null;
      anyViolation: boolean | null;
    };
    qeiWorldlineDossier: {
      available: boolean;
      dossierComplete: boolean | null;
      hasWallWorldline: boolean | null;
      anyProxy: boolean | null;
    };
    casimirMaterialReceipt: {
      available: boolean;
      status: string | null;
      idealScalarOnly: boolean | null;
    };
    natarioInvariantAudit: {
      available: boolean;
      status: string | null;
      thetaFlatnessStatus: string | null;
      invariantStatus: string | null;
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

const readBoolean = (source: RecordLike | null, ...keys: string[]): boolean | null => {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }
  return null;
};

const readRecord = (source: RecordLike | null, ...keys: string[]): RecordLike | null => {
  if (!source) return null;
  for (const key of keys) {
    const record = asRecord(source[key]);
    if (record != null) return record;
  }
  return null;
};

const readStringArray = (source: RecordLike | null, ...keys: string[]): string[] => {
  if (!source) return [];
  for (const key of keys) {
    const value = source[key];
    if (!Array.isArray(value)) continue;
    return value.filter(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
    );
  }
  return [];
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

const combineBooleanAll = (values: Array<boolean | null>): boolean | null => {
  const known = values.filter((value): value is boolean => typeof value === "boolean");
  if (known.length === 0) return null;
  if (known.some((value) => value === false)) return false;
  return true;
};

const combineBooleanAny = (values: Array<boolean | null>): boolean | null => {
  const known = values.filter((value): value is boolean => typeof value === "boolean");
  if (known.length === 0) return null;
  return known.some((value) => value === true);
};

export function buildNhm2SolveState(input: Nhm2SolveStateInput = {}): Nhm2SolveState {
  const pipeline = input.pipeline ?? null;
  const proofPack = input.proofPack ?? null;
  const grConstraintContract = input.grConstraintContract ?? null;
  const grEvaluation = input.grEvaluation ?? null;
  const vacuumContract = input.vacuumContract ?? null;
  const stageGate = input.stageGate ?? null;

  const pipelineRecord = asRecord(pipeline);
  const natarioRecord = readRecord(pipelineRecord, "natario");
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
  const sameChartTensor =
    readRecord(pipelineRecord, "nhm2SameChartFullTensor", "nhm2_same_chart_full_tensor") ??
    readRecord(natarioRecord, "nhm2SameChartFullTensor", "nhm2_same_chart_full_tensor");
  const sameChartCompleteness = readRecord(sameChartTensor, "completeness");
  const sourceClosure =
    readRecord(pipelineRecord, "nhm2SourceClosure", "nhm2_source_closure") ??
    readRecord(natarioRecord, "nhm2SourceClosure", "nhm2_source_closure");
  const sourceSideSameBasisTensorAuthority =
    readRecord(
      pipelineRecord,
      "nhm2SourceSideSameBasisTensorAuthority",
      "nhm2_source_side_same_basis_tensor_authority",
    ) ??
    readRecord(
      natarioRecord,
      "nhm2SourceSideSameBasisTensorAuthority",
      "nhm2_source_side_same_basis_tensor_authority",
    ) ??
    readRecord(
      sourceClosure,
      "sourceSideSameBasisTensorAuthority",
      "source_side_same_basis_tensor_authority",
    );
  const sourceSideAuthoritySummary = readRecord(
    sourceSideSameBasisTensorAuthority,
    "summary",
  );
  const sourceSideAuthorityRegions = Array.isArray(
    sourceSideSameBasisTensorAuthority?.regions,
  )
    ? (sourceSideSameBasisTensorAuthority?.regions as unknown[])
        .map((entry) => asRecord(entry))
        .filter((entry): entry is RecordLike => entry != null)
    : [];
  const wallSourceClosure =
    readRecord(pipelineRecord, "nhm2WallSourceClosure", "nhm2_wall_source_closure") ??
    readRecord(natarioRecord, "nhm2WallSourceClosure", "nhm2_wall_source_closure") ??
    readRecord(sourceClosure, "wallSourceClosure", "wall_source_closure");
  const wallResidual = readRecord(wallSourceClosure, "residual");
  const robustEnergyConditions =
    readRecord(
      pipelineRecord,
      "nhm2ObserverRobustEnergyConditions",
      "nhm2_observer_robust_energy_conditions",
    ) ??
    readRecord(
      natarioRecord,
      "nhm2ObserverRobustEnergyConditions",
      "nhm2_observer_robust_energy_conditions",
    ) ??
    readRecord(
      readRecord(pipelineRecord, "nhm2ObserverAudit", "nhm2_observer_audit") ??
        readRecord(natarioRecord, "nhm2ObserverAudit", "nhm2_observer_audit"),
      "observerRobustEnergyConditions",
    );
  const robustConditionArtifacts = [
    readRecord(robustEnergyConditions, "metricRequired"),
    readRecord(robustEnergyConditions, "tileEffective"),
    robustEnergyConditions?.contractVersion === "nhm2_observer_robust_energy_conditions/v1"
      ? robustEnergyConditions
      : null,
  ].filter((entry): entry is RecordLike => entry != null);
  const robustSummaries = robustConditionArtifacts.map((artifact) =>
    readRecord(artifact, "summary"),
  );
  const qeiWorldlineDossier =
    readRecord(pipelineRecord, "nhm2QeiWorldlineDossier", "nhm2_qei_worldline_dossier") ??
    readRecord(natarioRecord, "nhm2QeiWorldlineDossier", "nhm2_qei_worldline_dossier");
  const qeiSummary = readRecord(qeiWorldlineDossier, "summary");
  const casimirMaterialReceipt =
    readRecord(pipelineRecord, "casimirMaterialReceipt", "casimir_material_receipt") ??
    readRecord(natarioRecord, "casimirMaterialReceipt", "casimir_material_receipt");
  const casimirMaterialReceiptStatus =
    readText(casimirMaterialReceipt, "status") ??
    readText(pipelineRecord, "casimir_material_receipt_status");
  const natarioInvariantAudit =
    readRecord(
      pipelineRecord,
      "nhm2NatarioInvariantAudit",
      "nhm2_natario_invariant_audit",
    ) ??
    readRecord(
      natarioRecord,
      "nhm2NatarioInvariantAudit",
      "nhm2_natario_invariant_audit",
    );
  const natarioInvariantExpansion = readRecord(natarioInvariantAudit, "expansion");
  const natarioInvariantCurvature = readRecord(natarioInvariantAudit, "invariants");
  const natarioInvariantStability = readRecord(natarioInvariantAudit, "stability");
  const natarioInvariantBlockers = readStringArray(natarioInvariantAudit, "blockers");
  const natarioInvariantStatus =
    readText(natarioInvariantAudit, "status") ??
    readText(pipelineRecord, "nhm2_full_loop_natario_invariant_audit_status") ??
    (natarioInvariantAudit == null
      ? null
      : readText(natarioInvariantExpansion, "thetaFlatnessStatus") === "fail" ||
          readText(natarioInvariantStability, "convergenceStatus") === "fail"
        ? "fail"
        : natarioInvariantBlockers.length > 0
          ? "review"
          : "pass");
  const closureStack: Nhm2SolveState["closureStack"] = {
    sameChartFullTensor: {
      available: sameChartTensor != null,
      fullTensorComplete:
        readBoolean(sameChartCompleteness, "fullTensorComplete") ??
        readBoolean(pipelineRecord, "nhm2_same_chart_full_tensor_complete"),
      missingComponentIds: readStringArray(sameChartCompleteness, "missingComponentIds"),
    },
    sourceSideSameBasisTensorAuthority: {
      available: sourceSideSameBasisTensorAuthority != null,
      hasWallAuthority:
        readBoolean(sourceSideAuthoritySummary, "hasWallAuthority") ??
        readBoolean(pipelineRecord, "nhm2_source_side_same_basis_wall_authority"),
      allRequiredRegionsAuthoritative:
        readBoolean(sourceSideAuthoritySummary, "allRequiredRegionsAuthoritative") ??
        readBoolean(
          pipelineRecord,
          "nhm2_source_side_same_basis_all_regions_authoritative",
        ),
      blockers: Array.from(
        new Set([
          ...readStringArray(sourceSideSameBasisTensorAuthority, "blockers"),
          ...sourceSideAuthorityRegions.flatMap((region) =>
            readStringArray(region, "blockers"),
          ),
        ]),
      ),
    },
    wallSourceClosure: {
      available: wallSourceClosure != null,
      pass:
        readBoolean(wallResidual, "pass") ??
        readBoolean(pipelineRecord, "nhm2_wall_source_closure_pass"),
      relativeResidual:
        readNumber(wallResidual, "relative") ??
        readNumber(pipelineRecord, "nhm2_wall_source_closure_relative_residual"),
      blockers: readStringArray(wallSourceClosure, "blockers"),
    },
    observerRobustEnergyConditions: {
      available: robustConditionArtifacts.length > 0,
      robustCheckComplete: combineBooleanAll(
        robustSummaries.map((summary) => readBoolean(summary, "robustCheckComplete")),
      ),
      eulerianOnly: combineBooleanAny(
        robustSummaries.map((summary) => readBoolean(summary, "eulerianOnly")),
      ),
      anyViolation: combineBooleanAny(
        robustSummaries.map((summary) => readBoolean(summary, "anyViolation")),
      ),
    },
    qeiWorldlineDossier: {
      available: qeiWorldlineDossier != null,
      dossierComplete:
        readBoolean(qeiSummary, "dossierComplete") ??
        readBoolean(pipelineRecord, "nhm2_qei_worldline_dossier_complete"),
      hasWallWorldline:
        readBoolean(qeiSummary, "hasWallWorldline") ??
        readBoolean(pipelineRecord, "nhm2_qei_worldline_dossier_has_wall"),
      anyProxy:
        readBoolean(qeiSummary, "anyProxy") ??
        readBoolean(pipelineRecord, "nhm2_qei_worldline_dossier_any_proxy"),
    },
    casimirMaterialReceipt: {
      available: casimirMaterialReceipt != null,
      status: casimirMaterialReceiptStatus,
      idealScalarOnly:
        casimirMaterialReceiptStatus == null
          ? null
          : casimirMaterialReceiptStatus === "ideal_scalar_only",
    },
    natarioInvariantAudit: {
      available: natarioInvariantAudit != null,
      status: natarioInvariantStatus,
      thetaFlatnessStatus:
        readText(natarioInvariantExpansion, "thetaFlatnessStatus") ??
        readText(pipelineRecord, "nhm2_natario_theta_flatness_status"),
      invariantStatus:
        readText(natarioInvariantCurvature, "status") ??
        readText(pipelineRecord, "nhm2_natario_invariant_status"),
    },
  };
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
  if (
    !closureStack.sameChartFullTensor.available ||
    closureStack.sameChartFullTensor.fullTensorComplete !== true
  ) {
    overallReasons.push("same-chart full tensor incomplete");
  }
  if (
    !closureStack.sourceSideSameBasisTensorAuthority.available ||
    closureStack.sourceSideSameBasisTensorAuthority.allRequiredRegionsAuthoritative !== true
  ) {
    overallReasons.push("source-side same-basis tensor authority missing");
  }
  if (
    !closureStack.sourceSideSameBasisTensorAuthority.available ||
    closureStack.sourceSideSameBasisTensorAuthority.hasWallAuthority !== true
  ) {
    overallReasons.push("wall source-side same-basis tensor authority missing");
  }
  if (
    !closureStack.wallSourceClosure.available ||
    closureStack.wallSourceClosure.pass !== true
  ) {
    overallReasons.push("wall source closure missing/failing");
  }
  if (
    !closureStack.observerRobustEnergyConditions.available ||
    closureStack.observerRobustEnergyConditions.robustCheckComplete !== true ||
    closureStack.observerRobustEnergyConditions.eulerianOnly === true
  ) {
    overallReasons.push("observer-robust energy-condition check incomplete");
  }
  if (
    !closureStack.qeiWorldlineDossier.available ||
    closureStack.qeiWorldlineDossier.dossierComplete !== true ||
    closureStack.qeiWorldlineDossier.hasWallWorldline !== true
  ) {
    overallReasons.push("QEI worldline dossier incomplete");
  }
  if (
    !closureStack.casimirMaterialReceipt.available ||
    closureStack.casimirMaterialReceipt.status !== "material_receipted"
  ) {
    overallReasons.push("Casimir material receipt missing");
  }
  if (
    !closureStack.natarioInvariantAudit.available ||
    closureStack.natarioInvariantAudit.status !== "pass" ||
    closureStack.natarioInvariantAudit.invariantStatus !== "computed"
  ) {
    overallReasons.push("Natário invariant audit incomplete");
  }

  const closureBlocked =
    closureStack.sourceSideSameBasisTensorAuthority.hasWallAuthority === false ||
    closureStack.wallSourceClosure.pass === false ||
    closureStack.observerRobustEnergyConditions.anyViolation === true ||
    closureStack.natarioInvariantAudit.status === "fail";
  const overallTone: OverallTone =
    !pipeline ||
    strictProxy ||
    grEvaluation?.pass === false ||
    integrityOk === false ||
    geometryFallbackBlocked ||
    closureBlocked
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
    closureStack,
    vacuum: {
      available: Boolean(vacuumContract),
      status: vacuumContract?.status ?? null,
      fingerprint: vacuumContract?.fingerprint ?? null,
      changed: Array.isArray(vacuumContract?.changed) ? vacuumContract.changed : [],
    },
  };
}
