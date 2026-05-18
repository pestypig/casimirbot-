import type { HelixAskSourceTarget } from "@shared/helix-ask-source-target-intent";
import type { HelixSituationSourceBindingModality } from "@shared/helix-situation-source-binding";

export type HelixSourceTargetEvidenceGateDecision = {
  schema: "helix.source_target_evidence_gate.v1";
  target_source: HelixAskSourceTarget;
  selected_modalities: HelixSituationSourceBindingModality[];
  excluded_modalities: HelixSituationSourceBindingModality[];
  reason: string;
  assistant_answer: false;
  raw_content_included: false;
};

export function gateEvidenceForSourceTarget(input: {
  target_source: HelixAskSourceTarget;
  available_modalities: HelixSituationSourceBindingModality[];
  mixedRequested?: boolean | null;
  corroborationRequested?: boolean | null;
}): HelixSourceTargetEvidenceGateDecision {
  const available = Array.from(new Set(input.available_modalities));
  const mixed = input.mixedRequested === true || input.corroborationRequested === true;
  const primary = (() => {
    if (mixed) return available;
    if (input.target_source === "visual_capture") return available.filter((modality: HelixSituationSourceBindingModality) => modality === "visual_frame");
    if (input.target_source === "world_event") return available.filter((modality: HelixSituationSourceBindingModality) => modality === "world_event");
    if (input.target_source === "active_doc") return available.filter((modality: HelixSituationSourceBindingModality) => modality === "document_context");
    if (input.target_source === "active_note") return available.filter((modality: HelixSituationSourceBindingModality) => modality === "note_context");
    if (input.target_source === "procedure_memory") return [];
    return available;
  })();
  const selected = Array.from(new Set(primary));
  return {
    schema: "helix.source_target_evidence_gate.v1",
    target_source: input.target_source,
    selected_modalities: selected,
    excluded_modalities: available.filter((modality: HelixSituationSourceBindingModality) => !selected.includes(modality)),
    reason: mixed
      ? "mixed_or_corroboration_requested"
      : `target_source_${input.target_source}_selected_primary_modalities`,
    assistant_answer: false,
    raw_content_included: false,
  };
}
