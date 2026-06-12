import { describe, expect, it } from "vitest";

import { validateTheoryBadgeGraphV1, type TheoryBadgeV1 } from "../../contracts/theory-badge-graph.v1";
import { isTheoryCompoundRunV1 } from "../../contracts/theory-compound-run.v1";
import { isTheorySweepRunV1 } from "../../contracts/theory-sweep-run.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  PHASE_OF_MATTER_THEORY_BADGES,
  PHASE_OF_MATTER_THEORY_EDGES,
} from "../phase-of-matter-theory-badges";
import {
  buildTimeCrystalSignedDetuningSweepRun,
  buildTimeCrystalSubharmonicFrequencySweepRun,
} from "../time-crystal-sweep-preset";
import { buildTheoryCompoundRun } from "../theory-compound-run-builder";

describe("phase of matter theory badges", () => {
  it("declares bounded badges for identity, conditions, density, structure, frequency, and water state", () => {
    const badgesById = new Map(PHASE_OF_MATTER_THEORY_BADGES.map((badge) => [badge.id, badge]));

    expect(PHASE_OF_MATTER_THEORY_BADGES.map((badge) => badge.id)).toEqual([
      "matter.phase.composition_identity_context",
      "matter.phase.thermodynamic_state_context",
      "matter.phase.equation_of_state_density_context",
      "matter.phase.structural_order_context",
      "matter.phase.dynamical_order_context",
      "matter.phase.time_translation_symmetry_context",
      "matter.phase.equilibrium_time_crystal_claim_context",
      "matter.phase.equilibrium_time_crystal_no_go_boundary",
      "matter.phase.floquet_discrete_time_crystal_context",
      "matter.phase.prethermal_discrete_time_crystal_context",
      "matter.phase.driven_dissipative_continuous_time_crystal_context",
      "matter.phase.time_crystal_observable_signature_context",
      "matter.phase.time_crystal_platform_parameter_context",
      "matter.phase.time_crystal_claim_boundary",
      "matter.phase.ergodicity_breaking_context",
      "matter.phase.many_body_synchronization_context",
      "matter.phase.open_system_drive_dissipation_context",
      "matter.phase.entropy_production_context",
      "matter.phase.floquet_quasienergy_context",
      "matter.phase.quantum_classical_time_crystal_bridge_context",
      "matter.phase.self_organized_oscillation_boundary",
      "matter.phase.quantized_mode_frequency_context",
      "matter.phase.water_conditioned_state_context",
    ]);

    for (const badge of PHASE_OF_MATTER_THEORY_BADGES) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge.claimBoundary.promotionAllowed).toBe(false);
      expect(badge.sourceRefs.some((ref) => ref.kind === "literature_ref")).toBe(true);
    }

    expect(badgesById.get("matter.phase.thermodynamic_state_context")?.units).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "T_K", unit: "K" }),
        expect.objectContaining({ symbol: "P_Pa", unit: "Pa" }),
      ]),
    );
    expect(badgesById.get("matter.phase.equation_of_state_density_context")?.units).toEqual(
      expect.arrayContaining([expect.objectContaining({ symbol: "rho_m_kg_m3", unit: "kg/m^3" })]),
    );
    expect(badgesById.get("matter.phase.quantized_mode_frequency_context")?.calculatorPayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "phase_mode_energy_frequency_payload",
          expression: "deltaE = h * nu",
        }),
      ]),
    );
  });

  it("exposes calculator payloads for time-crystal drive, response, detuning, and entropy bookkeeping", () => {
    const badgesById = new Map(PHASE_OF_MATTER_THEORY_BADGES.map((badge) => [badge.id, badge]));
    const payloadExpressionsFor = (id: string) =>
      badgesById.get(id)?.calculatorPayloads.map((payload) => payload.expression) ?? [];

    expect(payloadExpressionsFor("matter.phase.floquet_discrete_time_crystal_context")).toEqual(
      expect.arrayContaining([
        "T_response_s = n_period_multiplier * T_drive_s",
        "f_response_Hz = f_drive_Hz / n_period_multiplier",
      ]),
    );
    expect(payloadExpressionsFor("matter.phase.time_crystal_observable_signature_context")).toEqual(
      expect.arrayContaining([
        "signed_detuning_Hz = f_observed_Hz - f_drive_Hz / n_period_multiplier",
        "subharmonic_ratio = f_drive_Hz / f_observed_Hz",
      ]),
    );
    expect(payloadExpressionsFor("matter.phase.floquet_quasienergy_context")).toEqual(
      expect.arrayContaining(["T_drive_s = 1 / f_drive_Hz", "omega_drive_rad_s = 2 * pi * f_drive_Hz"]),
    );
    expect(payloadExpressionsFor("matter.phase.entropy_production_context")).toContain(
      "sigma_rate_J_per_K_s = Sigma_J_per_K / t_s",
    );
  });

  it("places time crystals under dynamical order with grounded no-go and non-equilibrium route references", () => {
    const badgesById = new Map(PHASE_OF_MATTER_THEORY_BADGES.map((badge) => [badge.id, badge]));
    const sourceIdsFor = (id: string) => badgesById.get(id)?.sourceRefs.map((ref) => ref.id) ?? [];

    expect(sourceIdsFor("matter.phase.time_translation_symmetry_context")).toEqual(
      expect.arrayContaining([
        "doi:10.1103/PhysRevLett.109.160401",
        "doi:10.1103/PhysRevLett.114.251603",
        "doi:10.1103/PhysRevLett.117.090402",
      ]),
    );
    expect(sourceIdsFor("matter.phase.floquet_discrete_time_crystal_context")).toEqual(
      expect.arrayContaining([
        "doi:10.1103/PhysRevLett.117.090402",
        "doi:10.1103/PhysRevLett.116.250401",
        "doi:10.1103/PhysRevLett.118.030401",
      ]),
    );
    expect(sourceIdsFor("matter.phase.time_crystal_observable_signature_context")).toEqual(
      expect.arrayContaining(["doi:10.1038/nature21413", "doi:10.1038/nature21426"]),
    );
    expect(sourceIdsFor("matter.phase.prethermal_discrete_time_crystal_context")).toContain(
      "doi:10.1126/science.abg8102",
    );
    expect(sourceIdsFor("matter.phase.driven_dissipative_continuous_time_crystal_context")).toContain(
      "doi:10.1126/science.abo3382",
    );

    expect(badgesById.get("matter.phase.equilibrium_time_crystal_claim_context")?.status).toBe("blocked");
    expect(badgesById.get("matter.phase.time_crystal_observable_signature_context")?.level).toBe("diagnostic_gate");
    expect(badgesById.get("matter.phase.time_crystal_platform_parameter_context")?.assumptions.join(" ")).toMatch(
      /not time-crystal order parameters/i,
    );
  });

  it("adds entropy, ergodicity, synchronization, quasienergy, and quantum-classical bridge context", () => {
    const badgesById = new Map(PHASE_OF_MATTER_THEORY_BADGES.map((badge) => [badge.id, badge]));
    const sourceIdsFor = (id: string) => badgesById.get(id)?.sourceRefs.map((ref) => ref.id) ?? [];

    expect(sourceIdsFor("matter.phase.ergodicity_breaking_context")).toEqual(
      expect.arrayContaining(["doi:10.1103/RevModPhys.95.031001", "doi:10.1103/PhysRevLett.116.250401"]),
    );
    expect(sourceIdsFor("matter.phase.many_body_synchronization_context")).toEqual(
      expect.arrayContaining(["doi:10.1103/PhysRevLett.126.020603", "doi:10.1103/RevModPhys.95.031001"]),
    );
    expect(sourceIdsFor("matter.phase.open_system_drive_dissipation_context")).toEqual(
      expect.arrayContaining(["doi:10.22331/q-2020-05-25-270", "doi:10.1126/science.abo3382"]),
    );
    expect(sourceIdsFor("matter.phase.entropy_production_context")).toEqual(
      expect.arrayContaining(["doi:10.1103/PhysRevLett.126.020603", "doi:10.1103/dj21-gmdj"]),
    );
    expect(sourceIdsFor("matter.phase.floquet_quasienergy_context")).toEqual(
      expect.arrayContaining(["doi:10.1103/PhysRevLett.117.090402", "doi:10.22331/q-2020-05-25-270"]),
    );
    expect(sourceIdsFor("matter.phase.quantum_classical_time_crystal_bridge_context")).toEqual(
      expect.arrayContaining(["doi:10.1103/RevModPhys.95.031001", "doi:10.1103/PhysRevLett.109.160402"]),
    );

    expect(badgesById.get("matter.phase.entropy_production_context")?.assumptions.join(" ")).toMatch(
      /not a violation of thermodynamic laws/i,
    );
    expect(badgesById.get("matter.phase.quantum_classical_time_crystal_bridge_context")?.assumptions.join(" ")).toMatch(
      /does not certify mechanism equivalence/i,
    );
    expect(badgesById.get("matter.phase.self_organized_oscillation_boundary")?.level).toBe("claim_boundary");
  });

  it("keeps phase density and frequency observables in the safe first-principles chain", () => {
    expect(PHASE_OF_MATTER_THEORY_EDGES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "matter.phase.composition_identity_context",
          to: "matter.phase.thermodynamic_state_context",
          relation: "bounds",
        }),
        expect.objectContaining({
          from: "matter.phase.thermodynamic_state_context",
          to: "matter.phase.equation_of_state_density_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.thermodynamic_state_context",
          to: "matter.phase.structural_order_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.structural_order_context",
          to: "matter.phase.quantized_mode_frequency_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "physics.quantum.energy_frequency",
          to: "matter.phase.quantized_mode_frequency_context",
          relation: "specializes",
        }),
      ]),
    );

    const frequencyBridge = PHASE_OF_MATTER_THEORY_EDGES.find(
      (edge) => edge.id === "quantum_energy_frequency_specializes_phase_mode_frequency",
    );
    expect(frequencyBridge?.claimBoundaryNote).toMatch(/not a bulk-density equation of state/i);
  });

  it("connects time crystals as dynamical phases with a blocked equilibrium route and diagnostic signatures", () => {
    expect(PHASE_OF_MATTER_THEORY_EDGES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "matter.phase.structural_order_context",
          to: "matter.phase.dynamical_order_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "matter.phase.dynamical_order_context",
          to: "matter.phase.time_translation_symmetry_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.equilibrium_time_crystal_no_go_boundary",
          to: "matter.phase.equilibrium_time_crystal_claim_context",
          relation: "blocks",
        }),
        expect.objectContaining({
          from: "matter.phase.time_translation_symmetry_context",
          to: "matter.phase.floquet_discrete_time_crystal_context",
          relation: "specializes",
        }),
        expect.objectContaining({
          from: "matter.phase.time_translation_symmetry_context",
          to: "matter.phase.prethermal_discrete_time_crystal_context",
          relation: "specializes",
        }),
        expect.objectContaining({
          from: "matter.phase.time_translation_symmetry_context",
          to: "matter.phase.driven_dissipative_continuous_time_crystal_context",
          relation: "specializes",
        }),
        expect.objectContaining({
          from: "matter.phase.floquet_discrete_time_crystal_context",
          to: "matter.phase.time_crystal_observable_signature_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.time_crystal_observable_signature_context",
          to: "matter.phase.quantized_mode_frequency_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "matter.phase.equation_of_state_density_context",
          to: "matter.phase.time_crystal_platform_parameter_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "matter.phase.time_crystal_observable_signature_context",
          to: "matter.phase.time_crystal_claim_boundary",
          relation: "documents",
        }),
      ]),
    );

    const densityEdge = PHASE_OF_MATTER_THEORY_EDGES.find(
      (edge) => edge.id === "phase_eos_density_documents_time_crystal_platform_parameters",
    );
    expect(densityEdge?.claimBoundaryNote).toMatch(/not the defining time-crystal order parameter/i);
  });

  it("connects entropy and quantum-classical bridge context without promoting self-oscillation", () => {
    expect(PHASE_OF_MATTER_THEORY_EDGES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "matter.phase.dynamical_order_context",
          to: "matter.phase.ergodicity_breaking_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.dynamical_order_context",
          to: "matter.phase.many_body_synchronization_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.open_system_drive_dissipation_context",
          to: "matter.phase.entropy_production_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.entropy_production_context",
          to: "matter.phase.time_crystal_claim_boundary",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "matter.phase.floquet_quasienergy_context",
          to: "matter.phase.floquet_discrete_time_crystal_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "matter.phase.many_body_synchronization_context",
          to: "matter.phase.quantum_classical_time_crystal_bridge_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "matter.phase.self_organized_oscillation_boundary",
          to: "matter.phase.time_crystal_observable_signature_context",
          relation: "bounds",
        }),
      ]),
    );

    const entropyEdge = PHASE_OF_MATTER_THEORY_EDGES.find(
      (edge) => edge.id === "entropy_production_documents_time_crystal_claim_boundary",
    );
    const bridgeEdge = PHASE_OF_MATTER_THEORY_EDGES.find(
      (edge) => edge.id === "quantum_classical_bridge_documents_time_crystal_claim_boundary",
    );
    expect(entropyEdge?.claimBoundaryNote).toMatch(/not a violation or a phase proof/i);
    expect(bridgeEdge?.claimBoundaryNote).toMatch(/cannot certify mechanism equivalence/i);
  });

  it("extends water context into condition-qualified phase behavior without overclaiming origin or habitability", () => {
    const waterBadge = PHASE_OF_MATTER_THEORY_BADGES.find(
      (badge) => badge.id === "matter.phase.water_conditioned_state_context",
    );

    expect(waterBadge?.assumptions.join(" ")).toMatch(/ice, liquid, vapor, and supercritical/i);
    expect(waterBadge?.assumptions.join(" ")).toMatch(/requires temperature, pressure, composition/i);
    expect(waterBadge?.assumptions.join(" ")).toMatch(/not a habitability, life, prebiotic-success, or fusion-origin claim/i);
    expect(waterBadge?.sourceRefs.map((ref) => ref.id)).toEqual(
      expect.arrayContaining(["doi:10.1063/1.1461829", "IAPWS R6-95(2018)", "NIST Chemistry WebBook SRD 69"]),
    );

    expect(PHASE_OF_MATTER_THEORY_EDGES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "astrochemistry.water.h_o_binding_context",
          to: "matter.phase.water_conditioned_state_context",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "matter.phase.equation_of_state_density_context",
          to: "matter.phase.water_conditioned_state_context",
          relation: "specializes",
        }),
        expect.objectContaining({
          from: "matter.phase.water_conditioned_state_context",
          to: "matter.phase.quantized_mode_frequency_context",
          relation: "documents",
        }),
      ]),
    );
  });

  it("integrates into the full Helix theory graph", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const issues = validateTheoryBadgeGraphV1(graph);
    const graphBadgeIds = new Set(graph.badges.map((badge: TheoryBadgeV1) => badge.id));
    const graphEdgeIds = new Set(graph.edges.map((edge) => edge.id));

    expect(issues).toEqual([]);
    expect(graphBadgeIds).toContain("matter.phase.composition_identity_context");
    expect(graphBadgeIds).toContain("matter.phase.equation_of_state_density_context");
    expect(graphBadgeIds).toContain("matter.phase.floquet_discrete_time_crystal_context");
    expect(graphBadgeIds).toContain("matter.phase.equilibrium_time_crystal_no_go_boundary");
    expect(graphBadgeIds).toContain("matter.phase.entropy_production_context");
    expect(graphBadgeIds).toContain("matter.phase.quantum_classical_time_crystal_bridge_context");
    expect(graphBadgeIds).toContain("matter.phase.self_organized_oscillation_boundary");
    expect(graphBadgeIds).toContain("matter.phase.time_crystal_observable_signature_context");
    expect(graphBadgeIds).toContain("matter.phase.quantized_mode_frequency_context");
    expect(graphBadgeIds).toContain("matter.phase.water_conditioned_state_context");
    expect(graphEdgeIds).toContain("water_binding_requires_conditioned_phase_state");
    expect(graphEdgeIds).toContain("equilibrium_no_go_blocks_equilibrium_time_crystal_claim");
    expect(graphEdgeIds).toContain("entropy_production_documents_time_crystal_claim_boundary");
    expect(graphEdgeIds).toContain("quantum_classical_bridge_documents_time_crystal_claim_boundary");
    expect(graphEdgeIds).toContain("phase_eos_density_documents_time_crystal_platform_parameters");
    expect(graphEdgeIds).toContain("quantum_energy_frequency_specializes_phase_mode_frequency");
  });

  it("builds a calculator-loadable compound run for the time-crystal diagnostic path without solving it", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const run = buildTheoryCompoundRun({
      graph,
      badgeIds: [
        "matter.phase.floquet_quasienergy_context",
        "matter.phase.floquet_discrete_time_crystal_context",
        "matter.phase.time_crystal_observable_signature_context",
        "matter.phase.entropy_production_context",
        "matter.phase.quantized_mode_frequency_context",
      ],
      mode: "selected_badges",
      generatedAt: "2026-06-12T00:00:00.000Z",
    });

    expect(isTheoryCompoundRunV1(run)).toBe(true);
    expect(run.summary.scalarCount).toBeGreaterThanOrEqual(8);
    expect(run.rows.filter((row) => row.kind === "scalar").map((row) => row.expression)).toEqual(
      expect.arrayContaining([
        "T_drive_s = 1 / f_drive_Hz",
        "omega_drive_rad_s = 2 * pi * f_drive_Hz",
        "T_response_s = n_period_multiplier * T_drive_s",
        "f_response_Hz = f_drive_Hz / n_period_multiplier",
        "signed_detuning_Hz = f_observed_Hz - f_drive_Hz / n_period_multiplier",
        "subharmonic_ratio = f_drive_Hz / f_observed_Hz",
        "sigma_rate_J_per_K_s = Sigma_J_per_K / t_s",
        "deltaE = h * nu",
      ]),
    );
    expect(run.rows.filter((row) => row.kind === "scalar").every((row) => row.status === "pending")).toBe(true);
    expect(JSON.stringify(run)).toMatch(/Scalar row is loadable by the scientific calculator but has not been solved/);
    expect(JSON.stringify(run)).toMatch(/promotion not allowed/);
  });

  it("builds diagnostic-only time-crystal sweep presets for subharmonic response and detuning", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const responseSweep = buildTimeCrystalSubharmonicFrequencySweepRun({
      graphId: graph.graphId,
      driveFrequenciesHz: [2, 4, 6],
      periodMultiplier: 2,
      generatedAt: "2026-06-12T00:00:00.000Z",
    });
    const detuningSweep = buildTimeCrystalSignedDetuningSweepRun({
      graphId: graph.graphId,
      driveFrequenciesHz: [2, 4, 6],
      observedFrequenciesHz: [1, 2.05, 3],
      periodMultiplier: 2,
      generatedAt: "2026-06-12T00:00:00.000Z",
    });

    expect(isTheorySweepRunV1(responseSweep)).toBe(true);
    expect(responseSweep.samples.map((sample) => sample.scalarResults.f_response_Hz)).toEqual([1, 2, 3]);
    expect(responseSweep.targetBadgeIds).toEqual(
      expect.arrayContaining([
        "matter.phase.floquet_quasienergy_context",
        "matter.phase.floquet_discrete_time_crystal_context",
        "matter.phase.time_crystal_observable_signature_context",
        "matter.phase.time_crystal_claim_boundary",
      ]),
    );
    expect(responseSweep.claimBoundary.diagnosticOnly).toBe(true);
    expect(responseSweep.claimBoundary.physicalMechanismClaimAllowed).toBe(false);

    expect(isTheorySweepRunV1(detuningSweep)).toBe(true);
    expect(detuningSweep.samples.map((sample) => sample.scalarResults.signed_detuning_Hz)).toEqual([0, 0.04999999999999982, 0]);
    expect(detuningSweep.claimBoundary.notes.join(" ")).toMatch(/evidence row, not answer authority/i);
  });

  it("does not emit unsafe phase, density, or frequency overclaims", () => {
    const serialized = JSON.stringify({
      badges: PHASE_OF_MATTER_THEORY_BADGES,
      edges: PHASE_OF_MATTER_THEORY_EDGES,
    });

    expect(serialized).not.toMatch(/density follows from E ?= ?hf/i);
    expect(serialized).not.toMatch(/E ?= ?hf directly derives bulk density/i);
    expect(serialized).not.toMatch(/water phase is guaranteed/i);
    expect(serialized).not.toMatch(/hydrogen and oxygen determine water density/i);
    expect(serialized).not.toMatch(/phase proves habitability/i);
    expect(serialized).not.toMatch(/frequency proves molecular structure/i);
    expect(serialized).not.toMatch(/time crystals are perpetual motion/i);
    expect(serialized).not.toMatch(/time crystals violate energy conservation/i);
    expect(serialized).not.toMatch(/any repeating oscillation is a time crystal/i);
    expect(serialized).not.toMatch(/frequency alone proves time-crystalline order/i);
    expect(serialized).not.toMatch(/density determines time-crystal behavior/i);
    expect(serialized).not.toMatch(/equilibrium ground-state time crystals are accepted ordinary matter phases/i);
    expect(serialized).not.toMatch(/entropy is bypassed by time crystals/i);
    expect(serialized).not.toMatch(/classical oscillation equals time crystal/i);
    expect(serialized).not.toMatch(/quantum-classical bridge proves same mechanism/i);
  });
});
