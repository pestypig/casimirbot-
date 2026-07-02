export const CIVILIZATION_SCENARIO_FRAME_ARTIFACT_ID =
  "civilization_scenario_frame" as const;

export const CIVILIZATION_SCENARIO_FRAME_SCHEMA_VERSION =
  "civilization_scenario_frame/v1" as const;

export const CIVILIZATION_SCENARIO_FAMILIES = [
  "origin_and_metabolism",
  "agent_survival",
  "social_coordination",
  "settlement_and_city",
  "industrial_capacity",
  "planetary_trade",
  "resource_reconstruction",
  "exploration_and_colonization",
  "machine_or_digital_civilization",
  "ecological_civilization",
  "collapse_repair_and_resilience",
  "fictional_or_agent_arranged",
] as const;

export const CIVILIZATION_BOUNDARY_KINDS = [
  "organism",
  "household",
  "crew",
  "tribe",
  "city",
  "settlement",
  "institution",
  "firm",
  "supply_chain",
  "trade_bloc",
  "polity",
  "planetary_civilization",
  "interplanetary_civilization",
  "multi_species_ecology",
  "machine_society",
  "fictional_world",
  "abstract_agent_system",
] as const;

export const CIVILIZATION_DEVELOPMENTAL_STAGES = [
  "metabolic",
  "embodied_agent",
  "group_coordination",
  "settlement",
  "industrial_system",
  "planetary_coordination",
  "interstellar_or_extraplanetary",
  "post_scarcity_claim",
  "collapse_or_repair",
  "simulation_only",
] as const;

export const CIVILIZATION_SUBSTRATE_KINDS = [
  "biological",
  "human_social",
  "industrial_material",
  "digital_computational",
  "hybrid_bio_digital",
  "ecological",
  "planetary_infrastructure",
  "fictional_physics",
  "abstract",
] as const;

export const CIVILIZATION_AGENCY_MODELS = [
  "single_agent",
  "small_group",
  "hierarchical_institution",
  "market_network",
  "federated_polity",
  "swarm",
  "ecosystem",
  "machine_collective",
  "mixed_agency",
] as const;

export const CIVILIZATION_COORDINATION_MODES = [
  "kinship",
  "command",
  "market",
  "treaty",
  "protocol",
  "open_source",
  "federation",
  "competition",
  "coercion",
  "mutual_aid",
  "unknown",
] as const;

export const CIVILIZATION_CONSTRAINT_PROFILES = [
  "energy_limited",
  "material_limited",
  "manufacturing_limited",
  "thermal_limited",
  "compute_limited",
  "signal_latency_limited",
  "transport_limited",
  "observability_limited",
  "governance_limited",
  "consent_limited",
  "ecological_sink_limited",
  "security_limited",
  "multi_bottleneck",
] as const;

export const CIVILIZATION_SCENARIO_EVIDENCE_MODES = [
  "declared_scenario",
  "user_hypothesis",
  "fictional_construct",
  "historical_replay",
  "source_backed_observation",
  "current_observation",
  "model_projection",
  "stress_test",
  "counterfactual",
] as const;

export const CIVILIZATION_SCENARIO_EDITOR_KINDS = [
  "boundary",
  "agent",
  "capability",
  "resource",
  "constraint",
  "governance",
  "timeline",
  "map_position",
  "evidence",
  "moral_binding",
  "theory_binding",
] as const;

export type CivilizationScenarioFamilyV1 =
  (typeof CIVILIZATION_SCENARIO_FAMILIES)[number];
export type CivilizationBoundaryKindV1 =
  (typeof CIVILIZATION_BOUNDARY_KINDS)[number];
export type CivilizationDevelopmentalStageV1 =
  (typeof CIVILIZATION_DEVELOPMENTAL_STAGES)[number];
export type CivilizationSubstrateKindV1 =
  (typeof CIVILIZATION_SUBSTRATE_KINDS)[number];
export type CivilizationAgencyModelV1 =
  (typeof CIVILIZATION_AGENCY_MODELS)[number];
