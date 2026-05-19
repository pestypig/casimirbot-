export type HelixEvidenceSourceKind =
  | "visual_capture"
  | "display_audio_transcript"
  | "minecraft_world_events"
  | "docs_viewer"
  | "notes"
  | "calculator_stream"
  | "process_graph";

export const HELIX_EVIDENCE_SOURCE_KINDS: HelixEvidenceSourceKind[] = [
  "visual_capture",
  "display_audio_transcript",
  "minecraft_world_events",
  "docs_viewer",
  "notes",
  "calculator_stream",
  "process_graph",
];

export const helixEvidenceSourceKindForModality = (modality: string | null | undefined): HelixEvidenceSourceKind => {
  if (modality === "audio_transcript") return "display_audio_transcript";
  if (modality === "world_event") return "minecraft_world_events";
  if (modality === "document_context") return "docs_viewer";
  if (modality === "note_context") return "notes";
  if (modality === "calculator_stream") return "calculator_stream";
  if (modality === "process_graph") return "process_graph";
  return "visual_capture";
};

export const helixDefaultModalityForSourceKind = (sourceKind: HelixEvidenceSourceKind): string => {
  if (sourceKind === "display_audio_transcript") return "audio_transcript";
  if (sourceKind === "minecraft_world_events") return "world_event";
  if (sourceKind === "docs_viewer") return "document_context";
  if (sourceKind === "notes") return "note_context";
  if (sourceKind === "calculator_stream") return "calculator_stream";
  if (sourceKind === "process_graph") return "process_graph";
  return "visual_frame";
};
