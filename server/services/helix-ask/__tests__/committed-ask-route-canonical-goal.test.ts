import { describe, expect, it } from "vitest";
import {
  HELIX_COMMITTED_ASK_ROUTE_SCHEMA,
  type HelixCommittedAskRoute,
} from "@shared/helix-committed-ask-route";
import { reconcileCanonicalGoalFrameToCommittedRoute } from "../committed-ask-route";

const scholarlyRoute = (turnId: string): HelixCommittedAskRoute => ({
  schema: HELIX_COMMITTED_ASK_ROUTE_SCHEMA,
  turn_id: turnId,
  commit_id: "committed-route:scholarly",
  prompt_hash: "prompt-hash",
  committed_at_stage: "post_prompt_source_arbitration",
  prompt_intent: {
    primary_intent_kind: "general_reasoning",
    secondary_intent_kinds: [],
  },
  route: {
    selected_route: "/ask",
    source_target: "scholarly_research",
    target_kind: "scholarly_research",
    strength: "hard",
    route_reason: "runtime_scholarly_capability_request",
    stale_metadata_policy: "ignore_unless_matches_commit",
  },
  canonical_goal: {
    goal_kind: "scholarly_research_lookup",
    required_terminal_kind: "scholarly_research_answer",
    allowed_terminal_artifact_kinds: ["scholarly_research_answer", "typed_failure"],
    forbidden_terminal_artifact_kinds: ["direct_answer_text"],
  },
  capability_policy: {
    allowed_tool_families: ["scholarly_research"],
    suppressed_tool_families: [],
    required_capability_families: ["scholarly_research"],
    mutating_families_allowed: false,
  },
  suppression: {
    contextual_tool_mentions: [],
    negative_constraints: [],
    suppressed_families: [],
    firewall_required: true,
  },
  terminal_product: {
    terminal_authority_required: true,
    evidence_reentry_required: true,
    followup_reasoning_required: true,
    required_terminal_product: "scholarly_research_answer",
  },
  transitions: [],
  compatibility: {
    source_goal_capability_terminal_compatible: true,
    stale_metadata_ignored: false,
    shortcut_firewall_applied: false,
    violations: [],
  },
  assistant_answer: false,
  raw_content_included: false,
});

describe("committed route canonical goal reconciliation", () => {
  it("replaces a stale model-only frame with the compatible scholarly route goal", () => {
    const turnId = "ask:test:magnetar-citations";
    const route = scholarlyRoute(turnId);
    route.compatibility.source_goal_capability_terminal_compatible = false;
    route.compatibility.violations = [
      "source_target_goal_mismatch:model_only_concept_for_source_backed_route",
      "required_terminal_product_forbidden",
    ];
    const result = reconcileCanonicalGoalFrameToCommittedRoute({
      turnId,
      canonicalGoalFrame: {
        turn_id: turnId,
        goal_kind: "model_only_concept",
        answer_scope: "model_only",
        required_terminal_kind: "direct_answer_text",
        allows_workspace_context: false,
        allows_prior_artifacts: false,
        confidence: "high",
        classifier_reasons: ["provider_preflight_scope_contract_model_only"],
      },
      committedRoute: route,
    });

    expect(result).toMatchObject({
      reconciled: true,
      reason: "committed_source_route_overrode_stale_model_only_goal",
      frame: {
        turn_id: turnId,
        goal_kind: "scholarly_research_lookup",
        answer_scope: "external_scholarly_research",
        required_terminal_kind: "scholarly_research_answer",
        allows_workspace_context: false,
        allows_prior_artifacts: false,
      },
    });
    expect(result.frame?.classifier_reasons).toEqual([
      "provider_preflight_scope_contract_model_only",
      "committed_source_route_overrode_stale_model_only_goal",
    ]);
  });

  it("does not let an incompatible committed route override the canonical goal", () => {
    const turnId = "ask:test:incompatible-route";
    const route = scholarlyRoute(turnId);
    route.compatibility.source_goal_capability_terminal_compatible = false;
    route.compatibility.violations = ["required_capability_family_not_admitted"];
    const frame = {
      turn_id: turnId,
      goal_kind: "model_only_concept",
      required_terminal_kind: "direct_answer_text",
    };

    expect(reconcileCanonicalGoalFrameToCommittedRoute({
      turnId,
      canonicalGoalFrame: frame,
      committedRoute: route,
    })).toEqual({
      reconciled: false,
      frame,
      reason: null,
    });
  });

  it("does not override an intentional model-only demotion for a failure-only referent", () => {
    const turnId = "ask:test:failure-only-referent";
    const route = scholarlyRoute(turnId);
    const frame = {
      turn_id: turnId,
      goal_kind: "model_only_concept",
      answer_scope: "model_only",
      required_terminal_kind: "direct_answer_text",
      classifier_reasons: [
        "capability_contract_arbitration",
        "conversational_referent_no_evidence",
        "referent_cannot_supply_requested_evidence",
        "conversational_referent_has_no_retrievable_claims",
      ],
    };

    expect(reconcileCanonicalGoalFrameToCommittedRoute({
      turnId,
      canonicalGoalFrame: frame,
      committedRoute: route,
    })).toEqual({
      reconciled: false,
      frame,
      reason: null,
    });
  });
});
