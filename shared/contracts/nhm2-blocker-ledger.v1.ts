export const NHM2_BLOCKER_LEDGER_ARTIFACT_ID = "nhm2_blocker_ledger";
export const NHM2_BLOCKER_LEDGER_SCHEMA_VERSION = "nhm2_blocker_ledger/v1";

export const NHM2_BLOCKER_LEDGER_REGIONS = [
  "global",
  "hull",
  "wall",
  "exterior_shell",
] as const;

export type Nhm2BlockerLedgerState = "pass" | "review" | "fail";
export type Nhm2BlockerLedgerRegionId =
  (typeof NHM2_BLOCKER_LEDGER_REGIONS)[number];
export type Nhm2BlockerClass =
  | "claim_lock"
  | "provenance"
  | "source_closure"
  | "tile_counterpart"
  | "tensor_authority"
  | "observer"
  | "qei"
  | "reproducibility"
  | "certificate_policy"
  | "adapter_infra"
  | "literature_boundary"
  | "unknown";
export type Nhm2DivergenceBoundary =
  | "counterpart_missing"
  | "basis_mismatch"
  | "profile_mismatch"
  | "tensor_authority_insufficient"
  | "residual_exceeded"
  | "qei_unlinked"
  | "conservation_unknown"
  | "none";

export type Nhm2BlockerLedgerArtifact = {
  artifactId: typeof NHM2_BLOCKER_LEDGER_ARTIFACT_ID;
  schemaVersion: typeof NHM2_BLOCKER_LEDGER_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  selectedProfileId: string;
  expectedProfileId: string;
  profileMatch: boolean;
  laneId: "nhm2_shift_lapse";
  claimLock: {
    validationClaimAllowed: false;
    physicalMechanismClaimAllowed: false;
    promotionAllowed: false;
    allowedClaimTier: "diagnostic" | "reduced-order" | null;
    claimEffect:
      | "blocker_ledger_only"
      | "diagnostic_only"
      | "reduced_order_candidate_evidence";
  };
  artifactRefs: {
    referenceRun: string | null;
    fullLoopAudit: string | null;
    qeiDossier: string | null;
    tileEffectiveCounterpart: string | null;
    regionalSourceClosureEvidence: string | null;
    sourceToGeometryDivergenceReport: string | null;
    tileCounterpartProvenanceAudit: string | null;
    sourceTensorArtifact: string | null;
    conservationArtifact: string | null;
    sourceSideSameBasisTensorAuthority: string | null;
    sourceClosurePassReadiness: string | null;
    referenceRunValidation: string | null;
  };
  tileCounterpartSource: {
    sourceTensorArtifactRef: string | null;
    sourceTensorAuthorityMode: string | null;
    conservationStatus: string | null;
    qeiLinkageStatus: string | null;
    sourceSideAuthorityRef: string | null;
    sourceSideAuthorityStatus: string | null;
    hasWallAuthority: boolean | null;
    allRequiredRegionsAuthoritative: boolean | null;
    authorityMissingRegionIds: string[];
    sourceClosurePassSignalAllowed: boolean | null;
    firstRetirableBlocker: string | null;
    preflightBlockers: string[];
  };
  gateSummary: Array<{
    gateId: string;
    state: Nhm2BlockerLedgerState;
    reasonCodes: string[];
    blockerClass: Nhm2BlockerClass;
  }>;
  regionalBlockers: Array<{
    regionId: Nhm2BlockerLedgerRegionId;
    firstDivergenceBoundary: Nhm2DivergenceBoundary;
    metricTensorAuthorityMode: string | null;
    tileTensorAuthorityMode: string | null;
    comparisonRole: string | null;
    relLInf: number | null;
    absLInf: number | null;
    status: "pass" | "review" | "fail" | "missing";
    nextRequiredEvidence: string;
  }>;
  observerBlockers: {
    summaryVsDetailedStatus: "pass" | "review" | "fail" | "unknown";
    reasonCodes: string[];
  };
  qeiBlockers: {
    status: "pass" | "review" | "fail" | "missing" | "unknown";
    qeiApplicabilityStatus: "PASS" | "REVIEW" | "FAIL" | "UNKNOWN" | null;
    missingFields: string[];
  };
  reproducibilityBlockers: {
    status: "pass" | "review" | "fail" | "unknown";
    missingFields: string[];
  };
  certificatePolicy: {
    certificateStatus: string | null;
    certificateIntegrity: string | null;
    greenButNonPromotional: boolean;
    reason: string | null;
  };
  adapterVerification: {
    status:
      | "pass"
      | "fail"
      | "blocked_infra_endpoint_unavailable"
      | "not_run"
      | "unknown";
    physicsImpact: "none_claimed";
  };
  literatureClaimBoundary: {
    externalTheoryDoesNotValidateNHM2: true;
    noPredictiveLanguageFromExperimentalMathOnly: true;
    sourcesChecked: string[];
  };
  overallState: Nhm2BlockerLedgerState;
  primaryBlockerClass: string | null;
  nextPatchRecommendation: string;
  reasonCodes: string[];
};

