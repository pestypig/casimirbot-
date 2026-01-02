import { describe, expect, it } from "vitest";
import { evaluateGrConstraintGateFromMetrics } from "../server/gr/constraint-evaluator";

describe("gr constraint gate", () => {
  it("passes when only soft constraints fail under hard-only mode", () => {
    const evaluation = evaluateGrConstraintGateFromMetrics({
      H_rms: 0.005,
      M_rms: 0.0005,
      H_maxAbs: 0.5,
      M_maxAbs: 0.2,
    });
    expect(evaluation.gate.status).toBe("pass");
    const softFailures = evaluation.constraints.filter(
      (entry) => entry.severity === "SOFT" && entry.status === "fail",
    );
    expect(softFailures.length).toBeGreaterThan(0);
  });

  it("returns unknown when metrics are missing and unknownAsFail is false", () => {
    const evaluation = evaluateGrConstraintGateFromMetrics(
      { H_rms: 0.005 },
      { policy: { mode: "all", unknownAsFail: false } },
    );
    expect(evaluation.gate.status).toBe("unknown");
  });

  it("fails when a hard constraint exceeds threshold", () => {
    const evaluation = evaluateGrConstraintGateFromMetrics({
      H_rms: 0.02,
      M_rms: 0.0005,
    });
    expect(evaluation.gate.status).toBe("fail");
  });
});
