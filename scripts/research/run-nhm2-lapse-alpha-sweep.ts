import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { enforceResearchCitationGate } from "../lib/research-citation-gate";
import {
  publishNhm2ShiftLapseFullLoopAudit,
  publishNhm2ShiftLapseSelectedTransportBundle,
} from "../warp-york-control-family-proof-pack";
import { resolveWarpShiftLapseProfileStrict } from "../../modules/warp/warp-metric-adapter";

type SweepBracket =
  | "baseline"
  | "near-baseline"
  | "moderate"
  | "strong"
  | "strong-known"
  | "exploratory";

type SweepSpec = {
  alpha: number;
  tag: string;
  bracket: SweepBracket;
};

type CitationSpec = {
  id: string;
  type: "paper" | "web" | "github_clone";
  title: string;
  url?: string;
  doi?: string;
};

type Nhm2ClaimClass =
  | "repo_measured"
  | "repo_plus_literature"
  | "literature_only_nonproof"
  | "not_validated";

type SweepConfig = {
  family: "nhm2-shift-lapse";
  sweepName: string;
  clockingMode: "bounded-lapse";
  preserveTransportSchedule: boolean;
  currentClaimTier: "diagnostic";
  maximumClaimTier: "reduced-order";
  alphas: SweepSpec[];
  citations?: CitationSpec[];
  claimLanguagePolicy?: {
    measuredOrDerivedRequiresCitation?: boolean;
    hypothesisRequiresUncertaintyNote?: boolean;
    exploratoryBracketCannotAutoPromote?: boolean;
  };
};

type CitationRegistryPaper = {
  id: string;
  title: string;
  url: string;
  doi?: string;
  year: number;
  publisherType: "journal" | "preprint" | "review";
  allowedClaimClasses: Nhm2ClaimClass[];
  sourceStability: "primary_peer_reviewed" | "preprint";
  evidenceRole: "theory_context" | "constraint_context" | "nonproof_context";
};

type CitationRegistry = {
  manifestType: "nhm2_alpha_sweep_citations/v1";
  generatedOn: string;
  papers: CitationRegistryPaper[];
  claimClassRequiredPaperIds: {
    literature_context: string[];
    extrapolation_candidate: string[];
    not_validated: string[];
  };
  policyClaimPaperIds?: string[];
};

type ResearchLockEntry = {
  id: string;
  doi?: string;
  url: string;
  accessedOn: string;
  publisherType: "journal" | "preprint" | "review";
  year: number;
  evidenceRole: "theory_context" | "constraint_context" | "nonproof_context";
  claimClasses: Nhm2ClaimClass[];
};

type ResearchLock = {
  manifestType: "nhm2_alpha_sweep_research_lock/v1";
  generatedOn: string;
  entries: ResearchLockEntry[];
};

type SweepAvailabilityStageDetail = {
  available: boolean;
  artifactPresent: boolean;
  inspectionMissingOrFailed: boolean;
  parseStatus: "pass" | "missing" | "fail" | "n/a";
  laneProfileMatch: "pass" | "fail" | "n/a";
  mismatchReasonCodes: string[];
  sectionState: string;
  sectionReasonCodes: string[];
};

type SweepFullLoopAvailability = {
  fullLoopStateRaw: string | null;
  strictSignalAvailable: boolean;
  sourceClosureAvailable: boolean;
  observerAuditAvailable: boolean;
  certificateAvailable: boolean;
  availabilityReasonCodes: string[];
  stageDetail: {
    strictSignal: SweepAvailabilityStageDetail;
    sourceClosure: SweepAvailabilityStageDetail;
    observerAudit: SweepAvailabilityStageDetail;
    certificate: SweepAvailabilityStageDetail;
  };
};

export interface Nhm2ClockingBaseline {
  profileId: string;
  centerlineAlpha: number;
  coordinateTimeS: number;
  properTimeS: number;
  properMinusCoordinateS: number;
}

export interface Nhm2ExpectedClockingTarget {
  derivedFromProfileId: string;
  coordinateTimeS: number;
  expectedProperTimeS: number;
  expectedProperMinusCoordinateS: number;
  expectedSavedTimeS: number;
  expectedSavedDays: number;
  expectedProperToCoordinateRatio: number;
  expectedSubjectiveEfficiency: number;
  savedTimeMultipleVsBaseline: number;
}

type SweepRow = {
  profileId: string;
  bracket: SweepBracket;
  family: "nhm2-shift-lapse";
  clockingMode: "bounded-lapse";
  centerlineAlpha: number;
  centerlineDtauDt: number;
  coordinateTimeS: number | null;
  properTimeS: number | null;
  properMinusCoordinateS: number | null;
  savedDays: number | null;
  properToCoordinateRatio: number | null;
  subjectiveEfficiency: number;
  clockingTargetState: "expected_not_validated" | "expected_and_validated";
  validationState: "planned" | "runtime_blocked" | "gate_failed" | "evidence_viable";
  expectedClockingTarget: Nhm2ExpectedClockingTarget | null;
  betaOverAlphaMax: number | null;
  wallHorizonMargin: number | null;
  decompositionResidualS: number | null;
  lapseTrackedFraction: number | null;
  invariantGateStatus: "pass" | "fail" | null;
  fullLoopStateRaw: string | null;
  fullLoopStateNormalized: "pass" | "fail";
  fullLoopAvailability?: SweepFullLoopAvailability | null;
  runHealth?:
    | "healthy_fresh"
    | "failed_timeout"
    | "failed_stall"
    | "failed_stale"
    | "failed_missing"
    | "pending";
  runtimeBlockingReason?:
    | "selected_transport_timeout"
    | "selected_transport_stall"
    | "selected_transport_lock_contention"
    | "selected_transport_process_error"
    | "selected_transport_missing_artifact"
    | "selected_transport_invalid_json"
    | "selected_transport_profile_mismatch"
    | "selected_transport_gate_fail"
    | "selected_transport_stale_artifact"
    | "selected_transport_unknown_error"
    | null;
  stageDetailFreshness?: {
    allFresh: boolean;
    staleReasonCodes: string[];
    runStartedAt: string | null;
    freshnessCheckedAt: string | null;
    freshnessDecision: "fresh" | "stale" | "missing" | "timeout" | "stall";
    artifactMtimeIso: {
      fullLoopAuditLatest: string | null;
      sourceClosureLatest: string | null;
      observerAuditLatest: string | null;
    };
  } | null;
  coordinateTimeDeltaFromBaselineS: number | null;
  coordinateTimeDeltaFromBaselineRel: number | null;
  gates: {
    baselineInvariance: "pass" | "fail";
    clockingConsistency: "pass" | "fail";
    antiSrSafety: "pass" | "fail";
    decompositionConsistency: "pass" | "fail";
    invariantGate: "pass" | "fail";
    fullLoopAudit: "pass" | "fail";
    evidenceLedger: "pass" | "fail";
    promotionEligible: "pass" | "fail";
  };
  progressionClass:
    | "validated_candidate"
    | "exploratory_pass_blocked_by_policy"
    | "diagnostic_fail";
  claimClass:
    Nhm2ClaimClass;
  supportTier: ClaimSupportTier;
  literatureContextOnly: boolean;
  claimClassNote: string;
  uncertainty: {
    category: "none" | "literature_context" | "evidence_gap" | "runtime_blocker";
    blockers: string[];
    nextMeasurement: string;
    note: string;
  };
  gateDiagnostics: {
    baselineToleranceS: number;
    baselineToleranceRel: number;
    ratioError: number | null;
    ratioTolerance: number;
    expectedProperTimeErrorS: number | null;
    properMinusErrorS: number | null;
    properMinusToleranceS: number;
    expectedProperMinusErrorS: number | null;
    betaOverAlphaMaxLimit: number;
    wallHorizonMarginMin: number;
    decompositionResidualToleranceS: number;
    lapseTrackedFractionMin: number;
    evidenceBlocking: boolean | null;
    evidenceLedgerReason:
      | "pass"
      | "blocking_evidence_true"
      | "validation_failed"
      | "entry_unmapped"
      | "full_loop_unavailable"
      | "full_loop_failed";
  };
  overallState: string;
  currentClaimTier: "diagnostic";
  maximumClaimTier: "reduced-order";
  sourceDir: string;
  auditDir: string;
  provenance: {
    generatedAt: string;
    gitSha: string | null;
    sweepConfigPath: string;
    sweepConfigChecksum: string;
    fullLoopExecuted: boolean;
    solverCommand: string;
  };
};

type ClaimLedgerStatus = "measured" | "derived" | "hypothesis";
type ClaimSupportTier =
  | "repo_measured"
  | "repo_plus_literature"
  | "literature_only_nonproof";

type SweepClaimLedgerClaim = {
  claimId: string;
  claimText: string;
  status: ClaimLedgerStatus;
  supportTier?: ClaimSupportTier;
  profileId?: string;
  artifactPaths: string[];
  sourceIds: string[];
  literatureContextOnly?: boolean;
  uncertaintyNote?: string;
  uncertaintyRationale?: string;
  scopeBoundary?: string;
  allowedClaim?: string;
  cannotClaim?: string[];
};

type SweepFailureSummary = {
  generatedAt: string;
  sweepName: string;
  firstFailureProfileId: string | null;
  strongestPassingProfileId: string | null;
  dominantFailureGate:
    | "baselineInvariance"
    | "clockingConsistency"
    | "antiSrSafety"
    | "decompositionConsistency"
    | "invariantGate"
    | "fullLoopAudit"
    | null;
  failedRows: Array<{
    profileId: string;
    bracket: SweepBracket;
    failedGates: string[];
    overallState: string;
  }>;
};

type FrontierBlockerClass =
  | "not_run"
  | "selected_transport_runtime"
  | "missing_full_loop_audit"
  | "stale_artifact"
  | "profile_mismatch"
  | "clocking_mismatch"
  | "decomposition_mismatch"
  | "anti_sr_gate_fail"
  | "stress_or_constraint_gate_fail"
  | "unknown";

type FrontierLadderGroup =
  | "confirmed_revalidation_ladder"
  | "frontier_bisection_ladder"
  | "deep_exploratory_ladder";

type Nhm2FrontierDistanceRow = {
  profileId: string;
  tag: string;
  centerlineAlpha: number;
  bracket: SweepBracket;
  ladderGroup: FrontierLadderGroup;
  expectedProperTimeS: number;
  expectedSavedDays: number;
  expectedSubjectiveEfficiency: number;
  validationState:
    | "evidence_viable"
    | "runtime_viable"
    | "runtime_blocked"
    | "gate_failed"
    | "planned"
    | "skipped_after_blocker";
  distanceFromAnchor: {
    anchorProfileId: "stage1_centerline_alpha_0p995_v1";
    alphaDeltaFromAnchor: number;
    expectedAdditionalSavedDaysVsAnchor: number;
    expectedEfficiencyGainVsAnchor: number;
  };
  measuredDistance: {
    measuredProperTimeS: number | null;
    measuredProperToCoordinateRatio: number | null;
    properTimeErrorVsExpectedS: number | null;
    decompositionResidualS: number | null;
    lapseTrackedFraction: number | null;
    betaOverAlphaMax: number | null;
    wallHorizonMargin: number | null;
  } | null;
  blocker: {
    blockerClass: FrontierBlockerClass | null;
    blockerStage: string | null;
    runtimeBlockingReason: SweepRow["runtimeBlockingReason"] | null;
    nextAction: string | null;
  };
};

type Nhm2FrontierDistanceSummary = {
  manifestType: "nhm2_frontier_distance/v1";
  generatedAt: string;
  sweepName: string;
  family: "nhm2-shift-lapse";
  clockingMode: "bounded-lapse";
  anchor: Nhm2ClockingBaseline;
  expectedClockingModel: {
    model: "tau_expected(alpha)=alpha*coordinate_time";
    claimBoundary: string;
  };
  frontier: LadderProgressSummary["frontier"];
  rows: Nhm2FrontierDistanceRow[];
};

type SweepClaimPromotionReport = {
  generatedAt: string;
  sweepName: string;
  claims: Array<{
    claimId: string;
    profileId: string | null;
    claimClass:
      | "repo_measured"
      | "repo_plus_literature"
      | "literature_only_nonproof"
      | "not_validated";
    fullLoopStateRaw: string | null;
    normalizedFullLoopState: "pass" | "fail";
    evidenceLedgerState: "pass" | "fail";
    evidenceLedgerReason:
      | "pass"
      | "blocking_evidence_true"
      | "validation_failed"
      | "entry_unmapped"
      | "full_loop_unavailable"
      | "full_loop_failed";
    fullLoopAvailability?: SweepFullLoopAvailability | null;
    supportTier: ClaimSupportTier;
    promotionDecision: "promoted" | "blocked";
    firstBlockingGate:
      | "baselineInvariance"
      | "clockingConsistency"
      | "antiSrSafety"
      | "decompositionConsistency"
      | "invariantGate"
      | "fullLoopAudit"
      | "evidenceLedger"
      | null;
    firstBlockingReason: string | null;
    nextAction: string | null;
    blockingReasons: string[];
  }>;
};

type EvidenceSufficiency = {
  required: string[];
  present: string[];
  missing: string[];
  pass: boolean;
};

type ResearchConfidenceTier = "context_only" | "constraint_supported" | "repo_measured";

type FullLoopArtifactFreshnessRecord = {
  fileName: string;
  path: string;
  exists: boolean;
  mtimeMs: number | null;
  fresh: boolean;
};

type Nhm2RunHeartbeatStage =
  | "init"
  | "selected_transport"
  | "full_loop"
  | "freshness_check"
  | "claims"
  | "complete"
  | "failed";

type Nhm2RunHeartbeatPayload = {
  profileId: string;
  stage: Nhm2RunHeartbeatStage;
  detail: string | null;
  pid: number;
  runStartedAt: string;
  updatedAt: string;
  lastProgressAt: string;
  heartbeatIntervalMs: number;
};

const repoRoot = process.cwd();
const configPath = path.join(repoRoot, "configs", "research", "nhm2-lapse-alpha-sweep.json");
export const resolveNhm2SweepOutputRoots = (
  root: string,
  env: NodeJS.ProcessEnv = process.env,
): { sweepRoot: string; sweepAuditRoot: string; runBound: boolean } => {
  const requestedOutputDirectory = (env.NHM2_OUTPUT_DIR ?? "").trim();
  if (requestedOutputDirectory) {
    const sweepRoot = path.resolve(root, requestedOutputDirectory);
    return {
      sweepRoot,
      sweepAuditRoot: path.join(sweepRoot, "audit"),
      runBound: true,
    };
  }
  return {
    sweepRoot: path.join(
      root,
      "artifacts",
      "research",
      "full-solve",
      "selected-family",
      "nhm2-shift-lapse",
      "alpha-sweep",
    ),
    sweepAuditRoot: path.join(
      root,
      "docs",
      "audits",
      "research",
      "selected-family",
      "nhm2-shift-lapse",
      "alpha-sweep",
    ),
    runBound: false,
  };
};
const { sweepRoot, sweepAuditRoot } = resolveNhm2SweepOutputRoots(repoRoot);
const citationChecklistPath = path.join(
  repoRoot,
  "docs",
  "research",
  "research-citation-patch-checklist.v1.json",
);
const citationRegistryPath = path.join(
  repoRoot,
  "docs",
  "research",
  "nhm2-alpha-sweep-citation-registry.v1.json",
);
const citationRegistryFallbackPath = path.join(
  repoRoot,
  "configs",
  "research",
  "nhm2-alpha-sweep-citations.v1.json",
);
const researchLockPath = path.join(
  repoRoot,
  "docs",
  "research",
  "nhm2-alpha-sweep-research-lock.v1.json",
);
const selectedFamilyRootArtifactDir = path.join(
  repoRoot,
  "artifacts",
  "research",
  "full-solve",
  "selected-family",
  "nhm2-shift-lapse",
);
const proofSurfacePublicationLockPath = path.join(
  repoRoot,
  "artifacts",
  "research",
  "full-solve",
  ".nhm2-proof-surface-publication.lock",
);
const baselineProfileId = "stage1_centerline_alpha_0p995_v1";
const baselineAnchorDefaults = {
  centerlineAlpha: 0.995,
  coordinateTimeS: 137755965.9171795,
  properTimeS: 137067186.0875936,
  properMinusCoordinateS: -688779.8295859098,
} as const;
const baselineCoordinateRelTol = 1e-9;
const baselineCoordinateAbsTolS = 1e-3;
const clockRatioTol = 1e-9;
const properMinusRelTol = 1e-9;
const properMinusAbsTolS = 1e-3;
const antiSrBetaOverAlphaMaxLimit = 1e-6;
const antiSrWallHorizonMarginMin = 1;
const decompositionResidualToleranceS = 1e-3;
const lapseTrackedFractionMin = 0.99;
const defaultFullLoopTimeoutS = 1800;
const defaultSelectedTransportTimeoutS = 900;
const defaultSelectedTransportTimeoutMaxS = 1800;
const defaultHeartbeatIntervalS = 15;
const defaultStallMaxNoProgressS = 600;
const defaultStallMinHeartbeats = 5;
const controlledExploratoryOrder = ["0p7000", "0p6500", "0p6000", "0p5500", "0p5000"] as const;
const ISO_DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const DOI_RX = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

const readJson = <T>(filePath: string): T => {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
};

const readJsonMaybe = <T>(filePath: string): T | null => {
  if (!fs.existsSync(filePath)) return null;
  return readJson<T>(filePath);
};

const toFinite = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function deriveExpectedClockingTarget(
  baseline: Nhm2ClockingBaseline,
  targetAlpha: number,
): Nhm2ExpectedClockingTarget {
  if (!Number.isFinite(targetAlpha) || targetAlpha <= 0 || targetAlpha > 1) {
    throw new Error(`Invalid targetAlpha=${targetAlpha}; expected 0 < alpha <= 1`);
  }
  if (!Number.isFinite(baseline.coordinateTimeS) || baseline.coordinateTimeS <= 0) {
    throw new Error(`Invalid baseline coordinateTimeS=${baseline.coordinateTimeS}`);
  }
  const baselineSavedTimeS = -baseline.properMinusCoordinateS;
  if (!Number.isFinite(baselineSavedTimeS) || baselineSavedTimeS <= 0) {
    throw new Error(`Invalid baseline saved time=${baselineSavedTimeS}`);
  }
  const expectedProperTimeS = targetAlpha * baseline.coordinateTimeS;
  const expectedProperMinusCoordinateS = (targetAlpha - 1) * baseline.coordinateTimeS;
  const expectedSavedTimeS = -expectedProperMinusCoordinateS;
  return {
    derivedFromProfileId: baseline.profileId,
    coordinateTimeS: baseline.coordinateTimeS,
    expectedProperTimeS,
    expectedProperMinusCoordinateS,
    expectedSavedTimeS,
    expectedSavedDays: expectedSavedTimeS / 86400,
    expectedProperToCoordinateRatio: targetAlpha,
    expectedSubjectiveEfficiency: 1 / targetAlpha,
    savedTimeMultipleVsBaseline: expectedSavedTimeS / baselineSavedTimeS,
  };
}

export function assertBaselineClockingCoherence(
  baseline: Nhm2ClockingBaseline,
  toleranceS = 1e-5,
): void {
  const expectedProperTimeS = baseline.centerlineAlpha * baseline.coordinateTimeS;
  const expectedProperMinusCoordinateS =
    (baseline.centerlineAlpha - 1) * baseline.coordinateTimeS;
  const properTimeErrorS = Math.abs(baseline.properTimeS - expectedProperTimeS);
  const deltaErrorS = Math.abs(
    baseline.properMinusCoordinateS - expectedProperMinusCoordinateS,
  );
  if (properTimeErrorS > toleranceS || deltaErrorS > toleranceS) {
    throw new Error(
      [
        "Baseline NHM2 clocking artifact is not coherent.",
        `properTimeErrorS=${properTimeErrorS}`,
        `deltaErrorS=${deltaErrorS}`,
        `toleranceS=${toleranceS}`,
      ].join(" "),
    );
  }
}

export const readPositiveTimeoutMsFromEnv = (
  envName: string,
  fallbackSeconds: number,
): number => {
  const raw = process.env[envName];
  if (raw == null || raw.trim().length <= 0) {
    return Math.max(0, Math.trunc(fallbackSeconds * 1000));
  }
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error(`Invalid ${envName}: expected non-negative seconds, got ${raw}`);
  }
  return Math.max(0, Math.trunc(seconds * 1000));
};

