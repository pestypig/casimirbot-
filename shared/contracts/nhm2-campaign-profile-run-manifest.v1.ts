import type {
  Nhm2CampaignProfileSearchArtifactV1,
  Nhm2CampaignProfileSearchCandidateV1,
} from "./nhm2-campaign-profile-search.v1";

export const NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST_CONTRACT_VERSION =
  "nhm2_campaign_profile_run_manifest/v1";

export const NHM2_CAMPAIGN_PROFILE_RUN_EVIDENCE_IDS = [
  "candidate_metric_profile_spec",
  "metric_required_full_regional_tensor",
  "projected_momentum_demand_audit",
  "metric_momentum_remediation_targets",
  "source_tile_counterpart_compatibility",
  "regional_full_tensor_residuals",
  "switching_covariant_conservation",
  "frequency_convergence",
  "dynamic_effective_geometry_agreement",
  "qei_worldline_dossier",
  "observer_family_energy_conditions",
  "horizon_blueshift_particle_stability",
  "time_dependent_source_campaign",
] as const;

export type Nhm2CampaignProfileRunEvidenceId =
  (typeof NHM2_CAMPAIGN_PROFILE_RUN_EVIDENCE_IDS)[number];

export type Nhm2CampaignProfileRunCandidateStatusV1 =
  | "queued_full_campaign_required"
  | "not_queued_rejected_by_profile_screen";

export type Nhm2CampaignProfileRunEvidenceStatusV1 =
  | "provided"
  | "provided_blocked"
  | "required_missing"
  | "not_applicable_rejected_candidate";

export type Nhm2CampaignProfileRunEvidenceRequirementV1 = {
  evidenceId: Nhm2CampaignProfileRunEvidenceId;
  required: boolean;
  artifactRef: string | null;
  status: Nhm2CampaignProfileRunEvidenceStatusV1;
  blockers: string[];
};

export type Nhm2CampaignProfileRunCandidateV1 = {
  candidateProfileId: string;
  parentProfileId: string;
  alphaCenterline: number;
  proposalKind: Nhm2CampaignProfileSearchCandidateV1["proposalKind"];
  runRoot: string | null;
  queuedForFrozenCampaign: boolean;
  priorityRank: number | null;
  sourceSearchStatus: Nhm2CampaignProfileSearchCandidateV1["campaignScreen"]["status"];
  manifestStatus: Nhm2CampaignProfileRunCandidateStatusV1;
  requiredEvidence: Nhm2CampaignProfileRunEvidenceRequirementV1[];
  nextCommand: string | null;
  blockers: string[];
};

