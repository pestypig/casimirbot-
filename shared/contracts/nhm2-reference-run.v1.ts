export const NHM2_REFERENCE_RUN_ARTIFACT_ID = "nhm2_reference_run";
export const NHM2_REFERENCE_RUN_SCHEMA_VERSION = "nhm2_reference_run/v1";
export const NHM2_REFERENCE_RUN_LANE_ID = "nhm2_shift_lapse";

export const NHM2_REFERENCE_RUN_CLAIM_TIERS = [
  "diagnostic",
  "reduced-order",
  "certified",
  "unknown",
] as const;

export const NHM2_REFERENCE_RUN_STATES = [
  "pass",
  "review",
  "fail",
  "unknown",
] as const;

export const NHM2_REFERENCE_RUN_EXTENDED_STATES = [
  "pass",
  "review",
  "fail",
  "missing",
  "unknown",
] as const;

export type Nhm2ReferenceRunClaimTier =
  (typeof NHM2_REFERENCE_RUN_CLAIM_TIERS)[number];
export type Nhm2ReferenceRunState = (typeof NHM2_REFERENCE_RUN_STATES)[number];
export type Nhm2ReferenceRunExtendedState =
  (typeof NHM2_REFERENCE_RUN_EXTENDED_STATES)[number];

export type Nhm2ReferenceRunArtifact = {
  artifactId: typeof NHM2_REFERENCE_RUN_ARTIFACT_ID;
  schemaVersion: typeof NHM2_REFERENCE_RUN_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  repo: {
    repositoryFullName: string;
    branch: string;
    commitSha: string;
    dirtyTreeStatus: "clean" | "dirty" | "unknown";
  };
  selectedFamily: {
    laneId: typeof NHM2_REFERENCE_RUN_LANE_ID;
    selectedProfileId: string;
    expectedProfileId: string;
    profileMatch: boolean;
  };
  claimLock: {
    currentClaimTier: Nhm2ReferenceRunClaimTier;
    maximumClaimTier: Nhm2ReferenceRunClaimTier;
    validationMode: "red_team_hardening";
    validationClaimAllowed: false;
    latestAliasForbidden: true;
  };
  commands: Array<{
    id: string;
    command: string;
    status: "pass" | "fail" | "not_run";
    startedAt: string | null;
    completedAt: string | null;
  }>;
  artifactSet: Array<{
    artifactId: string;
    path: string;
    schemaVersion: string | null;
    status: string | null;
    sha256: string | null;
    generatedAt: string | null;
    usesLatestAlias: boolean;
    profileId: string | null;
    profileMatch: boolean | null;
  }>;
  hashLock: {
    inputManifestSha256: string | null;
    toleranceManifestSha256: string | null;
    artifactSetSha256: string | null;
    literatureClaimMapSha256: string | null;
  };
  blockerSummary: {
    overallState: Nhm2ReferenceRunState;
    blockingReasons: string[];
    observerConsistencyStatus: Nhm2ReferenceRunState;
    sourceClosureRegionalStatus: Nhm2ReferenceRunState;
    qeiDossierStatus: Nhm2ReferenceRunExtendedState;
    reproducibilityStatus: Nhm2ReferenceRunExtendedState;
  };
};

export type BuildNhm2ReferenceRunArtifactInput = Omit<
  Nhm2ReferenceRunArtifact,
  "artifactId" | "schemaVersion"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const isNullableBoolean = (value: unknown): value is boolean | null =>
  value === null || isBoolean(value);

const isClaimTier = (value: unknown): value is Nhm2ReferenceRunClaimTier =>
  NHM2_REFERENCE_RUN_CLAIM_TIERS.includes(value as Nhm2ReferenceRunClaimTier);

const isState = (value: unknown): value is Nhm2ReferenceRunState =>
  NHM2_REFERENCE_RUN_STATES.includes(value as Nhm2ReferenceRunState);

const isExtendedState = (value: unknown): value is Nhm2ReferenceRunExtendedState =>
  NHM2_REFERENCE_RUN_EXTENDED_STATES.includes(
    value as Nhm2ReferenceRunExtendedState,
  );

const isDirtyTreeStatus = (
  value: unknown,
): value is Nhm2ReferenceRunArtifact["repo"]["dirtyTreeStatus"] =>
  value === "clean" || value === "dirty" || value === "unknown";

const isCommandStatus = (
  value: unknown,
): value is Nhm2ReferenceRunArtifact["commands"][number]["status"] =>
  value === "pass" || value === "fail" || value === "not_run";

const hasLatestAlias = (path: string): boolean =>
  /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const isCommand = (
  value: unknown,
): value is Nhm2ReferenceRunArtifact["commands"][number] => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isText(record.id) &&
    isText(record.command) &&
    isCommandStatus(record.status) &&
    isNullableText(record.startedAt) &&
    isNullableText(record.completedAt)
  );
};

