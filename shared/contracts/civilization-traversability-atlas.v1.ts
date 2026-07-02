import {
  CIVILIZATION_CLAIM_TIERS,
  type CivilizationClaimTierV1,
} from "./civilization-bounds-roadmap.v1";

export const CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID =
  "civilization_traversability_atlas" as const;

export const CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION =
  "civilization_traversability_atlas/v1" as const;

export const CIVILIZATION_TRAVERSABILITY_FIELD_LAYER_KINDS = [
  "solar_irradiance",
  "seismic_activity",
  "atmospheric_wind",
  "ocean_current",
  "hydrology",
  "water_level",
  "tide_height",
  "terrain",
  "tectonic_hazard",
  "weather_alert",
  "ecological_connectivity",
  "fungal_biodiversity",
  "climate_hazard",
] as const;

export const CIVILIZATION_TRAVERSABILITY_INFRASTRUCTURE_NODE_KINDS = [
  "airport",
  "port",
  "road_junction",
  "rail_junction",
  "border_crossing",
  "canal",
  "pipeline_terminal",
  "submarine_cable_landing",
  "grid_interconnect",
  "river_terminal",
  "ecological_region",
  "dust_source_region",
  "deposition_region",
] as const;

export const CIVILIZATION_TRAVERSABILITY_ROUTE_MODES = [
  "air",
  "sea",
  "road",
  "rail",
  "river",
  "pipeline",
  "submarine_cable",
  "atmospheric",
  "ecological",
] as const;

export const CIVILIZATION_TRAVERSABILITY_ROUTE_REALIZATIONS = [
  "geodesic_lower_bound",
  "modeled_candidate",
  "scheduled",
  "observed",
  "historical",
] as const;

export const CIVILIZATION_TRAVERSABILITY_ROUTE_OBJECTIVES = [
  "fastest",
  "lowest_energy",
  "highest_capacity",
  "highest_reliability",
  "lowest_hazard_exposure",
  "lowest_permission_risk",
  "best_observed",
] as const;

export const CIVILIZATION_TRAVERSABILITY_CONSTRAINT_KINDS = [
  "terrain",
  "weather",
  "current",
  "hazard",
  "capacity",
  "border",
  "airspace",
  "treaty",
  "maintenance",
  "missing_observation",
] as const;

export const CIVILIZATION_TRAVERSABILITY_CONSTRAINT_EFFECTS = [
  "enables",
  "raises_cost",
  "reduces_capacity",
  "blocks",
  "unknown",
] as const;

export type CivilizationTraversabilityFieldLayerKindV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_FIELD_LAYER_KINDS)[number];
export type CivilizationTraversabilityInfrastructureNodeKindV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_INFRASTRUCTURE_NODE_KINDS)[number];
export type CivilizationTraversabilityRouteModeV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_ROUTE_MODES)[number];
export type CivilizationTraversabilityRouteRealizationV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_ROUTE_REALIZATIONS)[number];
export type CivilizationTraversabilityRouteObjectiveV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_ROUTE_OBJECTIVES)[number];
export type CivilizationTraversabilityConstraintKindV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_CONSTRAINT_KINDS)[number];
export type CivilizationTraversabilityConstraintEffectV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_CONSTRAINT_EFFECTS)[number];

export type CivilizationTraversabilityGeometryRefV1 = {
  refId: string;
  kind: "point" | "polyline" | "polygon" | "raster" | "external";
  description: string;
  sourceRefs: string[];
};

export type CivilizationTraversabilityTemporalFrameV1 = {
  observedAt: string;
  validFrom?: string;
  validTo?: string;
  cadence: "static" | "near_real_time" | "hourly" | "daily" | "seasonal" | "annual";
};

