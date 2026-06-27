import type { PromptResearchContract } from "../prompt-research-contract";
import { filterCriticTokens, tokenizeAskQuery } from "../query";
import {
  inferHelixAskAnswerPlanSectionEvidenceKinds,
  inferHelixAskAnswerPlanSectionKindFromShape,
  normalizeHelixAskTurnContractText,
  normalizeSlotId,
  type HelixAskAnswerPlanFamily,
} from "../obligations";
import type { HelixAskTurnContractGroundingMode } from "./turn-contract-normalizers";
import type {
  HelixAskObjectivePlannerPassObjective,
  HelixAskObjectivePlannerPassSection,
} from "../objectives/objective-llm-contracts";

const HELIX_ASK_FILE_HINT =
  /(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.(?:ts|tsx|js|jsx|md|json|yml|yaml|mjs|cjs|py|rs|go|java|kt|swift|cpp|c|h)/i;
const HELIX_ASK_REPO_FORCE =
  /\b(cite files?|file paths?|codebase|repo|repository|where in the code|which file|which files|module|component|path\b|according to the codebase|according to the repo|according to the code)\b/i;
const HELIX_ASK_REPO_EXPECTS =
  /\b(in this system|in the system|this repo|this system|the system|system'?s|helix ask|ask pipeline|ask system|codebase|repository|where in the code|which file|which files|file paths?|cite files?|according to the codebase|according to the repo|according to the code|per the codebase|per the repo|from the codebase|from the repo|from the code)\b/i;

const HELIX_ASK_TURN_CONTRACT_TEXT_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "code",
  "codebase",
  "could",
  "define",
  "development",
  "explain",
  "for",
  "future",
  "help",
  "how",
  "i",
  "idea",
  "ideas",
  "implement",
  "implemented",
  "implementation",
  "in",
  "into",
  "is",
  "it",
  "later",
  "make",
  "me",
  "my",
  "of",
  "on",
  "organize",
  "our",
  "plan",
  "planning",
  "please",
  "repo",
  "roadmap",
  "should",
  "so",
  "system",
  "that",
  "the",
  "their",
  "they",
  "them",
  "these",
  "this",
  "to",
  "want",
  "we",
  "with",
  "work",
  "base",
]);

const HELIX_ASK_COMPARISON_OBJECTIVE_LEXICAL_SLOT_DENYLIST = new Set([
  "difference",
  "differences",
  "between",
  "compare",
  "comparison",
  "versus",
  "tradeoff",
  "tradeoffs",
  "solves",
  "solve",
  "option",
  "options",
  "choice",
  "choose",
  "risks",
  "risk",
]);

const HELIX_ASK_TURN_CONTRACT_OBJECTIVE_SLOT_RULES: Array<{
  pattern: RegExp;
  slot: string;
  query: string;
}> = [
  { pattern: /\b(?:api|endpoint|sdk|domain)\b/i, slot: "api-surface", query: "api endpoint integration plan" },
  { pattern: /\b(?:profile|user|account|sign[- ]?in|login|auth)\b/i, slot: "profiles-auth", query: "profiles auth account flow" },
  { pattern: /\b(?:billing|credits?|paywall|subscription|tenant)\b/i, slot: "billing-credits", query: "billing credits paywall flow" },
  { pattern: /\b(?:voice|audio|microphone|speaker|elevenlabs)\b/i, slot: "voice-lane", query: "voice lane audio pipeline" },
  { pattern: /\b(?:transcrib(?:e|ing)|whisper|translation|translate|language|youtube)\b/i, slot: "transcription-translation", query: "transcription translation routing" },
  { pattern: /\b(?:ui|panel|mobile|desktop|overlay|browser)\b/i, slot: "ui-surfaces", query: "ui panel mobile desktop surface plan" },
  { pattern: /\b(?:retrieval|reasoning|planner|prompt|intent|objective)\b/i, slot: "retrieval-reasoning", query: "retrieval reasoning planner coverage" },
  { pattern: /\b(?:storage|save|history|context|capsule|conversation)\b/i, slot: "context-persistence", query: "context persistence storage profile history" },
  { pattern: /\b(?:ranking|rank|title|commander|private)\b/i, slot: "user-ranking", query: "ranking titles credits profile" },
  { pattern: /\b(?:security|spam|safe|privacy|keys?)\b/i, slot: "security-controls", query: "security privacy keys abuse controls" },
];