const isArtifactSetEntry = (
  value: unknown,
): value is Nhm2ReferenceRunArtifact["artifactSet"][number] => {
  const record = isRecord(value) ? value : null;
  if (record == null) return false;
  if (!isText(record.artifactId) || !isText(record.path)) return false;
  if (!isNullableText(record.schemaVersion)) return false;
  if (!isNullableText(record.status)) return false;
  if (!isNullableText(record.sha256)) return false;
  if (!isNullableText(record.generatedAt)) return false;
  if (!isBoolean(record.usesLatestAlias)) return false;
  if (!isNullableText(record.profileId)) return false;
  if (!isNullableBoolean(record.profileMatch)) return false;
  return record.usesLatestAlias === hasLatestAlias(record.path);
};

export const buildNhm2ReferenceRunArtifact = (
  input: BuildNhm2ReferenceRunArtifactInput,
): Nhm2ReferenceRunArtifact => ({
  artifactId: NHM2_REFERENCE_RUN_ARTIFACT_ID,
  schemaVersion: NHM2_REFERENCE_RUN_SCHEMA_VERSION,
  ...input,
  selectedFamily: {
    ...input.selectedFamily,
    laneId: NHM2_REFERENCE_RUN_LANE_ID,
    profileMatch:
      input.selectedFamily.selectedProfileId ===
      input.selectedFamily.expectedProfileId,
  },
  claimLock: {
    ...input.claimLock,
    validationMode: "red_team_hardening",
    validationClaimAllowed: false,
    latestAliasForbidden: true,
  },
  artifactSet: input.artifactSet.map((entry) => ({
    ...entry,
    usesLatestAlias: hasLatestAlias(entry.path),
    profileMatch:
      entry.profileId == null
        ? null
        : entry.profileId === input.selectedFamily.expectedProfileId,
  })),
});

export const isNhm2ReferenceRunArtifact = (
  value: unknown,
): value is Nhm2ReferenceRunArtifact => {
  const record = isRecord(value) ? value : null;
  if (record == null) return false;
  if (record.artifactId !== NHM2_REFERENCE_RUN_ARTIFACT_ID) return false;
  if (record.schemaVersion !== NHM2_REFERENCE_RUN_SCHEMA_VERSION) return false;
  if (!isText(record.generatedAt) || !isText(record.runId)) return false;

  const repo = isRecord(record.repo) ? record.repo : null;
  if (
    repo == null ||
    !isText(repo.repositoryFullName) ||
    !isText(repo.branch) ||
    !isText(repo.commitSha) ||
    !isDirtyTreeStatus(repo.dirtyTreeStatus)
  ) {
    return false;
  }

  const selectedFamily = isRecord(record.selectedFamily)
    ? record.selectedFamily
    : null;
  if (
    selectedFamily == null ||
    selectedFamily.laneId !== NHM2_REFERENCE_RUN_LANE_ID ||
    !isText(selectedFamily.selectedProfileId) ||
    !isText(selectedFamily.expectedProfileId) ||
    !isBoolean(selectedFamily.profileMatch) ||
    selectedFamily.profileMatch !==
      (selectedFamily.selectedProfileId === selectedFamily.expectedProfileId)
  ) {
    return false;
  }

  const claimLock = isRecord(record.claimLock) ? record.claimLock : null;
  if (
    claimLock == null ||
    !isClaimTier(claimLock.currentClaimTier) ||
    !isClaimTier(claimLock.maximumClaimTier) ||
    claimLock.validationMode !== "red_team_hardening" ||
    claimLock.validationClaimAllowed !== false ||
    claimLock.latestAliasForbidden !== true
  ) {
    return false;
  }

  if (!Array.isArray(record.commands) || !record.commands.every(isCommand)) {
    return false;
  }
  if (
    !Array.isArray(record.artifactSet) ||
    !record.artifactSet.every(isArtifactSetEntry)
  ) {
    return false;
  }
  if (
    record.artifactSet.some(
      (entry) =>
        (entry as Nhm2ReferenceRunArtifact["artifactSet"][number])
          .usesLatestAlias,
    )
  ) {
    return false;
  }
  if (
    record.artifactSet.some(
      (entry) =>
        (entry as Nhm2ReferenceRunArtifact["artifactSet"][number])
          .profileMatch === false,
    )
  ) {
    return false;
  }

  const hashLock = isRecord(record.hashLock) ? record.hashLock : null;
  if (
    hashLock == null ||
    !isNullableText(hashLock.inputManifestSha256) ||
    !isNullableText(hashLock.toleranceManifestSha256) ||
    !isNullableText(hashLock.artifactSetSha256) ||
    !isNullableText(hashLock.literatureClaimMapSha256)
  ) {
    return false;
  }

  const blockerSummary = isRecord(record.blockerSummary)
    ? record.blockerSummary
    : null;
  return (
    blockerSummary != null &&
    isState(blockerSummary.overallState) &&
    Array.isArray(blockerSummary.blockingReasons) &&
    blockerSummary.blockingReasons.every(isText) &&
    isState(blockerSummary.observerConsistencyStatus) &&
    isState(blockerSummary.sourceClosureRegionalStatus) &&
    isExtendedState(blockerSummary.qeiDossierStatus) &&
    isExtendedState(blockerSummary.reproducibilityStatus)
  );
};
