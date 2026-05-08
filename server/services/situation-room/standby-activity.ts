import crypto from "node:crypto";
import {
  HELIX_STANDBY_ACTIVITY_ITEM_SCHEMA,
  type HelixStandbyActivityItem,
  type HelixStandbyActivityResponse,
} from "@shared/helix-standby-activity";
import type { SituationGoalSession } from "@shared/helix-situation-goal-session";
import { getHelixThreadLedgerEvents } from "../helix-thread/ledger";
import { listSituationGoalSessions } from "./situation-goal-session-store";

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((entry: unknown) => asString(entry)).filter((entry: string | null): entry is string => Boolean(entry))
    : [];

const asPriority = (value: unknown): HelixStandbyActivityItem["priority"] =>
  value === "warn" || value === "critical" || value === "action" ? value : "info";

const deterministicProvenance: HelixStandbyActivityItem["provenance"] = {
  source: "deterministic_dictionary",
  model_invoked: false,
  context_policy: "observation_only",
  safe_for_future_context: true,
};

function buildActivityBase(args: {
  threadId: string;
  turnId?: string | null;
  itemId?: string | null;
  observation: Record<string, unknown>;
  kind: HelixStandbyActivityItem["kind"];
  priority?: HelixStandbyActivityItem["priority"];
  title: string;
  summary: string;
  decision?: HelixStandbyActivityItem["decision"];
  visibility?: HelixStandbyActivityItem["visibility"];
  evidenceRefs?: string[];
  ts: string;
  suffix: string;
}): HelixStandbyActivityItem {
  const worldEvent = asRecord(args.observation.world_event);
  const signal = asRecord(args.observation.signal);
  return {
    schema: HELIX_STANDBY_ACTIVITY_ITEM_SCHEMA,
    activity_id: `standby_activity:${hashShort([
      args.threadId,
      args.turnId ?? null,
      args.itemId ?? null,
      args.kind,
      args.suffix,
    ], 18)}`,
    thread_id: args.threadId,
    turn_id: args.turnId ?? null,
    item_id: args.itemId ?? null,
    room_id: asString(args.observation.room_id),
    source_id: asString(args.observation.source_id),
    graph_id: asString(args.observation.graph_id),
    world_id: asString(args.observation.world_id),
    actor_label: asString(worldEvent?.actor_label) ?? asString(signal?.actor),
    kind: args.kind,
    priority: args.priority ?? "info",
    title: args.title,
    summary: args.summary,
    ...(args.decision ? { decision: args.decision } : {}),
    visibility: args.visibility ?? "runtime_only",
    provenance: deterministicProvenance,
    evidence_refs: Array.from(new Set(args.evidenceRefs ?? [])),
    metadata: {
      source: "minecraft",
      source_kind: "world_event",
    },
    ts: args.ts,
  };
}

function buildActivityFromSituationGoalReceipt(args: {
  threadId: string;
  turnId?: string | null;
  itemId?: string | null;
  ts: string;
  receipt: Record<string, unknown>;
}): HelixStandbyActivityItem[] {
  const session = asRecord(args.receipt.session);
  if (!session) return [];
  const sessionId = asString(session.session_id) ?? "unknown";
  const worldId = asString(session.world_id);
  const sourceId = asString(session.source_id) ?? asStringArray(session.source_ids)[0] ?? null;
  return [
    {
      schema: HELIX_STANDBY_ACTIVITY_ITEM_SCHEMA,
      activity_id: `standby_activity:${hashShort([args.threadId, sessionId, "situation_goal_started"], 18)}`,
      thread_id: args.threadId,
      turn_id: args.turnId ?? null,
      item_id: args.itemId ?? null,
      room_id: asString(session.room_id),
      source_id: sourceId,
      graph_id: asString(session.graph_id),
      world_id: worldId,
      actor_label: null,
      kind: "situation_goal_started",
      priority: "info",
      title: "Minecraft situation active",
      summary:
        asString(session.objective) ??
        "Minecraft situation monitoring is active for danger and progress.",
      decision: "silent_keep_in_context",
      visibility: "helix_dock",
      provenance: deterministicProvenance,
      evidence_refs: asStringArray(args.receipt.evidence_refs).length > 0
        ? asStringArray(args.receipt.evidence_refs)
        : [`situation_goal_session:${sessionId}`],
      metadata: {
        source: "minecraft",
        source_kind: "situation_goal_session",
        session_id: sessionId,
      },
      ts: args.ts,
    },
  ];
}

