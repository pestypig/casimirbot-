import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import type {
  CivilizationBoundsBridgeContextV1,
  CivilizationBoundsBadgeV1,
  CivilizationBoundsRoadmapV1,
  CivilizationClaimTierV1,
  CivilizationLayerModeV1,
  CivilizationScopeBoundaryV1,
} from "@shared/civilization-bounds-roadmap";
import {
  buildCivilizationBoundsRoadmapV1,
  buildCivilizationCollaborationBoundV1,
  validateCivilizationBoundsRoadmapV1,
} from "@shared/civilization-bounds-roadmap";
import {
  validateCivilizationScenarioFrameV1,
  type CivilizationConstraintProfileV1,
  type CivilizationScenarioEvidenceModeV1,
  type CivilizationScenarioFrameV1,
} from "@shared/civilization-scenario-frame";
import {
  buildNeedleCivilizationBoundsScenario,
  exportCivilizationBoundsBridgeContext,
  NEEDLE_CIVILIZATION_BOUNDS_SCENARIO_ID,
} from "../../client/src/data/civilizationBoundsNeedleScenario";

export const HELIX_ASK_CIVILIZATION_BOUNDS_TOOL_NAME =
  "helix_ask.reflect_civilization_bounds" as const;

const CivilizationBoundsToolInputSchema = z.object({
  prompt: z.string(),
  scenarioId: z.string().optional(),
  phaseId: z.string().optional(),
  layerMode: z.string().optional(),
  selectedSystemIds: z.array(z.string()).optional(),
  selectedBadgeIds: z.array(z.string()).optional(),
  theoryReflectionRef: z.string().optional(),
  ideologyReflectionRef: z.string().optional(),
  scenarioFrame: z.any().optional(),
  refs: z.array(z.string()).optional(),
  options: z
    .object({
      includeBridgeContext: z.boolean().optional(),
      includeCollaborationBounds: z.boolean().optional(),
      includeFalsificationHooks: z.boolean().optional(),
    })
    .optional(),
});

export type HelixAskCivilizationBoundsToolInput = {
  prompt: string;
  scenarioId?: string;
  phaseId?: string;
  layerMode?: CivilizationLayerModeV1;
  selectedSystemIds?: string[];
  selectedBadgeIds?: string[];
  theoryReflectionRef?: string;
  ideologyReflectionRef?: string;
  scenarioFrame?: CivilizationScenarioFrameV1;
  refs?: string[];
  options?: {
    includeBridgeContext?: boolean;
    includeCollaborationBounds?: boolean;
    includeFalsificationHooks?: boolean;
  };
};

export type HelixAskCivilizationBoundsToolOutput = {
  roadmap: CivilizationBoundsRoadmapV1;
  scenarioFrame?: CivilizationScenarioFrameV1;
  bridgeContext?: CivilizationBoundsBridgeContextV1;
};

const CONSTRAINT_BADGE_LABELS: Record<CivilizationConstraintProfileV1, string> = {
  energy_limited: "Energy budget unknown",
  material_limited: "Material inventory unknown",
  manufacturing_limited: "Manufacturing resolution unknown",
  thermal_limited: "Thermal ceiling unknown",
  compute_limited: "Compute budget unknown",
  signal_latency_limited: "Signal latency unknown",
  transport_limited: "Transport route and latency unknown",
  observability_limited: "Observability coverage unknown",
  governance_limited: "Governance interface unknown",
  consent_limited: "Consent interface unknown",
  ecological_sink_limited: "Ecological sink capacity unknown",
  security_limited: "Security risk interface unknown",
  multi_bottleneck: "Multi-bottleneck dependency graph unknown",
};

