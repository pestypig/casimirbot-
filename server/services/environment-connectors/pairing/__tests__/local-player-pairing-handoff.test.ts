import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  LocalPlayerPairingHandoffError,
  stageLocalMinecraftPlayerPairing,
} from "../local-player-pairing-handoff";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) =>
    rm(root, { recursive: true, force: true })));
});

describe("local player pairing handoff", () => {
  it("atomically stages only the bounded client command", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "helix-player-pairing-"));
    roots.push(root);

    await expect(stageLocalMinecraftPlayerPairing({
      appDataPath: root,
      command: "/helix-player pair Z4ZD-X2JJ",
    })).resolves.toEqual({ status: "player_pairing_inbox_staged" });

    await expect(readFile(path.join(
      root,
      ".minecraft",
      "config",
      "helix-fabric-player-agent.pairing-inbox",
    ), "utf8")).resolves.toBe("/helix-player pair Z4ZD-X2JJ");
  });

  it("rejects actions and malformed pairing material", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "helix-player-pairing-"));
    roots.push(root);

    await expect(stageLocalMinecraftPlayerPairing({
      appDataPath: root,
      command: "/helix-player status",
    })).rejects.toMatchObject<Partial<LocalPlayerPairingHandoffError>>({
      code: "local_player_pairing_command_invalid",
    });
  });
});
