import {
  detectRepoConceptDefinition,
  resolveRepoConceptEntity,
} from "./repo-concept-detector";
import {
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
} from "./contextual-tool-admission";
import {
  detectModelOnlyConceptSourceSignal,
  hasExplicitModelOnlyConceptScope,
} from "./model-only-concept-source-guard";
import { isExplicitDocsPathDocumentOperation } from "./docs-viewer-intent";

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
    | "route_trace"
    | "tool_call_eligibility"
    | "terminal_contract"
    | "codex_comparison"
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
  /\b(?:background\s+only|background\s+mode|concept\s+background\s+only|concept\s+check\s+only|general\s+concept\s+only|general\s+reasoning|general\s+explanation\s+only|just\s+answer\s+from\s+general\s+reasoning|no\s+workspace\s+lookup|do\s+not\s+use\s+(?:the\s+)?(?:repo|repository|code|source|workspace)|not\s+(?:code|repo|repository|source|implementation)[-\s]?(?:specific|based|grounded|level)?)\b/i;

const EXPLICIT_REPO_EVIDENCE_REQUEST_RE =
  /\b(?:repo-code\.search_concept|repo\s*\/\s*code|repo(?:sitory)?|codebase|source\s+code|source\s+files?|code\s+evidence|file\s+paths?|paths?\s+and\s+line(?:s| numbers)?|line[-\s]?backed|where\s+in\s+(?:the\s+)?(?:code|repo|repository|codebase)|implementation\s+(?:path|file|location|evidence)|implemented\s+(?:in|by)|grep|repo\s+grep|rg\s+search|server\/|client\/|shared\/|\.tsx?\b|\.jsx?\b|\.md\b)\b/i;

