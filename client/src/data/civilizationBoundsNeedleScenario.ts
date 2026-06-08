import {
  buildCivilizationBoundsRoadmapV1,
  buildCivilizationCollaborationBoundV1,
  type CivilizationBoundsBadgeV1,
  type CivilizationBoundsBridgeContextV1,
  type CivilizationBoundsEdgeV1,
  type CivilizationBoundsRoadmapV1,
  type CivilizationClaimTierV1,
  type CivilizationLayerModeV1,
  type CivilizationPhaseV1,
  type CivilizationSystemV1,
} from "@shared/civilization-bounds-roadmap";
import {
  COUNTRY_PROGRAM_ROLES,
  PHASE_DEFS,
  type CountryProgramRole,
  type PhaseId,
} from "./needleWorldRoles";

export const NEEDLE_CIVILIZATION_BOUNDS_SCENARIO_ID =
  "needle_hull_ideal_global_construction" as const;

const CLAIM_TIER: CivilizationClaimTierV1 = "declared_scenario";
const LAYER_MODE: CivilizationLayerModeV1 = "ideal_bounds";
const EVIDENCE_PREFIX = "declared:needle-world-roles";
const MAX_COLLABORATION_BOUNDS = 4;

const PHASE_ORDER: PhaseId[] = ["P0", "P1", "P2", "P3", "P4"];

const CAPABILITY_KIND_HINTS: Array<{
  pattern: RegExp;
  theoryBadgeIds: string[];
  zenNodeIds: string[];
  relation: "supports" | "constrains" | "requires" | "bounds" | "analogy_only";
  proceduralEffect: string;
}> = [
  {
    pattern: /(?:power|hvdc|cryoplant|rf|q_devices|grid|energy)/i,
    theoryBadgeIds: [
      "physics.symmetry.energy_momentum_conservation",
      "physics.gr.stress_energy_conservation",
    ],
    zenNodeIds: [
      "impermanence-entropy-and-revision",
      "skillful-action-under-uncertainty",
    ],
    relation: "bounds",
    proceduralEffect: "Energy and thermal capacity bound claim strength and require revision triggers.",
  },
  {
    pattern: /(?:material|rare_earth|tungsten|fab|metrology|tile|manufactur)/i,
    theoryBadgeIds: [
      "biophysics.membrane.open_system_entropy_flow",
      "physics.symmetry.energy_momentum_conservation",
    ],
    zenNodeIds: [
      "direct-observation-before-claim",
      "provenance-protocol",
    ],
    relation: "requires",
    proceduralEffect: "Material inventory and fabrication claims require observed source and provenance checks.",
  },
  {
    pattern: /(?:governance|ethics|education|citizen|sensor|observatory)/i,
    theoryBadgeIds: ["observation", "provenance", "falsifiability"],
    zenNodeIds: [
      "fairness-due-process-and-justification",
      "feedback-loop-hygiene",
      "non-harm-and-compassionate-constraint",
    ],
    relation: "constrains",
    proceduralEffect: "Review coverage and observation gaps constrain procedural posture.",
  },
];

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function phaseWeight(role: CountryProgramRole, phaseId: PhaseId): number {
  return role.phases.find((phase) => phase.phaseId === phaseId)?.costShareEstimate ?? 0;
}

function systemIdForRole(role: CountryProgramRole, index: number, seen: Set<string>): string {
  const base = `needle:${slug(role.iso2 || role.name) || `system-${index + 1}`}`;
  if (!seen.has(base)) {
    seen.add(base);
    return base;
  }
  const next = `${base}:${index + 1}`;
  seen.add(next);
  return next;
}

function evidenceRefForRole(role: CountryProgramRole): string {
  return `${EVIDENCE_PREFIX}:${role.iso2.toLowerCase()}`;
}

function capabilityEvidenceRef(systemId: string, capability: string): string {
  return `${EVIDENCE_PREFIX}:${systemId}:capability:${slug(capability)}`;
}

function phaseEvidenceRef(phaseId: PhaseId): string {
  return `${EVIDENCE_PREFIX}:phase:${phaseId}`;
}

function buildPhases(): CivilizationPhaseV1[] {
  return PHASE_ORDER.map((phaseId) => {
    const def = PHASE_DEFS[phaseId];
    return {
      phaseId,
      label: `${phaseId} (${def.startYear}-${def.endYear}y)`,
      start: def.startYear,
      end: def.endYear,
      summary: def.summary,
      claimTier: CLAIM_TIER,
      evidenceRefs: [phaseEvidenceRef(phaseId)],
    };
  });
}

