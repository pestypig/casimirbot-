import {
  CIVIC_TRUST_TRAVERSABILITY_ARTIFACT_ID,
  CIVIC_TRUST_TRAVERSABILITY_SCHEMA_VERSION,
  type CivicTrustContextLevelV1,
  type CivicTrustScaleV1,
  type CivicTrustSignalKindV1,
  type CivicTrustThresholdPurposeV1,
  type CivicTrustTimeWindowV1,
  type CivicTrustTraversabilityV1,
} from "../contracts/civic-trust-traversability.v1";

export type BuildCivicTrustTraversabilityInput = {
  text: string;
  refs?: string[];
  activatedBadgeIds?: string[];
};

const BADGE_CUES: ReadonlyArray<{ badgeId: string; cues: RegExp[]; missingEvidence: string[] }> = [
  {
    badgeId: "familiarity-anonymity-balance",
    cues: [
      /\b(?:rural|urban|city|cities|population density|low[-\s]?density|high[-\s]?density)\b/i,
      /\b(?:familiarity|anonymity|repeated contact|network overlap|newcomer|fresh start)\b/i,
    ],
    missingEvidence: ["repeated_contact_context", "network_overlap", "newcomer_access", "privacy_and_exit_options", "service_alternatives"],
  },
  {
    badgeId: "trust-medium-translation",
    cues: [
      /\b(?:trust medium|trust channel|relational trust|institutional trust|community reputation)\b/i,
      /\b(?:contract|financial record|credit history|public institution|formal record)\b/i,
    ],
    missingEvidence: ["source_trust_channel", "destination_trust_channel", "dependency_scope", "translation_loss", "fallback_and_appeal_path"],
  },
  {
    badgeId: "domain-bounded-accountability",
    cues: [
      /\b(?:domain[-\s]?bounded|observer exposure|witness exposure|performance history|accountability evidence)\b/i,
      /\b(?:credit score|financial history|reference|endorsement|universal trustworthiness|moral worth)\b/i,
    ],
    missingEvidence: ["accountability_domain", "observer_exposure", "time_window", "source_provenance", "dispute_or_correction_state", "repair_history"],
  },
  {
    badgeId: "contestable-reentry-threshold",
    cues: [
      /\b(?:re[-\s]?entry|appeal|access threshold|eligibility criteria|excluded|exclusion|denied access)\b/i,
      /\b(?:permanent stigma|fresh start|review date|sunset date|repair path|contestable)\b/i,
    ],
    missingEvidence: ["published_threshold", "decision_reason", "supporting_evidence", "appeal_path", "repair_or_reentry_path", "review_or_sunset_date"],
  },
];

const EXISTING_BADGE_CUES: ReadonlyArray<{ badgeId: string; cue: RegExp }> = [
  { badgeId: "dependency-transparency-gate", cue: /\b(?:shared dependency|shared obligation|hidden material risk|late disclosure)\b/i },
  { badgeId: "agency-preserving-disclosure", cue: /\b(?:lost choices|lost ability to plan|preserve agency|withheld information)\b/i },
  { badgeId: "fallout-transfer-check", cue: /\b(?:fallout|shifted burden|externalized cost|downstream cost)\b/i },
  { badgeId: "scarcity-justice", cue: /\b(?:scarcity|resource constraint|capacity failure)\b/i },
  { badgeId: "data-dignity", cue: /\b(?:record retention|personal data|credit record|financial record)\b/i },
];

const CIVIC_TRUST_RELEVANT_BADGE_IDS = new Set([
  ...BADGE_CUES.map((rule) => rule.badgeId),
  ...EXISTING_BADGE_CUES.map(({ badgeId }) => badgeId),
  "scale-continuity-from-cell-to-society",
  "interbeing-systems",
  "fairness-due-process-and-justification",
  "impermanence-entropy-and-revision",
  "provenance-protocol",
  "financial-fog-warning",
]);

const SIGNAL_CUES: ReadonlyArray<{ kind: CivicTrustSignalKindV1; cue: RegExp }> = [
  { kind: "relational_witness", cue: /\b(?:witness|reference|testimony)\b/i },
  { kind: "reciprocal_history", cue: /\b(?:reciprocal history|repeated reciprocity|relationship history)\b/i },
  { kind: "community_sponsorship", cue: /\b(?:community sponsor|community reputation|local reputation)\b/i },
  { kind: "contract_performance", cue: /\b(?:contract|obligation|payment history)\b/i },
  { kind: "financial_record", cue: /\b(?:financial record|credit history|credit score)\b/i },
  { kind: "repair_record", cue: /\b(?:repair history|repair record|restitution|amends)\b/i },
];

const unique = <T>(values: T[]): T[] => [...new Set(values)];
const normalizedRefs = (refs: string[] | undefined): string[] => unique((refs ?? []).filter((ref) => ref.trim().length > 0));

const readExplicitLevel = (text: string, subject: RegExp): CivicTrustContextLevelV1 => {
  if (new RegExp(`\\bhigh(?:ly)?[-\\s]+${subject.source}`, "i").test(text)) return "high";
  if (new RegExp(`\\bmedium[-\\s]+${subject.source}`, "i").test(text)) return "medium";
  if (new RegExp(`\\blow[-\\s]+${subject.source}`, "i").test(text)) return "low";
  return "unknown";
};

const detectScales = (text: string): CivicTrustScaleV1[] => {
  const candidates: Array<[CivicTrustScaleV1, RegExp]> = [
    ["organism", /\b(?:organism|living system|cellular|cell)\b/i],
    ["relationship", /\b(?:relationship|friend|roommate|neighbor|person)\b/i],
    ["household", /\b(?:household|family|rent|shared home)\b/i],
    ["community", /\b(?:community|local network|neighborhood|town|city)\b/i],
    ["institution", /\b(?:institution|contract|bank|credit|law|agency|employer)\b/i],
    ["civilization", /\b(?:civilization|society|public system|nation)\b/i],
  ];
  return candidates.filter(([, cue]) => cue.test(text)).map(([scale]) => scale);
};

