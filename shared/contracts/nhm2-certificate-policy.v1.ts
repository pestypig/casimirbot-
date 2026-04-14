import {
  NHM2_FULL_LOOP_AUDIT_CLAIM_TIERS,
  NHM2_FULL_LOOP_AUDIT_REASON_CODES,
  type Nhm2FullLoopAuditArtifactRef,
  type Nhm2FullLoopAuditClaimTier,
  type Nhm2FullLoopAuditReasonCode,
} from "./nhm2-full-loop-audit.v1";

export const NHM2_CERTIFICATE_POLICY_ARTIFACT_ID = "nhm2_certificate_policy";
export const NHM2_CERTIFICATE_POLICY_SCHEMA_VERSION = "nhm2_certificate_policy/v1";
export const NHM2_CERTIFICATE_POLICY_LANE_ID = "nhm2_shift_lapse";

export const NHM2_CERTIFICATE_POLICY_STATE_VALUES = [
  "pass",
  "fail",
  "review",
  "unavailable",
] as const;

export const NHM2_CERTIFICATE_POLICY_VIABILITY_STATUS_VALUES = [
  "ADMISSIBLE",
  "MARGINAL",
  "INADMISSIBLE",
  "UNKNOWN",
] as const;

export const NHM2_CERTIFICATE_POLICY_INTEGRITY_VALUES = [
  "ok",
  "fail",
  "unavailable",
] as const;

export const NHM2_CERTIFICATE_POLICY_VERDICT_VALUES = [
  "PASS",
  "FAIL",
  "UNKNOWN",
] as const;

export const NHM2_CERTIFICATE_POLICY_REASON_CODES = [
  "status_non_admissible",
  "hard_constraint_failed",
  "certificate_missing",
  "certificate_integrity_missing",
  "certificate_integrity_failed",
  "policy_review_required",
] as const satisfies readonly Nhm2FullLoopAuditReasonCode[];

export type Nhm2CertificatePolicyState =
  (typeof NHM2_CERTIFICATE_POLICY_STATE_VALUES)[number];
export type Nhm2CertificatePolicyViabilityStatus =
  (typeof NHM2_CERTIFICATE_POLICY_VIABILITY_STATUS_VALUES)[number];
export type Nhm2CertificatePolicyIntegrity =
  (typeof NHM2_CERTIFICATE_POLICY_INTEGRITY_VALUES)[number];
export type Nhm2CertificatePolicyVerdict =
  (typeof NHM2_CERTIFICATE_POLICY_VERDICT_VALUES)[number];
export type Nhm2CertificatePolicyReasonCode =
  (typeof NHM2_CERTIFICATE_POLICY_REASON_CODES)[number];

export type Nhm2CertificatePolicyFirstFail = {
  id: string;
  severity: string | null;
  status: string | null;
  note: string | null;
};

export type Nhm2CertificatePolicyArtifact = {
  artifactId: typeof NHM2_CERTIFICATE_POLICY_ARTIFACT_ID;
  schemaVersion: typeof NHM2_CERTIFICATE_POLICY_SCHEMA_VERSION;
  artifactType: typeof NHM2_CERTIFICATE_POLICY_SCHEMA_VERSION;
  laneId: typeof NHM2_CERTIFICATE_POLICY_LANE_ID;
  generatedAt: string;
  state: Nhm2CertificatePolicyState;
  reasonCodes: Nhm2CertificatePolicyReasonCode[];
  sourceTraceId: string | null;
  sourceRunId: string | null;
  verdict: Nhm2CertificatePolicyVerdict;
  firstFail: Nhm2CertificatePolicyFirstFail | null;
  viabilityStatus: Nhm2CertificatePolicyViabilityStatus;
  hardConstraintPass: boolean | null;
  firstHardFailureId: string | null;
  certificateStatus: string | null;
  certificateHash: string | null;
  certificateIntegrity: Nhm2CertificatePolicyIntegrity;
  promotionTier: Nhm2FullLoopAuditClaimTier | null;
  promotionReason: Nhm2CertificatePolicyReasonCode | null;
  artifactRefs: Nhm2FullLoopAuditArtifactRef[];
};

