import type {
  LiveAnswerEnvironmentPreset,
  LiveAnswerLineDefinition,
} from "@shared/helix-live-answer-environment";
import { findLiveAnswerEnvironmentRecipe } from "@shared/helix-live-answer-recipes";

const has = (transcript: string, pattern: RegExp): boolean => pattern.test(transcript);

export function isLiveAnswerEnvironmentIntent(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) return false;
  if (/\blive\s+answer\s+environment\b/.test(normalized)) return true;
  if (/\bcreate\s+(?:a\s+)?live\b/.test(normalized) && /\b(?:environment|monitor|tracker|readout|artifact)\b/.test(normalized)) return true;
  if (/\btrack\s+this\s+video\b/.test(normalized)) return true;
  if (/\bfollow\s+this\s+research\s+session\b/.test(normalized)) return true;
  if (/\bwatch\s+my\s+minecraft\s+run\b/.test(normalized)) return true;
  if (/\b(?:prime\s+number|next\s+primes|prime\s+generator|calculator\s+(?:series|stream)|live\s+prime)\b/.test(normalized)) return true;
  if (/\b(?:track|monitor|set\s+up).*?\b(?:simulation|residual|stability)\b/.test(normalized)) return true;
  if (/\bcreate\s+(?:a\s+)?live\s+.*\b(?:discord|minecraft|video|research|calculator|prime|simulation)\b/.test(normalized)) return true;
  return false;
}

export function inferLiveAnswerEnvironmentPreset(transcript: string): LiveAnswerEnvironmentPreset {
  const normalized = transcript.trim().toLowerCase();
  const recipe = findLiveAnswerEnvironmentRecipe(normalized);
  if (recipe) {
    if (recipe.recipe_id === "research_session_tracker") return "research_session";
    if (recipe.recipe_id === "custom_live_answer") return "custom";
    return recipe.recipe_id;
  }
  if (has(normalized, /\bprime\s+number|next\s+primes|prime\s+generator|calculator\s+(?:series|stream)|live\s+prime\b/)) return "calculator_prime_stream";
  if (has(normalized, /\bphysics|simulation|residual|stability|stabilizes?|tolerance\b/)) return "physics_stability_tracker";
  if (has(normalized, /\bdiscord|call|speaker|interpreter|translation\b/)) return "discord_interpreter";
  if (has(normalized, /\bvideo|claim|evidence|contradiction|segment\b/)) return "browser_video_argument_tracker";
  if (has(normalized, /\bresearch|hypothesis|caveat|computation|paper\b/)) return "research_session";
  if (has(normalized, /\bminecraft|minehut|mine\s*hut|game|run\b/)) return "minecraft_run_monitor";
  return "custom";
}

export function inferLiveAnswerEnvironmentSourceArgs(transcript: string): {
  room_id?: string;
  source_ids?: string[];
  graph_id?: string;
} {
  const preset = inferLiveAnswerEnvironmentPreset(transcript);
  if (preset === "minecraft_run_monitor") {
    return {
      room_id: "room:minecraft-minehut",
      source_ids: ["source:minecraft-server"],
    };
  }
  if (preset === "calculator_prime_stream") {
    return {
      source_ids: ["source:calculator-prime-stream"],
    };
  }
  if (preset === "physics_stability_tracker") {
    return {
      source_ids: ["source:physics-simulation"],
    };
  }
  return {};
}

export function buildLiveAnswerEnvironmentArgs(args: {
  transcript: string;
  sessionId?: string | null;
  line_schema?: LiveAnswerLineDefinition[] | null;
}): Record<string, unknown> {
  const normalized = args.transcript.trim().toLowerCase();
  const preset = inferLiveAnswerEnvironmentPreset(normalized);
  const mode =
    /\bcritical\s+voice\b/.test(normalized)
      ? "critical_voice"
      : /\bvoice\s+on\s+confirm|confirm\s+(?:before\s+)?(?:voice|speaking|speak)\b/.test(normalized)
        ? "voice_on_confirm"
        : /\bdirect\s+address(?:\s+only)?\b/.test(normalized)
          ? "direct_address_only"
          : "text_only";
  return {
    thread_id: "helix-ask:desktop",
    objective: args.transcript.trim(),
    preset,
    mode,
    ...inferLiveAnswerEnvironmentSourceArgs(args.transcript),
    ...(preset === "calculator_prime_stream"
      ? {
          source_config: {
            generator: "next_prime",
            start: 2,
            tick_rate_ms: 1000,
            max_ticks: 100,
            primality_check: "trial_division",
          },
        }
      : {}),
    ...(preset === "physics_stability_tracker"
      ? {
          source_config: {
            expression: "expected + amplitude / (sample_index + decay)",
            variable_bindings: {
              expected: 1,
              amplitude: 0.08,
              decay: 3,
            },
            tolerance: 0.01,
            stable_window_size: 5,
            tick_rate_ms: 1000,
          },
        }
      : {}),
    ...(args.line_schema ? { line_schema: args.line_schema } : {}),
  };
}
