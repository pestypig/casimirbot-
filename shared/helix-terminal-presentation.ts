export const HELIX_TERMINAL_PRESENTATION_SCHEMA =
  "helix.terminal_presentation.v1" as const;

export type HelixTerminalPresentationStyle = "brief" | "operational" | "voice" | "debug";

export type HelixTerminalPresentation = {
  schema: typeof HELIX_TERMINAL_PRESENTATION_SCHEMA;
  presentation_id: string;
  turn_id: string;
  terminal_artifact_kind: string;
  concise_text: string;
  expansion_available: boolean;
  expansion_ref?: string | null;
  distillation_ref?: string | null;
  receipt_snapshot_ref?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
