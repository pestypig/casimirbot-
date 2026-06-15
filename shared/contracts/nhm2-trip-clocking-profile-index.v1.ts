import {
  isNhm2TripClockingDiagnosticContract,
  NHM2_TRIP_CLOCKING_DIAGNOSTIC_CONTRACT_VERSION,
  type Nhm2TripClockingDiagnosticContractV1,
} from "./nhm2-trip-clocking-diagnostic.v1";

export const NHM2_TRIP_CLOCKING_PROFILE_INDEX_CONTRACT_VERSION =
  "nhm2_trip_clocking_profile_index/v1";

export type Nhm2TripClockingProfileRole =
  | "canonical_whitepaper_anchor"
  | "frontier_clocking_target"
  | "exploratory_clocking_target";

export type Nhm2TripClockingProfileClaimStatus =
  | "diagnostic_anchor"
  | "frontier_target_not_promoted"
  | "exploratory_target_not_promoted";

export type Nhm2TripClockingProfileSourceRefsV1 = {
  routeTimeWorldline: string;
  missionTimeEstimator: string;
  missionTimeComparison: string;
};

export type Nhm2TripClockingProfileIndexEntryV1 = {
  profileId: string;
  role: Nhm2TripClockingProfileRole;
  diagnosticRef: string;
  sourceRefs: Nhm2TripClockingProfileSourceRefsV1;
  sourceDiagnosticContractVersion: typeof NHM2_TRIP_CLOCKING_DIAGNOSTIC_CONTRACT_VERSION;
  alphaCenterline: number;
  fullSolveClosurePassed: boolean;
  routeEtaCertified: false;
  maxSpeedCertified: false;
  physicalViabilityClaimAllowed: false;
  oneWay: Nhm2TripClockingDiagnosticContractV1["oneWay"];
  roundTripMirrorDiagnostic: Nhm2TripClockingDiagnosticContractV1["roundTripMirrorDiagnostic"];
  speedLikeQuantities: Nhm2TripClockingDiagnosticContractV1["speedLikeQuantities"];
  claimStatus: Nhm2TripClockingProfileClaimStatus;
};

