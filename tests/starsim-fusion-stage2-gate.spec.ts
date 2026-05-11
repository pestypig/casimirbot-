import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runStarSimFusionBenchmarkPlan } from "../shared/starsim-fusion-benchmark-runner";
import { runStarSimFusionStage2Gate } from "../shared/starsim-fusion-stage2-gate";

const gateDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-stage2-gate");
const benchmarkPlanPath = join(
  process.cwd(),
  "tests",
  "fixtures",
  "starsim-fusion-benchmarks",
  "plan.fixture.json",
);

function loadGateFixture(name = "solar-mesa-repro.fixture.json") {
  return JSON.parse(readFileSync(join(gateDir, name), "utf8"));
}

function benchmark(overrides: Record<string, unknown> = {}) {
  const plan = JSON.parse(readFileSync(benchmarkPlanPath, "utf8"));
  return {
    ...runStarSimFusionBenchmarkPlan(plan),
    ...overrides,
  } as ReturnType<typeof runStarSimFusionBenchmarkPlan>;
}

function runWithFixture(raw = loadGateFixture()) {
  return runStarSimFusionStage2Gate({
    externalReproManifest: raw.externalReproManifest,
    benchmarkReport: benchmark(),
    benchmarkReportRef: "reports/starsim-fusion-benchmark-report.json",
    solarAnchor: raw.solarAnchor,
    neutrinoClosure: raw.neutrinoClosure,
    asteroseismicClosure: raw.asteroseismicClosure,
  });
}

describe("StarSim fusion Stage 2 gate", () => {
  it("fixture_only cannot return ready-for-review", () => {
    const raw = loadGateFixture();
    raw.externalReproManifest.reproducibilityStatus = "fixture_only";
    const gate = runWithFixture(raw);
    expect(gate.verdict).toBe("stage2_gate_fixture_only");
  });

  it("blocks missing profile hash, inlist, network, rates, uncertainty, and luminosity closure", () => {
    const raw = loadGateFixture();
    delete raw.externalReproManifest.mesa.profileHash;
    delete raw.externalReproManifest.mesa.inlistHash;
    delete raw.externalReproManifest.mesa.network;
    delete raw.externalReproManifest.mesa.ratesSource;
    const brokenBenchmark = benchmark({
      aggregate: {
        ...benchmark().aggregate,
        failedClosureCount: 1,
        uncertaintyCoverageRate: 0,
      },
    });
    const gate = runStarSimFusionStage2Gate({
      externalReproManifest: raw.externalReproManifest,
      benchmarkReport: brokenBenchmark,
      benchmarkReportRef: "reports/starsim-fusion-benchmark-report.json",
      solarAnchor: raw.solarAnchor,
      neutrinoClosure: raw.neutrinoClosure,
      asteroseismicClosure: raw.asteroseismicClosure,
    });
    expect(gate.blockers.map((blocker) => blocker.blockerId)).toEqual(
      expect.arrayContaining([
        "missing_mesa_profile_hash",
        "missing_inlist_hash",
        "missing_network_metadata",
        "missing_rates_metadata",
        "missing_uncertainty_summary",
        "luminosity_closure_failed",
      ]),
    );
    expect(gate.verdict).toBe("stage2_gate_blocked");
  });

  it("blocks failed solar neutrino and asteroseismic closure", () => {
    const raw = loadGateFixture();
    raw.neutrinoClosure.status = "fail";
    raw.asteroseismicClosure.status = "fail";
    const gate = runWithFixture(raw);
    expect(gate.blockers.map((blocker) => blocker.blockerId)).toEqual(
      expect.arrayContaining(["neutrino_closure_failed", "asteroseismic_closure_failed"]),
    );
  });

  it("returns ready-for-review for a clean MESA/GYRE fixture", () => {
    const gate = runWithFixture();
    expect(gate.verdict).toBe("stage2_gate_ready_for_review");
    expect(gate.qstBoundary.spacetimeCL).toBe("proxy_only");
    expect(gate.qstBoundary.mayPromoteToCL4).toBe(false);
  });

  it("blocks direct ER=EPR and CL4 promotion attempts", () => {
    const raw = loadGateFixture("blocked-overclaim.fixture.json");
    const gate = runStarSimFusionStage2Gate({
      externalReproManifest: raw.externalReproManifest,
      benchmarkReport: benchmark(),
      benchmarkReportRef: "reports/starsim-fusion-benchmark-report.json",
    });
    expect(gate.verdict).toBe("overclaim_blocked");
    expect(gate.blockers.map((blocker) => blocker.blockerId)).toEqual(
      expect.arrayContaining([
        "direct_er_epr_overclaim",
        "qst_cl_promotion_attempt",
        "h_spectral_fit_overclaim",
      ]),
    );
  });
});