const CONSTRAINT_THEORY_BINDINGS: Partial<Record<CivilizationConstraintProfileV1, string[]>> = {
  energy_limited: ["biophysics.membrane.open_system_entropy_flow"],
  material_limited: ["physics.symmetry.energy_momentum_conservation"],
  manufacturing_limited: ["materials.manufacturing.resolution_limit"],
  thermal_limited: ["thermodynamics.heat_sink_capacity"],
  compute_limited: ["information.compute_energy_budget"],
  signal_latency_limited: ["relativity.signal_latency_bound"],
  ecological_sink_limited: ["thermodynamics.entropy_sink_capacity"],
};

const CONSTRAINT_ZEN_BINDINGS: Partial<Record<CivilizationConstraintProfileV1, string[]>> = {
  observability_limited: ["direct_observation", "uncertainty"],
  governance_limited: ["review", "contestability"],
  consent_limited: ["affected_party_consent", "non_harm"],
  security_limited: ["non_harm", "two_key_review"],
  multi_bottleneck: ["revision", "uncertainty"],
};

function slugId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "frame";
}

function evidenceModeToClaimTier(mode: CivilizationScenarioEvidenceModeV1): CivilizationClaimTierV1 {
  switch (mode) {
    case "declared_scenario":
      return "declared_scenario";
    case "historical_replay":
      return "historical_observation";
    case "source_backed_observation":
    case "current_observation":
      return "source_backed_observation";
    case "model_projection":
      return "model_projection";
    case "stress_test":
      return "diagnostic_bound";
    case "user_hypothesis":
    case "fictional_construct":
    case "counterfactual":
    default:
      return "hypothetical";
  }
}

function boundaryKindToScopeBoundary(frame: CivilizationScenarioFrameV1): CivilizationScopeBoundaryV1 {
  switch (frame.boundaryKind) {
    case "city":
    case "settlement":
    case "household":
    case "crew":
    case "tribe":
      return "region";
    case "institution":
    case "firm":
      return "research_program";
    case "supply_chain":
      return "supply_chain";
    case "trade_bloc":
      return "trade_bloc";
    case "polity":
      return "polity";
    case "planetary_civilization":
      return "earth";
    case "interplanetary_civilization":
      return "planetary_colony";
    case "fictional_world":
      return "fictional_world";
    case "abstract_agent_system":
    case "machine_society":
    case "multi_species_ecology":
    case "organism":
    default:
      return "abstract_system";
  }
}

