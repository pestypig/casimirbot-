import { detectContextualToolAdmissionSuppression } from "./contextual-tool-admission";
import {
  findRepoConceptAliasMatch,
  repoConceptAliasTerms,
} from "./repo-concept-alias-registry";
import { detectModelOnlyConceptSourceSignal } from "./model-only-concept-source-guard";

export type RepoConceptDetection = {
  applies: boolean;
  confidence: "high" | "medium" | "low";
  concept: string | null;
  normalized_terms: string[];
  reason: string;
  require_repo_evidence: boolean;
  allow_model_direct_answer: boolean;
};

export type HelixRepoConceptMatch = {
  canonical: string;
  reason: "project_local_entity_definition";
};

type ProjectLocalEntity = {
  canonical: string;
  pattern: RegExp;
};

const PROJECT_LOCAL_ENTITIES: ProjectLocalEntity[] = [
  { canonical: "Auntie Dottie", pattern: /\bauntie\s+dottie\b/i },
  { canonical: "Dottie", pattern: /\bdottie\b/i },
  { canonical: "Situation Room", pattern: /\bsituation\s+room\b/i },
  { canonical: "Route Evidence", pattern: /\broute\s+evidence\b/i },
  { canonical: "terminal authority", pattern: /\bterminal\s+authority\b/i },
  { canonical: "Helix Ask", pattern: /\bhelix\s+ask\b/i },
  { canonical: "docs panel", pattern: /\bdocs?\s+panel\b|\bdocuments?\s+panel\b/i },
  { canonical: "docs viewer", pattern: /\bdocs?\s+viewer\b|\bdocument\s+viewer\b/i },
  { canonical: "live environment", pattern: /\blive\s+environment\b|\blive\s+answer\s+environment\b/i },
  { canonical: "field worker", pattern: /\bfield\s+workers?\b/i },
  { canonical: "observer", pattern: /\bobservers?\b/i },
  { canonical: "evidence gate", pattern: /\bevidence\s+gate\b/i },
  { canonical: "route product contract", pattern: /\broute\s+product\s+contract\b/i },
  { canonical: "agent step decision", pattern: /\bagent\s+step\s+decision\b|\bagent_step_decision\b/i },
  { canonical: "source target", pattern: /\bsource\s+target\b|\bsource[-_\s]?target(?:\s+intent)?\b|\bsource_target_intent\b/i },
  { canonical: "procedure memory", pattern: /\bprocedure\s+memory\b/i },
  { canonical: "visual capture", pattern: /\bvisual\s+capture\b/i },
  { canonical: "Reasoning Theater", pattern: /\breasoning[-_\s]+theat(?:er|re)\b/i },

  // Existing project-local concepts retained for compatibility with repo-evidence routing.
  { canonical: "StarSim", pattern: /\bstar\s*sim(?:ulation|ulations|ulator)?\b|\bstellar\s+sim(?:ulation|ulations)?\b|\bstarsim\b/i },
  { canonical: "NHM2", pattern: /\bnhm2\b/i },
  { canonical: "Needle Hull", pattern: /\bneedle\s+hull\b/i },
  { canonical: "deep mixing", pattern: /\bdeep\s+mixing\b/i },
  { canonical: "perturbation broker", pattern: /\bperturbation(?:\s+broker|s)?\b/i },
  { canonical: "Codex", pattern: /\bcodex\b/i },
  { canonical: "agentic turn loop", pattern: /\bagentic\s+turn(?:-|\s+)based\s+system\b|\bagentic\s+(?:loop|turn|system)\b/i },
  { canonical: "tool eligibility", pattern: /\btool\s+calls?\b|\brepo\s+grep\b|\btool\s+eligibility\b/i },
  { canonical: "Stage0", pattern: /\bstage\s*0\b|\bstage0\b/i },
  { canonical: "code lattice", pattern: /\bcode\s+lattice\b/i },
];

export const PROJECT_ENTITY_DEFINITION_RE =
  /\b(?:what\s+is|what\s+are|what\s+does|do\s+you\s+know\s+what|how\s+does|how\s+do|where\s+is|where\s+are|define|explain|describe|tell\s+me\s+about|why\s+did)\b/i;

const PROJECT_ANCHOR_RE =
  /\b(?:in\s+helix|helix\s+ask|in\s+this\s+app|this\s+app|repo|repository|codebase|agent|workstation|casimirbot|casimir\s*bot)\b/i;

