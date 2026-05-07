import type { HelixWorldEvent } from "@shared/helix-world-event";

export type MinecraftEventSalienceClass =
  | "projection_only"
  | "salience_candidate"
  | "debug_salience_candidate"
  | "source_health";

const readString = (value: unknown, key: string): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const next = (value as Record<string, unknown>)[key];
  return typeof next === "string" && next.trim() ? next.trim() : null;
};

const textHasSalienceCue = (text?: string | null): boolean => {
  const normalized = (text ?? "").toLowerCase();
  return /\b(?:helix|dottie|help|stuck|lost|where|what now|need|goal|danger|low health)\b/.test(normalized);
};

export function classifyMinecraftEventSalience(event: HelixWorldEvent): MinecraftEventSalienceClass {
  if (event.meta?.simulated === true || event.event_type.startsWith("eventtest_")) {
    return "debug_salience_candidate";
  }
  if (
    event.event_type === "source_disconnected" ||
    event.event_type === "plugin_disconnect" ||
    event.event_type === "source_error"
  ) {
    return "source_health";
  }
  if (event.event_type === "player_location_sample") return "projection_only";
  if (event.event_type === "player_join" || event.event_type === "player_leave") return "projection_only";
  if (event.event_type === "block_placed" || event.event_type === "block_broken") return "projection_only";
  if (event.event_type === "item_acquired" && !event.objective_delta) return "projection_only";
  if (event.event_type === "player_chat") {
    return textHasSalienceCue(event.text) ? "salience_candidate" : "projection_only";
  }
  if (
    event.event_type === "player_damage" ||
    event.event_type === "damage_taken" ||
    event.event_type === "player_death" ||
    event.event_type === "mob_nearby" ||
    event.event_type === "hostile_nearby" ||
    event.event_type === "creeper_fuse_started" ||
    event.event_type === "explosion_imminent" ||
    event.event_type === "achievement_awarded" ||
    event.event_type === "advancement_unlocked" ||
    event.event_type === "dimension_changed" ||
    event.event_type === "objective_blocked" ||
    readString(event.objective_delta, "status")
  ) {
    return "salience_candidate";
  }
  return "projection_only";
}

export function isLocationSalienceEnabled(): boolean {
  return process.env.HELIX_MINECRAFT_LOCATION_SALIENCE_ENABLED === "1";
}

export function getLocationMinSamples(): number {
  const parsed = Number(process.env.HELIX_MINECRAFT_LOCATION_MIN_SAMPLES);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 8;
}
