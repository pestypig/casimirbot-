import { describe, expect, it } from "vitest";
import { SOLAR_SPECTRUM_OBSERVATION_GROUPS } from "../solar-spectrum-observation-map";

describe("solar spectrum observation map", () => {
  it("provides object-bound groups for solar spectrum calculator chains", () => {
    const ids = SOLAR_SPECTRUM_OBSERVATION_GROUPS.map((group) => group.id);

    expect(ids).toEqual([
      "solar.observation.halpha_shift",
      "solar.observation.zeeman_split",
      "solar.observation.blackbody_surface",
      "solar.observation.flare_energy",
    ]);

    const halpha = SOLAR_SPECTRUM_OBSERVATION_GROUPS.find((group) => group.id === "solar.observation.halpha_shift");
    expect(halpha?.calculatorPayloadRefs.map((ref) => ref.payloadId)).toEqual([
      "photon_energy_payload",
      "doppler_shift_payload",
      "radial_velocity_proxy_payload",
    ]);
    expect(halpha?.objectBindings[0]?.input.lambda0).toBe(656.28e-9);
    expect(halpha?.claimBoundaryBadgeIds).toContain("solar.claim_boundary.observational_proxy");
  });
});
