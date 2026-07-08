import { describe, expect, it } from "vitest";
import { applyHelixTerminalAuthoritySingleWriter } from "../terminal-authority-single-writer";

describe("terminal authority for Image Lens receipt reports", () => {
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
