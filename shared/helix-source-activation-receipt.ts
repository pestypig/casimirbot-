import type {
  HelixSituationSourceModality,
  HelixSituationSourceStatus,
} from "./helix-situation-source-capability";

export const HELIX_SOURCE_ACTIVATION_RECEIPT_SCHEMA =
  "helix.source_activation_receipt.v1" as const;

export type HelixSourceActivationRequestedStatus =
  | "permission_required"
  | "active"
  | "paused"
  | "stopped";

export type HelixSourceActivationReceipt = {
  schema: typeof HELIX_SOURCE_ACTIVATION_RECEIPT_SCHEMA;
  receipt_id: string;
  source_id: string;
  thread_id: string;
  modality: HelixSituationSourceModality;
  requested_status: HelixSourceActivationRequestedStatus;
  observed_status: HelixSituationSourceStatus;
  ok: boolean;
  summary: string;
  next_required_action?: string | null;
  evidence_refs: string[];
  raw_content_included: false;
  assistant_answer: false;
};
