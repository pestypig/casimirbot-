import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runStarSimFusionBenchmarkPlan } from "../shared/starsim-fusion-benchmark-runner";
import { runStarSimFusionStage2Gate } from "../shared/starsim-fusion-stage2-gate";
import { starSimFusionStage2GateReportArtifactSchema } from "../shared/starsim-fusion-stage2-gate-artifact";
import { renderStarSimFusionStage2GateReport } from "../shared/starsim-fusion-stage2-gate-safe-language";

const gateDir = join(process.cwd(), "tests", "fixtures", "starsim-fusion-stage2-gate");
const planPath = join(process.cwd(), "tests", "fixtures", "starsim-fusion-benchmarks", "plan.fixture.json");

function gate() {
  const raw = JSON.parse(readFileSync(join(gateDir, "solar-mesa-repro.fixture.json"), "utf8"));
  const benchmark = runStarSimFusionBenchmarkPlan(JSON.parse(readFileSync(planPath, "utf8")));
  return runStarSimFusionStage2Gate({
    externalReproManifest: raw.externalReproManifest,
    benchmarkReport: benchmark,
    benchmarkReportRef: "reports/starsim-fusion-benchmark-report.json",
    solarAnchor: raw.solarAnchor,
    neutrinoClosure: raw.neutrinoClosure,
    asteroseismicClosure: raw.asteroseismicClosure,
  });
}

describe("StarSim fusion Stage 2 gate artifact", () => {
  it("accepts a report artifact with required evidence fields", () => {
    const result = gate();
    const artifact = starSimFusionStage2GateReportArtifactSchema.parse({
      schemaVersion: "starsim-fusion-stage2-gate-report-artifact.v1",
      artifactId: "stage2-gate-artifact-fixture",
      createdAt: "2026-05-11T00:00:00.000Z",
      gate: result,
      claimIds: result.evidence.claimIds,
      citations: result.evidence.citations,
      uncertaintyNotes: result.evidence.uncertaintyNotes,
      safeSummary: renderStarSimFusionStage2GateReport(result),
    });
    expect(artifact.gate.verdict).toBe("stage2_gate_ready_for_review");
  });

  it("rejects missing citations and forbidden language", () => {
    const result = gate();
    expect(() =>
      starSimFusionStage2GateReportArtifactSchema.parse({
        schemaVersion: "starsim-fusion-stage2-gate-report-artifact.v1",
        artifactId: "bad-artifact",
        createdAt: "2026-05-11T00:00:00.000Z",
        gate: result,
        claimIds: result.evidence.claimIds,
        citations: [],
        uncertaintyNotes: result.evidence.uncertaintyNotes,
        safeSummary: "certified Stage 2",
      }),
    ).toThrow();
  });
});
