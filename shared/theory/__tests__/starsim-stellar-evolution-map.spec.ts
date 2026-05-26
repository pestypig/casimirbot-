import { describe, expect, it } from "vitest";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import {
  STARSIM_STELLAR_EVOLUTION_STAGES,
  getStarSimStellarEvolutionStage,
} from "../starsim-stellar-evolution-map";

describe("StarSim stellar evolution map", () => {
  it("maps lifecycle stages onto existing theory badges", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const badgeIds = new Set(graph.badges.map((badge) => badge.id));

    for (const stage of STARSIM_STELLAR_EVOLUTION_STAGES) {
      expect(stage.theoryBadgeIds.length).toBeGreaterThan(0);
      expect(stage.objectBindings.length).toBeGreaterThan(0);
      expect(stage.claimBoundaryBadgeIds).toContain("starsim.claim_boundary.stage1_reduced_order_prior");
      for (const badgeId of stage.theoryBadgeIds) {
        expect(badgeIds.has(badgeId), `${stage.id} references missing badge ${badgeId}`).toBe(true);
      }
    }
  });

  it("connects main sequence to observable, fusion, runtime, and boundary badges", () => {
    const stage = getStarSimStellarEvolutionStage("starsim.lifecycle.main_sequence");

    expect(stage?.theoryBadgeIds).toEqual(
      expect.arrayContaining([
        "starsim.observable.surface_temperature_proxy",
        "starsim.fusion.pp_chain_prior",
        "starsim.fusion.cno_cycle_prior",
        "starsim.runtime.evaluate_fusion_microphysics",
        "starsim.claim_boundary.stage1_reduced_order_prior",
      ]),
    );
    expect(stage?.calculatorPayloadRefs.map((payload) => payload.payloadId)).toContain(
      "teff_from_luminosity_radius_payload",
    );
    expect(stage?.objectBindings.map((binding) => binding.id)).toContain("main-sequence-solar-analog");
  });

  it("routes neutron stars to compact-object context instead of ordinary fusion payloads", () => {
    const stage = getStarSimStellarEvolutionStage("starsim.lifecycle.neutron_star");

    expect(stage?.theoryBadgeIds).toContain("starsim.fusion.compact_object_not_fusing");
    expect(stage?.calculatorPayloadRefs).toEqual([]);
  });
});
