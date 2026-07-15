import { describe, expect, it } from "vitest";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import {
  FOUNDATIONAL_PHYSICS_BRIDGE_BADGES,
  FOUNDATIONAL_PHYSICS_BRIDGE_EDGES,
} from "../foundational-physics-bridge-theory-badges";
import { traceTheoryBadgeConnections } from "../theory-badge-overlap-locator";

describe("foundational physics bridge theory badges", () => {
  it("defines bounded photon-kinematics and energy-density construction contexts", () => {
    const badgesById = new Map(FOUNDATIONAL_PHYSICS_BRIDGE_BADGES.map((badge) => [badge.id, badge]));

    expect(badgesById.get("physics.radiation.massless_photon_kinematics_context")?.equations[0].displayLatex).toBe(
      "E=pc=h\\nu,\\qquad p=h/\\lambda",
    );
    expect(badgesById.get("physics.energy.amount_to_density_context")?.assumptions.join(" ")).toMatch(
      /occupation and volume/i,
    );
  });

  it("joins Planck and de Broglie relations only through massless photon kinematics", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const trace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["physics.quantum.energy_frequency", "physics.quantum.momentum_wavelength"],
    });

    expect(trace.connectingBadgeIds).toContain("physics.radiation.massless_photon_kinematics_context");
    expect(trace.pathSegments.flatMap((segment) => segment.edgeIds)).toEqual(
      expect.arrayContaining([
        "quantum_energy_specializes_massless_photon_kinematics",
        "quantum_momentum_specializes_massless_photon_kinematics",
      ]),
    );
    expect(trace.warnings).toEqual([]);
  });

  it("connects canonical uncertainty and rest energy to their atomic and nuclear specializations", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const uncertaintyTrace = traceTheoryBadgeConnections({
      graph,
      badgeIds: [
        "physics.quantum.uncertainty_position_momentum",
        "physics.atomic.electron_cloud_uncertainty_floor",
      ],
    });
    const massDefectTrace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["physics.relativity.rest_energy", "physics.mass_energy.nuclear_binding_energy"],
    });

    expect(uncertaintyTrace.pathSegments.flatMap((segment) => segment.edgeIds)).toContain(
      "uncertainty_relation_specializes_electron_cloud_floor",
    );
    expect(massDefectTrace.pathSegments.flatMap((segment) => segment.edgeIds)).toContain(
      "rest_energy_specializes_nuclear_mass_defect_binding",
    );
  });

  it("routes quantum and rest energy through density construction instead of direct shortcuts", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const trace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["physics.quantum.energy_frequency", "physics.energy.energy_density"],
    });

    expect(trace.connectingBadgeIds).toContain("physics.energy.amount_to_density_context");
    expect(graph.edges.some((edge) => edge.id === "quantum_energy_feeds_energy_density")).toBe(false);
    expect(graph.edges.some((edge) => edge.id === "rest_energy_feeds_energy_density")).toBe(false);
  });

  it("uses identified rest-frame lines rather than matter-wave momentum as the redshift bridge", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const lineTrace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["stellar.spectroscopy.atomic_line_identification_context", "cosmic.spectral.redshift"],
    });
    const matterWaveTrace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["physics.quantum.momentum_wavelength", "cosmic.spectral.redshift"],
    });

    expect(lineTrace.pathSegments.flatMap((segment) => segment.edgeIds)).toContain(
      "atomic_line_identification_to_spectral_redshift",
    );
    expect(matterWaveTrace.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/no directed connection/i)]),
    );
  });

  it("does not chain contextual evidence into a false laser or cross-domain ancestor", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const falseLaserTrace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["matter.phase.thermodynamic_state_context", "physics.radiation.mode_context"],
    });
    const crossDomainTrace = traceTheoryBadgeConnections({
      graph,
      badgeIds: ["physics.atomic.level_population_context", "physics.radiation.quantum_field_state_context"],
    });
    const directContextTrace = traceTheoryBadgeConnections({
      graph,
      badgeIds: [
        "physics.atomic.transition_gap_frequency_context",
        "stellar.spectroscopy.atomic_line_identification_context",
      ],
    });

    expect(falseLaserTrace.connectingBadgeIds).not.toContain("physics.radiation.laser_coherence_context");
    expect(falseLaserTrace.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/no directed connection/i)]),
    );
    expect(crossDomainTrace.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/no directed connection/i)]),
    );
    expect(directContextTrace.pathSegments.flatMap((segment) => segment.edgeIds)).toContain(
      "atomic_transition_gap_documents_atomic_line_identification",
    );
  });

  it("contains the intended canonical bridge edges", () => {
    expect(FOUNDATIONAL_PHYSICS_BRIDGE_EDGES.map((edge) => edge.id)).toEqual(
      expect.arrayContaining([
        "uncertainty_relation_specializes_electron_cloud_floor",
        "rest_energy_specializes_nuclear_mass_defect_binding",
        "amount_to_density_context_derives_energy_density",
      ]),
    );
  });
});
