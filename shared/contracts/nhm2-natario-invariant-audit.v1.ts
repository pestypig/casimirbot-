export const NHM2_NATARIO_INVARIANT_AUDIT_CONTRACT_VERSION =
  "nhm2_natario_invariant_audit/v1";

export const NHM2_NATARIO_THETA_FLATNESS_STATUS_VALUES = [
  "pass",
  "fail",
  "missing",
] as const;

export const NHM2_NATARIO_INVARIANT_STATUS_VALUES = [
  "computed",
  "partial",
  "missing",
] as const;

export const NHM2_NATARIO_MOMENTUM_DENSITY_STATUS_VALUES = [
  "computed",
  "partial",
  "missing",
] as const;

export const NHM2_NATARIO_CONVERGENCE_STATUS_VALUES = [
  "pass",
  "fail",
  "missing",
  "not_run",
] as const;

export type Nhm2NatarioThetaFlatnessStatus =
  (typeof NHM2_NATARIO_THETA_FLATNESS_STATUS_VALUES)[number];

export type Nhm2NatarioInvariantStatus =
  (typeof NHM2_NATARIO_INVARIANT_STATUS_VALUES)[number];

export type Nhm2NatarioMomentumDensityStatus =
  (typeof NHM2_NATARIO_MOMENTUM_DENSITY_STATUS_VALUES)[number];

export type Nhm2NatarioConvergenceStatus =
  (typeof NHM2_NATARIO_CONVERGENCE_STATUS_VALUES)[number];

export type Nhm2NatarioInvariantAuditV1 = {
  contractVersion: typeof NHM2_NATARIO_INVARIANT_AUDIT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  metricFamily: "natario_zero_expansion" | "nhm2_shift_lapse" | string;
  expansion: {
    thetaMaxAbs: number | null;
    thetaFlatnessStatus: Nhm2NatarioThetaFlatnessStatus;
    expansionLeakageBound: number | null;
  };
  invariants: {
    ricciScalar: number | null;
    kretschmannScalar: number | null;
    weylScalarProxy: number | null;
    petrovClass: string | null;
    status: Nhm2NatarioInvariantStatus;
  };
  momentumDensity: {
    Jx: number | null;
    Jy: number | null;
    Jz: number | null;
    status: Nhm2NatarioMomentumDensityStatus;
  };
  stability: {
    tidalMax: number | null;
    blueshiftMax: number | null;
    convergenceStatus: Nhm2NatarioConvergenceStatus;
  };
  literatureRefs: ["rodal_2025_natario_zero_expansion_analysis"];
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    zeroExpansionIsNotSafetyCertificate: true;
  };
};

export type BuildNhm2NatarioInvariantAuditInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  metricFamily?: string | null;
  expansion?: {
    thetaMaxAbs?: number | null;
    thetaFlatnessStatus?: Nhm2NatarioThetaFlatnessStatus | string | null;
    expansionLeakageBound?: number | null;
  } | null;
  invariants?: {
    ricciScalar?: number | null;
    kretschmannScalar?: number | null;
    weylScalarProxy?: number | null;
    petrovClass?: string | null;
    status?: Nhm2NatarioInvariantStatus | string | null;
  } | null;
  momentumDensity?: {
    Jx?: number | null;
    Jy?: number | null;
    Jz?: number | null;
    status?: Nhm2NatarioMomentumDensityStatus | string | null;
  } | null;
  stability?: {
    tidalMax?: number | null;
    blueshiftMax?: number | null;
    convergenceStatus?: Nhm2NatarioConvergenceStatus | string | null;
  } | null;
  blockers?: string[] | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((entry) => asText(entry))
        .filter((entry): entry is string => entry != null),
    ),
  );

const isThetaFlatnessStatus = (
  value: unknown,
): value is Nhm2NatarioThetaFlatnessStatus =>
  NHM2_NATARIO_THETA_FLATNESS_STATUS_VALUES.includes(
    value as Nhm2NatarioThetaFlatnessStatus,
  );

const isInvariantStatus = (
  value: unknown,
): value is Nhm2NatarioInvariantStatus =>
  NHM2_NATARIO_INVARIANT_STATUS_VALUES.includes(
    value as Nhm2NatarioInvariantStatus,
  );

