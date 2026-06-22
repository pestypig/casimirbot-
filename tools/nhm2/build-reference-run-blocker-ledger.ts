import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2BlockerLedgerArtifact,
  isNhm2BlockerLedgerArtifact,
  type Nhm2BlockerClass,
  type Nhm2BlockerLedgerArtifact,
  type Nhm2DivergenceBoundary,
} from "../../shared/contracts/nhm2-blocker-ledger.v1";
import {
  isNhm2CoupledClosurePassCandidateArtifact,
  type Nhm2CoupledClosurePassCandidateArtifactV1,
} from "../../shared/contracts/nhm2-coupled-closure-pass-candidate.v1";
import {
  isNhm2QeiDossierArtifact,
  type Nhm2QeiDossierArtifact,
} from "../../shared/contracts/nhm2-qei-dossier.v1";
import {
  isNhm2QeiWorldlineDossier,
  type Nhm2QeiWorldlineDossierV1,
} from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";
import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import { isNhm2RegionalSourceClosureEvidenceArtifact } from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2SourceSideSameBasisTensorAuthorityArtifact,
  type Nhm2SourceSideSameBasisTensorAuthorityArtifactV1,
  type Nhm2SourceSideSameBasisTensorAuthorityStatus,
} from "../../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import { isNhm2TileEffectiveCounterpartArtifact } from "../../shared/contracts/nhm2-tile-effective-counterpart.v1";
import { isNhm2TileEffectiveFullTensorSourceArtifact } from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";
import {
  isNhm2TileLocalSourceElementsArtifact,
  type Nhm2TileLocalSourceElementsArtifactV1,
} from "../../shared/contracts/nhm2-tile-local-source-element.v1";
import type { Nhm2TileSourceOperatingBudgetCorrectionValueV1 } from "../../shared/contracts/nhm2-tile-source-operating-budget-readiness.v1";
import { isNhm2TileCounterpartConservationArtifact } from "../../shared/contracts/nhm2-tile-counterpart-conservation.v1";
import {
  classifySourceToGeometryDivergence,
} from "./report-source-to-geometry-divergence";
import {
  isNhm2SourceClosurePassReadinessArtifact,
  type Nhm2SourceClosurePassReadinessArtifact,
} from "./source-closure-pass-readiness";
import type {
  Nhm2ReferenceRunValidationArtifact,
  Nhm2ReferenceRunValidationGate,
} from "./validate-reference-run";

type LiteratureClaimMap = {
  schemaVersion: "nhm2_literature_claim_map/v1";
  claimPolicy: {
    externalTheoryDoesNotValidateNHM2: boolean;
    webOrPaperCitationRequiredForExternalTheoryClaims: boolean;
    noPredictiveLanguageFromExperimentalMathOnly: boolean;
  };
  sources: Array<{
    sourceId: string;
    claimSupport: string[];
    nonSupport: string[];
  }>;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const isCorrectionValue = (
  value: unknown,
): value is Nhm2TileSourceOperatingBudgetCorrectionValueV1 =>
  value === null ||
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value)) ||
  (Array.isArray(value) && value.every((entry) => typeof entry === "string"));

const correctionRecord = (
  value: unknown,
): Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> => {
  const record = asRecord(value) ? value : {};
  return Object.fromEntries(
    Object.entries(record).filter(([, entry]) => isCorrectionValue(entry)),
  ) as Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
};

