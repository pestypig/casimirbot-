import { IDEOLOGY_CONTEXT_REFLECTION_INPUT_KINDS, type IdeologyContextReflectionInputKindV1 } from "../ideology-context-reflection";

export const MORAL_LIVING_SUBSTRATE_REFLECTION_ARTIFACT_ID = "moral_living_substrate_reflection" as const;
export const MORAL_LIVING_SUBSTRATE_REFLECTION_SCHEMA_VERSION = "moral_living_substrate_reflection/v1" as const;

export const MORAL_LIVING_SUBSTRATE_MATURITY_TIERS = ["substrate", "frontier"] as const;
export type MoralLivingSubstrateMaturityTierV1 = (typeof MORAL_LIVING_SUBSTRATE_MATURITY_TIERS)[number];

export type MoralLivingSubstrateAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

export type MoralLivingSubstrateAdmissionAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_policy";
  ask_context_policy: "evidence_only";
  agent_executable: false;
};

export type MoralLivingSubstrateBadgeV1 = {
  id: string;
  title: string;
  plainMeaning: string;
  whyItMatters: string;
  maturity: MoralLivingSubstrateMaturityTierV1;
  sourceTheoryBadgeIds: string[];
  sourceRefs: MoralLivingSubstrateSourceRefV1[];
  tags: string[];
  hintKeys: string[];
  claimBoundaryNotes: string[];
};

export type MoralLivingSubstrateSourceRefV1 = {
  id: string;
  kind: "paper" | "article" | "database" | "book" | "doc";
  title: string;
  url: string;
  note: string;
};

export type MoralLivingSubstrateMatchV1 = {
  badgeId: string;
  title: string;
  score: number;
  reasons: string[];
  sourceTheoryBadgeIds: string[];
  sourceRefs: MoralLivingSubstrateSourceRefV1[];
  claimBoundaryNotes: string[];
};

export type MoralLivingSubstrateRecommendedActionV1 = {
  actionId: string;
  label: string;
  panelId: "moral-badge-graph" | "theory-badge-graph" | "scientific-calculator";
  args: Record<string, unknown>;
  mutatesCalculator: boolean;
  solves: false;
};

export type MoralLivingSubstrateEstimateLevelV1 = "low" | "medium" | "high" | "unknown";

export type MoralLivingSubstrateProceduralDerivationV1 = {
  derivationId: string;
  label: string;
  matchedBadgeIds: string[];
  evidenceStrength: "weak" | "moderate" | "strong";
  proceduralQuestion: string;
  substrateObservation: string;
  estimate: {
    vulnerability: MoralLivingSubstrateEstimateLevelV1;
    dependency: MoralLivingSubstrateEstimateLevelV1;
    agency: MoralLivingSubstrateEstimateLevelV1;
  };
  obligationHint: string;
  caution: string;
  forbiddenOverclaim: string;
};

export type MoralLivingSubstrateProceduralChainEvidenceStrengthV1 = "present" | "partial" | "missing";

export type MoralLivingSubstrateProceduralChainStepV1 = {
  fromBadgeId: string;
  toBadgeId: string;
  transitionLabel: string;
  proceduralClaim: string;
  evidenceStrength: MoralLivingSubstrateProceduralChainEvidenceStrengthV1;
  missingEvidence: string[];
  forbiddenOverclaim: string;
};

export type MoralLivingSubstrateSynthesisStepV1 = {
  stepId: string;
  label: string;
  description: string;
  derivedFrom: string[];
  outputKind:
    | "substrate_observation"
    | "vulnerability_dependency_agency_estimate"
    | "obligation_caution_forbidden_overclaim";
};

export type MoralLivingSubstrateAdmissionV1 = {
  requested: boolean;
  toolAdmitted: boolean;
  theoryFirstRecommended: boolean;
  reasonCodes: string[];
  blockingReasonCodes: string[];
  authority: MoralLivingSubstrateAdmissionAuthorityV1;
};

