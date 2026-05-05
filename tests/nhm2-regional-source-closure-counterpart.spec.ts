import { describe, expect, it } from "vitest";

import {
  evaluateFullTensorAuthority,
  evaluateRegionalSourceClosureCounterparts,
} from "../tools/nhm2/validate-reference-run";

describe("nhm2 regional source-closure counterpart gate", () => {
  it("cannot pass with gr_matter_channel_observation standing in for tile_effective_counterpart", () => {
    const gate = evaluateRegionalSourceClosureCounterparts({
      regionComparisons: {
        regions: [
          {
            regionId: "wall",
            comparisonBasisStatus: "diagnostic_only",
            counterpartResolutionStatus: "missing",
            metricExpectedCounterpartRole: "tile_effective_counterpart",
            tileTensorRef: "gr_matter_channel_observation.wall",
            status: "review",
            tileT00Diagnostics: {
              trace: {
                tensorRef:
                  "gr.matter.stressEnergy.tensorSampledSummaries.wall.nhm2_shift_lapse.diagonal_proxy",
                pathFacts: {
                  comparisonRole: "gr_matter_channel_observation",
                },
              },
            },
          },
        ],
      },
    });

    expect(gate.state).toBe("fail");
    expect(gate.reasonCodes).toContain("wall_counterpart_not_same_basis");
    expect(gate.reasonCodes).toContain("wall_observation_path_not_counterpart");
  });

  it("does not treat diagonal pressure proxy as full-tensor authority", () => {
    const gate = evaluateFullTensorAuthority({
      tensorRef:
        "gr.matter.stressEnergy.tensorSampledSummaries.wall.nhm2_shift_lapse.diagonal_proxy",
      note: "T11/T22/T33 follow the brick pressure proxy",
      tensor: {
        T00: 1,
        T11: 1,
        T22: 1,
        T33: 1,
      },
    });

    expect(gate.state).toBe("review");
    expect(gate.reasonCodes).toContain("diagonal_proxy_present_reduced_order_only");
    expect(gate.reasonCodes).toContain("full_tensor_components_not_emitted");
  });
});
