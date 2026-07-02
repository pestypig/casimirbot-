import crypto from "node:crypto";
import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import {
  buildCivilizationScenarioFrameV1,
  validateCivilizationScenarioFrameV1,
  type CivilizationAgencyModelV1,
  type CivilizationBoundaryKindV1,
  type CivilizationConstraintProfileV1,
  type CivilizationCoordinationModeV1,
  type CivilizationDevelopmentalStageV1,
  type CivilizationScenarioEditorKindV1,
  type CivilizationScenarioEvidenceModeV1,
  type CivilizationScenarioFamilyV1,
  type CivilizationScenarioFrameV1,
  type CivilizationSubstrateKindV1,
} from "@shared/civilization-scenario-frame";

export const HELIX_ASK_CIVILIZATION_SCENARIO_FRAME_TOOL_NAME =
  "helix_ask.build_civilization_scenario_frame" as const;

const CivilizationScenarioFrameToolInputSchema = z.object({
  prompt: z.string(),
  refs: z.array(z.string()).optional(),
  options: z
    .object({
      allowFictional: z.boolean().optional(),
      allowHistorical: z.boolean().optional(),
      includeNeedleScenarioFallback: z.boolean().optional(),
    })
    .optional(),
});

export type HelixAskCivilizationScenarioFrameToolInput = {
  prompt: string;
  refs?: string[];
  options?: {
    allowFictional?: boolean;
    allowHistorical?: boolean;
    includeNeedleScenarioFallback?: boolean;
  };
};

export type HelixAskCivilizationScenarioFrameToolOutput = {
  frame: CivilizationScenarioFrameV1;
  missingEvidence: string[];
  suggestedRoadmapInputs: CivilizationScenarioFrameV1["suggestedRoadmapInputs"];
};

type FramePreset = {
  family: CivilizationScenarioFamilyV1;
  boundaryKind: CivilizationBoundaryKindV1;
  developmentalStage: CivilizationDevelopmentalStageV1;
  substrateKind: CivilizationSubstrateKindV1;
  agencyModel: CivilizationAgencyModelV1;
  coordinationMode: CivilizationCoordinationModeV1;
  constraintProfiles: CivilizationConstraintProfileV1[];
  defaultQuestions: string[];
  resourceInputs: string[];
  capabilitySurfaces: string[];
  admissibleMoveKinds: string[];
};

