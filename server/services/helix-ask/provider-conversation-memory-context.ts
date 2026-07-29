import crypto from "node:crypto";
import type { HelixConversationMemoryPacket } from "@shared/helix-conversation-memory-packet";
import { buildHelixThreadState } from "../helix-thread/reducer";
import { readHelixSharedRoomIdFromAskSession } from "./shared-room-ask-session";
import {
  readDurableEnvironmentProbeContinuationEvidence,
  type DurableEnvironmentProbeContinuationEvidence,
} from "../environment-connectors/probe/durable-broker";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map(readString)
        .filter((entry): entry is string => Boolean(entry))
    : [];

const shortTextHash = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex").slice(0, 16);

const existingChatReferentText = (
  workspace: Record<string, unknown> | null,
): string | null => {
  const context = readRecord(
    workspace?.chat_referent_context ?? workspace?.chatReferentContext,
  );
  const previous = readRecord(
    context?.previous_assistant_final_answer ??
      context?.previousAssistantFinalAnswer,
  );
  return readString(previous?.text);
};

/**
 * Projects the already-admitted current-thread memory packet onto the same
 * bounded chat-referent surface used by the workstation client.
 *
 * This does not grant prior tool receipts answer authority. It only makes a
 * prior authoritative assistant answer available as quoted conversation
 * context for follow-up reasoning. A fresher client projection wins.
 */
