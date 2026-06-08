import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import type {
  CivilizationBoundsBridgeContextV1,
  CivilizationBoundsRoadmapV1,
  CivilizationLayerModeV1,
} from "@shared/civilization-bounds-roadmap";
import { validateCivilizationBoundsRoadmapV1 } from "@shared/civilization-bounds-roadmap";
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
  refs?: string[];
  options?: {
    includeBridgeContext?: boolean;
    includeCollaborationBounds?: boolean;
    includeFalsificationHooks?: boolean;
  };
};

export type HelixAskCivilizationBoundsToolOutput = {
  roadmap: CivilizationBoundsRoadmapV1;
  bridgeContext?: CivilizationBoundsBridgeContextV1;
};

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
  const scenarioId = input.scenarioId ?? NEEDLE_CIVILIZATION_BOUNDS_SCENARIO_ID;
  const roadmap = buildNeedleCivilizationBoundsScenario();
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
    refs: parsed.refs,
    options: parsed.options,
  });
};
