export const CIVILIZATION_BOUNDS_ROADMAP_ARTIFACT_ID =
  "civilization_bounds_roadmap" as const;

export const CIVILIZATION_BOUNDS_ROADMAP_SCHEMA_VERSION =
  "civilization_bounds_roadmap/v1" as const;

export const CIVILIZATION_SCOPE_BOUNDARIES = [
  "earth",
  "region",
  "polity",
  "trade_bloc",
  "supply_chain",
  "research_program",
  "settlement",
  "planetary_colony",
  "fictional_world",
  "agent_arranged_world",
  "abstract_system",
] as const;

export const CIVILIZATION_CLAIM_TIERS = [
  "declared_scenario",
  "hypothetical",
  "historical_observation",
  "source_backed_observation",
  "model_projection",
  "diagnostic_bound",
] as const;

export const CIVILIZATION_LAYER_MODES = [
  "ideal_bounds",
  "observed_bounds",
  "historical_bounds",
  "projected_bounds",
  "gap_bounds",
] as const;

export const CIVILIZATION_RELATION_KINDS = [
  "supplies",
  "depends_on",
  "constrains",
  "absorbs",
  "observes",
  "maintains",
  "governs",
  "reviews",
  "risks",
  "blocks",
  "collaborates_with",
  "requires_interface",
] as const;

export const CIVILIZATION_BADGE_KINDS = [
  "system_actor",
  "capability",
  "resource",
  "constraint",
  "dependency",
  "risk",
  "governance_interface",
  "observation_gap",
  "collaboration_bound",
  "theory_binding",
  "moral_binding",
] as const;

export const CIVILIZATION_PARAMETER_SCOPE_KINDS = [
  "material_base",
  "governance_institutional_capacity",
  "security_conflict_exposure",
  "social_cohesion_demographic_pressure",
  "information_ideology_legitimacy",
  "environment_entropy_pressure",
] as const;

export const CIVILIZATION_ACTION_CHANNEL_KINDS = [
  "economic",
  "coercive",
  "persuasive",
  "diplomatic",
  "governance_review",
  "infrastructure_buildout",
  "observation",
] as const;

export const CIVILIZATION_COMPARISON_SOURCE_CLASSES = [
  "historical_case",
  "current_snapshot",
  "future_scenario",
  "fictional_construct",
  "declared_scenario",
] as const;

export const CIVILIZATION_HYPOTHESIS_STRENGTHS = [
  "weak",
  "bounded",
  "strong",
] as const;

export type CivilizationScopeBoundaryV1 =
  (typeof CIVILIZATION_SCOPE_BOUNDARIES)[number];
export type CivilizationClaimTierV1 =
  (typeof CIVILIZATION_CLAIM_TIERS)[number];
export type CivilizationLayerModeV1 =
  (typeof CIVILIZATION_LAYER_MODES)[number];
export type CivilizationRelationKindV1 =
  (typeof CIVILIZATION_RELATION_KINDS)[number];
export type CivilizationBoundsBadgeKindV1 =
  (typeof CIVILIZATION_BADGE_KINDS)[number];
export type CivilizationParameterScopeKindV1 =
  (typeof CIVILIZATION_PARAMETER_SCOPE_KINDS)[number];
export type CivilizationActionChannelKindV1 =
  (typeof CIVILIZATION_ACTION_CHANNEL_KINDS)[number];
export type CivilizationComparisonSourceClassV1 =
  (typeof CIVILIZATION_COMPARISON_SOURCE_CLASSES)[number];
export type CivilizationHypothesisStrengthV1 =
  (typeof CIVILIZATION_HYPOTHESIS_STRENGTHS)[number];

export type CivilizationQuantityV1 = {
  value?: number | null;
  unit?: string | null;
  label: string;
  description?: string | null;
  confidence?: number;
  evidenceRefs: string[];
};

