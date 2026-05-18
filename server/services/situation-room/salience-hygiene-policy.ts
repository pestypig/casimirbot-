import crypto from "node:crypto";
import {
  HELIX_SALIENCE_HYGIENE_DECISION_SCHEMA,
  type HelixSalienceHygieneDecision,
} from "@shared/helix-salience-hygiene";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { SituationSalienceReceipt } from "@shared/helix-situation-standby";

type RiskState = {
  band: string;
  health: number | null;
  cooldown_until_ms: number;
  active: boolean;
};

const riskStateByKey = new Map<string, RiskState>();
const decisions: HelixSalienceHygieneDecision[] = [];

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const actorKey = (event: HelixWorldEvent): string =>
  `${event.world_id}:${event.room_id}:${event.actor_id ?? event.actor_label ?? "world"}`;

const eventRef = (event: HelixWorldEvent): string =>
  event.evidence_refs[0] ?? `world_event:${event.world_id}:${event.event_type}:${event.ts}`;

const readHealth = (event: HelixWorldEvent): number | null => {
  const delta = event.health_delta;
  if (!delta || typeof delta !== "object") return null;
  for (const key of ["current_health", "current", "health"]) {
    const value = delta[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
};

const healthBand = (health: number | null): string => {
  if (health === null) return "unknown";
  if (health <= 0) return "dead";
  if (health <= 3) return "critical";
  if (health <= 6) return "low";
  if (health <= 10) return "hurt";
  return "stable";
};

function recordDecision(input: {
  event: HelixWorldEvent;
  situation_run_id?: string | null;
  salience_receipt_ref?: string | null;
  decision: HelixSalienceHygieneDecision["decision"];
  reason: string;
  cooldown_until?: string | null;
}): HelixSalienceHygieneDecision {
  const decision: HelixSalienceHygieneDecision = {
    schema: HELIX_SALIENCE_HYGIENE_DECISION_SCHEMA,
    decision_id: `salience_hygiene:${hashShort([
      input.event.world_id,
      input.event.room_id,
      input.event.event_type,
      input.event.actor_id,
      input.decision,
      input.reason,
      input.event.ts,
    ])}`,
    source_event_ref: eventRef(input.event),
    situation_run_id: input.situation_run_id ?? null,
    salience_receipt_ref: input.salience_receipt_ref ?? null,
    decision: input.decision,
    reason: input.reason,
    cooldown_until: input.cooldown_until ?? null,
    assistant_answer: false,
  };
  decisions.push(decision);
  return decision;
}

export function applySalienceHygienePolicy(input: {
  event: HelixWorldEvent;
  situation_run_id?: string | null;
  salienceReceipt?: SituationSalienceReceipt | null;
  now?: string;
}): HelixSalienceHygieneDecision {
  const now = input.now ?? input.event.ts ?? new Date().toISOString();
  const nowMs = Date.parse(now);
  if (input.event.event_type === "player_location_sample") {
    return recordDecision({
      event: input.event,
      situation_run_id: input.situation_run_id ?? null,
      salience_receipt_ref: input.salienceReceipt?.receipt_id ?? null,
      decision: "projection_only",
      reason: "routine_location_sample",
    });
  }
  const health = readHealth(input.event);
  const key = actorKey(input.event);
  const band = healthBand(health);
  const previous = riskStateByKey.get(key);
  if (previous?.active && health !== null && band === "stable") {
    riskStateByKey.set(key, {
      band,
      health,
      cooldown_until_ms: nowMs,
      active: false,
    });
    return recordDecision({
      event: input.event,
      situation_run_id: input.situation_run_id ?? null,
      salience_receipt_ref: input.salienceReceipt?.receipt_id ?? null,
      decision: "resolve",
      reason: "health_recovered",
    });
  }
  if (input.salienceReceipt?.reason === "risk_detected") {
    const cooldownMs = Math.max(0, input.salienceReceipt.cooldown_ms ?? 30_000);
    const sameBand = previous?.active && previous.band === band;
    const notWorse =
      !previous ||
      previous.health === null ||
      health === null ||
      health >= previous.health;
    if (sameBand && notWorse && Number.isFinite(nowMs) && nowMs < previous.cooldown_until_ms) {
      return recordDecision({
        event: input.event,
        situation_run_id: input.situation_run_id ?? null,
        salience_receipt_ref: input.salienceReceipt.receipt_id,
        decision: "dedupe",
        reason: "same_actor_same_risk_band_cooldown",
        cooldown_until: new Date(previous.cooldown_until_ms).toISOString(),
      });
    }
    riskStateByKey.set(key, {
      band,
      health,
      cooldown_until_ms: Number.isFinite(nowMs) ? nowMs + cooldownMs : Date.now() + cooldownMs,
      active: true,
    });
    return recordDecision({
      event: input.event,
      situation_run_id: input.situation_run_id ?? null,
      salience_receipt_ref: input.salienceReceipt.receipt_id,
      decision: "allow",
      reason: previous?.active && health !== null && previous.health !== null && health < previous.health
        ? "risk_escalated"
        : "risk_allowed",
      cooldown_until: new Date(Number.isFinite(nowMs) ? nowMs + cooldownMs : Date.now() + cooldownMs).toISOString(),
    });
  }
  return recordDecision({
    event: input.event,
    situation_run_id: input.situation_run_id ?? null,
    salience_receipt_ref: input.salienceReceipt?.receipt_id ?? null,
    decision: "allow",
    reason: "salience_allowed",
  });
}

export function listSalienceHygieneDecisions(): HelixSalienceHygieneDecision[] {
  return [...decisions];
}

export function resetSalienceHygienePolicyForTest(): void {
  riskStateByKey.clear();
  decisions.length = 0;
}
