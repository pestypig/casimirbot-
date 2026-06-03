import { describe, expect, it } from "vitest";

import {
  buildOperationalCapabilityTrace,
  buildOperationalSatisfactionEvaluation,
  buildTurnOperationalConstraints,
} from "../services/helix-ask/operational-constraints";

describe("Helix Ask operational constraints", () => {
  it("preserves forbidden image tools and local visual-capture meaning", () => {
    const packet = buildTurnOperationalConstraints({
      turnId: "ask:test:operational",
      promptText:
        "Do not call the GPT image 2. When I refer to visual capture, I mean the Helix Ask ability to capture a tab.",
      promptInterpretation: {
        schema: "helix.prompt_interpretation.v1",
        negative_constraints: ["Do not call the GPT image 2."],
      },
    });

    expect(packet.forbidden_tools).toContain("gpt-image-2");
    expect(packet.forbidden_tool_families).toContain("image_generation");
    expect(packet.local_term_bindings).toContainEqual(expect.objectContaining({
      term: "visual capture",
      meaning: "helix_tab_capture",
    }));
    expect(packet.assistant_answer).toBe(false);
  });

  it("tracks Chrome extension localhost as a required operational surface", () => {
    const packet = buildTurnOperationalConstraints({
      turnId: "ask:test:chrome",
      promptText:
        "Through the localhost 5050 Chrome tab with the Codex extension, activate a debugging session.",
    });

    expect(packet.requested_surface).toBe("chrome_extension_localhost_5050_tab");
    expect(packet.required_surface).toBe("chrome_extension_localhost_5050_tab");
    expect(packet.surface_satisfaction_required).toBe(true);
    expect(packet.fallback_equivalence_policy).toBe("diagnostic_only");
    expect(packet.allowed_fallback_surfaces).toEqual(expect.arrayContaining(["backend_api_probe", "codex_in_app_browser"]));
  });

  it("separates proposed, rejected, executed, and fallback capabilities", () => {
    const payload = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:trace",
        capability_family: "docs",
        requested_action: "locate_or_read_document",
        admission_status: "rejected",
        rejection_reason: "capability_family_not_admitted_by_tool_policy",
      },
      agent_step_decision: {
        schema: "helix.agent_step_decision.v1",
        model_decision: {
          chosen_capability: "docs-viewer.locate_in_doc",
        },
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            chosen_capability: "repo-code.search_concept",
            produced_artifacts: ["runtime_tool_call", "runtime_tool_observation"],
          },
        ],
      },
    };

    const trace = buildOperationalCapabilityTrace({
      turnId: "ask:test:trace",
      payload,
    });

    expect(trace.model_proposed_capability).toBe("docs-viewer.locate_in_doc");
    expect(trace.rejected_capability).toMatchObject({
      capability: "docs:locate_or_read_document",
      reason: "capability_family_not_admitted_by_tool_policy",
    });
    expect(trace.policy_admitted_capability).toBe("repo-code.search_concept");
    expect(trace.executed_capability).toBe("repo-code.search_concept");
    expect(trace.fallback_capability).toBe("repo-code.search_concept");
  });

  it("marks repo fallback as diagnostic when a Chrome surface was required", () => {
    const payload = {
      turn_operational_constraints: buildTurnOperationalConstraints({
        turnId: "ask:test:satisfaction",
        promptText: "Use the localhost 5050 Chrome tab with the Codex extension.",
      }),
      operational_capability_trace: {
        schema: "helix.operational_capability_trace.v1",
        turn_id: "ask:test:satisfaction",
        executed_capability: "repo-code.search_concept",
        fallback_capability: "repo-code.search_concept",
        fallback_authority_scope: "diagnostic_only",
      },
      capability_plan: { schema: "helix.capability_plan.v1" },
      agent_runtime_loop: { schema: "helix.agent_runtime_loop.v1" },
    };

    const evaluation = buildOperationalSatisfactionEvaluation({
      turnId: "ask:test:satisfaction",
      payload,
    });

    expect(evaluation.requested_surface_satisfied).toBe(false);
    expect(evaluation.fallback_used).toBe(true);
    expect(evaluation.fallback_equivalent).toBe(false);
    expect(evaluation.remaining_surface_blocker).toBe("required_surface_not_satisfied:chrome_extension_localhost_5050_tab");
    expect(evaluation.next_decision).toBe("continue");
  });
});
