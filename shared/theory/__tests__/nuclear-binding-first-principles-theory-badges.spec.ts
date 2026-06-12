import { describe, expect, it } from "vitest";

import { validateTheoryBadgeGraphV1, type TheoryBadgeEdgeV1, type TheoryBadgeV1 } from "../../contracts/theory-badge-graph.v1";
import { ELEMENT_ORIGIN_REGISTRY } from "../../periodic-table";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_BADGES,
  NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_EDGES,
} from "../nuclear-binding-first-principles-theory-badges";
import { buildTheoryContextReflection } from "../theory-context-reflector";

const EXPECTED_BADGE_IDS = [
  "physics.mass_energy.nuclear_binding_energy",
  "physics.nuclear.coulomb_barrier",
  "physics.quantum.tunneling_fusion_entrance",
  "physics.nuclear.strong_force_short_range_binding",
  "physics.atomic.quantum_bound_state_structure",
  "physics.atomic.electron_cloud_uncertainty_floor",
  "physics.atomic.pauli_shell_structure",
  "physics.atomic.electromagnetic_molecular_binding_context",
] as const;

const elementBadgeId = (symbol: string) => `element.${symbol.toLowerCase()}.origin`;

describe("nuclear binding first-principles theory badges", () => {
  it("adds cited first-principles bridge badges with strict claim boundaries", () => {
    const badgesById = new Map(NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_BADGES.map((badge) => [badge.id, badge]));

    expect(new Set(badgesById.keys())).toEqual(new Set(EXPECTED_BADGE_IDS));
    for (const badgeId of EXPECTED_BADGE_IDS) {
      const badge = badgesById.get(badgeId);

      expect(badge).toBeTruthy();
      expect(badge?.sourceRefs.some((ref) => ref.kind === "literature_ref")).toBe(true);
      expect(badge?.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge?.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge?.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("keeps calculator payloads limited to scalar-safe formulas and explicit proxies", () => {
    const payloadByBadgeId = new Map(
      NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_BADGES.map((badge) => [
        badge.id,
        badge.calculatorPayloads.map((payload) => payload.id),
      ]),
    );

    expect(payloadByBadgeId.get("physics.mass_energy.nuclear_binding_energy")).toEqual([
      "nuclear_binding_mass_energy_payload",
    ]);
    expect(payloadByBadgeId.get("physics.nuclear.coulomb_barrier")).toEqual(["nuclear_coulomb_barrier_payload"]);
    expect(payloadByBadgeId.get("physics.quantum.tunneling_fusion_entrance")).toEqual([
      "fusion_tunneling_proxy_payload",
    ]);
    expect(payloadByBadgeId.get("physics.atomic.electron_cloud_uncertainty_floor")).toEqual([
      "electron_cloud_uncertainty_floor_payload",
    ]);
    expect(payloadByBadgeId.get("physics.nuclear.strong_force_short_range_binding")).toEqual([]);
    expect(payloadByBadgeId.get("physics.atomic.quantum_bound_state_structure")).toEqual([]);
    expect(payloadByBadgeId.get("physics.atomic.pauli_shell_structure")).toEqual([]);
    expect(payloadByBadgeId.get("physics.atomic.electromagnetic_molecular_binding_context")).toEqual([]);
  });

  it("connects nuclear and atomic first principles into nucleosynthesis, elements, water, and phase context", () => {
    expect(NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_EDGES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "physics.nuclear.coulomb_barrier",
          to: "physics.quantum.tunneling_fusion_entrance",
          relation: "requires",
        }),
        expect.objectContaining({
          from: "physics.quantum.tunneling_fusion_entrance",
          to: "nucleosynthesis.hydrogen_burning.helium_production",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "physics.quantum.tunneling_fusion_entrance",
          to: "nucleosynthesis.alpha_capture.oxygen_neon_magnesium",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "physics.atomic.electromagnetic_molecular_binding_context",
          to: "astrochemistry.water.h_o_binding_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "physics.atomic.electromagnetic_molecular_binding_context",
          to: "matter.phase.structural_order_context",
          relation: "documents",
        }),
      ]),
    );

    for (const entry of ELEMENT_ORIGIN_REGISTRY) {
      expect(NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_EDGES).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: "physics.nuclear.strong_force_short_range_binding",
            to: elementBadgeId(entry.symbol),
            relation: "documents",
          }),
          expect.objectContaining({
            from: "physics.atomic.pauli_shell_structure",
            to: elementBadgeId(entry.symbol),
            relation: "documents",
          }),
        ]),
      );
    }
  });

  it("integrates into the full Helix theory badge graph", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const issues = validateTheoryBadgeGraphV1(graph);
    const graphBadgeIds = new Set(graph.badges.map((badge: TheoryBadgeV1) => badge.id));
    const graphEdgeIds = new Set(graph.edges.map((edge: TheoryBadgeEdgeV1) => edge.id));

    expect(issues).toEqual([]);
    for (const badgeId of EXPECTED_BADGE_IDS) {
      expect(graphBadgeIds).toContain(badgeId);
    }
    expect(graphEdgeIds).toContain("coulomb_barrier_requires_tunneling_fusion_entrance");
    expect(graphEdgeIds).toContain("strong_force_binding_documents_element_o");
    expect(graphEdgeIds).toContain("pauli_shell_documents_element_o");
    expect(graphEdgeIds).toContain("electromagnetic_binding_documents_water_context");
  });

  it("does not emit forbidden nuclear, atomic, or molecular overclaims", () => {
    const serialized = JSON.stringify({
      badges: NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_BADGES,
      edges: NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_EDGES,
    });

    expect(serialized).not.toMatch(/oxygen is produced directly from hydrogen burning/i);
    expect(serialized).not.toMatch(/strong force acts as the long-range force that starts fusion/i);
    expect(serialized).not.toMatch(/water is guaranteed when H and O exist/i);
    expect(serialized).not.toMatch(/atomic structure is generally phase-locked/i);
    expect(serialized).not.toMatch(/tunneling proxy computes full fusion reaction rates/i);
    expect(serialized).not.toMatch(/molecular binding is nuclear binding/i);
  });

  it("reflects Coulomb, tunneling, strong force, mass defect, and electron uncertainty as prompt-centered first-principles context", () => {
    const reflection = buildTheoryContextReflection({
      graph: buildHelixTheoryBadgeGraphV1(),
      prompt:
        "Reflect Coulomb repulsion, tunneling, strong force short range binding, mass defect binding energy, Schrodinger atomic bound states, Pauli shell structure, and electron uncertainty for molecular binding.",
      mentionedEquations: [
        "E_b_J = delta_m_kg * c_m_s^2",
        "V_c_J = (Z1 * Z2 * e_C^2) / (4 * pi * epsilon0_F_m * r_m)",
        "P_tunnel_proxy = exp(-2 * pi * eta)",
        "delta_p_min_kg_m_s = hbar_J_s / (2 * delta_x_m)",
      ],
      mentionedSymbols: [
        "delta_m_kg",
        "E_b_J",
        "Z1",
        "Z2",
        "V_c_J",
        "eta",
        "P_tunnel_proxy",
        "r_nuclear_m",
        "delta_x_m",
        "delta_p_min_kg_m_s",
        "hbar_J_s",
      ],
      generatedAt: "2026-06-12T00:00:00.000Z",
      reflectionId: "reflection:nuclear-binding-first-principles",
      limit: 24,
    });
    const roles = reflection.resolution?.roleByBadgeId ?? {};

    for (const badgeId of [
      "physics.mass_energy.nuclear_binding_energy",
      "physics.nuclear.coulomb_barrier",
      "physics.quantum.tunneling_fusion_entrance",
      "physics.nuclear.strong_force_short_range_binding",
      "physics.atomic.electron_cloud_uncertainty_floor",
    ]) {
      expect(["prompt_center", "first_principles_path"]).toContain(roles[badgeId]);
    }
    expect(reflection.evidenceForAsk.recommendedNextActions.every((action) => action.solves === false)).toBe(true);
  });
});
