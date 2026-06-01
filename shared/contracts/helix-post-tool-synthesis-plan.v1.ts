export const HELIX_POST_TOOL_SYNTHESIS_PLAN_ARTIFACT_ID =
  "helix_post_tool_synthesis_plan" as const;

export const HELIX_POST_TOOL_SYNTHESIS_PLAN_SCHEMA_VERSION =
  "helix_post_tool_synthesis_plan/v1" as const;

export const HELIX_POST_TOOL_ANSWER_INTENTS = [
  "concept_explanation",
  "numeric_result",
  "theory_graph_mapping",
  "evidence_review",
  "debug_report",
  "action_confirmation",
  "mixed",
] as const;

export const HELIX_POST_TOOL_SYNTHESIS_SECTION_IDS = [
  "direct_answer",
  "concept_explanation",
  "numeric_result",
  "tool_observation_summary",
  "graph_placement",
  "runtime_boundary",
  "claim_boundary",
  "next_steps",
] as const;

export type HelixPostToolAnswerIntent = (typeof HELIX_POST_TOOL_ANSWER_INTENTS)[number];
export type HelixPostToolSynthesisSectionId = (typeof HELIX_POST_TOOL_SYNTHESIS_SECTION_IDS)[number];

export type HelixPostToolSynthesisPlanV1 = {
  artifactId: typeof HELIX_POST_TOOL_SYNTHESIS_PLAN_ARTIFACT_ID;
  schemaVersion: typeof HELIX_POST_TOOL_SYNTHESIS_PLAN_SCHEMA_VERSION;
  generatedAt: string;
  synthesisPlanId: string;
  turnId: string;
  prompt: string;
  answerIntent: HelixPostToolAnswerIntent;
  secondaryIntents: HelixPostToolAnswerIntent[];
  evidenceRefs: string[];
  observedReceiptKinds: string[];
  requiredAnswerSections: Array<{
    id: HelixPostToolSynthesisSectionId;
    label: string;
    required: boolean;
  }>;
  prohibitedMoves: string[];
  synthesisInstructions: string[];
  authority: {
    assistant_answer: false;
    raw_content_included: false;
    terminal_eligible: false;
    context_role: "synthesis_plan";
    ask_context_policy: "evidence_only";
    deterministic_content_role: "plan_not_answer";
  };
};

type BuildHelixPostToolSynthesisPlanInput = Omit<
  HelixPostToolSynthesisPlanV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "synthesisPlanId" | "authority"
> & {
  generatedAt?: string;
  synthesisPlanId?: string;
};

const AUTHORITY: HelixPostToolSynthesisPlanV1["authority"] = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "synthesis_plan",
  ask_context_policy: "evidence_only",
  deterministic_content_role: "plan_not_answer",
};

const FORBIDDEN_POST_TOOL_SYNTHESIS_PATTERNS = [
  /\bvalidated propulsion\b/i,
  /\bworking warp drive\b/i,
  /\bphysical mechanism confirmed\b/i,
  /\bQEI passed\b/i,
  /\bproven warp\b/i,
  /\bcertified transport solution\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function newSynthesisPlanId(): string {
  return `helix-post-tool-synthesis:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function validateAuthority(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("authority must be an object");
    return;
  }
  if (value.assistant_answer !== false) issues.push("authority.assistant_answer must be false");
  if (value.raw_content_included !== false) issues.push("authority.raw_content_included must be false");
  if (value.terminal_eligible !== false) issues.push("authority.terminal_eligible must be false");
  if (value.context_role !== "synthesis_plan") issues.push("authority.context_role must be synthesis_plan");
  if (value.ask_context_policy !== "evidence_only") issues.push("authority.ask_context_policy must be evidence_only");
  if (value.deterministic_content_role !== "plan_not_answer") {
    issues.push("authority.deterministic_content_role must be plan_not_answer");
  }
}

export function buildHelixPostToolSynthesisPlanV1(
  input: BuildHelixPostToolSynthesisPlanInput,
): HelixPostToolSynthesisPlanV1 {
  return {
    artifactId: HELIX_POST_TOOL_SYNTHESIS_PLAN_ARTIFACT_ID,
    schemaVersion: HELIX_POST_TOOL_SYNTHESIS_PLAN_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    synthesisPlanId: input.synthesisPlanId ?? newSynthesisPlanId(),
    turnId: input.turnId,
    prompt: input.prompt,
    answerIntent: input.answerIntent,
    secondaryIntents: input.secondaryIntents,
    evidenceRefs: input.evidenceRefs,
    observedReceiptKinds: input.observedReceiptKinds,
    requiredAnswerSections: input.requiredAnswerSections,
    prohibitedMoves: input.prohibitedMoves,
    synthesisInstructions: input.synthesisInstructions,
    authority: { ...AUTHORITY },
  };
}

export function validateHelixPostToolSynthesisPlanV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["helix post-tool synthesis plan must be an object"];

  if (value.artifactId !== HELIX_POST_TOOL_SYNTHESIS_PLAN_ARTIFACT_ID) {
    issues.push(`artifactId must be ${HELIX_POST_TOOL_SYNTHESIS_PLAN_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== HELIX_POST_TOOL_SYNTHESIS_PLAN_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${HELIX_POST_TOOL_SYNTHESIS_PLAN_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "synthesisPlanId", "turnId", "prompt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!includes(HELIX_POST_TOOL_ANSWER_INTENTS, value.answerIntent)) issues.push("answerIntent is invalid");
  if (!Array.isArray(value.secondaryIntents)) {
    issues.push("secondaryIntents must be an array");
  } else {
    value.secondaryIntents.forEach((intent, index) => {
      if (!includes(HELIX_POST_TOOL_ANSWER_INTENTS, intent)) issues.push(`secondaryIntents[${index}] is invalid`);
    });
  }
  for (const field of ["evidenceRefs", "observedReceiptKinds", "prohibitedMoves", "synthesisInstructions"] as const) {
    if (!Array.isArray(value[field])) issues.push(`${field} must be an array`);
    else value[field].forEach((entry, index) => {
      if (!isNonEmptyString(entry)) issues.push(`${field}[${index}] must be a non-empty string`);
    });
  }
  if (Array.isArray(value.observedReceiptKinds) && value.observedReceiptKinds.length > 0) {
    if (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.length === 0) {
      issues.push("evidenceRefs must be non-empty when observed receipts exist");
    }
  }
  if (!Array.isArray(value.requiredAnswerSections)) {
    issues.push("requiredAnswerSections must be an array");
  } else {
    value.requiredAnswerSections.forEach((section, index) => {
      if (!isRecord(section)) {
        issues.push(`requiredAnswerSections[${index}] must be an object`);
        return;
      }
      if (!includes(HELIX_POST_TOOL_SYNTHESIS_SECTION_IDS, section.id)) {
        issues.push(`requiredAnswerSections[${index}].id is invalid`);
      }
      if (!isNonEmptyString(section.label)) issues.push(`requiredAnswerSections[${index}].label must be a non-empty string`);
      if (typeof section.required !== "boolean") issues.push(`requiredAnswerSections[${index}].required must be boolean`);
    });
  }
  validateAuthority(value.authority, issues);

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_POST_TOOL_SYNTHESIS_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden overclaiming text matched: ${pattern.source}`);
  }

  return issues;
}

export function isHelixPostToolSynthesisPlanV1(
  value: unknown,
): value is HelixPostToolSynthesisPlanV1 {
  return validateHelixPostToolSynthesisPlanV1(value).length === 0;
}