export const attachProviderConversationMemoryReferentContext = (input: {
  body: Record<string, unknown>;
  packet: HelixConversationMemoryPacket;
}): Record<string, unknown> => {
  const workspace = readRecord(
    input.body.workspace_context_snapshot ??
      input.body.workspaceContextSnapshot,
  );
  if (existingChatReferentText(workspace)) {
    return input.body;
  }
  const previousText = readString(input.packet.latest_answer_summary);
  if (
    !previousText ||
    input.packet.allowed_for_current_goal !== true ||
    input.packet.allowed_use === "blocked"
  ) {
    return input.body;
  }
  const priorTurnId =
    input.packet.resolved_references.at(-1)?.refers_to_turn_id ??
    `hash:${shortTextHash(previousText)}`;
  const previousRef = `helix.thread.answer:${priorTurnId}`;
  const recentTexts = [
    ...input.packet.recent_assistant_answers.slice().reverse(),
    previousText,
  ].filter((text, index, entries) => text && entries.indexOf(text) === index);
  const recentAnswers = recentTexts.slice(0, 6).map((text, index) => {
    const textHash = shortTextHash(text);
    return {
      role: "assistant",
      reply_id: `thread-answer:${textHash}`,
      source_ref:
        index === 0 ? previousRef : `helix.thread.answer:recent:${textHash}`,
      text,
      text_hash: textHash,
      source_role: "recent_terminal_assistant_answer_candidate",
      recency_rank: index,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  });
  const previousTextHash = shortTextHash(previousText);
  const previousAnswer = {
    role: "assistant",
    reply_id: `thread-answer:${previousTextHash}`,
    source_ref: previousRef,
    text: previousText,
    text_hash: previousTextHash,
    source_role: "previous_terminal_assistant_answer",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const nextWorkspace: Record<string, unknown> = {
    ...(workspace ?? {}),
    chat_referent_context: {
      schema: "helix.ask.chat_referent_context.v1",
      previous_assistant_final_answer: previousAnswer,
      previous_chat_message: {
        ...previousAnswer,
        message_id: previousAnswer.reply_id,
      },
      recent_assistant_final_answers: recentAnswers,
      topic_retained_candidate_count: 0,
      explicit_topic_terms: [],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    chat_referent_context_source_summary: {
      schema: "helix.ask.chat_referent_context_source_summary.v1",
      source_count: 1,
      total_reply_count: input.packet.recent_assistant_answers.length,
      readable_reply_count: input.packet.recent_assistant_answers.length,
      retained_candidate_count: recentAnswers.length,
      topic_retained_candidate_count: 0,
      explicit_topic_term_count: 0,
      selected_source_name: "helix_thread_ledger",
      context_present: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
  };
  return {
    ...input.body,
    workspace_context_snapshot: nextWorkspace,
  };
};

export type ProviderConversationMemoryEnvironmentEvidence = {
  prior_artifact_ref: string;
  thread_item_id: string;
  evidence: DurableEnvironmentProbeContinuationEvidence;
};

export type ProviderConversationMemoryEnvironmentEvidenceResolution = {
  schema: "helix.provider_conversation_memory_environment_evidence_resolution.v1";
  thread_id: string;
  current_turn_id: string;
  room_id: string | null;
  requested_artifact_refs: string[];
  resolved: ProviderConversationMemoryEnvironmentEvidence[];
  rejected: Array<{
    artifact_ref: string;
    reason:
      | "thread_locator_missing"
      | "thread_locator_incomplete"
      | "durable_evidence_unavailable";
  }>;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

type EnvironmentEvidenceReader =
  typeof readDurableEnvironmentProbeContinuationEvidence;

/**
 * Rehydrates only environment observations that were both selected by a prior
 * authoritative terminal and retained as opaque locators in this exact thread.
 * The durable broker rechecks turn, room, capability, binding, provenance, and
 * freshness before any normalized observation is returned to the provider.
 */
export const resolveProviderConversationMemoryEnvironmentEvidence = async (
  input: {
    packet: HelixConversationMemoryPacket | null | undefined;
    currentTurnId: string;
    maxAgeMs?: number;
    readEvidence?: EnvironmentEvidenceReader;
  },
): Promise<ProviderConversationMemoryEnvironmentEvidenceResolution> => {
  const packet = input.packet;
  const threadId = packet?.thread_id?.trim() ?? "";
  const currentTurnId = input.currentTurnId.trim();
  const roomId = readHelixSharedRoomIdFromAskSession(threadId);
  const requestedArtifactRefs =
    packet?.allowed_for_current_goal === true &&
    packet.allowed_use === "reuse_prior_evidence_refs" &&
    packet.current_turn_id === currentTurnId
      ? Array.from(new Set(readStringArray(packet.reusable_evidence_refs))).slice(
          0,
          8,
        )
      : [];
  const base = {
    schema:
      "helix.provider_conversation_memory_environment_evidence_resolution.v1" as const,
    thread_id: threadId,
    current_turn_id: currentTurnId,
    room_id: roomId,
    requested_artifact_refs: requestedArtifactRefs,
    terminal_eligible: false as const,
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
  if (!threadId || !currentTurnId || !roomId || requestedArtifactRefs.length === 0) {
    return { ...base, resolved: [], rejected: [] };
  }

  const requestedSet = new Set(requestedArtifactRefs);
  const threadState = buildHelixThreadState({ threadId });
  const locatorByArtifactRef = new Map<
    string,
    {
      threadItemId: string;
      priorTurnId: string;
      probeRequestRef: string;
      capabilityId: string;
    }
  >();
  for (const item of threadState.items) {
    if (
      item.item_type !== "toolObservation" ||
      item.item_status !== "completed" ||
      item.turn_id === currentTurnId
    ) {
      continue;
    }
    const observationRef = readRecord(item.observation_ref);
    const artifactRef = readString(observationRef?.artifact_ref);
    if (!artifactRef || !requestedSet.has(artifactRef)) continue;
    const probeRequestRef = readString(
      observationRef?.environment_probe_request_ref,
    );
    const capabilityId = readString(observationRef?.capability_id);
    if (!probeRequestRef || !capabilityId) continue;
    locatorByArtifactRef.set(artifactRef, {
      threadItemId: item.item_id,
      priorTurnId: item.turn_id,
      probeRequestRef,
      capabilityId,
    });
  }

  const readEvidence =
    input.readEvidence ?? readDurableEnvironmentProbeContinuationEvidence;
  const resolved: ProviderConversationMemoryEnvironmentEvidence[] = [];
  const rejected: ProviderConversationMemoryEnvironmentEvidenceResolution["rejected"] =
    [];
  for (const artifactRef of requestedArtifactRefs) {
    const locator = locatorByArtifactRef.get(artifactRef);
    if (!locator) {
      const hasThreadItem = threadState.items.some(
        (item) =>
          readString(readRecord(item.observation_ref)?.artifact_ref) ===
          artifactRef,
      );
      rejected.push({
        artifact_ref: artifactRef,
        reason: hasThreadItem
          ? "thread_locator_incomplete"
          : "thread_locator_missing",
      });
      continue;
    }
    const evidence = await readEvidence({
      requestId: locator.probeRequestRef,
      expectedPriorTurnId: locator.priorTurnId,
      expectedRoomId: roomId,
      expectedCapabilityId: locator.capabilityId,
      maxAgeMs: input.maxAgeMs,
    });
    if (!evidence) {
      rejected.push({
        artifact_ref: artifactRef,
        reason: "durable_evidence_unavailable",
      });
      continue;
    }
    resolved.push({
      prior_artifact_ref: artifactRef,
      thread_item_id: locator.threadItemId,
      evidence,
    });
  }
  return { ...base, resolved, rejected };
};
