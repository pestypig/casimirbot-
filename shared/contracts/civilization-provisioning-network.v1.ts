export const CIVILIZATION_PROVISIONING_NETWORK_ARTIFACT_ID =
  "civilization_provisioning_network" as const;
export const CIVILIZATION_PROVISIONING_NETWORK_SCHEMA_VERSION =
  "civilization_provisioning_network/v1" as const;

export const CIVILIZATION_PROVISIONING_BOUNDARIES = [
  "organism",
  "household",
  "community",
  "city",
  "institution",
  "polity",
  "trade_bloc",
  "planetary_colony",
  "unknown",
] as const;

export const CIVILIZATION_NEED_PRIMITIVES = [
  "usable_energy",
  "matter_and_nutrients",
  "water_or_working_medium",
  "viable_habitat",
  "repair_and_regulation",
  "sensing_and_information",
  "mobility_and_distribution",
  "care_and_continuity",
  "waste_and_entropy_sink",
  "protection_and_resilience",
] as const;

export const CIVILIZATION_PROVISIONING_FUNCTIONS = [
  "food_and_agriculture",
  "water_and_sanitation",
  "housing_and_habitat",
  "health_and_care",
  "energy_supply",
  "transport_and_logistics",
  "communications_and_measurement",
  "education_and_research",
  "manufacturing_and_maintenance",
  "waste_and_ecological_regeneration",
  "emergency_and_safety",
  "governance_audit_and_justice",
  "intergenerational_reserve",
] as const;

export const CIVILIZATION_FLOW_KINDS = [
  "energy",
  "food_or_biomass",
  "water",
  "material",
  "labor",
  "care",
  "information",
  "knowledge",
  "monetary_claim",
  "waste_or_emission",
] as const;

export const CIVILIZATION_CONTRIBUTION_CHANNELS = [
  "tax",
  "fee",
  "market_price",
  "debt",
  "equity",
  "membership_dues",
  "labor_contribution",
  "in_kind_contribution",
  "aid_or_transfer",
  "retained_surplus",
] as const;

export const CIVILIZATION_SETTLEMENT_MODES = [
  "direct_provision",
  "reciprocal_memory",
  "ledger_credit",
  "transferable_claim",
  "token_or_currency",
  "institutional_payment_rail",
] as const;

export const CIVILIZATION_ROLE_ASSIGNMENT_MODES = [
  "voluntary",
  "market",
  "credentialed",
  "elected",
  "rotational",
  "automated",
  "inherited",
  "conscripted",
  "unknown",
] as const;

export const CIVILIZATION_PROVISIONING_LENSES = [
  "need_coverage",
  "resource_flow",
  "transport_energy",
  "dependency_resilience",
  "collective_investment",
  "role_delegation",
  "research_cooperation",
  "rights_and_review",
  "missing_evidence",
] as const;

export type CivilizationProvisioningBoundaryV1 =
  (typeof CIVILIZATION_PROVISIONING_BOUNDARIES)[number];
export type CivilizationNeedPrimitiveV1 =
  (typeof CIVILIZATION_NEED_PRIMITIVES)[number];
export type CivilizationProvisioningFunctionV1 =
  (typeof CIVILIZATION_PROVISIONING_FUNCTIONS)[number];
export type CivilizationProvisioningFunctionOrUnknownV1 =
  | CivilizationProvisioningFunctionV1
  | "unknown";
export type CivilizationFlowKindV1 = (typeof CIVILIZATION_FLOW_KINDS)[number];
export type CivilizationContributionChannelV1 =
  (typeof CIVILIZATION_CONTRIBUTION_CHANNELS)[number];
export type CivilizationSettlementModeV1 =
  (typeof CIVILIZATION_SETTLEMENT_MODES)[number];
export type CivilizationRoleAssignmentModeV1 =
  (typeof CIVILIZATION_ROLE_ASSIGNMENT_MODES)[number];
export type CivilizationProvisioningLensV1 =
  (typeof CIVILIZATION_PROVISIONING_LENSES)[number];

export type CivilizationMeasuredQuantityV1 = {
  value: number | null;
  unit: string | null;
};

export type CivilizationCooperationProjectV1 = {
  projectId: string;
  function: CivilizationProvisioningFunctionOrUnknownV1;
  participatingJurisdictions: string[];
  contributionChannels: CivilizationContributionChannelV1[];
  expectedBenefits: string[];
  maintenanceCommitments: string[];
  sharedStandards: string[];
  knowledgePolicy: string | null;
  disputePath: string | null;
  exitAndContinuityPath: string | null;
  evidenceRefs: string[];
  missingEvidence: string[];
};

