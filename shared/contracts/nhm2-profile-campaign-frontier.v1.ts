import {
  NHM2_CAMPAIGN_PROFILE_RUN_EVIDENCE_IDS,
  type Nhm2CampaignProfileRunCandidateV1,
  type Nhm2CampaignProfileRunEvidenceId,
  type Nhm2CampaignProfileRunManifestArtifactV1,
} from "./nhm2-campaign-profile-run-manifest.v1";

export const NHM2_PROFILE_CAMPAIGN_FRONTIER_CONTRACT_VERSION =
  "nhm2_profile_campaign_frontier/v1";

export type Nhm2ProfileCampaignFrontierCandidateStatusV1 =
  | "campaign_admissible_diagnostic_candidate"
  | "blocked_campaign_candidate"
  | "rejected_profile_screen";

export type Nhm2ProfileCampaignFrontierCandidateV1 = {
  candidateProfileId: string;
  alphaCenterline: number;
  proposalKind: Nhm2CampaignProfileRunCandidateV1["proposalKind"];
  priorityRank: number | null;
  status: Nhm2ProfileCampaignFrontierCandidateStatusV1;
  runRoot: string | null;
  fastestRankEligible: boolean;
  missingEvidenceIds: Nhm2CampaignProfileRunEvidenceId[];
  blockedEvidenceIds: Nhm2CampaignProfileRunEvidenceId[];
  firstBlocker: string | null;
  blockers: string[];
};

