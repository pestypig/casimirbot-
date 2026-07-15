import {
  CIVILIZATION_PROVISIONING_NETWORK_ARTIFACT_ID,
  CIVILIZATION_PROVISIONING_NETWORK_SCHEMA_VERSION,
  type CivilizationContributionChannelV1,
  type CivilizationFlowKindV1,
  type CivilizationNeedPrimitiveV1,
  type CivilizationProvisioningBoundaryV1,
  type CivilizationProvisioningFunctionV1,
  type CivilizationProvisioningNetworkV1,
  type CivilizationRoleAssignmentModeV1,
  type CivilizationSettlementModeV1,
} from "../contracts/civilization-provisioning-network.v1";

export type BuildCivilizationProvisioningNetworkInput = {
  text: string;
  refs?: string[];
  moralNodeIds?: string[];
  systemId?: string;
};

const unique = <T>(values: T[]): T[] => [...new Set(values)];
const refsFor = (refs: string[] | undefined): string[] =>
  unique((refs ?? []).filter((ref) => ref.trim().length > 0));

const NEED_RULES: ReadonlyArray<{
  primitive: CivilizationNeedPrimitiveV1;
  cue: RegExp;
  functions: CivilizationProvisioningFunctionV1[];
}> = [
  { primitive: "usable_energy", cue: /\b(?:energy|electricity|heat|fuel|power grid)\b/i, functions: ["energy_supply"] },
  { primitive: "matter_and_nutrients", cue: /\b(?:food|agriculture|nutrient|material|mineral|biomass)\b/i, functions: ["food_and_agriculture", "manufacturing_and_maintenance"] },
  { primitive: "water_or_working_medium", cue: /\b(?:water|sanitation|working medium)\b/i, functions: ["water_and_sanitation"] },
  { primitive: "viable_habitat", cue: /\b(?:housing|shelter|habitat|land|climate protection)\b/i, functions: ["housing_and_habitat"] },
  { primitive: "repair_and_regulation", cue: /\b(?:health|care|repair|maintenance|homeostasis)\b/i, functions: ["health_and_care", "manufacturing_and_maintenance"] },
  { primitive: "sensing_and_information", cue: /\b(?:information|measurement|statistics|monitoring|communication|research)\b/i, functions: ["communications_and_measurement", "education_and_research"] },
  { primitive: "mobility_and_distribution", cue: /\b(?:transport|logistics|mobility|distribution|port|rail|road)\b/i, functions: ["transport_and_logistics"] },
  { primitive: "care_and_continuity", cue: /\b(?:care|continuity|education|intergenerational|reserve)\b/i, functions: ["health_and_care", "education_and_research", "intergenerational_reserve"] },
  { primitive: "waste_and_entropy_sink", cue: /\b(?:waste|emission|entropy sink|pollution|recycling|ecological repair)\b/i, functions: ["waste_and_ecological_regeneration"] },
  { primitive: "protection_and_resilience", cue: /\b(?:safety|security|resilience|emergency|redundancy|reserve)\b/i, functions: ["emergency_and_safety", "intergenerational_reserve"] },
];

const FLOW_RULES: ReadonlyArray<{ kind: CivilizationFlowKindV1; cue: RegExp }> = [
  { kind: "energy", cue: /\b(?:energy|electricity|fuel|heat) flow\b|\bpower grid\b/i },
  { kind: "food_or_biomass", cue: /\b(?:food|biomass|agricultural) (?:flow|supply|trade)\b/i },
  { kind: "water", cue: /\bwater (?:flow|supply|transfer|trade)\b/i },
  { kind: "material", cue: /\b(?:material|mineral|manufacturing) (?:flow|supply|trade)\b/i },
  { kind: "labor", cue: /\b(?:labor|workforce) (?:flow|supply|mobility)\b/i },
  { kind: "care", cue: /\bcare (?:flow|network|provision)\b/i },
  { kind: "information", cue: /\binformation (?:flow|network|exchange)\b/i },
  { kind: "knowledge", cue: /\b(?:knowledge|research) (?:flow|exchange|cooperation|commons)\b/i },
  { kind: "monetary_claim", cue: /\b(?:money|currency|credit|payment|monetary claim|financial settlement)\b/i },
  { kind: "waste_or_emission", cue: /\b(?:waste|emission|pollution) (?:flow|transfer|sink)\b/i },
];

