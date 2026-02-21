import type {
  AdapterPremeditationCandidate,
  AdapterPremeditationResult,
  TrainingTraceConstraint,
} from "../../../shared/schema.js";

export const IDEOLOGY_HARD_FAIL_IDS = {
  missingLegalKey: "IDEOLOGY_MISSING_LEGAL_KEY",
  missingEthosKey: "IDEOLOGY_MISSING_ETHOS_KEY",
  jurisdictionFloorViolation: "IDEOLOGY_JURISDICTIONAL_FLOOR_VIOLATION",
} as const;

export type IdeologyHardFailId =
  (typeof IDEOLOGY_HARD_FAIL_IDS)[keyof typeof IDEOLOGY_HARD_FAIL_IDS];

export type IdeologyActionGatePolicy = {
  version: number;
  claim_tier: string;
  covered_action_tags: readonly string[];
  legal_key_tags: readonly string[];
  ethos_key_tags: readonly string[];
  jurisdiction_floor_ok_tags: readonly string[];
  hard_fail_ids: {
    missing_legal_key: IdeologyHardFailId;
    missing_ethos_key: IdeologyHardFailId;
    jurisdiction_floor_violation: IdeologyHardFailId;
  };
};

export const DEFAULT_IDEOLOGY_ACTION_GATE_POLICY: IdeologyActionGatePolicy = {
  version: 1,
  claim_tier: "diagnostic",
  covered_action_tags: [
    "covered-action",
    "covered_action",
    "ideology-gate-covered",
    "requires-dual-key",
    "requires_dual_key",
  ],
  legal_key_tags: ["legal-key", "legal_key", "legal-ok", "legal_ok"],
  ethos_key_tags: ["ethos-key", "ethos_key", "ethos-ok", "ethos_ok"],
  jurisdiction_floor_ok_tags: [
    "jurisdiction-floor-ok",
    "jurisdiction_floor_ok",
    "jurisdictional-floor-ok",
    "jurisdictional_floor_ok",
  ],
  hard_fail_ids: {
    missing_legal_key: IDEOLOGY_HARD_FAIL_IDS.missingLegalKey,
    missing_ethos_key: IDEOLOGY_HARD_FAIL_IDS.missingEthosKey,
    jurisdiction_floor_violation: IDEOLOGY_HARD_FAIL_IDS.jurisdictionFloorViolation,
  },
};

export type IdeologyGateDecision = {
  coveredAction: boolean;
  legalKey: boolean;
  ethosKey: boolean;
  jurisdictionFloorOk: boolean;
  firstFail: IdeologyHardFailId | null;
};

const IDEOLOGY_FIRST_FAIL_PREFIX = "ideology_gate.firstFail:";

const normalizeTagSet = (tags?: string[]): Set<string> =>
  new Set(
    (tags ?? [])
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );

const hasAnyTag = (tags: Set<string>, options: readonly string[]): boolean =>
  options.some((entry) => tags.has(entry));

const asKnownHardFailId = (value: string): IdeologyHardFailId | null => {
  const expected = new Set<string>(Object.values(IDEOLOGY_HARD_FAIL_IDS));
  return expected.has(value) ? (value as IdeologyHardFailId) : null;
};

export const evaluateIdeologyGateFromTags = (
  tags: string[] | undefined,
  policy: IdeologyActionGatePolicy = DEFAULT_IDEOLOGY_ACTION_GATE_POLICY,
): IdeologyGateDecision => {
  const normalizedTags = normalizeTagSet(tags);
  const coveredAction = hasAnyTag(normalizedTags, policy.covered_action_tags);
  const legalKey = hasAnyTag(normalizedTags, policy.legal_key_tags);
  const ethosKey = hasAnyTag(normalizedTags, policy.ethos_key_tags);
  const jurisdictionFloorOk = hasAnyTag(
    normalizedTags,
    policy.jurisdiction_floor_ok_tags,
  );

  if (!coveredAction) {
    return {
      coveredAction,
      legalKey,
      ethosKey,
      jurisdictionFloorOk,
      firstFail: null,
    };
  }
  if (!legalKey) {
    return {
      coveredAction,
      legalKey,
      ethosKey,
      jurisdictionFloorOk,
      firstFail: policy.hard_fail_ids.missing_legal_key,
    };
  }
  if (!ethosKey) {
    return {
      coveredAction,
      legalKey,
      ethosKey,
      jurisdictionFloorOk,
      firstFail: policy.hard_fail_ids.missing_ethos_key,
    };
  }
  if (!jurisdictionFloorOk) {
    return {
      coveredAction,
      legalKey,
      ethosKey,
      jurisdictionFloorOk,
      firstFail: policy.hard_fail_ids.jurisdiction_floor_violation,
    };
  }
  return {
    coveredAction,
    legalKey,
    ethosKey,
    jurisdictionFloorOk,
    firstFail: null,
  };
};

