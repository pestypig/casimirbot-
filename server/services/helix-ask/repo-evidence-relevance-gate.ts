import * as fs from "node:fs";
import * as path from "node:path";
import type { HelixRepoCodeEvidenceObservation } from "../../../shared/helix-repo-code-evidence-observation";
import {
  findRepoConceptAliasEntry,
  repoConceptAliasTerms,
  repoConceptPathMatchesHint,
  repoConceptPathMatchesPreferredPrefix,
  type RepoConceptEvidenceRole,
} from "./repo-concept-alias-registry";

export type RepoEvidenceRelevanceGate = {
  schema: "helix.repo_evidence_relevance_gate.v1";
  turn_id: string;
  concept: string;
  canonical_concept: string;
  normalized_aliases: string[];
  exact_match_files_found: boolean;
  exact_match_files_selected: boolean;
  selected_files_cover_concept: boolean;
  selected_evidence_roles: RepoConceptEvidenceRole[];
  missing_required_roles: RepoConceptEvidenceRole[];
  single_role_only: boolean;
  weak_fuzzy_only: boolean;
  alias_normalization_applied: boolean;
  expected_path_hints: string[];
  selected_paths: string[];
  missing_expected_path_hints: string[];
  prompt_facet: {
    schema: "helix.repo_evidence_prompt_facet.v1";
    applies: boolean;
    facet:
      | "final_answer_language_debug_contract"
      | "receipts_as_observations"
      | "terminal_authority_selects_answer"
      | null;
    required_terms: string[];
    preferred_paths: string[];
  };
  selected_prompt_facet_paths: string[];
  required_facets: string[];
  missing_facets: string[];
  blocking_reasons: string[];
  coverage: "strong" | "adequate" | "weak" | "none";
  violations: Array<
    | "exact_match_files_found_but_not_selected"
    | "exact_source_contract_failed"
    | "weak_fuzzy_only"
    | "alias_not_normalized"
    | "codebase_anchor_ignored"
    | "selected_evidence_missing_concept_terms"
    | "docs_only_for_codebase_question"
    | "prompt_facet_evidence_missing"
    | "single_role_only"
    | "missing_required_evidence_roles"
  >;
  repair_required: boolean;
  terminal_allowed: boolean;
  source_target_exact_contract?: {
    contract_id?: string;
    requested_source_kind?: string;
    requested_source_identity?: string;
    extraction_status?: string;
    evidence_refs?: unknown[];
    evidence_hash?: string;
    terminal_allowed?: boolean;
  };
  assistant_answer: false;
  raw_content_included: false;
};

