import { beforeEach, describe, expect, it } from "vitest";
import playerOpened from "../../fixtures/environment-state/minecraft/player-equivalent-open-chest.snapshot.json";
import privilegedClosed from "../../fixtures/environment-state/minecraft/privileged-closed-chest.snapshot.json";
import rawNbtRejected from "../../fixtures/environment-state/minecraft/raw-nbt-rejected.snapshot.json";
import outOfOrder from "../../fixtures/environment-state/minecraft/out-of-order-tick.snapshot.json";
import {
  ingestMinecraftPluginSnapshot,
  normalizeMinecraftPluginSnapshot,
  resetMinecraftPluginSnapshotNormalizerForTest,
} from "../services/situation-room/minecraft-plugin-snapshot-normalizer";
import { auditEnvironmentSourceContract } from "../services/situation-room/environment-source-contract-validator";
import { resetEnvironmentStateSnapshotWindowsForTest } from "../services/situation-room/environment-state-snapshot-window";

describe("Minecraft plugin snapshot normalizer", () => {
  beforeEach(() => {
    resetMinecraftPluginSnapshotNormalizerForTest();
    resetEnvironmentStateSnapshotWindowsForTest();
  });

  it("preserves player memory and privileged server sensor scope", () => {
    const player = normalizeMinecraftPluginSnapshot({ snapshot: playerOpened });
    const privileged = normalizeMinecraftPluginSnapshot({ snapshot: privilegedClosed });

    expect(player?.object_state?.nearby_containers?.[0]?.sensor_scope).toBe("player_memory");
    expect(privileged?.object_state?.nearby_containers?.[0]?.sensor_scope).toBe("privileged_server_state");
  });

  it("keeps raw NBT quarantined by contract audit", () => {
    const snapshot = normalizeMinecraftPluginSnapshot({ snapshot: rawNbtRejected });
    const audit = auditEnvironmentSourceContract({ subject: rawNbtRejected });

    expect(snapshot).toBeNull();
    expect(audit.ok).toBe(false);
    expect(audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "raw_nbt_included" }),
      ]),
    );
  });

  it("suppresses out-of-order source ticks", () => {
    ingestMinecraftPluginSnapshot({ snapshot: { ...playerOpened, source_tick: 100 } });
    const result = ingestMinecraftPluginSnapshot({ snapshot: outOfOrder });

    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/out_of_order/i);
  });
});
