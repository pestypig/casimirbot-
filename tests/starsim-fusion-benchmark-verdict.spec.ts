import { describe, expect, it } from "vitest";
import { determineStarSimFusionBenchmarkVerdict } from "../shared/starsim-fusion-benchmark-verdict";

describe("StarSim fusion benchmark verdict", () => {
  it("blocks overclaims before support verdicts", () => {
    expect(
      determineStarSimFusionBenchmarkVerdict({
        profileResults: [{} as any],
        uncertainty: [{ mode: "interval" } as any],
        blockers: [{ blockerId: "direct_er_epr_overclaim", detail: "blocked" }],
      }),
    ).toBe("overclaim_blocked");
  });

  it("requires no blockers for Stage 2 candidate readiness", () => {
    expect(
      determineStarSimFusionBenchmarkVerdict({
        profileResults: [
          {
            importedProfileSummary: { reproducibilityStatus: "externally_reproduced" },
            integratedFusion: { dominantFusionChannel: "pp_chain" },
            fusionZone: { r90_Rstar: 0.2 },
            evidence: { claimIds: ["a"], citations: ["b"] },
          } as any,
        ],
        uncertainty: [{ mode: "interval" } as any],
        blockers: [],
      }),
    ).toBe("stage2_candidate_ready");
  });
});
