import type {
  MoralLivingSubstrateBadgeV1,
  MoralLivingSubstrateMatchV1,
  MoralLivingSubstrateSourceRefV1,
} from "../contracts/moral-living-substrate-reflection.v1";
import {
  MORAL_LIVING_SUBSTRATE_PRINCIPLES,
  type MoralLivingSubstrateTheoryBadgeId,
} from "./living-substrate-principles";

export type MatchLivingSubstratePrinciplesInput = {
  text: string;
  requestedSubstrateBadgeIds?: string[];
  sourceTheoryBadgeIds?: string[];
  limit?: number;
};

export type MatchLivingSubstratePrinciplesResult = {
  exactMatches: MoralLivingSubstrateMatchV1[];
  likelyMatches: MoralLivingSubstrateMatchV1[];
  sourceTheoryBadgeIds: MoralLivingSubstrateTheoryBadgeId[];
  sourceRefs: MoralLivingSubstrateSourceRefV1[];
  claimBoundaryNotes: string[];
};

const normalize = (value: string): string => value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const uniqueSourceRefs = (values: MoralLivingSubstrateSourceRefV1[]): MoralLivingSubstrateSourceRefV1[] => {
  const seen = new Set<string>();
  return values.filter((ref) => {
    if (seen.has(ref.id)) return false;
    seen.add(ref.id);
    return true;
  });
};

const containsPhrase = (haystack: string, phrase: string): boolean => {
  const normalizedPhrase = normalize(phrase);
  return Boolean(normalizedPhrase) && haystack.includes(normalizedPhrase);
};

function scorePrinciple(
  text: string,
  principle: (typeof MORAL_LIVING_SUBSTRATE_PRINCIPLES)[number],
  input: MatchLivingSubstratePrinciplesInput,
): MoralLivingSubstrateMatchV1 | null {
  const reasons: string[] = [];
  let score = 0;

  if (input.requestedSubstrateBadgeIds?.includes(principle.id)) {
    score += 0.9;
    reasons.push("requested substrate badge id");
  }

  for (const theoryBadgeId of input.sourceTheoryBadgeIds ?? []) {
    if (principle.sourceTheoryBadgeIds.includes(theoryBadgeId)) {
      score += 0.52;
      reasons.push(`source theory badge overlap: ${theoryBadgeId}`);
    }
  }

  for (const hint of principle.hintKeys) {
    if (containsPhrase(text, hint)) {
      score += hint.includes(" ") ? 0.28 : 0.2;
      reasons.push(`hint match: ${hint}`);
    }
  }

  for (const tag of principle.tags) {
    if (containsPhrase(text, tag)) {
      score += 0.12;
      reasons.push(`tag match: ${tag}`);
    }
  }

  if (principle.maturity === "frontier" && /\b(?:orch|hameroff|penrose|objective reduction|microtubule|anesthetic)\b/i.test(text)) {
    score += 0.26;
    reasons.push("frontier consciousness mechanism cue");
  }

  if (score <= 0) return null;
  const boundedScore = Math.max(0.1, Math.min(1, Number(score.toFixed(3))));
  return {
    badgeId: principle.id,
    title: principle.title,
    score: boundedScore,
    reasons: unique(reasons),
    sourceTheoryBadgeIds: principle.sourceTheoryBadgeIds,
    sourceRefs: principle.sourceRefs,
    claimBoundaryNotes: principle.claimBoundaryNotes,
  };
}

export function matchLivingSubstratePrinciples(
  input: MatchLivingSubstratePrinciplesInput,
): MatchLivingSubstratePrinciplesResult {
  const text = normalize(input.text);
  const matches = MORAL_LIVING_SUBSTRATE_PRINCIPLES
    .map((principle: MoralLivingSubstrateBadgeV1) => scorePrinciple(text, principle, input))
    .filter((match: MoralLivingSubstrateMatchV1 | null): match is MoralLivingSubstrateMatchV1 => Boolean(match))
    .sort((a: MoralLivingSubstrateMatchV1, b: MoralLivingSubstrateMatchV1) =>
      b.score - a.score || a.badgeId.localeCompare(b.badgeId)
    )
    .slice(0, input.limit ?? 8);

  const exactMatches = matches.filter((match: MoralLivingSubstrateMatchV1) => match.score >= 0.7);
  const likelyMatches = matches.filter((match: MoralLivingSubstrateMatchV1) => match.score < 0.7);
  const selectedMatches = [...exactMatches, ...likelyMatches];
  return {
    exactMatches,
    likelyMatches,
    sourceTheoryBadgeIds: unique(
      selectedMatches.flatMap((match: MoralLivingSubstrateMatchV1) => match.sourceTheoryBadgeIds),
    ) as MoralLivingSubstrateTheoryBadgeId[],
    sourceRefs: uniqueSourceRefs(selectedMatches.flatMap((match: MoralLivingSubstrateMatchV1) => match.sourceRefs)),
    claimBoundaryNotes: unique(selectedMatches.flatMap((match: MoralLivingSubstrateMatchV1) => match.claimBoundaryNotes)),
  };
}
