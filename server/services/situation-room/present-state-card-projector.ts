import crypto from "node:crypto";
import {
  HELIX_PRESENT_STATE_CARD_SCHEMA,
  type HelixPresentStateCard,
  type HelixPresentStateCardLine,
} from "@shared/helix-present-state-card";
import { getActiveLiveAnswerEnvironmentForThread } from "./live-answer-environment-store";
import { getActiveLiveSituationArtifactForThread } from "./live-situation-artifact-store";
import { listInterpretedEvents } from "./interpreted-event-log-store";

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const line = (input: {
  key: string;
  label: string;
  value: string;
  evidenceRefs?: string[];
  confidence?: number | null;
  updatedAt: string;
}): HelixPresentStateCardLine => ({
  key: input.key,
  label: input.label,
  value: input.value,
  confidence: input.confidence ?? null,
  evidence_refs: input.evidenceRefs ?? [],
  updated_at: input.updatedAt,
});

export function projectPresentStateCard(input: {
  threadId: string;
  roomId?: string | null;
}): HelixPresentStateCard {
  const artifact = getActiveLiveSituationArtifactForThread(input.threadId);
  const environment = getActiveLiveAnswerEnvironmentForThread(input.threadId);
  const interpretedEvents = listInterpretedEvents({
    threadId: input.threadId,
    roomId: input.roomId ?? artifact?.room_id ?? environment?.room_id ?? null,
    limit: 20,
  });
  const latestEvent = interpretedEvents.at(-1) ?? null;
  const now = new Date().toISOString();
  if (artifact && (!input.roomId || artifact.room_id === input.roomId)) {
    const lines = artifact.current_state_lines;
    return {
      schema: HELIX_PRESENT_STATE_CARD_SCHEMA,
      card_id: `present_state:${hashShort([artifact.artifact_id, artifact.updated_at])}`,
      thread_id: artifact.thread_id,
      room_id: artifact.room_id,
      title: "Minecraft Situation",
      status: artifact.status,
      lines: [
        line({ key: "now", label: "Now", value: lines.now, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
        line({ key: "goal", label: "Goal", value: lines.goal, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
        line({ key: "risk", label: "Risk", value: lines.risk, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
        line({ key: "progress", label: "Progress", value: lines.progress, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
        line({ key: "unknowns", label: "Unknowns", value: lines.unknowns, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
        line({ key: "next_check", label: "Next check", value: lines.last_decision, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
      ],
      last_interpreted_event_id: latestEvent?.event_id ?? null,
      go_to_log_target: latestEvent?.event_id ?? null,
      updated_at: artifact.updated_at,
    };
  }
  if (environment && (!input.roomId || environment.room_id === input.roomId)) {
    return {
      schema: HELIX_PRESENT_STATE_CARD_SCHEMA,
      card_id: `present_state:${hashShort([environment.environment_id, environment.updated_at])}`,
      thread_id: environment.thread_id,
      room_id: environment.room_id ?? null,
      title: environment.objective,
      status: environment.status,
      lines: environment.lines
        .filter((entry) => entry.visibility === "answer_card")
        .map((entry) => line({
          key: entry.key,
          label: entry.label,
          value: String(entry.value ?? ""),
          evidenceRefs: entry.evidence_refs,
          confidence: null,
          updatedAt: entry.updated_at,
        })),
      last_interpreted_event_id: latestEvent?.event_id ?? null,
      go_to_log_target: latestEvent?.event_id ?? null,
      updated_at: environment.updated_at,
    };
  }
  return {
    schema: HELIX_PRESENT_STATE_CARD_SCHEMA,
    card_id: `present_state:${hashShort([input.threadId, input.roomId ?? null, latestEvent?.event_id ?? "empty"])}`,
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    title: "Present State",
    status: "paused",
    lines: [
      line({
        key: "now",
        label: "Now",
        value: latestEvent?.summary ?? "No active interpreted situation is available.",
        evidenceRefs: latestEvent?.evidence_refs ?? [],
        confidence: latestEvent?.confidence ?? null,
        updatedAt: latestEvent?.created_at ?? now,
      }),
    ],
    last_interpreted_event_id: latestEvent?.event_id ?? null,
    go_to_log_target: latestEvent?.event_id ?? null,
    updated_at: latestEvent?.created_at ?? now,
  };
}
