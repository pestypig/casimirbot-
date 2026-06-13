import { describe, expect, it } from "vitest";
import {
  buildImageAttachmentLensRunV1,
  shouldAdmitImageAttachmentLensRun,
} from "../image-attachment-lens-run.v1";

describe("image attachment lens run contract", () => {
  it("admits explicit attached-image inspection prompts", () => {
    const admission = shouldAdmitImageAttachmentLensRun("Inspect this attached image and crop the equation region.");

    expect(admission).toEqual({
      admitted: true,
      reason: "visual_attachment_inspection_requested",
      promptRequiresVisualInspection: true,
    });
  });

  it("does not admit negated image lens prompts", () => {
    const admission = shouldAdmitImageAttachmentLensRun("Don't open Image Lens or crop the image yet.");

    expect(admission.admitted).toBe(false);
    expect(admission.reason).toBe("negated_visual_tool_request");
    expect(admission.promptRequiresVisualInspection).toBe(false);
  });

  it("does not admit future or instruction-only crop mentions", () => {
    const future = shouldAdmitImageAttachmentLensRun("After we crop it later, we can connect it to visual capture.");
    const instructions = shouldAdmitImageAttachmentLensRun("Write the instructions for a patch plan to use Image Lens.");

    expect(future.admitted).toBe(false);
    expect(future.reason).toBe("future_or_instruction_only_visual_tool_mention");
    expect(instructions.admitted).toBe(false);
    expect(instructions.reason).toBe("future_or_instruction_only_visual_tool_mention");
  });

  it("marks not-admitted artifacts as observation-only and non-authoritative", () => {
    const artifact = buildImageAttachmentLensRunV1({
      threadId: "helix-ask:desktop",
      attachmentId: "attachment:1",
      admission: {
        admitted: false,
        reason: "prompt_does_not_request_visual_attachment_lens",
        promptRequiresVisualInspection: false,
        autoOpenedImageLens: false,
      },
    });

    expect(artifact.broadObservation.status).toBe("not_requested");
    expect(artifact.claimBoundary).toEqual({
      observationOnly: true,
      notAnswerAuthority: true,
      requiresSolverReentry: true,
    });
  });
});
