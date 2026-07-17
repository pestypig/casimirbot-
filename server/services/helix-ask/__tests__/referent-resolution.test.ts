import { describe, expect, it } from "vitest";
import {
  conversationalReferentCannotSupplyRequestedEvidence,
  conversationalReferentHasExplicitTopicFallback,
  enrichTextToSpeechCandidateWithResolvedReferent,
  resolveHelixAskConversationalReferent,
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

const bodyWithRecentAnswers = (
  question: string,
  answers: Array<{ id: string; text: string }>,
): Record<string, unknown> => {
  const [latest, ...older] = answers;
  return {
    turn_id: "ask:test:recent-referents",
    question,
    workspace_context_snapshot: {
      chat_referent_context: {
        schema: "helix.ask.chat_referent_context.v1",
        previous_assistant_final_answer: latest
          ? {
              role: "assistant",
              reply_id: latest.id,
              source_ref: `chat.final_answer.previous:${latest.id}`,
              text: latest.text,
            }
          : undefined,
        recent_assistant_final_answers: [latest, ...older]
          .filter((answer): answer is { id: string; text: string } => Boolean(answer))
          .map((answer) => ({
            role: "assistant",
            reply_id: answer.id,
            source_ref: `chat.final_answer.recent:${answer.id}`,
            text: answer.text,
          })),
      },
    },
  };
};

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

describe("Helix Ask conversational referent resolution", () => {
  it("classifies a retained failure-only answer as unable to supply requested evidence", () => {
    const body = bodyWithPreviousAnswer(
      "Find scholarly references supporting the scientific claims we just discussed.",
    );
    const context = (body.workspace_context_snapshot as Record<string, unknown>)
      .chat_referent_context as Record<string, unknown>;
    (context.previous_assistant_final_answer as Record<string, unknown>).text =
      "I could not complete that turn. Cause: terminal_authority_missing.";

    expect(conversationalReferentCannotSupplyRequestedEvidence(body)).toBe(true);
    expect(conversationalReferentHasExplicitTopicFallback(body)).toBe(false);
  });

  it("classifies an explicit retained no-claims answer as unable to supply requested evidence", () => {
    const body = bodyWithPreviousAnswer(
      "Find scholarly references supporting the scientific claims we just discussed.",
    );
    const context = (body.workspace_context_snapshot as Record<string, unknown>)
      .chat_referent_context as Record<string, unknown>;
    (context.previous_assistant_final_answer as Record<string, unknown>).text =
      "The immediately previous answer contained no scientific claims. It only reported a terminal-authority failure.";

    expect(conversationalReferentCannotSupplyRequestedEvidence(body)).toBe(true);
  });

  it("keeps a retained scientific answer eligible for scholarly evidence retrieval", () => {
    const body = bodyWithPreviousAnswer(
      "Find scholarly references supporting the scientific claims we just discussed.",
    );
    const context = (body.workspace_context_snapshot as Record<string, unknown>)
      .chat_referent_context as Record<string, unknown>;
    (context.previous_assistant_final_answer as Record<string, unknown>).text =
      "Quantum inequalities constrain the duration and magnitude of negative energy densities.";

    expect(conversationalReferentCannotSupplyRequestedEvidence(body)).toBe(false);
  });

  it("resolves the two causes just described to the previous assistant answer", () => {
    const resolution = resolveHelixAskConversationalReferent(
      bodyWithPreviousAnswer(
        "Based on those two failure causes you just described, explain which one blocked the answer.",
      ),
    );

    expect(resolution.resolvedText).toBe("Navigation team is ready for the next burn window.");
    expect(resolution.trace).toMatchObject({
      schema: "helix.ask.conversational_referent_resolution.v1",
      referent_detected: true,
      referent_phrase: "deictic_previous_assistant_answer",
      source_kind: "chat_history",
      resolved_source_ref: "chat.final_answer.previous:reply-1",
      resolution_confidence: "high",
      context_role: "evidence_for_followup_reasoning",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });

  it("fails closed when a conversational referent has no previous assistant answer", () => {
    const resolution = resolveHelixAskConversationalReferent({
      turn_id: "ask:test:conversational-referent-missing",
      question: "Can you expand on what you just said?",
      workspace_context_snapshot: {},
    });

    expect(resolution.resolvedText).toBeNull();
    expect(resolution.trace).toMatchObject({
      referent_detected: true,
      referent_phrase: "deictic_previous_assistant_answer",
      source_kind: "chat_history",
      resolution_confidence: "blocked",
      resolution_block_reason: "referent_resolution_required:missing_previous_assistant_final_answer",
    });
  });

  it.each([
    "Reflect this with the Theory Badge Graph.",
    "reflect this in theory badge graph?",
    "can you reflect this in theory badge graph?",
    "Can you please reflect that through the Theory Badge Graph?",
    "Okay, please reflect that using the theory badge graph.",
    "Use the Theory Badge Graph to reflect this.",
  ])("resolves an affirmative theory-graph imperative to the previous assistant answer: %s", (question) => {
    const resolution = resolveHelixAskConversationalReferent(bodyWithPreviousAnswer(question));

    expect(resolution.resolvedText).toBe("Navigation team is ready for the next burn window.");
    expect(resolution.trace).toMatchObject({
      referent_detected: true,
      referent_phrase: "deictic_previous_assistant_answer",
      source_kind: "chat_history",
      resolved_source_ref: "chat.final_answer.previous:reply-1",
      resolution_confidence: "high",
      selection_policy: "latest_answer",
      context_role: "evidence_for_followup_reasoning",
    });
  });

  it("fails closed for an affirmative theory-graph imperative when the previous answer is missing", () => {
    const resolution = resolveHelixAskConversationalReferent({
      turn_id: "ask:test:theory-referent-missing",
      question: "Reflect this with the Theory Badge Graph.",
      workspace_context_snapshot: {},
    });

    expect(resolution.resolvedText).toBeNull();
    expect(resolution.trace).toMatchObject({
      referent_detected: true,
      referent_phrase: "deictic_previous_assistant_answer",
      source_kind: "chat_history",
      resolution_confidence: "blocked",
      resolution_block_reason: "referent_resolution_required:missing_previous_assistant_final_answer",
    });
  });

  it("skips a failed theory-reflection answer and selects the earlier substantive answer on retry", () => {
    const resolution = resolveHelixAskConversationalReferent(
      bodyWithRecentAnswers(
        "Reflect this with the Theory Badge Graph.",
        [
          {
            id: "failed-theory-reflection",
            text: [
              "The Theory Badge Graph could not resolve ‘this’ to the preceding discussion.",
              "It found no exact or likely badge matches, so no supported graph path was produced.",
            ].join(" "),
          },
          {
            id: "substantive-determinism",
            text: "Deterministic microscopic laws can produce probabilistic macroscopic observations through coarse-graining, hidden detail, and chaotic sensitivity.",
          },
        ],
      ),
    );

    expect(resolution.resolvedText).toContain("Deterministic microscopic laws");
    expect(resolution.trace).toMatchObject({
      resolved_source_ref: "chat.final_answer.recent:substantive-determinism",
      candidate_count: 2,
      matched_candidate_count: 1,
      selection_policy: "latest_substantive_answer",
      resolution_confidence: "high",
    });
  });

  it("fails closed when a theory-reflection retry has only non-substantive failure history", () => {
    const resolution = resolveHelixAskConversationalReferent(
      bodyWithRecentAnswers(
        "Reflect this with the Theory Badge Graph.",
        [
          {
            id: "failed-theory-reflection",
            text: "The Theory Badge Graph could not resolve this and found no exact or likely badge matches.",
          },
        ],
      ),
    );

    expect(resolution.resolvedText).toBeNull();
    expect(resolution.trace).toMatchObject({
      resolution_confidence: "blocked",
      resolution_block_reason: "referent_resolution_required:no_substantive_previous_assistant_final_answer",
      candidate_count: 1,
      matched_candidate_count: 0,
      selection_policy: "blocked_non_substantive_history",
    });
  });

  it.each([
    "Do not reflect this with the Theory Badge Graph.",
    "Do not reflect this in the Theory Badge Graph.",
    "If we need it later, reflect this with the Theory Badge Graph.",
    "If we need it later, can you reflect this in the Theory Badge Graph?",
    "Would you reflect this with the Theory Badge Graph?",
    "The documentation says to reflect this with the Theory Badge Graph.",
    "I previously asked whether you can reflect this in the Theory Badge Graph.",
    'The screen displays "Reflect this with the Theory Badge Graph." Explain that example.',
    'The screen displays "can you reflect this in theory badge graph?" Explain that example.',
    "I previously asked you to reflect this with the Theory Badge Graph.",
  ])("does not admit non-affirmative theory-graph referent text: %s", (question) => {
    const resolution = resolveHelixAskConversationalReferent(bodyWithPreviousAnswer(question));

    expect(resolution.resolvedText).toBeNull();
    expect(resolution.trace).toMatchObject({
      referent_detected: false,
      resolution_confidence: "not_applicable",
    });
  });

  it("resolves scientific claims just discussed for scholarly follow-up reasoning", () => {
    const resolution = resolveHelixAskConversationalReferent(
      bodyWithPreviousAnswer(
        "Find scholarly references supporting the scientific claims we just discussed.",
      ),
    );

    expect(resolution.resolvedText).toBe("Navigation team is ready for the next burn window.");
    expect(resolution.trace).toMatchObject({
      referent_detected: true,
      referent_phrase: "deictic_previous_assistant_answer",
      source_kind: "chat_history",
      resolution_confidence: "high",
      context_role: "evidence_for_followup_reasoning",
    });
  });

  it("uses an explicit topic to select the newest matching recent answer instead of an unrelated latest answer", () => {
    const resolution = resolveHelixAskConversationalReferent(
      bodyWithRecentAnswers(
        "Find scholarly references supporting the quantum-inequality claims we discussed.",
        [
          {
            id: "failed-quantum-retrieval",
            text: "I can’t honestly produce a quantum-inequality claim-to-citation map because the conversational referent was incorrectly resolved.",
          },
          {
            id: "runtime",
            text: "Runtime verification can switch a neural-network controller to a safe backup.",
          },
          {
            id: "quantum",
            text: "Quantum inequalities bound sampled negative energy and impose duration-magnitude limits.",
          },
        ],
      ),
    );

    expect(resolution.resolvedText).toContain("Quantum inequalities");
    expect(resolution.trace).toMatchObject({
      resolved_source_ref: "chat.final_answer.recent:quantum",
      resolution_confidence: "high",
      explicit_topic_phrase: "quantum-inequality",
      explicit_topic_terms: ["quantum", "inequality"],
      candidate_count: 3,
      matched_candidate_count: 1,
      selection_policy: "explicit_topic_match",
    });
  });

  it("skips a topic-naming research failure that disclaims support and selects an older substantive answer", () => {
    const resolution = resolveHelixAskConversationalReferent(
      bodyWithRecentAnswers(
        "Find scholarly references supporting the quantum-inequality claims we discussed.",
        [
          {
            id: "failed-quantum-support",
            text: [
              "Quantum inequality was the intended research topic, but the retrieved papers were unrelated.",
              "I therefore cannot honestly present these results as support for the claims you meant.",
            ].join(" "),
          },
          {
            id: "quantum-substantive",
            text: "Quantum inequalities bound sampled negative energy and impose duration-magnitude limits.",
          },
        ],
      ),
    );

    expect(resolution.resolvedText).toContain("bound sampled negative energy");
    expect(resolution.trace).toMatchObject({
      resolved_source_ref: "chat.final_answer.recent:quantum-substantive",
      matched_candidate_count: 1,
      selection_policy: "explicit_topic_match",
    });
  });

  it("fails closed when an explicit topic matches none of the retained answers", () => {
    const body = bodyWithRecentAnswers(
      "Find scholarly references supporting the quantum-inequality claims we discussed.",
      [
        {
          id: "runtime",
          text: "Runtime verification can switch a neural-network controller to a safe backup.",
        },
      ],
    );
    const resolution = resolveHelixAskConversationalReferent(body);

    expect(resolution.resolvedText).toBeNull();
    expect(resolution.trace).toMatchObject({
      resolution_confidence: "blocked",
      resolution_block_reason: "referent_resolution_required:explicit_topic_mismatch",
      explicit_topic_terms: ["quantum", "inequality"],
      candidate_count: 1,
      matched_candidate_count: 0,
      selection_policy: "blocked_topic_mismatch",
    });
    expect(conversationalReferentCannotSupplyRequestedEvidence(body)).toBe(true);
    expect(conversationalReferentHasExplicitTopicFallback(body)).toBe(true);
  });

  it.each([
    "Find scholarly references supporting the scientific claims in your immediately previous answer.",
    "Find papers supporting the physics claims from the previous response.",
    "Map the research points of the prior assistant answer to citations.",
  ])("resolves scientific claims carried by a previous-answer phrase: %s", (question) => {
    const resolution = resolveHelixAskConversationalReferent(bodyWithPreviousAnswer(question));

    expect(resolution.resolvedText).toBe("Navigation team is ready for the next burn window.");
    expect(resolution.trace).toMatchObject({
      referent_detected: true,
      source_kind: "chat_history",
      resolution_confidence: "high",
      context_role: "evidence_for_followup_reasoning",
    });
  });

  it.each([
    'The screen says "based on those two causes you just described"; explain this sentence generally.',
    "Do not use the previous answer; explain the concept generally.",
    "Ignore what we just discussed and search for an explicitly named topic instead.",
    "If I later say based on that, you could continue the explanation.",
    'The UI example says "find papers for the scientific claims we just discussed." Explain the example.',
  ])("does not admit contextual, negated, or future-only referent text: %s", (question) => {
    const resolution = resolveHelixAskConversationalReferent(bodyWithPreviousAnswer(question));

    expect(resolution.resolvedText).toBeNull();
    expect(resolution.trace.resolution_confidence).toBe("not_applicable");
  });

  it("ignores quoted screen text but resolves a separate affirmative follow-up", () => {
    const resolution = resolveHelixAskConversationalReferent(
      bodyWithPreviousAnswer(
        'The screen says "use the previous answer." Based on those two causes you just described, compare them.',
      ),
    );

    expect(resolution.resolvedText).toBe("Navigation team is ready for the next burn window.");
    expect(resolution.trace.resolution_confidence).toBe("high");
  });
});
