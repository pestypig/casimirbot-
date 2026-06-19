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

export type Nhm2ProfileCampaignFrontierBlockerClassV1 =
  | "none"
  | "profile_screen_rejected"
  | "missing_campaign_evidence"
  | "source_counterpart_or_material_evidence"
  | "regional_full_tensor_or_momentum_closure"
  | "conservation_or_dynamic_backreaction"
  | "qei_worldline_dossier"
  | "observer_energy_condition_after_tensor_closure"
  | "stability"
  | "claim_policy"
  | "unknown_campaign_blocker";

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
  blockerClass: Nhm2ProfileCampaignFrontierBlockerClassV1;
  recommendedNextAction: string;
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
    firstBlockerClass: Nhm2ProfileCampaignFrontierBlockerClassV1;
    recommendedNextAction: string | null;
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
    highestLeverageBlockerClass: Nhm2ProfileCampaignFrontierBlockerClassV1;
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
      blockerClass: "profile_screen_rejected",
      recommendedNextAction:
        "do_not_rank_alpha_only_or_screen_rejected_profiles_until profile levers reduce metric-required T0i under the campaign screen",
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
  const blockerClass =
    status === "campaign_admissible_diagnostic_candidate"
      ? "none"
      : classifyBlocker(missingEvidenceIds, blockedEvidenceIds, blockers);

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
    blockerClass,
    recommendedNextAction:
      status === "campaign_admissible_diagnostic_candidate"
        ? "candidate is diagnostic-admissible under campaign evidence; preserve claim locks and review before any stronger policy admission"
        : recommendedActionFor(blockerClass),
  };
};

const hasAny = (values: string[], patterns: RegExp[]): boolean =>
  values.some((value) => patterns.some((pattern) => pattern.test(value)));

const classifyBlocker = (
  missingEvidenceIds: Nhm2CampaignProfileRunEvidenceId[],
  blockedEvidenceIds: Nhm2CampaignProfileRunEvidenceId[],
  blockers: string[],
): Nhm2ProfileCampaignFrontierBlockerClassV1 => {
  if (missingEvidenceIds.length > 0) return "missing_campaign_evidence";
  if (blockedEvidenceIds.includes("source_tile_counterpart_compatibility")) {
    return "source_counterpart_or_material_evidence";
  }
  if (
    blockedEvidenceIds.includes("regional_full_tensor_residuals") ||
    blockedEvidenceIds.includes("projected_momentum_demand_audit") ||
    hasAny(blockers, [
      /full_tensor_residual/i,
      /momentum_density/i,
      /projected_metric_momentum/i,
      /metric_momentum/i,
    ])
  ) {
    return "regional_full_tensor_or_momentum_closure";
  }
  if (hasAny(blockers, [/source.*missing/i, /material/i, /counterpart/i])) {
    return "source_counterpart_or_material_evidence";
  }
  if (
    blockedEvidenceIds.includes("switching_covariant_conservation") ||
    blockedEvidenceIds.includes("dynamic_effective_geometry_agreement") ||
    hasAny(blockers, [/conservation/i, /backreaction/i, /dynamic_geometry/i])
  ) {
    return "conservation_or_dynamic_backreaction";
  }
  if (
    blockedEvidenceIds.includes("qei_worldline_dossier") ||
    hasAny(blockers, [/qei/i, /worldline/i])
  ) {
    return "qei_worldline_dossier";
  }
  if (
    blockedEvidenceIds.includes("observer_family_energy_conditions") ||
    hasAny(blockers, [/observer/i, /WEC/i, /NEC/i, /DEC/i, /SEC/i])
  ) {
    return "observer_energy_condition_after_tensor_closure";
  }
  if (
    blockedEvidenceIds.includes("horizon_blueshift_particle_stability") ||
    hasAny(blockers, [/horizon/i, /blueshift/i, /particle/i, /stability/i])
  ) {
    return "stability";
  }
  if (hasAny(blockers, [/claim/i, /transport/i, /routeEta/i, /propulsion/i])) {
    return "claim_policy";
  }
  return "unknown_campaign_blocker";
};

const recommendedActionFor = (
  blockerClass: Nhm2ProfileCampaignFrontierBlockerClassV1,
): string => {
  switch (blockerClass) {
    case "none":
      return "candidate is diagnostic-admissible under campaign evidence; preserve claim locks and review before any stronger policy admission";
    case "profile_screen_rejected":
      return "redesign metric/profile levers before running a frozen campaign; alpha-only changes do not reduce projected T0i";
    case "missing_campaign_evidence":
      return "materialize the missing frozen candidate evidence with stable artifact refs before ranking the profile";
    case "source_counterpart_or_material_evidence":
      return "supply source-side tensor/material counterpart evidence without metric echo before residual or observer claims";
    case "regional_full_tensor_or_momentum_closure":
      return "tune same-atlas regional full tensor and momentum projection closure before observer or trip-clock ranking";
    case "conservation_or_dynamic_backreaction":
      return "repair switching conservation, support derivatives, or dynamic backreaction before profile admission";
    case "qei_worldline_dossier":
      return "complete wall and transition QEI worldline receipts with bound and tau provenance";
    case "observer_energy_condition_after_tensor_closure":
      return "explore an observer-compatible metric/source family: current tensor closure can coexist with negative wall T00 that fails WEC/DEC observer checks";
    case "stability":
      return "repair horizon, blueshift, particle accumulation, or perturbative stability evidence";
    case "claim_policy":
      return "keep claim locks closed until policy admits a stronger diagnostic tier";
    case "unknown_campaign_blocker":
      return "inspect the typed blockers and add a narrower frontier classifier before treating this profile as comparable";
  }
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
  const firstBlockerClass = recommended?.blockerClass ?? "unknown_campaign_blocker";

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
      firstBlockerClass,
      recommendedNextAction: recommended?.recommendedNextAction ?? null,
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
      highestLeverageBlockerClass: firstBlockerClass,
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
    Array.isArray(record.blockers) &&
    isBlockerClass(record.blockerClass) &&
    typeof record.recommendedNextAction === "string"
  );
};

const isBlockerClass = (
  value: unknown,
): value is Nhm2ProfileCampaignFrontierBlockerClassV1 =>
  value === "none" ||
  value === "profile_screen_rejected" ||
  value === "missing_campaign_evidence" ||
  value === "source_counterpart_or_material_evidence" ||
  value === "regional_full_tensor_or_momentum_closure" ||
  value === "conservation_or_dynamic_backreaction" ||
  value === "qei_worldline_dossier" ||
  value === "observer_energy_condition_after_tensor_closure" ||
  value === "stability" ||
  value === "claim_policy" ||
  value === "unknown_campaign_blocker";

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
    isBlockerClass(frontier.firstBlockerClass) &&
    isNullableText(frontier.recommendedNextAction) &&
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
    isBlockerClass(summary.highestLeverageBlockerClass) &&
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
