import { describe, expect, it } from "vitest";
import { isTheoryContextReflectionV1 } from "../../contracts/theory-context-reflection.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryBiomeLayoutV1 } from "../theory-biome-layout";
import { buildTheoryContextReflection } from "../theory-context-reflector";

function probabilitySum(values: Record<string, number>): number {
  return Object.values(values).reduce((total, probability) => total + probability, 0);
}

describe("theory context reflector", () => {
  it("reflects E=hf discussion into energy-frequency and photon-energy badges", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "We are discussing E = h f photon energy and wavelength light calculations.",
      conversationContext: "The user wants to locate photon-energy equations in theory space.",
      mentionedEquations: ["E = h * f"],
      mentionedSymbols: ["E", "h", "f", "lambda"],
      mentionedDomains: ["solar_surface_spectrum", "casimir_cavity_modes"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:energy-frequency",
    });
    const reflectedBadgeIds = [
      ...reflection.exactMatches.map((match) => match.badgeId),
      ...reflection.likelyMatches.map((match) => match.badgeId),
      ...reflection.overlay.highlightedBadgeIds,
    ];

    expect(isTheoryContextReflectionV1(reflection)).toBe(true);
    expect(reflectedBadgeIds).toContain("physics.quantum.energy_frequency");
    expect(reflection.overlay.uncertainty?.normalizedMass).toBeCloseTo(1, 5);
    expect(reflection.overlay.uncertainty?.posteriorEntropyBits).toBeGreaterThan(0);
    expect(reflectedBadgeIds).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/solar\.spectrum\.photon_energy|casimir\.cavity\.mode_photon_energy/),
      ]),
    );
    expect(reflection.overlay.softRegion?.meaning).toBe("discussion_context_not_proof");
  });

  it("reflects Einstein tensor and source residual discussion into GR/NHM2/QEI badges", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Locate the Einstein tensor path into NHM2 source residual and QEI margin.",
      conversationContext: "We want the graph connection before a diagnostic warp-bubble calculator demo.",
      mentionedEquations: [
        "G_mu_nu = 8*pi*G*T_mu_nu/c^4",
        "R_source = source_required - source_available",
        "qei_margin = qei_bound - qei_sample",
      ],
      mentionedSymbols: ["G_mu_nu", "T_mu_nu", "R_source", "qei_margin"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:nhm2-qei",
    });
    const exactBadgeIds = reflection.exactMatches.map((match) => match.badgeId);
    const reflectedBadgeIds = [
      ...exactBadgeIds,
      ...reflection.likelyMatches.map((match) => match.badgeId),
      ...reflection.overlay.highlightedBadgeIds,
    ];

    expect(isTheoryContextReflectionV1(reflection)).toBe(true);
    expect(reflectedBadgeIds).toEqual(
      expect.arrayContaining([
        "physics.gr.einstein_field_equation",
        "nhm2.closure.source_residual",
        "nhm2.qei.sampling_window",
      ]),
    );
    expect(reflection.inferredDomains.map((domain) => domain.atlasBlockId)).toEqual(
      expect.arrayContaining(["warp_gr_nhm2", "qei_stress_energy"]),
    );
    expect(reflection.overlay.highlightedEdgeIds.length).toBeGreaterThan(0);
  });

  it("includes claim boundary notes in evidence for Ask", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Discuss NHM2 diagnostic-only claim boundary around source residual.",
      mentionedSymbols: ["R_source"],
      mentionedDomains: ["warp_gr_nhm2"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:claim-boundary",
    });

    expect(reflection.evidenceForAsk.claimBoundaries.join(" ")).toMatch(/diagnostic-only|promotion not allowed/i);
    expect(reflection.evidenceForAsk.summary).toMatch(/Claim boundaries remain/i);
  });

  it("recommends setup/load actions but no solve action by default", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Set up source residual and QEI margin rows for a demo.",
      mentionedSymbols: ["R_source", "qei_margin"],
      mentionedDomains: ["warp_gr_nhm2"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:no-solve",
    });

    expect(reflection.evidenceForAsk.recommendedNextActions.length).toBeGreaterThan(0);
    expect(reflection.evidenceForAsk.recommendedNextActions.every((action) => action.solves === false)).toBe(true);
    expect(
      reflection.evidenceForAsk.recommendedNextActions.some((action) =>
        action.actionId.includes("solve"),
      ),
    ).toBe(false);
  });

  it("recommends building a compound run for NHM2/QEI reflection clusters", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Map source residual and QEI margin on the badge graph.",
      mentionedEquations: ["R_source = source_required - source_available"],
      mentionedSymbols: ["R_source", "qei_margin"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:compound-run-recommendation",
    });
    const buildAction = reflection.evidenceForAsk.recommendedNextActions.find(
      (action) => action.actionId === "theory-badge-graph.build_compound_theory_run",
    );

    expect(buildAction).toBeTruthy();
    expect(buildAction?.args).toEqual(expect.objectContaining({
      mode: "dependency_path",
      include_scalar: true,
      include_runtime: true,
      include_evidence: true,
      include_boundaries: true,
    }));
    expect(buildAction?.args.badge_ids).toEqual(expect.arrayContaining([
      expect.stringMatching(/nhm2|physics\.gr/),
    ]));
    expect(buildAction?.mutatesCalculator).toBe(false);
    expect(buildAction?.solves).toBe(false);
  });

  it("recommends loading scalar payloads only when scalar payloads exist", () => {
    const fullGraph = buildNhm2TheoryBadgeGraphV1();
    const scalarReflection = buildTheoryContextReflection({
      graph: fullGraph,
      prompt: "Where does E=hf photon energy fit in the theory graph?",
      mentionedEquations: ["E = h*f"],
      mentionedSymbols: ["E", "h", "f"],
      mentionedDomains: ["solar_surface_spectrum"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:scalar-recommendation",
    });
    const tensorOnlyBadge = fullGraph.badges.find((badge) => badge.id === "physics.gr.einstein_field_equation");
    if (!tensorOnlyBadge) throw new Error("missing Einstein field equation badge fixture");
    const tensorOnlyGraph = {
      ...fullGraph,
      badges: [tensorOnlyBadge],
      edges: [],
      summary: {
        ...fullGraph.summary,
        badgeCount: 1,
        edgeCount: 0,
        calculatorLoadableCount: 0,
      },
    };
    const tensorReflection = buildTheoryContextReflection({
      graph: tensorOnlyGraph,
      prompt: "Locate the Einstein field equation tensor reference.",
      mentionedEquations: ["G_mu_nu = 8*pi*G*T_mu_nu/c^4"],
      mentionedSymbols: ["G_mu_nu", "T_mu_nu"],
      mentionedDomains: ["warp_gr_nhm2"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:tensor-no-scalar-recommendation",
    });
    const scalarAction = scalarReflection.evidenceForAsk.recommendedNextActions.find(
      (action) => action.actionId === "theory-badge-graph.load_payloads_to_calculator",
    );

    expect(scalarAction).toBeTruthy();
    expect(scalarAction?.args.badge_id).toBeTruthy();
    expect(tensorReflection.evidenceForAsk.recommendedNextActions.some(
      (action) => action.actionId === "theory-badge-graph.load_payloads_to_calculator",
    )).toBe(false);
  });

  it("exposes calculator payload expressions for matched graph badges", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "What equation from the theory badge graph can be solved in the calculator for tokamak thermal pressure and confinement time?",
      mentionedSymbols: ["p_Pa", "n_m3", "T_eV", "W_th", "P_loss", "tau_E"],
      mentionedDomains: ["tokamak plasma"],
      generatedAt: "2026-06-30T00:00:00.000Z",
      reflectionId: "reflection:tokamak-calculator-payloads",
      limit: 8,
    });
    const payloads = reflection.evidenceForAsk.calculatorPayloads ?? [];

    expect(payloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          badgeId: "tokamak.plasma.thermal_pressure_proxy",
          payloadId: "tokamak_thermal_pressure_payload",
          expression: "p_Pa = n_m3*T_eV*e_charge",
          targetVariable: "p_Pa",
        }),
        expect.objectContaining({
          badgeId: "tokamak.energy.confinement_time_proxy",
          payloadId: "tokamak_confinement_energy_payload",
          expression: "W_th = P_loss*tau_E",
          targetVariable: "W_th",
        }),
      ]),
    );
    expect(reflection.evidenceForAsk.recommendedNextActions.some(
      (action) => action.actionId === "theory-badge-graph.load_payloads_to_calculator",
    )).toBe(true);
    expect(reflection.evidenceForAsk.recommendedNextActions.every((action) => action.solves === false)).toBe(true);
  });

  it("recommends runtime math trace for tensor/reference badges", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Locate the Einstein tensor and GR stress-energy reference chain.",
      mentionedEquations: ["G_mu_nu = 8*pi*G*T_mu_nu/c^4"],
      mentionedSymbols: ["G_mu_nu", "T_mu_nu"],
      mentionedDomains: ["warp_gr_nhm2"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:runtime-trace-recommendation",
    });
    const runtimeAction = reflection.evidenceForAsk.recommendedNextActions.find(
      (action) => action.actionId === "theory-badge-graph.get_runtime_math_trace",
    );

    expect(runtimeAction).toBeTruthy();
    expect(runtimeAction?.args.badge_id).toBeTruthy();
    expect(runtimeAction?.mutatesCalculator).toBe(false);
    expect(runtimeAction?.solves).toBe(false);
  });

  it("does not mark any reflection recommendation as a solve action by default", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Solve later, but first map source residual and QEI margin on the graph.",
      mentionedSymbols: ["R_source", "qei_margin"],
      mentionedDomains: ["warp_gr_nhm2"],
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:no-default-solve-action",
    });

    expect(reflection.evidenceForAsk.recommendedNextActions.length).toBeGreaterThan(0);
    expect(reflection.evidenceForAsk.recommendedNextActions.every((action) => action.solves === false)).toBe(true);
  });

  it("strict mode omits soft region when there are no high-confidence matches", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "loose metaphorical discussion about classroom intuition",
      confidenceMode: "strict_badge_match",
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:strict",
    });

    expect(isTheoryContextReflectionV1(reflection)).toBe(true);
    expect(reflection.overlay.softRegion).toBeNull();
  });

  it("does not score generic route words as theory evidence", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "Reflect fairness through entropy in the Theory Badge Graph and MoralGraph. Keep it evidence-only and do not treat physics as moral proof.",
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:no-route-word-noise",
    });
    const reasons = [...reflection.exactMatches, ...reflection.likelyMatches]
      .flatMap((match) => match.reasons)
      .join("\n");

    expect(reasons).toMatch(/entropy/i);
    expect(reasons).not.toMatch(/\btext match:.*\b(?:do|treat|physics|theory|badge|graph|proof)\b/i);
  });

  it("classifies collective-mode reflection matches by resolution role without dropping broad context", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "Reflect the theory badge graph for a 4.6 ms soliton-polariton reservoir lifetime, Fourier linewidth proxy, polariton decoherence boundary, noisy synchrony margin, stabilized versus noisy DTC T2 prime linewidth, and magnon space-time lattice k_um_inv 5 and 10.",
      mentionedEquations: [
        "Gamma_life_s_inv = 1 / tau_s",
        "linewidth_proxy_Hz = 1 / (2 * pi * tau_s)",
        "delta_f_collective_Hz = 1 / (2 * pi * T2_prime_s)",
        "stability_margin_s_inv = locking_rate_s_inv - noise_dephasing_rate_s_inv - loss_rate_s_inv",
        "lambda_um = 1 / k_um_inv",
      ],
      mentionedSymbols: [
        "tau_s",
        "Gamma_life_s_inv",
        "linewidth_proxy_Hz",
        "T2_prime_s",
        "T2_s",
        "g1_tau",
        "linewidth_Hz",
        "stability_margin_s_inv",
        "k_um_inv",
        "lambda_um",
      ],
      generatedAt: "2026-06-12T00:00:00.000Z",
      reflectionId: "reflection:collective-mode-resolution",
      limit: 20,
    });
    const roleByBadgeId = reflection.resolution?.roleByBadgeId ?? {};

    expect(isTheoryContextReflectionV1(reflection)).toBe(true);
    expect(reflection.resolution?.mode).toBe("path");
    expect(roleByBadgeId["matter.collective.polariton_reservoir_lifetime_context"]).toBe("prompt_center");
    expect(roleByBadgeId["matter.time_crystal.noisy_synchrony_margin_context"]).toBe("prompt_center");
    expect(roleByBadgeId["matter.time_crystal.collective_lifetime_limited_linewidth_context"]).toBe("prompt_center");
    expect(roleByBadgeId["matter.time_crystal.magnon_space_time_lattice_context"]).toBe("prompt_center");
    expect(roleByBadgeId["matter.collective.polariton_decoherence_boundary"]).toBe("claim_boundary");
    if (roleByBadgeId["matter.time_crystal.polariton_stc_bridge_boundary"]) {
      expect(roleByBadgeId["matter.time_crystal.polariton_stc_bridge_boundary"]).toBe("claim_boundary");
    }

    for (const badgeId of [
      "curvature.uncertainty.margin",
      "relativity.lorentz.transform_context",
      "casimir.cavity.parallel_plate_pressure",
      "matter.phase.structural_order_context",
    ]) {
      if (roleByBadgeId[badgeId]) {
        expect(["analogy_context", "ambient_context", "consequence_context"]).toContain(roleByBadgeId[badgeId]);
      }
    }

    expect(reflection.resolution?.rankedBadgeIdsByRole.prompt_center).toEqual(
      expect.arrayContaining([
        "matter.collective.polariton_reservoir_lifetime_context",
        "matter.time_crystal.noisy_synchrony_margin_context",
      ]),
    );
    expect(reflection.scientificMethod.observationTarget.resolutionMode).toBe("path");
    expect(reflection.scientificMethod.hypothesisCandidates.length).toBeGreaterThan(0);
    expect(reflection.scientificMethod.calculatorProxyCandidates.map((proxy) => proxy.badgeId)).toEqual(
      expect.arrayContaining([
        "matter.collective.polariton_reservoir_lifetime_context",
        "matter.time_crystal.noisy_synchrony_margin_context",
      ]),
    );
    expect(reflection.scientificMethod.falsificationChecks.length).toBeGreaterThan(0);
    expect(reflection.scientificMethod.proceduralNextSteps.every((step) => step.solves === false)).toBe(true);
    expect(reflection.scientificMethod.terminal_eligible).toBe(false);
    expect(reflection.evidenceForAsk.claimBoundaries.join(" ")).toMatch(/diagnostic-only|promotion not allowed/i);
    expect(reflection.evidenceForAsk.recommendedNextActions.some(
      (action) => action.actionId === "theory-badge-graph.load_payloads_to_calculator",
    )).toBe(true);
    expect(reflection.evidenceForAsk.recommendedNextActions.every((action) => action.solves === false)).toBe(true);
  });

  it("maps resolution modes to explanation depth without changing evidence-only actions", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Map the wide context around magnon space-time lattice and polariton reservoir lifetime.",
      resolutionMode: "wide_context",
      generatedAt: "2026-06-12T00:00:00.000Z",
      reflectionId: "reflection:wide-resolution",
    });

    expect(isTheoryContextReflectionV1(reflection)).toBe(true);
    expect(reflection.resolution?.mode).toBe("wide_context");
    expect(reflection.resolution?.explanationDepthHint).toBe("cross_scale");
    expect(reflection.evidenceForAsk.recommendedNextActions.every((action) => action.solves === false)).toBe(true);
  });

  it("prioritizes requested physics concepts over atlas-neighborhood noise for Theory/Moral bridge prompts", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "Reflect fairness and due process through entropy, conservation, and self-organization in the Theory Badge Graph and MoralGraph. Keep it evidence-only and do not treat physics as moral proof.",
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:bridge-focus-ranking",
    });
    const topBadgeIds = reflection.exactMatches.slice(0, 3).map((match) => match.badgeId);

    expect(topBadgeIds).toContain("biophysics.membrane.open_system_entropy_flow");
    expect(topBadgeIds).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/conservation/),
      ]),
    );
    expect(topBadgeIds.join(" ")).not.toMatch(/astrochemistry|spectroscopy|pah|fullerene/i);
  });

  it("returns biome chunk and scale-band hints aligned with the rendered layout", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const layout = buildTheoryBiomeLayoutV1(graph);
    const c60Coordinate = layout.coordinates.find(
      (coordinate) => coordinate.badgeId === "astrochemistry.fullerene.c60_stellar_context",
    );
    if (!c60Coordinate) throw new Error("missing C60 astrochemistry coordinate fixture");

    const reflection = buildTheoryContextReflection({
      graph,
      prompt: "Map buckyballs, stellar carbon, and astrochemistry on the theory badge graph.",
      generatedAt: "2026-06-08T00:00:00.000Z",
      reflectionId: "reflection:biome-resolution",
      limit: 8,
    });

    expect(isTheoryContextReflectionV1(reflection)).toBe(true);
    expect(reflection.overlay.highlightedBadgeIds).toContain("astrochemistry.fullerene.c60_stellar_context");
    expect(reflection.overlay.highlightedBadgeIds).toEqual(expect.arrayContaining([
      "stellar.spectroscopy.atomic_line_identification_context",
      "stellar.nucleosynthesis.reaction_network_context",
    ]));
    expect(reflection.overlay.suggestedScaleBands).toEqual(expect.arrayContaining(["molecular", "claim_boundary"]));
    expect(reflection.overlay.suggestedBiomeChunkIds).toContain(c60Coordinate.renderChunkId);
    expect(reflection.overlay.suggestedSemanticChunkIds).toContain(c60Coordinate.semanticChunkId);
    expect(reflection.overlay.uncertainty?.badgeProbabilityById).toHaveProperty(
      "astrochemistry.fullerene.c60_stellar_context",
    );
    expect(reflection.overlay.uncertainty?.renderChunkProbabilityById[c60Coordinate.renderChunkId]).toBeGreaterThan(0);
    expect(reflection.overlay.uncertainty?.semanticChunkProbabilityById[c60Coordinate.semanticChunkId]).toBeGreaterThan(0);
    expect(probabilitySum(reflection.overlay.uncertainty?.badgeProbabilityById ?? {})).toBeCloseTo(1, 5);
    expect(reflection.overlay.uncertainty?.priorEntropyBits).toBeGreaterThanOrEqual(
      reflection.overlay.uncertainty?.posteriorEntropyBits ?? 0,
    );
  });

  it("keeps unsupported formal-theorem requests in the open-world null hypothesis", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Compare Godel's incompleteness theorem with Fermat's Last Theorem.",
      generatedAt: "2026-07-15T00:00:00.000Z",
      reflectionId: "reflection:formal-theorems-out-of-graph",
    });

    expect(reflection.exactMatches).toEqual([]);
    expect(reflection.likelyMatches).toEqual([]);
    expect(reflection.overlay.uncertainty?.representedProbabilityMass).toBe(0);
    expect(reflection.overlay.uncertainty?.outOfGraphProbability).toBe(1);
    expect(reflection.overlay.uncertainty?.openWorldCandidateProbabilityById).toEqual({});
    expect(reflection.overlay.uncertainty?.coverageBasis).toBe("no_candidates");
  });

  it("keeps long-form examples from displacing the cross-scale subject", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: [
        "Deterministic microscopic laws can yield probabilistic macroscopic observations when fine-grained information is inaccessible or discarded under coarse-graining.",
        "Hidden detail, chaotic sensitivity, and emergence can make effective descriptions probabilistic.",
        "Statistical mechanics is the classic example: particles may follow deterministic equations while temperature and pressure are described statistically.",
        "The distinction is whether probability is epistemic or unavoidable at the effective scale; quantum mechanics makes that contentious.",
      ].join(" "),
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:determinism-probability-cross-scale",
    });
    const likelyBadgeIds = reflection.likelyMatches.map((match) => match.badgeId);

    expect(reflection.exactMatches).toEqual([]);
    expect(likelyBadgeIds).toEqual(expect.arrayContaining([
      "scale.eft.effective_degrees_of_freedom_context",
      "scale.eft.rg_relevance_context",
    ]));
    expect(likelyBadgeIds).not.toEqual(expect.arrayContaining([
      "low_temp.temperature.thermal_energy_not_pressure",
      "tokamak.plasma.thermal_pressure_proxy",
      "starsim.observable.surface_temperature_proxy",
    ]));
    expect(reflection.inferredDomains.map((domain) => domain.atlasBlockId)).not.toContain(
      "tokamak_plasma",
    );
    expect(reflection.overlay.uncertainty).toMatchObject({
      representedProbabilityMass: 0.55,
      outOfGraphProbability: 0.45,
      coverageBasis: "semantic_coverage_heuristic",
    });
  });

  it("anchors on the first scientific sentence and excludes a quantum caveat from placement mass", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: [
        "Exactly.",
        "Deterministic microscopic evolution does not guarantee predictable macroscopic observations.",
        "Probability can emerge when coarse-graining maps many distinct microstates to the same macrostate.",
        "Because microscopic details are discarded, uncertainty in the hidden microstate induces probabilistic macrodynamics.",
        "So the probability may reflect the scale-dependent description rather than randomness in the underlying laws—though that alone does not establish that every apparently fundamental probability, such as quantum measurement, has this origin.",
      ].join(" "),
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:deictic-long-form-caveat-boundary",
    });
    const likelyBadgeIds = reflection.likelyMatches.map((match) => match.badgeId);

    expect(reflection.exactMatches).toEqual([]);
    expect(likelyBadgeIds).toEqual(expect.arrayContaining([
      "scale.eft.effective_degrees_of_freedom_context",
      "scale.eft.rg_relevance_context",
    ]));
    expect(likelyBadgeIds).toHaveLength(2);
    expect(likelyBadgeIds).not.toContain("physics.atomic.electron_cloud_uncertainty_floor");
    expect(reflection.overlay.uncertainty?.openWorldCandidateProbabilityById).not.toHaveProperty(
      "physics.atomic.electron_cloud_uncertainty_floor",
    );
    expect(reflection.overlay.uncertainty).toMatchObject({
      representedProbabilityMass: 0.55,
      outOfGraphProbability: 0.45,
      coverageBasis: "semantic_coverage_heuristic",
    });
  });

  it("keeps embedded examples in the keyed level-two answer out of placement mass", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: [
        "Exactly. Deterministic microscopic dynamics can yield probabilistic macroscopic observations because changing scale usually discards information.",
        "Once we track coarse variables—temperature, pressure, density—instead of every microscopic degree of freedom, many distinct microstates become observationally indistinguishable.",
        "Probability then describes our uncertainty over those hidden microstates, even if each evolves deterministically.",
        "Chaos strengthens this effect: tiny unresolved differences can grow rapidly, making long-term outcomes practically unpredictable.",
        "Statistical mechanics formalizes the idea through distributions over microstates, while renormalization explains how microscopic details can become irrelevant at larger scales.",
        "So the probabilities need not be fundamental.",
        "They can emerge from coarse-graining, incomplete initial information, chaotic amplification, environmental coupling, and collective behavior in systems with many degrees of freedom.",
        "The key distinction is between ontic probability—indeterminism in reality itself—and epistemic or emergent probability—uncertainty introduced by limited resolution and scale-dependent description.",
        "Deterministic laws are fully compatible with the latter.",
      ].join(" "),
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:keyed-level-two-cross-scale-answer",
    });
    const likelyBadgeIds = reflection.likelyMatches.map((match) => match.badgeId);

    expect(reflection.exactMatches).toEqual([]);
    expect(likelyBadgeIds).toEqual([
      "scale.eft.effective_degrees_of_freedom_context",
      "scale.eft.rg_relevance_context",
    ]);
    expect(reflection.overlay.highlightedEdgeIds).toContain(
      "rg_relevance_bounds_effective_degrees_of_freedom",
    );
    expect(reflection.overlay.uncertainty).toMatchObject({
      representedProbabilityMass: 0.55,
      outOfGraphProbability: 0.45,
      coverageBasis: "semantic_coverage_heuristic",
    });
    expect(reflection.overlay.uncertainty?.openWorldCandidateProbabilityById).toEqual({
      "scale.eft.effective_degrees_of_freedom_context": expect.any(Number),
      "scale.eft.rg_relevance_context": expect.any(Number),
    });
  });

  it("retains an affirmative long-form thermodynamic comparison with two coherent signals", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "Compare temperature and pressure as explicit thermodynamic observables in a plasma model, " +
        "including the assumptions needed to relate both measured quantities to a common state.",
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:affirmative-thermodynamic-comparison",
    });
    const matchedBadgeIds = [
      ...reflection.exactMatches.map((match) => match.badgeId),
      ...reflection.likelyMatches.map((match) => match.badgeId),
    ];

    expect(matchedBadgeIds).toContain("tokamak.plasma.thermal_pressure_proxy");
  });

  it("places a natural Cooper-pair explanation near superconducting bounds without promoting it to exact", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: [
        "Cooper pairs are pairs of electrons that become weakly bound inside certain materials at very low temperatures.",
        "A lattice distortion can produce an effective attraction that overcomes electron repulsion under the right conditions.",
        "Many pairs can occupy a coherent quantum state that moves without ordinary electrical resistance, creating superconductivity.",
        "Cooper pairing is central to conventional BCS superconductivity.",
      ].join(" "),
      generatedAt: "2026-07-18T00:00:00.000Z",
      reflectionId: "reflection:natural-cooper-pair-context",
    });
    const badgeId = "low_temp.superconductivity.zero_dc_resistance_bounds";

    expect(reflection.exactMatches.map((match) => match.badgeId)).not.toContain(badgeId);
    expect(reflection.likelyMatches.map((match) => match.badgeId)).toContain(badgeId);
    expect(reflection.overlay.uncertainty).toMatchObject({
      representedProbabilityMass: 0.55,
      outOfGraphProbability: 0.45,
      coverageBasis: "semantic_coverage_heuristic",
    });
  });

  it.each([
    ["contextual", "For context only, Cooper pairing and BCS superconductivity are a separate mechanism."],
    ["negated", "Do not map Cooper pairing or BCS superconductivity into this graph."],
    ["future conditional", "If a later request asks about BCS superconductivity, compare Cooper pairing then."],
    ["historical", "Previously, we mentioned Cooper pairing in BCS superconductivity."],
    ["quoted", '"Cooper pairing in BCS superconductivity" is only quoted text from the prior answer.'],
    ["screen-visible", "The screen shows the words Cooper pairing and BCS superconductivity."],
  ])("keeps %s superconductivity aliases contextual", (_label, contextualSentence) => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: [
        "Deterministic microscopic states become probabilistic macroscopic descriptions after coarse-graining.",
        contextualSentence,
      ].join(" "),
      generatedAt: "2026-07-18T00:00:00.000Z",
      reflectionId: `reflection:contextual-superconductivity-${_label}`,
    });

    expect(reflection.likelyMatches.map((match) => match.badgeId)).not.toContain(
      "low_temp.superconductivity.zero_dc_resistance_bounds",
    );
  });

  it("assigns no represented mass when the only graph concept appears in a claim-boundary caveat", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "Exactly. This does not establish that electron-cloud quantum uncertainty is the mechanism.",
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:caveat-only-candidate",
    });

    expect(reflection.exactMatches).toEqual([]);
    expect(reflection.likelyMatches).toEqual([]);
    expect(reflection.overlay.uncertainty).toMatchObject({
      representedProbabilityMass: 0,
      outOfGraphProbability: 1,
      coverageBasis: "no_candidates",
    });
  });

  it("still admits electron-cloud uncertainty when it is an affirmative comparison subject", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "Compare electron-cloud position-momentum uncertainty with uncertainty induced by coarse-graining deterministic microscopic states into macroscopic observations.",
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:explicit-electron-cloud-comparison",
    });
    const matchedBadgeIds = [
      ...reflection.exactMatches.map((match) => match.badgeId),
      ...reflection.likelyMatches.map((match) => match.badgeId),
    ];

    expect(matchedBadgeIds).toContain("physics.atomic.electron_cloud_uncertainty_floor");
    expect(matchedBadgeIds).toContain("scale.eft.effective_degrees_of_freedom_context");
  });

  it.each([
    ["contextual", "For context only, electron-cloud quantum uncertainty is a separate mechanism."],
    ["negated", "Do not map electron-cloud quantum uncertainty into this mechanism."],
    ["future conditional", "If a later request asks about electron-cloud quantum uncertainty, compare it then."],
    ["historical", "Previously, we mentioned electron-cloud quantum uncertainty."],
    ["quoted", '"Electron-cloud quantum uncertainty" is only quoted text from the prior answer.'],
    ["screen-visible", "The screen shows the words electron-cloud quantum uncertainty."],
  ])("keeps %s candidate language contextual in a mixed scientific reflection", (_label, contextualSentence) => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: [
        "Deterministic microscopic states become probabilistic macroscopic descriptions after coarse-graining.",
        contextualSentence,
      ].join(" "),
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: `reflection:contextual-candidate-${_label}`,
    });
    const likelyBadgeIds = reflection.likelyMatches.map((match) => match.badgeId);

    expect(likelyBadgeIds).toContain("scale.eft.effective_degrees_of_freedom_context");
    expect(likelyBadgeIds).not.toContain("physics.atomic.electron_cloud_uncertainty_floor");
  });

  it("keeps ontology comparisons diagnostic when the graph only contains scale-context bridges", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "Now compare two interpretations with the Theory Badge Graph: first, that macroscopic " +
        "probability is epistemic because coarse-graining hides deterministic microstates; second, " +
        "that probability is fundamental rather than caused by missing information. Show where the " +
        "graph supports or fails to represent each interpretation.",
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:epistemic-versus-fundamental-probability",
    });
    const likelyBadgeIds = reflection.likelyMatches.map((match) => match.badgeId);

    expect(reflection.exactMatches).toEqual([]);
    expect(likelyBadgeIds).toEqual(expect.arrayContaining([
      "scale.eft.effective_degrees_of_freedom_context",
      "scale.eft.rg_relevance_context",
    ]));
    expect(likelyBadgeIds).not.toEqual(expect.arrayContaining([
      "biology.evolution.selection_fitness_context",
      "prebiotic.photochemistry.radiation_processing_context",
      "collapse.objective.dp_hazard_probability",
    ]));
    expect(reflection.overlay.highlightedEdgeIds).toContain(
      "rg_relevance_bounds_effective_degrees_of_freedom",
    );
    expect(reflection.overlay.uncertainty).toMatchObject({
      representedProbabilityMass: 0.55,
      outOfGraphProbability: 0.45,
      coverageBasis: "semantic_coverage_heuristic",
    });
  });

  it("does not promote a calculator payload coincidence to exact semantic identity", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "Epistemic probability from hidden deterministic microstates versus fundamental objective probability.",
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:objective-probability-payload-coincidence",
    });

    expect(reflection.exactMatches).toEqual([]);
    expect(reflection.likelyMatches.map((match) => match.badgeId)).toContain(
      "collapse.objective.dp_hazard_probability",
    );
    expect(reflection.overlay.highlightedEdgeIds).toEqual([]);
    expect(reflection.overlay.uncertainty).toMatchObject({
      representedProbabilityMass: 0.35,
      outOfGraphProbability: 0.65,
      coverageBasis: "semantic_coverage_heuristic",
    });
  });

  it("keeps live reflection control and output fields outside semantic coverage", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "LIVE_DERIVATION_PROGRAM_GODEL_07 Use helix_ask.reflect_theory_context exactly once " +
        "to compare Gödel incompleteness theorem with Fermat Last Theorem. " +
        "Report exact_badge_ids, likely_badge_ids, representedProbabilityMass, " +
        "outOfGraphProbability, master_problem_v1, derivation_program_v1, and failureReceipts.",
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:live-meta-formal-theorems-out-of-graph",
    });

    expect(reflection.exactMatches).toEqual([]);
    expect(reflection.likelyMatches).toEqual([]);
    expect(reflection.overlay.uncertainty).toMatchObject({
      representedProbabilityMass: 0,
      outOfGraphProbability: 1,
      coverageBasis: "no_candidates",
    });
  });

  it("does not let retained conversation context manufacture semantic graph coverage", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Compare Godel incompleteness theorem with Fermat Last Theorem.",
      conversationContext:
        "Retained paper and workstation context mentions Einstein field equations, stellar spectral abundance, photon energy, nucleosynthesis, nuclear structure, and surface gravity.",
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:ambient-context-does-not-admit-badges",
    });

    expect(reflection.input.conversationContext).toContain("Einstein field equations");
    expect(reflection.exactMatches).toEqual([]);
    expect(reflection.likelyMatches).toEqual([]);
    expect(reflection.overlay.uncertainty).toMatchObject({
      representedProbabilityMass: 0,
      outOfGraphProbability: 1,
      coverageBasis: "no_candidates",
    });
  });

  it("uses semantic identity evidence for exact matches and graph coverage", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt: "Compare the Einstein field equation with stress-energy conservation at the same observable scale.",
      generatedAt: "2026-07-16T00:00:00.000Z",
      reflectionId: "reflection:semantic-coverage",
    });
    const exactBadgeIds = reflection.exactMatches.map((match) => match.badgeId);

    expect(exactBadgeIds).toEqual(expect.arrayContaining([
      "physics.gr.einstein_field_equation",
      "physics.gr.stress_energy_conservation",
    ]));
    expect(exactBadgeIds).toHaveLength(2);
    expect(exactBadgeIds).not.toContain("physics.symmetry.energy_momentum_conservation");
    expect(reflection.likelyMatches.map((match) => match.badgeId)).toContain(
      "physics.symmetry.energy_momentum_conservation",
    );
    expect(reflection.overlay.uncertainty).toMatchObject({
      coverageBasis: "semantic_coverage_heuristic",
    });
    expect(reflection.overlay.uncertainty?.representedProbabilityMass).toBeGreaterThan(0.9);
    expect(reflection.overlay.uncertainty?.outOfGraphProbability).toBeLessThan(0.1);
  });
});
