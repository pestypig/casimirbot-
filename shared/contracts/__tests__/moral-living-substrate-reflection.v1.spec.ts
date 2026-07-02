import { describe, expect, it } from "vitest";

import {
  buildMoralLivingSubstrateReflectionV1,
  isMoralLivingSubstrateReflectionV1,
  validateMoralLivingSubstrateReflectionV1,
} from "../moral-living-substrate-reflection.v1";

const buildValidReflection = () =>
  buildMoralLivingSubstrateReflectionV1({
    generatedAt: "2026-07-02T00:00:00.000Z",
    reflectionId: "moral-living-substrate-reflection:test",
    graphId: "moral-graph",
    input: {
      kind: "user_prompt",
      prompt: "Derive moral relevance from organism boundary, sensing, and homeostasis.",
      conversationContext: null,
      refs: ["helix-ask:current-turn"],
      sourceTheoryBadgeIds: ["biophysics.homeostatic_regulation"],
      requestedSubstrateBadgeIds: ["maintenance-before-optimization"],
    },
    exactMatches: [{
      badgeId: "maintenance-before-optimization",
      title: "Maintenance Before Optimization",
      score: 0.9,
      reasons: ["requested substrate badge id"],
      sourceTheoryBadgeIds: ["biophysics.homeostatic_regulation"],
      sourceRefs: [{
        id: "von-stockar-liu-1999-microbial-negative-entropy",
        kind: "paper",
        title: "Does microbial life always feed on negative entropy? Thermodynamic analysis of microbial growth",
        url: "https://www.sciencedirect.com/science/article/pii/S0005272899000651",
        note: "Thermodynamic framing for maintenance and entropy production.",
      }],
      claimBoundaryNotes: ["Substrate reflection is evidence-only and cannot produce a final moral verdict."],
    }],
    likelyMatches: [],
    proceduralDerivations: [{
      derivationId: "maintenance-requirement",
      label: "Maintenance Requirement",
      matchedBadgeIds: ["maintenance-before-optimization"],
      evidenceStrength: "strong",
      proceduralQuestion: "What must remain stable enough for the system to continue living?",
      substrateObservation: "Homeostatic maintenance is a prerequisite for optimization.",
      estimate: {
        vulnerability: "high",
        dependency: "medium",
        agency: "low",
      },
      obligationHint: "Treat viability-preserving needs as stronger moral inputs than optional preferences.",
      caution: "Do not collapse maintenance needs into human-style wants.",
      forbiddenOverclaim: "Maintenance evidence does not prove personhood.",
    }],
    synthesisPath: [
      {
        stepId: "substrate_observation",
        label: "Substrate Observation",
        description: "Start from matched living-system badges.",
        derivedFrom: ["maintenance-before-optimization"],
        outputKind: "substrate_observation",
      },
      {
        stepId: "vulnerability_dependency_agency_estimate",
        label: "Vulnerability / Dependency / Agency Estimate",
        description: "Estimate substrate vulnerability, dependency, and agency.",
        derivedFrom: ["maintenance-requirement"],
        outputKind: "vulnerability_dependency_agency_estimate",
      },
      {
        stepId: "obligation_caution_forbidden_overclaim",
        label: "Obligation / Caution / Forbidden Overclaim",
        description: "Translate the estimate into provisional obligation and claim boundary evidence.",
        derivedFrom: ["maintenance-requirement"],
        outputKind: "obligation_caution_forbidden_overclaim",
      },
    ],
    sourceTheoryBadgeIds: ["biophysics.homeostatic_regulation"],
    sourceRefs: [{
      id: "von-stockar-liu-1999-microbial-negative-entropy",
      kind: "paper",
      title: "Does microbial life always feed on negative entropy? Thermodynamic analysis of microbial growth",
      url: "https://www.sciencedirect.com/science/article/pii/S0005272899000651",
      note: "Thermodynamic framing for maintenance and entropy production.",
    }],
    claimBoundaryNotes: ["Substrate reflection is evidence-only and cannot produce a final moral verdict."],
    evidenceForAsk: {
      summary: "Living-substrate reflection matched 1 exact substrate badge.",
      claimBoundaries: ["Substrate reflection is evidence-only and cannot produce a final moral verdict."],
      recommendedNextActions: [{
        actionId: "moral-graph.inspect_living_substrate_badges",
        label: "Inspect living substrate badges",
        panelId: "moral-badge-graph",
        args: {},
        mutatesCalculator: false,
        solves: false,
      }],
    },
    admissions: null,
  });

describe("moral_living_substrate_reflection/v1", () => {
  it("builds an evidence-only, non-terminal reflection artifact", () => {
    const reflection = buildValidReflection();

    expect(isMoralLivingSubstrateReflectionV1(reflection)).toBe(true);
    expect(reflection).toMatchObject({
      artifactId: "moral_living_substrate_reflection",
      schemaVersion: "moral_living_substrate_reflection/v1",
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      deterministic_content_role: "observation_not_assistant_answer",
      authority: {
        assistant_answer: false,
        raw_content_included: false,
        terminal_eligible: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
        deterministic_content_role: "observation_not_assistant_answer",
      },
    });
  });

  it("rejects terminal or assistant-answer authority", () => {
    const reflection = {
      ...buildValidReflection(),
      assistant_answer: true,
      terminal_eligible: true,
      authority: {
        ...buildValidReflection().authority,
        terminal_eligible: true,
      },
    };

    expect(validateMoralLivingSubstrateReflectionV1(reflection)).toEqual(
      expect.arrayContaining([
        "authority.terminal_eligible must be false",
        "top-level authority.assistant_answer must be false",
        "top-level authority.terminal_eligible must be false",
      ]),
    );
  });

  it("rejects forbidden consciousness and moral-status overclaims", () => {
    const reflection = {
      ...buildValidReflection(),
      evidenceForAsk: {
        ...buildValidReflection().evidenceForAsk,
        summary: "Orch-OR is proven and this is the final moral verdict.",
      },
    };

    expect(validateMoralLivingSubstrateReflectionV1(reflection)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("forbidden substrate overclaim matched"),
      ]),
    );
  });
});