export const evaluateIdeologyGate = (
  candidate: AdapterPremeditationCandidate,
  policy: IdeologyActionGatePolicy = DEFAULT_IDEOLOGY_ACTION_GATE_POLICY,
): IdeologyGateDecision =>
  evaluateIdeologyGateFromTags(candidate.tags, policy);

export const buildIdeologyGateRationaleTags = (
  decision: IdeologyGateDecision,
): string[] => {
  const tags = [
    `ideology_gate.covered_action:${decision.coveredAction ? 1 : 0}`,
    `ideology_gate.legal_key:${decision.legalKey ? 1 : 0}`,
    `ideology_gate.ethos_key:${decision.ethosKey ? 1 : 0}`,
    `ideology_gate.jurisdiction_floor_ok:${decision.jurisdictionFloorOk ? 1 : 0}`,
  ];
  if (decision.firstFail) {
    tags.push(`${IDEOLOGY_FIRST_FAIL_PREFIX}${decision.firstFail}`);
    tags.push("ideology_gate.severity:HARD");
  }
  return tags;
};

export const extractIdeologyHardFailIdFromRationaleTags = (
  tags: string[] | undefined,
): IdeologyHardFailId | null => {
  for (const tag of tags ?? []) {
    if (!tag.startsWith(IDEOLOGY_FIRST_FAIL_PREFIX)) continue;
    const parsed = tag.slice(IDEOLOGY_FIRST_FAIL_PREFIX.length).trim();
    if (!parsed) continue;
    return asKnownHardFailId(parsed);
  }
  return null;
};

export const extractIdeologyHardFailFromPremeditationResult = (
  result: AdapterPremeditationResult | undefined,
): IdeologyHardFailId | null => {
  if (!result) return null;
  if (typeof result.chosenCandidateId === "string" && result.chosenCandidateId.trim()) {
    return null;
  }
  return extractIdeologyHardFailIdFromRationaleTags(result.rationaleTags);
};


export const IDEOLOGY_PRESSURE_REASON_CODES = {
  romanceInvestmentUrgency: "IDEOLOGY_PRESSURE_ROMANCE_INVESTMENT_URGENCY",
  secrecyAuthorityFinancial: "IDEOLOGY_PRESSURE_SECRECY_AUTHORITY_FINANCIAL",
} as const;

export type IdeologyPressureReasonCode =
  (typeof IDEOLOGY_PRESSURE_REASON_CODES)[keyof typeof IDEOLOGY_PRESSURE_REASON_CODES];

export type IdeologyPressureGateDecision = {
  blocked: boolean;
  warned: boolean;
  reasonCodes: IdeologyPressureReasonCode[];
};

export const evaluatePressureBundleGate = (activePressures: string[] | undefined): IdeologyPressureGateDecision => {
  const set = normalizeTagSet(activePressures);
  const hasRomanceInvestmentUrgency =
    set.has("sexualized_attention") && set.has("financial_ask") && set.has("urgency_scarcity");
  const hasSecrecyAuthorityFinancial =
    set.has("isolation_secrecy") && set.has("authority_claim") && set.has("financial_ask");

  const reasonCodes: IdeologyPressureReasonCode[] = [];
  if (hasRomanceInvestmentUrgency) reasonCodes.push(IDEOLOGY_PRESSURE_REASON_CODES.romanceInvestmentUrgency);
  if (hasSecrecyAuthorityFinancial) reasonCodes.push(IDEOLOGY_PRESSURE_REASON_CODES.secrecyAuthorityFinancial);

  return {
    blocked: reasonCodes.length > 0,
    warned: reasonCodes.length > 0,
    reasonCodes,
  };
};

export const toIdeologyHardFailConstraint = (
  firstFailId: IdeologyHardFailId,
): TrainingTraceConstraint => ({
  id: firstFailId,
  severity: "HARD",
  status: "fail",
  value: null,
  limit: null,
  note: "class=constraint,ideology_hard_action_gate",
});

