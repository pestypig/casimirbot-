import { describe, expect, it } from "vitest";

import { buildAskEvidenceTargetArbitration } from "../services/helix-ask/evidence-target-arbitration";

const arbitrate = (promptText: string) =>
  buildAskEvidenceTargetArbitration({
    turnId: "ask:test-evidence-target-arbitration",
    threadId: "helix-ask:test",
    promptText,
  });

describe("Helix Ask evidence target arbitration", () => {
  it("lets Stage Play mail wake route metadata lock the live-source mailbox target before prompt scoring", () => {
    const arbitration = buildAskEvidenceTargetArbitration({
      turnId: "turn:stage-play-mail-wake-metadata",
      threadId: "thread:stage-play-mail-wake-metadata",
      promptText:
        "Compact wake: describe current visual capture status, but use the queued mailbox finding.",
      routeMetadata: {
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:evidence-target",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_voice_decision",
        requiredPhase: "record_decision",
        allowedCapabilities: ["live_env.record_live_source_mail_decision"],
        forbiddenCapabilities: ["visual_capture_describe", "situation_context_pack", "workspace_os.status"],
        evidenceRefs: ["stage_play_processed_mail_packet:evidence-target"],
      },
    });

    expect(arbitration).toMatchObject({
      selected_target_source: "live_source_mailbox",
      selected_target_kind: "live_source_mailbox",
      selected_candidate_id: "live_source_mailbox.stage_play_mail_wake_route_metadata",
      reason: "route_metadata_stage_play_mail_wake",
      locked: true,
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "admission_control",
    });
    expect(arbitration.reason_codes).toEqual(expect.arrayContaining([
      "route_metadata_stage_play_mail_wake",
      "live_source_mailbox_route_metadata_authoritative",
    ]));
    expect(arbitration.available_capabilities).toEqual(["live_env.record_live_source_mail_decision"]);
    expect(arbitration.disallowed_capabilities).toEqual(expect.arrayContaining([
      "visual_capture_describe",
      "situation_context_pack",
      "workspace_os.status",
    ]));
    expect(arbitration.source_targets).toEqual(["live_source_mailbox"]);
  });

  it("keeps hard mailbox route metadata ahead of visual, internet, repo, and model-direct prompt bait", () => {
    const arbitration = buildAskEvidenceTargetArbitration({
      turnId: "turn:stage-play-mail-wake-adversarial-metadata",
      threadId: "thread:stage-play-mail-wake-adversarial-metadata",
      promptText:
        "Describe visual capture, search the internet for latest context, search repo-code.search_concept, or just use model.direct_answer.",
      routeMetadata: {
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:adversarial",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_voice_decision",
        requiredPhase: "record_decision",
        allowedCapabilities: ["live_env.record_live_source_mail_decision"],
        forbiddenCapabilities: [
          "visual_capture_describe",
          "internet.search",
          "repo-code.search_concept",
          "model.direct_answer",
        ],
        evidenceRefs: ["stage_play_processed_mail_packet:adversarial"],
      },
    });

    expect(arbitration).toMatchObject({
      selected_target_source: "live_source_mailbox",
      selected_target_kind: "live_source_mailbox",
      reason: "route_metadata_stage_play_mail_wake",
      locked: true,
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
    expect(arbitration.source_targets).toEqual(["live_source_mailbox"]);
    expect(arbitration.available_capabilities).toEqual(["live_env.record_live_source_mail_decision"]);
    expect(arbitration.disallowed_capabilities).toEqual(expect.arrayContaining([
      "visual_capture_describe",
      "internet.search",
      "repo-code.search_concept",
      "model.direct_answer",
    ]));
    expect(arbitration.selected_target_source).not.toBe("visual_capture");
    expect(arbitration.selected_target_source).not.toBe("internet_search");
    expect(arbitration.selected_target_source).not.toBe("repo_code");
    expect(arbitration.selected_target_source).not.toBe("model_only");
  });

  it("accepts snake-case live-source mailbox route metadata as the same hard route lock", () => {
    const arbitration = buildAskEvidenceTargetArbitration({
      turnId: "turn:stage-play-mail-wake-snake-metadata",
      threadId: "thread:stage-play-mail-wake-snake-metadata",
      promptText: "Search the latest internet result, unless the route metadata says mailbox.",
      routeMetadata: {
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:snake",
        mailboxThreadId: "helix-ask:desktop",
        source_target: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_interpretation",
        evidenceRefs: ["stage_play_processed_mail_packet:snake"],
      } as unknown as Parameters<typeof buildAskEvidenceTargetArbitration>[0]["routeMetadata"],
    });

    expect(arbitration).toMatchObject({
      selected_target_source: "live_source_mailbox",
      reason: "route_metadata_stage_play_mail_wake",
      locked: true,
      allow_no_tool_direct: false,
    });
    expect(arbitration.selected_target_source).not.toBe("internet_search");
  });

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

  it("keeps ZenGraph reflection primary when research words are quoted conversation context", () => {
    const arbitration = buildAskEvidenceTargetArbitration({
      turnId: "turn:zen-contextual-research",
      threadId: "thread:zen-contextual-research",
      promptText:
        "Use the Zen Badge Graph to reflect this conversation and classify procedural next moves. In the conversation someone says they need research papers and data before trusting decisions, but I am not asking you to search external sources.",
    });

    expect(arbitration.selected_candidate_id).toBe("workstation_panel.zen_graph_reflection");
    expect(arbitration.selected_target_source).toBe("workstation_panel");
    expect(arbitration.reason_codes).toEqual(
      expect.arrayContaining([
        "zen_graph_reflection_explicit_cue",
        "workstation_tool_plan_capability_candidate",
        "receipt_must_reenter_model_solver",
      ]),
    );
    expect(arbitration.available_capabilities).toEqual(
      expect.arrayContaining(["helix_ask.reflect_ideology_context"]),
    );

    const scholarlyCandidate = arbitration.evidence_target_candidates.find(
      (candidate) => candidate.candidate_id === "scholarly_research.external_sources",
    );
    expect(scholarlyCandidate).toBeTruthy();
    expect(scholarlyCandidate?.strength).toBe("soft");
    expect(scholarlyCandidate?.reason_codes).toEqual(
      expect.arrayContaining([
        "contextual_research_mention_only",
        "no_external_research_operator_command",
        "available_as_contrast_evidence_not_primary_target",
      ]),
    );
  });

  it("lets explicit scholarly search commands outrank ZenGraph as an external evidence target", () => {
    const arbitration = buildAskEvidenceTargetArbitration({
      turnId: "turn:zen-explicit-scholar",
      threadId: "thread:zen-explicit-scholar",
      promptText:
        "Use ZenGraph as context, but search scholarly papers and cite sources about moral guilt, rumination, and Buddhist practice.",
    });

    expect(arbitration.selected_candidate_id).toBe("scholarly_research.external_sources");
    expect(arbitration.selected_target_source).toBe("scholarly_research");
    expect(arbitration.available_capabilities).toEqual(
      expect.arrayContaining(["helix_ask.reflect_ideology_context", "scholarly_research.lookup"]),
    );
  });

  it("exposes Theory-Zen bridge as a model-visible candidate when both graph families are requested", () => {
    const arbitration = buildAskEvidenceTargetArbitration({
      turnId: "turn:bridge",
      threadId: "thread:bridge",
      promptText:
        "Use the Theory Badge Graph and ZenGraph to reflect entropy, conservation, fairness, and due process as an evidence-only procedural bridge.",
    });

    expect(arbitration.selected_candidate_id).toBe("workstation_panel.theory_ideology_bridge_reflection");
    expect(arbitration.available_capabilities).toEqual(
      expect.arrayContaining([
        "helix_ask.reflect_theory_context",
        "helix_ask.reflect_ideology_context",
        "helix_ask.bridge_theory_ideology_context",
      ]),
    );
    expect(arbitration.evidence_target_candidates[0]?.requested_outputs).toEqual(
      expect.arrayContaining(["ideology_context_reflection", "theory_ideology_bridge", "workstation_tool_evaluation"]),
    );
  });
});