const normalizePath = (value: string): string => value.replace(/\\/g, "/");

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const pathHintExists = (repoRoot: string, hint: string): boolean => {
  const normalized = normalizePath(hint).replace(/^\/+/, "");
  const resolved = path.resolve(repoRoot, normalized);
  const relative = path.relative(repoRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return false;
  if (fs.existsSync(resolved)) return true;
  const parent = path.dirname(resolved);
  const basename = path.basename(resolved).toLowerCase();
  try {
    return fs.readdirSync(parent).some((entry: string) => entry.toLowerCase().startsWith(basename));
  } catch {
    return false;
  }
};

const selectedPathContainsAlias = (selectedPath: string, aliases: string[]): boolean => {
  const normalizedPath = normalizePath(selectedPath).toLowerCase();
  return aliases.some((alias: string) => {
    const normalizedAlias = alias.toLowerCase();
    if (normalizedAlias.length < 3) return false;
    return (
      normalizedPath.includes(normalizedAlias.replace(/\s+/g, "-")) ||
      normalizedPath.includes(normalizedAlias.replace(/\s+/g, "_")) ||
      normalizedPath.includes(normalizedAlias.replace(/[\s_-]+/g, ""))
    );
  });
};

const evidenceRolesForPath = (selectedPath: string): RepoConceptEvidenceRole[] => {
  const normalized = normalizePath(selectedPath).toLowerCase();
  const roles: RepoConceptEvidenceRole[] = [];
  if (/(?:^|\/)__tests__\/|(?:\.test|\.spec)\.[tj]sx?$/.test(normalized)) roles.push("test_contract");
  if (/terminal|authority|terminal-answer-envelope|runtime-authority-contract|solver-controller|route-product-contract/.test(normalized)) {
    roles.push("terminal_authority");
  }
  if (/workstation-dynamic-tools|panelcapabilities|panelactionadapters|tool[_-]?registry|capabilit/.test(normalized)) {
    roles.push("capability_registry");
  }
  if (/client\/src\/store\/|use.*store\.ts$|store\.ts$/.test(normalized)) roles.push("state_model");
  if (/client\/src\/components\/|(?:panel|pill)\.tsx$/.test(normalized)) roles.push("ui_surface");
  if (/server\/(?:services|routes)\/|server\/modules\/|client\/src\/lib\/helix\/|shared\/(?:helix|situation|workstation|starsim)/.test(normalized)) {
    roles.push("runtime_contract");
  }
  if (/docs\/|readme|architecture|contract|manifest|preset/.test(normalized)) roles.push("definition");
  return unique(roles);
};

const rolesForSelectedPaths = (selectedPaths: string[]): RepoConceptEvidenceRole[] =>
  unique(selectedPaths.flatMap(evidenceRolesForPath));

const LANGUAGE_DEBUG_FACET_QUERY_RE =
  /\b(?:final answer(?:\s+language)?|response language|language contract|language[_ -]?detected|source[_ -]?language|code[_ -]?mixed|debug(?:\s+export|\s+payload)?|includeMultilangMetadata|terminal answer|synthesis)\b|(?:idioma\s+final|respuesta\s+final|contrato\s+de\s+idioma|lenguaje\s+de\s+respuesta|evidencia\s+del\s+c[o\u00f3]digo|archivos?\s+y\s+l[i\u00ed]neas?|depuraci[o\u00f3]n|exportaci[o\u00f3]n(?:\s+de\s+debug)?)|(?:\u6700\u7ec8\u56de\u7b54\u8bed\u8a00|\u6700\u7ec8\u56de\u7b54|\u56de\u7b54\u8bed\u8a00|\u8bed\u8a00\u9009\u62e9|\u8bed\u8a00\u5951\u7ea6|\u4ee3\u7801\u4ed3\u5e93|\u4ee3\u7801\u8bc1\u636e|\u5f15\u7528\u6587\u4ef6|\u884c\u53f7|\u8c03\u8bd5|\u5bfc\u51fa)/iu;

type RepoEvidenceFacetId =
  | "final_answer_language_debug_contract"
  | "receipts_as_observations"
  | "terminal_authority_selects_answer";

export const LANGUAGE_DEBUG_FACET_TERMS = [
  "response_language",
  "language_detected",
  "source_language",
  "code_mixed",
  "translated",
  "pivot_confidence",
  "languageContract",
  "language_contract",
  "includeMultilangMetadata",
  "applyHelixAskSuccessSurface",
  "repo_answer_text_quality_gate",
  "inferLanguageFromScript",
  "resolveHelixAskResponseLanguage",
  "debug_export",
  "debug export",
  "final answer",
  "terminal answer",
  "terminal-materializer",
  "model_synthesis_from_repo_evidence",
  "repo_docs_synthesis_packet",
  "synthesis",
  "ask-answer-surface",
  "ask-handler",
  "language-contract",
];

const LANGUAGE_DEBUG_CONCRETE_METADATA_TERMS = [
  "response_language",
  "language_detected",
  "source_language",
  "code_mixed",
  "translated",
  "pivot_confidence",
  "languageContract",
  "language_contract",
  "includeMultilangMetadata",
  "applyHelixAskSuccessSurface",
  "repo_answer_text_quality_gate",
  "inferLanguageFromScript",
  "resolveHelixAskResponseLanguage",
  "debug_export",
  "debug export",
  "ask-answer-surface",
  "ask-handler",
  "language-contract",
];

const LANGUAGE_DEBUG_OFF_FACET_PATH_RE =
  /(?:civilization|fruition|theory-ideology-bridge)/i;

export const LANGUAGE_DEBUG_FACET_PATHS = [
  "server/services/helix-ask/runtime/ask-handler.ts",
  "server/services/helix-ask/surface/ask-answer-surface.ts",
  "server/services/helix-ask/runtime/",
  "server/services/helix-ask/surface/",
  "server/services/helix-ask/final-answer-draft-terminal-materializer.ts",
  "server/services/helix-ask/repo-answer-text-quality-gate.ts",
  "server/services/helix-ask/repo-docs-synthesis-packet.ts",
  "server/services/helix-ask/evidence-reentry-gate.ts",
  "server/services/helix-ask/evidence-selection-policy.ts",
  "server/services/helix-ask/language-contract.ts",
  "server/routes/agi.plan.ts",
  "server/routes/voice.ts",
  "docs/architecture/voice-service-contract.md",
];

const RECEIPTS_AS_OBSERVATIONS_QUERY_RE =
  /\b(?:receipts?\s+(?:are|as|become|remain)\s+observations?|observations?\s+re[-\s]?enter\s+reasoning|tools?\s+produce\s+observations?|receipts?\s+are\s+not\s+answers?)\b/i;

const TERMINAL_AUTHORITY_QUERY_RE =
  /\b(?:terminal\s+authority|authority\s+(?:selects|chooses|writes)\s+(?:the\s+)?answer|completed\s+solver\s+path\s+(?:may|can)\s+answer|visible\s+answer\s+must\s+project|terminal\s+single[-\s]?writer)\b/i;

export const RECEIPTS_AS_OBSERVATIONS_FACET_TERMS = [
  "Routes choose procedures",
  "Tools produce observations",
  "Observations re-enter reasoning",
  "Receipts are observations",
  "receipt",
  "observation",
  "tool-lifecycle-trace",
  "FunctionCallOutput",
];

export const RECEIPTS_AS_OBSERVATIONS_FACET_PATHS = [
  "docs/helix-ask-codex-loop-discipline.md",
  "docs/helix-ask-turn-solver-spine.md",
  "server/services/helix-ask/tool-lifecycle-trace.ts",
  "server/services/helix-ask/tool-family-contract.ts",
  "server/services/helix-ask/evidence-reentry-gate.ts",
  "server/routes/agi.plan.ts",
];

export const TERMINAL_AUTHORITY_FACET_TERMS = [
  "terminal_authority",
  "terminal authority",
  "terminal_answer_authority",
  "terminal_authority_single_writer",
  "completed solver path",
  "visible answer",
  "route-product-contract",
  "runtime-authority-contract",
];

export const TERMINAL_AUTHORITY_FACET_PATHS = [
  "server/services/helix-ask/runtime-authority-contract.ts",
  "server/services/helix-ask/terminal-authority-single-writer.ts",
  "server/services/helix-ask/terminal-answer-envelope.ts",
  "server/services/helix-ask/route-product-contract.ts",
  "server/services/helix-ask/solver-controller-decision.ts",
  "server/__tests__/helix.ask.final-answer-draft-selection.test.ts",
  "docs/helix-ask-codex-loop-discipline.md",
  "docs/helix-ask-turn-solver-spine.md",
];

export const detectRepoEvidencePromptFacet = (query: string) => {
  const applies = LANGUAGE_DEBUG_FACET_QUERY_RE.test(query);
  return {
    schema: "helix.repo_evidence_prompt_facet.v1" as const,
    applies,
    facet: applies ? "final_answer_language_debug_contract" as const : null,
    required_terms: applies ? LANGUAGE_DEBUG_FACET_TERMS : [],
    preferred_paths: applies ? LANGUAGE_DEBUG_FACET_PATHS : [],
  };
};

const detectRepoEvidencePromptFacets = (query: string): RepoEvidenceFacetId[] =>
  unique([
    ...(LANGUAGE_DEBUG_FACET_QUERY_RE.test(query) ? ["final_answer_language_debug_contract" as const] : []),
    ...(RECEIPTS_AS_OBSERVATIONS_QUERY_RE.test(query) ? ["receipts_as_observations" as const] : []),
    ...(TERMINAL_AUTHORITY_QUERY_RE.test(query) ? ["terminal_authority_selects_answer" as const] : []),
  ]);

const facetTerms = (facet: RepoEvidenceFacetId): string[] => {
  if (facet === "final_answer_language_debug_contract") return LANGUAGE_DEBUG_FACET_TERMS;
  if (facet === "receipts_as_observations") return RECEIPTS_AS_OBSERVATIONS_FACET_TERMS;
  return TERMINAL_AUTHORITY_FACET_TERMS;
};

const facetPreferredPaths = (facet: RepoEvidenceFacetId): string[] => {
  if (facet === "final_answer_language_debug_contract") return LANGUAGE_DEBUG_FACET_PATHS;
  if (facet === "receipts_as_observations") return RECEIPTS_AS_OBSERVATIONS_FACET_PATHS;
  return TERMINAL_AUTHORITY_FACET_PATHS;
};

const facetMissingCode = (facet: RepoEvidenceFacetId): string => {
  if (facet === "final_answer_language_debug_contract") return "language_debug_evidence";
  if (facet === "receipts_as_observations") return "receipts_as_observations_evidence";
  return "terminal_authority_evidence";
};

export const repoEvidencePathOrTextMatchesPromptFacet = (
  input: { path?: unknown; excerpt?: unknown; raw_excerpt?: unknown; sanitized_excerpt?: unknown; reason?: unknown },
  promptFacet: ReturnType<typeof detectRepoEvidencePromptFacet>,
): boolean => {
  if (!promptFacet.applies) return true;
  const normalizedPath = normalizePath(typeof input.path === "string" ? input.path : "");
  if (promptFacet.preferred_paths.some((pathHint: string) => {
    const normalizedHint = normalizePath(pathHint);
    return normalizedPath.endsWith(normalizedHint) || normalizedPath.startsWith(normalizedHint);
  })) {
    return true;
  }
  const haystack = [
    normalizedPath,
    input.excerpt,
    input.raw_excerpt,
    input.sanitized_excerpt,
  ].filter(Boolean).join("\n").toLowerCase();
  if (
    LANGUAGE_DEBUG_OFF_FACET_PATH_RE.test(normalizedPath) &&
    !LANGUAGE_DEBUG_CONCRETE_METADATA_TERMS.some((term: string) => haystack.includes(term.toLowerCase()))
  ) {
    return false;
  }
  return promptFacet.required_terms.some((term: string) => haystack.includes(term.toLowerCase()));
};

const selectedSpanMatchesPromptFacet = (
  span: HelixRepoCodeEvidenceObservation["spans"][number],
  promptFacet: ReturnType<typeof detectRepoEvidencePromptFacet>,
): boolean => {
  return repoEvidencePathOrTextMatchesPromptFacet(span, promptFacet);
};

const repoEvidencePathOrTextMatchesFacet = (
  input: { path?: unknown; excerpt?: unknown; raw_excerpt?: unknown; sanitized_excerpt?: unknown; reason?: unknown },
  facet: RepoEvidenceFacetId,
): boolean => {
  const normalizedPath = normalizePath(typeof input.path === "string" ? input.path : "");
  if (facetPreferredPaths(facet).some((pathHint: string) => {
    const normalizedHint = normalizePath(pathHint);
    return normalizedPath.endsWith(normalizedHint) || normalizedPath.startsWith(normalizedHint);
  })) {
    return true;
  }
  const haystack = [
    normalizedPath,
    input.excerpt,
    input.raw_excerpt,
    input.sanitized_excerpt,
    input.reason,
  ].filter(Boolean).join("\n").toLowerCase();
  return facetTerms(facet).some((term: string) => haystack.includes(term.toLowerCase()));
};

export function evaluateRepoEvidenceRelevanceGate(input: {
  turnId: string;
  concept: string;
  query: string;
  observation: HelixRepoCodeEvidenceObservation;
  sourceTargetExactContract?: Record<string, unknown> | null;
  repoRoot?: string;
}): RepoEvidenceRelevanceGate {
  const repoRoot = input.repoRoot ?? process.cwd();
  const aliasEntry = findRepoConceptAliasEntry([input.concept, input.query].join(" "));
  const normalizedAliases = repoConceptAliasTerms(aliasEntry);
  const selectedPaths = unique(input.observation.spans.map((span: HelixRepoCodeEvidenceObservation["spans"][number]) =>
    normalizePath(span.path)
  ).filter(Boolean));
  const promptFacet = detectRepoEvidencePromptFacet(input.query);
  const requiredFacetIds = detectRepoEvidencePromptFacets(input.query);
  const selectedPromptFacetPaths = unique(
    input.observation.spans
      .filter((span: HelixRepoCodeEvidenceObservation["spans"][number]) =>
        selectedSpanMatchesPromptFacet(span, promptFacet) ||
        requiredFacetIds.some((facet: RepoEvidenceFacetId) => repoEvidencePathOrTextMatchesFacet(span, facet))
      )
      .map((span: HelixRepoCodeEvidenceObservation["spans"][number]) => normalizePath(span.path))
      .filter(Boolean),
  );
  const missingFacets = requiredFacetIds
    .filter((facet: RepoEvidenceFacetId) =>
      !input.observation.spans.some((span: HelixRepoCodeEvidenceObservation["spans"][number]) =>
        repoEvidencePathOrTextMatchesFacet(span, facet)
      )
    )
    .map(facetMissingCode);
  const expectedPathHints = aliasEntry?.exact_path_hints ?? [];
  const existingHints = expectedPathHints.filter((hint: string) => pathHintExists(repoRoot, hint));
  const exactMatchFilesFound = existingHints.length > 0;
  const exactMatchFilesSelected = aliasEntry
    ? selectedPaths.some((selectedPath: string) => repoConceptPathMatchesHint(selectedPath, aliasEntry))
    : false;
  const preferredSelected = aliasEntry
    ? selectedPaths.some((selectedPath: string) => repoConceptPathMatchesPreferredPrefix(selectedPath, aliasEntry))
    : false;
  const selectedFilesCoverConcept = aliasEntry
    ? selectedPaths.some((selectedPath: string) => selectedPathContainsAlias(selectedPath, normalizedAliases)) ||
      exactMatchFilesSelected ||
      preferredSelected
    : selectedPaths.length > 0;
  const selectedEvidenceRoles = rolesForSelectedPaths(selectedPaths);
  const requiredRoles = aliasEntry?.broad_concept ? aliasEntry.required_evidence_roles ?? [] : [];
  const missingRequiredRoles = requiredRoles.filter((role: RepoConceptEvidenceRole) => !selectedEvidenceRoles.includes(role));
  const singleRoleOnly = Boolean(aliasEntry?.broad_concept && selectedPaths.length > 1 && selectedEvidenceRoles.length <= 1);
  const selectedDocsOnly = selectedPaths.length > 0 && selectedPaths.every((entry: string) => entry.startsWith("docs/"));
  const weakFuzzyOnly = Boolean(aliasEntry && exactMatchFilesFound && !exactMatchFilesSelected && !preferredSelected);
  const missingExpectedPathHints = existingHints.filter((hint: string) =>
    !selectedPaths.some((selectedPath: string) => repoConceptPathMatchesHint(selectedPath, {
      ...aliasEntry!,
      exact_path_hints: [hint],
    })),
  );
  const violations: RepoEvidenceRelevanceGate["violations"] = [];
  if (exactMatchFilesFound && !exactMatchFilesSelected && !preferredSelected) {
    violations.push("exact_match_files_found_but_not_selected");
  }
  if (weakFuzzyOnly) violations.push("weak_fuzzy_only");
  if (
    aliasEntry &&
    input.observation.concept.trim().toLowerCase() !== aliasEntry.canonical_concept.trim().toLowerCase()
  ) {
    violations.push("alias_not_normalized");
  }
  if (aliasEntry && !selectedFilesCoverConcept) violations.push("selected_evidence_missing_concept_terms");
  if (singleRoleOnly) violations.push("single_role_only");
  if (missingRequiredRoles.length > 0 && selectedPaths.length > 0) violations.push("missing_required_evidence_roles");
  if (selectedDocsOnly && /\b(?:codebase|repo|repository|source|implementation|helix ask|this app)\b/i.test(input.query)) {
    violations.push("docs_only_for_codebase_question");
  }
  if (requiredFacetIds.length > 0 && selectedPaths.length > 0 && missingFacets.length > 0) {
    violations.push("prompt_facet_evidence_missing");
  }
  const sourceTargetExactContract =
    input.sourceTargetExactContract ??
    (input.observation.source_target_exact_contract as Record<string, unknown> | undefined) ??
    null;
  if (sourceTargetExactContract && sourceTargetExactContract.terminal_allowed !== true) {
    violations.push("exact_source_contract_failed");
  }
  const blockingReasons = unique([
    ...(missingFacets.length > 0 ? ["prompt_facet_evidence_missing"] : []),
    ...(sourceTargetExactContract && sourceTargetExactContract.terminal_allowed !== true
      ? ["exact_source_contract_failed"]
      : []),
    ...(weakFuzzyOnly ? ["weak_fuzzy_only"] : []),
    ...(missingRequiredRoles.length > 0 ? ["missing_required_evidence_roles"] : []),
  ]);
  const coverage: RepoEvidenceRelevanceGate["coverage"] =
    selectedPaths.length === 0
      ? "none"
      : violations.length > 0
        ? "weak"
        : exactMatchFilesSelected
          ? "strong"
          : "adequate";
  const terminalAllowed = coverage === "strong" || coverage === "adequate";
  return {
    schema: "helix.repo_evidence_relevance_gate.v1",
    turn_id: input.turnId,
    concept: input.concept,
    canonical_concept: aliasEntry?.canonical_concept ?? input.concept,
    normalized_aliases: normalizedAliases,
    exact_match_files_found: exactMatchFilesFound,
    exact_match_files_selected: exactMatchFilesSelected,
    selected_files_cover_concept: selectedFilesCoverConcept,
    selected_evidence_roles: selectedEvidenceRoles,
    missing_required_roles: missingRequiredRoles,
    single_role_only: singleRoleOnly,
    weak_fuzzy_only: weakFuzzyOnly,
    alias_normalization_applied: Boolean(
      aliasEntry &&
      input.concept.trim().toLowerCase() === aliasEntry.canonical_concept.trim().toLowerCase(),
    ),
    expected_path_hints: expectedPathHints,
    selected_paths: selectedPaths,
    missing_expected_path_hints: missingExpectedPathHints,
    prompt_facet: promptFacet,
    selected_prompt_facet_paths: selectedPromptFacetPaths,
    required_facets: requiredFacetIds,
    missing_facets: missingFacets,
    blocking_reasons: blockingReasons,
    coverage,
    violations: unique(violations),
    repair_required: !terminalAllowed,
    terminal_allowed: terminalAllowed,
    ...(sourceTargetExactContract
      ? {
          source_target_exact_contract: {
            contract_id: typeof sourceTargetExactContract.contract_id === "string" ? sourceTargetExactContract.contract_id : undefined,
            requested_source_kind:
              typeof sourceTargetExactContract.requested_source_kind === "string" ? sourceTargetExactContract.requested_source_kind : undefined,
            requested_source_identity:
              typeof sourceTargetExactContract.requested_source_identity === "string" ? sourceTargetExactContract.requested_source_identity : undefined,
            extraction_status:
              typeof sourceTargetExactContract.extraction_status === "string" ? sourceTargetExactContract.extraction_status : undefined,
            evidence_refs: Array.isArray(sourceTargetExactContract.evidence_refs) ? sourceTargetExactContract.evidence_refs : undefined,
            evidence_hash:
              typeof sourceTargetExactContract.evidence_hash === "string" ? sourceTargetExactContract.evidence_hash : undefined,
            terminal_allowed: sourceTargetExactContract.terminal_allowed === true,
          },
        }
      : {}),
    assistant_answer: false,
    raw_content_included: false,
  };
}
