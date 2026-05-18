import crypto from "node:crypto";
import {
  HELIX_SITUATION_EVIDENCE_SELECTION_SCHEMA,
  type HelixSituationEvidenceSelection,
} from "@shared/helix-situation-evidence-selection";
import type { HelixActiveSituationContext } from "@shared/helix-active-situation-context";
import type { HelixDeicticReference } from "@shared/helix-deictic-reference";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = (values: string[]): string[] =>
  Array.from(new Set(values.map((value: string) => value.trim()).filter(Boolean)));

export function selectSituationEvidence(input: {
  threadId: string;
  activeContext: HelixActiveSituationContext;
  deicticReference?: HelixDeicticReference | null;
  askingHistory?: boolean;
}): HelixSituationEvidenceSelection {
  const context = input.activeContext;
  const exclusions: string[] = [
    "raw_images_excluded",
    "raw_audio_excluded",
    "raw_logs_excluded",
    "assistant_answers_excluded",
  ];
  if (context.status === "missing") exclusions.push("no_active_situation_run");
  if (context.status === "unbound") exclusions.push("unbound_source_evidence_excluded");
  if (context.status === "stale" && input.askingHistory !== true) exclusions.push("stale_evidence_caveat");
  if (context.latest_observation_refs.length === 0) exclusions.push("missing_observation_refs");
  if (context.latest_field_evaluation_refs.length === 0) exclusions.push("missing_field_evaluation_refs");
  const answerable =
    Boolean(context.situation_run_id) &&
    (context.status === "active" || context.status === "stale") &&
    (
      context.latest_observation_refs.length > 0 ||
      context.latest_field_evaluation_refs.length > 0 ||
      context.latest_probe_result_refs.length > 0 ||
      context.latest_closure_refs.length > 0
    );
  return {
    schema: HELIX_SITUATION_EVIDENCE_SELECTION_SCHEMA,
    selection_id: `situation_evidence_selection:${hashShort([
      input.threadId,
      context.context_id,
      input.deicticReference?.reference_id ?? null,
      context.latest_epoch ?? null,
    ])}`,
    thread_id: input.threadId,
    situation_run_id: context.situation_run_id ?? null,
    deictic_reference_id: input.deicticReference?.reference_id ?? null,
    selected_observation_refs: unique(context.latest_observation_refs).slice(-3),
    selected_field_evaluation_refs: unique(context.latest_field_evaluation_refs).slice(-10),
    selected_probe_result_refs: unique(context.latest_probe_result_refs).slice(-6),
    selected_epoch_closure_refs: unique(context.latest_closure_refs).slice(-4),
    selected_source_descriptor_refs: unique(context.latest_source_descriptor_refs).slice(-6),
    exclusion_reasons: unique(exclusions),
    answerable,
    answerability_reason: answerable
      ? context.status === "stale"
        ? "Selected stale but thread-bound SituationRun evidence; answer must include a freshness caveat."
        : "Selected thread-bound SituationRun evidence."
      : context.freshness_summary,
    assistant_answer: false,
    raw_content_included: false,
  };
}
