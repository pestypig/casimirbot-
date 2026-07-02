import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Helix Ask attachment commit guard", () => {
  const sourcePath = path.resolve(process.cwd(), "client/src/components/helix/HelixAskPill.tsx");

  it("validates image payload before constructing native image turn items", () => {
    const source = fs.readFileSync(sourcePath, "utf8");
    const attachmentCommitSource = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/helix/ask-console/HelixAskAttachmentCommit.ts"),
      "utf8",
    );

    expect(source).toContain("validateHelixAskImageAttachmentForSubmit");
    expect(source).toContain("runImageAttachmentLensRun");
    expect(source).toContain("ui_image_attachment_lens_run");
    expect(source).toContain("validateHelixAskAttachmentForSubmit");
    expect(source).toContain("typedAttachmentItems");
    expect(attachmentCommitSource).toContain("Image attachment is stale. Reattach the image before sending.");
    expect(attachmentCommitSource).toContain('raw_image_scope: hasImageBase64 ? "turn_input_only" : null');
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
    const textAttachmentSource = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/helix/ask-console/HelixAskTextAttachment.ts"),
      "utf8",
    );
    const attachmentPromptPolicySource = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/lib/helix/ask-attachment-prompt-policy.ts"),
      "utf8",
    );

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
    expect(source).toContain("buildHelixAskTextAttachmentTurnInputItem");
    expect(source).toContain("from \"@/components/helix/ask-console/HelixAskTextAttachment\"");
    expect(source).not.toContain("function buildHelixAskTextAttachmentFromText");
    expect(source).not.toContain("function buildHelixAskTextAttachmentTurnInputItem");
    expect(textAttachmentSource).toContain("pasted-text-");
    expect(textAttachmentSource).toContain('type: "attachment"');
    expect(textAttachmentSource).toContain('raw_content_scope: "turn_input_only"');
    expect(textAttachmentSource).toContain("assistant_answer: false");
    expect(source).toContain("promotedPastedTextTurnInputItems");
    expect(source).toContain("turnInputItems: promotedPastedTextTurnInputItems");
    expect(source).toContain("explicitTurnInputItemsForTurn");
    expect(source).toContain("latestPastedTextAttachmentRef");
    expect(source).toContain("hasSubmittedTextAttachment");
    expect(source).toContain("isHelixAskUsePastedTextAttachmentPrompt(first)");
    expect(source).toContain("from \"@/lib/helix/ask-attachment-prompt-policy\"");
    expect(attachmentPromptPolicySource).toContain("HELIX_ASK_USE_PASTED_TEXT_ATTACHMENT_PROMPT_PATTERN");
    expect(attachmentPromptPolicySource).toContain("memo|note|document");
    expect(source).toContain("Use the attached pasted text.");
    expect(source).toContain("The pasted text attachment is not available for this turn.");
  });

  it("keeps pasted text attachment prompts out of the visual-input classifier", () => {
    const source = fs.readFileSync(sourcePath, "utf8");
    const attachmentPromptPolicySource = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/lib/helix/ask-attachment-prompt-policy.ts"),
      "utf8",
    );

    expect(source).toContain("isHelixAskVisualPrompt(first)");
    expect(attachmentPromptPolicySource).toContain("HELIX_ASK_TEXT_ATTACHMENT_PROMPT_PATTERN");
    expect(attachmentPromptPolicySource).toContain("HELIX_ASK_TEXT_ATTACHMENT_PROMPT_PATTERN.test(normalized)");
    expect(attachmentPromptPolicySource).toContain("(?:text|memo|note|document)");
    expect(attachmentPromptPolicySource).toContain("return false;");
  });

  it("routes pasted-text resume recall through backend conversation memory instead of local shortcuts", () => {
    const source = fs.readFileSync(sourcePath, "utf8");
    const attachmentPromptPolicySource = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/lib/helix/ask-attachment-prompt-policy.ts"),
      "utf8",
    );
    const backendEntrypointPolicySource = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/helix/ask-console/HelixAskBackendEntrypointPolicy.ts"),
      "utf8",
    );

    expect(attachmentPromptPolicySource).toContain("HELIX_ASK_PASTED_TEXT_RESUME_RECALL_PROMPT_PATTERN");
    expect(attachmentPromptPolicySource).toContain("pasted\\s+(?:text|memo|note|document)");
    expect(attachmentPromptPolicySource).toContain("who|when|where");
    expect(source).toContain("isHelixAskPastedTextResumeRecallPrompt(trimmed)");
    expect(source).toContain("backendOwnedPastedTextResumeRecall");
    expect(source).toContain("buildHelixAskPastedTextResumeRecallRouteMetadata");
    expect(backendEntrypointPolicySource).toContain('source: "conversation_memory_recall"');
    expect(backendEntrypointPolicySource).toContain('target_source: "conversation_memory"');
    expect(backendEntrypointPolicySource).toContain('must_enter_backend_ask: true');
    expect(backendEntrypointPolicySource).toContain('allow_client_shortcut: false');
    expect(backendEntrypointPolicySource).toContain('suppressed_routes: ["conversation:simple", "model_only_concept", "workspace_diagnostic"]');
    expect(source).toContain("options?.bypassWorkstationDispatch === true || backendOwnedPastedTextResumeRecall");
    expect(source).toContain("const simpleConversationTurnLane =");
    expect(source).toContain("isSimpleConversationTurnCandidate(trimmed)");
    expect(source).toContain("!backendOwnedPastedTextResumeRecall &&");
    expect(source).toContain("routeMetadata: routeMetadataForTurn");
  });

  it("preserves backend-owned recall metadata across queued Ask turns", () => {
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain("type QueuedAskTurn =");
    expect(source).toContain("options?: RunAskOptions");
    expect(source).toContain("const [askQueue, setAskQueue] = useState<QueuedAskTurn[]>([])");
    expect(source).not.toContain("const [askQueue, setAskQueue] = useState<string[]>([])");
    expect(source).toContain("const contextCompactionPausePendingRef = useRef(false)");
    expect(source).toContain("const latestContextCompactionResumeFrameRef = useRef<Record<string, unknown> | null>(null)");
    expect(source).toContain("extractHelixAskContextCompactionResumeFrame,");
    expect(source).toContain("setContextCompactionPausePendingState(true)");
    expect(source).toContain("const extractedContextCompactionResumeFrame = extractHelixAskContextCompactionResumeFrame");
    expect(source).toContain("latestContextCompactionResumeFrameRef.current = extractedContextCompactionResumeFrame");
    expect(source).toContain("const latestContextCompactionResumeFrameForSubmit = compactionPausePending");
    expect(source).toContain("extractHelixAskContextCompactionResumeFrame(latestAskReply, latestAskReply?.debug)");
    expect(source).toContain("extractLatestHelixAskContextCompactionResumeFrameFromReplies,");
    expect(source).toContain("const askRepliesRef = useRef<HelixAskReply[]>([])");
    expect(source).toContain("askRepliesRef.current = askReplies");
    expect(source).toContain("extractLatestHelixAskContextCompactionResumeFrameFromReplies(askRepliesRef.current)");
    expect(source).toContain("extractLatestHelixAskContextCompactionResumeFrameFromReplies(askReplies)");
    expect(source).toContain("from \"@/components/helix/ask-console/HelixAskContextCompactionResumeFrameStorage\"");
    expect(source).toContain("writeStoredHelixAskContextCompactionResumeFrame(extractedContextCompactionResumeFrame)");
    expect(source).toContain("readStoredHelixAskContextCompactionResumeFrame()");
    expect(source).toContain("asksForPastedTextResumeFrame && latestContextCompactionResumeFrameForSubmit");
    expect(source).toContain("function buildQueuedAskTurn");
    expect(source).toContain("backendOwnedPastedTextResumeRecall");
    expect(source).toContain("context_resume_frame: args.contextResumeFrame");
    expect(source).toContain("contextResumeFrame: contextResumeFrameForQueuedTurn");
    expect(source).toContain(": baseRouteMetadata");
    expect(source).toContain("routeMetadata: baseRouteMetadata");
    expect(source).toContain("bypassWorkstationDispatch: true");
    expect(source).toContain("forceReasoningDispatch: true");
    expect(source).toContain("skipContextChooser: true");
    expect(source).toContain("turnId: \"queued:pasted_text_resume_recall\"");
    expect(source).toContain("void runAsk(next.question, next.capsuleIds");
    expect(source).toContain("...(next.options ?? {})");
    expect(source).toContain("buildQueuedAskTurn({");
    expect(source).toContain("isHelixAskContextCompactionPausePendingReply,");
    expect(source).not.toContain("function isHelixAskContextCompactionPausePendingReply");
    expect(source).toContain("contextCompactionPausePendingRef.current ||");
    expect(source).toContain("contextCompactionPausePending ||");
    expect(source).toContain("isHelixAskContextCompactionPausePendingReply(latestAskReply)");
    expect(source).toContain("askBusy,");
    expect(source).toContain("compactionPausePending,");
    expect(source).toContain("hasPastedTextResumeFrameForSubmit: Boolean(");
    expect(source).toContain("asksForPastedTextResumeFrame && latestContextCompactionResumeFrameForSubmit");
    expect(source).toContain("shouldReleaseConsumedPastedTextAttachmentForResume");
    expect(source).toContain("attachmentKinds: askAttachmentsRef.current.map((attachment) => attachment.kind)");
    expect(source).toContain("allEntriesArePastedTextResumeRecallPrompt: normalizedEntries.every((entry) =>");
    expect(source).toContain("clearAskAttachments()");
    expect(source).toContain('if (next.reason !== "compaction_pause") return');
    expect(source).toContain("setContextCompactionPausePendingState(false)");
    expect(source).toContain('reason: submitAdmission.queueReason ?? "busy"');
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
    expect(source).toContain("shouldPreserveAuthoritativeTerminalOverEvidenceGate({");
    expect(source).toContain("finalAnswerSource:");
  });
});
