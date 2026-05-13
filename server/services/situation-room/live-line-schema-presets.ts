import {
  LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS,
  type LiveAnswerEnvironmentPreset,
  type LiveAnswerLineDefinition,
} from "@shared/helix-live-answer-environment";

export function resolveLiveLineSchemaPreset(preset: LiveAnswerEnvironmentPreset | string | null | undefined): LiveAnswerLineDefinition[] {
  const key =
    preset === "calculator_prime_stream" ||
    preset === "calculator_equation_interpreter" ||
    preset === "physics_stability_tracker" ||
    preset === "browser_video_argument_tracker" ||
    preset === "browser_video_tracker" ||
    preset === "discord_interpreter" ||
    preset === "research_session" ||
    preset === "minecraft_run_monitor"
      ? preset
      : "minecraft_run_monitor";
  return LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS[key].map((line: LiveAnswerLineDefinition) => ({ ...line }));
}
