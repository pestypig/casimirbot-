export type HelixRepoCodeEvidenceIntent = {
  repoEvidenceRequested: boolean;
  strength: "none" | "soft" | "hard";
  reasons: string[];
  requestedOutputs: Array<
    | "repo_code"
    | "file_path"
    | "line_backed_source"
    | "implementation_location"
    | "symbol_contract"
    | "module_mapping"
  >;
  projectEntity?: string | null;
};

type RepoCodeIntentSpec = {
  reason: string;
  pattern: RegExp;
  outputs: HelixRepoCodeEvidenceIntent["requestedOutputs"];
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const NEGATIVE_MODEL_ONLY_RE =
  /\b(?:background\s+only|background\s+mode|concept\s+background\s+only|concept\s+check\s+only|general\s+concept\s+only|general\s+reasoning|general\s+explanation\s+only|just\s+answer\s+from\s+general\s+reasoning|no\s+workspace\s+lookup|do\s+not\s+use\s+(?:the\s+)?(?:repo|repository|code|source|workspace))\b/i;

const HARD_REPO_CODE_SPECS: RepoCodeIntentSpec[] = [
  {
    reason: "repo_code_evidence_only",
    pattern: /\b(?:repo\s*\/\s*code|repository\s*\/\s*code|repo(?:sitory)?\s+code|code)\s+evidence\s+only\b/i,
    outputs: ["repo_code"],
  },
  {
    reason: "repository_evidence",
    pattern: /\b(?:repository|repo)\s+evidence\b/i,
    outputs: ["repo_code"],
  },
  {
    reason: "code_evidence",
    pattern: /\bcode\s+evidence\b/i,
    outputs: ["repo_code"],
  },
  {
    reason: "implementation_enforcement_location",
    pattern: /\bwhere\s+is\s+(?:that\s+)?(?:enforced|defined|declared|implemented|wired)\s+(?:in|by)\s+(?:the\s+)?(?:code|repo|repository|source)\b/i,
    outputs: ["repo_code", "implementation_location"],
  },
  {
    reason: "exact_file_paths",
    pattern: /\bcite\s+(?:the\s+)?(?:exact\s+)?file\s+paths?\b/i,
    outputs: ["file_path"],
  },
  {
    reason: "line_backed_sources",
    pattern: /\b(?:line-backed|line\s+backed|file\s+paths?\s+and\s+lines?|paths?\s+and\s+line(?:s| numbers)?|line\s+(?:backed\s+)?sources?)\b/i,
    outputs: ["file_path", "line_backed_source"],
  },
  {
    reason: "repo_location_phrase",
    pattern: /\b(?:where\s+in\s+the\s+(?:repo|repository|codebase)|implementation\s+path|source\s+path|repo\s+path|repository\s+path)\b/i,
    outputs: ["repo_code", "file_path", "implementation_location"],
  },
  {
    reason: "module_contract_route_question",
    pattern: /\bwhich\s+(?:module|contract|schema|route|endpoint|symbol)\b/i,
    outputs: ["repo_code", "symbol_contract", "module_mapping"],
  },
  {
    reason: "source_file_reference",
    pattern: /\b(?:server|client|shared|docs|scripts|tools)\/[A-Za-z0-9_./-]+|\b[A-Za-z0-9_-]+\.(?:ts|tsx|js|jsx|md|json|py)\b/i,
    outputs: ["repo_code", "file_path"],
  },
];

const PROJECT_LOCAL_ENTITIES: Array<{ canonical: string; pattern: RegExp }> = [
  { canonical: "StarSim", pattern: /\bstar\s*sim\b|\bstarsim\b/i },
  { canonical: "NHM2", pattern: /\bnhm2\b/i },
  { canonical: "Needle Hull", pattern: /\bneedle\s+hull\b/i },
  { canonical: "deep mixing", pattern: /\bdeep\s+mixing\b/i },
  { canonical: "Helix Ask", pattern: /\bhelix\s+ask\b/i },
  { canonical: "Stage0", pattern: /\bstage\s*0\b|\bstage0\b/i },
  { canonical: "code lattice", pattern: /\bcode\s+lattice\b/i },
];

const PROJECT_ENTITY_DEFINITION_RE =
  /\b(?:what\s+is|what\s+are|define|explain|describe|tell\s+me\s+about)\b/i;

export function detectRepoCodeEvidenceIntent(promptText: string): HelixRepoCodeEvidenceIntent {
  const prompt = promptText.trim();
  if (!prompt || NEGATIVE_MODEL_ONLY_RE.test(prompt)) {
    return {
      repoEvidenceRequested: false,
      strength: "none",
      reasons: NEGATIVE_MODEL_ONLY_RE.test(prompt) ? ["negative_scope:model_only"] : [],
      requestedOutputs: [],
      projectEntity: null,
    };
  }

  const hardMatches = HARD_REPO_CODE_SPECS.filter((spec) => spec.pattern.test(prompt));
  if (hardMatches.length > 0) {
    return {
      repoEvidenceRequested: true,
      strength: "hard",
      reasons: unique(hardMatches.map((spec) => spec.reason)),
      requestedOutputs: unique(hardMatches.flatMap((spec) => spec.outputs)),
      projectEntity: PROJECT_LOCAL_ENTITIES.find((entry) => entry.pattern.test(prompt))?.canonical ?? null,
    };
  }

  const projectEntity = PROJECT_LOCAL_ENTITIES.find((entry) => entry.pattern.test(prompt)) ?? null;
  if (projectEntity && PROJECT_ENTITY_DEFINITION_RE.test(prompt)) {
    return {
      repoEvidenceRequested: true,
      strength: "soft",
      reasons: ["project_local_entity_definition"],
      requestedOutputs: ["repo_code", "file_path"],
      projectEntity: projectEntity.canonical,
    };
  }

  return {
    repoEvidenceRequested: false,
    strength: "none",
    reasons: [],
    requestedOutputs: [],
    projectEntity: null,
  };
}
