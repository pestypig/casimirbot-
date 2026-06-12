import { describe, expect, it } from "vitest";

import {
  validateTheoryBadgeGraphV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import type { TheoryCalculatorLoadoutItemV1 } from "../../contracts/theory-calculator-loadout.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  CROSS_SCALE_CONNECTIVE_TISSUE_THEORY_BADGES,
  CROSS_SCALE_CONNECTIVE_TISSUE_THEORY_EDGES,
  buildCrossScaleConnectiveTissueTheoryBadgesV1,
} from "../cross-scale-connective-tissue-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";
import { buildTheoryContextReflection } from "../theory-context-reflector";

const EXPECTED_BADGE_IDS = [
  "physics.nuclear.reaction.astrophysical_s_factor_context",
  "physics.nuclear.reaction.thermonuclear_rate_context",
  "physics.nuclear.reaction.plasma_screening_context",
  "physics.nuclear.structure.semi_empirical_mass_formula_context",
  "physics.nuclear.structure.shell_magic_number_context",
  "physics.atomic.spectra.transition_probability_context",
  "physics.atomic.spectra.line_broadening_context",
  "astrochemistry.reaction_network.rate_equation_context",
  "astrochemistry.reaction_network.photodissociation_context",
  "thermodynamics.phase.free_energy_minimization_context",
  "thermodynamics.phase.equation_of_state_context",
  "quantum.open_system.lindblad_master_equation_context",
  "quantum.decoherence.einselection_context",
  "matter.order_parameter.landau_context",
  "matter.symmetry_breaking.goldstone_context",
  "scale.eft.rg_relevance_context",
  "scale.eft.effective_degrees_of_freedom_context",
  "evidence.uncertainty.measurement_model_context",
  "evidence.uncertainty.proxy_model_boundary_context",
  "astronomy.observational_inference.spectral_pipeline_context",
] as const;