function buildSparseRoadmapFromScenarioFrame(
  frame: CivilizationScenarioFrameV1,
  input: HelixAskCivilizationBoundsToolInput,
): CivilizationBoundsRoadmapV1 {
  const frameSlug = slugId(frame.frameId);
  const systemId = `system:${frameSlug}`;
  const interfaceSystemId = `interface:${frameSlug}`;
  const claimTier = evidenceModeToClaimTier(frame.evidenceMode);
  const frameEvidenceRefs = Array.from(new Set([
    `scenario-frame:${frame.frameId}`,
    ...frame.refs,
    ...(input.refs ?? []),
  ]));
  const constraintProfiles = frame.constraintProfiles.length > 0
    ? frame.constraintProfiles
    : ["multi_bottleneck" as const];
  const constraintBadges: CivilizationBoundsBadgeV1[] = constraintProfiles.map((profile, index) => ({
    badgeId: `badge:${frameSlug}:constraint:${profile}`,
    label: CONSTRAINT_BADGE_LABELS[profile] ?? `${profile} unknown`,
    kind: "constraint",
    systemId,
    phaseId: `phase:${frameSlug}:${frame.developmentalStage}`,
    abstractPosition: { x: 0.25 + index * 0.1, y: 0.45, z: 0 },
    layerMode: "gap_bounds",
    weight: 0.65,
    confidence: frame.evidenceMode === "source_backed_observation" ? 0.55 : 0.35,
    theoryBadgeIds: CONSTRAINT_THEORY_BINDINGS[profile] ?? [],
    zenNodeIds: CONSTRAINT_ZEN_BINDINGS[profile] ?? [],
    missingEvidence: frame.missingEvidence,
    evidenceRefs: frameEvidenceRefs,
    claimTier,
  }));
  const badges: CivilizationBoundsBadgeV1[] = [
    {
      badgeId: `badge:${frameSlug}:bounded_system`,
      label: `Bounded system: ${frame.boundaryKind}`,
      kind: "system_actor",
      systemId,
      phaseId: `phase:${frameSlug}:${frame.developmentalStage}`,
      abstractPosition: { x: 0.1, y: 0.2, z: 0 },
      layerMode: "gap_bounds",
      weight: 0.8,
      confidence: 0.45,
      missingEvidence: frame.missingEvidence,
      evidenceRefs: frameEvidenceRefs,
      claimTier,
    },
    {
      badgeId: `badge:${frameSlug}:stage`,
      label: `Developmental stage: ${frame.developmentalStage}`,
      kind: "capability",
      systemId,
      phaseId: `phase:${frameSlug}:${frame.developmentalStage}`,
      abstractPosition: { x: 0.24, y: 0.2, z: 0 },
      layerMode: "gap_bounds",
      weight: 0.65,
      confidence: 0.4,
      missingEvidence: ["stage_inheritance_receipts", ...frame.missingEvidence],
      evidenceRefs: frameEvidenceRefs,
      claimTier,
    },
    ...constraintBadges,
    {
      badgeId: `badge:${frameSlug}:governance_review`,
      label: "Procedural admissibility unknown",
      kind: "governance_interface",
      systemId: interfaceSystemId,
      phaseId: `phase:${frameSlug}:${frame.developmentalStage}`,
      abstractPosition: { x: 0.72, y: 0.28, z: 0 },
      layerMode: "gap_bounds",
      weight: 0.7,
      confidence: 0.3,
      zenNodeIds: frame.proceduralBindings.zenBindingHints,
      missingEvidence: ["governance_review_record", "affected_party_consent_interface_record"],
      evidenceRefs: frameEvidenceRefs,
      claimTier,
    },
    {
      badgeId: `badge:${frameSlug}:collaboration_bound`,
      label: "Collaboration value unavailable until evidence supplied",
      kind: "collaboration_bound",
      systemId: interfaceSystemId,
      phaseId: `phase:${frameSlug}:${frame.developmentalStage}`,
      abstractPosition: { x: 0.78, y: 0.55, z: 0 },
      layerMode: "gap_bounds",
      weight: 0.75,
      confidence: 0.25,
      missingEvidence: ["collaboration_factor_measurements", ...frame.missingEvidence],
      evidenceRefs: frameEvidenceRefs,
      claimTier,
    },
    {
      badgeId: `badge:${frameSlug}:evidence_tier`,
      label: `Evidence mode: ${frame.evidenceMode}`,
      kind: "observation_gap",
      systemId,
      phaseId: `phase:${frameSlug}:${frame.developmentalStage}`,
      abstractPosition: { x: 0.48, y: 0.72, z: 0 },
      layerMode: "gap_bounds",
      weight: 0.7,
      confidence: 0.5,
      missingEvidence: frame.missingEvidence,
      evidenceRefs: frameEvidenceRefs,
      claimTier,
    },
  ];
  const actorBadgeId = `badge:${frameSlug}:bounded_system`;
  return buildCivilizationBoundsRoadmapV1({
    title: `Sparse Civilization Bounds: ${frame.title}`,
    scenarioId: frame.frameId,
    activeLayerModes: ["gap_bounds", "ideal_bounds"],
    phases: [
      {
        phaseId: `phase:${frameSlug}:${frame.developmentalStage}`,
        label: `${frame.developmentalStage} bounds`,
        start: "prompt_frame",
        end: "evidence_upgrade",
        summary: "Prompt-derived scenario frame with sparse placeholders and missing-evidence hooks.",
        claimTier,
        evidenceRefs: frameEvidenceRefs,
      },
    ],
    systems: [
      {
        systemId,
        label: frame.title,
        scopeBoundary: boundaryKindToScopeBoundary(frame),
        timeHorizon: { mode: "relative_years", start: 0, end: 10 },
        populationOrAgents: {
          description: frame.boundedActorGrammar.actorUnit,
          agentClasses: [frame.agencyModel],
        },
        energyBudget: {
          label: frame.constraintProfiles.includes("energy_limited")
            ? "energy budget unknown"
            : "energy budget not yet bounded",
          value: null,
          unit: null,
          confidence: 0.2,
          evidenceRefs: frameEvidenceRefs,
        },
        materialInventory: [
          {
            label: "material inventory unknown",
            value: null,
            unit: null,
            confidence: 0.2,
            evidenceRefs: frameEvidenceRefs,
          },
        ],
        manufacturingResolution: {
          label: "manufacturing resolution unknown",
          evidenceRefs: frameEvidenceRefs,
        },
        observabilityCoverage: {
          coverageLabel: "observability coverage unknown",
          coverageScore: 0,
          blindSpots: frame.missingEvidence,
          evidenceRefs: frameEvidenceRefs,
        },
        governanceProcess: {
          processId: `governance:${frameSlug}`,
          label: `${frame.coordinationMode} coordination requires review evidence`,
          decisionRule: "unknown",
          reviewCadence: "unknown",
          evidenceRefs: frameEvidenceRefs,
        },
        consentAndReviewInterfaces: [
          {
            interfaceId: `review:${frameSlug}`,
            label: "affected-party review interface unknown",
            interfaceKind: "unknown",
            coverageScore: 0,
            missingChecks: frame.missingEvidence,
            evidenceRefs: frameEvidenceRefs,
          },
        ],
        capabilities: frame.boundedActorGrammar.capabilitySurfaces,
        dependencies: frame.boundedActorGrammar.resourceInputs,
        risks: frame.boundedActorGrammar.constraintInterfaces,
        evidenceRefs: frameEvidenceRefs,
        claimTier,
      },
      {
        systemId: interfaceSystemId,
        label: "External collaboration interface",
        scopeBoundary: "abstract_system",
        timeHorizon: { mode: "relative_years", start: 0, end: 10 },
        capabilities: ["collaboration interface pending evidence"],
        dependencies: ["physical_capacity_margin", "procedural_admissibility", "reversibility_margin"],
        risks: ["overclaiming generated frame as observation"],
        evidenceRefs: frameEvidenceRefs,
        claimTier,
      },
    ],
    badges,
    edges: constraintBadges.map((badge) => ({
      edgeId: `edge:${frameSlug}:${badge.badgeId}`,
      fromBadgeId: actorBadgeId,
      toBadgeId: badge.badgeId,
      relation: "constrains",
      weight: 0.7,
      confidence: 0.35,
      evidenceRefs: frameEvidenceRefs,
      claimTier,
    })),
    collaborationBounds: [
      buildCivilizationCollaborationBoundV1({
        boundId: `collaboration:${frameSlug}:external_interface`,
        fromSystemId: systemId,
        toSystemId: interfaceSystemId,
        physicalCapacityMargin: 0.5,
        materialAvailability: frame.constraintProfiles.includes("material_limited") ? 0.25 : 0.5,
        energyMargin: frame.constraintProfiles.includes("energy_limited") ? 0.25 : 0.5,
        interfaceCompatibility: 0.45,
        evidenceQuality: frame.evidenceMode === "source_backed_observation" ? 0.55 : 0.2,
        proceduralAdmissibility:
          frame.constraintProfiles.includes("governance_limited") || frame.constraintProfiles.includes("consent_limited")
            ? 0.25
            : 0.45,
        reversibilityMargin: frame.evidenceMode === "fictional_construct" ? 0.25 : 0.4,
        limitingFactor: "evidenceQuality",
        missingEvidence: ["collaboration_factor_measurements", ...frame.missingEvidence],
        evidenceRefs: frameEvidenceRefs,
        claimTier,
      }),
    ],
    falsificationHooks: frame.missingEvidence.slice(0, 6).map((missing, index) => ({
      hookId: `hook:${frameSlug}:${slugId(missing)}`,
      claimId: `claim:${frameSlug}:${index}`,
      metric: missing,
      threshold: "receipt supplied or claim remains at generated-frame tier",
      horizon: "before source-backed upgrade",
      revisionTrigger: `Update or remove sparse badge when ${missing} is supplied.`,
      evidenceRefs: frameEvidenceRefs,
    })),
    theoryBindings: constraintBadges.map((badge) => ({
      badgeId: badge.badgeId,
      theoryBadgeIds: badge.theoryBadgeIds?.length ? badge.theoryBadgeIds : frame.proceduralBindings.theoryBindingHints,
      relation: "bounds",
      evidenceRefs: frameEvidenceRefs,
    })),
    zenBindings: badges
      .filter((badge) => badge.kind === "governance_interface" || badge.kind === "observation_gap" || badge.kind === "collaboration_bound")
      .map((badge) => ({
        badgeId: badge.badgeId,
        zenNodeIds: badge.zenNodeIds?.length ? badge.zenNodeIds : frame.proceduralBindings.zenBindingHints,
        proceduralEffect: "Keep generated scenario claims contestable, reviewable, and evidence-tiered.",
        refusesAuthority: ["moral_finality", "policy_finality", "execution_permission"],
        evidenceRefs: frameEvidenceRefs,
      })),
    missingEvidence: frame.missingEvidence,
  });
}