export type CivilizationCoordinationModeV1 =
  (typeof CIVILIZATION_COORDINATION_MODES)[number];
export type CivilizationConstraintProfileV1 =
  (typeof CIVILIZATION_CONSTRAINT_PROFILES)[number];
export type CivilizationScenarioEvidenceModeV1 =
  (typeof CIVILIZATION_SCENARIO_EVIDENCE_MODES)[number];
export type CivilizationScenarioEditorKindV1 =
  (typeof CIVILIZATION_SCENARIO_EDITOR_KINDS)[number];

export type CivilizationBoundedActorGrammarV1 = {
  actorUnit: string;
  resourceInputs: string[];
  capabilitySurfaces: string[];
  constraintInterfaces: string[];
  admissibleMoveKinds: string[];
  blockedMoveKinds: string[];
  evidenceRefs: string[];
};

export type CivilizationScenarioFrameAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  agent_executable: false;
  scenario_finality: false;
  prediction_finality: false;
  policy_finality: false;
  moral_finality: false;
  execution_permission: false;
};

export type CivilizationScenarioFrameV1 = {
  artifactId: typeof CIVILIZATION_SCENARIO_FRAME_ARTIFACT_ID;
  schemaVersion: typeof CIVILIZATION_SCENARIO_FRAME_SCHEMA_VERSION;
  generatedAt: string;
  frameId: string;
  title: string;
  family: CivilizationScenarioFamilyV1;
  boundaryKind: CivilizationBoundaryKindV1;
  developmentalStage: CivilizationDevelopmentalStageV1;
  substrateKind: CivilizationSubstrateKindV1;
  agencyModel: CivilizationAgencyModelV1;
  coordinationMode: CivilizationCoordinationModeV1;
  constraintProfiles: CivilizationConstraintProfileV1[];
  evidenceMode: CivilizationScenarioEvidenceModeV1;
  promptSummary: string;
  stageInheritance: {
    priorStage?: CivilizationDevelopmentalStageV1 | null;
    inheritedConditions: string[];
    changedControlVariables: string[];
  };
  boundedActorGrammar: CivilizationBoundedActorGrammarV1;
  proceduralBindings: {
    theoryBindingHints: string[];
    moralBindingHints: string[];
    bridgeHooks: string[];
  };
  suggestedEditors: CivilizationScenarioEditorKindV1[];
  defaultQuestions: string[];
  missingEvidence: string[];
  suggestedRoadmapInputs: {
    boundaryKind: CivilizationBoundaryKindV1;
    developmentalStage: CivilizationDevelopmentalStageV1;
    substrateKind: CivilizationSubstrateKindV1;
    agencyModel: CivilizationAgencyModelV1;
    coordinationMode: CivilizationCoordinationModeV1;
    constraintProfiles: CivilizationConstraintProfileV1[];
    evidenceMode: CivilizationScenarioEvidenceModeV1;
  };
  refs: string[];
  authority: CivilizationScenarioFrameAuthorityV1;
};

export type BuildCivilizationScenarioFrameInput = Omit<
  CivilizationScenarioFrameV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "frameId" | "suggestedRoadmapInputs" | "authority"
> & {
  generatedAt?: string;
  frameId?: string;
};

const AUTHORITY: CivilizationScenarioFrameAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  agent_executable: false,
  scenario_finality: false,
  prediction_finality: false,
  policy_finality: false,
  moral_finality: false,
  execution_permission: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const includes = <T extends readonly string[]>(
  items: T,
  value: unknown,
): value is T[number] => typeof value === "string" && items.includes(value);

