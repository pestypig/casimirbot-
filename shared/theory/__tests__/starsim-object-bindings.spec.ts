import { describe, expect, it } from "vitest";
import { buildStarSimObjectBindings } from "../starsim-object-bindings";

describe("StarSim object bindings", () => {
  it("maps observable star fields into calculator symbols", () => {
    const context = buildStarSimObjectBindings({
      objectId: "red-giant-1",
      objectClass: "red_giant",
      spectralType: "K1III",
      luminosity_Lsun: 65,
      radius_Rsun: 12,
      mass_Msun: 1.1,
      r90_Rstar: 0.2,
      gravitationalConstantNormalized: 1,
      channelTemperature_K: 12000000,
      channelDensity_g_cm3: 35,
    });

    expect(context.kind).toBe("starsim_star");
    expect(context.variableBindings).toMatchObject({
      T_sun: 5772,
      L: 65,
      R: 12,
      M: 1.1,
      r90_Rstar: 0.2,
      G: 1,
      T_channel: 12000000,
      rho_channel: 35,
    });
    expect(context.units.L).toBe("Lsun");
    expect(context.claimBoundaryNotes[0]).toContain("StarSim Stage 1");
  });
});