function filterRoadmap(
  roadmap: CivilizationBoundsRoadmapV1,
  input: HelixAskCivilizationBoundsToolInput,
): CivilizationBoundsRoadmapV1 {
  const selectedSystemIds = new Set(input.selectedSystemIds ?? []);
  const selectedBadgeIds = new Set(input.selectedBadgeIds ?? []);
  const selectedPhaseId = input.phaseId;
  const selectedLayer = input.layerMode;
  const shouldFilterSystems = selectedSystemIds.size > 0;
  const shouldFilterBadges = selectedBadgeIds.size > 0;
  const badges = roadmap.badges.filter((badge) => {
    if (selectedPhaseId && badge.phaseId && badge.phaseId !== selectedPhaseId) return false;
    if (selectedLayer && badge.layerMode !== selectedLayer) return false;
    if (shouldFilterBadges && !selectedBadgeIds.has(badge.badgeId)) return false;
    if (shouldFilterSystems && badge.systemId && !selectedSystemIds.has(badge.systemId)) return false;
    return true;
  });
  const badgeIds = new Set(badges.map((badge) => badge.badgeId));
  const systemIds = new Set([
    ...badges.flatMap((badge) => (badge.systemId ? [badge.systemId] : [])),
    ...selectedSystemIds,
  ]);
  return {
    ...roadmap,
    phases: selectedPhaseId
      ? roadmap.phases.filter((phase) => phase.phaseId === selectedPhaseId)
      : roadmap.phases,
    systems: shouldFilterSystems || badges.length !== roadmap.badges.length
      ? roadmap.systems.filter((system) => systemIds.has(system.systemId))
      : roadmap.systems,
    badges,
    edges: roadmap.edges.filter(
      (edge) => badgeIds.has(edge.fromBadgeId) && badgeIds.has(edge.toBadgeId),
    ),
    collaborationBounds: input.options?.includeCollaborationBounds === false
      ? []
      : roadmap.collaborationBounds.filter(
          (bound) =>
            systemIds.size === 0 ||
            (systemIds.has(bound.fromSystemId) && systemIds.has(bound.toSystemId)),
        ),
    falsificationHooks: input.options?.includeFalsificationHooks === false
      ? []
      : roadmap.falsificationHooks,
    theoryBindings: roadmap.theoryBindings.filter((binding) => badgeIds.has(binding.badgeId)),
    zenBindings: roadmap.zenBindings.filter((binding) => badgeIds.has(binding.badgeId)),
  };
}

