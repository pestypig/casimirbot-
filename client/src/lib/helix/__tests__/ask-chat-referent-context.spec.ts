import { describe, expect, it } from "vitest";

import {
  buildHelixAskChatReferentContext,
  buildHelixAskChatReferentContextFromSources,
  readHelixAskReplyFinalAnswerText,
} from "@/lib/helix/ask-chat-referent-context";

describe("Helix Ask chat referent context", () => {
  it("selects the latest previous terminal answer as an observation-only referent", () => {
    const context = buildHelixAskChatReferentContext([
      {
        id: "reply-old",
        content: "Older answer.",
      },
      {
        id: "reply-latest",
        turn_id: "turn-latest",
        content: "Rendered fallback text.",
        selected_final_answer: "Navigation team is ready for the next burn window.",
      },
    ]);

    expect(context).toMatchObject({
      schema: "helix.ask.chat_referent_context.v1",
      previous_assistant_final_answer: {
        role: "assistant",
        reply_id: "turn-latest",
        source_ref: "chat.final_answer.previous:turn-latest",
        text: "Navigation team is ready for the next burn window.",
        source_role: "previous_terminal_assistant_answer",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      previous_chat_message: {
        role: "assistant",
        message_id: "turn-latest",
        source_ref: "chat.final_answer.previous:turn-latest",
        text: "Navigation team is ready for the next burn window.",
        source_role: "previous_terminal_assistant_answer",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });

  it("can read final answer text from selected answer, debug mirror, or rendered content", () => {
    expect(readHelixAskReplyFinalAnswerText({
      id: "reply-selected",
      content: "fallback",
      selected_final_answer: "Selected final answer.",
    })).toBe("Selected final answer.");

    expect(readHelixAskReplyFinalAnswerText({
      id: "reply-debug",
      content: "fallback",
      debug: { selected_final_answer: "Debug final answer." },
    })).toBe("Debug final answer.");

    expect(readHelixAskReplyFinalAnswerText({
      id: "reply-content",
      content: "Rendered final answer.",
    })).toBe("Rendered final answer.");
  });

  it("falls back to durable chat session replies when the visible transcript has no previous reply", () => {
    const result = buildHelixAskChatReferentContextFromSources([
      {
        source_name: "durable_chat_session",
        replies: [
          {
            id: "durable-reply",
            content: "Durable previous answer.",
          },
        ],
      },
      {
        source_name: "visible_ask_transcript",
        replies: [],
      },
    ]);

    expect(result.source_summary).toMatchObject({
      schema: "helix.ask.chat_referent_context_source_summary.v1",
      source_count: 2,
      total_reply_count: 1,
      readable_reply_count: 1,
      selected_source_name: "durable_chat_session",
      context_present: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(result.context).toMatchObject({
      previous_chat_message: {
        message_id: "durable-reply",
        text: "Durable previous answer.",
      },
    });
  });
});
