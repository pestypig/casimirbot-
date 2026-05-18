export const HELIX_SITUATION_RUN_ACCEPTANCE_SCHEMA =
  "helix.situation_run_acceptance.v1" as const;

export type HelixSituationRunAcceptanceCheck = {
  check: string;
  passed: boolean;
  evidence: string;
};

export type HelixSituationRunAcceptance = {
  schema: typeof HELIX_SITUATION_RUN_ACCEPTANCE_SCHEMA;
  acceptance_id: string;
  scenario:
    | "generic_visual_folder"
    | "direct_ask_handoff"
    | "workstation_affordance"
    | "risk_or_urgent_notice";
  thread_id: string;
  situation_run_id?: string | null;
  source_binding_id?: string | null;
  epoch?: number | null;
  ok: boolean;
  checks: HelixSituationRunAcceptanceCheck[];
  summary: string;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

