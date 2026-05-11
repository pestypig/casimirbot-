import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { summarizeStarSimFusionUncertainty } from "../shared/starsim-fusion-uncertainty";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-profiles");

function fixture(name: string) {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8"));
}

describe("StarSim fusion uncertainty", () => {
  it("propagates interval uncertainty to r90_Rstar", () => {
    const summary = summarizeStarSimFusionUncertainty(fixture("solar-mesa-profile.fixture.json"), {
      mode: "interval",
      samples: 2,
      perturb: "profile_shells_only",
    });
    expect(summary.intervals.r90_Rstar).toBeDefined();
  });

  it("is deterministic for Monte Carlo fixture mode with a seed", () => {
    const profile = fixture("solar-mesa-profile.fixture.json");
    const a = summarizeStarSimFusionUncertainty(profile, {
      mode: "monte_carlo_fixture",
      samples: 8,
      seed: 3,
      perturb: "observables_and_profile_shells",
    });
    const b = summarizeStarSimFusionUncertainty(profile, {
      mode: "monte_carlo_fixture",
      samples: 8,
      seed: 3,
      perturb: "observables_and_profile_shells",
    });
    expect(a.intervals).toEqual(b.intervals);
  });

  it("keeps the solar fixture robustly pp_chain", () => {
    const summary = summarizeStarSimFusionUncertainty(fixture("solar-mesa-profile.fixture.json"), {
      mode: "monte_carlo_fixture",
      samples: 8,
      seed: 9,
      perturb: "profile_shells_only",
    });
    expect(summary.robustDominantFusionChannel).toBe("pp_chain");
  });

  it("emits an uncertainty caveat", () => {
    const summary = summarizeStarSimFusionUncertainty(fixture("solar-mesa-profile.fixture.json"), {
      mode: "interval",
      samples: 2,
      perturb: "profile_shells_only",
    });
    expect(summary.caveats.join(" ")).toContain("fixture perturbations");
  });
});
