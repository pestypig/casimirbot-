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

  it("preserves enriched nearby entity evidence without granting instruction authority", () => {
    const snapshot = normalizeMinecraftPluginSnapshot({
      snapshot: {
        ...playerOpened,
        object_state: {
          ...(playerOpened.object_state ?? {}),
          nearby_entities: [
            {
              object_ref: "entity:creeper",
              object_type: "minecraft:creeper",
              position: { x: 10, y: 64, z: 10 },
              velocity: { x: 0.1, y: 0, z: -0.2 },
              facing: "north",
              yaw: 180,
              pitch: 0,
              distance: 5,
              bounding_box: {
                min: { x: 9.7, y: 64, z: 9.7 },
                max: { x: 10.3, y: 65.8, z: 10.3 },
              },
              classification: ["hostile"],
              tags: ["hostile", "creeper"],
              state: { on_ground: true, fire_ticks: 0, passenger_count: 0 },
              living: { health: 20, max_health: 20, equipment_summary: [] },
              mob_ai: { target_ref: "entity:player", target_type: "minecraft:player", aware: true },
              threat: { threat_level: "warning", threat_reasons: ["hostile_entity", "close_range"] },
              evidence_trust: "server_observation",
              instruction_authority: "none",
              ask_context_policy: "evidence_only",
              raw_nbt_included: false,
              sensor_scope: "sensor_observable",
            },
          ],
        },
      },
    });

    const entity = snapshot?.object_state?.nearby_entities?.[0];
    expect(entity?.velocity).toEqual({ x: 0.1, y: 0, z: -0.2 });
    expect(entity?.classification).toContain("hostile");
    expect(entity?.threat?.threat_level).toBe("warning");
    expect(entity?.instruction_authority).toBe("none");
    expect(entity?.ask_context_policy).toBe("evidence_only");
    expect(entity?.raw_nbt_included).toBe(false);
  });
});