const FAMILY_PRESETS: Record<CivilizationScenarioFamilyV1, FramePreset> = {
  origin_and_metabolism: {
    family: "origin_and_metabolism",
    boundaryKind: "organism",
    developmentalStage: "metabolic",
    substrateKind: "biological",
    agencyModel: "single_agent",
    coordinationMode: "unknown",
    constraintProfiles: ["energy_limited", "ecological_sink_limited", "observability_limited"],
    defaultQuestions: [
      "What keeps the system alive?",
      "What are its energy sources and entropy sinks?",
      "What can it sense directly?",
    ],
    resourceInputs: ["energy intake", "habitat chemistry", "waste sink"],
    capabilitySurfaces: ["metabolic maintenance", "boundary sensing", "survival response"],
    admissibleMoveKinds: ["observe local conditions", "test intake and waste limits", "revise survival assumptions"],
  },
  agent_survival: {
    family: "agent_survival",
    boundaryKind: "crew",
    developmentalStage: "embodied_agent",
    substrateKind: "human_social",
    agencyModel: "small_group",
    coordinationMode: "mutual_aid",
    constraintProfiles: ["energy_limited", "transport_limited", "observability_limited", "security_limited"],
    defaultQuestions: [
      "What can the actor do?",
      "What does it need?",
      "What can harm it?",
    ],
    resourceInputs: ["food", "shelter", "tools", "local observations"],
    capabilitySurfaces: ["mobility", "tool use", "shelter maintenance"],
    admissibleMoveKinds: ["inventory resources", "map hazards", "choose reversible moves"],
  },
  social_coordination: {
    family: "social_coordination",
    boundaryKind: "tribe",
    developmentalStage: "group_coordination",
    substrateKind: "human_social",
    agencyModel: "small_group",
    coordinationMode: "kinship",
    constraintProfiles: ["governance_limited", "consent_limited", "material_limited", "observability_limited"],
    defaultQuestions: [
      "How do agents coordinate?",
      "What norms govern exchange?",
      "What review process exists?",
    ],
    resourceInputs: ["shared food", "roles", "trust interfaces"],
    capabilitySurfaces: ["role specialization", "conflict resolution", "resource sharing"],
    admissibleMoveKinds: ["surface conflicts", "request consent checks", "revise roles"],
  },
  settlement_and_city: {
    family: "settlement_and_city",
    boundaryKind: "city",
    developmentalStage: "settlement",
    substrateKind: "planetary_infrastructure",
    agencyModel: "federated_polity",
    coordinationMode: "federation",
    constraintProfiles: ["material_limited", "energy_limited", "transport_limited", "governance_limited"],
    defaultQuestions: [
      "What infrastructure exists?",
      "What can be manufactured locally?",
      "What must be imported?",
    ],
    resourceInputs: ["power", "water", "housing", "transport routes"],
    capabilitySurfaces: ["local repair", "public review", "infrastructure scheduling"],
    admissibleMoveKinds: ["rank critical infrastructure", "request imports", "schedule review"],
  },
  industrial_capacity: {
    family: "industrial_capacity",
    boundaryKind: "polity",
    developmentalStage: "industrial_system",
    substrateKind: "industrial_material",
    agencyModel: "hierarchical_institution",
    coordinationMode: "command",
    constraintProfiles: ["energy_limited", "material_limited", "manufacturing_limited", "thermal_limited"],
    defaultQuestions: [
      "What can be built, at what resolution, and at what throughput?",
      "What materials and energy are limiting?",
      "What maintenance capacity exists?",
    ],
    resourceInputs: ["grid capacity", "material inventory", "labor skill", "thermal sinks"],
    capabilitySurfaces: ["manufacturing resolution", "maintenance throughput", "quality control"],
    admissibleMoveKinds: ["bound throughput", "inventory materials", "test thermal ceilings"],
  },
  planetary_trade: {
    family: "planetary_trade",
    boundaryKind: "planetary_civilization",
    developmentalStage: "planetary_coordination",
    substrateKind: "planetary_infrastructure",
    agencyModel: "market_network",
    coordinationMode: "treaty",
    constraintProfiles: ["material_limited", "transport_limited", "governance_limited", "multi_bottleneck"],
    defaultQuestions: [
      "Who supplies what?",
      "Who depends on whom?",
      "What routes and interfaces are fragile?",
    ],
    resourceInputs: ["supply nodes", "transport corridors", "substitution paths", "review interfaces"],
    capabilitySurfaces: ["dependency mapping", "route substitution", "collaboration bounds"],
    admissibleMoveKinds: ["compare supply paths", "flag bottlenecks", "request source-backed trade data"],
  },
  resource_reconstruction: {
    family: "resource_reconstruction",
    boundaryKind: "polity",
    developmentalStage: "collapse_or_repair",
    substrateKind: "planetary_infrastructure",
    agencyModel: "federated_polity",
    coordinationMode: "mutual_aid",
    constraintProfiles: ["material_limited", "manufacturing_limited", "transport_limited", "governance_limited"],
    defaultQuestions: [
      "What damage exists?",
      "What must be restored first?",
      "Who is harmed by delay?",
    ],
    resourceInputs: ["repair crews", "critical supplies", "transport access", "civilian harm reports"],
    capabilitySurfaces: ["damage triage", "repair sequencing", "harm-priority review"],
    admissibleMoveKinds: ["prioritize repairs", "ask for damage evidence", "revise recovery bottlenecks"],
  },
  exploration_and_colonization: {
    family: "exploration_and_colonization",
    boundaryKind: "settlement",
    developmentalStage: "interstellar_or_extraplanetary",
    substrateKind: "planetary_infrastructure",
    agencyModel: "small_group",
    coordinationMode: "protocol",
    constraintProfiles: ["energy_limited", "transport_limited", "signal_latency_limited", "material_limited"],
    defaultQuestions: [
      "What can be carried?",
      "What must be made in place?",
      "What is reversible?",
    ],
    resourceInputs: ["life support", "closed-loop material flow", "transport mass", "communication delay"],
    capabilitySurfaces: ["local manufacturing", "mission abort margin", "latency-aware command"],
    admissibleMoveKinds: ["bound carried mass", "test local production", "define abort margins"],
  },
  machine_or_digital_civilization: {
    family: "machine_or_digital_civilization",
    boundaryKind: "machine_society",
    developmentalStage: "industrial_system",
    substrateKind: "digital_computational",
    agencyModel: "machine_collective",
    coordinationMode: "protocol",
    constraintProfiles: ["compute_limited", "energy_limited", "thermal_limited", "signal_latency_limited"],
    defaultQuestions: [
      "What compute exists?",
      "What energy and cooling exist?",
      "Who governs model or action authority?",
    ],
    resourceInputs: ["compute budget", "memory bandwidth", "cooling", "hardware supply"],
    capabilitySurfaces: ["model execution", "audit logging", "latency-tolerant coordination"],
    admissibleMoveKinds: ["bound compute", "request audit coverage", "separate model output from action authority"],
  },
  ecological_civilization: {
    family: "ecological_civilization",
    boundaryKind: "multi_species_ecology",
    developmentalStage: "planetary_coordination",
    substrateKind: "ecological",
    agencyModel: "ecosystem",
    coordinationMode: "unknown",
    constraintProfiles: ["ecological_sink_limited", "energy_limited", "observability_limited", "consent_limited"],
    defaultQuestions: [
      "What cycles are closed?",
      "What sinks are overloaded?",
      "What species or agents are affected?",
    ],
    resourceInputs: ["regeneration rate", "biodiversity dependencies", "carrying capacity", "waste sinks"],
    capabilitySurfaces: ["sink monitoring", "non-harm review", "regeneration pacing"],
    admissibleMoveKinds: ["map affected species", "bound sink capacity", "revise carrying-capacity claims"],
  },
  collapse_repair_and_resilience: {
    family: "collapse_repair_and_resilience",
    boundaryKind: "polity",
    developmentalStage: "collapse_or_repair",
    substrateKind: "human_social",
    agencyModel: "mixed_agency",
    coordinationMode: "mutual_aid",
    constraintProfiles: ["security_limited", "governance_limited", "material_limited", "observability_limited"],
    defaultQuestions: [
      "What failed?",
      "What remains?",
      "What makes the system brittle?",
    ],
    resourceInputs: ["remaining capacity", "repair path", "redundancy", "trust state"],
    capabilitySurfaces: ["failure analysis", "redundancy repair", "trust restoration"],
    admissibleMoveKinds: ["identify failure mode", "rank repair paths", "set revision triggers"],
  },
  fictional_or_agent_arranged: {
    family: "fictional_or_agent_arranged",
    boundaryKind: "fictional_world",
    developmentalStage: "simulation_only",
    substrateKind: "fictional_physics",
    agencyModel: "mixed_agency",
    coordinationMode: "unknown",
    constraintProfiles: ["observability_limited", "governance_limited", "multi_bottleneck"],
    defaultQuestions: [
      "What rules define this world?",
      "Which constraints are declared?",
      "Which constraints are imported from real physics?",
    ],
    resourceInputs: ["declared rules", "assumption boundaries", "analogy-only bridge limits"],
    capabilitySurfaces: ["rule consistency", "assumption tracking", "fictional constraint mapping"],
    admissibleMoveKinds: ["declare rules", "mark analogy-only constraints", "separate fictional from observed claims"],
  },
};