export async function runHelixAskCivilizationBoundsTool(
  input: HelixAskCivilizationBoundsToolInput,
): Promise<HelixAskCivilizationBoundsToolOutput> {
  const scenarioFrame = input.scenarioFrame;
  if (scenarioFrame) {
    const frameIssues = validateCivilizationScenarioFrameV1(scenarioFrame);
    if (frameIssues.length > 0) {
      throw new Error(`civilization_bounds_invalid_scenario_frame:${frameIssues.join("; ")}`);
    }
  }
  const scenarioId = input.scenarioId;
  const useScenarioFrameRoadmap =
    Boolean(scenarioFrame) &&
    scenarioId !== NEEDLE_CIVILIZATION_BOUNDS_SCENARIO_ID;
  const roadmap = useScenarioFrameRoadmap && scenarioFrame
    ? buildSparseRoadmapFromScenarioFrame(scenarioFrame, input)
    : buildNeedleCivilizationBoundsScenario();
  const filtered = filterRoadmap(
    scenarioId === NEEDLE_CIVILIZATION_BOUNDS_SCENARIO_ID ? roadmap : roadmap,
    input,
  );
  const issues = validateCivilizationBoundsRoadmapV1(filtered);
  if (issues.length > 0) {
    throw new Error(`civilization_bounds_invalid_roadmap:${issues.join("; ")}`);
  }
  return {
    roadmap: filtered,
    ...(scenarioFrame ? { scenarioFrame } : {}),
    ...(input.options?.includeBridgeContext === false
      ? {}
      : {
          bridgeContext: exportCivilizationBoundsBridgeContext(
            filtered,
            input.selectedBadgeIds,
          ),
        }),
  };
}

