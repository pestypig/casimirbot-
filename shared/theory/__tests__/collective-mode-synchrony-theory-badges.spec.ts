import { describe, expect, it } from "vitest";

import { validateTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { isTheoryCompoundRunV1 } from "../../contracts/theory-compound-run.v1";
import { isTheorySweepRunV1 } from "../../contracts/theory-sweep-run.v1";
import {
  COLLECTIVE_MODE_SYNCHRONY_THEORY_BADGES,
  COLLECTIVE_MODE_SYNCHRONY_THEORY_EDGES,
} from "../collective-mode-synchrony-theory-badges";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  buildCollectiveLifetimeLimitedLinewidthSweepRun,
  buildMagnonSpaceTimeCrystalWavelengthSweepRun,
  buildNoisySynchronyMarginSweepRun,
  buildPolaritonicReservoirInverseLifetimeSweepRun,
  buildPolaritonicReservoirLinewidthProxySweepRun,
  buildStabilizedVsNoisyLifetimeSweepRun,
} from "../time-crystal-sweep-preset";
import { buildTheoryCompoundRun } from "../theory-compound-run-builder";

describe("collective mode synchrony theory badges", () => {
  it("declares bounded bridge badges for polariton reservoirs, noisy synchrony, and magnon space-time lattices", () => {
    const badgesById = new Map(COLLECTIVE_MODE_SYNCHRONY_THEORY_BADGES.map((badge) => [badge.id, badge]));

    expect(COLLECTIVE_MODE_SYNCHRONY_THEORY_BADGES.map((badge) => badge.id)).toEqual([
      "matter.collective.polariton_reservoir_lifetime_context",
      "matter.collective.polariton_decoherence_boundary",
      "matter.time_crystal.collective_lifetime_limited_linewidth_context",
      "matter.time_crystal.noisy_synchrony_margin_context",
      "matter.time_crystal.stabilized_vs_noisy_trace_context",
      "matter.time_crystal.magnon_space_time_lattice_context",
      "matter.time_crystal.polariton_stc_bridge_boundary",
    ]);

    for (const badge of COLLECTIVE_MODE_SYNCHRONY_THEORY_BADGES) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
      expect(badge.sourceRefs.some((ref) => ref.kind === "literature_ref")).toBe(true);
    }

    expect(badgesById.get("matter.collective.polariton_reservoir_lifetime_context")?.sourceRefs.map((ref) => ref.id)).toContain(
      "PubMed:41707245",
    );
    expect(badgesById.get("matter.time_crystal.collective_lifetime_limited_linewidth_context")?.sourceRefs.map((ref) => ref.id)).toContain(
      "doi:10.1038/s41567-025-03163-6",
    );
    expect(badgesById.get("matter.time_crystal.magnon_space_time_lattice_context")?.sourceRefs.map((ref) => ref.id)).toContain(
      "doi:10.1103/PhysRevLett.126.057201",
    );
    expect(badgesById.get("matter.time_crystal.polariton_stc_bridge_boundary")?.sourceRefs.map((ref) => ref.id)).toEqual(
      expect.arrayContaining([
        "PubMed:41707245",
        "doi:10.1038/s41567-025-03163-6",
        "doi:10.1103/PhysRevLett.126.057201",
        "doi:10.1088/1361-6633/ad6585",
      ]),
    );
  });

  it("exposes calculator payloads for lifetime, linewidth, noisy margin, lifetime gain, and magnon wavelength", () => {
    const badgesById = new Map(COLLECTIVE_MODE_SYNCHRONY_THEORY_BADGES.map((badge) => [badge.id, badge]));
    const payloadExpressionsFor = (id: string) =>
      badgesById.get(id)?.calculatorPayloads.map((payload) => payload.expression) ?? [];

    expect(payloadExpressionsFor("matter.collective.polariton_reservoir_lifetime_context")).toEqual(
      expect.arrayContaining([
        "Gamma_life_s_inv = 1 / tau_s",
        "linewidth_proxy_Hz = 1 / (2 * pi * tau_s)",
      ]),
    );
    expect(payloadExpressionsFor("matter.time_crystal.collective_lifetime_limited_linewidth_context")).toContain(
      "delta_f_collective_Hz = 1 / (2 * pi * T2_prime_s)",
    );
    expect(payloadExpressionsFor("matter.time_crystal.noisy_synchrony_margin_context")).toContain(
      "stability_margin_s_inv = locking_rate_s_inv - noise_dephasing_rate_s_inv - loss_rate_s_inv",
    );
    expect(payloadExpressionsFor("matter.time_crystal.stabilized_vs_noisy_trace_context")).toContain(
      "lifetime_gain = T2_prime_stabilized_s / T2_prime_noisy_s",
    );
    expect(payloadExpressionsFor("matter.time_crystal.magnon_space_time_lattice_context")).toContain(
      "lambda_um = 1 / k_um_inv",
    );
    expect(badgesById.get("matter.collective.polariton_decoherence_boundary")?.calculatorPayloads).toEqual([]);
    expect(badgesById.get("matter.time_crystal.polariton_stc_bridge_boundary")?.calculatorPayloads).toEqual([]);
  });

  it("connects bridge context into the phase/time-crystal graph without mechanism promotion", () => {
    expect(COLLECTIVE_MODE_SYNCHRONY_THEORY_EDGES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "matter.collective.polariton_reservoir_lifetime_context",
          to: "matter.collective.polariton_decoherence_boundary",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.time_crystal_observable_signature_context",
          to: "matter.time_crystal.collective_lifetime_limited_linewidth_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.open_system_drive_dissipation_context",
          to: "matter.time_crystal.noisy_synchrony_margin_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.time_crystal.stabilized_vs_noisy_trace_context",
          to: "matter.phase.time_crystal_claim_boundary",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "matter.time_crystal.polariton_stc_bridge_boundary",
          to: "matter.phase.time_crystal_claim_boundary",
          relation: "bounds",
        }),
      ]),
    );

    const bridgeEdge = COLLECTIVE_MODE_SYNCHRONY_THEORY_EDGES.find(
      (edge) => edge.id === "polariton_stc_bridge_bounds_time_crystal_claim_boundary",
    );
    expect(bridgeEdge?.claimBoundaryNote).toMatch(/cannot certify mechanism equivalence/i);
  });

  it("integrates into the full Helix theory graph and compound calculator run", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const graphBadgeIds = new Set(graph.badges.map((badge) => badge.id));
    const graphEdgeIds = new Set(graph.edges.map((edge) => edge.id));
    const run = buildTheoryCompoundRun({
      graph,
      badgeIds: [
        "matter.collective.polariton_reservoir_lifetime_context",
        "matter.time_crystal.collective_lifetime_limited_linewidth_context",
        "matter.time_crystal.noisy_synchrony_margin_context",
        "matter.time_crystal.stabilized_vs_noisy_trace_context",
        "matter.time_crystal.magnon_space_time_lattice_context",
      ],
      mode: "selected_badges",
      generatedAt: "2026-06-12T00:00:00.000Z",
    });

    expect(validateTheoryBadgeGraphV1(graph)).toEqual([]);
    expect(graphBadgeIds).toContain("matter.collective.polariton_reservoir_lifetime_context");
    expect(graphBadgeIds).toContain("matter.time_crystal.polariton_stc_bridge_boundary");
    expect(graphEdgeIds).toContain("time_crystal_signature_requires_collective_linewidth_context");
    expect(graphEdgeIds).toContain("polariton_stc_bridge_bounds_time_crystal_claim_boundary");

    expect(isTheoryCompoundRunV1(run)).toBe(true);
    expect(run.rows.filter((row) => row.kind === "scalar").map((row) => row.expression)).toEqual(
      expect.arrayContaining([
        "Gamma_life_s_inv = 1 / tau_s",
        "linewidth_proxy_Hz = 1 / (2 * pi * tau_s)",
        "delta_f_collective_Hz = 1 / (2 * pi * T2_prime_s)",
        "stability_margin_s_inv = locking_rate_s_inv - noise_dephasing_rate_s_inv - loss_rate_s_inv",
        "lifetime_gain = T2_prime_stabilized_s / T2_prime_noisy_s",
        "lambda_um = 1 / k_um_inv",
      ]),
    );
    expect(run.rows.filter((row) => row.kind === "scalar").every((row) => row.status === "pending")).toBe(true);
  });

  it("builds diagnostic sweeps matching the cited lifetime and magnon-wavelength scales", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const inverseLifetimeSweep = buildPolaritonicReservoirInverseLifetimeSweepRun({
      graphId: graph.graphId,
      lifetimesS: [0.0046],
      generatedAt: "2026-06-12T00:00:00.000Z",
    });
    const reservoirLinewidthSweep = buildPolaritonicReservoirLinewidthProxySweepRun({
      graphId: graph.graphId,
      lifetimesS: [0.0046],
      generatedAt: "2026-06-12T00:00:00.000Z",
    });
    const collectiveLinewidthSweep = buildCollectiveLifetimeLimitedLinewidthSweepRun({
      graphId: graph.graphId,
      lifetimesS: [0.08, 4.51],
      generatedAt: "2026-06-12T00:00:00.000Z",
    });
    const lifetimeGainSweep = buildStabilizedVsNoisyLifetimeSweepRun({
      graphId: graph.graphId,
      noisyLifetimeS: 0.08,
      stabilizedLifetimeS: 4.51,
      generatedAt: "2026-06-12T00:00:00.000Z",
    });
    const magnonSweep = buildMagnonSpaceTimeCrystalWavelengthSweepRun({
      graphId: graph.graphId,
      wavenumbersUmInv: [5, 10],
      generatedAt: "2026-06-12T00:00:00.000Z",
    });

    expect(isTheorySweepRunV1(inverseLifetimeSweep)).toBe(true);
    expect(inverseLifetimeSweep.samples[0].scalarResults.Gamma_life_s_inv).toBeCloseTo(217.3913, 4);
    expect(reservoirLinewidthSweep.samples[0].scalarResults.linewidth_proxy_Hz).toBeCloseTo(34.5989, 4);
    expect(collectiveLinewidthSweep.samples.map((sample) => sample.scalarResults.delta_f_collective_Hz)).toEqual([
      expect.closeTo(1.9894, 4),
      expect.closeTo(0.0353, 4),
    ]);
    expect(lifetimeGainSweep.samples[0].scalarResults.lifetime_gain).toBeCloseTo(56.375, 4);
    expect(magnonSweep.samples.map((sample) => sample.scalarResults.lambda_um)).toEqual([0.2, 0.1]);

    expect(inverseLifetimeSweep.claimBoundary.diagnosticOnly).toBe(true);
    expect(reservoirLinewidthSweep.claimBoundary.notes.join(" ")).toMatch(/not a measured decoherence linewidth/i);
    expect(magnonSweep.claimBoundary.notes.join(" ")).toMatch(/does not equate distinct mechanisms/i);
  });

  it("builds noisy synchrony margin sweeps as evidence-only diagnostics", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const noisySweep = buildNoisySynchronyMarginSweepRun({
      graphId: graph.graphId,
      lockingRatesSInv: [100, 200, 300],
      noiseDephasingRatesSInv: [20, 90, 180],
      lossRatesSInv: [30, 70, 150],
      generatedAt: "2026-06-12T00:00:00.000Z",
    });

    expect(isTheorySweepRunV1(noisySweep)).toBe(true);
    expect(noisySweep.samples.map((sample) => sample.scalarResults.stability_margin_s_inv)).toEqual([50, 40, -30]);
    expect(noisySweep.claimBoundary.diagnosticOnly).toBe(true);
    expect(noisySweep.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
    expect(noisySweep.claimBoundary.notes.join(" ")).toMatch(/positive margin is not a time-crystal claim/i);
  });

  it("does not emit unsafe bridge overclaims", () => {
    const serialized = JSON.stringify({
      badges: COLLECTIVE_MODE_SYNCHRONY_THEORY_BADGES,
      edges: COLLECTIVE_MODE_SYNCHRONY_THEORY_EDGES,
    });

    expect(serialized).not.toMatch(/SPC proves time crystal/i);
    expect(serialized).not.toMatch(/lifetime equals decoherence/i);
    expect(serialized).not.toMatch(/magnon STC proves biological BEC/i);
    expect(serialized).not.toMatch(/noisy synchrony validates mechanism/i);
    expect(serialized).not.toMatch(/space-time crystal equals discrete time crystal/i);
    expect(serialized).not.toMatch(/reservoir lifetime proves coherence/i);
  });
});
