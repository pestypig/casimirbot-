import { getHelixThreadLedgerEvents } from "./ledger";
import { readHelixThread } from "./registry";
import {
  type HelixThreadCitationView,
  type HelixThreadEvent,
  type HelixThreadExecutionView,
  type HelixThreadItem,
  type HelixThreadMemoryCitation,
  type HelixThreadServerRequest,
  type HelixThreadState,
  type HelixThreadTurn,
  type HelixThreadTurnState,
} from "./types";

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const clipHistoryText = (value: unknown, limit = 1200): string | null => {
  const normalized = normalizeOptionalString(value)?.replace(/\s+/g, " ") ?? "";
  if (!normalized) return null;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const sortBySequence = (events: HelixThreadEvent[]): HelixThreadEvent[] =>
  events
    .slice()
    .sort(
      (a, b) =>
        a.seq - b.seq ||
        a.ts.localeCompare(b.ts) ||
        a.event_id.localeCompare(b.event_id),
    );

const reduceItemStates = (events: HelixThreadEvent[]): HelixThreadItem[] => {
  const byItemId = new Map<string, HelixThreadItem>();
  for (const event of sortBySequence(events)) {
    if (!event.item_id || !event.item_type) continue;
    const existing = byItemId.get(event.item_id);
    const next: HelixThreadItem =
      existing ?? {
        thread_id: event.thread_id,
        turn_id: event.turn_id,
        item_id: event.item_id,
        item_type: event.item_type,
        item_status: event.item_status ?? "in_progress",
        item_stream: event.item_stream ?? null,
        started_at: event.ts,
        updated_at: event.ts,
        completed_at: null,
        text: null,
        delta_count: 0,
        last_seq: event.seq,
        source_item_ids: event.source_item_ids ?? null,
        claim_links: event.claim_links ?? null,
        observation_ref: event.observation_ref ?? null,
        meta: event.meta ?? null,
      };
    next.thread_id = event.thread_id;
    next.turn_id = event.turn_id;
    next.item_type = event.item_type ?? next.item_type;
    next.item_stream = event.item_stream ?? next.item_stream ?? null;
    next.item_status = event.item_status ?? next.item_status;
    next.updated_at = event.ts;
    next.last_seq = event.seq;
    next.source_item_ids = event.source_item_ids ?? next.source_item_ids ?? null;
    next.claim_links = event.claim_links ?? next.claim_links ?? null;
    next.observation_ref = event.observation_ref ?? next.observation_ref ?? null;
    next.meta = event.meta ?? next.meta ?? null;
    if (event.event_type === "item_started") {
      next.started_at = existing?.started_at ?? event.ts;
      next.item_status = event.item_status ?? "in_progress";
    }
    if (event.delta_text) {
      next.text = [next.text ?? "", event.delta_text].filter(Boolean).join("");
      next.delta_count += 1;
    }
    if (event.user_text && next.item_type === "userMessage") {
      next.text = event.user_text;
    }
    if (event.assistant_text && next.item_type === "answer") {
      next.text = event.assistant_text;
    }
    if (
      event.event_type === "item_completed" ||
      event.item_status === "completed" ||
      event.item_status === "failed" ||
      event.item_status === "declined" ||
      event.item_status === "cancelled"
    ) {
      next.completed_at = event.ts;
      next.item_status = event.item_status ?? "completed";
    }
    byItemId.set(event.item_id, next);
  }
  return Array.from(byItemId.values()).sort(
    (a, b) => a.last_seq - b.last_seq || a.started_at.localeCompare(b.started_at),
  );
};

const reduceRequestStates = (
  events: HelixThreadEvent[],
): HelixThreadServerRequest[] => {
  const byRequestId = new Map<string, HelixThreadServerRequest>();
  for (const event of sortBySequence(events)) {
    if (!event.request_id || !event.request_kind) continue;
    const existing = byRequestId.get(event.request_id);
    const next: HelixThreadServerRequest =
      existing ?? {
        thread_id: event.thread_id,
        turn_id: event.turn_id,
        request_id: event.request_id,
        request_kind: event.request_kind,
        status: "pending",
        created_at: event.ts,
        updated_at: event.ts,
        resolved_at: null,
        payload: event.request_payload ?? null,
        last_seq: event.seq,
      };
    next.thread_id = event.thread_id;
    next.turn_id = event.turn_id;
    next.request_kind = event.request_kind ?? next.request_kind;
    next.updated_at = event.ts;
    next.last_seq = event.seq;
    next.payload = event.request_payload ?? next.payload ?? null;
    if (event.event_type === "server_request_created") {
      next.status = "pending";
      next.created_at = existing?.created_at ?? event.ts;
    } else if (event.event_type === "server_request_resolved") {
      next.status =
        event.item_status === "declined"
          ? "declined"
          : event.item_status === "cancelled"
            ? "cancelled"
            : "resolved";
      next.resolved_at = event.ts;
    }
    byRequestId.set(event.request_id, next);
  }
  return Array.from(byRequestId.values()).sort(
    (a, b) => a.last_seq - b.last_seq || a.created_at.localeCompare(b.created_at),
  );
};

export const buildHelixThreadTurnsFromEvents = (
  events: HelixThreadEvent[],
): HelixThreadTurn[] => {
  const orderedEvents = sortBySequence(events);
  const items = reduceItemStates(orderedEvents);
  const requests = reduceRequestStates(orderedEvents);
  const itemsByTurn = new Map<string, HelixThreadItem[]>();
  const requestsByTurn = new Map<string, HelixThreadServerRequest[]>();
  for (const item of items) {
    const list = itemsByTurn.get(item.turn_id) ?? [];
    list.push(item);
    itemsByTurn.set(item.turn_id, list);
  }
  for (const request of requests) {
    const list = requestsByTurn.get(request.turn_id) ?? [];
    list.push(request);
    requestsByTurn.set(request.turn_id, list);
  }

  const byTurnId = new Map<string, HelixThreadTurn>();
  for (const event of orderedEvents) {
    const existing = byTurnId.get(event.turn_id);
    const next: HelixThreadTurn =
      existing ?? {
        thread_id: event.thread_id,
        turn_id: event.turn_id,
        route: event.route,
        session_id: event.session_id ?? null,
        trace_id: event.trace_id ?? null,
        status: "in_progress",
        started_at: event.ts,
        updated_at: event.ts,
        user_text: event.user_text ?? null,
        assistant_text: event.assistant_text ?? null,
        classifier_result: event.classifier_result ?? null,
        route_reason: event.route_reason ?? null,
        brief_status: event.brief_status ?? null,
        final_gate_outcome: event.final_gate_outcome ?? null,
        fail_reason: event.fail_reason ?? null,
        answer_surface_mode: event.answer_surface_mode ?? null,
        memory_citation: event.memory_citation ?? null,
        last_seq: event.seq,
        event_count: 0,
        turn_kind: event.turn_kind ?? null,
        item_count: 0,
        request_count: 0,
        latest_plan_summary: null,
        latest_answer_summary: null,
        source_thread_id: null,
        source_turn_id: null,
      };
    next.thread_id = event.thread_id;
    next.route = event.route;
    next.session_id = event.session_id ?? next.session_id ?? null;
    next.trace_id = event.trace_id ?? next.trace_id ?? null;
    next.updated_at = event.ts;
    next.last_seq = event.seq;
    next.event_count += 1;
    next.turn_kind = event.turn_kind ?? next.turn_kind ?? null;
    if (event.user_text) next.user_text = event.user_text;
    if (event.assistant_text) next.assistant_text = event.assistant_text;
    if (event.classifier_result) next.classifier_result = event.classifier_result;
    if (event.route_reason) next.route_reason = event.route_reason;
    if (event.brief_status) next.brief_status = event.brief_status;
    if (event.final_gate_outcome) next.final_gate_outcome = event.final_gate_outcome;
    if (event.fail_reason) next.fail_reason = event.fail_reason;
    if (event.answer_surface_mode) next.answer_surface_mode = event.answer_surface_mode;
    if (event.memory_citation) next.memory_citation = event.memory_citation;
    if (
      event.meta &&
      typeof event.meta === "object" &&
      !Array.isArray(event.meta)
    ) {
      const sourceThreadId = normalizeOptionalString(
        (event.meta as Record<string, unknown>).source_thread_id,
      );
      const sourceTurnId = normalizeOptionalString(
        (event.meta as Record<string, unknown>).source_turn_id,
      );
      if (sourceThreadId) next.source_thread_id = sourceThreadId;
      if (sourceTurnId) next.source_turn_id = sourceTurnId;
    }
    if (
      event.event_type === "conversation_turn_started" ||
      event.event_type === "ask_started" ||
      event.event_type === "turn_started"
    ) {
      next.status = "in_progress";
      next.started_at = existing?.started_at ?? event.ts;
    } else if (
      event.event_type === "conversation_turn_failed" ||
      event.event_type === "ask_failed" ||
      event.event_type === "turn_failed"
    ) {
      next.status = "failed";
    } else if (
      event.event_type === "conversation_turn_interrupted" ||
      event.event_type === "ask_interrupted" ||
      event.event_type === "turn_interrupted"
    ) {
      next.status = "interrupted";
    } else if (
      event.event_type === "conversation_turn_completed" ||
      event.event_type === "ask_completed" ||
      event.event_type === "turn_completed"
    ) {
      if (next.status !== "failed" && next.status !== "interrupted") {
        next.status = "completed";
      }
    }
    byTurnId.set(event.turn_id, next);
  }

  for (const turn of byTurnId.values()) {
    const turnItems = (itemsByTurn.get(turn.turn_id) ?? []).sort(
      (a, b) => a.last_seq - b.last_seq,
    );
    const turnRequests = requestsByTurn.get(turn.turn_id) ?? [];
    turn.item_count = turnItems.length;
    turn.request_count = turnRequests.length;
    const latestUser = [...turnItems]
      .reverse()
      .find((item) => item.item_type === "userMessage" && item.item_status === "completed");
    const latestAnswer = [...turnItems]
      .reverse()
      .find((item) => item.item_type === "answer" && item.item_status === "completed");
    const latestPlan = [...turnItems]
      .reverse()
      .find((item) => item.item_type === "plan" && item.item_status === "completed");
    if (latestUser?.text) turn.user_text = latestUser.text;
    if (latestAnswer?.text) {
      turn.assistant_text = latestAnswer.text;
      turn.latest_answer_summary = latestAnswer.text;
    }
    if (latestPlan?.text) {
      turn.latest_plan_summary = latestPlan.text;
    }
  }

  return Array.from(byTurnId.values()).sort(
    (a, b) => a.last_seq - b.last_seq || a.started_at.localeCompare(b.started_at),
  );
};

export const buildHelixThreadState = (args: {
  threadId: string;
  events?: HelixThreadEvent[];
}): HelixThreadState => {
  const threadId = normalizeOptionalString(args.threadId) ?? "";
  const record = threadId ? readHelixThread({ threadId }) : null;
  const events =
    args.events?.filter((event) => event.thread_id === threadId) ??
    getHelixThreadLedgerEvents({ threadId });
  const turns = buildHelixThreadTurnsFromEvents(events);
  const items = reduceItemStates(events).filter((item) => item.thread_id === threadId);
  const requests = reduceRequestStates(events).filter((request) => request.thread_id === threadId);
  const unresolvedRequests = requests.filter((request) => request.status === "pending");
  const latestTurn = turns.at(-1) ?? null;
  const latestPlanItem = [...items]
    .reverse()
    .find((item) => item.item_type === "plan" && item.item_status === "completed");
  const latestAnswerItem = [...items]
    .reverse()
    .find((item) => item.item_type === "answer" && item.item_status === "completed");
  const latestTurnWithCitation = [...turns]
    .reverse()
    .find((turn) => turn.memory_citation && turn.memory_citation.entries.length > 0);
  let status = record?.status ?? "idle";
  if (record?.active_turn_id) {
    status = unresolvedRequests.length > 0 ? "interrupted" : "active";
  } else if (latestTurn?.status === "failed") {
    status = "failed";
  } else if (unresolvedRequests.length > 0 || latestTurn?.status === "interrupted") {
    status = "interrupted";
  } else if (latestTurn?.status === "in_progress") {
    status = "active";
  } else if (record?.status === "archived") {
    status = "archived";
  } else {
    status = "idle";
  }
  return {
    thread_id: threadId,
    session_id:
      latestTurn?.session_id ?? record?.session_id ?? events.at(-1)?.session_id ?? null,
    status,
    turns,
    items,
    unresolved_requests: unresolvedRequests,
    latest_turn_id: record?.latest_turn_id ?? latestTurn?.turn_id ?? null,
    active_turn_id:
      record?.active_turn_id ??
      unresolvedRequests.at(-1)?.turn_id ??
      turns.find((turn) => turn.status === "in_progress")?.turn_id ??
      null,
    latest_plan_summary: latestPlanItem?.text ?? latestTurn?.latest_plan_summary ?? null,
    latest_answer_summary:
      latestAnswerItem?.text ?? latestTurn?.latest_answer_summary ?? latestTurn?.assistant_text ?? null,
    latest_memory_citation: latestTurnWithCitation?.memory_citation ?? null,
    item_count: items.length,
    request_count: requests.length,
  };
};

export const buildHelixTurnState = (args: {
  threadId: string;
  turnId: string;
  events?: HelixThreadEvent[];
}): HelixThreadTurnState | null => {
  const state = buildHelixThreadState({
    threadId: args.threadId,
    events: args.events,
  });
  const turn = state.turns.find((entry) => entry.turn_id === args.turnId);
  if (!turn) return null;
  return {
    ...turn,
    items: state.items.filter((item) => item.turn_id === args.turnId),
    unresolved_requests: state.unresolved_requests.filter(
      (request) => request.turn_id === args.turnId,
    ),
  };
};

export const buildHelixThreadExecutionView = (args: {
  threadId: string;
  turnId: string;
  events?: HelixThreadEvent[];
}): HelixThreadExecutionView | null => {
  const turnState = buildHelixTurnState(args);
  if (!turnState) return null;
  const planItems = turnState.items.filter((item) => item.item_type === "plan");
  const retrievalItems = turnState.items.filter((item) => item.item_type === "retrieval");
  const validationItems = turnState.items.filter((item) => item.item_type === "validation");
  const answerItems = turnState.items.filter((item) => item.item_type === "answer");
  const observationItems = turnState.items.filter(
    (item) =>
      item.item_type === "retrieval" ||
      item.item_type === "toolObservation" ||
      item.item_type === "commandExecution" ||
      item.item_type === "dynamicToolCall",
  );
  return {
    thread_id: turnState.thread_id,
    turn_id: turnState.turn_id,
    turn_kind: turnState.turn_kind ?? null,
    plan_items: planItems,
    retrieval_items: retrievalItems,
    validation_items: validationItems,
    answer_items: answerItems,
    observation_items: observationItems,
    unresolved_requests: turnState.unresolved_requests,
    latest_plan_summary:
      [...planItems].reverse().find((item) => item.text)?.text ??
      turnState.latest_plan_summary ??
      null,
    latest_answer_summary:
      [...answerItems].reverse().find((item) => item.text)?.text ??
      turnState.latest_answer_summary ??
      turnState.assistant_text ??
      null,
  };
};

export const buildHelixThreadCitationView = (args: {
  threadId: string;
  turnId: string;
  events?: HelixThreadEvent[];
}): HelixThreadCitationView | null => {
  const turnState = buildHelixTurnState(args);
  if (!turnState) return null;
  const answerItems = turnState.items.filter((item) => item.item_type === "answer");
  const observationItemsAll = turnState.items.filter(
    (item) => item.item_type === "retrieval" || item.item_type === "toolObservation",
  );
  const claimLinks = answerItems.flatMap((item) => item.claim_links ?? []);
  const sourceItemIds = Array.from(
    new Set(
      [
        ...answerItems.flatMap((item) => item.source_item_ids ?? []),
        ...claimLinks.flatMap((link) => link.source_item_ids),
      ].filter(Boolean),
    ),
  );
  const observationItems =
    sourceItemIds.length > 0
      ? observationItemsAll.filter((item) => sourceItemIds.includes(item.item_id))
      : observationItemsAll;
  const entries = observationItems
    .map((item) => {
      const ref = item.observation_ref ?? {};
      const pathValue = normalizeOptionalString((ref as { path?: unknown }).path);
      if (!pathValue) return null;
      const lineStartRaw = (ref as { line_start?: unknown }).line_start;
      const lineEndRaw = (ref as { line_end?: unknown }).line_end;
      return {
        path: pathValue,
        line_start:
          typeof lineStartRaw === "number" && Number.isFinite(lineStartRaw)
            ? Math.max(1, Math.floor(lineStartRaw))
            : null,
        line_end:
          typeof lineEndRaw === "number" && Number.isFinite(lineEndRaw)
            ? Math.max(1, Math.floor(lineEndRaw))
            : null,
        note:
          clipHistoryText((ref as { note?: unknown }).note, 240) ??
          `source_item_id=${item.item_id}`,
      };
    })
    .filter(
      (
        entry,
      ): entry is NonNullable<typeof entry> => Boolean(entry?.path),
    );
  const memoryCitation: HelixThreadMemoryCitation | null =
    entries.length > 0
      ? {
          entries,
          rollout_ids: [turnState.turn_id],
        }
      : turnState.memory_citation ?? null;
  return {
    thread_id: turnState.thread_id,
    turn_id: turnState.turn_id,
    source_item_ids: sourceItemIds,
    observation_items: observationItems,
    claim_links: claimLinks,
    memory_citation: memoryCitation,
  };
};

export const buildRecentTurnsFromHelixThread = (args: {
  sessionId?: string | null;
  threadId?: string | null;
  events?: HelixThreadEvent[];
  limit?: number;
  excludeTurnId?: string | null;
}): string[] => {
  const sessionId = normalizeOptionalString(args.sessionId);
  const threadId = normalizeOptionalString(args.threadId);
  if (!sessionId && !threadId) return [];
  const limit = clampNumber(args.limit ?? 6, 1, 12);
  const excludeTurnId = normalizeOptionalString(args.excludeTurnId);
  const events =
    args.events ??
    getHelixThreadLedgerEvents({
      sessionId,
      threadId,
    });
  const turns = buildHelixThreadTurnsFromEvents(events)
    .filter((turn) => (threadId ? turn.thread_id === threadId : turn.session_id === sessionId))
    .filter((turn) => !excludeTurnId || turn.turn_id !== excludeTurnId)
    .sort((a, b) => a.last_seq - b.last_seq);
  const items = reduceItemStates(events).filter((item) =>
    threadId ? item.thread_id === threadId : true,
  );
  const itemsByTurn = new Map<string, HelixThreadItem[]>();
  for (const item of items) {
    const list = itemsByTurn.get(item.turn_id) ?? [];
    list.push(item);
    itemsByTurn.set(item.turn_id, list);
  }
  const lines: string[] = [];
  for (const turn of turns) {
    const turnItems = (itemsByTurn.get(turn.turn_id) ?? []).sort(
      (a, b) => a.last_seq - b.last_seq,
    );
    const completedUser = [...turnItems]
      .reverse()
      .find((item) => item.item_type === "userMessage" && item.item_status === "completed");
    const completedAnswer = [...turnItems]
      .reverse()
      .find((item) => item.item_type === "answer" && item.item_status === "completed");
    const userText = clipHistoryText(
      completedUser?.text ?? (turn.status === "completed" ? turn.user_text : null),
      440,
    );
    if (userText) {
      lines.push(`user: ${userText}`);
    }
    const assistantText = clipHistoryText(
      completedAnswer?.text ?? (turn.status === "completed" ? turn.assistant_text : null),
      440,
    );
    if (assistantText) {
      lines.push(`dottie: ${assistantText}`);
    }
  }
  return lines.slice(-limit);
};

