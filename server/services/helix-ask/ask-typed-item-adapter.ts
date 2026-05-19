import crypto from "node:crypto";
import {
  HELIX_ASK_TYPED_ITEM_DEBUG_EXPORT_SCHEMA,
  HELIX_ASK_TYPED_ITEM_LIFECYCLE_EVENT_SCHEMA,
  HELIX_ASK_TYPED_ITEM_SCHEMA,
  type HelixAskTypedItem,
  type HelixAskTypedItemDebugExport,
  type HelixAskTypedItemKind,
  type HelixAskTypedItemLifecycleEvent,
  type HelixAskTypedItemLifecycleEventType,
  type HelixAskTypedItemStatus,
} from "@shared/helix-ask-typed-item";
import type {
  HelixThreadEvent,
  HelixThreadEventType,
  HelixThreadItem,
  HelixThreadItemStatus,
  HelixThreadItemType,
} from "../helix-thread/types";

const normalizeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .map((entry) => normalizeString(entry))
            .filter((entry) => entry.length > 0),
        ),
      )
    : [];

export const HELIX_THREAD_ITEM_TYPE_TO_ASK_ITEM_KIND = {
  userMessage: "user_message",
  classification: "classification",
  brief: "brief",
  plan: "plan",
  retrieval: "retrieval",
  toolObservation: "tool_observation",
  validation: "validation",
  answer: "agent_message",
  requestUserInput: "request_user_input",
  approval: "approval",
  commandExecution: "command_execution",
  dynamicToolCall: "dynamic_tool_call",
  review: "review",
  contextCompaction: "context_compaction",
} as const satisfies Record<HelixThreadItemType, HelixAskTypedItemKind>;

export const CODEX_ITEM_KIND_TO_HELIX_THREAD_ITEM_TYPE = {
  agent_message: "answer",
  reasoning: "validation",
  command_execution: "commandExecution",
  file_change: "toolObservation",
  mcp_tool_call: "dynamicToolCall",
  web_search: "retrieval",
  todo_list: "plan",
  error: "validation",
} as const satisfies Record<string, HelixThreadItemType>;

export const mapHelixThreadItemTypeToAskItemKind = (
  itemType: HelixThreadItemType,
): HelixAskTypedItemKind => HELIX_THREAD_ITEM_TYPE_TO_ASK_ITEM_KIND[itemType];

export const mapCodexItemKindToHelixThreadItemType = (
  itemKind: HelixAskTypedItemKind,
): HelixThreadItemType | null =>
  CODEX_ITEM_KIND_TO_HELIX_THREAD_ITEM_TYPE[
    itemKind as keyof typeof CODEX_ITEM_KIND_TO_HELIX_THREAD_ITEM_TYPE
  ] ?? null;

const mapThreadItemStatus = (
  status: HelixThreadItemStatus,
): HelixAskTypedItemStatus => {
  if (status === "in_progress") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  if (status === "declined") return "declined";
  return "cancelled";
};

const mapThreadEventType = (
  eventType: HelixThreadEventType,
): HelixAskTypedItemLifecycleEventType | null => {
  if (eventType === "thread_started") return "thread.started";
  if (eventType === "turn_started") return "turn.started";
  if (eventType === "item_started") return "item.started";
  if (eventType === "item_delta") return "item.updated";
  if (eventType === "item_completed") return "item.completed";
  if (eventType === "turn_completed") return "turn.completed";
  if (eventType === "turn_failed") return "turn.failed";
  return null;
};

const inferEvidenceRefs = (item: HelixThreadItem): string[] =>
  Array.from(
    new Set([
      ...normalizeStringArray(item.source_item_ids),
      ...normalizeStringArray(
        item.observation_ref && typeof item.observation_ref === "object"
          ? (item.observation_ref as Record<string, unknown>).evidence_refs
          : null,
      ),
      ...normalizeStringArray(
        item.meta && typeof item.meta === "object"
          ? (item.meta as Record<string, unknown>).evidence_refs
          : null,
      ),
    ]),
  );

export function toHelixAskTypedItem(input: {
  item: HelixThreadItem;
  terminalItemId?: string | null;
  terminalAssistantAnswer?: boolean;
  itemKind?: HelixAskTypedItemKind | null;
}): HelixAskTypedItem {
  const terminalItemId = normalizeString(input.terminalItemId);
  const isTerminalAnswer =
    input.terminalAssistantAnswer === true && terminalItemId === input.item.item_id;
  const itemKind =
    input.itemKind ??
    (isTerminalAnswer
      ? "terminal_assistant_answer"
      : mapHelixThreadItemTypeToAskItemKind(input.item.item_type));
  return validateHelixAskTypedItem({
    schema: HELIX_ASK_TYPED_ITEM_SCHEMA,
    thread_id: input.item.thread_id,
    turn_id: input.item.turn_id,
    situation_run_id:
      typeof input.item.meta?.situation_run_id === "string"
        ? input.item.meta.situation_run_id
        : null,
    item_id: input.item.item_id,
    item_kind: itemKind,
    status: mapThreadItemStatus(input.item.item_status),
    evidence_refs: inferEvidenceRefs(input.item),
    assistant_answer: isTerminalAnswer,
    raw_content_included: false,
    terminal_eligible:
      itemKind === "terminal_assistant_answer" || itemKind === "typed_failure",
    source_item_type: input.item.item_type,
    created_at: input.item.started_at,
    updated_at: input.item.updated_at,
  });
}

