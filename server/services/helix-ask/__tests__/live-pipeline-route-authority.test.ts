import { describe, expect, it } from "vitest";

import { buildCapabilityPlan } from "../capability-planner";
import { buildCommittedAskRoute } from "../committed-ask-route";
import { resolveAskCapabilityContractArbitration } from "../capability-contract-arbitration";
import { resolveAuthoritativeLivePipelineRoute } from "../live-pipeline-route-authority";
import { isHelixAskGoldenPathVisualCaptureRequested } from "../golden-path/capabilities/visual-capture";
import { arbitrateAskSourceTarget } from "../ask-source-target-arbitrator";

const turnId = "ask:test:live-pipeline-authority";
const promptText = "keep checking my screen as a live answer every 10 seconds";
const canonicalGoalFrame = {
  turn_id: turnId,
  goal_kind: "live_pipeline_control",
  required_terminal_kind: "live_pipeline_receipt",
};
const routeProductContract = {
  schema: "helix.route_product_contract.v1",
  turn_id: turnId,
  source_target: "live_pipeline",
  allowed_terminal_artifact_kinds: ["live_pipeline_receipt", "typed_failure"],
  forbidden_terminal_artifact_kinds: ["situation_context_pack", "direct_answer_text"],
};
const visualCapabilityHypothesis = {
  requested_capability: "image_lens.inspect",
  selected_capability: "situation-room.describe_visual_capture",
  source_target: "live_pipeline",
  admitted_tool_families: ["live_pipeline"],
};

describe("authoritative live-pipeline route contract", () => {
  it("requires same-turn canonical and route-product agreement", () => {
    expect(resolveAuthoritativeLivePipelineRoute({
      turnId,
      canonicalGoalFrame,
      routeProductContract,
    })).toMatchObject({
      sourceTarget: "live_pipeline",
      goalKind: "live_pipeline_control",
      requiredTerminalKind: "live_pipeline_receipt",
    });

    expect(resolveAuthoritativeLivePipelineRoute({
      turnId,
      canonicalGoalFrame: { ...canonicalGoalFrame, turn_id: "ask:stale" },
      routeProductContract,
    })).toBeNull();
    expect(resolveAuthoritativeLivePipelineRoute({
      turnId,
      canonicalGoalFrame,
      routeProductContract: {
        ...routeProductContract,
        allowed_terminal_artifact_kinds: ["situation_context_pack"],
        forbidden_terminal_artifact_kinds: ["live_pipeline_receipt"],
      },
    })).toBeNull();
  });

  it("preserves implicit visual retrieval when compact evidence is not in the request", () => {
    const question = "review what is happening right now in the screen capture";
    expect(isHelixAskGoldenPathVisualCaptureRequested({ question })).toBe(false);
    expect(isHelixAskGoldenPathVisualCaptureRequested({
      question,
      visual_summary: "A compact workstation frame is available.",
    })).toBe(true);
    expect(isHelixAskGoldenPathVisualCaptureRequested({
      question,
      requested_capability: "image_lens.inspect",
    })).toBe(true);
  });

  it("demotes a visual capability hypothesis after live control authority is committed", () => {
    const arbitration = resolveAskCapabilityContractArbitration({
      turnId,
      promptText,
      canonicalGoalFrame,
      routeProductContract,
      toolCallAdmissionDecision: visualCapabilityHypothesis,
      fallbackSourceTarget: "visual_capture",
      fallbackPlanFamily: "visual_capture",
      fallbackGoalKind: "visual_capture_describe",
      fallbackRequiredTerminalKind: "situation_context_pack",
    });

    expect(arbitration).toMatchObject({
      contract_state: "authoritative_live_pipeline_contract",
      requested_capability: "image_lens.inspect",
      selected_source_target: "live_pipeline",
      selected_plan_family: "live_source",
      canonical_goal_kind: "live_pipeline_control",
      required_terminal_kind: "live_pipeline_receipt",
      demotion_reason: "authoritative_live_pipeline_contract_overrode_capability_hypothesis",
    });
  });

  it("uses the structured live intent for source admission without executing contextual repair language", () => {
    const sourceFor = (promptText: string) => arbitrateAskSourceTarget({
      turnId,
      threadId: "helix-ask:desktop",
      promptText,
    }).target_source;

    expect(sourceFor("why is the visual source not updating?")).toBe("live_pipeline");
    expect(sourceFor("all right, review the screen; I haven't started the 10 second interval yet")).not.toBe("live_pipeline");
    expect(sourceFor("review the current screen before I start the 10 second interval")).not.toBe("live_pipeline");
    expect(sourceFor("Why was the visual source not updating yesterday?")).not.toBe("live_pipeline");
    expect(sourceFor('The screen says "visual source not updating". Explain that label.')).not.toBe("live_pipeline");
    expect(sourceFor("If the visual source is not updating later, explain what repair would do.")).not.toBe("live_pipeline");
    expect(sourceFor("Yesterday the visual source was not updating. Repair the live source now.")).toBe("live_pipeline");
  });

  it("keeps capability planning and committed routing on the live control product", () => {
    const capabilityPlan = buildCapabilityPlan({
      turnId,
      promptText,
      canonicalGoalFrame,
      routeProductContract,
      sourceTargetIntent: {
        target_source: "visual_capture",
        target_kind: "visual_capture",
      },
      toolCallAdmissionDecision: visualCapabilityHypothesis,
    });
    expect(capabilityPlan).toMatchObject({
      capability_family: "live_source",
      requested_action: "control_live_source",
      selected_capability: "control_live_source",
      source_target: "live_pipeline",
      goal_kind: "live_pipeline_control",
      required_terminal_kind: "live_pipeline_receipt",
      admission_status: "admitted",
      capability_contract_arbitration: {
        contract_state: "authoritative_live_pipeline_contract",
      },
    });

    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText,
      selectedRoute: "live_pipeline_control",
      payload: {
        canonical_goal_frame: canonicalGoalFrame,
        route_product_contract: routeProductContract,
        source_target_intent: {
          target_source: "visual_capture",
          target_kind: "visual_capture",
          strength: "hard",
        },
        tool_call_admission_decision: visualCapabilityHypothesis,
        capability_plan: capabilityPlan as unknown as Record<string, unknown>,
      },
    });
    expect(committedRoute).toMatchObject({
      route: {
        source_target: "live_pipeline",
        target_kind: "live_pipeline",
        route_reason: "canonical_live_pipeline_route_product_contract",
      },
      canonical_goal: {
        goal_kind: "live_pipeline_control",
        required_terminal_kind: "live_pipeline_receipt",
      },
      capability_policy: {
        required_capability_families: ["live_pipeline"],
      },
      terminal_product: {
        required_terminal_product: "live_pipeline_receipt",
      },
      compatibility: {
        source_goal_capability_terminal_compatible: true,
        violations: [],
      },
    });
  });
});