const NEGATIVE_TOOL_CONSTRAINT_ANCHOR_RE =
  /\b(?:do\s+not|don't|dont|without|unless\s+needed,?\s*do\s+not)\s+us(?:e|ing)\s+(?:the\s+)?(?:workstation\s+)?tools?\b|\bdo\s+not\s+use\s+workstation\s+tools\s+unless\s+(?:needed|necessary|genuinely\s+needed)\b/gi;

const EXPLICIT_NON_REPO_GROUNDING_RE =
  /\b(?:do\s+not|don't|dont|without)\s+(?:search|use|look\s+in|inspect|read)\s+(?:the\s+)?(?:repo|repository|code|codebase|workspace|source)\b|\b(?:just|only)\s+answer\s+generally\b|\bgeneral\s+(?:answer|explanation)\s+only\b/i;

const WORKSTATION_ACTION_PROMPT_RE =
  /^\s*(?:please\s+)?(?:open|focus|close|show|launch|start|create|manifest|attach|detach|run)\b[\s\S]{0,100}\b(?:panel|situation\s+room|docs?\s+viewer|docs?\s+panel|auntie\s+dottie|dottie|observer|route\s+evidence)\b/i;

const LEGAL_TERMINAL_AUTHORITY_RE =
  /\bterminal\s+authority\b[\s\S]{0,80}\b(?:in\s+law|legal|court|jurisdiction|statute|case\s+law)\b|\b(?:in\s+law|legal|court|jurisdiction|statute|case\s+law)\b[\s\S]{0,80}\bterminal\s+authority\b/i;

const CAMEL_CASE_RE = /\b[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*\b/;
const PROJECT_LIKE_CAPITALIZED_PHRASE_RE =
  /\b[A-Z][a-z0-9]+(?:\s+[A-Z][a-z0-9]+){1,3}\b/;

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const normalizeTerm = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const termsForConcept = (concept: string | null): string[] => {
  if (!concept) return [];
  const normalized = normalizeTerm(concept);
  const lower = normalized.toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  return unique([normalized, lower, ...tokens]);
};

const findProjectEntity = (prompt: string): ProjectLocalEntity | null =>
  PROJECT_LOCAL_ENTITIES.find((entry) => entry.pattern.test(prompt)) ?? null;

const extractProjectLikeConcept = (prompt: string): string | null => {
  const camel = prompt.match(CAMEL_CASE_RE)?.[0];
  if (camel) return camel;

  const capitalized = prompt.match(PROJECT_LIKE_CAPITALIZED_PHRASE_RE)?.[0];
  if (!capitalized) return null;

  const commonQuestionPrefixes = /^(?:What Is|What Are|How Does|How Do|Where Is|Where Are|Tell Me)$/i;
  return commonQuestionPrefixes.test(capitalized) ? null : capitalized;
};

const extractQuestionSubject = (prompt: string): string | null => {
  const patterns = [
    /\bwhat\s+is\s+(.+?)\s+supposed\s+to\s+do(?:\?|$)/i,
    /\bdo\s+you\s+know\s+what\s+(.+?)\s+(?:does|do|is|are)\b/i,
    /\bwhat\s+is\s+(.+?)(?:\?|$)/i,
    /\bwhat\s+are\s+(.+?)(?:\?|$)/i,
    /\bwhat\s+does\s+(.+?)\s+mean(?:\?|$)/i,
    /\bhow\s+does\s+(.+?)\s+work(?:\?|$)/i,
    /\bwhere\s+is\s+(.+?)\s+(?:defined|implemented|wired|declared)(?:\?|$)/i,
    /\bwhy\s+did\s+(.+?)\s+answer\s+like\s+that(?:\?|$)/i,
    /\b(?:define|explain|describe|tell\s+me\s+about)\s+(.+?)(?:\?|$)/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern)?.[1]?.trim();
    if (match) {
      return normalizeTerm(match.replace(/\b(?:in\s+this\s+app|in\s+helix|in\s+the\s+repo|in\s+the\s+repository)\b/gi, ""));
    }
  }
  return null;
};

export function detectRepoConcept(promptText: string): RepoConceptDetection {
  const prompt = promptText.trim();
  const contextualSuppression = detectContextualToolAdmissionSuppression(prompt);
  if (!prompt) {
    return {
      applies: false,
      confidence: "low",
      concept: null,
      normalized_terms: [],
      reason: "empty_prompt",
      require_repo_evidence: false,
      allow_model_direct_answer: true,
    };
  }
  if (contextualSuppression) {
    return {
      applies: true,
      confidence: "high",
      concept: null,
      normalized_terms: [],
      reason: "contextual_tool_reference_suppressed",
      require_repo_evidence: false,
      allow_model_direct_answer: true,
    };
  }
  const modelOnlyConceptSourceSignal = detectModelOnlyConceptSourceSignal(prompt);
  if (modelOnlyConceptSourceSignal.should_prefer_model_only_concept) {
    return {
      applies: true,
      confidence: "high",
      concept: modelOnlyConceptSourceSignal.concept_terms[0] ?? null,
      normalized_terms: modelOnlyConceptSourceSignal.concept_terms,
      reason: "model_only_concept_source_guard",
      require_repo_evidence: false,
      allow_model_direct_answer: true,
    };
  }

  const isQuestionForm = PROJECT_ENTITY_DEFINITION_RE.test(prompt);
  const aliasMatch = findRepoConceptAliasMatch(prompt);
  const entity = findProjectEntity(prompt);
  const concept = aliasMatch?.entry.canonical_concept ?? entity?.canonical ?? extractProjectLikeConcept(prompt) ?? extractQuestionSubject(prompt);
  const normalizedTerms = termsForConcept(concept);

  if (WORKSTATION_ACTION_PROMPT_RE.test(prompt)) {
    return {
      applies: false,
      confidence: entity ? "high" : "medium",
      concept,
      normalized_terms: normalizedTerms,
      reason: "workstation_action_prompt",
      require_repo_evidence: false,
      allow_model_direct_answer: false,
    };
  }

  if (!isQuestionForm) {
    return {
      applies: false,
      confidence: entity ? "medium" : "low",
      concept,
      normalized_terms: normalizedTerms,
      reason: "not_a_concept_question",
      require_repo_evidence: false,
      allow_model_direct_answer: true,
    };
  }

  if (EXPLICIT_NON_REPO_GROUNDING_RE.test(prompt)) {
    return {
      applies: true,
      confidence: entity ? "high" : "low",
      concept,
      normalized_terms: normalizedTerms,
      reason: "user_requested_non_repo_grounding",
      require_repo_evidence: false,
      allow_model_direct_answer: true,
    };
  }

  const projectAnchorPrompt = prompt.replace(NEGATIVE_TOOL_CONSTRAINT_ANCHOR_RE, " ");
  const hasPositiveProjectAnchor = PROJECT_ANCHOR_RE.test(projectAnchorPrompt);
  if (entity && LEGAL_TERMINAL_AUTHORITY_RE.test(prompt) && !hasPositiveProjectAnchor) {
    return {
      applies: true,
      confidence: "low",
      concept: entity.canonical,
      normalized_terms: termsForConcept(entity.canonical),
      reason: "domain_context_not_project_repo",
      require_repo_evidence: false,
      allow_model_direct_answer: true,
    };
  }
  if (aliasMatch && (!aliasMatch.project_anchor_required || hasPositiveProjectAnchor)) {
    return {
      applies: true,
      confidence: "high",
      concept: aliasMatch.entry.canonical_concept,
      normalized_terms: repoConceptAliasTerms(aliasMatch.entry),
      reason: hasPositiveProjectAnchor
        ? "known_project_concept_alias_with_project_anchor"
        : "known_project_concept_alias_question",
      require_repo_evidence: true,
      allow_model_direct_answer: false,
    };
  }
  if (aliasMatch?.project_anchor_required && !hasPositiveProjectAnchor) {
    return {
      applies: true,
      confidence: "low",
      concept: aliasMatch.entry.canonical_concept,
      normalized_terms: repoConceptAliasTerms(aliasMatch.entry),
      reason: "generic_concept_without_project_anchor",
      require_repo_evidence: false,
      allow_model_direct_answer: true,
    };
  }
  if (entity) {
    return {
      applies: true,
      confidence: "high",
      concept: entity.canonical,
      normalized_terms: termsForConcept(entity.canonical),
      reason: "known_project_concept_question",
      require_repo_evidence: true,
      allow_model_direct_answer: false,
    };
  }

  if (hasPositiveProjectAnchor) {
    const projectLikeConcept = extractProjectLikeConcept(prompt) ?? extractQuestionSubject(prompt);
    return {
      applies: true,
      confidence: projectLikeConcept ? "medium" : "low",
      concept: projectLikeConcept,
      normalized_terms: termsForConcept(projectLikeConcept),
      reason: projectLikeConcept
        ? "project_anchor_project_like_concept"
        : "project_anchor_without_specific_concept",
      require_repo_evidence: Boolean(projectLikeConcept),
      allow_model_direct_answer: !projectLikeConcept,
    };
  }

  return {
    applies: true,
    confidence: "low",
    concept,
    normalized_terms: normalizedTerms,
    reason: "generic_concept_without_project_anchor",
    require_repo_evidence: false,
    allow_model_direct_answer: true,
  };
}

export function detectRepoConceptDefinition(promptText: string): HelixRepoConceptMatch | null {
  const detection = detectRepoConcept(promptText);
  if (!detection.applies || !detection.require_repo_evidence || !detection.concept) return null;
  return {
    canonical: detection.concept,
    reason: "project_local_entity_definition",
  };
}

export function resolveRepoConceptEntity(promptText: string): string | null {
  return findRepoConceptAliasMatch(promptText)?.entry.canonical_concept ?? findProjectEntity(promptText)?.canonical ?? null;
}