export type MoralLivingSubstrateReflectionV1 = {
  artifactId: typeof MORAL_LIVING_SUBSTRATE_REFLECTION_ARTIFACT_ID;
  schemaVersion: typeof MORAL_LIVING_SUBSTRATE_REFLECTION_SCHEMA_VERSION;
  generatedAt: string;
  reflectionId: string;
  graphId: "moral-graph";
  input: {
    kind: IdeologyContextReflectionInputKindV1;
    prompt: string;
    conversationContext: string | null;
    refs: string[];
    sourceTheoryBadgeIds: string[];
    requestedSubstrateBadgeIds: string[];
  };
  exactMatches: MoralLivingSubstrateMatchV1[];
  likelyMatches: MoralLivingSubstrateMatchV1[];
  proceduralDerivations: MoralLivingSubstrateProceduralDerivationV1[];
  proceduralChain: MoralLivingSubstrateProceduralChainStepV1[];
  synthesisPath: MoralLivingSubstrateSynthesisStepV1[];
  sourceTheoryBadgeIds: string[];
  sourceRefs: MoralLivingSubstrateSourceRefV1[];
  claimBoundaryNotes: string[];
  evidenceForAsk: {
    summary: string;
    claimBoundaries: string[];
    recommendedNextActions: MoralLivingSubstrateRecommendedActionV1[];
  };
  admissions: MoralLivingSubstrateAdmissionV1 | null;
  authority: MoralLivingSubstrateAuthorityV1;
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

type BuildMoralLivingSubstrateReflectionInput = Omit<
  MoralLivingSubstrateReflectionV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "reflectionId"
  | "authority"
  | "assistant_answer"
  | "raw_content_included"
  | "terminal_eligible"
  | "context_role"
  | "ask_context_policy"
  | "deterministic_content_role"
> & {
  generatedAt?: string;
  reflectionId?: string;
};

const AUTHORITY: MoralLivingSubstrateAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  deterministic_content_role: "observation_not_assistant_answer",
};

