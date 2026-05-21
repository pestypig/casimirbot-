import { describe, expect, it } from "vitest";

import { buildHelixDomainContinuationDecision } from "../services/helix-ask/domain-continuation-decision";

const buildDecision = (prompt: string, payload: Record<string, unknown>) =>
  buildHelixDomainContinuationDecision({
    turnId: "ask:domain-continuation",
    prompt,
    payload,
  });

describe("helix ask domain continuation decision", () => {
  it("continues docs-panel goals when the observed artifact is only active document identity", () => {
    const decision = buildDecision("Okay, can you open up the Docs panel?", {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workspace_action_receipt" },
      source_target_intent: { explicit_cues: ["docs_panel_open"] },
      terminal_artifact_kind: "active_doc_identity",
      current_turn_artifact_ledger: [
        {
          kind: "active_doc_identity",
          payload: { active_doc_path: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md" },
        },
      ],
    });

    expect(decision.decision).toBe("continue");
    expect(decision.reason).toBe("docs_panel_open_requires_docs_viewer_open_action");
    expect(decision.next_action).toEqual(
      expect.objectContaining({ panel_id: "docs-viewer", action_id: "open" }),
    );
  });

  it("continues doc opening from search results to candidate validation", () => {
    const decision = buildDecision("Open the NHM-2 white paper from the docs.", {
      goal_satisfaction_evaluation: {
        terminal_contract: { goal_kind: "doc_open_best" },
      },
      current_turn_artifact_ledger: [
        {
          kind: "doc_search_results",
          payload: {
            query: "NHM-2 whitepaper",
            matches: [{ path: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md" }],
          },
        },
      ],
    });

    expect(decision.decision).toBe("continue");
    expect(decision.reason).toBe("doc_search_candidates_require_validation");
    expect(decision.next_action).toEqual(
      expect.objectContaining({ panel_id: "docs-viewer", action_id: "validate_doc_candidates" }),
    );
    expect(decision.next_action?.args).toEqual(
      expect.objectContaining({ query: "NHM-2 whitepaper", transcript: "Open the NHM-2 white paper from the docs." }),
    );
  });

  it("continues doc opening from strong validation to open_doc_by_path", () => {
    const decision = buildDecision("Open the NHM-2 white paper from the docs.", {
      goal_satisfaction_evaluation: {
        terminal_contract: { goal_kind: "doc_open_best" },
      },
      current_turn_artifact_ledger: [
        {
          kind: "doc_candidate_validation",
          payload: {
            query: "NHM-2 whitepaper",
            selected_status: "strong",
            selected_path: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          },
        },
      ],
    });

    expect(decision.decision).toBe("continue");
    expect(decision.reason).toBe("validated_doc_candidate_requires_open");
    expect(decision.next_action).toEqual(
      expect.objectContaining({
        panel_id: "docs-viewer",
        action_id: "open_doc_by_path",
        args: expect.objectContaining({ path: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md" }),
      }),
    );
  });

  it("retries doc opening when the opened path does not match the validated candidate", () => {
    const decision = buildDecision("Open the NHM-2 white paper from the docs.", {
      goal_satisfaction_evaluation: {
        terminal_contract: { goal_kind: "doc_open_best" },
      },
      current_turn_artifact_ledger: [
        {
          kind: "doc_candidate_validation",
          payload: {
            query: "NHM-2 whitepaper",
            selected_status: "strong",
            selected_path: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          },
        },
        {
          kind: "doc_open_receipt",
          payload: {
            path: "/docs/research/nhm2-current-status-whitepaper-2026-04-03.md",
            status: "opened",
          },
        },
      ],
    });

    expect(decision.decision).toBe("retry");
    expect(decision.reason).toBe("doc_open_path_mismatch_retry_selected_path");
    expect(decision.next_action?.args).toEqual(
      expect.objectContaining({
        path: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        previous_opened_path: "/docs/research/nhm2-current-status-whitepaper-2026-04-03.md",
      }),
    );
  });

  it("continues doc location goals when active doc context exists but locate has not run", () => {
    const decision = buildDecision("Find lapse shift in the current doc.", {
      goal_satisfaction_evaluation: {
        terminal_contract: { goal_kind: "doc_evidence_location" },
      },
      workspace_context_snapshot: {
        activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      },
    });

    expect(decision.decision).toBe("continue");
    expect(decision.reason).toBe("active_doc_context_requires_locate_in_doc");
    expect(decision.next_action).toEqual(
      expect.objectContaining({
        panel_id: "docs-viewer",
        action_id: "locate_in_doc",
        args: expect.objectContaining({
          path: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          query: "lapse shift",
        }),
      }),
    );
  });

  it("fails closed for visual describe goals when no visual source is available", () => {
    const decision = buildDecision("Describe what you see in the live capture.", {
      canonical_goal_frame: { goal_kind: "model_only_concept" },
    });

    expect(decision.decision).toBe("typed_failure");
    expect(decision.typed_failure_code).toBe("visual_evidence_missing");
  });

  it("creates a typed repair candidate when visual source identity exists but field evaluations are missing", () => {
    const decision = buildDecision("Describe what you see in the live capture.", {
      canonical_goal_frame: { goal_kind: "situation_context_question" },
      live_source_identity_audit: {
        diagnosis: "field_evaluations_missing",
      },
    });

    expect(decision.decision).toBe("continue");
    expect(decision.reason).toBe("visual_source_requires_field_evaluations");
    expect(decision.repair_candidate).toEqual(
      expect.objectContaining({ capability: "situation-room.run_field_evaluations" }),
    );
  });

  it("treats screen-review prompts with negated interval language as visual content, not live control", () => {
    const decision = buildDecision(
      "Can you review what is happening in the screen capture? I haven't started the interval 10 seconds yet.",
      {
        canonical_goal_frame: { goal_kind: "live_pipeline_control" },
        live_source_identity_audit: {
          diagnosis: "field_evaluations_missing",
        },
      },
    );

    expect(decision.goal_kind).toBe("visual_capture_describe");
    expect(decision.decision).toBe("continue");
    expect(decision.reason).toBe("visual_source_requires_field_evaluations");
    expect(decision.next_action).toBeUndefined();
  });

  it("does not continue visual content goals after observation and field evaluation evidence are present", () => {
    const decision = buildDecision("Describe what you see in the live capture.", {
      goal_satisfaction_evaluation: {
        terminal_contract: { goal_kind: "visual_capture_describe" },
      },
      current_turn_artifact_ledger: [
        {
          kind: "situation_context_pack",
          payload: {
            selected_observation_refs: ["observation:current"],
            selected_field_evaluation_refs: ["field_eval:activity"],
          },
        },
      ],
    });

    expect(decision.decision).toBe("none");
    expect(decision.reason).toBe("visual_evidence_already_satisfies_content_goal");
  });
});
