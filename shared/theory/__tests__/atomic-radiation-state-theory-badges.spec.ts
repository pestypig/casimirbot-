import { describe, expect, it } from "vitest";
import { ELEMENT_ORIGIN_REGISTRY } from "../../periodic-table";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import {
  ATOMIC_RADIATION_STATE_THEORY_BADGES,
  ATOMIC_RADIATION_STATE_THEORY_EDGES,
} from "../atomic-radiation-state-theory-badges";
import {
  locateTheoryBadges,
  traceTheoryBadgeConnections,
} from "../theory-badge-overlap-locator";

describe("atomic and radiation state theory badges", () => {
  it("separates element identity, atomic state, transition frequency, and laser context", () => {
    const badgesById = new Map(ATOMIC_RADIATION_STATE_THEORY_BADGES.map((badge) => [badge.id, badge]));

    expect([...badgesById.keys()]).toEqual(
      expect.arrayContaining([
        "physics.atomic.element_identity_context",
        "physics.atomic.ionization_charge_state_context",
        "physics.atomic.electronic_level_structure_context",
        "physics.atomic.level_population_context",
        "physics.atomic.transition_gap_frequency_context",
        "physics.radiation.mode_context",
        "physics.radiation.quantum_field_state_context",
        "physics.radiation.laser_coherence_context",
      ]),
    );
    expect(badgesById.get("physics.atomic.electronic_level_structure_context")?.assumptions.join(" ")).toMatch(
      /does not select one without state-population evidence/i,
    );
    expect(badgesById.get("physics.atomic.transition_gap_frequency_context")?.equations[0].displayLatex).toBe(
      "\\Delta E_{ul}=E_u-E_l=h\\nu_{ul}",
    );
    expect(badgesById.get("physics.radiation.quantum_field_state_context")?.assumptions.join(" ")).toMatch(
      /does not specify photon number or field statistics/i,
    );
    expect(badgesById.get("physics.radiation.laser_coherence_context")?.assumptions.join(" ")).toMatch(
      /not sufficient by itself to establish laser coherence/i,
    );
  });

  it("gives every element separate identity/origin and charge-state routes", () => {
    const identityEdges = ATOMIC_RADIATION_STATE_THEORY_EDGES.filter(
      (edge) => edge.from === "physics.atomic.element_identity_context" && edge.to.startsWith("element."),
    );
    const ionizationEdges = ATOMIC_RADIATION_STATE_THEORY_EDGES.filter(
      (edge) => edge.from.startsWith("element.") && edge.to === "physics.atomic.ionization_charge_state_context",
    );

    expect(identityEdges).toHaveLength(ELEMENT_ORIGIN_REGISTRY.length);
    expect(ionizationEdges).toHaveLength(ELEMENT_ORIGIN_REGISTRY.length);
    expect(identityEdges).toContainEqual(
      expect.objectContaining({
        to: "element.h.origin",
        relation: "specializes",
      }),
    );
  });

  it("connects an element and E = h f through a bounded atomic-transition junction", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const trace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["element.h.origin", "physics.quantum.energy_frequency"],
    });

    expect(trace.connectingBadgeIds).toEqual(
      expect.arrayContaining([
        "element.h.origin",
        "physics.quantum.energy_frequency",
        "physics.atomic.ionization_charge_state_context",
        "physics.atomic.electronic_level_structure_context",
        "physics.atomic.transition_gap_frequency_context",
      ]),
    );
    expect(trace.pathSegments.flatMap((segment) => segment.edgeIds)).toEqual(
      expect.arrayContaining([
        "element_h_admits_ionization_state_context",
        "ionization_state_conditions_electronic_level_structure",
        "electronic_levels_derive_atomic_transition_gap",
        "quantum_energy_frequency_specializes_atomic_transition_gap",
      ]),
    );
    expect(ATOMIC_RADIATION_STATE_THEORY_EDGES).toContainEqual(
      expect.objectContaining({
        id: "atomic_transition_gap_documents_atomic_line_identification",
        to: "stellar.spectroscopy.atomic_line_identification_context",
      }),
    );
    expect(trace.warnings).toEqual([]);
    expect(trace.sharedSymbols).toEqual([]);
  });

  it("does not infer a ground state, phase, or laser from element selection", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const groundTrace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["element.h.origin", "low_temp.quantum.zero_point_energy_floor"],
    });

    expect(groundTrace.connectingBadgeIds).not.toContain("low_temp.quantum.zero_point_energy_floor");
    expect(groundTrace.connectingBadgeIds).not.toContain("matter.phase.thermodynamic_state_context");
    expect(groundTrace.connectingBadgeIds).not.toContain("physics.radiation.laser_coherence_context");
    expect(groundTrace.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/no directed connection/i)]),
    );
  });

  it("connects E = h f to laser context only through mode and field-state definitions", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const trace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["physics.quantum.energy_frequency", "physics.radiation.laser_coherence_context"],
    });

    expect(trace.connectingBadgeIds).toEqual([
      "physics.quantum.energy_frequency",
      "physics.radiation.massless_photon_kinematics_context",
      "physics.radiation.mode_context",
      "physics.radiation.quantum_field_state_context",
      "physics.radiation.laser_coherence_context",
    ]);
  });

  it("keeps hydrogen H distinct from Planck's constant h in symbol matching", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const matches = locateTheoryBadges({
      graph,
      input: {
        symbols: ["H"],
        limit: 50,
      },
    });

    expect(matches.map((match) => match.badgeId)).toContain("element.h.origin");
    expect(matches.map((match) => match.badgeId)).not.toContain("physics.quantum.energy_frequency");
  });
});
