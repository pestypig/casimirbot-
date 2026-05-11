import type { LivePipelineTransformKind } from "@shared/helix-live-workstation-pipeline";

export type LiveTransformRegistryEntry = {
  kind: LivePipelineTransformKind;
  title: string;
  deterministic_default: boolean;
  raw_transcript_included: false;
};

export const LIVE_TRANSFORM_REGISTRY: LiveTransformRegistryEntry[] = [
  { kind: "sentence_summary", title: "Sentence summary", deterministic_default: true, raw_transcript_included: false },
  { kind: "rolling_summary", title: "Rolling summary", deterministic_default: true, raw_transcript_included: false },
  { kind: "philosophy_compare", title: "Philosophy comparison", deterministic_default: false, raw_transcript_included: false },
  { kind: "claim_evidence_extract", title: "Claim/evidence extract", deterministic_default: true, raw_transcript_included: false },
  { kind: "contradiction_watch", title: "Contradiction watch", deterministic_default: true, raw_transcript_included: false },
  { kind: "methods_note_writer", title: "Methods note writer", deterministic_default: true, raw_transcript_included: false },
  { kind: "custom_prompt_transform", title: "Custom prompt transform", deterministic_default: false, raw_transcript_included: false },
];

export function getLiveTransformRegistryEntry(kind: LivePipelineTransformKind): LiveTransformRegistryEntry | null {
  return LIVE_TRANSFORM_REGISTRY.find((entry) => entry.kind === kind) ?? null;
}