export const civilizationBoundsRoadmapSpec: ToolSpecShape = {
  name: HELIX_ASK_CIVILIZATION_BOUNDS_TOOL_NAME,
  desc:
    "Deterministic read-only Civilization Bounds Roadmap reflection. Produces evidence-only system bounds, capability/dependency badges, collaboration constraints, missing checks, and optional Theory/Zen bridge context. Never final authority, prediction certification, policy finality, or execution permission.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: { type: "string" },
      scenarioId: { type: "string" },
      phaseId: { type: "string" },
      layerMode: { type: "string" },
      selectedSystemIds: { type: "array", items: { type: "string" } },
      selectedBadgeIds: { type: "array", items: { type: "string" } },
      theoryReflectionRef: { type: "string" },
      ideologyReflectionRef: { type: "string" },
      scenarioFrame: { type: "object" },
      refs: { type: "array", items: { type: "string" } },
      options: {
        type: "object",
        properties: {
          includeBridgeContext: { type: "boolean" },
          includeCollaborationBounds: { type: "boolean" },
          includeFalsificationHooks: { type: "boolean" },
        },
      },
    },
    required: ["prompt"],
  },
  outputSchema: {
    type: "object",
    properties: {
      roadmap: { type: "object" },
      scenarioFrame: { type: "object" },
      bridgeContext: { type: "object" },
    },
    required: ["roadmap"],
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

export const civilizationBoundsRoadmapHandler: ToolHandler = async (input: unknown) => {
  const parsed = CivilizationBoundsToolInputSchema.parse(input);
  return runHelixAskCivilizationBoundsTool({
    prompt: parsed.prompt,
    scenarioId: parsed.scenarioId,
    phaseId: parsed.phaseId,
    layerMode: parsed.layerMode as CivilizationLayerModeV1 | undefined,
    selectedSystemIds: parsed.selectedSystemIds,
    selectedBadgeIds: parsed.selectedBadgeIds,
    theoryReflectionRef: parsed.theoryReflectionRef,
    ideologyReflectionRef: parsed.ideologyReflectionRef,
    scenarioFrame: parsed.scenarioFrame as CivilizationScenarioFrameV1 | undefined,
    refs: parsed.refs,
    options: parsed.options,
  });
};