const CONSTRAINT_EVIDENCE: Record<CivilizationConstraintProfileV1, string[]> = {
  energy_limited: ["energy_budget_measurements"],
  material_limited: ["material_inventory_receipts"],
  manufacturing_limited: ["manufacturing_resolution_measurements"],
  thermal_limited: ["thermal_ceiling_measurements"],
  compute_limited: ["compute_budget_and_hardware_inventory"],
  signal_latency_limited: ["signal_latency_measurements"],
  transport_limited: ["transport_route_and_latency_evidence"],
  observability_limited: ["observability_coverage_report"],
  governance_limited: ["governance_review_record"],
  consent_limited: ["affected_party_consent_interface_record"],
  ecological_sink_limited: ["ecological_sink_capacity_measurements"],
  security_limited: ["security_risk_assessment"],
  multi_bottleneck: ["bottleneck_dependency_graph"],
};

const FAMILY_PATTERNS: Array<[CivilizationScenarioFamilyV1, RegExp]> = [
  ["resource_reconstruction", /\b(?:reconstruction|rebuild|restore|repair capacity|damaged infrastructure|critical supply|civilian harm|ceasefire|conflict|war|battlefield|air defense|long[-\s]?range strike|infrastructure stability|resource reserves?|buildout rate|decision makers?)\b/i],
  ["collapse_repair_and_resilience", /\b(?:collapse|resilience|brittle|failure mode|trust loss|what failed|repair path|grinding machine|marginal gains?|attrition)\b/i],
  ["planetary_trade", /\b(?:trade|supply chain|supplier|import|export|market|treaty|sanction|dependency edge|transport corridor|reserve estimates?|infrastructure development)\b/i],
  ["industrial_capacity", /\b(?:industrial|manufactur|material inventory|grid capacity|throughput|thermal ceiling|labor skill|needle hull|economic max capacity|production rate|capacity margin)\b/i],
  ["machine_or_digital_civilization", /\b(?:machine|digital|compute|computational|ai|ai model|model execution|model\/action authority|memory|cooling|hardware|signal latency)\b/i],
  ["exploration_and_colonization", /\b(?:mars|base|coloni[sz]ation|exploration|life support|terraform|mission|extraplanetary|interplanetary)\b/i],
  ["ecological_civilization", /\b(?:ecolog|species|biodiversity|carrying capacity|regeneration|waste sink|sink overloaded)\b/i],
  ["settlement_and_city", /\b(?:city|settlement|infrastructure|housing|water|public review|local manufacturing)\b/i],
  ["social_coordination", /\b(?:tribe|tribal|social coordination|norm|trust|role specialization|consent interface|conflict resolution)\b/i],
  ["agent_survival", /\b(?:creature|agent survival|shelter|threat|mobility|tool use|survival)\b/i],
  ["origin_and_metabolism", /\b(?:cell|metabolic|metabolism|organism|energy intake|entropy sink|alive)\b/i],
  ["fictional_or_agent_arranged", /\b(?:fictional|spore|simulation|worldbuilding|agent arranged|declared rule|fictional physics)\b/i],
];

