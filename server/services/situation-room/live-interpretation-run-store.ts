import crypto from "node:crypto";
import {
  HELIX_LIVE_INTERPRETATION_RUN_SCHEMA,
  type HelixLiveInterpretationLens,
  type HelixLiveInterpretationRun,
} from "@shared/helix-live-interpretation-run";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";

const runsBySituationRun = new Map<string, HelixLiveInterpretationRun>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export const lensesForSituationRun = (run: HelixLiveSituationRun): HelixLiveInterpretationLens[] => {
  if (run.modality_scope === "generic_visual") {
    return [
      "scene_neutral",
      "activity",
      "objects",
      "uncertainty",
      "verifier_lane",
      "workstation_affordance_lane",
      "user_notice_lane",
    ];
  }
  if (run.modality_scope === "minecraft_visual" || run.modality_scope === "minecraft_world") {
    return [
      "scene_neutral",
      "activity",
      "risk_lane",
      "uncertainty",
      "verifier_lane",
      "workstation_affordance_lane",
      "user_notice_lane",
    ];
  }
  return ["scene_neutral", "activity", "uncertainty", "verifier_lane", "user_notice_lane"];
};

const modalityScopeFor = (scope: HelixLiveSituationRun["modality_scope"]): HelixLiveInterpretationRun["modality_scope"] => {
  if (scope === "minecraft_visual" || scope === "minecraft_world") return "minecraft";
  if (scope === "audio_transcript") return "audio";
  if (scope === "document_context") return "document";
  if (scope === "calculator_stream") return "calculator";
  if (scope === "mixed") return "mixed";
  return "generic_visual";
};

export function ensureLiveInterpretationRun(input: {
  run: HelixLiveSituationRun;
  observation: HelixObservationJournalEntry;
  now?: string;
}): HelixLiveInterpretationRun {
  const now = input.now ?? new Date().toISOString();
  const existing = runsBySituationRun.get(input.run.situation_run_id);
  if (existing) {
    const updated = {
      ...existing,
      status: existing.status === "created" ? "active" as const : existing.status,
      updated_at: now,
    };
    runsBySituationRun.set(input.run.situation_run_id, updated);
    return updated;
  }
  const interpretationRun: HelixLiveInterpretationRun = {
    schema: HELIX_LIVE_INTERPRETATION_RUN_SCHEMA,
    interpretation_run_id: `live_interpretation_run:${hashShort([
      input.run.situation_run_id,
      input.observation.observation_id,
    ])}`,
    situation_run_id: input.run.situation_run_id,
    thread_id: input.run.thread_id,
    source_id: input.observation.source_id ?? input.run.source_ids[0] ?? "source:unknown",
    source_binding_id: input.run.source_binding_id,
    seed_observation_ref: input.observation.observation_id,
    seed_summary_ref: input.observation.observation_id,
    seed_epoch: input.run.current_epoch,
    objective_text: input.run.objective_text,
    modality_scope: modalityScopeFor(input.run.modality_scope),
    active_lenses: lensesForSituationRun(input.run),
    status: "active",
    created_at: now,
    updated_at: now,
    assistant_answer: false,
    raw_content_included: false,
  };
  runsBySituationRun.set(input.run.situation_run_id, interpretationRun);
  return interpretationRun;
}

export function listLiveInterpretationRuns(input: {
  threadId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixLiveInterpretationRun[] {
  const limit = Math.max(0, Math.min(300, Math.trunc(input.limit ?? 120)));
  return Array.from(runsBySituationRun.values())
    .filter((run) => !input.threadId || run.thread_id === input.threadId)
    .filter((run) => !input.situationRunId || run.situation_run_id === input.situationRunId)
    .slice(-limit);
}

export function resetLiveInterpretationRunsForTest(): void {
  runsBySituationRun.clear();
}