export function hasExplicitRepoEvidenceRequest(promptText: string): boolean {
  return EXPLICIT_REPO_EVIDENCE_REQUEST_RE.test(promptText.trim());
}

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
  {
    reason: "project_local_agent_loop",
    pattern: /\b(?:helix\s+ask\s+backend|agentic\s+turn(?:-|\s+)based\s+system|top\s+of\s+the\s+agentic\s+(?:loop|turn|system)|codex\s+(?:discipline|clone|agent|loop)|tool\s+calls?|repo\s+grep|route\s+planner|source_target_intent|source[-_\s]?target\s+intent|terminal\s+authority|situation\s*run|field\s+workers?|interpretation\s+workers?|process\s+graph\s+shortcut|procedure\s+epoch\s+replay|live\s+answer\s+environment)\b/i,
    outputs: ["repo_code", "implementation_location", "route_trace", "tool_call_eligibility", "terminal_contract", "codex_comparison", "line_backed_source"],
  },
  {
    reason: "project_local_tool_eligibility_question",
    pattern: /\b(?:why\s+did(?:n'?t| not)\s+(?:it|the\s+agent|helix)\s+(?:make|run|call|use)|can\s+(?:it|the\s+agent|helix)\s+make|able\s+to\s+make)\b[\s\S]{0,120}\b(?:tool\s+calls?|repo\s+grep|grep|right\s+calls?)\b/i,
    outputs: ["repo_code", "implementation_location", "route_trace", "tool_call_eligibility", "terminal_contract", "line_backed_source"],
  },
  {
    reason: "spanish_repo_code_evidence_intent",
    pattern: /\b(?:busca|buscar|usa|usar|cita|citar|explica|d[oó]nde|encontrar|revisa)\b[\s\S]{0,180}\b(?:repo|repositorio|c[oó]digo|archivos?|rutas?|fuentes?|implementaci[oó]n|s[ií]mbolos?|m[oó]dulos?|contrato|l[ií]neas?)\b|\b(?:repo|repositorio|c[oó]digo|archivos?|rutas?|fuentes?|implementaci[oó]n|s[ií]mbolos?|m[oó]dulos?|contrato|l[ií]neas?)\b[\s\S]{0,180}\b(?:evidencia|cita|citar|fuentes?|l[ií]neas?|rutas?|archivos?|implementaci[oó]n)\b/i,
    outputs: ["repo_code", "file_path", "line_backed_source", "implementation_location", "symbol_contract"],
  },
  {
    reason: "chinese_repo_code_evidence_intent",
    pattern: /(?:仓库|代码库|源码|代码|实现|模块|契约)[\s\S]{0,80}(?:证据|引用|文件|路径|行号|查找|搜索|列出|总结)|(?:证据|引用|文件|路径|行号|查找|搜索|列出|总结)[\s\S]{0,80}(?:仓库|代码库|源码|代码|实现|模块|契约)/u,
    outputs: ["repo_code", "file_path", "line_backed_source", "implementation_location", "symbol_contract"],
  },
  {
    reason: "mixed_language_repo_code_evidence_intent",
    pattern: /\b(?:repo|code|source|implementation|file\s+paths?|evidence|cite)\b[\s\S]{0,160}(?:c[oó]digo|repositorio|archivos?|rutas?|fuentes?|evidencia|仓库|代码|源码|文件|路径|证据|引用|行号)|(?:c[oó]digo|repositorio|archivos?|rutas?|fuentes?|evidencia|仓库|代码|源码|文件|路径|证据|引用|行号)[\s\S]{0,160}\b(?:repo|code|source|implementation|file\s+paths?|evidence|cite)\b/iu,
    outputs: ["repo_code", "file_path", "line_backed_source", "implementation_location"],
  },
];

export function detectRepoCodeEvidenceIntent(promptText: string): HelixRepoCodeEvidenceIntent {
  const prompt = promptText.trim();
  const contextualSuppression = detectContextualToolAdmissionSuppression(prompt);
  const explicitRepoEvidenceRequest = hasExplicitRepoEvidenceRequest(prompt);
  if (contextualSuppression && !explicitRepoEvidenceRequest) {
    return {
      repoEvidenceRequested: false,
      strength: "none",
      reasons: ["contextual_tool_reference_suppressed_incidental_repo_evidence"],
      requestedOutputs: [],
      projectEntity: null,
    };
  }
  if (contextualToolSuppressionBlocksFamily(contextualSuppression, "repo_code")) {
    return {
      repoEvidenceRequested: false,
      strength: "none",
      reasons: ["contextual_tool_reference_suppressed"],
      requestedOutputs: [],
      projectEntity: null,
    };
  }
  const explicitModelOnlyScope = hasExplicitModelOnlyConceptScope(prompt);
  if (!prompt || NEGATIVE_MODEL_ONLY_RE.test(prompt) || explicitModelOnlyScope) {
    return {
      repoEvidenceRequested: false,
      strength: "none",
      reasons: explicitModelOnlyScope
        ? ["explicit_model_only_concept_scope"]
        : NEGATIVE_MODEL_ONLY_RE.test(prompt)
          ? ["negative_scope:model_only"]
          : [],
      requestedOutputs: [],
      projectEntity: null,
    };
  }
  const modelOnlyConceptSourceSignal = detectModelOnlyConceptSourceSignal(prompt);
  if (modelOnlyConceptSourceSignal.should_prefer_model_only_concept) {
    return {
      repoEvidenceRequested: false,
      strength: "none",
      reasons: ["model_only_concept_source_guard"],
      requestedOutputs: [],
      projectEntity: null,
    };
  }
  if (isExplicitDocsPathDocumentOperation(prompt)) {
    return {
      repoEvidenceRequested: false,
      strength: "none",
      reasons: ["docs_viewer_exact_doc_path_request_not_repo_code"],
      requestedOutputs: [],
      projectEntity: null,
    };
  }
  const looksLikeActiveDocsViewerLocationRequest =
    /\b(?:current|active|this|that|the)\s+(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(prompt) &&
    /\b(?:find|locate|where|location|locations|line-backed|line\s+backed|lines?|section|sections|discuss(?:es|ed|ing)?|mention(?:s|ed|ing)?)\b/i.test(prompt) &&
    !/\b(?:repo|repository|codebase|source\s+code|implementation|where\s+in\s+(?:the\s+)?code|file\s+paths?\s+and\s+lines?)\b/i.test(prompt);
  if (looksLikeActiveDocsViewerLocationRequest) {
    return {
      repoEvidenceRequested: false,
      strength: "none",
      reasons: ["active_docs_viewer_location_request_not_repo_code"],
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
      projectEntity: resolveRepoConceptEntity(prompt),
    };
  }

  const projectEntity = detectRepoConceptDefinition(prompt);
  if (projectEntity) {
    return {
      repoEvidenceRequested: true,
      strength: "soft",
      reasons: [projectEntity.reason],
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
