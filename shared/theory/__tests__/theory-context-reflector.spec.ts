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
        "Reflect fairness through entropy in the Theory Badge Graph and ZenGraph. Keep it evidence-only and do not treat physics as moral proof.",
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:no-route-word-noise",
    });
    const reasons = [...reflection.exactMatches, ...reflection.likelyMatches]
      .flatMap((match) => match.reasons)
      .join("\n");

    expect(reasons).toMatch(/entropy/i);
    expect(reasons).not.toMatch(/\btext match:.*\b(?:do|treat|physics|theory|badge|graph|proof)\b/i);
  });

  it("prioritizes requested physics concepts over atlas-neighborhood noise for Theory/Zen bridge prompts", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildNhm2TheoryBadgeGraphV1(),
      prompt:
        "Reflect fairness and due process through entropy, conservation, and self-organization in the Theory Badge Graph and ZenGraph. Keep it evidence-only and do not treat physics as moral proof.",
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
    expect(reflection.overlay.suggestedScaleBands).toEqual(expect.arrayContaining(["molecular", "stellar"]));
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
});
