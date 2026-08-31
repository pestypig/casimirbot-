import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  resolveProfileOwnedMinecraftPlayerGameDirectory,
  resolveProfileOwnedMinecraftRunDirectory,
} from
  "../local-minecraft-run-profile-store";

describe("profile-owned local Minecraft run selection", () => {
  let root: string | null = null;
  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });
    root = null;
  });

  it("resolves the exact owner's validated player game directory", async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "minecraft-profile-store-"));
    const run = path.join(root, "combat-c0-server");
    const player = path.join(root, ".minecraft-helix-c0");
    await mkdir(path.join(run, "config"), { recursive: true });
    await writeFile(path.join(run, "server.properties"), "server-port=25566\n");
    await mkdir(path.join(player, "config"), { recursive: true });
    await mkdir(path.join(player, "mods"), { recursive: true });
    const store = path.join(root, "profiles.json");
    await writeFile(store, JSON.stringify({
      schema: "casimirbot.local_minecraft_run_profiles/2",
      profiles: [{
        owner_profile_id: "profile:owner",
        run_directory: run,
        player_game_directory: player,
        label: "C0 arena",
      }],
    }));
    await expect(resolveProfileOwnedMinecraftRunDirectory({
      ownerProfileId: "profile:owner",
      storePath: store,
    })).resolves.toBe(path.win32.resolve(run));
    await expect(resolveProfileOwnedMinecraftPlayerGameDirectory({
      ownerProfileId: "profile:owner",
      storePath: store,
    })).resolves.toBe(path.win32.resolve(player));
    await expect(resolveProfileOwnedMinecraftPlayerGameDirectory({
      ownerProfileId: "profile:other",
      storePath: store,
    })).resolves.toBeNull();
  });

  it("resolves only the exact owner's validated dedicated-server directory", async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "minecraft-profile-store-"));
    const run = path.join(root, "combat-c0-server");
    await mkdir(path.join(run, "config"), { recursive: true });
    await writeFile(path.join(run, "server.properties"), "server-port=25566\n");
    const store = path.join(root, "profiles.json");
    await writeFile(store, JSON.stringify({
      schema: "casimirbot.local_minecraft_run_profiles/1",
      profiles: [{
        owner_profile_id: "profile:owner",
        run_directory: run,
        label: "C0 arena",
      }],
    }));
    await expect(resolveProfileOwnedMinecraftRunDirectory({
      ownerProfileId: "profile:owner",
      storePath: store,
    })).resolves.toBe(path.win32.resolve(run));
    await expect(resolveProfileOwnedMinecraftRunDirectory({
      ownerProfileId: "profile:other",
      storePath: store,
    })).resolves.toBeNull();
  });
});
