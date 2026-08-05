import type {
  HelixEnvironmentCommandCategory,
  HelixEnvironmentCommandEffectClass,
} from "@shared/helix-environment-command";

export type MinecraftCommandRiskDeclaration = {
  category: HelixEnvironmentCommandCategory;
  effect: HelixEnvironmentCommandEffectClass;
};

const READ_ONLY_ROOTS = new Set(["help", "list", "locate", "seed"]);
const SERVER_ADMIN_ROOTS = new Set([
  "ban", "ban-ip", "banlist", "deop", "jfr", "kick", "op", "pardon",
  "pardon-ip", "perf", "publish", "reload", "save-all", "save-off",
  "save-on", "stop", "whitelist",
  // Server-originated communication is intentionally authority-scoped as
  // administration. It can address arbitrary players and must not fall
  // through to the unknown/mod-command category.
  "me", "msg", "playsound", "say", "stopsound", "tell", "tellraw", "title", "w",
]);
const PLAYER_INVENTORY_ROOTS = new Set(["clear", "give", "item", "loot", "recipe"]);
const PLAYER_MOVEMENT_ROOTS = new Set(["return", "spawnpoint", "spreadplayers", "teleport", "tp"]);
const PLAYER_STATE_ROOTS = new Set([
  "advancement", "attribute", "damage", "effect", "enchant", "experience",
  "gamemode", "kill", "spectate", "xp",
]);
const WORLD_TIME_WEATHER_ROOTS = new Set([
  "difficulty", "gamerule", "time", "weather", "worldborder",
]);
const WORLD_BUILD_ROOTS = new Set([
  "clone", "fill", "fillbiome", "forceload", "place", "setblock",
  "setworldspawn",
]);
const ENTITY_CONTROL_ROOTS = new Set([
  "bossbar", "ride", "summon", "tag", "team", "teammsg", "tm",
]);

const classifyKnownHelixGameplayCommand = (
  command: string,
): MinecraftCommandRiskDeclaration | null => {
  if (/^helixgame\s+(?:ping|checkpoint\s+status|fall_rescue\s+status)(?:\s|$)/u.test(command)) {
    return { category: "query", effect: "read_only" };
  }
  if (/^helixgame\s+checkpoint\s+restore(?:\s|$)/u.test(command)) {
    return { category: "world_build", effect: "world_mutation" };
  }
  if (/^helixgame\s+fall_rescue\s+(?:arm|disarm)(?:\s|$)/u.test(command)) {
    return { category: "world_build", effect: "world_mutation" };
  }
  if (/^helixgame\s+checkpoint\s+(?:capture|discard)(?:\s|$)/u.test(command)) {
    return {
      category: "server_administration",
      effect: "server_administration",
    };
  }
  return null;
};

/**
 * Canonicalize only syntactically unambiguous vanilla read forms. This is a
 * least-privilege correction for model-supplied risk labels; every command is
 * still independently parsed and classified by the live connector before it
 * can execute. Unknown and mutating forms deliberately remain unclassified.
 */
export const classifyKnownMinecraftReadOnlyCommand = (
  commandText: string,
): MinecraftCommandRiskDeclaration | null => {
  const command = commandText.trim().replace(/^\/+/, "").toLowerCase();
  if (!command) return null;
  const root = command.split(/\s+/u, 1)[0] ?? "";
  const runIndex = command.lastIndexOf(" run ");
  if (root === "execute" && runIndex >= 0) {
    return classifyKnownMinecraftReadOnlyCommand(
      command.slice(runIndex + " run ".length),
    );
  }
  const helixGameplay = classifyKnownHelixGameplayCommand(command);
  if (helixGameplay?.effect === "read_only") return helixGameplay;
  const readOnly =
    /^time\s+query(?:\s|$)/u.test(command) ||
    /^gamerule\s+\S+$/u.test(command) ||
    command === "difficulty" ||
    command === "worldborder get" ||
    command === "tick query" ||
    /^data\s+get(?:\s|$)/u.test(command) ||
    (
      root === "scoreboard" &&
      (command.includes(" players get ") || command.endsWith(" players list"))
    ) ||
    READ_ONLY_ROOTS.has(root);
  return readOnly ? { category: "query", effect: "read_only" } : null;
};

/**
 * Mirrors the connector's conservative vanilla-root classification so a
 * model's semantic description cannot cause a needless category mismatch.
 * Fabric still parses and independently classifies the exact command before
 * execution; unknown/mod roots deliberately retain the model declaration and
 * must match the live connector.
 */
export const classifyKnownMinecraftCommand = (
  commandText: string,
): MinecraftCommandRiskDeclaration | null => {
  const command = commandText.trim().replace(/^\/+/, "").toLowerCase();
  if (!command) return null;
  const root = command.split(/\s+/u, 1)[0] ?? "";
  const runIndex = command.lastIndexOf(" run ");
  if (root === "execute" && runIndex >= 0) {
    return classifyKnownMinecraftCommand(command.slice(runIndex + " run ".length));
  }
  const helixGameplay = classifyKnownHelixGameplayCommand(command);
  if (helixGameplay) return helixGameplay;
  const readOnly = classifyKnownMinecraftReadOnlyCommand(command);
  if (readOnly) return readOnly;
  if (SERVER_ADMIN_ROOTS.has(root)) {
    return { category: "server_administration", effect: "server_administration" };
  }
  if (PLAYER_INVENTORY_ROOTS.has(root)) {
    return { category: "player_inventory", effect: "player_mutation" };
  }
  if (PLAYER_MOVEMENT_ROOTS.has(root)) {
    return { category: "player_movement", effect: "player_mutation" };
  }
  if (PLAYER_STATE_ROOTS.has(root)) {
    return { category: "player_state", effect: "player_mutation" };
  }
  if (WORLD_TIME_WEATHER_ROOTS.has(root)) {
    return { category: "world_time_weather", effect: "world_mutation" };
  }
  if (WORLD_BUILD_ROOTS.has(root) || root === "data" || root === "scoreboard") {
    return { category: "world_build", effect: "world_mutation" };
  }
  if (ENTITY_CONTROL_ROOTS.has(root)) {
    return { category: "entity_control", effect: "world_mutation" };
  }
  return null;
};
