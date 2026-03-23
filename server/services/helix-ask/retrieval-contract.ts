import * as fs from "node:fs";
import * as path from "node:path";
import type { PromptResearchContract, PromptResearchContractExpansionRule } from "./prompt-research-contract";

export type RetrievalContract = {
  must_read_paths: string[];
  precedence_paths: string[];
  expansion_rule: PromptResearchContractExpansionRule;
  external_context_allowed: boolean;
  external_context_non_authoritative: boolean;
  missing_required_paths: string[];
  unreadable_required_paths: string[];
};

const normalizeWhitespace = (value: string): string =>
  String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();

const unique = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = normalizeWhitespace(value).replace(/\\/g, "/");
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const isReadableFile = (absolutePath: string): boolean => {
  try {
    fs.accessSync(absolutePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

export const buildPromptResearchRetrievalContract = (
  contract: PromptResearchContract | null | undefined,
  cwd = process.cwd(),
): RetrievalContract | null => {
  if (!contract || contract.mode !== "research_contract") return null;
  const mustReadPaths = unique(contract.required_repo_inputs);
  const precedencePaths = unique(contract.canonical_precedence_paths);
  const missingRequiredPaths: string[] = [];
  const unreadableRequiredPaths: string[] = [];
  for (const relPath of mustReadPaths) {
    const fullPath = path.resolve(cwd, relPath);
    if (!fs.existsSync(fullPath)) {
      missingRequiredPaths.push(relPath);
      continue;
    }
    if (!isReadableFile(fullPath)) {
      unreadableRequiredPaths.push(relPath);
    }
  }
  return {
    must_read_paths: mustReadPaths,
    precedence_paths: precedencePaths,
    expansion_rule: contract.allowed_extra_retrieval_rule,
    external_context_allowed: /external literature may provide context/i.test(contract.raw_prompt),
    external_context_non_authoritative: /must never override canonical repo state/i.test(
      contract.raw_prompt,
    ),
    missing_required_paths: missingRequiredPaths,
    unreadable_required_paths: unreadableRequiredPaths,
  };
};

export const rankPathsByPrecedence = (
  paths: string[],
  precedencePaths: string[] = [],
  maxCount = paths.length,
): string[] => {
  const normalizedPrecedence = unique(precedencePaths);
  const precedenceRank = new Map(
    normalizedPrecedence.map((entry, index) => [entry.toLowerCase(), index] as const),
  );
  return unique(paths)
    .map((entry, index) => {
      const normalized = entry.toLowerCase();
      const rank = precedenceRank.get(normalized);
      return {
        entry,
        index,
        rank: typeof rank === "number" ? rank : Number.POSITIVE_INFINITY,
      };
    })
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map((entry) => entry.entry)
    .slice(0, Math.max(0, maxCount));
};

export const explainPrecedenceConflicts = (paths: string[], precedencePaths: string[] = []) => {
  const ranked = rankPathsByPrecedence(paths, precedencePaths);
  const precedenceHits = ranked.filter((entry) =>
    precedencePaths.some((precedence) => precedence.toLowerCase() === entry.toLowerCase()),
  );
  if (precedenceHits.length <= 1) return [];
  const higher = precedenceHits[0] ?? null;
  if (!higher) return [];
  return precedenceHits.slice(1).map((lower) => ({
    higher_precedence_path: higher,
    lower_precedence_path: lower,
    note: `Canonical precedence favors ${higher} over ${lower}.`,
  }));
};
