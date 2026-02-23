import { describe, expect, it } from "vitest";
import { runCongruenceGate } from "../server/services/evolution/congruence-gate";
import { DEFAULT_EVOLUTION_CONFIG } from "../server/services/evolution/config";

describe("evolution gate", () => {
  it("applies hard fail overrides", () => {
    const result = runCongruenceGate({
      config: DEFAULT_EVOLUTION_CONFIG,
      casimirVerdict: "FAIL",
      indicators: { I: 1, A: 1, P: 1, E: 1, debt: 0 },
    });
    expect(result.verdict).toBe("FAIL");
    expect(result.firstFail?.id).toBe("CASIMIR_VERIFY_FAIL");
  });

  it("emits deterministic envelope fields", () => {
    const result = runCongruenceGate({
      config: DEFAULT_EVOLUTION_CONFIG,
      reportOnly: true,
      indicators: { I: 1, A: 1, P: 1, E: 1, debt: 0.1 },
    });
    expect(result.verdict).toBe("PASS");
    expect(Array.isArray(result.deltas)).toBe(true);
    expect(Array.isArray(result.artifacts)).toBe(true);
  });
});
