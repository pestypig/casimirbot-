import { describe, expect, it } from "vitest";

import { evaluateErEprSimulation } from "../shared/er-epr-simulation";
import {
  ER_EPR_FORBIDDEN_LANGUAGE,
  renderErEprStage1Claim,
  validateErEprSafeLanguage,
} from "../shared/er-epr-safe-language";

describe("ER=EPR Stage 1 safe language", () => {
  it("rejects forbidden overclaim phrases", () => {
    for (const phrase of ER_EPR_FORBIDDEN_LANGUAGE) {
      expect(validateErEprSafeLanguage(`This ${phrase}.`).ok).toBe(false);
    }
  });

  it("renders bounded claim text with claim IDs, source roles, and uncertainty notes", () => {
    const evaluation = evaluateErEprSimulation({
      modelFamily: "two_sided_SYK",
      nQubitsOrModes: 12,
      temperatureRegime: "low",
      initialState: "thermofield_double",
      coupling: "double_trace_correct_sign",
      probeInsertionTime: -4,
      measurementWindow: 8,
      entropyStretch: { deltaS_nats: 0 },
      observables: {
        mutualInformation: 1.8,
        entanglementEntropy_nats: 3.2,
        teleportationFidelity: 0.86,
        causalOrderingScore: 0.84,
        timeDelayScore: 0.82,
        operatorSizeWindingScore: 0.85,
        scramblingScore: 0.83,
        thermalizationScore: 0.84,
        entropyAreaProxyTrackingScore: 0.86,
        ordinaryTeleportationControlScore: 0.12,
        shuffledHamiltonianControlScore: 0.18,
        disentangledControlScore: 0.1,
        wrongSignCouplingControlScore: 0.14,
      },
    });
    const text = renderErEprStage1Claim(evaluation);

    expect(validateErEprSafeLanguage(text).ok).toBe(true);
    expect(text).toContain("Claim IDs:");
    expect(text).toContain("Source roles:");
    expect(text).toContain("Uncertainty notes:");
    expect(text).toContain("model-internal support");
  });
});
