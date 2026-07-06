import { describe, expect, it } from "vitest";
import {
  enrichTextToSpeechCandidateWithResolvedReferent,
  resolveHelixAskReadAloudReferent,
  synthesizeTextToSpeechCandidateFromResolvedReferent,
} from "../referent-resolution";

const bodyWithPreviousAnswer = (question: string): Record<string, unknown> => ({
  turn_id: "ask:test:referent",
  question,
  workspace_context_snapshot: {
    chat_referent_context: {
      schema: "helix.ask.chat_referent_context.v1",
      previous_assistant_final_answer: {
        role: "assistant",
        reply_id: "reply-1",
        source_ref: "chat.final_answer.previous:reply-1",
        text: "Navigation team is ready for the next burn window.",
        text_hash: "hash-prev",
      },
      previous_chat_message: {
        role: "assistant",
        message_id: "reply-1",
        source_ref: "chat.final_answer.previous:reply-1",
        text: "Navigation team is ready for the next burn window.",
      },
    },
  },
});

describe("Helix Ask read-aloud referent resolution", () => {
  it("resolves last statement aloud to the previous assistant final answer", () => {
    const resolution = resolveHelixAskReadAloudReferent(
      bodyWithPreviousAnswer("ok can you read the last statement outload?"),
    );

    expect(resolution.resolvedText).toBe("Navigation team is ready for the next burn window.");
    expect(resolution.trace).toMatchObject({
      requested_action: "text_to_speech.speak_text",
      referent_phrase: "previous_assistant_final_answer",
      source_kind: "chat_history",
      resolved_source_ref: "chat.final_answer.previous:reply-1",
      resolution_confidence: "high",
      tool_argument_source: "referent_resolution:chat_history",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });

  it("resolves the exact last-final-answer voice prompt to the previous assistant final answer", () => {
    const resolution = resolveHelixAskReadAloudReferent(
      bodyWithPreviousAnswer("ok read last final answer aloud"),
    );

    expect(resolution.resolvedText).toBe("Navigation team is ready for the next burn window.");
    expect(resolution.trace).toMatchObject({
      requested_action: "text_to_speech.speak_text",
      referent_phrase: "previous_assistant_final_answer",
      source_kind: "chat_history",
      resolved_source_ref: "chat.final_answer.previous:reply-1",
      resolution_confidence: "high",
      tool_argument_source: "referent_resolution:chat_history",
    });
  });

  it("fails closed for last-final-answer prompts when chat referent context is missing", () => {
    const resolution = resolveHelixAskReadAloudReferent({
      turn_id: "ask:test:referent-missing",
      question: "ok read last final answer aloud",
      workspace_context_snapshot: {},
    });

    expect(resolution.resolvedText).toBeNull();
    expect(resolution.trace).toMatchObject({
      requested_action: "text_to_speech.speak_text",
      referent_phrase: "previous_assistant_final_answer",
      source_kind: "chat_history",
      resolution_confidence: "blocked",
      resolution_block_reason: "referent_resolution_required:missing_previous_assistant_final_answer",
      tool_argument_source: "referent_resolution:blocked",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });

  it("overrides a bad model TTS argument when the prompt explicitly names the last answer", () => {
    const enriched = enrichTextToSpeechCandidateWithResolvedReferent(
      bodyWithPreviousAnswer("read the last answer aloud"),
      {
        capability: "text_to_speech.speak_text",
        text: "Abstract",
      },
    );

    expect(enriched).toMatchObject({
      capability: "text_to_speech.speak_text",
      text: "Navigation team is ready for the next burn window.",
      source_observation_ref: "chat.final_answer.previous:reply-1",
      tool_argument_source: "referent_resolution:chat_history",
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(enriched.referent_resolution_trace).toMatchObject({
      source_kind: "chat_history",
      raw_content_included: false,
    });
  });

  it("synthesizes a TTS candidate for resolved prior-answer prompts", () => {
    const candidate = synthesizeTextToSpeechCandidateFromResolvedReferent(
      bodyWithPreviousAnswer("please read your previous response out loud"),
    );

    expect(candidate).toMatchObject({
      capability: "text_to_speech.speak_text",
      text: "Navigation team is ready for the next burn window.",
      source_observation_ref: "chat.final_answer.previous:reply-1",
      voice_playback_kind: "narrator_read",
      assistant_answer: false,
      terminal_eligible: false,
    });
  });

  it("resolves last message aloud through the deterministic previous chat message policy", () => {
    const resolution = resolveHelixAskReadAloudReferent(
      bodyWithPreviousAnswer("read the last message aloud"),
    );

    expect(resolution.resolvedText).toBe("Navigation team is ready for the next burn window.");
    expect(resolution.trace).toMatchObject({
      referent_phrase: "previous_chat_message",
      source_kind: "chat_history",
      resolved_source_ref: "chat.final_answer.previous:reply-1",
      resolution_confidence: "high",
      tool_argument_source: "referent_resolution:chat_history",
    });
  });

  it("does not resolve selected text or abstract as chat history without explicit chat referent", () => {
    expect(resolveHelixAskReadAloudReferent(bodyWithPreviousAnswer("read the selected text aloud")).trace).toMatchObject({
      source_kind: "selected_text",
      resolution_confidence: "medium",
      tool_argument_source: "referent_resolution:explicit_selected_surface",
    });
    expect(resolveHelixAskReadAloudReferent(bodyWithPreviousAnswer("read the abstract aloud")).trace).toMatchObject({
      source_kind: "active_document_named_section",
      resolution_confidence: "medium",
      tool_argument_source: "referent_resolution:explicit_document_section",
    });
  });

  it("blocks ambiguous deictic read-aloud candidates instead of speaking guessed visible text", () => {
    const enriched = enrichTextToSpeechCandidateWithResolvedReferent(
      bodyWithPreviousAnswer("read that aloud"),
      {
        capability: "text_to_speech.speak_text",
        text: "Abstract",
      },
    );

    expect(enriched).toMatchObject({
      capability: "text_to_speech.speak_text",
      text: "",
      tool_argument_source: "referent_resolution:blocked",
    });
    expect(enriched.referent_resolution_trace).toMatchObject({
      source_kind: "ambiguous",
      resolution_confidence: "blocked",
      resolution_block_reason: "referent_resolution_required:ambiguous_deictic_read_aloud",
    });
  });
});
