export const NHM2_STRICT_SIGNAL_READINESS_ARTIFACT_ID =
  "nhm2_strict_signal_readiness";
export const NHM2_STRICT_SIGNAL_READINESS_SCHEMA_VERSION =
  "nhm2_strict_signal_readiness/v1";

export const NHM2_STRICT_SIGNAL_READINESS_STATUS_VALUES = [
  "pass",
  "fail",
  "review",
  "unavailable",
] as const;

export const NHM2_STRICT_SIGNAL_READINESS_COMPLETENESS_VALUES = [
  "complete",
  "incomplete",
] as const;

export const NHM2_STRICT_SIGNAL_READINESS_SIGNAL_IDS = [
  "theta",
  "ts",
  "qi",
] as const;

export const NHM2_STRICT_SIGNAL_READINESS_PROVENANCE_VALUES = [
  "metric",
  "proxy",
  "missing",
] as const;

export const NHM2_STRICT_SIGNAL_READINESS_REASON_CODES = [
  "strict_signal_missing",
  "insufficient_provenance",
  "qei_applicability_non_pass",
] as const;

export const NHM2_QI_APPLICABILITY_STATUS_VALUES = [
  "PASS",
  "FAIL",
  "NOT_APPLICABLE",
  "UNKNOWN",
] as const;

export type Nhm2StrictSignalReadinessStatus =
  (typeof NHM2_STRICT_SIGNAL_READINESS_STATUS_VALUES)[number];
export type Nhm2StrictSignalReadinessCompleteness =
  (typeof NHM2_STRICT_SIGNAL_READINESS_COMPLETENESS_VALUES)[number];
export type Nhm2StrictSignalId =
  (typeof NHM2_STRICT_SIGNAL_READINESS_SIGNAL_IDS)[number];
export type Nhm2StrictSignalReadinessProvenance =
  (typeof NHM2_STRICT_SIGNAL_READINESS_PROVENANCE_VALUES)[number];
export type Nhm2StrictSignalReadinessReasonCode =
  (typeof NHM2_STRICT_SIGNAL_READINESS_REASON_CODES)[number];
export type Nhm2QiApplicabilityStatus =
  (typeof NHM2_QI_APPLICABILITY_STATUS_VALUES)[number];

export type Nhm2StrictSignalReadinessLapseSummary = {
  alphaCenterline: number | null;
  alphaMin: number | null;
  alphaMax: number | null;
  alphaProfileKind: string | null;
  alphaGradientAxis: string | null;
  shiftLapseProfileId: string | null;
  shiftLapseProfileStage: string | null;
  shiftLapseProfileLabel: string | null;
  shiftLapseProfileNote: string | null;
  signConvention: string | null;
};

export type Nhm2StrictSignalReadinessSignal = {
  signalId: Exclude<Nhm2StrictSignalId, "qi">;
  status: Nhm2StrictSignalReadinessStatus;
  metricDerived: boolean | null;
  provenance: Nhm2StrictSignalReadinessProvenance;
  sourcePath: string | null;
  reasonCode: string | null;
  reason: string | null;
};

export type Nhm2StrictSignalReadinessQiSignal = {
  signalId: "qi";
  status: Nhm2StrictSignalReadinessStatus;
  metricDerived: boolean | null;
  provenance: Nhm2StrictSignalReadinessProvenance;
  sourcePath: string | null;
  rhoSource: string | null;
  reasonCode: string | null;
  reason: string | null;
  applicabilityStatus: Nhm2QiApplicabilityStatus | null;
  applicabilityReasonCode: string | null;
};

