import { createHash } from "node:crypto";
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
  contextTier?: "tier0" | "tier1";
  sessionState?: "idle" | "requesting" | "active" | "stopping" | "error";
  traceId?: string;
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
  contextTier?: "tier0" | "tier1";
  sessionState?: "idle" | "requesting" | "active" | "stopping" | "error";
  traceId?: string;
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

const normalizeList = (items?: string[]): string[] => {
  if (!items?.length) return [];
  const unique = new Set<string>();
  for (const item of items) {
    const trimmed = item?.trim();
    if (trimmed) unique.add(trimmed);
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
};

const buildDeterministicEventId = (input: {
  missionId: string;
  source: MissionNormalizedEvent["source"];
  eventType: string;
  classification: MissionCalloutPriority;
  text: string;
  ts: string;
  entityRefs: string[];
  evidenceRefs: string[];
}): string => {
  const canonical = JSON.stringify({
    missionId: input.missionId,
    source: input.source,
    eventType: input.eventType,
    classification: input.classification,
    text: input.text,
    ts: input.ts,
    entityRefs: input.entityRefs,
    evidenceRefs: input.evidenceRefs,
  });
  const digest = createHash("sha256").update(canonical).digest("hex").slice(0, 24);
  return `evt:${input.missionId}:${digest}`;
};

export const normalizeMissionEvent = (raw: MissionRawEvent): MissionNormalizedEvent => {
  const ts = normalizeTimestamp(raw.ts);
  const missionId = raw.missionId.trim();
  const source = raw.source ?? "helix_ask";
  const eventType = raw.eventType?.trim() || "state_change";
  const classification = inferClassification(raw);
  const text = raw.text?.trim() || "Mission update";
  const entityRefs = normalizeList(raw.entityRefs);
  const evidenceRefs = normalizeList(raw.evidenceRefs);
  const providedEventId = raw.eventId?.trim();
  return {
    eventId:
      providedEventId ||
      buildDeterministicEventId({
        missionId,
        source,
        eventType,
        classification,
        text,
        ts,
        entityRefs,
        evidenceRefs,
      }),
    missionId,
    source,
    eventType,
    classification,
    text,
    ts,
    entityRefs,
    evidenceRefs,
    contextTier: raw.contextTier,
    sessionState: raw.sessionState,
    traceId: raw.traceId?.trim() || undefined,
  };
};