export type CivilizationFieldLayerV1 = {
  fieldLayerId: string;
  kind: CivilizationTraversabilityFieldLayerKindV1;
  label: string;
  temporalFrame: CivilizationTraversabilityTemporalFrameV1;
  geometryRef: CivilizationTraversabilityGeometryRefV1;
  units?: string;
  resolution?: string;
  confidence: number;
  uncertainty?: number;
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationInfrastructureNodeV1 = {
  nodeId: string;
  kind: CivilizationTraversabilityInfrastructureNodeKindV1;
  label: string;
  systemId?: string;
  countryIso3?: string;
  coordinates?: { lat: number; lon: number } | null;
  geometryRef?: CivilizationTraversabilityGeometryRefV1;
  capacityLabel?: string;
  activeFieldLayerIds: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
  confidence: number;
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationRouteCandidateConstraintV1 = {
  kind: CivilizationTraversabilityConstraintKindV1;
  refId: string;
  effect: CivilizationTraversabilityConstraintEffectV1;
};

export type CivilizationRouteCandidateV1 = {
  routeId: string;
  dependencyEdgeId: string;
  label: string;
  mode: CivilizationTraversabilityRouteModeV1;
  realization: CivilizationTraversabilityRouteRealizationV1;
  geometryRef: CivilizationTraversabilityGeometryRefV1;
  transferNodeIds: string[];
  activeFieldLayerIds: string[];
  metrics: {
    distanceKm?: number;
    durationHours?: number;
    capacity?: number;
    energyCost?: number;
    reliability?: number;
    emissions?: number;
  };
  feasibility: {
    physical: number | null;
    infrastructure: number | null;
    jurisdictional: number | null;
    operationalEvidence: number | null;
  };
  constraints: CivilizationRouteCandidateConstraintV1[];
  confidence: number;
  uncertainty?: number;
  claimTier: CivilizationClaimTierV1;
  evidenceRefs: string[];
  missingEvidence: string[];
  theoryBadgeIds?: string[];
  moralNodeIds?: string[];
};

export type CivilizationObservedFlowV1 = {
  flowId: string;
  routeId: string;
  label: string;
  observedAt: string;
  quantityLabel: string;
  sourceRefs: string[];
  confidence: number;
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationTraversabilityContextV1 = {
  dependencyEdgeIds: string[];
  routeCandidateIds: string[];
  activeFieldLayerIds: string[];
  infrastructureNodeIds: string[];
  limitingFactors: string[];
  unavailableAlternatives: string[];
  theoryBadgeIds: string[];
  moralNodeIds: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
  routeObjective?: CivilizationTraversabilityRouteObjectiveV1;
  timeCursor?: string;
};

export type CivilizationTraversabilityAtlasAuthorityV1 = {
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

export type CivilizationTraversabilityAtlasV1 = {
  artifactId: typeof CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID;
  schemaVersion: typeof CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION;
  generatedAt: string;
  atlasId: string;
  scenarioId: string;
  title: string;
  temporalFrame: CivilizationTraversabilityTemporalFrameV1;
  fieldLayers: CivilizationFieldLayerV1[];
  infrastructureNodes: CivilizationInfrastructureNodeV1[];
  routeCandidates: CivilizationRouteCandidateV1[];
  observedFlows: CivilizationObservedFlowV1[];
  authority: CivilizationTraversabilityAtlasAuthorityV1;
};

export type BuildCivilizationTraversabilityAtlasInput = Omit<
  CivilizationTraversabilityAtlasV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "atlasId" | "authority"
> & {
  generatedAt?: string;
  atlasId?: string;
};

const AUTHORITY: CivilizationTraversabilityAtlasAuthorityV1 = {
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

const FORBIDDEN_TRAVERSABILITY_PATTERNS = [
  /\bbest route guaranteed\b/i,
  /\bpolicy finality\b/i,
  /\bprediction guaranteed\b/i,
  /\bexecution permission\b/i,
  /\bterminal authority\b/i,
  /\bmorally certain\b/i,
] as const;

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

function newAtlasId(): string {
  return `civilization-traversability:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
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

function validateOptionalScore(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined) validateScore(prefix, value, issues);
}

function validateGeometryRef(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.refId)) issues.push(`${prefix}.refId must be a non-empty string`);
  if (!["point", "polyline", "polygon", "raster", "external"].includes(String(value.kind))) {
    issues.push(`${prefix}.kind is invalid`);
  }
  if (!isNonEmptyString(value.description)) {
    issues.push(`${prefix}.description must be a non-empty string`);
  }
  validateStringArray(`${prefix}.sourceRefs`, value.sourceRefs, issues);
}

function validateTemporalFrame(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.observedAt)) issues.push(`${prefix}.observedAt must be a non-empty string`);
  if (value.validFrom !== undefined && !isNonEmptyString(value.validFrom)) {
    issues.push(`${prefix}.validFrom must be a non-empty string when present`);
  }
  if (value.validTo !== undefined && !isNonEmptyString(value.validTo)) {
    issues.push(`${prefix}.validTo must be a non-empty string when present`);
  }
  if (!["static", "near_real_time", "hourly", "daily", "seasonal", "annual"].includes(String(value.cadence))) {
    issues.push(`${prefix}.cadence is invalid`);
  }
}

function validateClaimTier(prefix: string, value: unknown, issues: string[]): void {
  if (!includes(CIVILIZATION_CLAIM_TIERS, value)) {
    issues.push(`${prefix} is invalid`);
  }
}

function validateFieldLayer(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["fieldLayerId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_TRAVERSABILITY_FIELD_LAYER_KINDS, value.kind)) {
    issues.push(`${prefix}.kind is invalid`);
  }
  validateTemporalFrame(`${prefix}.temporalFrame`, value.temporalFrame, issues);
  validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateOptionalScore(`${prefix}.uncertainty`, value.uncertainty, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateInfrastructureNode(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["nodeId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_TRAVERSABILITY_INFRASTRUCTURE_NODE_KINDS, value.kind)) {
    issues.push(`${prefix}.kind is invalid`);
  }
  if (value.geometryRef !== undefined) validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  validateStringArray(`${prefix}.activeFieldLayerIds`, value.activeFieldLayerIds, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateRouteCandidate(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["routeId", "dependencyEdgeId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_TRAVERSABILITY_ROUTE_MODES, value.mode)) issues.push(`${prefix}.mode is invalid`);
  if (!includes(CIVILIZATION_TRAVERSABILITY_ROUTE_REALIZATIONS, value.realization)) {
    issues.push(`${prefix}.realization is invalid`);
  }
  validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  validateStringArray(`${prefix}.transferNodeIds`, value.transferNodeIds, issues);
  validateStringArray(`${prefix}.activeFieldLayerIds`, value.activeFieldLayerIds, issues);
  if (!isRecord(value.metrics)) issues.push(`${prefix}.metrics must be an object`);
  if (!isRecord(value.feasibility)) {
    issues.push(`${prefix}.feasibility must be an object`);
  } else {
    for (const field of ["physical", "infrastructure", "jurisdictional", "operationalEvidence"] as const) {
      const score = value.feasibility[field];
      if (score !== null) validateScore(`${prefix}.feasibility.${field}`, score, issues);
    }
  }
  if (!Array.isArray(value.constraints)) {
    issues.push(`${prefix}.constraints must be an array`);
  } else {
    value.constraints.forEach((constraint, index) => {
      if (!isRecord(constraint)) {
        issues.push(`${prefix}.constraints[${index}] must be an object`);
        return;
      }
      if (!includes(CIVILIZATION_TRAVERSABILITY_CONSTRAINT_KINDS, constraint.kind)) {
        issues.push(`${prefix}.constraints[${index}].kind is invalid`);
      }
      if (!isNonEmptyString(constraint.refId)) {
        issues.push(`${prefix}.constraints[${index}].refId must be a non-empty string`);
      }
      if (!includes(CIVILIZATION_TRAVERSABILITY_CONSTRAINT_EFFECTS, constraint.effect)) {
        issues.push(`${prefix}.constraints[${index}].effect is invalid`);
      }
    });
  }
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateOptionalScore(`${prefix}.uncertainty`, value.uncertainty, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  if (value.theoryBadgeIds !== undefined) validateStringArray(`${prefix}.theoryBadgeIds`, value.theoryBadgeIds, issues);
  if (value.moralNodeIds !== undefined) validateStringArray(`${prefix}.moralNodeIds`, value.moralNodeIds, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateObservedFlow(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["flowId", "routeId", "label", "observedAt", "quantityLabel"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateStringArray(`${prefix}.sourceRefs`, value.sourceRefs, issues);
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
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

export function buildCivilizationTraversabilityAtlasV1(
  input: BuildCivilizationTraversabilityAtlasInput,
): CivilizationTraversabilityAtlasV1 {
  return {
    artifactId: CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID,
    schemaVersion: CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    atlasId: input.atlasId ?? newAtlasId(),
    scenarioId: input.scenarioId,
    title: input.title,
    temporalFrame: input.temporalFrame,
    fieldLayers: input.fieldLayers,
    infrastructureNodes: input.infrastructureNodes,
    routeCandidates: input.routeCandidates,
    observedFlows: input.observedFlows,
    authority: { ...AUTHORITY },
  };
}

export function validateCivilizationTraversabilityAtlasV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["civilization traversability atlas must be an object"];
  if (value.artifactId !== CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID) {
    issues.push(`artifactId must be ${CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "atlasId", "scenarioId", "title"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  validateTemporalFrame("temporalFrame", value.temporalFrame, issues);
  if (!Array.isArray(value.fieldLayers)) {
    issues.push("fieldLayers must be an array");
  } else {
    value.fieldLayers.forEach((entry, index) => validateFieldLayer(`fieldLayers[${index}]`, entry, issues));
  }
  if (!Array.isArray(value.infrastructureNodes)) {
    issues.push("infrastructureNodes must be an array");
  } else {
    value.infrastructureNodes.forEach((entry, index) =>
      validateInfrastructureNode(`infrastructureNodes[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.routeCandidates)) {
    issues.push("routeCandidates must be an array");
  } else {
    value.routeCandidates.forEach((entry, index) => validateRouteCandidate(`routeCandidates[${index}]`, entry, issues));
  }
  if (!Array.isArray(value.observedFlows)) {
    issues.push("observedFlows must be an array");
  } else {
    value.observedFlows.forEach((entry, index) => validateObservedFlow(`observedFlows[${index}]`, entry, issues));
  }
  validateAuthority(value.authority, issues);
  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_TRAVERSABILITY_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden traversability finality text matched: ${pattern.source}`);
  }
  return issues;
}

export function isCivilizationTraversabilityAtlasV1(
  value: unknown,
): value is CivilizationTraversabilityAtlasV1 {
  return validateCivilizationTraversabilityAtlasV1(value).length === 0;
}