const coupledClosureRequiredCorrections = (
  artifact: Nhm2CoupledClosurePassCandidateArtifactV1 | null,
): Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> => {
  if (artifact == null) return {};
  const corrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> = {};
  for (const gate of artifact.gates.filter((entry) => entry.status !== "pass")) {
    for (const [key, value] of Object.entries(correctionRecord(gate.requiredCorrections))) {
      corrections[`${gate.gateId}.${key}`] = value;
    }
  }
  return corrections;
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8")) as unknown;

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const parseArgs = (argv: string[]): Record<string, string | boolean> => {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
};

const isValidationArtifact = (
  value: unknown,
): value is Nhm2ReferenceRunValidationArtifact => {
  const record = asRecord(value);
  return (
    record != null &&
    record.artifactId === "nhm2_reference_run_validation" &&
    record.schemaVersion === "nhm2_reference_run_validation/v1" &&
    typeof record.runId === "string" &&
    (record.overallState === "pass" ||
      record.overallState === "review" ||
      record.overallState === "fail") &&
    Array.isArray(record.gates) &&
    record.validationClaimAllowed === false
  );
};

const isLiteratureClaimMap = (value: unknown): value is LiteratureClaimMap => {
  const record = asRecord(value);
  const policy = asRecord(record?.claimPolicy);
  return (
    record != null &&
    record.schemaVersion === "nhm2_literature_claim_map/v1" &&
    policy?.externalTheoryDoesNotValidateNHM2 === true &&
    policy?.webOrPaperCitationRequiredForExternalTheoryClaims === true &&
    policy?.noPredictiveLanguageFromExperimentalMathOnly === true &&
    Array.isArray(record.sources) &&
    record.sources.every((source) => {
      const item = asRecord(source);
      return (
        item != null &&
        typeof item.sourceId === "string" &&
        Array.isArray(item.claimSupport) &&
        Array.isArray(item.nonSupport) &&
        item.claimSupport.length > 0 &&
        item.nonSupport.length > 0
      );
    })
  );
};

const classifyGate = (gateId: string): Nhm2BlockerClass => {
  const id = gateId.toLowerCase();
  if (id.includes("claim")) return "claim_lock";
  if (id.includes("latest") || id.includes("profile")) return "provenance";
  if (id.includes("observer")) return "observer";
  if (id.includes("qei")) return "qei";
  if (id.includes("source_side_same_basis")) return "tile_counterpart";
  if (id.includes("tile_counterpart") || id.includes("tile_effective")) return "tile_counterpart";
  if (id.includes("source_closure") || id.includes("regional")) return "source_closure";
  if (id.includes("tensor")) return "tensor_authority";
  if (id.includes("reproducibility")) return "reproducibility";
  if (id.includes("certificate")) return "certificate_policy";
  if (id.includes("literature")) return "literature_boundary";
  return "unknown";
};

const nextEvidence = (boundary: Nhm2DivergenceBoundary): string => {
  switch (boundary) {
    case "counterpart_missing":
      return "emit non-proxy same-basis tile_effective_counterpart tensors for every controlled region";
    case "basis_mismatch":
      return "regenerate metric and tile tensors with matching chart, units, aggregation, and normalization";
    case "profile_mismatch":
      return "regenerate artifacts from the frozen selected profile";
    case "tensor_authority_insufficient":
      return "emit full tensor evidence or explicit symmetric full-tensor authority";
    case "residual_exceeded":
      return "inspect the dominant regional residual after counterpart/provenance gates are clean";
    case "qei_unlinked":
      return "link a pass-level QEI dossier with declared state, worldlines, and sampling assumptions";
    case "conservation_unknown":
      return "emit pass-level conservation diagnostics for the tile-effective source";
    case "none":
      return "no source-to-geometry evidence required for this region";
  }
};

const normalizeBoundary = (
  value: ReturnType<typeof classifySourceToGeometryDivergence>,
): Nhm2DivergenceBoundary => {
  if (value === "metric_echo") return "counterpart_missing";
  if (value === "qei_or_provenance_missing") return "qei_unlinked";
  if (value === "conservation_missing_or_fail") return "conservation_unknown";
  return value;
};

type QeiLedgerArtifact = Nhm2QeiDossierArtifact | Nhm2QeiWorldlineDossierV1;

const missingLegacyQeiFields = (qei: Nhm2QeiDossierArtifact): string[] => {
  const missing: string[] = [];
  if (qei.quantumStateAssumptions.length === 0) missing.push("quantumStateAssumptions");
  if (qei.renormalizationConvention == null) missing.push("renormalizationConvention");
  if (qei.cavityBoundaryModel == null) missing.push("cavityBoundaryModel");
  if (qei.samplingWorldlines.length === 0) missing.push("samplingWorldlines");
  if (qei.worstWorldlineId == null) missing.push("worstWorldlineId");
  if (qei.dutyCyclePass !== true) missing.push("dutyCyclePass");
  if (qei.lightCrossingConsistencyStatus !== "pass") {
    missing.push("lightCrossingConsistencyStatus");
  }
  if (qei.cycleAverageClosureStatus !== "pass") {
    missing.push("cycleAverageClosureStatus");
  }
  if (qei.literatureRefs.length === 0) missing.push("literatureRefs");
  return missing;
};

const worldlineQeiBlockerFields = (qei: Nhm2QeiWorldlineDossierV1): string[] => {
  const missing: string[] = [];
  if (!qei.summary.hasWallWorldline) missing.push("wallWorldline");
  if (!qei.summary.dossierComplete) missing.push("dossierComplete");
  if (qei.summary.allMarginsPass == null) missing.push("allMarginsPass");
  if (qei.summary.allMarginsPass === false) missing.push("qeiMarginPass");
  if (qei.summary.anyProxy) missing.push("proxyEvidence");
  for (const worldline of qei.worldlines) {
    const prefix = worldline.worldlineId;
    if (worldline.samplingFunction.tauSeconds == null) {
      missing.push(`${prefix}.samplingFunction.tauSeconds`);
    }
    if (!worldline.samplingFunction.normalized) {
      missing.push(`${prefix}.samplingFunction.normalized`);
    }
    if (worldline.sampledRho.status !== "computed") {
      missing.push(`${prefix}.sampledRho.${worldline.sampledRho.status}`);
    }
    if (worldline.sampledRho.valueSI == null) {
      missing.push(`${prefix}.sampledRho.valueSI`);
    }
    if (worldline.sampledRho.provenanceRef == null) {
      missing.push(`${prefix}.sampledRho.provenanceRef`);
    }
    if (worldline.bound.status === "missing") {
      missing.push(`${prefix}.bound.missing`);
    }
    if (worldline.bound.status === "proxy") {
      missing.push(`${prefix}.bound.proxy`);
    }
    if (worldline.bound.valueSI == null) {
      missing.push(`${prefix}.bound.valueSI`);
    }
    if (worldline.bound.provenanceRef == null) {
      missing.push(`${prefix}.bound.provenanceRef`);
    }
    if (worldline.margin.pass !== true) {
      missing.push(
        worldline.margin.pass === false
          ? `${prefix}.margin.fail`
          : `${prefix}.margin.status`,
      );
    }
    if (worldline.consistency.tauVsDuty !== "pass") {
      missing.push(`${prefix}.tauVsDuty.${worldline.consistency.tauVsDuty}`);
    }
    if (worldline.consistency.tauVsLightCrossing !== "pass") {
      missing.push(
        `${prefix}.tauVsLightCrossing.${worldline.consistency.tauVsLightCrossing}`,
      );
    }
    if (worldline.consistency.tauVsModulation !== "pass") {
      missing.push(`${prefix}.tauVsModulation.${worldline.consistency.tauVsModulation}`);
    }
    for (const blocker of worldline.blockers) {
      missing.push(`${prefix}:${blocker}`);
    }
  }
  return Array.from(new Set(missing));
};

const missingQeiFields = (qei: QeiLedgerArtifact | null): string[] => {
  if (qei == null) return ["qei_dossier_missing"];
  if (isNhm2QeiWorldlineDossier(qei)) return worldlineQeiBlockerFields(qei);
  return missingLegacyQeiFields(qei);
};

const qeiLedgerStatus = (
  qei: QeiLedgerArtifact | null,
): Nhm2BlockerLedgerArtifact["qeiBlockers"]["status"] => {
  if (qei == null) return "missing";
  if (isNhm2QeiWorldlineDossier(qei)) {
    if (
      qei.summary.dossierComplete &&
      qei.summary.hasWallWorldline &&
      qei.summary.allMarginsPass === true &&
      !qei.summary.anyProxy
    ) {
      return "pass";
    }
    if (
      qei.summary.allMarginsPass === false ||
      qei.worldlines.some((worldline) => worldline.margin.pass === false)
    ) {
      return "fail";
    }
    return "review";
  }
  return qei.status;
};

const qeiLedgerApplicability = (
  qei: QeiLedgerArtifact | null,
): Nhm2BlockerLedgerArtifact["qeiBlockers"]["qeiApplicabilityStatus"] => {
  if (qei == null) return null;
  if (isNhm2QeiWorldlineDossier(qei)) {
    if (
      qei.summary.dossierComplete &&
      qei.summary.hasWallWorldline &&
      qei.summary.allMarginsPass === true &&
      !qei.summary.anyProxy
    ) {
      return "PASS";
    }
    if (
      qei.summary.allMarginsPass === false ||
      qei.worldlines.some((worldline) => worldline.margin.pass === false)
    ) {
      return "FAIL";
    }
    return "REVIEW";
  }
  return qei.qeiApplicabilityStatus;
};

const getNested = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>((cursor, part) => asRecord(cursor)?.[part], value);

const reproducibilitySummary = (
  fullLoopAudit: Record<string, unknown> | null,
): Nhm2BlockerLedgerArtifact["reproducibilityBlockers"] => {
  const section = asRecord(
    getNested(fullLoopAudit, ["sections", "uncertainty_perturbation_reproducibility"]),
  );
  const required = [
    "meshConvergenceOrder",
    "boundaryConditionSensitivity",
    "smoothingKernelSensitivity",
    "independentReproductionStatus",
    "artifactHashConsistencyStatus",
  ];
  const missingFields = required.filter((field) => section?.[field] == null);
  const status =
    section == null
      ? "unknown"
      : missingFields.length > 0
        ? "review"
        : asString(section.independentReproductionStatus) === "fail" ||
            asString(section.artifactHashConsistencyStatus) === "mismatch"
          ? "fail"
          : "pass";
  return { status, missingFields };
};

const certificateSummary = (
  fullLoopAudit: Record<string, unknown> | null,
  validation: Nhm2ReferenceRunValidationArtifact,
): Nhm2BlockerLedgerArtifact["certificatePolicy"] => {
  const certificate = asRecord(getNested(fullLoopAudit, ["sections", "certificate_policy_result"]));
  const certificateStatus =
    asString(certificate?.state) ??
    asString(certificate?.status) ??
    asString(certificate?.color) ??
    null;
  const certificateIntegrity =
    asString(certificate?.integrity) ??
    (typeof certificate?.integrityOk === "boolean" ? String(certificate.integrityOk) : null);
  const green = certificateStatus != null && /pass|green|admissible/i.test(certificateStatus);
  const nonPass = validation.overallState !== "pass";
  return {
    certificateStatus,
    certificateIntegrity,
    greenButNonPromotional: green && nonPass,
    reason:
      green && nonPass
        ? "certificate green is non-promotional because reference validation remains non-pass"
        : null,
  };
};

const observerSummary = (
  validation: Nhm2ReferenceRunValidationArtifact,
): Nhm2BlockerLedgerArtifact["observerBlockers"] => {
  const gate = validation.gates.find(
    (entry) => entry.gateId === "GATE_OBSERVER_ARTIFACT_CONSISTENCY",
  );
  return {
    summaryVsDetailedStatus: gate?.state ?? "unknown",
    reasonCodes: gate?.reasonCodes ?? [],
  };
};

const sourceAuthorityStatus = (
  artifact: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null,
): Nhm2SourceSideSameBasisTensorAuthorityStatus | "missing" => {
  if (artifact == null) return "missing";
  if (artifact.summary.anyMetricEcho) return "metric_echo_forbidden";
  if (
    artifact.summary.hasWallAuthority &&
    artifact.summary.allRequiredRegionsAuthoritative
  ) {
    return "authoritative_same_basis";
  }
  if (artifact.summary.anyMissingCounterpart) return "counterpart_missing";
  if (artifact.summary.anyProxy) return "proxy_limited";
  if (artifact.summary.blockerCount > 0) return "blocked";
  return "diagnostic_only";
};

const sourceAuthorityGate = (
  artifact: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null,
): Nhm2BlockerLedgerArtifact["gateSummary"][number] => {
  const reasonCodes: string[] = [];
  if (artifact == null) {
    reasonCodes.push("source_side_authority_artifact_missing");
  } else {
    if (!artifact.summary.hasWallAuthority) {
      reasonCodes.push("wall_source_side_authority_missing");
    }
    if (!artifact.summary.allRequiredRegionsAuthoritative) {
      reasonCodes.push("required_region_source_side_authority_incomplete");
    }
    if (artifact.summary.anyMetricEcho) {
      reasonCodes.push("source_side_metric_echo_forbidden");
    }
    if (artifact.summary.anyProxy) {
      reasonCodes.push("source_side_proxy_limited");
    }
    if (artifact.summary.anyMissingCounterpart) {
      reasonCodes.push("source_side_counterpart_missing");
    }
  }
  return {
    gateId: "GATE_SOURCE_SIDE_SAME_BASIS_TENSOR_AUTHORITY",
    state: artifact?.summary.anyMetricEcho === true ? "fail" : reasonCodes.length > 0 ? "review" : "pass",
    reasonCodes,
    blockerClass: "tile_counterpart",
  };
};

const sourceClosureReadinessGate = (
  artifact: Nhm2SourceClosurePassReadinessArtifact | null,
): Nhm2BlockerLedgerArtifact["gateSummary"][number] => {
  if (artifact == null) {
    return {
      gateId: "GATE_SOURCE_CLOSURE_PASS_READINESS_PREFLIGHT",
      state: "review",
      reasonCodes: ["source_closure_pass_readiness_missing"],
      blockerClass: "source_closure",
    };
  }
  return {
    gateId: "GATE_SOURCE_CLOSURE_PASS_READINESS_PREFLIGHT",
    state: artifact.sourceClosurePassSignalAllowed ? "pass" : "review",
    reasonCodes: artifact.sourceClosurePassSignalAllowed
      ? []
      : artifact.preflightBlockers.length > 0
        ? artifact.preflightBlockers
        : [artifact.firstRetirableBlocker],
    blockerClass:
      artifact.preflightBlockers.some((blocker) =>
        /authority|counterpart|tensor/.test(blocker),
      )
        ? "tile_counterpart"
        : "source_closure",
  };
};

const coupledClosureBlockerClass = (
  artifact: Nhm2CoupledClosurePassCandidateArtifactV1 | null,
): Nhm2BlockerClass => {
  const firstGate = artifact?.gates.find((gate) => gate.status !== "pass")?.gateId ?? "";
  if (firstGate.includes("qei")) return "qei";
  if (firstGate.includes("observer")) return "observer";
  if (firstGate.includes("conservation") || firstGate.includes("material")) {
    return "tile_counterpart";
  }
  if (firstGate.includes("authority")) return "tile_counterpart";
  if (firstGate.includes("residual") || firstGate.includes("closure")) {
    return "source_closure";
  }
  return "source_closure";
};

const coupledClosureGate = (
  artifact: Nhm2CoupledClosurePassCandidateArtifactV1 | null,
): Nhm2BlockerLedgerArtifact["gateSummary"][number] => {
  if (artifact == null) {
    return {
      gateId: "GATE_COUPLED_CLOSURE_PASS_CANDIDATE",
      state: "review",
      reasonCodes: ["coupled_closure_pass_candidate_missing"],
      blockerClass: "source_closure",
    };
  }
  const failingGates = artifact.gates.filter((gate) => gate.status !== "pass");
  return {
    gateId: "GATE_COUPLED_CLOSURE_PASS_CANDIDATE",
    state: artifact.summary.passCandidate
      ? "pass"
      : failingGates.some((gate) => gate.status === "fail" || gate.status === "blocked")
        ? "fail"
        : "review",
    reasonCodes:
      failingGates.length === 0
        ? []
        : failingGates.flatMap((gate) =>
            gate.blockers.length > 0
              ? gate.blockers.map((blocker) => `${gate.gateId}:${blocker}`)
              : [`${gate.gateId}:non_pass`],
          ),
    blockerClass: coupledClosureBlockerClass(artifact),
  };
};

const tileLocalMaterialStatus = (
  artifact: Nhm2TileLocalSourceElementsArtifactV1 | null,
): string | null => {
  if (artifact == null || artifact.elements.length === 0) return null;
  const statuses = Array.from(
    new Set(artifact.elements.map((element) => element.material.materialReceiptStatus)),
  );
  return statuses.length === 1 ? statuses[0] : "mixed";
};

const primaryBlockerClass = (
  gates: Nhm2BlockerLedgerArtifact["gateSummary"],
): string | null => {
  const priority: Nhm2BlockerClass[] = [
    "provenance",
    "tile_counterpart",
    "qei",
    "source_closure",
    "tensor_authority",
    "observer",
    "reproducibility",
    "certificate_policy",
    "literature_boundary",
    "adapter_infra",
    "claim_lock",
    "unknown",
  ];
  return (
    priority.find((blockerClass) =>
      gates.some((gate) => gate.blockerClass === blockerClass && gate.state !== "pass"),
    ) ?? null
  );
};

const recommendation = (blockerClass: string | null): string => {
  switch (blockerClass) {
    case "tile_counterpart":
      return "emit non-proxy same-basis tile_effective_counterpart tensors for hull, wall, and exterior_shell";
    case "source_closure":
      return "retire tile-counterpart tensor authority and QEI/conservation blockers before attempting residual tuning";
    case "qei":
      return "publish a pass-level worldline QEI dossier before physical-mechanism language";
    case "observer":
      return "regenerate observer and full-loop audit artifacts from the same frozen run";
    case "reproducibility":
      return "emit convergence, boundary, smoothing, and independent reproduction evidence";
    case "provenance":
      return "freeze artifacts without latest aliases and with one profile/commit/run identity";
    default:
      return "continue targeted blocker retirement from the frozen ledger";
  }
};

export const buildReferenceRunBlockerLedger = (args: {
  repoRoot: string;
  referenceRunPath: string;
  fullLoopAuditPath: string;
  validationPath: string;
  tileEffectiveCounterpartPath: string;
  regionalSourceClosureEvidencePath: string;
  literatureMapPath: string;
  outPath: string;
  sourceDivergenceReportPath?: string | null;
  tileProvenanceAuditPath?: string | null;
  qeiDossierPath?: string | null;
  qeiWorldlineDossierPath?: string | null;
  sourceTensorArtifactPath?: string | null;
  tileLocalSourceElementsPath?: string | null;
  conservationArtifactPath?: string | null;
  sourceSideAuthorityPath?: string | null;
  sourceClosurePassReadinessPath?: string | null;
  coupledClosurePassCandidatePath?: string | null;
  auditOnly?: boolean;
}): Nhm2BlockerLedgerArtifact => {
  const paths = [
    args.referenceRunPath,
    args.fullLoopAuditPath,
    args.validationPath,
    args.tileEffectiveCounterpartPath,
    args.regionalSourceClosureEvidencePath,
    args.sourceDivergenceReportPath,
    args.tileProvenanceAuditPath,
    args.qeiDossierPath,
    args.qeiWorldlineDossierPath,
    args.sourceTensorArtifactPath,
    args.tileLocalSourceElementsPath,
    args.conservationArtifactPath,
    args.sourceSideAuthorityPath,
    args.sourceClosurePassReadinessPath,
    args.coupledClosurePassCandidatePath,
    args.literatureMapPath,
  ];
  if (!args.auditOnly && paths.some(pathUsesLatestAlias)) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  for (const path of paths.filter((entry): entry is string => entry != null)) {
    if (!existsSync(resolvePath(args.repoRoot, path))) {
      throw new Error(`required ledger input missing: ${path}`);
    }
  }

  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  if (!isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be nhm2_reference_run/v1");
  }
  const fullLoopAudit = asRecord(readJson(resolvePath(args.repoRoot, args.fullLoopAuditPath)));
  const validation = readJson(resolvePath(args.repoRoot, args.validationPath));
  if (!isValidationArtifact(validation)) {
    throw new Error("validation must be nhm2_reference_run_validation/v1");
  }
  const tile = readJson(resolvePath(args.repoRoot, args.tileEffectiveCounterpartPath));
  if (!isNhm2TileEffectiveCounterpartArtifact(tile)) {
    throw new Error("tile-effective counterpart must be nhm2_tile_effective_counterpart/v1");
  }
  const regionalEvidence = readJson(
    resolvePath(args.repoRoot, args.regionalSourceClosureEvidencePath),
  );
  if (!isNhm2RegionalSourceClosureEvidenceArtifact(regionalEvidence)) {
    throw new Error("regional evidence must be nhm2_regional_source_closure_evidence/v1");
  }
  const qeiPath = args.qeiWorldlineDossierPath ?? args.qeiDossierPath ?? null;
  const qei = qeiPath == null ? null : readJson(resolvePath(args.repoRoot, qeiPath));
  if (
    qei != null &&
    !isNhm2QeiDossierArtifact(qei) &&
    !isNhm2QeiWorldlineDossier(qei)
  ) {
    throw new Error(
      "QEI dossier must be nhm2_qei_dossier/v1 or nhm2_qei_worldline_dossier/v1",
    );
  }
  const literatureMap = readJson(resolvePath(args.repoRoot, args.literatureMapPath));
  if (!isLiteratureClaimMap(literatureMap)) {
    throw new Error("literature map must include support and non-support boundaries");
  }
  const sourceTensor =
    args.sourceTensorArtifactPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.sourceTensorArtifactPath));
  if (sourceTensor != null && !isNhm2TileEffectiveFullTensorSourceArtifact(sourceTensor)) {
    throw new Error("source tensor artifact must be nhm2_tile_effective_full_tensor_source/v1");
  }
  const conservation =
    args.conservationArtifactPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.conservationArtifactPath));
  if (conservation != null && !isNhm2TileCounterpartConservationArtifact(conservation)) {
    throw new Error("conservation artifact must be nhm2_tile_counterpart_conservation/v1");
  }
  const tileLocalSourceElements =
    args.tileLocalSourceElementsPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.tileLocalSourceElementsPath));
  if (
    tileLocalSourceElements != null &&
    !isNhm2TileLocalSourceElementsArtifact(tileLocalSourceElements)
  ) {
    throw new Error("tile local source elements must be nhm2_tile_local_source_elements/v1");
  }
  const sourceAuthority =
    args.sourceSideAuthorityPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.sourceSideAuthorityPath));
  if (
    sourceAuthority != null &&
    !isNhm2SourceSideSameBasisTensorAuthorityArtifact(sourceAuthority)
  ) {
    throw new Error(
      "source-side authority must be nhm2_source_side_same_basis_tensor_authority/v1",
    );
  }
  const passReadiness =
    args.sourceClosurePassReadinessPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.sourceClosurePassReadinessPath));
  if (
    passReadiness != null &&
    !isNhm2SourceClosurePassReadinessArtifact(passReadiness)
  ) {
    throw new Error(
      "source closure pass-readiness must be nhm2_source_closure_pass_readiness/v1",
    );
  }
  const coupledClosurePassCandidate =
    args.coupledClosurePassCandidatePath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.coupledClosurePassCandidatePath));
  if (
    coupledClosurePassCandidate != null &&
    !isNhm2CoupledClosurePassCandidateArtifact(coupledClosurePassCandidate)
  ) {
    throw new Error(
      "coupled closure pass-candidate must be nhm2_coupled_closure_pass_candidate/v1",
    );
  }

  const sourceAuthorityArtifact = isNhm2SourceSideSameBasisTensorAuthorityArtifact(sourceAuthority)
    ? sourceAuthority
    : null;
  const passReadinessArtifact = isNhm2SourceClosurePassReadinessArtifact(passReadiness)
    ? passReadiness
    : null;
  const coupledClosurePassCandidateArtifact =
    isNhm2CoupledClosurePassCandidateArtifact(coupledClosurePassCandidate)
      ? coupledClosurePassCandidate
      : null;
  const tileLocalSourceElementsArtifact = isNhm2TileLocalSourceElementsArtifact(
    tileLocalSourceElements,
  )
    ? tileLocalSourceElements
    : null;
  const gateSummary = [
    ...validation.gates.map((entry: Nhm2ReferenceRunValidationGate) => ({
      gateId: entry.gateId,
      state: entry.state,
      reasonCodes: entry.reasonCodes,
      blockerClass: classifyGate(entry.gateId),
    })),
    sourceAuthorityGate(sourceAuthorityArtifact),
    sourceClosureReadinessGate(passReadinessArtifact),
    coupledClosureGate(coupledClosurePassCandidateArtifact),
  ];
  const qeiArtifact: QeiLedgerArtifact | null =
    isNhm2QeiDossierArtifact(qei) || isNhm2QeiWorldlineDossier(qei) ? qei : null;
  const qeiMissingFields = missingQeiFields(qeiArtifact);
  const qeiBlockers: Nhm2BlockerLedgerArtifact["qeiBlockers"] = {
    status: qeiLedgerStatus(qeiArtifact),
    qeiApplicabilityStatus: qeiLedgerApplicability(qeiArtifact),
    missingFields: qeiMissingFields,
  };
  const regionalBlockers = regionalEvidence.regions.map((region) => {
    const boundary = normalizeBoundary(classifySourceToGeometryDivergence(region));
    return {
      regionId: region.regionId,
      firstDivergenceBoundary: boundary,
      metricTensorAuthorityMode: region.metricRequired.tensorAuthorityMode,
      tileTensorAuthorityMode: region.tileEffectiveCounterpart.tensorAuthorityMode,
      comparisonRole: region.tileEffectiveCounterpart.comparisonRole,
      relLInf: region.residuals.relLInf,
      absLInf: region.residuals.absLInf,
      status: region.status,
      nextRequiredEvidence: nextEvidence(boundary),
    };
  });
  const primary = primaryBlockerClass(gateSummary);
  const ledger = buildNhm2BlockerLedgerArtifact({
    generatedAt: new Date().toISOString(),
    runId: referenceRun.runId,
    selectedProfileId: referenceRun.selectedFamily.selectedProfileId,
    expectedProfileId: referenceRun.selectedFamily.expectedProfileId,
    laneId: "nhm2_shift_lapse",
    claimLock: {
      validationClaimAllowed: false,
      physicalMechanismClaimAllowed: false,
      promotionAllowed: false,
      allowedClaimTier:
        validation.claimTierAllowed === "diagnostic" ||
        validation.claimTierAllowed === "reduced-order"
          ? validation.claimTierAllowed
          : null,
      claimEffect:
        validation.overallState === "pass"
          ? "reduced_order_candidate_evidence"
          : "blocker_ledger_only",
    },
    artifactRefs: {
      referenceRun: args.referenceRunPath,
      fullLoopAudit: args.fullLoopAuditPath,
      qeiDossier: qeiPath,
      tileEffectiveCounterpart: args.tileEffectiveCounterpartPath,
      regionalSourceClosureEvidence: args.regionalSourceClosureEvidencePath,
      sourceToGeometryDivergenceReport: args.sourceDivergenceReportPath ?? null,
      tileCounterpartProvenanceAudit: args.tileProvenanceAuditPath ?? null,
      sourceTensorArtifact: args.sourceTensorArtifactPath ?? null,
      tileLocalSourceElements: args.tileLocalSourceElementsPath ?? null,
      conservationArtifact: args.conservationArtifactPath ?? null,
      sourceSideSameBasisTensorAuthority: args.sourceSideAuthorityPath ?? null,
      sourceClosurePassReadiness: args.sourceClosurePassReadinessPath ?? null,
      coupledClosurePassCandidate: args.coupledClosurePassCandidatePath ?? null,
      referenceRunValidation: args.validationPath,
    },
    tileCounterpartSource: {
      sourceTensorArtifactRef: args.sourceTensorArtifactPath ?? tile.sourceTensorArtifactRef ?? null,
      sourceTensorAuthorityMode:
        (isNhm2TileEffectiveFullTensorSourceArtifact(sourceTensor)
          ? sourceTensor.sourceModel.sourceModelClass
          : tile.sourceTensorAuthorityMode) ?? null,
      tileLocalSourceElementsRef: args.tileLocalSourceElementsPath ?? null,
      tileLocalSourceElementCount:
        tileLocalSourceElementsArtifact?.summary.elementCount ?? null,
      tileLocalSourceWallCoverage:
        tileLocalSourceElementsArtifact?.summary.hasWallCoverage ?? null,
      tileLocalSourceMaterialReceiptStatus: tileLocalMaterialStatus(
        tileLocalSourceElementsArtifact,
      ),
      tileLocalSourceFirstBlocker:
        tileLocalSourceElementsArtifact?.summary.firstBlocker ?? null,
      conservationStatus:
        (isNhm2TileCounterpartConservationArtifact(conservation)
          ? conservation.overallState
          : tile.conservationStatus) ?? null,
      qeiLinkageStatus: tile.qeiApplicabilityStatus,
      sourceSideAuthorityRef: args.sourceSideAuthorityPath ?? null,
      sourceSideAuthorityStatus: sourceAuthorityStatus(sourceAuthorityArtifact),
      hasWallAuthority: sourceAuthorityArtifact?.summary.hasWallAuthority ?? null,
      allRequiredRegionsAuthoritative:
        sourceAuthorityArtifact?.summary.allRequiredRegionsAuthoritative ?? null,
      authorityMissingRegionIds: sourceAuthorityArtifact?.summary.missingRegionIds ?? [],
      sourceClosurePassSignalAllowed:
        passReadinessArtifact?.sourceClosurePassSignalAllowed ?? null,
      firstRetirableBlocker: passReadinessArtifact?.firstRetirableBlocker ?? null,
      preflightBlockers: passReadinessArtifact?.preflightBlockers ?? [],
      coupledClosurePassCandidateRef: args.coupledClosurePassCandidatePath ?? null,
      coupledClosurePassCandidate:
        coupledClosurePassCandidateArtifact?.summary.passCandidate ?? null,
      coupledClosureFirstBlocker:
        coupledClosurePassCandidateArtifact?.summary.firstBlocker ?? null,
      coupledClosureBlockers:
        coupledClosurePassCandidateArtifact?.gates.flatMap((gate) =>
          gate.status === "pass"
            ? []
            : gate.blockers.length > 0
              ? gate.blockers.map((blocker) => `${gate.gateId}:${blocker}`)
              : [`${gate.gateId}:non_pass`],
        ) ?? [],
      coupledClosureFirstRequiredCorrections: correctionRecord(
        coupledClosurePassCandidateArtifact?.summary.firstRequiredCorrections ?? {},
      ),
      coupledClosureRequiredCorrections: coupledClosureRequiredCorrections(
        coupledClosurePassCandidateArtifact,
      ),
    },
    gateSummary,
    regionalBlockers,
    observerBlockers: observerSummary(validation),
    qeiBlockers,
    reproducibilityBlockers: reproducibilitySummary(fullLoopAudit),
    certificatePolicy: certificateSummary(fullLoopAudit, validation),
    adapterVerification: {
      status: validation.adapterVerificationStatus,
      physicsImpact: validation.adapterVerificationPhysicsImpact,
    },
    literatureClaimBoundary: {
      externalTheoryDoesNotValidateNHM2: true,
      noPredictiveLanguageFromExperimentalMathOnly: true,
      sourcesChecked: literatureMap.sources.map((source) => source.sourceId),
    },
    primaryBlockerClass: primary,
    nextPatchRecommendation: recommendation(primary),
  });

  if (!isNhm2BlockerLedgerArtifact(ledger)) {
    throw new Error("built ledger failed nhm2_blocker_ledger/v1 validation");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  return ledger;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const required = [
    "reference-run",
    "full-loop-audit",
    "validation",
    "tile-effective-counterpart",
    "regional-source-closure-evidence",
    "literature-map",
    "out",
  ];
  for (const key of required) {
    if (typeof args[key] !== "string") {
      throw new Error(`missing required --${key}`);
    }
  }
  const ledger = buildReferenceRunBlockerLedger({
    repoRoot,
    referenceRunPath: args["reference-run"] as string,
    fullLoopAuditPath: args["full-loop-audit"] as string,
    validationPath: args.validation as string,
    tileEffectiveCounterpartPath: args["tile-effective-counterpart"] as string,
    regionalSourceClosureEvidencePath: args["regional-source-closure-evidence"] as string,
    sourceDivergenceReportPath: asString(args["source-divergence-report"]),
    tileProvenanceAuditPath: asString(args["tile-provenance-audit"]),
    qeiDossierPath: asString(args["qei-dossier"]),
    qeiWorldlineDossierPath: asString(args["qei-worldline-dossier"]),
    sourceTensorArtifactPath: asString(args["source-tensor-artifact"]),
    tileLocalSourceElementsPath: asString(args["tile-local-source-elements"]),
    conservationArtifactPath: asString(args.conservation),
    sourceSideAuthorityPath: asString(args["source-side-authority"]),
    sourceClosurePassReadinessPath: asString(args["source-closure-pass-readiness"]),
    coupledClosurePassCandidatePath: asString(args["coupled-closure-pass-candidate"]),
    literatureMapPath: args["literature-map"] as string,
    outPath: args.out as string,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(ledger, null, 2)}\n`);
}