function buildActivitiesFromActiveSessions(threadId: string): HelixStandbyActivityItem[] {
  return listSituationGoalSessions({ thread_id: threadId })
    .filter((session: SituationGoalSession) => session.status === "active")
    .map((session: SituationGoalSession) => ({
      schema: HELIX_STANDBY_ACTIVITY_ITEM_SCHEMA,
      activity_id: `standby_activity:${hashShort([threadId, session.session_id, "active_session"], 18)}`,
      thread_id: threadId,
      turn_id: null,
      item_id: null,
      room_id: session.room_id,
      source_id: session.source_id ?? session.source_ids[0] ?? null,
      graph_id: session.graph_id ?? null,
      world_id: session.world_id ?? null,
      actor_label: null,
      kind: "situation_goal_started",
      priority: "info",
      title: "Minecraft situation active",
      summary: session.objective,
      decision: "silent_keep_in_context",
      visibility: "helix_dock",
      provenance: deterministicProvenance,
      evidence_refs: [`situation_goal_session:${session.session_id}`],
      metadata: {
        source: "minecraft",
        source_kind: "situation_goal_session",
        session_id: session.session_id,
      },
      ts: session.updated_at,
    }));
}

export function buildStandbyActivitiesFromObservation(args: {
  threadId: string;
  turnId?: string | null;
  itemId?: string | null;
  ts: string;
  observation: Record<string, unknown>;
}): HelixStandbyActivityItem[] {
  const observation = args.observation;
  if (observation.schema !== "helix.standby_thread_observation.v1") return [];
  const salience = asRecord(observation.salience_receipt);
  const callout = asRecord(observation.callout_proposal);
  const delivery = asRecord(observation.callout_delivery_receipt);
  const worldEvent = asRecord(observation.world_event);
  const episodeNarrations = Array.isArray(observation.episode_narrations)
    ? (observation.episode_narrations as unknown[])
    : [];
  const predictions = Array.isArray(observation.episode_predictions)
    ? (observation.episode_predictions as unknown[])
    : [];
  const evidenceRefs = [
    ...asStringArray(worldEvent?.evidence_refs),
    ...asStringArray(salience?.evidence_refs),
    ...asStringArray(delivery?.evidence_refs),
  ];
  const items: HelixStandbyActivityItem[] = [];
  const eventType = asString(worldEvent?.event_type);
  if (eventType) {
    items.push(
      buildActivityBase({
        ...args,
        observation,
        kind: "source_event",
        title: "Observed world event",
        summary: `${asString(worldEvent?.actor_label) ?? "Minecraft"} emitted ${eventType}.`,
        visibility: "runtime_only",
        evidenceRefs,
        suffix: `source:${eventType}`,
      }),
    );
  }
  for (const narration of episodeNarrations.slice(-3)) {
    const record = asRecord(narration);
    const text = asString(record?.text);
    if (!text) continue;
    items.push(
      buildActivityBase({
        ...args,
        observation,
        kind: "episode",
        title: "Grouped episode",
        summary: text,
        visibility: "runtime_only",
        evidenceRefs: asStringArray(record?.evidence_refs),
        suffix: `episode:${asString(record?.narration_id) ?? text}`,
      }),
    );
  }
  for (const prediction of predictions.slice(-3)) {
    const record = asRecord(prediction);
    const goal = asString(record?.predicted_goal);
    if (!goal) continue;
    items.push(
      buildActivityBase({
        ...args,
        observation,
        kind: "prediction",
        priority: "info",
        title: "Updated prediction",
        summary: goal,
        decision: "silent_keep_in_context",
        visibility: "runtime_only",
        evidenceRefs: asStringArray(record?.evidence_refs),
        suffix: `prediction:${asString(record?.prediction_id) ?? goal}`,
      }),
    );
  }
  if (salience) {
    items.push(
      buildActivityBase({
        ...args,
        observation,
        kind: "salience",
        priority: asPriority(salience.priority),
        title: "Evaluated salience",
        summary: asString(salience.summary) ?? asString(salience.reason) ?? "Standby salience updated.",
        decision: "show_text",
        visibility: "runtime_only",
        evidenceRefs: asStringArray(salience.evidence_refs),
        suffix: `salience:${asString(salience.receipt_id) ?? asString(salience.reason) ?? "event"}`,
      }),
    );
  } else if (eventType) {
    items.push(
      buildActivityBase({
        ...args,
        observation,
        kind: "suppression",
        priority: "info",
        title: "Kept silent",
        summary: `${eventType} was kept as background context.`,
        decision: "silent_keep_in_context",
        visibility: "runtime_only",
        evidenceRefs,
        suffix: `suppression:${eventType}`,
      }),
    );
  }
  if (callout) {
    items.push(
      buildActivityBase({
        ...args,
        observation,
        kind: "callout_proposal",
        priority: asPriority(callout.priority),
        title: "Callout ready",
        summary: asString(callout.text) ?? "Standby callout ready.",
        decision:
          callout.decision === "speak_on_confirm"
            ? "voice_on_confirm"
            : callout.decision === "request_user_input"
              ? "request_user_input"
              : "show_text",
        visibility: callout.decision === "suppress" ? "runtime_only" : "helix_dock",
        evidenceRefs: asStringArray(callout.evidence_refs),
        suffix: `callout:${asString(callout.proposal_id) ?? asString(callout.text) ?? "proposal"}`,
      }),
    );
  }
  if (delivery) {
    const delivered = delivery.delivered === true;
    items.push(
      buildActivityBase({
        ...args,
        observation,
        kind: "callout_delivery",
        priority: asPriority(callout?.priority ?? salience?.priority),
        title: delivered ? "Delivered" : "Delivery suppressed",
        summary:
          asString(callout?.text) ??
          asString(salience?.summary) ??
          asString(delivery.reason) ??
          "Standby delivery updated.",
        decision: delivered ? "show_text" : "silent_keep_in_context",
        visibility: delivered ? "helix_dock" : "runtime_only",
        evidenceRefs: asStringArray(delivery.evidence_refs),
        suffix: `delivery:${asString(delivery.delivery_id) ?? asString(delivery.reason) ?? "receipt"}`,
      }),
    );
  }
  return items;
}