function buildSystems(roles: CountryProgramRole[]): Array<{
  role: CountryProgramRole;
  system: CivilizationSystemV1;
}> {
  const seen = new Set<string>();
  return roles.map((role, index) => {
    const systemId = systemIdForRole(role, index, seen);
    const evidenceRefs = [evidenceRefForRole(role)];
    const capabilities = unique(role.capabilities);
    const system: CivilizationSystemV1 = {
      systemId,
      label: role.name,
      scopeBoundary: "research_program",
      timeHorizon: {
        mode: "relative_years",
        start: Math.min(...role.phases.map((phase) => phase.startYear)),
        end: Math.max(...role.phases.map((phase) => phase.endYear)),
      },
      populationOrAgents: {
        description: "Declared scenario actor converted from the Needle role dataset.",
        agentClasses: ["bounded_system_actor"],
      },
      energyBudget: {
        label: "Declared energy capacity envelope",
        description: capabilities.some((capability) => /power|hvdc|cryoplant/i.test(capability))
          ? "Energy infrastructure capability is declared in the scenario data."
          : "No direct energy infrastructure capability is declared for this system actor.",
        confidence: 0.35,
        evidenceRefs,
      },
      materialInventory: capabilities
        .filter((capability) => /material|rare_earth|tungsten|fab|tile/i.test(capability))
        .slice(0, 6)
        .map((capability) => ({
          label: capability.replaceAll("_", " "),
          confidence: 0.35,
          evidenceRefs: [capabilityEvidenceRef(systemId, capability)],
        })),
      observabilityCoverage: {
        coverageLabel: capabilities.some((capability) => /sensor|observatory|metrology/i.test(capability))
          ? "declared observability channel"
          : "observability gap",
        coverageScore: capabilities.some((capability) => /sensor|observatory|metrology/i.test(capability)) ? 0.55 : 0.25,
        blindSpots: ["source_backed_capacity_measurements", "live_operational_receipts"],
        evidenceRefs,
      },
      governanceProcess: capabilities.some((capability) => /ethics|governance|education|citizen/i.test(capability))
        ? {
            processId: `${systemId}:declared-governance`,
            label: "Declared review and public-interface capacity",
            decisionRule: "Scenario-level governance capacity only",
            reviewCadence: "Undetermined until source-backed receipts exist",
            evidenceRefs,
          }
        : undefined,
      consentAndReviewInterfaces: [
        {
          interfaceId: `${systemId}:technical-review`,
          label: "Technical review interface",
          interfaceKind: "technical_review",
          coverageScore: capabilities.some((capability) => /metrology|hpc|gr_theory|sensor/i.test(capability)) ? 0.55 : 0.3,
          missingChecks: ["independent_review_receipts", "capacity_audit_refs"],
          evidenceRefs,
        },
        {
          interfaceId: `${systemId}:ethics-review`,
          label: "Ethics and affected-party review interface",
          interfaceKind: capabilities.some((capability) => /ethics|governance|citizen/i.test(capability))
            ? "ethics_review"
            : "unknown",
          coverageScore: capabilities.some((capability) => /ethics|governance|citizen/i.test(capability)) ? 0.5 : 0.2,
          missingChecks: ["affected_party_review_scope", "contestability_process"],
          evidenceRefs,
        },
      ],
      capabilities,
      dependencies: unique(
        capabilities
          .filter((capability) => /launch|grid|hvdc|rare_earth|tungsten|cryoplant|fab/i.test(capability))
          .map((capability) => `dependency:${capability}`),
      ),
      risks: [
        "declared_scenario_not_observed",
        "capacity_measurements_missing",
        "procedural_review_receipts_missing",
      ],
      evidenceRefs,
      claimTier: CLAIM_TIER,
    };
    return { role, system };
  });
}

function phaseBadgeId(systemId: string, phaseId: PhaseId): string {
  return `${systemId}:phase:${phaseId}:system`;
}

function capabilityBadgeId(systemId: string, phaseId: PhaseId, capability: string): string {
  return `${systemId}:phase:${phaseId}:capability:${slug(capability)}`;
}

function bindingForCapability(capability: string) {
  return CAPABILITY_KIND_HINTS.find((hint) => hint.pattern.test(capability));
}