const FUNCTION_RULES: ReadonlyArray<{ function: CivilizationProvisioningFunctionV1; cue: RegExp }> = [
  { function: "food_and_agriculture", cue: /\b(?:food|agriculture)\b/i },
  { function: "water_and_sanitation", cue: /\b(?:water|sanitation)\b/i },
  { function: "housing_and_habitat", cue: /\b(?:housing|shelter|habitat)\b/i },
  { function: "health_and_care", cue: /\b(?:health|care)\b/i },
  { function: "energy_supply", cue: /\b(?:energy|electricity|fuel|power)\b/i },
  { function: "transport_and_logistics", cue: /\b(?:transport|logistics|mobility|distribution)\b/i },
  { function: "communications_and_measurement", cue: /\b(?:communication|measurement|statistics|monitoring)\b/i },
  { function: "education_and_research", cue: /\b(?:education|research|science|knowledge)\b/i },
  { function: "manufacturing_and_maintenance", cue: /\b(?:manufacturing|maintenance|repair)\b/i },
  { function: "waste_and_ecological_regeneration", cue: /\b(?:waste|recycling|ecological|pollution)\b/i },
  { function: "emergency_and_safety", cue: /\b(?:emergency|safety|resilience|security)\b/i },
  { function: "governance_audit_and_justice", cue: /\b(?:governance|audit|justice|review|rights)\b/i },
  { function: "intergenerational_reserve", cue: /\b(?:reserve|future generation|intergenerational)\b/i },
];

const CONTRIBUTION_RULES: ReadonlyArray<{ channel: CivilizationContributionChannelV1; cue: RegExp }> = [
  { channel: "tax", cue: /\b(?:tax|taxation)\b/i },
  { channel: "fee", cue: /\bfees?\b/i },
  { channel: "market_price", cue: /\b(?:market price|purchase|sale)\b/i },
  { channel: "debt", cue: /\b(?:debt|bond|loan)\b/i },
  { channel: "equity", cue: /\b(?:equity|shareholder)\b/i },
  { channel: "membership_dues", cue: /\b(?:membership dues|dues)\b/i },
  { channel: "labor_contribution", cue: /\b(?:labor contribution|work contribution)\b/i },
  { channel: "in_kind_contribution", cue: /\b(?:in-kind|in kind contribution)\b/i },
  { channel: "aid_or_transfer", cue: /\b(?:aid|transfer payment|grant)\b/i },
  { channel: "retained_surplus", cue: /\b(?:retained surplus|retained earnings)\b/i },
];

const SETTLEMENT_RULES: ReadonlyArray<{ mode: CivilizationSettlementModeV1; cue: RegExp }> = [
  { mode: "direct_provision", cue: /\bdirect provision\b/i },
  { mode: "reciprocal_memory", cue: /\b(?:reciprocal memory|informal reciprocity)\b/i },
  { mode: "ledger_credit", cue: /\b(?:ledger|accounting credit)\b/i },
  { mode: "transferable_claim", cue: /\btransferable claim\b/i },
  { mode: "token_or_currency", cue: /\b(?:token|currency|money)\b/i },
  { mode: "institutional_payment_rail", cue: /\b(?:payment rail|bank transfer|institutional payment)\b/i },
];

const detectBoundary = (text: string): CivilizationProvisioningBoundaryV1 => {
  const rules: Array<[CivilizationProvisioningBoundaryV1, RegExp]> = [
    ["planetary_colony", /\b(?:planetary colony|mars colony|lunar colony)\b/i],
    ["trade_bloc", /\b(?:trade bloc|cross[-\s]?border|international|multi[-\s]?country)\b/i],
    ["polity", /\b(?:polity|nation|country|state|civilization|society)\b/i],
    ["city", /\b(?:city|municipality|urban)\b/i],
    ["institution", /\b(?:institution|firm|cooperative|research program)\b/i],
    ["community", /\b(?:community|neighborhood|settlement)\b/i],
    ["household", /\b(?:household|family|roommate)\b/i],
    ["organism", /\b(?:organism|cell|plant|animal)\b/i],
  ];
  return rules.find(([, cue]) => cue.test(text))?.[0] ?? "unknown";
};