export type CivilizationProvisioningTensionV1 = {
  tensionId: string;
  kind:
    | "coverage_gap"
    | "bottleneck"
    | "dependency_asymmetry"
    | "maintenance_gap"
    | "burden_benefit_mismatch"
    | "rights_or_review_gap"
    | "unknown";
  description: string;
  affectedAgents: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
};

export type CivilizationProvisioningNetworkV1 = {
  artifactId: typeof CIVILIZATION_PROVISIONING_NETWORK_ARTIFACT_ID;
  schemaVersion: typeof CIVILIZATION_PROVISIONING_NETWORK_SCHEMA_VERSION;
  system: {
    systemId: string;
    boundary: CivilizationProvisioningBoundaryV1;
    populationOrAgents: string;
    timeHorizon: string;
  };
  needs: Array<{
    needId: string;
    primitive: CivilizationNeedPrimitiveV1;
    translatedFunctions: CivilizationProvisioningFunctionV1[];
    viabilityThreshold: string | null;
    presentCoverage: string | null;
    affectedAgents: string[];
    evidenceRefs: string[];
    missingEvidence: string[];
  }>;
  flows: Array<{
    flowId: string;
    kind: CivilizationFlowKindV1;
    fromNodeId: string;
    toNodeId: string;
    quantity: CivilizationMeasuredQuantityV1;
    distanceKm: number | null;
    transportEnergy: CivilizationMeasuredQuantityV1;
    latency: string | null;
    reliability: number | null;
    bufferDuration: string | null;
    substitutionCapacity: number | null;
    lossOrWasteRate: number | null;
    maintenanceOwner: string | null;
    externalities: string[];
    evidenceRefs: string[];
    missingEvidence: string[];
  }>;
  roleDelegations: Array<{
    roleId: string;
    function: CivilizationProvisioningFunctionOrUnknownV1;
    demandEvidence: string[];
    assignmentMode: CivilizationRoleAssignmentModeV1;
    authorityScope: string[];
    compensationOrProvision: string[];
    safetyChecks: string[];
    exitPath: string | null;
    retrainingPath: string | null;
    reviewAt: string | null;
  }>;
  settlementInterfaces: Array<{
    interfaceId: string;
    mode: CivilizationSettlementModeV1;
    obligationsRepresented: string[];
    participatingSystems: string[];
    convertibility: string[];
    enforcementOrTrustBasis: string[];
    exclusionRisks: string[];
    evidenceRefs: string[];
  }>;
  collectiveInvestmentPortfolio: Array<{
    function: CivilizationProvisioningFunctionV1;
    contributionChannels: CivilizationContributionChannelV1[];
    absoluteQuantity: CivilizationMeasuredQuantityV1;
    allocationShare: number | null;
    maintenanceShare: number | null;
    expansionShare: number | null;
    burdenGroups: string[];
    beneficiaryGroups: string[];
    reviewMechanism: string | null;
    evidenceRefs: string[];
  }>;
  cooperationProjects: CivilizationCooperationProjectV1[];
  tensions: CivilizationProvisioningTensionV1[];
  achievementVector: Partial<
    Record<
      CivilizationProvisioningLensV1,
      { value: number | null; evidenceRefs: string[]; missingEvidence: string[] }
    >
  >;
  moralNodeIds: string[];
  missingEvidence: string[];
  authority: {
    assistant_answer: false;
    raw_content_included: false;
    terminal_eligible: false;
    context_role: "tool_evidence";
    ask_context_policy: "evidence_only";
    agent_executable: false;
    policy_finality: false;
    moral_finality: false;
    budget_authority: false;
    biological_policy_derivation: false;
    overall_efficiency_score_allowed: false;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");
const isEnum = (values: readonly string[], value: unknown): value is string =>
  typeof value === "string" && values.includes(value);
const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

function validateQuantity(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  if (!isNullableNumber(value.value)) issues.push(`${path}.value must be a finite number or null`);
  if (value.unit !== null && typeof value.unit !== "string") issues.push(`${path}.unit must be a string or null`);
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
    "policy_finality",
    "moral_finality",
    "budget_authority",
    "biological_policy_derivation",
    "overall_efficiency_score_allowed",
  ]) {
    if (value[field] !== false) issues.push(`authority.${field} must be false`);
  }
  if (value.context_role !== "tool_evidence") issues.push("authority.context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") issues.push("authority.ask_context_policy must be evidence_only");
}

