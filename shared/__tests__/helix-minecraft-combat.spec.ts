import { describe, expect, it } from "vitest";
import fixture from "../../scripts/fixtures/minecraft-combat-c0-zombie-baseline-v1.json";
import {
  helixMinecraftCombatArenaManifestSchema,
  helixMinecraftProjectileForecastSchema,
  isHelixMinecraftAttackEligibleTarget,
} from "../helix-minecraft-combat";

const hostileTarget = {
  target_ref: "target:trial-1:zombie-1",
  incarnation_ref: "entity:epoch-1:42",
  entity_type_id: "minecraft:zombie",
  classification: "hostile" as const,
  alive: true,
  targetable: true,
  line_of_sight: true,
  distance_blocks: 2.7,
  position: { x: 1, y: 64, z: 1 },
  velocity: { x: 0, y: 0, z: 0 },
  health: 20,
  max_health: 20,
  hurt_time_ticks: 0,
  death_time_ticks: 0,
  current_attacker_ref: null,
  last_damage_source_ref: null,
};

describe("Minecraft combat v1 contracts", () => {
  it("accepts the canonical C0 zombie arena manifest", () => {
    const parsed = helixMinecraftCombatArenaManifestSchema.parse(fixture);
    expect(parsed.tier).toBe("C0");
    expect(parsed.entities).toEqual([
      expect.objectContaining({
        entity_type_id: "minecraft:zombie",
        classification: "hostile",
        adult: true,
        armored: false,
        projectile_source: false,
        admitted_attack_target: true,
      }),
    ]);
  });

  it("rejects a C0 arena with a second or non-hostile target", () => {
    expect(helixMinecraftCombatArenaManifestSchema.safeParse({
      ...fixture,
      entities: [
        ...fixture.entities,
        { ...fixture.entities[0], label: "second_zombie" },
      ],
    }).success).toBe(false);
    expect(helixMinecraftCombatArenaManifestSchema.safeParse({
      ...fixture,
      entities: [{ ...fixture.entities[0], classification: "neutral" }],
    }).success).toBe(false);
  });

  it("admits only visible, living, targetable hostiles", () => {
    expect(isHelixMinecraftAttackEligibleTarget(hostileTarget)).toBe(true);
    expect(isHelixMinecraftAttackEligibleTarget({
      ...hostileTarget,
      classification: "friendly",
    })).toBe(false);
    expect(isHelixMinecraftAttackEligibleTarget({
      ...hostileTarget,
      line_of_sight: false,
    })).toBe(false);
    expect(isHelixMinecraftAttackEligibleTarget({
      ...hostileTarget,
      alive: false,
    })).toBe(false);
  });

  it("never labels an incomplete projectile forecast safe", () => {
    const forecast = {
      projectile_ref: "projectile:1",
      incarnation_ref: "entity:epoch-1:99",
      projectile_type_id: "minecraft:arrow",
      owner_ref: null,
      position: { x: 0, y: 65, z: 0 },
      velocity: { x: 1, y: 0, z: 0 },
      acceleration: { x: 0, y: -0.05, z: 0 },
      support_ticks: 20,
      predicted_collision_tick: null,
      predicted_impact_position: null,
      threat_classification: "safe" as const,
      evidence_complete: false,
      occluded: false,
    };
    expect(helixMinecraftProjectileForecastSchema.safeParse(forecast).success).toBe(false);
    expect(helixMinecraftProjectileForecastSchema.safeParse({
      ...forecast,
      threat_classification: "unknown",
    }).success).toBe(true);
  });
});
