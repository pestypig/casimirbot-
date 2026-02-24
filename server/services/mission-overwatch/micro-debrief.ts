import type { MissionNormalizedEvent } from "./event-normalizer";

export type MissionMicroDebrief = {
  eventId: string;
  missionId: string;
  type: "debrief";
  classification: "info" | "warn" | "critical" | "action";
  text: string;
  ts: string;
  evidenceRefs: string[];
  derivedFromEventIds: string[];
  closureStatus: "open" | "closed";
};

const CLOSED_OUTCOME_STATUSES = new Set([
  "resolved",
  "completed",
  "closed",
  "mitigated",
  "suppressed",
]);

export const buildMicroDebrief = (params: {
  missionId: string;
  trigger: MissionNormalizedEvent;
  advice: string;
  operatorAction?: string;
  outcomeStatus?: string;
  derivedFromEventIds?: string[];
}): MissionMicroDebrief => {
  const ts = new Date().toISOString();
  const operator = params.operatorAction?.trim() || "no_operator_action_recorded";
  const outcome = params.outcomeStatus?.trim() || "outcome_pending";
  const normalizedOutcome = outcome.toLowerCase();
  const text = [
    `Trigger: ${params.trigger.text}`,
    `Action: ${operator}`,
    `Outcome: ${outcome}`,
  ].join(" | ");

  return {
    eventId: `debrief:${params.missionId}:${Date.parse(ts)}:${params.trigger.eventId}`,
    missionId: params.missionId,
    type: "debrief",
    classification: params.trigger.classification,
    text,
    ts,
    evidenceRefs: params.trigger.evidenceRefs,
    derivedFromEventIds: params.derivedFromEventIds?.length ? params.derivedFromEventIds : [params.trigger.eventId],
    closureStatus: CLOSED_OUTCOME_STATUSES.has(normalizedOutcome) ? "closed" : "open",
  };
};