export function toHelixAskTypedItemLifecycleEvent(
  event: HelixThreadEvent,
): HelixAskTypedItemLifecycleEvent | null {
  const eventType = mapThreadEventType(event.event_type);
  if (!eventType) return null;
  const itemKind = event.item_type
    ? mapHelixThreadItemTypeToAskItemKind(event.item_type)
    : null;
  return {
    schema: HELIX_ASK_TYPED_ITEM_LIFECYCLE_EVENT_SCHEMA,
    event_id: event.event_id,
    event_type: eventType,
    thread_id: event.thread_id,
    turn_id: event.turn_id,
    item_id: event.item_id ?? null,
    item_kind: itemKind,
    status: event.item_status ? mapThreadItemStatus(event.item_status) : null,
    assistant_answer: false,
    raw_content_included: false,
    created_at: event.ts,
  };
}

export function makeHelixAskTypedItemLifecycleEvent(input: Omit<
  HelixAskTypedItemLifecycleEvent,
  "schema" | "event_id" | "assistant_answer" | "raw_content_included" | "created_at"
> & {
  event_id?: string;
  created_at?: string;
}): HelixAskTypedItemLifecycleEvent {
  return {
    schema: HELIX_ASK_TYPED_ITEM_LIFECYCLE_EVENT_SCHEMA,
    event_id: normalizeString(input.event_id) || `ask_item_event:${crypto.randomUUID()}`,
    event_type: input.event_type,
    thread_id: input.thread_id,
    turn_id: input.turn_id ?? null,
    item_id: input.item_id ?? null,
    item_kind: input.item_kind ?? null,
    status: input.status ?? null,
    assistant_answer: false,
    raw_content_included: false,
    created_at: input.created_at ?? new Date().toISOString(),
  };
}

export function validateHelixAskTypedItem(item: HelixAskTypedItem): HelixAskTypedItem {
  if (item.schema !== HELIX_ASK_TYPED_ITEM_SCHEMA) {
    throw new Error("helix_ask_typed_item_missing_schema");
  }
  if (!normalizeString(item.thread_id)) {
    throw new Error("helix_ask_typed_item_missing_thread_id");
  }
  if (!normalizeString(item.turn_id) && !normalizeString(item.situation_run_id)) {
    throw new Error("helix_ask_typed_item_missing_turn_or_situation_run");
  }
  if (!normalizeString(item.item_id)) {
    throw new Error("helix_ask_typed_item_missing_item_id");
  }
  if (!Array.isArray(item.evidence_refs)) {
    throw new Error("helix_ask_typed_item_missing_evidence_refs");
  }
  if (item.raw_content_included !== false) {
    throw new Error("helix_ask_typed_item_raw_content_forbidden");
  }
  if (item.assistant_answer === true && item.item_kind !== "terminal_assistant_answer") {
    throw new Error("helix_ask_typed_item_assistant_answer_not_terminal");
  }
  return item;
}

export function buildHelixAskTypedItemDebugExport(input: {
  threadId: string;
  turnId?: string | null;
  items: HelixAskTypedItem[];
  events?: HelixAskTypedItemLifecycleEvent[];
  terminalItemId?: string | null;
  createdAt?: string;
}): HelixAskTypedItemDebugExport {
  const items = input.items.map(validateHelixAskTypedItem);
  const assistantAnswerItems = items.filter((item) => item.assistant_answer === true);
  if (assistantAnswerItems.length > 1) {
    throw new Error("helix_ask_typed_item_multiple_terminal_answers");
  }
  const terminalItemId = normalizeString(input.terminalItemId);
  if (
    assistantAnswerItems.length === 1 &&
    terminalItemId &&
    assistantAnswerItems[0]?.item_id !== terminalItemId
  ) {
    throw new Error("helix_ask_typed_item_terminal_id_mismatch");
  }
  const events = (input.events ?? []).map((event) => {
    if (event.schema !== HELIX_ASK_TYPED_ITEM_LIFECYCLE_EVENT_SCHEMA) {
      throw new Error("helix_ask_typed_item_lifecycle_event_missing_schema");
    }
    if (event.assistant_answer !== false || event.raw_content_included !== false) {
      throw new Error("helix_ask_typed_item_lifecycle_event_authority_violation");
    }
    return event;
  });
  return {
    schema: HELIX_ASK_TYPED_ITEM_DEBUG_EXPORT_SCHEMA,
    thread_id: input.threadId,
    turn_id: input.turnId ?? null,
    items,
    events,
    terminal_item_id: assistantAnswerItems[0]?.item_id ?? (terminalItemId || null),
    assistant_answer_item_count: assistantAnswerItems.length,
    assistant_answer: false,
    raw_content_included: false,
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}