const detectAssignmentMode = (text: string): CivilizationRoleAssignmentModeV1 => {
  if (/\bconscript(?:ed|ion)?\b/i.test(text)) return "conscripted";
  if (/\binherited role\b/i.test(text)) return "inherited";
  if (/\bautomat(?:ed|ion)\b/i.test(text)) return "automated";
  if (/\brotat(?:e|ing|ional)\b/i.test(text)) return "rotational";
  if (/\belect(?:ed|ion)\b/i.test(text)) return "elected";
  if (/\bcredential(?:ed|ing)?\b/i.test(text)) return "credentialed";
  if (/\bmarket\b/i.test(text)) return "market";
  if (/\bvoluntar(?:y|ily)\b/i.test(text)) return "voluntary";
  return "unknown";
};

export function buildCivilizationProvisioningNetworkV1(
  input: BuildCivilizationProvisioningNetworkInput,
): CivilizationProvisioningNetworkV1 | null {
  const text = input.text.trim();
  const relevant = /\b(?:provision|resource|supply|infrastructure|allocation|budget|maintenance|transport|logistics|settlement|currency|tax|specialization|cross[-\s]?border|cooperation project|viability need)\b/i.test(text);
  if (!relevant) return null;

  const refs = refsFor(input.refs);
  const matchedNeeds = NEED_RULES.filter(({ cue }) => cue.test(text));
  const matchedFlows = FLOW_RULES.filter(({ cue }) => cue.test(text));
  const matchedFunctions = FUNCTION_RULES.filter(({ cue }) => cue.test(text));
  const contributionChannels = CONTRIBUTION_RULES.filter(({ cue }) => cue.test(text)).map(({ channel }) => channel);
  const settlementModes = SETTLEMENT_RULES.filter(({ cue }) => cue.test(text)).map(({ mode }) => mode);
  const cooperationMentioned = /\b(?:cross[-\s]?border|international|interjurisdictional|shared research|cooperation project)\b/i.test(text);
  const roleMentioned = /\b(?:specialization|delegated role|occupation|workforce|hierarchy|assignment)\b/i.test(text);

  const moralNodeIds = unique([
    ...(input.moralNodeIds ?? []),
    "need-before-allocation",
    ...(roleMentioned ? ["mandate-bounded-hierarchy", "specialization-without-caste"] : []),
    ...(cooperationMentioned ? ["cooperation-without-assimilation"] : []),
    ...(/\b(?:efficien(?:cy|t)|optimi[sz]\w*|balance score|best civilization)\b/i.test(text) ? ["efficiency-without-erasure"] : []),
    ...(/\b(?:secret|confidential|opaque|transparen)\w*\b/i.test(text) ? ["legible-rules-bounded-confidentiality"] : []),
  ]);

  return {
    artifactId: CIVILIZATION_PROVISIONING_NETWORK_ARTIFACT_ID,
    schemaVersion: CIVILIZATION_PROVISIONING_NETWORK_SCHEMA_VERSION,
    system: {
      systemId: input.systemId ?? "provisioning-system:prompt",
      boundary: detectBoundary(text),
      populationOrAgents: "requires_bounded_population_or_agent_set",
      timeHorizon: "requires_time_horizon",
    },
    needs: matchedNeeds.map(({ primitive, functions }, index) => ({
      needId: `provisioning-need:${primitive}:${index + 1}`,
      primitive,
      translatedFunctions: functions,
      viabilityThreshold: null,
      presentCoverage: null,
      affectedAgents: [],
      evidenceRefs: refs,
      missingEvidence: ["viability_threshold", "present_coverage", "affected_agents"],
    })),
    flows: matchedFlows.map(({ kind }, index) => ({
      flowId: `provisioning-flow:${kind}:${index + 1}`,
      kind,
      fromNodeId: "requires_source_node",
      toNodeId: "requires_destination_node",
      quantity: { value: null, unit: null },
      distanceKm: null,
      transportEnergy: { value: null, unit: null },
      latency: null,
      reliability: null,
      bufferDuration: null,
      substitutionCapacity: null,
      lossOrWasteRate: null,
      maintenanceOwner: null,
      externalities: [],
      evidenceRefs: refs,
      missingEvidence: ["quantity_and_unit", "distance", "transport_energy", "buffer", "substitute", "maintenance_owner"],
    })),
    roleDelegations: roleMentioned
      ? [{
          roleId: "provisioning-role:observed",
          function: matchedFunctions[0]?.function ?? "unknown",
          demandEvidence: refs,
          assignmentMode: detectAssignmentMode(text),
          authorityScope: [],
          compensationOrProvision: [],
          safetyChecks: [],
          exitPath: null,
          retrainingPath: null,
          reviewAt: null,
        }]
      : [],
    settlementInterfaces: settlementModes.map((mode, index) => ({
      interfaceId: `provisioning-settlement:${mode}:${index + 1}`,
      mode,
      obligationsRepresented: [],
      participatingSystems: [],
      convertibility: [],
      enforcementOrTrustBasis: [],
      exclusionRisks: [],
      evidenceRefs: refs,
    })),
    collectiveInvestmentPortfolio: matchedFunctions.map(({ function: provisioningFunction }) => ({
      function: provisioningFunction,
      contributionChannels,
      absoluteQuantity: { value: null, unit: null },
      allocationShare: null,
      maintenanceShare: null,
      expansionShare: null,
      burdenGroups: [],
      beneficiaryGroups: [],
      reviewMechanism: null,
      evidenceRefs: refs,
    })),
    cooperationProjects: cooperationMentioned
      ? [{
          projectId: "provisioning-cooperation:observed",
          function: matchedFunctions[0]?.function ?? "unknown",
          participatingJurisdictions: [],
          contributionChannels,
          expectedBenefits: [],
          maintenanceCommitments: [],
          sharedStandards: [],
          knowledgePolicy: null,
          disputePath: null,
          exitAndContinuityPath: null,
          evidenceRefs: refs,
          missingEvidence: ["participating_jurisdictions", "contribution_map", "maintenance_commitments", "dispute_and_exit_paths"],
        }]
      : [],
    tensions: [
      ...(/\bbottleneck\b/i.test(text) ? [{
        tensionId: "provisioning-tension:bottleneck",
        kind: "bottleneck" as const,
        description: "A provisioning bottleneck is asserted but not yet quantified.",
        affectedAgents: [],
        evidenceRefs: refs,
        missingEvidence: ["bottleneck_capacity", "affected_agents", "substitution_path"],
      }] : []),
      ...(/\b(?:asymmetr|unequal burden|benefit mismatch)\w*\b/i.test(text) ? [{
        tensionId: "provisioning-tension:burden-benefit",
        kind: "burden_benefit_mismatch" as const,
        description: "A burden-benefit mismatch is asserted and requires affected-party evidence.",
        affectedAgents: [],
        evidenceRefs: refs,
        missingEvidence: ["burden_groups", "beneficiary_groups", "review_path"],
      }] : []),
    ],
    achievementVector: {
      need_coverage: { value: null, evidenceRefs: refs, missingEvidence: ["need_thresholds", "coverage_measurements"] },
      resource_flow: { value: null, evidenceRefs: refs, missingEvidence: ["flow_quantities", "units", "loss_rates"] },
      missing_evidence: { value: null, evidenceRefs: refs, missingEvidence: ["lens_specific_evidence_completeness"] },
    },
    moralNodeIds,
    missingEvidence: unique([
      "bounded_population_or_agents",
      "time_horizon",
      ...(matchedNeeds.length === 0 ? ["viability_needs"] : []),
      ...(matchedFlows.length === 0 ? ["resource_flows"] : []),
      ...(matchedFunctions.length === 0 ? ["provisioning_functions"] : []),
      ...(contributionChannels.length > 0 ? ["absolute_and_relative_contributions", "burden_and_beneficiary_groups"] : []),
      ...(settlementModes.length > 0 ? ["obligations_and_exclusion_risks"] : []),
    ]),
    authority: {
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      agent_executable: false,
      policy_finality: false,
      moral_finality: false,
      budget_authority: false,
      biological_policy_derivation: false,
      overall_efficiency_score_allowed: false,
    },
  };
}