const unique = <T>(items: T[]): T[] => Array.from(new Set(items));

const clip = (text: string, max = 140): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 3).trim()}...`;
};

const stableFrameId = (prompt: string): string =>
  `civilization-frame:${crypto.createHash("sha256").update(prompt).digest("hex").slice(0, 16)}`;

function selectFamily(prompt: string): CivilizationScenarioFamilyV1 {
  const conflictCue = /\b(?:ceasefire|war|conflict|battlefield|frontline|air defense|long[-\s]?range strike|military|marginal gains?|attrition)\b/i;
  const resourceCapacityCue = /\b(?:resource|reserve|infrastructure|supply|capacity|buildout|development rate|economic max|material|manufactur)\b/i;
  if (conflictCue.test(prompt) && resourceCapacityCue.test(prompt)) {
    return "resource_reconstruction";
  }
  for (const [family, pattern] of FAMILY_PATTERNS) {
    if (pattern.test(prompt)) return family;
  }
  return "planetary_trade";
}

function selectEvidenceMode(
  prompt: string,
  refs: string[],
  input: HelixAskCivilizationScenarioFrameToolInput,
): CivilizationScenarioEvidenceModeV1 {
  if (/\b(?:needle hull|declared scenario|declared needle)\b/i.test(prompt) && input.options?.includeNeedleScenarioFallback !== false) {
    return "declared_scenario";
  }
  if (/\b(?:fictional|spore|simulation|worldbuilding|fictional physics)\b/i.test(prompt)) {
    return input.options?.allowFictional === false ? "user_hypothesis" : "fictional_construct";
  }
  if (/\b(?:counterfactual|what if)\b/i.test(prompt)) return "counterfactual";
  if (/\b(?:stress test|stress-test)\b/i.test(prompt)) return "stress_test";
  if (/\b(?:projection|forecast|model projection)\b/i.test(prompt)) return "model_projection";
  if (/\b(?:historical|replay|after-action|past)\b/i.test(prompt)) {
    return input.options?.allowHistorical === false ? "user_hypothesis" : "historical_replay";
  }
  if (refs.length > 0 && /\b(?:source-backed|with sources|receipt|observed)\b/i.test(prompt)) {
    return "source_backed_observation";
  }
  if (refs.length > 0 && /\b(?:current observation|live observation)\b/i.test(prompt)) return "current_observation";
  return "user_hypothesis";
}

function overlayPromptConstraints(
  prompt: string,
  base: CivilizationConstraintProfileV1[],
): CivilizationConstraintProfileV1[] {
  const profiles = [...base];
  const add = (profile: CivilizationConstraintProfileV1, pattern: RegExp): void => {
    if (pattern.test(prompt)) profiles.push(profile);
  };
  add("energy_limited", /\b(?:energy|power|grid|fuel)\b/i);
  add("material_limited", /\b(?:material|inventory|supply|resource)\b/i);
  add("manufacturing_limited", /\b(?:manufactur|factory|throughput|resolution|build)\b/i);
  add("thermal_limited", /\b(?:thermal|heat|cooling)\b/i);
  add("compute_limited", /\b(?:compute|memory|model|hardware)\b/i);
  add("signal_latency_limited", /\b(?:latency|signal|communication delay)\b/i);
  add("transport_limited", /\b(?:transport|route|shipping|carry|import|export)\b/i);
  add("observability_limited", /\b(?:observe|observability|blind spot|missing evidence|unknown)\b/i);
  add("governance_limited", /\b(?:governance|review|due process|procedure|policy)\b/i);
  add("consent_limited", /\b(?:consent|affected party|non-harm|harm)\b/i);
  add("ecological_sink_limited", /\b(?:ecolog|waste|sink|regeneration|carrying capacity)\b/i);
  add("security_limited", /\b(?:security|threat|risk|attack|coercion)\b/i);
  return unique(profiles).slice(0, 6);
}

function selectPreset(prompt: string): FramePreset {
  const family = selectFamily(prompt);
  const preset = FAMILY_PRESETS[family];
  if (/\b(?:planetary civilization|global|world|earth|countries|china|europe|u\.s\.|u\.s|usa|united states|needle hull)\b/i.test(prompt)) {
    return {
      ...preset,
      boundaryKind: "planetary_civilization",
      developmentalStage: preset.developmentalStage === "industrial_system" ? "planetary_coordination" : preset.developmentalStage,
      substrateKind: preset.substrateKind === "industrial_material" ? "planetary_infrastructure" : preset.substrateKind,
      agencyModel: preset.agencyModel === "hierarchical_institution" ? "mixed_agency" : preset.agencyModel,
      coordinationMode: /\bopen source\b/i.test(prompt)
        ? "open_source"
        : /\b(?:ceasefire|treaty|agreement|diplomacy|countries|china|europe|u\.s\.|u\.s|usa|united states)\b/i.test(prompt)
          ? "treaty"
          : preset.coordinationMode,
    };
  }
  if (/\b(?:supply chain)\b/i.test(prompt)) return { ...preset, boundaryKind: "supply_chain", agencyModel: "market_network" };
  if (/\b(?:trade bloc)\b/i.test(prompt)) return { ...preset, boundaryKind: "trade_bloc", agencyModel: "federated_polity" };
  if (/\b(?:crew)\b/i.test(prompt)) return { ...preset, boundaryKind: "crew", agencyModel: "small_group" };
  return preset;
}

function buildMissingEvidence(
  profiles: CivilizationConstraintProfileV1[],
  evidenceMode: CivilizationScenarioEvidenceModeV1,
): string[] {
  const byConstraint = profiles.flatMap((profile) => CONSTRAINT_EVIDENCE[profile] ?? []);
  const tierEvidence =
    evidenceMode === "source_backed_observation" || evidenceMode === "current_observation"
      ? ["claim_receipt_identity", "source_scope_and_timestamp"]
      : ["source_backed_capacity_measurements", "claim_tier_upgrade_receipts"];
  return unique([...byConstraint, ...tierEvidence, "collaboration_factor_measurements"]);
}

function buildProceduralBindings(profiles: CivilizationConstraintProfileV1[]): CivilizationScenarioFrameV1["proceduralBindings"] {
  const theoryBindingHints = unique([
    ...(profiles.includes("energy_limited") ? ["energy_budget", "open_system_entropy_flow"] : []),
    ...(profiles.includes("material_limited") ? ["material_inventory", "conservation_accounting"] : []),
    ...(profiles.includes("manufacturing_limited") ? ["manufacturing_resolution", "throughput_bounds"] : []),
    ...(profiles.includes("thermal_limited") || profiles.includes("ecological_sink_limited") ? ["entropy_sink_capacity"] : []),
    ...(profiles.includes("compute_limited") || profiles.includes("signal_latency_limited") ? ["compute_signal_limits"] : []),
  ]);
  const moralBindingHints = unique([
    ...(profiles.includes("governance_limited") ? ["review", "contestability"] : []),
    ...(profiles.includes("consent_limited") ? ["affected_party_consent", "non_harm"] : []),
    ...(profiles.includes("observability_limited") ? ["uncertainty", "direct_observation"] : []),
    "analogy_only_boundary",
  ]);
  return {
    theoryBindingHints: theoryBindingHints.length > 0 ? theoryBindingHints : ["physical_capacity_bounds"],
    moralBindingHints,
    bridgeHooks: ["constraint_profile_to_theory_badges", "evidence_mode_to_claim_tier", "procedural_admissibility_to_moral_nodes"],
  };
}

function buildEditorList(profiles: CivilizationConstraintProfileV1[]): CivilizationScenarioEditorKindV1[] {
  const editors: CivilizationScenarioEditorKindV1[] = [
    "boundary",
    "agent",
    "capability",
    "resource",
    "constraint",
    "timeline",
    "evidence",
    "moral_binding",
    "theory_binding",
  ];
  if (profiles.includes("governance_limited") || profiles.includes("consent_limited")) {
    editors.push("governance");
  }
  return unique(editors);
}

export async function runHelixAskCivilizationScenarioFrameTool(
  input: HelixAskCivilizationScenarioFrameToolInput,
): Promise<HelixAskCivilizationScenarioFrameToolOutput> {
  const prompt = input.prompt.trim();
  const refs = unique(input.refs ?? []);
  const preset = selectPreset(prompt);
  const constraintProfiles = overlayPromptConstraints(prompt, preset.constraintProfiles);
  const evidenceMode = selectEvidenceMode(prompt, refs, input);
  const missingEvidence = buildMissingEvidence(constraintProfiles, evidenceMode);
  const proceduralBindings = buildProceduralBindings(constraintProfiles);
  const frame = buildCivilizationScenarioFrameV1({
    frameId: stableFrameId(prompt),
    title: /\bneedle hull\b/i.test(prompt)
      ? "Needle Hull declared civilization frame"
      : `${preset.family.replace(/_/g, " ")} frame`,
    family: preset.family,
    boundaryKind: preset.boundaryKind,
    developmentalStage: preset.developmentalStage,
    substrateKind: preset.substrateKind,
    agencyModel: preset.agencyModel,
    coordinationMode: preset.coordinationMode,
    constraintProfiles,
    evidenceMode,
    promptSummary: clip(prompt),
    stageInheritance: {
      priorStage:
        preset.developmentalStage === "planetary_coordination"
          ? "industrial_system"
          : preset.developmentalStage === "industrial_system"
            ? "settlement"
            : preset.developmentalStage === "group_coordination"
              ? "embodied_agent"
              : null,
      inheritedConditions: [
        "prior stage constraints become initial conditions, not proof of feasibility",
        "unmeasured capacities remain missing evidence",
      ],
      changedControlVariables: unique([
        ...constraintProfiles,
        preset.coordinationMode,
        preset.agencyModel,
      ]),
    },
    boundedActorGrammar: {
      actorUnit: preset.boundaryKind,
      resourceInputs: preset.resourceInputs,
      capabilitySurfaces: preset.capabilitySurfaces,
      constraintInterfaces: constraintProfiles,
      admissibleMoveKinds: preset.admissibleMoveKinds,
      blockedMoveKinds: [
        "treat generated frame as observed reality",
        "treat physical analogy as moral proof",
        "authorize execution without separate terminal authority",
      ],
      evidenceRefs: refs,
    },
    proceduralBindings,
    suggestedEditors: buildEditorList(constraintProfiles),
    defaultQuestions: preset.defaultQuestions,
    missingEvidence,
    refs,
  });
  const issues = validateCivilizationScenarioFrameV1(frame);
  if (issues.length > 0) {
    throw new Error(`civilization_scenario_frame_invalid:${issues.join("; ")}`);
  }
  return {
    frame,
    missingEvidence,
    suggestedRoadmapInputs: frame.suggestedRoadmapInputs,
  };
}

export const civilizationScenarioFrameSpec: ToolSpecShape = {
  name: HELIX_ASK_CIVILIZATION_SCENARIO_FRAME_TOOL_NAME,
  desc:
    "Deterministic read-only Civilization Scenario Frame builder. Classifies a prompt into bounded civilization grammar axes, missing evidence, claim tier, and suggested roadmap inputs. Never final authority, scenario finality, prediction certification, policy finality, or execution permission.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: { type: "string" },
      refs: { type: "array", items: { type: "string" } },
      options: {
        type: "object",
        properties: {
          allowFictional: { type: "boolean" },
          allowHistorical: { type: "boolean" },
          includeNeedleScenarioFallback: { type: "boolean" },
        },
      },
    },
    required: ["prompt"],
  },
  outputSchema: {
    type: "object",
    properties: {
      frame: { type: "object" },
      missingEvidence: { type: "array", items: { type: "string" } },
      suggestedRoadmapInputs: { type: "object" },
    },
    required: ["frame", "missingEvidence", "suggestedRoadmapInputs"],
  },
  deterministic: true,
  rateLimit: { rpm: 120 },
  safety: { risks: [] },
  risk: {
    writesFiles: false,
    touchesNetwork: false,
    privileged: false,
  },
  provenance: {
    maturity: "diagnostic",
    certifying: false,
    metadataComplete: true,
    sourceClass: "declared",
  },
  health: "ok",
};

export const civilizationScenarioFrameHandler: ToolHandler = async (input: unknown) => {
  const parsed = CivilizationScenarioFrameToolInputSchema.parse(input);
  return runHelixAskCivilizationScenarioFrameTool({
    prompt: parsed.prompt,
    refs: parsed.refs,
    options: parsed.options,
  });
};