export type Nhm2TripClockingProfileIndexContractV1 = {
  contractVersion: typeof NHM2_TRIP_CLOCKING_PROFILE_INDEX_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  profileCount: number;
  profiles: Nhm2TripClockingProfileIndexEntryV1[];
  latestAliasPolicy: {
    latestAliasesAreProfileScoped: true;
    mixedProfileLatestForbidden: true;
    indexDoesNotOverrideProfileCoherence: true;
  };
  claimBoundary: {
    diagnosticOnly: true;
    comparesShipClockAccumulationOnly: true;
    doesNotCertifyShipSpeed: true;
    doesNotCertifyRouteEta: true;
    doesNotCertifyPhysicalViability: true;
    profileComparisonDoesNotPromoteLowerAlpha: true;
  };
  claimBoundaryText: string[];
  falsifierConditions: string[];
  nonClaims: string[];
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const inferNhm2TripClockingProfileRole = (
  profileId: string,
): Nhm2TripClockingProfileRole => {
  if (profileId.includes("0p995")) return "canonical_whitepaper_anchor";
  if (profileId.includes("0p7000")) return "frontier_clocking_target";
  return "exploratory_clocking_target";
};

export const inferNhm2TripClockingProfileClaimStatus = (
  role: Nhm2TripClockingProfileRole,
): Nhm2TripClockingProfileClaimStatus => {
  if (role === "canonical_whitepaper_anchor") return "diagnostic_anchor";
  if (role === "frontier_clocking_target") return "frontier_target_not_promoted";
  return "exploratory_target_not_promoted";
};

export const buildNhm2TripClockingProfileIndexContract = (args: {
  profiles: Array<{
    diagnostic: Nhm2TripClockingDiagnosticContractV1;
    diagnosticRef: string;
    sourceRefs: Nhm2TripClockingProfileSourceRefsV1;
    role?: Nhm2TripClockingProfileRole;
  }>;
  generatedAt?: string;
  laneId?: "nhm2_shift_lapse";
}): Nhm2TripClockingProfileIndexContractV1 | null => {
  if (args.profiles.length === 0) return null;

  const seenProfileIds = new Set<string>();
  const entries: Nhm2TripClockingProfileIndexEntryV1[] = [];

  for (const input of args.profiles) {
    const diagnostic = input.diagnostic;
    if (!isNhm2TripClockingDiagnosticContract(diagnostic)) return null;
    if (!isNonEmptyString(input.diagnosticRef)) return null;
    if (
      !isNonEmptyString(input.sourceRefs.routeTimeWorldline) ||
      !isNonEmptyString(input.sourceRefs.missionTimeEstimator) ||
      !isNonEmptyString(input.sourceRefs.missionTimeComparison)
    ) {
      return null;
    }

    const profileId = diagnostic.profile.selectedProfileId;
    if (seenProfileIds.has(profileId)) return null;
    seenProfileIds.add(profileId);

    const role = input.role ?? inferNhm2TripClockingProfileRole(profileId);
    entries.push({
      profileId,
      role,
      diagnosticRef: input.diagnosticRef,
      sourceRefs: input.sourceRefs,
      sourceDiagnosticContractVersion:
        NHM2_TRIP_CLOCKING_DIAGNOSTIC_CONTRACT_VERSION,
      alphaCenterline: diagnostic.profile.alphaCenterline,
      fullSolveClosurePassed: diagnostic.fullSolveClosurePassed,
      routeEtaCertified: false,
      maxSpeedCertified: false,
      physicalViabilityClaimAllowed: false,
      oneWay: diagnostic.oneWay,
      roundTripMirrorDiagnostic: diagnostic.roundTripMirrorDiagnostic,
      speedLikeQuantities: diagnostic.speedLikeQuantities,
      claimStatus: inferNhm2TripClockingProfileClaimStatus(role),
    });
  }

  return {
    contractVersion: NHM2_TRIP_CLOCKING_PROFILE_INDEX_CONTRACT_VERSION,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    laneId: args.laneId ?? "nhm2_shift_lapse",
    profileCount: entries.length,
    profiles: entries.sort((lhs, rhs) => lhs.profileId.localeCompare(rhs.profileId)),
    latestAliasPolicy: {
      latestAliasesAreProfileScoped: true,
      mixedProfileLatestForbidden: true,
      indexDoesNotOverrideProfileCoherence: true,
    },
    claimBoundary: {
      diagnosticOnly: true,
      comparesShipClockAccumulationOnly: true,
      doesNotCertifyShipSpeed: true,
      doesNotCertifyRouteEta: true,
      doesNotCertifyPhysicalViability: true,
      profileComparisonDoesNotPromoteLowerAlpha: true,
    },
    claimBoundaryText: [
      "Profile comparison is allowed only after each profile has its own coherent route-time, mission-estimator, and mission-comparison diagnostics.",
      "Latest aliases are not cross-profile evidence and must not mix 0p995 and 0p7000 surfaces.",
      "Lower-alpha profiles can be displayed as clocking targets without promoting route ETA, max speed, physical viability, or full-solve closure.",
    ],
    falsifierConditions: [
      "trip_clocking_diagnostic_missing",
      "profile_id_duplicate",
      "diagnostic_ref_missing",
      "source_ref_missing",
      "diagnostic_contract_invalid",
      "latest_alias_mixes_profiles",
    ],
    nonClaims: [
      "not a speed comparison",
      "not route-ETA authority",
      "not a physical trip result",
      "not lower-alpha promotion",
      "not full-solve closure evidence",
    ],
  };
};

export const isNhm2TripClockingProfileIndexContract = (
  value: unknown,
): value is Nhm2TripClockingProfileIndexContractV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.contractVersion !== NHM2_TRIP_CLOCKING_PROFILE_INDEX_CONTRACT_VERSION) {
    return false;
  }
  if (!isNonEmptyString(record.generatedAt)) return false;
  if (record.laneId !== "nhm2_shift_lapse") return false;
  const profileCount = toFiniteNumber(record.profileCount);
  if (profileCount == null || profileCount <= 0) return false;
  if (!Array.isArray(record.profiles) || record.profiles.length !== profileCount) {
    return false;
  }

  const seenProfileIds = new Set<string>();
  for (const rawProfile of record.profiles) {
    if (!rawProfile || typeof rawProfile !== "object") return false;
    const profile = rawProfile as Record<string, unknown>;
    if (!isNonEmptyString(profile.profileId)) return false;
    if (seenProfileIds.has(profile.profileId)) return false;
    seenProfileIds.add(profile.profileId);
    if (
      profile.role !== "canonical_whitepaper_anchor" &&
      profile.role !== "frontier_clocking_target" &&
      profile.role !== "exploratory_clocking_target"
    ) {
      return false;
    }
    if (
      profile.claimStatus !== "diagnostic_anchor" &&
      profile.claimStatus !== "frontier_target_not_promoted" &&
      profile.claimStatus !== "exploratory_target_not_promoted"
    ) {
      return false;
    }
    if (!isNonEmptyString(profile.diagnosticRef)) return false;
    const sourceRefs = profile.sourceRefs as Record<string, unknown> | undefined;
    if (
      !sourceRefs ||
      !isNonEmptyString(sourceRefs.routeTimeWorldline) ||
      !isNonEmptyString(sourceRefs.missionTimeEstimator) ||
      !isNonEmptyString(sourceRefs.missionTimeComparison)
    ) {
      return false;
    }
    const alphaCenterline = toFiniteNumber(profile.alphaCenterline);
    if (alphaCenterline == null || alphaCenterline <= 0 || alphaCenterline > 1) {
      return false;
    }
    if (profile.routeEtaCertified !== false) return false;
    if (profile.maxSpeedCertified !== false) return false;
    if (profile.physicalViabilityClaimAllowed !== false) return false;
    if (!profile.oneWay || !profile.roundTripMirrorDiagnostic) return false;
    const speedLike = profile.speedLikeQuantities as Record<string, unknown> | undefined;
    if (!speedLike || speedLike.interpretation !== "analogy_only_not_speed") {
      return false;
    }
  }

  const latestAliasPolicy =
    record.latestAliasPolicy as Record<string, unknown> | undefined;
  const claimBoundary = record.claimBoundary as Record<string, unknown> | undefined;
  return Boolean(
    latestAliasPolicy?.latestAliasesAreProfileScoped === true &&
      latestAliasPolicy.mixedProfileLatestForbidden === true &&
      latestAliasPolicy.indexDoesNotOverrideProfileCoherence === true &&
      claimBoundary?.diagnosticOnly === true &&
      claimBoundary.comparesShipClockAccumulationOnly === true &&
      claimBoundary.doesNotCertifyShipSpeed === true &&
      claimBoundary.doesNotCertifyRouteEta === true &&
      claimBoundary.doesNotCertifyPhysicalViability === true &&
      claimBoundary.profileComparisonDoesNotPromoteLowerAlpha === true &&
      Array.isArray(record.claimBoundaryText) &&
      Array.isArray(record.falsifierConditions) &&
      Array.isArray(record.nonClaims),
  );
};
