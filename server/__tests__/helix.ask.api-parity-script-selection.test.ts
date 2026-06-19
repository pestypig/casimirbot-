import { describe, expect, it } from "vitest";

import {
  selectApiParityScenarios,
} from "../../scripts/helix-ask-api-parity-probe";
import {
  API_PARITY_SCENARIOS,
  getEnabledApiParityScenarios,
} from "../services/helix-ask/api-parity-matrix";

describe("Helix Ask API parity script scenario selection", () => {
  it("selects enabled scenarios by default", () => {
    const selection = selectApiParityScenarios([]);

    expect(selection.requestedIds).toEqual([]);
    expect(selection.unknownIds).toEqual([]);
    expect(selection.scenarios.map((scenario) => scenario.id)).toEqual(
      getEnabledApiParityScenarios(false).map((scenario) => scenario.id),
    );
  });

  it("preserves explicit scenario filters and removes duplicates", () => {
    const selection = selectApiParityScenarios([
      " capability_catalog_runtime ",
      "capability_catalog_runtime",
    ]);

    expect(selection.requestedIds).toEqual(["capability_catalog_runtime"]);
    expect(selection.unknownIds).toEqual([]);
    expect(selection.scenarios.map((scenario) => scenario.id)).toEqual(["capability_catalog_runtime"]);
  });

  it("reports unknown scenario filters instead of silently selecting zero scenarios", () => {
    const selection = selectApiParityScenarios(["missing_scenario", "capability_catalog_runtime"]);

    expect(selection.requestedIds).toEqual(["missing_scenario", "capability_catalog_runtime"]);
    expect(selection.unknownIds).toEqual(["missing_scenario"]);
    expect(selection.scenarios.map((scenario) => scenario.id)).toEqual(["capability_catalog_runtime"]);
  });

  it("can include disabled scenarios when requested by operator config", () => {
    const disabledScenario = API_PARITY_SCENARIOS.find((scenario) => !scenario.enabled);
    expect(disabledScenario).toBeTruthy();

    const defaultSelection = selectApiParityScenarios([]);
    const inclusiveSelection = selectApiParityScenarios([], true);

    expect(defaultSelection.scenarios.map((scenario) => scenario.id)).not.toContain(disabledScenario!.id);
    expect(defaultSelection.availableIds).toContain(disabledScenario!.id);
    expect(inclusiveSelection.scenarios.map((scenario) => scenario.id)).toContain(disabledScenario!.id);
  });
});