export const readPositiveIntFromEnv = (
  envName: string,
  fallback: number,
): number => {
  const raw = process.env[envName];
  if (raw == null || raw.trim().length <= 0) return Math.max(0, Math.trunc(fallback));
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error(`Invalid ${envName}: expected non-negative integer, got ${raw}`);
  }
  return parsed;
};

const readRequiredEnv = (envName: string): string => {
  const raw = process.env[envName];
  if (raw == null || raw.trim().length <= 0) {
    throw new Error(`Missing required env var: ${envName}`);
  }
  return raw.trim();
};

const runWithTimeout = async <T>(args: {
  timeoutMs: number;
  operation: () => Promise<T>;
}): Promise<{ timedOut: boolean; value: T | null }> => {
  if (args.timeoutMs <= 0) {
    return { timedOut: false, value: await args.operation() };
  }
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutResult = new Promise<{ timedOut: true; value: null }>((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true, value: null }), args.timeoutMs);
  });
  const operationResult = args
    .operation()
    .then((value) => ({ timedOut: false as const, value }));
  try {
    return await Promise.race([operationResult, timeoutResult]);
  } finally {
    if (timer != null) clearTimeout(timer);
  }
};

type HeartbeatHealthSnapshot = {
  lastProgressAtMs: number;
  heartbeatTicksSinceProgress: number;
};

export const isStalledByHeartbeat = (args: {
  health: HeartbeatHealthSnapshot;
  nowMs: number;
  stallMaxNoProgressMs: number;
  stallMinHeartbeats: number;
}): boolean => {
  if (args.stallMaxNoProgressMs <= 0) return false;
  const noProgressMs = Math.max(0, args.nowMs - args.health.lastProgressAtMs);
  return (
    noProgressMs >= args.stallMaxNoProgressMs &&
    args.health.heartbeatTicksSinceProgress >= args.stallMinHeartbeats
  );
};

const runWithTimeoutOrStall = async <T>(args: {
  timeoutMs: number;
  operation: () => Promise<T>;
  heartbeat: { getHealth: () => HeartbeatHealthSnapshot };
  stallMaxNoProgressMs: number;
  stallMinHeartbeats: number;
  stallCheckIntervalMs: number;
}): Promise<{ timedOut: boolean; stalled: boolean; value: T | null }> => {
  const operationPromise = args
    .operation()
    .then((value) => ({ timedOut: false, stalled: false, value }));
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  let stallChecker: ReturnType<typeof setInterval> | null = null;
  const timeoutPromise =
    args.timeoutMs > 0
      ? new Promise<{ timedOut: true; stalled: false; value: null }>((resolve) =>
          {
            timeoutHandle = setTimeout(
              () => resolve({ timedOut: true, stalled: false, value: null }),
              args.timeoutMs,
            );
            timeoutHandle.unref?.();
          },
        )
      : null;
  const stallPromise =
    args.stallMaxNoProgressMs > 0
      ? new Promise<{ timedOut: false; stalled: true; value: null }>((resolve) => {
          stallChecker = setInterval(() => {
            const health = args.heartbeat.getHealth();
            if (
              isStalledByHeartbeat({
                health,
                nowMs: Date.now(),
                stallMaxNoProgressMs: args.stallMaxNoProgressMs,
                stallMinHeartbeats: args.stallMinHeartbeats,
              })
            ) {
              if (stallChecker != null) clearInterval(stallChecker);
              resolve({ timedOut: false, stalled: true, value: null });
            }
          }, Math.max(250, args.stallCheckIntervalMs));
          stallChecker.unref?.();
        })
      : null;
  const waiters = [
    operationPromise,
    ...(timeoutPromise ? [timeoutPromise] : []),
    ...(stallPromise ? [stallPromise] : []),
  ];
  try {
    return await Promise.race(waiters);
  } finally {
    if (timeoutHandle != null) clearTimeout(timeoutHandle);
    if (stallChecker != null) clearInterval(stallChecker);
  }
};

type SelectedTransportRuntimeReason =
  | "selected_transport_timeout"
  | "selected_transport_stall"
  | "selected_transport_lock_contention"
  | "selected_transport_process_error"
  | "selected_transport_missing_artifact"
  | "selected_transport_invalid_json"
  | "selected_transport_profile_mismatch"
  | "selected_transport_gate_fail"
  | "selected_transport_stale_artifact"
  | "selected_transport_unknown_error";

type SelectedTransportRuntimeAttempt = {
  attempt: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  timeoutMs: number;
  staleLockFound: boolean;
  staleLockRemoved: boolean;
  staleLockMtimeIso: string | null;
  staleLockAgeS: number | null;
  outcome: "success" | "timeout" | "stall" | "error";
  runtimeReason: SelectedTransportRuntimeReason | null;
  error: string | null;
  attemptArtifactRoot: string;
  attemptAuditRoot: string;
  killedProcessTree: boolean;
  killedPids: number[];
  selectedTransportRuntimeDiagnostics?: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
    stepDurationsMs: {
      boundedStack: number;
      shiftVsLapseDecomposition: number;
      transportArtifactBuild: number;
      transportArtifactWrite: number;
    };
  } | null;
};

type LadderState =
  | "planned"
  | "completed_pass"
  | "completed_gate_fail"
  | "blocked_runtime"
  | "blocked_timeout"
  | "blocked_transport_error"
  | "skipped_after_blocker";

type LadderProgressRow = {
  profileId: string;
  tag: string;
  centerlineAlpha: number;
  bracket: SweepBracket;
  ladderState: LadderState;
  blockedBy: string | null;
  overallState: string | null;
  runtimeBlockingReason: SweepRow["runtimeBlockingReason"] | null;
  fullLoopStateRaw: string | null;
};

type LadderProgressSummary = {
  generatedAt: string;
  rows: LadderProgressRow[];
  frontier: {
    lowestPassingAlpha: number | null;
    lowestPassingProfileId: string | null;
    firstBlockedAlpha: number | null;
    firstBlockedProfileId: string | null;
    blockingReason: string | null;
    promotionState: "open" | "blocked";
  };
};

export const inferSelectedTransportRuntimeReason = (errorText: string): SelectedTransportRuntimeReason => {
  if (/proof_surface_publication_locked|selected-family-bounded-stack\.lock/i.test(errorText)) {
    return "selected_transport_lock_contention";
  }
  if (/selected_transport_missing_artifact/i.test(errorText)) {
    return "selected_transport_missing_artifact";
  }
  if (/selected_transport_invalid_json/i.test(errorText)) {
    return "selected_transport_invalid_json";
  }
  if (/selected_transport_profile_mismatch/i.test(errorText)) {
    return "selected_transport_profile_mismatch";
  }
  if (/selected_transport_gate_fail/i.test(errorText)) {
    return "selected_transport_gate_fail";
  }
  if (/selected_transport_stale_artifact/i.test(errorText)) {
    return "selected_transport_stale_artifact";
  }
  if (/spawn|exit code|terminated|process/i.test(errorText)) {
    return "selected_transport_process_error";
  }
  return "selected_transport_unknown_error";
};

export const resolveSelectedTransportOnlyContract = (env: NodeJS.ProcessEnv): {
  profileId: string;
  profileTag: string;
  alpha: number;
  dtau: number;
  outputDir: string;
} => {
  const profileId = (env.NHM2_PROFILE_ID ?? "").trim();
  if (!profileId) {
    throw new Error("Missing required env var: NHM2_PROFILE_ID");
  }
  const profileTag = (env.NHM2_PROFILE_TAG ?? "").trim() || inferTagFromProfileId(profileId) || "";
  if (!profileTag) {
    throw new Error(
      `Selected-transport-only mode requires NHM2_PROFILE_TAG or stage1_centerline_alpha_<tag>_v1 profile id. Got ${profileId}`,
    );
  }
  const alphaRaw = (env.NHM2_CENTERLINE_ALPHA ?? "").trim();
  const dtauRaw = (env.NHM2_CENTERLINE_DTAU_DT ?? "").trim();
  if (!alphaRaw) throw new Error("Missing required env var: NHM2_CENTERLINE_ALPHA");
  if (!dtauRaw) throw new Error("Missing required env var: NHM2_CENTERLINE_DTAU_DT");
  const alpha = Number(alphaRaw);
  const dtau = Number(dtauRaw);
  if (!Number.isFinite(alpha)) {
    throw new Error(`Invalid numeric env var: NHM2_CENTERLINE_ALPHA=${alphaRaw}`);
  }
  if (!Number.isFinite(dtau)) {
    throw new Error(`Invalid numeric env var: NHM2_CENTERLINE_DTAU_DT=${dtauRaw}`);
  }
  if (alpha <= 0 || alpha > 1) {
    throw new Error(`Invalid NHM2_CENTERLINE_ALPHA=${alpha}; expected 0 < alpha <= 1`);
  }
  if (Math.abs(alpha - dtau) > 1e-15) {
    throw new Error(
      `Bounded-lapse mode requires NHM2_CENTERLINE_ALPHA==NHM2_CENTERLINE_DTAU_DT; got ${alpha} vs ${dtau}`,
    );
  }
  if (inferProfileId(profileTag) !== profileId) {
    throw new Error(
      `Profile/tag mismatch in selected-transport-only mode: NHM2_PROFILE_ID=${profileId}, NHM2_PROFILE_TAG=${profileTag}`,
    );
  }
  const outputDir = (env.NHM2_OUTPUT_DIR ?? "").trim();
  if (!outputDir) {
    throw new Error("Missing required env var: NHM2_OUTPUT_DIR");
  }
  return {
    profileId,
    profileTag,
    alpha,
    dtau,
    outputDir,
  };
};

export const getNextActionForRuntimeReason = (reason: SweepRow["runtimeBlockingReason"]): string | null => {
  if (reason === "selected_transport_timeout") {
    return "Increase NHM2_SELECTED_TRANSPORT_TIMEOUT_S within cap and rerun controlled single-profile loop.";
  }
  if (reason === "selected_transport_stall") {
    return "Inspect selected transport runtime diagnostics and heartbeat, then adjust stall thresholds only if no progress.";
  }
  if (reason === "selected_transport_lock_contention") {
    return "Clear stale selected-family lock, verify no active competing publisher, then rerun profile.";
  }
  if (reason === "selected_transport_process_error") {
    return "Inspect selected transport process failure and worker stderr, then rerun profile.";
  }
  if (reason === "selected_transport_missing_artifact") {
    return "Inspect selected transport attempt artifact root and patch missing required artifact publication.";
  }
  if (reason === "selected_transport_invalid_json") {
    return "Inspect selected transport artifact JSON write path and patch invalid/truncated writer.";
  }
  if (reason === "selected_transport_profile_mismatch") {
    return "Inspect selected transport profile resolution and enforce profile/alpha coherence.";
  }
  if (reason === "selected_transport_gate_fail") {
    return "Inspect selected transport gate result and treat as gate fail, not runtime pass.";
  }
  if (reason === "selected_transport_stale_artifact") {
    return "Inspect stale selected transport artifact timestamps and rerun with clean attempt directory.";
  }
  if (reason === "selected_transport_unknown_error") {
    return "Inspect selected transport error and stack trace, patch failing step, and rerun profile.";
  }
  return null;
};

export const writeHeartbeatSnapshot = (args: {
  profileArtifactRoot: string;
  payload: Nhm2RunHeartbeatPayload;
}): string => {
  const outPath = path.join(args.profileArtifactRoot, "nhm2-run-heartbeat-latest.json");
  writeJsonAtomic(outPath, args.payload);
  return outPath;
};

const writeJsonAtomic = (filePath: string, payload: unknown): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(tmpPath, filePath);
};

const writeAttemptWorkerPidManifest = (args: {
  attemptArtifactRoot: string;
  profileId: string;
  candidatePids: number[];
  killedPids: number[];
}): void => {
  writeJsonAtomic(path.join(args.attemptArtifactRoot, "attempt-worker-pids.json"), {
    generatedAt: new Date().toISOString(),
    profileId: args.profileId,
    currentPid: process.pid,
    candidatePids: args.candidatePids,
    killedPids: args.killedPids,
  });
};

const collectPotentialSelectedTransportPids = (profileId: string): number[] => {
  try {
    if (process.platform !== "win32") return [];
    const script = [
      `$self=${process.pid};`,
      "$targets = Get-CimInstance Win32_Process | Where-Object {",
      "  $_.ProcessId -ne $self -and $_.CommandLine -and (",
      `    $_.CommandLine -like '*${profileId}*' -or`,
      "    $_.CommandLine -like '*warp-york-control-family-proof-pack*'",
      "  )",
      "};",
      "$targets | Select-Object -ExpandProperty ProcessId | ConvertTo-Json -Compress",
    ].join(" ");
    const out = execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      { encoding: "utf8" },
    ).trim();
    if (!out) return [];
    const parsed = JSON.parse(out);
    const pids = Array.isArray(parsed) ? parsed : [parsed];
    return pids
      .map((entry) => Number(entry))
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
  } catch {
    return [];
  }
};

const killPotentialSelectedTransportProcessTree = (profileId: string): {
  killedProcessTree: boolean;
  candidatePids: number[];
  killedPids: number[];
} => {
  const candidatePids = collectPotentialSelectedTransportPids(profileId);
  try {
    if (process.platform !== "win32") {
      return { killedProcessTree: false, candidatePids, killedPids: [] };
    }
    const killedPids: number[] = [];
    for (const pid of candidatePids) {
      if (pid === process.pid) continue;
      try {
        execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
          stdio: "ignore",
        });
        killedPids.push(pid);
      } catch {
        // ignore per-pid failure
      }
    }
    return { killedProcessTree: killedPids.length > 0, candidatePids, killedPids };
  } catch {
    return { killedProcessTree: false, candidatePids, killedPids: [] };
  }
};

const parseJsonOrThrow = <T>(filePath: string): T => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    throw new Error(`selected_transport_invalid_json:${filePath}:${String(error)}`);
  }
};

const validateSelectedTransportAttemptOutputs = (args: {
  attemptArtifactRoot: string;
  expectedProfileId: string;
  expectedAlpha: number;
  attemptStartedMs: number;
}): void => {
  const transportPath = path.join(
    args.attemptArtifactRoot,
    "nhm2-shift-lapse-transport-result-latest.json",
  );
  const worldlinePath = path.join(
    args.attemptArtifactRoot,
    "nhm2-warp-worldline-proof-latest.json",
  );
  for (const requiredPath of [transportPath, worldlinePath]) {
    if (!fs.existsSync(requiredPath)) {
      throw new Error(`selected_transport_missing_artifact:${requiredPath}`);
    }
    const mtimeMs = fs.statSync(requiredPath).mtimeMs;
    if (!Number.isFinite(mtimeMs) || mtimeMs + 1 < args.attemptStartedMs) {
      throw new Error(
        `selected_transport_stale_artifact:${requiredPath}:mtimeMs=${mtimeMs}:attemptStartedMs=${args.attemptStartedMs}`,
      );
    }
  }
  const transport = parseJsonOrThrow<Record<string, unknown>>(transportPath);
  const profileId = String(
    (transport.selectedFamily as any)?.shiftLapseProfileId ??
      (transport.profile as any)?.profileId ??
      "",
  );
  if (profileId.trim().length > 0 && profileId !== args.expectedProfileId) {
    throw new Error(
      `selected_transport_profile_mismatch:expected=${args.expectedProfileId}:actual=${profileId}`,
    );
  }
  const alpha = Number((transport as any).centerlineAlpha);
  if (Number.isFinite(alpha) && Math.abs(alpha - args.expectedAlpha) > 1e-12) {
    throw new Error(
      `selected_transport_profile_mismatch:alpha_expected=${args.expectedAlpha}:alpha_actual=${alpha}`,
    );
  }
};

const prepareCleanDir = (dirPath: string): void => {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
};

const copyDirectoryContents = (sourceDir: string, targetDir: string): void => {
  if (!fs.existsSync(sourceDir)) return;
  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
};

const writeProfileResolutionArtifact = (args: {
  profileArtifactRoot: string;
  profileId: string;
  profileTag: string;
  centerlineAlpha: number;
  centerlineDtauDt: number;
  outputDir: string;
}): string => {
  const outPath = path.join(args.profileArtifactRoot, "nhm2-profile-resolution-latest.json");
  writeJsonAtomic(outPath, {
    profileId: args.profileId,
    profileTag: args.profileTag,
    family: "nhm2-shift-lapse",
    clockingMode: "bounded-lapse",
    centerlineAlpha: args.centerlineAlpha,
    centerlineDtauDt: args.centerlineDtauDt,
    preserveTransportSchedule: true,
    resolvedFrom: {
      NHM2_PROFILE_ID: process.env.NHM2_PROFILE_ID ?? args.profileId,
      NHM2_PROFILE_TAG: process.env.NHM2_PROFILE_TAG ?? args.profileTag,
      NHM2_CENTERLINE_ALPHA: process.env.NHM2_CENTERLINE_ALPHA ?? String(args.centerlineAlpha),
      NHM2_CENTERLINE_DTAU_DT: process.env.NHM2_CENTERLINE_DTAU_DT ?? String(args.centerlineDtauDt),
      NHM2_OUTPUT_DIR: process.env.NHM2_OUTPUT_DIR ?? args.outputDir,
    },
    generatedAt: new Date().toISOString(),
  });
  return outPath;
};

const promoteAttemptOutputs = (args: {
  attemptArtifactRoot: string;
  attemptAuditRoot: string;
  profileArtifactRoot: string;
  profileAuditRoot: string;
}): void => {
  copyDirectoryContents(args.attemptArtifactRoot, args.profileArtifactRoot);
  copyDirectoryContents(args.attemptAuditRoot, args.profileAuditRoot);
};

const startHeartbeatController = (args: {
  profileArtifactRoot: string;
  profileId: string;
  heartbeatIntervalMs: number;
}): {
  update: (stage: Nhm2RunHeartbeatStage, detail?: string | null) => void;
  stop: (stage?: Nhm2RunHeartbeatStage, detail?: string | null) => void;
  getHealth: () => HeartbeatHealthSnapshot;
} => {
  const runStartedAt = new Date().toISOString();
  let currentStage: Nhm2RunHeartbeatStage = "init";
  let currentDetail: string | null = "profile_loop_started";
  let lastProgressAt = new Date().toISOString();
  let lastProgressAtMs = Date.now();
  let heartbeatTicksSinceProgress = 0;
  let stopped = false;
  const flush = (): void => {
    writeHeartbeatSnapshot({
      profileArtifactRoot: args.profileArtifactRoot,
      payload: {
        profileId: args.profileId,
        stage: currentStage,
        detail: currentDetail,
        pid: process.pid,
        runStartedAt,
        updatedAt: new Date().toISOString(),
        lastProgressAt,
        heartbeatIntervalMs: args.heartbeatIntervalMs,
      },
    });
  };
  const interval =
    args.heartbeatIntervalMs > 0
      ? setInterval(() => {
          heartbeatTicksSinceProgress += 1;
          flush();
        }, args.heartbeatIntervalMs)
      : null;
  interval?.unref?.();
  flush();
  return {
    update: (stage: Nhm2RunHeartbeatStage, detail?: string | null): void => {
      if (stopped) return;
      currentStage = stage;
      currentDetail = detail ?? null;
      lastProgressAt = new Date().toISOString();
      lastProgressAtMs = Date.now();
      heartbeatTicksSinceProgress = 0;
      flush();
    },
    stop: (stage?: Nhm2RunHeartbeatStage, detail?: string | null): void => {
      if (stopped) return;
      stopped = true;
      if (stage != null) currentStage = stage;
      if (detail !== undefined) currentDetail = detail;
      lastProgressAt = new Date().toISOString();
      lastProgressAtMs = Date.now();
      heartbeatTicksSinceProgress = 0;
      if (interval != null) clearInterval(interval);
      flush();
    },
    getHealth: (): HeartbeatHealthSnapshot => ({
      lastProgressAtMs,
      heartbeatTicksSinceProgress,
    }),
  };
};

const toTextList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((entry) => String(entry ?? "").trim()).filter((entry) => entry.length > 0))];
};

const toMatchStatus = (value: unknown): "pass" | "fail" | "n/a" => {
  return value === "pass" || value === "fail" ? value : "n/a";
};

const toParseStatus = (value: unknown): "pass" | "missing" | "fail" | "n/a" => {
  return value === "pass" || value === "missing" || value === "fail" ? value : "n/a";
};

const normalizeSweepAvailabilityStageDetail = (
  value: unknown,
): SweepAvailabilityStageDetail => {
  const detail = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    available: detail.available === true,
    artifactPresent: detail.artifactPresent === true,
    inspectionMissingOrFailed: detail.inspectionMissingOrFailed === true,
    parseStatus: toParseStatus(detail.parseStatus),
    laneProfileMatch: toMatchStatus(detail.laneProfileMatch),
    mismatchReasonCodes: toTextList(detail.mismatchReasonCodes),
    sectionState: String(detail.sectionState ?? "unavailable"),
    sectionReasonCodes: toTextList(detail.sectionReasonCodes),
  };
};