function buildBadgesAndBindings(
  entries: Array<{ role: CountryProgramRole; system: CivilizationSystemV1 }>,
): {
  badges: CivilizationBoundsBadgeV1[];
  theoryBindings: CivilizationBoundsRoadmapV1["theoryBindings"];
  zenBindings: CivilizationBoundsRoadmapV1["zenBindings"];
} {
  const badges: CivilizationBoundsBadgeV1[] = [];
  const theoryBindings: CivilizationBoundsRoadmapV1["theoryBindings"] = [];
  const zenBindings: CivilizationBoundsRoadmapV1["zenBindings"] = [];

  for (const { role, system } of entries) {
    for (const phase of role.phases) {
      const systemBadge: CivilizationBoundsBadgeV1 = {
        badgeId: phaseBadgeId(system.systemId, phase.phaseId),
        label: system.label,
        kind: "system_actor",
        systemId: system.systemId,
        phaseId: phase.phaseId,
        coordinates: { lat: role.lat, lon: role.lon },
        layerMode: LAYER_MODE,
        weight: phase.costShareEstimate ?? 0,
        confidence: 0.4,
        missingEvidence: ["source_backed_capacity_measurements"],
        evidenceRefs: [evidenceRefForRole(role), phaseEvidenceRef(phase.phaseId)],
        claimTier: CLAIM_TIER,
      };
      badges.push(systemBadge);

      role.capabilities.slice(0, 8).forEach((capability, index) => {
        const binding = bindingForCapability(capability);
        const badgeId = capabilityBadgeId(system.systemId, phase.phaseId, capability);
        const angle = (Math.PI * 2 * index) / Math.max(role.capabilities.slice(0, 8).length, 1);
        const capabilityBadge: CivilizationBoundsBadgeV1 = {
          badgeId,
          label: capability.replaceAll("_", " "),
          kind: binding ? "capability" : "resource",
          systemId: system.systemId,
          phaseId: phase.phaseId,
          coordinates: {
            lat: role.lat + Math.sin(angle) * 1.5,
            lon: role.lon + Math.cos(angle) * 2.2,
          },
          layerMode: LAYER_MODE,
          weight: Math.max(0.1, (phase.costShareEstimate ?? 0.12) * 0.65),
          confidence: 0.35,
          ...(binding ? { theoryBadgeIds: binding.theoryBadgeIds, zenNodeIds: binding.zenNodeIds } : {}),
          missingEvidence: ["observed_throughput", "source_backed_inventory"],
          evidenceRefs: [capabilityEvidenceRef(system.systemId, capability)],
          claimTier: CLAIM_TIER,
        };
        badges.push(capabilityBadge);
        if (binding) {
          theoryBindings.push({
            badgeId,
            theoryBadgeIds: binding.theoryBadgeIds,
            relation: binding.relation,
            evidenceRefs: capabilityBadge.evidenceRefs,
          });
          zenBindings.push({
            badgeId,
            zenNodeIds: binding.zenNodeIds,
            proceduralEffect: binding.proceduralEffect,
            refusesAuthority: [
              "moral_finality",
              "policy_finality",
              "prediction_finality",
              "execution_authority",
            ],
            evidenceRefs: capabilityBadge.evidenceRefs,
          });
        }
      });
    }
  }

  return { badges, theoryBindings, zenBindings };
}

function buildEdgesAndCollaborations(
  entries: Array<{ role: CountryProgramRole; system: CivilizationSystemV1 }>,
): {
  edges: CivilizationBoundsEdgeV1[];
  collaborationBounds: CivilizationBoundsRoadmapV1["collaborationBounds"];
} {
  const edges: CivilizationBoundsEdgeV1[] = [];
  const collaborationBounds: CivilizationBoundsRoadmapV1["collaborationBounds"] = [];

  for (const phaseId of PHASE_ORDER) {
    const active = entries
      .map((entry) => ({
        ...entry,
        weight: phaseWeight(entry.role, phaseId),
      }))
      .filter((entry) => entry.weight > 0)
      .sort((a, b) => b.weight - a.weight);
    const anchor = active[0];
    if (!anchor) continue;
    for (const entry of active.slice(1, MAX_COLLABORATION_BOUNDS + 1)) {
      const sharedCapabilities = entry.system.capabilities.filter((capability) =>
        anchor.system.capabilities.includes(capability),
      );
      const hasEnergyInterface = [...entry.system.capabilities, ...anchor.system.capabilities].some((capability) =>
        /power|hvdc|cryoplant|grid/i.test(capability),
      );
      const hasGovernanceInterface = [...entry.system.capabilities, ...anchor.system.capabilities].some((capability) =>
        /ethics|governance|citizen|education/i.test(capability),
      );
      const bound = buildCivilizationCollaborationBoundV1({
        boundId: `needle:${phaseId}:bound:${slug(entry.system.systemId)}:to:${slug(anchor.system.systemId)}`,
        fromSystemId: entry.system.systemId,
        toSystemId: anchor.system.systemId,
        physicalCapacityMargin: clamp01((entry.weight + anchor.weight) / 1.2),
        materialAvailability: clamp01(0.25 + sharedCapabilities.length / 12),
        energyMargin: hasEnergyInterface ? 0.55 : 0.3,
        interfaceCompatibility: sharedCapabilities.length > 0 ? 0.65 : 0.35,
        evidenceQuality: 0.35,
        proceduralAdmissibility: hasGovernanceInterface ? 0.55 : 0.3,
        reversibilityMargin: hasGovernanceInterface ? 0.5 : 0.35,
        missingEvidence: [
          "observed_capacity_measurements",
          "source_backed_material_inventory",
          "review_interface_receipts",
        ],
        evidenceRefs: [
          evidenceRefForRole(entry.role),
          evidenceRefForRole(anchor.role),
          phaseEvidenceRef(phaseId),
        ],
        claimTier: CLAIM_TIER,
      });
      collaborationBounds.push(bound);
      edges.push({
        edgeId: `needle:${phaseId}:edge:${slug(entry.system.systemId)}:to:${slug(anchor.system.systemId)}`,
        fromBadgeId: phaseBadgeId(entry.system.systemId, phaseId),
        toBadgeId: phaseBadgeId(anchor.system.systemId, phaseId),
        relation: "collaborates_with",
        weight: bound.collaborationValue,
        confidence: 0.35,
        evidenceRefs: bound.evidenceRefs,
        claimTier: CLAIM_TIER,
      });
    }
  }

  return { edges, collaborationBounds };
}

