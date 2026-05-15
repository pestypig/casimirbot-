export const HELIX_LIVE_PIPELINE_ACCEPTANCE_RESULT_SCHEMA =
  "helix.live_pipeline_acceptance_result.v1" as const;

export type HelixLivePipelineAcceptanceScenario = {
  name: string;
  ok: boolean;
  lifecycle_event_ids: string[];
  evidence_refs: string[];
  failures: string[];
};

export type HelixLivePipelineAcceptanceResult = {
  schema: typeof HELIX_LIVE_PIPELINE_ACCEPTANCE_RESULT_SCHEMA;
  pipeline_id: string;
  ok: boolean;
  scenarios: HelixLivePipelineAcceptanceScenario[];
  poison_audit_ok: boolean;
  terminal_authority_ok: boolean;
  assistant_answer_from_pipeline_count: 0;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
};
