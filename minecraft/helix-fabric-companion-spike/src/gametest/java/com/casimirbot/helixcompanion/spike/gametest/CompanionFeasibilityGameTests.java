package com.casimirbot.helixcompanion.spike.gametest;

import com.casimirbot.helixcompanion.spike.CustomEntityMiningProbe;
import com.casimirbot.helixcompanion.spike.HelixCompanionSpikeMod;
import com.casimirbot.helixcompanion.spike.PlayerSemanticMiningProbe;
import com.casimirbot.helixcompanion.spike.SpikeCompanionEntity;
import net.fabricmc.fabric.api.gametest.v1.GameTest;
import net.minecraft.core.BlockPos;
import net.minecraft.gametest.framework.GameTestHelper;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.block.Blocks;

public final class CompanionFeasibilityGameTests {
    @GameTest(maxTicks = 40, skyAccess = false)
    public void s0CustomEntityHasOneBodyAndOneCanonicalInventory(GameTestHelper helper) {
        SpikeCompanionEntity companion = helper.spawn(
            HelixCompanionSpikeMod.SPIKE_COMPANION,
            new BlockPos(1, 1, 1)
        );
        companion.canonicalInventory().setItem(0, Items.WOODEN_PICKAXE.getDefaultInstance());

        helper.assertTrue(companion.isAlive(), Component.literal(
            "S0 custom companion must have one live visible body."
        ));
        helper.assertTrue(companion.canonicalInventory().getContainerSize() == 9, Component.literal(
            "S0 custom companion must expose one bounded canonical inventory."
        ));
        helper.assertTrue(
            companion.canonicalInventory().countItem(Items.WOODEN_PICKAXE) == 1,
            Component.literal("S0 canonical inventory must contain exactly one test tool.")
        );
        helper.succeed();
    }

    @GameTest(maxTicks = 40, skyAccess = false)
    public void s0CustomEntityBaselineDeclaresPlayerModifierGap(GameTestHelper helper) {
        BlockPos relative = new BlockPos(2, 1, 2);
        helper.setBlock(relative, Blocks.STONE);
        BlockPos absolute = helper.absolutePos(relative);

        CustomEntityMiningProbe.Result result = CustomEntityMiningProbe.baseline(
            helper.getLevel(),
            absolute,
            Items.WOODEN_PICKAXE.getDefaultInstance()
        );
        helper.assertTrue(result.correctToolForDrops(), Component.literal(
            "Wooden pickaxe must be harvest-eligible for stone in the baseline probe."
        ));
        helper.assertTrue(result.minimumTicks() > 1, Component.literal(
            "Candidate A must model progressive mining rather than instant removal."
        ));
        helper.assertFalse(result.playerModifiersSupported(), Component.literal(
            "Candidate A must expose, not conceal, its player-only modifier gap."
        ));
        helper.assertBlockPresent(Blocks.STONE, relative);
        helper.succeed();
    }

    @GameTest(maxTicks = 40, skyAccess = false)
    public void s0DetachedPlayerSemanticsProbeIsAccountIndependent(GameTestHelper helper) {
        helper.getLevel().setDefaultSpawnPos(new BlockPos(0, 80, 0), 0.0F);
        BlockPos relative = new BlockPos(3, 1, 3);
        helper.setBlock(relative, Blocks.STONE);
        BlockPos absolute = helper.absolutePos(relative);

        PlayerSemanticMiningProbe.Result result = PlayerSemanticMiningProbe.attempt(
            helper.getLevel().getServer(),
            helper.getLevel(),
            absolute,
            Items.WOODEN_PICKAXE.getDefaultInstance(),
            "gametest-companion-1",
            false
        );
        helper.assertFalse(result.networkConnectionPresent(), Component.literal(
            "S0 player-semantics subject must not synthesize a client connection."
        ));
        helper.assertTrue(result.vanillaProgressPerTick() > 0.0F, Component.literal(
            "Detached player semantics must expose vanilla progressive-mining calculation."
        ));
        helper.assertTrue(result.blockDestroyed(), Component.literal(
            "Candidate B must settle the normal server-player destruction pathway."
        ));
        helper.assertTrue(result.failureCode().equals("none"), Component.literal(
            "Candidate B must not hide a detached-player compatibility failure."
        ));
        helper.assertTrue(
            result.eventCounts().before() == 1
                && result.eventCounts().after() == 1
                && result.eventCounts().canceled() == 0,
            Component.literal("Candidate B must traverse before/after Fabric break hooks once.")
        );
        helper.assertBlockNotPresent(Blocks.STONE, relative);
        helper.succeed();
    }

    @GameTest(maxTicks = 40, skyAccess = false)
    public void s0DetachedPlayerSemanticsHonorsFabricCancellation(GameTestHelper helper) {
        helper.getLevel().setDefaultSpawnPos(new BlockPos(0, 80, 0), 0.0F);
        BlockPos relative = new BlockPos(3, 1, 3);
        helper.setBlock(relative, Blocks.STONE);
        BlockPos absolute = helper.absolutePos(relative);

        PlayerSemanticMiningProbe.Result result = PlayerSemanticMiningProbe.attempt(
            helper.getLevel().getServer(),
            helper.getLevel(),
            absolute,
            Items.WOODEN_PICKAXE.getDefaultInstance(),
            "gametest-companion-canceled",
            true
        );
        helper.assertFalse(result.blockDestroyed(), Component.literal(
            "A canceled companion break must not report destruction."
        ));
        helper.assertTrue(
            result.eventCounts().before() == 1
                && result.eventCounts().after() == 0
                && result.eventCounts().canceled() == 1,
            Component.literal(
                "Canceled break expected before/after/canceled=1/0/1 but observed "
                    + result.eventCounts().before() + "/"
                    + result.eventCounts().after() + "/"
                    + result.eventCounts().canceled()
                    + "; toolMayDestroy=" + result.toolMayDestroy()
                    + "; restricted=" + result.blockActionRestricted()
                    + "; failure=" + result.failureCode() + "."
            )
        );
        helper.assertTrue(
            result.toolDamageAfter() == result.toolDamageBefore(),
            Component.literal("Canceled break must not consume tool durability.")
        );
        helper.assertBlockPresent(Blocks.STONE, relative);
        helper.succeed();
    }
}
