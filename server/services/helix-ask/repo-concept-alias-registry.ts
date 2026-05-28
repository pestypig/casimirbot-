export type RepoConceptAliasEntry = {
  canonical_concept: string;
  aliases: string[];
  lexical_patterns: RegExp[];
  exact_path_hints: string[];
  preferred_path_prefixes: string[];
  preferred_symbol_terms: string[];
  negative_context_patterns?: RegExp[];
  source_target: "repo_code";
  required_terminal_kind: "repo_code_evidence_answer";
};

export type RepoConceptAliasMatch = {
  entry: RepoConceptAliasEntry;
  matched_aliases: string[];
  project_anchor_required: boolean;
};

export const REPO_CONCEPT_ALIAS_REGISTRY: RepoConceptAliasEntry[] = [
  {
    canonical_concept: "Reasoning Theater",
    aliases: [
      "reasoning theater",
      "reasoning theatre",
      "reasoning-theater",
      "reasoning-theatre",
      "reasoning_theater",
      "reasoning_theatre",
      "ReasoningTheater",
      "reasoningTheater",
      "reasoning theater state",
      "reasoning-theater-state",
      "reasoning_theater_state",
    ],
    lexical_patterns: [
      /\breasoning\s+theat(?:er|re)\b/i,
      /\breasoning[-_\s]?theat(?:er|re)\b/i,
    ],
    exact_path_hints: [
      "server/routes/helix/reasoning-theater.ts",
      "server/services/helix-ask/surface/reasoning-theater-state.ts",
      "server/__tests__/helix.ask.turn.reasoning-theater-state.test.ts",
      "server/__tests__/helix.reasoning-theater.topology.test.ts",
    ],
    preferred_path_prefixes: [
      "server/routes/helix/",
      "server/services/helix-ask/surface/",
      "server/__tests__/",
      "client/src/components/helix/",
    ],
    preferred_symbol_terms: [
      "reasoningTheater",
      "ReasoningTheater",
      "reasoning_theater",
      "reasoning-theater",
      "reasoningTheaterState",
      "reasoning_theater_state",
    ],
    source_target: "repo_code",
    required_terminal_kind: "repo_code_evidence_answer",
  },
  {
    canonical_concept: "StarSim",
    aliases: [
      "StarSim",
      "starsim",
      "star sim",
      "star simulation",
      "star simulations",
      "stellar simulation",
      "stellar simulations",
      "star simulator",
      "stellar evolution simulation",
    ],
    lexical_patterns: [
      /\bstar\s+sim(?:ulation|ulations|ulator)?\b/i,
      /\bstellar\s+sim(?:ulation|ulations)?\b/i,
      /\bstarsim\b/i,
    ],
    exact_path_hints: [
      "server/modules/starsim/",
      "shared/starsim-",
      "tools/starsim",
      "client/src/components/panels/StellarEvolutionLens.tsx",
      "client/src/components/panels/TheoryBadgeGraphPanel.tsx",
    ],
    preferred_path_prefixes: [
      "server/modules/starsim/",
      "shared/",
      "tools/",
      "client/src/components/panels/",
      "server/__tests__/",
    ],
    preferred_symbol_terms: [
      "StarSim",
      "starsim",
      "stellarEvolution",
      "StellarEvolution",
      "starsimFusion",
      "starsimSolar",
    ],
    source_target: "repo_code",
    required_terminal_kind: "repo_code_evidence_answer",
  },
];

const normalize = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const aliasMatches = (prompt: string, alias: string): boolean => {
  const normalizedPrompt = normalize(prompt);
  const normalizedAlias = normalize(alias);
  if (!normalizedAlias) return false;
  if (normalizedPrompt.includes(normalizedAlias)) return true;
  const compactAlias = normalizedAlias.replace(/[\s_-]+/g, "");
  const compactPrompt = normalizedPrompt.replace(/[\s_-]+/g, "");
  return compactAlias.length >= 5 && compactPrompt.includes(compactAlias);
};

const starSimAliasNeedsProjectAnchor = (prompt: string): boolean =>
  /\b(?:star|stellar)\s+sim(?:ulation|ulations|ulator)?\b/i.test(prompt) &&
  !/\bstarsim\b/i.test(prompt);

export function findRepoConceptAliasMatch(promptText: string): RepoConceptAliasMatch | null {
  const prompt = promptText.trim();
  if (!prompt) return null;
  for (const entry of REPO_CONCEPT_ALIAS_REGISTRY) {
    if (entry.negative_context_patterns?.some((pattern) => pattern.test(prompt))) continue;
    const matchedAliases = entry.aliases.filter((alias) => aliasMatches(prompt, alias));
    const patternMatched = entry.lexical_patterns.some((pattern) => pattern.test(prompt));
    if (!matchedAliases.length && !patternMatched) continue;
    return {
      entry,
      matched_aliases: matchedAliases,
      project_anchor_required:
        entry.canonical_concept === "StarSim" ? starSimAliasNeedsProjectAnchor(prompt) : false,
    };
  }
  return null;
}

export function findRepoConceptAliasEntry(conceptOrPrompt: string | null | undefined): RepoConceptAliasEntry | null {
  const value = String(conceptOrPrompt ?? "").trim();
  if (!value) return null;
  return REPO_CONCEPT_ALIAS_REGISTRY.find((entry) =>
    normalize(entry.canonical_concept) === normalize(value) ||
    entry.aliases.some((alias) => aliasMatches(value, alias)) ||
    entry.lexical_patterns.some((pattern) => pattern.test(value))
  ) ?? null;
}

export function repoConceptAliasTerms(entry: RepoConceptAliasEntry | null | undefined): string[] {
  if (!entry) return [];
  return unique([
    entry.canonical_concept,
    ...entry.aliases,
    ...entry.preferred_symbol_terms,
  ]).filter((term) => term.trim().length >= 3);
}

export function repoConceptPathMatchesHint(filePath: string, entry: RepoConceptAliasEntry | null | undefined): boolean {
  if (!entry) return false;
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return entry.exact_path_hints.some((hint) => {
    const normalizedHint = hint.replace(/\\/g, "/").toLowerCase();
    return normalizedHint.endsWith("/")
      ? normalized.startsWith(normalizedHint)
      : normalized === normalizedHint || normalized.startsWith(normalizedHint);
  });
}

export function repoConceptPathMatchesPreferredPrefix(filePath: string, entry: RepoConceptAliasEntry | null | undefined): boolean {
  if (!entry) return false;
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return entry.preferred_path_prefixes.some((prefix) => normalized.startsWith(prefix.toLowerCase()));
}
