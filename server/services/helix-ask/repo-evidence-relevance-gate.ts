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
    facet: "final_answer_language_debug_contract" | null;
    required_terms: string[];
    preferred_paths: string[];
  };
  selected_prompt_facet_paths: string[];
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
    return fs.readdirSync(parent).some((entry) => entry.toLowerCase().startsWith(basename));
  } catch {
    return false;
  }
};

const selectedPathContainsAlias = (selectedPath: string, aliases: string[]): boolean => {
  const normalizedPath = normalizePath(selectedPath).toLowerCase();
  return aliases.some((alias) => {
    const normalizedAlias = alias.toLowerCase();
    if (normalizedAlias.length < 3) return false;
    return (
      normalizedPath.includes(normalizedAlias.replace(/\s+/g, "-")) ||
      normalizedPath.includes(normalizedAlias.replace(/\s+/g, "_")) ||
      normalizedPath.includes(normalizedAlias.replace(/[\s_-]+/g, ""))
    );
  });
};

const evidenceRoleForPath = (selectedPath: string): RepoConceptEvidenceRole | null => {
  const normalized = normalizePath(selectedPath).toLowerCase();
  if (/(?:^|\/)__tests__\/|(?:\.test|\.spec)\.[tj]sx?$/.test(normalized)) return "test_contract";
  if (/terminal|authority|terminal-answer-envelope|runtime-authority-contract|solver-controller|route-product-contract/.test(normalized)) {
    return "terminal_authority";
  }
  if (/workstation-dynamic-tools|panelcapabilities|panelactionadapters|tool[_-]?registry|capabilit/.test(normalized)) {
    return "capability_registry";
  }
  if (/client\/src\/store\/|use.*store\.ts$|store\.ts$/.test(normalized)) return "state_model";
  if (/client\/src\/components\/|(?:panel|pill)\.tsx$/.test(normalized)) return "ui_surface";
  if (/server\/(?:services|routes)\/|server\/modules\/|client\/src\/lib\/helix\/|shared\/(?:helix|situation|workstation|starsim)/.test(normalized)) {
    return "runtime_contract";
  }
  if (/docs\/|readme|architecture|contract|manifest|preset/.test(normalized)) return "definition";
  return null;
};

const rolesForSelectedPaths = (selectedPaths: string[]): RepoConceptEvidenceRole[] =>
  unique(selectedPaths.map(evidenceRoleForPath).filter((entry): entry is RepoConceptEvidenceRole => Boolean(entry)));

const LANGUAGE_DEBUG_FACET_QUERY_RE =
  /\b(?:final answer language|response language|language contract|language_detected|source_language|code_mixed|debug export|debug payload|includeMultilangMetadata)\b|(?:idioma final|contrato de idioma|lenguaje de respuesta|depuraci[o\u00f3]n|exportaci[o\u00f3]n)|(?:\u6700\u7ec8\u56de\u7b54\u8bed\u8a00|\u56de\u7b54\u8bed\u8a00|\u8bed\u8a00\u9009\u62e9|\u8bed\u8a00\u5951\u7ea6|\u8c03\u8bd5|\u5bfc\u51fa)/iu;

const LANGUAGE_DEBUG_FACET_TERMS = [
  "response_language",
  "language_detected",
  "source_language",
  "code_mixed",
  "translated",
  "languageContract",
  "language_contract",
  "includeMultilangMetadata",
  "applyHelixAskSuccessSurface",
  "inferLanguageFromScript",
  "resolveHelixAskResponseLanguage",
  "debug export",
  "final answer",
  "ask-answer-surface",
  "ask-handler",
  "language-contract",
];

const LANGUAGE_DEBUG_FACET_PATHS = [
  "server/services/helix-ask/runtime/ask-handler.ts",
  "server/services/helix-ask/surface/ask-answer-surface.ts",
  "server/services/helix-ask/language-contract.ts",
  "server/routes/agi.plan.ts",
  "server/routes/voice.ts",
  "docs/architecture/voice-service-contract.md",
];

const detectPromptFacet = (query: string) => {
  const applies = LANGUAGE_DEBUG_FACET_QUERY_RE.test(query);
  return {
    schema: "helix.repo_evidence_prompt_facet.v1" as const,
    applies,
    facet: applies ? "final_answer_language_debug_contract" as const : null,
    required_terms: applies ? LANGUAGE_DEBUG_FACET_TERMS : [],
    preferred_paths: applies ? LANGUAGE_DEBUG_FACET_PATHS : [],
  };
};