export function validateCivilizationProvisioningNetworkV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["Civilization Provisioning Network must be an object"];
  if (value.artifactId !== CIVILIZATION_PROVISIONING_NETWORK_ARTIFACT_ID) issues.push("artifactId is invalid");
  if (value.schemaVersion !== CIVILIZATION_PROVISIONING_NETWORK_SCHEMA_VERSION) issues.push("schemaVersion is invalid");

  if (!isRecord(value.system)) {
    issues.push("system must be an object");
  } else {
    if (typeof value.system.systemId !== "string" || !value.system.systemId.trim()) issues.push("system.systemId is required");
    if (!isEnum(CIVILIZATION_PROVISIONING_BOUNDARIES, value.system.boundary)) issues.push("system.boundary is invalid");
    for (const field of ["populationOrAgents", "timeHorizon"]) {
      if (typeof value.system[field] !== "string") issues.push(`system.${field} must be a string`);
    }
  }

  for (const field of [
    "needs",
    "flows",
    "roleDelegations",
    "settlementInterfaces",
    "collectiveInvestmentPortfolio",
    "cooperationProjects",
    "tensions",
  ]) {
    if (!Array.isArray(value[field])) issues.push(`${field} must be an array`);
  }

  if (Array.isArray(value.needs)) value.needs.forEach((entry, index) => {
    if (!isRecord(entry)) return issues.push(`needs[${index}] must be an object`);
    if (!isEnum(CIVILIZATION_NEED_PRIMITIVES, entry.primitive)) issues.push(`needs[${index}].primitive is invalid`);
    if (!Array.isArray(entry.translatedFunctions) || !entry.translatedFunctions.every((item) => isEnum(CIVILIZATION_PROVISIONING_FUNCTIONS, item))) {
      issues.push(`needs[${index}].translatedFunctions is invalid`);
    }
    for (const field of ["affectedAgents", "evidenceRefs", "missingEvidence"]) {
      if (!isStringArray(entry[field])) issues.push(`needs[${index}].${field} must be a string array`);
    }
  });

  if (Array.isArray(value.flows)) value.flows.forEach((entry, index) => {
    if (!isRecord(entry)) return issues.push(`flows[${index}] must be an object`);
    if (!isEnum(CIVILIZATION_FLOW_KINDS, entry.kind)) issues.push(`flows[${index}].kind is invalid`);
    validateQuantity(`flows[${index}].quantity`, entry.quantity, issues);
    validateQuantity(`flows[${index}].transportEnergy`, entry.transportEnergy, issues);
    for (const field of ["distanceKm", "reliability", "substitutionCapacity", "lossOrWasteRate"]) {
      if (!isNullableNumber(entry[field])) issues.push(`flows[${index}].${field} must be a finite number or null`);
    }
    for (const field of ["externalities", "evidenceRefs", "missingEvidence"]) {
      if (!isStringArray(entry[field])) issues.push(`flows[${index}].${field} must be a string array`);
    }
  });

  if (!isRecord(value.achievementVector)) {
    issues.push("achievementVector must be an object");
  } else {
    for (const [lens, entry] of Object.entries(value.achievementVector)) {
      if (!isEnum(CIVILIZATION_PROVISIONING_LENSES, lens)) issues.push(`achievementVector.${lens} is invalid`);
      if (!isRecord(entry)) {
        issues.push(`achievementVector.${lens} must be an object`);
        continue;
      }
      if (!isNullableNumber(entry.value)) issues.push(`achievementVector.${lens}.value must be a finite number or null`);
      if (!isStringArray(entry.evidenceRefs)) issues.push(`achievementVector.${lens}.evidenceRefs must be a string array`);
      if (!isStringArray(entry.missingEvidence)) issues.push(`achievementVector.${lens}.missingEvidence must be a string array`);
    }
  }

  if (!isStringArray(value.moralNodeIds)) issues.push("moralNodeIds must be a string array");
  if (!isStringArray(value.missingEvidence)) issues.push("missingEvidence must be a string array");
  for (const forbidden of ["civilizationBalanceScore", "overallEfficiencyScore", "globalScore", "ideologyRank"]) {
    if (forbidden in value) issues.push(`${forbidden} is forbidden`);
  }
  validateAuthority(value.authority, issues);
  return issues;
}

export const isCivilizationProvisioningNetworkV1 = (
  value: unknown,
): value is CivilizationProvisioningNetworkV1 =>
  validateCivilizationProvisioningNetworkV1(value).length === 0;
