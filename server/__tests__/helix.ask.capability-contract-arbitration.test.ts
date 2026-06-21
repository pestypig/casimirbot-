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

  it("keeps explicit capability commands on domain-specific canonical goals and scopes", () => {
    const cases = [
      ["helix_ask.reflect_workstation_tool_alignment", "capability_help", "runtime_evidence"],
      ["docs-viewer.open", "doc_open", "current_turn_doc"],
      ["docs-viewer.summarize_doc", "doc_summary", "current_turn_doc"],
      ["docs-viewer.doc_equation_context", "doc_equation_context", "current_turn_doc"],
      ["helix_ask.reflect_theory_context", "theory_context_reflection", "theory_context"],
      ["helix.theory.frontierVectorFieldTrace", "theory_frontier_vector_field", "theory_context"],
      ["helix_ask.reflect_live_synthetic_data", "context_attachment_reflection", "context_reflection"],
      ["helix_ask.reflect_context_attachments", "context_attachment_reflection", "context_reflection"],
      ["helix_ask.reflect_ideology_context", "zen_graph_reflection", "zen_graph_reflection"],
      ["helix_ask.bridge_theory_ideology_context", "theory_ideology_bridge_reflection", "zen_graph_reflection"],
      ["helix_ask.build_civilization_scenario_frame", "civilization_bounds_reflection", "civilization_bounds"],
      ["helix_ask.reflect_civilization_bounds", "civilization_bounds_reflection", "civilization_bounds"],
      ["live_env.query_micro_reasoner_presets", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.draft_micro_reasoner_preset", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.route_micro_reasoner_prompt", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.query_live_source_quality", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.summarize_live_source_current_state", "live_source_mailbox_review", "live_source_mail"],
    ] as const;

    for (const [capability, goalKind, answerScope] of cases) {
      expect(canonicalGoalKindForExplicitCapability(capability), capability).toBe(goalKind);
      expect(answerScopeForExplicitCapability(capability), capability).toBe(answerScope);
    }
  });
});
