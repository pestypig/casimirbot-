import {
  HELIX_SITUATION_CONSTRUCT_RECIPE_SCHEMA,
  type HelixSituationConstructRecipe,
  type HelixSituationConstructRecipeId,
} from "@shared/helix-situation-construct-recipe";

const evidenceOnlySafety = {
  assistant_answer: false,
  ask_instruction_authority: "none",
  instruction_authority: "none",
  raw_content_included: false,
  raw_audio_included: false,
} as const;

const noAuthorityPolicy = {
  may_execute_tools: false,
  allowed_tools: [],
  may_spawn_workers: false,
  may_speak: false,
  may_surface_user_text: false,
  requires_user_confirmation: true,
  witness_only: false,
};

export const SITUATION_CONSTRUCT_RECIPES: HelixSituationConstructRecipe[] = [
  {
    schema: HELIX_SITUATION_CONSTRUCT_RECIPE_SCHEMA,
    recipe_id: "auntie_dottie_witness",
    title: "Auntie Dottie Witness",
    description: "Creates a witness-only Dottie construct from observer, commentary, voice proposal, and bounded worker policy receipts.",
    required_inputs: ["thread_id", "room_id", "target_run_id"],
    optional_inputs: ["source_ids", "voice_mode", "commentary_cadence", "objective", "max_chars"],
    creates_constructs: [
      "dottie_manifest",
      "live_environment",
      "live_answer_output",
      "commentary_policy",
      "observer",
      "voice_policy",
      "field_worker_policy",
    ],
    default_outputs: ["typed_commentary", "live_answer_environment", "voice_proposal"],
    default_policy: {
      ...noAuthorityPolicy,
      witness_only: true,
    },
    safety: evidenceOnlySafety,
  },
  {
    schema: HELIX_SITUATION_CONSTRUCT_RECIPE_SCHEMA,
    recipe_id: "browser_audio_transcriber",
    title: "Browser Audio Transcriber",
    description: "Binds browser/display audio sources to a receipt-backed transcription job and optional live answer projection.",
    required_inputs: ["thread_id", "room_id", "source_ids"],
    optional_inputs: ["label", "language", "output", "speaker_labels", "live_answer_environment"],
    creates_constructs: ["source_binding", "transcription_job", "commentary_policy", "live_environment", "note_output"],
    default_outputs: ["transcript_stream", "typed_commentary"],
    default_policy: noAuthorityPolicy,
    safety: evidenceOnlySafety,
  },
  {
    schema: HELIX_SITUATION_CONSTRUCT_RECIPE_SCHEMA,
    recipe_id: "minecraft_route_watcher",
    title: "Minecraft Route Watcher",
    description: "Creates route evidence and bounded watch constructs for Minecraft navigation state.",
    required_inputs: ["thread_id", "room_id", "source_ids", "minecraft_world_id"],
    optional_inputs: ["actor_label", "route_objective", "salience_policy"],
    creates_constructs: ["source_binding", "route_evidence_view", "field_worker_policy", "commentary_policy"],
    default_outputs: ["route_evidence_view", "typed_commentary", "live_answer_environment"],
    default_policy: {
      ...noAuthorityPolicy,
      may_execute_tools: true,
      allowed_tools: [
        "live_env.query_navigation_state",
        "live_env.query_world_events",
        "live_env.query_source_health",
        "live_env.query_constructs",
        "minecraft.query_navigation_state",
      ],
    },
    safety: evidenceOnlySafety,
  },
  {
    schema: HELIX_SITUATION_CONSTRUCT_RECIPE_SCHEMA,
    recipe_id: "live_source_summarizer",
    title: "Live Source Summarizer",
    description: "Creates a compact commentary output over bound live sources without answer authority.",
    required_inputs: ["thread_id", "room_id", "source_ids"],
    optional_inputs: ["summary_cadence", "live_answer_environment"],
    creates_constructs: ["source_binding", "commentary_policy", "commentary_output", "live_environment"],
    default_outputs: ["typed_commentary", "live_answer_environment"],
    default_policy: noAuthorityPolicy,
    safety: evidenceOnlySafety,
  },
  {
    schema: HELIX_SITUATION_CONSTRUCT_RECIPE_SCHEMA,
    recipe_id: "translation_pair",
    title: "Translation Pair",
    description: "Creates source bindings and commentary policy for a translation mediator construct.",
    required_inputs: ["thread_id", "room_id", "source_ids", "target_language", "native_language"],
    optional_inputs: ["voice_mode", "speaker_labels"],
    creates_constructs: ["source_binding", "commentary_policy", "commentary_output"],
    default_outputs: ["typed_commentary", "note"],
    default_policy: noAuthorityPolicy,
    safety: evidenceOnlySafety,
  },
  {
    schema: HELIX_SITUATION_CONSTRUCT_RECIPE_SCHEMA,
    recipe_id: "source_health_watch",
    title: "Source Health Watch",
    description: "Creates source-health watch constructs that emit missing-evidence commentary only.",
    required_inputs: ["thread_id", "room_id", "source_ids"],
    optional_inputs: ["staleness_ms", "heartbeat_policy"],
    creates_constructs: ["source_binding", "field_worker_policy", "commentary_policy"],
    default_outputs: ["typed_commentary", "note"],
    default_policy: noAuthorityPolicy,
    safety: evidenceOnlySafety,
  },
];

export function listSituationConstructRecipes(): HelixSituationConstructRecipe[] {
  return [...SITUATION_CONSTRUCT_RECIPES];
}

export function getSituationConstructRecipe(
  recipeId: HelixSituationConstructRecipeId | string,
): HelixSituationConstructRecipe | null {
  return SITUATION_CONSTRUCT_RECIPES.find((recipe) => recipe.recipe_id === recipeId) ?? null;
}
