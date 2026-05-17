import crypto from "node:crypto";
import {
  HELIX_LIVE_FIELD_EVALUATION_SCHEMA,
  type HelixLiveFieldEvaluation,
} from "@shared/helix-live-field-evaluation";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import { ensureLiveSituationRunForEnvironment } from "./live-situation-run-store";
import { registerFieldWorkersForSituationRun } from "./live-field-worker-registry";
import { recordLiveFieldEvaluation } from "./live-field-evaluation-store";
import { arbitrateLiveSituationHandoffs } from "./live-handoff-arbiter";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const genericActivity = (text: string): string => {
  const normalized = lower(text);
  if (/\b(?:file explorer|folder|directory|files?|\.wav|\.asd|audio export|image files?)\b/.test(normalized)) {
    return "Likely browsing, reviewing, or organizing visible workstation files.";
  }
  if (/\b(?:document|pdf|page|paper)\b/.test(normalized)) return "Likely viewing or reviewing a document.";
  if (/\b(?:browser|tab|website)\b/.test(normalized)) return "Likely inspecting a browser tab.";
  if (/\b(?:editor|code|terminal|ide)\b/.test(normalized)) return "Likely reviewing or editing workstation content.";
  return "Likely inspecting the current screen; user intent is not stated.";
};

const genericObjects = (text: string): string => {
  const normalized = lower(text);
  const objects: string[] = [];
  if (/\bfile explorer\b/.test(normalized)) objects.push("file explorer window");
  if (/\bfolder\b/.test(normalized)) objects.push("folder view");
  if (/\b(?:\.wav|audio|sound)\b/.test(normalized)) objects.push("audio files");
  if (/\b\.asd\b/.test(normalized)) objects.push("Ableton analysis files");
  if (/\bimage files?\b|\bpng\b|\bjpg\b/.test(normalized)) objects.push("image files");
  if (/\bdocument|pdf|page\b/.test(normalized)) objects.push("document content");
  if (/\bbrowser|tab\b/.test(normalized)) objects.push("browser tab");
  return objects.length > 0 ? objects.join(", ") : "Visible UI elements and screen contents from the latest observation.";
};

const corroborationState = (input: {
  genericVisual: boolean;
  fieldKey: string;
}) => ({
  visual_frame: "present" as const,
  audio_transcript: input.genericVisual ? "missing_not_required" as const : "not_applicable" as const,
  user_steering: input.genericVisual ? "missing_not_required" as const : "not_applicable" as const,
  world_event: input.genericVisual ? "not_applicable" as const : "missing_not_required" as const,
});

const evaluateField = (input: {
  environment: LiveAnswerEnvironment;
  runId: string;
  workerId: string;
  fieldKey: string;
  observation: HelixObservationJournalEntry;
  genericVisual: boolean;
  now: string;
}): HelixLiveFieldEvaluation => {
  const text = input.observation.text;
  const fieldKey = input.fieldKey;
  const evidenceRefs = Array.from(new Set([
    input.observation.observation_id,
    ...(input.observation.evidence_refs ?? []),
  ])).slice(-12);
  let value = text;
  let status: HelixLiveFieldEvaluation["status"] = "supported";
  let confidence = input.observation.confidence ?? 0.68;
  let missingEvidence: string[] = [];
  let nextCheck = "Compare the next observation against this field.";
  if (input.genericVisual) {
    if (fieldKey === "scene") value = text;
    else if (fieldKey === "activity") {
      value = genericActivity(text);
      status = "tentative";
      confidence = clamp(confidence - 0.08);
      missingEvidence = ["No audio/user steering corroboration."];
    } else if (fieldKey === "objects" || fieldKey === "participants") {
      value = genericObjects(text);
      status = "supported";
    } else if (fieldKey === "evidence") {
      value = `Latest visual observation ${input.observation.observation_id} supports this field.`;
    } else if (fieldKey === "uncertainty") {
      value = "User intent is unknown without steering or transcript evidence.";
      status = "uncertain";
      confidence = 0.5;
      missingEvidence = ["No audio/user steering corroboration."];
    } else if (fieldKey === "next_check") {
      value = "Compare the next captured frame for selection, window, or content changes.";
      status = "supported";
      confidence = 0.62;
      nextCheck = value;
    } else if (fieldKey === "last_update") {
      value = `Visual observation updated at ${input.observation.created_at}.`;
      confidence = 0.72;
    }
    if (fieldKey !== "next_check") nextCheck = "Compare the next captured frame for selection, window, or content changes.";
  } else {
    if (fieldKey === "place") value = text;
    else if (fieldKey === "risk") {
      value = "World-event risk source is missing; no current risk is confirmed from visual evidence alone.";
      status = "uncertain";
      confidence = 0.35;
      missingEvidence = ["World-event source is missing or not fresh."];
    } else if (fieldKey === "missing_evidence") {
      value = "World-event source is missing or not fresh; no event corroboration is attached.";
      status = "uncertain";
      confidence = 0.45;
      missingEvidence = ["World-event source is missing or not fresh."];
    } else if (fieldKey === "next_check") {
      value = "Capture the next frame or attach a fresh world-event source.";
      nextCheck = value;
    }
  }
  const expiresAt = new Date(Date.parse(input.now) + 45_000).toISOString();
  return {
    schema: HELIX_LIVE_FIELD_EVALUATION_SCHEMA,
    evaluation_id: `live_field_eval:${hashShort([
      input.runId,
      input.workerId,
      fieldKey,
      value,
      input.observation.observation_id,
    ])}`,
    worker_id: input.workerId,
    situation_run_id: input.runId,
    thread_id: input.environment.thread_id,
    environment_id: input.environment.environment_id,
    field_key: fieldKey,
    value,
    status,
    confidence,
    evidence_refs: evidenceRefs,
    missing_evidence: missingEvidence,
    corroboration_state: corroborationState({ genericVisual: input.genericVisual, fieldKey }),
    next_check: nextCheck,
    expires_at: expiresAt,
    role: "ui_projection",
    assistant_answer: false,
    raw_content_included: false,
  };
};

export function runLiveFieldWorkersForObservation(input: {
  environment: LiveAnswerEnvironment;
  observation: HelixObservationJournalEntry | null;
  now?: string;
}) {
  if (!input.observation) {
    return {
      run: null,
      workers: [],
      evaluations: [],
      arbitration: null,
      assistant_answer: false as const,
      raw_content_included: false as const,
    };
  }
  const now = input.now ?? new Date().toISOString();
  const run = ensureLiveSituationRunForEnvironment({
    environment: input.environment,
    now,
  });
  const workers = registerFieldWorkersForSituationRun({
    run,
    environment: input.environment,
  });
  const genericVisual = run.modality_scope === "generic_visual";
  const evaluations = workers
    .filter((worker) => worker.status === "active")
    .map((worker) => recordLiveFieldEvaluation(evaluateField({
      environment: input.environment,
      runId: run.situation_run_id,
      workerId: worker.worker_id,
      fieldKey: worker.field_key,
      observation: input.observation as HelixObservationJournalEntry,
      genericVisual,
      now,
    })));
  const arbitration = arbitrateLiveSituationHandoffs({ run, evaluations });
  return {
    run,
    workers,
    evaluations,
    arbitration,
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
}