describe("cross-scale connective tissue theory badges", () => {
  it("adds cited connective-tissue badges with strict diagnostic boundaries", () => {
    const branch = buildCrossScaleConnectiveTissueTheoryBadgesV1();
    const badgesById = new Map(branch.badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));

    expect(new Set(badgesById.keys())).toEqual(new Set(EXPECTED_BADGE_IDS));
    for (const badgeId of EXPECTED_BADGE_IDS) {
      const badge = badgesById.get(badgeId);

      expect(badge).toBeTruthy();
      expect(badge?.sourceRefs.some((ref) => ref.kind === "literature_ref")).toBe(true);
      expect(badge?.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge?.claimBoundary.doesValidateNHM2).toBe(false);
      expect(badge?.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge?.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("keeps calculator payloads scalar-safe and leaves matrix uncertainty non-computable", () => {
    const payloadExpressions = CROSS_SCALE_CONNECTIVE_TISSUE_THEORY_BADGES.flatMap((badge) =>
      badge.calculatorPayloads.map((payload) => payload.expression),
    );
    const uncertaintyBadge = CROSS_SCALE_CONNECTIVE_TISSUE_THEORY_BADGES.find(
      (badge) => badge.id === "evidence.uncertainty.measurement_model_context",
    );

    expect(payloadExpressions).toEqual([
      "sigma_proxy_m2 = (S_E_J_m2 / E_J) * exp(-2 * pi * eta)",
      "rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s",
    ]);
    expect(uncertaintyBadge?.calculatorPayloads).toEqual([]);
    expect(uncertaintyBadge?.equations[0]?.computableExpression).toBeNull();
    expect(uncertaintyBadge?.equations[0]?.displayLatex).toBe("u_y^2\\approx J\\Sigma_xJ^T");
  });

  it("connects rates, spectra, astrochemistry, phase, open-system dynamics, EFT, and uncertainty branches", () => {
    expect(CROSS_SCALE_CONNECTIVE_TISSUE_THEORY_EDGES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "physics.quantum.tunneling_fusion_entrance",
          to: "physics.nuclear.reaction.astrophysical_s_factor_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "physics.nuclear.reaction.thermonuclear_rate_context",
          to: "stellar.nucleosynthesis.reaction_network_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "physics.atomic.spectra.line_broadening_context",
          to: "astronomy.observational_inference.spectral_pipeline_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "astrochemistry.reaction_network.rate_equation_context",
          to: "astrochemistry.water.h_o_binding_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "thermodynamics.phase.free_energy_minimization_context",
          to: "thermodynamics.phase.equation_of_state_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "quantum.open_system.lindblad_master_equation_context",
          to: "matter.time_crystal.noisy_synchrony_margin_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "scale.eft.effective_degrees_of_freedom_context",
          to: "matter.time_crystal.polariton_stc_bridge_boundary",
          relation: "bounds",
        }),
        expect.objectContaining({
          from: "evidence.uncertainty.measurement_model_context",
          to: "evidence.uncertainty.proxy_model_boundary_context",
          relation: "documents",
        }),
      ]),
    );
  });

  it("integrates into the full Helix theory badge graph without duplicate ids or missing edge endpoints", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const issues = validateTheoryBadgeGraphV1(graph);
    const graphBadgeIds = new Set(graph.badges.map((badge: TheoryBadgeV1) => badge.id));
    const graphEdgeIds = new Set(graph.edges.map((edge: TheoryBadgeEdgeV1) => edge.id));

    expect(issues).toEqual([]);
    for (const badgeId of EXPECTED_BADGE_IDS) {
      expect(graphBadgeIds).toContain(badgeId);
    }
    expect(graphEdgeIds).toContain("tunneling_entrance_requires_s_factor_context");
    expect(graphEdgeIds).toContain("spectral_pipeline_requires_measurement_model_context");
    expect(graphEdgeIds).toContain("proxy_model_boundary_bounds_time_crystal_sweep_context");
  });

  it("exposes only the S-factor and two-body rate scalar proxies to the calculator", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "physics.nuclear.reaction.astrophysical_s_factor_context",
        "physics.nuclear.reaction.thermonuclear_rate_context",
        "evidence.uncertainty.measurement_model_context",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      includeContextItems: true,
    });
    const solveExpressions = loadout.items.map((item: TheoryCalculatorLoadoutItemV1) => item.solveExpression);

    expect(solveExpressions).toContain("sigma_proxy_m2 = (S_E_J_m2 / E_J) * exp(-2 * pi * eta)");
    expect(solveExpressions).toContain("rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s");
    expect(solveExpressions.join("\n")).not.toMatch(/J\s*\*\s*Sigma_x|transpose|matrix/i);
  });

  it("reflects the connective tissue as prompt-centered or boundary context for cross-scale prompts", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const clusters = [
      {
        prompt:
          "Reflect astrophysical S-factor, thermonuclear rate density, plasma screening, semi empirical mass formula, and physics.nuclear.structure.shell_magic_number_context for fusion and element origins.",
        mentionedEquations: [
          "sigma_proxy_m2 = (S_E_J_m2 / E_J) * exp(-2 * pi * eta)",
          "rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s",
        ],
        mentionedSymbols: ["sigma_proxy_m2", "S_E_J_m2", "rate_proxy_m3_s", "n1_m3", "n2_m3", "Z", "N", "shell_closure_context"],
        expectedBadgeIds: [
          "physics.nuclear.reaction.astrophysical_s_factor_context",
          "physics.nuclear.reaction.thermonuclear_rate_context",
        ],
      },
      {
        prompt:
          "Reflect oscillator strength, Einstein A transition probability, line broadening, spectral pipeline inference, astrochemical reaction network, and photodissociation shielding for water context.",
        mentionedEquations: ["p(theta|D) proportional to p(D|theta,model)p(theta)"],
        mentionedSymbols: ["A_ul_s_inv", "f_lu", "delta_lambda_context", "posterior_context", "dn_i_dt", "k_pd_s_inv"],
        expectedBadgeIds: [
          "physics.atomic.spectra.transition_probability_context",
          "physics.atomic.spectra.line_broadening_context",
          "astrochemistry.reaction_network.rate_equation_context",
          "astronomy.observational_inference.spectral_pipeline_context",
        ],
      },
      {
        prompt:
          "Reflect Lindblad master equation, einselection decoherence, Landau order parameter, Goldstone symmetry breaking, RG relevance, effective degrees of freedom, measurement uncertainty, and proxy model boundary.",
        mentionedEquations: ["u_y^2 approx J Sigma_x J^T"],
        mentionedSymbols: ["rho_density_matrix", "L_k", "phi_order", "goldstone_mode_context", "mu_scale", "u_y2_context", "proxy_boundary_context"],
        expectedBadgeIds: [
          "quantum.open_system.lindblad_master_equation_context",
          "matter.order_parameter.landau_context",
          "scale.eft.rg_relevance_context",
          "evidence.uncertainty.measurement_model_context",
        ],
      },
    ];

    for (const [index, cluster] of clusters.entries()) {
      const reflection = buildTheoryContextReflection({
        graph,
        prompt: cluster.prompt,
        mentionedEquations: cluster.mentionedEquations,
        mentionedSymbols: cluster.mentionedSymbols,
        generatedAt: "2026-06-12T00:00:00.000Z",
        reflectionId: `reflection:cross-scale-connective-tissue:${index}`,
        limit: 16,
      });
      const roles = reflection.resolution?.roleByBadgeId ?? {};
      const reflectedBadgeIds = [
        ...reflection.exactMatches.map((match) => match.badgeId),
        ...reflection.likelyMatches.map((match) => match.badgeId),
        ...reflection.overlay.highlightedBadgeIds,
      ];

      for (const badgeId of cluster.expectedBadgeIds) {
        expect(reflectedBadgeIds).toContain(badgeId);
        expect(["prompt_center", "first_principles_path", "claim_boundary", "observable_path"]).toContain(roles[badgeId]);
      }
      expect(reflection.evidenceForAsk.claimBoundaries.join(" ")).toMatch(/diagnostic-only|promotion not allowed/i);
      expect(reflection.evidenceForAsk.recommendedNextActions.every((action) => action.solves === false)).toBe(true);
    }
  });

  it("does not encode forbidden cross-scale overclaims", () => {
    const serialized = JSON.stringify({
      badges: CROSS_SCALE_CONNECTIVE_TISSUE_THEORY_BADGES,
      edges: CROSS_SCALE_CONNECTIVE_TISSUE_THEORY_EDGES,
    });

    expect(serialized).not.toMatch(/S-factor proves fusion yield/i);
    expect(serialized).not.toMatch(/line ID proves origin/i);
    expect(serialized).not.toMatch(/water guaranteed/i);
    expect(serialized).not.toMatch(/decoherence establishes classical truth/i);
    expect(serialized).not.toMatch(/order parameter proves consciousness/i);
    expect(serialized).not.toMatch(/EFT validates all scales/i);
  });
});
