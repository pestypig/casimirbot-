import { describe, expect, it } from "vitest";

import {
  isMoralLivingSubstrateReflectionV1,
  type MoralLivingSubstrateBadgeV1,
} from "../../contracts/moral-living-substrate-reflection.v1";
import {
  MORAL_LIVING_SUBSTRATE_PRINCIPLES,
  MORAL_LIVING_SUBSTRATE_THEORY_BADGE_IDS,
} from "../living-substrate-principles";
import { matchLivingSubstratePrinciples } from "../match-living-substrate-principles";
import { reflectLivingSubstrateContext } from "../living-substrate-reflection-tool";

describe("MoralGraph living substrate reflection", () => {
  it("loads additive substrate principles with source theory links", () => {
    expect(MORAL_LIVING_SUBSTRATE_THEORY_BADGE_IDS).toEqual(
      expect.arrayContaining([
        "biophysics.organism_environment_boundary",
        "biophysics.open_system_entropy_flow",
        "biophysics.sensing_state_discrimination",
        "biophysics.homeostatic_regulation",
        "biophysics.perturbation_response",
        "consciousness.microtubule_orchestration_frontier",
        "consciousness.objective_reduction_frontier",
        "consciousness.anesthetic_microtubule_perturbation",
        "evolution.single_cell_to_multicellular_coordination",
        "frequency.fourier_action_mapping",
      ]),
    );
    expect(MORAL_LIVING_SUBSTRATE_PRINCIPLES.map((principle: MoralLivingSubstrateBadgeV1) => principle.id)).toEqual(
      expect.arrayContaining([
        "boundary-before-obligation",
        "sensing-before-judgment",
        "maintenance-before-optimization",
        "perturbation-response-before-verdict",
        "coordination-before-mandate",
        "scale-continuity-from-cell-to-society",
      ]),
    );
    expect(MORAL_LIVING_SUBSTRATE_PRINCIPLES.every(
      (principle: MoralLivingSubstrateBadgeV1) => principle.sourceTheoryBadgeIds.length > 0,
    )).toBe(true);
  });

  it("matches organism boundary, sensing, homeostasis, and entropy prompts", () => {
    const result = matchLivingSubstratePrinciples({
      text:
        "Derive moral obligations from single cell sensing, homeostasis, entropy gradient pressure, and the organism environment boundary.",
    });
    const ids = [...result.exactMatches, ...result.likelyMatches].map((match) => match.badgeId);

    expect(ids).toEqual(
      expect.arrayContaining([
        "boundary-before-obligation",
        "sensing-before-judgment",
        "maintenance-before-optimization",
      ]),
    );
    expect(result.sourceTheoryBadgeIds).toEqual(
      expect.arrayContaining([
        "biophysics.organism_environment_boundary",
        "biophysics.sensing_state_discrimination",
        "biophysics.homeostatic_regulation",
      ]),
    );
  });

  it("keeps Orch-OR and microtubule prompts behind frontier boundaries", () => {
    const reflection = reflectLivingSubstrateContext({
      prompt:
        "Use Hameroff and Penrose Orch OR microtubule anesthetic perturbation as a frontier mechanism lens, then say what moral classification can derive.",
      sourceTheoryBadgeIds: ["consciousness.objective_reduction_frontier"],
      reflectionId: "moral-living-substrate-reflection:frontier-test",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });
    const ids = [...reflection.exactMatches, ...reflection.likelyMatches].map((match) => match.badgeId);

    expect(isMoralLivingSubstrateReflectionV1(reflection)).toBe(true);
    expect(ids).toContain("microtubule-orch-or-frontier-boundary");
    expect(reflection.claimBoundaryNotes.join("\n")).toContain("Orch-OR is a frontier lens");
    expect(reflection.claimBoundaryNotes.join("\n")).toContain("not terminal answer authority");
  });

  it("routes Fourier action mapping to theory/calculator actions without solving in Moral Graph", () => {
    const reflection = reflectLivingSubstrateContext({
      prompt: "Map single cell to society action with Fourier frequency mapping but keep the moral layer procedural.",
      sourceTheoryBadgeIds: ["frequency.fourier_action_mapping"],
      reflectionId: "moral-living-substrate-reflection:fourier-test",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });

    expect(reflection.evidenceForAsk.recommendedNextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "theory-badge-graph.load_payloads_to_calculator",
          panelId: "scientific-calculator",
          mutatesCalculator: true,
          solves: false,
          args: expect.objectContaining({
            claim_boundary: expect.stringContaining("Moral Graph does not embed equations"),
          }),
        }),
      ]),
    );
    expect(reflection.terminal_eligible).toBe(false);
  });

  it("includes policy admissions only when requested", () => {
    const reflection = reflectLivingSubstrateContext({
      prompt:
        "Use the Moral Graph to derive moral relevance from organism boundary, sensing, homeostasis, and entropy pressure.",
      includeAdmissions: true,
      reflectionId: "moral-living-substrate-reflection:admission-test",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });

    expect(isMoralLivingSubstrateReflectionV1(reflection)).toBe(true);
    expect(reflection.admissions).toMatchObject({
      requested: true,
      toolAdmitted: true,
      reasonCodes: expect.arrayContaining(["living_substrate_reflection_request"]),
      authority: expect.objectContaining({
        assistant_answer: false,
        terminal_eligible: false,
      }),
    });
  });
});