const normalizeFullLoopAvailability = (value: unknown): SweepFullLoopAvailability => {
  if (!value || typeof value !== "object") {
    throw new Error("full_loop_availability_missing_from_publisher_output");
  }
  const availability = value as Record<string, unknown>;
  const stageDetailRaw =
    availability.stageDetail && typeof availability.stageDetail === "object"
      ? (availability.stageDetail as Record<string, unknown>)
      : {};
  return {
    fullLoopStateRaw:
      availability.fullLoopStateRaw == null ? null : String(availability.fullLoopStateRaw),
    strictSignalAvailable: availability.strictSignalAvailable === true,
    sourceClosureAvailable: availability.sourceClosureAvailable === true,
    observerAuditAvailable: availability.observerAuditAvailable === true,
    certificateAvailable: availability.certificateAvailable === true,
    availabilityReasonCodes: toTextList(availability.availabilityReasonCodes),
    stageDetail: {
      strictSignal: normalizeSweepAvailabilityStageDetail(stageDetailRaw.strictSignal),
      sourceClosure: normalizeSweepAvailabilityStageDetail(stageDetailRaw.sourceClosure),
      observerAudit: normalizeSweepAvailabilityStageDetail(stageDetailRaw.observerAudit),
      certificate: normalizeSweepAvailabilityStageDetail(stageDetailRaw.certificate),
    },
  };
};

const parseAuditLikeState = (value: unknown): string => {
  if (!value || typeof value !== "object") return "unavailable";
  const record = value as Record<string, unknown>;
  const raw =
    record.state ??
    record.status ??
    record.overallState ??
    "unavailable";
  return String(raw);
};

const parseReasonCodes = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return toTextList(record.reasonCodes);
};

const buildFallbackFullLoopAvailability = (args: {
  profileArtifactRoot: string;
  fullLoopStateRaw: string | null;
}): SweepFullLoopAvailability => {
  const strictPath = path.join(args.profileArtifactRoot, "nhm2-strict-signal-readiness-latest.json");
  const sourcePath = path.join(args.profileArtifactRoot, "nhm2-source-closure-latest.json");
  const observerPath = path.join(args.profileArtifactRoot, "nhm2-observer-audit-latest.json");
  const certLocalPath = path.join(args.profileArtifactRoot, "nhm2-certificate-policy-latest.json");
  const certGlobalPath = path.join(
    repoRoot,
    "artifacts",
    "research",
    "full-solve",
    "nhm2-certificate-policy-latest.json",
  );

  const load = (filePath: string): { present: boolean; parsed: Record<string, unknown> | null } => {
    if (!fs.existsSync(filePath)) return { present: false, parsed: null };
    try {
      const parsed = readJson<Record<string, unknown>>(filePath);
      return { present: true, parsed };
    } catch {
      return { present: true, parsed: null };
    }
  };

  const strict = load(strictPath);
  const source = load(sourcePath);
  const observer = load(observerPath);
  const certLocal = load(certLocalPath);
  const certGlobal = load(certGlobalPath);
  const cert =
    certGlobal.parsed != null && parseAuditLikeState(certGlobal.parsed) !== "unavailable"
      ? certGlobal
      : certLocal.present
        ? certLocal
        : certGlobal;

  const strictState = parseAuditLikeState(strict.parsed);
  const sourceState = parseAuditLikeState(source.parsed);
  const observerState = parseAuditLikeState(observer.parsed);
  const certState = parseAuditLikeState(cert.parsed);

  const strictDetail: SweepAvailabilityStageDetail = {
    available: strict.parsed != null,
    artifactPresent: strict.present,
    inspectionMissingOrFailed: strict.parsed == null,
    parseStatus: strict.present ? (strict.parsed != null ? "pass" : "fail") : "missing",
    laneProfileMatch: "n/a",
    mismatchReasonCodes: strict.present ? (strict.parsed != null ? [] : ["json_parse_failed"]) : ["missing_artifact"],
    sectionState: strictState,
    sectionReasonCodes: parseReasonCodes(strict.parsed),
  };
  const sourceDetail: SweepAvailabilityStageDetail = {
    available: source.parsed != null,
    artifactPresent: source.present,
    inspectionMissingOrFailed: source.parsed == null,
    parseStatus: source.present ? (source.parsed != null ? "pass" : "fail") : "missing",
    laneProfileMatch: "n/a",
    mismatchReasonCodes: source.present ? (source.parsed != null ? [] : ["json_parse_failed"]) : ["missing_artifact"],
    sectionState: sourceState,
    sectionReasonCodes: parseReasonCodes(source.parsed),
  };
  const observerDetail: SweepAvailabilityStageDetail = {
    available: observer.parsed != null,
    artifactPresent: observer.present,
    inspectionMissingOrFailed: observer.parsed == null,
    parseStatus: observer.present ? (observer.parsed != null ? "pass" : "fail") : "missing",
    laneProfileMatch: "n/a",
    mismatchReasonCodes: observer.present ? (observer.parsed != null ? [] : ["json_parse_failed"]) : ["missing_artifact"],
    sectionState: observerState,
    sectionReasonCodes: parseReasonCodes(observer.parsed),
  };
  const certificateDetail: SweepAvailabilityStageDetail = {
    available: cert.parsed != null && certState !== "unavailable",
    artifactPresent: cert.present,
    inspectionMissingOrFailed: cert.parsed == null,
    parseStatus: cert.present ? (cert.parsed != null ? "pass" : "fail") : "missing",
    laneProfileMatch: "n/a",
    mismatchReasonCodes: cert.present ? (cert.parsed != null ? [] : ["json_parse_failed"]) : ["missing_artifact"],
    sectionState: certState,
    sectionReasonCodes: parseReasonCodes(cert.parsed),
  };

  const availabilityReasonCodes = [
    ...(strictDetail.available ? [] : ["strict_signal_missing"]),
    ...(sourceDetail.available ? [] : ["source_closure_missing"]),
    ...(observerDetail.available ? [] : ["observer_audit_incomplete"]),
    ...(certificateDetail.available ? [] : ["certificate_missing"]),
  ];

  return {
    fullLoopStateRaw: args.fullLoopStateRaw,
    strictSignalAvailable: strictDetail.available,
    sourceClosureAvailable: sourceDetail.available,
    observerAuditAvailable: observerDetail.available,
    certificateAvailable: certificateDetail.available,
    availabilityReasonCodes,
    stageDetail: {
      strictSignal: strictDetail,
      sourceClosure: sourceDetail,
      observerAudit: observerDetail,
      certificate: certificateDetail,
    },
  };
};

const assertValidSweepConfig = (input: unknown): SweepConfig => {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid sweep config: not an object");
  }
  const config = input as SweepConfig;
  if (config.family !== "nhm2-shift-lapse") {
    throw new Error(`Invalid sweep config family: ${String((config as any).family)}`);
  }
  if (!Array.isArray(config.alphas) || config.alphas.length <= 0) {
    throw new Error("Invalid sweep config: alphas must be a non-empty array");
  }
  for (const [index, spec] of config.alphas.entries()) {
    if (!Number.isFinite(spec.alpha) || spec.alpha <= 0 || spec.alpha > 1) {
      throw new Error(`Invalid alpha at index ${index}: ${String(spec.alpha)}`);
    }
    if (!/^[0-9]+p[0-9]+$/i.test(spec.tag)) {
      throw new Error(`Invalid alpha tag at index ${index}: ${spec.tag}`);
    }
  }
  return config;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const resolveCitationRegistryPath = (): string => {
  if (fs.existsSync(citationRegistryPath)) return citationRegistryPath;
  if (fs.existsSync(citationRegistryFallbackPath)) return citationRegistryFallbackPath;
  throw new Error(
    `Citation registry not found at ${citationRegistryPath} or ${citationRegistryFallbackPath}`,
  );
};

export const assertValidCitationRegistry = (input: unknown): CitationRegistry => {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid citation registry: not an object");
  }
  const registry = input as CitationRegistry;
  if (registry.manifestType !== "nhm2_alpha_sweep_citations/v1") {
    throw new Error(`Invalid citation registry manifestType: ${String((registry as any).manifestType)}`);
  }
  if (!ISO_DATE_RX.test(String(registry.generatedOn ?? ""))) {
    throw new Error("Invalid citation registry generatedOn date");
  }
  if (!Array.isArray(registry.papers) || registry.papers.length <= 0) {
    throw new Error("Invalid citation registry: papers must be a non-empty array");
  }
  const seen = new Set<string>();
  for (const [index, paper] of registry.papers.entries()) {
    if (!paper || typeof paper !== "object") {
      throw new Error(`Invalid citation registry paper at index ${index}`);
    }
    const id = String(paper.id ?? "").trim();
    if (!id) throw new Error(`Citation registry paper id missing at index ${index}`);
    if (seen.has(id)) throw new Error(`Citation registry paper id duplicate: ${id}`);
    seen.add(id);
    if (!String(paper.title ?? "").trim()) {
      throw new Error(`Citation registry paper title missing: ${id}`);
    }
    if (!isHttpUrl(String(paper.url ?? ""))) {
      throw new Error(`Citation registry paper url invalid: ${id}`);
    }
    if (
      paper.sourceStability !== "primary_peer_reviewed" &&
      paper.sourceStability !== "preprint"
    ) {
      throw new Error(`Citation registry paper sourceStability invalid: ${id}`);
    }
    if (
      paper.evidenceRole !== "theory_context" &&
      paper.evidenceRole !== "constraint_context" &&
      paper.evidenceRole !== "nonproof_context"
    ) {
      throw new Error(`Citation registry paper evidenceRole invalid: ${id}`);
    }
    if (paper.doi != null && String(paper.doi).trim().length > 0 && !DOI_RX.test(String(paper.doi))) {
      throw new Error(`Citation registry paper doi invalid: ${id}`);
    }
    if (!Number.isInteger(paper.year) || paper.year < 1900 || paper.year > 2100) {
      throw new Error(`Citation registry paper year invalid: ${id}`);
    }
    if (
      paper.publisherType !== "journal" &&
      paper.publisherType !== "preprint" &&
      paper.publisherType !== "review"
    ) {
      throw new Error(`Citation registry paper publisherType invalid: ${id}`);
    }
    if (!Array.isArray(paper.allowedClaimClasses) || paper.allowedClaimClasses.length <= 0) {
      throw new Error(`Citation registry paper allowedClaimClasses invalid: ${id}`);
    }
    for (const claimClass of paper.allowedClaimClasses) {
      if (
        claimClass !== "repo_measured" &&
        claimClass !== "repo_plus_literature" &&
        claimClass !== "literature_only_nonproof" &&
        claimClass !== "not_validated"
      ) {
        throw new Error(`Citation registry paper allowedClaimClass invalid: ${id}:${String(claimClass)}`);
      }
    }
  }
  const required = registry.claimClassRequiredPaperIds;
  if (!required || typeof required !== "object") {
    throw new Error("Citation registry claimClassRequiredPaperIds missing");
  }
  const checkIds = (key: "literature_context" | "extrapolation_candidate" | "not_validated"): void => {
    const ids = (required as any)[key];
    if (!Array.isArray(ids) || ids.length <= 0) {
      throw new Error(`Citation registry required paper ids missing for ${key}`);
    }
    for (const id of ids) {
      if (typeof id !== "string" || !seen.has(id)) {
        throw new Error(`Citation registry unknown paper id in ${key}: ${String(id)}`);
      }
    }
  };
  checkIds("literature_context");
  checkIds("extrapolation_candidate");
  checkIds("not_validated");
  if (Array.isArray(registry.policyClaimPaperIds)) {
    for (const id of registry.policyClaimPaperIds) {
      if (typeof id !== "string" || !seen.has(id)) {
        throw new Error(`Citation registry unknown policyClaimPaperId: ${String(id)}`);
      }
    }
  }
  return registry;
};

const assertValidResearchLock = (input: unknown): ResearchLock => {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid research lock: not an object");
  }
  const lock = input as ResearchLock;
  if (lock.manifestType !== "nhm2_alpha_sweep_research_lock/v1") {
    throw new Error(`Invalid research lock manifestType: ${String((lock as any).manifestType)}`);
  }
  if (!ISO_DATE_RX.test(String(lock.generatedOn ?? ""))) {
    throw new Error("Invalid research lock generatedOn date");
  }
  if (!Array.isArray(lock.entries) || lock.entries.length <= 0) {
    throw new Error("Invalid research lock: entries must be a non-empty array");
  }
  const seen = new Set<string>();
  for (const entry of lock.entries) {
    const id = String(entry?.id ?? "").trim();
    if (!id) throw new Error("Invalid research lock entry id");
    if (seen.has(id)) throw new Error(`Duplicate research lock entry id: ${id}`);
    seen.add(id);
    if (!isHttpUrl(String(entry.url ?? ""))) {
      throw new Error(`Invalid research lock url for ${id}`);
    }
    if (!ISO_DATE_RX.test(String(entry.accessedOn ?? ""))) {
      throw new Error(`Invalid research lock accessedOn for ${id}`);
    }
    if (
      entry.publisherType !== "journal" &&
      entry.publisherType !== "preprint" &&
      entry.publisherType !== "review"
    ) {
      throw new Error(`Invalid research lock publisherType for ${id}`);
    }
    if (!Number.isInteger(entry.year) || entry.year < 1900 || entry.year > 2100) {
      throw new Error(`Invalid research lock year for ${id}`);
    }
    if (
      entry.evidenceRole !== "theory_context" &&
      entry.evidenceRole !== "constraint_context" &&
      entry.evidenceRole !== "nonproof_context"
    ) {
      throw new Error(`Invalid research lock evidenceRole for ${id}`);
    }
    if (entry.doi != null && String(entry.doi).trim().length > 0 && !DOI_RX.test(String(entry.doi))) {
      throw new Error(`Invalid research lock doi for ${id}`);
    }
    if (!Array.isArray(entry.claimClasses) || entry.claimClasses.length <= 0) {
      throw new Error(`Invalid research lock claimClasses for ${id}`);
    }
  }
  return lock;
};

export const assertResearchLockCoverage = (args: {
  lock: ResearchLock;
  requiredPaperIds: string[];
}): void => {
  const lockIds = new Set(args.lock.entries.map((entry) => entry.id));
  for (const id of args.requiredPaperIds) {
    if (!lockIds.has(id)) {
      throw new Error(`research_lock_missing_citation:${id}`);
    }
  }
};

export const remediationByGate: Record<
  NonNullable<SweepClaimPromotionReport["claims"][number]["firstBlockingGate"]>,
  string
> = {
  baselineInvariance:
    "Republish selected transport with identical target-coupled schedule and fixed shift inputs, then recheck coordinate invariance.",
  clockingConsistency:
    "Inspect mission-time comparison and centerline alpha wiring (dτ/dt mapping), then rerun profile.",
  antiSrSafety:
    "Inspect betaOverAlphaMax and wallHorizonMargin diagnostics and rerun with anti-SR constraints preserved.",
  decompositionConsistency:
    "Inspect shift-vs-lapse decomposition residual and lapseTrackedFraction, then rerun profile.",
  invariantGate:
    "Inspect centerline invariant proof artifact and resolve invariant gate failures before rerun.",
  fullLoopAudit:
    "Regenerate full-loop publication chain (strict-signal, source-closure, observer-audit, full-loop audit).",
  evidenceLedger:
    "Inspect claim-evidence mapping entries and blocking reasons, then republish evidence ledger artifacts.",
};

export const getNextActionForBlockingGate = (
  gate: SweepClaimPromotionReport["claims"][number]["firstBlockingGate"],
): string | null => {
  if (gate == null) return null;
  return remediationByGate[gate];
};

export const deriveEvidenceSufficiency = (args: {
  claim: SweepClaimLedgerClaim;
  paperMetadataById: Record<
    string,
    Pick<CitationRegistryPaper, "sourceStability" | "doi" | "evidenceRole"> & {
      publisherType?: "journal" | "preprint" | "review";
      year?: number;
    }
  >;
  repoSourceIds: string[];
}): EvidenceSufficiency => {
  const repoSources = new Set(args.repoSourceIds);
  const citedPaperMeta = args.claim.sourceIds
    .map((sourceId) => args.paperMetadataById[sourceId] ?? null)
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  const hasRepo = args.claim.sourceIds.some((sourceId) => repoSources.has(sourceId));
  const hasConstraint = citedPaperMeta.some((paper) => paper.evidenceRole === "constraint_context");
  const hasJournalConstraint = citedPaperMeta.some(
    (paper) => paper.evidenceRole === "constraint_context" && paper.publisherType === "journal",
  );
  const hasDoiPrimary = citedPaperMeta.some(
    (paper) =>
      paper.sourceStability === "primary_peer_reviewed" &&
      typeof paper.doi === "string" &&
      paper.doi.trim().length > 0,
  );

  const required: string[] = [];
  if (args.claim.supportTier === "repo_measured") required.push("repo_citation");
  if (args.claim.supportTier === "repo_plus_literature") {
    required.push(
      "repo_citation",
      "doi_primary_peer_reviewed",
      "constraint_context_paper",
      "journal_constraint_context_paper",
    );
  }
  if (args.claim.supportTier === "literature_only_nonproof") {
    required.push(
      "constraint_context_paper",
      "journal_constraint_context_paper",
      "research_context_nonproof_flag",
    );
  }

  const present: string[] = [];
  if (hasRepo) present.push("repo_citation");
  if (hasDoiPrimary) present.push("doi_primary_peer_reviewed");
  if (hasConstraint) present.push("constraint_context_paper");
  if (hasJournalConstraint) present.push("journal_constraint_context_paper");
  if (args.claim.literatureContextOnly === true) present.push("research_context_nonproof_flag");

  const missing = required.filter((entry) => !present.includes(entry));
  return {
    required,
    present,
    missing,
    pass: missing.length === 0,
  };
};

export const deriveResearchConfidenceTier = (args: {
  claim: SweepClaimLedgerClaim;
  evidenceSufficiency: EvidenceSufficiency;
}): ResearchConfidenceTier => {
  if (args.claim.status === "measured" && args.claim.supportTier === "repo_measured") {
    return "repo_measured";
  }
  if (
    args.claim.status !== "measured" &&
    args.evidenceSufficiency.pass &&
    args.evidenceSufficiency.present.includes("journal_constraint_context_paper")
  ) {
    return "constraint_supported";
  }
  return "context_only";
};

export const assertClaimEvidenceSufficiency = (args: {
  claim: SweepClaimLedgerClaim;
  evidenceSufficiency: EvidenceSufficiency;
  researchConfidenceTier: ResearchConfidenceTier;
}): void => {
  const isNonMeasuredProfileClaim =
    args.claim.profileId != null && args.claim.status !== "measured";
  if (!isNonMeasuredProfileClaim) return;
  if (!args.evidenceSufficiency.pass) {
    throw new Error(
      `claim_evidence_sufficiency_violation:${args.claim.claimId}:missing=${args.evidenceSufficiency.missing.join(",")}`,
    );
  }
  if (
    args.claim.supportTier === "repo_plus_literature" &&
    args.researchConfidenceTier !== "constraint_supported"
  ) {
    throw new Error(
      `claim_evidence_sufficiency_violation:${args.claim.claimId}:repo_plus_literature_requires_constraint_supported`,
    );
  }
};

const inferProfileId = (tag: string): string => `stage1_centerline_alpha_${tag}_v1`;
const inferTagFromProfileId = (profileId: string): string | null => {
  const match = profileId.match(/^stage1_centerline_alpha_([0-9]+p[0-9]+)_v1$/i);
  return match?.[1] ?? null;
};

const splitCsv = (raw: string): string[] =>
  raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const selectSweepSpecs = (args: {
  allSpecs: SweepSpec[];
  onlyTags: string[] | null;
}): SweepSpec[] => {
  if (!args.onlyTags || args.onlyTags.length <= 0) return args.allSpecs;
  const wanted = new Set(args.onlyTags);
  const selected = args.allSpecs.filter((spec) => wanted.has(spec.tag));
  const selectedTags = new Set(selected.map((spec) => spec.tag));
  const missing = args.onlyTags.filter((tag) => !selectedTags.has(tag));
  if (missing.length > 0) {
    throw new Error(`Unknown NHM2_ALPHA_SWEEP_ONLY_TAGS entries: ${missing.join(", ")}`);
  }
  return selected;
};

