export const HELIX_SOURCE_BINDING_STATUS_SCHEMA =
  "helix.source_binding_status.v1" as const;

export type HelixSourceBindingStatusValue =
  | "bound"
  | "observed_unbound"
  | "stale"
  | "missing"
  | "client_adoption_pending"
  | "client_adoption_failed";

export type HelixSourceBindingStatus = {
  schema: typeof HELIX_SOURCE_BINDING_STATUS_SCHEMA;
  source_id: string;
  thread_id?: string | null;
  environment_id?: string | null;
  situation_run_id?: string | null;
  modality: string;
  status: HelixSourceBindingStatusValue;
  evidence_refs: string[];
  next_required_action?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
