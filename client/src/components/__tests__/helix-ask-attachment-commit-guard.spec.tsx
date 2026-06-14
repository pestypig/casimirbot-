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
    expect(source).toContain("validateHelixAskAttachmentForSubmit");
    expect(source).toContain("typedAttachmentItems");
    expect(source).toContain("raw_image_scope: \"turn_input_only\"");
  });

  it("blocks visual prompts with stale attachment state before posting the turn", () => {
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain("submittedAttachmentChecks");
    expect(source).toContain("invalidSubmittedAttachment");
    expect(source).toContain("isHelixAskVisualPrompt(first)");
    expect(source).toContain("No usable visual evidence is available for this turn.");
  });

  it("supports multiple image chips and large-paste text attachment promotion", () => {
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain("const [askAttachments, setAskAttachments]");
    expect(source).toContain("HELIX_ASK_MAX_ATTACHMENTS");
    expect(source).toContain("const input = event.currentTarget");
    expect(source).toContain("const files = Array.from(input.files ?? [])");
    expect(source).toContain("input.value = \"\"");
    expect(source).toContain("multiple");
    expect(source).toContain("handleAskPaste");
    expect(source).toContain("firstLooksLikeLargePastedText");
    expect(source).toContain("buildHelixAskTextAttachmentFromText(first)");
    expect(source).toContain('first = "Use the attached pasted text."');
    expect(source).toContain("attachmentContextPackForTurn");
    expect(source).toContain("attachment_context_pack");
    expect(source).toContain("pasted-text-");
    expect(source).toContain("buildHelixAskTextAttachmentTurnInputItem");
    expect(source).toContain('type: "attachment"');
    expect(source).toContain('raw_content_scope: "turn_input_only"');
    expect(source).toContain("promotedPastedTextTurnInputItems");
    expect(source).toContain("turnInputItems: promotedPastedTextTurnInputItems");
    expect(source).toContain("explicitTurnInputItemsForTurn");
    expect(source).toContain("latestPastedTextAttachmentRef");
    expect(source).toContain("hasSubmittedTextAttachment");
    expect(source).toContain("Use the attached pasted text.");
    expect(source).toContain("The pasted text attachment is not available for this turn.");
  });

  it("keeps pasted text attachment prompts out of the visual-input classifier", () => {
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain("HELIX_ASK_TEXT_ATTACHMENT_PROMPT_PATTERN");
    expect(source).toContain("HELIX_ASK_TEXT_ATTACHMENT_PROMPT_PATTERN.test(normalized)");
    expect(source).toContain("return false;");
  });

  it("routes pasted-text resume recall through backend conversation memory instead of local shortcuts", () => {
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain("HELIX_ASK_PASTED_TEXT_RESUME_RECALL_PROMPT_PATTERN");
    expect(source).toContain("isHelixAskPastedTextResumeRecallPrompt(trimmed)");
    expect(source).toContain("backendOwnedPastedTextResumeRecall");
    expect(source).toContain("buildHelixAskPastedTextResumeRecallRouteMetadata");
    expect(source).toContain('source: "conversation_memory_recall"');
    expect(source).toContain('target_source: "conversation_memory"');
    expect(source).toContain('must_enter_backend_ask: true');
    expect(source).toContain('allow_client_shortcut: false');
    expect(source).toContain('suppressed_routes: ["conversation:simple", "model_only_concept", "workspace_diagnostic"]');
    expect(source).toContain("options?.bypassWorkstationDispatch === true || backendOwnedPastedTextResumeRecall");
    expect(source).toContain("routeMetadata: routeMetadataForTurn");
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