export const assertControlledSingleProfileContract = (args: {
  onlyTags: string[] | null;
  selectedSpecs: SweepSpec[];
  runFullLoop: boolean;
}): void => {
  if (!args.onlyTags || args.onlyTags.length <= 0) return;
  if (args.selectedSpecs.length !== 1) {
    throw new Error(
      `Controlled run contract violation: NHM2_ALPHA_SWEEP_ONLY_TAGS requires exactly one profile, got ${args.selectedSpecs.length}`,
    );
  }
  if (!args.runFullLoop) {
    throw new Error(
      "Controlled run contract violation: NHM2_ALPHA_SWEEP_ONLY_TAGS requires NHM2_ALPHA_SWEEP_RUN_FULL_LOOP=1",
    );
  }
};

export const assertControlledExploratoryPrereq = (args: {
  profileTag: string;
  profileId: string;
  sweepRootDir: string;
  requirePreviousFullLoop: boolean;
}): void => {
  if (!args.requirePreviousFullLoop) return;
  const index = controlledExploratoryOrder.indexOf(args.profileTag as (typeof controlledExploratoryOrder)[number]);
  if (index <= 0) return;
  const previousTag = controlledExploratoryOrder[index - 1];
  const previousProfileId = inferProfileId(previousTag);
  const previousFullLoopPath = path.join(
    args.sweepRootDir,
    previousProfileId,
    "nhm2-full-loop-audit-latest.json",
  );
  if (!fs.existsSync(previousFullLoopPath)) {
    throw new Error(
      `Controlled progression prerequisite missing for ${args.profileId}: expected prior full-loop artifact ${previousFullLoopPath}`,
    );
  }
};

const isPidAlive = (pid: number): boolean => {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";
    if (code === "ESRCH") return false;
    return true;
  }
};

export const clearStaleProofSurfaceLockOrThrow = (args: {
  lockPath: string;
  operation: string;
}): void => {
  if (!fs.existsSync(args.lockPath)) return;
  const raw = fs.readFileSync(args.lockPath, "utf8");
  let lockRecord: Record<string, unknown> | null = null;
  try {
    lockRecord = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`proof_surface_publication_lock_invalid:${args.lockPath}:${args.operation}`);
  }
  const pidValue = toFinite(lockRecord.pid);
  const pid = pidValue == null ? null : Math.trunc(pidValue);
  if (pid != null && isPidAlive(pid)) {
    throw new Error(
      `proof_surface_publication_locked_active:${args.lockPath}:${args.operation}:pid=${pid}`,
    );
  }
  fs.unlinkSync(args.lockPath);
  process.stdout.write(
    `[NHM2 alpha sweep] Removed stale proof-surface lock ${args.lockPath} (pid=${pid == null ? "unknown" : String(pid)})\n`,
  );
};

const seedProfileSweepReferences = (args: { profileArtifactRoot: string }): void => {
  const mappings = [
    {
      from: path.join(
        selectedFamilyRootArtifactDir,
        "sweep",
        "nhm2-shift-lapse-profile-sweep-latest.json",
      ),
      to: path.join(
        args.profileArtifactRoot,
        "sweep",
        "nhm2-shift-lapse-profile-sweep-latest.json",
      ),
    },
    {
      from: path.join(
        selectedFamilyRootArtifactDir,
        "boundary-sweep",
        "nhm2-shift-lapse-boundary-sweep-latest.json",
      ),
      to: path.join(
        args.profileArtifactRoot,
        "boundary-sweep",
        "nhm2-shift-lapse-boundary-sweep-latest.json",
      ),
    },
  ];
  for (const mapping of mappings) {
    if (!fs.existsSync(mapping.from)) continue;
    fs.mkdirSync(path.dirname(mapping.to), { recursive: true });
    if (!fs.existsSync(mapping.to)) {
      fs.copyFileSync(mapping.from, mapping.to);
    }
  }
};

const getGitSha = (): string | null => {
  try {
    return String(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot })).trim();
  } catch {
    return null;
  }
};

const checksum = (text: string): string => {
  return createHash("sha256").update(text).digest("hex");
};

const toIsoFromMs = (value: number | null): string | null => {
  if (value == null || !Number.isFinite(value)) return null;
  return new Date(value).toISOString();
};

export const verifyFullLoopArtifactFreshness = (args: {
  profileArtifactRoot: string;
  runStartedAtMs: number;
}): {
  allFresh: boolean;
  records: FullLoopArtifactFreshnessRecord[];
  staleReasonCodes: string[];
} => {
  const required = [
    "nhm2-full-loop-audit-latest.json",
    "nhm2-source-closure-latest.json",
    "nhm2-observer-audit-latest.json",
  ] as const;
  const records: FullLoopArtifactFreshnessRecord[] = required.map((fileName) => {
    const filePath = path.join(args.profileArtifactRoot, fileName);
    if (!fs.existsSync(filePath)) {
      return {
        fileName,
        path: filePath,
        exists: false,
        mtimeMs: null,
        fresh: false,
      };
    }
    const stat = fs.statSync(filePath);
    const mtimeMs = Number.isFinite(stat.mtimeMs) ? stat.mtimeMs : null;
    const fresh = mtimeMs != null && mtimeMs >= args.runStartedAtMs;
    return {
      fileName,
      path: filePath,
      exists: true,
      mtimeMs,
      fresh,
    };
  });
  const staleReasonCodes = records
    .filter((record) => !record.fresh)
    .map((record) =>
      !record.exists
        ? `missing:${record.fileName}`
        : `stale:${record.fileName}:${Math.trunc(record.mtimeMs ?? -1)}<${Math.trunc(args.runStartedAtMs)}`,
    );
  return {
    allFresh: staleReasonCodes.length === 0,
    records,
    staleReasonCodes,
  };
};

const isFullLoopPass = (value: string | null): boolean => {
  if (value == null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "pass" || normalized === "passing";
};

export const normalizeFullLoopState = (value: string | null): "pass" | "fail" =>
  isFullLoopPass(value) ? "pass" : "fail";

export const deriveEvidenceLedgerReason = (args: {
  runFullLoop: boolean;
  fullLoopStateRaw: string | null;
  claimEvidence: any;
}): SweepRow["gateDiagnostics"]["evidenceLedgerReason"] => {
  if (!args.runFullLoop) {
    return "full_loop_unavailable";
  }
  if (args.fullLoopStateRaw == null || String(args.fullLoopStateRaw).trim().toLowerCase() === "unavailable") {
    return "full_loop_unavailable";
  }
  if (normalizeFullLoopState(args.fullLoopStateRaw) !== "pass") {
    return "full_loop_failed";
  }
  if (args.claimEvidence?.validationOk === false) {
    return "validation_failed";
  }
  if (args.claimEvidence?.hasBlockingEvidence === true) {
    return "blocking_evidence_true";
  }
  const entryBlocking = Array.isArray(args.claimEvidence?.entries)
    ? args.claimEvidence.entries.some((entry: any) => entry?.mappingStatus !== "mapped")
    : true;
  if (entryBlocking) {
    return "entry_unmapped";
  }
  return "pass";
};

const resolveClaimLanguageLine = (row: SweepRow): string => {
  if (row.claimClass === "repo_measured") {
    return `For ${row.profileId}, the bounded-lapse timing differential is observed in this repository under the current full-loop promotion gates.`;
  }
  if (row.claimClass === "repo_plus_literature") {
    return `For ${row.profileId}, interpretation remains repo_plus_literature and is not promoted unless the full NHM2 gate stack passes with fresh artifacts.`;
  }
  if (row.claimClass === "literature_only_nonproof") {
    return `For ${row.profileId}, interpretation is literature_context_non_proof framing and is not promoted as a repository-measured result.`;
  }
  return `For ${row.profileId}, the run is not validated by the full NHM2 promotion stack and remains diagnostic only.`;
};

const deriveClaimSupportTier = (args: {
  sourceIds: string[];
  repoSourceIds: string[];
  paperSourceIds: string[];
}): ClaimSupportTier => {
  const repoSources = new Set(args.repoSourceIds);
  const paperSources = new Set(args.paperSourceIds);
  const hasRepo = args.sourceIds.some((sourceId) => repoSources.has(sourceId));
  const hasPaper = args.sourceIds.some((sourceId) => paperSources.has(sourceId));
  if (hasRepo && !hasPaper) return "repo_measured";
  if (hasRepo && hasPaper) return "repo_plus_literature";
  return "literature_only_nonproof";
};

const enforceClaimLanguageLineForRow = (row: SweepRow, line: string): void => {
  if (row.claimClass === "repo_measured") {
    if (!/observed in this repository/i.test(line)) {
      throw new Error(
        `claim_language_policy_violation:${row.profileId}:measured_requires_repo_observed_phrase`,
      );
    }
    if (
      row.gates.promotionEligible !== "pass" ||
      row.fullLoopStateNormalized !== "pass" ||
      row.gates.evidenceLedger !== "pass" ||
      (row.stageDetailFreshness != null && row.stageDetailFreshness.allFresh !== true)
    ) {
      throw new Error(
        `claim_language_policy_violation:${row.profileId}:measured_claim_without_passing_fresh_gates`,
      );
    }
    return;
  }
  if (row.claimClass === "repo_plus_literature") {
    if (!/repo_plus_literature/i.test(line) || !/not promoted/i.test(line)) {
      throw new Error(
        `claim_language_policy_violation:${row.profileId}:repo_plus_literature_template_mismatch`,
      );
    }
    return;
  }
  if (row.claimClass === "literature_only_nonproof") {
    if (
      !/literature_context_non_proof/i.test(line) ||
      !/not promoted as a repository-measured result/i.test(line)
    ) {
      throw new Error(
        `claim_language_policy_violation:${row.profileId}:literature_context_template_mismatch`,
      );
    }
    return;
  }
  if (!/not validated/i.test(line) || !/remains diagnostic only/i.test(line)) {
    throw new Error(
      `claim_language_policy_violation:${row.profileId}:not_validated_template_mismatch`,
    );
  }
};

const enforceClaimLanguagePolicy = (
  rows: SweepRow[],
  lines: string[],
  literatureByProfile: Map<string, string[]>,
): void => {
  const forbidden = /\b(proven|validated theorem|theorem-level|certified physics|demonstrated proof|experimentally validated)\b/i;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const line = lines[index] ?? "";
    enforceClaimLanguageLineForRow(row, line);
    if (row.claimClass !== "repo_measured" && forbidden.test(line)) {
      throw new Error(
        `claim_language_policy_violation:${row.profileId}:forbidden_phrase_in_non_measured_class`,
      );
    }
    const lower = line.toLowerCase();
    if (
      row.claimClass !== "repo_measured" &&
      lower.includes("validated") &&
      !lower.includes("not validated")
    ) {
      throw new Error(
        `claim_language_policy_violation:${row.profileId}:validated_phrase_requires_repo_measured_class`,
      );
    }
    if (row.claimClass !== "repo_measured") {
      const refs = literatureByProfile.get(row.profileId) ?? [];
      if (refs.length <= 0) {
        throw new Error(
          `claim_language_policy_violation:${row.profileId}:literature_refs_required_for_non_measured`,
        );
      }
    }
  }
};

const isFinitePositive = (value: number | null): value is number =>
  value != null && Number.isFinite(value) && value > 0;

export const validateClaimsLedger = (args: {
  claims: SweepClaimLedgerClaim[];
  knownSourceIds: string[];
  paperSourceIds: string[];
  repoSourceIds: string[];
  paperMetadataById: Record<
    string,
    Pick<CitationRegistryPaper, "sourceStability" | "doi" | "evidenceRole"> & {
      publisherType?: "journal" | "preprint" | "review";
      year?: number;
    }
  >;
  measuredOrDerivedRequiresCitation: boolean;
  hypothesisRequiresUncertaintyNote: boolean;
}): void => {
  const knownSources = new Set(args.knownSourceIds);
  const paperSources = new Set(args.paperSourceIds);
  const repoSources = new Set(args.repoSourceIds);
  for (const claim of args.claims) {
    if (claim.supportTier == null) {
      throw new Error(`Claim ${claim.claimId} missing supportTier`);
    }
    const hasRepoCitation = claim.sourceIds.some((sourceId) => repoSources.has(sourceId));
    const hasPaperCitation = claim.sourceIds.some((sourceId) => paperSources.has(sourceId));
    const citedPaperMeta = claim.sourceIds
      .map((sourceId) => args.paperMetadataById[sourceId] ?? null)
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);
    if (
      args.measuredOrDerivedRequiresCitation &&
      (claim.status === "measured" || claim.status === "derived") &&
      claim.sourceIds.length <= 0
    ) {
      throw new Error(`Claim ${claim.claimId} is ${claim.status} but has no citations`);
    }
    if (
      args.hypothesisRequiresUncertaintyNote &&
      claim.status === "hypothesis" &&
      (!claim.uncertaintyNote || claim.uncertaintyNote.trim().length <= 0)
    ) {
      throw new Error(`Claim ${claim.claimId} is hypothesis but has no uncertainty note`);
    }
    if (
      claim.status !== "measured" &&
      !hasPaperCitation
    ) {
      throw new Error(`Claim ${claim.claimId} is non-measured but has no paper citation`);
    }
    if (claim.supportTier === "repo_measured" && !hasRepoCitation) {
      throw new Error(`Claim ${claim.claimId} is repo_measured but has no repo citation`);
    }
    if (claim.supportTier === "repo_plus_literature" && (!hasRepoCitation || !hasPaperCitation)) {
      throw new Error(
        `Claim ${claim.claimId} is repo_plus_literature but is missing repo or paper citation`,
      );
    }
    if (
      claim.supportTier === "repo_plus_literature" &&
      !citedPaperMeta.some(
        (paper) =>
          paper.sourceStability === "primary_peer_reviewed" &&
          typeof paper.doi === "string" &&
          paper.doi.trim().length > 0,
      )
    ) {
      throw new Error(
        `Claim ${claim.claimId} is repo_plus_literature but has no DOI-backed primary paper citation`,
      );
    }
    if (claim.supportTier === "literature_only_nonproof") {
      if (!hasPaperCitation) {
        throw new Error(
          `Claim ${claim.claimId} is literature_only_nonproof but has no paper citation`,
        );
      }
      if (claim.literatureContextOnly !== true) {
        throw new Error(
          `Claim ${claim.claimId} is literature_only_nonproof but literatureContextOnly flag is not true`,
        );
      }
      if (claim.status === "measured") {
        throw new Error(
          `Claim ${claim.claimId} is literature_only_nonproof but marked measured`,
        );
      }
    }
    if (
      claim.supportTier !== "literature_only_nonproof" &&
      claim.profileId != null &&
      claim.status !== "measured" &&
      !hasRepoCitation
    ) {
      throw new Error(`Claim ${claim.claimId} is non-measured profile claim but has no repo citation`);
    }
    if (
      claim.profileId != null &&
      claim.status !== "measured" &&
      !citedPaperMeta.some((paper) => paper.evidenceRole === "constraint_context")
    ) {
      throw new Error(
        `Claim ${claim.claimId} is non-measured profile claim but lacks constraint_context paper citation`,
      );
    }
    if (
      claim.profileId != null &&
      claim.status !== "measured" &&
      !citedPaperMeta.some(
        (paper) =>
          paper.evidenceRole === "constraint_context" &&
          paper.publisherType === "journal",
      )
    ) {
      throw new Error(
        `Claim ${claim.claimId} is non-measured profile claim but lacks journal constraint_context citation`,
      );
    }
    if (
      (claim.status !== "measured" || claim.supportTier !== "repo_measured") &&
      (!claim.uncertaintyNote || claim.uncertaintyNote.trim().length <= 0)
    ) {
      throw new Error(`Claim ${claim.claimId} requires an uncertainty note`);
    }
    if (
      (claim.status === "derived" || claim.status === "hypothesis") &&
      (!claim.scopeBoundary || claim.scopeBoundary.trim().length <= 0)
    ) {
      throw new Error(`Claim ${claim.claimId} is ${claim.status} but has no scope boundary`);
    }
    if (claim.profileId != null && claim.status !== "measured") {
      if (!claim.allowedClaim || claim.allowedClaim.trim().length <= 0) {
        throw new Error(`Claim ${claim.claimId} is non-measured profile claim but has no allowedClaim`);
      }
      if (!Array.isArray(claim.cannotClaim) || claim.cannotClaim.length <= 0) {
        throw new Error(`Claim ${claim.claimId} is non-measured profile claim but has no cannotClaim boundary list`);
      }
    }
    for (const sourceId of claim.sourceIds) {
      if (!knownSources.has(sourceId)) {
        throw new Error(`Claim ${claim.claimId} references unknown source id: ${sourceId}`);
      }
    }
  }
};

export const classifySweepRow = (args: {
  gates: SweepRow["gates"];
  bracket: SweepBracket;
  exploratoryBracketCannotAutoPromote: boolean;
  allowExploratoryPromotion: boolean;
}): SweepRow["progressionClass"] => {
  if (args.gates.promotionEligible !== "pass") {
    return "diagnostic_fail";
  }
  if (
    args.exploratoryBracketCannotAutoPromote &&
    args.bracket === "exploratory" &&
    !args.allowExploratoryPromotion
  ) {
    return "exploratory_pass_blocked_by_policy";
  }
  return "validated_candidate";
};

const deriveRunHealth = (row: SweepRow): NonNullable<SweepRow["runHealth"]> => {
  const decision = row.stageDetailFreshness?.freshnessDecision ?? null;
  if (decision === "fresh") return "healthy_fresh";
  if (decision === "timeout") return "failed_timeout";
  if (decision === "stall") return "failed_stall";
  if (decision === "missing") return "failed_missing";
  if (decision === "stale") return "failed_stale";
  return row.overallState === "pending" ? "pending" : "failed_missing";
};

const getFirstBlockingGate = (
  gates: SweepRow["gates"],
): SweepClaimPromotionReport["claims"][number]["firstBlockingGate"] => {
  const ordered: Array<keyof SweepRow["gates"]> = [
    "baselineInvariance",
    "clockingConsistency",
    "antiSrSafety",
    "decompositionConsistency",
    "invariantGate",
    "fullLoopAudit",
    "evidenceLedger",
  ];
  const first = ordered.find((gate) => gates[gate] !== "pass");
  return (first as SweepClaimPromotionReport["claims"][number]["firstBlockingGate"]) ?? null;
};

export const getFirstBlockingReason = (args: {
  firstBlockingGate: SweepClaimPromotionReport["claims"][number]["firstBlockingGate"];
  row: SweepRow | null;
}): string | null => {
  if (args.firstBlockingGate == null) return null;
  if (args.row == null) return `gate_fail:${args.firstBlockingGate}`;
  if (args.row.runtimeBlockingReason != null) {
    return `runtime_blocker:${args.row.runtimeBlockingReason}`;
  }
  if (args.firstBlockingGate === "baselineInvariance") {
    return `coordinate_delta_s:${args.row.coordinateTimeDeltaFromBaselineS ?? "null"},tol_s:${args.row.gateDiagnostics.baselineToleranceS}`;
  }
  if (args.firstBlockingGate === "clockingConsistency") {
    return `ratio_error:${args.row.gateDiagnostics.ratioError ?? "null"},ratio_tol:${args.row.gateDiagnostics.ratioTolerance},proper_minus_error_s:${args.row.gateDiagnostics.properMinusErrorS ?? "null"},proper_minus_tol_s:${args.row.gateDiagnostics.properMinusToleranceS}`;
  }
  if (args.firstBlockingGate === "antiSrSafety") {
    return `beta_over_alpha_max:${args.row.betaOverAlphaMax ?? "null"},beta_limit:${args.row.gateDiagnostics.betaOverAlphaMaxLimit},wall_horizon_margin:${args.row.wallHorizonMargin ?? "null"},wall_horizon_min:${args.row.gateDiagnostics.wallHorizonMarginMin}`;
  }
  if (args.firstBlockingGate === "decompositionConsistency") {
    return `residual_s:${args.row.decompositionResidualS ?? "null"},residual_tol_s:${args.row.gateDiagnostics.decompositionResidualToleranceS},lapse_tracked_fraction:${args.row.lapseTrackedFraction ?? "null"},lapse_fraction_min:${args.row.gateDiagnostics.lapseTrackedFractionMin}`;
  }
  if (args.firstBlockingGate === "invariantGate") {
    if (args.row.runtimeBlockingReason != null) {
      return `runtime_blocker:${args.row.runtimeBlockingReason}`;
    }
    return `invariant_gate_status:${args.row.invariantGateStatus ?? "null"}`;
  }
  if (args.firstBlockingGate === "evidenceLedger") {
    return `evidence_ledger_reason:${args.row?.gateDiagnostics.evidenceLedgerReason ?? "full_loop_unavailable"}`;
  }
  if (args.firstBlockingGate === "fullLoopAudit") {
    return `full_loop_state_raw:${args.row?.fullLoopStateRaw ?? "null"}`;
  }
  return `gate_fail:${args.firstBlockingGate}`;
};

