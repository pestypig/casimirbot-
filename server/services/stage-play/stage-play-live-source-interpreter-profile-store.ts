import type {
  StagePlayLiveSourceInterpreterProfileCriterionKindV1,
  StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusSummaryV1,
  StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1,
  StagePlayLiveSourceInterpreterProfileCriterionLedgerV1,
  StagePlayLiveSourceInterpreterProfileComparisonV1,
  StagePlayLiveSourceInterpreterProfileDomainV1,
  StagePlayLiveSourceInterpreterProfileStatusV1,
  StagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import crypto from "node:crypto";
import {
  buildStagePlayLiveSourceInterpreterProfileCriterionLedgerV1,
  validateStagePlayLiveSourceInterpreterProfileComparisonV1,
  validateStagePlayLiveSourceInterpreterProfileCriterionLedgerV1,
  validateStagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import { mergeLiveSourceCausalTraces } from "./stage-play-live-source-causal-trace";

const profilesById = new Map<string, StagePlayLiveSourceInterpreterProfileV1>();
const comparisonsById = new Map<string, StagePlayLiveSourceInterpreterProfileComparisonV1>();
const criterionLedgerById = new Map<string, StagePlayLiveSourceInterpreterProfileCriterionLedgerV1>();

const normalizeOptional = (value: string | null | undefined): string | null =>
  value == null || value.trim() === "" ? null : value;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const normalizeCriterion = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const assertProfileContract = (profile: StagePlayLiveSourceInterpreterProfileV1): void => {
  const issues = validateStagePlayLiveSourceInterpreterProfileV1(profile);
  if (issues.length > 0) {
    throw new Error(`Invalid Stage Play live-source interpreter profile: ${issues.join("; ")}`);
  }
};

const assertComparisonContract = (comparison: StagePlayLiveSourceInterpreterProfileComparisonV1): void => {
  const issues = validateStagePlayLiveSourceInterpreterProfileComparisonV1(comparison);
  if (issues.length > 0) {
    throw new Error(`Invalid Stage Play live-source interpreter profile comparison: ${issues.join("; ")}`);
  }
};

const assertCriterionLedgerContract = (
  ledger: StagePlayLiveSourceInterpreterProfileCriterionLedgerV1,
): void => {
  const issues = validateStagePlayLiveSourceInterpreterProfileCriterionLedgerV1(ledger);
  if (issues.length > 0) {
    throw new Error(`Invalid Stage Play live-source interpreter profile criterion ledger: ${issues.join("; ")}`);
  }
};

const profileScopeMatches = (
  profile: StagePlayLiveSourceInterpreterProfileV1,
  input: {
    threadId?: string | null;
    roomId?: string | null;
    environmentId?: string | null;
    jobId?: string | null;
    policyId?: string | null;
    domain?: StagePlayLiveSourceInterpreterProfileDomainV1 | null;
    sourceKind?: string | null;
    status?: StagePlayLiveSourceInterpreterProfileStatusV1 | null;
  },
): boolean => {
  if (input.threadId && profile.threadId !== input.threadId) return false;
  if (input.roomId && profile.roomId !== input.roomId) return false;
  if (input.environmentId && profile.environmentId !== input.environmentId) return false;
  if (input.jobId && profile.jobId !== input.jobId) return false;
  if (input.policyId && profile.policyId !== input.policyId) return false;
  if (input.domain && profile.domain !== input.domain) return false;
  if (input.sourceKind && !profile.sourceKinds.includes(input.sourceKind)) return false;
  if (input.status && profile.status !== input.status) return false;
  return true;
};

const comparisonScopeMatches = (
  comparison: StagePlayLiveSourceInterpreterProfileComparisonV1,
  input: {
    profileId?: string | null;
    jobId?: string | null;
    policyId?: string | null;
    mailId?: string | null;
    narrativeStateRef?: string | null;
  },
): boolean => {
  if (input.profileId && comparison.profileId !== input.profileId) return false;
  if (input.jobId && comparison.jobId !== input.jobId) return false;
  if (input.policyId && comparison.policyId !== input.policyId) return false;
  if (input.mailId && !comparison.mailIds.includes(input.mailId)) return false;
  if (input.narrativeStateRef && comparison.narrativeStateRef !== input.narrativeStateRef) return false;
  return true;
};

const isSamePreferredProfileScope = (
  left: StagePlayLiveSourceInterpreterProfileV1,
  right: StagePlayLiveSourceInterpreterProfileV1,
): boolean =>
  left.profileId !== right.profileId &&
  left.status === "active" &&
  left.threadId === right.threadId &&
  normalizeOptional(left.roomId) === normalizeOptional(right.roomId) &&
  normalizeOptional(left.environmentId) === normalizeOptional(right.environmentId) &&
  normalizeOptional(left.jobId) === normalizeOptional(right.jobId) &&
  left.domain === right.domain;

const pauseOlderActiveProfilesInPreferredScope = (
  activeProfile: StagePlayLiveSourceInterpreterProfileV1,
): void => {
  for (const profile of profilesById.values()) {
    if (!isSamePreferredProfileScope(profile, activeProfile)) continue;
    profilesById.set(profile.profileId, {
      ...profile,
      status: "paused",
      updatedAt: activeProfile.updatedAt,
    });
  }
};

const criterionIdFor = (input: {
  profileId: string;
  kind: StagePlayLiveSourceInterpreterProfileCriterionKindV1;
  text: string;
}): string =>
  `stage_play_live_source_interpreter_profile_criterion:${hashShort([
    input.profileId,
    input.kind,
    normalizeCriterion(input.text),
  ])}`;

const ledgerIdFor = (criterionId: string): string =>
  `stage_play_live_source_interpreter_profile_criterion_ledger:${hashShort(criterionId)}`;

const kindForProfileCriterion = (
  profile: StagePlayLiveSourceInterpreterProfileV1 | null,
  text: string,
  fallback: StagePlayLiveSourceInterpreterProfileCriterionKindV1,
): StagePlayLiveSourceInterpreterProfileCriterionKindV1 => {
  const normalized = normalizeCriterion(text);
  if (!profile || !normalized) return fallback;
  const includesCriterion = (criteria: string[]): boolean =>
    criteria.some((criterion) => normalizeCriterion(criterion) === normalized);
  if (includesCriterion(profile.salienceCriteria)) return "salience";
  if (includesCriterion(profile.suppressCriteria)) return "suppress";
  if (includesCriterion(profile.riskCriteria)) return "risk";
  if (includesCriterion(profile.opportunityCriteria)) return "opportunity";
  if (includesCriterion(profile.voiceCalloutCriteria)) return "voice_callout";
  return fallback;
};

type CriterionLedgerSignal = {
  criterionText: string;
  kind: StagePlayLiveSourceInterpreterProfileCriterionKindV1;
  status: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1;
};

const comparisonSignals = (
  comparison: StagePlayLiveSourceInterpreterProfileComparisonV1,
  profile: StagePlayLiveSourceInterpreterProfileV1 | null,
): CriterionLedgerSignal[] => {
  const signals: CriterionLedgerSignal[] = [];
  for (const criterion of comparison.matchedCriteria) {
    signals.push({
      criterionText: criterion,
      kind: kindForProfileCriterion(profile, criterion, "salience"),
      status: "matched",
    });
  }
  for (const criterion of comparison.suppressedCriteria) {
    signals.push({
      criterionText: criterion,
      kind: "suppress",
      status: "matched",
    });
  }
  for (const criterion of comparison.riskMatches) {
    signals.push({
      criterionText: criterion,
      kind: "risk",
      status: "matched",
    });
  }
  for (const criterion of comparison.opportunityMatches) {
    signals.push({
      criterionText: criterion,
      kind: "opportunity",
      status: "matched",
    });
  }
  for (const criterion of comparison.voiceCalloutMatches) {
    signals.push({
      criterionText: criterion,
      kind: "voice_callout",
      status: "matched",
    });
  }
  for (const contradiction of comparison.contradictions) {
    signals.push({
      criterionText: contradiction,
      kind: "contradiction",
      status: "contradicted",
    });
  }
  for (const uncertainty of comparison.uncertainties) {
    signals.push({
      criterionText: uncertainty,
      kind: "uncertainty",
      status: "uncertain",
    });
  }
  const byKey = new Map<string, CriterionLedgerSignal>();
  for (const signal of signals) {
    const key = `${signal.kind}:${normalizeCriterion(signal.criterionText)}`;
    const prior = byKey.get(key);
    if (!prior || signal.status === "contradicted" || (signal.status === "uncertain" && prior.status !== "contradicted")) {
      byKey.set(key, signal);
    }
  }
  return Array.from(byKey.values());
};

const isActiveLedgerStatus = (
  status: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1,
): boolean => status === "matched" || status === "still_matched";

const statusForSignal = (
  previous: StagePlayLiveSourceInterpreterProfileCriterionLedgerV1 | null,
  signalStatus: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1,
): StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1 => {
  if (signalStatus === "contradicted" || signalStatus === "uncertain") return signalStatus;
  return previous && isActiveLedgerStatus(previous.status) ? "still_matched" : "matched";
};

const confidenceForStatus = (
  status: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1,
  previous: StagePlayLiveSourceInterpreterProfileCriterionLedgerV1 | null,
): number => {
  if (status === "still_matched") return Math.min(1, (previous?.currentConfidence ?? 0.65) + 0.1);
  if (status === "matched") return 0.72;
  if (status === "resolved") return 0.35;
  if (status === "contradicted") return 0.2;
  return 0.45;
};

const updateCriterionLedgerFromComparison = (
  comparison: StagePlayLiveSourceInterpreterProfileComparisonV1,
): {
  refs: string[];
  summaries: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusSummaryV1[];
} => {
  const profile = getStagePlayLiveSourceInterpreterProfile(comparison.profileId);
  const signals = comparisonSignals(comparison, profile);
  const now = comparison.createdAt;
  const touchedIds = new Set<string>();
  const refs: string[] = [];
  const summaries: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusSummaryV1[] = [];
  const firstMailId = comparison.mailIds[0] ?? null;
  const lastMailId = comparison.mailIds.at(-1) ?? null;
  const comparisonEvidenceRefs = uniqueStrings([
    comparison.comparisonId,
    comparison.profileId,
    comparison.narrativeStateRef,
    ...comparison.mailIds,
    ...comparison.evidenceRefs,
  ]);

  for (const signal of signals) {
    const criterionId = criterionIdFor({
      profileId: comparison.profileId,
      kind: signal.kind,
      text: signal.criterionText,
    });
    const ledgerId = ledgerIdFor(criterionId);
    const previous = criterionLedgerById.get(ledgerId) ?? null;
    const status = statusForSignal(previous, signal.status);
    const evidenceRefs = uniqueStrings([
      ...(previous?.evidenceRefs ?? []),
      ...comparisonEvidenceRefs,
    ]);
    const supportingEvidenceRefs = signal.status === "matched"
      ? uniqueStrings([
          ...(previous?.supportingEvidenceRefs ?? []),
          ...comparisonEvidenceRefs,
        ])
      : previous?.supportingEvidenceRefs ?? [];
    const contradictingEvidenceRefs = signal.status === "contradicted" || signal.status === "uncertain"
      ? uniqueStrings([
          ...(previous?.contradictingEvidenceRefs ?? []),
          ...comparisonEvidenceRefs,
        ])
      : previous?.contradictingEvidenceRefs ?? [];
    const ledger = buildStagePlayLiveSourceInterpreterProfileCriterionLedgerV1({
      ledgerId,
      profileId: comparison.profileId,
      jobId: comparison.jobId ?? null,
      policyId: comparison.policyId ?? null,
      criterionId,
      criterionText: signal.criterionText,
      criterionKind: signal.kind,
      status,
      previousStatus: previous?.status ?? null,
      firstMatchedMailId: previous?.firstMatchedMailId ?? (status === "matched" || status === "still_matched" ? firstMailId : null),
      lastMatchedMailId: status === "matched" || status === "still_matched"
        ? lastMailId
        : previous?.lastMatchedMailId ?? null,
      lastComparisonId: comparison.comparisonId,
      firstMatchedAt: previous?.firstMatchedAt ?? (status === "matched" || status === "still_matched" ? now : null),
      lastUpdatedAt: now,
      resolvedAt: status === "resolved" ? now : previous?.resolvedAt ?? null,
      contradictedAt: status === "contradicted" ? now : previous?.contradictedAt ?? null,
      uncertainAt: status === "uncertain" ? now : previous?.uncertainAt ?? null,
      matchCount: (previous?.matchCount ?? 0) + (status === "matched" || status === "still_matched" ? 1 : 0),
      supportingEvidenceRefs,
      contradictingEvidenceRefs,
      currentConfidence: confidenceForStatus(status, previous),
      evidenceRefs,
      causalTrace: mergeLiveSourceCausalTraces([previous?.causalTrace, comparison.causalTrace], {
        parentRefs: uniqueStrings([previous?.ledgerId, comparison.comparisonId, comparison.profileId]),
        causedBy: [comparison.comparisonId],
        producedRefs: [ledgerId],
        jobId: comparison.jobId ?? null,
        policyId: comparison.policyId ?? null,
        profileId: comparison.profileId,
        evidenceRefs,
      }),
    });
    assertCriterionLedgerContract(ledger);
    criterionLedgerById.set(ledgerId, ledger);
    touchedIds.add(ledgerId);
    refs.push(ledgerId);
    summaries.push({
      ledgerId,
      criterionId,
      criterionText: signal.criterionText,
      criterionKind: signal.kind,
      status,
      previousStatus: previous?.status ?? null,
    });
  }

  const activePriorLedgers = Array.from(criterionLedgerById.values())
    .filter((ledger) => ledger.profileId === comparison.profileId)
    .filter((ledger) => normalizeOptional(ledger.jobId) === normalizeOptional(comparison.jobId))
    .filter((ledger) => normalizeOptional(ledger.policyId) === normalizeOptional(comparison.policyId))
    .filter((ledger) => isActiveLedgerStatus(ledger.status))
    .filter((ledger) => !touchedIds.has(ledger.ledgerId));
  for (const previous of activePriorLedgers) {
    const evidenceRefs = uniqueStrings([
      ...previous.evidenceRefs,
      ...comparisonEvidenceRefs,
    ]);
    const ledger = buildStagePlayLiveSourceInterpreterProfileCriterionLedgerV1({
      ...previous,
      status: "resolved",
      previousStatus: previous.status,
      lastComparisonId: comparison.comparisonId,
      lastUpdatedAt: now,
      resolvedAt: now,
      evidenceRefs,
      causalTrace: mergeLiveSourceCausalTraces([previous.causalTrace, comparison.causalTrace], {
        parentRefs: uniqueStrings([previous.ledgerId, comparison.comparisonId, comparison.profileId]),
        causedBy: [comparison.comparisonId],
        producedRefs: [previous.ledgerId],
        jobId: comparison.jobId ?? null,
        policyId: comparison.policyId ?? null,
        profileId: comparison.profileId,
        evidenceRefs,
      }),
      currentConfidence: confidenceForStatus("resolved", previous),
    });
    assertCriterionLedgerContract(ledger);
    criterionLedgerById.set(ledger.ledgerId, ledger);
    refs.push(ledger.ledgerId);
    summaries.push({
      ledgerId: ledger.ledgerId,
      criterionId: ledger.criterionId,
      criterionText: ledger.criterionText,
      criterionKind: ledger.criterionKind,
      status: "resolved",
      previousStatus: previous.status,
    });
  }

  return {
    refs: uniqueStrings(refs),
    summaries,
  };
};

export function recordStagePlayLiveSourceInterpreterProfile(
  profile: StagePlayLiveSourceInterpreterProfileV1,
): StagePlayLiveSourceInterpreterProfileV1 {
  assertProfileContract(profile);
  if (profile.status === "active") {
    pauseOlderActiveProfilesInPreferredScope(profile);
  }
  profilesById.set(profile.profileId, profile);
  return profile;
}

export function getStagePlayLiveSourceInterpreterProfile(
  profileId: string,
): StagePlayLiveSourceInterpreterProfileV1 | null {
  return profilesById.get(profileId) ?? null;
}

export function listStagePlayLiveSourceInterpreterProfiles(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  domain?: StagePlayLiveSourceInterpreterProfileDomainV1 | null;
  sourceKind?: string | null;
  status?: StagePlayLiveSourceInterpreterProfileStatusV1 | null;
  includeArchived?: boolean;
  limit?: number;
} = {}): StagePlayLiveSourceInterpreterProfileV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(profilesById.values())
    .filter((profile) => profileScopeMatches(profile, input))
    .filter((profile) => input.includeArchived === true || profile.status !== "archived")
    .sort((left, right) => {
      const updatedDelta = left.updatedAt.localeCompare(right.updatedAt);
      if (updatedDelta !== 0) return updatedDelta;
      return left.profileId.localeCompare(right.profileId);
    })
    .slice(-limit);
}

