import { describe, expect, it } from "vitest";

import {
  classifyKnownMinecraftCommand,
  classifyKnownMinecraftReadOnlyCommand,
} from "../minecraft-command-risk";

describe("Minecraft command risk canonicalization", () => {
  it.each([
    "time query daytime",
    "gamerule keepInventory",
    "difficulty",
    "worldborder get",
    "tick query",
    "data get entity @s Pos",
    "scoreboard players get @s deaths",
    "locate structure minecraft:stronghold",
    "execute as @a run time query gametime",
  ])("downgrades the unambiguous read form %s", (command) => {
    expect(classifyKnownMinecraftReadOnlyCommand(command)).toEqual({
      category: "query",
      effect: "read_only",
    });
  });

  it.each([
    "time set day",
    "gamerule keepInventory true",
    "data merge entity @s {NoGravity:1b}",
    "execute as @a run time set night",
    "some_mod custom subcommand",
  ])("does not relabel the mutating or unknown form %s", (command) => {
    expect(classifyKnownMinecraftReadOnlyCommand(command)).toBeNull();
  });

  it.each([
    ["whitelist list", "server_administration", "server_administration"],
    ["say Helix admin test", "server_administration", "server_administration"],
    ["tellraw @a {\"text\":\"Helix admin test\"}", "server_administration", "server_administration"],
    ["give @s minecraft:torch", "player_inventory", "player_mutation"],
    ["tp @s 0 80 0", "player_movement", "player_mutation"],
    ["effect clear @s", "player_state", "player_mutation"],
    ["time set day", "world_time_weather", "world_mutation"],
    ["setblock 0 80 0 minecraft:stone", "world_build", "world_mutation"],
    ["summon minecraft:pig", "entity_control", "world_mutation"],
    ["execute as @a run whitelist list", "server_administration", "server_administration"],
  ])("aligns the known vanilla command %s", (command, category, effect) => {
    expect(classifyKnownMinecraftCommand(command)).toEqual({ category, effect });
  });

  it("leaves unknown mod roots to the live connector", () => {
    expect(classifyKnownMinecraftCommand("some_mod custom subcommand")).toBeNull();
  });
});