export const classifySweepClaimClass = (args: {
  overallState: string;
  progressionClass: SweepRow["progressionClass"];
  runFullLoop: boolean;
}): {
  claimClass: SweepRow["claimClass"];
  claimClassNote: string;
} => {
  if (args.overallState === "pass") {
    return {
      claimClass: "repo_measured",
      claimClassNote:
        "Observed in this repository under current NHM2 full-loop promotion gates.",
    };
  }
  if (!args.runFullLoop || args.overallState === "pending_no_full_loop") {
    return {
      claimClass: "literature_only_nonproof",
      claimClassNote:
        "Interpretation restricted to literature context because promotable full-loop evidence is unavailable.",
    };
  }
  if (args.progressionClass === "exploratory_pass_blocked_by_policy") {
    return {
      claimClass: "repo_plus_literature",
      claimClassNote:
        "Computed result is repo-plus-literature context and remains blocked by exploratory promotion policy.",
    };
  }
  return {
    claimClass: "not_validated",
    claimClassNote:
      "Not validated by the NHM2 full-loop promotion stack; treat as diagnostic only.",
  };
};

export const deriveSweepFailureSummary = (args: {
  rows: SweepRow[];
  sweepName: string;
}): SweepFailureSummary => {
  const failedRows = args.rows
    .filter((row) => row.overallState !== "pass")
    .map((row) => {
      const failedGates = Object.entries(row.gates)
        .filter(([key, value]) => key !== "promotionEligible" && value !== "pass")
        .map(([key]) => key);
      return {
        profileId: row.profileId,
        bracket: row.bracket,
        failedGates,
        overallState: row.overallState,
      };
    });
  const gateCounts = new Map<
    NonNullable<SweepFailureSummary["dominantFailureGate"]>,
    number
  >();
  for (const row of failedRows) {
    for (const gate of row.failedGates) {
      if (
        gate === "baselineInvariance" ||
        gate === "clockingConsistency" ||
        gate === "antiSrSafety" ||
        gate === "decompositionConsistency" ||
        gate === "invariantGate" ||
        gate === "fullLoopAudit"
      ) {
        gateCounts.set(gate, (gateCounts.get(gate) ?? 0) + 1);
      }
    }
  }
  let dominantFailureGate: SweepFailureSummary["dominantFailureGate"] = null;
  let dominantCount = -1;
  for (const [gate, count] of gateCounts.entries()) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantFailureGate = gate;
    }
  }
  const strongestPassing = args.rows
    .filter((row) => row.overallState === "pass")
    .sort((a, b) => a.centerlineAlpha - b.centerlineAlpha)[0];
  return {
    generatedAt: new Date().toISOString(),
    sweepName: args.sweepName,
    firstFailureProfileId: failedRows[0]?.profileId ?? null,
    strongestPassingProfileId: strongestPassing?.profileId ?? null,
    dominantFailureGate,
    failedRows,
  };
};

const buildLadderProgressSummary = (args: {
  allSpecs: SweepSpec[];
  rows: SweepRow[];
}): LadderProgressSummary => {
  const rowByProfileId = new Map(args.rows.map((row) => [row.profileId, row]));
  const ladderRows: LadderProgressRow[] = [];
  let blockedBy: string | null = null;
  for (const spec of args.allSpecs) {
    const profileId = inferProfileId(spec.tag);
    const row = rowByProfileId.get(profileId) ?? null;
    if (row == null) {
      ladderRows.push({
        profileId,
        tag: spec.tag,
        centerlineAlpha: spec.alpha,
        bracket: spec.bracket,
        ladderState: blockedBy == null ? "planned" : "skipped_after_blocker",
        blockedBy,
        overallState: null,
        runtimeBlockingReason: null,
        fullLoopStateRaw: null,
      });
      continue;
    }
    let ladderState: LadderState;
    if (row.overallState === "pass") {
      ladderState = "completed_pass";
    } else if (row.runtimeBlockingReason === "selected_transport_timeout") {
      ladderState = "blocked_timeout";
    } else if (
      row.runtimeBlockingReason === "selected_transport_process_error" ||
      row.runtimeBlockingReason === "selected_transport_missing_artifact" ||
      row.runtimeBlockingReason === "selected_transport_invalid_json" ||
      row.runtimeBlockingReason === "selected_transport_profile_mismatch" ||
      row.runtimeBlockingReason === "selected_transport_gate_fail" ||
      row.runtimeBlockingReason === "selected_transport_stale_artifact" ||
      row.runtimeBlockingReason === "selected_transport_unknown_error"
    ) {
      ladderState = "blocked_transport_error";
    } else if (row.runtimeBlockingReason != null) {
      ladderState = "blocked_runtime";
    } else {
      ladderState = "completed_gate_fail";
    }
    ladderRows.push({
      profileId,
      tag: spec.tag,
      centerlineAlpha: spec.alpha,
      bracket: spec.bracket,
      ladderState,
      blockedBy,
      overallState: row.overallState,
      runtimeBlockingReason: row.runtimeBlockingReason ?? null,
      fullLoopStateRaw: row.fullLoopStateRaw ?? null,
    });
    if (
      blockedBy == null &&
      (ladderState === "blocked_runtime" ||
        ladderState === "blocked_timeout" ||
        ladderState === "blocked_transport_error" ||
        ladderState === "completed_gate_fail")
    ) {
      blockedBy = profileId;
    }
  }
  const passingRows = ladderRows.filter((row) => row.ladderState === "completed_pass");
  const firstBlocked =
    ladderRows.find(
      (row) =>
        row.ladderState === "blocked_runtime" ||
        row.ladderState === "blocked_timeout" ||
        row.ladderState === "blocked_transport_error" ||
        row.ladderState === "completed_gate_fail",
    ) ?? null;
  const lowestPassing = passingRows.length > 0 ? passingRows[passingRows.length - 1] : null;
  return {
    generatedAt: new Date().toISOString(),
    rows: ladderRows,
    frontier: {
      lowestPassingAlpha: lowestPassing?.centerlineAlpha ?? null,
      lowestPassingProfileId: lowestPassing?.profileId ?? null,
      firstBlockedAlpha: firstBlocked?.centerlineAlpha ?? null,
      firstBlockedProfileId: firstBlocked?.profileId ?? null,
      blockingReason:
        firstBlocked?.runtimeBlockingReason ??
        (firstBlocked == null ? null : firstBlocked.ladderState),
      promotionState: firstBlocked == null ? "open" : "blocked",
    },
  };
};

export const classifyFrontierLadderGroup = (
  spec: Pick<SweepSpec, "alpha" | "tag">,
): FrontierLadderGroup => {
  if (spec.alpha >= 0.73 || spec.tag === "0p7300") {
    return "confirmed_revalidation_ladder";
  }
  if (
    spec.tag === "0p7250" ||
    spec.tag === "0p7200" ||
    spec.tag === "0p7150" ||
    spec.tag === "0p7100" ||
    spec.tag === "0p7050" ||
    spec.tag === "0p7000"
  ) {
    return "frontier_bisection_ladder";
  }
  return "deep_exploratory_ladder";
};

export const classifyFrontierBlocker = (
  row: Pick<
    SweepRow,
    | "runtimeBlockingReason"
    | "runHealth"
    | "fullLoopStateRaw"
    | "fullLoopStateNormalized"
    | "gates"
  > | null,
): FrontierBlockerClass | null => {
  if (row == null) return "not_run";
  if (row.runtimeBlockingReason === "selected_transport_profile_mismatch") {
    return "profile_mismatch";
  }
  if (row.runtimeBlockingReason != null) {
    return "selected_transport_runtime";
  }
  if (row.runHealth === "failed_stale") {
    return "stale_artifact";
  }
  if (
    row.fullLoopStateRaw == null ||
    row.fullLoopStateRaw === "unavailable" ||
    row.fullLoopStateNormalized !== "pass"
  ) {
    return "missing_full_loop_audit";
  }
  if (row.gates.clockingConsistency !== "pass") return "clocking_mismatch";
  if (row.gates.decompositionConsistency !== "pass") return "decomposition_mismatch";
  if (row.gates.antiSrSafety !== "pass") return "anti_sr_gate_fail";
  if (row.gates.invariantGate !== "pass" || row.gates.fullLoopAudit !== "pass") {
    return "stress_or_constraint_gate_fail";
  }
  if (row.gates.promotionEligible === "pass") return null;
  return "unknown";
};

const frontierBlockerStage = (blockerClass: FrontierBlockerClass | null): string | null => {
  switch (blockerClass) {
    case null:
      return null;
    case "selected_transport_runtime":
    case "profile_mismatch":
      return "selected_transport";
    case "missing_full_loop_audit":
      return "full_loop_audit";
    case "stale_artifact":
      return "freshness";
    case "clocking_mismatch":
      return "clocking_consistency";
    case "decomposition_mismatch":
      return "shift_lapse_decomposition";
    case "anti_sr_gate_fail":
      return "anti_sr_safety";
    case "stress_or_constraint_gate_fail":
      return "stress_or_constraint_gate";
    case "not_run":
      return "not_run";
    case "unknown":
      return "unknown";
  }
};

const frontierNextAction = (
  blockerClass: FrontierBlockerClass | null,
  runtimeReason: SweepRow["runtimeBlockingReason"] | null,
): string | null => {
  const runtimeAction = getNextActionForRuntimeReason(runtimeReason);
  if (runtimeAction != null) return runtimeAction;
  switch (blockerClass) {
    case null:
      return null;
    case "not_run":
      return "Run the controlled ladder from the confirmed anchor outward before using this row as evidence.";
    case "selected_transport_runtime":
      return "Run selected-transport-only smoke with isolated attempts, then promote artifacts only after success.";
    case "missing_full_loop_audit":
      return "Regenerate the full-loop audit after selected transport completes and verify artifact freshness.";
    case "stale_artifact":
      return "Clean or isolate stale artifacts and rerun the affected profile.";
    case "profile_mismatch":
      return "Fix profile/env resolution so profileId, tag, centerlineAlpha, and centerlineDtauDt agree.";
    case "clocking_mismatch":
      return "Compare measured proper time and proper-minus-coordinate against the alpha*T target.";
    case "decomposition_mismatch":
      return "Inspect shift-vs-lapse decomposition residual and lapseTrackedFraction for this profile.";
    case "anti_sr_gate_fail":
      return "Inspect betaOverAlphaMax and wallHorizonMargin before any bounded-lapse promotion.";
    case "stress_or_constraint_gate_fail":
      return "Inspect invariant, stress, constraint, and full-loop audit gate details.";
    case "unknown":
      return "Inspect row gate diagnostics and runtime diagnostics before advancing the ladder.";
  }
};

export const buildNhm2FrontierDistanceSummary = (args: {
  sweepName: string;
  specs: SweepSpec[];
  rows: SweepRow[];
  baseline: Nhm2ClockingBaseline;
  ladder: LadderProgressSummary;
}): Nhm2FrontierDistanceSummary => {
  const rowByProfileId = new Map(args.rows.map((row) => [row.profileId, row]));
  const ladderByProfileId = new Map(args.ladder.rows.map((row) => [row.profileId, row]));
  const anchorTarget = deriveExpectedClockingTarget(
    args.baseline,
    args.baseline.centerlineAlpha,
  );
  return {
    manifestType: "nhm2_frontier_distance/v1",
    generatedAt: new Date().toISOString(),
    sweepName: args.sweepName,
    family: "nhm2-shift-lapse",
    clockingMode: "bounded-lapse",
    anchor: args.baseline,
    expectedClockingModel: {
      model: "tau_expected(alpha)=alpha*coordinate_time",
      claimBoundary:
        "Expected clocking targets are not validated outcomes; NHM2 full-loop artifacts decide evidence viability.",
    },
    frontier: args.ladder.frontier,
    rows: args.specs.map((spec) => {
      const profileId = inferProfileId(spec.tag);
      const row = rowByProfileId.get(profileId) ?? null;
      const ladderRow = ladderByProfileId.get(profileId) ?? null;
      const expected = deriveExpectedClockingTarget(args.baseline, spec.alpha);
      const blockerClass =
        ladderRow?.ladderState === "skipped_after_blocker"
          ? "not_run"
          : classifyFrontierBlocker(row);
      const validationState: Nhm2FrontierDistanceRow["validationState"] =
        ladderRow?.ladderState === "skipped_after_blocker"
          ? "skipped_after_blocker"
          : row?.validationState ?? "planned";
      return {
        profileId,
        tag: spec.tag,
        centerlineAlpha: spec.alpha,
        bracket: spec.bracket,
        ladderGroup: classifyFrontierLadderGroup(spec),
        expectedProperTimeS: expected.expectedProperTimeS,
        expectedSavedDays: expected.expectedSavedDays,
        expectedSubjectiveEfficiency: expected.expectedSubjectiveEfficiency,
        validationState,
        distanceFromAnchor: {
          anchorProfileId: baselineProfileId,
          alphaDeltaFromAnchor: spec.alpha - args.baseline.centerlineAlpha,
          expectedAdditionalSavedDaysVsAnchor:
            expected.expectedSavedDays - anchorTarget.expectedSavedDays,
          expectedEfficiencyGainVsAnchor:
            expected.expectedSubjectiveEfficiency -
            anchorTarget.expectedSubjectiveEfficiency,
        },
        measuredDistance:
          row == null
            ? null
            : {
                measuredProperTimeS: row.properTimeS,
                measuredProperToCoordinateRatio: row.properToCoordinateRatio,
                properTimeErrorVsExpectedS:
                  row.properTimeS == null
                    ? null
                    : Math.abs(row.properTimeS - expected.expectedProperTimeS),
                decompositionResidualS: row.decompositionResidualS,
                lapseTrackedFraction: row.lapseTrackedFraction,
                betaOverAlphaMax: row.betaOverAlphaMax,
                wallHorizonMargin: row.wallHorizonMargin,
              },
        blocker: {
          blockerClass,
          blockerStage: frontierBlockerStage(blockerClass),
          runtimeBlockingReason: row?.runtimeBlockingReason ?? null,
          nextAction: frontierNextAction(blockerClass, row?.runtimeBlockingReason ?? null),
        },
      };
    }),
  };
};

