export type RepoConceptAliasEntry = {
  canonical_concept: string;
  aliases: string[];
  lexical_patterns: RegExp[];
  exact_path_hints: string[];
  preferred_path_prefixes: string[];
  preferred_symbol_terms: string[];
  broad_concept?: boolean;
  required_evidence_roles?: RepoConceptEvidenceRole[];
  negative_context_patterns?: RegExp[];
  source_target: "repo_code";
  required_terminal_kind: "repo_code_evidence_answer";
};

export type RepoConceptEvidenceRole =
  | "definition"
  | "ui_surface"
  | "capability_registry"
  | "runtime_contract"
  | "state_model"
  | "terminal_authority"
  | "test_contract";

export type RepoConceptAliasMatch = {
  entry: RepoConceptAliasEntry;
  matched_aliases: string[];
  project_anchor_required: boolean;
};

export const REPO_CONCEPT_ALIAS_REGISTRY: RepoConceptAliasEntry[] = [
  {
    canonical_concept: "Stage Play Badge Graph",
    aliases: [
      "Stage Play Badge Graph",
      "stage play badge graph",
      "Stage Play panel",
      "stage play panel",
      "Stage Play graph",
      "stage play graph",
      "stage_play_badge_graph",
      "stage_play_output_lane_projection",
      "stage_play_live_answer_projection",
      "reflect_stage_play_context",
    ],
    lexical_patterns: [
      /\bstage\s*play\s+(?:badge\s+)?graph\b/i,
      /\bstage\s*play\s+panel\b/i,
      /\bstage_play_(?:badge_graph|output_lane_projection|live_answer_projection)\b/i,
      /\breflect_stage_play_context\b/i,
    ],
    exact_path_hints: [
      "docs/stage-play-badge-graph.md",
      "docs/stage-play-live-interpretation-boundary.md",
      "client/src/components/panels/StagePlayBadgeGraphPanel.tsx",
      "client/src/pages/helix-core.panels.ts",
      "server/services/stage-play/stage-play-output-lane-reducer.ts",
      "server/services/helix-ask/live-environment-tool-adapter.ts",
      "server/services/helix-ask/stage-play-prompt-intent.ts",
      "server/__tests__/helix.ask.stage-play-routing.test.ts",
    ],
    preferred_path_prefixes: [
      "docs/",
      "client/src/components/panels/",
      "client/src/pages/",
      "server/services/stage-play/",
      "server/services/helix-ask/",
      "server/__tests__/",
      "shared/contracts/",
    ],
    preferred_symbol_terms: [
      "StagePlayBadgeGraph",
      "StagePlayBadgeGraphPanel",
      "stage_play_badge_graph",
      "stage_play_output_lane_projection",
      "stage_play_live_answer_projection",
      "reflect_stage_play_context",
      "STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA",
    ],
    broad_concept: true,
    required_evidence_roles: ["definition", "ui_surface", "runtime_contract", "test_contract"],
    source_target: "repo_code",
    required_terminal_kind: "repo_code_evidence_answer",
  },
  {
    canonical_concept: "Situation Room",
    aliases: [
      "Situation Room",
      "situation room",
      "SituationRoom",
      "situation-room",
      "situation_room",
      "situation context",
      "situation_context",
      "situation-room-pipelines",
      "situation-room-sources",
      "Situation Room panel",
      "Situation Room control surface",
    ],
    lexical_patterns: [
      /\bsituation\s+room\b/i,
      /\bsituation[-_\s]?room\b/i,
      /\bsituation_context\b/i,
      /\bsituation-room-(?:pipelines|sources)\b/i,
    ],
    exact_path_hints: [
      "client/src/components/workstation/SituationRoomPipelinesPanel.tsx",
      "client/src/components/workstation/SituationRoomSourcesPanel.tsx",
      "client/src/lib/workstation/panelCapabilities.ts",
      "client/src/lib/workstation/panelActionAdapters.ts",
      "client/src/store/useSituationRoomStore.ts",
      "client/src/store/useSituationRoomJobStore.ts",
      "client/src/lib/helix/situation-room.ts",
      "shared/workstation-dynamic-tools.ts",
      "shared/helix-active-situation-context.ts",
      "shared/helix-situation-context-pack.ts",
      "server/services/helix-ask/situation-context-turn-router.ts",
      "server/services/helix-ask/situation-context-authority-selector.ts",
      "server/services/helix-ask/situation-room-setup-resolution.ts",
    ],
    preferred_path_prefixes: [
      "client/src/components/workstation/",
      "client/src/lib/workstation/",
      "client/src/lib/helix/",
      "client/src/store/",
      "shared/",
      "server/services/helix-ask/",
      "server/services/situation-room/",
      "server/__tests__/",
    ],
    preferred_symbol_terms: [
      "SituationRoom",
      "SituationRoomPipelinesPanel",
      "SituationRoomSourcesPanel",
      "useSituationRoomStore",
      "useSituationRoomJobStore",
      "situation-room-pipelines",
      "situation-room-sources",
      "situation_context",
      "active_situation_context",
      "situation_context_pack",
    ],
    broad_concept: true,
    required_evidence_roles: ["ui_surface", "capability_registry", "state_model"],
    source_target: "repo_code",
    required_terminal_kind: "repo_code_evidence_answer",
  },
  {
    canonical_concept: "Auntie Dottie",
    aliases: [
      "Auntie Dottie",
      "auntie dottie",
      "Dottie",
      "dottie",
      "dottie manifest",
      "dottie.manifest",
      "dottie observer",
      "dottie voice",
      "voice delivery",
      "voice_delivery",
      "observer.attach",
      "observer.query",
    ],
    lexical_patterns: [
      /\bauntie\s+dottie\b/i,
      /\bdottie\b/i,
      /\bdottie\.manifest\b/i,
      /\bvoice_delivery\b/i,
      /\bobserver\.(?:attach|query)\b/i,
    ],
    exact_path_hints: [
      "shared/helix-dottie-manifest-preset.ts",
      "server/services/situation-room/dottie-manifest-preset.ts",
      "server/services/helix-ask/workstation-tool-planner.ts",
      "server/services/helix-ask/runtime-authority-contract.ts",
      "shared/workstation-dynamic-tools.ts",
      "client/src/lib/workstation/panelCapabilities.ts",
      "client/src/lib/workstation/panelActionAdapters.ts",
      "server/__tests__/dottie-manifest-preset.test.ts",
      "server/__tests__/helix.ask.workstation-tool-planner.test.ts",
    ],
    preferred_path_prefixes: [
      "shared/",
      "server/services/situation-room/",
      "server/services/helix-ask/",
      "client/src/lib/workstation/",
      "server/__tests__/",
    ],
    preferred_symbol_terms: [
      "Auntie Dottie",
      "dottie.manifest",
      "dottie_manifest",
      "dottie_manifest_preset",
      "dottie_observer_subscription",
      "dottie_voice_receipt",
      "voice_delivery",
      "observer.attach",
      "observer.query",
    ],
    broad_concept: true,
    required_evidence_roles: ["capability_registry", "runtime_contract"],
    source_target: "repo_code",
    required_terminal_kind: "repo_code_evidence_answer",
  },
  {
    canonical_concept: "Route Evidence",
    aliases: [
      "Route Evidence",
      "route evidence",
      "route_evidence",
      "route-evidence",
      "route drift",
      "route_drift",
      "live perturbation",
      "live_perturbation",
      "live_env.query_navigation_state",
    ],
    lexical_patterns: [
      /\broute\s+evidence\b/i,
      /\broute[_-\s]?drift\b/i,
      /\blive[_-\s]?perturbation\b/i,
      /\blive_env\.query_navigation_state\b/i,
    ],
    exact_path_hints: [
      "shared/helix-situation-construct.ts",
      "shared/situation-room-live-job-contract.ts",
      "server/services/situation-room/situation-construct-recipe-registry.ts",
      "server/services/situation-room/situation-construct-recipe-runner.ts",
      "server/services/helix-ask/situation-room-live-job-setup-planner.ts",
      "client/src/components/workstation/SituationRoomPipelinesPanel.tsx",
      "client/src/lib/workstation/panelActionAdapters.ts",
      "client/src/lib/workstation/panelCapabilities.ts",
    ],
    preferred_path_prefixes: [
      "shared/",
      "server/services/situation-room/",
      "server/services/helix-ask/",
      "client/src/components/workstation/",
      "client/src/lib/workstation/",
      "server/__tests__/",
    ],
    preferred_symbol_terms: [
      "Route Evidence",
      "route_evidence",
      "route_drift",
      "missing_evidence",
      "field_worker",
      "field_worker_policy",
      "live_perturbation",
      "live_env.query_navigation_state",
      "live_env.query_source_health",
    ],
    broad_concept: true,
    required_evidence_roles: ["ui_surface", "runtime_contract"],
    source_target: "repo_code",
    required_terminal_kind: "repo_code_evidence_answer",
  },
  {
    canonical_concept: "terminal authority",
    aliases: [
      "terminal authority",
      "terminal_authority",
      "terminal answer authority",
      "terminal_answer_authority",
      "terminal boundary",
      "terminal-answer-envelope",
      "runtime authority contract",
      "runtime-authority-contract",
    ],
    lexical_patterns: [
      /\bterminal\s+authority\b/i,
      /\bterminal_answer_authority\b/i,
      /\bterminal\s+boundary\b/i,
      /\bruntime[-_\s]?authority[-_\s]?contract\b/i,
      /\bterminal[-_\s]?answer[-_\s]?envelope\b/i,
    ],
    exact_path_hints: [
      "server/services/helix-ask/terminal-answer-envelope.ts",
      "server/services/helix-ask/runtime-authority-contract.ts",
      "server/services/helix-ask/solver-controller-decision.ts",
      "server/services/helix-ask/route-product-contract.ts",
      "server/__tests__/helix.ask.terminal-authority-contracts.test.ts",
    ],
    preferred_path_prefixes: [
      "server/services/helix-ask/",
      "shared/",
      "server/__tests__/",
    ],
    preferred_symbol_terms: [
      "terminal_answer_authority",
      "terminal_artifact_kind",
      "final_answer_source",
      "applyTerminalAnswerEnvelope",
      "evaluateTerminalBoundaryEligibility",
      "runtime_authority_contract",
    ],
    broad_concept: true,
    required_evidence_roles: ["runtime_contract", "terminal_authority"],
    source_target: "repo_code",
    required_terminal_kind: "repo_code_evidence_answer",
  },
  {
    canonical_concept: "docs panel",
    aliases: [
      "docs panel",
      "doc panel",
      "documents panel",
      "docs viewer",
      "doc viewer",
      "document viewer",
      "docs-viewer",
      "docs_viewer",
      "DocViewerPanel",
    ],
    lexical_patterns: [
      /\bdocs?\s+panel\b/i,
      /\bdocuments?\s+panel\b/i,
      /\bdocs?\s+viewer\b/i,
      /\bdocument\s+viewer\b/i,
      /\bdocs[-_\s]?viewer\b/i,
      /\bDocViewerPanel\b/i,
    ],
    exact_path_hints: [
      "client/src/components/DocViewerPanel.tsx",
      "client/src/lib/workstation/panelCapabilities.ts",
      "client/src/lib/workstation/panelActionAdapters.ts",
      "shared/workstation-dynamic-tools.ts",
      "server/services/helix-ask/runtime-authority-contract.ts",
      "server/services/helix-ask/route-product-contract.ts",
    ],
    preferred_path_prefixes: [
      "client/src/components/",
      "client/src/lib/workstation/",
      "shared/",
      "server/services/helix-ask/",
      "server/__tests__/",
    ],
    preferred_symbol_terms: [
      "DocViewerPanel",
      "docs-viewer",
      "docs_viewer",
      "summarize_doc",
      "locate_in_doc",
      "doc_summary",
      "doc_location_matches",
    ],
    broad_concept: true,
    required_evidence_roles: ["ui_surface", "capability_registry", "runtime_contract"],
    source_target: "repo_code",
    required_terminal_kind: "repo_code_evidence_answer",
  },
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
      "client/src/components/helix/HelixAskPill.tsx",
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
    broad_concept: true,
    required_evidence_roles: ["runtime_contract", "test_contract"],
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
    broad_concept: true,
    required_evidence_roles: ["runtime_contract"],
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
