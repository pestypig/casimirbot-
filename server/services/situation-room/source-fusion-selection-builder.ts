import crypto from "node:crypto";
import {
  HELIX_SOURCE_FUSION_SELECTION_SCHEMA,
  type HelixSourceFusionSelection,
} from "@shared/helix-source-fusion-selection";
import type { HelixSituationSourceBindingModality } from "@shared/helix-situation-source-binding";

const selections: HelixSourceFusionSelection[] = [];

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniq = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => String(value ?? "").trim()).filter(Boolean)));

export function recordSourceFusionSelection(input: {
  situation_run_id: string;
  epoch: number;
  thread_id: string;
  source_set_ref: string;
  field_key: string;
  selected_modalities: HelixSituationSourceBindingModality[];
  selected_evidence_refs: string[];
  excluded_evidence_refs?: string[] | null;
  exclusion_reasons?: string[] | null;
  authority_reason: string;
}): HelixSourceFusionSelection {
  const selection: HelixSourceFusionSelection = {
    schema: HELIX_SOURCE_FUSION_SELECTION_SCHEMA,
    selection_id: `source_fusion_selection:${hashShort([
      input.situation_run_id,
      input.epoch,
      input.field_key,
      input.selected_modalities,
      input.selected_evidence_refs,
      input.excluded_evidence_refs,
      input.authority_reason,
    ])}`,
    situation_run_id: input.situation_run_id,
    epoch: input.epoch,
    thread_id: input.thread_id,
    source_set_ref: input.source_set_ref,
    field_key: input.field_key,
    selected_modalities: Array.from(new Set(input.selected_modalities)),
    selected_evidence_refs: uniq(input.selected_evidence_refs),
    excluded_evidence_refs: uniq(input.excluded_evidence_refs ?? []),
    exclusion_reasons: uniq(input.exclusion_reasons ?? []),
    authority_reason: input.authority_reason,
    assistant_answer: false,
    raw_content_included: false,
  };
  selections.push(selection);
  return selection;
}

export function listSourceFusionSelections(input: {
  situationRunId?: string | null;
  threadId?: string | null;
  fieldKey?: string | null;
} = {}): HelixSourceFusionSelection[] {
  return selections
    .filter((entry: HelixSourceFusionSelection) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry: HelixSourceFusionSelection) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixSourceFusionSelection) => !input.fieldKey || entry.field_key === input.fieldKey);
}

export function resetSourceFusionSelectionsForTest(): void {
  selections.length = 0;
}