export const runNhm2LapseAlphaSweep = async (): Promise<void> => {
  const runModeRaw = (process.env.NHM2_SWEEP_MODE ?? "full").trim().toLowerCase();
  const selectedTransportOnly =
    process.env.NHM2_SELECTED_TRANSPORT_ONLY === "1" || runModeRaw === "selected-transport-only";
  const runFullLoop = selectedTransportOnly
    ? false
    : process.env.NHM2_ALPHA_SWEEP_RUN_FULL_LOOP !== "0";
  const configText = fs.readFileSync(configPath, "utf8");
  const config = assertValidSweepConfig(JSON.parse(configText));
  const configChecksum = checksum(configText);
  const resolvedCitationRegistryPath = resolveCitationRegistryPath();
  const registryText = fs.readFileSync(resolvedCitationRegistryPath, "utf8");
  const citationRegistry = assertValidCitationRegistry(JSON.parse(registryText));
  const registryChecksum = checksum(registryText);
  const researchLockText = fs.readFileSync(researchLockPath, "utf8");
  const researchLock = assertValidResearchLock(JSON.parse(researchLockText));
  const researchLockChecksum = checksum(researchLockText);
  assertResearchLockCoverage({
    lock: researchLock,
    requiredPaperIds: citationRegistry.papers.map((paper) => paper.id),
  });
  const gitSha = getGitSha();
  const fullLoopTimeoutMs = readPositiveTimeoutMsFromEnv(
    "NHM2_FULL_LOOP_TIMEOUT_S",
    defaultFullLoopTimeoutS,
  );
  const selectedTransportTimeoutMs = readPositiveTimeoutMsFromEnv(
    "NHM2_SELECTED_TRANSPORT_TIMEOUT_S",
    defaultSelectedTransportTimeoutS,
  );
  const selectedTransportTimeoutMaxMs = readPositiveTimeoutMsFromEnv(
    "NHM2_SELECTED_TRANSPORT_TIMEOUT_MAX_S",
    defaultSelectedTransportTimeoutMaxS,
  );
  const selectedTransportTimeoutEffectiveMs = Math.min(
    selectedTransportTimeoutMs,
    selectedTransportTimeoutMaxMs,
  );
  const selectedTransportRetryMax = Math.min(
    1,
    readPositiveIntFromEnv("NHM2_SELECTED_TRANSPORT_RETRY_MAX", 1),
  );
  const heartbeatIntervalMs = readPositiveTimeoutMsFromEnv(
    "NHM2_HEARTBEAT_INTERVAL_S",
    defaultHeartbeatIntervalS,
  );
  const stallMaxNoProgressMs = readPositiveTimeoutMsFromEnv(
    "NHM2_STALL_MAX_NO_PROGRESS_S",
    defaultStallMaxNoProgressS,
  );
  const stallMinHeartbeats = readPositiveIntFromEnv(
    "NHM2_STALL_MIN_HEARTBEATS",
    defaultStallMinHeartbeats,
  );
  const allowExploratoryPromotion =
    process.env.NHM2_ALLOW_EXPLORATORY_PROMOTION === "1";
  const solverCommand =
    process.env.NHM2_SOLVER_COMMAND ??
    "publishNhm2ShiftLapseSelectedTransportBundle + publishNhm2ShiftLapseFullLoopAudit";
  let onlyTags = process.env.NHM2_ALPHA_SWEEP_ONLY_TAGS
    ? splitCsv(process.env.NHM2_ALPHA_SWEEP_ONLY_TAGS)
    : null;
  const selectedTransportOnlyContract = selectedTransportOnly
    ? resolveSelectedTransportOnlyContract(process.env)
    : null;
  if (selectedTransportOnly) {
    onlyTags = [selectedTransportOnlyContract.profileTag];
  }
  const requirePreviousExploratoryFullLoop =
    process.env.NHM2_ALPHA_SWEEP_REQUIRE_PREVIOUS_FULL_LOOP !== "0";
  const selectedSpecs = selectSweepSpecs({
    allSpecs: config.alphas,
    onlyTags,
  });
  if (!selectedTransportOnly) {
    assertControlledSingleProfileContract({
      onlyTags,
      selectedSpecs,
      runFullLoop,
    });
  }
  const registryCitations: CitationSpec[] = citationRegistry.papers.map((paper) => ({
    id: paper.id,
    type: "paper",
    title: paper.title,
    url: paper.url,
    doi: paper.doi,
  }));
  const citationById = new Map<string, CitationSpec>();
  for (const citation of [...(config.citations ?? []), ...registryCitations]) {
    citationById.set(citation.id, citation);
  }
  const effectiveCitations = Array.from(citationById.values());
  const registryPaperIds = citationRegistry.papers.map((paper) => paper.id);
  const researchLockById = Object.fromEntries(
    researchLock.entries.map((entry) => [entry.id, entry]),
  ) as Record<string, ResearchLockEntry>;
  const registryPaperMetadataById = Object.fromEntries(
    citationRegistry.papers.map((paper) => [
      paper.id,
      {
        sourceStability: paper.sourceStability,
        doi: paper.doi,
        evidenceRole: paper.evidenceRole,
        publisherType: researchLockById[paper.id]?.publisherType,
        year: researchLockById[paper.id]?.year,
      },
    ]),
  ) as Record<
    string,
    Pick<CitationRegistryPaper, "sourceStability" | "doi" | "evidenceRole"> & {
      publisherType?: "journal" | "preprint" | "review";
      year?: number;
    }
  >;
  const rows: SweepRow[] = [];

  const citationGateSummary = enforceResearchCitationGate({
    manifestPath: citationChecklistPath,
    requireGithubCloneForMeasured: false,
    requireCompletedChecklistItems: true,
  });

  fs.mkdirSync(sweepRoot, { recursive: true });
  fs.mkdirSync(sweepAuditRoot, { recursive: true });

  for (const spec of selectedSpecs) {
    const profileId = inferProfileId(spec.tag);
    assertControlledExploratoryPrereq({
      profileTag: spec.tag,
      profileId,
      sweepRootDir: sweepRoot,
      requirePreviousFullLoop: requirePreviousExploratoryFullLoop,
    });
    const resolvedProfile = resolveWarpShiftLapseProfileStrict(profileId);
    const resolvedAlpha = toFinite(resolvedProfile.alphaCenterlineDefault);
    if (resolvedAlpha == null || Math.abs(resolvedAlpha - spec.alpha) > 1e-12) {
      throw new Error(
        `Profile alpha mismatch for ${profileId}: config=${spec.alpha}, profile=${resolvedAlpha}`,
      );
    }
    if (
      selectedTransportOnlyContract != null &&
      (selectedTransportOnlyContract.profileId !== profileId ||
        Math.abs(selectedTransportOnlyContract.alpha - spec.alpha) > 1e-12 ||
        Math.abs(selectedTransportOnlyContract.dtau - spec.alpha) > 1e-12)
    ) {
      throw new Error(
        `selected_transport_profile_mismatch:selected_only_contract profile=${selectedTransportOnlyContract.profileId} alpha=${selectedTransportOnlyContract.alpha} dtau=${selectedTransportOnlyContract.dtau}; sweep profile=${profileId} alpha=${spec.alpha}`,
      );
    }

    const profileArtifactRoot = selectedTransportOnly
      ? selectedTransportOnlyContract?.outputDir ?? readRequiredEnv("NHM2_OUTPUT_DIR")
      : path.join(sweepRoot, profileId);
    const profileAuditRoot = selectedTransportOnly
      ? path.join(profileArtifactRoot, "audit")
      : path.join(sweepAuditRoot, profileId);
    fs.mkdirSync(profileArtifactRoot, { recursive: true });
    fs.mkdirSync(profileAuditRoot, { recursive: true });
    writeProfileResolutionArtifact({
      profileArtifactRoot,
      profileId,
      profileTag: spec.tag,
      centerlineAlpha: spec.alpha,
      centerlineDtauDt: spec.alpha,
      outputDir: profileArtifactRoot,
    });
    const heartbeat = startHeartbeatController({
      profileArtifactRoot,
      profileId,
      heartbeatIntervalMs,
    });
    let rowWritten = false;

    try {
    const selectedTransportRuntimeDiagnosticsPath = path.join(
      profileArtifactRoot,
      "nhm2-selected-transport-runtime-diagnostics-latest.json",
    );
    const selectedTransportAttempts: SelectedTransportRuntimeAttempt[] = [];
    let selectedTransport:
      | Awaited<ReturnType<typeof publishNhm2ShiftLapseSelectedTransportBundle>>
      | null = null;
    let selectedTransportRuntimeReason: SelectedTransportRuntimeReason | null = null;

    for (let attempt = 1; attempt <= selectedTransportRetryMax + 1; attempt += 1) {
      const attemptLabel = `attempt-${String(attempt).padStart(3, "0")}`;
      const attemptArtifactRoot = path.join(profileArtifactRoot, "attempts", attemptLabel);
      const attemptAuditRoot = path.join(profileAuditRoot, "attempts", attemptLabel);
      prepareCleanDir(attemptArtifactRoot);
      prepareCleanDir(attemptAuditRoot);
      const publicationLockPath = path.join(
        attemptArtifactRoot,
        ".nhm2-selected-family-bounded-stack.lock",
      );
      const lockExists = fs.existsSync(publicationLockPath);
      const lockStat = lockExists ? fs.statSync(publicationLockPath) : null;
      const lockMtimeMs = lockStat?.mtimeMs ?? null;
      let staleLockRemoved = false;
      if (lockExists) {
        fs.unlinkSync(publicationLockPath);
        staleLockRemoved = true;
      }

      const attemptStartedMs = Date.now();
      heartbeat.update("selected_transport", `selected_transport_attempt_${attempt}_started`);
      try {
        const selectedTransportResult = await runWithTimeoutOrStall({
          timeoutMs: selectedTransportTimeoutEffectiveMs,
          heartbeat,
          stallMaxNoProgressMs,
          stallMinHeartbeats,
          stallCheckIntervalMs: heartbeatIntervalMs,
          operation: async () =>
            publishNhm2ShiftLapseSelectedTransportBundle({
              shiftLapseProfileId: profileId,
              artifactRootDir: attemptArtifactRoot,
              auditRootDir: attemptAuditRoot,
              publicationLockPath,
            }),
        });
        const attemptCompletedMs = Date.now();
        if (
          selectedTransportResult.timedOut ||
          selectedTransportResult.stalled ||
          selectedTransportResult.value == null
        ) {
          const killResult =
            selectedTransportResult.timedOut || selectedTransportResult.stalled
              ? killPotentialSelectedTransportProcessTree(profileId)
              : { killedProcessTree: false, candidatePids: [], killedPids: [] };
          writeAttemptWorkerPidManifest({
            attemptArtifactRoot,
            profileId,
            candidatePids: killResult.candidatePids,
            killedPids: killResult.killedPids,
          });
          const runtimeReason: SelectedTransportRuntimeReason = selectedTransportResult.stalled
            ? "selected_transport_stall"
            : "selected_transport_timeout";
          selectedTransportAttempts.push({
            attempt,
            startedAt: new Date(attemptStartedMs).toISOString(),
            completedAt: new Date(attemptCompletedMs).toISOString(),
            durationMs: attemptCompletedMs - attemptStartedMs,
            timeoutMs: selectedTransportTimeoutEffectiveMs,
            staleLockFound: lockExists,
            staleLockRemoved,
            staleLockMtimeIso: lockMtimeMs == null ? null : new Date(lockMtimeMs).toISOString(),
            staleLockAgeS: lockMtimeMs == null ? null : Math.max(0, (attemptStartedMs - lockMtimeMs) / 1000),
            outcome: selectedTransportResult.stalled ? "stall" : "timeout",
            runtimeReason,
            error: null,
            attemptArtifactRoot,
            attemptAuditRoot,
            killedProcessTree: killResult.killedProcessTree,
            killedPids: killResult.killedPids,
            selectedTransportRuntimeDiagnostics: null,
          });
          selectedTransportRuntimeReason = runtimeReason;
          heartbeat.update("failed", runtimeReason);
          if (attempt <= selectedTransportRetryMax) continue;
          break;
        }
        const transportGateStatus =
          selectedTransportResult.value.transportResult.artifact.promotionGateStatus;
        if (transportGateStatus === "fail") {
          throw new Error(`selected_transport_gate_fail:${profileId}`);
        }
        validateSelectedTransportAttemptOutputs({
          attemptArtifactRoot,
          expectedProfileId: profileId,
          expectedAlpha: spec.alpha,
          attemptStartedMs,
        });
        promoteAttemptOutputs({
          attemptArtifactRoot,
          attemptAuditRoot,
          profileArtifactRoot,
          profileAuditRoot,
        });
        selectedTransportAttempts.push({
          attempt,
          startedAt: new Date(attemptStartedMs).toISOString(),
          completedAt: new Date(attemptCompletedMs).toISOString(),
          durationMs: attemptCompletedMs - attemptStartedMs,
          timeoutMs: selectedTransportTimeoutEffectiveMs,
          staleLockFound: lockExists,
          staleLockRemoved,
          staleLockMtimeIso: lockMtimeMs == null ? null : new Date(lockMtimeMs).toISOString(),
          staleLockAgeS: lockMtimeMs == null ? null : Math.max(0, (attemptStartedMs - lockMtimeMs) / 1000),
          outcome: "success",
          runtimeReason: null,
          error: null,
          attemptArtifactRoot,
          attemptAuditRoot,
          killedProcessTree: false,
          killedPids: [],
          selectedTransportRuntimeDiagnostics:
            selectedTransportResult.value.runtimeDiagnostics ?? null,
        });
        selectedTransport = selectedTransportResult.value;
        selectedTransportRuntimeReason = null;
        break;
      } catch (error) {
        const attemptCompletedMs = Date.now();
        const errorText = String(error);
        const runtimeReason = inferSelectedTransportRuntimeReason(errorText);
        selectedTransportAttempts.push({
          attempt,
          startedAt: new Date(attemptStartedMs).toISOString(),
          completedAt: new Date(attemptCompletedMs).toISOString(),
          durationMs: attemptCompletedMs - attemptStartedMs,
          timeoutMs: selectedTransportTimeoutEffectiveMs,
          staleLockFound: lockExists,
          staleLockRemoved,
          staleLockMtimeIso: lockMtimeMs == null ? null : new Date(lockMtimeMs).toISOString(),
          staleLockAgeS: lockMtimeMs == null ? null : Math.max(0, (attemptStartedMs - lockMtimeMs) / 1000),
          outcome: "error",
          runtimeReason,
          error: errorText,
          attemptArtifactRoot,
          attemptAuditRoot,
          killedProcessTree: false,
          killedPids: [],
          selectedTransportRuntimeDiagnostics: null,
        });
        selectedTransportRuntimeReason = runtimeReason;
        heartbeat.update("failed", runtimeReason);
        if (attempt <= selectedTransportRetryMax && runtimeReason !== "selected_transport_lock_contention") {
          continue;
        }
        break;
      }
    }

    writeJsonAtomic(selectedTransportRuntimeDiagnosticsPath, {
      generatedAt: new Date().toISOString(),
      profileId,
      timeoutMsRequested: selectedTransportTimeoutMs,
      timeoutMsCap: selectedTransportTimeoutMaxMs,
      timeoutMsEffective: selectedTransportTimeoutEffectiveMs,
      retryMax: selectedTransportRetryMax,
      attempts: selectedTransportAttempts,
      finalOutcome: selectedTransport == null ? "failed" : "success",
      finalRuntimeReason: selectedTransportRuntimeReason,
      finalSelectedTransportRuntimeDiagnostics:
        selectedTransport?.runtimeDiagnostics ?? null,
    });

    if (selectedTransport == null) {
      const fullLoopStateRaw = "unavailable";
      const fullLoopAvailabilitySummary = buildFallbackFullLoopAvailability({
        profileArtifactRoot,
        fullLoopStateRaw,
      });
      if (selectedTransportRuntimeReason != null) {
        fullLoopAvailabilitySummary.availabilityReasonCodes = [
          ...new Set([...fullLoopAvailabilitySummary.availabilityReasonCodes, selectedTransportRuntimeReason]),
        ];
      }
      const runtimeFreshnessDecision =
        selectedTransportRuntimeReason === "selected_transport_stall" ? "stall" : "timeout";
      rows.push({
        profileId,
        bracket: spec.bracket,
        family: "nhm2-shift-lapse",
        clockingMode: "bounded-lapse",
        centerlineAlpha: spec.alpha,
        centerlineDtauDt: spec.alpha,
        coordinateTimeS: null,
        properTimeS: null,
        properMinusCoordinateS: null,
        savedDays: null,
        properToCoordinateRatio: null,
        subjectiveEfficiency: 1 / spec.alpha,
        clockingTargetState: "expected_not_validated",
        validationState: "runtime_blocked",
        expectedClockingTarget: null,
        betaOverAlphaMax: null,
        wallHorizonMargin: null,
        decompositionResidualS: null,
        lapseTrackedFraction: null,
        invariantGateStatus: null,
        fullLoopStateRaw,
        fullLoopStateNormalized: "fail",
        fullLoopAvailability: fullLoopAvailabilitySummary,
        runHealth: runtimeFreshnessDecision === "stall" ? "failed_stall" : "failed_timeout",
        runtimeBlockingReason: selectedTransportRuntimeReason,
        stageDetailFreshness: {
          allFresh: false,
          staleReasonCodes: selectedTransportRuntimeReason == null ? [] : [selectedTransportRuntimeReason],
          runStartedAt: new Date().toISOString(),
          freshnessCheckedAt: new Date().toISOString(),
          freshnessDecision: runtimeFreshnessDecision,
          artifactMtimeIso: {
            fullLoopAuditLatest: null,
            sourceClosureLatest: null,
            observerAuditLatest: null,
          },
        },
        coordinateTimeDeltaFromBaselineS: null,
        coordinateTimeDeltaFromBaselineRel: null,
        gates: {
          baselineInvariance: "fail",
          clockingConsistency: "fail",
          antiSrSafety: "fail",
          decompositionConsistency: "fail",
          invariantGate: "fail",
          fullLoopAudit: "fail",
          evidenceLedger: "fail",
          promotionEligible: "fail",
        },
        progressionClass: "diagnostic_fail",
        claimClass: "not_validated",
        supportTier: "repo_plus_literature",
        literatureContextOnly: false,
        claimClassNote:
          "Selected transport did not complete within runtime constraints; treat as diagnostic runtime blocker.",
        uncertainty: {
          category: "runtime_blocker",
          blockers: [selectedTransportRuntimeReason ?? "selected_transport_unknown_error"],
          nextMeasurement:
            "Inspect nhm2-selected-transport-runtime-diagnostics-latest.json and heartbeat, then rerun controlled single-profile loop.",
          note: "Runtime blocker occurred before selected transport publication completed.",
        },
        gateDiagnostics: {
          baselineToleranceS: baselineCoordinateAbsTolS,
          baselineToleranceRel: baselineCoordinateRelTol,
          ratioError: null,
          ratioTolerance: clockRatioTol,
          expectedProperTimeErrorS: null,
          properMinusErrorS: null,
          properMinusToleranceS: properMinusAbsTolS,
          expectedProperMinusErrorS: null,
          betaOverAlphaMaxLimit: antiSrBetaOverAlphaMaxLimit,
          wallHorizonMarginMin: antiSrWallHorizonMarginMin,
          decompositionResidualToleranceS,
          lapseTrackedFractionMin,
          evidenceBlocking: true,
          evidenceLedgerReason: "full_loop_unavailable",
        },
        overallState: "fail",
        currentClaimTier: "diagnostic",
        maximumClaimTier: "reduced-order",
        sourceDir: profileArtifactRoot,
        auditDir: profileAuditRoot,
        provenance: {
          generatedAt: new Date().toISOString(),
          gitSha,
          sweepConfigPath: configPath,
          sweepConfigChecksum: configChecksum,
          fullLoopExecuted: false,
          solverCommand,
        },
      });
      rowWritten = true;
      continue;
    }
    heartbeat.update("selected_transport", "selected_transport_bundle_published");

    let fullLoopStateRaw: string | null = null;
    let fullLoopAvailabilitySummary: SweepFullLoopAvailability | null = null;
    let stageDetailFreshnessSummary: SweepRow["stageDetailFreshness"] = null;
    let evidenceLedgerBlocking: boolean | null = null;
    let evidenceLedgerReason: SweepRow["gateDiagnostics"]["evidenceLedgerReason"] =
      "full_loop_unavailable";
    if (runFullLoop) {
      heartbeat.update("full_loop", "full_loop_publish_started");
      const fullLoopRunStartedAtMs = Date.now();
      clearStaleProofSurfaceLockOrThrow({
        lockPath: proofSurfacePublicationLockPath,
        operation: "run-nhm2-lapse-alpha-sweep:full-loop",
      });
      seedProfileSweepReferences({ profileArtifactRoot });
      const fullLoopResult = await runWithTimeoutOrStall({
        timeoutMs: fullLoopTimeoutMs,
        heartbeat,
        stallMaxNoProgressMs,
        stallMinHeartbeats,
        stallCheckIntervalMs: heartbeatIntervalMs,
        operation: async () =>
          publishNhm2ShiftLapseFullLoopAudit({
            selectedFamilyArtifactRootDir: profileArtifactRoot,
            selectedFamilyAuditRootDir: profileAuditRoot,
            artifactRootDir: profileArtifactRoot,
            auditRootDir: profileAuditRoot,
            reuseExistingSelectedArtifacts: true,
          }),
      });
      if (fullLoopResult.timedOut || fullLoopResult.stalled || fullLoopResult.value == null) {
        const stallTriggered = fullLoopResult.stalled === true;
        fullLoopStateRaw = "unavailable";
        fullLoopAvailabilitySummary = buildFallbackFullLoopAvailability({
          profileArtifactRoot,
          fullLoopStateRaw,
        });
        fullLoopAvailabilitySummary.availabilityReasonCodes = [
          ...new Set([
            ...fullLoopAvailabilitySummary.availabilityReasonCodes,
            stallTriggered ? "natario_stall_detected" : "full_loop_timeout",
          ]),
        ];
        stageDetailFreshnessSummary = {
          allFresh: false,
          staleReasonCodes: [stallTriggered ? "natario_stall_detected" : "full_loop_timeout"],
          runStartedAt: new Date(fullLoopRunStartedAtMs).toISOString(),
          freshnessCheckedAt: new Date().toISOString(),
          freshnessDecision: stallTriggered ? "stall" : "timeout",
          artifactMtimeIso: {
            fullLoopAuditLatest: null,
            sourceClosureLatest: null,
            observerAuditLatest: null,
          },
        };
        evidenceLedgerBlocking = true;
        evidenceLedgerReason = "full_loop_unavailable";
        heartbeat.update("failed", stallTriggered ? "natario_stall_detected" : "full_loop_timeout");
        process.stderr.write(
          stallTriggered
            ? `[NHM2 alpha sweep] Stall detector triggered for ${profileId} after no progress >= ${stallMaxNoProgressMs} ms (min heartbeats ${stallMinHeartbeats})\n`
            : `[NHM2 alpha sweep] Full-loop timeout for ${profileId} after ${fullLoopTimeoutMs} ms\n`,
        );
      } else {
        const fullLoop = fullLoopResult.value;
        fullLoopStateRaw = String(
          (fullLoop.auditArtifact.artifact as any).overallState ??
            "unavailable",
        );
        const freshness = verifyFullLoopArtifactFreshness({
          profileArtifactRoot,
          runStartedAtMs: fullLoopRunStartedAtMs,
        });
      const fullLoopAuditRecord =
        freshness.records.find((entry) => entry.fileName === "nhm2-full-loop-audit-latest.json") ??
        null;
      const sourceClosureRecord =
        freshness.records.find((entry) => entry.fileName === "nhm2-source-closure-latest.json") ??
        null;
      const observerAuditRecord =
        freshness.records.find((entry) => entry.fileName === "nhm2-observer-audit-latest.json") ??
        null;
      stageDetailFreshnessSummary = {
        allFresh: freshness.allFresh,
        staleReasonCodes: [...freshness.staleReasonCodes],
        runStartedAt: new Date(fullLoopRunStartedAtMs).toISOString(),
        freshnessCheckedAt: new Date().toISOString(),
        freshnessDecision:
          freshness.staleReasonCodes.length <= 0
            ? "fresh"
            : freshness.staleReasonCodes.some((entry) => entry.startsWith("missing:"))
              ? "missing"
              : "stale",
        artifactMtimeIso: {
          fullLoopAuditLatest: toIsoFromMs(fullLoopAuditRecord?.mtimeMs ?? null),
          sourceClosureLatest: toIsoFromMs(sourceClosureRecord?.mtimeMs ?? null),
          observerAuditLatest: toIsoFromMs(observerAuditRecord?.mtimeMs ?? null),
        },
        };
      if (!freshness.allFresh) {
        fullLoopStateRaw = "unavailable";
        fullLoopAvailabilitySummary = buildFallbackFullLoopAvailability({
          profileArtifactRoot,
          fullLoopStateRaw,
        });
        fullLoopAvailabilitySummary.availabilityReasonCodes = [
          ...new Set([
            ...fullLoopAvailabilitySummary.availabilityReasonCodes,
            "full_loop_artifact_stale_or_missing",
            ...freshness.staleReasonCodes,
          ]),
        ];
        evidenceLedgerBlocking = true;
        evidenceLedgerReason = "full_loop_unavailable";
        heartbeat.update("failed", "freshness_gate_failed");
        process.stderr.write(
          `[NHM2 alpha sweep] Freshness gate failed for ${profileId}: ${freshness.staleReasonCodes.join(", ")}\n`,
        );
      } else {
      heartbeat.update("freshness_check", "freshness_gate_passed");
      const claimEvidence =
        (fullLoop as any)?.claimEvidenceArtifact?.artifact ??
        null;
      const fullLoopAvailability =
        claimEvidence?.fullLoopAvailability != null
          ? normalizeFullLoopAvailability(claimEvidence.fullLoopAvailability)
          : buildFallbackFullLoopAvailability({
              profileArtifactRoot,
              fullLoopStateRaw,
            });
      fullLoopAvailabilitySummary = fullLoopAvailability;
      const availabilityFailing =
        fullLoopAvailability.strictSignalAvailable !== true ||
        fullLoopAvailability.sourceClosureAvailable !== true ||
        fullLoopAvailability.observerAuditAvailable !== true ||
        fullLoopAvailability.certificateAvailable !== true;
      const entryBlocking = Array.isArray(claimEvidence?.entries)
        ? claimEvidence.entries.some((entry: any) => entry?.mappingStatus !== "mapped")
        : true;
      evidenceLedgerBlocking =
        availabilityFailing ||
        (claimEvidence?.hasBlockingEvidence === true) ||
        (claimEvidence?.validationOk === false) ||
        entryBlocking;
      evidenceLedgerReason = deriveEvidenceLedgerReason({
        runFullLoop,
        fullLoopStateRaw,
        claimEvidence:
          claimEvidence ??
          {
            validationOk: true,
            hasBlockingEvidence: availabilityFailing,
            entries: [{ mappingStatus: "mapped" }],
          },
      });
      heartbeat.update("full_loop", "full_loop_publish_completed");
      }
    }
    }

    const transport = selectedTransport.transportResult.artifact;
    const missionPath = selectedTransport.boundedStack.missionTimeComparison.latestJsonPath;
    const mission = readJsonMaybe<Record<string, any>>(missionPath);
    const comparisonMetrics = mission?.comparisonMetrics ?? {};
    const coordinateTimeS = toFinite(mission?.warpCoordinateTimeEstimate?.seconds);
    const properTimeS = toFinite(mission?.warpProperTimeEstimate?.seconds);
    const properMinusCoordinateS = toFinite(comparisonMetrics.properMinusCoordinate_seconds);
    const betaOverAlphaMax = toFinite(
      selectedTransport.boundedStack.worldline.artifact.sourceSurface
        ?.shiftLapseTransportPromotionGate?.betaOverAlphaMax,
    );
    const wallHorizonMargin = toFinite(
      selectedTransport.boundedStack.worldline.artifact.sourceSurface
        ?.shiftLapseTransportPromotionGate?.wallHorizonMargin,
    );

    heartbeat.update("claims", "assembling_row");
    rows.push({
      profileId,
      bracket: spec.bracket,
      family: "nhm2-shift-lapse",
      clockingMode: "bounded-lapse",
      centerlineAlpha: spec.alpha,
      centerlineDtauDt: spec.alpha,
      coordinateTimeS,
      properTimeS,
      properMinusCoordinateS,
      savedDays: properMinusCoordinateS == null ? null : -properMinusCoordinateS / 86400,
      properToCoordinateRatio:
        coordinateTimeS != null && properTimeS != null ? properTimeS / coordinateTimeS : null,
      subjectiveEfficiency: 1 / spec.alpha,
      clockingTargetState: "expected_not_validated",
      validationState: "planned",
      expectedClockingTarget: null,
      betaOverAlphaMax,
      wallHorizonMargin,
      decompositionResidualS: toFinite(transport.shiftVsLapseResidual_seconds),
      lapseTrackedFraction: toFinite(transport.lapseDialTrackedFraction),
      invariantGateStatus: transport.centerlineLapseInvariantGate?.status ?? null,
      fullLoopStateRaw,
      fullLoopStateNormalized: normalizeFullLoopState(fullLoopStateRaw),
      fullLoopAvailability: fullLoopAvailabilitySummary,
      runHealth: "pending",
      runtimeBlockingReason: null,
      stageDetailFreshness: stageDetailFreshnessSummary,
      coordinateTimeDeltaFromBaselineS: null,
      coordinateTimeDeltaFromBaselineRel: null,
      gates: {
        baselineInvariance: "fail",
        clockingConsistency: "fail",
        antiSrSafety: "fail",
        decompositionConsistency: "fail",
        invariantGate: "fail",
        fullLoopAudit: "fail",
        evidenceLedger: "fail",
        promotionEligible: "fail",
      },
      progressionClass: "diagnostic_fail",
      claimClass: "not_validated",
      supportTier: "repo_plus_literature",
      literatureContextOnly: false,
      claimClassNote:
        "Not validated by the NHM2 full-loop promotion stack; treat as diagnostic only.",
      uncertainty: {
        category: "evidence_gap",
        blockers: ["pending_row_evaluation"],
        nextMeasurement:
          "Run controlled single-profile full-loop with fresh source-closure and observer-audit artifacts.",
        note: "Row-level uncertainty will be finalized after gate and citation classification.",
      },
      gateDiagnostics: {
        baselineToleranceS: baselineCoordinateAbsTolS,
        baselineToleranceRel: baselineCoordinateRelTol,
        ratioError: null,
        ratioTolerance: clockRatioTol,
        expectedProperTimeErrorS: null,
        properMinusErrorS: null,
        properMinusToleranceS: properMinusAbsTolS,
        expectedProperMinusErrorS: null,
        betaOverAlphaMaxLimit: antiSrBetaOverAlphaMaxLimit,
        wallHorizonMarginMin: antiSrWallHorizonMarginMin,
        decompositionResidualToleranceS,
        lapseTrackedFractionMin,
        evidenceBlocking: evidenceLedgerBlocking,
        evidenceLedgerReason,
      },
      overallState: "pending",
      currentClaimTier: "diagnostic",
      maximumClaimTier: "reduced-order",
      sourceDir: profileArtifactRoot,
      auditDir: profileAuditRoot,
      provenance: {
        generatedAt: new Date().toISOString(),
        gitSha,
        sweepConfigPath: configPath,
        sweepConfigChecksum: configChecksum,
        fullLoopExecuted: runFullLoop,
        solverCommand,
      },
    });
    rowWritten = true;
    } finally {
      heartbeat.stop(rowWritten ? "complete" : "failed", rowWritten ? "row_written" : "row_failed");
    }
  }

  const baselineRow = rows.find((entry) => entry.profileId === baselineProfileId);
  let baselineCoordinateS: number | null =
    baselineRow && isFinitePositive(baselineRow.coordinateTimeS) ? baselineRow.coordinateTimeS : null;
  let baselineProperS: number | null =
    baselineRow && isFinitePositive(baselineRow.properTimeS) ? baselineRow.properTimeS : null;
  let baselineProperMinusS: number | null =
    baselineRow && baselineRow.properMinusCoordinateS != null ? baselineRow.properMinusCoordinateS : null;
  if (baselineCoordinateS == null) {
    const baselineMissionPathAlphaSweep = path.join(
      sweepRoot,
      baselineProfileId,
      "nhm2-mission-time-comparison-latest.json",
    );
    const baselineMission =
      readJsonMaybe<Record<string, any>>(baselineMissionPathAlphaSweep);
    baselineCoordinateS = toFinite(baselineMission?.warpCoordinateTimeEstimate?.seconds);
    baselineProperS = toFinite(baselineMission?.warpProperTimeEstimate?.seconds);
    baselineProperMinusS = toFinite(
      baselineMission?.comparisonMetrics?.properMinusCoordinate_seconds,
    );
  }
  baselineCoordinateS ??= baselineAnchorDefaults.coordinateTimeS;
  baselineProperS ??= baselineAnchorDefaults.properTimeS;
  baselineProperMinusS ??= baselineAnchorDefaults.properMinusCoordinateS;
  if (
    !isFinitePositive(baselineCoordinateS) ||
    !isFinitePositive(baselineProperS) ||
    baselineProperMinusS == null
  ) {
    throw new Error(
      `Baseline clocking anchor unavailable. Include ${baselineProfileId} in current run or provide existing baseline artifacts under ${path.join(
        sweepRoot,
        baselineProfileId,
      )}`,
    );
  }
  const baselineClocking: Nhm2ClockingBaseline = {
    profileId: baselineProfileId,
    centerlineAlpha: baselineAnchorDefaults.centerlineAlpha,
    coordinateTimeS: baselineCoordinateS,
    properTimeS: baselineProperS,
    properMinusCoordinateS: baselineProperMinusS,
  };
  assertBaselineClockingCoherence(baselineClocking);

  for (const row of rows) {
    row.expectedClockingTarget = deriveExpectedClockingTarget(
      baselineClocking,
      row.centerlineAlpha,
    );
    const coordinate = row.coordinateTimeS;
    const proper = row.properTimeS;
    const properMinus = row.properMinusCoordinateS;
    const baselineTolS = Math.max(
      baselineCoordinateAbsTolS,
      Math.abs(baselineCoordinateS) * baselineCoordinateRelTol,
    );
    const coordDeltaS = coordinate == null ? null : coordinate - baselineCoordinateS;
    const coordDeltaRel = coordinate == null ? null : coordDeltaS! / baselineCoordinateS;
    row.coordinateTimeDeltaFromBaselineS = coordDeltaS;
    row.coordinateTimeDeltaFromBaselineRel = coordDeltaRel;
    row.gateDiagnostics.baselineToleranceS = baselineTolS;
    row.gates.baselineInvariance =
      coordinate != null && Math.abs(coordDeltaS ?? Number.POSITIVE_INFINITY) <= baselineTolS
        ? "pass"
        : "fail";

    const ratioMeasured =
      isFinitePositive(coordinate) && isFinitePositive(proper) ? proper / coordinate : null;
    const ratioError = ratioMeasured == null ? null : Math.abs(ratioMeasured - row.centerlineAlpha);
    const expectedProperTimeS = row.expectedClockingTarget?.expectedProperTimeS ?? null;
    const expectedProperTimeErrorS =
      proper == null || expectedProperTimeS == null ? null : Math.abs(proper - expectedProperTimeS);
    const properMinusTarget =
      coordinate == null ? null : (row.centerlineAlpha - 1) * coordinate;
    const properMinusError =
      properMinus == null || properMinusTarget == null
        ? null
        : Math.abs(properMinus - properMinusTarget);
    const expectedProperMinusTarget = row.expectedClockingTarget?.expectedProperMinusCoordinateS ?? null;
    const expectedProperMinusErrorS =
      properMinus == null || expectedProperMinusTarget == null
        ? null
        : Math.abs(properMinus - expectedProperMinusTarget);
    const properMinusTolS = Math.max(
      properMinusAbsTolS,
      Math.abs(properMinusTarget ?? 0) * properMinusRelTol,
    );
    row.gateDiagnostics.ratioError = ratioError;
    row.gateDiagnostics.expectedProperTimeErrorS = expectedProperTimeErrorS;
    row.gateDiagnostics.properMinusErrorS = properMinusError;
    row.gateDiagnostics.properMinusToleranceS = properMinusTolS;
    row.gateDiagnostics.expectedProperMinusErrorS = expectedProperMinusErrorS;
    row.gates.clockingConsistency =
      ratioError != null &&
      ratioError <= clockRatioTol &&
      properMinusError != null &&
      properMinusError <= properMinusTolS
        ? "pass"
        : "fail";

    row.gates.antiSrSafety =
      row.betaOverAlphaMax != null &&
      row.betaOverAlphaMax <= antiSrBetaOverAlphaMaxLimit &&
      row.wallHorizonMargin != null &&
      row.wallHorizonMargin >= antiSrWallHorizonMarginMin
        ? "pass"
        : "fail";

    row.gates.decompositionConsistency =
      row.decompositionResidualS != null &&
      Math.abs(row.decompositionResidualS) <= decompositionResidualToleranceS &&
      row.lapseTrackedFraction != null &&
      row.lapseTrackedFraction >= lapseTrackedFractionMin
        ? "pass"
        : "fail";

    row.gates.invariantGate = row.invariantGateStatus === "pass" ? "pass" : "fail";
    row.gates.fullLoopAudit =
      runFullLoop && row.fullLoopStateNormalized === "pass" ? "pass" : "fail";
    row.gates.evidenceLedger =
      runFullLoop && row.gateDiagnostics.evidenceBlocking === false ? "pass" : "fail";
    row.gates.promotionEligible =
      row.gates.baselineInvariance === "pass" &&
      row.gates.clockingConsistency === "pass" &&
      row.gates.antiSrSafety === "pass" &&
      row.gates.decompositionConsistency === "pass" &&
      row.gates.invariantGate === "pass" &&
      row.gates.fullLoopAudit === "pass" &&
      row.gates.evidenceLedger === "pass"
        ? "pass"
        : "fail";

    if (!runFullLoop) {
      row.gateDiagnostics.evidenceLedgerReason = "full_loop_unavailable";
      row.overallState = "pending_no_full_loop";
    } else if (row.gates.promotionEligible !== "pass") {
      row.overallState = "fail";
    } else if (
      (config.claimLanguagePolicy?.exploratoryBracketCannotAutoPromote ?? true) &&
      row.bracket === "exploratory" &&
      !allowExploratoryPromotion
    ) {
      row.overallState = "pending_exploratory";
    } else {
      row.overallState = "pass";
    }
    row.progressionClass = classifySweepRow({
      gates: row.gates,
      bracket: row.bracket,
      exploratoryBracketCannotAutoPromote:
        config.claimLanguagePolicy?.exploratoryBracketCannotAutoPromote !== false,
      allowExploratoryPromotion,
    });
    const claimClass = classifySweepClaimClass({
      overallState: row.overallState,
      progressionClass: row.progressionClass,
      runFullLoop,
    });
    row.claimClass = claimClass.claimClass;
    row.claimClassNote = claimClass.claimClassNote;
    row.runHealth = deriveRunHealth(row);
    row.clockingTargetState = row.overallState === "pass" ? "expected_and_validated" : "expected_not_validated";
    row.validationState =
      row.runtimeBlockingReason != null
        ? "runtime_blocked"
        : row.overallState === "pass"
          ? "evidence_viable"
          : row.overallState === "pending_no_full_loop" ||
              row.overallState === "pending_exploratory"
            ? "planned"
            : "gate_failed";
  }

  const claims: SweepClaimLedgerClaim[] = [];
  const configCitationIds = effectiveCitations.map((entry) => entry.id);
  const requiredPapersByClaimClass = citationRegistry.claimClassRequiredPaperIds;
  const resolveClaimClassPaperIds = (
    claimClass: SweepRow["claimClass"],
  ): string[] => {
    if (claimClass === "literature_only_nonproof") return requiredPapersByClaimClass.literature_context;
    if (claimClass === "repo_plus_literature") {
      return requiredPapersByClaimClass.extrapolation_candidate;
    }
    if (claimClass === "not_validated") return requiredPapersByClaimClass.not_validated;
    return [];
  };
  const policyClaimPaperIds =
    citationRegistry.policyClaimPaperIds && citationRegistry.policyClaimPaperIds.length > 0
      ? citationRegistry.policyClaimPaperIds
      : registryPaperIds;
  const repoSourceId = "casimirbot_repo_local_runtime";
  claims.push({
    claimId: "claim_nhm2_alpha_sweep_gate_stack",
    claimText:
      "NHM2 alpha sweep rows are promoted only when baseline invariance, clocking consistency, anti-SR safety, decomposition consistency, invariant gate, and full-loop audit all pass.",
    status: "derived",
    supportTier: "repo_plus_literature",
    artifactPaths: [
      "scripts/research/run-nhm2-lapse-alpha-sweep.ts",
      "configs/research/nhm2-lapse-alpha-sweep.json",
    ],
    sourceIds: [...policyClaimPaperIds, repoSourceId],
    uncertaintyNote:
      "Policy claim is derived and bounded by current repository implementation and citation policy.",
    uncertaintyRationale:
      "Promotion policy synthesis depends on current gate stack definitions and citation mappings.",
    scopeBoundary:
      "This policy claim does not by itself certify any single alpha profile result.",
  });

  for (const row of rows) {
    if (row.overallState === "pass") {
      claims.push({
        claimId: `claim_${row.profileId}_gate_pass`,
        claimText:
          `Profile ${row.profileId} passes configured NHM2 alpha sweep promotion gates under bounded-lapse interpretation.`,
        status: "measured",
        supportTier: "repo_measured",
        profileId: row.profileId,
        artifactPaths: [path.join(row.sourceDir, "nhm2-full-loop-audit-latest.json")],
        sourceIds: [repoSourceId],
        uncertaintyRationale:
          "Measured promotion status is conditional on current full-loop and evidence-ledger outputs.",
        scopeBoundary:
          "A pass row does not widen claims outside the configured bounded-lapse NHM2 workflow.",
      });
    } else {
      const requiredPaperIds = resolveClaimClassPaperIds(row.claimClass);
      if (requiredPaperIds.length <= 0) {
        throw new Error(`Missing required paper citation mapping for claimClass ${row.claimClass}`);
      }
      const literatureContextOnly =
        !runFullLoop || row.overallState === "pending_no_full_loop";
      const supportTier: ClaimSupportTier = literatureContextOnly
        ? "literature_only_nonproof"
        : "repo_plus_literature";
      claims.push({
        claimId: `claim_${row.profileId}_diagnostic_or_failed`,
        claimText:
          `Profile ${row.profileId} remains diagnostic or failed under current NHM2 promotion policy and must not be treated as validated reduced-order transport.`,
        status: "hypothesis",
        supportTier,
        profileId: row.profileId,
        artifactPaths: [path.join(row.sourceDir, "nhm2-shift-lapse-transport-result-latest.json")],
        sourceIds: literatureContextOnly ? [...requiredPaperIds] : [repoSourceId, ...requiredPaperIds],
        literatureContextOnly,
        uncertaintyNote:
          "This row is not gate-promoted; interpretation is bounded by current evidence and may change with updated solves or policy.",
        uncertaintyRationale:
          "Non-promoted rows remain sensitive to unresolved gate failures and evidence-ledger blockers.",
        scopeBoundary:
          "This claim cannot be treated as validated transport performance until promotion gates and evidence checks pass.",
        allowedClaim:
          "This profile is a diagnostic/literature-context result bounded by current NHM2 gates and evidence policy.",
        cannotClaim: [
          "experimental validation",
          "engineering feasibility",
          "theorem-level proof",
          "promoted reduced-order transport",
        ],
      });
    }
  }

  validateClaimsLedger({
    claims,
    knownSourceIds: [...configCitationIds, repoSourceId],
    paperSourceIds: registryPaperIds,
    repoSourceIds: [repoSourceId],
    paperMetadataById: registryPaperMetadataById,
    measuredOrDerivedRequiresCitation:
      config.claimLanguagePolicy?.measuredOrDerivedRequiresCitation !== false,
    hypothesisRequiresUncertaintyNote:
      config.claimLanguagePolicy?.hypothesisRequiresUncertaintyNote !== false,
  });
  for (const claim of claims) {
    claim.supportTier = deriveClaimSupportTier({
      sourceIds: claim.sourceIds,
      repoSourceIds: [repoSourceId],
      paperSourceIds: registryPaperIds,
    });
  }
  const claimByProfileId = new Map(
    claims
      .filter((claim) => typeof claim.profileId === "string" && claim.profileId.length > 0)
      .map((claim) => [claim.profileId as string, claim] as const),
  );
  for (const row of rows) {
    const claim = claimByProfileId.get(row.profileId);
    row.supportTier = claim?.supportTier ?? "literature_only_nonproof";
    row.literatureContextOnly = claim?.literatureContextOnly === true;
    if (row.overallState === "pass") {
      row.claimClass = row.supportTier === "repo_plus_literature" ? "repo_plus_literature" : "repo_measured";
    } else if (row.literatureContextOnly || row.supportTier === "literature_only_nonproof") {
      row.claimClass = "literature_only_nonproof";
    } else {
      row.claimClass = "not_validated";
    }
    const blockers = [
      ...Object.entries(row.gates)
        .filter(([key, value]) => key !== "promotionEligible" && value !== "pass")
        .map(([key]) => key),
      ...(row.stageDetailFreshness?.staleReasonCodes ?? []),
    ];
    const freshnessDecision = row.stageDetailFreshness?.freshnessDecision ?? "stale";
    const category: SweepRow["uncertainty"]["category"] =
      row.claimClass === "repo_measured"
        ? "none"
        : row.claimClass === "literature_only_nonproof"
          ? "literature_context"
          : freshnessDecision === "timeout" || freshnessDecision === "stall"
            ? "runtime_blocker"
            : "evidence_gap";
    row.uncertainty = {
      category,
      blockers,
      nextMeasurement:
        category === "runtime_blocker"
          ? "Inspect heartbeat + full-loop logs, then rerun controlled single-profile loop."
          : "Regenerate full-loop artifacts with fresh source-closure and observer-audit, then rerun profile.",
      note:
        row.claimClass === "repo_measured"
          ? "Measured under current repository full-loop policy."
          : "Literature context is non-proof and cannot replace fresh repository-measured full-loop evidence.",
    };
  }
  const failureSummary = deriveSweepFailureSummary({
    rows,
    sweepName: config.sweepName,
  });
  const ladderProgress = buildLadderProgressSummary({
    allSpecs: config.alphas,
    rows,
  });
  const frontierDistance = buildNhm2FrontierDistanceSummary({
    sweepName: config.sweepName,
    specs: config.alphas,
    rows,
    baseline: baselineClocking,
    ladder: ladderProgress,
  });

  const summary = {
    sweepName: config.sweepName,
    family: config.family,
    clockingMode: config.clockingMode,
    preserveTransportSchedule: config.preserveTransportSchedule,
    currentClaimTier: config.currentClaimTier,
    maximumClaimTier: config.maximumClaimTier,
    generatedAt: new Date().toISOString(),
    sourceConfigPath: configPath,
    sourceConfigChecksum: configChecksum,
    citationRegistryPath: resolvedCitationRegistryPath,
    citationRegistryChecksum: registryChecksum,
    researchLockPath,
    researchLockChecksum,
    citationGateSummary,
    citationPolicy: config.claimLanguagePolicy ?? null,
    expectedClockingModel: {
      model: "tau_expected(alpha)=alpha*coordinate_time",
      baselineAnchor: baselineClocking,
      note:
        "Expected clocking targets are derived from baseline anchor and are not validated outcomes until full-loop gates pass.",
    },
    citations: effectiveCitations,
    firstFailureProfileId: failureSummary.firstFailureProfileId,
    strongestPassingProfileId: failureSummary.strongestPassingProfileId,
    dominantFailureGate: failureSummary.dominantFailureGate,
    ladder: ladderProgress,
    frontierDistance,
    rows,
  };
  const claimPromotionReport: SweepClaimPromotionReport = {
    generatedAt: new Date().toISOString(),
    sweepName: config.sweepName,
    claims: claims
      .filter((claim) => claim.profileId != null)
      .map((claim) => {
        const row = rows.find((entry) => entry.profileId === claim.profileId) ?? null;
        const claimClass = row?.claimClass ?? "not_validated";
        const evidenceLedgerState = row?.gates.evidenceLedger === "pass" ? "pass" : "fail";
        const fullLoopStateRaw = row?.fullLoopStateRaw ?? null;
        const normalizedFullLoopState = row?.fullLoopStateNormalized ?? "fail";
        const evidenceLedgerReason =
          row?.gateDiagnostics.evidenceLedgerReason ?? "full_loop_unavailable";
        const fullLoopAvailability = row?.fullLoopAvailability ?? null;
        const supportTier = claim.supportTier ?? "literature_only_nonproof";
        const blockingReasons: string[] = [];
        if (normalizedFullLoopState !== "pass") {
          blockingReasons.push(`full_loop_state_normalized:${normalizedFullLoopState}`);
          blockingReasons.push(`full_loop_state_raw:${fullLoopStateRaw ?? "null"}`);
        }
        if (fullLoopAvailability) {
          const stageOrder: Array<keyof SweepFullLoopAvailability["stageDetail"]> = [
            "strictSignal",
            "sourceClosure",
            "observerAudit",
            "certificate",
          ];
          for (const stageName of stageOrder) {
            const detail = fullLoopAvailability.stageDetail[stageName];
            if (!detail || detail.available) continue;
            blockingReasons.push(
              `stage_detail_${stageName}:state=${detail.sectionState},parse=${detail.parseStatus},inspectionMissingOrFailed=${detail.inspectionMissingOrFailed ? "1" : "0"}`,
            );
            if (detail.sectionReasonCodes.length > 0) {
              blockingReasons.push(
                `stage_reason_${stageName}:${detail.sectionReasonCodes.join(",")}`,
              );
            }
          }
        }
        if (evidenceLedgerState !== "pass") {
          blockingReasons.push("evidence_ledger_fail");
          blockingReasons.push(`evidence_ledger_reason:${evidenceLedgerReason}`);
        }
        if (row?.gates.promotionEligible !== "pass") blockingReasons.push("promotion_gate_fail");
        const promotionDecision =
          claimClass !== "literature_only_nonproof" &&
          normalizedFullLoopState === "pass" &&
          evidenceLedgerState === "pass" &&
          row?.gates.promotionEligible === "pass"
            ? ("promoted" as const)
            : ("blocked" as const);
        const firstBlockingGate = row ? getFirstBlockingGate(row.gates) : null;
        const firstBlockingReason = getFirstBlockingReason({
          firstBlockingGate,
          row,
        });
        const nextAction =
          getNextActionForRuntimeReason(row?.runtimeBlockingReason ?? null) ??
          getNextActionForBlockingGate(firstBlockingGate);
        if (promotionDecision === "promoted" && supportTier === "literature_only_nonproof") {
          throw new Error(
            `promotion_policy_violation:${claim.claimId}:promoted_claim_requires_repo_or_repo_plus_literature_support`,
          );
        }
        return {
          claimId: claim.claimId,
          profileId: row?.profileId ?? claim.profileId ?? null,
          claimClass,
          fullLoopStateRaw,
          normalizedFullLoopState,
          evidenceLedgerState,
          evidenceLedgerReason,
          fullLoopAvailability,
          supportTier,
          promotionDecision,
          firstBlockingGate,
          firstBlockingReason,
          nextAction,
          blockingReasons,
        };
      }),
  };

  const summaryPath = path.join(sweepRoot, "nhm2-lapse-alpha-sweep-latest.json");
  writeJsonAtomic(summaryPath, summary);
  const frontierDistancePath = path.join(sweepRoot, "nhm2-frontier-distance-latest.json");
  writeJsonAtomic(frontierDistancePath, frontierDistance);
  const claimsWithUncertainty = claims.map((claim) => {
    const row = claim.profileId
      ? rows.find((entry) => entry.profileId === claim.profileId) ?? null
      : null;
    const isNonMeasuredProfileClaim =
      claim.profileId != null && claim.status !== "measured";
    const evidenceSufficiency = deriveEvidenceSufficiency({
      claim,
      paperMetadataById: registryPaperMetadataById,
      repoSourceIds: [repoSourceId],
    });
    const researchConfidenceTier = deriveResearchConfidenceTier({
      claim,
      evidenceSufficiency,
    });
    assertClaimEvidenceSufficiency({
      claim,
      evidenceSufficiency,
      researchConfidenceTier,
    });
    return {
      ...claim,
      evidenceSufficiency,
      researchConfidenceTier,
      uncertainty: isNonMeasuredProfileClaim
        ? {
            category: row?.uncertainty.category ?? "evidence_gap",
            blockers: row?.uncertainty.blockers ?? [],
            nextMeasurement:
              row?.uncertainty.nextMeasurement ??
              "Regenerate fresh full-loop artifacts and rerun controlled single-profile loop.",
            researchContextIsNonProof: true,
          }
        : undefined,
    };
  });
  const claimsPath = path.join(sweepRoot, "nhm2-lapse-alpha-sweep-claims-latest.json");
  writeJsonAtomic(claimsPath, {
    sweepName: config.sweepName,
    generatedAt: new Date().toISOString(),
    sourceConfigPath: configPath,
    sourceConfigChecksum: configChecksum,
    citationRegistryPath: resolvedCitationRegistryPath,
    citationRegistryChecksum: registryChecksum,
    researchLockPath,
    researchLockChecksum,
    citationGateSummary,
    sources: [
      ...effectiveCitations,
      {
        id: repoSourceId,
        type: "github_clone",
        title: "CasimirBot local runtime repository",
        repoUrl: "local-workspace",
        commitSha: gitSha,
        clonePath: repoRoot,
      },
    ],
    claims: claimsWithUncertainty,
  });
  const failuresPath = path.join(sweepRoot, "nhm2-lapse-alpha-sweep-failures-latest.json");
  writeJsonAtomic(failuresPath, failureSummary);
  const promotionReportPath = path.join(sweepRoot, "nhm2-claim-promotion-report-latest.json");
  writeJsonAtomic(promotionReportPath, claimPromotionReport);
  const blockerTrendPath = path.join(sweepRoot, "nhm2-blocker-trend-latest.json");
  const previousTrend =
    readJsonMaybe<{
      history: Array<{
        generatedAt: string;
        profileId: string;
        firstBlockingGate: string | null;
        firstBlockingReason: string | null;
      }>;
    }>(blockerTrendPath) ?? { history: [] };
  const latestByProfile = new Map(
    previousTrend.history.map((entry) => [entry.profileId, entry] as const),
  );
  const currentEntries = claimPromotionReport.claims
    .filter((entry) => entry.profileId != null)
    .map((entry) => {
      const profileId = String(entry.profileId);
      const previous = latestByProfile.get(profileId);
      const blockerClassChanged =
        (previous?.firstBlockingGate ?? null) !== (entry.firstBlockingGate ?? null);
      return {
        generatedAt: new Date().toISOString(),
        profileId,
        firstBlockingGate: entry.firstBlockingGate,
        firstBlockingReason: entry.firstBlockingReason,
        blockerClassChanged,
      };
    });
  const trend = {
    sweepName: config.sweepName,
    generatedAt: new Date().toISOString(),
    history: [...previousTrend.history, ...currentEntries].slice(-500),
    latest: currentEntries,
  };
  writeJsonAtomic(blockerTrendPath, trend);
  const statusMemoPath = path.join(
    repoRoot,
    "docs",
    "research",
    "nhm2-lapse-alpha-sweep-status-latest.md",
  );
  const frontierReportPath = path.join(
    repoRoot,
    "docs",
    "research",
    "nhm2-frontier-distance-report.md",
  );
  const rowLines = rows
    .map(
      (row) =>
        `| ${row.profileId} | ${row.centerlineAlpha} | ${row.overallState} | ${row.runHealth ?? "pending"} | ${row.progressionClass} | ${row.claimClass} | ${row.supportTier} | ${row.uncertainty.category} | ${row.gates.promotionEligible} | ${row.gates.baselineInvariance} | ${row.gates.clockingConsistency} | ${row.gates.antiSrSafety} | ${row.gates.decompositionConsistency} | ${row.gates.invariantGate} | ${row.fullLoopStateRaw ?? "null"} | ${row.fullLoopStateNormalized} | ${row.gates.fullLoopAudit} | ${row.gates.evidenceLedger} | ${row.gateDiagnostics.evidenceLedgerReason} | ${
          row.stageDetailFreshness == null
            ? "n/a"
            : `${row.stageDetailFreshness.freshnessDecision}:${row.stageDetailFreshness.staleReasonCodes.join(",")}`
        } |`,
    )
    .join("\n");
  const citationLines = effectiveCitations
    .map((citation) => `- ${citation.id}: ${citation.title}${citation.url ? ` (${citation.url})` : ""}`)
    .join("\n");
  const templateLines = [
    "- repo_measured: `This profile is observed in this repository under the current NHM2 full-loop gates.`",
    "- repo_plus_literature: `This profile has repository evidence plus literature context, but remains non-promoted unless all promotion gates pass.`",
    "- literature_only_nonproof: `This profile is literature-context only and cannot be promoted as repository-measured evidence.`",
    "- not_validated: `This profile did not pass the NHM2 full-loop promotion stack and remains diagnostic only.`",
  ].join("\n");
  const literatureByProfile = new Map<string, string[]>();
  const citationMetaById = new Map(effectiveCitations.map((entry) => [entry.id, entry] as const));
  for (const row of rows) {
    const claim = claimByProfileId.get(row.profileId);
    const refs =
      claim?.sourceIds.filter((sourceId) => sourceId !== repoSourceId) ?? [];
    literatureByProfile.set(row.profileId, refs);
  }
  const researchBackingLines = rows
    .map((row) => {
      const refs = literatureByProfile.get(row.profileId) ?? [];
      const resolved = refs.map((id) => {
        const meta = citationMetaById.get(id);
        if (!meta) return id;
        const paperMeta = registryPaperMetadataById[id];
        const role = paperMeta?.evidenceRole ?? "unknown_role";
        return `${id} [${role}] (${meta.url ?? "no-url"})`;
      });
      return `- ${row.profileId}: ${resolved.join(", ") || "none"}`;
    })
    .join("\n");
  const claimLanguageLines = rows.map((row) => {
    const base = resolveClaimLanguageLine(row);
    if (row.claimClass === "repo_measured") return `- ${base}`;
    const refs = literatureByProfile.get(row.profileId) ?? [];
    return `- ${base} Literature refs: ${refs.join(", ") || "none"}.`;
  });
  enforceClaimLanguagePolicy(rows, claimLanguageLines, literatureByProfile);
  const boundaryStatementLines = rows
    .filter((row) => row.claimClass !== "repo_measured")
    .map((row) => {
      const claim = claimByProfileId.get(row.profileId);
      const refs = literatureByProfile.get(row.profileId) ?? [];
      return `- ${row.profileId}: allowed=${claim?.allowedClaim ?? "missing"}; unsupported=${(claim?.cannotClaim ?? []).join(", ") || "missing"}; citations=${refs.join(", ") || "none"}`;
    })
    .join("\n");
  const promotionByClaimId = new Map(
    claimPromotionReport.claims.map((entry) => [entry.claimId, entry] as const),
  );
  const whyBlockedLines = rows
    .map((row) => {
      const claimId =
        row.overallState === "pass"
          ? `claim_${row.profileId}_gate_pass`
          : `claim_${row.profileId}_diagnostic_or_failed`;
      const promotion = promotionByClaimId.get(claimId);
      const topReason = promotion?.blockingReasons?.[0] ?? "none";
      const firstBlockingGate = promotion?.firstBlockingGate ?? "none";
      const firstBlockingReason = promotion?.firstBlockingReason ?? "none";
      const nextAction = promotion?.nextAction ?? "none";
      const stageOrder: Array<keyof NonNullable<SweepRow["fullLoopAvailability"]>["stageDetail"]> = [
        "strictSignal",
        "sourceClosure",
        "observerAudit",
        "certificate",
      ];
      const stageParts = (row.fullLoopAvailability?.stageDetail
        ? stageOrder
            .map((stageName) => {
              const detail = row.fullLoopAvailability?.stageDetail[stageName];
              if (!detail || detail.available) return null;
              const reasons = detail.sectionReasonCodes.join(",") || "none";
              return `${stageName}{state=${detail.sectionState},parse=${detail.parseStatus},reasons=${reasons}}`;
            })
            .filter((entry): entry is string => entry != null)
        : []);
      const stageDetail = stageParts.length > 0 ? stageParts.join("; ") : "all_stage_surfaces_available";
      const freshness =
        row.stageDetailFreshness == null
          ? "n/a"
          : `${row.stageDetailFreshness.freshnessDecision}(${row.stageDetailFreshness.staleReasonCodes.join(",")})`;
      return `- ${row.profileId}: health=${row.runHealth ?? "pending"}, raw=${row.fullLoopStateRaw ?? "null"}, normalized=${row.fullLoopStateNormalized}, evidence=${row.gateDiagnostics.evidenceLedgerReason}, firstBlockingGate=${firstBlockingGate}, firstBlockingReason=${firstBlockingReason}, nextAction=${nextAction}, stageDetail=${stageDetail}, freshness=${freshness}, topReason=${topReason}`;
    })
    .join("\n");
  const uncertaintyLines = rows
    .filter((row) => row.claimClass !== "repo_measured")
    .map((row) => {
      const refs = literatureByProfile.get(row.profileId) ?? [];
      const resolvedRefs = refs.map((id) => {
        const meta = citationMetaById.get(id);
        return `${id}${meta?.url ? ` (${meta.url})` : ""}`;
      });
      return `- ${row.profileId}: category=${row.uncertainty.category}, blockers=${row.uncertainty.blockers.join(",") || "none"}, nextMeasurement=${row.uncertainty.nextMeasurement}. Literature references provide theoretical context only; this is not experimental validation of this profile. Note: ${row.uncertainty.note} Paper refs: ${resolvedRefs.join(", ") || "none"}.`;
    })
    .join("\n");
  const frontierDistanceLines = frontierDistance.rows
    .map(
      (row) =>
        `| ${row.profileId} | ${row.centerlineAlpha} | ${row.ladderGroup} | ${row.validationState} | ${row.expectedSavedDays.toFixed(3)} | ${row.expectedSubjectiveEfficiency.toFixed(6)} | ${row.distanceFromAnchor.expectedAdditionalSavedDaysVsAnchor.toFixed(3)} | ${row.blocker.blockerClass ?? "none"} | ${row.blocker.blockerStage ?? "none"} | ${row.blocker.nextAction ?? "none"} |`,
    )
    .join("\n");
  const frontierReport = `# NHM2 Frontier Distance From 0p995

- generatedAt: ${new Date().toISOString()}
- anchorProfileId: ${baselineClocking.profileId}
- anchorAlpha: ${baselineClocking.centerlineAlpha}
- coordinateTimeS: ${baselineClocking.coordinateTimeS}
- frontierDistanceJson: ${frontierDistancePath}
- sweepSummaryJson: ${summaryPath}

## Claim Boundary
The 0p995 profile remains the confirmed full-pass anchor unless a newer full-loop artifact proves otherwise.
Lower-alpha rows are expected clocking targets until their own NHM2 full-loop artifacts pass.
The current strategy is to revalidate outward from 0p995, locate the lowest full-pass alpha, then bisect toward 0p7000.

## Research Context
- ADM / 3+1 lapse-shift formalism provides formalism context only: https://arxiv.org/abs/gr-qc/0405109 and https://arxiv.org/abs/gr-qc/0703035.
- Alcubierre and Natario provide warp metric context only: https://arxiv.org/abs/gr-qc/0009013 and https://arxiv.org/abs/gr-qc/0110086.
- Quantum inequality and energy-condition papers provide limitation and uncertainty language only: https://arxiv.org/abs/gr-qc/9702026 and https://arxiv.org/abs/2105.03079.
- NHM2 repository artifacts are required for project-specific pass, validated, frontier, and full-loop claims.

## Frontier Distance Table
| profileId | alpha | ladderGroup | validationState | expectedSavedDays | expectedSubjectiveEfficiency | additionalSavedDaysVs0p995 | blockerClass | blockerStage | nextAction |
|---|---:|---|---|---:|---:|---:|---|---|---|
${frontierDistanceLines}

## Interpretation
- A row with \`validationState=evidence_viable\` has earned repository-measured evidence under the current full-loop gates.
- A row with \`validationState=runtime_blocked\` has not reached the evidence question yet.
- A row with \`validationState=planned\` or \`skipped_after_blocker\` remains an expected target only.
- Literature references constrain wording and uncertainty; they do not validate an NHM2 profile.
`;
  fs.writeFileSync(frontierReportPath, `${frontierReport}\n`);
  const memo = `# NHM2 Lapse Alpha Sweep Status

- generatedAt: ${new Date().toISOString()}
- sweepName: ${config.sweepName}
- firstFailureProfileId: ${failureSummary.firstFailureProfileId ?? "null"}
- strongestPassingProfileId: ${failureSummary.strongestPassingProfileId ?? "null"}
- dominantFailureGate: ${failureSummary.dominantFailureGate ?? "null"}
- summaryJson: ${summaryPath}
- frontierDistanceJson: ${frontierDistancePath}
- frontierDistanceReport: ${frontierReportPath}
- failuresJson: ${failuresPath}
- claimsJson: ${claimsPath}
- claimPromotionReportJson: ${promotionReportPath}

## Gate Table
| profileId | alpha | overallState | runHealth | progressionClass | claimClass | supportTier | uncertaintyCategory | promotionEligible | baselineInvariance | clockingConsistency | antiSrSafety | decompositionConsistency | invariantGate | fullLoopStateRaw | fullLoopStateNormalized | fullLoopAudit | evidenceLedger | evidenceLedgerReason | stageDetailFreshness |
|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${rowLines}

## Claim-Safety Templates
${templateLines}

## Citations
${citationLines}

## Research Backing (Non-Proof)
${researchBackingLines}

## Research Limits
- These papers provide theory and constraint context; they are not experimental validation of the NHM2 profile outputs.
- Promotion remains repository-measured and gate-passing dependent.
- Per-profile citation roles are listed above in \`Research Backing (Non-Proof)\`.

## Claim Language By Profile
${claimLanguageLines.join("\n")}

## Research-Backed Boundary Statements
${boundaryStatementLines || "- none"}

## Why Blocked Now
${whyBlockedLines}

## Operator Playbook
- If runHealth is \`failed_stall\`: inspect heartbeat and solver logs, then adjust \`NHM2_STALL_MAX_NO_PROGRESS_S\` / \`NHM2_STALL_MIN_HEARTBEATS\` only after confirming real progress is absent.
- If runHealth is \`failed_timeout\`: raise \`NHM2_FULL_LOOP_TIMEOUT_S\` only when heartbeat \`lastProgressAt\` keeps advancing.
- If runHealth is \`healthy_fresh\` but promotion is blocked: treat as physics/gate blocker (not runtime blocker) and remediate by firstBlockingGate.

## Citation-Backed Uncertainty
${uncertaintyLines || "- none"}

## Uncertainty Boundary
- Literature citations are interpretive context and do not replace repository-measured full-loop evidence.
- Experimental profiles in exploratory bracket remain diagnostic unless explicit override is provided and full gate stack remains passing.
`;
  fs.writeFileSync(statusMemoPath, `${memo}\n`);
  process.stdout.write(`${summaryPath}\n`);
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
  runNhm2LapseAlphaSweep().catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exit(1);
  });
}
