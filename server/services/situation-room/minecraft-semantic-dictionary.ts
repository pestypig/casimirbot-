import crypto from "node:crypto";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
  HELIX_SITUATION_SEMANTIC_EVENT_SCHEMA,
  type SituationSemanticEvent,
  type SituationSemanticTag,
} from "@shared/helix-situation-semantics";
import type { SituationEventSignal } from "@shared/helix-situation-standby";

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key: string) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const readString = (value: unknown, keys: string[]): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const next = record[key];
    if (typeof next === "string" && next.trim()) return next.trim();
  }
  return null;
};

const readNumber = (value: unknown, keys: string[]): number | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const next = record[key];
    if (typeof next === "number" && Number.isFinite(next)) return next;
  }
  return null;
};

const minecraftLabel = (value: string | null): string | null =>
  value ? value.replace(/^minecraft:/, "").replace(/_/g, " ") : null;

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const directGoalCluesForItem = (item: string | null): string[] => {
  const normalized = item?.replace(/^minecraft:/, "") ?? "";
  if (/oak_log|spruce_log|birch_log|jungle_log|acacia_log|dark_oak_log|mangrove_log|cherry_log|crimson_stem|warped_stem/.test(normalized)) {
    return ["gather_wood", "craft_tools", "build_shelter"];
  }
  if (normalized.includes("blaze_rod")) return ["collect_blaze_rods", "brew_potions", "end_prep"];
  if (normalized.includes("string")) return ["collect_string", "craft_bow", "craft_bed"];
  if (normalized.includes("dirt") || normalized.includes("cobblestone")) return ["gather_building_blocks"];
  return normalized ? [`collect_${normalized}`] : [];
};

export function buildMinecraftSemanticEvent(args: {
  event: HelixWorldEvent;
  signal: SituationEventSignal;
}): SituationSemanticEvent {
  const { event, signal } = args;
  const actor = event.actor_label ?? event.actor_id ?? signal.actor ?? "Minecraft";
  const item = readString(event.inventory_delta, ["item", "item_id", "name"]);
  const objectiveLabel = readString(event.objective_delta, ["goal_label", "objective", "label"]);
  const objectiveStatus = readString(event.objective_delta, ["status"]);
  const currentHealth = readNumber(event.health_delta, ["current_health", "current", "health"]);
  const tags: SituationSemanticTag[] = [];
  const goalClues: string[] = [];
  const riskClues: string[] = [];
  let verb = "changed";
  let object: string | null = null;
  let narrativeTemplate = "{subject} changed state.";

  switch (event.event_type) {
    case "item_acquired":
      verb = "gathered";
      object = minecraftLabel(item) ?? "an item";
      tags.push("resource_gathering", "goal_progress");
      goalClues.push(...directGoalCluesForItem(item), ...(objectiveLabel ? [objectiveLabel] : []));
      narrativeTemplate = "{subject} gathered {object}.";
      break;
    case "player_damage":
    case "damage_taken":
      verb = "was hurt";
      object = currentHealth !== null ? `${currentHealth} health` : "damage";
      tags.push("risk", "combat");
      if (currentHealth !== null && currentHealth <= 6) riskClues.push("low_health");
      if (event.meta?.hostile_nearby === true) riskClues.push("hostile_nearby");
      if (event.meta?.lava_nearby === true) riskClues.push("lava_nearby");
      goalClues.push("survive");
      narrativeTemplate = "{subject} was hurt and may need to recover.";
      break;
    case "player_death":
      verb = "died";
      tags.push("risk", "combat", "goal_blocked");
      riskClues.push("death");
      goalClues.push("recover_items", "survive");
      narrativeTemplate = "{subject} died.";
      break;
    case "mob_nearby":
    case "hostile_nearby":
    case "creeper_fuse_started":
    case "explosion_imminent":
      verb = "faced a nearby threat";
      object = event.event_type === "creeper_fuse_started" ? "creeper fuse" : "hostile entity";
      tags.push("risk", "combat");
      riskClues.push(
        event.event_type === "explosion_imminent"
          ? "explosion_imminent"
          : event.event_type === "creeper_fuse_started"
            ? "creeper_fuse_started"
            : "hostile_nearby",
      );
      goalClues.push("survive");
      narrativeTemplate = "{subject} faced a nearby threat.";
      break;
    case "player_location_sample":
    case "player_location_changed":
    case "dimension_changed":
      verb = "moved";
      object = readString(event.location, ["dimension"]) ?? null;
      tags.push("travel");
      if (event.event_type === "dimension_changed") goalClues.push("reach_location");
      narrativeTemplate = "{subject} moved through the world.";
      break;
    case "block_placed":
      verb = "placed";
      object = minecraftLabel(readString(event.meta, ["block", "block_id"])) ?? "a block";
      tags.push("building");
      goalClues.push("build");
      narrativeTemplate = "{subject} placed {object}.";
      break;
    case "block_broken":
      verb = "broke";
      object = minecraftLabel(readString(event.meta, ["block", "block_id"])) ?? "a block";
      tags.push("resource_gathering", "exploration");
      narrativeTemplate = "{subject} broke {object}.";
      break;
    case "craft_item":
    case "item_crafted":
      verb = "crafted";
      object = minecraftLabel(item) ?? "an item";
      tags.push("crafting", "goal_progress");
      goalClues.push("craft_tools");
      narrativeTemplate = "{subject} crafted {object}.";
      break;
    case "objective_blocked":
      verb = "was blocked";
      object = objectiveLabel ?? "an objective";
      tags.push("goal_blocked");
      goalClues.push(objectiveLabel ?? "blocked_goal");
      narrativeTemplate = "{subject} appears blocked on {object}.";
      break;
    case "source_disconnected":
    case "plugin_disconnect":
    case "source_error":
      verb = "lost source connection";
      tags.push("source_health");
      riskClues.push("source_disconnected");
      narrativeTemplate = "The Minecraft bridge source disconnected.";
      break;
    case "advancement_unlocked":
    case "achievement_awarded":
      verb = "advanced";
      object = objectiveLabel ?? event.text ?? "an advancement";
      tags.push("goal_progress", "exploration");
      goalClues.push(objectiveLabel ?? "advancement_progress");
      narrativeTemplate = "{subject} made advancement progress.";
      break;
    default:
      if (objectiveStatus === "blocked") {
        verb = "was blocked";
        object = objectiveLabel ?? "an objective";
        tags.push("goal_blocked");
        goalClues.push(objectiveLabel ?? "blocked_goal");
      } else if (objectiveStatus === "completed" || objectiveStatus === "progress") {
        verb = "made progress";
        object = objectiveLabel ?? "an objective";
        tags.push("goal_progress");
        goalClues.push(objectiveLabel ?? "objective_progress");
      } else {
        tags.push("unknown");
      }
      break;
  }

  return {
    schema: HELIX_SITUATION_SEMANTIC_EVENT_SCHEMA,
    semantic_event_id: `semantic:${signal.room_id}:${hashShort([signal.signal_id, event.event_type], 14)}`,
    source_signal_id: signal.signal_id,
    room_id: signal.room_id,
    graph_id: signal.graph_id ?? null,
    world_id: event.world_id,
    actor_id: event.actor_id ?? null,
    event_type: event.event_type,
    subject: actor,
    verb,
    object,
    tags: unique(tags),
    goal_clues: unique(goalClues.filter(Boolean)),
    risk_clues: unique(riskClues.filter(Boolean)),
    narrative_template: narrativeTemplate,
    evidence_refs: signal.evidence_refs,
    ts: signal.ts,
  };
}
