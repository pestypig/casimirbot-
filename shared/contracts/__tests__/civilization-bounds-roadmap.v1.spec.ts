import { describe, expect, it } from "vitest";
import {
  buildCivilizationBoundsRoadmapV1,
  buildCivilizationCollaborationBoundV1,
  computeCivilizationCollaborationValueV1,
  validateCivilizationBoundsRoadmapV1,
  type CivilizationBoundsRoadmapV1,
} from "../civilization-bounds-roadmap.v1";

function buildValidRoadmap(): CivilizationBoundsRoadmapV1 {
  return buildCivilizationBoundsRoadmapV1({
    generatedAt: "2026-06-08T00:00:00.000Z",
    roadmapId: "civilization-bounds:test",
    title: "Civilization Bounds Roadmap",
    scenarioId: "test-scenario",
    activeLayerModes: ["ideal_bounds"],
    phases: [
      {
        phaseId: "P0",
        label: "P0",
        start: 0,
        end: 5,
        claimTier: "declared_scenario",
        evidenceRefs: ["fixture:phase"],
      },
    ],
    systems: [
      {
        systemId: "system:a",
        label: "System A",
        scopeBoundary: "research_program",
        timeHorizon: { mode: "relative_years", start: 0, end: 5 },
        capabilities: ["power_grid"],
        dependencies: ["dependency:materials"],
        risks: ["capacity_measurements_missing"],
        evidenceRefs: ["fixture:system"],
        claimTier: "declared_scenario",
      },
    ],
    badges: [
      {
        badgeId: "badge:a",
        label: "System A",
        kind: "system_actor",
        systemId: "system:a",
        phaseId: "P0",
        coordinates: { lat: 0, lon: 0 },
        layerMode: "ideal_bounds",
        weight: 0.4,
        confidence: 0.35,
        missingEvidence: ["capacity_receipt"],
        evidenceRefs: ["fixture:badge"],
        claimTier: "declared_scenario",
      },
    ],
    edges: [
      {
        edgeId: "edge:a",
        fromBadgeId: "badge:a",
        toBadgeId: "badge:a",
        relation: "observes",
        confidence: 0.35,
        evidenceRefs: ["fixture:edge"],
        claimTier: "declared_scenario",
      },
    ],
    collaborationBounds: [
      buildCivilizationCollaborationBoundV1({
        boundId: "bound:a",
        fromSystemId: "system:a",
        toSystemId: "system:a",
        physicalCapacityMargin: 1.4,
        materialAvailability: 0.5,
        energyMargin: 0.8,
        interfaceCompatibility: 0.7,
        evidenceQuality: 0.4,
        proceduralAdmissibility: 0.3,
        reversibilityMargin: 0.6,
        missingEvidence: ["review_receipt"],
        evidenceRefs: ["fixture:bound"],
        claimTier: "declared_scenario",
      }),
    ],
    falsificationHooks: [
      {
        hookId: "hook:a",
        claimId: "claim:a",
        metric: "capacity",
        threshold: "source-backed",
        horizon: "before promotion",
        revisionTrigger: "capacity receipt contradicts declared bound",
        evidenceRefs: ["fixture:hook"],
      },
    ],
    theoryBindings: [
      {
        badgeId: "badge:a",
        theoryBadgeIds: ["physics.symmetry.energy_momentum_conservation"],
        relation: "bounds",
        evidenceRefs: ["fixture:theory"],
      },
    ],
    zenBindings: [
      {
        badgeId: "badge:a",
        zenNodeIds: ["fairness-due-process-and-justification"],
        proceduralEffect: "Require review before strengthening the claim.",
        refusesAuthority: ["moral_finality", "policy_finality"],
        evidenceRefs: ["fixture:zen"],
      },
    ],
    missingEvidence: ["capacity_receipt"],
  });
}

