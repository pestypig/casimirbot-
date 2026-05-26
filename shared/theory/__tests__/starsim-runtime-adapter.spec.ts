import { describe, expect, it } from "vitest";
import { isStarSimRuntimeReceiptV1 } from "../../contracts/starsim-runtime-receipt.v1";
import { buildStarSimObjectBindings } from "../starsim-object-bindings";
import { runStarSimRuntimeBadge } from "../starsim-runtime-adapter";

describe("StarSim runtime adapter", () => {
  it("runs a solar-like microphysics receipt with safe claim boundaries", () => {
    const receipt = runStarSimRuntimeBadge({
      badgeId: "starsim.runtime.evaluate_fusion_microphysics",
      objectContext: buildStarSimObjectBindings({
        objectClass: "main_sequence",
        spectralType: "G2V",
        mass_Msun: 1,
        radius_Rsun: 1,
        luminosity_Lsun: 1,
      }),
    });

    expect(isStarSimRuntimeReceiptV1(receipt)).toBe(true);
    expect(receipt.outputSummary.dominantFusionChannel).toBe("pp_chain");
    expect(receipt.outputSummary.spacetimeCL).toBe("proxy_only");
    expect(receipt.outputSummary.mayPromoteToCL4).toBe(false);
    expect(receipt.claimBoundaryNotes.join(" ")).toMatch(/not direct ER=EPR evidence/i);
  });

  it("maps red giants to shell-fusion runtime context", () => {
    const receipt = runStarSimRuntimeBadge({
      badgeId: "starsim.runtime.evaluate_fusion_microphysics",
      objectContext: buildStarSimObjectBindings({
        objectClass: "red_giant",
        spectralType: "K1III",
        mass_Msun: 1.1,
        radius_Rsun: 12,
        luminosity_Lsun: 65,
      }),
    });

    expect(receipt.outputSummary.fusionZoneMode).toBe("shell_fusion");
    expect(receipt.caveats.join(" ")).toMatch(/Red-giant output uses shell_fusion/i);
  });
});
