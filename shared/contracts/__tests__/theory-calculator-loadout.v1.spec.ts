import { describe, expect, it } from "vitest";
import {
  buildTheoryCalculatorLoadoutV1,
  isTheoryCalculatorLoadoutV1,
  validateTheoryCalculatorLoadoutV1,
} from "../theory-calculator-loadout.v1";

describe("theory_calculator_loadout/v1", () => {
  it("validates scalar and context rows", () => {
    const loadout = buildTheoryCalculatorLoadoutV1({
      loadoutId: "theory-loadout:test",
      graphId: "nhm2-theory-badge-graph",
      source: "helix_ask",
      mode: "selected_badges",
      targetBadgeIds: ["starsim.observable.surface_temperature_proxy"],
      objectContext: null,
      items: [
        {
          id: "item:1",
          index: 1,
          kind: "calculator_payload",
          badgeId: "starsim.observable.surface_temperature_proxy",
          badgeTitle: "Surface temperature proxy",
          payloadId: "teff_from_luminosity_radius_payload",
          sourcePath: "theory://graph/starsim.observable.surface_temperature_proxy/teff",
          expression: "T_eff = T_sun*(L/(R^2))^(1/4)",
          displayLatex: "T_{eff}=T_{sun}(L/R^2)^{1/4}",
          solveExpression: "T_eff = 5772*(65/(12^2))^(1/4)",
          usedBindings: { T_sun: 5772, L: 65, R: 12 },
          bindingWarnings: [],
          setupContext: null,
          resultText: null,
          resultLatex: null,
          resultKind: null,
          confidence: null,
          fallbackReason: null,
          calculatorArtifactV1: null,
          warnings: [],
        },
      ],
      claimBoundaryNotes: ["diagnostic-only"],
    });

    expect(validateTheoryCalculatorLoadoutV1(loadout)).toEqual([]);
    expect(isTheoryCalculatorLoadoutV1(loadout)).toBe(true);
    expect(loadout.summary.scalarCount).toBe(1);
  });
});
