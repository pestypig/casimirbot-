import crypto from "node:crypto";
import {
  buildStagePlayLiveSourceInterpreterProfileComparisonV1,
  type StagePlayLiveSourceInterpreterProfileComparisonV1,
  type StagePlayLiveSourceInterpreterProfileDecisionV1,
  type StagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import type { StagePlayLiveSourceMailItemV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import { recordStagePlayLiveSourceInterpreterProfileComparison } from "./stage-play-live-source-interpreter-profile-store";
import { mergeLiveSourceCausalTraces } from "./stage-play-live-source-causal-trace";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const clipText = (value: string | null | undefined, limit = 280): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tokens = (value: string): string[] =>
  Array.from(new Set(normalize(value).match(/\b[a-z0-9][a-z0-9-]{2,}\b/g) ?? []))
    .filter((token) => !new Set([
      "the",
      "and",
      "for",
      "with",
      "that",
      "this",
      "from",
      "into",
      "source",
      "summary",
      "visual",
      "mail",
      "latest",
      "shows",
      "showing",
      "appears",
      "observed",
    ]).has(token));

const tokenAliases = (token: string): string[] => {
  switch (token) {
    case "movement":
      return ["movement", "moving", "walk", "walking", "travel", "travelling", "roaming"];
    case "walking":
      return ["walking", "walk", "movement", "moving", "travel"];
    case "hostile":
      return ["hostile", "creeper", "zombie", "skeleton", "spider", "enemy", "mob"];
    case "mob":
    case "mobs":
      return ["mob", "mobs", "creeper", "zombie", "skeleton", "spider", "enemy", "hostile"];
    case "nightfall":
      return ["nightfall", "night", "sunset", "dusk", "dark"];
    case "light":
      return ["light", "dark", "dim", "darkness"];
    case "danger":
    case "hazard":
      return ["danger", "hazard", "hostile", "creeper", "zombie", "skeleton", "spider", "lava"];
    default:
      return [token];
  }
};

const criterionNegatedInText = (normalizedCriterion: string, normalizedText: string): boolean => {
  if (!normalizedCriterion || !normalizedText) return false;
  const criterionPattern = escapeRegex(normalizedCriterion).replace(/\s+/g, "\\s+");
  if (new RegExp(`\\b(?:no|not|without|none|neither|absent)\\s+(?:confirmed\\s+|visible\\s+|nearby\\s+|known\\s+|any\\s+)?${criterionPattern}\\b`, "i").test(normalizedText)) {
    return true;
  }
  const criterionTokens = tokens(normalizedCriterion);
  if (criterionTokens.length === 0) return false;
  const tailPattern = criterionTokens
    .flatMap((token) => tokenAliases(token))
    .map(escapeRegex)
    .join("|");
  return new RegExp(`\\b(?:no|not|without|none|absent)\\s+(?:confirmed\\s+|visible\\s+|nearby\\s+|known\\s+|any\\s+)?(?:${tailPattern})\\b`, "i").test(normalizedText);
};

const criterionMatchesText = (criterion: string, text: string): boolean => {
  const normalizedCriterion = normalize(criterion);
  const normalizedText = normalize(text);
  if (!normalizedCriterion || !normalizedText) return false;
  if (criterionNegatedInText(normalizedCriterion, normalizedText)) return false;
  if (/\blow\s+health\b/i.test(normalizedCriterion) && !/\b(?:low\s+health|health\s+low|health|hunger|heart|hearts)\b/i.test(normalizedText)) {
    return false;
  }
  if (/\bnightfall\s+without\s+shelter\b/i.test(normalizedCriterion)) {
    return /\b(?:nightfall|night|sunset|dusk)\b/i.test(normalizedText) &&
      /\b(?:without|no|lacks?|missing)\s+(?:shelter|base|home|cover|torch|light)\b/i.test(normalizedText);
  }
  if (normalizedText.includes(normalizedCriterion)) return true;
  const criterionTokens = tokens(normalizedCriterion);
  if (criterionTokens.length === 0) return false;
  const textTokens = new Set(tokens(normalizedText));
  const hitCount = criterionTokens.filter((token) =>
    tokenAliases(token).some((alias) => textTokens.has(alias)),
  ).length;
  return hitCount > 0 && hitCount / criterionTokens.length >= 0.5;
};

const matchingCriteria = (criteria: string[], text: string): string[] =>
  uniqueStrings(criteria.filter((criterion) => criterionMatchesText(criterion, text)));

const domainHints = (profile: StagePlayLiveSourceInterpreterProfileV1, text: string): {
  risk: string[];
  opportunity: string[];
  salience: string[];
  voice: string[];
  watch: string[];
} => {
  const risk: string[] = [];
  const opportunity: string[] = [];
  const salience: string[] = [];
  const voice: string[] = [];
  const watch: string[] = [];
  if (profile.domain === "minecraft") {
    if (/\b(?:hostile|creeper|zombie|skeleton|spider|mob|lava|low health|hunger|dark|cave|low light|dim|nightfall)\b/i.test(text)) {
      risk.push("minecraft hazard hint");
      salience.push("minecraft survival change");
      watch.push("hostile mobs or cave hazards");
    }
    if (/\b(?:hostile|creeper|zombie|skeleton|spider|lava|low health)\b/i.test(text) && !/\b(?:no|not|without|none|absent)\s+(?:confirmed\s+|visible\s+|nearby\s+|any\s+)?(?:hostile|creeper|zombie|skeleton|spider|mob|lava|low health)\b/i.test(text)) {
      voice.push("minecraft urgent hazard hint");
    }
    if (/\b(?:nightfall|night|sunset|dusk)\b/i.test(text) && /\b(?:without|no|lacks?|missing)\s+(?:shelter|base|home|cover|torch|light)\b/i.test(text)) {
      voice.push("minecraft nightfall without shelter hint");
    }
    if (/\b(?:diamond|ore|village|chest|rare resource|resource)\b/i.test(text)) {
      opportunity.push("minecraft resource opportunity hint");
      salience.push("minecraft opportunity change");
      watch.push("rare resources or route choices");
    }
  }
  if (profile.domain === "browser" || profile.domain === "desktop_app") {
    if (/\b(?:error|blocked|warning|failed|login|permission|security)\b/i.test(text)) {
      risk.push("workflow blockage hint");
      salience.push("workflow risk change");
      voice.push("workflow warning hint");
      watch.push("blocked workflow or error state");
    }
    if (/\b(?:opened|selected|submitted|downloaded|completed|success)\b/i.test(text)) {
      opportunity.push("workflow progress hint");
      salience.push("workflow progress change");
      watch.push("active window or task completion");
    }
  }
  if (profile.domain === "code_logs") {
    if (/\b(?:error|exception|failed|timeout|crash|fatal|stack trace)\b/i.test(text)) {
      risk.push("code log failure hint");
      salience.push("code log failure change");
      voice.push("code log failure callout hint");
      watch.push("failing test or stack trace");
    }
  }
  if (profile.domain === "video") {
    if (/\b(?:scene changed|new scene|cut|title card|person enters|object appears)\b/i.test(text)) {
      salience.push("video scene transition hint");
      watch.push("scene transition or new actor/object");
    }
  }
  return {
    risk: uniqueStrings(risk),
    opportunity: uniqueStrings(opportunity),
    salience: uniqueStrings(salience),
    voice: uniqueStrings(voice),
    watch: uniqueStrings(watch),
  };
};

const recommendedDecision = (input: {
  matchedCriteria: string[];
  suppressedCriteria: string[];
  riskMatches: string[];
  opportunityMatches: string[];
  voiceCalloutMatches: string[];
  hasMail: boolean;
}): StagePlayLiveSourceInterpreterProfileDecisionV1 => {
  if (input.voiceCalloutMatches.length > 0) return "request_voice_callout";
  if (input.riskMatches.length > 0 || input.opportunityMatches.length > 0 || input.matchedCriteria.length > 0) {
    return "record_interpretation";
  }
  if (input.suppressedCriteria.length > 0) return "wait_for_next_summary";
  return input.hasMail ? "record_interpretation" : "request_more_evidence";
};

export function compareMailToInterpreterProfile(input: {
  profile: StagePlayLiveSourceInterpreterProfileV1;
  mailItems: StagePlayLiveSourceMailItemV1[];
  narrativeStateRef?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  createdAt?: string;
}): StagePlayLiveSourceInterpreterProfileComparisonV1 {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const summaries = input.mailItems.map((item) => item.summary.text);
  const summaryText = summaries.join("\n");
  const hints = domainHints(input.profile, summaryText);
  const matchedCriteria = uniqueStrings([
    ...matchingCriteria(input.profile.salienceCriteria, summaryText),
    ...hints.salience,
  ]);
  const suppressedCriteria = matchingCriteria(input.profile.suppressCriteria, summaryText);
  const riskMatches = uniqueStrings([
    ...matchingCriteria(input.profile.riskCriteria, summaryText),
    ...hints.risk,
  ]);
  const opportunityMatches = uniqueStrings([
    ...matchingCriteria(input.profile.opportunityCriteria, summaryText),
    ...hints.opportunity,
  ]);
  const voiceCalloutMatches = uniqueStrings([
    ...matchingCriteria(input.profile.voiceCalloutCriteria, summaryText),
    ...hints.voice,
  ]);
  const contradictions = suppressedCriteria.length > 0 && (
    matchedCriteria.length > 0 ||
    riskMatches.length > 0 ||
    opportunityMatches.length > 0 ||
    voiceCalloutMatches.length > 0
  )
    ? ["Mail matched suppress criteria as well as salience/risk/opportunity criteria; model review should arbitrate."]
    : [];
  const observedFacts = input.mailItems.length > 0
    ? input.mailItems.map((item) => `${item.mailId}: ${clipText(item.summary.text, 260)}`)
    : ["No mail items were available for comparison."];
  const inferredMeaning = uniqueStrings([
    matchedCriteria.length > 0 ? `Matched salience criteria: ${matchedCriteria.join(", ")}.` : null,
    riskMatches.length > 0 ? `Risk criteria matched: ${riskMatches.join(", ")}.` : null,
    opportunityMatches.length > 0 ? `Opportunity criteria matched: ${opportunityMatches.join(", ")}.` : null,
    voiceCalloutMatches.length > 0 ? `Voice callout criteria matched: ${voiceCalloutMatches.join(", ")}.` : null,
    suppressedCriteria.length > 0 ? `Suppress criteria matched: ${suppressedCriteria.join(", ")}.` : null,
  ]);
  const recommendedNextWatch = uniqueStrings([
    ...hints.watch,
    ...matchedCriteria,
    ...riskMatches,
    ...opportunityMatches,
    ...voiceCalloutMatches,
  ]).slice(0, 8);
  const comparisonId = `stage_play_live_source_interpreter_profile_comparison:${hashShort([
    input.profile.profileId,
    input.mailItems.map((item) => item.mailId),
    input.narrativeStateRef ?? null,
    createdAt,
  ])}`;
  const evidenceRefs = uniqueStrings([
    input.profile.profileId,
    input.narrativeStateRef,
    ...input.profile.evidenceRefs,
    ...input.mailItems.flatMap((item) => [item.mailId, ...item.evidenceRefs]),
  ]);
  const comparison = buildStagePlayLiveSourceInterpreterProfileComparisonV1({
    comparisonId,
    profileId: input.profile.profileId,
    jobId: input.jobId ?? input.profile.jobId ?? null,
    policyId: input.policyId ?? input.profile.policyId ?? null,
    mailIds: input.mailItems.map((item) => item.mailId),
    narrativeStateRef: input.narrativeStateRef ?? null,
    observedFacts,
    inferredMeaning,
    matchedCriteria,
    suppressedCriteria,
    riskMatches,
    opportunityMatches,
    voiceCalloutMatches,
    contradictions,
    uncertainties: [
      "Comparison is deterministic and based on compact mail summaries; Helix Ask must perform deeper interpretation before answer or action.",
    ],
    recommendedDecision: recommendedDecision({
      matchedCriteria,
      suppressedCriteria,
      riskMatches,
      opportunityMatches,
      voiceCalloutMatches,
      hasMail: input.mailItems.length > 0,
    }),
    recommendedNextWatch: recommendedNextWatch.length > 0 ? recommendedNextWatch : ["next compact source summary"],
    evidenceRefs,
    causalTrace: mergeLiveSourceCausalTraces(input.mailItems.map((item) => item.causalTrace), {
      parentRefs: uniqueStrings([input.profile.profileId, input.narrativeStateRef, ...input.mailItems.map((item) => item.mailId)]),
      causedBy: input.mailItems.map((item) => item.mailId),
      producedRefs: [comparisonId],
      sourceIds: input.mailItems.map((item) => item.sourceId),
      jobId: input.jobId ?? input.profile.jobId ?? null,
      policyId: input.policyId ?? input.profile.policyId ?? null,
      profileId: input.profile.profileId,
      evidenceRefs,
    }),
    createdAt,
  });
  return recordStagePlayLiveSourceInterpreterProfileComparison(comparison);
}
