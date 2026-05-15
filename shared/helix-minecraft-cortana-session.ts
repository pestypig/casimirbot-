export const HELIX_MINECRAFT_CORTANA_SESSION_RECEIPT_SCHEMA =
  "helix.minecraft_cortana_session_receipt.v1" as const;

export type HelixMinecraftCortanaReadinessStatus =
  | "ready"
  | "needs_profile_link"
  | "needs_minecraft_source"
  | "needs_visual_permission"
  | "blocked";

export type HelixMinecraftCortanaReadinessItem = {
  key:
    | "discord_session"
    | "profile_link"
    | "minecraft_source"
    | "visual_source"
    | "discord_voice"
    | "categorization_jobs"
    | "live_answer_environment"
    | "companion_policy";
  ok: boolean;
  status: HelixMinecraftCortanaReadinessStatus;
  summary: string;
  artifact_ref?: string | null;
};

export type HelixMinecraftCortanaSessionReceipt = {
  schema: typeof HELIX_MINECRAFT_CORTANA_SESSION_RECEIPT_SCHEMA;
  ok: boolean;
  preset: "minecraft_cortana_companion";
  session_id?: string | null;
  thread_id: string;
  room_id?: string | null;
  profile_id?: string | null;
  environment_id?: string | null;
  minecraft_source_id?: string | null;
  visual_source_id?: string | null;
  categorization_job_ids: string[];
  readiness: HelixMinecraftCortanaReadinessItem[];
  message: string;
  error?: string | null;
  assistant_answer: false;
  raw_logs_included: false;
  raw_image_included: false;
  raw_transcript_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