export type BuildNhm2BlockerLedgerArtifactInput = Omit<
  Nhm2BlockerLedgerArtifact,
  "artifactId" | "schemaVersion" | "profileMatch" | "overallState" | "reasonCodes"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isNullableBoolean = (value: unknown): value is boolean | null =>
  value === null || typeof value === "boolean";

const isState = (value: unknown): value is Nhm2BlockerLedgerState =>
  value === "pass" || value === "review" || value === "fail";

const isRegionStatus = (
  value: unknown,
): value is Nhm2BlockerLedgerArtifact["regionalBlockers"][number]["status"] =>
  value === "pass" || value === "review" || value === "fail" || value === "missing";

const isRegionId = (value: unknown): value is Nhm2BlockerLedgerRegionId =>
  NHM2_BLOCKER_LEDGER_REGIONS.includes(value as Nhm2BlockerLedgerRegionId);

const isBlockerClass = (value: unknown): value is Nhm2BlockerClass =>
  value === "claim_lock" ||
  value === "provenance" ||
  value === "source_closure" ||
  value === "tile_counterpart" ||
  value === "tensor_authority" ||
  value === "observer" ||
  value === "qei" ||
  value === "reproducibility" ||
  value === "certificate_policy" ||
  value === "adapter_infra" ||
  value === "literature_boundary" ||
  value === "unknown";

const isBoundary = (value: unknown): value is Nhm2DivergenceBoundary =>
  value === "counterpart_missing" ||
  value === "basis_mismatch" ||
  value === "profile_mismatch" ||
  value === "tensor_authority_insufficient" ||
  value === "residual_exceeded" ||
  value === "qei_unlinked" ||
  value === "conservation_unknown" ||
  value === "none";

const isAdapterStatus = (
  value: unknown,
): value is Nhm2BlockerLedgerArtifact["adapterVerification"]["status"] =>
  value === "pass" ||
  value === "fail" ||
  value === "blocked_infra_endpoint_unavailable" ||
  value === "not_run" ||
  value === "unknown";

const aggregateState = (
  gates: Nhm2BlockerLedgerArtifact["gateSummary"],
  regional: Nhm2BlockerLedgerArtifact["regionalBlockers"],
): Nhm2BlockerLedgerState => {
  if (
    gates.some((entry) => entry.state === "fail") ||
    regional.some((entry) => entry.status === "fail")
  ) {
    return "fail";
  }
  if (
    gates.some((entry) => entry.state === "review") ||
    regional.some((entry) => entry.status === "review" || entry.status === "missing")
  ) {
    return "review";
  }
  return "pass";
};

export const buildNhm2BlockerLedgerArtifact = (
  input: BuildNhm2BlockerLedgerArtifactInput,
): Nhm2BlockerLedgerArtifact => {
  const profileMatch = input.selectedProfileId === input.expectedProfileId;
  const reasonCodes = new Set<string>();
  if (!profileMatch) reasonCodes.add("profile_mismatch");
  if (input.claimLock.validationClaimAllowed !== false) {
    reasonCodes.add("validation_claim_lock_invalid");
  }
  for (const gate of input.gateSummary) {
    if (gate.state !== "pass") {
      for (const reason of gate.reasonCodes) {
        reasonCodes.add(`${gate.gateId}:${reason}`);
      }
      if (gate.reasonCodes.length === 0) {
        reasonCodes.add(`${gate.gateId}:non_pass`);
      }
    }
  }
  for (const region of input.regionalBlockers) {
    if (region.status !== "pass" || region.firstDivergenceBoundary !== "none") {
      reasonCodes.add(`${region.regionId}:${region.firstDivergenceBoundary}`);
    }
  }
  const overallState = aggregateState(input.gateSummary, input.regionalBlockers);
  return {
    artifactId: NHM2_BLOCKER_LEDGER_ARTIFACT_ID,
    schemaVersion: NHM2_BLOCKER_LEDGER_SCHEMA_VERSION,
    ...input,
    profileMatch,
    overallState,
    reasonCodes: Array.from(reasonCodes),
  };
};