const buildClock = (text: string, cue: RegExp, description: string, refs: string[]): CivicTrustTimeWindowV1 => ({
  state: cue.test(text) ? "partial" : "unknown",
  description,
  evidenceRefs: cue.test(text) ? refs : [],
});

const inferThresholdPurpose = (text: string): CivicTrustThresholdPurposeV1 => {
  if (/\bre[-\s]?entry|appeal|restore(?:d)? access\b/i.test(text)) return "reentry";
  if (/\bauthority|leadership|high[-\s]?stakes\b/i.test(text)) return "authority";
  if (/\breliance|depend(?:s|ed|ency)?\b/i.test(text)) return "reliance";
  return "entry";
};

export function buildCivicTrustTraversabilityV1(
  input: BuildCivicTrustTraversabilityInput,
): CivicTrustTraversabilityV1 | null {
  const text = input.text.trim();
  const matchedRules = BADGE_CUES.filter((rule) => rule.cues.some((cue) => cue.test(text)));
  const explicitBadgeIds = input.activatedBadgeIds ?? [];
  const activatedBadgeIds = unique([
    ...explicitBadgeIds.filter((badgeId) => CIVIC_TRUST_RELEVANT_BADGE_IDS.has(badgeId)),
    ...matchedRules.map((rule) => rule.badgeId),
    ...EXISTING_BADGE_CUES.filter(({ cue }) => cue.test(text)).map(({ badgeId }) => badgeId),
  ]);
  const relevant = matchedRules.length > 0 || /\b(?:trust|accountability|reputation|access|dependency)\b/i.test(text);
  if (!relevant) return null;

  const refs = normalizedRefs(input.refs);
  const trustSignals = SIGNAL_CUES.filter(({ cue }) => cue.test(text)).map(({ kind }, index) => ({
    id: `civic-trust-signal:${kind}:${index + 1}`,
    kind,
    domain: "unspecified_domain",
    observerExposure: "requires_direct_exposure_check",
    observedAt: null,
    lastVerifiedAt: null,
    expiresAt: null,
    evidenceRefs: refs,
    correctionPath: null,
  }));
  const hasThreshold = /\b(?:threshold|eligibility|denied|excluded|re[-\s]?entry|appeal|access decision)\b/i.test(text);
  const hasExclusion = /\b(?:denied|excluded|exclusion|blocked access|rejected)\b/i.test(text);

  return {
    artifactId: CIVIC_TRUST_TRAVERSABILITY_ARTIFACT_ID,
    schemaVersion: CIVIC_TRUST_TRAVERSABILITY_SCHEMA_VERSION,
    scalePath: detectScales(text),
    context: {
      interactionDensity: readExplicitLevel(text, /(?:interaction\s+)?density/),
      repeatedContact: readExplicitLevel(text, /repeated\s+contact/),
      networkOverlap: readExplicitLevel(text, /network\s+overlap/),
      anonymity: readExplicitLevel(text, /anonymity/),
      institutionalReach: readExplicitLevel(text, /institutional\s+reach/),
      resourceScarcity: readExplicitLevel(text, /(?:resource\s+)?scarcity/),
      supportRedundancy: readExplicitLevel(text, /support\s+redundancy/),
    },
    clocks: {
      maturation: buildClock(text, /\b(?:maturation|capacity|foreseeability|support access)\b/i, "Capacity, control, foreseeability, support access, and dependency impact need a bounded maturation window.", refs),
      relationship: buildClock(text, /\b(?:relationship history|repeated contact|prior commitment|successful repair)\b/i, "Contact, reciprocal history, commitments, and repairs need a relationship window.", refs),
      obligation: buildClock(text, /\b(?:obligation|commitment|deadline|disclosure|breach|cure)\b/i, "Risk discovery, useful disclosure, performance, cure, and repair need an obligation window.", refs),
      institutionalMemory: buildClock(text, /\b(?:record|retention|expiry|review date|stale|correction)\b/i, "Record relevance, correction, repair, review, access, and expiry need an institutional-memory window.", refs),
    },
    trustSignals,
    thresholds: hasThreshold
      ? [{
          id: "civic-trust-threshold:observed",
          purpose: inferThresholdPurpose(text),
          criteriaPublished: /\b(?:published|visible|stated) criteria\b/i.test(text),
          reasonVisible: /\b(?:visible|stated|written) reason\b/i.test(text),
          appealPath: /\bappeal path\b/i.test(text) ? "mentioned_not_verified" : null,
          repairPath: /\b(?:repair|re[-\s]?entry) path\b/i.test(text) ? "mentioned_not_verified" : null,
          sunsetOrReviewAt: null,
        }]
      : [],
    exclusionEffects: hasExclusion
      ? [{
          deniedAccess: "access_domain_requires_identification",
          downstreamDependencies: [],
          availableAlternatives: [],
          affectedParties: [],
        }]
      : [],
    activatedBadgeIds,
    missingEvidence: unique([
      ...matchedRules.flatMap((rule) => rule.missingEvidence),
      ...(trustSignals.length > 0 ? ["trust_signal_provenance", "domain_and_observer_exposure", "correction_or_expiry_path"] : []),
      ...(hasExclusion ? ["denied_service", "dependency_chain", "available_alternatives", "affected_parties"] : []),
    ]),
    authority: {
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
      moral_finality: false,
      character_verdict: false,
      financial_authority: false,
      global_trust_score_allowed: false,
    },
  };
}
