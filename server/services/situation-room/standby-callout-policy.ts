import crypto from "node:crypto";
import {
  HELIX_STANDBY_CALLOUT_DELIVERY_RECEIPT_SCHEMA,
  HELIX_STANDBY_CALLOUT_PROPOSAL_SCHEMA,
  type StandbyCalloutDeliveryReceipt,
  type StandbyCalloutMode,
  type StandbyCalloutPriority,
  type StandbyCalloutProposal,
} from "@shared/helix-standby-callout";

export type StandbyCalloutPolicyInput = {
  mode: StandbyCalloutMode;
  voiceOutputGranted: boolean;
  micListeningActive: boolean;
  helixAskDockVisible: boolean;
  priority: StandbyCalloutPriority;
  salienceReason: string;
  directAddressed: boolean;
  userBusy?: boolean;
  dedupeKey: string;
  nowMs: number;
  roomId: string;
  threadId?: string | null;
  graphId?: string | null;
  episodeId?: string | null;
  salienceReceiptId?: string | null;
  reasoningWorkId?: string | null;
  text: string;
  evidenceRefs: string[];
};

const cooldownByKey = new Map<string, number>();

const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const isCalloutPriority = (priority: StandbyCalloutPriority): boolean =>
  priority === "warn" || priority === "critical" || priority === "action";

const isVoicePriority = (priority: StandbyCalloutPriority): boolean =>
  priority === "critical" || priority === "action";

export function resetStandbyCalloutPolicyState(): void {
  cooldownByKey.clear();
}

export function buildStandbyCalloutProposal(input: StandbyCalloutPolicyInput): StandbyCalloutProposal {
  const cooldownMs = input.priority === "critical" ? 15_000 : 45_000;
  const base = {
    schema: HELIX_STANDBY_CALLOUT_PROPOSAL_SCHEMA,
    proposal_id: `standby_callout:${hashShort([input.roomId, input.dedupeKey, input.nowMs], 16)}`,
    room_id: input.roomId,
    thread_id: input.threadId ?? null,
    graph_id: input.graphId ?? null,
    episode_id: input.episodeId ?? null,
    salience_receipt_id: input.salienceReceiptId ?? null,
    reasoning_work_id: input.reasoningWorkId ?? null,
    priority: input.priority,
    text: input.text,
    voice_text: input.text,
    evidence_refs: input.evidenceRefs,
    dedupe_key: input.dedupeKey,
    cooldown_ms: cooldownMs,
    created_at: new Date(input.nowMs).toISOString(),
  } satisfies Omit<StandbyCalloutProposal, "decision" | "requires_confirmation">;

  const projectionOnly =
    input.salienceReason === "projection_only" || input.salienceReason === "routine_location_sample";
  if (
    input.mode === "off" ||
    projectionOnly ||
    input.salienceReason === "unknown_speaker_command" ||
    !input.threadId
  ) {
    return { ...base, decision: "suppress", requires_confirmation: false };
  }
  if (input.mode === "direct_address_only" && !input.directAddressed) {
    return { ...base, decision: "suppress", requires_confirmation: false };
  }
  if (input.mode === "text_only") {
    return {
      ...base,
      decision: isCalloutPriority(input.priority) ? "show_text" : "suppress",
      requires_confirmation: false,
    };
  }
  if (input.mode === "voice_on_confirm") {
    return {
      ...base,
      decision: isCalloutPriority(input.priority) ? "speak_on_confirm" : "suppress",
      requires_confirmation: isCalloutPriority(input.priority),
    };
  }
  if (input.mode === "critical_voice") {
    if (isVoicePriority(input.priority)) {
      return {
        ...base,
        decision: input.voiceOutputGranted ? "speak_now" : "speak_on_confirm",
        requires_confirmation: !input.voiceOutputGranted,
      };
    }
    return {
      ...base,
      decision: input.priority === "warn" ? "show_text" : "suppress",
      requires_confirmation: false,
    };
  }
  return { ...base, decision: "suppress", requires_confirmation: false };
}

export function deliverStandbyCalloutProposal(input: {
  proposal: StandbyCalloutProposal;
  mode: StandbyCalloutMode;
  voiceOutputGranted: boolean;
  userBusy?: boolean;
  nowMs: number;
}): StandbyCalloutDeliveryReceipt {
  const { proposal } = input;
  const lastDeliveredAt = cooldownByKey.get(proposal.dedupe_key) ?? 0;
  const inCooldown = lastDeliveredAt > 0 && input.nowMs - lastDeliveredAt < proposal.cooldown_ms;
  const deliveryId = `standby_callout_delivery:${hashShort([proposal.proposal_id, input.nowMs], 16)}`;
  const base = {
    schema: HELIX_STANDBY_CALLOUT_DELIVERY_RECEIPT_SCHEMA,
    delivery_id: deliveryId,
    proposal_id: proposal.proposal_id,
    thread_id: proposal.thread_id ?? null,
    audio_event_id: null,
    evidence_refs: proposal.evidence_refs,
    ts: new Date(input.nowMs).toISOString(),
  } satisfies Omit<StandbyCalloutDeliveryReceipt, "delivered" | "channel" | "reason">;

  if (proposal.decision === "suppress") {
    return { ...base, delivered: false, channel: "none", reason: "suppressed_policy" };
  }
  if (input.userBusy) {
    return { ...base, delivered: false, channel: "none", reason: "user_busy" };
  }
  if (inCooldown) {
    return { ...base, delivered: false, channel: "none", reason: "suppressed_cooldown" };
  }
  if (proposal.decision === "speak_on_confirm") {
    return { ...base, delivered: false, channel: "voice_on_confirm", reason: "awaiting_confirmation" };
  }
  if (proposal.decision === "speak_now") {
    if (!input.voiceOutputGranted) {
      return { ...base, delivered: false, channel: "none", reason: "voice_not_enabled" };
    }
    cooldownByKey.set(proposal.dedupe_key, input.nowMs);
    return {
      ...base,
      delivered: true,
      channel: "voice",
      reason: "delivered",
      audio_event_id: `standby_voice:${hashShort([proposal.proposal_id, input.nowMs], 12)}`,
    };
  }
  cooldownByKey.set(proposal.dedupe_key, input.nowMs);
  return { ...base, delivered: true, channel: "ui_text", reason: "delivered" };
}