export function getStandbyActivityForThread(args: {
  threadId: string;
  limit?: number | null;
}): HelixStandbyActivityResponse {
  const limit = Math.max(1, Math.min(100, Math.floor(args.limit ?? 50)));
  const events = getHelixThreadLedgerEvents({ threadId: args.threadId, limit: 800 });
  const activities: HelixStandbyActivityItem[] = [];
  for (const event of events) {
    const observation = asRecord(event.observation_ref);
    if (!observation) continue;
    if (observation.schema === "helix.standby_thread_observation.v1") {
      activities.push(
        ...buildStandbyActivitiesFromObservation({
          threadId: event.thread_id,
          turnId: event.turn_id,
          itemId: event.item_id ?? null,
          ts: event.ts,
          observation,
        }),
      );
    }
    if (observation.schema === "helix.situation_goal_session_receipt.v1") {
      activities.push(
        ...buildActivityFromSituationGoalReceipt({
          threadId: event.thread_id,
          turnId: event.turn_id,
          itemId: event.item_id ?? null,
          ts: event.ts,
          receipt: observation,
        }),
      );
    }
    if (observation.schema === "helix.standby_reasoning_result.v1") {
      activities.push({
        schema: HELIX_STANDBY_ACTIVITY_ITEM_SCHEMA,
        activity_id: `standby_activity:${hashShort([event.thread_id, event.turn_id, event.item_id, "reasoning"], 18)}`,
        thread_id: event.thread_id,
        turn_id: event.turn_id,
        item_id: event.item_id ?? null,
        room_id: null,
        source_id: null,
        graph_id: null,
        world_id: null,
        actor_label: null,
        kind: "standby_reasoning",
        priority: "info",
        title: "Standby reasoning trace",
        summary: asString(observation.summary) ?? "Standby reasoning completed.",
        decision: asString(observation.decision) === "text_callout" ? "show_text" : "silent_keep_in_context",
        visibility: "runtime_only",
        provenance: {
          source: observation.model_invoked === true ? "micro_reasoner" : "deterministic_dictionary",
          model_invoked: observation.model_invoked === true,
          context_policy: "observation_only",
          safe_for_future_context: observation.safe_for_future_context !== false,
        },
        evidence_refs: asStringArray(observation.evidence_refs),
        ts: event.ts,
      });
    }
  }
  activities.push(...buildActivitiesFromActiveSessions(args.threadId));
  const unique = new Map<string, HelixStandbyActivityItem>();
  for (const item of activities) unique.set(item.activity_id, item);
  const sortedActivities = Array.from(unique.values())
    .sort(
      (a: HelixStandbyActivityItem, b: HelixStandbyActivityItem) =>
        a.ts.localeCompare(b.ts) || a.activity_id.localeCompare(b.activity_id),
    )
    .slice(-limit);
  return {
    ok: true,
    schema: "helix.standby_activity_response.v1",
    thread_id: args.threadId,
    limit,
    activities: sortedActivities,
    diagnostics: {
      last_loaded_at: new Date().toISOString(),
      activity_count: sortedActivities.length,
      thread_id: args.threadId,
      last_fetch_error: null,
    },
  };
}
