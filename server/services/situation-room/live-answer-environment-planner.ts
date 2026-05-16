import type {
  LiveAnswerEnvironmentPreset,
  LiveAnswerLineDefinition,
} from "@shared/helix-live-answer-environment";
import { findLiveAnswerEnvironmentRecipe } from "@shared/helix-live-answer-recipes";
import { GENERIC_VISUAL_LIVE_LINE_SCHEMA } from "./live-line-schema-deriver";

const has = (transcript: string, pattern: RegExp): boolean => pattern.test(transcript);

export function isLiveAnswerEnvironmentIntent(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) return false;
  if (
    /\b(?:interval|cadence|rate|every\s+\d{1,3}\s*(?:second|seconds|sec|secs|s|minute|minutes|min|mins|m))\b/.test(normalized) &&
    /\b(?:visual|screen|frame|frames|capture|source|tab|window)\b/.test(normalized) &&
    !/\b(?:create|start|set\s+up|setup|make|open|enable|turn\s+on)\b[\s\S]{0,80}\blive\s+answer\s+environment\b/.test(normalized)
  ) {
    return false;
  }
  if (/\blive\s+answer\s+environment\b/.test(normalized)) {
    if (/\b(?:interpret|explain|summari[sz]e|read|review|status|current|currently|what|why|how)\b/.test(normalized)) {
      return false;
    }
    return /\b(?:create|start|set\s+up|setup|make|open|enable|turn\s+on|use)\b/.test(normalized);
  }
  if (/\bcreate\s+(?:a\s+)?live\b/.test(normalized) && /\b(?:environment|monitor|tracker|readout|artifact)\b/.test(normalized)) return true;
  if (/\b(?:start|watch|monitor|use|set\s+up|setup|create)\b[\s\S]{0,80}\b(?:screen\s*share|screen|window|tab|visual\s+source|visual\s+capture)\b/.test(normalized) && /\b(?:live|source|environment|interpretation|answer|monitor|watch)\b/.test(normalized)) return true;
  if (/\btrack\s+this\s+video\b/.test(normalized)) return true;
  if (/\bfollow\s+this\s+research\s+session\b/.test(normalized)) return true;
  if (/\bwatch\s+my\s+minecraft\s+run\b/.test(normalized)) return true;
  if (/\b(?:prime\s+number|next\s+primes|prime\s+generator|calculator\s+(?:series|stream)|live\s+prime)\b/.test(normalized)) return true;
  if (/\b(?:live\s+equation|equation\s+(?:interpreter|live\s+source)|explain\s+(?:this\s+)?equation)\b/.test(normalized)) return true;
  if (/\b(?:track|monitor|set\s+up).*?\b(?:simulation|residual|stability)\b/.test(normalized)) return true;
  if (/\bcreate\s+(?:a\s+)?live\s+.*\b(?:discord|minecraft|video|research|calculator|prime|simulation)\b/.test(normalized)) return true;
  return false;
}

export function isLiveCommentaryPolicyIntent(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) return false;
  return (
    /\b(?:enable|turn\s+on|start|set|use)\b.*\b(?:live\s+)?commentary\b/.test(normalized) ||
    /\b(?:talk|walk|narrate)\s+(?:me\s+)?through\b/.test(normalized) ||
    /\bcodex(?:-|\s*)style\s+(?:commentary|trace|thinking|progress)\b/.test(normalized) ||
    /\bcommentary\s+(?:on|for)\s+(?:this|the)\s+(?:live\s+)?(?:answer|environment|situation|stream)\b/.test(normalized)
  );
}

export function liveCommentaryRequestedForLiveEnvironment(transcript: string): boolean {
  return isLiveCommentaryPolicyIntent(transcript);
}

