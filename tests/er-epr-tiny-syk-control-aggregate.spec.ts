import { describe, expect, it } from "vitest";
import { aggregateTinySykControls } from "../shared/er-epr-tiny-syk-control-aggregate";

describe("tiny SYK control aggregate", () => {
  const requiredControls = ["wrongSign", "noCoupling", "disentangled", "shuffledHamiltonian", "randomMatrix", "spinChain"];

  it("passes when all controls are present below threshold", () => {
    const result = aggregateTinySykControls({
      scores: { wrongSign: 0.1, noCoupling: 0.1, disentangled: 0.1, shuffledHamiltonian: 0.2, randomMatrix: 0.2, spinChain: 0.2 },
      requiredControls,
      leakageThreshold: 0.35,
    });
    expect(result.passed).toBe(true);
  });

  it("demotes wrong-sign and non-holographic leakage", () => {
    expect(aggregateTinySykControls({
      scores: { wrongSign: 0.5, noCoupling: 0.1, disentangled: 0.1, shuffledHamiltonian: 0.2, randomMatrix: 0.2, spinChain: 0.2 },
      requiredControls,
      leakageThreshold: 0.35,
    }).passed).toBe(false);
    expect(aggregateTinySykControls({
      scores: { wrongSign: 0.1, noCoupling: 0.1, disentangled: 0.1, shuffledHamiltonian: 0.2, randomMatrix: 0.6, spinChain: 0.2 },
      requiredControls,
      leakageThreshold: 0.35,
    }).passed).toBe(false);
  });
});
