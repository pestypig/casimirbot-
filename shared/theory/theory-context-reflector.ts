import type { PhysicsAtlasBlockId, PhysicsAtlasBlockV1 } from "../contracts/physics-atlas.v1";
import type { TheoryBiomeBand } from "../contracts/theory-biome-layout.v1";
import {
  buildTheoryContextReflectionV1,
  type TheoryContextReflectionConfidenceMode,
  type TheoryContextReflectionExplanationDepthHint,
  type TheoryContextReflectionCalculatorPayloadSummaryV1,
  type TheoryContextReflectionMatchV1,
  type TheoryContextReflectionRecommendedActionV1,
  type TheoryContextReflectionResolutionMode,
  type TheoryContextReflectionResolutionRole,
  type TheoryContextReflectionResolutionV1,
  type TheoryContextReflectionSource,
  type TheoryContextReflectionUncertaintyV1,
  type TheoryContextReflectionV1,
} from "../contracts/theory-context-reflection.v1";
import type { TheoryBadgeGraphV1, TheoryBadgeV1 } from "../contracts/theory-badge-graph.v1";
import {
  buildTheoryContextScientificMethodReflectionV1,
  type TheoryContextScientificMethodReflectionV1,
} from "../contracts/theory-context-scientific-method-reflection.v1";
import { buildProbabilityTerrainV1 } from "../probability-terrain";
import { buildHelixPhysicsAtlasV1 } from "./physics-atlas-blocks";
import { resolvePhysicsAtlasLens } from "./physics-atlas-lens";
import { buildTheoryBiomeLayoutV1 } from "./theory-biome-layout";
import {
  locateTheoryBadges,
  traceTheoryBadgeConnections,
  type TheoryBadgeLookupMatch,
} from "./theory-badge-overlap-locator";

export type BuildTheoryContextReflectionInput = {
  graph: TheoryBadgeGraphV1;
  prompt: string;
  conversationContext?: string | null;
  mentionedEquations?: string[];
  mentionedSymbols?: string[];
  mentionedDomains?: string[];
  confidenceMode?: TheoryContextReflectionConfidenceMode;
  resolutionMode?: TheoryContextReflectionResolutionMode;
  source?: TheoryContextReflectionSource;
  limit?: number;
  generatedAt?: string;
  reflectionId?: string;
};

const STRONG_MATCH_SCORE = 70;
const RESOLUTION_ROLES: TheoryContextReflectionResolutionRole[] = [
  "prompt_center",
  "first_principles_path",
  "observable_path",
  "claim_boundary",
  "consequence_context",
  "analogy_context",
  "ambient_context",
];

const GENERIC_CONGRUENCE_TOKENS = new Set([
  "bound",
  "gamma",
  "g_r",
  "lattice",
  "margin",
  "pi",
  "prime",
  "proxy",
]);

const TOKEN_STOP_WORDS = new Set([
  "and",
  "are",
  "badge",
  "context",
  "for",
  "from",
  "graph",
  "into",
  "near",
  "reflect",
  "the",
  "theory",
  "this",
  "with",
]);