function newFrameId(): string {
  return `civilization-frame:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function buildCivilizationScenarioFrameV1(
  input: BuildCivilizationScenarioFrameInput,
): CivilizationScenarioFrameV1 {
  return {
    artifactId: CIVILIZATION_SCENARIO_FRAME_ARTIFACT_ID,
    schemaVersion: CIVILIZATION_SCENARIO_FRAME_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    frameId: input.frameId ?? newFrameId(),
    title: input.title,
    family: input.family,
    boundaryKind: input.boundaryKind,
    developmentalStage: input.developmentalStage,
    substrateKind: input.substrateKind,
    agencyModel: input.agencyModel,
    coordinationMode: input.coordinationMode,
    constraintProfiles: input.constraintProfiles,
    evidenceMode: input.evidenceMode,
    promptSummary: input.promptSummary,
    stageInheritance: input.stageInheritance,
    boundedActorGrammar: input.boundedActorGrammar,
    proceduralBindings: input.proceduralBindings,
    suggestedEditors: input.suggestedEditors,
    defaultQuestions: input.defaultQuestions,
    missingEvidence: input.missingEvidence,
    suggestedRoadmapInputs: {
      boundaryKind: input.boundaryKind,
      developmentalStage: input.developmentalStage,
      substrateKind: input.substrateKind,
      agencyModel: input.agencyModel,
      coordinationMode: input.coordinationMode,
      constraintProfiles: input.constraintProfiles,
      evidenceMode: input.evidenceMode,
    },
    refs: input.refs,
    authority: { ...AUTHORITY },
  };
}

function validateStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (!isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateEnumArray<T extends readonly string[]>(
  prefix: string,
  value: unknown,
  allowed: T,
  issues: string[],
): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  value.forEach((entry, index) => {
    if (!includes(allowed, entry)) issues.push(`${prefix}[${index}] is invalid`);
  });
}

export function validateCivilizationScenarioFrameV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["frame must be an object"];

  if (value.artifactId !== CIVILIZATION_SCENARIO_FRAME_ARTIFACT_ID) {
    issues.push("artifactId is invalid");
  }
  if (value.schemaVersion !== CIVILIZATION_SCENARIO_FRAME_SCHEMA_VERSION) {
    issues.push("schemaVersion is invalid");
  }
  for (const field of ["generatedAt", "frameId", "title", "promptSummary"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_SCENARIO_FAMILIES, value.family)) issues.push("family is invalid");
  if (!includes(CIVILIZATION_BOUNDARY_KINDS, value.boundaryKind)) issues.push("boundaryKind is invalid");
  if (!includes(CIVILIZATION_DEVELOPMENTAL_STAGES, value.developmentalStage)) {
    issues.push("developmentalStage is invalid");
  }
  if (!includes(CIVILIZATION_SUBSTRATE_KINDS, value.substrateKind)) issues.push("substrateKind is invalid");
  if (!includes(CIVILIZATION_AGENCY_MODELS, value.agencyModel)) issues.push("agencyModel is invalid");
  if (!includes(CIVILIZATION_COORDINATION_MODES, value.coordinationMode)) issues.push("coordinationMode is invalid");
  validateEnumArray("constraintProfiles", value.constraintProfiles, CIVILIZATION_CONSTRAINT_PROFILES, issues);
  if (!includes(CIVILIZATION_SCENARIO_EVIDENCE_MODES, value.evidenceMode)) issues.push("evidenceMode is invalid");
  validateEnumArray("suggestedEditors", value.suggestedEditors, CIVILIZATION_SCENARIO_EDITOR_KINDS, issues);
  validateStringArray("defaultQuestions", value.defaultQuestions, issues);
  validateStringArray("missingEvidence", value.missingEvidence, issues);
  validateStringArray("refs", value.refs, issues);

  const stageInheritance = isRecord(value.stageInheritance) ? value.stageInheritance : null;
  if (!stageInheritance) {
    issues.push("stageInheritance must be an object");
  } else {
    if (
      stageInheritance.priorStage !== undefined &&
      stageInheritance.priorStage !== null &&
      !includes(CIVILIZATION_DEVELOPMENTAL_STAGES, stageInheritance.priorStage)
    ) {
      issues.push("stageInheritance.priorStage is invalid");
    }
    validateStringArray("stageInheritance.inheritedConditions", stageInheritance.inheritedConditions, issues);
    validateStringArray("stageInheritance.changedControlVariables", stageInheritance.changedControlVariables, issues);
  }

  const grammar = isRecord(value.boundedActorGrammar) ? value.boundedActorGrammar : null;
  if (!grammar) {
    issues.push("boundedActorGrammar must be an object");
  } else {
    if (!isNonEmptyString(grammar.actorUnit)) issues.push("boundedActorGrammar.actorUnit must be a non-empty string");
    validateStringArray("boundedActorGrammar.resourceInputs", grammar.resourceInputs, issues);
    validateStringArray("boundedActorGrammar.capabilitySurfaces", grammar.capabilitySurfaces, issues);
    validateStringArray("boundedActorGrammar.constraintInterfaces", grammar.constraintInterfaces, issues);
    validateStringArray("boundedActorGrammar.admissibleMoveKinds", grammar.admissibleMoveKinds, issues);
    validateStringArray("boundedActorGrammar.blockedMoveKinds", grammar.blockedMoveKinds, issues);
    validateStringArray("boundedActorGrammar.evidenceRefs", grammar.evidenceRefs, issues);
  }

  const proceduralBindings = isRecord(value.proceduralBindings) ? value.proceduralBindings : null;
  if (!proceduralBindings) {
    issues.push("proceduralBindings must be an object");
  } else {
    validateStringArray("proceduralBindings.theoryBindingHints", proceduralBindings.theoryBindingHints, issues);
    validateStringArray("proceduralBindings.moralBindingHints", proceduralBindings.moralBindingHints, issues);
    validateStringArray("proceduralBindings.bridgeHooks", proceduralBindings.bridgeHooks, issues);
  }

  const suggestedRoadmapInputs = isRecord(value.suggestedRoadmapInputs) ? value.suggestedRoadmapInputs : null;
  if (!suggestedRoadmapInputs) {
    issues.push("suggestedRoadmapInputs must be an object");
  } else {
    if (suggestedRoadmapInputs.boundaryKind !== value.boundaryKind) issues.push("suggestedRoadmapInputs.boundaryKind must match frame");
    if (suggestedRoadmapInputs.developmentalStage !== value.developmentalStage) {
      issues.push("suggestedRoadmapInputs.developmentalStage must match frame");
    }
    if (suggestedRoadmapInputs.substrateKind !== value.substrateKind) issues.push("suggestedRoadmapInputs.substrateKind must match frame");
    if (suggestedRoadmapInputs.agencyModel !== value.agencyModel) issues.push("suggestedRoadmapInputs.agencyModel must match frame");
    if (suggestedRoadmapInputs.coordinationMode !== value.coordinationMode) {
      issues.push("suggestedRoadmapInputs.coordinationMode must match frame");
    }
    if (suggestedRoadmapInputs.evidenceMode !== value.evidenceMode) issues.push("suggestedRoadmapInputs.evidenceMode must match frame");
    validateEnumArray(
      "suggestedRoadmapInputs.constraintProfiles",
      suggestedRoadmapInputs.constraintProfiles,
      CIVILIZATION_CONSTRAINT_PROFILES,
      issues,
    );
  }

  const authority = isRecord(value.authority) ? value.authority : null;
  if (!authority) {
    issues.push("authority must be an object");
  } else {
    for (const field of [
      "assistant_answer",
      "raw_content_included",
      "terminal_eligible",
      "agent_executable",
      "scenario_finality",
      "prediction_finality",
      "policy_finality",
      "moral_finality",
      "execution_permission",
    ] as const) {
      if (authority[field] !== false) issues.push(`authority.${field}_not_false`);
    }
    if (authority.context_role !== "tool_evidence") issues.push("authority.context_role is invalid");
    if (authority.ask_context_policy !== "evidence_only") issues.push("authority.ask_context_policy is invalid");
  }

  return issues;
}

export function isCivilizationScenarioFrameV1(
  value: unknown,
): value is CivilizationScenarioFrameV1 {
  return validateCivilizationScenarioFrameV1(value).length === 0;
}