export function getActiveInterpreterProfileForJob(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  domain?: StagePlayLiveSourceInterpreterProfileDomainV1 | null;
  sourceKind?: string | null;
}): StagePlayLiveSourceInterpreterProfileV1 | null {
  return listStagePlayLiveSourceInterpreterProfiles({
    ...input,
    status: "active",
    includeArchived: false,
    limit: 250,
  })
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
    .at(-1) ?? null;
}

export function setInterpreterProfileStatus(input: {
  profileId: string;
  status: StagePlayLiveSourceInterpreterProfileStatusV1;
  updatedAt?: string;
}): StagePlayLiveSourceInterpreterProfileV1 | null {
  const current = getStagePlayLiveSourceInterpreterProfile(input.profileId);
  if (!current) return null;
  const updated: StagePlayLiveSourceInterpreterProfileV1 = {
    ...current,
    status: input.status,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
  assertProfileContract(updated);
  if (updated.status === "active") {
    pauseOlderActiveProfilesInPreferredScope(updated);
  }
  profilesById.set(updated.profileId, updated);
  return updated;
}

export function linkInterpreterProfileNote(input: {
  profileId: string;
  linkedNoteId?: string | null;
  linkedNoteTitle?: string | null;
  updatedAt?: string;
}): StagePlayLiveSourceInterpreterProfileV1 | null {
  const current = getStagePlayLiveSourceInterpreterProfile(input.profileId);
  if (!current) return null;
  const updated: StagePlayLiveSourceInterpreterProfileV1 = {
    ...current,
    linkedNoteId: normalizeOptional(input.linkedNoteId),
    linkedNoteTitle: normalizeOptional(input.linkedNoteTitle),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
  assertProfileContract(updated);
  profilesById.set(updated.profileId, updated);
  return updated;
}

export function recordStagePlayLiveSourceInterpreterProfileComparison(
  comparison: StagePlayLiveSourceInterpreterProfileComparisonV1,
): StagePlayLiveSourceInterpreterProfileComparisonV1 {
  assertComparisonContract(comparison);
  const ledger = updateCriterionLedgerFromComparison(comparison);
  const withLedger: StagePlayLiveSourceInterpreterProfileComparisonV1 = {
    ...comparison,
    criterionLedgerRefs: uniqueStrings([
      ...(comparison.criterionLedgerRefs ?? []),
      ...ledger.refs,
    ]),
    criterionLedgerStatuses: [
      ...(comparison.criterionLedgerStatuses ?? []),
      ...ledger.summaries,
    ],
    evidenceRefs: uniqueStrings([
      ...comparison.evidenceRefs,
      ...ledger.refs,
    ]),
  };
  assertComparisonContract(withLedger);
  comparisonsById.set(withLedger.comparisonId, withLedger);
  return withLedger;
}

export function listStagePlayLiveSourceInterpreterProfileComparisons(input: {
  profileId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  mailId?: string | null;
  narrativeStateRef?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceInterpreterProfileComparisonV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(comparisonsById.values())
    .filter((comparison) => comparisonScopeMatches(comparison, input))
    .sort((left, right) => {
      const createdDelta = left.createdAt.localeCompare(right.createdAt);
      if (createdDelta !== 0) return createdDelta;
      return left.comparisonId.localeCompare(right.comparisonId);
    })
    .slice(-limit);
}

export function getStagePlayLiveSourceInterpreterProfileCriterionLedger(
  ledgerId: string,
): StagePlayLiveSourceInterpreterProfileCriterionLedgerV1 | null {
  return criterionLedgerById.get(ledgerId) ?? null;
}

export function listStagePlayLiveSourceInterpreterProfileCriterionLedger(input: {
  profileId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  status?: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1 | null;
  criterionKind?: StagePlayLiveSourceInterpreterProfileCriterionKindV1 | null;
  limit?: number;
} = {}): StagePlayLiveSourceInterpreterProfileCriterionLedgerV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(criterionLedgerById.values())
    .filter((ledger) => !input.profileId || ledger.profileId === input.profileId)
    .filter((ledger) => !input.jobId || ledger.jobId === input.jobId)
    .filter((ledger) => !input.policyId || ledger.policyId === input.policyId)
    .filter((ledger) => !input.status || ledger.status === input.status)
    .filter((ledger) => !input.criterionKind || ledger.criterionKind === input.criterionKind)
    .sort((left, right) => {
      const updatedDelta = left.lastUpdatedAt.localeCompare(right.lastUpdatedAt);
      if (updatedDelta !== 0) return updatedDelta;
      return left.ledgerId.localeCompare(right.ledgerId);
    })
    .slice(-limit);
}

export function resetStagePlayLiveSourceInterpreterProfileStoreForTest(): void {
  profilesById.clear();
  comparisonsById.clear();
  criterionLedgerById.clear();
}
