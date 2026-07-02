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
        "thermodynamics.low_entropy_source_sink",
        "thermodynamics.energy_gradient_flux",
        "prebiotic.inorganic_compartment_gradient",
        "prebiotic.concentration_before_replication",
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
    expect(MORAL_LIVING_SUBSTRATE_PRINCIPLES.map((principle: MoralLivingSubstrateBadgeV1) => principle.id).slice(0, 19)).toEqual([
        "gradient-before-boundary",
        "flux-before-action",
        "compartment-before-organism",
        "concentration-before-replication",
        "boundary-before-obligation",
        "sensing-before-judgment",
        "maintenance-before-optimization",
        "perturbation-response-before-verdict",
        "valence-before-preference",
        "affordance-before-action",
        "actuation-before-agency",
        "feedback-before-learning",
        "memory-before-commitment",
        "prediction-before-planning",
        "choice-before-mandate",
        "coordination-before-mandate",
        "communication-before-norm",
        "reciprocity-before-law",
        "scale-continuity-from-cell-to-society",
    ]);
    expect(MORAL_LIVING_SUBSTRATE_PRINCIPLES.every(
      (principle: MoralLivingSubstrateBadgeV1) => principle.sourceTheoryBadgeIds.length > 0,
    )).toBe(true);
  });

  it("matches pre-boundary conditions and keeps physics mechanisms theory-owned", () => {
    const reflection = reflectLivingSubstrateContext({
      prompt:
        "Trace low-entropy sunlight against a dark sky, energy gradient flux, hydrothermal vent proton gradients, mineral compartments, and concentration before replication. Include mechanism and equations as theory-owned context.",
      reflectionId: "moral-living-substrate-reflection:pre-boundary-test",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });
    const ids = [...reflection.exactMatches, ...reflection.likelyMatches].map((match) => match.badgeId);

    expect(ids).toEqual(
      expect.arrayContaining([
        "gradient-before-boundary",
        "flux-before-action",
        "compartment-before-organism",
        "concentration-before-replication",
      ]),
    );
    expect(reflection.sourceTheoryBadgeIds).toEqual(
      expect.arrayContaining([
        "thermodynamics.low_entropy_source_sink",
        "thermodynamics.energy_gradient_flux",
        "prebiotic.inorganic_compartment_gradient",
        "prebiotic.concentration_before_replication",
      ]),
    );
    expect(reflection.sourceRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "penrose-2018-low-entropy-sun-dark-sky",
          url: "https://link.springer.com/article/10.1007/s10701-018-0162-3",
        }),
        expect.objectContaining({
          id: "herschy-2014-origin-life-reactor-alkaline-vents",
          url: "https://link.springer.com/article/10.1007/s00239-014-9658-4",
        }),
      ]),
    );
    expect(reflection.proceduralDerivations.map((derivation) => derivation.derivationId)).toEqual(
      expect.arrayContaining(["gradient-condition", "flux-condition", "compartment-condition", "concentration-condition"]),
    );
    expect(reflection.evidenceForAsk.recommendedNextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "theory-badge-graph.reflect_discussion_context",
          panelId: "theory-badge-graph",
          args: expect.objectContaining({
            claim_boundary: expect.stringContaining("Theory Badge Graph-owned"),
          }),
        }),
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

  it("matches action and volition middle layers without treating them as personhood proof", () => {
    const prompt =
      "Trace valence before preference, affordance before action, actuation before agency, feedback before learning, memory before commitment, prediction before planning, choice before mandate, communication before norm, and reciprocity before law.";
    const result = matchLivingSubstratePrinciples({
      text: prompt,
      limit: 12,
    });
    const ids = [...result.exactMatches, ...result.likelyMatches].map((match) => match.badgeId);

    expect(ids).toEqual(
      expect.arrayContaining([
        "valence-before-preference",
        "affordance-before-action",
        "actuation-before-agency",
        "feedback-before-learning",
        "memory-before-commitment",
        "prediction-before-planning",
        "choice-before-mandate",
        "communication-before-norm",
        "reciprocity-before-law",
      ]),
    );
    expect(result.claimBoundaryNotes.join("\n")).toContain("not proof of human-like preference");
    expect(result.claimBoundaryNotes.join("\n")).toContain("not proof of free will or personhood");

    const reflection = reflectLivingSubstrateContext({
      prompt,
      limit: 12,
      reflectionId: "moral-living-substrate-reflection:action-chain-test",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });
    expect(reflection.proceduralChain).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromBadgeId: "sensing-before-judgment",
          toBadgeId: "valence-before-preference",
          transitionLabel: "sensing to valence",
          evidenceStrength: "partial",
          missingEvidence: ["sensing-before-judgment"],
          forbiddenOverclaim: expect.stringContaining("human-like preference"),
        }),
        expect.objectContaining({
          fromBadgeId: "prediction-before-planning",
          toBadgeId: "choice-before-mandate",
          transitionLabel: "prediction to choice",
          evidenceStrength: "present",
          missingEvidence: [],
          forbiddenOverclaim: expect.stringContaining("free will"),
        }),
        expect.objectContaining({
          fromBadgeId: "communication-before-norm",
          toBadgeId: "reciprocity-before-law",
          transitionLabel: "communication to reciprocity",
          evidenceStrength: "present",
          forbiddenOverclaim: expect.stringContaining("legal authority"),
        }),
      ]),
    );
  });

  it("derives procedural substrate layers before moral claims", () => {
    const reflection = reflectLivingSubstrateContext({
      prompt:
        "Derive moral obligations from organism boundary, sensing, homeostasis, perturbation cost, dependency scale, entropy pressure, and claim boundaries.",
      reflectionId: "moral-living-substrate-reflection:procedural-layer-test",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });

    expect(isMoralLivingSubstrateReflectionV1(reflection)).toBe(true);
    expect(reflection.proceduralDerivations.map((derivation) => derivation.derivationId)).toEqual(
      expect.arrayContaining([
        "boundary-integrity",
        "maintenance-requirement",
        "sensing-and-error",
        "perturbation-cost",
        "dependency-and-scale",
        "obligation-emergence",
        "claim-boundary",
      ]),
    );
    expect(reflection.proceduralDerivations.find((derivation) => derivation.derivationId === "obligation-emergence"))
      .toMatchObject({
        estimate: {
          vulnerability: "medium",
          dependency: "medium",
          agency: "medium",
        },
        obligationHint: expect.stringContaining("provisional care constraints"),
        forbiddenOverclaim: expect.stringContaining("personhood"),
      });
    const maintenanceLink = reflection.proceduralChain.find(
      (step) => step.fromBadgeId === "boundary-before-obligation" && step.toBadgeId === "maintenance-before-optimization",
    );
    expect(maintenanceLink).toMatchObject({
      evidenceStrength: "present",
      missingEvidence: [],
    });
    const valenceLink = reflection.proceduralChain.find(
      (step) => step.fromBadgeId === "sensing-before-judgment" && step.toBadgeId === "valence-before-preference",
    );
    expect(valenceLink).toMatchObject({
      evidenceStrength: "present",
      missingEvidence: [],
      forbiddenOverclaim: expect.stringContaining("human-like preference"),
    });
    const scaleLink = reflection.proceduralChain.find(
      (step) => step.toBadgeId === "scale-continuity-from-cell-to-society",
    );
    expect(scaleLink).toMatchObject({
      evidenceStrength: "partial",
      missingEvidence: ["reciprocity-before-law"],
      forbiddenOverclaim: expect.stringContaining("institutional mandates"),
    });
    expect(reflection.synthesisPath.map((step) => step.outputKind)).toEqual([
      "substrate_observation",
      "vulnerability_dependency_agency_estimate",
      "obligation_caution_forbidden_overclaim",
    ]);
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