const selectedSpanMatchesPromptFacet = (
  span: HelixRepoCodeEvidenceObservation["spans"][number],
  promptFacet: ReturnType<typeof detectPromptFacet>,
): boolean => {
  if (!promptFacet.applies) return true;
  const normalizedPath = normalizePath(span.path);
  if (promptFacet.preferred_paths.some((pathHint) => normalizedPath.endsWith(normalizePath(pathHint)))) {
    return true;
  }
  const haystack = [
    normalizedPath,
    span.excerpt,
    span.raw_excerpt,
    span.sanitized_excerpt,
    span.reason,
  ].filter(Boolean).join("\n").toLowerCase();
  return promptFacet.required_terms.some((term) => haystack.includes(term.toLowerCase()));
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
  const selectedPaths = unique(input.observation.spans.map((span) => normalizePath(span.path)).filter(Boolean));
  const promptFacet = detectPromptFacet(input.query);
  const selectedPromptFacetPaths = unique(
    input.observation.spans
      .filter((span) => selectedSpanMatchesPromptFacet(span, promptFacet))
      .map((span) => normalizePath(span.path))
      .filter(Boolean),
  );
  const expectedPathHints = aliasEntry?.exact_path_hints ?? [];
  const existingHints = expectedPathHints.filter((hint) => pathHintExists(repoRoot, hint));
  const exactMatchFilesFound = existingHints.length > 0;
  const exactMatchFilesSelected = aliasEntry
    ? selectedPaths.some((selectedPath) => repoConceptPathMatchesHint(selectedPath, aliasEntry))
    : false;
  const preferredSelected = aliasEntry
    ? selectedPaths.some((selectedPath) => repoConceptPathMatchesPreferredPrefix(selectedPath, aliasEntry))
    : false;
  const selectedFilesCoverConcept = aliasEntry
    ? selectedPaths.some((selectedPath) => selectedPathContainsAlias(selectedPath, normalizedAliases)) ||
      exactMatchFilesSelected ||
      preferredSelected
    : selectedPaths.length > 0;
  const selectedEvidenceRoles = rolesForSelectedPaths(selectedPaths);
  const requiredRoles = aliasEntry?.broad_concept ? aliasEntry.required_evidence_roles ?? [] : [];
  const missingRequiredRoles = requiredRoles.filter((role) => !selectedEvidenceRoles.includes(role));
  const singleRoleOnly = Boolean(aliasEntry?.broad_concept && selectedPaths.length > 1 && selectedEvidenceRoles.length <= 1);
  const selectedDocsOnly = selectedPaths.length > 0 && selectedPaths.every((entry) => entry.startsWith("docs/"));
  const weakFuzzyOnly = Boolean(aliasEntry && exactMatchFilesFound && !exactMatchFilesSelected && !preferredSelected);
  const missingExpectedPathHints = existingHints.filter((hint) =>
    !selectedPaths.some((selectedPath) => repoConceptPathMatchesHint(selectedPath, {
      ...aliasEntry!,
      exact_path_hints: [hint],
    })),
  );
  const violations: RepoEvidenceRelevanceGate["violations"] = [];
  if (exactMatchFilesFound && !exactMatchFilesSelected && !preferredSelected) {
    violations.push("exact_match_files_found_but_not_selected");
  }
  if (weakFuzzyOnly) violations.push("weak_fuzzy_only");
  if (aliasEntry && input.observation.concept !== aliasEntry.canonical_concept) violations.push("alias_not_normalized");
  if (aliasEntry && !selectedFilesCoverConcept) violations.push("selected_evidence_missing_concept_terms");
  if (singleRoleOnly) violations.push("single_role_only");
  if (missingRequiredRoles.length > 0 && selectedPaths.length > 0) violations.push("missing_required_evidence_roles");
  if (selectedDocsOnly && /\b(?:codebase|repo|repository|source|implementation|helix ask|this app)\b/i.test(input.query)) {
    violations.push("docs_only_for_codebase_question");
  }
  if (promptFacet.applies && selectedPaths.length > 0 && selectedPromptFacetPaths.length === 0) {
    violations.push("prompt_facet_evidence_missing");
  }
  const sourceTargetExactContract =
    input.sourceTargetExactContract ??
    (input.observation.source_target_exact_contract as Record<string, unknown> | undefined) ??
    null;
  if (sourceTargetExactContract && sourceTargetExactContract.terminal_allowed !== true) {
    violations.push("exact_source_contract_failed");
  }
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
    alias_normalization_applied: Boolean(aliasEntry && input.concept === aliasEntry.canonical_concept),
    expected_path_hints: expectedPathHints,
    selected_paths: selectedPaths,
    missing_expected_path_hints: missingExpectedPathHints,
    prompt_facet: promptFacet,
    selected_prompt_facet_paths: selectedPromptFacetPaths,
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
