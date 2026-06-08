import type {
  StagePlayLiveSourceInterpreterProfileComparisonV1,
  StagePlayLiveSourceInterpreterProfileDomainV1,
  StagePlayLiveSourceInterpreterProfileStatusV1,
  StagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import {
  validateStagePlayLiveSourceInterpreterProfileComparisonV1,
  validateStagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";

const profilesById = new Map<string, StagePlayLiveSourceInterpreterProfileV1>();
const comparisonsById = new Map<string, StagePlayLiveSourceInterpreterProfileComparisonV1>();

const normalizeOptional = (value: string | null | undefined): string | null =>
  value == null || value.trim() === "" ? null : value;

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
  comparisonsById.set(comparison.comparisonId, comparison);
  return comparison;
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

export function resetStagePlayLiveSourceInterpreterProfileStoreForTest(): void {
  profilesById.clear();
  comparisonsById.clear();
}
