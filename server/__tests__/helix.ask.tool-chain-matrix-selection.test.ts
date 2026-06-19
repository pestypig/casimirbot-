import { describe, expect, it } from "vitest";

import {
  selectToolChainMatrixScenarios,
  TOOL_CHAIN_MATRIX_SCENARIOS,
} from "../../scripts/helix-ask-tool-chain-matrix-probe";

describe("Helix Ask tool-chain matrix scenario selection", () => {
  it("selects all scenarios by default", () => {
    const selection = selectToolChainMatrixScenarios([]);

    expect(selection.requestedIds).toEqual([]);
    expect(selection.unknownIds).toEqual([]);
    expect(selection.availableIds).toEqual(TOOL_CHAIN_MATRIX_SCENARIOS.map((scenario) => scenario.id));
    expect(selection.scenarios.map((scenario) => scenario.id)).toEqual(
      TOOL_CHAIN_MATRIX_SCENARIOS.map((scenario) => scenario.id),
    );
  });

  it("preserves explicit scenario filters and removes duplicates", () => {
    const selection = selectToolChainMatrixScenarios([" docs_open ", "docs_open"]);

    expect(selection.requestedIds).toEqual(["docs_open"]);
    expect(selection.unknownIds).toEqual([]);
    expect(selection.scenarios.map((scenario) => scenario.id)).toEqual(["docs_open"]);
  });

  it("reports unknown scenario filters instead of silently selecting zero scenarios", () => {
    const selection = selectToolChainMatrixScenarios(["missing_scenario", "docs_open"]);

    expect(selection.requestedIds).toEqual(["missing_scenario", "docs_open"]);
    expect(selection.unknownIds).toEqual(["missing_scenario"]);
    expect(selection.scenarios.map((scenario) => scenario.id)).toEqual(["docs_open"]);
  });
});
