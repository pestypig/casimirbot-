import { describe, expect, it } from "vitest";

import {
  extractCodexCapabilityLaneRequestCandidate,
  extractCodexCapabilityLaneRequestCandidates,
  stripCodexCapabilityLaneRequestMarkers,
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

  it("unwraps a continuation affordance envelope to its lane request", () => {
    const request =
      "HELIX_CAPABILITY_LANE_REQUEST_JSON: " +
      JSON.stringify({
        affordance_id: "turn:procedure:evaluate-closure",
        reason: "Evaluate the prepared procedure.",
        lane_request: {
          capability: "theory-experiment-procedure.evaluate_closure",
          procedure_id: "turn:procedure",
          procedure_sha256: "sha256:procedure",
        },
      });

    expect(extractCodexCapabilityLaneRequestCandidate(request)).toEqual({
      capability: "theory-experiment-procedure.evaluate_closure",
      procedure_id: "turn:procedure",
      procedure_sha256: "sha256:procedure",
    });
  });

  it("translates the legacy workstation marker without exposing it as answer text", () => {
    const request =
      "HELIX_WORKSTATION_TOOL_REQUEST_JSON: " +
      JSON.stringify({
        capability_id: "docs.search",
        arguments: { query: "NHM tube", max_hits: 5 },
      });

    expect(extractCodexCapabilityLaneRequestCandidate(request)).toMatchObject({
      capability_id: "docs.search",
      arguments: { query: "NHM tube", max_hits: 5 },
    });
    expect(stripCodexCapabilityLaneRequestMarkers(request)).toBe("");
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