export type Nhm2CampaignProfileRunManifestArtifactV1 = {
  contractVersion: typeof NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  profileSearchRef: string | null;
  baseline: {
    parentProfileId: string;
    currentProfileRejected: boolean;
    worstRegionId: string | null;
    worstComponentId: string | null;
    worstRequiredSuppressionFactor: number | null;
  };
  runPolicy: {
    latestAliasesForbidden: true;
    onlyScreenPassCandidatesQueued: true;
    fullFrozenCampaignRequiredBeforeRankingAsAdmissible: true;
    missingEvidenceFailsClosed: true;
    fastestMeansLowestAlphaAfterCampaignPass: true;
  };
  candidates: Nhm2CampaignProfileRunCandidateV1[];
  summary: {
    candidateCount: number;
    queuedCandidateCount: number;
    rejectedCandidateCount: number;
    nextCandidateProfileId: string | null;
    firstBlocker: string | null;
    manifestComplete: boolean;
  };
  claimBoundary: {
    diagnosticOnly: true;
    runManifestDoesNotEvaluateCampaign: true;
    queuedCandidateDoesNotValidateProfile: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2CampaignProfileRunManifestInput = {
  generatedAt?: string | null;
  profileSearch: Nhm2CampaignProfileSearchArtifactV1;
  profileSearchRef?: string | null;
  runRootBase?: string | null;
  candidateEvidenceRefs?: Record<
    string,
    Partial<Record<Nhm2CampaignProfileRunEvidenceId, string | Nhm2CampaignProfileRunEvidenceInput>>
  > | null;
};

export type Nhm2CampaignProfileRunEvidenceInput = {
  artifactRef: string;
  blockers?: string[] | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const evidenceRequirementFor = (
  evidenceId: Nhm2CampaignProfileRunEvidenceId,
  queued: boolean,
  evidence?: string | Nhm2CampaignProfileRunEvidenceInput | null,
): Nhm2CampaignProfileRunEvidenceRequirementV1 => {
  const artifactRef =
    typeof evidence === "string" ? evidence : evidence?.artifactRef ?? null;
  const evidenceBlockers =
    typeof evidence === "string"
      ? []
      : evidence?.blockers?.filter(
          (entry) => entry.trim().length > 0 && entry.trim().toLowerCase() !== "none",
        ) ?? [];
  return {
    evidenceId,
    required: queued,
    artifactRef,
    status:
      queued && artifactRef != null && evidenceBlockers.length > 0
        ? "provided_blocked"
        : queued && artifactRef != null
          ? "provided"
          : queued
            ? "required_missing"
            : "not_applicable_rejected_candidate",
    blockers:
      queued && artifactRef != null
        ? evidenceBlockers
        : queued
          ? [`${evidenceId}_missing_for_frozen_campaign_run`]
          : ["candidate_rejected_by_profile_screen"],
  };
};

const buildNextCommand = (candidateProfileId: string, runRoot: string): string =>
  [
    "npm run nhm2:build-time-dependent-source-campaign --",
    `--selected-profile-id ${candidateProfileId}`,
    `--out ${runRoot}/nhm2-time-dependent-source-campaign.json`,
    "--require-frozen-inputs",
  ].join(" ");

const buildCandidate = (
  candidate: Nhm2CampaignProfileSearchCandidateV1,
  runRootBase: string,
  priorityRank: number | null,
  evidenceRefs: Partial<Record<Nhm2CampaignProfileRunEvidenceId, string | Nhm2CampaignProfileRunEvidenceInput>> | null,
): Nhm2CampaignProfileRunCandidateV1 => {
  const queued =
    candidate.campaignScreen.status === "screen_pass_needs_campaign_run";
  const runRoot = queued ? `${runRootBase}/${candidate.candidateProfileId}` : null;
  const requiredEvidence = NHM2_CAMPAIGN_PROFILE_RUN_EVIDENCE_IDS.map((evidenceId) =>
    evidenceRequirementFor(evidenceId, queued, evidenceRefs?.[evidenceId] ?? null),
  );
  const queuedBlockers = requiredEvidence.flatMap((entry) =>
    entry.status === "provided_blocked" || entry.status === "required_missing"
      ? entry.blockers
      : [],
  );
  return {
    candidateProfileId: candidate.candidateProfileId,
    parentProfileId: candidate.parentProfileId,
    alphaCenterline: candidate.alphaCenterline,
    proposalKind: candidate.proposalKind,
    runRoot,
    queuedForFrozenCampaign: queued,
    priorityRank,
    sourceSearchStatus: candidate.campaignScreen.status,
    manifestStatus: queued
      ? "queued_full_campaign_required"
      : "not_queued_rejected_by_profile_screen",
    requiredEvidence,
    nextCommand: queued && runRoot != null ? buildNextCommand(candidate.candidateProfileId, runRoot) : null,
    blockers: queued
      ? queuedBlockers.length > 0
        ? queuedBlockers
        : []
      : candidate.campaignScreen.blockers,
  };
};

export const buildNhm2CampaignProfileRunManifest = (
  input: BuildNhm2CampaignProfileRunManifestInput,
): Nhm2CampaignProfileRunManifestArtifactV1 => {
  const screenPassIds = new Set(
    input.profileSearch.candidates
      .filter(
        (candidate) =>
          candidate.campaignScreen.status === "screen_pass_needs_campaign_run",
      )
      .sort((lhs, rhs) => lhs.alphaCenterline - rhs.alphaCenterline)
      .map((candidate) => candidate.candidateProfileId),
  );
  const rankById = new Map(
    [...screenPassIds].map((candidateId, index) => [candidateId, index + 1]),
  );
  const runRootBase =
    input.runRootBase ??
    "artifacts/research/full-solve/profile-campaign-runs";
  const candidates = input.profileSearch.candidates.map((candidate) =>
    buildCandidate(
      candidate,
      runRootBase,
      rankById.get(candidate.candidateProfileId) ?? null,
      input.candidateEvidenceRefs?.[candidate.candidateProfileId] ?? null,
    ),
  );
  const queuedCandidates = candidates.filter(
    (candidate) => candidate.queuedForFrozenCampaign,
  );
  const nextCandidate =
    queuedCandidates
      .slice()
      .sort((lhs, rhs) => (lhs.priorityRank ?? Infinity) - (rhs.priorityRank ?? Infinity))[0] ?? null;
  const nextCandidateFirstEvidenceBlocker =
    nextCandidate?.requiredEvidence.find(
      (entry) => entry.status === "provided_blocked" || entry.status === "required_missing",
    )?.blockers[0] ?? null;

  return {
    contractVersion: NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    profileSearchRef: input.profileSearchRef ?? null,
    baseline: {
      parentProfileId: input.profileSearch.baseline.selectedProfileId,
      currentProfileRejected: input.profileSearch.baseline.currentProfileRejected,
      worstRegionId: input.profileSearch.baseline.worstRegionId,
      worstComponentId: input.profileSearch.baseline.worstComponentId,
      worstRequiredSuppressionFactor:
        input.profileSearch.baseline.worstRequiredSuppressionFactor,
    },
    runPolicy: {
      latestAliasesForbidden: true,
      onlyScreenPassCandidatesQueued: true,
      fullFrozenCampaignRequiredBeforeRankingAsAdmissible: true,
      missingEvidenceFailsClosed: true,
      fastestMeansLowestAlphaAfterCampaignPass: true,
    },
    candidates,
    summary: {
      candidateCount: candidates.length,
      queuedCandidateCount: queuedCandidates.length,
      rejectedCandidateCount: candidates.length - queuedCandidates.length,
      nextCandidateProfileId: nextCandidate?.candidateProfileId ?? null,
      firstBlocker:
        nextCandidate == null
          ? "no_screened_candidate_available_for_frozen_campaign_run"
          : nextCandidateFirstEvidenceBlocker ?? "candidate_frozen_campaign_evidence_missing",
      manifestComplete: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      runManifestDoesNotEvaluateCampaign: true,
      queuedCandidateDoesNotValidateProfile: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

const isEvidenceRequirement = (
  value: unknown,
): value is Nhm2CampaignProfileRunEvidenceRequirementV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.evidenceId === "string" &&
    NHM2_CAMPAIGN_PROFILE_RUN_EVIDENCE_IDS.includes(
      record.evidenceId as Nhm2CampaignProfileRunEvidenceId,
    ) &&
    typeof record.required === "boolean" &&
    isNullableText(record.artifactRef) &&
      (record.status === "required_missing" ||
      record.status === "provided" ||
      record.status === "provided_blocked" ||
      record.status === "not_applicable_rejected_candidate") &&
    Array.isArray(record.blockers)
  );
};

const isCandidate = (
  value: unknown,
): value is Nhm2CampaignProfileRunCandidateV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.candidateProfileId === "string" &&
    typeof record.parentProfileId === "string" &&
    isFiniteNumber(record.alphaCenterline) &&
    typeof record.proposalKind === "string" &&
    isNullableText(record.runRoot) &&
    typeof record.queuedForFrozenCampaign === "boolean" &&
    isNullableNumber(record.priorityRank) &&
    typeof record.sourceSearchStatus === "string" &&
    (record.manifestStatus === "queued_full_campaign_required" ||
      record.manifestStatus === "not_queued_rejected_by_profile_screen") &&
    Array.isArray(record.requiredEvidence) &&
    record.requiredEvidence.every(isEvidenceRequirement) &&
    isNullableText(record.nextCommand) &&
    Array.isArray(record.blockers)
  );
};

export const isNhm2CampaignProfileRunManifest = (
  value: unknown,
): value is Nhm2CampaignProfileRunManifestArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const baseline = isRecord(record?.baseline) ? record.baseline : null;
  const runPolicy = isRecord(record?.runPolicy) ? record.runPolicy : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_CAMPAIGN_PROFILE_RUN_MANIFEST_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    record.laneId === "nhm2_shift_lapse" &&
    isNullableText(record.profileSearchRef) &&
    baseline != null &&
    typeof baseline.parentProfileId === "string" &&
    typeof baseline.currentProfileRejected === "boolean" &&
    isNullableText(baseline.worstRegionId) &&
    isNullableText(baseline.worstComponentId) &&
    isNullableNumber(baseline.worstRequiredSuppressionFactor) &&
    runPolicy?.latestAliasesForbidden === true &&
    runPolicy.onlyScreenPassCandidatesQueued === true &&
    runPolicy.fullFrozenCampaignRequiredBeforeRankingAsAdmissible === true &&
    runPolicy.missingEvidenceFailsClosed === true &&
    runPolicy.fastestMeansLowestAlphaAfterCampaignPass === true &&
    Array.isArray(record.candidates) &&
    record.candidates.every(isCandidate) &&
    summary != null &&
    typeof summary.candidateCount === "number" &&
    typeof summary.queuedCandidateCount === "number" &&
    typeof summary.rejectedCandidateCount === "number" &&
    isNullableText(summary.nextCandidateProfileId) &&
    isNullableText(summary.firstBlocker) &&
    summary.manifestComplete === false &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.runManifestDoesNotEvaluateCampaign === true &&
    claimBoundary.queuedCandidateDoesNotValidateProfile === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false
  );
};
