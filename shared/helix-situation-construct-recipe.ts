import type {
  HelixSituationConstructOutputKind,
  HelixSituationConstructType,
} from "./helix-situation-construct";

export const HELIX_SITUATION_CONSTRUCT_RECIPE_SCHEMA =
  "helix.situation_construct_recipe.v1" as const;

export const HELIX_SITUATION_CONSTRUCT_RECIPE_RUN_SCHEMA =
  "helix.situation_construct_recipe_run.v1" as const;

export type HelixSituationConstructRecipeId =
  | "auntie_dottie_witness"
  | "browser_audio_transcriber"
  | "minecraft_route_watcher"
  | "live_source_summarizer"
  | "translation_pair"
  | "source_health_watch";

export type HelixSituationConstructRecipeInputKey =
  | "thread_id"
  | "room_id"
  | "source_ids"
  | "target_run_id"
  | "target_language"
  | "native_language"
  | "minecraft_world_id";

export type HelixSituationConstructRecipe = {
  schema: typeof HELIX_SITUATION_CONSTRUCT_RECIPE_SCHEMA;
  recipe_id: HelixSituationConstructRecipeId;
  title: string;
  description: string;
  required_inputs: HelixSituationConstructRecipeInputKey[];
  optional_inputs: string[];
  creates_constructs: HelixSituationConstructType[];
  default_outputs: HelixSituationConstructOutputKind[];
  default_policy: {
    may_execute_tools: boolean;
    allowed_tools?: string[];
    may_spawn_workers: boolean;
    may_speak: boolean;
    may_surface_user_text: boolean;
    requires_user_confirmation: boolean;
    witness_only?: boolean;
  };
  safety: {
    assistant_answer: false;
    ask_instruction_authority: "none";
    instruction_authority: "none";
    raw_content_included: false;
    raw_audio_included: false;
  };
};

export type HelixSituationConstructRecipeRunStatus =
  | "planned"
  | "applied_as_receipts"
  | "active"
  | "partially_applied"
  | "blocked";

export type HelixSituationConstructRecipeRun = {
  schema: typeof HELIX_SITUATION_CONSTRUCT_RECIPE_RUN_SCHEMA;
  run_id: string;
  recipe_id: HelixSituationConstructRecipeId;
  thread_id: string;
  room_id: string;
  status: HelixSituationConstructRecipeRunStatus;
  created_construct_ids: string[];
  receipt_refs: string[];
  commentary_refs: string[];
  missing_evidence: string[];
  assistant_answer: false;
  raw_content_included: false;
  instruction_authority: "none";
  created_at: string;
};