const isMomentumDensityStatus = (
  value: unknown,
): value is Nhm2NatarioMomentumDensityStatus =>
  NHM2_NATARIO_MOMENTUM_DENSITY_STATUS_VALUES.includes(
    value as Nhm2NatarioMomentumDensityStatus,
  );

const isConvergenceStatus = (
  value: unknown,
): value is Nhm2NatarioConvergenceStatus =>
  NHM2_NATARIO_CONVERGENCE_STATUS_VALUES.includes(
    value as Nhm2NatarioConvergenceStatus,
  );

const normalizeThetaFlatnessStatus = (
  value: unknown,
  thetaMaxAbs: number | null,
  expansionLeakageBound: number | null,
): Nhm2NatarioThetaFlatnessStatus => {
  if (isThetaFlatnessStatus(value)) return value;
  const normalized = asText(value)?.toLowerCase();
  if (isThetaFlatnessStatus(normalized)) return normalized;
  if (thetaMaxAbs == null || expansionLeakageBound == null) return "missing";
  return Math.abs(thetaMaxAbs) <= Math.abs(expansionLeakageBound) ? "pass" : "fail";
};

const normalizeInvariantStatus = (
  value: unknown,
  entries: Array<number | string | null>,
): Nhm2NatarioInvariantStatus => {
  if (isInvariantStatus(value)) return value;
  const present = entries.filter((entry) => entry != null).length;
  if (present === entries.length) return "computed";
  return present > 0 ? "partial" : "missing";
};

const normalizeMomentumDensityStatus = (
  value: unknown,
  entries: Array<number | null>,
): Nhm2NatarioMomentumDensityStatus => {
  if (isMomentumDensityStatus(value)) return value;
  const present = entries.filter((entry) => entry != null).length;
  if (present === entries.length) return "computed";
  return present > 0 ? "partial" : "missing";
};

const normalizeConvergenceStatus = (
  value: unknown,
): Nhm2NatarioConvergenceStatus => {
  if (isConvergenceStatus(value)) return value;
  const normalized = asText(value)?.toLowerCase();
  return isConvergenceStatus(normalized) ? normalized : "not_run";
};

export const buildNhm2NatarioInvariantAudit = (
  input: BuildNhm2NatarioInvariantAuditInput = {},
): Nhm2NatarioInvariantAuditV1 => {
  const thetaMaxAbsRaw = toFinite(input.expansion?.thetaMaxAbs);
  const thetaMaxAbs = thetaMaxAbsRaw == null ? null : Math.abs(thetaMaxAbsRaw);
  const expansionLeakageBound = toFinite(input.expansion?.expansionLeakageBound);
  const thetaFlatnessStatus = normalizeThetaFlatnessStatus(
    input.expansion?.thetaFlatnessStatus,
    thetaMaxAbs,
    expansionLeakageBound,
  );

  const ricciScalar = toFinite(input.invariants?.ricciScalar);
  const kretschmannScalar = toFinite(input.invariants?.kretschmannScalar);
  const weylScalarProxy = toFinite(input.invariants?.weylScalarProxy);
  const petrovClass = asText(input.invariants?.petrovClass);
  const invariantStatus = normalizeInvariantStatus(input.invariants?.status, [
    ricciScalar,
    kretschmannScalar,
    weylScalarProxy,
    petrovClass,
  ]);

  const Jx = toFinite(input.momentumDensity?.Jx);
  const Jy = toFinite(input.momentumDensity?.Jy);
  const Jz = toFinite(input.momentumDensity?.Jz);
  const momentumDensityStatus = normalizeMomentumDensityStatus(
    input.momentumDensity?.status,
    [Jx, Jy, Jz],
  );

  const tidalMax = toFinite(input.stability?.tidalMax);
  const blueshiftMax = toFinite(input.stability?.blueshiftMax);
  const convergenceStatus = normalizeConvergenceStatus(
    input.stability?.convergenceStatus,
  );

  const blockers = uniqueStrings([
    ...(input.blockers ?? []),
    thetaFlatnessStatus === "fail" ? "theta_flatness_failed" : null,
    thetaFlatnessStatus === "missing" ? "theta_flatness_missing" : null,
    invariantStatus === "missing" ? "curvature_invariants_missing" : null,
    invariantStatus === "partial" ? "curvature_invariants_partial" : null,
    momentumDensityStatus === "missing" ? "momentum_density_missing" : null,
    momentumDensityStatus === "partial" ? "momentum_density_partial" : null,
    tidalMax == null ? "tidal_behavior_missing" : null,
    blueshiftMax == null ? "blueshift_diagnostic_missing" : null,
    convergenceStatus === "fail" ? "convergence_failed" : null,
    convergenceStatus === "missing" ? "convergence_missing" : null,
    convergenceStatus === "not_run" ? "convergence_not_run" : null,
  ]);

  return {
    contractVersion: NHM2_NATARIO_INVARIANT_AUDIT_CONTRACT_VERSION,
    generatedAt: asText(input.generatedAt) ?? new Date(0).toISOString(),
    laneId: asText(input.laneId) ?? "nhm2_shift_lapse",
    selectedProfileId: asText(input.selectedProfileId) ?? "runtime",
    metricFamily: asText(input.metricFamily) ?? "nhm2_shift_lapse",
    expansion: {
      thetaMaxAbs,
      thetaFlatnessStatus,
      expansionLeakageBound,
    },
    invariants: {
      ricciScalar,
      kretschmannScalar,
      weylScalarProxy,
      petrovClass,
      status: invariantStatus,
    },
    momentumDensity: {
      Jx,
      Jy,
      Jz,
      status: momentumDensityStatus,
    },
    stability: {
      tidalMax,
      blueshiftMax,
      convergenceStatus,
    },
    literatureRefs: ["rodal_2025_natario_zero_expansion_analysis"],
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      zeroExpansionIsNotSafetyCertificate: true,
    },
  };
};

const isFiniteOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

export const isNhm2NatarioInvariantAudit = (
  value: unknown,
): value is Nhm2NatarioInvariantAuditV1 => {
  const record = asRecord(value);
  if (record == null) return false;
  const expansion = asRecord(record.expansion);
  const invariants = asRecord(record.invariants);
  const momentumDensity = asRecord(record.momentumDensity);
  const stability = asRecord(record.stability);
  const claimBoundary = asRecord(record.claimBoundary);
  return (
    record.contractVersion === NHM2_NATARIO_INVARIANT_AUDIT_CONTRACT_VERSION &&
    asText(record.generatedAt) != null &&
    asText(record.laneId) != null &&
    asText(record.selectedProfileId) != null &&
    asText(record.metricFamily) != null &&
    expansion != null &&
    isFiniteOrNull(expansion.thetaMaxAbs) &&
    isThetaFlatnessStatus(expansion.thetaFlatnessStatus) &&
    isFiniteOrNull(expansion.expansionLeakageBound) &&
    invariants != null &&
    isFiniteOrNull(invariants.ricciScalar) &&
    isFiniteOrNull(invariants.kretschmannScalar) &&
    isFiniteOrNull(invariants.weylScalarProxy) &&
    (invariants.petrovClass === null || asText(invariants.petrovClass) != null) &&
    isInvariantStatus(invariants.status) &&
    momentumDensity != null &&
    isFiniteOrNull(momentumDensity.Jx) &&
    isFiniteOrNull(momentumDensity.Jy) &&
    isFiniteOrNull(momentumDensity.Jz) &&
    isMomentumDensityStatus(momentumDensity.status) &&
    stability != null &&
    isFiniteOrNull(stability.tidalMax) &&
    isFiniteOrNull(stability.blueshiftMax) &&
    isConvergenceStatus(stability.convergenceStatus) &&
    isStringArray(record.blockers) &&
    Array.isArray(record.literatureRefs) &&
    record.literatureRefs.length === 1 &&
    record.literatureRefs[0] === "rodal_2025_natario_zero_expansion_analysis" &&
    claimBoundary != null &&
    claimBoundary.diagnosticOnly === true &&
    claimBoundary.zeroExpansionIsNotSafetyCertificate === true
  );
};