describe("civilization bounds roadmap v1", () => {
  it("validates a read-only evidence artifact", () => {
    const roadmap = buildValidRoadmap();
    expect(validateCivilizationBoundsRoadmapV1(roadmap)).toEqual([]);
    expect(roadmap.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
      prediction_finality: false,
      policy_finality: false,
      moral_finality: false,
      execution_permission: false,
    });
    expect(roadmap.parameterScopes).toEqual([]);
    expect(roadmap.actionChannels).toEqual([]);
    expect(roadmap.proceduralScaffold.scaffoldId).toBe("spore_civilization_stage_procedural_scaffold");
    expect(roadmap.proceduralScaffold.blockedInterpretations).toEqual(
      expect.arrayContaining(["Spore mechanics are not a history model."]),
    );
  });

  it("clamps collaboration factors before computing collaborationValue", () => {
    const value = computeCivilizationCollaborationValueV1({
      physicalCapacityMargin: 2,
      materialAvailability: 0.5,
      energyMargin: -1,
      interfaceCompatibility: 0.7,
      evidenceQuality: 0.4,
      proceduralAdmissibility: 0.3,
      reversibilityMargin: 0.6,
    });
    expect(value).toBe(0);

    const bound = buildCivilizationCollaborationBoundV1({
      boundId: "bound:clamped",
      fromSystemId: "a",
      toSystemId: "b",
      physicalCapacityMargin: 2,
      materialAvailability: 0.5,
      energyMargin: 0.8,
      interfaceCompatibility: 0.7,
      evidenceQuality: 0.4,
      proceduralAdmissibility: 0.3,
      reversibilityMargin: 0.6,
      missingEvidence: [],
      evidenceRefs: [],
      claimTier: "declared_scenario",
    });
    expect(bound.physicalCapacityMargin).toBe(1);
    expect(bound.collaborationValue).toBe(0.0252);
    expect(bound.limitingFactor).toBe("proceduralAdmissibility");
  });

  it("rejects forbidden finality language", () => {
    const roadmap = buildValidRoadmap();
    const issues = validateCivilizationBoundsRoadmapV1({
      ...roadmap,
      title: "prediction guaranteed",
    });
    expect(issues.some((issue) => issue.includes("forbidden civilization bounds finality text"))).toBe(true);
  });

  it("rejects authority promotion", () => {
    const roadmap = buildValidRoadmap();
    const issues = validateCivilizationBoundsRoadmapV1({
      ...roadmap,
      authority: {
        ...roadmap.authority,
        terminal_eligible: true,
      },
    });
    expect(issues).toContain("authority.terminal_eligible must be false");
  });

  it("validates procedural comparison fields exposed to tool calls", () => {
    const roadmap = buildCivilizationBoundsRoadmapV1({
      ...buildValidRoadmap(),
      parameterScopes: [
        {
          scopeId: "parameter:material_base",
          kind: "material_base",
          label: "Material base",
          description: "Resource and production constraints.",
          indicatorRefs: ["world_bank.world_development_indicators"],
          missingEvidence: ["material_inventory_receipts"],
          evidenceRefs: ["fixture:parameter"],
          claimTier: "declared_scenario",
        },
      ],
      actionChannels: [
        {
          channelId: "action-channel:economic",
          kind: "economic",
          label: "Economic channel",
          sporeAnalogy: "trade route",
          realWorldInterpretation: "Trade and supply-chain dependency.",
          admissibleUses: ["compare dependencies"],
          blockedUses: ["certify forecasts"],
          evidenceRefs: ["fixture:channel"],
          claimTier: "declared_scenario",
        },
      ],
      dependencyChains: [
        {
          chainId: "chain:a",
          label: "Chain A",
          nodeBadgeIds: ["badge:a"],
          edgeIds: ["edge:a"],
          bottlenecks: ["material_inventory_receipts"],
          missingEvidence: ["material_inventory_receipts"],
          evidenceRefs: ["fixture:chain"],
          claimTier: "declared_scenario",
        },
      ],
      comparisonCases: [
        {
          caseId: "comparison:a",
          label: "Stable peer",
          sourceClass: "historical_case",
          similarityAxes: ["material_base"],
          blockers: ["named_case_refs"],
          evidenceRefs: ["fixture:comparison"],
          claimTier: "declared_scenario",
        },
      ],
      hypothesisClaims: [
        {
          claimId: "hypothesis:a",
          claim: "This remains a bounded hypothesis.",
          strength: "bounded",
          blockers: ["counterevidence_refs"],
          evidenceRefs: ["fixture:hypothesis"],
          claimTier: "declared_scenario",
        },
      ],
    });

    expect(validateCivilizationBoundsRoadmapV1(roadmap)).toEqual([]);
    expect(roadmap.parameterScopes[0].kind).toBe("material_base");
    expect(roadmap.actionChannels[0].kind).toBe("economic");
    expect(roadmap.hypothesisClaims[0].strength).toBe("bounded");
  });
});
