export const HELIX_RECEIPT_PRESENTATION_SNAPSHOT_SCHEMA =
  "helix.receipt_presentation_snapshot.v1" as const;

export type HelixReceiptPresentationSnapshot = {
  schema: typeof HELIX_RECEIPT_PRESENTATION_SNAPSHOT_SCHEMA;
  snapshot_id: string;
  turn_id: string;
  artifact_kind: string;
  raw_receipt_ref: string;
  full_summary: string;
  important_state: Record<string, unknown>;
  assistant_answer: false;
  raw_content_included: false;
};