export type Nhm2StrictSignalReadinessArtifact = {
  artifactId: typeof NHM2_STRICT_SIGNAL_READINESS_ARTIFACT_ID;
  schemaVersion: typeof NHM2_STRICT_SIGNAL_READINESS_SCHEMA_VERSION;
  status: Nhm2StrictSignalReadinessStatus;
  completeness: Nhm2StrictSignalReadinessCompleteness;
  reasonCodes: Nhm2StrictSignalReadinessReasonCode[];
  strictModeEnabled: boolean;
  family: {
    familyId: string;
    familyAuthorityStatus: string | null;
    transportCertificationStatus: string | null;
    lapseSummary: Nhm2StrictSignalReadinessLapseSummary | null;
  };
  signals: {
    theta: Nhm2StrictSignalReadinessSignal;
    ts: Nhm2StrictSignalReadinessSignal;
    qi: Nhm2StrictSignalReadinessQiSignal;
  };
  missingSignals: Nhm2StrictSignalId[];
  proxySignals: Nhm2StrictSignalId[];
  promotionInputs: {
    thetaMetricDerived: boolean;
    tsMetricDerived: boolean;
    qiMetricDerived: boolean;
    qiApplicabilityStatus: Nhm2QiApplicabilityStatus | null;
  };
  readiness: {
    promotionSignalReady: boolean;
    certifiedPromotionReady: boolean;
  };
};

type BuildSignalInput = {
  metricDerived?: boolean | null;
  provenance?: Nhm2StrictSignalReadinessProvenance | null;
  sourcePath?: string | null;
  reasonCode?: string | null;
  reason?: string | null;
};

type BuildQiSignalInput = BuildSignalInput & {
  rhoSource?: string | null;
  applicabilityStatus?: string | null;
  applicabilityReasonCode?: string | null;
};

