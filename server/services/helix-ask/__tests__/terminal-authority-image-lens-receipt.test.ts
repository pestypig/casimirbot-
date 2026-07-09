import { describe, expect, it } from "vitest";
import { applyHelixTerminalAuthoritySingleWriter } from "../terminal-authority-single-writer";

describe("terminal authority for Image Lens receipt reports", () => {
  it("materializes a route-approved Image Lens report over a stale post-tool continuation failure", () => {
    const staleFailure =
      "I could not complete this turn because a tool observation required a follow-up model answer step, but no later terminal answer artifact was available.";
    const payload: Record<string, unknown> = {
      ask_turn_solver_trace: {
        committed_ask_route: {
          schema: "helix.committed_ask_route.v1",
          route: {
            source_target: "visual_capture",
          },
          canonical_goal: {
            goal_kind: "visual_capture",
            required_terminal_kind: "image_lens_observation_report",
            allowed_terminal_artifact_kinds: ["image_lens_observation_report"],
            forbidden_terminal_artifact_kinds: [],
          },
          capability_policy: {
            allowed_tool_families: ["visual_analysis"],
            suppressed_tool_families: [],
          },
        },
        route_evidence_authority: {
          schema: "helix.route_evidence_authority.v1",
          turn_id: "turn-image-lens-report-terminal",
          allowed_terminal_artifact_kinds: ["image_lens_observation_report"],
          forbidden_terminal_artifact_kinds: [],
          required_terminal_kind: "image_lens_observation_report",
          terminal_product_allowed: true,
          current_turn_only: true,
        },
      },
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "model_synthesis",
      },
      terminal_artifact_kind: "image_lens_observation_report",
      final_answer_source: "provider_image_lens_observation_report",
      selected_final_answer: staleFailure,
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "image_lens_observation_report",
        concise_text: staleFailure,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "turn-image-lens-report-terminal:capability_lane:visual_analysis.inspect_image_region:equation_7",
          kind: "capability_lane_observation_packet",
          payload: {
            schema: "helix.capability_lane_observation_packet.v1",
            capability_key: "visual_analysis.inspect_image_region",
            status: "succeeded",
            region_label: "equation_7",
            bbox: { x: 73, y: 570, width: 1077, height: 87 },
            crop_ref: "sha256:test#crop=73,570,1077,87",
            extraction_status: "extracted",
            label_match_status: "matched",
            exact_equation_admissibility: "admissible_for_exact_equation",
            exact_row_promotion: { status: "promoted" },
            text_candidate: "S = \\int d^4x \\sqrt{-g} e^{-\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, (7)",
            latex_candidate: "S = \\int d^4x \\sqrt{-g} e^{-\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, \\quad (7)",
          },
        },
      ],
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId: "turn-image-lens-report-terminal",
      payload,
      artifactLedger: payload.current_turn_artifact_ledger as never,
    } as never);

    expect(result.selected_terminal_artifact_kind).toBe("image_lens_observation_report");
    expect(result.source).toBe("provider_image_lens_observation_report");
    expect(result.visible_text).toContain("admissible_for_exact_equation");
    expect(result.visible_text).toContain("latex_candidate");
    expect(result.visible_text).not.toContain("tool observation required a follow-up model answer step");
    expect(payload.terminal_error_code).toBeUndefined();
    expect(payload.final_answer_source).toBe("provider_image_lens_observation_report");
  });

  it("allows a bounded named receipt evaluation to terminate without a follow-up synthesis step", () => {
    const payload: Record<string, unknown> = {
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "model_synthesis",
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "visual_capture",
        allowed_terminal_artifact_kinds: [
          "image_lens_named_receipt_evaluation",
          "typed_failure",
        ],
        forbidden_terminal_artifact_kinds: ["model_synthesized_answer"],
        required_artifact_refs: [],
        precedence_reason: "image_lens_named_receipt_prompt_allows_bounded_receipt_report_without_claim_synthesis",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_artifact_kind: "image_lens_named_receipt_evaluation",
      final_answer_source: "image_lens_named_receipt_evaluation",
      selected_final_answer: [
        "Receipt evaluated: `crop_1` (existing Image Lens observation; no re-crop run).",
        "- promotion status: `not_applicable`",
        "- exact equation admissibility: `partial_candidate`",
      ].join("\n"),
      named_image_lens_receipt_evaluation: {
        schema: "helix.image_lens_named_receipt_evaluation.v1",
        status: "selected",
        receipt_name: "crop_1",
      },
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId: "turn-image-lens-receipt-terminal",
      payload,
      artifactLedger: [],
    } as never);

    expect(result.selected_terminal_artifact_kind).toBe("image_lens_named_receipt_evaluation");
    expect(result.source).toBe("image_lens_named_receipt_evaluation");
    expect(payload.final_answer_source).toBe("image_lens_named_receipt_evaluation");
    expect(payload.terminal_error_code).toBeUndefined();
    expect(String(payload.selected_final_answer)).toContain("no re-crop run");
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "typed_failure",
          reason: "stale_solver_continuation_superseded_by_image_lens_named_receipt_evaluation",
        }),
      ]),
    );
  });
});
