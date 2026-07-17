import { describe, expect, it } from "vitest";

import {
  extractCodexCapabilityLaneRequestCandidate,
  extractCodexCapabilityLaneRequestCandidates,
} from "../codex-provider";

describe("Codex capability-lane request parsing", () => {
  it("does not reinterpret a structured Master Problem answer as an unknown capability lane", () => {
    const answer = JSON.stringify({
      master_problem_v1: {
        request: {
          operation: "compare",
          targetObservable: "nabla_mu_T_mu_nu",
        },
        compileStatus: "partially_executable",
      },
      requested_capability: "helix_ask.reflect_theory_context",
      terminal_eligible: false,
    });

    expect(extractCodexCapabilityLaneRequestCandidate(answer)).toBeNull();
    expect(extractCodexCapabilityLaneRequestCandidates(answer)).toEqual([]);
  });

  it("preserves an explicitly named capability-lane request", () => {
    const request =
      "HELIX_CAPABILITY_LANE_REQUEST_JSON: " +
      JSON.stringify({
        capability: "visual_analysis.inspect_image_region",
        source_id: "image:current",
        bbox_px: { x: 0, y: 0, width: 10, height: 10 },
      });

    expect(extractCodexCapabilityLaneRequestCandidate(request)).toMatchObject({
      capability: "visual_analysis.inspect_image_region",
    });
  });

  it("rejects an explicitly wrapped lane object that omits its capability", () => {
    const request = JSON.stringify({
      capability_lane_call: {
        operation: "compare",
        target_observable: "nabla_mu_T_mu_nu",
      },
    });

    expect(extractCodexCapabilityLaneRequestCandidates(request)).toEqual([]);
  });
});
