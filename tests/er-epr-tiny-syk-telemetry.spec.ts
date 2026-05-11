import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeErEprRawObservables } from "../shared/er-epr-observable-normalizer";
import { runTinySykSolver, tinySykPlanSchema } from "../shared/er-epr-tiny-syk";
import { assertTinySykRawTelemetry } from "../shared/er-epr-tiny-syk-telemetry";
import { runErEprSolverAdapter } from "../shared/er-epr-solver-adapter";

describe("tiny SYK telemetry", () => {
  it("emits raw telemetry and normalized scores in range", () => {
    const plan = tinySykPlanSchema.parse(JSON.parse(readFileSync("tests/fixtures/er-epr-tiny-syk/tiny-syk-plan.fixture.json", "utf8")));
    const run = runTinySykSolver(plan);
    expect(assertTinySykRawTelemetry(run.rawTelemetry).protocol.teleportationFidelityRaw).toBeGreaterThan(0.7);
    expect(run.rawTelemetry.state.entanglementEntropy_nats).toBeGreaterThan(0);
    expect(run.rawTelemetry.protocol.causalOrderingPass).toBe(true);
    expect(run.rawTelemetry.diagnostics.operatorSizeCurve?.length).toBeGreaterThan(1);
    const normalized = normalizeErEprRawObservables(run.adapterRaw);
    const scoreKeys = [
      "teleportationFidelity",
      "causalOrderingScore",
      "timeDelayScore",
      "operatorSizeWindingScore",
      "scramblingScore",
      "thermalizationScore",
      "entropyAreaProxyTrackingScore",
      "ordinaryTeleportationControlScore",
      "shuffledHamiltonianControlScore",
      "disentangledControlScore",
      "wrongSignCouplingControlScore",
    ] as const;
    for (const key of scoreKeys) {
      const value = normalized[key];
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("demotes visible support under QST entropy stretch", () => {
    const plan = tinySykPlanSchema.parse(JSON.parse(readFileSync("tests/fixtures/er-epr-tiny-syk/tiny-syk-plan.fixture.json", "utf8")));
    const run = runTinySykSolver(plan);
    const base = run.adapterResult.evaluation;
    const washed = runErEprSolverAdapter({
      schemaVersion: "er-epr-solver-adapter-request.v1",
      requestId: "tiny-syk-washout-test",
      createdAt: "2026-05-11T00:00:00.000Z",
      raw: run.adapterRaw,
      normalizationThresholds: { entropyAreaProxyScale: 1 },
      thresholds: {},
      entropyStretch: { deltaS_nats: 5 },
      requestedSpacetimeCL: "proxy_only",
    }).evaluation;
    expect(washed.values.entropyVisibility).toBeLessThan(base.values.entropyVisibility);
    expect(washed.evidence.verdict).toBe("ordinary_control_explains_signal");
  });
});
