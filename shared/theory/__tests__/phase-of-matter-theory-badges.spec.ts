import { describe, expect, it } from "vitest";

import { validateTheoryBadgeGraphV1, type TheoryBadgeV1 } from "../../contracts/theory-badge-graph.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  PHASE_OF_MATTER_THEORY_BADGES,
  PHASE_OF_MATTER_THEORY_EDGES,
} from "../phase-of-matter-theory-badges";

describe("phase of matter theory badges", () => {
  it("declares bounded badges for identity, conditions, density, structure, frequency, and water state", () => {
    const badgesById = new Map(PHASE_OF_MATTER_THEORY_BADGES.map((badge) => [badge.id, badge]));

    expect(PHASE_OF_MATTER_THEORY_BADGES.map((badge) => badge.id)).toEqual([
      "matter.phase.composition_identity_context",
      "matter.phase.thermodynamic_state_context",
      "matter.phase.equation_of_state_density_context",
      "matter.phase.structural_order_context",
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
    expect(graphBadgeIds).toContain("matter.phase.quantized_mode_frequency_context");
    expect(graphBadgeIds).toContain("matter.phase.water_conditioned_state_context");
    expect(graphEdgeIds).toContain("water_binding_requires_conditioned_phase_state");
    expect(graphEdgeIds).toContain("quantum_energy_frequency_specializes_phase_mode_frequency");
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
  });
});
