import { describe, expect, it } from "vitest";
import { recordEvolutionTrace, getTrainingTraces } from "../server/services/observability/training-trace-store";

describe("evolution training trace integration", () => {
  it("records additive trace rows for evolution runs", () => {
    recordEvolutionTrace({
      traceId: "evolution:test:1",
      pass: true,
      verdict: "PASS",
      score: 88,
      artifacts: [{ kind: "evolution-gate-mode", ref: "report-only" }],
    });
    const traces = getTrainingTraces({ limit: 50 });
    const found = traces.find((row) => row.traceId === "evolution:test:1");
    expect(found).toBeTruthy();
    expect(found?.notes).toContain("source=evolution.gate");
  });
});