export function buildLiveCommentaryPolicyArgs(args: {
  transcript: string;
  threadId?: string | null;
  environmentId?: string | null;
}): Record<string, unknown> {
  const normalized = args.transcript.trim().toLowerCase();
  const cadence =
    /\b(?:debug|every\s+(?:step|tick)|continuous)\b/.test(normalized)
      ? "continuous_debug"
      : /\b(?:dialogue|talk|walk|codex|thinking|subgoals?)\b/.test(normalized)
        ? "active_dialogue"
        : /\b(?:window|periodic)\b/.test(normalized)
          ? "windowed_companion"
          : /\b(?:risk|anomaly|progress)\b/.test(normalized)
            ? "anomalies_and_milestones"
            : "milestones_only";
  return {
    thread_id: args.threadId ?? "helix-ask:desktop",
    ...(args.environmentId ? { environment_id: args.environmentId } : {}),
    cadence,
    status: /\b(?:pause|stop|off|silent)\b/.test(normalized) ? "paused" : "active",
    voice_mode: /\bvoice\s+on\s+confirm|confirm\s+(?:voice|speak|speaking)\b/.test(normalized)
      ? "voice_on_confirm"
      : /\bcritical\s+voice\b/.test(normalized)
        ? "critical_voice"
        : "text_only",
  };
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
  if (has(normalized, /\blive\s+equation|equation\s+(?:interpreter|live\s+source)|explain\s+(?:this\s+)?equation|equation.*big\s+picture\b/)) return "calculator_equation_interpreter";
  if (has(normalized, /\bphysics|simulation|residual|stability|stabilizes?|tolerance\b/)) return "physics_stability_tracker";
  if (has(normalized, /\bdiscord|call|speaker|interpreter|translation\b/)) return "discord_interpreter";
  if (has(normalized, /\bvideo|claim|evidence|contradiction|segment\b/)) return "browser_video_argument_tracker";
  if (has(normalized, /\bresearch|hypothesis|caveat|computation|paper\b/)) return "research_session";
  if (has(normalized, /\bminecraft|minehut|mine\s*hut|game|run\b/)) return "minecraft_run_monitor";
  return "custom";
}

const isWorldEventSourceMissing = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase();
  return (
    /\bvisual[-\s]?only\b/.test(normalized) ||
    /\b(?:do\s+not|don't|without|no)\b[\s\S]{0,80}\b(?:minecraft\s+)?(?:plugin|world[-\s]?event|server\s+log|server\s+source|minecraft\s+source)\b/.test(normalized) ||
    /\b(?:minecraft\s+)?(?:plugin|world[-\s]?event|server\s+log|server\s+source|minecraft\s+source)\b[\s\S]{0,80}\b(?:not\s+attached|missing|unavailable|inactive)\b/.test(normalized)
  );
};

export function inferLiveAnswerEnvironmentSourceArgs(transcript: string): {
  room_id?: string;
  source_ids?: string[];
  graph_id?: string;
  world_event_source_status?: "configured_missing";
  next_required_action?: string;
} {
  const preset = inferLiveAnswerEnvironmentPreset(transcript);
  if (preset === "custom" && /\b(?:screen\s*share|screen|window|tab|visual\s+source|visual\s+capture)\b/i.test(transcript)) {
    return {
      source_ids: [],
    };
  }
  if (preset === "minecraft_run_monitor") {
    if (isWorldEventSourceMissing(transcript)) {
      return {
        room_id: "room:minecraft-minehut",
        source_ids: [],
        world_event_source_status: "configured_missing",
        next_required_action: "attach_world_event_source",
      };
    }
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
  if (preset === "calculator_equation_interpreter") {
    return {
      source_ids: ["source:calculator-equation-live"],
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
  const visualGeneric =
    preset === "custom" &&
    /\b(?:screen\s*share|screen|window|tab|visual\s+source|visual\s+capture)\b/.test(normalized);
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
    ...(visualGeneric ? { line_schema: GENERIC_VISUAL_LIVE_LINE_SCHEMA } : {}),
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
