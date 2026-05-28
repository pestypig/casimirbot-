import * as fs from "node:fs";
import * as path from "node:path";
import type { HelixRepoCodeEvidenceObservation } from "../../../shared/helix-repo-code-evidence-observation";
import {
  findRepoConceptAliasEntry,
  repoConceptAliasTerms,
  repoConceptPathMatchesHint,
  repoConceptPathMatchesPreferredPrefix,
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
  weak_fuzzy_only: boolean;
  alias_normalization_applied: boolean;
  expected_path_hints: string[];
  selected_paths: string[];
  missing_expected_path_hints: string[];
  coverage: "strong" | "adequate" | "weak" | "none";
  violations: Array<
    | "exact_match_files_found_but_not_selected"
    | "weak_fuzzy_only"
    | "alias_not_normalized"
    | "codebase_anchor_ignored"
    | "selected_evidence_missing_concept_terms"
    | "docs_only_for_codebase_question"
  >;
  repair_required: boolean;
  terminal_allowed: boolean;
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

export function evaluateRepoEvidenceRelevanceGate(input: {
  turnId: string;
  concept: string;
  query: string;
  observation: HelixRepoCodeEvidenceObservation;
  repoRoot?: string;
}): RepoEvidenceRelevanceGate {
  const repoRoot = input.repoRoot ?? process.cwd();
  const aliasEntry = findRepoConceptAliasEntry([input.concept, input.query].join(" "));
  const normalizedAliases = repoConceptAliasTerms(aliasEntry);
  const selectedPaths = unique(input.observation.spans.map((span) => normalizePath(span.path)).filter(Boolean));
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
  if (selectedDocsOnly && /\b(?:codebase|repo|repository|source|implementation|helix ask|this app)\b/i.test(input.query)) {
    violations.push("docs_only_for_codebase_question");
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
    weak_fuzzy_only: weakFuzzyOnly,
    alias_normalization_applied: Boolean(aliasEntry && input.concept === aliasEntry.canonical_concept),
    expected_path_hints: expectedPathHints,
    selected_paths: selectedPaths,
    missing_expected_path_hints: missingExpectedPathHints,
    coverage,
    violations: unique(violations),
    repair_required: !terminalAllowed,
    terminal_allowed: terminalAllowed,
    assistant_answer: false,
    raw_content_included: false,
  };
}