const DIRECT_MATCH_REASON_PATTERNS = [
  /direct badge id match/i,
  /direct badge title match/i,
  /calculator payload match/i,
  /symbol match/i,
  /equation family match/i,
  /repo path match/i,
  /source path hint/i,
] as const;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeKey(value: string): string {
  return normalize(value)
    .replace(/\\_/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function tokenizeResolutionQuery(value: string): string[] {
  return unique(
    value
      .toLowerCase()
      .split(/[^a-z0-9_./^-]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !TOKEN_STOP_WORDS.has(token)),
  );
}

function queryText(args: BuildTheoryContextReflectionInput): string {
  return unique([
    args.prompt,
    args.conversationContext ?? "",
    ...(args.mentionedEquations ?? []),
  ]).join("\n");
}

function badgeResolutionText(badge: TheoryBadgeV1): string {
  return [
    badge.id,
    badge.title,
    badge.plainMeaning,
    badge.whyItMatters,
    ...badge.subjects,
    ...badge.tags,
    ...badge.equationFamilies,
    ...badge.simulationOwners,
    ...badge.hintKeys.subjects,
    ...badge.hintKeys.symbols,
    ...badge.hintKeys.equationFamilies,
    ...badge.equations.flatMap((equation) => [
      equation.id,
      equation.displayLatex,
      equation.computableExpression ?? "",
      equation.operatorKind ?? "",
      ...equation.inputSymbols,
      ...equation.outputSymbols,
    ]),
    ...badge.calculatorPayloads.flatMap((payload) => [
      payload.id,
      payload.expression,
      payload.displayLatex,
      payload.targetVariable ?? "",
    ]),
    ...badge.sourceRefs.flatMap((ref) => [ref.id ?? "", ref.path ?? "", ref.note ?? ""]),
  ].join(" ");
}

function textIncludes(value: string, candidate: string): boolean {
  return Boolean(value && candidate && normalize(value).includes(normalize(candidate)));
}

function badgeById(graph: TheoryBadgeGraphV1): Map<string, TheoryBadgeV1> {
  return new Map(graph.badges.map((badge) => [badge.id, badge]));
}

function inferAtlasBlockIds(args: {
  atlasBlocks: PhysicsAtlasBlockV1[];
  mentionedDomains: string[];
  query: string;
}): PhysicsAtlasBlockId[] {
  const requestedKeys = new Set(args.mentionedDomains.map(normalizeKey));
  const query = args.query;
  return args.atlasBlocks
    .filter((block) => {
      if (requestedKeys.has(normalizeKey(block.id))) return true;
      if (requestedKeys.has(normalizeKey(block.title)) || requestedKeys.has(normalizeKey(block.shortTitle))) return true;
      if (block.subjects.some((subject) => requestedKeys.has(normalizeKey(subject)))) return true;
      return (
        textIncludes(query, block.title) ||
        textIncludes(query, block.shortTitle) ||
        block.subjects.some((subject) => textIncludes(query, subject)) ||
        block.equationFamilies.some((family) => textIncludes(query, family)) ||
        block.simulationOwners.some((owner) => textIncludes(query, owner))
      );
    })
    .map((block) => block.id);
}

function inferEquationFamilies(graph: TheoryBadgeGraphV1, query: string, equations: string[]): string[] {
  const text = `${query}\n${equations.join("\n")}`;
  return unique(
    graph.badges.flatMap((badge) =>
      badge.equationFamilies.filter((family) => textIncludes(text, family)),
    ),
  );
}

function inferSimulationOwners(graph: TheoryBadgeGraphV1, query: string, domains: string[]): string[] {
  const keys = new Set(domains.map(normalizeKey));
  return unique(
    graph.badges.flatMap((badge) =>
      badge.simulationOwners.filter((owner) => keys.has(normalizeKey(owner)) || textIncludes(query, owner)),
    ),
  );
}

function isExactMatch(match: TheoryBadgeLookupMatch): boolean {
  return (
    match.score >= STRONG_MATCH_SCORE ||
    match.reasons.some((reason) => DIRECT_MATCH_REASON_PATTERNS.some((pattern) => pattern.test(reason)))
  );
}

function hasDirectMatchReason(match: TheoryBadgeLookupMatch): boolean {
  return match.reasons.some((reason) =>
    DIRECT_MATCH_REASON_PATTERNS.some((pattern) => pattern.test(reason)),
  );
}

function toReflectionMatch(match: TheoryBadgeLookupMatch): TheoryContextReflectionMatchV1 {
  return {
    badgeId: match.badgeId,
    title: match.badgeTitle,
    score: match.score,
    reasons: match.reasons,
    matchedSymbols: match.matchedSymbols,
    matchedEquationFamilies: match.matchedEquationFamilies,
    matchedRepoPaths: match.matchedRepoPaths,
    claimBoundaryNotes: match.claimBoundaryWarnings,
  };
}

function scoreAtlasBlock(args: {
  block: PhysicsAtlasBlockV1;
  matches: TheoryBadgeLookupMatch[];
  query: string;
  mentionedDomains: string[];
}): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const matchedBadgeIds = new Set(args.matches.map((match) => match.badgeId));
  const mentionedDomainKeys = new Set(args.mentionedDomains.map(normalizeKey));

  const primaryHits = args.block.primaryBadgeIds.filter((id) => matchedBadgeIds.has(id));
  if (primaryHits.length > 0) {
    score += 35 * primaryHits.length;
    reasons.push(`primary badge matches: ${primaryHits.join(", ")}`);
  }

  const rootHits = args.block.rootBadgeIds.filter((id) => matchedBadgeIds.has(id));
  if (rootHits.length > 0) {
    score += 20 * rootHits.length;
    reasons.push(`root badge matches: ${rootHits.join(", ")}`);
  }

  if (
    mentionedDomainKeys.has(normalizeKey(args.block.id)) ||
    mentionedDomainKeys.has(normalizeKey(args.block.title)) ||
    mentionedDomainKeys.has(normalizeKey(args.block.shortTitle))
  ) {
    score += 40;
    reasons.push("mentioned domain matched atlas block");
  }

  const subjectHits = args.block.subjects.filter((subject) => textIncludes(args.query, subject));
  if (subjectHits.length > 0) {
    score += 12 * subjectHits.length;
    reasons.push(`subject hits: ${subjectHits.join(", ")}`);
  }

  return { score, reasons: unique(reasons) };
}

function claimBoundaryNotes(matches: TheoryBadgeLookupMatch[], traceNotes: string[]): string[] {
  return unique([
    ...matches.flatMap((match) => match.claimBoundaryWarnings.map((warning) => `${match.badgeId}: ${warning}`)),
    ...traceNotes,
  ]);
}

function hasScalarRows(matches: TheoryBadgeLookupMatch[]): boolean {
  return matches.some((match) => match.calculatorPayloadIds.length > 0);
}

function firstScalarBadgeId(matches: TheoryBadgeLookupMatch[]): string | null {
  return matches.find((match) => match.calculatorPayloadIds.length > 0)?.badgeId ?? null;
}

function firstRuntimeBadgeId(graph: TheoryBadgeGraphV1, badgeIds: string[]): string | null {
  const badges = badgeById(graph);
  for (const id of badgeIds) {
    const badge = badges.get(id);
    if (
      badge?.equations.some((equation) =>
        typeof equation.operatorKind === "string" &&
        [
          "tensor_component",
          "field_sample",
          "region_aggregate",
          "worldline_integral",
          "gate_status",
          "noncomputable_reference",
        ].includes(equation.operatorKind),
      )
    ) {
      return id;
    }
  }
  return null;
}

function hasRuntimeRows(graph: TheoryBadgeGraphV1, badgeIds: string[]): boolean {
  return firstRuntimeBadgeId(graph, badgeIds) !== null;
}

function recommendedActions(args: {
  graph: TheoryBadgeGraphV1;
  selectedBadgeIds: string[];
  matches: TheoryBadgeLookupMatch[];
}): TheoryContextReflectionRecommendedActionV1[] {
  const selectedBadgeIds = unique(args.selectedBadgeIds);
  if (selectedBadgeIds.length === 0) return [];
  const scalarBadgeId = firstScalarBadgeId(args.matches);
  const runtimeBadgeId = firstRuntimeBadgeId(args.graph, selectedBadgeIds);
  const actions: TheoryContextReflectionRecommendedActionV1[] = [
    {
      actionId: "theory-badge-graph.build_compound_theory_run",
      label: "Build compound theory run",
      panelId: "theory-badge-graph" as const,
      args: {
        badge_ids: selectedBadgeIds,
        mode: "dependency_path",
        include_scalar: true,
        include_runtime: true,
        include_evidence: true,
        include_boundaries: true,
      },
      mutatesCalculator: false,
      solves: false,
    },
    {
      actionId: "theory-badge-graph.load_compound_theory_run",
      label: "Load compound theory run",
      panelId: "theory-badge-graph" as const,
      args: {
        badge_ids: selectedBadgeIds,
        mode: "dependency_path",
      },
      mutatesCalculator: true,
      solves: false,
    },
  ];

  if (hasScalarRows(args.matches)) {
    actions.push({
      actionId: "theory-badge-graph.load_payloads_to_calculator",
      label: "Load scalar payloads",
      panelId: "theory-badge-graph",
      args: {
        ...(scalarBadgeId ? { badge_id: scalarBadgeId } : {}),
      },
      mutatesCalculator: true,
      solves: false,
    });
  }

  if (runtimeBadgeId) {
    actions.push({
      actionId: "theory-badge-graph.get_runtime_math_trace",
      label: "Get runtime math trace",
      panelId: "theory-badge-graph",
      args: {
        badge_id: runtimeBadgeId,
      },
      mutatesCalculator: false,
      solves: false,
    });
  }

  return actions;
}

function calculatorPayloadSummaries(args: {
  graph: TheoryBadgeGraphV1;
  matches: TheoryBadgeLookupMatch[];
  limit?: number;
}): TheoryContextReflectionCalculatorPayloadSummaryV1[] {
  const badges = badgeById(args.graph);
  const summaries: TheoryContextReflectionCalculatorPayloadSummaryV1[] = [];
  const seen = new Set<string>();
  for (const match of args.matches) {
    const badge = badges.get(match.badgeId);
    if (!badge || badge.calculatorPayloads.length === 0) continue;
    for (const payload of badge.calculatorPayloads) {
      const key = `${badge.id}:${payload.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      summaries.push({
        badgeId: badge.id,
        badgeTitle: badge.title,
        payloadId: payload.id,
        expression: payload.expression,
        displayLatex: payload.displayLatex,
        targetVariable: payload.targetVariable ?? null,
        claimBoundaryNotes: match.claimBoundaryWarnings.length
          ? match.claimBoundaryWarnings
          : badge.claimBoundary.diagnosticOnly
            ? ["Calculator payload is diagnostic/proxy evidence only and does not validate or promote a claim."]
            : [],
      });
      if (summaries.length >= (args.limit ?? 12)) return summaries;
    }
  }
  return summaries;
}

function sanitizeId(value: string): string {
  return normalizeKey(value).slice(0, 80) || "item";
}

function summaryText(args: {
  domains: Array<{ title: string }>;
  exactMatches: TheoryContextReflectionMatchV1[];
  likelyMatches: TheoryContextReflectionMatchV1[];
  claimBoundaries: string[];
}): string {
  const domainText = args.domains.map((domain) => domain.title).slice(0, 3).join(" and ");
  const exactText = args.exactMatches.map((match) => match.title).slice(0, 3).join(", ");
  const likelyText = args.likelyMatches.map((match) => match.title).slice(0, 3).join(", ");
  const boundaryText = args.claimBoundaries.length > 0 ? " Claim boundaries remain diagnostic/proxy constrained." : "";

  if (domainText && exactText) {
    return `The discussion appears near ${domainText}, with exact matches on ${exactText}.${boundaryText}`;
  }
  if (domainText && likelyText) {
    return `The discussion appears near ${domainText}, with likely matches on ${likelyText}.${boundaryText}`;
  }
  if (exactText) return `The discussion has exact theory badge matches on ${exactText}.${boundaryText}`;
  if (likelyText) return `The discussion has likely theory badge matches on ${likelyText}.${boundaryText}`;
  return "The discussion did not produce a strong theory badge location. No final answer is implied.";
}

const THEORY_IDEOLOGY_BRIDGE_THEORY_CUE =
  /\b(?:theory\s+(?:badge\s*)?graph|physics\s+(?:badge\s*)?graph|observable\s+physics|mathematics|entropy|conservation|self[-\s]?organization|chemistry|first\s+principles|boundary\s+conditions?|feedback\s+loops?|symmetry|invariance)\b/i;

const THEORY_IDEOLOGY_BRIDGE_ZEN_CUE =
  /\b(?:zen\s*(?:badge\s*)?graph|zengraph|fruition|justice|fairness|due\s+process|morality|moral|ethos|procedural\s+justice|personalization|priorit(?:y|ies)|non[-\s]?harm|right\s+speech)\b/i;

const BRIDGE_FOCUS_GROUPS = [
  {
    label: "entropy",
    lookupQuery: "entropy irreversibility open_system_entropy",
    promptPattern: /\b(?:entropy|drift|irreversibility|impermanence)\b/i,
    evidencePattern: /\b(?:entropy|drift|irreversibility|impermanence|open_system_entropy)\b/i,
  },
  {
    label: "conservation",
    lookupQuery: "conservation stress_energy_conservation energy_momentum_conservation",
    promptPattern: /\b(?:conservation|stress[-_\s]?energy\s+conservation)\b/i,
    evidencePattern: /\b(?:conservation|stress[-_\s]?energy\s+conservation|energy[-_\s]?momentum\s+conservation)\b/i,
  },
  {
    label: "self-organization",
    lookupQuery: "self organization feedback non_equilibrium open_system",
    promptPattern: /\b(?:self[-_\s]?organization|self[-_\s]?organizing|feedback\s+loops?)\b/i,
    evidencePattern: /\b(?:self[-_\s]?organization|self[-_\s]?organizing|feedback\s+loops?|open_system|non_equilibrium)\b/i,
  },
  {
    label: "observation",
    lookupQuery: "observation measurement provenance falsifiability",
    promptPattern: /\b(?:observation|measurement|provenance|falsifiability|testable|source\s+refs?)\b/i,
    evidencePattern: /\b(?:observation|measurement|provenance|falsifiability|testable|observational_proxy)\b/i,
  },
  {
    label: "boundary conditions",
    lookupQuery: "boundary conditions boundary_condition error_budget",
    promptPattern: /\b(?:boundary\s+conditions?|jurisdiction|contestability)\b/i,
    evidencePattern: /\b(?:boundary\s+conditions?|boundary_condition|error_budget|jurisdiction|contestability)\b/i,
  },
  {
    label: "symmetry",
    lookupQuery: "symmetry invariance unit dimension energy_momentum",
    promptPattern: /\b(?:symmetry|invariance|equal[-_\s]?condition|unit|dimension)\b/i,
    evidencePattern: /\b(?:symmetry|invariance|unit|dimension|energy[-_\s]?momentum)\b/i,
  },
] as const;

function isTheoryIdeologyBridgePrompt(query: string): boolean {
  return THEORY_IDEOLOGY_BRIDGE_THEORY_CUE.test(query) && THEORY_IDEOLOGY_BRIDGE_ZEN_CUE.test(query);
}

function requestedBridgeFocusGroups(query: string): Array<(typeof BRIDGE_FOCUS_GROUPS)[number]> {
  return BRIDGE_FOCUS_GROUPS.filter((group) => group.promptPattern.test(query));
}

function bridgeFocusEvidenceText(match: TheoryBadgeLookupMatch): string {
  const directReasons = match.reasons.filter((reason) =>
    !/direct atlas primary badge|inside selected atlas lens|via atlas block|source path hint via atlas block|calculator example expression\/symbol match/i.test(
      reason,
    ),
  );
  return [
    match.badgeId,
    match.badgeTitle,
    ...match.matchedSubjects,
    ...match.matchedEquationFamilies,
    ...match.matchedSymbols,
    ...directReasons,
  ].join(" ");
}

function bridgeFocusScore(match: TheoryBadgeLookupMatch, focusGroups: Array<(typeof BRIDGE_FOCUS_GROUPS)[number]>): number {
  if (focusGroups.length === 0) return 0;
  const evidenceText = bridgeFocusEvidenceText(match);
  const matchedFocusGroups = focusGroups.filter((group) => group.evidencePattern.test(evidenceText));
  if (matchedFocusGroups.length === 0) return 0;
  const directReasonCount = match.reasons.filter((reason) =>
    /subject\/tag match|equation family match|symbol match|calculator payload match|text match/i.test(reason),
  ).length;
  return matchedFocusGroups.length * 100 + Math.min(40, directReasonCount * 10);
}

function prioritizeTheoryIdeologyBridgeMatches(args: {
  query: string;
  matches: TheoryBadgeLookupMatch[];
}): TheoryBadgeLookupMatch[] {
  if (!isTheoryIdeologyBridgePrompt(args.query)) return args.matches;
  const focusGroups = requestedBridgeFocusGroups(args.query);
  if (focusGroups.length === 0) return args.matches;
  return [...args.matches].sort((left, right) => {
    const focusDelta = bridgeFocusScore(right, focusGroups) - bridgeFocusScore(left, focusGroups);
    if (focusDelta !== 0) return focusDelta;
    return right.score - left.score || left.badgeId.localeCompare(right.badgeId);
  });
}

function mergeTheoryLookupMatches(matches: TheoryBadgeLookupMatch[]): TheoryBadgeLookupMatch[] {
  const byBadgeId = new Map<string, TheoryBadgeLookupMatch>();
  for (const match of matches) {
    const existing = byBadgeId.get(match.badgeId);
    if (!existing || match.score > existing.score) {
      byBadgeId.set(match.badgeId, match);
    }
  }
  return Array.from(byBadgeId.values());
}

function roleRecord(): Record<TheoryContextReflectionResolutionRole, string[]> {
  return {
    prompt_center: [],
    first_principles_path: [],
    observable_path: [],
    claim_boundary: [],
    consequence_context: [],
    analogy_context: [],
    ambient_context: [],
  };
}

function explanationDepthHint(mode: TheoryContextReflectionResolutionMode): TheoryContextReflectionExplanationDepthHint {
  if (mode === "focused") return "specific";
  if (mode === "wide_context") return "cross_scale";
  return "path";
}

function hasClaimBoundaryShape(badge: TheoryBadgeV1): boolean {
  return (
    badge.level === "claim_boundary" ||
    badge.equations.some((equation) => equation.operatorKind === "gate_status") ||
    /claim[_\s-]?boundary|boundary|no[_\s-]?go|decoherence/i.test(
      `${badge.id} ${badge.title} ${badge.equationFamilies.join(" ")}`,
    )
  );
}

function hasFirstPrinciplesShape(badge: TheoryBadgeV1): boolean {
  return (
    badge.level === "first_principle" ||
    badge.level === "law" ||
    /dimension|conservation|energy_frequency|thermodynamic|equation_of_state|symmetry|invariance|unit/i.test(
      `${badge.id} ${badge.title} ${badge.equationFamilies.join(" ")} ${badge.tags.join(" ")}`,
    )
  );
}

function hasObservableShape(badge: TheoryBadgeV1): boolean {
  return /observable|signature|spectrum|spectroscopy|frequency|linewidth|lifetime|density|wavelength|trace|T2|tau|Hz|1\/s|kg\/m\^3/i.test(
    [
      badge.id,
      badge.title,
      ...badge.subjects,
      ...badge.tags,
      ...badge.equationFamilies,
      ...badge.units.flatMap((unit) => [unit.symbol, unit.unit ?? "", unit.quantity, unit.dimensionSignature ?? ""]),
      ...badge.calculatorPayloads.flatMap((payload) => [payload.id, payload.expression, payload.displayLatex]),
    ].join(" "),
  );
}

function hasSpecificDirectEvidence(args: {
  badge: TheoryBadgeV1;
  match: TheoryBadgeLookupMatch;
  queryTokens: string[];
}): boolean {
  const text = normalize(badgeResolutionText(args.badge));
  const specificTokenHits = args.queryTokens.filter(
    (token) =>
      !GENERIC_CONGRUENCE_TOKENS.has(normalizeKey(token)) &&
      normalizeKey(token).length >= 3 &&
      text.includes(normalize(token)),
  );
  const nonGenericSymbolHits = args.match.matchedSymbols.filter(
    (symbol) => !GENERIC_CONGRUENCE_TOKENS.has(normalizeKey(symbol)),
  );
  const directIdOrTitle = args.match.reasons.some((reason) => /direct badge (?:id|title) match/i.test(reason));
  const equationFamilyHit = args.match.matchedEquationFamilies.length > 0;

  return directIdOrTitle || nonGenericSymbolHits.length > 0 || equationFamilyHit || specificTokenHits.length >= 2;
}

function isAnalogyLikeMatch(args: {
  badge: TheoryBadgeV1;
  match: TheoryBadgeLookupMatch | null;
  queryTokens: string[];
}): boolean {
  if (!args.match) return false;
  const genericSymbolHits = args.match.matchedSymbols.filter((symbol) =>
    GENERIC_CONGRUENCE_TOKENS.has(normalizeKey(symbol)),
  );
  const nonGenericSymbolHits = args.match.matchedSymbols.filter(
    (symbol) => !GENERIC_CONGRUENCE_TOKENS.has(normalizeKey(symbol)),
  );
  const text = normalize(badgeResolutionText(args.badge));
  const specificTokenHits = args.queryTokens.filter(
    (token) =>
      !GENERIC_CONGRUENCE_TOKENS.has(normalizeKey(token)) &&
      normalizeKey(token).length >= 3 &&
      text.includes(normalize(token)),
  );

  return genericSymbolHits.length > 0 && nonGenericSymbolHits.length === 0 && specificTokenHits.length === 0;
}

function classifyBadgeResolutionRole(args: {
  badge: TheoryBadgeV1;
  match: TheoryBadgeLookupMatch | null;
  queryTokens: string[];
  connectedBadgeIds: Set<string>;
}): TheoryContextReflectionResolutionRole {
  if (hasClaimBoundaryShape(args.badge)) return "claim_boundary";
  if (args.match && hasSpecificDirectEvidence({ badge: args.badge, match: args.match, queryTokens: args.queryTokens })) {
    return "prompt_center";
  }
  if (hasFirstPrinciplesShape(args.badge)) return "first_principles_path";
  if (hasObservableShape(args.badge) && args.connectedBadgeIds.has(args.badge.id)) return "observable_path";
  if (args.connectedBadgeIds.has(args.badge.id)) return "consequence_context";
  if (isAnalogyLikeMatch({ badge: args.badge, match: args.match, queryTokens: args.queryTokens })) return "analogy_context";
  if (args.match && args.match.score >= STRONG_MATCH_SCORE) return "analogy_context";
  return "ambient_context";
}

function buildResolution(args: {
  graph: TheoryBadgeGraphV1;
  matches: TheoryBadgeLookupMatch[];
  highlightedBadgeIds: string[];
  connectedBadgeIds: string[];
  query: string;
  mode: TheoryContextReflectionResolutionMode;
}): TheoryContextReflectionResolutionV1 {
  const badges = badgeById(args.graph);
  const matchesByBadgeId = new Map(args.matches.map((match) => [match.badgeId, match]));
  const queryTokens = tokenizeResolutionQuery(args.query);
  const connectedBadgeIds = new Set(args.connectedBadgeIds);
  const roleByBadgeId: Record<string, TheoryContextReflectionResolutionRole> = {};
  const rankedBadgeIdsByRole = roleRecord();

  for (const badgeId of unique([...args.highlightedBadgeIds, ...args.matches.map((match) => match.badgeId)])) {
    const badge = badges.get(badgeId);
    if (!badge) continue;
    const role = classifyBadgeResolutionRole({
      badge,
      match: matchesByBadgeId.get(badgeId) ?? null,
      queryTokens,
      connectedBadgeIds,
    });
    roleByBadgeId[badgeId] = role;
    rankedBadgeIdsByRole[role].push(badgeId);
  }

  return {
    mode: args.mode,
    roleByBadgeId,
    rankedBadgeIdsByRole,
    explanationDepthHint: explanationDepthHint(args.mode),
  };
}

function badgeTitleMap(graph: TheoryBadgeGraphV1): Map<string, string> {
  return new Map(graph.badges.map((badge) => [badge.id, badge.title]));
}

function firstSentence(value: string): string {
  return value.split(/[.!?]\s+/)[0]?.trim() || value.trim();
}

function scientificMethodHypotheses(args: {
  badges: Map<string, TheoryBadgeV1>;
  roleByBadgeId: Record<string, TheoryContextReflectionResolutionRole>;
  rankedBadgeIdsByRole: Record<TheoryContextReflectionResolutionRole, string[]>;
}): TheoryContextScientificMethodReflectionV1["hypothesisCandidates"] {
  const promptCenter = args.rankedBadgeIdsByRole.prompt_center.slice(0, 5);
  const theoryExtension = unique([
    ...args.rankedBadgeIdsByRole.first_principles_path,
    ...args.rankedBadgeIdsByRole.observable_path,
    ...args.rankedBadgeIdsByRole.consequence_context,
  ]).slice(0, 5);
  const analogies = args.rankedBadgeIdsByRole.analogy_context.slice(0, 3);
  const candidates = [
    ...promptCenter.map((badgeId) => ({ badgeId, role: "prompt_center" as const })),
    ...theoryExtension.map((badgeId) => ({ badgeId, role: "theory_extension" as const })),
    ...analogies.map((badgeId) => ({ badgeId, role: "analogy_context" as const })),
  ];

  return candidates.map(({ badgeId, role }) => {
    const badge = args.badges.get(badgeId);
    const boundaryLike = badge ? hasClaimBoundaryShape(badge) : args.roleByBadgeId[badgeId] === "claim_boundary";
    return {
      hypothesisId: `hypothesis:${sanitizeId(badgeId)}`,
      badgeIds: [badgeId],
      summary: badge
        ? firstSentence(badge.plainMeaning)
        : `Candidate context for ${badgeId}.`,
      status: boundaryLike ? "blocked_by_boundary" : role === "analogy_context" ? "needs_evidence" : "candidate",
      role,
    };
  });
}

function scientificObservableRequirements(args: {
  badges: Map<string, TheoryBadgeV1>;
  selectedBadgeIds: string[];
}): TheoryContextScientificMethodReflectionV1["observableRequirements"] {
  return args.selectedBadgeIds.slice(0, 10).map((badgeId) => {
    const badge = args.badges.get(badgeId);
    const observable = badge && hasObservableShape(badge)
      ? `Admit calibrated observable evidence for ${badge.title}.`
      : `Name the observable, receipt, table, or literature evidence needed for ${badge?.title ?? badgeId}.`;
    const proxyOnly = Boolean(badge?.calculatorPayloads.length);
    return {
      requirementId: `observable:${sanitizeId(badgeId)}`,
      badgeIds: [badgeId],
      requiredObservable: observable,
      whyNeeded: "Scientific-method reflection requires an observable or explicit missing-evidence boundary before synthesis.",
      status: badge && hasObservableShape(badge)
        ? "available_in_graph"
        : proxyOnly
          ? "proxy_only"
          : "missing_evidence",
    };
  });
}

function scientificCalculatorProxies(args: {
  badges: Map<string, TheoryBadgeV1>;
  matches: TheoryBadgeLookupMatch[];
}): TheoryContextScientificMethodReflectionV1["calculatorProxyCandidates"] {
  return args.matches
    .filter((match) => match.calculatorPayloadIds.length > 0)
    .slice(0, 8)
    .map((match) => {
      const badge = args.badges.get(match.badgeId);
      return {
        badgeId: match.badgeId,
        payloadIds: match.calculatorPayloadIds,
        proxyBoundary: badge?.claimBoundary.diagnosticOnly
          ? "Calculator payload is diagnostic evidence only and does not solve or validate the claim."
          : "Calculator payload requires route/product authority before use.",
      };
    });
}

function scientificFalsificationChecks(args: {
  badges: Map<string, TheoryBadgeV1>;
  selectedBadgeIds: string[];
  claimBoundaries: string[];
}): TheoryContextScientificMethodReflectionV1["falsificationChecks"] {
  const checks = args.selectedBadgeIds.slice(0, 8).map((badgeId) => {
    const badge = args.badges.get(badgeId);
    const missingEvidence = badge && hasObservableShape(badge)
      ? ["calibration", "uncertainty budget", "independent observable check"]
      : ["admitted observable evidence", "model validity range", "claim-boundary review"];
    return {
      checkId: `falsifier:${sanitizeId(badgeId)}`,
      badgeIds: [badgeId],
      check: `Ask what observation would contradict or downgrade ${badge?.title ?? badgeId}.`,
      missingEvidence,
    };
  });

  if (args.claimBoundaries.length > 0) {
    checks.push({
      checkId: "falsifier:claim_boundary_overpromotion",
      badgeIds: [],
      check: "Reject any terminal draft that promotes diagnostic/proxy evidence into proof.",
      missingEvidence: ["terminal authority proof packet", "route-product contract", "accepted evidence refs"],
    });
  }

  return checks;
}

function buildScientificMethodReflection(args: {
  graph: TheoryBadgeGraphV1;
  reflectionId: string;
  generatedAt?: string;
  prompt: string;
  inferredDomains: Array<{ title: string }>;
  resolution: TheoryContextReflectionResolutionV1;
  locatedMatches: TheoryBadgeLookupMatch[];
  traceTargetIds: string[];
  claimBoundaries: string[];
}): TheoryContextScientificMethodReflectionV1 {
  const badges = badgeById(args.graph);
  const selectedBadgeIds = unique([
    ...args.resolution.rankedBadgeIdsByRole.prompt_center,
    ...args.resolution.rankedBadgeIdsByRole.first_principles_path,
    ...args.resolution.rankedBadgeIdsByRole.observable_path,
    ...args.resolution.rankedBadgeIdsByRole.claim_boundary,
    ...args.traceTargetIds,
  ]).slice(0, 16);
  const titles = badgeTitleMap(args.graph);
  const firstPrinciplesAnchors = unique([
    ...args.resolution.rankedBadgeIdsByRole.first_principles_path,
    ...selectedBadgeIds.filter((badgeId) => {
      const badge = badges.get(badgeId);
      return Boolean(badge && (badge.level === "first_principle" || badge.level === "law"));
    }),
  ]).slice(0, 8);
  const theoryExtensionPath = unique([
    ...firstPrinciplesAnchors,
    ...args.resolution.rankedBadgeIdsByRole.prompt_center,
    ...args.resolution.rankedBadgeIdsByRole.observable_path,
    ...args.resolution.rankedBadgeIdsByRole.consequence_context,
  ]).slice(0, 16);
  const calculatorProxyCandidates = scientificCalculatorProxies({
    badges,
    matches: args.locatedMatches,
  });
  const claimBoundaryBadgeIds = args.resolution.rankedBadgeIdsByRole.claim_boundary;
  const claimBoundaries = unique([
    ...args.claimBoundaries,
    ...claimBoundaryBadgeIds.map((badgeId) => `${badgeId}: ${titles.get(badgeId) ?? "claim boundary"}`),
  ]).slice(0, 16);
  const proceduralNextSteps: TheoryContextScientificMethodReflectionV1["proceduralNextSteps"] = [
    {
      stepId: "step:inspect_badge_path",
      label: "Inspect the first-principles to observable badge path.",
      actionKind: "inspect_badge_path",
      badgeIds: theoryExtensionPath.slice(0, 8),
      solves: false,
    },
  ];

  if (calculatorProxyCandidates.length > 0) {
    proceduralNextSteps.push({
      stepId: "step:load_proxy_payloads",
      label: "Load scalar proxy payloads only as diagnostic calculator context.",
      actionKind: "load_proxy",
      badgeIds: calculatorProxyCandidates.map((proxy) => proxy.badgeId).slice(0, 6),
      solves: false,
    });
  }
  if (claimBoundaries.length > 0) {
    proceduralNextSteps.push({
      stepId: "step:stop_at_claim_boundary",
      label: "Stop at the claim boundary unless new evidence satisfies the route contract.",
      actionKind: "stop_at_boundary",
      badgeIds: claimBoundaryBadgeIds.slice(0, 6),
      solves: false,
    });
  }

  return buildTheoryContextScientificMethodReflectionV1({
    generatedAt: args.generatedAt,
    graphId: args.graph.graphId,
    reflectionId: args.reflectionId,
    prompt: args.prompt,
    observationTarget: {
      promptCenterBadgeIds: args.resolution.rankedBadgeIdsByRole.prompt_center.slice(0, 8),
      targetDomainTitles: args.inferredDomains.map((domain) => domain.title).slice(0, 5),
      resolutionMode: args.resolution.mode,
    },
    hypothesisCandidates: scientificMethodHypotheses({
      badges,
      roleByBadgeId: args.resolution.roleByBadgeId,
      rankedBadgeIdsByRole: args.resolution.rankedBadgeIdsByRole,
    }),
    firstPrinciplesAnchors,
    theoryExtensionPath,
    observableRequirements: scientificObservableRequirements({
      badges,
      selectedBadgeIds,
    }),
    calculatorProxyCandidates,
    falsificationChecks: scientificFalsificationChecks({
      badges,
      selectedBadgeIds,
      claimBoundaries,
    }),
    uncertaintyBoundaries: unique([
      "Report uncertainty as evidence resolution, not as answer authority.",
      ...selectedBadgeIds
        .filter((badgeId) => /uncertainty|proxy|boundary|measurement/i.test(badgeId))
        .map((badgeId) => `${badgeId}: uncertainty/proxy boundary`),
    ]).slice(0, 12),
    claimBoundaries,
    proceduralNextSteps,
  });
}

function resolutionSortWeight(args: {
  badge: TheoryBadgeV1;
  match: TheoryBadgeLookupMatch;
  queryTokens: string[];
}): number {
  const hasSpecificEvidence = hasSpecificDirectEvidence({
    badge: args.badge,
    match: args.match,
    queryTokens: args.queryTokens,
  });
  const atlasOnlyWeight = args.match.reasons.some((reason) => /direct atlas primary badge|inside selected atlas lens/i.test(reason)) &&
    !hasSpecificEvidence
    ? -500
    : 0;
  const roleWeight = hasClaimBoundaryShape(args.badge) && hasSpecificEvidence
    ? 9000
    : hasSpecificEvidence
      ? 10000
      : hasObservableShape(args.badge)
        ? 1000
        : 0;
  const analogyWeight = isAnalogyLikeMatch({ badge: args.badge, match: args.match, queryTokens: args.queryTokens }) ? -250 : 0;

  return roleWeight + atlasOnlyWeight + analogyWeight + args.match.score;
}

function prioritizeResolutionAwareMatches(args: {
  graph: TheoryBadgeGraphV1;
  query: string;
  matches: TheoryBadgeLookupMatch[];
}): TheoryBadgeLookupMatch[] {
  const badges = badgeById(args.graph);
  const queryTokens = tokenizeResolutionQuery(args.query);
  return [...args.matches].sort((left, right) => {
    const leftBadge = badges.get(left.badgeId);
    const rightBadge = badges.get(right.badgeId);
    const leftWeight = leftBadge
      ? resolutionSortWeight({ badge: leftBadge, match: left, queryTokens })
      : left.score;
    const rightWeight = rightBadge
      ? resolutionSortWeight({ badge: rightBadge, match: right, queryTokens })
      : right.score;
    return rightWeight - leftWeight || right.score - left.score || left.badgeId.localeCompare(right.badgeId);
  });
}

export function buildTheoryContextReflection(
  args: BuildTheoryContextReflectionInput,
): TheoryContextReflectionV1 {
  const confidenceMode = args.confidenceMode ?? "soft_locator";
  const resolutionMode = args.resolutionMode ?? "path";
  const source = args.source ?? "helix_ask";
  const limit = Math.max(1, Math.min(24, args.limit ?? 12));
  const atlas = buildHelixPhysicsAtlasV1({ graph: args.graph });
  const query = queryText(args);
  const mentionedEquations = args.mentionedEquations ?? [];
  const mentionedSymbols = args.mentionedSymbols ?? [];
  const mentionedDomains = args.mentionedDomains ?? [];
  const bridgePrompt = isTheoryIdeologyBridgePrompt(query);
  const atlasBlockIds = inferAtlasBlockIds({
    atlasBlocks: atlas.blocks,
    mentionedDomains,
    query,
  });
  const equationFamilies = inferEquationFamilies(args.graph, query, mentionedEquations);
  const simulationOwners = inferSimulationOwners(args.graph, query, mentionedDomains);
  const lookupLimit = Math.max(limit, 40);
  const bridgeFocusGroups = bridgePrompt ? requestedBridgeFocusGroups(query) : [];

  const mergedLookupMatches = mergeTheoryLookupMatches([
    ...locateTheoryBadges({
      graph: args.graph,
      input: {
        query,
        symbols: mentionedSymbols,
        subjects: mentionedDomains,
        equationFamilies,
        simulationOwners,
        limit: lookupLimit,
      },
    }),
    ...locateTheoryBadges({
      graph: args.graph,
      input: {
        query,
        symbols: mentionedSymbols,
        subjects: mentionedDomains,
        equationFamilies,
        simulationOwners,
        atlasBlockIds,
        limit: lookupLimit,
      },
    }),
    ...bridgeFocusGroups.flatMap((group) =>
      locateTheoryBadges({
        graph: args.graph,
        input: {
          query: group.lookupQuery,
          limit: 8,
        },
      }),
    ),
  ]);
  const bridgeRankedMatches = prioritizeTheoryIdeologyBridgeMatches({
    query,
    matches: mergedLookupMatches,
  });
  const sortedLookupMatches = bridgePrompt
    ? bridgeRankedMatches
    : prioritizeResolutionAwareMatches({
        graph: args.graph,
        query,
        matches: bridgeRankedMatches,
      });
  const locatedMatches = sortedLookupMatches.slice(0, limit);

  const exactLookupMatches = locatedMatches.filter(isExactMatch);
  const likelyLookupMatches =
    confidenceMode === "strict_badge_match"
      ? locatedMatches.filter((match) => !isExactMatch(match) && match.score >= STRONG_MATCH_SCORE)
      : locatedMatches.filter((match) => !isExactMatch(match));
  const exactMatches = exactLookupMatches.map(toReflectionMatch);
  const likelyMatches = likelyLookupMatches.map(toReflectionMatch);
  const traceTargetIds = unique([...exactLookupMatches, ...likelyLookupMatches].slice(0, 8).map((match) => match.badgeId));
  const trace = traceTheoryBadgeConnections({ graph: args.graph, badgeIds: traceTargetIds });
  const connectedBadgeIds = trace.connectingBadgeIds;
  const highlightedBadgeIds = unique([...traceTargetIds, ...connectedBadgeIds]);
  const highlightedEdgeIds = unique(trace.pathSegments.flatMap((segment) => segment.edgeIds));
  const resolution = buildResolution({
    graph: args.graph,
    matches: locatedMatches,
    highlightedBadgeIds,
    connectedBadgeIds,
    query,
    mode: resolutionMode,
  });
  const maxScore = Math.max(1, ...locatedMatches.map((match) => match.score));
  const heatByBadgeId = Object.fromEntries(
    locatedMatches.map((match) => [match.badgeId, Math.min(1, Number((match.score / maxScore).toFixed(4)))]),
  );

  const inferredDomains = atlas.blocks
    .map((block) => {
      const blockScore = scoreAtlasBlock({ block, matches: locatedMatches, query, mentionedDomains });
      return {
        atlasBlockId: block.id,
        title: block.title,
        score: blockScore.score,
        reasons: blockScore.reasons,
      };
    })
    .filter((domain) => domain.score > 0)
    .sort((left, right) => right.score - left.score || left.atlasBlockId.localeCompare(right.atlasBlockId))
    .slice(0, 5);

  const exactBadgeIds = exactMatches.map((match) => match.badgeId);
  const likelyBadgeIds = likelyMatches.map((match) => match.badgeId);
  const centerBadgeIds = exactBadgeIds.length > 0 ? exactBadgeIds.slice(0, 3) : likelyBadgeIds.slice(0, 3);
  const softRegionBadgeIds = unique([...exactBadgeIds, ...likelyBadgeIds, ...connectedBadgeIds]);
  const biomeLayout = buildTheoryBiomeLayoutV1(args.graph);
  const biomeCoordinateByBadgeId = new Map(biomeLayout.coordinates.map((coordinate) => [coordinate.badgeId, coordinate]));
  const biomeFocusCoordinates = unique([...centerBadgeIds, ...exactBadgeIds, ...likelyBadgeIds, ...connectedBadgeIds])
    .map((badgeId) => biomeCoordinateByBadgeId.get(badgeId))
    .filter((coordinate): coordinate is NonNullable<typeof coordinate> => Boolean(coordinate));
  const probabilityTerrain = buildProbabilityTerrainV1({
    graphKind: "theory_badge_graph",
    candidates: locatedMatches.map((match) => {
      const coordinate = biomeCoordinateByBadgeId.get(match.badgeId);
      return {
        id: match.badgeId,
        weight: match.score,
        renderChunkId: coordinate?.renderChunkId ?? null,
        semanticChunkId: coordinate?.semanticChunkId ?? null,
      };
    }),
  });
  const uncertainty: TheoryContextReflectionUncertaintyV1 = {
    badgeProbabilityById: probabilityTerrain.candidateProbabilityById,
    renderChunkProbabilityById: probabilityTerrain.renderChunkProbabilityById,
    semanticChunkProbabilityById: probabilityTerrain.semanticChunkProbabilityById,
    priorEntropyBits: probabilityTerrain.priorEntropyBits,
    posteriorEntropyBits: probabilityTerrain.posteriorEntropyBits,
    informationGainBits: probabilityTerrain.informationGainBits,
    normalizedMass: probabilityTerrain.normalizedMass,
    uncertaintyMode: probabilityTerrain.uncertaintyMode,
  };
  const suggestedBiomeChunkIds = unique(
    biomeFocusCoordinates.map((coordinate) => coordinate.renderChunkId),
  ).slice(0, 8);
  const suggestedSemanticChunkIds = unique(
    biomeFocusCoordinates.map((coordinate) => coordinate.semanticChunkId),
  ).slice(0, 8);
  const suggestedScaleBands = unique(biomeFocusCoordinates.map((coordinate) => coordinate.scaleBand)).slice(
    0,
    8,
  ) as TheoryBiomeBand[];
  const allowSoftRegion =
    softRegionBadgeIds.length >= 2 &&
    (confidenceMode === "soft_locator" || exactLookupMatches.some(hasDirectMatchReason));
  const claimBoundaries = claimBoundaryNotes(locatedMatches, trace.claimBoundaryNotes);
  const calculatorPayloads = calculatorPayloadSummaries({
    graph: args.graph,
    matches: locatedMatches,
  });
  const reflectionId = args.reflectionId ?? `theory-context-reflection:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const scientificMethod = buildScientificMethodReflection({
    graph: args.graph,
    reflectionId,
    generatedAt: args.generatedAt,
    prompt: args.prompt,
    inferredDomains,
    resolution,
    locatedMatches,
    traceTargetIds,
    claimBoundaries,
  });

  // Resolve atlas lenses after scoring so future callers can compare the reflected
  // domain with the map lens; the receipt itself stays graph-location focused.
  for (const domain of inferredDomains.slice(0, 2)) {
    resolvePhysicsAtlasLens({
      graph: args.graph,
      atlas,
      blockId: domain.atlasBlockId as PhysicsAtlasBlockId,
    });
  }

  return buildTheoryContextReflectionV1({
    generatedAt: args.generatedAt,
    reflectionId,
    graphId: args.graph.graphId,
    input: {
      prompt: args.prompt,
      conversationContext: args.conversationContext ?? null,
      mentionedEquations,
      mentionedSymbols,
      mentionedDomains,
      source,
      confidenceMode,
    },
    exactMatches,
    likelyMatches,
    inferredDomains,
    overlay: {
      centerBadgeIds,
      highlightedBadgeIds,
      highlightedEdgeIds,
      heatByBadgeId,
      exactBadgeIds,
      likelyBadgeIds,
      suggestedBiomeChunkIds,
      suggestedSemanticChunkIds,
      suggestedScaleBands,
      uncertainty,
      softRegion: allowSoftRegion
        ? {
            id: `discussion-zone:${args.graph.graphId}:${centerBadgeIds[0] ?? softRegionBadgeIds[0]}`,
            label: "Current discussion zone",
            badgeIds: softRegionBadgeIds,
            confidence: Math.min(1, Number((softRegionBadgeIds.length / Math.max(2, limit)).toFixed(4))),
            tone: "green",
            meaning: "discussion_context_not_proof",
          }
        : null,
    },
    resolution,
    scientificMethod,
    evidenceForAsk: {
      summary: summaryText({
        domains: inferredDomains,
        exactMatches,
        likelyMatches,
        claimBoundaries,
      }),
      claimBoundaries,
      calculatorPayloads,
      recommendedNextActions: recommendedActions({
        graph: args.graph,
        selectedBadgeIds: traceTargetIds,
        matches: locatedMatches,
      }),
    },
  });
}
