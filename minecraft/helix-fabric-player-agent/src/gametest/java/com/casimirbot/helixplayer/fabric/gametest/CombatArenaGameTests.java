package com.casimirbot.helixplayer.fabric.gametest;

import net.fabricmc.fabric.api.gametest.v1.GameTest;
import net.minecraft.core.BlockPos;
import net.minecraft.gametest.framework.GameTestHelper;
import net.minecraft.network.chat.Component;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.monster.Zombie;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.Blocks;

public final class CombatArenaGameTests {
    private static final String STRUCTURE =
        "helix_fabric_player_agent:c0_zombie_baseline_ring";

    @GameTest(structure = STRUCTURE, maxTicks = 40, skyAccess = false)
    public void c0ZombieFixtureHasOneEligibleOpponent(GameTestHelper helper) {
        buildRing(helper);
        Zombie zombie = spawnBaselineZombie(helper);

        helper.assertEntitiesPresent(EntityType.ZOMBIE, 1);
        helper.assertTrue(zombie instanceof Monster, Component.literal(
            "C0 primary entity must use vanilla hostile classification."
        ));
        helper.assertTrue(zombie.isAlive(), Component.literal(
            "C0 primary zombie must begin alive."
        ));
        helper.assertFalse(zombie.isBaby(), Component.literal(
            "C0 primary zombie must be an adult."
        ));
        helper.assertTrue(
            helper.getLevel().getEntitiesOfClass(Monster.class, helper.getBounds()).size() == 1,
            Component.literal("C0 must contain exactly one hostile entity.")
        );
        helper.assertTrue(
            helper.getLevel().getEntitiesOfClass(Projectile.class, helper.getBounds()).isEmpty(),
            Component.literal("C0 must contain no projectile source or projectile.")
        );
        for (EquipmentSlot slot : new EquipmentSlot[] {
            EquipmentSlot.HEAD,
            EquipmentSlot.CHEST,
            EquipmentSlot.LEGS,
            EquipmentSlot.FEET,
            EquipmentSlot.MAINHAND,
            EquipmentSlot.OFFHAND
        }) {
            helper.assertTrue(zombie.getItemBySlot(slot).isEmpty(), Component.literal(
                "C0 primary zombie must be unarmored and unarmed."
            ));
        }
        helper.succeed();
    }

    @GameTest(structure = STRUCTURE, maxTicks = 40, skyAccess = false)
    public void c0ZombieExposesVanillaHurtAndDeathLifecycle(GameTestHelper helper) {
        buildRing(helper);
        Zombie zombie = spawnBaselineZombie(helper);
        float initialHealth = zombie.getHealth();

        helper.hurt(zombie, helper.getLevel().damageSources().generic(), 3.0F);
        helper.assertTrue(zombie.getHealth() < initialHealth, Component.literal(
            "C0 must expose an authoritative vanilla health transition."
        ));
        helper.kill(zombie);
        helper.assertFalse(zombie.isAlive(), Component.literal(
            "C0 must expose the vanilla death lifecycle."
        ));
        helper.succeed();
    }

    private static Zombie spawnBaselineZombie(GameTestHelper helper) {
        Zombie zombie = helper.spawn(EntityType.ZOMBIE, new BlockPos(13, 1, 8));
        zombie.setBaby(false);
        zombie.setCanPickUpLoot(false);
        zombie.setPersistenceRequired();
        for (EquipmentSlot slot : new EquipmentSlot[] {
            EquipmentSlot.HEAD,
            EquipmentSlot.CHEST,
            EquipmentSlot.LEGS,
            EquipmentSlot.FEET,
            EquipmentSlot.MAINHAND,
            EquipmentSlot.OFFHAND
        }) {
            zombie.setItemSlot(slot, ItemStack.EMPTY);
        }
        return zombie;
    }

    private static void buildRing(GameTestHelper helper) {
        for (int x = 0; x <= 16; x++) {
            for (int z = 0; z <= 16; z++) {
                helper.setBlock(x, 0, z, Blocks.STONE);
                helper.setBlock(x, 6, z, Blocks.STONE);
            }
        }
        for (int y = 1; y < 6; y++) {
            for (int index = 0; index <= 16; index++) {
                helper.setBlock(0, y, index, Blocks.STONE);
                helper.setBlock(16, y, index, Blocks.STONE);
                helper.setBlock(index, y, 0, Blocks.STONE);
                helper.setBlock(index, y, 16, Blocks.STONE);
            }
        }
        helper.assertBlockPresent(Blocks.STONE, new BlockPos(8, 0, 8));
        helper.assertBlockPresent(Blocks.STONE, new BlockPos(0, 3, 8));
        helper.assertBlockPresent(Blocks.STONE, new BlockPos(8, 6, 8));
    }
}
