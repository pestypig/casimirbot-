import { describe, expect, it } from "vitest";

import { buildAskEvidenceTargetArbitration } from "../services/helix-ask/evidence-target-arbitration";

const arbitrate = (promptText: string) =>
  buildAskEvidenceTargetArbitration({
    turnId: "ask:test-evidence-target-arbitration",
    threadId: "helix-ask:test",
    promptText,
  });

describe("Helix Ask evidence-target arbitration", () => {
  it("treats Stage Play panel definition prompts as repo/product evidence before live reflection", () => {
    const arbitration = arbitrate("ok what is the stage play panel?");

    expect(arbitration).toMatchObject({
      schema: "helix.ask_evidence_target_arbitration.v1",
      selected_target_source: "repo_code",
      selected_target_kind: "repo_code",
      assistant_answer: false,
      raw_content_included: false,
      context_role: "admission_control",
    });
    expect(arbitration.available_capabilities).toContain("repo-code.search_concept");
    expect(arbitration.evidence_target_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target_source: "repo_code",
          capability_keys: expect.arrayContaining(["repo-code.search_concept"]),
        }),
        expect.objectContaining({
          target_source: "live_environment",
          capability_keys: expect.arrayContaining(["live_env.reflect_stage_play_context"]),
          reason_codes: expect.arrayContaining(["stage_play_lexical_candidate_only"]),
        }),
      ]),
    );
  });

  it("keeps explicit active Stage Play reflection on the live-environment evidence path", () => {
    const arbitration = arbitrate("Use Stage Play to reflect the active visual source.");

    expect(arbitration.selected_target_source).toBe("live_environment");
    expect(arbitration.must_enter_backend_ask).toBe(true);
    expect(arbitration.allow_no_tool_direct).toBe(false);
    expect(arbitration.available_capabilities).toContain("live_env.reflect_stage_play_context");
  });

  it("suppresses Stage Play tools when the prompt says not to use Stage Play", () => {
    const arbitration = arbitrate("Do not use Stage Play; explain conceptually.");

    expect(arbitration.disallowed_capabilities).toContain("live_env.reflect_stage_play_context");
    expect(arbitration.selected_target_source).not.toBe("live_environment");
  });

  it("does not turn generic citation requests into repo evidence", () => {
    const arbitration = arbitrate("What is energy mass equivalence? cite sources.");

    expect(arbitration.selected_target_source).not.toBe("repo_code");
    expect(arbitration.reason_codes).not.toContain("known_project_concept_alias_question");
  });

  it("keeps screen-visible control words contextual instead of admitting live tools", () => {
    const arbitration = arbitrate('The screen says "start visual interval." What does that label mean?');

    expect(arbitration.selected_target_source).not.toBe("live_environment");
    expect(arbitration.available_capabilities).not.toContain("live_env.reflect_stage_play_context");
    expect(arbitration.available_capabilities).not.toContain("live-source.set_rate");
  });

  it("treats not-yet-started visual capture phrasing as context, not control", () => {
    const arbitration = arbitrate("I haven't started visual capture yet. Explain what will be needed before a checkpoint.");

    expect(arbitration.selected_target_source).not.toBe("live_environment");
    expect(arbitration.available_capabilities).not.toContain("live_env.reflect_stage_play_context");
    expect(arbitration.available_capabilities).not.toContain("live-source.set_rate");
  });
});
