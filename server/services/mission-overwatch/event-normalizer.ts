import type { MissionCalloutPriority } from "./salience";

export type MissionNormalizedEvent = {
  eventId: string;
  missionId: string;
  source: "helix_ask" | "tool" | "operator" | "telemetry";
  eventType: string;
  classification: MissionCalloutPriority;
  text: string;
  ts: string;
  entityRefs: string[];
  evidenceRefs: string[];
};

export type MissionRawEvent = {
  eventId?: string;
  missionId: string;
  source?: MissionNormalizedEvent["source"];
  eventType?: string;
  classification?: MissionCalloutPriority;
  text?: string;
  ts?: string | number;
  entityRefs?: string[];
  evidenceRefs?: string[];
};

const inferClassification = (raw: MissionRawEvent): MissionCalloutPriority => {
  if (raw.classification) return raw.classification;
  const text = raw.text?.toLowerCase() ?? "";
  if (/\b(critical|abort|fail(ed)?|panic|blocker)\b/.test(text)) return "critical";
  if (/\b(action|verify|required|escalate|timer)\b/.test(text)) return "action";
  if (/\b(warn|degrad|retry|fallback)\b/.test(text)) return "warn";
  return "info";
};

const normalizeTimestamp = (value?: string | number): string => {
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
};

export const normalizeMissionEvent = (raw: MissionRawEvent): MissionNormalizedEvent => {
  const ts = normalizeTimestamp(raw.ts);
  return {
    eventId: raw.eventId?.trim() || `evt:${raw.missionId}:${Date.parse(ts)}`,
    missionId: raw.missionId.trim(),
    source: raw.source ?? "helix_ask",
    eventType: raw.eventType?.trim() || "state_change",
    classification: inferClassification(raw),
    text: raw.text?.trim() || "Mission update",
    ts,
    entityRefs: Array.from(new Set(raw.entityRefs ?? [])).filter(Boolean),
    evidenceRefs: Array.from(new Set(raw.evidenceRefs ?? [])).filter(Boolean),
  };
};
