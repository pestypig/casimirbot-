import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildOrchOrCoherenceTheoryBadgesV1 } from "../orch-or-coherence-theory-badges";
import { buildTheoryCalculatorLoadout } from "../theory-calculator-loadout";

describe("Orch-OR/coherence theory badges", () => {
  it("adds exploratory coherence and time-crystal comparison rows to the main graph", () => {
    const orchOr = buildOrchOrCoherenceTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();

    expect(orchOr.badges.map((badge) => badge.id)).toContain("orch_or.microtubule.coherence_window");
    expect(orchOr.badges.map((badge) => badge.id)).toContain("orch_or.gamma_synchrony.neural_band");
    expect(orchOr.badges.map((badge) => badge.id)).toContain("orch_or.time_crystal.subharmonic_locking_test");
    expect(orchOr.badges.map((badge) => badge.id)).toContain("orch_or.claim_boundary.exploratory_only");
    expect(graph.badges.map((badge) => badge.id)).toContain("orch_or.microtubule.coherence_window");
    expect(
      graph.edges.some(
        (edge) =>
          edge.from === "collapse.objective.dp_timescale" &&
          edge.to === "orch_or.microtubule.coherence_window",
      ),
    ).toBe(true);
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("keeps calculator rows as scalar comparisons and preserves exploratory boundaries", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const boundary = graph.badges.find((badge) => badge.id === "orch_or.claim_boundary.exploratory_only");
    const loadout = buildTheoryCalculatorLoadout({
      graph,
      badgeIds: [
        "orch_or.microtubule.coherence_window",
        "orch_or.gamma_synchrony.neural_band",
        "orch_or.frequency_hierarchy.cross_scale_locking",
        "orch_or.time_crystal.subharmonic_locking_test",
        "orch_or.claim_boundary.exploratory_only",
      ],
      mode: "selected_badges",
      source: "achievement_map",
      includeContextItems: true,
    });

    const solveExpressions = loadout.items.map((item) => item.solveExpression);

    expect(solveExpressions).toContain("coherence_margin_s = tau_coherence_s - tau_DP_s");
    expect(solveExpressions).toContain("T_gamma_s = 1/f_gamma_Hz");
    expect(solveExpressions).toContain("N_gamma_cycles = tau_DP_s*f_gamma_Hz");
    expect(solveExpressions).toContain("subharmonic_ratio = f_response_Hz/f_drive_Hz");
    expect(loadout.items.some((item) => item.kind === "claim_boundary")).toBe(true);
    expect(boundary?.claimBoundary?.diagnosticOnly).toBe(true);
    expect(boundary?.claimBoundary?.physicalMechanismClaimAllowed).toBe(false);
    expect(boundary?.claimBoundary?.promotionAllowed).toBe(false);
  });

  it("does not emit forbidden claim language", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const orchOrBadges = graph.badges.filter((badge) => badge.id.startsWith("orch_or."));

    expect(JSON.stringify(orchOrBadges)).not.toMatch(
      /orch-or confirmed|microtubules are proven time crystals|gamma synchrony proves collapse|consciousness mechanism validated|objective collapse confirmed|physical mechanism confirmed/i,
    );
  });
});
