export const HELIX_DOTTIE_MANIFEST_RUN_SCHEMA =
  "helix.dottie_manifest_run.v1" as const;

export type HelixDottieManifestRunStep =
  | "live_answer_environment"
  | "commentary_policy"
  | "observer_subscription"
  | "voice_policy"
  | "field_worker_policy";

export type HelixDottieManifestRunStepStatus =
  | "receipt_only"
  | "created"
  | "blocked"
  | "skipped";

export type HelixDottieManifestRunStatus =
  | "planned"
  | "applied_as_receipts"
  | "partially_applied"
  | "active"
  | "blocked";

export type HelixDottieManifestRun = {
  schema: typeof HELIX_DOTTIE_MANIFEST_RUN_SCHEMA;
  run_id: string;
  preset_id: "auntie_dottie";
  thread_id: string;
  room_id: string;
  environment_id?: string | null;
  status: HelixDottieManifestRunStatus;
  preset_ref: string;
  receipt_refs: string[];
  commentary_refs: string[];
  applied_steps: Array<{
    step: HelixDottieManifestRunStep;
    status: HelixDottieManifestRunStepStatus;
    artifact_ref?: string | null;
    missing_evidence?: string[];
  }>;
  safety: {
    command_lane_enabled: false;
    assistant_answer: false;
    raw_content_included: false;
    instruction_authority: "none";
  };
  created_at: string;
  updated_at: string;
};
