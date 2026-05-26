import { describe, expect, it } from "vitest";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { resolvePhysicsAtlasLens } from "../physics-atlas-lens";

describe("physics atlas lens", () => {
  it("projects the solar atlas block onto graph badges and edges", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const lens = resolvePhysicsAtlasLens({ graph, blockId: "solar_surface_spectrum" });

    expect(lens).toBeTruthy();
    expect(lens?.badgeIds).toContain("solar.spectrum.photon_energy_wavelength");
    expect(lens?.badgeIds).toContain("solar.claim_boundary.observation_proxy");
    expect(lens?.edgeIds.length).toBeGreaterThan(0);
    expect(lens?.calculatorPayloadIds).toContain(
      "solar.spectrum.photon_energy_wavelength:photon_energy_from_wavelength_payload",
    );
  });
});
