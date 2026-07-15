import { describe, expect, it } from "vitest";
import {
  buildCivilizationScenarioFrameV1,
  validateCivilizationScenarioFrameV1,
} from "../civilization-scenario-frame.v1";

describe("civilization_scenario_frame/v1", () => {
  it("builds an evidence-only scenario frame with non-terminal authority", () => {
    const frame = buildCivilizationScenarioFrameV1({
      frameId: "civilization-frame:test",
      title: "Planetary trade frame",
      family: "planetary_trade",
      boundaryKind: "planetary_civilization",
      developmentalStage: "planetary_coordination",
      substrateKind: "planetary_infrastructure",
      agencyModel: "market_network",
      coordinationMode: "treaty",
      coordinationProfile: {
        declaredLabels: ["mixed civic order"],
        declaredLabelsAreNonAuthoritative: true,
        allocationChannels: ["market_price", "public_provision"],
        authorityChannels: ["electoral_authority", "administrative_authority"],
        accountabilityChannels: ["election", "court_or_appeal", "public_transparency"],
      },
      constraintProfiles: ["material_limited", "transport_limited", "governance_limited"],
      evidenceMode: "user_hypothesis",
      promptSummary: "Test prompt",
      stageInheritance: {
        priorStage: "industrial_system",
        inheritedConditions: ["industrial capacity is an initial condition"],
        changedControlVariables: ["transport_limited", "governance_limited"],
      },
      boundedActorGrammar: {
        actorUnit: "planetary_civilization",
        resourceInputs: ["supply nodes"],
        capabilitySurfaces: ["dependency mapping"],
        constraintInterfaces: ["transport_limited"],
        admissibleMoveKinds: ["flag bottlenecks"],
        blockedMoveKinds: ["treat generated frame as observed reality"],
        evidenceRefs: ["turn:test"],
      },
      proceduralBindings: {
        theoryBindingHints: ["conservation_accounting"],
        moralBindingHints: ["review"],
        bridgeHooks: ["constraint_profile_to_theory_badges"],
      },
      suggestedEditors: ["boundary", "resource", "constraint", "evidence"],
      defaultQuestions: ["Who supplies what?"],
      missingEvidence: ["material_inventory_receipts"],
      refs: ["turn:test"],
    });

    expect(validateCivilizationScenarioFrameV1(frame)).toEqual([]);
    expect(frame.schemaVersion).toBe("civilization_scenario_frame/v1");
    expect(frame.suggestedRoadmapInputs).toMatchObject({
      boundaryKind: "planetary_civilization",
      developmentalStage: "planetary_coordination",
      evidenceMode: "user_hypothesis",
      coordinationProfile: {
        declaredLabelsAreNonAuthoritative: true,
        allocationChannels: ["market_price", "public_provision"],
      },
    });
    expect(frame.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
      scenario_finality: false,
      prediction_finality: false,
      policy_finality: false,
      moral_finality: false,
      execution_permission: false,
    });
  });

  it("rejects generated frames that claim terminal authority", () => {
    const frame = buildCivilizationScenarioFrameV1({
      title: "Bad authority frame",
      family: "fictional_or_agent_arranged",
      boundaryKind: "fictional_world",
      developmentalStage: "simulation_only",
      substrateKind: "fictional_physics",
      agencyModel: "mixed_agency",
      coordinationMode: "unknown",
      constraintProfiles: ["observability_limited"],
      evidenceMode: "fictional_construct",
      promptSummary: "Test prompt",
      stageInheritance: { inheritedConditions: [], changedControlVariables: [] },
      boundedActorGrammar: {
        actorUnit: "fictional_world",
        resourceInputs: [],
        capabilitySurfaces: [],
        constraintInterfaces: [],
        admissibleMoveKinds: [],
        blockedMoveKinds: [],
        evidenceRefs: [],
      },
      proceduralBindings: { theoryBindingHints: [], moralBindingHints: [], bridgeHooks: [] },
      suggestedEditors: ["boundary"],
      defaultQuestions: [],
      missingEvidence: [],
      refs: [],
    }) as any;
    frame.authority.terminal_eligible = true;

    expect(validateCivilizationScenarioFrameV1(frame)).toEqual(
      expect.arrayContaining(["authority.terminal_eligible_not_false"]),
    );
  });
});