export type Nhm2ProfileCampaignFrontierArtifactV1 = {
  contractVersion: typeof NHM2_PROFILE_CAMPAIGN_FRONTIER_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  campaignProfileRunManifestRef: string | null;
  baseline: Nhm2CampaignProfileRunManifestArtifactV1["baseline"];
  rankingPolicy: {
    fastestMeans: "lowest_alpha_after_campaign_evidence_pass";
    allCampaignEvidenceRequired: true;
    missingEvidenceFailsClosed: true;
    blockedEvidenceFailsClosed: true;
    alphaOnlyRejectedProfilesCannotWin: true;
    latestAliasesForbidden: true;
  };
  candidates: Nhm2ProfileCampaignFrontierCandidateV1[];
  frontier: {
    fastestCampaignAdmissibleProfileId: string | null;
    fastestBlockedProfileId: string | null;
    fastestRejectedProfileId: string | null;
    recommendedNextProfileId: string | null;
    firstBlocker: string | null;
    recommendationReason:
      | "run_or_repair_fastest_blocked_candidate_evidence"
      | "campaign_admissible_diagnostic_profile_available"
      | "no_queued_candidate_available";
  };
  summary: {
    candidateCount: number;
    admissibleDiagnosticCandidateCount: number;
    blockedCandidateCount: number;
    rejectedCandidateCount: number;
    fastestAdmissibleAlpha: number | null;
    fastestBlockedAlpha: number | null;
    profileCampaignFrontierComplete: boolean;
  };
  claimBoundary: {
    diagnosticOnly: true;
    profileFrontierDoesNotValidateProfile: true;
    fastestDiagnosticDoesNotCertifyRouteEta: true;
    fastestDiagnosticDoesNotCertifyTransport: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2ProfileCampaignFrontierInput = {
  generatedAt?: string | null;
  campaignProfileRunManifest: Nhm2CampaignProfileRunManifestArtifactV1;
  campaignProfileRunManifestRef?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const sortByFastest = <
  T extends { alphaCenterline: number; priorityRank: number | null },
>(
  candidates: T[],
): T[] =>
  candidates
    .slice()
    .sort(
      (lhs, rhs) =>
        lhs.alphaCenterline - rhs.alphaCenterline ||
        (lhs.priorityRank ?? Infinity) - (rhs.priorityRank ?? Infinity),
    );

const buildFrontierCandidate = (
  candidate: Nhm2CampaignProfileRunCandidateV1,
): Nhm2ProfileCampaignFrontierCandidateV1 => {
  if (!candidate.queuedForFrozenCampaign) {
    return {
      candidateProfileId: candidate.candidateProfileId,
      alphaCenterline: candidate.alphaCenterline,
      proposalKind: candidate.proposalKind,
      priorityRank: candidate.priorityRank,
      status: "rejected_profile_screen",
      runRoot: candidate.runRoot,
      fastestRankEligible: false,
      missingEvidenceIds: [],
      blockedEvidenceIds: [],
      firstBlocker: candidate.blockers[0] ?? "candidate_rejected_by_profile_screen",
      blockers: candidate.blockers.length
        ? candidate.blockers
        : ["candidate_rejected_by_profile_screen"],
    };
  }

  const missingEvidenceIds = candidate.requiredEvidence
    .filter((entry) => entry.status === "required_missing")
    .map((entry) => entry.evidenceId);
  const blockedEvidenceIds = candidate.requiredEvidence
    .filter((entry) => entry.status === "provided_blocked")
    .map((entry) => entry.evidenceId);
  const blockers = candidate.requiredEvidence.flatMap((entry) =>
    entry.status === "provided_blocked" || entry.status === "required_missing"
      ? entry.blockers
      : [],
  );
  const requiredEvidenceComplete = candidate.requiredEvidence.every(
    (entry) => entry.required && entry.status === "provided",
  );
  const status: Nhm2ProfileCampaignFrontierCandidateStatusV1 =
    requiredEvidenceComplete
      ? "campaign_admissible_diagnostic_candidate"
      : "blocked_campaign_candidate";

  return {
    candidateProfileId: candidate.candidateProfileId,
    alphaCenterline: candidate.alphaCenterline,
    proposalKind: candidate.proposalKind,
    priorityRank: candidate.priorityRank,
    status,
    runRoot: candidate.runRoot,
    fastestRankEligible: status === "campaign_admissible_diagnostic_candidate",
    missingEvidenceIds,
    blockedEvidenceIds,
    firstBlocker:
      status === "campaign_admissible_diagnostic_candidate"
        ? null
        : blockers[0] ?? "candidate_campaign_evidence_incomplete",
    blockers:
      status === "campaign_admissible_diagnostic_candidate"
        ? []
        : blockers.length
          ? blockers
          : ["candidate_campaign_evidence_incomplete"],
  };
};

export const buildNhm2ProfileCampaignFrontier = (
  input: BuildNhm2ProfileCampaignFrontierInput,
): Nhm2ProfileCampaignFrontierArtifactV1 => {
  const candidates = input.campaignProfileRunManifest.candidates.map(
    buildFrontierCandidate,
  );
  const admissible = sortByFastest(
    candidates.filter(
      (candidate) =>
        candidate.status === "campaign_admissible_diagnostic_candidate",
    ),
  );
  const blocked = sortByFastest(
    candidates.filter((candidate) => candidate.status === "blocked_campaign_candidate"),
  );
  const rejected = sortByFastest(
    candidates.filter((candidate) => candidate.status === "rejected_profile_screen"),
  );
  const fastestAdmissible = admissible[0] ?? null;
  const fastestBlocked = blocked[0] ?? null;
  const recommended = fastestAdmissible ?? fastestBlocked;

  return {
    contractVersion: NHM2_PROFILE_CAMPAIGN_FRONTIER_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    campaignProfileRunManifestRef: input.campaignProfileRunManifestRef ?? null,
    baseline: input.campaignProfileRunManifest.baseline,
    rankingPolicy: {
      fastestMeans: "lowest_alpha_after_campaign_evidence_pass",
      allCampaignEvidenceRequired: true,
      missingEvidenceFailsClosed: true,
      blockedEvidenceFailsClosed: true,
      alphaOnlyRejectedProfilesCannotWin: true,
      latestAliasesForbidden: true,
    },
    candidates,
    frontier: {
      fastestCampaignAdmissibleProfileId:
        fastestAdmissible?.candidateProfileId ?? null,
      fastestBlockedProfileId: fastestBlocked?.candidateProfileId ?? null,
      fastestRejectedProfileId: rejected[0]?.candidateProfileId ?? null,
      recommendedNextProfileId: recommended?.candidateProfileId ?? null,
      firstBlocker: recommended?.firstBlocker ?? null,
      recommendationReason:
        fastestAdmissible != null
          ? "campaign_admissible_diagnostic_profile_available"
          : fastestBlocked != null
            ? "run_or_repair_fastest_blocked_candidate_evidence"
            : "no_queued_candidate_available",
    },
    summary: {
      candidateCount: candidates.length,
      admissibleDiagnosticCandidateCount: admissible.length,
      blockedCandidateCount: blocked.length,
      rejectedCandidateCount: rejected.length,
      fastestAdmissibleAlpha: fastestAdmissible?.alphaCenterline ?? null,
      fastestBlockedAlpha: fastestBlocked?.alphaCenterline ?? null,
      profileCampaignFrontierComplete: fastestAdmissible != null,
    },
    claimBoundary: {
      diagnosticOnly: true,
      profileFrontierDoesNotValidateProfile: true,
      fastestDiagnosticDoesNotCertifyRouteEta: true,
      fastestDiagnosticDoesNotCertifyTransport: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

const isCandidate = (
  value: unknown,
): value is Nhm2ProfileCampaignFrontierCandidateV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.candidateProfileId === "string" &&
    isFiniteNumber(record.alphaCenterline) &&
    typeof record.proposalKind === "string" &&
    isNullableNumber(record.priorityRank) &&
    (record.status === "campaign_admissible_diagnostic_candidate" ||
      record.status === "blocked_campaign_candidate" ||
      record.status === "rejected_profile_screen") &&
    isNullableText(record.runRoot) &&
    typeof record.fastestRankEligible === "boolean" &&
    Array.isArray(record.missingEvidenceIds) &&
    record.missingEvidenceIds.every((entry) =>
      NHM2_CAMPAIGN_PROFILE_RUN_EVIDENCE_IDS.includes(entry),
    ) &&
    Array.isArray(record.blockedEvidenceIds) &&
    record.blockedEvidenceIds.every((entry) =>
      NHM2_CAMPAIGN_PROFILE_RUN_EVIDENCE_IDS.includes(entry),
    ) &&
    isNullableText(record.firstBlocker) &&
    Array.isArray(record.blockers)
  );
};

export const isNhm2ProfileCampaignFrontier = (
  value: unknown,
): value is Nhm2ProfileCampaignFrontierArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const rankingPolicy = isRecord(record?.rankingPolicy)
    ? record.rankingPolicy
    : null;
  const frontier = isRecord(record?.frontier) ? record.frontier : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_PROFILE_CAMPAIGN_FRONTIER_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    record.laneId === "nhm2_shift_lapse" &&
    isNullableText(record.campaignProfileRunManifestRef) &&
    isRecord(record.baseline) &&
    rankingPolicy?.fastestMeans === "lowest_alpha_after_campaign_evidence_pass" &&
    rankingPolicy.allCampaignEvidenceRequired === true &&
    rankingPolicy.missingEvidenceFailsClosed === true &&
    rankingPolicy.blockedEvidenceFailsClosed === true &&
    rankingPolicy.alphaOnlyRejectedProfilesCannotWin === true &&
    rankingPolicy.latestAliasesForbidden === true &&
    Array.isArray(record.candidates) &&
    record.candidates.every(isCandidate) &&
    frontier != null &&
    isNullableText(frontier.fastestCampaignAdmissibleProfileId) &&
    isNullableText(frontier.fastestBlockedProfileId) &&
    isNullableText(frontier.fastestRejectedProfileId) &&
    isNullableText(frontier.recommendedNextProfileId) &&
    isNullableText(frontier.firstBlocker) &&
    (frontier.recommendationReason ===
      "run_or_repair_fastest_blocked_candidate_evidence" ||
      frontier.recommendationReason ===
        "campaign_admissible_diagnostic_profile_available" ||
      frontier.recommendationReason === "no_queued_candidate_available") &&
    summary != null &&
    typeof summary.candidateCount === "number" &&
    typeof summary.admissibleDiagnosticCandidateCount === "number" &&
    typeof summary.blockedCandidateCount === "number" &&
    typeof summary.rejectedCandidateCount === "number" &&
    isNullableNumber(summary.fastestAdmissibleAlpha) &&
    isNullableNumber(summary.fastestBlockedAlpha) &&
    typeof summary.profileCampaignFrontierComplete === "boolean" &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.profileFrontierDoesNotValidateProfile === true &&
    claimBoundary.fastestDiagnosticDoesNotCertifyRouteEta === true &&
    claimBoundary.fastestDiagnosticDoesNotCertifyTransport === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false
  );
};