export type BuildNhm2CertificatePolicyArtifactInput = {
  generatedAt: string;
  state: Nhm2CertificatePolicyState;
  reasonCodes?: readonly Nhm2CertificatePolicyReasonCode[];
  sourceTraceId?: string | null;
  sourceRunId?: string | null;
  verdict: Nhm2CertificatePolicyVerdict;
  firstFail?: Nhm2CertificatePolicyFirstFail | null;
  viabilityStatus: Nhm2CertificatePolicyViabilityStatus;
  hardConstraintPass: boolean | null;
  firstHardFailureId?: string | null;
  certificateStatus?: string | null;
  certificateHash?: string | null;
  certificateIntegrity: Nhm2CertificatePolicyIntegrity;
  promotionTier?: Nhm2FullLoopAuditClaimTier | null;
  promotionReason?: Nhm2CertificatePolicyReasonCode | null;
  artifactRefs?: readonly Nhm2FullLoopAuditArtifactRef[];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isState = (value: unknown): value is Nhm2CertificatePolicyState =>
  typeof value === "string" &&
  NHM2_CERTIFICATE_POLICY_STATE_VALUES.includes(
    value as Nhm2CertificatePolicyState,
  );

const isViabilityStatus = (
  value: unknown,
): value is Nhm2CertificatePolicyViabilityStatus =>
  typeof value === "string" &&
  NHM2_CERTIFICATE_POLICY_VIABILITY_STATUS_VALUES.includes(
    value as Nhm2CertificatePolicyViabilityStatus,
  );

const isIntegrity = (value: unknown): value is Nhm2CertificatePolicyIntegrity =>
  typeof value === "string" &&
  NHM2_CERTIFICATE_POLICY_INTEGRITY_VALUES.includes(
    value as Nhm2CertificatePolicyIntegrity,
  );

const isVerdict = (value: unknown): value is Nhm2CertificatePolicyVerdict =>
  typeof value === "string" &&
  NHM2_CERTIFICATE_POLICY_VERDICT_VALUES.includes(
    value as Nhm2CertificatePolicyVerdict,
  );

const isReasonCode = (value: unknown): value is Nhm2CertificatePolicyReasonCode =>
  typeof value === "string" &&
  NHM2_CERTIFICATE_POLICY_REASON_CODES.includes(
    value as Nhm2CertificatePolicyReasonCode,
  );

const isClaimTier = (value: unknown): value is Nhm2FullLoopAuditClaimTier =>
  typeof value === "string" &&
  NHM2_FULL_LOOP_AUDIT_CLAIM_TIERS.includes(
    value as Nhm2FullLoopAuditClaimTier,
  );

const isArtifactRef = (value: unknown): value is Nhm2FullLoopAuditArtifactRef => {
  const record = asRecord(value);
  return (
    asText(record.artifactId) != null &&
    asText(record.path) != null &&
    (record.contractVersion === null || asText(record.contractVersion) != null) &&
    (record.status === null || asText(record.status) != null)
  );
};

const normalizeReasonCodes = (
  reasonCodes: readonly Nhm2CertificatePolicyReasonCode[] | undefined,
): Nhm2CertificatePolicyReasonCode[] => {
  const seen = new Set<Nhm2CertificatePolicyReasonCode>();
  const normalized: Nhm2CertificatePolicyReasonCode[] = [];
  for (const reasonCode of reasonCodes ?? []) {
    if (!isReasonCode(reasonCode) || seen.has(reasonCode)) continue;
    seen.add(reasonCode);
    normalized.push(reasonCode);
  }
  return normalized;
};

export const buildNhm2CertificatePolicyArtifact = (
  args: BuildNhm2CertificatePolicyArtifactInput,
): Nhm2CertificatePolicyArtifact | null => {
  if (
    asText(args.generatedAt) == null ||
    !isState(args.state) ||
    !isVerdict(args.verdict) ||
    !isViabilityStatus(args.viabilityStatus) ||
    !isIntegrity(args.certificateIntegrity)
  ) {
    return null;
  }

  const artifactRefs = (args.artifactRefs ?? []).filter((entry) =>
    isArtifactRef(entry),
  );
  const firstFail =
    args.firstFail == null
      ? null
      : {
          id: asText(args.firstFail.id),
          severity: asText(args.firstFail.severity),
          status: asText(args.firstFail.status),
          note: asText(args.firstFail.note),
        };
  if (firstFail != null && firstFail.id == null) {
    return null;
  }

  const promotionTier =
    args.promotionTier == null ? null : isClaimTier(args.promotionTier) ? args.promotionTier : null;
  if (args.promotionTier != null && promotionTier == null) {
    return null;
  }
  const promotionReason =
    args.promotionReason == null
      ? null
      : isReasonCode(args.promotionReason)
        ? args.promotionReason
        : null;
  if (args.promotionReason != null && promotionReason == null) {
    return null;
  }

  return {
    artifactId: NHM2_CERTIFICATE_POLICY_ARTIFACT_ID,
    schemaVersion: NHM2_CERTIFICATE_POLICY_SCHEMA_VERSION,
    artifactType: NHM2_CERTIFICATE_POLICY_SCHEMA_VERSION,
    laneId: NHM2_CERTIFICATE_POLICY_LANE_ID,
    generatedAt: args.generatedAt,
    state: args.state,
    reasonCodes: normalizeReasonCodes(args.reasonCodes),
    sourceTraceId: asText(args.sourceTraceId),
    sourceRunId: asText(args.sourceRunId),
    verdict: args.verdict,
    firstFail:
      firstFail == null
        ? null
        : {
            id: firstFail.id,
            severity: firstFail.severity,
            status: firstFail.status,
            note: firstFail.note,
          },
    viabilityStatus: args.viabilityStatus,
    hardConstraintPass:
      typeof args.hardConstraintPass === "boolean" ? args.hardConstraintPass : null,
    firstHardFailureId: asText(args.firstHardFailureId),
    certificateStatus: asText(args.certificateStatus),
    certificateHash: asText(args.certificateHash),
    certificateIntegrity: args.certificateIntegrity,
    promotionTier,
    promotionReason,
    artifactRefs: artifactRefs.map((entry) => ({ ...entry })),
  };
};

export const isNhm2CertificatePolicyArtifact = (
  value: unknown,
): value is Nhm2CertificatePolicyArtifact => {
  const record = asRecord(value);
  const reasonCodes = Array.isArray(record.reasonCodes) ? record.reasonCodes : [];
  const artifactRefs = Array.isArray(record.artifactRefs) ? record.artifactRefs : [];
  const firstFail =
    record.firstFail === null || record.firstFail === undefined
      ? null
      : asRecord(record.firstFail);
  return (
    record.artifactId === NHM2_CERTIFICATE_POLICY_ARTIFACT_ID &&
    record.schemaVersion === NHM2_CERTIFICATE_POLICY_SCHEMA_VERSION &&
    record.artifactType === NHM2_CERTIFICATE_POLICY_SCHEMA_VERSION &&
    record.laneId === NHM2_CERTIFICATE_POLICY_LANE_ID &&
    asText(record.generatedAt) != null &&
    isState(record.state) &&
    reasonCodes.every((entry) => isReasonCode(entry)) &&
    (record.sourceTraceId === null || asText(record.sourceTraceId) != null) &&
    (record.sourceRunId === null || asText(record.sourceRunId) != null) &&
    isVerdict(record.verdict) &&
    (firstFail == null ||
      (asText(firstFail.id) != null &&
        (firstFail.severity === null || asText(firstFail.severity) != null) &&
        (firstFail.status === null || asText(firstFail.status) != null) &&
        (firstFail.note === null || asText(firstFail.note) != null))) &&
    isViabilityStatus(record.viabilityStatus) &&
    (record.hardConstraintPass === null ||
      typeof record.hardConstraintPass === "boolean") &&
    (record.firstHardFailureId === null ||
      asText(record.firstHardFailureId) != null) &&
    (record.certificateStatus === null || asText(record.certificateStatus) != null) &&
    (record.certificateHash === null || asText(record.certificateHash) != null) &&
    isIntegrity(record.certificateIntegrity) &&
    (record.promotionTier === null || isClaimTier(record.promotionTier)) &&
    (record.promotionReason === null || isReasonCode(record.promotionReason)) &&
    artifactRefs.every((entry) => isArtifactRef(entry))
  );
};
