import { describe, expect, it } from "vitest";
import { TOKAMAK_PLASMA_GROUPS, getTokamakPlasmaGroup } from "../tokamak-plasma-map";

describe("Tokamak plasma map", () => {
  it("defines deterministic plasma groups and calculator payload refs", () => {
    expect(TOKAMAK_PLASMA_GROUPS.map((group) => group.id)).toEqual([
      "tokamak.plasma.pressure_beta",
      "tokamak.plasma.power_confinement",
      "tokamak.plasma.precursor_margin",
      "tokamak.plasma.flux_bands",
      "tokamak.plasma.claim_boundary",
    ]);

    const pressure = getTokamakPlasmaGroup("tokamak.plasma.pressure_beta");
    expect(pressure?.calculatorPayloadRefs).toContainEqual({
      badgeId: "tokamak.plasma.magnetic_pressure",
      payloadId: "tokamak_magnetic_pressure_payload",
    });
    expect(pressure?.calculatorPayloadRefs).toContainEqual({
      badgeId: "tokamak.plasma.beta_proxy",
      payloadId: "tokamak_beta_proxy_payload",
    });
    expect(pressure?.claimBoundaryBadgeIds).toContain("tokamak.claim_boundary.diagnostic_proxy");
  });
});