export function buildNeedleCivilizationBoundsScenario(options?: {
  generatedAt?: string;
}): CivilizationBoundsRoadmapV1 {
  const phases = buildPhases();
  const systemEntries = buildSystems(COUNTRY_PROGRAM_ROLES);
  const { badges, theoryBindings, zenBindings } = buildBadgesAndBindings(systemEntries);
  const { edges, collaborationBounds } = buildEdgesAndCollaborations(systemEntries);
  return buildCivilizationBoundsRoadmapV1({
    generatedAt: options?.generatedAt,
    roadmapId: "civilization-bounds:needle-hull-ideal-global-construction",
    title: "Civilization Bounds Roadmap",
    scenarioId: NEEDLE_CIVILIZATION_BOUNDS_SCENARIO_ID,
    activeLayerModes: [LAYER_MODE],
    phases,
    systems: systemEntries.map((entry) => entry.system),
    badges,
    edges,
    collaborationBounds,
    falsificationHooks: [
      {
        hookId: "needle:declared-scenario-capacity-falsifier",
        claimId: NEEDLE_CIVILIZATION_BOUNDS_SCENARIO_ID,
        metric: "source-backed capacity receipts",
        threshold: "Each promoted capacity badge requires independent source-backed measurements before promotion.",
        horizon: "before any layer-mode promotion out of ideal_bounds",
        revisionTrigger: "Observed capacity, material, energy, or review receipts contradict declared scenario weights.",
        evidenceRefs: [`${EVIDENCE_PREFIX}:falsification-hooks`],
      },
    ],
    theoryBindings,
    zenBindings,
    missingEvidence: [
      "source_backed_capacity_measurements",
      "observed_material_inventory",
      "energy_budget_receipts",
      "review_interface_receipts",
      "live_operational_observations",
    ],
  });
}

export function exportCivilizationBoundsBridgeContext(
  roadmap: CivilizationBoundsRoadmapV1,
  selectedBadgeIds?: string[],
): CivilizationBoundsBridgeContextV1 {
  const selected = selectedBadgeIds?.length
    ? roadmap.badges.filter((badge) => selectedBadgeIds.includes(badge.badgeId))
    : roadmap.badges;
  const selectedIds = new Set(selected.map((badge) => badge.badgeId));
  return {
    theoryBadgeIds: unique([
      ...selected.flatMap((badge) => badge.theoryBadgeIds ?? []),
      ...roadmap.theoryBindings
        .filter((binding) => selectedIds.has(binding.badgeId))
        .flatMap((binding) => binding.theoryBadgeIds),
    ]),
    zenNodeIds: unique([
      ...selected.flatMap((badge) => badge.zenNodeIds ?? []),
      ...roadmap.zenBindings
        .filter((binding) => selectedIds.has(binding.badgeId))
        .flatMap((binding) => binding.zenNodeIds),
    ]),
    systemIds: unique(selected.flatMap((badge) => (badge.systemId ? [badge.systemId] : []))),
    constraints: unique([
      ...selected
        .filter((badge) => badge.kind === "constraint" || badge.kind === "capability" || badge.kind === "resource")
        .map((badge) => badge.label),
      ...roadmap.collaborationBounds.map((bound) => `limiting:${bound.limitingFactor}`),
    ]),
    missingEvidence: unique([
      ...roadmap.missingEvidence,
      ...selected.flatMap((badge) => badge.missingEvidence ?? []),
    ]),
    evidenceRefs: unique([
      ...selected.flatMap((badge) => badge.evidenceRefs),
      ...roadmap.collaborationBounds.flatMap((bound) => bound.evidenceRefs),
    ]),
  };
}
