import { describe, expect, it } from "vitest";
import {
  renderStarSimFusionStage2GateReport,
  validateStarSimFusionStage2GateSafeLanguage,
} from "../shared/starsim-fusion-stage2-gate-safe-language";
import { runStarSimFusionStage2Gate } from "../shared/starsim-fusion-stage2-gate";
import { runStarSimFusionBenchmarkPlan } from "../shared/starsim-fusion-benchmark-runner";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const gateDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-stage2-gate");
const planPath = join(process.cwd(), "tests", "fixtures", "starsim-fusion-benchmarks", "plan.fixture.json");

describe("StarSim fusion Stage 2 gate safe language", () => {
  it("rejects certification, direct ER=EPR, and Planck-constant overclaims", () => {
    expect(validateStarSimFusionStage2GateSafeLanguage("certified Stage 2").ok).toBe(false);
    expect(validateStarSimFusionStage2GateSafeLanguage("direct ER=EPR evidence").ok).toBe(false);
    expect(validateStarSimFusionStage2GateSafeLanguage("derived Planck constant").ok).toBe(false);
  });

  it("renders claim IDs, source roles, caveats, uncertainty notes, and proxy-only boundary", () => {
    const raw = JSON.parse(readFileSync(join(gateDir, "solar-mesa-repro.fixture.json"), "utf8"));
    const benchmark = runStarSimFusionBenchmarkPlan(JSON.parse(readFileSync(planPath, "utf8")));
    const gate = runStarSimFusionStage2Gate({
      externalReproManifest: raw.externalReproManifest,
      benchmarkReport: benchmark,
      benchmarkReportRef: "reports/starsim-fusion-benchmark-report.json",
      solarAnchor: raw.solarAnchor,
      neutrinoClosure: raw.neutrinoClosure,
      asteroseismicClosure: raw.asteroseismicClosure,
    });
    const text = renderStarSimFusionStage2GateReport(gate);
    expect(text).toContain("Claim IDs:");
    expect(text).toContain("Source roles:");
    expect(text).toContain("Uncertainty notes:");
    expect(text).toContain("proxy_only");
    expect(text).toContain("Caveats:");
  });
});