export type CivilizationSystemV1 = {
  systemId: string;
  label: string;
  scopeBoundary: CivilizationScopeBoundaryV1;
  timeHorizon: {
    mode: "relative_years" | "absolute_dates" | "historical_periods";
    start: number | string;
    end: number | string;
  };
  populationOrAgents?: {
    count?: number | null;
    description?: string | null;
    agentClasses?: string[];
  };
  energyBudget?: CivilizationQuantityV1;
  materialInventory?: CivilizationQuantityV1[];
  manufacturingResolution?: {
    label: string;
    minimumFeatureScale?: CivilizationQuantityV1;
    throughput?: CivilizationQuantityV1;
    evidenceRefs: string[];
  };
  thermalLimits?: CivilizationQuantityV1[];
  computeAndSignalLimits?: CivilizationQuantityV1[];
  transportLatency?: CivilizationQuantityV1[];
  observabilityCoverage?: {
    coverageLabel: string;
    coverageScore?: number;
    blindSpots: string[];
    evidenceRefs: string[];
  };
  wasteAndEntropySinks?: Array<{
    sinkId: string;
    label: string;
    capacity?: CivilizationQuantityV1;
    saturationRisk?: number;
    evidenceRefs: string[];
  }>;
  governanceProcess?: {
    processId: string;
    label: string;
    decisionRule?: string;
    reviewCadence?: string;
    evidenceRefs: string[];
  };
  consentAndReviewInterfaces?: Array<{
    interfaceId: string;
    label: string;
    interfaceKind:
      | "public_review"
      | "technical_review"
      | "legal_review"
      | "ethics_review"
      | "operator_confirmation"
      | "affected_party_consent"
      | "unknown";
    coverageScore?: number;
    missingChecks: string[];
    evidenceRefs: string[];
  }>;
  capabilities: string[];
  dependencies: string[];
  risks: string[];
  evidenceRefs: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationPhaseV1 = {
  phaseId: string;
  label: string;
  start: number | string;
  end: number | string;
  summary?: string;
  claimTier: CivilizationClaimTierV1;
  evidenceRefs: string[];
};

export type CivilizationBoundsBadgeV1 = {
  badgeId: string;
  label: string;
  kind: CivilizationBoundsBadgeKindV1;
  systemId?: string;
  phaseId?: string;
  coordinates?: {
    lat: number;
    lon: number;
  } | null;
  abstractPosition?: {
    x: number;
    y: number;
    z?: number;
  } | null;
  layerMode: CivilizationLayerModeV1;
  weight?: number;
  confidence: number;
  theoryBadgeIds?: string[];
  moralNodeIds?: string[];
  missingEvidence?: string[];
  evidenceRefs: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationBoundsEdgeV1 = {
  edgeId: string;
  fromBadgeId: string;
  toBadgeId: string;
  relation: CivilizationRelationKindV1;
  weight?: number;
  confidence: number;
  evidenceRefs: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationCollaborationBoundV1 = {
  boundId: string;
  fromSystemId: string;
  toSystemId: string;
  physicalCapacityMargin: number;
  materialAvailability: number;
  energyMargin: number;
  interfaceCompatibility: number;
  evidenceQuality: number;
  proceduralAdmissibility: number;
  reversibilityMargin: number;
  collaborationValue: number;
  limitingFactor: string;
  missingEvidence: string[];
  evidenceRefs: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationBoundsFalsificationHookV1 = {
  hookId: string;
  claimId: string;
  metric: string;
  threshold: string;
  horizon: string;
  revisionTrigger: string;
  evidenceRefs: string[];
};

export type CivilizationParameterScopeV1 = {
  scopeId: string;
  kind: CivilizationParameterScopeKindV1;
  label: string;
  description: string;
  indicatorRefs: string[];
  missingEvidence: string[];
  evidenceRefs: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationActionChannelV1 = {
  channelId: string;
  kind: CivilizationActionChannelKindV1;
  label: string;
  sporeAnalogy: string;
  realWorldInterpretation: string;
  admissibleUses: string[];
  blockedUses: string[];
  evidenceRefs: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationDependencyChainV1 = {
  chainId: string;
  label: string;
  nodeBadgeIds: string[];
  edgeIds: string[];
  bottlenecks: string[];
  missingEvidence: string[];
  evidenceRefs: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationComparisonCaseV1 = {
  caseId: string;
  label: string;
  sourceClass: CivilizationComparisonSourceClassV1;
  similarityAxes: string[];
  blockers: string[];
  evidenceRefs: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationHypothesisClaimV1 = {
  claimId: string;
  claim: string;
  strength: CivilizationHypothesisStrengthV1;
  blockers: string[];
  evidenceRefs: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationProceduralScaffoldV1 = {
  scaffoldId: "spore_civilization_stage_procedural_scaffold";
  source: "spore_civilization_stage_research";
  designMetaphor: string;
  surfaces: Array<{
    sporeSurface: string;
    proceduralMeaning: string;
    roadmapField: string;
  }>;
  blockedInterpretations: string[];
  researchRefs: string[];
  evidenceRefs: string[];
};

export type CivilizationBoundsBridgeContextV1 = {
  theoryBadgeIds: string[];
  moralNodeIds: string[];
  systemIds: string[];
  constraints: string[];
  missingEvidence: string[];
  evidenceRefs: string[];
};

export type CivilizationBoundsRoadmapAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  agent_executable: false;
  prediction_finality: false;
  policy_finality: false;
  moral_finality: false;
  execution_permission: false;
};

export type CivilizationBoundsRoadmapV1 = {
  artifactId: typeof CIVILIZATION_BOUNDS_ROADMAP_ARTIFACT_ID;
  schemaVersion: typeof CIVILIZATION_BOUNDS_ROADMAP_SCHEMA_VERSION;
  generatedAt: string;
  roadmapId: string;
  title: string;
  scenarioId: string;
  activeLayerModes: CivilizationLayerModeV1[];
  phases: CivilizationPhaseV1[];
  systems: CivilizationSystemV1[];
  badges: CivilizationBoundsBadgeV1[];
  edges: CivilizationBoundsEdgeV1[];
  collaborationBounds: CivilizationCollaborationBoundV1[];
  falsificationHooks: CivilizationBoundsFalsificationHookV1[];
  parameterScopes: CivilizationParameterScopeV1[];
  actionChannels: CivilizationActionChannelV1[];
  dependencyChains: CivilizationDependencyChainV1[];
  comparisonCases: CivilizationComparisonCaseV1[];
  hypothesisClaims: CivilizationHypothesisClaimV1[];
  proceduralScaffold: CivilizationProceduralScaffoldV1;
  theoryBindings: Array<{
    badgeId: string;
    theoryBadgeIds: string[];
    relation: "supports" | "constrains" | "requires" | "bounds" | "analogy_only";
    evidenceRefs: string[];
  }>;
  moralBindings: Array<{
    badgeId: string;
    moralNodeIds: string[];
    proceduralEffect: string;
    refusesAuthority: string[];
    evidenceRefs: string[];
  }>;
  missingEvidence: string[];
  authority: CivilizationBoundsRoadmapAuthorityV1;
};

export type BuildCivilizationBoundsRoadmapInput = Omit<
  CivilizationBoundsRoadmapV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "roadmapId"
  | "authority"
  | "parameterScopes"
  | "actionChannels"
  | "dependencyChains"
  | "comparisonCases"
  | "hypothesisClaims"
  | "proceduralScaffold"
> & {
  generatedAt?: string;
  roadmapId?: string;
  parameterScopes?: CivilizationParameterScopeV1[];
  actionChannels?: CivilizationActionChannelV1[];
  dependencyChains?: CivilizationDependencyChainV1[];
  comparisonCases?: CivilizationComparisonCaseV1[];
  hypothesisClaims?: CivilizationHypothesisClaimV1[];
  proceduralScaffold?: CivilizationProceduralScaffoldV1;
};

export type BuildCivilizationCollaborationBoundInput = Omit<
  CivilizationCollaborationBoundV1,
  "collaborationValue" | "limitingFactor"
> & {
  limitingFactor?: string;
};

const AUTHORITY: CivilizationBoundsRoadmapAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  agent_executable: false,
  prediction_finality: false,
  policy_finality: false,
  moral_finality: false,
  execution_permission: false,
};

const FORBIDDEN_CIVILIZATION_BOUNDS_PATTERNS = [
  /\bmorally certain\b/i,
  /\bphysics proves morality\b/i,
  /\bapproved civilization\b/i,
  /\bexecution permission\b/i,
  /\bpolicy finality\b/i,
  /\bprediction guaranteed\b/i,
  /\bterminal authority\b/i,
] as const;

const DEFAULT_PROCEDURAL_SCAFFOLD: CivilizationProceduralScaffoldV1 = {
  scaffoldId: "spore_civilization_stage_procedural_scaffold",
  source: "spore_civilization_stage_research",
  designMetaphor:
    "Spore Civilization Stage is used only as procedural grammar for nodes, resources, action channels, dependencies, and maturity gates.",
  surfaces: [
    {
      sporeSurface: "city",
      proceduralMeaning: "concentrated capability node",
      roadmapField: "systems,badges",
    },
    {
      sporeSurface: "spice geyser",
      proceduralMeaning: "resource anchor",
      roadmapField: "parameterScopes,badges",
    },
    {
      sporeSurface: "vehicle",
      proceduralMeaning: "mobility or projection capacity",
      roadmapField: "actionChannels,capabilities",
    },
    {
      sporeSurface: "trade route",
      proceduralMeaning: "dependency and integration edge",
      roadmapField: "edges,dependencyChains",
    },
    {
      sporeSurface: "economic, military, religious takeover",
      proceduralMeaning: "bounded action channels",
      roadmapField: "actionChannels,hypothesisClaims",
    },
    {
      sporeSurface: "stage completion",
      proceduralMeaning: "maturity transition into a larger operating environment",
      roadmapField: "phases,comparisonCases",
    },
  ],
  blockedInterpretations: [
    "Spore mechanics are not a history model.",
    "Spore pathways do not certify real-world predictions.",
    "Procedural comparison does not authorize policy, coercion, or moral finality.",
  ],
  researchRefs: [
    "docs/audits/research/civilization-bounds-spore-procedural-systems-2026-06-17.md",
  ],
  evidenceRefs: [
    "research:civilization-bounds-spore-procedural-systems-2026-06-17",
  ],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(
  items: T,
  value: unknown,
): value is T[number] => typeof value === "string" && items.includes(value);

function newRoadmapId(): string {
  return `civilization-bounds:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function clampCivilizationFactor(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function roundFactor(value: number): number {
  return Math.round(clampCivilizationFactor(value) * 10000) / 10000;
}

export function computeCivilizationCollaborationValueV1(input: {
  physicalCapacityMargin: number;
  materialAvailability: number;
  energyMargin: number;
  interfaceCompatibility: number;
  evidenceQuality: number;
  proceduralAdmissibility: number;
  reversibilityMargin: number;
}): number {
  const physical = clampCivilizationFactor(input.physicalCapacityMargin);
  const material = clampCivilizationFactor(input.materialAvailability);
  const energy = clampCivilizationFactor(input.energyMargin);
  const interfaceCompatibility = clampCivilizationFactor(input.interfaceCompatibility);
  const evidenceQuality = clampCivilizationFactor(input.evidenceQuality);
  const proceduralAdmissibility = clampCivilizationFactor(input.proceduralAdmissibility);
  const reversibilityMargin = clampCivilizationFactor(input.reversibilityMargin);
  return roundFactor(
    Math.min(physical, material, energy) *
      interfaceCompatibility *
      evidenceQuality *
      proceduralAdmissibility *
      reversibilityMargin,
  );
}

export function buildCivilizationCollaborationBoundV1(
  input: BuildCivilizationCollaborationBoundInput,
): CivilizationCollaborationBoundV1 {
  const factors = {
    physicalCapacityMargin: roundFactor(input.physicalCapacityMargin),
    materialAvailability: roundFactor(input.materialAvailability),
    energyMargin: roundFactor(input.energyMargin),
    interfaceCompatibility: roundFactor(input.interfaceCompatibility),
    evidenceQuality: roundFactor(input.evidenceQuality),
    proceduralAdmissibility: roundFactor(input.proceduralAdmissibility),
    reversibilityMargin: roundFactor(input.reversibilityMargin),
  };
  const entries = Object.entries(factors);
  const limitingFactor =
    input.limitingFactor ??
    entries.reduce((lowest, entry) => (entry[1] < lowest[1] ? entry : lowest))[0];
  return {
    ...input,
    ...factors,
    collaborationValue: computeCivilizationCollaborationValueV1(factors),
    limitingFactor,
  };
}

export function buildCivilizationBoundsRoadmapV1(
  input: BuildCivilizationBoundsRoadmapInput,
): CivilizationBoundsRoadmapV1 {
  return {
    artifactId: CIVILIZATION_BOUNDS_ROADMAP_ARTIFACT_ID,
    schemaVersion: CIVILIZATION_BOUNDS_ROADMAP_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    roadmapId: input.roadmapId ?? newRoadmapId(),
    title: input.title,
    scenarioId: input.scenarioId,
    activeLayerModes: input.activeLayerModes,
    phases: input.phases,
    systems: input.systems,
    badges: input.badges,
    edges: input.edges,
    collaborationBounds: input.collaborationBounds,
    falsificationHooks: input.falsificationHooks,
    parameterScopes: input.parameterScopes ?? [],
    actionChannels: input.actionChannels ?? [],
    dependencyChains: input.dependencyChains ?? [],
    comparisonCases: input.comparisonCases ?? [],
    hypothesisClaims: input.hypothesisClaims ?? [],
    proceduralScaffold: input.proceduralScaffold ?? DEFAULT_PROCEDURAL_SCAFFOLD,
    theoryBindings: input.theoryBindings,
    moralBindings: input.moralBindings,
    missingEvidence: input.missingEvidence,
    authority: { ...AUTHORITY },
  };
}

function validateStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (!isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateScore(prefix: string, value: unknown, issues: string[]): void {
  if (!isFiniteNumber(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateQuantity(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.label)) issues.push(`${prefix}.label must be a non-empty string`);
  if (value.value !== undefined && value.value !== null && !isFiniteNumber(value.value)) {
    issues.push(`${prefix}.value must be a finite number, null, or absent`);
  }
  if (value.unit !== undefined && value.unit !== null && typeof value.unit !== "string") {
    issues.push(`${prefix}.unit must be a string, null, or absent`);
  }
  if (value.confidence !== undefined) validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
}

function validatePhase(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["phaseId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (typeof value.start !== "number" && !isNonEmptyString(value.start)) {
    issues.push(`${prefix}.start must be a number or non-empty string`);
  }
  if (typeof value.end !== "number" && !isNonEmptyString(value.end)) {
    issues.push(`${prefix}.end must be a number or non-empty string`);
  }
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
}

function validateSystem(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["systemId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_SCOPE_BOUNDARIES, value.scopeBoundary)) {
    issues.push(`${prefix}.scopeBoundary is invalid`);
  }
  const timeHorizon = isRecord(value.timeHorizon) ? value.timeHorizon : null;
  if (!timeHorizon) {
    issues.push(`${prefix}.timeHorizon must be an object`);
  } else if (!["relative_years", "absolute_dates", "historical_periods"].includes(String(timeHorizon.mode))) {
    issues.push(`${prefix}.timeHorizon.mode is invalid`);
  }
  if (value.energyBudget !== undefined) validateQuantity(`${prefix}.energyBudget`, value.energyBudget, issues);
  if (value.materialInventory !== undefined) {
    if (!Array.isArray(value.materialInventory)) {
      issues.push(`${prefix}.materialInventory must be an array`);
    } else {
      value.materialInventory.forEach((entry, index) =>
        validateQuantity(`${prefix}.materialInventory[${index}]`, entry, issues),
      );
    }
  }
  validateStringArray(`${prefix}.capabilities`, value.capabilities, issues);
  validateStringArray(`${prefix}.dependencies`, value.dependencies, issues);
  validateStringArray(`${prefix}.risks`, value.risks, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
}

function validateBadge(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["badgeId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_BADGE_KINDS, value.kind)) issues.push(`${prefix}.kind is invalid`);
  if (!includes(CIVILIZATION_LAYER_MODES, value.layerMode)) {
    issues.push(`${prefix}.layerMode is invalid`);
  }
  if (value.weight !== undefined && !isFiniteNumber(value.weight)) {
    issues.push(`${prefix}.weight must be a finite number when present`);
  }
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  if (value.theoryBadgeIds !== undefined) validateStringArray(`${prefix}.theoryBadgeIds`, value.theoryBadgeIds, issues);
  if (value.moralNodeIds !== undefined) validateStringArray(`${prefix}.moralNodeIds`, value.moralNodeIds, issues);
  if (value.missingEvidence !== undefined) validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
}

function validateEdge(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["edgeId", "fromBadgeId", "toBadgeId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_RELATION_KINDS, value.relation)) {
    issues.push(`${prefix}.relation is invalid`);
  }
  if (value.weight !== undefined && !isFiniteNumber(value.weight)) {
    issues.push(`${prefix}.weight must be a finite number when present`);
  }
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
}

function validateCollaborationBound(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["boundId", "fromSystemId", "toSystemId", "limitingFactor"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  for (const field of [
    "physicalCapacityMargin",
    "materialAvailability",
    "energyMargin",
    "interfaceCompatibility",
    "evidenceQuality",
    "proceduralAdmissibility",
    "reversibilityMargin",
    "collaborationValue",
  ] as const) {
    validateScore(`${prefix}.${field}`, value[field], issues);
  }
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
}

function validateFalsificationHook(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["hookId", "claimId", "metric", "threshold", "horizon", "revisionTrigger"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
}

function validateParameterScope(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["scopeId", "label", "description"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_PARAMETER_SCOPE_KINDS, value.kind)) {
    issues.push(`${prefix}.kind is invalid`);
  }
  validateStringArray(`${prefix}.indicatorRefs`, value.indicatorRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
}

function validateActionChannel(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["channelId", "label", "sporeAnalogy", "realWorldInterpretation"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_ACTION_CHANNEL_KINDS, value.kind)) {
    issues.push(`${prefix}.kind is invalid`);
  }
  validateStringArray(`${prefix}.admissibleUses`, value.admissibleUses, issues);
  validateStringArray(`${prefix}.blockedUses`, value.blockedUses, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
}

function validateDependencyChain(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["chainId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateStringArray(`${prefix}.nodeBadgeIds`, value.nodeBadgeIds, issues);
  validateStringArray(`${prefix}.edgeIds`, value.edgeIds, issues);
  validateStringArray(`${prefix}.bottlenecks`, value.bottlenecks, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
}

function validateComparisonCase(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["caseId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_COMPARISON_SOURCE_CLASSES, value.sourceClass)) {
    issues.push(`${prefix}.sourceClass is invalid`);
  }
  validateStringArray(`${prefix}.similarityAxes`, value.similarityAxes, issues);
  validateStringArray(`${prefix}.blockers`, value.blockers, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
}

function validateHypothesisClaim(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["claimId", "claim"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_HYPOTHESIS_STRENGTHS, value.strength)) {
    issues.push(`${prefix}.strength is invalid`);
  }
  validateStringArray(`${prefix}.blockers`, value.blockers, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  if (!includes(CIVILIZATION_CLAIM_TIERS, value.claimTier)) {
    issues.push(`${prefix}.claimTier is invalid`);
  }
}

function validateProceduralScaffold(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("proceduralScaffold must be an object");
    return;
  }
  if (value.scaffoldId !== "spore_civilization_stage_procedural_scaffold") {
    issues.push("proceduralScaffold.scaffoldId is invalid");
  }
  if (value.source !== "spore_civilization_stage_research") {
    issues.push("proceduralScaffold.source is invalid");
  }
  if (!isNonEmptyString(value.designMetaphor)) {
    issues.push("proceduralScaffold.designMetaphor must be a non-empty string");
  }
  if (!Array.isArray(value.surfaces)) {
    issues.push("proceduralScaffold.surfaces must be an array");
  } else {
    value.surfaces.forEach((surface, index) => {
      const prefix = `proceduralScaffold.surfaces[${index}]`;
      if (!isRecord(surface)) {
        issues.push(`${prefix} must be an object`);
        return;
      }
      for (const field of ["sporeSurface", "proceduralMeaning", "roadmapField"] as const) {
        if (!isNonEmptyString(surface[field])) {
          issues.push(`${prefix}.${field} must be a non-empty string`);
        }
      }
    });
  }
  validateStringArray("proceduralScaffold.blockedInterpretations", value.blockedInterpretations, issues);
  validateStringArray("proceduralScaffold.researchRefs", value.researchRefs, issues);
  validateStringArray("proceduralScaffold.evidenceRefs", value.evidenceRefs, issues);
}

function validateAuthority(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("authority must be an object");
    return;
  }
  for (const field of [
    "assistant_answer",
    "raw_content_included",
    "terminal_eligible",
    "agent_executable",
    "prediction_finality",
    "policy_finality",
    "moral_finality",
    "execution_permission",
  ] as const) {
    if (value[field] !== false) issues.push(`authority.${field} must be false`);
  }
  if (value.context_role !== "tool_evidence") issues.push("authority.context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") {
    issues.push("authority.ask_context_policy must be evidence_only");
  }
}

export function validateCivilizationBoundsRoadmapV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["civilization bounds roadmap must be an object"];
  if (value.artifactId !== CIVILIZATION_BOUNDS_ROADMAP_ARTIFACT_ID) {
    issues.push(`artifactId must be ${CIVILIZATION_BOUNDS_ROADMAP_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== CIVILIZATION_BOUNDS_ROADMAP_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${CIVILIZATION_BOUNDS_ROADMAP_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "roadmapId", "title", "scenarioId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!Array.isArray(value.activeLayerModes)) {
    issues.push("activeLayerModes must be an array");
  } else {
    value.activeLayerModes.forEach((entry, index) => {
      if (!includes(CIVILIZATION_LAYER_MODES, entry)) {
        issues.push(`activeLayerModes[${index}] is invalid`);
      }
    });
  }
  if (!Array.isArray(value.phases)) {
    issues.push("phases must be an array");
  } else {
    value.phases.forEach((entry, index) => validatePhase(`phases[${index}]`, entry, issues));
  }
  if (!Array.isArray(value.systems)) {
    issues.push("systems must be an array");
  } else {
    value.systems.forEach((entry, index) => validateSystem(`systems[${index}]`, entry, issues));
  }
  if (!Array.isArray(value.badges)) {
    issues.push("badges must be an array");
  } else {
    value.badges.forEach((entry, index) => validateBadge(`badges[${index}]`, entry, issues));
  }
  if (!Array.isArray(value.edges)) {
    issues.push("edges must be an array");
  } else {
    value.edges.forEach((entry, index) => validateEdge(`edges[${index}]`, entry, issues));
  }
  if (!Array.isArray(value.collaborationBounds)) {
    issues.push("collaborationBounds must be an array");
  } else {
    value.collaborationBounds.forEach((entry, index) =>
      validateCollaborationBound(`collaborationBounds[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.falsificationHooks)) {
    issues.push("falsificationHooks must be an array");
  } else {
    value.falsificationHooks.forEach((entry, index) =>
      validateFalsificationHook(`falsificationHooks[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.parameterScopes)) {
    issues.push("parameterScopes must be an array");
  } else {
    value.parameterScopes.forEach((entry, index) =>
      validateParameterScope(`parameterScopes[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.actionChannels)) {
    issues.push("actionChannels must be an array");
  } else {
    value.actionChannels.forEach((entry, index) =>
      validateActionChannel(`actionChannels[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.dependencyChains)) {
    issues.push("dependencyChains must be an array");
  } else {
    value.dependencyChains.forEach((entry, index) =>
      validateDependencyChain(`dependencyChains[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.comparisonCases)) {
    issues.push("comparisonCases must be an array");
  } else {
    value.comparisonCases.forEach((entry, index) =>
      validateComparisonCase(`comparisonCases[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.hypothesisClaims)) {
    issues.push("hypothesisClaims must be an array");
  } else {
    value.hypothesisClaims.forEach((entry, index) =>
      validateHypothesisClaim(`hypothesisClaims[${index}]`, entry, issues),
    );
  }
  validateProceduralScaffold(value.proceduralScaffold, issues);
  if (!Array.isArray(value.theoryBindings)) {
    issues.push("theoryBindings must be an array");
  } else {
    value.theoryBindings.forEach((entry, index) => {
      const prefix = `theoryBindings[${index}]`;
      if (!isRecord(entry)) {
        issues.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(entry.badgeId)) issues.push(`${prefix}.badgeId must be a non-empty string`);
      validateStringArray(`${prefix}.theoryBadgeIds`, entry.theoryBadgeIds, issues);
      if (!["supports", "constrains", "requires", "bounds", "analogy_only"].includes(String(entry.relation))) {
        issues.push(`${prefix}.relation is invalid`);
      }
      validateStringArray(`${prefix}.evidenceRefs`, entry.evidenceRefs, issues);
    });
  }
  if (!Array.isArray(value.moralBindings)) {
    issues.push("moralBindings must be an array");
  } else {
    value.moralBindings.forEach((entry, index) => {
      const prefix = `moralBindings[${index}]`;
      if (!isRecord(entry)) {
        issues.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(entry.badgeId)) issues.push(`${prefix}.badgeId must be a non-empty string`);
      validateStringArray(`${prefix}.moralNodeIds`, entry.moralNodeIds, issues);
      if (!isNonEmptyString(entry.proceduralEffect)) {
        issues.push(`${prefix}.proceduralEffect must be a non-empty string`);
      }
      validateStringArray(`${prefix}.refusesAuthority`, entry.refusesAuthority, issues);
      validateStringArray(`${prefix}.evidenceRefs`, entry.evidenceRefs, issues);
    });
  }
  validateStringArray("missingEvidence", value.missingEvidence, issues);
  validateAuthority(value.authority, issues);

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_CIVILIZATION_BOUNDS_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden civilization bounds finality text matched: ${pattern.source}`);
  }
  return issues;
}

export function isCivilizationBoundsRoadmapV1(value: unknown): value is CivilizationBoundsRoadmapV1 {
  return validateCivilizationBoundsRoadmapV1(value).length === 0;
}
