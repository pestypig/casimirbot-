import { describe, expect, it } from "vitest";

import {
  answerScopeForExplicitCapability,
  canonicalGoalKindForExplicitCapability,
} from "../services/helix-ask/capability-contract-arbitration";
import { WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS } from "../services/helix-ask/workstation-context-feed-query-tool-contracts";

describe("Helix capability contract arbitration", () => {
  it("routes every canonical workstation context-feed query capability to live environment review", () => {
    for (const spec of WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS) {
      expect(canonicalGoalKindForExplicitCapability(spec.capability)).toBe("live_environment_review");
      expect(answerScopeForExplicitCapability(spec.capability)).toBe("live_environment_state");
    }
  });
});

