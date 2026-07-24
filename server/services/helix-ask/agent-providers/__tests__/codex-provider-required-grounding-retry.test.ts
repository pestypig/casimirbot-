import { describe, expect, it } from "vitest";
import {
  buildCodexCapabilityLaneRetryInstruction,
  runtimeProviderRequiredGroundingCapabilityIdsFromBody,
  shouldRetryCodexCapabilityLaneRequest,
} from "../codex-provider";

describe("Codex required-grounding correction", () => {
  it("reads required grounding capabilities from the Realtime route contract", () => {
    expect(runtimeProviderRequiredGroundingCapabilityIdsFromBody({
      route_metadata: {
        requiredGroundingCapabilityIds: ["docs.search"],
        source_target_intent: {
          required_grounding_capability_ids: ["docs.search"],
        },
      },
      realtime_grounded_feedback_binding: {
        required_grounding_capability_ids: ["docs.search"],
      },
    })).toEqual(["docs.search"]);
  });

  it("retries a direct locator answer when the required Docs observation is absent", () => {
    expect(shouldRetryCodexCapabilityLaneRequest({
      question: "Find the NHM2 current status whitepaper.",
      providerText:
        "The NHM2 current status whitepaper is docs/research/nhm2-current-status-whitepaper.md.",
      existingObservationPacketCount: 0,
      requiredCapabilityIds: ["docs.search"],
    })).toBe(true);
  });

  it("does not retry once a required observation packet exists", () => {
    expect(shouldRetryCodexCapabilityLaneRequest({
      question: "Find the NHM2 current status whitepaper.",
      providerText: "The document is available.",
      existingObservationPacketCount: 1,
      requiredCapabilityIds: ["docs.search"],
    })).toBe(false);
  });

  it("names the required capability instead of falling back to translation", () => {
    const instruction = buildCodexCapabilityLaneRetryInstruction(
      "Find the NHM2 current status whitepaper.",
      ["docs.search"],
    );

    expect(instruction).toContain("docs.search");
    expect(instruction).not.toContain("live_translation.translate_text");
  });
});
