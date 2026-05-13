import {
  LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS,
  type LiveAnswerEnvironmentMode,
  type LiveAnswerEnvironmentPreset,
  type LiveAnswerLineDefinition,
} from "./helix-live-answer-environment";

export type LiveAnswerEnvironmentRecipe = {
  recipe_id: LiveAnswerEnvironmentPreset | "research_session_tracker" | "custom_live_answer";
  aliases: string[];
  objective_template: string;
  default_line_schema: LiveAnswerLineDefinition[];
  source_requirements: string[];
  default_mode: LiveAnswerEnvironmentMode;
  safety_policy: {
    raw_logs_included: false;
    raw_audio_included: false;
    deterministic_content_role: "observation_not_assistant_answer";
  };
};

const safety = {
  raw_logs_included: false,
  raw_audio_included: false,
  deterministic_content_role: "observation_not_assistant_answer" as const,
} as const;

export const LIVE_ANSWER_ENVIRONMENT_RECIPES: LiveAnswerEnvironmentRecipe[] = [
  {
    recipe_id: "minecraft_run_monitor",
    aliases: ["minecraft", "minehut", "game run", "danger and progress"],
    objective_template: "Watch my Minecraft run and tell me about danger or progress.",
    default_line_schema: LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS.minecraft_run_monitor,
    source_requirements: ["minecraft_world_events"],
    default_mode: "text_only",
    safety_policy: safety,
  },
  {
    recipe_id: "calculator_prime_stream",
    aliases: ["prime stream", "prime generator", "next primes", "calculator stream"],
    objective_template: "Set up a live prime number generator and show the next primes as they are found.",
    default_line_schema: LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS.calculator_prime_stream,
    source_requirements: ["calculator_series"],
    default_mode: "text_only",
    safety_policy: safety,
  },
  {
    recipe_id: "calculator_equation_interpreter",
    aliases: ["live equation", "equation interpreter", "explain equation value", "equation live source"],
    objective_template: "Use the current calculator equation as a live source and explain each solved value in context.",
    default_line_schema: LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS.calculator_equation_interpreter,
    source_requirements: ["calculator_series"],
    default_mode: "text_only",
    safety_policy: safety,
  },
  {
    recipe_id: "physics_stability_tracker",
    aliases: ["physics stability", "residual", "simulation", "stabilizes"],
    objective_template: "Set up a live stability tracker and report compact residual changes.",
    default_line_schema: LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS.physics_stability_tracker,
    source_requirements: ["physics_simulation"],
    default_mode: "text_only",
    safety_policy: safety,
  },
  {
    recipe_id: "browser_video_argument_tracker",
    aliases: ["video argument", "claims evidence contradictions"],
    objective_template: "Track this video and keep claims, evidence, and contradictions updated.",
    default_line_schema: LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS.browser_video_argument_tracker,
    source_requirements: ["browser_audio_transcript", "screen_summary"],
    default_mode: "text_only",
    safety_policy: safety,
  },
  {
    recipe_id: "discord_interpreter",
    aliases: ["discord interpreter", "voice room interpreter"],
    objective_template: "Create a live interpreter for this Discord conversation.",
    default_line_schema: LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS.discord_interpreter,
    source_requirements: ["browser_audio_transcript"],
    default_mode: "text_only",
    safety_policy: safety,
  },
  {
    recipe_id: "research_session_tracker",
    aliases: ["research session", "hypothesis evidence caveats"],
    objective_template: "Follow this research session and keep hypothesis, evidence, and caveats live.",
    default_line_schema: LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS.research_session,
    source_requirements: ["manual_feed", "screen_summary"],
    default_mode: "text_only",
    safety_policy: safety,
  },
  {
    recipe_id: "custom_live_answer",
    aliases: ["custom live answer"],
    objective_template: "Create a custom live answer environment.",
    default_line_schema: LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS.minecraft_run_monitor,
    source_requirements: [],
    default_mode: "text_only",
    safety_policy: safety,
  },
];

export function findLiveAnswerEnvironmentRecipe(transcript: string): LiveAnswerEnvironmentRecipe | null {
  const normalized = transcript.toLowerCase();
  return LIVE_ANSWER_ENVIRONMENT_RECIPES.find((recipe: LiveAnswerEnvironmentRecipe) =>
    recipe.aliases.some((alias: string) => normalized.includes(alias)),
  ) ?? null;
}