const HELIX_ASK_TURN_CONTRACT_SOFT_SLOT_IDS = new Set([
  "transcription-translation",
  "context-persistence",
]);

const HELIX_ASK_DEFINITION_DOCS_EXPLAIN_RE =
  /\b(?:explain|summary|summarize|summarise|plain language|what does .* mean)\b/i;
const HELIX_ASK_DOCS_VIEWER_RE =
  /\b(?:paper|doc|docs|document|docs viewer|current docs|viewer context)\b/i;
const HELIX_ASK_EXPLICIT_TRANSCRIPTION_TRANSLATION_RE =
  /\b(?:transcrib(?:e|ing)|transcription|translation|translate|whisper|subtitle|caption|youtube)\b/i;
const HELIX_ASK_EXPLICIT_CONTEXT_PERSISTENCE_RE =
  /\b(?:context persistence|persist(?:ence)?|conversation history|save context|capsule|memory profile|storage profile history)\b/i;

const slugifyHelixAskAnswerPlanSectionId = (value: string, fallback: string): string => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[`"']/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
};

const isHelixAskDefinitionDocsExplainPrompt = (
  label: string,
  family: HelixAskAnswerPlanFamily,
): boolean =>
  family === "definition_overview" &&
  HELIX_ASK_DEFINITION_DOCS_EXPLAIN_RE.test(label) &&
  HELIX_ASK_DOCS_VIEWER_RE.test(label);

const shouldTreatHelixAskObjectiveSlotAsSoft = (args: {
  slot: string;
  label: string;
  family: HelixAskAnswerPlanFamily;
}): boolean => {
  if (!HELIX_ASK_TURN_CONTRACT_SOFT_SLOT_IDS.has(args.slot)) return false;
  if (!isHelixAskDefinitionDocsExplainPrompt(args.label, args.family)) return false;
  if (
    args.slot === "transcription-translation" &&
    HELIX_ASK_EXPLICIT_TRANSCRIPTION_TRANSLATION_RE.test(args.label)
  ) {
    return false;
  }
  if (
    args.slot === "context-persistence" &&
    HELIX_ASK_EXPLICIT_CONTEXT_PERSISTENCE_RE.test(args.label)
  ) {
    return false;
  }
  return true;
};

export const extractHelixAskTurnObjectiveFragments = (
  question: string,
  maxObjectives: number,
): string[] => {
  const normalized = String(question ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\b(?:next\s+idea|another\s+idea|in addition|eventually)\b\s*:?/gi, "\n")
    .replace(/\b(?:and|but)\s+(?=(?:how|what|why|where|which|who|when|whether)\b)/gi, "\n")
    .replace(/[â€¢\u2022]/g, "\n")
    .replace(/>\s+/g, " ")
    .trim();
  const commonalityUnifiedPrompt =
    /\bhave\s+in\s+common\b/i.test(normalized) &&
    /\bwhat\s+(?:is|do|does)\b/i.test(normalized) &&
    !/\b(?:also|plus|meanwhile|next\s+idea|another\s+idea)\b/i.test(normalized);
  if (commonalityUnifiedPrompt) {
    const singleObjective = normalizeHelixAskTurnContractText(normalized, 180);
    if (singleObjective) return [singleObjective];
  }
  const initialParts = normalized
    .split(/\n+|(?<=[.!?;])\s+(?=[A-Z0-9])/)
    .map((entry) => normalizeHelixAskTurnContractText(entry, 180))
    .filter(Boolean);
  const parts = initialParts.length > 1
    ? initialParts
    : normalized
        .split(/\b(?:also|plus|meanwhile)\b/gi)
        .map((entry) => normalizeHelixAskTurnContractText(entry, 180))
        .filter(Boolean);
  const seen = new Set<string>();
  const objectives: string[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower.length < 18) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    objectives.push(part);
    if (objectives.length >= maxObjectives) break;
  }
  if (objectives.length > 1) return objectives;
  const listTailMatch = normalized.match(
    /\b(?:for|including|include|want|need|cover|covers?)\b(.+)$/i,
  );
  const listHead =
    listTailMatch && typeof listTailMatch.index === "number"
      ? normalizeHelixAskTurnContractText(normalized.slice(0, listTailMatch.index), 180)
      : "";
  const listTail = listTailMatch?.[1] ?? normalized;
  const listObjectives = listTail
    .split(/,|(?:\band\b)|(?:\bor\b)/i)
    .map((entry) => normalizeHelixAskTurnContractText(entry, 120))
    .filter((entry) => entry.length >= 4)
    .filter((entry) => !HELIX_ASK_TURN_CONTRACT_TEXT_STOPWORDS.has(entry.toLowerCase()))
    .map((entry) => entry.replace(/^\s*plan\s+for\s+/i, "").trim())
    .filter(Boolean);
  const uniqueListObjectives = Array.from(new Set(listObjectives)).slice(0, maxObjectives);
  if (uniqueListObjectives.length > 1) {
    const primaryCandidate = (objectives[0] ?? listHead ?? "").trim();
    const alreadyIncluded = uniqueListObjectives.some(
      (entry) => entry.toLowerCase() === primaryCandidate.toLowerCase(),
    );
    if (primaryCandidate.length >= 18 && !alreadyIncluded) {
      return [primaryCandidate, ...uniqueListObjectives].slice(0, maxObjectives);
    }
    return uniqueListObjectives;
  }
  if (objectives.length > 0) return objectives;
  const fallback = normalizeHelixAskTurnContractText(question, 180);
  return fallback ? [fallback] : [];
};

const extractHelixAskTurnObjectiveTerms = (value: string, maxTerms = 3): string[] =>
  Array.from(
    new Set(
      filterCriticTokens(tokenizeAskQuery(value))
        .map((token) => token.toLowerCase())
        .filter((token) => token.length >= 4)
        .filter((token) => !HELIX_ASK_TURN_CONTRACT_TEXT_STOPWORDS.has(token)),
    ),
  ).slice(0, Math.max(1, maxTerms));

const extractHelixAskTurnObjectiveSymbolHints = (value: string, maxHints = 3): string[] => {
  const hints = new Set<string>();
  const push = (entry: string): void => {
    const normalized = String(entry ?? "").trim();
    if (!normalized || normalized.length < 4) return;
    hints.add(normalized);
  };
  const endpointMatches = value.match(/\/api\/[a-z0-9/_-]+/gi) ?? [];
  endpointMatches.forEach(push);
  const snakeCaseMatches = value.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+){1,}\b/g) ?? [];
  snakeCaseMatches.forEach(push);
  const camelCaseMatches = value.match(/\b[a-z][a-z0-9_]*[A-Z][A-Za-z0-9_]*\b/g) ?? [];
  camelCaseMatches.forEach(push);
  const callMatches = value.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*\)/g) ?? [];
  callMatches
    .map((entry) => entry.replace(/\s*\(\s*\)\s*$/, ""))
    .forEach(push);
  return Array.from(hints).slice(0, Math.max(1, maxHints));
};

export const buildHelixAskTurnObjectiveSlots = (
  label: string,
  family: HelixAskAnswerPlanFamily,
): string[] => {
  const slots = new Set<string>();
  let matchedRule = false;
  if (family === "roadmap_planning") {
    slots.add("repo-mapping");
    slots.add("implementation-touchpoints");
  }
  for (const rule of HELIX_ASK_TURN_CONTRACT_OBJECTIVE_SLOT_RULES) {
    if (rule.pattern.test(label)) {
      matchedRule = true;
      const normalizedSlot = normalizeSlotId(rule.slot) || rule.slot;
      if (shouldTreatHelixAskObjectiveSlotAsSoft({ slot: normalizedSlot, label, family })) {
        continue;
      }
      slots.add(rule.slot);
    }
  }
  if (/\b(?:what\s+is|what's|define|definition|term)\b/i.test(label)) {
    slots.add("definition");
  }
  if (/\b(?:how|mechanism|process|flow|pipeline|works?|solved?|computed?|derived?)\b/i.test(label)) {
    slots.add("mechanism");
  }
  if (/\b(?:equation|formula|derive|derivation)\b/i.test(label)) {
    slots.add("equation");
  }
  if (
    /\b(?:repo|codebase|module|path|call\s+chain|runtime|implemented?|implementation|full\s+solve|solver)\b/i.test(
      label,
    )
  ) {
    slots.add("code_path");
  }
  const definitionOverviewLabel = /\b(?:what\s+is|what's|define|definition|term|meaning)\b/i.test(label);
  const definitionOverviewExplicitRepoAnchor =
    HELIX_ASK_FILE_HINT.test(label) ||
    HELIX_ASK_REPO_FORCE.test(label) ||
    HELIX_ASK_REPO_EXPECTS.test(label) ||
    /(?:docs|server|client|modules|shared|scripts|tests|tools)\/\S+/i.test(label);
  const allowLexicalTermSlots =
    family !== "definition_overview" ||
    definitionOverviewExplicitRepoAnchor ||
    !definitionOverviewLabel;
  if ((!matchedRule || slots.size < 3) && allowLexicalTermSlots) {
    for (const term of extractHelixAskTurnObjectiveTerms(label, 2)) {
      const normalizedTerm = normalizeSlotId(term);
      if (
        family === "comparison_tradeoff" &&
        HELIX_ASK_COMPARISON_OBJECTIVE_LEXICAL_SLOT_DENYLIST.has(normalizedTerm)
      ) {
        continue;
      }
      slots.add(normalizedTerm);
      if (slots.size >= 4) break;
    }
  }
  return Array.from(slots).slice(0, 4);
};

export const buildHelixAskTurnObjectiveQueryHints = (
  label: string,
  groundingMode: HelixAskTurnContractGroundingMode,
  family: HelixAskAnswerPlanFamily,
): string[] => {
  const hints = new Set<string>();
  const normalizedLabel = normalizeHelixAskTurnContractText(label, 120);
  if (normalizedLabel) hints.add(normalizedLabel);
  const symbolHints = extractHelixAskTurnObjectiveSymbolHints(label, 2);
  for (const symbol of symbolHints) {
    hints.add(symbol);
    if (groundingMode !== "open") {
      hints.add(`${symbol} implementation`);
    }
  }
  for (const rule of HELIX_ASK_TURN_CONTRACT_OBJECTIVE_SLOT_RULES) {
    if (rule.pattern.test(label)) {
      const normalizedSlot = normalizeSlotId(rule.slot) || rule.slot;
      if (shouldTreatHelixAskObjectiveSlotAsSoft({ slot: normalizedSlot, label, family })) {
        continue;
      }
      hints.add(rule.query);
    }
  }
  const terms = extractHelixAskTurnObjectiveTerms(label, 3);
  if (terms.length > 0) {
    hints.add(terms.join(" "));
    if (groundingMode !== "open") {
      hints.add(`${terms.join(" ")} implementation`);
      hints.add(`${terms.join(" ")} repo`);
    }
  }
  return Array.from(hints).slice(0, 5);
};

export const buildHelixAskPromptResearchObjectiveInputs = (args: {
  contract: PromptResearchContract;
  family: HelixAskAnswerPlanFamily;
  groundingMode: HelixAskTurnContractGroundingMode;
  maxObjectives: number;
}): HelixAskObjectivePlannerPassObjective[] => {
  const objectives: HelixAskObjectivePlannerPassObjective[] = [];
  const pushObjective = (
    label: string,
    mustCover: string[],
    extraHints: string[] = [],
  ): void => {
    const normalizedLabel = normalizeHelixAskTurnContractText(label, 180);
    if (!normalizedLabel) return;
    const objectiveSignal = [normalizedLabel, ...mustCover].join(" ").trim();
    const requiredSlots = buildHelixAskTurnObjectiveSlots(objectiveSignal, args.family);
    const queryHints = Array.from(
      new Set(
        [
          normalizedLabel,
          ...mustCover
            .map((entry) => normalizeHelixAskTurnContractText(entry, 120))
            .filter(Boolean)
            .slice(0, 3),
          ...extraHints
            .map((entry) => normalizeHelixAskTurnContractText(entry, 120))
            .filter(Boolean)
            .slice(0, 3),
          ...buildHelixAskTurnObjectiveQueryHints(objectiveSignal, args.groundingMode, args.family),
        ].filter(Boolean),
      ),
    ).slice(0, 5);
    objectives.push({
      label: normalizedLabel,
      required_slots: requiredSlots,
      query_hints: queryHints,
    });
  };

  for (const section of args.contract.required_top_level_structure) {
    pushObjective(section.title, section.must_cover, args.contract.required_repo_inputs.slice(0, 2));
    if (objectives.length >= args.maxObjectives) break;
  }
  if (objectives.length < args.maxObjectives && args.contract.appendix_requirements.length > 0) {
    pushObjective(
      "Derivation Appendix",
      args.contract.appendix_requirements.slice(0, 4),
      args.contract.required_repo_inputs.slice(0, 2),
    );
  }
  if (objectives.length < args.maxObjectives && args.contract.claim_discipline.length > 0) {
    pushObjective("Claim Discipline", args.contract.claim_discipline.slice(0, 4));
  }
  if (objectives.length < args.maxObjectives && args.contract.self_check.length > 0) {
    pushObjective("Self-Check", args.contract.self_check.slice(0, 4));
  }
  return objectives.slice(0, args.maxObjectives);
};

export const buildHelixAskPromptResearchPlannerSections = (args: {
  contract: PromptResearchContract;
  family: HelixAskAnswerPlanFamily;
}): HelixAskObjectivePlannerPassSection[] => {
  const sections: HelixAskObjectivePlannerPassSection[] = [];
  const pushSection = (title: string, mustAnswer: string[]): void => {
    const normalizedTitle = normalizeHelixAskTurnContractText(title, 72);
    if (!normalizedTitle) return;
    const requiredSlots = buildHelixAskTurnObjectiveSlots(
      [normalizedTitle, ...mustAnswer].join(" "),
      args.family,
    );
    const kind = inferHelixAskAnswerPlanSectionKindFromShape({
      family: args.family,
      id: normalizedTitle,
      title: normalizedTitle,
      requiredSlots,
    });
    sections.push({
      id: slugifyHelixAskAnswerPlanSectionId(normalizedTitle, `section_${sections.length + 1}`),
      title: normalizedTitle,
      required: true,
      must_answer: mustAnswer
        .map((entry) => normalizeHelixAskTurnContractText(entry, 160))
        .filter(Boolean)
        .slice(0, 4),
      required_slots: requiredSlots,
      preferred_evidence: inferHelixAskAnswerPlanSectionEvidenceKinds({ kind, requiredSlots }),
      kind,
    });
  };

  for (const section of args.contract.required_top_level_structure) {
    const mustCover = Array.from(
      new Set(
        [
          /\bboundary\b/i.test(section.title)
            ? args.contract.verbatim_constraints[0] ?? null
            : null,
          ...section.must_cover,
        ].filter(Boolean) as string[],
      ),
    );
    pushSection(section.title, mustCover);
    if (sections.length >= 8) break;
  }
  if (sections.length < 8 && args.contract.appendix_requirements.length > 0) {
    pushSection("Derivation Appendix", args.contract.appendix_requirements.slice(0, 4));
  }
  if (sections.length < 8 && args.contract.provenance_table_schema.length > 0) {
    pushSection(
      "Provenance Table",
      [
        `Use columns: ${args.contract.provenance_table_schema.join(", ")}`,
        `Missing substitutions should be ${args.contract.fail_closed_behavior.unknown_marker}`,
      ],
    );
  }
  if (sections.length < 8 && args.contract.claim_discipline.length > 0) {
    pushSection("Claim Discipline", args.contract.claim_discipline.slice(0, 4));
  }
  if (sections.length < 8 && args.contract.self_check.length > 0) {
    pushSection("Self-Check", args.contract.self_check.slice(0, 4));
  }
  return sections.slice(0, 8);
};
