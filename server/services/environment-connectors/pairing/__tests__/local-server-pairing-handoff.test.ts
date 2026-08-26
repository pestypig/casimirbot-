import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  LocalServerPairingHandoffError,
  stageLocalMinecraftServerPairing,
} from "../local-server-pairing-handoff";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("local Fabric server pairing handoff", () => {
  it("atomically stages only the bounded server command in the fixed profile", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "helix-server-pairing-"));
    roots.push(root);

    await expect(
      stageLocalMinecraftServerPairing({
        workspaceRoot: root,
        command: "/helix pair Z4ZD-X2JJ",
      }),
    ).resolves.toEqual({ status: "server_pairing_inbox_staged" });

    await expect(
      readFile(
        path.join(
          root,
          "minecraft",
          "helix-fabric-sensor",
          "run",
          "config",
          "helix-fabric-sensor.pairing-inbox",
        ),
        "utf8",
      ),
    ).resolves.toBe("/helix pair Z4ZD-X2JJ");
  });

  it("rejects commands and player-pairing material", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "helix-server-pairing-"));
    roots.push(root);

    await expect(
      stageLocalMinecraftServerPairing({
        workspaceRoot: root,
        command: "/helix-player pair Z4ZD-X2JJ",
      }),
    ).rejects.toMatchObject<Partial<LocalServerPairingHandoffError>>({
      code: "local_server_pairing_command_invalid",
    });
  });
});