export type BuildNhm2StrictSignalReadinessArtifactInput = {
  familyId?: string | null;
  familyAuthorityStatus?: string | null;
  transportCertificationStatus?: string | null;
  lapseSummary?: Partial<Nhm2StrictSignalReadinessLapseSummary> | null;
  strictModeEnabled?: boolean;
  theta?: BuildSignalInput | null;
  ts?: BuildSignalInput | null;
  qi?: BuildQiSignalInput | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const toNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const normalizeLapseSummary = (
  lapseSummary: Partial<Nhm2StrictSignalReadinessLapseSummary> | null | undefined,
): Nhm2StrictSignalReadinessLapseSummary | null => {
  if (!lapseSummary || typeof lapseSummary !== "object") return null;
  return {
    alphaCenterline: toFinite(lapseSummary.alphaCenterline),
    alphaMin: toFinite(lapseSummary.alphaMin),
    alphaMax: toFinite(lapseSummary.alphaMax),
    alphaProfileKind: asText(lapseSummary.alphaProfileKind),
    alphaGradientAxis: asText(lapseSummary.alphaGradientAxis),
    shiftLapseProfileId: asText(lapseSummary.shiftLapseProfileId),
    shiftLapseProfileStage: asText(lapseSummary.shiftLapseProfileStage),
    shiftLapseProfileLabel: asText(lapseSummary.shiftLapseProfileLabel),
    shiftLapseProfileNote: asText(lapseSummary.shiftLapseProfileNote),
    signConvention: asText(lapseSummary.signConvention),
  };
};

const normalizeApplicabilityStatus = (
  value: unknown,
): Nhm2QiApplicabilityStatus | null => {
  const text = asText(value);
  if (text == null) return null;
  const upper = text.toUpperCase();
  return NHM2_QI_APPLICABILITY_STATUS_VALUES.includes(
    upper as Nhm2QiApplicabilityStatus,
  )
    ? (upper as Nhm2QiApplicabilityStatus)
    : null;
};

const normalizeProvenance = (
  metricDerived: boolean | null,
  provenance: Nhm2StrictSignalReadinessProvenance | null | undefined,
): Nhm2StrictSignalReadinessProvenance => {
  if (metricDerived === true) return "metric";
  if (provenance === "proxy" || provenance === "missing") return provenance;
  return metricDerived === false ? "proxy" : "missing";
};

const resolveSignalStatus = (
  metricDerived: boolean | null,
  provenance: Nhm2StrictSignalReadinessProvenance,
): Nhm2StrictSignalReadinessStatus => {
  if (metricDerived === true) return "pass";
  if (provenance === "missing" || metricDerived == null) return "unavailable";
  return "fail";
};

const buildSignal = (
  signalId: Exclude<Nhm2StrictSignalId, "qi">,
  input: BuildSignalInput | null | undefined,
): Nhm2StrictSignalReadinessSignal => {
  const metricDerived = toNullableBoolean(input?.metricDerived);
  const provenance = normalizeProvenance(metricDerived, input?.provenance);
  return {
    signalId,
    status: resolveSignalStatus(metricDerived, provenance),
    metricDerived,
    provenance,
    sourcePath: asText(input?.sourcePath),
    reasonCode: asText(input?.reasonCode),
    reason: asText(input?.reason),
  };
};

const buildQiSignal = (
  input: BuildQiSignalInput | null | undefined,
): Nhm2StrictSignalReadinessQiSignal => {
  const metricDerived = toNullableBoolean(input?.metricDerived);
  const provenance = normalizeProvenance(metricDerived, input?.provenance);
  return {
    signalId: "qi",
    status: resolveSignalStatus(metricDerived, provenance),
    metricDerived,
    provenance,
    sourcePath: asText(input?.sourcePath),
    rhoSource: asText(input?.rhoSource),
    reasonCode: asText(input?.reasonCode),
    reason: asText(input?.reason),
    applicabilityStatus: normalizeApplicabilityStatus(input?.applicabilityStatus),
    applicabilityReasonCode: asText(input?.applicabilityReasonCode),
  };
};

const orderReasonCodes = (
  codes: Nhm2StrictSignalReadinessReasonCode[],
): Nhm2StrictSignalReadinessReasonCode[] =>
  Array.from(new Set(codes)).sort(
    (lhs, rhs) =>
      NHM2_STRICT_SIGNAL_READINESS_REASON_CODES.indexOf(lhs) -
      NHM2_STRICT_SIGNAL_READINESS_REASON_CODES.indexOf(rhs),
  );

export const buildNhm2StrictSignalReadinessArtifact = (
  args: BuildNhm2StrictSignalReadinessArtifactInput,
): Nhm2StrictSignalReadinessArtifact => {
  const theta = buildSignal("theta", args.theta);
  const ts = buildSignal("ts", args.ts);
  const qi = buildQiSignal(args.qi);
  const signals = { theta, ts, qi };

  const signalEntries: Array<
    [Nhm2StrictSignalId, Nhm2StrictSignalReadinessSignal | Nhm2StrictSignalReadinessQiSignal]
  > = [
    ["theta", theta],
    ["ts", ts],
    ["qi", qi],
  ];

  const missingSignals = signalEntries
    .filter(([, signal]) => signal.provenance === "missing")
    .map(([signalId]) => signalId);
  const proxySignals = signalEntries
    .filter(([, signal]) => signal.provenance === "proxy")
    .map(([signalId]) => signalId);

  const thetaMetricDerived = theta.metricDerived === true;
  const tsMetricDerived = ts.metricDerived === true;
  const qiMetricDerived = qi.metricDerived === true;
  const qiApplicabilityPass = qi.applicabilityStatus === "PASS";
  const promotionSignalReady =
    thetaMetricDerived &&
    tsMetricDerived &&
    qiMetricDerived &&
    qiApplicabilityPass;
  const strictModeEnabled = args.strictModeEnabled !== false;

  const reasonCodes: Nhm2StrictSignalReadinessReasonCode[] = [];
  if (!thetaMetricDerived || !tsMetricDerived || !qiMetricDerived || qi.applicabilityStatus == null) {
    reasonCodes.push("strict_signal_missing");
  }
  if (proxySignals.length > 0) {
    reasonCodes.push("insufficient_provenance");
  }
  if (qi.applicabilityStatus != null && !qiApplicabilityPass) {
    reasonCodes.push("qei_applicability_non_pass");
  }

  const completeness: Nhm2StrictSignalReadinessCompleteness =
    missingSignals.length > 0 || qi.applicabilityStatus == null
      ? "incomplete"
      : "complete";

  const familyId = asText(args.familyId) ?? "nhm2_shift_lapse";
  let status: Nhm2StrictSignalReadinessStatus;
  if (familyId !== "nhm2_shift_lapse") {
    status = "unavailable";
  } else if (!promotionSignalReady) {
    status = "fail";
  } else if (!strictModeEnabled) {
    status = "review";
  } else {
    status = "pass";
  }

  return {
    artifactId: NHM2_STRICT_SIGNAL_READINESS_ARTIFACT_ID,
    schemaVersion: NHM2_STRICT_SIGNAL_READINESS_SCHEMA_VERSION,
    status,
    completeness,
    reasonCodes: orderReasonCodes(reasonCodes),
    strictModeEnabled,
    family: {
      familyId,
      familyAuthorityStatus: asText(args.familyAuthorityStatus),
      transportCertificationStatus: asText(args.transportCertificationStatus),
      lapseSummary: normalizeLapseSummary(args.lapseSummary),
    },
    signals,
    missingSignals,
    proxySignals,
    promotionInputs: {
      thetaMetricDerived,
      tsMetricDerived,
      qiMetricDerived,
      qiApplicabilityStatus: qi.applicabilityStatus,
    },
    readiness: {
      promotionSignalReady,
      certifiedPromotionReady: strictModeEnabled && promotionSignalReady,
    },
  };
};

const isStatus = (value: unknown): value is Nhm2StrictSignalReadinessStatus =>
  NHM2_STRICT_SIGNAL_READINESS_STATUS_VALUES.includes(
    value as Nhm2StrictSignalReadinessStatus,
  );

const isCompleteness = (
  value: unknown,
): value is Nhm2StrictSignalReadinessCompleteness =>
  NHM2_STRICT_SIGNAL_READINESS_COMPLETENESS_VALUES.includes(
    value as Nhm2StrictSignalReadinessCompleteness,
  );

const isProvenance = (
  value: unknown,
): value is Nhm2StrictSignalReadinessProvenance =>
  NHM2_STRICT_SIGNAL_READINESS_PROVENANCE_VALUES.includes(
    value as Nhm2StrictSignalReadinessProvenance,
  );

const isReasonCode = (
  value: unknown,
): value is Nhm2StrictSignalReadinessReasonCode =>
  NHM2_STRICT_SIGNAL_READINESS_REASON_CODES.includes(
    value as Nhm2StrictSignalReadinessReasonCode,
  );

const isSignalId = (value: unknown): value is Nhm2StrictSignalId =>
  NHM2_STRICT_SIGNAL_READINESS_SIGNAL_IDS.includes(value as Nhm2StrictSignalId);

const isNullableBoolean = (value: unknown): value is boolean | null =>
  typeof value === "boolean" || value === null;

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isSignalRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object";

const isBaseSignal = (
  value: unknown,
  signalId: Exclude<Nhm2StrictSignalId, "qi">,
): value is Nhm2StrictSignalReadinessSignal => {
  if (!isSignalRecord(value)) return false;
  return (
    value.signalId === signalId &&
    isStatus(value.status) &&
    isNullableBoolean(value.metricDerived) &&
    isProvenance(value.provenance) &&
    (value.sourcePath === null || asText(value.sourcePath) != null) &&
    (value.reasonCode === null || asText(value.reasonCode) != null) &&
    (value.reason === null || asText(value.reason) != null)
  );
};

const isQiSignal = (
  value: unknown,
): value is Nhm2StrictSignalReadinessQiSignal => {
  if (!isSignalRecord(value)) return false;
  return (
    value.signalId === "qi" &&
    isStatus(value.status) &&
    isNullableBoolean(value.metricDerived) &&
    isProvenance(value.provenance) &&
    (value.sourcePath === null || asText(value.sourcePath) != null) &&
    (value.rhoSource === null || asText(value.rhoSource) != null) &&
    (value.reasonCode === null || asText(value.reasonCode) != null) &&
    (value.reason === null || asText(value.reason) != null) &&
    (value.applicabilityStatus === null ||
      normalizeApplicabilityStatus(value.applicabilityStatus) != null) &&
    (value.applicabilityReasonCode === null ||
      asText(value.applicabilityReasonCode) != null)
  );
};

export const isNhm2StrictSignalReadinessArtifact = (
  value: unknown,
): value is Nhm2StrictSignalReadinessArtifact => {
  if (!isSignalRecord(value)) return false;
  if (
    value.artifactId !== NHM2_STRICT_SIGNAL_READINESS_ARTIFACT_ID ||
    value.schemaVersion !== NHM2_STRICT_SIGNAL_READINESS_SCHEMA_VERSION ||
    !isStatus(value.status) ||
    !isCompleteness(value.completeness) ||
    typeof value.strictModeEnabled !== "boolean" ||
    !Array.isArray(value.reasonCodes) ||
    !value.reasonCodes.every((entry) => isReasonCode(entry))
  ) {
    return false;
  }

  if (
    !isSignalRecord(value.family) ||
    asText(value.family.familyId) == null ||
    (value.family.familyAuthorityStatus !== null &&
      asText(value.family.familyAuthorityStatus) == null) ||
    (value.family.transportCertificationStatus !== null &&
      asText(value.family.transportCertificationStatus) == null)
  ) {
    return false;
  }

  const lapseSummary = value.family.lapseSummary;
  if (
    lapseSummary !== null &&
    (!isSignalRecord(lapseSummary) ||
      !isNullableNumber(lapseSummary.alphaCenterline) ||
      !isNullableNumber(lapseSummary.alphaMin) ||
      !isNullableNumber(lapseSummary.alphaMax) ||
      (lapseSummary.alphaProfileKind !== null &&
        asText(lapseSummary.alphaProfileKind) == null) ||
      (lapseSummary.alphaGradientAxis !== null &&
        asText(lapseSummary.alphaGradientAxis) == null) ||
      (lapseSummary.shiftLapseProfileId !== null &&
        asText(lapseSummary.shiftLapseProfileId) == null) ||
      (lapseSummary.shiftLapseProfileStage !== null &&
        asText(lapseSummary.shiftLapseProfileStage) == null) ||
      (lapseSummary.shiftLapseProfileLabel !== null &&
        asText(lapseSummary.shiftLapseProfileLabel) == null) ||
      (lapseSummary.shiftLapseProfileNote !== null &&
        asText(lapseSummary.shiftLapseProfileNote) == null) ||
      (lapseSummary.signConvention !== null &&
        asText(lapseSummary.signConvention) == null))
  ) {
    return false;
  }

  if (
    !isSignalRecord(value.signals) ||
    !isBaseSignal(value.signals.theta, "theta") ||
    !isBaseSignal(value.signals.ts, "ts") ||
    !isQiSignal(value.signals.qi)
  ) {
    return false;
  }

  if (
    !Array.isArray(value.missingSignals) ||
    !value.missingSignals.every((entry) => isSignalId(entry)) ||
    !Array.isArray(value.proxySignals) ||
    !value.proxySignals.every((entry) => isSignalId(entry))
  ) {
    return false;
  }

  if (
    !isSignalRecord(value.promotionInputs) ||
    typeof value.promotionInputs.thetaMetricDerived !== "boolean" ||
    typeof value.promotionInputs.tsMetricDerived !== "boolean" ||
    typeof value.promotionInputs.qiMetricDerived !== "boolean" ||
    (value.promotionInputs.qiApplicabilityStatus !== null &&
      normalizeApplicabilityStatus(value.promotionInputs.qiApplicabilityStatus) == null)
  ) {
    return false;
  }

  if (
    !isSignalRecord(value.readiness) ||
    typeof value.readiness.promotionSignalReady !== "boolean" ||
    typeof value.readiness.certifiedPromotionReady !== "boolean"
  ) {
    return false;
  }

  return true;
};
