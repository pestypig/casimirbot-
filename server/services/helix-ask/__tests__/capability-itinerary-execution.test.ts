import { describe, expect, it } from "vitest";
import {
  buildHelixCapabilityItineraryExecutionState,
  isHelixCapabilityItineraryFamilyObserved,
} from "../capability-itinerary-execution";

describe("Helix capability itinerary execution", () => {
  it("counts the registered frontier-conjecture observation as theory-locator evidence", () => {
    const artifacts = [{
      artifact_id: "ask:test:theory-frontier",
      kind: "theory_frontier_conjecture_observation",
      payload: {
        schema: "helix.theory_frontier_conjecture_observation.v1",
        capability_key: "theory-badge-graph.propose_frontier_conjectures",
        status: "succeeded",
      },
    }];

    expect(isHelixCapabilityItineraryFamilyObserved("theory_locator", artifacts)).toBe(true);
    expect(buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: {
        terminal_success_criteria: {
          requires_post_observation_synthesis: true,
          required_observation_families: ["theory_locator"],
        },
      },
      artifacts,
    })).toMatchObject({
      complete: true,
      observed_families: ["theory_locator"],
      missing_observation_families: [],
    });
  });
});
