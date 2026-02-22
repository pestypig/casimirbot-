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
};

export const buildMicroDebrief = (params: {
  missionId: string;
  trigger: MissionNormalizedEvent;
  advice: string;
  operatorAction?: string;
  outcomeStatus?: string;
}): MissionMicroDebrief => {
  const ts = new Date().toISOString();
  const operator = params.operatorAction?.trim() || "no_operator_action_recorded";
  const outcome = params.outcomeStatus?.trim() || "outcome_pending";
  const text = [
    `Trigger: ${params.trigger.text}`,
    `Advice: ${params.advice.trim()}`,
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
    derivedFromEventIds: [params.trigger.eventId],
  };
};