const FORBIDDEN_SUBSTRATE_REFLECTION_PATTERNS = [
  /\borch[-\s]?or\s+is\s+proven\b/i,
  /\ball\s+organisms\s+are\s+conscious\b/i,
  /\bproves\s+personhood\b/i,
  /\b(?:is|becomes|authorizes|delivers|produces)\s+(?:a\s+|the\s+)?final\s+moral\s+verdict\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(values: T, value: unknown): value is T[number] =>
  typeof value === "string" && values.includes(value);

const SOURCE_REF_KINDS = ["paper", "article", "database", "book", "doc"] as const;

function newReflectionId(): string {
  return `moral-living-substrate-reflection:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function validateAuthority(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (value.assistant_answer !== false) issues.push(`${prefix}.assistant_answer must be false`);
  if (value.raw_content_included !== false) issues.push(`${prefix}.raw_content_included must be false`);
  if (value.terminal_eligible !== false) issues.push(`${prefix}.terminal_eligible must be false`);
  if (value.context_role !== "tool_evidence") issues.push(`${prefix}.context_role must be tool_evidence`);
  if (value.ask_context_policy !== "evidence_only") issues.push(`${prefix}.ask_context_policy must be evidence_only`);
  if (value.deterministic_content_role !== "observation_not_assistant_answer") {
    issues.push(`${prefix}.deterministic_content_role must be observation_not_assistant_answer`);
  }
}

function validateMatch(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["badgeId", "title"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isFiniteNumber(value.score) || value.score < 0 || value.score > 1) {
    issues.push(`${prefix}.score must be between 0 and 1`);
  }
  for (const field of ["reasons", "sourceTheoryBadgeIds", "claimBoundaryNotes"] as const) {
    if (!isStringArray(value[field])) issues.push(`${prefix}.${field} must be a string array`);
  }
  validateSourceRefs(`${prefix}.sourceRefs`, value.sourceRefs, issues);
}

function validateSourceRef(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "title", "url", "note"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(SOURCE_REF_KINDS, value.kind)) issues.push(`${prefix}.kind is invalid`);
}

function validateSourceRefs(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  value.forEach((entry: unknown, index: number) => validateSourceRef(`${prefix}[${index}]`, entry, issues));
}

function validateMatchArray(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  value.forEach((entry: unknown, index: number) => validateMatch(`${prefix}[${index}]`, entry, issues));
}

function validateRecommendedAction(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["actionId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!["moral-badge-graph", "theory-badge-graph", "scientific-calculator"].includes(String(value.panelId))) {
    issues.push(`${prefix}.panelId is invalid`);
  }
  if (!isRecord(value.args)) issues.push(`${prefix}.args must be an object`);
  if (typeof value.mutatesCalculator !== "boolean") issues.push(`${prefix}.mutatesCalculator must be boolean`);
  if (value.solves !== false) issues.push(`${prefix}.solves must be false`);
}

const ESTIMATE_LEVELS: MoralLivingSubstrateEstimateLevelV1[] = ["low", "medium", "high", "unknown"];
const DERIVATION_STRENGTHS = ["weak", "moderate", "strong"] as const;
const PROCEDURAL_CHAIN_STRENGTHS: MoralLivingSubstrateProceduralChainEvidenceStrengthV1[] = [
  "present",
  "partial",
  "missing",
];
const SYNTHESIS_OUTPUT_KINDS: MoralLivingSubstrateSynthesisStepV1["outputKind"][] = [
  "substrate_observation",
  "vulnerability_dependency_agency_estimate",
  "obligation_caution_forbidden_overclaim",
];

function validateProceduralDerivation(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of [
    "derivationId",
    "label",
    "proceduralQuestion",
    "substrateObservation",
    "obligationHint",
    "caution",
    "forbiddenOverclaim",
  ] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isStringArray(value.matchedBadgeIds)) issues.push(`${prefix}.matchedBadgeIds must be a string array`);
  if (!includes(DERIVATION_STRENGTHS, value.evidenceStrength)) {
    issues.push(`${prefix}.evidenceStrength is invalid`);
  }
  if (!isRecord(value.estimate)) {
    issues.push(`${prefix}.estimate must be an object`);
  } else {
    for (const field of ["vulnerability", "dependency", "agency"] as const) {
      if (!includes(ESTIMATE_LEVELS, value.estimate[field])) issues.push(`${prefix}.estimate.${field} is invalid`);
    }
  }
}

function validateProceduralChainStep(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of [
    "fromBadgeId",
    "toBadgeId",
    "transitionLabel",
    "proceduralClaim",
    "forbiddenOverclaim",
  ] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(PROCEDURAL_CHAIN_STRENGTHS, value.evidenceStrength)) {
    issues.push(`${prefix}.evidenceStrength is invalid`);
  }
  if (!isStringArray(value.missingEvidence)) issues.push(`${prefix}.missingEvidence must be a string array`);
}

function validateSynthesisStep(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["stepId", "label", "description"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isStringArray(value.derivedFrom)) issues.push(`${prefix}.derivedFrom must be a string array`);
  if (!includes(SYNTHESIS_OUTPUT_KINDS, value.outputKind)) issues.push(`${prefix}.outputKind is invalid`);
}

function validateAdmissions(prefix: string, value: unknown, issues: string[]): void {
  if (value === null) return;
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object or null`);
    return;
  }
  for (const field of ["requested", "toolAdmitted", "theoryFirstRecommended"] as const) {
    if (typeof value[field] !== "boolean") issues.push(`${prefix}.${field} must be boolean`);
  }
  for (const field of ["reasonCodes", "blockingReasonCodes"] as const) {
    if (!isStringArray(value[field])) issues.push(`${prefix}.${field} must be a string array`);
  }
  if (!isRecord(value.authority)) {
    issues.push(`${prefix}.authority must be an object`);
  } else {
    if (value.authority.assistant_answer !== false) issues.push(`${prefix}.authority.assistant_answer must be false`);
    if (value.authority.raw_content_included !== false) {
      issues.push(`${prefix}.authority.raw_content_included must be false`);
    }
    if (value.authority.terminal_eligible !== false) issues.push(`${prefix}.authority.terminal_eligible must be false`);
    if (value.authority.context_role !== "tool_policy") issues.push(`${prefix}.authority.context_role must be tool_policy`);
    if (value.authority.ask_context_policy !== "evidence_only") {
      issues.push(`${prefix}.authority.ask_context_policy must be evidence_only`);
    }
    if (value.authority.agent_executable !== false) issues.push(`${prefix}.authority.agent_executable must be false`);
  }
}

