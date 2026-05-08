import crypto from "node:crypto";
import {
  HELIX_INTERJECTION_DECISION_SCHEMA,
  HELIX_INTERJECTION_INVESTIGATION_SCHEMA,
  type HelixInterjectionDecision,
  type HelixInterjectionInvestigation,
  type HelixInterjectionInvestigationReceipt,
  type HelixInterjectionInvestigationTrigger,
} from "@shared/helix-interjection-investigator";
import type { HelixMissionMemory } from "@shared/helix-mission-memory";
import { appendHelixThreadEvent } from "../helix-thread/ledger";
import { refreshMissionMemoryForThread } from "./mission-memory-reducer";

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

function appendInvestigationToThread(args: {
  investigation: HelixInterjectionInvestigation;
  decision: HelixInterjectionDecision;
}): void {
  const now = args.decision.ts;
  const turnId = `turn:interjection:${crypto.randomUUID()}`;
  const investigationItemId = `item:interjection-investigation:${args.investigation.investigation_id}`;
  const decisionItemId = `item:interjection-decision:${args.decision.decision_id}`;
  const base = {
    route: "/ask" as const,
    thread_id: args.investigation.thread_id,
    turn_id: turnId,
    session_id: args.investigation.thread_id,
    trace_id: null,
    turn_kind: "auxiliary" as const,
    answer_surface_mode: null,
    ts: now,
  };
  appendHelixThreadEvent({
    ...base,
    event_type: "turn_started",
    meta: { kind: "situation_investigation", visibility: "standby_trace" },
  });
  appendHelixThreadEvent({
    ...base,
    event_type: "item_started",
    item_id: investigationItemId,
    item_type: "dynamicToolCall",
    item_stream: "tool",
    item_status: "in_progress",
    meta: {
      kind: "interjection_investigation",
      primary_user_visible: false,
      model_invoked: false,
      context_policy: "compact_context_only",
    },
  });
  appendHelixThreadEvent({
    ...base,
    event_type: "item_completed",
    item_id: investigationItemId,
    item_type: "dynamicToolCall",
    item_stream: "tool",
    item_status: "completed",
    observation_ref: args.investigation as unknown as Record<string, unknown>,
    meta: {
      kind: "interjection_investigation",
      primary_user_visible: false,
      model_invoked: false,
      context_policy: "compact_context_only",
    },
  });
  appendHelixThreadEvent({
    ...base,
    event_type: "item_started",
    item_id: decisionItemId,
    item_type: "validation",
    item_stream: "observation",
    item_status: "in_progress",
    meta: {
      kind: "interjection_decision",
      primary_user_visible: false,
      model_invoked: false,
      context_policy: "compact_context_only",
    },
  });
  appendHelixThreadEvent({
    ...base,
    event_type: "item_completed",
    item_id: decisionItemId,
    item_type: "validation",
    item_stream: "observation",
    item_status: "completed",
    observation_ref: args.decision as unknown as Record<string, unknown>,
    meta: {
      kind: "interjection_decision",
      primary_user_visible: false,
      model_invoked: false,
      context_policy: "compact_context_only",
    },
  });
  appendHelixThreadEvent({
    ...base,
    event_type: "turn_completed",
    thread_status: "idle",
    meta: { kind: "situation_investigation", assistant_text: null },
  });
}

export function investigateLatestInterjectionForThread(args: {
  threadId: string;
  trigger?: HelixInterjectionInvestigationTrigger;
  now?: string;
  writeThreadItems?: boolean;
}): HelixInterjectionInvestigationReceipt {
  const threadId = args.threadId.trim();
  if (!threadId) {
    return {
      ok: false,
      schema: "helix.interjection_investigation_receipt.v1",
      investigation: null,
      decision: null,
      error: "missing_thread_id",
      message: "Interjection investigation requires thread_id.",
    };
  }
  const memoryResult = refreshMissionMemoryForThread({ threadId, reason: "manual_refresh" });
  const memory = memoryResult.memory;
  if (!memory || memory.status !== "active") {
    return {
      ok: false,
      schema: "helix.interjection_investigation_receipt.v1",
      investigation: null,
      decision: null,
      error: "no_active_mission_memory",
      message: "No active mission memory is available for interjection review.",
    };
  }
  const now = args.now ?? new Date().toISOString();
  const priorityRank = (priority: "info" | "warn" | "critical" | "action"): number =>
    priority === "action" ? 4 : priority === "critical" ? 3 : priority === "warn" ? 2 : 1;
  const topRisk = memory.active_risks
    .slice()
    .sort(
      (
        a: HelixMissionMemory["active_risks"][number],
        b: HelixMissionMemory["active_risks"][number],
      ) => priorityRank(a.priority) - priorityRank(b.priority),
    )
    .at(-1);
  const trigger =
    args.trigger ??
    (topRisk?.priority === "critical" || topRisk?.priority === "action"
      ? "critical_salience"
      : topRisk
        ? "risk_detected"
        : "manual_review");
  const evidenceRefs = Array.from(
    new Set([
      ...memory.active_risks.flatMap(
        (risk: HelixMissionMemory["active_risks"][number]) => risk.evidence_refs,
      ),
      ...memory.active_predictions.flatMap(
        (prediction: HelixMissionMemory["active_predictions"][number]) => prediction.evidence_refs,
      ),
      `mission_memory:${memory.session_id}`,
    ]),
  ).slice(-32);
  const memoryHash = hashShort(memory, 24);
  const investigation: HelixInterjectionInvestigation = {
    schema: HELIX_INTERJECTION_INVESTIGATION_SCHEMA,
    investigation_id: `interjection_investigation:${hashShort([threadId, trigger, memoryHash, now], 18)}`,
    thread_id: threadId,
    room_id: memory.room_id,
    trigger,
    mission_memory_hash: memoryHash,
    evidence_refs: evidenceRefs,
    episode_ids: memory.recent_episode_ids,
    salience_receipt_ids: memory.recent_salience_receipt_ids,
    question: "should_interject",
    allowed_outputs: [
      "silent_keep_in_context",
      "show_text",
      "voice_on_confirm",
      "request_user_input",
    ],
    created_at: now,
  };
  const decisionValue: HelixInterjectionDecision["decision"] =
    topRisk && (topRisk.priority === "critical" || topRisk.priority === "action")
      ? memory.mode === "voice_on_confirm" || memory.mode === "critical_voice"
        ? "voice_on_confirm"
        : "show_text"
      : topRisk
        ? "show_text"
        : "silent_keep_in_context";
  const decision: HelixInterjectionDecision = {
    schema: HELIX_INTERJECTION_DECISION_SCHEMA,
    decision_id: `interjection_decision:${hashShort([investigation.investigation_id, decisionValue], 18)}`,
    investigation_id: investigation.investigation_id,
    thread_id: threadId,
    decision: decisionValue,
    text:
      decisionValue === "silent_keep_in_context"
        ? null
        : topRisk?.label ?? memory.risk_line,
    reason:
      decisionValue === "silent_keep_in_context"
        ? "No salience above the interjection threshold."
        : `Interjection allowed by deterministic ${trigger} gate.`,
    confidence: topRisk ? 0.82 : 0.62,
    evidence_refs: evidenceRefs,
    model_invoked: false,
    deterministic_gate: true,
    ts: now,
  };
  if (args.writeThreadItems !== false) appendInvestigationToThread({ investigation, decision });
  return {
    ok: true,
    schema: "helix.interjection_investigation_receipt.v1",
    investigation,
    decision,
    error: null,
    message: "Interjection investigation completed.",
  };
}
