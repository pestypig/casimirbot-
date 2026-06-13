import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Helix Ask attachment commit guard", () => {
  const sourcePath = path.resolve(process.cwd(), "client/src/components/helix/HelixAskPill.tsx");

  it("validates image payload before constructing native image turn items", () => {
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain("validateHelixAskImageAttachmentForSubmit");
    expect(source).toContain("image needs reattach");
    expect(source).toContain("Image attachment is stale. Reattach the image before sending.");
    expect(source).toContain("runImageAttachmentLensRun");
    expect(source).toContain("ui_image_attachment_lens_run");
    expect(source).toContain("nativeImageCommitCheck?.can_submit && nativeImageBase64");
    expect(source).toContain("raw_image_scope: \"turn_input_only\"");
  });

  it("blocks visual prompts with stale attachment state before posting the turn", () => {
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain("submittedImageCommitCheck");
    expect(source).toContain("submittedImageAttachment && !submittedImageCommitCheck?.can_submit");
    expect(source).toContain("isHelixAskVisualPrompt(first)");
    expect(source).toContain("No usable visual evidence is available for this turn.");
  });

  it("preserves server-authoritative proof recall and workstation terminals over evidence-gate fallback text", () => {
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain('args.finalAnswerSource === "workstation_reasoning_trace"');
    expect(source).toContain('args.routeReasonCode === "proof_recall"');
    expect(source).toContain('args.finalAnswerSource === "workstation_tool_evaluation"');
    expect(source).toContain('args.terminalArtifactKind === "workstation_tool_evaluation"');
    expect(source).toContain('args.finalAnswerSource === "artifact_synthesis" && args.terminalArtifactKind === "doc_summary"');
    expect(source).toContain('args.finalAnswerSource === "artifact_synthesis" && args.routeReasonCode?.includes("active_doc_summary")');
    expect(source).toContain('!["unknown", "typed_failure", "legacy_fallback"].includes(args.finalAnswerSource)');
    expect(source).toContain("terminalAuthorityRecord?.final_answer_source");
  });
});