export function buildMoralLivingSubstrateReflectionV1(
  input: BuildMoralLivingSubstrateReflectionInput,
): MoralLivingSubstrateReflectionV1 {
  const { generatedAt, reflectionId, ...rest } = input;
  return {
    artifactId: MORAL_LIVING_SUBSTRATE_REFLECTION_ARTIFACT_ID,
    schemaVersion: MORAL_LIVING_SUBSTRATE_REFLECTION_SCHEMA_VERSION,
    generatedAt: generatedAt ?? new Date().toISOString(),
    reflectionId: reflectionId ?? newReflectionId(),
    ...rest,
    authority: { ...AUTHORITY },
    ...AUTHORITY,
  };
}

export function validateMoralLivingSubstrateReflectionV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["moral living substrate reflection must be an object"];

  if (value.artifactId !== MORAL_LIVING_SUBSTRATE_REFLECTION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${MORAL_LIVING_SUBSTRATE_REFLECTION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== MORAL_LIVING_SUBSTRATE_REFLECTION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${MORAL_LIVING_SUBSTRATE_REFLECTION_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "reflectionId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (value.graphId !== "moral-graph") issues.push("graphId must be moral-graph");

  if (!isRecord(value.input)) {
    issues.push("input must be an object");
  } else {
    if (!includes(IDEOLOGY_CONTEXT_REFLECTION_INPUT_KINDS, value.input.kind)) issues.push("input.kind is invalid");
    if (!isNonEmptyString(value.input.prompt)) issues.push("input.prompt must be a non-empty string");
    if (value.input.conversationContext !== null && typeof value.input.conversationContext !== "string") {
      issues.push("input.conversationContext must be a string or null");
    }
    for (const field of ["refs", "sourceTheoryBadgeIds", "requestedSubstrateBadgeIds"] as const) {
      if (!isStringArray(value.input[field])) issues.push(`input.${field} must be a string array`);
    }
  }

  validateMatchArray("exactMatches", value.exactMatches, issues);
  validateMatchArray("likelyMatches", value.likelyMatches, issues);
  if (!Array.isArray(value.proceduralDerivations)) {
    issues.push("proceduralDerivations must be an array");
  } else {
    value.proceduralDerivations.forEach((derivation: unknown, index: number) =>
      validateProceduralDerivation(`proceduralDerivations[${index}]`, derivation, issues),
    );
  }
  if (!Array.isArray(value.proceduralChain)) {
    issues.push("proceduralChain must be an array");
  } else {
    value.proceduralChain.forEach((step: unknown, index: number) =>
      validateProceduralChainStep(`proceduralChain[${index}]`, step, issues),
    );
  }
  if (!Array.isArray(value.synthesisPath)) {
    issues.push("synthesisPath must be an array");
  } else {
    value.synthesisPath.forEach((step: unknown, index: number) =>
      validateSynthesisStep(`synthesisPath[${index}]`, step, issues),
    );
  }
  if (!isStringArray(value.sourceTheoryBadgeIds)) issues.push("sourceTheoryBadgeIds must be a string array");
  validateSourceRefs("sourceRefs", value.sourceRefs, issues);
  if (!isStringArray(value.claimBoundaryNotes)) issues.push("claimBoundaryNotes must be a string array");

  if (!isRecord(value.evidenceForAsk)) {
    issues.push("evidenceForAsk must be an object");
  } else {
    if (!isNonEmptyString(value.evidenceForAsk.summary)) issues.push("evidenceForAsk.summary must be a non-empty string");
    if (!isStringArray(value.evidenceForAsk.claimBoundaries)) {
      issues.push("evidenceForAsk.claimBoundaries must be a string array");
    }
    if (!Array.isArray(value.evidenceForAsk.recommendedNextActions)) {
      issues.push("evidenceForAsk.recommendedNextActions must be an array");
    } else {
      value.evidenceForAsk.recommendedNextActions.forEach((action: unknown, index: number) =>
        validateRecommendedAction(`evidenceForAsk.recommendedNextActions[${index}]`, action, issues),
      );
    }
  }

  validateAdmissions("admissions", value.admissions, issues);
  validateAuthority("authority", value.authority, issues);
  validateAuthority("top-level authority", value, issues);

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_SUBSTRATE_REFLECTION_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden substrate overclaim matched: ${pattern.source}`);
  }

  return issues;
}

export function isMoralLivingSubstrateReflectionV1(value: unknown): value is MoralLivingSubstrateReflectionV1 {
  return validateMoralLivingSubstrateReflectionV1(value).length === 0;
}