const isGate = (
  value: unknown,
): value is Nhm2BlockerLedgerArtifact["gateSummary"][number] => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isText(record.gateId) &&
    isState(record.state) &&
    Array.isArray(record.reasonCodes) &&
    record.reasonCodes.every(isText) &&
    isBlockerClass(record.blockerClass)
  );
};

const isRegionalBlocker = (
  value: unknown,
): value is Nhm2BlockerLedgerArtifact["regionalBlockers"][number] => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isBoundary(record.firstDivergenceBoundary) &&
    isNullableText(record.metricTensorAuthorityMode) &&
    isNullableText(record.tileTensorAuthorityMode) &&
    isNullableText(record.comparisonRole) &&
    isNullableNumber(record.relLInf) &&
    isNullableNumber(record.absLInf) &&
    isRegionStatus(record.status) &&
    isText(record.nextRequiredEvidence)
  );
};

export const isNhm2BlockerLedgerArtifact = (
  value: unknown,
): value is Nhm2BlockerLedgerArtifact => {
  const record = isRecord(value) ? value : null;
  const claimLock = isRecord(record?.claimLock) ? record?.claimLock : null;
  const refs = isRecord(record?.artifactRefs) ? record?.artifactRefs : null;
  const observer = isRecord(record?.observerBlockers) ? record?.observerBlockers : null;
  const qei = isRecord(record?.qeiBlockers) ? record?.qeiBlockers : null;
  const reproducibility = isRecord(record?.reproducibilityBlockers)
    ? record?.reproducibilityBlockers
    : null;
  const certificate = isRecord(record?.certificatePolicy) ? record?.certificatePolicy : null;
  const adapter = isRecord(record?.adapterVerification) ? record?.adapterVerification : null;
  const literature = isRecord(record?.literatureClaimBoundary)
    ? record?.literatureClaimBoundary
    : null;
  const tileCounterpartSource = isRecord(record?.tileCounterpartSource)
    ? record?.tileCounterpartSource
    : null;
  if (
    record == null ||
    record.artifactId !== NHM2_BLOCKER_LEDGER_ARTIFACT_ID ||
    record.schemaVersion !== NHM2_BLOCKER_LEDGER_SCHEMA_VERSION ||
    !isText(record.generatedAt) ||
    !isText(record.runId) ||
    !isText(record.selectedProfileId) ||
    !isText(record.expectedProfileId) ||
    record.profileMatch !== (record.selectedProfileId === record.expectedProfileId) ||
    record.laneId !== "nhm2_shift_lapse" ||
    claimLock == null ||
    claimLock.validationClaimAllowed !== false ||
    claimLock.physicalMechanismClaimAllowed !== false ||
    claimLock.promotionAllowed !== false ||
    (claimLock.allowedClaimTier !== "diagnostic" &&
      claimLock.allowedClaimTier !== "reduced-order" &&
      claimLock.allowedClaimTier !== null) ||
    (claimLock.claimEffect !== "blocker_ledger_only" &&
      claimLock.claimEffect !== "diagnostic_only" &&
      claimLock.claimEffect !== "reduced_order_candidate_evidence") ||
    refs == null ||
    !isNullableText(refs.referenceRun) ||
    !isNullableText(refs.fullLoopAudit) ||
    !isNullableText(refs.qeiDossier) ||
    !isNullableText(refs.tileEffectiveCounterpart) ||
    !isNullableText(refs.regionalSourceClosureEvidence) ||
    !isNullableText(refs.sourceToGeometryDivergenceReport) ||
    !isNullableText(refs.tileCounterpartProvenanceAudit) ||
    !isNullableText(refs.sourceTensorArtifact) ||
    !isNullableText(refs.conservationArtifact) ||
    !isNullableText(refs.sourceSideSameBasisTensorAuthority) ||
    !isNullableText(refs.sourceClosurePassReadiness) ||
    !isNullableText(refs.referenceRunValidation) ||
    tileCounterpartSource == null ||
    !isNullableText(tileCounterpartSource.sourceTensorArtifactRef) ||
    !isNullableText(tileCounterpartSource.sourceTensorAuthorityMode) ||
    !isNullableText(tileCounterpartSource.conservationStatus) ||
    !isNullableText(tileCounterpartSource.qeiLinkageStatus) ||
    !isNullableText(tileCounterpartSource.sourceSideAuthorityRef) ||
    !isNullableText(tileCounterpartSource.sourceSideAuthorityStatus) ||
    !isNullableBoolean(tileCounterpartSource.hasWallAuthority) ||
    !isNullableBoolean(tileCounterpartSource.allRequiredRegionsAuthoritative) ||
    !Array.isArray(tileCounterpartSource.authorityMissingRegionIds) ||
    !tileCounterpartSource.authorityMissingRegionIds.every(isText) ||
    !isNullableBoolean(tileCounterpartSource.sourceClosurePassSignalAllowed) ||
    !isNullableText(tileCounterpartSource.firstRetirableBlocker) ||
    !Array.isArray(tileCounterpartSource.preflightBlockers) ||
    !tileCounterpartSource.preflightBlockers.every(isText) ||
    !Array.isArray(record.gateSummary) ||
    !record.gateSummary.every(isGate) ||
    !Array.isArray(record.regionalBlockers) ||
    !record.regionalBlockers.every(isRegionalBlocker) ||
    observer == null ||
    (observer.summaryVsDetailedStatus !== "pass" &&
      observer.summaryVsDetailedStatus !== "review" &&
      observer.summaryVsDetailedStatus !== "fail" &&
      observer.summaryVsDetailedStatus !== "unknown") ||
    !Array.isArray(observer.reasonCodes) ||
    !observer.reasonCodes.every(isText) ||
    qei == null ||
    (qei.status !== "pass" &&
      qei.status !== "review" &&
      qei.status !== "fail" &&
      qei.status !== "missing" &&
      qei.status !== "unknown") ||
    (qei.qeiApplicabilityStatus !== "PASS" &&
      qei.qeiApplicabilityStatus !== "REVIEW" &&
      qei.qeiApplicabilityStatus !== "FAIL" &&
      qei.qeiApplicabilityStatus !== "UNKNOWN" &&
      qei.qeiApplicabilityStatus !== null) ||
    !Array.isArray(qei.missingFields) ||
    !qei.missingFields.every(isText) ||
    reproducibility == null ||
    (reproducibility.status !== "pass" &&
      reproducibility.status !== "review" &&
      reproducibility.status !== "fail" &&
      reproducibility.status !== "unknown") ||
    !Array.isArray(reproducibility.missingFields) ||
    !reproducibility.missingFields.every(isText) ||
    certificate == null ||
    !isNullableText(certificate.certificateStatus) ||
    !isNullableText(certificate.certificateIntegrity) ||
    typeof certificate.greenButNonPromotional !== "boolean" ||
    !isNullableText(certificate.reason) ||
    adapter == null ||
    !isAdapterStatus(adapter.status) ||
    adapter.physicsImpact !== "none_claimed" ||
    literature == null ||
    literature.externalTheoryDoesNotValidateNHM2 !== true ||
    literature.noPredictiveLanguageFromExperimentalMathOnly !== true ||
    !Array.isArray(literature.sourcesChecked) ||
    !literature.sourcesChecked.every(isText) ||
    !isState(record.overallState) ||
    !isNullableText(record.primaryBlockerClass) ||
    !isText(record.nextPatchRecommendation) ||
    !Array.isArray(record.reasonCodes) ||
    !record.reasonCodes.every(isText)
  ) {
    return false;
  }

  if (
    record.gateSummary.some((entry) => entry.state === "fail") &&
    record.overallState === "pass"
  ) {
    return false;
  }
  if (
    certificate.greenButNonPromotional === false &&
    certificate.certificateStatus != null &&
    /green|admissible/i.test(certificate.certificateStatus) &&
    record.gateSummary.some((entry) => entry.state !== "pass")
  ) {
    return false;
  }
  return true;
};
