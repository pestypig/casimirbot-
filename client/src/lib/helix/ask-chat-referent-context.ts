import { stableHelixProjectionHash } from "@/lib/helix/ask-stable-hash";

export type HelixAskChatReferentReplyLike = {
  id?: string | null;
  turn_id?: string | null;
  selected_final_answer?: string | null;
  content?: string | null;
  text?: string | null;
  assistant_answer?: string | null;
  debug?: unknown;
};

export type HelixAskChatReferentContextSource = {
  source_name: string;
  replies: readonly HelixAskChatReferentReplyLike[];
};

export type HelixAskChatReferentContextBuildResult = {
  context: Record<string, unknown> | null;
  source_summary: {
    schema: "helix.ask.chat_referent_context_source_summary.v1";
    source_count: number;
    total_reply_count: number;
    readable_reply_count: number;
    selected_source_name: string | null;
    context_present: boolean;
    assistant_answer: false;
    terminal_eligible: false;
    raw_content_included: false;
  };
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readNestedString = (record: Record<string, unknown> | null, key: string): string | null => {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export function readHelixAskReplyFinalAnswerText(
  reply: HelixAskChatReferentReplyLike | null | undefined,
): string | null {
  if (!reply) return null;
  const replyRecord = reply as unknown as Record<string, unknown>;
  const debugRecord = readRecord(reply.debug);
  const candidates = [
    reply.selected_final_answer,
    readNestedString(debugRecord, "selected_final_answer"),
    readNestedString(replyRecord, "finalAnswer"),
    reply.content,
    reply.text,
    reply.assistant_answer,
  ];
  for (const candidate of candidates) {
    const text = typeof candidate === "string" ? candidate.trim() : "";
    if (text) return text.slice(0, 8000);
  }
  return null;
}

export function buildHelixAskChatReferentContext(
  replies: readonly HelixAskChatReferentReplyLike[],
): Record<string, unknown> | null {
  const previousReply =
    [...replies].reverse().find((reply) => Boolean(readHelixAskReplyFinalAnswerText(reply))) ?? null;
  const previousAnswer = readHelixAskReplyFinalAnswerText(previousReply);
  if (!previousReply || !previousAnswer) return null;
  const replyId = previousReply.turn_id || previousReply.id || `reply:${stableHelixProjectionHash(previousAnswer)}`;
  const sourceRef = `chat.final_answer.previous:${replyId}`;
  return {
    schema: "helix.ask.chat_referent_context.v1",
    previous_assistant_final_answer: {
      role: "assistant",
      reply_id: replyId,
      source_ref: sourceRef,
      text: previousAnswer,
      text_hash: stableHelixProjectionHash(previousAnswer),
      source_role: "previous_terminal_assistant_answer",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    previous_chat_message: {
      role: "assistant",
      message_id: replyId,
      source_ref: sourceRef,
      text: previousAnswer,
      text_hash: stableHelixProjectionHash(previousAnswer),
      source_role: "previous_terminal_assistant_answer",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
}

export function buildHelixAskChatReferentContextFromSources(
  sources: readonly HelixAskChatReferentContextSource[],
): HelixAskChatReferentContextBuildResult {
  const orderedEntries = sources.flatMap((source) =>
    source.replies.map((reply) => ({
      sourceName: source.source_name,
      reply,
      text: readHelixAskReplyFinalAnswerText(reply),
    })),
  );
  const selectedEntry = [...orderedEntries].reverse().find((entry) => Boolean(entry.text)) ?? null;
  const context = selectedEntry ? buildHelixAskChatReferentContext([selectedEntry.reply]) : null;
  return {
    context,
    source_summary: {
      schema: "helix.ask.chat_referent_context_source_summary.v1",
      source_count: sources.length,
      total_reply_count: orderedEntries.length,
      readable_reply_count: orderedEntries.filter((entry) => Boolean(entry.text)).length,
      selected_source_name: selectedEntry?.sourceName ?? null,
      context_present: Boolean(context),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
  };
}
