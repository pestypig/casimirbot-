import { describe, expect, it } from "vitest";
import {
  buildNhm2NatarioInvariantAudit,
  isNhm2NatarioInvariantAudit,
} from "../shared/contracts/nhm2-natario-invariant-audit.v1";

describe("nhm2 natario invariant audit", () => {
  it("does not treat zero expansion as a complete invariant audit", () => {
    const audit = buildNhm2NatarioInvariantAudit({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p9625_v1",
      metricFamily: "natario_zero_expansion",
      expansion: {
        thetaMaxAbs: 0,
        thetaFlatnessStatus: "pass",
        expansionLeakageBound: 1e-9,
      },
      momentumDensity: { Jx: 0, Jy: 0, Jz: 0 },
      stability: {
        tidalMax: 0,
        blueshiftMax: 0,
        convergenceStatus: "pass",
      },
    });

    expect(audit.expansion.thetaFlatnessStatus).toBe("pass");
    expect(audit.invariants.status).toBe("missing");
    expect(audit.blockers).toContain("curvature_invariants_missing");
    expect(audit.claimBoundary.zeroExpansionIsNotSafetyCertificate).toBe(true);
    expect(isNhm2NatarioInvariantAudit(audit)).toBe(true);
  });

  it("marks a complete invariant, momentum, and stability audit computed", () => {
    const audit = buildNhm2NatarioInvariantAudit({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p9625_v1",
      metricFamily: "nhm2_shift_lapse",
      expansion: {
        thetaMaxAbs: 0,
        thetaFlatnessStatus: "pass",
        expansionLeakageBound: 1e-9,
      },
      invariants: {
        ricciScalar: 0,
        kretschmannScalar: 0,
        weylScalarProxy: 0,
        petrovClass: "O",
      },
      momentumDensity: { Jx: 0, Jy: 0, Jz: 0 },
      stability: {
        tidalMax: 0,
        blueshiftMax: 0,
        convergenceStatus: "pass",
      },
    });

    expect(audit.invariants.status).toBe("computed");
    expect(audit.momentumDensity.status).toBe("computed");
    expect(audit.blockers).toEqual([]);
    expect(isNhm2NatarioInvariantAudit(audit)).toBe(true);
  });
});
