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
      claimBoundaryNotes: ["Substrate reflection is evidence-only and cannot produce a final moral verdict."],
    }],
    likelyMatches: [],
    sourceTheoryBadgeIds: ["biophysics.homeostatic_regulation"],
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
